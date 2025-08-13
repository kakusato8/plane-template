/**
 * Service Worker 管理ユーティリティ
 */

interface ServiceWorkerManager {
  register(): Promise<ServiceWorkerRegistration | null>;
  unregister(): Promise<boolean>;
  getCacheStats(): Promise<Record<string, number>>;
  clearCache(): Promise<boolean>;
  updateServiceWorker(): Promise<void>;
}

class ServiceWorkerManagerImpl implements ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.isEnabled = 'serviceWorker' in navigator && process.env.NODE_ENV === 'production';
  }

  /**
   * Service Worker の登録
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isEnabled) {
      console.log('Service Worker is disabled or not supported');
      return null;
    }

    try {
      // 既存の登録をチェック
      const existingRegistration = await navigator.serviceWorker.getRegistration();
      if (existingRegistration) {
        this.registration = existingRegistration;
        this.setupEventListeners();
        return existingRegistration;
      }

      // 新規登録
      console.log('Registering Service Worker...');
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // 常に最新のSWファイルをチェック
      });

      this.setupEventListeners();
      
      console.log('Service Worker registered successfully');
      return this.registration;
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Service Worker の登録解除
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      console.log('Service Worker unregistered successfully');
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * キャッシュ統計の取得
   */
  async getCacheStats(): Promise<Record<string, number>> {
    if (!this.registration?.active) {
      return {};
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data || {});
      };

      this.registration!.active!.postMessage(
        { type: 'GET_CACHE_STATS' },
        [messageChannel.port2]
      );

      // タイムアウト処理
      setTimeout(() => resolve({}), 5000);
    });
  }

  /**
   * キャッシュのクリア
   */
  async clearCache(): Promise<boolean> {
    if (!this.registration?.active) {
      return false;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data?.success || false);
      };

      this.registration!.active!.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );

      // タイムアウト処理
      setTimeout(() => resolve(false), 10000);
    });
  }

  /**
   * Service Worker の更新
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update failed:', error);
      throw error;
    }
  }

  /**
   * ルートのプリロード
   */
  async preloadRoutes(routes: string[]): Promise<void> {
    if (!this.registration?.active) {
      return;
    }

    this.registration.active.postMessage({
      type: 'PRELOAD_ROUTES',
      payload: { routes }
    });
  }

  /**
   * イベントリスナーの設定
   */
  private setupEventListeners(): void {
    if (!this.registration) return;

    // 新しいService Workerがインストールされた時
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (!newWorker) return;

      console.log('New Service Worker installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // 既存のSWがある場合、ユーザーに更新を通知
            this.showUpdateNotification();
          } else {
            // 初回インストールの場合
            console.log('Service Worker installed for the first time');
            this.showInstallNotification();
          }
        }
      });
    });

    // コントローラーが変更された時
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
      window.location.reload();
    });

    // Service Workerからのメッセージ
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });
  }

  /**
   * Service Workerからのメッセージハンドリング
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, payload } = event.data || {};

    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', payload);
        break;
        
      case 'OFFLINE_FALLBACK':
        console.log('Offline fallback activated');
        this.showOfflineNotification();
        break;
        
      default:
        console.log('Unknown message from Service Worker:', event.data);
    }
  }

  /**
   * 更新通知の表示
   */
  private showUpdateNotification(): void {
    // カスタムイベントを発火してアプリケーションに通知
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: {
        message: 'アプリケーションの新しいバージョンが利用可能です',
        action: () => this.skipWaiting()
      }
    }));
  }

  /**
   * インストール通知の表示
   */
  private showInstallNotification(): void {
    window.dispatchEvent(new CustomEvent('sw-installed', {
      detail: {
        message: 'アプリケーションがオフラインでも利用できるようになりました'
      }
    }));
  }

  /**
   * オフライン通知の表示
   */
  private showOfflineNotification(): void {
    window.dispatchEvent(new CustomEvent('sw-offline-ready', {
      detail: {
        message: 'オフラインモードで動作中です'
      }
    }));
  }

  /**
   * 新しいService Workerへの切り替え
   */
  private async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      return;
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Service Worker の状態取得
   */
  getStatus(): {
    isSupported: boolean;
    isRegistered: boolean;
    isActive: boolean;
    isEnabled: boolean;
  } {
    return {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: !!this.registration,
      isActive: !!this.registration?.active,
      isEnabled: this.isEnabled
    };
  }

  /**
   * ネットワーク状態の監視
   */
  startNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('Network: Online');
      window.dispatchEvent(new CustomEvent('network-status-change', {
        detail: { online: true }
      }));
    });

    window.addEventListener('offline', () => {
      console.log('Network: Offline');
      window.dispatchEvent(new CustomEvent('network-status-change', {
        detail: { online: false }
      }));
    });
  }
}

// シングルトンインスタンス
const serviceWorkerManager = new ServiceWorkerManagerImpl();

export default serviceWorkerManager;

// 型エクスポート
export type { ServiceWorkerManager };