// ============================================================
// screens/list.js - 単語一覧画面 (v4.2)
// 上部固定レイアウト + 印刷機能(FAB→選択モード→印刷プレビュー)
// ============================================================

import { el, icons, svgEl, showToast, tap } from '../dom.js';
import { renderTabBar } from '../tabbar.js';
import { wordRepo } from '../data.js';
import { progressStore } from '../store.js';
import { router } from '../router.js';

// 画面状態
const listState = {
  searchQuery: '',
  activeFilter: 'all',  // 'all' | 'mistake' | 'learned' | category | freq
  isSelectMode: false,
  selectedIds: new Set(),
};

export function renderListPage(params, qs) {
  // URL ?filter=mistake などからフィルタ初期化
  if (qs) {
    const params = new URLSearchParams(qs);
    if (params.get('filter')) listState.activeFilter = params.get('filter');
  }

  const root = document.getElementById('app');
  root.innerHTML = '';

  const filteredWords = applyFilters();
  const grouped = groupByCategory(filteredWords);

  const page = el('main', { class: 'page list-page page-enter' }, [
    // 上部固定領域
    el('div', { class: 'list-page__head' }, [
      // タイトル + 件数
      el('div', { class: 'list-page__title-row' }, [
        el('h1', { class: 'list-page__title' }, '単語一覧'),
        el('span', { class: 'list-page__title-count tabular' },
          listState.isSelectMode
            ? `${filteredWords.length}語 / ${listState.selectedIds.size}件選択中`
            : `${filteredWords.length}語`
        ),
      ]),
      // 検索
      el('div', { class: 'search' }, [
        svgEl(icons.search, 'search__icon'),
        el('input', {
          type: 'search',
          class: 'search__input',
          placeholder: '英単語・日本語訳で検索',
          value: listState.searchQuery,
          'aria-label': '検索',
          onInput: (e) => {
            listState.searchQuery = e.target.value;
            // 部分更新: ボディだけ再描画
            updateBody();
          },
        }),
      ]),
      // フィルターチップ
      el('div', { class: 'list-page__filters' }, renderFilterChips()),
    ]),

    // ボディ
    el('div', { class: 'list-page__body', id: 'list-body' },
      filteredWords.length === 0
        ? renderEmpty()
        : grouped.map(g => renderGroup(g))
    ),

    // FAB(印刷ボタン)
    listState.isSelectMode ? null : el('button', {
      class: 'fab',
      type: 'button',
      'aria-label': '印刷モードを開始',
      onClick: () => {
        tap();
        enterSelectMode();
      },
    }, [
      svgEl(icons.printer, ''),
    ]),

    // 選択モード中のボトムバー
    listState.isSelectMode ? renderSelectBar() : null,

    // タブバー
    renderTabBar('list'),
  ]);

  root.appendChild(page);

  // 選択モード中なら選択バーをふわっと表示
  if (listState.isSelectMode) {
    setTimeout(() => {
      const sb = document.querySelector('.list-page__select-bar');
      if (sb) sb.classList.add('is-visible');
    }, 30);
  }
}

function updateBody() {
  const filteredWords = applyFilters();
  const grouped = groupByCategory(filteredWords);

  // タイトルカウント更新
  const cntEl = document.querySelector('.list-page__title-count');
  if (cntEl) {
    cntEl.textContent = listState.isSelectMode
      ? `${filteredWords.length}語 / ${listState.selectedIds.size}件選択中`
      : `${filteredWords.length}語`;
  }

  // ボディ再描画
  const body = document.getElementById('list-body');
  if (body) {
    body.innerHTML = '';
    if (filteredWords.length === 0) {
      body.appendChild(renderEmpty());
    } else {
      grouped.forEach(g => body.appendChild(renderGroup(g)));
    }
  }
}

function renderFilterChips() {
  const chips = [];

  chips.push(makeChip('all', 'すべて', wordRepo.getAllWords().length));
  for (const cat of wordRepo.categories) {
    chips.push(makeChip('cat:' + cat, cat, wordRepo.getByCategory(cat).length));
  }
  chips.push(makeChip('freq:頻出', '頻出', wordRepo.getAllWords().filter(w => w.frequency === '頻出').length));
  chips.push(makeChip('mistake', '間違えた', progressStore.getMistakeIds().length));
  chips.push(makeChip('learned', '習得済', progressStore.getLearnedIds().length));

  return chips;
}

function makeChip(filterId, label, count) {
  const isActive = listState.activeFilter === filterId;
  return el('button', {
    class: 'chip ' + (isActive ? 'is-active' : ''),
    type: 'button',
    onClick: () => {
      tap();
      listState.activeFilter = filterId;
      renderListPage();
    },
  }, [
    el('span', {}, label),
    el('span', { class: 'chip__count tabular' }, String(count)),
  ]);
}

function applyFilters() {
  let words = wordRepo.getAllWords();

  // フィルタ
  if (listState.activeFilter === 'mistake') {
    const ids = new Set(progressStore.getMistakeIds());
    words = words.filter(w => ids.has(w.id));
  } else if (listState.activeFilter === 'learned') {
    const ids = new Set(progressStore.getLearnedIds());
    words = words.filter(w => ids.has(w.id));
  } else if (listState.activeFilter.startsWith('cat:')) {
    const cat = listState.activeFilter.slice(4);
    words = words.filter(w => w.category === cat);
  } else if (listState.activeFilter.startsWith('freq:')) {
    const freq = listState.activeFilter.slice(5);
    words = words.filter(w => w.frequency === freq);
  }

  // 検索
  const q = listState.searchQuery.trim().toLowerCase();
  if (q) {
    words = words.filter(w =>
      w.english.toLowerCase().includes(q) || (w.japanese || '').toLowerCase().includes(q)
    );
  }

  return words;
}

function groupByCategory(words) {
  const groups = new Map();
  for (const w of words) {
    if (!groups.has(w.category)) groups.set(w.category, []);
    groups.get(w.category).push(w);
  }
  // カテゴリ順を維持(wordRepo.categoriesの順)
  const ordered = [];
  for (const cat of wordRepo.categories) {
    if (groups.has(cat)) ordered.push({ category: cat, words: groups.get(cat) });
  }
  return ordered;
}

function renderGroup(group) {
  const groupEl = el('div', { class: 'list-group' }, [
    el('div', {
      class: 'list-group__head',
      style: 'top: 0;',
    }, [
      el('span', { class: 'list-group__title' }, group.category),
      el('span', { class: 'list-group__count tabular' }, `${group.words.length}語`),
    ]),
  ]);
  for (const w of group.words) {
    groupEl.appendChild(renderRow(w));
  }
  return groupEl;
}

function renderRow(word) {
  const status = progressStore.getStatus(word.id);
  const statusClass = status === 'learned' ? 'is-learned'
    : status === 'mistake' ? 'is-mistake' : '';

  const isChecked = listState.selectedIds.has(word.id);

  const onClick = () => {
    if (listState.isSelectMode) {
      tap();
      toggleSelect(word.id);
    } else {
      tap();
      router.navigate('/word/' + word.id);
    }
  };

  return el('div', {
    class: 'list-row ' + (listState.isSelectMode ? 'is-selectable' : ''),
    onClick,
  }, [
    // 選択モード時のチェックボックス
    el('div', { class: 'list-row__check-area' }, [
      el('div', { class: 'check check--circle ' + (isChecked ? 'is-checked' : '') }, [
        svgEl(icons.check, ''),
      ]),
    ]),
    el('div', { class: 'list-row__main' }, [
      el('div', { class: 'list-row__english' }, word.english),
      el('div', { class: 'list-row__japanese' }, word.japanese),
    ]),
    el('div', { class: 'list-row__right' }, [
      word.frequency === '頻出' ? el('span', { class: 'freq-badge freq-badge--high' }, '頻出') : null,
      word.frequency === '応用' ? el('span', { class: 'freq-badge freq-badge--advanced' }, '応用') : null,
      el('span', { class: 'list-row__status ' + statusClass }),
    ]),
  ]);
}

function renderEmpty() {
  return el('div', { class: 'empty' }, [
    el('div', { class: 'empty__title' }, '該当する単語がありません'),
    el('div', { class: 'empty__sub' }, '検索条件を変えてみてください'),
  ]);
}

// =================== 選択モード(印刷用) ====================

function enterSelectMode() {
  listState.isSelectMode = true;
  // デフォルトで現在表示中の単語をすべて選択
  const visibleWords = applyFilters();
  listState.selectedIds = new Set(visibleWords.map(w => w.id));
  renderListPage();
}

function exitSelectMode() {
  listState.isSelectMode = false;
  listState.selectedIds = new Set();
  renderListPage();
}

function toggleSelect(id) {
  if (listState.selectedIds.has(id)) {
    listState.selectedIds.delete(id);
  } else {
    listState.selectedIds.add(id);
  }
  // 部分更新: 該当行のチェック状態のみ更新
  updateBody();
}

function renderSelectBar() {
  const count = listState.selectedIds.size;
  return el('div', { class: 'list-page__select-bar' }, [
    el('span', { class: 'list-page__select-count' }, [
      el('strong', {}, String(count)),
      el('span', {}, '件選択中'),
    ]),
    el('button', {
      class: 'list-page__select-cancel',
      type: 'button',
      onClick: () => { tap(); exitSelectMode(); },
    }, 'キャンセル'),
    el('button', {
      class: 'list-page__select-print',
      type: 'button',
      disabled: count === 0,
      onClick: () => {
        if (count === 0) return;
        tap();
        // 選択した単語IDをsessionStorageに保存して印刷プレビューへ
        const ids = Array.from(listState.selectedIds);
        sessionStorage.setItem('cpa-print-ids', JSON.stringify(ids));
        // 選択モード終了
        listState.isSelectMode = false;
        router.navigate('/print');
      },
    }, [
      svgEl(icons.printer, ''),
      el('span', {}, '印刷プレビュー'),
    ]),
  ]);
}
