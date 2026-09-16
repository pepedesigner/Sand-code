# SandCode

A self-contained static demo site for **SandCode** — flat-rate coding compute for agent clients. Built with plain HTML / CSS / JavaScript (no build step, no backend), styled with the SandBase design language — a light canvas with hairline-bordered white surfaces, square corners, one violet accent and a lime highlight — plus a mock console application that uses the same tokens. Fully translated into eight languages alongside English.

Everything the site needs runs offline: the fonts and the favicon are vendored locally, and there are no runtime dependencies at all.

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
- `common.js` — shared helpers on `window.Sand`: theme (follows the OS `prefers-color-scheme` until the visitor picks one, then that choice is persisted across marketing + console, and drives the mobile `theme-color`) and clipboard with execCommand fallback.
- `style.css` / `script.js` — shared marketing styles + interactions (tabs, copy fallback, mobile menu, waitlist, terminal typing, scroll reveals). **No animation library.** The hero entrance and the client marquee are CSS keyframes the compositor runs off the main thread; the scroll reveals, the stat count-up, the retracting header, the progress bar and back-to-top are IntersectionObserver plus one passive scroll listener. GSAP + ScrollTrigger used to do this and cost 46 KB gzipped — a third of the page — for easing the platform already provides.
- `workspace.css` / `workspace-pages.js` — console app styles + mock interactions (theme, wallet top-up, key create/rotate/revoke, member invite, settings toasts). Every meter is drawn as discrete cells rather than a smooth fill — `.ubar` and the daily columns are tiled gradients on `--pitch` / `--pitch-v`, so the grid itself is the unit and the empty cells show the remaining quota. The daily columns are quantised to whole cells in JS so a column never ends mid-block. Dynamic rows are built with DOM APIs, never `innerHTML`.
- `tokens.css` — design tokens, single source of truth (type scale, surfaces, hairlines, radii, motion, layout, the `--z-*` stacking ladder, and the translucent `--chrome-bg` / `--tint-*` washes; **light default + re-derived dark**). Loaded before `style.css` / `workspace.css`; both build on it, and the app's `--a*` aliases are declared on `body` so the dark values actually reach them. Also carries the `.sr-only` utility.
- `buttons.css` — the one button system used across both marketing and console surfaces. Square, ink-filled, flipping to the highlight colour on hover, plus an outlined secondary. It loads last and owns shape/size/type/state for every button; `style.css` and `workspace.css` only add fill, layout and the `.quad` quadrant component.
- `chrome.css` — styles for the shell that `chrome.js` and `i18n.js` inject: the language picker and the skip link. A separate file because both surfaces need it — the marketing pages and the console each otherwise own only their own layout.
- `fonts.css` + `fonts/` — self-hosted variable **Clash Grotesk** (UI + display) and **Geist Mono** (code and micro-labels); there is no serif face, `--font-display` aliases `--font-sans`. Latin + latin-ext + a symbols subset for the terminal frame, woff2, `font-display: swap`. Each face declares a weight *range*, and the two above-the-fold faces are preloaded from every page's `<head>`.
- `i18n.js` + `i18n-<code>.js` — **9 languages** (en, zh, ja, ko, es, de, fr, pt, ru). The `LANGS` table in `i18n.js` is the single source of truth; a language follows the browser's first supported tag until the visitor picks one from the auto-injected picker, after which that choice is persisted. One dictionary per language, lazily loaded, so a page load never pays for entries nobody reads — code, numbers and brand names stay as written in every language. Unmapped strings fall back to English per string, not per page. The inline bootstrap in each page resolves the language pre-paint, preloads that language's file and gates the document, so a non-English visitor never sees an English first paint; the MutationObserver only re-translates the subtrees that changed.
- `check-i18n.js` — dictionary lint: `node check-i18n.js` reports orphan keys (a key no page or script ever produces), duplicate keys within a language, and **coverage gaps** (a key another language translates and this one does not, which would silently fall back to English). Matching is exact, the way the engine looks strings up — substring matching would hide real orphans. Exits 1 on findings.
- `remotion/` — a standalone Remotion intro video kept for marketing use. It is **not embedded in any page**; renders (`remotion/out/`, `poster.png`, `preview.gif`) are gitignored and distributed via GitHub Releases.
- `robots.txt` / `sitemap.xml` — the six marketing pages are indexable; every `workspace-*.html` carries `noindex` (demo-only).
- `favicon.svg` + og/twitter meta + `canonical` — shared social-card and SEO basics on every page. The card image is `assets/og.png` (1200×630), rendered from the same `fonts.css` / `tokens.css` the site ships: a throwaway page laid out at 1200×630 with `zoom:2`, screenshotted, downscaled with LANCZOS and quantised to a 64-colour palette (40 KB). Re-render it the same way after a token change rather than redrawing it by hand.

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080/index.html
```

## Checks

```bash
node check-i18n.js   # every language: orphans, duplicates, coverage gaps
```

## Languages

English plus eight translations, all at full coverage of the same 829 keys —
adding a language means adding one `i18n-<code>.js`, one row in the `LANGS`
table in `i18n.js`, and one entry in the inline bootstrap's supported list. The
lint fails the build if the new file is missing a key any other language has, so
a partial translation cannot ship silently.

Other things worth knowing when editing:

- **The `<em>` in a headline is a fragment boundary.** `h1`/`h2` highlights are
  built from three separate dictionary entries (`"Flat-rate compute for"`,
  `"every"`, `"agent client."`), concatenated in DOM order, so each language has
  to choose fragments that read correctly once joined — word order differs.
- **The keys are the English source strings.** Editing English copy re-keys that
  string in every language; `check-i18n.js` then reports the old key as an
  orphan in all eight files, which is the signal to re-translate it.

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
