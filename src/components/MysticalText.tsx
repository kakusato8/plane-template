import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';

interface MysticalTextProps {
  text: string;
  animationType?: 'typewriter' | 'stagger' | 'flow' | 'ghostly' | 'sparkle';
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

// 複数のアニメーション種類を定義
const animationVariants = {
  typewriter: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.15 }
  },
  stagger: {
    initial: { opacity: 0, y: 20, rotateX: -90 },
    animate: { opacity: 1, y: 0, rotateX: 0 },
    transition: { duration: 0.5, type: "spring" as any, bounce: 0.4 }
  },
  flow: {
    initial: { opacity: 0, x: -30, scale: 0.8 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: { duration: 0.6, ease: "easeOut" as any }
  },
  ghostly: {
    initial: { opacity: 0, y: 30, filter: "blur(10px)" },
    animate: { 
      opacity: [0, 0.7, 1], 
      y: [30, -5, 0], 
      filter: ["blur(10px)", "blur(2px)", "blur(0px)"] 
    },
    transition: { duration: 1.2, ease: "easeOut" as any }
  },
  sparkle: {
    initial: { opacity: 0, scale: 0, rotate: -180 },
    animate: { 
      opacity: [0, 1.2, 1], 
      scale: [0, 1.3, 1], 
      rotate: [-180, 10, 0] 
    },
    transition: { duration: 0.8, ease: "backOut" as any }
  }
};

// 魂のような浮遊効果を追加
const floatingAnimation = {
  animate: {
    y: [0, -8, 0],
    opacity: [0.9, 1, 0.9],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as any
    }
  }
};

const MysticalText: React.FC<MysticalTextProps> = ({ 
  text, 
  animationType = 'typewriter',
  onComplete,
  delay = 0,
  fontSize = '1rem',
  color = 'white'
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [_isComplete, setIsComplete] = useState(false);
  const [randomAnimationType, setRandomAnimationType] = useState(animationType);

  // ランダムアニメーション選択
  useEffect(() => {
    if (animationType === 'typewriter') {
      // 複数のアニメーションからランダムに1つ選択
      const animationTypes: Array<keyof typeof animationVariants> = [
        'typewriter', 'stagger', 'flow', 'ghostly', 'sparkle'
      ];
      const randomType = animationTypes[Math.floor(Math.random() * animationTypes.length)];
      setRandomAnimationType(randomType);
      console.log('🎭 ランダムアニメーション選択:', randomType);
    }
  }, [animationType, text]);

  // 文字を1文字ずつ表示
  useEffect(() => {
    if (currentIndex >= text.length) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(text.slice(0, currentIndex + 1));
      setCurrentIndex(prev => prev + 1);
    }, delay + (currentIndex * (randomAnimationType === 'ghostly' ? 150 : 100)));

    return () => clearTimeout(timer);
  }, [currentIndex, text, delay, randomAnimationType, onComplete]);

  // リセット処理
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  const currentVariant = animationVariants[randomAnimationType];

  return (
    <TextContainer style={{ fontSize, color }}>
      <AnimatePresence>
        {text.split('').map((char, index) => {
          const isVisible = index < displayedText.length;
          
          return (
            <CharacterWrapper
              key={`${text}-${index}`}
              initial={currentVariant.initial}
              animate={isVisible ? {
                ...currentVariant.animate,
                // 魂のような浮遊効果を一部の文字に追加
                ...(randomAnimationType === 'ghostly' && Math.random() > 0.7 
                  ? floatingAnimation.animate 
                  : {})
              } : currentVariant.initial}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                ...currentVariant.transition,
                delay: index * 0.05 + delay
              }}
              style={{
                textShadow: randomAnimationType === 'sparkle' 
                  ? '0 0 10px rgba(255, 255, 255, 0.5)' 
                  : randomAnimationType === 'ghostly'
                  ? '0 0 20px rgba(255, 255, 255, 0.3)'
                  : 'none'
              }}
            >
              {char}
            </CharacterWrapper>
          );
        })}
      </AnimatePresence>
    </TextContainer>
  );
};

export default MysticalText;