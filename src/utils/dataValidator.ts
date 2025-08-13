import type { TriviaItem, TagDefinition, TriviaData } from '../../types/trivia';

/**
 * 雑学データのバリデーション機能
 */

export class DataValidator {
  private tagDefinition: TagDefinition;

  constructor(tagDefinition: TagDefinition) {
    this.tagDefinition = tagDefinition;
  }

  /**
   * 単一の雑学アイテムを検証
   */
  validateTriviaItem(item: unknown): item is TriviaItem {
    // 必須フィールドの存在確認
    if (!item || typeof item !== 'object') return false;
    const itemObj = item as Record<string, unknown>;
    if (typeof itemObj.id !== 'number') return false;
    if (typeof itemObj.title !== 'string' || itemObj.title.trim() === '') return false;
    if (typeof itemObj.short !== 'string' || itemObj.short.trim() === '') return false;
    if (typeof itemObj.detail !== 'string' || itemObj.detail.trim() === '') return false;

    // タグの検証
    if (!this.validateTags(itemObj.tags)) return false;

    // 座標の検証（オプション）
    if (itemObj.coords && !this.validateCoordinates(itemObj.coords)) return false;

    // 画像配列の検証
    if (!Array.isArray(itemObj.images)) return false;
    if (!itemObj.images.every((img: unknown) => typeof img === 'string')) return false;

    return true;
  }

  /**
   * タグの検証
   */
  private validateTags(tags: unknown): boolean {
    if (!tags || typeof tags !== 'object') return false;
    const tagsObj = tags as Record<string, unknown>;

    // emotion タグの検証
    if (!Array.isArray(tagsObj.emotion)) return false;
    if (!tagsObj.emotion.every((tag: unknown) => typeof tag === 'string' && this.tagDefinition.emotion.includes(tag))) {
      return false;
    }

    // setting タグの検証
    if (!Array.isArray(tagsObj.setting)) return false;
    if (!tagsObj.setting.every((tag: unknown) => typeof tag === 'string' && this.tagDefinition.setting.includes(tag))) {
      return false;
    }

    // palette タグの検証
    if (!Array.isArray(tagsObj.palette)) return false;
    if (!tagsObj.palette.every((tag: unknown) => typeof tag === 'string' && this.tagDefinition.palette.includes(tag))) {
      return false;
    }

    return true;
  }

  /**
   * 座標の検証
   */
  private validateCoordinates(coords: unknown): boolean {
    if (!coords || typeof coords !== 'object') return false;
    const coordsObj = coords as Record<string, unknown>;
    if (typeof coordsObj.lat !== 'number' || coordsObj.lat < -90 || coordsObj.lat > 90) return false;
    if (typeof coordsObj.lng !== 'number' || coordsObj.lng < -180 || coordsObj.lng > 180) return false;
    return true;
  }

  /**
   * 雑学データ全体の検証
   */
  validateTriviaData(data: unknown): data is TriviaData {
    if (!Array.isArray(data)) return false;
    return data.every(item => this.validateTriviaItem(item));
  }

  /**
   * データの整合性チェック
   */
  checkDataIntegrity(data: TriviaData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // IDの重複チェック
    const ids = data.map(item => item.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`重複するID: ${duplicateIds.join(', ')}`);
    }

    // 画像ファイルの存在チェック（警告レベル）
    const allImages = data.flatMap(item => item.images);
    const uniqueImages = [...new Set(allImages)];
    if (uniqueImages.length !== allImages.length) {
      warnings.push('重複する画像ファイルが存在します');
    }

    // タグの使用頻度チェック
    const tagUsage = this.analyzeTagUsage(data);
    Object.entries(tagUsage).forEach(([category, tags]) => {
      Object.entries(tags as Record<string, number>).forEach(([tag, count]) => {
        if (count === 0) {
          warnings.push(`未使用のタグ: ${category}.${tag}`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * タグの使用頻度を分析
   */
  private analyzeTagUsage(data: TriviaData) {
    const usage = {
      emotion: {} as Record<string, number>,
      setting: {} as Record<string, number>,
      palette: {} as Record<string, number>
    };

    // 初期化
    this.tagDefinition.emotion.forEach(tag => usage.emotion[tag] = 0);
    this.tagDefinition.setting.forEach(tag => usage.setting[tag] = 0);
    this.tagDefinition.palette.forEach(tag => usage.palette[tag] = 0);

    // カウント
    data.forEach(item => {
      item.tags.emotion.forEach(tag => usage.emotion[tag]++);
      item.tags.setting.forEach(tag => usage.setting[tag]++);
      item.tags.palette.forEach(tag => usage.palette[tag]++);
    });

    return usage;
  }
}

/**
 * バリデーション結果の型
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}