#!/usr/bin/env node

/**
 * 雑学とロケーションの紐づきチェックスクリプト
 * 不適切なマッピングを特定して報告
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// データファイルを読み込み
const triviaPath = path.join(__dirname, '../public/data/trivia.json');
const locationsPath = path.join(__dirname, '../public/data/locations.json');

const triviaData = JSON.parse(fs.readFileSync(triviaPath, 'utf8'));
const locationsData = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));

// ロケーションIDをマップに変換
const locationMap = new Map();
locationsData.forEach(location => {
  locationMap.set(location.id, location);
});

console.log('🔍 雑学とロケーションの紐づきチェック開始\n');
console.log(`雑学データ数: ${triviaData.length}`);
console.log(`ロケーションデータ数: ${locationsData.length}\n`);

// 問題のあるマッピングを収集
const issues = [];
const orphanedTrivia = [];
const mappingAnalysis = [];

triviaData.forEach(trivia => {
  const location = locationMap.get(trivia.locationId);
  
  if (!location) {
    orphanedTrivia.push({
      id: trivia.id,
      title: trivia.title,
      locationId: trivia.locationId
    });
    return;
  }

  // 内容と地点の関連性をチェック
  const triviaContent = `${trivia.title} ${trivia.detail}`.toLowerCase();
  const locationInfo = `${location.name} ${location.nameEn} ${location.country} ${location.description}`.toLowerCase();
  
  // 地名や国名が内容に含まれているかチェック
  const hasLocationReference = 
    triviaContent.includes(location.name.toLowerCase()) ||
    triviaContent.includes(location.nameEn.toLowerCase()) ||
    triviaContent.includes(location.country.toLowerCase()) ||
    checkGeographicConnection(trivia, location);

  mappingAnalysis.push({
    triviaId: trivia.id,
    triviaTitle: trivia.title,
    locationId: trivia.locationId,
    locationName: location.name,
    locationCountry: location.country,
    hasReference: hasLocationReference,
    triviaSnippet: trivia.detail.substring(0, 100) + '...'
  });

  if (!hasLocationReference) {
    issues.push({
      triviaId: trivia.id,
      triviaTitle: trivia.title,
      locationName: location.name,
      locationCountry: location.country,
      issue: '内容と地点の関連が不明確',
      triviaSnippet: trivia.detail.substring(0, 150) + '...'
    });
  }
});

// 地理的関連をチェック
function checkGeographicConnection(trivia, location) {
  const content = trivia.detail.toLowerCase();
  const country = location.country.toLowerCase();
  
  // 国や地域に関する言及をチェック
  const geographicTerms = {
    '日本': ['日本', 'japan', '富士山', '東京', '京都', '奈良', '広島'],
    'フランス': ['フランス', 'france', 'パリ', 'paris', 'エッフェル'],
    'イタリア': ['イタリア', 'italy', 'ローマ', 'rome', 'ヴェネツィア', 'venice'],
    'エジプト': ['エジプト', 'egypt', 'ピラミッド', 'pyramid', 'ナイル'],
    'イギリス': ['イギリス', 'england', 'uk', 'ロンドン', 'london'],
    'アメリカ': ['アメリカ', 'america', 'usa', 'ニューヨーク', 'ワシントン', 'カリフォルニア'],
    'カナダ': ['カナダ', 'canada', 'トロント', 'toronto', 'メープル'],
    'インド': ['インド', 'india', 'デリー', 'mumbai', 'バンガロール'],
    'アイスランド': ['アイスランド', 'iceland', 'レイキャビク', '温泉', 'サウナ'],
    'ペルー': ['ペルー', 'peru', 'ナスカ', 'マチュピチュ'],
    'ウクライナ': ['ウクライナ', 'ukraine', 'チェルノブイリ', 'chernobyl']
  };

  return geographicTerms[country]?.some(term => content.includes(term)) || false;
}

// 結果を出力
console.log('📊 分析結果\n');

console.log('❌ 孤立した雑学 (対応するロケーションが存在しない):');
if (orphanedTrivia.length === 0) {
  console.log('   なし ✅');
} else {
  orphanedTrivia.forEach(item => {
    console.log(`   ID ${item.id}: ${item.title} (locationId: ${item.locationId})`);
  });
}

console.log('\n⚠️  問題のある紐づき:');
if (issues.length === 0) {
  console.log('   なし ✅');
} else {
  issues.forEach(issue => {
    console.log(`   ID ${issue.triviaId}: "${issue.triviaTitle}"`);
    console.log(`   → ${issue.locationName} (${issue.locationCountry})`);
    console.log(`   → ${issue.issue}`);
    console.log(`   → 内容: ${issue.triviaSnippet}`);
    console.log('');
  });
}

console.log('\n📈 統計:');
console.log(`   適切な紐づき: ${mappingAnalysis.filter(m => m.hasReference).length}/${mappingAnalysis.length}`);
console.log(`   問題のある紐づき: ${issues.length}/${mappingAnalysis.length}`);
console.log(`   孤立した雑学: ${orphanedTrivia.length}`);

// 詳細レポートをファイルに出力
const report = {
  summary: {
    totalTrivia: triviaData.length,
    totalLocations: locationsData.length,
    goodMappings: mappingAnalysis.filter(m => m.hasReference).length,
    problematicMappings: issues.length,
    orphanedTrivia: orphanedTrivia.length
  },
  issues,
  orphanedTrivia,
  allMappings: mappingAnalysis
};

fs.writeFileSync(
  path.join(__dirname, '../mapping-analysis-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n📄 詳細レポートを mapping-analysis-report.json に出力しました');