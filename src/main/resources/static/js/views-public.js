/* Public screens: home, search, map, bank details, help. */
(function () {
  'use strict';

  var BA = window.BA;
  var esc = BA.esc;
  var ui = BA.ui;
  var $ = BA.$;

  var TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  var TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  function directionsUrl(b) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(b.latitude + ',' + b.longitude);
  }

  function locQuery(prefix) {
    var p = BA.locParams();
    return p ? prefix + p : '';
  }

  function bankCard(b) {
    var chips = BA.BLOOD_TYPES.map(function (t) { return ui.chip(t, b.inventory[t]); }).join('');
    var dist = ui.distance(b);
    return '<article class="card bank-card">' +
      '<div class="row between"><h3><a href="#/bank/' + b.id + '">' + esc(b.name) + '</a></h3>' + ui.availBadge(b.availability) + '</div>' +
      '<div class="bank-meta"><span>' + BA.icon('pin') + esc(b.location) + '</span>' +
      (dist ? '<span>' + BA.icon('nav') + esc(dist) + '</span>' : '') +
      (b.openHours ? '<span>' + BA.icon('clock') + esc(b.openHours) + '</span>' : '') + '</div>' +
      '<div class="chips">' + chips + '</div>' +
      '<div class="row"><a class="btn sm primary" href="#/bank/' + b.id + '">View details</a>' +
      '<a class="btn sm" target="_blank" rel="noopener" href="' + directionsUrl(b) + '">Directions</a></div></article>';
  }
  BA.bankCard = bankCard;

  function requestRow(r) {
    return '<li><div class="blood-dot">' + esc(r.bloodType) + '</div><div class="grow"><div class="title">' + esc(r.hospitalName) +
      '</div><div class="muted small">' + esc(ui.timeAgo(r.createdAt)) + '</div></div>' +
      '<div class="row">' + ui.urgencyBadge(r.urgency) + ui.statusBadge(r.status) + '</div></li>';
  }

  function pin(b) {
    var cls = b.availability === 'AVAILABLE' ? 'ok' : (b.availability === 'LIMITED' ? 'warn' : 'danger');
    return L.divIcon({ className: '', html: '<div class="pin ' + cls + '"></div>', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28] });
  }

  function mapUnavailable() {
    return '<div class="empty">The map could not load (the Leaflet library or map tiles are unreachable). Check your internet connection.</div>';
  }

  function addMeMarker(map) {
    var loc = BA.state.location;
    if (!loc) { return; }
    L.marker([loc.lat, loc.lng], {
      icon: L.divIcon({ className: '', html: '<div class="me-pin"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
      keyboard: false
    }).addTo(map).bindPopup('You are here');
  }

  // ------------------------------------------------------------------ home
  BA.addRoute('/', function () {
    return Promise.all([
      BA.get('/api/public/stats'),
      BA.get('/api/banks'),
      BA.get('/api/public/requests?limit=5&openOnly=true'),
      BA.get('/api/public/camps')
    ]).then(function (r) {
      var stats = r[0];
      var banks = r[1];
      var requests = r[2];
      var camps = r[3];

      var totals = {};
      banks.forEach(function (b) {
        BA.BLOOD_TYPES.forEach(function (t) { totals[t] = (totals[t] || 0) + (b.inventory[t] || 0); });
      });

      var user = BA.state.user;
      var first = user ? user.fullName.split(' ')[0] : null;
      var hero = '<section class="hero"><h1>' + (first ? 'Welcome back, ' + esc(first) : 'Every drop counts.') + '</h1>' +
        '<p>' + (first ? 'See what is in stock near you and where help is needed most.' : 'Find blood banks, check live stock, request blood, or register as a donor.') + '</p>' +
        '<div class="row"><a class="btn primary" href="#/request">Request blood</a>' +
        (user ? '<a class="btn ghost" href="#/search">Find blood</a>' : '<a class="btn ghost" href="#/register">Become a donor</a>') + '</div></section>';

      var tiles = '<div class="grid cols-4">' +
        ui.stat(stats.totalUnits.toLocaleString(), 'Units in stock') +
        ui.stat(stats.bankCount, 'Blood banks') +
        ui.stat(stats.activeDonors, 'Registered donors') +
        ui.stat(stats.openRequests, 'Open requests') + '</div>';

      var stock = '<section class="card"><div class="card-head"><h2>Stock across all banks</h2><a href="#/search">Browse banks</a></div>' +
        ui.bars(totals) + '</section>';

      var reqList = '<section class="card"><div class="card-head"><h2>Open requests</h2></div>' +
        (requests.length ? '<ul class="list">' + requests.map(requestRow).join('') + '</ul>' : ui.empty('No open requests right now.')) + '</section>';

      var campList = '<section class="card"><div class="card-head"><h2>Upcoming donation camps</h2></div>' +
        (camps.length ? '<ul class="list">' + camps.map(function (c) {
          return '<li><div class="blood-dot">' + BA.icon('droplet') + '</div><div class="grow"><div class="title">' + esc(c.name) +
            '</div><div class="muted small">' + esc(c.location || '') + '</div></div><span class="badge info nowrap">' + esc(ui.date(c.date)) + '</span></li>';
        }).join('') + '</ul>' : ui.empty('No camps scheduled.')) + '</section>';

      return hero + tiles + '<div class="grid cols-2" style="margin-top:16px">' + stock + reqList + '</div>' +
        '<div style="margin-top:16px">' + campList + '</div>';
    });
  }, { title: 'Home' });

  // ---------------------------------------------------------------- search
  BA.addRoute('/search', function (ctx) {
    var q = (ctx.query.get('q') || '').trim();
    var type = ctx.query.get('type') || '';
    if (BA.BLOOD_TYPES.indexOf(type) === -1) { type = ''; }

    var load = q
      ? BA.get('/api/public/search?q=' + encodeURIComponent(q) + locQuery('&'))
      : BA.get('/api/banks' + locQuery('?')).then(function (banks) { return { banks: banks, requests: [] }; });

    return load.then(function (data) {
      var banks = data.banks;
      if (type) { banks = banks.filter(function (b) { return b.inventory[type] > 0; }); }

      var form = '<form class="filters" id="searchForm" role="search">' +
        '<input type="search" name="q" value="' + esc(q) + '" placeholder="Bank name, city or blood type" aria-label="Search">' +
        ui.select('type', [{ value: '', label: 'Any blood type' }].concat(BA.BLOOD_TYPES.map(function (t) { return { value: t, label: t }; })), type, 'aria-label="Blood type in stock"') +
        '<div class="row"><button class="btn primary" type="submit">Search</button>' +
        '<button class="btn" type="button" id="locBtn">' + BA.icon('nav') + (BA.state.location ? 'Update location' : 'Use my location') + '</button></div></form>';

      var results = banks.length
        ? '<div class="grid cols-2">' + banks.map(bankCard).join('') + '</div>'
        : '<div class="card">' + ui.empty('No blood banks match your search.') + '</div>';

      var reqs = data.requests && data.requests.length
        ? '<section class="card" style="margin-top:16px"><div class="card-head"><h2>Matching requests</h2></div><ul class="list">' + data.requests.map(requestRow).join('') + '</ul></section>'
        : '';

      return {
        html: ui.pageHead('Find blood', banks.length + ' blood bank' + (banks.length === 1 ? '' : 's') + (BA.state.location ? ', nearest first' : '')) + form + results + reqs,
        after: function (el) {
          var f = $('#searchForm', el);
          f.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var params = new URLSearchParams();
            if (f.q.value.trim()) { params.set('q', f.q.value.trim()); }
            if (f.type.value) { params.set('type', f.type.value); }
            var next = '#/search' + (params.toString() ? '?' + params.toString() : '');
            if (location.hash === next) { BA.navigate(); } else { location.hash = next; }
          });
          $('#locBtn', el).addEventListener('click', function () {
            BA.locate().then(function () { BA.navigate(); }).catch(function (e) { BA.toast(e.message, true); });
          });
        }
      };
    });
  }, { title: 'Find blood' });

  // ------------------------------------------------------------------- map
  BA.addRoute('/map', function () {
    return BA.get('/api/banks' + locQuery('?')).then(function (banks) {
      var html = ui.pageHead('Blood bank map', 'Pins show current stock: green is available, amber is limited, red is out of stock.') +
        '<div class="row" style="margin-bottom:12px"><button class="btn" type="button" id="locBtn">' + BA.icon('nav') +
        (BA.state.location ? 'Update my location' : 'Show my location') + '</button></div>' +
        '<div id="map" class="map" role="region" aria-label="Map of blood banks"></div>' +
        '<h2 style="margin-top:22px">All blood banks</h2><div class="grid cols-2">' + banks.map(bankCard).join('') + '</div>';

      return {
        html: html,
        after: function (el) {
          $('#locBtn', el).addEventListener('click', function () {
            BA.locate().then(function () { BA.navigate(); }).catch(function (e) { BA.toast(e.message, true); });
          });
          if (typeof L === 'undefined') { $('#map', el).innerHTML = mapUnavailable(); return; }

          var map = L.map('map', { scrollWheelZoom: false });
          L.tileLayer(TILES, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
          map.on('click', function () { map.scrollWheelZoom.enable(); });

          var points = [];
          banks.forEach(function (b) {
            var ll = [b.latitude, b.longitude];
            points.push(ll);
            L.marker(ll, { icon: pin(b), title: b.name })
              .addTo(map)
              .bindPopup('<strong>' + esc(b.name) + '</strong><br>' + esc(b.location) + '<br>' +
                esc(b.totalUnits) + ' units in stock<br><a href="#/bank/' + b.id + '">View details</a>');
          });
          addMeMarker(map);
          if (BA.state.location) { points.push([BA.state.location.lat, BA.state.location.lng]); }
          if (points.length) { map.fitBounds(points, { padding: [30, 30], maxZoom: 12 }); } else { map.setView([20.59, 78.96], 5); }
          BA.cleanup = function () { map.remove(); };
        }
      };
    });
  }, { title: 'Map' });

  // ------------------------------------------------------------- bank page
  BA.addRoute('/bank/:id', function (ctx) {
    return BA.get('/api/banks/' + encodeURIComponent(ctx.params.id) + locQuery('?')).then(function (b) {
      var user = BA.state.user;
      var canManage = user && (user.role === 'ADMIN' || (user.role === 'STAFF' && user.bankId === b.id));
      var dist = ui.distance(b);

      var head = '<section class="card"><div class="row between"><h1 style="margin:0">' + esc(b.name) + '</h1>' + ui.availBadge(b.availability) + '</div>' +
        '<div class="bank-meta" style="margin:10px 0 14px"><span>' + BA.icon('pin') + esc(b.location) + '</span>' +
        (dist ? '<span>' + BA.icon('nav') + esc(dist) + '</span>' : '') +
        (b.openHours ? '<span>' + BA.icon('clock') + esc(b.openHours) + '</span>' : '') + '</div>' +
        '<div class="row">' +
        (b.phone ? '<a class="btn sm" href="tel:' + esc(b.phone.replace(/[^+\d]/g, '')) + '">' + BA.icon('phone') + esc(b.phone) + '</a>' : '') +
        (b.email ? '<a class="btn sm" href="mailto:' + esc(b.email) + '">' + BA.icon('mail') + 'Email</a>' : '') +
        '<a class="btn sm" target="_blank" rel="noopener" href="' + directionsUrl(b) + '">' + BA.icon('nav') + 'Directions</a>' +
        '<a class="btn sm primary" href="#/request">Request blood</a>' +
        (canManage ? '<a class="btn sm" href="#/inventory?bank=' + b.id + '">Manage inventory</a>' : '') + '</div></section>';

      var stock = '<section class="card"><div class="card-head"><h2>Blood availability</h2><span class="muted small">' + esc(b.totalUnits) + ' units total</span></div>' +
        ui.bars(b.inventory) + '</section>';
      var where = '<section class="card"><div class="card-head"><h2>Location</h2></div><div id="map" class="map small" role="region" aria-label="Map showing ' + esc(b.name) + '"></div></section>';

      return {
        html: '<p><a href="#/search">&larr; All blood banks</a></p>' + head + '<div class="grid cols-2" style="margin-top:16px">' + stock + where + '</div>',
        after: function (el) {
          if (typeof L === 'undefined') { $('#map', el).innerHTML = mapUnavailable(); return; }
          var map = L.map('map', { scrollWheelZoom: false }).setView([b.latitude, b.longitude], 14);
          L.tileLayer(TILES, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
          L.marker([b.latitude, b.longitude], { icon: pin(b), title: b.name }).addTo(map);
          BA.cleanup = function () { map.remove(); };
        }
      };
    });
  }, { title: 'Blood bank' });

  // ------------------------------------------------------------------ help
  BA.addRoute('/help', function () {
    // The first five entries and the contact details are taken from the original app's Help page.
    // The last three are additions that explain features of this version.
    var faqs = [
      ['What is the eligibility criteria for donating blood?', 'To donate blood, you must be in good health, weigh at least 50 kg, and be between 18 and 65 years old. Other medical conditions may apply, and it\'s best to consult with the blood bank staff.'],
      ['How often can I donate blood?', 'A healthy individual can donate whole blood every 3 months (90 days). For other types of donations, like platelets, the frequency may differ.'],
      ['How do I find a nearby blood bank or a donation camp?', 'You can use the main dashboard to search for nearby blood banks by name or blood type. The interactive map provides a visual overview of their locations and current stock levels.'],
      ['Is the blood donation process safe?', 'Absolutely. All blood collection is done under the supervision of trained medical staff using sterile, single-use equipment. Your safety is the top priority.'],
      ['What should I do before and after donating blood?', 'Before donating, have a healthy meal and drink plenty of fluids. After donating, rest for a short period, have the provided refreshments, and avoid strenuous activity for the rest of the day.'],
      ['How do I request blood?', 'Sign in, open Request blood, and fill in the patient, blood type, number of units, urgency and hospital. Blood bank staff can see the request and update its status.'],
      ['I work at a blood bank. How do I update stock?', 'Register as staff, choose your blood bank and verify the code. Then open Inventory to change the units for each blood type.'],
      ['Is the medical assistant a doctor?', 'No. It gives general information only and cannot diagnose or prescribe. In an emergency, call your local emergency number (112 in India).']
    ];

    function contact(icon, title, text, href, label) {
      return '<div class="row" style="align-items:flex-start;gap:14px;padding:14px;border-radius:12px;background:var(--surface-2)">' +
        '<div class="blood-dot">' + BA.icon(icon) + '</div><div><h3 style="margin:0">' + esc(title) + '</h3><p class="muted small" style="margin:2px 0 4px">' + esc(text) +
        '</p><a href="' + esc(href) + '"><strong>' + esc(label) + '</strong></a></div></div>';
    }

    return ui.pageHead('Help & Support', 'Find answers to common questions and get in touch with us.') +
      '<div class="grid cols-2" style="align-items:start">' +
      '<section class="card"><div class="card-head"><h2>Frequently Asked Questions</h2></div>' +
      faqs.map(function (f) {
        return '<details class="faq"><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>';
      }).join('') + '</section>' +
      '<div class="stack"><section class="card"><div class="card-head"><h2>Contact Us</h2></div>' +
      '<p class="muted small" style="margin-top:0">Reach out to our support team directly.</p><div class="stack">' +
      contact('phone', 'National Helpline', 'For urgent blood requirements or queries.', 'tel:104', '104 (Health Helpline)') +
      contact('mail', 'Email Support', 'Send us an email for non-urgent inquiries.', 'mailto:support@bloodaid.io', 'support@bloodaid.io') +
      '</div></section>' +
      '<section class="card"><h2>Emergency?</h2><p class="muted">If someone is unconscious, bleeding heavily, or in severe pain, call <strong>112</strong> (India) or your local emergency number right away. Do not wait for an online answer.</p>' +
      '<button class="btn primary" type="button" onclick="BA.openChat()">Ask the medical assistant</button></section></div></div>';
  }, { title: 'Help' });
})();
