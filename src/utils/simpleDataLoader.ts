import type { TriviaItem, TriviaData, Location } from '../../types/trivia';

/**
 * シンプルな雑学データローダー（Serena MCP対応）
 * バリデーションを最小限に抑えて確実に動作
 */
export class SimpleDataLoader {
  private static instance: SimpleDataLoader;
  private triviaData: TriviaData | null = null;
  private locationsData: Location[] | null = null;

  private constructor() {}

  public static getInstance(): SimpleDataLoader {
    if (!SimpleDataLoader.instance) {
      SimpleDataLoader.instance = new SimpleDataLoader();
    }
    return SimpleDataLoader.instance;
  }

  /**
   * 雑学データを読み込み
   */
  async loadTriviaData(): Promise<TriviaData> {
    if (this.triviaData) {
      console.log('雑学データ: キャッシュから取得');
      return this.triviaData;
    }

    console.log('雑学データを読み込み中...');
    
    try {
      const response = await fetch('/data/trivia.json', {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('フェッチレスポンス:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('取得したデータ:', typeof data, Array.isArray(data) ? `${data.length}件` : 'not array');
      
      if (!Array.isArray(data)) {
        throw new Error('雑学データが配列ではありません');
      }

      if (data.length === 0) {
        throw new Error('雑学データが空です');
      }

      // 基本的な型チェックのみ
      const validData = data.filter((item, index) => {
        const isValid = item && 
          typeof item.id === 'number' && 
          typeof item.title === 'string' && 
          typeof item.short === 'string' &&
          typeof item.detail === 'string' &&
          item.tags && 
          Array.isArray(item.tags.emotion) &&
          Array.isArray(item.tags.setting) &&
          Array.isArray(item.tags.palette);
        
        if (!isValid) {
          console.warn(`無効な雑学データ (index ${index}):`, item);
        }
        return isValid;
      });

      console.log(`✅ 雑学データを${validData.length}件読み込み完了`);
      this.triviaData = validData as TriviaData;
      return this.triviaData;

    } catch (error) {
      console.error('❌ 雑学データの読み込みエラー:', error);
      console.log('フォールバックデータを使用します');
      // フォールバックデータを返す
      this.triviaData = this.getFallbackTriviaData();
      return this.triviaData;
    }
  }

  /**
   * 地点データを読み込み
   */
  async loadLocations(): Promise<Location[]> {
    if (this.locationsData) {
      console.log('地点データ: キャッシュから取得');
      return this.locationsData;
    }

    console.log('地点データを読み込み中...');
    
    try {
      const response = await fetch('/data/locations.json', {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('地点フェッチレスポンス:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('取得した地点データ:', typeof data, Array.isArray(data) ? `${data.length}件` : 'not array');
      
      if (!Array.isArray(data)) {
        throw new Error('地点データが配列ではありません');
      }

      if (data.length === 0) {
        throw new Error('地点データが空です');
      }

      // 基本的な型チェックのみ
      const validData = data.filter((item, index) => {
        const isValid = item && 
          typeof item.id === 'string' && 
          typeof item.name === 'string' && 
          Array.isArray(item.atmosphere);
        
        if (!isValid) {
          console.warn(`無効な地点データ (index ${index}):`, item);
        }
        return isValid;
      });

      console.log(`✅ 地点データを${validData.length}件読み込み完了`);
      this.locationsData = validData as Location[];
      return this.locationsData;

    } catch (error) {
      console.error('❌ 地点データの読み込みエラー:', error);
      console.log('フォールバック地点データを使用します');
      this.locationsData = this.getFallbackLocationData();
      return this.locationsData;
    }
  }

  /**
   * ランダムな雑学を取得
   */
  getRandomTrivia(excludeIds: number[] = []): TriviaItem | null {
    if (!this.triviaData || this.triviaData.length === 0) {
      return null;
    }

    const availableTrivia = this.triviaData.filter(item => 
      !excludeIds.includes(item.id)
    );

    if (availableTrivia.length === 0) {
      // 除外リストが多すぎる場合は最初の雑学を返す
      return this.triviaData[0];
    }

    const randomIndex = Math.floor(Math.random() * availableTrivia.length);
    return availableTrivia[randomIndex];
  }

  /**
   * IDで雑学を取得
   */
  getTriviaById(id: number): TriviaItem | null {
    return this.triviaData?.find(item => item.id === id) || null;
  }

  /**
   * フォールバック雑学データ
   */
  private getFallbackTriviaData(): TriviaData {
    return [
      {
        id: 1,
        title: "ペルーのナスカの地上絵は、地上からは全貌を見られない",
        short: "ナスカの地上絵は空からしか全貌を確認できない",
        detail: "ペルーのナスカ地方に広がる巨大な地上絵群は、紀元前後から数百年かけて描かれたとされる。地上からは全体像がわからず、空から見ることで初めてその姿を認識できる。最大のものは200メートルを超える。",
        tags: {
          emotion: ["ミステリアス", "エピック"],
          setting: ["砂漠", "古代遺跡"],
          palette: ["アースカラー", "セピア"]
        },
        coords: {
          lat: -14.739,
          lng: -75.130
        },
        images: ["nasca1.jpg", "nasca2.jpg"]
      },
      {
        id: 2,
        title: "エッフェル塔は夏と冬で高さが変わる",
        short: "気温により金属が膨張・収縮するため",
        detail: "パリの象徴エッフェル塔は鉄製のため、夏の暑さで金属が膨張し、約15cm高くなる。逆に冬は収縮して低くなる。この現象は建設当初から計算されていた。",
        tags: {
          emotion: ["驚き", "知的好奇心"],
          setting: ["都市", "建造物"],
          palette: ["グレー", "ブルー"]
        },
        coords: {
          lat: 48.8584,
          lng: 2.2945
        },
        images: ["eiffel1.jpg", "eiffel2.jpg"]
      }
    ];
  }

  /**
   * フォールバック地点データ
   */
  private getFallbackLocationData(): Location[] {
    return [
      {
        id: "nasca",
        name: "ナスカ高原",
        nameEn: "Nazca Plateau",
        type: "real" as const,
        weight: 1.0,
        atmosphere: ["ミステリアス", "砂漠", "古代遺跡", "アースカラー"],
        coords: { lat: -14.739, lng: -75.130 },
        description: "謎に満ちた地上絵で有名な乾燥した高原地帯",
        country: "Peru",
        region: "South America",
        timeZone: "America/Lima"
      },
      {
        id: "paris",
        name: "パリ",
        nameEn: "Paris",
        type: "real" as const,
        weight: 1.0,
        atmosphere: ["ロマンチック", "都市", "建造物", "ブルー"],
        coords: { lat: 48.8566, lng: 2.3522 },
        description: "光の都として知られる美しいヨーロッパの都市",
        country: "France",
        region: "Europe",
        timeZone: "Europe/Paris"
      }
    ];
  }

  /**
   * データの統計情報を取得
   */
  getStats() {
    return {
      triviaCount: this.triviaData?.length || 0,
      locationCount: this.locationsData?.length || 0,
      isLoaded: !!(this.triviaData && this.locationsData)
    };
  }

  /**
   * 雑学に適した地点を選択
   */
  selectLocationForTrivia(trivia: TriviaItem): Location | null {
    if (!this.locationsData || this.locationsData.length === 0) {
      return null;
    }

    // 雑学のタグと地点の雰囲気が一致するものを探す
    const triviaAtmosphere = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...trivia.tags.palette
    ];

    const matchingLocations = this.locationsData.filter(location => 
      location.atmosphere.some(atmosphere => 
        triviaAtmosphere.includes(atmosphere)
      )
    );

    if (matchingLocations.length > 0) {
      const randomIndex = Math.floor(Math.random() * matchingLocations.length);
      return matchingLocations[randomIndex];
    }

    // マッチしない場合は最初の地点を返す
    return this.locationsData[0];
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.triviaData = null;
    this.locationsData = null;
  }
}