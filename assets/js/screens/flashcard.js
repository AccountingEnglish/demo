// ============================================================
// screens/flashcard.js - フラッシュカード画面 (v4.2)
// 画像4参考: ピル型ラベル、ゆとりあるカード、丸い「<」「>」
// ============================================================

import { el, icons, svgEl, showToast, shuffle, tap, tapSuccess } from '../dom.js';
import { wordRepo } from '../data.js';
import { progressStore } from '../store.js';
import { router } from '../router.js';
import { decodeRangeFromUrl } from './range-select.js';

const session = {
  words: [],
  index: 0,
  flipped: false,
  results: [], // 'known' | 'unknown' | 'skipped'
  startedAt: null,
  done: false,
};

export function renderFlashcardSession(params, qs) {
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

export function renderTodayFlashcard() {
  // 「おまかせ」相当: 頻出+標準を中心に20問
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
  session.words = words;
  session.index = 0;
  session.flipped = false;
  session.results = [];
  session.startedAt = Date.now();
  session.done = false;
  render();
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
  const knownCount = session.results.filter(r => r === 'known').length;

  const page = el('div', { class: 'fc page--no-tabbar page-enter' }, [
    // ヘッダー
    el('header', { class: 'page-header' }, [
      el('button', {
        class: 'page-header__back',
        type: 'button',
        onClick: () => {
          if (confirm('学習を中断しますか?')) {
            router.navigate('/home');
          }
        },
      }, '‹'),
      el('span', { class: 'page-header__title' }, 'カードめくり'),
      el('span', { class: 'page-header__counter tabular' }, `${session.index + 1} / ${total}`),
    ]),

    // 進捗バー
    el('div', { class: 'fc__progress' }, [
      el('div', { class: 'fc__progress-text' }, [
        el('span', {}, [
          el('span', { class: 'fc__progress-current' }, String(session.index + 1)),
          el('span', { class: 'fc__progress-total' }, ` / ${total}`),
        ]),
        el('span', {}, `めくった: ${knownCount}`),
      ]),
      el('div', { class: 'fc__progress-bar' }, [
        el('div', {
          class: 'fc__progress-fill',
          style: `width: ${((session.index) / total) * 100}%;`,
        }),
      ]),
    ]),

    // ボディ
    el('div', { class: 'fc__body' }, [
      // ピル(財務会計+基礎)
      el('div', { class: 'fc__pills' }, [
        el('div', { class: 'fc__pill fc__pill--primary' }, word.category),
        word.subcategory && word.subcategory !== word.category
          ? el('div', { class: 'fc__pill fc__pill--neutral' }, word.subcategory)
          : null,
      ]),
      // カード本体
      renderCard(word),
      // 下部ナビ + 進行ヒント
      el('div', { class: 'fc-nav-row' }, [
        el('button', {
          class: 'fc-nav',
          type: 'button',
          'aria-label': '前のカード',
          disabled: session.index === 0,
          onClick: () => {
            tap();
            if (session.index === 0) return;
            session.index--;
            session.flipped = false;
            session.results.pop(); // 最後の結果を取り消し
            render();
          },
        }, '‹'),
        el('div', { class: 'fc-nav-row__hint' },
          session.flipped ? '評価して次へ' : 'タップで意味の表示'
        ),
        el('button', {
          class: 'fc-nav',
          type: 'button',
          'aria-label': '次へスキップ',
          onClick: () => {
            tap();
            session.results.push('skipped');
            advance();
          },
        }, '›'),
      ]),
    ]),

    // フッター: 自己評価ボタン
    renderFooter(),
  ]);

  root.appendChild(page);
}

function renderCard(word) {
  const card = el('div', {
    class: 'fc-card',
    onClick: (e) => {
      // 「もう知ってる」内のクリックは無視
      if (e.target.closest('.fc-card__know')) return;
      if (e.target.closest('.fc-card__view-detail')) return;
      tap();
      session.flipped = !session.flipped;
      // フリップアニメ
      const c = e.currentTarget;
      c.classList.add('is-flipping');
      setTimeout(() => {
        c.classList.remove('is-flipping');
        render();
      }, 140);
    },
  });

  // もう知ってる
  card.appendChild(el('button', {
    class: 'fc-card__know',
    type: 'button',
    onClick: (e) => {
      e.stopPropagation();
      tap();
      progressStore.markKnown(word.id);
      session.results.push('known');
      showToast('「もう知ってる」に登録しました');
      advance();
    },
  }, 'もう知ってる'));

  if (session.flipped) {
    // 裏面
    const back = el('div', { class: 'fc-card__back' }, [
      el('div', { class: 'fc-card__english-small' }, word.english),
      el('div', { class: 'fc-card__japanese' }, word.japanese),
      word.description ? el('div', { class: 'fc-card__description' }, word.description) : null,
      el('div', { class: 'fc-card__standards' }, [
        el('div', {}, [
          word.relatedStandards && word.relatedStandards.length > 0
            ? (() => {
                const wrap = el('div', { style: 'display:flex; gap:6px; flex-wrap:wrap; align-items:center;' });
                wrap.appendChild(el('span', { class: 'fc-card__standards-label' }, '関連基準'));
                for (const s of word.relatedStandards) {
                  wrap.appendChild(el('span', { class: 'fc-card__standard-pill' }, s));
                }
                return wrap;
              })()
            : el('span', { class: 'fc-card__standards-label' }, ''),
        ]),
        el('span', {
          class: 'fc-card__view-detail',
          onClick: (e) => {
            e.stopPropagation();
            tap();
            router.navigate('/word/' + word.id);
          },
        }, '詳細'),
      ]),
    ]);
    card.appendChild(back);
  } else {
    // 表面
    const front = el('div', { class: 'fc-card__front' }, [
      el('div', { class: 'fc-card__english' }, word.english),
      el('div', { class: 'fc-card__hint' }, 'タップで意味を見る'),
    ]);
    card.appendChild(front);
  }

  return card;
}

function renderFooter() {
  return el('div', { class: 'fc-footer' }, [
    el('button', {
      class: 'fc-footer__btn fc-footer__btn--unknown',
      type: 'button',
      onClick: () => {
        tap();
        const word = session.words[session.index];
        progressStore.markFlashcardResult(word.id, 'unknown');
        session.results.push('unknown');
        advance();
      },
    }, 'わからない'),
    el('button', {
      class: 'fc-footer__btn fc-footer__btn--known',
      type: 'button',
      onClick: () => {
        tapSuccess();
        const word = session.words[session.index];
        progressStore.markFlashcardResult(word.id, 'known');
        session.results.push('known');
        advance();
      },
    }, '覚えた'),
  ]);
}

function advance() {
  if (session.index >= session.words.length - 1) {
    session.done = true;
    render();
    return;
  }
  session.index++;
  session.flipped = false;
  render();
}

function renderDone() {
  const total = session.words.length;
  const known = session.results.filter(r => r === 'known').length;
  const unknown = session.results.filter(r => r === 'unknown').length;

  return el('div', { class: 'fc page--no-tabbar page-enter' }, [
    el('header', { class: 'page-header' }, [
      el('button', {
        class: 'page-header__close',
        type: 'button',
        onClick: () => router.navigate('/home'),
      }, '×'),
      el('span', { class: 'page-header__title' }, '学習結果'),
      el('span', { style: 'min-width:44px;' }),
    ]),
    el('div', { class: 'fc-done' }, [
      el('div', { class: 'fc-done__celebrate' }, [
        svgEl(icons.trophy, ''),
      ]),
      el('div', {}, [
        el('div', { class: 'fc-done__title' }, 'お疲れさまでした'),
        el('div', { class: 'fc-done__sub' }, `${total}語の学習が完了しました`),
      ]),
      el('div', { class: 'fc-done__stats' }, [
        el('div', { class: 'fc-done__stat' }, [
          el('div', { class: 'fc-done__stat-num is-correct tabular' }, String(known)),
          el('div', { class: 'fc-done__stat-label' }, '覚えた'),
        ]),
        el('div', { class: 'fc-done__stat' }, [
          el('div', { class: 'fc-done__stat-num is-wrong tabular' }, String(unknown)),
          el('div', { class: 'fc-done__stat-label' }, '不安'),
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
