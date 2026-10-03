// ============================================================
// weapons.js — L4D2 uslubidagi qurollar
// Let For Dead
// ============================================================
window.Weapons = (function(){
  'use strict';

  // ============================================================
  // WEAPON DEFINITIONS
  // ============================================================
  var DEFS = {

    // ============================================================
    // SLOT 2 — PISTOLS & MELEE
    // ============================================================
    pistol: {
      name: 'Pistol', slot: 2, kind: 'gun',
      damage: 22, cooldown: 13, bulletSpeed: 11, spread: 0.03, pellets: 1,
      magSize: 15, reloadTime: 60, infinite: true,
      color: '#c98a2e'
    },
    pistol_magnum: {
      name: 'Magnum', slot: 2, kind: 'gun',
      damage: 80, cooldown: 40, bulletSpeed: 14, spread: 0.02, pellets: 1,
      magSize: 8, reloadTime: 100, ammoMax: 100, ammoPerPickup: 24,
      color: '#a32f22'
    },
    pistol_silenced: {
      name: 'Silenced Pistol', slot: 2, kind: 'gun',
      damage: 24, cooldown: 12, bulletSpeed: 12, spread: 0.04, pellets: 1,
      magSize: 20, reloadTime: 65, ammoMax: 200, ammoPerPickup: 30,
      silent: true, color: '#5a5a5a'
    },
    melee: {
      name: 'Melee', slot: 2, kind: 'melee',
      damage: 45, cooldown: 22, meleeRange: 40, meleeArc: 1.2,
      infinite: true, color: '#837b6d'
    },
    machete: {
      name: 'Machete', slot: 2, kind: 'melee',
      damage: 70, cooldown: 26, meleeRange: 48, meleeArc: 1.35,
      infinite: true, color: '#d8d1c2'
    },
    axe: {
      name: 'Fire Axe', slot: 2, kind: 'melee',
      damage: 95, cooldown: 36, meleeRange: 46, meleeArc: 1.1,
      infinite: true, color: '#a32f22'
    },
    katana: {
      name: 'Katana', slot: 2, kind: 'melee',
      damage: 85, cooldown: 22, meleeRange: 52, meleeArc: 1.5,
      infinite: true, color: '#d8d1c2'
    },
    knife: {
      name: 'Combat Knife', slot: 2, kind: 'melee',
      damage: 55, cooldown: 14, meleeRange: 32, meleeArc: 1.0,
      infinite: true, color: '#d8d1c2'
    },
    crowbar: {
      name: 'Crowbar', slot: 2, kind: 'melee',
      damage: 60, cooldown: 18, meleeRange: 42, meleeArc: 1.1,
      infinite: true, color: '#8a5a2a'
    },
    chainsaw: {
      name: 'Chainsaw', slot: 2, kind: 'melee',
      damage: 100, cooldown: 6, meleeRange: 40, meleeArc: 0.9,
      infinite: true, color: '#c94a3a'
    },

    // ============================================================
    // SLOT 1 — SMG
    // ============================================================
    uzi: {
      name: 'UZI', slot: 1, kind: 'gun',
      damage: 12, cooldown: 4, bulletSpeed: 15, spread: 0.13, pellets: 1,
      magSize: 50, reloadTime: 90, ammoMax: 650, ammoPerPickup: 100,
      color: '#4a8ed4'
    },
    smg: {
      name: 'SMG', slot: 1, kind: 'gun',
      damage: 12, cooldown: 4, bulletSpeed: 15, spread: 0.13, pellets: 1,
      magSize: 50, reloadTime: 90, ammoMax: 650, ammoPerPickup: 100,
      color: '#4a8ed4'
    },
    mp5: {
      name: 'MP5', slot: 1, kind: 'gun',
      damage: 20, cooldown: 5, bulletSpeed: 16, spread: 0.09, pellets: 1,
      magSize: 40, reloadTime: 85, ammoMax: 500, ammoPerPickup: 80,
      color: '#4a8ed4'
    },
    silenced_smg: {
      name: 'Silenced SMG', slot: 1, kind: 'gun',
      damage: 18, cooldown: 4, bulletSpeed: 15, spread: 0.10, pellets: 1,
      magSize: 40, reloadTime: 80, ammoMax: 500, ammoPerPickup: 80,
      silent: true, color: '#5a5a5a'
    },

    // ============================================================
    // SLOT 1 — RIFLES
    // ============================================================
    rifle: {
      name: 'M16 Rifle', slot: 1, kind: 'gun',
      damage: 30, cooldown: 8, bulletSpeed: 13, spread: 0.06, pellets: 1,
      magSize: 30, reloadTime: 80, ammoMax: 360, ammoPerPickup: 60,
      color: '#6b8f3f'
    },
    ak47: {
      name: 'AK-47', slot: 1, kind: 'gun',
      damage: 45, cooldown: 10, bulletSpeed: 14, spread: 0.08, pellets: 1,
      magSize: 30, reloadTime: 90, ammoMax: 360, ammoPerPickup: 60,
      color: '#8a5a2a'
    },
    scar: {
      name: 'SCAR', slot: 1, kind: 'gun',
      damage: 55, cooldown: 14, bulletSpeed: 15, spread: 0.05, pellets: 1,
      magSize: 20, reloadTime: 100, ammoMax: 300, ammoPerPickup: 50,
      color: '#3a3a3a'
    },
    desert_rifle: {
      name: 'Desert Rifle', slot: 1, kind: 'gun',
      damage: 70, cooldown: 45, bulletSpeed: 20, spread: 0.01, pellets: 1,
      magSize: 10, reloadTime: 110, ammoMax: 120, ammoPerPickup: 20,
      color: '#c98a2e'
    },

    // ============================================================
    // SLOT 1 — SNIPERS
    // ============================================================
    sniper: {
      name: 'Hunting Rifle', slot: 1, kind: 'gun',
      damage: 90, cooldown: 60, bulletSpeed: 20, spread: 0.005, pellets: 1,
      magSize: 10, reloadTime: 130, ammoMax: 60, ammoPerPickup: 15,
      color: '#6b8f3f'
    },
    scout: {
      name: 'Scout', slot: 1, kind: 'gun',
      damage: 120, cooldown: 55, bulletSpeed: 24, spread: 0.003, pellets: 1,
      magSize: 10, reloadTime: 120, ammoMax: 80, ammoPerPickup: 18,
      color: '#4a8ed4'
    },
    military_sniper: {
      name: 'Military Sniper', slot: 1, kind: 'gun',
      damage: 150, cooldown: 80, bulletSpeed: 22, spread: 0.002, pellets: 1,
      magSize: 30, reloadTime: 150, ammoMax: 90, ammoPerPickup: 20,
      color: '#3a3a3a'
    },
    awp: {
      name: 'AWP', slot: 1, kind: 'gun',
      damage: 250, cooldown: 100, bulletSpeed: 25, spread: 0.001, pellets: 1,
      magSize: 5, reloadTime: 160, ammoMax: 40, ammoPerPickup: 10,
      color: '#2c2c2c'
    },

    // ============================================================
    // SLOT 1 — SHOTGUNS
    // ============================================================
    shotgun: {
      name: 'Pump Shotgun', slot: 1, kind: 'gun',
      damage: 15, cooldown: 32, bulletSpeed: 9, spread: 0.30, pellets: 6,
      magSize: 8, reloadTime: 95, ammoMax: 64, ammoPerPickup: 12,
      color: '#e0523c'
    },
    auto_shotgun: {
      name: 'Auto Shotgun', slot: 1, kind: 'gun',
      damage: 12, cooldown: 20, bulletSpeed: 9, spread: 0.35, pellets: 8,
      magSize: 10, reloadTime: 100, ammoMax: 80, ammoPerPickup: 16,
      color: '#e0523c'
    },
    combat_shotgun: {
      name: 'Combat Shotgun', slot: 1, kind: 'gun',
      damage: 18, cooldown: 28, bulletSpeed: 10, spread: 0.25, pellets: 7,
      magSize: 10, reloadTime: 90, ammoMax: 80, ammoPerPickup: 16,
      color: '#a32f22'
    },
    chrome_shotgun: {
      name: 'Chrome Shotgun', slot: 1, kind: 'gun',
      damage: 20, cooldown: 40, bulletSpeed: 11, spread: 0.20, pellets: 8,
      magSize: 8, reloadTime: 100, ammoMax: 80, ammoPerPickup: 16,
      color: '#d8d1c2'
    },
    spas: {
      name: 'SPAS-12', slot: 1, kind: 'gun',
      damage: 25, cooldown: 36, bulletSpeed: 11, spread: 0.18, pellets: 9,
      magSize: 10, reloadTime: 105, ammoMax: 100, ammoPerPickup: 20,
      color: '#5a5a5a'
    },

    // ============================================================
    // SLOT 1 — SPECIAL
    // ============================================================
    grenadeLauncher: {
      name: 'Grenade Launcher', slot: 1, kind: 'launcher',
      damage: 80, cooldown: 70, splashRadius: 90, splashDamage: 60,
      magSize: 1, reloadTime: 110, ammoMax: 10, ammoPerPickup: 3,
      color: '#a32f22'
    },
    m60: {
      name: 'M60', slot: 1, kind: 'gun',
      damage: 60, cooldown: 5, bulletSpeed: 15, spread: 0.10, pellets: 1,
      magSize: 150, reloadTime: 200, ammoMax: 150, ammoPerPickup: 0,
      color: '#3a3a3a'
    },

    // ============================================================
    // SLOT 3 — AID
    // ============================================================
    aid: {
      name: 'AID Kit', slot: 3, kind: 'heal',
      healAmount: 80, useTime: 90,
      ammoMax: 3, color: '#7fbf52'
    },
    defibrillator: {
      name: 'Defibrillator', slot: 3, kind: 'heal',
      revive: true, useTime: 150,
      ammoMax: 1, color: '#4a8ed4'
    },

    // ============================================================
    // SLOT 4 — THROWABLES
    // ============================================================
    grenade: {
      name: 'Frag Grenade', slot: 4, kind: 'throw',
      throwType: 'grenade',
      splashRadius: 110, splashDamage: 120, fuse: 90,
      ammoMax: 5, color: '#6b8f3f'
    },
    pipebomb: {
      name: 'Pipebomb', slot: 4, kind: 'throw',
      throwType: 'pipebomb',
      splashRadius: 100, splashDamage: 100, fuse: 150,
      attractRadius: 400, ammoMax: 3, color: '#c98a2e'
    },
    molotov: {
      name: 'Molotov', slot: 4, kind: 'throw',
      throwType: 'fire',
      fireRadius: 100, fireDPS: 25, duration: 400,
      ammoMax: 3, color: '#e0523c'
    },
    bile: {
      name: 'Bile Bomb', slot: 4, kind: 'throw',
      throwType: 'bile',
      attractRadius: 500, duration: 300,
      ammoMax: 2, color: '#7a9a3a'
    },

    // ============================================================
    // SLOT 5 — HEAL
    // ============================================================
    syringe: {
      name: 'Syringe', slot: 5, kind: 'heal',
      healAmount: 40, useTime: 40,
      ammoMax: 3, color: '#4a8ed4'
    },
    pills: {
      name: 'Pain Pills', slot: 5, kind: 'heal',
      healAmount: 25, useTime: 30, temporary: true,
      ammoMax: 3, color: '#c98a2e'
    },
    adrenaline: {
      name: 'Adrenaline', slot: 5, kind: 'heal',
      healAmount: 25, useTime: 20, speedBoost: 200,
      ammoMax: 3, color: '#e0523c'
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  function get(key){ return DEFS[key] || null; }
  function name(key){ return DEFS[key] ? DEFS[key].name : '—'; }
  function isMelee(key){ return DEFS[key] && DEFS[key].kind === 'melee'; }
  function isGun(key){ return DEFS[key] && DEFS[key].kind === 'gun'; }
  function isLauncher(key){ return DEFS[key] && DEFS[key].kind === 'launcher'; }
  function isThrow(key){ return DEFS[key] && DEFS[key].kind === 'throw'; }
  function isHeal(key){ return DEFS[key] && DEFS[key].kind === 'heal'; }

  // ============================================================
  // FIRE BULLETS
  // ============================================================
  function fireBullets(game, ent, angle, weaponKey){
    var w = DEFS[weaponKey];
    if(!w) return;
    for(var i = 0; i < w.pellets; i++){
      var spread = (Math.random() - 0.5) * w.spread;
      var a = angle + spread;
      game.bullets.push({
        x: ent.x + Math.cos(a) * ent.r,
        y: ent.y + Math.sin(a) * ent.r,
        dx: Math.cos(a) * w.bulletSpeed,
        dy: Math.sin(a) * w.bulletSpeed,
        dmg: w.damage,
        life: 70,
        owner: ent,
        silent: !!w.silent
      });
    }
  }

  // ============================================================
  // MELEE
  // ============================================================
  function meleeSwing(game, ent, angle, weaponKey){
    var w = DEFS[weaponKey];
    if(!w || !w.meleeRange) return false;
    var hits = 0;
    for(var i = game.zombies.length - 1; i >= 0; i--){
      var z = game.zombies[i];
      var dx = z.x - ent.x, dy = z.y - ent.y;
      var d = Math.hypot(dx, dy);
      if(d < w.meleeRange + z.r){
        var ang = Math.atan2(dy, dx);
        var diff = Math.abs(normalizeAngle(ang - angle));
        if(diff < w.meleeArc){
          z.hp -= w.damage;
          z.hitFlash = 6;
          var pushX = dx/(d||1), pushY = dy/(d||1);
          z.pushVX = pushX * 8;
          z.pushVY = pushY * 8;
          hits++;
          if(z.hp <= 0 && window.Zombies) window.Zombies.kill(game, i);
        }
      }
    }
    return hits > 0;
  }

  // ============================================================
  // PUSH
  // ============================================================
  function pushAttack(game, ent, radius){
    var hits = 0;
    for(var i = game.zombies.length - 1; i >= 0; i--){
      var z = game.zombies[i];
      var dx = z.x - ent.x, dy = z.y - ent.y;
      var d = Math.hypot(dx, dy);
      if(d < (radius || (ent.r + z.r + 22))){
        var cfg = window.Zombies ? window.Zombies.get(z.type) : { pushDist: 20 };
        var pushX = dx/(d||1), pushY = dy/(d||1);
        var power = cfg.pushDist || 20;
        z.pushVX = pushX * power * 0.35;
        z.pushVY = pushY * power * 0.35;
        z.hp -= 12;
        z.hitFlash = 6;
        hits++;
        if(z.hp <= 0 && window.Zombies) window.Zombies.kill(game, i);
      }
    }
    return hits;
  }

  // ============================================================
  // THROW
  // ============================================================
  function throwProjectile(game, ent, angle, weaponKey){
    var w = DEFS[weaponKey];
    if(!w) return;
    var speed = 9;
    game.thrownItems.push({
      type: w.throwType,
      x: ent.x + Math.cos(angle)*ent.r,
      y: ent.y + Math.sin(angle)*ent.r,
      dx: Math.cos(angle)*speed,
      dy: Math.sin(angle)*speed,
      friction: 0.94,
      fuse: w.fuse || 120,
      weaponKey: weaponKey,
      owner: ent,
      beepTimer: 0
    });
  }

  function normalizeAngle(a){
    while(a > Math.PI) a -= Math.PI*2;
    while(a < -Math.PI) a += Math.PI*2;
    return a;
  }

  // ============================================================
  // AMMO STATE
  // ============================================================
  function newPlayerAmmo(){
    return {
      pistol: 15,
      pistol_magnum: 0,
      pistol_silenced: 0,
      shotgun: 0,
      auto_shotgun: 0,
      combat_shotgun: 0,
      chrome_shotgun: 0,
      spas: 0,
      rifle: 0,
      ak47: 0,
      scar: 0,
      desert_rifle: 0,
      smg: 0,
      uzi: 50,
      mp5: 0,
      silenced_smg: 0,
      sniper: 0,
      scout: 0,
      military_sniper: 0,
      awp: 0,
      grenadeLauncher: 0,
      m60: 0,
      aid: 1,
      defibrillator: 0,
      grenade: 0,
      pipebomb: 0,
      molotov: 0,
      bile: 0,
      syringe: 0,
      pills: 0,
      adrenaline: 0
    };
  }

  function newPlayerReserve(){
    return {
      pistol: 999,
      pistol_magnum: 0,
      pistol_silenced: 0,
      shotgun: 0,
      auto_shotgun: 0,
      combat_shotgun: 0,
      chrome_shotgun: 0,
      spas: 0,
      rifle: 0,
      ak47: 0,
      scar: 0,
      desert_rifle: 0,
      smg: 0,
      uzi: 600,
      mp5: 0,
      silenced_smg: 0,
      sniper: 0,
      scout: 0,
      military_sniper: 0,
      awp: 0,
      grenadeLauncher: 0,
      m60: 0
    };
  }

  // ============================================================
  // AMMO OPS
  // ============================================================
  function canShoot(p, key){
    var w = DEFS[key];
    if(!w) return false;
    if(isMelee(key)) return p.meleeCooldown <= 0;
    if(p.reloading) return false;
    if(isThrow(key) || isHeal(key)) return p.ammo[key] > 0;
    if(isGun(key) || isLauncher(key)) return p.ammo[key] > 0;
    return false;
  }

  function consumeAmmo(p, key){
    var w = DEFS[key];
    if(!w) return false;
    if(w.infinite) return true;
    if(isThrow(key) || isHeal(key)){
      if(p.ammo[key] > 0){ p.ammo[key]--; return true; }
      return false;
    }
    if(p.ammo[key] > 0){ p.ammo[key]--; return true; }
    return false;
  }

  function startReload(p, key){
    var w = DEFS[key];
    if(!w || !w.magSize) return false;
    if(p.ammo[key] >= w.magSize) return false;
    if(w.infinite){
      p.reloading = true;
      p.reloadTimer = w.reloadTime;
      return true;
    }
    if(p.reserve[key] <= 0) return false;
    p.reloading = true;
    p.reloadTimer = w.reloadTime;
    return true;
  }

  function finishReload(p, key){
    var w = DEFS[key];
    if(!w || !w.magSize) return;
    if(w.infinite){
      p.ammo[key] = w.magSize;
    } else {
      var need = w.magSize - p.ammo[key];
      var take = Math.min(need, p.reserve[key]);
      p.ammo[key] += take;
      p.reserve[key] -= take;
    }
    p.reloading = false;
    p.reloadTimer = 0;
  }

  // ============================================================
  // SLOT PRIORITIES
  // ============================================================
  var SLOT1_PRIORITY = [
    'uzi', 'smg', 'mp5', 'silenced_smg',
    'rifle', 'ak47', 'scar', 'desert_rifle',
    'shotgun', 'auto_shotgun', 'combat_shotgun', 'chrome_shotgun', 'spas',
    'sniper', 'scout', 'military_sniper', 'awp',
    'm60', 'grenadeLauncher'
  ];
  var SLOT2_PRIORITY = [
    'pistol', 'pistol_magnum', 'pistol_silenced',
    'melee', 'machete', 'axe', 'katana', 'knife', 'crowbar', 'chainsaw'
  ];
  var SLOT4_PRIORITY = ['grenade', 'pipebomb', 'molotov', 'bile'];
  var SLOT5_PRIORITY = ['syringe', 'pills', 'adrenaline'];

  function pickSlotItem(slot, p){
    if(slot === 1){
      for(var i = 0; i < SLOT1_PRIORITY.length; i++){
        var k = SLOT1_PRIORITY[i];
        if(p.ammo[k] > 0 || p.reserve[k] > 0) return k;
      }
      return 'uzi';
    }
    if(slot === 2) return p.slot2 || 'pistol';
    if(slot === 3) return 'aid';
    if(slot === 4){
      for(var j = 0; j < SLOT4_PRIORITY.length; j++){
        if(p.ammo[SLOT4_PRIORITY[j]] > 0) return SLOT4_PRIORITY[j];
      }
      return 'grenade';
    }
    if(slot === 5){
      for(var m = 0; m < SLOT5_PRIORITY.length; m++){
        if(p.ammo[SLOT5_PRIORITY[m]] > 0) return SLOT5_PRIORITY[m];
      }
      return 'syringe';
    }
    return 'pistol';
  }

  // ============================================================
  // EXPORT
  // ============================================================
  return {
    DEFS: DEFS,
    get: get,
    name: name,
    isMelee: isMelee,
    isGun: isGun,
    isLauncher: isLauncher,
    isThrow: isThrow,
    isHeal: isHeal,
    fireBullets: fireBullets,
    meleeSwing: meleeSwing,
    pushAttack: pushAttack,
    throwProjectile: throwProjectile,
    newPlayerAmmo: newPlayerAmmo,
    newPlayerReserve: newPlayerReserve,
    canShoot: canShoot,
    consumeAmmo: consumeAmmo,
    startReload: startReload,
    finishReload: finishReload,
    pickSlotItem: pickSlotItem,
    SLOT1_PRIORITY: SLOT1_PRIORITY,
    SLOT2_PRIORITY: SLOT2_PRIORITY,
    SLOT4_PRIORITY: SLOT4_PRIORITY,
    SLOT5_PRIORITY: SLOT5_PRIORITY
  };
})();