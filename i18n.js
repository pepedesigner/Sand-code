/* Sandcode i18n engine — EN ⇄ 中文, dictionary-driven, zero HTML edits.
   - Toggle is auto-injected into marketing navs + workspace topbars.
   - Language follows the browser (zh* → 中文, anything else → English) until the
     visitor flips the toggle, after which that choice is persisted. The inline
     bootstrap resolves it the same way pre-paint into window.__sandLang, and
     this file normalises through the same /^zh/i test so the two can never
     disagree (a stored 'zh-CN' must mean the same thing to both).
   - Dictionaries (i18n-dict-*.js) lazily load on the first 中文 render, so page
     loads don't pay for ~850 entries nobody reads in EN mode. Pages with 中文
     selected preload them from the inline bootstrap, which also gates the
     document so it never paints English first. A failed load is not remembered,
     so the next toggle retries instead of silently staying English.
   - Static text nodes, placeholder/title/aria-label attrs and <title> swap.
   - The MutationObserver translates only the subtrees a mutation actually
     touched, coalesced on a short trailing debounce. A whole-document re-walk
     would otherwise run continuously: the hero terminal rewrites its DOM every
     ~16ms and the stat counters every frame.
   - The original string is kept on the node itself (GC-friendly — no strong
     registry that keeps detached nodes alive) together with the last value this
     engine wrote, so a write by anyone else is adopted as the new original
     instead of being reverted to a stale one.
   - Unmapped nodes stay English. Persisted in localStorage. */
(function () {
  var KEY = 'sandcode-lang';
  var V = '?v=5'; // same cache-busting convention as the other assets
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  var DICT_FILES = ['i18n-dict-a.js', 'i18n-dict-b.js', 'i18n-dict-c.js'];
  var GATE = 'i18n-pending'; // set by the inline bootstrap, cleared here
  var DEBOUNCE = 120;
  var attrState = new WeakMap(); // Element -> {src:{attr:EN}, last:{attr:written}}
  var _origTitle = document.title; // captured at parse time (static EN)
  var applying = false; // suppress observer while this engine writes
  var dictPromise = null;
  var queued = null; // Set of nodes whose subtree needs (re)translating
  var timer = null;

  function dict() { return window.__I18N || {}; }
  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  // One normalisation for every source: an explicit choice wins, then whatever
  // the bootstrap resolved pre-paint, then the browser itself.
  function lang() {
    var src = null;
    try { src = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
    if (!src) src = window.__sandLang;
    if (!src) src = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    return /^zh/i.test(src) ? 'zh' : 'en';
  }

  // dictionaries are only needed for 中文 — load on demand, retry after failure
  function loadDicts() {
    if (dictPromise) return dictPromise;
    dictPromise = new Promise(function (resolve) {
      var left = DICT_FILES.length;
      var failed = false;
      function done() {
        if (--left > 0) return;
        if (failed) dictPromise = null; // do not memoise a failure for the session
        resolve();
      }
      DICT_FILES.forEach(function (src) {
        var s = document.createElement('script');
        s.src = './' + src + V;
        s.onload = done;
        s.onerror = function () {
          failed = true;
          console.warn('[sandcode] i18n dictionary failed to load:', src);
          done();
        };
        document.head.appendChild(s);
      });
    });
    return dictPromise;
  }

  function setLang(l) {
    try { localStorage.setItem(KEY, l); } catch (e) {}
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
    if (l === 'zh') {
      loadDicts().then(function () { applyLang(l); paintButton(l); })
        .catch(function (e) { console.warn('[sandcode] i18n apply failed:', e); });
    } else { applyLang(l); paintButton(l); }
  }

  function swapTextNode(node, l) {
    var cur = node.nodeValue;
    // a writer other than this engine changed the node — adopt it as the source
    if (node.__i18nEN === undefined || (cur !== node.__i18nEN && cur !== node.__i18nLast)) {
      node.__i18nEN = cur;
    }
    var src = node.__i18nEN;
    var m = src.match(/^(\s*)([\s\S]*?)(\s*)$/);
    var key = norm(m[2]);
    if (!key) return;
    var next = (l === 'zh' && dict()[key] !== undefined) ? m[1] + dict()[key] + m[3] : src;
    if (cur !== next) { node.nodeValue = next; node.__i18nLast = next; }
  }

  function swapAttrs(root, l) {
    var els = root.querySelectorAll ? root.querySelectorAll('[' + ATTRS.join('],[') + ']') : [];
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        var st = attrState.get(el) || { src: {}, last: {} };
        ATTRS.forEach(function (a) {
          if (!el.hasAttribute(a)) return;
          var cur = el.getAttribute(a);
          // same rule as text nodes: someone else's write becomes the new source
          if (st.src[a] === undefined || (cur !== st.src[a] && cur !== st.last[a])) st.src[a] = cur;
          var key = norm(st.src[a]);
          var next = (l === 'zh' && dict()[key] !== undefined) ? dict()[key] : st.src[a];
          if (cur !== next) { el.setAttribute(a, next); st.last[a] = next; }
        });
        attrState.set(el, st);
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
      eachText(document.body, function (t) { swapTextNode(t, l); });
      swapAttrs(document, l); // covers <head> too; swapAttrs(document.body) would repeat this
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
    // bail out rather than leaving a detached button with a live click handler
    var nav = document.querySelector('.nav-links');
    var top = nav ? null : document.querySelector('.top-actions');
    if (!nav && !top) return;
    var b = document.createElement('button');
    b.id = 'lang-btn';
    b.type = 'button';
    b.title = 'Language / 语言';
    b.setAttribute('aria-label', 'Switch language');
    b.style.cssText = 'border:1px solid var(--line,#DBD8DF);background:transparent;color:var(--muted,#5D5969);' +
      'border-radius:0;padding:8px 10px;font-family:var(--font-mono,monospace);font-size:11px;font-weight:500;' +
      'letter-spacing:.08em;text-transform:uppercase;cursor:pointer;flex:none;margin-left:8px;';
    b.addEventListener('click', function () {
      setLang(lang() === 'zh' ? 'en' : 'zh');
    });
    if (nav) nav.insertBefore(b, document.getElementById('theme-btn') || null);
    else top.insertBefore(b, top.firstChild);
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
    if (lang() === 'zh') {
      loadDicts()
        .then(function () { applyLang('zh'); })
        .catch(function (e) { console.warn('[sandcode] i18n apply failed:', e); })
        .then(ungated); // always un-hide, even if applying threw
    } else { applyLang('en'); ungated(); }
    document.documentElement.lang = lang() === 'zh' ? 'zh-CN' : 'en';
  });
})();
