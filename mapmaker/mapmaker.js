// ============================================================
// mapmaker.js — Map Maker asosiy logikasi
// Let For Dead
// ============================================================
(function(){
'use strict';

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

  tool: 'brush',
  selectedTile: 2,

  camera: { x: 0, y: 0 },
  zoom: 1.0,
  minZoom: 0.25,
  maxZoom: 4.0,
  gridVisible: true,
  showInvisible: true,

  isPainting: false,
  paintTile: 2,
  lineStart: null,
  rectStart: null,

  panning: false,
  panButton: 0,
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
    settings: JSON.parse(JSON.stringify(state.settings))
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

  for(var y = startY; y < endY; y++){
    for(var x = startX; x < endX; x++){
      var tileId = state.data[y][x];
      var tile = TILES[tileId];
      if(!tile) continue;
      var sx = x * cs - state.camera.x;
      var sy = y * cs - state.camera.y;

      // Invisible tiles — faqat mapmakerda chiziladi
      if(tile.invisible){
        if(!state.showInvisible) continue;
        // Yashirin — chizilgan holda "зрение" bilan
        ctx.fillStyle = tile.color;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(sx, sy, cs, cs);
        ctx.globalAlpha = 1;

        // Ramka
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

  // Map border
  ctx.strokeStyle = '#a32f22';
  ctx.lineWidth = 2;
  ctx.strokeRect(-state.camera.x, -state.camera.y, state.mapW * cs, state.mapH * cs);

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

  // Icon font (kichik)
  if(t.icon){
    c.font = 'bold ' + (cs * 0.5) + 'px monospace';
    c.fillStyle = '#fff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(t.icon, cx, cy + 1);
  }

  // Keyed — E harfi
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

  // Trigger — qizil
  if(t.trigger){
    c.fillStyle = '#e0523c';
    c.beginPath();
    c.arc(cx, cy, cs * 0.25, 0, Math.PI * 2);
    c.fill();
  }

  // Player spawn — P1, P2, P3, P4
  if(t.playerSpawn){
    c.fillStyle = '#fff';
    c.font = 'bold ' + (cs * 0.4) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('P' + (t.playerIndex + 1), cx, cy + 1);
  }

  // Zombie spawn
  if(t.zombieSpawn && !t.tankSpawn){
    c.fillStyle = '#fff';
    c.font = 'bold ' + (cs * 0.4) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('Z', cx, cy + 1);
  }

  // Tank spawn
  if(t.tankSpawn){
    c.fillStyle = '#fff';
    c.font = 'bold ' + (cs * 0.35) + 'px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('T', cx, cy + 1);
  }

  // Transport
  if(t.transport){
    var tt = TRANSPORT_TYPES[t.transportType || 'helicopter'];
    c.font = 'bold ' + (cs * 0.5) + 'px monospace';
    c.fillStyle = '#fff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(tt ? tt.icon : '🚁', cx, cy + 1);
  }

  // Sirened car — blinking
  if(tileId === 26){
    var time = performance.now() / 200;
    var blink = Math.sin(time) > 0;
    c.fillStyle = '#3a3a3a';
    c.fillRect(sx + cs*0.1, sy + cs*0.3, cs*0.8, cs*0.5);
    c.fillStyle = blink ? '#ffe14a' : '#6a5a1a';
    c.fillRect(sx + cs*0.2, sy + cs*0.15, cs*0.2, cs*0.15);
    c.fillStyle = blink ? '#6a5a1a' : '#ffe14a';
    c.fillRect(sx + cs*0.6, sy + cs*0.15, cs*0.2, cs*0.15);
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
// PALETTE — kategoriyalar bilan
// ============================================================
function buildPalette(){
  palette.innerHTML = '';

  var sections = [
    {
      title: 'Terrain',
      icon: '🟫',
      ids: [0, 1, 5, 7, 11, 12, 4, 23, 3, 6]
    },
    {
      title: 'Walls',
      icon: '🧱',
      ids: [2, 8, 9, 10, 21, 22, 31, 32]
    },
    {
      title: 'Player Spawns',
      icon: '👤',
      ids: [13, 14, 15, 33]
    },
    {
      title: 'Zombie Spawns',
      icon: '🧟',
      ids: [16, 34, 35, 36]
    },
    {
      title: 'Pickups',
      icon: '🎁',
      ids: [17, 18, 30, 37, 38]
    },
    {
      title: 'Keyed (E)',
      icon: '🔑',
      ids: [19, 24, 28, 40, 41, 42, 43, 39]
    },
    {
      title: 'Triggers',
      icon: '💥',
      ids: [26, 44, 45, 27]
    },
    {
      title: 'Transport',
      icon: '🚁',
      ids: [20, 46, 47, 48]
    },
    {
      title: 'Objectives',
      icon: '🎯',
      ids: [25]
    },
    {
      title: 'Decor',
      icon: '🌳',
      ids: [49, 50, 51]
    }
  ];

  sections.forEach(function(sec){
    var h = document.createElement('div');
    h.className = 'palette-section';
    h.innerHTML = '<span>' + sec.icon + ' ' + sec.title + '</span>' +
                  '<span class="badge">' + sec.ids.length + '</span>';
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
    if(tile.invisible) info += ' [INVISIBLE]';
    statusInfo.textContent = info;
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
// KEYBOARD
// ============================================================
window.addEventListener('keydown', function(e){
  var k = e.key ? e.key.toLowerCase() : '';

  if(e.ctrlKey && k === 'z' && !e.shiftKey){ e.preventDefault(); undo(); return; }
  if((e.ctrlKey && e.shiftKey && k === 'z') || (e.ctrlKey && k === 'y')){ e.preventDefault(); redo(); return; }
  if(e.ctrlKey && k === 's'){ e.preventDefault(); saveMapFile(); return; }
  if(e.ctrlKey && k === 'o'){ e.preventDefault(); openLoadModal(); return; }
  if(e.ctrlKey && k === 'n'){ e.preventDefault(); openNewModal(); return; }

  if((k === 'delete' || k === 'backspace') && state.hoverCell.x >= 0){
    e.preventDefault();
    saveHistory();
    paintCell(state.hoverCell.x, state.hoverCell.y, 0);
    render();
    return;
  }

  if(k === 'escape'){
    state.lineStart = null;
    state.rectStart = null;
    document.querySelectorAll('.modal-bg').forEach(function(m){ m.classList.remove('show'); });
    render();
    return;
  }

  if(k === 'g' && !e.ctrlKey){ state.gridVisible = !state.gridVisible; render(); return; }
  if(k === 'h' && !e.ctrlKey){ state.showInvisible = !state.showInvisible; render(); return; }

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
// SETTINGS INPUTS
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
    showToast('Transport: ' + TRANSPORT_TYPES[selTransport.value].name);
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

var btnCallPlane = document.getElementById('btnCallPlane');
if(btnCallPlane){
  btnCallPlane.addEventListener('click', function(){
    showToast('✈️ Attack plane test in game');
  });
}

// ============================================================
// SETTINGS PANEL TOGGLE (mobile)
// ============================================================
var btnToggle = document.getElementById('btnToggleSettings');
var settingsPanel = document.getElementById('settingsPanel');
var btnClose = document.getElementById('btnCloseSettings');

if(btnToggle && settingsPanel){
  function checkScreen(){
    if(window.innerWidth <= 900){
      btnToggle.style.display = 'flex';
    } else {
      btnToggle.style.display = 'none';
      settingsPanel.classList.remove('open');
    }
  }
  checkScreen();
  window.addEventListener('resize', checkScreen);

  btnToggle.addEventListener('click', function(){
    settingsPanel.classList.toggle('open');
  });
}

if(btnClose && settingsPanel){
  btnClose.addEventListener('click', function(){
    settingsPanel.classList.remove('open');
  });
}

// ============================================================
// NEW MAP
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

// ============================================================
// SAVE / LOAD / EXPORT
// ============================================================
function serializeMap(){
  return window.MapData.serialize(
    { width: state.mapW, height: state.mapH, tiles: state.data },
    state.settings
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

    if(data.settings){
      state.settings = data.settings;
      // Update UI
      var uis = [
        ['sldHeliTime', 'numHeliTime', 'heliTime'],
        ['sldZombieRate', 'numZombieRate', 'zombieRate'],
        ['sldTankHp', 'numTankHp', 'tankHp'],
        ['sldHordeCount', 'numHordeCount', 'hordeCount']
      ];
      uis.forEach(function(u){
        var sl = document.getElementById(u[0]);
        var nu = document.getElementById(u[1]);
        if(sl) sl.value = state.settings[u[2]];
        if(nu) nu.value = state.settings[u[2]];
      });
      if(selWeapon) selWeapon.value = state.settings.startWeapon || 'uzi';
      if(selDiff) selDiff.value = state.settings.difficulty || 1;
      if(selTransport) selTransport.value = state.settings.transportType || 'helicopter';
      if(txtMapName) txtMapName.value = state.settings.mapName || 'Untitled Map';
      if(txtMapAuthor) txtMapAuthor.value = state.settings.mapAuthor || 'Anonymous';
    }

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
// INIT
// ============================================================
function init(){
  buildPalette();
  setTool('brush');
  selectTile(2);
  createMap(DEFAULT_W, DEFAULT_H);

  // Default: tashqi devorlar + pol
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
  // Player spawn markazda
  state.data[Math.floor(state.mapH / 2)][Math.floor(state.mapW / 2)] = 13;

  render();
  console.log('[MapMaker] Ready — ' + DEFAULT_W + 'x' + DEFAULT_H);
}

init();

})();