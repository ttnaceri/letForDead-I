// ============================================================
// items.js — Pickup'lar, patron, lazer, AID
// ============================================================
window.Items = (function(){
  'use strict';

  var INTERACT_RANGE = 60;  // E bosish masofasi

  function update(game, dt, canvas){
    var p = game.player;

    // === RADIO ===
    if(game.radioPickup && !game.hasRadio){
      var rp = game.radioPickup;
      rp.bob += 0.08*dt;
      var d = Math.hypot(rp.x - p.x, rp.y - p.y);
      // Radio endi E bilan olinadi
      if(d < INTERACT_RANGE){
        game.radioPickup.nearby = true;
        if(window.HUD) window.HUD.showPrompt('E — Pick up Radio');
      } else {
        game.radioPickup.nearby = false;
      }
    }

    // === PICKUPS — E bilan olinadi ===
    var nearbyPickup = null;
    var nearbyDist = INTERACT_RANGE;

    for(var ki = game.pickups.length - 1; ki >= 0; ki--){
      var pk = game.pickups[ki];
      pk.bob += 0.08 * dt;

      var dp = Math.hypot(pk.x - p.x, pk.y - p.y);
      if(dp < nearbyDist){
        nearbyDist = dp;
        nearbyPickup = pk;
      }
    }

    // Eng yaqin pickup uchun prompt ko'rsatish
    if(nearbyPickup){
      if(window.HUD){
        var promptText = 'E — Pick up ' + getPickupName(nearbyPickup.type);
        window.HUD.showPrompt(promptText);
      }
    }
  }

  function getPickupName(type){
    if(type === 'health') return 'Health';
    if(type === 'ammo_pistol') return 'Ammo';
    if(type === 'ammo_shotgun') return 'Shotgun Ammo';
    if(type === 'ammo_rifle') return 'Rifle Ammo';
    if(type === 'aid') return 'AID Kit';
    if(type === 'grenade') return 'Grenade';
    if(type === 'pipebomb') return 'Pipebomb';
    if(type === 'syringe') return 'Syringe';
    if(type === 'pills') return 'Pills';
    if(type === 'laser') return 'Laser Sight';
    if(type === 'ammo_patron') return 'Patron (Infinite Ammo)';
    return 'Item';
  }

  // ============================================================
  // INTERACT — E bosilganda chaqiriladi
  // ============================================================
  function tryInteract(game){
    var p = game.player;

    // 1. Radio
    if(game.radioPickup && !game.hasRadio){
      var d = Math.hypot(game.radioPickup.x - p.x, game.radioPickup.y - p.y);
      if(d < INTERACT_RANGE){
        game.hasRadio = true;
        game.radioPickup = null;
        window.SFX.sfx.radioPickup();
        if(window.HUD) window.HUD.showBanner('Radio acquired — press E to call', '#c98a2e');
        var cb = document.getElementById('callBtn');
        if(cb) cb.classList.add('show');
        if(window.HUD) window.HUD.update(game);
        return true;
      }
    }

    // 2. Pickup
    var bestPickup = null;
    var bestIdx = -1;
    var bestDist = INTERACT_RANGE;

    for(var i = 0; i < game.pickups.length; i++){
      var pk = game.pickups[i];
      var dp = Math.hypot(pk.x - p.x, pk.y - p.y);
      if(dp < bestDist){
        bestDist = dp;
        bestPickup = pk;
        bestIdx = i;
      }
    }

    if(bestPickup){
      applyPickup(game, bestPickup, p);
      window.SFX.sfx.pickup();
      if(window.Zombies && window.Zombies.spawnParticles){
        window.Zombies.spawnParticles(game, bestPickup.x, bestPickup.y, 10,
          bestPickup.type === 'health' ? '#6b8f3f' : '#c98a2e', 3);
      }
      game.pickups.splice(bestIdx, 1);
      if(window.HUD) window.HUD.update(game);
      return true;
    }

    return false;
  }

  function applyPickup(game, pk, p){
    if(pk.type === 'health'){
      p.hp = Math.min(p.maxHp, p.hp + 35);
      return;
    }
    if(pk.type === 'ammo_pistol' || pk.type === 'ammo_patron'){
      // Patron — cheksiz o'q
      p.hasInfiniteAmmo = true;
      return;
    }
    if(pk.type === 'ammo_shotgun'){
      p.reserve.shotgun = Math.min(40, p.reserve.shotgun + 12);
      return;
    }
    if(pk.type === 'ammo_rifle'){
      p.reserve.rifle = Math.min(180, p.reserve.rifle + 60);
      return;
    }
    if(pk.type === 'aid'){
      // 3-slotga AID qo'shish
      if(p.ammo.aid > 0){
        // Eski AID'ni tashlab yuborish
        var ang = Math.random() * Math.PI * 2;
        game.pickups.push({
          type: 'aid',
          x: pk.x + Math.cos(ang) * 80,
          y: pk.y + Math.sin(ang) * 80,
          r: 14,
          bob: 0,
          pickupCooldown: 60
        });
      }
      p.ammo.aid = 1;
      return;
    }
    if(pk.type === 'grenade'){
      p.ammo.grenade = Math.min(5, p.ammo.grenade + 1);
      return;
    }
    if(pk.type === 'pipebomb'){
      p.ammo.pipebomb = Math.min(3, p.ammo.pipebomb + 1);
      return;
    }
    if(pk.type === 'syringe'){
      p.ammo.syringe = Math.min(3, p.ammo.syringe + 1);
      return;
    }
    if(pk.type === 'pills'){
      p.ammo.pills = Math.min(3, p.ammo.pills + 1);
      return;
    }
    // === LAZER ===
    if(pk.type === 'laser'){
      p.hasLaser = true;
      if(window.HUD) window.HUD.showBanner('Laser Sight equipped!', '#4a8ed4');
      return;
    }
  }

  // ============================================================
  // THROWN ITEMS
  // ============================================================
  function updateThrown(game, dt){
    for(var i = game.thrownItems.length - 1; i >= 0; i--){
      var t = game.thrownItems[i];
      t.x += t.dx * dt;
      t.y += t.dy * dt;
      t.dx *= t.friction;
      t.dy *= t.friction;
      t.fuse -= dt;

      if(t.type === 'pipebomb'){
        t.beepTimer -= dt;
        if(t.beepTimer <= 0){
          window.SFX.sfx.pipebombBeep();
          t.beepTimer = Math.max(6, 20 - (150 - t.fuse) / 10);
        }
      }

      if(t.fuse <= 0){
        explode(game, t);
        game.thrownItems.splice(i, 1);
      }
    }
  }

  function explode(game, t){
    var def = window.Weapons.get(t.weaponKey);
    if(!def) return;

    if(t.type === 'grenade' || t.type === 'pipebomb'){
      var radius = def.splashRadius || 100;
      var dmg = def.splashDamage || 100;
      window.SFX.sfx.explosion();
      game.shake = 14;

      for(var i = game.zombies.length - 1; i >= 0; i--){
        var z = game.zombies[i];
        var d = Math.hypot(z.x - t.x, z.y - t.y);
        if(d < radius){
          var falloff = 1 - (d / radius);
          z.hp -= dmg * falloff;
          z.hitFlash = 8;
          var pushX = (z.x - t.x) / (d || 1);
          var pushY = (z.y - t.y) / (d || 1);
          z.pushVX += pushX * 20 * falloff;
          z.pushVY += pushY * 20 * falloff;
          if(z.hp <= 0) window.Zombies.kill(game, i);
        }
      }

      var pt = [game.player].concat(game.companions);
      for(var j = 0; j < pt.length; j++){
        var e = pt[j];
        var ed = Math.hypot(e.x - t.x, e.y - t.y);
        if(ed < radius * 0.7){
          var fall = 1 - (ed / (radius * 0.7));
          var eDmg = dmg * fall * 0.5;
          if(e.isPlayer) window.Zombies.damagePlayer(game, eDmg);
          else window.Zombies.damageCompanion(game, e, eDmg);
        }
      }

      window.Zombies.spawnParticles(game, t.x, t.y, 30, '#ff9a3a', 6);
      window.Zombies.spawnParticles(game, t.x, t.y, 20, '#e0523c', 8);
      game.explosions.push({ x: t.x, y: t.y, r: 0, maxR: radius, life: 22, maxLife: 22 });
    }
    else if(t.type === 'fire'){
      window.SFX.sfx.explosion();
      game.fireZones.push({
        x: t.x, y: t.y,
        radius: def.fireRadius || 100,
        dps: def.fireDPS || 25,
        life: def.duration || 400,
        maxLife: def.duration || 400
      });
      window.Zombies.spawnParticles(game, t.x, t.y, 25, '#e0523c', 5);
      window.Zombies.spawnParticles(game, t.x, t.y, 15, '#ffcc44', 6);
    }
  }

  function updateFireZones(game, dt){
    for(var i = game.fireZones.length - 1; i >= 0; i--){
      var f = game.fireZones[i];
      f.life -= dt;
      if(f.life <= 0){ game.fireZones.splice(i, 1); continue; }

      for(var j = game.zombies.length - 1; j >= 0; j--){
        var z = game.zombies[j];
        var d = Math.hypot(z.x - f.x, z.y - f.y);
        if(d < f.radius){
          z.hp -= f.dps * dt / 60;
          z.hitFlash = 3;
          if(z.hp <= 0) window.Zombies.kill(game, j);
        }
      }
      var pd = Math.hypot(game.player.x - f.x, game.player.y - f.y);
      if(pd < f.radius){
        window.Zombies.damagePlayer(game, f.dps * dt / 60 * 0.5);
      }
    }
  }

  function updateExplosions(game, dt){
    for(var i = game.explosions.length - 1; i >= 0; i--){
      var e = game.explosions[i];
      e.life -= dt;
      var t = 1 - (e.life / e.maxLife);
      e.r = e.maxR * t;
      if(e.life <= 0) game.explosions.splice(i, 1);
    }
  }

  return {
    update: update,
    updateThrown: updateThrown,
    updateFireZones: updateFireZones,
    updateExplosions: updateExplosions,
    explode: explode,
    tryInteract: tryInteract
  };
})();