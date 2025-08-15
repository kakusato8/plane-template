#!/usr/bin/env node

/**
 * 雑学とロケーションの不適切な紐づきを修正
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const triviaPath = path.join(__dirname, '../public/data/trivia.json');
const locationsPath = path.join(__dirname, '../public/data/locations.json');

let triviaData = JSON.parse(fs.readFileSync(triviaPath, 'utf8'));
const locationsData = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));

// 利用可能なロケーションIDのマップを作成
const locationMap = new Map();
locationsData.forEach(location => {
  locationMap.set(location.id, location);
});

console.log('🔧 雑学-ロケーション紐づき修正開始\n');

// 修正対象の雑学と適切なロケーションのマッピング
const corrections = [
  // 明らかに不適切なマッピングを修正
  {
    triviaId: 28,
    oldLocationId: "amsterdam",
    newLocationId: "amsterdam", // 自転車の街なので実は適切
    reason: "アムステルダムは自転車の街として有名なので適切"
  },
  {
    triviaId: 30,
    oldLocationId: "vienna",
    newLocationId: "vienna", // 音楽の都なので適切
    reason: "ウィーンは音楽の都として有名なので適切"
  },
  {
    triviaId: 45,
    oldLocationId: "tokyo-asakusa",
    newLocationId: "tokyo-asakusa", // 桜祭りで有名なので適切
    reason: "浅草は桜祭りで有名なので適切"
  },
  // 一般的すぎる雑学は汎用的なロケーションに
  {
    triviaId: 44,
    oldLocationId: "warsaw",
    newLocationId: "new-york-liberty", // 脳の雑学→自由の女神（知識の象徴）
    reason: "脳の雑学を知識・自由の象徴である自由の女神に関連付け"
  },
  {
    triviaId: 42,
    oldLocationId: "zurich",
    newLocationId: "zurich", // 時間・精密さでスイスは適切
    reason: "スイスは精密時計で有名なので時間の雑学に適切"
  },
  // 地理的関連を重視した修正
  {
    triviaId: 1,
    oldLocationId: "nasca",
    newLocationId: "mount-fuji", // 高地の呼吸→富士山
    reason: "高地での呼吸の話なので富士山が適切"
  },
  {
    triviaId: 19,
    oldLocationId: "sundarbans",
    newLocationId: "sundarbans", // マングローブの話なので適切
    reason: "シュンドルボンはマングローブ林で有名なので適切"
  },
  // より具体的な地理的関連に修正
  {
    triviaId: 65,
    oldLocationId: "taipei",
    newLocationId: "tokyo-asakusa", // 夜市→夜の文化
    reason: "台北101より東京の夜の文化的な場所が適切"
  }
];

let changesCount = 0;

corrections.forEach(correction => {
  const trivia = triviaData.find(t => t.id === correction.triviaId);
  if (trivia) {
    if (trivia.locationId !== correction.newLocationId) {
      console.log(`✏️  修正: ID ${correction.triviaId} "${trivia.title}"`);
      console.log(`   ${correction.oldLocationId} → ${correction.newLocationId}`);
      console.log(`   理由: ${correction.reason}`);
      
      trivia.locationId = correction.newLocationId;
      changesCount++;
    }
  } else {
    console.log(`⚠️  警告: ID ${correction.triviaId} が見つかりません`);
  }
});

// 内容ベースの自動修正（地名が直接言及されている場合）
const autoCorrections = [
  // 富士山関連
  { pattern: /富士山/i, locationId: "mount-fuji" },
  // パリ・エッフェル塔関連
  { pattern: /エッフェル|パリ/i, locationId: "paris-eiffel" },
  // ヴェネツィア関連
  { pattern: /ヴェネツィア|ベニス/i, locationId: "venice" },
  // 東京関連
  { pattern: /東京|浅草/i, locationId: "tokyo-asakusa" },
  // トロント・カナダ関連
  { pattern: /トロント|メープル/i, locationId: "toronto" },
  // アイスランド関連
  { pattern: /アイスランド|レイキャビク|温泉|サウナ/i, locationId: "reykjavik" }
];

triviaData.forEach(trivia => {
  const content = `${trivia.title} ${trivia.detail}`;
  
  autoCorrections.forEach(auto => {
    if (auto.pattern.test(content) && trivia.locationId !== auto.locationId) {
      const location = locationMap.get(auto.locationId);
      if (location) {
        console.log(`🤖 自動修正: ID ${trivia.id} "${trivia.title}"`);
        console.log(`   ${trivia.locationId} → ${auto.locationId}`);
        console.log(`   パターン検出: ${auto.pattern.source}`);
        
        trivia.locationId = auto.locationId;
        changesCount++;
      }
    }
  });
});

if (changesCount > 0) {
  // バックアップを作成
  const backupPath = path.join(__dirname, '../public/data/trivia_before_mapping_fix.json');
  fs.writeFileSync(backupPath, fs.readFileSync(triviaPath));
  
  // 修正されたデータを保存
  fs.writeFileSync(triviaPath, JSON.stringify(triviaData, null, 2));
  
  console.log(`\n✅ 修正完了: ${changesCount}件の紐づきを修正しました`);
  console.log(`📄 バックアップ: trivia_before_mapping_fix.json に保存`);
} else {
  console.log('\n✨ 修正対象が見つかりませんでした');
}

console.log('\n📊 修正後の検証を実行することをお勧めします');