# SandCode intro video

A Remotion composition (`SandcodeIntro`, 1280×720, 30fps, 720 frames / 24s) used
as a standalone marketing asset. **It is not embedded in any page** — nothing
under `../` references it — and the renders are gitignored:

| Output | Script | Tracked? |
|---|---|---|
| `out/sandcode-intro.mp4` | `npm run render` | no — ship via GitHub Releases |
| `out/poster.png` | `npm run poster` | no |
| `out/preview.gif` | `npm run preview` | no |

`public/*.png` **are** tracked: they are the render inputs.

## ⚠️ The composition is out of date

Both the screenshots and the on-screen copy predate the site's rewrite. Nothing
here matches the current site:

- `src/Main.tsx` still opens on **"The open-source AI coding agent"**; the site's
  H1 is "Flat-rate coding compute for every agent client."
- It claims **"Free models · 75+ providers · MIT open source"** — none of which
  the site says any more, and the model is now a flat-rate subscription.
- A caption reads **"Go plans — from $1/mo"**. There is no $1 plan; the pricing
  page's own FAQ opens with "Why isn't there a $1 plan?".
- The button says **"Get Sandcode"** where the site uses **"SandCode"**.
- The palette is the old warm "paper + terracotta" theme (`PAPER #f4f0e8`,
  `CLAY #bc5b34`, `NIGHT #151110`), not the current dark blue tokens.
- `public/*.png` are full-page screenshots of that older site (old nav with
  "Go", old $1/$10/$20/$100/$200 plans, the GOAT plan in the console).

Re-doing it means: re-capture the three screenshots against the current site,
update the scenes, and rewrite the copy — not just one or the other, since the
captions are read against the screenshots behind them.

## Requirements

- Node 18+.
- **Network on first run.** `npm install` pulls the dependency tree, then
  Remotion downloads its own headless Chrome and ffmpeg on first render.
- `@remotion/google-fonts` fetches Inter/JetBrains Mono **from Google at render
  time**, so a render is not offline-reproducible even after install. The site
  itself self-hosts these in `../fonts/`; loading them from there would remove
  the network dependency and fix the font mismatch described below.
- No TypeScript dependency is installed even though `tsconfig.json` sets
  `"strict": true`. Remotion transpiles with esbuild and never type-checks, so
  `strict` is currently inert. Add `typescript`, `@types/react` and
  `@types/react-dom` if you want it enforced.

## Known rough edges

- **`--frame` matters for stills.** Every scene starts at `opacity: 0`, so
  frame 0 renders the bare background. The `poster` script uses frame 120, which
  is inside the title card.
- **Scene timings are written twice.** `src/Root.tsx` declares
  `durationInFrames={720}` while `src/Main.tsx` re-states each `from` and
  `durationInFrames` per `<Sequence>`, plus a separate `dur` prop per shot.
  Changing one without the others truncates or stretches the video.
- **`travel` is bound to the screenshot pixel height.** `travel={4250}` is
  `5591 × 1280/1440 − 720`, and `travel={4139}` is the same sum for `5466`. They
  are correct today, but re-capturing a screenshot invalidates both.
- **The scenes butt together with no overlap,** and each fades to zero at its
  edges, so the transition between two dark screenshots dips through the light
  `PAPER` background — it reads as a flash of cream, not a cross-dissolve.
- **Width `1280` is hardcoded** in `Shot`/`ZoomShot` instead of using
  `useVideoConfig().width`, and `Shot`/`ZoomShot` differ only in `translateY` vs
  `scale`.
- `Config.setVideoImageFormat('jpeg')` in `remotion.config.ts` puts JPEG
  artefacts around text and screenshot edges for a frame that is almost entirely
  text; `png` costs render time but is cleaner.
