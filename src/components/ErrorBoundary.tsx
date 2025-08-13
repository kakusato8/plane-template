import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { theme } from '../styles/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ErrorContainer = styled(motion.div)`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: ${theme.colors.gradients.mystical};
  color: white;
  padding: ${theme.spacing[8]};
  text-align: center;
`;

const ErrorTitle = styled.h1`
  font-family: ${theme.typography.fonts.secondary};
  font-size: ${theme.typography.sizes['4xl']};
  font-weight: ${theme.typography.weights.black};
  margin-bottom: ${theme.spacing[4]};
  color: white;
`;

const ErrorMessage = styled.p`
  font-family: ${theme.typography.fonts.primary};
  font-size: ${theme.typography.sizes.lg};
  margin-bottom: ${theme.spacing[6]};
  max-width: 600px;
  line-height: 1.6;
`;

const RetryButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: ${theme.spacing[3]} ${theme.spacing[6]};
  border-radius: ${theme.borderRadius.xl};
  font-size: ${theme.typography.sizes.base};
  font-weight: ${theme.typography.weights.semibold};
  cursor: pointer;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const ErrorDetails = styled.details`
  margin-top: ${theme.spacing[6]};
  max-width: 800px;
  text-align: left;
  
  summary {
    cursor: pointer;
    font-weight: ${theme.typography.weights.semibold};
    margin-bottom: ${theme.spacing[2]};
  }
  
  pre {
    background: rgba(0, 0, 0, 0.3);
    padding: ${theme.spacing[4]};
    border-radius: ${theme.borderRadius.lg};
    font-size: ${theme.typography.sizes.sm};
    overflow-x: auto;
    white-space: pre-wrap;
  }
`;

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // ページをリロード
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ErrorTitle>CurioCity でエラーが発生しました</ErrorTitle>
          
          <ErrorMessage>
            申し訳ございません。予期しないエラーが発生しました。<br/>
            ページを再読み込みして再試行してください。
          </ErrorMessage>
          
          <RetryButton
            onClick={this.handleRetry}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 ページを再読み込み
          </RetryButton>
          
          {process.env.NODE_ENV === 'development' && (
            <ErrorDetails>
              <summary>🔧 開発者向けエラー情報</summary>
              <pre>
                <strong>エラー:</strong> {this.state.error?.toString()}
                {'\n\n'}
                <strong>スタックトレース:</strong>
                {'\n'}
                {this.state.error?.stack}
                {'\n\n'}
                <strong>コンポーネントスタック:</strong>
                {'\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;