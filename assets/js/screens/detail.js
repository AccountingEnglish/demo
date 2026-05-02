// ============================================================
// screens/detail.js - 単語詳細画面 (v4.2)
// ============================================================

import { el, showToast, tap } from '../dom.js';
import { wordRepo } from '../data.js';
import { progressStore } from '../store.js';
import { router } from '../router.js';

export function renderWordDetail(params) {
  const word = wordRepo.getWord(params.id);

  if (!word) {
    showToast('単語が見つかりません');
    router.navigate('/list');
    return;
  }

  const root = document.getElementById('app');
  root.innerHTML = '';

  const status = progressStore.getStatus(word.id);
  const stats = progressStore.getStats(word.id);

  const page = el('main', { class: 'page page--no-tabbar page-enter' }, [
    el('header', { class: 'page-header' }, [
      el('button', {
        class: 'page-header__back',
        type: 'button',
        onClick: () => { tap(); router.back(); },
      }, '‹ 戻る'),
      el('span', { class: 'page-header__title' }, '単語詳細'),
      el('span', { style: 'min-width: 44px;' }),
    ]),

    el('div', { class: 'detail scroll-y' }, [
      // カテゴリピル
      el('div', { class: 'detail__category fade-in' }, [
        el('span', { class: 'cat-pill' }, word.category),
        word.subcategory && word.subcategory !== word.category
          ? el('span', { class: 'cat-pill cat-pill--neutral' }, word.subcategory)
          : null,
      ]),

      // 英語
      el('h1', { class: 'detail__english fade-in stagger-1' }, word.english),

      // メタ
      el('div', { class: 'detail__meta fade-in stagger-2' }, [
        el('span', { class: 'freq-badge ' + (
          word.frequency === '頻出' ? 'freq-badge--high' :
          word.frequency === '応用' ? 'freq-badge--advanced' :
          'freq-badge--standard'
        ) }, word.frequency || '標準'),
        renderStatusBadge(status),
      ]),

      // 日本語訳ブロック
      el('div', { class: 'detail__japanese-block fade-in stagger-3' }, [
        el('div', { class: 'detail__japanese-label' }, '日本語訳'),
        el('div', { class: 'detail__japanese' }, word.japanese),
      ]),

      // 解説
      word.description ? el('div', { class: 'detail__section fade-in stagger-4' }, [
        el('div', { class: 'detail__section-label' }, '解説'),
        el('div', { class: 'detail__description' }, word.description),
      ]) : null,

      // 関連基準
      word.relatedStandards && word.relatedStandards.length > 0 ? el('div', { class: 'detail__section fade-in stagger-4' }, [
        el('div', { class: 'detail__section-label' }, '関連基準'),
        el('div', { class: 'detail__standards' },
          word.relatedStandards.map(s =>
            el('span', { class: 'detail__standard-pill' }, s)
          )
        ),
      ]) : null,

      // 学習統計
      el('div', { class: 'detail__section fade-in stagger-5' }, [
        el('div', { class: 'detail__section-label' }, '学習統計'),
        el('div', { class: 'detail__stats' }, [
          el('div', { class: 'detail__stat' }, [
            el('div', { class: 'detail__stat-num is-correct tabular' }, String(stats.correctCount)),
            el('div', { class: 'detail__stat-label' }, '正解'),
          ]),
          el('div', { class: 'detail__stat' }, [
            el('div', { class: 'detail__stat-num is-wrong tabular' }, String(stats.wrongCount)),
            el('div', { class: 'detail__stat-label' }, '不正解'),
          ]),
          el('div', { class: 'detail__stat' }, [
            el('div', { class: 'detail__stat-num tabular' }, String(stats.selfReportKnow)),
            el('div', { class: 'detail__stat-label' }, '知ってる'),
          ]),
        ]),
      ]),
    ]),
  ]);

  root.appendChild(page);
}

function renderStatusBadge(status) {
  const txt = status === 'learned' ? '習得済'
    : status === 'mistake' ? '要復習'
    : '未習得';
  const dotClass = status === 'learned' ? 'is-learned'
    : status === 'mistake' ? 'is-mistake' : '';

  return el('span', { class: 'detail__status' }, [
    el('span', { class: 'detail__status-dot ' + dotClass }),
    el('span', {}, txt),
  ]);
}
