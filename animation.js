/* ==========================================================
   NOVAIX STUDIO — Cosmic Observatory
   animation.js

   Satu loop requestAnimationFrame menjalankan:
   nebula berlapis, bintang berkelip, meteor, partikel debu,
   planet + orbit, cahaya kursor/sentuhan, dan pencahayaan foto.
   ========================================================== */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. PENGATURAN: ISI TAUTAN SOSIAL DI SINI
     Kosongkan ('') jika belum ada. Tombol yang kosong akan
     menampilkan pesan kecil, bukan membuka tautan palsu.
     ---------------------------------------------------------- */
  const SOCIAL_LINKS = {
    instagram: 'https://instagram.com/barr_0a',   // contoh: 'https://instagram.com/usernameanda'
    tiktok:    '',   // contoh: 'https://www.tiktok.com/@usernameanda'
    whatsapp:  'https://wa.me/6285704309385',   // contoh: 'https://wa.me/628123456789'
    email:     '',   // contoh: 'mailto:nama@domain.com'
    bug:       ''    // contoh: 'mailto:nama@domain.com?subject=Laporan%20bug' atau link form
  };

  /* ----------------------------------------------------------
     2. UTILITAS & STATE
     ---------------------------------------------------------- */
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;

  const root = document.documentElement;
  const motionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    reduce: motionMQ.matches,
    scrollY: window.pageYOffset || 0,
    vw: window.innerWidth,
    vh: window.innerHeight,
    docH: 1
  };

  // Animasi masuk hero dimulai segera
  requestAnimationFrame(function () { root.classList.add('is-ready'); });

  function debounce(fn, ms) {
    let t = 0;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  /* ----------------------------------------------------------
     3. KURSOR / SENTUHAN / CAHAYA
     ---------------------------------------------------------- */
  const pointer = {
    x: state.vw / 2, y: state.vh / 2,
    tx: state.vw / 2, ty: state.vh / 2,
    a: 0, target: 0, last: 0, type: 'mouse',
    nx: 0, ny: 0
  };
  const light = { x: state.vw / 2, y: state.vh * 0.3 };

  function onPointer(e) {
    if (state.reduce) return;
    pointer.tx = e.clientX;
    pointer.ty = e.clientY;
    pointer.type = e.pointerType || 'mouse';
    pointer.last = performance.now();
    if (pointer.target === 0 && pointer.a < 0.02) {
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
    }
    pointer.target = 1;
  }
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerdown', onPointer, { passive: true });
  root.addEventListener('mouseleave', function () {
    if (pointer.type === 'mouse') pointer.target = 0;
  });
  window.addEventListener('blur', function () { pointer.target = 0; });

  function updatePointer(dt, now) {
    const k = 1 - Math.exp(-dt * 12);
    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.y += (pointer.ty - pointer.y) * k;

    // Sentuhan: cahaya memudar setelah jari diangkat
    if (pointer.type !== 'mouse' && now - pointer.last > 1300) pointer.target = 0;

    const rate = pointer.target ? 6 : 2.4;
    pointer.a += (pointer.target - pointer.a) * (1 - Math.exp(-dt * rate));
    if (pointer.target === 0 && pointer.a < 0.003) pointer.a = 0;

    pointer.nx = (pointer.x / state.vw - 0.5) * 2 * pointer.a;
    pointer.ny = (pointer.y / state.vh - 0.5) * 2 * pointer.a;
  }

  function updateLight(t) {
    const ix = state.vw * (0.5 + 0.28 * Math.sin(t * 0.23));
    const iy = state.vh * (0.32 + 0.12 * Math.cos(t * 0.31));
    light.x = lerp(ix, pointer.x, pointer.a);
    light.y = lerp(iy, pointer.y, pointer.a);
  }

  /* ----------------------------------------------------------
     4. COSMOS: nebula, bintang, meteor, debu (Canvas 2D)
     ---------------------------------------------------------- */
  const Cosmos = (function () {
    const canvas = $('#cosmos');
    if (!canvas || !canvas.getContext) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const TIERS = {
      low:  { dpr: 1,    starDiv: 6500, dust: 18, neb: 0.22 },
      mid:  { dpr: 1.25, starDiv: 4800, dust: 32, neb: 0.26 },
      high: { dpr: 1.5,  starDiv: 3600, dust: 54, neb: 0.30 }
    };

    function pickTier() {
      const cores = navigator.hardwareConcurrency || 4;
      const mem = navigator.deviceMemory || 4;
      const small = Math.min(state.vw, state.vh) < 600;
      if (mem <= 2 || (cores <= 4 && small)) return 'low';
      if (small || cores <= 6) return 'mid';
      return 'high';
    }

    const cfg = TIERS[pickTier()];
    // Pengurangan kualitas otomatis jika perangkat tersendat
    const q = { stars: 1, nebula: 3, dust: 1, lines: true };

    let W = 0, H = 0, dpr = 1;
    let stars = [], bright = [], dust = [], meteors = [], layers = [];
    let nextMeteor = 2.5;

    /* Sprite cahaya lembut (dibuat sekali, dipakai ulang) */
    function makeSprite(r, g, b) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g2 = c.getContext('2d');
      const gr = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',1)');
      gr.addColorStop(0.22, 'rgba(' + r + ',' + g + ',' + b + ',.5)');
      gr.addColorStop(0.55, 'rgba(' + r + ',' + g + ',' + b + ',.12)');
      gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
      g2.fillStyle = gr;
      g2.fillRect(0, 0, 64, 64);
      return c;
    }
    const sprites = {
      white: makeSprite(255, 255, 255),
      blue: makeSprite(120, 180, 255),
      violet: makeSprite(170, 130, 255),
      pink: makeSprite(230, 140, 230),
      amber: makeSprite(255, 200, 140)
    };
    const dustKeys = ['blue', 'violet', 'violet', 'pink', 'white', 'amber'];

    /* Nebula: dirender sekali ke kanvas kecil, lalu digeser pelan */
    function buildLayers() {
      layers = [];
      const nw = Math.max(160, Math.round(W * 1.5 * cfg.neb));
      const nh = Math.max(160, Math.round(H * 1.5 * cfg.neb));
      const defs = [
        { c: [96, 60, 255],  a: 0.34, count: 9, par: 0.015, dx: 0.040, dy: 0.025, sp: 0.045 },
        { c: [48, 120, 255], a: 0.26, count: 8, par: 0.030, dx: 0.055, dy: 0.035, sp: 0.060 },
        { c: [170, 70, 210], a: 0.20, count: 6, par: 0.050, dx: 0.060, dy: 0.040, sp: 0.040 }
      ];
      defs.forEach(function (d) {
        const c = document.createElement('canvas');
        c.width = nw; c.height = nh;
        const g = c.getContext('2d');
        let x = rand(0.15, 0.35) * nw;
        let y = rand(0.3, 0.7) * nh;
        let ang = rand(-0.6, 0.6);
        for (let i = 0; i < d.count; i++) {
          const r = rand(0.13, 0.27) * Math.max(nw, nh * 1.2);
          const a = d.a * rand(0.55, 1);
          const col = d.c[0] + ',' + d.c[1] + ',' + d.c[2];
          const grad = g.createRadialGradient(x, y, 0, x, y, r);
          grad.addColorStop(0, 'rgba(' + col + ',' + a + ')');
          grad.addColorStop(0.45, 'rgba(' + col + ',' + (a * 0.4) + ')');
          grad.addColorStop(1, 'rgba(' + col + ',0)');
          g.fillStyle = grad;
          g.fillRect(x - r, y - r, r * 2, r * 2);
          x += Math.cos(ang) * r * 0.75;
          y += Math.sin(ang) * r * 0.55;
          ang += rand(-0.7, 0.7);
          if (x > nw * 0.92 || x < nw * 0.08) { ang = Math.PI - ang; x = clamp(x, nw * 0.08, nw * 0.92); }
          if (y > nh * 0.9 || y < nh * 0.1) { ang = -ang; y = clamp(y, nh * 0.1, nh * 0.9); }
        }
        layers.push({ canvas: c, par: d.par, dx: d.dx, dy: d.dy, sp: d.sp });
      });
    }

    function build() {
      const count = clamp(Math.round(W * H / cfg.starDiv), 80, 460);
      const tints = ['#ffffff', '#ffffff', '#cfdcff', '#b9c9ff', '#e0d2ff', '#ffe6c8'];
      stars = [];
      for (let i = 0; i < count; i++) {
        const z = Math.pow(Math.random(), 1.6);
        const s = {
          x: Math.random(),
          y: Math.random(),
          z: z,
          r: 0.35 + z * 1.15 + (Math.random() < 0.04 ? 0.8 : 0),
          base: 0.35 + Math.random() * 0.4,
          amp: 0.15 + Math.random() * 0.55,
          spd: 0.6 + Math.random() * 2.8,
          ph: Math.random() * TAU,
          sharp: Math.random() < 0.3,
          col: tints[(Math.random() * tints.length) | 0],
          spike: false,
          sx: -999, sy: -999
        };
        if (s.r > 1.25 && Math.random() < 0.55) s.spike = true;
        stars.push(s);
      }
      bright = stars.filter(function (s) { return s.r > 1.1; }).slice(0, 48);

      dust = [];
      for (let i = 0; i < cfg.dust; i++) {
        const sp = rand(0.3, 1.4);
        dust.push({
          x: rand(0, W), y: rand(0, H),
          vx: rand(-14, 14) * sp, vy: rand(-10, 10) * sp,
          s: rand(5, 18),
          a: rand(0.25, 0.7),
          tw: rand(0.3, 1.1),
          ph: rand(0, TAU),
          spr: sprites[dustKeys[(Math.random() * dustKeys.length) | 0]]
        });
      }
      buildLayers();
    }

    function resize(force) {
      const w = window.innerWidth, h = window.innerHeight;
      const widthChanged = w !== W;
      // Abaikan perubahan tinggi kecil (bar alamat HP naik/turun)
      if (!force && !widthChanged && canvas.width && Math.abs(h - H) < 140) return;
      W = w; H = h;
      dpr = Math.min(window.devicePixelRatio || 1, cfg.dpr);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (widthChanged || !stars.length || force) build();
    }

    /* ---- Gambar ---- */
    function drawNebula(t, prog, nx, ny) {
      const n = Math.min(q.nebula, layers.length);
      const dw = W * 1.5, dh = H * 1.5;
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < n; i++) {
        const L = layers[i];
        const ox = -W * 0.25 + Math.sin(t * L.sp + i * 2.1) * W * L.dx - nx * W * L.par * 1.6;
        const oy = -H * 0.25 + Math.cos(t * L.sp * 0.83 + i * 1.3) * H * L.dy - prog * H * L.par * 3 - ny * H * L.par;
        ctx.globalAlpha = 0.78 + 0.22 * Math.sin(t * 0.17 + i * 1.9);
        ctx.drawImage(L.canvas, ox, oy, dw, dh);
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function drawStars(t, scroll, nx) {
      const n = Math.floor(stars.length * q.stars);
      for (let i = 0; i < n; i++) {
        const s = stars[i];
        let y = (s.y * H - scroll * (0.02 + s.z * 0.14)) % H;
        if (y < 0) y += H;
        const x = s.x * W + nx * s.z * 16;

        let w = 0.5 + 0.5 * Math.sin(t * s.spd + s.ph);
        if (s.sharp) w = w * w * w;
        const a = clamp(s.base + s.amp * w - 0.1, 0.05, 1);

        if (s.spike) {
          // halo lembut + kilau silang untuk bintang terang
          const hs = s.r * (6 + 5 * w);
          ctx.globalAlpha = a * 0.35;
          ctx.drawImage(sprites.white, x - hs, y - hs, hs * 2, hs * 2);
        }

        ctx.globalAlpha = a;
        ctx.fillStyle = s.col;
        if (s.r < 0.8) {
          ctx.fillRect(x, y, s.r * 1.6, s.r * 1.6);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, TAU);
          ctx.fill();
        }

        if (s.spike) {
          const L = s.r * (3 + 4 * w);
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = s.col;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(x - L, y); ctx.lineTo(x + L, y);
          ctx.moveTo(x, y - L); ctx.lineTo(x, y + L);
          ctx.stroke();
        }
        s.sx = x; s.sy = y;
      }
    }

    // Garis rasi bintang yang muncul di sekitar kursor
    function drawConstellation() {
      if (!q.lines || pointer.a < 0.05) return;
      const near = [];
      for (let i = 0; i < bright.length && near.length < 9; i++) {
        const s = bright[i];
        const dx = s.sx - pointer.x, dy = s.sy - pointer.y;
        if (dx * dx + dy * dy < 44100) near.push(s);
      }
      if (near.length < 2) return;
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = '#b9c4ff';
      for (let i = 0; i < near.length; i++) {
        for (let j = i + 1; j < near.length; j++) {
          const dx = near[i].sx - near[j].sx, dy = near[i].sy - near[j].sy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 180) {
            ctx.globalAlpha = (1 - d / 180) * 0.45 * pointer.a;
            ctx.beginPath();
            ctx.moveTo(near[i].sx, near[i].sy);
            ctx.lineTo(near[j].sx, near[j].sy);
            ctx.stroke();
          }
        }
      }
    }

    function drawDust(dt, t) {
      const n = Math.floor(dust.length * q.dust);
      const pa = pointer.a;
      for (let i = 0; i < n; i++) {
        const p = dust[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (pa > 0.05) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 22500 && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = (1 - d / 150) * 46 * dt * pa;
            p.x += dx / d * f;
            p.y += dy / d * f;
          }
        }
        if (p.x < -30) p.x = W + 30; else if (p.x > W + 30) p.x = -30;
        if (p.y < -30) p.y = H + 30; else if (p.y > H + 30) p.y = -30;
        ctx.globalAlpha = p.a * (0.55 + 0.45 * Math.sin(t * p.tw + p.ph));
        ctx.drawImage(p.spr, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
    }

    function spawnMeteor() {
      const dir = Math.random() < 0.7 ? 1 : -1;
      const ang = rand(0.35, 0.75);
      const speed = rand(520, 900) * (W < 600 ? 0.75 : 1);
      meteors.push({
        x: dir === 1 ? rand(-0.05 * W, 0.7 * W) : rand(0.3 * W, 1.05 * W),
        y: rand(-0.05 * H, 0.45 * H),
        vx: Math.cos(ang) * speed * dir,
        vy: Math.sin(ang) * speed,
        speed: speed,
        len: rand(140, 260),
        life: 0,
        max: rand(1.0, 1.7),
        w: rand(1.2, 2.2)
      });
    }

    function drawMeteors(dt) {
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const p = m.life / m.max;
        if (p >= 1 || m.x < -300 || m.x > W + 300 || m.y > H + 300) {
          meteors.splice(i, 1);
          continue;
        }
        const env = p < 0.15 ? p / 0.15 : (p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1);
        const grow = Math.min(1, m.life / 0.25);
        const ux = m.vx / m.speed, uy = m.vy / m.speed;
        const tx = m.x - ux * m.len * grow;
        const ty = m.y - uy * m.len * grow;
        const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
        g.addColorStop(0, 'rgba(255,255,255,' + (0.95 * env).toFixed(3) + ')');
        g.addColorStop(0.35, 'rgba(190,200,255,' + (0.45 * env).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(140,110,255,0)');
        ctx.globalAlpha = 1;
        ctx.strokeStyle = g;
        ctx.lineWidth = m.w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        const hs = 22 * env + 6;
        ctx.globalAlpha = env;
        ctx.drawImage(sprites.white, m.x - hs / 2, m.y - hs / 2, hs, hs);
      }
    }

    function draw(dt, t, scroll) {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'butt';
      const prog = clamp(scroll / Math.max(1, state.docH - H), 0, 1);

      drawNebula(t, prog, pointer.nx, pointer.ny);
      drawStars(t, scroll, pointer.nx);
      drawConstellation();
      drawDust(dt, t);

      if (!state.reduce) {
        nextMeteor -= dt;
        if (nextMeteor <= 0) {
          spawnMeteor();
          if (Math.random() < 0.18) setTimeout(spawnMeteor, 260);
          nextMeteor = rand(3.2, 8.5);
        }
        drawMeteors(dt);
      } else if (meteors.length) {
        meteors.length = 0;
      }
      ctx.globalAlpha = 1;
    }

    function degrade(level) {
      if (level >= 1) { q.stars = 0.75; q.dust = 0.7; }
      if (level >= 2) { q.stars = 0.55; q.nebula = 2; q.lines = false; }
      if (level >= 3) { q.stars = 0.4; q.nebula = 1; q.dust = 0.4; }
    }

    return { resize: resize, draw: draw, degrade: degrade };
  })();

  /* ----------------------------------------------------------
     5. ORBIT & PLANET (DOM, digerakkan oleh loop yang sama)
     ---------------------------------------------------------- */
  const Orbits = (function () {
    const sys = $('#orbitSystem');
    const hero = $('#hero');
    if (!sys || !hero) return null;

    const ROT = -16 * Math.PI / 180;
    const cosR = Math.cos(ROT), sinR = Math.sin(ROT);
    const items = $$('.planet', sys).map(function (el) {
      return {
        el: el,
        orbit: parseFloat(el.dataset.orbit) || 0.5,
        speed: parseFloat(el.dataset.speed) || 0.05,
        phase: parseFloat(el.dataset.phase) || 0,
        moon: $('.moon', el),
        w: 0
      };
    });

    let size = 0, tilt = 0.3, cx = 0, cy = 0;

    function measure() {
      size = sys.offsetWidth;
      const tv = parseFloat(getComputedStyle(sys).getPropertyValue('--tilt'));
      tilt = isNaN(tv) ? 0.3 : tv;
      const r = hero.getBoundingClientRect();
      cx = state.vw / 2;
      cy = r.top + (window.pageYOffset || 0) + r.height / 2;
      items.forEach(function (it) { it.w = it.el.offsetWidth; });
    }

    function update(t, scroll) {
      const half = size / 2;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const a = it.phase + t * it.speed;
        const rx = half * it.orbit;
        const ry = rx * tilt;
        const lx = Math.cos(a) * rx;
        const ly = Math.sin(a) * ry;
        const d = (Math.sin(a) + 1) / 2;           // 0 = belakang, 1 = depan
        const sc = 0.74 + 0.36 * d;

        it.el.style.transform = 'translate3d(' + lx.toFixed(1) + 'px,' + ly.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + sc.toFixed(3) + ')';
        it.el.style.opacity = (0.5 + 0.5 * d).toFixed(2);
        it.el.style.zIndex = d > 0.5 ? 2 : 1;

        // Arah cahaya menuju kursor / cahaya idle
        const wx = cx + lx * cosR - ly * sinR;
        const wy = cy - scroll + lx * sinR + ly * cosR;
        const dx = light.x - wx, dy = light.y - wy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        it.el.style.setProperty('--lx', (50 + dx / dist * 30).toFixed(1) + '%');
        it.el.style.setProperty('--ly', (50 + dy / dist * 30).toFixed(1) + '%');

        if (it.moon) {
          const b = t * 0.55 + it.phase * 2;
          const mr = it.w * 0.78;
          const mx = Math.cos(b) * mr, my = Math.sin(b) * mr * 0.3;
          const ca = Math.cos(-0.31), sa = Math.sin(-0.31);
          it.moon.style.transform = 'translate(' + (mx * ca - my * sa).toFixed(1) + 'px,' + (mx * sa + my * ca).toFixed(1) + 'px) translate(-50%,-50%)';
          it.moon.style.zIndex = Math.sin(b) > 0 ? 3 : 0;
        }
      }
    }

    return { measure: measure, update: update };
  })();

  /* ----------------------------------------------------------
     6. UI YANG IKUT LOOP: cahaya kursor, parallax hero,
        garis proses, pencahayaan foto
     ---------------------------------------------------------- */
  const UI = (function () {
    const glow = $('#cursorGlow');
    const timeline = $('#timeline');
    const avatar = $('#avatar');
    const orbitWrap = $('#orbitWrap');
    const heroContent = $('#heroContent');
    const hero = $('#hero');

    const tl = { top: 0, h: 1 };
    const av = { left: 0, top: 0, w: 1, h: 1, vis: false };
    let heroH = 1, lastP = -1, glowOn = false;

    function measure() {
      const sy = window.pageYOffset || 0;
      if (timeline) {
        const r = timeline.getBoundingClientRect();
        tl.top = r.top + sy; tl.h = r.height || 1;
      }
      if (avatar) {
        const r = avatar.getBoundingClientRect();
        av.left = r.left; av.top = r.top + sy; av.w = r.width || 1; av.h = r.height || 1;
      }
      if (hero) heroH = hero.offsetHeight || 1;
      state.docH = document.documentElement.scrollHeight;
    }

    if (avatar && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        av.vis = entries[0].isIntersecting;
      }, { rootMargin: '80px' }).observe(avatar);
    } else {
      av.vis = true;
    }

    function update(t, scroll) {
      // Cahaya mengikuti kursor / sentuhan
      if (glow) {
        if (pointer.a > 0.01) {
          glow.style.opacity = (pointer.a * 0.9).toFixed(3);
          glow.style.transform = 'translate3d(' + (pointer.x - 260).toFixed(1) + 'px,' + (pointer.y - 260).toFixed(1) + 'px,0)';
          glowOn = true;
        } else if (glowOn) {
          glow.style.opacity = '0';
          glowOn = false;
        }
      }

      // Parallax + pudar hero saat menggulir
      if (scroll < heroH * 1.3) {
        if (orbitWrap) {
          orbitWrap.style.transform = 'translate3d(0,' + (scroll * 0.18).toFixed(1) + 'px,0)';
          orbitWrap.style.opacity = clamp(1 - scroll / (heroH * 0.95), 0, 1).toFixed(3);
        }
        if (heroContent) {
          heroContent.style.transform = 'translate3d(0,' + (scroll * 0.06).toFixed(1) + 'px,0)';
          heroContent.style.opacity = clamp(1 - scroll / (heroH * 0.8), 0, 1).toFixed(3);
        }
      }

      // Garis proses menyala mengikuti scroll
      if (timeline) {
        const p = clamp((scroll + state.vh * 0.62 - tl.top) / tl.h, 0, 1);
        if (Math.abs(p - lastP) > 0.002) {
          timeline.style.setProperty('--p', p.toFixed(3));
          lastP = p;
        }
      }

      // Pencahayaan dinamis foto developer (hanya overlay)
      if (avatar && av.vis) {
        const px = clamp((light.x - av.left) / av.w * 100, -20, 120);
        const py = clamp((light.y - (av.top - scroll)) / av.h * 100, -20, 120);
        avatar.style.setProperty('--px', px.toFixed(1) + '%');
        avatar.style.setProperty('--py', py.toFixed(1) + '%');
        avatar.style.setProperty('--sx', (100 - px).toFixed(1) + '%');
        avatar.style.setProperty('--sy', (100 - py).toFixed(1) + '%');
      }
    }

    return { measure: measure, update: update };
  })();

  /* ----------------------------------------------------------
     7. LOOP UTAMA (satu requestAnimationFrame)
     ---------------------------------------------------------- */
  const ticker = { raf: 0, last: 0, t: 0, running: false, slow: 0, frames: 0, level: 0 };

  function render(dt, t, now) {
    updatePointer(dt, now);
    updateLight(t);
    const sc = state.scrollY;
    if (Cosmos) Cosmos.draw(dt, t, sc);
    if (Orbits) Orbits.update(t, sc);
    UI.update(t, sc);
  }

  function perfCheck(dt) {
    if (ticker.t < 3) { ticker.frames = 0; ticker.slow = 0; return; }
    ticker.frames++;
    if (dt > 0.04) ticker.slow++;
    if (ticker.frames >= 90) {
      const ratio = ticker.slow / ticker.frames;
      ticker.frames = 0; ticker.slow = 0;
      if (ratio > 0.5 && ticker.level < 3) {
        ticker.level++;
        if (Cosmos) Cosmos.degrade(ticker.level);
      }
    }
  }

  function frame(now) {
    ticker.raf = requestAnimationFrame(frame);
    let dt = (now - ticker.last) / 1000;
    ticker.last = now;
    if (dt > 0.1) dt = 0.016;       // setelah tab aktif kembali
    dt = Math.min(dt, 0.05);
    ticker.t += dt;
    perfCheck(dt);
    render(dt, ticker.t, now);
  }

  function start() {
    if (ticker.running || state.reduce || document.hidden) return;
    ticker.running = true;
    ticker.last = performance.now();
    ticker.raf = requestAnimationFrame(frame);
  }

  function stop() {
    ticker.running = false;
    cancelAnimationFrame(ticker.raf);
  }

  let staticQueued = false;
  function scheduleStatic() {
    if (staticQueued) return;
    staticQueued = true;
    requestAnimationFrame(function () {
      staticQueued = false;
      render(0, ticker.t, performance.now());
    });
  }

  /* ----------------------------------------------------------
     8. EVENT: scroll, resize, tab aktif/tidak, reduced-motion
     ---------------------------------------------------------- */
  const header = $('.site-header');

  function onScroll() {
    state.scrollY = window.pageYOffset || 0;
    if (header) header.classList.toggle('scrolled', state.scrollY > 24);
    if (!ticker.running) scheduleStatic();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  function measureAll() {
    state.vw = window.innerWidth;
    state.vh = window.innerHeight;
    UI.measure();
    if (Orbits) Orbits.measure();
  }

  const onResize = debounce(function () {
    state.vw = window.innerWidth;
    state.vh = window.innerHeight;
    if (Cosmos) Cosmos.resize(false);
    measureAll();
    if (!ticker.running) scheduleStatic();
  }, 120);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  function onMotionChange(e) {
    state.reduce = e.matches;
    if (state.reduce) {
      stop();
      pointer.target = 0; pointer.a = 0;
      scheduleStatic();
    } else {
      start();
    }
  }
  if (motionMQ.addEventListener) motionMQ.addEventListener('change', onMotionChange);
  else if (motionMQ.addListener) motionMQ.addListener(onMotionChange);

  window.addEventListener('load', function () {
    measureAll();
    setTimeout(measureAll, 700);
    if (!ticker.running) scheduleStatic();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { measureAll(); });
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(debounce(measureAll, 150)).observe(document.body);
  }

  /* ----------------------------------------------------------
     9. FITUR HALAMAN: tautan sosial, menu, reveal, kartu, foto
     ---------------------------------------------------------- */
  function setupSocials() {
    const toast = $('#toast');
    let timer = 0;
    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(function () { toast.classList.remove('show'); }, 3200);
    }
    $$('[data-social]').forEach(function (a) {
      const key = a.dataset.social;
      const url = (SOCIAL_LINKS[key] || '').trim();
      if (url) {
        a.setAttribute('href', url);
        if (/^https?:/i.test(url)) {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        }
      } else {
        a.setAttribute('data-empty', 'true');
        a.addEventListener('click', function (e) {
          e.preventDefault();
          showToast('Tautan ' + (a.dataset.label || key) + ' belum diisi. Edit SOCIAL_LINKS di animation.js.');
        });
      }
    });
  }

  function setupNav() {
    const btn = $('.nav-toggle');
    const nav = $('#site-nav');
    if (!btn || !nav) return;

    function close() {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function () {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !btn.contains(e.target)) close();
    });

    // Tandai tautan menu sesuai seksi yang sedang dilihat
    if ('IntersectionObserver' in window) {
      const links = {};
      $$('a', nav).forEach(function (a) { links[a.getAttribute('href')] = a; });
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); });
            const a = links['#' + en.target.id];
            if (a) a.classList.add('active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      ['layanan', 'proses', 'developer', 'kontak'].forEach(function (id) {
        const s = document.getElementById(id);
        if (s) io.observe(s);
      });
    }
  }

  function setupReveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window) || state.reduce) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) {
      if (el.dataset.delay) el.style.transitionDelay = el.dataset.delay + 'ms';
      io.observe(el);
    });
  }

  // Kartu: sorotan cahaya mengikuti pointer + kemiringan halus di desktop
  function setupCards() {
    const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    $$('.spot').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
        if (canTilt && e.pointerType === 'mouse' && !state.reduce && card.hasAttribute('data-tilt')) {
          const px = x / r.width - 0.5, py = y / r.height - 0.5;
          card.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg');
          card.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
        }
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // Foto developer: beri tahu jika file tidak ditemukan
  function setupAvatar() {
    const wrap = $('#avatarPhoto');
    const img = wrap && $('img', wrap);
    if (!img) return;
    function markMissing() { wrap.classList.add('missing'); }
    img.addEventListener('error', markMissing);
    if (img.complete && img.naturalWidth === 0) markMissing();
  }

  /* ----------------------------------------------------------
     10. MULAI
     ---------------------------------------------------------- */
  function init() {
    setupSocials();
    setupNav();
    setupReveal();
    setupCards();
    setupAvatar();

    if (header) header.classList.toggle('scrolled', state.scrollY > 24);
    if (Cosmos) Cosmos.resize(true);
    measureAll();

    if (state.reduce) scheduleStatic(); else start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
