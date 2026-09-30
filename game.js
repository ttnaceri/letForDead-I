// ============================================================
// game.js — Asosiy o'yin fayli
// Let For Dead
// ============================================================
(function(){
'use strict';

var canvas = document.getElementById('gameCanvas');
if(!canvas){
  console.error('XATO: gameCanvas topilmadi!');
  return;
}
var ctx = canvas.getContext('2d');
window.__canvas = canvas;

var game = null;
var pausedByVisibility = false;
var lastTs = 0;

var HELI_STATE = {
  NONE: 'none',
  CALLING: 'calling',
  INCOMING: 'incoming',
  ARRIVED: 'arrived',
  BOARDING: 'boarding',
  LEAVING: 'leaving',
  GONE: 'gone'
};
if(window.Help && window.Help.HELI_STATE){
  HELI_STATE = window.Help.HELI_STATE;
}

// ============================================================
// YANGI O'YIN
// ============================================================
function newGame(){
  var ammo, reserve;
  if(window.Weapons){
    ammo = window.Weapons.newPlayerAmmo();
    reserve = window.Weapons.newPlayerReserve();
  } else {
    ammo = { pistol: 7, shotgun: 0, rifle: 0, smg: 0, grenadeLauncher: 0, sniper: 0, aid: 0, grenade: 0, pipebomb: 0, molotov: 0, bile: 0, syringe: 0, pills: 0 };
    reserve = { pistol: 999, shotgun: 0, rifle: 0, smg: 0, grenadeLauncher: 0, sniper: 0 };
  }

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
      slot1: 'shotgun', slot2: 'pistol', slot3: 'aid',
      slot4: 'grenade', slot5: 'syringe',
      currentSlot: 2,
      ammo: ammo, reserve: reserve,
      reloading: false, reloadTimer: 0,
      meleeCooldown: 0, hurtCooldown: 0,
      name: 'You', color: '#7ad44a', isPlayer: true,
      hitFlash: 0, pushCooldown: 0,
      pinned: null, ridden: null, smoked: null, charged: null,
      vomitTimer: 0, crippled: null,
      knockbackVX: 0, knockbackVY: 0,
      // === YANGI ===
      hasInfiniteAmmo: false,
      hasLaser: false,
      aidHolding: false,
      aidHoldTimer: 0
    },

    companions: [],

    heli: {
      state: HELI_STATE.NONE,
      timer: 0,
      x: 0, y: 0,
      angle: 0,
      pickupRadius: 140,
      scale: 3.0,
      tankWarned: false,
      hordeSoundPlayed: false,
      hordeSoundTimer: 0
    },

    tank: {
      spawned: false,
      alive: null,
      spawnDelay: 0,
      killed: false
    }
  };
}

window.__newGame = newGame;

// ============================================================
// PAUSE / AUTO
// ============================================================
function togglePause(){
  if(!game || game.over) return;
  game.paused = !game.paused;
  var el = document.getElementById('pauseScreen');
  if(game.paused){
    if(el) el.classList.add('show');
    if(window.Music) window.Music.pause();
  } else {
    if(el) el.classList.remove('show');
    if(window.Music) window.Music.resume();
    lastTs = performance.now();
  }
}

function toggleAutoMode(){
  if(!game || !game.running) return;
  game.autoMode = !game.autoMode;
  var tag = document.getElementById('autoModeTag');
  if(game.autoMode){
    if(tag) tag.classList.add('show');
    if(window.HUD) window.HUD.showBanner('AUTO MODE ON', '#c98a2e');
  } else {
    if(tag) tag.classList.remove('show');
    if(window.HUD) window.HUD.showBanner('AUTO MODE OFF', '#c98a2e');
  }
}

// ============================================================
// RESTART
// ============================================================
function restartGame(){
  if(window.Music) window.Music.stopAll();
  if(window.HUD){
    if(window.HUD.stopEndCredits) window.HUD.stopEndCredits();
    if(window.HUD.reset) window.HUD.reset();
  }

  var ids = ['gameOver', 'callBtn', 'heliTimer', 'horde-alert',
             'pauseScreen', 'autoModeTag', 'tank-alert', 'vomit-overlay'];
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
  window.__game = game;
  if(window.AI && window.AI.initCompanions) window.AI.initCompanions(game);
  if(window.Help && window.Help.spawnRadio) window.Help.spawnRadio(game);
  lastTs = performance.now();

  if(window.HUD) window.HUD.update(game);
  console.log('[Game] Restarted');
}

// ============================================================
// GLOBAL API
// ============================================================
window.Game = window.Game || {};

window.Game.togglePause = togglePause;
window.Game.toggleAuto = toggleAutoMode;
window.Game.restart = restartGame;
window.Game.getGame = function(){ return game; };

window.Game.selectSlot = function(n){
  if(window.Player && window.Player.selectSlot) window.Player.selectSlot(game, n);
};
window.Game.cycleWeapon = function(){
  if(window.Player && window.Player.cycleWeapon) window.Player.cycleWeapon(game);
};
window.Game.reloadCurrent = function(){
  if(window.Player && window.Player.reloadCurrent) window.Player.reloadCurrent(game);
};
window.Game.callHelicopter = function(){
  if(window.Help && window.Help.callHelicopter) window.Help.callHelicopter(game);
};
window.Game.getCurrentWeaponKey = function(){
  if(window.Player && window.Player.getCurrentWeaponKey) return window.Player.getCurrentWeaponKey(game);
  return 'pistol';
};
window.Game.showBanner = function(t, c){
  if(window.HUD) window.HUD.showBanner(t, c);
};

// === E — Interact (radio / pickup) ===
window.Game.interactKey = function(){
  if(!game) return;

  // 1. Radio bormi?
  if(window.Help && window.Help.tryPickupRadio){
    if(window.Help.tryPickupRadio(game)) return;
  }

  // 2. Pickup
  if(window.Items && window.Items.tryInteract){
    window.Items.tryInteract(game);
  }
};

// === AID bosib turish ===
window.Game.startHold = function(){
  if(window.Player && window.Player.startHold) window.Player.startHold(game);
};
window.Game.stopHold = function(){
  if(window.Player && window.Player.stopHold) window.Player.stopHold(game);
};

// ============================================================
// UPDATE
// ============================================================
function update(dt){
  if(!game) return;
  var p = game.player;
  game.elapsed += dt / 60;

  // 1. INPUT
  var input = null;
  if(window.Controller && typeof window.Controller.readInput === 'function'){
    input = window.Controller.readInput(game);
  }
  if(!input){
    input = {
      moveX: 0, moveY: 0,
      aimX: 0, aimY: 0, hasAim: false,
      firing: false, pushing: false, reload: false,
      interact: false,
      autoMode: game.autoMode,
      keys: {},
      isMobile: false
    };
  }

  // 2. PLAYER
  if(window.Player && typeof window.Player.update === 'function'){
    window.Player.update(game, dt, input);
  }

  // 3. AUTO MODE
  if(game.autoMode && window.AI && window.AI.updateAutoMode){
    window.AI.updateAutoMode(game, dt);
  }

  if(p.hurtCooldown > 0) p.hurtCooldown -= dt;

  // 4. COMPANIONS
  if(window.AI && window.AI.updateCompanion){
    for(var ci = 0; ci < game.companions.length; ci++){
      window.AI.updateCompanion(game, game.companions[ci], dt);
    }
  }

  // 5. BULLETS
  for(var i = game.bullets.length - 1; i >= 0; i--){
    var b = game.bullets[i];
    b.x += b.dx * dt;
    b.y += b.dy * dt;
    b.life -= dt;
    if(b.life <= 0){ game.bullets.splice(i, 1); continue; }

    for(var j = game.zombies.length - 1; j >= 0; j--){
      var z = game.zombies[j];
      if(Math.hypot(b.x - z.x, b.y - z.y) < z.r){
        z.hp -= b.dmg;
        z.hitFlash = 6;
        if(window.Zombies && window.Zombies.spawnParticles){
          window.Zombies.spawnParticles(game, b.x, b.y, 5, '#c94a3a', 3);
        }
        if(window.SFX) window.SFX.sfx.hit();
        game.bullets.splice(i, 1);
        if(z.hp <= 0 && window.Zombies) window.Zombies.kill(game, j);
        break;
      }
    }
  }

  // 6. ZOMBIES
  if(window.Zombies && window.Zombies.update){
    for(var zi = game.zombies.length - 1; zi >= 0; zi--){
      var zz = game.zombies[zi];
      window.Zombies.update(game, zz, dt);
      if(zz.hp <= 0) window.Zombies.kill(game, zi);
    }
  }

  // 7. ZOMBIE PROJECTILES
  for(var pi = game.zProjectiles.length - 1; pi >= 0; pi--){
    var pr = game.zProjectiles[pi];
    pr.x += pr.dx * dt;
    pr.y += pr.dy * dt;
    pr.life -= dt;
    if(pr.life <= 0){ game.zProjectiles.splice(pi, 1); continue; }

    if(Math.hypot(pr.x - p.x, pr.y - p.y) < p.r + 5){
      if(window.Zombies) window.Zombies.damagePlayer(game, pr.dmg || 8);
      if(window.Zombies && window.Zombies.spawnParticles){
        window.Zombies.spawnParticles(game, pr.x, pr.y, 6,
          pr.kind === 'rock' ? '#8a6a3a' : '#6b8f3f', 3);
      }
      if(pr.kind === 'rock') game.shake = 10;
      game.zProjectiles.splice(pi, 1);
      continue;
    }

    var hitC = false;
    for(var ci2 = 0; ci2 < game.companions.length; ci2++){
      var cc = game.companions[ci2];
      if(cc.isDown) continue;
      if(Math.hypot(pr.x - cc.x, pr.y - cc.y) < cc.r + 5){
        if(window.Zombies) window.Zombies.damageCompanion(game, cc, pr.dmg || 8);
        if(window.Zombies && window.Zombies.spawnParticles){
          window.Zombies.spawnParticles(game, pr.x, pr.y, 6, '#6b8f3f', 3);
        }
        game.zProjectiles.splice(pi, 1);
        hitC = true;
        break;
      }
    }
    if(hitC) continue;
  }

  // 8. PARTICLES
  for(var qi = game.particles.length - 1; qi >= 0; qi--){
    var pt = game.particles[qi];
    pt.x += pt.dx * dt;
    pt.y += pt.dy * dt;
    pt.dx *= 0.94;
    pt.dy *= 0.94;
    pt.life -= dt;
    if(pt.life <= 0) game.particles.splice(qi, 1);
  }

  // 9. ITEMS
  if(window.Items){
    if(window.Items.update) window.Items.update(game, dt, canvas);
    if(window.Items.updateThrown) window.Items.updateThrown(game, dt);
    if(window.Items.updateFireZones) window.Items.updateFireZones(game, dt);
    if(window.Items.updateExplosions) window.Items.updateExplosions(game, dt);
  }

  // 10. HELP
  if(window.Help){
    if(window.Help.updateRadio) window.Help.updateRadio(game, dt);
    if(window.Help.updateHelicopter) window.Help.updateHelicopter(game, dt);
    if(window.Help.updateTankSpawn) window.Help.updateTankSpawn(game, dt);
  }

  // 11. SPAWN
  game.spawnTimer -= dt;
  if(game.spawnTimer <= 0){
    var t = game.elapsed;
    var rate = Math.max(12, 40 - t * 0.15);   // sekinroq spawn
    var spawnCount = 1;

    if(game.hordeActive && game.heli.state === HELI_STATE.INCOMING){
      rate = 8;                                 // horde paytida 4 → 8
      spawnCount = 2;
      if(Math.random() < 0.4) spawnCount = 3;   // 0.5 → 0.4
    } else if(game.heli.state === HELI_STATE.INCOMING){
      rate = Math.max(6, rate * 0.6);
    } else if(game.heli.state === HELI_STATE.ARRIVED){
      rate = Math.max(5, rate * 0.5);
    }

    if(t > 60 && Math.random() < 0.25 && spawnCount === 1) spawnCount = 2;
    if(t > 120 && Math.random() < 0.35 && spawnCount < 3) spawnCount = 3;

    if(window.Zombies && window.Zombies.pickType && window.Zombies.spawn){
      for(var sc = 0; sc < spawnCount; sc++){
        var type = window.Zombies.pickType(game);
        window.Zombies.spawn(game, type, canvas.width, canvas.height);
      }
    }
    game.spawnTimer = rate * (0.7 + Math.random() * 0.6);
  }

  // 12. HORDE
  game.hordeTimer -= dt;
  if(game.hordeTimer <= 0 && !game.hordeActive && game.heli.state === HELI_STATE.NONE){
    game.hordeActive = true;
    game.hordeCount = 15 + Math.floor(game.elapsed * 0.3);
    if(window.HUD) window.HUD.showBanner('HORDE INCOMING');
    if(window.SFX) window.SFX.sfx.zombieGroan();
  }
  if(game.hordeActive && game.hordeCount > 0 && game.heli.state === HELI_STATE.NONE){
    if(Math.random() < 0.3 && window.Zombies && window.Zombies.spawn){
      var ht = window.Zombies.pickType(game);
      window.Zombies.spawn(game, ht, canvas.width, canvas.height);
      game.hordeCount--;
    }
    if(game.hordeCount <= 0){
      game.hordeActive = false;
      game.hordeTimer = 500 + Math.random() * 300;
    }
  }

  // 13. RANDOM PICKUPS
  if(Math.random() < 0.0008 && game.pickups.length < 4){
    var ang2 = Math.random() * Math.PI * 2;
    var d2 = 500 + Math.random() * 700;
    var px = p.x + Math.cos(ang2) * d2;
    var py = p.y + Math.sin(ang2) * d2;
    var roll = Math.random();
    var type2;
    if(roll < 0.30) type2 = 'health';
    else if(roll < 0.45) type2 = 'ammo_pistol';
    else if(roll < 0.60) type2 = 'ammo_shotgun';
    else if(roll < 0.72) type2 = 'ammo_rifle';
    else if(roll < 0.80) type2 = 'aid';
    else if(roll < 0.87) type2 = 'grenade';
    else if(roll < 0.92) type2 = 'pipebomb';
    else if(roll < 0.96) type2 = 'laser';
    else type2 = 'ammo_patron';
    game.pickups.push({
      type: type2, x: px, y: py, r: 14,
      bob: Math.random() * Math.PI * 2
    });
  }

  // 14. GROANS
  game.groanTimer -= dt;
  if(game.groanTimer <= 0 && game.zombies.length > 0){
    if(Math.random() < 0.3 && window.SFX) window.SFX.sfx.zombieGroan();
    game.groanTimer = 60 + Math.random() * 120;
  }

  if(game.shake > 0) game.shake -= dt * 0.6;
  if(game.damageFlash > 0) game.damageFlash -= dt * 0.045;

  // 15. CAMERA
  var targetCamX = p.x - canvas.width / 2;
  var targetCamY = p.y - canvas.height / 2;
  game.camera.x += (targetCamX - game.camera.x) * 0.12 * dt;
  game.camera.y += (targetCamY - game.camera.y) * 0.12 * dt;

  // 16. HUD
  if(window.HUD) window.HUD.update(game);
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
  ctx.fillText('press E to pick up', rp.x, rp.y - 20);
  ctx.restore();
}

function drawHelicopter(){
  var h = game.heli;
  if(h.state === HELI_STATE.NONE ||
     h.state === HELI_STATE.CALLING ||
     h.state === HELI_STATE.GONE) return;

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
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.pickupRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.save();
  ctx.font = 'bold 12px ui-monospace, monospace';
  ctx.fillStyle = '#7ad44a';
  ctx.textAlign = 'center';
  ctx.fillText('HELICOPTER', h.x, h.y - 100);
  ctx.restore();
}

function render(){
  if(!game) return;

  ctx.save();
  if(game.shake > 0){
    ctx.translate(
      (Math.random() - 0.5) * game.shake,
      (Math.random() - 0.5) * game.shake
    );
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0d0b0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-game.camera.x, -game.camera.y);

  if(window.World && window.World.render){
    window.World.render(ctx, game.camera, canvas.width, canvas.height);
  }

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
      ctx.fillStyle = '#1c2b18';
      ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7fbf52';
      ctx.fillRect(-3, -10, 6, 20);
      ctx.fillRect(-10, -3, 20, 6);
    } else if(pk.type === 'ammo_pistol' || pk.type === 'ammo_patron'){
      ctx.fillStyle = '#2a2418';
      ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c98a2e';
      ctx.fillRect(-9, -7, 18, 14);
      ctx.fillStyle = '#f0d98a';
      ctx.fillRect(-5, -2, 3, 4);
      ctx.fillRect(-1, -2, 3, 4);
      ctx.fillRect(3, -2, 3, 4);
      if(pk.type === 'ammo_patron'){
        // Cheksiz belgisi
        ctx.fillStyle = '#7ad44a';
        ctx.font = 'bold 14px ui-monospace';
        ctx.textAlign = 'center';
        ctx.fillText('∞', 0, 4);
      }
    } else if(pk.type === 'ammo_rifle'){
      ctx.fillStyle = '#1a2418';
      ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b8f3f';
      ctx.fillRect(-9, -7, 18, 14);
      ctx.fillStyle = '#f0d98a';
      ctx.fillRect(-5, -2, 10, 3);
    } else if(pk.type === 'aid'){
      ctx.fillStyle = '#1c2b18';
      ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7fbf52';
      ctx.fillRect(-9, -7, 18, 14);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-2, -5, 4, 10);
      ctx.fillRect(-5, -2, 10, 4);
    } else if(pk.type === 'grenade'){
      ctx.fillStyle = '#1a2418';
      ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b8f3f';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    } else if(pk.type === 'pipebomb'){
      ctx.fillStyle = '#2a1e18';
      ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c98a2e';
      ctx.fillRect(-9, -4, 18, 8);
    } else if(pk.type === 'laser'){
      ctx.fillStyle = '#1a1a2a';
      ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a8ed4';
      ctx.fillRect(-8, -5, 16, 10);
      ctx.fillStyle = '#e0523c';
      ctx.beginPath(); ctx.arc(6, 0, 3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#2a1e18';
      ctx.beginPath(); ctx.arc(0, 0, pk.r + 4, 0, Math.PI * 2); ctx.fill();
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
  for(var pj = 0; pj < game.zProjectiles.length; pj++){
    var pr = game.zProjectiles[pj];
    ctx.fillStyle = pr.kind === 'rock' ? '#8a6a3a' : '#7fae52';
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, pr.kind === 'rock' ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHelicopter();

  // Zombies
  for(var zi2 = 0; zi2 < game.zombies.length; zi2++){
    var z = game.zombies[zi2];
    var cfg = window.Zombies ? window.Zombies.get(z.type) : null;
    if(!cfg) cfg = { color: '#5c6e4f', dark: '#33402b', big: false, hp: 30 };

    if(cfg.big){
      ctx.save();
      ctx.fillStyle = 'rgba(163,47,34,0.12)';
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r + 10, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawEntity(z, cfg.color, cfg.dark, z.r);

    ctx.fillStyle = '#c94a3a';
    ctx.beginPath();
    ctx.arc(z.x - z.r * 0.3, z.y - z.r * 0.15, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(z.x + z.r * 0.3, z.y - z.r * 0.15, 2.2, 0, Math.PI * 2);
    ctx.fill();

    if(z.type === 'tank'){
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

    if(z.tongue){
      ctx.strokeStyle = '#c94a3a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(z.x, z.y);
      ctx.lineTo(z.tongue.x, z.tongue.y);
      ctx.stroke();
      ctx.fillStyle = '#e0523c';
      ctx.beginPath();
      ctx.arc(z.tongue.x, z.tongue.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Bullets
  ctx.fillStyle = '#f0d98a';
  for(var bi = 0; bi < game.bullets.length; bi++){
    var bb = game.bullets[bi];
    ctx.beginPath();
    ctx.arc(bb.x, bb.y, 3, 0, Math.PI * 2);
    ctx.fill();
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

  // === LAZER ko'rinishi ===
  if(p.hasLaser){
    ctx.strokeStyle = 'rgba(255,50,50,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(600, 0);
    ctx.stroke();
    // Lazer nuqtasi
    ctx.fillStyle = 'rgba(255,80,80,1)';
    ctx.beginPath();
    ctx.arc(600, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

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
    try {
      update(dt);
      render();
    } catch(e){
      console.error('[Loop xato]', e);
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ============================================================
// RESIZE
// ============================================================
function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

// ============================================================
// START
// ============================================================
console.log('[Game] Starting...');
resizeCanvas();

if(window.Music && window.Music.load){
  window.Music.load();
  console.log('[Game] Music loaded');
}

game = newGame();
window.__game = game;

if(window.AI && window.AI.initCompanions){
  window.AI.initCompanions(game);
  console.log('[Game] Companions initialized');
}
if(window.Help && window.Help.spawnRadio){
  window.Help.spawnRadio(game);
  console.log('[Game] Radio spawned');
}
if(window.HUD) window.HUD.update(game);

if(window.Controller && window.Controller.init){
  window.Controller.init();
  console.log('[Game] Controller initialized');
} else {
  console.warn('[Game] Controller topilmadi!');
}

document.addEventListener('visibilitychange', function(){
  if(!game) return;
  if(document.hidden){
    if(game.running && !game.paused){
      game.running = false;
      pausedByVisibility = true;
    }
    if(window.Music) window.Music.pause();
  } else if(pausedByVisibility && !game.over && !game.paused){
    game.running = true;
    pausedByVisibility = false;
    lastTs = performance.now();
    if(window.Music) window.Music.resume();
  }
});

console.log('[Game] Ready!');

})();