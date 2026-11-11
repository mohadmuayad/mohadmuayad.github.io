/* Dark Signal — reader route bridge.
   Home ↔ Factory keeps its existing in-page navigation; notebook pages
   receive the same soft exit and entrance across full-document links.
   Without JavaScript, every regular anchor remains a working link. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'ds-reader-arrival-v1';
  const notePath = path => /^\/notebooks\/(?:01_data_quality_analysis|02_data_cleaning_validation)\.html$/i.test(path);
  const sitePath = path => path === '/' || /^\/(?:index|factory)\.html$/i.test(path);
  let navigating = false, enterTimer = 0;

  const animateArrival = () => {
    root.classList.remove('ds-route-leaving','ds-route-swapping','ds-route-incoming');
    if (reduce.matches) return;
    // Restart with a clean first keyframe even after a history restoration.
    void root.offsetWidth;
    root.classList.add('ds-route-incoming');
    clearTimeout(enterTimer);
    enterTimer = setTimeout(() => root.classList.remove('ds-route-incoming'), 540);
  };
  try {
    const stamp = Number(sessionStorage.getItem(key));
    sessionStorage.removeItem(key);
    if (stamp > 0 && Date.now() - stamp < 60000) animateArrival();
  } catch (_) {}

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        reduce.matches) return;
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self')) return;
    let url;
    try {url = new URL(anchor.href, location.href)} catch {return}
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol) ||
        (!sitePath(url.pathname) && !notePath(url.pathname))) return;
    if (url.pathname === location.pathname) return; // Keep native section links.
    const fromNotebook = document.body.classList.contains('notebook-page-body');
    if (!fromNotebook && !notePath(url.pathname)) return; // Existing SPA.
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    root.classList.remove('ds-route-incoming');
    root.classList.add('ds-route-leaving');
    setTimeout(() => {
      try {sessionStorage.setItem(key, String(Date.now()))} catch (_) {}
      location.assign(url.href);
    }, 240);
  });

  // Back/Forward Cache may restore the page with its leaving class intact.
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    navigating = false;
    animateArrival();
  });
})();
