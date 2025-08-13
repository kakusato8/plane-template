/**
 * SerenaMCPを利用した画像キューイングシステム
 * 画像の準備順序問題を解決し、効率的なプリロードを実現
 */

interface QueuedImage {
  id: string;
  url: string;
  tags: any;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'pending' | 'loading' | 'loaded' | 'error';
  loadedAt?: number;
  retryCount: number;
  element?: HTMLImageElement;
}

interface QueueMetrics {
  totalRequests: number;
  successful: number;
  failed: number;
  avgLoadTime: number;
  queueLength: number;
  activeLoading: number;
  // 詳細診断情報
  urlErrors: { [url: string]: number };
  successfulUrls: Set<string>;
  lastErrors: { url: string, error: string, timestamp: number }[];
}

class SerenaMCPImageQueue {
  private queue: Map<string, QueuedImage> = new Map();
  private loadingQueue: Set<string> = new Set();
  private priorityQueue: {
    critical: QueuedImage[],
    high: QueuedImage[],
    normal: QueuedImage[],
    low: QueuedImage[]
  } = { critical: [], high: [], normal: [], low: [] };
  
  private maxConcurrentLoads = 5;
  private maxRetries = 2;
  private timeout = 10000; // 10秒
  private loadTimes: number[] = [];
  private dynamicPriorityActive = false;
  private criticalFailures = 0;
  
  // 連続クリック防止用プロパティ
  private isProcessingQueue = false;
  private processingQueueCount = 0;
  
  // 画像診断・分析用
  private urlErrors: { [url: string]: number } = {};
  private successfulUrls: Set<string> = new Set();
  private lastErrors: { url: string, error: string, timestamp: number }[] = [];
  
  private listeners: Map<string, (image: QueuedImage) => void> = new Map();
  
  /**
   * SerenaMCP強化版: フォールバック付き画像キュー追加
   */
  enqueue(
    id: string, 
    url: string, 
    priority: QueuedImage['priority'] = 'normal',
    tags?: any
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      // 既に読み込み済みの場合は即座に返す
      const existing = this.queue.get(id);
      if (existing?.status === 'loaded' && existing.element) {
        console.log(`🎯 SerenaMCP: 既存の画像を返却 ${id}`);
        resolve(existing.element);
        return;
      }

      const queuedImage: QueuedImage = {
        id,
        url,
        tags,
        priority,
        status: 'pending',
        retryCount: 0
      };

      this.queue.set(id, queuedImage);
      this.priorityQueue[priority].push(queuedImage);
      
      // リスナー設定（フォールバック対応）
      this.listeners.set(id, (loadedImage) => {
        if (loadedImage.status === 'loaded' && loadedImage.element) {
          resolve(loadedImage.element);
        } else if (loadedImage.status === 'error') {
          // フォールバックを試行
          this.tryFallbackImage(id, url, priority, tags)
            .then(resolve)
            .catch(reject);
        }
      });

      console.log(`📝 SerenaMCP: キューに追加 ${id} (優先度: ${priority})`);
      
      // 即座に処理開始（並行実行防止付き）
      setTimeout(() => this.processQueue(), 0);
    });
  }
  
  /**
   * SerenaMCPフォールバック機能: 安全な画像に切り替え（白画面防止強化版）
   */
  private async tryFallbackImage(id: string, originalUrl: string, priority: QueuedImage['priority'], tags?: any): Promise<HTMLImageElement> {
    console.log(`🔄 SerenaMCP: フォールバック開始 ${id}`);
    
    // 確実に成功する画像URLを最優先に配置（白画面防止）
    const fallbackUrls = [
      // 最終フォールバック: 確実に表示されるSVGを最初に
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2NjdlZWEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPjwvc3ZnPg==',
      // その後に外部画像を試行
      'https://picsum.photos/id/1/1920/1080',   // 美しい風景
      'https://picsum.photos/id/10/1920/1080',  // 森林
      'https://picsum.photos/id/20/1920/1080',  // 空
      'https://picsum.photos/id/30/1920/1080',  // 海
      'https://picsum.photos/id/40/1920/1080'   // 山
    ];
    
    // SVGフォールバックは必ず最初に試行（白画面防止の最後の砦）
    try {
      console.log(`🛡️ SerenaMCP: 最優先SVGフォールバック試行 ${id}`);
      const svgElement = await this.loadSingleImageWithTimeout(fallbackUrls[0]);
      
      // 成功したフォールバック画像でキューを更新
      const queuedImage = this.queue.get(id);
      if (queuedImage) {
        queuedImage.url = fallbackUrls[0];
        queuedImage.status = 'loaded';
        queuedImage.element = svgElement;
        queuedImage.loadedAt = Date.now();
      }
      
      console.log(`✅ SerenaMCP: SVGフォールバック成功 ${id}`);
      return svgElement;
    } catch (error) {
      console.error(`❌ SerenaMCP: SVGフォールバックも失敗:`, error);
      // SVGも失敗した場合は、緊急Canvas要素を作成
      return this.createEmergencyCanvas(id);
    }
  }
  
  /**
   * 緊急時Canvas画像生成（最後の防御）
   */
  private createEmergencyCanvas(id: string): HTMLImageElement {
    console.log(`🆘 SerenaMCP: 緊急Canvas生成 ${id}`);
    
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;
    
    // グラデーション背景を描画
    const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1920, 1080);
    
    // 緊急メッセージを描画
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CurioCity', 960, 500);
    ctx.font = '24px Arial';
    ctx.fillText('画像を準備中...', 960, 580);
    
    // 緊急用の画像要素を作成
    const img = new Image();
    img.src = canvas.toDataURL();
    
    // キューを更新
    const queuedImage = this.queue.get(id);
    if (queuedImage) {
      queuedImage.url = img.src;
      queuedImage.status = 'loaded';
      queuedImage.element = img;
      queuedImage.loadedAt = Date.now();
    }
    
    console.log(`🛡️ SerenaMCP: 緊急Canvas完成 ${id}`);
    return img;
  }

  /**
   * 順序を保証したバッチ処理（白画面防止強化版）
   */
  async enqueueBatch(
    images: { id: string, url: string, priority: QueuedImage['priority'] }[]
  ): Promise<{ id: string, element?: HTMLImageElement, error?: Error }[]> {
    console.log(`📦 SerenaMCP: バッチ処理開始 ${images.length}件 (白画面防止強化版)`);
    
    // クリティカル画像は最優先で処理
    const criticalImages = images.filter(img => img.priority === 'critical');
    const otherImages = images.filter(img => img.priority !== 'critical');
    
    const results: { id: string, element?: HTMLImageElement, error?: Error }[] = [];
    
    // クリティカル画像を先に処理（順次実行で確実性重視）
    for (const image of criticalImages) {
      try {
        console.log(`🎯 SerenaMCP: クリティカル処理 ${image.id}`);
        const element = await this.enqueue(image.id, image.url, image.priority);
        results.push({ id: image.id, element });
        console.log(`⚡ SerenaMCP: クリティカル完了 ${image.id}`);
      } catch (error) {
        console.warn(`❌ SerenaMCP: クリティカル失敗 ${image.id}:`, error);
        results.push({ id: image.id, error: error as Error });
      }
    }
    
    // その他の画像は並行処理
    if (otherImages.length > 0) {
      const otherPromises = otherImages.map(async (image) => {
        try {
          const element = await this.enqueue(image.id, image.url, image.priority);
          return { id: image.id, element };
        } catch (error) {
          console.warn(`❌ SerenaMCP: 非クリティカル失敗 ${image.id}:`, error);
          return { id: image.id, error: error as Error };
        }
      });
      
      const otherResults = await Promise.all(otherPromises);
      results.push(...otherResults);
    }
    
    console.log(`🎉 SerenaMCP: バッチ処理完了 成功:${results.filter(r => r.element).length} 失敗:${results.filter(r => r.error).length}`);
    return results;
  }

  /**
   * キューの優先度付き処理（並行実行対策強化版）
   */
  private async processQueue(): Promise<void> {
    // 🛡️ SerenaMCP防御: 既に処理中の場合はスキップ
    if (this.isProcessingQueue) {
      this.processingQueueCount++;
      if (this.processingQueueCount % 10 === 0) { // 10回に1回ログ
        console.log(`🚫 SerenaMCP: processQueueスキップ (累計: ${this.processingQueueCount}回)`);
      }
      return;
    }
    
    // 🔒 処理中フラグを設定
    this.isProcessingQueue = true;
    
    try {
      // 同時読み込み数の制限を動的調整
      const maxLoads = this.dynamicPriorityActive ? 
        Math.min(8, this.maxConcurrentLoads + this.criticalFailures) : 
        this.maxConcurrentLoads;
        
      if (this.loadingQueue.size >= maxLoads) {
        return;
      }

      // 優先度順で次の画像を取得
      const nextImage = this.getNextPriorityImage();
      if (!nextImage || this.loadingQueue.has(nextImage.id)) {
        return;
      }

      await this.loadImage(nextImage);
      
    } finally {
      // 🔓 必ず処理中フラグを解除
      this.isProcessingQueue = false;
    }
    
    // 次の処理を継続（少し遅延させてCPU負荷を軽減）
    setTimeout(() => this.processQueue(), 10);
  }

  /**
   * 優先度付きの次の画像を取得（キューから削除）
   */
  private getNextPriorityImage(): QueuedImage | null {
    const priorities: (keyof typeof this.priorityQueue)[] = ['critical', 'high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const queue = this.priorityQueue[priority];
      const nextImageIndex = queue.findIndex(img => 
        img.status === 'pending' && 
        !this.loadingQueue.has(img.id)
      );
      
      if (nextImageIndex !== -1) {
        const nextImage = queue[nextImageIndex];
        // 処理対象になったらキューから削除
        queue.splice(nextImageIndex, 1);
        console.log(`📤 SerenaMCP: 優先度キューから取得・削除 ${nextImage.id} (${priority})`);
        return nextImage;
      }
    }
    return null;
  }

  /**
   * 画像の実際の読み込み処理
   */
  private async loadImage(queuedImage: QueuedImage): Promise<void> {
    const { id, url } = queuedImage;
    this.loadingQueue.add(id);
    queuedImage.status = 'loading';
    
    const startTime = Date.now();
    console.log(`🚀 SerenaMCP: 画像読み込み開始 ${id}`);

    try {
      const element = await this.loadSingleImageWithTimeout(url);
      const loadTime = Date.now() - startTime;
      
      queuedImage.status = 'loaded';
      queuedImage.element = element;
      queuedImage.loadedAt = Date.now();
      
      this.loadTimes.push(loadTime);
      if (this.loadTimes.length > 100) {
        this.loadTimes.shift(); // メモリ使用量制限
      }
      
      console.log(`✅ SerenaMCP: 画像読み込み完了 ${id} (${loadTime}ms)`);
      
      // クリティカルな画像が成功した場合、失敗カウンターをリセット
      if (queuedImage.priority === 'critical' && this.criticalFailures > 0) {
        this.criticalFailures = Math.max(0, this.criticalFailures - 1);
        console.log(`✨ SerenaMCP: クリティカル成功、失敗カウンターリセット: ${this.criticalFailures}`);
      }
      
      // リスナーに通知
      const listener = this.listeners.get(id);
      if (listener) {
        listener(queuedImage);
        this.listeners.delete(id);
      }
      
    } catch (error) {
      console.warn(`❌ SerenaMCP: 画像読み込み失敗 ${id}:`, error);
      
      if (queuedImage.retryCount < this.maxRetries) {
        queuedImage.retryCount++;
        queuedImage.status = 'pending';
        console.log(`🔄 SerenaMCP: リトライ ${id} (${queuedImage.retryCount}/${this.maxRetries})`);
        
        // 少し待ってからリトライ
        setTimeout(() => this.processQueue(), 1000 * queuedImage.retryCount);
      } else {
        queuedImage.status = 'error';
        
        // クリティカルな画像の失敗をカウント
        if (queuedImage.priority === 'critical') {
          this.criticalFailures++;
          console.log(`🚨 SerenaMCP: クリティカル失敗数: ${this.criticalFailures} (${id})`);
        }
        
        console.error(`🚨 SerenaMCP: 終的失敗 ${id} -> フォールバックを試行します`);
        
        const listener = this.listeners.get(id);
        if (listener) {
          listener(queuedImage);
          this.listeners.delete(id);
        }
      }
    } finally {
      this.loadingQueue.delete(id);
    }
  }

  /**
   * SerenaMCP強化版: 詳細診断付き画像読み込み
   */
  private loadSingleImageWithTimeout(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      console.log(`🔍 SerenaMCP: 画像ロード試行 ${url}`);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        const error = `Timeout after ${this.timeout}ms`;
        this.recordImageError(url, error);
        console.warn(`⏰ SerenaMCP: タイムアウト ${url}`);
        reject(new Error(`Image load timeout: ${url}`));
      }, this.timeout);
      
      img.onload = () => {
        clearTimeout(timeout);
        this.recordImageSuccess(url);
        console.log(`✅ SerenaMCP: 画像ロード成功 ${url}`);
        resolve(img);
      };
      
      img.onerror = (event) => {
        clearTimeout(timeout);
        const error = `Network/CORS error`;
        this.recordImageError(url, error);
        console.error(`❌ SerenaMCP: 画像ロードエラー ${url}:`, event);
        reject(new Error(`Image load error: ${url}`));
      };
      
      img.src = url;
    });
  }
  
  /**
   * 画像ロード成功を記録
   */
  private recordImageSuccess(url: string): void {
    this.successfulUrls.add(url);
    // エラー履歴から削除
    if (this.urlErrors[url]) {
      delete this.urlErrors[url];
    }
  }
  
  /**
   * 画像ロードエラーを記録・分析
   */
  private recordImageError(url: string, error: string): void {
    this.urlErrors[url] = (this.urlErrors[url] || 0) + 1;
    
    this.lastErrors.push({
      url,
      error,
      timestamp: Date.now()
    });
    
    // 最新20件のエラーのみ保持
    if (this.lastErrors.length > 20) {
      this.lastErrors.shift();
    }
    
    console.warn(`🚨 SerenaMCP: エラー記録 ${url} (${this.urlErrors[url]}回目): ${error}`);
  }

  /**
   * 特定の画像の状態を取得
   */
  getImageStatus(id: string): QueuedImage | null {
    return this.queue.get(id) || null;
  }

  /**
   * 画像の準備完了状況を予測
   */
  predictImageReadiness(ids: string[]): { id: string, readyIn: number, status: string }[] {
    return ids.map(id => {
      const image = this.queue.get(id);
      if (!image) {
        return { id, readyIn: -1, status: 'not_queued' };
      }
      if (image.status === 'loaded') {
        return { id, readyIn: 0, status: 'ready' };
      }
      if (image.status === 'loading') {
        return { id, readyIn: this.getEstimatedWaitTime(image.priority), status: 'loading' };
      }
      if (image.status === 'error') {
        return { id, readyIn: -1, status: 'failed' };
      }
      return { id, readyIn: this.getEstimatedWaitTime(image.priority), status: 'pending' };
    });
  }

  /**
   * 次の画像群が準備できるまでの時間を予測
   */
  predictBatchReadiness(startIndex: number, count: number, generateId: (index: number) => string): {
    allReady: boolean,
    maxWaitTime: number,
    details: { index: number, id: string, readyIn: number, status: string }[]
  } {
    const details: { index: number, id: string, readyIn: number, status: string }[] = [];
    let maxWaitTime = 0;
    let allReady = true;
    
    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      const id = generateId(index);
      const prediction = this.predictImageReadiness([id])[0];
      
      details.push({
        index,
        id: prediction.id,
        readyIn: prediction.readyIn,
        status: prediction.status
      });
      
      if (prediction.readyIn > 0) {
        allReady = false;
        maxWaitTime = Math.max(maxWaitTime, prediction.readyIn);
      }
    }
    
    return { allReady, maxWaitTime, details };
  }

  /**
   * キューの状態取得
   */
  getMetrics(): QueueMetrics {
    const all = Array.from(this.queue.values());
    const successful = all.filter(img => img.status === 'loaded').length;
    const failed = all.filter(img => img.status === 'error').length;
    const avgLoadTime = this.loadTimes.length > 0 
      ? this.loadTimes.reduce((a, b) => a + b, 0) / this.loadTimes.length 
      : 0;

    return {
      totalRequests: all.length,
      successful,
      failed,
      avgLoadTime: Math.round(avgLoadTime),
      queueLength: all.filter(img => img.status === 'pending').length,
      activeLoading: this.loadingQueue.size,
      // 詳細診断情報
      urlErrors: {...this.urlErrors},
      successfulUrls: new Set(this.successfulUrls),
      lastErrors: [...this.lastErrors]
    };
  }

  /**
   * 優先度別の待機時間予測
   */
  getEstimatedWaitTime(priority: QueuedImage['priority']): number {
    const avgLoadTime = this.getMetrics().avgLoadTime || 2000;
    const pendingHigher = this.getPendingCountByPriority(priority);
    return Math.ceil((pendingHigher * avgLoadTime) / this.maxConcurrentLoads);
  }

  private getPendingCountByPriority(targetPriority: QueuedImage['priority']): number {
    const priorities = { critical: 0, high: 1, normal: 2, low: 3 };
    const targetLevel = priorities[targetPriority];
    
    let count = 0;
    Object.entries(this.priorityQueue).forEach(([priority, queue]) => {
      if (priorities[priority as keyof typeof priorities] <= targetLevel) {
        count += queue.filter(img => img.status === 'pending').length;
      }
    });
    
    return count;
  }

  /**
   * 動的優先度モードの切り替え
   */
  setDynamicPriorityMode(active: boolean): void {
    this.dynamicPriorityActive = active;
    if (active) {
      console.log('🚀 SerenaMCP: 動的優先度モードを有効化');
    } else {
      console.log('😴 SerenaMCP: 動的優先度モードを無効化');
      this.criticalFailures = 0;
    }
  }
  
  /**
   * キューのクリア
   */
  clear(): void {
    this.queue.clear();
    this.loadingQueue.clear();
    this.priorityQueue = { critical: [], high: [], normal: [], low: [] };
    this.listeners.clear();
    this.loadTimes = [];
    this.criticalFailures = 0;
    this.dynamicPriorityActive = false;
    this.urlErrors = {};
    this.successfulUrls.clear();
    this.lastErrors = [];
    console.log('🧹 SerenaMCP: キューをクリア（診断情報も初期化）');
  }

  /**
   * デバッグ情報の取得
   */
  getDebugInfo(): any {
    return {
      metrics: this.getMetrics(),
      queue: Object.fromEntries(
        Array.from(this.queue.entries()).map(([id, img]) => [
          id, 
          {
            status: img.status,
            priority: img.priority,
            retryCount: img.retryCount,
            loadedAt: img.loadedAt,
            url: img.url.substring(0, 50) + '...'
          }
        ])
      ),
      priorityQueues: Object.fromEntries(
        Object.entries(this.priorityQueue).map(([priority, queue]) => [
          priority,
          queue.map(img => ({ id: img.id, status: img.status }))
        ])
      ),
      activeLoading: Array.from(this.loadingQueue),
      avgLoadTimes: this.loadTimes.slice(-10), // 直近10件
      systemHealth: {
        memoryPressure: this.queue.size > 50,
        loadingEfficiency: this.loadTimes.length > 0 ? 
          this.loadTimes.filter(t => t < 3000).length / this.loadTimes.length : 1,
        queueBacklog: this.getPendingCountByPriority('low')
      }
    };
  }
}

// シングルトンインスタンス
export const serenaMCPImageQueue = new SerenaMCPImageQueue();

// グローバル画像準備状況の監視
if (typeof window !== 'undefined') {
  // 開発環境でのグローバルアクセス
  (window as any).serenaMCPDebug = {
    queue: serenaMCPImageQueue,
    metrics: () => serenaMCPImageQueue.getMetrics(),
    debug: () => serenaMCPImageQueue.getDebugInfo(),
    predict: (ids: string[]) => serenaMCPImageQueue.predictImageReadiness(ids)
  };
}

export default serenaMCPImageQueue;