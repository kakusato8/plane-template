import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';

interface SoulContainerProps {
  children: React.ReactNode;
  animationType?: 'drift' | 'ethereal' | 'phoenix' | 'shimmer' | 'vortex';
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

// 複数の魂のような移動アニメーション定義
const soulAnimations = {
  drift: {
    initial: { 
      opacity: 0, 
      scale: 0.8, 
      y: 100,
      rotateX: 45,
      filter: "blur(10px)"
    },
    animate: { 
      opacity: [0, 0.7, 1],
      scale: [0.8, 1.05, 1],
      y: [100, -20, 0],
      rotateX: [45, -5, 0],
      filter: ["blur(10px)", "blur(2px)", "blur(0px)"]
    },
    exit: { 
      opacity: [1, 0.7, 0],
      scale: [1, 1.1, 0.9],
      y: [0, -30, -100],
      rotateX: [0, 15, 45],
      filter: ["blur(0px)", "blur(5px)", "blur(15px)"]
    },
    floating: {
      y: [0, -15, 0],
      rotateZ: [0, 2, 0],
      scale: [1, 1.02, 1],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut" as any
      }
    }
  },
  
  ethereal: {
    initial: { 
      opacity: 0, 
      scale: 0.5,
      rotateY: 90,
      x: -200,
      filter: "blur(20px) brightness(0.5)"
    },
    animate: { 
      opacity: [0, 0.3, 0.8, 1],
      scale: [0.5, 0.9, 1.1, 1],
      rotateY: [90, 45, -10, 0],
      x: [-200, 50, -10, 0],
      filter: ["blur(20px) brightness(0.5)", "blur(10px) brightness(0.8)", "blur(3px) brightness(1.1)", "blur(0px) brightness(1)"]
    },
    exit: { 
      opacity: [1, 0.5, 0],
      scale: [1, 0.8, 0.3],
      rotateY: [0, -45, -90],
      x: [0, -50, 200],
      filter: ["blur(0px) brightness(1)", "blur(10px) brightness(0.7)", "blur(25px) brightness(0.3)"]
    },
    floating: {
      x: [0, 20, 0],
      rotateY: [0, 5, 0],
      scale: [1, 1.03, 1],
      opacity: [1, 0.9, 1],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut" as any
      }
    }
  },
  
  phoenix: {
    initial: { 
      opacity: 0, 
      scale: 0.3,
      y: 200,
      rotateZ: -45,
      filter: "blur(15px) hue-rotate(0deg)"
    },
    animate: { 
      opacity: [0, 0.6, 1.2, 1],
      scale: [0.3, 1.3, 0.9, 1],
      y: [200, -40, 20, 0],
      rotateZ: [-45, 15, -5, 0],
      filter: ["blur(15px) hue-rotate(0deg)", "blur(8px) hue-rotate(180deg)", "blur(3px) hue-rotate(360deg)", "blur(0px) hue-rotate(0deg)"]
    },
    exit: { 
      opacity: [1, 0.8, 0],
      scale: [1, 1.2, 0.2],
      y: [0, -100, -300],
      rotateZ: [0, 180, 360],
      filter: ["blur(0px) hue-rotate(0deg)", "blur(5px) hue-rotate(180deg)", "blur(20px) hue-rotate(360deg)"]
    },
    floating: {
      y: [0, -25, 0],
      rotateZ: [0, 3, 0],
      filter: ["hue-rotate(0deg)", "hue-rotate(30deg)", "hue-rotate(0deg)"],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut" as any
      }
    }
  },
  
  shimmer: {
    initial: { 
      opacity: 0, 
      scale: 0.9,
      x: -100,
      filter: "blur(8px) saturate(0.5)"
    },
    animate: { 
      opacity: [0, 0.4, 0.9, 1],
      scale: [0.9, 1.05, 0.98, 1],
      x: [-100, 10, -5, 0],
      filter: ["blur(8px) saturate(0.5)", "blur(5px) saturate(1.2)", "blur(2px) saturate(1.5)", "blur(0px) saturate(1)"]
    },
    exit: { 
      opacity: [1, 0.6, 0],
      scale: [1, 1.05, 0.8],
      x: [0, 20, 100],
      filter: ["blur(0px) saturate(1)", "blur(5px) saturate(0.8)", "blur(12px) saturate(0.3)"]
    },
    floating: {
      x: [0, 8, 0],
      scale: [1, 1.01, 1],
      filter: ["saturate(1)", "saturate(1.3)", "saturate(1)"],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut" as any
      }
    }
  },
  
  vortex: {
    initial: { 
      opacity: 0, 
      scale: 2,
      rotateZ: 180,
      filter: "blur(25px) contrast(0.5)"
    },
    animate: { 
      opacity: [0, 0.5, 1],
      scale: [2, 0.8, 1],
      rotateZ: [180, -10, 0],
      filter: ["blur(25px) contrast(0.5)", "blur(10px) contrast(1.2)", "blur(0px) contrast(1)"]
    },
    exit: { 
      opacity: [1, 0.7, 0],
      scale: [1, 0.5, 2.5],
      rotateZ: [0, -90, -180],
      filter: ["blur(0px) contrast(1)", "blur(10px) contrast(0.8)", "blur(30px) contrast(0.3)"]
    },
    floating: {
      rotateZ: [0, -3, 3, 0],
      scale: [1, 1.02, 0.99, 1],
      transition: {
        duration: 7,
        repeat: Infinity,
        ease: "easeInOut" as any
      }
    }
  }
};

const SoulContainer: React.FC<SoulContainerProps> = ({ 
  children, 
  animationType = 'drift',
  isVisible = true,
  onAnimationComplete,
  style = {}
}) => {
  const [currentAnimation, setCurrentAnimation] = useState(animationType);
  const [isFloating, setIsFloating] = useState(false);

  // ランダムアニメーション選択
  useEffect(() => {
    const animations: Array<keyof typeof soulAnimations> = [
      'drift', 'ethereal', 'phoenix', 'shimmer', 'vortex'
    ];
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
    setCurrentAnimation(randomAnimation);
    console.log('👻 魂のアニメーション選択:', randomAnimation);
  }, [isVisible]);

  // 浮遊効果の開始
  useEffect(() => {
    if (isVisible) {
      const floatingTimer = setTimeout(() => {
        setIsFloating(true);
      }, 1500); // アニメーション完了後に浮遊開始
      return () => clearTimeout(floatingTimer);
    } else {
      setIsFloating(false);
    }
  }, [isVisible]);

  const animation = soulAnimations[currentAnimation];

  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isVisible && (
        <SoulWrapper
          key={`soul-${currentAnimation}`}
          initial={animation.initial}
          animate={{
            ...animation.animate,
            ...(isFloating ? animation.floating : {})
          }}
          exit={animation.exit}
          transition={{
            duration: 1.5,
            ease: "easeOut" as any
          }}
          style={style}
        >
          {children}
        </SoulWrapper>
      )}
    </AnimatePresence>
  );
};

export default SoulContainer;