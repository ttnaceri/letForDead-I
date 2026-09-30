// audio.js — barcha procedural tovushlar
window.SFX = (function(){
  'use strict';

  var audioCtx = null;
  function ac(){
    if(!audioCtx){ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
    return audioCtx;
  }
  function ensureAudio(){ try{ var a=ac(); if(a.state==='suspended') a.resume(); }catch(e){} }

  function tone(freq,dur,type,vol){
    try{
      var a=ac();
      var osc=a.createOscillator(), gain=a.createGain();
      osc.type=type; osc.frequency.value=freq; gain.gain.value=vol;
      osc.connect(gain); gain.connect(a.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime+dur);
      osc.stop(a.currentTime+dur);
    }catch(e){}
  }

  var sfx = {
    // Qurol
    shoot:        function(){ tone(190,0.07,'square',0.05); },
    pistol:       function(){ tone(190,0.07,'square',0.05); },
    shotgun:      function(){ tone(110,0.12,'sawtooth',0.09); setTimeout(function(){tone(80,0.15,'square',0.06);},30); },
    rifle:        function(){ tone(240,0.06,'square',0.05); setTimeout(function(){tone(200,0.05,'square',0.04);},40); },
    melee:        function(){ tone(220,0.08,'square',0.07); },
    meleeHit:     function(){ tone(120,0.15,'sawtooth',0.1); },
    dryFire:      function(){ tone(150,0.05,'square',0.04); },
    reload:       function(){ tone(300,0.06,'square',0.05); setTimeout(function(){tone(420,0.08,'square',0.05);},120); },
    throwItem:    function(){ tone(180,0.1,'sine',0.06); setTimeout(function(){tone(140,0.12,'sine',0.05);},80); },
    explosion:    function(){ tone(60,0.6,'sawtooth',0.18); setTimeout(function(){tone(45,0.5,'square',0.12);},80); },
    pipebombBeep: function(){ tone(880,0.08,'square',0.06); },

    // Zombie
    hit:          function(){ tone(100,0.08,'sawtooth',0.06); },
    zombieGroan:  function(){ tone(80+Math.random()*40, 0.4+Math.random()*0.3, 'sawtooth', 0.03); },
    bigZombieDown:function(){ tone(90,0.5,'sawtooth',0.14); setTimeout(function(){tone(60,0.5,'square',0.1);},100); },
    spit:         function(){ tone(300,0.1,'sine',0.05); },

    // Player
    hurt:         function(){ tone(130,0.22,'sawtooth',0.12); },
    death:        function(){ tone(70,0.7,'sawtooth',0.15); },
    pickup:       function(){ tone(600,0.08,'sine',0.06); setTimeout(function(){tone(880,0.1,'sine',0.06);},70); },
    radioPickup:  function(){ tone(440,0.12,'sine',0.08); setTimeout(function(){tone(660,0.15,'sine',0.08);},120); setTimeout(function(){tone(880,0.2,'sine',0.08);},270); },
    heal:         function(){ tone(520,0.15,'sine',0.08); setTimeout(function(){tone(780,0.2,'sine',0.08);},150); },

    // Event
    heliCall:     function(){ tone(660,0.15,'sine',0.08); setTimeout(function(){tone(880,0.2,'sine',0.08);},150); },
    horde:        function(){ tone(60,0.5,'sawtooth',0.15); setTimeout(function(){tone(50,0.6,'sawtooth',0.15);},300); }
  };

  return {
    sfx: sfx,
    ensureAudio: ensureAudio,
    tone: tone
  };
})();
// ============================================================
// HORDE SOUND — sounds/horde.mp3
// ============================================================
window.SFX.hordeSound = (function(){
  var hordeAudio = null;

  function load(){
    try {
      hordeAudio = new Audio('sounds/horde.mp3');
      hordeAudio.volume = 0.7;
      hordeAudio.preload = 'auto';
      hordeAudio.addEventListener('error', function(){
        console.warn('[Horde] sounds/horde.mp3 topilmadi');
      });
    } catch(e) {
      console.warn('[Horde] Audio xato:', e);
    }
  }

  function play(){
    if(!hordeAudio){
      load();
    }
    if(!hordeAudio) return;
    try {
      hordeAudio.currentTime = 0;
      var p = hordeAudio.play();
      if(p && p.catch) p.catch(function(){});
    } catch(e){}
  }

  // Auto-load
  if(document.readyState === 'complete'){
    load();
  } else {
    window.addEventListener('load', load);
  }

  return {
    play: play,
    load: load
  };
})();