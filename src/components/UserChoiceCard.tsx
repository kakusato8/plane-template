import React from 'react';
import styled from '@emotion/styled';
import { motion, type Variants } from 'framer-motion';
import { theme } from '../styles/theme';
import type { UserChoice } from '../../types/trivia';

interface UserChoiceCardProps {
  choice: UserChoice;
  onSelect: (choice: UserChoice) => void;
  index: number;
  className?: string;
}

const ChoiceContainer = styled(motion.div)`
  position: relative;
  cursor: pointer;
  width: 100%;
  max-width: 280px;
`;

const ChoiceCard = styled(motion.div)<{ index: number }>`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing[6]};
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: ${theme.shadows.xl};
  transition: all ${theme.animations.durations.medium} ${theme.animations.easings.easeOut};
  overflow: hidden;
  
  /* 各選択肢に異なるアクセントカラー */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ index }) => {
      const colors = [
        theme.colors.gradients.mystical,
        theme.colors.gradients.sunset,
        theme.colors.gradients.ocean,
        theme.colors.gradients.forest
      ];
      return colors[index % colors.length];
    }};
  }

  &:hover {
    transform: translateY(-4px) scale(1.02);
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: ${theme.shadows.mystical}, ${theme.shadows['2xl']};
    
    &::before {
      height: 6px;
    }
  }

  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[4]};
    
    &:hover {
      transform: translateY(-2px) scale(1.01);
    }
  }
`;

const ChoiceTitle = styled.h3`
  font-family: ${theme.typography.fonts.secondary};
  font-size: ${theme.typography.sizes.lg};
  font-weight: ${theme.typography.weights.semibold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[3]};
  line-height: 1.3;

  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${theme.typography.sizes.base};
  }
`;

const ChoiceDescription = styled.p`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.sm};
  color: ${theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${theme.spacing[4]};
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[1]};
`;

const Tag = styled.span<{ index: number }>`
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.typography.sizes.xs};
  font-weight: ${theme.typography.weights.medium};
  color: white;
  
  background: ${({ index }) => {
    const colors = [
      theme.colors.mystical.purple,
      theme.colors.mystical.pink,
      theme.colors.mystical.teal,
      theme.colors.mystical.amber
    ];
    return colors[index % colors.length];
  }};
  
  opacity: 0.8;
  transition: opacity ${theme.animations.durations.fast} ease;
  
  ${ChoiceCard}:hover & {
    opacity: 1;
  }
`;

const SelectIcon = styled(motion.div)<{ index: number }>`
  position: absolute;
  top: ${theme.spacing[4]};
  right: ${theme.spacing[4]};
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.typography.sizes.sm};
  color: white;
  
  background: ${({ index }) => {
    const colors = [
      theme.colors.mystical.purple,
      theme.colors.mystical.pink,
      theme.colors.mystical.teal,
      theme.colors.mystical.amber
    ];
    return colors[index % colors.length];
  }};
  
  opacity: 0;
  transform: scale(0.8);
  transition: all ${theme.animations.durations.fast} ease;
  
  ${ChoiceCard}:hover & {
    opacity: 1;
    transform: scale(1);
  }

  @media (max-width: ${theme.breakpoints.md}) {
    top: ${theme.spacing[3]};
    right: ${theme.spacing[3]};
    width: 20px;
    height: 20px;
  }
`;

const UserChoiceCard: React.FC<UserChoiceCardProps> = ({
  choice,
  onSelect,
  index,
  className
}) => {
  const handleClick = () => {
    onSelect(choice);
  };

  const cardVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: index * 0.1,
      }
    },
    hover: {
      scale: 1.02,
      y: -4,
      transition: {
        duration: 0.2
      }
    },
    tap: {
      scale: 0.98,
      y: 0
    }
  };

  const iconVariants = {
    hidden: { 
      scale: 0,
      rotate: -180
    },
    visible: { 
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.3,
        delay: 0.2
      }
    }
  };

  return (
    <ChoiceContainer
      className={className}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
    >
      <ChoiceCard index={index}>
        <ChoiceTitle>{choice.text}</ChoiceTitle>
        <ChoiceDescription>{choice.description}</ChoiceDescription>
        
        <TagsContainer>
          {choice.targetTags.map((tag, tagIndex) => (
            <Tag key={tag} index={tagIndex}>
              {tag}
            </Tag>
          ))}
        </TagsContainer>

        <SelectIcon 
          index={index}
          variants={iconVariants}
          initial="hidden"
          animate="visible"
        >
          →
        </SelectIcon>
      </ChoiceCard>
    </ChoiceContainer>
  );
};

export default UserChoiceCard;