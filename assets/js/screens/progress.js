// ============================================================
// screens/progress.js - 進捗画面 (v4.2)
// ============================================================

import { el, createFlame } from '../dom.js';
import { renderTabBar } from '../tabbar.js';
import { wordRepo } from '../data.js';
import { progressStore } from '../store.js';

export function renderProgress() {
  const root = document.getElementById('app');
  root.innerHTML = '';

  const learned = progressStore.getTotalLearnedCount();
  const total = wordRepo.getAllWords().length;
  const today = progressStore.getTodayLearnCount();
  const pct = Math.min(100, Math.round((learned / total) * 100));

  const page = el('main', { class: 'page page-enter' }, [
    el('div', { class: 'progress' }, [
      // ヒーロー
      el('div', { class: 'progress__hero fade-in' }, [
        el('div', { class: 'progress__hero-eye' }, '通算学習'),
        el('div', { class: 'tabular' }, [
          el('span', { class: 'progress__hero-num' }, String(learned)),
          el('span', { style: 'font-size:24px;color:var(--color-text-tertiary);font-weight:600;' }, ` / ${total}`),
        ]),
        el('div', { class: 'progress__hero-unit' }, '語'),
        el('div', { class: 'progress__hero-flame' }, [createFlame(today)]),
      ]),

      // 全体プログレスバー
      el('div', { class: 'fade-in stagger-1' }, [
        el('div', { class: 'progress__bar' }, [
          el('div', {
            class: 'progress__bar-fill',
            style: `width: ${pct}%;`,
          }),
        ]),
        el('div', { class: 'progress__bar-text' }, [
          el('span', {}, [
            el('strong', {}, `${pct}%`),
            el('span', { class: 'tabular' }, ` (${learned}/${total})`),
          ]),
          el('span', {}, `今日 ${today} 語`),
        ]),
      ]),

      // カテゴリ別
      el('section', { class: 'progress__section fade-in stagger-2' }, [
        el('div', { class: 'progress__section-label' }, 'カテゴリ別'),
        ...wordRepo.categories.map(cat => renderCategoryProgress(cat)),
      ]),

      // 頻出度別
      el('section', { class: 'progress__section fade-in stagger-3' }, [
        el('div', { class: 'progress__section-label' }, '頻出度別'),
        ...['頻出', '標準', '応用'].map(freq => renderFreqProgress(freq)),
      ]),
    ]),
    renderTabBar('progress'),
  ]);

  root.appendChild(page);
}

function renderCategoryProgress(category) {
  const words = wordRepo.getByCategory(category);
  const total = words.length;
  const learnedCount = words.filter(w => progressStore.getStatus(w.id) === 'learned').length;
  const pct = total === 0 ? 0 : Math.round((learnedCount / total) * 100);

  return el('div', { class: 'progress__cat-row' }, [
    el('div', { style: 'flex:1;' }, [
      el('div', { class: 'progress__cat-name' }, category),
      el('div', { class: 'progress__cat-bar' }, [
        el('div', {
          class: 'progress__cat-bar-fill',
          style: `width: ${pct}%;`,
        }),
      ]),
    ]),
    el('div', { class: 'progress__cat-stat' }, [
      el('span', { class: 'progress__cat-num' }, String(learnedCount)),
      el('span', { class: 'progress__cat-total' }, ` / ${total}`),
    ]),
  ]);
}

function renderFreqProgress(freq) {
  const words = wordRepo.getAllWords().filter(w => w.frequency === freq);
  const total = words.length;
  const learnedCount = words.filter(w => progressStore.getStatus(w.id) === 'learned').length;
  const pct = total === 0 ? 0 : Math.round((learnedCount / total) * 100);

  return el('div', { class: 'progress__cat-row' }, [
    el('div', { style: 'flex:1;' }, [
      el('div', { class: 'progress__cat-name' }, freq),
      el('div', { class: 'progress__cat-bar' }, [
        el('div', {
          class: 'progress__cat-bar-fill',
          style: `width: ${pct}%;`,
        }),
      ]),
    ]),
    el('div', { class: 'progress__cat-stat' }, [
      el('span', { class: 'progress__cat-num' }, String(learnedCount)),
      el('span', { class: 'progress__cat-total' }, ` / ${total}`),
    ]),
  ]);
}
