// ai.js — botlar va avtomatik rejim
window.AI = (function(){
  'use strict';

  var NAMES = ['Coach', 'Ellis', 'Rochelle', 'Nick', 'Zoey', 'Louis', 'Bill', 'Francis'];
  var COLORS = ['#d4a44a', '#4a8ed4', '#d44a7a', '#7ad44a'];

  // ============================================================
  // COMPANION YARATISH
  // ============================================================
  function createCompanion(player, name, color, offsetX, offsetY){
    return {
      x: player.x + offsetX,
      y: player.y + offsetY,
      r: 15,
      speed: 4.3,
      maxSpeed: 4.3,
      hp: 100, maxHp: 100,
      angle: 0,
      cooldown: 0,
      hurtCooldown: 0,
      name: name,
      color: color,
      isPlayer: false,
      hitFlash: 0,
      target: null,
      followDist: 110 + Math.random()*40,
      wanderTimer: 0,
      accuracy: 0.12,
      shootRange: 380,
      isDown: false,
      downTimer: 0
    };
  }

  function initCompanions(game){
    var names = NAMES.slice();
    for(var i=names.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1));
      var t=names[i]; names[i]=names[j]; names[j]=t;
    }
    var chosen = names.slice(0,3);
    var offs = [{x:-70,y:-70},{x:70,y:-70},{x:0,y:80}];
    game.companions = [];
    for(var k=0;k<3;k++){
      game.companions.push(createCompanion(game.player, chosen[k], COLORS[k], offs[k].x, offs[k].y));
    }
  }

  // ============================================================
  // SPEED — jarohatga qarab
  // ============================================================
  function getEntitySpeed(ent){
    var pct = ent.hp / ent.maxHp;
    if(pct >= 0.75) return ent.maxSpeed;
    if(pct >= 0.5)  return ent.maxSpeed * 0.88;
    if(pct >= 0.25) return ent.maxSpeed * 0.72;
    return ent.maxSpeed * 0.55;
  }

  // ============================================================
  // COMPANION UPDATE
  // ============================================================
  function updateCompanion(game, c, dt){
    if(c.isDown){
      c.downTimer -= dt;
      if(c.downTimer <= 0){ c.isDown = false; c.hp = c.maxHp * 0.5; }
      return;
    }

    if(c.hurtCooldown>0) c.hurtCooldown -= dt;
    if(c.cooldown>0) c.cooldown -= dt;
    if(c.hitFlash>0) c.hitFlash -= dt;

    // Eng yaqin zombie'ni topish
    var bestZ = null, bestD = c.shootRange;
    for(var i=0;i<game.zombies.length;i++){
      var z = game.zombies[i];
      var d = Math.hypot(z.x-c.x, z.y-c.y);
      if(d < bestD){ bestD = d; bestZ = z; }
    }
    c.target = bestZ;

    var p = game.player;
    var dx = p.x - c.x;
    var dy = p.y - c.y;
    var dist = Math.hypot(dx,dy) || 1;

    var moveX = 0, moveY = 0;

    if(dist > c.followDist){
      moveX = dx/dist; moveY = dy/dist;
    } else if(dist < c.followDist * 0.5){
      moveX = -dx/dist * 0.4; moveY = -dy/dist * 0.4;
    } else {
      var perpX = -dy/dist, perpY = dx/dist;
      c.wanderTimer -= dt;
      if(c.wanderTimer <= 0){ c.wanderAngle = (Math.random()-0.5)*2; c.wanderTimer = 60+Math.random()*60; }
      moveX = perpX * c.wanderAngle * 0.4;
      moveY = perpY * c.wanderAngle * 0.4;
    }

    // Zombilardan qochish
    for(var j=0;j<game.zombies.length;j++){
      var zz = game.zombies[j];
      var zd = Math.hypot(zz.x-c.x, zz.y-c.y);
      if(zd < zz.r + c.r + 20){
        var away = 1/(zd||1);
        moveX += (c.x-zz.x)*away*0.4;
        moveY += (c.y-zz.y)*away*0.4;
      }
    }

    var mlen = Math.hypot(moveX, moveY);
    if(mlen > 0.05){
      moveX /= mlen; moveY /= mlen;
      var spd = getEntitySpeed(c);
      c.x += moveX * spd * dt;
      c.y += moveY * spd * dt;
    }

    // Otish
    if(c.target){
      var tdx = c.target.x - c.x;
      var tdy = c.target.y - c.y;
      var baseAng = Math.atan2(tdy, tdx);
      var spread = (Math.random()-0.5) * c.accuracy;
      c.angle = baseAng + spread;

      if(c.cooldown <= 0){
        window.Weapons.fireBullets(game, c, c.angle, 'pistol');
        c.cooldown = 14 + Math.random()*6;
        window.SFX.sfx.shoot();
      }
    } else {
      c.angle = Math.atan2(dy, dx);
    }
  }

  // ============================================================
  // AVTOMATIK REJIM
  // ============================================================
  function updateAutoMode(game, dt){
    if(!game.autoMode) return;
    var p = game.player;

    // Eng yaqin zombie
    var bestZ = null, bestD = 600;
    for(var i=0;i<game.zombies.length;i++){
      var z = game.zombies[i];
      var d = Math.hypot(z.x-p.x, z.y-p.y);
      if(d < bestD){ bestD = d; bestZ = z; }
    }

    if(bestZ){
      p.angle = Math.atan2(bestZ.y-p.y, bestZ.x-p.x);
      if(p.cooldown <= 0 && !p.reloading){
        var wk = window.Game.getCurrentWeaponKey(game);
        var w = window.Weapons.get(wk);
        if(w && window.Weapons.canShoot(p, wk)){
          window.Game.performShoot(game);
          p.cooldown = w.cooldown;
        }
      }
      // Reload
      var wk2 = window.Game.getCurrentWeaponKey(game);
      var w2 = window.Weapons.get(wk2);
      if(w2 && w2.magSize && p.ammo[wk2] <= 0 && !p.reloading){
        if(window.Weapons.startReload(p, wk2)) window.SFX.sfx.reload();
      }
    }

    // Harakat — zombie'lardan qochish
    var moveX = 0, moveY = 0;
    for(var j=0;j<game.zombies.length;j++){
      var zz = game.zombies[j];
      var zd = Math.hypot(zz.x-p.x, zz.y-p.y);
      if(zd < 180 && zd > 0){
        moveX += (p.x - zz.x) / zd;
        moveY += (p.y - zz.y) / zd;
      }
    }
    // Do'stlarga ergashish
    if(game.companions.length > 0){
      var c0 = game.companions[0];
      var cd = Math.hypot(c0.x-p.x, c0.y-p.y);
      if(cd > 160){
        moveX += (c0.x - p.x) / cd * 0.5;
        moveY += (c0.y - p.y) / cd * 0.5;
      }
    }
    var ml = Math.hypot(moveX, moveY);
    if(ml > 0.1){
      moveX /= ml; moveY /= ml;
      p.x += moveX * p.maxSpeed * dt;
      p.y += moveY * p.maxSpeed * dt;
    }
  }

  return {
    NAMES: NAMES,
    COLORS: COLORS,
    initCompanions: initCompanions,
    createCompanion: createCompanion,
    getEntitySpeed: getEntitySpeed,
    updateCompanion: updateCompanion,
    updateAutoMode: updateAutoMode
  };
})();