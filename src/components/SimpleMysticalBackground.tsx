import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';

interface SimpleMysticalBackgroundProps {
  imageUrl: string;
  nextImageUrl?: string;
  alt: string;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
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
      ? `linear-gradient(135deg, #667eea 0%, #764ba2 100%), url(${backgroundImageUrl})`
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
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

const SimpleMysticalBackground: React.FC<SimpleMysticalBackgroundProps> = ({
  imageUrl,
  nextImageUrl,
  alt: _alt,
  overlay = true,
  overlayOpacity = 0.4,
  children,
  onTransitionComplete
}) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  // 画像プリロード処理
  const preloadImage = async (url: string): Promise<void> => {
    if (preloadedImages.has(url) || url.startsWith('data:')) {
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
        console.warn('❌ 背景画像プリロード失敗:', url);
        reject(error);
      };
      
      const timeout = setTimeout(() => {
        reject(new Error('タイムアウト'));
      }, 5000);
      
      img.onload = () => {
        clearTimeout(timeout);
        setPreloadedImages(prev => new Set([...prev, url]));
        resolve();
      };
      
      img.src = url;
    });
  };

  // 次の画像をバックグラウンドでプリロード
  useEffect(() => {
    if (nextImageUrl && !preloadedImages.has(nextImageUrl)) {
      preloadImage(nextImageUrl).catch(console.warn);
    }
  }, [nextImageUrl, preloadedImages]);

  // 現在の画像が変更された時の処理
  useEffect(() => {
    if (imageUrl !== currentImageUrl) {
      console.log('🔄 背景画像切り替え:', currentImageUrl, '->', imageUrl);
      
      preloadImage(imageUrl)
        .then(() => {
          setTimeout(() => {
            setCurrentImageUrl(imageUrl);
          }, 300);
        })
        .catch(() => {
          setCurrentImageUrl(imageUrl);
        });
    }
  }, [imageUrl, currentImageUrl]);

  const handleTransitionComplete = () => {
    onTransitionComplete?.();
    console.log('🎉 背景切り替えアニメーション完了');
  };

  return (
    <BackgroundContainer>
      <AnimatePresence mode="wait" onExitComplete={handleTransitionComplete}>
        <BackgroundLayer
          key={currentImageUrl}
          backgroundImageUrl={currentImageUrl}
          hasOverlay={overlay}
          overlayOpacity={overlayOpacity}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </AnimatePresence>
      
      <ContentContainer>
        {children}
      </ContentContainer>
      
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
          <div>プリロード済み: {preloadedImages.size}枚</div>
          <div>現在画像: {currentImageUrl ? '✅' : '❌'}</div>
          <div>次の画像: {nextImageUrl ? '待機中' : 'なし'}</div>
        </div>
      )}
    </BackgroundContainer>
  );
};

export default SimpleMysticalBackground;