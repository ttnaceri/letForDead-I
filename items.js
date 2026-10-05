// ============================================================
// items.js — Pickup'lar, radio, throwables, explosions
// Let For Dead
// ============================================================
window.Items = (function(){
  'use strict';

  var INTERACT_RANGE = 60;

  // ============================================================
  // UPDATE
  // ============================================================
  function update(game, dt, canvas){
    var p = game.player;

    // === RADIO (ko'rinadigan, olinadigan) ===
    if(game.radioPickup && !game.hasRadio){
      game.radioPickup.bob += 0.08 * dt;
    }

    // === PICKUPS (E bosish kerak, tegib olmaydi) ===
    // Pickup'lar faqat E bilan olinadi
    // Bu funksiya ularning animatsiyasini yangilaydi
    for(var ki = game.pickups.length - 1; ki >= 0; ki--){
      var pk = game.pickups[ki];
      pk.bob += 0.08 * dt;

      if(pk.justDropped){
        pk.dropLife -= dt;
        if(pk.dropLife <= 0){
          game.pickups.splice(ki, 1);
          continue;
        }
      }
    }
  }

  // ============================================================
  // E — PICKUP OLISH
  // ============================================================
  function tryInteract(game){
    var p = game.player;
    var bestPickup = null;
    var bestIdx = -1;
    var bestDist = INTERACT_RANGE;

    for(var i = 0; i < game.pickups.length; i++){
      var pk = game.pickups[i];
      var d = Math.hypot(pk.x - p.x, pk.y - p.y);
      if(d < bestDist){
        bestDist = d;
        bestPickup = pk;
        bestIdx = i;
      }
    }

    if(bestPickup){
      applyPickup(game, bestPickup, p);
      if(window.SFX) window.SFX.sfx.pickup();
      if(window.Zombies){
        window.Zombies.spawnParticles(game, bestPickup.x, bestPickup.y, 10,
          bestPickup.type === 'health' ? '#7fbf52' : '#c98a2e', 3);
      }
      game.pickups.splice(bestIdx, 1);
      if(window.HUD) window.HUD.update(game);
      return true;
    }
    return false;
  }

  // ============================================================
  // PICKUP QO'LLASH
  // ============================================================
  function applyPickup(game, pk, p){

    // --- Health (AID) ---
    if(pk.type === 'health'){
      p.hp = Math.min(p.maxHp, p.hp + 35);
      if(window.HUD) window.HUD.showBanner('+35 HP', '#7ad44a');
      return;
    }

    // --- AID Kit (slot 3 ga) ---
    if(pk.type === 'aid'){
      // 3-slotga qo'shish yoki almashtirish
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
      p.slot3 = 'aid';
      if(window.HUD) window.HUD.showBanner('AID Kit acquired', '#7fbf52');
      return;
    }

    // --- Ammo (BARCHA qurollar to'ladi) ---
    if(pk.type === 'ammo_pistol' || pk.type === 'ammo_patron'){
      // Barcha gun qurollarini to'ldirish
      var filledCount = 0;
      for(var key in p.reserve){
        var w = window.Weapons.get(key);
        if(w && w.kind === 'gun' && w.ammoMax){
          p.reserve[key] = w.ammoMax;
          filledCount++;
        }
      }

      // Launcher (grenade launcher) to'ladi
      if(window.Weapons.get('grenadeLauncher')){
        var gl = window.Weapons.get('grenadeLauncher');
        if(gl.ammoMax){
          p.reserve.grenadeLauncher = gl.ammoMax;
          filledCount++;
        }
      }

      // Joriy qurol mag'ini ham to'ldirish
      var wk = window.Player.getCurrentWeaponKey(game);
      var w2 = window.Weapons.get(wk);
      if(w2 && w2.magSize){
        p.ammo[wk] = w2.magSize;
      }

      // Patron — cheksiz ammo
      if(pk.type === 'ammo_patron'){
        p.hasInfiniteAmmo = true;
        if(window.HUD) window.HUD.showBanner('INFINITE AMMO', '#7ad44a');
      } else {
        if(window.HUD) window.HUD.showBanner('AMMO FULL', '#7ad44a');
      }

      console.log('[Items] Ammo filled:', filledCount, 'weapons');
      return;
    }

    // --- Ammo Shotgun ---
    if(pk.type === 'ammo_shotgun'){
      p.reserve.shotgun = Math.min(64, (p.reserve.shotgun || 0) + 12);
      if(window.HUD) window.HUD.showBanner('+12 Shotgun shells', '#e0523c');
      return;
    }

    // --- Ammo Rifle ---
    if(pk.type === 'ammo_rifle'){
      p.reserve.rifle = Math.min(360, (p.reserve.rifle || 0) + 60);
      if(window.HUD) window.HUD.showBanner('+60 Rifle ammo', '#6b8f3f');
      return;
    }

    // --- Laser ---
    if(pk.type === 'laser'){
      p.hasLaser = true;
      if(window.HUD) window.HUD.showBanner('Laser Sight equipped', '#4a8ed4');
      if(window.Save) window.Save.unlockAchievement('laser_equipped');
      return;
    }

    // --- Grenade ---
    if(pk.type === 'grenade'){
      p.ammo.grenade = Math.min(5, (p.ammo.grenade || 0) + 1);
      if(window.HUD) window.HUD.showBanner('+1 Grenade', '#6b8f3f');
      return;
    }

    // --- Pipebomb ---
    if(pk.type === 'pipebomb'){
      p.ammo.pipebomb = Math.min(3, (p.ammo.pipebomb || 0) + 1);
      if(window.HUD) window.HUD.showBanner('+1 Pipebomb', '#c98a2e');
      return;
    }

    // --- Syringe ---
    if(pk.type === 'syringe'){
      p.ammo.syringe = Math.min(3, (p.ammo.syringe || 0) + 1);
      return;
    }

    // --- Pills ---
    if(pk.type === 'pills'){
      p.ammo.pills = Math.min(3, (p.ammo.pills || 0) + 1);
      return;
    }
  }

  // ============================================================
  // THROWN ITEMS (granade, pipebomb, molotov)
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
          if(window.SFX) window.SFX.sfx.pipebombBeep();
          t.beepTimer = Math.max(6, 20 - (150 - t.fuse) / 10);
        }
      }

      if(t.fuse <= 0){
        explode(game, t);
        game.thrownItems.splice(i, 1);
      }
    }
  }

  // ============================================================
  // EXPLOSION
  // ============================================================
  function explode(game, t){
    var def = window.Weapons.get(t.weaponKey);
    if(!def) return;

    if(t.type === 'grenade' || t.type === 'pipebomb'){
      var radius = def.splashRadius || 100;
      var dmg = def.splashDamage || 100;
      if(window.SFX) window.SFX.sfx.explosion();
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
          if(z.hp <= 0 && window.Zombies) window.Zombies.kill(game, i);
        }
      }

      var pt = [game.player].concat(game.companions);
      for(var j = 0; j < pt.length; j++){
        var e = pt[j];
        var ed = Math.hypot(e.x - t.x, e.y - t.y);
        if(ed < radius * 0.7){
          var fall = 1 - (ed / (radius * 0.7));
          var eDmg = dmg * fall * 0.5;
          if(e.isPlayer){
            if(window.Zombies) window.Zombies.damagePlayer(game, eDmg);
          } else {
            if(window.Zombies) window.Zombies.damageCompanion(game, e, eDmg);
          }
        }
      }

      if(window.Zombies){
        window.Zombies.spawnParticles(game, t.x, t.y, 30, '#ff9a3a', 6);
        window.Zombies.spawnParticles(game, t.x, t.y, 20, '#e0523c', 8);
      }
      game.explosions.push({ x: t.x, y: t.y, r: 0, maxR: radius, life: 22, maxLife: 22 });
    }
    else if(t.type === 'fire'){
      if(window.SFX) window.SFX.sfx.explosion();
      game.fireZones.push({
        x: t.x, y: t.y,
        radius: def.fireRadius || 100,
        dps: def.fireDPS || 25,
        life: def.duration || 400,
        maxLife: def.duration || 400
      });
      if(window.Zombies){
        window.Zombies.spawnParticles(game, t.x, t.y, 25, '#e0523c', 5);
        window.Zombies.spawnParticles(game, t.x, t.y, 15, '#ffcc44', 6);
      }
    }
    else if(t.type === 'bile'){
      if(window.Zombies) window.Zombies.spawnParticles(game, t.x, t.y, 25, '#7a9a3a', 4);
    }
  }

  // ============================================================
  // FIRE ZONES
  // ============================================================
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
          if(z.hp <= 0 && window.Zombies) window.Zombies.kill(game, j);
        }
      }
      var pd = Math.hypot(game.player.x - f.x, game.player.y - f.y);
      if(pd < f.radius){
        if(window.Zombies) window.Zombies.damagePlayer(game, f.dps * dt / 60 * 0.5);
      }
    }
  }

  // ============================================================
  // EXPLOSIONS (visual)
  // ============================================================
  function updateExplosions(game, dt){
    for(var i = game.explosions.length - 1; i >= 0; i--){
      var e = game.explosions[i];
      e.life -= dt;
      var t = 1 - (e.life / e.maxLife);
      e.r = e.maxR * t;
      if(e.life <= 0) game.explosions.splice(i, 1);
    }
  }

  // ============================================================
  // EXPORT
  // ============================================================
  return {
    update: update,
    tryInteract: tryInteract,
    applyPickup: applyPickup,
    updateThrown: updateThrown,
    updateFireZones: updateFireZones,
    updateExplosions: updateExplosions,
    explode: explode
  };
})();