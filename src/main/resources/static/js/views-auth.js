/* Account screens: login, registration (donor, recipient, staff), blood requests. */
(function () {
  'use strict';

  var BA = window.BA;
  var esc = BA.esc;
  var ui = BA.ui;
  var $ = BA.$;

  var DEMO_PASSWORD = 'Demo@12345';
  var DEMO_ACCOUNTS = [
    ['Admin', 'admin@bloodaid.test'],
    ['Staff', 'staff@bloodaid.test'],
    ['Donor', 'donor@bloodaid.test'],
    ['Recipient', 'recipient@bloodaid.test']
  ];

  function bloodOptions(placeholder) {
    return [{ value: '', label: placeholder }].concat(BA.BLOOD_TYPES.map(function (t) { return { value: t, label: t }; }));
  }

  function finishLogin(res) {
    BA.setSession(res);
    BA.toast('Welcome, ' + res.user.fullName.split(' ')[0] + '!');
    var dest = BA.state.after || BA.homeFor(res.user.role);
    BA.state.after = null;
    location.hash = dest;
  }


  // ------------------------------------------------- email verification step
  // Shared by donor, recipient and staff sign-up: a card to enter the emailed code, with a resend timer.
  function verifyCard() {
    return '<section class="card" id="step2" hidden>' + ui.pageHead('Verify your email', 'Enter the 6-digit code we sent you') +
      '<form class="form" id="verifyForm" novalidate><div class="form-note" id="codeNote"></div><div class="form-error" hidden></div>' +
      ui.field('Verification code', 'code', ui.input('code', 'text', 'required inputmode="numeric" maxlength="6" pattern="\\d{6}" autocomplete="one-time-code"')) +
      '<button class="btn primary block" type="submit">Verify and create account</button></form>' +
      '<div class="row" style="margin-top:14px;justify-content:space-between">' +
      '<button class="btn sm" type="button" id="resendBtn" disabled>Resend code</button>' +
      '<a href="#" id="changeEmail">Use a different email</a></div></section>';
  }

  /** Wires the verify card inside `el`. Returns {show(email, res)} to switch from the details form to the code step. */
  function wireVerify(el, step1Id) {
    var email = null;
    var timer = null;
    var resendBtn = $('#resendBtn', el);
    var note = $('#codeNote', el);

    function showNote(res) {
      note.textContent = res.message + (res.demoCode ? ' Code: ' + res.demoCode : '');
    }
    function countdown(seconds) {
      clearInterval(timer);
      var left = seconds;
      function tick() {
        if (!el.isConnected) { clearInterval(timer); return; }
        resendBtn.disabled = left > 0;
        resendBtn.textContent = left > 0 ? 'Resend code in ' + left + 's' : 'Resend code';
        if (left <= 0) { clearInterval(timer); }
        left--;
      }
      tick();
      timer = setInterval(tick, 1000);
    }

    ui.bindForm($('#verifyForm', el), function (data) {
      return BA.api('POST', '/api/auth/verify', { email: email, code: data.code }).then(finishLogin);
    });
    resendBtn.addEventListener('click', function () {
      resendBtn.disabled = true;
      BA.api('POST', '/api/auth/resend', { email: email }).then(function (res) {
        showNote(res);
        countdown(res.resendAfterSeconds || 30);
        BA.toast('A new code was sent.');
      }, function (err) {
        BA.toast((err && err.message) || 'Could not resend the code.', true);
        countdown(10);
      });
    });
    $('#changeEmail', el).addEventListener('click', function (e) {
      e.preventDefault();
      clearInterval(timer);
      $('#step2', el).hidden = true;
      $('#' + step1Id, el).hidden = false;
    });

    return {
      show: function (addr, res) {
        email = addr;
        $('#' + step1Id, el).hidden = true;
        $('#step2', el).hidden = false;
        $('#f-code', el).value = '';
        showNote(res);
        countdown(res.resendAfterSeconds || 30);
        $('#f-code', el).focus();
      }
    };
  }

  // ------------------------------------------------------------------ login
  BA.addRoute('/login', function () {
    if (BA.state.user) { location.hash = BA.homeFor(BA.role()); return ''; }

    return BA.configPromise.then(function (cfg) {
      var demo = cfg && cfg.demoAccounts
        ? '<div class="card" style="margin-top:16px"><h3>Demo accounts</h3><p class="muted small">Tap one to fill the form. Password: <code>' + DEMO_PASSWORD + '</code></p><div class="row">' +
          DEMO_ACCOUNTS.map(function (a) {
            return '<button class="btn sm" type="button" data-demo="' + esc(a[1]) + '">' + esc(a[0]) + '</button>';
          }).join('') + '</div></div>'
        : '';

      var html = '<div class="narrow"><section class="card">' + ui.pageHead('Sign in', 'Welcome back to BloodAid.') +
        '<form class="form" id="loginForm" novalidate><div class="form-error" hidden></div>' +
        ui.field('Email', 'email', ui.input('email', 'email', 'required autocomplete="username" inputmode="email"')) +
        ui.field('Password', 'password', ui.input('password', 'password', 'required autocomplete="current-password"')) +
        '<button class="btn primary block" type="submit">Sign in</button></form>' +
        '<p class="muted small" style="margin:14px 0 0">New here? <a href="#/register">Create an account</a></p></section>' + demo + '</div>';

      return {
        html: html,
        after: function (el) {
          var form = $('#loginForm', el);
          ui.bindForm(form, function (data) {
            return BA.api('POST', '/api/auth/login', { email: data.email, password: data.password }).then(finishLogin);
          });
          BA.$$('[data-demo]', el).forEach(function (btn) {
            btn.addEventListener('click', function () {
              form.email.value = btn.getAttribute('data-demo');
              form.password.value = DEMO_PASSWORD;
            });
          });
        }
      };
    });
  }, { title: 'Sign in' });

  // --------------------------------------------------------------- register
  BA.addRoute('/register', function () {
    function option(href, icon, title, text) {
      return '<a class="card" href="' + href + '" style="display:block;color:inherit;text-decoration:none"><div class="row">' +
        '<div class="blood-dot">' + BA.icon(icon) + '</div><div class="grow"><h3 style="margin:0">' + esc(title) + '</h3><div class="muted small">' + esc(text) + '</div></div></div></a>';
    }
    return '<div class="narrow">' + ui.pageHead('Create an account', 'Choose how you want to use BloodAid.') +
      '<div class="stack">' +
      option('#/register/donor', 'droplet', 'I want to donate', 'Register as a blood donor and get notified when your type is needed.') +
      option('#/register/recipient', 'user', 'I need blood', 'Register to request blood for yourself or a patient.') +
      option('#/register/staff', 'shield', 'I work at a blood bank', 'Manage stock and respond to requests. Needs verification.') +
      '</div><p class="muted small" style="margin-top:16px">Already registered? <a href="#/login">Sign in</a></p></div>';
  }, { title: 'Register' });

  function accountForm(role) {
    var isDonor = role === 'DONOR';
    return function () {
      if (BA.state.user) { location.hash = BA.homeFor(BA.role()); return ''; }
      var html = '<div class="narrow"><p><a href="#/register">&larr; Back</a></p><section class="card" id="step1">' +
        ui.pageHead(isDonor ? 'Donor registration' : 'Recipient registration', isDonor ? 'Thank you for helping save lives.' : 'Create an account to request blood.') +
        '<form class="form" id="regForm" novalidate><div class="form-error" hidden></div>' +
        ui.field('Full name', 'fullName', ui.input('fullName', 'text', 'required autocomplete="name" maxlength="120"')) +
        ui.field('Email', 'email', ui.input('email', 'email', 'required autocomplete="email" inputmode="email"')) +
        ui.field('Password', 'password', ui.input('password', 'password', 'required minlength="8" autocomplete="new-password"'), 'At least 8 characters.') +
        '<div class="form-grid">' +
        ui.field(isDonor ? 'Blood type' : 'Blood type (optional)', 'bloodType', ui.select('bloodType', bloodOptions(isDonor ? 'Select...' : 'Not sure'), '', isDonor ? 'required' : '')) +
        ui.field('Phone', 'phone', ui.input('phone', 'tel', 'autocomplete="tel" maxlength="40"')) + '</div>' +
        '<button class="btn primary block" type="submit">Send verification code</button></form></section>' + verifyCard() + '</div>';

      return {
        html: html,
        after: function (el) {
          var verifyStep = wireVerify(el, 'step1');
          ui.bindForm($('#regForm', el), function (data) {
            var body = { fullName: data.fullName, email: data.email, password: data.password, role: role };
            if (data.bloodType) { body.bloodType = data.bloodType; }
            if (data.phone) { body.phone = data.phone; }
            return BA.api('POST', '/api/auth/register', body).then(function (res) { verifyStep.show(data.email, res); });
          });
        }
      };
    };
  }
  BA.addRoute('/register/donor', accountForm('DONOR'), { title: 'Donor registration' });
  BA.addRoute('/register/recipient', accountForm('RECIPIENT'), { title: 'Recipient registration' });

  // ---------------------------------------------------------- staff register
  BA.addRoute('/register/staff', function () {
    if (BA.state.user) { location.hash = BA.homeFor(BA.role()); return ''; }

    return BA.get('/api/banks').then(function (banks) {
      var bankOptions = [{ value: '', label: 'Select your blood bank...' }].concat(banks.map(function (b) {
        return { value: b.id, label: b.name + ' - ' + b.location };
      }));

      var html = '<div class="narrow"><p><a href="#/register">&larr; Back</a></p>' +
        '<section class="card" id="step1">' + ui.pageHead('Staff registration', 'Step 1 of 2: your details') +
        '<form class="form" id="staffForm" novalidate><div class="form-error" hidden></div>' +
        ui.field('Full name', 'fullName', ui.input('fullName', 'text', 'required autocomplete="name" maxlength="120"')) +
        ui.field('Employee ID', 'employeeId', ui.input('employeeId', 'text', 'required maxlength="60"')) +
        ui.field('Blood bank', 'bankId', ui.select('bankId', bankOptions, '', 'required')) +
        '<div class="form-grid">' + ui.field('Phone', 'phone', ui.input('phone', 'tel', 'required autocomplete="tel" maxlength="40"')) +
        ui.field('Email', 'email', ui.input('email', 'email', 'required autocomplete="email" inputmode="email"')) + '</div>' +
        ui.field('Password', 'password', ui.input('password', 'password', 'required minlength="8" autocomplete="new-password"'), 'At least 8 characters.') +
        '<button class="btn primary block" type="submit">Send verification code</button></form></section>' +
        verifyCard() + '</div>';

      return {
        html: html,
        after: function (el) {
          var verifyStep = wireVerify(el, 'step1');
          ui.bindForm($('#staffForm', el), function (data) {
            if (!data.bankId) { throw new Error('Please choose your blood bank.'); }
            var body = {
              fullName: data.fullName, employeeId: data.employeeId, bankId: Number(data.bankId),
              phone: data.phone, email: data.email, password: data.password
            };
            return BA.api('POST', '/api/auth/staff/code', body).then(function (res) { verifyStep.show(data.email, res); });
          });
        }
      };
    });
  }, { title: 'Staff registration' });

  // ------------------------------------------------------- request blood
  BA.addRoute('/request', function () {
    // Anyone may open the page, but submitting needs an account, so ask them to sign in first.
    if (!BA.state.user) {
      BA.state.after = '#/request';
      return '<div class="narrow"><section class="card">' + ui.pageHead('Request blood', 'Sign in or create an account so blood banks can follow up with you.') +
        '<div class="row"><a class="btn primary" href="#/login">Sign in</a><a class="btn" href="#/register/recipient">Create account</a></div></section></div>';
    }
    var user = BA.state.user;
    var html = '<div class="narrow" style="max-width:640px">' + ui.pageHead('Request blood', 'Tell us what is needed. Blood bank staff will see your request straight away.') +
      '<section class="card" id="reqCard"><form class="form" id="reqForm" novalidate><div class="form-error" hidden></div>' +
      ui.field('Patient name', 'patientName', ui.input('patientName', 'text', 'required minlength="3" maxlength="120"')) +
      '<div class="form-grid">' +
      ui.field('Contact number', 'contactNumber', ui.input('contactNumber', 'tel', 'required minlength="10" maxlength="40" value="' + esc(user.phone || '') + '"')) +
      ui.field('Blood type needed', 'bloodType', ui.select('bloodType', bloodOptions('Select...'), user.bloodType && user.role === 'RECIPIENT' ? user.bloodType : '', 'required')) +
      ui.field('Units', 'units', ui.input('units', 'number', 'required min="1" max="50" value="1" inputmode="numeric"')) +
      ui.field('Urgency', 'urgency', ui.select('urgency', [{ value: 'ROUTINE', label: 'Routine' }, { value: 'URGENT', label: 'Urgent' }, { value: 'EMERGENCY', label: 'Emergency' }], 'URGENT')) +
      '</div>' +
      ui.field('Hospital', 'hospitalName', ui.input('hospitalName', 'text', 'required minlength="3" maxlength="200"')) +
      ui.field('Notes (optional)', 'notes', ui.textarea('notes', 'maxlength="1000"'), 'Ward, doctor, or anything that helps the blood bank.') +
      '<button class="btn primary block" type="submit">Submit request</button></form></section></div>';

    return {
      html: html,
      after: function (el) {
        ui.bindForm($('#reqForm', el), function (data) {
          if (!data.bloodType) { throw new Error('Please choose a blood type.'); }
          var body = {
            patientName: data.patientName, contactNumber: data.contactNumber, bloodType: data.bloodType,
            units: Number(data.units), urgency: data.urgency, hospitalName: data.hospitalName
          };
          if (data.notes) { body.notes = data.notes; }
          return BA.api('POST', '/api/requests', body).then(function (r) {
            $('#reqCard', el).innerHTML = '<div class="empty"><div class="blood-dot" style="margin:0 auto 12px">' + BA.icon('check') + '</div>' +
              '<h2>Request submitted</h2><p>Request #' + esc(r.id) + ' for ' + esc(r.units) + ' unit(s) of ' + esc(r.bloodType) +
              ' has been sent to blood bank staff.</p><div class="row" style="justify-content:center"><a class="btn primary" href="#/my-requests">View my requests</a>' +
              '<a class="btn" href="#/search?type=' + encodeURIComponent(r.bloodType) + '">Find ' + esc(r.bloodType) + ' nearby</a></div></div>';
          });
        });
      }
    };
  }, { title: 'Request blood' });

  // ------------------------------------------------------------ my requests
  BA.addRoute('/my-requests', function () {
    return BA.get('/api/requests/mine').then(function (list) {
      var body = list.length
        ? '<ul class="list">' + list.map(function (r) {
          return '<li><div class="blood-dot">' + esc(r.bloodType) + '</div><div class="grow"><div class="title">' + esc(r.patientName) + ' - ' + esc(r.units) + ' unit(s)</div>' +
            '<div class="muted small">' + esc(r.hospitalName) + ' &middot; ' + esc(ui.timeAgo(r.createdAt)) + '</div></div>' +
            '<div class="row">' + ui.urgencyBadge(r.urgency) + ui.statusBadge(r.status) + '</div></li>';
        }).join('') + '</ul>'
        : ui.empty('You have not made any requests yet.');
      return ui.pageHead('My requests', 'Requests you have submitted and their progress.') +
        '<section class="card">' + body + '</section><p style="margin-top:16px"><a class="btn primary" href="#/request">New request</a></p>';
    });
  }, { title: 'My requests', roles: [] });
})();
