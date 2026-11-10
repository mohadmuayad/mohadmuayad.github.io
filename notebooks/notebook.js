/* Dark Signal V2 notebook reader.
   Native page links, downloads and disclosure remain usable without JS.
   No notebook content, code, dataset or chart is manipulated. */
(() => {
  const root = document.documentElement;
  const progress = document.getElementById('progress');
  const nav = document.querySelector('.notebook-nav');
  const backtop = document.getElementById('backtop');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  root.removeAttribute('data-theme');
  try {localStorage.removeItem('mm-dark-signal-theme');} catch (_) {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#111820');
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
