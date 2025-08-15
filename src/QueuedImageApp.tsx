import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

// コンポーネントのインポート
import SimpleMysticalText from './components/SimpleMysticalText';
import InstantText from './components/InstantText';

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
}

// スタイル定義
const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
`;

const BackgroundContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const BackgroundLayer = styled.div<{ backgroundImageUrl: string; zIndex: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.backgroundImageUrl});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: ${props => props.zIndex};
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

const LoadingSpinner = styled(motion.div)`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
`;

const WelcomeContainer = styled.div`
  text-align: center;
  color: white;
  max-width: 600px;
`;

const TriviaContainer = styled.div`
  background: rgba(0, 0, 0, 0.7);
  border-radius: 20px;
  padding: 2rem;
  max-width: 800px;
  color: white;
  margin: 2rem;
`;

const NextButton = styled(motion.button)`
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  color: white;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 2rem;
  
  &:hover {
    transform: scale(1.05);
  }
`;

function QueuedImageApp() {
  const [currentView, setCurrentView] = useState<'welcome' | 'trivia'>('welcome');
  const [triviaData, setTriviaData] = useState<TriviaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTriviaIndex, setCurrentTriviaIndex] = useState(0);
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState('');

  // 雑学データの読み込み
  useEffect(() => {
    const loadTriviaData = async () => {
      try {
        const response = await fetch('/data/trivia.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: TriviaData[] = await response.json();
        setTriviaData(data);
        
        // ランダムな開始インデックスを設定
        const randomStartIndex = Math.floor(Math.random() * data.length);
        setCurrentTriviaIndex(randomStartIndex);
        
        // 初期背景画像を設定
        const imageId = Math.floor(Math.random() * 100) + 1;
        setCurrentBackgroundUrl(`https://picsum.photos/id/${imageId}/1920/1080`);
        
      } catch (error) {
        console.error('雑学データ読み込み失敗:', error);
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
          }
        ];
        setTriviaData(fallbackData);
        setCurrentBackgroundUrl('https://picsum.photos/1920/1080');
      } finally {
        setIsLoading(false);
      }
    };

    loadTriviaData();
  }, []);

  const currentTrivia = triviaData[currentTriviaIndex];

  const handleStartJourney = () => {
    setCurrentView('trivia');
  };

  const handleNext = () => {
    const nextIndex = (currentTriviaIndex + 1) % triviaData.length;
    setCurrentTriviaIndex(nextIndex);
    
    // 新しい背景画像を生成
    const imageId = Math.floor(Math.random() * 100) + 1;
    setCurrentBackgroundUrl(`https://picsum.photos/id/${imageId}/1920/1080`);
  };

  if (isLoading) {
    return (
      <AppContainer>
        <BackgroundContainer>
          <BackgroundLayer
            backgroundImageUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxOTIwIiBoZWlnaHQ9IjEwODAiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzY2N2VlYSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzc2NGJhMiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjwvc3ZnPg=="
            zIndex={1}
          />
          <ContentContainer>
            <LoadingSpinner
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <div style={{ marginTop: '2rem', color: 'white', fontSize: '1.2rem' }}>
              CurioCity を読み込み中...
            </div>
          </ContentContainer>
        </BackgroundContainer>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <BackgroundContainer>
        <BackgroundLayer
          backgroundImageUrl={currentBackgroundUrl}
          zIndex={1}
        />
      </BackgroundContainer>

      <ContentContainer>
        {currentView === 'welcome' ? (
          <WelcomeContainer>
            <InstantText text="CurioCity" fontSize="4xl" style={{ marginBottom: '1rem', color: 'white' }} />
            <InstantText text="幻想的な都市を旅する雑学の世界" fontSize="xl" style={{ marginBottom: '2rem', color: 'rgba(255,255,255,0.9)' }} />
            <InstantText text="毎回異なる場所に降り立ち、その地に隠された雑学を発見しましょう。あなたの知的好奇心が新しい世界への扉を開きます。" fontSize="lg" style={{ marginBottom: '3rem', color: 'rgba(255,255,255,0.8)' }} />
            <NextButton
              onClick={handleStartJourney}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              旅を始める
            </NextButton>
          </WelcomeContainer>
        ) : (
          currentTrivia && (
            <TriviaContainer>
              <SimpleMysticalText
                text={currentTrivia.title}
                animationType="typewriter"
                fontSize="2xl"
                style={{ marginBottom: '1rem', color: 'white' }}
              />
              <SimpleMysticalText
                text={currentTrivia.short}
                animationType="typewriter"
                fontSize="lg"
                style={{ marginBottom: '1.5rem', color: 'rgba(255,255,255,0.9)' }}
              />
              <SimpleMysticalText
                text={currentTrivia.detail}
                animationType="typewriter"
                fontSize="md"
                style={{ marginBottom: '2rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}
              />
              <NextButton
                onClick={handleNext}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                次の場所へ
              </NextButton>
            </TriviaContainer>
          )
        )}
      </ContentContainer>
    </AppContainer>
  );
}

export default QueuedImageApp;