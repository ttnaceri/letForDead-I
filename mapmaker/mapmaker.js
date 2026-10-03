// ============================================================
// MAP MAKER — asosiy kod
// ============================================================
(function(){
'use strict';

// ============================================================
// KONSTANTALAR
// ============================================================
var CELL_SIZE = 32;          // Har bir katak 32px
var DEFAULT_W = 40;          // Default kenglik
var DEFAULT_H = 30;          // Default balandlik

// ============================================================
// TILE TYPES — katak turlari
// ============================================================
var TILES = {
  0: { id: 0, name: 'Empty',      color: '#0d0b0a', sub: 'empty' },
  1: { id: 1, name: 'Floor',      color: '#2a2418', sub: 'walkable' },
  2: { id: 2, name: 'Wall',       color: '#4a3f55', sub: 'solid' },
  3: { id: 3, name: 'Concrete',   color: '#3a3226', sub: 'solid' },
  4: { id: 4, name: 'Blood',      color: '#5a1a15', sub: 'floor' },
  5: { id: 5, name: 'Grass',      color: '#33402b', sub: 'floor' },
  6: { id: 6, name: 'Water',      color: '#1a2a3a', sub: 'slow' },
  7: { id: 7, name: 'Sand',       color: '#5a4a2a', sub: 'floor' },
  8: { id: 8, name: 'Metal',      color: '#3a3a4a', sub: 'solid' },
  9: { id: 9, name: 'Wood',       color: '#4a3520', sub: 'solid' },
  10:{ id: 10, name: 'Brick',     color: '#6a2a1a', sub: 'solid' },
  11:{ id: 11, name: 'Road',      color: '#1a1a1a', sub: 'walkable' },
  12:{ id: 12, name: 'Road Line', color: '#c9bfa8', sub: 'walkable' },
  13:{ id: 13, name: 'Spawn P1',  color: '#4a8ed4', sub: 'player 1' },
  14:{ id: 14, name: 'Spawn P2',  color: '#d4a44a', sub: 'player 2' },
  15:{ id: 15, name: 'Spawn P3',  color: '#d44a7a', sub: 'player 3' },
  16:{ id: 16, name: 'Zombie Spawn', color: '#7a9a3a', sub: 'enemy' },
  17:{ id: 17, name: 'Ammo Crate', color: '#c98a2e', sub: 'pickup' },
  18:{ id: 18, name: 'AID Kit',   color: '#7fbf52', sub: 'pickup' },
  19:{ id: 19, name: 'Radio',     color: '#e0a83f', sub: 'objective' },
  20:{ id: 20, name: 'Helipad',   color: '#7ad44a', sub: 'objective' },
  21:{ id: 21, name: 'Fence',     color: '#837b6d', sub: 'solid' },
  22:{ id: 22, name: 'Glass',     color: '#4a6a8a', sub: 'solid' },
  23:{ id: 23, name: 'Carpet',    color: '#6a2a2a', sub: 'floor' },
  24:{ id: 24, name: 'Door',      color: '#8a5a2a', sub: 'door' },
  25:{ id: 25, name: 'Exit',      color: '#e0523c', sub: 'objective' }
};

// ============================================================
// STATE
// ============================================================
var state = {
  mapW: DEFAULT_W,
  mapH: DEFAULT_H,
  data: [],             // 2D array [y][x] = tile id
  tool: 'brush',        // brush | erase | fill | picker
  selectedTile: 2,      // joriy tile id
  camera: { x: 0, y: 0 },
  zoom: 1.0,
  minZoom: 0.25,
  maxZoom: 4.0,
  gridVisible: true,
  isPainting: false,
  paintTile: 2,
  panning: false,
  panStart: { x: 0, y: 0 },
  panCam: { x: 0, y: 0 },
  hoverCell: { x: -1, y: -1 },
  history: [],
  historyIndex: -1,
  maxHistory: 100
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
    for(var x = 0; x < w; x++){
      row.push(0);   // default: empty
    }
    state.data.push(row);
  }
  state.history = [];
  state.historyIndex = -1;
  saveHistory();
  resizeCanvas();
  render();
}

// ============================================================
// HISTORY — Undo/Redo
// ============================================================
function saveHistory(){
  // Joriy holatdan oldingi history'ni kesish
  state.history = state.history.slice(0, state.historyIndex + 1);

  // Yangi state nusxasi
  var snapshot = {
    w: state.mapW,
    h: state.mapH,
    data: state.data.map(function(row){ return row.slice(); })
  };
  state.history.push(snapshot);

  // Limit
  if(state.history.length > state.maxHistory){
    state.history.shift();
  }
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
  resizeCanvas();
  render();
  updateUndoRedoButtons();
}

function updateUndoRedoButtons(){
  document.getElementById('btnUndo').disabled = state.historyIndex <= 0;
  document.getElementById('btnRedo').disabled = state.historyIndex >= state.history.length - 1;
}

// ============================================================
// CANVAS RESIZE
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

window.addEventListener('resize', function(){
  resizeCanvas();
  render();
});

// ============================================================
// RENDER
// ============================================================
function worldToScreen(wx, wy){
  return {
    x: (wx * CELL_SIZE * state.zoom) - state.camera.x,
    y: (wy * CELL_SIZE * state.zoom) - state.camera.y
  };
}

function screenToWorld(sx, sy){
  return {
    x: (sx + state.camera.x) / (CELL_SIZE * state.zoom),
    y: (sy + state.camera.y) / (CELL_SIZE * state.zoom)
  };
}

function render(){
  var w = canvas.width;
  var h = canvas.height;
  var cs = CELL_SIZE * state.zoom;

  // Background
  ctx.fillStyle = '#0d0b0a';
  ctx.fillRect(0, 0, w, h);

  // Faqat ko'rinadigan kataklarni chizish (performance)
  var startX = Math.max(0, Math.floor(state.camera.x / cs));
  var startY = Math.max(0, Math.floor(state.camera.y / cs));
  var endX = Math.min(state.mapW, Math.ceil((state.camera.x + w) / cs));
  var endY = Math.min(state.mapH, Math.ceil((state.camera.y + h) / cs));

  // Map cells
  for(var y = startY; y < endY; y++){
    for(var x = startX; x < endX; x++){
      var tileId = state.data[y][x];
      var tile = TILES[tileId];
      var sx = x * cs - state.camera.x;
      var sy = y * cs - state.camera.y;

      if(tileId === 0){
        // Empty — shashka pattern
        ctx.fillStyle = ((x + y) % 2 === 0) ? '#0d0b0a' : '#131010';
        ctx.fillRect(sx, sy, cs, cs);
      } else {
        ctx.fillStyle = tile.color;
        ctx.fillRect(sx, sy, cs, cs);

        // Tile turiga qarab belgi
        drawTileIcon(ctx, tileId, sx, sy, cs);
      }
    }
  }

  // Map chegarasi
  ctx.strokeStyle = '#a32f22';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    -state.camera.x,
    -state.camera.y,
    state.mapW * cs,
    state.mapH * cs
  );

  // Hover cell
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

  // Grid overlay
  renderGrid(cs);
}

function drawTileIcon(c, tileId, sx, sy, cs){
  var cx = sx + cs / 2;
  var cy = sy + cs / 2;
  var s = cs / CELL_SIZE;   // Scale

  // Spawn points
  if(tileId === 13 || tileId === 14 || tileId === 15){
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(cx, cy, cs * 0.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#000';
    c.font = 'bold ' + (cs * 0.3) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(tileId - 12, cx, cy + 1);
  }
  // Zombie spawn
  else if(tileId === 16){
    c.fillStyle = '#c94a3a';
    c.beginPath();
    c.arc(cx, cy, cs * 0.18, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#000';
    c.font = 'bold ' + (cs * 0.3) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('Z', cx, cy + 1);
  }
  // Ammo
  else if(tileId === 17){
    c.fillStyle = '#f0d98a';
    c.fillRect(cx - cs*0.15, cy - cs*0.1, cs*0.3, cs*0.2);
    c.fillStyle = '#c98a2e';
    c.fillRect(cx - cs*0.15, cy - cs*0.2, cs*0.3, cs*0.1);
  }
  // AID
  else if(tileId === 18){
    c.fillStyle = '#fff';
    c.fillRect(cx - cs*0.08, cy - cs*0.2, cs*0.16, cs*0.4);
    c.fillRect(cx - cs*0.2, cy - cs*0.08, cs*0.4, cs*0.16);
  }
  // Radio
  else if(tileId === 19){
    c.strokeStyle = '#fff';
    c.lineWidth = cs * 0.06;
    c.strokeRect(cx - cs*0.2, cy - cs*0.15, cs*0.4, cs*0.3);
    c.beginPath();
    c.moveTo(cx + cs*0.15, cy - cs*0.15);
    c.lineTo(cx + cs*0.25, cy - cs*0.3);
    c.stroke();
  }
  // Helipad
  else if(tileId === 20){
    c.strokeStyle = '#fff';
    c.lineWidth = cs * 0.08;
    c.beginPath();
    c.arc(cx, cy, cs * 0.25, 0, Math.PI * 2);
    c.stroke();
    c.font = 'bold ' + (cs * 0.4) + 'px monospace';
    c.fillStyle = '#fff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('H', cx, cy + 1);
  }
  // Door
  else if(tileId === 24){
    c.fillStyle = '#4a3520';
    c.fillRect(cx - cs*0.15, cy - cs*0.15, cs*0.3, cs*0.3);
    c.fillStyle = '#c98a2e';
    c.beginPath();
    c.arc(cx + cs*0.08, cy, cs*0.04, 0, Math.PI * 2);
    c.fill();
  }
  // Exit
  else if(tileId === 25){
    c.fillStyle = '#fff';
    c.font = 'bold ' + (cs * 0.5) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('▶', cx, cy + 1);
  }
  // Water
  else if(tileId === 6){
    c.strokeStyle = 'rgba(255,255,255,0.1)';
    c.lineWidth = 1;
    for(var i = 0; i < 3; i++){
      var yy = sy + cs * (0.3 + i * 0.2);
      c.beginPath();
      c.moveTo(sx + cs * 0.15, yy);
      c.lineTo(sx + cs * 0.35, yy - 2);
      c.lineTo(sx + cs * 0.55, yy);
      c.lineTo(sx + cs * 0.75, yy - 2);
      c.stroke();
    }
  }
  // Road line
  else if(tileId === 12){
    c.fillStyle = '#c9bfa8';
    c.fillRect(cx - cs*0.05, sy, cs*0.1, cs);
  }
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

  gridCtx.strokeStyle = 'rgba(131,123,109,0.25)';
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
// PALETTE YARATISH
// ============================================================
function buildPalette(){
  palette.innerHTML = '';

  // Kategoriyalar
  var sections = [
    { title: 'Terrain',     ids: [0, 1, 5, 7, 11, 12, 4, 23] },
    { title: 'Walls',       ids: [2, 3, 8, 9, 10, 21, 22] },
    { title: 'Special',     ids: [6, 24, 25] },
    { title: 'Spawns',      ids: [13, 14, 15, 16] },
    { title: 'Objectives',  ids: [17, 18, 19, 20] }
  ];

  sections.forEach(function(sec){
    var h = document.createElement('div');
    h.className = 'palette-section';
    h.textContent = sec.title;
    palette.appendChild(h);

    sec.ids.forEach(function(id){
      var tile = TILES[id];
      if(!tile) return;

      var btn = document.createElement('button');
      btn.className = 'tile-btn' + (state.selectedTile === id ? ' active' : '');
      btn.setAttribute('data-tile', id);

      var prev = document.createElement('div');
      prev.className = 'tile-preview';
      prev.style.background = tile.color;
      if(id === 0){
        prev.style.background = 'repeating-linear-gradient(45deg, #0d0b0a 0px, #0d0b0a 4px, #1a1715 4px, #1a1715 8px)';
      }

      var label = document.createElement('div');
      label.className = 'tile-label';
      label.innerHTML = '<div class="name">' + tile.name + '</div>' +
                        '<div class="sub">' + tile.sub + '</div>';

      btn.appendChild(prev);
      btn.appendChild(label);

      btn.addEventListener('click', function(){
        selectTile(id);
      });

      palette.appendChild(btn);
    });
  });
}

function selectTile(id){
  state.selectedTile = id;
  var btns = palette.querySelectorAll('.tile-btn');
  for(var i = 0; i < btns.length; i++){
    btns[i].classList.toggle('active', parseInt(btns[i].getAttribute('data-tile'), 10) === id);
  }
  statusInfo.textContent = 'Selected: ' + TILES[id].name;
}

// ============================================================
// PAINT OPERATIONS
// ============================================================
function paintCell(x, y, tileId){
  if(x < 0 || x >= state.mapW || y < 0 || y >= state.mapH) return false;
  if(state.data[y][x] === tileId) return false;
  state.data[y][x] = tileId;
  return true;
}

function paintLine(x0, y0, x1, y1, tileId){
  // Bresenham chizig'i — silliq chizish uchun
  var dx = Math.abs(x1 - x0);
  var dy = Math.abs(y1 - y0);
  var sx = x0 < x1 ? 1 : -1;
  var sy = y0 < y1 ? 1 : -1;
  var err = dx - dy;
  var changed = false;

  while(true){
    if(paintCell(x0, y0, tileId)) changed = true;
    if(x0 === x1 && y0 === y1) break;
    var e2 = 2 * err;
    if(e2 > -dy){ err -= dy; x0 += sx; }
    if(e2 < dx){ err += dx; y0 += sy; }
  }
  return changed;
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
// MOUSE EVENTS
// ============================================================
var lastPaintCell = { x: -1, y: -1 };
var historySaved = false;

canvas.addEventListener('mousedown', function(e){
canvas.addEventListener('mousemove', function(e){
  var rect = canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  var my = e.clientY - rect.top;

  // === KAMERA FOLLOW uchun ===
  mouseScreen.x = mx;
  mouseScreen.y = my;

  // ... qolgan mavjud kod
});
  var rect = canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  var my = e.clientY - rect.top;

  // MMB — pan
  if(e.button === 1){
    e.preventDefault();
    state.panning = true;
    state.panStart.x = mx;
    state.panStart.y = my;
    state.panCam.x = state.camera.x;
    state.panCam.y = state.camera.y;
    canvas.style.cursor = 'grabbing';
    return;
  }

  var world = screenToWorld(mx, my);
  var cx = Math.floor(world.x);
  var cy = Math.floor(world.y);

  // RMB — erase
  if(e.button === 2){
    e.preventDefault();
    state.isPainting = true;
    state.paintTile = 0;
    historySaved = false;
    paintCell(cx, cy, 0);
    lastPaintCell.x = cx;
    lastPaintCell.y = cy;
    render();
    return;
  }

  // LMB
  if(e.button === 0){
    if(state.tool === 'picker'){
      // Picker — katakdan tile olish
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

    state.isPainting = true;
    state.paintTile = state.selectedTile;
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

  // Pan
  if(state.panning){
    state.camera.x = state.panCam.x - (mx - state.panStart.x);
    state.camera.y = state.panCam.y - (my - state.panStart.y);
    render();
    return;
  }

  var world = screenToWorld(mx, my);
  var cx = Math.floor(world.x);
  var cy = Math.floor(world.y);

  // Hover
  var changedHover = (cx !== state.hoverCell.x || cy !== state.hoverCell.y);
  if(changedHover){
    state.hoverCell.x = cx;
    state.hoverCell.y = cy;
    coordDisplay.textContent = cx + ', ' + cy;
  }

  // Painting
  if(state.isPainting){
    if(!historySaved){
      // Birinchi harakat — history saqlash
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
    state.panning = false;
    canvas.style.cursor = 'crosshair';
  }
  if(state.isPainting){
    state.isPainting = false;
    lastPaintCell.x = -1;
    lastPaintCell.y = -1;
  }
});

canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });

// ============================================================
// WHEEL — Zoom
// ============================================================
canvas.addEventListener('wheel', function(e){
  e.preventDefault();

  var rect = canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  var my = e.clientY - rect.top;

  // Sichqoncha ostidagi world nuqtasi
  var worldBefore = screenToWorld(mx, my);

  // Zoom
  var factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  var newZoom = Math.max(state.minZoom, Math.min(state.maxZoom, state.zoom * factor));

  if(newZoom === state.zoom) return;

  state.zoom = newZoom;

  // Kamerani shunday sozlaymizki, sichqoncha ostidagi nuqta qimirlamasin
  var cs = CELL_SIZE * state.zoom;
  state.camera.x = worldBefore.x * cs - mx;
  state.camera.y = worldBefore.y * cs - my;

  render();
}, { passive: false });

// ============================================================
// KEYBOARD — Shortcuts
// ============================================================
window.addEventListener('keydown', function(e){
  var k = e.key ? e.key.toLowerCase() : '';

  // Ctrl+Z — Undo
  if(e.ctrlKey && k === 'z' && !e.shiftKey){
    e.preventDefault();
    undo();
    return;
  }

  // Ctrl+Shift+Z — Redo
  if(e.ctrlKey && e.shiftKey && k === 'z'){
    e.preventDefault();
    redo();
    return;
  }

  // Ctrl+Y — Redo (qo'shimcha)
  if(e.ctrlKey && k === 'y'){
    e.preventDefault();
    redo();
    return;
  }

  // Ctrl+S — Save
  if(e.ctrlKey && k === 's'){
    e.preventDefault();
    saveMapFile();
    return;
  }

  // Ctrl+O — Load
  if(e.ctrlKey && k === 'o'){
    e.preventDefault();
    openLoadModal();
    return;
  }

  // Ctrl+N — New
  if(e.ctrlKey && k === 'n'){
    e.preventDefault();
    openNewModal();
    return;
  }

  // Delete / Backspace — joriy katakni o'chirish (hover ostida)
  if((k === 'delete' || k === 'backspace') && state.hoverCell.x >= 0){
    e.preventDefault();
    saveHistory();
    paintCell(state.hoverCell.x, state.hoverCell.y, 0);
    render();
    return;
  }

  // 1-9 — tez tanlash
  if(k >= '1' && k <= '9' && !e.ctrlKey && !e.altKey){
    var num = parseInt(k, 10);
    // Palette'dagi tartib bo'yicha
    var sections = [0, 1, 5, 7, 11, 12, 4, 23, 2];   // 1-9 -> birinchi terrain
    if(num >= 1 && num <= 9){
      selectTile(sections[num - 1]);
    }
    return;
  }

  // Escape — modal yopish
  if(k === 'escape'){
    document.querySelectorAll('.modal-bg').forEach(function(m){
      m.classList.remove('show');
    });
    return;
  }

  // G — Grid toggle
  if(k === 'g' && !e.ctrlKey){
    e.preventDefault();
    state.gridVisible = !state.gridVisible;
    render();
    return;
  }

  // B/E/F/I — tool lar
  if(k === 'b' && !e.ctrlKey) setTool('brush');
  if(k === 'e' && !e.ctrlKey) setTool('erase');
  if(k === 'f' && !e.ctrlKey) setTool('fill');
  if(k === 'i' && !e.ctrlKey) setTool('picker');
});

// ============================================================
// TOOLBARS
// ============================================================
function setTool(tool){
  state.tool = tool;
  var btns = document.querySelectorAll('.tool-btn[data-tool]');
  for(var i = 0; i < btns.length; i++){
    btns[i].classList.toggle('active', btns[i].getAttribute('data-tool') === tool);
  }
  statusInfo.textContent = 'Tool: ' + tool;
}

document.getElementById('toolBrush').addEventListener('click', function(){ setTool('brush'); });
document.getElementById('toolErase').addEventListener('click', function(){ setTool('erase'); });
document.getElementById('toolFill').addEventListener('click', function(){ setTool('fill'); });
document.getElementById('toolPicker').addEventListener('click', function(){ setTool('picker'); });

document.getElementById('btnUndo').addEventListener('click', undo);
document.getElementById('btnRedo').addEventListener('click', redo);

document.getElementById('btnGrid').addEventListener('click', function(){
  state.gridVisible = !state.gridVisible;
  render();
});

// ============================================================
// NEW MAP
// ============================================================
function openNewModal(){
  document.getElementById('newMapModal').classList.add('show');
}

document.getElementById('newMapCancel').addEventListener('click', function(){
  document.getElementById('newMapModal').classList.remove('show');
});

document.getElementById('newMapCreate').addEventListener('click', function(){
  var w = parseInt(document.getElementById('newMapW').value, 10);
  var h = parseInt(document.getElementById('newMapH').value, 10);
  w = Math.max(5, Math.min(500, w || 40));
  h = Math.max(5, Math.min(500, h || 30));
  createMap(w, h);
  document.getElementById('newMapModal').classList.remove('show');
  showToast('New map: ' + w + 'x' + h);
});

document.getElementById('btnNew').addEventListener('click', openNewModal);

// ============================================================
// SAVE / LOAD / EXPORT
// ============================================================
function serializeMap(){
  return {
    version: 1,
    width: state.mapW,
    height: state.mapH,
    cellSize: CELL_SIZE,
    tiles: state.data.map(function(row){ return row.slice(); })
  };
}

function saveMapFile(){
  var data = serializeMap();
  var json = JSON.stringify(data);
  try {
    localStorage.setItem('letfordead_map', json);
    showToast('Saved to localStorage');
  } catch(e){
    showToast('Save failed: ' + e.message);
  }
}

function loadMapFromText(text){
  try {
    var data = JSON.parse(text);
    if(!data.tiles || !data.width || !data.height){
      throw new Error('Noto\'g\'ri format');
    }
    state.mapW = data.width;
    state.mapH = data.height;
    state.data = data.tiles.map(function(row){ return row.slice(); });
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
  if(saved){
    document.getElementById('loadMapText').value = saved;
  }
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
  // localStorage dan yuklash
  var saved = localStorage.getItem('letfordead_map');
  if(saved){
    loadMapFromText(saved);
  } else {
    openLoadModal();
  }
});

document.getElementById('btnExport').addEventListener('click', function(){
  var data = serializeMap();
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'letfordead_map_' + state.mapW + 'x' + state.mapH + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported');
});

// ============================================================
// INIT
// ============================================================
function init(){
  buildPalette();
  setTool('brush');
  selectTile(2);   // Wall default
  createMap(DEFAULT_W, DEFAULT_H);

  // Boshlang'ich map — devor bilan o'ralgan xona
  for(var x = 0; x < state.mapW; x++){
    state.data[0][x] = 2;
    state.data[state.mapH - 1][x] = 2;
  }
  for(var y = 0; y < state.mapH; y++){
    state.data[y][0] = 2;
    state.data[y][state.mapW - 1] = 2;
  }

  // Ichini floor qilish
  for(var yy = 1; yy < state.mapH - 1; yy++){
    for(var xx = 1; xx < state.mapW - 1; xx++){
      state.data[yy][xx] = 1;
    }
  }

  // Player spawn
  state.data[Math.floor(state.mapH / 2)][Math.floor(state.mapW / 2)] = 13;

  render();
  console.log('[MapMaker] Ready');
}

// ============================================================
// CAMERA FOLLOW — kursor atrofida
// ============================================================
var mouseScreen = { x: 0, y: 0 };
var cameraFollow = {
  enabled: true,
  speed: 6,              // qanchalik tez harakat
  edgeMargin: 80,        // ekran chekkasidan boshlash
  deadzone: 150,         // markazda o'lik zona (qimirlamaydi)
  smooth: 0.15           // silliqlik (0-1)
};

var camTarget = { x: 0, y: 0 };   // kameraning maqsad pozitsiyasi

function updateCameraFollow(dt){
  if(!cameraFollow.enabled) return;
  if(state.panning) return;   // pan paytida follow o'chadi

  var w = canvas.width;
  var h = canvas.height;
  var mx = mouseScreen.x;
  var my = mouseScreen.y;

  // Agar kursor ekrandan tashqarida bo'lsa — follow qilmaydi
  if(mx < 0 || my < 0 || mx > w || my > h) return;

  // Markazga nisbatan
  var cx = w / 2;
  var cy = h / 2;

  // Deadzone
  var dx = 0, dy = 0;
  var dz = cameraFollow.deadzone;

  if(mx < cx - dz) dx = -1;
  else if(mx > cx + dz) dx = 1;

  if(my < cy - dz) dy = -1;
  else if(my > cy + dz) dy = 1;

  // Edge margin — yaqinroq harakat
  var margin = cameraFollow.edgeMargin;
  if(mx < margin) dx = Math.min(dx, -1) || -1;
  if(mx > w - margin) dx = Math.max(dx, 1) || 1;
  if(my < margin) dy = Math.min(dy, -1) || -1;
  if(my > h - margin) dy = Math.max(dy, 1) || 1;

  if(dx === 0 && dy === 0) return;

  // Speed proportional to distance
  var speedX = 0, speedY = 0;

  if(dx !== 0){
    var t = Math.min(1, Math.abs(mx - cx) / (w / 2));
    speedX = dx * cameraFollow.speed * (1 + t * 2);
  }
  if(dy !== 0){
    var t2 = Math.min(1, Math.abs(my - cy) / (h / 2));
    speedY = dy * cameraFollow.speed * (1 + t2 * 2);
  }

  // Smooth pan
  state.camera.x += speedX;
  state.camera.y += speedY;

  // Chegaralash
  var cs = CELL_SIZE * state.zoom;
  var maxX = Math.max(0, state.mapW * cs - w);
  var maxY = Math.max(0, state.mapH * cs - h);

  if(state.camera.x < 0) state.camera.x = 0;
  if(state.camera.y < 0) state.camera.y = 0;
  if(state.camera.x > maxX) state.camera.x = maxX;
  if(state.camera.y > maxY) state.camera.y = maxY;
}

init();

})();