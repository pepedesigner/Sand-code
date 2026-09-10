/* Sandcode i18n engine — EN ⇄ 中文, dictionary-driven, zero HTML edits.
   - Toggle is auto-injected into marketing navs + workspace topbars.
   - Dictionaries (i18n-dict-*.js) lazy-load on first switch to 中文, so page
     loads don't pay for ~530 entries nobody reads in EN mode.
   - Static text nodes, placeholder/title/aria-label attrs and <title> swap.
   - MutationObserver picks up dynamically rendered strings (toasts, rows…);
     writes made by this engine are suppressed while applying, so the observer
     never re-triggers itself.
   - Original EN strings are stored on the text node itself (GC-friendly —
     no strong registry that keeps detached nodes alive).
   - Unmapped nodes stay English. Persisted in localStorage. */
(function () {
  var KEY = 'sandcode-lang';
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  var DICT_FILES = ['i18n-dict-a.js', 'i18n-dict-b.js', 'i18n-dict-c.js'];
  var origAttr = new WeakMap(); // Element -> {attr: original EN}
  var _origTitle = document.title; // captured at parse time (static EN)
  var applying = false; // suppress observer while this engine writes
  var dictPromise = null;

  function dict() { return window.__I18N || {}; }
  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  function lang() {
    try { return localStorage.getItem(KEY) || 'en'; } catch (e) { return 'en'; }
  }

  // dictionaries are only needed for 中文 — load once, on demand
  function loadDicts() {
    if (dictPromise) return dictPromise;
    dictPromise = new Promise(function (resolve) {
      var left = DICT_FILES.length;
      DICT_FILES.forEach(function (src) {
        var s = document.createElement('script');
        s.src = './' + src;
        s.onload = s.onerror = function () { if (--left === 0) resolve(); };
        document.head.appendChild(s);
      });
    });
    return dictPromise;
  }

  function setLang(l) {
    try { localStorage.setItem(KEY, l); } catch (e) {}
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
    if (l === 'zh') loadDicts().then(function () { applyLang(l); paintButton(l); });
    else { applyLang(l); paintButton(l); }
  }

  function swapTextNode(node, l) {
    if (node.__i18nEN === undefined) node.__i18nEN = node.nodeValue;
    var src = node.__i18nEN;
    var m = src.match(/^(\s*)([\s\S]*?)(\s*)$/);
    var key = norm(m[2]);
    if (!key) return;
    var next = (l === 'zh' && dict()[key] !== undefined) ? m[1] + dict()[key] + m[3] : src;
    if (node.nodeValue !== next) node.nodeValue = next; // write only on real change
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
          var next = (l === 'zh' && dict()[key] !== undefined) ? dict()[key] : src;
          if (el.getAttribute(a) !== next) el.setAttribute(a, next); // write only on real change
        });
        origAttr.set(el, saved);
      })(els[i]);
    }
  }
  function applyLang(l) {
    applying = true;
    try {
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
    } finally {
      // observer callbacks are microtasks — they run before this timer clears the flag
      setTimeout(function () { applying = false; }, 0);
    }
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

  // keep dynamically added content translated (self-writes are ignored via `applying`)
  var scheduled = false;
  function observe() {
    if (!('MutationObserver' in window) || !document.body) return;
    new MutationObserver(function () {
      if (applying || scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        if (lang() === 'zh' && !applying) applyLang('zh');
      });
    }).observe(document.body, {childList: true, subtree: true, characterData: true});
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectButton();
    observe();
    if (lang() === 'zh') loadDicts().then(function () { applyLang('zh'); });
    else applyLang('en');
    document.documentElement.lang = lang() === 'zh' ? 'zh-CN' : 'en';
  });
})();
