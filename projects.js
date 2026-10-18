/* =========================================================
   NOVAIX STUDIO — KATALOG PROYEK
   ---------------------------------------------------------
   CARA MENGISI / MENAMBAH PROYEK
   Cukup edit array NOVAIX_PROJECTS di bawah ini. Salin satu blok
   { ... }, tempel di bawahnya (jangan lupa koma), lalu ganti nilainya.
   Kartu, filter kategori, pencarian, dan jendela Detail dibuat otomatis.

     id               : kode unik tanpa spasi (mis. "novaix-robot")
     name             : nama proyek
     category         : kategori (tombol filter dibuat otomatis dari sini)
     shortDescription : teks pendek di kartu
     description      : teks lengkap di jendela Detail
                        (baris baru "\n" akan tampil sebagai paragraf)
     image            : URL gambar atau nama file (mis. "nubi.jpg").
                        Kosongkan "" untuk placeholder galaxy.
                        Jika URL gagal dimuat, placeholder tampil otomatis.
     status           : mis. "In Development", "Prototype", "Live"
     features         : daftar fitur, mis. ["Fitur A", "Fitur B"]
     demoUrl          : link demo (https://...). "" atau "#" = belum tersedia
     previewUrl       : link Live Preview (https://...). "" atau "#" = belum tersedia
     accent           : warna aksen hex, mis. "#9b87ff" (ungu), "#3d7bff" (biru),
                        "#35e0ff" (cyan), "#ff4fd8" (magenta), "#ffc94a" (emas),
                        "#4dff9a" (hijau)
     icon             : satu simbol/emoji, mis. "✦"

   TEMPLATE PROYEK BARU (salin, hapus tanda komentar, isi datanya):
   ,{
     id: "nama-unik",
     name: "NAMA PROYEK",
     category: "KATEGORI",
     shortDescription: "",
     description: "",
     image: "",
     status: "",
     features: [],
     demoUrl: "",
     previewUrl: "",
     accent: "#9b87ff",
     icon: "✦"
   }
   ========================================================= */
var NOVAIX_PROJECTS = [
  {
    id: 'nubi',
    name: 'Nubi Project',
    category: 'Interactive Companion',
    shortDescription: 'Teman plush virtual yang imut, ekspresif, dan merespons interaksi.',
    description: 'Teman plush virtual yang imut, ekspresif, dan merespons interaksi.',
    image: '',
    status: 'In Development',
    features: [
      'Karakter plush virtual yang imut',
      'Ekspresi yang hidup',
      'Merespons interaksi pengguna'
    ],
    demoUrl: '',
    previewUrl: '',
    accent: '#ff82c7',
    icon: '✿'
  },
  {
    id: 'Novaix',
    name: 'NOVAIX HOLOMOTION',
    category: 'Digital Experiment',
    shortDescription: 'Gesture-Based Holographic Interaction.',
    description: 'Mengubah gerakan tangan menjadi pengalaman interaksi digital yang futuristik. Jelajahi teknologi hand tracking dan kendalikan elemen visual tanpa menyentuh layar.',
    image: '000221133.jpg',
    status: 'Exploring',
    features: [
      'Hand Tracking: mendeteksi posisi dan gerakan tangan melalui kamera.',
      'Interactive Visuals: memungkinkan interaksi dengan elemen visual digital.'
    ],
    demoUrl: 'https://barrrxy.github.io/Hologram-Hand-3D/',
    previewUrl: 'https://barrrxy.github.io/Hologram-Hand-3D/',
    accent: '#35e0ff',
    icon: '🌐'
  },
  {
    id: 'novaix-ai',
    name: 'NOVAIX AI',
    category: 'Conversational Web',
    shortDescription: 'Eksplorasi pengalaman asisten digital dengan antarmuka percakapan.',
    description: 'Eksplorasi pengalaman asisten digital dengan antarmuka percakapan.',
    image: '',
    status: 'Prototype',
    features: [
      'Antarmuka percakapan',
      'Pengalaman asisten digital'
    ],
    demoUrl: '',
    previewUrl: '',
    accent: '#9b87ff',
    icon: '✧'
  }
];

/* =========================================================
   LOGIKA KATALOG — tidak perlu diedit untuk menambah proyek
   ========================================================= */
(function () {
  'use strict';
  var list = document.getElementById('publicProjectList');
  if (!list) return;

  var DEFAULT_ACCENT = '#9b87ff';

  /* ---------- Helper ---------- */
  function norm(v) { return String(v == null ? '' : v).trim().toLocaleLowerCase('id-ID').replace(/\s+/g, ' '); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function str(v, fallback) { v = String(v == null ? '' : v).trim(); return v || fallback || ''; }

  // Tautan Demo/Preview: kosong, "#", atau skema selain http(s) = belum tersedia.
  function safeUrl(v) {
    v = str(v);
    if (!v || v.charAt(0) === '#') return '';
    try {
      var u = new URL(v, location.href);
      var ok = /^https?:$/.test(u.protocol) || (location.protocol === 'file:' && u.protocol === 'file:');
      return ok ? u.href : '';
    } catch (e) { return ''; }
  }
  // URL gambar: http(s), nama file relatif, blob, atau data:image. Selain itu ditolak.
  function safeImage(v) {
    v = str(v);
    if (!v) return '';
    try {
      var u = new URL(v, location.href);
      if (/^https?:$/.test(u.protocol) || u.protocol === 'blob:') return u.href;
      if (u.protocol === 'file:' && location.protocol === 'file:') return u.href;
      if (u.protocol === 'data:' && /^data:image\//i.test(v)) return v;
    } catch (e) {}
    return '';
  }

  // Warna aksen: validasi hex lalu turunkan variabel CSS yang dibutuhkan desain.
  function parseAccent(v) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(str(v));
    var hex = m ? m[1] : DEFAULT_ACCENT.slice(1);
    if (hex.length === 3) hex = hex.replace(/./g, '$&$&');
    var r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16);
    function mix(c) { return Math.round(c + (255 - c) * 0.38); } // versi lebih terang untuk teks
    var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return {
      hex: '#' + hex.toLowerCase(),
      rgb: r + ',' + g + ',' + b,
      soft: 'rgb(' + mix(r) + ',' + mix(g) + ',' + mix(b) + ')',
      ink: lum > 0.6 ? '#070a1c' : '#ffffff' // teks tombol agar tetap terbaca
    };
  }
  function applyAccent(node, p) {
    node.style.setProperty('--ac', p.accent.hex);
    node.style.setProperty('--ac-rgb', p.accent.rgb);
    node.style.setProperty('--ac-soft', p.accent.soft);
    node.style.setProperty('--ac-ink', p.accent.ink);
  }

  /* ---------- Rapikan data ---------- */
  var seenIds = {};
  var projects = (Array.isArray(window.NOVAIX_PROJECTS) ? window.NOVAIX_PROJECTS : []).filter(Boolean).map(function (p, i) {
    var id = str(p.id, 'proyek-' + (i + 1)).replace(/\s+/g, '-');
    while (seenIds[id]) id += '-' + (i + 1); // ID ganda tidak boleh bentrok
    seenIds[id] = 1;
    var shortD = str(p.shortDescription), full = str(p.description);
    return {
      id: id,
      name: str(p.name, 'Tanpa nama'),
      category: str(p.category, 'Lainnya'),
      shortDescription: shortD || full,
      description: full || shortD,
      image: safeImage(p.image),
      status: str(p.status),
      features: (Array.isArray(p.features) ? p.features : []).map(function (f) { return str(f); }).filter(Boolean),
      demoUrl: safeUrl(p.demoUrl),
      previewUrl: safeUrl(p.previewUrl),
      accent: parseAccent(p.accent),
      icon: str(p.icon, '✦')
    };
  });
  var byId = {};
  projects.forEach(function (p, i) { p.index = i; byId[p.id] = p; });

  /* ---------- Notifikasi (memakai elemen #toast yang sudah ada) ---------- */
  var toastEl = document.getElementById('toast'), toastTimer = 0;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }

  /* ---------- Gambar atau placeholder galaxy ---------- */
  function buildVisual(p, large) {
    var v = el('div', 'nx-project-visual' + (large ? ' nx-visual-large' : ''));
    // Placeholder selalu ada di bawah; hilang halus saat gambar berhasil dimuat.
    var ph = el('span', 'nx-ph');
    ph.append(el('span', 'nx-ph-stars'), el('span', 'nx-ph-ring'), el('span', 'nx-ph-ring r2'),
      el('span', 'nx-project-glyph', p.icon), el('span', 'nx-ph-text', 'PROJECT IMAGE COMING SOON'));
    v.appendChild(ph);
    if (p.image) {
      var img = el('img', 'nx-project-img');
      img.alt = 'Gambar ' + p.name;
      img.decoding = 'async';
      img.loading = large ? 'eager' : 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('load', function () { v.classList.add('has-img'); }, { once: true });
      img.addEventListener('error', function () { img.remove(); }, { once: true }); // tidak ada ikon rusak
      img.src = p.image;
      v.appendChild(img);
      v.appendChild(el('span', 'nx-pv-badge', p.icon));
    }
    if (!large) v.appendChild(el('span', 'nx-project-number', 'PROJECT ' + String(p.index + 1).padStart(3, '0')));
    return v;
  }
  function buildMeta(p) {
    var meta = el('div', 'nx-project-meta');
    meta.appendChild(el('span', '', p.category));
    if (p.status) meta.appendChild(el('i', '', p.status));
    return meta;
  }

  /* ---------- Render kartu ---------- */
  var cards = [];
  list.textContent = '';
  projects.forEach(function (p) {
    var card = el('article', 'nx-project reveal');
    card.dataset.id = p.id;
    card.dataset.category = norm(p.category);
    card.dataset.search = norm([p.name, p.category, p.shortDescription, p.description].join(' '));
    card.tabIndex = 0;
    card.setAttribute('aria-label', 'Lihat detail ' + p.name);
    applyAccent(card, p);

    var actions = el('div', 'nx-card-actions');
    var det = el('button', 'nx-card-btn nx-card-btn-ghost', 'Detail');
    det.type = 'button'; det.dataset.action = 'detail'; det.dataset.id = p.id;
    actions.appendChild(det);
    if (p.demoUrl) {
      var d = el('a', 'nx-card-btn nx-card-btn-main', 'Demo ↗');
      d.href = p.demoUrl; d.target = '_blank'; d.rel = 'noopener noreferrer';
      actions.appendChild(d);
    }
    if (p.previewUrl) {
      var pv = el('button', 'nx-card-btn', 'Preview');
      pv.type = 'button'; pv.dataset.action = 'preview'; pv.dataset.id = p.id;
      actions.appendChild(pv);
    }
    if (!p.demoUrl && !p.previewUrl) actions.appendChild(el('span', 'nx-card-na', 'Demo belum tersedia'));

    var info = el('div', 'nx-project-info');
    info.append(buildMeta(p), el('h3', '', p.name), el('p', '', p.shortDescription), actions);
    card.append(buildVisual(p, false), info);
    list.appendChild(card);
    cards.push(card);
  });

  /* ---------- Pencarian + filter (bisa dipakai bersamaan) ---------- */
  var tools = document.getElementById('projectTools');
  var search = document.getElementById('projectSearch');
  var filters = document.getElementById('projectFilters');
  var count = document.getElementById('projectCount');
  var empty = document.getElementById('projectEmpty');
  var reset = document.getElementById('projectReset');
  var activeCat = 'all', searchTimer = 0;

  var cats = [], catSeen = {};
  projects.forEach(function (p) { var k = norm(p.category); if (!catSeen[k]) { catSeen[k] = 1; cats.push(p.category); } });

  function setChipState() {
    if (!filters) return;
    filters.querySelectorAll('.nx-chip').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.cat === activeCat ? 'true' : 'false'); });
  }
  if (filters) {
    filters.textContent = '';
    [['Semua', 'all']].concat(cats.map(function (c) { return [c, norm(c)]; })).forEach(function (c) {
      var b = el('button', 'nx-chip', c[0]);
      b.type = 'button'; b.dataset.cat = c[1];
      filters.appendChild(b);
    });
    setChipState();
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('.nx-chip'); if (!b) return;
      activeCat = b.dataset.cat; setChipState(); apply();
    });
  }

  function apply() {
    var q = norm(search ? search.value : '');
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (activeCat === 'all' || c.dataset.category === activeCat) && (!q || c.dataset.search.indexOf(q) > -1);
      c.hidden = !ok;
      if (ok) { shown++; c.classList.add('in'); }
    });
    if (count) count.textContent = shown + ' dari ' + cards.length + ' proyek';
    if (empty) empty.hidden = shown > 0 || cards.length === 0;
  }
  if (search) search.addEventListener('input', function () { clearTimeout(searchTimer); searchTimer = setTimeout(apply, 120); });
  if (reset) reset.addEventListener('click', function () {
    if (search) search.value = '';
    activeCat = 'all'; setChipState(); apply();
  });
  if (tools) tools.hidden = cards.length === 0;
  apply();

  /* ---------- Modal (semua listener dipasang SEKALI saat halaman dimuat) ---------- */
  var dModal = document.getElementById('projectModal');
  var dBody = document.getElementById('projectModalBody');
  var pvModal = document.getElementById('previewModal');
  var frame = document.getElementById('previewFrame');
  var pvState = document.getElementById('previewState');
  var pvTitle = document.getElementById('previewTitle');
  var pvTab = document.getElementById('previewNewTab');
  var pvHint = document.getElementById('previewHint');
  var pvHintLink = document.getElementById('previewHintLink');
  var pvTimer = 0;
  if (!dModal || !dBody || !pvModal || !frame) return;

  var stack = [], lockCount = 0;
  var closeTimers = new WeakMap();
  function panelOf(m) { return m.querySelector('.nx-modal-panel'); }

  function openModal(m, p) {
    clearTimeout(closeTimers.get(m));
    if (stack.indexOf(m) > -1) return;
    m._opener = document.activeElement;
    if (p) applyAccent(panelOf(m), p);
    m.hidden = false;
    stack.push(m);
    requestAnimationFrame(function () { m.classList.add('is-open'); });
    if (lockCount++ === 0) { document.documentElement.classList.add('nx-modal-open'); document.body.classList.add('nx-modal-open'); }
    var f = m.querySelector('.nx-modal-close, .nx-pv-btn');
    if (f) f.focus({ preventScroll: true });
  }
  function closeModal(m, after) {
    var at = stack.indexOf(m);
    if (at < 0) return;
    stack.splice(at, 1);
    m.classList.remove('is-open');
    if (--lockCount <= 0) { lockCount = 0; document.documentElement.classList.remove('nx-modal-open'); document.body.classList.remove('nx-modal-open'); }
    closeTimers.set(m, setTimeout(function () {
      m.hidden = true;
      if (after) after();
      var o = m._opener;
      if (o && document.contains(o) && o.focus) o.focus({ preventScroll: true });
    }, 200));
  }

  dModal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(dModal); });
  pvModal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closePreview(); });
  document.addEventListener('keydown', function (e) {
    var top = stack[stack.length - 1];
    if (!top) return;
    if (e.key === 'Escape') { if (top === pvModal) closePreview(); else closeModal(top); return; }
    if (e.key === 'Tab') { // fokus keyboard tetap di dalam modal teratas
      var f = Array.prototype.filter.call(top.querySelectorAll('a[href],button:not([disabled]),iframe'), function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (!top.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Detail ---------- */
  function openDetail(id) {
    var p = byId[id]; if (!p) return;
    dBody.textContent = '';
    var content = el('div', 'nx-md-content');
    var title = el('h3', 'nx-modal-title', p.name); title.id = 'projectModalTitle';
    content.append(el('div', 'nx-md-icon', p.icon), buildMeta(p), title, el('div', 'nx-md-rule'),
      el('span', 'nx-modal-label', 'TENTANG PROYEK'), el('p', 'nx-modal-desc', p.description));

    var ft = el('section', 'nx-modal-features');
    ft.appendChild(el('span', 'nx-modal-label', 'FITUR UTAMA'));
    if (p.features.length) {
      var ul = el('ul', 'nx-md-feat');
      p.features.forEach(function (f) { ul.appendChild(el('li', '', f)); });
      ft.appendChild(ul);
    } else ft.appendChild(el('span', 'nx-card-na', 'Daftar fitur belum ditambahkan.'));
    content.appendChild(ft);

    var acts = el('div', 'nx-modal-actions');
    if (p.demoUrl) {
      var d = el('a', 'nx-card-btn nx-card-btn-main', 'Demo ↗');
      d.href = p.demoUrl; d.target = '_blank'; d.rel = 'noopener noreferrer';
      acts.appendChild(d);
    } else {
      var dn = el('button', 'nx-card-btn nx-card-btn-main is-disabled', 'Demo');
      dn.type = 'button'; dn.dataset.action = 'na'; dn.dataset.kind = 'Demo'; dn.setAttribute('aria-disabled', 'true');
      acts.appendChild(dn);
    }
    if (p.previewUrl) {
      var pv = el('button', 'nx-card-btn', 'Live Preview');
      pv.type = 'button'; pv.dataset.action = 'preview'; pv.dataset.id = p.id;
      acts.appendChild(pv);
    } else {
      var pn = el('button', 'nx-card-btn is-disabled', 'Live Preview');
      pn.type = 'button'; pn.dataset.action = 'na'; pn.dataset.kind = 'Preview'; pn.setAttribute('aria-disabled', 'true');
      acts.appendChild(pn);
    }
    var cl = el('button', 'nx-card-btn nx-card-btn-ghost nx-card-btn-close', 'Tutup');
    cl.type = 'button'; cl.dataset.close = '';
    acts.appendChild(cl);
    content.appendChild(acts);

    dBody.append(buildVisual(p, true), el('span', 'nx-md-deco'), content);
    panelOf(dModal).scrollTop = 0;
    openModal(dModal, p);
  }
  dBody.addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]'); if (!b) return;
    if (b.dataset.action === 'preview') openPreview(b.dataset.id);
    else if (b.dataset.action === 'na') toast(b.dataset.kind + ' belum tersedia untuk proyek ini.');
  });

  /* ---------- Live Preview ---------- */
  function setState(kind, msg, url) {
    pvState.textContent = ''; pvState.className = 'nx-preview-state' + (kind ? ' is-' + kind : '');
    if (!kind) return;
    pvState.appendChild(el('span', 'nx-preview-icon', kind === 'loading' ? '✦' : '⚠'));
    pvState.appendChild(el('p', '', msg));
    if (kind === 'blocked' && url) {
      var a = el('a', 'nx-card-btn nx-card-btn-main', 'Buka di tab baru ↗');
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      pvState.appendChild(a);
    }
  }
  function openPreview(id) {
    var p = byId[id];
    if (!p || !p.previewUrl) { toast('Preview belum tersedia untuk proyek ini.'); return; }
    var url = p.previewUrl;
    pvTitle.textContent = p.name; pvTab.href = url;
    pvHint.hidden = true; pvHintLink.href = url;
    frame.classList.remove('is-loaded');
    setState('loading', 'Memuat preview…');
    openModal(pvModal, p);
    clearTimeout(pvTimer);
    pvTimer = setTimeout(function () {
      pvHint.hidden = true;
      setState('blocked', 'Preview tidak bisa ditampilkan di dalam panel. Website ini mungkin menolak iframe atau terlalu lama dimuat. Anda tetap bisa membukanya di tab baru.', url);
    }, 9000);
    frame.onload = function () {
      if (frame.getAttribute('src') === 'about:blank') return;
      clearTimeout(pvTimer);
      var blocked = false, crossOrigin = false;
      try { // Halaman satu domain: isi bisa diperiksa langsung
        var doc = frame.contentDocument;
        if (!doc) crossOrigin = true;
        else if (doc.URL === 'about:blank' || (doc.body && !doc.body.childElementCount && !doc.body.textContent.trim())) blocked = true;
      } catch (err) { crossOrigin = true; /* lintas domain: browser tidak mengizinkan pemeriksaan isi */ }
      if (blocked) setState('blocked', 'Website ini menolak ditampilkan di dalam panel preview.', url);
      else { setState(''); frame.classList.add('is-loaded'); pvHint.hidden = !crossOrigin; }
    };
    frame.src = url;
  }
  function closePreview() {
    clearTimeout(pvTimer);
    closeModal(pvModal, function () {
      frame.onload = null; frame.src = 'about:blank';
      pvHint.hidden = true; frame.classList.remove('is-loaded'); setState('');
    });
  }

  /* ---------- Satu listener untuk semua kartu ---------- */
  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]');
    if (b) { e.stopPropagation(); if (b.dataset.action === 'preview') openPreview(b.dataset.id); else openDetail(b.dataset.id); return; }
    if (e.target.closest('a')) return;
    var c = e.target.closest('.nx-project'); if (c) openDetail(c.dataset.id);
  });
  list.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('nx-project')) { e.preventDefault(); openDetail(e.target.dataset.id); }
  });
})();
