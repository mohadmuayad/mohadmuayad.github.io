/* Dark Signal — standalone site navigation controller v1.
   No dependency on legacy header selectors, animation stacks or :has(). */
(function(){
  'use strict';
  var current=null,dispose=null,observer=null;
  var mobile=window.matchMedia('(max-width:760px)');
  function bind(header){
    var button=header.querySelector('[data-ds-nav-toggle]');
    var panel=header.querySelector('[data-ds-nav-panel]');
    var grip=header.querySelector('[data-ds-nav-grip]');
    if(!button||!panel)return function(){};
    var opened=false,drag=null,topY=Math.max(0,window.pageYOffset||0);
    var direction=0,anchorY=topY,raf=0,hidden=false,lastChange=0;
    var lastViewportWidth=window.innerWidth;
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
      var links=panel.querySelectorAll('a[href]');
      // On Safari, an overflow-hidden element at height:0 can report a
      // misleading scrollHeight. Measure its children and keep a safe floor.
      var intrinsic=0;
      for(var i=0;i<links.length;i++){
        var node=links[i];
        var rect=node.getBoundingClientRect();
        intrinsic+=Math.max(45,Math.ceil(rect.height||node.offsetHeight||0));
      }
      intrinsic+=Math.max(0,links.length-1)*2+31+(grip?42:0);
      return Math.min(Math.max(80,intrinsic),space);
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
    function decide(y){
      // The document's actual scroll position is the only motion input.
      // iOS overscroll and finger tremors must not compete with touchmove.
      if(opened||y<105){
        direction=0;anchorY=y;setHidden(false);return;
      }
      var delta=y-topY;
      if(Math.abs(delta)<3)return;
      var next=delta>0?1:-1;
      if(next!==direction){direction=next;anchorY=topY;}
      // Directional hysteresis + a short settling window prevent jitter
      // when an iPhone's rubber-band scrolling changes direction briefly.
      var threshold=next>0?62:36;
      if(Math.abs(y-anchorY)<threshold)return;
      var now=Date.now();
      if(now-lastChange<260)return;
      var shouldHide=next>0&&y>170;
      if(shouldHide!==hidden){
        setHidden(shouldHide);
        lastChange=now;
      }
      anchorY=y;
    }
    function runScroll(){
      raf=0;
      var y=Math.max(0,window.pageYOffset||document.documentElement.scrollTop||0);
      decide(y);topY=y;
    }
    function onScroll(){if(!raf)raf=window.requestAnimationFrame(runScroll);}
    function onToggle(){openMenu(!opened,false);}
    function onOutside(e){
      if(opened&&!header.contains(e.target))openMenu(false,false);
    }
    function onKeyboard(e){if(e.key==='Escape'&&opened)openMenu(false,true);}
    function onGripStart(e){
      if(!opened||e.touches.length!==1)return;
      var t=e.touches[0];
      drag={x:t.clientX,y:t.clientY,dy:0,tracking:false,base:sheetHeight()};
    }
    function onGripMove(e){
      if(!drag||!opened||e.touches.length!==1)return;
      var t=e.touches[0];
      var dx=t.clientX-drag.x,dy=t.clientY-drag.y;
      if(!drag.tracking){
        if(Math.abs(dy)<8||Math.abs(dx)>Math.abs(dy)*.75)return;
        drag.tracking=true;
      }
      drag.dy=dy;
      var amount=dy<0?dy:Math.min(22,dy*.16);
      var height=Math.max(78,drag.base+amount);
      panel.setAttribute('data-dragging','true');
      panel.style.setProperty('--ds-drag-height',height+'px');
      if(e.cancelable)e.preventDefault();
    }
    function onGripEnd(cancelled){
      if(!drag)return;
      var close=!cancelled&&drag.tracking&&drag.dy<=-Math.max(125,drag.base*.43);
      // Let the sheet return from the live height using its CSS transition;
      // never abruptly move the entire panel by a translate transform.
      if(close)openMenu(false,false);
      else resetGesture();
    }
    function onGripClick(e){
      // A tap on the grip is only a cue, not an accidental dismissal.
      if(drag&&drag.tracking)e.preventDefault();
    }
    function onPanelClick(e){
      if(e.target.closest('a[href]'))openMenu(false,false);
    }
    function onResize(){
      // Safari changes viewport HEIGHT when its address bar retracts.
      // Never flip the header on height-only changes.
      var widthChanged=Math.abs(window.innerWidth-lastViewportWidth)>2;
      lastViewportWidth=window.innerWidth;
      if(!mobile.matches)openMenu(false,false);
      else if(opened)panel.style.setProperty('--ds-sheet-height',sheetHeight()+'px');
      if(widthChanged){
        setHidden(false);
        topY=Math.max(0,window.pageYOffset||0);
        anchorY=topY;direction=0;
      }
    }
    header.setAttribute('data-hidden','false');
    header.setAttribute('data-open','false');
    panel.inert=mobile.matches;
    button.addEventListener('click',onToggle);
    // No full-screen touch-blocking backdrop: outside pointerdown handles dismiss.
    panel.addEventListener('click',onPanelClick);
    function onGripTouchEnd(){onGripEnd(false);}
    function onGripTouchCancel(){onGripEnd(true);}
    grip?.addEventListener('touchstart',onGripStart,{passive:true});
    grip?.addEventListener('touchmove',onGripMove,{passive:false});
    grip?.addEventListener('touchend',onGripTouchEnd,{passive:true});
    grip?.addEventListener('touchcancel',onGripTouchCancel,{passive:true});
    grip?.addEventListener('click',onGripClick);
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onResize,{passive:true});
    document.addEventListener('pointerdown',onOutside);
    document.addEventListener('keydown',onKeyboard);
    function onVisibility(){if(document.visibilityState==='visible'){topY=Math.max(0,window.pageYOffset||0);setHidden(false);}}
    document.addEventListener('visibilitychange',onVisibility);
    return function(){
      if(raf)window.cancelAnimationFrame(raf);
      button.removeEventListener('click',onToggle);
      panel.removeEventListener('click',onPanelClick);
      grip?.removeEventListener('touchstart',onGripStart);
      grip?.removeEventListener('touchmove',onGripMove);
      grip?.removeEventListener('touchend',onGripTouchEnd);
      grip?.removeEventListener('touchcancel',onGripTouchCancel);
      grip?.removeEventListener('click',onGripClick);
      window.removeEventListener('scroll',onScroll);
      window.removeEventListener('resize',onResize);
      document.removeEventListener('pointerdown',onOutside);
      document.removeEventListener('keydown',onKeyboard);
      document.removeEventListener('visibilitychange',onVisibility);
      panel.inert=false;
    };
  }

  // Desktop mechanical-wheel motion: short, bounded inertial easing.
  // Touchpads, nested panes, keyboard navigation and mobile remain native.
  function installDesktopWheelPolish(){
    var desktop=window.matchMedia('(min-width:761px) and (pointer:fine)');
    var reduce=window.matchMedia('(prefers-reduced-motion:reduce)');
    var root=document.documentElement;
    var frame=0,goal=0,lastTime=0,active=false,previousInline='';
    var lastDirection=0,expected=0;
    function clamp(value,low,high){return Math.max(low,Math.min(high,value));}
    function actualY(){return Math.max(0,window.pageYOffset||root.scrollTop||0);}
    function finish(){
      if(frame)window.cancelAnimationFrame(frame);
      frame=0;lastDirection=0;
      if(active){
        root.style.scrollBehavior=previousInline;
        active=false;
      }
    }
    function nestedScrollable(target){
      var node=target&&target.nodeType===1?target:target?.parentElement;
      while(node&&node!==document.body&&node!==root){
        var style=window.getComputedStyle(node);
        if(/auto|scroll/.test(style.overflowY)&&node.scrollHeight>node.clientHeight+2)return true;
        node=node.parentElement;
      }
      return false;
    }
    function step(now){
      frame=0;
      if(!active)return;
      var current=actualY();
      // Abort if another controller (anchor links, manual scrollbar) has
      // moved the page independently since our last animation frame.
      if(Math.abs(current-expected)>7){finish();return;}
      var elapsed=clamp((now-lastTime)||16,4,48);
      lastTime=now;
      var difference=goal-current;
      if(Math.abs(difference)<.7){
        window.scrollTo(0,goal);
        finish();
        return;
      }
      // Time-correct smoothing: ~150 ms settling constant on 60/120 Hz.
      var ratio=1-Math.exp(-elapsed/150);
      var next=current+difference*ratio;
      expected=next;
      window.scrollTo(0,next);
      frame=window.requestAnimationFrame(step);
    }
    function wheel(event){
      if(!desktop.matches||reduce.matches||!event.cancelable||event.defaultPrevented||
        event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||
        Math.abs(event.deltaX)>Math.abs(event.deltaY)*.6||
        document.querySelector('.ds-shell-nav[data-open="true"]')||
        nestedScrollable(event.target))return;
      var delta=event.deltaY;
      if(!delta)return;
      // Intercept only identifiable, discrete mouse-wheel ticks.
      // Fine pixel movement and fractional events belong to the trackpad.
      var discrete=event.deltaMode===1||
        (event.deltaMode===0&&Math.abs(delta)>=90&&
          Math.abs(delta-Math.round(delta/20)*20)<.7);
      if(!discrete)return;
      var limit=Math.max(0,root.scrollHeight-window.innerHeight);
      if(!limit)return;
      var current=actualY();
      var sign=delta>0?1:-1;
      var amount=event.deltaMode===1?delta*26:delta;
      amount=clamp(amount,-240,240);
      // Crucial: reset pending momentum on direction reversal.
      // Without this, the page continues in the old direction after a turn.
      if(active&&sign!==lastDirection)goal=current;
      else if(!active)goal=current;
      var nextGoal=clamp(goal+amount,0,limit);
      if(Math.abs(nextGoal-current)<.5)return;
      event.preventDefault();
      goal=nextGoal;
      lastDirection=sign;
      if(!active){
        previousInline=root.style.scrollBehavior;
        root.style.scrollBehavior='auto';
        active=true;
        expected=current;
        lastTime=window.performance.now();
      }
      if(!frame)frame=window.requestAnimationFrame(step);
    }
    window.addEventListener('wheel',wheel,{passive:false});
    ['pointerdown','touchstart','keydown'].forEach(function(type){
      window.addEventListener(type,finish,{passive:true});
    });
    document.addEventListener('visibilitychange',function(){
      if(document.hidden)finish();
    });
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
    installDesktopWheelPolish();
    observer=new MutationObserver(function(){mount();});
    observer.observe(document.documentElement,{childList:true,subtree:false});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
