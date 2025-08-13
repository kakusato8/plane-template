import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from '@emotion/styled';

interface InstantTextProps {
  text: string;
  onComplete?: () => void;
  delay?: number;
  fontSize?: string;
  color?: string;
  speed?: number;
  style?: React.CSSProperties;
}

const TextContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1.6;
  text-align: center;
`;

const InstantText: React.FC<InstantTextProps> = ({ 
  text, 
  onComplete,
  delay = 0,
  fontSize = '1rem',
  color = '#ffffff',
  speed = 50,
  style = {}
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      // 瞬時に完了
      onComplete?.();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, onComplete]);

  // リセット処理
  useEffect(() => {
    setIsVisible(false);
  }, [text]);

  return (
    <TextContainer
      style={{ 
        fontSize, 
        color,
        ...style,
        // SerenaMCP強化: 最大視認性確保
        textShadow: `
          0 0 8px rgba(0, 0, 0, 0.9),
          0 0 16px rgba(0, 0, 0, 0.7),
          0 2px 4px rgba(0, 0, 0, 0.8),
          0 0 24px rgba(255, 255, 255, 0.3)
        `,
        fontWeight: '600',
        filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))'
      }}
      initial={{ opacity: 0 }}
      animate={isVisible ? { 
        opacity: 1
      } : { 
        opacity: 0
      }}
      transition={{
        duration: 0.2, // 瞬時フェードイン
        ease: "easeOut"
      }}
    >
      {text}
    </TextContainer>
  );
};

export { InstantText };
export default InstantText;