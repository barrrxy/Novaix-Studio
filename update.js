/* =========================================================
   NOVAIX STUDIO — UPDATE.JS
   Countdown 10 detik • Rantai 3D + gembok pada tombol Lanjutkan • Visitor • Social fix
   ========================================================= */
(function () {
  'use strict';
  var COUNTDOWN_SECONDS = 15;
  var UNLOCK_ANIMATION_MS = 1150;
  var VISITOR_TARGET = 1267;
  var VISITOR_DURATION = 10000;

  function reducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
  }

  /* Rantai logam 3D (SVG) yang melingkari tombol Lanjutkan.
     Mata rantai bergantian: tampak depan (cincin) & tampak samping (batang),
     sehingga terlihat saling mengait. Dibagi dua sisi agar bisa terlepas
     ke kiri dan kanan saat gembok terbuka. */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function buildButtonChain() {
    var layer = document.getElementById('splashChainLayer');
    var stage = document.getElementById('splashLockStage');
    if (!layer || !stage) return;
    var w = Math.round(layer.clientWidth), h = Math.round(layer.clientHeight);
    if (w < 40 || h < 30) return;
    if (layer.dataset.size === w + 'x' + h) return;
    layer.dataset.size = w + 'x' + h;
    layer.innerHTML = '';
    var svg = svgEl('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w, height: h });
    var defs = svgEl('defs', {});
    defs.innerHTML =
      '<linearGradient id="nxSteelA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#c3cde2"/><stop offset=".5" stop-color="#5d6883"/><stop offset=".75" stop-color="#d9e2f5"/><stop offset="1" stop-color="#3b4459"/></linearGradient>' +
      '<linearGradient id="nxSteelB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef3ff"/><stop offset=".45" stop-color="#8592ad"/><stop offset=".55" stop-color="#4a546c"/><stop offset="1" stop-color="#b9c4da"/></linearGradient>' +
      '<filter id="nxChainShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2.2" stdDeviation="1.6" flood-color="#000" flood-opacity=".75"/></filter>';
    svg.appendChild(defs);

    var m = 12;                      // jarak jalur rantai dari tepi layer
    var r = Math.min(18, (h - m * 2) / 2);
    var x0 = m, y0 = m, x1 = w - m, y1 = h - m, cx = w / 2;
    // Setengah kiri: dari bawah-tengah ke kiri, naik, lalu ke atas-tengah.
    var left = 'M' + cx + ' ' + y1 + ' H' + (x0 + r) + ' A' + r + ' ' + r + ' 0 0 1 ' + x0 + ' ' + (y1 - r) +
      ' V' + (y0 + r) + ' A' + r + ' ' + r + ' 0 0 1 ' + (x0 + r) + ' ' + y0 + ' H' + cx;
    var right = 'M' + cx + ' ' + y1 + ' H' + (x1 - r) + ' A' + r + ' ' + r + ' 0 0 0 ' + x1 + ' ' + (y1 - r) +
      ' V' + (y0 + r) + ' A' + r + ' ' + r + ' 0 0 0 ' + (x1 - r) + ' ' + y0 + ' H' + cx;

    var LINK = w < 260 ? 11 : 12.5;  // jarak antar mata rantai
    [['left', left], ['right', right]].forEach(function (side) {
      var path = svgEl('path', { d: side[1], fill: 'none' });
      svg.appendChild(path);
      var len = path.getTotalLength();
      var n = Math.max(6, Math.round(len / LINK));
      var step = len / n;
      var g = svgEl('g', { 'class': 'chain-side chain-' + side[0], filter: 'url(#nxChainShadow)' });
      var flat = svgEl('g', {}), edge = svgEl('g', {});
      for (var i = 1; i < n; i++) {
        var d = i * step;
        var p = path.getPointAtLength(d);
        var q = path.getPointAtLength(Math.min(len, d + 0.5));
        var ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
        var t = 'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ') rotate(' + ang.toFixed(1) + ')';
        if (i % 2) {
          var link = svgEl('g', { transform: t });
          link.appendChild(svgEl('rect', { x: -8.2, y: -4.6, width: 16.4, height: 9.2, rx: 4.6, fill: 'none', stroke: '#141a28', 'stroke-width': 4.2 }));
          link.appendChild(svgEl('rect', { x: -8.2, y: -4.6, width: 16.4, height: 9.2, rx: 4.6, fill: 'none', stroke: 'url(#nxSteelA)', 'stroke-width': 2.8 }));
          link.appendChild(svgEl('path', { d: 'M-5 -3.4 H3', stroke: '#fff', 'stroke-width': .9, 'stroke-linecap': 'round', opacity: .85 }));
          flat.appendChild(link);
        } else {
          var bar = svgEl('g', { transform: t });
          bar.appendChild(svgEl('rect', { x: -8.6, y: -2.3, width: 17.2, height: 4.6, rx: 2.3, fill: 'url(#nxSteelB)', stroke: '#141a28', 'stroke-width': .9 }));
          bar.appendChild(svgEl('rect', { x: -6, y: -1.5, width: 9, height: 1, rx: .5, fill: '#fff', opacity: .8 }));
          edge.appendChild(bar);
        }
      }
      g.appendChild(flat); g.appendChild(edge); // batang samping di atas cincin = efek mengait
      svg.appendChild(g);
    });
    layer.appendChild(svg);
  }

  function initSplashCountdown() {
    var splash = document.getElementById('novaixSplash');
    var button = document.getElementById('splashContinue');
    var stage = document.getElementById('splashLockStage');
    if (!splash || !button || button.dataset.countdownReady === 'true') return;
    button.dataset.countdownReady = 'true';
    var status = document.getElementById('splashCountdown');
    if (!status) {
      status = document.createElement('p');
      status.id = 'splashCountdown';
      status.className = 'splash-countdown';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      (stage || button).parentNode.insertBefore(status, stage || button);
    }
    buildButtonChain();
    var resizeTimer = null;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildButtonChain, 150);
    }
    window.addEventListener('resize', onResize, { passive: true });

    var deadline = Date.now() + COUNTDOWN_SECONDS * 1000;
    var finished = false;
    var timer = null;
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    button.classList.add('is-locked');
    if (stage) stage.classList.add('is-locked');

    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      status.textContent = 'Gembok terbuka…';
      status.classList.remove('countdown-intense');
      status.classList.add('countdown-done');
      if (stage) { stage.classList.remove('is-locked'); stage.classList.add('unlocking'); }
      button.classList.remove('is-locked');
      button.classList.add('unlocking');
      // Tombol baru aktif SETELAH animasi pelepasan rantai selesai.
      window.setTimeout(function () {
        button.disabled = false;
        button.setAttribute('aria-disabled', 'false');
        button.classList.remove('unlocking');
        button.classList.add('countdown-complete');
        if (stage) { stage.classList.remove('unlocking'); stage.classList.add('unlocked'); }
        splash.classList.add('splash-unlocked');
        status.textContent = 'Kamu siap menjelajah NOVAIX STUDIO.';
        window.removeEventListener('resize', onResize);
      }, reducedMotion() ? 50 : UNLOCK_ANIMATION_MS);
    }
    function tick() {
      if (finished) return;
      var remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (remaining <= 0) { finish(); return; }
      status.textContent = remaining + ' detik';
      status.dataset.value = String(remaining);
      status.classList.toggle('countdown-intense', remaining <= 3);
      timer = window.setTimeout(tick, 200);
    }
    tick();
  }

  function initVisitorCounter() {
    var counter = document.getElementById('novaixVisitorCount');
    if (!counter || counter.dataset.countStarted === 'true') return;
    counter.dataset.countStarted = 'true';
    if (reducedMotion()) { counter.textContent = '1.000+'; return; }
    var start = performance.now();
    function tick(now) {
      var progress = Math.min((now - start) / VISITOR_DURATION, 1);
      var eased = 1 - Math.pow(1 - progress, 2);
      var current = Math.floor(VISITOR_TARGET * eased);
      counter.textContent = current >= VISITOR_TARGET ? '1.000+' : current.toLocaleString('id-ID');
      if (progress < 1) window.requestAnimationFrame(tick);
      else counter.textContent = '1.000+';
    }
    window.requestAnimationFrame(tick);
  }

  function initSocialLinks() {
    document.querySelectorAll('[data-social], .social, .nx-social-link, .nx-social-links a, .socials a').forEach(function (link) {
      if (link.dataset.socialScrollFix === 'true') return;
      link.dataset.socialScrollFix = 'true';
      link.addEventListener('click', function (event) {
        var href = (link.getAttribute('href') || '').trim();
        if (!href || href === '#' || href.charAt(0) === '#' || /^javascript:/i.test(href)) {
          event.preventDefault();
          event.stopPropagation();
        }
      });
    });
  }

  function init() {
    initSplashCountdown();
    initVisitorCounter();
    initSocialLinks();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
