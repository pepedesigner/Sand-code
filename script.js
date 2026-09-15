// Sandcode clone interactions
const cmds = {
  curl: 'curl -fsSL https://sandcode.ai/install | bash',
  npm: 'npm i -g sandbase-ai',
  bun: 'bun add -g sandbase-ai',
  brew: 'brew install sandbase/tap/sandbase',
  paru: 'paru -S sandbase'
};
function initTabs(){
  const btns = document.querySelectorAll('.tabs button');
  const code = document.getElementById('install-cmd');
  if(!btns.length || !code) return;
  btns.forEach(b=>{
    b.addEventListener('click', ()=>{
      btns.forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      code.textContent = cmds[b.dataset.k] || cmds.curl;
    });
  });
}
function copyCmd(){
  const code = document.getElementById('install-cmd');
  const btn = document.getElementById('copy-btn');
  if(!code) return;
  const text = code.textContent;
  const done = ()=>{
    if(btn){
      const ok = btn.querySelector('.copy-ok');
      const ico = btn.querySelector('.copy-ico');
      const label = btn.querySelector('.copy-label');
      if(ok) ok.style.display = '';
      if(ico) ico.style.display = 'none';
      if(label) label.textContent = 'Copied';
      setTimeout(()=>{
        if(ok) ok.style.display = 'none';
        if(ico) ico.style.display = '';
        if(label) label.textContent = 'Copy';
      },1200);
    }
  };
  Sand.copyText(text).then(done).catch(()=>{ /* ignore */ });
}
// expose for inline onclick + addEventListener both work
window.copyCmd = copyCmd;
function initMenu(){
  const btn = document.getElementById('menu-btn');
  const links = document.getElementById('nav-links');
  if(!btn || !links) return;
  const setOpen = (open)=>{
    links.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    const label = open ? 'Close menu' : 'Open menu';
    if(btn.textContent !== label) btn.textContent = label;
  };
  btn.addEventListener('click', ()=>setOpen(!links.classList.contains('open')));
  links.addEventListener('click', (e)=>{ if(e.target && e.target.tagName === 'A') setOpen(false); });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && links.classList.contains('open')) setOpen(false); });
  document.addEventListener('click', (e)=>{
    if(!links.classList.contains('open')) return;
    if(links.contains(e.target) || btn.contains(e.target)) return;
    setOpen(false);
  });
}
function initWaitlist(){
  const f = document.getElementById('waitlist-form');
  if(!f) return;
  f.addEventListener('submit', (e)=>{
    e.preventDefault();
    const msg = document.getElementById('waitlist-msg');
    if(msg) msg.textContent = '✓ You are on the list — we will be in touch shortly.';
    f.reset();
  });
}
// fake terminal session — one-time type-on, never loops.
// Lines are lists of [cssClass, text] segments, so colour survives the
// animation. Command lines type character by character; output lines stream in
// whole, which keeps the timeline short even though the session is long.
// Under reduced motion the finished session is rendered immediately.
function initTerm(){
  const el = document.getElementById('term-typing');
  if(!el) return;

  const cmd = (seg)=>({ type:true, seg:seg });
  const out = (seg)=>({ type:false, seg:seg });
  const L = [
    cmd([['t-prompt','$ '],['t-cmd','npm i -g sandbase-ai']]),
    cmd([['t-prompt','$ '],['t-cmd','sandbase setup']]),
    out([]),
    out([['t-ok','⏺ '],['t-dim','[1/4] Detecting agent clients']]),
    out([['t-ok','   ✔ '],['t-file','Cursor'],['t-dim','        ~/.cursor']]),
    out([['t-ok','   ✔ '],['t-file','Claude Code'],['t-dim','   ~/.claude.json']]),
    out([['t-ok','   ✔ '],['t-file','OpenCode'],['t-dim','      ~/.config/opencode']]),
    out([['t-ok','⏺ '],['t-dim','[2/4] '],['t-file','alex@techstartup.io'],['t-dim',' · Standard · Active']]),
    out([['t-ok','   ✔ '],['t-dim','This month '],['t-num','$41.60'],['t-dim',' of '],['t-num','$70.00'],['t-dim',' · 6h window free '],['t-num','$10.20']]),
    out([['t-ok','⏺ '],['t-dim','[3/4] Endpoints and MCP tools']]),
    out([['t-ok','   ✔ '],['t-file','Cursor'],['t-dim','        OpenAI endpoint · search + scrape']]),
    out([['t-ok','   ✔ '],['t-file','Claude Code'],['t-dim','   Anthropic endpoint · transpiler on']]),
    out([['t-ok','   ✔ '],['t-file','Local harness'],['t-dim','   syntax check · pytest/jest · git rollback']]),
    out([['t-ok','⏺ '],['t-dim','[4/4] Rules & Skills Sync']]),
    out([['t-ok','   ✔ '],['t-file','.sandbase/rules.md'],['t-dim',' → '],['t-file','.cursorrules'],['t-dim',', '],['t-file','CLAUDE.md']]),
    out([]),
    out([['t-key','🎉 '],['t-strong','Ready'],['t-dim',' — code in Cursor or Claude Code now.']])
  ];

  const segLen = (line)=> line.seg.reduce((n, s)=> n + s[1].length, 0);

  // one line, clipped to `budget` characters (null = the whole line)
  function lineDom(line, budget){
    const d = document.createElement('div');
    d.className = 't-line';
    let left = budget === null ? Infinity : budget;
    for(const seg of line.seg){
      if(left <= 0) break;
      const take = Math.min(left, seg[1].length);
      if(take > 0){
        const s = document.createElement('span');
        s.className = seg[0];
        s.textContent = seg[1].slice(0, take);
        d.appendChild(s);
        left -= take;
      }
      if(take < seg[1].length) break;
    }
    return d;
  }
  // the first `full` lines, plus the in-progress line clipped to `ci` chars
  function render(full, ci, caret){
    const frag = document.createDocumentFragment();
    for(let i = 0; i < Math.min(full, L.length); i++) frag.appendChild(lineDom(L[i], null));
    if(full < L.length){
      const cur = lineDom(L[full], ci);
      if(caret){
        const c = document.createElement('span');
        c.className = 't-caret';
        cur.appendChild(c);
      }
      frag.appendChild(cur);
    }
    el.replaceChildren(frag);
  }

  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    render(L.length, 0, false);
    return;
  }

  let li = 0, ci = 0;
  render(0, 0, true);
  function step(){
    if(li >= L.length){ render(L.length, 0, false); return; }
    const len = segLen(L[li]);
    if(len === 0){                        // blank spacer line
      li++; ci = 0; render(li, 0, true);
      setTimeout(step, 70);
    } else if(L[li].type){                // command line: type it out
      ci++; render(li, ci, true);
      if(ci >= len){ li++; ci = 0; render(li, 0, true); setTimeout(step, 280); }
      else setTimeout(step, 16 + Math.random() * 20);
    } else {                              // output line: stream it in whole
      li++; ci = 0; render(li, 0, true);
      setTimeout(step, 120);
    }
  }
  step();
}
document.addEventListener('DOMContentLoaded', ()=>{
  Sand.initTheme(); initTabs(); initMenu(); initWaitlist(); initTerm(); initCopyBtn(); initUsecase(); initHeroDots();
  // GSAP when available, legacy IO reveal as fallback (also covers no-JS-safe default)
  if (!initMotion()) initReveal();
});
function initCopyBtn(){
  const btn = document.getElementById('copy-btn');
  if(btn) btn.addEventListener('click', copyCmd);
}
// scroll reveal (progressive enhancement: no-JS keeps content visible)
function initReveal(){
  const els = document.querySelectorAll('section.block, .terminal, .install, .logos, .card, .feat, .stat, .t, .plan, .zen-banner, .waitlist, .compare, .uc-panel');
  if(!els.length || !('IntersectionObserver' in window)){
    return;
  }
  els.forEach((el)=>{
    el.classList.add('reveal');
    const sibs = Array.from(el.parentElement ? el.parentElement.children : []).filter((c)=>c.classList && c.classList.contains('reveal'));
    const i = sibs.indexOf(el) % 4;
    el.style.transitionDelay = (i * 70) + 'ms';
  });
  const io = new IntersectionObserver((entries)=>{
    entries.forEach((e)=>{
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el)=>io.observe(el));
}
// use-case tabs
function initUsecase(){
  const btns = document.querySelectorAll('[data-uctab]');
  if(!btns.length) return;
  const panels = document.querySelectorAll('[data-ucpanel]');
  btns.forEach((b)=>{
    b.addEventListener('click', ()=>{
      btns.forEach((x)=>x.classList.remove('active'));
      b.classList.add('active');
      panels.forEach((p)=>p.classList.toggle('active', p.dataset.ucpanel === b.dataset.uctab));
    });
  });
}
// interactive dot grid behind the hero headline
// (progressive enhancement: no canvas → nothing is added; reduced motion →
// a static grid is drawn and nothing animates)
function initHeroDots(){
  const host = document.querySelector('.hero[data-hero-dots]');
  if(!host || !document.createElement('canvas').getContext) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const GAP = 24;       // grid pitch, px
  const BASE_R = 1.35;  // resting dot radius
  const HOT_R = 3;      // radius at the cursor
  const REACH = 150;    // cursor influence radius
  const TAU = Math.PI * 2;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-dots';
  canvas.setAttribute('aria-hidden', 'true');
  host.insertBefore(canvas, host.firstChild);

  const ctx = canvas.getContext('2d');
  // static grid lives in an offscreen layer: each frame only the few dots near
  // the cursor are redrawn on top, instead of the whole grid every frame.
  const base = document.createElement('canvas');
  const bctx = base.getContext('2d');

  let w = 0, h = 0, cols = 0, rows = 0, ox = 0, oy = 0, dpr = 1;
  let heat = new Float32Array(1);
  let dotColor = '#9BA1AC', hotColor = '#82AAFF';
  let px = -1e5, py = -1e5, hovering = false, raf = 0, pending = 0;

  function readColors(){
    const cs = getComputedStyle(document.body);
    dotColor = cs.getPropertyValue('--muted').trim() || dotColor;
    hotColor = cs.getPropertyValue('--accent').trim() || hotColor;
  }

  function drawBase(){
    base.width = canvas.width;
    base.height = canvas.height;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.clearRect(0, 0, w, h);
    bctx.fillStyle = dotColor;
    bctx.globalAlpha = 0.46;
    for(let r = 0; r < rows; r++){
      for(let c = 0; c < cols; c++){
        bctx.beginPath();
        bctx.arc(ox + c * GAP, oy + r * GAP, BASE_R, 0, TAU);
        bctx.fill();
      }
    }
    bctx.globalAlpha = 1;
  }

  function measure(){
    const rect = host.getBoundingClientRect();
    // run down to the terminal frame; the mask fades the grid out long before
    // it, so an opaque panel never cuts a hard edge across the dots
    const stop = host.querySelector('.terminal') || host.querySelector('.install');
    let limit = rect.height;
    if(stop){
      // offsetTop is the layout position, so an in-flight entrance tween
      // (GSAP translates the card by 28px) can't skew the measurement
      limit = (stop.offsetParent === host)
        ? stop.offsetTop
        : stop.getBoundingClientRect().top - rect.top;
    }
    w = document.documentElement.clientWidth;
    h = Math.max(240, Math.round(Math.min(rect.height, limit)));
    canvas.style.left = (-rect.left) + 'px';
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    cols = Math.ceil(w / GAP) + 1;
    rows = Math.ceil(h / GAP) + 1;
    ox = (w - (cols - 1) * GAP) / 2;
    oy = (h - (rows - 1) * GAP) / 2;
    heat = new Float32Array(cols * rows);
    drawBase();
    paint(true);
  }

  // eases each dot toward the cursor's influence, then composites base + lit dots
  function paint(reset){
    const reach2 = REACH * REACH;
    let active = 0;
    for(let r = 0; r < rows; r++){
      const y = oy + r * GAP, row = r * cols;
      for(let c = 0; c < cols; c++){
        const i = row + c;
        let target = 0;
        if(hovering){
          const dx = ox + c * GAP - px, dy = y - py;
          const d2 = dx * dx + dy * dy;
          if(d2 < reach2){
            const t = 1 - Math.sqrt(d2) / REACH;
            target = t * t;
          }
        }
        let v = reset ? target : heat[i] + (target - heat[i]) * 0.16;
        if(target === 0 && v < 0.004) v = 0;
        heat[i] = v;
        if(v > 0.01) active++;
      }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(base, 0, 0, w, h);
    if(active){
      ctx.fillStyle = hotColor;
      for(let r = 0; r < rows; r++){
        const y = oy + r * GAP, row = r * cols;
        for(let c = 0; c < cols; c++){
          const v = heat[row + c];
          if(v <= 0.01) continue;
          const x = ox + c * GAP, rr = BASE_R + (HOT_R - BASE_R) * v;
          ctx.globalAlpha = 0.09 * v;                       // soft halo
          ctx.beginPath(); ctx.arc(x, y, rr * 3.2, 0, TAU); ctx.fill();
          ctx.globalAlpha = 0.9 * v;                        // lit core
          ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    return active;
  }

  // the loop parks itself once the cursor leaves and every dot has faded out
  function tick(){
    raf = 0;
    if(paint(false) || hovering) raf = requestAnimationFrame(tick);
  }
  function kick(){ if(!raf && !reduce) raf = requestAnimationFrame(tick); }

  function onMove(e){
    if(e.pointerType === 'touch') return;
    const rect = host.getBoundingClientRect();
    px = e.clientX;
    py = e.clientY - rect.top;
    hovering = py >= -REACH && py <= h + REACH && px >= -REACH && px <= w + REACH;
    kick();
  }

  function schedule(){
    if(pending) return;
    pending = requestAnimationFrame(()=>{ pending = 0; measure(); });
  }

  readColors();
  measure();
  window.addEventListener('resize', schedule, {passive:true});
  // the hero's height settles late (webfonts, headline wrapping, entrance
  // tweens) — watch the element itself instead of guessing when to re-measure
  if(window.ResizeObserver) new ResizeObserver(schedule).observe(host);
  else if(document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);

  if(!reduce){
    host.addEventListener('pointermove', onMove, {passive:true});
    host.addEventListener('pointerleave', ()=>{ hovering = false; kick(); }, {passive:true});
  }
  // theme switches change --muted/--accent under us — rebuild with the new tokens
  if(window.MutationObserver){
    new MutationObserver(()=>{ readColors(); measure(); })
      .observe(document.body, {attributes:true, attributeFilter:['data-theme']});
  }
}
// scroll-driven FX: progress bar, auto-hiding header, h2 blur-rise,
// hero scroll-hint fade, back-to-top. Targets avoid existing tweens.
function initScrollFX(){
  // progress bar
  var bar = document.querySelector('.progress');
  if(!bar){ bar = document.createElement('div'); bar.className = 'progress'; document.body.prepend(bar); }
  gsap.to(bar, { scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // header hides on scroll down, returns on scroll up
  var header = document.querySelector('.site-header');
  if(header){
    ScrollTrigger.create({ start: 80, end: 'max',
      onUpdate: function(self){
        var y = self.scroll();
        header.classList.toggle('nav-hidden', y > 160 && self.direction === 1);
      } });
  }

  // h2 blur-rise (parents carry the block reveal — no tween conflict)
  gsap.utils.toArray('section.block h2, .doc h2').forEach(function(h){
    gsap.from(h, { y: 34, opacity: 0, filter: 'blur(8px)', duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });

  // hero scroll hint fades as you leave the hero
  var hint = document.querySelector('.scroll-hint');
  if(hint){
    gsap.to(hint, { opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '45% top', scrub: true } });
  }

  // back-to-top
  var top = document.querySelector('#toTop');
  if(!top){
    top = document.createElement('button');
    top.id = 'toTop'; top.type = 'button';
    top.setAttribute('aria-label', 'Back to top');
    top.textContent = '↑';
    document.body.appendChild(top);
    top.addEventListener('click', function(){ window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
  ScrollTrigger.create({ start: 600, end: 'max',
    onEnter: function(){ top.classList.add('show'); },
    onLeaveBack: function(){ top.classList.remove('show'); } });
}
function initMotion(){
  try{
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if(!window.gsap || !window.ScrollTrigger) return false;
    gsap.registerPlugin(ScrollTrigger);

    // hero entrance
    const heroSeq = ['.hero .badge', '.hero h1', '.hero .sub', '.hero-ctas', '.hero .install', '.hero .terminal', '.logos'];
    const present = heroSeq.filter((s)=>document.querySelector(s));
    if(present.length){
      gsap.set(present, { y: 28, opacity: 0 });
      gsap.to(present, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.09, delay: 0.1 });
    }

    // gentle parallax on the product frame
    if(document.querySelector('.hero .terminal')){
      gsap.to('.hero .terminal', { yPercent: -3, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    // scroll reveals (batch; visible panels only — hidden tab panels are excluded)
    const targets = gsap.utils.toArray('section.block, .card, .feat, .stat, .t, .plan, .zen-banner, .waitlist, .compare, .doc');
    targets.forEach((el)=>{
      gsap.from(el, { y: 26, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    // stat count-up
    document.querySelectorAll('[data-count]').forEach((el)=>{
      const end = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const obj = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true,
        onEnter: ()=>gsap.to(obj, { v: end, duration: 1.4, ease: 'power2.out',
          onUpdate: ()=>{ el.textContent = Math.round(obj.v) + suffix; } }) });
    });

    // logo marquee (seamless loop, desktop only)
    const row = document.querySelector('.logo-row');
    const wide = window.matchMedia && window.matchMedia('(min-width: 761px)').matches;
    if(row && row.children.length && wide){
      row.innerHTML += row.innerHTML;
      const tween = gsap.to(row, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
      row.addEventListener('mouseenter', ()=>tween.pause());
      row.addEventListener('mouseleave', ()=>tween.play());
    }
    // webfonts shift layout after load — re-measure triggers so reveals fire correctly
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(()=>{ if(window.ScrollTrigger) ScrollTrigger.refresh(); });
    }
    initScrollFX();
    return true;
  }catch(e){ if(window.console) console.warn('[sandcode] motion fallback:', e); return false; }
}
