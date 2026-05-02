// ============================================================
// screens/quiz.js - 4択クイズ画面 (v4.2)
// 正解時: 緑(#10B981)の波紋アニメ + チェック描画
// 不正解時: 赤(#EF4444)のshake
// ============================================================

import { el, icons, svgEl, showToast, shuffle, pickRandom, tap, tapSuccess, tapError } from '../dom.js';
import { wordRepo } from '../data.js';
import { progressStore } from '../store.js';
import { router } from '../router.js';
import { decodeRangeFromUrl } from './range-select.js';

const session = {
  words: [],
  index: 0,
  selected: null,        // 選択された choice のインデックス
  isCorrect: null,       // 正解か?
  feedbackOpen: false,
  results: [],           // 'correct' | 'wrong'
  done: false,
  currentChoices: [],    // 現在の選択肢 (オブジェクトの配列)
  currentCorrectIndex: 0,
};

export function renderQuizSession(params, qs) {
  const range = decodeRangeFromUrl(qs);
  let words = wordRepo.filter({
    categories: range.categories,
    excludedSubcategories: range.excludedSubcategories,
    frequencies: range.frequencies,
  });
  words = shuffle(words);
  if (range.size !== 'all' && Number.isFinite(range.size)) {
    words = words.slice(0, range.size);
  }
  startSession(words);
}

export function renderTodayQuiz() {
  let pool = wordRepo.getAllWords().filter(w => w.frequency === '頻出' || w.frequency === '標準');
  pool = shuffle(pool).slice(0, 20);
  startSession(pool);
}

function startSession(words) {
  if (!words || words.length === 0) {
    showToast('対象の単語がありません');
    router.navigate('/home');
    return;
  }
  if (words.length < 4) {
    showToast('4択クイズは4語以上必要です');
    router.navigate('/home');
    return;
  }
  session.words = words;
  session.index = 0;
  session.selected = null;
  session.isCorrect = null;
  session.feedbackOpen = false;
  session.results = [];
  session.done = false;
  setupChoices();
  render();
}

function setupChoices() {
  const word = session.words[session.index];
  // 不正解候補: 同カテゴリ優先、足りなければ全体から
  const sameCategoryPool = wordRepo.getByCategory(word.category).filter(w => w.id !== word.id);
  const distractorsPool = sameCategoryPool.length >= 3
    ? sameCategoryPool
    : wordRepo.getAllWords().filter(w => w.id !== word.id);
  const distractors = pickRandom(distractorsPool, 3);
  const choices = shuffle([word, ...distractors]);
  session.currentChoices = choices;
  session.currentCorrectIndex = choices.findIndex(c => c.id === word.id);
}

function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';

  if (session.done) {
    root.appendChild(renderDone());
    return;
  }

  const word = session.words[session.index];
  const total = session.words.length;
  const correctCount = session.results.filter(r => r === 'correct').length;

  const page = el('div', { class: 'quiz page--no-tabbar page-enter' }, [
    el('header', { class: 'page-header' }, [
      el('button', {
        class: 'page-header__back',
        type: 'button',
        onClick: () => {
          if (confirm('クイズを中断しますか?')) {
            router.navigate('/home');
          }
        },
      }, '‹'),
      el('span', { class: 'page-header__title' }, '4択クイズ'),
      el('span', { class: 'page-header__counter tabular' }, `${session.index + 1} / ${total}`),
    ]),

    // 進捗バー
    el('div', { class: 'quiz__progress' }, [
      el('div', { class: 'quiz__progress-text' }, [
        el('span', {}, [
          el('span', { class: 'quiz__progress-current' }, String(session.index + 1)),
          el('span', { class: 'tabular' }, ` / ${total}`),
        ]),
        el('span', {}, `正解: ${correctCount}`),
      ]),
      el('div', { class: 'quiz__progress-bar' }, [
        el('div', {
          class: 'quiz__progress-fill',
          style: `width: ${(session.index / total) * 100}%;`,
        }),
      ]),
    ]),

    // ボディ
    el('div', { class: 'quiz__body' }, [
      el('div', { class: 'quiz__prompt-card' }, [
        el('div', { class: 'quiz__pills' }, [
          el('span', { class: 'quiz__pill quiz__pill--primary' }, word.category),
          word.subcategory && word.subcategory !== word.category
            ? el('span', { class: 'quiz__pill quiz__pill--neutral' }, word.subcategory)
            : null,
        ]),
        el('div', { class: 'quiz__instruction' }, '正しい意味を選んでください'),
        el('div', { class: 'quiz__english' }, word.english),
      ]),
      // 選択肢
      el('div', { class: 'quiz__choices' },
        session.currentChoices.map((choice, idx) => renderChoice(choice, idx))
      ),
    ]),

    // フィードバック
    renderFeedback(),
  ]);

  root.appendChild(page);

  // フィードバックがあれば表示
  if (session.selected !== null) {
    setTimeout(() => {
      const fb = document.getElementById('quiz-feedback');
      if (fb) fb.classList.add('is-visible');
    }, 50);
  }
}

function renderChoice(choice, idx) {
  const isCorrectChoice = idx === session.currentCorrectIndex;
  const isSelected = session.selected === idx;
  let stateClass = '';
  if (session.selected !== null) {
    if (isSelected && session.isCorrect) stateClass = 'is-correct';
    else if (isSelected && !session.isCorrect) stateClass = 'is-wrong';
    else if (!isSelected && isCorrectChoice) stateClass = 'is-answer';
  }

  const checkIcon = (session.selected !== null && !session.isCorrect && isCorrectChoice)
    ? svgEl(icons.check, 'quiz-choice__check')
    : null;

  return el('button', {
    class: `quiz-choice ${stateClass}`,
    type: 'button',
    disabled: session.selected !== null,
    onClick: () => onSelectChoice(idx),
  }, [
    el('span', { class: 'quiz-choice__index' }, String(idx + 1)),
    el('span', { class: 'quiz-choice__label' }, choice.japanese),
    checkIcon,
  ]);
}

function onSelectChoice(idx) {
  if (session.selected !== null) return;
  session.selected = idx;
  session.isCorrect = (idx === session.currentCorrectIndex);

  const word = session.words[session.index];
  if (session.isCorrect) {
    tapSuccess();
    progressStore.markQuizResult(word.id, 'correct');
    session.results.push('correct');
  } else {
    tapError();
    progressStore.markQuizResult(word.id, 'wrong');
    session.results.push('wrong');
  }
  session.feedbackOpen = true;
  render();
}

function renderFeedback() {
  if (session.selected === null) return null;
  const word = session.words[session.index];
  const isCorrect = session.isCorrect;

  const iconHtml = isCorrect ? icons.checkCircle : icons.xCircle;

  return el('div', { class: 'quiz-feedback', id: 'quiz-feedback' }, [
    el('div', { class: 'quiz-feedback__head' }, [
      el('div', {
        class: `quiz-feedback__icon ${isCorrect ? 'quiz-feedback__icon--correct' : 'quiz-feedback__icon--wrong'}`,
        html: iconHtml,
      }),
      el('div', { class: 'quiz-feedback__status' }, [
        el('div', {
          class: `quiz-feedback__title ${isCorrect ? 'is-correct' : 'is-wrong'}`,
        }, isCorrect ? '正解!' : 'おしい'),
        el('div', { class: 'quiz-feedback__sub' },
          isCorrect ? 'よくできました' : '正解は緑のものです'
        ),
      ]),
    ]),
    el('div', { class: 'quiz-feedback__meaning' }, [
      el('strong', {}, word.english),
      el('span', {}, ' = '),
      el('span', {}, word.japanese),
    ]),
    el('button', {
      class: 'quiz-feedback__next',
      type: 'button',
      onClick: () => {
        tap();
        next();
      },
    }, session.index >= session.words.length - 1 ? '結果を見る' : '次の問題へ'),
  ]);
}

function next() {
  if (session.index >= session.words.length - 1) {
    session.done = true;
    render();
    return;
  }
  session.index++;
  session.selected = null;
  session.isCorrect = null;
  session.feedbackOpen = false;
  setupChoices();
  render();
}

function renderDone() {
  const total = session.words.length;
  const correct = session.results.filter(r => r === 'correct').length;
  const wrong = total - correct;
  const pct = Math.round((correct / total) * 100);

  return el('div', { class: 'fc page--no-tabbar page-enter' }, [
    el('header', { class: 'page-header' }, [
      el('button', {
        class: 'page-header__close',
        type: 'button',
        onClick: () => router.navigate('/home'),
      }, '×'),
      el('span', { class: 'page-header__title' }, 'クイズ結果'),
      el('span', { style: 'min-width:44px;' }),
    ]),
    el('div', { class: 'fc-done' }, [
      el('div', { class: 'fc-done__celebrate' }, [
        svgEl(icons.trophy, ''),
      ]),
      el('div', {}, [
        el('div', { class: 'fc-done__title' }, '結果発表'),
        el('div', { class: 'fc-done__sub' }, `正解率 ${pct}%`),
      ]),
      el('div', { class: 'fc-done__stats' }, [
        el('div', { class: 'fc-done__stat' }, [
          el('div', { class: 'fc-done__stat-num is-correct tabular' }, String(correct)),
          el('div', { class: 'fc-done__stat-label' }, '正解'),
        ]),
        el('div', { class: 'fc-done__stat' }, [
          el('div', { class: 'fc-done__stat-num is-wrong tabular' }, String(wrong)),
          el('div', { class: 'fc-done__stat-label' }, '不正解'),
        ]),
      ]),
      el('div', { class: 'fc-done__actions' }, [
        el('button', {
          class: 'btn btn--primary btn--full',
          type: 'button',
          onClick: () => { tap(); router.navigate('/home'); },
        }, 'ホームへ戻る'),
        el('button', {
          class: 'btn btn--secondary btn--full',
          type: 'button',
          onClick: () => {
            tap();
            startSession(shuffle(session.words));
          },
        }, 'もう一度'),
      ]),
    ]),
  ]);
}
