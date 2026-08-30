(function () {
  'use strict';

  if (window.BHG_AI_WIDGET) return;
  window.BHG_AI_WIDGET = true;

  var API = window.BHHG_API_BASE
    ? String(window.BHHG_API_BASE).replace(/\/+$/, '') + '/api/ai'
    : (location.protocol === 'http:' || location.protocol === 'https:')
      ? '/api/ai'
      : 'https://brandonholdingsgroup-api-delta.vercel.app/api/ai';
  var SID_KEY = 'bhhg_ai_sid';
  var welcome = 'Hi — I am the Brandon Holdings Group assistant. Ask about our services, fees, or how to book a consultation.';
  var enabled = true;
  var busy = false;
  var root;
  var input;
  var log;
  var send;
  var greeted = false;

  function sessionId() {
    try {
      var v = localStorage.getItem(SID_KEY);
      if (!v) {
        v = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(SID_KEY, v);
      }
      return v;
    } catch (e) {
      return 's_' + Date.now().toString(36);
    }
  }

  function contactHref() {
    var segs = location.pathname.replace(/index\.html$/, '').split('/').filter(Boolean);
    var prefix = segs.length ? segs.map(function () { return '..'; }).join('/') + '/' : '';
    return prefix + 'contact/';
  }

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  function injectCss() {
    if (document.getElementById('bhg-ai-css')) return;
    var s = document.createElement('style');
    s.id = 'bhg-ai-css';
    s.textContent =
      '#bhg-ai{position:fixed;right:20px;bottom:108px;z-index:99991;font-family:Arial,Helvetica,sans-serif;display:none}' +
      '#bhg-ai.open{display:block}' +
      '#bhg-ai-panel{width:min(380px,calc(100vw - 32px));height:min(520px,calc(100vh - 140px));background:#fff;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 18px 40px rgba(15,23,42,.22);color:#0F172A}' +
      '#bhg-ai-head{background:#0E6563;color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px}' +
      '#bhg-ai-head strong{font-size:15px}' +
      '#bhg-ai-head span{display:block;font-size:12px;opacity:.85;font-weight:400}' +
      '#bhg-ai-close{background:transparent;border:0;color:#fff;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:22px;line-height:1}' +
      '#bhg-ai-close:hover{background:rgba(255,255,255,.14)}' +
      '#bhg-ai-close:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
      '#bhg-ai-log{flex:1;overflow:auto;padding:14px;background:#f6f8fb}' +
      '.bhg-ai-msg{max-width:92%;margin:0 0 10px;padding:10px 12px;border-radius:12px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}' +
      '.bhg-ai-msg.bot{background:#fff;border:1px solid #dce7e6;color:#0F172A}' +
      '.bhg-ai-msg.me{background:#0E6563;color:#fff;margin-left:auto}' +
      '.bhg-ai-msg.sys{background:#edf6f4;color:#0E6563;font-size:13px}' +
      '#bhg-ai-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e5eceb;background:#fff}' +
      '#bhg-ai-input{flex:1;border:1px solid #cfe3de;border-radius:10px;padding:10px 12px;font:14px Arial,Helvetica,sans-serif}' +
      '#bhg-ai-input:focus{outline:2px solid #0E6563;outline-offset:-1px}' +
      '#bhg-ai-send{background:#0E6563;color:#fff;border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}' +
      '#bhg-ai-send[disabled]{opacity:.6;cursor:progress}' +
      '@media(max-width:767px){#bhg-ai{right:12px;left:12px;bottom:100px}#bhg-ai-panel{width:auto;height:min(70vh,560px)}}';
    document.head.appendChild(s);
  }

  function addMsg(role, text) {
    if (!log) return;
    var node = document.createElement('div');
    node.className = 'bhg-ai-msg ' + role;
    node.textContent = text;
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
  }

  function greet() {
    if (greeted) return;
    greeted = true;
    addMsg('bot', welcome);
  }

  function openChat() {
    if (!enabled || !root) return;
    root.classList.add('open');
    greet();
    if (input) input.focus();
  }

  function closeChat() {
    if (!root) return;
    root.classList.remove('open');
  }

  function mount() {
    injectCss();
    if (document.getElementById('bhg-ai')) return;
    root = el(
      '<div id="bhg-ai">' +
        '<div id="bhg-ai-panel" role="dialog" aria-label="Chat with Brandon Holdings Group">' +
          '<div id="bhg-ai-head">' +
            '<div><strong>Brandon Holdings</strong><span>Ask about services &amp; booking</span></div>' +
            '<button type="button" id="bhg-ai-close" aria-label="Close chat">&times;</button>' +
          '</div>' +
          '<div id="bhg-ai-log"></div>' +
          '<form id="bhg-ai-form">' +
            '<input id="bhg-ai-input" type="text" maxlength="2000" autocomplete="off" placeholder="Type a message…" aria-label="Message">' +
            '<button id="bhg-ai-send" type="submit">Send</button>' +
          '</form>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(root);

    log = root.querySelector('#bhg-ai-log');
    var form = root.querySelector('#bhg-ai-form');
    input = root.querySelector('#bhg-ai-input');
    send = root.querySelector('#bhg-ai-send');

    root.querySelector('#bhg-ai-close').addEventListener('click', closeChat);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy || !enabled) return;
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      addMsg('me', text);
      busy = true;
      send.disabled = true;
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId(), message: text })
      })
        .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (out) {
          var j = out.j || {};
          var reply = (j.message || j.error || 'Sorry, something went wrong. Please use the contact page.');
          addMsg('bot', reply);
          if (j.humanHandover) {
            addMsg('sys', 'A team member can take it from here. Open the contact page if you would rather write or call.');
            var a = document.createElement('a');
            a.className = 'bhg-ai-msg sys';
            a.href = contactHref();
            a.textContent = 'Go to contact';
            a.style.display = 'inline-block';
            a.style.textDecoration = 'none';
            a.style.fontWeight = '700';
            log.appendChild(a);
            log.scrollTop = log.scrollHeight;
          }
        })
        .catch(function () {
          addMsg('bot', 'The assistant is unavailable right now. Please use WhatsApp or the contact page.');
        })
        .then(function () {
          busy = false;
          send.disabled = false;
        });
    });

    window.BHG_openChat = openChat;
    window.BHG_closeChat = closeChat;
    if (window.BHG_openChatQueued) {
      window.BHG_openChatQueued = false;
      openChat();
    }

    fetch(API + '?action=config')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j) return;
        if (j.welcome) welcome = j.welcome;
        if (j.enabled === false) {
          enabled = false;
          closeChat();
          var fabChat = document.querySelector('.bhg-fab-chat');
          if (fabChat) fabChat.style.display = 'none';
        }
      })
      .catch(function () { /* keep default welcome */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
