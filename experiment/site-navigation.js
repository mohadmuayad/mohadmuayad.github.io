/* Dark Signal — standalone site navigation controller v1.
   No dependency on legacy header selectors, animation stacks or :has(). */
(function(){
  'use strict';
  var current=null,dispose=null,observer=null;
  var mobile=window.matchMedia('(max-width:760px)');
  function bind(header){
    var button=header.querySelector('[data-ds-nav-toggle]');
    var panel=header.querySelector('[data-ds-nav-panel]');
    var backdrop=header.querySelector('[data-ds-nav-backdrop]');
    if(!button||!panel)return function(){};
    var opened=false,drag=null,topY=Math.max(0,window.pageYOffset||0);
    var travel=0,direction=0,raf=0,touchY=null,hidden=false;
    function setHidden(state){
      if(hidden===state)return;
      hidden=state;
      header.setAttribute('data-hidden',state?'true':'false');
    }
    function openMenu(state,focus){
      if(!mobile.matches)state=false;
      opened=state;
      header.setAttribute('data-open',state?'true':'false');
      button.setAttribute('aria-expanded',state?'true':'false');
      button.setAttribute('aria-label',state?'Close navigation':'Open navigation');
      panel.inert=!state&&mobile.matches;
      panel.removeAttribute('data-dragging');
      panel.style.removeProperty('--ds-drag');
      drag=null;
      if(state)setHidden(false);
      if(focus)button.focus();
    }
    function decide(delta,y){
      if(opened||y<110){direction=0;travel=0;setHidden(false);return;}
      if(Math.abs(delta)<1.5)return;
      var d=delta>0?1:-1;
      if(d!==direction){direction=d;travel=0;}
      travel+=Math.abs(delta);
      if(d>0&&y>145&&travel>22)setHidden(true);
      else if(d<0&&travel>13)setHidden(false);
    }
    function runScroll(){
      raf=0;
      var y=Math.max(0,window.pageYOffset||document.documentElement.scrollTop||0);
      decide(y-topY,y);topY=y;
    }
    function onScroll(){if(!raf)raf=window.requestAnimationFrame(runScroll);}
    function onTouchStart(e){touchY=e.touches.length===1?e.touches[0].clientY:null;}
    function onTouchMove(e){
      if(touchY===null||e.touches.length!==1)return;
      var next=e.touches[0].clientY,delta=touchY-next;touchY=next;
      if(Math.abs(delta)>=1.5)decide(delta,Math.max(0,window.pageYOffset||0));
    }
    function onTouchEnd(){touchY=null;}
    function onToggle(){openMenu(!opened,false);}
    function onOutside(e){if(opened&&!header.contains(e.target))openMenu(false,false);}
    function onKeyboard(e){if(e.key==='Escape'&&opened)openMenu(false,true);}
    function onPanelStart(e){
      if(!opened||e.touches.length!==1)return;
      drag={x:e.touches[0].clientX,y:e.touches[0].clientY,dy:0};
    }
    function onPanelMove(e){
      if(!drag||e.touches.length!==1)return;
      var dx=e.touches[0].clientX-drag.x,dy=e.touches[0].clientY-drag.y;
      if(panel.scrollTop>1||Math.abs(dx)>Math.abs(dy)*.75)return;
      // Upward follows the finger to dismiss. A gentle downward pull has
      // elastic resistance and springs back on release, like a native sheet.
      drag.dy=dy<0?Math.max(-panel.offsetHeight,dy):Math.min(32,dy*.24);
      if(Math.abs(drag.dy)<8)return;
      panel.setAttribute('data-dragging','true');
      panel.style.setProperty('--ds-drag',drag.dy+'px');
      if(e.cancelable)e.preventDefault();
    }
    function onPanelEnd(){
      var close=drag&&drag.dy<-54;
      panel.removeAttribute('data-dragging');
      panel.style.removeProperty('--ds-drag');
      drag=null;
      if(close)openMenu(false,false);
    }
    function onPanelClick(e){
      if(e.target.closest('a[href]'))openMenu(false,false);
    }
    function onResize(){
      if(!mobile.matches)openMenu(false,false);
      else if(opened)openMenu(true,false);
      setHidden(false);topY=Math.max(0,window.pageYOffset||0);
    }
    header.setAttribute('data-hidden','false');
    header.setAttribute('data-open','false');
    panel.inert=mobile.matches;
    button.addEventListener('click',onToggle);
    backdrop&&backdrop.addEventListener('click',function(){openMenu(false,false)});
    panel.addEventListener('click',onPanelClick);
    panel.addEventListener('touchstart',onPanelStart,{passive:true});
    panel.addEventListener('touchmove',onPanelMove,{passive:false});
    panel.addEventListener('touchend',onPanelEnd,{passive:true});
    panel.addEventListener('touchcancel',onPanelEnd,{passive:true});
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('touchstart',onTouchStart,{passive:true});
    window.addEventListener('touchmove',onTouchMove,{passive:true});
    window.addEventListener('touchend',onTouchEnd,{passive:true});
    window.addEventListener('touchcancel',onTouchEnd,{passive:true});
    window.addEventListener('resize',onResize,{passive:true});
    document.addEventListener('pointerdown',onOutside);
    document.addEventListener('keydown',onKeyboard);
    function onVisibility(){if(document.visibilityState==='visible'){topY=Math.max(0,window.pageYOffset||0);setHidden(false);}}
    document.addEventListener('visibilitychange',onVisibility);
    return function(){
      if(raf)window.cancelAnimationFrame(raf);
      button.removeEventListener('click',onToggle);
      panel.removeEventListener('click',onPanelClick);
      panel.removeEventListener('touchstart',onPanelStart);
      panel.removeEventListener('touchmove',onPanelMove);
      panel.removeEventListener('touchend',onPanelEnd);
      panel.removeEventListener('touchcancel',onPanelEnd);
      window.removeEventListener('scroll',onScroll);
      window.removeEventListener('touchstart',onTouchStart);
      window.removeEventListener('touchmove',onTouchMove);
      window.removeEventListener('touchend',onTouchEnd);
      window.removeEventListener('touchcancel',onTouchEnd);
      window.removeEventListener('resize',onResize);
      document.removeEventListener('pointerdown',onOutside);
      document.removeEventListener('keydown',onKeyboard);
      document.removeEventListener('visibilitychange',onVisibility);
      panel.inert=false;
    };
  }
  function mount(){
    var target=document.querySelector('.ds-shell-nav');
    if(target===current)return;
    if(dispose){dispose();dispose=null;}
    current=target;
    if(target)dispose=bind(target);
  }
  function start(){
    mount();
    observer=new MutationObserver(function(){mount();});
    observer.observe(document.documentElement,{childList:true,subtree:false});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
