// ============================================================
// zombies.js — Zombie turlari, AI, Spawn, Kill, Loot
// Let For Dead
// ============================================================
window.Zombies = (function(){
  'use strict';

  // ============================================================
  // ZOMBIE TYPES
  // ============================================================
  var TYPES = {
    common: {
      name: 'Common Infected',
      r: 15, speed: 1.05, hp: 28, dmg: 8,
      color: '#5c6e4f', dark: '#33402b',
      score: 5, big: false, pushDist: 26
    },
    runner: {
      name: 'Runner',
      r: 12, speed: 2.85, hp: 18, dmg: 7,
      color: '#8a5a3c', dark: '#4f3320',
      score: 10, big: false, pushDist: 38
    },
    brute: {
      name: 'Brute',
      r: 28, speed: 0.7, hp: 220, dmg: 28,
      color: '#4a3f55', dark: '#241f2c',
      score: 50, big: true, pushDist: 6
    },
    spitter: {
      name: 'Spitter',
      r: 14, speed: 0.9, hp: 26, dmg: 0,
      color: '#4f7a3f', dark: '#2a3f24',
      score: 20, big: false, pushDist: 24,
      ranged: true,
      preferDist: 260,
      projectileSpeed: 5.4,
      spitDamage: 8,
      spitCooldownMin: 130,
      spitCooldownMax: 190
    },
    smoker: {
      name: 'Smoker',
      r: 16, speed: 1.0, hp: 50, dmg: 12,
      color: '#5a5a3a', dark: '#2a2a1a',
      score: 35, big: false, pushDist: 20,
      smoker: true,
      tongueRange: 380,
      tongueSpeed: 8,
      tonguePullPower: 3.2,
      tongueChokeDuration: 240,
      tongueDamagePerSec: 6,
      tongueCooldown: 200
    },
    boomer: {
      name: 'Boomer',
      r: 20, speed: 0.85, hp: 40, dmg: 0,
      color: '#6b5a3a', dark: '#3a2f1a',
      score: 30, big: true, pushDist: 14,
      boomer: true,
      vomitRange: 180,
      vomitDuration: 240,
      vomitBotDuration: 180
    },
    hunter: {
      name: 'Hunter',
      r: 13, speed: 3.4, hp: 24, dmg: 16,
      color: '#7a5a3a', dark: '#3f2d1a',
      score: 25, big: false, pushDist: 34,
      hunter: true,
      pounceRange: 260,
      pouncePower: 7.5,
      pounceDuration: 26,
      pinDuration: 300,
      pinDamagePerSec: 8
    },
    jockey: {
      name: 'Jockey',
      r: 12, speed: 3.0, hp: 30, dmg: 14,
      color: '#7a5a7a', dark: '#3a1a1a',
      score: 40, big: false, pushDist: 30,
      jockey: true,
      pounceRange: 200,
      pouncePower: 7.0,
      pounceDuration: 26,
      rideDuration: 240,
      rideDamagePerSec: 10,
      rideSteerSpeed: 3.5
    },
    charger: {
      name: 'Charger',
      r: 22, speed: 1.6, hp: 120, dmg: 22,
      color: '#6a3a4a', dark: '#2a1a2a',
      score: 60, big: true, pushDist: 8,
      charger: true,
      chargeRange: 320,
      chargePower: 10,
      chargeDuration: 32,
      chargeCooldown: 180,
      slamDamage: 30,
      slamRadius: 90
    },
    witch: {
      name: 'Witch',
      r: 18, speed: 5.0, hp: 200, dmg: 40,
      color: '#a05a5a', dark: '#4a1a1a',
      score: 100, big: false, pushDist: 10,
      witch: true,
      aggroRange: 250,
      clawDamage: 55,
      clawCooldown: 90,
      crippleDuration: 300,
      crippleSpeedMult: 0.30
    },
    tank: {
      name: 'TANK',
      r: 42, speed: 1.1, hp: 5236, dmg: 60,
      color: '#3a2a2a', dark: '#1a1010',
      score: 300, big: true, pushDist: 2,
      tank: true,
      punchRange: 110,
      punchDamage: 55,
      punchKnockback: 60,
      punchCooldown: 90,
      rockRange: 500,
      rockSpeed: 8,
      rockDamage: 40,
      rockCooldown: 240
    }
  };

  function get(type){ return TYPES[type] || TYPES.common; }
  function listTypes(){ return Object.keys(TYPES); }

  // ============================================================
  // SOLID CHECK HELPER
  // ============================================================
  function canMoveTo(x, y){
    if(!window.World || !window.World.isSolidAt) return true;
    return !window.World.isSolidAt(x, y);
  }

  // ============================================================
  // SPAWN — faqat spawn pointlardan
  // ============================================================
  function spawn(game, type, canvasW, canvasH){
    var cfg = TYPES[type];
    if(!cfg) return;

    // === SPAWN POINTLARDAN ===
    var spawnPoints = null;
    if(window.World && window.World.getZombieSpawns){
      spawnPoints = window.World.getZombieSpawns();
    }

    var spawnX, spawnY;

    if(spawnPoints && spawnPoints.length > 0){
      // Tasodifiy spawn point
      var sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
      spawnX = sp.x + (Math.random() - 0.5) * 40;
      spawnY = sp.y + (Math.random() - 0.5) * 40;
    } else {
      // Fallback — ekrandan tashqarida
      var p = game.player;
      var ang = Math.random() * Math.PI * 2;
      var dist = Math.hypot(canvasW, canvasH) * 0.6 + 80 + Math.random() * 200;
      spawnX = p.x + Math.cos(ang) * dist;
      spawnY = p.y + Math.sin(ang) * dist;
    }

    game.zombies.push({
      type: type,
      x: spawnX, y: spawnY,
      r: cfg.r,
      hp: cfg.hp, maxHp: cfg.hp,
      speed: cfg.speed, dmg: cfg.dmg,
      hitFlash: 0,
      target: null, targetLockTimer: 0,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 0,
      spitCooldown: cfg.ranged ? (cfg.spitCooldownMin || 130) : 0,
      pounceTimer: 0,
      isPouncing: false,
      pounceDx: 0, pounceDy: 0,
      pounceCooldown: 0,
      chargerTimer: 0,
      isCharging: false,
      chargeDX: 0, chargeDY: 0,
      chargeCooldown: 0,
      witchAggro: false,
      clawCooldown: 0,
      tankAttackTimer: 0,
      tankRockTimer: 120 + Math.random()*120,
      tongueCooldown: 60,
      tongue: null,
      pushVX: 0, pushVY: 0
    });
  }

  // ============================================================
  // PICK TYPE
  // ============================================================
  function pickType(game){
    var r = Math.random();
    var t = game.elapsed || 0;
    var horde = game.hordeActive && game.heli.state === 'incoming';

    if(horde){
      if(r < 0.30) return 'common';
      if(r < 0.48) return 'runner';
      if(r < 0.60) return 'hunter';
      if(r < 0.68) return 'jockey';
      if(r < 0.76) return 'spitter';
      if(r < 0.82) return 'smoker';
      if(r < 0.88) return 'brute';
      if(r < 0.93) return 'charger';
      if(r < 0.97) return 'boomer';
      return 'witch';
    }

    if(t < 30){
      if(r < 0.85) return 'common';
      if(r < 0.95) return 'runner';
      return 'spitter';
    }
    if(t < 90){
      if(r < 0.60) return 'common';
      if(r < 0.78) return 'runner';
      if(r < 0.86) return 'hunter';
      if(r < 0.92) return 'jockey';
      if(r < 0.96) return 'spitter';
      if(r < 0.98) return 'smoker';
      return 'brute';
    }
    if(t < 200){
      if(r < 0.45) return 'common';
      if(r < 0.62) return 'runner';
      if(r < 0.72) return 'hunter';
      if(r < 0.78) return 'jockey';
      if(r < 0.84) return 'spitter';
      if(r < 0.89) return 'smoker';
      if(r < 0.94) return 'brute';
      if(r < 0.97) return 'charger';
      if(r < 0.99) return 'boomer';
      return 'witch';
    }
    if(r < 0.35) return 'common';
    if(r < 0.52) return 'runner';
    if(r < 0.62) return 'hunter';
    if(r < 0.68) return 'jockey';
    if(r < 0.74) return 'spitter';
    if(r < 0.79) return 'smoker';
    if(r < 0.85) return 'brute';
    if(r < 0.90) return 'charger';
    if(r < 0.94) return 'boomer';
    if(r < 0.97) return 'witch';
    return 'tank';
  }

  // ============================================================
  // TARGETING
  // ============================================================
  function findNearestTarget(game, z){
    var targets = [game.player];
    for(var i = 0; i < game.companions.length; i++){
      if(!game.companions[i].isDown) targets.push(game.companions[i]);
    }
    var best = null, bestD = Infinity;
    for(var t = 0; t < targets.length; t++){
      var tg = targets[t];
      var d = Math.hypot(tg.x - z.x, tg.y - z.y);
      if(d < bestD){ bestD = d; best = tg; }
    }
    return { target: best, dist: bestD };
  }

  // ============================================================
  // HARAKAT — devor tekshiruvi bilan
  // ============================================================
  function tryMove(z, dx, dy){
    var newX = z.x + dx;
    var newY = z.y + dy;

    if(canMoveTo(newX, z.y)) z.x = newX;
    if(canMoveTo(z.x, newY)) z.y = newY;
  }

  // ============================================================
  // BEHAVIOR: Ranged
  // ============================================================
  function behaveRanged(game, z, cfg, dx, dy, dist, ux, uy, speedMul, dt){
    z.spitCooldown -= dt;
    var pref = cfg.preferDist || 260;

    if(dist > pref + 20) tryMove(z, ux * z.speed * speedMul * dt, uy * z.speed * speedMul * dt);
    else if(dist < pref - 20) tryMove(z, -ux * z.speed * speedMul * dt, -uy * z.speed * speedMul * dt);
    else {
      z.wanderTimer -= dt;
      if(z.wanderTimer <= 0){
        z.wanderAngle = (Math.random() - 0.5) * 1.2;
        z.wanderTimer = 40 + Math.random() * 40;
      }
      tryMove(z, -uy * z.wanderAngle * 0.6 * dt, ux * z.wanderAngle * 0.6 * dt);
    }

    if(z.spitCooldown <= 0 && dist < 520){
      z.spitCooldown = (cfg.spitCooldownMin || 130) +
        Math.random() * ((cfg.spitCooldownMax || 190) - (cfg.spitCooldownMin || 130));
      var ang = Math.atan2(dy, dx);
      var ps = cfg.projectileSpeed || 5.4;
      game.zProjectiles.push({
        x: z.x, y: z.y,
        dx: Math.cos(ang) * ps,
        dy: Math.sin(ang) * ps,
        dmg: cfg.spitDamage || 8,
        life: 120,
        kind: 'spit'
      });
      window.SFX.sfx.spit();
    }
  }

  // ============================================================
  // BEHAVIOR: Hunter
  // ============================================================
  function behaveHunter(game, z, cfg, dx, dy, dist, ux, uy, speedMul, dt){
    if(z.isPouncing){
      tryMove(z, z.pounceDx * dt, z.pounceDy * dt);
      z.pounceTimer -= dt;

      var p = z.target;
      if(p && p.isPlayer && Math.hypot(p.x-z.x, p.y-z.y) < z.r + p.r + 6){
        if(!game.player.pinned){
          game.player.pinned = {
            zombie: z,
            timer: cfg.pinDuration || 300,
            damageTimer: 0,
            kind: 'hunter'
          };
          game.player.controlBlocked = true;
          z.isPouncing = false;
          z.pounceTimer = 0;
        }
      }
      if(z.pounceTimer <= 0) z.isPouncing = false;
      return;
    }

    if(z.pounceCooldown > 0) z.pounceCooldown -= dt;

    if(dist < (cfg.pounceRange || 260) && z.pounceCooldown <= 0){
      z.isPouncing = true;
      z.pounceTimer = cfg.pounceDuration || 26;
      z.pounceDx = ux * (cfg.pouncePower || 7.5);
      z.pounceDy = uy * (cfg.pouncePower || 7.5);
    } else {
      tryMove(z, ux * z.speed * speedMul * dt, uy * z.speed * speedMul * dt);
    }
  }

  // ============================================================
  // BEHAVIOR: Jockey
  // ============================================================
  function behaveJockey(game, z, cfg, dx, dy, dist, ux, uy, speedMul, dt){
    if(z.isPouncing){
      tryMove(z, z.pounceDx * dt, z.pounceDy * dt);
      z.pounceTimer -= dt;
      var p = z.target;
      if(p && p.isPlayer && Math.hypot(p.x-z.x, p.y-z.y) < z.r + p.r + 6){
        if(!game.player.ridden){
          game.player.ridden = {
            zombie: z,
            timer: cfg.rideDuration || 240,
            damageTimer: 0,
            steerAngle: Math.random() * Math.PI * 2
          };
          game.player.controlBlocked = true;
          z.isPouncing = false;
          z.pounceTimer = 0;
        }
      }
      if(z.pounceTimer <= 0) z.isPouncing = false;
      return;
    }
    if(z.pounceCooldown > 0) z.pounceCooldown -= dt;
    if(dist < (cfg.pounceRange || 200) && z.pounceCooldown <= 0){
      z.isPouncing = true;
      z.pounceTimer = cfg.pounceDuration || 26;
      z.pounceDx = ux * (cfg.pouncePower || 7.0);
      z.pounceDy = uy * (cfg.pouncePower || 7.0);
    } else {
      tryMove(z, ux * z.speed * speedMul * dt, uy * z.speed * speedMul * dt);
    }
  }

  // ============================================================
  // BEHAVIOR: Boomer
  // ============================================================
  function behaveBoomer(game, z, cfg, dx, dy, dist, ux, uy, speedMul, dt){
    tryMove(z, ux * z.speed * speedMul * dt, uy * z.speed * speedMul * dt);
    if(z.vomitCooldown > 0) z.vomitCooldown -= dt;
    if(dist < (cfg.vomitRange || 180) && (z.vomitCooldown == null || z.vomitCooldown <= 0)){
      z.vomitCooldown = 999;
      var p = z.target;
      if(p.isPlayer) game.player.vomitTimer = cfg.vomitDuration || 240;
      else p.vomitTimer = cfg.vomitBotDuration || 180;
      damagePlayer(game, 5);
      spawnParticles(game, z.x, z.y, 30, '#7a9a3a', 6);
      game.shake = 8;
      z.hp = 0;
    }
  }

  // ============================================================
  // BEHAVIOR: Charger
  // ============================================================
  function behaveCharger(game, z, cfg, ux, uy, dist, speedMul, dt){
    z.chargerTimer -= dt;
    if(z.chargeCooldown > 0) z.chargeCooldown -= dt;

    if(z.isCharging){
      tryMove(z, z.chargeDX * dt, z.chargeDY * dt);
      z.chargerTimer -= dt;
      var p = z.target;
      if(p && p.isPlayer && Math.hypot(p.x-z.x, p.y-z.y) < z.r + p.r + 4){
        if(!game.player.charged){
          game.player.charged = {
            zombie: z,
            timer: 150,
            slamTimer: 60,
            chargeDX: z.chargeDX,
            chargeDY: z.chargeDY
          };
          game.player.controlBlocked = true;
          z.isCharging = false;
          z.chargerTimer = 0;
          z.chargeCooldown = cfg.chargeCooldown || 180;
        }
      }
      if(z.chargerTimer <= 0){
        z.isCharging = false;
        z.chargeCooldown = cfg.chargeCooldown || 180;
      }
      return;
    }

    if(dist < (cfg.chargeRange || 320) && z.chargeCooldown <= 0){
      z.isCharging = true;
      z.chargerTimer = cfg.chargeDuration || 32;
      z.chargeDX = ux * (cfg.chargePower || 10);
      z.chargeDY = uy * (cfg.chargePower || 10);
    } else {
      tryMove(z, ux * z.speed * speedMul * dt, uy * z.speed * speedMul * dt);
    }
  }

  // ============================================================
  // BEHAVIOR: Witch
  // ============================================================
  function behaveWitch(game, z, cfg, ux, uy, dist, speedMul, dt){
    if(z.clawCooldown > 0) z.clawCooldown -= dt;
    if(!z.witchAggro){
      z.wanderTimer -= dt;
      if(z.wanderTimer <= 0){
        z.wanderAngle = Math.random() * Math.PI * 2;
        z.wanderTimer = 90;
      }
      tryMove(z, Math.cos(z.wanderAngle) * 0.3 * dt, Math.sin(z.wanderAngle) * 0.3 * dt);
      if(dist < (cfg.aggroRange || 250)) z.witchAggro = true;
      return;
    }
    if(dist > z.r + 20){
      tryMove(z, ux * z.speed * speedMul * dt, uy * z.speed * speedMul * dt);
    } else if(z.clawCooldown <= 0){
      z.clawCooldown = cfg.clawCooldown || 90;
      var p = z.target;
      if(p.isPlayer){
        damagePlayer(game, cfg.clawDamage || 55);
        game.player.crippled = {
          timer: cfg.crippleDuration || 300,
          speedMult: cfg.crippleSpeedMult || 0.30
        };
        spawnParticles(game, p.x, p.y, 20, '#a02a2a', 5);
        game.shake = 12;
      } else {
        damageCompanion(game, p, cfg.clawDamage || 55);
      }
    }
  }

  // ============================================================
  // BEHAVIOR: Tank
  // ============================================================
  function behaveTank(game, z, cfg, ux, uy, dist, dx, dy, speedMul, dt){
    if(z.tankAttackTimer > 0) z.tankAttackTimer -= dt;
    if(z.tankRockTimer > 0) z.tankRockTimer -= dt;

    if(dist < (cfg.punchRange || 110)){
      if(z.tankAttackTimer <= 0){
        z.tankAttackTimer = cfg.punchCooldown || 90;
        var p = z.target;
        if(p.isPlayer){
          damagePlayer(game, cfg.punchDamage || 55);
          var kx = (p.x - z.x) / dist;
          var ky = (p.y - z.y) / dist;
          var kb = cfg.punchKnockback || 60;
          p.x += kx * kb;
          p.y += ky * kb;
          p.knockbackVX = kx * 22;
          p.knockbackVY = ky * 22;
          game.shake = 18;
          game.damageFlash = 1;
          window.SFX.sfx.hurt();
        } else {
          damageCompanion(game, p, cfg.punchDamage || 55);
          p.x += (p.x - z.x) / dist * 40;
          p.y += (p.y - z.y) / dist * 40;
        }
        spawnParticles(game, z.x + ux*30, z.y + uy*30, 18, '#8a2a20', 6);
      }
    } else if(dist < (cfg.rockRange || 500) && z.tankRockTimer <= 0){
      z.tankRockTimer = cfg.rockCooldown || 240;
      game.zProjectiles.push({
        x: z.x, y: z.y,
        dx: ux * (cfg.rockSpeed || 8),
        dy: uy * (cfg.rockSpeed || 8),
        dmg: cfg.rockDamage || 40,
        life: 90,
        kind: 'rock'
      });
      window.SFX.sfx.throwItem();
    }
    tryMove(z, ux * z.speed * speedMul * dt, uy * z.speed * speedMul * dt);
  }

  // ============================================================
  // BEHAVIOR: Smoker
  // ============================================================
  function behaveSmoker(game, z, cfg, ux, uy, dist, dt){
    if(z.tongueCooldown > 0) z.tongueCooldown -= dt;

    if(z.tongue){
      var t = z.tongue;
      t.x += t.dx * dt;
      t.y += t.dy * dt;
      t.life -= dt;
      var p = z.target;
      if(!t.hit && p && p.isPlayer){
        if(Math.hypot(p.x - t.x, p.y - t.y) < p.r + 8){
          t.hit = true;
          game.player.smoked = {
            zombie: z,
            timer: cfg.tongueChokeDuration || 240,
            damageTimer: 0
          };
          game.player.controlBlocked = true;
          z.tongue = null;
          return;
        }
      }
      if(t.life <= 0){ z.tongue = null; return; }
      return;
    }

    var pref = 320;
    if(dist > pref + 30) tryMove(z, ux * z.speed * dt, uy * z.speed * dt);
    else if(dist < pref - 30) tryMove(z, -ux * z.speed * dt, -uy * z.speed * dt);
    else {
      z.wanderTimer -= dt;
      if(z.wanderTimer <= 0){ z.wanderAngle = (Math.random()-0.5)*1; z.wanderTimer = 40; }
      tryMove(z, -uy * z.wanderAngle * 0.4 * dt, ux * z.wanderAngle * 0.4 * dt);
    }

    if(z.tongueCooldown <= 0 && dist < (cfg.tongueRange || 380)){
      z.tongueCooldown = cfg.tongueCooldown || 200;
      var ang = Math.atan2(game.player.y - z.y, game.player.x - z.x);
      var ts = cfg.tongueSpeed || 8;
      z.tongue = {
        x: z.x, y: z.y,
        dx: Math.cos(ang) * ts,
        dy: Math.sin(ang) * ts,
        life: 40,
        hit: false
      };
      window.SFX.sfx.spit();
    }
  }

  // ============================================================
  // BEHAVIOR: Common
  // ============================================================
  function behaveCommon(game, z, ux, uy, speedMul, dt){
    z.wanderTimer -= dt;
    if(z.wanderTimer <= 0){
      z.wanderAngle = (Math.random() - 0.5) * 0.8;
      z.wanderTimer = 40 + Math.random() * 40;
    }
    var wobbleX = -uy * z.wanderAngle;
    var wobbleY = ux * z.wanderAngle;

    var moveX = (ux + wobbleX * 0.5) * z.speed * speedMul;
    var moveY = (uy + wobbleY * 0.5) * z.speed * speedMul;

    tryMove(z, moveX * dt, moveY * dt);
  }

  // ============================================================
  // UPDATE
  // ============================================================
  function update(game, z, dt){
    var cfg = TYPES[z.type];

    // Push harakat
    if(Math.abs(z.pushVX) > 0.1 || Math.abs(z.pushVY) > 0.1){
      tryMove(z, z.pushVX * dt, z.pushVY * dt);
      z.pushVX *= 0.85;
      z.pushVY *= 0.85;
    }

    z.targetLockTimer -= dt;
    if(z.targetLockTimer <= 0 || !z.target || z.target.isDown){
      var nt = findNearestTarget(game, z);
      z.target = nt.target;
      z.targetLockTimer = 30 + Math.random() * 30;
    }
    if(!z.target) return;

    var dx = z.target.x - z.x;
    var dy = z.target.y - z.y;
    var dist = Math.hypot(dx, dy) || 1;
    var ux = dx / dist;
    var uy = dy / dist;
    var speedMul = (game.hordeActive && game.heli.state === 'incoming') ? 1.15 : 1.0;

    if(cfg.smoker)       behaveSmoker(game, z, cfg, ux, uy, dist, dt);
    else if(cfg.hunter)  behaveHunter(game, z, cfg, dx, dy, dist, ux, uy, speedMul, dt);
    else if(cfg.jockey)  behaveJockey(game, z, cfg, dx, dy, dist, ux, uy, speedMul, dt);
    else if(cfg.boomer)  behaveBoomer(game, z, cfg, dx, dy, dist, ux, uy, speedMul, dt);
    else if(cfg.charger) behaveCharger(game, z, cfg, ux, uy, dist, speedMul, dt);
    else if(cfg.witch)   behaveWitch(game, z, cfg, ux, uy, dist, speedMul, dt);
    else if(cfg.tank)    behaveTank(game, z, cfg, ux, uy, dist, dx, dy, speedMul, dt);
    else if(cfg.ranged)  behaveRanged(game, z, cfg, dx, dy, dist, ux, uy, speedMul, dt);
    else                 behaveCommon(game, z, ux, uy, speedMul, dt);

    if(z.hitFlash > 0) z.hitFlash -= dt;

    var p = z.target;
    var pd = Math.hypot(p.x - z.x, p.y - z.y);
    if(pd < z.r + p.r && z.dmg > 0){
      if(p.isPlayer){
        if(game.player.hurtCooldown <= 0){
          damagePlayer(game, z.dmg);
          game.player.hurtCooldown = 36;
          var kx=(p.x-z.x)/pd, ky=(p.y-z.y)/pd;
          p.x += kx*14; p.y += ky*14;
        }
      } else {
        if(p.hurtCooldown <= 0){
          damageCompanion(game, p, z.dmg);
          p.hurtCooldown = 36;
        }
      }
    }
  }

  // ============================================================
  // KILL
  // ============================================================
  function kill(game, index){
    var z = game.zombies[index];
    if(!z) return;
    var cfg = TYPES[z.type];
    game.score += cfg.score;
    game.kills++;
    spawnParticles(game, z.x, z.y, 14, '#8a2a20', 4);
    game.shake = Math.max(game.shake, cfg.big ? 8 : 4);
    if(cfg.big) window.SFX.sfx.bigZombieDown();

    if(game.player.pinned && game.player.pinned.zombie === z){
      game.player.pinned = null;
      game.player.controlBlocked = false;
    }
    if(game.player.ridden && game.player.ridden.zombie === z){
      game.player.ridden = null;
      game.player.controlBlocked = false;
    }
    if(game.player.smoked && game.player.smoked.zombie === z){
      game.player.smoked = null;
      game.player.controlBlocked = false;
    }
    if(game.player.charged && game.player.charged.zombie === z){
      game.player.charged = null;
      game.player.controlBlocked = false;
    }

    if(cfg.big) dropLoot(game, z);
    if(cfg.tank){ dropLoot(game, z); dropLoot(game, z); }
    if(cfg.witch) dropLoot(game, z);

    game.zombies.splice(index, 1);
  }

  // ============================================================
  // LOOT
  // ============================================================
  function dropLoot(game, z){
    if(Math.random() > 0.7) return;
    var roll = Math.random();
    var type;
    if(roll < 0.30)      type = 'health';
    else if(roll < 0.48) type = 'ammo_pistol';
    else if(roll < 0.64) type = 'ammo_shotgun';
    else if(roll < 0.78) type = 'ammo_rifle';
    else if(roll < 0.86) type = 'aid';
    else if(roll < 0.92) type = 'grenade';
    else if(roll < 0.96) type = 'pipebomb';
    else                 type = 'syringe';

    var angle = Math.random() * Math.PI * 2;
    var dropDist = 30 + Math.random() * 40;
    game.pickups.push({
      type: type,
      x: z.x + Math.cos(angle) * dropDist,
      y: z.y + Math.sin(angle) * dropDist,
      r: 14,
      bob: Math.random() * Math.PI * 2,
      justDropped: true,
      dropLife: 1200,
      pickupCooldown: 20
    });
  }

  // ============================================================
  // PARTICLES
  // ============================================================
  function spawnParticles(game, x, y, count, color, speedMul){
    for(var i = 0; i < count; i++){
      var a = Math.random() * Math.PI * 2;
      var s = (0.5 + Math.random() * 2) * (speedMul || 1);
      game.particles.push({
        x: x, y: y,
        dx: Math.cos(a) * s, dy: Math.sin(a) * s,
        life: 20 + Math.random() * 20, maxLife: 40,
        color: color, size: 2 + Math.random() * 3
      });
    }
  }

  // ============================================================
  // DAMAGE
  // ============================================================
  function damagePlayer(game, amount){
    if(amount <= 0 || game.over) return;
    game.player.hp -= amount;
    game.player.hitFlash = 6;
    game.damageFlash = 1;
    game.shake = Math.max(game.shake, 6);
    window.SFX.sfx.hurt();
    if(game.player.hp <= 0){
      game.player.hp = 0;
      if(window.Game && window.Game.loseGame) window.Game.loseGame();
    }
  }

  function damageCompanion(game, c, amount){
    if(c.isDown) return;
    c.hp -= amount;
    c.hitFlash = 6;
    if(c.hp <= 0){
      c.hp = 0;
      c.isDown = true;
      c.downTimer = 600;
      spawnParticles(game, c.x, c.y, 12, '#8a2a20', 3);
    }
  }

  // ============================================================
  // TANK SPAWN
  // ============================================================
  function spawnTankFromEdge(game, canvasW, canvasH){
    var spawnPoints = null;
    if(window.World && window.World.getZombieSpawns){
      spawnPoints = window.World.getZombieSpawns();
    }

    var x, y;
    if(spawnPoints && spawnPoints.length > 0){
      var sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
      x = sp.x + (Math.random() - 0.5) * 40;
      y = sp.y + (Math.random() - 0.5) * 40;
    } else {
      var p = game.player;
      var ang = Math.random() * Math.PI * 2;
      var dist = Math.hypot(canvasW, canvasH) * 0.6 + 100;
      x = p.x + Math.cos(ang) * dist;
      y = p.y + Math.sin(ang) * dist;
    }

    var cfg = TYPES.tank;

    var tank = {
      type: 'tank',
      x: x, y: y, r: cfg.r,
      hp: cfg.hp, maxHp: cfg.hp,
      speed: cfg.speed, dmg: cfg.dmg,
      hitFlash: 0,
      target: null, targetLockTimer: 0,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 0,
      spitCooldown: 0,
      pounceTimer: 0, isPouncing: false, pounceDx: 0, pounceDy: 0,
      pounceCooldown: 0,
      chargerTimer: 0, isCharging: false, chargeDX: 0, chargeDY: 0,
      chargeCooldown: 0,
      witchAggro: false, clawCooldown: 0,
      tankAttackTimer: 0,
      tankRockTimer: 120 + Math.random()*120,
      tongueCooldown: 0, tongue: null,
      pushVX: 0, pushVY: 0,
      isSpecialTank: true,
      entranceEffect: 60,
      announced: false
    };
    game.zombies.push(tank);
    return tank;
  }

  // ============================================================
  // EXPORT
  // ============================================================
  return {
    TYPES: TYPES,
    get: get,
    listTypes: listTypes,
    spawn: spawn,
    pickType: pickType,
    update: update,
    kill: kill,
    dropLoot: dropLoot,
    spawnParticles: spawnParticles,
    damagePlayer: damagePlayer,
    damageCompanion: damageCompanion,
    spawnTankFromEdge: spawnTankFromEdge
  };
})();