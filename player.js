// ============================================================
// player.js — Player harakati, qurollar, Special Infected
// Let For Dead
// ============================================================
window.Player = (function(){
  'use strict';

  var AID_HOLD_TIME = 5 * 60;
  var REVIVE_TIME = 180;
  var REVIVE_RANGE = 60;
  var KEYED_COOLDOWN = 30;

  var keyedCooldown = 0;

  // ============================================================
  // BLOCKED — map chegarasi
  // ============================================================
  function isBlocked(x, y, r){
    if(!window.World || !window.World.isSolidAt) return false;
    var points = [
      { x: x,         y: y         },
      { x: x - r,     y: y         },
      { x: x + r,     y: y         },
      { x: x,         y: y - r     },
      { x: x,         y: y + r     },
      { x: x - r*0.7, y: y - r*0.7 },
      { x: x + r*0.7, y: y - r*0.7 },
      { x: x - r*0.7, y: y + r*0.7 },
      { x: x + r*0.7, y: y + r*0.7 }
    ];
    for(var i = 0; i < points.length; i++){
      if(window.World.isSolidAt(points[i].x, points[i].y)) return true;
    }
    return false;
  }

  // ============================================================
  // WEAPON HELPERS
  // ============================================================
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

  // ============================================================
  // SLOT
  // ============================================================
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
  // SHOOT
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
      if(wk === 'aid') return false;
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

      if(p.hasInfiniteAmmo && p.patronExplodeRisk){
        if(Math.random() < p.patronExplodeRisk){
          if(window.Zombies){
            window.Zombies.spawnParticles(game, p.x, p.y, 40, '#ff6a3a', 8);
          }
          game.explosions.push({
            x: p.x, y: p.y, r: 0, maxR: 120, life: 25, maxLife: 25
          });
          window.Zombies.damagePlayer(game, 30);
          game.shake = 15;
          window.SFX.sfx.explosion();
          p.hasInfiniteAmmo = false;
          p.patronExplodeRisk = 0;
          if(window.HUD) window.HUD.showBanner('PATRON EXPLODED!', '#e0523c');
          return false;
        }
      }

      if(!p.hasInfiniteAmmo && !w.infinite){
        if(!window.Weapons.consumeAmmo(p, wk)){
          if(p.reserve[wk] > 0) reloadCurrent(game);
          else window.SFX.sfx.dryFire();
          return false;
        }
      } else {
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

      if(p.ammo[wk] <= 0 && (w.infinite || p.reserve[wk] > 0)){
        setTimeout(function(){
          if(game && game.running && getCurrentWeaponKey(game) === wk) reloadCurrent(game);
        }, 250);
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
  // KEYED OBJECT — E bilan
  // ============================================================
  function updateKeyedInteraction(game, dt, input){
    if(keyedCooldown > 0) keyedCooldown -= dt;
    if(!input || !input.interact) return;
    if(keyedCooldown > 0) return;

    var p = game.player;
    var RANGE = 60;

    if(!window.World || !window.World.getMap) return;
    var map = window.World.getMap();
    if(!map) return;

    var cx = Math.floor(p.x / 32);
    var cy = Math.floor(p.y / 32);

    for(var dy = -1; dy <= 1; dy++){
      for(var dx = -1; dx <= 1; dx++){
        var tx = cx + dx;
        var ty = cy + dy;
        if(tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) continue;

        var tileId = map.tiles[ty][tx];
        var flags = window.World.getTileFlags(tileId);

        if(flags.keyed && flags.keyedType){
          var wx = tx * 32 + 16;
          var wy = ty * 32 + 16;
          var d = Math.hypot(p.x - wx, p.y - wy);
          if(d < RANGE){
            triggerKeyedObject(game, flags.keyedType, tx, ty, wx, wy);
            keyedCooldown = KEYED_COOLDOWN;
            return;
          }
        }
      }
    }
  }

  function triggerKeyedObject(game, type, tx, ty, wx, wy){
    console.log('[Keyed]', type, 'at', tx, ty);

    switch(type){
      case 'radio':
        if(!game.hasRadio){
          game.hasRadio = true;
          game.radioPickup = null;
          if(window.SFX) window.SFX.sfx.radioPickup();
          if(window.HUD) window.HUD.showBanner('Radio acquired — press E to call', '#c98a2e');
          var cb = document.getElementById('callBtn');
          if(cb) cb.classList.add('show');
        } else {
          if(window.Help && window.Help.callHelicopter){
            window.Help.callHelicopter(game);
          }
        }
        break;

      case 'door':
      case 'gate':
        if(window.World && window.World.setCellAt){
          var newTile = (tx >= 0) ? 1 : 1;
          window.World.setCellAt(wx, wy, 1);
          if(window.HUD) window.HUD.showBanner('Opened', '#7ad44a');
          // Vaqtincha
          setTimeout(function(){
            if(window.World && window.World.setCellAt){
              window.World.setCellAt(wx, wy, (type === 'door') ? 24 : 28);
            }
          }, 3000);
        }
        break;

      case 'turret':
        if(window.HUD) window.HUD.showBanner('Turret mounted', '#4a8ed4');
        break;

      case 'lever':
        if(window.HUD) window.HUD.showBanner('Lever pulled', '#c98a2e');
        break;

      case 'button':
        if(window.HUD) window.HUD.showBanner('Button pressed', '#7ad44a');
        break;

      case 'generator':
        if(window.HUD) window.HUD.showBanner('Generator started', '#e0523c');
        break;

      case 'elevator':
        if(window.HUD) window.HUD.showBanner('Elevator called', '#4a8ed4');
        break;
    }
  }

  // ============================================================
  // AID + REVIVER
  // ============================================================
  function startHold(game){
    var p = game.player;

    if(p.currentSlot === 3 && p.ammo.aid > 0){
      p.aidHoldTimer = 0;
      p.aidHolding = true;
      return;
    }

    for(var i = 0; i < game.companions.length; i++){
      var c = game.companions[i];
      if(!c.isDown) continue;
      var d = Math.hypot(c.x - p.x, c.y - p.y);
      if(d < REVIVE_RANGE){
        p.reviving = {
          target: c,
          timer: 0,
          duration: REVIVE_TIME
        };
        return;
      }
    }
  }

  function stopHold(game){
    var p = game.player;
    p.aidHolding = false;
    p.aidHoldTimer = 0;
    p.reviving = null;
    if(window.HUD && window.HUD.showAidProgress) window.HUD.showAidProgress(0);
  }

  function updateAidHold(game, dt){
    var p = game.player;

    if(p.aidHolding){
      if(p.currentSlot !== 3){ p.aidHolding = false; }
      else if(p.ammo.aid <= 0){ p.aidHolding = false; }
      else {
        p.aidHoldTimer = (p.aidHoldTimer || 0) + dt;
        if(p.aidHoldTimer >= AID_HOLD_TIME){
          var healAmt = Math.floor(p.maxHp * 0.8);
          p.hp = Math.min(p.maxHp, p.hp + healAmt);
          p.ammo.aid = 0;
          p.aidHolding = false;
          p.aidHoldTimer = 0;
          window.SFX.sfx.heal();
          if(window.Zombies) window.Zombies.spawnParticles(game, p.x, p.y, 25, '#7fbf52', 5);
          if(window.HUD) window.HUD.showBanner('+80 HP', '#7ad44a');
          if(window.HUD && window.HUD.showAidProgress) window.HUD.showAidProgress(0);
          if(window.HUD) window.HUD.update(game);
        } else {
          if(window.HUD && window.HUD.showAidProgress){
            window.HUD.showAidProgress(p.aidHoldTimer / AID_HOLD_TIME);
          }
        }
      }
    }

    if(p.reviving){
      var target = p.reviving.target;
      if(!target || !target.isDown){
        p.reviving = null;
        if(window.HUD && window.HUD.showAidProgress) window.HUD.showAidProgress(0);
        return;
      }
      var d = Math.hypot(target.x - p.x, target.y - p.y);
      if(d > REVIVE_RANGE + 20){
        p.reviving = null;
        if(window.HUD && window.HUD.showAidProgress) window.HUD.showAidProgress(0);
        return;
      }
      p.reviving.timer += dt;
      var pct = p.reviving.timer / p.reviving.duration;
      if(pct >= 1){
        target.isDown = false;
        target.hp = target.maxHp * 0.5;
        target.downTimer = 0;
        window.SFX.sfx.heal();
        if(window.Zombies) window.Zombies.spawnParticles(game, target.x, target.y, 20, '#7fbf52', 4);
        if(window.HUD) window.HUD.showBanner(target.name + ' revived!', '#7ad44a');
        if(window.HUD && window.HUD.showAidProgress) window.HUD.showAidProgress(0);
        p.reviving = null;
      } else {
        if(window.HUD && window.HUD.showAidProgress){
          window.HUD.showAidProgress(pct);
        }
      }
    }
  }

  // ============================================================
  // SPECIAL INFECTED
  // ============================================================
  function updateSpecialStates(game, dt, keys){
    var p = game.player;

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

    if(p.charged){
      p.charged.timer -= dt;
      p.charged.slamTimer -= dt;
      var cz = p.charged.zombie;
      p.x += p.charged.chargeDX * dt;
      p.y += p.charged.chargeDY * dt;
      if(cz){ cz.x = p.x + 20; cz.y = p.y; }
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

    if(p.vomitTimer > 0){
      p.vomitTimer -= dt;
      var vomitEl = document.getElementById('vomit-overlay');
      if(vomitEl) vomitEl.classList.add('show');
      if(p.vomitTimer <= 0){
        if(vomitEl) vomitEl.classList.remove('show');
      }
    }

    if(p.crippled){
      p.crippled.timer -= dt;
      if(p.crippled.timer <= 0) p.crippled = null;
    }

    if(Math.abs(p.knockbackVX) > 0.1 || Math.abs(p.knockbackVY) > 0.1){
      p.x += p.knockbackVX * dt;
      p.y += p.knockbackVY * dt;
      p.knockbackVX *= 0.88;
      p.knockbackVY *= 0.88;
    }
  }

  // ============================================================
  // MAIN UPDATE
  // ============================================================
  function update(game, dt, input){
    if(!game || !game.player) return;
    var p = game.player;

    if(p.hitFlash > 0) p.hitFlash -= dt;
    if(p.meleeCooldown > 0) p.meleeCooldown -= dt;
    if(p.pushCooldown > 0) p.pushCooldown -= dt;

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

    if(input && input.keys){
      updateSpecialStates(game, dt, input.keys);
    }

    updateAidHold(game, dt);

    // Keyed object interaction
    updateKeyedInteraction(game, dt, input);

    if(input && input.autoMode) return;

    // HARAKAT
    var mx = input ? (input.moveX || 0) : 0;
    var my = input ? (input.moveY || 0) : 0;

    var blockedByAid = p.aidHolding;
    var blockedByRevive = !!p.reviving;
    var canMove = !p.pinned && !p.ridden && !p.smoked && !p.charged
                  && !blockedByAid && !blockedByRevive;

    var speedMult = 1.0;
    if(p.crippled) speedMult *= p.crippled.speedMult;

    if((Math.abs(mx) > 0.01 || Math.abs(my) > 0.01) && canMove){
      var len = Math.hypot(mx, my);
      if(len > 1){ mx /= len; my /= len; }
      var baseSpeed = window.AI ? window.AI.getEntitySpeed(p) : p.maxSpeed;
      var pSpd = baseSpeed * speedMult;

      // X
      var newX = p.x + mx * pSpd * dt;
      if(!isBlocked(newX, p.y, p.r)){
        p.x = newX;
      } else {
        for(var sx = 1; sx <= 6; sx++){
          var tryX = p.x + (newX - p.x) * (1 - sx / 7);
          if(!isBlocked(tryX, p.y, p.r)){ p.x = tryX; break; }
        }
      }

      // Y
      var newY = p.y + my * pSpd * dt;
      if(!isBlocked(p.x, newY, p.r)){
        p.y = newY;
      } else {
        for(var sy = 1; sy <= 6; sy++){
          var tryY = p.y + (newY - p.y) * (1 - sy / 7);
          if(!isBlocked(p.x, tryY, p.r)){ p.y = tryY; break; }
        }
      }
    }

    // Aim
    if(input && input.hasAim && !p.pinned && !p.ridden && !p.smoked && !p.charged){
      p.angle = Math.atan2(input.aimY, input.aimX);
    }

    // Shoot
    if(p.cooldown > 0) p.cooldown -= dt;
    if(input && input.firing && p.cooldown <= 0 && canMove){
      var wk = getCurrentWeaponKey(game);
      if(p.currentSlot !== 3){
        if(performShoot(game)){
          var w = window.Weapons.get(wk);
          p.cooldown = w ? w.cooldown : 12;
        } else {
          p.cooldown = 10;
        }
      }
    }

    if(input && input.pushing && canMove) doPush(game);
    if(input && input.reload) reloadCurrent(game);
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
    isBlocked: isBlocked,
    AID_HOLD_TIME: AID_HOLD_TIME,
    REVIVE_TIME: REVIVE_TIME
  };
})();