import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence } from 'framer-motion';
import BeautifulBackgroundImage from './components/BeautifulBackgroundImage';
import TriviaCard from './components/TriviaCard';
import TextOverlay from './components/TextOverlay';
import NavigationButton from './components/NavigationButton';
import {
  LocationDisplayWrapper,
  MapNavigationWrapper,
  ShareButtonsWrapper,
  preloadComponents
} from './components/LazyComponents';
import { ProgressiveDataLoader } from './utils/progressiveDataLoader';
import { TriviaDisplaySystem } from './utils/triviaDisplaySystem';
import { serenaMCPPreloadManager } from './utils/serenaMCPPreloadManager';
import SerenaMCPDebugPanel from './components/SerenaMCPDebugPanel';
// UserChoiceSystem削除 - Serena MCP
import { useResponsive } from './hooks/useResponsive';
import { PerformanceMonitor } from './utils/performanceMonitor';
import { SimplePreloadManager } from './utils/simplePreloadManager';
// usePreloadedImagesは複雑すぎるため一時的に無効化
import type { TriviaItem, Location } from '../types/trivia';
import { theme } from './styles/theme';

const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
`;

const LoadingContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${theme.colors.gradients.galaxy};
  color: white;
  font-family: ${theme.typography.fonts.secondary};
  font-size: ${theme.typography.sizes['2xl']};
`;

const WelcomeOverlay = styled(TextOverlay)`
  z-index: 15;
`;

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrivia, setCurrentTrivia] = useState<TriviaItem | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [nextTrivia, setNextTrivia] = useState<TriviaItem | null>(null); // 🎯 次の雑学（プリロード用）
  const [nextLocation, setNextLocation] = useState<Location | null>(null); // 🎯 次の地点（プリロード用）
  const [showWelcome, setShowWelcome] = useState(true);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showShareButtons, setShowShareButtons] = useState(false);
  // showChoices, currentChoices削除 - Serena MCP: シンプルなNextボタンのみ
  const [visitedIds, setVisitedIds] = useState<number[]>([]);
  const [visitedLocations, setVisitedLocations] = useState<Location[]>([]);
  const [dataLoader] = useState(() => ProgressiveDataLoader.getInstance());
  const [displaySystem] = useState(() => TriviaDisplaySystem.getInstance());
  // choiceSystem削除 - Serena MCP: 選択システム不要
  const [performanceMonitor] = useState(() => PerformanceMonitor.getInstance());
  const [preloadManager] = useState(() => SimplePreloadManager.getInstance());
  const responsive = useResponsive();

  // データローダーから利用可能な雑学を取得（画像プリロード統計用）
  const [backgroundProgress, setBackgroundProgress] = useState(0);

  // プリローダーシステムは一時的に無効化（複雑すぎるため）
  // const preloadSystem = usePreloadedImages({...});

  // コンポーネントのプリロード（アイドル時間に実行）
  useEffect(() => {
    const preloadTimer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          preloadComponents.preloadAll().catch(console.warn);
        });
      } else {
        // フォールバック
        setTimeout(() => {
          preloadComponents.preloadAll().catch(console.warn);
        }, 2000);
      }
    }, 1000);

    return () => clearTimeout(preloadTimer);
  }, []);

  // パフォーマンス監視の開始
  useEffect(() => {
    performanceMonitor.startMonitoring((report) => {
      // プロダクション環境では分析サービスに送信
      if (process.env.NODE_ENV === 'production') {
        console.log('Performance report:', report);
        // 例: analytics.track('performance', report);
      }
    });

    return () => {
      performanceMonitor.stopMonitoring();
    };
  }, [performanceMonitor]);

  // 即座初期化 - 緊急修正版（エラー処理強化）
  useEffect(() => {
    console.log('⚡ 即座初期化開始 - データ準備状況確認中');
    
    const initializeApp = async () => {
      try {
        // ProgressiveDataLoaderの進行状況を監視
        const unsubscribe = dataLoader.subscribe((loadingState) => {
          setBackgroundProgress(loadingState.backgroundProgress);
          console.log(`📊 バックグラウンド進行: ${loadingState.backgroundProgress}%`);
        });

        // 少し待機してからデータ取得を試行
        await new Promise(resolve => setTimeout(resolve, 100));

        // 最小限データから最初の雑学を取得
        let firstTrivia = dataLoader.getRandomTrivia();
        
        // もしデータがまだ準備されていない場合は少し待つ
        let retryCount = 0;
        while (!firstTrivia && retryCount < 5) {
          console.log(`⏳ データ準備待機中... (試行 ${retryCount + 1}/5)`);
          await new Promise(resolve => setTimeout(resolve, 500));
          firstTrivia = dataLoader.getRandomTrivia();
          retryCount++;
        }
        
        if (firstTrivia) {
          console.log('✅ 初期雑学取得成功:', firstTrivia.title);
          setCurrentTrivia(firstTrivia);
          setVisitedIds([firstTrivia.id]);

          const matchingLocation = dataLoader.selectLocationForTrivia(firstTrivia);
          if (matchingLocation) {
            console.log('✅ 初期地点取得成功:', matchingLocation.name);
            setCurrentLocation(matchingLocation);
            setVisitedLocations([matchingLocation]);

            // 🚫 SerenaMCP: ERR_CONNECTION_REFUSED対策 - 外部API呼び出し無効化
            console.log('🚫 SerenaMCP: 初期画像プリロード無効化（外部接続エラー対策）');
          } else {
            console.warn('⚠️ 地点データが見つかりません - ダミー地点を使用');
            // 緊急フォールバック地点
            const fallbackLocation = {
              id: "fallback",
              name: "未知の場所",
              nameEn: "Unknown Place", 
              type: "fictional" as const,
              weight: 1.0,
              atmosphere: ["ミステリアス", "未知"],
              coords: { lat: 35.6762, lng: 139.6503 },
              description: "データ読み込み中の仮想地点",
              country: "Unknown",
              region: "Virtual",
              timeZone: "UTC"
            };
            setCurrentLocation(fallbackLocation);
            setVisitedLocations([fallbackLocation]);
          }

          console.log('🎉 アプリ初期化完了! 画面表示開始');
          setIsLoading(false);
          
        } else {
          console.error('❌ 全ての試行でデータ取得失敗 - 緊急フォールバックデータ使用');
          
          // 完全フォールバック: ハードコードデータ
          const emergencyTrivia = {
            id: 999,
            title: "CurioCityへようこそ",
            short: "データを読み込み中です",
            detail: "しばらくお待ちください。データが正常に読み込まれます。ページを再読み込みすると最新のデータが表示されます。",
            tags: {
              emotion: ["歓迎"],
              setting: ["システム"],
              palette: ["ブルー"]
            },
            images: []
          };
          
          const emergencyLocation = {
            id: "system",
            name: "システム空間",
            nameEn: "System Space",
            type: "fictional" as const,
            weight: 1.0,
            atmosphere: ["システム", "待機"],
            coords: { lat: 0, lng: 0 },
            description: "データ読み込み中の待機空間",
            country: "Virtual",
            region: "System",
            timeZone: "UTC"
          };
          
          setCurrentTrivia(emergencyTrivia);
          setCurrentLocation(emergencyLocation);
          setVisitedIds([999]);
          setVisitedLocations([emergencyLocation]);
          setIsLoading(false);
        }

        return unsubscribe;
        
      } catch (error) {
        console.error('❌ アプリ初期化で致命的エラー:', error);
        setIsLoading(false); // エラーでも画面は表示
      }
    };

    const cleanup = initializeApp();
    
    return () => {
      cleanup.then(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      }).catch(console.warn);
    };
  }, [dataLoader]);

  const handleStartJourney = () => {
    setShowWelcome(false);
  };

  // handleShowChoices削除 - Serena MCP: 選択システム不要

  // handleUserChoice削除 - Serena MCP: 選択システム不要

  const [isImageLoading, setIsImageLoading] = useState(false); // 🎨 SerenaMCP: 画像読み込み状態管理

  const handleTriviaComplete = async () => {
    console.log('🎨 SerenaMCP: 次の雑学に遷移中（フラッシュ制御システム）...');
    
    // ①「次へ」押下時に必ず明るいフラッシュ状態にする
    console.log('💫 SerenaMCP: 必ず明るいフラッシュ状態を開始');
    setIsImageLoading(true); // 画像読み込み開始フラグ
    
    // 🛡️ STEP 2: フラッシュオーバーレイの裏で次のデータを準備
    const nextTrivia = dataLoader.getRandomTrivia(visitedIds);
    
    if (nextTrivia) {
      console.log('✅ SerenaMCP: 次の雑学取得:', nextTrivia.title);

      // 次の雑学に適した地点を選択
      const matchingLocation = dataLoader.selectLocationForTrivia(nextTrivia);
      if (matchingLocation) {
        console.log('✅ SerenaMCP: 次の地点選択:', matchingLocation.name);
        
        console.log('🚀 SerenaMCP: 雑学と地点準備完了 - 画面遷移実行');
        
        // 🛡️ STEP 3: データが完全に準備できたら状態を一括更新
        // ②雑学は表示させてOK（フラッシュ状態のまま）
        setCurrentTrivia(nextTrivia);
        setVisitedIds(prev => [...prev, nextTrivia.id]);
        setCurrentLocation(matchingLocation);
        setVisitedLocations(prev => [...prev, matchingLocation]);

        // 🎯 バックグラウンドで更に次の雑学を準備（プリロード用）
        setTimeout(async () => {
          const futureTrivia = dataLoader.getRandomTrivia([...visitedIds, nextTrivia.id]);
          if (futureTrivia) {
            const futureLocation = dataLoader.selectLocationForTrivia(futureTrivia);
            if (futureLocation) {
              console.log('🎯 次の雑学準備:', futureTrivia.title, '/', futureLocation.name);
              setNextTrivia(futureTrivia);
              setNextLocation(futureLocation);
            }
          }
        }, 1000); // ユーザーが現在の雑学を読み始めてから準備
      }
    } else {
      console.warn('⚠️ 次の雑学が見つかりません - データ追加を待機');
      setIsImageLoading(false); // エラー時はフラッシュを解除
    }
    
    setShowLocationDetails(false);
    setShowMap(false);
  };

  // 🎨 SerenaMCP: 画像読み込み完了時にフラッシュを解除するコールバック
  const handleImageLoadComplete = () => {
    console.log('🎉 SerenaMCP: 画像読み込み完了 - フラッシュ解除');
    setIsImageLoading(false);
  };

  const handleShowLocationDetails = () => {
    setShowLocationDetails(!showLocationDetails);
    if (showMap) setShowMap(false);
    if (showShareButtons) setShowShareButtons(false);
  };

  const handleShowMap = () => {
    setShowMap(!showMap);
    if (showLocationDetails) setShowLocationDetails(false);
    if (showShareButtons) setShowShareButtons(false);
  };

  const handleShowShare = () => {
    setShowShareButtons(!showShareButtons);
    if (showLocationDetails) setShowLocationDetails(false);
    if (showMap) setShowMap(false);
  };


  if (isLoading) {
    return (
      <LoadingContainer>
        CurioCity を読み込み中...
      </LoadingContainer>
    );
  }

  if (!currentTrivia || !currentLocation) {
    return (
      <LoadingContainer>
        {!currentTrivia ? '雑学データが見つかりません' : '地点データが見つかりません'}
      </LoadingContainer>
    );
  }

  return (
    <AppContainer>
      <AnimatePresence mode="wait">
        <BeautifulBackgroundImage
          key={`${currentTrivia.id}-${currentLocation.id}`}
          alt={`${currentLocation.name} - ${currentTrivia.title}`}
          overlay={true}
          overlayOpacity={currentLocation.type === 'fictional' ? 0.5 : 0.3}
          trivia={currentTrivia}
          location={currentLocation}
          nextTrivia={nextTrivia}
          nextLocation={nextLocation}
          isImageLoading={isImageLoading}
          onImageLoadComplete={handleImageLoadComplete}
        >
          {showWelcome ? (
            <WelcomeOverlay
              title="CurioCity"
              subtitle="幻想的な都市を旅する雑学の世界"
              description="毎回異なる場所に降り立ち、その地に隠された雑学を発見しましょう。あなたの知的好奇心が新しい世界への扉を開きます。"
              position="center"
              align="center"
            >
              <NavigationButton
                variant="mystical"
                size="large"
                onClick={handleStartJourney}
              >
                旅を始める
              </NavigationButton>
            </WelcomeOverlay>
          ) : (
            <>
              {showMap ? (
                <MapNavigationWrapper
                  currentLocation={currentLocation}
                  visitedLocations={visitedLocations}
                  showMiniMap={false}
                />
              ) : showLocationDetails ? (
                <LocationDisplayWrapper
                  location={currentLocation}
                  showDetails={true}
                />
              ) : showShareButtons ? (
                <ShareButtonsWrapper
                  trivia={currentTrivia}
                  location={currentLocation}
                />
              ) : (
                <TriviaCard
                  trivia={currentTrivia}
                  onComplete={handleTriviaComplete}
                />
              )}
              
              {/* 機能切り替えボタン群 */}
              <div style={{
                position: 'absolute',
                top: responsive.isMobile ? '20px' : '30px',
                right: responsive.isMobile ? '20px' : '30px',
                display: 'flex',
                gap: responsive.isMobile ? '8px' : '12px',
                zIndex: 20,
              }}>
                <NavigationButton
                  variant="secondary"
                  size="small"
                  onClick={handleShowMap}
                >
                  {showMap ? '閉じる' : '地図'}
                </NavigationButton>
                
                {!showMap && (
                  <>
                    <NavigationButton
                      variant="secondary" 
                      size="small"
                      onClick={handleShowLocationDetails}
                    >
                      {showLocationDetails ? '雑学' : '地点'}
                    </NavigationButton>
                    
                    <NavigationButton
                      variant="primary"
                      size="small"
                      onClick={handleShowShare}
                    >
                      {showShareButtons ? '閉じる' : '共有'}
                    </NavigationButton>
                  </>
                )}
              </div>
            </>
          )}
        </BeautifulBackgroundImage>
      </AnimatePresence>

      {/* デバッグ情報（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            bottom: 10,
            right: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000,
            maxWidth: '200px'
          }}
        >
          <div>画面: {responsive.width} x {responsive.height}</div>
          <div>デバイス: {responsive.isMobile ? 'Mobile' : responsive.isTablet ? 'Tablet' : 'Desktop'}</div>
          <div>訪問済み雑学: {visitedIds.length}</div>
          <div>現在地: {currentLocation.name}</div>
          <div>地点タイプ: {currentLocation.type}</div>
          <div>関連スコア: {displaySystem.calculateRelevanceScore(currentTrivia, currentLocation)}</div>
          <div>読書時間: {displaySystem.estimateReadingTime(currentTrivia)}秒</div>
          
          {/* プログレッシブローディング情報 */}
          <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '4px' }}>
            <div style={{
              background: `linear-gradient(to right, #4ade80 ${backgroundProgress}%, rgba(255,255,255,0.2) ${backgroundProgress}%)`,
              height: '4px',
              borderRadius: '2px',
              marginBottom: '4px'
            }}></div>
            <div>バックグラウンド: {backgroundProgress}%</div>
            <div>データ統計: {(() => {
              const stats = dataLoader.getStats();
              return `${stats.initialTrivia}+${stats.fullTrivia - stats.initialTrivia}件`;
            })()}</div>
          </div>
          
          {/* プリロードシステム統計 */}
          <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '4px' }}>
            <div>プリロード: 有効✅</div>
            {(() => {
              const stats = preloadManager.getCacheStats();
              return (
                <>
                  <div>キャッシュ済み: {stats.cached}件</div>
                  <div>読み込み中: {stats.loading}件</div>
                  <div>合計: {stats.totalSize}件</div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      
      {/* SerenaMCP デバッグパネル（開発時のみ） */}
      <SerenaMCPDebugPanel />
    </AppContainer>
  );
}

export default App;
