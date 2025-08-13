import type { TriviaItem, Location, ShareContent } from '../../types/trivia';

export class ShareGenerator {
  private static instance: ShareGenerator;

  private constructor() {}

  public static getInstance(): ShareGenerator {
    if (!ShareGenerator.instance) {
      ShareGenerator.instance = new ShareGenerator();
    }
    return ShareGenerator.instance;
  }

  /**
   * 雑学の短縮版テキストを生成
   */
  generateShortText(trivia: TriviaItem, maxLength: number = 100): string {
    const shortText = trivia.short;
    if (shortText.length <= maxLength) {
      return shortText;
    }

    // 文の区切りで短縮を試行
    const sentences = shortText.split('。');
    let result = '';
    
    for (const sentence of sentences) {
      const candidate = result + sentence + '。';
      if (candidate.length <= maxLength) {
        result = candidate;
      } else {
        break;
      }
    }

    // 文区切りで短縮できない場合、文字数でカット
    if (!result && shortText.length > maxLength) {
      result = shortText.substring(0, maxLength - 3) + '...';
    }

    return result || shortText;
  }

  /**
   * ハッシュタグを生成
   */
  generateHashtags(trivia: TriviaItem, location: Location): string[] {
    const hashtags: string[] = ['CurioCity', '雑学'];

    // 地点に基づくハッシュタグ
    if (location.country && location.country !== '公海') {
      hashtags.push(location.country);
    }
    
    // 感情タグからハッシュタグを生成
    const emotionMap: Record<string, string> = {
      'ミステリアス': 'ミステリー',
      'ロマンチック': 'ロマンス',
      'エピック': '壮大',
      'ノスタルジック': 'ノスタルジー',
      'セレーン': '静寂',
      'ダーク': 'ダーク',
      'ジョイフル': '楽しい',
      'メランコリック': '物悲しい'
    };

    trivia.tags.emotion.forEach(emotion => {
      const hashtag = emotionMap[emotion];
      if (hashtag) {
        hashtags.push(hashtag);
      }
    });

    // 設定タグからハッシュタグを生成
    const settingMap: Record<string, string> = {
      '都市夜景': '夜景',
      '古代遺跡': '歴史',
      '近未来都市': 'SF',
      '森林': '自然',
      '砂漠': '砂漠',
      '海辺': '海',
      '山岳': '山',
      '氷原': '氷',
      '湖': '湖',
      '空': '空',
      '路地裏': '街',
      '架空都市': 'ファンタジー'
    };

    trivia.tags.setting.forEach(setting => {
      const hashtag = settingMap[setting];
      if (hashtag) {
        hashtags.push(hashtag);
      }
    });

    // 重複を除去し、最大8個まで
    return [...new Set(hashtags)].slice(0, 8);
  }

  /**
   * 共有コンテンツを生成
   */
  generateShareContent(
    trivia: TriviaItem,
    location: Location,
    imageUrl?: string
  ): ShareContent {
    const shortText = this.generateShortText(trivia, 120);
    const hashtags = this.generateHashtags(trivia, location);
    
    // 共有用テキストの生成
    const shareText = `${trivia.title}\n\n${shortText}\n\n#${hashtags.join(' #')}`;
    
    return {
      text: shareText,
      shortText,
      imageUrl: imageUrl || '',
      url: window.location.href,
      hashtags
    };
  }

  /**
   * Canvas APIを使用して共有用画像を生成
   */
  async generateShareImage(
    trivia: TriviaItem,
    location: Location,
    backgroundImageUrl: string,
    options: {
      width?: number;
      height?: number;
      format?: 'jpeg' | 'png';
      quality?: number;
    } = {}
  ): Promise<string> {
    const {
      width = 1200,
      height = 630,
      format = 'jpeg',
      quality = 0.9
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // 背景画像を描画
          ctx.drawImage(img, 0, 0, width, height);

          // オーバーレイを追加
          const overlayOpacity = location.type === 'fictional' ? 0.6 : 0.4;
          ctx.fillStyle = `rgba(0, 0, 0, ${overlayOpacity})`;
          ctx.fillRect(0, 0, width, height);

          // グラデーションオーバーレイ
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);

          // テキストスタイル設定
          ctx.textAlign = 'center';
          ctx.fillStyle = 'white';
          
          // タイトルを描画
          const titleFontSize = Math.min(48, width / 20);
          ctx.font = `bold ${titleFontSize}px 'Noto Sans JP', sans-serif`;
          
          const maxLineWidth = width * 0.85;
          const titleLines = this.wrapText(ctx, trivia.title, maxLineWidth);
          const titleStartY = height * 0.35;
          
          titleLines.forEach((line, index) => {
            const y = titleStartY + (titleFontSize + 10) * index;
            ctx.fillText(line, width / 2, y);
          });

          // 短縮テキストを描画
          const shortFontSize = Math.min(32, width / 30);
          ctx.font = `${shortFontSize}px 'Noto Sans JP', sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          
          const shortText = this.generateShortText(trivia, 80);
          const shortLines = this.wrapText(ctx, shortText, maxLineWidth);
          const shortStartY = titleStartY + titleLines.length * (titleFontSize + 10) + 40;
          
          shortLines.forEach((line, index) => {
            const y = shortStartY + (shortFontSize + 8) * index;
            ctx.fillText(line, width / 2, y);
          });

          // 地点名を描画
          ctx.font = `${Math.min(24, width / 40)}px 'Noto Sans JP', sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillText(`📍 ${location.name}`, width / 2, height * 0.85);

          // CurioCityロゴ
          ctx.font = `${Math.min(20, width / 50)}px 'Noto Sans JP', sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillText('CurioCity', width / 2, height * 0.92);

          // 画像をDataURLとして出力
          const dataUrl = canvas.toDataURL(`image/${format}`, quality);
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load background image'));
      };

      img.src = backgroundImageUrl;
    });
  }

  /**
   * テキストを指定幅で折り返し
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Twitter/X共有用URLを生成
   */
  generateTwitterShareUrl(shareContent: ShareContent): string {
    const params = new URLSearchParams({
      text: shareContent.text,
      url: shareContent.url
    });
    
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }

  /**
   * Facebook共有用URLを生成
   */
  generateFacebookShareUrl(shareContent: ShareContent): string {
    const params = new URLSearchParams({
      u: shareContent.url,
      quote: shareContent.text
    });
    
    return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
  }

  /**
   * LINE共有用URLを生成
   */
  generateLineShareUrl(shareContent: ShareContent): string {
    const params = new URLSearchParams({
      text: `${shareContent.text}\n${shareContent.url}`
    });
    
    return `https://line.me/R/msg/text/?${params.toString()}`;
  }

  /**
   * クリップボードにコピー
   */
  async copyToClipboard(shareContent: ShareContent): Promise<boolean> {
    try {
      const textToCopy = `${shareContent.text}\n${shareContent.url}`;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * 画像をダウンロード
   */
  downloadImage(dataUrl: string, filename: string = 'curio-city-share.jpg'): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }
}