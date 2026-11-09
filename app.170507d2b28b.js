const $=s=>document.querySelector(s);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function initPage(){
  const observers=[];
  const documentListeners=[];
  const observeWith=(callback,settings)=>{const observer=new IntersectionObserver(callback,settings);observers.push(observer);return observer};
  const onDoc=(name,callback)=>{document.addEventListener(name,callback);documentListeners.push([name,callback])};

// Lazy, non-blocking Tajawal font: only load for the bilingual project milestone.
// Reused across client-side page changes; font files stay hosted by Google Fonts.
if($('.milestone-ar')&&!document.getElementById('milestone-arabic-font')){
  const fontLink=document.createElement('link');
  fontLink.id='milestone-arabic-font';
  fontLink.rel='stylesheet';
  fontLink.href='https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500&display=swap';
  document.head.appendChild(fontLink);
}

if($('#year'))$('#year').textContent=new Date().getFullYear();
const toggle=$('.menu-toggle'),menu=$('#navlinks');function closeMenu(){menu?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Open navigation')}toggle?.addEventListener('click',()=>{let open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',open);toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation')});menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));onDoc('keydown',e=>{if(e.key==='Escape'){if(menu?.classList.contains('open')){closeMenu();toggle.focus()}}});onDoc('click',e=>{if(!e.target.closest('.nav'))closeMenu()});
function scrollState(){let y=scrollY,max=document.documentElement.scrollHeight-innerHeight;$('.nav')?.classList.toggle('scrolled',y>20);$('#backtop')?.classList.toggle('visible',y>650);if($('#progress'))$('#progress').style.width=(max>0?y/max*100:0)+'%'}window.addEventListener('scroll',scrollState,{passive:true});window.addEventListener('resize',scrollState);scrollState();
if('IntersectionObserver' in window){const obs=observeWith(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('seen');obs.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.section-heading,.skill,.timeline article,.finding,.report-section>div,.about-copy,.process-list article,.file-list article,.factory-page-body #findings .findings-heading').forEach(el=>{if(!reduce){el.classList.add('reveal');obs.observe(el)}});const active=observeWith(entries=>entries.forEach(e=>{if(e.isIntersecting){document.querySelectorAll('#navlinks a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))}}),{rootMargin:'-15% 0px -55% 0px'});document.querySelectorAll('section[id]').forEach(el=>active.observe(el))}
// A quiet replay for homepage titles only. All other reveal targets stay one-shot.
// Observe title visibility rather than scrolling continuously: inexpensive on mobile.
if(!reduce&&document.body.classList.contains('home-page')&&'IntersectionObserver' in window){
  const titles=document.querySelectorAll('main > .section h2');
  const titleObserver=observeWith(entries=>{
    for(const entry of entries){
      const title=entry.target;
      if(entry.isIntersecting){
        if(title.dataset.titleVisited==='true'||!title.closest('.section-heading')){
          title.classList.add('heading-replay');
        }
        title.dataset.titleVisited='true';
      }else{
        title.classList.remove('heading-replay');
      }
    }
  },{rootMargin:'-18% 0px -18% 0px',threshold:0});
  titles.forEach(title=>titleObserver.observe(title));
}
let toastTimer,copyResetTimer;function toast(message,state='success'){const el=$('.toast');if(!el)return;el.textContent=message;el.dataset.state=state;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2500)}
const copyButton=$('.copy-email');
copyButton?.addEventListener('click',async()=>{
  try{
    await copyAddress();
    copyButton.classList.add('is-copied');
    copyButton.setAttribute('aria-label','Email address copied');
    copyButton.setAttribute('title','Email address copied');
    toast('Email address copied');
    clearTimeout(copyResetTimer);
    copyResetTimer=setTimeout(()=>{
      copyButton.classList.remove('is-copied');
      copyButton.setAttribute('aria-label','Copy email address');
      copyButton.setAttribute('title','Copy email address');
    },2500);
  }catch{
    toast('Copy unavailable — mohadmuayadai@gmail.com','error');
  }finally{
    if(!copyButton.matches(':focus-visible'))copyButton.blur();
  }
});
const dlg=$('#chart-dialog');document.querySelectorAll('.chart-open').forEach(b=>b.addEventListener('click',()=>{$('#chart-image').src=b.dataset.chart;$('#chart-image').alt=b.dataset.title;$('#chart-title').textContent=b.dataset.title;dlg.showModal()}));$('.dialog-close')?.addEventListener('click',()=>dlg.close());dlg?.addEventListener('click',e=>{if(e.target===dlg){let r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dlg.close()}});
onDoc('visibilitychange',()=>document.body.classList.toggle('page-hidden',document.hidden));

const caseLinks=[...document.querySelectorAll('.case-nav a')];
if(caseLinks.length&&'IntersectionObserver' in window){const sections=[...new Set(caseLinks.map(a=>document.querySelector(a.hash)).filter(Boolean))];const watcher=observeWith(entries=>{for(const entry of entries){if(entry.isIntersecting){caseLinks.forEach(a=>{const current=a.hash==='#'+entry.target.id;a.classList.toggle('active',current);if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}}},{rootMargin:'-10% 0px -55% 0px',threshold:0});sections.forEach(s=>watcher.observe(s))}

async function copyAddress(){const address='mohadmuayadai@gmail.com';try{if(navigator.clipboard){await navigator.clipboard.writeText(address);return}}catch{}const field=document.createElement('textarea');field.value=address;field.setAttribute('readonly','');field.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(field);field.select();const copied=document.execCommand('copy');field.remove();if(!copied)throw new Error('Clipboard unavailable')}



// Project-only: the footer already has its own Back to Top link.
// Do not let the fixed shortcut overlap it on narrow screens.
if(document.body.classList.contains('factory-page-body')&&'IntersectionObserver' in window){
  const footer=document.querySelector('footer');
  if(footer){
    observeWith(entries=>{
      document.body.classList.toggle('footer-in-view',entries[0].isIntersecting);
    },{threshold:0}).observe(footer);
  }
}

  return function teardownPage(){
    for(const observer of observers) observer.disconnect();
    for(const [name,callback] of documentListeners)document.removeEventListener(name,callback);
    window.removeEventListener('scroll',scrollState);
    window.removeEventListener('resize',scrollState);
    clearTimeout(toastTimer);
    clearTimeout(copyResetTimer);
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
  if(restored&&Number.isFinite(restored.scrollY))window.scrollTo(0,restored.scrollY);
  else if(url.hash){
    let target;
    try{target=document.getElementById(decodeURIComponent(url.hash.slice(1)))}catch{}
    if(target)target.scrollIntoView({block:'start',behavior:'instant'});
    else window.scrollTo(0,0);
  }else window.scrollTo(0,0);
  root.style.scrollBehavior=previousBehavior;
  const main=document.querySelector('main');
  if(main){main.setAttribute('tabindex','-1');main.focus({preventScroll:true})}
}
async function navigateInternally(url,{pop=false,restored=null}={}){
  if(navigationController)navigationController.abort();
  const controller=new AbortController();navigationController=controller;
  const serial=++navigationSerial;
  try{
    if(!pop){
      history.replaceState({...history.state,softNavigation:true,scrollY:window.scrollY},'',location.href);
    }
    const response=await fetch(url.href,{signal:controller.signal,credentials:'same-origin'});
    if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw new Error('Document unavailable');
    const nextDoc=new DOMParser().parseFromString(await response.text(),'text/html');
    if(!nextDoc.body||!nextDoc.querySelector('main')||!nextDoc.querySelector('link[rel="stylesheet"][href^="style."]'))throw new Error('Invalid document');
    if(controller.signal.aborted||serial!==navigationSerial)return;
    const swap=()=>{
      teardownCurrentPage();
      if(!pop)history.pushState({softNavigation:true,scrollY:0},'',url.href);
      updateHead(nextDoc);
      document.body.replaceWith(document.importNode(nextDoc.body,true));
      activeDocument=document.body.classList.contains('factory-page-body')?'factory':'index';
      teardownCurrentPage=initPage();
      jumpToDestination(url,pop?restored:null);
    };
    if(document.startViewTransition&&!reduce){
      const transition=document.startViewTransition(swap);
      await transition.finished;
    }else swap();
  }catch(error){
    if(error.name==='AbortError')return;
    // Normal full-page navigation is a reliable fallback.
    location.assign(url.href);
  }finally{
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
  navigateInternally(url);
});
window.addEventListener('popstate',event=>{
  const url=new URL(location.href);
  if(!localPagePath(url))return;
  if(isCurrentDocument(url)){
    jumpToDestination(url,event.state?.softNavigation?event.state:null);
  }else navigateInternally(url,{pop:true,restored:event.state});
});
