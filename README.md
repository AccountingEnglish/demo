# Lex Cuentas — 会計英単語学習アプリ (v4.2)

公認会計士試験(短答式)対策の会計英単語学習アプリ。511語を体系的に学習できます。

## v4.2 の変更点

### デザイン全面刷新

- **温かく親しみやすいUDデザイン**にリニューアル(白黒ベースから方針転換)
- メインカラー: 早稲田レッド系の `#C8102E`
- フォント: UDデジタル教科書体(ローカル) + BIZ UDPゴシック(Webフォント)

### アニメーション全面拡充

- すべてのボタンに「押した感」(scale + 影 + 色推移)
- 正解時: 緑(`#10B981`)の発光波紋 + チェック描画
- 不正解時: 赤(`#EF4444`)のshake + ヒント
- ページ遷移: fade + slide-up
- カードフリップ: rotateY

### 機能追加

- **印刷機能**: 単語一覧の右下「印刷」FAB → 単語選択 → 印刷プレビュー(暗記用/テスト用) → 印刷
- **単語一覧の上部固定レイアウト**: タイトル+検索+カテゴリチップが下にスクロールしても付いてくる
- **カードめくりのデザイン刷新**: ピル型ラベル、ゆとりあるカード、丸い「<」「>」ナビ

## ローカル実行

ESモジュールを使っているため、ファイルを直接ブラウザで開くことはできません。ローカルサーバーを起動してください。

```bash
# Pythonの場合(macOS / Linux)
cd cpa-vocab-app-v2
python3 -m http.server 8000

# Node.jsの場合
npx serve
```

ブラウザで `http://localhost:8000` を開く。

## GitHub Pagesへのデプロイ

### 方法1: 既存リポジトリのルートに置く場合

1. リポジトリ直下にこの中身をすべてコピー(`index.html`、`assets/`、`.nojekyll` を含む)
2. GitHub > Settings > Pages
3. Source: Deploy from a branch
4. Branch: `main` (or `master`) / `/ (root)`
5. Save

数分待つと `https://<username>.github.io/<repo>/` で公開される。

### 方法2: docsフォルダを使う場合

1. リポジトリ内に `docs/` フォルダを作成
2. その中にこのアプリの中身を配置
3. GitHub > Settings > Pages
4. Source: Deploy from a branch / Branch: `main` / `/docs`

## ファイル構成

```
cpa-vocab-app-v2/
├── index.html
├── .nojekyll
├── assets/
│   ├── css/
│   │   ├── tokens.css        ← デザイントークン
│   │   ├── base.css          ← リセット&基本
│   │   ├── layout.css        ← ヘッダー、タブバー、FAB
│   │   ├── components.css    ← ボタン、カード等
│   │   └── screens/
│   │       ├── home.css
│   │       ├── flashcard.css
│   │       ├── quiz.css
│   │       ├── range-select.css
│   │       ├── list.css
│   │       ├── print.css
│   │       └── screens.css
│   ├── js/
│   │   ├── app.js            ← エントリポイント
│   │   ├── data.js           ← WordRepository
│   │   ├── store.js          ← ProgressStore (localStorage)
│   │   ├── router.js         ← 簡易ルーター
│   │   ├── dom.js            ← DOMヘルパー&アイコン
│   │   ├── tabbar.js         ← タブバー
│   │   └── screens/
│   │       ├── home.js
│   │       ├── flashcard.js
│   │       ├── quiz.js
│   │       ├── range-select.js
│   │       ├── list.js
│   │       ├── print.js
│   │       ├── progress.js
│   │       ├── settings.js
│   │       └── detail.js
│   └── data/
│       └── words.json        ← 全511語データ
└── README.md
```

## 開発体制

- 開発: 堂園峻佑(早稲田大学院 会計研究科)
- コンテンツ監修: 石川航汰(早稲田大学院 会計研究科)
