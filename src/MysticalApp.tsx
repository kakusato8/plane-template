import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';

// 新しい幻想的なコンポーネント群
import MysticalText from './components/MysticalText';
import SoulContainer from './components/SoulContainer';
import MysticalBackground from './components/MysticalBackground';
import { useDataPreloader } from './hooks/useDataPreloader';
import { useAnimationPreloader } from './hooks/useAnimationPreloader';

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
  
  &:hover {
    border-color: rgba(255,255,255,0.4);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }
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
  
  &:hover {
    box-shadow: 0 8px 25px rgba(79, 172, 254, 0.6);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
`;

const LoadingSpinner = styled(motion.div)`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #4facfe;
  border-radius: 50%;
`;

function MysticalApp() {
  // 基本状態
  const [currentView, setCurrentView] = useState<'welcome' | 'trivia' | 'choices'>('welcome');
  const [triviaData, setTriviaData] = useState<TriviaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChoices, setCurrentChoices] = useState<UserChoice[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // アニメーション状態
  const [textAnimationKey, setTextAnimationKey] = useState(0);
  const [containerAnimationKey, setContainerAnimationKey] = useState(0);
  
  // データプリローダー
  const dataPreloader = useDataPreloader({
    triviaData,
    queueSize: 3,
    maxRetries: 2,
    preloadDelay: 800
  });

  // アニメーションプリローダー
  const animationPreloader = useAnimationPreloader({
    preloadNext: async () => {
      console.log('🎯 次のデータをプリロード中...');
      return dataPreloader.getNextItem();
    },
    animationDuration: 2000,
    debug: true
  });

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

  // アニメーション付きの画面遷移
  const transitionToView = async (newView: typeof currentView) => {
    if (isTransitioning) return;
    
    console.log('🔄 画面遷移開始:', currentView, '->', newView);
    setIsTransitioning(true);
    
    // アニメーション開始
    animationPreloader.startAnimation(`transition-to-${newView}`);
    
    // アニメーションキーを更新して再レンダー
    setTextAnimationKey(prev => prev + 1);
    setContainerAnimationKey(prev => prev + 1);
    
    // 遷移中の処理
    await new Promise(resolve => setTimeout(resolve, 500));
    setCurrentView(newView);
    
    // アニメーション完了を待つ
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsTransitioning(false);
    
    console.log('✅ 画面遷移完了');
  };

  // 旅の開始
  const handleStartJourney = () => {
    if (dataPreloader.current) {
      transitionToView('trivia');
    }
  };

  // 次へ進む
  const handleNext = async () => {
    // プリロードされたデータがあれば使用
    const preloadedItem = animationPreloader.consumePreloadedData();
    
    if (preloadedItem || dataPreloader.next) {
      if (preloadedItem) {
        console.log('⚡ プリロードデータを使用');
      }
      
      dataPreloader.moveToNext();
      await transitionToView('trivia');
    } else {
      // フォールバック: 手動で次のデータを取得
      console.log('🔄 手動で次のデータを取得');
      dataPreloader.moveToNext();
      await transitionToView('trivia');
    }
  };

  // 選択肢表示
  const handleShowChoices = () => {
    const choices = generateChoices();
    setCurrentChoices(choices);
    transitionToView('choices');
  };

  // 選択処理
  const handleChoice = async (choice: UserChoice) => {
    console.log('🎯 ユーザー選択:', choice.text);
    
    // 選択に基づいた次のデータの取得ロジック
    // (実際のプロダクトでは、選択に応じてデータをフィルタリング)
    
    dataPreloader.moveToNext();
    await transitionToView('trivia');
  };

  // 背景画像の生成
  const getCurrentBackgroundImage = () => {
    if (!dataPreloader.current) return '';
    return dataPreloader.current.imageUrl;
  };

  const getNextBackgroundImage = () => {
    if (!dataPreloader.next) return '';
    return dataPreloader.next.imageUrl;
  };

  // ローディング状態
  if (isLoading) {
    return (
      <AppContainer>
        <MysticalBackground
          imageUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VyaW9DaXR5IEJhY2tncm91bmQ8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K"
          alt="Loading background"
        >
          <LoadingOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
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
              <MysticalText 
                text="CurioCity を読み込み中..." 
                fontSize="1.5rem"
                delay={300}
              />
            </div>
          </LoadingOverlay>
        </MysticalBackground>
      </AppContainer>
    );
  }

  // データがない場合
  if (triviaData.length === 0) {
    return (
      <AppContainer>
        <MysticalBackground
          imageUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VyaW9DaXR5IEJhY2tncm91bmQ8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K"
          alt="Error background"
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <SoulContainer isVisible={true}>
              <WelcomeContent>
                <MysticalText 
                  text="❌ 雑学データが読み込めませんでした"
                  fontSize="1.5rem"
                  color="#ff6b6b"
                />
              </WelcomeContent>
            </SoulContainer>
          </div>
        </MysticalBackground>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <MysticalBackground
        imageUrl={getCurrentBackgroundImage()}
        nextImageUrl={getNextBackgroundImage()}
        alt={dataPreloader.current ? `${dataPreloader.current.trivia.title}の背景` : 'CurioCity背景'}
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
              <SoulContainer 
                key={`welcome-${containerAnimationKey}`}
                isVisible={true}
              >
                <WelcomeContent>
                  <MysticalText 
                    key={`welcome-title-${textAnimationKey}`}
                    text="CurioCity"
                    fontSize="4rem"
                    animationType="sparkle"
                  />
                  <div style={{ margin: '2rem 0' }}>
                    <MysticalText 
                      key={`welcome-subtitle-${textAnimationKey}`}
                      text="幻想的な都市を旅する雑学の世界"
                      fontSize="1.8rem"
                      delay={1000}
                      animationType="ghostly"
                    />
                  </div>
                  <div style={{ margin: '2rem 0' }}>
                    <MysticalText 
                      key={`welcome-description-${textAnimationKey}`}
                      text="毎回異なる場所に降り立ち、その地に隠された雑学を発見しましょう。あなたの知的好奇心が新しい世界への扉を開きます。"
                      fontSize="1.2rem"
                      delay={2500}
                      animationType="flow"
                    />
                  </div>
                  <MysticalButton
                    onClick={handleStartJourney}
                    disabled={!dataPreloader.current}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ marginTop: '2rem' }}
                  >
                    ✨ 旅を始める
                  </MysticalButton>
                </WelcomeContent>
              </SoulContainer>
            )}

            {currentView === 'trivia' && dataPreloader.current && (
              <SoulContainer 
                key={`trivia-${containerAnimationKey}`}
                isVisible={true}
              >
                <TriviaContent>
                  <div style={{ marginBottom: '2rem' }}>
                    <MysticalText 
                      key={`trivia-title-${textAnimationKey}`}
                      text={dataPreloader.current.trivia.title}
                      fontSize="2.2rem"
                      color="#ffd700"
                      animationType="typewriter"
                    />
                  </div>
                  <div style={{ marginBottom: '3rem' }}>
                    <MysticalText 
                      key={`trivia-detail-${textAnimationKey}`}
                      text={dataPreloader.current.trivia.detail}
                      fontSize="1.3rem"
                      delay={1500}
                      animationType="stagger"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <MysticalButton
                      onClick={handleNext}
                      disabled={isTransitioning}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Next ➤
                    </MysticalButton>
                    <MysticalButton
                      onClick={handleShowChoices}
                      disabled={isTransitioning}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        background: 'linear-gradient(45deg, #f093fb, #f5576c)',
                        boxShadow: '0 6px 20px rgba(240, 147, 251, 0.4)'
                      }}
                    >
                      🎯 選択する
                    </MysticalButton>
                  </div>
                </TriviaContent>
              </SoulContainer>
            )}

            {currentView === 'choices' && (
              <SoulContainer 
                key={`choices-${containerAnimationKey}`}
                isVisible={true}
              >
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <MysticalText 
                      key={`choices-title-${textAnimationKey}`}
                      text="次はどんな場所を訪れますか？"
                      fontSize="2rem"
                      color="#ffd700"
                      animationType="ghostly"
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
                          boxShadow: '0 15px 50px rgba(0, 0, 0, 0.4)'
                        }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          delay: index * 0.2,
                          duration: 0.6,
                          ease: "backOut"
                        }}
                      >
                        <MysticalText 
                          text={choice.text}
                          fontSize="1.4rem"
                          animationType="sparkle"
                          delay={index * 200 + 500}
                        />
                        <div style={{ marginTop: '1rem' }}>
                          <MysticalText 
                            text={choice.description}
                            fontSize="1rem"
                            animationType="flow"
                            delay={index * 200 + 1000}
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
              </SoulContainer>
            )}
          </AnimatePresence>
        </div>

        {/* トランジション中のオーバーレイ */}
        <AnimatePresence>
          {isTransitioning && (
            <LoadingOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

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
            maxWidth: '350px',
            maxHeight: '300px',
            overflow: 'auto'
          }}>
            <div><strong>🎭 MysticalApp デバッグ</strong></div>
            <div>画面: {currentView}</div>
            <div>切り替え中: {isTransitioning ? '✅' : '❌'}</div>
            <div>現在データ: {dataPreloader.current ? '✅' : '❌'}</div>
            <div>次データ: {dataPreloader.next ? '✅' : '❌'}</div>
            <div>キュー: {dataPreloader.queue.length}件</div>
            <div>プリロード中: {dataPreloader.isLoading ? '✅' : '❌'}</div>
            <hr style={{ margin: '0.5rem 0', borderColor: 'rgba(255,255,255,0.3)' }}/>
            <div><strong>アニメーション</strong></div>
            <div>進行: {Math.round(animationPreloader.animationState.progress)}%</div>
            <div>フェーズ: {animationPreloader.animationState.phase}</div>
            <div>次準備済み: {animationPreloader.isReadyForNext ? '✅' : '❌'}</div>
            <div>統計: {animationPreloader.stats.successfulPreloads}成功/{animationPreloader.stats.failedPreloads}失敗</div>
            <hr style={{ margin: '0.5rem 0', borderColor: 'rgba(255,255,255,0.3)' }}/>
            <div><strong>データ統計</strong></div>
            <div>訪問済み: {dataPreloader.debug?.visitedCount}件</div>
            <div>キャッシュ: {dataPreloader.debug?.cacheSize}件</div>
            <div>成功: {dataPreloader.stats.preloaded}</div>
            <div>失敗: {dataPreloader.stats.failed}</div>
            <div>ヒット: {dataPreloader.stats.cacheHits}</div>
          </div>
        )}
      </MysticalBackground>
    </AppContainer>
  );
}

export default MysticalApp;