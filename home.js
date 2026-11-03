(function(){
  var COLS=30, ROWS=9, S=[2,4], G=[27,4];
  var cv=document.getElementById('grid'), ctx=cv.getContext('2d'), statusEl=document.getElementById('status');
  var walls=new Uint8Array(COLS*ROWS), visited=[], path=[], shown=0, showPath=false, cell=20, raf=0;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idx=function(x,y){return y*COLS+x};

  function preset(){
    walls.fill(0);
    [[8,2],[14,7],[20,1]].forEach(function(p){
      for(var y=0;y<ROWS;y++){ if(y!==p[1]) walls[idx(p[0],y)]=1; }
    });
  }
  function randomize(){
    walls.fill(0);
    for(var i=0;i<walls.length;i++){ if(Math.random()<0.27) walls[i]=1; }
    walls[idx(S[0],S[1])]=0; walls[idx(G[0],G[1])]=0;
  }
  function bfs(){
    var prev=new Int16Array(COLS*ROWS).fill(-2), q=[idx(S[0],S[1])], head=0, goal=idx(G[0],G[1]);
    prev[q[0]]=-1; visited=[]; path=[];
    while(head<q.length){
      var cur=q[head++]; visited.push(cur);
      if(cur===goal) break;
      var x=cur%COLS, y=(cur/COLS)|0;
      [[1,0],[0,1],[-1,0],[0,-1]].forEach(function(d){
        var nx=x+d[0], ny=y+d[1];
        if(nx<0||ny<0||nx>=COLS||ny>=ROWS) return;
        var n=idx(nx,ny);
        if(walls[n]||prev[n]!==-2) return;
        prev[n]=cur; q.push(n);
      });
    }
    if(prev[goal]!==-2){ for(var c=goal;c!==-1;c=prev[c]) path.push(c); path.reverse(); }
    statusEl.textContent = path.length ? 'Shortest path: '+(path.length-1)+' steps' : 'No path. Remove a wall.';
  }
  function color(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function draw(){
    var c={cell:color('--cell'),visit:color('--visit'),path:color('--path'),wall:color('--wall'),accent:color('--accent')};
    var vis=new Uint8Array(COLS*ROWS), on=new Uint8Array(COLS*ROWS), i;
    for(i=0;i<shown&&i<visited.length;i++) vis[visited[i]]=1;
    if(showPath) path.forEach(function(p){on[p]=1});
    ctx.clearRect(0,0,cv.clientWidth,cv.clientHeight);
    for(var y=0;y<ROWS;y++) for(var x=0;x<COLS;x++){
      var n=idx(x,y);
      ctx.fillStyle = walls[n]?c.wall : on[n]?c.path : vis[n]?c.visit : c.cell;
      ctx.fillRect(x*cell+1,y*cell+1,cell-2,cell-2);
    }
    var r=cell*0.34;
    ctx.fillStyle=c.accent; ctx.beginPath(); ctx.arc((S[0]+.5)*cell,(S[1]+.5)*cell,r,0,6.2832); ctx.fill();
    ctx.strokeStyle=c.accent; ctx.lineWidth=Math.max(2,cell*0.12); ctx.beginPath(); ctx.arc((G[0]+.5)*cell,(G[1]+.5)*cell,r,0,6.2832); ctx.stroke();
  }
  function size(){
    var w=cv.clientWidth, dpr=window.devicePixelRatio||1; cell=w/COLS;
    cv.style.height=(ROWS*cell)+'px'; cv.width=Math.round(w*dpr); cv.height=Math.round(ROWS*cell*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0); draw();
  }
  function animate(){
    cancelAnimationFrame(raf); bfs(); shown=0; showPath=false;
    if(reduce){ shown=visited.length; showPath=true; draw(); return; }
    (function step(){
      shown+=4; draw();
      if(shown<visited.length){ raf=requestAnimationFrame(step); }
      else { showPath=true; draw(); }
    })();
  }
  function instant(){ cancelAnimationFrame(raf); bfs(); shown=visited.length; showPath=true; draw(); }

  var painting=false, mode=1;
  function cellAt(e){
    var r=cv.getBoundingClientRect();
    return [Math.floor((e.clientX-r.left)/r.width*COLS), Math.floor((e.clientY-r.top)/r.height*ROWS)];
  }
  function paint(e){
    var p=cellAt(e), x=p[0], y=p[1];
    if(x<0||y<0||x>=COLS||y>=ROWS) return;
    if((x===S[0]&&y===S[1])||(x===G[0]&&y===G[1])) return;
    var n=idx(x,y); if(walls[n]===mode) return;
    walls[n]=mode; instant();
  }
  cv.addEventListener('pointerdown',function(e){
    var p=cellAt(e), n=idx(p[0],p[1]); mode=walls[n]?0:1; painting=true; cv.setPointerCapture(e.pointerId); paint(e);
  });
  cv.addEventListener('pointermove',function(e){ if(painting) paint(e); });
  ['pointerup','pointercancel'].forEach(function(t){ cv.addEventListener(t,function(){painting=false}); });

  document.getElementById('randomize').onclick=function(){ randomize(); animate(); };
  document.getElementById('clear').onclick=function(){ walls.fill(0); animate(); };
  document.getElementById('replay').onclick=animate;
  window.addEventListener('resize',size);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',draw);

  preset(); size(); animate();
})();
