import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';

interface SerenaMorphingBoxProps {
  children: React.ReactNode;
  isVisible?: boolean;
  morphingIntensity?: 'low' | 'medium' | 'high' | 'extreme';
  loadingTimeBuffer?: number; // ローディング時間稼ぎのミリ秒
  onRevealContent?: () => void;
  style?: React.CSSProperties;
}

const MorphingWrapper = styled(motion.div)`
  position: relative;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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

const ParticleOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
    rgba(79, 172, 254, 0.3) 0%, 
    rgba(79, 172, 254, 0.1) 30%, 
    transparent 70%);
`;

/**
 * SerenaMCP用の高度なモーフィングボックス
 * 複雑な変形アニメーションでローディング時間を魅力的に演出
 */
const SerenaMorphingBox: React.FC<SerenaMorphingBoxProps> = ({
  children,
  isVisible = true,
  morphingIntensity = 'medium',
  loadingTimeBuffer = 2000,
  onRevealContent,
  style = {}
}) => {
  const [morphPhase, setMorphPhase] = useState<'dormant' | 'awakening' | 'dancing' | 'stabilizing' | 'revealing' | 'stable'>('dormant');
  const [showContent, setShowContent] = useState(false);

  // 心地よいモーフィングパラメータ（穏やかな変化）
  const getMorphingParams = () => {
    const params = {
      low: {
        maxScale: 1.02,
        maxRotate: 1,
        morphDuration: 2000,
        particleIntensity: 0.2
      },
      medium: {
        maxScale: 1.05,
        maxRotate: 2,
        morphDuration: 2500,
        particleIntensity: 0.3
      },
      high: {
        maxScale: 1.08,
        maxRotate: 3,
        morphDuration: 3000,
        particleIntensity: 0.4
      },
      extreme: {
        maxScale: 1.1,
        maxRotate: 5,
        morphDuration: 3500,
        particleIntensity: 0.5
      }
    };
    return params[morphingIntensity];
  };

  const morphParams = getMorphingParams();

  // SerenaMCPローディング時間稼ぎのフェーズ制御
  useEffect(() => {
    if (!isVisible) {
      setMorphPhase('dormant');
      setShowContent(false);
      return;
    }

    console.log(`🌀 SerenaMorphingBox: モーフィング開始 (強度: ${morphingIntensity}, バッファ: ${loadingTimeBuffer}ms)`);

    // フェーズ1: 覚醒 (300ms)
    setMorphPhase('awakening');
    
    const awakeTimer = setTimeout(() => {
      setMorphPhase('dancing');
      console.log('💃 SerenaMorphingBox: ダンシングフェーズ');
      
      // フェーズ2: ダンシング (ローディング時間稼ぎ)
      const danceTimer = setTimeout(() => {
        setMorphPhase('stabilizing');
        console.log('🎯 SerenaMorphingBox: 安定化フェーズ');
        
        // フェーズ3: 安定化 (400ms)
        const stabilizeTimer = setTimeout(() => {
          setMorphPhase('revealing');
          setShowContent(true);
          onRevealContent?.();
          console.log('✨ SerenaMorphingBox: コンテンツ表示');
          
          // フェーズ4: 表示 (600ms)
          const revealTimer = setTimeout(() => {
            setMorphPhase('stable');
            console.log('🏁 SerenaMorphingBox: 完了');
          }, 600);
          
          return () => clearTimeout(revealTimer);
        }, 400);
        
        return () => clearTimeout(stabilizeTimer);
      }, loadingTimeBuffer);
      
      return () => clearTimeout(danceTimer);
    }, 300);
    
    return () => clearTimeout(awakeTimer);
  }, [isVisible, morphingIntensity, loadingTimeBuffer, onRevealContent]);

  // 心地よいアニメーション設定（不規則な動きを排除）
  const getMorphVariants = () => {
    // 最大値を穏やかに制限
    const comfortableParams = {
      maxScale: Math.min(morphParams.maxScale, 1.1),
      maxRotate: Math.min(morphParams.maxRotate, 3),
      maxBlur: 8
    };
    
    return {
      dormant: {
        opacity: 0,
        scale: 0.9,
        rotate: 0,
        borderRadius: '25px',
        background: 'rgba(255, 255, 255, 0.05)',
        filter: 'blur(10px)',
        y: 20
      },
      awakening: {
        opacity: 0.5,
        scale: 0.95,
        rotate: 0,
        borderRadius: '23px',
        background: 'rgba(240, 248, 255, 0.1)',
        filter: 'blur(5px)',
        y: 10
      },
      dancing: {
        opacity: 0.8,
        scale: [0.98, comfortableParams.maxScale, 0.98],
        rotate: [0, comfortableParams.maxRotate, 0, -comfortableParams.maxRotate, 0],
        borderRadius: '21px',
        background: [
          'rgba(255, 255, 255, 0.12)',
          'rgba(240, 248, 255, 0.15)',
          'rgba(248, 240, 255, 0.15)',
          'rgba(240, 248, 255, 0.15)',
          'rgba(255, 255, 255, 0.12)'
        ],
        filter: 'blur(2px)',
        y: [8, 0, 8]
      },
      stabilizing: {
        opacity: 0.95,
        scale: [comfortableParams.maxScale, 1.01, 1],
        rotate: [comfortableParams.maxRotate, 0],
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.15)',
        filter: 'blur(1px)',
        y: [5, 0]
      },
      revealing: {
        opacity: 1,
        scale: 1,
        rotate: 0,
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.15)',
        filter: 'blur(0px)',
        y: 0
      },
      stable: {
        opacity: 1,
        scale: 1,
        rotate: 0,
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.15)',
        filter: 'blur(0px)',
        y: 0
      }
    };
  };

  const variants = getMorphVariants();

  return (
    <AnimatePresence>
      {isVisible && (
        <MorphingWrapper
          initial="dormant"
          animate={morphPhase}
          exit={{
            opacity: 0,
            scale: 0.8,
            rotate: 20,
            filter: 'blur(10px)'
          }}
          variants={variants}
          transition={{
            duration: morphPhase === 'awakening' ? 0.3 :
                     morphPhase === 'dancing' ? morphParams.morphDuration / 1000 :
                     morphPhase === 'stabilizing' ? 0.4 :
                     morphPhase === 'revealing' ? 0.6 : 0.3,
            ease: morphPhase === 'dancing' ? 'easeInOut' : 'easeOut',
            repeat: morphPhase === 'dancing' ? 2 : 0,
            repeatType: morphPhase === 'dancing' ? 'reverse' : undefined
          }}
          style={style}
        >
          {/* パーティクルエフェクト */}
          {morphPhase === 'dancing' && (
            <ParticleOverlay
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: morphParams.particleIntensity,
                background: [
                  'radial-gradient(circle at 20% 20%, rgba(79, 172, 254, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 30%, rgba(255, 100, 150, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 80%, rgba(100, 255, 150, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 30% 70%, rgba(150, 100, 255, 0.3) 0%, transparent 50%)'
                ]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
          )}
          
          {/* ローディング状態の表示 */}
          {!showContent && (
            <motion.div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                color: 'white',
                fontSize: '1.2rem',
                textAlign: 'center'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                animate={{ 
                  rotate: morphPhase === 'dancing' ? 360 : 0,
                  scale: morphPhase === 'dancing' ? [1, 1.5, 1] : 1
                }}
                transition={{ 
                  rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
                }}
                style={{ fontSize: '2rem', marginBottom: '10px' }}
              >
                {morphPhase === 'dormant' && '💤'}
                {morphPhase === 'awakening' && '👁️'}
                {morphPhase === 'dancing' && '🌀'}
                {morphPhase === 'stabilizing' && '🎯'}
                {morphPhase === 'revealing' && '✨'}
              </motion.div>
              <div>
                {morphPhase === 'dormant' && '休眠中...'}
                {morphPhase === 'awakening' && '覚醒中...'}
                {morphPhase === 'dancing' && '心地よく準備中...'}
                {morphPhase === 'stabilizing' && '調律中...'}
                {morphPhase === 'revealing' && '顕現中...'}
              </div>
            </motion.div>
          )}
          
          {/* コンテンツの表示 */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ 
                  opacity: 0, 
                  y: 50,
                  filter: 'blur(10px)'
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  filter: 'blur(0px)'
                }}
                transition={{ 
                  duration: 0.8,
                  ease: 'easeOut'
                }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </MorphingWrapper>
      )}
    </AnimatePresence>
  );
};

export { SerenaMorphingBox };
export default SerenaMorphingBox;