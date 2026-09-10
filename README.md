# Sandcode

A self-contained static demo site for **Sandcode** — an open source AI coding agent. Built with plain HTML / CSS / JavaScript (no build step, no backend), styled as a terminal-dark developer-tool marketing site plus a mock single-page workspace application.

Everything runs offline: fonts, GSAP, the Remotion video, and the favicon are all vendored locally.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home — hero, install tabs, animated terminal, feature rows, use-case tabs, FAQ, banners, waitlist |
| `download.html` | Download — Terminal / Desktop / Extensions / Integrations + FAQ |
| `go.html` | Pricing — individual plans (Go / GOAT / Pro / Max / Max 20×), API, teams, comparison table, FAQ |
| `zen.html` | Zen — model lineup, method, privacy, testimonials, FAQ |
| `docs.html` | Docs — Install / Configure / Initialize / Usage / Customize |
| `enterprise.html` | Enterprise — privacy & security controls, deployment, contact |
| `workspace-*.html` | Mock workspace app (no backend): overview, go, usage, billing, keys, members, settings |

## Structure

- `chrome.js` — single source for shared shell: marketing nav + footer, workspace sidebar + topbar. It injects the chrome into empty placeholders (`<header class="site-header">`, `<footer>`, `<aside id="side">`, `<header id="topbar">`) and derives the active nav link from the current filename. Mounts synchronously so navigation between pages doesn't flash or jump.
- `common.js` — shared helpers on `window.Sand`: theme (dark by default, persisted across marketing + workspace) and clipboard with execCommand fallback.
- `style.css` / `script.js` — shared marketing styles + interactions (tabs, copy fallback, mobile menu, waitlist, terminal typing, scroll reveals via local GSAP + ScrollTrigger in `vendor/`).
- `workspace.css` / `workspace-pages.js` — workspace app styles + mock interactions (theme, daily bars, top-ups, key create/regenerate/revoke, member invite, settings toasts). All dynamic rows are built with DOM APIs, never `innerHTML` from user input.
- `tokens.css` — design tokens, single source of truth (type, surfaces, hairlines, radii, motion, layout; dark default + re-derived light). Loaded before `style.css` / `workspace.css`; both build on it.
- `buttons.css` — the one button system used across both marketing and workspace surfaces.
- `fonts.css` + `fonts/` — self-hosted variable Inter, JetBrains Mono, and Newsreader (latin + latin-ext, woff2, `font-display: swap`).
- `i18n.js` + `i18n-dict-{a,b,c}.js` — EN ⇄ 中文 toggle (auto-injected, persisted). Lazy-loads on the first switch to 中文; code/numbers/names stay English. ~530 entries.
- `check-i18n.js` — dictionary lint: `node check-i18n.js` reports dictionary keys that no longer match any page/JS text (stale after copy edits) and duplicate keys. Exits 1 on findings.
- `remotion/` — a Remotion intro video; output committed at `remotion/out/sandcode-intro.mp4`.
- `favicon.svg` + og/twitter meta — shared social-card basics on every page.

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

The demo was originally built around opencode.ai and is rebranded for Sandcode:

| opencode | Sandcode |
|----------|----------|
| opencode | sandcode / Sandcode |
| opencode.ai | sandcode.ai |
| `opencode-ai` (npm) | `sandcode-ai` |
| OpenCode Zen | Sand Zen |