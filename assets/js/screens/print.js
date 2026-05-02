// ============================================================
// screens/print.js - 印刷プレビュー画面 (v4.2)
// 暗記用 / テスト用 の2形式タブ + ブラウザ印刷
// ============================================================

import { el, icons, svgEl, showToast, tap } from '../dom.js';
import { wordRepo } from '../data.js';
import { router } from '../router.js';

const printState = {
  format: 'memorize', // 'memorize' | 'test'
  wordIds: [],
};

export function renderPrint() {
  // sessionStorageから選択された単語IDを読み込む
  let ids = [];
  try {
    const raw = sessionStorage.getItem('cpa-print-ids');
    if (raw) ids = JSON.parse(raw);
  } catch (e) {
    ids = [];
  }
  if (!ids || ids.length === 0) {
    showToast('印刷する単語が選択されていません');
    router.navigate('/list');
    return;
  }
  printState.wordIds = ids;
  if (!printState.format) printState.format = 'memorize';
  render();
}

function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';

  const words = printState.wordIds
    .map(id => wordRepo.getWord(id))
    .filter(Boolean);

  const page = el('main', { class: 'page page--no-tabbar print-page page-enter' }, [
    el('header', { class: 'page-header' }, [
      el('button', {
        class: 'page-header__back',
        type: 'button',
        onClick: () => { tap(); router.navigate('/list'); },
      }, '‹'),
      el('span', { class: 'page-header__title' }, '印刷プレビュー'),
      el('span', { style: 'min-width: 44px;' }),
    ]),

    // タブ
    el('div', { class: 'print-page__head' }, [
      el('div', { class: 'print-tabs' }, [
        el('button', {
          class: 'print-tab' + (printState.format === 'memorize' ? ' is-active' : ''),
          type: 'button',
          onClick: () => {
            tap();
            printState.format = 'memorize';
            render();
          },
        }, '暗記用'),
        el('button', {
          class: 'print-tab' + (printState.format === 'test' ? ' is-active' : ''),
          type: 'button',
          onClick: () => {
            tap();
            printState.format = 'test';
            render();
          },
        }, 'テスト用'),
      ]),
      el('div', { class: 'print-page__count' }, [
        el('strong', { class: 'tabular' }, String(words.length)),
        el('span', {}, '件の用語を印刷します'),
      ]),
    ]),

    // プレビュー
    el('div', { class: 'print-preview' }, [
      el('div', { class: 'print-sheet' }, [
        el('div', { class: 'print-sheet__title' },
          printState.format === 'memorize' ? '会計英単語 英日対訳' : '会計英単語 確認テスト'
        ),
        el('div', { class: 'print-list' },
          words.map((w, idx) => renderPrintRow(w, idx + 1, printState.format))
        ),
      ]),
    ]),

    // フッター
    el('div', { class: 'print-bottom' }, [
      el('div', { class: 'print-bottom__hint' },
        'ブラウザの印刷機能で紙に印刷、またはPDFとして保存できます'
      ),
      el('button', {
        class: 'btn btn--primary btn--full',
        type: 'button',
        onClick: () => {
          tap();
          window.print();
        },
      }, '印刷する'),
    ]),
  ]);

  root.appendChild(page);
}

function renderPrintRow(word, num, format) {
  const isTest = format === 'test';
  return el('div', {
    class: 'print-row ' + (isTest ? 'print-row--test' : 'print-row--memorize'),
  }, [
    el('div', { class: 'print-row__english' }, [
      el('span', { class: 'print-row__english-num tabular' }, `${num}.`),
      el('span', {}, word.english),
    ]),
    el('div', { class: 'print-row__japanese' }, [
      isTest
        ? el('span', { class: 'print-row__japanese-text' }, word.japanese)
        : el('span', {}, word.japanese),
    ]),
  ]);
}
