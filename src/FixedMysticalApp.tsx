import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';

// 修正されたシンプルなコンポーネント群
import SimpleMysticalText from './components/SimpleMysticalText';
import InstantText from './components/InstantText';
import SimpleSoulContainer from './components/SimpleSoulContainer';
import SimpleMysticalBackground from './components/SimpleMysticalBackground';

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

interface UserChoice {
  id: string;
  text: string;
  description: string;
  gradient: string;
}

// スタイルコンポーネント
const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const WelcomeContent = styled.div`
  text-align: center;
  color: white;
  padding: 3rem;
  max-width: 600px;
  margin: 0 auto;
`;

const TriviaContent = styled.div`
  text-align: center;
  color: white;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const ChoicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
  padding: 0 1rem;
`;

const ChoiceCard = styled(motion.div)<{ gradient: string }>`
  background: ${props => props.gradient};
  border-radius: 20px;
  padding: 2rem;
  cursor: pointer;
  text-align: center;
  color: white;
  border: 2px solid rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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

function FixedMysticalApp() {
  const [currentView, setCurrentView] = useState<'welcome' | 'trivia' | 'choices'>('welcome');
  const [triviaData, setTriviaData] = useState<TriviaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTriviaIndex, setCurrentTriviaIndex] = useState(0);
  const [currentChoices, setCurrentChoices] = useState<UserChoice[]>([]);
  const [visitedIds, setVisitedIds] = useState<Set<number>>(new Set());
  const [textKey, setTextKey] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

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
          }
        ];
        setTriviaData(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };

    loadTriviaData();
  }, []);

  // 現在の雑学
  const currentTrivia = triviaData[currentTriviaIndex];

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

  // 画像プリロード処理
  const preloadImage = async (url: string): Promise<void> => {
    if (preloadedImages.has(url) || url.startsWith('data:')) {
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        setPreloadedImages(prev => new Set([...prev, url]));
        console.log('✅ 画像プリロード完了:', url);
        resolve();
      };
      
      img.onerror = (error) => {
        console.warn('❌ 画像プリロード失敗:', url);
        reject(error);
      };
      
      const timeout = setTimeout(() => {
        reject(new Error('画像読み込みタイムアウト'));
      }, 10000);
      
      img.onload = () => {
        clearTimeout(timeout);
        setPreloadedImages(prev => new Set([...prev, url]));
        console.log('✅ 画像プリロード完了:', url);
        resolve();
      };
      
      img.src = url;
    });
  };

  // 画像URL生成
  const getCurrentBackgroundImage = () => {
    if (!currentTrivia) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VyaW9DaXR5IEJhY2tncm91bmQ8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K';
    
    const imageId = generateImageId(currentTrivia.tags);
    return `https://picsum.photos/id/${imageId}/1920/1080`;
  };

  const getNextBackgroundImage = () => {
    if (triviaData.length === 0) return '';
    const nextIndex = (currentTriviaIndex + 1) % triviaData.length;
    const nextTrivia = triviaData[nextIndex];
    if (!nextTrivia) return '';
    
    const imageId = generateImageId(nextTrivia.tags);
    return `https://picsum.photos/id/${imageId}/1920/1080`;
  };

  // 選択肢の生成
  const generateChoices = (): UserChoice[] => {
    const choices: UserChoice[] = [
      {
        id: 'mystical',
        text: '🌙 神秘的な世界へ',
        description: '幻想的な雰囲気に包まれた場所を探索',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      {
        id: 'epic',
        text: '⚡ 壮大な発見を求めて',
        description: 'スケールの大きな驚きの世界へ',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      {
        id: 'serene',
        text: '🕊️ 静寂な知識の庭へ',
        description: '落ち着いた雰囲気で学びを深める',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      },
      {
        id: 'surprise',
        text: '🎲 運命に委ねる',
        description: '完全にランダムな世界への冒険',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
      }
    ];
    return choices;
  };

  // 画像プリロード付きの画面遷移
  const transitionToView = async (newView: typeof currentView) => {
    console.log('🔄 画面遷移開始:', currentView, '->', newView);
    
    // 次の画面で必要な画像をプリロード
    if (newView === 'trivia') {
      const imageUrl = getCurrentBackgroundImage();
      if (!preloadedImages.has(imageUrl)) {
        console.log('📸 画像をプリロード中...', imageUrl);
        setIsImageLoading(true);
        
        try {
          await preloadImage(imageUrl);
          console.log('✅ 画像プリロード完了、画面遷移実行');
        } catch (error) {
          console.warn('⚠️ 画像プリロードに失敗、そのまま遷移:', (error as Error).message);
        } finally {
          setIsImageLoading(false);
        }
      }
    }
    
    setCurrentView(newView);
    setTextKey(prev => prev + 1);
    console.log('🎉 画面遷移完了');
  };

  // 旅の開始
  const handleStartJourney = async () => {
    if (triviaData.length > 0 && !isImageLoading) {
      await transitionToView('trivia');
    }
  };

  // 次へ進む
  const handleNext = async () => {
    if (isImageLoading) return; // 画像読み込み中は無効
    
    const nextIndex = (currentTriviaIndex + 1) % triviaData.length;
    setCurrentTriviaIndex(nextIndex);
    setVisitedIds(prev => new Set([...prev, currentTrivia.id]));
    
    // 次の画像をプリロードしてから表示更新
    const nextTrivia = triviaData[nextIndex];
    if (nextTrivia) {
      const imageUrl = getCurrentBackgroundImage();
      if (!preloadedImages.has(imageUrl)) {
        console.log('📸 次の画像をプリロード中...', imageUrl);
        setIsImageLoading(true);
        
        try {
          await preloadImage(imageUrl);
          console.log('✅ 次の画像プリロード完了');
        } catch (error) {
          console.warn('⚠️ 次の画像プリロード失敗:', (error as Error).message);
        } finally {
          setIsImageLoading(false);
        }
      }
    }
    
    setTextKey(prev => prev + 1);
  };

  // 選択肢表示
  const handleShowChoices = () => {
    const choices = generateChoices();
    setCurrentChoices(choices);
    transitionToView('choices');
  };

  // 選択処理
  const handleChoice = async (choice: UserChoice) => {
    if (isImageLoading) return; // 画像読み込み中は無効
    
    console.log('🎯 ユーザー選択:', choice.text);
    
    // 選択に基づいた次のデータの取得
    let nextIndex;
    if (choice.id === 'surprise') {
      nextIndex = Math.floor(Math.random() * triviaData.length);
    } else {
      nextIndex = (currentTriviaIndex + 1) % triviaData.length;
    }
    
    setCurrentTriviaIndex(nextIndex);
    setVisitedIds(prev => new Set([...prev, currentTrivia.id]));
    await transitionToView('trivia');
  };

  // ローディング状態
  if (isLoading) {
    return (
      <AppContainer>
        <SimpleMysticalBackground
          imageUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VyaW9DaXR5IEJhY2tncm91bmQ8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K"
          alt="Loading background"
        >
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
              <SimpleMysticalText 
                text="CurioCity を読み込み中..." 
                fontSize="1.5rem"
                delay={300}
              />
            </div>
          </div>
        </SimpleMysticalBackground>
      </AppContainer>
    );
  }

  // データがない場合
  if (triviaData.length === 0) {
    return (
      <AppContainer>
        <SimpleMysticalBackground
          imageUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VyaW9DaXR5IEJhY2tncm91bmQ8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K"
          alt="Error background"
        >
          <SimpleSoulContainer isVisible={true}>
            <WelcomeContent>
              <SimpleMysticalText 
                text="❌ 雑学データが読み込めませんでした"
                fontSize="1.5rem"
                color="#ff6b6b"
              />
            </WelcomeContent>
          </SimpleSoulContainer>
        </SimpleMysticalBackground>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <SimpleMysticalBackground
        imageUrl={getCurrentBackgroundImage()}
        nextImageUrl={getNextBackgroundImage()}
        alt={currentTrivia ? `${currentTrivia.title}の背景` : 'CurioCity背景'}
        onTransitionComplete={() => console.log('🌈 背景切り替え完了')}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          padding: '2rem'
        }}>
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
                      delay={50} // 超高速表示
                    />
                  </div>
                  <div style={{ margin: '2rem 0' }}>
                    <InstantText 
                      key={`welcome-description-${textKey}`}
                      text="毎回異なる場所に降り立ち、その地に隠された雑学を発見しましょう。あなたの知的好奇心が新しい世界への扉を開きます。"
                      fontSize="1.2rem"
                      delay={100} // 瞬時表示
                    />
                  </div>
                  <MysticalButton
                    onClick={handleStartJourney}
                    disabled={isImageLoading}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ 
                      marginTop: '2rem',
                      opacity: isImageLoading ? 0.6 : 1
                    }}
                  >
                    {isImageLoading ? '🌟 準備中...' : '✨ 旅を始める'}
                  </MysticalButton>
                </WelcomeContent>
              </SimpleSoulContainer>
            )}

            {currentView === 'trivia' && currentTrivia && (
              <SimpleSoulContainer isVisible={true}>
                <TriviaContent>
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
                      delay={80} // 瞬時表示
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <MysticalButton
                      onClick={handleNext}
                      disabled={isImageLoading}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ opacity: isImageLoading ? 0.6 : 1 }}
                    >
                      {isImageLoading ? '📸 準備中...' : 'Next ➤'}
                    </MysticalButton>
                    <MysticalButton
                      onClick={handleShowChoices}
                      disabled={isImageLoading}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        background: 'linear-gradient(45deg, #f093fb, #f5576c)',
                        boxShadow: '0 6px 20px rgba(240, 147, 251, 0.4)',
                        opacity: isImageLoading ? 0.6 : 1
                      }}
                    >
                      🎯 選択する
                    </MysticalButton>
                  </div>
                </TriviaContent>
              </SimpleSoulContainer>
            )}

            {currentView === 'choices' && (
              <SimpleSoulContainer isVisible={true}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <SimpleMysticalText 
                      key={`choices-title-${textKey}`}
                      text="次はどんな場所を訪れますか？"
                      fontSize="2rem"
                      color="#ffd700"
                    />
                  </div>
                  <ChoicesGrid>
                    {currentChoices.map((choice, index) => (
                      <ChoiceCard
                        key={choice.id}
                        gradient={choice.gradient}
                        onClick={() => handleChoice(choice)}
                        whileHover={{ 
                          scale: 1.03, 
                          y: -5,
                        }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          delay: index * 0.2,
                          duration: 0.6,
                        }}
                      >
                        <SimpleMysticalText 
                          text={choice.text}
                          fontSize="1.4rem"
                          delay={index * 20 + 50} // 超高速表示
                        />
                        <div style={{ marginTop: '1rem' }}>
                          <InstantText 
                            text={choice.description}
                            fontSize="1rem"
                            delay={index * 20 + 80} // 瞬時表示
                          />
                        </div>
                      </ChoiceCard>
                    ))}
                  </ChoicesGrid>
                  <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <MysticalButton
                      onClick={() => transitionToView('trivia')}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        background: 'rgba(255,255,255,0.2)',
                        boxShadow: '0 6px 20px rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      ← 戻る
                    </MysticalButton>
                  </div>
                </div>
              </SimpleSoulContainer>
            )}
          </AnimatePresence>
        </div>

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
            <div><strong>✨ FixedMysticalApp</strong></div>
            <div>画面: {currentView}</div>
            <div>雑学: {currentTriviaIndex + 1}/{triviaData.length}</div>
            <div>タイトル: {currentTrivia?.title.substring(0, 20)}...</div>
            <div>訪問済み: {visitedIds.size}件</div>
            <div>選択肢: {currentChoices.length}個</div>
            <div>テキストキー: {textKey}</div>
            <hr style={{ margin: '0.5rem 0', borderColor: 'rgba(255,255,255,0.3)' }}/>
            <div><strong>画像管理</strong></div>
            <div>読み込み中: {isImageLoading ? '✅' : '❌'}</div>
            <div>プリロード済み: {preloadedImages.size}枚</div>
            <div>現在画像: {getCurrentBackgroundImage().substring(0, 30)}...</div>
          </div>
        )}
      </SimpleMysticalBackground>
    </AppContainer>
  );
}

export default FixedMysticalApp;