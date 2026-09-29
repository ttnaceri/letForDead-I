// world.js — cheksiz chunk generatsiyasi
window.World = (function(){
  'use strict';

  var TILE_SIZE = 256;
  var chunks = {};
  var DRAW_RADIUS = 3;

  function key(cx, cy){ return cx+','+cy; }

  function hash(n){ var s = Math.sin(n)*43758.5453; return s - Math.floor(s); }

  function generate(cx, cy){
    var k = key(cx, cy);
    if(chunks[k]) return chunks[k];

    var off = document.createElement('canvas');
    off.width = TILE_SIZE; off.height = TILE_SIZE;
    var o = off.getContext('2d');

    o.fillStyle = '#141110'; o.fillRect(0,0,TILE_SIZE,TILE_SIZE);

    var seed = (cx*73856093) ^ (cy*19349663);

    for(var i=0;i<50;i++){
      var r1 = hash(seed + i*1.1);
      var r2 = hash(seed + i*2.3);
      var r3 = hash(seed + i*3.7);
      o.fillStyle = 'rgba(0,0,0,'+(r1*0.3).toFixed(2)+')';
      o.beginPath();
      o.ellipse(r2*TILE_SIZE, r3*TILE_SIZE, 15+r1*70, 15+r2*70, r1*Math.PI, 0, Math.PI*2);
      o.fill();
    }

    o.strokeStyle = 'rgba(0,0,0,0.35)'; o.lineWidth = 1;
    for(var j=0;j<20;j++){
      var x = hash(seed + j*5.1)*TILE_SIZE;
      var y = hash(seed + j*6.3)*TILE_SIZE;
      o.beginPath(); o.moveTo(x,y);
      for(var kk=0;kk<4;kk++){
        x += (hash(seed + j*7.1 + kk)*2 - 1)*50;
        y += (hash(seed + j*8.9 + kk)*2 - 1)*50;
        o.lineTo(x,y);
      }
      o.stroke();
    }

    if(hash(seed*0.7) > 0.75){
      o.fillStyle = 'rgba(90,20,15,0.35)';
      o.beginPath();
      o.ellipse(TILE_SIZE*0.5, TILE_SIZE*0.5, 60, 40, 0, 0, Math.PI*2);
      o.fill();
    }

    var grad = o.createRadialGradient(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE*0.3, TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE*0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.25)');
    o.fillStyle = grad; o.fillRect(0,0,TILE_SIZE,TILE_SIZE);

    chunks[k] = off;
    return off;
  }

  function render(ctx, camera, canvasW, canvasH){
    var startCx = Math.floor(camera.x / TILE_SIZE) - DRAW_RADIUS;
    var endCx   = Math.floor((camera.x + canvasW) / TILE_SIZE) + DRAW_RADIUS;
    var startCy = Math.floor(camera.y / TILE_SIZE) - DRAW_RADIUS;
    var endCy   = Math.floor((camera.y + canvasH) / TILE_SIZE) + DRAW_RADIUS;
    for(var cx = startCx; cx <= endCx; cx++){
      for(var cy = startCy; cy <= endCy; cy++){
        ctx.drawImage(generate(cx, cy), cx*TILE_SIZE, cy*TILE_SIZE);
      }
    }
  }

  return {
    TILE_SIZE: TILE_SIZE,
    render: render,
    generate: generate
  };
})();