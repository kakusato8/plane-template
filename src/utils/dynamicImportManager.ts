/**
 * 高度な動的インポート管理システム
 */

export interface ImportConfig {
  priority: 'critical' | 'high' | 'medium' | 'low';
  condition?: () => boolean;
  timeout?: number;
  retries?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface ComponentImporter {
  id: string;
  config: ImportConfig;
  importer: () => Promise<any>;
  loadPromise?: Promise<any>;
  loadTime?: number;
  loaded: boolean;
  error?: Error;
}

export class DynamicImportManager {
  private static instance: DynamicImportManager;
  private importers = new Map<string, ComponentImporter>();
  private loadQueue: ComponentImporter[] = [];
  private stats = {
    totalImports: 0,
    successfulImports: 0,
    failedImports: 0,
    averageLoadTime: 0,
    cacheHits: 0
  };

  private constructor() {
    this.initializeNetworkObserver();
    this.initializeVisibilityObserver();
  }

  public static getInstance(): DynamicImportManager {
    if (!DynamicImportManager.instance) {
      DynamicImportManager.instance = new DynamicImportManager();
    }
    return DynamicImportManager.instance;
  }

  /**
   * コンポーネントを登録
   */
  register(
    id: string,
    importer: () => Promise<any>,
    config: ImportConfig = { priority: 'medium' }
  ): void {
    const componentImporter: ComponentImporter = {
      id,
      config: {
        timeout: 10000,
        retries: 3,
        ...config
      },
      importer,
      loaded: false
    };

    this.importers.set(id, componentImporter);
    this.sortLoadQueue();
  }

  /**
   * コンポーネントを動的インポート
   */
  async import(id: string): Promise<any> {
    const importer = this.importers.get(id);
    
    if (!importer) {
      throw new Error(`Component "${id}" not registered`);
    }

    // 既に読み込み済みの場合
    if (importer.loaded && importer.loadPromise) {
      this.stats.cacheHits++;
      return importer.loadPromise;
    }

    // 既に読み込み中の場合
    if (importer.loadPromise) {
      return importer.loadPromise;
    }

    // 条件チェック
    if (importer.config.condition && !importer.config.condition()) {
      throw new Error(`Component "${id}" load condition not met`);
    }

    // インポート実行
    importer.loadPromise = this.executeImport(importer);
    
    try {
      const result = await importer.loadPromise;
      importer.loaded = true;
      importer.config.onSuccess?.();
      return result;
    } catch (error) {
      importer.error = error as Error;
      importer.config.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * インポートの実際の実行
   */
  private async executeImport(importer: ComponentImporter): Promise<any> {
    const startTime = performance.now();
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= (importer.config.retries || 3); attempt++) {
      try {
        this.stats.totalImports++;

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Import timeout for component "${importer.id}"`));
          }, importer.config.timeout || 10000);
        });

        const result = await Promise.race([
          importer.importer(),
          timeoutPromise
        ]);

        const loadTime = performance.now() - startTime;
        importer.loadTime = loadTime;
        this.updateAverageLoadTime(loadTime);
        this.stats.successfulImports++;

        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Component "${importer.id}" import attempt ${attempt} failed:`, error);
        
        if (attempt < (importer.config.retries || 3)) {
          // 指数バックオフで再試行
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    this.stats.failedImports++;
    throw lastError || new Error(`Failed to import component "${importer.id}"`);
  }

  /**
   * 優先度に基づくバッチプリロード
   */
  async preloadByPriority(priority: ImportConfig['priority']): Promise<void> {
    const components = Array.from(this.importers.values())
      .filter(importer => 
        importer.config.priority === priority && 
        !importer.loaded &&
        (!importer.config.condition || importer.config.condition())
      );

    const promises = components.map(importer => 
      this.import(importer.id).catch(error => {
        console.warn(`Failed to preload ${importer.id}:`, error);
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * 条件付きプリロード
   */
  async preloadConditional(): Promise<void> {
    const conditionalComponents = Array.from(this.importers.values())
      .filter(importer => 
        importer.config.condition &&
        importer.config.condition() &&
        !importer.loaded
      );

    const promises = conditionalComponents.map(importer => 
      this.import(importer.id).catch(error => {
        console.warn(`Failed to conditionally preload ${importer.id}:`, error);
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * インターセクション監視によるプリロード
   */
  preloadOnIntersection(
    elementSelector: string,
    componentIds: string[],
    options: IntersectionObserverInit = { threshold: 0.1 }
  ): void {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          componentIds.forEach(id => {
            this.import(id).catch(error => {
              console.warn(`Failed to preload on intersection ${id}:`, error);
            });
          });
          observer.disconnect();
        }
      });
    }, options);

    const element = document.querySelector(elementSelector);
    if (element) {
      observer.observe(element);
    }
  }

  /**
   * ユーザーの行動に基づくプリロード
   */
  preloadOnUserInteraction(
    eventType: keyof WindowEventMap,
    componentIds: string[],
    once: boolean = true
  ): void {
    if (typeof window === 'undefined') return;

    const handler = () => {
      componentIds.forEach(id => {
        this.import(id).catch(error => {
          console.warn(`Failed to preload on interaction ${id}:`, error);
        });
      });

      if (once) {
        window.removeEventListener(eventType, handler);
      }
    };

    window.addEventListener(eventType, handler, { passive: true });
  }

  /**
   * ネットワーク状態に基づくプリロード制御
   */
  private initializeNetworkObserver(): void {
    if (typeof window === 'undefined' || !('navigator' in window)) return;

    const updatePreloadStrategy = () => {
      // @ts-ignore - Connection API may not be available
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                               connection.effectiveType === '2g';
        
        if (isSlowConnection) {
          // 遅い回線では critical のみプリロード
          this.preloadByPriority('critical');
        } else {
          // 高速回線では high まで積極的にプリロード
          this.preloadByPriority('critical').then(() => 
            this.preloadByPriority('high')
          );
        }
      }
    };

    // @ts-ignore
    if ('connection' in navigator && navigator.connection) {
      // @ts-ignore
      navigator.connection.addEventListener('change', updatePreloadStrategy);
      updatePreloadStrategy();
    }
  }

  /**
   * ページ可視性に基づくプリロード制御
   */
  private initializeVisibilityObserver(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // ページが可視になったらプリロード再開
        this.preloadByPriority('high');
      }
    });
  }

  /**
   * 読み込みキューをソート
   */
  private sortLoadQueue(): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    this.loadQueue = Array.from(this.importers.values())
      .filter(importer => !importer.loaded)
      .sort((a, b) => priorityOrder[a.config.priority] - priorityOrder[b.config.priority]);
  }

  /**
   * 平均読み込み時間を更新
   */
  private updateAverageLoadTime(loadTime: number): void {
    const total = this.stats.averageLoadTime * this.stats.successfulImports + loadTime;
    this.stats.averageLoadTime = total / (this.stats.successfulImports + 1);
  }

  /**
   * 遅延ユーティリティ
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 統計情報を取得
   */
  getStats() {
    const componentStats = Array.from(this.importers.values()).map(importer => ({
      id: importer.id,
      priority: importer.config.priority,
      loaded: importer.loaded,
      loadTime: importer.loadTime,
      hasError: !!importer.error,
      error: importer.error?.message
    }));

    return {
      global: this.stats,
      components: componentStats,
      loadQueue: this.loadQueue.map(c => c.id)
    };
  }

  /**
   * すべてのインポーターをクリア
   */
  clear(): void {
    this.importers.clear();
    this.loadQueue = [];
    this.stats = {
      totalImports: 0,
      successfulImports: 0,
      failedImports: 0,
      averageLoadTime: 0,
      cacheHits: 0
    };
  }

  /**
   * 特定のコンポーネントがロード済みかチェック
   */
  isLoaded(id: string): boolean {
    const importer = this.importers.get(id);
    return importer ? importer.loaded : false;
  }

  /**
   * 登録済みコンポーネントのリストを取得
   */
  getRegisteredComponents(): string[] {
    return Array.from(this.importers.keys());
  }
}