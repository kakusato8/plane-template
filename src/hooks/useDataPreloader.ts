import { useState, useEffect, useRef } from 'react';

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

interface PreloadedItem {
  trivia: TriviaData;
  imageUrl: string;
  preloadedAt: number;
  isReady: boolean;
}

interface PreloaderState {
  current: PreloadedItem | null;
  next: PreloadedItem | null;
  queue: PreloadedItem[];
  isLoading: boolean;
  stats: {
    preloaded: number;
    failed: number;
    cacheHits: number;
  };
}

interface UseDataPreloaderOptions {
  triviaData: TriviaData[];
  queueSize?: number;
  maxRetries?: number;
  preloadDelay?: number;
}

export const useDataPreloader = ({
  triviaData,
  queueSize = 3,
  maxRetries = 2,
  preloadDelay = 1000
}: UseDataPreloaderOptions) => {
  const [state, setState] = useState<PreloaderState>({
    current: null,
    next: null,
    queue: [],
    isLoading: false,
    stats: { preloaded: 0, failed: 0, cacheHits: 0 }
  });
  
  const [visitedIds, setVisitedIds] = useState<Set<number>>(new Set());
  const preloadCache = useRef<Map<number, string>>(new Map());
  const abortControllers = useRef<Map<number, AbortController>>(new Map());

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
  const generateImageUrl = (tags: TriviaData['tags']) => {
    const imageId = generateImageId(tags);
    const urls = [
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMF8xKSIvPgo8dGV4dCB4PSI5NjAiIHk9IjU0MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q3VyaW9DaXR5IEJhY2tncm91bmQ8L3RleHQ+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMF8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIwIiB5Mj0iMTA4MCI+CjxzdG9wIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHN2Zz4K',
      `https://picsum.photos/id/${imageId}/1920/1080`,
      `https://picsum.photos/1920/1080?random=${imageId}`
    ];
    
    return urls;
  };

  // 画像プリロード処理（フォールバック対応）
  const preloadImage = async (
    urls: string[], 
    triviaId: number,
    retryCount = 0
  ): Promise<string> => {
    const controller = new AbortController();
    abortControllers.current.set(triviaId, controller);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const isDataUrl = url.startsWith('data:');
      
      try {
        const result = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          
          if (controller.signal.aborted) {
            reject(new Error('プリロードが中止されました'));
            return;
          }

          if (!isDataUrl) {
            img.crossOrigin = 'anonymous';
          }
          
          const timeout = setTimeout(() => {
            reject(new Error('タイムアウト'));
          }, isDataUrl ? 500 : 2000);

          img.onload = () => {
            clearTimeout(timeout);
            console.log(`✅ 画像プリロード成功 (試行 ${i + 1}):`, triviaId, isDataUrl ? 'fallback' : 'external');
            resolve(url);
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error(`画像読み込み失敗: ${url}`));
          };
          
          img.src = url;
        });
        
        // 成功した場合はキャッシュに保存
        preloadCache.current.set(triviaId, result);
        return result;
        
      } catch (error) {
        console.warn(`⚠️ 画像プリロード失敗 (試行 ${i + 1}):`, triviaId, (error as Error).message);
        
        // 最後のURLでも失敗し、リトライ回数が残っている場合
        if (i === urls.length - 1 && retryCount < maxRetries) {
          console.log(`🔄 リトライ ${retryCount + 1}/${maxRetries}:`, triviaId);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return preloadImage(urls, triviaId, retryCount + 1);
        }
      }
    }
    
    throw new Error('全ての画像URLでプリロードに失敗');
  };

  // ランダムな雑学を選択
  const getRandomTrivia = (excludeIds: Set<number> = new Set()): TriviaData | null => {
    const available = triviaData.filter(t => !excludeIds.has(t.id));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  };

  // データとキュー項目をプリロード
  const preloadTriviaItem = async (trivia: TriviaData): Promise<PreloadedItem | null> => {
    try {
      console.log('🎯 雑学項目のプリロード開始:', trivia.title);
      
      // キャッシュ確認
      const cachedImage = preloadCache.current.get(trivia.id);
      if (cachedImage) {
        console.log('⚡ キャッシュから画像を取得:', trivia.id);
        setState(prev => ({
          ...prev,
          stats: { ...prev.stats, cacheHits: prev.stats.cacheHits + 1 }
        }));
        
        return {
          trivia,
          imageUrl: cachedImage,
          preloadedAt: Date.now(),
          isReady: true
        };
      }

      // 新規プリロード
      const imageUrls = generateImageUrl(trivia.tags);
      const imageUrl = await preloadImage(imageUrls, trivia.id);
      
      setState(prev => ({
        ...prev,
        stats: { ...prev.stats, preloaded: prev.stats.preloaded + 1 }
      }));

      return {
        trivia,
        imageUrl,
        preloadedAt: Date.now(),
        isReady: true
      };
      
    } catch (error) {
      console.error('❌ 雑学項目のプリロード失敗:', trivia.title, (error as Error).message);
      
      setState(prev => ({
        ...prev,
        stats: { ...prev.stats, failed: prev.stats.failed + 1 }
      }));
      
      return null;
    }
  };

  // キューを管理して先読みを実行
  const refillQueue = async () => {
    if (state.isLoading || triviaData.length === 0) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    console.log('🔄 プリロードキューの補充開始');
    
    const newQueueItems: PreloadedItem[] = [];
    const currentExcludes = new Set([
      ...visitedIds,
      ...(state.current ? [state.current.trivia.id] : []),
      ...(state.next ? [state.next.trivia.id] : []),
      ...state.queue.map(item => item.trivia.id)
    ]);

    // キューサイズまで補充
    for (let i = 0; i < queueSize; i++) {
      const randomTrivia = getRandomTrivia(currentExcludes);
      if (!randomTrivia) break;
      
      currentExcludes.add(randomTrivia.id);
      
      // 遅延を入れて順次プリロード
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, preloadDelay));
      }
      
      const preloadedItem = await preloadTriviaItem(randomTrivia);
      if (preloadedItem) {
        newQueueItems.push(preloadedItem);
      }
    }
    
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, ...newQueueItems],
      isLoading: false
    }));
    
    console.log('✅ プリロードキュー補充完了:', newQueueItems.length, '件');
  };

  // 次のアイテムを取得
  const getNextItem = (): PreloadedItem | null => {
    if (state.next) {
      return state.next;
    }
    
    if (state.queue.length > 0) {
      const nextItem = state.queue[0];
      setState(prev => ({
        ...prev,
        next: nextItem,
        queue: prev.queue.slice(1)
      }));
      return nextItem;
    }
    
    return null;
  };

  // 現在のアイテムを次に移動
  const moveToNext = () => {
    const nextItem = getNextItem();
    if (nextItem) {
      setState(prev => ({
        ...prev,
        current: nextItem,
        next: null
      }));
      
      setVisitedIds(prev => new Set([...prev, nextItem.trivia.id]));
      
      // キューが少なくなったら補充
      if (state.queue.length < 2) {
        refillQueue();
      }
    }
  };

  // 初期化
  useEffect(() => {
    if (triviaData.length > 0 && !state.current) {
      console.log('🚀 データプリローダーの初期化');
      refillQueue();
    }
  }, [triviaData]);

  // キューが空になったら補充
  useEffect(() => {
    if (state.queue.length === 0 && !state.isLoading && triviaData.length > 0) {
      refillQueue();
    }
  }, [state.queue.length, state.isLoading, triviaData]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      abortControllers.current.forEach(controller => controller.abort());
      abortControllers.current.clear();
    };
  }, []);

  return {
    ...state,
    moveToNext,
    getNextItem,
    preloadTriviaItem,
    // デバッグ用
    debug: {
      visitedCount: visitedIds.size,
      cacheSize: preloadCache.current.size,
      queueDetails: state.queue.map(item => ({
        id: item.trivia.id,
        title: item.trivia.title.substring(0, 20) + '...'
      }))
    }
  };
};