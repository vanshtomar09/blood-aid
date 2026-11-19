/* BloodAid frontend core: API client, session, router, theme, shared UI helpers. No build step. */
(function () {
  'use strict';

  var BA = window.BA = {};
  BA.BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  BA.state = { user: null, token: null, location: null, config: { demoAccounts: false, demoOtp: false, aiEnabled: false }, after: null };
  BA.cleanup = null;
  BA.configPromise = Promise.resolve(BA.state.config);

  // ---------------------------------------------------------------- storage (may be unavailable)
  var store = BA.store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  // ---------------------------------------------------------------- helpers
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  BA.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; });
  };
  var $ = BA.$ = function (sel, root) { return (root || document).querySelector(sel); };
  BA.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var ICONS = {
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>',
    contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    map: '<path d="M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3z"/><path d="M8 3v15M16 6v15"/>',
    droplet: '<path d="M12 2.5S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5z"/>',
    plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
    trend: '<path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    nav: '<path d="M3 11l18-8-8 18-2-8z"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>'
  };
  BA.icon = function (name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  };

  // ---------------------------------------------------------------- toast
  BA.toast = function (message, isError) {
    var box = $('#toasts');
    if (!box) { return; }
    var el = document.createElement('div');
    el.className = 'toast' + (isError ? ' error' : '');
    el.textContent = message;
    box.appendChild(el);
    setTimeout(function () { if (el.parentNode) { el.parentNode.removeChild(el); } }, isError ? 6000 : 3500);
  };

  // ---------------------------------------------------------------- API client
  BA.api = function (method, path, body) {
    var headers = { 'Accept': 'application/json' };
    if (body !== undefined) { headers['Content-Type'] = 'application/json'; }
    if (BA.state.token) { headers['Authorization'] = 'Bearer ' + BA.state.token; }

    return fetch(path, { method: method, headers: headers, body: body !== undefined ? JSON.stringify(body) : undefined })
      .catch(function () {
        var err = new Error('Cannot reach the server. Please check your connection.');
        err.status = 0;
        throw err;
      })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          if (text) { try { data = JSON.parse(text); } catch (e) { data = null; } }
          if (!res.ok) {
            var err = new Error((data && data.error) || ('Request failed (' + res.status + ')'));
            err.status = res.status;
            err.fieldErrors = (data && data.fieldErrors) || null;
            if (res.status === 401 && BA.state.token && path.indexOf('/api/auth/') !== 0) {
              BA.logout(true);
            }
            throw err;
          }
          return data;
        });
      });
  };
  BA.get = function (path) { return BA.api('GET', path); };

  // ---------------------------------------------------------------- session
  BA.setSession = function (auth) {
    BA.state.token = auth.token;
    BA.state.user = auth.user;
    store.set('ba-token', auth.token);
    BA.renderChrome();
  };
  BA.logout = function (expired) {
    BA.state.token = null;
    BA.state.user = null;
    store.del('ba-token');
    BA.renderChrome();
    if (expired) { BA.toast('Your session expired. Please sign in again.', true); }
    location.hash = '#/login';
  };
  BA.role = function () { return BA.state.user ? BA.state.user.role : null; };
  BA.isStaff = function () { return BA.role() === 'STAFF' || BA.role() === 'ADMIN'; };
  BA.homeFor = function (role) {
    if (role === 'ADMIN') { return '#/admin'; }
    if (role === 'STAFF') { return '#/staff'; }
    return '#/';
  };
  function restoreSession() {
    var token = store.get('ba-token');
    if (!token) { return Promise.resolve(); }
    BA.state.token = token;
    return BA.api('GET', '/api/me').then(function (user) {
      BA.state.user = user;
    }).catch(function () {
      BA.state.token = null;
      BA.state.user = null;
      store.del('ba-token');
    });
  }

  // ---------------------------------------------------------------- location
  BA.locate = function () {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) { reject(new Error('Location is not supported by this browser.')); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        BA.state.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        resolve(BA.state.location);
      }, function () {
        reject(new Error('Could not get your location. Check the browser permission.'));
      }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    });
  };
  /** Query-string fragment with the user's coordinates, or ''. */
  BA.locParams = function () {
    var l = BA.state.location;
    return l ? 'lat=' + encodeURIComponent(l.lat) + '&lng=' + encodeURIComponent(l.lng) : '';
  };

  // ---------------------------------------------------------------- theme
  function effectiveTheme() {
    var set = document.documentElement.getAttribute('data-theme');
    if (set === 'dark' || set === 'light') { return set; }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  BA.toggleTheme = function () {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store.set('ba-theme', next);
  };

  // ---------------------------------------------------------------- shared UI helpers
  var ui = BA.ui = {};

  ui.timeAgo = function (iso) {
    var secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (secs < 60) { return 'just now'; }
    var mins = Math.round(secs / 60);
    if (mins < 60) { return mins + ' min ago'; }
    var hrs = Math.round(mins / 60);
    if (hrs < 24) { return hrs + ' hr ago'; }
    var days = Math.round(hrs / 24);
    return days + (days === 1 ? ' day ago' : ' days ago');
  };
  ui.date = function (iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };
  ui.chip = function (type, units) {
    var zero = units === 0;
    return '<span class="chip' + (zero ? ' zero' : '') + '">' + BA.esc(type) +
      (units !== undefined ? ' <small>' + BA.esc(units) + '</small>' : '') + '</span>';
  };
  ui.availBadge = function (a) {
    if (a === 'AVAILABLE') { return '<span class="badge ok">Available</span>'; }
    if (a === 'LIMITED') { return '<span class="badge warn">Limited stock</span>'; }
    return '<span class="badge danger">Out of stock</span>';
  };
  ui.statusBadge = function (s) {
    if (s === 'PENDING') { return '<span class="badge warn">Pending</span>'; }
    if (s === 'IN_PROGRESS') { return '<span class="badge info">In progress</span>'; }
    return '<span class="badge ok">Fulfilled</span>';
  };
  ui.urgencyBadge = function (u) {
    if (u === 'EMERGENCY') { return '<span class="badge danger">Emergency</span>'; }
    if (u === 'URGENT') { return '<span class="badge warn">Urgent</span>'; }
    return '<span class="badge">Routine</span>';
  };
  ui.distance = function (b) {
    if (b.distanceKm == null) { return ''; }
    return b.distanceFromUser ? b.distanceKm + ' km away' : '~' + b.distanceKm + ' km';
  };
  ui.skeleton = function () {
    return '<div class="skeleton" style="width:40%;height:28px"></div><div class="skeleton"></div><div class="skeleton" style="width:85%"></div><div class="skeleton" style="width:70%"></div>';
  };
  ui.empty = function (msg) { return '<div class="empty">' + BA.esc(msg) + '</div>'; };
  ui.errorCard = function (msg) {
    return '<div class="card narrow"><h2>Something went wrong</h2><p class="muted">' + BA.esc(msg) +
      '</p><button class="btn" onclick="location.reload()">Try again</button></div>';
  };
  ui.pageHead = function (title, subtitle) {
    return '<div class="page-head"><h1>' + BA.esc(title) + '</h1>' + (subtitle ? '<p>' + BA.esc(subtitle) + '</p>' : '') + '</div>';
  };
  ui.stat = function (value, label) {
    return '<div class="card stat"><div class="num">' + BA.esc(value) + '</div><div class="lbl">' + BA.esc(label) + '</div></div>';
  };

  /** Horizontal stock bars. `units` is {type: number}; `max` is the scale (defaults to the largest value). */
  ui.bars = function (units, max) {
    var top = max || 1;
    BA.BLOOD_TYPES.forEach(function (t) { if ((units[t] || 0) > top && !max) { top = units[t]; } });
    return '<div class="bars">' + BA.BLOOD_TYPES.map(function (t) {
      var v = units[t] || 0;
      var pct = Math.min(100, Math.round(v / top * 100));
      var cls = v === 0 ? 'out' : (v < 10 ? 'low' : '');
      return '<div class="bar-row"><b>' + t + '</b><div class="bar"><i class="' + cls + '" style="width:' + pct + '%"></i></div><span>' + v + '</span></div>';
    }).join('') + '</div>';
  };

  // ---- form building
  ui.input = function (name, type, attrs) {
    return '<input id="f-' + name + '" name="' + name + '" type="' + (type || 'text') + '" ' + (attrs || '') + '>';
  };
  ui.select = function (name, options, selected, attrs) {
    return '<select id="f-' + name + '" name="' + name + '" ' + (attrs || '') + '>' + options.map(function (o) {
      var value = typeof o === 'string' ? o : o.value;
      var label = typeof o === 'string' ? o : o.label;
      return '<option value="' + BA.esc(value) + '"' + (String(value) === String(selected) ? ' selected' : '') + '>' + BA.esc(label) + '</option>';
    }).join('') + '</select>';
  };
  ui.textarea = function (name, attrs) {
    return '<textarea id="f-' + name + '" name="' + name + '" ' + (attrs || '') + '></textarea>';
  };
  ui.field = function (label, name, control, hint) {
    return '<div class="field"><label for="f-' + name + '">' + BA.esc(label) + '</label>' + control +
      (hint ? '<div class="hint">' + BA.esc(hint) + '</div>' : '') + '<div class="err" data-for="' + name + '"></div></div>';
  };

  /**
   * Wires a form: collects values, shows server-side field errors, disables the submit button while busy.
   * `handler(data, form)` returns a promise; throw (reject) to show an error.
   */
  ui.bindForm = function (form, handler) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var errBox = $('.form-error', form);
      BA.$$('.err', form).forEach(function (e) { e.textContent = ''; });
      if (errBox) { errBox.hidden = true; }

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = typeof v === 'string' ? v.trim() : v; });

      var btn = $('button[type="submit"]', form);
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Please wait...'; }

      var done = function () { if (btn) { btn.disabled = false; btn.textContent = label; } };
      Promise.resolve().then(function () { return handler(data, form); }).then(done, function (err) {
        done();
        if (err && err.fieldErrors) {
          Object.keys(err.fieldErrors).forEach(function (k) {
            var slot = $('.err[data-for="' + k + '"]', form);
            if (slot) { slot.textContent = err.fieldErrors[k]; }
          });
        }
        if (errBox) { errBox.textContent = (err && err.message) || 'Something went wrong.'; errBox.hidden = false; }
        else { BA.toast((err && err.message) || 'Something went wrong.', true); }
      });
    });
  };

  // ---------------------------------------------------------------- navigation chrome
  function navItem(href, icon, label) {
    return '<a class="nav-link" href="' + href + '" data-href="' + href + '">' + BA.icon(icon) + '<span>' + BA.esc(label) + '</span></a>';
  }
  BA.renderChrome = function () {
    var role = BA.role();
    var main = navItem('#/', 'home', 'Home') +
      navItem('#/search', 'search', 'Find blood') +
      navItem('#/map', 'map', 'Map') +
      navItem('#/request', 'plus', 'Request blood');
    if (role) { main += navItem('#/my-requests', 'list', 'My requests'); }

    var html = '<div class="nav-group"><div class="nav-label">Menu</div>' + main + '</div>';
    if (role === 'STAFF' || role === 'ADMIN') {
      html += '<div class="nav-group"><div class="nav-label">Blood bank</div>' +
        navItem('#/staff', 'droplet', 'Staff dashboard') +
        navItem('#/inventory', 'box', 'Inventory') +
        navItem('#/predict', 'trend', 'Demand forecast') + '</div>';
    }
    if (role === 'ADMIN') {
      html += '<div class="nav-group"><div class="nav-label">Administration</div>' + navItem('#/admin', 'shield', 'Admin') + '</div>';
    }
    if (!role) {
      html += '<div class="nav-group"><div class="nav-label">Account</div>' +
        navItem('#/login', 'user', 'Sign in') + navItem('#/register', 'plus', 'Register') + '</div>';
    }
    html += '<div class="nav-group">' + navItem('#/help', 'help', 'Help') + '</div>';
    $('#sidebar').innerHTML = html;
    markActive();

    var slot = $('#userSlot');
    var user = BA.state.user;
    if (user) {
      var initial = (user.fullName || '?').trim().charAt(0).toUpperCase();
      slot.innerHTML = '<button class="user-btn" id="userBtn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">' +
        '<span class="avatar">' + BA.esc(initial) + '</span><span class="user-name">' + BA.esc(user.fullName) + '</span></button>';
      $('#userBtn').addEventListener('click', function (ev) { ev.stopPropagation(); toggleUserMenu(); });
    } else {
      slot.innerHTML = '<a class="btn sm primary" href="#/login">Sign in</a>';
    }
  };

  function closeUserMenu() {
    var m = $('#userMenu');
    if (m) { m.parentNode.removeChild(m); }
    var b = $('#userBtn');
    if (b) { b.setAttribute('aria-expanded', 'false'); }
  }
  function toggleUserMenu() {
    if ($('#userMenu')) { closeUserMenu(); return; }
    var u = BA.state.user;
    var menu = document.createElement('div');
    menu.className = 'menu';
    menu.id = 'userMenu';
    menu.innerHTML = '<div class="who"><strong>' + BA.esc(u.fullName) + '</strong><div class="muted small">' + BA.esc(u.email) +
      '</div><div class="small"><span class="badge">' + BA.esc(u.role) + '</span></div></div><button id="logoutBtn">Sign out</button>';
    document.body.appendChild(menu);
    $('#userBtn').setAttribute('aria-expanded', 'true');
    $('#logoutBtn').addEventListener('click', function () { closeUserMenu(); BA.logout(false); });
  }

  function markActive() {
    var current = (location.hash || '#/').split('?')[0];
    BA.$$('.nav-link').forEach(function (a) {
      var href = a.getAttribute('data-href');
      var active = href === current || (href !== '#/' && current.indexOf(href + '/') === 0);
      a.classList.toggle('active', active);
      if (active) { a.setAttribute('aria-current', 'page'); } else { a.removeAttribute('aria-current'); }
    });
  }

  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    $('#scrim').hidden = !open;
    $('#menuBtn').setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  // ---------------------------------------------------------------- router
  var routes = [];
  var renderId = 0;

  /** handler(ctx) returns an HTML string or {html, after(el)}. ctx = {params, query}. */
  BA.addRoute = function (pattern, handler, opts) {
    var keys = [];
    var source = pattern.replace(/:([a-zA-Z]+)/g, function (_, key) { keys.push(key); return '([^/]+)'; });
    routes.push({ re: new RegExp('^' + source + '$'), keys: keys, handler: handler, opts: opts || {} });
  };

  function parseHash() {
    var raw = (location.hash || '#/').slice(1) || '/';
    var q = raw.indexOf('?');
    return {
      path: q === -1 ? raw : raw.slice(0, q),
      query: new URLSearchParams(q === -1 ? '' : raw.slice(q + 1))
    };
  }

  BA.navigate = function () {
    var id = ++renderId;
    var el = $('#view');
    var parsed = parseHash();

    if (BA.cleanup) { try { BA.cleanup(); } catch (e) { /* ignore */ } BA.cleanup = null; }
    closeUserMenu();
    setMenu(false);
    markActive();

    var route = null;
    var params = {};
    for (var i = 0; i < routes.length && !route; i++) {
      var m = routes[i].re.exec(parsed.path);
      if (m) {
        route = routes[i];
        route.keys.forEach(function (k, idx) { params[k] = decodeURIComponent(m[idx + 1]); });
      }
    }
    if (!route) {
      el.innerHTML = '<div class="card narrow"><h2>Page not found</h2><p class="muted">That page does not exist.</p><a class="btn primary" href="#/">Go home</a></div>';
      return Promise.resolve();
    }

    // A pending "return here after sign-in" target only survives while the user stays in the auth screens.
    if (parsed.path !== '/login' && parsed.path.indexOf('/register') !== 0) { BA.state.after = null; }

    var roles = route.opts.roles;
    if (roles) {
      if (!BA.state.user) {
        BA.state.after = location.hash;
        location.hash = '#/login';
        return Promise.resolve();
      }
      if (roles.length && roles.indexOf(BA.state.user.role) === -1) {
        el.innerHTML = '<div class="card narrow"><h2>Not allowed</h2><p class="muted">Your account does not have access to this page.</p><a class="btn primary" href="#/">Go home</a></div>';
        return Promise.resolve();
      }
    }

    document.title = (route.opts.title ? route.opts.title + ' - ' : '') + 'BloodAid';
    window.scrollTo(0, 0);
    el.innerHTML = ui.skeleton();

    return Promise.resolve().then(function () {
      return route.handler({ params: params, query: parsed.query });
    }).then(function (result) {
      if (id !== renderId) { return; }
      var html = typeof result === 'string' ? result : result.html;
      el.innerHTML = html;
      if (result && typeof result === 'object' && result.after) { result.after(el); }
      if (BA.fx && BA.fx.countUp) { BA.fx.countUp(el); }
    }).catch(function (err) {
      if (id !== renderId) { return; }
      el.innerHTML = ui.errorCard(err && err.message ? err.message : 'Unexpected error');
    });
  };

  // ---------------------------------------------------------------- start
  BA.start = function () {
    $('#menuBtn').innerHTML = BA.icon('menu');
    $('#themeBtn').innerHTML = BA.icon('contrast');
    $('#searchIcon').innerHTML = BA.icon('search');
    $('#brandMark').innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"/></svg>';

    $('#themeBtn').addEventListener('click', BA.toggleTheme);
    $('#menuBtn').addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
    $('#scrim').addEventListener('click', function () { setMenu(false); });
    document.addEventListener('click', function (ev) {
      var menu = $('#userMenu');
      if (menu && !menu.contains(ev.target)) { closeUserMenu(); }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { setMenu(false); closeUserMenu(); }
    });
    $('#topSearch').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var q = $('#topSearchInput').value.trim();
      location.hash = q ? '#/search?q=' + encodeURIComponent(q) : '#/search';
    });
    window.addEventListener('hashchange', BA.navigate);

    BA.configPromise = BA.api('GET', '/api/public/config').then(function (c) {
      BA.state.config = c;
      return c;
    }).catch(function () { return BA.state.config; });
    restoreSession().then(function () {
      BA.renderChrome();
      return BA.navigate();
    });
  };
})();
