// ============================================================
// music.js — Musiqa boshqaruvi
// Let For Dead
// ============================================================
window.Music = (function(){
  'use strict';

  var FILES = {
    aftercall:   'music/aftercall.mp3',
    beforehelp:  'music/beforehelp.mp3',
    arrivedhelp: 'music/arrivedhelp.mp3',
    afterhelp:   'music/afterhelp.mp3'
  };

  var tracks = {};
  var current = null;
  var currentName = null;
  var locked = false;   // Lock — o'zgarish bloklangan

  // ============================================================
  // LOAD
  // ============================================================
  function load(){
    for(var k in FILES){
      var a = new Audio();
      a.src = FILES[k];
      a.loop = false;
      a.volume = 0.55;
      a.preload = 'auto';
      a.addEventListener('error', function(){});
      tracks[k] = a;
    }
  }

  // ============================================================
  // STOP
  // ============================================================
  function stop(){
    if(locked) return;
    if(current){
      try{ current.pause(); current.currentTime = 0; }catch(e){}
      current = null;
      currentName = null;
    }
  }

  function stopAll(){
    locked = false;
    for(var k in tracks){
      try{ tracks[k].pause(); tracks[k].currentTime = 0; }catch(e){}
    }
    current = null;
    currentName = null;
  }

  // ============================================================
  // PLAY
  // ============================================================
  function play(name, opts){
    opts = opts || {};

    // Lock bo'lsa — yangi musiqa chalish mumkin emas
    if(locked && !opts.force){
      console.log('[Music] Locked — play blocked:', name);
      return;
    }

    stop();
    var track = tracks[name];
    if(!track) return;

    try{
      track.loop = !!opts.loop;
      track.volume = opts.volume != null ? opts.volume : 0.55;
      track.currentTime = 0;
      var pr = track.play();
      if(pr && pr.catch) pr.catch(function(){});
      current = track;
      currentName = name;
      if(opts.onEnd){
        track.onended = function(){ track.onended = null; opts.onEnd(); };
      } else {
        track.onended = null;
      }
      console.log('[Music] Playing:', name);
    }catch(e){}
  }

  // ============================================================
  // LOCK — Credits davomida
  // ============================================================
  function lock(){
    locked = true;
    console.log('[Music] Locked');
  }

  function unlock(){
    locked = false;
    console.log('[Music] Unlocked');
  }

  function isLocked(){
    return locked;
  }

  // ============================================================
  // PAUSE / RESUME
  // ============================================================
  function pause(){
    if(current){
      try{ current.pause(); }catch(e){}
    }
  }

  function resume(){
    if(current){
      try{ current.play(); }catch(e){}
    }
  }

  function getTrack(name){ return tracks[name]; }
  function getCurrent(){ return current; }
  function getCurrentName(){ return currentName; }

  return {
    load: load,
    play: play,
    stop: stop,
    stopAll: stopAll,
    pause: pause,
    resume: resume,
    lock: lock,
    unlock: unlock,
    isLocked: isLocked,
    getTrack: getTrack,
    getCurrent: getCurrent,
    getCurrentName: getCurrentName
  };
})();