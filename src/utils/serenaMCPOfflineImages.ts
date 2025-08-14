/**
 * SerenaMCP 完全オフライン画像システム
 * ネットワーク依存を排除し、100%確実な美しい画像を提供
 */

import type { TriviaItem, Location } from '../../types/trivia';

export interface OfflineImageConfig {
  width: number;
  height: number;
  style: 'gradient' | 'pattern' | 'geometric' | 'artistic';
}

export class SerenaMCPOfflineImages {
  private static instance: SerenaMCPOfflineImages;

  public static getInstance(): SerenaMCPOfflineImages {
    if (!SerenaMCPOfflineImages.instance) {
      SerenaMCPOfflineImages.instance = new SerenaMCPOfflineImages();
    }
    return SerenaMCPOfflineImages.instance;
  }

  /**
   * 100%確実なオフライン美しい画像を生成
   */
  public generateOfflineImageUrls(
    trivia: TriviaItem, 
    location: Location, 
    config: OfflineImageConfig = { width: 1920, height: 1080, style: 'gradient' }
  ): string[] {
    console.log('🎨🔒 SerenaMCP: 完全オフライン画像生成開始', {
      trivia: trivia.title,
      location: location.name,
      style: config.style
    });

    const urls: string[] = [];
    const theme = this.analyzeThemeDeep(trivia, location);

    // 1. 美しいグラデーション画像（複数バリエーション）
    const gradientUrls = this.generateBeautifulGradients(theme, config);
    urls.push(...gradientUrls);

    // 2. 幾何学パターン画像
    const geometricUrls = this.generateGeometricPatterns(theme, config);
    urls.push(...geometricUrls);

    // 3. 抽象アート画像
    const abstractUrls = this.generateAbstractArt(theme, config);
    urls.push(...abstractUrls);

    // 4. 風景風SVGアート
    const landscapeUrls = this.generateLandscapeArt(theme, config);
    urls.push(...landscapeUrls);

    console.log('🎨🔒 SerenaMCP: 完全オフライン画像生成完了', urls.length, '個');
    return urls;
  }

  /**
   * 深層テーマ解析
   */
  private analyzeThemeDeep(trivia: TriviaItem, location: Location) {
    const emotions = trivia.tags.emotion || [];
    const settings = trivia.tags.setting || [];
    const palette = trivia.tags.palette || [];
    const atmosphere = location.atmosphere || [];

    return {
      primary: emotions[0] || 'ミステリアス',
      secondary: emotions[1] || settings[0] || 'セレーン',
      setting: settings[0] || '空',
      palette: palette[0] || 'ビビッド',
      atmosphere: atmosphere[0] || 'peaceful',
      locationType: location.type,
      intensity: emotions.length + settings.length // 強度計算
    };
  }

  /**
   * 美しいグラデーション生成（多バリエーション）
   */
  private generateBeautifulGradients(theme: any, config: OfflineImageConfig): string[] {
    const urls: string[] = [];
    const { width, height } = config;
    
    // 基本グラデーション
    const baseGradient = this.getEmotionGradient(theme.primary);
    urls.push(this.createGradientSVG(baseGradient, width, height, 'linear'));
    
    // 放射状グラデーション
    urls.push(this.createGradientSVG(baseGradient, width, height, 'radial'));
    
    // 複合グラデーション
    const secondaryGradient = this.getEmotionGradient(theme.secondary);
    const compositeGradient = this.createCompositeGradient(baseGradient, secondaryGradient);
    urls.push(this.createGradientSVG(compositeGradient, width, height, 'linear', 45));
    
    return urls;
  }

  /**
   * 幾何学パターン生成
   */
  private generateGeometricPatterns(theme: any, config: OfflineImageConfig): string[] {
    const urls: string[] = [];
    const { width, height } = config;
    
    // 円形パターン
    urls.push(this.createCirclePatternSVG(theme, width, height));
    
    // 三角形パターン
    urls.push(this.createTrianglePatternSVG(theme, width, height));
    
    // 波形パターン
    urls.push(this.createWavePatternSVG(theme, width, height));
    
    return urls;
  }

  /**
   * 抽象アート生成
   */
  private generateAbstractArt(theme: any, config: OfflineImageConfig): string[] {
    const urls: string[] = [];
    const { width, height } = config;
    
    // 流体アート
    urls.push(this.createFluidArtSVG(theme, width, height));
    
    // クリスタルアート
    urls.push(this.createCrystalArtSVG(theme, width, height));
    
    return urls;
  }

  /**
   * 風景風SVGアート生成
   */
  private generateLandscapeArt(theme: any, config: OfflineImageConfig): string[] {
    const urls: string[] = [];
    const { width, height } = config;
    
    // 設定に基づく風景
    switch (theme.setting) {
      case '都市夜景':
        urls.push(this.createCityScapeSVG(theme, width, height));
        break;
      case '森林':
        urls.push(this.createForestScapeSVG(theme, width, height));
        break;
      case '海辺':
        urls.push(this.createOceanScapeSVG(theme, width, height));
        break;
      case '山岳':
        urls.push(this.createMountainScapeSVG(theme, width, height));
        break;
      case '空':
        urls.push(this.createSkyScapeSVG(theme, width, height));
        break;
      default:
        urls.push(this.createAbstractLandscapeSVG(theme, width, height));
    }
    
    return urls;
  }

  /**
   * 感情ベースグラデーション取得
   */
  private getEmotionGradient(emotion: string): { start: string; end: string; accent?: string } {
    const gradients: Record<string, { start: string; end: string; accent?: string }> = {
      'ミステリアス': { start: '#667eea', end: '#764ba2', accent: '#9f7aea' },
      'ロマンチック': { start: '#f093fb', end: '#f5576c', accent: '#ff8a80' },
      'エピック': { start: '#4facfe', end: '#00f2fe', accent: '#0ea5e9' },
      'ノスタルジック': { start: '#fad0c4', end: '#ffd1ff', accent: '#f8b4d9' },
      'セレーン': { start: '#a8edea', end: '#fed6e3', accent: '#bfdbfe' },
      'ダーク': { start: '#2c3e50', end: '#34495e', accent: '#1f2937' },
      'ジョイフル': { start: '#ffecd2', end: '#fcb69f', accent: '#fdba74' },
      'メランコリック': { start: '#6c7b95', end: '#b2c6ee', accent: '#8fadf3' }
    };
    
    return gradients[emotion] || gradients['ミステリアス'];
  }

  /**
   * 基本グラデーションSVG作成
   */
  private createGradientSVG(
    gradient: { start: string; end: string; accent?: string }, 
    width: number, 
    height: number, 
    type: 'linear' | 'radial' = 'linear',
    angle: number = 135
  ): string {
    const id = `grad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let gradientDef = '';
    if (type === 'linear') {
      const rad = (angle * Math.PI) / 180;
      const x2 = Math.cos(rad) * 100;
      const y2 = Math.sin(rad) * 100;
      
      gradientDef = `<linearGradient id="${id}" x1="0%" y1="0%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
        ${gradient.accent ? `<stop offset="50%" style="stop-color:${gradient.accent};stop-opacity:0.8" />` : ''}
        <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
      </linearGradient>`;
    } else {
      gradientDef = `<radialGradient id="${id}" cx="50%" cy="50%" r="70%">
        <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
        ${gradient.accent ? `<stop offset="50%" style="stop-color:${gradient.accent};stop-opacity:0.9" />` : ''}
        <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
      </radialGradient>`;
    }

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>${gradientDef}</defs>
      <rect width="100%" height="100%" fill="url(#${id})" />
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 複合グラデーション作成
   */
  private createCompositeGradient(
    primary: { start: string; end: string }, 
    secondary: { start: string; end: string }
  ): { start: string; end: string; accent: string } {
    return {
      start: primary.start,
      end: secondary.end,
      accent: primary.end
    };
  }

  /**
   * 円形パターンSVG
   */
  private createCirclePatternSVG(theme: any, width: number, height: number): string {
    const gradient = this.getEmotionGradient(theme.primary);
    const circles = [];
    
    for (let i = 0; i < 8; i++) {
      const cx = (width * Math.random());
      const cy = (height * Math.random());
      const r = 50 + Math.random() * 100;
      const opacity = 0.1 + Math.random() * 0.3;
      
      circles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${gradient.start}" opacity="${opacity}" />`);
    }

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      ${circles.join('')}
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 三角形パターンSVG
   */
  private createTrianglePatternSVG(theme: any, width: number, height: number): string {
    const gradient = this.getEmotionGradient(theme.primary);
    const triangles = [];
    
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 30 + Math.random() * 80;
      const opacity = 0.1 + Math.random() * 0.2;
      
      triangles.push(`<polygon points="${x},${y} ${x+size},${y+size/2} ${x},${y+size}" 
        fill="${gradient.accent || gradient.end}" opacity="${opacity}" />`);
    }

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      ${triangles.join('')}
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 波形パターンSVG
   */
  private createWavePatternSVG(theme: any, width: number, height: number): string {
    const gradient = this.getEmotionGradient(theme.primary);
    const waves = [];
    
    for (let i = 0; i < 5; i++) {
      const y = (height / 6) * (i + 1);
      const opacity = 0.1 + (i * 0.05);
      const amplitude = 30 + Math.random() * 20;
      
      let path = `M 0 ${y}`;
      for (let x = 0; x <= width; x += 50) {
        const waveY = y + Math.sin((x / width) * Math.PI * 4) * amplitude;
        path += ` L ${x} ${waveY}`;
      }
      
      waves.push(`<path d="${path}" stroke="${gradient.accent || gradient.end}" 
        stroke-width="3" fill="none" opacity="${opacity}" />`);
    }

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      ${waves.join('')}
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 流体アートSVG
   */
  private createFluidArtSVG(theme: any, width: number, height: number): string {
    const gradient = this.getEmotionGradient(theme.primary);
    
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="fluid1" cx="30%" cy="30%" r="50%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:0.3" />
        </radialGradient>
        <radialGradient id="fluid2" cx="70%" cy="70%" r="60%">
          <stop offset="0%" style="stop-color:${gradient.accent || gradient.end};stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:${gradient.start};stop-opacity:0.2" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="${gradient.start}" />
      <ellipse cx="30%" cy="40%" rx="40%" ry="30%" fill="url(#fluid1)" />
      <ellipse cx="70%" cy="60%" rx="50%" ry="40%" fill="url(#fluid2)" />
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * クリスタルアートSVG
   */
  private createCrystalArtSVG(theme: any, width: number, height: number): string {
    const gradient = this.getEmotionGradient(theme.primary);
    const crystals = [];
    
    for (let i = 0; i < 6; i++) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const size = 50 + Math.random() * 100;
      const rotation = Math.random() * 360;
      
      crystals.push(`<g transform="translate(${cx},${cy}) rotate(${rotation})">
        <polygon points="0,-${size} ${size*0.5},${size*0.5} -${size*0.5},${size*0.5}" 
          fill="${gradient.accent || gradient.end}" opacity="0.3" />
      </g>`);
    }

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="crystal_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#crystal_bg)" />
      ${crystals.join('')}
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 都市夜景SVG
   */
  private createCityScapeSVG(theme: any, width: number, height: number): string {
    const gradient = this.getEmotionGradient(theme.primary);
    const buildings = [];
    
    for (let i = 0; i < 8; i++) {
      const x = (width / 8) * i;
      const buildingWidth = width / 8;
      const buildingHeight = 200 + Math.random() * 300;
      const y = height - buildingHeight;
      
      buildings.push(`<rect x="${x}" y="${y}" width="${buildingWidth}" height="${buildingHeight}" 
        fill="${gradient.start}" opacity="0.8" />`);
        
      // 窓の光
      for (let j = 0; j < 3; j++) {
        const windowX = x + 10 + (j * 20);
        const windowY = y + 30 + (j * 50);
        buildings.push(`<rect x="${windowX}" y="${windowY}" width="8" height="8" 
          fill="${gradient.accent || '#FFD700'}" opacity="0.9" />`);
      }
    }

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="night_sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#night_sky)" />
      ${buildings.join('')}
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 森林風景SVG
   */
  private createForestScapeSVG(theme: any, width: number, height: number): string {
    const gradient = this.getEmotionGradient(theme.primary);
    const trees = [];
    
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * width;
      const treeHeight = 100 + Math.random() * 200;
      const y = height - treeHeight;
      const treeWidth = 30 + Math.random() * 40;
      
      // 木の幹
      trees.push(`<rect x="${x-5}" y="${y+treeHeight-50}" width="10" height="50" fill="#8B4513" />`);
      // 木の葉
      trees.push(`<ellipse cx="${x}" cy="${y+treeHeight/2}" rx="${treeWidth/2}" ry="${treeHeight/2}" 
        fill="#228B22" opacity="0.8" />`);
    }

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="forest_sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#forest_sky)" />
      ${trees.join('')}
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 海辺風景SVG
   */
  private createOceanScapeSVG(theme: any, width: number, height: number): string {
    const gradient = this.getEmotionGradient(theme.primary);
    
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ocean_sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="70%" style="stop-color:${gradient.accent || gradient.end};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#006994;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="ocean_waves" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#4682B4;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#87CEEB;stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:#4682B4;stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#ocean_sky)" />
      <rect x="0" y="${height*0.7}" width="100%" height="${height*0.3}" fill="url(#ocean_waves)" />
      <circle cx="${width*0.8}" cy="${height*0.2}" r="50" fill="#FFD700" opacity="0.9" />
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 山岳風景SVG
   */
  private createMountainScapeSVG(theme: any, width: number, height: number): string {
    const gradient = this.getEmotionGradient(theme.primary);
    const mountains = [];
    
    for (let i = 0; i < 4; i++) {
      const x1 = (width / 4) * i;
      const x2 = x1 + (width / 4);
      const peakX = x1 + (width / 8);
      const peakY = 100 + Math.random() * 200;
      const baseY = height - 50;
      
      mountains.push(`<polygon points="${x1},${baseY} ${peakX},${peakY} ${x2},${baseY}" 
        fill="${gradient.start}" opacity="${0.7 + i * 0.1}" />`);
    }

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mountain_sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#mountain_sky)" />
      ${mountains.join('')}
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 空風景SVG
   */
  private createSkyScapeSVG(theme: any, width: number, height: number): string {
    const gradient = this.getEmotionGradient(theme.primary);
    const clouds = [];
    
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * width;
      const y = Math.random() * (height * 0.6);
      const cloudSize = 80 + Math.random() * 120;
      
      clouds.push(`<ellipse cx="${x}" cy="${y}" rx="${cloudSize}" ry="${cloudSize*0.6}" 
        fill="white" opacity="0.7" />`);
    }

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#sky_gradient)" />
      ${clouds.join('')}
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * 抽象風景SVG
   */
  private createAbstractLandscapeSVG(theme: any, width: number, height: number): string {
    const gradient = this.getEmotionGradient(theme.primary);
    
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="abstract_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${gradient.accent || gradient.end};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#abstract_bg)" />
      <circle cx="${width*0.3}" cy="${height*0.3}" r="100" fill="${gradient.accent || gradient.end}" opacity="0.3" />
      <circle cx="${width*0.7}" cy="${height*0.7}" r="150" fill="${gradient.start}" opacity="0.2" />
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
}

// シングルトンインスタンスをエクスポート
export const serenaMCPOfflineImages = SerenaMCPOfflineImages.getInstance();