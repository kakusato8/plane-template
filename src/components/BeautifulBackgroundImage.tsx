import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
// import { theme } from '../styles/theme';
import type { TriviaItem, Location } from '../../types/trivia';
import { pexelsImageService } from '../utils/pexelsImageService';

interface BeautifulBackgroundImageProps {
  trivia?: TriviaItem;
  location?: Location;
  nextTrivia?: TriviaItem;  // 🎯 次の雑学データ（プリロード用）
  nextLocation?: Location; // 🎯 次の地点データ（プリロード用）
  children?: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  alt?: string;
  _alt?: string;
  isImageLoading?: boolean; // 🎨 SerenaMCP: 画像読み込み状態（外部から制御）
  onImageLoadComplete?: () => void; // 🎨 SerenaMCP: 画像読み込み完了コールバック
}

const BackgroundContainer = styled(motion.div)<{
  overlayOpacity: number;
  hasOverlay: boolean;
}>`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ hasOverlay, overlayOpacity }) =>
      hasOverlay ? `rgba(0, 0, 0, ${overlayOpacity})` : 'transparent'};
    z-index: 10;
  }
`;

const BackgroundLayer = styled(motion.div)<{
  backgroundUrl: string;
  isVisible: boolean;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ backgroundUrl }) => 
    backgroundUrl.startsWith('linear-gradient') || backgroundUrl.startsWith('radial-gradient')
      ? backgroundUrl  // CSSグラデーションの場合はそのまま適用
      : `url(${backgroundUrl})`  // 画像URLの場合
  };
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: ${({ isVisible }) => isVisible ? 1 : 0};
  transition: opacity 0.3s ease-in-out; // 0.8s → 0.3s 高速化
  z-index: 1;
  pointer-events: none;
`;

const FlashOverlay = styled(motion.div)<{
  isVisible: boolean;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, 
    #ffffff 0%, #f8f9fa 20%, #f0f4f8 40%, #e8d5b7 60%, #d4af37 80%, #ffd700 100%);
  background-size: 300% 300%;
  animation: ${({ isVisible }) => isVisible ? 'gradientShift 2s ease-in-out infinite' : 'none'};
  opacity: ${({ isVisible }) => isVisible ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
  z-index: 15;
  pointer-events: none;
  
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  /* 美しいパルス効果 */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: ${({ isVisible }) => isVisible ? 'pulse 1.5s ease-in-out infinite' : 'none'};
  }
  
  @keyframes pulse {
    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.4; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  }
`;

const ContentContainer = styled.div`
  position: relative;
  z-index: 20;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

// LoadingOverlay削除 - SerenaMCP: シームレスな体験のため

/**
 * 美しい背景画像システム - テキスト問題を排除しつつ実画像を表示
 */
const BeautifulBackgroundImage: React.FC<BeautifulBackgroundImageProps> = ({
  trivia,
  location,
  nextTrivia,    // 🎯 次の雑学
  nextLocation,  // 🎯 次の地点
  children,
  className,
  overlay = true,
  overlayOpacity = 0.4,
  // _alt,
  isImageLoading = false, // 🎨 SerenaMCP: 外部画像読み込み状態
  onImageLoadComplete    // 🎨 SerenaMCP: 読み込み完了コールバック
}) => {
  // ⚡ 即座に美しいCSS背景を生成（ネットワーク不要、0ms表示）
  const getInstantBeautifulBackground = (trivia: TriviaItem, _location: Location): string => {
    const emotion = trivia.tags.emotion[0] || 'ミステリアス';
    // const _setting = trivia.tags.setting[0] || '空';
    
    // 感情とセッティングに基づく美しいグラデーション
    const gradients: Record<string, string> = {
      'ミステリアス': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'ロマンチック': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'エピック': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'ノスタルジック': 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
      'セレーン': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'ダーク': 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      'ジョイフル': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'メランコリック': 'linear-gradient(135deg, #6c7b95 0%, #b2c6ee 100%)'
    };
    
    return gradients[emotion] || gradients['ミステリアス'];
  };

  const [currentImageUrl, setCurrentImageUrl] = useState<string>('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const [preloadedImageUrl, setPreloadedImageUrl] = useState<string>(''); // 🎯 事前読み込み済み画像
  const [_isTransitioning, _setIsTransitioning] = useState(false);
  const [_isPreloading, _setIsPreloading] = useState(false);
  // 🎨 SerenaMCP: フラッシュ状態は外部から制御（isImageLoading）

  // 🔒 SerenaMCPプリロード：完全オフライン（外部API不使用）
  const preloadNextSerenaMCPBackground = async () => {
    if (!nextTrivia || !nextLocation) {
      console.log('🔒 SerenaMCPプリロード：次のデータ未定義、スキップ');
      return;
    }

    console.log('🔒 SerenaMCPプリロード：オフライン背景を事前準備', {
      nextLocation: nextLocation.name,
      nextEmotion: nextTrivia.tags.emotion
    });

    // 即座に完璧なCSS背景を準備（エラー不可能）
    const offlineBackground = getInstantBeautifulBackground(nextTrivia, nextLocation);
    setPreloadedImageUrl(offlineBackground);
    console.log('✅ SerenaMCPプリロード完了：オフライン背景準備済み');
  };

  // 🎯 瞬間切り替え：プリロード済み画像を即座表示
  // const _switchToPreloadedImage = () => {
  //   if (preloadedImageUrl) {
  //     console.log('⚡ 瞬間切り替え：プリロード画像を即座表示');
  //     setCurrentImageUrl(preloadedImageUrl);
  //     setPreloadedImageUrl(''); // 使用済みクリア
  //     return true; // 成功
  //   }
  //   return false; // プリロード未完了
  // };

  // 🎨 SerenaMCP: Pexels API優先の美しい画像表示システム
  const generateAndSetImage = async () => {
    if (!trivia || !location) {
      console.warn('📸 写真取得: trivia または location が未定義');
      if (onImageLoadComplete) onImageLoadComplete(); // エラー時も完了扱い
      return;
    }

    console.log('🎨 SerenaMCP: Pexels API優先画像生成開始');
    _setIsTransitioning(true);

    try {
      // 1. Pexels APIでセマンティック検索を試行
      let imageUrl = '';
      let photoUrls: string[] = [];
      
      if (pexelsImageService.isApiKeyAvailable()) {
        console.log('🧠 Pexels セマンティック検索開始');
        try {
          photoUrls = await pexelsImageService.generateSemanticImageUrls(trivia, location);
          console.log('🎯 Pexels画像取得成功:', photoUrls.length, '個');
        } catch (pexelsError) {
          console.warn('⚠️ Pexels API失敗、Picsumフォールバックに移行:', pexelsError);
        }
      } else {
        console.log('🔑 Pexels API key未設定、Picsumを使用');
      }
      
      // 2. Pexelsで画像が取得できない場合はPicsumフォールバック
      if (photoUrls.length === 0) {
        console.log('🔄 Picsumフォールバック画像生成');
        photoUrls = generatePicsumFallbackUrls(trivia, location);
      }
      
      // 3. 画像読み込み試行
      imageUrl = await loadImageSimple(photoUrls);
      
      // 成功した画像またはフォールバック背景を設定
      setCurrentImageUrl(imageUrl);
      console.log('✅ SerenaMCP: 美しい背景設定完了:', imageUrl.startsWith('linear-gradient') ? 'フォールバック背景' : '外部画像');
      
      // ③画像読み込み完了時にフラッシュを解除
      if (onImageLoadComplete) {
        console.log('🎉 画像読み込み完了コールバック実行');
        onImageLoadComplete();
      }
      
    } catch (error) {
      // 完全失敗時の緊急フォールバック
      console.error('❌ 画像生成完全失敗:', error);
      const fallbackBackground = getInstantBeautifulBackground(trivia, location);
      setCurrentImageUrl(fallbackBackground);
      
      // 🛡️ エラー時も必ずフラッシュ解除（無限ループ防止）
      if (onImageLoadComplete) {
        console.log('🛡️ エラー時も画像読み込み完了扱い');
        onImageLoadComplete();
      }
    } finally {
      _setIsTransitioning(false);
      
      // 🛡️ フラッシュ無限ループ防止：万が一の保険（強化版）
      if (onImageLoadComplete) {
        setTimeout(() => {
          console.log('🛡️ 最終保険のフラッシュ解除（10秒後）');
          onImageLoadComplete();
        }, 10000);
      }
    }
  };

  // 🎨 SerenaMCP: 画像読み込み（Pexels優先、Picsumフォールバック）
  const loadImageSimple = async (urls: string[]): Promise<string> => {
    console.log('🎨 画像読み込み開始:', urls.length, '個のURL');
    
    if (urls.length === 0) {
      console.log('🎨 URL未提供 - フォールバック背景使用');
      if (trivia && location) {
        return getInstantBeautifulBackground(trivia, location);
      }
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    // 画像URLを順次試行（Pexels優先、Picsum後）
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const source = url.includes('pexels.com') ? 'Pexels' : url.includes('picsum.photos') ? 'Picsum' : '外部';
      console.log(`🎨 ${source}画像試行 ${i + 1}/${urls.length}:`, url);
      
      try {
        const img = new Image();
        // CORS問題を回避するためcrossOriginを無効化
        // img.crossOrigin = 'anonymous';
        
        const loadPromise = new Promise<string>((resolve, reject) => {
          img.onload = () => {
            console.log(`✅ ${source}読み込み成功:`, url);
            resolve(url);
          };
          img.onerror = (error) => {
            console.error(`⚠️ ${source}読み込み失敗:`, {
              url: url,
              error: error,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              complete: img.complete
            });
            reject(new Error('Image load failed'));
          };
        });

        img.src = url;
        
        // タイムアウト設定（Pexels APIの場合は長めに）
        const timeout = source === 'Pexels' ? 8000 : 5000;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), timeout);
        });
        
        const loadedUrl = await Promise.race([loadPromise, timeoutPromise]);
        return loadedUrl;

      } catch (error) {
        console.log(`⚠️ ${source}失敗（`, error instanceof Error ? error.message : 'Unknown', '）、次のURLを試行');
        continue;
      }
    }

    // 全て失敗時はフォールバック
    console.log('🎨 全画像URL失敗 - フォールバック背景使用');
    if (trivia && location) {
      return getInstantBeautifulBackground(trivia, location);
    }
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  // 🎨 SerenaMCP: Picsumフォールバック画像URL生成（Pexelsの補完用）
  const generatePicsumFallbackUrls = (targetTrivia?: TriviaItem, targetLocation?: Location): string[] => {
    const useTrivia = targetTrivia || trivia;
    const useLocation = targetLocation || location;
    
    if (!useTrivia || !useLocation) {
      console.warn('🚫 SerenaMCP: triviaまたはlocationが未定義でURL生成できません');
      return [];
    }

    const urls: string[] = [];
    const seed = Math.abs(useTrivia.title.charCodeAt(0) + useLocation.name.charCodeAt(0));

    console.log('🔄 Picsumフォールバック URL生成情報', {
      triviaTitle: useTrivia.title,
      locationName: useLocation.name,
      emotion: useTrivia.tags.emotion,
      setting: useTrivia.tags.setting
    });
    
    // 🎯 SerenaMCP: コンテンツ関連性重視の画像選択システム
    
    // 1. 設定タグ（場所・環境）を最優先で画像選択
    const setting = useTrivia.tags.setting[0] || '空';
    const settingPhotoMap: Record<string, number[]> = {
      // 自然・風景系
      '砂漠': [22, 42, 58, 76, 82], // 砂漠風景
      '海辺': [1, 48, 70, 88, 100], // 海・ビーチ
      '森林': [3, 25, 35, 62, 95], // 森・木々
      '山岳': [15, 30, 65, 85, 120], // 山・岩
      '湖': [5, 49, 72, 94, 108], // 水・湖
      '空': [13, 60, 78, 96, 116], // 空・雲
      
      // 建築・都市系
      '都市夜景': [2, 26, 52, 83, 110], // 都市・建物
      '古代遺跡': [4, 20, 64, 86, 112], // 古い建築
      '近未来都市': [10, 28, 54, 84, 126], // モダン建築
      
      // 特殊環境
      '氷原': [29, 56, 74, 102, 118], // 白・氷
      '路地裏': [24, 50, 75, 92, 124], // 都市・狭い場所
      '架空都市': [6, 32, 68, 98, 130] // ファンタジー
    };
    
    // 2. 感情タグで微調整
    const emotion = useTrivia.tags.emotion[0] || 'ミステリアス';
    const emotionModifier: Record<string, number> = {
      'ミステリアス': 0,
      'ロマンチック': 1,
      'エピック': 2,
      'ノスタルジック': 3,
      'セレーン': 4,
      'ダーク': 0,
      'ジョイフル': 1,
      'メランコリック': 2
    };
    
    // 3. 地点タイプによる調整
    const locationType = useLocation.type || 'real';
    const locationModifier = locationType === 'fictional' ? 2 : 0;
    
    console.log('🎯 Picsumフォールバック: コンテンツマッチング', {
      setting: setting,
      emotion: emotion,
      locationType: locationType,
      locationName: useLocation.name
    });
    
    // 4. 設定に基づく画像ID選択
    const settingPhotos = settingPhotoMap[setting] || settingPhotoMap['空'];
    const emotionOffset = emotionModifier[emotion] || 0;
    const finalOffset = (emotionOffset + locationModifier) % settingPhotos.length;
    
    // メイン画像（設定重視）
    const mainId = settingPhotos[(seed + finalOffset) % settingPhotos.length];
    urls.push(`https://picsum.photos/id/${mainId}/1200/800`);
    
    // サブ画像（設定内バリエーション）
    const subId = settingPhotos[(seed + finalOffset + 1) % settingPhotos.length];
    urls.push(`https://picsum.photos/id/${subId}/1200/800`);
    
    // 感情調整版
    const emotionId = settingPhotos[(seed + finalOffset + 2) % settingPhotos.length];
    urls.push(`https://picsum.photos/id/${emotionId}/1200/800`);
    
    // 効果版（設定に合った効果）
    const effectId = settingPhotos[(seed + finalOffset) % settingPhotos.length];
    if (['ダーク', 'ミステリアス', 'メランコリック'].includes(emotion)) {
      urls.push(`https://picsum.photos/id/${effectId}/1200/800?grayscale`);
    } else {
      urls.push(`https://picsum.photos/id/${effectId}/1200/800?blur=1`);
    }
    
    // フォールバック（汎用美しい画像）
    const fallbackIds = [1, 3, 5, 15, 20, 25, 30, 48];
    const fallbackId = fallbackIds[seed % fallbackIds.length];
    urls.push(`https://picsum.photos/id/${fallbackId}/1200/800`);
    
    console.log('🔄 Picsumフォールバック: 生成されたURLリスト:', urls);
    return urls;
  };


  // トリビアまたは地点変更時に画像更新
  useEffect(() => {
    if (trivia && location) {
      console.log('🛡️ システム的予防：画像読み込み開始:', {
        trivia: trivia.title,
        location: location.name,
        emotion: trivia.tags.emotion
      });
      
      generateAndSetImage();
    }
  }, [trivia?.id, location?.id]);

  // 🎨 SerenaMCP: 初期表示時はフラッシュ制御不要（外部制御のため）
  // 初期表示フラッシュ処理を削除

  // 🔒 SerenaMCPプリロードシステム：次の雑学データが来たらオフライン背景を事前準備
  useEffect(() => {
    if (nextTrivia && nextLocation) {
      console.log('🔒 SerenaMCP：次のデータ受信、オフライン背景プリロード開始');
      preloadNextSerenaMCPBackground();
    }
  }, [nextTrivia?.id, nextLocation?.id]);

  return (
    <BackgroundContainer
      className={className}
      hasOverlay={overlay}
      overlayOpacity={overlayOpacity}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* 🎭 現在の背景画像（前面レイヤー） */}
      {currentImageUrl && (
        <BackgroundLayer
          backgroundUrl={currentImageUrl}
          isVisible={true}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ zIndex: 2 }}
        />
      )}

      {/* 🎯 プリロード済み背景画像（背面レイヤー） */}
      {preloadedImageUrl && (
        <BackgroundLayer
          backgroundUrl={preloadedImageUrl}
          isVisible={true}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ zIndex: 1 }}
        />
      )}

      {/* 🎨 SerenaMCP: 外部制御フラッシュオーバーレイ（画像読み込み中は表示） */}
      <FlashOverlay
        isVisible={isImageLoading || false}
        initial={{ opacity: 0 }}
        animate={{ opacity: isImageLoading ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />

      <ContentContainer>{children}</ContentContainer>
    </BackgroundContainer>
  );
};

export default BeautifulBackgroundImage;