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
    function sheetHeight(){
      // All links remain in the DOM while closed, so scrollHeight measures
      // their natural height without flashing them on screen.
      var viewport=window.innerHeight||document.documentElement.clientHeight||700;
      var space=Math.max(110,viewport-82);
      var intrinsic=panel.scrollHeight;
      return Math.min(Math.max(0,intrinsic),space);
    }
    function resetGesture(){
      drag=null;
      panel.removeAttribute('data-dragging');
      panel.style.removeProperty('--ds-drag-height');
    }
    function openMenu(state,focus){
      if(!mobile.matches)state=false;
      resetGesture();
      if(state){
        // Assign the final measured height while still closed. CSS animates
        // height from 0 to this value using the same curve as closing.
        panel.style.setProperty('--ds-sheet-height',sheetHeight()+'px');
      }
      opened=state;
      header.setAttribute('data-open',state?'true':'false');
      button.setAttribute('aria-expanded',state?'true':'false');
      button.setAttribute('aria-label',state?'Close navigation':'Open navigation');
      panel.inert=!state&&mobile.matches;
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
      var t=e.touches[0];
      drag={x:t.clientX,y:t.clientY,dy:0,tracking:false,base:sheetHeight()};
    }
    function onPanelMove(e){
      if(!drag||!opened||e.touches.length!==1)return;
      var t=e.touches[0];
      var dx=t.clientX-drag.x,dy=t.clientY-drag.y;
      if(!drag.tracking){
        // A scrollable menu should scroll normally. We only capture a clear
        // vertical gesture begun when the menu is already at its top.
        if(panel.scrollTop>1||Math.abs(dx)>Math.abs(dy)*.68)return;
        if(Math.abs(dy)<13)return;
        drag.tracking=true;
      }
      drag.dy=dy;
      var height=dy<0?Math.max(65,drag.base+dy):drag.base+Math.min(28,dy*.18);
      panel.setAttribute('data-dragging','true');
      panel.style.setProperty('--ds-drag-height',height+'px');
      if(e.cancelable)e.preventDefault();
    }
    function onPanelEnd(cancelled){
      if(!drag)return;
      var close=!cancelled&&drag.tracking&&drag.dy<0&&
        -drag.dy>=Math.max(110,Math.min(165,drag.base*.48));
      // Resetting the height target does not reset a transform: the browser
      // interpolates from the actual finger-controlled height to the target.
      if(close){
        openMenu(false,false);
      }else{
        resetGesture();
      }
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
    function onPanelTouchEnd(){onPanelEnd(false);}
    function onPanelTouchCancel(){onPanelEnd(true);}
    panel.addEventListener('touchend',onPanelTouchEnd,{passive:true});
    panel.addEventListener('touchcancel',onPanelTouchCancel,{passive:true});
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
      panel.removeEventListener('touchend',onPanelTouchEnd);
      panel.removeEventListener('touchcancel',onPanelTouchCancel);
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
