/**
 * Real User Monitoring (RUM) システム
 * Web Vitals と実際のユーザー体験を監視
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

interface RUMConfig {
  enabled: boolean;
  endpoint?: string;
  sampleRate: number;
  debug: boolean;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  userAgent: string;
  viewport: string;
  connection: string;
  referrer: string;
  language: string;
}

interface RUMEvent {
  sessionId: string;
  timestamp: number;
  type: 'performance' | 'user-interaction' | 'error' | 'navigation';
  data: any;
}

export class RealUserMonitoring {
  private static instance: RealUserMonitoring;
  private config: RUMConfig;
  private session: UserSession;
  private events: RUMEvent[] = [];
  private metricsCollected: Map<string, Metric> = new Map();

  private constructor(config: RUMConfig) {
    this.config = config;
    this.session = this.initializeSession();
    
    if (this.config.enabled) {
      this.startMonitoring();
    }
  }

  public static getInstance(config?: RUMConfig): RealUserMonitoring {
    if (!RealUserMonitoring.instance) {
      const defaultConfig: RUMConfig = {
        enabled: process.env.NODE_ENV === 'production',
        sampleRate: 0.1, // 10%のユーザーを監視
        debug: process.env.NODE_ENV === 'development'
      };
      
      RealUserMonitoring.instance = new RealUserMonitoring(
        config ? { ...defaultConfig, ...config } : defaultConfig
      );
    }
    return RealUserMonitoring.instance;
  }

  private initializeSession(): UserSession {
    const sessionId = this.generateSessionId();
    const connection = (navigator as any).connection;
    
    return {
      sessionId,
      startTime: Date.now(),
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      connection: connection ? 
        `${connection.effectiveType || 'unknown'} (${connection.downlink || 0}Mbps)` : 
        'unknown',
      referrer: document.referrer,
      language: navigator.language
    };
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startMonitoring(): void {
    // Web Vitals の監視
    this.monitorWebVitals();
    
    // ユーザーインタラクションの監視
    this.monitorUserInteractions();
    
    // エラーの監視
    this.monitorErrors();
    
    // ナビゲーションの監視
    this.monitorNavigations();
    
    // 定期的なデータ送信（30秒間隔）
    setInterval(() => {
      this.flush();
    }, 30000);

    // ページ離脱時のデータ送信
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });

    if (this.config.debug) {
      console.log('RUM monitoring started', this.session);
    }
  }

  private monitorWebVitals(): void {
    const recordMetric = (metric: Metric) => {
      // サンプリングチェック
      if (Math.random() > this.config.sampleRate) {
        return;
      }

      this.metricsCollected.set(metric.name, metric);
      
      this.recordEvent('performance', {
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        rating: this.getMetricRating(metric.name, metric.value),
        navigationType: this.getNavigationType()
      });

      if (this.config.debug) {
        console.log(`RUM Metric: ${metric.name}`, metric);
      }
    };

    onCLS(recordMetric);
    onFCP(recordMetric);
    onINP(recordMetric);
    onLCP(recordMetric);
    onTTFB(recordMetric);
  }

  private getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      INP: { good: 200, poor: 500 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private getNavigationType(): string {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!entry) return 'unknown';

    const types = ['navigate', 'reload', 'back_forward', 'prerender'];
    return types[(entry as any).type] || 'unknown';
  }

  private monitorUserInteractions(): void {
    const interactionTypes = ['click', 'scroll', 'keydown', 'touchstart'];
    
    interactionTypes.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.recordEvent('user-interaction', {
          type: eventType,
          target: this.getElementSelector(event.target as Element),
          timestamp: Date.now() - this.session.startTime,
          viewport: `${window.innerWidth}x${window.innerHeight}`
        });
      }, { passive: true });
    });

    // スクロール深度の監視
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        // 25%, 50%, 75%, 100%のマイルストーンでイベント記録
        const milestones = [25, 50, 75, 100];
        const milestone = milestones.find(m => scrollDepth >= m && maxScrollDepth < m);
        
        if (milestone) {
          this.recordEvent('user-interaction', {
            type: 'scroll-milestone',
            depth: milestone,
            timestamp: Date.now() - this.session.startTime
          });
        }
      }
    }, { passive: true });
  }

  private getElementSelector(element: Element): string {
    if (!element) return 'unknown';
    
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    
    return `${tagName}${id}${className}`.substr(0, 100);
  }

  private monitorErrors(): void {
    // JavaScript エラー
    window.addEventListener('error', (event) => {
      this.recordEvent('error', {
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now() - this.session.startTime
      });
    });

    // Promise rejection エラー
    window.addEventListener('unhandledrejection', (event) => {
      this.recordEvent('error', {
        type: 'unhandled-promise',
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
        timestamp: Date.now() - this.session.startTime
      });
    });

    // リソース読み込みエラー
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.recordEvent('error', {
          type: 'resource',
          source: (event.target as any)?.src || (event.target as any)?.href,
          tagName: (event.target as any)?.tagName,
          timestamp: Date.now() - this.session.startTime
        });
      }
    }, true);
  }

  private monitorNavigations(): void {
    // SPA ナビゲーション（History API）
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      RealUserMonitoring.instance.recordEvent('navigation', {
        type: 'pushstate',
        from: window.location.pathname,
        to: args[2] || args[1],
        timestamp: Date.now() - RealUserMonitoring.instance.session.startTime
      });
      return originalPushState.apply(history, args);
    };

    history.replaceState = function(...args) {
      RealUserMonitoring.instance.recordEvent('navigation', {
        type: 'replacestate',
        from: window.location.pathname,
        to: args[2] || args[1],
        timestamp: Date.now() - RealUserMonitoring.instance.session.startTime
      });
      return originalReplaceState.apply(history, args);
    };

    window.addEventListener('popstate', () => {
      this.recordEvent('navigation', {
        type: 'popstate',
        to: window.location.pathname,
        timestamp: Date.now() - this.session.startTime
      });
    });
  }

  private recordEvent(type: RUMEvent['type'], data: any): void {
    this.events.push({
      sessionId: this.session.sessionId,
      timestamp: Date.now(),
      type,
      data
    });

    // メモリ使用量制限（1000イベント）
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500); // 半分に削減
    }
  }

  /**
   * データをサーバーに送信
   */
  private flush(isBeforeUnload = false): void {
    if (this.events.length === 0) return;

    const payload = {
      session: this.session,
      events: [...this.events],
      metrics: Object.fromEntries(this.metricsCollected),
      timestamp: Date.now()
    };

    // イベントをクリア
    this.events = [];

    if (this.config.endpoint) {
      // サーバーエンドポイントに送信
      const sendMethod = isBeforeUnload ? 'sendBeacon' : 'fetch';
      
      if (sendMethod === 'sendBeacon' && navigator.sendBeacon) {
        navigator.sendBeacon(this.config.endpoint, JSON.stringify(payload));
      } else {
        fetch(this.config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: isBeforeUnload
        }).catch(error => {
          if (this.config.debug) {
            console.error('RUM data send failed:', error);
          }
        });
      }
    }

    // Google Analytics に送信（もしくは他の分析サービス）
    this.sendToAnalytics(payload);

    if (this.config.debug) {
      console.log('RUM data flushed:', payload);
    }
  }

  private sendToAnalytics(payload: any): void {
    // Google Analytics 4 の例
    if (typeof (window as any).gtag !== 'undefined') {
      const gtag = (window as any).gtag;
      
      // メトリクス送信
      Object.entries(payload.metrics).forEach(([name, metric]: [string, any]) => {
        gtag('event', 'web_vital', {
          name: name,
          value: metric.value,
          metric_delta: metric.delta,
          metric_rating: this.getMetricRating(name, metric.value)
        });
      });

      // エラー送信
      payload.events.filter((e: RUMEvent) => e.type === 'error').forEach((event: RUMEvent) => {
        gtag('event', 'exception', {
          description: event.data.message || event.data.reason,
          fatal: false
        });
      });
    }

    // カスタム分析サービスへの送信も可能
  }

  /**
   * 手動でカスタムイベントを記録
   */
  public recordCustomEvent(name: string, data: any): void {
    this.recordEvent('user-interaction', {
      type: 'custom',
      name,
      data,
      timestamp: Date.now() - this.session.startTime
    });
  }

  /**
   * 現在のセッション情報を取得
   */
  public getSession(): UserSession {
    return { ...this.session };
  }

  /**
   * 収集したメトリクスを取得
   */
  public getMetrics(): Record<string, Metric> {
    return Object.fromEntries(this.metricsCollected);
  }

  /**
   * レポート生成
   */
  public generateReport(): any {
    return {
      session: this.session,
      metrics: Object.fromEntries(this.metricsCollected),
      eventCounts: this.getEventCounts(),
      errors: this.events.filter(e => e.type === 'error'),
      performance: this.calculatePerformanceScore()
    };
  }

  private getEventCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.events.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });
    return counts;
  }

  private calculatePerformanceScore(): number {
    let totalScore = 0;
    let metricCount = 0;

    this.metricsCollected.forEach((metric, name) => {
      const rating = this.getMetricRating(name, metric.value);
      let score = 100;
      
      if (rating === 'needs-improvement') score = 50;
      else if (rating === 'poor') score = 0;

      totalScore += score;
      metricCount++;
    });

    return metricCount > 0 ? Math.round(totalScore / metricCount) : 0;
  }
}

// グローバル関数として公開
declare global {
  interface Window {
    RUM?: RealUserMonitoring;
  }
}

// 自動初期化（プロダクション環境のみ）
if (typeof window !== 'undefined') {
  window.RUM = RealUserMonitoring.getInstance();
}

export default RealUserMonitoring;