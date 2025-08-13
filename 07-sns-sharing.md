# チケット #07: SNS共有機能

## 概要
雑学と画像をSNSで共有する機能、画像カード生成システムの実装

## 要件
- テキストリンク共有
- 画像カード自動生成
- 短縮版テキストの作成

## 詳細タスク

### 共有コンテンツ生成
- [x] 短縮版テキストの自動生成
- [x] 画像カードのデザインテンプレート
- [x] 雰囲気に応じたカードスタイル

### 画像カード生成
- [x] Canvas APIを使用した画像生成
- [x] 背景画像 + テキストの合成
- [x] 各種SNSサイズ対応

### SNS連携
- [x] Twitter/X共有機能
- [x] Facebook共有機能
- [x] LINE共有機能
- [x] クリップボードコピー機能

### メタデータ最適化
- [x] Open Graph タグの設定
- [x] Twitter Cardの設定
- [x] 動的メタデータ生成

## 成果物
- [x] 完了時にチェック

## 技術実装
```typescript
interface ShareContent {
  text: string;
  shortText: string;
  imageUrl: string;
  url: string;
  hashtags: string[];
}

function generateShareCard(trivia: TriviaItem, background: string): string {
  // Canvas APIで画像カード生成
}
```