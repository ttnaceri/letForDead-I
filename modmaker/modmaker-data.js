// ============================================================
// modmaker-data.js — Zombie va Qurol default data
// Let For Dead
// ============================================================
window.ModData = (function(){
  'use strict';

  // ============================================================
  // ZOMBIE TURLARI
  // ============================================================
  var ZOMBIE_DEFAULTS = {
    common: {
      id: 'common', name: 'Common Infected',
      color: '#5c6e4f', dark: '#33402b',
      radius: 15, speed: 1.05, hp: 28, damage: 8, score: 5,
      big: false, pushDist: 26, behavior: 'normal'
    },
    runner: {
      id: 'runner', name: 'Runner',
      color: '#8a5a3c', dark: '#4f3320',
      radius: 12, speed: 2.85, hp: 18, damage: 7, score: 10,
      big: false, pushDist: 38, behavior: 'normal'
    },
    brute: {
      id: 'brute', name: 'Brute',
      color: '#4a3f55', dark: '#241f2c',
      radius: 28, speed: 0.7, hp: 220, damage: 28, score: 50,
      big: true, pushDist: 6, behavior: 'normal'
    },
    spitter: {
      id: 'spitter', name: 'Spitter',
      color: '#4f7a3f', dark: '#2a3f24',
      radius: 14, speed: 0.9, hp: 26, damage: 0, score: 20,
      big: false, pushDist: 24, behavior: 'ranged',
      ranged: { preferDist: 260, projectileSpeed: 5.4, spitDamage: 8, cooldownMin: 130, cooldownMax: 190 }
    },
    hunter: {
      id: 'hunter', name: 'Hunter',
      color: '#7a5a3a', dark: '#3f2d1a',
      radius: 13, speed: 3.4, hp: 24, damage: 16, score: 25,
      big: false, pushDist: 34, behavior: 'pouncer',
      pouncer: { pounceRange: 260, pouncePower: 7.5, pounceDuration: 26, pinDuration: 300, pinDamagePerSec: 8 }
    },
    jockey: {
      id: 'jockey', name: 'Jockey',
      color: '#7a5a7a', dark: '#3a1a1a',
      radius: 12, speed: 3.0, hp: 30, damage: 14, score: 40,
      big: false, pushDist: 30, behavior: 'pouncer',
      pouncer: { pounceRange: 200, pouncePower: 7.0, pounceDuration: 26, pinDuration: 240, pinDamagePerSec: 10 }
    },
    boomer: {
      id: 'boomer', name: 'Boomer',
      color: '#6b5a3a', dark: '#3a2f1a',
      radius: 20, speed: 0.85, hp: 40, damage: 0, score: 30,
      big: true, pushDist: 14, behavior: 'exploder',
      exploder: { explodeRange: 60, explodeRadius: 130, explodeDamage: 12, explodeBotDamage: 18 }
    },
    smoker: {
      id: 'smoker', name: 'Smoker',
      color: '#5a5a3a', dark: '#2a2a1a',
      radius: 16, speed: 1.0, hp: 50, damage: 12, score: 35,
      big: false, pushDist: 20, behavior: 'smoker',
      smoker: { tongueRange: 380, tongueSpeed: 8, tonguePullPower: 3.2, tongueChokeDuration: 240, tongueDamagePerSec: 6, tongueCooldown: 200 }
    },
    charger: {
      id: 'charger', name: 'Charger',
      color: '#6a3a4a', dark: '#2a1a2a',
      radius: 22, speed: 1.6, hp: 120, damage: 22, score: 60,
      big: true, pushDist: 8, behavior: 'charger',
      charger: { chargeRange: 320, chargePower: 10, chargeDuration: 32, chargeCooldown: 180, slamDamage: 30, slamRadius: 90 }
    },
    witch: {
      id: 'witch', name: 'Witch',
      color: '#a05a5a', dark: '#4a1a1a',
      radius: 18, speed: 5.0, hp: 200, damage: 40, score: 100,
      big: false, pushDist: 10, behavior: 'witch',
      witch: { aggroRange: 250, clawDamage: 55, clawCooldown: 90, crippleDuration: 300, crippleSpeedMult: 0.30 }
    },
    tank: {
      id: 'tank', name: 'TANK',
      color: '#3a2a2a', dark: '#1a1010',
      radius: 42, speed: 1.1, hp: 5236, damage: 60, score: 300,
      big: true, pushDist: 2, behavior: 'tank',
      tank: { punchRange: 110, punchDamage: 55, punchKnockback: 60, punchCooldown: 90, rockRange: 500, rockSpeed: 8, rockDamage: 40, rockCooldown: 240 }
    }
  };

  var ZOMBIE_BEHAVIORS = [
    { id: 'normal',   name: 'Normal — hujum' },
    { id: 'ranged',   name: 'Ranged — uzoqdan' },
    { id: 'pouncer',  name: 'Pouncer — sakraydi' },
    { id: 'exploder', name: 'Exploder — portlaydi' },
    { id: 'smoker',   name: 'Smoker — tili bilan' },
    { id: 'charger',  name: 'Charger — uradi' },
    { id: 'witch',    name: 'Witch — aggro' },
    { id: 'tank',     name: 'Tank — boss' }
  ];

  // ============================================================
  // QUROL DEFAULT — SNIPER turlari ham bor
  // ============================================================
  var WEAPON_DEFAULTS = {
    pistol: {
      id: 'pistol', name: 'Pistol',
      slot: 2, kind: 'gun',
      damage: 22, cooldown: 13, bulletSpeed: 11,
      spread: 0.03, pellets: 1,
      magSize: 15, reloadTime: 60,
      infinite: true, ammoMax: 999, ammoPerPickup: 0,
      color: '#c98a2e',
      sound: 'pistol',
      reloadSound: 'pistol_reload'
    },
    uzi: {
      id: 'uzi', name: 'UZI',
      slot: 1, kind: 'gun',
      damage: 12, cooldown: 4, bulletSpeed: 15,
      spread: 0.13, pellets: 1,
      magSize: 50, reloadTime: 90,
      ammoMax: 650, ammoPerPickup: 100,
      color: '#4a8ed4',
      sound: 'smg',
      reloadSound: 'smg_reload'
    },
    smg: {
      id: 'smg', name: 'SMG',
      slot: 1, kind: 'gun',
      damage: 12, cooldown: 4, bulletSpeed: 15,
      spread: 0.13, pellets: 1,
      magSize: 50, reloadTime: 90,
      ammoMax: 650, ammoPerPickup: 100,
      color: '#4a8ed4',
      sound: 'smg',
      reloadSound: 'smg_reload'
    },
    shotgun: {
      id: 'shotgun', name: 'Pump Shotgun',
      slot: 1, kind: 'gun',
      damage: 15, cooldown: 32, bulletSpeed: 9,
      spread: 0.30, pellets: 6,
      magSize: 8, reloadTime: 95,
      ammoMax: 64, ammoPerPickup: 12,
      color: '#e0523c',
      sound: 'shotgun',
      reloadSound: 'shotgun_reload'
    },
    rifle: {
      id: 'rifle', name: 'M16 Rifle',
      slot: 1, kind: 'gun',
      damage: 30, cooldown: 8, bulletSpeed: 13,
      spread: 0.06, pellets: 1,
      magSize: 30, reloadTime: 80,
      ammoMax: 360, ammoPerPickup: 60,
      color: '#6b8f3f',
      sound: 'rifle',
      reloadSound: 'rifle_reload'
    },
    melee: {
      id: 'melee', name: 'Melee',
      slot: 2, kind: 'melee',
      damage: 45, cooldown: 22,
      meleeRange: 40, meleeArc: 1.2,
      infinite: true,
      color: '#837b6d',
      sound: 'melee',
      reloadSound: null
    },

    // ============================================================
    // SNIPER TURLARI
    // ============================================================
    sniper: {
      id: 'sniper', name: 'Hunting Rifle',
      slot: 1, kind: 'gun',
      subtype: 'sniper',
      damage: 90, cooldown: 60, bulletSpeed: 20,
      spread: 0.005, pellets: 1,
      magSize: 10, reloadTime: 130,
      ammoMax: 60, ammoPerPickup: 15,
      color: '#6b8f3f',
      sound: 'sniper',
      reloadSound: 'sniper_reload',
      scopeZoom: 1.5
    },
    sniper_scout: {
      id: 'sniper_scout', name: 'Scout Sniper',
      slot: 1, kind: 'gun',
      subtype: 'sniper',
      damage: 120, cooldown: 55, bulletSpeed: 24,
      spread: 0.003, pellets: 1,
      magSize: 10, reloadTime: 120,
      ammoMax: 80, ammoPerPickup: 18,
      color: '#4a8ed4',
      sound: 'sniper',
      reloadSound: 'sniper_reload',
      scopeZoom: 1.8
    },
    sniper_military: {
      id: 'sniper_military', name: 'Military Sniper',
      slot: 1, kind: 'gun',
      subtype: 'sniper',
      damage: 150, cooldown: 80, bulletSpeed: 22,
      spread: 0.002, pellets: 1,
      magSize: 30, reloadTime: 150,
      ammoMax: 90, ammoPerPickup: 20,
      color: '#3a3a3a',
      sound: 'sniper',
      reloadSound: 'sniper_reload',
      scopeZoom: 2.0
    },
    sniper_awp: {
      id: 'sniper_awp', name: 'AWP',
      slot: 1, kind: 'gun',
      subtype: 'sniper',
      damage: 250, cooldown: 100, bulletSpeed: 25,
      spread: 0.001, pellets: 1,
      magSize: 5, reloadTime: 160,
      ammoMax: 40, ammoPerPickup: 10,
      color: '#2c2c2c',
      sound: 'sniper',
      reloadSound: 'sniper_reload',
      scopeZoom: 2.5
    },

    // ============================================================
    // AMR — ANTI-MATERIAL RIFLE (default)
    // ============================================================
    sniper_amr: {
      id: 'sniper_amr', name: 'AMR — Anti-Material Rifle',
      slot: 1, kind: 'gun',
      subtype: 'sniper',
      damage: 500, cooldown: 180, bulletSpeed: 30,
      spread: 0.001, pellets: 1,
      magSize: 5, reloadTime: 240,
      ammoMax: 40, ammoPerPickup: 5,
      color: '#8a2a2a',
      sound: 'sniper_heavy',
      reloadSound: 'sniper_heavy_reload',
      scopeZoom: 3.0,
      pierce: 3,               // 3 ta zombie'ni teshib o'tadi
      knockback: 40,           // Katta push
      screenShake: 20          // Kuchli tebranish
    }
  };

  // ============================================================
  // QUROL KINDS
  // ============================================================
  var WEAPON_KINDS = [
    { id: 'gun',      name: 'Gun — o\'q otadi' },
    { id: 'sniper',   name: 'Sniper — uzoq masofa' },
    { id: 'melee',    name: 'Melee — yaqin' },
    { id: 'launcher', name: 'Launcher — granata' },
    { id: 'throw',    name: 'Throwable — uloqtirish' },
    { id: 'heal',     name: 'Heal — davolash' }
  ];

  // ============================================================
  // QUROL OVOZLARI
  // ============================================================
  var WEAPON_SOUNDS = [
    { id: 'pistol',            name: 'Pistol shot' },
    { id: 'smg',               name: 'SMG burst' },
    { id: 'rifle',             name: 'Rifle shot' },
    { id: 'shotgun',           name: 'Shotgun blast' },
    { id: 'sniper',            name: 'Sniper shot' },
    { id: 'sniper_heavy',      name: 'Sniper heavy (AMR)' },
    { id: 'melee',             name: 'Melee swing' },
    { id: 'explosion',         name: 'Explosion' },
    { id: 'silent',            name: 'Silent' },
    { id: 'custom',            name: '⭐ Custom (upload)' }
  ];

  var WEAPON_RELOAD_SOUNDS = [
    { id: null,                 name: '— none —' },
    { id: 'pistol_reload',      name: 'Pistol reload' },
    { id: 'smg_reload',         name: 'SMG reload' },
    { id: 'rifle_reload',       name: 'Rifle reload' },
    { id: 'shotgun_reload',     name: 'Shotgun pump' },
    { id: 'sniper_reload',      name: 'Sniper bolt' },
    { id: 'sniper_heavy_reload',name: 'Sniper heavy (AMR)' },
    { id: 'custom',             name: '⭐ Custom (upload)' }
  ];

  // ============================================================
  // QUROL QISMLARI
  // ============================================================
  var WEAPON_PARTS = [
    { id: 'muzzle',    name: 'Muzzle (o\'q chiqish)',  icon: '🎯' },
    { id: 'grip',      name: 'Grip (tutqich)',         icon: '✋' },
    { id: 'magazine',  name: 'Magazine (o\'qdon)',     icon: '📦' },
    { id: 'stock',     name: 'Stock (orqa)',           icon: '🔙' },
    { id: 'scope',     name: 'Scope (mo\'ljal)',       icon: '🔭' },
    { id: 'barrel',    name: 'Barrel (nay)',           icon: '📏' },
    { id: 'trigger',   name: 'Trigger (tugma)',        icon: '⚡' },
    { id: 'bolt',      name: 'Bolt (miltiq)',          icon: '🔩' },
    { id: 'sight',     name: 'Sight (ko\'rish)',       icon: '👁' },
    { id: 'stock_rear',name: 'Stock Rear (orqa uchi)', icon: '🔚' },
    { id: 'rail',      name: 'Rail (poydevor)',        icon: '⚙️' },
    { id: 'grip_fore', name: 'Foregrip',               icon: '👐' }
  ];

  // ============================================================
  // SERIALIZE
  // ============================================================
  function serializeMod(modData){
    return {
      version: 2,
      type: modData.type,
      id: modData.id,
      name: modData.name,
      data: modData.data,
      sprite: modData.sprite || null,
      parts: modData.parts || [],
      customSounds: modData.customSounds || {},
      createdAt: Date.now()
    };
  }

  return {
    ZOMBIE_DEFAULTS: ZOMBIE_DEFAULTS,
    ZOMBIE_BEHAVIORS: ZOMBIE_BEHAVIORS,
    WEAPON_DEFAULTS: WEAPON_DEFAULTS,
    WEAPON_KINDS: WEAPON_KINDS,
    WEAPON_SOUNDS: WEAPON_SOUNDS,
    WEAPON_RELOAD_SOUNDS: WEAPON_RELOAD_SOUNDS,
    WEAPON_PARTS: WEAPON_PARTS,
    serializeMod: serializeMod
  };
})();