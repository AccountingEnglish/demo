// ============================================================
// screens/settings.js - 設定画面 (v4.2)
// ============================================================

import { el, showToast, tap } from '../dom.js';
import { renderTabBar } from '../tabbar.js';
import { progressStore } from '../store.js';

export function renderSettings() {
  const root = document.getElementById('app');
  root.innerHTML = '';

  const page = el('main', { class: 'page page-enter' }, [
    el('div', { class: 'settings' }, [
      el('div', { class: 'settings__head fade-in' }, [
        el('div', { class: 'section-label' }, 'SETTINGS'),
        el('h1', { class: 'settings__title' }, '設定'),
      ]),

      el('section', { class: 'settings__group fade-in stagger-1' }, [
        el('div', { class: 'settings__group-label' }, 'データ管理'),
        el('div', { class: 'settings__group-card' }, [
          el('div', {
            class: 'settings__row is-danger',
            onClick: () => {
              if (confirm('学習履歴をすべてリセットしますか?\nこの操作は取り消せません。')) {
                tap();
                progressStore.reset();
                showToast('学習履歴をリセットしました');
              }
            },
          }, [
            el('span', { class: 'settings__row-label' }, '学習履歴をリセット'),
            el('span', { class: 'settings__row-action' }, 'リセット'),
          ]),
        ]),
      ]),

      el('section', { class: 'settings__group fade-in stagger-2' }, [
        el('div', { class: 'settings__group-label' }, 'アプリについて'),
        el('div', { class: 'settings__group-card' }, [
          el('div', { class: 'settings__row' }, [
            el('span', { class: 'settings__row-label' }, 'バージョン'),
            el('span', { class: 'settings__row-value' }, '4.2.0'),
          ]),
          el('div', { class: 'settings__row' }, [
            el('span', { class: 'settings__row-label' }, '収録単語数'),
            el('span', { class: 'settings__row-value tabular' }, '511 語'),
          ]),
        ]),
      ]),

      el('section', { class: 'settings__group fade-in stagger-3' }, [
        el('div', { class: 'settings__group-label' }, 'クレジット'),
        el('div', { class: 'settings__group-card' }, [
          el('div', { class: 'settings__about' }, [
            el('p', {}, '会計英単語学習アプリ Lex Cuentas は、日本の公認会計士試験(短答式)で出題される英文会計用語を体系的に学習するためのアプリケーションです。'),
            el('p', {}, '開発: 堂園峻佑'),
            el('p', {}, 'コンテンツ監修: 石川航汰'),
            el('p', {}, '早稲田大学大学院 会計研究科'),
          ]),
        ]),
      ]),

      el('div', { class: 'settings__footer' }, '© 2026 Lex Cuentas'),
    ]),
    renderTabBar('settings'),
  ]);

  root.appendChild(page);
}
