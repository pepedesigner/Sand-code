# SandCode

A self-contained static demo site for **SandCode** — flat-rate coding compute for agent clients. Built with plain HTML / CSS / JavaScript (no build step, no backend), styled with the SandBase design language — a light canvas with hairline-bordered white surfaces, square corners, one violet accent and a lime highlight — plus a mock console application that uses the same tokens.

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

- `chrome.js` — single source for shared shell: marketing nav + footer, console sidebar + topbar. It injects the chrome into empty placeholders (`<header class="site-header">`, `<footer>`, `<aside id="side">`, `<header id="topbar">`) and derives the active nav link from the current filename. The console sidebar is grouped (Workspace / Spend / Account) and the marketing nav collapses to a disclosure menu below 1024px, where it stops fitting on one line. Mounts synchronously so navigation between pages doesn't flash or jump.
- `common.js` — shared helpers on `window.Sand`: theme (follows the OS `prefers-color-scheme` until the visitor picks one, then that choice is persisted across marketing + console) and clipboard with execCommand fallback.
- `style.css` / `script.js` — shared marketing styles + interactions (tabs, copy fallback, mobile menu, waitlist, terminal typing, scroll reveals via local GSAP + ScrollTrigger in `vendor/`).
- `workspace.css` / `workspace-pages.js` — console app styles + mock interactions (theme, daily bars, wallet top-up, key create/rotate/revoke, member invite, settings toasts). All dynamic rows are built with DOM APIs, never `innerHTML` from user input.
- `tokens.css` — design tokens, single source of truth (type scale, surfaces, hairlines, radii, motion, layout, the `--z-*` stacking ladder, and the translucent `--chrome-bg` / `--tint-*` washes; **light default + re-derived dark**). Loaded before `style.css` / `workspace.css`; both build on it, and the app's `--a*` aliases are declared on `body` so the dark values actually reach them. Also carries the `.sr-only` utility.
- `buttons.css` — the one button system used across both marketing and console surfaces. Square, ink-filled, flipping to the highlight colour on hover, plus an outlined secondary. It loads last and owns shape/size/type/state for every button; `style.css` and `workspace.css` only add fill, layout and the `.quad` quadrant component.
- `fonts.css` + `fonts/` — self-hosted variable **Clash Grotesk** (UI + display) and **Geist Mono** (code and micro-labels); there is no serif face, `--font-display` aliases `--font-sans`. Latin + latin-ext + a symbols subset for the terminal frame, woff2, `font-display: swap`. Each face declares a weight *range*, and the two above-the-fold faces are preloaded from every page's `<head>`. The Inter / JetBrains Mono / Newsreader files are left in `fonts/` but no longer referenced.
- `i18n.js` + `i18n-dict-{a,b,c}.js` — EN ⇄ 中文, picked from the browser language (`zh*` → 中文, otherwise English) until the visitor uses the auto-injected toggle, after which that choice is persisted. Lazy-loads the dictionaries for a 中文 render; code/numbers/names stay English. ~823 entries. The inline bootstrap resolves the language pre-paint, preloads the dictionaries and gates the page when 中文 is selected, so it never paints English first; the MutationObserver only re-translates the subtrees that changed.
- `check-i18n.js` — dictionary lint: `node check-i18n.js` reports dictionary keys that no longer match any page/JS text (stale after copy edits) and duplicate keys. Matching is exact, the way the engine looks strings up — substring matching would hide real orphans. Exits 1 on findings.
- `remotion/` — a standalone Remotion intro video kept for marketing use. It is **not embedded in any page**; renders (`remotion/out/`, `poster.png`, `preview.gif`) are gitignored and distributed via GitHub Releases.
- `robots.txt` / `sitemap.xml` — the six marketing pages are indexable; every `workspace-*.html` carries `noindex` (demo-only).
- `favicon.svg` + og/twitter meta + `canonical` — shared social-card and SEO basics on every page. The card image is `assets/og.png` (1200×630), rendered from the same tokens as the site — it still shows the earlier dark/blue palette and needs re-rendering.

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
