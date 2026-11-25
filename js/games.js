// Minijogos jogáveis do fliperama: horda, labirinto retrô e plataformer.
// Cada partida é iniciada depois que api('arcade_use') desconta uma ficha.

let gameStop = null;

const GAME_DEFS = {
  hordas: {
    title: '🧟 Horda da Cabana',
    w: 960, h: 540,
    help: 'WASD ou setas: mover • os tiros saem sozinhos • pegue as joias para subir de nível.',
    run: startHordas
  },
  doom: {
    title: '👹 Doom do Geraldo',
    w: 480, h: 270,
    help: 'WASD/setas: andar • Q/E ou mouse: girar • Espaço/clique: atirar • R: recarregar.',
    run: startDoom
  },
  mario: {
    title: '🍄 Orvalho Jump',
    w: 960, h: 540,
    help: '← → ou A/D: correr • ↑ / W / Espaço: pular • Shift: correr mais • pise nos cogumelos.',
    run: startMario
  }
};

function createKeys() {
  const k = {}, just = {};
  const norm = e => {
    const n = String(e.key).toLowerCase();
    return n === ' ' ? 'space' : n;
  };
  const blocked = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space']);
  const down = e => {
    const n = norm(e);
    if (blocked.has(n)) e.preventDefault();
    if (n === 'escape') { closeGame(); return; }
    if (!k[n]) just[n] = true;
    k[n] = true;
  };
  const up = e => { k[norm(e)] = false; };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return {
    k,
    consume(n) { const v = !!just[n]; just[n] = false; return v; },
    destroy() { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); }
  };
}

function showEnd(title, detail, machineId, key) {
  const end = $('#gameEnd');
  end.hidden = false;
  end.innerHTML = `<div class="p-3"><h2 class="h1">${title}</h2><p class="text-light">${detail}</p>
    <button class="btn btn-warning fw-bold" id="gameAgain">Jogar de novo (1 ficha)</button>
    <button class="btn btn-outline-light ms-2" id="gameQuit">Sair</button></div>`;
  $('#gameAgain').onclick = () => api('arcade_use', {machine_id: machineId}).then(r => {
    if (r.err) return toast(r.err);
    load().then(() => openGame(key, machineId));
  });
  $('#gameQuit').onclick = closeGame;
}

function openGame(key, machineId) {
  const def = GAME_DEFS[key];
  if (!def) return;
  closeGame();
  const overlay = $('#gameOverlay'), canvas = $('#gameCanvas'), end = $('#gameEnd');
  canvas.width = def.w; canvas.height = def.h;
  $('#gameTitle').textContent = def.title;
  $('#gameHelp').textContent = def.help;
  $('#gameStatus').textContent = '';
  end.hidden = true; end.innerHTML = '';
  overlay.hidden = false;
  canvas.focus();

  const keys = createKeys();
  const cfg = {
    keys,
    canvas,
    machineId,
    key,
    status: t => { $('#gameStatus').textContent = t; }
  };
  const rawStop = def.run(canvas.getContext('2d'), cfg);
  gameStop = () => {
    if (rawStop) rawStop();
    keys.destroy();
    if (document.pointerLockElement === canvas) document.exitPointerLock?.();
  };
}

function closeGame() {
  if (gameStop) { gameStop(); gameStop = null; }
  const overlay = $('#gameOverlay');
  if (overlay) overlay.hidden = true;
  if (document.pointerLockElement) document.exitPointerLock?.();
}

$('#gameClose').addEventListener('click', closeGame);

/* ------------------------------------------------------------------ */
/* 1) Horda estilo Vampire Survivors                                    */
/* ------------------------------------------------------------------ */
function startHordas(ctx, cfg) {
  const {keys, status, machineId, key} = cfg;
  const W = 960, H = 540;
  let px = W / 2, py = H / 2, hp = 100, lvl = 1, xp = 0, kills = 0, time = 0;
  let enemies = [], bullets = [], gems = [];
  let last = performance.now(), running = true, raf = 0;
  let fire = 0, hurt = 0, spawn = 0, band = 0;
  const need = () => 20 + lvl * 10;

  function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * W; y = -30; }
    else if (side === 1) { x = W + 30; y = Math.random() * H; }
    else if (side === 2) { x = Math.random() * W; y = H + 30; }
    else { x = -30; y = Math.random() * H; }
    enemies.push({x, y, hp: 18 + lvl * 6, sp: 34 + Math.random() * 18 + lvl * 2, r: 12 + Math.random() * 5});
  }

  function shoot() {
    if (!enemies.length) return;
    let target = null, best = Infinity;
    for (const e of enemies) {
      const d = Math.hypot(e.x - px, e.y - py);
      if (d < best) { best = d; target = e; }
    }
    const base = Math.atan2(target.y - py, target.x - px);
    const shots = lvl >= 6 ? 3 : lvl >= 3 ? 2 : 1;
    for (let i = 0; i < shots; i++) {
      const a = base + (i - (shots - 1) / 2) * 0.16;
      bullets.push({x: px, y: py, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, dmg: 14 + lvl * 5, life: 1.4});
    }
  }

  function draw() {
    ctx.fillStyle = '#140d08'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(227,154,34,.07)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.fillStyle = '#57a34a';
    for (const g of gems) { ctx.beginPath(); ctx.arc(g.x, g.y, 5, 0, 7); ctx.fill(); }

    for (const e of enemies) {
      ctx.fillStyle = '#d0472f'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a0e08'; ctx.fillRect(e.x - 5, e.y - 3, 3, 3); ctx.fillRect(e.x + 2, e.y - 3, 3, 3);
    }
    ctx.fillStyle = '#ffd24d';
    for (const b of bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 3.5, 0, 7); ctx.fill(); }

    ctx.fillStyle = '#f3e3c7'; ctx.beginPath(); ctx.arc(px, py, 12, 0, 7); ctx.fill();
    ctx.fillStyle = '#e39a22'; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();

    ctx.fillStyle = '#0008'; ctx.fillRect(12, 12, 180, 12);
    ctx.fillStyle = '#b8381f'; ctx.fillRect(12, 12, 180 * Math.max(0, hp) / 100, 12);
    if (band > 0) {
      ctx.fillStyle = '#ffd24d'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('NÍVEL ' + lvl + '!', W / 2, 70); ctx.textAlign = 'left';
    }
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05); last = now; time += dt;

    let dx = 0, dy = 0;
    if (keys.k['arrowleft'] || keys.k['a']) dx--;
    if (keys.k['arrowright'] || keys.k['d']) dx++;
    if (keys.k['arrowup'] || keys.k['w']) dy--;
    if (keys.k['arrowdown'] || keys.k['s']) dy++;
    if (dx || dy) {
      const m = Math.hypot(dx, dy), sp = 170 + lvl * 4;
      px += dx / m * sp * dt; py += dy / m * sp * dt;
    }
    px = Math.max(14, Math.min(W - 14, px));
    py = Math.max(14, Math.min(H - 14, py));

    fire -= dt; hurt -= dt; spawn -= dt; band -= dt;
    if (spawn <= 0) {
      spawn = Math.max(0.18, 0.9 - lvl * 0.05);
      const q = 1 + Math.floor(time / 35);
      for (let i = 0; i < q; i++) spawnEnemy();
    }
    if (fire <= 0) { fire = Math.max(0.12, 0.62 - lvl * 0.035); shoot(); }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i], a = Math.atan2(py - e.y, px - e.x);
      e.x += Math.cos(a) * e.sp * dt; e.y += Math.sin(a) * e.sp * dt;
      if (Math.hypot(e.x - px, e.y - py) < e.r + 12 && hurt <= 0) {
        hp -= 10; hurt = 0.6; e.x -= Math.cos(a) * 22; e.y -= Math.sin(a) * 22;
      }
    }
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      let hit = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + 4) {
          e.hp -= b.dmg; hit = true;
          if (e.hp <= 0) { kills++; gems.push({x: e.x, y: e.y, v: 6}); enemies.splice(j, 1); }
          break;
        }
      }
      if (hit || b.life <= 0 || b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) bullets.splice(i, 1);
    }
    for (let i = gems.length - 1; i >= 0; i--) {
      const g = gems[i], d = Math.hypot(g.x - px, g.y - py);
      if (d < 110) {
        const a = Math.atan2(py - g.y, px - g.x);
        g.x += Math.cos(a) * 230 * dt; g.y += Math.sin(a) * 230 * dt;
      }
      if (d < 16) {
        xp += g.v; gems.splice(i, 1);
        if (xp >= need()) { xp -= need(); lvl++; hp = Math.min(100, hp + 18); band = 1.2; }
      }
    }

    if (hp <= 0) {
      running = false;
      showEnd('Fim da horda', 'Você sobreviveu ' + Math.floor(time) + 's e eliminou ' + kills + ' criaturas.', machineId, key);
      return;
    }
    status('Nível ' + lvl + ' • XP ' + xp + '/' + need() + ' • mortes ' + kills + ' • ' + Math.floor(time) + 's');
    draw();
    raf = requestAnimationFrame(loop);
  }

  draw();
  raf = requestAnimationFrame(loop);
  return () => { running = false; cancelAnimationFrame(raf); };
}

/* ------------------------------------------------------------------ */
/* 2) Labirinto estilo Doom clássico (raycasting simples)              */
/* ------------------------------------------------------------------ */
function startDoom(ctx, cfg) {
  const {keys, status, canvas, machineId, key} = cfg;
  const W = 480, H = 270, FOV = Math.PI / 3, MAP = [
    '1111111111111111',
    '1000000000000001',
    '1000000000000001',
    '1000220000220001',
    '1000000000000001',
    '1000001100000001',
    '1000000000000001',
    '1030000000000301',
    '1000000000000001',
    '1000330000330001',
    '1000000000000001',
    '1000002200000001',
    '1000000000000001',
    '1000000000000001',
    '1000000000000001',
    '1111111111111111'
  ];
  const WALL = {1: ['#8a5a2b', '#5c3a1b'], 2: ['#8a2f2f', '#5d1f1f'], 3: ['#7d8f3f', '#536025']};
  const p = {x: 1.5, y: 1.5, a: 0};
  const enemies = [[3.5, 1.5], [12.5, 2.5], [5.5, 5.5], [10.5, 7.5], [3.5, 11.5], [13.5, 13.5]]
    .map(([x, y]) => ({x, y, hp: 80, sp: 0.65 + Math.random() * 0.3}));
  const total = enemies.length;
  let hp = 100, ammo = 12, reserve = 48, kills = 0, time = 0;
  let fireCd = 0, hurtCd = 0, muzzle = 0;
  let last = performance.now(), running = true, raf = 0;
  const norm = a => Math.atan2(Math.sin(a), Math.cos(a));
  const free = (x, y) => {
    const r = 0.25;
    return [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]]
      .every(([a, b]) => MAP[Math.floor(b)] && MAP[Math.floor(b)][Math.floor(a)] === '0');
  };

  function cast(angle) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    let mx = Math.floor(p.x), my = Math.floor(p.y);
    const ddx = Math.abs(1 / dx), ddy = Math.abs(1 / dy);
    let stepX, stepY, sx, sy;
    if (dx < 0) { stepX = -1; sx = (p.x - mx) * ddx; } else { stepX = 1; sx = (mx + 1 - p.x) * ddx; }
    if (dy < 0) { stepY = -1; sy = (p.y - my) * ddy; } else { stepY = 1; sy = (my + 1 - p.y) * ddy; }
    let side = 0, tile = 0;
    for (let i = 0; i < 24; i++) {
      if (sx < sy) { sx += ddx; mx += stepX; side = 0; }
      else { sy += ddy; my += stepY; side = 1; }
      const c = (MAP[my] && MAP[my][mx]) || '1';
      tile = +c;
      if (tile > 0) break;
    }
    const dist = Math.max(0.05, side === 0 ? sx - ddx : sy - ddy);
    return {dist, tile, side};
  }

  function shoot() {
    if (!running || fireCd > 0) return;
    if (ammo <= 0) { fireCd = 0.25; status('Sem munição! Pressione R para recarregar.'); return; }
    ammo--; fireCd = 0.22; muzzle = 0.08;
    let best = null, bestAngle = 0.22;
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y), diff = Math.abs(norm(Math.atan2(e.y - p.y, e.x - p.x) - p.a));
      if (d < 9 && diff < bestAngle) { bestAngle = diff; best = e; }
    }
    if (best) {
      best.hp -= 40;
      if (best.hp <= 0) kills++;
    }
  }

  const onMove = e => { if (document.pointerLockElement === canvas) p.a += e.movementX * 0.0025; };
  const onClick = () => {
    if (document.pointerLockElement !== canvas) { try { canvas.requestPointerLock?.(); } catch (_) {} }
    shoot();
  };
  document.addEventListener('mousemove', onMove);
  canvas.addEventListener('click', onClick);

  function draw() {
    ctx.fillStyle = '#2a2118'; ctx.fillRect(0, 0, W, H / 2);
    ctx.fillStyle = '#3b2b1e'; ctx.fillRect(0, H / 2, W, H / 2);
    for (let x = 0; x < W; x++) {
      const r = cast(p.a + (x / W - 0.5) * FOV);
      const line = Math.min(H * 2, Math.floor(H / r.dist));
      ctx.fillStyle = (WALL[r.tile] || WALL[1])[r.side];
      ctx.fillRect(x, Math.floor((H - line) / 2), 1, line);
    }

    const seen = enemies.filter(e => e.hp > 0).map(e => {
      const dx = e.x - p.x, dy = e.y - p.y, dist = Math.hypot(dx, dy);
      return {e, dist, diff: norm(Math.atan2(dy, dx) - p.a)};
    }).filter(o => o.dist > 0.2 && Math.abs(o.diff) < FOV / 2 + 0.25)
      .sort((a, b) => b.dist - a.dist);
    for (const o of seen) {
      const size = Math.min(H * 1.6, H / (Math.max(0.3, o.dist) * 0.8));
      const sx = (0.5 + o.diff / FOV) * W, sy = H / 2 - size / 2 + Math.sin(time * 4 + o.e.x) * 4;
      ctx.fillStyle = '#8b2f2f';
      ctx.fillRect(sx - size * 0.28, sy + size * 0.3, size * 0.56, size * 0.5);
      ctx.fillStyle = '#cf4a3a';
      ctx.beginPath(); ctx.arc(sx, sy + size * 0.27, size * 0.28, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd24d';
      ctx.fillRect(sx - size * 0.13, sy + size * 0.22, size * 0.08, size * 0.08);
      ctx.fillRect(sx + size * 0.05, sy + size * 0.22, size * 0.08, size * 0.08);
    }

    ctx.fillStyle = '#2b2b33'; ctx.fillRect(W / 2 - 34, H - 52, 68, 52);
    ctx.fillStyle = '#5a5a66'; ctx.fillRect(W / 2 - 22, H - 70, 44, 28);
    ctx.fillStyle = '#101018'; ctx.fillRect(W / 2 + 12, H - 64, 14, 10);
    if (muzzle > 0) {
      ctx.fillStyle = '#ffd24d';
      ctx.beginPath(); ctx.arc(W / 2, H - 72, 12, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace';
    ctx.fillText('VIDA ' + Math.max(0, hp) + '   MUNIÇÃO ' + ammo + '/' + reserve, 6, 12);
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05); last = now; time += dt;
    fireCd -= dt; hurtCd -= dt; muzzle -= dt;

    if (keys.k['q'] || keys.k['arrowleft']) p.a -= 2.2 * dt;
    if (keys.k['e'] || keys.k['arrowright']) p.a += 2.2 * dt;
    let f = 0, s = 0;
    if (keys.k['w'] || keys.k['arrowup']) f = 1;
    if (keys.k['s'] || keys.k['arrowdown']) f = -1;
    if (keys.k['a']) s = -1;
    if (keys.k['d']) s = 1;
    const vx = (Math.cos(p.a) * f + Math.cos(p.a + Math.PI / 2) * s) * 2.4 * dt;
    const vy = (Math.sin(p.a) * f + Math.sin(p.a + Math.PI / 2) * s) * 2.4 * dt;
    if (free(p.x + vx, p.y)) p.x += vx;
    if (free(p.x, p.y + vy)) p.y += vy;

    if (keys.consume('r') && ammo < 12 && reserve > 0) {
      const take = Math.min(12 - ammo, reserve); ammo += take; reserve -= take;
    }
    if (keys.consume('space')) shoot();

    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const a = Math.atan2(p.y - e.y, p.x - e.x), d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d > 0.7) {
        const nx = e.x + Math.cos(a) * e.sp * dt, ny = e.y + Math.sin(a) * e.sp * dt;
        if (free(nx, ny)) { e.x = nx; e.y = ny; }
      } else if (hurtCd <= 0) { hp -= 12; hurtCd = 0.8; }
    }

    if (hp <= 0 || kills >= total) {
      running = false;
      const win = kills >= total;
      showEnd(win ? 'Cabana limpa!' : 'Você caiu', win
        ? 'Você eliminou todos os ' + total + ' demônios do labirinto.'
        : 'Os demônios venceram desta vez. Você eliminou ' + kills + ' de ' + total + '.', machineId, key);
      return;
    }
    status('Vida ' + Math.max(0, hp) + ' • munição ' + ammo + '/' + reserve + ' • demônios ' + kills + '/' + total);
    draw();
    raf = requestAnimationFrame(loop);
  }

  draw();
  raf = requestAnimationFrame(loop);
  return () => {
    running = false; cancelAnimationFrame(raf);
    document.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('click', onClick);
    if (document.pointerLockElement === canvas) document.exitPointerLock?.();
  };
}

/* ------------------------------------------------------------------ */
/* 3) Plataformer estilo Mario                                          */
/* ------------------------------------------------------------------ */
function startMario(ctx, cfg) {
  const {keys, status, machineId, key} = cfg;
  const W = 960, H = 540, GRAV = 1900, MOVE = 220, RUN = 330, JUMP = -650;
  const solids = [
    {x: 0, y: 460, w: 3600, h: 120},
    {x: 380, y: 380, w: 120, h: 20}, {x: 620, y: 320, w: 120, h: 20},
    {x: 900, y: 390, w: 140, h: 20}, {x: 1180, y: 330, w: 100, h: 20},
    {x: 1420, y: 260, w: 120, h: 20}, {x: 1720, y: 380, w: 160, h: 20},
    {x: 2050, y: 320, w: 120, h: 20}, {x: 2360, y: 390, w: 140, h: 20},
    {x: 2680, y: 300, w: 120, h: 20}, {x: 2960, y: 380, w: 160, h: 20},
    {x: 520, y: 400, w: 70, h: 60, pipe: 1}, {x: 1300, y: 400, w: 80, h: 60, pipe: 1},
    {x: 2220, y: 400, w: 70, h: 60, pipe: 1}
  ];
  const coinSpots = [[300, 420], [420, 340], [650, 280], [950, 350], [1200, 290],
    [1450, 220], [1780, 340], [2080, 280], [2380, 350], [2700, 260], [3000, 340], [3150, 420]];
  const coins = coinSpots.map(([x, y]) => ({x, y, got: false}));
  const foes = [
    {x: 800, y: 430, w: 34, h: 30, dir: -1, min: 760, max: 980, dead: false},
    {x: 1450, y: 230, w: 34, h: 30, dir: 1, min: 1425, max: 1535, dead: false},
    {x: 1620, y: 430, w: 34, h: 30, dir: -1, min: 1570, max: 1750, dead: false},
    {x: 2500, y: 430, w: 34, h: 30, dir: -1, min: 2440, max: 2640, dead: false},
    {x: 3120, y: 430, w: 34, h: 30, dir: 1, min: 3050, max: 3250, dead: false}
  ];
  const p = {x: 60, y: 410, w: 28, h: 44, vx: 0, vy: 0, on: false, face: 1, inv: 0};
  let hp = 3, score = 0, time = 0, cam = 0, prevJump = false;
  let last = performance.now(), running = true, raf = 0;
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#6fc3e8'); sky.addColorStop(1, '#d7eef8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffffffcc';
    for (const cx of [140, 520, 900, 1280, 1660, 2040, 2420, 2800, 3180]) {
      const x = cx - cam * 0.25;
      if (x < -120 || x > W + 120) continue;
      ctx.beginPath(); ctx.ellipse(x, 90, 44, 16, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x - 20, 82, 24, 18, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 16, 80, 28, 20, 0, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#6fa84a';
    for (const hx of [220, 780, 1340, 1900, 2460, 3020]) {
      const x = hx - cam * 0.4;
      if (x < -160 || x > W + 160) continue;
      ctx.beginPath(); ctx.arc(x, 470, 110, Math.PI, 0); ctx.fill();
    }

    for (const s of solids) {
      const x = s.x - cam;
      if (x + s.w < 0 || x > W) continue;
      if (s.pipe) {
        ctx.fillStyle = '#2f7a34'; ctx.fillRect(x, s.y, s.w, s.h);
        ctx.fillStyle = '#49a84d'; ctx.fillRect(x + 6, s.y + 4, s.w - 12, s.h - 8);
        ctx.fillStyle = '#2f7a34'; ctx.fillRect(x - 6, s.y - 10, s.w + 12, 14);
      } else {
        ctx.fillStyle = '#9a5a2b'; ctx.fillRect(x, s.y, s.w, s.h);
        ctx.fillStyle = '#c47a3b';
        for (let bx = x; bx < x + s.w; bx += 32) ctx.fillRect(bx + 2, s.y + 8, 26, 8);
        ctx.fillStyle = '#4d9b3f'; ctx.fillRect(x, s.y, s.w, 10);
      }
    }

    for (const c of coins) {
      if (c.got) continue;
      const x = c.x - cam;
      if (x < -20 || x > W + 20) continue;
      ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.arc(x, c.y, 11, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff3b0'; ctx.fillRect(x - 3, c.y - 7, 4, 14);
    }

    for (const f of foes) {
      if (f.dead) continue;
      const x = f.x - cam;
      if (x < -50 || x > W + 50) continue;
      ctx.fillStyle = '#7a3f1e';
      ctx.beginPath(); ctx.arc(x + f.w / 2, f.y + 12, 18, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#c98a4b'; ctx.fillRect(x + 3, f.y + 12, f.w - 6, f.h - 12);
      ctx.fillStyle = '#2a1608';
      ctx.fillRect(x + 8, f.y + 18, 5, 5); ctx.fillRect(x + f.w - 13, f.y + 18, 5, 5);
      ctx.fillStyle = '#f3e3c7'; ctx.fillRect(x + 7, f.y + 25, f.w - 14, 4);
    }

    const fx = 3300 - cam;
    if (fx > -60 && fx < W + 60) {
      ctx.fillStyle = '#d9d9d9'; ctx.fillRect(fx, 180, 6, 280);
      ctx.fillStyle = '#e39a22';
      ctx.beginPath(); ctx.moveTo(fx + 6, 185); ctx.lineTo(fx + 70, 205); ctx.lineTo(fx + 6, 230); ctx.fill();
      ctx.fillStyle = '#b8381f'; ctx.fillRect(fx - 10, 452, 26, 8);
    }

    if (!(p.inv > 0 && Math.floor(time * 12) % 2)) {
      const x = p.x - cam, y = p.y;
      ctx.fillStyle = '#b8381f'; ctx.fillRect(x, y, p.w, 13);
      ctx.fillRect(x - (p.face < 0 ? 0 : 2), y + 2, p.w + 2, 5);
      ctx.fillStyle = '#f0c98a'; ctx.fillRect(x + 3, y + 13, p.w - 6, 13);
      ctx.fillStyle = '#3b2b1e'; ctx.fillRect(x + 4, y + 22, p.w - 8, 4);
      ctx.fillStyle = '#2f5aa8'; ctx.fillRect(x + 2, y + 26, p.w - 4, 13);
      ctx.fillStyle = '#1b0f07'; ctx.fillRect(x + (p.face > 0 ? p.w - 5 : 2), y + 16, 3, 3);
      ctx.fillStyle = '#5a3318'; ctx.fillRect(x, y + p.h - 8, p.w, 8);
    }

    ctx.fillStyle = '#0009'; ctx.fillRect(0, 0, W, 28);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px monospace';
    ctx.fillText('PONTOS ' + score + '   ❤ ' + '❤'.repeat(Math.max(0, hp)) + '   ' + Math.floor(time) + 's', 10, 19);
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05); last = now; time += dt;
    p.inv -= dt;

    const left = keys.k['arrowleft'] || keys.k['a'];
    const right = keys.k['arrowright'] || keys.k['d'];
    p.vx = ((right ? 1 : 0) - (left ? 1 : 0)) * (keys.k['shift'] ? RUN : MOVE);
    if (right) p.face = 1; if (left) p.face = -1;
    const jump = keys.k['arrowup'] || keys.k['w'] || keys.k['space'];
    if (jump && !prevJump && p.on) { p.vy = JUMP; p.on = false; }
    if (!jump && p.vy < -220) p.vy += 900 * dt;
    prevJump = jump;
    p.vy += GRAV * dt;

    p.x += p.vx * dt;
    for (const s of solids) {
      if (hit(p, s)) {
        if (p.vx > 0) p.x = s.x - p.w; else if (p.vx < 0) p.x = s.x + s.w;
        p.vx = 0;
      }
    }
    p.y += p.vy * dt; p.on = false;
    for (const s of solids) {
      if (hit(p, s)) {
        if (p.vy > 0) { p.y = s.y - p.h; p.on = true; }
        else if (p.vy < 0) p.y = s.y + s.h;
        p.vy = 0;
      }
    }

    for (const c of coins) {
      if (!c.got && hit(p, {x: c.x - 11, y: c.y - 11, w: 22, h: 22})) { c.got = true; score += 50; }
    }
    for (const f of foes) {
      if (f.dead || !hit(p, f)) continue;
      if (p.vy > 60 && p.y + p.h < f.y + 14) {
        f.dead = true; p.vy = -380; score += 100;
      } else if (p.inv <= 0) {
        hp--; p.inv = 1.2; p.vx = -p.face * 160; p.vy = -260;
      }
    }

    cam = Math.max(0, Math.min(3500 - W, p.x - W * 0.35));
    status('Pontos ' + score + ' • moedas ' + coins.filter(c => c.got).length + '/' + coins.length + ' • vidas ' + Math.max(0, hp));

    if (p.x > 3300) {
      running = false;
      showEnd('Bandeira alcançada!', 'Você chegou ao fim com ' + score + ' pontos em ' + Math.floor(time) + 's.', machineId, key);
      return;
    }
    if (hp <= 0 || p.y > H + 80) {
      running = false;
      showEnd('Fim de jogo', 'Você fez ' + score + ' pontos. Tente chegar até a bandeira!', machineId, key);
      return;
    }
    draw();
    raf = requestAnimationFrame(loop);
  }

  draw();
  raf = requestAnimationFrame(loop);
  return () => { running = false; cancelAnimationFrame(raf); };
}
