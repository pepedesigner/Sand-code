# SandCode

A self-contained static demo site for **SandCode** — flat-rate coding compute for agent clients. Built with plain HTML / CSS / JavaScript (no build step, no backend), styled as a terminal-dark developer-tool marketing site plus a mock console application.

Everything the site needs runs offline: fonts, GSAP, and the favicon are all vendored locally.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home — positioning, install tabs, `sandbase setup` terminal, pain-point features, stats, plan teaser, use cases, transparency, FAQ, waitlist |
| `pricing.html` | Pricing — Standard / Pro / Team / PAYG, the three-buffer limit model, rewards and referral programme, positioning quadrant, qualitative comparison, error semantics, fair use, FAQ |
| `zen.html` | Models — the eight-model matrix with cache rates, prompt-caching explainer, bundled search / scrape / GitHub tools |
| `docs.html` | Docs — quickstart, endpoints, MCP tools, local harness, rules sync, migrate, rewards, errors, retention |
| `download.html` | Install — CLI commands, the eight client integrations, GitHub connector, FAQ |
| `enterprise.html` | Enterprise — no-training commitment, tiered retention, data residency, team seats, contact |
| `workspace-*.html` | Mock console app (no backend): overview, coding plan, usage, billing, keys, members, growth, settings |

## Structure

- `chrome.js` — single source for shared shell: marketing nav + footer, console sidebar + topbar. It injects the chrome into empty placeholders (`<header class="site-header">`, `<footer>`, `<aside id="side">`, `<header id="topbar">`) and derives the active nav link from the current filename. Mounts synchronously so navigation between pages doesn't flash or jump.
- `common.js` — shared helpers on `window.Sand`: theme (follows the OS `prefers-color-scheme` until the visitor picks one, then that choice is persisted across marketing + console) and clipboard with execCommand fallback.
- `style.css` / `script.js` — shared marketing styles + interactions (tabs, copy fallback, mobile menu, waitlist, terminal typing, scroll reveals via local GSAP + ScrollTrigger in `vendor/`).
- `workspace.css` / `workspace-pages.js` — console app styles + mock interactions (theme, daily bars, wallet top-up, key create/rotate/revoke, member invite, settings toasts). All dynamic rows are built with DOM APIs, never `innerHTML` from user input.
- `tokens.css` — design tokens, single source of truth (type, surfaces, hairlines, radii, motion, layout; dark default + re-derived light). Loaded before `style.css` / `workspace.css`; both build on it.
- `buttons.css` — the one button system used across both marketing and console surfaces. It loads last and owns shape/size/type/state for every button; `style.css` and `workspace.css` only add fill, layout and the `.quad` quadrant component.
- `fonts.css` + `fonts/` — self-hosted variable Inter, JetBrains Mono and Newsreader (latin + latin-ext, woff2, `font-display: swap`). Each face declares a weight *range*, and the two above-the-fold latin faces are preloaded from every page's `<head>`.
- `i18n.js` + `i18n-dict-{a,b,c}.js` — EN ⇄ 中文 toggle (auto-injected, persisted). Lazy-loads on the first switch to 中文; code/numbers/names stay English. ~780 entries. The inline bootstrap preloads the dictionaries and gates the page when 中文 is stored, so it never paints English first; the MutationObserver only re-translates the subtrees that changed.
- `check-i18n.js` — dictionary lint: `node check-i18n.js` reports dictionary keys that no longer match any page/JS text (stale after copy edits) and duplicate keys. Matching is exact, the way the engine looks strings up — substring matching would hide real orphans. Exits 1 on findings.
- `remotion/` — a standalone Remotion intro video kept for marketing use. It is **not embedded in any page**; renders (`remotion/out/`, `poster.png`, `preview.gif`) are gitignored and distributed via GitHub Releases.
- `robots.txt` / `sitemap.xml` — the six marketing pages are indexable; every `workspace-*.html` carries `noindex` (demo-only).
- `favicon.svg` + og/twitter meta + `canonical` — shared social-card and SEO basics on every page.

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080/index.html
```

## Checks

```bash
node check-i18n.js   # dictionary keys vs site text
```

## Remotion video

```bash
cd remotion && npm install && npm run render   # -> remotion/out/sandcode-intro.mp4
```

## Naming map

The demo was originally built around opencode.ai and is rebranded for SandCode. Product content follows the SandCode PRD (standard plan $9.9/mo, Pro $24.9/mo, a $70 model pool, `sandbase` CLI, the eight-model Sand Zen lineup):

| opencode | SandCode |
|----------|----------|
| opencode | sandcode / SandCode |
| opencode.ai | sandcode.ai |
| `opencode-ai` (npm) | `sandbase-ai` |
| `opencode` (binary) | `sandbase` |
| OpenCode Zen | Sand Zen |
| API base `opencode.ai/zen/v1` | `https://api.sandbase.ai/v1` |
