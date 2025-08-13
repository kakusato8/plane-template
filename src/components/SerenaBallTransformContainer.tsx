import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';

interface SerenaBallTransformContainerProps {
  children: React.ReactNode;
  isVisible?: boolean;
  isLoading?: boolean;
  onLoadingComplete?: () => void;
  style?: React.CSSProperties;
}

const TransformWrapper = styled(motion.div)`
  position: relative;
  backdrop-filter: blur(8px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BallsContainer = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Ball = styled(motion.div)<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.color};
  position: absolute;
  box-shadow: 0 0 30px ${props => props.color}bb, 0 0 15px ${props => props.color}dd;
  border: 2px solid rgba(255, 255, 255, 0.3);
  
  /* ボールの立体感を演出 */
  background: radial-gradient(circle at 30% 30%, 
    ${props => props.color}ff, 
    ${props => props.color}cc 50%, 
    ${props => props.color}88 100%);
`;

/**
 * SerenaMCP用のボール変形アニメーションコンテナ
 * テキストボックス → ボール群 → ローディングアニメーション → テキストボックス復元
 * 
 * ユーザーの要求:
 * - テキストがぼやけて表示されるのは不快
 * - テキストボックスがボールの集まりに変わる
 * - ボールがローディングのぐるぐるを表現
 * - ローディング完了とともにまたテキストボックスの形を成す
 */
const SerenaBallTransformContainer: React.FC<SerenaBallTransformContainerProps> = ({
  children,
  isVisible = true,
  isLoading = false,
  onLoadingComplete,
  style = {}
}) => {
  const [transformPhase, setTransformPhase] = useState<'textbox' | 'dissolving' | 'balls' | 'forming' | 'complete'>('textbox');
  const [showContent, setShowContent] = useState(true);  // 初期状態では常にテキストを表示
  
  // 緊急安全フォールバック：一定時間後に強制表示
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!showContent && (transformPhase === 'textbox' || transformPhase === 'complete')) {
        console.log('🛡️ SerenaBallTransform: 5秒安全タイマー - 強制コンテンツ表示');
        setShowContent(true);
      }
    }, 5000);
    
    return () => clearTimeout(safetyTimer);
  }, [showContent, transformPhase]);
  
  // 初期化の確認
  useEffect(() => {
    console.log('🏀 SerenaBallTransform: コンポーネント初期化', { isVisible, isLoading, transformPhase, showContent });
  }, []); // 初期化時のみ実行

  // ボールの配置設定（円形配置で12個のボール）
  const ballCount = 12;
  const radius = 60; // 円の半径
  const ballPositions = Array.from({ length: ballCount }, (_, index) => {
    const angle = (index * 2 * Math.PI) / ballCount;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      color: [
        '#4facfe', '#00f2fe', '#7b68ee', '#ff6b6b', 
        '#51cf66', '#ffd93d', '#ff9500', '#a855f7',
        '#06d6a0', '#f72585', '#4cc9f0', '#7209b7'
      ][index],
      angle: index * 30 // 各ボールの初期角度
    };
  });

  // SerenaMCP安定版ローディング制御
  useEffect(() => {
    console.log('🏀 SerenaBallTransform: 状態変化', { isVisible, isLoading, transformPhase, showContent });
    
    if (!isVisible) {
      if (transformPhase !== 'textbox') {
        console.log('🏠 SerenaBallTransform: 非表示時、通常状態に復帰');
        setTransformPhase('textbox');
        setShowContent(true);
      }
      return;
    }

    if (isLoading && transformPhase === 'textbox') {
      // ローディング開始時のみ変形を実行
      console.log('🏀 SerenaBallTransform: ローディング開始 → ボール変形');
      
      setShowContent(false);
      setTransformPhase('dissolving');
      
      const dissolveTimer = setTimeout(() => {
        setTransformPhase('balls');
        console.log('🌀 SerenaBallTransform: ボールローディング開始');
      }, 400);
      
      return () => clearTimeout(dissolveTimer);
      
    } else if (!isLoading && transformPhase === 'balls') {
      // ローディング完了時のみ復元を実行
      console.log('🔄 SerenaBallTransform: ローディング完了 → テキストボックス復元');
      setTransformPhase('forming');
      
      const formTimer = setTimeout(() => {
        setTransformPhase('complete');
        setShowContent(true);
        console.log('✅ SerenaBallTransform: テキストボックス復元完了');
        onLoadingComplete?.();
        
        // 最終的にtextbox状態に戻す
        const completeTimer = setTimeout(() => {
          setTransformPhase('textbox');
        }, 500);
        
        return () => clearTimeout(completeTimer);
      }, 600);
      
      return () => clearTimeout(formTimer);
    } else if (!isLoading && (transformPhase === 'textbox' || transformPhase === 'complete') && !showContent) {
      // 緊急復旧: 通常状態でコンテンツが非表示の場合
      console.log('🚨 SerenaBallTransform: 緊急復旧 - コンテンツを強制表示');
      setShowContent(true);
    }
    
    // その他の状態変化では何もしない（安定化）
    
  }, [isLoading, isVisible, transformPhase, onLoadingComplete]);

  // 緊急安全フォールバック: 5秒後に強制コンテンツ表示
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!showContent && (transformPhase === 'textbox' || transformPhase === 'complete')) {
        console.log('🚨 SerenaBallTransform: 5秒安全タイマー発動 - コンテンツを強制表示');
        setShowContent(true);
      }
    }, 5000);
    
    return () => clearTimeout(safetyTimer);
  }, [showContent, transformPhase]);

  // テキストボックスのバリアント
  const textboxVariants = {
    textbox: {
      opacity: 1,
      scale: 1,
      borderRadius: '20px',
      background: 'rgba(255, 255, 255, 0.15)',
      filter: 'blur(0px)'
    },
    dissolving: {
      opacity: 0.3,
      scale: 0.9,
      borderRadius: '40px',
      background: 'rgba(255, 255, 255, 0.05)',
      filter: 'blur(0px)'
    },
    forming: {
      opacity: 0.6,
      scale: 0.95,
      borderRadius: '30px',
      background: 'rgba(255, 255, 255, 0.1)',
      filter: 'blur(0px)'
    },
    complete: {
      opacity: 1,
      scale: 1,
      borderRadius: '20px',
      background: 'rgba(255, 255, 255, 0.15)',
      filter: 'blur(0px)'
    }
  };

  // ボールのローディングアニメーション（円形回転）
  const getBallVariants = (index: number) => {
    const baseDelay = index * 0.05; // より短い間隔で出現
    const position = ballPositions[index];
    
    return {
      hidden: {
        scale: 0,
        opacity: 0,
        x: 0,
        y: 0
      },
      visible: {
        scale: [0, 1.3, 1],
        opacity: [0, 1, 0.9],
        x: position.x,
        y: position.y,
        transition: {
          duration: 0.5,
          delay: baseDelay,
          ease: 'easeOut'
        }
      },
      loading: {
        // 円全体を回転させるアニメーション
        x: [
          position.x,
          Math.cos((position.angle + 90) * Math.PI / 180) * radius,
          Math.cos((position.angle + 180) * Math.PI / 180) * radius,
          Math.cos((position.angle + 270) * Math.PI / 180) * radius,
          position.x
        ],
        y: [
          position.y,
          Math.sin((position.angle + 90) * Math.PI / 180) * radius,
          Math.sin((position.angle + 180) * Math.PI / 180) * radius,
          Math.sin((position.angle + 270) * Math.PI / 180) * radius,
          position.y
        ],
        scale: [1, 1.1, 1, 1.1, 1],
        opacity: [0.9, 1, 0.8, 1, 0.9],
        transition: {
          duration: 2, // 2秒で1周
          repeat: Infinity,
          ease: 'linear', // 等速回転
          delay: baseDelay
        }
      },
      dissolving: {
        scale: [1, 0.3, 0],
        opacity: [0.9, 0.5, 0],
        x: [position.x, 0],
        y: [position.y, 0],
        transition: {
          duration: 0.4,
          delay: baseDelay * 0.3,
          ease: 'easeIn'
        }
      }
    };
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <TransformWrapper
          variants={textboxVariants}
          initial="textbox"
          animate={transformPhase === 'balls' ? 'dissolving' : transformPhase}
          transition={{
            duration: transformPhase === 'dissolving' ? 0.4 :
                     transformPhase === 'forming' ? 0.6 : 0.5,
            ease: 'easeInOut'
          }}
          style={style}
        >
          {/* ボール群アニメーション */}
          <AnimatePresence>
            {(transformPhase === 'dissolving' || transformPhase === 'balls') && (
              <BallsContainer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {ballPositions.map((position, index) => (
                  <Ball
                    key={index}
                    color={position.color}
                    variants={getBallVariants(index)}
                    initial="hidden"
                    animate={
                      transformPhase === 'dissolving' ? 'visible' :
                      transformPhase === 'balls' ? 'loading' :
                      'dissolving'
                    }
                  />
                ))}
                
                {/* 中央のローディング表示 */}
                {transformPhase === 'balls' && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      color: '#ffffff',
                      fontSize: '1.2rem',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      // SerenaMCP強化: 最大視認性確保
                      textShadow: `
                        0 0 8px rgba(0, 0, 0, 0.9),
                        0 0 16px rgba(0, 0, 0, 0.7),
                        0 2px 4px rgba(0, 0, 0, 0.8),
                        0 0 24px rgba(255, 255, 255, 0.3)
                      `,
                      filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))',
                      zIndex: 10
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                      opacity: [0, 1, 0.8, 1],
                      scale: [0.5, 1.1, 0.9, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    🌀 準備中...
                  </motion.div>
                )}
              </BallsContainer>
            )}
          </AnimatePresence>
          
          {/* コンテンツの表示（完全確実保証版） */}
          <AnimatePresence>
            {(showContent || transformPhase === 'textbox' || transformPhase === 'complete' || !isLoading) && (
              <motion.div
                style={{ width: '100%', height: '100%' }}
                initial={{ 
                  opacity: 0,
                  scale: 0.9,
                  filter: 'blur(0px)'
                }}
                animate={{ 
                  opacity: 1,
                  scale: 1,
                  filter: 'blur(0px)'
                }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  filter: 'blur(0px)'
                }}
                transition={{ 
                  duration: 0.6,
                  ease: 'easeOut'
                }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </TransformWrapper>
      )}
    </AnimatePresence>
  );
};

export { SerenaBallTransformContainer };
export default SerenaBallTransformContainer;