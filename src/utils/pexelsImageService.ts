/**
 * Pexels API サービス - セマンティック理解ベースの画像検索システム
 * CurioCity用に雑学内容に最適化された画像選択を提供
 */

import type { TriviaItem, Location } from '../../types/trivia';

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsResponse {
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  total_results: number;
  next_page?: string;
}

export interface PexelsImageConfig {
  width: number;
  height: number;
  quality: 'original' | 'large2x' | 'large' | 'medium' | 'small';
  per_page: number;
}

export class PexelsImageService {
  private static instance: PexelsImageService;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.pexels.com/v1';
  private readonly rateLimit = {
    lastCall: 0,
    minInterval: 1000, // 1秒間隔（月200回制限対応）
  };
  private cache = new Map<string, { data: PexelsPhoto[]; timestamp: number }>();
  private readonly cacheExpiry = 24 * 60 * 60 * 1000; // 24時間キャッシュ

  constructor() {
    // 環境変数からAPIキーを取得
    this.apiKey = import.meta.env.VITE_PEXELS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ Pexels API key が設定されていません。Picsum Photo フォールバックを使用します。');
    }
  }

  public static getInstance(): PexelsImageService {
    if (!PexelsImageService.instance) {
      PexelsImageService.instance = new PexelsImageService();
    }
    return PexelsImageService.instance;
  }

  /**
   * 雑学内容からセマンティック検索クエリを生成
   */
  public generateSemanticQuery(trivia: TriviaItem, location: Location): string {
    console.log('🧠 セマンティック解析開始:', {
      title: trivia.title,
      location: location.name,
      emotion: trivia.tags.emotion,
      setting: trivia.tags.setting
    });

    // 1. 地域・場所の抽出（日本語→英語変換）
    const locationKeywords = this.extractLocationKeywords(trivia, location);
    
    // 2. 感情タグの英語変換
    const emotionKeywords = this.mapEmotionToSearchTerms(trivia.tags.emotion);
    
    // 3. 設定タグの英語変換
    const settingKeywords = this.mapSettingToSearchTerms(trivia.tags.setting);
    
    // 4. タイトルからキーワード抽出
    const titleKeywords = this.extractKeywordsFromTitle(trivia.title);
    
    // 5. 優先度に基づいてクエリを構築
    const queryParts = [
      ...locationKeywords,
      ...settingKeywords,
      ...emotionKeywords,
      ...titleKeywords
    ].filter(Boolean);

    const finalQuery = queryParts.slice(0, 3).join(' '); // 最大3つのキーワード
    
    console.log('✅ セマンティッククエリ生成完了:', {
      originalTitle: trivia.title,
      generatedQuery: finalQuery,
      components: {
        location: locationKeywords,
        setting: settingKeywords,
        emotion: emotionKeywords,
        title: titleKeywords
      }
    });

    return finalQuery || 'beautiful landscape'; // フォールバック
  }

  /**
   * 地域・場所キーワードの抽出
   */
  private extractLocationKeywords(trivia: TriviaItem, location: Location): string[] {
    const keywords: string[] = [];
    
    // 地点名の英語版
    if (location.nameEn && location.nameEn !== location.name) {
      keywords.push(location.nameEn.toLowerCase());
    }
    
    // 国名の英語化
    const countryMap: Record<string, string> = {
      'ペルー': 'peru',
      'フランス': 'france',
      '日本': 'japan',
      'エジプト': 'egypt',
      'インド': 'india',
      'アメリカ': 'usa america',
      'イタリア': 'italy',
      'ギリシャ': 'greece',
      'イギリス': 'england uk',
      'ドイツ': 'germany',
      '中国': 'china',
      'ブラジル': 'brazil'
    };
    
    if (location.country && countryMap[location.country]) {
      keywords.push(countryMap[location.country]);
    }
    
    // タイトルから特定の地名を抽出
    const locationPatterns = [
      { pattern: /ナスカ/, replacement: 'nazca' },
      { pattern: /エッフェル塔/, replacement: 'eiffel tower' },
      { pattern: /富士山/, replacement: 'mount fuji' },
      { pattern: /ピラミッド/, replacement: 'pyramid' },
      { pattern: /マチュピチュ/, replacement: 'machu picchu' },
      { pattern: /万里の長城/, replacement: 'great wall china' },
      { pattern: /タージマハル/, replacement: 'taj mahal' },
      { pattern: /コロッセオ/, replacement: 'colosseum' },
      { pattern: /パルテノン神殿/, replacement: 'parthenon' },
      { pattern: /ストーンヘンジ/, replacement: 'stonehenge' }
    ];
    
    locationPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(trivia.title)) {
        keywords.push(replacement);
      }
    });
    
    return keywords;
  }

  /**
   * 感情タグの英語変換
   */
  private mapEmotionToSearchTerms(emotions: string[]): string[] {
    const emotionMap: Record<string, string> = {
      'ミステリアス': 'mysterious dark moody',
      'ロマンチック': 'romantic sunset beautiful',
      'エピック': 'epic dramatic magnificent',
      'ノスタルジック': 'vintage nostalgic historic',
      'セレーン': 'peaceful serene calm',
      'ダーク': 'dark night shadows',
      'ジョイフル': 'bright colorful vibrant',
      'メランコリック': 'melancholic grey atmospheric'
    };
    
    return emotions
      .map(emotion => emotionMap[emotion])
      .filter(Boolean)
      .flatMap(terms => terms.split(' '));
  }

  /**
   * 設定タグの英語変換
   */
  private mapSettingToSearchTerms(settings: string[]): string[] {
    const settingMap: Record<string, string> = {
      '砂漠': 'desert sand dunes',
      '海辺': 'beach ocean coast',
      '森林': 'forest trees nature',
      '山岳': 'mountain peaks landscape',
      '湖': 'lake water reflection',
      '空': 'sky clouds horizon',
      '都市夜景': 'city skyline night',
      '古代遺跡': 'ancient ruins historical',
      '近未来都市': 'modern architecture futuristic',
      '氷原': 'ice snow arctic',
      '路地裏': 'alley street urban',
      '架空都市': 'fantasy magical ethereal'
    };
    
    return settings
      .map(setting => settingMap[setting])
      .filter(Boolean)
      .flatMap(terms => terms.split(' '));
  }

  /**
   * タイトルからキーワード抽出
   */
  private extractKeywordsFromTitle(title: string): string[] {
    const keywords: string[] = [];
    
    // 建築物・構造物
    if (/塔|タワー/.test(title)) keywords.push('tower');
    if (/神殿|寺院/.test(title)) keywords.push('temple');
    if (/城|宮殿/.test(title)) keywords.push('castle palace');
    if (/橋/.test(title)) keywords.push('bridge');
    if (/地上絵/.test(title)) keywords.push('lines patterns aerial');
    
    // 自然現象
    if (/火山/.test(title)) keywords.push('volcano');
    if (/滝/.test(title)) keywords.push('waterfall');
    if (/洞窟/.test(title)) keywords.push('cave');
    if (/温泉/.test(title)) keywords.push('hot spring');
    
    // 動植物
    if (/花|桜/.test(title)) keywords.push('flowers cherry blossom');
    if (/動物/.test(title)) keywords.push('animals wildlife');
    
    return keywords;
  }

  /**
   * Pexels APIから画像を検索
   */
  public async searchImages(
    query: string, 
    config: PexelsImageConfig = { 
      width: 1200, 
      height: 800, 
      quality: 'large', 
      per_page: 8 
    }
  ): Promise<PexelsPhoto[]> {
    
    if (!this.apiKey) {
      console.warn('⚠️ Pexels API key未設定 - 空配列を返します');
      return [];
    }

    // キャッシュチェック
    const cacheKey = `${query}_${config.per_page}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📦 Pexelsキャッシュヒット:', query);
      return cached.data;
    }

    // レート制限チェック
    const now = Date.now();
    const timeSinceLastCall = now - this.rateLimit.lastCall;
    if (timeSinceLastCall < this.rateLimit.minInterval) {
      const waitTime = this.rateLimit.minInterval - timeSinceLastCall;
      console.log(`⏱️ Pexelsレート制限: ${waitTime}ms待機`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    try {
      this.rateLimit.lastCall = Date.now();
      
      const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&per_page=${config.per_page}&orientation=landscape`;
      
      console.log('🔍 Pexels API呼び出し:', { query, url });
      
      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey,
          'User-Agent': 'CurioCity/1.0'
        },
        signal: AbortSignal.timeout(8000) // 8秒タイムアウト
      });

      if (!response.ok) {
        throw new Error(`Pexels API エラー: ${response.status} ${response.statusText}`);
      }

      const data: PexelsResponse = await response.json();
      console.log('✅ Pexels API成功:', { 
        query, 
        totalResults: data.total_results, 
        receivedPhotos: data.photos.length 
      });

      // キャッシュに保存
      this.cache.set(cacheKey, {
        data: data.photos,
        timestamp: Date.now()
      });

      return data.photos;

    } catch (error) {
      console.error('❌ Pexels API呼び出し失敗:', error);
      return [];
    }
  }

  /**
   * セマンティック理解ベースで画像URLリストを生成
   */
  public async generateSemanticImageUrls(
    trivia: TriviaItem, 
    location: Location,
    config: PexelsImageConfig = { width: 1200, height: 800, quality: 'large', per_page: 6 }
  ): Promise<string[]> {
    
    console.log('🎨 セマンティック画像URL生成開始:', {
      trivia: trivia.title,
      location: location.name
    });

    const urls: string[] = [];

    try {
      // メインクエリでの検索
      const mainQuery = this.generateSemanticQuery(trivia, location);
      const mainPhotos = await this.searchImages(mainQuery, { ...config, per_page: 4 });
      
      // Pexels画像URLを追加
      mainPhotos.forEach(photo => {
        urls.push(photo.src[config.quality] || photo.src.large);
      });

      // フォールバック検索（より汎用的なクエリ）
      if (urls.length < 2) {
        const fallbackQuery = this.generateFallbackQuery(trivia);
        const fallbackPhotos = await this.searchImages(fallbackQuery, { ...config, per_page: 3 });
        
        fallbackPhotos.forEach(photo => {
          urls.push(photo.src[config.quality] || photo.src.large);
        });
      }

    } catch (error) {
      console.error('❌ Pexels画像生成エラー:', error);
    }

    console.log('📸 セマンティック画像URL生成完了:', { 
      totalUrls: urls.length,
      sources: 'Pexels API' 
    });

    return urls;
  }

  /**
   * フォールバック検索クエリの生成
   */
  private generateFallbackQuery(trivia: TriviaItem): string {
    const emotion = trivia.tags.emotion[0] || 'ミステリアス';
    // const _setting = trivia.tags.setting[0] || '空';
    
    const fallbackQueries: Record<string, string> = {
      'ミステリアス': 'mysterious landscape',
      'ロマンチック': 'romantic scenery',
      'エピック': 'epic nature',
      'ノスタルジック': 'vintage landscape',
      'セレーン': 'peaceful nature',
      'ダーク': 'dark atmospheric',
      'ジョイフル': 'beautiful colorful',
      'メランコリック': 'moody landscape'
    };
    
    return fallbackQueries[emotion] || 'beautiful landscape';
  }

  /**
   * APIキーの有効性チェック
   */
  public isApiKeyAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * キャッシュクリア
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Pexelsキャッシュをクリアしました');
  }
}

// シングルトンインスタンスをエクスポート
export const pexelsImageService = PexelsImageService.getInstance();