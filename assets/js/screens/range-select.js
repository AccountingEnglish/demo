// ============================================================
// screens/range-select.js - 学習範囲選択画面
// 要件定義書 4.5
// ============================================================

import { el, icons, showToast } from '../dom.js';
import { wordRepo } from '../data.js';
import { router } from '../router.js';

/**
 * 範囲選択の状態(画面間で保持)
 */
const rangeState = {
  // mode: 'flashcard' | 'quiz'
  mode: null,
  // selectedCategories: Set<string>
  selectedCategories: null,
  // excludedSubcategories: Set<"category::sub">
  excludedSubcategories: null,
  // selectedFrequencies: Set<string>
  selectedFrequencies: null,
  // size: number | 'all' | null
  size: 'all',
  customSize: null, // 数値入力中の値
  isCustom: false,
};

function initState() {
  if (rangeState.selectedCategories) return; // 既に初期化済みなら触らない
  rangeState.selectedCategories = new Set(wordRepo.categories);
  rangeState.excludedSubcategories = new Set();
  rangeState.selectedFrequencies = new Set(['頻出', '標準', '応用']);
  rangeState.size = 'all';
  rangeState.customSize = null;
  rangeState.isCustom = false;
}

function getCurrentCount() {
  return wordRepo.filter({
    categories: rangeState.selectedCategories,
    excludedSubcategories: rangeState.excludedSubcategories,
    frequencies: rangeState.selectedFrequencies,
  }).length;
}

function getMaxSize() {
  return getCurrentCount();
}

function getPlannedSize() {
  if (rangeState.size === 'all') return getMaxSize();
  if (rangeState.isCustom && rangeState.customSize !== null) return rangeState.customSize;
  return rangeState.size;
}

export function renderRangeSelect(params) {
  rangeState.mode = params.mode || 'flashcard';
  initState();

  const root = document.getElementById('app');
  root.innerHTML = '';

  const page = el('div', { class: 'page page--no-tabbar page--with-sticky page-enter' }, [
    renderHeader(),
    el('div', { class: 'range scroll-y' }, [
      renderPresetSection(),
      renderCategorySection(),
      renderFrequencySection(),
      renderSizeSection(),
    ]),
    renderStickyBottom(),
  ]);

  root.appendChild(page);
}

function renderHeader() {
  const title = rangeState.mode === 'quiz' ? '4択クイズ' : 'フラッシュカード';
  return el('header', { class: 'page-header' }, [
    el('button', {
      class: 'page-header__close',
      'aria-label': '閉じる',
      onclick: () => router.navigate('/home'),
    }, '×'),
    el('span', { class: 'page-header__title' }, title),
    el('span', { style: 'min-width: 44px;' }),
  ]);
}

function renderPresetSection() {
  const presets = [
    { id: 'auto',   label: 'おまかせ',  icon: icons.zap },
    { id: 'review', label: '苦手復習',  icon: icons.refresh },
    { id: 'all',    label: '全範囲から', icon: icons.globe },
  ];

  return el('section', { class: 'range__section' }, [
    el('div', { class: 'range__label' }, 'プリセット'),
    el('div', { class: 'preset-row' },
      presets.map(p => {
        const btn = el('button', {
          class: 'preset-btn',
          type: 'button',
          onClick: () => applyPreset(p.id),
        });
        const iconWrap = el('span', { class: 'preset-btn__icon' });
        iconWrap.innerHTML = p.icon;
        btn.appendChild(iconWrap);
        btn.appendChild(el('span', {}, p.label));
        return btn;
      })
    ),
  ]);
}

function applyPreset(id) {
  if (id === 'all') {
    rangeState.selectedCategories = new Set(wordRepo.categories);
    rangeState.excludedSubcategories = new Set();
    rangeState.selectedFrequencies = new Set(['頻出', '標準', '応用']);
    rangeState.size = 'all';
    rangeState.isCustom = false;
    showToast('全範囲を選択しました');
    renderRangeSelect({ mode: rangeState.mode });
    return;
  }
  if (id === 'auto') {
    // ダミー: 「頻出」+「標準」の頻出度のみ、未習得の20問を想定
    rangeState.selectedCategories = new Set(wordRepo.categories);
    rangeState.excludedSubcategories = new Set();
    rangeState.selectedFrequencies = new Set(['頻出', '標準']);
    rangeState.size = 20;
    rangeState.isCustom = false;
    showToast('おまかせを選択しました');
    renderRangeSelect({ mode: rangeState.mode });
    return;
  }
  if (id === 'review') {
    rangeState.selectedCategories = new Set(wordRepo.categories);
    rangeState.excludedSubcategories = new Set();
    rangeState.selectedFrequencies = new Set(['頻出', '標準', '応用']);
    rangeState.size = 20;
    rangeState.isCustom = false;
    showToast('苦手復習を選択しました');
    renderRangeSelect({ mode: rangeState.mode });
    return;
  }
}

function renderCategorySection() {
  const sec = el('section', { class: 'range__section' }, [
    el('div', { class: 'range__label' }, 'カテゴリ'),
  ]);
  const list = el('div', { class: 'cat-list' });

  wordRepo.categories.forEach(cat => {
    const selected = rangeState.selectedCategories.has(cat);
    const totalInCat = wordRepo.getByCategory(cat).length;
    const subs = wordRepo.getSubcategoriesOf(cat);
    const excludedHere = subs.filter(s => rangeState.excludedSubcategories.has(`${cat}::${s}`));
    const activeCount = totalInCat - excludedHere.reduce((sum, s) => sum + wordRepo.getSubcategoryCount(cat, s), 0);

    const row = el('div', {
      class: 'cat-row ' + (selected ? 'is-selected' : 'is-unselected'),
    }, [
      el('div', {
        class: 'cat-row__left',
        onclick: () => {
          // タップ → 選択トグル
          if (rangeState.selectedCategories.has(cat)) {
            rangeState.selectedCategories.delete(cat);
          } else {
            rangeState.selectedCategories.add(cat);
            // 選択した時点で除外も解除(直感的)
            for (const k of [...rangeState.excludedSubcategories]) {
              if (k.startsWith(cat + '::')) rangeState.excludedSubcategories.delete(k);
            }
          }
          renderRangeSelect({ mode: rangeState.mode });
        },
      }, [
        el('span', { class: 'check ' + (selected ? 'is-checked' : '') },
          (() => { const i = el('span'); i.innerHTML = icons.check; return i; })()
        ),
        el('span', { class: 'cat-row__name' }, cat),
        el('span', { class: 'cat-row__count' }, selected ? `${activeCount}語` : `${totalInCat}語`),
      ]),
      selected
        ? el('button', {
            class: 'cat-row__action',
            onclick: () => router.navigate(`/range/${rangeState.mode}/sub/${encodeURIComponent(cat)}`),
          }, '個別調整')
        : null,
    ]);

    list.appendChild(row);
  });

  sec.appendChild(list);
  return sec;
}

function renderFrequencySection() {
  const freqs = ['頻出', '標準', '応用'];
  return el('section', { class: 'range__section' }, [
    el('div', { class: 'range__label' }, '頻出度'),
    el('div', { class: 'chip-row chip-row--3' },
      freqs.map(f => {
        const isSelected = rangeState.selectedFrequencies.has(f);
        return el('button', {
          class: 'freq-btn' + (isSelected ? ' is-selected' : ''),
          onclick: () => {
            if (rangeState.selectedFrequencies.has(f)) {
              if (rangeState.selectedFrequencies.size === 1) return; // 最低1つ
              rangeState.selectedFrequencies.delete(f);
            } else {
              rangeState.selectedFrequencies.add(f);
            }
            renderRangeSelect({ mode: rangeState.mode });
          },
        }, f);
      })
    ),
  ]);
}

function renderSizeSection() {
  const sec = el('section', { class: 'range__section' }, [
    el('div', { class: 'range__label' }, '単語数'),
  ]);

  const presets = [10, 20, 50, 'all'];
  const max = getMaxSize();

  const row = el('div', { class: 'chip-row chip-row--5' });

  presets.forEach(p => {
    const isSelected = !rangeState.isCustom && rangeState.size === p;
    const label = p === 'all' ? '全問' : String(p);
    row.appendChild(
      el('button', {
        class: 'size-btn' + (isSelected ? ' is-selected' : ''),
        onclick: () => {
          rangeState.size = p;
          rangeState.isCustom = false;
          rangeState.customSize = null;
          updateStickyBottom();
          row.replaceWith(renderSizeRowOnly());
        },
      }, label)
    );
  });

  // カスタム枠 / 入力欄
  if (rangeState.isCustom) {
    const initialValue = rangeState.customSize || (rangeState.size === 'all' ? max : rangeState.size);
    const input = el('input', {
      type: 'number',
      class: 'size-input',
      min: 1,
      max,
      value: initialValue,
      inputmode: 'numeric',
      onfocus: () => input.select(),
      oninput: () => handleCustomInput(input),
      onblur: () => handleCustomBlur(input),
    });
    rangeState.customSize = parseInt(initialValue, 10);
    row.appendChild(input);
    setTimeout(() => { input.focus(); input.select(); }, 50);
  } else {
    row.appendChild(
      el('button', {
        class: 'size-btn',
        onclick: () => {
          rangeState.isCustom = true;
          rangeState.customSize = (rangeState.size === 'all') ? max : rangeState.size;
          renderRangeSelect({ mode: rangeState.mode });
        },
      }, 'カスタム')
    );
  }

  sec.appendChild(row);

  // エラーメッセージ
  const err = el('div', { class: 'range__error', id: 'range-size-error' },
    `最大 ${max}語まで`
  );
  sec.appendChild(err);

  return sec;
}

function renderSizeRowOnly() {
  // 必要に応じて更新するためのスタブ。簡易的に画面再描画で対応。
  renderRangeSelect({ mode: rangeState.mode });
  return el('div'); // dummy
}

function handleCustomInput(input) {
  const val = parseInt(input.value, 10);
  const max = getMaxSize();
  const err = document.getElementById('range-size-error');
  if (isNaN(val) || val < 1 || val > max) {
    input.classList.add('is-error');
    if (err) {
      err.textContent = `1 〜 ${max}語の間で指定してください`;
      err.classList.add('is-visible');
    }
    rangeState.customSize = null;
  } else {
    input.classList.remove('is-error');
    if (err) err.classList.remove('is-visible');
    rangeState.customSize = val;
  }
  updateStickyBottom();
}

function handleCustomBlur(input) {
  if (rangeState.customSize === null) {
    // 不正な値のままblurされたら、isCustomを解除して全問に戻す
    return; // エラーは表示しっぱなし
  }
}

function renderStickyBottom() {
  const max = getCurrentCount();
  const planned = getPlannedSize();
  const isError = rangeState.isCustom && rangeState.customSize === null;

  const startBtn = el('button', {
    class: 'btn btn--primary btn--full',
    disabled: isError || max === 0,
    onclick: () => {
      // 学習開始
      const target = rangeState.mode === 'quiz' ? '/quiz' : '/flashcard';
      const queryParams = encodeRangeForUrl();
      router.navigate(`${target}/range?${queryParams}`);
    },
  }, '学習を始める');

  return el('div', { class: 'range-sticky', id: 'range-sticky' }, [
    el('div', { class: 'range-sticky__row' }, [
      el('span', { class: 'range-sticky__label' }, '対象'),
      el('span', { class: 'range-sticky__value', id: 'range-target-text' },
        max === 0 ? '0語' : `${max}語 中 ${Math.min(planned, max)}語`
      ),
    ]),
    startBtn,
  ]);
}

function updateStickyBottom() {
  const txt = document.getElementById('range-target-text');
  const max = getCurrentCount();
  const planned = getPlannedSize();
  if (txt) {
    txt.textContent = max === 0 ? '0語' : `${max}語 中 ${Math.min(planned, max)}語`;
  }
}

/**
 * 範囲設定をクエリストリングに変換(画面遷移時に使う)
 */
function encodeRangeForUrl() {
  const params = new URLSearchParams();
  params.set('cats', [...rangeState.selectedCategories].join(','));
  params.set('freqs', [...rangeState.selectedFrequencies].join(','));
  params.set('exclSub', [...rangeState.excludedSubcategories].join('|'));
  params.set('size', rangeState.isCustom ? rangeState.customSize : rangeState.size);
  return params.toString();
}

/**
 * クエリストリングから範囲設定を復元
 */
export function decodeRangeFromUrl(qs) {
  const params = new URLSearchParams(qs);
  const cats = (params.get('cats') || '').split(',').filter(Boolean);
  const freqs = (params.get('freqs') || '').split(',').filter(Boolean);
  const exclSub = (params.get('exclSub') || '').split('|').filter(Boolean);
  const sizeRaw = params.get('size') || 'all';
  return {
    categories: new Set(cats),
    excludedSubcategories: new Set(exclSub),
    frequencies: new Set(freqs),
    size: sizeRaw === 'all' ? 'all' : parseInt(sizeRaw, 10),
  };
}

/**
 * サブカテゴリ詳細画面
 */
export function renderSubcategoryDetail(params) {
  const cat = decodeURIComponent(params.cat);
  initState(); // 念のため
  rangeState.mode = params.mode;

  const root = document.getElementById('app');
  root.innerHTML = '';

  const subcats = wordRepo.getSubcategoriesOf(cat);

  const list = el('div', { class: 'sub-list' });

  subcats.forEach(sub => {
    const key = `${cat}::${sub}`;
    const checked = !rangeState.excludedSubcategories.has(key);
    const count = wordRepo.getSubcategoryCount(cat, sub);

    const row = el('div', {
      class: 'sub-list__row ' + (checked ? '' : 'is-unchecked'),
      onclick: () => {
        if (rangeState.excludedSubcategories.has(key)) {
          rangeState.excludedSubcategories.delete(key);
        } else {
          rangeState.excludedSubcategories.add(key);
        }
        renderSubcategoryDetail(params);
      },
    }, [
      el('div', { class: 'sub-list__name' }, [
        el('span', { class: 'check ' + (checked ? 'is-checked' : '') },
          (() => { const i = el('span'); i.innerHTML = icons.check; return i; })()
        ),
        el('span', {}, sub),
      ]),
      el('span', { class: 'sub-list__count' }, `${count}語`),
    ]);
    list.appendChild(row);
  });

  const page = el('div', { class: 'page page--no-tabbar page-enter' }, [
    el('header', { class: 'page-header' }, [
      el('button', {
        class: 'page-header__back',
        onClick: () => router.back(),
      }, '‹ 戻る'),
      el('span', { class: 'page-header__title' }, cat),
      el('button', {
        class: 'page-header__action',
        onClick: () => {
          for (const sub of subcats) {
            rangeState.excludedSubcategories.delete(`${cat}::${sub}`);
          }
          renderSubcategoryDetail(params);
        },
      }, 'すべて選択'),
    ]),
    el('div', { class: 'range scroll-y' }, [
      el('div', { class: 'range__section' },
        list
      ),
    ]),
  ]);

  root.appendChild(page);
}

export function getRangeState() {
  initState();
  return rangeState;
}
