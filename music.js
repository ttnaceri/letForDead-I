// music.js — musiqa fayllar boshqaruvi
window.Music = (function(){
  'use strict';

  var FILES = {
    aftercall:   'music/aftercall.mp3',
    beforehelp:  'music/arrivedhelp.mp3',
    arrivedhelp: 'music/arrivedhelp.mp3',
    afterhelp:   'music/afterhelp.mp3'
  };
  var tracks = {};
  var current = null;

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

  function stop(){
    if(current){
      try{ current.pause(); current.currentTime = 0; }catch(e){}
      current = null;
    }
  }

  function stopAll(){
    for(var k in tracks){
      try{ tracks[k].pause(); tracks[k].currentTime = 0; }catch(e){}
    }
    current = null;
  }

  function play(name, opts){
    opts = opts || {};
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
      if(opts.onEnd){
        track.onended = function(){ track.onended = null; opts.onEnd(); };
      } else {
        track.onended = null;
      }
    }catch(e){}
  }

  function pause(){ if(current){ try{ current.pause(); }catch(e){} } }
  function resume(){ if(current){ try{ current.play(); }catch(e){} } }
  function getTrack(name){ return tracks[name]; }

  return {
    load: load,
    play: play,
    stop: stop,
    stopAll: stopAll,
    pause: pause,
    resume: resume,
    getTrack: getTrack
  };
})();