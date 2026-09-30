// ============================================================
// help.js — Helikopter, Radio, Tank, Evakuatsiya
// Let For Dead
// ============================================================
window.Help = (function(){
  'use strict';

  var HELI_STATE = {
    NONE: 'none',
    CALLING: 'calling',
    INCOMING: 'incoming',
    ARRIVED: 'arrived',
    BOARDING: 'boarding',
    LEAVING: 'leaving',
    GONE: 'gone'
  };

  // ============================================================
  // ⏱️ VAQTLAR
  // ============================================================
  var HELI_ARRIVE_FRAMES = 10 * 60;   // 10 sekund (test)
  var CALLING_FRAMES = 60;             // 1 sekund
  var TANK_SPAWN_DELAY = 180;          // 3 sekund
  var BOARDING_DURATION = 90;          // 1.5 sekund
  var HORDE_SOUND_DELAY = 3000;        // 3 sekund (ms)
  var INTERACT_RANGE = 60;             // E bosish masofasi

  // ============================================================
  // RADIO
  // ============================================================
  function spawnRadio(game){
    var ang = Math.random() * Math.PI * 2;
    var dist = 900 + Math.random() * 700;
    game.radioPickup = {
      x: game.player.x + Math.cos(ang) * dist,
      y: game.player.y + Math.sin(ang) * dist,
      r: 18,
      bob: Math.random() * Math.PI * 2
    };
    console.log('[Radio] Spawned at', game.radioPickup.x.toFixed(0), game.radioPickup.y.toFixed(0));
  }

  function updateRadio(game, dt){
    if(!game.radioPickup || game.hasRadio) return;
    var rp = game.radioPickup;
    rp.bob += 0.08 * dt;
    // Radio endi E bilan olinadi (HUD showPrompt ko'rsatadi)
  }

  // ============================================================
  // RADIO OLISH — E bilan
  // ============================================================
  function tryPickupRadio(game){
    if(!game.radioPickup || game.hasRadio) return false;
    var p = game.player;
    var rp = game.radioPickup;
    var d = Math.hypot(rp.x - p.x, rp.y - p.y);
    if(d < INTERACT_RANGE){
      game.hasRadio = true;
      game.radioPickup = null;
      window.SFX.sfx.radioPickup();
      if(window.HUD) window.HUD.showBanner('Radio acquired — press E to call', '#c98a2e');
      var cb = document.getElementById('callBtn');
      if(cb) cb.classList.add('show');
      if(window.HUD) window.HUD.update(game);
      console.log('[Radio] Acquired!');
      return true;
    }
    return false;
  }

  // ============================================================
  // HELIKOPTER CHAQIRISH
  // ============================================================
  function callHelicopter(game){
    if(!game || !game.running) return;
    if(!game.hasRadio){
      console.log('[Heli] Radio yo\'q');
      return;
    }
    if(game.heli.state !== HELI_STATE.NONE){
      console.log('[Heli] Allaqachon chaqirilgan:', game.heli.state);
      return;
    }

    console.log('[Heli] CallHelicopter chaqirildi');

    game.heli.state = HELI_STATE.CALLING;
    game.heli.timer = CALLING_FRAMES;
    game.heli.hordeSoundPlayed = false;
    game.heli.hordeSoundTimer = 0;

    window.SFX.sfx.heliCall();
    window.SFX.sfx.horde();
    if(window.HUD) window.HUD.showBanner('Helicopter called — HORDE INCOMING!', '#e0523c');
    if(window.HUD) window.HUD.update(game);

    // Horde — o'rtacha kuchli
    game.hordeActive = true;
    game.hordeCount = 25;   // 40 dan 25 ga tushirildi (juda kuchli emas)
    var hordeEl = document.getElementById('horde-alert');
    if(hordeEl) hordeEl.classList.add('show');

    // Tank
    game.tank.spawnDelay = TANK_SPAWN_DELAY;
    game.tank.spawned = false;
    game.tank.killed = false;

    // aftercall.mp3
    if(window.Music && window.Music.play){
      window.Music.play('aftercall', { loop: false });
    }
  }

  // ============================================================
  // HELI UPDATE
  // ============================================================
  function updateHelicopter(game, dt){
    var h = game.heli;

    if(h.state === HELI_STATE.NONE || h.state === HELI_STATE.GONE) return;

    // === CALLING → INCOMING ===
    if(h.state === HELI_STATE.CALLING){
      h.timer -= dt;
      if(h.timer <= 0){
        h.state = HELI_STATE.INCOMING;
        h.timer = HELI_ARRIVE_FRAMES;
        h.tankWarned = false;

        var ang = Math.random() * Math.PI * 2;
        h.x = game.player.x + Math.cos(ang) * 800;
        h.y = game.player.y + Math.sin(ang) * 800;

        console.log('[Heli] CALLING → INCOMING! Frames:', HELI_ARRIVE_FRAMES,
                    '(' + (HELI_ARRIVE_FRAMES / 60).toFixed(1) + 's)');

        if(window.HUD) window.HUD.showBanner('Survive until help arrives', '#c98a2e');
        if(window.HUD) window.HUD.update(game);

        if(window.Music && window.Music.play){
          window.Music.play('beforehelp', { loop: false });
        }
      }
      return;
    }

    // === INCOMING ===
    if(h.state === HELI_STATE.INCOMING){
      h.timer -= dt;

      // 3 sekunddan keyin horde sound
      if(!h.hordeSoundPlayed){
        h.hordeSoundTimer = (h.hordeSoundTimer || 0) + dt;
        if(h.hordeSoundTimer >= 180){
          h.hordeSoundPlayed = true;
          if(window.SFX && window.SFX.hordeSound && window.SFX.hordeSound.play){
            console.log('[Horde] sounds/horde.mp3 playing');
            window.SFX.hordeSound.play();
          }
        }
      }

      var p = game.player;
      var dx = p.x - h.x;
      var dy = p.y - h.y;
      var d = Math.hypot(dx, dy) || 1;
      var arriveDist = 120;

      if(d > arriveDist){
        var remainFrames = Math.max(h.timer, 1);
        var distToGo = d - arriveDist;
        var perFrame = distToGo / remainFrames;
        h.x += (dx / d) * perFrame * dt;
        h.y += (dy / d) * perFrame * dt;
      }
      h.angle = Math.atan2(dy, dx);

      if(h.timer <= 0){
        h.state = HELI_STATE.ARRIVED;
        h.timer = 0;
        h.x = p.x + Math.cos(h.angle) * 60;
        h.y = p.y + Math.sin(h.angle) * 60;
        console.log('[Heli] ARRIVED!');
        if(window.HUD) window.HUD.showBanner('Helicopter arrived — get to it!', '#7ad44a');
        if(window.HUD) window.HUD.update(game);
        if(window.Music && window.Music.play){
          window.Music.play('arrivedhelp', { loop: false });
        }
      }
      return;
    }

    // === ARRIVED ===
    if(h.state === HELI_STATE.ARRIVED){
      var p2 = game.player;
      var d2 = Math.hypot(p2.x - h.x, p2.y - h.y);

      if(game.tank.alive && game.tank.alive.hp > 0){
        if(!h.tankWarned){
          h.tankWarned = true;
          if(window.HUD) window.HUD.showBanner("They're Coming!", '#ffffff');
        }
      } else if(d2 < h.pickupRadius){
        // === BOARDING ===
        h.state = HELI_STATE.BOARDING;
        h.timer = BOARDING_DURATION;
        console.log('[Heli] BOARDING!');

        if(window.HUD) window.HUD.showBanner('BOARDING...', '#7ad44a');
        if(window.HUD) window.HUD.update(game);

        // afterhelp.mp3
        if(window.Music && window.Music.play){
          window.Music.play('afterhelp', { loop: false });
        }

        // Zombilarni TO'XTATISH
        game.hordeActive = false;
        game.hordeCount = 0;
        var heliEl = document.getElementById('horde-alert');
        if(heliEl) heliEl.classList.remove('show');

        // Barcha zombilarni o'chirish
        game.zombies = [];
        game.zProjectiles = [];
        game.thrownItems = [];

        // Playerni "pinned" qilish — harakatlanmaydi
        p2.pinned = {
          zombie: null,
          timer: 999999,
          damageTimer: 999999,
          isBoarding: true
        };
      }
      return;
    }

    // === BOARDING ===
    if(h.state === HELI_STATE.BOARDING){
      h.timer -= dt;
      var p3 = game.player;
      // Heli player ustida turadi
      h.x = p3.x + Math.cos(h.angle) * 20;
      h.y = p3.y + Math.sin(h.angle) * 20;

      if(h.timer <= 0){
        h.state = HELI_STATE.LEAVING;
        h.timer = 180;
        console.log('[Heli] LEAVING!');
      }
      return;
    }

    // === LEAVING ===
    if(h.state === HELI_STATE.LEAVING){
      h.timer -= dt;
      // Player harakat qilmasin
      var p4 = game.player;
      if(p4.pinned && p4.pinned.isBoarding){
        // Player heli bilan birga ketadi
        p4.x = h.x - Math.cos(h.angle) * 20;
        p4.y = h.y - Math.sin(h.angle) * 20;
      }

      var awayX = h.x - 0;
      var awayY = h.y - 0;
      // Yuqoriga uchib ketadi
      h.x += 2 * dt;
      h.y -= 3 * dt;
      h.angle = -Math.PI / 4;
      h.scale += 0.03 * dt;

      if(h.timer <= 0){
        h.state = HELI_STATE.GONE;
        console.log('[Heli] GONE — Win!');
        winGame(game);
      }
      return;
    }
  }

  // ============================================================
  // TANK SPAWN
  // ============================================================
  function updateTankSpawn(game, dt){
    if(game.tank.spawnDelay > 0 && !game.tank.spawned){
      game.tank.spawnDelay -= dt;
      if(game.tank.spawnDelay <= 0){
        if(window.Zombies && window.Zombies.spawnTankFromEdge){
          var tank = window.Zombies.spawnTankFromEdge(
            game,
            window.innerWidth,
            window.innerHeight
          );
          game.tank.spawned = true;
          game.tank.alive = tank;

          console.log('[Tank] Spawned! HP:', tank.hp);

          if(window.HUD) window.HUD.showBanner("They're Coming!", '#ffffff');

          window.SFX.sfx.horde();
          window.SFX.sfx.bigZombieDown();
          game.shake = 20;
        }
      }
    }

    if(game.tank.alive && game.tank.alive.hp <= 0){
      game.tank.alive = null;
      game.tank.killed = true;
      console.log('[Tank] Eliminated!');
      game.score += 300;
    }
  }

  // ============================================================
  // WIN / LOSE
  // ============================================================
  function loseGame(game){
    if(game.over) return;
    game.running = false;
    game.over = true;
    game.won = false;
    window.SFX.sfx.death();
    if(window.Music) window.Music.stopAll();

    var ids = ['horde-alert', 'vomit-overlay', 'tank-alert'];
    for(var i = 0; i < ids.length; i++){
      var el = document.getElementById(ids[i]);
      if(el) el.classList.remove('show');
    }

    setTimeout(function(){
      if(window.HUD) window.HUD.showGameOver(game, 'YOU DIED', 'Transmission ended', false);
    }, 500);

    window.dispatchEvent(new CustomEvent('gameover', {
      detail: { score: game.score, kills: game.kills, win: false }
    }));
  }

  function winGame(game){
    if(game.over) return;
    game.running = false;
    game.over = true;
    game.won = true;
    if(window.Music) window.Music.stopAll();

    var ids = ['horde-alert', 'vomit-overlay', 'tank-alert'];
    for(var i = 0; i < ids.length; i++){
      var el = document.getElementById(ids[i]);
      if(el) el.classList.remove('show');
    }

    setTimeout(function(){
      if(window.HUD) window.HUD.startEndCredits();
    }, 800);

    window.__pendingGameOver = {
      game: game,
      title: 'RESCUED',
      status: 'You survived the outbreak',
      isWin: true
    };

    window.dispatchEvent(new CustomEvent('gameover', {
      detail: { score: game.score, kills: game.kills, win: true }
    }));
  }

  return {
    HELI_STATE: HELI_STATE,
    HELI_ARRIVE_FRAMES: HELI_ARRIVE_FRAMES,
    spawnRadio: spawnRadio,
    updateRadio: updateRadio,
    tryPickupRadio: tryPickupRadio,
    callHelicopter: callHelicopter,
    updateHelicopter: updateHelicopter,
    updateTankSpawn: updateTankSpawn,
    loseGame: loseGame,
    winGame: winGame
  };
})();