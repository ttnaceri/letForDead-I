// ============================================================
// player.js — Player harakati, qurollar, Special Infected
// ============================================================
window.Player = (function(){
  'use strict';

  var AID_HOLD_TIME = 5 * 60;   // 5 sekund = 300 frame

  function getCurrentWeaponKey(game){
    if(!game || !game.player) return 'pistol';
    var p = game.player;
    if(p.currentSlot === 1) return p.slot1;
    if(p.currentSlot === 2) return p.slot2;
    if(p.currentSlot === 3) return p.slot3;
    if(p.currentSlot === 4) return p.slot4;
    if(p.currentSlot === 5) return p.slot5;
    return 'pistol';
  }

  function selectSlot(game, n){
    if(!game || !game.running) return;
    if(n < 1 || n > 5) return;

    var p = game.player;
    p.currentSlot = n;
    p.reloading = false;
    p.reloadTimer = 0;

    if(n === 1){
      for(var i = 0; i < window.Weapons.SLOT1_PRIORITY.length; i++){
        var k = window.Weapons.SLOT1_PRIORITY[i];
        if(p.ammo[k] > 0 || p.reserve[k] > 0){ p.slot1 = k; break; }
      }
    }
    if(n === 4){
      for(var j = 0; j < window.Weapons.SLOT4_PRIORITY.length; j++){
        var k4 = window.Weapons.SLOT4_PRIORITY[j];
        if(p.ammo[k4] > 0){ p.slot4 = k4; break; }
      }
    }
    if(n === 5){
      for(var m = 0; m < window.Weapons.SLOT5_PRIORITY.length; m++){
        var k5 = window.Weapons.SLOT5_PRIORITY[m];
        if(p.ammo[k5] > 0){ p.slot5 = k5; break; }
      }
    }

    if(window.HUD) window.HUD.update(game);
  }

  function cycleWeapon(game){
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
    if(window.HUD) window.HUD.update(game);
  }

  function reloadCurrent(game){
    var p = game.player;
    var wk = getCurrentWeaponKey(game);
    var w = window.Weapons.get(wk);
    if(!w) return;
    if(window.Weapons.isMelee(wk)) return;
    if(window.Weapons.isThrow(wk)) return;
    if(window.Weapons.isHeal(wk)) return;
    if(!w.magSize) return;
    if(p.ammo[wk] >= w.magSize) return;
    if(p.reloading) return;
    if(!w.infinite && !p.hasInfiniteAmmo && p.reserve[wk] <= 0) return;

    p.reloading = true;
    p.reloadTimer = w.reloadTime || 60;
    window.SFX.sfx.reload();
    if(window.HUD) window.HUD.update(game);
  }

  // ============================================================
  // OTISH
  // ============================================================
  function performShoot(game){
    var p = game.player;
    var wk = getCurrentWeaponKey(game);
    var w = window.Weapons.get(wk);
    if(!w) return false;

    if(window.Weapons.isMelee(wk)){
      if(p.meleeCooldown > 0) return false;
      p.meleeCooldown = w.cooldown;
      window.SFX.sfx.melee();
      var hit = window.Weapons.meleeSwing(game, p, p.angle, wk);
      if(hit) window.SFX.sfx.meleeHit();
      return true;
    }

    if(window.Weapons.isThrow(wk)){
      if(p.ammo[wk] <= 0){ window.SFX.sfx.dryFire(); return false; }
      p.ammo[wk]--;
      window.Weapons.throwProjectile(game, p, p.angle, wk);
      window.SFX.sfx.throwItem();
      if(window.HUD) window.HUD.update(game);
      return true;
    }

    if(window.Weapons.isHeal(wk)){
      // AID uchun 5 sekund bosib turish kerak
      if(wk === 'aid'){
        // Bu holda AID alohida ishlatiladi, mouse hold orqali
        return false;
      }
      if(p.ammo[wk] <= 0){ window.SFX.sfx.dryFire(); return false; }
      var healAmt = w.healAmount || 35;
      if(p.hp >= p.maxHp) return false;
      p.ammo[wk]--;
      p.hp = Math.min(p.maxHp, p.hp + healAmt);
      window.SFX.sfx.heal();
      if(window.Zombies) window.Zombies.spawnParticles(game, p.x, p.y, 15, '#7fbf52', 3);
      if(window.HUD) window.HUD.update(game);
      return true;
    }

    if(window.Weapons.isGun(wk) || window.Weapons.isLauncher(wk)){
      if(p.reloading) return false;

      // Patron — cheksiz
      if(!p.hasInfiniteAmmo && !w.infinite){
        if(!window.Weapons.consumeAmmo(p, wk)){
          if(p.reserve[wk] > 0) reloadCurrent(game);
          else window.SFX.sfx.dryFire();
          return false;
        }
      } else {
        // Cheksiz — shunchaki ammo kamayadi
        if(p.ammo[wk] > 0) p.ammo[wk]--;
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

      if(window.Zombies){
        window.Zombies.spawnParticles(game,
          p.x + Math.cos(p.angle)*20,
          p.y + Math.sin(p.angle)*20,
          3, '#e8c27a', 2);
      }

      // Auto reload — pistol yoki cheksiz bo'lmagan qurollar
      if(wk === 'pistol' && p.ammo.pistol <= 0){
        setTimeout(function(){
          if(game && game.running && getCurrentWeaponKey(game) === 'pistol'){
            if(window.HUD) window.HUD.update(game);
          }
        }, 100);
      }

      if(window.HUD) window.HUD.update(game);
      return true;
    }
    return false;
  }

  function doPush(game){
    var p = game.player;
    if(p.pushCooldown > 0) return;
    p.pushCooldown = 30;
    window.SFX.sfx.melee();
    var hits = window.Weapons.pushAttack(game, p);
    if(hits > 0) window.SFX.sfx.meleeHit();
  }

  // ============================================================
  // AID BOSIB TURISH
  // ============================================================
  function startHold(game){
    var p = game.player;
    // Faqat 3-slot AID bo'lsa
    if(p.currentSlot === 3 && p.ammo.aid > 0){
      p.aidHoldTimer = 0;
      p.aidHolding = true;
    }
  }

  function stopHold(game){
    var p = game.player;
    p.aidHolding = false;
    p.aidHoldTimer = 0;
  }

  function updateAidHold(game, dt){
    var p = game.player;
    if(!p.aidHolding) return;
    if(p.currentSlot !== 3) return;
    if(p.ammo.aid <= 0) { p.aidHolding = false; return; }

    p.aidHoldTimer = (p.aidHoldTimer || 0) + dt;

    // 5 sekund o'tdi
    if(p.aidHoldTimer >= AID_HOLD_TIME){
      // 80% HP qo'shish
      var healAmt = Math.floor(p.maxHp * 0.8);
      p.hp = Math.min(p.maxHp, p.hp + healAmt);
      p.ammo.aid = 0;   // AID ishlatildi
      p.aidHolding = false;
      p.aidHoldTimer = 0;

      window.SFX.sfx.heal();
      if(window.Zombies) window.Zombies.spawnParticles(game, p.x, p.y, 25, '#7fbf52', 5);
      if(window.HUD) window.HUD.showBanner('+80 HP', '#7ad44a');
      if(window.HUD) window.HUD.update(game);
    }

    // Progress bar yangilash
    if(window.HUD && window.HUD.showAidProgress){
      window.HUD.showAidProgress(p.aidHoldTimer / AID_HOLD_TIME);
    }
  }

  // ============================================================
  // PLAYER UPDATE
  // ============================================================
  function update(game, dt, input){
    if(!game || !game.player) return;
    var p = game.player;

    if(p.hitFlash > 0) p.hitFlash -= dt;
    if(p.meleeCooldown > 0) p.meleeCooldown -= dt;
    if(p.pushCooldown > 0) p.pushCooldown -= dt;

    // Reload
    if(p.reloading){
      p.reloadTimer -= dt;
      if(p.reloadTimer <= 0){
        var wkReload = getCurrentWeaponKey(game);
        var wReload = window.Weapons.get(wkReload);
        if(wReload && wReload.magSize){
          if(wReload.infinite || p.hasInfiniteAmmo){
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
        if(window.HUD) window.HUD.update(game);
      }
    }

    // Special states
    if(input && input.keys){
      updateSpecialStates(game, dt, input.keys);
    }

    // AID bosib turish
    updateAidHold(game, dt);

    if(input && input.autoMode) return;

    // === HARAKAT ===
    var mx = input ? (input.moveX || 0) : 0;
    var my = input ? (input.moveY || 0) : 0;

    var canMove = !p.pinned && !p.ridden && !p.smoked && !p.charged;
    var speedMult = 1.0;
    if(p.crippled) speedMult *= p.crippled.speedMult;

    if((Math.abs(mx) > 0.01 || Math.abs(my) > 0.01) && canMove){
      var len = Math.hypot(mx, my);
      if(len > 1){ mx /= len; my /= len; }
      var baseSpeed = window.AI ? window.AI.getEntitySpeed(p) : p.maxSpeed;
      var pSpd = baseSpeed * speedMult;
      p.x += mx * pSpd * dt;
      p.y += my * pSpd * dt;
    }

    // Aim
    if(canMove && input && input.hasAim){
      p.angle = Math.atan2(input.aimY, input.aimX);
    }

    // Shoot — AID uchun otmaslik
    if(p.cooldown > 0) p.cooldown -= dt;
    if(input && input.firing && p.cooldown <= 0 && canMove){
      var wk = getCurrentWeaponKey(game);
      // 3-slot AID uchun otmaymiz
      if(!(p.currentSlot === 3)){
        if(performShoot(game)){
          var w = window.Weapons.get(wk);
          p.cooldown = w ? w.cooldown : 12;
        } else {
          p.cooldown = 10;
        }
      }
    }

    if(input && input.pushing) doPush(game);
    if(input && input.reload) reloadCurrent(game);
  }

  function updateSpecialStates(game, dt, keys){
    var p = game.player;
    // ... (oldingi kod o'zgarmaydi)
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
    // ... qolgani o'sha
  }

  return {
    getCurrentWeaponKey: getCurrentWeaponKey,
    selectSlot: selectSlot,
    cycleWeapon: cycleWeapon,
    reloadCurrent: reloadCurrent,
    performShoot: performShoot,
    doPush: doPush,
    updateSpecialStates: updateSpecialStates,
    update: update,
    startHold: startHold,
    stopHold: stopHold,
    AID_HOLD_TIME: AID_HOLD_TIME
  };
})();