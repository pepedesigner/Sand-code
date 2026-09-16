# SandCode intro video

A Remotion composition (`SandcodeIntro`, 1280×720, 30fps, 900 frames / 30s) used
as a standalone marketing asset. **It is not embedded in any page** — nothing
under `../` references it — and the renders are gitignored:

| Output | Script | Tracked? |
|---|---|---|
| `out/sandcode-intro.mp4` | `npm run render` | no — ship via GitHub Releases |
| `out/poster.png` | `npm run poster` | no |
| `out/preview.gif` | `npm run preview` | no |

`public/*` **is** tracked: the screenshots and the two font files are the render
inputs.

## Scenes

| Frames | Scene | Notes |
|---|---|---|
| 0–149 | title | wordmark, H1, rule, `8 models · 3 clouds · one pool` |
| 150–389 | home | `index-desktop.png`, travel 6615 |
| 390–659 | pricing | `pricing-desktop.png`, travel 7491 |
| 660–779 | console | `console-desktop.png`, held and slowly scaled |
| 780–899 | CTA | install command and button |

`travel` is the screenshot's pixel height minus the 720px frame, so each screen
is panned end to end. **Re-capturing a screenshot invalidates it** — the current
values are 7335 − 720 and 8211 − 720.

## Re-capturing the screenshots

The screenshots must be taken with **`prefers-reduced-motion: reduce`**. The
site's scroll-reveal animations leave everything below the fold at `opacity: 0`
until it is scrolled into view, so a plain full-page capture is blank for most of
its length — the reduce-motion query makes `initMotion()` bail and the CSS forces
the revealed elements visible, which is what you want for a still.

```bash
cd ..
python3 -m http.server 8080
# in a 1280×720 viewport, light theme, reduced motion:
#   index.html          -> remotion/public/index-desktop.png   (full page)
#   pricing.html        -> remotion/public/pricing-desktop.png (full page)
#   workspace-overview  -> remotion/public/console-desktop.png (viewport shot —
#                          the console is a fixed-height app on an inner scroller)
```

## Fonts

`public/clash-grotesk-variable.woff2` and `public/geist-mono-latin.woff2` are
copies of `../fonts/`. They are loaded through the FontFace API in `Main.tsx`
behind a `delayRender`, because neither family is on Google Fonts and so
`@remotion/google-fonts` cannot reach them. That also makes a render fully
offline-reproducible — the old composition fetched Inter at render time.

If the site's fonts change, re-copy them here; there is no build step linking the
two.

## Requirements

- Node 18+.
- **Network on first run only.** `npm install` pulls the dependency tree, then
  Remotion downloads its own headless Chrome and ffmpeg.
- No TypeScript dependency is installed even though `tsconfig.json` sets
  `"strict": true`. Remotion transpiles with esbuild and never type-checks, so
  `strict` is currently inert. Add `typescript`, `@types/react` and
  `@types/react-dom` if you want it enforced.

## Known rough edges

- **`--frame` matters for stills.** Every scene starts at `opacity: 0`, so frame
  0 renders the bare background. The `poster` script uses frame 120, inside the
  title card.
- **Scene timings are written twice.** `src/Root.tsx` declares
  `durationInFrames={900}` while `src/Main.tsx` re-states each `from` and
  `durationInFrames` per `<Sequence>`, plus a separate `dur` prop per screen.
  Changing one without the others truncates or stretches the video.
- **The scenes butt together with no overlap** and each fades to zero at its
  edges. That is benign now that every scene shares the `CANVAS` background —
  the dip is invisible — but it is still a fade rather than a cross-dissolve.
- **Width `1280` is hardcoded** in `Screen`/`ZoomScreen` instead of using
  `useVideoConfig().width`, and the two differ only in `translateY` vs `scale`.
- `@remotion/google-fonts` is still in `package.json` although nothing imports it
  now. Removing it means regenerating the lockfile.
