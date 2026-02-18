/* ============================================================
   CatMaze – Pixel Maze Game Engine
   ============================================================ */

(() => {
"use strict";

/* ---------- constants ---------- */
const TILE  = 16;          // logical pixel-tile size
const SCALE = 2;           // render scale
const TS    = TILE * SCALE;// screen-tile size
const COLS  = 21;          // maze columns (odd for generator)
const ROWS  = 15;          // maze rows    (odd for generator)
const LIVES_START   = 3;
const TREAT_SCORE   = 100;
const GOLDEN_SCORE  = 500;
const INVULN_TIME   = 1500; // ms after hit
const GOLDEN_SPAWN_CHANCE = 0.008; // per frame

/* ---------- canvas setup ---------- */
const canvas = document.getElementById("game");
const ctx    = canvas.getContext("2d");
canvas.width  = COLS * TS;
canvas.height = ROWS * TS;

/* ---------- HUD elements ---------- */
const hudLives = document.getElementById("hud-lives");
const hudScore = document.getElementById("hud-score");
const hudLevel = document.getElementById("hud-level");

/* ============================================================
   PIXEL SPRITE DATA  (drawn procedurally – no external assets)
   ============================================================ */

function createSprite(w, h, painter) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d");
  painter(x, w, h);
  return c;
}

// ---- colours ----
const C = {
  catBody:   "#f5a623", catEar:    "#e08e1b", catEye:    "#2d2d2d",
  catNose:   "#ff6b8a", catWhisk:  "#ffffff",
  dogBody:   "#8b6914", dogEar:    "#6b4c0a", dogEye:    "#2d2d2d",
  dogNose:   "#2d2d2d", dogTongue: "#ff6b8a",
  golden:    "#ffd700", goldenEar: "#ffb300",
  treat:     "#ff8c42", treatHigh: "#ffe066",
  wall:      "#3a3a5c", wallHi:    "#4e4e72",
  floor:     "#1a1a2e", floorDot:  "#252540",
  heart:     "#ff4757", heartOff:  "#4a3040",
};

function px(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.fillRect(x*s, y*s, s, s); }

/* ---- cat sprite (16x16 logical, rendered at SCALE) ---- */
function drawCat(ctx, s, bodyCol, earCol) {
  // body
  for (let r = 5; r < 13; r++) for (let c = 4; c < 12; c++) px(ctx, c, r, s, bodyCol);
  // ears
  px(ctx,4,3,s,earCol); px(ctx,5,3,s,earCol); px(ctx,4,4,s,earCol); px(ctx,5,4,s,bodyCol);
  px(ctx,10,3,s,earCol); px(ctx,11,3,s,earCol); px(ctx,11,4,s,earCol); px(ctx,10,4,s,bodyCol);
  // head top
  for (let c = 5; c < 11; c++) px(ctx, c, 4, s, bodyCol);
  // eyes
  px(ctx,6,6,s,C.catEye); px(ctx,9,6,s,C.catEye);
  // nose
  px(ctx,7,8,s,C.catNose); px(ctx,8,8,s,C.catNose);
  // whiskers
  px(ctx,3,7,s,C.catWhisk); px(ctx,2,7,s,C.catWhisk);
  px(ctx,12,7,s,C.catWhisk); px(ctx,13,7,s,C.catWhisk);
  px(ctx,3,9,s,C.catWhisk); px(ctx,12,9,s,C.catWhisk);
  // feet
  px(ctx,5,13,s,"#fff"); px(ctx,6,13,s,"#fff");
  px(ctx,9,13,s,"#fff"); px(ctx,10,13,s,"#fff");
  // tail
  px(ctx,12,10,s,bodyCol); px(ctx,13,9,s,bodyCol); px(ctx,14,8,s,bodyCol);
}

const spriteCat = createSprite(TILE*SCALE, TILE*SCALE, (x) => drawCat(x, SCALE, C.catBody, C.catEar));

function drawCatFrame2(ctx, s, bodyCol, earCol) {
  // body
  for (let r = 5; r < 13; r++) for (let c = 4; c < 12; c++) px(ctx, c, r, s, bodyCol);
  // ears
  px(ctx,4,3,s,earCol); px(ctx,5,3,s,earCol); px(ctx,4,4,s,earCol); px(ctx,5,4,s,bodyCol);
  px(ctx,10,3,s,earCol); px(ctx,11,3,s,earCol); px(ctx,11,4,s,earCol); px(ctx,10,4,s,bodyCol);
  for (let c = 5; c < 11; c++) px(ctx, c, 4, s, bodyCol);
  // eyes (blink)
  px(ctx,6,6,s,C.catEye); px(ctx,7,6,s,C.catEye);
  px(ctx,9,6,s,C.catEye); px(ctx,8,6,s,C.catEye);
  // nose
  px(ctx,7,8,s,C.catNose); px(ctx,8,8,s,C.catNose);
  // whiskers
  px(ctx,3,8,s,C.catWhisk); px(ctx,2,8,s,C.catWhisk);
  px(ctx,12,8,s,C.catWhisk); px(ctx,13,8,s,C.catWhisk);
  // feet moved
  px(ctx,4,13,s,"#fff"); px(ctx,5,13,s,"#fff");
  px(ctx,10,13,s,"#fff"); px(ctx,11,13,s,"#fff");
  // tail
  px(ctx,12,11,s,bodyCol); px(ctx,13,10,s,bodyCol); px(ctx,14,9,s,bodyCol);
}
const spriteCat2 = createSprite(TILE*SCALE, TILE*SCALE, (x) => drawCatFrame2(x, SCALE, C.catBody, C.catEar));

/* ---- golden cat ---- */
const spriteGolden  = createSprite(TILE*SCALE, TILE*SCALE, (x) => drawCat(x, SCALE, C.golden, C.goldenEar));
const spriteGolden2 = createSprite(TILE*SCALE, TILE*SCALE, (x) => drawCatFrame2(x, SCALE, C.golden, C.goldenEar));

/* ---- dog sprite ---- */
function drawDog(ctx, s, frame) {
  const b = C.dogBody, e = C.dogEar;
  // body
  for (let r = 5; r < 13; r++) for (let c = 4; c < 12; c++) px(ctx, c, r, s, b);
  // head
  for (let c = 4; c < 12; c++) px(ctx, c, 4, s, b);
  // floppy ears
  px(ctx,3,5,s,e); px(ctx,3,6,s,e); px(ctx,3,7,s,e);
  px(ctx,12,5,s,e); px(ctx,12,6,s,e); px(ctx,12,7,s,e);
  // snout
  for (let c = 6; c < 10; c++) px(ctx, c, 8, s, "#c4a44a");
  for (let c = 6; c < 10; c++) px(ctx, c, 9, s, "#c4a44a");
  // eyes
  px(ctx,6,6,s,C.dogEye); px(ctx,9,6,s,C.dogEye);
  // nose
  px(ctx,7,8,s,C.dogNose); px(ctx,8,8,s,C.dogNose);
  // tongue
  if (frame === 1) { px(ctx,8,10,s,C.dogTongue); px(ctx,8,11,s,C.dogTongue); }
  // feet
  const fy = frame === 0 ? 13 : 13;
  const off = frame === 0 ? 0 : 1;
  px(ctx,5-off,fy,s,"#6b4c0a"); px(ctx,6-off,fy,s,"#6b4c0a");
  px(ctx,9+off,fy,s,"#6b4c0a"); px(ctx,10+off,fy,s,"#6b4c0a");
  // tail
  px(ctx,12,8-frame,s,b); px(ctx,13,7-frame,s,b);
}

const spriteDog1 = createSprite(TILE*SCALE, TILE*SCALE, (x) => drawDog(x, SCALE, 0));
const spriteDog2 = createSprite(TILE*SCALE, TILE*SCALE, (x) => drawDog(x, SCALE, 1));

/* ---- treat sprite ---- */
const spriteTreat = createSprite(TILE*SCALE, TILE*SCALE, (x, w, h) => {
  const s = SCALE;
  // fish-shaped treat
  px(x,6,5,s,C.treat); px(x,7,5,s,C.treat); px(x,8,5,s,C.treat); px(x,9,5,s,C.treat);
  px(x,5,6,s,C.treat); px(x,6,6,s,C.treatHigh); px(x,7,6,s,C.treatHigh); px(x,8,6,s,C.treat); px(x,9,6,s,C.treat); px(x,10,6,s,C.treat);
  px(x,5,7,s,C.treat); px(x,6,7,s,C.treat); px(x,7,7,s,C.treat); px(x,8,7,s,C.treat); px(x,9,7,s,C.treat); px(x,10,7,s,C.treat);
  px(x,5,8,s,C.treat); px(x,6,8,s,C.treat); px(x,7,8,s,C.treat); px(x,8,8,s,C.treat); px(x,9,8,s,C.treat); px(x,10,8,s,C.treat);
  px(x,6,9,s,C.treat); px(x,7,9,s,C.treat); px(x,8,9,s,C.treat); px(x,9,9,s,C.treat);
  // eye
  px(x,9,6,s,"#fff"); px(x,9,7,s,C.catEye);
  // tail fin
  px(x,3,6,s,C.treat); px(x,4,5,s,C.treat);
  px(x,3,8,s,C.treat); px(x,4,9,s,C.treat);
});

/* ---- heart sprite ---- */
function makeHeart(col) {
  return createSprite(12*SCALE, 12*SCALE, (x) => {
    const s = SCALE;
    const rows = [
      "  ##  ##  ",
      " ######## ",
      "##########",
      "##########",
      "##########",
      " ######## ",
      "  ######  ",
      "   ####   ",
      "    ##    ",
    ];
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '#') px(x, c+1, r+1, s, col);
      }
    });
  });
}
const spriteHeart    = makeHeart(C.heart);
const spriteHeartOff = makeHeart(C.heartOff);

/* ============================================================
   MAZE GENERATOR  (recursive back-tracker)
   ============================================================ */
function generateMaze(cols, rows) {
  // grid: 0 = wall, 1 = path
  const grid = Array.from({length: rows}, () => new Uint8Array(cols));
  const stack = [];
  const dirs = [[0,-2],[0,2],[-2,0],[2,0]];

  function inBounds(x, y) { return x > 0 && x < cols-1 && y > 0 && y < rows-1; }

  function shuffle(a) { for (let i = a.length-1; i > 0; i--) { const j = Math.random()*i+1|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }

  const sx = 1, sy = 1;
  grid[sy][sx] = 1;
  stack.push([sx, sy]);

  while (stack.length) {
    const [cx, cy] = stack[stack.length-1];
    const neighbours = [];
    for (const [dx, dy] of dirs) {
      const nx = cx+dx, ny = cy+dy;
      if (inBounds(nx, ny) && grid[ny][nx] === 0) neighbours.push([dx, dy, nx, ny]);
    }
    if (neighbours.length === 0) { stack.pop(); continue; }
    const [dx, dy, nx, ny] = shuffle(neighbours)[0];
    grid[cy + dy/2][cx + dx/2] = 1;
    grid[ny][nx] = 1;
    stack.push([nx, ny]);
  }

  // open a few extra passages for wider play
  for (let i = 0; i < Math.floor(cols * rows * 0.04); i++) {
    const rx = (Math.random()*(cols-4)|0)+2;
    const ry = (Math.random()*(rows-4)|0)+2;
    if (grid[ry][rx] === 0) {
      const wallNeighbors = [[1,0],[-1,0],[0,1],[0,-1]].filter(
        ([dx,dy]) => inBounds(rx+dx,ry+dy) && grid[ry+dy][rx+dx] === 1
      );
      if (wallNeighbors.length >= 2) grid[ry][rx] = 1;
    }
  }

  return grid;
}

/* ============================================================
   MARIO-STYLE BONUS LEVEL (platformer)
   ============================================================ */

const BONUS_COLS = 60;
const BONUS_ROWS = 15;
const GRAVITY    = 0.45;
const JUMP_VEL   = -7.5;
const PLAT_RUN   = 2.8;

function generateBonusLevel() {
  // simple platformer level data
  const tiles = Array.from({length: BONUS_ROWS}, () => new Uint8Array(BONUS_COLS));

  // ground
  for (let c = 0; c < BONUS_COLS; c++) { tiles[BONUS_ROWS-1][c] = 1; tiles[BONUS_ROWS-2][c] = 1; }

  // gaps
  const gaps = [];
  for (let i = 0; i < 5; i++) {
    const gx = 10 + i * 10 + (Math.random()*4|0);
    const gw = 2 + (Math.random()*2|0);
    gaps.push({x: gx, w: gw});
    for (let g = 0; g < gw; g++) { tiles[BONUS_ROWS-1][gx+g] = 0; tiles[BONUS_ROWS-2][gx+g] = 0; }
  }

  // platforms
  const platforms = [];
  for (let i = 0; i < 8; i++) {
    const px = 6 + i * 7 + (Math.random()*3|0);
    const py = BONUS_ROWS - 5 - (Math.random()*3|0);
    const pw = 3 + (Math.random()*3|0);
    platforms.push({x: px, y: py, w: pw});
    for (let c = 0; c < pw; c++) {
      if (px+c < BONUS_COLS) tiles[py][px+c] = 2; // platform brick
    }
  }

  // question blocks with treats
  const qblocks = [];
  for (let i = 0; i < 4; i++) {
    const bx = 8 + i * 13 + (Math.random()*5|0);
    const by = BONUS_ROWS - 7 - (Math.random()*2|0);
    if (bx < BONUS_COLS) { tiles[by][bx] = 3; qblocks.push({x: bx, y: by, hit: false}); }
  }

  // enemies (dogs)
  const enemies = [];
  for (let i = 0; i < 6; i++) {
    enemies.push({
      x: 12 + i * 9 + Math.random()*4,
      y: BONUS_ROWS - 3,
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random()*0.6),
      alive: true,
    });
  }

  // flag at end
  const flag = { x: BONUS_COLS - 3, y: BONUS_ROWS - 7 };

  return { tiles, enemies, qblocks, flag };
}

/* ---- bonus sprites ---- */
const spriteBrick = createSprite(TS, TS, (x) => {
  const s = SCALE;
  for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) {
    const isBorder = r===0||r===15||c===0||c===15|| (r===7&&(c<8))||(r===8&&(c>=8));
    px(x, c, r, s, isBorder ? "#8b4513" : "#cd853f");
  }
});

const spriteQBlock = createSprite(TS, TS, (x) => {
  const s = SCALE;
  for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) px(x, c, r, s, "#e6a817");
  // question mark
  [5,6,7,8,9,10].forEach(c => px(x,c,3,s,"#fff"));
  px(x,10,4,s,"#fff"); px(x,10,5,s,"#fff");
  [7,8,9,10].forEach(c => px(x,c,6,s,"#fff"));
  px(x,7,7,s,"#fff"); px(x,7,8,s,"#fff");
  px(x,7,10,s,"#fff"); px(x,8,10,s,"#fff");
});

const spriteQBlockHit = createSprite(TS, TS, (x) => {
  const s = SCALE;
  for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) px(x, c, r, s, "#8b7355");
});

const spriteGround = createSprite(TS, TS, (x) => {
  const s = SCALE;
  for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) {
    px(x, c, r, s, r < 3 ? "#4a8c3f" : "#8b6914");
  }
});

const spriteFlag = createSprite(TS, TS*4, (x) => {
  const s = SCALE;
  // pole
  for (let r = 0; r < 64; r++) { px(x,7,r,s,"#888"); px(x,8,r,s,"#888"); }
  // flag
  for (let r = 2; r < 14; r++) for (let c = 9; c < 15; c++) px(x,c,r,s,"#ff4757");
});

/* ============================================================
   SOUND (tiny synth – no audio files needed)
   ============================================================ */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function ensureAudio() { if (!audioCtx) audioCtx = new AudioCtx(); }

function playTone(freq, dur, type, vol) {
  try {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || "square";
    o.frequency.value = freq;
    g.gain.value = vol || 0.08;
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch(e) {}
}

function sfxTreat()   { playTone(660,0.1,"square"); setTimeout(()=>playTone(880,0.15,"square"),80); }
function sfxHurt()    { playTone(200,0.3,"sawtooth",0.1); }
function sfxGolden()  { playTone(880,0.1,"square"); setTimeout(()=>playTone(1100,0.1,"square"),80); setTimeout(()=>playTone(1320,0.15,"square"),160); }
function sfxJump()    { playTone(400,0.1,"square",0.06); }
function sfxStomp()   { playTone(160,0.15,"square",0.1); }
function sfxLevelUp() { [0,100,200,300].forEach((d,i)=>setTimeout(()=>playTone(440+i*110,0.15,"square"),d)); }
function sfxGameOver(){ [0,150,300].forEach((d,i)=>setTimeout(()=>playTone(300-i*60,0.25,"sawtooth",0.1),d)); }

/* ============================================================
   GAME STATE
   ============================================================ */
let state = "title"; // title | maze | bonus | gameover | levelcomplete | win
let maze, treats, dogs, goldenCat, player, level, score, lives;
let bonusData, bonusPlayer, bonusCamera;
let animFrame = 0;
let lastTime = 0;
let invulnTimer = 0;
let transitionTimer = 0;
let transitionText = "";
let touchDir = null;
const MAX_LEVEL = 6;

/* ---- input ---- */
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
  if (state === "title" && (e.key === "Enter" || e.key === " ")) startGame();
  if (state === "gameover" && (e.key === "Enter" || e.key === " ")) startGame();
  if (state === "win" && (e.key === "Enter" || e.key === " ")) startGame();
});
window.addEventListener("keyup", e => { keys[e.key] = false; });

/* ---- touch / mobile controls ---- */
document.querySelectorAll("#mobile-controls button").forEach(btn => {
  const dir = btn.dataset.dir;
  const onDown = () => {
    touchDir = dir;
    if (state === "title" || state === "gameover" || state === "win") startGame();
  };
  btn.addEventListener("touchstart", e => { e.preventDefault(); onDown(); });
  btn.addEventListener("mousedown", e => { e.preventDefault(); onDown(); });
});
window.addEventListener("touchend", () => { touchDir = null; });
window.addEventListener("mouseup", () => { touchDir = null; });

/* ---- swipe detection ---- */
let swipeStart = null;
canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  swipeStart = { x: t.clientX, y: t.clientY };
  if (state === "title" || state === "gameover" || state === "win") startGame();
});
canvas.addEventListener("touchmove", e => { e.preventDefault(); }, { passive: false });
canvas.addEventListener("touchend", e => {
  if (!swipeStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - swipeStart.x;
  const dy = t.clientY - swipeStart.y;
  if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
    if (Math.abs(dx) > Math.abs(dy)) touchDir = dx > 0 ? "right" : "left";
    else touchDir = dy > 0 ? "down" : "up";
    setTimeout(() => { touchDir = null; }, 150);
  }
  swipeStart = null;
});

/* ============================================================
   GAME INIT & LEVEL SETUP
   ============================================================ */

function startGame() {
  level = 1; score = 0; lives = LIVES_START;
  startMazeLevel();
}

function startMazeLevel() {
  state = "maze";
  maze = generateMaze(COLS, ROWS);

  // place treats on open cells
  treats = [];
  for (let r = 1; r < ROWS-1; r++) {
    for (let c = 1; c < COLS-1; c++) {
      if (maze[r][c] === 1 && !(r===1 && c===1) && Math.random() < 0.3) {
        treats.push({ x: c, y: r, collected: false });
      }
    }
  }

  // place dogs
  dogs = [];
  const dogCount = Math.min(2 + level, 8);
  for (let i = 0; i < dogCount; i++) {
    let dx, dy;
    do {
      dx = (Math.random()*(COLS-4)|0)+2;
      dy = (Math.random()*(ROWS-4)|0)+2;
    } while (maze[dy][dx] !== 1 || (dx < 4 && dy < 4));
    dogs.push({ x: dx, y: dy, dir: Math.random()*4|0, moveTimer: 0, frame: 0 });
  }

  goldenCat = null;
  player = { x: 1, y: 1, dir: 0, frame: 0, moveTimer: 0 };
  invulnTimer = 0;

  showTransition("Level " + level);
}

function showTransition(text) {
  transitionText = text;
  transitionTimer = 1500;
}

/* ============================================================
   MAZE UPDATE
   ============================================================ */

const MOVE_DELAY = 120; // ms between grid moves

function getDir() {
  if (keys["ArrowUp"]    || keys["w"] || keys["W"] || touchDir === "up")    return 0;
  if (keys["ArrowDown"]  || keys["s"] || keys["S"] || touchDir === "down")  return 1;
  if (keys["ArrowLeft"]  || keys["a"] || keys["A"] || touchDir === "left")  return 2;
  if (keys["ArrowRight"] || keys["d"] || keys["D"] || touchDir === "right") return 3;
  return -1;
}
const DX = [0,0,-1,1];
const DY = [-1,1,0,0];

function updateMaze(dt) {
  animFrame += dt;
  if (invulnTimer > 0) invulnTimer -= dt;

  // player movement
  player.moveTimer -= dt;
  if (player.moveTimer <= 0) {
    const d = getDir();
    if (d >= 0) {
      const nx = player.x + DX[d];
      const ny = player.y + DY[d];
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && maze[ny][nx] === 1) {
        player.x = nx; player.y = ny; player.dir = d;
        player.frame = 1 - player.frame;
      }
    }
    player.moveTimer = MOVE_DELAY;
  }

  // treat collection
  for (const t of treats) {
    if (!t.collected && t.x === player.x && t.y === player.y) {
      t.collected = true; score += TREAT_SCORE; sfxTreat();
    }
  }

  // golden cat spawn
  if (!goldenCat && Math.random() < GOLDEN_SPAWN_CHANCE) {
    let gx, gy;
    do { gx = (Math.random()*(COLS-4)|0)+2; gy = (Math.random()*(ROWS-4)|0)+2; }
    while (maze[gy][gx] !== 1 || (Math.abs(gx-player.x)+Math.abs(gy-player.y) < 5));
    goldenCat = { x: gx, y: gy, dir: Math.random()*4|0, moveTimer: 0, frame: 0, ttl: 8000 };
    sfxGolden();
  }

  // golden cat movement
  if (goldenCat) {
    goldenCat.ttl -= dt;
    goldenCat.moveTimer -= dt;
    if (goldenCat.ttl <= 0) { goldenCat = null; }
    else if (goldenCat.moveTimer <= 0) {
      // move golden cat randomly (fast)
      const dirs = [0,1,2,3].sort(() => Math.random()-0.5);
      for (const d of dirs) {
        const nx = goldenCat.x + DX[d], ny = goldenCat.y + DY[d];
        if (nx>=0 && nx<COLS && ny>=0 && ny<ROWS && maze[ny][nx]===1) {
          goldenCat.x = nx; goldenCat.y = ny; goldenCat.dir = d;
          goldenCat.frame = 1 - goldenCat.frame;
          break;
        }
      }
      goldenCat.moveTimer = 80;
    }

    // catch golden cat
    if (goldenCat && goldenCat.x === player.x && goldenCat.y === player.y) {
      score += GOLDEN_SCORE; sfxGolden();
      goldenCat = null;
      startBonusLevel();
      return;
    }
  }

  // dog movement
  for (const dog of dogs) {
    dog.moveTimer -= dt;
    if (dog.moveTimer <= 0) {
      // try to move toward player with some randomness
      const pdx = player.x - dog.x, pdy = player.y - dog.y;
      let preferred = [];
      if (Math.abs(pdx) > Math.abs(pdy)) { preferred = pdx > 0 ? [3,0,1,2] : [2,0,1,3]; }
      else { preferred = pdy > 0 ? [1,2,3,0] : [0,2,3,1]; }
      // add randomness
      if (Math.random() < 0.35) preferred = preferred.sort(() => Math.random()-0.5);

      for (const d of preferred) {
        const nx = dog.x + DX[d], ny = dog.y + DY[d];
        if (nx>=0 && nx<COLS && ny>=0 && ny<ROWS && maze[ny][nx]===1) {
          dog.x = nx; dog.y = ny; dog.dir = d;
          dog.frame = 1 - dog.frame;
          break;
        }
      }
      dog.moveTimer = Math.max(200 - level * 15, 100);
    }

    // collision with player
    if (dog.x === player.x && dog.y === player.y && invulnTimer <= 0) {
      lives--;
      invulnTimer = INVULN_TIME;
      sfxHurt();
      // push player back
      player.x = 1; player.y = 1;
      if (lives <= 0) { state = "gameover"; sfxGameOver(); return; }
    }
  }

  // level complete check
  if (treats.every(t => t.collected)) {
    sfxLevelUp();
    if (level >= MAX_LEVEL) { state = "win"; return; }
    level++;
    startMazeLevel();
  }
}

/* ============================================================
   BONUS LEVEL UPDATE (Mario-style platformer)
   ============================================================ */
function startBonusLevel() {
  state = "bonus";
  bonusData = generateBonusLevel();
  bonusPlayer = { x: 2*TILE, y: (BONUS_ROWS-3)*TILE, vx: 0, vy: 0, onGround: false, frame: 0, dir: 1, alive: true };
  bonusCamera = { x: 0 };
  showTransition("Bonus Level!");
}

function bonusSolid(tx, ty) {
  if (ty < 0 || ty >= BONUS_ROWS || tx < 0 || tx >= BONUS_COLS) return ty >= BONUS_ROWS - 2;
  const t = bonusData.tiles[ty][tx];
  return t === 1 || t === 2 || t === 3;
}

function updateBonus(dt) {
  if (!bonusPlayer.alive) return;

  animFrame += dt;
  const p = bonusPlayer;

  // input
  const left  = keys["ArrowLeft"]  || keys["a"] || keys["A"] || touchDir === "left";
  const right = keys["ArrowRight"] || keys["d"] || keys["D"] || touchDir === "right";
  const jump  = keys["ArrowUp"]    || keys["w"] || keys["W"] || keys[" "] || touchDir === "up";

  if (left)       { p.vx = -PLAT_RUN; p.dir = -1; }
  else if (right) { p.vx =  PLAT_RUN; p.dir = 1; }
  else            { p.vx *= 0.7; if (Math.abs(p.vx) < 0.1) p.vx = 0; }

  if (jump && p.onGround) { p.vy = JUMP_VEL; p.onGround = false; sfxJump(); }

  // gravity
  p.vy += GRAVITY;
  if (p.vy > 10) p.vy = 10;

  // move X
  p.x += p.vx;
  const tileL = Math.floor(p.x / TILE);
  const tileR = Math.floor((p.x + TILE - 1) / TILE);
  const tileT = Math.floor(p.y / TILE);
  const tileB = Math.floor((p.y + TILE - 1) / TILE);

  if (p.vx < 0 && (bonusSolid(tileL, tileT) || bonusSolid(tileL, tileB))) {
    p.x = (tileL + 1) * TILE; p.vx = 0;
  }
  if (p.vx > 0 && (bonusSolid(tileR, tileT) || bonusSolid(tileR, tileB))) {
    p.x = tileR * TILE - TILE; p.vx = 0;
  }

  // move Y
  p.y += p.vy;
  const ntileT = Math.floor(p.y / TILE);
  const ntileB = Math.floor((p.y + TILE - 1) / TILE);
  const ntileL = Math.floor(p.x / TILE);
  const ntileR = Math.floor((p.x + TILE - 1) / TILE);

  p.onGround = false;
  if (p.vy > 0 && (bonusSolid(ntileL, ntileB) || bonusSolid(ntileR, ntileB))) {
    p.y = ntileB * TILE - TILE; p.vy = 0; p.onGround = true;
  }
  if (p.vy < 0 && (bonusSolid(ntileL, ntileT) || bonusSolid(ntileR, ntileT))) {
    p.y = (ntileT + 1) * TILE; p.vy = 0;
    // check question blocks
    for (const qb of bonusData.qblocks) {
      if (!qb.hit && (ntileL === qb.x || ntileR === qb.x) && ntileT === qb.y) {
        qb.hit = true; score += TREAT_SCORE; sfxTreat();
      }
    }
  }

  // fall into pit
  if (p.y > BONUS_ROWS * TILE) {
    lives--;
    sfxHurt();
    if (lives <= 0) { state = "gameover"; sfxGameOver(); return; }
    p.x = 2*TILE; p.y = (BONUS_ROWS-3)*TILE; p.vx = 0; p.vy = 0;
  }

  // animation
  if (Math.abs(p.vx) > 0.5) p.frame = (animFrame / 150 | 0) % 2;
  else p.frame = 0;

  // enemy update
  for (const e of bonusData.enemies) {
    if (!e.alive) continue;
    e.x += e.vx;
    const etx = Math.floor(e.x / TILE);
    const ety = Math.floor(e.y / TILE);
    // reverse at walls
    if (bonusSolid(etx, ety) || !bonusSolid(etx, ety+1)) e.vx *= -1;
    if (e.x < 0) { e.x = 0; e.vx *= -1; }

    // collision with player
    const dx = Math.abs((p.x + TILE/2) - (e.x + TILE/2));
    const dy = Math.abs((p.y + TILE/2) - (e.y + TILE/2));
    if (dx < TILE * 0.7 && dy < TILE * 0.7) {
      if (p.vy > 0 && p.y < e.y) {
        // stomp!
        e.alive = false; p.vy = JUMP_VEL * 0.6; score += 200; sfxStomp();
      } else if (invulnTimer <= 0) {
        lives--; invulnTimer = INVULN_TIME; sfxHurt();
        p.vy = JUMP_VEL * 0.5; p.vx = p.x < e.x ? -3 : 3;
        if (lives <= 0) { state = "gameover"; sfxGameOver(); return; }
      }
    }
  }
  if (invulnTimer > 0) invulnTimer -= dt;

  // camera
  bonusCamera.x = Math.max(0, Math.min(p.x - canvas.width/(2*SCALE) + TILE/2, BONUS_COLS*TILE - canvas.width/SCALE));

  // reach flag
  const flagX = bonusData.flag.x * TILE;
  if (p.x + TILE > flagX && p.x < flagX + TILE) {
    score += 1000;
    sfxLevelUp();
    // return to maze
    if (level >= MAX_LEVEL) { state = "win"; }
    else { level++; startMazeLevel(); }
  }
}

/* ============================================================
   RENDER – MAZE
   ============================================================ */
function drawMaze() {
  // floor & walls
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const sx = c * TS, sy = r * TS;
      if (maze[r][c] === 0) {
        ctx.fillStyle = C.wall;
        ctx.fillRect(sx, sy, TS, TS);
        // wall highlight
        ctx.fillStyle = C.wallHi;
        ctx.fillRect(sx, sy, TS, 2*SCALE);
        ctx.fillRect(sx, sy, 2*SCALE, TS);
      } else {
        ctx.fillStyle = C.floor;
        ctx.fillRect(sx, sy, TS, TS);
        // subtle dot pattern
        if ((r+c) % 2 === 0) {
          ctx.fillStyle = C.floorDot;
          ctx.fillRect(sx + TS/2 - SCALE, sy + TS/2 - SCALE, SCALE*2, SCALE*2);
        }
      }
    }
  }

  // exit indicator (bottom-right open cell)
  // treats
  for (const t of treats) {
    if (!t.collected) ctx.drawImage(spriteTreat, t.x * TS, t.y * TS);
  }

  // golden cat
  if (goldenCat) {
    const gs = goldenCat.frame === 0 ? spriteGolden : spriteGolden2;
    // shimmer effect
    if ((animFrame / 100 | 0) % 2 === 0) {
      ctx.globalAlpha = 0.7 + Math.sin(animFrame/80)*0.3;
    }
    ctx.drawImage(gs, goldenCat.x * TS, goldenCat.y * TS);
    ctx.globalAlpha = 1;
  }

  // dogs
  for (const dog of dogs) {
    const ds = dog.frame === 0 ? spriteDog1 : spriteDog2;
    ctx.drawImage(ds, dog.x * TS, dog.y * TS);
  }

  // player
  const blink = invulnTimer > 0 && ((animFrame / 80 | 0) % 2 === 0);
  if (!blink) {
    const cs = player.frame === 0 ? spriteCat : spriteCat2;
    ctx.drawImage(cs, player.x * TS, player.y * TS);
  }
}

/* ============================================================
   RENDER – BONUS LEVEL
   ============================================================ */
function drawBonus() {
  ctx.save();
  ctx.scale(SCALE, SCALE);
  ctx.translate(-bonusCamera.x, 0);

  // sky
  ctx.fillStyle = "#5c94fc";
  ctx.fillRect(bonusCamera.x, 0, canvas.width/SCALE, canvas.height/SCALE);

  // clouds
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 8; i++) {
    const cx = i * 120 + 30;
    const cy = 20 + (i%3)*15;
    ctx.fillRect(cx, cy, 30, 8);
    ctx.fillRect(cx+8, cy-6, 14, 6);
  }

  // tiles
  for (let r = 0; r < BONUS_ROWS; r++) {
    for (let c = 0; c < BONUS_COLS; c++) {
      const t = bonusData.tiles[r][c];
      const sx = c * TILE, sy = r * TILE;
      if (t === 1) ctx.drawImage(spriteGround, 0, 0, TS, TS, sx, sy, TILE, TILE);
      else if (t === 2) ctx.drawImage(spriteBrick, 0, 0, TS, TS, sx, sy, TILE, TILE);
      else if (t === 3) {
        const qb = bonusData.qblocks.find(q => q.x === c && q.y === r);
        const spr = (qb && qb.hit) ? spriteQBlockHit : spriteQBlock;
        ctx.drawImage(spr, 0, 0, TS, TS, sx, sy, TILE, TILE);
      }
    }
  }

  // flag
  ctx.drawImage(spriteFlag, 0, 0, TS, TS*4, bonusData.flag.x * TILE, bonusData.flag.y * TILE, TILE, TILE*4);

  // enemies
  for (const e of bonusData.enemies) {
    if (!e.alive) continue;
    const f = (animFrame/200|0)%2;
    ctx.drawImage(f===0 ? spriteDog1 : spriteDog2, 0, 0, TS, TS, e.x, e.y, TILE, TILE);
  }

  // player
  const bp = bonusPlayer;
  const blink = invulnTimer > 0 && ((animFrame/80|0)%2===0);
  if (!blink) {
    const f = bp.frame === 0 ? spriteCat : spriteCat2;
    ctx.save();
    if (bp.dir < 0) {
      ctx.translate(bp.x + TILE, bp.y);
      ctx.scale(-1, 1);
      ctx.drawImage(f, 0, 0, TS, TS, 0, 0, TILE, TILE);
    } else {
      ctx.drawImage(f, 0, 0, TS, TS, bp.x, bp.y, TILE, TILE);
    }
    ctx.restore();
  }

  ctx.restore();
}

/* ============================================================
   RENDER – HUD & SCREENS
   ============================================================ */
function drawHUD() {
  // hearts
  hudLives.innerHTML = "";
  for (let i = 0; i < LIVES_START; i++) {
    const img = i < lives ? spriteHeart : spriteHeartOff;
    hudLives.innerHTML += `<img src="${img.toDataURL()}" style="width:20px;height:20px;margin-right:2px;image-rendering:pixelated;">`;
  }
  hudScore.textContent = "Score: " + score;
  hudLevel.textContent = state === "bonus" ? "BONUS" : "Lvl " + level;
}

function drawTextScreen(title, sub) {
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd700";
  ctx.font = `bold ${24*SCALE}px monospace`;
  ctx.fillText(title, canvas.width/2, canvas.height/2 - 20*SCALE);
  ctx.fillStyle = "#fff";
  ctx.font = `${10*SCALE}px monospace`;
  ctx.fillText(sub, canvas.width/2, canvas.height/2 + 16*SCALE);
}

function drawTitle() {
  ctx.fillStyle = C.floor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // animated background tiles
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if ((r+c+(animFrame/500|0)) % 4 === 0) {
        ctx.fillStyle = C.floorDot;
        ctx.fillRect(c*TS, r*TS, TS, TS);
      }
    }
  }

  // big cat
  ctx.drawImage(spriteCat, canvas.width/2 - TS*1.5, canvas.height/2 - TS*3, TS*3, TS*3);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd700";
  ctx.font = `bold ${28*SCALE}px monospace`;
  ctx.fillText("CatMaze", canvas.width/2, canvas.height/2 + 10*SCALE);

  ctx.fillStyle = "#ff8c42";
  ctx.font = `${9*SCALE}px monospace`;
  ctx.fillText("Find all the treats! Avoid the dogs!", canvas.width/2, canvas.height/2 + 30*SCALE);

  ctx.fillStyle = "#fff";
  ctx.font = `${10*SCALE}px monospace`;
  const startText = ('ontouchstart' in window) ? "Tap to Start" : "Press ENTER to Start";
  // blink
  if ((animFrame/500|0)%2===0) ctx.fillText(startText, canvas.width/2, canvas.height/2 + 52*SCALE);
}

function drawTransition() {
  if (transitionTimer > 0) {
    const alpha = Math.min(1, transitionTimer / 500);
    ctx.fillStyle = `rgba(0,0,0,${alpha * 0.8})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700";
    ctx.font = `bold ${20*SCALE}px monospace`;
    ctx.fillText(transitionText, canvas.width/2, canvas.height/2);
  }
}

/* ============================================================
   GAME LOOP
   ============================================================ */
function gameLoop(time) {
  const dt = Math.min(time - lastTime, 50);
  lastTime = time;

  // update
  if (transitionTimer > 0) {
    transitionTimer -= dt;
  } else {
    if (state === "maze") updateMaze(dt);
    else if (state === "bonus") updateBonus(dt);
  }

  // render
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state === "title") {
    drawTitle();
  } else if (state === "maze") {
    drawMaze();
    drawHUD();
  } else if (state === "bonus") {
    drawBonus();
    drawHUD();
  } else if (state === "gameover") {
    if (bonusData && bonusPlayer) drawBonus(); else drawMaze();
    drawTextScreen("GAME OVER", "Score: " + score + " | Press ENTER to retry");
  } else if (state === "win") {
    drawMaze();
    drawTextScreen("YOU WIN!", "Final Score: " + score + " | Press ENTER to play again");
  }

  drawTransition();
  requestAnimationFrame(gameLoop);
}

/* ---- auto-resize canvas display ---- */
function resize() {
  const container = document.getElementById("game-container");
  const maxW = container.clientWidth - 20;
  const maxH = container.clientHeight - 80;
  const scaleX = maxW / canvas.width;
  const scaleY = maxH / canvas.height;
  const s = Math.min(scaleX, scaleY, 3);
  canvas.style.width  = (canvas.width * s) + "px";
  canvas.style.height = (canvas.height * s) + "px";
}
window.addEventListener("resize", resize);
resize();

/* ---- kick off ---- */
requestAnimationFrame(gameLoop);

})();
