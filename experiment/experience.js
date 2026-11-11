/* Dark Signal V2 / Experiment 01 — reversible progressive enhancements.
   Never replaces native links, page-navigation logic, modal semantics or content. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Reinitialize the notebook TOC observer for each internally navigated page.
  let disconnectNotebookTOC=()=>{};
  window.dsReinitExperience=()=>{
    disconnectNotebookTOC();
    disconnectNotebookTOC=()=>{};
    if(!document.body.classList.contains('notebook-page-body')||!('IntersectionObserver' in window))return;
    const links=[...document.querySelectorAll('.notebook-toc a[href^="#"]')];
    const pairs=links.map(link=>({link,target:document.getElementById(decodeURIComponent(link.hash.slice(1)))})).filter(x=>x.target);
    let active=null;
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((x,y)=>x.boundingClientRect.top-y.boundingClientRect.top);
      if(!visible.length)return;
      const chosen=pairs.find(pair=>pair.target===visible[0].target);
      if(!chosen||chosen===active)return;
      active?.link.removeAttribute('aria-current');
      chosen.link.setAttribute('aria-current','location');
      active=chosen;
    },{rootMargin:'-15% 0px -60% 0px',threshold:0});
    pairs.forEach(pair=>observer.observe(pair.target));
    disconnectNotebookTOC=()=>observer.disconnect();
  };
  window.dsReinitExperience();
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
