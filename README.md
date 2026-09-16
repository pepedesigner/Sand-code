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
| `workspace-*.html` | Mock console app (no backend): overview, coding plan, usage, billing, keys, members, settings. Behind the sign-in gate — a signed-out visitor is redirected before the page paints |
| `signin.html` | Sign in — GitHub or email/password, then into the console |
| `signup.html` | Create an account — the same form, plus the note on why trials are verified with GitHub |

## Structure

- `chrome.js` — single source for shared shell: marketing nav + footer, console sidebar + topbar. It injects the chrome into empty placeholders (`<header class="site-header">`, `<footer>`, `<aside id="side">`, `<header id="topbar">`) and derives the active nav link from the current filename. The console sidebar is grouped (Workspace / Spend / Account) and the marketing nav collapses to a disclosure menu below 1024px, where it stops fitting on one line. Mounts synchronously so navigation between pages doesn't flash or jump.
- `common.js` — shared helpers on `window.Sand`: theme (follows the OS `prefers-color-scheme` until the visitor picks one, then that choice is persisted across marketing + console, and drives the mobile `theme-color`) and clipboard with execCommand fallback.
- `style.css` / `script.js` — shared marketing styles + interactions (tabs, copy fallback, mobile menu, waitlist, terminal typing, scroll reveals, and the hero's canvas dot field). **No animation library.** The hero entrance and the client marquee are CSS keyframes the compositor runs off the main thread; the scroll reveals, the stat count-up, the retracting header, the progress bar and back-to-top are IntersectionObserver plus one passive scroll listener. GSAP + ScrollTrigger used to do this and cost 46 KB gzipped — a third of the page — for easing the platform already provides.
- `dither.js` — the sign-in / sign-up background: the React Bits `<Dither />` effect ported to a single raw WebGL pass (noise wave, then an 8×8 ordered dither). The reference is a three.js scene plus a postprocessing Effect; the shader *is* the effect, so this ships without three.js, without a build step, and without the several hundred KB that stack would drag in. It fails quiet — no WebGL, or a shader that will not build, leaves the page's own background in place. Loaded only by the two auth pages.
- `workspace.css` / `workspace-pages.js` — console app styles + mock interactions (theme, wallet top-up, key create/rotate/revoke, member invite, settings toasts). Money and key actions go through a native `<dialog>` rather than acting on click and hoping: topping up asks which amount, and creating a key is two steps because the secret exists once. Because it is a real modal, focus trapping, Escape, focus restore and the inert background come from the platform. Every meter is drawn as discrete cells rather than a smooth fill — `.ubar` and the daily columns are tiled gradients on `--pitch` / `--pitch-v`, so the grid itself is the unit and the empty cells show the remaining quota. The daily columns are quantised to whole cells in JS so a column never ends mid-block. Dynamic rows are built with DOM APIs, never `innerHTML`.
- `tokens.css` — design tokens, single source of truth (type scale, surfaces, hairlines, radii, motion, layout, the `--z-*` stacking ladder, and the translucent `--chrome-bg` / `--tint-*` washes; **light default + re-derived dark**). Loaded before `style.css` / `workspace.css`; both build on it, and the app's `--a*` aliases are declared on `body` so the dark values actually reach them. Also carries the `.sr-only` utility.
- `buttons.css` — the one button system used across both marketing and console surfaces. Square, ink-filled, flipping to the highlight colour on hover, plus an outlined secondary. It loads last and owns shape/size/type/state for every button; `style.css` and `workspace.css` only add fill, layout and the `.quad` quadrant component.
- `chrome.css` — styles for the shell that `chrome.js` and `i18n.js` inject: the language picker and the skip link. A separate file because both surfaces need it — the marketing pages and the console each otherwise own only their own layout.
- `fonts.css` + `fonts/` — self-hosted variable **Clash Grotesk** (UI + display) and **Geist Mono** (code and micro-labels); there is no serif face, `--font-display` aliases `--font-sans`. Latin + latin-ext + a symbols subset for the terminal frame, woff2, `font-display: swap`. Each face declares a weight *range*, and the two above-the-fold faces are preloaded from every page's `<head>`.
- `i18n.js` + `i18n-<code>.js` — **9 languages** (en, zh, ja, ko, es, de, fr, pt, ru). The `LANGS` table in `i18n.js` is the single source of truth; a language follows the browser's first supported tag until the visitor picks one from the auto-injected picker, after which that choice is persisted. One dictionary per language, lazily loaded, so a page load never pays for entries nobody reads — code, numbers and brand names stay as written in every language. Unmapped strings fall back to English per string, not per page. The inline bootstrap in each page resolves the language pre-paint, preloads that language's file and gates the document, so a non-English visitor never sees an English first paint; the MutationObserver only re-translates the subtrees that changed.
- `check-i18n.js` — dictionary lint: `node check-i18n.js` reports orphan keys (a key no page or script ever produces), duplicate keys within a language, and **coverage gaps** (a key another language translates and this one does not, which would silently fall back to English). Matching is exact, the way the engine looks strings up — substring matching would hide real orphans. Exits 1 on findings.
- `remotion/` — a standalone Remotion intro video kept for marketing use. It is **not embedded in any page**; renders (`remotion/out/`, `poster.png`, `preview.gif`) are gitignored and distributed via GitHub Releases.
- `robots.txt` / `sitemap.xml` — the six marketing pages are indexable; every `workspace-*.html` and the two auth pages carry `noindex` (demo-only), and `robots.txt` keeps `/workspace-` out of the index.
- `favicon.svg` — the logo mark: the **S** and the **\*** taken as real outlines from the same Clash Grotesk instance the site ships (weight 550, converted to paths at build time), white on the accent with the asterisk in the highlight colour, square-cornered like everything else. Outlines rather than `<text>`, so the tab icon cannot silently fall back to a system face — which is what the old placeholder did for a year while the rest of the site changed identity.
- og/twitter meta + `canonical` — shared social-card and SEO basics on every page. The card image is `assets/og.png` (1200×630), rendered from the same `fonts.css` / `tokens.css` the site ships: a throwaway page laid out at 1200×630 with `zoom:2`, screenshotted, downscaled with LANCZOS and quantised to a 64-colour palette (40 KB). Re-render it the same way after a token change rather than redrawing it by hand.

## Sign-in

The console sits behind a sign-in. There is no backend, so the exchange is entirely local: `signin.html` and `signup.html` write the address to `localStorage` under `sandcode-auth` and open the console, and the account menu signs out by clearing it.

The gate is a single check in the inline bootstrap of each `workspace-*.html`, before first paint:

- **Absent means signed out, and the gate fails closed.** Every `workspace-*.html` ships with `class="auth-locked"` on `<html>`, so the stylesheet hides the page from the first paint; the inline bootstrap lifts it only once the key is present, and otherwise replaces the location with `signin.html` (a `localStorage` that throws counts as absent — a browser refusing storage must not be able to open the console). Revealing from script instead would mean every way of *not* running that script — scripting off, a blocked inline script, an earlier parse error — hands the console to a signed-out visitor, which is the one outcome the gate exists to prevent. With scripting off the page falls back to a `<noscript>` notice, so it is never just blank.
- **Signing out returns to sign-in**, not the marketing home: signing out of the console is the start of signing back in.
- **Already signed in, `signin.html` / `signup.html` go straight to the console**, so the two states cannot be reached in the wrong order.
- The account menu reads the key directly rather than through `common.js` — `chrome.js` is loaded first on purpose, so the shell is in the DOM before the page scripts run — and escapes the address, since the menu is assembled as a string.

### The background

Both auth pages sit on a dithered noise field. `dither.js` renders the React Bits `<Dither />` idea in one WebGL pass: an fbm noise wave, quantised through an 8×8 Bayer matrix, drifting slowly, with the pointer opening a clearing in it. Four departures from the reference, all of them about living under a form rather than filling a hero:

- **The buffer is a few CSS pixels per cell**, blown back up by `image-rendering: pixelated`. Everything downstream is quantised anyway, so full resolution is wasted work — and it pins a dither cell to a fixed size instead of letting it drift with the device ratio.
- **The dither runs on the wave value, not on the colour.** Quantising each channel against the same threshold preserves any hue difference between the two endpoints as coloured speckle; against this palette that showed up as pink and cyan confetti in the light theme.
- **The wave is `--muted`, not the accent.** A saturated accent dithered into this canvas reads as noise rather than texture. A neutral over the page is also what the reference actually ships — grey over black.
- **The mask clears the middle.** The field builds toward the edges, so the heading and the card sit on clean canvas; a centre-weighted field buried the subtitle.

Under `prefers-reduced-motion` one frame is drawn and no loop ever starts. The loop also stops while the tab is hidden or the field is off screen, and picks up again when it is not.

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

English plus eight translations, all at full coverage of the same 822 keys —
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
| API key prefix | `sb_live_` |
| the console | **SandCode Console** |

Note the split the spec draws and the rebrand keeps: **SandBase** is the platform underneath — the API host and the key prefix — while **SandCode** is everything the customer actually buys and touches: the plan, the CLI, and the console they manage it in. So the marketing domain is `sandcode.ai` while the API is `api.sandbase.ai`; that is not a typo.

That last row is the one to be careful with. The API hostname says `sandbase`, and it is tempting to follow it into the product name — but the console is **SandCode Console**, and it is what a customer sees in their own tab and in the crumb. `SandBase Console` is wrong everywhere.

Two figures on the site are fixed by the spec's canonical snapshot and are quoted from it verbatim, not derived: the month is **$41.60 of $70.00 ($28.40 left)**, and the cache multiplier is **2.8×** — the spec names 2.8× the only figure allowed externally, so the worked example on the Models page is built to reproduce it rather than to show the raw best case.
