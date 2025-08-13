import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../styles/theme';
import { TriviaDisplaySystem } from '../utils/triviaDisplaySystem';
import { SerenaMCPImageDiagnostics } from '../utils/serenaMCPImageDiagnostics';
import type { TriviaItem, Location } from '../../types/trivia';

interface BackgroundImageProps {
  imageUrl?: string;
  imageUrls?: string[]; // 複数URL対応
  alt: string;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
  className?: string;
  lazy?: boolean;
  priority?: boolean;
  trivia?: TriviaItem;
  location?: Location;
  enablePreloading?: boolean;
  useMultiSource?: boolean; // 新機能フラグ
}

const BackgroundContainer = styled(motion.div)<{
  overlayOpacity: number;
  hasOverlay: boolean;
  backgroundImageUrl?: string;
}>`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  
  /* 段階的背景表示：グラデーション → 画像 */
  background: ${({ backgroundImageUrl }) => 
    backgroundImageUrl 
      ? `${theme.colors.gradients.mystical}, url(${backgroundImageUrl})`
      : theme.colors.gradients.mystical
  };
  background-size: cover, cover;
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  background-blend-mode: overlay;
  
  /* 画像読み込み時のトランジション */
  transition: background 0.8s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ hasOverlay, overlayOpacity }) =>
      hasOverlay ? `rgba(0, 0, 0, ${overlayOpacity})` : 'transparent'};
    z-index: 1;
  }
`;

// const BackgroundImg = styled(motion.img)`
//   position: absolute;
//   top: 0;
//   left: 0;
//   width: 100%;
//   height: 100%;
//   object-fit: cover;
//   object-position: center;
//   z-index: 0;
// `;

const ContentContainer = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const LoadingContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${theme.colors.background.dark};
  z-index: 3;
`;

const LoadingSpinner = styled(motion.div)`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.primary[200]};
  border-top: 3px solid ${theme.colors.primary[500]};
  border-radius: ${theme.borderRadius.full};
`;

// 削除済み：QualityIndicator と ProgressiveOverlay は不要

const BackgroundImage: React.FC<BackgroundImageProps> = ({
  imageUrl,
  imageUrls,
  alt,
  overlay = true,
  overlayOpacity = 0.4,
  children,
  className,
  lazy = false,
  priority = false,
  trivia,
  location,
  enablePreloading = true,
  useMultiSource = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadedImageUrl, setLoadedImageUrl] = useState<string>('');
  const [inView, setInView] = useState(!lazy);
  const [urlsToTry, setUrlsToTry] = useState<string[]>([]);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const triviaDisplaySystem = useRef(TriviaDisplaySystem.getInstance());
  const serenaMCPDiagnostics = useRef(SerenaMCPImageDiagnostics.getInstance());

  console.log('🖼️ SerenaMCP BackgroundImage render:', { 
    imageUrl, 
    imageUrls, 
    useMultiSource,
    trivia: trivia?.title, 
    location: location?.name,
    enableSerenaMCP: useMultiSource && trivia && location
  });

  // 画像URLリストの初期化 - 緊急修正版（エラーハンドリング強化）
  useEffect(() => {
    const initializeUrls = async () => {
      let urls: string[] = [];
      
      try {
        if (useMultiSource && trivia && location) {
          // 新しいマルチソースシステムを使用
          try {
            urls = await triviaDisplaySystem.current.generateBackgroundImageUrls(trivia, location);
            console.log('🎯 マルチソースURL取得:', urls);
          } catch (error) {
            console.warn('⚠️ マルチソースURL生成エラー（フォールバックに切り替え）:', error);
            urls = []; // 空配列にして次の処理に移る
          }
        }
        
        // フォールバック: 従来の単一URL
        if (urls.length === 0) {
          if (imageUrls?.length) {
            urls = [...imageUrls];
            console.log('📷 従来imageUrls使用:', urls.length, '件');
          } else if (imageUrl) {
            urls = [imageUrl];
            console.log('📷 従来imageUrl使用:', imageUrl);
          }
        }
        
        // SerenaMCP堅牢画像ソース生成
        if (urls.length === 0) {
          if (trivia && location) {
            // ハッシュ値を生成
            const atmosphereHash = [...(trivia.tags.emotion || []), ...(trivia.tags.setting || [])].join('').split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0);
            const seed = Math.abs(atmosphereHash % 10000);
            
            // SerenaMCP診断システムで検証済みの堅牢なURLリストを取得
            const robustUrls = serenaMCPDiagnostics.current.generateRobustImageUrls(seed);
            console.log('🛡️ SerenaMCP堅牢画像URL生成:', robustUrls.length, '件');
            
            urls = robustUrls;
          } else {
            // 最終フォールバック: グラデーション背景のみ
            urls = [getFallbackGradient()];
            console.log('🎨 最終グラデーション使用');
          }
        }
        
      } catch (error) {
        console.error('❌ URL初期化で予期しないエラー:', error);
        urls = [getFallbackGradient()];
      }
      
      setUrlsToTry(urls);
      setCurrentUrlIndex(0);
      console.log('📋 最終試行URL一覧:', urls.length, '件');
    };
    
    // エラーハンドリング付きで実行
    initializeUrls().catch(error => {
      console.error('❌ initializeUrls実行エラー:', error);
      setUrlsToTry([getFallbackGradient()]);
      setCurrentUrlIndex(0);
    });
  }, [imageUrl, imageUrls, useMultiSource, trivia, location]);

  // SerenaMCPスマート画像読み込み処理（診断システム統合）
  useEffect(() => {
    let cancelled = false;
    
    const loadImage = async () => {
      if (!inView && lazy) {
        console.log('⏸️ 遅延読み込み: まだビューポートに入っていません');
        return;
      }
      
      if (urlsToTry.length === 0) {
        console.warn('⚠️ 試行する画像URLがありません');
        setHasError(true);
        setIsLoading(false);
        return;
      }
      
      // SerenaMCP: 初回実行時に全URLの診断を実行（バックグラウンド）
      if (currentUrlIndex === 0 && urlsToTry.length > 1) {
        serenaMCPDiagnostics.current.testImageSources(urlsToTry).then(report => {
          console.log('🔍 SerenaMCP診断完了:', report.recommendation);
          if (report.fastestSource && report.fastestSource.url !== urlsToTry[0]) {
            console.log('⚡ SerenaMCP: より高速なソースが発見されました:', report.fastestSource.url);
          }
        }).catch(error => {
          console.warn('⚠️ SerenaMCP診断エラー:', error);
        });
      }
      
      const currentUrl = urlsToTry[currentUrlIndex];
      if (!currentUrl) {
        console.warn('⚠️ 現在の画像URLが無効です');
        setHasError(true);
        setIsLoading(false);
        return;
      }
      
      console.log(`🎬 画像読み込み開始 (${currentUrlIndex + 1}/${urlsToTry.length}):`, currentUrl);
      
      setIsLoading(true);
      setHasError(false);
      
      // 既存の画像参照をクリア
      if (imageRef.current) {
        imageRef.current.onload = null;
        imageRef.current.onerror = null;
      }
      
      // 新しい画像要素を作成
      const img = new Image();
      imageRef.current = img;
      
      // クロスオリジン対応
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log('✅ 画像読み込み成功:', currentUrl);
        if (!cancelled && imageRef.current === img) {
          setLoadedImageUrl(currentUrl);
          setIsLoading(false);
          setHasError(false);
          console.log('🎨 背景画像を適用完了');
        }
      };
      
      img.onerror = (error) => {
        console.warn(`❌ 画像読み込み失敗 (${currentUrlIndex + 1}/${urlsToTry.length}):`, currentUrl, error);
        if (!cancelled && imageRef.current === img) {
          // 次のURLを試す
          if (currentUrlIndex + 1 < urlsToTry.length) {
            console.log('🔄 次の画像ソースを試行中...');
            setCurrentUrlIndex(prev => prev + 1);
          } else {
            console.warn('😵 全ての画像ソース失敗 - 緊急グラデーション適用');
            
            // 即座にグラデーション背景を適用
            const emergencyGradient = getFallbackGradient();
            console.log('🚨 緊急グラデーション:', emergencyGradient);
            setLoadedImageUrl(''); // 画像URLはクリア
            setHasError(true);
            setIsLoading(false);
          }
        }
      };
      
      // タイムアウト設定（5秒に短縮で高速フォールバック）
      const timeoutId = setTimeout(() => {
        if (!cancelled && imageRef.current === img) {
          console.warn(`⏰ 画像読み込みタイムアウト (${currentUrlIndex + 1}/${urlsToTry.length}):`, currentUrl);
          // タイムアウト時も次のURLを試す
          if (currentUrlIndex + 1 < urlsToTry.length) {
            console.log('🔄 タイムアウト後、次の画像ソースを試行...');
            setCurrentUrlIndex(prev => prev + 1);
          } else {
            setHasError(true);
            setIsLoading(false);
            setLoadedImageUrl('');
          }
        }
      }, 5000);
      
      img.src = currentUrl;
      
      return () => {
        clearTimeout(timeoutId);
      };
    };
    
    loadImage();
    
    return () => {
      cancelled = true;
      if (imageRef.current) {
        imageRef.current.onload = null;
        imageRef.current.onerror = null;
      }
    };
  }, [urlsToTry, currentUrlIndex, inView, lazy]);
  
  // 遅延読み込み用のIntersection Observer
  useEffect(() => {
    if (!lazy || inView) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
      }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [lazy, inView]);

  // SerenaMCP美しいフォールバック背景生成
  const getFallbackGradient = () => {
    // CSS gradientを直接返す（SVGではなく）
    if (!trivia) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    // 雑学の感情タグに基づいて美しいグラデーションを生成
    const emotionTag = trivia.tags.emotion?.[0] || 'default';
    const gradientMap: Record<string, string> = {
      'ミステリアス': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'ロマンチック': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'エピック': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'ノスタルジック': 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
      'セレーン': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'ダーク': 'linear-gradient(135deg, #2c3e50 0%, #4a6741 100%)',
      'ジョイフル': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'メランコリック': 'linear-gradient(135deg, #6c7b95 0%, #b2c6ee 100%)',
      '歓迎': 'linear-gradient(135deg, #4ade80 0%, #06b6d4 100%)',
      'default': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    
    return gradientMap[emotionTag] || gradientMap.default;
  };


  // フォールバック画像設定（エラー時の対応）
  const getFallbackImage = () => {
    return getFallbackGradient();
  };

  return (
    <BackgroundContainer
      ref={containerRef}
      className={className}
      hasOverlay={overlay}
      overlayOpacity={overlayOpacity}
      backgroundImageUrl={!hasError && loadedImageUrl ? loadedImageUrl : undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        background: hasError ? getFallbackImage() : undefined
      }}
    >

      <AnimatePresence>
        {isLoading && (
          <LoadingContainer>
            <LoadingSpinner
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            {/* SerenaMCP開発モード詳細表示 */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{
                position: 'absolute',
                bottom: '60px',
                color: 'white',
                fontSize: '12px',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.7)',
                padding: '8px',
                borderRadius: '4px',
                maxWidth: '400px'
              }}>
                🔍 SerenaMCP Loading ({currentUrlIndex + 1}/{urlsToTry.length})<br/>
                URL: {urlsToTry[currentUrlIndex]?.substring(0, 50)}...<br/>
                MultiSource: {useMultiSource ? 'ON ✅' : 'OFF ❌'}<br/>
                Trivia: {trivia?.title?.substring(0, 30) || 'Unknown'}<br/>
                Location: {location?.name || 'Unknown'}<br/>
                SerenaMCP Active: {useMultiSource && trivia && location ? 'YES ✅' : 'NO ❌'}
              </div>
            )}
          </LoadingContainer>
        )}
      </AnimatePresence>

      {/* 開発モードでのデバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 50,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 10
        }}>
          Status: {isLoading ? '🔄' : hasError ? '❌' : loadedImageUrl ? '✅' : '⏸️'}
        </div>
      )}

      {hasError && process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(255,0,0,0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 10,
          maxWidth: '350px'
        }}>
          ❌ SerenaMCP画像診断: 全ソース失敗<br/>
          試行済み: {currentUrlIndex + 1}/{urlsToTry.length}<br/>
          現在URL: {urlsToTry[currentUrlIndex] || 'None'}<br/>
          診断統計: {(() => {
            const stats = serenaMCPDiagnostics.current.getStats();
            return `${stats.totalTests}回テスト済み`;
          })()}<br/>
          フォールバック背景を表示中
        </div>
      )}

      <ContentContainer>{children}</ContentContainer>
    </BackgroundContainer>
  );
};

export default BackgroundImage;