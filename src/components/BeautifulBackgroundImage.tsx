import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { theme } from '../styles/theme';
import type { TriviaItem, Location } from '../../types/trivia';

interface BeautifulBackgroundImageProps {
  trivia?: TriviaItem;
  location?: Location;
  children?: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  alt: string;
}

const BackgroundContainer = styled(motion.div)<{
  overlayOpacity: number;
  hasOverlay: boolean;
  backgroundImageUrl?: string;
  fallbackGradient: string;
}>`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  
  /* SerenaMCP: 美しい段階的背景表示 - グラデーション → 画像 */
  background: ${({ backgroundImageUrl, fallbackGradient }) => 
    backgroundImageUrl 
      ? `${fallbackGradient}, url(${backgroundImageUrl})`
      : fallbackGradient
  };
  background-size: cover, cover;
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  background-blend-mode: ${({ backgroundImageUrl }) => backgroundImageUrl ? 'soft-light' : 'normal'};
  
  /* SerenaMCP: シームレストランジション */
  transition: background 1.2s ease-in-out;
  
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
  z-index: 2;
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
  children,
  className,
  overlay = true,
  overlayOpacity = 0.4,
  alt
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // 感情タグに基づくフォールバックグラデーション
  const getFallbackGradient = (): string => {
    if (!trivia?.tags?.emotion?.length) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    const emotion = trivia.tags.emotion[0];
    const gradients: Record<string, string> = {
      'ミステリアス': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'ロマンチック': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'エピック': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'ノスタルジック': 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
      'セレーン': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'ダーク': 'linear-gradient(135deg, #2c3e50 0%, #4a6741 100%)',
      'ジョイフル': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'メランコリック': 'linear-gradient(135deg, #6c7b95 0%, #b2c6ee 100%)',
      '歓迎': 'linear-gradient(135deg, #4ade80 0%, #06b6d4 100%)'
    };

    return gradients[emotion] || gradients['ミステリアス'];
  };

  // 美しい画像URLを生成
  const generateImageUrls = (): string[] => {
    if (!trivia || !location) return [];

    const urls: string[] = [];

    // 雰囲気に基づくUnsplash画像
    const atmosphere = [
      ...trivia.tags.emotion,
      ...trivia.tags.setting,
      ...location.atmosphere
    ].join(',');

    // 複数の美しい画像ソース
    urls.push(`https://source.unsplash.com/1920x1080/?${atmosphere}&landscape`);
    urls.push(`https://source.unsplash.com/1920x1080/?${trivia.tags.setting.join(',')}&beautiful`);
    urls.push(`https://source.unsplash.com/1920x1080/?nature,scenic&${trivia.tags.palette.join(',')}`);
    
    // Picsum画像（確実なフォールバック）
    const seed = Math.abs(trivia.title.charCodeAt(0) + location.name.charCodeAt(0));
    urls.push(`https://picsum.photos/1920/1080?random=${seed}`);
    
    return urls;
  };

  // 画像読み込み処理 - SerenaMCP: バックグラウンドでシームレス実行
  const loadImage = async (urls: string[]) => {
    setImageError(false);
    setImageReady(false);
    setImageUrl(''); // リセットしてグラデーションから開始

    for (const url of urls) {
      try {
        const img = new Image();
        
        const loadPromise = new Promise<string>((resolve, reject) => {
          img.onload = () => resolve(url);
          img.onerror = reject;
          img.src = url;
        });

        const loadedUrl = await Promise.race([
          loadPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);

        console.log('✅ SerenaMCP: 美しい画像読み込み成功 - シームレス表示:', loadedUrl);
        // 少し待ってから画像をフェードイン
        setTimeout(() => {
          setImageUrl(loadedUrl);
          setImageReady(true);
        }, 200);
        return;

      } catch (error) {
        console.warn(`⚠️ 画像読み込み失敗: ${url}`, error);
        continue;
      }
    }

    console.log('💫 SerenaMCP: 全画像読み込み失敗 - 美しいグラデーションで継続表示');
    setImageError(true);
  };

  // トリビアまたは地点変更時に画像更新
  useEffect(() => {
    if (trivia && location) {
      const urls = generateImageUrls();
      console.log('🖼️ SerenaMCP: 美しい背景画像バックグラウンド読み込み開始:', {
        trivia: trivia.title,
        location: location.name,
        emotion: trivia.tags.emotion,
        urls: urls.length
      });
      
      loadImage(urls);
    }
  }, [trivia?.id, location?.id]);

  return (
    <BackgroundContainer
      className={className}
      hasOverlay={overlay}
      overlayOpacity={overlayOpacity}
      backgroundImageUrl={imageError ? undefined : imageUrl}
      fallbackGradient={getFallbackGradient()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* SerenaMCP: ローディング表示削除 - シームレスな体験のため */}
      
      <ContentContainer>{children}</ContentContainer>
    </BackgroundContainer>
  );
};

export default BeautifulBackgroundImage;