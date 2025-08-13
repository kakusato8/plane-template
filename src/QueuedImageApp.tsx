import { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';

// コンポーネントのインポート
import SimpleMysticalText from './components/SimpleMysticalText';
import InstantText from './components/InstantText';
import SimpleSoulContainer from './components/SimpleSoulContainer';
import SerenaAnimatedContainer from './components/SerenaAnimatedContainer';
import SerenaMorphingBox from './components/SerenaMorphingBox';
import SerenaComfortableContainer from './components/SerenaComfortableContainer';
import SerenaBallTransformContainer from './components/SerenaBallTransformContainer';

// SerenaMCP画像キューシステム
import { useOrderedImageQueue } from './hooks/useSerenaMCPQueue';

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

// 画像キュー管理の型定義
interface ImageQueue {
  current: {
    url: string;
    loaded: boolean;
  };
  next: {
    url: string;
    loaded: boolean;
  };
  next2: {
    url: string;
    loaded: boolean;
  };
}

// スタイルコンポーネント
const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const BackgroundLayer = styled.div<{
  backgroundImageUrl: string;
  zIndex: number;
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
  z-index: ${props => props.zIndex};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 1;
  }
`;

const BackgroundContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const FlashOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 1.0) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(255, 255, 255, 0.95) 100%);
  z-index: 100;
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
  color: #ffffff;
  padding: 3rem;
  max-width: 600px;
  margin: 0 auto;
  
  /* SerenaMCP強化: 最大視認性確保 */
  text-shadow: 
    0 0 8px rgba(0, 0, 0, 0.9),
    0 0 16px rgba(0, 0, 0, 0.7),
    0 2px 4px rgba(0, 0, 0, 0.8),
    0 0 24px rgba(255, 255, 255, 0.3);
  font-weight: 600;
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.4));
`;

const TriviaContent = styled(motion.div)`
  text-align: center;
  color: #ffffff;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  
  /* SerenaMCP強化: 最大視認性確保 */
  text-shadow: 
    0 0 8px rgba(0, 0, 0, 0.9),
    0 0 16px rgba(0, 0, 0, 0.7),
    0 2px 4px rgba(0, 0, 0, 0.8),
    0 0 24px rgba(255, 255, 255, 0.3);
  font-weight: 600;
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.4));
`;

const MysticalButton = styled(motion.button)`
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  color: #ffffff;
  padding: 1.2rem 2.5rem;
  border: none;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  margin: 1rem;
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
  backdrop-filter: blur(3px);
  border: 1px solid rgba(255,255,255,0.2);
  
  /* SerenaMCP強化: ボタンテキスト最大視認性確保 */
  text-shadow: 
    0 0 6px rgba(0, 0, 0, 0.8),
    0 0 12px rgba(0, 0, 0, 0.6),
    0 1px 3px rgba(0, 0, 0, 0.7);
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
`;

const LoadingSpinner = styled(motion.div)`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #4facfe;
  border-radius: 50%;
`;

function QueuedImageApp() {
  const [currentView, setCurrentView] = useState<'welcome' | 'trivia'>('welcome');
  const [triviaData, setTriviaData] = useState<TriviaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTriviaIndex, setCurrentTriviaIndex] = useState(0);
  const [visitedIds, setVisitedIds] = useState<Set<number>>(new Set());
  const [textKey, setTextKey] = useState(0);
  
  // SerenaMCP画像キューシステム
  const { 
    queueState,
    initializeQueue,
    advanceQueue,
    startAggressivePreloading,
    stopAggressivePreloading,
    ensureNextImageReady,
    setDynamicPriorityMode,
    getImageStatus,  // 画像状態確認用
    isReady: isImageReady,
    isNextReady,
    isLoading: isMCPLoading,  // ボール変形アニメーション用
    metrics,
    debugInfo
  } = useOrderedImageQueue();
  
  // SerenaMCPローディングタイミング制御
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [shouldShowMorphing, setShouldShowMorphing] = useState(false);
  
  // アニメーション状態
  const [isFlashing, setIsFlashing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTextAnimating, setIsTextAnimating] = useState(false);
  
  // 🚀 SerenaMCP連続クリック対策: 状態ロック機構
  const [isProcessingNext, setIsProcessingNext] = useState(false);
  const processingRefNext = useRef(false);
  const lastClickTimeRef = useRef(0);
  const CLICK_DEBOUNCE_MS = 300; // デバウンス時間
  
  // シンプルな背景画像URL管理（SerenaMCP活用）
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState('');
  
  // SerenaMCP緊急フォールバック状態
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  // 雑学データの読み込み（ランダム開始インデックス付き）
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
        
        // ランダムな開始インデックスを設定（CurioCityのコンセプト）
        const randomStartIndex = Math.floor(Math.random() * data.length);
        console.log(`🎲 SerenaMCP: ランダム開始インデックス: ${randomStartIndex}`);
        setCurrentTriviaIndex(randomStartIndex);
        
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

  // SerenaMCP強化版: 確実な画像ID生成
  const generateImageId = (tags: TriviaData['tags'], fallbackIndex: number = 0) => {
    const allTags = [...tags.emotion, ...tags.setting, ...tags.palette];
    const combined = allTags.join('-').toLowerCase();
    
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Picsumで確実に存在するID範囲に制限（1-300は確実）
    let imageId = Math.abs(hash) % 300 + 1;
    
    // フォールバック用のオフセット
    imageId = (imageId + fallbackIndex * 50) % 300 + 1;
    
    return imageId;
  };

  // SerenaMCP強化版: フォールバック付き画像URL生成（キャッシュ最適化）
  const generateImageUrl = (triviaIndex: number, fallbackLevel: number = 0) => {
    if (!triviaData[triviaIndex]) {
      console.warn(`🚨 SerenaMCP: 無効なtriviaIndex: ${triviaIndex}`);
      return '';
    }
    
    const imageId = generateImageId(triviaData[triviaIndex].tags, fallbackLevel);
    // キャッシュを効率化するため、同じ画像IDは常に同じURLになるようにする
    const url = `https://picsum.photos/id/${imageId}/1920/1080?cache=${imageId}`;
    
    console.log(`🎨 SerenaMCP: URL生成 Index:${triviaIndex} ID:${imageId} Fallback:${fallbackLevel} -> ${url}`);
    return url;
  };
  
  // SerenaMCP緊急フォールバック用の安全なURL生成
  const generateSafeImageUrl = (index: number) => {
    // 確実に存在する画像のリスト
    const safeIds = [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const safeId = safeIds[index % safeIds.length];
    return `https://picsum.photos/id/${safeId}/1920/1080`;
  };

  // SerenaMCP初期化（起動時・白画面防止強化版）
  useEffect(() => {
    if (triviaData.length > 0) {
      console.log(`🚀 SerenaMCP画像キュー初期化開始 - 開始インデックス: ${currentTriviaIndex}`);
      
      // フォールバック対応のURL生成関数
      const urlGeneratorWithFallback = (index: number) => {
        return generateImageUrl(index, 0);
      };
      
      initializeQueue(currentTriviaIndex, urlGeneratorWithFallback, triviaData.length)
        .then(() => {
          console.log('✅ SerenaMCP: 初期化完了、キュー状態確認', {
            currentLoaded: queueState.current.loaded,
            currentId: queueState.current.id,
            hasElement: !!queueState.current.element
          });
          
          // 動的優先度モードを有効化
          setDynamicPriorityMode(true);
          
          // 積極的な先読みを開始
          startAggressivePreloading(currentTriviaIndex, generateImageUrl, triviaData.length);
        })
        .catch(error => {
          console.error('❌ SerenaMCP画像キュー初期化失敗:', error);
          // 初期化失敗時の緊急フォールバック
          console.log('🚨 SerenaMCP: 初期化失敗、緊急フォールバック実行');
          const emergencyUrl = generateSafeImageUrl(currentTriviaIndex);
          setCurrentBackgroundUrl(emergencyUrl);
          setIsEmergencyMode(true);
        });
    }
  }, [triviaData, currentTriviaIndex, initializeQueue, setDynamicPriorityMode, startAggressivePreloading]);

  // コンポーネントのアンマウント時に積極的先読みを停止
  useEffect(() => {
    return () => {
      console.log('🧹 SerenaMCP: コンポーネントアンマウント、積極的先読みを停止');
      stopAggressivePreloading();
    };
  }, [stopAggressivePreloading]);

  // queueState変化監視で背景画像更新（安定化版）
  useEffect(() => {
    console.log('🔍 SerenaMCP: キュー状態変化監視', {
      currentId: queueState.current.id,
      currentLoaded: queueState.current.loaded,
      currentUrl: queueState.current.url?.substring(0, 50) || '空',
      hasElement: !!queueState.current.element,
      currentBackgroundExists: !!currentBackgroundUrl
    });
    
    // キューに画像が読み込まれている場合のみ背景更新
    if (queueState.current.loaded && queueState.current.url && queueState.current.url !== currentBackgroundUrl) {
      console.log('✨ SerenaMCP: キューから新しい背景画像を設定:', queueState.current.url.substring(0, 50));
      setCurrentBackgroundUrl(queueState.current.url);
      
      // 緊急モード解除
      if (isEmergencyMode) {
        console.log('🎉 SerenaMCP: 正常画像読み込み、緊急モード解除');
        setIsEmergencyMode(false);
      }
    }
    
    // フォールバックロジックは白画面防止システムに委任
    
  }, [queueState.current.loaded, queueState.current.url, queueState.current.id, currentBackgroundUrl, isEmergencyMode]);
  
  // SerenaMCP白画面防止システム（最終防御版）
  useEffect(() => {
    // 緊急時のみ作動する白画面検出
    const emergencyCheckTimer = setTimeout(() => {
      if (!currentBackgroundUrl && !isLoading && triviaData.length > 0) {
        console.warn('🎆 SerenaMCP: 最終防御 - 白画面検出、緊急フォールバック実行');
        
        // 確実に表示されるSVGフォールバック
        const emergencyUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2NjdlZWEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPjx0ZXh0IHg9Ijk2MCIgeT0iNTAwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DdXJpb0NpdHk8L3RleHQ+PHRleHQgeD0iOTYwIiB5PSI1ODAiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPueUu+WDj+WQhOOBl+OBpuOBhOOBvuOBmeKApjwvdGV4dD48L3N2Zz4=';
        setCurrentBackgroundUrl(emergencyUrl);
        setIsEmergencyMode(true);
        console.log('🛡️ SerenaMCP: 最終防御白画面フォールバック完了');
      }
    }, 5000); // 5秒後に一度だけチェック
    
    return () => clearTimeout(emergencyCheckTimer);
  }, [currentBackgroundUrl, isLoading, triviaData.length]);

  // 現在の雑学
  const currentTrivia = triviaData[currentTriviaIndex];
  

  // 旅の開始 - フラッシュアニメーション付き
  const handleStartJourney = async () => {
    if (triviaData.length > 0 && !isTransitioning && queueState.current.loaded) {
      console.log('🎬 SerenaMCP: 旅開始 - 初回フラッシュアニメーション');
      
      // 初回のフラッシュアニメーションを実行
      setIsTransitioning(true);
      setIsFlashing(true);
      
      // フラッシュ中にビューを切り替え
      setTimeout(() => {
        console.log('🎬 SerenaMCP: ウェルカムからトリビアへ切り替え');
        setCurrentView('trivia');
        setTextKey(prev => prev + 1);
        
        // フラッシュ解除
        setTimeout(() => {
          setIsFlashing(false);
          setIsTransitioning(false);
          console.log('✅ SerenaMCP: 初回アニメーション完了');
        }, 400);
      }, 300);
    }
  };

  // SerenaMCP Nextボタン押下時の処理（連続クリック対策強化版）
  const handleNext = async () => {
    const now = Date.now();
    
    // 🛡️ SerenaMCP防御1: デバウンス制御
    if (now - lastClickTimeRef.current < CLICK_DEBOUNCE_MS) {
      console.log('🚫 SerenaMCP: デバウンス中、クリック無視');
      return;
    }
    lastClickTimeRef.current = now;
    
    // 🛡️ SerenaMCP防御2: 複数の状態による完全ガード
    if (isTransitioning || isFlashing || isProcessingNext || processingRefNext.current) {
      console.log('🚫 SerenaMCP Next無効 (完全ガード):', { 
        isTransitioning, 
        isFlashing, 
        isProcessingNext,
        processingRef: processingRefNext.current,
        nextReady: isNextReady
      });
      return;
    }
    
    // 🔒 SerenaMCP防御3: 処理中フラグを即座に設定（ref + state両方）
    setIsProcessingNext(true);
    processingRefNext.current = true;
    
    const nextIndex = (currentTriviaIndex + 1) % triviaData.length;
    
    try {
      // 次の画像が準備されているか確認し、必要に応じて緊急準備
      if (!isNextReady) {
        console.log('🚨 SerenaMCP: 次画像が未準備、モーフィングアニメーションで時間稼ぎ');
        
        // モーフィングアニメーションでローディング時間稼ぎ
        setShouldShowMorphing(true);
        setLoadingProgress(0);
        
        // プログレスバーアニメーション
        const progressInterval = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 15;
          });
        }, 100);
        
        const nextReady = await ensureNextImageReady(nextIndex, generateImageUrl);
        clearInterval(progressInterval);
        setLoadingProgress(100);
        
        // 少し待ってからモーフィング終了
        setTimeout(() => {
          setShouldShowMorphing(false);
          setLoadingProgress(0);
        }, 500);
        
        if (!nextReady) {
          console.log('🚫 SerenaMCP: 次画像の緊急準備に失敗、操作をキャンセル');
          return;
        }
      }
    
      console.log('⚡ SerenaMCP Next開始 - フラッシュアニメーション');
      setIsTransitioning(true);
      setIsFlashing(true);

    // フラッシュ中に背景切り替え処理（シンプル版）
    setTimeout(async () => {
      console.log('🔄 SerenaMCP: シンプル背景切り替え開始');
      
      // インデックス更新（先に実行）
      setCurrentTriviaIndex(nextIndex);
      setVisitedIds(prev => new Set([...prev, currentTrivia.id]));
      
      // キューを進行させる（これによりqueueState.currentが新しい画像になる）
      try {
        console.log('🔄 SerenaMCP: キューを進行');
        await advanceQueue(nextIndex, generateImageUrl, triviaData.length);
        console.log('✅ SerenaMCP: キュー進行完了、背景は自動的に更新されます');
      } catch (error) {
        console.warn('⚠️ SerenaMCP: キュー進行でエラー:', error);
        
        // エラー時はSerenaMCPフォールバックシステムを活用
        console.log('🚨 SerenaMCP: キュー進行エラー、緊急フォールバック開始');
        
        // SerenaMCPの緊急画像準備を試行
        try {
          const emergencyReady = await ensureNextImageReady(nextIndex, generateImageUrl);
          if (emergencyReady) {
            console.log('✅ SerenaMCP: 緊急準備成功');
          } else {
            // 最終フォールバック：安全な画像を直接設定
            const safeUrl = generateSafeImageUrl(nextIndex);
            console.log('🛡️ SerenaMCP: 最終安全フォールバック:', safeUrl.substring(0, 50));
            setCurrentBackgroundUrl(safeUrl);
          }
        } catch (emergencyError) {
          console.error('❌ SerenaMCP: 緊急準備も失敗:', emergencyError);
          const safeUrl = generateSafeImageUrl(nextIndex);
          console.log('🛡️ SerenaMCP: 最終安全フォールバック:', safeUrl.substring(0, 50));
          setCurrentBackgroundUrl(safeUrl);
        }
      }
      
      // フラッシュ解除（背景切り替え後）
      setTimeout(() => {
        console.log('✅ SerenaMCP: フラッシュ解除');
        setIsFlashing(false);
      }, 250);
      
      // 積極的先読みを新しい位置で再開
      stopAggressivePreloading();
      setTimeout(() => {
        startAggressivePreloading(nextIndex, generateImageUrl, triviaData.length);
      }, 500);
      
      // テキストアニメーション開始
      setTextKey(prev => prev + 1);
      setIsTextAnimating(true);
      
      // テキストアニメーション完了後に状態をクリア
      setTimeout(() => {
        setIsTextAnimating(false);
        setIsTransitioning(false);
        console.log('✅ SerenaMCP: 全アニメーション完了');
      }, 1500); // テキストアニメーション時間
      
    }, 300); // フラッシュ開始から画像切り替えまでの時間
    
    } catch (error) {
      console.error('❌ SerenaMCP: handleNext処理中にエラー:', error);
    } finally {
      // 🔓 SerenaMCP防御4: 必ず処理中フラグを解除
      setTimeout(() => {
        setIsProcessingNext(false);
        processingRefNext.current = false;
        console.log('🔓 SerenaMCP: 処理ロック解除');
      }, 100); // 少し遅延させて確実に解除
    }
  };

  // ローディング状態
  if (isLoading) {
    return (
      <AppContainer>
        <BackgroundContainer>
          <BackgroundLayer
            backgroundImageUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VyaW9DaXR5IEJhY2tncm91bmQ8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K"
            zIndex={1}
          />
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

  return (
    <AppContainer>
      {/* シンプル背景画像システム（SerenaMCP強化版） */}
      <BackgroundContainer>
        <BackgroundLayer
          backgroundImageUrl={currentBackgroundUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VyaW9DaXR5IEJhY2tncm91bmQ8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K'}
          zIndex={1}
        />
      </BackgroundContainer>

      {/* フラッシュオーバーレイ */}
      <AnimatePresence>
        {isFlashing && (
          <FlashOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* SerenaMCP緊急ローディングオーバーレイ */}
      <AnimatePresence>
        {shouldShowMorphing && (
          <motion.div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
              color: 'white'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SerenaComfortableContainer
              isVisible={true}
              loadingProgress={loadingProgress}
              isImageReady={false}
              isNextImageReady={false}
              loadingTimeBuffer={2000}
              style={{
                minWidth: '400px',
                minHeight: '200px',
                background: 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                  }}
                  style={{ 
                    fontSize: '3rem', 
                    marginBottom: '1rem',
                    filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))' 
                  }}
                >
                  🌸
                </motion.div>
                <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>次の世界を穏やかに準備中...</div>
                <div style={{ fontSize: '1rem', opacity: 0.8 }}>
                  SerenaMCP進行状況: {Math.round(loadingProgress)}%
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.6 }}>
                  成功: {metrics.successful} / 失敗: {metrics.failed} / 読み込み中: {metrics.activeLoading}
                </div>
              </div>
            </SerenaComfortableContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* コンテンツ */}
      <ContentContainer>
        <AnimatePresence mode="wait">
          {currentView === 'welcome' && (
            <SerenaBallTransformContainer 
              key="welcome-container"
              isVisible={true}
              isLoading={isMCPLoading && !queueState.current.loaded}
              onLoadingComplete={() => {
                console.log('🏀 SerenaBallTransform: ウェルカム画面でローディング完了');
              }}
            >
              <WelcomeContent
                style={{
                  background: 'transparent',
                  borderRadius: '0px',
                  backdropFilter: 'none',
                  border: 'none'
                }}
              >
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
                  disabled={!queueState.current.loaded || isTransitioning}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ 
                    marginTop: '2rem',
                    opacity: (queueState.current.loaded && !isTransitioning) ? 1 : 0.6,
                    background: queueState.current.loaded ? 
                      'linear-gradient(45deg, #4facfe, #00f2fe)' : 
                      'linear-gradient(45deg, #ff6b6b, #ffa500)'
                  }}
                >
                  {isTransitioning ? '⚡ 旅立ち中...' :
                   queueState.current.loaded ? '✨ 旅を始める' : '🌟 準備中...'}
                </MysticalButton>
              </WelcomeContent>
            </SerenaBallTransformContainer>
          )}

          {currentView === 'trivia' && currentTrivia && (
            <SerenaBallTransformContainer 
              key={`trivia-container-${currentTriviaIndex}`}
              isVisible={true}
              isLoading={(isMCPLoading || isTransitioning) && !queueState.current.loaded}
              onLoadingComplete={() => {
                console.log('🏀 SerenaBallTransform: 雑学画面でローディング完了');
              }}
            >
              <TriviaContent
                key={`trivia-${currentTriviaIndex}-${textKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
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
                    disabled={isTransitioning || !isNextReady || isProcessingNext}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ 
                      opacity: (isTransitioning || !isNextReady || isProcessingNext) ? 0.6 : 1,
                      background: (isNextReady && !isProcessingNext) ? 
                        'linear-gradient(45deg, #4facfe, #00f2fe)' : 
                        'linear-gradient(45deg, #ff6b6b, #ffa500)'
                    }}
                  >
                    {isTransitioning ? '⚡ 遷移中...' : 
                     isProcessingNext ? '🔒 処理中...' :
                     !isNextReady ? '🚀 準備中...' : 
                     'Next ➤'}
                  </MysticalButton>
                </div>
              </TriviaContent>
            </SerenaBallTransformContainer>
          )}
        </AnimatePresence>
      </ContentContainer>

      {/* SerenaMCP デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.95)',
          color: '#ffffff',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '11px',
          zIndex: 1000,
          maxWidth: '350px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <div><strong>🎯 SerenaMCP QueuedImageApp</strong></div>
          <div>画面: {currentView} {currentView === 'welcome' && '🏠'} {currentView === 'trivia' && currentTriviaIndex === 0 && '🎆'}</div>
          <div>雑学: {currentTriviaIndex + 1}/{triviaData.length}</div>
          <div>タイトル: {currentTrivia?.title.substring(0, 25)}...</div>
          <div>訪問済み: {visitedIds.size}件</div>
          <div>フラッシュ中: {isFlashing ? '✅ フラッシュ' : '❌'}</div>
          <div>遷移中: {isTransitioning ? '✅ 遷移' : '❌'}</div>
          <div>テキスト中: {isTextAnimating ? '✅ アニメ' : '❌'}</div>
          <div>初回表示: {currentView === 'trivia' && currentTriviaIndex === 0 ? '🎆 初回' : currentView === 'welcome' ? '🏠 ウェルカム' : '➖'}</div>
          <hr style={{ margin: '0.5rem 0', borderColor: 'rgba(255,255,255,0.3)' }}/>
          
          <div><strong>🔄 SerenaMCP キュー状態</strong></div>
          <div>現在: {queueState.current.loaded ? '✅' : '❌'} {queueState.current.id}</div>
          <div>準備保証: {isNextReady ? '✅ 確実' : '❌ 未準備'}</div>
          <div style={{ fontSize: '9px', color: '#aaa', marginLeft: '1rem' }}>
            {queueState.current.url.substring(0, 30)}...
          </div>
          <div>次: {isNextReady ? '✅' : '❌'} {queueState.next.id} {!isNextReady && '🚀'}</div>
          <div style={{ fontSize: '9px', color: '#aaa', marginLeft: '1rem' }}>
            {queueState.next.url.substring(0, 30)}...
          </div>
          <div>2枚先: {queueState.next2.loaded ? '✅' : '❌'} {queueState.next2.id}</div>
          <div style={{ fontSize: '9px', color: '#aaa', marginLeft: '1rem' }}>
            {queueState.next2.url.substring(0, 30)}...
          </div>
          
          <hr style={{ margin: '0.5rem 0', borderColor: 'rgba(255,255,255,0.3)' }}/>
          <div><strong>📊 SerenaMCP メトリクス</strong></div>
          <div>総リクエスト: {metrics.totalRequests}</div>
          <div>成功: {metrics.successful} / 失敗: {metrics.failed}</div>
          <div>平均読み込み: {metrics.avgLoadTime}ms</div>
          <div>キュー待機: {metrics.queueLength}件</div>
          <div>読み込み中: {metrics.activeLoading}件</div>
          
          <hr style={{ margin: '0.5rem 0', borderColor: 'rgba(255,255,255,0.3)' }}/>
          <div><strong>🎨 表示背景</strong></div>
          <div>現在: {currentBackgroundUrl.substring(0, 25)}...</div>
          <div>積極先読: {metrics.activeLoading > 0 ? '🚀 動作中' : '😴 停止中'}</div>
          <div>モーフィング: {shouldShowMorphing ? '🌌 実行中' : '⚫'}</div>
          <div>ローディング: {loadingProgress > 0 ? `📈 ${Math.round(loadingProgress)}%` : '⚫'}</div>
          
          <hr style={{ margin: '0.5rem 0', borderColor: 'rgba(255,255,255,0.3)' }}/>
          <div><strong>🔍 SerenaMCP 画像診断</strong></div>
          <div>URLエラー: {Object.keys(debugInfo.metrics?.urlErrors || {}).length}件</div>
          <div>成功済みURL: {debugInfo.metrics?.successfulUrls?.size || 0}件</div>
          {debugInfo.metrics?.lastErrors?.length > 0 && (
            <div style={{ fontSize: '10px', color: '#ff6b6b', marginTop: '0.3rem' }}>
              最新エラー: {debugInfo.metrics.lastErrors[debugInfo.metrics.lastErrors.length - 1]?.error}
            </div>
          )}
          
          {debugInfo.avgLoadTimes?.length > 0 && (
            <>
              <hr style={{ margin: '0.5rem 0', borderColor: 'rgba(255,255,255,0.3)' }}/>
              <div><strong>⚡ 直近の読み込み時間</strong></div>
              <div style={{ fontSize: '9px' }}>
                {debugInfo.avgLoadTimes.slice(-5).join('ms, ')}ms
              </div>
            </>
          )}
        </div>
      )}
    </AppContainer>
  );
}

export default QueuedImageApp;