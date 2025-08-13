import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { theme } from '../styles/theme';

interface NavigationButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'mystical';
  size?: 'small' | 'medium' | 'large';
  position?: 'static' | 'fixed';
  x?: number;
  y?: number;
  disabled?: boolean;
  className?: string;
}

const ButtonBase = styled(motion.button)<{
  variant: 'primary' | 'secondary' | 'mystical';
  size: 'small' | 'medium' | 'large';
  position: 'static' | 'fixed';
  x?: number;
  y?: number;
}>`
  position: ${({ position }) => position};
  ${({ position, x, y }) =>
    position === 'fixed' && x !== undefined && y !== undefined
      ? `top: ${y}px; left: ${x}px;`
      : ''}
  
  border: none;
  border-radius: ${({ size }) => {
    switch (size) {
      case 'small':
        return theme.borderRadius.lg;
      case 'large':
        return theme.borderRadius['2xl'];
      default:
        return theme.borderRadius.xl;
    }
  }};
  
  padding: ${({ size }) => {
    switch (size) {
      case 'small':
        return `${theme.spacing[2]} ${theme.spacing[4]}`;
      case 'large':
        return `${theme.spacing[4]} ${theme.spacing[10]}`;
      default:
        return `${theme.spacing[3]} ${theme.spacing[6]}`;
    }
  }};
  
  font-family: ${theme.typography.fonts.primary};
  font-size: ${({ size }) => {
    switch (size) {
      case 'small':
        return theme.typography.sizes.sm;
      case 'large':
        return theme.typography.sizes.lg;
      default:
        return theme.typography.sizes.base;
    }
  }};
  font-weight: ${theme.typography.weights.semibold};
  
  color: white;
  cursor: pointer;
  
  background: ${({ variant }) => {
    switch (variant) {
      case 'primary':
        return theme.colors.gradients.ocean;
      case 'secondary':
        return theme.colors.gradients.sunset;
      case 'mystical':
        return theme.colors.gradients.mystical;
      default:
        return theme.colors.gradients.mystical;
    }
  }};
  
  box-shadow: ${({ size }) => {
    switch (size) {
      case 'small':
        return theme.shadows.sm;
      case 'large':
        return theme.shadows.xl;
      default:
        return theme.shadows.md;
    }
  }};
  
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  transition: all ${theme.animations.durations.fast} ${theme.animations.easings.easeOut};
  
  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.02);
    box-shadow: ${({ size }) => {
      switch (size) {
        case 'small':
          return theme.shadows.md;
        case 'large':
          return `${theme.shadows.xl}, ${theme.shadows.mystical}`;
        default:
          return theme.shadows.lg;
      }
    }};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0) scale(1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${({ size }) => {
      switch (size) {
        case 'small':
          return `${theme.spacing[1]} ${theme.spacing[3]}`;
        case 'large':
          return `${theme.spacing[3]} ${theme.spacing[6]}`;
        default:
          return `${theme.spacing[2]} ${theme.spacing[4]}`;
      }
    }};
    
    font-size: ${({ size }) => {
      switch (size) {
        case 'small':
          return theme.typography.sizes.xs;
        case 'large':
          return theme.typography.sizes.base;
        default:
          return theme.typography.sizes.sm;
      }
    }};
  }
`;


const NavigationButton: React.FC<NavigationButtonProps> = ({
  children,
  onClick,
  variant = 'mystical',
  size = 'medium',
  position = 'static',
  x,
  y,
  disabled = false,
  className,
}) => {
  const buttonVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
    },
    hover: {
      scale: 1.05,
    },
    tap: {
      scale: 0.95,
    }
  };

  return (
    <ButtonBase
      className={className}
      variant={variant}
      size={size}
      position={position}
      x={x}
      y={y}
      onClick={onClick}
      disabled={disabled}
      variants={buttonVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
    >
      {children}
    </ButtonBase>
  );
};

export default NavigationButton;