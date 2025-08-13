/**
 * SerenaMCP 画像読み込み診断システム
 * リアルタイムで画像ソースの状態を監視・診断
 */

export interface ImageSourceDiagnostic {
  url: string;
  status: 'testing' | 'success' | 'failed' | 'timeout' | 'cors-error';
  responseTime?: number;
  errorDetails?: string;
  timestamp: number;
}

export interface ImageDiagnosticReport {
  totalSources: number;
  workingSources: number;
  failedSources: number;
  fastestSource?: ImageSourceDiagnostic;
  diagnostics: ImageSourceDiagnostic[];
  recommendation: string;
}

export class SerenaMCPImageDiagnostics {
  private static instance: SerenaMCPImageDiagnostics;
  private diagnosticHistory: ImageDiagnosticReport[] = [];

  public static getInstance(): SerenaMCPImageDiagnostics {
    if (!SerenaMCPImageDiagnostics.instance) {
      SerenaMCPImageDiagnostics.instance = new SerenaMCPImageDiagnostics();
    }
    return SerenaMCPImageDiagnostics.instance;
  }

  /**
   * 複数の画像URLを並行テストして最適なソースを特定
   */
  public async testImageSources(urls: string[]): Promise<ImageDiagnosticReport> {
    console.log('🔍 SerenaMCP: 画像ソース診断開始', urls.length, '件');
    
    const diagnostics: ImageSourceDiagnostic[] = [];
    
    // 並行テスト実行
    const testPromises = urls.map(async (url, index) => {
      const startTime = Date.now();
      const diagnostic: ImageSourceDiagnostic = {
        url,
        status: 'testing',
        timestamp: startTime
      };
      
      try {
        // 新しいImage要素でテスト（実際のブラウザ環境での読み込み）
        const success = await this.testImageLoad(url, 3000); // 3秒タイムアウト
        
        if (success) {
          diagnostic.status = 'success';
          diagnostic.responseTime = Date.now() - startTime;
          console.log(`✅ SerenaMCP: 画像ソース${index + 1}成功`, url, `${diagnostic.responseTime}ms`);
        } else {
          diagnostic.status = 'timeout';
          diagnostic.errorDetails = 'タイムアウト';
          console.log(`⏰ SerenaMCP: 画像ソース${index + 1}タイムアウト`, url);
        }
      } catch (error) {
        diagnostic.status = 'failed';
        diagnostic.errorDetails = error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ SerenaMCP: 画像ソース${index + 1}失敗`, url, diagnostic.errorDetails);
      }
      
      return diagnostic;
    });
    
    // 全テスト完了を待機
    const results = await Promise.allSettled(testPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        diagnostics.push(result.value);
      } else {
        diagnostics.push({
          url: urls[index],
          status: 'failed',
          errorDetails: 'Promise rejection',
          timestamp: Date.now()
        });
      }
    });
    
    // 診断レポート生成
    const workingSources = diagnostics.filter(d => d.status === 'success');
    const failedSources = diagnostics.filter(d => d.status !== 'success');
    
    const fastestSource = workingSources.length > 0 
      ? workingSources.reduce((fastest, current) => 
          (current.responseTime || Infinity) < (fastest.responseTime || Infinity) ? current : fastest
        )
      : undefined;
    
    const report: ImageDiagnosticReport = {
      totalSources: urls.length,
      workingSources: workingSources.length,
      failedSources: failedSources.length,
      fastestSource,
      diagnostics,
      recommendation: this.generateRecommendation(workingSources, failedSources)
    };
    
    this.diagnosticHistory.push(report);
    
    console.log('📊 SerenaMCP診断完了:', {
      動作中: report.workingSources,
      失敗: report.failedSources,
      最速: fastestSource?.url,
      推奨: report.recommendation
    });
    
    return report;
  }
  
  /**
   * 単一画像の読み込みテスト
   */
  private testImageLoad(url: string, timeout: number = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      let timeoutId: NodeJS.Timeout;
      let resolved = false;
      
      const resolveOnce = (success: boolean) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve(success);
        }
      };
      
      // クロスオリジン対応
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolveOnce(true);
      img.onerror = () => resolveOnce(false);
      
      timeoutId = setTimeout(() => resolveOnce(false), timeout);
      
      img.src = url;
    });
  }
  
  /**
   * 診断結果に基づく推奨事項を生成
   */
  private generateRecommendation(workingSources: ImageSourceDiagnostic[], failedSources: ImageSourceDiagnostic[]): string {
    if (workingSources.length === 0) {
      return 'すべての外部画像ソースが利用できません。グラデーション背景のみ使用してください。';
    }
    
    if (workingSources.length === 1) {
      return `1つの画像ソースのみ利用可能です: ${workingSources[0].url}`;
    }
    
    const fastestSource = workingSources.reduce((fastest, current) => 
      (current.responseTime || Infinity) < (fastest.responseTime || Infinity) ? current : fastest
    );
    
    return `${workingSources.length}個の画像ソースが利用可能。最速: ${fastestSource.url} (${fastestSource.responseTime}ms)`;
  }
  
  /**
   * より堅牢な画像URLリストを生成
   */
  public generateRobustImageUrls(seed: number): string[] {
    const urls: string[] = [];
    
    console.log('🛡️ SerenaMCP: 堅牢画像URL生成開始 seed:', seed);
    
    // 1. Lorem Flicker (代替画像サービス)
    urls.push(`https://loremflickr.com/1920/1080/nature,landscape?random=${seed}`);
    
    // 2. Picsum Photos (複数形式)
    urls.push(`https://picsum.photos/1920/1080?random=${seed}`);
    urls.push(`https://picsum.photos/seed/serena${seed}/1920/1080`);
    
    // 3. 異なる解像度のPicsum（フォールバック）
    urls.push(`https://picsum.photos/1280/720?random=${seed + 1000}`);
    
    // 4. 最終的に常に動作するdata URL
    urls.push(this.generateDataUrlImage(seed));
    
    console.log('🛡️ SerenaMCP: 生成完了', urls.length, '個のURL');
    
    return urls;
  }
  
  /**
   * CSS グラデーション背景を生成（テキストなし）
   */
  private generateDataUrlImage(seed: number): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];
    
    return gradients[seed % gradients.length];
  }
  
  /**
   * 診断履歴を取得
   */
  public getDiagnosticHistory(): ImageDiagnosticReport[] {
    return [...this.diagnosticHistory];
  }
  
  /**
   * 統計情報を取得
   */
  public getStats() {
    if (this.diagnosticHistory.length === 0) {
      return { totalTests: 0, averageWorkingSources: 0, mostReliableSource: null };
    }
    
    const totalTests = this.diagnosticHistory.length;
    const averageWorkingSources = this.diagnosticHistory.reduce((sum, report) => sum + report.workingSources, 0) / totalTests;
    
    // 最も信頼性の高いソースを特定
    const sourceSuccessRate: Record<string, { success: number; total: number }> = {};
    
    this.diagnosticHistory.forEach(report => {
      report.diagnostics.forEach(diagnostic => {
        if (!sourceSuccessRate[diagnostic.url]) {
          sourceSuccessRate[diagnostic.url] = { success: 0, total: 0 };
        }
        sourceSuccessRate[diagnostic.url].total++;
        if (diagnostic.status === 'success') {
          sourceSuccessRate[diagnostic.url].success++;
        }
      });
    });
    
    const mostReliableSource = Object.entries(sourceSuccessRate)
      .map(([url, stats]) => ({ url, successRate: stats.success / stats.total }))
      .sort((a, b) => b.successRate - a.successRate)[0];
    
    return {
      totalTests,
      averageWorkingSources,
      mostReliableSource
    };
  }
}

export default SerenaMCPImageDiagnostics;