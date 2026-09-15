/* Sandcode shared helpers — theme + clipboard, used by both the marketing
   site (script.js) and the workspace app (workspace-pages.js). Exposed as
   window.Sand; Sand.initTheme() must run after chrome.js has mounted. */
(function () {
  var KEY = 'sandcode-theme';
  var LIGHT_MQ = '(prefers-color-scheme: light)';

  // theme: follows the OS until the visitor picks one, then that choice wins
  // and is shared across pages. Dark is the fallback when matchMedia is absent.
  function systemTheme() {
    return (window.matchMedia && window.matchMedia(LIGHT_MQ).matches) ? 'light' : 'dark';
  }
  function storedTheme() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function paint(t) {
    document.body.dataset.theme = t;
    var b = document.getElementById('theme-btn');
    if (b) b.textContent = (t === 'dark') ? '☀' : '☾';
  }
  function current() { return document.body.dataset.theme || 'dark'; }
  function setTheme(t) {
    try { localStorage.setItem(KEY, t); } catch (e) {}
    paint(t);
  }
  function initTheme() {
    paint(storedTheme() || systemTheme());
    var b = document.getElementById('theme-btn');
    if (b) b.addEventListener('click', function () {
      setTheme(current() === 'dark' ? 'light' : 'dark');
    });
    // keep following the OS while the visitor has not chosen explicitly
    if (window.matchMedia) {
      var mq = window.matchMedia(LIGHT_MQ);
      var onChange = function () { if (!storedTheme()) paint(systemTheme()); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  // clipboard with execCommand fallback; resolves on success, rejects on failure
  function fallbackCopy(text, resolve, reject) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      resolve();
    } catch (e) { reject(e); }
  }
  function copyText(text) {
    return new Promise(function (resolve, reject) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(resolve, function () { fallbackCopy(text, resolve, reject); });
          return;
        }
        fallbackCopy(text, resolve, reject);
      } catch (e) { fallbackCopy(text, resolve, reject); }
    });
  }

  window.Sand = { setTheme: setTheme, initTheme: initTheme, copyText: copyText };
})();
