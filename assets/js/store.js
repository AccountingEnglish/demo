// ============================================================
// store.js - 学習進捗・ユーザー状態の永続化
// localStorageベース。将来IndexedDBに置き換えられるように抽象化。
// ============================================================

const STORAGE_KEY = 'cpa-vocab-app:v1';

/**
 * 単語ごとの学習状態:
 *   correctCount: 正解回数
 *   wrongCount: 不正解回数
 *   lastSeenAt: 最終出題日時
 *   lastResult: 'correct' | 'wrong' | 'unknown' | 'known' | null
 *   selfReportKnow: 「もう知ってる」を押した日数
 *   masteredAt: 習得済みになった日時(null未習得)
 */
function emptyWordState() {
  return {
    correctCount: 0,
    wrongCount: 0,
    lastSeenAt: null,
    lastResult: null,
    selfReportKnow: 0,
    masteredAt: null,
  };
}

class ProgressStore {
  constructor() {
    this.state = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this._default();
      const parsed = JSON.parse(raw);
      // 必要なキーがなければ補完
      return Object.assign(this._default(), parsed);
    } catch (e) {
      return this._default();
    }
  }

  _default() {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      words: {},          // { wordId: WordState }
      recentMistakes: [], // 直近で間違えた wordId の配列(新しい順、最大10)
      todayQuestionId: null,
      todayQuestionDate: null,
      sessionsCompleted: 0,
    };
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state', e);
    }
  }

  getWordState(wordId) {
    return this.state.words[wordId] || emptyWordState();
  }

  /**
   * 学習結果を記録する。
   * result: 'correct' | 'wrong' | 'unknown' | 'known'
   */
  recordResult(wordId, result) {
    const ws = Object.assign(emptyWordState(), this.state.words[wordId] || {});
    const now = new Date().toISOString();

    ws.lastSeenAt = now;
    ws.lastResult = result;

    if (result === 'correct' || result === 'known') {
      ws.correctCount += 1;
    }
    if (result === 'wrong' || result === 'unknown') {
      ws.wrongCount += 1;
      // 直近間違えたリストに追加(先頭、重複除外、上限10件)
      this.state.recentMistakes = [wordId, ...this.state.recentMistakes.filter(id => id !== wordId)].slice(0, 10);
    }

    // 「もう知ってる」フラグ
    if (result === 'self-known') {
      ws.selfReportKnow += 1;
    }

    // シンプル習得判定: 累計正解3回以上、かつ最近不正解がない
    if (ws.correctCount >= 3 && (ws.lastResult === 'correct' || ws.lastResult === 'known')) {
      ws.masteredAt = ws.masteredAt || now;
    }

    this.state.words[wordId] = ws;
    this._save();
  }

  /**
   * 評価を取り消す(戻るボタン用)
   */
  rollbackResult(wordId, prevResult) {
    const ws = this.state.words[wordId];
    if (!ws) return;
    if (prevResult === 'correct' || prevResult === 'known') {
      ws.correctCount = Math.max(0, ws.correctCount - 1);
    }
    if (prevResult === 'wrong' || prevResult === 'unknown') {
      ws.wrongCount = Math.max(0, ws.wrongCount - 1);
    }
    // recentMistakesからも除去
    this.state.recentMistakes = this.state.recentMistakes.filter(id => id !== wordId);
    // lastResultはこの場合元に戻せない(履歴管理するほど重要でないため簡略化)
    this._save();
  }

  /**
   * 直近で間違えた単語IDのリストを返す(新しい順、最大n件)
   */
  getRecentMistakes(n = 5) {
    return this.state.recentMistakes.slice(0, n);
  }

  /**
   * 全体の学習済み語数(累計1回以上正解)
   */
  getLearnedCount() {
    return Object.values(this.state.words).filter(ws => ws.correctCount > 0).length;
  }

  /**
   * カテゴリ別の学習済み語数
   */
  getLearnedCountByCategory(allWords) {
    const result = {};
    for (const w of allWords) {
      const ws = this.state.words[w.id];
      if (ws && ws.correctCount > 0) {
        result[w.category] = (result[w.category] || 0) + 1;
      }
    }
    return result;
  }

  /**
   * 今日の問題を取得/設定する。日付が変わっていたら新しいIDをセットする想定。
   */
  getTodayQuestionId() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.state.todayQuestionDate === today) {
      return this.state.todayQuestionId;
    }
    return null;
  }

  setTodayQuestionId(id) {
    const today = new Date().toISOString().slice(0, 10);
    this.state.todayQuestionDate = today;
    this.state.todayQuestionId = id;
    this._save();
  }

  /**
   * 学習履歴を全消去
   */
  reset() {
    this.state = this._default();
    this._save();
  }

  /**
   * セッション完了をカウント
   */
  incrementSession() {
    this.state.sessionsCompleted += 1;
    this._save();
  }

  getSessionCount() {
    return this.state.sessionsCompleted;
  }

  /**
   * エクスポート用
   */
  export() {
    return JSON.stringify(this.state, null, 2);
  }

  // ============================================================
  // v4.2 互換メソッド (新画面用)
  // ============================================================

  init() {
    // 既にコンストラクタで読み込み済み。互換のため何もしない。
  }

  /**
   * 今日学習した単語数(セッション中の合計)
   */
  getTodayLearnCount() {
    const today = new Date().toISOString().slice(0, 10);
    let count = 0;
    for (const id in this.state.words) {
      const ws = this.state.words[id];
      if (ws.lastSeenAt && ws.lastSeenAt.slice(0, 10) === today) count++;
    }
    return count;
  }

  /**
   * 累計学習済み単語数(エイリアス)
   */
  getTotalLearnedCount() {
    return this.getLearnedCount();
  }

  /**
   * 「もう知ってる」を記録
   */
  markKnown(wordId) {
    this.recordResult(wordId, 'known');
    const ws = this.state.words[wordId];
    if (ws) {
      ws.selfReportKnow = (ws.selfReportKnow || 0) + 1;
      this._save();
    }
  }

  /**
   * フラッシュカードの結果を記録
   * result: 'known' | 'unknown'
   */
  markFlashcardResult(wordId, result) {
    this.recordResult(wordId, result);
  }

  /**
   * クイズの結果を記録
   * result: 'correct' | 'wrong'
   */
  markQuizResult(wordId, result) {
    this.recordResult(wordId, result);
  }

  /**
   * 単語の状態を返す: 'learned' | 'mistake' | 'unknown'
   */
  getStatus(wordId) {
    const ws = this.state.words[wordId];
    if (!ws) return 'unknown';
    if (ws.masteredAt) return 'learned';
    if (ws.correctCount > 0 && (ws.lastResult === 'correct' || ws.lastResult === 'known')) {
      return 'learned';
    }
    if (ws.lastResult === 'wrong' || ws.lastResult === 'unknown') return 'mistake';
    return 'unknown';
  }

  /**
   * 単語の学習統計を返す
   */
  getStats(wordId) {
    const ws = this.state.words[wordId] || emptyWordState();
    return {
      correctCount: ws.correctCount || 0,
      wrongCount: ws.wrongCount || 0,
      selfReportKnow: ws.selfReportKnow || 0,
      lastSeenAt: ws.lastSeenAt,
    };
  }

  /**
   * 間違えた単語IDのリスト
   */
  getMistakeIds() {
    return Object.keys(this.state.words).filter(id => {
      const ws = this.state.words[id];
      return ws.wrongCount > 0 && (ws.lastResult === 'wrong' || ws.lastResult === 'unknown');
    });
  }

  /**
   * 習得済み単語IDのリスト
   */
  getLearnedIds() {
    return Object.keys(this.state.words).filter(id => {
      return this.getStatus(id) === 'learned';
    });
  }
}

export const progressStore = new ProgressStore();
