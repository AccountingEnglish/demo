// ============================================================
// screens/home.js - ホーム画面 (v4.2)
// ============================================================

import { el, icons, svgEl, formatDateJa, createFlame, pickOne, tap } from '../dom.js';
import { renderTabBar } from '../tabbar.js';
import { wordRepo } from '../data.js';
import { progressStore } from '../store.js';
import { router } from '../router.js';

/**
 * QOTD: 今日の一問
 * - 今日の日付を seed にして、頻出単語からランダムに1つ選ぶ(同じ日は同じ語)
 */
function pickQuestionOfToday() {
  const all = wordRepo.getAllWords().filter(w => w.frequency === '頻出' || w.frequency === '標準');
  if (all.length === 0) return wordRepo.getAllWords()[0];
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const idx = seed % all.length;
  return all[idx];
}

function todayCount() {
  return progressStore.getTodayLearnCount();
}

function totalLearnedCount() {
  return progressStore.getTotalLearnedCount();
}

function recentlyMistakeWords(limit = 3) {
  const ids = progressStore.getRecentMistakes(limit);
  return ids.map(id => wordRepo.getWord(id)).filter(Boolean);
}

export function renderHome() {
  const root = document.getElementById('app');
  root.innerHTML = '';

  const page = el('main', { class: 'page page-enter', id: 'home-page' });

  const qotd = pickQuestionOfToday();
  const learned = totalLearnedCount();
  const today = todayCount();
  const total = wordRepo.getAllWords().length;
  const recent = recentlyMistakeWords(3);

  const home = el('div', { class: 'home' }, [
    // 1. 日付 + ブランド
    el('div', { class: 'home__date fade-in' }, [
      el('span', { class: 'home__date-day' }, formatDateJa()),
      el('span', { class: 'home__brand' }, [
        svgEl(icons.flame(14, true), ''),
        el('span', {}, 'Lex Cuentas'),
      ]),
    ]),

    // 2. 今日の一問
    renderQOTD(qotd),

    // 3. 学習選択
    el('div', { class: 'home__learn' }, [
      el('button', {
        class: 'btn-now fade-in stagger-1',
        type: 'button',
        onClick: () => { tap(); router.navigate('/range/quiz'); },
      }, [
        svgEl(icons.zap, 'btn-now__icon'),
        el('span', {}, '今すぐ学習'),
      ]),
      el('div', { class: 'home__modes fade-in stagger-2' }, [
        el('button', {
          class: 'btn-mode',
          type: 'button',
          onClick: () => { tap(); router.navigate('/range/flashcard'); },
        }, [
          svgEl(icons.cards, 'btn-mode__icon'),
          el('span', {}, 'カードめくり'),
        ]),
        el('button', {
          class: 'btn-mode',
          type: 'button',
          onClick: () => { tap(); router.navigate('/range/quiz'); },
        }, [
          svgEl(icons.quiz, 'btn-mode__icon'),
          el('span', {}, '4択クイズ'),
        ]),
      ]),
    ]),

    // 4. 直近、間違えた単語
    recent.length > 0 ? renderRecent(recent) : null,

    // 5. 進捗
    renderProgress(today, learned, total),
  ]);

  page.appendChild(home);
  page.appendChild(renderTabBar('home'));
  root.appendChild(page);
}

function renderQOTD(word) {
  const card = el('div', { class: 'qotd fade-in' }, [
    el('div', { class: 'qotd__label' }, [
      el('span', { class: 'qotd__label-text' }, '今日の一問'),
      el('span', { class: 'qotd__num' }, formatDateJa().split(' ')[0]),
    ]),
    el('div', { class: 'qotd__english' }, word.english),
    el('button', {
      class: 'qotd__action',
      type: 'button',
      onClick: (e) => {
        tap();
        const ans = card.querySelector('.qotd__answer');
        if (ans.classList.contains('is-visible')) {
          // 詳細へ
          router.navigate('/word/' + word.id);
        } else {
          ans.classList.add('is-visible');
          e.target.textContent = '詳しく見る';
        }
      },
    }, '意味を見る'),
    el('div', { class: 'qotd__answer' }, [
      el('div', { class: 'qotd__japanese' }, word.japanese),
      el('div', { class: 'qotd__meta' }, word.subcategory),
    ]),
  ]);
  return card;
}

function renderRecent(words) {
  const list = el('div', { class: 'recent__list' });
  for (const w of words) {
    list.appendChild(el('div', {
      class: 'recent__item',
      onClick: () => { tap(); router.navigate('/word/' + w.id); },
    }, [
      el('span', { class: 'recent__english' }, w.english),
      el('span', { class: 'recent__japanese' }, w.japanese),
    ]));
  }

  return el('div', { class: 'recent fade-in stagger-3' }, [
    el('div', { class: 'recent__head' }, [
      el('div', { class: 'section-label' }, '間違えた単語'),
      el('button', {
        class: 'btn--text',
        type: 'button',
        onClick: () => { tap(); router.navigate('/list?filter=mistake'); },
      }, 'すべて見る'),
    ]),
    list,
  ]);
}

function renderProgress(today, learned, total) {
  const pct = Math.min(100, Math.round((learned / total) * 100));
  const flame = createFlame(today);

  return el('div', { class: 'card card--padded fade-in stagger-4' }, [
    el('div', { class: 'progress-bar' }, [
      el('div', { class: 'progress-bar__left' }, [
        el('div', { class: 'progress-bar__main' }, [
          el('span', { class: 'progress-bar__num tabular' }, String(today)),
          el('span', { class: 'progress-bar__unit' }, '語 学習'),
        ]),
        el('span', { class: 'progress-bar__sub tabular' }, `通算 ${learned} / ${total}語 (${pct}%)`),
      ]),
      el('div', { class: 'progress-bar__flame' }, [flame]),
    ]),
  ]);
}
