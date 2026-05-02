// ============================================================
// router.js - 画面ルーター
// シンプルなhashベースのSPAルーティング。
// ============================================================

class Router {
  constructor() {
    this.routes = {};
    this.currentScreen = null;
    this.params = {};
    this.previousPath = null;
    this.defaultPath = '/home';
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  setDefault(path) {
    this.defaultPath = path;
  }

  /**
   * pathパターンとURLから動的パラメータを抽出。
   * 例: pattern='/word/:id', url='/word/fa-001' → {id: 'fa-001'}
   */
  _matchRoute(url) {
    // クエリストリング部分を分離
    const [pathPart, qsPart] = url.split('?');

    for (const pattern in this.routes) {
      const patternParts = pattern.split('/');
      const urlParts = pathPart.split('/');
      if (patternParts.length !== urlParts.length) continue;

      const params = {};
      let match = true;
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
          params[patternParts[i].slice(1)] = decodeURIComponent(urlParts[i]);
        } else if (patternParts[i] !== urlParts[i]) {
          match = false;
          break;
        }
      }
      if (match) return { handler: this.routes[pattern], params, qs: qsPart || '' };
    }
    return null;
  }

  /**
   * 画面遷移
   */
  navigate(path, replace = false) {
    if (replace) {
      window.location.replace('#' + path);
    } else {
      window.location.hash = path;
    }
  }

  back() {
    window.history.back();
  }

  /**
   * 現在のhashから画面をレンダリング
   */
  render(opts = {}) {
    const hash = window.location.hash.slice(1) || this.defaultPath;
    const matched = this._matchRoute(hash);
    if (!matched) {
      // フォールバック
      this.navigate(this.defaultPath, true);
      return;
    }
    this.previousPath = this.currentScreen;
    this.currentScreen = hash;
    this.params = matched.params;
    matched.handler(matched.params, matched.qs);
  }

  start() {
    window.addEventListener('hashchange', () => this.render());
    this.render();
  }
}

export const router = new Router();
