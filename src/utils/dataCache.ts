/**
 * 高度なデータキャッシュシステム（IndexedDB + メモリキャッシュ）
 */
import { DataCompression, type CompressionResult } from './dataCompression';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  compressed: boolean;
  compressionMethod: string;
  compressionRatio?: number;
  originalSize?: number;
  compressedSize?: number;
  version: string;
}

interface CacheStats {
  memorySize: number;
  indexedDBSize: number;
  hitRate: number;
  missCount: number;
  hitCount: number;
}

export class DataCache {
  private static instance: DataCache;
  private memoryCache = new Map<string, CacheItem<any>>();
  private dbPromise: Promise<IDBDatabase> | null = null;
  private stats: CacheStats = {
    memorySize: 0,
    indexedDBSize: 0,
    hitRate: 0,
    missCount: 0,
    hitCount: 0
  };

  private readonly DB_NAME = 'curio-city-cache';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'data';
  private readonly MAX_MEMORY_ITEMS = 50;
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24時間

  private constructor() {
    this.initDB();
    this.startCleanupTimer();
  }

  public static getInstance(): DataCache {
    if (!DataCache.instance) {
      DataCache.instance = new DataCache();
    }
    return DataCache.instance;
  }

  /**
   * IndexedDB の初期化
   */
  private async initDB(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * データの圧縮（高度な圧縮システムを使用）
   */
  private compressData(data: any): CompressionResult {
    // データサイズに応じて最適な圧縮方法を選択
    const options = DataCompression.getOptimalCompression(data);
    return DataCompression.compress(data, options);
  }

  /**
   * データの展開
   */
  private decompressData(compressedData: string | Uint8Array, method: string): any {
    return DataCompression.decompress(compressedData, method);
  }

  /**
   * メモリキャッシュにデータを設定
   */
  private setMemoryCache<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // メモリキャッシュサイズ制限
    if (this.memoryCache.size >= this.MAX_MEMORY_ITEMS) {
      this.evictOldestMemoryItem();
    }

    const compressionResult = this.compressData(data);

    this.memoryCache.set(key, {
      data: compressionResult.data,
      timestamp: Date.now(),
      ttl,
      compressed: compressionResult.compressed,
      compressionMethod: compressionResult.method,
      compressionRatio: compressionResult.compressionRatio,
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize,
      version: this.getDataVersion()
    });

    this.updateMemorySize();
  }

  /**
   * メモリキャッシュからデータを取得
   */
  private getMemoryCache<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      return null;
    }

    // TTL チェック
    if (Date.now() > item.timestamp + item.ttl) {
      this.memoryCache.delete(key);
      this.updateMemorySize();
      return null;
    }

    // バージョンチェック
    if (item.version !== this.getDataVersion()) {
      this.memoryCache.delete(key);
      this.updateMemorySize();
      return null;
    }

    try {
      return item.compressed 
        ? this.decompressData(item.data, item.compressionMethod)
        : item.data;
    } catch (error) {
      console.warn('Memory cache decompression failed:', error);
      this.memoryCache.delete(key);
      this.updateMemorySize();
      return null;
    }
  }

  /**
   * IndexedDB にデータを設定
   */
  private async setIndexedDB<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    if (!this.dbPromise) return;

    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const compressionResult = this.compressData(data);

      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          key,
          data: compressionResult.data,
          timestamp: Date.now(),
          ttl,
          compressed: compressionResult.compressed,
          compressionMethod: compressionResult.method,
          compressionRatio: compressionResult.compressionRatio,
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          version: this.getDataVersion()
        });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB set failed:', error);
    }
  }

  /**
   * IndexedDB からデータを取得
   */
  private async getIndexedDB<T>(key: string): Promise<T | null> {
    if (!this.dbPromise) return null;

    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);

      return new Promise<T | null>((resolve) => {
        const request = store.get(key);
        
        request.onsuccess = () => {
          const item = request.result as CacheItem<any> | undefined;
          
          if (!item) {
            resolve(null);
            return;
          }

          // TTL チェック
          if (Date.now() > item.timestamp + item.ttl) {
            this.deleteIndexedDB(key);
            resolve(null);
            return;
          }

          // バージョンチェック
          if (item.version !== this.getDataVersion()) {
            this.deleteIndexedDB(key);
            resolve(null);
            return;
          }

          try {
            const decompressed = item.compressed 
              ? this.decompressData(item.data, item.compressionMethod)
              : item.data;
            resolve(decompressed);
          } catch (decompressError) {
            console.warn('IndexedDB decompression failed:', decompressError);
            this.deleteIndexedDB(key);
            resolve(null);
          }
        };
        
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.warn('IndexedDB get failed:', error);
      return null;
    }
  }

  /**
   * IndexedDB からデータを削除
   */
  private async deleteIndexedDB(key: string): Promise<void> {
    if (!this.dbPromise) return;

    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB delete failed:', error);
    }
  }

  /**
   * 最古のメモリキャッシュ項目を削除
   */
  private evictOldestMemoryItem(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.memoryCache) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * メモリサイズの更新
   */
  private updateMemorySize(): void {
    let size = 0;
    for (const item of this.memoryCache.values()) {
      size += JSON.stringify(item).length;
    }
    this.stats.memorySize = size;
  }

  /**
   * データバージョンの取得
   */
  private getDataVersion(): string {
    return '1.0.0'; // アプリケーションバージョンに応じて更新
  }

  /**
   * 統計の更新
   */
  private updateStats(hit: boolean): void {
    if (hit) {
      this.stats.hitCount++;
    } else {
      this.stats.missCount++;
    }
    
    const total = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = total > 0 ? (this.stats.hitCount / total) * 100 : 0;
  }

  /**
   * 定期クリーンアップタイマー
   */
  private startCleanupTimer(): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // 1時間ごと
  }

  /**
   * 期限切れデータのクリーンアップ
   */
  public async cleanup(): Promise<void> {
    const now = Date.now();

    // メモリキャッシュのクリーンアップ
    for (const [key, item] of this.memoryCache) {
      if (now > item.timestamp + item.ttl) {
        this.memoryCache.delete(key);
      }
    }
    this.updateMemorySize();

    // IndexedDB のクリーンアップ
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const index = store.index('timestamp');
        
        const request = index.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const item = cursor.value as CacheItem<any> & { key: string };
            if (now > item.timestamp + item.ttl) {
              cursor.delete();
            }
            cursor.continue();
          }
        };
      } catch (error) {
        console.warn('IndexedDB cleanup failed:', error);
      }
    }
  }

  // Public API

  /**
   * データを設定
   */
  public async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    this.setMemoryCache(key, data, ttl);
    await this.setIndexedDB(key, data, ttl);
  }

  /**
   * データを取得
   */
  public async get<T>(key: string): Promise<T | null> {
    // メモリキャッシュから試行
    let data = this.getMemoryCache<T>(key);
    
    if (data) {
      this.updateStats(true);
      return data;
    }

    // IndexedDB から試行
    data = await this.getIndexedDB<T>(key);
    
    if (data) {
      // メモリキャッシュに昇格
      this.setMemoryCache(key, data);
      this.updateStats(true);
      return data;
    }

    this.updateStats(false);
    return null;
  }

  /**
   * データを削除
   */
  public async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    this.updateMemorySize();
    await this.deleteIndexedDB(key);
  }

  /**
   * キャッシュをクリア
   */
  public async clear(): Promise<void> {
    this.memoryCache.clear();
    this.updateMemorySize();
    
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.warn('IndexedDB clear failed:', error);
      }
    }
  }

  /**
   * 統計情報を取得
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * キーの存在確認
   */
  public async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }
}