/**
 * SerenaMCP 美しい画像生成システム
 * コンテンツに適した美しく雰囲気のある背景画像を生成
 */

import type { TriviaItem, Location } from '../../types/trivia';

export interface BeautifulImageConfig {
  width: number;
  height: number;
  quality: 'low' | 'medium' | 'high';
  style: 'natural' | 'artistic' | 'mystical' | 'serene';
}

export interface ImageTheme {
  emotions: string[];
  colors: string[];
  keywords: string[];
  unsplashTags: string[];
}

export class SerenaMCPBeautifulImages {
  private static instance: SerenaMCPBeautifulImages;

  public static getInstance(): SerenaMCPBeautifulImages {
    if (!SerenaMCPBeautifulImages.instance) {
      SerenaMCPBeautifulImages.instance = new SerenaMCPBeautifulImages();
    }
    return SerenaMCPBeautifulImages.instance;
  }

  /**
   * 雑学と地点に基づいて美しい画像URLリストを生成
   */
  public generateBeautifulImageUrls(
    trivia: TriviaItem, 
    location: Location, 
    config: BeautifulImageConfig = { width: 1920, height: 1080, quality: 'high', style: 'natural' }
  ): string[] {
    console.log('🎨 SerenaMCP: 美しい画像URL生成開始', {
      trivia: trivia.title,
      location: location.name,
      emotions: trivia.tags.emotion,
      setting: trivia.tags.setting
    });

    const urls: string[] = [];
    const theme = this.analyzeTheme(trivia, location);
    const seed = this.generateSeed(trivia, location);

    // 1. 雰囲気に適したUnsplash画像
    const unsplashUrls = this.generateUnsplashUrls(theme, config, seed);
    urls.push(...unsplashUrls);

    // 2. キュレーションされたPicsum画像
    const picsumUrls = this.generateCuratedPicsumUrls(theme, config, seed);
    urls.push(...picsumUrls);

    // 3. 美しいグラデーション画像
    const gradientUrls = this.generateBeautifulGradients(theme, config);
    urls.push(...gradientUrls);

    console.log('🎨 SerenaMCP: 美しい画像URL生成完了', urls.length, '個');
    return urls;
  }

  /**
   * 雑学と地点から画像テーマを分析
   */
  private analyzeTheme(trivia: TriviaItem, location: Location): ImageTheme {
    const emotions = trivia.tags.emotion || [];
    const settings = trivia.tags.setting || [];
    const palette = trivia.tags.palette || [];
    const atmosphere = location.atmosphere || [];

    // 感情タグから色彩を決定
    const colors = this.emotionsToColors(emotions);
    
    // 設定タグからキーワードを生成
    const keywords = this.settingsToKeywords(settings);
    
    // Unsplash用の美しいタグを生成
    const unsplashTags = this.generateUnsplashTags(emotions, settings, location.type);

    return {
      emotions: [...emotions, ...atmosphere],
      colors: [...colors, ...this.paletteToColors(palette)],
      keywords: [...keywords, ...this.locationToKeywords(location)],
      unsplashTags
    };
  }

  /**
   * 感情タグから美しい色彩を生成
   */
  private emotionsToColors(emotions: string[]): string[] {
    const colorMap: Record<string, string[]> = {
      'ミステリアス': ['purple', 'indigo', 'midnight'],
      'ロマンチック': ['pink', 'rose', 'blush'],
      'エピック': ['gold', 'amber', 'bronze'],
      'ノスタルジック': ['sepia', 'cream', 'vintage'],
      'セレーン': ['sage', 'mint', 'aqua'],
      'ダーク': ['charcoal', 'slate', 'obsidian'],
      'ジョイフル': ['yellow', 'orange', 'coral'],
      'メランコリック': ['blue', 'steel', 'mist']
    };

    const colors: string[] = [];
    emotions.forEach(emotion => {
      if (colorMap[emotion]) {
        colors.push(...colorMap[emotion]);
      }
    });

    return colors.length > 0 ? colors : ['natural', 'soft', 'gentle'];
  }

  /**
   * 設定タグから美しいキーワードを生成
   */
  private settingsToKeywords(settings: string[]): string[] {
    const keywordMap: Record<string, string[]> = {
      '都市夜景': ['city', 'skyline', 'lights', 'urban'],
      '古代遺跡': ['ancient', 'stone', 'ruins', 'history'],
      '近未来都市': ['futuristic', 'neon', 'architecture', 'modern'],
      '森林': ['forest', 'trees', 'nature', 'woodland'],
      '砂漠': ['desert', 'dunes', 'sand', 'vast'],
      '海辺': ['ocean', 'waves', 'shore', 'peaceful'],
      '山岳': ['mountains', 'peaks', 'landscape', 'majestic'],
      '氷原': ['ice', 'snow', 'frozen', 'pristine'],
      '湖': ['lake', 'reflection', 'calm', 'serene'],
      '空': ['sky', 'clouds', 'atmosphere', 'ethereal'],
      '架空都市': ['fantasy', 'magical', 'dreamlike', 'surreal']
    };

    const keywords: string[] = [];
    settings.forEach(setting => {
      if (keywordMap[setting]) {
        keywords.push(...keywordMap[setting]);
      }
    });

    return keywords.length > 0 ? keywords : ['beautiful', 'scenic', 'peaceful'];
  }

  /**
   * パレットタグから色彩を変換
   */
  private paletteToColors(palette: string[]): string[] {
    const paletteMap: Record<string, string[]> = {
      'モノクロ': ['monochrome', 'grayscale'],
      'パステル': ['pastel', 'soft'],
      'ビビッド': ['vibrant', 'bright'],
      'アースカラー': ['earth', 'natural'],
      'ゴールド': ['golden', 'warm'],
      'ネオン': ['neon', 'electric'],
      'セピア': ['sepia', 'vintage'],
      'ブルートーン': ['blue', 'cool'],
      'レッドトーン': ['red', 'warm'],
      'グリーントーン': ['green', 'fresh']
    };

    const colors: string[] = [];
    palette.forEach(p => {
      if (paletteMap[p]) {
        colors.push(...paletteMap[p]);
      }
    });

    return colors;
  }

  /**
   * 地点から美しいキーワードを生成
   */
  private locationToKeywords(location: Location): string[] {
    const keywords = ['scenic', 'beautiful'];
    
    if (location.type === 'fictional') {
      keywords.push('fantasy', 'magical', 'dreamlike');
    } else {
      keywords.push('realistic', 'travel', 'destination');
    }

    return keywords;
  }

  /**
   * Unsplash用の美しいタグを生成
   */
  private generateUnsplashTags(emotions: string[], settings: string[], locationType: string): string[] {
    const baseTags = ['landscape', 'nature', 'beautiful', 'scenic'];
    
    // 設定に基づく追加タグ
    if (settings.includes('都市夜景')) baseTags.push('city', 'night', 'lights');
    if (settings.includes('森林')) baseTags.push('forest', 'trees');
    if (settings.includes('海辺')) baseTags.push('ocean', 'beach');
    if (settings.includes('山岳')) baseTags.push('mountain', 'peak');
    if (settings.includes('空')) baseTags.push('sky', 'clouds');

    // 感情に基づく追加タグ
    if (emotions.includes('ロマンチック')) baseTags.push('romantic', 'sunset');
    if (emotions.includes('セレーン')) baseTags.push('peaceful', 'calm');
    if (emotions.includes('ミステリアス')) baseTags.push('mysterious', 'fog');

    return baseTags.slice(0, 5); // 最大5つのタグ
  }

  /**
   * 美しいUnsplash画像URLを生成
   */
  private generateUnsplashUrls(theme: ImageTheme, config: BeautifulImageConfig, seed: number): string[] {
    const urls: string[] = [];
    const { width, height } = config;

    // 複数のタグ組み合わせで美しい画像を取得
    const tagCombinations = [
      theme.unsplashTags.slice(0, 3).join(','),
      ['landscape', 'nature', ...theme.keywords.slice(0, 2)].join(','),
      ['scenic', 'beautiful', ...theme.emotions.slice(0, 1)].join(',')
    ];

    tagCombinations.forEach((tags, index) => {
      urls.push(`https://source.unsplash.com/${width}x${height}/?${tags}&sig=${seed + index}`);
    });

    return urls;
  }

  /**
   * キュレーションされたPicsum画像URLを生成
   */
  private generateCuratedPicsumUrls(theme: ImageTheme, config: BeautifulImageConfig, seed: number): string[] {
    const urls: string[] = [];
    const { width, height } = config;

    // 美しい風景写真のIDリスト（手動キュレーション）
    const beautifulImageIds = [
      1, 2, 3, 4, 5, 10, 13, 15, 20, 22, 24, 25, 26, 28, 29, 
      30, 42, 48, 49, 50, 52, 54, 56, 58, 60, 62, 63, 64, 65, 
      70, 72, 74, 75, 76, 78, 82, 83, 84, 85, 88, 90, 96, 98
    ];

    // テーマに基づいて適切な画像を選択
    const selectedIds = this.selectAppropriateImages(beautifulImageIds, theme, 3);
    
    selectedIds.forEach(id => {
      urls.push(`https://picsum.photos/id/${id}/${width}/${height}`);
    });

    return urls;
  }

  /**
   * テーマに適した画像IDを選択
   */
  private selectAppropriateImages(imageIds: number[], theme: ImageTheme, count: number): number[] {
    // シード値に基づいて一貫した選択
    const seed = theme.emotions.join('').length + theme.keywords.join('').length;
    const shuffled = [...imageIds];
    
    // シンプルなシャッフル
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }

  /**
   * 美しいグラデーション画像を生成
   */
  private generateBeautifulGradients(theme: ImageTheme, config: BeautifulImageConfig): string[] {
    const gradients = this.createThemeGradients(theme);
    return gradients.map(gradient => this.createGradientDataUrl(gradient, config));
  }

  /**
   * テーマに基づいたグラデーションを作成
   */
  private createThemeGradients(theme: ImageTheme): Array<{colors: string[], name: string}> {
    const emotionGradients: Record<string, {colors: string[], name: string}> = {
      'ミステリアス': { colors: ['#667eea', '#764ba2'], name: '神秘の霧' },
      'ロマンチック': { colors: ['#f093fb', '#f5576c'], name: '恋の調べ' },
      'エピック': { colors: ['#4facfe', '#00f2fe'], name: '英雄の空' },
      'ノスタルジック': { colors: ['#fad0c4', '#ffd1ff'], name: '記憶の彼方' },
      'セレーン': { colors: ['#a8edea', '#fed6e3'], name: '静寂の庭' },
      'ダーク': { colors: ['#2c3e50', '#4a6741'], name: '深淵の底' },
      'ジョイフル': { colors: ['#ffecd2', '#fcb69f'], name: '歓喜の光' },
      'メランコリック': { colors: ['#6c7b95', '#b2c6ee'], name: '憂愁の調べ' }
    };

    const gradients: Array<{colors: string[], name: string}> = [];

    // 感情に基づくグラデーション
    theme.emotions.forEach(emotion => {
      if (emotionGradients[emotion]) {
        gradients.push(emotionGradients[emotion]);
      }
    });

    // デフォルトの美しいグラデーション
    if (gradients.length === 0) {
      gradients.push({ colors: ['#667eea', '#764ba2'], name: 'CurioCity' });
    }

    return gradients.slice(0, 2); // 最大2つ
  }

  /**
   * CSS グラデーションを直接返す（テキストなし）
   */
  private createGradientDataUrl(gradient: {colors: string[], name: string}, config: BeautifulImageConfig): string {
    // SVGではなくCSS gradientを返す
    return `linear-gradient(135deg, ${gradient.colors[0]} 0%, ${gradient.colors[1]} 100%)`;
  }

  /**
   * シード値を生成
   */
  private generateSeed(trivia: TriviaItem, location: Location): number {
    const combined = `${trivia.title}-${location.name}-${trivia.tags.emotion.join('')}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export default SerenaMCPBeautifulImages;