import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';

interface SerenaComfortableContainerProps {
  children: React.ReactNode;
  isVisible?: boolean;
  loadingProgress?: number;
  isImageReady?: boolean;
  isNextImageReady?: boolean;
  onAnimationComplete?: () => void;
  style?: React.CSSProperties;
  loadingTimeBuffer?: number;
}

const ComfortableWrapper = styled(motion.div)`
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

const ProgressIndicator = styled(motion.div)<{ progress: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #4facfe, #00f2fe);
  width: ${props => Math.min(props.progress, 100)}%;
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
`;

const BreathingIndicator = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 172, 254, 0.3) 0%, rgba(79, 172, 254, 0.1) 70%, transparent 100%);
  transform: translate(-50%, -50%);
`;

/**
 * SerenaMCP用の心地よいアニメーションコンテナ
 * UX原則：
 * 1. 予測可能性：動きの方向と速度が一定
 * 2. 自然さ：呼吸のような緩やかなリズム
 * 3. 優雅さ：急激な変化を避ける
 * 4. 視覚的安定性：軸がブレない
 */
const SerenaComfortableContainer: React.FC<SerenaComfortableContainerProps> = ({
  children,
  isVisible = true,
  loadingProgress = 0,
  isImageReady = false,
  isNextImageReady = false,
  onAnimationComplete,
  style = {},
  loadingTimeBuffer = 1500
}) => {
  const [animationPhase, setAnimationPhase] = useState<'sleeping' | 'awakening' | 'breathing' | 'ready'>('sleeping');
  const [showContent, setShowContent] = useState(false);

  // 心地よいアニメーション制御
  useEffect(() => {
    if (!isVisible) {
      setAnimationPhase('sleeping');
      setShowContent(false);
      return;
    }

    console.log('🌸 SerenaComfortableContainer: 心地よいアニメーション開始');

    // フェーズ1: 優雅な覚醒 (800ms)
    setAnimationPhase('awakening');
    
    const awakeTimer = setTimeout(() => {
      setAnimationPhase('breathing');
      console.log('💫 SerenaComfortableContainer: 呼吸フェーズ開始');
      
      // フェーズ2: 穏やかな呼吸 (loadingTimeBuffer)
      const breathTimer = setTimeout(() => {
        setAnimationPhase('ready');
        setShowContent(true);
        console.log('✨ SerenaComfortableContainer: コンテンツ表示準備完了');
        
        onAnimationComplete?.();
      }, loadingTimeBuffer);
      
      return () => clearTimeout(breathTimer);
    }, 800);
    
    return () => clearTimeout(awakeTimer);
  }, [isVisible, loadingTimeBuffer, onAnimationComplete]);

  // 心地よいアニメーション設定
  const getComfortableVariants = () => {
    return {
      sleeping: {
        opacity: 0,
        scale: 0.85,
        y: 30,
        borderRadius: '25px',
        filter: 'blur(10px)',
        background: 'rgba(255, 255, 255, 0.05)'
      },
      awakening: {
        opacity: 0.8,
        scale: 0.95,
        y: 10,
        borderRadius: '22px',
        filter: 'blur(3px)',
        background: 'rgba(255, 255, 255, 0.1)'
      },
      breathing: {
        opacity: 1,
        scale: [0.98, 1.02, 0.98],
        y: [8, 0, 8],
        borderRadius: '20px',
        filter: 'blur(0px)',
        background: [
          'rgba(255, 255, 255, 0.15)',
          'rgba(240, 248, 255, 0.15)',
          'rgba(255, 255, 255, 0.15)'
        ]
      },
      ready: {
        opacity: 1,
        scale: 1,
        y: 0,
        borderRadius: '20px',
        filter: 'blur(0px)',
        background: 'rgba(255, 255, 255, 0.15)'
      }
    };
  };

  const variants = getComfortableVariants();

  // 呼吸アニメーションの設定
  const getBreathingTransition = () => {
    return {
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop" as const
    };
  };

  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isVisible && (
        <ComfortableWrapper
          initial="sleeping"
          animate={animationPhase}
          exit={{
            opacity: 0,
            scale: 0.9,
            y: -20,
            filter: "blur(5px)",
            transition: { duration: 0.6, ease: "easeOut" }
          }}
          variants={variants}
          transition={
            animationPhase === 'breathing' ? getBreathingTransition() : {
              duration: animationPhase === 'awakening' ? 0.8 : 0.6,
              ease: "easeOut"
            }
          }
          style={style}
        >
          {/* 穏やかなプログレス表示 */}
          {loadingProgress > 0 && loadingProgress < 100 && (
            <ProgressIndicator
              progress={loadingProgress}
              initial={{ width: 0, opacity: 0 }}
              animate={{ 
                width: `${Math.min(loadingProgress, 100)}%`,
                opacity: 1
              }}
              transition={{ 
                width: { duration: 0.5, ease: "easeOut" },
                opacity: { duration: 0.3 }
              }}
            />
          )}
          
          {/* 呼吸インジケーター */}
          {animationPhase === 'breathing' && !showContent && (
            <BreathingIndicator
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 3,
                ease: "easeInOut",
                repeat: Infinity
              }}
            />
          )}
          
          {/* 準備中の優雅な表示 */}
          {!showContent && (
            <motion.div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                color: 'white',
                fontSize: '1.2rem',
                textAlign: 'center'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                animate={animationPhase === 'breathing' ? {
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={animationPhase === 'breathing' ? {
                  rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                } : {}}
                style={{ 
                  fontSize: '2.5rem', 
                  marginBottom: '1rem',
                  filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))'
                }}
              >
                {animationPhase === 'sleeping' && '💤'}
                {animationPhase === 'awakening' && '🌅'}
                {animationPhase === 'breathing' && '✨'}
                {animationPhase === 'ready' && '🌸'}
              </motion.div>
              
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ marginBottom: '0.5rem' }}
              >
                {animationPhase === 'sleeping' && '静寂の中で...'}
                {animationPhase === 'awakening' && '穏やかに目覚め...'}
                {animationPhase === 'breathing' && '心地よく準備中...'}
                {animationPhase === 'ready' && '準備完了'}
              </motion.div>
              
              {loadingProgress > 0 && (
                <motion.div
                  style={{ 
                    fontSize: '0.9rem', 
                    opacity: 0.7,
                    marginTop: '0.5rem'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.5 }}
                >
                  {Math.round(loadingProgress)}% 完了
                </motion.div>
              )}
            </motion.div>
          )}
          
          {/* コンテンツの優雅な表示 */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ 
                  opacity: 0, 
                  y: 20,
                  filter: "blur(5px)"
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  filter: "blur(0px)"
                }}
                transition={{ 
                  duration: 1.0,
                  ease: "easeOut"
                }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </ComfortableWrapper>
      )}
    </AnimatePresence>
  );
};

export { SerenaComfortableContainer };
export default SerenaComfortableContainer;