import React, { useState } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { theme } from '../styles/theme';
import { ShareGenerator } from '../utils/shareGenerator';
import type { TriviaItem, Location } from '../../types/trivia';

interface ShareButtonsProps {
  trivia: TriviaItem;
  location: Location;
  backgroundImageUrl?: string;
  className?: string;
}

const ShareContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[4]};
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: ${theme.borderRadius.xl};
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: ${theme.shadows.lg};
  max-width: 300px;

  @media (max-width: ${theme.breakpoints.md}) {
    max-width: 280px;
    padding: ${theme.spacing[3]};
  }
`;

const ShareTitle = styled.h3`
  font-family: ${theme.typography.fonts.secondary};
  font-size: ${theme.typography.sizes.lg};
  font-weight: ${theme.typography.weights.semibold};
  color: ${theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${theme.spacing[2]};
`;

const ShareButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing[2]};
`;

const ShareButton = styled(motion.button)<{ variant: 'twitter' | 'facebook' | 'line' | 'copy' | 'image' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: none;
  border-radius: ${theme.borderRadius.lg};
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.sm};
  font-weight: ${theme.typography.weights.medium};
  cursor: pointer;
  transition: all ${theme.animations.durations.fast} ease;
  
  background: ${({ variant }) => {
    switch (variant) {
      case 'twitter':
        return 'linear-gradient(135deg, #1DA1F2, #1a91da)';
      case 'facebook':
        return 'linear-gradient(135deg, #1877F2, #166fe5)';
      case 'line':
        return 'linear-gradient(135deg, #00C300, #00b300)';
      case 'copy':
        return theme.colors.gradients.sunset;
      case 'image':
        return theme.colors.gradients.mystical;
      default:
        return theme.colors.gradients.mystical;
    }
  }};
  
  color: white;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.md};
  }
  
  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusMessage = styled(motion.div)<{ type: 'success' | 'error' }>`
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.md};
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.sm};
  text-align: center;
  
  background: ${({ type }) => 
    type === 'success' 
      ? 'rgba(34, 197, 94, 0.1)' 
      : 'rgba(239, 68, 68, 0.1)'
  };
  
  color: ${({ type }) => 
    type === 'success' 
      ? theme.colors.success
      : theme.colors.error
  };
  
  border: 1px solid ${({ type }) => 
    type === 'success' 
      ? 'rgba(34, 197, 94, 0.2)' 
      : 'rgba(239, 68, 68, 0.2)'
  };
`;

const ShareButtons: React.FC<ShareButtonsProps> = ({
  trivia,
  location,
  backgroundImageUrl,
  className
}) => {
  const [shareGenerator] = useState(() => ShareGenerator.getInstance());
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'line') => {
    try {
      const shareContent = shareGenerator.generateShareContent(trivia, location);
      let shareUrl = '';

      switch (platform) {
        case 'twitter':
          shareUrl = shareGenerator.generateTwitterShareUrl(shareContent);
          break;
        case 'facebook':
          shareUrl = shareGenerator.generateFacebookShareUrl(shareContent);
          break;
        case 'line':
          shareUrl = shareGenerator.generateLineShareUrl(shareContent);
          break;
      }

      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    } catch (error) {
      console.error('Share failed:', error);
      showStatus('共有に失敗しました', 'error');
    }
  };

  const handleCopy = async () => {
    try {
      const shareContent = shareGenerator.generateShareContent(trivia, location);
      const success = await shareGenerator.copyToClipboard(shareContent);
      
      if (success) {
        showStatus('クリップボードにコピーしました', 'success');
      } else {
        showStatus('コピーに失敗しました', 'error');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      showStatus('コピーに失敗しました', 'error');
    }
  };

  const handleGenerateImage = async () => {
    if (!backgroundImageUrl) {
      showStatus('背景画像が利用できません', 'error');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const imageDataUrl = await shareGenerator.generateShareImage(
        trivia,
        location,
        backgroundImageUrl,
        {
          width: 1200,
          height: 630,
          format: 'jpeg',
          quality: 0.9
        }
      );

      shareGenerator.downloadImage(
        imageDataUrl,
        `curio-city-${trivia.id}-${Date.now()}.jpg`
      );
      
      showStatus('画像をダウンロードしました', 'success');
    } catch (error) {
      console.error('Image generation failed:', error);
      showStatus('画像の生成に失敗しました', 'error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <ShareContainer
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ShareTitle>共有する</ShareTitle>
      
      <ShareButtonGrid>
        <ShareButton
          variant="twitter"
          onClick={() => handleShare('twitter')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>𝕏</span>
          <span>Twitter</span>
        </ShareButton>
        
        <ShareButton
          variant="facebook"
          onClick={() => handleShare('facebook')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>📘</span>
          <span>Facebook</span>
        </ShareButton>
        
        <ShareButton
          variant="line"
          onClick={() => handleShare('line')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>💬</span>
          <span>LINE</span>
        </ShareButton>
        
        <ShareButton
          variant="copy"
          onClick={handleCopy}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>📋</span>
          <span>コピー</span>
        </ShareButton>
      </ShareButtonGrid>

      <ShareButton
        variant="image"
        onClick={handleGenerateImage}
        disabled={isGeneratingImage || !backgroundImageUrl}
        whileHover={{ scale: isGeneratingImage ? 1 : 1.02 }}
        whileTap={{ scale: isGeneratingImage ? 1 : 0.98 }}
        style={{ gridColumn: '1 / -1' }}
      >
        <span>🖼️</span>
        <span>{isGeneratingImage ? '生成中...' : '画像を保存'}</span>
      </ShareButton>

      {statusMessage && (
        <StatusMessage
          type={statusMessage.type}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {statusMessage.text}
        </StatusMessage>
      )}
    </ShareContainer>
  );
};

export default ShareButtons;