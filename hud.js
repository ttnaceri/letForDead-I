// ============================================================
// hud.js — Barcha HUD (desktop + mobile), banner, prompt, credits
// Let For Dead
// ============================================================
window.HUD = (function(){
  'use strict';

  var bannerTimeout = null;
  var creditsTimeout = null;
  var promptEl = null;
  var promptTimeout = null;
  var aidProgressEl = null;

  // ============================================================
  // HELPER — joriy qurol kalitini olish
  // ============================================================
  function getWeaponKeyFromPlayer(p){
    if(!p) return 'pistol';
    if(p.currentSlot === 1) return p.slot1;
    if(p.currentSlot === 2) return p.slot2;
    if(p.currentSlot === 3) return p.slot3;
    if(p.currentSlot === 4) return p.slot4;
    if(p.currentSlot === 5) return p.slot5;
    return 'pistol';
  }

  // ============================================================
  // BANNER — katta markaziy matn
  // ============================================================
  function showBanner(text, color){
    var el = document.getElementById('center-banner');
    if(!el) return;
    el.textContent = text;
    el.style.color = color || '#e0523c';
    el.classList.add('show');
    clearTimeout(bannerTimeout);
    bannerTimeout = setTimeout(function(){ el.classList.remove('show'); }, 2200);
  }

  // ============================================================
  // INTERACT PROMPT — "E — Pick up Ammo"
  // ============================================================
  function showPrompt(text){
    if(!promptEl){
      promptEl = document.createElement('div');
      promptEl.id = 'interactPrompt';
      promptEl.style.cssText =
        'position:absolute;bottom:130px;left:50%;transform:translateX(-50%);' +
        'background:rgba(0,0,0,0.78);border:2px solid #c98a2e;border-radius:8px;' +
        'padding:10px 22px;color:#fff;font-family:ui-monospace,monospace;font-size:14px;' +
        'letter-spacing:2px;z-index:8;pointer-events:none;font-weight:600;' +
        'text-shadow:0 0 6px #000, 0 0 3px #000;' +
        'box-shadow: 0 0 20px rgba(201,138,46,0.4);' +
        'text-transform:uppercase;';
      var container = document.getElementById('game-container');
      if(container) container.appendChild(promptEl);
    }
    promptEl.textContent = text;
    promptEl.style.display = 'block';

    clearTimeout(promptTimeout);
    promptTimeout = setTimeout(function(){
      if(promptEl) promptEl.style.display = 'none';
    }, 200);
  }

  // ============================================================
  // AID PROGRESS BAR — 5 sekund
  // ============================================================
  function showAidProgress(pct){
    if(!aidProgressEl){
      aidProgressEl = document.createElement('div');
      aidProgressEl.id = 'aidProgress';
      aidProgressEl.style.cssText =
        'position:absolute;bottom:200px;left:50%;transform:translateX(-50%);' +
        'width:260px;height:22px;background:rgba(0,0,0,0.78);border:2px solid #7fbf52;' +
        'border-radius:6px;z-index:8;pointer-events:none;overflow:hidden;' +
        'box-shadow: 0 0 20px rgba(127,191,82,0.5);';
      var inner = document.createElement('div');
      inner.id = 'aidProgressInner';
      inner.style.cssText =
        'height:100%;width:0%;' +
        'background:linear-gradient(90deg,#7fbf52,#a3e070);' +
        'transition:width 0.05s linear;';
      aidProgressEl.appendChild(inner);

      var label = document.createElement('div');
      label.id = 'aidProgressLabel';
      label.style.cssText =
        'position:absolute;top:0;left:0;right:0;bottom:0;' +
        'display:flex;align-items:center;justify-content:center;' +
        'color:#fff;font-family:ui-monospace,monospace;font-size:11px;' +
        'letter-spacing:2px;font-weight:700;text-shadow:0 0 4px #000;';
      label.textContent = 'USING AID...';
      aidProgressEl.appendChild(label);

      var container = document.getElementById('game-container');
      if(container) container.appendChild(aidProgressEl);
    }
    var inner2 = document.getElementById('aidProgressInner');
    if(inner2) inner2.style.width = Math.min(100, Math.max(0, pct * 100)) + '%';
    aidProgressEl.style.display = pct > 0 ? 'block' : 'none';
  }

  // ============================================================
  // MAIN UPDATE
  // ============================================================
  function update(game){
    if(!game || !game.player) return;
    var p = game.player;

    // Health bar (desktop)
    var pct = Math.max(0, p.hp / p.maxHp * 100);
    var bar = document.getElementById('healthBar');
    if(bar){
      bar.style.width = pct + '%';
      bar.style.background = pct > 55 ? '#6b8f3f'
                            : pct > 25 ? '#c98a2e'
                            : '#e0523c';
    }
    var hn = document.getElementById('healthNum');
    if(hn) hn.textContent = Math.ceil(p.hp);

    // Score
    var sr = document.getElementById('scoreRow');
    if(sr) sr.textContent = 'Score ' + game.score;
    var kn = document.getElementById('killsNum');
    if(kn) kn.textContent = game.kills;
    var zl = document.getElementById('zombiesLeft');
    if(zl) zl.textContent = game.zombies.length;

    // Damage flash
    var df = document.getElementById('damage-flash');
    if(df) df.style.opacity = game.damageFlash;

    // Sub HUDs
    try { updateWeapon(game); } catch(e){ console.warn('updateWeapon:', e); }
    try { updateSlots(game); } catch(e){ console.warn('updateSlots:', e); }
    try { updateHeliButton(game); } catch(e){ console.warn('updateHeliButton:', e); }
    try { updateMobile(game); } catch(e){ console.warn('updateMobile:', e); }
    try { updateInteractPrompt(game); } catch(e){ console.warn('updateInteractPrompt:', e); }
  }

  // ============================================================
  // INTERACT PROMPT — "E — Pick up ..."
  // ============================================================
  function updateInteractPrompt(game){
    var p = game.player;
    var INTERACT_RANGE = 60;

    // Radio
    if(game.radioPickup && !game.hasRadio){
      var rp = game.radioPickup;
      var d = Math.hypot(rp.x - p.x, rp.y - p.y);
      if(d < INTERACT_RANGE){
        showPrompt('E — Pick up Radio');
        return;
      }
    }

    // Pickup
    var bestName = null;
    var bestDist = INTERACT_RANGE;

    for(var i = 0; i < game.pickups.length; i++){
      var pk = game.pickups[i];
      var dp = Math.hypot(pk.x - p.x, pk.y - p.y);
      if(dp < bestDist){
        bestDist = dp;
        bestName = getPickupName(pk.type);
      }
    }

    if(bestName){
      showPrompt('E — Pick up ' + bestName);
      return;
    }

    // Agar hech narsa yaqin bo'lmasa — prompt o'chadi (timeout bilan)
  }

  function getPickupName(type){
    if(type === 'health') return 'Health';
    if(type === 'ammo_pistol') return 'Ammo';
    if(type === 'ammo_shotgun') return 'Shotgun Ammo';
    if(type === 'ammo_rifle') return 'Rifle Ammo';
    if(type === 'aid') return 'AID Kit';
    if(type === 'grenade') return 'Grenade';
    if(type === 'pipebomb') return 'Pipebomb';
    if(type === 'syringe') return 'Syringe';
    if(type === 'pills') return 'Pills';
    if(type === 'laser') return 'Laser Sight';
    if(type === 'ammo_patron') return 'Patron (∞ Ammo)';
    return 'Item';
  }

  // ============================================================
  // WEAPON HUD
  // ============================================================
  function updateWeapon(game){
    var p = game.player;
    var wk = getWeaponKeyFromPlayer(p);
    if(!window.Weapons) return;
    var w = window.Weapons.get(wk);
    if(!w) return;

    var wEl = document.getElementById('weaponRow');
    var ammoEl = document.getElementById('ammoCount');
    var wNameEl = document.getElementById('ammoWeapon');
    var reloadEl = document.getElementById('reloadTag');

    var ammoText = '';
    if(wk === 'pistol'){
      ammoText = (p.ammo.pistol || 0) + ' / ∞';
    } else if(window.Weapons.isMelee(wk)){
      ammoText = 'melee';
    } else if(w.magSize){
      var reserveText = p.hasInfiniteAmmo ? '∞' : (p.reserve[wk] != null ? p.reserve[wk] : '—');
      ammoText = (p.ammo[wk] || 0) + ' / ' + reserveText;
    } else if(window.Weapons.isThrow(wk) || window.Weapons.isHeal(wk)){
      ammoText = 'x' + (p.ammo[wk] || 0);
    } else {
      ammoText = '—';
    }

    if(wEl) wEl.innerHTML = '<span class="cur">' + w.name + '</span> — <span class="ammo">' + ammoText + '</span>';
    if(wNameEl) wNameEl.textContent = w.name;
    if(ammoEl) ammoEl.textContent = ammoText;

    if(reloadEl){
      if(p.reloading) reloadEl.textContent = 'RELOADING...';
      else if(w.magSize && p.ammo[wk] === 0 && !p.hasInfiniteAmmo) reloadEl.textContent = 'PRESS R TO RELOAD';
      else reloadEl.textContent = '';
    }
  }

  // ============================================================
  // SLOTS HUD
  // ============================================================
  function updateSlots(game){
    var p = game.player;
    if(!window.Weapons) return;

    var s1n = document.getElementById('slot1Name');
    var s1s = document.getElementById('slot1Sub');
    if(s1n) s1n.textContent = window.Weapons.name(p.slot1);
    var s1Ammo = '';
    if(p.slot1 === 'shotgun') s1Ammo = (p.reserve.shotgun || 0) + '';
    else if(p.slot1 === 'rifle') s1Ammo = (p.reserve.rifle || 0) + '';
    else if(p.slot1 === 'smg') s1Ammo = (p.reserve.smg || 0) + '';
    else if(p.slot1 === 'grenadeLauncher') s1Ammo = (p.reserve.grenadeLauncher || 0) + '';
    else if(p.slot1 === 'sniper') s1Ammo = (p.reserve.sniper || 0) + '';
    if(s1s) s1s.textContent = s1Ammo || 'empty';

    var s2n = document.getElementById('slot2Name');
    var s2s = document.getElementById('slot2Sub');
    if(s2n) s2n.textContent = window.Weapons.name(p.slot2);
    if(s2s) s2s.textContent = (p.slot2 === 'pistol') ? '∞' : 'melee';

    var s3s = document.getElementById('slot3Sub');
    if(s3s) s3s.textContent = p.ammo.aid || 0;

    var s4n = document.getElementById('slot4Name');
    var s4s = document.getElementById('slot4Sub');
    if(s4n) s4n.textContent = window.Weapons.name(p.slot4);
    if(s4s) s4s.textContent = p.ammo[p.slot4] || 0;

    var s5n = document.getElementById('slot5Name');
    var s5s = document.getElementById('slot5Sub');
    if(s5n) s5n.textContent = window.Weapons.name(p.slot5);
    if(s5s) s5s.textContent = p.ammo[p.slot5] || 0;

    var slots = document.querySelectorAll('#slotsHud .slot');
    for(var i = 0; i < slots.length; i++){
      var n = parseInt(slots[i].getAttribute('data-slot'), 10);
      if(n === p.currentSlot) slots[i].classList.add('active');
      else slots[i].classList.remove('active');
    }
  }

  // ============================================================
  // HELI BUTTON
  // ============================================================
  function updateHeliButton(game){
    var btn = document.getElementById('callBtn');
    var label = document.getElementById('callBtnLabel');
    var h = game.heli;
    var timerEl = document.getElementById('heliTimer');

    if(!btn) return;
    if(!game.hasRadio){
      btn.classList.remove('show');
      if(timerEl) timerEl.classList.remove('show');
      return;
    }
    btn.classList.add('show');

    if(h.state === 'none'){
      btn.disabled = false;
      btn.classList.remove('calling');
      if(label) label.textContent = 'Call Helicopter';
      if(timerEl){ timerEl.classList.remove('show'); timerEl.classList.remove('horde'); }
    } else if(h.state === 'calling'){
      btn.disabled = true;
      btn.classList.add('calling');
      if(label) label.textContent = 'Calling...';
      if(timerEl) timerEl.classList.remove('show');
    } else if(h.state === 'incoming'){
      btn.disabled = true;
      btn.classList.add('calling');
      var totalSec = Math.max(0, Math.ceil(h.timer / 60));
      var mm = Math.floor(totalSec / 60);
      var ss = totalSec % 60;
      var timeStr = mm + ':' + (ss < 10 ? '0' : '') + ss;
      if(label) label.textContent = 'Inbound ' + timeStr;
      if(timerEl){
        timerEl.classList.add('show');
        timerEl.classList.add('horde');
        timerEl.innerHTML = '⚠ HORDE — SURVIVE &nbsp; <span class="t">' + timeStr + '</span>';
      }
    } else if(h.state === 'arrived'){
      btn.disabled = true;
      btn.classList.remove('calling');
      if(label) label.textContent = 'Reach the helicopter!';
      if(timerEl){
        timerEl.classList.add('show');
        timerEl.classList.remove('horde');
        timerEl.innerHTML = 'HELICOPTER ARRIVED &nbsp; <span class="t">GO!</span>';
      }
    } else if(h.state === 'boarding' || h.state === 'leaving'){
      btn.disabled = true;
      btn.classList.remove('calling');
      if(label) label.textContent = 'Boarding...';
      if(timerEl){
        timerEl.classList.add('show');
        timerEl.classList.remove('horde');
        timerEl.innerHTML = 'BOARDING HELICOPTER &nbsp; <span class="t">...</span>';
      }
    } else {
      btn.disabled = true;
      btn.classList.remove('calling');
      if(label) label.textContent = 'Evacuated';
      if(timerEl) timerEl.classList.remove('show');
    }
  }

  // ============================================================
  // MOBILE HUD
  // ============================================================
  function updateMobile(game){
    if(!window.Controller || !window.Controller.isMobile()) return;
    var p = game.player;

    var pct = Math.max(0, p.hp / p.maxHp * 100);
    var mBar = document.getElementById('mHealthBar');
    if(mBar){
      mBar.style.width = pct + '%';
      if(pct > 55) mBar.style.background = 'linear-gradient(90deg, #6b8f3f, #8fc760)';
      else if(pct > 25) mBar.style.background = 'linear-gradient(90deg, #c98a2e, #e0a83f)';
      else mBar.style.background = 'linear-gradient(90deg, #a32f22, #e0523c)';
    }
    var mNum = document.getElementById('mHealthNum');
    if(mNum) mNum.textContent = Math.ceil(p.hp);

    var mKills = document.getElementById('mKillsNum');
    if(mKills) mKills.textContent = game.kills;

    var s1 = document.getElementById('mSlot1Ammo');
    if(s1) s1.textContent = (p.reserve && p.reserve[p.slot1]) || (p.ammo && p.ammo[p.slot1]) || '0';

    var s2 = document.getElementById('mSlot2Ammo');
    if(s2) s2.textContent = (p.slot2 === 'pistol') ? '∞' : 'M';

    var s3 = document.getElementById('mSlot3Ammo');
    if(s3) s3.textContent = p.ammo.aid || 0;

    var s4 = document.getElementById('mSlot4Ammo');
    if(s4) s4.textContent = p.ammo[p.slot4] || 0;

    var s5 = document.getElementById('mSlot5Ammo');
    if(s5) s5.textContent = p.ammo[p.slot5] || 0;

    var mslots = document.querySelectorAll('.m-slot');
    for(var i = 0; i < mslots.length; i++){
      var n = parseInt(mslots[i].getAttribute('data-slot'), 10);
      if(n === p.currentSlot) mslots[i].classList.add('active');
      else mslots[i].classList.remove('active');
    }

    var mCallBtn = document.getElementById('mCallBtn');
    if(mCallBtn){
      if(game.hasRadio && game.heli.state === 'none'){
        mCallBtn.classList.add('show');
        var lbl = document.getElementById('mCallLabel');
        if(lbl) lbl.textContent = 'CALL';
      } else {
        mCallBtn.classList.remove('show');
      }
    }

    var mHeliTimer = document.getElementById('mHeliTimer');
    if(mHeliTimer){
      var h = game.heli;
      if(h.state === 'incoming'){
        var totalSec = Math.max(0, Math.ceil(h.timer / 60));
        var mm = Math.floor(totalSec / 60);
        var ss = totalSec % 60;
        mHeliTimer.classList.add('show');
        mHeliTimer.classList.add('horde');
        mHeliTimer.textContent = '⚠ HELI ' + mm + ':' + (ss < 10 ? '0' : '') + ss;
      } else if(h.state === 'arrived'){
        mHeliTimer.classList.add('show');
        mHeliTimer.classList.remove('horde');
        mHeliTimer.textContent = '✓ HELI ARRIVED';
      } else if(h.state === 'boarding' || h.state === 'leaving'){
        mHeliTimer.classList.add('show');
        mHeliTimer.classList.remove('horde');
        mHeliTimer.textContent = '⬆ BOARDING';
      } else {
        mHeliTimer.classList.remove('show');
      }
    }
  }

  // ============================================================
  // HIGH SCORE
  // ============================================================
  function getHighScore(){
    try{ return parseInt(localStorage.getItem('letfordead_highscore') || '0', 10); }catch(e){ return 0; }
  }
  function setHighScore(v){
    try{ localStorage.setItem('letfordead_highscore', String(v)); }catch(e){}
  }

  // ============================================================
  // GAME OVER
  // ============================================================
  function showGameOver(game, title, statusText, isWin){
    var el = document.getElementById('gameOver');
    if(!el) return;
    var st = document.getElementById('gameOverStatus');
    if(st) st.textContent = statusText;
    var titleEl = document.getElementById('gameOverTitle');
    if(titleEl){
      titleEl.textContent = title;
      titleEl.classList.toggle('win', !!isWin);
    }
    var best = Math.max(getHighScore(), game.score);
    setHighScore(best);
    var fs = document.getElementById('finalScore');
    if(fs) fs.textContent = game.score;
    var fk = document.getElementById('finalKills');
    if(fk) fk.textContent = game.kills;
    var bs = document.getElementById('bestScore');
    if(bs) bs.textContent = best;
    el.classList.add('show');
  }

  // ============================================================
  // END CREDITS
  // ============================================================
  function startEndCredits(){
    var el = document.getElementById('endCredits');
    if(!el) return;
    el.classList.add('show');

    var scroll = document.getElementById('creditsScroll');
    if(scroll){
      scroll.style.animation = 'none';
      void scroll.offsetHeight;
      scroll.style.animation = 'creditsRoll 175s linear forwards';
    }

    var skipBtn = document.getElementById('creditsSkipBtn');
    if(skipBtn){
      skipBtn.onclick = function(){
        stopEndCredits();
        showGameOverAfterCredits();
      };
    }

    clearTimeout(creditsTimeout);
    creditsTimeout = setTimeout(function(){
      stopEndCredits();
      showGameOverAfterCredits();
    }, 175 * 1000);
  }

  function stopEndCredits(){
    clearTimeout(creditsTimeout);
    var el = document.getElementById('endCredits');
    if(el) el.classList.remove('show');
  }

  function showGameOverAfterCredits(){
  if(window.__pendingGameOver){
    var po = window.__pendingGameOver;
    window.__pendingGameOver = null;
    showGameOver(po.game, po.title, po.status, po.isWin);

    // FIX: End credits tugagach music unlock
    // Lekin afterhelp.mp3 davom etaveradi main menu'ga qaytguncha
    // Music.stop() faqat restartGame() da chaqiriladi
    console.log('[HUD] Credits ended, music still playing');
  }
}

// Restart da music unlock
function reset(){
  if(window.Music){
    window.Music.unlock();
    window.Music.stopAll();
  }
  if(promptEl) promptEl.style.display = 'none';
  if(aidProgressEl) aidProgressEl.style.display = 'none';
  clearTimeout(bannerTimeout);
  clearTimeout(promptTimeout);
  var cb = document.getElementById('center-banner');
  if(cb) cb.classList.remove('show');
}

  // ============================================================
  // RESET — restart uchun
  // ============================================================
  function reset(){
    if(promptEl) promptEl.style.display = 'none';
    if(aidProgressEl) aidProgressEl.style.display = 'none';
    clearTimeout(bannerTimeout);
    clearTimeout(promptTimeout);
    var cb = document.getElementById('center-banner');
    if(cb) cb.classList.remove('show');
  }

  return {
    showBanner: showBanner,
    showPrompt: showPrompt,
    showAidProgress: showAidProgress,
    update: update,
    updateWeapon: updateWeapon,
    updateSlots: updateSlots,
    updateHeliButton: updateHeliButton,
    updateMobile: updateMobile,
    showGameOver: showGameOver,
    getHighScore: getHighScore,
    setHighScore: setHighScore,
    startEndCredits: startEndCredits,
    stopEndCredits: stopEndCredits,
    showGameOverAfterCredits: showGameOverAfterCredits,
    reset: reset
  };
})();