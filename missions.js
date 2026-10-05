// ============================================================
// missions.js — Tab hold objectives
// Let For Dead
// ============================================================
window.Missions = (function(){
  'use strict';

  var overlayEl = null;
  var isVisible = false;
  var tabHeld = false;

  // ============================================================
  // OVERLAY
  // ============================================================
  function getOverlay(){
    if(!overlayEl) overlayEl = document.getElementById('objectivesOverlay');
    return overlayEl;
  }

  function show(game){
    var el = getOverlay();
    if(!el) return;
    updateContent(game);
    el.classList.add('show');
    isVisible = true;
  }

  function hide(){
    var el = getOverlay();
    if(el) el.classList.remove('show');
    isVisible = false;
  }

  // ============================================================
  // CONTENT
  // ============================================================
  function updateContent(game){
    if(!game) return;

    var list = document.getElementById('objectivesList');
    if(!list) return;

    var objectives = getCurrentObjectives(game);
    var html = '';

    for(var i = 0; i < objectives.length; i++){
      var o = objectives[i];
      var icon = o.done ? '✓' : '○';
      html +=
        '<div class="objective-item' + (o.done ? ' done' : '') + '">' +
          '<span class="objective-check">' + icon + '</span>' +
          '<span class="objective-text">' + o.text + '</span>' +
        '</div>';
    }
    list.innerHTML = html;

    // Stats
    var sc = document.getElementById('objScore');
    if(sc) sc.textContent = game.score;

    var kl = document.getElementById('objKills');
    if(kl) kl.textContent = game.kills;

    var al = document.getElementById('objAlive');
    if(al) al.textContent = game.zombies.length;

    var tm = document.getElementById('objTime');
    if(tm){
      var sec = Math.floor(game.elapsed);
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      tm.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    }
  }

  function getCurrentObjectives(game){
    var list = [];
    list.push({ text: 'Find the radio', done: game.hasRadio });
    list.push({ text: 'Call the transport', done: game.heli.state !== 'none' });
    list.push({ text: 'Survive the horde', done: game.heli.state === 'arrived' || game.heli.state === 'boarding' || game.heli.state === 'leaving' });
    list.push({ text: 'Kill the Tank', done: game.tank.killed || (!game.tank.alive && game.tank.spawned) });
    list.push({ text: 'Evacuate', done: game.player.evacuated || game.won });
    return list;
  }

  // ============================================================
  // TAB — HOLD
  // ============================================================
  function setupTab(){
    window.addEventListener('keydown', function(e){
      if(e.key !== 'Tab') return;
      e.preventDefault();

      if(tabHeld) return;   // allaqachon bosilgan
      tabHeld = true;

      var game = window.__game;
      if(game && game.running && !game.paused){
        show(game);
      }
    });

    window.addEventListener('keyup', function(e){
      if(e.key !== 'Tab') return;
      e.preventDefault();
      tabHeld = false;
      hide();
    });

    // Window focus yo'qolganda yopish
    window.addEventListener('blur', function(){
      tabHeld = false;
      hide();
    });
  }

  // ============================================================
  // UPDATE (game loop dan)
  // ============================================================
  function update(game){
    if(isVisible && game){
      updateContent(game);
    }
  }

  // ============================================================
  // INIT
  // ============================================================
  function init(){
    setupTab();
    console.log('[Missions] Ready — hold Tab to view');
  }

  return {
    init: init,
    show: show,
    hide: hide,
    update: update,
    isVisible: function(){ return isVisible; }
  };
})();