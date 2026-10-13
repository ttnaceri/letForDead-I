// ============================================================
// mapmaker.js — Map Maker asosiy logikasi
// Let For Dead
// ============================================================
(function(){
'use strict';

// ============================================================
// CONSTANTS
// ============================================================
var CELL_SIZE = 32;
var DEFAULT_W = 80;
var DEFAULT_H = 70;

var TILES = window.MapData.TILES;
var TRANSPORT_TYPES = window.MapData.TRANSPORT_TYPES;
var DEFAULT_SETTINGS = window.MapData.DEFAULT_SETTINGS;

// ============================================================
// STATE
// ============================================================
var state = {
  mapW: DEFAULT_W,
  mapH: DEFAULT_H,
  data: [],
  settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),

  // Extras
  sirenedCars: [],
  messagePapers: {},
  adEvents: [],
  teleportPairs: {},
  doors: [],
  shelfItems: {},

  // Selection
  tool: 'brush',
  selectedTile: 2,
  selectedModule: null,
  selectedDoor: null,
  doorPosition: 'middle',

  // Camera
  camera: { x: 0, y: 0 },
  zoom: 1.0,
  minZoom: 0.25,
  maxZoom: 4.0,
  gridVisible: true,
  showInvisible: true,

  // Painting
  isPainting: false,
  paintTile: 2,
  lineStart: null,
  rectStart: null,

  // Pan
  panning: false,
  panButton: 0,
  panStart: { x: 0, y: 0 },
  panCam: { x: 0, y: 0 },

  // Hover
  hoverCell: { x: -1, y: -1 },

  // History
  history: [],
  historyIndex: -1,
  maxHistory: 100,

  // Images
  sirenCarImages: { off: null, on: null },

  // Pending
  pendingAdData: null,
  pendingAdType: null,
  pendingAdX: undefined,
  pendingAdY: undefined
};

// ============================================================
// DOM
// ============================================================
var canvas = document.getElementById('mapCanvas');
var ctx = canvas.getContext('2d');
var gridCanvas = document.getElementById('gridOverlay');
var gridCtx = gridCanvas.getContext('2d');
var canvasWrap = document.getElementById('canvas-wrap');
var palette = document.getElementById('palette');
var coordDisplay = document.getElementById('coord-display');
var statusInfo = document.getElementById('statusInfo');
var toast = document.getElementById('toast');

// ============================================================
// TOAST
// ============================================================
var toastTimeout = null;
function showToast(msg){
  if(!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(function(){ toast.classList.remove('show'); }, 1800);
}

// ============================================================
// MAP YARATISH
// ============================================================
function createMap(w, h){
  state.mapW = w;
  state.mapH = h;
  state.data = [];
  for(var y = 0; y < h; y++){
    var row = [];
    for(var x = 0; x < w; x++) row.push(0);
    state.data.push(row);
  }
  state.sirenedCars = [];
  state.messagePapers = {};
  state.adEvents = [];
  state.teleportPairs = {};
  state.doors = [];
  state.shelfItems = {};
  state.history = [];
  state.historyIndex = -1;
  saveHistory();
  resizeCanvas();
  render();
}

// ============================================================
// HISTORY
// ============================================================
function saveHistory(){
  state.history = state.history.slice(0, state.historyIndex + 1);
  var snapshot = {
    w: state.mapW,
    h: state.mapH,
    data: state.data.map(function(row){ return row.slice(); }),
    settings: JSON.parse(JSON.stringify(state.settings)),
    sirenedCars: JSON.parse(JSON.stringify(state.sirenedCars)),
    messagePapers: JSON.parse(JSON.stringify(state.messagePapers)),
    adEvents: JSON.parse(JSON.stringify(state.adEvents)),
    teleportPairs: JSON.parse(JSON.stringify(state.teleportPairs)),
    doors: JSON.parse(JSON.stringify(state.doors)),
    shelfItems: JSON.parse(JSON.stringify(state.shelfItems))
  };
  state.history.push(snapshot);
  if(state.history.length > state.maxHistory) state.history.shift();
  state.historyIndex = state.history.length - 1;
  updateUndoRedoButtons();
}

function undo(){
  if(state.historyIndex <= 0) return;
  state.historyIndex--;
  restoreHistory();
  showToast('Undo');
}

function redo(){
  if(state.historyIndex >= state.history.length - 1) return;
  state.historyIndex++;
  restoreHistory();
  showToast('Redo');
}

function restoreHistory(){
  var snap = state.history[state.historyIndex];
  if(!snap) return;
  state.mapW = snap.w;
  state.mapH = snap.h;
  state.data = snap.data.map(function(row){ return row.slice(); });
  if(snap.settings) state.settings = JSON.parse(JSON.stringify(snap.settings));
  state.sirenedCars = snap.sirenedCars || [];
  state.messagePapers = snap.messagePapers || {};
  state.adEvents = snap.adEvents || [];
  state.teleportPairs = snap.teleportPairs || {};
  state.doors = snap.doors || [];
  state.shelfItems = snap.shelfItems || {};
  resizeCanvas();
  render();
  updateUndoRedoButtons();
}

function updateUndoRedoButtons(){
  var u = document.getElementById('btnUndo');
  var r = document.getElementById('btnRedo');
  if(u) u.disabled = state.historyIndex <= 0;
  if(r) r.disabled = state.historyIndex >= state.history.length - 1;
}

// ============================================================
// RESIZE
// ============================================================
function resizeCanvas(){
  var w = canvasWrap.clientWidth;
  var h = canvasWrap.clientHeight;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  gridCanvas.width = w;
  gridCanvas.height = h;
  gridCanvas.style.width = w + 'px';
  gridCanvas.style.height = h + 'px';
}

window.addEventListener('resize', function(){ resizeCanvas(); render(); });

// ============================================================
// COORDINATES
// ============================================================
function screenToWorld(sx, sy){
  return {
    x: (sx + state.camera.x) / (CELL_SIZE * state.zoom),
    y: (sy + state.camera.y) / (CELL_SIZE * state.zoom)
  };
}

// ============================================================
// RENDER
// ============================================================
function render(){
  var w = canvas.width;
  var h = canvas.height;
  var cs = CELL_SIZE * state.zoom;

  ctx.fillStyle = '#0d0b0a';
  ctx.fillRect(0, 0, w, h);

  var startX = Math.max(0, Math.floor(state.camera.x / cs));
  var startY = Math.max(0, Math.floor(state.camera.y / cs));
  var endX = Math.min(state.mapW, Math.ceil((state.camera.x + w) / cs));
  var endY = Math.min(state.mapH, Math.ceil((state.camera.y + h) / cs));

  // Tiles
  for(var y = startY; y < endY; y++){
    for(var x = startX; x < endX; x++){
      var tileId = state.data[y][x];
      var tile = TILES[tileId];
      if(!tile) continue;
      var sx = x * cs - state.camera.x;
      var sy = y * cs - state.camera.y;

      if(tile.invisible){
        if(!state.showInvisible) continue;
        ctx.fillStyle = tile.color;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(sx, sy, cs, cs);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = tile.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(sx + 2, sy + 2, cs - 4, cs - 4);
        ctx.setLineDash([]);
      } else if(tileId === 0){
        ctx.fillStyle = ((x + y) % 2 === 0) ? '#0d0b0a' : '#131010';
        ctx.fillRect(sx, sy, cs, cs);
      } else {
        ctx.fillStyle = tile.color;
        ctx.fillRect(sx, sy, cs, cs);
        drawTileIcon(ctx, tileId, sx, sy, cs);
      }
    }
  }

  // Sirened cars
  for(var i = 0; i < state.sirenedCars.length; i++){
    drawSirenedCar(ctx, state.sirenedCars[i], cs);
  }

  // Doors
  for(var j = 0; j < state.doors.length; j++){
    drawDoorObject(ctx, state.doors[j], cs);
  }

  // Teleports
  for(var pid in state.teleportPairs){
    var pair = state.teleportPairs[pid];
    if(pair[0]) drawTeleport(ctx, pair[0], cs, pid, false);
    if(pair[1]) drawTeleport(ctx, pair[1], cs, pid, true);
  }

  // Message papers
  for(var key in state.messagePapers){
    var parts = key.split(',');
    var px = parseInt(parts[0], 10) * cs - state.camera.x;
    var py = parseInt(parts[1], 10) * cs - state.camera.y;
    drawMessagePaper(ctx, px, py, cs);
  }

  // Ad events
  for(var k = 0; k < state.adEvents.length; k++){
    drawAdEvent(ctx, state.adEvents[k], cs);
  }

  // Map border
  ctx.strokeStyle = '#a32f22';
  ctx.lineWidth = 2;
  ctx.strokeRect(-state.camera.x, -state.camera.y, state.mapW * cs, state.mapH * cs);

  // Line preview
  if(state.lineStart && state.hoverCell.x >= 0){
    var lx = state.lineStart.x * cs - state.camera.x;
    var ly = state.lineStart.y * cs - state.camera.y;
    var ex = state.hoverCell.x * cs - state.camera.x;
    var ey = state.hoverCell.y * cs - state.camera.y;
    ctx.strokeStyle = 'rgba(224,82,60,0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(lx + cs/2, ly + cs/2);
    ctx.lineTo(ex + cs/2, ey + cs/2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Hover
  if(state.hoverCell.x >= 0 && state.hoverCell.x < state.mapW &&
     state.hoverCell.y >= 0 && state.hoverCell.y < state.mapH){
    var hx = state.hoverCell.x * cs - state.camera.x;
    var hy = state.hoverCell.y * cs - state.camera.y;
    ctx.strokeStyle = '#e0523c';
    ctx.lineWidth = 2;
    ctx.strokeRect(hx, hy, cs, cs);
    ctx.fillStyle = 'rgba(224,82,60,0.15)';
    ctx.fillRect(hx, hy, cs, cs);
  }

  renderGrid(cs);
}

function drawTileIcon(c, tileId, sx, sy, cs){
  var cx = sx + cs / 2;
  var cy = sy + cs / 2;
  var t = TILES[tileId];
  if(!t) return;

  if(t.playerSpawn){
    c.fillStyle = '#fff';
    c.font = 'bold ' + (cs * 0.4) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('P' + (t.playerIndex + 1), cx, cy + 1);
  }

  if(t.zombieSpawn && !t.tankSpawn){
    c.fillStyle = '#fff';
    c.font = 'bold ' + (cs * 0.4) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('Z', cx, cy + 1);
  }

  if(t.tankSpawn){
    c.fillStyle = '#fff';
    c.font = 'bold ' + (cs * 0.35) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('T', cx, cy + 1);
  }

  if(t.keyed){
    c.fillStyle = '#c98a2e';
    c.beginPath();
    c.arc(cx, cy, cs * 0.3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#000';
    c.font = 'bold ' + (cs * 0.4) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('E', cx, cy + 1);
  }

  if(t.trigger){
    c.fillStyle = '#e0523c';
    c.beginPath();
    c.arc(cx, cy, cs * 0.25, 0, Math.PI * 2);
    c.fill();
  }

  if(t.transport){
    c.font = 'bold ' + (cs * 0.5) + 'px monospace';
    c.fillStyle = '#fff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('🚁', cx, cy + 1);
  }

  if(t.nextAct){
    c.fillStyle = '#fff';
    c.font = 'bold ' + (cs * 0.35) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('ACT+', cx, cy + 1);
  }

  if(t.door){
    var doorH = cs * 0.6;
    var doorW = cs * 0.7;
    var dx = sx + (cs - doorW) / 2;
    var dy = sy + (cs - doorH) / 2;
    c.fillStyle = t.color;
    c.fillRect(dx, dy, doorW, doorH);
    c.strokeStyle = t.doorType === 'safe' ? '#c98a2e' : '#2a2418';
    c.lineWidth = 2;
    c.strokeRect(dx, dy, doorW, doorH);
  }

  if(t.pickupType){
    c.font = 'bold ' + (cs * 0.5) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    if(t.pickupType === 'ammo') c.fillText('AM', cx, cy + 1);
    else if(t.pickupType === 'aid') c.fillText('+', cx, cy + 1);
    else if(t.pickupType === 'patron') c.fillText('∞', cx, cy + 1);
    else if(t.pickupType === 'laser') c.fillText('L', cx, cy + 1);
    else if(t.pickupType === 'grenade') c.fillText('G', cx, cy + 1);
  }
}

function drawSirenedCar(c, car, cs){
  var sx = car.x * cs - state.camera.x;
  var sy = car.y * cs - state.camera.y;
  var w = cs * (car.size || 4);
  var h = cs * ((car.size || 4) / 2);

  var time = performance.now();
  var blink = Math.floor(time / 1000) % 2 === 0;
  var img = blink ? state.sirenCarImages.off : state.sirenCarImages.on;

  if(img && img.complete && img.naturalWidth > 0){
    c.drawImage(img, sx, sy, w, h);
  } else {
    c.fillStyle = blink ? '#c98a2e' : '#f0d98a';
    c.fillRect(sx, sy, w, h);
    c.fillStyle = '#1a1a1a';
    c.font = 'bold ' + (cs * 0.4) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('🚨', sx + w/2, sy + h/2);
  }

  c.strokeStyle = '#a32f22';
  c.lineWidth = 2;
  c.strokeRect(sx, sy, w, h);
}

function drawDoorObject(c, door, cs){
  var sx = door.x * cs - state.camera.x;
  var sy = door.y * cs - state.camera.y;

  var cfg = { easy: '#a09a8a', hard: '#8a5a2a', safe: '#3a3a4a' };
  var color = cfg[door.type] || '#8a5a2a';

  var doorH = cs * 0.6;
  var doorW = cs * 0.7;
  var dx = sx + (cs - doorW) / 2;
  var dy = sy + (cs - doorH) / 2;

  if(door.position === 'top'){
    dy = sy + 2;
    doorH = cs * 0.25;
  } else if(door.position === 'bottom'){
    dy = sy + cs - doorH - 2;
    doorH = cs * 0.25;
  }

  c.fillStyle = color;
  c.fillRect(dx, dy, doorW, doorH);

  c.strokeStyle = door.type === 'safe' ? '#c98a2e' : '#2a2418';
  c.lineWidth = 2;
  c.strokeRect(dx, dy, doorW, doorH);

  if(door.type === 'safe'){
    c.save();
    c.shadowColor = '#c98a2e';
    c.shadowBlur = 12;
    c.strokeRect(dx, dy, doorW, doorH);
    c.restore();
  }

  c.fillStyle = '#fff';
  c.font = 'bold ' + (cs * 0.25) + 'px monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  var label = door.type === 'easy' ? 'EASY' :
              door.type === 'hard' ? 'HARD' : 'SAFE';
  c.fillText(label, sx + cs/2, sy + cs/2);
}

function drawTeleport(c, tp, cs, pairId, isSecond){
  var sx = tp.x * cs - state.camera.x;
  var sy = tp.y * cs - state.camera.y;
  var color = isSecond ? '#8ae45a' : '#4a8ed4';

  c.save();
  c.globalAlpha = 0.4 + Math.sin(performance.now() / 300) * 0.2;
  c.fillStyle = color;
  c.beginPath();
  c.arc(sx + cs/2, sy + cs/2, cs * 0.4, 0, Math.PI * 2);
  c.fill();
  c.restore();

  c.strokeStyle = color;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(sx + cs/2, sy + cs/2, cs * 0.4, 0, Math.PI * 2);
  c.stroke();

  c.fillStyle = '#fff';
  c.font = 'bold ' + (cs * 0.4) + 'px monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(pairId, sx + cs/2, sy + cs/2 + 1);
}

function drawMessagePaper(c, sx, sy, cs){
  c.fillStyle = '#e0d8c0';
  c.fillRect(sx + 4, sy + 4, cs - 8, cs - 8);

  c.strokeStyle = '#8a7a6a';
  c.lineWidth = 1;
  for(var i = 0; i < 3; i++){
    var y = sy + 10 + i * 5;
    c.beginPath();
    c.moveTo(sx + 8, y);
    c.lineTo(sx + cs - 8, y);
    c.stroke();
  }
}

function drawAdEvent(c, ad, cs){
  var sx = ad.x * cs - state.camera.x;
  var sy = ad.y * cs - state.camera.y;
  var w = (ad.w || 6) * cs;
  var h = (ad.h || 4) * cs;

  if(ad.data && ad.type === 'image'){
    var img = new Image();
    img.src = ad.data;
    if(img.complete && img.naturalWidth > 0){
      c.drawImage(img, sx, sy, w, h);
    } else {
      c.fillStyle = '#1a1a1a';
      c.fillRect(sx, sy, w, h);
      c.fillStyle = '#c98a2e';
      c.font = 'bold ' + (cs * 0.5) + 'px monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('IMG', sx + w/2, sy + h/2);
    }
  } else if(ad.data && ad.type === 'video'){
    c.fillStyle = '#1a1a1a';
    c.fillRect(sx, sy, w, h);
    c.fillStyle = '#e0523c';
    c.font = 'bold ' + (cs * 0.5) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('▶ VIDEO', sx + w/2, sy + h/2);
  } else {
    c.fillStyle = '#c98a2e';
    c.fillRect(sx, sy, w, h);
    c.fillStyle = '#1a1a1a';
    c.font = 'bold ' + (cs * 0.5) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('AD', sx + w/2, sy + h/2);
  }

  c.strokeStyle = '#c98a2e';
  c.lineWidth = 2;
  c.strokeRect(sx, sy, w, h);
}

function renderGrid(cs){
  gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  if(!state.gridVisible) return;

  var w = gridCanvas.width;
  var h = gridCanvas.height;

  var startX = Math.max(0, Math.floor(state.camera.x / cs));
  var startY = Math.max(0, Math.floor(state.camera.y / cs));
  var endX = Math.min(state.mapW, Math.ceil((state.camera.x + w) / cs));
  var endY = Math.min(state.mapH, Math.ceil((state.camera.y + h) / cs));

  gridCtx.strokeStyle = 'rgba(131,123,109,0.2)';
  gridCtx.lineWidth = 1;

  for(var x = startX; x <= endX; x++){
    var sx = x * cs - state.camera.x;
    gridCtx.beginPath();
    gridCtx.moveTo(sx, Math.max(0, -state.camera.y));
    gridCtx.lineTo(sx, Math.min(h, state.mapH * cs - state.camera.y));
    gridCtx.stroke();
  }
  for(var y = startY; y <= endY; y++){
    var sy = y * cs - state.camera.y;
    gridCtx.beginPath();
    gridCtx.moveTo(Math.max(0, -state.camera.x), sy);
    gridCtx.lineTo(Math.min(w, state.mapW * cs - state.camera.x), sy);
    gridCtx.stroke();
  }
}

// ============================================================
// PALETTE
// ============================================================
function buildPalette(){
  palette.innerHTML = '';

  var sections = [
    { title: 'Terrain',     ids: [0, 1, 5, 7, 11, 12, 4, 23, 3, 6] },
    { title: 'Walls',       ids: [2, 8, 9, 10, 21, 22, 31, 32] },
    { title: 'Doors',       ids: [60, 61, 62] },
    { title: 'Player Spawns', ids: [13, 14, 15, 33] },
    { title: 'Zombie Spawns', ids: [16, 34, 35, 36] },
    { title: 'Pickups',     ids: [17, 18, 30, 37, 38] },
    { title: 'Keyed',       ids: [19, 40, 41, 42, 43, 39] },
    { title: 'Triggers',    ids: [26, 44, 45, 27] },
    { title: 'Transport',   ids: [20, 46, 47, 48] },
    { title: 'Objectives',  ids: [25, 70] },
    { title: 'Modules',     ids: [80, 81, 82, 83, 84, 85] },
    { title: 'Decor',       ids: [49, 50, 51] }
  ];

  sections.forEach(function(sec){
    var h = document.createElement('div');
    h.className = 'palette-section';
    h.innerHTML = '<span>' + sec.title + '</span><span class="badge">' + sec.ids.length + '</span>';
    palette.appendChild(h);

    sec.ids.forEach(function(id){
      var tile = TILES[id];
      if(!tile) return;

      var btn = document.createElement('button');
      var classes = 'tile-btn';
      if(state.selectedTile === id) classes += ' active';
      if(tile.invisible) classes += ' invisible-tile';
      if(tile.keyed) classes += ' keyed-tile';
      if(tile.trigger) classes += ' trigger-tile';
      btn.className = classes;
      btn.setAttribute('data-tile', id);

      var prev = document.createElement('div');
      prev.className = 'tile-preview';
      prev.style.background = tile.color;

      var label = document.createElement('div');
      label.className = 'tile-label';
      label.innerHTML = '<div class="name">' + tile.name + '</div>' +
                        '<div class="sub">' + tile.sub + '</div>';

      btn.appendChild(prev);
      btn.appendChild(label);

      btn.addEventListener('click', function(){ selectTile(id); });
      palette.appendChild(btn);
    });
  });
}

function selectTile(id){
  state.selectedTile = id;
  state.selectedModule = null;
  state.selectedDoor = null;

  var btns = palette.querySelectorAll('.tile-btn');
  for(var i = 0; i < btns.length; i++){
    btns[i].classList.toggle('active', parseInt(btns[i].getAttribute('data-tile'), 10) === id);
  }

  var tile = TILES[id];
  if(statusInfo && tile){
    var info = 'Selected: ' + tile.name;
    if(tile.solid) info += ' [SOLID]';
    if(tile.keyed) info += ' [E]';
    if(tile.trigger) info += ' [TRIGGER]';
    statusInfo.textContent = info;
  }

  if(id === 26){
    document.getElementById('sirenedCarModal').classList.add('show');
  } else if(id === 82){
    document.getElementById('messagePaperModal').classList.add('show');
    setTimeout(function(){
      var el = document.getElementById('msgTitle');
      if(el) el.focus();
    }, 100);
  } else if(id === 83){
    document.getElementById('adEventModal').classList.add('show');
  }
}

// ============================================================
// PAINT
// ============================================================
function paintCell(x, y, tileId){
  if(x < 0 || x >= state.mapW || y < 0 || y >= state.mapH) return false;
  if(state.data[y][x] === tileId) return false;
  state.data[y][x] = tileId;
  return true;
}

function paintLine(x0, y0, x1, y1, tileId){
  var dx = Math.abs(x1 - x0);
  var dy = Math.abs(y1 - y0);
  var sx = x0 < x1 ? 1 : -1;
  var sy = y0 < y1 ? 1 : -1;
  var err = dx - dy;
  while(true){
    paintCell(x0, y0, tileId);
    if(x0 === x1 && y0 === y1) break;
    var e2 = 2 * err;
    if(e2 > -dy){ err -= dy; x0 += sx; }
    if(e2 < dx){ err += dx; y0 += sy; }
  }
}

function paintRect(x0, y0, x1, y1, tileId){
  var minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
  var minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
  for(var y = minY; y <= maxY; y++){
    for(var x = minX; x <= maxX; x++){
      paintCell(x, y, tileId);
    }
  }
}

function floodFill(x, y, newTile){
  if(x < 0 || x >= state.mapW || y < 0 || y >= state.mapH) return;
  var oldTile = state.data[y][x];
  if(oldTile === newTile) return;
  var stack = [[x, y]];
  var visited = {};
  while(stack.length > 0){
    var cell = stack.pop();
    var cx = cell[0], cy = cell[1];
    var key = cx + ',' + cy;
    if(visited[key]) continue;
    visited[key] = true;
    if(cx < 0 || cx >= state.mapW || cy < 0 || cy >= state.mapH) continue;
    if(state.data[cy][cx] !== oldTile) continue;
    state.data[cy][cx] = newTile;
    stack.push([cx + 1, cy]);
    stack.push([cx - 1, cy]);
    stack.push([cx, cy + 1]);
    stack.push([cx, cy - 1]);
  }
}

// ============================================================
// DELETE OBJECT AT HOVER
// ============================================================
function deleteObjectAtHover(){
  var hx = state.hoverCell.x;
  var hy = state.hoverCell.y;

  if(hx < 0 || hx >= state.mapW || hy < 0 || hy >= state.mapH){
    showToast('Nothing to delete');
    return;
  }

  var deleted = false;
  var msg = '';

  // 1. Sirened car
  for(var i = state.sirenedCars.length - 1; i >= 0; i--){
    var car = state.sirenedCars[i];
    var carW = car.size || 4;
    var carH = carW / 2;
    if(hx >= car.x && hx < car.x + carW &&
       hy >= car.y && hy < car.y + carH){
      saveHistory();
      state.sirenedCars.splice(i, 1);
      deleted = true;
      msg = 'Sirened car deleted';
      break;
    }
  }

  // 2. Door
  if(!deleted){
    for(var j = state.doors.length - 1; j >= 0; j--){
      var door = state.doors[j];
      if(door.x === hx && door.y === hy){
        saveHistory();
        state.doors.splice(j, 1);
        deleted = true;
        msg = 'Door deleted';
        break;
      }
    }
  }

  // 3. Teleport
  if(!deleted){
    for(var pid in state.teleportPairs){
      var pair = state.teleportPairs[pid];
      for(var k = 0; k < pair.length; k++){
        if(pair[k].x === hx && pair[k].y === hy){
          saveHistory();
          pair.splice(k, 1);
          if(pair.length === 0) delete state.teleportPairs[pid];
          deleted = true;
          msg = 'Teleport deleted';
          break;
        }
      }
      if(deleted) break;
    }
  }

  // 4. Message paper
  if(!deleted){
    var paperKey = hx + ',' + hy;
    if(state.messagePapers[paperKey]){
      saveHistory();
      delete state.messagePapers[paperKey];
      deleted = true;
      msg = 'Message paper deleted';
    }
  }

  // 5. Ad/Event
  if(!deleted){
    for(var m = state.adEvents.length - 1; m >= 0; m--){
      var ad = state.adEvents[m];
      var adW = ad.w || 6;
      var adH = ad.h || 4;
      if(hx >= ad.x && hx < ad.x + adW &&
         hy >= ad.y && hy < ad.y + adH){
        saveHistory();
        state.adEvents.splice(m, 1);
        deleted = true;
        msg = 'Ad/Event deleted';
        break;
      }
    }
  }

  // 6. Shelf
  if(!deleted){
    var shelfKey = hx + ',' + hy;
    if(state.shelfItems[shelfKey]){
      saveHistory();
      delete state.shelfItems[shelfKey];
      deleted = true;
      msg = 'Shelf deleted';
    }
  }

  // 7. Tile
  if(!deleted){
    if(state.data[hy][hx] !== 0){
      saveHistory();
      state.data[hy][hx] = 0;
      deleted = true;
      msg = 'Tile cleared';
    }
  }

  if(deleted){
    render();
    showToast(msg);
  } else {
    showToast('Nothing to delete here');
  }
}

// ============================================================
// MOUSE
// ============================================================
var lastPaintCell = { x: -1, y: -1 };
var historySaved = false;

canvas.addEventListener('mousedown', function(e){
  var rect = canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  var my = e.clientY - rect.top;

  if(e.button === 2 || e.button === 1){
    e.preventDefault();
    state.panning = true;
    state.panButton = e.button;
    state.panStart.x = mx;
    state.panStart.y = my;
    state.panCam.x = state.camera.x;
    state.panCam.y = state.camera.y;
    canvas.style.cursor = 'grabbing';
    return;
  }

  if(e.button === 0){
    var world = screenToWorld(mx, my);
    var cx = Math.floor(world.x);
    var cy = Math.floor(world.y);

    if(state.tool === 'picker'){
      if(cx >= 0 && cx < state.mapW && cy >= 0 && cy < state.mapH){
        selectTile(state.data[cy][cx]);
      }
      return;
    }

    if(state.tool === 'fill'){
      saveHistory();
      floodFill(cx, cy, state.selectedTile);
      render();
      return;
    }

    if(state.tool === 'line'){
      if(!state.lineStart){
        state.lineStart = { x: cx, y: cy };
        render();
      } else {
        saveHistory();
        paintLine(state.lineStart.x, state.lineStart.y, cx, cy, state.selectedTile);
        state.lineStart = null;
        render();
      }
      return;
    }

    if(state.tool === 'rect'){
      if(!state.rectStart){
        state.rectStart = { x: cx, y: cy };
      } else {
        saveHistory();
        paintRect(state.rectStart.x, state.rectStart.y, cx, cy, state.selectedTile);
        state.rectStart = null;
        render();
      }
      return;
    }

    if(state.selectedTile === 26){
      var size = parseInt(document.getElementById('sirenedCarSize').value, 10) || 4;
      saveHistory();
      state.sirenedCars.push({
        x: cx, y: cy,
        size: size,
        sound: state.sirenedCarSound || null,
        imageOff: 'modules/alarmcar.png',
        imageOn: 'modules/alarmedcar.png'
      });
      render();
      return;
    }

    if(state.selectedTile === 60 || state.selectedTile === 61 || state.selectedTile === 62){
      var doorType = state.selectedTile === 60 ? 'easy' :
                     state.selectedTile === 61 ? 'hard' : 'safe';
      saveHistory();
      state.doors.push({
        x: cx, y: cy,
        type: doorType,
        position: state.doorPosition
      });
      render();
      return;
    }

    if(state.selectedTile === 80 || state.selectedTile === 81){
      saveHistory();
      var pid = 1;
      while(state.teleportPairs[pid] && state.teleportPairs[pid].length >= 2) pid++;
      if(!state.teleportPairs[pid]) state.teleportPairs[pid] = [];
      if(state.teleportPairs[pid].length < 2){
        state.teleportPairs[pid].push({ x: cx, y: cy });
      }
      render();
      return;
    }

    if(state.selectedTile === 82){
      saveHistory();
      var key = cx + ',' + cy;
      if(!state.messagePapers[key]){
        state.messagePapers[key] = {
          title: 'Note',
          text: 'Click E to read'
        };
      }
      document.getElementById('messagePaperModal').classList.add('show');
      render();
      return;
    }

    if(state.selectedTile === 83){
      document.getElementById('adEventModal').classList.add('show');
      state.pendingAdX = cx;
      state.pendingAdY = cy;
      return;
    }

    var tileToPaint = (state.tool === 'erase') ? 0 : state.selectedTile;
    state.isPainting = true;
    state.paintTile = tileToPaint;
    historySaved = false;
    paintCell(cx, cy, state.paintTile);
    lastPaintCell.x = cx;
    lastPaintCell.y = cy;
    render();
  }
});

canvas.addEventListener('mousemove', function(e){
  var rect = canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  var my = e.clientY - rect.top;

  if(state.panning){
    state.camera.x = state.panCam.x - (mx - state.panStart.x);
    state.camera.y = state.panCam.y - (my - state.panStart.y);
    render();
    return;
  }

  var world = screenToWorld(mx, my);
  var cx = Math.floor(world.x);
  var cy = Math.floor(world.y);

  var changedHover = (cx !== state.hoverCell.x || cy !== state.hoverCell.y);
  if(changedHover){
    state.hoverCell.x = cx;
    state.hoverCell.y = cy;
    if(coordDisplay) coordDisplay.textContent = cx + ', ' + cy;
  }

  if(state.isPainting){
    if(!historySaved){
      saveHistory();
      historySaved = true;
    }
    if(lastPaintCell.x >= 0){
      paintLine(lastPaintCell.x, lastPaintCell.y, cx, cy, state.paintTile);
    } else {
      paintCell(cx, cy, state.paintTile);
    }
    lastPaintCell.x = cx;
    lastPaintCell.y = cy;
    render();
  } else if(changedHover){
    render();
  }
});

window.addEventListener('mouseup', function(e){
  if(state.panning){
    if(e.button === state.panButton || e.button === 0 || e.button === 1 || e.button === 2){
      state.panning = false;
      state.panButton = 0;
      canvas.style.cursor = 'crosshair';
    }
  }
  if(state.isPainting && e.button === 0){
    state.isPainting = false;
    lastPaintCell.x = -1;
    lastPaintCell.y = -1;
  }
});

window.addEventListener('blur', function(){
  state.panning = false;
  state.isPainting = false;
  state.panButton = 0;
  canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });

canvas.addEventListener('wheel', function(e){
  e.preventDefault();
  var rect = canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  var my = e.clientY - rect.top;
  var worldBefore = screenToWorld(mx, my);
  var factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  var newZoom = Math.max(state.minZoom, Math.min(state.maxZoom, state.zoom * factor));
  if(newZoom === state.zoom) return;
  state.zoom = newZoom;
  var cs = CELL_SIZE * state.zoom;
  state.camera.x = worldBefore.x * cs - mx;
  state.camera.y = worldBefore.y * cs - my;
  render();
}, { passive: false });

// ============================================================
// KEYBOARD — INPUT FOKUS TEKSHIRUVI BILAN
// ============================================================
window.addEventListener('keydown', function(e){
  var k = e.key ? e.key.toLowerCase() : '';

  // Console toggle — har doim ishlaydi
  if(k === '`' || k === '~'){
    e.preventDefault();
    toggleConsole();
    return;
  }

  // Escape — modal yopish
  if(k === 'escape'){
    state.lineStart = null;
    state.rectStart = null;
    document.querySelectorAll('.modal-bg').forEach(function(m){ m.classList.remove('show'); });
    render();
    return;
  }

  // INPUT FOKUSDA — hech narsa qilmaymiz
  var activeEl = document.activeElement;
  var isInputFocused = activeEl && (
    activeEl.tagName === 'INPUT' ||
    activeEl.tagName === 'TEXTAREA' ||
    activeEl.tagName === 'SELECT' ||
    activeEl.isContentEditable
  );

  if(isInputFocused) return;

  // Ctrl shortcuts
  if(e.ctrlKey && k === 'z' && !e.shiftKey){ e.preventDefault(); undo(); return; }
  if((e.ctrlKey && e.shiftKey && k === 'z') || (e.ctrlKey && k === 'y')){ e.preventDefault(); redo(); return; }
  if(e.ctrlKey && k === 's'){ e.preventDefault(); saveMapFile(); return; }
  if(e.ctrlKey && k === 'o'){ e.preventDefault(); openLoadModal(); return; }
  if(e.ctrlKey && k === 'n'){ e.preventDefault(); openNewModal(); return; }

  // DELETE / BACKSPACE — object o'chirish
  if(k === 'delete' || k === 'backspace'){
    e.preventDefault();
    deleteObjectAtHover();
    return;
  }

  if(k === 'g' && !e.ctrlKey){
    state.gridVisible = !state.gridVisible;
    render();
    return;
  }

  if(k === 'h' && !e.ctrlKey){
    state.showInvisible = !state.showInvisible;
    render();
    return;
  }

  if(k === 'b' && !e.ctrlKey) setTool('brush');
  if(k === 'e' && !e.ctrlKey) setTool('erase');
  if(k === 'f' && !e.ctrlKey) setTool('fill');
  if(k === 'i' && !e.ctrlKey) setTool('picker');
  if(k === 'l' && !e.ctrlKey) setTool('line');
  if(k === 'r' && !e.ctrlKey) setTool('rect');
});

// ============================================================
// TOOLS
// ============================================================
function setTool(tool){
  state.tool = tool;
  state.lineStart = null;
  state.rectStart = null;
  var btns = document.querySelectorAll('.tool-btn[data-tool]');
  for(var i = 0; i < btns.length; i++){
    btns[i].classList.toggle('active', btns[i].getAttribute('data-tool') === tool);
  }
  if(statusInfo) statusInfo.textContent = 'Tool: ' + tool;
  render();
}

document.getElementById('toolBrush').addEventListener('click', function(){ setTool('brush'); });
document.getElementById('toolErase').addEventListener('click', function(){ setTool('erase'); });
document.getElementById('toolFill').addEventListener('click', function(){ setTool('fill'); });
document.getElementById('toolPicker').addEventListener('click', function(){ setTool('picker'); });
document.getElementById('toolLine').addEventListener('click', function(){ setTool('line'); });
document.getElementById('toolRect').addEventListener('click', function(){ setTool('rect'); });

document.getElementById('btnUndo').addEventListener('click', undo);
document.getElementById('btnRedo').addEventListener('click', redo);

document.getElementById('btnGrid').addEventListener('click', function(){
  state.gridVisible = !state.gridVisible;
  this.classList.toggle('active', state.gridVisible);
  render();
});

document.getElementById('btnShowInvisible').addEventListener('click', function(){
  state.showInvisible = !state.showInvisible;
  this.classList.toggle('active', state.showInvisible);
  render();
});

// ============================================================
// SETTINGS
// ============================================================
function bindSetting(sliderId, numberId, key){
  var slider = document.getElementById(sliderId);
  var num = document.getElementById(numberId);
  if(!slider || !num) return;

  slider.addEventListener('input', function(){
    var v = parseInt(slider.value, 10);
    num.value = v;
    state.settings[key] = v;
  });
  num.addEventListener('change', function(){
    var v = parseInt(num.value, 10);
    slider.value = v;
    state.settings[key] = v;
  });

  slider.value = state.settings[key];
  num.value = state.settings[key];
}

bindSetting('sldHeliTime',   'numHeliTime',   'heliTime');
bindSetting('sldZombieRate', 'numZombieRate', 'zombieRate');
bindSetting('sldTankHp',     'numTankHp',     'tankHp');
bindSetting('sldHordeCount', 'numHordeCount', 'hordeCount');

var txtMapName = document.getElementById('txtMapName');
if(txtMapName){
  txtMapName.value = state.settings.mapName;
  txtMapName.addEventListener('input', function(){
    state.settings.mapName = txtMapName.value;
  });
}

var txtMapAuthor = document.getElementById('txtMapAuthor');
if(txtMapAuthor){
  txtMapAuthor.value = state.settings.mapAuthor;
  txtMapAuthor.addEventListener('input', function(){
    state.settings.mapAuthor = txtMapAuthor.value;
  });
}

var selTransport = document.getElementById('selTransport');
if(selTransport){
  selTransport.value = state.settings.transportType || 'helicopter';
  selTransport.addEventListener('change', function(){
    state.settings.transportType = selTransport.value;
    state.settings.hasHelpTransport = (selTransport.value !== 'none');
    showToast('Transport: ' + TRANSPORT_TYPES[selTransport.value].name);
  });
}

var doorPosSelect = document.getElementById('doorPosition');
if(doorPosSelect){
  doorPosSelect.value = state.doorPosition;
  doorPosSelect.addEventListener('change', function(){
    state.doorPosition = doorPosSelect.value;
    showToast('Door position: ' + state.doorPosition);
  });
}

var selWeapon = document.getElementById('selStartWeapon');
if(selWeapon){
  selWeapon.value = state.settings.startWeapon;
  selWeapon.addEventListener('change', function(){
    state.settings.startWeapon = selWeapon.value;
  });
}

var selDiff = document.getElementById('selDifficulty');
if(selDiff){
  selDiff.value = state.settings.difficulty;
  selDiff.addEventListener('change', function(){
    state.settings.difficulty = parseInt(selDiff.value, 10);
  });
}

// ============================================================
// IMAGES
// ============================================================
function loadSirenedCarImages(){
  var offImg = new Image();
  offImg.src = 'modules/alarmcar.png';
  offImg.onload = function(){
    state.sirenCarImages.off = offImg;
    render();
  };

  var onImg = new Image();
  onImg.src = 'modules/alarmedcar.png';
  onImg.onload = function(){
    state.sirenCarImages.on = onImg;
    render();
  };
}

// ============================================================
// MODALS
// ============================================================
var sirenedCarSound = document.getElementById('sirenedCarSound');
if(sirenedCarSound){
  sirenedCarSound.addEventListener('change', function(e){
    var f = e.target.files[0];
    if(!f) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      state.sirenedCarSound = ev.target.result;
      var info = document.getElementById('sirenedCarSoundInfo');
      if(info){
        info.textContent = f.name + ' (' + Math.round(f.size/1024) + ' KB)';
        info.classList.add('has-file');
      }
    };
    reader.readAsDataURL(f);
  });
}

var msgConfirm = document.getElementById('msgConfirm');
if(msgConfirm){
  msgConfirm.addEventListener('click', function(){
    var title = document.getElementById('msgTitle').value;
    var text = document.getElementById('msgText').value;
    var key = state.hoverCell.x + ',' + state.hoverCell.y;
    state.messagePapers[key] = { title: title, text: text };
    document.getElementById('messagePaperModal').classList.remove('show');
    showToast('Message saved');
    render();
  });
}

var adEventFile = document.getElementById('adEventFile');
if(adEventFile){
  adEventFile.addEventListener('change', function(e){
    var f = e.target.files[0];
    if(!f) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      state.pendingAdData = ev.target.result;
      state.pendingAdType = f.type.startsWith('video') ? 'video' : 'image';
      var info = document.getElementById('adEventInfo');
      if(info){
        info.textContent = f.name + ' (' + Math.round(f.size/1024) + ' KB)';
        info.classList.add('has-file');
      }
    };
    reader.readAsDataURL(f);
  });
}

var adEventConfirm = document.getElementById('adEventConfirm');
if(adEventConfirm){
  adEventConfirm.addEventListener('click', function(){
    if(state.pendingAdData && state.pendingAdX !== undefined){
      saveHistory();
      state.adEvents.push({
        x: state.pendingAdX,
        y: state.pendingAdY,
        w: 6,
        h: 4,
        data: state.pendingAdData,
        type: state.pendingAdType
      });
      state.pendingAdData = null;
      state.pendingAdX = undefined;
      state.pendingAdY = undefined;
    }
    document.getElementById('adEventModal').classList.remove('show');
    render();
  });
}

document.querySelectorAll('[data-modal-close]').forEach(function(btn){
  btn.addEventListener('click', function(){
    var modal = this.closest('.modal-bg');
    if(modal) modal.classList.remove('show');
  });
});

// ============================================================
// NEW / SAVE / LOAD / EXPORT
// ============================================================
function openNewModal(){ document.getElementById('newMapModal').classList.add('show'); }

document.getElementById('newMapCancel').addEventListener('click', function(){
  document.getElementById('newMapModal').classList.remove('show');
});

document.getElementById('newMapCreate').addEventListener('click', function(){
  var w = parseInt(document.getElementById('newMapW').value, 10);
  var h = parseInt(document.getElementById('newMapH').value, 10);
  w = Math.max(5, Math.min(500, w || 80));
  h = Math.max(5, Math.min(500, h || 70));
  createMap(w, h);
  document.getElementById('newMapModal').classList.remove('show');
  showToast('New map: ' + w + 'x' + h);
});

document.getElementById('btnNew').addEventListener('click', openNewModal);

function serializeMap(){
  return window.MapData.serialize(
    { width: state.mapW, height: state.mapH, tiles: state.data },
    state.settings,
    {
      sirenedCars: state.sirenedCars,
      messagePapers: state.messagePapers,
      adEvents: state.adEvents,
      teleportPairs: state.teleportPairs,
      doors: state.doors
    }
  );
}

function saveMapFile(){
  var data = serializeMap();
  var json = JSON.stringify(data);
  try {
    localStorage.setItem('letfordead_map', json);
    showToast('Saved');
  } catch(e){
    showToast('Save failed: ' + e.message);
  }
}

function loadMapFromText(text){
  try {
    var data = JSON.parse(text);
    if(!data.tiles || !data.width || !data.height) throw new Error('Invalid format');

    state.mapW = data.width;
    state.mapH = data.height;
    state.data = data.tiles.map(function(row){ return row.slice(); });

    if(data.settings) state.settings = data.settings;

    state.sirenedCars = data.sirenedCars || [];
    state.messagePapers = data.messagePapers || {};
    state.adEvents = data.adEvents || [];
    state.teleportPairs = data.teleportPairs || {};
    state.doors = data.doors || [];

    state.history = [];
    state.historyIndex = -1;
    saveHistory();
    resizeCanvas();
    render();
    showToast('Loaded ' + state.mapW + 'x' + state.mapH);
  } catch(e){
    showToast('Load failed: ' + e.message);
  }
}

function openLoadModal(){
  document.getElementById('loadMapModal').classList.add('show');
  var saved = localStorage.getItem('letfordead_map');
  var ta = document.getElementById('loadMapText');
  if(saved && ta) ta.value = saved;
}

document.getElementById('loadMapCancel').addEventListener('click', function(){
  document.getElementById('loadMapModal').classList.remove('show');
});
document.getElementById('loadMapConfirm').addEventListener('click', function(){
  var text = document.getElementById('loadMapText').value;
  loadMapFromText(text);
  document.getElementById('loadMapModal').classList.remove('show');
});
document.getElementById('btnSave').addEventListener('click', saveMapFile);
document.getElementById('btnLoad').addEventListener('click', function(){
  var saved = localStorage.getItem('letfordead_map');
  if(saved) loadMapFromText(saved);
  else openLoadModal();
});

document.getElementById('btnPlay').addEventListener('click', function(){
  var data = serializeMap();
  try {
    localStorage.setItem('letfordead_active_map', JSON.stringify(data));
    localStorage.setItem('letfordead_map', JSON.stringify(data));
    showToast('Starting game...');
    setTimeout(function(){
      window.location.href = '../loading.html';
    }, 800);
  } catch(e){
    showToast('Save failed: ' + e.message);
  }
});

document.getElementById('btnExport').addEventListener('click', function(){
  var data = serializeMap();
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = (state.settings.mapName || 'map') + '_' + state.mapW + 'x' + state.mapH + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported');
});

// ============================================================
// SCRIPTING CONSOLE
// ============================================================
var consoleEl = document.getElementById('scriptConsole');
var consoleOutput = document.getElementById('consoleOutput');
var consoleInput = document.getElementById('consoleInput');
var consoleBody = document.getElementById('consoleBody');
var consoleDragHeader = document.getElementById('consoleDragHeader');
var consoleResize = document.getElementById('consoleResize');

var consoleVisible = false;
var dragging = false;
var dragOffset = { x: 0, y: 0 };
var resizing = false;
var resizeStart = { x: 0, y: 0, w: 0, h: 0 };

// Command history
var commandHistory = [];
var commandHistoryIndex = -1;

// Autocomplete state
var autocompleteIndex = 0;
var autocompleteMatches = [];
var autocompleteActive = false;

// ============================================================
// COMMAND DEFINITIONS (autocomplete uchun)
// ============================================================
var COMMANDS = [
  { cmd: 'help',         args: '',                      desc: 'Show help' },
  { cmd: 'clear',        args: '',                      desc: 'Clear console output' },
  { cmd: 'save',         args: '',                      desc: 'Save map to localStorage' },
  { cmd: 'load',         args: '',                      desc: 'Load last saved map' },
  { cmd: 'newsize',      args: 'W H',                   desc: 'Create new map (W×H)' },
  { cmd: 'fill',         args: 'TILE_ID',               desc: 'Fill all with tile ID' },
  { cmd: 'tile',         args: 'X Y TILE_ID',           desc: 'Set tile at X,Y' },
  { cmd: 'clearobjects', args: '',                      desc: 'Clear all objects' },
  { cmd: 'spawncar',     args: 'X Y [SIZE]',            desc: 'Place sirened car' },
  { cmd: 'spawndoor',    args: 'X Y TYPE',              desc: 'Place door (easy/hard/safe)' },
  { cmd: 'spawnteleport',args: 'X Y',                   desc: 'Place teleport (pair)' },
  { cmd: 'spawnpaper',   args: 'X Y [TEXT]',            desc: 'Place message paper' },
  { cmd: 'spawnad',      args: 'X Y',                   desc: 'Place ad/event marker' },
  { cmd: 'spawnspawn',   args: 'X Y TYPE',              desc: 'Place spawn (player/zombie/tank)' },
  { cmd: 'delete',       args: 'X Y',                   desc: 'Delete object at X,Y' },
  { cmd: 'list',         args: '',                      desc: 'List object counts' },
  { cmd: 'info',         args: '',                      desc: 'Show map info' },
  { cmd: 'tiles',        args: '',                      desc: 'Show all tile IDs' },
  { cmd: 'goto',         args: 'X Y',                   desc: 'Move camera to X,Y' },
  { cmd: 'zoom',         args: 'LEVEL',                 desc: 'Set zoom (0.25 - 4)' },
  { cmd: 'reload',       args: '',                      desc: 'Reload modules images' },
  { cmd: 'sound',        args: 'FILE',                  desc: 'Load sound file (sirened car)' },
  { cmd: 'export',       args: '',                      desc: 'Export map JSON' },
  { cmd: 'reset',        args: '',                      desc: 'Reset map to default' }
];

// Tile IDs for autocomplete
var TILE_IDS = Object.keys(TILES).map(function(id){
  var t = TILES[id];
  return { id: id, name: t.name };
});

// ============================================================
// CONSOLE FUNCTIONS
// ============================================================
function toggleConsole(){
  consoleVisible = !consoleVisible;
  if(consoleVisible){
    consoleEl.classList.add('show');
    if(consoleInput) consoleInput.focus();
  } else {
    consoleEl.classList.remove('show');
  }
}

// Console drag
if(consoleDragHeader){
  consoleDragHeader.addEventListener('mousedown', function(e){
    if(e.target.closest('.console-controls')) return;
    dragging = true;
    var rect = consoleEl.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    e.preventDefault();
  });
}

window.addEventListener('mousemove', function(e){
  if(dragging){
    consoleEl.style.transform = 'none';
    consoleEl.style.left = (e.clientX - dragOffset.x) + 'px';
    consoleEl.style.top = (e.clientY - dragOffset.y) + 'px';
    consoleEl.style.bottom = 'auto';
  }
  if(resizing){
    var dw = e.clientX - resizeStart.x;
    var dh = e.clientY - resizeStart.y;
    consoleEl.style.width = Math.max(300, resizeStart.w + dw) + 'px';
    consoleEl.style.height = Math.max(150, resizeStart.h + dh) + 'px';
  }
});

window.addEventListener('mouseup', function(){
  dragging = false;
  resizing = false;
});

if(consoleResize){
  consoleResize.addEventListener('mousedown', function(e){
    resizing = true;
    var rect = consoleEl.getBoundingClientRect();
    resizeStart.x = e.clientX;
    resizeStart.y = e.clientY;
    resizeStart.w = rect.width;
    resizeStart.h = rect.height;
    e.preventDefault();
  });
}

document.getElementById('consoleMinimize').addEventListener('click', function(){
  consoleBody.style.display = consoleBody.style.display === 'none' ? 'flex' : 'none';
});
document.getElementById('consoleClose').addEventListener('click', function(){
  toggleConsole();
});

// ============================================================
// AUTOCOMPLETE
// ============================================================
function getAutocompleteMatches(input){
  if(!input) return [];

  var parts = input.split(/\s+/);
  var lastPart = parts[parts.length - 1] || '';
  var firstPart = parts[0] || '';

  // Agar birinchi so'z yozilayotgan bo'lsa — command takliflari
  if(parts.length === 1){
    return COMMANDS.filter(function(c){
      return c.cmd.indexOf(lastPart.toLowerCase()) === 0;
    });
  }

  // Aks holda — args takliflari
  var cmdName = firstPart.toLowerCase();

  // Door type
  if(cmdName === 'spawndoor' && parts.length === 4){
    return ['easy', 'hard', 'safe'].map(function(d){
      return { cmd: d, args: '', desc: 'Door type' };
    }).filter(function(c){
      return c.cmd.indexOf(lastPart.toLowerCase()) === 0;
    });
  }

  // Spawn types
  if(cmdName === 'spawnspawn' && parts.length === 4){
    return ['player', 'zombie', 'common', 'special', 'tank'].map(function(d){
      return { cmd: d, args: '', desc: 'Spawn type' };
    }).filter(function(c){
      return c.cmd.indexOf(lastPart.toLowerCase()) === 0;
    });
  }

  // Tile IDs
  if(cmdName === 'fill' || cmdName === 'tile'){
    return TILE_IDS.filter(function(t){
      return String(t.id).indexOf(lastPart) === 0;
    }).map(function(t){
      return { cmd: t.id, args: '', desc: 'Tile: ' + t.name };
    });
  }

  return [];
}

function showAutocomplete(){
  var input = consoleInput.value.trim();
  var matches = getAutocompleteMatches(input);

  // Eski autocomplete panelini o'chirish
  var oldPanel = document.getElementById('autocompletePanel');
  if(oldPanel) oldPanel.remove();

  if(matches.length === 0 || !input){
    autocompleteActive = false;
    return;
  }

  autocompleteMatches = matches;
  if(autocompleteIndex >= matches.length) autocompleteIndex = 0;

  var panel = document.createElement('div');
  panel.id = 'autocompletePanel';
  panel.className = 'autocomplete-panel';

  matches.slice(0, 8).forEach(function(m, i){
    var item = document.createElement('div');
    item.className = 'autocomplete-item' + (i === autocompleteIndex ? ' active' : '');
    item.innerHTML = '<span class="ac-cmd">' + m.cmd + '</span>' +
                     (m.args ? '<span class="ac-args">' + m.args + '</span>' : '') +
                     '<span class="ac-desc">' + (m.desc || '') + '</span>';
    item.addEventListener('click', function(){
      applyAutocomplete(m);
    });
    panel.appendChild(item);
  });

  consoleEl.appendChild(panel);
  autocompleteActive = true;
}

function applyAutocomplete(match){
  var input = consoleInput.value;
  var parts = input.split(/\s+/);
  parts[parts.length - 1] = match.cmd;
  consoleInput.value = parts.join(' ') + (match.args ? ' ' : '');
  consoleInput.focus();
  hideAutocomplete();
}

function hideAutocomplete(){
  var panel = document.getElementById('autocompletePanel');
  if(panel) panel.remove();
  autocompleteActive = false;
  autocompleteMatches = [];
  autocompleteIndex = 0;
}

// Console input handlers
if(consoleInput){
  consoleInput.addEventListener('input', function(){
    autocompleteIndex = 0;
    showAutocomplete();
  });

  consoleInput.addEventListener('keydown', function(e){
    // Tab — autocomplete
    if(e.key === 'Tab'){
      e.preventDefault();
      if(autocompleteMatches.length > 0){
        applyAutocomplete(autocompleteMatches[autocompleteIndex]);
      }
      return;
    }

    // Up/Down — command history
    if(e.key === 'ArrowUp'){
      e.preventDefault();
      if(commandHistory.length > 0){
        if(commandHistoryIndex === -1) commandHistoryIndex = commandHistory.length - 1;
        else if(commandHistoryIndex > 0) commandHistoryIndex--;
        consoleInput.value = commandHistory[commandHistoryIndex];
      }
      return;
    }
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      if(commandHistory.length > 0 && commandHistoryIndex < commandHistory.length - 1){
        commandHistoryIndex++;
        consoleInput.value = commandHistory[commandHistoryIndex];
      } else {
        commandHistoryIndex = -1;
        consoleInput.value = '';
      }
      return;
    }

    // Autocomplete panel navigation
    if(autocompleteActive){
      if(e.key === 'Tab' && !e.shiftKey){
        e.preventDefault();
        if(autocompleteMatches.length > 0){
          applyAutocomplete(autocompleteMatches[autocompleteIndex]);
        }
        return;
      }
      if(e.key === 'ArrowRight' || (e.key === 'Tab' && e.shiftKey)){
        // Boshqa variant
      }
    }

    // Enter — execute
    if(e.key === 'Enter'){
      e.preventDefault();
      hideAutocomplete();
      var cmd = consoleInput.value.trim();
      if(cmd){
        commandHistory.push(cmd);
        commandHistoryIndex = -1;
        consoleLog('> ' + cmd, 'line-input');
        executeCommand(cmd);
        consoleInput.value = '';
      }
      return;
    }

    // Escape — hide autocomplete
    if(e.key === 'Escape'){
      hideAutocomplete();
      return;
    }
  });
}

function consoleLog(text, className){
  if(!consoleOutput) return;
  var line = document.createElement('div');
  line.className = className || '';
  line.textContent = text;
  consoleOutput.appendChild(line);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// ============================================================
// COMMAND EXECUTION
// ============================================================
function executeCommand(cmd){
  var parts = cmd.split(/\s+/);
  var command = parts[0].toLowerCase();
  var args = parts.slice(1);

  switch(command){
    case 'help':
      consoleLog('═══════════════════════════════', 'line-info');
      consoleLog('Available commands:', 'line-info');
      COMMANDS.forEach(function(c){
        consoleLog('  ' + c.cmd + (c.args ? ' ' + c.args : '') + '  —  ' + c.desc);
      });
      consoleLog('Tip: Press TAB for autocomplete', 'line-info');
      break;

    case 'clear':
      if(consoleOutput) consoleOutput.innerHTML = '';
      break;

    case 'save':
      saveMapFile();
      consoleLog('Saved', 'line-success');
      break;

    case 'load':
      var saved = localStorage.getItem('letfordead_map');
      if(saved){
        loadMapFromText(saved);
        consoleLog('Loaded', 'line-success');
      } else {
        consoleLog('No saved map', 'line-error');
      }
      break;

    case 'newsize':
      if(args.length >= 2){
        var w = parseInt(args[0], 10);
        var h = parseInt(args[1], 10);
        if(w > 0 && h > 0){
          createMap(w, h);
          consoleLog('New map: ' + w + 'x' + h, 'line-success');
        }
      } else {
        consoleLog('Usage: newsize W H', 'line-error');
      }
      break;

    case 'fill':
      if(args.length >= 1){
        var id = parseInt(args[0], 10);
        saveHistory();
        for(var y = 0; y < state.mapH; y++){
          for(var x = 0; x < state.mapW; x++){
            state.data[y][x] = id;
          }
        }
        render();
        consoleLog('Filled with tile ' + id, 'line-success');
      } else {
        consoleLog('Usage: fill TILE_ID', 'line-error');
      }
      break;

    case 'tile':
      if(args.length >= 3){
        var tx = parseInt(args[0], 10);
        var ty = parseInt(args[1], 10);
        var tid = parseInt(args[2], 10);
        paintCell(tx, ty, tid);
        render();
        consoleLog('Tile set at ' + tx + ',' + ty, 'line-success');
      } else {
        consoleLog('Usage: tile X Y TILE_ID', 'line-error');
      }
      break;

    case 'clearobjects':
      saveHistory();
      state.sirenedCars = [];
      state.messagePapers = {};
      state.adEvents = [];
      state.teleportPairs = {};
      state.doors = [];
      render();
      consoleLog('All objects cleared', 'line-success');
      break;

    case 'spawncar':
      if(args.length >= 2){
        var cx = parseInt(args[0], 10);
        var cy = parseInt(args[1], 10);
        var size = parseInt(args[2], 10) || 4;
        saveHistory();
        state.sirenedCars.push({
          x: cx, y: cy,
          size: size,
          sound: state.sirenedCarSound || null,
          imageOff: 'modules/alarmcar.png',
          imageOn: 'modules/alarmedcar.png'
        });
        render();
        consoleLog('Sirened car at ' + cx + ',' + cy + ' (size ' + size + ')', 'line-success');
      } else {
        consoleLog('Usage: spawncar X Y [SIZE]', 'line-error');
      }
      break;

    case 'spawndoor':
      if(args.length >= 3){
        var dx = parseInt(args[0], 10);
        var dy = parseInt(args[1], 10);
        var dType = args[2];
        if(['easy', 'hard', 'safe'].indexOf(dType) === -1){
          consoleLog('Type must be: easy, hard, safe', 'line-error');
          break;
        }
        saveHistory();
        state.doors.push({ x: dx, y: dy, type: dType, position: state.doorPosition });
        render();
        consoleLog('Door (' + dType + ') at ' + dx + ',' + dy, 'line-success');
      } else {
        consoleLog('Usage: spawndoor X Y TYPE', 'line-error');
      }
      break;

    case 'spawnteleport':
      if(args.length >= 2){
        var tpx = parseInt(args[0], 10);
        var tpy = parseInt(args[1], 10);
        saveHistory();
        var pid = 1;
        while(state.teleportPairs[pid] && state.teleportPairs[pid].length >= 2) pid++;
        if(!state.teleportPairs[pid]) state.teleportPairs[pid] = [];
        state.teleportPairs[pid].push({ x: tpx, y: tpy });
        render();
        consoleLog('Teleport at ' + tpx + ',' + tpy + ' (pair ' + pid + ')', 'line-success');
      } else {
        consoleLog('Usage: spawnteleport X Y', 'line-error');
      }
      break;

    case 'spawnpaper':
      if(args.length >= 2){
        var px = parseInt(args[0], 10);
        var py = parseInt(args[1], 10);
        var text = args.slice(2).join(' ') || 'Click E to read';
        saveHistory();
        state.messagePapers[px + ',' + py] = { title: 'Note', text: text };
        render();
        consoleLog('Message paper at ' + px + ',' + py, 'line-success');
      } else {
        consoleLog('Usage: spawnpaper X Y [TEXT]', 'line-error');
      }
      break;

    case 'spawnad':
      if(args.length >= 2){
        var ax = parseInt(args[0], 10);
        var ay = parseInt(args[1], 10);
        saveHistory();
        state.adEvents.push({ x: ax, y: ay, w: 6, h: 4, data: null, type: 'image' });
        render();
        consoleLog('Ad/Event at ' + ax + ',' + ay, 'line-success');
      } else {
        consoleLog('Usage: spawnad X Y', 'line-error');
      }
      break;

    case 'spawnspawn':
      if(args.length >= 3){
        var sx = parseInt(args[0], 10);
        var sy = parseInt(args[1], 10);
        var st = args[2].toLowerCase();
        var tileId = 13;
        if(st === 'player') tileId = 13;
        else if(st === 'zombie') tileId = 16;
        else if(st === 'common') tileId = 35;
        else if(st === 'special') tileId = 36;
        else if(st === 'tank') tileId = 34;
        else { consoleLog('Type: player/zombie/common/special/tank', 'line-error'); break; }
        paintCell(sx, sy, tileId);
        render();
        consoleLog('Spawn (' + st + ') at ' + sx + ',' + sy, 'line-success');
      } else {
        consoleLog('Usage: spawnspawn X Y TYPE', 'line-error');
      }
      break;

    case 'delete':
      if(args.length >= 2){
        state.hoverCell.x = parseInt(args[0], 10);
        state.hoverCell.y = parseInt(args[1], 10);
        deleteObjectAtHover();
        consoleLog('Deleted at ' + args[0] + ',' + args[1], 'line-success');
      } else {
        consoleLog('Usage: delete X Y', 'line-error');
      }
      break;

    case 'list':
      consoleLog('Sirened cars: ' + state.sirenedCars.length, 'line-info');
      consoleLog('Doors: ' + state.doors.length, 'line-info');
      consoleLog('Message papers: ' + Object.keys(state.messagePapers).length, 'line-info');
      consoleLog('Ad events: ' + state.adEvents.length, 'line-info');
      consoleLog('Teleport pairs: ' + Object.keys(state.teleportPairs).length, 'line-info');
      break;

    case 'info':
      consoleLog('Map: ' + state.mapW + 'x' + state.mapH, 'line-info');
      consoleLog('Name: ' + state.settings.mapName, 'line-info');
      consoleLog('Author: ' + state.settings.mapAuthor, 'line-info');
      consoleLog('Transport: ' + state.settings.transportType, 'line-info');
      consoleLog('Zoom: ' + state.zoom.toFixed(2), 'line-info');
      consoleLog('Camera: ' + state.camera.x.toFixed(0) + ',' + state.camera.y.toFixed(0), 'line-info');
      break;

    case 'tiles':
      consoleLog('Tile IDs:', 'line-info');
      Object.keys(TILES).forEach(function(id){
        var t = TILES[id];
        consoleLog('  ' + id + ' = ' + t.name + ' [' + t.sub + ']');
      });
      break;

    case 'goto':
      if(args.length >= 2){
        var gx = parseInt(args[0], 10) * CELL_SIZE * state.zoom;
        var gy = parseInt(args[1], 10) * CELL_SIZE * state.zoom;
        state.camera.x = gx - canvas.width / 2;
        state.camera.y = gy - canvas.height / 2;
        render();
        consoleLog('Camera moved to ' + args[0] + ',' + args[1], 'line-success');
      } else {
        consoleLog('Usage: goto X Y', 'line-error');
      }
      break;

    case 'zoom':
      if(args.length >= 1){
        var z = parseFloat(args[0]);
        if(z >= state.minZoom && z <= state.maxZoom){
          state.zoom = z;
          render();
          consoleLog('Zoom: ' + z, 'line-success');
        } else {
          consoleLog('Zoom must be between ' + state.minZoom + ' and ' + state.maxZoom, 'line-error');
        }
      }
      break;

    case 'reload':
      loadSirenedCarImages();
      consoleLog('Images reloading...', 'line-info');
      break;

    case 'sound':
      consoleLog('Use the Sirened Car modal to upload sound', 'line-info');
      break;

    case 'export':
      document.getElementById('btnExport').click();
      consoleLog('Exported', 'line-success');
      break;

    case 'reset':
      if(confirm('Reset map? All changes will be lost.')){
        createMap(DEFAULT_W, DEFAULT_H);
        consoleLog('Map reset', 'line-success');
      }
      break;

    default:
      consoleLog('Unknown command: ' + command, 'line-error');
      consoleLog('Type "help" for list', 'line-info');
  }
}

// ============================================================
// INIT
// ============================================================
function init(){
  buildPalette();
  setTool('brush');
  selectTile(2);
  createMap(DEFAULT_W, DEFAULT_H);

  for(var x = 0; x < state.mapW; x++){
    state.data[0][x] = 2;
    state.data[state.mapH - 1][x] = 2;
  }
  for(var y = 0; y < state.mapH; y++){
    state.data[y][0] = 2;
    state.data[y][state.mapW - 1] = 2;
  }
  for(var yy = 1; yy < state.mapH - 1; yy++){
    for(var xx = 1; xx < state.mapW - 1; xx++){
      state.data[yy][xx] = 1;
    }
  }
  state.data[Math.floor(state.mapH / 2)][Math.floor(state.mapW / 2)] = 13;

  loadSirenedCarImages();

  render();
  console.log('[MapMaker] Ready');
  console.log('[MapMaker] Press ` or ~ for console');
}

init();

})();