// ============================================================
// menu.js — Let For Dead I
// Menu asosiy logikasi
// ============================================================
(function(){
'use strict';

// ============================================================
// DOM HELPERS
// ============================================================
function $(id){ return document.getElementById(id); }
function $$(sel){ return document.querySelectorAll(sel); }

// ============================================================
// LANG
// ============================================================
function t(key){
    return (window.Lang && window.Lang.t) ? window.Lang.t(key) : key;
}

// ============================================================
// TOAST
// ============================================================
var toastTimeout = null;
function showToast(msg, type){
    var el = $('toast');
    if(!el) return;
    el.textContent = msg;
    el.className = 'show' + (type ? ' ' + type : '');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function(){
        el.classList.remove('show');
    }, 2200);
}

// ============================================================
// SETTINGS
// ============================================================
var SETTINGS_KEY = 'letfordead_settings';

var DEFAULT_SETTINGS = {
    volumeMaster: 80,
    volumeMusic: 60,
    volumeSfx: 80,
    brightness: 100,
    gamma: 100,
    scanlines: true,
    vignette: true,
    bloodOverlay: true,
    hudHealth: true,
    hudAmmo: true,
    hudSlots: true,
    hudKills: true,
    hudTimer: true,
    hudNames: true,
    autoAim: false,
    showFps: false,
    difficulty: 1,
    lobbyMusic: 'standard',
    language: 'eng'
};

var MUSIC_FILES = {
    standard: '../music/lobby.mp3',
    horizon:  '../music/lobby1.mp3'
};

var DIFFICULTY_KEYS = ['diff_easy', 'diff_medium', 'diff_hard'];

function loadSettings(){
    var s = null;
    try {
        var raw = localStorage.getItem(SETTINGS_KEY);
        if(raw) s = JSON.parse(raw);
    } catch(e){}
    if(!s) s = {};
    var merged = {};
    for(var k in DEFAULT_SETTINGS){
        merged[k] = (s[k] !== undefined) ? s[k] : DEFAULT_SETTINGS[k];
    }
    return merged;
}

function saveSettings(s){
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch(e){}
}

var settings = loadSettings();

// ============================================================
// LOBBY MUSIC
// ============================================================
var lobbyAudio = null;

function playLobbyMusic(){
    var src = MUSIC_FILES[settings.lobbyMusic] || MUSIC_FILES.standard;

    if(!lobbyAudio){
        lobbyAudio = new Audio();
        lobbyAudio.loop = true;
        lobbyAudio.preload = 'auto';
        lobbyAudio.addEventListener('error', function(){
            console.warn('[Menu] Lobby music topilmadi:', src);
        });
    }

    if(lobbyAudio.src && lobbyAudio.src.indexOf(src) !== -1 && !lobbyAudio.paused){
        return;
    }

    lobbyAudio.pause();
    lobbyAudio.src = src;
    lobbyAudio.currentTime = 0;
    lobbyAudio.volume = (settings.volumeMaster / 100) * (settings.volumeMusic / 100) * 0.6;

    var pr = lobbyAudio.play();
    if(pr && pr.catch){
        pr.catch(function(){
            var once = function(){
                if(lobbyAudio){
                    var p2 = lobbyAudio.play();
                    if(p2 && p2.catch) p2.catch(function(){});
                }
                document.removeEventListener('click', once);
                document.removeEventListener('keydown', once);
            };
            document.addEventListener('click', once);
            document.addEventListener('keydown', once);
        });
    }
}

function updateLobbyVolume(){
    if(lobbyAudio){
        lobbyAudio.volume = (settings.volumeMaster / 100) * (settings.volumeMusic / 100) * 0.6;
    }
}

// ============================================================
// LANGUAGE
// ============================================================
function updateLanguage(){
    var els = $$('[data-lang]');
    for(var i = 0; i < els.length; i++){
        var key = els[i].getAttribute('data-lang');
        els[i].textContent = t(key);
    }

    var optEls = $$('[data-lang-option]');
    for(var j = 0; j < optEls.length; j++){
        var k = optEls[j].getAttribute('data-lang-option');
        optEls[j].textContent = t(k);
    }

    updateDifficultyLabel();

    if(window.Lang && window.Lang.getLanguage){
        document.documentElement.lang = window.Lang.getLanguage();
    }
}

// ============================================================
// SETTINGS UI
// ============================================================
function applySettingsToUI(){
    var sliders = $$('input[type="range"][data-setting]');
    for(var i = 0; i < sliders.length; i++){
        var key = sliders[i].getAttribute('data-setting');
        if(settings[key] !== undefined) sliders[i].value = settings[key];
    }
    var checks = $$('input[type="checkbox"][data-setting]');
    for(var j = 0; j < checks.length; j++){
        var k = checks[j].getAttribute('data-setting');
        if(settings[k] !== undefined) checks[j].checked = !!settings[k];
    }
    var selects = $$('select[data-setting]');
    for(var s = 0; s < selects.length; s++){
        var sk = selects[s].getAttribute('data-setting');
        if(settings[sk] !== undefined) selects[s].value = settings[sk];
    }
    updateSliderLabels();
    updateDifficultyLabel();
}

function updateSliderLabels(){
    var m = $('valMaster');
    if(m) m.textContent = settings.volumeMaster + '%';
    var mus = $('valMusic');
    if(mus) mus.textContent = settings.volumeMusic + '%';
    var sx = $('valSfx');
    if(sx) sx.textContent = settings.volumeSfx + '%';
    var br = $('valBrightness');
    if(br) br.textContent = settings.brightness + '%';
    var gm = $('valGamma');
    if(gm) gm.textContent = settings.gamma + '%';
}

function updateDifficultyLabel(){
    var el = $('valDifficulty');
    if(!el) return;
    el.textContent = t(DIFFICULTY_KEYS[settings.difficulty] || 'diff_medium');
}

function applyVisualEffects(){
    var video = $('bg-video');
    if(video){
        var b = settings.brightness / 100;
        var g = settings.gamma / 100;
        var brightness = (b * g).toFixed(2);
        video.style.filter = 'brightness(' + brightness + ')';
    }
}

// ============================================================
// SETTINGS EVENTS
// ============================================================
function setupSettingsEvents(){
    var sliders = $$('input[type="range"][data-setting]');
    for(var i = 0; i < sliders.length; i++){
        (function(sl){
            sl.addEventListener('input', function(){
                var key = sl.getAttribute('data-setting');
                settings[key] = parseInt(sl.value, 10);
                saveSettings(settings);
                updateSliderLabels();
                updateDifficultyLabel();
                applyVisualEffects();
                updateLobbyVolume();
            });
        })(sliders[i]);
    }

    var checks = $$('input[type="checkbox"][data-setting]');
    for(var j = 0; j < checks.length; j++){
        (function(ch){
            ch.addEventListener('change', function(){
                var key = ch.getAttribute('data-setting');
                settings[key] = ch.checked;
                saveSettings(settings);
                applyVisualEffects();
            });
        })(checks[j]);
    }

    var selects = $$('select[data-setting]');
    for(var s = 0; s < selects.length; s++){
        (function(sel){
            sel.addEventListener('change', function(){
                var key = sel.getAttribute('data-setting');
                settings[key] = sel.value;
                saveSettings(settings);

                if(key === 'language'){
                    if(window.Lang) window.Lang.setLanguage(settings.language);
                    updateLanguage();
                }
                if(key === 'lobbyMusic'){
                    playLobbyMusic();
                }
            });
        })(selects[s]);
    }

    var resetBtn = $('btnResetSettings');
    if(resetBtn){
        resetBtn.addEventListener('click', function(){
            settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
            saveSettings(settings);
            if(window.Lang) window.Lang.setLanguage('eng');
            applySettingsToUI();
            applyVisualEffects();
            updateLanguage();
            playLobbyMusic();
            updateLobbyVolume();
            showToast(t('settings_reset'), 'success');
        });
    }
}

// ============================================================
// PAGES
// ============================================================
function openPage(pageId){
    var pages = $$('.page-container');
    for(var i = 0; i < pages.length; i++) pages[i].classList.remove('show');
    var main = $('mainMenu');
    if(main) main.classList.add('hidden');
    var p = $(pageId);
    if(p) p.classList.add('show');
}

function closeAllPages(){
    var pages = $$('.page-container');
    for(var i = 0; i < pages.length; i++) pages[i].classList.remove('show');
    var main = $('mainMenu');
    if(main) main.classList.remove('hidden');
}

function setupBackButtons(){
    var backs = $$('[data-back]');
    for(var i = 0; i < backs.length; i++){
        backs[i].addEventListener('click', closeAllPages);
    }
}

// ============================================================
// MENU BUTTONS
// ============================================================
function setupMenuButtons(){
    var btns = $$('.menu-btn');
    for(var i = 0; i < btns.length; i++){
        (function(btn){
            btn.addEventListener('click', function(){
                handleMenuAction(btn.getAttribute('data-action'));
            });
        })(btns[i]);
    }
}

function handleMenuAction(action){
    switch(action){
        case 'campaign':
            openPage('campaignPage');
            renderCampaignList();
            break;
        case 'network':
            showToast(t('network_soon'), 'error');
            break;
        case 'single':
            startGame('single');
            break;
        case 'achievements':
            openPage('achievementsPage');
            renderAchievements();
            break;
        case 'settings':
            openPage('settingsPage');
            applySettingsToUI();
            break;
        case 'addons':
            openPage('addonsPage');
            renderAddons();
            break;
        case 'exit':
            confirmAction(t('exit_title'), t('exit_confirm'), function(){
                window.close();
                setTimeout(function(){
                    window.location.href = 'about:blank';
                }, 200);
            });
            break;
    }
}

// ============================================================
// START GAME — LOADING orqali
// ============================================================
function startGame(mode){
    saveSettings(settings);
    if(lobbyAudio) lobbyAudio.pause();

    // Loading page orqali o'yinni boshlash
    window.location.href = '../loading.html';
}

// ============================================================
// CAMPAIGN
// ============================================================
var CAMPAIGNS = [
    { id: 'dead_center',   nameKey: 'cmp_dead_center', descKey: 'cmp_dead_center_d', icon: '🏨' },
    { id: 'dark_carnival', nameKey: 'cmp_dark_carn',   descKey: 'cmp_dark_carn_d',   icon: '🎢' },
    { id: 'swamp_fever',   nameKey: 'cmp_swamp',       descKey: 'cmp_swamp_d',       icon: '🌿' },
    { id: 'hard_rain',     nameKey: 'cmp_hard_rain',   descKey: 'cmp_hard_rain_d',   icon: '🌧️' },
    { id: 'the_parish',    nameKey: 'cmp_parish',      descKey: 'cmp_parish_d',      icon: '⛪' }
];

function renderCampaignList(){
    var list = $('campaignList');
    if(!list) return;
    list.innerHTML = '';

    CAMPAIGNS.forEach(function(c){
        var item = document.createElement('div');
        item.className = 'campaign-item';
        item.innerHTML =
            '<div class="campaign-icon">' + c.icon + '</div>' +
            '<div class="campaign-info">' +
                '<div class="campaign-name">' + t(c.nameKey) + '</div>' +
                '<div class="campaign-desc">' + t(c.descKey) + '</div>' +
            '</div>';
        item.addEventListener('click', function(){
            startGame('campaign:' + c.id);
        });
        list.appendChild(item);
    });
}

// ============================================================
// ACHIEVEMENTS
// ============================================================
var ACHIEVEMENTS = [
    { id: 'first_blood',    nameKey: 'ach_first_blood', descKey: 'ach_first_blood_d', icon: '🩸' },
    { id: 'horde_survivor', nameKey: 'ach_horde',       descKey: 'ach_horde_d',       icon: '👥' },
    { id: 'heli_call',      nameKey: 'ach_heli_call',   descKey: 'ach_heli_call_d',   icon: '📻' },
    { id: 'tank_killer',    nameKey: 'ach_tank',        descKey: 'ach_tank_d',        icon: '💪' },
    { id: 'rescued',        nameKey: 'ach_rescued',     descKey: 'ach_rescued_d',     icon: '🚁' },
    { id: 'survivor_all',   nameKey: 'ach_all_surv',    descKey: 'ach_all_surv_d',    icon: '👬' },
    { id: 'laser_equipped', nameKey: 'ach_laser',       descKey: 'ach_laser_d',       icon: '🔴' },
    { id: 'aid_master',     nameKey: 'ach_aid',         descKey: 'ach_aid_d',         icon: '💊' }
];

function renderAchievements(){
    var grid = $('achievementsGrid');
    if(!grid) return;
    grid.innerHTML = '';

    var progress = loadAchievementsProgress();

    ACHIEVEMENTS.forEach(function(a){
        var unlocked = !!progress[a.id];
        var el = document.createElement('div');
        el.className = 'achievement' + (unlocked ? ' unlocked' : '');
        el.innerHTML =
            '<div class="achievement-icon">' + (unlocked ? a.icon : '🔒') + '</div>' +
            '<div class="achievement-info">' +
                '<div class="achievement-name">' + t(a.nameKey) + '</div>' +
                '<div class="achievement-desc">' + t(a.descKey) + '</div>' +
            '</div>';
        grid.appendChild(el);
    });
}

function loadAchievementsProgress(){
    try {
        var save = JSON.parse(localStorage.getItem('letfordead_save_v1') || 'null');
        if(save && save.achievements) return save.achievements;
        return JSON.parse(localStorage.getItem('letfordead_achievements') || '{}');
    } catch(e){ return {}; }
}

// ============================================================
// ADDONS
// ============================================================
var ADDONS_KEY = 'letfordead_addons';

function loadAddons(){
    try {
        var raw = localStorage.getItem(ADDONS_KEY);
        if(!raw) return [];
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch(e){ return []; }
}

function saveAddons(addons){
    try {
        localStorage.setItem(ADDONS_KEY, JSON.stringify(addons));
    } catch(e){}
}

function renderAddons(){
    var list = $('addonsList');
    var badge = $('addonCount');
    if(!list) return;

    var addons = loadAddons();
    if(badge) badge.textContent = addons.length;

    if(addons.length === 0){
        list.innerHTML =
            '<div class="empty-state">' +
                '<div class="empty-icon">📦</div>' +
                '<div>' + t('addon_empty') + '</div>' +
                '<div class="empty-hint">' + t('addon_hint') + '</div>' +
            '</div>';
        return;
    }

    list.innerHTML = '';

    addons.forEach(function(addon, index){
        var item = document.createElement('div');
        item.className = 'addon-item';

        var thumb = document.createElement('div');
        thumb.className = 'addon-thumb';
        var canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        drawMiniMap(canvas, addon.map);
        thumb.appendChild(canvas);

        var info = document.createElement('div');
        info.className = 'addon-info';
        var w = (addon.map && addon.map.width) ? addon.map.width : '?';
        var h = (addon.map && addon.map.height) ? addon.map.height : '?';
        info.innerHTML =
            '<div class="addon-name">' + escapeHtml(addon.name) + '</div>' +
            '<div class="addon-meta">' + w + ' × ' + h + ' · ' + (addon.date || '—') + '</div>';

        var actions = document.createElement('div');
        actions.className = 'addon-actions';

        var playBtn = document.createElement('button');
        playBtn.className = 'icon-btn play';
        playBtn.title = t('addon_play');
        playBtn.textContent = '▶';
        playBtn.addEventListener('click', function(){ playAddon(addon); });

        var delBtn = document.createElement('button');
        delBtn.className = 'icon-btn danger';
        delBtn.title = t('addon_delete');
        delBtn.textContent = '✕';
        delBtn.addEventListener('click', function(){
            confirmAction(t('delete_title'), t('delete_confirm'), function(){
                var arr = loadAddons();
                arr.splice(index, 1);
                saveAddons(arr);
                renderAddons();
                showToast(t('addon_deleted'), 'success');
            });
        });

        actions.appendChild(playBtn);
        actions.appendChild(delBtn);

        item.appendChild(thumb);
        item.appendChild(info);
        item.appendChild(actions);
        list.appendChild(item);
    });
}

function drawMiniMap(canvas, map){
    var c = canvas.getContext('2d');
    c.fillStyle = '#0d0b0a';
    c.fillRect(0, 0, 60, 60);

    if(!map || !map.tiles || !map.width || !map.height){
        c.fillStyle = '#837b6d';
        c.font = '24px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('?', 30, 30);
        return;
    }

    var cellW = 60 / map.width;
    var cellH = 60 / map.height;

    var TILE_COLORS = {
        0:'#0d0b0a', 1:'#2a2418', 2:'#4a3f55', 3:'#3a3226', 4:'#5a1a15',
        5:'#33402b', 6:'#1a2a3a', 7:'#5a4a2a', 8:'#3a3a4a', 9:'#4a3520',
        10:'#6a2a1a', 11:'#1a1a1a', 12:'#c9bfa8', 13:'#4a8ed4', 14:'#d4a44a',
        15:'#d44a7a', 16:'#7a9a3a', 17:'#c98a2e', 18:'#7fbf52', 19:'#e0a83f',
        20:'#7ad44a', 21:'#837b6d', 22:'#4a6a8a', 23:'#6a2a2a', 24:'#8a5a2a',
        25:'#e0523c', 26:'#c98a2e', 27:'#e0523c', 28:'#8a5a2a', 29:'#3a3a4a',
        30:'#7ad44a'
    };

    for(var y = 0; y < map.height; y++){
        for(var x = 0; x < map.width; x++){
            var tv = (map.tiles[y] && map.tiles[y][x]) ? map.tiles[y][x] : 0;
            c.fillStyle = TILE_COLORS[tv] || '#0d0b0a';
            c.fillRect(x * cellW, y * cellH, cellW, cellH);
        }
    }
}

function playAddon(addon){
    try {
        localStorage.setItem('letfordead_active_map', JSON.stringify(addon.map));
        localStorage.setItem('letfordead_map', JSON.stringify(addon.map));
    } catch(e){
        showToast(t('load_error'), 'error');
        return;
    }
    if(lobbyAudio) lobbyAudio.pause();

    // LOADING orqali
    window.location.href = '../loading.html';
}

// ============================================================
// ADDONS EVENTS
// ============================================================
function setupAddonEvents(){
    var fileBtn = $('btnAddonFile');
    var fileInput = $('addonFileInput');
    var textBtn = $('btnAddonText');
    var clearBtn = $('btnAddonClearAll');

    if(fileBtn && fileInput){
        fileBtn.addEventListener('click', function(){ fileInput.click(); });

        fileInput.addEventListener('change', function(e){
            var file = e.target.files[0];
            if(!file) return;
            var reader = new FileReader();
            reader.onload = function(ev){
                try {
                    var map = JSON.parse(ev.target.result);
                    if(!map.tiles || !map.width || !map.height){
                        throw new Error(t('addon_invalid'));
                    }
                    addAddon(map, file.name.replace('.json', ''));
                } catch(err){
                    showToast(t('addon_invalid'), 'error');
                }
            };
            reader.readAsText(file);
            fileInput.value = '';
        });
    }

    if(textBtn){
        textBtn.addEventListener('click', function(){
            var modal = $('jsonModal');
            if(modal){
                modal.classList.add('show');
                var ta = $('jsonTextarea');
                if(ta) ta.value = '';
            }
        });
    }

    if(clearBtn){
        clearBtn.addEventListener('click', function(){
            confirmAction(t('clear_all_title'), t('clear_all_confirm'), function(){
                saveAddons([]);
                renderAddons();
                showToast(t('addon_all_clear'), 'success');
            });
        });
    }

    var jsonConfirm = $('btnJsonConfirm');
    if(jsonConfirm){
        jsonConfirm.addEventListener('click', function(){
            var text = $('jsonTextarea').value;
            try {
                var map = JSON.parse(text);
                if(!map.tiles || !map.width || !map.height){
                    throw new Error(t('addon_invalid'));
                }
                addAddon(map, 'Map ' + (loadAddons().length + 1));
                var modal = $('jsonModal');
                if(modal) modal.classList.remove('show');
            } catch(err){
                showToast(t('error') + ': ' + err.message, 'error');
            }
        });
    }
}

function addAddon(map, name){
    var addons = loadAddons();
    var now = new Date();
    var dateStr = now.getDate() + '.' + (now.getMonth() + 1) + '.' + now.getFullYear();
    addons.push({
        id: 'addon_' + Date.now(),
        name: name,
        map: map,
        date: dateStr
    });
    saveAddons(addons);
    renderAddons();
    showToast(t('addon_added'), 'success');
}

// ============================================================
// MODALS
// ============================================================
function setupModals(){
    var closers = $$('[data-modal-close]');
    for(var i = 0; i < closers.length; i++){
        closers[i].addEventListener('click', function(){
            var modal = this.closest('.modal-bg');
            if(modal) modal.classList.remove('show');
        });
    }

    var modals = $$('.modal-bg');
    for(var j = 0; j < modals.length; j++){
        (function(m){
            m.addEventListener('click', function(e){
                if(e.target === m) m.classList.remove('show');
            });
        })(modals[j]);
    }

    var noBtns = $$('[data-confirm-no]');
    for(var k = 0; k < noBtns.length; k++){
        noBtns[k].addEventListener('click', function(){
            var modal = this.closest('.modal-bg');
            if(modal) modal.classList.remove('show');
        });
    }

    var yesBtns = $$('[data-confirm-yes]');
    for(var n = 0; n < yesBtns.length; n++){
        yesBtns[n].addEventListener('click', function(){
            var modal = this.closest('.modal-bg');
            if(modal) modal.classList.remove('show');
            if(window.__confirmCallback){
                var cb = window.__confirmCallback;
                window.__confirmCallback = null;
                cb();
            }
        });
    }
}

function confirmAction(title, text, onYes){
    var modal = $('confirmModal');
    if(!modal) return;
    $('confirmTitle').textContent = title;
    $('confirmText').textContent = text;
    window.__confirmCallback = onYes;
    modal.classList.add('show');
}

// ============================================================
// ESC
// ============================================================
window.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
        var modals = $$('.modal-bg');
        var anyModalOpen = false;
        for(var i = 0; i < modals.length; i++){
            if(modals[i].classList.contains('show')){
                modals[i].classList.remove('show');
                anyModalOpen = true;
            }
        }
        if(!anyModalOpen){
            var pages = $$('.page-container');
            var anyPageOpen = false;
            for(var j = 0; j < pages.length; j++){
                if(pages[j].classList.contains('show')){ anyPageOpen = true; break; }
            }
            if(anyPageOpen) closeAllPages();
        }
    }
});

// ============================================================
// UTILS
// ============================================================
function escapeHtml(s){
    if(!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================
// INIT
// ============================================================
function init(){
    console.log('[Menu] Initializing...');

    // Video — ovozsiz
    var video = $('bg-video');
    if(video){
        video.muted = true;
        video.volume = 0;
        video.play().catch(function(err){
            console.log('Video autoplay xatosi:', err);
        });
    }

    // Language
    if(window.Lang){
        window.Lang.setLanguage(settings.language);
    }
    updateLanguage();

    // Setup
    setupMenuButtons();
    setupBackButtons();
    setupSettingsEvents();
    setupAddonEvents();
    setupModals();

    applySettingsToUI();
    applyVisualEffects();

    // Lobby music
    playLobbyMusic();
    updateLobbyVolume();

    console.log('[Menu] Ready. Lang:', settings.language, 'Music:', settings.lobbyMusic);
}

if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Global eksport
window.MenuSettings = {
    get: function(){ return settings; },
    save: function(){ saveSettings(settings); }
};

})();