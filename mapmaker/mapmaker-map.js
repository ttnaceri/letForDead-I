// ============================================================
// mapmaker-map.js — Map data, tiles, settings
// Let For Dead
// ============================================================
window.MapData = (function(){
  'use strict';

  // ============================================================
  // TILE TYPES
  // ============================================================
  // category:
  //   'terrain'   — pol, devor, suv
  //   'wall'      — o'tib bo'lmaydigan
  //   'spawn'     — spawn nuqtalari (ko'rinmas)
  //   'keyed'     — E bilan ishlaydigan
  //   'trigger'   — o'q yoki teginish bilan ishlaydigan
  //   'decor'     — dekorativ
  //
  // flags:
  //   solid:      true  — o'tib bo'lmaydi
  //   invisible:  true  — faqat mapmakerda ko'rinadi, o'yinda yashirin
  //   keyed:      true  — E bilan ishlaydi
  //   trigger:    true  — o'q teganda ishga tushadi
  //   playerSpawn: true — player spawn
  //   zombieSpawn: true — zombie spawn
  //   tankSpawn:  true  — tank spawn
  //   transport:  true  — yordam transporti
  // ============================================================
  var TILES = {

    // ============================================================
    // TERRAIN
    // ============================================================
    0:  { id: 0,  name: 'Empty',       color: '#0d0b0a', sub: 'empty',       category: 'terrain' },
    1:  { id: 1,  name: 'Floor',       color: '#5a4a2a', sub: 'walkable',    category: 'terrain' },
    3:  { id: 3,  name: 'Concrete',    color: '#6a5a4a', sub: 'walkable',    category: 'terrain' },
    4:  { id: 4,  name: 'Blood',       color: '#8a2a22', sub: 'walkable',    category: 'terrain' },
    5:  { id: 5,  name: 'Grass',       color: '#4a6a3a', sub: 'walkable',    category: 'terrain' },
    7:  { id: 7,  name: 'Sand',        color: '#9a8a4a', sub: 'walkable',    category: 'terrain' },
    11: { id: 11, name: 'Road',        color: '#3a3a3a', sub: 'walkable',    category: 'terrain' },
    12: { id: 12, name: 'Road Line',   color: '#e0d8c0', sub: 'walkable',    category: 'terrain' },
    23: { id: 23, name: 'Carpet',      color: '#8a4a4a', sub: 'walkable',    category: 'terrain' },
    6:  { id: 6,  name: 'Water',       color: '#2a5a8a', sub: 'slow',        category: 'terrain', slow: true },

    // ============================================================
    // WALLS — hech kim o'tib ketolmaydi
    // ============================================================
    2:  { id: 2,  name: 'Wall',        color: '#8a7a90', sub: 'solid',       category: 'wall', solid: true },
    8:  { id: 8,  name: 'Metal Wall',  color: '#6a6a8a', sub: 'solid',       category: 'wall', solid: true },
    9:  { id: 9,  name: 'Wood Wall',   color: '#8a6a3a', sub: 'solid',       category: 'wall', solid: true },
    10: { id: 10, name: 'Brick Wall',  color: '#a84a2a', sub: 'solid',       category: 'wall', solid: true },
    21: { id: 21, name: 'Fence',       color: '#a09a8a', sub: 'solid',       category: 'wall', solid: true },
    22: { id: 22, name: 'Glass',       color: '#6a8aaa', sub: 'solid',       category: 'wall', solid: true },
    31: { id: 31, name: 'Concrete Wall', color: '#5a5a6a', sub: 'solid',     category: 'wall', solid: true },
    32: { id: 32, name: 'Rust Wall',   color: '#7a4a3a', sub: 'solid',       category: 'wall', solid: true },

    // ============================================================
    // PLAYER SPAWNS (ko'rinmas)
    // ============================================================
    13: { id: 13, name: 'Player 1',    color: '#4a9ee4', sub: 'P1 spawn',    category: 'spawn', invisible: true, playerSpawn: true, playerIndex: 0 },
    14: { id: 14, name: 'Player 2',    color: '#e4c44a', sub: 'P2 spawn',    category: 'spawn', invisible: true, playerSpawn: true, playerIndex: 1 },
    15: { id: 15, name: 'Player 3',    color: '#e44a8a', sub: 'P3 spawn',    category: 'spawn', invisible: true, playerSpawn: true, playerIndex: 2 },
    33: { id: 33, name: 'Player 4',    color: '#8ae45a', sub: 'P4 spawn',    category: 'spawn', invisible: true, playerSpawn: true, playerIndex: 3 },

    // ============================================================
    // ZOMBIE SPAWNS (ko'rinmas)
    // ============================================================
    16: { id: 16, name: 'Zombie Spawn', color: '#8aaa4a', sub: 'zombie',      category: 'spawn', invisible: true, zombieSpawn: true },
    34: { id: 34, name: 'Tank Spawn',   color: '#e0523c', sub: 'tank',       category: 'spawn', invisible: true, tankSpawn: true },
    35: { id: 35, name: 'Common Spawn', color: '#c98a2e', sub: 'common',     category: 'spawn', invisible: true, zombieSpawn: true, zombieType: 'common' },
    36: { id: 36, name: 'Special Spawn', color: '#a32f22', sub: 'special',   category: 'spawn', invisible: true, zombieSpawn: true, zombieType: 'special' },

    // ============================================================
    // PICKUPS (ko'rinmas yoki ko'rinadigan)
    // ============================================================
    17: { id: 17, name: 'Ammo Crate',  color: '#e4a83a', sub: 'ammo',        category: 'spawn', pickupType: 'ammo' },
    18: { id: 18, name: 'AID Kit',     color: '#8fdf62', sub: 'aid',         category: 'spawn', pickupType: 'aid' },
    30: { id: 30, name: 'Patron (∞)',  color: '#8ae45a', sub: 'infinite',    category: 'spawn', pickupType: 'patron' },
    37: { id: 37, name: 'Laser Sight', color: '#4a8ed4', sub: 'laser',       category: 'spawn', pickupType: 'laser' },
    38: { id: 38, name: 'Grenade',     color: '#6b8f3f', sub: 'grenade',     category: 'spawn', pickupType: 'grenade' },
    39: { id: 39, name: 'Turret',      color: '#5a5a7a', sub: 'turret',      category: 'keyed', keyed: true, keyedType: 'turret' },

    // ============================================================
    // KEYED OBJECTS — E bilan ishlaydi
    // ============================================================
    19: { id: 19, name: 'Radio',         color: '#f0b84a', sub: 'call help', category: 'keyed', keyed: true, keyedType: 'radio' },
    24: { id: 24, name: 'Door',          color: '#ba7a3a', sub: 'open/close', category: 'keyed', keyed: true, keyedType: 'door' },
    28: { id: 28, name: 'Gate',          color: '#ba7a3a', sub: 'open/close', category: 'keyed', keyed: true, keyedType: 'gate' },
    40: { id: 40, name: 'Lever',         color: '#e4a83a', sub: 'activate',   category: 'keyed', keyed: true, keyedType: 'lever' },
    41: { id: 41, name: 'Button',        color: '#8ae45a', sub: 'press',      category: 'keyed', keyed: true, keyedType: 'button' },
    42: { id: 42, name: 'Generator',     color: '#c98a2e', sub: 'start',      category: 'keyed', keyed: true, keyedType: 'generator' },
    43: { id: 43, name: 'Elevator Call', color: '#4a8ed4', sub: 'call',       category: 'keyed', keyed: true, keyedType: 'elevator' },

    // ============================================================
    // TRIGGER OBJECTS — o'q teganda ishga tushadi
    // ============================================================
    26: { id: 26, name: 'Sirened Car',   color: '#e4a83a', sub: 'shoot→horde', category: 'trigger', trigger: true, triggerType: 'sirenedCar' },
    44: { id: 44, name: 'Explosive Barrel', color: '#a32f22', sub: 'shoot→boom', category: 'trigger', trigger: true, triggerType: 'barrel' },
    45: { id: 45, name: 'Car Alarm',     color: '#c98a2e', sub: 'shoot→alarm', category: 'trigger', trigger: true, triggerType: 'alarm' },
    27: { id: 27, name: 'Plane Target',  color: '#f0623c', sub: 'call plane',  category: 'trigger', trigger: true, triggerType: 'planeTarget' },

    // ============================================================
    // TRANSPORT (yordam)
    // ============================================================
    20: { id: 20, name: 'Landing Zone',  color: '#8ae45a', sub: 'help arrives', category: 'transport', transport: true },
    46: { id: 46, name: 'Dock',           color: '#4a8ed4', sub: 'boat',        category: 'transport', transport: true, transportType: 'boat' },
    47: { id: 47, name: 'Train Station', color: '#8a6a3a', sub: 'train',       category: 'transport', transport: true, transportType: 'train' },
    48: { id: 48, name: 'Road Exit',     color: '#a09a8a', sub: 'car',         category: 'transport', transport: true, transportType: 'car' },

    // ============================================================
    // OBJECTIVES
    // ============================================================
    25: { id: 25, name: 'Exit Point',   color: '#f0623c', sub: 'objective',    category: 'objective' },

    // ============================================================
    // DECOR
    // ============================================================
    49: { id: 49, name: 'Tree',         color: '#4a6a3a', sub: 'decor',        category: 'decor', solid: true },
    50: { id: 50, name: 'Rock',         color: '#5a5a6a', sub: 'decor',        category: 'decor', solid: true },
    51: { id: 51, name: 'Bush',         color: '#5a7a4a', sub: 'decor',        category: 'decor' }
  };

  // ============================================================
  // TRANSPORT TYPES — help turlari
  // ============================================================
  var TRANSPORT_TYPES = {
    helicopter: { name: 'Helicopter',  icon: '🚁', music: 'arrivedhelp' },
    boat:       { name: 'Boat',        icon: '🚤', music: 'arrivedhelp' },
    train:      { name: 'Train',       icon: '🚂', music: 'arrivedhelp' },
    car:        { name: 'Escape Car',  icon: '🚗', music: 'arrivedhelp' }
  };

  // ============================================================
  // DEFAULT SETTINGS
  // ============================================================
  var DEFAULT_SETTINGS = {
    heliTime: 60,
    zombieRate: 40,
    tankHp: 5236,
    hordeCount: 12,
    heliSpeed: 8,
    startWeapon: 'uzi',
    difficulty: 1,
    transportType: 'helicopter',
    mapName: 'Untitled Map',
    mapAuthor: 'Anonymous',
    mapDescription: ''
  };

  // ============================================================
  // SERIALIZE
  // ============================================================
  function serialize(mapData, settings){
    return {
      version: 3,
      width: mapData.width,
      height: mapData.height,
      cellSize: 32,
      tiles: mapData.tiles.map(function(row){ return row.slice(); }),
      settings: settings || DEFAULT_SETTINGS,
      createdAt: Date.now()
    };
  }

  // ============================================================
  // EXPORT
  // ============================================================
  return {
    TILES: TILES,
    TRANSPORT_TYPES: TRANSPORT_TYPES,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    serialize: serialize
  };
})();