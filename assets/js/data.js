// ============================================================
// data.js - 単語データの読み込みと検索
// ============================================================

/**
 * 全単語データを管理するシングルトン。
 * words.jsonをロードし、各画面に必要な形で提供する。
 */
export class WordRepository {
  constructor() {
    this.words = [];
    this.byId = new Map();
    this.byCategory = new Map();
    this.bySubcategory = new Map();
    this.subcategoryOrder = {};
    this.categories = [];
    this.totalCount = 0;
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return;
    const res = await fetch('./assets/data/words.json');
    if (!res.ok) throw new Error('Failed to load words.json');
    const data = await res.json();

    this.words = data.words;
    this.categories = data.categories;
    this.subcategoryOrder = data.subcategoryOrder;
    this.totalCount = data.totalCount;

    // インデックスを構築
    this.byId.clear();
    this.byCategory.clear();
    this.bySubcategory.clear();

    for (const w of this.words) {
      this.byId.set(w.id, w);

      if (!this.byCategory.has(w.category)) {
        this.byCategory.set(w.category, []);
      }
      this.byCategory.get(w.category).push(w);

      const subKey = `${w.category}::${w.subcategory}`;
      if (!this.bySubcategory.has(subKey)) {
        this.bySubcategory.set(subKey, []);
      }
      this.bySubcategory.get(subKey).push(w);
    }

    this.loaded = true;
  }

  getAll() {
    return this.words;
  }

  getById(id) {
    return this.byId.get(id);
  }

  getByCategory(category) {
    return this.byCategory.get(category) || [];
  }

  getBySubcategory(category, subcategory) {
    return this.bySubcategory.get(`${category}::${subcategory}`) || [];
  }

  /**
   * フィルタ条件に合う単語を返す。
   * filter = {
   *   categories: Set<string>,
   *   excludedSubcategories: Set<string> (key: "category::sub"),
   *   frequencies: Set<string>,
   * }
   */
  filter(filter) {
    return this.words.filter(w => {
      if (filter.categories && !filter.categories.has(w.category)) return false;
      const subKey = `${w.category}::${w.subcategory}`;
      if (filter.excludedSubcategories && filter.excludedSubcategories.has(subKey)) return false;
      if (filter.frequencies && !filter.frequencies.has(w.frequency)) return false;
      return true;
    });
  }

  /**
   * サブカテゴリの並び順を取得(語数順)
   */
  getSubcategoriesOf(category) {
    return this.subcategoryOrder[category] || [];
  }

  /**
   * サブカテゴリの語数を取得
   */
  getSubcategoryCount(category, subcategory) {
    return (this.bySubcategory.get(`${category}::${subcategory}`) || []).length;
  }

  /**
   * 検索: 英語/日本語の部分一致
   */
  search(query) {
    if (!query || query.trim() === '') return this.words;
    const q = query.toLowerCase().trim();
    return this.words.filter(w =>
      w.english.toLowerCase().includes(q) ||
      w.japanese.includes(q) ||
      w.subcategory.includes(q)
    );
  }

  // ============================================================
  // v4.2 互換エイリアス
  // ============================================================

  getAllWords() {
    return this.words;
  }

  getWord(id) {
    return this.byId.get(id);
  }
}

// シングルトンとして公開
export const wordRepo = new WordRepository();
