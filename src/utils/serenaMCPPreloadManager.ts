/**
 * SerenaMCP事前画像準備マネージャー
 * 雑学切り替え前に次の画像を確実に準備するシステム
 */

import type { TriviaItem, Location } from '../../types/trivia';
import { serenaMCPImageQueue } from './serenaMCPImageQueue';
import { SerenaMCPBeautifulImages } from './serenaMCPBeautifulImages';

interface PreloadTask {
  id: string;
  trivia: TriviaItem;
  location: Location;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'pending' | 'loading' | 'ready' | 'failed';
  imageUrls: string[];
  readyImages: HTMLImageElement[];
  startedAt: number;
  completedAt?: number;
}

interface PreloadMetrics {
  totalTasks: number;
  readyTasks: number;
  avgPreloadTime: number;
  successRate: number;
}

export class SerenaMCPPreloadManager {
  private static instance: SerenaMCPPreloadManager;
  private tasks: Map<string, PreloadTask> = new Map();
  private beautifulImageGenerator = SerenaMCPBeautifulImages.getInstance();
  private isEnabled = true;
  private maxConcurrentPreloads = 3;
  private currentPreloads = 0;

  public static getInstance(): SerenaMCPPreloadManager {
    if (!SerenaMCPPreloadManager.instance) {
      SerenaMCPPreloadManager.instance = new SerenaMCPPreloadManager();
    }
    return SerenaMCPPreloadManager.instance;
  }

  /**
   * 次の雑学のための画像を事前準備
   */
  async prepareNextTrivia(
    trivia: TriviaItem, 
    location: Location, 
    priority: 'critical' | 'high' | 'normal' | 'low' = 'critical'
  ): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('🚫 SerenaMCP: プリロード無効化中');
      return false;
    }

    const taskId = this.generateTaskId(trivia, location);
    
    // 既に準備済みかチェック
    const existingTask = this.tasks.get(taskId);
    if (existingTask?.status === 'ready') {
      console.log('✅ SerenaMCP: 既に準備済み', trivia.title);
      return true;
    }

    // 同時プリロード数制限
    if (this.currentPreloads >= this.maxConcurrentPreloads) {
      console.log('⏳ SerenaMCP: プリロード待機中（制限到達）');
      return false;
    }

    console.log('🎯 SerenaMCP: 事前画像準備開始', {
      title: trivia.title,
      location: location.name,
      priority
    });

    // 美しい画像URLリストを生成
    const imageUrls = this.beautifulImageGenerator.generateBeautifulImageUrls(
      trivia, 
      location, 
      { width: 1200, height: 800 }
    );

    const task: PreloadTask = {
      id: taskId,
      trivia,
      location,
      priority,
      status: 'pending',
      imageUrls,
      readyImages: [],
      startedAt: Date.now()
    };

    this.tasks.set(taskId, task);
    this.currentPreloads++;

    try {
      await this.executePreloadTask(task);
      return task.status === 'ready';
    } catch (error) {
      console.error('❌ SerenaMCP: プリロードエラー', error);
      task.status = 'failed';
      return false;
    } finally {
      this.currentPreloads--;
    }
  }

  /**
   * プリロードタスクを実行
   */
  private async executePreloadTask(task: PreloadTask): Promise<void> {
    task.status = 'loading';
    console.log('🔄 SerenaMCP: 画像読み込み開始', task.imageUrls.length, '個');

    // 最初の画像を優先的に読み込み、その他は並行処理
    const priorityUrl = task.imageUrls[0];
    const otherUrls = task.imageUrls.slice(1);

    try {
      // 🎯 最優先画像を確実に読み込み
      if (priorityUrl) {
        const priorityId = `${task.id}_priority`;
        const priorityElement = await serenaMCPImageQueue.enqueue(
          priorityId,
          priorityUrl,
          task.priority,
          { trivia: task.trivia, location: task.location }
        );
        
        // 画像が完全に読み込まれているか再確認
        if (priorityElement.complete && priorityElement.naturalWidth > 0) {
          task.readyImages.push(priorityElement);
          console.log('✅ SerenaMCP: 優先画像準備完了 (完全読み込み確認済み)');
        } else {
          console.warn('⚠️ SerenaMCP: 優先画像の完全読み込み確認失敗');
        }
      }

      // 残りの画像を並行処理（ベストエフォート）
      const otherPromises = otherUrls.map(async (url, index) => {
        try {
          const imageId = `${task.id}_${index + 1}`;
          const element = await serenaMCPImageQueue.enqueue(
            imageId,
            url,
            'normal', // 優先度を下げて並行処理
            { trivia: task.trivia, location: task.location }
          );
          
          if (element.complete && element.naturalWidth > 0) {
            task.readyImages.push(element);
            console.log('✅ SerenaMCP: 追加画像準備完了', `${index + 2}/${task.imageUrls.length}`);
          }
          
          return element;
        } catch (error) {
          console.warn('⚠️ SerenaMCP: 追加画像読み込み失敗', url, error);
          return null;
        }
      });

      // 他の画像は待たずに、タイムアウト付きで処理
      Promise.allSettled(otherPromises).then(() => {
        console.log('🔄 SerenaMCP: 全画像処理完了', task.trivia.title);
      });

    } catch (error) {
      console.error('❌ SerenaMCP: 優先画像読み込み失敗', error);
    }

    if (task.readyImages.length > 0) {
      task.status = 'ready';
      task.completedAt = Date.now();
      
      console.log('🎉 SerenaMCP: プリロード成功', {
        title: task.trivia.title,
        successCount: task.readyImages.length,
        totalCount: task.imageUrls.length,
        duration: task.completedAt - task.startedAt,
        hasPriorityImage: task.readyImages.length > 0
      });
    } else {
      task.status = 'failed';
      console.error('❌ SerenaMCP: 全画像読み込み失敗', task.trivia.title);
    }
  }

  /**
   * 準備済み画像を取得
   */
  getReadyImage(trivia: TriviaItem, location: Location): HTMLImageElement | null {
    const taskId = this.generateTaskId(trivia, location);
    const task = this.tasks.get(taskId);
    
    if (task?.status === 'ready' && task.readyImages.length > 0) {
      console.log('🖼️ SerenaMCP: 準備済み画像返却', task.trivia.title);
      return task.readyImages[0]; // 最初の成功画像を返す
    }
    
    return null;
  }

  /**
   * 準備済み画像URLを取得
   */
  getReadyImageUrl(trivia: TriviaItem, location: Location): string | null {
    const image = this.getReadyImage(trivia, location);
    return image ? image.src : null;
  }

  /**
   * 画像が完全に読み込まれており、即座に表示可能かチェック
   */
  isImageFullyLoaded(trivia: TriviaItem, location: Location): boolean {
    const taskId = this.generateTaskId(trivia, location);
    const task = this.tasks.get(taskId);
    
    if (task?.status === 'ready' && task.readyImages.length > 0) {
      // 画像要素が完全に読み込まれているかチェック
      const image = task.readyImages[0];
      return image.complete && image.naturalWidth > 0;
    }
    
    return false;
  }

  /**
   * 画像を事前準備し、完全に読み込まれるまで待機
   */
  async ensureImageFullyLoaded(
    trivia: TriviaItem, 
    location: Location, 
    priority: 'critical' | 'high' | 'normal' | 'low' = 'critical',
    timeoutMs: number = 8000
  ): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    
    // 既に完全に読み込まれているかチェック
    if (this.isImageFullyLoaded(trivia, location)) {
      const imageUrl = this.getReadyImageUrl(trivia, location);
      console.log('✅ SerenaMCP: 画像既に完全読み込み済み', trivia.title);
      return { success: true, imageUrl: imageUrl || undefined };
    }

    console.log('🎯 SerenaMCP: 画像完全読み込み開始', trivia.title);

    try {
      // タイムアウト付きで画像準備を実行
      const preparePromise = this.prepareNextTrivia(trivia, location, priority);
      
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeoutMs);
      });

      const success = await Promise.race([preparePromise, timeoutPromise]);

      if (success && this.isImageFullyLoaded(trivia, location)) {
        const imageUrl = this.getReadyImageUrl(trivia, location);
        console.log('✅ SerenaMCP: 画像完全読み込み成功', trivia.title);
        return { success: true, imageUrl: imageUrl || undefined };
      } else {
        console.warn('⚠️ SerenaMCP: 画像読み込み不完全', trivia.title);
        return { success: false, error: 'Image not fully loaded' };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ SerenaMCP: 画像完全読み込み失敗', trivia.title, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * プリロード状況をチェック
   */
  isReady(trivia: TriviaItem, location: Location): boolean {
    const taskId = this.generateTaskId(trivia, location);
    const task = this.tasks.get(taskId);
    return task?.status === 'ready' || false;
  }

  /**
   * プリロード進行中かチェック
   */
  isLoading(trivia: TriviaItem, location: Location): boolean {
    const taskId = this.generateTaskId(trivia, location);
    const task = this.tasks.get(taskId);
    return task?.status === 'loading' || false;
  }

  /**
   * 複数の雑学を一括事前準備
   */
  async preloadBatch(
    items: Array<{ trivia: TriviaItem; location: Location; priority?: 'critical' | 'high' | 'normal' | 'low' }>
  ): Promise<void> {
    console.log('🚀 SerenaMCP: バッチプリロード開始', items.length, '件');
    
    const promises = items.map(({ trivia, location, priority = 'normal' }) => 
      this.prepareNextTrivia(trivia, location, priority)
    );
    
    await Promise.allSettled(promises);
    console.log('🎉 SerenaMCP: バッチプリロード完了');
  }

  /**
   * タスクIDを生成
   */
  private generateTaskId(trivia: TriviaItem, location: Location): string {
    return `${trivia.id}_${location.id}`;
  }

  /**
   * 統計情報を取得
   */
  getMetrics(): PreloadMetrics {
    const tasks = Array.from(this.tasks.values());
    const readyTasks = tasks.filter(t => t.status === 'ready');
    const completedTasks = tasks.filter(t => t.completedAt);
    
    const avgPreloadTime = completedTasks.length > 0 
      ? completedTasks.reduce((sum, t) => sum + (t.completedAt! - t.startedAt), 0) / completedTasks.length
      : 0;

    return {
      totalTasks: tasks.length,
      readyTasks: readyTasks.length,
      avgPreloadTime,
      successRate: tasks.length > 0 ? readyTasks.length / tasks.length : 0
    };
  }

  /**
   * 古いタスクをクリーンアップ
   */
  cleanup(maxAge: number = 5 * 60 * 1000): void { // 5分
    const now = Date.now();
    let cleaned = 0;
    
    for (const [taskId, task] of this.tasks.entries()) {
      if (now - task.startedAt > maxAge) {
        this.tasks.delete(taskId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log('🧹 SerenaMCP: 古いタスククリーンアップ', cleaned, '件');
    }
  }

  /**
   * プリロードを有効/無効化
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log('⚙️ SerenaMCP: プリロード', enabled ? '有効' : '無効');
  }

  /**
   * 全タスクをクリア
   */
  clear(): void {
    this.tasks.clear();
    this.currentPreloads = 0;
    console.log('🗑️ SerenaMCP: 全タスククリア');
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo() {
    return {
      enabled: this.isEnabled,
      currentPreloads: this.currentPreloads,
      maxConcurrent: this.maxConcurrentPreloads,
      tasksCount: this.tasks.size,
      tasks: Array.from(this.tasks.values()).map(t => ({
        id: t.id,
        triviaTitle: t.trivia.title,
        locationName: t.location.name,
        status: t.status,
        readyImagesCount: t.readyImages.length,
        duration: t.completedAt ? t.completedAt - t.startedAt : Date.now() - t.startedAt
      }))
    };
  }
}

// シングルトンインスタンスをエクスポート
export const serenaMCPPreloadManager = SerenaMCPPreloadManager.getInstance();