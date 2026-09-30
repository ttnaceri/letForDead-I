// ============================================================
// game.js — Asosiy o'yin fayli
// Let For Dead
// ============================================================
(function(){
'use strict';

var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');

var game = null;
var pausedByVisibility = false;
var lastTs = 0;

// ============================================================
// KONSTANTALAR
// ============================================================
var HELI_STATE = {
  NONE: 'none',
  CALLING: 'calling',
  INCOMING: 'incoming',
  ARRIVED: 'arrived',
  LEAVING: 'leaving',
  GONE: 'gone'
};

// ⏱️ Yordam 60 sekundda keladi
var HELI_ARRIVE_FRAMES = 60 * 60;

// Tank kelish kechikishi (helikopter chaqirilgandan keyin)
var TANK_SPAWN_DELAY = 180;   // 3 sekund

// ============================================================
// YANGI O'YIN
// ============================================================
function newGame(){
  var ammo = window.Weapons.newPlayerAmmo();
  var reserve = window.Weapons.newPlayerReserve();

  return {
    running: true, over: false, won: false, paused: false,
    score: 0, kills: 0,
    spawnTimer: 0,
    zombies: [], bullets: [], zProjectiles: [], particles: [], pickups: [],
    thrownItems: [], fireZones: [], explosions: [],
    shake: 0, damageFlash: 0,
    camera: { x: 0, y: 0 },
    hordeTimer: 400,
    hordeActive: false,
    hordeCount: 0,
    groanTimer: 0,
    elapsed: 0,
    hasRadio: false,
    radioPickup: null,
    autoMode: false,

    player: {
      x: 0, y: 0, r: 16,
      speed: 4.3, maxSpeed: 4.3,
      hp: 100, maxHp: 100,
      angle: 0, cooldown: 0,

      slot1: 'shotgun',
      slot2: 'pistol',
      slot3: 'aid',
      slot4: 'grenade',
      slot5: 'syringe',
      currentSlot: 2,

      ammo: ammo,
      reserve: reserve,

      reloading: false,
      reloadTimer: 0,
      meleeCooldown: 0,
      hurtCooldown: 0,
      name: 'You', color: '#7ad44a', isPlayer: true,
      hitFlash: 0,
      pushCooldown: 0,

      // === SPECIAL INFECTED STATES ===
      pinned: null,       // Hunter
      ridden: null,       // Jockey
      smoked: null,       // Smoker
      charged: null,      // Charger
      vomitTimer: 0,      // Boomer
      crippled: null,     // Witch
      knockbackVX: 0,     // Tank
      knockbackVY: 0
    },

    companions: [],

    heli: {
      state: HELI_STATE.NONE,
      timer: 0,
      x: 0, y: 0,
      angle: 0,
      pickupRadius: 130,
      scale: 2.0,
      tankWarned: false
    },

    // Tank tizimi
    tank: {
      spawned: false,
      alive: null,
      spawnDelay: 0,
      killed: false
    }
  };
}

// ============================================================
// WEAPON / SLOT BOSHQARUVI
// ============================================================
function getCurrentWeaponKey(g){
  g = g || game;
  var p = g.player;
  if(p.currentSlot === 1) return p.slot1;
  if(p.currentSlot === 2) return p.slot2;
  if(p.currentSlot === 3) return p.slot3;
  if(p.currentSlot === 4) return p.slot4;
  if(p.currentSlot === 5) return p.slot5;
  return 'pistol';
}

function selectSlot(n){
  if(!game || !game.running) return;
  if(n < 1 || n > 5) return;

  var p = game.player;
  p.currentSlot = n;
  p.reloading = false;
  p.reloadTimer = 0;

  // Slot 1 — birinchi mavjud qurol
  if(n === 1){
    for(var i = 0; i < window.Weapons.SLOT1_PRIORITY.length; i++){
      var k = window.Weapons.SLOT1_PRIORITY[i];
      if(p.ammo[k] > 0 || p.reserve[k] > 0){ p.slot1 = k; break; }
    }
  }

  // Slot 2 — pistol yoki melee
  if(n === 2){
    if(p.slot2 !== 'pistol' && p.slot2 !== 'melee' &&
       p.slot2 !== 'machete' && p.slot2 !== 'axe' && p.slot2 !== 'knife'){
      p.slot2 = 'pistol';
    }
  }

  // Slot 4 — birinchi mavjud throwable
  if(n === 4){
    for(var j = 0; j < window.Weapons.SLOT4_PRIORITY.length; j++){
      var k4 = window.Weapons.SLOT4_PRIORITY[j];
      if(p.ammo[k4] > 0){ p.slot4 = k4; break; }
    }
  }

  // Slot 5 — birinchi mavjud heal
  if(n === 5){
    for(var m = 0; m < window.Weapons.SLOT5_PRIORITY.length; m++){
      var k5 = window.Weapons.SLOT5_PRIORITY[m];
      if(p.ammo[k5] > 0){ p.slot5 = k5; break; }
    }
  }

  updateSlotsHud();
  updateWeaponHud();
  updateMobileHUD();
}

function cycleWeapon(){
  if(!game || !game.running) return;
  var p = game.player;

  if(p.currentSlot === 2){
    p.slot2 = (p.slot2 === 'pistol') ? 'melee' : 'pistol';
  } else if(p.currentSlot === 1){
    var list = window.Weapons.SLOT1_PRIORITY.filter(function(k){
      return p.ammo[k] > 0 || p.reserve[k] > 0;
    });
    if(list.length > 1){
      var idx = list.indexOf(p.slot1);
      p.slot1 = list[(idx + 1) % list.length];
    }
  } else if(p.currentSlot === 4){
    var list4 = window.Weapons.SLOT4_PRIORITY.filter(function(k){ return p.ammo[k] > 0; });
    if(list4.length > 1){
      var idx4 = list4.indexOf(p.slot4);
      p.slot4 = list4[(idx4 + 1) % list4.length];
    }
  } else if(p.currentSlot === 5){
    var list5 = window.Weapons.SLOT5_PRIORITY.filter(function(k){ return p.ammo[k] > 0; });
    if(list5.length > 1){
      var idx5 = list5.indexOf(p.slot5);
      p.slot5 = list5[(idx5 + 1) % list5.length];
    }
  } else {
    p.currentSlot = (p.currentSlot === 1) ? 2 : 1;
  }

  p.reloading = false;
  p.reloadTimer = 0;
  updateSlotsHud();
  updateWeaponHud();
}

function reloadCurrent(){
  var p = game.player;
  var wk = getCurrentWeaponKey();
  var w = window.Weapons.get(wk);
  if(!w) return;

  if(window.Weapons.isMelee(wk)) return;
  if(window.Weapons.isThrow(wk)) return;
  if(window.Weapons.isHeal(wk)) return;
  if(!w.magSize) return;
  if(p.ammo[wk] >= w.magSize) return;
  if(p.reloading) return;
  if(!w.infinite && p.reserve[wk] <= 0) return;

  p.reloading = true;
  p.reloadTimer = w.reloadTime || 60;
  window.SFX.sfx.reload();
  updateWeaponHud();
}

// ============================================================
// OTISH / MELEE / PUSH / THROW / HEAL
// ============================================================
function performShoot(){
  var p = game.player;
  var wk = getCurrentWeaponKey();
  var w = window.Weapons.get(wk);
  if(!w) return false;

  // === MELEE ===
  if(window.Weapons.isMelee(wk)){
    if(p.meleeCooldown > 0) return false;
    p.meleeCooldown = w.cooldown;
    window.SFX.sfx.melee();
    var hit = window.Weapons.meleeSwing(game, p, p.angle, wk);
    if(hit) window.SFX.sfx.meleeHit();
    return true;
  }

  // === THROWABLE ===
  if(window.Weapons.isThrow(wk)){
    if(p.ammo[wk] <= 0){ window.SFX.sfx.dryFire(); return false; }
    p.ammo[wk]--;
    window.Weapons.throwProjectile(game, p, p.angle, wk);
    window.SFX.sfx.throwItem();
    updateWeaponHud();
    updateMobileHUD();
    return true;
  }

  // === HEAL (AID, syringe, pills) ===
  if(window.Weapons.isHeal(wk)){
    if(p.ammo[wk] <= 0){ window.SFX.sfx.dryFire(); return false; }
    var healAmt = w.healAmount || 35;
    if(p.hp >= p.maxHp) return false;
    p.ammo[wk]--;
    p.hp = Math.min(p.maxHp, p.hp + healAmt);
    window.SFX.sfx.heal();
    window.Zombies.spawnParticles(game, p.x, p.y, 15, '#7fbf52', 3);
    updateWeaponHud();
    updateSlotsHud();
    updateMobileHUD();
    return true;
  }

  // === GUN / LAUNCHER ===
  if(window.Weapons.isGun(wk) || window.Weapons.isLauncher(wk)){
    if(p.reloading) return false;
    if(!window.Weapons.consumeAmmo(p, wk)){
      if(p.reserve[wk] > 0) reloadCurrent();
      else window.SFX.sfx.dryFire();
      return false;
    }

    if(window.Weapons.isLauncher(wk)){
      game.thrownItems.push({
        type: 'grenade',
        x: p.x + Math.cos(p.angle)*p.r,
        y: p.y + Math.sin(p.angle)*p.r,
        dx: Math.cos(p.angle)*10,
        dy: Math.sin(p.angle)*10,
        friction: 0.96,
        fuse: 70,
        weaponKey: 'grenadeLauncher',
        owner: p,
        beepTimer: 0
      });
      window.SFX.sfx.shotgun();
    } else {
      window.Weapons.fireBullets(game, p, p.angle, wk);
      if(wk === 'shotgun') window.SFX.sfx.shotgun();
      else if(wk === 'rifle') window.SFX.sfx.rifle();
      else if(wk === 'sniper') window.SFX.sfx.rifle();
      else window.SFX.sfx.shoot();
    }

    window.Zombies.spawnParticles(game,
      p.x + Math.cos(p.angle)*20,
      p.y + Math.sin(p.angle)*20,
      3, '#e8c27a', 2);

    // Auto-reload
    if(p.ammo[wk] <= 0 && (w.infinite || p.reserve[wk] > 0)){
      setTimeout(function(){
        if(game && game.running && getCurrentWeaponKey() === wk) reloadCurrent();
      }, 250);
    }
    updateWeaponHud();
    updateMobileHUD();
    return true;
  }

  return false;
}

function doPush(){
  var p = game.player;
  if(p.pushCooldown > 0) return;
  p.pushCooldown = 30;
  window.SFX.sfx.melee();
  var hits = window.Weapons.pushAttack(game, p);
  if(hits > 0) window.SFX.sfx.meleeHit();
}

// ============================================================
// RADIO / HELICOPTER
// ============================================================
function spawnRadio(){
  var ang = Math.random() * Math.PI * 2;
  var dist = 900 + Math.random() * 700;
  game.radioPickup = {
    x: game.player.x + Math.cos(ang) * dist,
    y: game.player.y + Math.sin(ang) * dist,
    r: 18,
    bob: Math.random() * Math.PI * 2
  };
}

function callHelicopter(){
  if(!game || !game.running) return;
  if(!game.hasRadio) return;
  if(game.heli.state !== HELI_STATE.NONE) return;

  game.heli.state = HELI_STATE.CALLING;
  game.heli.timer = 60;
  window.SFX.sfx.heliCall();
  window.SFX.sfx.horde();
  showBanner('Helicopter called — HORDE INCOMING!', '#e0523c');
  updateCallButton();
  updateMobileHUD();

  game.hordeActive = true;
  game.hordeCount = 40;

  var hordeEl = document.getElementById('horde-alert');
  if(hordeEl) hordeEl.classList.add('show');

  // === TANK KELADI (3 sekunddan keyin) ===
  game.tank.spawnDelay = TANK_SPAWN_DELAY;
  game.tank.spawned = false;
  game.tank.killed = false;

  var heliStarted = false;

  function beginIncoming(){
    if(heliStarted) return;
    heliStarted = true;
    if(!game || game.over) return;
    if(game.heli.state !== HELI_STATE.CALLING) return;

    game.heli.state = HELI_STATE.INCOMING;
    game.heli.timer = HELI_ARRIVE_FRAMES;
    game.heli.tankWarned = false;

    var ang = Math.random() * Math.PI * 2;
    game.heli.x = game.player.x + Math.cos(ang) * 2200;
    game.heli.y = game.player.y + Math.sin(ang) * 2200;

    showBanner('Survive until help arrives', '#c98a2e');
    updateCallButton();
    updateMobileHUD();
    window.Music.play('beforehelp', { loop: false });
  }

  window.Music.play('aftercall', { loop: false, onEnd: beginIncoming });

  setTimeout(function(){
    if(heliStarted) return;
    var t = window.Music.getTrack('aftercall');
    if(!t || t.paused || t.ended || !t.currentTime){
      beginIncoming();
    }
  }, 1200);
}

function updateHelicopter(dt){
  var h = game.heli;
  if(h.state === HELI_STATE.NONE || h.state === HELI_STATE.GONE) return;

  if(h.state === HELI_STATE.INCOMING){
    h.timer -= dt;
    var p = game.player;
    var dx = p.x - h.x, dy = p.y - h.y;
    var d = Math.hypot(dx, dy) || 1;
    var arriveDist = 90;
    if(d > arriveDist){
      var speedFactor = 2200 / HELI_ARRIVE_FRAMES;
      h.x += (dx / d) * speedFactor * dt;
      h.y += (dy / d) * speedFactor * dt;
    }
    h.angle = Math.atan2(dy, dx);

    if(h.timer <= 0){
      h.state = HELI_STATE.ARRIVED;
      h.timer = 0;
      showBanner('Helicopter arrived — get to it!', '#7ad44a');
      updateCallButton();
      updateMobileHUD();
      window.Music.play('arrivedhelp', { loop: false });
    }
  }
  else if(h.state === HELI_STATE.ARRIVED){
    var p2 = game.player;
    var d2 = Math.hypot(p2.x - h.x, p2.y - h.y);

    // Tank hali tirik bo'lsa — heli kutadi
    if(game.tank.alive && game.tank.alive.hp > 0){
      if(!h.tankWarned){
        h.tankWarned = true;
        showBanner('KILL THE TANK FIRST!', '#e0523c');
      }
    } else if(d2 < h.pickupRadius){
      h.state = HELI_STATE.LEAVING;
      h.timer = 120;
      showBanner('EVACUATED', '#7ad44a');
      updateCallButton();
      updateMobileHUD();
      window.Music.play('afterhelp', { loop: false });
      game.hordeActive = false;
      var heliEl = document.getElementById('horde-alert');
      if(heliEl) heliEl.classList.remove('show');
    }
  }
  else if(h.state === HELI_STATE.LEAVING){
    h.timer -= dt;
    var awayX = h.x - game.player.x;
    var awayY = h.y - game.player.y;
    var awayD = Math.hypot(awayX, awayY) || 1;
    h.x += (awayX / awayD) * 3 * dt;
    h.y += (awayY / awayD) * 3 * dt - 1.5 * dt;
    h.angle = Math.atan2(-awayY, -awayX);

    if(h.timer <= 0){
      h.state = HELI_STATE.GONE;
      winGame();
    }
  }
}

function updateCallButton(){
  var btn = document.getElementById('callBtn');
  var label = document.getElementById('callBtnLabel');
  var h = game.heli;
  var timerEl = document.getElementById('heliTimer');

  if(!btn) return;
  if(!game.hasRadio){
    btn.classList.remove('show');
    if(timerEl) timerEl.classList.remove('show');
    return;
  }
  btn.classList.add('show');

  if(h.state === HELI_STATE.NONE){
    btn.disabled = false;
    btn.classList.remove('calling');
    if(label) label.textContent = 'Call Helicopter';
    if(timerEl){ timerEl.classList.remove('show'); timerEl.classList.remove('horde'); }
  } else if(h.state === HELI_STATE.CALLING){
    btn.disabled = true;
    btn.classList.add('calling');
    if(label) label.textContent = 'Calling...';
    if(timerEl) timerEl.classList.remove('show');
  } else if(h.state === HELI_STATE.INCOMING){
    btn.disabled = true;
    btn.classList.add('calling');
    var totalSec = Math.max(0, Math.ceil(h.timer / 60));
    var mm = Math.floor(totalSec / 60);
    var ss = totalSec % 60;
    var timeStr = mm + ':' + (ss < 10 ? '0' : '') + ss;
    if(label) label.textContent = 'Inbound ' + timeStr;
    if(timerEl){
      timerEl.classList.add('show');
      timerEl.classList.add('horde');
      timerEl.innerHTML = '⚠ HORDE — SURVIVE &nbsp; <span class="t">' + timeStr + '</span>';
    }
  } else if(h.state === HELI_STATE.ARRIVED){
    btn.disabled = true;
    btn.classList.remove('calling');
    if(label) label.textContent = 'Reach the helicopter!';
    if(timerEl){
      timerEl.classList.add('show');
      timerEl.classList.remove('horde');
      timerEl.innerHTML = 'HELICOPTER ARRIVED &nbsp; <span class="t">GO!</span>';
    }
  } else {
    btn.disabled = true;
    btn.classList.remove('calling');
    if(label) label.textContent = 'Evacuated';
    if(timerEl) timerEl.classList.remove('show');
  }
}

// ============================================================
// PAUSE / AUTO MODE
// ============================================================
function togglePause(){
  if(!game || game.over) return;
  game.paused = !game.paused;
  var el = document.getElementById('pauseScreen');
  if(game.paused){
    if(el) el.classList.add('show');
    window.Music.pause();
  } else {
    if(el) el.classList.remove('show');
    window.Music.resume();
    lastTs = performance.now();
  }
}

function toggleAutoMode(){
  if(!game || !game.running) return;
  game.autoMode = !game.autoMode;
  var tag = document.getElementById('autoModeTag');
  if(game.autoMode){
    if(tag) tag.classList.add('show');
    showBanner('AUTO MODE ON', '#c98a2e');
  } else {
    if(tag) tag.classList.remove('show');
    showBanner('AUTO MODE OFF', '#c98a2e');
  }
}

// ============================================================
// INPUT
// ============================================================
var keys = {};
var mouse = { x: 0, y: 0, down: false, rightDown: false };

window.addEventListener('keydown', function(e){
  var k = e.key.toLowerCase();
  keys[k] = true;
  if([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) !== -1) e.preventDefault();

  if(k === 'escape'){ togglePause(); e.preventDefault(); return; }
  if(game && game.paused) return;

  if(k === 'q' && !e.repeat) cycleWeapon();
  if(k === 'e' && !e.repeat) callHelicopter();
  if(k === 'r' && !e.repeat){
    if(game && game.over) restartGame();
    else reloadCurrent();
  }
  if((k === '1' || k === '2' || k === '3' || k === '4' || k === '5') && !e.repeat){
    selectSlot(parseInt(k, 10));
  }
  if(e.altKey && k === 'a' && !e.repeat){ toggleAutoMode(); e.preventDefault(); return; }
  if(e.shiftKey && k === 'a' && !e.repeat){ toggleAutoMode(); e.preventDefault(); return; }
});
window.addEventListener('keyup', function(e){ keys[e.key.toLowerCase()] = false; });

canvas.addEventListener('mousemove', function(e){
  var r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
canvas.addEventListener('mousedown', function(e){
  if(e.button === 0){ mouse.down = true; window.SFX.ensureAudio(); }
  if(e.button === 2){ mouse.rightDown = true; window.SFX.ensureAudio(); }
});
window.addEventListener('mouseup', function(e){
  if(e.button === 0) mouse.down = false;
  if(e.button === 2) mouse.rightDown = false;
});
canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });

var callBtn = document.getElementById('callBtn');
if(callBtn){
  callBtn.addEventListener('click', function(){
    window.SFX.ensureAudio();
    callHelicopter();
  });
}

var restartBtn = document.getElementById('restartBtn');
if(restartBtn){
  restartBtn.addEventListener('click', function(){
    window.SFX.ensureAudio();
    restartGame();
  });
}

// ============================================================
// SPECIAL INFECTED HOLATLARI
// ============================================================
function updateSpecialStates(dt){
  var p = game.player;

  // --- HUNTER PIN ---
  if(p.pinned){
    p.pinned.timer -= dt;
    p.pinned.damageTimer -= dt;
    if(p.pinned.damageTimer <= 0){
      p.pinned.damageTimer = 30;
      window.Zombies.damagePlayer(game, 8);
    }
    if(keys['a'] || keys['d'] || keys['w'] || keys['s'] || keys[' ']){
      p.pinned.timer -= dt * 2.5;
    }
    if(p.pinned.timer <= 0){
      var pz = p.pinned.zombie;
      if(pz){
        var ang = Math.atan2(p.y - pz.y, p.x - pz.x);
        pz.pushVX = Math.cos(ang) * 12;
        pz.pushVY = Math.sin(ang) * 12;
      }
      p.pinned = null;
    }
  }

  // --- JOCKEY RIDE ---
  if(p.ridden){
    p.ridden.timer -= dt;
    p.ridden.damageTimer -= dt;
    if(p.ridden.damageTimer <= 0){
      p.ridden.damageTimer = 24;
      window.Zombies.damagePlayer(game, 10);
    }
    var jz = p.ridden.zombie;
    if(jz){
      jz.x = p.x + Math.cos(p.ridden.steerAngle) * 6;
      jz.y = p.y + Math.sin(p.ridden.steerAngle) * 6;
    }
    p.x += Math.cos(p.ridden.steerAngle) * 3.5 * dt;
    p.y += Math.sin(p.ridden.steerAngle) * 3.5 * dt;
    if(Math.random() < 0.05) p.ridden.steerAngle += (Math.random() - 0.5) * 0.8;
    if(keys['a'] || keys['d'] || keys['w'] || keys['s'] || keys[' ']){
      p.ridden.timer -= dt * 2;
    }
    if(p.ridden.timer <= 0){
      if(jz){
        var ang2 = Math.atan2(p.y - jz.y, p.x - jz.x);
        jz.pushVX = Math.cos(ang2) * 12;
        jz.pushVY = Math.sin(ang2) * 12;
      }
      p.ridden = null;
    }
  }

  // --- SMOKER TONGUE ---
  if(p.smoked){
    p.smoked.timer -= dt;
    p.smoked.damageTimer -= dt;
    if(p.smoked.damageTimer <= 0){
      p.smoked.damageTimer = 30;
      window.Zombies.damagePlayer(game, 6);
    }
    var sz = p.smoked.zombie;
    if(sz){
      var sx = sz.x - p.x, sy = sz.y - p.y;
      var sd = Math.hypot(sx, sy) || 1;
      p.x += (sx / sd) * 3.2 * dt;
      p.y += (sy / sd) * 3.2 * dt;
    }
    if(keys['a'] || keys['d'] || keys['w'] || keys['s'] || keys[' ']){
      p.smoked.timer -= dt * 2;
    }
    if(p.smoked.timer <= 0) p.smoked = null;
  }

  // --- CHARGER CARRY ---
  if(p.charged){
    p.charged.timer -= dt;
    p.charged.slamTimer -= dt;
    var cz = p.charged.zombie;
    p.x += p.charged.chargeDX * dt;
    p.y += p.charged.chargeDY * dt;
    if(cz){
      cz.x = p.x + 20;
      cz.y = p.y;
    }
    if(p.charged.slamTimer <= 0){
      p.charged.slamTimer = 9999;
      window.Zombies.damagePlayer(game, 30);
      game.shake = 20;
      game.damageFlash = 1;
      p.knockbackVX = p.charged.chargeDX * 1.5;
      p.knockbackVY = p.charged.chargeDY * 1.5;
      window.Zombies.spawnParticles(game, p.x, p.y, 25, '#8a2a20', 6);
    }
    if(keys['a'] || keys['d'] || keys['w'] || keys['s'] || keys[' ']){
      p.charged.timer -= dt * 1.5;
    }
    if(p.charged.timer <= 0) p.charged = null;
  }

  // --- BOOMER VOMIT ---
  if(p.vomitTimer > 0){
    p.vomitTimer -= dt;
    var vomitEl = document.getElementById('vomit-overlay');
    if(vomitEl) vomitEl.classList.add('show');
    if(p.vomitTimer <= 0){
      if(vomitEl) vomitEl.classList.remove('show');
    }
  }

  // --- WITCH CRIPPLE ---
  if(p.crippled){
    p.crippled.timer -= dt;
    if(p.crippled.timer <= 0) p.crippled = null;
  }

  // --- TANK KNOCKBACK ---
  if(Math.abs(p.knockbackVX) > 0.1 || Math.abs(p.knockbackVY) > 0.1){
    p.x += p.knockbackVX * dt;
    p.y += p.knockbackVY * dt;
    p.knockbackVX *= 0.88;
    p.knockbackVY *= 0.88;
  }
}

// ============================================================
// UPDATE
// ============================================================
function update(dt){
  var p = game.player;
  game.elapsed += dt / 60;

  if(p.hitFlash > 0) p.hitFlash -= dt;
  if(p.meleeCooldown > 0) p.meleeCooldown -= dt;
  if(p.pushCooldown > 0) p.pushCooldown -= dt;

  // Reload
  if(p.reloading){
    p.reloadTimer -= dt;
    if(p.reloadTimer <= 0){
      var wkReload = getCurrentWeaponKey();
      var wReload = window.Weapons.get(wkReload);
      if(wReload && wReload.magSize){
        if(wReload.infinite){
          p.ammo[wkReload] = wReload.magSize;
        } else {
          var need = wReload.magSize - p.ammo[wkReload];
          var take = Math.min(need, p.reserve[wkReload]);
          p.ammo[wkReload] += take;
          p.reserve[wkReload] -= take;
        }
      }
      p.reloading = false;
      p.reloadTimer = 0;
      updateWeaponHud();
      updateMobileHUD();
    }
  }

  // === SPECIAL INFECTED ===
  updateSpecialStates(dt);

  // === INPUT (desktop + touch) ===
  var touchState = window.Touch ? window.Touch.getState() : null;
  var useTouch = window.Touch && window.Touch.isActive();

  if(!game.autoMode){
    var mx = 0, my = 0;

    if(useTouch && touchState){
      mx = touchState.moveX;
      my = touchState.moveY;
    } else {
      if(keys['w'] || keys['arrowup']) my -= 1;
      if(keys['s'] || keys['arrowdown']) my += 1;
      if(keys['a'] || keys['arrowleft']) mx -= 1;
      if(keys['d'] || keys['arrowright']) mx += 1;
    }

    var canMove = !p.pinned && !p.ridden && !p.smoked && !p.charged;
    var speedMult = 1.0;
    if(p.crippled) speedMult *= p.crippled.speedMult;

    if((Math.abs(mx) > 0.05 || Math.abs(my) > 0.05) && canMove){
      var len = Math.hypot(mx, my);
      if(len > 1){ mx /= len; my /= len; }
      var pSpd = window.AI.getEntitySpeed(p) * speedMult;
      p.x += mx * pSpd * dt;
      p.y += my * pSpd * dt;
    }

    // AIM
    if(canMove){
      if(useTouch && touchState &&
         (Math.abs(touchState.aimX) > 0.05 || Math.abs(touchState.aimY) > 0.05)){
        p.angle = Math.atan2(touchState.aimY, touchState.aimX);
      } else if(!useTouch){
        var worldMouseX = mouse.x + game.camera.x;
        var worldMouseY = mouse.y + game.camera.y;
        p.angle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);
      }
    }

    // SHOOT
    if(p.cooldown > 0) p.cooldown -= dt;
    var shouldShoot = false;
    if(useTouch && touchState){
      shouldShoot = touchState.firing;
    } else {
      shouldShoot = mouse.down || keys[' '];
    }

    if(shouldShoot && p.cooldown <= 0 && canMove){
      var wk = getCurrentWeaponKey();
      if(performShoot()){
        var w = window.Weapons.get(wk);
        p.cooldown = w ? w.cooldown : 12;
      } else {
        p.cooldown = 10;
      }
    }

    // PUSH
    if(useTouch && touchState && touchState.pushing){
      doPush();
    } else if(!useTouch && mouse.rightDown){
      doPush();
    }

    // Reload (touch button)
    if(useTouch && window.Touch.consumeReload()){
      reloadCurrent();
    }
  } else {
    // Auto mode
    window.AI.updateAutoMode(game, dt);
  }

  if(p.hurtCooldown > 0) p.hurtCooldown -= dt;

  // Companions
  for(var ci = 0; ci < game.companions.length; ci++){
    window.AI.updateCompanion(game, game.companions[ci], dt);
  }

  // Bullets
  for(var i = game.bullets.length - 1; i >= 0; i--){
    var b = game.bullets[i];
    b.x += b.dx * dt; b.y += b.dy * dt; b.life -= dt;
    if(b.life <= 0){ game.bullets.splice(i, 1); continue; }
    for(var j = game.zombies.length - 1; j >= 0; j--){
      var z = game.zombies[j];
      if(Math.hypot(b.x - z.x, b.y - z.y) < z.r){
        z.hp -= b.dmg; z.hitFlash = 6;
        window.Zombies.spawnParticles(game, b.x, b.y, 5, '#c94a3a', 3);
        window.SFX.sfx.hit();
        game.bullets.splice(i, 1);
        if(z.hp <= 0) window.Zombies.kill(game, j);
        break;
      }
    }
  }

  // Zombies
  for(var zi = game.zombies.length - 1; zi >= 0; zi--){
    var zz = game.zombies[zi];
    window.Zombies.update(game, zz, dt);
    if(zz.hp <= 0) window.Zombies.kill(game, zi);
  }

  // Zombie projectiles
  for(var pi = game.zProjectiles.length - 1; pi >= 0; pi--){
    var pr = game.zProjectiles[pi];
    pr.x += pr.dx * dt; pr.y += pr.dy * dt; pr.life -= dt;
    if(pr.life <= 0){ game.zProjectiles.splice(pi, 1); continue; }
    if(Math.hypot(pr.x - p.x, pr.y - p.y) < p.r + 5){
      window.Zombies.damagePlayer(game, pr.dmg || 8);
      window.Zombies.spawnParticles(game, pr.x, pr.y, 6,
        pr.kind === 'rock' ? '#8a6a3a' : '#6b8f3f', 3);
      if(pr.kind === 'rock') game.shake = 10;
      game.zProjectiles.splice(pi, 1);
      continue;
    }
    var hitC = false;
    for(var ci2 = 0; ci2 < game.companions.length; ci2++){
      var cc = game.companions[ci2];
      if(cc.isDown) continue;
      if(Math.hypot(pr.x - cc.x, pr.y - cc.y) < cc.r + 5){
        window.Zombies.damageCompanion(game, cc, pr.dmg || 8);
        window.Zombies.spawnParticles(game, pr.x, pr.y, 6, '#6b8f3f', 3);
        game.zProjectiles.splice(pi, 1);
        hitC = true;
        break;
      }
    }
    if(hitC) continue;
  }

  // Particles
  for(var qi = game.particles.length - 1; qi >= 0; qi--){
    var pt = game.particles[qi];
    pt.x += pt.dx * dt; pt.y += pt.dy * dt;
    pt.dx *= 0.94; pt.dy *= 0.94;
    pt.life -= dt;
    if(pt.life <= 0) game.particles.splice(qi, 1);
  }

  // Items
  window.Items.update(game, dt, canvas);
  window.Items.updateThrown(game, dt);
  window.Items.updateFireZones(game, dt);
  window.Items.updateExplosions(game, dt);

  // === TANK SPAWN ===
  if(game.tank.spawnDelay > 0 && !game.tank.spawned){
    game.tank.spawnDelay -= dt;
    if(game.tank.spawnDelay <= 0){
      var tank = window.Zombies.spawnTankFromEdge(game, canvas.width, canvas.height);
      game.tank.spawned = true;
      game.tank.alive = tank;

      showBanner('TANK INCOMING', '#e0523c');
      window.SFX.sfx.horde();
      window.SFX.sfx.bigZombieDown();
      game.shake = 20;

      var tankEl = document.getElementById('tank-alert');
      if(tankEl) tankEl.classList.add('show');

      setTimeout(function(){
        if(!game || game.over) return;
        var te = document.getElementById('tank-alert');
        if(te) te.classList.remove('show');
      }, 4000);
    }
  }

  // Tank o'ldimi?
  if(game.tank.alive && game.tank.alive.hp <= 0){
    game.tank.alive = null;
    game.tank.killed = true;
    var ta = document.getElementById('tank-alert');
    if(ta) ta.classList.remove('show');
    showBanner('TANK ELIMINATED', '#7ad44a');
    game.score += 300;
  }

  // Spawn
  game.spawnTimer -= dt;
  if(game.spawnTimer <= 0){
    var t = game.elapsed;
    var rate = Math.max(8, 40 - t * 0.15);
    var spawnCount = 1;

    if(game.hordeActive && game.heli.state === HELI_STATE.INCOMING){
      rate = 4;
      spawnCount = 2;
      if(Math.random() < 0.5) spawnCount = 3;
    } else if(game.heli.state === HELI_STATE.INCOMING){
      rate = Math.max(4, rate * 0.5);
    } else if(game.heli.state === HELI_STATE.ARRIVED){
      rate = Math.max(3, rate * 0.4);
    }

    if(t > 60 && Math.random() < 0.3 && spawnCount === 1) spawnCount = 2;
    if(t > 120 && Math.random() < 0.4 && spawnCount < 3) spawnCount = 3;

    for(var sc = 0; sc < spawnCount; sc++){
      var type = window.Zombies.pickType(game);
      window.Zombies.spawn(game, type, canvas.width, canvas.height);
    }
    game.spawnTimer = rate * (0.6 + Math.random() * 0.7);
  }

  // Horde eventi
  game.hordeTimer -= dt;
  if(game.hordeTimer <= 0 && !game.hordeActive && game.heli.state === HELI_STATE.NONE){
    game.hordeActive = true;
    game.hordeCount = 15 + Math.floor(game.elapsed * 0.3);
    showBanner('HORDE INCOMING');
    window.SFX.sfx.zombieGroan();
  }
  if(game.hordeActive && game.hordeCount > 0 && game.heli.state === HELI_STATE.NONE){
    if(Math.random() < 0.35){
      var ht = window.Zombies.pickType(game);
      window.Zombies.spawn(game, ht, canvas.width, canvas.height);
      game.hordeCount--;
    }
    if(game.hordeCount <= 0){
      game.hordeActive = false;
      game.hordeTimer = 500 + Math.random() * 300;
    }
  }

  // Random pickups
  if(Math.random() < 0.0006 && game.pickups.length < 3){
    var ang2 = Math.random() * Math.PI * 2;
    var d2 = 500 + Math.random() * 700;
    var px = p.x + Math.cos(ang2) * d2;
    var py = p.y + Math.sin(ang2) * d2;
    var roll = Math.random();
    var type2;
    if(roll < 0.35) type2 = 'health';
    else if(roll < 0.50) type2 = 'ammo_pistol';
    else if(roll < 0.68) type2 = 'ammo_shotgun';
    else if(roll < 0.85) type2 = 'ammo_rifle';
    else if(roll < 0.92) type2 = 'aid';
    else if(roll < 0.97) type2 = 'grenade';
    else type2 = 'pipebomb';
    game.pickups.push({ type: type2, x: px, y: py, r: 14, bob: Math.random() * Math.PI * 2 });
  }

  // Groans
  game.groanTimer -= dt;
  if(game.groanTimer <= 0 && game.zombies.length > 0){
    if(Math.random() < 0.3) window.SFX.sfx.zombieGroan();
    game.groanTimer = 60 + Math.random() * 120;
  }

  if(game.shake > 0) game.shake -= dt * 0.6;
  if(game.damageFlash > 0) game.damageFlash -= dt * 0.045;

  // Camera
  var targetCamX = p.x - canvas.width / 2;
  var targetCamY = p.y - canvas.height / 2;
  game.camera.x += (targetCamX - game.camera.x) * 0.12 * dt;
  game.camera.y += (targetCamY - game.camera.y) * 0.12 * dt;

  updateHelicopter(dt);
  updateHUD();
}

// ============================================================
// HUD
// ============================================================
function updateHUD(){
  var p = game.player;
  var pct = Math.max(0, p.hp / p.maxHp * 100);
  var bar = document.getElementById('healthBar');
  if(bar){
    bar.style.width = pct + '%';
    bar.style.background = pct > 55 ? 'var(--toxic)' : pct > 25 ? 'var(--amber)' : 'var(--blood-hot)';
  }
  var hn = document.getElementById('healthNum');
  if(hn) hn.textContent = Math.ceil(p.hp);

  var sr = document.getElementById('scoreRow');
  if(sr) sr.textContent = 'Score ' + game.score;
  var kn = document.getElementById('killsNum');
  if(kn) kn.textContent = game.kills;
  var zl = document.getElementById('zombiesLeft');
  if(zl) zl.textContent = game.zombies.length;

  var df = document.getElementById('damage-flash');
  if(df) df.style.opacity = game.damageFlash;

  updateWeaponHud();
  updateSlotsHud();
  updateCallButton();
  updateMobileHUD();
}

function updateWeaponHud(){
  var p = game.player;
  var wk = getCurrentWeaponKey();
  var w = window.Weapons.get(wk);
  if(!w) return;

  var wEl = document.getElementById('weaponRow');
  var ammoEl = document.getElementById('ammoCount');
  var wNameEl = document.getElementById('ammoWeapon');
  var reloadEl = document.getElementById('reloadTag');

  var ammoText = '';
  if(wk === 'pistol'){
    ammoText = p.ammo.pistol + ' / ∞';
  } else if(window.Weapons.isMelee(wk)){
    ammoText = 'melee';
  } else if(w.magSize){
    ammoText = p.ammo[wk] + ' / ' + (p.reserve[wk] != null ? p.reserve[wk] : '—');
  } else if(window.Weapons.isThrow(wk) || window.Weapons.isHeal(wk)){
    ammoText = 'x' + p.ammo[wk];
  } else {
    ammoText = '—';
  }

  if(wEl) wEl.innerHTML = '<span class="cur">' + w.name + '</span> — <span class="ammo">' + ammoText + '</span>';
  if(wNameEl) wNameEl.textContent = w.name;
  if(ammoEl) ammoEl.textContent = ammoText;

  if(reloadEl){
    if(p.reloading) reloadEl.textContent = 'RELOADING...';
    else if(w.magSize && p.ammo[wk] === 0) reloadEl.textContent = 'PRESS R TO RELOAD';
    else reloadEl.textContent = '';
  }
}

function updateSlotsHud(){
  var p = game.player;

  var s1n = document.getElementById('slot1Name');
  var s1s = document.getElementById('slot1Sub');
  if(s1n) s1n.textContent = window.Weapons.name(p.slot1);
  var s1Ammo = '';
  if(p.slot1 === 'shotgun') s1Ammo = p.reserve.shotgun + '';
  else if(p.slot1 === 'rifle') s1Ammo = p.reserve.rifle + '';
  else if(p.slot1 === 'smg') s1Ammo = p.reserve.smg + '';
  else if(p.slot1 === 'grenadeLauncher') s1Ammo = p.reserve.grenadeLauncher + '';
  else if(p.slot1 === 'sniper') s1Ammo = p.reserve.sniper + '';
  if(s1s) s1s.textContent = s1Ammo || 'empty';

  var s2n = document.getElementById('slot2Name');
  var s2s = document.getElementById('slot2Sub');
  if(s2n) s2n.textContent = window.Weapons.name(p.slot2);
  if(s2s) s2s.textContent = (p.slot2 === 'pistol') ? '∞' : 'melee';

  var s3s = document.getElementById('slot3Sub');
  if(s3s) s3s.textContent = p.ammo.aid || 0;

  var s4n = document.getElementById('slot4Name');
  var s4s = document.getElementById('slot4Sub');
  if(s4n) s4n.textContent = window.Weapons.name(p.slot4);
  if(s4s) s4s.textContent = p.ammo[p.slot4] || 0;

  var s5n = document.getElementById('slot5Name');
  var s5s = document.getElementById('slot5Sub');
  if(s5n) s5n.textContent = window.Weapons.name(p.slot5);
  if(s5s) s5s.textContent = p.ammo[p.slot5] || 0;

  var slots = document.querySelectorAll('#slotsHud .slot');
  for(var i = 0; i < slots.length; i++){
    var n = parseInt(slots[i].getAttribute('data-slot'), 10);
    if(n === p.currentSlot) slots[i].classList.add('active');
    else slots[i].classList.remove('active');
  }
}

function updateMobileHUD(){
  var p = game.player;
  if(!window.Touch || !window.Touch.isActive()) return;

  var pct = Math.max(0, p.hp / p.maxHp * 100);
  var mBar = document.getElementById('mHealthBar');
  if(mBar){
    mBar.style.width = pct + '%';
    if(pct > 55) mBar.style.background = 'linear-gradient(90deg, #6b8f3f, #8fc760)';
    else if(pct > 25) mBar.style.background = 'linear-gradient(90deg, #c98a2e, #e0a83f)';
    else mBar.style.background = 'linear-gradient(90deg, #a32f22, #e0523c)';
  }

  var mNum = document.getElementById('mHealthNum');
  if(mNum) mNum.textContent = Math.ceil(p.hp);

  var mKills = document.getElementById('mKillsNum');
  if(mKills) mKills.textContent = game.kills;

  var s1 = document.getElementById('mSlot1Ammo');
  if(s1) s1.textContent = p.reserve[p.slot1] || p.ammo[p.slot1] || '0';

  var s2 = document.getElementById('mSlot2Ammo');
  if(s2) s2.textContent = (p.slot2 === 'pistol') ? '∞' : 'M';

  var s3 = document.getElementById('mSlot3Ammo');
  if(s3) s3.textContent = p.ammo.aid || 0;

  var s4 = document.getElementById('mSlot4Ammo');
  if(s4) s4.textContent = p.ammo[p.slot4] || 0;

  var s5 = document.getElementById('mSlot5Ammo');
  if(s5) s5.textContent = p.ammo[p.slot5] || 0;

  var mslots = document.querySelectorAll('.m-slot');
  for(var i = 0; i < mslots.length; i++){
    var n = parseInt(mslots[i].getAttribute('data-slot'), 10);
    if(n === p.currentSlot) mslots[i].classList.add('active');
    else mslots[i].classList.remove('active');
  }

  // Mobile call button
  var mCallBtn = document.getElementById('mCallBtn');
  if(mCallBtn){
    if(game.hasRadio && game.heli.state === HELI_STATE.NONE){
      mCallBtn.classList.add('show');
      var lbl = document.getElementById('mCallLabel');
      if(lbl) lbl.textContent = 'CALL';
    } else {
      mCallBtn.classList.remove('show');
    }
  }

  // Mobile heli timer
  var mHeliTimer = document.getElementById('mHeliTimer');
  if(mHeliTimer){
    var h = game.heli;
    if(h.state === HELI_STATE.INCOMING){
      var totalSec = Math.max(0, Math.ceil(h.timer / 60));
      var mm = Math.floor(totalSec / 60);
      var ss = totalSec % 60;
      mHeliTimer.classList.add('show');
      mHeliTimer.classList.add('horde');
      mHeliTimer.textContent = '⚠ HELI ' + mm + ':' + (ss < 10 ? '0' : '') + ss;
    } else if(h.state === HELI_STATE.ARRIVED){
      mHeliTimer.classList.add('show');
      mHeliTimer.classList.remove('horde');
      mHeliTimer.textContent = '✓ HELI ARRIVED';
    } else {
      mHeliTimer.classList.remove('show');
    }
  }
}

var bannerTimeout = null;
function showBanner(text, color){
  var el = document.getElementById('center-banner');
  if(!el) return;
  el.textContent = text;
  el.style.color = color || 'var(--blood-hot)';
  el.classList.add('show');
  clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(function(){ el.classList.remove('show'); }, 2200);
}

// ============================================================
// RENDER
// ============================================================
function drawEntity(e, fillColor, darkColor, r){
  ctx.save();
  ctx.translate(e.x, e.y);
  var flash = e.hitFlash > 0;
  ctx.fillStyle = flash ? '#eee' : fillColor;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = flash ? '#ccc' : darkColor;
  ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.85, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawNameplate(ent, name, hp, maxHp, color, isDown){
  var yOff = ent.r + 18;
  ctx.save();
  ctx.font = 'bold 11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  var textW = ctx.measureText(name).width;
  var boxW = Math.max(textW + 14, 46);
  var boxH = 22;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(ent.x - boxW / 2, ent.y + yOff - boxH / 2, boxW, boxH);
  ctx.fillStyle = isDown ? '#888' : color;
  ctx.fillText(name, ent.x, ent.y + yOff - 4);
  var barY = ent.y + yOff + 4;
  var barW = boxW - 8;
  var barX = ent.x - barW / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(barX, barY, barW, 3);
  var pct = Math.max(0, hp / maxHp);
  ctx.fillStyle = isDown ? '#555' : (pct > 0.55 ? '#6b8f3f' : pct > 0.25 ? '#c98a2e' : '#e0523c');
  ctx.fillRect(barX, barY, barW * pct, 3);
  ctx.restore();
}

function drawRadio(){
  if(!game.radioPickup || game.hasRadio) return;
  var rp = game.radioPickup;
  var bobY = Math.sin(rp.bob) * 5;
  ctx.save();
  ctx.translate(rp.x, rp.y + bobY);
  var pulse = 0.6 + Math.sin(rp.bob * 1.5) * 0.4;
  ctx.fillStyle = 'rgba(201,138,46,' + (0.15 * pulse) + ')';
  ctx.beginPath(); ctx.arc(0, 0, 40 + pulse * 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a2418';
  ctx.beginPath(); ctx.arc(0, 0, rp.r + 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a3226';
  ctx.fillRect(-12, -9, 24, 18);
  ctx.strokeStyle = '#c98a2e';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-12, -9, 24, 18);
  ctx.beginPath(); ctx.moveTo(8, -9); ctx.lineTo(14, -22); ctx.stroke();
  ctx.fillStyle = '#6b8f3f';
  ctx.fillRect(-9, -6, 10, 6);
  ctx.fillStyle = '#c98a2e';
  ctx.beginPath(); ctx.arc(6, 0, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, 6, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.font = 'bold 11px ui-monospace, monospace';
  ctx.fillStyle = '#c98a2e';
  ctx.textAlign = 'center';
  ctx.fillText('RADIO', rp.x, rp.y - 32);
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(216,209,194,0.7)';
  ctx.fillText('pick it up', rp.x, rp.y - 20);
  ctx.restore();
}

function drawHelicopter(){
  var h = game.heli;
  if(h.state === HELI_STATE.NONE || h.state === HELI_STATE.CALLING || h.state === HELI_STATE.GONE) return;
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(h.angle);
  ctx.scale(h.scale, h.scale);
  ctx.fillStyle = '#2c2a27';
  ctx.beginPath(); ctx.ellipse(0, 0, 32, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-40, -3, 20, 6);
  ctx.fillStyle = '#4a6a8a';
  ctx.beginPath(); ctx.ellipse(18, 0, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
  var t = performance.now() / 30;
  ctx.strokeStyle = 'rgba(200,200,200,0.75)';
  ctx.lineWidth = 2.5;
  for(var i = 0; i < 3; i++){
    var a = t + i * (Math.PI * 2 / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 38, Math.sin(a) * 38);
    ctx.stroke();
  }
  ctx.restore();

  if(h.state === HELI_STATE.ARRIVED){
    ctx.save();
    ctx.strokeStyle = 'rgba(122,212,74,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.arc(h.x, h.y, h.pickupRadius, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.save();
  ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.fillStyle = '#7ad44a';
  ctx.textAlign = 'center';
  ctx.fillText('HELICOPTER', h.x, h.y - 70);
  ctx.restore();
}

function render(){
  ctx.save();
  if(game.shake > 0){
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0d0b0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-game.camera.x, -game.camera.y);

  // World
  window.World.render(ctx, game.camera, canvas.width, canvas.height);

  // Fire zones
  for(var fi = 0; fi < game.fireZones.length; fi++){
    var f = game.fireZones[fi];
    var alpha = 0.35 * (f.life / f.maxLife);
    ctx.fillStyle = 'rgba(224,82,60,' + alpha + ')';
    ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,204,68,' + (alpha * 0.6) + ')';
    ctx.beginPath(); ctx.arc(f.x, f.y, f.radius * 0.6, 0, Math.PI * 2); ctx.fill();
  }

  // Explosions
  for(var ei = 0; ei < game.explosions.length; ei++){
    var e = game.explosions[ei];
    var ea = e.life / e.maxLife;
    ctx.fillStyle = 'rgba(255,154,58,' + (ea * 0.7) + ')';
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(224,82,60,' + ea + ')';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.stroke();
  }

  // Pickups
  for(var i = 0; i < game.pickups.length; i++){
    var pk = game.pickups[i];
    var bobY = Math.sin(pk.bob) * 4;
    ctx.save();
    ctx.translate(pk.x, pk.y + bobY);
    if(pk.justDropped){
      var pulse = 0.6 + Math.sin(pk.bob * 2) * 0.4;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.12 * pulse) + ')';
      ctx.beginPath(); ctx.arc(0, 0, pk.r + 14, 0, Math.PI * 2); ctx.fill();
    }
    if(pk.type === 'health'){
      ctx.fillStyle = '#1c2b18'; ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7fbf52';
      ctx.fillRect(-3, -10, 6, 20); ctx.fillRect(-10, -3, 20, 6);
    } else if(pk.type === 'ammo_pistol'){
      ctx.fillStyle = '#2a2418'; ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c98a2e';
      ctx.fillRect(-9, -7, 18, 14);
      ctx.fillStyle = '#f0d98a';
      ctx.fillRect(-5, -2, 3, 4); ctx.fillRect(-1, -2, 3, 4); ctx.fillRect(3, -2, 3, 4);
    } else if(pk.type === 'ammo_rifle'){
      ctx.fillStyle = '#1a2418'; ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b8f3f';
      ctx.fillRect(-9, -7, 18, 14);
      ctx.fillStyle = '#f0d98a';
      ctx.fillRect(-5, -2, 10, 3);
    } else if(pk.type === 'aid'){
      ctx.fillStyle = '#1c2b18'; ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7fbf52';
      ctx.fillRect(-9, -7, 18, 14);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-2, -5, 4, 10); ctx.fillRect(-5, -2, 10, 4);
    } else if(pk.type === 'grenade'){
      ctx.fillStyle = '#1a2418'; ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b8f3f';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    } else if(pk.type === 'pipebomb'){
      ctx.fillStyle = '#2a1e18'; ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c98a2e';
      ctx.fillRect(-9, -4, 18, 8);
    } else {
      ctx.fillStyle = '#2a1e18'; ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0523c';
      ctx.fillRect(-9, -7, 18, 14);
      ctx.fillStyle = '#f0d98a';
      ctx.fillRect(-5, -2, 10, 4);
    }
    ctx.restore();
  }

  // Thrown items
  for(var ti = 0; ti < game.thrownItems.length; ti++){
    var t = game.thrownItems[ti];
    ctx.save();
    ctx.translate(t.x, t.y);
    if(t.type === 'grenade'){
      ctx.fillStyle = '#4a5a3a';
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    } else if(t.type === 'pipebomb'){
      ctx.fillStyle = '#c98a2e';
      ctx.fillRect(-7, -3, 14, 6);
      if(Math.floor(t.fuse / 10) % 2 === 0){
        ctx.fillStyle = '#e0523c';
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      }
    } else if(t.type === 'fire'){
      ctx.fillStyle = '#e0523c';
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  drawRadio();

  // Zombie projectiles
  ctx.fillStyle = '#7fae52';
  for(var pj = 0; pj < game.zProjectiles.length; pj++){
    var pr = game.zProjectiles[pj];
    ctx.fillStyle = pr.kind === 'rock' ? '#8a6a3a' : '#7fae52';
    ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.kind === 'rock' ? 7 : 5, 0, Math.PI * 2); ctx.fill();
  }

  drawHelicopter();

  // Zombies
  for(var zi2 = 0; zi2 < game.zombies.length; zi2++){
    var z = game.zombies[zi2];
    var cfg = window.Zombies.get(z.type);

    if(cfg.big){
      ctx.save();
      ctx.fillStyle = 'rgba(163,47,34,0.12)';
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r + 10, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawEntity(z, cfg.color, cfg.dark, z.r);

    ctx.fillStyle = '#c94a3a';
    ctx.beginPath(); ctx.arc(z.x - z.r * 0.3, z.y - z.r * 0.15, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(z.x + z.r * 0.3, z.y - z.r * 0.15, 2.2, 0, Math.PI * 2); ctx.fill();

    // Tank maxsus effekt
    if(z.type === 'tank'){
      if(z.entranceEffect > 0){
        z.entranceEffect -= 1;
        var ef = z.entranceEffect / 60;
        ctx.strokeStyle = 'rgba(224,82,60,' + ef + ')';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r + 60 * (1 - ef), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(163,47,34,0.25)';
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r + 15, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.font = 'bold 14px ui-monospace, monospace';
      ctx.fillStyle = '#e0523c';
      ctx.textAlign = 'center';
      ctx.fillText('TANK', z.x, z.y - z.r - 22);
      ctx.restore();
    }

    if(cfg.hp > 30){
      var ww = z.r * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(z.x - ww / 2, z.y - z.r - 10, ww, 4);
      ctx.fillStyle = '#c94a3a';
      ctx.fillRect(z.x - ww / 2, z.y - z.r - 10, ww * (z.hp / z.maxHp), 4);
    }

    // Smoker tongue
    if(z.tongue){
      ctx.strokeStyle = '#c94a3a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(z.x, z.y);
      ctx.lineTo(z.tongue.x, z.tongue.y);
      ctx.stroke();
      ctx.fillStyle = '#e0523c';
      ctx.beginPath(); ctx.arc(z.tongue.x, z.tongue.y, 6, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Bullets
  ctx.fillStyle = '#f0d98a';
  for(var bi = 0; bi < game.bullets.length; bi++){
    var bb = game.bullets[bi];
    ctx.beginPath(); ctx.arc(bb.x, bb.y, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Particles
  for(var pti = 0; pti < game.particles.length; pti++){
    var pt = game.particles[pti];
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;

  // Companions
  for(var cci = 0; cci < game.companions.length; cci++){
    var c = game.companions[cci];
    ctx.save();
    ctx.translate(c.x, c.y);
    var cf = c.hitFlash > 0;
    ctx.fillStyle = cf ? '#fff' : (c.isDown ? '#666' : '#c9bfa8');
    ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cf ? '#ddd' : (c.isDown ? '#444' : c.color);
    ctx.beginPath(); ctx.arc(0, c.r * 0.2, c.r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = '#2c2a27';
    ctx.fillRect(9, -3, 20, 6);
    ctx.restore();
  }

  // Player
  var p = game.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  var pf = p.hitFlash > 0;
  ctx.fillStyle = pf ? '#fff' : '#c9bfa8';
  ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pf ? '#ddd' : '#39506b';
  ctx.beginPath(); ctx.arc(0, p.r * 0.2, p.r * 0.85, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.fillStyle = '#2c2a27';
  ctx.fillRect(10, -3, 24, 6);
  ctx.restore();

  // Nameplates
  for(var npi = 0; npi < game.companions.length; npi++){
    var cc3 = game.companions[npi];
    drawNameplate(cc3, cc3.name, cc3.hp, cc3.maxHp, cc3.color, cc3.isDown);
  }
  drawNameplate(p, 'You', p.hp, p.maxHp, '#7ad44a', false);

  ctx.restore();
  ctx.restore();
}

// ============================================================
// LOOP
// ============================================================
function loop(ts){
  var dt = Math.min((ts - lastTs) / 16.6667, 3) || 1;
  lastTs = ts;
  if(game && game.running && !game.paused){
    update(dt);
    render();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ============================================================
// HIGH SCORE / END / RESTART
// ============================================================
function getHighScore(){
  try{ return parseInt(localStorage.getItem('letfordead_highscore') || '0', 10); }catch(e){ return 0; }
}
function setHighScore(v){
  try{ localStorage.setItem('letfordead_highscore', String(v)); }catch(e){}
}

function showGameOverScreen(title, statusText, isWin){
  var el = document.getElementById('gameOver');
  if(!el) return;
  var st = document.getElementById('gameOverStatus');
  if(st) st.textContent = statusText;
  var titleEl = document.getElementById('gameOverTitle');
  if(titleEl){
    titleEl.textContent = title;
    titleEl.classList.toggle('win', !!isWin);
  }
  var best = Math.max(getHighScore(), game.score);
  setHighScore(best);
  var fs = document.getElementById('finalScore');
  if(fs) fs.textContent = game.score;
  var fk = document.getElementById('finalKills');
  if(fk) fk.textContent = game.kills;
  var bs = document.getElementById('bestScore');
  if(bs) bs.textContent = best;
  el.classList.add('show');
}

function loseGame(){
  if(game.over) return;
  game.running = false;
  game.over = true;
  game.won = false;
  window.SFX.sfx.death();
  window.Music.stopAll();
  var ha = document.getElementById('horde-alert');
  if(ha) ha.classList.remove('show');
  var vo = document.getElementById('vomit-overlay');
  if(vo) vo.classList.remove('show');
  var ta = document.getElementById('tank-alert');
  if(ta) ta.classList.remove('show');

  setTimeout(function(){
    showGameOverScreen('YOU DIED', 'Transmission ended', false);
  }, 500);

  window.dispatchEvent(new CustomEvent('gameover', {
    detail: { score: game.score, kills: game.kills, win: false }
  }));
}

function winGame(){
  if(game.over) return;
  game.running = false;
  game.over = true;
  game.won = true;
  window.Music.stopAll();
  var ha = document.getElementById('horde-alert');
  if(ha) ha.classList.remove('show');
  var vo = document.getElementById('vomit-overlay');
  if(vo) vo.classList.remove('show');
  var ta = document.getElementById('tank-alert');
  if(ta) ta.classList.remove('show');

  setTimeout(function(){
    showGameOverScreen('RESCUED', 'You survived the outbreak', true);
  }, 500);

  window.dispatchEvent(new CustomEvent('gameover', {
    detail: { score: game.score, kills: game.kills, win: true }
  }));
}

function restartGame(){
  window.Music.stopAll();

  var ids = ['gameOver', 'callBtn', 'heliTimer', 'horde-alert', 'pauseScreen', 'autoModeTag', 'tank-alert', 'vomit-overlay'];
  for(var i = 0; i < ids.length; i++){
    var el = document.getElementById(ids[i]);
    if(el) el.classList.remove('show');
  }

  var mcb = document.getElementById('mCallBtn');
  if(mcb) mcb.classList.remove('show');
  var mht = document.getElementById('mHeliTimer');
  if(mht) mht.classList.remove('show');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  game = newGame();
  window.AI.initCompanions(game);
  spawnRadio();
  lastTs = performance.now();

  updateCallButton();
  updateSlotsHud();
  updateWeaponHud();
  updateMobileHUD();
}

// ============================================================
// EXPORTS (ai.js, touch.js uchun)
// ============================================================
window.Game = {
  getCurrentWeaponKey: getCurrentWeaponKey,
  performShoot: performShoot,
  showBanner: showBanner,
  loseGame: loseGame,
  winGame: winGame,
  updateCallButton: updateCallButton,
  togglePause: togglePause,
  selectSlot: selectSlot,
  callHelicopter: callHelicopter,
  cycleWeapon: cycleWeapon,
  reloadCurrent: reloadCurrent
};

// ============================================================
// START
// ============================================================
function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

resizeCanvas();
window.Music.load();
game = newGame();
window.AI.initCompanions(game);
spawnRadio();
updateCallButton();
updateSlotsHud();
updateWeaponHud();

// === TOUCH BOSHQARUVNI ISHGA TUSHIRISH ===
if(window.Touch){
  window.Touch.init();
  updateMobileHUD();
}

document.addEventListener('visibilitychange', function(){
  if(!game) return;
  if(document.hidden){
    if(game.running && !game.paused){ game.running = false; pausedByVisibility = true; }
    window.Music.pause();
  } else if(pausedByVisibility && !game.over && !game.paused){
    game.running = true;
    pausedByVisibility = false;
    lastTs = performance.now();
    window.Music.resume();
  }
});

})();