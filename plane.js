// ============================================================
// plane.js — Attack Plane (3D 2.5D rendering)
// Let For Dead
// ============================================================
window.Plane = (function(){
  'use strict';

  // ============================================================
  // STATE
  // ============================================================
  var planes = [];           // Barcha uchayotgan samolyotlar
  var MAX_PLANES = 2;        // Maksimum 2 ta samolyot bir vaqtda

  var PLANE_CONFIG = {
    speed: 8,                // Harakat tezligi
    bombRadius: 200,         // Bombalar radiusi
    bombDamage: 150,         // Bomba zarari
    bombInterval: 20,        // Bombalar orasida
    bombsPerRun: 5,          // Har bir reysda bombalar
    flyHeight: 220,          // 3D balandlik (piksellarda)
    callRange: 400           // Bombalash masofasi
  };

  // ============================================================
  // CHAQIRISH
  // ============================================================
  function callPlane(game, targetX, targetY){
    if(planes.length >= MAX_PLANES){
      console.log('[Plane] Limit reached');
      return false;
    }

    // Boshlanish nuqtasi — tashqi tomondan
    var player = game.player;
    var angle = Math.atan2(targetY - player.y, targetX - player.x);
    var startX = targetX - Math.cos(angle) * 1200;
    var startY = targetY - Math.sin(angle) * 1200;

    planes.push({
      x: startX,
      y: startY,
      targetX: targetX,
      targetY: targetY,
      angle: angle,
      speed: PLANE_CONFIG.speed,
      height: PLANE_CONFIG.flyHeight,
      bombsLeft: PLANE_CONFIG.bombsPerRun,
      bombTimer: 0,
      active: true,
      passed: false,
      rotors: 0
    });

    if(window.SFX && window.SFX.sfx.heliCall){
      window.SFX.sfx.heliCall();
    }
    if(window.HUD){
      window.HUD.showBanner('ATTACK PLANE INCOMING', '#c98a2e');
    }
    console.log('[Plane] Called at', targetX.toFixed(0), targetY.toFixed(0));
    return true;
  }

  // ============================================================
  // UPDATE
  // ============================================================
  function update(game, dt){
    for(var i = planes.length - 1; i >= 0; i--){
      var pl = planes[i];

      // Oldinga harakat
      pl.x += Math.cos(pl.angle) * pl.speed * dt;
      pl.y += Math.sin(pl.angle) * pl.speed * dt;
      pl.rotors += dt * 0.3;

      // Target tekshirish
      var dx = pl.targetX - pl.x;
      var dy = pl.targetY - pl.y;
      var distToTarget = Math.hypot(dx, dy);

      // Target yaqinida bombalar tashlash
      if(distToTarget < PLANE_CONFIG.callRange && pl.bombsLeft > 0){
        pl.bombTimer -= dt;
        if(pl.bombTimer <= 0){
          pl.bombTimer = PLANE_CONFIG.bombInterval;
          dropBomb(game, pl);
          pl.bombsLeft--;
        }
      }

      // O'tib ketdimi?
      if(distToTarget > 1200 && !pl.passed){
        // Target orqasidan o'tib ketdi
        var dot = Math.cos(pl.angle) * dx + Math.sin(pl.angle) * dy;
        if(dot < 0){
          pl.passed = true;
        }
      }

      // Ekrandan chiqib ketdi
      if(pl.passed && distToTarget > 1500){
        planes.splice(i, 1);
        console.log('[Plane] Left battlefield');
      }
    }
  }

  // ============================================================
  // BOMBA TASHLASH
  // ============================================================
  function dropBomb(game, pl){
    // Bomba joyi — samolyot tagida
    var bombX = pl.x + (Math.random() - 0.5) * 60;
    var bombY = pl.y + (Math.random() - 0.5) * 60;

    // Effekt — portlash
    if(window.Zombies){
      window.Zombies.spawnParticles(game, bombX, bombY, 40, '#ff6a3a', 8);
      window.Zombies.spawnParticles(game, bombX, bombY, 20, '#ffcc44', 10);
      window.Zombies.spawnParticles(game, bombX, bombY, 30, '#5a5a5a', 5);
    }

    // Explosion object
    game.explosions.push({
      x: bombX,
      y: bombY,
      r: 0,
      maxR: PLANE_CONFIG.bombRadius,
      life: 30,
      maxLife: 30
    });

    // Zombilarga zarar
    for(var i = game.zombies.length - 1; i >= 0; i--){
      var z = game.zombies[i];
      var d = Math.hypot(z.x - bombX, z.y - bombY);
      if(d < PLANE_CONFIG.bombRadius){
        var falloff = 1 - (d / PLANE_CONFIG.bombRadius);
        z.hp -= PLANE_CONFIG.bombDamage * falloff;
        z.hitFlash = 10;
        // Push
        var pushX = (z.x - bombX) / (d || 1);
        var pushY = (z.y - bombY) / (d || 1);
        z.pushVX += pushX * 30 * falloff;
        z.pushVY += pushY * 30 * falloff;
        if(z.hp <= 0 && window.Zombies) window.Zombies.kill(game, i);
      }
    }

    // Player va botlarga zarar
    var targets = [game.player].concat(game.companions);
    for(var j = 0; j < targets.length; j++){
      var t = targets[j];
      var td = Math.hypot(t.x - bombX, t.y - bombY);
      if(td < PLANE_CONFIG.bombRadius * 0.8){
        var tf = 1 - (td / (PLANE_CONFIG.bombRadius * 0.8));
        var dmg = PLANE_CONFIG.bombDamage * tf * 0.4;
        if(t.isPlayer){
          if(window.Zombies) window.Zombies.damagePlayer(game, dmg);
        } else {
          if(window.Zombies) window.Zombies.damageCompanion(game, t, dmg);
        }
      }
    }

    // Screen shake
    game.shake = Math.max(game.shake, 18);

    if(window.SFX && window.SFX.sfx.explosion){
      window.SFX.sfx.explosion();
    }
  }

  // ============================================================
  // RENDER — 2.5D (soya + samolyot)
  // ============================================================
  function render(ctx, game){
    for(var i = 0; i < planes.length; i++){
      var pl = planes[i];
      drawPlane(ctx, pl, game);
    }
  }

  function drawPlane(ctx, pl, game){
    var sx = pl.x;
    var sy = pl.y;

    // === SOYA (yerdagi) ===
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 40, 14, pl.angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // === SAMOLYOT (osmondagi) ===
    var drawY = sy - pl.height;

    ctx.save();
    ctx.translate(sx, drawY);
    ctx.rotate(pl.angle);

    // Tana
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.moveTo(45, 0);       // burun
    ctx.lineTo(20, -8);
    ctx.lineTo(-40, -8);
    ctx.lineTo(-50, -3);
    ctx.lineTo(-50, 3);
    ctx.lineTo(-40, 8);
    ctx.lineTo(20, 8);
    ctx.closePath();
    ctx.fill();

    // Qanotlar
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(-15, -35, 30, 70);
    ctx.fillRect(-45, -18, 12, 36);

    // Kokpit
    ctx.fillStyle = '#4a6a8a';
    ctx.beginPath();
    ctx.ellipse(28, 0, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dvigatel iz
    ctx.fillStyle = 'rgba(255,180,80,0.6)';
    for(var k = 0; k < 3; k++){
      var flameSize = 6 + Math.random() * 5;
      ctx.beginPath();
      ctx.arc(-52 - k * 6, 0, flameSize - k, 0, Math.PI * 2);
      ctx.fill();
    }

    // Perpeller (rotor)
    ctx.save();
    ctx.translate(45, 0);
    ctx.rotate(pl.rotors);
    ctx.strokeStyle = 'rgba(200,200,200,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // === BOMBALAR SONI ===
    ctx.save();
    ctx.font = 'bold 11px ui-monospace, monospace';
    ctx.fillStyle = '#ff6a3a';
    ctx.textAlign = 'center';
    ctx.fillText('✈ ' + pl.bombsLeft + ' bombs', sx, drawY - 55);
    ctx.restore();

    // === TARGET BELGISI (yerda) ===
    ctx.save();
    ctx.strokeStyle = 'rgba(224,82,60,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(pl.targetX, pl.targetY, PLANE_CONFIG.bombRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(224,82,60,0.9)';
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TARGET', pl.targetX, pl.targetY - PLANE_CONFIG.bombRadius - 8);
    ctx.restore();
  }

  // ============================================================
  // CLEAR
  // ============================================================
  function clear(){
    planes = [];
  }

  // ============================================================
  // EXPORT
  // ============================================================
  return {
    callPlane: callPlane,
    update: update,
    render: render,
    clear: clear,
    getPlanes: function(){ return planes; },
    MAX_PLANES: MAX_PLANES
  };
})();