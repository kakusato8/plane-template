# CurioCity Pexels セマンティック画像システム実装ガイド

## 📋 実装概要

CurioCityの画像システムをPicsum PhotosからPexels APIベースのセマンティック理解システムに移行しました。この実装により、雑学内容に最適化された関連性の高い美しい画像を提供できます。

## 🧠 セマンティック理解機能

### 1. 地域・場所の理解
- **日本語→英語変換**: "ナスカ" → "nazca", "エッフェル塔" → "eiffel tower"
- **国名マッピング**: "ペルー" → "peru", "フランス" → "france"
- **位置情報活用**: 地点の英語名を活用

### 2. 感情タグの理解
```typescript
感情マッピング例:
- "ミステリアス" → "mysterious dark moody"
- "ロマンチック" → "romantic sunset beautiful"
- "エピック" → "epic dramatic magnificent"
```

### 3. 設定タグの理解
```typescript
設定マッピング例:
- "砂漠" → "desert sand dunes"
- "古代遺跡" → "ancient ruins historical"
- "都市夜景" → "city skyline night"
```

## 🚀 API設定方法

### 1. Pexels APIキーの取得
1. [Pexels API](https://www.pexels.com/api/) でアカウント作成
2. 無料APIキーを取得（月200回まで無料）
3. 環境変数ファイルに設定

### 2. 環境変数設定
```bash
# .env ファイルに追加
VITE_PEXELS_API_KEY=your_pexels_api_key_here
```

### 3. フォールバック機能
- Pexels API未設定時: 自動的にPicsum Photosを使用
- API制限到達時: Picsum Photosにフォールバック
- ネットワークエラー時: 美しいCSSグラデーションを表示

## 📁 実装ファイル

### 新規作成
- `/src/utils/pexelsImageService.ts` - Pexels APIサービス
- `/PEXELS_IMPLEMENTATION_GUIDE.md` - この実装ガイド

### 更新ファイル
- `/src/components/BeautifulBackgroundImage.tsx` - Pexels優先使用に変更
- `/src/components/SerenaMCPDebugPanel.tsx` - Pexels状況監視に変更
- `/.env.example` - Pexels API key設定を追加

## 🎯 セマンティック検索の例

### 雑学例1: "ペルーのナスカの地上絵"
```
抽出されるキーワード:
- 地域: "nazca", "peru"
- 設定: "desert", "sand", "dunes", "ancient", "ruins", "historical"
- 感情: "mysterious", "dark", "moody", "epic", "dramatic", "magnificent"

最終検索クエリ: "nazca peru ancient"
```

### 雑学例2: "パリのエッフェル塔"
```
抽出されるキーワード:
- 地域: "eiffel tower", "france"
- 設定: "city", "skyline", "night"
- 感情: "romantic", "sunset", "beautiful", "vintage", "nostalgic", "historic"

最終検索クエリ: "eiffel tower romantic"
```

## 📊 パフォーマンス機能

### 1. キャッシュシステム
- **持続時間**: 24時間
- **対象**: API検索結果
- **効果**: 同一クエリの重複API呼び出し防止

### 2. レート制限対応
- **間隔制御**: 最小1秒間隔
- **制限対応**: 月200回の制限を考慮
- **エラー処理**: 制限到達時の自動フォールバック

### 3. 並列処理最適化
- **タイムアウト**: Pexels 8秒、Picsum 5秒
- **フォールバック**: 段階的な画像品質選択
- **エラー回復**: 完全失敗時のCSS背景生成

## 🔧 開発・デバッグ

### SerenaMCPデバッグパネル
開発モードで右上の「🎯 SerenaMCP」ボタンをクリックして監視パネルを表示:

- **API状況**: Pexels API key設定状況
- **セマンティック機能**: 地域抽出、感情マッピング状況
- **フォールバック**: Picsum Photos準備状況
- **設定ガイド**: API key未設定時の設定手順

### デバッグログ
```javascript
// Pexels API呼び出し成功
console.log('✅ Pexels API成功:', { query, totalResults, receivedPhotos })

// セマンティック解析
console.log('🧠 セマンティック解析開始:', { title, location, emotion, setting })

// フォールバック使用
console.log('🔄 Picsumフォールバック画像生成')
```

## 💡 使用法

### 基本使用
```typescript
import { pexelsImageService } from '../utils/pexelsImageService';

// セマンティック検索クエリ生成
const query = pexelsImageService.generateSemanticQuery(trivia, location);

// 画像URL生成
const imageUrls = await pexelsImageService.generateSemanticImageUrls(trivia, location);
```

### 設定確認
```typescript
// API key設定確認
const isConfigured = pexelsImageService.isApiKeyAvailable();

// キャッシュクリア
pexelsImageService.clearCache();
```

## 🎨 品質向上効果

### Before (Picsum Photos)
- **問題**: ランダム画像、内容との関連性なし
- **種類**: 限定的、ID ベース選択
- **検索**: なし

### After (Pexels セマンティック)
- **改善**: 雑学内容に最適化された関連画像
- **種類**: 豊富、プロ品質写真
- **検索**: 日本語理解、感情・設定マッピング
- **フォールバック**: 複数段階の代替案

## 🛡️ エラーハンドリング

### 1. API制限
- 月200回の制限に到達した場合、自動的にPicsumに切り替え
- レート制限に配慮した1秒間隔制御

### 2. ネットワークエラー
- タイムアウト: Pexels 8秒、Picsum 5秒
- 失敗時: 美しいCSSグラデーション背景を生成

### 3. 設定ミス
- API key未設定: Picsumを使用、デバッグパネルでガイド表示
- 無効なAPI key: エラーログ記録、フォールバック実行

## 📚 今後の拡張

### 1. さらなるセマンティック理解
- 季節・時間帯の考慮
- 文化的背景の理解
- より詳細な地域マッピング

### 2. API統合拡張
- Unsplash API復活
- 他の画像APIとの統合
- AI生成画像の活用

### 3. パフォーマンス最適化
- 画像プリロード強化
- WebP形式対応
- CDN活用

---

このセマンティック理解システムにより、CurioCityの各雑学に最適化された美しく関連性の高い画像を提供し、ユーザーエクスペリエンスを大幅に向上させます。