/* Sandcode shared chrome — injects nav/footer (marketing) and sidebar/topbar
   (workspace) so 13 pages don't duplicate the same ~30 lines of markup.
   Loaded before i18n.js so injected text is picked up for translation.
   Active link is derived from the current filename. */
(function () {
  var page = location.pathname.split('/').pop() || 'index.html';

  // ---- marketing nav + footer ----
  var NAV = [
    { href: 'https://github.com/pepedesigner/Sand-code', text: 'GitHub', ext: true },
    { href: './index.html', text: 'Home' },
    { href: './docs.html', text: 'Docs' },
    { href: './go.html', text: 'Go' },
    { href: './zen.html', text: 'Zen' },
    { href: './enterprise.html', text: 'Enterprise' },
    { href: './workspace-overview.html', text: 'Workspace' }
  ];

  function headerHtml() {
    var links = NAV.map(function (l) {
      var attrs = l.ext ? ' target="_blank" rel="noopener"' : '';
      if (!l.ext && l.href.slice(2) === page) attrs += ' class="active"';
      return '<a href="' + l.href + '"' + attrs + '>' + l.text + '</a>';
    }).join('');
    return '<div class="wrap nav">' +
      '<a class="logo" href="./index.html"><span>SAND</span>CODE<i>*</i></a>' +
      '<button class="menu-btn" id="menu-btn" type="button" aria-label="Menu" aria-expanded="false">Open menu</button>' +
      '<nav class="nav-links" id="nav-links">' + links +
      '<button id="theme-btn" class="theme-btn" type="button" title="Toggle theme" aria-label="Toggle theme">☾</button>' +
      '<a class="btn" href="./download.html">Get Sandcode</a></nav></div>';
  }

  var FOOTER_HTML =
    '<div class="wrap fcols">' +
    '<div class="fbrand"><a class="logo" href="./index.html"><span>SAND</span>CODE<i>*</i></a><p>The open source AI coding agent for terminal, IDE, and desktop.</p></div>' +
    '<div><b>Products</b><a href="./docs.html">Docs</a><a href="./go.html">Go</a><a href="./zen.html">Zen</a><a href="./download.html">Download</a><a href="./workspace-overview.html">Workspace</a></div>' +
    '<div><b>Resources</b><a href="./enterprise.html">Enterprise</a><a href="./go.html">Pricing</a><a href="./download.html">Changelog</a><a href="./docs.html">Get started</a></div>' +
    '<div><b>Connect</b><a href="https://github.com/pepedesigner/Sand-code">GitHub</a><a href="./zen.html">Discord</a><a href="./enterprise.html">X</a></div>' +
    '</div>' +
    '<div class="wrap fbase"><span>©2026 Sandcode</span><span>Demo site inspired by opencode.ai. All trademarks belong to their respective owners.</span><span style="margin-left:auto">English</span></div>';

  // ---- workspace sidebar + topbar ----
  var WS_NAV = [
    ['workspace-overview.html', 'Overview'],
    ['workspace-go.html', 'Go'],
    ['workspace-usage.html', 'Usage'],
    ['workspace-billing.html', 'Billing'],
    ['workspace-keys.html', 'Keys'],
    ['workspace-members.html', 'Members'],
    ['workspace-settings.html', 'Settings']
  ];
  var WS_CRUMB = {
    'workspace-overview.html': 'Overview',
    'workspace-go.html': 'Go subscription',
    'workspace-usage.html': 'Usage',
    'workspace-billing.html': 'Billing',
    'workspace-keys.html': 'API keys',
    'workspace-members.html': 'Members',
    'workspace-settings.html': 'Settings'
  };
  var WS_EXTRA = { 'workspace-go.html': '<span class="model-badge">GOAT · $10/mo</span>' };

  function wsSideHtml() {
    var links = WS_NAV.map(function (l) {
      return '<a href="./' + l[0] + '"' + (l[0] === page ? ' class="active"' : '') + '>' + l[1] + '</a>';
    }).join('');
    return '<div class="side-top">' +
      '<a class="mini-logo" href="./index.html"><span>SAND</span>CODE<i>*</i></a>' +
      '<span class="env-pill"><span class="pulse"></span>local:4096</span></div>' +
      '<nav class="ws-nav"><span>Workspace</span>' + links + '</nav>' +
      '<div class="side-foot"><a class="back-site" href="./index.html">← Back to site</a></div>';
  }

  function wsTopbarHtml() {
    return '<button id="menu-side" type="button" aria-label="Menu" aria-expanded="false">☰</button>' +
      '<div class="crumbs"><span>acme</span><span class="sep">/</span><span id="crumb-sess">' + WS_CRUMB[page] + '</span></div>' +
      '<div class="top-actions">' + (WS_EXTRA[page] || '') +
      '<button id="theme-btn" class="theme-btn" type="button" title="Toggle theme" aria-label="Toggle theme">☾</button>' +
      '<span class="avatar">Q</span></div>';
  }

  function mount() {
    var header = document.querySelector('header.site-header');
    if (header) header.innerHTML = headerHtml();
    var footer = document.querySelector('footer');
    if (footer) footer.innerHTML = FOOTER_HTML;
    if (WS_CRUMB[page]) {
      var side = document.getElementById('side');
      if (side) side.innerHTML = wsSideHtml();
      var topbar = document.getElementById('topbar');
      if (topbar) topbar.innerHTML = wsTopbarHtml();
    }
  }

  // Mount synchronously so the chrome (sidebar/topbar/nav) is in the DOM
  // before first paint — otherwise navigating between pages briefly shows a
  // short/empty topbar that grows after load, making cards shift ("jump").
  // Chrome.js is loaded at the end of <body>, so the placeholder containers
  // above it are already parsed; if we ever run earlier (e.g., from <head>),
  // fall back to waiting for DOMContentLoaded.
  var placeholders = document.querySelector('header.site-header') ||
    document.querySelector('footer') ||
    document.getElementById('side');
  if (placeholders) {
    try { mount(); } catch (e) { /* keep page functional if a container is missing */ }
    document.addEventListener('DOMContentLoaded', mount);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
