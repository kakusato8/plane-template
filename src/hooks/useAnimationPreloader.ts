import { useState, useEffect, useRef, useCallback } from 'react';

interface AnimationState {
  isAnimating: boolean;
  animationType: string;
  phase: 'idle' | 'starting' | 'running' | 'completing' | 'completed';
  progress: number; // 0-100
  remainingTime: number; // milliseconds
}

interface PreloadTrigger {
  phase: AnimationState['phase'];
  minProgress: number;
  maxProgress: number;
  delay: number; // milliseconds
}

interface UseAnimationPreloaderOptions<T> {
  // データプリロード関数
  preloadNext: () => Promise<T | null>;
  // アニメーション監視設定
  animationDuration: number; // milliseconds
  // プリロードトリガー設定
  triggers?: PreloadTrigger[];
  // デバッグモード
  debug?: boolean;
}

interface AnimationPreloaderState<T> {
  animationState: AnimationState;
  preloadedData: T | null;
  isPreloading: boolean;
  preloadProgress: number;
  stats: {
    preloadTriggers: number;
    successfulPreloads: number;
    failedPreloads: number;
    averagePreloadTime: number;
  };
}

// デフォルトのプリロードトリガー設定
const defaultTriggers: PreloadTrigger[] = [
  // アニメーション開始30%時点で先読み開始
  { phase: 'running', minProgress: 30, maxProgress: 50, delay: 0 },
  // アニメーション完了間近でも先読み実行（フォールバック）
  { phase: 'completing', minProgress: 80, maxProgress: 95, delay: 500 },
];

export const useAnimationPreloader = <T>({
  preloadNext,
  animationDuration = 1500,
  triggers = defaultTriggers,
  debug = false
}: UseAnimationPreloaderOptions<T>) => {
  const [state, setState] = useState<AnimationPreloaderState<T>>({
    animationState: {
      isAnimating: false,
      animationType: 'none',
      phase: 'idle',
      progress: 0,
      remainingTime: 0
    },
    preloadedData: null,
    isPreloading: false,
    preloadProgress: 0,
    stats: {
      preloadTriggers: 0,
      successfulPreloads: 0,
      failedPreloads: 0,
      averagePreloadTime: 0
    }
  });

  const animationStartTime = useRef<number>(0);
  const preloadStartTime = useRef<number>(0);
  const animationTimer = useRef<NodeJS.Timeout | null>(null);
  const triggeredPhases = useRef<Set<string>>(new Set());
  const preloadTimes = useRef<number[]>([]);

  // アニメーション進行状況の更新
  const updateAnimationProgress = useCallback(() => {
    if (!state.animationState.isAnimating) return;

    const elapsed = Date.now() - animationStartTime.current;
    const progress = Math.min((elapsed / animationDuration) * 100, 100);
    const remainingTime = Math.max(animationDuration - elapsed, 0);

    let phase: AnimationState['phase'] = 'running';
    if (progress < 10) phase = 'starting';
    else if (progress > 85) phase = 'completing';
    else if (progress >= 100) phase = 'completed';

    setState(prev => ({
      ...prev,
      animationState: {
        ...prev.animationState,
        progress,
        remainingTime,
        phase
      }
    }));

    // プリロードトリガーのチェック
    checkPreloadTriggers(phase, progress);

    if (debug) {
      console.log('🎬 アニメーション進行:', {
        phase,
        progress: Math.round(progress),
        remainingTime: Math.round(remainingTime)
      });
    }
  }, [state.animationState.isAnimating, animationDuration, debug]);

  // プリロードトリガーのチェック
  const checkPreloadTriggers = useCallback((phase: AnimationState['phase'], progress: number) => {
    triggers.forEach((trigger, index) => {
      const triggerKey = `${phase}-${index}-${Math.floor(progress / 10) * 10}`;
      
      if (
        !triggeredPhases.current.has(triggerKey) &&
        trigger.phase === phase &&
        progress >= trigger.minProgress &&
        progress <= trigger.maxProgress &&
        !state.isPreloading &&
        !state.preloadedData
      ) {
        triggeredPhases.current.add(triggerKey);
        
        if (debug) {
          console.log('🎯 プリロードトリガー発動:', {
            trigger,
            phase,
            progress: Math.round(progress)
          });
        }
        
        // 指定された遅延後にプリロード実行
        setTimeout(() => {
          executePreload();
        }, trigger.delay);
      }
    });
  }, [triggers, state.isPreloading, state.preloadedData, debug]);

  // プリロード実行
  const executePreload = useCallback(async () => {
    if (state.isPreloading || state.preloadedData) return;

    setState(prev => ({
      ...prev,
      isPreloading: true,
      preloadProgress: 0,
      stats: {
        ...prev.stats,
        preloadTriggers: prev.stats.preloadTriggers + 1
      }
    }));

    preloadStartTime.current = Date.now();

    if (debug) {
      console.log('🚀 バックグラウンドプリロード開始');
    }

    try {
      // プリロード進行状況のシミュレート
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          preloadProgress: Math.min(prev.preloadProgress + 20, 90)
        }));
      }, 100);

      const preloadedData = await preloadNext();
      clearInterval(progressInterval);

      const preloadTime = Date.now() - preloadStartTime.current;
      preloadTimes.current.push(preloadTime);

      // 平均プリロード時間を計算
      const averageTime = preloadTimes.current.reduce((a, b) => a + b, 0) / preloadTimes.current.length;

      if (preloadedData) {
        setState(prev => ({
          ...prev,
          preloadedData,
          isPreloading: false,
          preloadProgress: 100,
          stats: {
            ...prev.stats,
            successfulPreloads: prev.stats.successfulPreloads + 1,
            averagePreloadTime: averageTime
          }
        }));

        if (debug) {
          console.log('✅ バックグラウンドプリロード成功:', {
            preloadTime: `${preloadTime}ms`,
            averageTime: `${Math.round(averageTime)}ms`
          });
        }
      } else {
        throw new Error('プリロードデータが null です');
      }
    } catch (error) {
      const preloadTime = Date.now() - preloadStartTime.current;
      
      setState(prev => ({
        ...prev,
        isPreloading: false,
        preloadProgress: 0,
        stats: {
          ...prev.stats,
          failedPreloads: prev.stats.failedPreloads + 1
        }
      }));

      if (debug) {
        console.warn('❌ バックグラウンドプリロード失敗:', {
          error: (error as Error).message,
          preloadTime: `${preloadTime}ms`
        });
      }
    }
  }, [state.isPreloading, state.preloadedData, preloadNext, debug]);

  // アニメーション開始
  const startAnimation = useCallback((animationType: string = 'default') => {
    if (state.animationState.isAnimating) return;

    animationStartTime.current = Date.now();
    triggeredPhases.current.clear();

    setState(prev => ({
      ...prev,
      animationState: {
        isAnimating: true,
        animationType,
        phase: 'starting',
        progress: 0,
        remainingTime: animationDuration
      }
    }));

    // アニメーション進行監視タイマー開始
    animationTimer.current = setInterval(updateAnimationProgress, 50);

    if (debug) {
      console.log('🎬 アニメーション開始:', animationType);
    }

    // アニメーション終了時の自動停止
    setTimeout(() => {
      completeAnimation();
    }, animationDuration);
  }, [state.animationState.isAnimating, animationDuration, updateAnimationProgress, debug]);

  // アニメーション完了
  const completeAnimation = useCallback(() => {
    if (animationTimer.current) {
      clearInterval(animationTimer.current);
      animationTimer.current = null;
    }

    setState(prev => ({
      ...prev,
      animationState: {
        ...prev.animationState,
        isAnimating: false,
        phase: 'completed',
        progress: 100,
        remainingTime: 0
      }
    }));

    if (debug) {
      console.log('🏁 アニメーション完了');
    }

    // 完了後少し経ってからアイドル状態に戻す
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        animationState: {
          ...prev.animationState,
          phase: 'idle',
          animationType: 'none'
        }
      }));
    }, 500);
  }, [debug]);

  // プリロードされたデータを消費
  const consumePreloadedData = useCallback((): T | null => {
    const data = state.preloadedData;
    
    setState(prev => ({
      ...prev,
      preloadedData: null,
      preloadProgress: 0
    }));

    if (debug && data) {
      console.log('📦 プリロードデータを消費');
    }

    return data;
  }, [state.preloadedData, debug]);

  // 手動プリロード
  const manualPreload = useCallback(() => {
    if (!state.isPreloading) {
      executePreload();
    }
  }, [state.isPreloading, executePreload]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationTimer.current) {
        clearInterval(animationTimer.current);
      }
    };
  }, []);

  return {
    ...state,
    startAnimation,
    completeAnimation,
    consumePreloadedData,
    manualPreload,
    
    // 便利なヘルパー
    isReadyForNext: state.preloadedData !== null,
    shouldWaitForPreload: state.isPreloading && state.preloadProgress < 100,
    
    // デバッグ情報
    debug: debug ? {
      triggersCount: triggers.length,
      triggeredPhasesCount: triggeredPhases.current.size,
      preloadTimesHistory: preloadTimes.current,
      currentTriggers: triggers
    } : undefined
  };
};