const $=s=>document.querySelector(s);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Dark-only release: clear any legacy palette preference. This deliberately
   does not alter theme-independent navigation, motion, or visual effects. */
function enforceDarkOnly(){
  document.documentElement.removeAttribute('data-theme');
  try{localStorage.removeItem('mm-dark-signal-theme')}catch{}
}
enforceDarkOnly();

let interruptCurrentSectionGlide=()=>{};
function initPage(){
  const observers=[];
  const stopDarkSignal=initDarkSignal(document.querySelector('.dark-signal-canvas'));
  const stopContactSignal=initContactSignal(document.querySelector('.contact-signal-canvas'));
  const documentListeners=[];
  const observeWith=(callback,settings)=>{const observer=new IntersectionObserver(callback,settings);observers.push(observer);return observer};
  const onDoc=(name,callback)=>{document.addEventListener(name,callback);documentListeners.push([name,callback])};
  // Social links retain a gentle hover lift. Opening an external tab must
  // never leave the clicked icon visibly lifted on return. Suppress only that
  // icon's hover lift until the pointer genuinely leaves its hit area.
  let clickedSocial=null;
  const releaseSocial=()=>{
    clickedSocial?.classList.remove('social-click-settled');
    clickedSocial=null;
  };
  onDoc('click',event=>{
    const social=event.target.closest?.('a.social[href]');
    if(!social){releaseSocial();return;}
    if(clickedSocial!==social)releaseSocial();
    clickedSocial=social;
    social.classList.add('social-click-settled');
    // Avoid carrying a pointer-generated focus state across tabs; preserve
    // keyboard focus indication for keyboard-only navigation.
    if(event.detail>0&&!social.matches(':focus-visible'))social.blur();
  });
  onDoc('pointermove',event=>{
    if(!clickedSocial)return;
    const rect=clickedSocial.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||
       event.clientY<rect.top||event.clientY>rect.bottom)releaseSocial();
  });
  onDoc('pointerdown',event=>{
    if(clickedSocial&&!clickedSocial.contains(event.target))releaseSocial();
  });
  onDoc('visibilitychange',()=>{
    // Some browsers drop :hover while changing tabs and restore it on return.
    // The settled state must survive that cycle until actual pointer movement.
    if(document.visibilityState==='visible'&&clickedSocial?.isConnected)
      clickedSocial.classList.add('social-click-settled');
  });

// Stage 20.10 — load the two scoped, gentle milestone typefaces only on home.
// The site remains readable offline with system font fallbacks in CSS.
if($('.project-milestone')&&!document.getElementById('milestone-fonts')){
  const fontLink=document.createElement('link');
  fontLink.id='milestone-fonts';
  fontLink.rel='stylesheet';
  fontLink.href='https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600&family=Tajawal:wght@400;500&display=swap';
  document.head.appendChild(fontLink);
}

if($('#year'))$('#year').textContent=new Date().getFullYear();
// Polish 08 — one menu state and one measured backdrop for both themes.
const toggle=$('.menu-toggle'), menu=$('#navlinks'), navigationBar=$('.nav');
const syncMenuBackdrop=()=>{
  if(!navigationBar||!menu)return;
  const open=menu.classList.contains('open')&&matchMedia('(max-width:760px)').matches;
  const available=Math.max(0,window.innerHeight-72);
  const menuHeight=open?Math.min(menu.scrollHeight,available):0;
  navigationBar.style.setProperty('--ds-drawer-height',`${Math.ceil(menuHeight)}px`);
};
function closeMenu(){
  menu?.classList.remove('open');
  toggle?.setAttribute('aria-expanded','false');
  toggle?.setAttribute('aria-label','Open navigation');
  syncMenuBackdrop();
}
toggle?.addEventListener('click',()=>{
  const open=menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');
  syncMenuBackdrop();
});
menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
onDoc('keydown',e=>{if(e.key==='Escape'&&menu?.classList.contains('open')){closeMenu();toggle.focus()}});
onDoc('click',e=>{if(!e.target.closest('.nav'))closeMenu()});
const handleNavResize=()=>{
  if(!matchMedia('(max-width:760px)').matches&&menu?.classList.contains('open'))closeMenu();
  else syncMenuBackdrop();
};
window.addEventListener('resize',handleNavResize);
syncMenuBackdrop();
// Stage 20.4 — avoid a duplicate floating shortcut over the footer link.
// Also keep the invisible shortcut out of the keyboard tab order.
function scrollState(){
  const y=window.scrollY;
  const max=document.documentElement.scrollHeight-window.innerHeight;
  $('.nav')?.classList.toggle('scrolled',y>20);
  const footer=$('footer');
  const footerVisible=!!footer&&footer.getBoundingClientRect().top<window.innerHeight-16;
  document.body.classList.toggle('footer-in-view',footerVisible);
  const backtop=$('#backtop');
  const showTopShortcut=y>300;
  if(backtop){
    backtop.classList.toggle('visible',showTopShortcut);
    backtop.tabIndex=showTopShortcut?0:-1;
    backtop.setAttribute('aria-hidden',String(!showTopShortcut));
    if(!showTopShortcut&&document.activeElement===backtop)backtop.blur();
  }
  if($('#progress'))$('#progress').style.width=(max>0?y/max*100:0)+'%';
}
window.addEventListener('scroll',scrollState,{passive:true});
window.addEventListener('resize',scrollState);
scrollState();
if('IntersectionObserver' in window){const obs=observeWith(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('seen');obs.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.section-heading,.skill,.home-page #projects .project-card,.timeline article,.finding,.report-section>div,.about-copy,.process-list article,.file-list article,.factory-page-body #findings .findings-heading').forEach(el=>{if(!reduce){el.classList.add('reveal');obs.observe(el)}});const active=observeWith(entries=>entries.forEach(e=>{if(e.isIntersecting){document.querySelectorAll('#navlinks a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))}}),{rootMargin:'-15% 0px -55% 0px'});document.querySelectorAll('section[id]').forEach(el=>active.observe(el))}
// Experiment 01 / Global Scroll Stability: headings are now one-shot reveal
// targets under the observer above, not re-animated on later viewport entries.
// No second IntersectionObserver is needed for heading animation.
// Stage 17 — calm, repeat-safe clipboard feedback for both themes.
// The icon layers remain mounted so success never changes button geometry.
let toastTimer,copyResetTimer,copyInFlight=false;
function toast(message,state='success'){
  const el=$('.toast');if(!el)return;
  clearTimeout(toastTimer);
  el.dataset.state=state;
  el.setAttribute('aria-live',state==='error'?'assertive':'polite');
  el.textContent=message;
  el.classList.add('show');
  toastTimer=setTimeout(()=>el.classList.remove('show'),2900);
}
const copyButton=$('.copy-email');
function resetCopyVisual(){
  if(!copyButton)return;
  copyButton.classList.remove('is-copied','is-error');
  copyButton.setAttribute('aria-label','Copy email address');
  copyButton.title='Copy email address';
}
copyButton?.addEventListener('click',async()=>{
  // Avoid racing several asynchronous clipboard requests.
  if(copyInFlight)return;
  copyInFlight=true;
  clearTimeout(copyResetTimer);
  copyButton.classList.remove('is-error');
  copyButton.setAttribute('aria-busy','true');
  try{
    await copyAddress();
    copyButton.classList.add('is-copied');
    copyButton.setAttribute('aria-label','Email address copied');
    copyButton.title='Email address copied';
    toast('Email copied to clipboard');
  }catch{
    copyButton.classList.remove('is-copied');
    copyButton.classList.add('is-error');
    copyButton.setAttribute('aria-label','Email copy unavailable');
    copyButton.title='Email copy unavailable';
    toast('Copy unavailable — mohadmuayadai@gmail.com','error');
  }finally{
    copyInFlight=false;
    copyButton.removeAttribute('aria-busy');
    copyResetTimer=setTimeout(resetCopyVisual,2900);
    if(!copyButton.matches(':focus-visible'))copyButton.blur();
  }
});
// Phase 14 — measured, interruptible Back to Top movement.
// Applies to both the fixed shortcut and the footer link; ordinary section
// links and the client's page-navigation behavior are left unchanged.
let stopTopGlide=null;
let stopSectionGlide=null;
interruptCurrentSectionGlide=()=>{if(stopSectionGlide)stopSectionGlide();};
function glideBackToTop(){
  if(stopSectionGlide)stopSectionGlide();
  if(stopTopGlide)stopTopGlide();
  const from=window.scrollY;
  if(reduce||from<2||typeof requestAnimationFrame!=='function'){
    window.scrollTo({top:0,behavior:'instant'});
    return;
  }
  const root=document.documentElement;
  const previousBehavior=root.style.scrollBehavior;
  root.style.scrollBehavior='auto';
  const duration=Math.min(2200,Math.max(1100,900+from*.16));
  const started=performance.now();
  let frameId=0,finished=false;
  const interrupts=['wheel','touchstart','pointerdown','keydown'];
  const onInterrupt=event=>{
    if(event.type==='keydown'&&!['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape'].includes(event.key))return;
    finish();
  };
  function finish(){
    if(finished)return;
    finished=true;
    cancelAnimationFrame(frameId);
    root.style.scrollBehavior=previousBehavior;
    for(const name of interrupts)window.removeEventListener(name,onInterrupt);
    if(stopTopGlide===finish)stopTopGlide=null;
  }
  stopTopGlide=finish;
  for(const name of interrupts)window.addEventListener(name,onInterrupt,{passive:true});
  function frame(now){
    if(finished)return;
    const t=Math.min(1,(now-started)/duration);
    const eased=(1-Math.cos(Math.PI*t))/2;
    window.scrollTo({top:from*(1-eased),behavior:'instant'});
    if(t<1)frameId=requestAnimationFrame(frame);
    else finish();
  }
  frameId=requestAnimationFrame(frame);
}
// Stage 19 — controlled, interruptible in-page navigation for header links.
// Browser-native smooth scrolling has browser-dependent durations; this glide
// shares the gentle Back-to-Top timing without changing page transitions.
function glideToSection(target){
  if(stopSectionGlide)stopSectionGlide();
  if(stopTopGlide)stopTopGlide();
  const root=document.documentElement;
  const padding=parseFloat(getComputedStyle(root).scrollPaddingTop)||0;
  const margin=parseFloat(getComputedStyle(target).scrollMarginTop)||0;
  const limit=Math.max(0,root.scrollHeight-window.innerHeight);
  const destination=Math.max(0,Math.min(limit,window.scrollY+target.getBoundingClientRect().top-padding-margin));
  const origin=window.scrollY;
  const distance=Math.abs(destination-origin);
  if(reduce||distance<2||typeof requestAnimationFrame!=='function'){
    window.scrollTo({top:destination,behavior:'instant'});
    return;
  }
  const previous=root.style.scrollBehavior;
  root.style.scrollBehavior='auto';
  const duration=Math.min(1220,Math.max(540,440+Math.sqrt(distance)*10));
  const began=performance.now();
  let rafId=0,done=false;
  const interruptions=['wheel','touchstart','pointerdown','keydown'];
  const interrupt=event=>{
    if(event.type==='keydown'&&!['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape'].includes(event.key))return;
    finish();
  };
  function finish(){
    if(done)return;
    done=true;
    cancelAnimationFrame(rafId);
    root.style.scrollBehavior=previous;
    for(const eventName of interruptions)window.removeEventListener(eventName,interrupt);
    if(stopSectionGlide===finish)stopSectionGlide=null;
  }
  stopSectionGlide=finish;
  for(const eventName of interruptions)window.addEventListener(eventName,interrupt,{passive:true});
  function step(now){
    if(done)return;
    const t=Math.min(1,(now-began)/duration);
    const eased=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    window.scrollTo({top:origin+(destination-origin)*eased,behavior:'instant'});
    if(t<1)rafId=requestAnimationFrame(step);
    else finish();
  }
  rafId=requestAnimationFrame(step);
}
// Same-document header, hero CTA, scroll cue and factory section navigation.
// Page links, downloads,
// modifier-clicks and the dedicated Back-to-Top control retain their behavior.
onDoc('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.('.nav a[href^="#"], .home-page .hero .actions a[href^="#"], .home-page .scroll-cue[href^="#"], .factory-page-body .case-nav a[href^="#"]');
  if(!link)return;
  const hash=link.getAttribute('href');
  if(!hash||hash==='#')return;
  let id;
  try{id=decodeURIComponent(hash.slice(1))}catch{return}
  const target=document.getElementById(id);
  if(!target)return;
  event.preventDefault();
  if(location.hash!==hash&&/^https?:$/.test(location.protocol)){
    history.replaceState({...history.state,softNavigation:true,scrollY:window.scrollY},'',location.href);
    history.pushState({softNavigation:true,scrollY:Math.round(window.scrollY)},'',hash);
  }
  glideToSection(target);
});

onDoc('click',event=>{
  const link=event.target.closest?.('a[href="#home"]');
  if(!link||!(link.id==='backtop'||/^Back to Top/i.test(link.textContent.trim())||link.getAttribute('aria-label')==='Back to top'))return;
  if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  // Preserve the visible #home destination without a native anchor jump.
  if(/^https?:$/.test(location.protocol))history.replaceState(history.state,'', '#home');
  glideBackToTop();
});

const dlg=$('#chart-dialog');document.querySelectorAll('.chart-open').forEach(b=>b.addEventListener('click',()=>{$('#chart-image').src=b.dataset.chart;$('#chart-image').alt=b.dataset.title;$('#chart-title').textContent=b.dataset.title;dlg.showModal()}));$('.dialog-close')?.addEventListener('click',()=>dlg.close());dlg?.addEventListener('click',e=>{if(e.target===dlg){let r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dlg.close()}});
onDoc('visibilitychange',()=>document.body.classList.toggle('page-hidden',document.hidden));

const caseLinks=[...document.querySelectorAll('.case-nav a')];
if(caseLinks.length&&'IntersectionObserver' in window){const sections=[...new Set(caseLinks.map(a=>document.querySelector(a.hash)).filter(Boolean))];const watcher=observeWith(entries=>{for(const entry of entries){if(entry.isIntersecting){caseLinks.forEach(a=>{const current=a.hash==='#'+entry.target.id;a.classList.toggle('active',current);if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}}},{rootMargin:'-10% 0px -55% 0px',threshold:0});sections.forEach(s=>watcher.observe(s))}

async function copyAddress(){const address='mohadmuayadai@gmail.com';try{if(navigator.clipboard){await navigator.clipboard.writeText(address);return}}catch{}const field=document.createElement('textarea');field.value=address;field.setAttribute('readonly','');field.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(field);field.select();const copied=document.execCommand('copy');field.remove();if(!copied)throw new Error('Clipboard unavailable')}



  return function teardownPage(){
    stopDarkSignal();
    stopContactSignal();
    for(const observer of observers) observer.disconnect();
    for(const [name,callback] of documentListeners)document.removeEventListener(name,callback);
    window.removeEventListener('scroll',scrollState);
    window.removeEventListener('resize',scrollState);
    window.removeEventListener('resize',handleNavResize);
    clearTimeout(toastTimer);
    clearTimeout(copyResetTimer);
    if(stopTopGlide)stopTopGlide();
    if(stopSectionGlide)stopSectionGlide();
    interruptCurrentSectionGlide=()=>{};
  };
}

/* Lightweight same-origin document navigation. All original links remain usable
 * with JavaScript disabled or if a request cannot be completed. */
let teardownCurrentPage=initPage();
let navigationController=null;
let navigationSerial=0;
let activeDocument=(document.body.classList.contains('factory-page-body')?'factory':'index');
if('scrollRestoration' in history)history.scrollRestoration='manual';

function localPagePath(url){
  const path=url.pathname;
  if(!/\/(?:index|factory)\.html$/i.test(path)&&!path.endsWith('/'))return false;
  return path.replace(/(?:index\.html)?$/i,'');
}
function isCurrentDocument(url){
  const target=/\/factory\.html$/i.test(url.pathname)?'factory':'index';
  return target===activeDocument;
}
function updateHead(newDoc){
  document.title=newDoc.title;
  for(const selector of [
    'meta[name="description"]','meta[property="og:title"]',
    'meta[property="og:description"]','meta[property="og:type"]',
    'meta[property="og:url"]','meta[property="og:image"]',
    'meta[name="twitter:title"]','meta[name="twitter:description"]',
    'link[rel="canonical"]'
  ]){
    const current=document.head.querySelector(selector);
    const next=newDoc.head.querySelector(selector);
    if(current&&next){
      for(const attribute of ['content','href'])if(next.hasAttribute(attribute))current.setAttribute(attribute,next.getAttribute(attribute));
    }
  }
}
function jumpToDestination(url,restored){
  const root=document.documentElement;
  const previousBehavior=root.style.scrollBehavior;
  root.style.scrollBehavior='auto';
  if(restored&&Number.isFinite(restored.scrollY)){
    window.scrollTo({top:restored.scrollY,left:0,behavior:'instant'});
    // If fonts or viewport dimensions change, preserve the clicked card's
    // original visual position rather than merely restoring a stale pixel Y.
    if(Number.isFinite(restored.cardViewportTop)){
      const card=document.querySelector('#projects .project-card');
      if(card)window.scrollBy({top:card.getBoundingClientRect().top-restored.cardViewportTop,left:0,behavior:'instant'});
    }
  }
  else if(url.hash){
    let target;
    try{target=document.getElementById(decodeURIComponent(url.hash.slice(1)))}catch{}
    if(target)target.scrollIntoView({block:'start',behavior:'instant'});
    else window.scrollTo({top:0,left:0,behavior:'instant'});
  }else window.scrollTo({top:0,left:0,behavior:'instant'});
  root.style.scrollBehavior=previousBehavior;
  const main=document.querySelector('main');
  if(main){main.setAttribute('tabindex','-1');main.focus({preventScroll:true})}
}
/* Polish 09 — stable content-only navigation. The previous body fade
 * exposed the root canvas, producing a white flash in some environments.
 * Keep the document background continuously painted, swap the ready DOM,
 * and softly settle only <main> without obscuring the viewport. */
const waitNavigationFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
const waitNavigationTime=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function projectOriginFromCurrentClick(anchor){
  if(!document.body.classList.contains('home-page')||!anchor.closest('#projects .project-card'))return null;
  return {href:location.href,scrollY:window.scrollY,
    cardViewportTop:anchor.closest('.project-card').getBoundingClientRect().top};
}
function validProjectOrigin(value){
  if(!value||!Number.isFinite(value.scrollY)||!Number.isFinite(value.cardViewportTop))return null;
  try{
    const url=new URL(value.href,location.href);
    if(url.origin!==location.origin||!localPagePath(url)||/\/factory\.html$/i.test(url.pathname))return null;
    return {...value,href:url.href};
  }catch{return null}
}
async function navigateInternally(url,{pop=false,restored=null,projectOrigin=null}={}){
  if(navigationController)navigationController.abort();
  const controller=new AbortController();navigationController=controller;
  const serial=++navigationSerial;
  const root=document.documentElement;
  const clearMotion=()=>root.classList.remove('ds-route-swapping','ds-route-incoming','ds-route-leaving');
  clearMotion();
  try{
    if(!pop)history.replaceState({...history.state,softNavigation:true,scrollY:window.scrollY},'',location.href);
    const response=await fetch(url.href,{signal:controller.signal,credentials:'same-origin'});
    if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw new Error('Document unavailable');
    const nextDoc=new DOMParser().parseFromString(await response.text(),'text/html');
    if(!nextDoc.body||!nextDoc.querySelector('main')||!nextDoc.querySelector('link[href="style.css"]'))throw new Error('Invalid document');
    if(controller.signal.aborted||serial!==navigationSerial)return;
    // Quiet Reveal: subtly soften only the current main, retaining the
    // charcoal page canvas, header and scroll position as steady reference.
    if(!reduce){
      root.classList.add('ds-route-leaving');
      await waitNavigationTime(110);
      if(controller.signal.aborted||serial!==navigationSerial)return;
    }
    root.classList.remove('ds-route-leaving');
    root.classList.add('ds-route-swapping');
    teardownCurrentPage();
    if(!pop)history.pushState({softNavigation:true,scrollY:0,...(projectOrigin?{factoryOrigin:projectOrigin}:{})},'',url.href);
    const previousBehavior=root.style.scrollBehavior;
    root.style.scrollBehavior='auto';
    window.scrollTo({top:0,left:0,behavior:'instant'});
    updateHead(nextDoc);
    document.body.replaceWith(document.importNode(nextDoc.body,true));
    activeDocument=document.body.classList.contains('factory-page-body')?'factory':'index';
    jumpToDestination(url,restored);
    root.style.scrollBehavior=previousBehavior;
    teardownCurrentPage=initPage();
    // Restoring after a layout frame handles font/image sizing without a
    // separate visual jump: no full-page opacity animation is active.
    await waitNavigationFrame();
    if(controller.signal.aborted||serial!==navigationSerial)return;
    if(restored)jumpToDestination(url,restored);
    root.classList.remove('ds-route-swapping');
    if(!reduce){
      root.classList.add('ds-route-incoming');
      await waitNavigationTime(285);
    }
  }catch(error){
    if(error.name==='AbortError')return;
    clearMotion();
    location.assign(url.href);
  }finally{
    if(serial===navigationSerial)clearMotion();
    if(navigationController===controller)navigationController=null;
  }
}
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const anchor=event.target.closest?.('a[href]');
  if(!anchor||anchor.hasAttribute('download')||anchor.target&&anchor.target!=='_self')return;
  const href=anchor.getAttribute('href');
  if(!href||href.startsWith('#'))return;
  let url;try{url=new URL(anchor.href,location.href)}catch{return}
  if(url.origin!==location.origin||!/^https?:$/.test(url.protocol)||!localPagePath(url)||isCurrentDocument(url))return;
  event.preventDefault();
  interruptCurrentSectionGlide();
  // A project Back action returns to the actual clicked-card viewport,
  // while direct-entry visitors still use the existing #projects fallback.
  const isProjectReturn=document.body.classList.contains('factory-page-body') &&
    (anchor.matches('.back-link')||anchor.closest('.case-end .button.outline'));
  const origin=isProjectReturn?validProjectOrigin(history.state?.factoryOrigin):null;
  if(origin){
    const originUrl=new URL(origin.href);
    navigateInternally(originUrl,{restored:origin});
  }else{
    navigateInternally(url,{projectOrigin:projectOriginFromCurrentClick(anchor)});
  }
});
window.addEventListener('popstate',event=>{
  const url=new URL(location.href);
  if(!localPagePath(url))return;
  if(isCurrentDocument(url)){
    // A history restore supersedes any in-flight same-page glide.
    interruptCurrentSectionGlide();
    jumpToDestination(url,event.state?.softNavigation?event.state:null);
  }else navigateInternally(url,{pop:true,restored:event.state});
});


/* Dark Signal — organic neutral-metal resonance, no looping keyframes.
   Lightweight 2D rendering, paused when the hero or tab is not visible.
   This animation is a decorative enhancement; the HTML remains complete without it. */
function initDarkSignal(canvas){
  if(!canvas||!canvas.getContext)return ()=>{};
  const hero=canvas.closest('.hero');
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx||!hero)return ()=>{};
  let raf=0,w=0,h=0,last=0,visible=true,disposed=false;
  const mobile=()=>window.matchMedia('(max-width:760px)').matches;
  const point=(x,y)=>{ctx.lineTo(x,y)};
  const size=()=>{
    const bounds=hero.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,1.5);
    w=Math.max(1,bounds.width);h=Math.max(1,bounds.height);
    canvas.width=Math.max(1,Math.round(w*dpr));
    canvas.height=Math.max(1,Math.round(h*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw(performance.now()/1000);
  };
  function draw(t){
    ctx.clearRect(0,0,w,h);
    const title=hero.querySelector('h1');
    if(!title)return;
    const hr=hero.getBoundingClientRect();
    const tr=title.getBoundingClientRect();
    const cx=(tr.left+tr.width*.53-hr.left);
    const cy=(tr.top+tr.height*.56-hr.top);
    const mob=mobile();
    const sx=mob?Math.min(w*.46,165):Math.min(w*.41,275);
    const sy=mob?Math.min(h*.30,265):Math.min(h*.43,310);
    const shape=(y,p)=>Math.sin(y*.010+p*.83-t*.19)*16+Math.sin(y*.019-p*.27+t*.13)*8;
    // Wide, matte luminosity sits behind the name, never in front of it.
    const halo=ctx.createRadialGradient(cx,cy,13,cx,cy,sx*1.45);
    halo.addColorStop(0,'rgba(116,129,135,.085)');
    halo.addColorStop(.5,'rgba(96,106,111,.052)');
    halo.addColorStop(1,'rgba(30,36,40,0)');
    ctx.fillStyle=halo;ctx.fillRect(cx-sx*1.6,cy-sx*1.6,sx*3.2,sx*3.2);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx,cy,sx*1.16,sy*1.20,0,0,Math.PI*2);
    ctx.clip();
    // 19 fine vertical filaments: neutral graphite, never stars/orbits.
    const count=19;
    const spacing=sx*1.8/(count-1);
    for(let i=0;i<count;i++){
      const p=i-(count-1)/2;
      const x0=cx+p*spacing;
      const strength=Math.pow(1-Math.abs(p)/((count+1)/2),1.4);
      const phase=i*.58;
      ctx.beginPath();
      let first=true;
      for(let y=cy-sy*1.21;y<=cy+sy*1.21;y+=5){
        const d=(y-cy)/sy;
        const ebb=.82+.18*Math.cos(t*.21+phase+d*1.7);
        const x=x0+shape(y,phase)*ebb;
        if(first){ctx.moveTo(x,y);first=false}else point(x,y);
      }
      ctx.lineWidth=i%4===0?1.15:.75;
      const shimmer=.60+.40*Math.sin(t*.37+i*.5);
      ctx.strokeStyle='rgba(173,189,196,'+(0.044+strength*.135*shimmer).toFixed(4)+')';
      ctx.stroke();
      // Signal envelopes slide slowly and reverse smoothly: no discontinuous reset.
      if(i%3===0){
        const yLight=cy+sy*.78*Math.sin(t*.31+phase);
        ctx.beginPath();
        let started=false;
        for(let y=yLight-38;y<=yLight+38;y+=3){
          const d=(y-cy)/sy;
          const x=x0+shape(y,phase)*(.82+.18*Math.cos(t*.21+phase+d*1.7));
          if(!started){ctx.moveTo(x,y);started=true}else point(x,y);
        }
        const g=ctx.createLinearGradient(0,yLight-38,0,yLight+38);
        g.addColorStop(0,'rgba(222,233,238,0)');
        g.addColorStop(.5,'rgba(218,229,233,'+(mob?.31:.25)+')');
        g.addColorStop(1,'rgba(222,233,238,0)');
        ctx.strokeStyle=g;ctx.lineWidth=1.35;ctx.stroke();
      }
    }
    ctx.restore();
    // A slow breathing perimeter gives the field dimension without a neon glow.
    const breathe=(Math.sin(t*.27)+1)*.5;
    ctx.beginPath();
    ctx.ellipse(cx,cy,sx*(1.02+breathe*.045),sy*(1.05+breathe*.025),0,0,Math.PI*2);
    ctx.lineWidth=.75;
    ctx.strokeStyle='rgba(176,189,193,'+(mob?.115:.085)+')';
    ctx.stroke();
  }
  function frame(now){
    raf=0;
    if(disposed||!visible||document.hidden||reduce)return;
    if(now-last>=1000/30){last=now;draw(now/1000)}
    raf=requestAnimationFrame(frame);
  }
  function start(){if(!disposed&&!raf&&!reduce&&!document.hidden&&visible)raf=requestAnimationFrame(frame)}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0}
  const onVisibility=()=>{if(document.hidden)stop();else start()};
  document.addEventListener('visibilitychange',onVisibility);
  const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(size):null;
  if(ro)ro.observe(hero);
  else window.addEventListener('resize',size);
  const io=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>{
    visible=!!entries[0]?.isIntersecting;
    if(visible)start();else stop();
  },{threshold:0}):null;
  if(io)io.observe(hero);
  size();start();
  return ()=>{
    disposed=true;stop();ro?.disconnect();io?.disconnect();
    document.removeEventListener('visibilitychange',onVisibility);
    if(!ro)window.removeEventListener('resize',size);
  };
}


/* Dark Signal V2 / Phase 02 — "Signal Echo".
   A softer relation to the hero's neutral-metal wave, placed only at Contact.
   No CSS keyframe reset: time-driven sinusoids remain continuous, and offscreen
   drawing is paused. Canvas remains decorative and is removable on SPA swaps. */
function initContactSignal(canvas){
  if(!canvas||!canvas.getContext)return ()=>{};
  const section=canvas.closest('#contact');
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!section||!ctx)return ()=>{};
  let width=1,height=1,raf=0,last=0,visible=false,disposed=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile=()=>matchMedia('(max-width:760px)').matches;
  function paint(t){
    ctx.clearRect(0,0,width,height);
    const small=mobile();
    // A wider, quieter echo of the hero's metallic field across the merged
    // contact/signature space; no image or independent animation dependency.
    const cx=width/2,cy=height*(small?.44:.47);
    const spread=small?width*.64:Math.min(width*.50,600);
    // On phones extend the signal field through the contact eyebrow. Mobile
    // filaments gently enter from above, while the CSS mask fades both ends.
    const reach=small?height*.51:height*.49;
    const halo=ctx.createRadialGradient(cx,cy,2,cx,cy,spread*1.22);
    halo.addColorStop(0,'rgba(113,129,140,.086)');
    halo.addColorStop(.50,'rgba(92,109,119,.046)');
    halo.addColorStop(1,'rgba(16,24,29,0)');
    ctx.fillStyle=halo;
    ctx.fillRect(cx-spread*1.25,cy-spread*1.25,spread*2.5,spread*2.5);
    // Two low-saturation color envelopes breathe behind the lines, borrowing
    // the hero's flowing geometry without introducing a bright neon effect.
    for(const band of [
      {dx:-.27,dy:-.23,rgba:'108,153,179',alpha:.19,phase:0},
      {dx:.27,dy:.18,rgba:'158,131,116',alpha:.145,phase:2.1}
    ]){
      const bx=cx+spread*band.dx+Math.sin(t*.17+band.phase)*spread*.09;
      const by=cy+reach*band.dy+Math.sin(t*.14+band.phase)*reach*.13;
      ctx.save();
      ctx.translate(bx,by);
      ctx.scale(1,1.27);
      const wave=ctx.createRadialGradient(0,0,4,0,0,spread*.72);
      wave.addColorStop(0,'rgba('+band.rgba+','+band.alpha+')');
      wave.addColorStop(.58,'rgba('+band.rgba+','+(band.alpha*.34).toFixed(3)+')');
      wave.addColorStop(1,'rgba('+band.rgba+',0)');
      ctx.fillStyle=wave;
      ctx.fillRect(-spread*.74,-spread*.74,spread*1.48,spread*1.48);
      ctx.restore();
    }
    // A quiet family of fine vertical signals, darker behind the main heading.
    // No visible elliptical clip. Each filament fades at its own upper,
    // lower and lateral ends, so there is no outlined frame or hard seam.
    const count=small?17:23;
    for(let i=0;i<count;i++){
      const n=i/(count-1)*2-1;
      const phase=i*.43;
      const edge=Math.abs(n);
      const base=cx+n*spread*.84;
      const sway=(y)=>Math.sin(y*.009+phase-t*.145)*9+Math.sin(y*.017-phase*.7+t*.10)*4;
      ctx.beginPath();
      for(let y=cy-reach;y<=cy+reach+4;y+=7){
        const x=base+sway(y);
        if(y===cy-reach)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      const shimmer=.75+.25*Math.sin(t*.22+phase);
      const lateralFade=Math.pow(Math.max(0,1-edge),1.35);
      const alpha=(.035+.095*lateralFade)*shimmer;
      const filament=ctx.createLinearGradient(0,cy-reach,0,cy+reach);
      filament.addColorStop(0,'rgba(176,188,194,0)');
      filament.addColorStop(.17,'rgba(176,188,194,'+(alpha*.43).toFixed(4)+')');
      filament.addColorStop(.38,'rgba(176,188,194,'+alpha.toFixed(4)+')');
      filament.addColorStop(.64,'rgba(176,188,194,'+alpha.toFixed(4)+')');
      filament.addColorStop(.85,'rgba(176,188,194,'+(alpha*.38).toFixed(4)+')');
      filament.addColorStop(1,'rgba(176,188,194,0)');
      ctx.strokeStyle=filament;
      ctx.lineWidth=i%5===0?1:.66;
      ctx.stroke();
      if(i%5===2){
        const yLight=cy+reach*.78*Math.sin(t*.23+phase);
        ctx.beginPath();
        for(let y=yLight-26;y<=yLight+26;y+=4){
          const x=base+sway(y);
          if(y===yLight-26)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        const g=ctx.createLinearGradient(0,yLight-26,0,yLight+26);
        g.addColorStop(0,'rgba(207,219,223,0)');
        g.addColorStop(.5,'rgba(216,225,229,'+(small?.15:.13)+')');
        g.addColorStop(1,'rgba(207,219,223,0)');
        ctx.strokeStyle=g;ctx.lineWidth=1.1;ctx.stroke();
      }
    }
    // Two very fine, slow waves reconnect the closing composition to the hero.
    // Keep them behind the copy at a low contrast and without any flashing.
    for(const wave of [
      {height:-.19,rgb:'117,169,192',alpha:.17,speed:.17,phase:0},
      {height:.31,rgb:'170,144,130',alpha:.135,speed:.12,phase:1.8}
    ]) {
      const half=Math.min(spread*.91,width*.47);
      ctx.beginPath();
      let started=false;
      for(let x=cx-half;x<=cx+half+4;x+=5){
        const dist=(x-cx)/spread;
        const y=cy+reach*wave.height+
          Math.sin(dist*3.5+t*wave.speed+wave.phase)*reach*.07;
        if(!started){ctx.moveTo(x,y);started=true;}else ctx.lineTo(x,y);
      }
      const sheen=ctx.createLinearGradient(cx-half,0,cx+half,0);
      sheen.addColorStop(0,'rgba('+wave.rgb+',0)');
      sheen.addColorStop(.32,'rgba('+wave.rgb+','+(wave.alpha*.5).toFixed(3)+')');
      sheen.addColorStop(.52,'rgba('+wave.rgb+','+wave.alpha+')');
      sheen.addColorStop(.73,'rgba('+wave.rgb+','+(wave.alpha*.55).toFixed(3)+')');
      sheen.addColorStop(1,'rgba('+wave.rgb+',0)');
      ctx.strokeStyle=sheen;
      ctx.lineWidth=small?1.2:1.35;
      ctx.stroke();
    }
    // Intentionally no ellipse stroke: the field disappears naturally
    // into the page rather than drawing a visible circular perimeter.
  }
  function resize(){
    // The mobile canvas is deliberately full-bleed; use its displayed box
    // rather than the narrower content section to avoid scaling seams.
    const r=canvas.getBoundingClientRect();
    width=Math.max(1,r.width);height=Math.max(1,r.height);
    const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    paint(reduced?0:performance.now()/1000);
  }
  function frame(now){
    raf=0;
    if(disposed||!visible||document.hidden||reduced)return;
    if(now-last>=(1000/24)){last=now;paint(now/1000)}
    raf=requestAnimationFrame(frame);
  }
  function start(){if(!disposed&&!raf&&!reduced&&!document.hidden&&visible)raf=requestAnimationFrame(frame)}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0}
  const onVisibility=()=>{if(document.hidden)stop();else start()};
  document.addEventListener('visibilitychange',onVisibility);
  const ro=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
  if(ro)ro.observe(section);else window.addEventListener('resize',resize);
  const io=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
    visible=!!entries[0]?.isIntersecting;
    if(visible)start();else stop();
  },{threshold:0}):null;
  if(io)io.observe(section);else visible=true;
  resize();start();
  return ()=>{
    disposed=true;stop();ro?.disconnect();io?.disconnect();
    document.removeEventListener('visibilitychange',onVisibility);
    if(!ro)window.removeEventListener('resize',resize);
  };
}
