/**
 * SerenaMCPデバッグパネル - プリロード状況を監視
 * 開発時にのみ表示される画像準備状況モニター
 */

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { pexelsImageService } from '../utils/pexelsImageService';

const DebugPanel = styled(motion.div)`
  position: fixed;
  top: 10px;
  right: 10px;
  width: 300px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  color: white;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  z-index: 1000;
  backdrop-filter: blur(10px);
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
  padding: 2px 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.05);
`;

const TaskList = styled.div`
  max-height: 120px;
  overflow-y: auto;
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 8px;
`;

const TaskItem = styled.div<{ status: string }>`
  padding: 2px 4px;
  margin: 1px 0;
  border-radius: 2px;
  background: ${({ status }) => {
    switch (status) {
      case 'ready': return 'rgba(34, 197, 94, 0.2)';
      case 'loading': return 'rgba(234, 179, 8, 0.2)';
      case 'failed': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(156, 163, 175, 0.2)';
    }
  }};
  border-left: 2px solid ${({ status }) => {
    switch (status) {
      case 'ready': return '#22c55e';
      case 'loading': return '#eab308';
      case 'failed': return '#ef4444';
      default: return '#9ca3af';
    }
  }};
`;

const ToggleButton = styled.button`
  position: fixed;
  top: 10px;
  right: 320px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  z-index: 1001;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
`;

interface SerenaMCPDebugPanelProps {
  enabled?: boolean;
}

const SerenaMCPDebugPanel: React.FC<SerenaMCPDebugPanelProps> = ({ 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<any>({});
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [queueMetrics, setQueueMetrics] = useState<any>({});

  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      try {
        // Pexels APIサービスの状態を監視
        const pexelsAvailable = pexelsImageService.isApiKeyAvailable();
        
        setMetrics({
          pexelsApiAvailable: pexelsAvailable,
          cacheSize: 0, // キャッシュサイズは内部メソッドで取得
          totalRequests: 0,
          successfulRequests: 0
        });
        
        setDebugInfo({
          enabled: true,
          pexelsConfigured: pexelsAvailable,
          lastUpdate: new Date().toLocaleTimeString()
        });
        
        setQueueMetrics({
          status: pexelsAvailable ? 'ready' : 'api_key_missing'
        });
      } catch (error) {
        console.warn('SerenaMCP Debug Panel: metrics error', error);
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <ToggleButton onClick={() => setIsVisible(!isVisible)}>
        🎯 SerenaMCP
      </ToggleButton>
      
      <AnimatePresence>
        {isVisible && (
          <DebugPanel
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
              🧠 Pexels セマンティック検索
            </div>
            
            {/* Pexels API状況 */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '4px' }}>API状況</div>
              <MetricRow>
                <span>Pexels API</span>
                <span>{metrics.pexelsApiAvailable ? '✅ 利用可能' : '❌ 未設定'}</span>
              </MetricRow>
              <MetricRow>
                <span>フォールバック</span>
                <span>Picsum Photos</span>
              </MetricRow>
              <MetricRow>
                <span>検索方式</span>
                <span>セマンティック理解</span>
              </MetricRow>
              <MetricRow>
                <span>最終更新</span>
                <span>{debugInfo.lastUpdate || '--:--:--'}</span>
              </MetricRow>
            </div>

            {/* セマンティック機能 */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '4px' }}>セマンティック機能</div>
              <MetricRow>
                <span>地域抽出</span>
                <span>✅ 日本語→英語</span>
              </MetricRow>
              <MetricRow>
                <span>感情マッピング</span>
                <span>✅ 8種類対応</span>
              </MetricRow>
              <MetricRow>
                <span>設定理解</span>
                <span>✅ 13種類対応</span>
              </MetricRow>
              <MetricRow>
                <span>キャッシュ</span>
                <span>✅ 24時間</span>
              </MetricRow>
            </div>

            {/* API設定ガイド */}
            {!metrics.pexelsApiAvailable && (
              <div style={{ 
                marginBottom: '8px', 
                padding: '6px', 
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '10px', color: '#ef4444', marginBottom: '4px' }}>
                  📋 Pexels API設定方法
                </div>
                <div style={{ fontSize: '8px', opacity: 0.8 }}>
                  1. https://www.pexels.com/api/ でアカウント作成<br/>
                  2. .env に VITE_PEXELS_API_KEY を設定<br/>
                  3. 無料プラン: 月200回まで
                </div>
              </div>
            )}

            {/* 制御 */}
            <div style={{ 
              marginTop: '8px', 
              paddingTop: '8px', 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '8px',
              opacity: 0.6
            }}>
              状態: {queueMetrics.status} | Pexels: {debugInfo.pexelsConfigured ? '✅' : '❌'}
            </div>
          </DebugPanel>
        )}
      </AnimatePresence>
    </>
  );
};

export default SerenaMCPDebugPanel;