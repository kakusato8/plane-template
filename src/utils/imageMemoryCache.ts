/**
 * 高性能LRUメモリキャッシュシステム
 * 背景画像を効率的にメモリ管理し、即座のアクセスを提供
 */

interface CacheEntry {
  key: string;
  value: HTMLImageElement;
  timestamp: number;
  accessCount: number;
  size: number; // 推定メモリサイズ（バイト）
  priority: 'critical' | 'high' | 'normal' | 'low';
}

interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  hits: number;
  misses: number;
  evictions: number;
}

export class ImageMemoryCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = []; // LRU用のアクセス順序
  private maxSize: number; // 最大メモリサイズ（バイト）
  private maxEntries: number;
  private stats: CacheStats = {
    totalSize: 0,
    entryCount: 0,
    hitRate: 0,
    hits: 0,
    misses: 0,
    evictions: 0
  };

  // デバイス性能に基づく動的制限
  private readonly deviceBasedLimits = {
    desktop: { maxSize: 50 * 1024 * 1024, maxEntries: 50 }, // 50MB, 50枚
    tablet: { maxSize: 30 * 1024 * 1024, maxEntries: 30 },  // 30MB, 30枚
    mobile: { maxSize: 20 * 1024 * 1024, maxEntries: 20 }   // 20MB, 20枚
  };

  constructor(customLimits?: { maxSize?: number; maxEntries?: number }) {
    const deviceType = this.detectDeviceType();
    const defaults = this.deviceBasedLimits[deviceType];
    
    this.maxSize = customLimits?.maxSize ?? defaults.maxSize;
    this.maxEntries = customLimits?.maxEntries ?? defaults.maxEntries;
  }

  /**
   * デバイスタイプを検出
   */
  private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width <= 640) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * 画像の推定メモリサイズを計算
   */
  private estimateImageSize(img: HTMLImageElement): number {
    const width = img.naturalWidth || img.width || 1920;
    const height = img.naturalHeight || img.height || 1080;
    // RGBA（4バイト/ピクセル）+ オーバーヘッドで概算
    return width * height * 4 * 1.2;
  }

  /**
   * キャッシュに画像を保存
   */
  set(key: string, image: HTMLImageElement, priority: 'critical' | 'high' | 'normal' | 'low' = 'normal'): boolean {
    const size = this.estimateImageSize(image);
    
    // メモリ制限チェック
    if (size > this.maxSize * 0.3) { // 単一画像が全体の30%を超える場合は拒否
      console.warn('Image too large for cache:', key, `${(size / 1024 / 1024).toFixed(2)}MB`);
      return false;
    }

    // 既存エントリの更新
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      existing.value = image;
      existing.timestamp = Date.now();
      existing.accessCount++;
      existing.priority = priority;
      this.moveToFront(key);
      return true;
    }

    // 新規追加前に必要に応じてクリーンアップ
    this.ensureSpace(size);

    const entry: CacheEntry = {
      key,
      value: image,
      timestamp: Date.now(),
      accessCount: 1,
      size,
      priority
    };

    this.cache.set(key, entry);
    this.accessOrder.unshift(key);
    this.stats.totalSize += size;
    this.stats.entryCount++;

    return true;
  }

  /**
   * キャッシュから画像を取得
   */
  get(key: string): HTMLImageElement | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // アクセス統計を更新
    entry.accessCount++;
    entry.timestamp = Date.now();
    this.moveToFront(key);
    
    this.stats.hits++;
    this.updateHitRate();
    
    return entry.value;
  }

  /**
   * 指定キーの画像が存在するかチェック
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * 必要に応じて領域を確保
   */
  private ensureSpace(requiredSize: number): void {
    while (
      this.stats.entryCount >= this.maxEntries || 
      this.stats.totalSize + requiredSize > this.maxSize
    ) {
      if (!this.evictLeastRelevant()) {
        break; // 削除できるものがない場合は終了
      }
    }
  }

  /**
   * アクセス順序を先頭に移動
   */
  private moveToFront(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > 0) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.unshift(key);
    }
  }

  /**
   * 最も関連性の低いアイテムを削除
   * 優先度、アクセス頻度、最終アクセス時間を考慮
   */
  private evictLeastRelevant(): boolean {
    if (this.accessOrder.length === 0) return false;

    // 優先度別にスコアを計算
    const priorityScores = { critical: 1000, high: 100, normal: 10, low: 1 };
    const now = Date.now();
    
    let candidateKey: string | null = null;
    let lowestScore = Infinity;

    for (const key of this.accessOrder) {
      const entry = this.cache.get(key)!;
      const timeSinceAccess = now - entry.timestamp;
      const priorityScore = priorityScores[entry.priority];
      
      // スコア計算：優先度 × アクセス数 ÷ 経過時間（時間）
      const score = (priorityScore * entry.accessCount) / (timeSinceAccess / (1000 * 60 * 60) + 1);
      
      if (score < lowestScore) {
        lowestScore = score;
        candidateKey = key;
      }
    }

    if (candidateKey) {
      this.remove(candidateKey);
      this.stats.evictions++;
      return true;
    }

    return false;
  }

  /**
   * 指定キーを削除
   */
  remove(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }

    this.stats.totalSize -= entry.size;
    this.stats.entryCount--;

    return true;
  }

  /**
   * 優先度の低いアイテムをクリアする
   */
  clearLowPriority(): number {
    const keysToRemove: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (entry.priority === 'low') {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.remove(key));
    return keysToRemove.length;
  }

  /**
   * 期限切れのアイテムをクリーンアップ
   */
  cleanupExpired(maxAge: number = 30 * 60 * 1000): number { // デフォルト30分
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.cache) {
      if (entry.priority !== 'critical' && now - entry.timestamp > maxAge) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.remove(key));
    return keysToRemove.length;
  }

  /**
   * ヒット率を更新
   */
  private updateHitRate(): void {
    const totalRequests = this.stats.hits + this.stats.misses;
    this.stats.hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
  }

  /**
   * メモリ使用量をチェック
   */
  checkMemoryPressure(): 'low' | 'medium' | 'high' {
    const usage = this.stats.totalSize / this.maxSize;
    if (usage < 0.5) return 'low';
    if (usage < 0.8) return 'medium';
    return 'high';
  }

  /**
   * メモリプレッシャーに応じた自動クリーンアップ
   */
  autoCleanup(): void {
    const pressure = this.checkMemoryPressure();
    
    if (pressure === 'high') {
      // 高負荷時は低優先度を削除し、古いアイテムをクリーンアップ
      this.clearLowPriority();
      this.cleanupExpired(10 * 60 * 1000); // 10分
    } else if (pressure === 'medium') {
      // 中負荷時は古いアイテムのみクリーンアップ
      this.cleanupExpired(20 * 60 * 1000); // 20分
    }
  }

  /**
   * キャッシュ統計を取得
   */
  getStats(): CacheStats & {
    memoryUsage: {
      current: number;
      max: number;
      percentage: number;
      pressure: 'low' | 'medium' | 'high';
    };
    topItems: Array<{ key: string; accessCount: number; priority: string; age: number; }>;
  } {
    const now = Date.now();
    const topItems = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        priority: entry.priority,
        age: Math.round((now - entry.timestamp) / 1000 / 60) // minutes
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 5);

    return {
      ...this.stats,
      memoryUsage: {
        current: this.stats.totalSize,
        max: this.maxSize,
        percentage: this.stats.totalSize / this.maxSize,
        pressure: this.checkMemoryPressure()
      },
      topItems
    };
  }

  /**
   * 全キャッシュクリア
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
    this.stats = {
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  /**
   * キャッシュされた画像のキーリストを取得
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 優先度別のエントリ数を取得
   */
  getPriorityDistribution(): Record<string, number> {
    const distribution = { critical: 0, high: 0, normal: 0, low: 0 };
    
    for (const entry of this.cache.values()) {
      distribution[entry.priority]++;
    }

    return distribution;
  }
}

// シングルトンインスタンス
export const imageMemoryCache = new ImageMemoryCache();