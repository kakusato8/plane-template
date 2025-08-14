import React, { lazy, Suspense } from 'react';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';

/**
 * 遅延読み込みコンポーネントのラッパー（シンプル版）
 */

// 遅延読み込み用ローディングコンポーネント
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: white;
  font-family: ${theme.typography.fonts.secondary};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorFallback = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: white;
  font-family: ${theme.typography.fonts.primary};
  background: rgba(255, 255, 255, 0.1);
  border-radius: ${theme.borderRadius.lg};
  margin: ${theme.spacing[4]};
  padding: ${theme.spacing[6]};
  text-align: center;
`;

const ComponentLoader: React.FC<{ message?: string }> = ({ message = '読み込み中...' }) => (
  <LoadingContainer>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <LoadingSpinner />
      <span>{message}</span>
    </div>
  </LoadingContainer>
);

// エラーハンドリング付きの遅延読み込みコンポーネント
const MapNavigation = lazy(() => 
  import('./MapNavigation').catch(error => {
    console.error('MapNavigation読み込みエラー:', error);
    return { 
      default: () => (
        <ErrorFallback>
          <div>🗺️ 地図コンポーネントを読み込めませんでした</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
            ページをリロードしてください
          </div>
        </ErrorFallback>
      ) 
    };
  })
);

const ShareButtons = lazy(() => 
  import('./ShareButtons').catch(error => {
    console.error('ShareButtons読み込みエラー:', error);
    return { 
      default: () => (
        <ErrorFallback>
          <div>🔗 共有ボタンを読み込めませんでした</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
            ページをリロードしてください
          </div>
        </ErrorFallback>
      ) 
    };
  })
);

// UserChoicesContainer削除 - Serena MCP: 選択システム不要

const LocationDisplay = lazy(() => 
  import('./LocationDisplay').catch(error => {
    console.error('LocationDisplay読み込みエラー:', error);
    return { 
      default: () => (
        <ErrorFallback>
          <div>📍 地点表示コンポーネントを読み込めませんでした</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
            ページをリロードしてください
          </div>
        </ErrorFallback>
      ) 
    };
  })
);

// Suspenseでラップされたコンポーネント群
export const MapNavigationWrapper: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader message="地図を読み込み中..." />}>
    <MapNavigation {...props} />
  </Suspense>
);

export const ShareButtonsWrapper: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader message="共有ボタンを読み込み中..." />}>
    <ShareButtons {...props} />
  </Suspense>
);

// UserChoicesWrapper削除 - Serena MCP: 選択システム不要

export const LocationDisplayWrapper: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader message="地点情報を読み込み中..." />}>
    <LocationDisplay {...props} />
  </Suspense>
);

// シンプルなプリロード機能（オプション）
export const preloadComponents = {
  preloadAll: async () => {
    try {
      console.log('🚀 コンポーネント事前読み込み開始');
      
      // 重要度の高いコンポーネントを最初にプリロード
      await Promise.allSettled([
        import('./MapNavigation'),
        import('./ShareButtons'),
        import('./LocationDisplay')
      ]);
      
      console.log('✅ 全コンポーネント事前読み込み完了');
    } catch (error) {
      console.warn('⚠️ コンポーネント事前読み込み中にエラー:', error);
    }
  },
  
  preloadCritical: async () => {
    try {
      await Promise.allSettled([
        import('./MapNavigation'),
        import('./ShareButtons')
      ]);
      console.log('✅ 重要コンポーネント事前読み込み完了');
    } catch (error) {
      console.warn('⚠️ 重要コンポーネント事前読み込み中にエラー:', error);
    }
  },
  
  // 統計情報（固定値）
  getStats: () => ({ loaded: 4, loading: 0, failed: 0 }),
  
  // 読み込み状態（常にtrue）
  isLoaded: () => true
};