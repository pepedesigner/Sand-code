import {Config} from '@remotion/cli/config';

// PNG, not JPEG: the frame is almost entirely type and flat UI, the two things
// JPEG is worst at, and it rings around every glyph edge.
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
