import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { theme } from './styles/theme';
import NavigationButton from './components/NavigationButton';
import { SerenaAnimatedContainer } from './components/SerenaAnimatedContainer';
import { SerenaMorphingBox } from './components/SerenaMorphingBox';
import { SerenaComfortableContainer } from './components/SerenaComfortableContainer';
import { SerenaBallTransformContainer } from './components/SerenaBallTransformContainer';
import { InstantText } from './components/InstantText';

const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: ${theme.colors.gradients.mystical};
`;

const ContentArea = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing[6]};
  z-index: 2;
`;

const WelcomeCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: ${theme.borderRadius['2xl']};
  padding: ${theme.spacing[8]};
  max-width: 600px;
  width: 90%;
  text-align: center;
  box-shadow: ${theme.shadows.xl};
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const Title = styled.h1`
  font-family: ${theme.typography.fonts.secondary};
  font-size: ${theme.typography.sizes['3xl']};
  font-weight: ${theme.typography.weights.bold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[4]};
  background: ${theme.colors.gradients.mystical};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.lg};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing[6]};
  line-height: 1.6;
`;

const ComponentSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[6]};
`;

const ComponentButton = styled(NavigationButton)<{ isActive: boolean }>`
  background: ${props => props.isActive 
    ? theme.colors.gradients.mystical 
    : 'rgba(255, 255, 255, 0.1)'
  };
  border: 1px solid ${props => props.isActive ? 'transparent' : theme.colors.primary[300]};
  color: ${props => props.isActive ? 'white' : theme.colors.text.primary};
`;

const DemoArea = styled.div`
  min-height: 200px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: ${theme.spacing[6]} 0;
  border: 2px dashed rgba(0, 0, 0, 0.1);
  border-radius: ${theme.borderRadius.lg};
  background: rgba(255, 255, 255, 0.05);
`;

interface SerenaAppProps {}

const SerenaApp: React.FC<SerenaAppProps> = () => {
  const [selectedComponent, setSelectedComponent] = useState<string>('welcome');
  const [isAnimating, setIsAnimating] = useState(false);

  const components = [
    { key: 'welcome', name: 'ウェルカム' },
    { key: 'animated', name: 'アニメ' },
    { key: 'morphing', name: 'モーフィング' },
    { key: 'comfortable', name: 'コンフォート' },
    { key: 'ball', name: 'ボール変形' },
    { key: 'text', name: 'インスタント' },
  ];

  const renderSelectedComponent = () => {
    const commonProps = {
      style: { width: '100%', maxWidth: '400px' }
    };

    switch (selectedComponent) {
      case 'animated':
        return (
          <SerenaAnimatedContainer {...commonProps}>
            <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
              <h3>Serena アニメーテッドコンテナ</h3>
              <p>美しいアニメーション効果で表示されます</p>
            </div>
          </SerenaAnimatedContainer>
        );
      
      case 'morphing':
        return (
          <SerenaMorphingBox {...commonProps}>
            <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
              <h3>Serena モーフィングボックス</h3>
              <p>形状が流動的に変化します</p>
            </div>
          </SerenaMorphingBox>
        );
      
      case 'comfortable':
        return (
          <SerenaComfortableContainer {...commonProps}>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h3 style={{ color: theme.colors.primary[600] }}>Serena コンフォートコンテナ</h3>
              <p style={{ color: theme.colors.text.secondary }}>心地よい表示体験を提供します</p>
            </div>
          </SerenaComfortableContainer>
        );
      
      case 'ball':
        return (
          <SerenaBallTransformContainer {...commonProps}>
            <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
              <h3>Serena ボール変形コンテナ</h3>
              <p>球体から展開するような効果</p>
            </div>
          </SerenaBallTransformContainer>
        );
      
      case 'text':
        return (
          <InstantText 
            text="Serena InstantText コンポーネント - 瞬時に美しく表示されるテキスト"
            speed={50}
            style={{ 
              fontSize: '18px', 
              color: theme.colors.primary[600],
              textAlign: 'center',
              maxWidth: '400px'
            }}
          />
        );
      
      default:
        return (
          <div style={{ textAlign: 'center', color: 'white', padding: '40px' }}>
            <h3>CurioCity x Serena システム</h3>
            <p>上記のコンポーネントを選択してテストしてください</p>
          </div>
        );
    }
  };

  const handleComponentSelect = (componentKey: string) => {
    if (componentKey === selectedComponent) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedComponent(componentKey);
      setIsAnimating(false);
    }, 200);
  };

  return (
    <AppContainer>
      <ContentArea>
        <WelcomeCard>
          <Title>CurioCity - Serena Demo</Title>
          <Subtitle>
            SerenaMCPシステムのコンポーネントテスト環境
          </Subtitle>
          
          <ComponentSelector>
            {components.map((component) => (
              <ComponentButton
                key={component.key}
                variant={selectedComponent === component.key ? 'primary' : 'secondary'}
                size="small"
                isActive={selectedComponent === component.key}
                onClick={() => handleComponentSelect(component.key)}
              >
                {component.name}
              </ComponentButton>
            ))}
          </ComponentSelector>

          <DemoArea>
            {!isAnimating && renderSelectedComponent()}
          </DemoArea>

          <NavigationButton
            variant="mystical"
            size="large"
            onClick={() => {
              console.log('メインアプリに戻る処理');
              // メインアプリケーションに戻る処理をここに実装
            }}
          >
            メインアプリに戻る
          </NavigationButton>
        </WelcomeCard>
      </ContentArea>
    </AppContainer>
  );
};

export default SerenaApp;