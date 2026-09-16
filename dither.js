/* Sandcode auth background — the React Bits <Dither /> idea, ported to raw
   WebGL.

   The reference is a three.js scene plus a postprocessing Effect. The effect
   itself is just two shaders — a noise wave, then an 8x8 ordered dither that
   quantises it — so it runs here in a single pass, with no three.js, no
   EffectComposer and no build step, which is what keeps this site the
   zero-dependency, no-build thing its README promises.

   Two deliberate departures from the reference:

   - The drawing buffer is `PIXEL` times smaller than the element and CSS blows
     it back up with `image-rendering: pixelated`. Every pixel downstream is
     quantised anyway, so rendering them at full resolution is pure waste, and
     this way a dither cell is exactly one CSS pixel block rather than drifting
     with the device ratio.
   - The 8x8 Bayer matrix is built by interleaving two 2x2 blocks instead of
     being written out as `float[64](...)`, which GLSL ES 1.00 cannot parse.

   Nothing here is fatal if it fails: no WebGL (or a shader that will not
   compile) leaves the element untouched and the page's own background shows
   through. */
(function () {
  'use strict';

  var host = document.querySelector('[data-auth-dither]');
  if (!host) return;

  // ---- knobs ------------------------------------------------------------
  // Two things separate this from the reference's defaults, and both are about
  // living under a form rather than filling a hero:
  //
  // - The wave is `--muted` (a neutral), not the brand accent. Ordered dithering
  //   renders a narrow tonal range as a speckle of single cells; dithering the
  //   lime accent into this palette produced exactly that — confetti. A grey
  //   over the canvas is what the reference actually ships (grey over black),
  //   and it reads as texture instead of noise. WAVE_MIX pulls it further toward
  //   the page so the field stays quiet.
  // - GAIN/BIAS push the noise up before it picks a colour. The fbm spends most
  //   of its time near the bottom of its range, so without this the field is
  //   empty except for a few crests.
  var PIXEL = 4;        // CSS px per dither cell (the reference's pixelSize)
  var LEVELS = 4;       // colour steps after quantisation (reference: colorNum)
  var WAVE_MIX = 0.85;  // how far the wave comes out of the background, 0..1
  var GAIN = 2.8;       // scale on the noise before it picks a colour
  var BIAS = -0.45;     // …and how far down to push it
  var SPEED = 0.03;     // wave drift
  var FREQ = 3;         // fbm octave frequency
  var AMP = 0.3;        // fbm octave falloff
  var MOUSE_RADIUS = 0.35;

  var VERT = [
    'attribute vec2 aPos;',
    'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform float uSpeed;',
    'uniform float uFreq;',
    'uniform float uAmp;',
    'uniform float uGain;',
    'uniform float uBias;',
    'uniform vec3  uWave;',
    'uniform vec3  uBack;',
    'uniform float uLevels;',
    'uniform vec2  uMouse;',
    'uniform float uMouseRadius;',
    'uniform float uMouseOn;',
    '',
    '/* 2D gradient noise (Ashima Arts / Stefan Gustavson) — the same function the',
    '   reference uses, so the wave keeps its character. */',
    'vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }',
    'vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }',
    'vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }',
    'vec2 fade(vec2 t){ return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }',
    'float cnoise(vec2 P){',
    '  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);',
    '  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);',
    '  Pi = mod289(Pi);',
    '  vec4 ix = Pi.xzxz;',
    '  vec4 iy = Pi.yyww;',
    '  vec4 fx = Pf.xzxz;',
    '  vec4 fy = Pf.yyww;',
    '  vec4 i = permute(permute(ix) + iy);',
    '  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;',
    '  vec4 gy = abs(gx) - 0.5;',
    '  vec4 tx = floor(gx + 0.5);',
    '  gx = gx - tx;',
    '  vec2 g00 = vec2(gx.x, gy.x);',
    '  vec2 g10 = vec2(gx.y, gy.y);',
    '  vec2 g01 = vec2(gx.z, gy.z);',
    '  vec2 g11 = vec2(gx.w, gy.w);',
    '  vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));',
    '  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;',
    '  float n00 = dot(g00, vec2(fx.x, fy.x));',
    '  float n10 = dot(g10, vec2(fx.y, fy.y));',
    '  float n01 = dot(g01, vec2(fx.z, fy.z));',
    '  float n11 = dot(g11, vec2(fx.w, fy.w));',
    '  vec2 fade_xy = fade(Pf.xy);',
    '  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);',
    '  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);',
    '}',
    '',
    'float fbm(vec2 p){',
    '  float value = 0.0;',
    '  float amp = 1.0;',
    '  for(int i = 0; i < 4; i++){',
    '    value += amp * abs(cnoise(p));',
    '    p *= uFreq;',
    '    amp *= uAmp;',
    '  }',
    '  return value;',
    '}',
    '',
    'float pattern(vec2 p){ return fbm(p + fbm(p - uTime * uSpeed)); }',
    '',
    '/* 8x8 ordered-dither threshold, built by interleaving two 2x2 blocks: GLSL ES',
    '   1.00 has no array constructors, so the matrix cannot be spelled out. */',
    'float bayer2(vec2 a){',
    '  a = floor(a);',
    '  return fract(a.x * 0.5 + a.y * a.y * 0.75);',
    '}',
    'float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }',
    'float bayer8(vec2 a){ return bayer4(0.5 * a) * 0.25 + bayer2(a); }',
    '',
    '/* Ordered dither of the wave value itself, then a plain mix between the two',
    '   colours. The reference quantises the colour instead, which puts every',
    '   channel through the same threshold: any hue difference between the two',
    '   endpoints survives quantisation as coloured speckle. On this palette that',
    '   came out as pink and cyan confetti in the light theme — off-palette, and',
    '   not what "one violet accent" means. One scalar keeps every dither cell on',
    '   the line between the two tokens. */',
    'float quantise(float v, float threshold){',
    '  float levels = uLevels - 1.0;',
    '  float q = floor(clamp(v, 0.0, 1.0) * levels + (threshold - 0.5)) / levels;',
    '  return clamp(q, 0.0, 1.0);',
    '}',
    '',
    'void main(){',
    '  vec2 p = gl_FragCoord.xy / uRes - 0.5;',
    '  p.x *= uRes.x / uRes.y;',
    '  float f = pattern(p) * uGain + uBias;',
    '  if(uMouseOn > 0.5){',
    '    vec2 m = (uMouse / uRes - 0.5) * vec2(1.0, -1.0);',
    '    m.x *= uRes.x / uRes.y;',
    '    f -= 0.5 * (1.0 - smoothstep(0.0, uMouseRadius, length(p - m)));',
    '  }',
    '  /* One fragment IS one dither cell — the buffer is already PIXEL-reduced, so',
    '     there is nothing to downsample here. */',
    '  float q = quantise(f, bayer8(floor(gl_FragCoord.xy)));',
    '  gl_FragColor = vec4(mix(uBack, uWave, q), 1.0);',
    '}'
  ].join('\n');

  var canvas = document.createElement('canvas');
  canvas.className = 'auth-dither';
  canvas.setAttribute('aria-hidden', 'true');
  host.insertBefore(canvas, host.firstChild);

  var gl = canvas.getContext('webgl', {
    alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power'
  });
  if (!gl) return;

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) {
    console.warn('[sandcode] dither shader failed to build:', e && e.message);
    return;
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var u = {
    res: gl.getUniformLocation(prog, 'uRes'),
    time: gl.getUniformLocation(prog, 'uTime'),
    speed: gl.getUniformLocation(prog, 'uSpeed'),
    freq: gl.getUniformLocation(prog, 'uFreq'),
    amp: gl.getUniformLocation(prog, 'uAmp'),
    gain: gl.getUniformLocation(prog, 'uGain'),
    bias: gl.getUniformLocation(prog, 'uBias'),
    wave: gl.getUniformLocation(prog, 'uWave'),
    back: gl.getUniformLocation(prog, 'uBack'),
    levels: gl.getUniformLocation(prog, 'uLevels'),
    mouse: gl.getUniformLocation(prog, 'uMouse'),
    mouseRadius: gl.getUniformLocation(prog, 'uMouseRadius'),
    mouseOn: gl.getUniformLocation(prog, 'uMouseOn')
  };
  gl.uniform1f(u.speed, SPEED);
  gl.uniform1f(u.freq, FREQ);
  gl.uniform1f(u.amp, AMP);
  gl.uniform1f(u.gain, GAIN);
  gl.uniform1f(u.bias, BIAS);
  gl.uniform1f(u.levels, LEVELS);
  gl.uniform1f(u.mouseRadius, MOUSE_RADIUS);
  gl.uniform2f(u.mouse, -1e5, -1e5);

  // ---- colour ------------------------------------------------------------
  // Read from the page's own tokens, so the field belongs to the palette and
  // follows a theme switch: the canvas is the background and the wave is a
  // neutral pulled WAVE_MIX of the way out of it.
  var rgbOf = function (v) {
    var m = String(v || '').trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : null;
  };
  function readColors() {
    var cs = getComputedStyle(document.body);
    var back = rgbOf(cs.getPropertyValue('--bg')) || [0.06, 0.04, 0.10];
    var tone = rgbOf(cs.getPropertyValue('--muted')) || [0.63, 0.61, 0.66];
    gl.uniform3f(u.back, back[0], back[1], back[2]);
    gl.uniform3f(u.wave,
      back[0] + (tone[0] - back[0]) * WAVE_MIX,
      back[1] + (tone[1] - back[1]) * WAVE_MIX,
      back[2] + (tone[2] - back[2]) * WAVE_MIX);
  }

  // ---- geometry ----------------------------------------------------------
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    var r = host.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(2, Math.round(r.width * dpr / PIXEL));
    var h = Math.max(2, Math.round(r.height * dpr / PIXEL));
    if (canvas.width === w && canvas.height === h) return false;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(u.res, w, h);
    return true;
  }

  var t0 = 0;
  function draw(now) {
    if (!t0) t0 = now;
    gl.uniform1f(u.time, (now - t0) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // ---- loop --------------------------------------------------------------
  // Only while it is both on screen and on a visible tab: a background nobody is
  // looking at should not hold a frame budget, let alone a GPU.
  var raf = 0, onScreen = true;
  function start() {
    if (reduce || raf || document.hidden || !onScreen) return;
    raf = requestAnimationFrame(function loop(now) {
      raf = requestAnimationFrame(loop);
      draw(now);
    });
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // ---- input -------------------------------------------------------------
  host.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    gl.uniform2f(u.mouse,
      (e.clientX - r.left) * (canvas.width / (r.width || 1)),
      (e.clientY - r.top) * (canvas.height / (r.height || 1)));
  }, { passive: true });
  host.addEventListener('pointerleave', function () {
    gl.uniform2f(u.mouse, -1e5, -1e5);
  }, { passive: true });

  // ---- wiring ------------------------------------------------------------
  readColors();
  resize();
  draw(0);
  if (!reduce) {
    gl.uniform1f(u.mouseOn, 1);
    start();
    // a shader that is off screen or in a background tab does not need frames
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        onScreen ? start() : stop();
      }, { threshold: 0 }).observe(host);
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        if (resize()) readColors();
      }).observe(host);
    } else {
      window.addEventListener('resize', function () { resize(); });
    }
    // a theme switch re-derives --bg/--accent under us
    if (window.MutationObserver) {
      new MutationObserver(function () { readColors(); })
        .observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    }
  }
})();
