import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';

interface SerenaAnimatedContainerProps {
  children: React.ReactNode;
  isVisible?: boolean;
  loadingProgress?: number; // 0-100
  isImageReady?: boolean;
  isNextImageReady?: boolean;
  onAnimationComplete?: () => void;
  style?: React.CSSProperties;
  delayBeforeShow?: number; // ローディング時間稼ぎの遅延
}

const AnimatedWrapper = styled(motion.div)`
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

const LoadingIndicator = styled(motion.div)<{ progress: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #4facfe, #00f2fe);
  width: ${props => props.progress}%;
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
`;

/**
 * SerenaMCP画像準備状況に応じて動的にアニメーションするコンテナ
 * ローディング時間を稼ぐために複数段階のアニメーションを実行
 */
const SerenaAnimatedContainer: React.FC<SerenaAnimatedContainerProps> = ({
  children,
  isVisible = true,
  loadingProgress = 0,
  isImageReady = false,
  isNextImageReady = false,
  onAnimationComplete,
  style = {},
  delayBeforeShow = 0
}) => {
  const [animationPhase, setAnimationPhase] = useState<'preparing' | 'morphing' | 'positioning' | 'revealing' | 'ready'>('preparing');
  const [showContent, setShowContent] = useState(false);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // SerenaMCP画像準備状況に応じたアニメーション制御
  useEffect(() => {
    if (!isVisible) {
      setAnimationPhase('preparing');
      setShowContent(false);
      return;
    }

    console.log('🎭 SerenaAnimatedContainer: アニメーション開始', {
      loadingProgress,
      isImageReady,
      isNextImageReady,
      delayBeforeShow
    });

    // フェーズ1: 準備段階（ボックスの形成）
    setAnimationPhase('preparing');
    
    const timer1 = setTimeout(() => {
      setAnimationPhase('morphing');
      console.log('🔄 SerenaAnimatedContainer: 変形フェーズ開始');
      
      // フェーズ2: 変形段階（画像ロード時間稼ぎ）
      const timer2 = setTimeout(() => {
        setAnimationPhase('positioning');
        console.log('📍 SerenaAnimatedContainer: 位置調整フェーズ開始');
        
        // フェーズ3: 位置調整段階
        const timer3 = setTimeout(() => {
          setAnimationPhase('revealing');
          console.log('✨ SerenaAnimatedContainer: 表示フェーズ開始');
          setShowContent(true);
          
          // フェーズ4: コンテンツ表示段階
          const timer4 = setTimeout(() => {
            setAnimationPhase('ready');
            console.log('🎯 SerenaAnimatedContainer: 完了');
            onAnimationComplete?.();
          }, 600);
          
          return () => clearTimeout(timer4);
        }, 800);
        
        return () => clearTimeout(timer3);
      }, 1000 + delayBeforeShow);
      
      return () => clearTimeout(timer2);
    }, 500);
    
    return () => {
      clearTimeout(timer1);
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
      }
    };
  }, [isVisible, loadingProgress, isImageReady, isNextImageReady, delayBeforeShow, onAnimationComplete]);

  // 各アニメーションフェーズの設定
  const getAnimationVariants = () => {
    const baseVariants = {
      preparing: {
        opacity: 0,
        scale: 0.3,
        y: 200,
        x: -100,
        rotate: -15,
        borderRadius: '50%',
        filter: "blur(20px)",
        background: "rgba(255, 100, 100, 0.1)"
      },
      morphing: {
        opacity: 0.7,
        scale: 0.6,
        y: 100,
        x: 50,
        rotate: 10,
        borderRadius: '30px',
        filter: "blur(10px)",
        background: "rgba(100, 255, 100, 0.1)"
      },
      positioning: {
        opacity: 0.9,
        scale: 0.9,
        y: 20,
        x: -20,
        rotate: -5,
        borderRadius: '25px',
        filter: "blur(5px)",
        background: "rgba(100, 100, 255, 0.1)"
      },
      revealing: {
        opacity: 1,
        scale: 1,
        y: 0,
        x: 0,
        rotate: 0,
        borderRadius: '20px',
        filter: "blur(0px)",
        background: "rgba(255, 255, 255, 0.15)"
      },
      ready: {
        opacity: 1,
        scale: 1,
        y: 0,
        x: 0,
        rotate: 0,
        borderRadius: '20px',
        filter: "blur(0px)",
        background: "rgba(255, 255, 255, 0.15)"
      }
    };

    return baseVariants;
  };

  const variants = getAnimationVariants();

  // ローディングプログレスに応じた色変化
  const getProgressColor = () => {
    if (loadingProgress < 30) return 'rgba(255, 100, 100, 0.2)';
    if (loadingProgress < 70) return 'rgba(255, 255, 100, 0.2)';
    return 'rgba(100, 255, 100, 0.2)';
  };

  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isVisible && (
        <AnimatedWrapper
          initial="preparing"
          animate={animationPhase}
          exit={{
            opacity: 0,
            scale: 0.8,
            y: -100,
            rotate: 10,
            filter: "blur(10px)"
          }}
          variants={variants}
          transition={{
            duration: animationPhase === 'preparing' ? 0.5 :
                     animationPhase === 'morphing' ? 1.0 :
                     animationPhase === 'positioning' ? 0.8 :
                     animationPhase === 'revealing' ? 0.6 : 0.3,
            ease: animationPhase === 'preparing' ? "easeOut" :
                  animationPhase === 'morphing' ? "easeInOut" :
                  animationPhase === 'positioning' ? "easeInOut" :
                  "easeOut",
            type: animationPhase === 'morphing' ? "spring" :
                  animationPhase === 'positioning' ? "spring" : "tween",
            stiffness: animationPhase === 'morphing' ? 100 :
                      animationPhase === 'positioning' ? 150 : undefined,
            damping: animationPhase === 'morphing' ? 15 :
                    animationPhase === 'positioning' ? 20 : undefined
          }}
          style={{
            ...style,
            background: getProgressColor()
          }}
        >
          {/* ローディングプログレスバー */}
          {loadingProgress > 0 && loadingProgress < 100 && (
            <LoadingIndicator
              progress={loadingProgress}
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          {/* コンテンツの段階的表示 */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ 
                  opacity: 0, 
                  y: 30,
                  filter: "blur(5px)"
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  filter: "blur(0px)"
                }}
                transition={{ 
                  duration: 0.8,
                  ease: "easeOut",
                  delay: 0.2
                }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 準備中の表示 */}
          {!showContent && (
            <motion.div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                color: 'white',
                fontSize: '1.2rem'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                ⚡
              </motion.div>
              <span style={{ marginLeft: '10px' }}>
                {animationPhase === 'preparing' && '準備中...'}
                {animationPhase === 'morphing' && '形成中...'}
                {animationPhase === 'positioning' && '調整中...'}
                {animationPhase === 'revealing' && '表示中...'}
              </span>
            </motion.div>
          )}
        </AnimatedWrapper>
      )}
    </AnimatePresence>
  );
};

export { SerenaAnimatedContainer };
export default SerenaAnimatedContainer;