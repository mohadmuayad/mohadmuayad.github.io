// Shared, predictable history-aware return links with an in-site fallback.
document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-history-back]');
  if(!link)return;
  // Factory Back is handled by the route navigator below. Native history.back()
  // can bypass its card-origin state and land at the top of the home page.
  if(document.body.classList.contains('factory-page-body'))return;
  const referrer=document.referrer;
  let sameSitePrevious=false;
  try{
    const previous=new URL(referrer);
    const current=new URL(location.href);
    sameSitePrevious=previous.origin===current.origin && (previous.pathname!==current.pathname || previous.search!==current.search || previous.hash!==current.hash);
  }catch{}
  if(sameSitePrevious && history.length>1){event.preventDefault();history.back();}
});
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
  const notebookMode=document.body.classList.contains('notebook-page-body');
  const stopNotebookReader=window.dsInitNotebookReader?.() || (()=>{});
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
// Site navigation has its own isolated controller in experiment/site-navigation.js.
// Preserve the shared scroll-chrome scheduler used by progress and back-to-top.
let headerFrame=0;
function onHeaderScroll(){
  if(headerFrame)return;
  headerFrame=requestAnimationFrame(()=>{
    headerFrame=0;
    if(!notebookMode)scrollState();
  });
}
window.addEventListener('scroll',onHeaderScroll,{passive:true});
// Page chrome shares the smart header's one-frame scroll scheduler.
// Cache the stable elements for this page; initPage rebuilds them after each
// route swap and teardown disconnects the shared listener on navigation.
const scrollFooter=notebookMode?null:$('footer');
const scrollBacktop=notebookMode?null:$('#backtop');
const scrollProgress=notebookMode?null:$('#progress');
const scrollRoot=document.documentElement;
let lastBacktopVisible=null,lastFooterVisible=null;
function scrollState(){
  const y=Math.max(0,window.scrollY);
  const max=scrollRoot.scrollHeight-window.innerHeight;
  const footerVisible=!!scrollFooter&&scrollFooter.getBoundingClientRect().top<window.innerHeight-16;
  if(footerVisible!==lastFooterVisible){
    document.body.classList.toggle('footer-in-view',footerVisible);
    lastFooterVisible=footerVisible;
  }
  const showTopShortcut=y>300;
  if(scrollBacktop&&showTopShortcut!==lastBacktopVisible){
    scrollBacktop.classList.toggle('visible',showTopShortcut);
    scrollBacktop.tabIndex=showTopShortcut?0:-1;
    scrollBacktop.setAttribute('aria-hidden',String(!showTopShortcut));
    if(!showTopShortcut&&document.activeElement===scrollBacktop)scrollBacktop.blur();
    lastBacktopVisible=showTopShortcut;
  }
  if(scrollProgress)scrollProgress.style.width=(max>0?y/max*100:0)+'%';
}
  if(!notebookMode)scrollState();
if(!notebookMode&&'IntersectionObserver' in window){const obs=observeWith(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('seen');obs.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.section-heading,.skill,.home-page #projects .project-card,.timeline article,.finding,.report-section>div,.about-copy,.process-list article,.file-list article,.factory-page-body #findings .findings-heading').forEach(el=>{if(!reduce){el.classList.add('reveal');obs.observe(el)}});const active=observeWith(entries=>entries.forEach(e=>{if(e.isIntersecting){document.querySelectorAll('.ds-shell-nav__links a').forEach(a=>{const active=a.getAttribute('href')==='#'+e.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');})}}),{rootMargin:'-15% 0px -55% 0px'});document.querySelectorAll('section[id]').forEach(el=>active.observe(el))}
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
  const link=event.target.closest?.('.ds-shell-nav a[href^="#"], .nav a[href^="#"], .home-page .hero .actions a[href^="#"], .home-page .scroll-cue[href^="#"], .factory-page-body .case-nav a[href^="#"], .notebook-page-body .notebook-toc a[href^="#"]');
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
    stopNotebookReader();
    if(headerFrame)cancelAnimationFrame(headerFrame);
    window.removeEventListener('scroll',onHeaderScroll);
    for(const observer of observers)observer.disconnect();
    for(const [name,callback] of documentListeners)document.removeEventListener(name,callback);
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
let activeDocument=pageIdFromPath(location.pathname);
if('scrollRestoration' in history)history.scrollRestoration='manual';

function pageIdFromPath(path){
  if(/\/notebooks\/01_data_quality_analysis\.html$/i.test(path))return 'notebook-01';
  if(/\/notebooks\/02_data_cleaning_validation\.html$/i.test(path))return 'notebook-02';
  if(/\/factory\.html$/i.test(path))return 'factory';
  if(path==='/'||/\/index\.html$/i.test(path))return 'index';
  return null;
}
function localPagePath(url){return pageIdFromPath(url.pathname)}
function isCurrentDocument(url){return pageIdFromPath(url.pathname)===activeDocument}
/* Keep route-specific CSS correct during content-only navigation.
 * Stage changed styles with a nonmatching media query before the DOM swap;
 * switch them on atomically with the new body, then remove stale versions.
 * If loading fails, native full-page navigation remains the fallback. */
async function stageRouteStylesheets(nextDoc,destination,signal){
  const current=[...document.head.querySelectorAll('link[rel="stylesheet"][href]')];
  const desired=[...nextDoc.head.querySelectorAll('link[rel="stylesheet"][href]')];
  const currentByPath=new Map(current.map(link=>[new URL(link.href).pathname,link]));
  const desiredPaths=new Set(desired.map(link=>new URL(link.getAttribute('href'),destination.href).pathname));
  // Every supported page currently has the same six stylesheet families.
  // Unknown sheet structures should use a safe native navigation instead.
  if(current.length!==desired.length||current.some(link=>!desiredPaths.has(new URL(link.href).pathname)))
    throw new Error('Route stylesheet mismatch');
  const staged=[],pending=[];
  for(const source of desired){
    const href=new URL(source.getAttribute('href'),destination.href).href;
    const old=currentByPath.get(new URL(href).pathname);
    if(old?.href===href)continue;
    const link=source.cloneNode(true);
    link.href=href;
    link.media='not all';
    pending.push(new Promise((resolve,reject)=>{
      link.addEventListener('load',resolve,{once:true});
      link.addEventListener('error',()=>reject(new Error('Route CSS load failed: '+href)),{once:true});
    }));
    old?old.before(link):document.head.append(link);
    staged.push({link,old,media:source.getAttribute('media')});
  }
  let committed=false,abortHandler,timer;
  const discard=()=>{if(!committed)for(const {link} of staged)link.remove()};
  try{
    const aborted=new Promise((_,reject)=>{
      abortHandler=()=>reject(new DOMException('Navigation interrupted','AbortError'));
      if(signal.aborted)abortHandler();
      else signal.addEventListener('abort',abortHandler,{once:true});
    });
    const timedOut=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Route CSS timeout')),6000)});
    await Promise.race([Promise.all(pending),aborted,timedOut]);
    if(signal.aborted)throw new DOMException('Navigation interrupted','AbortError');
    return {
      commit(){
        for(const {link,old,media} of staged){
          if(media===null)link.removeAttribute('media');
          else link.media=media;
          old?.remove();
        }
        committed=true;
      },
      discard
    };
  }catch(error){discard();throw error}
  finally{
    if(timer)clearTimeout(timer);
    if(abortHandler)signal.removeEventListener('abort',abortHandler);
  }
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
// Prefer the project card's own CTA over a fixed scroll offset. It is a
// stable visual anchor even when images, fonts or mobile viewport sizes differ.
function alignProjectCardReturn(restored){
  if(!restored||!Number.isFinite(restored.actionViewportTop)&&!restored.returnToProjectCard)return false;
  const action=document.querySelector('#projects .project-card a.project-link[href$="factory.html"]');
  if(!action)return false;
  const wanted=Number.isFinite(restored.actionViewportTop)
    ?Math.max(106,Math.min(window.innerHeight-80,restored.actionViewportTop))
    :Math.max(120,Math.min(window.innerHeight*.56,460));
  const delta=action.getBoundingClientRect().top-wanted;
  if(Math.abs(delta)>1)window.scrollBy({top:delta,left:0,behavior:'instant'});
  return true;
}
function jumpToDestination(url,restored){
  const root=document.documentElement;
  const previousBehavior=root.style.scrollBehavior;
  root.style.scrollBehavior='auto';
  if(restored&&Number.isFinite(restored.scrollY)){
    window.scrollTo({top:restored.scrollY,left:0,behavior:'instant'});
    // If fonts or viewport dimensions change, preserve the clicked card's
    // original visual position rather than merely restoring a stale pixel Y.
    if(!alignProjectCardReturn(restored)&&Number.isFinite(restored.cardViewportTop)){
      const card=document.querySelector('#projects .project-card');
      if(card)window.scrollBy({top:card.getBoundingClientRect().top-restored.cardViewportTop,left:0,behavior:'instant'});
    }
  }
  else if(restored?.returnToProjectCard&&alignProjectCardReturn(restored)){
    // Direct visits have no saved origin; return beside the project's CTA.
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
    cardViewportTop:anchor.closest('.project-card').getBoundingClientRect().top,
    actionViewportTop:anchor.getBoundingClientRect().top};
}
function validProjectOrigin(value){
  if(!value||!Number.isFinite(value.scrollY)||!Number.isFinite(value.cardViewportTop))return null;
  try{
    const url=new URL(value.href,location.href);
    if(url.origin!==location.origin||pageIdFromPath(url.pathname)!=='index')return null;
    return {...value,href:url.href};
  }catch{return null}
}
async function navigateInternally(url,{pop=false,restored=null,projectOrigin=null}={}){
  if(navigationController)navigationController.abort();
  const controller=new AbortController();navigationController=controller;
  const serial=++navigationSerial;
  let stagedStyles=null;
  const root=document.documentElement;
  const clearMotion=()=>root.classList.remove('ds-route-swapping','ds-route-incoming','ds-route-leaving');
  clearMotion();
  try{
    if(!pop)history.replaceState({
      ...history.state,softNavigation:true,scrollY:window.scrollY,
      ...(projectOrigin?{
        cardViewportTop:projectOrigin.cardViewportTop,
        actionViewportTop:projectOrigin.actionViewportTop
      }:{})
    },'',location.href);
    const response=await fetch(url.href,{signal:controller.signal,credentials:'same-origin'});
    if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw new Error('Document unavailable');
    const nextDoc=new DOMParser().parseFromString(await response.text(),'text/html');
    if(!nextDoc.body||!nextDoc.querySelector('main')||(!nextDoc.querySelector('link[href^="style.css"]')&&!nextDoc.querySelector('link[href^="../style.css"]')))throw new Error('Invalid document');
    if(controller.signal.aborted||serial!==navigationSerial)return;
    stagedStyles=await stageRouteStylesheets(nextDoc,url,controller.signal);
    if(controller.signal.aborted||serial!==navigationSerial)return;
    // Prepare the large Notebook 01 DOM while the current page is still visible.
    // The user must never see a changed URL with an old body's final frame.
    const nextBody=document.importNode(nextDoc.body,true);
    // Images must resolve against the DESTINATION page before the DOM swap.
    // Otherwise Notebook -> Factory (or Home) can briefly resolve assets
    // against /notebooks/ and leave valid images broken after navigation.
    nextBody.querySelectorAll('img[src],source[src]').forEach(image=>{
      const value=image.getAttribute('src');
      if(!value||/^(?:data:|blob:|javascript:)/i.test(value))return;
      try{image.setAttribute('src',new URL(value,url.href).href)}catch{}
    });
    if(controller.signal.aborted||serial!==navigationSerial)return;
    // Quiet Reveal: subtly soften only the current main, retaining the
    // charcoal page canvas, header and scroll position as steady reference.
    if(!reduce){
      root.classList.add('ds-route-leaving');
      await waitNavigationTime(240);
      if(controller.signal.aborted||serial!==navigationSerial)return;
    }
    root.classList.remove('ds-route-leaving');
    root.classList.add('ds-route-swapping');
    teardownCurrentPage();
    const previousBehavior=root.style.scrollBehavior;
    root.style.scrollBehavior='auto';
    window.scrollTo({top:0,left:0,behavior:'instant'});
    // Replace the prepared body before committing the matching URL.
    // No stale Factory or Home content can appear under a Notebook address.
    document.body.replaceWith(nextBody);
    stagedStyles.commit();
    activeDocument=pageIdFromPath(url.pathname);
    if(!pop)history.pushState({softNavigation:true,scrollY:0,...(projectOrigin?{factoryOrigin:projectOrigin}:{})},'',url.href);
    updateHead(nextDoc);
    jumpToDestination(url,restored);
    root.style.scrollBehavior=previousBehavior;
    teardownCurrentPage=initPage();
    window.dsReinitExperience?.();
    // For the unusually large first notebook, give the browser a complete
    // hidden-layout frame before starting the lightweight entrance. This
    // avoids competing with first paint of hundreds of analytical tables.
    await waitNavigationFrame();
    if(activeDocument==='notebook-01'&&!reduce)await waitNavigationFrame();
    if(controller.signal.aborted||serial!==navigationSerial)return;
    if(restored)jumpToDestination(url,restored);
    // Keep the new main invisible through the swap; reveal only after
    // the correct scroll position and page layout are ready.
    if(!reduce){
      root.classList.add('ds-route-incoming');
      root.classList.remove('ds-route-swapping');
      await waitNavigationTime(540);
    }else root.classList.remove('ds-route-swapping');
  }catch(error){
    if(error.name==='AbortError')return;
    clearMotion();
    location.assign(url.href);
  }finally{
    stagedStyles?.discard();
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
  if(isProjectReturn){
    const originUrl=origin?new URL(origin.href):url;
    navigateInternally(originUrl,{restored:origin||{returnToProjectCard:true}});
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
    // The drawing surface is viewport-aligned, while the artwork keeps its
    // original hero-relative scale. Match bitmap pixels to the actual CSS box.
    const bounds=canvas.getBoundingClientRect();
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
    const actions=hero.querySelector('.actions');
    if(!title||!actions)return;
    const hr=hero.getBoundingClientRect();
    const cr=canvas.getBoundingClientRect();
    const tr=title.getBoundingClientRect();
    const ar=actions.getBoundingClientRect();
    const mob=mobile();
    const cx=tr.left+tr.width*.53-cr.left;
    const originalSx=mob?Math.min(hr.width*.46,165):Math.min(hr.width*.41,275);
    const sx=Math.max(1,Math.min(originalSx,(cx-4)/1.16,(w-cx-4)/1.16));
    const yOrigin=cr.top-hr.top;
    // Open Signal Resonance: no circle outline, hard ellipse clip or sharp ends.
    // Both boundaries follow the actual title/buttons, rather than the hero's
    // total height, so the fade stays intentional on desktop and on phones.
    const top=Math.max(hr.top-cr.top+(mob?74:65),tr.top-cr.top-(mob?116:175));
    const bottom=Math.min(h,ar.top-cr.top+(mob?22:29));
    const span=Math.max(180,bottom-top);
    const mid=(top+bottom)*.5;
    const radius=Math.max(1,Math.min(sx*.99,(cx-28)/1.13,(w-cx-28)/1.13));
    // On narrow screens, preserve the full field with fewer, more legible strands.
    // Desktop keeps the original 27-strand composition exactly as before.
    const count=mob?23:27;
    const spacing=radius*2/(count-1);
    const smooth=(a,b,x)=>{const u=Math.max(0,Math.min(1,(x-a)/Math.max(1,b-a)));return u*u*(3-2*u)};
    const halo=ctx.createRadialGradient(cx,mid,14,cx,mid,radius*1.52);
    halo.addColorStop(0,'rgba(116,129,135,.085)');
    halo.addColorStop(.5,'rgba(96,106,111,.052)');
    halo.addColorStop(1,'rgba(30,36,40,0)');
    ctx.fillStyle=halo;
    ctx.fillRect(cx-radius*1.6,mid-radius*1.6,radius*3.2,radius*3.2);
    const pointAt=(i,y)=>{
      const p=i-(count-1)/2;
      const u=(y-mid)/Math.max(1,span*.50);
      const wave=Math.sin((y+yOrigin)*.010+p*.83-t*.19)*16
                +Math.sin((y+yOrigin)*.019-p*.27+t*.13)*8;
      // Shared sweeping rhythm is the source of the rotation impression.
      // Small per-strand displacement keeps separation without crossings.
      const sweep=Math.sin(u*2.4-t*.19)*23+Math.sin(u*4.7+t*.13)*7;
      const breathing=.94-.08*Math.exp(-u*u*3)+.03*Math.cos(u*2.8-t*.13);
      const independent=Math.sin(u*3.0+p*.16-t*.19)*2.0;
      return cx+p*spacing*breathing+wave*.10+sweep+independent;
    };
    for(let i=0;i<count;i++){
      // Keep the centre 23 phases of the original 27, instead of changing the
      // wave shapes or speeding up the motion when thinning the mobile field.
      const originalIndex=i+(27-count)/2;
      const p=i-(count-1)/2;
      const edge=Math.max(0,1-Math.abs(p)/((count+1)/2));
      const strength=Math.pow(edge,1.55);
      const phase=originalIndex*.58;
      const shimmer=.60+.40*Math.sin(t*.37+originalIndex*.5);
      // A slight centre lift from the prototype, without brightening edges.
      const opacity=.029+(mob?.347:.335)*strength*shimmer;
      ctx.beginPath();
      ctx.moveTo(pointAt(i,top),top);
      for(let y=top+4;y<bottom;y+=4)ctx.lineTo(pointAt(i,y),y);
      ctx.lineTo(pointAt(i,bottom),bottom);
      const gradient=ctx.createLinearGradient(0,top,0,bottom);
      const color=a=>'rgba(173,189,196,'+Math.max(0,a).toFixed(4)+')';
      gradient.addColorStop(0,color(0));
      gradient.addColorStop(.13,color(opacity*.50));
      gradient.addColorStop(.28,color(opacity*.88));
      gradient.addColorStop(.49,color(opacity));
      gradient.addColorStop(.69,color(opacity*.63));
      gradient.addColorStop(.84,color(opacity*.18));
      gradient.addColorStop(1,color(0));
      ctx.strokeStyle=gradient;
      ctx.lineWidth=originalIndex%4===0?1.15:.75;
      ctx.stroke();
      // Retain the original slow pulse timing and neutral-metal colors.
      if(originalIndex%3===0){
        const yLight=mid+span*.32*Math.sin(t*.31+phase);
        const ya=Math.max(top,yLight-38),yb=Math.min(bottom,yLight+38);
        if(yb>ya){
          const fade=smooth(top,top+90,yLight)*(1-smooth(bottom-130,bottom,yLight));
          const glow=fade*strength*(mob?.28:.24);
          if(glow>.001){
            ctx.beginPath();
            ctx.moveTo(pointAt(i,ya),ya);
            for(let y=ya+3;y<yb;y+=3)ctx.lineTo(pointAt(i,y),y);
            ctx.lineTo(pointAt(i,yb),yb);
            const pulse=ctx.createLinearGradient(0,yLight-38,0,yLight+38);
            pulse.addColorStop(0,'rgba(222,233,238,0)');
            pulse.addColorStop(.5,'rgba(218,229,233,'+glow.toFixed(4)+')');
            pulse.addColorStop(1,'rgba(222,233,238,0)');
            ctx.strokeStyle=pulse;
            ctx.lineWidth=1.25;
            ctx.stroke();
          }
        }
      }
    }
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
