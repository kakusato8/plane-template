import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../styles/theme';
import type { TriviaItem } from '../../types/trivia';

interface TriviaCardProps {
  trivia: TriviaItem;
  onComplete?: () => void;
  onShowChoices?: () => void;
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

  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[6]};
    max-width: 95%;
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
`;

const DetailText = styled(motion.div)`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.base};
  color: ${theme.colors.text.primary};
  line-height: 1.8;
  text-align: left;
  margin-bottom: ${theme.spacing[6]};
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[6]};
  justify-content: center;
`;

const Tag = styled.span<{ category: 'emotion' | 'setting' | 'palette' }>`
  padding: ${theme.spacing[1]} ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.weights.medium};
  background: ${({ category }) => {
    switch (category) {
      case 'emotion':
        return theme.colors.mystical.purple;
      case 'setting':
        return theme.colors.mystical.teal;
      case 'palette':
        return theme.colors.mystical.amber;
      default:
        return theme.colors.primary[500];
    }
  }};
  color: white;
  opacity: 0.9;
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

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.lg};
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[2]} ${theme.spacing[6]};
    font-size: ${theme.typography.sizes.sm};
  }
`;

const TriviaCard: React.FC<TriviaCardProps> = ({ 
  trivia, 
  onComplete, 
  onShowChoices,
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

  const handleShowChoices = () => {
    if (onShowChoices) {
      onShowChoices();
    }
  };

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

  const allTags = [
    ...trivia.tags.emotion.map(tag => ({ tag, category: 'emotion' as const })),
    ...trivia.tags.setting.map(tag => ({ tag, category: 'setting' as const })),
    ...trivia.tags.palette.map(tag => ({ tag, category: 'palette' as const })),
  ];

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

            <TagsContainer>
              {allTags.map(({ tag, category }, index) => (
                <Tag 
                  key={`${category}-${tag}`} 
                  category={category}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  {tag}
                </Tag>
              ))}
            </TagsContainer>

            <AnimatePresence>
              {showChoicesButton && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ActionButton
                    onClick={onShowChoices ? handleShowChoices : handleComplete}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {onShowChoices ? '次はどちらへ？' : '次の場所へ'}
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