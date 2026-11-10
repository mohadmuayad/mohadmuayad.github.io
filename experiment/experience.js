/* Dark Signal V2 / Experiment 01 — reversible progressive enhancements.
   Never replaces native links, page-navigation logic, modal semantics or content. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // E01.6: optional active heading cue in the notebook TOC.
  // The link remains usable without JS and without IntersectionObserver.
  if (document.body.classList.contains('notebook-page-body') && 'IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('.notebook-toc a[href^="#"]')];
    const pairs = links.map(link => ({link, target:document.getElementById(decodeURIComponent(link.hash.slice(1)))}))
      .filter(item => item.target);
    let active = null;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      const chosen = pairs.find(item => item.target === visible[0].target);
      if (!chosen || chosen === active) return;
      active?.link.removeAttribute('aria-current');
      chosen.link.setAttribute('aria-current','location');
      active = chosen;
    }, {rootMargin:'-15% 0px -60% 0px',threshold:0});
    pairs.forEach(item => observer.observe(item.target));
    window.addEventListener('pagehide',() => observer.disconnect(),{once:true});
  }
  // E01.7: return keyboard focus to the chart trigger on native dialog close.
  // Capture so it works with HTML soft-navigation swaps on the main pages.
  let chartTrigger = null;
  document.addEventListener('click', event => {
    const trigger = event.target.closest?.('.chart-open');
    if (trigger) chartTrigger = trigger;
  }, true);
  document.addEventListener('close', event => {
    if (event.target?.id !== 'chart-dialog' || !chartTrigger?.isConnected) return;
    if (document.activeElement === document.body || document.activeElement === event.target) {
      chartTrigger.focus({preventScroll:true});
    }
    chartTrigger = null;
  }, true);
  // Do not add delayed navigation, perpetual animations, or pointer tracking.
})();
