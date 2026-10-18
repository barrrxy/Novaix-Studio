
/* NOVAIX STUDIO — Visitor Counter Fix */
(function () {
  'use strict';

  function startCounter() {
    const counter = document.getElementById('novaixVisitorCount');

    if (!counter || counter.dataset.countStarted === 'true') return;

    counter.dataset.countStarted = 'true';

    const target = 1267;
    const duration = 10000;
    const startTime = performance.now();
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (reduceMotion) {
      counter.textContent = '1.000+';
      return;
    }

    counter.textContent = '0';

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);

      // Angka bertambah cepat, lalu melambat menjelang target.
      const eased = 1 - Math.pow(1 - progress, 2);
      const current = Math.floor(target * eased);

      counter.textContent = current >= target
        ? '1.000+'
        : current.toLocaleString('id-ID');

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        counter.textContent = '1.000+';
      }
    }

    requestAnimationFrame(tick);
  }

  function init() {
    startCounter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
