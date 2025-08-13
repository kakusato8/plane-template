# チケット #01: データ構造設計とJSONスキーマ

## 概要
雑学データの構造設計とJSONファイルの作成、タグ体系の実装

## 要件
- 1000件の雑学データを格納するJSONファイル
- 雑学タグ体系（Emotion / Setting / Palette）の定義
- データスキーマの検証機能

## 詳細タスク

### データ構造
- [x] 雑学データのJSONスキーマ設計
- [x] タグ体系の定義ファイル作成
- [x] サンプルデータ（5件）作成
- [x] データバリデーション機能実装

### ファイル構成
- [x] `data/trivia.json` - 雑学データ本体
- [x] `data/tags.json` - タグ定義
- [x] `types/trivia.ts` - TypeScript型定義
- [x] `src/utils/dataValidator.ts` - バリデーション機能
- [x] `src/utils/dataLoader.ts` - データ読み込み機能

## 成果物
- [x] 完了時にチェック

## 技術仕様
```typescript
interface TriviaItem {
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
  images: string[];
}
```