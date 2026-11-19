/* Floating medical assistant + a tiny, safe markdown renderer. */
(function () {
  'use strict';

  var BA = window.BA;
  var esc = BA.esc;
  var $ = BA.$;

  /**
   * Renders a small markdown subset (bold, bullet and numbered lists, line breaks).
   * All text is HTML-escaped first, so model output can never inject markup.
   */
  BA.mdLite = function (text) {
    var lines = esc(text || '').split(/\r?\n/);
    var out = [];
    var listType = null;

    function closeList() {
      if (listType) { out.push('</' + listType + '>'); listType = null; }
    }
    function inline(s) {
      return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    }

    lines.forEach(function (raw) {
      var line = raw.trim();
      var bullet = /^[-*]\s+(.*)$/.exec(line);
      var numbered = /^\d+[.)]\s+(.*)$/.exec(line);
      if (bullet || numbered) {
        var wanted = bullet ? 'ul' : 'ol';
        if (listType !== wanted) { closeList(); out.push('<' + wanted + '>'); listType = wanted; }
        out.push('<li>' + inline((bullet || numbered)[1]) + '</li>');
      } else if (line === '') {
        closeList();
      } else {
        closeList();
        out.push('<p style="margin:0 0 .6em">' + inline(line) + '</p>');
      }
    });
    closeList();
    return out.join('');
  };

  var history = [];
  var busy = false;
  var built = false;

  var SUGGESTIONS = ['Who can donate blood?', 'Blood type compatibility', 'First aid for a minor cut', 'Foods to raise hemoglobin'];

  function build() {
    if (built) { return; }
    built = true;
    var panel = $('#chatPanel');
    panel.innerHTML =
      '<div class="chat-head"><div><strong>Medical assistant</strong><div class="muted small" id="chatMode">General guidance only</div></div>' +
      '<button class="icon-btn" id="chatClose" aria-label="Close chat">' + BA.icon('x') + '</button></div>' +
      '<div class="chat-log" id="chatLog" role="log" aria-live="polite"></div>' +
      '<div class="chat-suggest" id="chatSuggest">' + SUGGESTIONS.map(function (s) {
        return '<button type="button">' + esc(s) + '</button>';
      }).join('') + '</div>' +
      '<div class="chat-foot">Not medical advice. In an emergency call 112 (India) or your local number.</div>' +
      '<form class="chat-form" id="chatForm"><input type="text" id="chatInput" maxlength="1000" placeholder="Ask a question..." aria-label="Your message" autocomplete="off">' +
      '<button class="btn primary" type="submit" aria-label="Send">' + BA.icon('send') + '</button></form>';

    addMessage('model', 'Hi! I am the BloodAid assistant. Ask me about donating blood, blood types, or basic first aid.', false);

    $('#chatClose').addEventListener('click', closeChat);
    $('#chatForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var input = $('#chatInput');
      var text = input.value.trim();
      if (text) { input.value = ''; send(text); }
    });
    BA.$$('#chatSuggest button').forEach(function (b) {
      b.addEventListener('click', function () { send(b.textContent); });
    });
  }

  function addMessage(role, text, remember) {
    var log = $('#chatLog');
    var div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'user' : '');
    if (role === 'user') { div.textContent = text; } else { div.innerHTML = BA.mdLite(text); }
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    if (remember !== false) { history.push({ role: role === 'user' ? 'user' : 'model', content: text }); }
    return div;
  }

  function send(text) {
    if (busy) { return; }
    busy = true;
    $('#chatSuggest').hidden = true;

    var prior = history.slice(-12);
    addMessage('user', text, true);

    var typing = document.createElement('div');
    typing.className = 'msg typing';
    typing.textContent = 'Thinking...';
    $('#chatLog').appendChild(typing);
    $('#chatLog').scrollTop = $('#chatLog').scrollHeight;

    BA.api('POST', '/api/chat', { message: text, history: prior }).then(function (res) {
      typing.remove();
      addMessage('model', res.reply, true);
      $('#chatMode').textContent = res.source === 'gemini' ? 'Powered by Gemini - general guidance only' : 'Basic mode (no AI key) - general guidance only';
    }).catch(function (err) {
      typing.remove();
      addMessage('model', 'Sorry, I could not answer right now. ' + err.message, false);
    }).then(function () { busy = false; });
  }

  function openChat() {
    build();
    $('#chatPanel').hidden = false;
    $('#chatFab').hidden = true;
    setTimeout(function () { $('#chatInput').focus(); }, 0);
  }
  function closeChat() {
    $('#chatPanel').hidden = true;
    $('#chatFab').hidden = false;
    $('#chatFab').focus();
  }

  BA.openChat = openChat;

  $('#chatFab').innerHTML = BA.icon('message');
  $('#chatFab').addEventListener('click', openChat);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !$('#chatPanel').hidden) { closeChat(); }
  });
})();
