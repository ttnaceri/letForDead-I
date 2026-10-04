// ============================================================
// help.js — Helikopter, Radio, Tank, Evakuatsiya
// Let For Dead
// ============================================================
window.Help = (function(){
  'use strict';

  // ============================================================
  // HELI STATE
  // ============================================================
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
  // VAQTLAR (default)
  // ============================================================
  var DEFAULT_HELI_TIME = 60;           // sekund
  var CALLING_FRAMES = 60;               // 1 sekund
  var TANK_SPAWN_DELAY = 180;            // 3 sekund
  var BOARDING_DURATION = 90;            // 1.5 sekund
  var INTERACT_RANGE = 60;               // E bosish masofasi

  // ============================================================
  // SOZLAMALARNI OLISH
  // ============================================================
  function getMapSettings(game){
    return (game && game.mapSettings) || {
      heliTime: DEFAULT_HELI_TIME,
      zombieRate: 40,
      tankHp: 5236,
      hordeCount: 12,
      heliSpeed: 8,
      startWeapon: 'uzi',
      difficulty: 1
    };
  }

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
    game.radioPickup.bob += 0.08 * dt;
  }

  function tryPickupRadio(game){
    if(!game.radioPickup || game.hasRadio) return false;
    var p = game.player;
    var rp = game.radioPickup;
    var d = Math.hypot(rp.x - p.x, rp.y - p.y);
    if(d < INTERACT_RANGE){
      game.hasRadio = true;
      game.radioPickup = null;
      if(window.SFX) window.SFX.sfx.radioPickup();
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

    var mapSettings = getMapSettings(game);

    game.heli.state = HELI_STATE.CALLING;
    game.heli.timer = CALLING_FRAMES;
    game.heli.hordeSoundPlayed = false;
    game.heli.hordeSoundTimer = 0;

    if(window.SFX){
      window.SFX.sfx.heliCall();
      window.SFX.sfx.horde();
    }
    if(window.HUD) window.HUD.showBanner('Helicopter called — HORDE INCOMING!', '#e0523c');
    if(window.HUD) window.HUD.update(game);

    // Horde
    game.hordeActive = true;
    game.hordeCount = mapSettings.hordeCount || 12;

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

    var mapSettings = getMapSettings(game);

    // ============================================================
    // CALLING → INCOMING (1 sekunddan keyin)
    // ============================================================
    if(h.state === HELI_STATE.CALLING){
      h.timer -= dt;
      if(h.timer <= 0){
        h.state = HELI_STATE.INCOMING;
        h.timer = (mapSettings.heliTime || DEFAULT_HELI_TIME) * 60;   // sekund * 60
        h.tankWarned = false;

        var ang = Math.random() * Math.PI * 2;
        h.x = game.player.x + Math.cos(ang) * 800;
        h.y = game.player.y + Math.sin(ang) * 800;

        console.log('[Heli] CALLING → INCOMING! Time:', mapSettings.heliTime, 'sec');

        if(window.HUD) window.HUD.showBanner('Survive until help arrives', '#c98a2e');
        if(window.HUD) window.HUD.update(game);

        if(window.Music && window.Music.play){
          window.Music.play('beforehelp', { loop: false });
        }
      }
      return;
    }

    // ============================================================
    // INCOMING (helikopter yaqinlashadi)
    // ============================================================
    if(h.state === HELI_STATE.INCOMING){
      h.timer -= dt;

      // 3 sekunddan keyin horde sound
      if(!h.hordeSoundPlayed){
        h.hordeSoundTimer = (h.hordeSoundTimer || 0) + dt;
        if(h.hordeSoundTimer >= 180){
          h.hordeSoundPlayed = true;
          if(window.SFX && window.SFX.hordeSound && window.SFX.hordeSound.play){
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

    // ============================================================
    // ARRIVED
    // ============================================================
    if(h.state === HELI_STATE.ARRIVED){
      var p2 = game.player;
      var d2 = Math.hypot(p2.x - h.x, p2.y - h.y);

      // Tank tekshirish
      if(game.tank.alive && game.tank.alive.hp > 0){
        if(!h.tankWarned){
          h.tankWarned = true;
          if(window.HUD) window.HUD.showBanner("They're Coming!", '#ffffff');
        }
      } else if(d2 < h.pickupRadius){
        h.state = HELI_STATE.BOARDING;
        h.timer = BOARDING_DURATION;
        console.log('[Heli] BOARDING!');

        if(window.HUD) window.HUD.showBanner('BOARDING...', '#7ad44a');
        if(window.HUD) window.HUD.update(game);

        if(window.Music && window.Music.play){
          window.Music.play('afterhelp', { loop: false });
        }

        game.hordeActive = false;
        game.hordeCount = 0;
        var heliEl = document.getElementById('horde-alert');
        if(heliEl) heliEl.classList.remove('show');

        // Zombilarni tozalash
        game.zombies = [];
        game.zProjectiles = [];
        game.thrownItems = [];

        // Player bloklanadi
        p2.pinned = {
          zombie: null,
          timer: 999999,
          damageTimer: 999999,
          isBoarding: true
        };
      }
      return;
    }

    // ============================================================
    // BOARDING (player heli tagida)
    // ============================================================
    if(h.state === HELI_STATE.BOARDING){
      h.timer -= dt;
      var p3 = game.player;
      h.x = p3.x + Math.cos(h.angle) * 20;
      h.y = p3.y + Math.sin(h.angle) * 20;

      if(h.timer <= 0){
        h.state = HELI_STATE.LEAVING;
        h.timer = 180;
        console.log('[Heli] LEAVING!');
      }
      return;
    }

    // ============================================================
    // LEAVING — player va botlar ko'rinmaydi
    // ============================================================
    if(h.state === HELI_STATE.LEAVING){
      h.timer -= dt;

      var p4 = game.player;
      p4.x = h.x - Math.cos(h.angle) * 20;
      p4.y = h.y - Math.sin(h.angle) * 20;

      // Evacuated — ko'rinmasin
      p4.evacuated = true;
      p4.invisible = true;

      for(var i = 0; i < game.companions.length; i++){
        game.companions[i].evacuated = true;
        game.companions[i].invisible = true;
      }

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

          if(window.SFX){
            window.SFX.sfx.horde();
            window.SFX.sfx.bigZombieDown();
          }
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
  // LOSE
  // ============================================================
  function loseGame(game){
    if(game.over) return;
    game.running = false;
    game.over = true;
    game.won = false;

    if(window.SFX) window.SFX.sfx.death();

    if(window.Music){
      window.Music.unlock();
      window.Music.stopAll();
    }

    // Save
    if(window.Save){
      window.Save.onGameEnd({
        score: game.score,
        kills: game.kills,
        wave: 0,
        won: false,
        playTime: (game.elapsed || 0) * 1000
      });
    }

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

  // ============================================================
  // WIN
  // ============================================================
  function winGame(game){
    if(game.over) return;
    game.running = false;
    game.over = true;
    game.won = true;

    // afterhelp.mp3 davom etadi — Music.lock()
    if(window.Music){
      window.Music.lock();
    }

    // Save
    if(window.Save){
      window.Save.onGameEnd({
        score: game.score,
        kills: game.kills,
        wave: 0,
        won: true,
        playTime: (game.elapsed || 0) * 1000
      });
      // Achievements
      window.Save.unlockAchievement('rescued');
      if(game.companions.every(function(c){ return !c.isDown; })){
        window.Save.unlockAchievement('survivor_all');
      }
    }

    var ids = ['horde-alert', 'vomit-overlay', 'tank-alert'];
    for(var i = 0; i < ids.length; i++){
      var el = document.getElementById(ids[i]);
      if(el) el.classList.remove('show');
    }

    // End credits — 175 sekund
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

  // ============================================================
  // EXPORT
  // ============================================================
  return {
    HELI_STATE: HELI_STATE,
    DEFAULT_HELI_TIME: DEFAULT_HELI_TIME,
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