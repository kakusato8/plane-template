import { useState, useEffect } from 'react';
import styled from '@emotion/styled';

/**
 * 最小限テスト版 - 問題特定用
 * 複雑な機能を全て無効化して基本表示のみ確認
 */

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: Arial, sans-serif;
`;

const TestCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  backdrop-filter: blur(10px);
`;

const Button = styled.button`
  background: #4ade80;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  
  &:hover {
    background: #22c55e;
  }
`;

function AppTest() {
  const [step, setStep] = useState(1);
  const [loadTime, setLoadTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    console.log('⚡ テスト版アプリ開始:', new Date().toLocaleTimeString());
    
    // 描画完了時間を測定
    setTimeout(() => {
      const endTime = Date.now();
      setLoadTime(endTime - startTime);
      console.log(`⏱️ 描画完了時間: ${endTime - startTime}ms`);
    }, 100);
    
    return () => {
      console.log('🔄 テスト版アプリ終了');
    };
  }, []);

  const handleNext = () => {
    console.log(`📊 ステップ ${step} → ${step + 1}`);
    setStep(step + 1);
  };

  const handleTest = async () => {
    console.log('🧪 データフェッチテスト開始');
    try {
      const response = await fetch('/data/trivia.json');
      console.log('📡 フェッチ結果:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ データ取得成功:', Array.isArray(data) ? `${data.length}件` : typeof data);
        alert(`データ取得成功: ${Array.isArray(data) ? data.length : 0}件`);
      } else {
        console.error('❌ データ取得失敗:', response.status);
        alert('データ取得失敗');
      }
    } catch (error) {
      console.error('🚨 フェッチエラー:', error);
      alert('フェッチエラー: ' + (error as Error).message);
    }
  };

  return (
    <Container>
      <TestCard>
        <h1>🧪 CurioCity デバッグモード</h1>
        <p>描画時間: {loadTime}ms</p>
        <p>現在のステップ: {step}</p>
        <p>時刻: {new Date().toLocaleTimeString()}</p>
        
        <div style={{ marginTop: '1rem' }}>
          <Button onClick={handleNext}>
            次のステップ ({step + 1})
          </Button>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <Button onClick={handleTest} style={{ background: '#f59e0b' }}>
            データフェッチテスト
          </Button>
        </div>
        
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
          <p>F12でコンソールを確認してください</p>
          <p>このページがすぐ表示されれば基本機能は正常</p>
        </div>
      </TestCard>
    </Container>
  );
}

export default AppTest;