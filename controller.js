// ============================================================
// controller.js — Barcha input
// ============================================================
window.Controller = (function(){
  'use strict';

  var keys = {};
  var mouse = { x: 0, y: 0, down: false, rightDown: false };
  var touch = {
    moveX: 0, moveY: 0,
    aimX: 0, aimY: 0,
    firing: false,
    pushing: false,
    reloadRequested: false,
    interactRequested: false
  };

  var moveJoy = { active: false, id: null, cx: 0, cy: 0 };
  var fireJoy = { active: false, id: null, cx: 0, cy: 0 };
  var JOY_MAX = 55;
  var FIRE_DEADZONE = 0.25;

  // Mouse bosib turish (AID uchun)
  var mouseHold = { active: false, startTime: 0, itemKey: null };

  function isMobile(){
    return ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           window.matchMedia('(pointer: coarse)').matches;
  }

  function init(){
    setupKeyboard();
    setupMouse();
    setupButtons();
    if(isMobile()) setupTouchJoysticks();

    setTimeout(function(){
      try{ window.focus(); }catch(e){}
      var c = document.getElementById('gameCanvas');
      if(c){
        c.setAttribute('tabindex', '0');
        try{ c.focus(); }catch(e){}
      }
      document.body.setAttribute('tabindex', '0');
      try{ document.body.focus(); }catch(e){}
    }, 100);

    console.log('[Controller] Initialized');
  }

  // ============================================================
  // KEYBOARD — Esc fix
  // ============================================================
  function setupKeyboard(){
    function keyDownHandler(e){
      var k = e.key ? e.key.toLowerCase() : '';
      if(!k) return;

      keys[k] = true;

      if([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) !== -1){
        e.preventDefault();
      }

      // === ESC — Pause (har doim ishlaydi) ===
      if(k === 'escape'){
        e.preventDefault();
        e.stopPropagation();
        if(window.Game && window.Game.togglePause){
          window.Game.togglePause();
        }
        return false;
      }

      var g = window.__game;
      if(g && g.paused) return;

      if(k === 'q' && !e.repeat){
        if(window.Game && window.Game.cycleWeapon) window.Game.cycleWeapon();
      }
      if(k === 'e' && !e.repeat){
        // E — yordam chaqirish YOKI pickup olish
        if(window.Game && window.Game.interactKey) window.Game.interactKey();
      }
      if(k === 'r' && !e.repeat){
        if(g && g.over){
          if(window.Game && window.Game.restart) window.Game.restart();
        } else {
          if(window.Game && window.Game.reloadCurrent) window.Game.reloadCurrent();
        }
      }
      if((k === '1' || k === '2' || k === '3' || k === '4' || k === '5') && !e.repeat){
        if(window.Game && window.Game.selectSlot) window.Game.selectSlot(parseInt(k, 10));
      }
      // Alt+A va Shift+A OLIB TASHLANDI (foydalanuvchi so'radi)
    }

    function keyUpHandler(e){
      var k = e.key ? e.key.toLowerCase() : '';
      if(k) keys[k] = false;
    }

    window.addEventListener('keydown', keyDownHandler, true);
    document.addEventListener('keydown', keyDownHandler, true);
    window.addEventListener('keyup', keyUpHandler, true);
    document.addEventListener('keyup', keyUpHandler, true);

    window.addEventListener('blur', function(){
      keys = {};
      mouse.down = false;
      mouse.rightDown = false;
    });
  }

  // ============================================================
  // MOUSE — bosib turish (AID uchun)
  // ============================================================
  function setupMouse(){
    var canvas = document.getElementById('gameCanvas');
    if(!canvas) return;

    canvas.addEventListener('mousemove', function(e){
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });

    canvas.addEventListener('mousedown', function(e){
      if(e.button === 0){
        mouse.down = true;
        if(window.SFX) window.SFX.ensureAudio();
        // AID uchun bosib turish boshlanadi
        if(window.Game && window.Game.startHold) window.Game.startHold();
      }
      if(e.button === 2){
        mouse.rightDown = true;
        if(window.SFX) window.SFX.ensureAudio();
      }
    });

    window.addEventListener('mouseup', function(e){
      if(e.button === 0){
        mouse.down = false;
        if(window.Game && window.Game.stopHold) window.Game.stopHold();
      }
      if(e.button === 2) mouse.rightDown = false;
    });

    canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });
  }

  // ============================================================
  // BUTTONS
  // ============================================================
  function setupButtons(){
    var callBtn = document.getElementById('callBtn');
    if(callBtn){
      callBtn.addEventListener('click', function(){
        if(window.SFX) window.SFX.ensureAudio();
        if(window.Game && window.Game.callHelicopter) window.Game.callHelicopter();
      });
    }

    var restartBtn = document.getElementById('restartBtn');
    if(restartBtn){
      restartBtn.addEventListener('click', function(){
        if(window.SFX) window.SFX.ensureAudio();
        if(window.Game && window.Game.restart) window.Game.restart();
      });
    }

    var mPauseBtn = document.getElementById('mPauseBtn');
    if(mPauseBtn){
      mPauseBtn.addEventListener('click', function(e){
        e.preventDefault();
        if(window.Game && window.Game.togglePause) window.Game.togglePause();
      });
    }

    var mCallBtn = document.getElementById('mCallBtn');
    if(mCallBtn){
      mCallBtn.addEventListener('click', function(e){
        e.preventDefault();
        if(window.SFX) window.SFX.ensureAudio();
        if(window.Game && window.Game.callHelicopter) window.Game.callHelicopter();
      });
    }

    var mReloadBtn = document.getElementById('mReloadBtn');
    if(mReloadBtn){
      mReloadBtn.addEventListener('click', function(e){
        e.preventDefault();
        touch.reloadRequested = true;
        if(window.SFX) window.SFX.ensureAudio();
      });
    }

    var mPushBtn = document.getElementById('mPushBtn');
    if(mPushBtn){
      mPushBtn.addEventListener('touchstart', function(e){
        e.preventDefault();
        touch.pushing = true;
      }, { passive: false });
      mPushBtn.addEventListener('touchend', function(e){
        e.preventDefault();
        touch.pushing = false;
      }, { passive: false });
    }

    // Interact button (mobile uchun)
    var mInteractBtn = document.getElementById('mInteractBtn');
    if(mInteractBtn){
      mInteractBtn.addEventListener('click', function(e){
        e.preventDefault();
        touch.interactRequested = true;
      });
    }

    var mslots = document.querySelectorAll('.m-slot');
    for(var i = 0; i < mslots.length; i++){
      (function(btn){
        btn.addEventListener('click', function(e){
          e.preventDefault();
          var slot = parseInt(btn.getAttribute('data-slot'), 10);
          if(window.Game && window.Game.selectSlot) window.Game.selectSlot(slot);
          if(window.SFX) window.SFX.ensureAudio();
        });
      })(mslots[i]);
    }
  }

  // ============================================================
  // TOUCH JOYSTICKS
  // ============================================================
  function setupTouchJoysticks(){
    var moveZone = document.getElementById('mMoveZone');
    var fireZone = document.getElementById('mFireZone');
    var moveJoyEl = document.getElementById('mMoveJoy');
    var fireJoyEl = document.getElementById('mFireJoy');
    var moveKnob = document.getElementById('mMoveKnob');
    var fireKnob = document.getElementById('mFireKnob');

    if(!moveZone || !fireZone) return;

    moveZone.addEventListener('touchstart', function(e){
      e.preventDefault();
      if(moveJoy.active) return;
      var t = e.changedTouches[0];
      moveJoy.active = true;
      moveJoy.id = t.identifier;
      var r = moveJoyEl.getBoundingClientRect();
      moveJoy.cx = r.left + r.width / 2;
      moveJoy.cy = r.top + r.height / 2;
      updateMoveJoy(t.clientX, t.clientY, moveKnob);
    }, { passive: false });

    fireZone.addEventListener('touchstart', function(e){
      e.preventDefault();
      if(fireJoy.active) return;
      var t = e.changedTouches[0];
      fireJoy.active = true;
      fireJoy.id = t.identifier;
      var r = fireJoyEl.getBoundingClientRect();
      fireJoy.cx = r.left + r.width / 2;
      fireJoy.cy = r.top + r.height / 2;
      updateFireJoy(t.clientX, t.clientY, fireKnob);
    }, { passive: false });

    window.addEventListener('touchmove', function(e){
      for(var i = 0; i < e.changedTouches.length; i++){
        var t = e.changedTouches[i];
        if(moveJoy.active && t.identifier === moveJoy.id){
          updateMoveJoy(t.clientX, t.clientY, moveKnob);
          e.preventDefault();
        }
        if(fireJoy.active && t.identifier === fireJoy.id){
          updateFireJoy(t.clientX, t.clientY, fireKnob);
          e.preventDefault();
        }
      }
    }, { passive: false });

    function handleEnd(e){
      for(var i = 0; i < e.changedTouches.length; i++){
        var t = e.changedTouches[i];
        if(moveJoy.active && t.identifier === moveJoy.id){
          moveJoy.active = false;
          moveJoy.id = null;
          touch.moveX = 0;
          touch.moveY = 0;
          if(moveKnob) moveKnob.style.transform = 'translate(-50%, -50%)';
        }
        if(fireJoy.active && t.identifier === fireJoy.id){
          fireJoy.active = false;
          fireJoy.id = null;
          touch.aimX = 0;
          touch.aimY = 0;
          touch.firing = false;
          if(fireKnob) fireKnob.style.transform = 'translate(-50%, -50%)';
        }
      }
    }

    window.addEventListener('touchend', handleEnd, { passive: false });
    window.addEventListener('touchcancel', handleEnd, { passive: false });
  }

  function updateMoveJoy(clientX, clientY, knobEl){
    var dx = clientX - moveJoy.cx;
    var dy = clientY - moveJoy.cy;
    var len = Math.hypot(dx, dy);
    if(len > JOY_MAX){
      dx = dx / len * JOY_MAX;
      dy = dy / len * JOY_MAX;
    }
    if(knobEl) knobEl.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    touch.moveX = dx / JOY_MAX;
    touch.moveY = dy / JOY_MAX;
  }

  function updateFireJoy(clientX, clientY, knobEl){
    var dx = clientX - fireJoy.cx;
    var dy = clientY - fireJoy.cy;
    var len = Math.hypot(dx, dy);
    if(len > JOY_MAX){
      dx = dx / len * JOY_MAX;
      dy = dy / len * JOY_MAX;
    }
    if(knobEl) knobEl.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';

    var ratio = Math.hypot(dx, dy) / JOY_MAX;
    if(ratio > FIRE_DEADZONE){
      touch.aimX = dx / JOY_MAX;
      touch.aimY = dy / JOY_MAX;
      touch.firing = true;
    } else {
      touch.aimX = 0;
      touch.aimY = 0;
      touch.firing = false;
    }
  }

  // ============================================================
  // READ INPUT
  // ============================================================
  function readInput(game){
    if(!game || !game.player){
      return {
        moveX: 0, moveY: 0,
        aimX: 0, aimY: 0, hasAim: false,
        firing: false, pushing: false, reload: false,
        interact: false,
        autoMode: false, keys: keys, isMobile: isMobile()
      };
    }
    var p = game.player;
    var mobile = isMobile();

    var mx = 0, my = 0;
    if(mobile && (Math.abs(touch.moveX) > 0.01 || Math.abs(touch.moveY) > 0.01)){
      mx = touch.moveX;
      my = touch.moveY;
    } else {
      if(keys['w'] || keys['arrowup']) my -= 1;
      if(keys['s'] || keys['arrowdown']) my += 1;
      if(keys['a'] || keys['arrowleft']) mx -= 1;
      if(keys['d'] || keys['arrowright']) mx += 1;
    }

    var hasAim = false;
    var aimX = 0, aimY = 0;

    if(mobile && (Math.abs(touch.aimX) > 0.05 || Math.abs(touch.aimY) > 0.05)){
      aimX = touch.aimX;
      aimY = touch.aimY;
      hasAim = true;
    } else if(!mobile){
      var worldMouseX = mouse.x + game.camera.x;
      var worldMouseY = mouse.y + game.camera.y;
      aimX = worldMouseX - p.x;
      aimY = worldMouseY - p.y;
      hasAim = true;
    }

    var firing = false;
    if(mobile) firing = touch.firing;
    else firing = mouse.down || keys[' '];

    var pushing = false;
    if(mobile) pushing = touch.pushing;
    else pushing = mouse.rightDown;

    var reload = false;
    if(touch.reloadRequested){
      reload = true;
      touch.reloadRequested = false;
    }

    var interact = false;
    if(touch.interactRequested){
      interact = true;
      touch.interactRequested = false;
    }

    return {
      moveX: mx, moveY: my,
      aimX: aimX, aimY: aimY, hasAim: hasAim,
      firing: firing,
      pushing: pushing,
      reload: reload,
      interact: interact,
      mouseHold: mouseHold,
      autoMode: game.autoMode,
      keys: keys,
      isMobile: mobile
    };
  }

  return {
    init: init,
    readInput: readInput,
    isMobile: isMobile,
    getKeys: function(){ return keys; },
    getMouse: function(){ return mouse; },
    getMouseHold: function(){ return mouseHold; }
  };
})();