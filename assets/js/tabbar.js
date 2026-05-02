// ============================================================
// tabbar.js - 下部タブバー (v4.2)
// ホーム / 単語一覧 / 進捗 / 設定 の4タブ
// ============================================================

import { el, icons, svgEl, tap } from './dom.js';
import { router } from './router.js';

const TABS = [
  { id: 'home',     label: 'ホーム',  path: '/home',     icon: icons.home },
  { id: 'list',     label: '単語',    path: '/list',     icon: icons.list },
  { id: 'progress', label: '進捗',    path: '/progress', icon: icons.chart },
  { id: 'settings', label: '設定',    path: '/settings', icon: icons.settings },
];

export function renderTabBar(activeId) {
  const bar = el('nav', { class: 'tabbar', role: 'tablist', 'aria-label': 'メインタブ' });
  for (const t of TABS) {
    const item = el(
      'button',
      {
        class: `tabbar__item ${t.id === activeId ? 'is-active' : ''}`,
        type: 'button',
        role: 'tab',
        'aria-selected': t.id === activeId ? 'true' : 'false',
        'aria-label': t.label,
        onClick: () => {
          if (t.id !== activeId) {
            tap();
            router.navigate(t.path);
          }
        },
      },
      [
        svgEl(t.icon, 'tabbar__icon'),
        el('span', { class: 'tabbar__label' }, t.label),
      ]
    );
    bar.appendChild(item);
  }
  return bar;
}
