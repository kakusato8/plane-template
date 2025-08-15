import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
// import { theme } from '../styles/theme';
import type { TriviaItem, Location } from '../../types/trivia';

interface SimpleBackgroundImageProps {
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
  backgroundGradient: string;
}>`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  
  /* シンプルで美しいグラデーション背景（テキストなし） */
  background: ${({ backgroundGradient }) => backgroundGradient};
  
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

/**
 * SerenaMCP: 完全にシンプルな背景コンポーネント
 * - 複雑な画像ロードなし
 * - 変なテキスト一切なし  
 * - 純粋なCSS gradientのみ
 * - 確実に動作
 */
const SimpleBackgroundImage: React.FC<SimpleBackgroundImageProps> = ({
  trivia,
  location,
  children,
  className,
  overlay = true,
  overlayOpacity = 0.4,
  alt: _alt
}) => {
  // 感情タグに基づく美しいグラデーション選択
  const getGradient = (): string => {
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

  console.log('🎨 SimpleBackgroundImage: 純粋グラデーション表示', {
    trivia: trivia?.title,
    location: location?.name,
    emotion: trivia?.tags?.emotion,
    gradientWillBe: getGradient(),
    overlaySettings: { overlay, overlayOpacity }
  });

  return (
    <BackgroundContainer
      className={className}
      hasOverlay={overlay}
      overlayOpacity={overlayOpacity}
      backgroundGradient={getGradient()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ContentContainer>{children}</ContentContainer>
    </BackgroundContainer>
  );
};

export default SimpleBackgroundImage;