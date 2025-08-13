import type { TriviaItem, Location, UserChoice } from '../../types/trivia';

/**
 * ユーザー選択システム - 分岐パスと嗜好学習
 */
export class UserChoiceSystem {
  private static instance: UserChoiceSystem;
  private userPreferences: Map<string, number> = new Map(); // タグ -> スコア
  private choiceHistory: Array<{ choiceId: string; timestamp: number }> = [];
  private sessionPreferences: Map<string, number> = new Map();

  private constructor() {
    this.loadPreferences();
  }

  public static getInstance(): UserChoiceSystem {
    if (!UserChoiceSystem.instance) {
      UserChoiceSystem.instance = new UserChoiceSystem();
    }
    return UserChoiceSystem.instance;
  }

  /**
   * 現在の雑学・地点に基づいて選択肢を生成
   */
  generateChoices(currentTrivia: TriviaItem, currentLocation: Location): UserChoice[] {
    const choices: UserChoice[] = [];
    
    // 雰囲気による分岐選択肢（2つ）
    const emotionChoices = this.generateEmotionChoices(currentTrivia);
    choices.push(...emotionChoices.slice(0, 2));

    // 地域・探索による選択肢（1つ）
    const explorationChoice = this.generateExplorationChoice(currentLocation);
    if (explorationChoice) choices.push(explorationChoice);

    // 特別なテーマ選択肢（条件に応じて1つ）
    const specialChoice = this.generateSpecialChoice(currentTrivia, currentLocation);
    if (specialChoice) choices.push(specialChoice);

    // ユーザー嗜好に基づく重み付け調整
    this.adjustChoiceWeights(choices);

    // 3つの選択肢を確保（不足時は補完）
    const finalChoices = this.ensureMinimumChoices(choices, currentTrivia, currentLocation);

    // 最大4つの選択肢に制限
    return finalChoices.slice(0, 4).sort((a, b) => b.weight - a.weight);
  }

  /**
   * 探索・発見系の選択肢生成
   */
  private generateExplorationChoice(currentLocation: Location): UserChoice | null {
    const explorationChoices = [
      {
        id: 'exploration-adventure',
        text: '冒険を求めて',
        description: '未知なる場所への冒険に出発する',
        targetTags: ['冒険', '発見', 'エピック'],
        weight: 7
      },
      {
        id: 'exploration-mystery',
        text: '謎を追って',
        description: '神秘的な場所で新たな発見をする',
        targetTags: ['神秘的', '発見', 'ミステリアス'],
        weight: 7
      },
      {
        id: 'exploration-serenity',
        text: '静寂を求めて',
        description: '心を落ち着ける場所を見つける',
        targetTags: ['静寂', '癒し', 'セレーン'],
        weight: 6
      },
      {
        id: 'exploration-contrast',
        text: '対照的な世界へ',
        description: '今とは全く違う雰囲気の場所に向かう',
        targetTags: currentLocation.type === 'real' ? ['架空世界'] : ['現実世界'],
        weight: 8
      }
    ];

    // 現在地の特性に応じて選択
    if (currentLocation.atmosphere.includes('ミステリアス') || currentLocation.atmosphere.includes('ダーク')) {
      return explorationChoices[2]; // 静寂を求めて
    } else if (currentLocation.atmosphere.includes('セレーン')) {
      return explorationChoices[0]; // 冒険を求めて
    } else {
      return explorationChoices[1]; // 謎を追って
    }
  }

  /**
   * 特別なテーマに基づく選択肢生成
   */
  private generateSpecialChoice(trivia: TriviaItem, _location: Location): UserChoice | null {
    // 雑学の内容に基づく特別な選択肢
    const title = trivia.title.toLowerCase();
    const detail = trivia.detail.toLowerCase();
    
    if (title.includes('古代') || title.includes('遺跡') || detail.includes('歴史')) {
      return {
        id: 'special-time-travel',
        text: '時を超えて',
        description: '古代から未来まで、時代を超えた場所を訪れる',
        targetTags: ['古代', '未来', 'エピック'],
        weight: 9
      };
    }
    
    if (title.includes('科学') || title.includes('技術') || detail.includes('発明')) {
      return {
        id: 'special-future',
        text: '未来への扉',
        description: '科学技術が織りなす未来的な場所へ',
        targetTags: ['未来', '現代', 'ビビッド'],
        weight: 8
      };
    }
    
    if (title.includes('自然') || title.includes('動物') || detail.includes('森') || detail.includes('海')) {
      return {
        id: 'special-nature',
        text: '自然との調和',
        description: '大自然に包まれる癒しの場所へ',
        targetTags: ['癒し', 'セレーン', '森林', '海辺'],
        weight: 7
      };
    }
    
    // フォールバック: 驚きの発見
    return {
      id: 'special-surprise',
      text: '驚きの発見',
      description: '予想もしない場所で新たな驚きと出会う',
      targetTags: ['驚き', '発見', 'ミステリアス'],
      weight: 6
    };
  }

  /**
   * 最低限の選択肢数を確保
   */
  private ensureMinimumChoices(choices: UserChoice[], _trivia: TriviaItem, _location: Location): UserChoice[] {
    if (choices.length >= 3) return choices;

    // 不足分を補完する基本選択肢
    const fallbackChoices: UserChoice[] = [
      {
        id: 'fallback-continue',
        text: '旅を続ける',
        description: '新たな発見を求めて次の場所へ向かう',
        targetTags: ['発見'],
        weight: 5
      },
      {
        id: 'fallback-explore',
        text: '探索する',
        description: '未知の領域を探索する',
        targetTags: ['冒険'],
        weight: 5
      },
      {
        id: 'fallback-wander',
        text: 'さまよう',
        description: '直感のままに新しい場所を見つける',
        targetTags: ['神秘的'],
        weight: 4
      }
    ];

    const needed = 3 - choices.length;
    return [...choices, ...fallbackChoices.slice(0, needed)];
  }

  /**
   * 感情タグに基づく選択肢生成
   */
  private generateEmotionChoices(trivia: TriviaItem): UserChoice[] {
    const choices: UserChoice[] = [];
    const currentEmotions = trivia.tags.emotion;

    // 対照的な感情の選択肢を提供
    const emotionMappings: Record<string, { opposite: string[], related: string[] }> = {
      'ミステリアス': {
        opposite: ['ジョイフル', 'セレーン'],
        related: ['ダーク', 'エピック']
      },
      'ロマンチック': {
        opposite: ['ダーク', 'エピック'],
        related: ['ノスタルジック', 'セレーン']
      },
      'エピック': {
        opposite: ['セレーン', 'ロマンチック'],
        related: ['ミステリアス', 'ダーク']
      },
      'セレーン': {
        opposite: ['エピック', 'ダーク'],
        related: ['ロマンチック', 'ノスタルジック']
      },
      'ダーク': {
        opposite: ['ジョイフル', 'ロマンチック'],
        related: ['ミステリアス', 'メランコリック']
      },
      'ジョイフル': {
        opposite: ['ダーク', 'メランコリック'],
        related: ['ロマンチック']
      },
      'ノスタルジック': {
        opposite: ['ジョイフル'],
        related: ['ロマンチック', 'メランコリック']
      },
      'メランコリック': {
        opposite: ['ジョイフル'],
        related: ['ダーク', 'ノスタルジック']
      }
    };

    // 対照的な感情の選択肢
    currentEmotions.forEach(emotion => {
      const mapping = emotionMappings[emotion];
      if (mapping && mapping.opposite.length > 0) {
        const oppositeEmotion = mapping.opposite[0];
        choices.push({
          id: `emotion-opposite-${oppositeEmotion}`,
          text: this.getEmotionChoiceText(oppositeEmotion),
          description: this.getEmotionDescription(oppositeEmotion),
          targetTags: [oppositeEmotion],
          weight: 8
        });
      }
    });

    // 関連感情の選択肢
    currentEmotions.forEach(emotion => {
      const mapping = emotionMappings[emotion];
      if (mapping && mapping.related.length > 0) {
        const relatedEmotion = mapping.related[Math.floor(Math.random() * mapping.related.length)];
        if (!choices.some(c => c.targetTags.includes(relatedEmotion))) {
          choices.push({
            id: `emotion-related-${relatedEmotion}`,
            text: this.getEmotionChoiceText(relatedEmotion),
            description: this.getEmotionDescription(relatedEmotion),
            targetTags: [relatedEmotion],
            weight: 6
          });
        }
      }
    });

    return choices;
  }

  /**
   * ユーザー嗜好に基づく重み付け調整
   */
  private adjustChoiceWeights(choices: UserChoice[]): void {
    choices.forEach(choice => {
      let preferenceBonus = 0;
      
      choice.targetTags.forEach(tag => {
        const globalPreference = this.userPreferences.get(tag) || 0;
        const sessionPreference = this.sessionPreferences.get(tag) || 0;
        preferenceBonus += (globalPreference * 0.7) + (sessionPreference * 0.3);
      });

      choice.weight += Math.min(preferenceBonus, 3); // 最大3ポイントのボーナス
    });
  }

  /**
   * ユーザーの選択を記録し、嗜好を学習
   */
  recordChoice(choice: UserChoice): void {
    // 選択履歴に追加
    this.choiceHistory.push({
      choiceId: choice.id,
      timestamp: Date.now()
    });

    // セッション内嗜好を更新
    choice.targetTags.forEach(tag => {
      const currentScore = this.sessionPreferences.get(tag) || 0;
      this.sessionPreferences.set(tag, currentScore + 1);
    });

    // グローバル嗜好を更新
    choice.targetTags.forEach(tag => {
      const currentScore = this.userPreferences.get(tag) || 0;
      this.userPreferences.set(tag, currentScore + 0.1);
    });

    // 嗜好をローカルストレージに保存
    this.savePreferences();

    // 古い履歴をクリーンアップ（最新50件のみ保持）
    if (this.choiceHistory.length > 50) {
      this.choiceHistory = this.choiceHistory.slice(-50);
    }
  }

  /**
   * 嗜好データの保存
   */
  private savePreferences(): void {
    try {
      const preferencesData = {
        preferences: Array.from(this.userPreferences.entries()),
        history: this.choiceHistory.slice(-20) // 最新20件のみ保存
      };
      localStorage.setItem('curio-city-preferences', JSON.stringify(preferencesData));
    } catch (error) {
      console.warn('嗜好データの保存に失敗:', error);
    }
  }

  /**
   * 嗜好データの読み込み
   */
  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem('curio-city-preferences');
      if (saved) {
        const data = JSON.parse(saved);
        this.userPreferences = new Map(data.preferences || []);
        this.choiceHistory = data.history || [];
      }
    } catch (error) {
      console.warn('嗜好データの読み込みに失敗:', error);
    }
  }

  /**
   * 嗜好統計の取得
   */
  getPreferenceStats() {
    const totalChoices = this.choiceHistory.length;
    const preferenceEntries = Array.from(this.userPreferences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const sessionEntries = Array.from(this.sessionPreferences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalChoices,
      topPreferences: preferenceEntries,
      sessionPreferences: sessionEntries,
      recentChoices: this.choiceHistory.slice(-10)
    };
  }

  // UI表示用のテキスト生成メソッド群
  private getEmotionChoiceText(emotion: string): string {
    const texts: Record<string, string> = {
      'ミステリアス': '謎に満ちた場所へ',
      'ロマンチック': '愛に溢れた場所へ',
      'エピック': '壮大な景色を求めて',
      'ノスタルジック': '懐かしい思い出の地へ',
      'セレーン': '静寂の世界へ',
      'ダーク': '闇に包まれた場所へ',
      'ジョイフル': '楽しさ溢れる場所へ',
      'メランコリック': '物悲しい美しさを求めて'
    };
    return texts[emotion] || `${emotion}な場所へ`;
  }

  private getEmotionDescription(emotion: string): string {
    const descriptions: Record<string, string> = {
      'ミステリアス': '解き明かされていない謎や秘密に満ちた神秘的な世界',
      'ロマンチック': '愛と美に彩られた心温まる素敵な世界',
      'エピック': 'スケールの大きな壮大で感動的な世界',
      'ノスタルジック': '郷愁を誘う懐かしく美しい世界',
      'セレーン': '静寂と平安に満ちた心落ち着く世界',
      'ダーク': '暗闇に包まれた重厚で深遠な世界',
      'ジョイフル': '喜びと笑顔に溢れた明るい世界',
      'メランコリック': '美しい悲しみに彩られた詩的な世界'
    };
    return descriptions[emotion] || `${emotion}な世界を探索`;
  }


  /**
   * 嗜好データのリセット
   */
  resetPreferences(): void {
    this.userPreferences.clear();
    this.choiceHistory = [];
    this.sessionPreferences.clear();
    localStorage.removeItem('curio-city-preferences');
  }
}