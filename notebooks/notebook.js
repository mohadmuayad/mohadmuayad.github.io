/* Dark Signal V2 notebook reader.
   Native page links, downloads and disclosure remain usable without JS.
   No notebook content, code, dataset or chart is manipulated. */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const themeButton = document.querySelector('.notebook-nav .theme-toggle');
  const progress = document.getElementById('progress');
  const nav = document.querySelector('.notebook-nav');
  const backtop = document.getElementById('backtop');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let themeBusy = false;

  function applyTheme(theme, persist = false) {
    const light = theme === 'light';
    if (light) root.dataset.theme = 'light';
    else delete root.dataset.theme;
    if (persist) {
      try { localStorage.setItem('mm-dark-signal-theme', light ? 'light' : 'dark'); } catch (_) {}
    }
    if (themeButton) {
      themeButton.setAttribute('aria-pressed', String(light));
      themeButton.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
      themeButton.title = light ? 'Switch to dark mode' : 'Switch to light mode';
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#e9e8e4' : '#111820');
  }
  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
  themeButton?.addEventListener('click', () => {
    if (themeBusy) return;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    if (reduce.matches || typeof document.startViewTransition !== 'function') {
      applyTheme(next, true);
      return;
    }
    themeBusy = true;
    root.classList.add('theme-dissolving');
    try {
      document.startViewTransition(() => applyTheme(next, true)).finished
        .catch(() => {}).finally(() => {root.classList.remove('theme-dissolving');themeBusy = false;});
    } catch (_) {
      applyTheme(next, true);
      root.classList.remove('theme-dissolving');
      themeBusy = false;
    }
  });
  let raf = 0;
  function updateScroll() {
    raf = 0;
    const y = window.scrollY;
    const total = Math.max(0, root.scrollHeight - window.innerHeight);
    if (progress) progress.style.width = (total ? y / total * 100 : 0) + '%';
    nav?.classList.toggle('scrolled', y > 18);
    const footer = document.querySelector('.notebook-footer');
    const inFooter = !!footer && footer.getBoundingClientRect().top < window.innerHeight - 12;
    const visible = y > 600 && !inFooter;
    if (backtop) {
      backtop.classList.toggle('visible', visible);
      backtop.setAttribute('aria-hidden', String(!visible));
      backtop.tabIndex = visible ? 0 : -1;
    }
  }
  function onScroll() {if (!raf) raf = requestAnimationFrame(updateScroll);}
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', updateScroll, {once:true});
  updateScroll();
  backtop?.addEventListener('click', event => {
    event.preventDefault();
    window.scrollTo({top:0,behavior:reduce.matches ? 'instant' : 'smooth'});
  });
})();
