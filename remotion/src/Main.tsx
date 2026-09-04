import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont as loadNewsreader} from '@remotion/google-fonts/Newsreader';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';

const {fontFamily: serif} = loadNewsreader('normal', {
  weights: ['500'],
  subsets: ['latin'],
});
const {fontFamily: serifItalic} = loadNewsreader('italic', {
  weights: ['500'],
  subsets: ['latin'],
});
const {fontFamily: sans} = loadInter('normal', {
  weights: ['400', '600', '800'],
  subsets: ['latin'],
});

const PAPER = '#f4f0e8';
const INK = '#1f1c19';
const MUTED = '#6e675e';
const CLAY = '#bc5b34';
const NIGHT = '#151110';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const rise = (s: number) => ({
  opacity: s,
  transform: `translateY(${interpolate(s, [0, 1], [36, 0])}px)`,
});

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
      style={{backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center', opacity: fade}}
    >
      <div style={{...rise(s1), textAlign: 'center'}}>
        <div
          style={{
            fontFamily: sans,
            fontWeight: 800,
            fontSize: 27,
            letterSpacing: 12,
            color: CLAY,
          }}
        >
          SANDCODE
        </div>
        <div style={{fontFamily: serif, fontSize: 98, color: INK, marginTop: 26, lineHeight: 1.05}}>
          The open-source
        </div>
        <div
          style={{
            fontFamily: serifItalic,
            fontSize: 98,
            color: CLAY,
            lineHeight: 1.05,
          }}
        >
          AI coding agent
        </div>
        <div
          style={{
            width: 120,
            height: 3,
            backgroundColor: CLAY,
            margin: '34px auto 0',
            transform: `scaleX(${s2})`,
          }}
        />
        <div
          style={{...rise(s3), fontFamily: MONO, fontSize: 27, color: MUTED, marginTop: 30}}
        >
          Free models · 75+ providers · MIT open source
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Caption: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div
    style={{
      position: 'absolute',
      left: 44,
      bottom: 44,
      backgroundColor: 'rgba(21,17,16,0.88)',
      color: '#fff',
      fontFamily: sans,
      fontWeight: 600,
      fontSize: 26,
      padding: '14px 28px',
      borderRadius: 999,
    }}
  >
    {children}
  </div>
);

const Shot: React.FC<{src: string; dur: number; travel: number; caption: string}> = ({
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
    <AbsoluteFill style={{backgroundColor: NIGHT, opacity: fade, overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{width: 1280, transform: `translateY(${y}px)`}}
      />
      <Caption>{caption}</Caption>
    </AbsoluteFill>
  );
};

const ZoomShot: React.FC<{src: string; dur: number; caption: string}> = ({
  src,
  dur,
  caption,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, dur - 1], [1, 1.07], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateRight: 'clamp',
  });
  const fade = interpolate(frame, [0, 12, dur - 12, dur - 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{backgroundColor: NIGHT, opacity: fade, overflow: 'hidden'}}>
      <Img
        src={staticFile(src)}
        style={{
          width: 1280,
          transform: `scale(${scale})`,
          transformOrigin: '50% 42%',
        }}
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
      style={{backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center', opacity: fade}}
    >
      <div style={{...rise(s), textAlign: 'center'}}>
        <div style={{fontFamily: serif, fontSize: 88, color: INK, lineHeight: 1.08}}>
          Ship your next diff
        </div>
        <div style={{fontFamily: serifItalic, fontSize: 88, color: CLAY, lineHeight: 1.08}}>
          today.
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 40,
            backgroundColor: INK,
            color: '#fff',
            fontFamily: sans,
            fontWeight: 700,
            fontSize: 30,
            padding: '20px 52px',
            borderRadius: 999,
          }}
        >
          Get Sandcode
        </div>
        <div style={{fontFamily: MONO, fontSize: 25, color: MUTED, marginTop: 28}}>
          curl -fsSL https://sandcode.ai/install | bash
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, fontFamily: sans}}>
      <Sequence from={0} durationInFrames={150} name="title">
        <Title />
      </Sequence>
      <Sequence from={150} durationInFrames={180} name="home">
        <Shot src="index-desktop.png" dur={180} travel={4250} caption="sandcode.ai — home" />
      </Sequence>
      <Sequence from={330} durationInFrames={150} name="go">
        <Shot src="go-desktop.png" dur={150} travel={4139} caption="Go plans — from $1/mo" />
      </Sequence>
      <Sequence from={480} durationInFrames={120} name="workspace">
        <ZoomShot src="workspace-desktop.png" dur={120} caption="Workspace — plan, usage, billing" />
      </Sequence>
      <Sequence from={600} durationInFrames={120} name="cta">
        <Cta />
      </Sequence>
    </AbsoluteFill>
  );
};
