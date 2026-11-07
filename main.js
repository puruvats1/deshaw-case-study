// Scroll-driven state for the case study. Writes CSS custom properties and
// data attributes only; every visual lives in styles.css.
(() => {
  const root = document.documentElement;
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

  const hero = document.querySelector('[data-hero]');
  const railTrack = document.querySelector('.rail-track');
  const railLinks = $$('.rail a');
  const scenes = $$('[data-scene]').map((el) => ({ el, track: el.querySelector('[data-track]') }));
  const stepGroups = $$('[data-steps]').map((el) => ({ el, steps: $$('[data-step]', el), idx: -2 }));
  const fills = $$('[data-fill]');
  const chapters = $$('[data-ch]');
  const darkFrom = document.querySelector('[data-dark]');
  const ballSection = document.querySelector('[data-ball]');
  const ballTable = ballSection && ballSection.querySelector('.table');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  let active = null;
  let dark = null;
  let raf = 0;

  // Reveal-on-enter for [data-r] blocks.
  const reveals = $$('[data-r]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.setAttribute('data-in', ''); io.unobserve(e.target); }
      }
    }, { threshold: 0.12 });
    reveals.forEach((n) => io.observe(n));
  } else {
    reveals.forEach((n) => n.setAttribute('data-in', ''));
  }

  function apply() {
    raf = 0;
    const vh = window.innerHeight;
    const vw = root.clientWidth;

    // Page progress for the chapter rail.
    if (railTrack) {
      const range = root.scrollHeight - vh;
      railTrack.style.setProperty('--pp', (range > 0 ? clamp01(window.scrollY / range) : 0).toFixed(4));
    }

    // Hero lift.
    if (hero) {
      hero.style.setProperty('--hp', clamp01(-hero.getBoundingClientRect().top / (vh * 0.9)).toFixed(4));
    }

    // Pinned scenes: progress 0..1 through their scroll span.
    for (const s of scenes) {
      const b = s.el.getBoundingClientRect();
      if (b.bottom < -vh || b.top > vh * 2) continue;
      const span = b.height - vh;
      const sp = span > 0 ? clamp01(-b.top / span) : 1;
      s.el.style.setProperty('--sp', sp.toFixed(4));
      if (s.track) s.el.style.setProperty('--tx', (Math.max(s.track.scrollWidth - vw, 0) * sp).toFixed(1));
    }

    // Step groups: data-s0..n mark every step whose top has passed 60% of the viewport.
    for (const g of stepGroups) {
      let idx = -1;
      g.steps.forEach((st, i) => { if (st.getBoundingClientRect().top < vh * 0.6) idx = i; });
      if (idx === g.idx) continue;
      g.idx = idx;
      g.steps.forEach((_, i) => g.el.toggleAttribute('data-s' + i, i <= idx));
    }

    // Word-by-word fill.
    for (const n of fills) {
      const b = n.getBoundingClientRect();
      const start = vh - b.height * 0.3;
      const end = vh * 0.35;
      n.style.setProperty('--f', clamp01((start - b.top) / (start - end)).toFixed(3));
    }

    // Active chapter for the rail.
    let ch = null;
    for (const c of chapters) if (c.getBoundingClientRect().top < vh * 0.5) ch = c.getAttribute('data-ch');
    if (ch !== active) {
      active = ch;
      railLinks.forEach((a, i) => {
        if (String(i + 1) === ch) a.setAttribute('aria-current', 'step');
        else a.removeAttribute('aria-current');
      });
    }

    // The page turns dark from chapter 07 on.
    const isDark = !!darkFrom && darkFrom.getBoundingClientRect().top < vh * 0.55;
    if (isDark !== dark) {
      dark = isDark;
      root.toggleAttribute('data-dark', isDark);
      if (themeMeta) themeMeta.setAttribute('content', isDark ? '#252525' : '#ffffff');
    }

    // Table-tennis ball.
    if (ballSection) {
      const b = ballSection.getBoundingClientRect();
      const p = clamp01((vh - b.top) / (b.height + vh * 0.2));
      ballSection.style.setProperty('--bx', (0.5 - 0.5 * Math.cos(p * Math.PI * 3)).toFixed(4));
      ballSection.style.setProperty('--by', Math.abs(Math.sin(p * Math.PI * 6)).toFixed(4));
    }
  }

  function measure() {
    if (ballTable) ballSection.style.setProperty('--tw', ballTable.clientWidth + 'px');
    schedule();
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(apply);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure);
  // Re-measure once layout settles (fonts, scroll restoration, back/forward cache).
  window.addEventListener('load', measure);
  window.addEventListener('pageshow', measure);
  if (document.fonts) document.fonts.ready.then(measure);
  measure();
})();
