// ============================================================
// modmaker.js — Mod Maker
// Let For Dead
// ============================================================
(function(){
'use strict';

var GRID_SIZE = 16;
var DEFAULT_ZOOM = 20;
var MIN_ZOOM = 8;
var MAX_ZOOM = 60;

// ============================================================
// MATERIALS
// ============================================================
var MATERIALS = {
  skin: [
    { color: '#5c6e4f', name: 'Zombie Green' },
    { color: '#33402b', name: 'Dark Green' },
    { color: '#8a5a3c', name: 'Runner Brown' },
    { color: '#4f3320', name: 'Dark Brown' },
    { color: '#4a3f55', name: 'Brute Purple' },
    { color: '#241f2c', name: 'Dark Purple' },
    { color: '#a05a5a', name: 'Witch Red' },
    { color: '#4a1a1a', name: 'Dark Red' },
    { color: '#c9bfa8', name: 'Skin Light' },
    { color: '#8a7a6a', name: 'Skin Medium' },
    { color: '#5a4a3a', name: 'Skin Dark' },
    { color: '#a8977f', name: 'Skin Pale' }
  ],
  metal: [
    { color: '#3a3a4a', name: 'Metal Dark' },
    { color: '#5a5a6a', name: 'Metal Mid' },
    { color: '#8a8a9a', name: 'Metal Light' },
    { color: '#2c2c2c', name: 'Gun Black' },
    { color: '#4a4a4a', name: 'Gun Grey' },
    { color: '#6a6a6a', name: 'Steel' },
    { color: '#8a6a3a', name: 'Brass' },
    { color: '#c98a2e', name: 'Gold' },
    { color: '#a09a8a', name: 'Aluminum' },
    { color: '#3a3a3a', name: 'Chrome Dark' }
  ],
  wood: [
    { color: '#4a3520', name: 'Wood Dark' },
    { color: '#6a4a28', name: 'Wood Mid' },
    { color: '#8a6a3a', name: 'Wood Light' },
    { color: '#a87a3a', name: 'Wood Bright' },
    { color: '#2c1a0a', name: 'Wood Charcoal' }
  ],
  cloth: [
    { color: '#39506b', name: 'Player Blue' },
    { color: '#7ad44a', name: 'Survivor Green' },
    { color: '#d4a44a', name: 'Coach Gold' },
    { color: '#d44a7a', name: 'Rochelle Pink' },
    { color: '#4a8ed4', name: 'Ellis Blue' },
    { color: '#8a4a2a', name: 'Leather Brown' },
    { color: '#2a2a2a', name: 'Black Cloth' },
    { color: '#e0d8c0', name: 'White Cloth' }
  ],
  detail: [
    { color: '#e0523c', name: 'Blood Hot' },
    { color: '#a32f22', name: 'Blood Dark' },
    { color: '#7fbf52', name: 'Toxic' },
    { color: '#f0d98a', name: 'Bullet Yellow' },
    { color: '#c94a3a', name: 'Warning Red' },
    { color: '#7fae52', name: 'Toxic Spit' },
    { color: '#8a7a90', name: 'Wall Purple' },
    { color: '#e4a83a', name: 'Sirened Car' },
    { color: '#f0623c', name: 'Exit Orange' },
    { color: '#ffffff', name: 'White' },
    { color: '#000000', name: 'Black' }
  ]
};

// ============================================================
// STATE
// ============================================================
var state = {
  currentTab: 'zombies',
  currentMod: null,

  pixels: [],
  selectedPart: null,
  partMarkers: {},

  tool: 'brush',
  currentColor: '#5c6e4f',
  currentMaterialCategory: 'all',

  zoom: DEFAULT_ZOOM,
  offsetX: 0,
  offsetY: 0,
  gridVisible: true,

  lineStart: null,
  rectStart: null,

  history: [],
  historyIndex: -1,

  hoverPixel: null,

  // Custom sounds (dataURL)
  customSounds: {},
  soundPreviewAudio: null,

  // Pan
  panning: false,
  panStart: { x: 0, y: 0 },
  panOffset: { x: 0, y: 0 }
};

// ============================================================
// DOM
// ============================================================
var canvas = document.getElementById('modCanvas');
var ctx = canvas.getContext('2d');
var gridCanvas = document.getElementById('gridOverlay');
var gridCtx = gridCanvas.getContext('2d');
var canvasWrap = document.getElementById('canvas-wrap');
var pixelInfo = document.getElementById('pixelInfo');

var zombieList = document.getElementById('zombieList');
var weaponList = document.getElementById('weaponList');
var paletteColors = document.getElementById('paletteColors');

var zombieProps = document.getElementById('zombieProps');
var weaponProps = document.getElementById('weaponProps');
var partsPanel = document.getElementById('partsPanel');
var testPanel = document.getElementById('testPanel');
var sniperFields = document.getElementById('sniperFields');

// ============================================================
// TOAST
// ============================================================
var toastTimeout = null;
function showToast(msg){
  var el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(function(){ el.classList.remove('show'); }, 1800);
}

// ============================================================
// CANVAS
// ============================================================
function resizeCanvas(){
  var w = canvasWrap.clientWidth;
  var h = canvasWrap.clientHeight;
  canvas.width = w; canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  gridCanvas.width = w; gridCanvas.height = h;
  gridCanvas.style.width = w + 'px';
  gridCanvas.style.height = h + 'px';

  if(state.offsetX === 0 && state.offsetY === 0){
    state.offsetX = (w - GRID_SIZE * state.zoom) / 2;
    state.offsetY = (h - GRID_SIZE * state.zoom) / 2;
  }
}

window.addEventListener('resize', function(){
  resizeCanvas();
  render();
});

function initPixels(){
  state.pixels = [];
  for(var y = 0; y < GRID_SIZE; y++){
    var row = [];
    for(var x = 0; x < GRID_SIZE; x++) row.push(null);
    state.pixels.push(row);
  }
  state.partMarkers = {};
}

// ============================================================
// RENDER
// ============================================================
function render(){
  var w = canvas.width, h = canvas.height;
  var cs = state.zoom;

  ctx.fillStyle = '#0d0b0a';
  ctx.fillRect(0, 0, w, h);

  for(var y = 0; y < GRID_SIZE; y++){
    for(var x = 0; x < GRID_SIZE; x++){
      var color = state.pixels[y][x];
      var sx = state.offsetX + x * cs;
      var sy = state.offsetY + y * cs;

      if(color){
        ctx.fillStyle = color;
        ctx.fillRect(sx, sy, cs, cs);
      } else {
        ctx.fillStyle = ((x + y) % 2 === 0) ? '#0d0b0a' : '#131010';
        ctx.fillRect(sx, sy, cs, cs);
      }
    }
  }

  // Part markers
  for(var key in state.partMarkers){
    var mk = state.partMarkers[key];
    var mx = state.offsetX + mk.x * cs + cs / 2;
    var my = state.offsetY + mk.y * cs + cs / 2;

    ctx.save();
    ctx.strokeStyle = '#e0523c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx, my, cs * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(mx - cs*0.22, my - cs*0.22, cs*0.44, cs*0.44);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + (cs * 0.55) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(key.charAt(0).toUpperCase(), mx, my + 1);
    ctx.restore();
  }

  // Line preview
  if(state.lineStart && state.hoverPixel){
    var lx = state.offsetX + state.lineStart.x * cs + cs / 2;
    var ly = state.offsetY + state.lineStart.y * cs + cs / 2;
    var ex = state.offsetX + state.hoverPixel.x * cs + cs / 2;
    var ey = state.offsetY + state.hoverPixel.y * cs + cs / 2;

    ctx.save();
    ctx.strokeStyle = 'rgba(224,82,60,0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Rect preview
  if(state.rectStart && state.hoverPixel){
    var minX = Math.min(state.rectStart.x, state.hoverPixel.x);
    var maxX = Math.max(state.rectStart.x, state.hoverPixel.x);
    var minY = Math.min(state.rectStart.y, state.hoverPixel.y);
    var maxY = Math.max(state.rectStart.y, state.hoverPixel.y);

    ctx.save();
    ctx.strokeStyle = 'rgba(224,82,60,0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(
      state.offsetX + minX * cs,
      state.offsetY + minY * cs,
      (maxX - minX + 1) * cs,
      (maxY - minY + 1) * cs
    );
    ctx.setLineDash([]);
    ctx.restore();
  }

  renderGrid(cs);
}

function renderGrid(cs){
  gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  if(!state.gridVisible) return;

  gridCtx.strokeStyle = 'rgba(131,123,109,0.3)';
  gridCtx.lineWidth = 1;

  for(var x = 0; x <= GRID_SIZE; x++){
    var sx = state.offsetX + x * cs;
    gridCtx.beginPath();
    gridCtx.moveTo(sx, state.offsetY);
    gridCtx.lineTo(sx, state.offsetY + GRID_SIZE * cs);
    gridCtx.stroke();
  }
  for(var y = 0; y <= GRID_SIZE; y++){
    var sy = state.offsetY + y * cs;
    gridCtx.beginPath();
    gridCtx.moveTo(state.offsetX, sy);
    gridCtx.lineTo(state.offsetX + GRID_SIZE * cs, sy);
    gridCtx.stroke();
  }

  gridCtx.strokeStyle = '#a32f22';
  gridCtx.lineWidth = 2;
  gridCtx.strokeRect(
    state.offsetX, state.offsetY,
    GRID_SIZE * cs, GRID_SIZE * cs
  );
}

// ============================================================
// COORDINATES
// ============================================================
function screenToPixel(sx, sy){
  var cs = state.zoom;
  var x = Math.floor((sx - state.offsetX) / cs);
  var y = Math.floor((sy - state.offsetY) / cs);
  if(x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null;
  return { x: x, y: y };
}

// ============================================================
// MOUSE
// ============================================================
var mouse = { down: false, button: 0, lastPixel: null };
var historySaved = false;

canvas.addEventListener('mousedown', function(e){
  var rect = canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  var my = e.clientY - rect.top;

  // === RMB yoki MMB → PAN ===
  if(e.button === 2 || e.button === 1){
    e.preventDefault();
    state.panning = true;
    state.panButton = e.button;
    state.panStart.x = mx;
    state.panStart.y = my;
    state.panOffset.x = state.offsetX;
    state.panOffset.y = state.offsetY;
    canvas.style.cursor = 'grabbing';
    return;
  }

  // LMB
  if(e.button === 0){
    var p = screenToPixel(mx, my);
    if(!p) return;

    // Shift+LMB → Line tool
    if(e.shiftKey){
      state.tool = 'line';
      setActiveTool(document.getElementById('toolLine'));
    }

    mouse.down = true;
    mouse.button = e.button;
    historySaved = false;

    // Line
    if(state.tool === 'line'){
      if(!state.lineStart){
        state.lineStart = p;
        render();
      } else {
        saveHistory();
        paintLine(state.lineStart.x, state.lineStart.y, p.x, p.y);
        state.lineStart = null;
        render();
      }
      return;
    }

    // Rect
    if(state.tool === 'rect'){
      if(!state.rectStart){
        state.rectStart = p;
        render();
      } else {
        saveHistory();
        paintRect(state.rectStart.x, state.rectStart.y, p.x, p.y);
        state.rectStart = null;
        render();
      }
      return;
    }

    // Fill
    if(state.tool === 'fill'){
      saveHistory();
      floodFill(p.x, p.y, state.currentColor);
      render();
      return;
    }

    // Picker
    if(state.tool === 'picker'){
      var c = state.pixels[p.y][p.x];
      if(c){
        selectColor(c);
        showToast('Picked: ' + c);
      }
      return;
    }

    // Part marker
    if(state.selectedPart){
      state.partMarkers[state.selectedPart] = { x: p.x, y: p.y };
      state.selectedPart = null;
      updatePartsList();
      render();
      return;
    }

    // Brush
    saveHistory();
    state.pixels[p.y][p.x] = state.currentColor;
    mouse.lastPixel = p;
    render();
  }
});

canvas.addEventListener('mousemove', function(e){
  var rect = canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  var my = e.clientY - rect.top;

  // Pan
  if(state.panning){
    state.offsetX = state.panOffset.x + (mx - state.panStart.x);
    state.offsetY = state.panOffset.y + (my - state.panStart.y);
    render();
    return;
  }

  var p = screenToPixel(mx, my);
  state.hoverPixel = p;

  if(p){
    if(pixelInfo) pixelInfo.textContent = p.x + ', ' + p.y;

    if(mouse.down && !state.selectedPart){
      if(!historySaved){ saveHistory(); historySaved = true; }
      if(mouse.lastPixel){
        paintLine(mouse.lastPixel.x, mouse.lastPixel.y, p.x, p.y);
      } else {
        state.pixels[p.y][p.x] = state.currentColor;
      }
      mouse.lastPixel = p;
      render();
    } else if(state.lineStart || state.rectStart){
      render();
    }
  } else {
    if(pixelInfo) pixelInfo.textContent = '—';
  }
});

window.addEventListener('mouseup', function(){
  if(state.panning){
    state.panning = false;
    state.panButton = 0;
    canvas.style.cursor = 'crosshair';
  }
  mouse.down = false;
  mouse.lastPixel = null;
});

window.addEventListener('blur', function(){
  state.panning = false;
  mouse.down = false;
});

canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); });

canvas.addEventListener('wheel', function(e){
  e.preventDefault();
  var oldZoom = state.zoom;
  var factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  var newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.zoom * factor));
  if(newZoom === oldZoom) return;

  var rect = canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  var my = e.clientY - rect.top;
  var px = (mx - state.offsetX) / oldZoom;
  var py = (my - state.offsetY) / oldZoom;

  state.zoom = newZoom;
  state.offsetX = mx - px * newZoom;
  state.offsetY = my - py * newZoom;
  render();
}, { passive: false });

// ============================================================
// PAINT
// ============================================================
function paintPixel(x, y, color){
  if(x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
  state.pixels[y][x] = (color !== undefined) ? color : state.currentColor;
}

function paintLine(x0, y0, x1, y1){
  var dx = Math.abs(x1 - x0);
  var dy = Math.abs(y1 - y0);
  var sx = x0 < x1 ? 1 : -1;
  var sy = y0 < y1 ? 1 : -1;
  var err = dx - dy;
  while(true){
    paintPixel(x0, y0);
    if(x0 === x1 && y0 === y1) break;
    var e2 = 2 * err;
    if(e2 > -dy){ err -= dy; x0 += sx; }
    if(e2 < dx){ err += dx; y0 += sy; }
  }
}

function paintRect(x0, y0, x1, y1){
  var minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
  var minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
  for(var y = minY; y <= maxY; y++){
    for(var x = minX; x <= maxX; x++){
      paintPixel(x, y);
    }
  }
}

function floodFill(x, y, newColor){
  if(x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
  var target = state.pixels[y][x];
  if(target === newColor) return;

  var stack = [[x, y]];
  var visited = {};

  while(stack.length){
    var cell = stack.pop();
    var cx = cell[0], cy = cell[1];
    var key = cx + ',' + cy;
    if(visited[key]) continue;
    visited[key] = true;
    if(cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE) continue;
    if(state.pixels[cy][cx] !== target) continue;

    state.pixels[cy][cx] = newColor;
    stack.push([cx + 1, cy]);
    stack.push([cx - 1, cy]);
    stack.push([cx, cy + 1]);
    stack.push([cx, cy - 1]);
  }
}

// ============================================================
// HISTORY
// ============================================================
function saveHistory(){
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push({
    pixels: state.pixels.map(function(r){ return r.slice(); }),
    markers: JSON.parse(JSON.stringify(state.partMarkers))
  });
  if(state.history.length > 50) state.history.shift();
  state.historyIndex = state.history.length - 1;
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
  var s = state.history[state.historyIndex];
  if(!s) return;
  state.pixels = s.pixels.map(function(r){ return r.slice(); });
  state.partMarkers = JSON.parse(JSON.stringify(s.markers));
  updatePartsList();
  render();
}

// ============================================================
// PALETTE
// ============================================================
function buildPalette(category){
  paletteColors.innerHTML = '';
  var colors = [];

  if(category === 'all'){
    for(var cat in MATERIALS){
      colors = colors.concat(MATERIALS[cat]);
    }
  } else if(MATERIALS[category]){
    colors = MATERIALS[category];
  }

  colors.forEach(function(m){
    var btn = document.createElement('div');
    btn.className = 'pcolor';
    btn.style.background = m.color;
    btn.title = m.name + ' — ' + m.color;
    btn.setAttribute('data-color', m.color);
    if(m.color === state.currentColor) btn.classList.add('active');
    btn.addEventListener('click', function(){ selectColor(m.color); });
    paletteColors.appendChild(btn);
  });

  var badge = document.getElementById('paletteBadge');
  if(badge) badge.textContent = colors.length;
}

function selectColor(color){
  state.currentColor = color;
  var btns = paletteColors.querySelectorAll('.pcolor');
  for(var i = 0; i < btns.length; i++){
    btns[i].classList.toggle('active', btns[i].getAttribute('data-color') === color);
  }
  var cc = document.getElementById('customColor');
  if(cc) cc.value = color;

  var info = state.currentTab === 'zombies' ? 'z_color' : 'w_color';
  var input = document.getElementById(info);
  if(input) input.value = color;
}

// ============================================================
// TABS
// ============================================================
function switchTab(tab){
  state.currentTab = tab;
  var tabs = document.querySelectorAll('.tab-btn');
  for(var i = 0; i < tabs.length; i++){
    tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === tab);
  }

  if(tab === 'zombies'){
    zombieList.style.display = 'block';
    weaponList.style.display = 'none';
    zombieProps.style.display = 'block';
    weaponProps.style.display = 'none';
    partsPanel.style.display = 'none';
  } else {
    zombieList.style.display = 'none';
    weaponList.style.display = 'block';
    zombieProps.style.display = 'none';
    weaponProps.style.display = 'block';
    partsPanel.style.display = 'block';
  }
}

// ============================================================
// LISTS
// ============================================================
function buildZombieList(){
  zombieList.innerHTML = '';
  Object.keys(window.ModData.ZOMBIE_DEFAULTS).forEach(function(id){
    var z = window.ModData.ZOMBIE_DEFAULTS[id];
    var item = document.createElement('div');
    item.className = 'mod-item';
    item.setAttribute('data-id', id);
    item.innerHTML =
      '<div class="mod-color" style="background:' + z.color + '"></div>' +
      '<div class="mod-info">' +
        '<div class="mod-name">' + z.name + '</div>' +
        '<div class="mod-meta">HP ' + z.hp + ' · SPD ' + z.speed + '</div>' +
      '</div>';
    item.addEventListener('click', function(){ selectZombie(id); });
    zombieList.appendChild(item);
  });
}

function buildWeaponList(){
  weaponList.innerHTML = '';
  Object.keys(window.ModData.WEAPON_DEFAULTS).forEach(function(id){
    var w = window.ModData.WEAPON_DEFAULTS[id];
    var item = document.createElement('div');
    item.className = 'mod-item';
    item.setAttribute('data-id', id);
    var sub = w.subtype === 'sniper' ? '🎯 sniper' : (w.kind || 'gun');
    item.innerHTML =
      '<div class="mod-color" style="background:' + w.color + '"></div>' +
      '<div class="mod-info">' +
        '<div class="mod-name">' + w.name + '</div>' +
        '<div class="mod-meta">DMG ' + w.damage + ' · ' + sub + '</div>' +
      '</div>';
    item.addEventListener('click', function(){ selectWeapon(id); });
    weaponList.appendChild(item);
  });
}

function selectZombie(id){
  var z = window.ModData.ZOMBIE_DEFAULTS[id];
  if(!z) return;
  state.currentMod = { type: 'zombie', id: id, data: JSON.parse(JSON.stringify(z)) };

  var items = zombieList.querySelectorAll('.mod-item');
  for(var i = 0; i < items.length; i++){
    items[i].classList.toggle('active', items[i].getAttribute('data-id') === id);
  }

  loadZombieProps(z);
  loadPixelsFromColor(z.color);
  testPanel.style.display = 'block';
  renderTestPreview();
}

function selectWeapon(id){
  var w = window.ModData.WEAPON_DEFAULTS[id];
  if(!w) return;
  state.currentMod = { type: 'weapon', id: id, data: JSON.parse(JSON.stringify(w)) };

  var items = weaponList.querySelectorAll('.mod-item');
  for(var i = 0; i < items.length; i++){
    items[i].classList.toggle('active', items[i].getAttribute('data-id') === id);
  }

  loadWeaponProps(w);
  loadPixelsFromColor(w.color);
  testPanel.style.display = 'block';
  renderTestPreview();
}

function loadPixelsFromColor(color){
  initPixels();
  for(var y = 5; y < 11; y++){
    for(var x = 5; x < 11; x++){
      state.pixels[y][x] = color;
    }
  }
  state.history = [];
  state.historyIndex = -1;
  saveHistory();
  render();
}

// ============================================================
// HELPERS
// ============================================================
function setVal(id, v){ var el = document.getElementById(id); if(el) el.value = v; }
function setRangeVal(id, v){
  var el = document.getElementById(id);
  var num = document.getElementById(id + '_num');
  if(el) el.value = v;
  if(num) num.value = v;
}
function setCheck(id, v){ var el = document.getElementById(id); if(el) el.checked = v; }

// ============================================================
// LOAD PROPS
// ============================================================
function loadZombieProps(z){
  setVal('z_name', z.name || '');
  setVal('z_behavior', z.behavior || 'normal');
  setRangeVal('z_hp', z.hp || 50);
  setRangeVal('z_speed', z.speed || 1.5);
  setRangeVal('z_dmg', z.damage || 10);
  setRangeVal('z_radius', z.radius || 15);
  setRangeVal('z_score', z.score || 10);
  setRangeVal('z_push', z.pushDist || 20);
  setVal('z_color', z.color || '#5c6e4f');
  setVal('z_dark', z.dark || '#33402b');
  setCheck('z_big', !!z.big);
  selectColor(z.color || '#5c6e4f');
}

function loadWeaponProps(w){
  setVal('w_name', w.name || '');
  setVal('w_kind', w.kind || 'gun');
  setVal('w_slot', w.slot || 1);
  setRangeVal('w_dmg', w.damage || 25);
  setRangeVal('w_cooldown', w.cooldown || 12);
  setRangeVal('w_bspeed', w.bulletSpeed || 12);
  setRangeVal('w_spread', w.spread || 0.05);
  setRangeVal('w_pellets', w.pellets || 1);
  setRangeVal('w_mag', w.magSize || 15);
  setRangeVal('w_reload', w.reloadTime || 60);
  setRangeVal('w_ammoMax', w.ammoMax || 200);
  setVal('w_sound', w.sound || 'pistol');
  setVal('w_reloadSound', w.reloadSound || '');
  setVal('w_color', w.color || '#c98a2e');
  setCheck('w_infinite', !!w.infinite);

  // Sniper
  var isSniper = w.subtype === 'sniper';
  sniperFields.style.display = isSniper ? 'block' : 'none';
  if(isSniper){
    setRangeVal('w_scopeZoom', w.scopeZoom || 1.5);
    setRangeVal('w_pierce', w.pierce || 1);
    setRangeVal('w_knockback', w.knockback || 0);
    setRangeVal('w_screenShake', w.screenShake || 0);
  }

  selectColor(w.color || '#c98a2e');
  checkSoundUploads();
}

// ============================================================
// BINDINGS
// ============================================================
function bindRange(sliderId, numId, callback){
  var s = document.getElementById(sliderId);
  var n = document.getElementById(numId);
  if(!s || !n) return;
  s.addEventListener('input', function(){ n.value = s.value; if(callback) callback(s.value); });
  n.addEventListener('input', function(){ s.value = n.value; if(callback) callback(n.value); });
}

// Zombie bindings
bindRange('z_hp', 'z_hp_num', function(v){
  if(state.currentMod) state.currentMod.data.hp = parseFloat(v);
  updateModMeta();
});
bindRange('z_speed', 'z_speed_num', function(v){
  if(state.currentMod) state.currentMod.data.speed = parseFloat(v);
  updateModMeta();
});
bindRange('z_dmg', 'z_dmg_num', function(v){
  if(state.currentMod) state.currentMod.data.damage = parseFloat(v);
});
bindRange('z_radius', 'z_radius_num', function(v){
  if(state.currentMod) state.currentMod.data.radius = parseFloat(v);
});
bindRange('z_score', 'z_score_num', function(v){
  if(state.currentMod) state.currentMod.data.score = parseFloat(v);
});
bindRange('z_push', 'z_push_num', function(v){
  if(state.currentMod) state.currentMod.data.pushDist = parseFloat(v);
});

var zName = document.getElementById('z_name');
if(zName) zName.addEventListener('input', function(){
  if(state.currentMod) state.currentMod.data.name = zName.value;
  updateModMeta();
});

var zBehav = document.getElementById('z_behavior');
if(zBehav){
  window.ModData.ZOMBIE_BEHAVIORS.forEach(function(b){
    var opt = document.createElement('option');
    opt.value = b.id; opt.textContent = b.name;
    zBehav.appendChild(opt);
  });
  zBehav.addEventListener('change', function(){
    if(state.currentMod) state.currentMod.data.behavior = zBehav.value;
  });
}

var zColor = document.getElementById('z_color');
if(zColor) zColor.addEventListener('input', function(){
  if(state.currentMod){
    state.currentMod.data.color = zColor.value;
    selectColor(zColor.value);
    updateModMeta();
  }
});
var zDark = document.getElementById('z_dark');
if(zDark) zDark.addEventListener('input', function(){
  if(state.currentMod) state.currentMod.data.dark = zDark.value;
});
var zBig = document.getElementById('z_big');
if(zBig) zBig.addEventListener('change', function(){
  if(state.currentMod) state.currentMod.data.big = zBig.checked;
});

// Weapon bindings
bindRange('w_dmg', 'w_dmg_num', function(v){
  if(state.currentMod) state.currentMod.data.damage = parseFloat(v);
});
bindRange('w_cooldown', 'w_cooldown_num', function(v){
  if(state.currentMod) state.currentMod.data.cooldown = parseFloat(v);
});
bindRange('w_bspeed', 'w_bspeed_num', function(v){
  if(state.currentMod) state.currentMod.data.bulletSpeed = parseFloat(v);
});
bindRange('w_spread', 'w_spread_num', function(v){
  if(state.currentMod) state.currentMod.data.spread = parseFloat(v);
});
bindRange('w_pellets', 'w_pellets_num', function(v){
  if(state.currentMod) state.currentMod.data.pellets = parseInt(v, 10);
});
bindRange('w_mag', 'w_mag_num', function(v){
  if(state.currentMod) state.currentMod.data.magSize = parseInt(v, 10);
});
bindRange('w_reload', 'w_reload_num', function(v){
  if(state.currentMod) state.currentMod.data.reloadTime = parseInt(v, 10);
});
bindRange('w_ammoMax', 'w_ammoMax_num', function(v){
  if(state.currentMod) state.currentMod.data.ammoMax = parseInt(v, 10);
});

// Sniper bindings
bindRange('w_scopeZoom', 'w_scopeZoom_num', function(v){
  if(state.currentMod) state.currentMod.data.scopeZoom = parseFloat(v);
});
bindRange('w_pierce', 'w_pierce_num', function(v){
  if(state.currentMod) state.currentMod.data.pierce = parseInt(v, 10);
});
bindRange('w_knockback', 'w_knockback_num', function(v){
  if(state.currentMod) state.currentMod.data.knockback = parseFloat(v);
});
bindRange('w_screenShake', 'w_screenShake_num', function(v){
  if(state.currentMod) state.currentMod.data.screenShake = parseFloat(v);
});

var wName = document.getElementById('w_name');
if(wName) wName.addEventListener('input', function(){
  if(state.currentMod) state.currentMod.data.name = wName.value;
  updateModMeta();
});

var wKind = document.getElementById('w_kind');
if(wKind){
  window.ModData.WEAPON_KINDS.forEach(function(k){
    var opt = document.createElement('option');
    opt.value = k.id; opt.textContent = k.name;
    wKind.appendChild(opt);
  });
  wKind.addEventListener('change', function(){
    if(state.currentMod){
      state.currentMod.data.kind = wKind.value;
      // Auto subtype
      if(wKind.value === 'sniper'){
        state.currentMod.data.subtype = 'sniper';
        sniperFields.style.display = 'block';
      } else {
        delete state.currentMod.data.subtype;
        sniperFields.style.display = 'none';
      }
    }
  });
}

var wSlot = document.getElementById('w_slot');
if(wSlot) wSlot.addEventListener('change', function(){
  if(state.currentMod) state.currentMod.data.slot = parseInt(wSlot.value, 10);
});

// Shoot sound
var wSound = document.getElementById('w_sound');
if(wSound){
  window.ModData.WEAPON_SOUNDS.forEach(function(s){
    var opt = document.createElement('option');
    opt.value = s.id; opt.textContent = s.name;
    wSound.appendChild(opt);
  });
  wSound.addEventListener('change', function(){
    if(state.currentMod) state.currentMod.data.sound = wSound.value;
    checkSoundUploads();
  });
}

// Reload sound
var wReload = document.getElementById('w_reloadSound');
if(wReload){
  window.ModData.WEAPON_RELOAD_SOUNDS.forEach(function(s){
    var opt = document.createElement('option');
    opt.value = s.id || '';
    opt.textContent = s.name;
    wReload.appendChild(opt);
  });
  wReload.addEventListener('change', function(){
    if(state.currentMod) state.currentMod.data.reloadSound = wReload.value || null;
    checkSoundUploads();
  });
}

function checkSoundUploads(){
  var shootWrap = document.getElementById('w_sound_upload_wrap');
  var reloadWrap = document.getElementById('w_reload_upload_wrap');
  if(shootWrap) shootWrap.style.display = (wSound.value === 'custom') ? 'block' : 'none';
  if(reloadWrap) reloadWrap.style.display = (wReload.value === 'custom') ? 'block' : 'none';
}

// Upload shoot sound
var wSoundFile = document.getElementById('w_sound_file');
if(wSoundFile){
  wSoundFile.addEventListener('change', function(e){
    var f = e.target.files[0];
    if(!f) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      state.customSounds.shoot = {
        name: f.name,
        data: ev.target.result
      };
      var info = document.getElementById('w_sound_info');
      if(info) info.textContent = f.name + ' (' + Math.round(f.size/1024) + ' KB)';
      if(state.currentMod){
        state.currentMod.data.customShoot = f.name;
      }
      showToast('Shoot sound uploaded');
    };
    reader.readAsDataURL(f);
  });
}

// Upload reload sound
var wReloadFile = document.getElementById('w_reload_file');
if(wReloadFile){
  wReloadFile.addEventListener('change', function(e){
    var f = e.target.files[0];
    if(!f) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      state.customSounds.reload = {
        name: f.name,
        data: ev.target.result
      };
      var info = document.getElementById('w_reload_info');
      if(info) info.textContent = f.name + ' (' + Math.round(f.size/1024) + ' KB)';
      if(state.currentMod){
        state.currentMod.data.customReload = f.name;
      }
      showToast('Reload sound uploaded');
    };
    reader.readAsDataURL(f);
  });
}

// Preview shoot sound
var wSoundPreview = document.getElementById('w_sound_preview');
if(wSoundPreview){
  wSoundPreview.addEventListener('click', function(){
    previewSound('shoot');
  });
}

// Preview reload sound
var wReloadPreview = document.getElementById('w_reload_preview');
if(wReloadPreview){
  wReloadPreview.addEventListener('click', function(){
    previewSound('reload');
  });
}

function previewSound(type){
  if(state.soundPreviewAudio){
    try{ state.soundPreviewAudio.pause(); }catch(e){}
    state.soundPreviewAudio = null;
  }

  var custom = state.customSounds[type];
  if(custom && custom.data){
    var a = new Audio(custom.data);
    a.volume = 0.7;
    a.play();
    state.soundPreviewAudio = a;
    showToast('▶ Playing custom');
  } else {
    // Synthetic preview
    try {
      var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = (type === 'shoot') ? 'square' : 'triangle';
      osc.frequency.value = (type === 'shoot') ? 200 : 400;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
      osc.stop(audioCtx.currentTime + 0.15);
    } catch(e){}
    showToast('▶ Synthetic preview');
  }
}

// Color input
var wColor = document.getElementById('w_color');
if(wColor) wColor.addEventListener('input', function(){
  if(state.currentMod){
    state.currentMod.data.color = wColor.value;
    selectColor(wColor.value);
    updateModMeta();
  }
});

var wInf = document.getElementById('w_infinite');
if(wInf) wInf.addEventListener('change', function(){
  if(state.currentMod) state.currentMod.data.infinite = wInf.checked;
});

// ============================================================
// PARTS
// ============================================================
function buildPartsList(){
  var list = document.getElementById('partsList');
  if(!list) return;
  list.innerHTML = '';

  window.ModData.WEAPON_PARTS.forEach(function(part){
    var btn = document.createElement('button');
    btn.className = 'part-btn';
    btn.setAttribute('data-part', part.id);
    btn.innerHTML = '<span class="part-icon">' + (part.icon || '·') + '</span>' + part.name;

    btn.addEventListener('click', function(){
      var btns = list.querySelectorAll('.part-btn');
      for(var i = 0; i < btns.length; i++) btns[i].classList.remove('active');

      if(state.selectedPart === part.id){
        state.selectedPart = null;
        document.getElementById('currentPartInfo').textContent = 'No part selected';
      } else {
        state.selectedPart = part.id;
        btn.classList.add('active');
        document.getElementById('currentPartInfo').textContent = 'Click canvas: ' + part.name;
      }
    });

    list.appendChild(btn);
  });

  var clearBtn = document.getElementById('btnClearParts');
  if(clearBtn){
    clearBtn.addEventListener('click', function(){
      state.partMarkers = {};
      updatePartsList();
      render();
      showToast('Parts cleared');
    });
  }
}

function updatePartsList(){
  var btns = document.querySelectorAll('.part-btn');
  for(var i = 0; i < btns.length; i++){
    var id = btns[i].getAttribute('data-part');
    btns[i].classList.toggle('marked', !!state.partMarkers[id]);
  }
  document.getElementById('currentPartInfo').textContent = 'No part selected';
}

// ============================================================
// META
// ============================================================
function updateModMeta(){
  if(!state.currentMod) return;
  var m = state.currentMod;
  var list = m.type === 'zombie' ? zombieList : weaponList;
  var items = list.querySelectorAll('.mod-item');
  for(var i = 0; i < items.length; i++){
    if(items[i].getAttribute('data-id') === m.id){
      var meta = items[i].querySelector('.mod-meta');
      if(m.type === 'zombie'){
        meta.textContent = 'HP ' + m.data.hp + ' · SPD ' + m.data.speed;
      } else {
        var sub = m.data.subtype === 'sniper' ? '🎯 sniper' : (m.data.kind || 'gun');
        meta.textContent = 'DMG ' + m.data.damage + ' · ' + sub;
      }
      break;
    }
  }
  renderTestPreview();
}

// ============================================================
// TEST PREVIEW
// ============================================================
function renderTestPreview(){
  var tc = document.getElementById('testCanvas');
  if(!tc) return;
  var tctx = tc.getContext('2d');
  var w = tc.width, h = tc.height;

  tctx.fillStyle = '#1c1815';
  tctx.fillRect(0, 0, w, h);

  if(!state.currentMod) return;
  var m = state.currentMod;

  if(m.type === 'zombie'){
    var cx = w / 2, cy = h / 2;
    var r = m.data.radius || 15;
    tctx.fillStyle = m.data.color || '#5c6e4f';
    tctx.beginPath(); tctx.arc(cx, cy, r, 0, Math.PI * 2); tctx.fill();
    tctx.fillStyle = m.data.dark || '#33402b';
    tctx.beginPath(); tctx.arc(cx, cy + r*0.2, r*0.7, 0, Math.PI * 2); tctx.fill();
    tctx.fillStyle = '#c94a3a';
    tctx.beginPath(); tctx.arc(cx - r*0.3, cy - r*0.15, 2.2, 0, Math.PI*2); tctx.fill();
    tctx.beginPath(); tctx.arc(cx + r*0.3, cy - r*0.15, 2.2, 0, Math.PI*2); tctx.fill();

    document.getElementById('testInfo').innerHTML =
      '<b>' + (m.data.name || 'Unnamed') + '</b><br>' +
      'HP: ' + m.data.hp + ' · Speed: ' + m.data.speed + '<br>' +
      'Damage: ' + m.data.damage + ' · Score: ' + m.data.score + '<br>' +
      'Behavior: ' + m.data.behavior;
  } else {
    var size = 10;
    var offsetX = (w - GRID_SIZE * size) / 2;
    var offsetY = (h - GRID_SIZE * size) / 2;

    for(var y = 0; y < GRID_SIZE; y++){
      for(var x = 0; x < GRID_SIZE; x++){
        var c = state.pixels[y][x];
        if(c){
          tctx.fillStyle = c;
          tctx.fillRect(offsetX + x * size, offsetY + y * size, size, size);
        }
      }
    }

    for(var key in state.partMarkers){
      var mk = state.partMarkers[key];
      var mx = offsetX + mk.x * size + size/2;
      var my = offsetY + mk.y * size + size/2;
      tctx.strokeStyle = '#e0523c';
      tctx.lineWidth = 2;
      tctx.beginPath(); tctx.arc(mx, my, size * 0.5, 0, Math.PI * 2); tctx.stroke();
      tctx.fillStyle = '#fff';
      tctx.font = 'bold ' + (size * 0.8) + 'px monospace';
      tctx.textAlign = 'center';
      tctx.textBaseline = 'middle';
      tctx.fillText(key.charAt(0).toUpperCase(), mx, my + 1);
    }

    var sub = m.data.subtype === 'sniper' ? ' · 🎯 SNIPER' : '';
    document.getElementById('testInfo').innerHTML =
      '<b>' + (m.data.name || 'Unnamed') + '</b>' + sub + '<br>' +
      'Damage: ' + m.data.damage + ' · Cooldown: ' + m.data.cooldown + '<br>' +
      'Mag: ' + m.data.magSize + ' · Reload: ' + m.data.reloadTime + '<br>' +
      'Sound: ' + (m.data.sound || '—') + '<br>' +
      'Kind: ' + m.data.kind;
  }
}

// ============================================================
// TOOLBAR
// ============================================================
function setTool(tool){
  state.tool = tool;
  state.lineStart = null;
  state.rectStart = null;
  var btns = document.querySelectorAll('.tool-btn[data-tool]');
  for(var i = 0; i < btns.length; i++){
    btns[i].classList.toggle('active', btns[i].getAttribute('data-tool') === tool);
  }
  render();
}

function setActiveTool(btn){
  var btns = document.querySelectorAll('.tool-btn[data-tool]');
  for(var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  if(btn) btn.classList.add('active');
}

function setupToolbar(){
  document.getElementById('toolBrush').addEventListener('click', function(){ setTool('brush'); });
  document.getElementById('toolEraser').addEventListener('click', function(){ setTool('eraser'); });
  document.getElementById('toolPicker').addEventListener('click', function(){ setTool('picker'); });
  document.getElementById('toolFill').addEventListener('click', function(){ setTool('fill'); });
  document.getElementById('toolLine').addEventListener('click', function(){ setTool('line'); });
  document.getElementById('toolRect').addEventListener('click', function(){ setTool('rect'); });

  document.getElementById('btnUndo').addEventListener('click', undo);
  document.getElementById('btnRedo').addEventListener('click', redo);

  document.getElementById('btnClear').addEventListener('click', function(){
    if(!confirm('Clear all pixels?')) return;
    initPixels();
    saveHistory();
    render();
    showToast('Cleared');
  });

  document.getElementById('btnTest').addEventListener('click', function(){
    testPanel.style.display = testPanel.style.display === 'none' ? 'block' : 'none';
    if(testPanel.style.display === 'block') renderTestPreview();
    this.classList.toggle('active', testPanel.style.display === 'block');
  });

  document.getElementById('btnGrid').addEventListener('click', function(){
    state.gridVisible = !state.gridVisible;
    this.classList.toggle('active', state.gridVisible);
    render();
  });
}

// ============================================================
// SHORTCUTS
// ============================================================
window.addEventListener('keydown', function(e){
  var k = e.key ? e.key.toLowerCase() : '';

  if(e.ctrlKey && k === 'z' && !e.shiftKey){ e.preventDefault(); undo(); return; }
  if((e.ctrlKey && e.shiftKey && k === 'z') || (e.ctrlKey && k === 'y')){ e.preventDefault(); redo(); return; }

  if(e.ctrlKey && (k === 'delete' || k === 'backspace')){
    e.preventDefault();
    if(confirm('Clear all pixels?')){
      initPixels();
      saveHistory();
      render();
    }
    return;
  }

  if(k === 'escape'){
    state.selectedPart = null;
    state.lineStart = null;
    state.rectStart = null;
    updatePartsList();
    document.querySelectorAll('.modal-bg').forEach(function(m){ m.classList.remove('show'); });
    render();
    return;
  }

  if((k === 'delete' || k === 'backspace') && state.hoverPixel){
    e.preventDefault();
    saveHistory();
    state.pixels[state.hoverPixel.y][state.hoverPixel.x] = null;
    render();
    return;
  }

  if(e.ctrlKey || e.altKey || e.metaKey) return;

  if(k === 'b'){ setTool('brush'); setActiveTool(document.getElementById('toolBrush')); }
  if(k === 'e'){ setTool('eraser'); setActiveTool(document.getElementById('toolEraser')); }
  if(k === 'i'){ setTool('picker'); setActiveTool(document.getElementById('toolPicker')); }
  if(k === 'f'){ setTool('fill'); setActiveTool(document.getElementById('toolFill')); }
  if(k === 'l'){ setTool('line'); setActiveTool(document.getElementById('toolLine')); }
  if(k === 'r'){ setTool('rect'); setActiveTool(document.getElementById('toolRect')); }

  if(k === 'g'){
    state.gridVisible = !state.gridVisible;
    document.getElementById('btnGrid').classList.toggle('active', state.gridVisible);
    render();
  }

  if(k === 't'){
    testPanel.style.display = testPanel.style.display === 'none' ? 'block' : 'none';
    if(testPanel.style.display === 'block') renderTestPreview();
  }
});

// ============================================================
// NEW MOD
// ============================================================
document.getElementById('btnNewMod').addEventListener('click', function(){
  var type = document.getElementById('newModType');
  var base = document.getElementById('newModBase');

  function updateBase(){
    base.innerHTML = '<option value="">— Blank —</option>';
    var list = type.value === 'zombie'
      ? window.ModData.ZOMBIE_DEFAULTS
      : window.ModData.WEAPON_DEFAULTS;
    Object.keys(list).forEach(function(id){
      var opt = document.createElement('option');
      opt.value = id; opt.textContent = list[id].name;
      base.appendChild(opt);
    });
  }
  type.onchange = updateBase;
  updateBase();
  document.getElementById('newModModal').classList.add('show');
});

document.getElementById('newModCancel').addEventListener('click', function(){
  document.getElementById('newModModal').classList.remove('show');
});

document.getElementById('newModCreate').addEventListener('click', function(){
  var type = document.getElementById('newModType').value;
  var baseId = document.getElementById('newModBase').value;

  if(type === 'zombie'){
    var base = baseId
      ? JSON.parse(JSON.stringify(window.ModData.ZOMBIE_DEFAULTS[baseId]))
      : { id:'custom_'+Date.now(), name:'New Zombie', color:'#5c6e4f', dark:'#33402b',
          radius:15, speed:1.5, hp:50, damage:10, score:10, big:false, pushDist:20, behavior:'normal' };
    base.id = 'custom_' + Date.now();
    base.name = baseId ? (base.name + ' Custom') : 'New Zombie';
    window.ModData.ZOMBIE_DEFAULTS[base.id] = base;
    buildZombieList();
    selectZombie(base.id);
    switchTab('zombies');
  } else {
    var base2 = baseId
      ? JSON.parse(JSON.stringify(window.ModData.WEAPON_DEFAULTS[baseId]))
      : { id:'custom_'+Date.now(), name:'New Weapon', slot:1, kind:'gun',
          damage:25, cooldown:12, bulletSpeed:12, spread:0.05, pellets:1,
          magSize:15, reloadTime:60, ammoMax:200, ammoPerPickup:20,
          color:'#c98a2e', sound:'pistol', reloadSound:'pistol_reload' };
    base2.id = 'custom_' + Date.now();
    base2.name = baseId ? (base2.name + ' Custom') : 'New Weapon';
    window.ModData.WEAPON_DEFAULTS[base2.id] = base2;
    buildWeaponList();
    selectWeapon(base2.id);
    switchTab('weapons');
  }

  document.getElementById('newModModal').classList.remove('show');
  showToast('New ' + type + ' created');
});

// ============================================================
// EXPORT
// ============================================================
document.getElementById('btnExportMod').addEventListener('click', function(){
  if(!state.currentMod){ showToast('No mod selected'); return; }
  var mod = state.currentMod;
  var data = {
    version: 2,
    type: mod.type,
    id: mod.id,
    name: mod.data.name,
    data: mod.data,
    sprite: state.pixels.map(function(row){
      return row.map(function(c){ return c || null; });
    }),
    parts: state.partMarkers,
    customSounds: state.customSounds,
    createdAt: Date.now()
  };

  var json = JSON.stringify(data);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = mod.id + '_' + mod.type + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported: ' + mod.id);
});

// ============================================================
// LOAD
// ============================================================
document.getElementById('btnLoadMod').addEventListener('click', function(){
  document.getElementById('loadModal').classList.add('show');
});

document.getElementById('loadCancel').addEventListener('click', function(){
  document.getElementById('loadModal').classList.remove('show');
});

document.getElementById('loadConfirm').addEventListener('click', function(){
  var text = document.getElementById('loadModText').value;
  try {
    var data = JSON.parse(text);
    if(!data.type || !data.data) throw new Error('Invalid mod');

    if(data.type === 'zombie'){
      window.ModData.ZOMBIE_DEFAULTS[data.id] = data.data;
      buildZombieList();
      selectZombie(data.id);
      switchTab('zombies');
    } else {
      window.ModData.WEAPON_DEFAULTS[data.id] = data.data;
      buildWeaponList();
      selectWeapon(data.id);
      switchTab('weapons');
    }

    if(data.sprite){
      state.pixels = data.sprite.map(function(row){
        return row.map(function(c){ return c || null; });
      });
      render();
    }
    if(data.parts){
      state.partMarkers = data.parts;
      updatePartsList();
      render();
    }
    if(data.customSounds){
      state.customSounds = data.customSounds;
    }

    document.getElementById('loadModal').classList.remove('show');
    showToast('Loaded: ' + data.name);
  } catch(e){
    showToast('Load failed: ' + e.message);
  }
});

// ============================================================
// PALETTE TABS
// ============================================================
function setupPaletteTabs(){
  var tabs = document.querySelectorAll('.ptab');
  for(var i = 0; i < tabs.length; i++){
    tabs[i].addEventListener('click', function(){
      var cat = this.getAttribute('data-ptab');
      for(var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
      this.classList.add('active');
      state.currentMaterialCategory = cat;
      buildPalette(cat);
    });
  }
  var cc = document.getElementById('customColor');
  if(cc){
    cc.addEventListener('input', function(){ selectColor(cc.value); });
  }
}

// ============================================================
// INIT
// ============================================================
function init(){
  resizeCanvas();
  initPixels();
  buildZombieList();
  buildWeaponList();
  buildPartsList();
  buildPalette('all');
  setupPaletteTabs();
  setupToolbar();

  var tabs = document.querySelectorAll('.tab-btn');
  for(var i = 0; i < tabs.length; i++){
    tabs[i].addEventListener('click', function(){
      switchTab(this.getAttribute('data-tab'));
    });
  }

  render();
  console.log('[ModMaker] Ready — RMB = Pan');
}

init();

})();