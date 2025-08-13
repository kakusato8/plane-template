# チケット #04: 雑学表示システム

## 概要
選択された地点に応じた雑学の表示と雰囲気に合った背景画像の選択

## 要件
- 地点に関連する雑学の自動選択
- タグに基づく背景画像マッチング
- 短文と詳細解説の段階的表示

## 詳細タスク

### 雑学選択ロジック
- [x] 地点と雑学のマッチングアルゴリズム
- [x] タグベースの関連性スコア計算  
- [x] 同一雑学の重複表示回避

### 背景画像システム
- [x] タグと画像のマッピング機能
- [x] 雰囲気スコアによる画像選択
- [x] 地点タイプ別背景効果（架空都市はブラー効果）

### 表示制御
- [x] 短文表示 → 詳細表示の遷移
- [x] 読み取り時間の推定機能
- [x] 複雑度レベル判定
- [x] 関連キーワード抽出

### 追加実装
- [x] TriviaDisplaySystem クラス
- [x] カテゴリ自動分類機能
- [x] 推奨コンテキスト生成
- [x] ハッシュベース画像選択

## 成果物
- [x] 完了時にチェック

## 実装方針
```typescript
interface TriviaDisplayProps {
  location: Location;
  triviaData: TriviaItem[];
  onComplete: () => void;
}

function selectTriviaForLocation(location: Location, data: TriviaItem[]): TriviaItem {
  // 位置情報とタグに基づく選択
}
```