import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/* The site has no serif face and no rounded corners, so neither does this.
   Colours mirror tokens.css instead of being picked by eye, and the type is the
   same two files the site serves — loaded through the FontFace API rather than
   @remotion/google-fonts, which cannot reach either family. */
const CANVAS = '#F2F0F3';
const INK = '#0E0B1A';
const MUTED = '#5D5969';
const ACCENT = '#5A3AEB';
const LIME = '#D9FF43';

const SANS = '"Clash Grotesk", system-ui, sans-serif';
const MONO = '"Geist Mono", ui-monospace, monospace';

const handle = delayRender('Loading SandCode fonts');
Promise.all([
  new FontFace('Clash Grotesk', `url(${staticFile('clash-grotesk-variable.woff2')})`, {
    weight: '200 700',
  }).load(),
  new FontFace('Geist Mono', `url(${staticFile('geist-mono-latin.woff2')})`, {
    weight: '100 900',
  }).load(),
])
  .then((fonts) => {
    fonts.forEach((font) => document.fonts.add(font));
    return document.fonts.ready;
  })
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));

const rise = (s: number) => ({
  opacity: s,
  transform: `translateY(${interpolate(s, [0, 1], [36, 0])}px)`,
});

/* The same corner marks the site's scenes use. */
const Corners: React.FC = () => (
  <>
    {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
      <span
        key={c}
        style={{
          position: 'absolute',
          width: 14,
          height: 14,
          backgroundColor: LIME,
          top: c[0] === 't' ? 0 : undefined,
          bottom: c[0] === 'b' ? 0 : undefined,
          left: c[1] === 'l' ? 0 : undefined,
          right: c[1] === 'r' ? 0 : undefined,
        }}
      />
    ))}
  </>
);

const Mark: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span style={{backgroundColor: LIME, color: INK, padding: '0 0.14em'}}>{children}</span>
);

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fade = interpolate(frame, [0, 12, 138, 149], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const s1 = spring({frame: frame - 8, fps, config: {damping: 200, stiffness: 110}});
  const s2 = spring({frame: frame - 20, fps, config: {damping: 200, stiffness: 110}});
  const s3 = spring({frame: frame - 34, fps, config: {damping: 200, stiffness: 110}});
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CANVAS,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fade,
      }}
    >
      <Corners />
      <div style={{...rise(s1), textAlign: 'center'}}>
        <div style={{fontFamily: SANS, fontWeight: 550, fontSize: 30, color: INK}}>
          SandCode<span style={{color: ACCENT}}>*</span>
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 92,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            color: INK,
            marginTop: 34,
          }}
        >
          Flat-rate compute for
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 92,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            color: INK,
          }}
        >
          <Mark>every</Mark> agent client.
        </div>
        <div
          style={{
            width: 132,
            height: 2,
            backgroundColor: INK,
            margin: '40px auto 0',
            transform: `scaleX(${s2})`,
          }}
        />
        <div
          style={{
            ...rise(s3),
            fontFamily: MONO,
            fontSize: 23,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: MUTED,
            marginTop: 32,
          }}
        >
          8 models · 3 clouds · one pool
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* A square ink plate, like the site's buttons — not a pill. */
const Caption: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div
    style={{
      position: 'absolute',
      left: 44,
      bottom: 44,
      backgroundColor: INK,
      color: CANVAS,
      fontFamily: MONO,
      fontWeight: 500,
      fontSize: 21,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '16px 26px',
    }}
  >
    {children}
  </div>
);

const Screen: React.FC<{src: string; dur: number; travel: number; caption: string}> = ({
  src,
  dur,
  travel,
  caption,
}) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, dur - 1], [0, -travel], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateRight: 'clamp',
  });
  const fade = interpolate(frame, [0, 12, dur - 12, dur - 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{backgroundColor: CANVAS, opacity: fade, overflow: 'hidden'}}>
      <Img src={staticFile(src)} style={{width: 1280, transform: `translateY(${y}px)`}} />
      <Caption>{caption}</Caption>
    </AbsoluteFill>
  );
};

const ZoomScreen: React.FC<{src: string; dur: number; caption: string}> = ({
  src,
  dur,
  caption,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, dur - 1], [1, 1.06], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateRight: 'clamp',
  });
  const fade = interpolate(frame, [0, 12, dur - 12, dur - 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{backgroundColor: CANVAS, opacity: fade, overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{width: 1280, transform: `scale(${scale})`, transformOrigin: '50% 42%'}}
      />
      <Caption>{caption}</Caption>
    </AbsoluteFill>
  );
};

const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fade = interpolate(frame, [0, 12, 108, 119], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const s = spring({frame: frame - 10, fps, config: {damping: 200, stiffness: 110}});
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CANVAS,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fade,
      }}
    >
      <Corners />
      <div style={{...rise(s), textAlign: 'center'}}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 84,
            letterSpacing: '-0.03em',
            lineHeight: 1.06,
            color: INK,
          }}
        >
          Ship your next diff
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 84,
            letterSpacing: '-0.03em',
            lineHeight: 1.06,
            color: INK,
          }}
        >
          <Mark>today.</Mark>
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 46,
            backgroundColor: INK,
            color: CANVAS,
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: 28,
            padding: '20px 34px',
          }}
        >
          Install SandCode ›
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 23,
            letterSpacing: '0.02em',
            color: MUTED,
            marginTop: 30,
          }}
        >
          curl -fsSL https://sandcode.ai/install | bash
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: CANVAS, fontFamily: SANS}}>
      <Sequence from={0} durationInFrames={150} name="title">
        <Title />
      </Sequence>
      {/* travel = page height minus frame height, so each screen is panned end
          to end instead of stopping mid-section */}
      <Sequence from={150} durationInFrames={240} name="home">
        <Screen src="index-desktop.png" dur={240} travel={6615} caption="sandcode.ai — home" />
      </Sequence>
      <Sequence from={390} durationInFrames={270} name="pricing">
        <Screen
          src="pricing-desktop.png"
          dur={270}
          travel={7491}
          caption="Pricing — one price, every client"
        />
      </Sequence>
      <Sequence from={660} durationInFrames={120} name="console">
        <ZoomScreen src="console-desktop.png" dur={120} caption="Console — plan, usage, billing" />
      </Sequence>
      <Sequence from={780} durationInFrames={120} name="cta">
        <Cta />
      </Sequence>
    </AbsoluteFill>
  );
};
