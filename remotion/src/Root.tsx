import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SandcodeIntro"
        component={Main}
        durationInFrames={720}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
