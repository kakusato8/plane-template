/**
 * Web Vitals パフォーマンス監視システム（web-vitalsライブラリ統合）
 */
import { 
  onCLS, 
  onINP, 
  onFCP, 
  onLCP, 
  onTTFB,
  type Metric
} from 'web-vitals';

interface PerformanceMetric extends Metric {
  timestamp: number;
  url?: string;
  userAgent?: string;
  connectionType?: string;
}

interface PerformanceReport {
  fcp?: PerformanceMetric;
  lcp?: PerformanceMetric;
  cls?: PerformanceMetric;
  fid?: PerformanceMetric;
  ttfb?: PerformanceMetric;
  inp?: PerformanceMetric;
}

interface PerformanceThresholds {
  fcp: { good: number; poor: number };
  lcp: { good: number; poor: number };
  cls: { good: number; poor: number };
  fid: { good: number; poor: number };
  ttfb: { good: number; poor: number };
  inp: { good: number; poor: number };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceReport = {};
  private observers: PerformanceObserver[] = [];
  private onMetricCallback?: (metric: PerformanceMetric) => void;

  // Web Vitals の閾値（ミリ秒）
  private readonly thresholds: PerformanceThresholds = {
    fcp: { good: 1800, poor: 3000 },
    lcp: { good: 2500, poor: 4000 },
    cls: { good: 0.1, poor: 0.25 },
    fid: { good: 100, poor: 300 },
    ttfb: { good: 800, poor: 1800 },
    inp: { good: 200, poor: 500 }
  };

  private constructor() {
    this.initializeWebVitals();
    this.initializeCustomObservers();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Web Vitals ライブラリの初期化
   */
  private initializeWebVitals(): void {
    if (typeof window === 'undefined') return;

    const onMetric = (metric: Metric) => {
      this.recordWebVitalsMetric(metric);
    };

    // Core Web Vitals
    onCLS(onMetric);
    onINP(onMetric);  // FIDの代わりにINPを使用
    onFCP(onMetric);
    onLCP(onMetric);
    onTTFB(onMetric);

    console.log('Web Vitals monitoring initialized');
  }

  /**
   * カスタム観測の初期化
   */
  private initializeCustomObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Interaction to Next Paint (INP) - 実験的機能
    this.observeMetric('event', (entries) => {
      const eventEntries = entries as PerformanceEventTiming[];
      for (const entry of eventEntries) {
        if (entry.duration > 0) {
          const inpMetric: PerformanceMetric = {
            name: 'INP',
            value: entry.duration,
            delta: entry.duration,
            rating: this.getRating('inp', entry.duration),
            id: this.generateId(),
            timestamp: Date.now(),
            entries: [entry],
            navigationType: 'navigate',
            url: window.location.href,
            userAgent: navigator.userAgent,
            connectionType: this.getConnectionType()
          };
          this.recordINPMetric(inpMetric);
        }
      }
    });

    // ページロード完了時のメトリクス取得
    if (document.readyState === 'complete') {
      this.captureNavigationMetrics();
    } else {
      window.addEventListener('load', () => {
        this.captureNavigationMetrics();
      });
    }
  }

  /**
   * パフォーマンス観測の設定
   */
  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ 
        type, 
        buffered: true 
      });

      this.observers.push(observer);
    } catch (error) {
      console.warn(`Failed to observe ${type} metrics:`, error);
    }
  }

  /**
   * ナビゲーションメトリクスの取得
   */
  private captureNavigationMetrics(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      // DOM Content Loaded
      const dcl = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      this.recordCustomMetric('dcl', dcl, 'DOM読み込み時間');

      // Load Event
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      this.recordCustomMetric('load', loadTime, 'ページ読み込み時間');

      // DNS解決時間
      const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
      this.recordCustomMetric('dns', dnsTime, 'DNS解決時間');

      // TCP接続時間
      const tcpTime = navigation.connectEnd - navigation.connectStart;
      this.recordCustomMetric('tcp', tcpTime, 'TCP接続時間');
      
      // TTFBをレガシーメソッドでも記録（デバッグ用）
      const ttfb = navigation.responseStart - navigation.requestStart;
      if (ttfb > 0) {
        this.recordLegacyMetric('ttfb', ttfb, ttfb);
      }
    }
  }

  /**
   * Web Vitals メトリクスの記録
   */
  private recordWebVitalsMetric(metric: Metric): void {
    const enhancedMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType()
    };

    // メトリクス名の正規化
    const normalizedName = metric.name.toLowerCase() as keyof PerformanceReport;
    this.metrics[normalizedName] = enhancedMetric;

    console.log(`Web Vitals - ${metric.name}: ${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'} (${metric.rating})`);

    if (this.onMetricCallback) {
      this.onMetricCallback(enhancedMetric);
    }

    // パフォーマンス問題の検出
    this.detectPerformanceIssues(enhancedMetric);

    // Analyticsに送信（任意）
    this.sendToAnalytics(enhancedMetric);
  }

  /**
   * INP メトリクスの記録（実験的）
   */
  private recordINPMetric(metric: PerformanceMetric): void {
    // 既存のINPより悪いもののみ記録
    if (!this.metrics.inp || metric.value > this.metrics.inp.value) {
      this.metrics.inp = metric;
      
      console.log(`INP (experimental): ${metric.value.toFixed(2)}ms (${metric.rating})`);

      if (this.onMetricCallback) {
        this.onMetricCallback(metric);
      }
    }
  }

  /**
   * レガシーメトリクスの記録（互換性維持）
   */
  private recordLegacyMetric(name: keyof PerformanceThresholds, value: number, delta: number): void {
    const rating = this.getRating(name, value);
    const metric: PerformanceMetric = {
      name: name.toUpperCase() as any,
      value,
      delta,
      id: this.generateId(),
      rating,
      timestamp: Date.now(),
      entries: [],
      navigationType: 'navigate',
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType()
    };

    this.metrics[name] = metric;

    console.log(`Performance Metric - ${name.toUpperCase()}: ${value.toFixed(2)}ms (${rating})`);

    if (this.onMetricCallback) {
      this.onMetricCallback(metric);
    }

    // パフォーマンス問題の検出
    this.detectPerformanceIssues(metric);
  }

  /**
   * カスタムメトリクスの記録
   */
  private recordCustomMetric(name: string, value: number, description?: string): void {
    console.log(`Custom Metric - ${name}: ${value.toFixed(2)}ms${description ? ` (${description})` : ''}`);
  }

  /**
   * メトリクスの評価
   */
  private getRating(name: keyof PerformanceThresholds, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[name];
    if (value <= threshold.good) {
      return 'good';
    } else if (value <= threshold.poor) {
      return 'needs-improvement';
    } else {
      return 'poor';
    }
  }

  /**
   * 接続タイプの取得
   */
  private getConnectionType(): string {
    // @ts-ignore - Network Information API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  /**
   * Analyticsへの送信
   */
  private sendToAnalytics(metric: PerformanceMetric): void {
    // Google Analytics 4 の場合の例
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag;
      gtag('event', 'web_vitals', {
        custom_metric: metric.name,
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        metric_delta: Math.round(metric.delta)
      });
    }

    // その他のアナリティクスサービスに送信可能
    // Firebase Analytics, Mixpanel, など
  }

  /**
   * パフォーマンス問題の検出
   */
  private detectPerformanceIssues(metric: PerformanceMetric): void {
    if (metric.rating === 'poor') {
      const metricKey = metric.name.toLowerCase() as keyof PerformanceThresholds;
      
      console.warn(`Performance Issue Detected - ${metric.name}:`, {
        value: metric.value,
        threshold: this.thresholds[metricKey],
        suggestions: this.getImprovementSuggestions(metricKey)
      });

      // カスタムイベントを発火
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('performance-issue', {
          detail: {
            metric,
            suggestions: this.getImprovementSuggestions(metricKey)
          }
        }));
      }

      // 開発環境では詳細ログを出力
      if (process.env.NODE_ENV === 'development') {
        console.group(`🚨 Performance Alert: ${metric.name}`);
        console.log('Current value:', metric.value);
        console.log('Rating:', metric.rating);
        console.log('Timestamp:', new Date(metric.timestamp).toISOString());
        console.log('URL:', metric.url);
        console.log('Connection:', metric.connectionType);
        console.groupEnd();
      }
    }
  }

  /**
   * 改善提案の取得
   */
  private getImprovementSuggestions(metricName: string): string[] {
    const suggestions: Record<string, string[]> = {
      fcp: [
        '重要なCSS・JSの最適化',
        'フォントの事前読み込み',
        'サーバーレスポンス時間の改善'
      ],
      lcp: [
        '重要な画像の最適化',
        '不要なJavaScriptの削除',
        'CDNの使用'
      ],
      cls: [
        '画像・動画のサイズ指定',
        '動的コンテンツの事前スペース確保',
        'Webフォントの最適化'
      ],
      fid: [
        'JavaScriptの実行時間短縮',
        'コード分割の実装',
        'メインスレッドの負荷軽減'
      ],
      ttfb: [
        'サーバー処理の最適化',
        'キャッシュ戦略の見直し',
        'CDNの活用'
      ],
      inp: [
        'イベントハンドラーの最適化',
        'UIの応答性改善',
        '重い処理のワーカー移行'
      ]
    };

    return suggestions[metricName] || ['一般的なパフォーマンス最適化'];
  }

  /**
   * ユニークIDの生成
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API

  /**
   * メトリクス取得
   */
  getMetrics(): PerformanceReport {
    return { ...this.metrics };
  }

  /**
   * メトリクス監視の開始
   */
  startMonitoring(callback?: (metric: PerformanceMetric) => void): void {
    this.onMetricCallback = callback;
    console.log('Performance monitoring started');
  }

  /**
   * メトリクス監視の停止
   */
  stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.onMetricCallback = undefined;
    console.log('Performance monitoring stopped');
  }

  /**
   * パフォーマンススコアの計算
   */
  calculateScore(): { score: number; grade: string; details: Record<string, any> } {
    const metrics = this.getMetrics();
    let totalScore = 0;
    let validMetrics = 0;

    // 各メトリクスのスコア計算（0-100）
    const scores: Record<string, number> = {};

    Object.entries(metrics).forEach(([name, metric]) => {
      if (metric) {
        let score = 100;
        // const threshold = this.thresholds[name as keyof PerformanceThresholds];
        
        if (metric.rating === 'poor') {
          score = 0;
        } else if (metric.rating === 'needs-improvement') {
          score = 50;
        }

        scores[name] = score;
        totalScore += score;
        validMetrics++;
      }
    });

    const averageScore = validMetrics > 0 ? totalScore / validMetrics : 0;
    
    let grade = 'F';
    if (averageScore >= 90) grade = 'A';
    else if (averageScore >= 80) grade = 'B';
    else if (averageScore >= 70) grade = 'C';
    else if (averageScore >= 60) grade = 'D';

    return {
      score: Math.round(averageScore),
      grade,
      details: {
        scores,
        totalMetrics: validMetrics,
        timestamp: Date.now()
      }
    };
  }

  /**
   * パフォーマンスレポートの生成
   */
  generateReport(): {
    summary: any;
    metrics: PerformanceReport;
    score: any;
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const score = this.calculateScore();
    
    const recommendations: string[] = [];
    Object.entries(metrics).forEach(([name, metric]) => {
      if (metric && metric.rating === 'poor') {
        recommendations.push(...this.getImprovementSuggestions(name));
      }
    });

    return {
      summary: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        connectionType: this.getConnectionType(),
        deviceMemory: (navigator as any).deviceMemory || 'unknown',
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        language: navigator.language
      },
      metrics,
      score,
      recommendations: [...new Set(recommendations)] // 重複除去
    };
  }

  /**
   * リアルタイムメトリクス監視の開始
   */
  startRealTimeMonitoring(interval: number = 5000): void {
    this.startMonitoring();
    
    setInterval(() => {
      const currentMetrics = this.getMetrics();
      const score = this.calculateScore();
      
      // 開発環境でのリアルタイムログ
      if (process.env.NODE_ENV === 'development') {
        console.group('📊 Performance Status');
        console.log('Score:', `${score.score}/100 (${score.grade})`);
        Object.entries(currentMetrics).forEach(([name, metric]) => {
          if (metric) {
            console.log(`${name.toUpperCase()}:`, `${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'} (${metric.rating})`);
          }
        });
        console.groupEnd();
      }
    }, interval);
  }

  /**
   * Web Vitalsデバッグ情報の出力
   */
  debugInfo(): void {
    console.group('🔧 Web Vitals Debug Info');
    console.log('Browser Support:', {
      PerformanceObserver: 'PerformanceObserver' in window,
      NetworkInformation: 'connection' in navigator,
      ServiceWorker: 'serviceWorker' in navigator,
      WebVitalsLibrary: typeof onCLS !== 'undefined'
    });
    console.log('Current Metrics:', this.getMetrics());
    console.log('Thresholds:', this.thresholds);
    console.log('Score:', this.calculateScore());
    console.groupEnd();
  }

  /**
   * メトリクスのエクスポート（JSON形式）
   */
  exportMetrics(): string {
    return JSON.stringify(this.generateReport(), null, 2);
  }

  /**
   * パフォーマンスメトリクスの比較
   */
  compareMetrics(previousMetrics: PerformanceReport): {
    improvements: string[];
    regressions: string[];
    unchanged: string[];
  } {
    const current = this.getMetrics();
    const improvements: string[] = [];
    const regressions: string[] = [];
    const unchanged: string[] = [];

    Object.entries(current).forEach(([name, currentMetric]) => {
      const previousMetric = previousMetrics[name as keyof PerformanceReport];
      
      if (!previousMetric || !currentMetric) {
        unchanged.push(name);
        return;
      }

      const currentRating = currentMetric.rating;
      const previousRating = previousMetric.rating;

      if (currentRating === previousRating) {
        unchanged.push(name);
      } else if (
        (currentRating === 'good' && previousRating !== 'good') ||
        (currentRating === 'needs-improvement' && previousRating === 'poor')
      ) {
        improvements.push(name);
      } else {
        regressions.push(name);
      }
    });

    return { improvements, regressions, unchanged };
  }
}