/* Dark Signal — notebook reader lifecycle, safe across soft navigation. */
(() => {
  'use strict';
  window.dsInitNotebookReader = () => {
    if(!document.body.classList.contains('notebook-page-body'))return () => {};
    const root=document.documentElement;
    const progress=document.getElementById('progress');
    const backtop=document.getElementById('backtop');
    const footer=document.querySelector('.notebook-footer');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0;
    function update(){
      frame=0;
      const y=window.scrollY,total=Math.max(0,root.scrollHeight-innerHeight);
      if(progress)progress.style.width=(total?100*y/total:0)+'%';
      const insideFooter=!!footer&&footer.getBoundingClientRect().top<innerHeight-12;
      const show=y>600&&!insideFooter;
      if(backtop){
        backtop.classList.toggle('visible',show);
        backtop.setAttribute('aria-hidden',String(!show));
        backtop.tabIndex=show?0:-1;
      }
    }
    function onScroll(){if(!frame)frame=requestAnimationFrame(update)}
    function onTop(event){event.preventDefault();window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'})}
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll);
    backtop?.addEventListener('click',onTop);
    update();
    return ()=>{
      if(frame)cancelAnimationFrame(frame);
      window.removeEventListener('scroll',onScroll);
      window.removeEventListener('resize',onScroll);
      backtop?.removeEventListener('click',onTop);
    };
  };
})();
