/* Staff and admin screens: dashboards, inventory, demand forecast. */
(function () {
  'use strict';

  var BA = window.BA;
  var esc = BA.esc;
  var ui = BA.ui;
  var $ = BA.$;

  var STAFF_ROLES = ['STAFF', 'ADMIN'];

  function requestsTable(list) {
    if (!list.length) { return ui.empty('No blood requests yet.'); }
    return '<div class="table-wrap"><table><thead><tr><th>Patient</th><th>Type</th><th>Units</th><th>Hospital</th><th>Urgency</th><th>Contact</th><th>When</th><th>Status</th></tr></thead><tbody>' +
      list.map(function (r) {
        var statusSelect = ui.select('status-' + r.id, [
          { value: 'PENDING', label: 'Pending' }, { value: 'IN_PROGRESS', label: 'In progress' }, { value: 'FULFILLED', label: 'Fulfilled' }
        ], r.status, 'data-request="' + r.id + '" data-prev="' + esc(r.status) + '" aria-label="Status of request ' + r.id + '"');
        return '<tr><td>' + esc(r.patientName) + '</td><td><span class="chip">' + esc(r.bloodType) + '</span></td><td>' + esc(r.units) + '</td><td>' + esc(r.hospitalName) +
          '</td><td>' + ui.urgencyBadge(r.urgency) + '</td><td class="nowrap"><a href="tel:' + esc(r.contactNumber.replace(/[^+\d]/g, '')) + '">' + esc(r.contactNumber) + '</a></td><td class="nowrap muted">' +
          esc(ui.timeAgo(r.createdAt)) + '</td><td>' + statusSelect + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /** Makes the status dropdowns inside `root` save changes through the API. */
  function bindStatusSelects(root) {
    BA.$$('select[data-request]', root).forEach(function (sel) {
      sel.addEventListener('change', function () {
        var id = sel.getAttribute('data-request');
        var previous = sel.getAttribute('data-prev');
        sel.disabled = true;
        BA.api('PATCH', '/api/staff/requests/' + encodeURIComponent(id) + '/status', { status: sel.value }).then(function () {
          sel.setAttribute('data-prev', sel.value);
          BA.toast('Request #' + id + ' updated.');
        }).catch(function (err) {
          sel.value = previous;
          BA.toast(err.message, true);
        }).then(function () { sel.disabled = false; });
      });
    });
  }

  // ------------------------------------------------------- staff dashboard
  BA.addRoute('/staff', function () {
    return Promise.all([BA.get('/api/staff/stats'), BA.get('/api/staff/requests?limit=25')]).then(function (r) {
      var s = r[0];
      var requests = r[1];
      var low = s.lowStockTypes && s.lowStockTypes.length
        ? '<section class="card" style="margin-top:16px"><div class="card-head"><h2>Low stock at your bank</h2><a class="btn sm" href="#/inventory">Update inventory</a></div>' +
          '<div class="chips">' + s.lowStockTypes.map(function (t) { return ui.chip(t); }).join('') + '</div>' +
          '<p class="muted small" style="margin:10px 0 0">Fewer than 10 units on hand.</p></section>'
        : '';
      var noBank = s.bankId == null
        ? '<div class="form-note" style="margin-bottom:16px">Your account is not linked to a blood bank, so bank stock is not shown.</div>'
        : '';

      return {
        html: ui.pageHead('Staff dashboard', s.bankName || 'Overview') + noBank +
          '<div class="grid cols-4">' + ui.stat(s.bankTotalUnits, 'Units at your bank') + ui.stat(s.openRequests, 'Open requests') +
          ui.stat(s.fulfilledThisMonth, 'Fulfilled this month') + ui.stat((s.lowStockTypes || []).length, 'Low-stock types') + '</div>' + low +
          '<section class="card" style="margin-top:16px"><div class="card-head"><h2>Blood requests</h2></div>' + requestsTable(requests) + '</section>',
        after: function (el) { bindStatusSelects(el); }
      };
    });
  }, { title: 'Staff dashboard', roles: STAFF_ROLES });

  // ----------------------------------------------------------- inventory
  BA.addRoute('/inventory', function (ctx) {
    var user = BA.state.user;
    var isAdmin = user.role === 'ADMIN';

    return BA.get('/api/banks').then(function (banks) {
      var bankId = isAdmin ? Number(ctx.query.get('bank')) || (banks[0] && banks[0].id) : user.bankId;
      var bank = null;
      banks.forEach(function (b) { if (b.id === bankId) { bank = b; } });

      if (!bank) {
        return '<div class="card narrow"><h2>No blood bank</h2><p class="muted">Your account is not linked to a blood bank, so there is no inventory to manage.</p></div>';
      }

      var picker = isAdmin
        ? '<div class="field" style="max-width:420px;margin-bottom:16px"><label for="f-bank">Blood bank</label>' +
          ui.select('bank', banks.map(function (b) { return { value: b.id, label: b.name }; }), bank.id) + '</div>'
        : '';

      var cells = BA.BLOOD_TYPES.map(function (t) {
        return '<div class="inv-cell"><span class="chip">' + esc(t) + '</span><div class="stepper">' +
          '<button type="button" data-step="-1" data-type="' + esc(t) + '" aria-label="Decrease ' + esc(t) + '">&minus;</button>' +
          '<input type="number" min="0" max="100000" inputmode="numeric" name="' + esc(t) + '" value="' + esc(bank.inventory[t] || 0) + '" aria-label="Units of ' + esc(t) + '">' +
          '<button type="button" data-step="1" data-type="' + esc(t) + '" aria-label="Increase ' + esc(t) + '">+</button></div></div>';
      }).join('');

      return {
        html: ui.pageHead('Inventory', bank.name) + picker +
          '<section class="card"><form id="invForm" novalidate><div class="form-error" hidden style="margin-bottom:12px"></div><div class="inv-grid">' + cells + '</div>' +
          '<div class="row" style="margin-top:18px"><button class="btn primary" type="submit">Save changes</button><a class="btn" href="#/bank/' + bank.id + '">View public page</a></div></form></section>',
        after: function (el) {
          var picked = $('#f-bank', el);
          if (picked) { picked.addEventListener('change', function () { location.hash = '#/inventory?bank=' + picked.value; }); }

          var form = $('#invForm', el);
          form.addEventListener('click', function (ev) {
            var btn = ev.target.closest ? ev.target.closest('button[data-step]') : null;
            if (!btn) { return; }
            var input = form.elements[btn.getAttribute('data-type')];
            var next = (parseInt(input.value, 10) || 0) + Number(btn.getAttribute('data-step'));
            input.value = Math.max(0, Math.min(100000, next));
          });
          ui.bindForm(form, function () {
            var values = {};
            BA.BLOOD_TYPES.forEach(function (t) {
              var n = parseInt(form.elements[t].value, 10);
              if (isNaN(n) || n < 0 || n > 100000) { throw new Error('Units for ' + t + ' must be a whole number between 0 and 100000.'); }
              values[t] = n;
            });
            return BA.api('PUT', '/api/banks/' + bank.id + '/inventory', { inventory: values }).then(function () {
              BA.toast('Inventory saved.');
            });
          });
        }
      };
    });
  }, { title: 'Inventory', roles: STAFF_ROLES });

  // --------------------------------------------------------------- forecast
  var SAMPLE_CSV = 'Date,A+,A-,B+,B-,AB+,AB-,O+,O-\n' +
    '2026-05-01,42,10,35,8,14,4,60,18\n' +
    '2026-06-01,45,11,33,9,15,5,64,20\n' +
    '2026-07-01,50,12,38,9,16,5,70,22\n' +
    '2026-08-01,48,11,40,10,15,4,68,21\n' +
    '2026-09-01,52,13,41,10,17,6,72,24\n' +
    '2026-10-01,55,14,43,11,18,6,75,25';

  BA.addRoute('/predict', function () {
    var html = '<div class="narrow" style="max-width:760px">' + ui.pageHead('Blood demand forecast', 'Predict next month\'s demand per blood type and get stock recommendations.') +
      '<section class="card"><form class="form" id="predictForm" novalidate><div class="form-error" hidden></div>' +
      ui.field('Historical data (CSV)', 'historicalData', ui.textarea('historicalData', 'required rows="8" maxlength="20000" placeholder="Date,A+,A-,B+,B-,AB+,AB-,O+,O-"'),
        'One header row of blood types, then one row per period (for example per month).') +
      '<div><button class="btn sm" type="button" id="sampleBtn">Load sample data</button></div>' +
      ui.field('Seasonality', 'seasonality', ui.textarea('seasonality', 'required rows="2" maxlength="2000" placeholder="e.g. Demand rises in summer because of accidents"')) +
      ui.field('Upcoming local events', 'localEvents', ui.textarea('localEvents', 'required rows="2" maxlength="2000" placeholder="e.g. City marathon next month"')) +
      '<button class="btn primary block" type="submit">Generate forecast</button></form></section>' +
      '<div id="predictResult" style="margin-top:16px"></div></div>';

    return {
      html: html,
      after: function (el) {
        $('#sampleBtn', el).addEventListener('click', function () {
          $('#f-historicalData', el).value = SAMPLE_CSV;
          if (!$('#f-seasonality', el).value) { $('#f-seasonality', el).value = 'Demand is higher in summer and around festivals.'; }
          if (!$('#f-localEvents', el).value) { $('#f-localEvents', el).value = 'City marathon next month.'; }
        });
        ui.bindForm($('#predictForm', el), function (data) {
          return BA.api('POST', '/api/predict', {
            historicalData: data.historicalData, seasonality: data.seasonality, localEvents: data.localEvents
          }).then(function (res) {
            var source = res.source === 'gemini'
              ? '<span class="badge ok">Generated by Gemini</span>'
              : '<span class="badge warn">Basic estimate (no AI key configured)</span>';
            $('#predictResult', el).innerHTML =
              '<section class="card"><div class="card-head"><h2>Predicted demand</h2>' + source + '</div><div>' + BA.mdLite(res.predictedDemand) + '</div></section>' +
              '<section class="card"><div class="card-head"><h2>Recommendations</h2></div><div>' + BA.mdLite(res.recommendations) + '</div></section>';
            $('#predictResult', el).scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        });
      }
    };
  }, { title: 'Demand forecast', roles: STAFF_ROLES });

  // ----------------------------------------------------------------- admin
  BA.addRoute('/admin', function () {
    return Promise.all([BA.get('/api/admin/stats'), BA.get('/api/admin/users?limit=10'), BA.get('/api/staff/requests?limit=15')]).then(function (r) {
      var s = r[0];
      var users = r[1];
      var requests = r[2];

      var roleChips = Object.keys(s.usersByRole).map(function (role) {
        return '<span class="chip">' + esc(role) + ' <small>' + esc(s.usersByRole[role]) + '</small></span>';
      }).join('');

      var userTable = '<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody>' +
        users.map(function (u) {
          return '<tr><td>' + esc(u.fullName) + '</td><td>' + esc(u.email) + '</td><td><span class="badge">' + esc(u.role) + '</span></td><td class="nowrap muted">' + esc(ui.date(u.createdAt)) + '</td></tr>';
        }).join('') + '</tbody></table></div>';

      return {
        html: ui.pageHead('Admin dashboard', 'System-wide overview.') +
          '<div class="grid cols-4">' + ui.stat(s.totalUnits.toLocaleString(), 'Units in stock') + ui.stat(s.bankCount, 'Blood banks') +
          ui.stat(s.openRequests, 'Open requests') + ui.stat(s.fulfilledThisMonth, 'Fulfilled this month') + ui.stat(s.activeDonors, 'Donors') + '</div>' +
          '<div class="row" style="margin:16px 0"><a class="btn" href="#/inventory">Manage inventory</a><a class="btn" href="#/predict">Demand forecast</a></div>' +
          '<section class="card"><div class="card-head"><h2>Users by role</h2></div><div class="chips">' + roleChips + '</div></section>' +
          '<section class="card" style="margin-top:16px"><div class="card-head"><h2>Recent blood requests</h2></div>' + requestsTable(requests) + '</section>' +
          '<section class="card" style="margin-top:16px"><div class="card-head"><h2>Newest users</h2></div>' + userTable + '</section>',
        after: function (el) { bindStatusSelects(el); }
      };
    });
  }, { title: 'Admin', roles: ['ADMIN'] });
})();
