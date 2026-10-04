// ============================================================
// pwa.js — PWA Install + Update Handler
// Let For Dead I
// ============================================================
(function(){
'use strict';

var PWA_VERSION = '1.0.0';
var DISMISSED_KEY = 'letfordead_pwa_dismissed';

var deferredPrompt = null;
var isInstalled = false;
var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
var isStandalone = window.matchMedia('(display-mode: standalone)').matches
                || window.navigator.standalone === true;

// ============================================================
// DETECT
// ============================================================
function checkInstalled(){
  if(isStandalone){
    isInstalled = true;
    document.documentElement.classList.add('pwa-standalone');
    console.log('[PWA] Running as installed app');
  } else {
    document.documentElement.classList.add('pwa-browser');
    console.log('[PWA] Running in browser');
  }
}

// ============================================================
// REGISTER SW
// ============================================================
function registerSW(){
  if(!('serviceWorker' in navigator)){
    console.log('[PWA] SW not supported');
    return;
  }

  navigator.serviceWorker.register('sw.js', { scope: './' })
    .then(function(reg){
      console.log('[PWA] SW registered:', reg.scope);
      setInterval(function(){ reg.update(); }, 60000);

      reg.addEventListener('updatefound', function(){
        var nw = reg.installing;
        if(!nw) return;
        nw.addEventListener('statechange', function(){
          if(nw.state === 'installed' && navigator.serviceWorker.controller){
            showUpdateToast();
          }
        });
      });
    })
    .catch(function(err){
      console.warn('[PWA] SW register failed:', err);
    });
}

// ============================================================
// UPDATE TOAST
// ============================================================
function showUpdateToast(){
  if(document.getElementById('pwaUpdate')) return;

  var el = document.createElement('div');
  el.id = 'pwaUpdate';
  el.style.cssText =
    'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);' +
    'background:#17130f;border:2px solid #c98a2e;border-radius:8px;' +
    'padding:14px 20px;color:#d8d1c2;font-family:monospace;font-size:13px;' +
    'z-index:99999;box-shadow:0 0 30px rgba(201,138,46,0.5);' +
    'display:flex;align-items:center;gap:14px;max-width:90vw;';

  el.innerHTML =
    '<span>🔄 New version available</span>' +
    '<button id="pwaUpdateBtn" style="' +
      'background:#a32f22;color:#fff;border:1px solid #e0523c;' +
      'padding:6px 14px;border-radius:4px;cursor:pointer;' +
      'font-family:inherit;font-size:12px;font-weight:700;' +
    '">Update</button>';

  document.body.appendChild(el);

  var btn = document.getElementById('pwaUpdateBtn');
  if(btn){
    btn.addEventListener('click', function(){
      if(navigator.serviceWorker.controller){
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    });
  }
}

// ============================================================
// INSTALL PROMPT
// ============================================================
function setupInstallPrompt(){
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Install prompt available');

    if(!localStorage.getItem(DISMISSED_KEY)){
      showInstallButton();
    }
  });

  window.addEventListener('appinstalled', function(){
    console.log('[PWA] Installed!');
    isInstalled = true;
    deferredPrompt = null;
    hideInstallButton();
    showToast('✅ App installed!', 'success');
  });
}

function showInstallButton(){
  if(document.getElementById('pwaInstallBtn')) return;
  if(isStandalone) return;

  var btn = document.createElement('button');
  btn.id = 'pwaInstallBtn';
  btn.innerHTML = '📲 Install App';
  btn.style.cssText =
    'position:fixed;bottom:20px;right:20px;z-index:99998;' +
    'background:#a32f22;border:2px solid #e0523c;border-radius:8px;' +
    'padding:12px 20px;color:#fff;font-family:monospace;font-size:13px;' +
    'font-weight:700;letter-spacing:1px;cursor:pointer;' +
    'box-shadow:0 0 24px rgba(163,47,34,0.6);' +
    'animation:pwaPulse 1.8s ease-in-out infinite;';

  document.body.appendChild(btn);

  btn.addEventListener('click', function(){
    if(!deferredPrompt){
      console.log('[PWA] No prompt');
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choice){
      console.log('[PWA] Choice:', choice.outcome);
      if(choice.outcome === 'accepted'){
        isInstalled = true;
        showToast('📲 Installing...', 'success');
      } else {
        localStorage.setItem(DISMISSED_KEY, '1');
      }
      deferredPrompt = null;
      hideInstallButton();
    });
  });
}

function hideInstallButton(){
  var btn = document.getElementById('pwaInstallBtn');
  if(btn) btn.remove();
}

// ============================================================
// iOS HINT
// ============================================================
function setupIOSInstall(){
  if(!isIOS || isStandalone) return;
  if(localStorage.getItem(DISMISSED_KEY)) return;

  setTimeout(function(){
    if(document.getElementById('pwaIOSHint')) return;

    var hint = document.createElement('div');
    hint.id = 'pwaIOSHint';
    hint.style.cssText =
      'position:fixed;bottom:20px;left:20px;right:20px;z-index:99999;' +
      'background:linear-gradient(180deg,#17130f,#0d0b0a);' +
      'border:2px solid #c98a2e;border-radius:12px;padding:16px;' +
      'color:#d8d1c2;font-family:monospace;font-size:12px;' +
      'box-shadow:0 0 30px rgba(201,138,46,0.5);';

    hint.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<div style="font-size:28px;">📲</div>' +
        '<div style="flex:1;line-height:1.5;">' +
          '<b>Install Let For Dead I</b><br>' +
          'Tap <b>Share</b> <span style="display:inline-block;' +
          'background:#c98a2e;color:#000;padding:0 6px;border-radius:4px;' +
          'font-size:11px;">⬆</span> then <b>Add to Home Screen</b>' +
        '</div>' +
        '<button id="pwaIOSClose" style="' +
          'position:absolute;top:8px;right:8px;background:transparent;' +
          'border:none;color:#837b6d;font-size:16px;cursor:pointer;' +
        '">✕</button>' +
      '</div>';

    document.body.appendChild(hint);

    var close = document.getElementById('pwaIOSClose');
    if(close){
      close.addEventListener('click', function(){
        hint.remove();
        localStorage.setItem(DISMISSED_KEY, '1');
      });
    }
  }, 5000);
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type){
  var el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText =
    'position:fixed;top:20px;left:50%;transform:translateX(-50%);' +
    'background:#17130f;border:2px solid ' +
    (type === 'success' ? '#7ad44a' : '#c98a2e') + ';' +
    'border-radius:8px;padding:12px 22px;color:#d8d1c2;' +
    'font-family:monospace;font-size:13px;z-index:99999;' +
    'box-shadow:0 0 24px rgba(201,138,46,0.5);' +
    'transition:opacity 0.3s ease;';

  document.body.appendChild(el);

  setTimeout(function(){
    el.style.opacity = '0';
    setTimeout(function(){ el.remove(); }, 300);
  }, 2500);
}

// ============================================================
// PREVENT ZOOM / MENU
// ============================================================
function preventZoom(){
  var lastTouch = 0;

  document.addEventListener('touchend', function(e){
    var now = Date.now();
    if(now - lastTouch <= 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });

  document.addEventListener('gesturestart', function(e){ e.preventDefault(); });

  document.addEventListener('contextmenu', function(e){
    var t = e.target;
    if(t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA' && !t.isContentEditable){
      e.preventDefault();
    }
  });

  document.addEventListener('selectstart', function(e){
    var t = e.target;
    if(t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA'){
      e.preventDefault();
    }
  });
}

// ============================================================
// STYLES
// ============================================================
function injectStyles(){
  if(document.getElementById('pwaStyles')) return;

  var style = document.createElement('style');
  style.id = 'pwaStyles';
  style.textContent =
    '@keyframes pwaPulse {' +
    '  0%,100% { box-shadow: 0 0 24px rgba(163,47,34,0.6); }' +
    '  50% { box-shadow: 0 0 36px rgba(224,82,60,0.9); }' +
    '}' +
    'html.pwa-standalone { overscroll-behavior: none; }' +
    'html.pwa-standalone body {' +
    '  user-select: none;' +
    '  -webkit-user-select: none;' +
    '  -webkit-touch-callout: none;' +
    '  -webkit-tap-highlight-color: transparent;' +
    '}';

  document.head.appendChild(style);
}

// ============================================================
// INIT
// ============================================================
function init(){
  console.log('[PWA] Init v' + PWA_VERSION);
  injectStyles();
  checkInstalled();
  registerSW();
  setupInstallPrompt();
  setupIOSInstall();
  preventZoom();

  window.PWA = {
    isInstalled: function(){ return isInstalled; },
    isStandalone: function(){ return isStandalone; },
    install: function(){
      if(deferredPrompt) deferredPrompt.prompt();
    },
    version: PWA_VERSION
  };
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();