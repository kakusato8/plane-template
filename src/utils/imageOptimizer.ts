/**
 * 画像最適化とレスポンシブ画像システム
 */

// 画像設定インターフェース（将来の拡張用）
export interface ImageConfig {
  src: string;
  alt: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  quality?: number;
}

interface ResponsiveImage {
  avif?: string;
  webp?: string;
  fallback: string;
  sizes: string;
  srcSet: string;
}

export class ImageOptimizer {
  private static cache = new Map<string, HTMLImageElement>();
  private static observer: IntersectionObserver | null = null;
  private static preloadQueue = new Set<string>();

  /**
   * WebP対応チェック
   */
  static isWebPSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('webp') > 0;
  }

  /**
   * AVIF対応チェック
   */
  static isAVIFSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL('image/avif');
    return dataUrl.indexOf('avif') > 0;
  }

  /**
   * 最適な画像フォーマットを判定
   */
  static getBestImageFormat(): 'avif' | 'webp' | 'jpg' {
    if (this.isAVIFSupported()) return 'avif';
    if (this.isWebPSupported()) return 'webp';
    return 'jpg';
  }

  /**
   * レスポンシブ画像URLを生成
   */
  static generateResponsiveImageUrl(
    baseUrl: string, 
    width: number, 
    _quality: number = 80, 
    _format?: 'avif' | 'webp' | 'jpg'
  ): string {
    // const targetFormat = format || this.getBestImageFormat();
    

    // Pexels APIの場合の最適化
    if (baseUrl.includes('pexels.com')) {
      // Pexels APIのサイズ調整機能を利用
      return baseUrl.replace(/(\?.*)?$/, `?auto=compress&cs=tinysrgb&w=${width}&h=${Math.round(width * 0.75)}`);
    }

    // 独自画像の場合のフォールバック
    return baseUrl;
  }

  /**
   * デバイスに応じた最適サイズを計算
   */
  static getOptimalImageSize(): { width: number; sizes: string; srcSet: string[] } {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    let width: number;
    let sizes: string;
    let breakpoints: number[];

    if (viewportWidth <= 640) {
      // Mobile
      width = Math.round(640 * Math.min(dpr, 2)); // DPRの上限を2に制限
      sizes = '100vw';
      breakpoints = [320, 480, 640];
    } else if (viewportWidth <= 1024) {
      // Tablet
      width = Math.round(1024 * Math.min(dpr, 2));
      sizes = '100vw';
      breakpoints = [640, 768, 1024];
    } else {
      // Desktop
      width = Math.round(1920 * Math.min(dpr, 2));
      sizes = '100vw';
      breakpoints = [1024, 1366, 1920];
    }

    const srcSet = breakpoints.map(bp => `${bp * Math.min(dpr, 2)}w`);

    return { width, sizes, srcSet };
  }

  /**
   * レスポンシブ画像設定を生成
   */
  static createResponsiveImage(baseUrl: string, _alt: string): ResponsiveImage {
    const { width, sizes, srcSet } = this.getOptimalImageSize();
    
    const avifUrl = this.isAVIFSupported() 
      ? this.generateResponsiveImageUrl(baseUrl, width, 75, 'avif') 
      : undefined;
    
    const webpUrl = this.isWebPSupported() 
      ? this.generateResponsiveImageUrl(baseUrl, width, 85, 'webp') 
      : undefined;
    
    const fallbackUrl = this.generateResponsiveImageUrl(baseUrl, width, 90, 'jpg');

    // srcSet文字列の生成（各ブレークポイントに対応）
    const srcSetString = srcSet.map(descriptor => {
      const width = parseInt(descriptor.replace('w', ''));
      const url = this.generateResponsiveImageUrl(baseUrl, width, 85);
      return `${url} ${descriptor}`;
    }).join(', ');

    return {
      avif: avifUrl,
      webp: webpUrl,
      fallback: fallbackUrl,
      sizes,
      srcSet: srcSetString
    };
  }

  /**
   * 画像のプリロード
   */
  static preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.cache.has(src)) {
      return Promise.resolve(this.cache.get(src)!);
    }

    if (this.preloadQueue.has(src)) {
      return new Promise((resolve) => {
        const checkCache = () => {
          if (this.cache.has(src)) {
            resolve(this.cache.get(src)!);
          } else {
            setTimeout(checkCache, 10);
          }
        };
        checkCache();
      });
    }

    this.preloadQueue.add(src);

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(src, img);
        this.preloadQueue.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        this.preloadQueue.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }

  /**
   * 重要な画像の事前読み込み
   */
  static preloadCriticalImages(urls: string[]): Promise<HTMLImageElement[]> {
    const promises = urls.slice(0, 3).map(url => {
      const responsive = this.createResponsiveImage(url, '');
      // 最適なフォーマットを選択してプリロード
      const optimalUrl = responsive.avif || responsive.webp || responsive.fallback;
      return this.preloadImage(optimalUrl);
    });

    return Promise.all(promises).catch(error => {
      console.warn('Critical images preload failed:', error);
      return [];
    });
  }

  /**
   * Intersection Observer の初期化
   */
  static initIntersectionObserver(): void {
    if (typeof window === 'undefined' || this.observer) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src && img.src !== src) {
              this.loadImageLazy(img, src);
              this.observer!.unobserve(img);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }

  /**
   * 遅延読み込み画像の処理
   */
  private static loadImageLazy(img: HTMLImageElement, src: string): void {
    const tempImg = new Image();
    
    tempImg.onload = () => {
      img.src = src;
      img.classList.add('loaded');
    };
    
    tempImg.onerror = () => {
      console.warn(`Failed to load lazy image: ${src}`);
      img.classList.add('error');
    };
    
    tempImg.src = src;
  }

  /**
   * 遅延読み込み画像の監視開始
   */
  static observeLazyImage(img: HTMLImageElement): void {
    if (!this.observer) {
      this.initIntersectionObserver();
    }
    
    this.observer!.observe(img);
  }

  /**
   * パフォーマンス統計の取得
   */
  static getStats() {
    const optimalSize = this.getOptimalImageSize();
    return {
      cachedImages: this.cache.size,
      preloadQueue: this.preloadQueue.size,
      formatSupport: {
        avif: this.isAVIFSupported(),
        webp: this.isWebPSupported(),
        bestFormat: this.getBestImageFormat()
      },
      optimalSize: {
        width: optimalSize.width,
        sizes: optimalSize.sizes,
        srcSetBreakpoints: optimalSize.srcSet.length
      },
      deviceInfo: {
        viewport: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
        pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 'unknown'
      }
    };
  }

  /**
   * キャッシュクリア
   */
  static clearCache(): void {
    this.cache.clear();
    this.preloadQueue.clear();
  }

  /**
   * ユーティリティ: 画像の実際のサイズを取得
   */
  static async getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    const img = await this.preloadImage(src);
    return {
      width: img.naturalWidth,
      height: img.naturalHeight
    };
  }
}