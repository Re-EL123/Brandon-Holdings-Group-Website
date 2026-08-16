(function () {
  'use strict';

  var API_BASE =
    window.BHHG_API_BASE || 'https://brandonholdingsgroup-api-delta.vercel.app';
  var API = API_BASE + '/api';

  function userID() {
    var key = 'bhhg_uid';
    try {
      var v = localStorage.getItem(key);
      if (!v) {
        v = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(key, v);
      }
      return v;
    } catch (e) {
      return '';
    }
  }

  function beacon() {
    try {
      var payload = { page: location.pathname, uid: userID() };
      if (document.referrer) payload.ref = document.referrer;
      if (navigator.sendBeacon) {
        navigator.sendBeacon(API + '/stats', new Blob([JSON.stringify(payload)], { type: 'text/plain' }));
      } else {
        fetch(API + '/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }
    } catch (e) { /* noop */ }
  }

  function telHref(value) {
    var d = String(value || '').replace(/\D+/g, '');
    if (!d) return '';
    if (d.charAt(0) === '0') d = '27' + d.slice(1);
    return 'tel:+' + d;
  }

  function waHref(value) {
    var v = String(value || '').trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    var d = v.replace(/\D+/g, '');
    if (d) return 'https://wa.me/' + d;
    return 'https://wa.me/' + encodeURIComponent(v.replace(/^\+/, ''));
  }

  function textSpan(item) {
    return item && item.querySelector('.elementor-icon-list-text');
  }

  function setList(items, contact) {
    if (!items || !items.length) return;

    var s0 = textSpan(items[0]);
    if (contact.address && s0) s0.textContent = contact.address;

    var link = function (idx, href, display) {
      var item = items[idx];
      if (!item) return;
      var a = item.querySelector('a');
      var s = textSpan(item);
      if (href && a) a.setAttribute('href', href);
      if (display && s) s.textContent = display;
    };

    if (contact.email) link(1, 'mailto:' + contact.email, contact.email);
    if (contact.phone) link(2, telHref(contact.phone), contact.phone);
  }

  function applyContact(contact) {
    if (!contact) return;

    var footer = document.querySelector('[data-id="1d39d134"]');
    if (footer) setList(footer.querySelectorAll('li.elementor-icon-list-item'), contact);

    var info = document.querySelector('[data-id="6a03473"]');
    if (info) {
      var items = info.querySelectorAll('li.elementor-icon-list-item');
      setList(items, contact);
      if (contact.whatsapp && items[3]) {
        var a = items[3].querySelector('a');
        if (a) a.setAttribute('href', waHref(contact.whatsapp));
        var s = textSpan(items[3]);
        if (s) s.textContent = contact.phone || contact.whatsapp;
      }
    }

    var socials = {
      'elementor-social-icon-facebook-f': contact.facebook,
      'elementor-social-icon-instagram': contact.instagram,
      'elementor-social-icon-linkedin-in': contact.linkedin,
      'elementor-social-icon-whatsapp': contact.whatsapp ? waHref(contact.whatsapp) : '',
    };
    Object.keys(socials).forEach(function (cls) {
      if (!socials[cls]) return;
      var els = document.querySelectorAll('a.' + cls);
      for (var i = 0; i < els.length; i++) els[i].setAttribute('href', socials[cls]);
    });
  }

  var DEFAULTS = {
    phone: '071 8641026',
    whatsapp: 'https://wa.me/+27662108306',
  };

  var CONSULT_POPUP =
    '#elementor-action%3Aaction%3Dpopup%3Aopen%26settings%3DeyJpZCI6IjMxODEiLCJ0b2dnbGUiOmZhbHNlfQ%3D%3D';

  var WA_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  var PHONE_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';

  var CAL_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>';

  var PLUS_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';

    var CART_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>';

  var CLOCK_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>';

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function pageLabel() {
    var map = {
      'business-operations': 'Business Operations',
      'labour-law': 'Labour Law',
      'multimedia-marketing': 'Multimedia Marketing',
      'services': 'Services',
      gallery: 'Gallery',
      contact: 'Contact',
      consultation: 'Consultation',
    };
    var segs = location.pathname.split('/').filter(Boolean);
    var last = segs[segs.length - 1];
    return map[last] || 'website';
  }

  function waMsg() {
    return encodeURIComponent(
      'Hi Brandon Holdings! I visited your ' + pageLabel() + ' page and would like to know more about your services.'
    );
  }

  function waLink(base) {
    var b = base || DEFAULTS.whatsapp;
    return b + (b.indexOf('?') < 0 ? '?' : '&') + 'text=' + waMsg();
  }

  function consultHref() {
    if (document.getElementById('wpforms-form-153')) return '#wpforms-form-153';
    if (document.querySelector('[data-elementor-type="popup"]')) return CONSULT_POPUP;
    var segs = location.pathname.split('/').filter(Boolean).length;
    var prefix = '';
    for (var i = 0; i < segs; i++) prefix += '../';
    return prefix + 'contact/index.html';
  }

  function injectStyle(css) {
    var st = document.createElement('style');
    st.setAttribute('data-bhg', 'ui');
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  function buildFAB() {
    var body = document.body;
    if (!body) return;
    var fab = document.createElement('div');
    fab.className = 'bhg-fab';
    fab.innerHTML =
      '<div class="bhg-fab-actions">' +
      '<a class="bhg-fab-action bhg-fab-book" href="' + consultHref() + '">' +
      CAL_ICON + '<span>Book a consultation</span></a>' +
      '<a class="bhg-fab-action bhg-fab-wa" href="' + waLink(DEFAULTS.whatsapp) + '" target="_blank" rel="noopener">' +
      WA_ICON + '<span>WhatsApp</span></a>' +
      '</div>' +
      '<button type="button" class="bhg-fab-toggle" aria-label="Contact options" aria-expanded="false">' +
      PLUS_ICON + '</button>';
    body.appendChild(fab);

    var toggle = fab.querySelector('.bhg-fab-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = fab.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    var actions = fab.querySelectorAll('.bhg-fab-action');
    for (var i = 0; i < actions.length; i++) {
      actions[i].addEventListener('click', function () {
        fab.classList.remove('open');
        var t = fab.querySelector('.bhg-fab-toggle');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }
    document.addEventListener('click', function (e) {
      if (!fab.contains(e.target)) fab.classList.remove('open');
    });
  }

  function buildMobileBar() {
    var body = document.body;
    if (!body) return;
    var bar = document.createElement('div');
    bar.className = 'bhg-mobile-cta';
    bar.setAttribute('role', 'navigation');
    bar.innerHTML =
      '<a class="bhg-cta bhg-cta-call" href="' + telHref(DEFAULTS.phone) + '">' +
      PHONE_ICON + '<span>Call us</span></a>' +
      '<a class="bhg-cta bhg-cta-wa" href="' + waLink(DEFAULTS.whatsapp) + '" target="_blank" rel="noopener">' +
      WA_ICON + '<span>WhatsApp</span></a>';
    body.appendChild(bar);
  }

  function updateCTAs(contact) {
    if (!contact) return;
    var tel = telHref(contact.phone) || telHref(DEFAULTS.phone);
    var wa = waHref(contact.whatsapp || DEFAULTS.whatsapp);
    if (wa) {
      var link = wa + (wa.indexOf('?') < 0 ? '?' : '&') + 'text=' + waMsg();
      var sel = '.bhg-fab-wa, .bhg-cta-wa';
      var els = document.querySelectorAll(sel);
      for (var i = 0; i < els.length; i++) els[i].setAttribute('href', link);
    }
    if (tel) {
      var calls = document.querySelectorAll('.bhg-cta-call');
      for (var j = 0; j < calls.length; j++) calls[j].setAttribute('href', tel);
    }
  }

   function escHtml(s) {
     return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
       return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
     });
   }

   function addResponseBadge() {

    var form = document.getElementById('wpforms-form-153');
    if (!form) return;
    var holder = form.parentNode;
    if (!holder || !holder.parentNode) return;
    var b = document.createElement('div');
    b.className = 'bhg-rbadge';
    b.innerHTML = CLOCK_ICON + '<span>We typically respond within a few business hours</span>';
    holder.parentNode.insertBefore(b, holder);
  }

   function animateStats() {
     if (!(window.requestAnimationFrame && window.IntersectionObserver)) return;
     var spans = document.querySelectorAll('h3.elementor-icon-box-title span');
     var targets = [];
     for (var i = 0; i < spans.length; i++) {
       var txt = (spans[i].textContent || '').trim();
       var m = txt.match(/^(\d+)\s*([+%°]*)$/);
       if (!m) continue;
       targets.push({ el: spans[i], value: parseInt(m[1], 10), suffix: m[2] });
     }
     if (!targets.length) return;
     var io = new IntersectionObserver(function (entries) {
       entries.forEach(function (en) {
         if (!en.isIntersecting) return;
         for (var k = 0; k < targets.length; k++) {
           if (targets[k].el === en.target) {
             var t = targets[k], from = 0, to = t.value, dur = 1400, start = null;
             (function step(now) {
               if (!start) start = now;
               var p = Math.min((now - start) / dur, 1);
               var e = 1 - Math.pow(1 - p, 3);
               t.el.textContent = Math.round(from + (to - from) * e) + t.suffix;
               if (p < 1) requestAnimationFrame(step);
               else t.el.textContent = to + t.suffix;
             })(null);
             io.unobserve(t.el);
           }
         }
       });
     }, { threshold: 0.4 });
     for (var n = 0; n < targets.length; n++) {
       targets[n].el.textContent = '0' + targets[n].suffix;
       io.observe(targets[n].el);
     }
   }

   function enhanceConsultForm() {
     var form = document.querySelector('form[data-form-id="3180"]');
     if (!form || form.querySelector('.bhg-pay-now')) return;

     var amountRow = document.createElement('div');
     amountRow.className = 'forminator-row bhg-pay-row';
     amountRow.innerHTML =
       '<div class="forminator-col forminator-col-12"><div class="forminator-field">' +
       '<label class="forminator-label" for="bhg-pay-amount">Consultation fee (ZAR) <span class="forminator-required">*</span></label>' +
       '<input type="number" min="1" step="1" name="payment_amount" id="bhg-pay-amount" class="forminator-input" inputmode="numeric" placeholder="e.g. 500">' +
       '<span class="forminator-description" style="display:block">Enter the fee you wish to pay. You will receive a payment link after submitting.</span>' +
       '</div></div>';

     var payBtnRow = document.createElement('div');
     payBtnRow.className = 'forminator-row bhg-pay-row';
     payBtnRow.innerHTML =
       '<div class="forminator-col"><div class="forminator-field">' +
       '<button type="button" class="forminator-button bhg-pay-now" style="margin-bottom:14px"><span>Pay Now and Consult</span></button>' +
       '</div></div>';

     var last = form.querySelector('.forminator-row-last') || (form.lastElementChild && form.lastElementChild.tagName === 'DIV' ? form.lastElementChild : null);
     var anchor = last ? last : form;
     form.insertBefore(amountRow, anchor);
     form.insertBefore(payBtnRow, anchor);

      attachPayNow(form);
    }

    function showPayError(form, msg) {
     var box = form.querySelector('.bhg-pay-error');
     if (!box) {
       box = document.createElement('div');
       box.className = 'bhg-pay-error forminator-response-message forminator-error';
       box.setAttribute('role', 'alert');
       box.style.cssText = 'margin:0 0 14px;padding:14px 16px;background:#fdf3f3;border:1px solid #f2cccc;border-radius:6px;color:#b5451f;font-size:15px';
       form.insertBefore(box, form.querySelector('.forminator-row-last') || form.firstChild);
     }
     box.innerHTML = '<span>' + escHtml(msg) + '</span>';
   }

    function payBannerHTML(payment, amount) {
      if (!payment || !payment.link) {
        if (payment && payment.error) {
          return '<div style="padding:6px;text-align:center">' +
            '<p style="font-size:16px;font-weight:700;margin:0 0 4px">Payment link could not be created.</p>' +
            '<p style="margin:0;color:#b5451f">' + escHtml(payment.error) + '</p></div>';
        }
        return '<div style="padding:6px;text-align:center">' +
          '<p style="font-size:16px;font-weight:700;margin:0 0 4px">Thanks for reaching out.</p>' +
          '<p style="margin:0">Your consultation request has been sent and we will be in touch shortly.</p></div>';
      }
     return '<div style="padding:6px;text-align:center">' +
       '<p style="font-size:16px;font-weight:700;margin:0 0 6px">Consultation request received.</p>' +
       '<p style="margin:0 0 4px">Fee: <strong>R ' + escHtml(amount || payment.amount || '') + '</strong></p>' +
       '<p style="margin:0 0 12px">Complete your payment to secure your consultation slot:</p>' +
       '<p style="margin:0"><a class="bhg-pay-link" href="' + escHtml(payment.link) + '" target="_blank" rel="noopener" style="display:inline-block;background:#0E6563;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700">Complete payment now</a></p>' +
       '<p style="margin-top:10px;font-size:13px;color:#666">A copy of this link was also emailed to you.</p></div>';
   }

   function attachPayNow(form) {
     var btn = form.querySelector('.bhg-pay-now');
     if (!btn || btn._bhgPayBound) return;
     btn._bhgPayBound = true;
     btn.addEventListener('click', function () {
       var nameIn = form.querySelector('[name="name-1"]');
       var emailIn = form.querySelector('[name="email-1"]');
       var amt = form.querySelector('[name="payment_amount"]');
       if (!nameIn || !nameIn.value.trim() || !emailIn || !emailIn.value.trim()) {
         showPayError(form, 'Please fill in your first name and email address first.');
         return;
       }
       if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailIn.value.trim())) {
         showPayError(form, 'Please enter a valid email address.');
         return;
       }
       var amount = amt ? amt.value.trim() : '';
       if (!amount || isNaN(+amount) || +amount <= 0) {
         showPayError(form, 'Please enter a consultation fee amount (ZAR).');
         return;
       }
       var err = form.querySelector('.bhg-pay-error');
       if (err) err.remove();
       btn.disabled = true;
       var original = btn.innerHTML;
       btn.innerHTML = '<span>Processing…</span>';
       var fd = new FormData(form);
       fd.set('payment_mode', 'pay_now');

       fetch(API + '/forminator', { method: 'POST', body: fd })
         .then(function (r) { return r.json(); })
         .then(function (d) {
           btn.disabled = false;
           btn.innerHTML = original;
           if (d && d.success) {
             form.style.display = 'none';
             var parent = form.parentNode;
             var banner = document.createElement('div');
             banner.className = 'bhg-pay-banner';
             banner.setAttribute('role', 'status');
             banner.style.cssText = 'max-width:640px;margin:0 auto;text-align:center';
             banner.innerHTML = payBannerHTML((d.data && d.data.payment) || null, amount);
             if (parent) parent.insertBefore(banner, form.nextSibling);
             try {
               window.scrollTo({ top: Math.max(0, banner.getBoundingClientRect().top + window.scrollY - 90), behavior: 'smooth' });
             } catch (e) { /* noop */ }
           } else {
             showPayError(form, (d && d.message) || 'Sorry, something went wrong. Please try again.');
           }
         })
         .catch(function () {
           btn.disabled = false;
           btn.innerHTML = original;
           showPayError(form, 'Network error — please try again.');
         });
     });
   }

   function applyIkho(ikho) {
     if (!ikho || typeof ikho !== 'object') return;
     var rows = document.querySelectorAll('form[data-form-id="3180"] .bhg-pay-row');
     // Only offer "Pay Now" when payments are both enabled AND the gateway has
     // credentials configured server-side — otherwise the visitor gets a
     // success message with no payment link.
     var show = ikho.enabled !== false && ikho.configured !== false;
     if (rows.length) {
       for (var i = 0; i < rows.length; i++) rows[i].style.display = show ? '' : 'none';
     }
      var amt = document.querySelector('form[data-form-id="3180"] [name="payment_amount"]');
      if (amt && !amt.value && ikho.fee) amt.value = String(ikho.fee).replace(/[^\d.]/g, '');
    }

   function renderGeo(geo) {
     if (!geo) return;
     var parts = [];
     if (geo.city) parts.push(geo.city);
     if (geo.region) parts.push(geo.region);
     if (geo.country) parts.push(geo.country);
     if (!parts.length) return;
     var line = document.createElement('p');
     line.className = 'bhg-geo';
     line.textContent = 'Proudly serving clients in ' + parts.join(', ') + ' and beyond.';
     var foot = document.getElementById('colophon');
     if (foot) foot.appendChild(line);
   }

  function loadSettings() {
    fetch(API + '/settings')
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        if (!d) return;
        if (d.contact) {
          applyContact(d.contact);
          updateCTAs(d.contact);
        }
        renderGeo(d.visitorGeo);
        applyIkho(d.iKhokha);
      })
      .catch(function () { /* noop */ });
   }

   injectStyle(
     '.bhg-fab{position:fixed;right:20px;bottom:20px;z-index:99990;display:flex;flex-direction:column;align-items:flex-end;gap:14px}' +
    '.bhg-fab-actions{display:flex;flex-direction:column;align-items:flex-end;gap:12px;opacity:0;visibility:hidden;transform:translateY(12px);transition:opacity .25s ease,transform .25s ease,visibility .25s}' +
    '.bhg-fab.open .bhg-fab-actions{opacity:1;visibility:visible;transform:none}' +
    '.bhg-fab-action{display:inline-flex;align-items:center;gap:10px;padding:13px 20px;border-radius:999px;color:#fff;text-decoration:none;font:600 15px/1 Arial,Helvetica,sans-serif;box-shadow:0 8px 20px rgba(0,0,0,.28);white-space:nowrap;transition:transform .18s ease,box-shadow .18s ease}' +
    '.bhg-fab-action:hover{transform:translateY(-3px);box-shadow:0 14px 28px rgba(0,0,0,.38)}' +
    '.bhg-fab-action:focus-visible{outline:2px solid #fff;outline-offset:3px}' +
    '.bhg-fab-action svg{width:20px;height:20px;fill:#fff;flex:none}' +
    '.bhg-fab-wa{border:2px solid rgba(255,255,255,.24);background:#25d366}' +
    '.bhg-fab-book{border:2px solid rgba(255,255,255,.24);background:#0E6563}' +
    '.bhg-fab-toggle{width:72px;height:72px;border:none;border-radius:50%;background:#0E6563;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 14px 30px rgba(0,0,0,.45);transition:transform .22s ease,box-shadow .22s ease;animation:bhg-fab-bob 3.2s ease-in-out infinite}' +
    '.bhg-fab-toggle:hover{box-shadow:0 20px 38px rgba(0,0,0,.52);transform:scale(1.06)}' +
    '.bhg-fab-toggle:focus-visible{outline:3px solid #fff;outline-offset:4px}' +
    '.bhg-fab-toggle svg{width:36px !important;height:36px !important;stroke:#fff !important;fill:none !important;flex:none !important;transition:transform .25s ease}' +
    '.bhg-fab.open .bhg-fab-toggle svg{transform:rotate(45deg)}' +
    '.bhg-fab-actions .bhg-fab-action:nth-child(1){animation:bhg-fab-in .36s ease-out both}' +
    '.bhg-fab-actions .bhg-fab-action:nth-child(2){animation:bhg-fab-in .36s ease-out .06s both}' +
    '@keyframes bhg-fab-bob{0%,100%{transform:translateY(0)}40%{transform:translateY(-10px)}}' +
    '@keyframes bhg-fab-in{from{opacity:0;transform:translateY(14px) scale(.88)}to{opacity:1;transform:none}}' +
    '.bhg-mobile-cta{position:fixed;left:0;right:0;bottom:0;z-index:99980;display:none}' +
    '.bhg-mobile-cta .bhg-cta{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 10px;font:600 15px/1 Arial,Helvetica,sans-serif;color:#fff;text-decoration:none;letter-spacing:.02em}' +
    '.bhg-mobile-cta .bhg-cta svg{width:20px;height:20px;fill:#fff;flex:none}' +
    '.bhg-mobile-cta .bhg-cta-call{background:#0E6563}' +
    '.bhg-mobile-cta .bhg-cta-wa{background:#25d366}' +
    '@media(max-width:767px){.bhg-mobile-cta{display:flex}.bhg-fab{bottom:74px}body{padding-bottom:58px!important}}' +
    '.bhg-geo{margin:16px auto 0;padding:0 20px;font:14px/1.5 Arial,Helvetica,sans-serif;color:#8b96b4;text-align:center}' +
    '.bhg-rbadge{display:inline-flex;align-items:center;gap:8px;margin:0 0 16px;padding:8px 14px;background:#eef6f4;border:1px solid #cfe3de;border-radius:999px;font:600 13px/1.2 Arial,Helvetica,sans-serif;color:#0E6563}' +
    '.bhg-rbadge svg{width:15px;height:15px;fill:#0E6563;flex:none}'
  );

   onReady(function () {
     buildFAB();
    buildGlobalCart();
    updateCartUI();
     buildMobileBar();
     addResponseBadge();
     animateStats();
     enhanceConsultForm();
   });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSettings);
  } else {
    loadSettings();
  }
  beacon();

  function buildGlobalCart() {
    window.buildGlobalCart = buildGlobalCart;
    if (document.getElementById('bhg-cart-widget')) return;
    var div = document.createElement('div');
    div.innerHTML = `
      <div id="bhg-cart-widget" onclick="openCartModal()" style="position:fixed;bottom:24px;left:24px;background:#0E6563;color:#fff;padding:12px 20px;border-radius:30px;box-shadow:0 6px 24px rgba(0,0,0,.2);cursor:pointer;z-index:99990;display:flex;align-items:center;gap:10px;font-weight:700;font-size:14px;transition:transform .2s;">
        ${CART_ICON}
        <span>Cart</span>
        <span style="background:#fff;color:#0E6563;padding:2px 8px;border-radius:12px;font-size:12px;" id="floating-cart-count">0</span>
        <span id="floating-cart-total">R0.00</span>
      </div>

      <div id="bhg-cart-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;align-items:center;justify-content:center;padding:20px;">
        <div style="background:#fff;width:100%;max-width:640px;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.25);max-height:90vh;display:flex;flex-direction:column;">
            <div style="background:#0E6563;color:#fff;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;font-size:20px;">Your Selected Services</h3>
                <button onclick="closeCartModal()" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;">&times;</button>
            </div>
            <div style="padding:24px;overflow-y:auto;flex-grow:1;" id="cart-modal-body">
                <div id="cart-items-list" style="margin-bottom:20px;"></div>
                <div style="border-top:2px solid #eee;padding-top:16px;display:flex;justify-content:space-between;align-items:center;font-size:18px;font-weight:800;color:#0F172A;margin-bottom:20px;">
                    <span>Total:</span>
                    <span id="cart-modal-total">R0.00</span>
                </div>
                
                <div id="checkout-form-section" style="background:#F8FAFC;padding:20px;border-radius:12px;">
                    <h4 style="margin:0 0 12px;font-size:16px;color:#0F172A;">Complete Checkout & Pay Now</h4>
                    <p style="font-size:14px;color:#454F5E;margin-bottom:16px;">Enter your email to receive your secure iKhokha payment link and order confirmation.</p>
                    <div style="margin-bottom:16px;">
                        <label style="display:block;font-size:13px;font-weight:700;color:#0F172A;margin-bottom:6px;">Your Email Address *</label>
                        <input type="email" id="checkout-email" placeholder="name@example.com" style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:6px;font-size:15px;" required />
                    </div>
                    <button onclick="submitCheckout()" id="checkout-submit-btn" style="width:100%;background:#0E6563;color:#fff;border:none;padding:14px;border-radius:6px;font-weight:700;font-size:16px;cursor:pointer;">Proceed to Pay Now</button>
                </div>

                <div id="checkout-success-section" style="display:none;background:#EDF6EE;border:1px solid #178E79;padding:20px;border-radius:12px;text-align:center;">
                    <h4 style="color:#0E6563;margin-top:0;">Payment Request Ready!</h4>
                    <p id="checkout-success-msg" style="color:#0F172A;font-size:15px;margin-bottom:16px;"></p>
                    <div id="checkout-link-container" style="margin-bottom:16px;"></div>
                    <button onclick="clearCartAndClose()" style="background:#454F5E;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">Close & Reset</button>
                </div>
            </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  }

  // Global cart helpers
  window.cart = JSON.parse(localStorage.getItem('bhg_cart') || '[]');

  window.saveCart = function() {
      localStorage.setItem('bhg_cart', JSON.stringify(window.cart));
      window.updateCartUI();
  }

  window.getCartTotal = function() {
      return window.cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  }

  window.hasItem = function(id) {
      return window.cart.some(item => item.id === id);
  }

  window.validatePrerequisites = function(targetId) {
      if (targetId === 1) return true;
      if (targetId === 2 && !window.hasItem(1)) {
          alert('Prerequisite Notice: You must add and complete Step 1 (Virtual Business Consultation) before purchasing Step 2.');
          return false;
      }
      if (targetId === 3 && !window.hasItem(2)) {
          alert('Prerequisite Notice: You must add and complete Step 2 (Business Plan & Documentation) before proceeding to Step 3.');
          return false;
      }
      if (targetId >= 4 && targetId <= 6 && !window.hasItem(3)) {
          alert('Growth Tiers Locked: You must complete Step 3 (Business Systems & Documentation Support) before unlocking Growth Tiers (4 → 5 → 6).');
          return false;
      }
      return true;
  }

  window.addToCart = function(id, name, price, step, isTier) {
      if (!window.validatePrerequisites(id)) return;
      let existing = window.cart.find(item => item.id === id);
      if (existing) {
          existing.qty = (existing.qty || 1) + 1;
      } else {
          window.cart.push({ id, name, price, qty: 1, step, isTier });
      }
      window.saveCart();
      alert('Added "' + name + '" to your cart!');
      window.openCartModal();
  }

  window.removeFromCart = function(id) {
      window.cart = window.cart.filter(item => item.id !== id);
      if (!window.hasItem(1)) {
          window.cart = window.cart.filter(item => item.id === 1);
      } else if (!window.hasItem(2)) {
          window.cart = window.cart.filter(item => item.id <= 2);
      } else if (!window.hasItem(3)) {
          window.cart = window.cart.filter(item => item.id <= 3);
      }
      window.saveCart();
  }

  window.updateCartUI = function() {
      const totalQty = window.cart.reduce((sum, item) => sum + (item.qty || 1), 0);
      const totalPrice = window.getCartTotal();
      
      const fc = document.getElementById('floating-cart-count');
      const ft = document.getElementById('floating-cart-total');
      const mt = document.getElementById('cart-modal-total');
      const hc = document.getElementById('hero-cart-count');
      
      if (fc) fc.innerText = totalQty;
      if (ft) ft.innerText = 'R' + totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
      if (mt) mt.innerText = 'R' + totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
      if (hc) hc.innerText = totalQty;
      
      const step3Done = window.hasItem(3);
      const lockBanner = document.getElementById('tiers-lock-banner');
      if (lockBanner) {
          if (step3Done) {
              lockBanner.style.background = '#EDF6EE';
              lockBanner.style.borderColor = '#178E79';
              lockBanner.style.color = '#0E6563';
              lockBanner.innerHTML = '✨ Growth Tiers (Steps 4 → 5 → 6) are now UNLOCKED! You can select an ongoing advisory tier.';
              document.querySelectorAll('.tier-card').forEach(c => { c.style.opacity = '1'; c.style.pointerEvents = 'auto'; });
          } else {
              lockBanner.style.background = '#FEF3C7';
              lockBanner.style.borderColor = '#F59E0B';
              lockBanner.style.color = '#92400E';
              lockBanner.innerHTML = '🔒 Growth Tiers (Steps 4 → 5 → 6) are locked. Complete Step 3 to unlock ongoing monthly advisory.';
          }
      }

      const listEl = document.getElementById('cart-items-list');
      const formSec = document.getElementById('checkout-form-section');
      if (listEl) {
          let listHTML = '';
          if (window.cart.length === 0) {
              listHTML = '<p style="color:#64748b;text-align:center;padding:20px 0;">Your cart is currently empty.</p>';
              if (formSec) formSec.style.display = 'none';
          } else {
              if (formSec) formSec.style.display = 'block';
              window.cart.forEach(item => {
                  listHTML += `
                      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f1f5f9;">
                          <div>
                              <div style="font-weight:700;color:#0F172A;font-size:15px;">${item.name}</div>
                              <div style="font-size:13px;color:#64748b;">R${item.price.toLocaleString()} x ${item.qty || 1}</div>
                          </div>
                          <div style="display:flex;align-items:center;gap:12px;">
                              <span style="font-weight:800;color:#0E6563;">R${(item.price * (item.qty || 1)).toLocaleString()}</span>
                              <button onclick="removeFromCart(${item.id})" style="background:#fee2e2;color:#991b1b;border:none;width:28px;height:28px;border-radius:50%;cursor:pointer;font-weight:bold;">&times;</button>
                          </div>
                      </div>
                  `;
              });
          }
          listEl.innerHTML = listHTML;
      }
  }

  window.openCartModal = function() {
      buildGlobalCart();
      window.updateCartUI();
      const modal = document.getElementById('bhg-cart-modal');
      if (modal) modal.style.display = 'flex';
  }

  window.closeCartModal = function() {
      const modal = document.getElementById('bhg-cart-modal');
      if (modal) modal.style.display = 'none';
  }

  window.submitCheckout = async function() {
      const emailInput = document.getElementById('checkout-email').value.trim();
      if (!emailInput || !emailInput.includes('@')) {
          alert('Please enter a valid email address to receive your payment link and confirmation.');
          return;
      }
      if (window.cart.length === 0) {
          alert('Your cart is empty.');
          return;
      }

      const btn = document.getElementById('checkout-submit-btn');
      btn.innerText = 'Processing Order...';
      btn.disabled = true;

      const totalAmount = window.getCartTotal().toFixed(2);
      const apiBase = window.BHHG_API_BASE || 'https://brandonholdingsgroup-api-delta.vercel.app';

      const fd = new FormData();
      fd.append('form_id', 'services-checkout');
      fd.append('email', emailInput);
      fd.append('total', totalAmount);
      fd.append('cart_items', JSON.stringify(window.cart));

      try {
          const res = await fetch(apiBase + '/api/forminator', {
              method: 'POST',
              body: fd
          });
          const data = await res.json();
          
          const formSec = document.getElementById('checkout-form-section');
          if (formSec) formSec.style.display = 'none';
          const succSec = document.getElementById('checkout-success-section');
          if (succSec) succSec.style.display = 'block';

          let msg = 'Your order total is <strong>R ' + totalAmount + '</strong>. A confirmation email with your payment link has been sent to <strong>' + emailInput + '</strong>.';
          let linkHTML = '';

          if (data && data.data && data.data.payment && data.data.payment.link) {
              const link = data.data.payment.link;
              linkHTML = `
                  <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #cbd5e1;margin-bottom:16px;">
                      <p style="margin:0 0 10px;font-weight:700;color:#0F172A;">Direct Payment Link:</p>
                      <a href="${link}" target="_blank" style="display:inline-block;background:#0E6563;color:#fff;padding:12px 24px;border-radius:6px;font-weight:700;text-decoration:none;margin-bottom:8px;">Pay Now via iKhokha (R ${totalAmount})</a>
                      <div style="font-size:12px;color:#64748b;word-break:break-all;">${link}</div>
                  </div>
              `;
          } else if (data.data.payment && data.data.payment.error) {
              linkHTML = '<p style="color:#b5451f;">Payment link could not be created: ' + escHtml(data.data.payment.error) + '</p>';
          } else {
              linkHTML = '<p style="color:#d97706;">Payment gateway link is currently disabled or unconfigured in admin settings. Please contact support.</p>';
          }

          const sMsg = document.getElementById('checkout-success-msg');
          const lCont = document.getElementById('checkout-link-container');
          if (sMsg) sMsg.innerHTML = msg;
          if (lCont) lCont.innerHTML = linkHTML;

      } catch (e) {
          alert('Checkout error: ' + e.message);
          btn.innerText = 'Proceed to Pay Now';
          btn.disabled = false;
      }
  }

  window.clearCartAndClose = function() {
      window.cart = [];
      window.saveCart();
      window.closeCartModal();
      const formSec = document.getElementById('checkout-form-section');
      const succSec = document.getElementById('checkout-success-section');
      const btn = document.getElementById('checkout-submit-btn');
      if (formSec) formSec.style.display = 'block';
      if (succSec) succSec.style.display = 'none';
      if (btn) { btn.innerText = 'Proceed to Pay Now'; btn.disabled = false; }
  }

  if (typeof document !== 'undefined' && document.body) {
      buildGlobalCart();
      updateCartUI();
  }

})();


  