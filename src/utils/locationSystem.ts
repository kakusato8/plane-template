import type { Location, TriviaItem } from '../../types/trivia';

/**
 * 地点管理システム
 */
export class LocationSystem {
  private static instance: LocationSystem;
  private locations: Location[] = [];
  private visitedLocationIds: string[] = [];

  private constructor() {}

  public static getInstance(): LocationSystem {
    if (!LocationSystem.instance) {
      LocationSystem.instance = new LocationSystem();
    }
    return LocationSystem.instance;
  }

  /**
   * 地点データを読み込み
   */
  async loadLocations(): Promise<Location[]> {
    if (this.locations.length > 0) return this.locations;

    try {
      const response = await fetch('/data/locations.json');
      if (!response.ok) {
        throw new Error(`地点データの読み込みに失敗: ${response.status}`);
      }
      this.locations = await response.json() as Location[];
      return this.locations;
    } catch (error) {
      console.error('地点データの読み込みエラー:', error);
      throw error;
    }
  }

  /**
   * 重み付きランダム選択アルゴリズム
   */
  selectRandomLocation(excludeIds: string[] = []): Location | null {
    const availableLocations = this.locations.filter(
      location => !excludeIds.includes(location.id)
    );

    if (availableLocations.length === 0) return null;

    // 重みの合計を計算
    const totalWeight = availableLocations.reduce((sum, location) => sum + location.weight, 0);
    
    if (totalWeight === 0) {
      // 重みがすべて0の場合は等確率で選択
      const randomIndex = Math.floor(Math.random() * availableLocations.length);
      return availableLocations[randomIndex];
    }

    // 重み付きランダム選択
    let randomWeight = Math.random() * totalWeight;
    
    for (const location of availableLocations) {
      randomWeight -= location.weight;
      if (randomWeight <= 0) {
        return location;
      }
    }

    // フォールバック（通常は到達しない）
    return availableLocations[availableLocations.length - 1];
  }

  /**
   * 雑学データに最適な地点を選択
   */
  selectLocationForTrivia(trivia: TriviaItem): Location | null {
    // 雑学に座標が設定されている場合、近い地点を探す
    if (trivia.coords) {
      const nearbyLocation = this.findNearestLocation(trivia.coords.lat, trivia.coords.lng);
      if (nearbyLocation) return nearbyLocation;
    }

    // タグに基づいて適合する地点を探す
    const compatibleLocations = this.findCompatibleLocations(trivia);
    
    if (compatibleLocations.length === 0) {
      // 適合する地点がない場合はランダム選択
      return this.selectRandomLocation();
    }

    // 適合する地点の中から重み付きランダム選択
    const totalWeight = compatibleLocations.reduce((sum, location) => sum + location.weight, 0);
    let randomWeight = Math.random() * totalWeight;

    for (const location of compatibleLocations) {
      randomWeight -= location.weight;
      if (randomWeight <= 0) {
        return location;
      }
    }

    return compatibleLocations[0];
  }

  /**
   * タグに基づいて適合する地点を検索（改良版）
   */
  private findCompatibleLocations(trivia: TriviaItem): Location[] {
    // セマンティック関連度を計算して地点をスコアリング
    return this.locations.filter(location => {
      const score = this.calculateSemanticCompatibility(trivia, location);
      return score > 0;
    }).sort((a, b) => {
      const aScore = this.calculateSemanticCompatibility(trivia, a);
      const bScore = this.calculateSemanticCompatibility(trivia, b);
      
      if (aScore !== bScore) {
        return bScore - aScore; // スコアの降順
      }
      return b.weight - a.weight; // 重みの降順
    });
  }

  /**
   * セマンティック互換性スコアを計算
   */
  private calculateSemanticCompatibility(trivia: TriviaItem, location: Location): number {
    let score = 0;

    const triviaAtmosphere = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...trivia.tags.palette
    ];

    // 直接的な一致（基本スコア）
    const directMatches = location.atmosphere.filter(atmosphere =>
      triviaAtmosphere.includes(atmosphere)
    ).length;
    score += directMatches * 10;

    // カテゴリ別の重み付けスコア
    // 感情タグの一致
    const emotionMatches = location.atmosphere.filter(atmosphere =>
      trivia.tags.emotion.includes(atmosphere)
    ).length;
    score += emotionMatches * 15; // 感情の一致は重要

    // 設定タグの一致
    const settingMatches = location.atmosphere.filter(atmosphere =>
      trivia.tags.setting.includes(atmosphere)
    ).length;
    score += settingMatches * 12; // 設定の一致も重要

    // パレットタグの一致
    const paletteMatches = location.atmosphere.filter(atmosphere =>
      trivia.tags.palette.includes(atmosphere)
    ).length;
    score += paletteMatches * 8; // パレットの一致は少し低め

    // セマンティック関連性（類似語・関連概念の判定）
    score += this.calculateSemanticRelations(trivia, location);

    // 地点タイプボーナス
    if (location.type === 'real' && trivia.coords) {
      score += 5; // 実在地点と座標付き雑学の組み合わせ
    }
    
    if (location.type === 'fictional' && 
        trivia.tags.emotion.some(emotion => 
          ['ミステリアス', 'エピック', 'ダーク'].includes(emotion)
        )) {
      score += 8; // 幻想的地点と神秘的雑学の組み合わせ
    }

    return Math.max(0, score);
  }

  /**
   * セマンティック関連性を計算
   */
  private calculateSemanticRelations(trivia: TriviaItem, location: Location): number {
    let relationScore = 0;

    // 関連概念マップ
    const semanticRelations: Record<string, string[]> = {
      // 感情の関連性
      'ミステリアス': ['ダーク', 'エピック', 'メランコリック', '古代遺跡', '洞窟'],
      'ロマンチック': ['ノスタルジック', 'セレーン', '都市夜景', '海辺', 'パステル'],
      'エピック': ['ミステリアス', '山岳', '古代遺跡', '砂漠', 'ゴールド'],
      'セレーン': ['ロマンチック', '湖', '森林', '空', 'ブルートーン'],
      'ダーク': ['ミステリアス', 'メランコリック', '路地裏', '森林', 'モノクロ'],
      'ジョイフル': ['ビビッド', 'パステル', '都市夜景', '海辺'],
      'ノスタルジック': ['ロマンチック', 'セピア', '古代遺跡', '路地裏'],
      'メランコリック': ['ダーク', 'ミステリアス', 'モノクロ', '湖', '氷原'],

      // 設定の関連性
      '都市夜景': ['ロマンチック', 'ネオン', 'ビビッド', '路地裏'],
      '古代遺跡': ['ミステリアス', 'エピック', 'アースカラー', '砂漠'],
      '近未来都市': ['ビビッド', 'ネオン', 'ダーク', '都市夜景'],
      '森林': ['セレーン', 'グリーントーン', '自然', '湖'],
      '砂漠': ['エピック', 'アースカラー', '古代遺跡', 'ゴールド'],
      '海辺': ['ロマンチック', 'セレーン', 'ブルートーン', 'パステル'],
      '山岳': ['エピック', 'セレーン', '自然', 'ブルートーン'],
      '氷原': ['セレーン', 'メランコリック', 'ブルートーン', 'モノクロ'],
      '湖': ['セレーン', 'ロマンチック', 'ブルートーン', '森林'],
      '空': ['セレーン', 'エピック', 'ブルートーン', 'パステル'],
      '路地裏': ['ダーク', 'ノスタルジック', '都市夜景', 'セピア'],
      '架空都市': ['ミステリアス', 'エピック', 'ビビッド', '近未来都市']
    };

    const triviaAtmosphere = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...trivia.tags.palette
    ];

    // 各雑学タグに対して関連地点属性をチェック
    triviaAtmosphere.forEach(triviaTag => {
      const relatedConcepts = semanticRelations[triviaTag] || [];
      const relatedMatches = location.atmosphere.filter(locationAttr =>
        relatedConcepts.includes(locationAttr)
      ).length;
      
      relationScore += relatedMatches * 3; // 関連性スコア
    });

    // 地点属性に対しても逆方向チェック
    location.atmosphere.forEach(locationAttr => {
      const relatedConcepts = semanticRelations[locationAttr] || [];
      const relatedMatches = triviaAtmosphere.filter(triviaTag =>
        relatedConcepts.includes(triviaTag)
      ).length;
      
      relationScore += relatedMatches * 2; // 少し低めのスコア
    });

    // タイトルベースのキーワード関連性
    relationScore += this.calculateTitleKeywordRelatedness(trivia, location);

    return relationScore;
  }

  /**
   * タイトルキーワードとの関連性を計算
   */
  private calculateTitleKeywordRelatedness(trivia: TriviaItem, location: Location): number {
    let score = 0;
    const title = trivia.title.toLowerCase();
    const locationName = location.name.toLowerCase();
    const locationCountry = location.country.toLowerCase();

    // 地名の直接言及
    if (title.includes(locationName) || title.includes(locationCountry)) {
      score += 20;
    }

    // キーワードマッチング
    const geographyKeywords: Record<string, string[]> = {
      '山': ['富士山', '山岳', 'エピック', 'セレーン'],
      '海': ['海辺', 'ブルートーン', 'セレーン'],
      '砂漠': ['砂漠', 'アースカラー', 'エピック'],
      '都市': ['都市夜景', '近未来都市', 'ビビッド'],
      '遺跡': ['古代遺跡', 'ミステリアス', 'エピック'],
      '島': ['海辺', 'セレーン', 'パステル'],
      '氷': ['氷原', 'ブルートーン', 'セレーン'],
      '森': ['森林', 'グリーントーン', 'セレーン']
    };

    Object.entries(geographyKeywords).forEach(([keyword, relatedAttrs]) => {
      if (title.includes(keyword)) {
        const matches = location.atmosphere.filter(attr => 
          relatedAttrs.includes(attr)
        ).length;
        score += matches * 5;
      }
    });

    return score;
  }

  /**
   * 指定座標に最も近い地点を検索
   */
  private findNearestLocation(lat: number, lng: number, maxDistance: number = 500): Location | null {
    let nearestLocation: Location | null = null;
    let minDistance = Infinity;

    for (const location of this.locations) {
      const distance = this.calculateDistance(lat, lng, location.coords.lat, location.coords.lng);
      
      if (distance <= maxDistance && distance < minDistance) {
        minDistance = distance;
        nearestLocation = location;
      }
    }

    return nearestLocation;
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
   * 地点の詳細情報を取得
   */
  getLocationById(id: string): Location | null {
    return this.locations.find(location => location.id === id) || null;
  }

  /**
   * 地域別の地点を取得
   */
  getLocationsByRegion(region: string): Location[] {
    return this.locations.filter(location => location.region === region);
  }

  /**
   * タイプ別の地点を取得
   */
  getLocationsByType(type: 'real' | 'fictional'): Location[] {
    return this.locations.filter(location => location.type === type);
  }

  /**
   * 雰囲気別の地点を検索
   */
  searchLocationsByAtmosphere(atmospheres: string[]): Location[] {
    return this.locations.filter(location =>
      atmospheres.some(atmosphere => location.atmosphere.includes(atmosphere))
    ).sort((a, b) => {
      const aMatchCount = a.atmosphere.filter(atmosphere => 
        atmospheres.includes(atmosphere)
      ).length;
      const bMatchCount = b.atmosphere.filter(atmosphere => 
        atmospheres.includes(atmosphere)
      ).length;
      return bMatchCount - aMatchCount;
    });
  }

  /**
   * 訪問済み地点を記録
   */
  markAsVisited(locationId: string): void {
    if (!this.visitedLocationIds.includes(locationId)) {
      this.visitedLocationIds.push(locationId);
    }
  }

  /**
   * 訪問済み地点のリセット
   */
  resetVisitedLocations(): void {
    this.visitedLocationIds = [];
  }

  /**
   * 訪問済み地点の一覧を取得
   */
  getVisitedLocations(): Location[] {
    return this.locations.filter(location => 
      this.visitedLocationIds.includes(location.id)
    );
  }

  /**
   * 統計情報を取得
   */
  getStatistics() {
    const realCount = this.locations.filter(l => l.type === 'real').length;
    const fictionalCount = this.locations.filter(l => l.type === 'fictional').length;
    
    const regionStats = this.locations.reduce((acc, location) => {
      acc[location.region] = (acc[location.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLocations: this.locations.length,
      realLocations: realCount,
      fictionalLocations: fictionalCount,
      visitedCount: this.visitedLocationIds.length,
      regionDistribution: regionStats,
      visitedPercentage: Math.round((this.visitedLocationIds.length / this.locations.length) * 100)
    };
  }

  /**
   * ユーザー選択の targetTags に基づいて次の地点を選択
   */
  selectLocationByChoiceTags(targetTags: string[], excludeIds: string[] = []): Location | null {
    const availableLocations = this.locations.filter(location => 
      !excludeIds.includes(location.id) && 
      !this.visitedLocationIds.includes(location.id)
    );

    if (availableLocations.length === 0) {
      // 訪問済み地点しかない場合は除外条件を緩和
      const fallbackLocations = this.locations.filter(location => 
        !excludeIds.includes(location.id)
      );
      if (fallbackLocations.length === 0) return null;
      return this.selectRandomLocation(excludeIds);
    }

    // targetTags に基づいて適合度スコアを計算
    const scoredLocations = availableLocations.map(location => ({
      location,
      score: this.calculateChoiceCompatibility(targetTags, location)
    })).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scoredLocations.length === 0) {
      // 適合する地点がない場合はランダム選択
      return this.selectRandomLocation([...excludeIds, ...this.visitedLocationIds]);
    }

    // 上位候補から重み付きランダム選択
    const topCandidates = scoredLocations.slice(0, Math.min(3, scoredLocations.length));
    const totalScore = topCandidates.reduce((sum, item) => sum + item.score, 0);
    
    let randomWeight = Math.random() * totalScore;
    for (const candidate of topCandidates) {
      randomWeight -= candidate.score;
      if (randomWeight <= 0) {
        return candidate.location;
      }
    }

    return topCandidates[0].location;
  }

  /**
   * 選択肢タグとの適合性スコアを計算
   */
  private calculateChoiceCompatibility(targetTags: string[], location: Location): number {
    let score = 0;

    // 直接的なタグマッチング
    const directMatches = location.atmosphere.filter(atmosphere =>
      targetTags.includes(atmosphere)
    ).length;
    score += directMatches * 20;

    // セマンティック関連性（改良版）
    const semanticRelations: Record<string, string[]> = {
      // 雰囲気ベースの選択肢
      '神秘的': ['ミステリアス', 'ダーク', 'エピック', '古代遺跡', '洞窟', '架空都市'],
      '明るい': ['ジョイフル', 'セレーン', '海辺', '森林', 'パステル', 'ビビッド'],
      '静寂': ['セレーン', 'メランコリック', '湖', '氷原', 'ブルートーン', 'モノクロ'],
      '壮大': ['エピック', '山岳', '砂漠', '古代遺跡', 'ゴールド', 'ビビッド'],
      
      // 地域ベースの選択肢
      '東洋': ['日本', '中国', '韓国', '東南アジア', 'アースカラー'],
      '西洋': ['ヨーロッパ', 'アメリカ', 'オセアニア', 'クラシック'],
      '架空世界': ['架空都市', 'ファンタジー', 'ミステリアス', 'エピック'],
      
      // 時代ベースの選択肢
      '古代': ['古代遺跡', 'アースカラー', 'セピア', 'ミステリアス'],
      '現代': ['都市夜景', '近未来都市', 'ネオン', 'ビビッド'],
      '未来': ['近未来都市', 'ネオン', 'ビビッド', 'ダーク'],
      
      // 感情ベースの選択肢
      '冒険': ['エピック', '山岳', '砂漠', '海辺', '森林'],
      '発見': ['ミステリアス', '古代遺跡', '洞窟', '架空都市'],
      '癒し': ['セレーン', '森林', '湖', '海辺', 'パステル'],
      '驚き': ['ミステリアス', 'エピック', '架空都市', 'ビビッド']
    };

    // セマンティック関連性スコア
    targetTags.forEach(tag => {
      const relatedConcepts = semanticRelations[tag] || [];
      const relatedMatches = location.atmosphere.filter(atmosphere =>
        relatedConcepts.includes(atmosphere)
      ).length;
      score += relatedMatches * 10;
    });

    // 地点タイプボーナス
    if (targetTags.includes('架空世界') && location.type === 'fictional') {
      score += 15;
    }
    if (targetTags.includes('現実世界') && location.type === 'real') {
      score += 15;
    }

    // 重みボーナス（人気地点の優先）
    score += location.weight * 2;

    return Math.max(0, score);
  }

  /**
   * 地点推奨システム
   */
  getRecommendations(currentLocation: Location, count: number = 3): Location[] {
    const candidates = this.locations.filter(location => 
      location.id !== currentLocation.id && 
      !this.visitedLocationIds.includes(location.id)
    );

    if (candidates.length === 0) return [];

    // 現在の地点と似た雰囲気の地点を優先
    const scored = candidates.map(candidate => {
      const atmosphereMatch = candidate.atmosphere.filter(atmosphere =>
        currentLocation.atmosphere.includes(atmosphere)
      ).length;
      
      const regionBonus = candidate.region === currentLocation.region ? 2 : 0;
      const typeBonus = candidate.type !== currentLocation.type ? 1 : 0; // 異なるタイプにボーナス
      
      return {
        location: candidate,
        score: atmosphereMatch + regionBonus + typeBonus + (candidate.weight / 2)
      };
    }).sort((a, b) => b.score - a.score);

    return scored.slice(0, count).map(item => item.location);
  }
}