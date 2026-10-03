// ============================================================
// missions.js — Tab tugmasi bilan xarita/missiyalar ko'rinishi
// Let For Dead
// ============================================================
window.Missions = (function(){
  'use strict';

  var overlayEl = null;
  var isVisible = false;

  // ============================================================
  // MISSIONS — har bir kampaniya uchun
  // ============================================================
  var MISSIONS = [
    {
      id: 'dead_center',
      name: 'Dead Center',
      objectives: [
        { id: 'reach_radio', text: 'Find the radio', done: false },
        { id: 'call_heli',   text: 'Call the helicopter', done: false },
        { id: 'survive_horde', text: 'Survive the horde', done: false },
        { id: 'kill_tank',   text: 'Kill the Tank', done: false },
        { id: 'evacuate',    text: 'Evacuate', done: false }
      ]
    },
    {
      id: 'dark_carnival',
      name: 'Dark Carnival',
      objectives: [
        { id: 'reach_radio', text: 'Find the radio', done: false },
        { id: 'call_heli',   text: 'Call the helicopter', done: false },
        { id: 'survive_horde', text: 'Survive the horde', done: false },
        { id: 'kill_tank',   text: 'Kill the Tank', done: false },
        { id: 'evacuate',    text: 'Evacuate', done: false }
      ]
    }
  ];

  // ============================================================
  // OVERLAY YARATISH
  // ============================================================
  function createOverlay(){
    if(overlayEl) return overlayEl;

    overlayEl = document.createElement('div');
    overlayEl.id = 'missionsOverlay';
    overlayEl.style.cssText =
      'position:fixed;inset:0;z-index:15;' +
      'background:rgba(6,4,3,0.88);' +
      'backdrop-filter:blur(8px);' +
      'display:none;' +
      'align-items:center;justify-content:center;' +
      'padding:30px;' +
      'font-family:ui-monospace,monospace;' +
      'color:#d8d1c2;';

    var panel = document.createElement('div');
    panel.style.cssText =
      'background:linear-gradient(180deg,#17130f 0%,#0d0b0a 100%);' +
      'border:2px solid #a32f22;' +
      'border-radius:8px;' +
      'padding:30px 40px;' +
      'min-width:500px;max-width:700px;' +
      'box-shadow:0 0 60px rgba(163,47,34,0.5);';

    panel.innerHTML =
      '<div style="font-family:Staatliches,sans-serif;font-size:32px;' +
      'letter-spacing:6px;color:#e0523c;margin-bottom:20px;' +
      'text-transform:uppercase;text-align:center;' +
      'text-shadow:0 0 12px rgba(224,82,60,0.6);">' +
      'MAP &amp; MISSIONS</div>' +
      '<div id="missionsContent"></div>' +
      '<div style="margin-top:24px;text-align:center;' +
      'font-size:11px;color:#837b6d;letter-spacing:2px;">' +
      'Press <b style="color:#c98a2e;">TAB</b> to close</div>';

    overlayEl.appendChild(panel);
    document.body.appendChild(overlayEl);
    return overlayEl;
  }

  // ============================================================
  // SHOW / HIDE
  // ============================================================
  function show(game){
    createOverlay();
    updateContent(game);
    overlayEl.style.display = 'flex';
    isVisible = true;
  }

  function hide(){
    if(overlayEl) overlayEl.style.display = 'none';
    isVisible = false;
  }

  function toggle(game){
    if(isVisible) hide();
    else show(game);
  }

  // ============================================================
  // CONTENT YANGILASH
  // ============================================================
  function updateContent(game){
    var content = document.getElementById('missionsContent');
    if(!content) return;

    var html = '';

    // === HOZIRGI XARITA ===
    html += '<div style="margin-bottom:20px;">';
    html += '<div style="font-size:12px;letter-spacing:3px;color:#c98a2e;' +
            'text-transform:uppercase;margin-bottom:10px;">Current Map</div>';
    html += '<div style="padding:14px 18px;background:#1c1815;' +
            'border-left:4px solid #e0523c;border-radius:4px;">';
    html += '<div style="font-size:16px;font-weight:700;color:#d8d1c2;' +
            'letter-spacing:1px;text-transform:uppercase;">Let For Dead — Holdout</div>';
    html += '<div style="font-size:11px;color:#837b6d;margin-top:4px;' +
            'letter-spacing:1px;">' +
            'Size: ' + (game.mapW || '?') + ' × ' + (game.mapH || '?') +
            ' · Zombies: ' + game.zombies.length +
            '</div>';
    html += '</div></div>';

    // === HOZIRGI HOLAT ===
    html += '<div style="margin-bottom:20px;">';
    html += '<div style="font-size:12px;letter-spacing:3px;color:#c98a2e;' +
            'text-transform:uppercase;margin-bottom:10px;">Objectives</div>';

    var objectives = getCurrentObjectives(game);
    for(var i = 0; i < objectives.length; i++){
      var o = objectives[i];
      var icon = o.done ? '✓' : '○';
      var color = o.done ? '#7ad44a' : '#837b6d';
      var strike = o.done ? 'text-decoration:line-through;opacity:0.7;' : '';
      html += '<div style="padding:8px 12px;margin-bottom:4px;' +
              'background:#1c1815;border-radius:4px;' +
              'display:flex;align-items:center;gap:10px;">';
      html += '<span style="color:' + color + ';font-size:16px;font-weight:700;">' +
              icon + '</span>';
      html += '<span style="color:#d8d1c2;font-size:13px;letter-spacing:0.5px;' +
              strike + '">' + o.text + '</span>';
      html += '</div>';
    }
    html += '</div>';

    // === PLAYER STATS ===
    var p = game.player;
    html += '<div style="margin-bottom:20px;">';
    html += '<div style="font-size:12px;letter-spacing:3px;color:#c98a2e;' +
            'text-transform:uppercase;margin-bottom:10px;">Stats</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
    html += statBlock('Score', game.score, '#c98a2e');
    html += statBlock('Kills', game.kills, '#e0523c');
    html += statBlock('Health', Math.ceil(p.hp) + ' / ' + p.maxHp, '#7fbf52');
    html += statBlock('Time', formatTime(game.elapsed), '#4a8ed4');
    html += '</div></div>';

    // === ALIVE ENEMIES ===
    html += '<div>';
    html += '<div style="font-size:12px;letter-spacing:3px;color:#c98a2e;' +
            'text-transform:uppercase;margin-bottom:10px;">Threats</div>';
    html += '<div style="padding:10px 14px;background:#1c1815;border-radius:4px;' +
            'display:flex;justify-content:space-between;">';
    html += '<span style="color:#837b6d;">Zombies alive</span>';
    html += '<span style="color:#e0523c;font-weight:700;">' + game.zombies.length + '</span>';
    html += '</div>';

    if(game.tank && game.tank.alive){
      html += '<div style="padding:10px 14px;background:rgba(163,47,34,0.2);' +
              'border:1px solid #a32f22;border-radius:4px;margin-top:6px;' +
              'display:flex;justify-content:space-between;">';
      html += '<span style="color:#e0523c;font-weight:700;">⚠ TANK ACTIVE</span>';
      html += '<span style="color:#d8d1c2;font-weight:700;">' +
              Math.ceil(game.tank.alive.hp) + ' HP</span>';
      html += '</div>';
    }
    html += '</div>';

    content.innerHTML = html;
  }

  function statBlock(label, value, color){
    return '<div style="padding:10px 12px;background:#1c1815;border-radius:4px;' +
           'text-align:center;">' +
           '<div style="font-size:10px;letter-spacing:2px;color:#837b6d;' +
           'text-transform:uppercase;margin-bottom:4px;">' + label + '</div>' +
           '<div style="font-size:18px;font-weight:700;color:' + color + ';">' +
           value + '</div></div>';
  }

  function getCurrentObjectives(game){
    var list = [];
    list.push({
      text: 'Find the radio',
      done: game.hasRadio
    });
    list.push({
      text: 'Call the helicopter',
      done: game.heli.state !== 'none'
    });
    list.push({
      text: 'Survive the horde',
      done: game.heli.state === 'arrived' || game.heli.state === 'boarding' || game.heli.state === 'leaving'
    });
    list.push({
      text: 'Kill the Tank',
      done: game.tank.killed || (!game.tank.alive && game.tank.spawned)
    });
    list.push({
      text: 'Evacuate',
      done: game.player.evacuated || game.won
    });
    return list;
  }

  function formatTime(seconds){
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ============================================================
  // TAB TUGMASI
  // ============================================================
  function setupTab(){
    window.addEventListener('keydown', function(e){
      if(e.key === 'Tab'){
        e.preventDefault();
        var game = window.__game;
        if(game && game.running && !game.paused){
          toggle(game);
        }
      }
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  function init(){
    setupTab();
    console.log('[Missions] Ready — press Tab to view');
  }

  return {
    init: init,
    show: show,
    hide: hide,
    toggle: toggle,
    isVisible: function(){ return isVisible; }
  };
})();