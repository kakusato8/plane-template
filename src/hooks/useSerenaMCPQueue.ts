import { useState, useEffect, useCallback, useRef } from 'react';
import { serenaMCPImageQueue } from '../utils/serenaMCPImageQueue';

interface QueuedImage {
  id: string;
  url: string;
  tags: any;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'pending' | 'loading' | 'loaded' | 'error';
  loadedAt?: number;
  retryCount: number;
  element?: HTMLImageElement;
}

interface QueueMetrics {
  totalRequests: number;
  successful: number;
  failed: number;
  avgLoadTime: number;
  queueLength: number;
  activeLoading: number;
}

interface UseSerenaMCPQueueReturn {
  // 基本機能
  enqueueImage: (id: string, url: string, priority?: QueuedImage['priority'], tags?: any) => Promise<HTMLImageElement>;
  enqueueBatch: (images: { id: string, url: string, priority: QueuedImage['priority'] }[]) => Promise<{ id: string, element?: HTMLImageElement, error?: Error }[]>;
  
  // 状態監視
  getImageStatus: (id: string) => QueuedImage | null;
  metrics: QueueMetrics;
  
  // 予測機能
  getEstimatedWaitTime: (priority: QueuedImage['priority']) => number;
  predictImageReadiness: (ids: string[]) => { id: string, readyIn: number, status: string }[];
  predictBatchReadiness: (startIndex: number, count: number, generateId: (index: number) => string) => {
    allReady: boolean,
    maxWaitTime: number,
    details: { index: number, id: string, readyIn: number, status: string }[]
  };
  
  // 制御機能
  setDynamicPriorityMode: (active: boolean) => void;
  clear: () => void;
  
  // デバッグ
  debugInfo: any;
}

/**
 * SerenaMCP画像キューシステムのReactフック
 * リアルタイムで画像準備状況を監視し、順序問題を解決
 */
export const useSerenaMCPQueue = (): UseSerenaMCPQueueReturn => {
  const [metrics, setMetrics] = useState<QueueMetrics>({
    totalRequests: 0,
    successful: 0,
    failed: 0,
    avgLoadTime: 0,
    queueLength: 0,
    activeLoading: 0
  });
  const [debugInfo, setDebugInfo] = useState<any>({});

  // メトリクス更新
  const updateMetrics = useCallback(() => {
    const currentMetrics = serenaMCPImageQueue.getMetrics();
    setMetrics(currentMetrics);
    
    const currentDebugInfo = serenaMCPImageQueue.getDebugInfo();
    setDebugInfo(currentDebugInfo);
  }, []);

  // 定期的なメトリクス更新
  useEffect(() => {
    updateMetrics(); // 初回実行
    
    const interval = setInterval(updateMetrics, 1000); // 1秒ごとに更新
    
    return () => clearInterval(interval);
  }, [updateMetrics]);

  // 画像エンキュー
  const enqueueImage = useCallback(async (
    id: string, 
    url: string, 
    priority: QueuedImage['priority'] = 'normal',
    tags?: any
  ): Promise<HTMLImageElement> => {
    console.log(`🎯 useSerenaMCPQueue: 画像エンキュー ${id} (優先度: ${priority})`);
    
    try {
      const element = await serenaMCPImageQueue.enqueue(id, url, priority, tags);
      updateMetrics(); // 即座にメトリクス更新
      return element;
    } catch (error) {
      updateMetrics(); // エラー時もメトリクス更新
      throw error;
    }
  }, [updateMetrics]);

  // バッチエンキュー
  const enqueueBatch = useCallback(async (
    images: { id: string, url: string, priority: QueuedImage['priority'] }[]
  ): Promise<{ id: string, element?: HTMLImageElement, error?: Error }[]> => {
    console.log(`📦 useSerenaMCPQueue: バッチエンキュー ${images.length}件`);
    
    try {
      const results = await serenaMCPImageQueue.enqueueBatch(images);
      updateMetrics(); // バッチ処理後にメトリクス更新
      return results;
    } catch (error) {
      updateMetrics(); // エラー時もメトリクス更新
      throw error;
    }
  }, [updateMetrics]);

  // 画像状態取得
  const getImageStatus = useCallback((id: string): QueuedImage | null => {
    return serenaMCPImageQueue.getImageStatus(id);
  }, []);

  // 待機時間予測
  const getEstimatedWaitTime = useCallback((priority: QueuedImage['priority']): number => {
    return serenaMCPImageQueue.getEstimatedWaitTime(priority);
  }, []);

  // 画像準備状況予測
  const predictImageReadiness = useCallback((ids: string[]) => {
    return serenaMCPImageQueue.predictImageReadiness(ids);
  }, []);

  // バッチ準備状況予測
  const predictBatchReadiness = useCallback((startIndex: number, count: number, generateId: (index: number) => string) => {
    return serenaMCPImageQueue.predictBatchReadiness(startIndex, count, generateId);
  }, []);

  // 動的優先度モードの制御
  const setDynamicPriorityMode = useCallback((active: boolean) => {
    serenaMCPImageQueue.setDynamicPriorityMode(active);
    updateMetrics();
  }, [updateMetrics]);

  // キューのクリア
  const clear = useCallback(() => {
    console.log('🧹 useSerenaMCPQueue: キューをクリア');
    serenaMCPImageQueue.clear();
    updateMetrics();
  }, [updateMetrics]);

  return {
    enqueueImage,
    enqueueBatch,
    getImageStatus,
    metrics,
    getEstimatedWaitTime,
    predictImageReadiness,
    predictBatchReadiness,
    setDynamicPriorityMode,
    clear,
    debugInfo
  };
};

/**
 * 画像キューシステムの順序問題解決フック
 * QueuedImageAppでの使用に特化
 */
interface ImageQueueState {
  current: { id: string, url: string, loaded: boolean, element?: HTMLImageElement };
  next: { id: string, url: string, loaded: boolean, element?: HTMLImageElement };
  next2: { id: string, url: string, loaded: boolean, element?: HTMLImageElement };
}

interface UseOrderedImageQueueReturn {
  queueState: ImageQueueState;
  initializeQueue: (startIndex: number, generateUrl: (index: number) => string, dataLength: number) => Promise<void>;
  advanceQueue: (currentIndex: number, generateUrl: (index: number) => string, dataLength: number) => Promise<void>;
  startAggressivePreloading: (currentIndex: number, generateUrl: (index: number) => string, dataLength: number) => void;
  stopAggressivePreloading: () => void;
  ensureNextImageReady: (nextIndex: number, generateUrl: (index: number) => string) => Promise<boolean>;
  setDynamicPriorityMode: (active: boolean) => void;
  getImageStatus: (id: string) => QueuedImage | null;  // 画像状態確認
  isReady: boolean;
  isNextReady: boolean;
  isLoading: boolean;  // ローディング状態
  metrics: QueueMetrics;
  debugInfo: any;
}

export const useOrderedImageQueue = (): UseOrderedImageQueueReturn => {
  const { enqueueImage, enqueueBatch, getImageStatus, setDynamicPriorityMode, metrics, debugInfo } = useSerenaMCPQueue();
  
  const [queueState, setQueueState] = useState<ImageQueueState>({
    current: { id: '', url: '', loaded: false },
    next: { id: '', url: '', loaded: false },
    next2: { id: '', url: '', loaded: false }
  });
  
  const [isReady, setIsReady] = useState(false);
  const [isNextReady, setIsNextReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);  // ローディング状態管理
  const [aggressivePreloadingActive, setAggressivePreloadingActive] = useState(false);
  const aggressiveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🚀 SerenaMCP連続実行対策: advanceQueueの並行実行防止
  const isAdvancingRef = useRef(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // キューの初期化
  const initializeQueue = useCallback(async (
    startIndex: number, 
    generateUrl: (index: number) => string,
    dataLength: number
  ) => {
    console.log('🚀 useOrderedImageQueue: キュー初期化開始');
    setIsReady(false);
    setIsLoading(true);  // ローディング開始

    const currentIndex = startIndex;
    const nextIndex = (startIndex + 1) % dataLength;
    const next2Index = (startIndex + 2) % dataLength;
    
    const currentUrl = generateUrl(currentIndex);
    const nextUrl = generateUrl(nextIndex);
    const next2Url = generateUrl(next2Index);

    // 順序を保証したバッチ処理
    const results = await enqueueBatch([
      { id: `img-${currentIndex}`, url: currentUrl, priority: 'critical' },
      { id: `img-${nextIndex}`, url: nextUrl, priority: 'high' },
      { id: `img-${next2Index}`, url: next2Url, priority: 'normal' }
    ]);

    // 状態更新
    setQueueState({
      current: {
        id: `img-${currentIndex}`,
        url: currentUrl,
        loaded: !!results[0]?.element,
        element: results[0]?.element
      },
      next: {
        id: `img-${nextIndex}`,
        url: nextUrl,
        loaded: !!results[1]?.element,
        element: results[1]?.element
      },
      next2: {
        id: `img-${next2Index}`,
        url: next2Url,
        loaded: !!results[2]?.element,
        element: results[2]?.element
      }
    });

    setIsReady(results[0]?.element ? true : false);
    setIsLoading(false);  // ローディング完了
    console.log(`✅ useOrderedImageQueue: キュー初期化完了 準備完了:${isReady}`);
  }, [enqueueBatch, isReady]);

  // キューの進行 - さらに先の画像も準備（連続実行対策強化版）
  const advanceQueue = useCallback(async (
    currentIndex: number,
    generateUrl: (index: number) => string,
    dataLength: number
  ) => {
    // 🛡️ SerenaMCP防御: 既に進行中の場合は即座リターン
    if (isAdvancingRef.current || isAdvancing) {
      console.log('🚫 useOrderedImageQueue: キュー進行中につきスキップ');
      return;
    }
    
    // 🔒 進行中フラグを即座設定
    isAdvancingRef.current = true;
    setIsAdvancing(true);
    
    try {
      console.log('⚡ useOrderedImageQueue: キュー進行開始');
      setIsLoading(true);  // ローディング開始

    const newNext2Index = (currentIndex + 2) % dataLength;
    const futureIndex1 = (currentIndex + 3) % dataLength;
    const futureIndex2 = (currentIndex + 4) % dataLength;
    
    // キューをシフト（確実にコピーして状態更新）
    const prevState = queueState;
    const newCurrent = { ...prevState.next };
    const newNext = { ...prevState.next2 };
    
    console.log('🔄 useOrderedImageQueue: キューシフト', {
      prevCurrent: prevState.current.id,
      newCurrent: newCurrent.id,
      newNext: newNext.id
    });
    
    // 新しい2枚先と将来の画像を並行で準備
    const newNext2Url = generateUrl(newNext2Index);
    const futureUrl1 = generateUrl(futureIndex1);
    const futureUrl2 = generateUrl(futureIndex2);

    // バッチで複数の画像を並行準備（順序問題を解決）
    const batchResults = await enqueueBatch([
      { id: `img-${newNext2Index}`, url: newNext2Url, priority: 'high' },
      { id: `img-${futureIndex1}`, url: futureUrl1, priority: 'normal' },
      { id: `img-${futureIndex2}`, url: futureUrl2, priority: 'low' }
    ]);
    
    console.log(`📦 useOrderedImageQueue: バッチ準備完了 成功:${batchResults.filter(r => r.element).length}/${batchResults.length}`);
    
    // 新しいキュー状態を設定
    const newQueueState = {
      current: newCurrent,
      next: newNext,
      next2: {
        id: `img-${newNext2Index}`,
        url: newNext2Url,
        loaded: !!batchResults[0]?.element,
        element: batchResults[0]?.element
      }
    };
    
    console.log('📝 useOrderedImageQueue: 新しいキュー状態', {
      current: newQueueState.current.id,
      next: newQueueState.next.id,
      next2: newQueueState.next2.id
    });
    
      setQueueState(newQueueState);
      setIsLoading(false);  // ローディング完了
      console.log('✅ useOrderedImageQueue: キュー進行完了');
      
    } catch (error) {
      console.error('❌ useOrderedImageQueue: キュー進行エラー:', error);
      setIsLoading(false);
    } finally {
      // 🔓 必ず進行中フラグを解除
      setTimeout(() => {
        isAdvancingRef.current = false;
        setIsAdvancing(false);
        console.log('🔓 useOrderedImageQueue: 進行ロック解除');
      }, 50); // 短い遅延で確実に解除
    }
  }, [enqueueBatch]); // queueState依存を削除して無限再作成を防ぐ

  // 積極的な先読みシステム
  const startAggressivePreloading = useCallback((currentIndex: number, generateUrl: (index: number) => string, dataLength: number) => {
    if (aggressivePreloadingActive) return;
    
    console.log('🚀 useOrderedImageQueue: 積極的先読み開始');
    setAggressivePreloadingActive(true);
    
    const preloadNextBatch = async () => {
      try {
        const preloadCount = 8; // さらに先まで準備
        const batchImages = [];
        
        for (let i = 1; i <= preloadCount; i++) {
          const futureIndex = (currentIndex + i) % dataLength;
          const futureId = `img-${futureIndex}`;
          const futureUrl = generateUrl(futureIndex);
          
          // 既に準備済みかチェック
          const status = getImageStatus(futureId);
          if (!status || status.status === 'error') {
            let priority: 'critical' | 'high' | 'normal' | 'low';
            if (i === 1) priority = 'critical';      // 次の画像は最優先
            else if (i === 2) priority = 'high';     // 2枚先は高優先度
            else if (i <= 4) priority = 'normal';    // 3-4枚先は通常
            else priority = 'low';                   // 5枚先以降は低優先度
            
            batchImages.push({ id: futureId, url: futureUrl, priority });
          }
        }
        
        if (batchImages.length > 0) {
          console.log(`📦 useOrderedImageQueue: 積極的バッチ準備 ${batchImages.length}件`);
          await enqueueBatch(batchImages);
        }
      } catch (error) {
        console.warn('⚠️ useOrderedImageQueue: 積極的先読みエラー:', error);
      }
    };
    
    // 初回実行
    preloadNextBatch();
    
    // 定期的に実行（2秒間隔）
    aggressiveIntervalRef.current = setInterval(preloadNextBatch, 2000);
  }, [aggressivePreloadingActive, getImageStatus, enqueueBatch]);
  
  const stopAggressivePreloading = useCallback(() => {
    if (aggressiveIntervalRef.current) {
      clearInterval(aggressiveIntervalRef.current);
      aggressiveIntervalRef.current = null;
    }
    setAggressivePreloadingActive(false);
    console.log('🛑 useOrderedImageQueue: 積極的先読み停止');
  }, []);
  
  // 次の画像が確実に準備されているかチェック＆保証
  const ensureNextImageReady = useCallback(async (nextIndex: number, generateUrl: (index: number) => string): Promise<boolean> => {
    const nextId = `img-${nextIndex}`;
    const nextUrl = generateUrl(nextIndex);
    
    console.log(`🎯 useOrderedImageQueue: 次画像準備チェック ${nextId}`);
    
    let status = getImageStatus(nextId);
    
    // 既に準備完了している場合
    if (status?.status === 'loaded' && status.element) {
      console.log('✅ useOrderedImageQueue: 次画像は準備済み');
      return true;
    }
    
    // 準備されていない、またはエラーの場合は緊急準備
    console.log('🚨 useOrderedImageQueue: 次画像を緊急準備中...');
    try {
      const element = await enqueueImage(nextId, nextUrl, 'critical');
      if (element) {
        console.log('✅ useOrderedImageQueue: 次画像の緊急準備完了');
        return true;
      }
    } catch (error) {
      console.error('❌ useOrderedImageQueue: 次画像の緊急準備失敗:', error);
    }
    
    return false;
  }, [getImageStatus, enqueueImage]);
  
  // キュー状態の同期システム（無限ループ修正版）
  useEffect(() => {
    console.log('🔄 useOrderedImageQueue: キュー状態同期チェック開始');
    
    // 無限ループ防止: IDが空の場合は何もしない
    if (!queueState.current.id && !queueState.next.id && !queueState.next2.id) {
      console.log('🚫 useOrderedImageQueue: IDが未設定、同期をスキップ');
      return;
    }
    
    // 各キューポジションの状態を確認・同期（最小限の更新）
    let hasUpdates = false;
    const updates: Partial<ImageQueueState> = {};
    
    // current位置の同期
    if (queueState.current.id && !queueState.current.loaded) {
      const mcpStatus = getImageStatus(queueState.current.id);
      if (mcpStatus?.status === 'loaded' && mcpStatus.element) {
        console.log(`✅ useOrderedImageQueue: current位置同期 ${queueState.current.id}`);
        updates.current = {
          ...queueState.current,
          loaded: true,
          element: mcpStatus.element,
          url: mcpStatus.url
        };
        hasUpdates = true;
      }
    }
    
    // next位置の同期
    if (queueState.next.id && !queueState.next.loaded) {
      const mcpStatus = getImageStatus(queueState.next.id);
      if (mcpStatus?.status === 'loaded' && mcpStatus.element) {
        console.log(`✅ useOrderedImageQueue: next位置同期 ${queueState.next.id}`);
        updates.next = {
          ...queueState.next,
          loaded: true,
          element: mcpStatus.element,
          url: mcpStatus.url
        };
        hasUpdates = true;
      }
    }
    
    // next2位置の同期
    if (queueState.next2.id && !queueState.next2.loaded) {
      const mcpStatus = getImageStatus(queueState.next2.id);
      if (mcpStatus?.status === 'loaded' && mcpStatus.element) {
        console.log(`✅ useOrderedImageQueue: next2位置同期 ${queueState.next2.id}`);
        updates.next2 = {
          ...queueState.next2,
          loaded: true,
          element: mcpStatus.element,
          url: mcpStatus.url
        };
        hasUpdates = true;
      }
    }
    
    // 実際に変更があった場合のみ状態更新
    if (hasUpdates) {
      console.log('📝 useOrderedImageQueue: キュー状態を更新');
      setQueueState(prev => ({
        current: updates.current || prev.current,
        next: updates.next || prev.next,
        next2: updates.next2 || prev.next2
      }));
    }
    
    // isNextReadyの更新（独立して実行）
    const nextStatus = getImageStatus(queueState.next.id);
    const nextReady = nextStatus?.status === 'loaded' && !!nextStatus.element;
    if (nextReady !== isNextReady) {
      console.log(`🎯 useOrderedImageQueue: isNextReady更新 ${isNextReady} → ${nextReady}`);
      setIsNextReady(nextReady);
    }
    
  }, [queueState.current.id, queueState.current.loaded, queueState.next.id, queueState.next.loaded, queueState.next2.id, queueState.next2.loaded, getImageStatus]);
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      if (aggressiveIntervalRef.current) {
        clearInterval(aggressiveIntervalRef.current);
      }
    };
  }, []);

  return {
    queueState,
    initializeQueue,
    advanceQueue,
    startAggressivePreloading,
    stopAggressivePreloading,
    ensureNextImageReady,
    setDynamicPriorityMode,
    getImageStatus,  // 画像状態確認を返す
    isReady,
    isNextReady,
    isLoading,  // ローディング状態を返す
    isAdvancing, // 進行中状態を返す
    metrics,
    debugInfo
  };
};