/**
 * 高度なデータ圧縮ユーティリティ
 */
import pako from 'pako';

export interface CompressionOptions {
  level?: number; // 圧縮レベル (1-9)
  threshold?: number; // 圧縮を開始する最小サイズ（バイト）
  method?: 'gzip' | 'deflate' | 'base64';
}

export interface CompressionResult {
  data: string | Uint8Array;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  method: string;
  compressed: boolean;
}

export class DataCompression {
  private static readonly DEFAULT_OPTIONS: Required<CompressionOptions> = {
    level: 6,
    threshold: 1024, // 1KB以上で圧縮
    method: 'gzip'
  };

  /**
   * データを圧縮
   */
  static compress(data: any, options: CompressionOptions = {}): CompressionResult {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    const jsonString = JSON.stringify(data);
    const originalSize = new TextEncoder().encode(jsonString).length;

    // 閾値未満の場合は圧縮しない
    if (originalSize < config.threshold) {
      return {
        data: jsonString,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        method: 'none',
        compressed: false
      };
    }

    let compressedData: string | Uint8Array;
    let compressedSize: number;
    let method: string;

    try {
      switch (config.method) {
        case 'gzip':
          compressedData = pako.gzip(jsonString, { level: config.level as pako.DeflateOptions['level'] });
          compressedSize = compressedData.length;
          method = 'gzip';
          break;
        
        case 'deflate':
          compressedData = pako.deflate(jsonString, { level: config.level as pako.DeflateOptions['level'] });
          compressedSize = compressedData.length;
          method = 'deflate';
          break;
        
        case 'base64':
        default:
          compressedData = btoa(jsonString);
          compressedSize = compressedData.length;
          method = 'base64';
          break;
      }

      const compressionRatio = compressedSize / originalSize;

      // 圧縮効果が薄い場合は圧縮しない（圧縮率が90%以上）
      if (compressionRatio > 0.9) {
        return {
          data: jsonString,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1,
          method: 'none',
          compressed: false
        };
      }

      return {
        data: compressedData,
        originalSize,
        compressedSize,
        compressionRatio,
        method,
        compressed: true
      };
    } catch (error) {
      console.warn('Compression failed, using original data:', error);
      return {
        data: jsonString,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        method: 'none',
        compressed: false
      };
    }
  }

  /**
   * データを展開
   */
  static decompress(compressedData: string | Uint8Array, method: string): any {
    try {
      let jsonString: string;

      switch (method) {
        case 'gzip':
          if (typeof compressedData === 'string') {
            throw new Error('GZIP data must be Uint8Array');
          }
          jsonString = pako.ungzip(compressedData, { to: 'string' });
          break;
        
        case 'deflate':
          if (typeof compressedData === 'string') {
            throw new Error('Deflate data must be Uint8Array');
          }
          jsonString = pako.inflate(compressedData, { to: 'string' });
          break;
        
        case 'base64':
          if (typeof compressedData !== 'string') {
            throw new Error('Base64 data must be string');
          }
          jsonString = atob(compressedData);
          break;
        
        case 'none':
        default:
          jsonString = compressedData as string;
          break;
      }

      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decompression failed:', error);
      throw new Error(`Failed to decompress data (method: ${method})`);
    }
  }

  /**
   * 圧縮テスト（最適な圧縮方法を判定）
   */
  static testCompression(data: any): CompressionResult[] {
    const methods: CompressionOptions['method'][] = ['gzip', 'deflate', 'base64'];
    const results: CompressionResult[] = [];

    for (const method of methods) {
      const result = this.compress(data, { method });
      results.push(result);
    }

    // 圧縮率で並び替え
    return results.sort((a, b) => a.compressionRatio - b.compressionRatio);
  }

  /**
   * 最適な圧縮設定を取得
   */
  static getOptimalCompression(data: any): CompressionOptions {
    const testResults = this.testCompression(data);
    const best = testResults[0];

    if (!best.compressed) {
      return { method: 'base64', threshold: best.originalSize * 2 };
    }

    return {
      method: best.method as CompressionOptions['method'],
      level: 6, // バランスの良いレベル
      threshold: 1024
    };
  }

  /**
   * 圧縮統計を取得
   */
  static getCompressionStats(results: CompressionResult[]): {
    totalOriginalSize: number;
    totalCompressedSize: number;
    averageCompressionRatio: number;
    spaceSaved: number;
    spaceSavedPercent: number;
  } {
    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const averageCompressionRatio = totalCompressedSize / totalOriginalSize;
    const spaceSaved = totalOriginalSize - totalCompressedSize;
    const spaceSavedPercent = (spaceSaved / totalOriginalSize) * 100;

    return {
      totalOriginalSize,
      totalCompressedSize,
      averageCompressionRatio,
      spaceSaved,
      spaceSavedPercent
    };
  }

  /**
   * ブラウザの圧縮サポート確認
   */
  static checkBrowserSupport(): {
    gzip: boolean;
    deflate: boolean;
    base64: boolean;
    compressionStreams: boolean;
  } {
    const support = {
      gzip: true,
      deflate: true,
      base64: typeof btoa !== 'undefined' && typeof atob !== 'undefined',
      compressionStreams: 'CompressionStream' in globalThis && 'DecompressionStream' in globalThis
    };

    try {
      pako.gzip('test');
      pako.deflate('test');
    } catch {
      support.gzip = false;
      support.deflate = false;
    }

    return support;
  }

  /**
   * ファイルサイズのフォーマット
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}