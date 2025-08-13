import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from '@emotion/styled';

interface FastTextProps {
  text: string;
  onComplete?: () => void;
  delay?: number;
  fontSize?: string;
  color?: string;
}

const TextContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1.6;
`;

const FastText: React.FC<FastTextProps> = ({ 
  text, 
  onComplete,
  delay = 0,
  fontSize = '1rem',
  color = 'white'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      // アニメーション完了後にonCompleteを呼び出し
      setTimeout(() => {
        onComplete?.();
      }, 300); // 0.3秒後に完了
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, onComplete]);

  // リセット処理
  useEffect(() => {
    setIsVisible(false);
  }, [text]);

  return (
    <TextContainer
      style={{ fontSize, color }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isVisible ? { 
        opacity: 1, 
        scale: 1
      } : { 
        opacity: 0, 
        scale: 0.9
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut"
      }}
    >
      {text}
    </TextContainer>
  );
};

export default FastText;