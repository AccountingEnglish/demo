// ============================================================
// app.js - エントリポイント (v4.2)
// ============================================================

import { wordRepo } from './data.js';
import { progressStore } from './store.js';
import { router } from './router.js';

// 各画面
import { renderHome } from './screens/home.js';
import { renderListPage } from './screens/list.js';
import { renderProgress } from './screens/progress.js';
import { renderSettings } from './screens/settings.js';
import { renderWordDetail } from './screens/detail.js';
import { renderRangeSelect, renderSubcategoryDetail } from './screens/range-select.js';
import { renderFlashcardSession, renderTodayFlashcard } from './screens/flashcard.js';
import { renderQuizSession, renderTodayQuiz } from './screens/quiz.js';
import { renderPrint } from './screens/print.js';

async function init() {
  await wordRepo.load();
  progressStore.init();
  registerRoutes();
  router.start();
}

function registerRoutes() {
  // メインタブ
  router.register('/home', renderHome);
  router.register('/list', renderListPage);
  router.register('/progress', renderProgress);
  router.register('/settings', renderSettings);

  // 単語詳細
  router.register('/word/:id', renderWordDetail);

  // 範囲選択
  router.register('/range/:mode', renderRangeSelect);
  router.register('/range/:mode/sub/:cat', renderSubcategoryDetail);

  // フラッシュカード
  router.register('/flashcard/range', (params, qs) => renderFlashcardSession(params, qs));
  router.register('/flashcard/today', renderTodayFlashcard);

  // クイズ
  router.register('/quiz/range', (params, qs) => renderQuizSession(params, qs));
  router.register('/quiz/today', renderTodayQuiz);

  // 印刷
  router.register('/print', renderPrint);

  // デフォルト
  router.setDefault('/home');
}

// 起動
init().catch(e => {
  console.error('App initialization failed:', e);
  document.getElementById('app').innerHTML =
    '<div style="padding:32px;text-align:center;color:#1F1F1F;font-family:sans-serif;">' +
    '<h1 style="font-size:18px;margin-bottom:16px;">読み込みエラー</h1>' +
    '<p style="font-size:14px;color:#8A8A8A;">アプリの起動に失敗しました。<br>ページを再読み込みしてください。</p>' +
    '</div>';
});
