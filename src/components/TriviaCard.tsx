import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../styles/theme';
import type { TriviaItem } from '../../types/trivia';

interface TriviaCardProps {
  trivia: TriviaItem;
  onComplete?: () => void;
  className?: string;
}

const CardContainer = styled(motion.div)`
  max-width: 600px;
  width: 90%;
  background: rgba(255, 255, 255, 0.15); /* より透明に */
  backdrop-filter: blur(8px); /* 軽いブラー効果 */
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing[8]};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); /* 軽いシャドウ */
  border: 1px solid rgba(255, 255, 255, 0.3); /* より目立つボーダー */
  position: relative;
  overflow: hidden;
  margin: 0 auto; /* 中央配置 */

  /* スマホ向け：タッチ操作最適化 */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[6]};
    max-width: calc(100% - 60px); /* 左右30pxずつマージン */
    width: calc(100% - 60px);
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.2); /* タブレットで少し濃く */
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
    max-width: calc(100% - 40px); /* 左右20pxずつマージン */
    width: calc(100% - 40px);
    border-radius: ${theme.borderRadius.xl};
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.25); /* スマホで一番濃く */
  }
`;;

const TitleContainer = styled.div`
  margin-bottom: ${theme.spacing[6]};
`;

const Title = styled.h1`
  font-family: ${theme.typography.fonts.secondary};
  font-size: ${theme.typography.sizes['2xl']};
  font-weight: ${theme.typography.weights.bold};
  color: #ffffff; /* 白色テキスト */
  line-height: 1.3;
  text-align: center;
  margin-bottom: ${theme.spacing[4]};
  
  /* 縁取り効果（複数のtext-shadowで強化） */
  text-shadow: 
    -2px -2px 0 #000000,
    2px -2px 0 #000000,
    -2px 2px 0 #000000,
    2px 2px 0 #000000,
    -3px 0 0 #000000,
    3px 0 0 #000000,
    0 -3px 0 #000000,
    0 3px 0 #000000,
    0 0 8px rgba(0, 0, 0, 0.8); /* グロー効果 */

  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${theme.typography.sizes.xl};
    /* モバイルでは縁取りを少し軽く */
    text-shadow: 
      -1px -1px 0 #000000,
      1px -1px 0 #000000,
      -1px 1px 0 #000000,
      1px 1px 0 #000000,
      0 0 6px rgba(0, 0, 0, 0.7);
  }
`

const ShortText = styled(motion.p)`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.lg};
  color: #ffffff; /* 白色テキスト */
  text-align: center;
  line-height: 1.6;
  margin-bottom: ${theme.spacing[6]};
  font-weight: ${theme.typography.weights.medium};
  
  /* 縁取り効果 */
  text-shadow: 
    -1px -1px 0 #000000,
    1px -1px 0 #000000,
    -1px 1px 0 #000000,
    1px 1px 0 #000000,
    0 0 6px rgba(0, 0, 0, 0.8);

  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${theme.typography.sizes.base};
    margin-bottom: ${theme.spacing[4]};
    /* モバイルでは軽い縁取り */
    text-shadow: 
      -1px -1px 0 #000000,
      1px -1px 0 #000000,
      -1px 1px 0 #000000,
      1px 1px 0 #000000,
      0 0 4px rgba(0, 0, 0, 0.6);
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    font-size: ${theme.typography.sizes.sm};
    margin-bottom: ${theme.spacing[3]};
  }
`

const DetailText = styled(motion.div)`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.base};
  color: #ffffff; /* 白色テキスト */
  line-height: 1.8;
  text-align: left;
  margin-bottom: ${theme.spacing[6]};
  font-weight: ${theme.typography.weights.regular};
  
  /* 縁取り効果 */
  text-shadow: 
    -1px -1px 0 #000000,
    1px -1px 0 #000000,
    -1px 1px 0 #000000,
    1px 1px 0 #000000,
    0 0 4px rgba(0, 0, 0, 0.8);

  @media (max-width: ${theme.breakpoints.md}) {
    font-size: ${theme.typography.sizes.sm};
    line-height: 1.7;
    margin-bottom: ${theme.spacing[4]};
    /* モバイルでは軽い縁取り */
    text-shadow: 
      -1px -1px 0 #000000,
      1px -1px 0 #000000,
      -1px 1px 0 #000000,
      1px 1px 0 #000000,
      0 0 3px rgba(0, 0, 0, 0.6);
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    font-size: ${theme.typography.sizes.xs};
    line-height: 1.6;
    margin-bottom: ${theme.spacing[3]};
  }
`


const ActionButton = styled(motion.button)`
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%); /* 半透明グラデーション */
  border: 2px solid rgba(255, 255, 255, 0.5); /* 白い枠線 */
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing[3]} ${theme.spacing[8]};
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.base};
  font-weight: ${theme.typography.weights.semibold};
  color: #ffffff; /* 白色テキスト */
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all ${theme.animations.durations.fast} ease;
  margin: 0 auto;
  display: block;
  backdrop-filter: blur(4px); /* ブラー効果 */

  /* 縁取り効果でボタンテキストを強調 */
  text-shadow: 
    -1px -1px 0 #000000,
    1px -1px 0 #000000,
    -1px 1px 0 #000000,
    1px 1px 0 #000000,
    0 0 4px rgba(0, 0, 0, 0.8);

  /* スマホ向け：タッチ操作最適化 */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  min-height: 44px; /* iOS推奨のタップ領域最小サイズ */
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    background: linear-gradient(135deg, rgba(102, 126, 234, 1) 0%, rgba(118, 75, 162, 1) 100%); /* ホバー時は不透明 */
    border-color: rgba(255, 255, 255, 0.8);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[3]} ${theme.spacing[6]};
    font-size: ${theme.typography.sizes.base};
    min-height: 48px;
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[2]} ${theme.spacing[4]};
    font-size: ${theme.typography.sizes.sm};
    min-height: 44px;
    width: 100%;
    max-width: 200px;
  }
`

const TriviaCard: React.FC<TriviaCardProps> = ({ 
  trivia, 
  onComplete,
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

  // handleShowChoices削除 - Serena MCP: シンプルなNextボタンのみ

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


            <AnimatePresence>
              {showChoicesButton && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ActionButton
                    onClick={handleComplete}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next
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