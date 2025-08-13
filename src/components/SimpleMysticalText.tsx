import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from '@emotion/styled';

interface SimpleMysticalTextProps {
  text: string;
  animationType?: string;
  onComplete?: () => void;
  delay?: number;
  fontSize?: string;
  color?: string;
}

const TextContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  line-height: 1.6;
`;

const CharacterWrapper = styled(motion.span)`
  display: inline-block;
  white-space: pre;
`;

const SimpleMysticalText: React.FC<SimpleMysticalTextProps> = ({ 
  text, 
  onComplete,
  delay = 0,
  fontSize = '1rem',
  color = '#ffffff'
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // 文字を1文字ずつ表示（高速化版）
  useEffect(() => {
    if (currentIndex >= text.length) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(text.slice(0, currentIndex + 1));
      setCurrentIndex(prev => prev + 1);
    }, delay + (currentIndex * 2)); // 超高速表示（2ms）

    return () => clearTimeout(timer);
  }, [currentIndex, text, delay, onComplete]);

  // リセット処理
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  // SerenaMCP強化: 色別最適化されたテキストシャドウ
  const getOptimizedTextShadow = (textColor: string) => {
    if (textColor.includes('#ffd700') || textColor.includes('gold')) {
      // ゴールド色用の特別な影効果
      return `
        0 0 8px rgba(0, 0, 0, 0.95),
        0 0 16px rgba(0, 0, 0, 0.8),
        0 2px 4px rgba(0, 0, 0, 0.9),
        0 0 24px rgba(255, 215, 0, 0.4),
        0 0 32px rgba(255, 215, 0, 0.2)
      `;
    }
    // 白色用のデフォルト影効果
    return `
      0 0 8px rgba(0, 0, 0, 0.9),
      0 0 16px rgba(0, 0, 0, 0.7),
      0 2px 4px rgba(0, 0, 0, 0.8),
      0 0 24px rgba(255, 255, 255, 0.3)
    `;
  };

  const getOptimizedFilter = (textColor: string) => {
    if (textColor.includes('#ffd700') || textColor.includes('gold')) {
      return 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.5))';
    }
    return 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))';
  };

  return (
    <TextContainer style={{ 
      fontSize, 
      color,
      // SerenaMCP強化: 色別最適化された最大視認性確保
      textShadow: getOptimizedTextShadow(color),
      fontWeight: '600',
      filter: getOptimizedFilter(color)
    }}>
      {text.split('').map((char, index) => {
        const isVisible = index < displayedText.length;
        
        return (
          <CharacterWrapper
            key={`${text}-${index}`}
            initial={{ opacity: 0 }}
            animate={isVisible ? { 
              opacity: 1
            } : { 
              opacity: 0
            }}
            transition={{
              duration: 0.05, // 極速アニメーション
              delay: index * 0.002 + delay / 1000, // 超高速間隔（2ms）
              ease: "linear"
            }}
          >
            {char}
          </CharacterWrapper>
        );
      })}
    </TextContainer>
  );
};

export default SimpleMysticalText;