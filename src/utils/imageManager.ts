/**
 * 高速画像管理システム (Serena MCP対応)
 * 段階的読み込み・タグベース生成・パフォーマンス最適化
 */

export interface ImageConfig {
  baseUrl: string;
  width: number;
  height: number;
  seed: string;
  blur?: number;
  quality?: number;
}

export interface TriviaImageTags {
  emotion: string[];
  setting: string[];
  palette: string[];
}

export const LoadingStage = {
  GRADIENT: 'gradient',
  PLACEHOLDER: 'placeholder',
  STANDARD: 'standard',
  HIGH_QUALITY: 'high'
} as const;

export type LoadingStage = typeof LoadingStage[keyof typeof LoadingStage];

export interface ImageLoadState {
  stage: LoadingStage;
  url: string;
  isLoading: boolean;
  hasError: boolean;
  loadTime: number;
}

export class ImageManager {
  private static instance: ImageManager;
  private cache = new Map<string, HTMLImageElement>();
  private loadPromises = new Map<string, Promise<HTMLImageElement>>();

  // Picsum Photos設定
  private readonly baseUrl = 'https://picsum.photos';
  private readonly fallbackGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  ];

  private constructor() {}

  public static getInstance(): ImageManager {
    if (!ImageManager.instance) {
      ImageManager.instance = new ImageManager();
    }
    return ImageManager.instance;
  }

  /**
   * 雑学タグから画像URLを生成
   */
  generateImageUrl(tags: TriviaImageTags, config: Partial<ImageConfig> = {}): ImageConfig {
    const seed = this.generateSeedFromTags(tags);
    const deviceWidth = window.innerWidth;
    const deviceHeight = window.innerHeight;
    
    // デバイスに応じた最適サイズ
    const width = config.width || Math.min(1920, deviceWidth * 2);
    const height = config.height || Math.min(1080, deviceHeight * 2);

    return {
      baseUrl: this.baseUrl,
      width,
      height,
      seed,
      blur: config.blur,
      quality: config.quality
    };
  }

  /**
   * タグからユニークなシードを生成
   */
  private generateSeedFromTags(tags: TriviaImageTags): string {
    const allTags = [
      ...tags.emotion,
      ...tags.setting, 
      ...tags.palette
    ];

    // タグを正規化・ソートしてハッシュ生成
    const normalizedTags = allTags
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 0)
      .sort();

    const combined = normalizedTags.join('-');
    return this.simpleHash(combined).toString();
  }

  /**
   * シンプルなハッシュ関数
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash);
  }

  /**
   * 画像設定からPicsum URLを構築
   */
  buildPicsumUrl(config: ImageConfig): string {
    let url = `${config.baseUrl}/${config.width}/${config.height}?random=${config.seed}`;
    
    if (config.blur) {
      url += `&blur=${config.blur}`;
    }
    
    // 品質調整（Picsumは直接サポートしないが、サイズで調整）
    if (config.quality && config.quality < 80) {
      const sizeReduction = 1 - (config.quality / 100) * 0.3;
      const adjustedWidth = Math.round(config.width * sizeReduction);
      const adjustedHeight = Math.round(config.height * sizeReduction);
      url = `${config.baseUrl}/${adjustedWidth}/${adjustedHeight}?random=${config.seed}`;
      if (config.blur) url += `&blur=${config.blur}`;
    }
    
    return url;
  }

  /**
   * 段階的画像読み込み
   */
  async loadImageProgressive(tags: TriviaImageTags): Promise<ImageLoadState[]> {
    const stages: ImageLoadState[] = [];
    
    try {
      // 段階1: グラデーション背景（即座）
      const gradientIndex = this.simpleHash(tags.emotion.join('')) % this.fallbackGradients.length;
      stages.push({
        stage: LoadingStage.GRADIENT,
        url: this.fallbackGradients[gradientIndex],
        isLoading: false,
        hasError: false,
        loadTime: 0
      });

      // 段階2: プレースホルダー（ぼかし画像）
      const placeholderConfig = this.generateImageUrl(tags, { blur: 5, quality: 30 });
      const placeholderUrl = this.buildPicsumUrl(placeholderConfig);
      const placeholderResult = await this.loadSingleImage(placeholderUrl);
      
      stages.push({
        stage: LoadingStage.PLACEHOLDER,
        url: placeholderUrl,
        isLoading: false,
        hasError: !placeholderResult.success,
        loadTime: placeholderResult.loadTime
      });

      // 段階3: 標準品質画像
      const standardConfig = this.generateImageUrl(tags, { quality: 70 });
      const standardUrl = this.buildPicsumUrl(standardConfig);
      const standardResult = await this.loadSingleImage(standardUrl);
      
      stages.push({
        stage: LoadingStage.STANDARD,
        url: standardUrl,
        isLoading: false,
        hasError: !standardResult.success,
        loadTime: standardResult.loadTime
      });

      // 段階4: 高品質画像（バックグラウンドで）
      setTimeout(async () => {
        const highQualityConfig = this.generateImageUrl(tags, { quality: 90 });
        const highQualityUrl = this.buildPicsumUrl(highQualityConfig);
        await this.loadSingleImage(highQualityUrl);
        
        stages.push({
          stage: LoadingStage.HIGH_QUALITY,
          url: highQualityUrl,
          isLoading: false,
          hasError: false,
          loadTime: 0
        });
      }, 3000);

      return stages;

    } catch (error) {
      console.error('段階的画像読み込みエラー:', error);
      return [{
        stage: LoadingStage.GRADIENT,
        url: this.fallbackGradients[0],
        isLoading: false,
        hasError: false,
        loadTime: 0
      }];
    }
  }

  /**
   * 単一画像を読み込み（キャッシュ付き）
   */
  async loadSingleImage(url: string): Promise<{ success: boolean; loadTime: number; image?: HTMLImageElement }> {
    const startTime = Date.now();
    
    // キャッシュチェック
    if (this.cache.has(url)) {
      return {
        success: true,
        loadTime: Date.now() - startTime,
        image: this.cache.get(url)
      };
    }

    // 既存の読み込みPromiseチェック
    if (this.loadPromises.has(url)) {
      try {
        const image = await this.loadPromises.get(url)!;
        return {
          success: true,
          loadTime: Date.now() - startTime,
          image
        };
      } catch (error) {
        return { success: false, loadTime: Date.now() - startTime };
      }
    }

    // 新規読み込み
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
      
      img.onload = () => {
        clearTimeout(timeout);
        this.cache.set(url, img);
        resolve(img);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Load failed'));
      };
      
      img.crossOrigin = 'anonymous';
      img.src = url;
    });

    this.loadPromises.set(url, loadPromise);
    
    try {
      const image = await loadPromise;
      return {
        success: true,
        loadTime: Date.now() - startTime,
        image
      };
    } catch (error) {
      return { success: false, loadTime: Date.now() - startTime };
    } finally {
      this.loadPromises.delete(url);
    }
  }

  /**
   * プリロード（ユーザーが読んでいる間に次の画像を準備）
   */
  async preloadNext(nextTags: TriviaImageTags[]): Promise<void> {
    const preloadPromises = nextTags.slice(0, 3).map(async tags => {
      const config = this.generateImageUrl(tags);
      const url = this.buildPicsumUrl(config);
      
      // バックグラウンドで読み込み（エラーは無視）
      this.loadSingleImage(url).catch(() => {});
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * フォールバックグラデーション取得
   */
  getFallbackGradient(tags: TriviaImageTags): string {
    const index = this.simpleHash(tags.emotion.join('')) % this.fallbackGradients.length;
    return this.fallbackGradients[index];
  }

  /**
   * キャッシュ統計
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      memoryEstimate: this.cache.size * 500 * 1024, // 概算500KB/image
      urls: Array.from(this.cache.keys())
    };
  }

  /**
   * キャッシュクリア
   */
  clearCache() {
    this.cache.clear();
    this.loadPromises.clear();
  }
}