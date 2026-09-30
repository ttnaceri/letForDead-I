// ============================================================
// touch.js — Telefon/Tablet uchun touch boshqaruv
// Desktop'da bu fayl hech narsa qilmaydi
// ============================================================
window.Touch = (function(){
  'use strict';

  var isTouch = false;
  var moveJoy = { active: false, id: null, cx: 0, cy: 0, dx: 0, dy: 0 };
  var fireJoy = { active: false, id: null, cx: 0, cy: 0, dx: 0, dy: 0 };

  var MOVE_MAX = 55;
  var FIRE_MAX = 55;
  var FIRE_DEADZONE = 0.25;      // knob 25% dan ko'p harakatlansa — otish

  // ============================================================
  // ANIQLASH
  // ============================================================
  function detect(){
    isTouch = ('ontouchstart' in window) ||
              (navigator.maxTouchPoints > 0) ||
              window.matchMedia('(pointer: coarse)').matches;
    return isTouch;
  }

  function isMobile(){
    return window.matchMedia('(pointer: coarse)').matches ||
           window.innerWidth <= 900;
  }

  // ============================================================
  // INPUT HOLATI — game.js o'qiydi
  // ============================================================
  var state = {
    // Harakat vektori (-1..1)
    moveX: 0,
    moveY: 0,
    // Aim vektori (-1..1)
    aimX: 0,
    aimY: 0,
    // Otish aktivmi
    firing: false,
    // Push
    pushing: false,
    // Reload signal (bir marta)
    reloadRequested: false
  };

  // ============================================================
  // JOYSTICK HELPERS
  // ============================================================
  function getCenter(el){
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  }

  function clampKnob(dx, dy, max){
    var len = Math.hypot(dx, dy);
    if(len > max){
      dx = dx / len * max;
      dy = dy / len * max;
    }
    return { dx: dx, dy: dy };
  }

  function moveKnobEl(knobEl, dx, dy){
    knobEl.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
  }

  function resetKnob(knobEl){
    knobEl.style.transform = 'translate(-50%, -50%)';
  }

  // ============================================================
  // MOVE JOYSTICK
  // ============================================================
  function initMoveJoy(){
    var zone = document.getElementById('mMoveZone');
    var joy = document.getElementById('mMoveJoy');
    var knob = document.getElementById('mMoveKnob');
    if(!zone || !joy || !knob) return;

    zone.addEventListener('touchstart', function(e){
      e.preventDefault();
      var t = e.changedTouches[0];
      if(moveJoy.active) return;
      moveJoy.active = true;
      moveJoy.id = t.identifier;
      var c = getCenter(joy);
      moveJoy.cx = c.x;
      moveJoy.cy = c.y;
      updateMove(t.clientX, t.clientY);
      joy.style.opacity = '1';
    }, { passive: false });

    window.addEventListener('touchmove', function(e){
      if(!moveJoy.active) return;
      for(var i=0;i<e.changedTouches.length;i++){
        var t = e.changedTouches[i];
        if(t.identifier === moveJoy.id){
          updateMove(t.clientX, t.clientY);
          e.preventDefault();
          return;
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', function(e){
      if(!moveJoy.active) return;
      for(var i=0;i<e.changedTouches.length;i++){
        var t = e.changedTouches[i];
        if(t.identifier === moveJoy.id){
          moveJoy.active = false;
          moveJoy.id = null;
          moveJoy.dx = 0; moveJoy.dy = 0;
          state.moveX = 0; state.moveY = 0;
          resetKnob(knob);
          return;
        }
      }
    }, { passive: false });

    window.addEventListener('touchcancel', function(e){
      if(!moveJoy.active) return;
      for(var i=0;i<e.changedTouches.length;i++){
        var t = e.changedTouches[i];
        if(t.identifier === moveJoy.id){
          moveJoy.active = false;
          moveJoy.id = null;
          moveJoy.dx = 0; moveJoy.dy = 0;
          state.moveX = 0; state.moveY = 0;
          resetKnob(knob);
          return;
        }
      }
    }, { passive: false });
  }

  function updateMove(clientX, clientY){
    var dx = clientX - moveJoy.cx;
    var dy = clientY - moveJoy.cy;
    var c = clampKnob(dx, dy, MOVE_MAX);
    moveJoy.dx = c.dx; moveJoy.dy = c.dy;
    moveKnobEl(document.getElementById('mMoveKnob'), c.dx, c.dy);
    state.moveX = c.dx / MOVE_MAX;
    state.moveY = c.dy / MOVE_MAX;
  }

  // ============================================================
  // FIRE / AIM JOYSTICK
  // ============================================================
  function initFireJoy(){
    var zone = document.getElementById('mFireZone');
    var joy = document.getElementById('mFireJoy');
    var knob = document.getElementById('mFireKnob');
    if(!zone || !joy || !knob) return;

    zone.addEventListener('touchstart', function(e){
      e.preventDefault();
      var t = e.changedTouches[0];
      if(fireJoy.active) return;
      fireJoy.active = true;
      fireJoy.id = t.identifier;
      var c = getCenter(joy);
      fireJoy.cx = c.x;
      fireJoy.cy = c.y;
      updateFire(t.clientX, t.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', function(e){
      if(!fireJoy.active) return;
      for(var i=0;i<e.changedTouches.length;i++){
        var t = e.changedTouches[i];
        if(t.identifier === fireJoy.id){
          updateFire(t.clientX, t.clientY);
          e.preventDefault();
          return;
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', function(e){
      if(!fireJoy.active) return;
      for(var i=0;i<e.changedTouches.length;i++){
        var t = e.changedTouches[i];
        if(t.identifier === fireJoy.id){
          fireJoy.active = false;
          fireJoy.id = null;
          fireJoy.dx = 0; fireJoy.dy = 0;
          state.aimX = 0; state.aimY = 0;
          state.firing = false;
          resetKnob(knob);
          return;
        }
      }
    }, { passive: false });

    window.addEventListener('touchcancel', function(e){
      if(!fireJoy.active) return;
      for(var i=0;i<e.changedTouches.length;i++){
        var t = e.changedTouches[i];
        if(t.identifier === fireJoy.id){
          fireJoy.active = false;
          fireJoy.id = null;
          state.aimX = 0; state.aimY = 0;
          state.firing = false;
          resetKnob(knob);
          return;
        }
      }
    }, { passive: false });
  }

  function updateFire(clientX, clientY){
    var dx = clientX - fireJoy.cx;
    var dy = clientY - fireJoy.cy;
    var c = clampKnob(dx, dy, FIRE_MAX);
    fireJoy.dx = c.dx; fireJoy.dy = c.dy;
    moveKnobEl(document.getElementById('mFireKnob'), c.dx, c.dy);

    var len = Math.hypot(c.dx, c.dy) / FIRE_MAX;
    if(len > FIRE_DEADZONE){
      state.aimX = c.dx / MOVE_MAX;
      state.aimY = c.dy / MOVE_MAX;
      state.firing = true;
    } else {
      state.aimX = 0; state.aimY = 0;
      state.firing = false;
    }
  }

  // ============================================================
  // BUTTONS — Slotlar, Pause, Reload, Push, Call
  // ============================================================
  function initButtons(){
    // Pause
    var pauseBtn = document.getElementById('mPauseBtn');
    if(pauseBtn){
      pauseBtn.addEventListener('touchstart', function(e){
        e.preventDefault();
        if(window.Game && window.Game.togglePause) window.Game.togglePause();
      }, { passive: false });
    }

    // Slotlar
    var slots = document.querySelectorAll('.m-slot');
    for(var i=0;i<slots.length;i++){
      (function(btn){
        btn.addEventListener('touchstart', function(e){
          e.preventDefault();
          var slot = parseInt(btn.getAttribute('data-slot'), 10);
          if(window.Game && window.Game.selectSlot) window.Game.selectSlot(slot);
          window.SFX.ensureAudio();
        }, { passive: false });
      })(slots[i]);
    }

    // Reload
    var reloadBtn = document.getElementById('mReloadBtn');
    if(reloadBtn){
      reloadBtn.addEventListener('touchstart', function(e){
        e.preventDefault();
        state.reloadRequested = true;
        window.SFX.ensureAudio();
      }, { passive: false });
    }

    // Push
    var pushBtn = document.getElementById('mPushBtn');
    if(pushBtn){
      pushBtn.addEventListener('touchstart', function(e){
        e.preventDefault();
        state.pushing = true;
      }, { passive: false });
      pushBtn.addEventListener('touchend', function(e){
        e.preventDefault();
        state.pushing = false;
      }, { passive: false });
    }

    // Mobile call button
    var callBtn = document.getElementById('mCallBtn');
    if(callBtn){
      callBtn.addEventListener('touchstart', function(e){
        e.preventDefault();
        if(window.Game && window.Game.callHelicopter) window.Game.callHelicopter();
        window.SFX.ensureAudio();
      }, { passive: false });
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  function init(){
    if(!detect()) return false;
    if(!isMobile()) return false;

    initMoveJoy();
    initFireJoy();
    initButtons();

    // Oldini olish — sahifa skroll bo'lmasin
    document.addEventListener('touchmove', function(e){
      if(e.target === document.body || e.target === document.documentElement){
        e.preventDefault();
      }
    }, { passive: false });

    // Double-tap zoom oldini olish
    var lastTouch = 0;
    document.addEventListener('touchend', function(e){
      var now = Date.now();
      if(now - lastTouch < 300) e.preventDefault();
      lastTouch = now;
    }, { passive: false });

    return true;
  }

  function getState(){ return state; }
  function isActive(){ return isTouch && isMobile(); }
  function consumeReload(){ var r = state.reloadRequested; state.reloadRequested = false; return r; }

  return {
    init: init,
    getState: getState,
    isActive: isActive,
    consumeReload: consumeReload,
    detect: detect,
    isMobile: isMobile
  };
})();