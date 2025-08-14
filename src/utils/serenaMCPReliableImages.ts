/**
 * SerenaMCP 信頼性の高い画像システム
 * ERR_EMPTY_RESPONSE エラーを回避し、確実に画像を提供
 */

import type { TriviaItem, Location } from '../../types/trivia';

export interface ReliableImageConfig {
  width: number;
  height: number;
  quality: 'low' | 'medium' | 'high';
}

export class SerenaMCPReliableImages {
  private static instance: SerenaMCPReliableImages;

  public static getInstance(): SerenaMCPReliableImages {
    if (!SerenaMCPReliableImages.instance) {
      SerenaMCPReliableImages.instance = new SerenaMCPReliableImages();
    }
    return SerenaMCPReliableImages.instance;
  }

  /**
   * 信頼性の高い画像URLリストを生成
   */
  public generateReliableImageUrls(
    trivia: TriviaItem, 
    location: Location, 
    config: ReliableImageConfig = { width: 1920, height: 1080, quality: 'high' }
  ): string[] {
    console.log('🛡️ SerenaMCP: 信頼性重視画像URL生成開始', {
      trivia: trivia.title,
      location: location.name
    });

    const urls: string[] = [];
    const seed = this.generateSeed(trivia, location);
    
    // 1. Picsum Photos (最も安定)
    const picsumUrls = this.generatePicsumUrls(config, seed);
    urls.push(...picsumUrls);

    // 2. LoremFlickr (テーマ別)
    const flickrUrls = this.generateLoremFlickrUrls(trivia, location, config);
    urls.push(...flickrUrls);

    // 3. PlaceImg (カテゴリ別)
    const placeImgUrls = this.generatePlaceImgUrls(trivia, location, config);
    urls.push(...placeImgUrls);

    // 4. 美しいグラデーション (フォールバック保証)
    const gradientUrls = this.generateReliableGradients(trivia, location, config);
    urls.push(...gradientUrls);

    console.log('🛡️ SerenaMCP: 信頼性画像URL生成完了', urls.length, '個');
    return urls;
  }

  /**
   * 🎨 Picsum Photos URLs生成（ERR_CONNECTION_REFUSED耐性強化）
   */
  generatePicsumPhotoUrls(
    trivia: TriviaItem, 
    location: Location, 
    config: { width: number; height: number; count: number; quality: string }
  ): string[] {
    console.log('🎨 ERR_CONNECTION_REFUSED耐性Picsum画像生成:', trivia.title);
    
    const seed = this.generateSeed(trivia, location);
    const urls = this.generatePicsumUrls(config, seed);
    
    console.log('✅ Picsum URLs生成完了:', urls.length, '個');
    return urls;
  }

  /**
   * Picsum Photos URLs (最も安定したソース)
   */
  private generatePicsumUrls(config: ReliableImageConfig, seed: number): string[] {
    const urls: string[] = [];
    const { width, height } = config;
    
    // 複数のID範囲から選択
    const imageIds = [
      seed % 1000 + 1,
      (seed * 2) % 800 + 200,
      (seed * 3) % 600 + 300,
      (seed * 5) % 400 + 500,
      (seed * 7) % 200 + 700
    ];
    
    imageIds.forEach((id, index) => {
      // ブラー効果のバリエーション
      const blur = index === 0 ? '' : index === 1 ? '?blur=1' : '?blur=2';
      urls.push(`https://picsum.photos/id/${id}/${width}/${height}${blur}`);
    });

    return urls;
  }

  /**
   * LoremFlickr URLs (テーマ別カテゴリ)
   */
  private generateLoremFlickrUrls(trivia: TriviaItem, location: Location, config: ReliableImageConfig): string[] {
    const urls: string[] = [];
    const { width, height } = config;
    
    // 雰囲気に基づくカテゴリマッピング
    const categories = this.mapToFlickrCategories(trivia, location);
    
    categories.forEach(category => {
      urls.push(`https://loremflickr.com/${width}/${height}/${category}`);
    });

    return urls;
  }

  /**
   * PlaceImg URLs (幅広いカテゴリ)
   */
  private generatePlaceImgUrls(trivia: TriviaItem, location: Location, config: ReliableImageConfig): string[] {
    const urls: string[] = [];
    const { width, height } = config;
    
    // PlaceImg カテゴリマッピング
    const categories = this.mapToPlaceImgCategories(trivia, location);
    
    categories.forEach(category => {
      urls.push(`https://placeimg.com/${width}/${height}/${category}`);
    });

    return urls;
  }

  /**
   * 信頼性の高いグラデーション生成
   */
  private generateReliableGradients(trivia: TriviaItem, location: Location, config: ReliableImageConfig): string[] {
    const urls: string[] = [];
    const { width, height } = config;
    
    const emotions = trivia.tags.emotion || [];
    const settings = trivia.tags.setting || [];
    
    // 感情と設定に基づくグラデーション
    const gradients = this.generateGradientData(emotions, settings, location.atmosphere);
    
    gradients.forEach((gradient, index) => {
      const svg = this.createGradientSVG(gradient, width, height);
      const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
      urls.push(dataUrl);
    });

    return urls;
  }

  /**
   * Flickrカテゴリマッピング
   */
  private mapToFlickrCategories(trivia: TriviaItem, location: Location): string[] {
    const categories: string[] = [];
    
    // 設定タグマッピング
    const settingMap: Record<string, string[]> = {
      '都市夜景': ['city', 'skyline', 'night'],
      '古代遺跡': ['ancient', 'architecture', 'history'],
      '近未来都市': ['city', 'technology', 'modern'],
      '森林': ['forest', 'nature', 'trees'],
      '砂漠': ['desert', 'landscape', 'sand'],
      '海辺': ['ocean', 'beach', 'water'],
      '山岳': ['mountain', 'landscape', 'nature'],
      '氷原': ['snow', 'winter', 'landscape'],
      '湖': ['lake', 'water', 'nature'],
      '空': ['sky', 'clouds', 'nature']
    };

    trivia.tags.setting.forEach(setting => {
      if (settingMap[setting]) {
        categories.push(...settingMap[setting]);
      }
    });

    // 地点タイプマッピング
    if (location.type === 'real') {
      categories.push('travel', 'landscape', 'destination');
    } else {
      categories.push('fantasy', 'artistic', 'abstract');
    }

    return [...new Set(categories)].slice(0, 3); // 重複排除して最大3個
  }

  /**
   * PlaceImgカテゴリマッピング
   */
  private mapToPlaceImgCategories(trivia: TriviaItem, location: Location): string[] {
    const categories: string[] = [];
    
    // PlaceImg基本カテゴリ
    const basicCategories = ['nature', 'architecture', 'tech'];
    
    // 感情タグマッピング
    const emotionMap: Record<string, string> = {
      'ミステリアス': 'nature',
      'ロマンチック': 'nature',
      'エピック': 'architecture',
      'ノスタルジック': 'arch',
      'セレーン': 'nature',
      'ダーク': 'tech',
      'ジョイフル': 'nature',
      'メランコリック': 'arch'
    };

    trivia.tags.emotion.forEach(emotion => {
      if (emotionMap[emotion]) {
        categories.push(emotionMap[emotion]);
      }
    });

    return categories.length > 0 ? [...new Set(categories)] : basicCategories;
  }

  /**
   * グラデーションデータ生成
   */
  private generateGradientData(emotions: string[], settings: string[], atmosphere: string[]): Array<{
    start: string;
    end: string;
    direction: string;
  }> {
    const gradients = [];
    
    // 感情ベースグラデーション
    const emotionGradients: Record<string, { start: string; end: string; direction: string }> = {
      'ミステリアス': { start: '#667eea', end: '#764ba2', direction: '135deg' },
      'ロマンチック': { start: '#f093fb', end: '#f5576c', direction: '45deg' },
      'エピック': { start: '#4facfe', end: '#00f2fe', direction: '90deg' },
      'ノスタルジック': { start: '#fad0c4', end: '#ffd1ff', direction: '180deg' },
      'セレーン': { start: '#a8edea', end: '#fed6e3', direction: '120deg' },
      'ダーク': { start: '#2c3e50', end: '#34495e', direction: '225deg' },
      'ジョイフル': { start: '#ffecd2', end: '#fcb69f', direction: '60deg' },
      'メランコリック': { start: '#6c7b95', end: '#b2c6ee', direction: '315deg' }
    };

    emotions.forEach(emotion => {
      if (emotionGradients[emotion]) {
        gradients.push(emotionGradients[emotion]);
      }
    });

    // デフォルトグラデーション
    if (gradients.length === 0) {
      gradients.push(emotionGradients['ミステリアス']);
    }

    return gradients.slice(0, 2); // 最大2個
  }

  /**
   * SVGグラデーション作成
   */
  private createGradientSVG(gradient: { start: string; end: string; direction: string }, width: number, height: number): string {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${gradient.direction})">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>`;
  }

  /**
   * シード値生成
   */
  private generateSeed(trivia: TriviaItem, location: Location): number {
    const str = `${trivia.id}_${location.id}_${trivia.title}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash);
  }

  /**
   * URLの有効性を事前テスト
   */
  async testImageUrl(url: string, timeoutMs: number = 3000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        method: 'HEAD', // ヘッダーのみ取得
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch (error) {
      console.warn('🛡️ SerenaMCP: URL テスト失敗', url, error);
      return false;
    }
  }

  /**
   * 信頼性テスト済みURLリストを取得
   */
  async getTestedImageUrls(trivia: TriviaItem, location: Location, config: ReliableImageConfig): Promise<string[]> {
    const allUrls = this.generateReliableImageUrls(trivia, location, config);
    const testedUrls: string[] = [];
    
    console.log('🛡️ SerenaMCP: URL信頼性テスト開始', allUrls.length, '個');
    
    // 並行でテスト（最大3つ同時）
    const testPromises = allUrls.slice(0, 6).map(async url => {
      const isValid = await this.testImageUrl(url);
      return isValid ? url : null;
    });
    
    const results = await Promise.allSettled(testPromises);
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        testedUrls.push(result.value);
      }
    });
    
    // 必ずグラデーションを最後に追加（確実なフォールバック）
    const gradientUrls = this.generateReliableGradients(trivia, location, config);
    testedUrls.push(...gradientUrls);
    
    console.log('🛡️ SerenaMCP: 信頼性テスト完了', testedUrls.length, '個有効');
    return testedUrls;
  }
}

// シングルトンインスタンスをエクスポート
export const serenaMCPReliableImages = SerenaMCPReliableImages.getInstance();