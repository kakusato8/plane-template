/**
 * 画像ソース管理システム - 多層フォールバック対応
 * 複数の画像ソースを優先度順で管理し、堅牢な画像読み込みを提供
 */

interface ImageSourceConfig {
  name: string;
  priority: number;
  generator: (tags: string[], size: { width: number; height: number }) => string;
  timeout: number;
  description: string;
}

interface AvailabilityCache {
  [key: string]: {
    available: boolean;
    lastChecked: number;
    cacheValidFor: number;
  };
}

export class ImageSourceManager {
  private static instance: ImageSourceManager;
  private availabilityCache: AvailabilityCache = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分間キャッシュ

  private imageConfig: ImageSourceConfig[] = [
    {
      name: 'unsplash-source',
      priority: 1,
      generator: (tags, size) => {
        // 雰囲気タグを英語キーワードに変換
        const keywords = this.translateTagsToEnglish(tags);
        const searchTerm = keywords.slice(0, 3).join(',') || 'nature,landscape';
        return `https://source.unsplash.com/${size.width}x${size.height}/?${searchTerm}`;
      },
      timeout: 8000,
      description: '高品質写真（Unsplash）'
    },
    {
      name: 'via-placeholder',
      priority: 2,
      generator: (tags, size) => {
        const bgColor = this.getColorFromTags(tags);
        const textColor = this.getContrastColor(bgColor);
        return `https://via.placeholder.com/${size.width}x${size.height}/${bgColor}/${textColor}.png?text=CurioCity`;
      },
      timeout: 6000,
      description: '安定プレースホルダー'
    },
    {
      name: 'dummyimage',
      priority: 3,
      generator: (tags, size) => {
        const bgColor = this.getColorFromTags(tags);
        const label = this.getAtmosphereLabel(tags);
        return `https://dummyimage.com/${size.width}x${size.height}/${bgColor}/ffffff.png&text=${encodeURIComponent(label)}`;
      },
      timeout: 5000,
      description: 'カスタムプレースホルダー'
    },
    {
      name: 'gradient-svg',
      priority: 4,
      generator: (tags, size) => {
        const gradient = this.generateGradientFromTags(tags);
        const svg = this.createGradientSVG(gradient, size);
        return `data:image/svg+xml;base64,${btoa(svg)}`;
      },
      timeout: 1000,
      description: '動的グラデーション（常に成功）'
    },
    {
      name: 'picsum-photos',
      priority: 5,
      generator: (tags, size) => {
        const imageId = this.generateImageIdFromTags(tags);
        return `https://picsum.photos/id/${imageId}/${size.width}/${size.height}`;
      },
      timeout: 10000,
      description: '従来システム（Picsum）'
    }
  ];

  static getInstance(): ImageSourceManager {
    if (!this.instance) {
      this.instance = new ImageSourceManager();
    }
    return this.instance;
  }

  /**
   * 雰囲気タグに基づいて複数の画像URLを優先度順で生成
   */
  async generateImageUrls(
    tags: string[], 
    size: { width: number; height: number } = { width: 1920, height: 1080 }
  ): Promise<string[]> {
    console.log('🖼️ 多層画像URL生成開始:', { tags, size });

    // 利用可能なソースをチェックして優先度順にソート
    const availableSources = await this.getAvailableSources();
    const sortedSources = availableSources.sort((a, b) => a.priority - b.priority);

    const urls = sortedSources.map(source => {
      try {
        const url = source.generator(tags, size);
        console.log(`✅ ${source.name}: ${url}`);
        return url;
      } catch (error) {
        console.warn(`❌ ${source.name} URL生成エラー:`, error);
        return null;
      }
    }).filter(Boolean) as string[];

    // 少なくとも1つのURLが生成されることを保証（グラデーション）
    if (urls.length === 0) {
      const fallbackUrl = this.createEmergencyFallback(tags, size);
      urls.push(fallbackUrl);
      console.log('🚨 緊急フォールバック使用:', fallbackUrl);
    }

    console.log('📊 生成されたURL数:', urls.length);
    return urls;
  }

  /**
   * 利用可能な画像ソースを取得（キャッシュ機能付き）
   */
  private async getAvailableSources(): Promise<ImageSourceConfig[]> {
    const availableSources = [];

    for (const source of this.imageConfig) {
      const availability = await this.checkSourceAvailability(source);
      if (availability) {
        availableSources.push(source);
      }
    }

    // グラデーションソースは常に利用可能
    const gradientSource = this.imageConfig.find(s => s.name === 'gradient-svg');
    if (gradientSource && !availableSources.find(s => s.name === 'gradient-svg')) {
      availableSources.push(gradientSource);
    }

    return availableSources;
  }

  /**
   * 画像ソースの可用性をチェック（キャッシュ付き）
   */
  private async checkSourceAvailability(source: ImageSourceConfig): Promise<boolean> {
    const cached = this.availabilityCache[source.name];
    const now = Date.now();

    // キャッシュが有効な場合は使用
    if (cached && (now - cached.lastChecked) < cached.cacheValidFor) {
      return cached.available;
    }

    // グラデーションは常に利用可能
    if (source.name === 'gradient-svg') {
      this.availabilityCache[source.name] = {
        available: true,
        lastChecked: now,
        cacheValidFor: this.CACHE_DURATION
      };
      return true;
    }

    // 実際の可用性チェック
    try {
      const testUrl = source.generator(['test'], { width: 100, height: 100 });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const available = response.ok;

      this.availabilityCache[source.name] = {
        available,
        lastChecked: now,
        cacheValidFor: this.CACHE_DURATION
      };

      return available;
    } catch (error) {
      console.warn(`⚠️ ${source.name} 可用性チェック失敗:`, error);
      this.availabilityCache[source.name] = {
        available: false,
        lastChecked: now,
        cacheValidFor: this.CACHE_DURATION
      };
      return false;
    }
  }

  /**
   * 雰囲気タグを英語キーワードに変換
   */
  private translateTagsToEnglish(tags: string[]): string[] {
    const tagMap: { [key: string]: string } = {
      'ミステリアス': 'mysterious,dark,moody',
      'ロマンチック': 'romantic,sunset,pink',
      'エピック': 'epic,dramatic,mountain',
      'ノスタルジック': 'nostalgic,vintage,sepia',
      'セレーン': 'serene,calm,peaceful',
      'ダーク': 'dark,gothic,night',
      'ジョイフル': 'joyful,bright,colorful',
      'メランコリック': 'melancholic,rain,blue',
      '都市夜景': 'city,night,urban',
      '古代遺跡': 'ancient,ruins,historical',
      '近未来都市': 'futuristic,neon,cyberpunk',
      '森林': 'forest,trees,green',
      '砂漠': 'desert,sand,golden',
      '海辺': 'ocean,beach,waves',
      '山岳': 'mountain,peaks,landscape',
      '氷原': 'ice,snow,arctic',
      '湖': 'lake,water,reflection'
    };

    const keywords = tags.flatMap(tag => 
      tagMap[tag] ? tagMap[tag].split(',') : [tag.toLowerCase()]
    );

    return [...new Set(keywords)]; // 重複除去
  }

  /**
   * 雰囲気タグから色を生成
   */
  private getColorFromTags(tags: string[]): string {
    const colorMap: { [key: string]: string } = {
      'ミステリアス': '4a5568',
      'ロマンチック': 'ed64a6',
      'エピック': '3182ce',
      'ノスタルジック': 'd69e2e',
      'セレーン': '38b2ac',
      'ダーク': '2d3748',
      'ジョイフル': 'f56565',
      'メランコリック': '667eea'
    };

    for (const tag of tags) {
      if (colorMap[tag]) {
        return colorMap[tag];
      }
    }

    return '667eea'; // デフォルト
  }

  /**
   * 背景色に対するコントラスト色を取得
   */
  private getContrastColor(bgColor: string): string {
    // 簡単な明度判定
    const r = parseInt(bgColor.substr(0, 2), 16);
    const g = parseInt(bgColor.substr(2, 2), 16);
    const b = parseInt(bgColor.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness > 125 ? '000000' : 'ffffff';
  }

  /**
   * 雰囲気に基づくラベル生成
   */
  private getAtmosphereLabel(tags: string[]): string {
    if (tags.length === 0) return 'CurioCity';
    
    const primaryTag = tags[0];
    const labelMap: { [key: string]: string } = {
      'ミステリアス': '🌙 Mysterious',
      'ロマンチック': '💕 Romantic',
      'エピック': '⚡ Epic',
      'ノスタルジック': '📸 Nostalgic',
      'セレーン': '🌿 Serene',
      'ダーク': '🌑 Dark',
      'ジョイフル': '🌈 Joyful',
      'メランコリック': '💙 Melancholic'
    };

    return labelMap[primaryTag] || `✨ ${primaryTag}`;
  }

  /**
   * 雰囲気タグからグラデーションを生成
   */
  private generateGradientFromTags(tags: string[]): { start: string; end: string } {
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

    for (const tag of tags) {
      if (gradientMap[tag]) {
        return gradientMap[tag];
      }
    }

    return { start: '#667eea', end: '#764ba2' }; // デフォルト
  }

  /**
   * SVGグラデーションを作成
   */
  private createGradientSVG(gradient: { start: string; end: string }, size: { width: number; height: number }): string {
    return `<svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>`;
  }

  /**
   * タグからPicsum用の画像IDを生成
   */
  private generateImageIdFromTags(tags: string[]): number {
    const combinedString = tags.join('');
    let hash = 0;
    for (let i = 0; i < combinedString.length; i++) {
      const char = combinedString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 1000) + 1;
  }

  /**
   * 緊急フォールバック用の確実なURL生成
   */
  private createEmergencyFallback(tags: string[], size: { width: number; height: number }): string {
    const gradient = this.generateGradientFromTags(tags);
    const svg = this.createGradientSVG(gradient, size);
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 可用性キャッシュをクリア（テスト用）
   */
  clearAvailabilityCache(): void {
    this.availabilityCache = {};
    console.log('🗑️ 可用性キャッシュをクリア');
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo(): {
    configuredSources: number;
    cachedAvailability: AvailabilityCache;
    sourcePriorities: { name: string; priority: number; description: string }[];
  } {
    return {
      configuredSources: this.imageConfig.length,
      cachedAvailability: this.availabilityCache,
      sourcePriorities: this.imageConfig.map(s => ({
        name: s.name,
        priority: s.priority,
        description: s.description
      }))
    };
  }
}