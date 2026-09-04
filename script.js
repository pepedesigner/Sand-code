// Sandcode clone interactions
const cmds = {
  curl: 'curl -fsSL https://sandcode.ai/install | bash',
  npm: 'npm i -g sandcode-ai',
  bun: 'bun add -g sandcode-ai',
  brew: 'brew install sandcode/tap/sandcode',
  paru: 'paru -S sandcode'
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
  const done = ()=>{
    if(btn){ const t=btn.textContent; btn.textContent='Copied!'; setTimeout(()=>btn.textContent=t,1200); }
  };
  if(!code) return;
  const text = code.textContent;
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text, done));
    }else{
      fallbackCopy(text, done);
    }
  }catch(e){
    fallbackCopy(text, done);
  }
}
function fallbackCopy(text, done){
  try{
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    done();
  }catch(e){ /* ignore */ }
}
// expose for inline onclick + addEventListener both work
window.copyCmd = copyCmd;
function initMenu(){
  const btn = document.getElementById('menu-btn');
  const links = document.getElementById('nav-links');
  if(btn && links) btn.addEventListener('click', ()=>links.classList.toggle('open'));
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
// fake terminal typing
function initTerm(){
  const el = document.getElementById('term-typing');
  if(!el) return;
  const lines = [
    '$ cd my-project',
    '$ sandcode',
    '> Analyzing project… AGENTS.md created',
    '> How can I help? _'
  ];
  let li=0, ci=0, out='';
  function tick(){
    if(li>=lines.length) return;
    const line = lines[li];
    ci++;
    out = lines.slice(0,li).join('\n') + '\n' + line.slice(0,ci);
    el.textContent = out.trim();
    if(ci>=line.length){ li++; ci=0; setTimeout(tick,700); }
    else setTimeout(tick, 28);
  }
  tick();
}
document.addEventListener('DOMContentLoaded', ()=>{
  initTabs(); initMenu(); initWaitlist(); initTerm(); initCopyBtn(); initUsecase();
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
