import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';

interface MysticalBackgroundProps {
  imageUrl: string;
  nextImageUrl?: string;
  alt: string;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
  transitionType?: 'fade' | 'slide' | 'zoom' | 'vortex' | 'shatter';
  onTransitionComplete?: () => void;
}

const BackgroundContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const BackgroundLayer = styled(motion.div)<{
  backgroundImageUrl?: string;
  overlayOpacity: number;
  hasOverlay: boolean;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ backgroundImageUrl }) => 
    backgroundImageUrl 
      ? `${theme.colors.gradients.mystical}, url(${backgroundImageUrl})`
      : theme.colors.gradients.mystical
  };
  background-size: cover, cover;
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  background-blend-mode: overlay;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ hasOverlay, overlayOpacity }) =>
      hasOverlay ? `rgba(0, 0, 0, ${overlayOpacity})` : 'transparent'};
    z-index: 1;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 25%,
      transparent 75%,
      rgba(255, 255, 255, 0.1) 100%
    );
    animation: shimmer 8s ease-in-out infinite;
    z-index: 2;
    pointer-events: none;
    opacity: 0.3;
    
    @keyframes shimmer {
      0%, 100% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
      50% { transform: translateX(200%) skewX(-15deg); opacity: 0.3; }
    }
  }
`;

const ContentContainer = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

// 複数の背景切り替えアニメーション定義
const transitionVariants = {
  fade: {
    initial: { opacity: 0, scale: 1.05 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 1.2, ease: "easeInOut" as any }
  },
  
  slide: {
    initial: { x: "100%", opacity: 0 },
    animate: { x: "0%", opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
    transition: { duration: 1.5, ease: "easeInOut" as any }
  },
  
  zoom: {
    initial: { scale: 1.3, opacity: 0, filter: "blur(10px)" },
    animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
    exit: { scale: 0.8, opacity: 0, filter: "blur(5px)" },
    transition: { duration: 1.8, ease: "easeOut" as any }
  },
  
  vortex: {
    initial: { 
      scale: 0.3, 
      opacity: 0, 
      rotateZ: 180,
      filter: "blur(20px)" 
    },
    animate: { 
      scale: 1, 
      opacity: 1, 
      rotateZ: 0,
      filter: "blur(0px)" 
    },
    exit: { 
      scale: 2, 
      opacity: 0, 
      rotateZ: -180,
      filter: "blur(25px)" 
    },
    transition: { duration: 2, ease: "easeInOut" as any }
  },
  
  shatter: {
    initial: { 
      clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)",
      opacity: 0,
      filter: "brightness(0.3)"
    },
    animate: { 
      clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
      opacity: 1,
      filter: "brightness(1)"
    },
    exit: { 
      clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
      opacity: 0,
      filter: "brightness(0.3)"
    },
    transition: { duration: 1.4, ease: "easeInOut" as any }
  }
};

const MysticalBackground: React.FC<MysticalBackgroundProps> = ({
  imageUrl,
  nextImageUrl,
  alt: _alt,
  overlay = true,
  overlayOpacity = 0.4,
  children,
  transitionType = 'fade',
  onTransitionComplete
}) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [randomTransitionType, setRandomTransitionType] = useState(transitionType);

  // ランダムトランジション選択
  useEffect(() => {
    const transitionTypes: Array<keyof typeof transitionVariants> = [
      'fade', 'slide', 'zoom', 'vortex', 'shatter'
    ];
    const randomType = transitionTypes[Math.floor(Math.random() * transitionTypes.length)];
    setRandomTransitionType(randomType);
    console.log('🌈 背景切り替えアニメーション選択:', randomType);
  }, [imageUrl]);

  // 画像プリロード処理
  const preloadImage = async (url: string): Promise<void> => {
    if (preloadedImages.has(url)) {
      console.log('✅ 画像は既にプリロード済み:', url);
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        setPreloadedImages(prev => new Set([...prev, url]));
        console.log('✅ 背景画像プリロード完了:', url);
        resolve();
      };
      
      img.onerror = (error) => {
        console.warn('❌ 背景画像プリロード失敗:', url, error);
        reject(error);
      };
      
      img.src = url;
    });
  };

  // 次の画像をバックグラウンドでプリロード
  useEffect(() => {
    if (nextImageUrl && !preloadedImages.has(nextImageUrl)) {
      console.log('🎯 次の背景画像をプリロード開始:', nextImageUrl);
      preloadImage(nextImageUrl).catch(console.warn);
    }
  }, [nextImageUrl, preloadedImages]);

  // 現在の画像が変更された時の処理
  useEffect(() => {
    if (imageUrl !== currentImageUrl) {
      console.log('🔄 背景画像切り替え開始:', currentImageUrl, '->', imageUrl);
      setIsTransitioning(true);
      
      // 新しい画像をプリロード
      preloadImage(imageUrl)
        .then(() => {
          console.log('⚡ 新しい背景画像の適用準備完了');
          setTimeout(() => {
            setCurrentImageUrl(imageUrl);
          }, 300); // 少し遅延してから切り替え
        })
        .catch(() => {
          console.warn('⚠️ 新しい画像のプリロードに失敗、そのまま適用');
          setCurrentImageUrl(imageUrl);
        });
    }
  }, [imageUrl, currentImageUrl]);

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
    onTransitionComplete?.();
    console.log('🎉 背景切り替えアニメーション完了');
  };

  const currentVariant = transitionVariants[randomTransitionType];

  return (
    <BackgroundContainer>
      <AnimatePresence 
        mode="wait" 
        onExitComplete={handleTransitionComplete}
      >
        <BackgroundLayer
          key={currentImageUrl}
          backgroundImageUrl={currentImageUrl}
          hasOverlay={overlay}
          overlayOpacity={overlayOpacity}
          initial={currentVariant.initial}
          animate={currentVariant.animate}
          exit={currentVariant.exit}
          transition={currentVariant.transition}
        />
      </AnimatePresence>
      
      <ContentContainer>
        {children}
      </ContentContainer>
      
      {/* パーティクル効果（オプション） */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
        animate={{
          background: [
            'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear" as any
        }}
      />

      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 20,
          maxWidth: '250px'
        }}>
          <div>アニメーション: {randomTransitionType}</div>
          <div>切り替え中: {isTransitioning ? '✅' : '❌'}</div>
          <div>プリロード済み: {preloadedImages.size}枚</div>
          <div>現在画像: {currentImageUrl ? '✅' : '❌'}</div>
          <div>次の画像: {nextImageUrl ? '待機中' : 'なし'}</div>
        </div>
      )}
    </BackgroundContainer>
  );
};

export default MysticalBackground;