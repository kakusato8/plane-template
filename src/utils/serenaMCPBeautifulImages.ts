/**
 * SerenaMCP シンプル美しい画像システム
 * UnsplashとPicsumのみを使用した軽量版
 */

import type { TriviaItem, Location } from '../../types/trivia';

export interface BeautifulImageConfig {
  width: number;
  height: number;
}

export class SerenaMCPBeautifulImages {
  private static instance: SerenaMCPBeautifulImages;

  public static getInstance(): SerenaMCPBeautifulImages {
    if (!SerenaMCPBeautifulImages.instance) {
      SerenaMCPBeautifulImages.instance = new SerenaMCPBeautifulImages();
    }
    return SerenaMCPBeautifulImages.instance;
  }

  /**
   * シンプルな美しい画像URLリストを生成
   */
  public generateBeautifulImageUrls(
    trivia: TriviaItem, 
    location: Location, 
    config: BeautifulImageConfig = { width: 1200, height: 800 }
  ): string[] {
    console.log('🎨 SerenaMCP: シンプル美しい画像URL生成', {
      trivia: trivia.title,
      location: location.name
    });

    const urls: string[] = [];
    
    // 1. Unsplash - 感情タグに基づく検索
    const emotion = trivia.tags.emotion[0] || 'ミステリアス';
    const searchTerms = {
      'ミステリアス': 'mysterious,dark,moody',
      'ロマンチック': 'romantic,sunset,pink',
      'エピック': 'epic,mountain,dramatic',
      'ノスタルジック': 'vintage,nostalgic,sepia',
      'セレーン': 'peaceful,calm,serene',
      'ダーク': 'dark,night,shadow',
      'ジョイフル': 'bright,colorful,happy',
      'メランコリック': 'melancholic,grey,rain'
    };
    
    const searchTerm = (searchTerms as any)[emotion] || 'landscape';
    urls.push(`https://source.unsplash.com/${config.width}x${config.height}/?${searchTerm}`);
    
    // 2. Picsum - 美しい写真ID
    const seed = this.generateSeed(trivia, location);
    const photoIds = [1, 2, 3, 10, 15, 20, 24, 30, 42, 48];
    const selectedId = photoIds[seed % photoIds.length];
    urls.push(`https://picsum.photos/id/${selectedId}/${config.width}/${config.height}`);

    console.log('✅ SerenaMCP: 美しい画像URL生成完了', urls.length, '個');
    return urls;
  }

  /**
   * フォールバックグラデーション
   */
  public generateFallbackGradient(trivia: TriviaItem): string {
    const emotion = trivia.tags.emotion[0] || 'ミステリアス';
    
    const gradients: Record<string, string> = {
      'ミステリアス': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'ロマンチック': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'エピック': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'ノスタルジック': 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
      'セレーン': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'ダーク': 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      'ジョイフル': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'メランコリック': 'linear-gradient(135deg, #6c7b95 0%, #b2c6ee 100%)'
    };
    
    return gradients[emotion] || gradients['ミステリアス'];
  }

  /**
   * シード値生成
   */
  private generateSeed(trivia: TriviaItem, location: Location): number {
    const str = `${trivia.id}_${location.id}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// シングルトンインスタンスをエクスポート
export const serenaMCPBeautifulImages = SerenaMCPBeautifulImages.getInstance();