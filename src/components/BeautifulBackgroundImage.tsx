import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { theme } from '../styles/theme';
import type { TriviaItem, Location } from '../../types/trivia';

interface BeautifulBackgroundImageProps {
  trivia?: TriviaItem;
  location?: Location;
  nextTrivia?: TriviaItem;  // 🎯 次の雑学データ（プリロード用）
  nextLocation?: Location; // 🎯 次の地点データ（プリロード用）
  children?: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  alt: string;
  isImageLoading?: boolean; // 🎨 SerenaMCP: 画像読み込み状態（外部から制御）
  onImageLoadComplete?: () => void; // 🎨 SerenaMCP: 画像読み込み完了コールバック
}

const BackgroundContainer = styled(motion.div)<{
  overlayOpacity: number;
  hasOverlay: boolean;
}>`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ hasOverlay, overlayOpacity }) =>
      hasOverlay ? `rgba(0, 0, 0, ${overlayOpacity})` : 'transparent'};
    z-index: 10;
  }
`;

const BackgroundLayer = styled(motion.div)<{
  backgroundUrl: string;
  isVisible: boolean;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ backgroundUrl }) => 
    backgroundUrl.startsWith('linear-gradient') || backgroundUrl.startsWith('radial-gradient')
      ? backgroundUrl  // CSSグラデーションの場合はそのまま適用
      : `url(${backgroundUrl})`  // 画像URLの場合
  };
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: ${({ isVisible }) => isVisible ? 1 : 0};
  transition: opacity 0.3s ease-in-out; // 0.8s → 0.3s 高速化
  z-index: 1;
  pointer-events: none;
`;

const FlashOverlay = styled(motion.div)<{
  isVisible: boolean;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, 
    #ffffff 0%, #f8f9fa 20%, #f0f4f8 40%, #e8d5b7 60%, #d4af37 80%, #ffd700 100%);
  background-size: 300% 300%;
  animation: ${({ isVisible }) => isVisible ? 'gradientShift 2s ease-in-out infinite' : 'none'};
  opacity: ${({ isVisible }) => isVisible ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
  z-index: 15;
  pointer-events: none;
  
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  /* 美しいパルス効果 */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: ${({ isVisible }) => isVisible ? 'pulse 1.5s ease-in-out infinite' : 'none'};
  }
  
  @keyframes pulse {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.4; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  }
`;

const ContentContainer = styled.div`
  position: relative;
  z-index: 20;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

// LoadingOverlay削除 - SerenaMCP: シームレスな体験のため

/**
 * 美しい背景画像システム - テキスト問題を排除しつつ実画像を表示
 */
const BeautifulBackgroundImage: React.FC<BeautifulBackgroundImageProps> = ({
  trivia,
  location,
  nextTrivia,    // 🎯 次の雑学
  nextLocation,  // 🎯 次の地点
  children,
  className,
  overlay = true,
  overlayOpacity = 0.4,
  alt,
  isImageLoading = false, // 🎨 SerenaMCP: 外部画像読み込み状態
  onImageLoadComplete    // 🎨 SerenaMCP: 読み込み完了コールバック
}) => {
  // ⚡ 即座に美しいCSS背景を生成（ネットワーク不要、0ms表示）
  const getInstantBeautifulBackground = (trivia: TriviaItem, location: Location): string => {
    const emotion = trivia.tags.emotion[0] || 'ミステリアス';
    const setting = trivia.tags.setting[0] || '空';
    
    // 感情とセッティングに基づく美しいグラデーション
    const gradients: Record<string, string> = {
      'ミステリアス': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'ロマンチック': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'エピック': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'ノスタルジック': 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
      'セレーン': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'ダーク': 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      'ジョイフル': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'メランコリック': 'linear-gradient(135deg, #6c7b95 0%, #b2c6ee 100%)'
    };
    
    return gradients[emotion] || gradients['ミステリアス'];
  };

  const [currentImageUrl, setCurrentImageUrl] = useState<string>('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const [preloadedImageUrl, setPreloadedImageUrl] = useState<string>(''); // 🎯 事前読み込み済み画像
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  // 🎨 SerenaMCP: フラッシュ状態は外部から制御（isImageLoading）

  // 🔒 SerenaMCPプリロード：完全オフライン（外部API不使用）
  const preloadNextSerenaMCPBackground = async () => {
    if (!nextTrivia || !nextLocation) {
      console.log('🔒 SerenaMCPプリロード：次のデータ未定義、スキップ');
      return;
    }

    console.log('🔒 SerenaMCPプリロード：オフライン背景を事前準備', {
      nextLocation: nextLocation.name,
      nextEmotion: nextTrivia.tags.emotion
    });

    // 即座に完璧なCSS背景を準備（エラー不可能）
    const offlineBackground = getInstantBeautifulBackground(nextTrivia, nextLocation);
    setPreloadedImageUrl(offlineBackground);
    console.log('✅ SerenaMCPプリロード完了：オフライン背景準備済み');
  };

  // 🎯 瞬間切り替え：プリロード済み画像を即座表示
  const switchToPreloadedImage = () => {
    if (preloadedImageUrl) {
      console.log('⚡ 瞬間切り替え：プリロード画像を即座表示');
      setCurrentImageUrl(preloadedImageUrl);
      setPreloadedImageUrl(''); // 使用済みクリア
      return true; // 成功
    }
    return false; // プリロード未完了
  };

  // 🎨 SerenaMCP: 美しい画像表示システム（フラッシュ制御分離）
  const generateAndSetImage = async () => {
    if (!trivia || !location) {
      console.warn('📸 写真取得: trivia または location が未定義');
      if (onImageLoadComplete) onImageLoadComplete(); // エラー時も完了扱い
      return;
    }

    console.log('🎨 SerenaMCP: 美しい画像生成開始（外部フラッシュ制御）');
    setIsTransitioning(true);

    try {
      // 外部画像URLを生成して読み込み試行
      const photoUrls = generateReliablePhotoUrls(trivia, location);
      const imageUrl = await loadPhotoWithFallback(photoUrls);
      
      // 成功した画像またはフォールバック背景を設定
      setCurrentImageUrl(imageUrl);
      console.log('✅ SerenaMCP: 美しい背景設定完了:', imageUrl.startsWith('linear-gradient') ? 'フォールバック背景' : '外部画像');
      
      // ③画像読み込み完了時にフラッシュを解除
      if (onImageLoadComplete) {
        console.log('🎉 ERR_CONNECTION_REFUSED対応: 画像読み込み完了コールバック実行');
        onImageLoadComplete();
      }
      
    } catch (error) {
      // 完全失敗時の緊急フォールバック
      console.error('❌ 画像生成完全失敗:', error);
      const fallbackBackground = getInstantBeautifulBackground(trivia, location);
      setCurrentImageUrl(fallbackBackground);
      
      // 🛡️ エラー時も必ずフラッシュ解除（無限ループ防止）
      if (onImageLoadComplete) {
        console.log('🛡️ ERR_CONNECTION_REFUSED対応: エラー時も画像読み込み完了扱い');
        onImageLoadComplete();
      }
    } finally {
      setIsTransitioning(false);
      
      // 🛡️ フラッシュ無限ループ防止：万が一の保険（強化版）
      if (onImageLoadComplete) {
        setTimeout(() => {
          console.log('🛡️ ERR_CONNECTION_REFUSED対応: 最終保険のフラッシュ解除（10秒後）');
          onImageLoadComplete();
        }, 10000); // 100ms → 10秒 十分な時間を確保
      }
    }
  };

  // 🛡️ ERR_CONNECTION_REFUSED耐性強化画像読み込み（美しい外部画像優先）
  const loadPhotoWithFallback = async (urls: string[]): Promise<string> => {
    console.log('🛡️ ERR_CONNECTION_REFUSED耐性画像読み込み開始:', urls.length, '個のURL');
    
    if (urls.length === 0) {
      console.log('🎨 URL未提供 - 美しいフォールバック背景使用');
      if (trivia && location) {
        return getInstantBeautifulBackground(trivia, location);
      }
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    // 外部画像を順次試行（ERR_CONNECTION_REFUSED対応）
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        console.log(`🎨 美しい画像読み込み試行 ${i + 1}/${urls.length}:`, url);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const loadPromise = new Promise<string>((resolve, reject) => {
          img.onload = () => {
            if (img.complete && img.naturalWidth > 0) {
              console.log('✅ 美しい外部画像読み込み成功:', url);
              resolve(url);
            } else {
              reject(new Error('Image not complete'));
            }
          };
          
          img.onerror = (error) => {
            console.warn('⚠️ 外部画像接続失敗（ERR_CONNECTION_REFUSED等）:', {
              url: url,
              error: error,
              timestamp: new Date().toISOString(),
              imageElement: img
            });
            reject(new Error('Connection failed'));
          };
        });

        img.src = url;

        // 🛡️ ERR_CONNECTION_REFUSED用強化タイムアウト（5秒→8秒に延長）
        const loadedUrl = await Promise.race([
          loadPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 8000) // 3000ms → 8000ms さらに余裕を持たせる
          )
        ]);

        return loadedUrl; // 成功時は外部画像を返す

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`⚠️ 美しい画像 ${i + 1} 読み込み失敗:`, url, errorMessage);
        continue; // 次のURLを試行
      }
    }

    // 🎨 全ての外部画像が失敗した場合のみフォールバック
    console.log('🎨 全外部画像失敗（ERR_CONNECTION_REFUSED等）- 美しいフォールバック背景使用');
    if (trivia && location) {
      return getInstantBeautifulBackground(trivia, location);
    }
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  // 🎨 美しい外部画像URLリストを生成（ERR_CONNECTION_REFUSED耐性強化）
  const generateReliablePhotoUrls = (targetTrivia?: TriviaItem, targetLocation?: Location): string[] => {
    const useTrivia = targetTrivia || trivia;
    const useLocation = targetLocation || location;
    
    if (!useTrivia || !useLocation) return [];

    const urls: string[] = [];
    const seed = Math.abs(useTrivia.title.charCodeAt(0) + useLocation.name.charCodeAt(0));

    console.log('🎨 美しい外部画像URL生成（ERR_CONNECTION_REFUSED耐性付き）');

    // 1. Picsum Photos (最も安定) - 厳選された美しい写真ID
    const beautifulPhotoIds = [1, 2, 3, 4, 5, 10, 13, 15, 20, 22, 24, 25, 26, 28, 29, 30, 42, 48, 49, 50];
    const selectedId = beautifulPhotoIds[seed % beautifulPhotoIds.length];
    urls.push(`https://picsum.photos/id/${selectedId}/1200/800`);
    
    // 2. より多くの美しい写真IDから選択
    const morePhotoIds = [52, 54, 56, 58, 60, 62, 63, 64, 65, 70, 72, 74, 75, 76, 78, 82, 83, 84, 85, 88];
    const selectedId2 = morePhotoIds[seed % morePhotoIds.length];
    urls.push(`https://picsum.photos/id/${selectedId2}/1200/800`);

    // 3. 感情タグに基づく写真選択
    const emotion = useTrivia.tags.emotion[0] || 'ミステリアス';
    const emotionPhotoMap: Record<string, number[]> = {
      'ミステリアス': [13, 20, 42, 78, 82],
      'ロマンチック': [2, 24, 48, 60, 88],
      'エピック': [3, 15, 30, 65, 85],
      'セレーン': [5, 25, 49, 72, 74],
      'ノスタルジック': [4, 22, 50, 63, 76],
      'ダーク': [10, 26, 52, 64, 83],
      'ジョイフル': [1, 28, 54, 70, 84],
      'メランコリック': [29, 56, 58, 75, 82]
    };
    
    const emotionPhotos = emotionPhotoMap[emotion] || emotionPhotoMap['ミステリアス'];
    const emotionId = emotionPhotos[seed % emotionPhotos.length];
    urls.push(`https://picsum.photos/id/${emotionId}/1200/800`);

    return urls;
  };


  // トリビアまたは地点変更時に画像更新
  useEffect(() => {
    if (trivia && location) {
      console.log('🛡️ システム的予防：画像読み込み開始:', {
        trivia: trivia.title,
        location: location.name,
        emotion: trivia.tags.emotion
      });
      
      generateAndSetImage();
    }
  }, [trivia?.id, location?.id]);

  // 🎨 SerenaMCP: 初期表示時はフラッシュ制御不要（外部制御のため）
  // 初期表示フラッシュ処理を削除

  // 🔒 SerenaMCPプリロードシステム：次の雑学データが来たらオフライン背景を事前準備
  useEffect(() => {
    if (nextTrivia && nextLocation) {
      console.log('🔒 SerenaMCP：次のデータ受信、オフライン背景プリロード開始');
      preloadNextSerenaMCPBackground();
    }
  }, [nextTrivia?.id, nextLocation?.id]);

  return (
    <BackgroundContainer
      className={className}
      hasOverlay={overlay}
      overlayOpacity={overlayOpacity}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* 🎭 現在の背景画像（前面レイヤー） */}
      {currentImageUrl && (
        <BackgroundLayer
          backgroundUrl={currentImageUrl}
          isVisible={true}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ zIndex: 2 }}
        />
      )}

      {/* 🎯 プリロード済み背景画像（背面レイヤー） */}
      {preloadedImageUrl && (
        <BackgroundLayer
          backgroundUrl={preloadedImageUrl}
          isVisible={true}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ zIndex: 1 }}
        />
      )}

      {/* 🎨 SerenaMCP: 外部制御フラッシュオーバーレイ（画像読み込み中は表示） */}
      <FlashOverlay
        isVisible={isImageLoading || false}
        initial={{ opacity: 0 }}
        animate={{ opacity: isImageLoading ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />

      <ContentContainer>{children}</ContentContainer>
    </BackgroundContainer>
  );
};

export default BeautifulBackgroundImage;