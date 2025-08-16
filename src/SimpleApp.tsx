import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';

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

// 安定版CurioCity - 選択システム統合
const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Card = styled(motion.div)`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  max-width: 600px;
  margin: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
`;

const Button = styled(motion.button)`
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin: 1rem 0.5rem;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
  
  &:hover {
    box-shadow: 0 6px 20px rgba(79, 172, 254, 0.6);
  }
`;


function SimpleApp() {
  const [currentView, setCurrentView] = useState<'welcome' | 'trivia'>('welcome');
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [preloadedImages, setPreloadedImages] = useState<{[key: number]: string}>({});
  const [triviaData, setTriviaData] = useState<TriviaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoadingStatus, setImageLoadingStatus] = useState<string>('初期化中');

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
        setIsLoading(false);
      } catch (error) {
        console.error('❌ 雑学データ読み込み失敗:', error);
        // フォールバックデータ
        const fallbackData: TriviaData[] = [
          {
            id: 1,
            title: "エッフェル塔は夏と冬で高さが変わる",
            short: "気温により金属が膨張・収縮するため",
            detail: "パリの象徴エッフェル塔は鉄製のため、夏の暑さで金属が膨張し、約15cm高くなる。逆に冬は収縮して低くなる。",
            tags: {
              emotion: ["エピック", "ミステリアス"],
              setting: ["都市", "建造物"],
              palette: ["ブルー", "パープル"]
            }
          },
          {
            id: 2,
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
        setIsLoading(false);
      }
    };

    loadTriviaData();
  }, []);

  const currentTrivia = triviaData[triviaIndex] || null;

  // タグから画像IDを生成（複数の画像源に対応）
  const generateImageId = (tags: TriviaData['tags']) => {
    const allTags = [...tags.emotion, ...tags.setting, ...tags.palette];
    const combined = allTags.join('-').toLowerCase();
    
    // 簡単なハッシュ関数でIDを生成（1-1000の範囲）
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash) % 1000 + 1;
  };

  // 複数の画像源を定義（フォールバック対応）
  const generateImageUrls = (tags: TriviaData['tags']) => {
    const imageId = generateImageId(tags);
    console.log('🎯 画像ID生成:', {
      tags: JSON.stringify(tags),
      imageId: imageId
    });
    
    const urls = [
      // 最初にフォールバック画像を試行（確実に成功）
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VyaW9DaXR5IEJhY2tncm91bmQ8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K',
      // 外部画像は後で試行
      `https://picsum.photos/id/${imageId}/1920/1080`,
      `https://picsum.photos/1920/1080?random=${imageId}`,
      `https://via.placeholder.com/1920x1080/${Math.floor(Math.random() * 16777215).toString(16)}/ffffff?text=CurioCity`
    ];
    
    console.log('🌐 生成されたURL一覧:', urls);
    return urls;
  };

  // 背景画像のプリロードと設定（フォールバック対応版）
  const loadBackgroundImage = async (tags: TriviaData['tags']) => {
    const startTime = Date.now();
    const imageUrls = generateImageUrls(tags);
    
    console.log(`🖼️ 背景画像URLリスト生成:`, {
      imageId: generateImageId(tags),
      urls: imageUrls,
      tags: JSON.stringify(tags)
    });
    
    // 複数のURLを順番に試行するフォールバック機能
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const isDataUrl = imageUrl.startsWith('data:');
      
      console.log(`🔄 画像読み込み試行 ${i + 1}/${imageUrls.length}:`, {
        url: isDataUrl ? 'data:image/svg+xml (フォールバック)' : imageUrl,
        type: isDataUrl ? 'base64' : 'external'
      });
      
      try {
        const result = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          
          // データURLの場合はCORSの問題がないため、設定を調整
          if (!isDataUrl) {
            // 外部画像の場合は一時的にcrossOriginを無効化
            // img.crossOrigin = 'anonymous';
          }
          
          // タイムアウト設定（外部画像は短め、データURLは長め）
          const timeoutDuration = isDataUrl ? 1000 : 3000; // 外部画像のタイムアウトを短縮
          const timeout = setTimeout(() => {
            console.warn(`⏰ 画像読み込みタイムアウト (${timeoutDuration/1000}秒):`, imageUrl);
            reject(new Error(`Image load timeout: ${imageUrl}`));
          }, timeoutDuration);

          img.onload = () => {
            clearTimeout(timeout);
            const loadTime = Date.now() - startTime;
            console.log(`✅ 画像読み込み成功 (試行 ${i + 1}):`, {
              imageUrl: isDataUrl ? 'data:image/svg+xml' : imageUrl,
              loadTime: `${loadTime}ms`,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              type: isDataUrl ? 'fallback' : 'external'
            });
            resolve(imageUrl);
          };
          
          img.onerror = (error) => {
            clearTimeout(timeout);
            const loadTime = Date.now() - startTime;
            console.warn(`⚠️ 画像読み込み失敗 (試行 ${i + 1}):`, {
              imageUrl: isDataUrl ? 'data:image/svg+xml' : imageUrl,
              loadTime: `${loadTime}ms`,
              error: error,
              type: isDataUrl ? 'fallback' : 'external'
            });
            reject(new Error(`Image load failed: ${imageUrl}`));
          };
          
          img.src = imageUrl;
        });
        
        // 成功した場合はその画像URLを返す
        return result;
        
      } catch (error) {
        console.warn(`🔁 試行 ${i + 1} 失敗、次のURLを試行中...`, (error as Error).message);
        
        // 最後のURLでも失敗した場合はエラーを投げる
        if (i === imageUrls.length - 1) {
          console.error('💥 全ての画像URLで読み込み失敗');
          throw new Error('All image URLs failed to load');
        }
      }
    }
    
    throw new Error('Unexpected error: no image URLs to try');
  };

  // 起動時に全画像をプリロード（詳細デバッグ版）
  useEffect(() => {
    if (triviaData.length === 0) return; // データが空の場合は何もしない
    
    const preloadAllImages = async () => {
      console.log('🚀 全画像プリロード開始', {
        totalImages: triviaData.length,
        timestamp: new Date().toISOString()
      });
      
      const promises = triviaData.map(async (trivia, index) => {
        console.log(`📋 雑学 ${index} プリロード開始:`, {
          title: trivia.title,
          tags: trivia.tags,
          index
        });
        
        try {
          const imageUrl = await loadBackgroundImage(trivia.tags);
          console.log(`✅ 雑学 ${index} プリロード成功:`, imageUrl);
          return { index, imageUrl };
        } catch (error) {
          console.error(`❌ 雑学 ${index} プリロード失敗:`, {
            title: trivia.title,
            error: (error as Error).message,
            tags: trivia.tags
          });
          return { index, imageUrl: '' };
        }
      });
      
      console.log('⏳ Promise.allSettled で全プリロード実行中...');
      const results = await Promise.allSettled(promises);
      const imageMap: {[key: number]: string} = {};
      let successCount = 0;
      let failureCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.imageUrl) {
          imageMap[result.value.index] = result.value.imageUrl;
          successCount++;
          console.log(`✅ 結果処理成功 ${index}:`, result.value.imageUrl);
        } else {
          failureCount++;
          console.warn(`❌ 結果処理失敗 ${index}:`, {
            status: result.status,
            reason: result.status === 'rejected' ? result.reason : 'empty imageUrl'
          });
        }
      });
      
      setPreloadedImages(imageMap);
      console.log('📊 全画像プリロード完了:', {
        success: successCount,
        failure: failureCount,
        total: triviaData.length,
        imageMap: Object.keys(imageMap),
        timestamp: new Date().toISOString()
      });
    };
    
    preloadAllImages().catch(error => {
      console.error('💥 プリロードプロセス全体でエラー:', error);
    });
  }, [triviaData]); // triviaDataが更新されたらプリロードを開始

  // 背景画像の即座適用
  useEffect(() => {
    console.log('🔄 背景画像適用useEffect実行:', {
      currentView,
      triviaIndex,
      hasCurrentTrivia: !!currentTrivia,
      preloadedCount: Object.keys(preloadedImages).length
    });
    
    if (currentView === 'trivia' && currentTrivia) {
      const preloadedUrl = preloadedImages[triviaIndex];
      console.log('🔍 プリロード確認:', {
        triviaIndex,
        hasPreloaded: !!preloadedUrl,
        preloadedUrl: preloadedUrl || 'なし'
      });
      
      if (preloadedUrl) {
        setBackgroundImage(preloadedUrl);
        setImageLoadingStatus('プリロード済み適用');
        console.log('⚡ プリロード済み画像を即座適用:', {
          triviaIndex,
          title: currentTrivia.title,
          imageUrl: preloadedUrl
        });
      } else {
        // プリロードされていない場合は即座に読み込み
        setImageLoadingStatus('即座読み込み中');
        console.log('📡 画像が未プリロード - 即座読み込み開始:', {
          triviaIndex,
          title: currentTrivia.title,
          tags: currentTrivia.tags
        });
        setBackgroundImage(''); // 読み込み中はクリア
        loadBackgroundImage(currentTrivia.tags)
          .then(imageUrl => {
            setBackgroundImage(imageUrl);
            setImageLoadingStatus('即座読み込み成功');
            console.log('⚡ 即座読み込み成功:', {
              triviaIndex,
              imageUrl,
              title: currentTrivia.title
            });
          })
          .catch(error => {
            setImageLoadingStatus('読み込み失敗');
            console.error('❌ 即座読み込み失敗:', {
              triviaIndex,
              title: currentTrivia.title,
              error: error.message
            });
            setBackgroundImage(''); // フォールバック
          });
      }
    } else {
      console.log('🚫 雑学画面以外 - 背景画像をクリア');
      setBackgroundImage('');
    }
  }, [currentView, triviaIndex, preloadedImages, currentTrivia]);



  const handleNext = () => {
    setTriviaIndex((prev) => (prev + 1) % triviaData.length);
  };


  const renderContent = () => {
    if (currentView === 'welcome') {
      return (
        <Card
          key="welcome"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Title>CurioCity</Title>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', opacity: 0.9 }}>
            幻想的な都市を旅する雑学の世界
          </h2>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem', opacity: 0.8 }}>
            毎回異なる場所に降り立ち、その地に隠された雑学を発見しましょう。
            <br />
            あなたの知的好奇心が新しい世界への扉を開きます。
          </p>
          <Button
            onClick={() => setCurrentView('trivia')}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            ✨ 旅を始める
          </Button>
        </Card>
      );
    }

    if (currentView === 'trivia') {
      return (
        <Card
          key="trivia"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#ffd700' }}>
            {currentTrivia.title}
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            lineHeight: 1.6, 
            marginBottom: '2rem',
            opacity: 0.9
          }}>
            {currentTrivia.detail}
          </p>
          <Button
            onClick={handleNext}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Next
          </Button>
        </Card>
      );
    }


    return null;
  };

  // グラデーション生成（タグに基づく）
  const generateGradient = (tags: TriviaData['tags'] | null) => {
    if (!tags) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    const emotion = tags.emotion?.[0] || 'mysterious';
    // const palette = tags.palette?.[0] || 'blue';
    
    // 感情と色彩でグラデーション決定
    const gradients: {[key: string]: string} = {
      'ミステリアス': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'エピック': 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
      'ジョイフル': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'セレーン': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      '驚き': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    };
    
    return gradients[emotion] || gradients['ミステリアス'];
  };

  // 背景スタイルを動的に生成
  const getBackgroundStyle = () => {
    if (currentView === 'trivia' && currentTrivia) {
      const gradient = generateGradient(currentTrivia.tags);
      if (backgroundImage) {
        // 画像とグラデーションを重ね合わせ
        return {
          background: `${gradient}, url(${backgroundImage})`,
          backgroundBlendMode: 'overlay',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      } else {
        // 画像読み込み前はグラデーションのみ
        return { background: gradient };
      }
    }
    return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
  };

  // ローディング状態の表示
  if (isLoading) {
    return (
      <AppContainer>
        <Card
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Title>CurioCity</Title>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
            📚 雑学データを読み込み中...
          </p>
        </Card>
      </AppContainer>
    );
  }

  // データが空の場合の表示
  if (triviaData.length === 0) {
    return (
      <AppContainer>
        <Card>
          <Title>CurioCity</Title>
          <p style={{ fontSize: '1.2rem', color: '#ff6b6b' }}>
            ❌ 雑学データが読み込めませんでした
          </p>
        </Card>
      </AppContainer>
    );
  }

  return (
    <AppContainer style={getBackgroundStyle()}>
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>

      {/* デバッグ情報 */}
      <div style={{
        position: 'fixed',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '0.5rem',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 1000,
        maxWidth: '300px'
      }}>
        <div>📚 CurioCity デバッグモード</div>
        <div>画面: {currentView}</div>
        <div>雑学: {triviaIndex + 1}/{triviaData.length}</div>
        <div>総雑学: {triviaData.length}件</div>
        <div>画像: {backgroundImage ? '✅ 即座' : '⏳ 待機'}</div>
        <div>読み込み状況: {imageLoadingStatus}</div>
        <div>画像URL: {backgroundImage ? '存在' : '未設定'}</div>
        <div>プリロード: {Object.keys(preloadedImages).length}/{triviaData.length}</div>
        {currentTrivia && (
          <>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>
              ID: {currentTrivia.id}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>
              Title: {currentTrivia.title.substring(0, 20)}...
            </div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>
              Tags: {JSON.stringify(currentTrivia.tags).substring(0, 40)}...
            </div>
          </>
        )}
        <div>{new Date().toLocaleTimeString()}</div>
      </div>
    </AppContainer>
  );
}

export default SimpleApp;