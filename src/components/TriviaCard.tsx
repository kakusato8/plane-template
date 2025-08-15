import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../styles/theme';
import type { TriviaItem } from '../../types/trivia';

interface TriviaCardProps {
  trivia: TriviaItem;
  onComplete?: () => void;
  className?: string;
}

const CardContainer = styled(motion.div)`
  max-width: 600px;
  width: 90%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing[8]};
  box-shadow: ${theme.shadows.xl};
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;

  /* スマホ向け：タッチ操作最適化 */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[6]};
    max-width: 95%;
    width: 95%;
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
    max-width: 98%;
    width: 98%;
    border-radius: ${theme.borderRadius.xl};
  }
`;

const TitleContainer = styled.div`
  margin-bottom: ${theme.spacing[6]};
`;

const Title = styled.h1`
  font-family: ${theme.typography.fonts.secondary};
  font-size: ${theme.typography.sizes['2xl']};
  font-weight: ${theme.typography.weights.bold};
  color: ${theme.colors.text.primary};
  line-height: 1.3;
  text-align: center;
  margin-bottom: ${theme.spacing[4]};

  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${theme.typography.sizes.xl};
  }
`;

const ShortText = styled(motion.p)`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.lg};
  color: ${theme.colors.text.secondary};
  text-align: center;
  line-height: 1.6;
  margin-bottom: ${theme.spacing[6]};

  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${theme.typography.sizes.base};
    margin-bottom: ${theme.spacing[4]};
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    font-size: ${theme.typography.sizes.sm};
    margin-bottom: ${theme.spacing[3]};
  }
`;

const DetailText = styled(motion.div)`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.base};
  color: ${theme.colors.text.primary};
  line-height: 1.8;
  text-align: left;
  margin-bottom: ${theme.spacing[6]};

  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${theme.typography.sizes.sm};
    line-height: 1.7;
    margin-bottom: ${theme.spacing[4]};
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    font-size: ${theme.typography.sizes.xs};
    line-height: 1.6;
    margin-bottom: ${theme.spacing[3]};
  }
`;


const ActionButton = styled(motion.button)`
  background: ${theme.colors.gradients.mystical};
  border: none;
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing[3]} ${theme.spacing[8]};
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.base};
  font-weight: ${theme.typography.weights.semibold};
  color: white;
  cursor: pointer;
  box-shadow: ${theme.shadows.md};
  transition: all ${theme.animations.durations.fast} ease;
  margin: 0 auto;
  display: block;

  /* スマホ向け：タッチ操作最適化 */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  min-height: 44px; /* iOS推奨のタップ領域最小サイズ */
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.lg};
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[3]} ${theme.spacing[6]};
    font-size: ${theme.typography.sizes.base};
    min-height: 48px;
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[2]} ${theme.spacing[4]};
    font-size: ${theme.typography.sizes.sm};
    min-height: 44px;
    width: 100%;
    max-width: 200px;
  }
`;

const TriviaCard: React.FC<TriviaCardProps> = ({ 
  trivia, 
  onComplete,
  className 
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const [showChoicesButton, setShowChoicesButton] = useState(false);

  // 詳細を自動表示するタイマー（短文を読む時間を考慮）
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDetail(true);
    }, 1500); // 1.5秒後に自動表示

    return () => clearTimeout(timer);
  }, [trivia.id]);

  // 詳細表示後、選択肢ボタンを表示するタイマー
  useEffect(() => {
    if (showDetail) {
      const timer = setTimeout(() => {
        setShowChoicesButton(true);
      }, 1200); // 詳細表示から1.2秒後

      return () => clearTimeout(timer);
    }
  }, [showDetail]);

  // handleShowChoices削除 - Serena MCP: シンプルなNextボタンのみ

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50, 
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
    },
    exit: {
      opacity: 0,
      y: -50,
      scale: 0.95,
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
    }
  };


  return (
    <CardContainer
      className={className}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <TitleContainer>
        <Title>{trivia.title}</Title>
        <ShortText
          variants={textVariants}
          initial="hidden"
          animate="visible"
        >
          {trivia.short}
        </ShortText>
      </TitleContainer>

      <AnimatePresence mode="wait">
        {showDetail && (
          <motion.div
            key="detail-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
          >
            <DetailText
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {trivia.detail}
            </DetailText>


            <AnimatePresence>
              {showChoicesButton && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ActionButton
                    onClick={handleComplete}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next
                  </ActionButton>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </CardContainer>
  );
};

export default TriviaCard;