// ============================================================
// 피클 도망가! - 귀여운 픽셀 서바이벌 게임
// ============================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// 내부 논리 해상도 (작게 그려서 픽셀 느낌을 낸다)
const VW = 180; // virtual width
const VH = 280; // virtual height
const SCALE = canvas.width / VW; // = 2

// ---------------- 픽셀 스프라이트: 공용 그리드 ----------------
// 각 그리드는 8x8, 숫자는 팔레트 인덱스 (0 = 투명). 팔레트만 바꿔서 여러 테마에 재사용한다.

const roundGrid = [
  [0,0,1,1,1,1,0,0],
  [0,1,2,2,2,2,1,0],
  [1,2,3,2,2,3,2,1],
  [1,2,2,4,2,2,2,1],
  [1,2,2,2,4,2,2,1],
  [0,1,2,2,2,2,1,0],
  [0,0,1,2,2,1,0,0],
  [0,0,0,1,1,0,0,0],
];

const spikyGrid = [
  [0,0,0,1,1,0,0,0],
  [0,1,1,2,2,1,1,0],
  [0,1,2,3,3,2,1,0],
  [1,2,3,3,3,3,2,1],
  [1,2,3,3,3,3,2,1],
  [0,1,2,3,3,2,1,0],
  [0,1,1,2,2,1,1,0],
  [0,0,0,1,1,0,0,0],
];

const jellyGrid = [
  [0,0,1,1,1,1,0,0],
  [0,1,2,2,2,2,1,0],
  [1,2,2,3,3,2,2,1],
  [1,2,2,2,2,2,2,1],
  [0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0],
  [0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0],
];

// ---------------- 캐릭터 스프라이트 (테마별) ----------------

const bunnySprite = {
  grid: [
    [0,1,0,0,0,0,1,0],
    [0,1,2,0,0,2,1,0],
    [1,2,2,1,1,2,2,1],
    [1,2,4,2,2,4,2,1],
    [1,2,2,5,5,2,2,1],
    [1,2,2,2,2,2,2,1],
    [1,3,2,2,2,2,3,1],
    [0,1,1,0,0,1,1,0],
  ],
  palette: { 1: '#4a3f35', 2: '#fff3e0', 3: '#ffd9a0', 4: '#3a2a20', 5: '#ff8fa3' },
};

const fishSprite = {
  grid: [
    [0,0,1,1,1,1,0,0],
    [3,1,2,2,2,2,1,0],
    [3,3,2,4,2,2,1,0],
    [3,1,2,2,2,2,1,0],
    [0,1,2,5,2,2,1,0],
    [0,1,2,2,2,2,1,0],
    [0,0,1,2,2,1,0,0],
    [0,0,0,1,1,0,0,0],
  ],
  palette: { 1: '#1f4a5e', 2: '#8fe0ff', 3: '#4fa8d9', 4: '#16242c', 5: '#ffc9d9' },
};

const alienSprite = {
  grid: [
    [0,6,0,0,0,0,6,0],
    [0,1,2,0,0,2,1,0],
    [1,2,2,1,1,2,2,1],
    [1,2,4,4,4,4,2,1],
    [1,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,1],
    [1,3,2,2,2,2,3,1],
    [0,1,1,0,0,1,1,0],
  ],
  palette: { 1: '#1f3d2b', 2: '#8ee6a8', 3: '#5fcf85', 4: '#16211a', 6: '#ff8fe0' },
};

// ---------------- 테마 정의 (배경 + 캐릭터 + 장애물 + 장식) ----------------

const THEMES = {
  grass: {
    name: '초원',
    skyTop: '#bfeaff', skyBottom: '#eaf9ff',
    groundTop: '#8fd68f', groundMid: '#6fc26f', groundBottom: '#7a5a44',
    decor: 'cloud',
    character: bunnySprite,
    obstacles: [
      { grid: roundGrid, palette: { 1: '#4a3f35', 2: '#8a7866', 3: '#a8977f', 4: '#5c4f42' } },
      { grid: spikyGrid, palette: { 1: '#4a3f35', 2: '#8f6fb3', 3: '#b98fe0' } },
    ],
  },
  sea: {
    name: '바다',
    skyTop: '#1c6fa8', skyBottom: '#4fb3d9',
    groundTop: '#e8d18a', groundMid: '#d9bd6e', groundBottom: '#c9a866',
    decor: 'bubble',
    character: fishSprite,
    obstacles: [
      { grid: jellyGrid, palette: { 1: '#6a3f8f', 2: '#d9a8ff', 3: '#f0c9ff' } },
      { grid: spikyGrid, palette: { 1: '#1a0f24', 2: '#3a2350', 3: '#6a3f8f' } },
    ],
  },
  space: {
    name: '우주',
    skyTop: '#05010f', skyBottom: '#1a1035',
    groundTop: '#9a9aa8', groundMid: '#7f7f8f', groundBottom: '#5c5c68',
    decor: 'star',
    character: alienSprite,
    obstacles: [
      { grid: roundGrid, palette: { 1: '#2b2b33', 2: '#7a7a85', 3: '#9a9aa8', 4: '#55555f' } },
      { grid: spikyGrid, palette: { 1: '#2b4a5e', 2: '#d9f7ff', 3: '#8fe0ff' } },
    ],
  },
};

function drawSprite(targetCtx, sprite, x, y, size) {
  const cell = size / 8;
  const { grid, palette } = sprite;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const v = grid[row][col];
      if (v === 0) continue;
      targetCtx.fillStyle = palette[v];
      targetCtx.fillRect(
        Math.round(x + col * cell),
        Math.round(y + row * cell),
        Math.ceil(cell),
        Math.ceil(cell)
      );
    }
  }
}

// ---------------- 게임 상태 ----------------

const GROUND_H = 28;
const PLAYER_SIZE = 22;
const PLAYER_SPEED = 110; // px/sec (virtual)

let state = 'start'; // 'start' | 'playing' | 'gameover'
let elapsed = 0;
let best = Number(localStorage.getItem('pickle_best') || 0);

let selectedThemeId = localStorage.getItem('pickle_theme') || 'grass';
let currentTheme = THEMES[selectedThemeId];

let player = {
  x: VW / 2 - PLAYER_SIZE / 2,
  y: VH - GROUND_H - PLAYER_SIZE,
  vx: 0,
};

let obstacles = [];
let spawnTimer = 0;
let bobTimer = 0;
let particles = [];

const keys = { left: false, right: false };

function resetGame() {
  elapsed = 0;
  obstacles = [];
  spawnTimer = 0;
  player.x = VW / 2 - PLAYER_SIZE / 2;
  initParticles(currentTheme.decor);
}

function initParticles(decor) {
  particles = [];
  if (decor === 'cloud') {
    for (let i = 0; i < 4; i++) {
      particles.push({
        kind: 'cloud',
        x: Math.random() * VW,
        y: 10 + Math.random() * 80,
        w: 24 + Math.random() * 16,
        speed: 4 + Math.random() * 6,
      });
    }
  } else if (decor === 'bubble') {
    for (let i = 0; i < 10; i++) {
      particles.push({
        kind: 'bubble',
        x: Math.random() * VW,
        y: Math.random() * (VH - GROUND_H),
        r: 2 + Math.random() * 3,
        speed: 10 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
      });
    }
  } else if (decor === 'star') {
    for (let i = 0; i < 18; i++) {
      particles.push({
        kind: 'star',
        x: Math.random() * VW,
        y: Math.random() * (VH - GROUND_H - 20),
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 2 + Math.random() * 3,
      });
    }
    particles.push({ kind: 'planet', x: Math.random() * VW, y: 20 + Math.random() * 30, r: 11, speed: 3, color: '#ff9f6b' });
  }
}

// ---------------- 난이도 스케일링 ----------------
function getSpawnInterval(t) {
  return Math.max(0.28, 0.85 - t * 0.012); // 시간이 지날수록 더 자주 스폰
}
function getFallSpeed(t) {
  return 55 + t * 4.2; // 시간이 지날수록 더 빨리 낙하
}

// ---------------- 테마 적용 / 미리보기 ----------------

function applyTheme(id) {
  selectedThemeId = id;
  currentTheme = THEMES[id];
  localStorage.setItem('pickle_theme', id);
}

function drawThemePreview(targetCanvas, themeId) {
  const pctx = targetCanvas.getContext('2d');
  pctx.imageSmoothingEnabled = false;
  const w = targetCanvas.width, h = targetCanvas.height;
  const theme = THEMES[themeId];

  const grad = pctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, theme.skyTop);
  grad.addColorStop(1, theme.skyBottom);
  pctx.fillStyle = grad;
  pctx.fillRect(0, 0, w, h);

  pctx.fillStyle = theme.groundTop;
  pctx.fillRect(0, h - 12, w, 12);

  const size = Math.round(w * 0.62);
  drawSprite(pctx, theme.character, (w - size) / 2, (h - size) / 2 - 4, size);
}

function refreshStartPreview() {
  drawThemePreview(document.getElementById('start-preview'), selectedThemeId);
  document.getElementById('start-theme-name').textContent = currentTheme.name;
}

function refreshThemeCards() {
  document.querySelectorAll('.theme-card').forEach((card) => {
    const id = card.dataset.theme;
    drawThemePreview(card.querySelector('canvas'), id);
    card.classList.toggle('selected', id === selectedThemeId);
  });
}

// ---------------- 입력 ----------------
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
  if (e.key === ' ' || e.key === 'Enter') {
    if (state === 'start') startGame();
    else if (state === 'gameover') startGame();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('home-btn').addEventListener('click', goHome);

document.getElementById('customize-btn').addEventListener('click', () => {
  refreshThemeCards();
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('customize-screen').classList.remove('hidden');
});

document.getElementById('customize-back-btn').addEventListener('click', () => {
  document.getElementById('customize-screen').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
  refreshStartPreview();
});

document.querySelectorAll('.theme-card').forEach((card) => {
  card.addEventListener('click', () => {
    applyTheme(card.dataset.theme);
    refreshThemeCards();
  });
});

function startGame() {
  resetGame();
  state = 'playing';
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
}

function goHome() {
  state = 'start';
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('customize-screen').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
  refreshStartPreview();
  initParticles(currentTheme.decor); // 홈 화면 뒤에서도 장식이 자연스럽게 보이도록
}

function gameOver() {
  state = 'gameover';
  if (elapsed > best) {
    best = elapsed;
    localStorage.setItem('pickle_best', String(best));
  }
  document.getElementById('final-time').textContent = elapsed.toFixed(1);
  document.getElementById('final-best').textContent = best.toFixed(1);
  document.getElementById('gameover-screen').classList.remove('hidden');
}

// ---------------- 스폰 ----------------

function spawnObstacle() {
  const size = 16 + Math.random() * 10;
  const pool = currentTheme.obstacles;
  const sprite = pool[Math.floor(Math.random() * pool.length)];
  obstacles.push({
    x: Math.random() * (VW - size),
    y: -size,
    size,
    speed: getFallSpeed(elapsed) * (0.85 + Math.random() * 0.3),
    sprite,
  });
}

// ---------------- 업데이트 ----------------
let lastTime = performance.now();

function updateParticles(dt) {
  particles.forEach((p) => {
    if (p.kind === 'cloud') {
      p.x += p.speed * dt;
      if (p.x > VW + p.w) p.x = -p.w;
    } else if (p.kind === 'bubble') {
      p.y -= p.speed * dt;
      p.phase += dt * 2;
      if (p.y < -6) {
        p.y = VH - GROUND_H + 6;
        p.x = Math.random() * VW;
      }
    } else if (p.kind === 'star') {
      p.phase += dt * p.twinkleSpeed;
    } else if (p.kind === 'planet') {
      p.x += p.speed * dt;
      if (p.x > VW + p.r * 2) p.x = -p.r * 2;
    }
  });
}

function update(dt) {
  updateParticles(dt);
  if (state !== 'playing') return;

  elapsed += dt;
  bobTimer += dt;

  // 플레이어 이동
  player.vx = 0;
  if (keys.left) player.vx -= PLAYER_SPEED;
  if (keys.right) player.vx += PLAYER_SPEED;
  player.x += player.vx * dt;
  player.x = Math.max(2, Math.min(VW - PLAYER_SIZE - 2, player.x));

  // 장애물 스폰
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = getSpawnInterval(elapsed);
  }

  // 장애물 이동 + 충돌 체크
  const pad = 4; // 살짝 관대한 히트박스
  const pl = player.x + pad, pr = player.x + PLAYER_SIZE - pad;
  const pt = player.y + pad, pb = player.y + PLAYER_SIZE - pad;

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += o.speed * dt;

    const ol = o.x + pad, or_ = o.x + o.size - pad;
    const ot = o.y + pad, ob = o.y + o.size - pad;

    const hit = pl < or_ && pr > ol && pt < ob && pb > ot;
    if (hit) {
      gameOver();
      return;
    }

    if (o.y > VH + 20) {
      obstacles.splice(i, 1);
    }
  }

  document.getElementById('score').textContent = `TIME: ${elapsed.toFixed(1)}`;
  document.getElementById('best').textContent = `BEST: ${best.toFixed(1)}`;
}

// ---------------- 렌더 ----------------

function renderParticles() {
  particles.forEach((p) => {
    if (p.kind === 'cloud') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(p.x, p.y, p.w, 6);
      ctx.fillRect(p.x + p.w * 0.2, p.y - 4, p.w * 0.5, 6);
    } else if (p.kind === 'bubble') {
      const wobble = Math.sin(p.phase) * 2;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(p.x + wobble, p.y, p.r, p.r);
    } else if (p.kind === 'star') {
      const a = 0.4 + Math.abs(Math.sin(p.phase)) * 0.6;
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
      ctx.fillRect(p.x, p.y, 2, 2);
    } else if (p.kind === 'planet') {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.r, p.r);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(p.x, p.y, p.r * 0.4, p.r * 0.4);
    }
  });
}

function render() {
  const theme = currentTheme;

  // 배경 그라데이션
  const grad = ctx.createLinearGradient(0, 0, 0, VH);
  grad.addColorStop(0, theme.skyTop);
  grad.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VW, VH);

  renderParticles();

  // 땅
  ctx.fillStyle = theme.groundTop;
  ctx.fillRect(0, VH - GROUND_H, VW, GROUND_H);
  ctx.fillStyle = theme.groundMid;
  for (let x = 0; x < VW; x += 8) {
    ctx.fillRect(x, VH - GROUND_H, 4, 4);
  }
  ctx.fillStyle = theme.groundBottom;
  ctx.fillRect(0, VH - GROUND_H + 18, VW, GROUND_H - 18);

  // 플레이어 (살짝 위아래로 흔들리는 idle 애니메이션)
  const bob = state === 'playing' ? Math.sin(bobTimer * 8) * 1.5 : 0;
  drawSprite(ctx, theme.character, player.x, player.y + bob, PLAYER_SIZE);

  // 장애물
  obstacles.forEach((o) => drawSprite(ctx, o.sprite, o.x, o.y, o.size));
}

// ---------------- 루프 ----------------
function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

// 캔버스를 가상 해상도로 스케일링해서 그림
ctx.scale(SCALE, SCALE);

document.getElementById('best').textContent = `BEST: ${best.toFixed(1)}`;
refreshStartPreview();
initParticles(currentTheme.decor);
requestAnimationFrame(loop);
