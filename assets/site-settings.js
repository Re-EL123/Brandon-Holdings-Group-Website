(function () {
  'use strict';

  var API_BASE =
    window.BHHG_API_BASE || 'https://brandonholdingsgroup-api-delta.vercel.app';
  var API = API_BASE + '/api';

  function beacon() {
    try {
      var payload = { page: location.pathname };
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

  function loadSettings() {
    fetch(API + '/settings')
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        if (d && d.contact) applyContact(d.contact);
      })
      .catch(function () { /* noop */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSettings);
  } else {
    loadSettings();
  }
  beacon();
})();
