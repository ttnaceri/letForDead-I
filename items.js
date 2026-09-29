// items.js — pickup'lar, radio, AID, granade effektlari
window.Items = (function(){
  'use strict';

  // ============================================================
  // PICKUP RENDER VA PICKUP LOGIKASI
  // ============================================================
  function update(game, dt, canvas){
    var p = game.player;

    // Radio
    if(game.radioPickup && !game.hasRadio){
      var rp = game.radioPickup;
      rp.bob += 0.08*dt;
      var d = Math.hypot(rp.x - p.x, rp.y - p.y);
      if(d < rp.r + p.r){
        game.hasRadio = true;
        game.radioPickup = null;
        window.SFX.sfx.radioPickup();
        if(window.Game && window.Game.showBanner) window.Game.showBanner('Radio acquired — press E to call', '#c98a2e');
        document.getElementById('callBtn').classList.add('show');
        window.Game.updateCallButton();
      }
    }

    // Pickup'lar
    for(var ki=game.pickups.length-1; ki>=0; ki--){
      var pk = game.pickups[ki];
      pk.bob += 0.08*dt;

      if(pk.justDropped){
        pk.dropLife -= dt;
        if(pk.dropLife <= 0){ game.pickups.splice(ki,1); continue; }
      }
      if(pk.pickupCooldown != null && pk.pickupCooldown > 0){
        pk.pickupCooldown -= dt;
        continue;
      }

      var dp = Math.hypot(pk.x - p.x, pk.y - p.y);
      if(dp < pk.r + p.r){
        applyPickup(game, pk, p);
        window.SFX.sfx.pickup();
        if(window.Zombies && window.Zombies.spawnParticles){
          window.Zombies.spawnParticles(game, pk.x, pk.y, 10, pk.type==='health'?'#6b8f3f':'#c98a2e', 3);
        }
        game.pickups.splice(ki,1);
        continue;
      }
    }
  }

  function applyPickup(game, pk, p){
    if(pk.type === 'health'){ p.hp = Math.min(p.maxHp, p.hp+35); return; }
    if(pk.type === 'ammo_pistol'){ /* infinite */ return; }
    if(pk.type === 'ammo_shotgun'){
      p.reserve.shotgun = Math.min(40, p.reserve.shotgun + 12);
      return;
    }
    if(pk.type === 'ammo_rifle'){
      p.reserve.rifle = Math.min(180, p.reserve.rifle + 60);
      return;
    }
    if(pk.type === 'ammo_smg'){
      p.reserve.smg = Math.min(250, p.reserve.smg + 80);
      return;
    }
    if(pk.type === 'aid'){
      p.ammo.aid = Math.min(3, p.ammo.aid + 1);
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
    if(pk.type === 'molotov'){
      p.ammo.molotov = Math.min(3, p.ammo.molotov + 1);
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
  }

  // ============================================================
  // THROWN ITEMS UPDATE (granade, pipebomb, molotov)
  // ============================================================
  function updateThrown(game, dt){
    for(var i=game.thrownItems.length-1; i>=0; i--){
      var t = game.thrownItems[i];
      t.x += t.dx * dt;
      t.y += t.dy * dt;
      t.dx *= t.friction;
      t.dy *= t.friction;
      t.fuse -= dt;

      // Pipebomb beep
      if(t.type === 'pipebomb'){
        t.beepTimer -= dt;
        if(t.beepTimer <= 0){
          window.SFX.sfx.pipebombBeep();
          t.beepTimer = Math.max(6, 20 - (150-t.fuse)/10);
        }
      }

      if(t.fuse <= 0){
        explode(game, t);
        game.thrownItems.splice(i,1);
      }
    }
  }

  function explode(game, t){
    var def = window.Weapons.get(t.weaponKey);
    if(!def) return;

    // Effekt turi
    if(t.type === 'grenade' || t.type === 'pipebomb'){
      var radius = def.splashRadius || 100;
      var dmg = def.splashDamage || 100;
      window.SFX.sfx.explosion();
      game.shake = 14;

      // Zombilarga zarar
      for(var i=game.zombies.length-1; i>=0; i--){
        var z = game.zombies[i];
        var d = Math.hypot(z.x-t.x, z.y-t.y);
        if(d < radius){
          var falloff = 1 - (d / radius);
          z.hp -= dmg * falloff;
          z.hitFlash = 8;
          var pushX = (z.x-t.x)/(d||1);
          var pushY = (z.y-t.y)/(d||1);
          z.pushVX += pushX * 20 * falloff;
          z.pushVY += pushY * 20 * falloff;
          if(z.hp <= 0) window.Zombies.kill(game, i);
        }
      }

      // Player/bot zarar
      var pt = [game.player].concat(game.companions);
      for(var j=0;j<pt.length;j++){
        var e = pt[j];
        var ed = Math.hypot(e.x-t.x, e.y-t.y);
        if(ed < radius * 0.7){
          var fall = 1 - (ed / (radius*0.7));
          var eDmg = dmg * fall * 0.5;
          if(e.isPlayer) window.Zombies.damagePlayer(game, eDmg);
          else window.Zombies.damageCompanion(game, e, eDmg);
        }
      }

      // Vizual
      window.Zombies.spawnParticles(game, t.x, t.y, 30, '#ff9a3a', 6);
      window.Zombies.spawnParticles(game, t.x, t.y, 20, '#e0523c', 8);
      game.explosions.push({ x:t.x, y:t.y, r:0, maxR:radius, life:22, maxLife:22 });
    }
    else if(t.type === 'fire'){
      // Molotov — olov zonasi
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
    else if(t.type === 'bile'){
      // Bile — zombie'larni jalb qiladi (keyingi bosqich)
      window.Zombies.spawnParticles(game, t.x, t.y, 25, '#7a9a3a', 4);
    }
  }

  // Olov zonalari
  function updateFireZones(game, dt){
    for(var i=game.fireZones.length-1; i>=0; i--){
      var f = game.fireZones[i];
      f.life -= dt;
      if(f.life <= 0){ game.fireZones.splice(i,1); continue; }

      // Zombilarga DPS
      for(var j=game.zombies.length-1; j>=0; j--){
        var z = game.zombies[j];
        var d = Math.hypot(z.x-f.x, z.y-f.y);
        if(d < f.radius){
          z.hp -= f.dps * dt / 60;
          z.hitFlash = 3;
          if(z.hp <= 0) window.Zombies.kill(game, j);
        }
      }
      // Player
      var pd = Math.hypot(game.player.x-f.x, game.player.y-f.y);
      if(pd < f.radius){
        window.Zombies.damagePlayer(game, f.dps * dt / 60 * 0.5);
      }
    }
  }

  // Explosions render uchun yangilash
  function updateExplosions(game, dt){
    for(var i=game.explosions.length-1; i>=0; i--){
      var e = game.explosions[i];
      e.life -= dt;
      var t = 1 - (e.life / e.maxLife);
      e.r = e.maxR * t;
      if(e.life <= 0) game.explosions.splice(i,1);
    }
  }

  return {
    update: update,
    updateThrown: updateThrown,
    updateFireZones: updateFireZones,
    updateExplosions: updateExplosions,
    explode: explode
  };
})();