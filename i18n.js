/* Sandcode i18n engine — EN ⇄ 中文, dictionary-driven, zero HTML edits.
   - Toggle is auto-injected into marketing navs + workspace topbars.
   - Language follows the browser (zh* → 中文, anything else → English) until the
     visitor flips the toggle, after which that choice is persisted.
   - Dictionaries (i18n-dict-*.js) lazily load on the first switch to 中文, so
     page loads don't pay for ~850 entries nobody reads in EN mode. Pages with
     中文 selected preload them from an inline bootstrap, which also gates the
     document so it never paints English first.
   - Static text nodes, placeholder/title/aria-label attrs and <title> swap.
   - The MutationObserver translates only the subtrees a mutation actually
     touched, coalesced on a short trailing debounce. A whole-document re-walk
     would otherwise run continuously: the hero terminal rewrites its DOM every
     ~16ms and the stat counters every frame.
   - Original EN strings are stored on the text node itself (GC-friendly —
   no strong registry that keeps detached nodes alive).
   - Unmapped nodes stay English. Persisted in localStorage. */
(function () {
  var KEY = 'sandcode-lang';
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  var DICT_FILES = ['i18n-dict-a.js', 'i18n-dict-b.js', 'i18n-dict-c.js'];
  var GATE = 'i18n-pending'; // set by the inline bootstrap, cleared here
  var DEBOUNCE = 120;
  var origAttr = new WeakMap(); // Element -> {attr: original EN}
  var _origTitle = document.title; // captured at parse time (static EN)
  var applying = false; // suppress observer while this engine writes
  var dictPromise = null;
  var queued = null; // Set of nodes whose subtree needs (re)translating
  var timer = null;

  function dict() { return window.__I18N || {}; }
  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  // An explicit choice always wins. Otherwise follow the browser, which the
  // inline bootstrap already resolved pre-paint into window.__sandLang — asking
  // it again here keeps the first render and this engine in agreement.
  function lang() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved) return saved;
    } catch (e) { /* private mode: fall through to the browser preference */ }
    if (window.__sandLang) return window.__sandLang;
    var n = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    return /^zh/i.test(n) ? 'zh' : 'en';
  }

  // dictionaries are only needed for 中文 — load once, on demand
  function loadDicts() {
    if (dictPromise) return dictPromise;
    dictPromise = new Promise(function (resolve) {
      var left = DICT_FILES.length;
      DICT_FILES.forEach(function (src) {
        var s = document.createElement('script');
        s.src = './' + src;
        s.onload = function () { if (--left === 0) resolve(); };
        s.onerror = function () {
          console.warn('[sandcode] i18n dictionary failed to load:', src);
          if (--left === 0) resolve();
        };
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

  // text nodes under `root` (a text node root yields itself)
  function eachText(root, fn) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = walker.nextNode())) {
      var p = n.parentElement;
      if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE')) continue;
      fn(n);
    }
  }

  // observer callbacks are microtasks — they run before this timer clears the flag
  function unlock() { setTimeout(function () { applying = false; }, 0); }

  function translate(root, l) {
    eachText(root, function (t) { swapTextNode(t, l); });
    if (root.nodeType === 1) swapAttrs(root, l);
  }

  function applyLang(l) {
    applying = true;
    try {
      translate(document.body, l);
      swapAttrs(document, l);
      var titleKey = norm(_origTitle);
      if (l === 'zh' && dict()[titleKey] !== undefined) document.title = dict()[titleKey];
      else document.title = _origTitle;
    } finally { unlock(); }
  }

  function flush() {
    timer = null;
    var nodes = queued;
    queued = null;
    if (!nodes || lang() !== 'zh') return;
    applying = true;
    try {
      nodes.forEach(function (n) {
        // the terminal replaces its whole subtree every frame — detached nodes
        // are stale, so translating them would only burn time
        if (n.isConnected) translate(n, 'zh');
      });
    } finally { unlock(); }
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

  // keep dynamically added content translated — only the changed subtrees.
  // `applying` means the records came from our own writes, so they are ignored.
  function observe() {
    if (!('MutationObserver' in window) || !document.body) return;
    new MutationObserver(function (records) {
      if (applying || lang() !== 'zh') return;
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.type === 'characterData') {
          if (!queued) queued = new Set();
          queued.add(r.target);
          continue;
        }
        for (var j = 0; j < r.addedNodes.length; j++) {
          if (!queued) queued = new Set();
          queued.add(r.addedNodes[j]);
        }
      }
      if (!queued) return;
      clearTimeout(timer);
      timer = setTimeout(flush, DEBOUNCE);
    }).observe(document.body, {childList: true, subtree: true, characterData: true});
  }

  // the inline bootstrap hides the page until the dictionaries land, so 中文
  // visitors never see an English first paint
  function ungated() { document.documentElement.classList.remove(GATE); }

  document.addEventListener('DOMContentLoaded', function () {
    injectButton();
    observe();
    if (lang() === 'zh') loadDicts().then(function () { applyLang('zh'); ungated(); });
    else { applyLang('en'); ungated(); }
    document.documentElement.lang = lang() === 'zh' ? 'zh-CN' : 'en';
  });
})();
