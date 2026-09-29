// weapons.js — barcha qurollar ta'rifi va logikasi
window.Weapons = (function(){
  'use strict';

  // ============================================================
  // WEAPON DEFINITIONS
  // ============================================================
  var DEFS = {
    // === Slot 2: Pistol / Melee ===
    pistol: {
      name: 'Pistol', slot: 2, kind: 'gun',
      damage: 220000, cooldown: 13, bulletSpeed: 11, spread: 0.03, pellets: 1,
      magSize: 7, reloadTime: 60, infinite: true,
      color: '#c98a2e'
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
    knife: {
      name: 'Combat Knife', slot: 2, kind: 'melee',
      damage: 55, cooldown: 14, meleeRange: 32, meleeArc: 1.0,
      infinite: true, color: '#d8d1c2'
    },

    // === Slot 1: Shotgun / Rifle / GL ===
    shotgun: {
      name: 'Shotgun', slot: 1, kind: 'gun',
      damage: 15, cooldown: 32, bulletSpeed: 9, spread: 0.30, pellets: 6,
      magSize: 6, reloadTime: 95, ammoMax: 40, ammoPerPickup: 12,
      color: '#e0523c'
    },
    rifle: {
      name: 'Rifle', slot: 1, kind: 'gun',
      damage: 30, cooldown: 8, bulletSpeed: 13, spread: 0.06, pellets: 1,
      magSize: 30, reloadTime: 80, ammoMax: 180, ammoPerPickup: 60,
      color: '#6b8f3f'
    },
    smg: {
      name: 'SMG', slot: 1, kind: 'gun',
      damage: 18, cooldown: 5, bulletSpeed: 14, spread: 0.10, pellets: 1,
      magSize: 50, reloadTime: 70, ammoMax: 250, ammoPerPickup: 80,
      color: '#4a8ed4'
    },
    grenadeLauncher: {
      name: 'Grenade Launcher', slot: 1, kind: 'launcher',
      damage: 80, cooldown: 70, splashRadius: 90, splashDamage: 60,
      magSize: 1, reloadTime: 110, ammoMax: 10, ammoPerPickup: 3,
      color: '#a32f22'
    },
    sniper: {
      name: 'Hunting Rifle', slot: 1, kind: 'gun',
      damage: 90, cooldown: 60, bulletSpeed: 20, spread: 0.005, pellets: 1,
      magSize: 10, reloadTime: 130, ammoMax: 60, ammoPerPickup: 15,
      color: '#6b8f3f'
    },

    // === Slot 3: AID ===
    aid: {
      name: 'AID Kit', slot: 3, kind: 'heal',
      healAmount: 80, useTime: 90,
      ammoMax: 3, color: '#7fbf52'
    },

    // === Slot 4: Throwables ===
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

    // === Slot 5: Syringe / Pills ===
    syringe: {
      name: 'Syringe', slot: 5, kind: 'heal',
      healAmount: 40, useTime: 40,
      ammoMax: 3, color: '#4a8ed4'
    },
    pills: {
      name: 'Pain Pills', slot: 5, kind: 'heal',
      healAmount: 25, useTime: 30, temporary: true,
      ammoMax: 3, color: '#c98a2e'
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

  // Otish — bullet yaratish
  function fireBullets(game, ent, angle, weaponKey){
    var w = DEFS[weaponKey];
    if(!w) return;
    for(var i=0;i<w.pellets;i++){
      var spread=(Math.random()-0.5)*w.spread;
      var a=angle+spread;
      game.bullets.push({
        x: ent.x+Math.cos(a)*ent.r,
        y: ent.y+Math.sin(a)*ent.r,
        dx: Math.cos(a)*w.bulletSpeed,
        dy: Math.sin(a)*w.bulletSpeed,
        dmg: w.damage,
        life: 70,
        owner: ent
      });
    }
  }

  // Melee urish
  function meleeSwing(game, ent, angle, weaponKey){
    var w = DEFS[weaponKey];
    if(!w || !w.meleeRange) return false;
    var hits = 0;
    for(var i=game.zombies.length-1; i>=0; i--){
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
          if(z.hp <= 0) window.Zombies.kill(game, i);
        }
      }
    }
    return hits > 0;
  }

  // Push (o'ng tugma)
  function pushAttack(game, ent, radius){
    var hits = 0;
    for(var i=game.zombies.length-1; i>=0; i--){
      var z = game.zombies[i];
      var dx = z.x - ent.x, dy = z.y - ent.y;
      var d = Math.hypot(dx, dy);
      if(d < (radius || (ent.r + z.r + 22))){
        var cfg = window.Zombies.get(z.type);
        var pushX = dx/(d||1), pushY = dy/(d||1);
        var power = cfg.pushDist || 20;
        z.pushVX = pushX * power * 0.35;
        z.pushVY = pushY * power * 0.35;
        z.hp -= 12;
        z.hitFlash = 6;
        hits++;
        if(z.hp <= 0) window.Zombies.kill(game, i);
      }
    }
    return hits;
  }

  // Throwable — granade/pipebomb/molotov otish
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
  // AMMO STATE HELPERS
  // ============================================================
  // Player ammo strukturasi
  function newPlayerAmmo(){
    return {
      // mag ichidagi
      pistol: 7,
      shotgun: 0,
      rifle: 0,
      smg: 0,
      grenadeLauncher: 0,
      sniper: 0,
      // AID, throwables, syringelar
      aid: 1,
      grenade: 0,
      pipebomb: 0,
      molotov: 0,
      bile: 0,
      syringe: 0,
      pills: 0
    };
  }

  function newPlayerReserve(){
    return {
      pistol: 999,       // infinite
      shotgun: 0,
      rifle: 0,
      smg: 0,
      grenadeLauncher: 0,
      sniper: 0
    };
  }

  // Otish mumkinmi?
  function canShoot(p, key){
    var w = DEFS[key];
    if(!w) return false;
    if(isMelee(key)) return p.meleeCooldown <= 0;
    if(p.reloading) return false;
    if(isThrow(key) || isHeal(key)) return p.ammo[key] > 0;
    if(isGun(key) || isLauncher(key)){
      return p.ammo[key] > 0;
    }
    return false;
  }

  // O'q otish — ammo sarflash
  function consumeAmmo(p, key){
    var w = DEFS[key];
    if(!w) return false;
    if(w.infinite) return true;   // pistol — cheksiz
    if(isThrow(key) || isHeal(key)){
      if(p.ammo[key] > 0){ p.ammo[key]--; return true; }
      return false;
    }
    if(p.ammo[key] > 0){ p.ammo[key]--; return true; }
    return false;
  }

  // Reload boshlash
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

  // Reload tugatish
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
  // SLOT BOSHQARUVI
  // ============================================================
  // Slot 1: rifle/shotgun/smg/gl/sniper
  var SLOT1_PRIORITY = ['rifle', 'shotgun', 'smg', 'grenadeLauncher', 'sniper'];
  // Slot 2: pistol/melee/machete/axe/knife
  var SLOT2_PRIORITY = ['pistol', 'melee', 'machete', 'axe', 'knife'];
  // Slot 4: grenade/pipebomb/molotov/bile
  var SLOT4_PRIORITY = ['grenade', 'pipebomb', 'molotov', 'bile'];
  // Slot 5: syringe/pills
  var SLOT5_PRIORITY = ['syringe', 'pills'];

  function pickSlotItem(slot, p){
    if(slot === 1){
      for(var i=0;i<SLOT1_PRIORITY.length;i++){
        var k = SLOT1_PRIORITY[i];
        if(p.ammo[k] > 0 || p.reserve[k] > 0) return k;
      }
      return 'shotgun';
    }
    if(slot === 2){
      // default pistol har doim
      return p.slot2 || 'pistol';
    }
    if(slot === 3) return 'aid';
    if(slot === 4){
      for(var j=0;j<SLOT4_PRIORITY.length;j++){
        var k4 = SLOT4_PRIORITY[j];
        if(p.ammo[k4] > 0) return k4;
      }
      return 'grenade';
    }
    if(slot === 5){
      for(var m=0;m<SLOT5_PRIORITY.length;m++){
        var k5 = SLOT5_PRIORITY[m];
        if(p.ammo[k5] > 0) return k5;
      }
      return 'syringe';
    }
    return 'pistol';
  }

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