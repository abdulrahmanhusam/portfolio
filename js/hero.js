/* Homepage-only entrance and scroll navigation. No packages or build step. */
(() => {
  "use strict";
  const hero = document.querySelector('.screenshot-hero');
  if (!hero) return;
  const motion = window.portfolioMotion;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('menuPanel');
  const stage = hero.querySelector('.hero-stage');
  const globe = hero.querySelector('.hero-globe svg');
  let scrolled = scrollY > 120;
  let frame = 0;
  let suspended = false;
  const listeners = new AbortController();
  function sync() {
    frame = 0;
    // A small dead band prevents oscillation around the reveal point.
    if (scrollY > 132) scrolled = true;
    else if (scrollY < 108) scrolled = false;
    document.body.classList.toggle('nav-scrolled', scrolled);
    const available = mobile.matches || scrolled || menu.open;
    toggle.inert = !available;
    toggle.setAttribute('aria-hidden', String(!available));
    if (!reduced.matches && scrollY < hero.offsetHeight) {
      stage.style.translate = `0 ${Math.min(scrollY * .1, 70)}px`;
      globe.style.rotate = `${scrollY * .08}deg`;
    }
  }
  function schedule() {
    if (!frame && !suspended) frame = requestAnimationFrame(sync);
  }
  function motionChange() {
    stage.style.translate = '';
    globe.style.rotate = '';
    schedule();
  }
  addEventListener('scroll', schedule, {passive: true, signal: listeners.signal});
  addEventListener('resize', schedule, {passive: true, signal: listeners.signal});
  mobile.addEventListener('change', schedule, {signal: listeners.signal});
  reduced.addEventListener('change', motionChange, {signal: listeners.signal});
  const menuObserver = new MutationObserver(schedule);
  menuObserver.observe(menu, {attributes: true, attributeFilter: ['open']});
  addEventListener('pagehide', event => {
    suspended = true;
    cancelAnimationFrame(frame); frame = 0;
    if (!event.persisted) { listeners.abort(); menuObserver.disconnect(); }
  });
  addEventListener('pageshow', () => { suspended = false; sync(); });
  sync();
  // One short, ordered introduction; the rest of the site's motion is untouched.
  const steps = [
    [hero, [{opacity: .4}, {opacity: 1}], 550, 0],
    [stage, [{opacity: 0, transform: 'translateY(35px)'}, {opacity: 1, transform: 'translateY(0)'}], 1000, 70],
    [document.querySelector('.site-header'), [{opacity: 0, transform: 'translateY(-12px)'}, {opacity: 1, transform: 'translateY(0)'}], 700, 140],
    [hero.querySelector('.hero-location'), [{opacity: 0, transform: 'translateX(-100%)'}, {opacity: 1, transform: 'translateX(0)'}], 850, 210],
    [hero.querySelector('.hero-profession'), [{opacity: 0, transform: 'translateY(24px)'}, {opacity: 1, transform: 'translateY(0)'}], 850, 270],
  ];
  steps.forEach(([element, keyframes, duration, delay]) => motion.animate(element, keyframes, {duration, delay}));
  hero.querySelectorAll('.hero-name > span').forEach((element, index) => {
    motion.animate(element, [{opacity: 0, transform: 'translateY(55px)', clipPath: 'inset(0 0 100% 0)'}, {opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0)'}], {duration: 1000, delay: 330 + index * 70});
  });
})();
