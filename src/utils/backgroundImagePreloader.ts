/**
 * 高度な背景画像プリローダーシステム
 * 予測的事前取得・キャッシュ・フォールバック機能を提供
 */

import { ImageMemoryCache } from './imageMemoryCache';
import { ImagePredictionEngine } from './imagePredictionEngine';
import { ImageOptimizer } from './imageOptimizer';
import type { TriviaItem, Location, UserChoice } from '../../types/trivia';

interface PreloadRequest {
  id: string;
  imageUrl: string;
  trivia: TriviaItem;
  location: Location;
  priority: 'critical' | 'high' | 'normal' | 'low';
  timestamp: number;
  retries: number;
}

interface PreloadResult {
  success: boolean;
  imageUrl: string;
  loadTime: number;
  fromCache: boolean;
  error?: string;
}

interface NetworkCondition {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

interface PreloadStats {
  totalRequests: number;
  successfulLoads: number;
  cacheHits: number;
  avgLoadTime: number;
  networkOptimizations: number;
  failoverUses: number;
}

export class BackgroundImagePreloader {
  private static instance: BackgroundImagePreloader;
  private cache: ImageMemoryCache;
  private predictionEngine: ImagePredictionEngine;
  private preloadQueue: Map<string, PreloadRequest> = new Map();
  private activeRequests: Set<string> = new Set();
  private stats: PreloadStats = {
    totalRequests: 0,
    successfulLoads: 0,
    cacheHits: 0,
    avgLoadTime: 0,
    networkOptimizations: 0,
    failoverUses: 0
  };

  // フォールバック画像（Base64エンコード済み低品質プレースホルダー）
  private readonly fallbackImages: Record<string, string> = {
    mystical: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyADwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6ZooAKACgAoAKACgAoAKACgAoAKACgAoAKACgD//Z',
    romantic: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyADwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6ZooAKACgAoAKACgAoAKACgAoAKACgAoAKACgD//Z',
    epic: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAyADwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6ZooAKACgAoAKACgAoAKACgAoAKACgAoAKACgD//Z'
  };

  private constructor(cache?: ImageMemoryCache) {
    this.cache = cache || new ImageMemoryCache();
    this.predictionEngine = ImagePredictionEngine.getInstance();
    this.setupNetworkMonitoring();
    this.startPeriodicCleanup();
  }

  public static getInstance(): BackgroundImagePreloader {
    if (!BackgroundImagePreloader.instance) {
      BackgroundImagePreloader.instance = new BackgroundImagePreloader();
    }
    return BackgroundImagePreloader.instance;
  }

  /**
   * ネットワーク状況の監視を開始
   */
  private setupNetworkMonitoring(): void {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as unknown as { connection?: any }).connection;
      if (connection) {
        connection.addEventListener('change', () => {
          this.adjustPreloadStrategy();
        });
      }
    }
  }

  /**
   * 定期的なクリーンアップの開始
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cache.autoCleanup();
      this.cleanupExpiredRequests();
    }, 5 * 60 * 1000); // 5分ごと
  }

  /**
   * ネットワーク状況を取得
   */
  private getNetworkCondition(): NetworkCondition {
    const connection = (navigator as unknown as { connection?: any })?.connection;
    return {
      effectiveType: connection?.effectiveType || '4g',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 50,
      saveData: connection?.saveData || false
    };
  }

  /**
   * ネットワーク状況に応じてプリロード戦略を調整
   */
  private adjustPreloadStrategy(): void {
    const network = this.getNetworkCondition();
    
    if (network.saveData || network.effectiveType === 'slow-2g') {
      // 低速・データ節約モードでは積極的プリロードを無効化
      this.clearLowPriorityQueue();
    } else if (network.effectiveType === '2g') {
      // 2Gでは重要な画像のみプリロード
      this.clearNormalPriorityQueue();
    }
  }

  /**
   * メイン画像プリロード機能
   */
  async preloadImage(
    imageUrl: string, 
    trivia: TriviaItem, 
    location: Location, 
    priority: 'critical' | 'high' | 'normal' | 'low' = 'normal'
  ): Promise<PreloadResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId(imageUrl, trivia.id, location.id);

    // キャッシュから確認
    if (this.cache.has(imageUrl)) {
      this.stats.cacheHits++;
      return {
        success: true,
        imageUrl,
        loadTime: Date.now() - startTime,
        fromCache: true
      };
    }

    // 既にアクティブなリクエストがある場合は待機
    if (this.activeRequests.has(requestId)) {
      return this.waitForActiveRequest(requestId, startTime);
    }

    // リクエストを登録
    const request: PreloadRequest = {
      id: requestId,
      imageUrl,
      trivia,
      location,
      priority,
      timestamp: Date.now(),
      retries: 0
    };

    this.preloadQueue.set(requestId, request);
    this.activeRequests.add(requestId);
    
    try {
      const result = await this.performPreload(request);
      this.stats.successfulLoads++;
      return result;
    } catch (error) {
      return await this.handlePreloadFailure(request, error as Error, startTime);
    } finally {
      this.activeRequests.delete(requestId);
      this.preloadQueue.delete(requestId);
      this.stats.totalRequests++;
    }
  }

  /**
   * 複数画像の並列プリロード
   */
  async preloadBatch(
    predictions: Array<{
      imageUrl: string;
      trivia: TriviaItem;
      location: Location;
      priority: 'critical' | 'high' | 'normal' | 'low';
    }>,
    maxConcurrent: number = 3
  ): Promise<PreloadResult[]> {
    const network = this.getNetworkCondition();
    
    // ネットワーク状況に応じて同時実行数を調整
    if (network.effectiveType === 'slow-2g' || network.saveData) {
      maxConcurrent = 1;
    } else if (network.effectiveType === '2g') {
      maxConcurrent = 2;
    }

    // 優先度順にソート
    const sortedPredictions = predictions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const results: PreloadResult[] = [];
    const executing: Promise<PreloadResult>[] = [];

    for (const pred of sortedPredictions) {
      const promise = this.preloadImage(
        pred.imageUrl, 
        pred.trivia, 
        pred.location, 
        pred.priority
      );
      
      executing.push(promise);
      
      // 同時実行数の制限
      if (executing.length >= maxConcurrent) {
        const result = await Promise.race(executing);
        results.push(result);
        const index = executing.findIndex(p => p === Promise.resolve(result));
        if (index !== -1) {
          executing.splice(index, 1);
        }
      }
    }

    // 残りのリクエストを待機
    const remainingResults = await Promise.all(executing);
    results.push(...remainingResults);

    return results;
  }

  /**
   * 実際のプリロード処理
   */
  private async performPreload(request: PreloadRequest): Promise<PreloadResult> {
    const startTime = Date.now();
    const network = this.getNetworkCondition();
    
    let optimizedUrl = request.imageUrl;

    // ネットワーク状況に応じて画像を最適化
    if (network.saveData || network.effectiveType === 'slow-2g') {
      const size = ImageOptimizer.getOptimalImageSize();
      optimizedUrl = ImageOptimizer.generateResponsiveImageUrl(
        request.imageUrl, 
        Math.round(size.width * 0.5), // サイズを50%に削減
        60 // 品質を下げる
      );
      this.stats.networkOptimizations++;
    } else {
      const size = ImageOptimizer.getOptimalImageSize();
      optimizedUrl = ImageOptimizer.generateResponsiveImageUrl(
        request.imageUrl,
        size.width,
        request.priority === 'critical' ? 90 : 80
      );
    }

    // 画像を作成してロード
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      const timeout = this.getTimeoutForPriority(request.priority);
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout after ${timeout}ms`));
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        
        // キャッシュに保存
        this.cache.set(request.imageUrl, img, request.priority);
        
        resolve({
          success: true,
          imageUrl: request.imageUrl,
          loadTime: Date.now() - startTime,
          fromCache: false
        });
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Image load failed'));
      };

      // クロスオリジン対応
      img.crossOrigin = 'anonymous';
      img.src = optimizedUrl;
    });
  }

  /**
   * プリロード失敗時の処理
   */
  private async handlePreloadFailure(
    request: PreloadRequest, 
    error: Error, 
    startTime: number
  ): Promise<PreloadResult> {
    console.warn(`Preload failed for ${request.imageUrl}:`, error.message);

    // リトライ処理
    if (request.retries < 2) {
      request.retries++;
      await new Promise(resolve => setTimeout(resolve, 1000 * request.retries));
      
      try {
        return await this.performPreload(request);
      } catch {
        // 最終的にフォールバックを使用
        return this.useFallbackImage(request, startTime);
      }
    }

    return this.useFallbackImage(request, startTime);
  }

  /**
   * フォールバック画像を使用
   */
  private useFallbackImage(request: PreloadRequest, startTime: number): PreloadResult {
    const fallbackKey = this.selectFallbackImage(request.trivia);
    const fallbackUrl = this.fallbackImages[fallbackKey];
    
    // フォールバック画像をキャッシュに保存
    const img = new Image();
    img.src = fallbackUrl;
    this.cache.set(request.imageUrl, img, 'low');
    this.stats.failoverUses++;

    return {
      success: true,
      imageUrl: fallbackUrl,
      loadTime: Date.now() - startTime,
      fromCache: false,
      error: 'Used fallback image'
    };
  }

  /**
   * 雑学に適したフォールバック画像を選択
   */
  private selectFallbackImage(trivia: TriviaItem): string {
    if (trivia.tags.emotion.includes('ミステリアス')) return 'mystical';
    if (trivia.tags.emotion.includes('ロマンチック')) return 'romantic';
    if (trivia.tags.emotion.includes('エピック')) return 'epic';
    return 'mystical'; // デフォルト
  }

  /**
   * 優先度に応じたタイムアウト時間を取得
   */
  private getTimeoutForPriority(priority: string): number {
    switch (priority) {
      case 'critical': return 15000; // 15秒
      case 'high': return 10000;     // 10秒  
      case 'normal': return 8000;    // 8秒
      case 'low': return 5000;       // 5秒
      default: return 8000;
    }
  }

  /**
   * スマート予測プリロード
   */
  async predictivePreload(
    currentTrivia: TriviaItem,
    currentLocation: Location,
    visitedTriviaIds: number[],
    visitedLocationIds: string[],
    recentChoices: UserChoice[],
    availableTrivia: TriviaItem[],
    availableLocations: Location[]
  ): Promise<void> {
    const network = this.getNetworkCondition();
    
    // データ節約モードでは予測プリロードをスキップ
    if (network.saveData) return;

    const predictionContext = {
      currentTrivia,
      currentLocation,
      visitedTriviaIds,
      visitedLocationIds,
      recentChoices,
      userPreferences: this.predictionEngine.getAnalytics().userProfile
    };

    const predictions = this.predictionEngine.predictNextImages(
      predictionContext,
      availableTrivia,
      availableLocations
    );

    // ネットワーク状況に応じてプリロード数を調整
    let maxPredictions = 5;
    if (network.effectiveType === '3g') maxPredictions = 3;
    if (network.effectiveType === '2g') maxPredictions = 1;

    const topPredictions = predictions
      .slice(0, maxPredictions)
      .map(p => ({
        imageUrl: p.imageUrl,
        trivia: p.trivia,
        location: p.location,
        priority: p.priority
      }));

    // ネットワーク状況に応じて同時実行数を調整（より積極的に）
    let concurrency = 4; // デフォルト4並列
    if (network.effectiveType === '4g') concurrency = 6;
    if (network.effectiveType === '3g') concurrency = 3;
    if (network.effectiveType === '2g') concurrency = 2;
    
    await this.preloadBatch(topPredictions, concurrency);
  }

  /**
   * アクティブなリクエストの完了を待機
   */
  private async waitForActiveRequest(requestId: string, startTime: number): Promise<PreloadResult> {
    const maxWaitTime = 10000; // 10秒
    const pollInterval = 100;   // 100ms
    let elapsed = 0;

    while (elapsed < maxWaitTime && this.activeRequests.has(requestId)) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsed += pollInterval;

      // リクエストが完了した場合はキャッシュから取得
      const request = this.preloadQueue.get(requestId);
      if (request && this.cache.has(request.imageUrl)) {
        return {
          success: true,
          imageUrl: request.imageUrl,
          loadTime: Date.now() - startTime,
          fromCache: true
        };
      }
    }

    // タイムアウト
    return {
      success: false,
      imageUrl: '',
      loadTime: Date.now() - startTime,
      fromCache: false,
      error: 'Wait timeout'
    };
  }

  /**
   * リクエストIDを生成
   */
  private generateRequestId(imageUrl: string, triviaId: number, locationId: string): string {
    return `${imageUrl}-${triviaId}-${locationId}`;
  }

  /**
   * 期限切れリクエストのクリーンアップ
   */
  private cleanupExpiredRequests(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10分

    for (const [id, request] of this.preloadQueue) {
      if (now - request.timestamp > maxAge) {
        this.preloadQueue.delete(id);
        this.activeRequests.delete(id);
      }
    }
  }

  /**
   * 低優先度キューをクリア
   */
  private clearLowPriorityQueue(): void {
    for (const [id, request] of this.preloadQueue) {
      if (request.priority === 'low') {
        this.preloadQueue.delete(id);
        this.activeRequests.delete(id);
      }
    }
  }

  /**
   * 通常優先度以下のキューをクリア
   */
  private clearNormalPriorityQueue(): void {
    for (const [id, request] of this.preloadQueue) {
      if (request.priority === 'normal' || request.priority === 'low') {
        this.preloadQueue.delete(id);
        this.activeRequests.delete(id);
      }
    }
  }

  /**
   * 統計情報を取得
   */
  getStats(): PreloadStats & {
    cache: ReturnType<ImageMemoryCache['getStats']>;
    network: NetworkCondition;
    activeRequests: number;
    queueSize: number;
  } {
    const avgLoadTime = this.stats.successfulLoads > 0 
      ? this.stats.avgLoadTime / this.stats.successfulLoads 
      : 0;

    return {
      ...this.stats,
      avgLoadTime,
      cache: this.cache.getStats(),
      network: this.getNetworkCondition(),
      activeRequests: this.activeRequests.size,
      queueSize: this.preloadQueue.size
    };
  }

  /**
   * プリローダーをリセット
   */
  reset(): void {
    this.preloadQueue.clear();
    this.activeRequests.clear();
    this.cache.clear();
    this.stats = {
      totalRequests: 0,
      successfulLoads: 0,
      cacheHits: 0,
      avgLoadTime: 0,
      networkOptimizations: 0,
      failoverUses: 0
    };
  }

  /**
   * 緊急モード：重要な画像のみ保持
   */
  enableEmergencyMode(): void {
    this.cache.clearLowPriority();
    this.clearLowPriorityQueue();
    this.clearNormalPriorityQueue();
  }
}