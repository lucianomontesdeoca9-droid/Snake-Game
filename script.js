// Config y estado
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const bestEl = document.getElementById('best');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedInput = document.getElementById('speed');
    const speedVal = document.getElementById('speedVal');
    const gridInput = document.getElementById('gridSize');
    const gridSizeVal = document.getElementById('gridSizeVal');

    let GRID = parseInt(gridInput.value,10); // celdas por fila/col
    let CELL = 24; // px aprox (ajustado dinámicamente)
    let fps = parseInt(speedInput.value,10);

    const STORAGE_KEY = 'snake_highscore_v1';
    let bestScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0',10);
    bestEl.textContent = bestScore;

    let lastTime = 0;
    let accumulated = 0;
    let running = false;
    let paused = false;

const state = {
    snake: [],
    dir: {x:1,y:0},
    nextDir: {x:1,y:0},
    food: null,
    score:0,
    alive:true
};

// Ajuste canvas para alta DPI y responsive
function resizeCanvas(){
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth;
    // quepan GRID celdas en ancho
    CELL = Math.floor(w / GRID);
    canvas.width = CELL * GRID;
    canvas.height = CELL * GRID;
    canvas.style.width = '100%';
    draw();
}

window.addEventListener('resize', debounce(resizeCanvas,120));

function debounce(fn,wait){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),wait)}}

// Inicializar juego
function resetGame(){
    state.snake = [];
    const mid = Math.floor(GRID/2);
    state.snake.push({x:mid-1,y:mid});
    state.snake.push({x:mid,y:mid});
    state.snake.push({x:mid+1,y:mid});
    state.dir = {x:1,y:0};
    state.nextDir = {x:1,y:0};
    state.score = 0;
    state.alive = true;
    spawnFood();
    scoreEl.textContent = state.score;
}

function spawnFood(){
    while(true){
        const fx = Math.floor(Math.random()*GRID);
        const fy = Math.floor(Math.random()*GRID);
    if(!state.snake.some(s=>s.x===fx && s.y===fy)){
        state.food = {x:fx,y:fy};
        return;
    }
}
}

function setDirection(dx,dy){
    // no permitir 180 grados
    if(dx === -state.dir.x && dy === -state.dir.y) return;
    state.nextDir = {x:dx,y:dy};
}

    // Loop con control de FPS
function loop(timestamp){
    if(!running) return;
    if(paused){ lastTime = timestamp; requestAnimationFrame(loop); return; }
    if(!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime)/1000;
    lastTime = timestamp;
    accumulated += delta;
    const interval = 1 / fps;
    while(accumulated >= interval){
        update();
        accumulated -= interval;
}
    draw();
    if(state.alive) requestAnimationFrame(loop);
    else running = false;
}

function update(){
    // actualizar dirección
    state.dir = state.nextDir;
    const head = {...state.snake[state.snake.length-1]};
    head.x += state.dir.x;
    head.y += state.dir.y;
      // envolvimiento en bordes (opcional) -> aquí hacemos choque
    if(head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID){
        die(); return;
    }
      // choque con cuerpo
    if(state.snake.some(s=>s.x===head.x && s.y===head.y)){
        die(); return;
    }
    state.snake.push(head);
      // si come
    if(state.food && head.x === state.food.x && head.y === state.food.y){
        state.score += 10;
        scoreEl.textContent = state.score;
        spawnFood();
    } else {
        // quitar cola
        state.snake.shift();
    }
}

function die(){
state.alive = false;
running = false;
// actualizar best
if(state.score > bestScore){
    bestScore = state.score;
    localStorage.setItem(STORAGE_KEY, String(bestScore));
    bestEl.textContent = bestScore;
}
// efecto visual: no bloqueante
    flashGameOver();
}

function flashGameOver(){
// pequeño parpadeo
    const orig = canvas.style.boxShadow;
    canvas.style.boxShadow = '0 0 0 6px rgba(255,0,64,0.08) inset';
    setTimeout(()=>{ canvas.style.boxShadow = orig; }, 400);
}

function draw(){
// fondo
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // grid opcional (ligero)
    // draw cells background
    ctx.fillStyle = '#06131a';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // dibujar comida
    if(state.food){
    drawCell(state.food.x, state.food.y, true);
}
// dibujar serpiente
for(let i=0;i<state.snake.length;i++){
    const s = state.snake[i];
    const head = (i===state.snake.length-1);
    drawCell(s.x,s.y, false, head);
}
    if(!state.alive){
    // overlay Game Over
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign='center';
    ctx.font = `${Math.floor(canvas.width*0.06)}px sans-serif`;
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 10);
    ctx.font = `${Math.floor(canvas.width*0.035)}px sans-serif`;
    ctx.fillText(`Puntaje: ${state.score}`, canvas.width/2, canvas.height/2 + 30);
}
}

function drawCell(x,y,isFood=false,isHead=false){
    const px = x * CELL;
    const py = y * CELL;
    const pad = Math.max(1, Math.floor(CELL*0.08));
if(isFood){
    // círculo
    ctx.fillStyle = '#ff5858';
    const cx = px + CELL/2;
    const cy = py + CELL/2;
    const r = CELL*0.34;
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
    // small shine
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc(cx - r*0.3, cy - r*0.35, r*0.18, 0, Math.PI*2); ctx.fill();
    return;
}
// snake body gradient
if(isHead){
        ctx.fillStyle = '#00ffd3';
} else {
        ctx.fillStyle = '#00a38e';
}
    roundRect(ctx, px+pad, py+pad, CELL - pad*2, CELL - pad*2, Math.max(3, CELL*0.08));
    ctx.fill();
}

// helper rounded rect
function roundRect(ctx,x,y,w,h,r){
ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

// Controles teclado
window.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') setDirection(0,-1);
    if(e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') setDirection(0,1);
    if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setDirection(-1,0);
    if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setDirection(1,0);
    if(e.key === 'p' || e.key === 'P') togglePause();
    if(e.key === 'r' || e.key === 'R') { stop(); resetGame(); start(); }
});

// Botones UI
startBtn.addEventListener('click', ()=>{ if(!running){ start(); } });
pauseBtn.addEventListener('click', ()=>{ togglePause(); });
resetBtn.addEventListener('click', ()=>{ stop(); resetGame(); draw(); });

speedInput.addEventListener('input', ()=>{ fps = parseInt(speedInput.value,10); speedVal.textContent = fps; });
gridInput.addEventListener('input', ()=>{ GRID = parseInt(gridInput.value,10); gridSizeVal.textContent = GRID; resizeCanvas(); resetGame(); draw(); });

function start(){
    if(!state.alive) resetGame();
    running = true; paused = false; lastTime = 0; accumulated = 0;
    requestAnimationFrame(loop);
}
function stop(){ running = false; }
function togglePause(){ paused = !paused; pauseBtn.textContent = paused ? 'Reanudar' : 'Pausa'; }

// Touch / swipe support para móvil
let touchStart = null;
canvas.addEventListener('touchstart', (e)=>{ const t = e.changedTouches[0]; touchStart = {x:t.clientX, y:t.clientY}; });
canvas.addEventListener('touchend', (e)=>{
    if(!touchStart) return; const t = e.changedTouches[0]; const dx = t.clientX - touchStart.x; const dy = t.clientY - touchStart.y; const adx = Math.abs(dx); const ady = Math.abs(dy);
    if(Math.max(adx,ady) < 20) return;
    if(adx > ady){ if(dx>0) setDirection(1,0); else setDirection(-1,0); }
    else { if(dy>0) setDirection(0,1); else setDirection(0,-1); }
    touchStart = null;
});

    // Inicial setup
function init(){
    speedVal.textContent = fps;
    gridSizeVal.textContent = GRID;
    resizeCanvas();
    resetGame();
    draw();
}

init();