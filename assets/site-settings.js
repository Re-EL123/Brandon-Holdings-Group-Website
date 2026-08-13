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
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';

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
      'event-hiring': 'Event Hiring',
      gallery: 'Gallery',
      contact: 'Contact',
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
     if (rows.length) {
       for (var i = 0; i < rows.length; i++) rows[i].style.display = ikho.enabled === false ? 'none' : '';
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
    '.bhg-fab-toggle{width:68px;height:68px;border:none;border-radius:50%;background:#0E6563;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 12px 26px rgba(0,0,0,.34);transition:transform .22s ease,box-shadow .22s ease;animation:bhg-fab-bob 3.2s ease-in-out infinite}' +
    '.bhg-fab-toggle:hover{box-shadow:0 18px 34px rgba(0,0,0,.46);transform:scale(1.08)}' +
    '.bhg-fab-toggle:focus-visible{outline:3px solid #fff;outline-offset:4px}' +
    '.bhg-fab-toggle svg{width:30px;height:30px;fill:#fff;transition:transform .25s ease}' +
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
})();
