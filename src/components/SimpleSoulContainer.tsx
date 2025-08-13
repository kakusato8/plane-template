import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';

interface SimpleSoulContainerProps {
  children: React.ReactNode;
  isVisible?: boolean;
  onAnimationComplete?: () => void;
  style?: React.CSSProperties;
}

const SoulWrapper = styled(motion.div)`
  position: relative;
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      rgba(255, 255, 255, 0.1) 0%, 
      rgba(255, 255, 255, 0) 50%, 
      rgba(255, 255, 255, 0.1) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

const SimpleSoulContainer: React.FC<SimpleSoulContainerProps> = ({ 
  children, 
  isVisible = true,
  onAnimationComplete,
  style = {}
}) => {
  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isVisible && (
        <SoulWrapper
          initial={{ 
            opacity: 0, 
            scale: 0.8, 
            y: 100,
            filter: "blur(10px)"
          }}
          animate={{ 
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)"
          }}
          exit={{ 
            opacity: 0,
            scale: 0.9,
            y: -50,
            filter: "blur(5px)"
          }}
          transition={{
            duration: 1.2,
            ease: "easeOut"
          }}
          style={style}
        >
          {children}
        </SoulWrapper>
      )}
    </AnimatePresence>
  );
};

export default SimpleSoulContainer;