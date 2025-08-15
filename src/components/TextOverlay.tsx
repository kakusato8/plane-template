import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { theme } from '../styles/theme';

interface TextOverlayProps {
  title?: string;
  subtitle?: string;
  description?: string;
  disclaimer?: string; // 免責事項を追加
  position?: 'top' | 'center' | 'bottom';
  align?: 'left' | 'center' | 'right';
  variant?: 'light' | 'dark' | 'translucent';
  children?: React.ReactNode;
  className?: string;
}

const OverlayContainer = styled(motion.div)<{
  position: 'top' | 'center' | 'bottom';
  align: 'left' | 'center' | 'right';
}>`
  position: absolute;
  z-index: 10;
  width: 100%;
  padding: ${theme.spacing[8]} ${theme.spacing[6]};
  
  ${({ position }) => {
    switch (position) {
      case 'top':
        return 'top: 0; transform: translateY(0);';
      case 'bottom':
        return 'bottom: 0; transform: translateY(0);';
      case 'center':
      default:
        return 'top: 50%; transform: translateY(-50%);';
    }
  }}
  
  text-align: ${({ align }) => align};
  
  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[6]} ${theme.spacing[4]};
  }
`;

const ContentBox = styled(motion.div)<{
  variant: 'light' | 'dark' | 'translucent';
  align: 'left' | 'center' | 'right';
}>`
  max-width: 800px;
  margin: ${({ align }) => {
    switch (align) {
      case 'left':
        return '0 auto 0 0';
      case 'right':
        return '0 0 0 auto';
      case 'center':
      default:
        return '0 auto';
    }
  }};
  
  background: ${({ variant }) => {
    switch (variant) {
      case 'light':
        return 'rgba(255, 255, 255, 0.95)';
      case 'dark':
        return 'rgba(0, 0, 0, 0.8)';
      case 'translucent':
      default:
        return 'rgba(255, 255, 255, 0.85)';
    }
  }};
  
  backdrop-filter: blur(20px);
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing[6]} ${theme.spacing[8]};
  box-shadow: ${theme.shadows.xl};
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[4]} ${theme.spacing[6]};
    max-width: 95%;
  }
`;

const Title = styled(motion.h1)<{
  variant: 'light' | 'dark' | 'translucent';
}>`
  font-family: ${theme.typography.fonts.secondary};
  font-size: ${theme.typography.sizes['4xl']};
  font-weight: ${theme.typography.weights.black};
  line-height: 1.2;
  margin-bottom: ${theme.spacing[4]};
  position: relative;
  
  /* メインの文字色（フォールバック・アクセシビリティ対応） */
  color: ${({ variant }) => {
    switch (variant) {
      case 'light':
        return '#1a202c'; // より濃い色でコントラスト強化
      case 'dark':
        return theme.colors.text.light;
      case 'translucent':
      default:
        return '#2d3748'; // やや濃いグレーでコントラスト改善
    }
  }};
  
  /* グラデーション効果（オーバーレイとして適用） */
  &::before {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${theme.colors.gradients.mystical};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    /* グラデーションの不透明度を調整してベースカラーとブレンド */
    opacity: ${({ variant }) => {
      switch (variant) {
        case 'light':
          return '0.7'; // 明るい背景では控えめに
        case 'dark':
          return '0.9'; // 暗い背景では鮮やかに
        case 'translucent':
        default:
          return '0.8'; // バランス良く
      }
    }};
  }
  
  /* 文字の縁取り効果でさらに視認性向上 */
  text-shadow: ${({ variant }) => {
    switch (variant) {
      case 'light':
        return '0 1px 2px rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.1)';
      case 'dark':
        return '0 1px 2px rgba(0, 0, 0, 0.5)';
      case 'translucent':
      default:
        return '0 1px 2px rgba(255, 255, 255, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.05)';
    }
  }};
  
  @media (max-width: ${theme.breakpoints.lg}) {
    font-size: ${theme.typography.sizes['3xl']};
  }
  
  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${theme.typography.sizes['2xl']};
  }
`;

const Subtitle = styled(motion.h2)<{
  variant: 'light' | 'dark' | 'translucent';
}>`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.xl};
  font-weight: ${theme.typography.weights.semibold};
  line-height: 1.4;
  margin-bottom: ${theme.spacing[4]};
  
  color: ${({ variant }) => {
    switch (variant) {
      case 'light':
        return '#4a5568'; // より濃いグレーでコントラスト改善
      case 'dark':
        return theme.colors.text.light;
      case 'translucent':
      default:
        return '#2d3748'; // より濃いグレーでコントラスト改善
    }
  }};
  
  /* 読みやすさを向上させる軽い影 */
  text-shadow: ${({ variant }) => {
    switch (variant) {
      case 'light':
        return '0 1px 2px rgba(255, 255, 255, 0.8)';
      case 'dark':
        return '0 1px 2px rgba(0, 0, 0, 0.3)';
      case 'translucent':
      default:
        return '0 1px 2px rgba(255, 255, 255, 0.5)';
    }
  }};
  
  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${theme.typography.sizes.lg};
  }
`;

const Description = styled(motion.p)<{
  variant: 'light' | 'dark' | 'translucent';
}>`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.base};
  font-weight: ${theme.typography.weights.regular};
  line-height: 1.6;
  margin-bottom: ${theme.spacing[6]};
  
  color: ${({ variant }) => {
    switch (variant) {
      case 'light':
        return '#2d3748'; // より濃いグレーでコントラスト改善
      case 'dark':
        return theme.colors.text.light;
      case 'translucent':
      default:
        return '#1a202c'; // より濃い色でコントラスト改善
    }
  }};
  
  /* 読みやすさを向上させる軽い影 */
  text-shadow: ${({ variant }) => {
    switch (variant) {
      case 'light':
        return '0 1px 1px rgba(255, 255, 255, 0.8)';
      case 'dark':
        return '0 1px 1px rgba(0, 0, 0, 0.3)';
      case 'translucent':
      default:
        return '0 1px 1px rgba(255, 255, 255, 0.5)';
    }
  }};
  
  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${theme.typography.sizes.sm};
  }
`;
const Disclaimer = styled(motion.p)<{
  variant: 'light' | 'dark' | 'translucent';
}>`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.xs};
  font-weight: ${theme.typography.weights.regular};
  line-height: 1.4;
  margin-top: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[2]};
  opacity: 0.8;
  text-align: center;
  
  color: ${({ variant }) => {
    switch (variant) {
      case 'light':
        return '#4a5568'; /* グレー系 */
      case 'dark':
        return '#cbd5e0';
      case 'translucent':
      default:
        return '#2d3748'; /* ダークグレー */
    }
  }};
  
  /* 読みやすさを向上させる軽い影 */
  text-shadow: ${({ variant }) => {
    switch (variant) {
      case 'light':
        return '0 1px 1px rgba(255, 255, 255, 0.9)';
      case 'dark':
        return '0 1px 1px rgba(0, 0, 0, 0.5)';
      case 'translucent':
      default:
        return '0 1px 1px rgba(255, 255, 255, 0.7)';
    }
  }};
  
  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${theme.typography.sizes.xs};
    margin-top: ${theme.spacing[3]};
  }
  
  @media (max-width: ${theme.breakpoints.sm}) {
    font-size: 10px;
    line-height: 1.3;
    margin-top: ${theme.spacing[2]};
  }
`;

const TextOverlay: React.FC<TextOverlayProps> = ({
  title,
  subtitle,
  description,
  disclaimer, // 追加
  position = 'center',
  align = 'center',
  variant = 'translucent',
  children,
  className,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.9,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
    }
  };

  return (
    <OverlayContainer
      className={className}
      position={position}
      align={align}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <ContentBox variant={variant} align={align} variants={itemVariants}>
        {title && (
          <Title 
            variant={variant} 
            variants={itemVariants}
            data-text={title}
          >
            {title}
          </Title>
        )}
        
        {subtitle && (
          <Subtitle 
            variant={variant} 
            variants={itemVariants}
          >
            {subtitle}
          </Subtitle>
        )}
        
        {description && (
          <Description 
            variant={variant} 
            variants={itemVariants}
          >
            {description}
          </Description>
        )}

        {disclaimer && (
          <Disclaimer 
            variant={variant} 
            variants={itemVariants}
          >
            {disclaimer}
          </Disclaimer>
        )}
        
        {children && (
          <motion.div 
            variants={itemVariants}
          >
            {children}
          </motion.div>
        )}
      </ContentBox>
    </OverlayContainer>
  );
};

export default TextOverlay;