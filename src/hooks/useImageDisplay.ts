import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageManager, LoadingStage, type LoadingStage as LoadingStageType, type TriviaImageTags } from '../utils/imageManager';

/**
 * 段階的画像表示フック (Serena MCP対応)
 * グラデーション → プレースホルダー → 標準 → 高品質の順で表示
 */

interface UseImageDisplayProps {
  tags: TriviaImageTags;
  enabled?: boolean;
  onStageChange?: (stage: LoadingStageType, url: string) => void;
}

interface ImageDisplayState {
  currentStage: LoadingStageType;
  currentUrl: string;
  backgroundStyle: React.CSSProperties;
  isLoading: boolean;
  hasError: boolean;
  stats: {
    loadTime: number;
    cacheHit: boolean;
    totalStages: number;
  };
  preloadNext?: (nextTagsList: TriviaImageTags[]) => Promise<void>;
}

export function useImageDisplay({ 
  tags, 
  enabled = true,
  onStageChange
}: UseImageDisplayProps): ImageDisplayState {
  
  const [state, setState] = useState<ImageDisplayState>({
    currentStage: LoadingStage.GRADIENT,
    currentUrl: '',
    backgroundStyle: {},
    isLoading: false,
    hasError: false,
    stats: {
      loadTime: 0,
      cacheHit: false,
      totalStages: 0
    }
  });

  const imageManager = useRef<ImageManager | undefined>(undefined);
  
  // ImageManagerインスタンスを初期化
  if (!imageManager.current) {
    imageManager.current = ImageManager.getInstance();
  }
  const loadingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const stageTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // 段階的読み込みメイン処理
  const loadImageProgressive = useCallback(async () => {
    if (!enabled || !tags) return;

    console.log('🖼️ 段階的画像読み込み開始:', tags.emotion[0] || 'unknown');
    // const startTime = Date.now();

    try {
      // 段階1: 即座にグラデーション表示
      const fallbackGradient = imageManager.current!.getFallbackGradient(tags);
      setState(prev => ({
        ...prev,
        currentStage: LoadingStage.GRADIENT,
        currentUrl: 'gradient',
        backgroundStyle: { background: fallbackGradient },
        isLoading: true,
        hasError: false
      }));
      onStageChange?.(LoadingStage.GRADIENT, fallbackGradient);

      // 段階2: 500ms後にプレースホルダー（ぼかし画像）
      stageTimeoutsRef.current[0] = setTimeout(async () => {
        try {
          const placeholderConfig = imageManager.current!.generateImageUrl(tags, { 
            blur: 5, 
            quality: 30 
          });
          const placeholderUrl = imageManager.current!.buildPicsumUrl(placeholderConfig);
          
          console.log('🌫️ プレースホルダー読み込み開始');
          const result = await imageManager.current!.loadSingleImage(placeholderUrl);
          
          if (result.success) {
            setState(prev => ({
              ...prev,
              currentStage: LoadingStage.PLACEHOLDER,
              currentUrl: placeholderUrl,
              backgroundStyle: { 
                backgroundImage: `url(${placeholderUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              },
              stats: { ...prev.stats, loadTime: result.loadTime }
            }));
            onStageChange?.(LoadingStage.PLACEHOLDER, placeholderUrl);
            console.log('✅ プレースホルダー表示完了:', result.loadTime + 'ms');
          }
        } catch (error) {
          console.warn('⚠️ プレースホルダー読み込み失敗:', error);
        }
      }, 500);

      // 段階3: 2秒後に標準品質画像
      stageTimeoutsRef.current[1] = setTimeout(async () => {
        try {
          const standardConfig = imageManager.current!.generateImageUrl(tags, { quality: 70 });
          const standardUrl = imageManager.current!.buildPicsumUrl(standardConfig);
          
          console.log('📷 標準品質画像読み込み開始');
          const result = await imageManager.current!.loadSingleImage(standardUrl);
          
          if (result.success) {
            setState(prev => ({
              ...prev,
              currentStage: LoadingStage.STANDARD,
              currentUrl: standardUrl,
              backgroundStyle: {
                backgroundImage: `url(${standardUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              },
              isLoading: false,
              stats: { ...prev.stats, loadTime: result.loadTime }
            }));
            onStageChange?.(LoadingStage.STANDARD, standardUrl);
            console.log('✅ 標準品質画像表示完了:', result.loadTime + 'ms');
          }
        } catch (error) {
          console.warn('⚠️ 標準品質画像読み込み失敗:', error);
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }, 2000);

      // 段階4: 5秒後に高品質画像（バックグラウンド）
      stageTimeoutsRef.current[2] = setTimeout(async () => {
        try {
          const highQualityConfig = imageManager.current!.generateImageUrl(tags, { quality: 90 });
          const highQualityUrl = imageManager.current!.buildPicsumUrl(highQualityConfig);
          
          console.log('🎨 高品質画像読み込み開始（バックグラウンド）');
          const result = await imageManager.current!.loadSingleImage(highQualityUrl);
          
          if (result.success) {
            setState(prev => ({
              ...prev,
              currentStage: LoadingStage.HIGH_QUALITY,
              currentUrl: highQualityUrl,
              backgroundStyle: {
                backgroundImage: `url(${highQualityUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              },
              stats: { ...prev.stats, loadTime: result.loadTime, totalStages: 4 }
            }));
            onStageChange?.(LoadingStage.HIGH_QUALITY, highQualityUrl);
            console.log('✅ 高品質画像表示完了:', result.loadTime + 'ms');
          }
        } catch (error) {
          console.warn('⚠️ 高品質画像読み込み失敗:', error);
        }
      }, 5000);

    } catch (error) {
      console.error('❌ 段階的画像読み込み全体エラー:', error);
      setState(prev => ({
        ...prev,
        hasError: true,
        isLoading: false
      }));
    }
  }, [tags, enabled, onStageChange]);

  // プリロード（次の雑学の画像を先読み）
  const preloadNext = useCallback(async (nextTagsList: TriviaImageTags[]) => {
    if (nextTagsList.length > 0) {
      console.log('🔄 次回画像をプリロード開始:', nextTagsList.length + '件');
      await imageManager.current!.preloadNext(nextTagsList);
      console.log('✅ プリロード完了');
    }
  }, []);

  // タグが変更された時の処理
  useEffect(() => {
    // 既存のタイムアウトをクリア
    stageTimeoutsRef.current.forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    stageTimeoutsRef.current = [];

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // 新しい画像読み込み開始
    loadImageProgressive();

    return () => {
      // クリーンアップ
      stageTimeoutsRef.current.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loadImageProgressive]);

  return {
    ...state,
    preloadNext
  };
}

export default useImageDisplay;