/**
 * SerenaMCPデバッグパネル - プリロード状況を監視
 * 開発時にのみ表示される画像準備状況モニター
 */

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { serenaMCPPreloadManager } from '../utils/serenaMCPPreloadManager';
import { serenaMCPImageQueue } from '../utils/serenaMCPImageQueue';

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
        const preloadMetrics = serenaMCPPreloadManager.getMetrics();
        const preloadDebugInfo = serenaMCPPreloadManager.getDebugInfo();
        const queueData = serenaMCPImageQueue.getMetrics();

        setMetrics(preloadMetrics);
        setDebugInfo(preloadDebugInfo);
        setQueueMetrics(queueData);
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
              🎯 SerenaMCP プリロード監視
            </div>
            
            {/* プリロードマネージャーメトリクス */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '4px' }}>プリロード状況</div>
              <MetricRow>
                <span>準備済み</span>
                <span>{metrics.readyTasks || 0}/{metrics.totalTasks || 0}</span>
              </MetricRow>
              <MetricRow>
                <span>成功率</span>
                <span>{((metrics.successRate || 0) * 100).toFixed(1)}%</span>
              </MetricRow>
              <MetricRow>
                <span>平均時間</span>
                <span>{(metrics.avgPreloadTime || 0).toFixed(0)}ms</span>
              </MetricRow>
              <MetricRow>
                <span>並行実行</span>
                <span>{debugInfo.currentPreloads || 0}/{debugInfo.maxConcurrent || 3}</span>
              </MetricRow>
            </div>

            {/* 画像キューメトリクス */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '4px' }}>画像キュー</div>
              <MetricRow>
                <span>成功/総数</span>
                <span>{queueMetrics.successful || 0}/{queueMetrics.totalRequests || 0}</span>
              </MetricRow>
              <MetricRow>
                <span>キュー長</span>
                <span>{queueMetrics.queueLength || 0}</span>
              </MetricRow>
              <MetricRow>
                <span>読み込み中</span>
                <span>{queueMetrics.activeLoading || 0}</span>
              </MetricRow>
            </div>

            {/* アクティブタスク */}
            {debugInfo.tasks && debugInfo.tasks.length > 0 && (
              <TaskList>
                <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '4px' }}>
                  アクティブタスク ({debugInfo.tasks.length})
                </div>
                {debugInfo.tasks.slice(0, 5).map((task: any, index: number) => (
                  <TaskItem key={task.id} status={task.status}>
                    <div style={{ fontSize: '9px' }}>
                      {task.triviaTitle.substring(0, 20)}...
                    </div>
                    <div style={{ fontSize: '8px', opacity: 0.7 }}>
                      {task.status} • {task.readyImagesCount}枚 • {task.duration}ms
                    </div>
                  </TaskItem>
                ))}
                {debugInfo.tasks.length > 5 && (
                  <div style={{ fontSize: '8px', opacity: 0.5, textAlign: 'center', margin: '4px 0' }}>
                    +{debugInfo.tasks.length - 5} more...
                  </div>
                )}
              </TaskList>
            )}

            {/* 制御 */}
            <div style={{ 
              marginTop: '8px', 
              paddingTop: '8px', 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '8px',
              opacity: 0.6
            }}>
              有効: {debugInfo.enabled ? '✅' : '❌'} | タスク: {debugInfo.tasksCount || 0}
            </div>
          </DebugPanel>
        )}
      </AnimatePresence>
    </>
  );
};

export default SerenaMCPDebugPanel;