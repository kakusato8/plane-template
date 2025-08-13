/**
 * 軽量画像プリロードマネージャー
 * 画像読み込み完了を待ってから画面遷移を行うためのシンプルなシステム
 */

export class SimplePreloadManager {
  private static instance: SimplePreloadManager;
  private imageCache = new Map<string, HTMLImageElement>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();

  static getInstance(): SimplePreloadManager {
    if (!this.instance) {
      this.instance = new SimplePreloadManager();
    }
    return this.instance;
  }

  /**
   * 画像をプリロードし、完了まで待機する
   * @param imageUrl 読み込む画像のURL
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 読み込み成功時true、失敗時false
   */
  async preloadAndWait(imageUrl: string, timeout = 10000): Promise<boolean> {
    console.log('🎯 画像プリロード開始:', imageUrl);

    // キャッシュチェック
    if (this.imageCache.has(imageUrl)) {
      console.log('✅ キャッシュから取得:', imageUrl);
      return true;
    }

    // 既存のロード処理チェック
    if (this.loadingPromises.has(imageUrl)) {
      console.log('⏳ 既存のロード処理を待機:', imageUrl);
      try {
        await this.loadingPromises.get(imageUrl);
        return true;
      } catch (error) {
        console.warn('❌ 既存ロード処理が失敗:', imageUrl, error);
        return false;
      }
    }

    // 新規ロード
    const loadPromise = this.loadImageWithTimeout(imageUrl, timeout);
    this.loadingPromises.set(imageUrl, loadPromise);

    try {
      const img = await loadPromise;
      this.imageCache.set(imageUrl, img);
      this.loadingPromises.delete(imageUrl);
      console.log('✅ 画像プリロード完了:', imageUrl);
      return true;
    } catch (error) {
      this.loadingPromises.delete(imageUrl);
      console.warn('❌ 画像プリロード失敗:', imageUrl, error);
      return false;
    }
  }

  /**
   * 複数の画像を並行してプリロードする
   * @param imageUrls 読み込む画像URLの配列
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 全て成功時true、一つでも失敗時false
   */
  async preloadMultiple(imageUrls: string[], timeout = 10000): Promise<boolean> {
    console.log('🎯 複数画像プリロード開始:', imageUrls.length, '件');
    
    const results = await Promise.allSettled(
      imageUrls.map(url => this.preloadAndWait(url, timeout))
    );

    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;

    console.log(`📊 複数画像プリロード結果: ${successCount}/${imageUrls.length} 成功`);
    
    return successCount === imageUrls.length;
  }

  /**
   * 画像がキャッシュされているかチェック
   * @param imageUrl チェックする画像のURL
   * @returns キャッシュされている場合true
   */
  isImageCached(imageUrl: string): boolean {
    return this.imageCache.has(imageUrl);
  }

  /**
   * 特定の画像をキャッシュから削除
   * @param imageUrl 削除する画像のURL
   */
  removeFromCache(imageUrl: string): void {
    this.imageCache.delete(imageUrl);
    this.loadingPromises.delete(imageUrl);
    console.log('🗑️ キャッシュから削除:', imageUrl);
  }

  /**
   * 全キャッシュをクリア
   */
  clearCache(): void {
    this.imageCache.clear();
    this.loadingPromises.clear();
    console.log('🗑️ 全キャッシュをクリア');
  }

  /**
   * キャッシュ統計を取得
   */
  getCacheStats(): { cached: number; loading: number; totalSize: number } {
    return {
      cached: this.imageCache.size,
      loading: this.loadingPromises.size,
      totalSize: this.imageCache.size + this.loadingPromises.size
    };
  }

  /**
   * タイムアウト付きで画像を読み込む
   * @param url 画像URL
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 読み込まれた画像要素
   */
  private loadImageWithTimeout(url: string, timeout: number): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timeoutId = setTimeout(() => {
        reject(new Error(`画像読み込みタイムアウト: ${url}`));
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(img);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`画像読み込みエラー: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * バックグラウンドで画像をプリロード（非同期、結果を待たない）
   * @param imageUrl プリロードする画像のURL
   */
  preloadInBackground(imageUrl: string): void {
    if (this.imageCache.has(imageUrl) || this.loadingPromises.has(imageUrl)) {
      return; // 既にキャッシュ済みまたはロード中
    }

    console.log('🔄 バックグラウンドプリロード開始:', imageUrl);
    this.preloadAndWait(imageUrl, 15000).catch(error => {
      console.warn('⚠️ バックグラウンドプリロード失敗:', imageUrl, error);
    });
  }
}

// デフォルトエクスポートとして提供
export default SimplePreloadManager;