// ============================================================
// world.js — Map Maker xaritasini yuklash va chizish
// Let For Dead
// ============================================================
window.World = (function(){
  'use strict';

  var CELL_SIZE = 32;
  var loadedMap = null;
  var loadedSettings = null;

  // ============================================================
  // TILE COLORS
  // ============================================================
  var TILE_COLORS = {
    0:  '#0d0b0a',
    1:  '#5a4a2a',
    2:  '#8a7a90',
    3:  '#6a5a4a',
    4:  '#8a2a22',
    5:  '#4a6a3a',
    6:  '#2a5a8a',
    7:  '#9a8a4a',
    8:  '#6a6a8a',
    9:  '#8a6a3a',
    10: '#a84a2a',
    11: '#3a3a3a',
    12: '#e0d8c0',
    13: '#4a9ee4',
    14: '#e4c44a',
    15: '#e44a8a',
    16: '#8aaa4a',
    17: '#e4a83a',
    18: '#8fdf62',
    19: '#f0b84a',
    20: '#8ae45a',
    21: '#a09a8a',
    22: '#6a8aaa',
    23: '#8a4a4a',
    24: '#ba7a3a',
    25: '#f0623c',
    26: '#e4a83a',
    27: '#f0623c',
    28: '#ba7a3a',
    29: '#5a5a7a',
    30: '#8ae45a',
    31: '#5a5a6a',
    32: '#7a4a3a',
    33: '#8ae45a',
    34: '#e0523c',
    35: '#c98a2e',
    36: '#a32f22',
    37: '#4a8ed4',
    38: '#6b8f3f',
    39: '#5a5a7a',
    40: '#e4a83a',
    41: '#8ae45a',
    42: '#c98a2e',
    43: '#4a8ed4',
    44: '#a32f22',
    45: '#c98a2e',
    46: '#4a8ed4',
    47: '#8a6a3a',
    48: '#a09a8a',
    49: '#4a6a3a',
    50: '#5a5a6a',
    51: '#5a7a4a'
  };

  // ============================================================
  // TILE FLAGS — o'yin uchun
  // ============================================================
  var TILE_FLAGS = {
    // Solid — hech kim o'tib ketolmaydi
    2:  { solid: true },
    8:  { solid: true },
    9:  { solid: true },
    10: { solid: true },
    21: { solid: true },
    22: { solid: true },
    31: { solid: true },
    32: { solid: true },
    49: { solid: true },
    50: { solid: true },

    // Keyed — E bilan ishlaydi
    19: { keyed: true, keyedType: 'radio' },
    24: { keyed: true, keyedType: 'door' },
    28: { keyed: true, keyedType: 'gate' },
    39: { keyed: true, keyedType: 'turret' },
    40: { keyed: true, keyedType: 'lever' },
    41: { keyed: true, keyedType: 'button' },
    42: { keyed: true, keyedType: 'generator' },
    43: { keyed: true, keyedType: 'elevator' },

    // Trigger — o'q teganda
    26: { trigger: true, triggerType: 'sirenedCar' },
    44: { trigger: true, triggerType: 'barrel' },
    45: { trigger: true, triggerType: 'alarm' },
    27: { trigger: true, triggerType: 'planeTarget' },

    // Transport
    20: { transport: true, transportType: 'helicopter' },
    46: { transport: true, transportType: 'boat' },
    47: { transport: true, transportType: 'train' },
    48: { transport: true, transportType: 'car' },

    // Player spawns
    13: { playerSpawn: true, playerIndex: 0 },
    14: { playerSpawn: true, playerIndex: 1 },
    15: { playerSpawn: true, playerIndex: 2 },
    33: { playerSpawn: true, playerIndex: 3 },

    // Zombie spawns
    16: { zombieSpawn: true, zombieType: 'any' },
    34: { tankSpawn: true },
    35: { zombieSpawn: true, zombieType: 'common' },
    36: { zombieSpawn: true, zombieType: 'special' },

    // Pickups
    17: { pickup: true, pickupType: 'ammo' },
    18: { pickup: true, pickupType: 'aid' },
    30: { pickup: true, pickupType: 'patron' },
    37: { pickup: true, pickupType: 'laser' },
    38: { pickup: true, pickupType: 'grenade' }
  };

  // ============================================================
  // YUKLASH
  // ============================================================
  // ============================================================
// YUKLASH
// ============================================================
function loadActiveMap(){
    try {
        var raw = localStorage.getItem('letfordead_active_map')
               || localStorage.getItem('letfordead_map');

        // ✅ Agar xarita yo'q bo'lsa — DEFAULT xarita yaratamiz
        if(!raw){
            console.log('[World] Xarita yo\'q — default yaratilmoqda');
            loadedMap = generateDefaultMap();
            loadedSettings = null;
            return true;
        }

        var data = JSON.parse(raw);
        if(!data.tiles || !data.width || !data.height){
            console.warn('[World] Xarita formati noto\'g\'ri — default');
            loadedMap = generateDefaultMap();
            return true;
        }

        loadedMap = {
            width: data.width,
            height: data.height,
            tiles: data.tiles.map(function(row){ return row.slice(); })
        };
        loadedSettings = data.settings || null;
        console.log('[World] Loaded map:', data.width + 'x' + data.height);
        return true;
    } catch(e){
        console.warn('[World] Load error:', e);
        loadedMap = generateDefaultMap();
        return true;
    }
}

// ============================================================
// DEFAULT XARITA — 40x30 devor bilan o'ralgan xona
// ============================================================
function generateDefaultMap(){
    var W = 40;
    var H = 30;
    var tiles = [];

    for(var y = 0; y < H; y++){
        var row = [];
        for(var x = 0; x < W; x++){
            // Chegara — devor (2)
            if(x === 0 || x === W-1 || y === 0 || y === H-1){
                row.push(2);
            } else {
                // Ichki — pol (1)
                row.push(1);
            }
        }
        tiles.push(row);
    }

    // Player spawn — markazda (13)
    tiles[Math.floor(H/2)][Math.floor(W/2)] = 13;

    // Bir nechta quti (devor)
    tiles[10][10] = 2;
    tiles[10][11] = 2;
    tiles[11][10] = 2;
    tiles[11][11] = 2;

    tiles[20][25] = 2;
    tiles[20][26] = 2;
    tiles[21][25] = 2;
    tiles[21][26] = 2;

    // Radio (19)
    tiles[5][30] = 19;

    // Ammo (17)
    tiles[25][8] = 17;
    tiles[25][9] = 17;

    // AID (18)
    tiles[15][35] = 18;

    console.log('[World] Default map created: ' + W + 'x' + H);
    return {
        width: W,
        height: H,
        tiles: tiles
    };
}

  // ============================================================
  // RENDER
  // ============================================================
  function render(ctx, camera, canvasW, canvasH){
    // Background
    ctx.fillStyle = '#0d0b0a';
    ctx.fillRect(0, 0, canvasW, canvasH);

    if(!loadedMap) return;

    var cs = CELL_SIZE;
    var startX = Math.max(0, Math.floor(camera.x / cs));
    var startY = Math.max(0, Math.floor(camera.y / cs));
    var endX = Math.min(loadedMap.width, Math.ceil((camera.x + canvasW) / cs));
    var endY = Math.min(loadedMap.height, Math.ceil((camera.y + canvasH) / cs));

    for(var y = startY; y < endY; y++){
      var row = loadedMap.tiles[y];
      if(!row) continue;

      for(var x = startX; x < endX; x++){
        var tileId = (row[x] !== undefined) ? row[x] : 0;
        var sx = x * cs - camera.x;
        var sy = y * cs - camera.y;

        // Invisible tiles — o'yinda ko'rinmaydi
        var flags = TILE_FLAGS[tileId];
        if(flags && (flags.playerSpawn || flags.zombieSpawn || flags.tankSpawn || flags.pickup)){
          continue;   // Skip invisible
        }

        if(tileId === 0){
          ctx.fillStyle = ((x + y) % 2 === 0) ? '#0d0b0a' : '#131010';
          ctx.fillRect(sx, sy, cs, cs);
          continue;
        }

        var color = TILE_COLORS[tileId] || '#2a2418';
        ctx.fillStyle = color;
        ctx.fillRect(sx, sy, cs, cs);

        // Grid
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 0.5, sy + 0.5, cs - 1, cs - 1);

        // Special effects
        if(tileId === 26) drawSirenedCar(ctx, sx, sy, cs);
        if(tileId === 25) drawExit(ctx, sx, sy, cs);
        if(tileId === 27) drawPlaneTarget(ctx, sx, sy, cs);
      }
    }

    // Map border
    ctx.strokeStyle = '#a32f22';
    ctx.lineWidth = 3;
    ctx.strokeRect(-camera.x, -camera.y, loadedMap.width * cs, loadedMap.height * cs);
  }

  function drawSirenedCar(ctx, sx, sy, cs){
    var t = performance.now() / 200;
    var blink = Math.sin(t) > 0;

    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(sx + cs*0.1, sy + cs*0.3, cs*0.8, cs*0.5);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(sx + cs*0.15, sy + cs*0.5, cs*0.7, cs*0.2);

    ctx.fillStyle = blink ? '#ffe14a' : '#6a5a1a';
    ctx.fillRect(sx + cs*0.2, sy + cs*0.15, cs*0.2, cs*0.15);
    ctx.fillStyle = blink ? '#6a5a1a' : '#ffe14a';
    ctx.fillRect(sx + cs*0.6, sy + cs*0.15, cs*0.2, cs*0.15);

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(sx + cs*0.25, sy + cs*0.85, cs*0.08, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + cs*0.75, sy + cs*0.85, cs*0.08, 0, Math.PI*2);
    ctx.fill();
  }

  function drawExit(ctx, sx, sy, cs){
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + (cs * 0.5) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶', sx + cs/2, sy + cs/2 + 1);
  }

  function drawPlaneTarget(ctx, sx, sy, cs){
    var cx = sx + cs/2;
    var cy = sy + cs/2;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = cs * 0.08;
    ctx.beginPath();
    ctx.arc(cx, cy, cs * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - cs*0.4, cy);
    ctx.lineTo(cx + cs*0.4, cy);
    ctx.moveTo(cx, cy - cs*0.4);
    ctx.lineTo(cx, cy + cs*0.4);
    ctx.stroke();
  }

  // ============================================================
  // GETTERS
  // ============================================================
  function getMap(){ return loadedMap; }
  function getSettings(){ return loadedSettings; }
  function getCellSize(){ return CELL_SIZE; }

  function getCellAt(wx, wy){
    if(!loadedMap) return 0;
    var cx = Math.floor(wx / CELL_SIZE);
    var cy = Math.floor(wy / CELL_SIZE);
    if(cx < 0 || cx >= loadedMap.width || cy < 0 || cy >= loadedMap.height) return 2;
    var row = loadedMap.tiles[cy];
    return (row && row[cx] !== undefined) ? row[cx] : 0;
  }

  function getTileFlags(tileId){
    return TILE_FLAGS[tileId] || {};
  }

  function isSolidAt(wx, wy){
    if(!loadedMap) return false;
    var cx = Math.floor(wx / CELL_SIZE);
    var cy = Math.floor(wy / CELL_SIZE);
    if(cx < 0 || cx >= loadedMap.width || cy < 0 || cy >= loadedMap.height) return true;
    var t = getCellAt(wx, wy);
    return !!getTileFlags(t).solid;
  }

  function isKeyedAt(wx, wy){
    var t = getCellAt(wx, wy);
    return getTileFlags(t).keyed || false;
  }

  function getKeyedType(wx, wy){
    var t = getCellAt(wx, wy);
    return getTileFlags(t).keyedType || null;
  }

  function isTriggerAt(wx, wy){
    var t = getCellAt(wx, wy);
    return getTileFlags(t).trigger || false;
  }

  function getTriggerType(wx, wy){
    var t = getCellAt(wx, wy);
    return getTileFlags(t).triggerType || null;
  }

  function getTransport(){
    if(!loadedMap) return 'helicopter';
    for(var y = 0; y < loadedMap.height; y++){
      for(var x = 0; x < loadedMap.width; x++){
        var t = loadedMap.tiles[y][x];
        if(t === 20) return 'helicopter';
        if(t === 46) return 'boat';
        if(t === 47) return 'train';
        if(t === 48) return 'car';
      }
    }
    return (loadedSettings && loadedSettings.transportType) || 'helicopter';
  }

  function getPlayerSpawns(){
    if(!loadedMap) return [];
    var spawns = [];
    for(var y = 0; y < loadedMap.height; y++){
      for(var x = 0; x < loadedMap.width; x++){
        var t = loadedMap.tiles[y][x];
        var flags = TILE_FLAGS[t];
        if(flags && flags.playerSpawn){
          spawns.push({
            x: x * CELL_SIZE + CELL_SIZE / 2,
            y: y * CELL_SIZE + CELL_SIZE / 2,
            index: flags.playerIndex || 0,
            cellX: x,
            cellY: y
          });
        }
      }
    }
    return spawns;
  }

  function getTankSpawns(){
    if(!loadedMap) return [];
    var spawns = [];
    for(var y = 0; y < loadedMap.height; y++){
      for(var x = 0; x < loadedMap.width; x++){
        if(loadedMap.tiles[y][x] === 34){
          spawns.push({
            x: x * CELL_SIZE + CELL_SIZE / 2,
            y: y * CELL_SIZE + CELL_SIZE / 2
          });
        }
      }
    }
    return spawns;
  }

  function getZombieSpawns(){
    if(!loadedMap) return [];
    var spawns = [];
    for(var y = 0; y < loadedMap.height; y++){
      for(var x = 0; x < loadedMap.width; x++){
        var t = loadedMap.tiles[y][x];
        var flags = TILE_FLAGS[t];
        if(flags && flags.zombieSpawn){
          spawns.push({
            x: x * CELL_SIZE + CELL_SIZE / 2,
            y: y * CELL_SIZE + CELL_SIZE / 2,
            type: flags.zombieType || 'any'
          });
        }
      }
    }
    return spawns;
  }

  function getTransportSpawn(){
    if(!loadedMap) return null;
    for(var y = 0; y < loadedMap.height; y++){
      for(var x = 0; x < loadedMap.width; x++){
        var t = loadedMap.tiles[y][x];
        var flags = TILE_FLAGS[t];
        if(flags && flags.transport){
          return {
            x: x * CELL_SIZE + CELL_SIZE / 2,
            y: y * CELL_SIZE + CELL_SIZE / 2,
            type: flags.transportType || 'helicopter'
          };
        }
      }
    }
    return null;
  }

  function setCellAt(wx, wy, tileId){
    if(!loadedMap) return false;
    var cx = Math.floor(wx / CELL_SIZE);
    var cy = Math.floor(wy / CELL_SIZE);
    if(cx < 0 || cx >= loadedMap.width || cy < 0 || cy >= loadedMap.height) return false;
    loadedMap.tiles[cy][cx] = tileId;
    // Saqlash
    try {
      var raw = localStorage.getItem('letfordead_active_map');
      if(raw){
        var data = JSON.parse(raw);
        if(data.tiles) data.tiles[cy][cx] = tileId;
        localStorage.setItem('letfordead_active_map', JSON.stringify(data));
      }
    } catch(e){}
    return true;
  }

  // Auto-load
  loadActiveMap();

  return {
    CELL_SIZE: CELL_SIZE,
    loadActiveMap: loadActiveMap,
    render: render,
    getMap: getMap,
    getSettings: getSettings,
    getCellSize: getCellSize,
    getCellAt: getCellAt,
    getTileFlags: getTileFlags,
    isSolidAt: isSolidAt,
    isKeyedAt: isKeyedAt,
    getKeyedType: getKeyedType,
    isTriggerAt: isTriggerAt,
    getTriggerType: getTriggerType,
    getTransport: getTransport,
    getTransportSpawn: getTransportSpawn,
    getPlayerSpawns: getPlayerSpawns,
    getTankSpawns: getTankSpawns,
    getZombieSpawns: getZombieSpawns,
    setCellAt: setCellAt
  };
})();