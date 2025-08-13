import { useState } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

// 最小限のテスト用アプリ
const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  padding: 2rem;
`;

const Card = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  max-width: 600px;
`;

const Button = styled(motion.button)`
  background: #4facfe;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 2rem;
  font-size: 1.1rem;
  cursor: pointer;
  margin: 0.5rem;
  
  &:hover {
    background: #369bdd;
  }
`;

const ChoiceCard = styled(motion.div)<{ gradient: string }>`
  background: ${props => props.gradient};
  border-radius: 1rem;
  padding: 1.5rem;
  color: white;
  cursor: pointer;
  text-align: center;
  margin: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

function SimpleAppTest() {
  const [showChoices, setShowChoices] = useState(false);
  const [currentTrivia, setCurrentTrivia] = useState({
    title: "エッフェル塔は夏と冬で高さが変わる",
    detail: "パリの象徴エッフェル塔は鉄製のため、夏の暑さで金属が膨張し、約15cm高くなる。逆に冬は収縮して低くなる。"
  });

  const choices = [
    { id: 1, text: "🌟 違う雰囲気の場所へ", desc: "今とは異なる雰囲気を求めて冒険する", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { id: 2, text: "🔮 この雰囲気を深く探る", desc: "この世界をもっと深く知りたい", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
    { id: 3, text: "⚡ 驚きの発見へ", desc: "予想外の場所で新たな発見を", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }
  ];

  const handleChoice = (choice: any) => {
    console.log('選択:', choice.text);
    setShowChoices(false);
    // 簡単な雑学変更
    setCurrentTrivia({
      title: "バナナは実は果物ではなくハーブ",
      detail: "バナナの「木」は実は茎であり、植物学的には世界最大のハーブ植物に分類される。"
    });
  };

  return (
    <AppContainer>
      <Card
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {!showChoices ? (
          <>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ffd700' }}>
              CurioCity テスト
            </h1>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              {currentTrivia.title}
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem', opacity: 0.9 }}>
              {currentTrivia.detail}
            </p>
            <Button
              onClick={() => setShowChoices(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🎯 選択して進む
            </Button>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#ffd700' }}>
              次はどんな場所を訪れますか？
            </h3>
            {choices.map((choice, index) => (
              <ChoiceCard
                key={choice.id}
                gradient={choice.gradient}
                onClick={() => handleChoice(choice)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {choice.text}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  {choice.desc}
                </div>
              </ChoiceCard>
            ))}
            <Button
              onClick={() => setShowChoices(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              ← 戻る
            </Button>
          </>
        )}
      </Card>
    </AppContainer>
  );
}

export default SimpleAppTest;