/**
 * 画像ソース管理システム - 多層フォールバック対応
 * 複数の画像ソースを優先度順で管理し、堅牢な画像読み込みを提供
 */

// 使用されていないインターフェースを削除

export class ImageSourceManager {
  private sources = [
    {
      name: 'picsum-photos',
      weight: 0.4,
      generator: (_tags: string[], size: { width: number; height: number }) => {
        // Picsum Photosのランダム画像
        const imageId = Math.floor(Math.random() * 1000) + 1;
        return `https://picsum.photos/id/${imageId}/${size.width}/${size.height}`;
      },
      description: 'ランダム写真（Picsum Photos）'
    },
    {
      name: 'placeholder-com',
      weight: 0.3,
      generator: (_tags: string[], size: { width: number; height: number }) => {
        const colors = ['4A90E2', '7ED321', 'F5A623', 'D0021B', '9013FE', '50E3C2'];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];
        const textColor = 'ffffff';
        return `https://via.placeholder.com/${size.width}x${size.height}/${bgColor}/${textColor}.png?text=CurioCity`;
      },
      description: 'プレースホルダー画像'
    },
    {
      name: 'dummyimage-com',
      weight: 0.3,
      generator: (tags: string[], size: { width: number; height: number }) => {
        const emotionColors: Record<string, string> = {
          'ミステリアス': '2c3e50',
          'ロマンチック': 'e74c3c',
          'エピック': '9b59b6',
          'ノスタルジック': 'f39c12',
          'セレーン': '3498db',
          'ダーク': '34495e',
          'ジョイフル': 'f1c40f',
          'メランコリック': '95a5a6'
        };
        
        const emotion = tags.find((tag: string) => emotionColors[tag]);
        const bgColor = emotion ? emotionColors[emotion] : '95a5a6';
        const label = emotion || 'CurioCity';
        
        return `https://dummyimage.com/${size.width}x${size.height}/${bgColor}/ffffff.png&text=${encodeURIComponent(label)}`;
      },
      description: 'カラー画像（DummyImage）'
    }
  ];
  private static instance: ImageSourceManager | null = null;

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(): ImageSourceManager {
    if (!this.instance) {
      this.instance = new ImageSourceManager();
    }
    return this.instance;
  }

  /**
   * 画像URLを生成（外部から呼び出し用）
   */
  generateImageUrls(tags: string[], size: { width: number; height: number } = { width: 1920, height: 1080 }): string[] {
    return this.generateMultiSourceUrls(tags, size);
  }

  private fallbackSources = [
    {
      name: 'picsum-fallback',
      generator: (_tags: string[], size: { width: number; height: number }) => {
        const imageId = Math.floor(Math.random() * 500) + 500; // 異なる範囲
        return `https://picsum.photos/id/${imageId}/${size.width}/${size.height}`;
      }
    }
  ];

  private availabilityCache = new Map<string, { available: boolean; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5分

  /**
   * 複数のソースから画像URLを生成
   */
  generateMultiSourceUrls(
    tags: string[], 
    size: { width: number; height: number } = { width: 1920, height: 1080 }
  ): string[] {
    console.log('🖼️ 多層画像URL生成開始:', { tags, size });
    
    const urls: string[] = [];
    
    // メインソースから生成
    for (const source of this.sources) {
      try {
        const url = source.generator(tags, size);
        console.log(`✅ ${source.name}: ${url}`);
        urls.push(url);
      } catch (error) {
        console.warn(`❌ ${source.name} URL生成エラー:`, error);
      }
    }

    // フォールバック追加
    const fallbackUrl = this.generateFallbackUrl(tags, size);
    if (fallbackUrl) {
      console.log('🚨 緊急フォールバック使用:', fallbackUrl);
      urls.push(fallbackUrl);
    }
    
    console.log('📊 生成されたURL数:', urls.length);
    return urls;
  }

  /**
   * 堅牢な画像URL生成（エラー耐性強化）
   */
  generateRobustUrls(
    tags: string[], 
    size: { width: number; height: number } = { width: 1920, height: 1080 }
  ): string[] {
    try {
      const urls = this.generateMultiSourceUrls(tags, size);
      
      // フォールバックソースも追加
      for (const fallback of this.fallbackSources) {
        try {
          const url = fallback.generator(tags, size);
          urls.push(url);
        } catch (error) {
          console.warn('フォールバック生成エラー:', error);
        }
      }
      
      return urls;
    } catch (error) {
      console.error('堅牢URL生成エラー:', error);
      // 最終フォールバック
      return [this.generateEmergencyFallback(tags, size)];
    }
  }

  /**
   * ソースの可用性をチェック
   */
  async checkSourceAvailability(sourceName: string): Promise<boolean> {
    const cacheKey = sourceName;
    const cached = this.availabilityCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.available;
    }

    try {
      const source = this.sources.find(s => s.name === sourceName);
      if (!source) return false;

      const testUrl = source.generator(['test'], { width: 100, height: 100 });
      
      const response = await fetch(testUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      const available = response.ok;
      this.availabilityCache.set(cacheKey, { available, timestamp: Date.now() });
      
      return available;
    } catch (error) {
      console.warn(`⚠️ ${sourceName} 可用性チェック失敗:`, error);
      this.availabilityCache.set(cacheKey, { available: false, timestamp: Date.now() });
      return false;
    }
  }

  /**
   * フォールバック画像URL生成
   */
  private generateFallbackUrl(_tags: string[], size: { width: number; height: number }): string {
    // グラデーション背景を生成
    const gradients = [
      { start: '#667eea', end: '#764ba2' },
      { start: '#f093fb', end: '#f5576c' },
      { start: '#4facfe', end: '#00f2fe' },
      { start: '#43e97b', end: '#38f9d7' },
      { start: '#fa709a', end: '#fee140' },
      { start: '#a8edea', end: '#fed6e3' },
      { start: '#ff9a9e', end: '#fecfef' },
      { start: '#a18cd1', end: '#fbc2eb' }
    ];
    
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    return this.createGradientSVG(randomGradient, size);
  }

  /**
   * 緊急時フォールバック
   */
  private generateEmergencyFallback(_tags: string[], size: { width: number; height: number }): string {
    const defaultGradient = { start: '#667eea', end: '#764ba2' };
    return this.createGradientSVG(defaultGradient, size);
  }

  /**
   * SVGグラデーション生成
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
   * キャッシュクリア
   */
  clearCache(): void {
    this.availabilityCache.clear();
    console.log('🗑️ 可用性キャッシュをクリア');
  }

  /**
   * 統計情報取得
   */
  getStats() {
    return {
      totalSources: this.sources.length,
      fallbackSources: this.fallbackSources.length,
      cacheSize: this.availabilityCache.size,
      sourceNames: this.sources.map(s => s.name)
    };
  }
}