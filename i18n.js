/* Sandcode i18n engine — EN ⇄ 中文, dictionary-driven, zero HTML edits.
   - Toggle is auto-injected into marketing navs + workspace topbars.
   - Static text nodes, placeholder/title/aria-label attrs and <title> swap.
   - MutationObserver picks up dynamically rendered strings (toasts, rows…).
   - Unmapped nodes stay English. Persisted in localStorage. */
(function () {
  var KEY = 'sandcode-lang';
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  var origText = new Map(); // Text node -> original EN
  var origAttr = new WeakMap(); // Element -> {attr: original EN}
  var _origTitle = document.title; // captured at parse time (static EN)

  function dict() { return window.__I18N || {}; }
  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  function lang() {
    try { return localStorage.getItem(KEY) || 'en'; } catch (e) { return 'en'; }
  }
  function setLang(l) {
    try { localStorage.setItem(KEY, l); } catch (e) {}
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
    applyLang(l);
    paintButton(l);
  }

  function swapTextNode(node, l) {
    if (!origText.has(node)) origText.set(node, node.nodeValue);
    var src = origText.get(node);
    var m = src.match(/^(\s*)([\s\S]*?)(\s*)$/);
    var key = norm(m[2]);
    if (!key) return;
    node.nodeValue = (l === 'zh' && dict()[key] !== undefined)
      ? m[1] + dict()[key] + m[3]
      : src;
  }
  function swapAttrs(root, l) {
    var els = root.querySelectorAll ? root.querySelectorAll('[' + ATTRS.join('],[') + ']') : [];
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        var saved = origAttr.get(el) || {};
        ATTRS.forEach(function (a) {
          if (!el.hasAttribute(a)) return;
          if (!(a in saved)) saved[a] = el.getAttribute(a);
          var src = saved[a];
          var key = norm(src);
          el.setAttribute(a, (l === 'zh' && dict()[key] !== undefined) ? dict()[key] : src);
        });
        origAttr.set(el, saved);
      })(els[i]);
    }
  }
  function applyLang(l) {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var nodes = [];
    var n;
    while ((n = walker.nextNode())) {
      var p = n.parentElement;
      if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE')) continue;
      nodes.push(n);
    }
    nodes.forEach(function (t) { swapTextNode(t, l); });
    swapAttrs(document, l);
    var titleKey = norm(_origTitle);
    if (l === 'zh' && dict()[titleKey] !== undefined) document.title = dict()[titleKey];
    else document.title = _origTitle;
  }

  // button (auto-injected so no HTML edits are needed)
  function paintButton(l) {
    var b = document.getElementById('lang-btn');
    if (b) b.textContent = (l === 'zh') ? 'EN' : '中文';
  }
  function injectButton() {
    if (document.getElementById('lang-btn')) return;
    var b = document.createElement('button');
    b.id = 'lang-btn';
    b.type = 'button';
    b.title = 'Language / 语言';
    b.setAttribute('aria-label', 'Switch language');
    b.style.cssText = 'border:1px solid var(--line-strong,#1f1c19);background:transparent;color:inherit;' +
      'border-radius:6px;padding:7px 10px;font-size:12px;font-weight:700;cursor:pointer;flex:none;margin-left:8px;font-family:inherit;';
    b.addEventListener('click', function () {
      setLang(lang() === 'zh' ? 'en' : 'zh');
    });
    var nav = document.querySelector('.nav-links');
    if (nav) {
      var theme = document.getElementById('theme-btn');
      nav.insertBefore(b, theme || null);
    } else {
      var top = document.querySelector('.top-actions');
      if (top) top.insertBefore(b, top.firstChild);
    }
    paintButton(lang());
  }

  // keep dynamically added content translated
  var scheduled = false;
  function observe() {
    if (!('MutationObserver' in window) || !document.body) return;
    new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        if (lang() === 'zh') applyLang('zh');
      });
    }).observe(document.body, {childList: true, subtree: true, characterData: true});
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectButton();
    observe();
    applyLang(lang());
    if (lang() === 'zh') document.documentElement.lang = 'zh-CN';
  });
})();
