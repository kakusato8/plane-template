/**
 * インテリジェント画像予測エンジン
 * ユーザーの選択傾向と雑学の関連性から次の画像を予測
 */

import type { TriviaItem, Location } from '../../types/trivia';

interface PredictionContext {
  currentTrivia: TriviaItem;
  currentLocation: Location;
  visitedTriviaIds: number[];
  visitedLocationIds: string[];
  userPreferences: UserPreferenceProfile;
}

interface UserPreferenceProfile {
  favoriteEmotions: Map<string, number>; // 感情タグの選択重み
  favoriteSettings: Map<string, number>; // 環境タグの選択重み
  favoritePalettes: Map<string, number>; // 色彩タグの選択重み
  avgSessionTime: number; // 平均セッション時間（秒）
  preferredComplexity: 'simple' | 'moderate' | 'complex';
  explorationPattern: 'sequential' | 'random' | 'thematic'; // 探索パターン
}

interface ImagePrediction {
  imageUrl: string;
  trivia: TriviaItem;
  location: Location;
  confidence: number; // 0-1の予測信頼度
  priority: 'critical' | 'high' | 'normal' | 'low';
  reason: string; // 予測理由（デバッグ用）
}

interface PredictionAnalytics {
  totalPredictions: number;
  accurateHits: number;
  accuracyRate: number;
  avgConfidence: number;
  commonPatterns: string[];
}

export class ImagePredictionEngine {
  private static instance: ImagePredictionEngine;
  private userProfile: UserPreferenceProfile;
  private analytics: PredictionAnalytics;
  private tagRelationships: Map<string, Map<string, number>> = new Map(); // タグ間の関連度
  
  private constructor() {
    this.userProfile = this.initializeUserProfile();
    this.analytics = {
      totalPredictions: 0,
      accurateHits: 0,
      accuracyRate: 0,
      avgConfidence: 0,
      commonPatterns: []
    };
    this.buildTagRelationships();
  }

  public static getInstance(): ImagePredictionEngine {
    if (!ImagePredictionEngine.instance) {
      ImagePredictionEngine.instance = new ImagePredictionEngine();
    }
    return ImagePredictionEngine.instance;
  }

  /**
   * ユーザープロファイルの初期化
   */
  private initializeUserProfile(): UserPreferenceProfile {
    return {
      favoriteEmotions: new Map([
        ['ミステリアス', 0.1],
        ['ロマンチック', 0.1],
        ['エピック', 0.1],
        ['セレーン', 0.1],
        ['ジョイフル', 0.1]
      ]),
      favoriteSettings: new Map([
        ['都市夜景', 0.1],
        ['古代遺跡', 0.1],
        ['森林', 0.1],
        ['海辺', 0.1],
        ['山岳', 0.1]
      ]),
      favoritePalettes: new Map([
        ['パステル', 0.1],
        ['ビビッド', 0.1],
        ['アースカラー', 0.1],
        ['ネオン', 0.1],
        ['モノクロ', 0.1]
      ]),
      avgSessionTime: 30,
      preferredComplexity: 'moderate',
      explorationPattern: 'thematic'
    };
  }

  /**
   * タグ間の関連性データを構築
   */
  private buildTagRelationships(): void {
    // 感情と環境の関連性
    this.setRelationship('ミステリアス', '古代遺跡', 0.9);
    this.setRelationship('ミステリアス', '砂漠', 0.7);
    this.setRelationship('ロマンチック', '都市夜景', 0.8);
    this.setRelationship('ロマンチック', '海辺', 0.7);
    this.setRelationship('エピック', '山岳', 0.8);
    this.setRelationship('エピック', '近未来都市', 0.7);
    this.setRelationship('セレーン', '森林', 0.9);
    this.setRelationship('セレーン', '湖', 0.8);
    this.setRelationship('ノスタルジック', '路地裏', 0.8);
    
    // 環境と色彩の関連性
    this.setRelationship('砂漠', 'アースカラー', 0.9);
    this.setRelationship('海辺', 'ブルートーン', 0.8);
    this.setRelationship('森林', 'グリーントーン', 0.9);
    this.setRelationship('都市夜景', 'ネオン', 0.7);
    this.setRelationship('古代遺跡', 'セピア', 0.8);
    this.setRelationship('近未来都市', 'ビビッド', 0.7);
  }

  /**
   * タグ間の関連性を設定
   */
  private setRelationship(tag1: string, tag2: string, strength: number): void {
    if (!this.tagRelationships.has(tag1)) {
      this.tagRelationships.set(tag1, new Map());
    }
    if (!this.tagRelationships.has(tag2)) {
      this.tagRelationships.set(tag2, new Map());
    }
    
    this.tagRelationships.get(tag1)!.set(tag2, strength);
    this.tagRelationships.get(tag2)!.set(tag1, strength);
  }

  /**
   * ユーザーの選択から学習してプロファイルを更新
   */


  /**
   * 次の画像を予測（優先度順）
   */
  predictNextImages(context: PredictionContext, candidateTrivia: TriviaItem[], candidateLocations: Location[]): ImagePrediction[] {
    const predictions: ImagePrediction[] = [];
    
    // 各雑学と地点の組み合わせを評価
    for (const trivia of candidateTrivia) {
      if (context.visitedTriviaIds.includes(trivia.id)) continue;
      
      for (const location of candidateLocations) {
        if (context.visitedLocationIds.includes(location.id)) continue;
        
        const prediction = this.evaluatePrediction(context, trivia, location);
        if (prediction.confidence > 0.2) { // 閾値以上のもののみ
          predictions.push(prediction);
        }
      }
    }

    // 信頼度順にソート
    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // 上位10個
  }

  /**
   * 単一の雑学-地点組み合わせを評価
   */
  private evaluatePrediction(context: PredictionContext, trivia: TriviaItem, location: Location): ImagePrediction {
    let confidence = 0;
    const reasons: string[] = [];

    // 1. ユーザー嗜好との一致度
    const preferenceScore = this.calculatePreferenceScore(trivia);
    confidence += preferenceScore * 0.4;
    if (preferenceScore > 0.5) {
      reasons.push(`ユーザー嗜好一致(${(preferenceScore * 100).toFixed(0)}%)`);
    }

    // 2. 現在の雑学との関連性
    const relevanceScore = this.calculateRelevanceScore(context.currentTrivia, trivia);
    confidence += relevanceScore * 0.3;
    if (relevanceScore > 0.4) {
      reasons.push(`関連性一致(${(relevanceScore * 100).toFixed(0)}%)`);
    }

    // 3. 地点の適合性
    const locationScore = this.calculateLocationFit(trivia, location);
    confidence += locationScore * 0.2;
    if (locationScore > 0.6) {
      reasons.push(`地点適合(${(locationScore * 100).toFixed(0)}%)`);
    }

    // 4. 最近の選択傾向
    const trendScore = 0; // Simplified since no choice system
    confidence += trendScore * 0.1;
    if (trendScore > 0.5) {
      reasons.push(`トレンド一致(${(trendScore * 100).toFixed(0)}%)`);
    }

    // 優先度の決定
    let priority: 'critical' | 'high' | 'normal' | 'low';
    if (confidence > 0.8) priority = 'critical';
    else if (confidence > 0.6) priority = 'high';
    else if (confidence > 0.4) priority = 'normal';
    else priority = 'low';

    return {
      imageUrl: this.generateImageUrl(trivia, location),
      trivia,
      location,
      confidence: Math.min(1.0, confidence),
      priority,
      reason: reasons.join(', ') || '基本適合'
    };
  }

  /**
   * ユーザー嗜好スコアを計算
   */
  private calculatePreferenceScore(trivia: TriviaItem): number {
    let score = 0;
    let totalWeight = 0;

    // 感情タグのスコア
    trivia.tags.emotion.forEach(emotion => {
      const weight = this.userProfile.favoriteEmotions.get(emotion) || 0;
      score += weight;
      totalWeight += 1;
    });

    // 環境タグのスコア  
    trivia.tags.setting.forEach(setting => {
      const weight = this.userProfile.favoriteSettings.get(setting) || 0;
      score += weight;
      totalWeight += 1;
    });

    // 色彩タグのスコア
    trivia.tags.palette.forEach(palette => {
      const weight = this.userProfile.favoritePalettes.get(palette) || 0;
      score += weight;
      totalWeight += 1;
    });

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * 雑学間の関連性スコアを計算
   */
  private calculateRelevanceScore(currentTrivia: TriviaItem, candidateTrivia: TriviaItem): number {
    let score = 0;
    // let comparisons = 0;

    const currentTags = [
      ...currentTrivia.tags.emotion,
      ...currentTrivia.tags.setting, 
      ...currentTrivia.tags.palette
    ];

    const candidateTags = [
      ...candidateTrivia.tags.emotion,
      ...candidateTrivia.tags.setting,
      ...candidateTrivia.tags.palette
    ];

    // 直接的なタグ一致
    const commonTags = currentTags.filter(tag => candidateTags.includes(tag));
    score += commonTags.length * 0.3;

    // 関連タグによる間接的な関連性
    for (const currentTag of currentTags) {
      for (const candidateTag of candidateTags) {
        const relationship = this.tagRelationships.get(currentTag)?.get(candidateTag) || 0;
        score += relationship * 0.2;
      }
    }

    // 地理的近接性（座標が両方にある場合）
    if (currentTrivia.coords && candidateTrivia.coords) {
      const distance = this.calculateDistance(
        currentTrivia.coords.lat, currentTrivia.coords.lng,
        candidateTrivia.coords.lat, candidateTrivia.coords.lng
      );
      if (distance < 1000) { // 1000km以内
        score += (1000 - distance) / 1000 * 0.2;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * 地点適合性スコアを計算
   */
  private calculateLocationFit(trivia: TriviaItem, location: Location): number {
    let score = 0;

    // 地点の雰囲気と雑学タグの一致
    const triviaAtmosphere = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...trivia.tags.palette
    ];

    const matchingAtmosphere = location.atmosphere.filter(tag => 
      triviaAtmosphere.includes(tag)
    );
    score += matchingAtmosphere.length * 0.3;

    // 地点タイプとの適合性
    if (location.type === 'real' && trivia.coords) {
      score += 0.2; // 実在地点 × 実在雑学
    } else if (location.type === 'fictional' && 
               trivia.tags.emotion.includes('ミステリアス')) {
      score += 0.2; // 架空地点 × 神秘的雑学
    }

    return Math.min(1.0, score);
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
   * 画像URLを生成（既存システムを利用）
   */
  private generateImageUrl(trivia: TriviaItem, location: Location): string {
    // TriviaDisplaySystemのメソッドを再利用
    const atmosphereTags = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...trivia.tags.palette
    ];

    const combinedAtmosphere = [...atmosphereTags, ...location.atmosphere];
    const atmosphereHash = this.generateHashFromTags(combinedAtmosphere);
    const imageId = (atmosphereHash % 100) + 1;
    
    if (location.type === 'fictional') {
      return `https://picsum.photos/1920/1080?random=${imageId}&blur=1`;
    }
    
    return `https://picsum.photos/1920/1080?random=${imageId}`;
  }

  /**
   * タグからハッシュを生成
   */
  private generateHashFromTags(tags: string[]): number {
    const uniqueTags = [...new Set(tags)].sort();
    const combinedString = uniqueTags.join('');
    
    let hash = 0;
    for (let i = 0; i < combinedString.length; i++) {
      const char = combinedString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash);
  }

  /**
   * 予測の精度を記録
   */
  recordPredictionAccuracy(predictedImageUrl: string, actualImageUrl: string): void {
    this.analytics.totalPredictions++;
    
    if (predictedImageUrl === actualImageUrl) {
      this.analytics.accurateHits++;
    }

    this.analytics.accuracyRate = this.analytics.accurateHits / this.analytics.totalPredictions;
  }

  /**
   * 予測分析データを取得
   */
  getAnalytics(): PredictionAnalytics & {
    userProfile: UserPreferenceProfile;
    topEmotions: Array<{ tag: string; weight: number; }>;
    topSettings: Array<{ tag: string; weight: number; }>;
    topPalettes: Array<{ tag: string; weight: number; }>;
  } {
    const topEmotions = Array.from(this.userProfile.favoriteEmotions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, weight]) => ({ tag, weight }));

    const topSettings = Array.from(this.userProfile.favoriteSettings.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, weight]) => ({ tag, weight }));

    const topPalettes = Array.from(this.userProfile.favoritePalettes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, weight]) => ({ tag, weight }));

    return {
      ...this.analytics,
      userProfile: this.userProfile,
      topEmotions,
      topSettings,
      topPalettes
    };
  }

  /**
   * プロファイルをリセット（新規セッション用）
   */
  resetProfile(): void {
    this.userProfile = this.initializeUserProfile();
  }
}