/**
 * SerenaMCP座標検証システム
 * 雑学データの座標と内容の整合性をチェック
 */

import type { TriviaItem } from '../../types/trivia';

interface ValidationResult {
  id: number;
  title: string;
  coords: { lat: number; lng: number } | null;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
  suggestedFix?: string;
}

export class CoordinateValidator {
  private static instance: CoordinateValidator;

  public static getInstance(): CoordinateValidator {
    if (!CoordinateValidator.instance) {
      CoordinateValidator.instance = new CoordinateValidator();
    }
    return CoordinateValidator.instance;
  }

  /**
   * 雑学データの座標を検証
   */
  public validateTriviaCoordinates(triviaData: TriviaItem[]): ValidationResult[] {
    console.log('🔍 SerenaMCP: 座標検証開始 -', triviaData.length, '件の雑学');
    
    const results: ValidationResult[] = [];

    for (const trivia of triviaData) {
      const result = this.validateSingleTrivia(trivia);
      if (result.issues.length > 0) {
        results.push(result);
      }
    }

    console.log('🔍 SerenaMCP: 検証完了 -', results.length, '件の問題発見');
    return results;
  }

  /**
   * 単一雑学の検証
   */
  private validateSingleTrivia(trivia: TriviaItem): ValidationResult {
    const result: ValidationResult = {
      id: trivia.id,
      title: trivia.title,
      coords: trivia.coords || null,
      issues: [],
      severity: 'low'
    };

    // 1. 座標の存在チェック
    if (!trivia.coords) {
      result.issues.push('座標データが存在しません');
      result.severity = 'medium';
      result.suggestedFix = '雑学の内容から適切な座標を設定してください';
      return result;
    }

    // 2. 座標の妥当性チェック
    const { lat, lng } = trivia.coords;
    
    if (lat < -90 || lat > 90) {
      result.issues.push(`緯度が無効です: ${lat} (範囲: -90 ~ 90)`);
      result.severity = 'high';
    }
    
    if (lng < -180 || lng > 180) {
      result.issues.push(`経度が無効です: ${lng} (範囲: -180 ~ 180)`);
      result.severity = 'high';
    }

    // 3. 内容と座標の整合性チェック
    const locationHints = this.extractLocationHints(trivia);
    const coordinateRegion = this.getRegionFromCoordinates(lat, lng);
    
    if (locationHints.length > 0) {
      const mismatch = this.checkLocationMismatch(locationHints, coordinateRegion, lat, lng);
      if (mismatch) {
        result.issues.push(mismatch);
        result.severity = 'high';
        result.suggestedFix = `${locationHints.join(', ')}の正確な座標に修正してください`;
      }
    }

    return result;
  }

  /**
   * 雑学の内容から地名・国名を抽出
   */
  private extractLocationHints(trivia: TriviaItem): string[] {
    const hints: string[] = [];
    const text = trivia.title + ' ' + trivia.detail;
    
    // 国名パターン
    const countries = [
      'ペルー', 'パリ', 'フランス', '日本', '青森', 'エジプト', 'イタリア', 'アメリカ',
      'ブラジル', 'インド', '中国', 'オーストラリア', 'カナダ', 'ドイツ', 'イギリス',
      'ロシア', '韓国', 'タイ', 'ベトナム', 'メキシコ', 'アルゼンチン', 'チリ',
      '南極', '北極', 'アフリカ', 'ヨーロッパ', 'アジア', '南米', '北米'
    ];
    
    // 都市・地域名パターン
    const places = [
      'ナスカ', 'エッフェル塔', '三内丸山', '東京', '大阪', '京都', '北海道',
      'ニューヨーク', 'ロンドン', 'ローマ', 'バルセロナ', 'アムステルダム',
      'シドニー', 'リオデジャネイロ', 'カイロ', 'ドバイ', 'バンコク'
    ];
    
    for (const country of countries) {
      if (text.includes(country)) {
        hints.push(country);
      }
    }
    
    for (const place of places) {
      if (text.includes(place)) {
        hints.push(place);
      }
    }
    
    return [...new Set(hints)]; // 重複除去
  }

  /**
   * 座標から地域を推定
   */
  private getRegionFromCoordinates(lat: number, lng: number): string {
    // 簡易的な地域判定
    if (lat > 35 && lat < 46 && lng > 129 && lng < 146) return '日本';
    if (lat > 48 && lat < 49 && lng > 2 && lng < 3) return 'パリ';
    if (lat > -15 && lat < -14 && lng > -76 && lng < -75) return 'ペルー・ナスカ';
    if (lat > 29 && lat < 31 && lng > 31 && lng < 32) return 'エジプト';
    if (lat > 41 && lat < 42 && lng > 12 && lng < 13) return 'イタリア・ローマ';
    
    // 大陸レベルの判定
    if (lat > 35 && lat < 70 && lng > -10 && lng < 40) return 'ヨーロッパ';
    if (lat > 10 && lat < 70 && lng > 70 && lng < 150) return 'アジア';
    if (lat > -55 && lat < 15 && lng > -85 && lng < -30) return '南米';
    if (lat > 15 && lat < 70 && lng > -170 && lng < -50) return '北米';
    if (lat > -40 && lat < 40 && lng > -20 && lng < 55) return 'アフリカ';
    
    return '不明';
  }

  /**
   * 地名と座標の不整合をチェック
   */
  private checkLocationMismatch(hints: string[], region: string, lat: number, lng: number): string | null {
    for (const hint of hints) {
      // 明確な不整合パターン
      if (hint.includes('日本') && !region.includes('日本')) {
        return `日本の雑学なのに座標が日本以外 (${region})`;
      }
      if (hint.includes('ペルー') && !region.includes('ペルー')) {
        return `ペルーの雑学なのに座標がペルー以外 (${region})`;
      }
      if (hint.includes('パリ') && !region.includes('パリ')) {
        return `パリの雑学なのに座標がパリ以外 (${region})`;
      }
      if (hint.includes('エジプト') && !region.includes('エジプト')) {
        return `エジプトの雑学なのに座標がエジプト以外 (${region})`;
      }
    }
    
    return null;
  }

  /**
   * 検証結果をコンソールに出力
   */
  public logValidationResults(results: ValidationResult[]): void {
    console.log('\n🔍 === SerenaMCP座標検証レポート ===');
    
    if (results.length === 0) {
      console.log('✅ 全ての雑学の座標が正常です！');
      return;
    }
    
    const highSeverity = results.filter(r => r.severity === 'high');
    const mediumSeverity = results.filter(r => r.severity === 'medium');
    const lowSeverity = results.filter(r => r.severity === 'low');
    
    console.log(`🚨 重大な問題: ${highSeverity.length}件`);
    console.log(`⚠️ 中程度の問題: ${mediumSeverity.length}件`);
    console.log(`💡 軽微な問題: ${lowSeverity.length}件`);
    
    [...highSeverity, ...mediumSeverity, ...lowSeverity].forEach(result => {
      console.log(`\n${result.severity === 'high' ? '🚨' : result.severity === 'medium' ? '⚠️' : '💡'} ID${result.id}: ${result.title}`);
      result.issues.forEach(issue => console.log(`  - ${issue}`));
      if (result.suggestedFix) {
        console.log(`  💡 修正提案: ${result.suggestedFix}`);
      }
    });
    
    console.log('\n=== レポート終了 ===\n');
  }
}

export const coordinateValidator = CoordinateValidator.getInstance();