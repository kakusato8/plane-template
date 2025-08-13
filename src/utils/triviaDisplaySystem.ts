import type { TriviaItem, Location, UserChoice } from '../../types/trivia';
import { ImageSourceManager } from './imageSourceManager';

/**
 * 雑学表示システム - 地点と雑学の関連性管理
 */
export class TriviaDisplaySystem {
  private static instance: TriviaDisplaySystem;
  private predictionEngine: unknown = null; // 循環参照を避けるため動的インポート
  private imageSourceManager: ImageSourceManager;

  private constructor() {
    this.imageSourceManager = ImageSourceManager.getInstance();
  }

  public static getInstance(): TriviaDisplaySystem {
    if (!TriviaDisplaySystem.instance) {
      TriviaDisplaySystem.instance = new TriviaDisplaySystem();
    }
    return TriviaDisplaySystem.instance;
  }

  /**
   * 地点に基づいて背景画像URLを生成（多層フォールバック方式）
   */
  async generateBackgroundImageUrl(trivia: TriviaItem, location: Location): Promise<string> {
    // 雰囲気タグに基づいて適切な画像を選択
    const atmosphereTags = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...trivia.tags.palette,
      ...location.atmosphere
    ];

    // デバッグ情報を出力
    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ 多層背景画像URL生成:', {
        triviaId: trivia.id,
        triviaTitle: trivia.title,
        locationId: location.id,
        locationName: location.name,
        atmosphereTags,
        locationType: location.type
      });
    }
    
    try {
      // ImageSourceManagerを使用して複数の画像URLを取得
      const imageUrls = await this.imageSourceManager.generateImageUrls(
        atmosphereTags,
        { width: 1920, height: 1080 }
      );
      
      // 最初のURL（最高優先度）を返す
      const primaryUrl = imageUrls[0];
      console.log('✅ 優先画像URL選択:', primaryUrl);
      return primaryUrl;
      
    } catch (error) {
      console.warn('❌ 画像URL生成エラー、緊急フォールバック使用:', error);
      
      // 緊急フォールバック: シンプルなグラデーション生成
      return this.generateEmergencyFallback(atmosphereTags);
    }
  }

  /**
   * 複数の画像URLを優先度順で取得（マルチソース用）
   */
  async generateBackgroundImageUrls(trivia: TriviaItem, location: Location): Promise<string[]> {
    const atmosphereTags = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...trivia.tags.palette,
      ...location.atmosphere
    ];

    try {
      const imageUrls = await this.imageSourceManager.generateImageUrls(
        atmosphereTags,
        { width: 1920, height: 1080 }
      );
      
      console.log('🎯 複数画像URL生成完了:', imageUrls.length, '件');
      return imageUrls;
      
    } catch (error) {
      console.warn('❌ 複数画像URL生成エラー:', error);
      
      // 少なくとも1つのフォールバックURLを返す
      const fallbackUrl = this.generateEmergencyFallback(atmosphereTags);
      return [fallbackUrl];
    }
  }

  /**
   * 緊急時のフォールバック画像URL生成
   */
  private generateEmergencyFallback(tags: string[]): string {
    const gradientMap: { [key: string]: { start: string; end: string } } = {
      'ミステリアス': { start: '#667eea', end: '#764ba2' },
      'ロマンチック': { start: '#f093fb', end: '#f5576c' },
      'エピック': { start: '#4facfe', end: '#00f2fe' },
      'ノスタルジック': { start: '#ffecd2', end: '#fcb69f' },
      'セレーン': { start: '#a8edea', end: '#fed6e3' },
      'ダーク': { start: '#232526', end: '#414345' },
      'ジョイフル': { start: '#ff9a9e', end: '#fecfef' },
      'メランコリック': { start: '#667db6', end: '#0082c8' }
    };

    // 最初にマッチする雰囲気タグを使用
    for (const tag of tags) {
      if (gradientMap[tag]) {
        const gradient = gradientMap[tag];
        const svg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)" />
        </svg>`;
        
        console.log('🚨 緊急フォールバック生成:', tag, gradient);
        return `data:image/svg+xml;base64,${btoa(svg)}`;
      }
    }

    // デフォルト緊急フォールバック
    const defaultSvg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>`;
    
    console.log('🚨 デフォルト緊急フォールバック使用');
    return `data:image/svg+xml;base64,${btoa(defaultSvg)}`;
  }
  async generateMultipleBackgroundImageUrls(trivia: TriviaItem, location: Location): Promise<string[]> {
    const atmosphereTags = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...trivia.tags.palette
    ];

    const combinedAtmosphere = [...atmosphereTags, ...location.atmosphere];
    const atmosphereHash = generateHashFromTags(combinedAtmosphere);
    
    const imageContext: ImageContext = {
      trivia,
      location,
      width: 1920,
      height: 1080,
      quality: 'medium',
      atmosphereHash
    };

    try {
      const urls = await this.imageManager.getImageUrls(imageContext);
      return urls.length > 0 ? urls : [this.generateFallbackImageUrl(trivia, location)];
    } catch (error) {
      console.warn('複数画像URL生成でエラー:', error);
      return [this.generateFallbackImageUrl(trivia, location)];
    }
  }

  /**
   * フォールバック画像URL（従来方式）
   */
  private generateFallbackImageUrl(trivia: TriviaItem, location: Location): string {
    const atmosphereTags = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...trivia.tags.palette
    ];
    const combinedAtmosphere = [...atmosphereTags, ...location.atmosphere];
    const atmosphereHash = generateHashFromTags(combinedAtmosphere);
    const imageId = (atmosphereHash % 1000) + 1;
    
    if (location.type === 'fictional') {
      return `https://picsum.photos/id/${imageId}/1920/1080?blur=2`;
    } else {
      return `https://picsum.photos/id/${imageId}/1920/1080`;
    }
  }

  // generateHashFromTags は imageSourceManager.ts に移動済み

  /**
   * 雑学と地点の関連スコアを計算
   */
  calculateRelevanceScore(trivia: TriviaItem, location: Location): number {
    let score = 0;

    // 座標による関連性（雑学に座標がある場合）
    if (trivia.coords) {
      const distance = this.calculateDistance(
        trivia.coords.lat,
        trivia.coords.lng,
        location.coords.lat,
        location.coords.lng
      );
      
      // 距離が近いほど高スコア（最大500km圏内で評価）
      if (distance <= 500) {
        score += (500 - distance) / 10; // 0-50点
      }
    }

    // 雰囲気タグによる関連性
    const triviaAtmosphere = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...trivia.tags.palette
    ];

    const commonTags = location.atmosphere.filter(tag => 
      triviaAtmosphere.includes(tag)
    );

    score += commonTags.length * 10; // 共通タグ1つあたり10点

    // ボーナススコア
    // 実在地点 × 実在雑学のボーナス
    if (location.type === 'real' && trivia.coords) {
      score += 5;
    }

    // 架空地点 × 幻想的雑学のボーナス
    if (location.type === 'fictional' && 
        triviaAtmosphere.includes('ミステリアス')) {
      score += 8;
    }

    return Math.max(0, score);
  }

  /**
   * 2点間の距離を計算（km）
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // 地球の半径（km）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 雑学の読書時間を推定（秒）
   */
  estimateReadingTime(trivia: TriviaItem): number {
    // 日本語の平均読書速度: 約400-600文字/分
    const averageSpeed = 500; // 文字/分
    
    const totalChars = trivia.title.length + trivia.short.length + trivia.detail.length;
    const minutes = totalChars / averageSpeed;
    
    // 最低15秒、最大180秒
    return Math.max(15, Math.min(180, Math.round(minutes * 60)));
  }

  /**
   * 雑学の複雑度レベルを計算
   */
  calculateComplexityLevel(trivia: TriviaItem): 'simple' | 'moderate' | 'complex' {
    const detailLength = trivia.detail.length;
    const tagCount = trivia.tags.emotion.length + 
                    trivia.tags.setting.length + 
                    trivia.tags.palette.length;
    
    const complexityScore = (detailLength / 100) + (tagCount / 2);
    
    if (complexityScore < 2) return 'simple';
    if (complexityScore < 4) return 'moderate';
    return 'complex';
  }

  /**
   * 表示オプションを生成
   */
  generateDisplayOptions(trivia: TriviaItem, location: Location) {
    const relevanceScore = this.calculateRelevanceScore(trivia, location);
    const readingTime = this.estimateReadingTime(trivia);
    const complexity = this.calculateComplexityLevel(trivia);
    
    return {
      relevanceScore,
      readingTime,
      complexity,
      backgroundUrl: this.generateBackgroundImageUrl(trivia, location),
      shouldShowAnimation: relevanceScore > 20,
      transitionDuration: complexity === 'complex' ? 800 : 600,
      overlayOpacity: location.type === 'fictional' ? 0.5 : 0.3,
    };
  }

  /**
   * 雑学のカテゴリを推定
   */
  categorizeTrivia(trivia: TriviaItem): string[] {
    const categories: string[] = [];
    
    // 地理・場所関連
    if (trivia.coords || trivia.tags.setting.some(tag => 
        ['都市夜景', '古代遺跡', '砂漠', '海辺', '山岳'].includes(tag)
    )) {
      categories.push('地理・場所');
    }
    
    // 歴史・文化関連
    if (trivia.tags.setting.includes('古代遺跡') || 
        trivia.title.includes('古代') || 
        trivia.detail.includes('歴史')) {
      categories.push('歴史・文化');
    }
    
    // 建築・技術関連
    if (trivia.title.includes('建築') || 
        trivia.title.includes('建設') ||
        trivia.tags.setting.some(tag => ['都市夜景', '近未来都市'].includes(tag))) {
      categories.push('建築・技術');
    }
    
    // 自然・科学関連
    if (trivia.tags.setting.some(tag => 
        ['森林', '砂漠', '海辺', '山岳', '氷原', '空'].includes(tag)
    )) {
      categories.push('自然・科学');
    }
    
    // ミステリー・謎関連
    if (trivia.tags.emotion.includes('ミステリアス') ||
        trivia.title.includes('謎') ||
        trivia.detail.includes('不思議')) {
      categories.push('ミステリー・謎');
    }
    
    return categories.length > 0 ? categories : ['一般'];
  }

  /**
   * 関連キーワードを抽出
   */
  extractKeywords(trivia: TriviaItem, location: Location): string[] {
    const keywords: string[] = [];
    
    // 地点名からキーワードを抽出
    keywords.push(location.name, location.country, location.region);
    
    // 雑学タイトルから重要語を抽出（簡易版）
    const importantWords = trivia.title
      .replace(/[、。！？]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2);
    
    keywords.push(...importantWords);
    
    // 雰囲気タグを追加
    keywords.push(...trivia.tags.emotion, ...trivia.tags.setting, ...trivia.tags.palette);
    
    // 重複を除去し、最大10個まで
    return [...new Set(keywords)].slice(0, 10);
  }

  /**
   * 予測エンジンとの連携初期化
   */
  private async initializePredictionEngine() {
    if (!this.predictionEngine) {
      try {
        const { ImagePredictionEngine } = await import('./imagePredictionEngine');
        this.predictionEngine = ImagePredictionEngine.getInstance();
      } catch (error) {
        console.warn('Failed to initialize prediction engine:', error);
      }
    }
  }

  /**
   * 次の雑学候補を予測的にフィルタリング
   */
  async generatePredictiveRecommendations(
    currentTrivia: TriviaItem,
    currentLocation: Location,
    visitedTriviaIds: number[],
    visitedLocationIds: string[],
    recentChoices: UserChoice[],
    availableTrivia: TriviaItem[],
    availableLocations: Location[]
  ): Promise<Array<{ trivia: TriviaItem; location: Location; score: number; reason: string; }>> {
    await this.initializePredictionEngine();
    
    if (!this.predictionEngine) {
      // フォールバック：基本的な関連性スコアのみ
      return this.generateBasicRecommendations(
        currentTrivia, 
        currentLocation, 
        availableTrivia, 
        availableLocations, 
        visitedTriviaIds, 
        visitedLocationIds
      );
    }

    try {
      const predictionContext = {
        currentTrivia,
        currentLocation,
        visitedTriviaIds,
        visitedLocationIds,
        recentChoices,
        userPreferences: (this.predictionEngine as any)?.getAnalytics()?.userProfile
      };

      const predictions = (this.predictionEngine as any).predictNextImages(
        predictionContext,
        availableTrivia,
        availableLocations
      );

      return predictions.map((p: any) => ({
        trivia: p.trivia,
        location: p.location,
        score: p.confidence * 100,
        reason: p.reason || 'AI prediction'
      }));
    } catch (error) {
      console.warn('Predictive recommendations failed, falling back to basic:', error);
      return this.generateBasicRecommendations(
        currentTrivia, 
        currentLocation, 
        availableTrivia, 
        availableLocations, 
        visitedTriviaIds, 
        visitedLocationIds
      );
    }
  }

  /**
   * 基本的な推奨システム（フォールバック用）
   */
  private generateBasicRecommendations(
    currentTrivia: TriviaItem,
    _currentLocation: Location,
    availableTrivia: TriviaItem[],
    availableLocations: Location[],
    visitedTriviaIds: number[],
    visitedLocationIds: string[]
  ): Array<{ trivia: TriviaItem; location: Location; score: number; reason: string; }> {
    const recommendations = [];
    
    for (const trivia of availableTrivia) {
      if (visitedTriviaIds.includes(trivia.id)) continue;
      
      for (const location of availableLocations) {
        if (visitedLocationIds.includes(location.id)) continue;
        
        const relevanceScore = this.calculateRelevanceScore(trivia, location);
        const thematicScore = this.calculateThematicSimilarity(currentTrivia, trivia);
        const score = (relevanceScore + thematicScore) / 2;
        
        if (score > 10) { // 閾値
          recommendations.push({
            trivia,
            location,
            score,
            reason: `関連性:${relevanceScore.toFixed(0)} テーマ:${thematicScore.toFixed(0)}`
          });
        }
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  /**
   * テーマ的類似性を計算
   */
  private calculateThematicSimilarity(trivia1: TriviaItem, trivia2: TriviaItem): number {
    const tags1 = [
      ...trivia1.tags.emotion,
      ...trivia1.tags.setting,
      ...trivia1.tags.palette
    ];
    const tags2 = [
      ...trivia2.tags.emotion,
      ...trivia2.tags.setting,
      ...trivia2.tags.palette
    ];

    const commonTags = tags1.filter(tag => tags2.includes(tag));
    const totalUniqueTags = new Set([...tags1, ...tags2]).size;
    
    return totalUniqueTags > 0 ? (commonTags.length / totalUniqueTags) * 100 : 0;
  }

  /**
   * 動的品質調整のための画像URL生成
   */
  generateBackgroundImageUrlWithQuality(
    trivia: TriviaItem, 
    location: Location, 
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): string {
    const baseUrl = this.generateBackgroundImageUrl(trivia, location);
    
    // 品質に応じたパラメータ調整
    const qualityMap = {
      low: { size: 0.5, quality: 60, blur: 2 },
      medium: { size: 1, quality: 80, blur: 0 },
      high: { size: 1.2, quality: 95, blur: 0 }
    };
    
    const params = qualityMap[quality];
    const baseSize = 1920;
    const targetSize = Math.round(baseSize * params.size);
    
    // URLパラメータを調整
    const url = new URL(baseUrl);
    url.searchParams.set('w', targetSize.toString());
    url.searchParams.set('h', Math.round(targetSize * 0.5625).toString()); // 16:9
    url.searchParams.set('q', params.quality.toString());
    
    if (params.blur > 0) {
      url.searchParams.set('blur', params.blur.toString());
    }
    
    return url.toString();
  }

  /**
   * 次の推奨雑学を提案するためのコンテキスト生成
   */
  generateRecommendationContext(trivia: TriviaItem, location: Location) {
    const categories = this.categorizeTrivia(trivia);
    const keywords = this.extractKeywords(trivia, location);
    const complexity = this.calculateComplexityLevel(trivia);
    
    return {
      categories,
      keywords,
      complexity,
      preferredAtmosphere: [
        ...trivia.tags.emotion,
        ...location.atmosphere
      ],
      avoidancePatterns: [], // 将来的に実装: ユーザーが飽きそうなパターン
    };
  }
}