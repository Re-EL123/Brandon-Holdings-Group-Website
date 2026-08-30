(function () {
  'use strict';

  if (window.BHG_AI_WIDGET) return;
  window.BHG_AI_WIDGET = true;

  var API = (window.BHHG_API_BASE
    ? String(window.BHHG_API_BASE).replace(/\/+$/, '')
    : (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? ''
      : 'https://brandonholdingsgroup-api-delta.vercel.app') + '/api/ai';
  var SID_KEY = 'bhhg_ai_sid';
  var EMAIL_KEY = 'bhhg_ai_email';
  var welcome = 'Hi — I am the Brandon Holdings Group assistant. Ask about our services, add one to your cart, and check out here.';
  var enabled = true;
  var busy = false;
  var root;
  var input;
  var log;
  var send;
  var SIZE_KEY = 'bhhg_ai_expanded';
  var expandBtn;
  var greeted = false;
  var FALLBACK_CATALOG = {
    1: { name: 'Virtual Business Consultation', price: 499.99 },
    2: { name: 'Business Plan & Documentation', price: 1750 },
    3: { name: 'Business Systems & Support', price: 7750 },
    4: { name: 'Bronze Advisory (Monthly)', price: 2250 },
    5: { name: 'Silver Advisory (Monthly)', price: 4500 },
    6: { name: 'Gold Advisory (Monthly)', price: 7500 }
  };

  function catalog() {
    return window.BHG_CATALOG || FALLBACK_CATALOG;
  }

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

  function logEvent(kind, extra) {
    var payload = { op: 'event', sessionId: sessionId(), kind: kind };
    if (extra) {
      if (extra.id) payload.id = extra.id;
      if (extra.email) payload.email = extra.email;
      if (extra.total) payload.total = extra.total;
    }
    fetch(API, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function () {});
  }

  function savedEmail(next) {
    try {
      if (arguments.length) {
        localStorage.setItem(EMAIL_KEY, String(next || ''));
        return String(next || '');
      }
      return localStorage.getItem(EMAIL_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function contactHref() {
    var segs = location.pathname.replace(/index\.html$/, '').split('/').filter(Boolean);
    var prefix = segs.length ? segs.map(function () { return '..'; }).join('/') + '/' : '';
    return prefix + 'contact/';
  }

  function money(n) {
    return 'R' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function cartPayload() {
    if (typeof window.BHG_cartSnapshot === 'function') {
      return window.BHG_cartSnapshot().items.map(function (it) {
        return { id: it.id, qty: it.qty || 1 };
      });
    }
    return [];
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
      '#bhg-ai.open.expanded{display:flex}' +
      '#bhg-ai.expanded{inset:12px;right:12px;left:12px;top:12px;bottom:12px;z-index:100000}' +
      '#bhg-ai-panel{width:min(380px,calc(100vw - 32px));height:min(520px,calc(100vh - 140px));min-width:280px;min-height:360px;max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);background:#fff;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 18px 40px rgba(15,23,42,.22);color:#0F172A;resize:both}' +
      '#bhg-ai.expanded #bhg-ai-panel{width:100%;height:100%;max-width:none;max-height:none;min-width:0;min-height:0;resize:none}' +
      '#bhg-ai-head{background:#0E6563;color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-shrink:0}' +
      '#bhg-ai-head strong{font-size:15px}' +
      '#bhg-ai-head span{display:block;font-size:12px;opacity:.85;font-weight:400}' +
      '#bhg-ai-head-actions{display:flex;align-items:center;gap:2px;flex-shrink:0}' +
      '#bhg-ai-expand,#bhg-ai-close{background:transparent;border:0;color:#fff;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:18px;line-height:1;display:inline-flex;align-items:center;justify-content:center;padding:0}' +
      '#bhg-ai-expand:hover,#bhg-ai-close:hover{background:rgba(255,255,255,.14)}' +
      '#bhg-ai-expand:focus-visible,#bhg-ai-close:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
      '#bhg-ai-expand svg{display:block}' +
      '#bhg-ai.expanded .bhg-ai-icon-expand,#bhg-ai:not(.expanded) .bhg-ai-icon-restore{display:none}' +
      '#bhg-ai-close{font-size:22px}' +
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
      '.bhg-ai-msg.think{display:inline-flex;align-items:center;gap:8px;color:#0E6563;white-space:nowrap}' +
      '.bhg-ai-think-label{font-size:13px;font-weight:600}' +
      '.bhg-ai-think-label:after{content:"";animation:bhg-ai-ellipsis 1.4s infinite}' +
      '.bhg-ai-dots{display:inline-flex;align-items:flex-end;gap:4px;height:12px}' +
      '.bhg-ai-dots span{width:6px;height:6px;border-radius:50%;background:#0E6563;opacity:.35;animation:bhg-ai-dot 1.05s infinite ease-in-out}' +
      '.bhg-ai-dots span:nth-child(2){animation-delay:.16s}' +
      '.bhg-ai-dots span:nth-child(3){animation-delay:.32s}' +
      '@keyframes bhg-ai-dot{0%,80%,100%{transform:translateY(0);opacity:.3}40%{transform:translateY(-5px);opacity:1}}' +
      '@keyframes bhg-ai-ellipsis{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}' +
      '@media(prefers-reduced-motion:reduce){.bhg-ai-dots span,.bhg-ai-think-label:after{animation:none}.bhg-ai-dots span{opacity:.7}.bhg-ai-think-label:after{content:"…"}}' +
      '.bhg-ai-chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px;max-width:100%;position:sticky;top:0;background:#f6f8fb;z-index:1;padding:0 0 8px}' +
      '.bhg-ai-chip{background:#fff;border:1px solid #cfe3de;color:#0E6563;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700;cursor:pointer}' +
      '.bhg-ai-chip:hover{background:#edf6f4}' +
      '.bhg-ai-cart{white-space:normal;width:100%;max-width:100%;box-sizing:border-box}' +
      '.bhg-ai-cart h4{margin:0 0 8px;font-size:13px;color:#0E6563}' +
      '.bhg-ai-cart-line{display:flex;justify-content:space-between;gap:8px;font-size:13px;padding:6px 0;border-bottom:1px solid #edf2f1}' +
      '.bhg-ai-cart-line button{background:transparent;border:0;color:#991b1b;cursor:pointer;font-size:16px;line-height:1}' +
      '.bhg-ai-cart-total{display:flex;justify-content:space-between;font-weight:800;margin:8px 0 10px;color:#0E6563}' +
      '.bhg-ai-cart-email{width:100%;box-sizing:border-box;border:1px solid #cfe3de;border-radius:8px;padding:8px 10px;font:13px Arial,Helvetica,sans-serif;margin:0 0 8px}' +
      '.bhg-ai-cart-email:focus{outline:2px solid #0E6563;outline-offset:-1px}' +
      '.bhg-ai-cart-pay{background:#0E6563;color:#fff;border:0;border-radius:8px;padding:10px 12px;font-weight:700;cursor:pointer;width:100%}' +
      '.bhg-ai-cart-pay[disabled]{opacity:.6;cursor:progress}' +
      '.bhg-ai-cart-note{margin:8px 0 0;font-size:12px;color:#64748b}' +
      '.bhg-ai-paylink{display:block;margin-top:8px;background:#0E6563;color:#fff!important;text-align:center;padding:10px;border-radius:8px;font-weight:700;text-decoration:none}' +
      '@media(max-width:767px){#bhg-ai{right:12px;left:12px;bottom:100px}#bhg-ai-panel{width:auto;height:min(70vh,560px);resize:none}#bhg-ai.expanded{inset:8px;bottom:8px}#bhg-ai.expanded #bhg-ai-panel{height:100%}}';
    document.head.appendChild(s);
  }

  function addMsg(role, text) {
    if (!log) return;
    var node = document.createElement('div');
    node.className = 'bhg-ai-msg ' + role;
    node.textContent = text;
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
    return node;
  }

  function showThinking() {
    hideThinking();
    if (!log) return;
    var node = document.createElement('div');
    node.id = 'bhg-ai-think';
    node.className = 'bhg-ai-msg bot think';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.setAttribute('aria-label', 'Assistant is thinking');
    node.innerHTML =
      '<span class="bhg-ai-think-label">Thinking</span>' +
      '<span class="bhg-ai-dots" aria-hidden="true"><span></span><span></span><span></span></span>';
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
  }

  function hideThinking() {
    var n = document.getElementById('bhg-ai-think');
    if (n && n.parentNode) n.parentNode.removeChild(n);
  }

  function inferActions(text) {
    var t = String(text || '').toLowerCase();
    var snap = typeof window.BHG_cartSnapshot === 'function' ? window.BHG_cartSnapshot() : { items: [] };
    var actions = [];
    var em = String(text || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (/\b(check\s*out|pay now|proceed to pay|complete (my |the )?(order|purchase|payment))\b/.test(t) && snap.items.length) {
      actions.push({ type: 'checkout', email: em ? em[0] : savedEmail() });
      return actions;
    }
    var wants = /\b(add(ing)? (to )?(my |the )?cart|buy|purchase|book|order|get me|i'll take|put .{0,24} in (my |the )?cart)\b/.test(t)
      || /\bi (want|need) (a |an |the )?(virtual |business )?(consult|plan|system|bronze|silver|gold)/.test(t)
      || /\bi (want|need) (to )?(buy|add|book|order|get)\b/.test(t);
    if (!wants) return actions;
    var id = 0;
    if (/\bgold\b/.test(t)) id = 6;
    else if (/\bsilver\b/.test(t)) id = 5;
    else if (/\bbronze\b/.test(t)) id = 4;
    else if (/\b(systems?|step\s*3)\b/.test(t)) id = 3;
    else if (/\b(business plan|documentation|step\s*2)\b/.test(t)) id = 2;
    else if (/\b(consult|step\s*1)\b/.test(t)) id = 1;
    if (id) actions.push({ type: 'addToCart', id: id });
    return actions;
  }

  function applyActions(actions, userText) {
    var list = Array.isArray(actions) ? actions.slice() : [];
    if (!list.length) list = inferActions(userText);
    var show = false;
    var checkoutEmail = '';
    var doCheckout = false;
    var addedNames = [];
    var i;
    for (i = 0; i < list.length; i++) {
      var a = list[i] || {};
      var t = a.type || a.tool;
      if (t === 'addToCart' && typeof window.BHG_addService === 'function') {
        var before = window.BHG_addService(a.id);
        if (before && before.added) {
          for (var n = 0; n < before.added.length; n++) addedNames.push(before.added[n].name);
        }
        show = true;
      }
      if (t === 'removeFromCart' && typeof window.BHG_removeService === 'function') {
        window.BHG_removeService(a.id);
        show = true;
      }
      if (t === 'showCart') show = true;
      if (t === 'checkout') {
        show = true;
        doCheckout = true;
        checkoutEmail = String(a.email || '').trim();
        if (checkoutEmail) savedEmail(checkoutEmail);
      }
    }
    if (show) renderCartCard({ autoPay: doCheckout && !!checkoutEmail, email: checkoutEmail || savedEmail() });
    return { addedNames: addedNames, checkout: doCheckout };
  }

  function renderCartCard(opts) {
    opts = opts || {};
    if (!log) return;
    var snap = typeof window.BHG_cartSnapshot === 'function' ? window.BHG_cartSnapshot() : { items: [], total: 0 };
    var existing = log.querySelector('.bhg-ai-cart');
    var card = existing || document.createElement('div');
    card.className = 'bhg-ai-msg bot bhg-ai-cart';
    card.innerHTML = '';
    var title = document.createElement('h4');
    title.textContent = 'Your cart';
    card.appendChild(title);

    if (!snap.items.length) {
      var empty = document.createElement('p');
      empty.className = 'bhg-ai-cart-note';
      empty.textContent = 'Your cart is empty. Choose a service above or tell me which one you want.';
      card.appendChild(empty);
    } else {
      snap.items.forEach(function (it) {
        var line = document.createElement('div');
        line.className = 'bhg-ai-cart-line';
        var left = document.createElement('div');
        left.textContent = it.name + (it.qty > 1 ? ' ×' + it.qty : '');
        var right = document.createElement('div');
        right.style.display = 'flex';
        right.style.alignItems = 'center';
        right.style.gap = '8px';
        var price = document.createElement('span');
        price.textContent = money(it.price * (it.qty || 1));
        var rm = document.createElement('button');
        rm.type = 'button';
        rm.setAttribute('aria-label', 'Remove ' + it.name);
        rm.textContent = '×';
        rm.addEventListener('click', function () {
          if (typeof window.BHG_removeService === 'function') window.BHG_removeService(it.id);
          renderCartCard({ email: savedEmail() });
        });
        right.appendChild(price);
        right.appendChild(rm);
        line.appendChild(left);
        line.appendChild(right);
        card.appendChild(line);
      });
      var tot = document.createElement('div');
      tot.className = 'bhg-ai-cart-total';
      tot.innerHTML = '<span>Total</span><span></span>';
      tot.lastChild.textContent = money(snap.total);
      card.appendChild(tot);

      var email = document.createElement('input');
      email.className = 'bhg-ai-cart-email';
      email.type = 'email';
      email.autocomplete = 'email';
      email.placeholder = 'Email for the payment link';
      email.setAttribute('aria-label', 'Email for the payment link');
      email.value = opts.email || savedEmail();
      card.appendChild(email);

      var pay = document.createElement('button');
      pay.type = 'button';
      pay.className = 'bhg-ai-cart-pay';
      pay.textContent = 'Pay now via iKhokha';
      pay.addEventListener('click', function () {
        startCheckout(card, email.value, pay);
      });
      card.appendChild(pay);

      var note = document.createElement('p');
      note.className = 'bhg-ai-cart-note';
      note.textContent = 'We never ask for card details in chat. iKhokha opens in a new tab.';
      card.appendChild(note);
    }

    if (!existing) log.appendChild(card);
    log.scrollTop = log.scrollHeight;
    if (opts.autoPay && snap.items.length) {
      var btn = card.querySelector('.bhg-ai-cart-pay');
      var field = card.querySelector('.bhg-ai-cart-email');
      startCheckout(card, (field && field.value) || opts.email, btn);
    }
  }

  function startCheckout(card, email, btn) {
    if (typeof window.BHG_checkoutCart !== 'function') {
      addMsg('sys', 'Checkout is not available on this page. Open the cart from the menu.');
      return;
    }
    savedEmail(email);
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Creating payment link…';
    }
    window.BHG_checkoutCart(email)
      .then(function (result) {
        var oldLink = card.querySelector('.bhg-ai-paylink');
        if (oldLink) oldLink.parentNode.removeChild(oldLink);
        var oldErr = card.querySelector('.bhg-ai-cart-err');
        if (oldErr) oldErr.parentNode.removeChild(oldErr);
        if (result && result.ok && result.payment && result.payment.link) {
          var a = document.createElement('a');
          a.className = 'bhg-ai-paylink';
          a.href = result.payment.link;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = 'Complete payment (' + money(result.total) + ')';
          card.appendChild(a);
          addMsg('bot', 'Your payment link is ready. A copy was also emailed to ' + result.email + '.');
          logEvent('checkout', { email: result.email, total: result.total });
        } else {
          var err = document.createElement('p');
          err.className = 'bhg-ai-cart-note bhg-ai-cart-err';
          err.style.color = '#991b1b';
          err.textContent = (result && result.error) || 'Could not create a payment link. Try the cart in the menu, or WhatsApp.';
          card.appendChild(err);
        }
        log.scrollTop = log.scrollHeight;
      })
      .catch(function () {
        addMsg('bot', 'Checkout failed just now. Please use the cart in the menu or WhatsApp.');
      })
      .then(function () {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Pay now via iKhokha';
        }
      });
  }

  function addServiceChips() {
    if (!log || log.querySelector('.bhg-ai-chips')) return;
    var wrap = document.createElement('div');
    wrap.className = 'bhg-ai-chips';
    var cat = catalog();
    [1, 2, 3, 4, 5, 6].forEach(function (id) {
      var row = cat[id];
      if (!row) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bhg-ai-chip';
      b.textContent = row.name.replace(' (Monthly)', '') + ' ' + money(row.price);
      b.addEventListener('click', function () {
        if (busy) return;
        addFromChip(id);
      });
      wrap.appendChild(b);
    });
    log.appendChild(wrap);
  }

  function addFromChip(id) {
    var cat = catalog()[id];
    if (!cat) return;
    addMsg('me', 'Add ' + cat.name);
    if (typeof window.BHG_addService !== 'function') {
      addMsg('bot', 'I could not reach the cart on this page. Please use the Services page.');
      return;
    }
    var result = window.BHG_addService(id);
    var extra = result.added && result.added.length > 1
      ? ' I also added the required earlier steps so this service can be purchased.'
      : '';
    addMsg('bot', 'Added ' + cat.name + ' (' + money(cat.price) + ').' + extra + ' Enter your email below to get an iKhokha payment link.');
    logEvent('cart', { id: id });
    renderCartCard({ email: savedEmail() });
  }

  function isExpanded() {
    try { return localStorage.getItem(SIZE_KEY) === '1'; } catch (e) { return false; }
  }

  function syncExpandUi() {
    if (!root || !expandBtn) return;
    var on = root.classList.contains('expanded');
    expandBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    expandBtn.setAttribute('aria-label', on ? 'Restore chat size' : 'Expand chat');
    expandBtn.title = on ? 'Restore' : 'Expand';
  }

  function setExpanded(on) {
    if (!root) return;
    if (on) root.classList.add('expanded');
    else root.classList.remove('expanded');
    try { localStorage.setItem(SIZE_KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
    syncExpandUi();
  }

  function toggleExpanded() {
    setExpanded(!(root && root.classList.contains('expanded')));
  }

  function greet() {
    if (greeted) return;
    greeted = true;
    addMsg('bot', welcome);
    addServiceChips();
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
            '<div><strong>Brandon Holdings</strong><span>Ask, add to cart &amp; check out</span></div>' +
            '<div id="bhg-ai-head-actions">' +
              '<button type="button" id="bhg-ai-expand" aria-label="Expand chat" aria-pressed="false" title="Expand">' +
                '<svg class="bhg-ai-icon-expand" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 2H2v4M10 2h4v4M2 10v4h4M14 10v4h-4"/><path d="M2 2l4 4M14 2l-4 4M2 14l4-4M14 14l-4-4"/></svg>' +
                '<svg class="bhg-ai-icon-restore" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 6h6v6H4z"/><path d="M6 4h6v6"/></svg>' +
              '</button>' +
              '<button type="button" id="bhg-ai-close" aria-label="Close chat">&times;</button>' +
            '</div>' +
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

    expandBtn = root.querySelector('#bhg-ai-expand');
    if (expandBtn) expandBtn.addEventListener('click', toggleExpanded);
    root.querySelector('#bhg-ai-close').addEventListener('click', closeChat);
    setExpanded(isExpanded());

    function postChat(text, attempt) {
      return fetch(API, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ sessionId: sessionId(), message: text, cart: cartPayload() })
      }).then(function (r) {
        return r.json().catch(function () { return null; }).then(function (j) { return { ok: r.ok, j: j }; });
      }).catch(function (err) {
        if (attempt >= 1) throw err;
        return new Promise(function (resolve) { setTimeout(resolve, 700); }).then(function () {
          return postChat(text, attempt + 1);
        });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy || !enabled) return;
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      addMsg('me', text);
      busy = true;
      send.disabled = true;
      showThinking();
      postChat(text, 0)
        .then(function (out) {
          hideThinking();
          var j = (out && out.j) || {};
          var reply = (j.message || j.error || 'Sorry, something went wrong. Please use the contact page.');
          addMsg('bot', reply);
          applyActions(j.actions, text);
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
          hideThinking();
          addMsg('bot', 'The assistant is unavailable right now. Please use WhatsApp or the contact page.');
          applyActions([], text);
        })
        .then(function () {
          hideThinking();
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
