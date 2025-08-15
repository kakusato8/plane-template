import type { TriviaItem, TriviaData, Location } from '../../types/trivia';

/**
 * プログレッシブデータローダー (Serena MCP対応)
 * ユーザーに気づかれない段階的データ読み込み
 */

interface LoadingStage {
  name: string;
  priority: number;
  completed: boolean;
  data?: any;
  loadTime?: number;
}

interface ProgressiveLoadingState {
  isInitialLoaded: boolean;
  currentStage: number;
  totalStages: number;
  backgroundProgress: number; // 0-100
  error?: string;
}

export class ProgressiveDataLoader {
  private static instance: ProgressiveDataLoader;
  
  // 最小限の初期データ（即座起動用）
  private initialTriviaData: TriviaData = [];
  private initialLocationData: Location[] = [];
  
  // 段階的に読み込まれる完全データ
  private fullTriviaData: TriviaData | null = null;
  private fullLocationData: Location[] | null = null;
  
  // 読み込み段階管理
  private loadingStages: LoadingStage[] = [
    { name: 'minimal-startup', priority: 1, completed: false },
    { name: 'core-trivia', priority: 2, completed: false },
    { name: 'core-locations', priority: 3, completed: false },
    { name: 'extended-trivia', priority: 4, completed: false },
    { name: 'extended-locations', priority: 5, completed: false },
    { name: 'image-preload', priority: 6, completed: false },
  ];
  
  private loadingState: ProgressiveLoadingState = {
    isInitialLoaded: false,
    currentStage: 0,
    totalStages: 6,
    backgroundProgress: 0
  };

  private subscribers: ((state: ProgressiveLoadingState) => void)[] = [];
  private backgroundLoadingActive = false;

  private constructor() {
    this.initializeMinimalData();
  }

  public static getInstance(): ProgressiveDataLoader {
    if (!ProgressiveDataLoader.instance) {
      ProgressiveDataLoader.instance = new ProgressiveDataLoader();
    }
    return ProgressiveDataLoader.instance;
  }

  /**
   * 進行状況の監視を登録
   */
  subscribe(callback: (state: ProgressiveLoadingState) => void): () => void {
    this.subscribers.push(callback);
    callback(this.loadingState); // 現在の状態を即座通知
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index >= 0) this.subscribers.splice(index, 1);
    };
  }

  /**
   * 状態変更を全サブスクライバーに通知
   */
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.loadingState));
  }

  /**
   * 最小限データで即座起動
   */
  private initializeMinimalData() {
    console.log('⚡ 最小限データで即座起動中...');
    
    // ハードコードされた最小限データ（3-5個の雑学）
    this.initialTriviaData = [
      {
        id: 1,
        title: "エッフェル塔は夏と冬で高さが変わる",
        short: "気温により金属が膨張・収縮するため",
        detail: "パリの象徴エッフェル塔は鉄製のため、夏の暑さで金属が膨張し、約15cm高くなる。逆に冬は収縮して低くなる。この現象は建設当初から計算されていた。",
        tags: {
          emotion: ["驚き", "知的好奇心"],
          setting: ["都市", "建造物"],
          palette: ["グレー", "ブルー"]
        },
        coords: { lat: 48.8584, lng: 2.2945 },
        images: []
      },
      {
        id: 2,
        title: "ペンギンは実は暖かい場所にも住んでいる",
        short: "南極以外にも多くの種類が生息",
        detail: "ペンギンといえば南極のイメージが強いが、実際には18種類のうち南極に住むのは2種類だけ。アフリカやオーストラリア、南米の温暖な海岸にも多くの種類が生息している。",
        tags: {
          emotion: ["驚き", "発見"],
          setting: ["海辺", "自然"],
          palette: ["ブルー", "ホワイト"]
        },
        coords: { lat: -34.6037, lng: 18.4400 },
        images: []
      },
      {
        id: 3,
        title: "蜂蜜は基本的に腐らない",
        short: "抗菌性と低水分により永久保存が可能",
        detail: "古代エジプトの遺跡から発見された3000年前の蜂蜜が、今でも食べられる状態で保存されていた。蜂蜜の強い抗菌性と極低い水分含有量により、細菌が繁殖できない環境が作られている。",
        tags: {
          emotion: ["驚き", "神秘的"],
          setting: ["自然", "古代"],
          palette: ["ゴールド", "アンバー"]
        },
        coords: { lat: 30.0444, lng: 31.2357 },
        images: []
      }
    ];

    this.initialLocationData = [
      {
        id: "paris",
        name: "パリ",
        nameEn: "Paris",
        type: "real" as const,
        weight: 1.0,
        atmosphere: ["ロマンチック", "都市", "建造物", "グレー"],
        coords: { lat: 48.8566, lng: 2.3522 },
        description: "光の都として知られる美しいヨーロッパの都市",
        country: "France",
        region: "Europe",
        timeZone: "Europe/Paris"
      },
      {
        id: "cape-town",
        name: "ケープタウン",
        nameEn: "Cape Town",
        type: "real" as const,
        weight: 1.0,
        atmosphere: ["自然", "海辺", "ブルー", "ホワイト"],
        coords: { lat: -33.9249, lng: 18.4241 },
        description: "ペンギンコロニーで有名な南アフリカの美しい港町",
        country: "South Africa",
        region: "Africa",
        timeZone: "Africa/Johannesburg"
      },
      {
        id: "egypt",
        name: "古代エジプト",
        nameEn: "Ancient Egypt", 
        type: "real" as const,
        weight: 1.0,
        atmosphere: ["古代", "神秘的", "砂漠", "ゴールド"],
        coords: { lat: 30.0444, lng: 31.2357 },
        description: "古代文明の謎と叡智が眠る砂漠の地",
        country: "Egypt",
        region: "Africa",
        timeZone: "Africa/Cairo"
      }
    ];

    // 最初のステージ完了
    this.loadingStages[0].completed = true;
    this.loadingState.isInitialLoaded = true;
    this.loadingState.currentStage = 1;
    this.loadingState.backgroundProgress = 16; // 1/6完了
    
    console.log('✅ 最小限データ準備完了 - アプリ起動可能');
    this.notifySubscribers();

    // バックグラウンド読み込みを開始
    this.startBackgroundLoading();
  }

  /**
   * バックグラウンドでの段階的読み込み開始
   */
  private async startBackgroundLoading() {
    if (this.backgroundLoadingActive) return;
    this.backgroundLoadingActive = true;

    console.log('🔄 バックグラウンド読み込み開始 (ユーザーには見えません)');

    // 段階2: コア雑学データ (10件)
    await this.loadStage2CoreTrivia();
    
    // 段階3: コア地点データ (10件)
    await this.loadStage3CoreLocations();
    
    // 段階4: 拡張雑学データ (全件)
    await this.loadStage4ExtendedTrivia();
    
    // 段階5: 拡張地点データ (全件)
    await this.loadStage5ExtendedLocations();
    
    // 段階6: 画像プリロード
    await this.loadStage6ImagePreload();

    console.log('🎉 全データ読み込み完了 - フル機能利用可能');
  }

  /**
   * ステージ2: コア雑学データ読み込み (10件)
   */
  private async loadStage2CoreTrivia() {
    await this.delay(100); // UI描画を優先
    
    try {
      console.log('📚 コア雑学データ読み込み中...');
      
      const response = await fetch('/data/trivia.json');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // 最初の10件を追加
          const coreTrivia = data.slice(0, 10).filter(this.isValidTrivia);
          this.initialTriviaData = [...this.initialTriviaData, ...coreTrivia];
          
          this.loadingStages[1].completed = true;
          this.loadingStages[1].data = coreTrivia;
          console.log(`✅ コア雑学データ読み込み完了: ${coreTrivia.length}件`);
        }
      }
    } catch (error) {
      console.warn('⚠️ コア雑学データ読み込み失敗 (最小限データで継続):', error);
    }

    this.updateProgress(2);
  }

  /**
   * ステージ3: コア地点データ読み込み (10件)
   */
  private async loadStage3CoreLocations() {
    await this.delay(100);
    
    try {
      console.log('🗺️ コア地点データ読み込み中...');
      
      const response = await fetch('/data/locations.json');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // 最初の10件を追加
          const coreLocations = data.slice(0, 10).filter(this.isValidLocation);
          this.initialLocationData = [...this.initialLocationData, ...coreLocations];
          
          this.loadingStages[2].completed = true;
          this.loadingStages[2].data = coreLocations;
          console.log(`✅ コア地点データ読み込み完了: ${coreLocations.length}件`);
        }
      }
    } catch (error) {
      console.warn('⚠️ コア地点データ読み込み失敗 (最小限データで継続):', error);
    }

    this.updateProgress(3);
  }

  /**
   * ステージ4: 拡張雑学データ読み込み (全件)
   */
  private async loadStage4ExtendedTrivia() {
    await this.delay(500); // ユーザーが最初の画面を見る時間を確保
    
    try {
      console.log('📖 拡張雑学データ読み込み中...');
      
      const response = await fetch('/data/trivia.json');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          this.fullTriviaData = data.filter(this.isValidTrivia);
          
          this.loadingStages[3].completed = true;
          this.loadingStages[3].data = this.fullTriviaData;
          console.log(`✅ 拡張雑学データ読み込み完了: ${this.fullTriviaData.length}件`);
        }
      }
    } catch (error) {
      console.warn('⚠️ 拡張雑学データ読み込み失敗 (コアデータで継続):', error);
    }

    this.updateProgress(4);
  }

  /**
   * ステージ5: 拡張地点データ読み込み (全件) 
   */
  private async loadStage5ExtendedLocations() {
    await this.delay(300);
    
    try {
      console.log('🌍 拡張地点データ読み込み中...');
      
      const response = await fetch('/data/locations.json');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          this.fullLocationData = data.filter(this.isValidLocation);
          
          this.loadingStages[4].completed = true;
          this.loadingStages[4].data = this.fullLocationData;
          console.log(`✅ 拡張地点データ読み込み完了: ${this.fullLocationData.length}件`);
        }
      }
    } catch (error) {
      console.warn('⚠️ 拡張地点データ読み込み失敗 (コアデータで継続):', error);
    }

    this.updateProgress(5);
  }

  /**
   * ステージ6: 画像プリロード
   */
  private async loadStage6ImagePreload() {
    await this.delay(1000); // ユーザーが雑学を読む時間を確保
    
    try {
      console.log('🖼️ 背景画像プリロード開始...');
      
      // 最初の数枚の画像をプリロード
      const preloadPromises: Promise<void>[] = [];
      
      for (let i = 0; i < Math.min(5, this.getCurrentTriviaData().length); i++) {
        const trivia = this.getCurrentTriviaData()[i];
        const location = this.selectLocationForTrivia(trivia);
        
        if (location) {
          const imageUrl = this.generateImageUrl(trivia, location);
          preloadPromises.push(this.preloadImage(imageUrl));
        }
      }
      
      await Promise.allSettled(preloadPromises);
      
      this.loadingStages[5].completed = true;
      console.log('✅ 画像プリロード完了');
    } catch (error) {
      console.warn('⚠️ 画像プリロード失敗 (動的読み込みで継続):', error);
    }

    this.updateProgress(6);
  }

  /**
   * 画像をプリロード
   */
  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // エラーでも継続
      img.src = url;
      
      // 3秒でタイムアウト
      setTimeout(resolve, 3000);
    });
  }

  /**
   * 進行状況を更新
   */
  private updateProgress(stage: number) {
    this.loadingState.currentStage = stage;
    this.loadingState.backgroundProgress = Math.round((stage / this.loadingState.totalStages) * 100);
    this.notifySubscribers();
  }

  /**
   * ディレイ関数 (他の処理を優先するため)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 雑学アイテムの簡易バリデーション
   */
  private isValidTrivia(item: any): item is TriviaItem {
    return item && 
           typeof item.id === 'number' && 
           typeof item.title === 'string' && 
           typeof item.short === 'string' &&
           typeof item.detail === 'string' &&
           item.tags && 
           Array.isArray(item.tags.emotion);
  }

  /**
   * 地点の簡易バリデーション
   */
  private isValidLocation(item: any): item is Location {
    return item && 
           typeof item.id === 'string' && 
           typeof item.name === 'string' && 
           Array.isArray(item.atmosphere);
  }

  /**
   * 現在利用可能な雑学データを取得
   */
  getCurrentTriviaData(): TriviaData {
    return this.fullTriviaData || this.initialTriviaData;
  }

  /**
   * 現在利用可能な地点データを取得
   */
  getCurrentLocationData(): Location[] {
    return this.fullLocationData || this.initialLocationData;
  }

  /**
   * ランダムな雑学を取得
   */
  getRandomTrivia(excludeIds: number[] = []): TriviaItem | null {
    const available = this.getCurrentTriviaData().filter(item => 
      !excludeIds.includes(item.id)
    );
    
    if (available.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  /**
   * 雑学に適した地点を選択（座標ベース優先）
   */
  selectLocationForTrivia(trivia: TriviaItem): Location | null {
    const locations = this.getCurrentLocationData();
    if (locations.length === 0) return null;

    // 🎯 SerenaMCP: 座標ベースマッチング最優先
    if (trivia.coords) {
      console.log('🎯 座標ベース地点選択:', trivia.coords);
      
      // 完全一致を探す
      const exactMatch = locations.find(location => 
        location.coords && 
        Math.abs(location.coords.lat - trivia.coords!.lat) < 0.01 &&
        Math.abs(location.coords.lng - trivia.coords!.lng) < 0.01
      );
      
      if (exactMatch) {
        console.log('✅ 完全座標一致:', exactMatch.name, trivia.title);
        return exactMatch;
      }
      
      // 近接地点を探す（50km範囲）
      const nearbyLocations = locations.filter(location => {
        if (!location.coords) return false;
        const distance = this.calculateDistance(
          trivia.coords!.lat, trivia.coords!.lng,
          location.coords.lat, location.coords.lng
        );
        return distance < 50; // 50km以内
      });
      
      if (nearbyLocations.length > 0) {
        // 最も近い地点を選択
        const closest = nearbyLocations.reduce((closest, current) => {
          const currentDistance = this.calculateDistance(
            trivia.coords!.lat, trivia.coords!.lng,
            current.coords!.lat, current.coords!.lng
          );
          const closestDistance = this.calculateDistance(
            trivia.coords!.lat, trivia.coords!.lng,
            closest.coords!.lat, closest.coords!.lng
          );
          return currentDistance < closestDistance ? current : closest;
        });
        
        console.log('✅ 近接地点選択:', closest.name, trivia.title);
        return closest;
      }
    }

    // 🔄 フォールバック: 従来の雰囲気マッチング
    console.log('🔄 雰囲気マッチングにフォールバック:', trivia.title);
    const triviaAtmosphere = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...trivia.tags.palette
    ];

    const matching = locations.filter(location => 
      location.atmosphere.some(atmosphere => 
        triviaAtmosphere.includes(atmosphere)
      )
    );

    if (matching.length > 0) {
      const randomIndex = Math.floor(Math.random() * matching.length);
      return matching[randomIndex];
    }

    return locations[0];
  }

  /**
   * 2点間の距離を計算（ハーベルサイン公式）
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // 地球の半径 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * 背景画像URLを生成
   */
  private generateImageUrl(trivia: TriviaItem, location: Location): string {
    const atmosphereTags = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...trivia.tags.palette
    ];
    
    const combinedAtmosphere = [...atmosphereTags, ...location.atmosphere];
    const hash = this.generateHashFromTags(combinedAtmosphere);
    const imageId = (hash % 100) + 1;
    
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
   * 読み込み状態を取得
   */
  getLoadingState(): ProgressiveLoadingState {
    return { ...this.loadingState };
  }

  /**
   * 統計情報を取得
   */
  getStats() {
    return {
      initialTrivia: this.initialTriviaData.length,
      fullTrivia: this.fullTriviaData?.length || 0,
      initialLocations: this.initialLocationData.length,
      fullLocations: this.fullLocationData?.length || 0,
      completedStages: this.loadingStages.filter(s => s.completed).length,
      totalStages: this.loadingStages.length,
      backgroundProgress: this.loadingState.backgroundProgress,
      isFullyLoaded: this.loadingStages.every(s => s.completed)
    };
  }
}