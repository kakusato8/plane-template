import type { TriviaData, TagDefinition } from '../../types/trivia';
import { DataValidator } from './dataValidator';
import { DataCache } from './dataCache';

/**
 * データ読み込み機能
 */

export class DataLoader {
  private static instance: DataLoader;
  private triviaData: TriviaData | null = null;
  private tagDefinition: TagDefinition | null = null;
  private validator: DataValidator | null = null;
  private loadPromise: Promise<TriviaData> | null = null;
  private tagLoadPromise: Promise<TagDefinition> | null = null;
  private lastLoadTime: number = 0;
  private cacheExpiry: number = 5 * 60 * 1000; // 5分
  private imagePreloadCache: Map<string, boolean> = new Map();
  private cache: DataCache;

  private constructor() {
    this.cache = DataCache.getInstance();
  }

  public static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  /**
   * タグ定義を読み込み（高度なキャッシュ対応）
   */
  async loadTagDefinition(): Promise<TagDefinition> {
    const cacheKey = 'tags-definition';
    
    // キャッシュから確認
    const cached = await this.cache.get<TagDefinition>(cacheKey);
    if (cached) {
      this.tagDefinition = cached;
      return cached;
    }

    // 既に読み込み中の場合は既存のPromiseを返す
    if (this.tagLoadPromise) {
      return this.tagLoadPromise;
    }

    this.tagLoadPromise = this.performTagLoad();
    
    try {
      const result = await this.tagLoadPromise;
      this.lastLoadTime = Date.now();
      
      // キャッシュに保存
      await this.cache.set(cacheKey, result, this.cacheExpiry);
      
      return result;
    } finally {
      this.tagLoadPromise = null;
    }
  }

  private async performTagLoad(): Promise<TagDefinition> {
    try {
      const response = await fetch('/data/tags.json', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`タグ定義の読み込みに失敗: ${response.status}`);
      }
      
      this.tagDefinition = await response.json() as TagDefinition;
      return this.tagDefinition;
    } catch (error) {
      console.error('タグ定義の読み込みエラー:', error);
      throw error;
    }
  }

  /**
   * 雑学データを段階的読み込み（初期表示用の最小データのみ）
   */
  async loadInitialTriviaData(limit: number = 10): Promise<TriviaData> {
    const cacheKey = `trivia-data-initial-${limit}`;
    
    // キャッシュから確認
    const cached = await this.cache.get<TriviaData>(cacheKey);
    if (cached) {
      this.preloadImages(cached);
      return cached;
    }

    try {
      // 全データを読み込み
      const fullData = await this.loadTriviaData();
      
      // 重要度に基づいて上位データを選択
      const initialData = this.selectInitialData(fullData, limit);
      
      // 初期データをキャッシュ
      await this.cache.set(cacheKey, initialData, this.cacheExpiry);
      
      // バックグラウンドで画像をプリロード
      this.preloadImages(initialData);
      
      return initialData;
    } catch (error) {
      console.error('初期雑学データの読み込みエラー:', error);
      throw error;
    }
  }

  /**
   * 雑学データを読み込み（高度なキャッシュ・プリロード対応）
   */
  async loadTriviaData(): Promise<TriviaData> {
    const cacheKey = 'trivia-data';
    
    // キャッシュから確認
    const cached = await this.cache.get<TriviaData>(cacheKey);
    if (cached) {
      this.triviaData = cached;
      // バックグラウンドで画像をプリロード
      this.preloadImages(cached);
      return cached;
    }

    // 既に読み込み中の場合は既存のPromiseを返す
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.performTriviaLoad();
    
    try {
      const result = await this.loadPromise;
      this.lastLoadTime = Date.now();
      
      // キャッシュに保存（圧縮有効）
      await this.cache.set(cacheKey, result, this.cacheExpiry);
      
      // バックグラウンドで画像をプリロード
      this.preloadImages(result);
      
      return result;
    } finally {
      this.loadPromise = null;
    }
  }

  private async performTriviaLoad(): Promise<TriviaData> {
    try {
      // タグ定義を先に読み込み
      const tagDefinition = await this.loadTagDefinition();
      this.validator = new DataValidator(tagDefinition);

      // 雑学データを読み込み
      const response = await fetch('/data/trivia.json', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`雑学データの読み込みに失敗: ${response.status}`);
      }

      const data = await response.json();

      // データを検証
      if (!this.validator.validateTriviaData(data)) {
        throw new Error('雑学データの形式が正しくありません');
      }

      // データの整合性をチェック
      const integrity = this.validator.checkDataIntegrity(data);
      if (!integrity.isValid) {
        console.error('データ整合性エラー:', integrity.errors);
        throw new Error(`データ整合性エラー: ${integrity.errors.join(', ')}`);
      }

      if (integrity.warnings.length > 0) {
        console.warn('データ警告:', integrity.warnings);
      }

      this.triviaData = data;
      return this.triviaData;
    } catch (error) {
      console.error('雑学データの読み込みエラー:', error);
      throw error;
    }
  }

  /**
   * キャッシュの有効性をチェック
   * 注意: 現在は高度なキャッシュシステム（DataCache）を使用
   */
  // @ts-ignore: 将来使用予定
  private isCacheValid(): boolean {
    return Date.now() - this.lastLoadTime < this.cacheExpiry;
  }

  /**
   * 画像の事前読み込み
   */
  private preloadImages(triviaData: TriviaData): void {
    // バックグラウンドで重要な画像をプリロード
    const preloadLimit = 10; // 一度に10枚までプリロード
    let preloadCount = 0;

    triviaData.slice(0, 20).forEach(trivia => {
      if (preloadCount >= preloadLimit) return;

      trivia.images.slice(0, 1).forEach(imageName => { // 各雑学の最初の画像のみ
        if (this.imagePreloadCache.has(imageName)) return;

        const img = new Image();
        img.onload = () => {
          this.imagePreloadCache.set(imageName, true);
        };
        img.onerror = () => {
          this.imagePreloadCache.set(imageName, false);
        };

        // 画像パスを実際のURLに変換（プレースホルダーとして）
        img.src = `/images/trivia/${imageName}`;
        preloadCount++;
      });
    });
  }

  /**
   * 雑学データをIDで取得
   */
  getTriviaById(id: number): TriviaData[0] | null {
    if (!this.triviaData) return null;
    return this.triviaData.find(item => item.id === id) || null;
  }

  /**
   * タグに基づく雑学データの検索
   */
  searchByTags(
    emotionTags?: string[],
    settingTags?: string[],
    paletteTags?: string[]
  ): TriviaData {
    if (!this.triviaData) return [];

    return this.triviaData.filter(item => {
      const emotionMatch = !emotionTags || 
        emotionTags.some(tag => item.tags.emotion.includes(tag));
      const settingMatch = !settingTags || 
        settingTags.some(tag => item.tags.setting.includes(tag));
      const paletteMatch = !paletteTags || 
        paletteTags.some(tag => item.tags.palette.includes(tag));

      return emotionMatch && settingMatch && paletteMatch;
    });
  }

  /**
   * ランダムな雑学データを取得
   */
  getRandomTrivia(excludeIds: number[] = []): TriviaData[0] | null {
    if (!this.triviaData) return null;

    const availableTrivia = this.triviaData.filter(
      item => !excludeIds.includes(item.id)
    );

    if (availableTrivia.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * availableTrivia.length);
    return availableTrivia[randomIndex];
  }

  /**
   * 座標に基づく雑学データの検索
   */
  searchByLocation(lat: number, lng: number, radius: number = 100): TriviaData {
    if (!this.triviaData) return [];

    return this.triviaData.filter(item => {
      if (!item.coords) return false;

      // 簡単な距離計算（実際にはより正確な計算が必要）
      const distance = Math.sqrt(
        Math.pow(item.coords.lat - lat, 2) + Math.pow(item.coords.lng - lng, 2)
      );

      return distance <= radius;
    });
  }

  /**
   * データのリロード
   */
  async reloadData(): Promise<void> {
    this.triviaData = null;
    this.tagDefinition = null;
    this.validator = null;
    await this.loadTriviaData();
  }

  /**
   * 初期表示用のデータを重要度に基づいて選択
   */
  private selectInitialData(fullData: TriviaData, limit: number): TriviaData {
    // データに優先度スコアを付与
    const scoredData = fullData.map(item => ({
      ...item,
      priority: this.calculatePriority(item)
    }));

    // 優先度でソートして上位を選択
    return scoredData
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit)
      .map(({ priority, ...item }) => item); // priorityプロパティを除去
  }

  /**
   * 雑学データの優先度を計算
   */
  private calculatePriority(item: TriviaData[0]): number {
    let score = 0;

    // 座標がある場合の優先度アップ
    if (item.coords) score += 10;

    // 画像がある場合の優先度アップ
    score += Math.min(item.images.length * 2, 6);

    // 詳細が適度な長さの場合の優先度アップ
    const detailLength = item.detail.length;
    if (detailLength >= 200 && detailLength <= 500) {
      score += 8;
    } else if (detailLength > 500) {
      score += 4;
    }

    // 複数のタグを持つ場合の優先度アップ
    const totalTags = item.tags.emotion.length + item.tags.setting.length + item.tags.palette.length;
    score += Math.min(totalTags, 10);

    // ランダム要素を追加（完全に固定化させない）
    score += Math.random() * 3;

    return score;
  }

  /**
   * 追加データを段階的に読み込み
   */
  async loadAdditionalData(offset: number, limit: number = 20): Promise<TriviaData> {
    const cacheKey = `trivia-data-additional-${offset}-${limit}`;
    
    // キャッシュから確認
    const cached = await this.cache.get<TriviaData>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 全データを取得
      const fullData = await this.loadTriviaData();
      
      // 指定範囲のデータを取得
      const additionalData = fullData.slice(offset, offset + limit);
      
      // キャッシュに保存
      await this.cache.set(cacheKey, additionalData, this.cacheExpiry);
      
      return additionalData;
    } catch (error) {
      console.error('追加データの読み込みエラー:', error);
      throw error;
    }
  }

  /**
   * データを条件に基づいて段階的に読み込み
   */
  async loadDataByCondition(
    conditions: {
      tags?: { emotion?: string[]; setting?: string[]; palette?: string[] };
      hasCoords?: boolean;
      minDetailLength?: number;
      maxDetailLength?: number;
    },
    limit: number = 20
  ): Promise<TriviaData> {
    const cacheKey = `trivia-data-condition-${JSON.stringify(conditions)}-${limit}`;
    
    // キャッシュから確認
    const cached = await this.cache.get<TriviaData>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const fullData = await this.loadTriviaData();
      
      let filteredData = fullData;

      // 条件に基づいてフィルタリング
      if (conditions.tags) {
        filteredData = this.searchByTags(
          conditions.tags.emotion,
          conditions.tags.setting,
          conditions.tags.palette
        );
      }

      if (conditions.hasCoords !== undefined) {
        filteredData = filteredData.filter(item => 
          conditions.hasCoords ? !!item.coords : !item.coords
        );
      }

      if (conditions.minDetailLength !== undefined) {
        filteredData = filteredData.filter(item => 
          item.detail.length >= conditions.minDetailLength!
        );
      }

      if (conditions.maxDetailLength !== undefined) {
        filteredData = filteredData.filter(item => 
          item.detail.length <= conditions.maxDetailLength!
        );
      }

      // 制限数まで取得
      const resultData = filteredData.slice(0, limit);
      
      // キャッシュに保存
      await this.cache.set(cacheKey, resultData, this.cacheExpiry);
      
      return resultData;
    } catch (error) {
      console.error('条件付きデータの読み込みエラー:', error);
      throw error;
    }
  }

  /**
   * 現在読み込まれているデータの統計情報
   */
  getDataStats() {
    if (!this.triviaData) return null;

    return {
      totalItems: this.triviaData.length,
      itemsWithCoords: this.triviaData.filter(item => item.coords).length,
      averageDetailLength: Math.round(
        this.triviaData.reduce((sum, item) => sum + item.detail.length, 0) / this.triviaData.length
      ),
      totalImages: this.triviaData.reduce((sum, item) => sum + item.images.length, 0),
      // 新しい統計情報
      tagStats: this.getTagStats(),
      priorityDistribution: this.getPriorityDistribution()
    };
  }

  /**
   * タグの統計情報
   */
  private getTagStats() {
    if (!this.triviaData) return null;

    const tagCount = {
      emotion: new Map<string, number>(),
      setting: new Map<string, number>(),
      palette: new Map<string, number>()
    };

    this.triviaData.forEach(item => {
      item.tags.emotion.forEach(tag => {
        tagCount.emotion.set(tag, (tagCount.emotion.get(tag) || 0) + 1);
      });
      item.tags.setting.forEach(tag => {
        tagCount.setting.set(tag, (tagCount.setting.get(tag) || 0) + 1);
      });
      item.tags.palette.forEach(tag => {
        tagCount.palette.set(tag, (tagCount.palette.get(tag) || 0) + 1);
      });
    });

    return {
      emotion: Object.fromEntries(tagCount.emotion),
      setting: Object.fromEntries(tagCount.setting),
      palette: Object.fromEntries(tagCount.palette)
    };
  }

  /**
   * 優先度分布の統計
   */
  private getPriorityDistribution() {
    if (!this.triviaData) return null;

    const priorities = this.triviaData.map(item => this.calculatePriority(item));
    const distribution = {
      high: priorities.filter(p => p >= 20).length,
      medium: priorities.filter(p => p >= 10 && p < 20).length,
      low: priorities.filter(p => p < 10).length
    };

    return {
      ...distribution,
      average: priorities.reduce((sum, p) => sum + p, 0) / priorities.length
    };
  }
}