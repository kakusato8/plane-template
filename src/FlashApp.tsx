import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';

// コンポーネントのインポート
import SimpleMysticalText from './components/SimpleMysticalText';
import InstantText from './components/InstantText';
import SimpleSoulContainer from './components/SimpleSoulContainer';

// 雑学データの型定義
interface TriviaData {
  id: number;
  title: string;
  short: string;
  detail: string;
  tags: {
    emotion: string[];
    setting: string[];
    palette: string[];
  };
  coords?: {
    lat: number;
    lng: number;
  };
  images?: string[];
}

interface ImageCache {
  current: string;
  next: string;
  nextNext: string;
  preloadedUrls: Set<string>;
}

// スタイルコンポーネント
const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const BackgroundContainer = styled(motion.div)<{
  backgroundImageUrl: string;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%), url(${props => props.backgroundImageUrl});
  background-size: cover, cover;
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  background-blend-mode: overlay;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1;
  }
`;

const FlashOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.5) 100%);
  z-index: 50;
  pointer-events: none;
`;

const ContentContainer = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const WelcomeContent = styled.div`
  text-align: center;
  color: white;
  padding: 3rem;
  max-width: 600px;
  margin: 0 auto;
`;

const TriviaContent = styled(motion.div)`
  text-align: center;
  color: white;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const MysticalButton = styled(motion.button)`
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  color: white;
  padding: 1.2rem 2.5rem;
  border: none;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  margin: 1rem;
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
`;

const LoadingSpinner = styled(motion.div)`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #4facfe;
  border-radius: 50%;
`;

function FlashApp() {
  const [currentView, setCurrentView] = useState<'welcome' | 'trivia'>('welcome');
  const [triviaData, setTriviaData] = useState<TriviaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTriviaIndex, setCurrentTriviaIndex] = useState(0);
  const [visitedIds, setVisitedIds] = useState<Set<number>>(new Set());
  const [textKey, setTextKey] = useState(0);
  
  // 画像キャッシュシステム
  const [imageCache, setImageCache] = useState<ImageCache>({
    current: '',
    next: '',
    nextNext: '',
    preloadedUrls: new Set()
  });
  
  // アニメーション状態
  const [isFlashing, setIsFlashing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPreparingNext, setIsPreparingNext] = useState(false);

  // 雑学データの読み込み
  useEffect(() => {
    const loadTriviaData = async () => {
      try {
        console.log('📚 雑学データ読み込み開始');
        const response = await fetch('/data/trivia.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: TriviaData[] = await response.json();
        console.log(`✅ 雑学データ読み込み完了: ${data.length}件`);
        setTriviaData(data);
      } catch (error) {
        console.error('❌ 雑学データ読み込み失敗:', error);
        // フォールバックデータ
        const fallbackData: TriviaData[] = [
          {
            id: 1,
            title: "エッフェル塔は夏と冬で高さが変わる",
            short: "気温により金属が膨張・収縮するため",
            detail: "パリの象徴エッフェル塔は鉄製のため、夏の暑さで金属が膨張し、約15cm高くなる。逆に冬は収縮して低くなる。この現象は多くの金属建造物で起こる自然現象です。",
            tags: {
              emotion: ["ミステリアス", "エピック"],
              setting: ["都市", "建造物"],
              palette: ["ブルー", "グレー"]
            }
          },
          {
            id: 2,
            title: "タコの心臓は3つある",
            short: "効率的に血液を循環させるため",
            detail: "タコには3つの心臓があります。2つは鰓に血液を送る役割、1つは全身に血液を循環させる役割を担っています。この独特な循環系により、高い運動能力を実現しています。",
            tags: {
              emotion: ["驚き", "ミステリアス"],
              setting: ["海", "自然"],
              palette: ["ブルー", "パープル"]
            }
          },
          {
            id: 3,
            title: "蜂蜜は腐らない",
            short: "抗菌性と低水分により永続保存可能",
            detail: "純粋な蜂蜜は腐ることがありません。古代エジプトの遺跡から発見された3000年前の蜂蜜も食べられる状態でした。これは蜂蜜の強い抗菌性と低い水分含有量によるものです。",
            tags: {
              emotion: ["セレーン", "エピック"],
              setting: ["自然", "古代"],
              palette: ["ゴールド", "アンバー"]
            }
          },
          {
            id: 4,
            title: "ペンギンは実は暖かい場所にも住んでいる",
            short: "南極以外にも多くの種類が生息",
            detail: "ペンギンといえば南極のイメージが強いが、実際には18種類のうち南極に住むのは2種類だけ。アフリカやオーストラリア、南米の温暖な海岸にも多くの種類が生息している。",
            tags: {
              emotion: ["ジョイフル", "驚き"],
              setting: ["海辺", "自然"],
              palette: ["ブルー", "ホワイト"]
            }
          }
        ];
        setTriviaData(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };

    loadTriviaData();
  }, []);

  // タグから画像IDを生成
  const generateImageId = (tags: TriviaData['tags']) => {
    const allTags = [...tags.emotion, ...tags.setting, ...tags.palette];
    const combined = allTags.join('-').toLowerCase();
    
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 1000 + 1;
  };

  // 画像URL生成
  const generateImageUrl = (triviaIndex: number) => {
    if (!triviaData[triviaIndex]) return '';
    const imageId = generateImageId(triviaData[triviaIndex].tags);
    return `https://picsum.photos/id/${imageId}/1920/1080`;
  };

  // 画像プリロード処理
  const preloadImage = async (url: string): Promise<void> => {
    if (imageCache.preloadedUrls.has(url) || url.startsWith('data:')) {
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        reject(new Error('画像読み込みタイムアウト'));
      }, 8000);
      
      img.onload = () => {
        clearTimeout(timeout);
        setImageCache(prev => ({
          ...prev,
          preloadedUrls: new Set([...prev.preloadedUrls, url])
        }));
        console.log('✅ 画像プリロード完了:', url.substring(0, 50));
        resolve();
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        console.warn('❌ 画像プリロード失敗:', url.substring(0, 50));
        reject(new Error('画像読み込み失敗'));
      };
      
      img.src = url;
    });
  };

  // 3つの画像キャッシュを初期化/更新
  const updateImageCache = async (startIndex: number) => {
    const currentUrl = generateImageUrl(startIndex);
    const nextUrl = generateImageUrl((startIndex + 1) % triviaData.length);
    const nextNextUrl = generateImageUrl((startIndex + 2) % triviaData.length);

    console.log('🖼️ 画像キャッシュ更新開始:', { current: startIndex, next: (startIndex + 1) % triviaData.length, nextNext: (startIndex + 2) % triviaData.length });

    // 3つの画像を並行してプリロード
    const preloadPromises = [];
    
    if (currentUrl && !imageCache.preloadedUrls.has(currentUrl)) {
      preloadPromises.push(preloadImage(currentUrl));
    }
    if (nextUrl && !imageCache.preloadedUrls.has(nextUrl)) {
      preloadPromises.push(preloadImage(nextUrl));
    }
    if (nextNextUrl && !imageCache.preloadedUrls.has(nextNextUrl)) {
      preloadPromises.push(preloadImage(nextNextUrl));
    }

    try {
      await Promise.allSettled(preloadPromises);
      
      setImageCache(prev => ({
        ...prev,
        current: currentUrl,
        next: nextUrl,
        nextNext: nextNextUrl
      }));
      
      console.log('✅ 3つの画像キャッシュ完了');
    } catch (error) {
      console.warn('⚠️ 画像キャッシュでエラーが発生:', (error as Error).message);
    }
  };

  // 初期画像キャッシュの設定
  useEffect(() => {
    if (triviaData.length > 0 && currentView === 'welcome') {
      console.log('🚀 初期画像キャッシュを開始');
      updateImageCache(0);
    }
  }, [triviaData, currentView]);

  // 現在の雑学
  const currentTrivia = triviaData[currentTriviaIndex];

  // 旅の開始
  const handleStartJourney = async () => {
    if (triviaData.length > 0 && !isTransitioning) {
      console.log('🎬 旅開始 - 画像準備確認');
      
      // 画像が準備できていない場合は少し待機
      if (!imageCache.current) {
        setIsPreparingNext(true);
        await updateImageCache(0);
        setIsPreparingNext(false);
      }
      
      setCurrentView('trivia');
      setTextKey(prev => prev + 1);
    }
  };

  // フラッシュアニメーション付きの次へ進む
  const handleNext = async () => {
    if (isTransitioning || isFlashing) return;
    
    console.log('⚡ Next ボタン押下 - フラッシュアニメーション開始');
    setIsTransitioning(true);
    setIsFlashing(true);

    // フラッシュ開始
    setTimeout(async () => {
      // 次のインデックスに更新
      const nextIndex = (currentTriviaIndex + 1) % triviaData.length;
      setCurrentTriviaIndex(nextIndex);
      setVisitedIds(prev => new Set([...prev, currentTrivia.id]));
      
      // 画像キャッシュをシフト
      setImageCache(prev => ({
        ...prev,
        current: prev.next,
        next: prev.nextNext,
        nextNext: '' // 新しい次の次を準備する
      }));

      // フラッシュ終了
      setTimeout(() => {
        setIsFlashing(false);
        setTextKey(prev => prev + 1);
        
        // テキスト表示後に次の次の画像を準備
        setTimeout(async () => {
          const nextNextIndex = (nextIndex + 2) % triviaData.length;
          const nextNextUrl = generateImageUrl(nextNextIndex);
          
          console.log('🎯 次の次の画像を準備中...');
          try {
            await preloadImage(nextNextUrl);
            setImageCache(prev => ({
              ...prev,
              nextNext: nextNextUrl
            }));
            console.log('✅ 次の次の画像準備完了');
          } catch (error) {
            console.warn('⚠️ 次の次の画像準備失敗:', (error as Error).message);
          }
          
          setIsTransitioning(false);
        }, 500);
      }, 800); // フラッシュ持続時間
    }, 200); // フラッシュ開始遅延
  };

  // ローディング状態
  if (isLoading) {
    return (
      <AppContainer>
        <BackgroundContainer
          backgroundImageUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VyaW9DaXR5IEJhY2tncm91bmQ8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K"
        >
          <ContentContainer>
            <div style={{ textAlign: 'center' }}>
              <LoadingSpinner
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              <div style={{ marginTop: '2rem' }}>
                <InstantText 
                  text="CurioCity を読み込み中..." 
                  fontSize="1.5rem"
                  delay={300}
                />
              </div>
            </div>
          </ContentContainer>
        </BackgroundContainer>
      </AppContainer>
    );
  }

  // データがない場合
  if (triviaData.length === 0) {
    return (
      <AppContainer>
        <BackgroundContainer
          backgroundImageUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VyaW9DaXR5IEJhY2tncm91bmQ8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K"
        >
          <ContentContainer>
            <SimpleSoulContainer isVisible={true}>
              <WelcomeContent>
                <InstantText 
                  text="❌ 雑学データが読み込めませんでした"
                  fontSize="1.5rem"
                  color="#ff6b6b"
                />
              </WelcomeContent>
            </SimpleSoulContainer>
          </ContentContainer>
        </BackgroundContainer>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      {/* 背景画像 */}
      <AnimatePresence mode="wait">
        <BackgroundContainer
          key={currentTriviaIndex}
          backgroundImageUrl={imageCache.current || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VyaW9DaXR5IEJhY2tncm91bmQ8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>

      {/* フラッシュオーバーレイ */}
      <AnimatePresence>
        {isFlashing && (
          <FlashOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* コンテンツ */}
      <ContentContainer>
        <AnimatePresence mode="wait">
          {currentView === 'welcome' && (
            <SimpleSoulContainer isVisible={true}>
              <WelcomeContent>
                <SimpleMysticalText 
                  key={`welcome-title-${textKey}`}
                  text="CurioCity"
                  fontSize="4rem"
                />
                <div style={{ margin: '2rem 0' }}>
                  <SimpleMysticalText 
                    key={`welcome-subtitle-${textKey}`}
                    text="幻想的な都市を旅する雑学の世界"
                    fontSize="1.8rem"
                    delay={50}
                  />
                </div>
                <div style={{ margin: '2rem 0' }}>
                  <InstantText 
                    key={`welcome-description-${textKey}`}
                    text="毎回異なる場所に降り立ち、その地に隠された雑学を発見しましょう。あなたの知的好奇心が新しい世界への扉を開きます。"
                    fontSize="1.2rem"
                    delay={100}
                  />
                </div>
                <MysticalButton
                  onClick={handleStartJourney}
                  disabled={isPreparingNext}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ 
                    marginTop: '2rem',
                    opacity: isPreparingNext ? 0.6 : 1
                  }}
                >
                  {isPreparingNext ? '🌟 準備中...' : '✨ 旅を始める'}
                </MysticalButton>
              </WelcomeContent>
            </SimpleSoulContainer>
          )}

          {currentView === 'trivia' && currentTrivia && (
            <SimpleSoulContainer isVisible={true}>
              <TriviaContent
                key={currentTriviaIndex}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ 
                  duration: 0.8,
                  ease: "easeOut"
                }}
              >
                <div style={{ marginBottom: '2rem' }}>
                  <SimpleMysticalText 
                    key={`trivia-title-${textKey}`}
                    text={currentTrivia.title}
                    fontSize="2.2rem"
                    color="#ffd700"
                  />
                </div>
                <div style={{ marginBottom: '3rem' }}>
                  <InstantText 
                    key={`trivia-detail-${textKey}`}
                    text={currentTrivia.detail}
                    fontSize="1.3rem"
                    delay={80}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <MysticalButton
                    onClick={handleNext}
                    disabled={isTransitioning}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ opacity: isTransitioning ? 0.6 : 1 }}
                  >
                    {isTransitioning ? '⚡ 遷移中...' : 'Next ➤'}
                  </MysticalButton>
                </div>
              </TriviaContent>
            </SimpleSoulContainer>
          )}
        </AnimatePresence>
      </ContentContainer>

      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 100,
          maxWidth: '300px'
        }}>
          <div><strong>⚡ FlashApp</strong></div>
          <div>画面: {currentView}</div>
          <div>雑学: {currentTriviaIndex + 1}/{triviaData.length}</div>
          <div>タイトル: {currentTrivia?.title.substring(0, 20)}...</div>
          <div>訪問済み: {visitedIds.size}件</div>
          <div>フラッシュ中: {isFlashing ? '✅' : '❌'}</div>
          <div>遷移中: {isTransitioning ? '✅' : '❌'}</div>
          <hr style={{ margin: '0.5rem 0', borderColor: 'rgba(255,255,255,0.3)' }}/>
          <div><strong>画像キャッシュ</strong></div>
          <div>現在: {imageCache.current ? '✅' : '❌'}</div>
          <div>次: {imageCache.next ? '✅' : '❌'}</div>
          <div>次の次: {imageCache.nextNext ? '✅' : '❌'}</div>
          <div>総プリロード: {imageCache.preloadedUrls.size}枚</div>
        </div>
      )}
    </AppContainer>
  );
}

export default FlashApp;