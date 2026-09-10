/* Sandcode shared helpers — theme + clipboard, used by both the marketing
   site (script.js) and the workspace app (workspace-pages.js). Exposed as
   window.Sand; Sand.initTheme() must run after chrome.js has mounted. */
(function () {
  // theme: dark default, light on toggle; preference shared across pages
  function setTheme(t) {
    document.body.dataset.theme = t;
    var b = document.getElementById('theme-btn');
    if (b) b.textContent = (t === 'dark') ? '☀' : '☾';
    try { localStorage.setItem('sandcode-theme', t); } catch (e) {}
  }
  function initTheme() {
    var t = 'dark';
    try { t = localStorage.getItem('sandcode-theme') || 'dark'; } catch (e) {}
    setTheme(t);
    var b = document.getElementById('theme-btn');
    if (b) b.addEventListener('click', function () {
      setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
    });
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
