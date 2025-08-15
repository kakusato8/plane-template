/**
 * プリロード画像システム用React Hook
 * 高性能な背景画像取得とキャッシュ管理を提供
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BackgroundImagePreloader } from '../utils/backgroundImagePreloader';
import { ImagePredictionEngine } from '../utils/imagePredictionEngine';
import { imageMemoryCache } from '../utils/imageMemoryCache';
import type { TriviaItem, Location } from '../../types/trivia';

interface UsePreloadedImagesProps {
  currentTrivia?: TriviaItem;
  currentLocation?: Location;
  visitedTriviaIds?: number[];
  visitedLocationIds?: string[];
  availableTrivia?: TriviaItem[];
  availableLocations?: Location[];
}

interface ImageLoadState {
  isLoading: boolean;
  hasError: boolean;
  imageUrl: string;
  loadTime: number;
  fromCache: boolean;
}

interface PreloadStats {
  cacheHitRate: number;
  avgLoadTime: number;
  memoryUsage: number;
  predictionAccuracy: number;
}

export function usePreloadedImages({
  currentTrivia,
  currentLocation,
  visitedTriviaIds = [],
  visitedLocationIds = [],
  availableTrivia = [],
  availableLocations = []
}: UsePreloadedImagesProps) {
  const [imageState, setImageState] = useState<ImageLoadState>({
    isLoading: true,
    hasError: false,
    imageUrl: '',
    loadTime: 0,
    fromCache: false
  });

  const [stats, setStats] = useState<PreloadStats>({
    cacheHitRate: 0,
    avgLoadTime: 0,
    memoryUsage: 0,
    predictionAccuracy: 0
  });

  const preloaderRef = useRef<BackgroundImagePreloader | undefined>(undefined);
  const predictionEngineRef = useRef<ImagePredictionEngine | undefined>(undefined);
  const predictivePreloadTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 統計情報を更新
  const updateStats = useCallback(() => {
    if (!preloaderRef.current) return;

    const preloaderStats = preloaderRef.current!.getStats();
    const predictionStats = predictionEngineRef.current?.getAnalytics();

    setStats({
      cacheHitRate: preloaderStats.cache.hitRate * 100,
      avgLoadTime: preloaderStats.avgLoadTime,
      memoryUsage: (preloaderStats.cache.memoryUsage.current / 1024 / 1024), // MB
      predictionAccuracy: (predictionStats?.accuracyRate || 0) * 100
    });
  }, []);

  // システムの初期化
  useEffect(() => {
    try {
      preloaderRef.current = BackgroundImagePreloader.getInstance();
      predictionEngineRef.current = ImagePredictionEngine.getInstance();
      
      // 初期統計の設定
      updateStats();
    } catch (error) {
      console.error('プリロードシステム初期化エラー:', error);
      // エラーが発生してもアプリは続行
    }
  }, [updateStats]);

  // メイン画像の取得
  const loadImage = useCallback(async (
    imageUrl: string,
    trivia: TriviaItem,
    location: Location,
    priority: 'critical' | 'high' | 'normal' | 'low' = 'critical'
  ) => {
    if (!preloaderRef.current || !imageUrl || !trivia || !location) {
      return;
    }

    // キャッシュから瞬時チェック（Serena MCP風の即座表示）
    if (imageMemoryCache.has(imageUrl)) {
      const cachedImage = imageMemoryCache.get(imageUrl);
      if (cachedImage) {
        setImageState({
          isLoading: false,
          hasError: false,
          imageUrl,
          loadTime: 0, // キャッシュからなので0ms
          fromCache: true
        });
        updateStats();
        return;
      }
    }

    setImageState(prev => ({ ...prev, isLoading: true, hasError: false }));

    try {
      const result = await preloaderRef.current!.preloadImage(
        imageUrl, 
        trivia, 
        location, 
        priority
      );

      setImageState({
        isLoading: false,
        hasError: !result.success,
        imageUrl: result.success ? result.imageUrl : '',
        loadTime: result.loadTime,
        fromCache: result.fromCache
      });

      // 統計を更新
      updateStats();

    } catch (error) {
      console.error('Image load error:', error);
      setImageState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true
      }));
    }
  }, [updateStats]);

  // 現在の画像が変更された際の処理
  useEffect(() => {
    if (!currentTrivia || !currentLocation) return;

    const loadCurrentImage = async () => {
      try {
        // 現在表示すべき画像URLを生成
        const { TriviaDisplaySystem } = await import('../utils/triviaDisplaySystem');
        const displaySystem = TriviaDisplaySystem.getInstance();
        const imageUrl = await displaySystem.generateBackgroundImageUrl(currentTrivia, currentLocation);

        loadImage(imageUrl, currentTrivia, currentLocation, 'critical');
      } catch (error) {
        console.error('画像読み込み処理エラー:', error);
        // フォールバック画像を設定
        setImageState({
          isLoading: false,
          hasError: true,
          imageUrl: '',
          loadTime: 0,
          fromCache: false
        });
      }
    };

    loadCurrentImage();
  }, [currentTrivia, currentLocation, loadImage]);

  // 予測的プリロードの実行
  useEffect(() => {
    if (!preloaderRef.current || 
        !currentTrivia || 
        !currentLocation || 
        availableTrivia.length === 0 || 
        availableLocations.length === 0) {
      return;
    }

    // 既存のタイムアウトをクリア
    if (predictivePreloadTimeoutRef.current) {
      clearTimeout(predictivePreloadTimeoutRef.current);
    }

    // デバウンス処理：500ms後に予測プリロードを実行（よりレスポンシブに）
    predictivePreloadTimeoutRef.current = setTimeout(() => {
      if (preloaderRef.current) {
        preloaderRef.current!.predictivePreload(
          currentTrivia,
          currentLocation,
          visitedTriviaIds,
          visitedLocationIds,
          availableTrivia,
          availableLocations
        ).catch(error => {
          console.warn('予測プリロードエラー:', error);
          // エラーが発生してもアプリは続行
        });
      }
    }, 500); // 1秒から500msに短縮

    return () => {
      if (predictivePreloadTimeoutRef.current) {
        clearTimeout(predictivePreloadTimeoutRef.current);
      }
    };
  }, [
    currentTrivia,
    currentLocation,
    visitedTriviaIds,
    visitedLocationIds,
    availableTrivia,
    availableLocations
  ]);


  // 手動プリロード
  const preloadSpecificImages = useCallback(async (
    imagePredictions: Array<{
      imageUrl: string;
      trivia: TriviaItem;
      location: Location;
      priority?: 'critical' | 'high' | 'normal' | 'low';
    }>
  ) => {
    if (!preloaderRef.current) return;

    try {
      const results = await preloaderRef.current!.preloadBatch(
        imagePredictions.map(pred => ({
          ...pred,
          priority: pred.priority || 'normal'
        }))
      );

      updateStats();
      return results;
    } catch (error) {
      console.error('Batch preload error:', error);
      return [];
    }
  }, [updateStats]);

  // キャッシュ最適化
  const optimizeCache = useCallback(() => {
    imageMemoryCache.autoCleanup();
    updateStats();
  }, [updateStats]);

  // 緊急モード（メモリ不足時）
  const enableEmergencyMode = useCallback(() => {
    if (preloaderRef.current) {
      preloaderRef.current!.enableEmergencyMode();
    }
    optimizeCache();
  }, [optimizeCache]);

  // キャッシュクリア
  const clearCache = useCallback(() => {
    imageMemoryCache.clear();
    if (preloaderRef.current) {
      preloaderRef.current!.reset();
    }
    updateStats();
  }, [updateStats]);

  // 統計の定期更新
  useEffect(() => {
    const interval = setInterval(updateStats, 30000); // 30秒ごと
    return () => clearInterval(interval);
  }, [updateStats]);

  // メモリプレッシャー監視
  useEffect(() => {
    const checkMemoryPressure = () => {
      const memoryInfo = (performance as any)?.memory;
      if (memoryInfo) {
        const usage = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
        if (usage > 0.8) {
          console.warn('High memory usage detected, optimizing cache...');
          optimizeCache();
        }
        if (usage > 0.9) {
          console.warn('Critical memory usage, enabling emergency mode...');
          enableEmergencyMode();
        }
      }
    };

    const interval = setInterval(checkMemoryPressure, 10000); // 10秒ごと
    return () => clearInterval(interval);
  }, [optimizeCache, enableEmergencyMode]);

  // プログレッシブ品質向上
  const [qualityLevel, setQualityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  
  const improveQuality = useCallback(async () => {
    if (!currentTrivia || !currentLocation || qualityLevel === 'high') return;

    const { TriviaDisplaySystem } = await import('../utils/triviaDisplaySystem');
    const displaySystem = TriviaDisplaySystem.getInstance();
    const baseImageUrl = displaySystem.generateBackgroundImageUrl(currentTrivia, currentLocation);
    
    // 高品質バージョンをプリロード
    const { ImageOptimizer } = await import('../utils/imageOptimizer');
    const size = ImageOptimizer.getOptimalImageSize();
    const highQualityUrl = await ImageOptimizer.generateResponsiveImageUrl(await baseImageUrl, size.width, 95);
    
    if (preloaderRef.current) {
      try {
        await preloaderRef.current!.preloadImage(highQualityUrl, currentTrivia, currentLocation, 'high');
        setQualityLevel('high');
        
        // 高品質画像に切り替え
        setImageState(prev => ({
          ...prev,
          imageUrl: highQualityUrl
        }));
      } catch (error) {
        console.warn('Failed to improve image quality:', error);
      }
    }
  }, [currentTrivia, currentLocation, qualityLevel]);

  // 自動品質向上（ロード完了後1.5秒待機、ユーザー体験を向上）
  useEffect(() => {
    if (!imageState.isLoading && !imageState.hasError && qualityLevel !== 'high') {
      const timeout = setTimeout(() => {
        improveQuality();
      }, 1500); // 3秒から1.5秒に短縮
      
      return () => clearTimeout(timeout);
    }
  }, [imageState.isLoading, imageState.hasError, qualityLevel, improveQuality]);

  return {
    // 画像状態
    imageState,
    qualityLevel,
    
    // 統計情報
    stats,
    
    // 操作関数
    loadImage,
    preloadSpecificImages,
    optimizeCache,
    enableEmergencyMode,
    clearCache,
    improveQuality,
    
    // ユーティリティ
    isImageCached: useCallback((imageUrl: string) => {
      return imageMemoryCache.has(imageUrl);
    }, []),
    
    getCacheKeys: useCallback(() => {
      return imageMemoryCache.getKeys();
    }, []),
    
    getDetailedStats: useCallback(() => {
      const preloaderStats = preloaderRef.current?.getStats();
      const cacheStats = imageMemoryCache.getStats();
      const predictionStats = predictionEngineRef.current?.getAnalytics();
      
      return {
        preloader: preloaderStats,
        cache: cacheStats,
        predictions: predictionStats
      };
    }, [])
  };
}

export default usePreloadedImages;