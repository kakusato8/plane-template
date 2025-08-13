/**
 * ナビゲーションボタンのヘルパー関数
 */

// ランダムな位置生成用のヘルパー関数
export const generateRandomPosition = (
  containerWidth: number,
  containerHeight: number,
  buttonWidth: number = 200,
  buttonHeight: number = 50,
  margin: number = 50
) => {
  const maxX = containerWidth - buttonWidth - margin;
  const maxY = containerHeight - buttonHeight - margin;
  
  return {
    x: Math.max(margin, Math.random() * maxX),
    y: Math.max(margin, Math.random() * maxY),
  };
};