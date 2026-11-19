/* BloodAid motion and interaction layer. Purely cosmetic: nothing here is needed for the app to work.
   Everything is skipped when the visitor prefers reduced motion. */
(function () {
  'use strict';

  var BA = window.BA = window.BA || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fx = BA.fx = {};

  function rand(a, b) { return a + Math.random() * (b - a); }
  function accent() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    return v || '#d6284a';
  }

  // One red blood cell: a glossy biconcave disc with a darker dimple. Used by the hero and by click bursts.
  function drawRBC(g, x, y, r, rot, squash, alpha) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(1, squash);
    g.globalAlpha = alpha;
    var body = g.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    body.addColorStop(0, '#ff8a9c');
    body.addColorStop(0.55, '#d6284a');
    body.addColorStop(1, '#6e0f26');
    g.fillStyle = body;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    var dim = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.55);
    dim.addColorStop(0, 'rgba(60,5,18,.55)');
    dim.addColorStop(1, 'rgba(60,5,18,0)');
    g.fillStyle = dim;
    g.beginPath();
    g.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = alpha * 0.55;
    g.fillStyle = '#fff';
    g.beginPath();
    g.ellipse(-r * 0.35, -r * 0.4, r * 0.22, r * 0.11, -0.6, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // ------------------------------------------------------------------
  // 1. Click bursts: a ripple ring and a few droplets wherever you click.
  // ------------------------------------------------------------------
  var overlay = null;
  var octx = null;
  var parts = [];
  var rings = [];
  var running = false;
  var dpr = 1;

  function ensureOverlay() {
    if (overlay) { return; }
    overlay = document.createElement('canvas');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60';
    document.body.appendChild(overlay);
    octx = overlay.getContext('2d');
    sizeOverlay();
    window.addEventListener('resize', sizeOverlay);
  }

  function sizeOverlay() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    overlay.width = Math.round(window.innerWidth * dpr);
    overlay.height = Math.round(window.innerHeight * dpr);
  }

  fx.burst = function (x, y, count, color) {
    if (reduce) { return; }
    ensureOverlay();
    var c = color || accent();
    rings.push({ x: x, y: y, r: 4, life: 1, color: c });
    for (var i = 0; i < count; i++) {
      var a = rand(0, Math.PI * 2);
      var s = rand(1.5, 5.5);
      parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, r: rand(6, 12), life: 1, rot: rand(0, 6.28), spin: rand(-0.12, 0.12), tilt: rand(0, 6.28) });
    }
    if (!running) { running = true; requestAnimationFrame(tickOverlay); }
  };

  function tickOverlay() {
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (var i = rings.length - 1; i >= 0; i--) {
      var g = rings[i];
      g.r += 3.2;
      g.life -= 0.045;
      if (g.life <= 0) { rings.splice(i, 1); continue; }
      octx.globalAlpha = g.life * 0.55;
      octx.strokeStyle = g.color;
      octx.lineWidth = 2;
      octx.beginPath();
      octx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      octx.stroke();
    }

    for (var j = parts.length - 1; j >= 0; j--) {
      var p = parts[j];
      p.vy += 0.22;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.022;
      if (p.life <= 0) { parts.splice(j, 1); continue; }
      p.rot += p.spin;
      p.tilt += 0.18;
      drawRBC(octx, p.x, p.y, p.r * (0.55 + p.life * 0.45), p.rot, 0.62 + 0.38 * Math.abs(Math.cos(p.tilt)), Math.max(0, p.life));
    }
    octx.globalAlpha = 1;

    if (parts.length || rings.length) { requestAnimationFrame(tickOverlay); } else { running = false; }
  }

  // ------------------------------------------------------------------
  // 2. Hero: drifting blood cells that dodge the pointer and pop on click.
  // ------------------------------------------------------------------
  fx.mountHero = function (hero) {
    if (!hero || reduce) { return; }

    var canvas = document.createElement('canvas');
    canvas.className = 'hero-cells';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);
    var ctx = canvas.getContext('2d');

    var counter = hero.querySelector('.hero-pop');
    var w = 0;
    var h = 0;
    var pointer = { x: -999, y: -999, inside: false };
    var cells = [];
    var bits = [];
    var popped = 0;
    var visible = true;
    var last = performance.now();

    function size() {
      var rect = hero.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      var d = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * d);
      canvas.height = Math.round(h * d);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }

    function makeCell(fresh) {
      var depth = rand(0.4, 1);
      return {
        x: rand(0, w),
        y: fresh ? h + 60 : rand(0, h),
        r: rand(14, 40) * (0.6 + depth * 0.6),
        depth: depth,
        vx: rand(-0.12, 0.12),
        vy: -rand(0.1, 0.4) * depth,
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.01, 0.01),
        tilt: rand(0, Math.PI * 2),
        ox: 0,
        oy: 0
      };
    }

    size();
    var n = w < 600 ? 9 : 16;
    for (var i = 0; i < n; i++) { cells.push(makeCell(false)); }

    function drawCell(c) {
      drawRBC(ctx, c.x + c.ox, c.y + c.oy, c.r, c.rot, 0.62 + 0.38 * Math.abs(Math.cos(c.tilt)), 0.35 + c.depth * 0.6);
    }

    function frame(now) {
      if (!hero.isConnected) { return; }
      var dt = Math.min(2, (now - last) / 16.7);
      last = now;

      if (visible) {
        ctx.clearRect(0, 0, w, h);
        var px = pointer.inside ? (pointer.x / w - 0.5) : 0;
        var py = pointer.inside ? (pointer.y / h - 0.5) : 0;

        for (var i = 0; i < cells.length; i++) {
          var c = cells[i];
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          c.rot += c.spin * dt;
          c.tilt += 0.012 * dt;
          if (c.y < -60) { cells[i] = makeCell(true); continue; }
          if (c.x < -60) { c.x = w + 60; }
          if (c.x > w + 60) { c.x = -60; }

          // glide toward a parallax offset, then add a push away from the pointer
          var tx = -px * 40 * c.depth;
          var ty = -py * 40 * c.depth;
          if (pointer.inside) {
            var dx = c.x - pointer.x;
            var dy = c.y - pointer.y;
            var dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 130) {
              var push = (130 - dist) / 130;
              tx += (dx / dist) * push * 60;
              ty += (dy / dist) * push * 60;
            }
          }
          c.ox += (tx - c.ox) * 0.08 * dt;
          c.oy += (ty - c.oy) * 0.08 * dt;
          drawCell(c);
        }

        for (var j = bits.length - 1; j >= 0; j--) {
          var b = bits[j];
          b.vy += 0.18 * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.life -= 0.025 * dt;
          if (b.life <= 0) { bits.splice(j, 1); continue; }
          b.rot += b.spin;
          b.tilt += 0.15;
          drawRBC(ctx, b.x, b.y, b.r, b.rot, 0.62 + 0.38 * Math.abs(Math.cos(b.tilt)), b.life);
        }
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(frame);
    }

    function localPoint(e) {
      var rect = hero.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    hero.addEventListener('pointermove', function (e) {
      var p = localPoint(e);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.inside = true;
    });
    hero.addEventListener('pointerleave', function () { pointer.inside = false; });

    hero.addEventListener('click', function (e) {
      if (e.target.closest('a, button, input')) { return; }
      var p = localPoint(e);
      for (var i = cells.length - 1; i >= 0; i--) {
        var c = cells[i];
        var dx = p.x - (c.x + c.ox);
        var dy = p.y - (c.y + c.oy);
        if (dx * dx + dy * dy <= (c.r + 8) * (c.r + 8)) {
          for (var k = 0; k < 14; k++) {
            var a = rand(0, Math.PI * 2);
            var s = rand(1, 4);
            bits.push({ x: c.x + c.ox, y: c.y + c.oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, r: rand(4, 9), life: 1, rot: rand(0, 6.28), spin: rand(-0.1, 0.1), tilt: rand(0, 6.28) });
          }
          cells[i] = makeCell(true);
          popped++;
          if (counter) {
            counter.hidden = false;
            counter.textContent = popped < 10
              ? popped + ' cell' + (popped === 1 ? '' : 's') + ' popped'
              : popped + ' popped. Now try saving a real life: become a donor.';
          }
          return;
        }
      }
    });

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }).observe(hero);
    }
    if (window.ResizeObserver) { new ResizeObserver(size).observe(hero); }

    requestAnimationFrame(frame);
  };

  // ------------------------------------------------------------------
  // 3. Numbers count up and bars grow in when a page appears.
  // ------------------------------------------------------------------
  fx.countUp = function (root) {
    if (reduce) { return; }
    var nums = root.querySelectorAll('.stat .num');
    Array.prototype.forEach.call(nums, function (el) {
      var raw = el.textContent;
      var target = parseInt(raw.replace(/[^0-9]/g, ''), 10);
      if (isNaN(target) || target === 0) { return; }
      var start = performance.now();
      var dur = 900;
      (function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (t < 1 && el.isConnected) { requestAnimationFrame(step); } else { el.textContent = raw; }
      })(start);
    });

    var bars = root.querySelectorAll('.bar > i');
    Array.prototype.forEach.call(bars, function (el, idx) {
      var w = el.style.width;
      el.style.width = '0%';
      setTimeout(function () { el.style.width = w; }, 60 + idx * 35);
    });
  };

  // ------------------------------------------------------------------
  // 4. Global: a click anywhere makes a small splash, and every few
  //    clicks on empty space a short donation fact pops up.
  // ------------------------------------------------------------------
  var facts = [
    'One donation can help save up to three lives.',
    'Someone needs blood in India every two seconds.',
    'Type O negative is the universal red cell donor type.',
    'A whole blood donation takes about 10 minutes.',
    'Red blood cells last about 42 days, so banks always need fresh donors.',
    'Healthy adults can usually donate whole blood every 3 months.',
    'AB positive can receive red cells from any blood type.',
    'Platelets last only about 5 days, so steady donations matter.'
  ];
  var factIndex = Math.floor(Math.random() * facts.length);
  var idleClicks = 0;

  document.addEventListener('click', function (e) {
    var t = e.target;
    var onInput = t.closest && t.closest('input, textarea, select, .leaflet-container');
    if (!reduce && !onInput) {
      fx.burst(e.clientX, e.clientY, t.closest && t.closest('.hero') ? 5 : 8);
    }
    var interactive = t.closest && t.closest('a, button, input, textarea, select, label, .leaflet-container, .chat-panel, [role="button"]');
    if (interactive) { return; }
    idleClicks++;
    if (idleClicks % 5 === 0 && BA.toast) {
      BA.toast('Did you know? ' + facts[factIndex % facts.length]);
      factIndex++;
    }
  }, true);
})();
