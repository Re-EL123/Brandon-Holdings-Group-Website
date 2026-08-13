(function () {
  'use strict';

  var API_BASE =
    window.BHHG_API_BASE || 'https://brandonholdingsgroup-api-delta.vercel.app';
  var API = API_BASE + '/api';

  var DEFAULTS = {
    phone: '071 8641026',
    whatsapp: 'https://wa.me/+27662108306',
  };

  var WA_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  var PHONE_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';

  var CLOCK_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>';

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

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

  function injectStyle(css) {
    var st = document.createElement('style');
    st.setAttribute('data-bhg', 'ui');
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
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

  function buildCTAs() {
    var body = document.body;
    if (!body) return;

    var wa = document.createElement('a');
    wa.className = 'bhg-wa-float';
    wa.href = waLink(DEFAULTS.whatsapp);
    wa.setAttribute('target', '_blank');
    wa.setAttribute('rel', 'noopener');
    wa.setAttribute('aria-label', 'Chat on WhatsApp');
    wa.innerHTML = WA_ICON;
    body.appendChild(wa);

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
    if (!wa) return;
    var link = wa + (wa.indexOf('?') < 0 ? '?' : '&') + 'text=' + waMsg();
    var call = document.querySelector('.bhg-cta-call');
    if (call && tel) call.setAttribute('href', tel);
    var f = document.querySelector('.bhg-wa-float');
    if (f) f.setAttribute('href', link);
    var b = document.querySelector('.bhg-cta-wa');
    if (b) b.setAttribute('href', link);
  }

  function addResponseBadge() {
    var form = document.getElementById('wpforms-form-153');
    if (!form) return;
    var holder = form.parentNode;
    if (!holder) return;
    var b = document.createElement('div');
    b.className = 'bhg-rbadge';
    b.innerHTML = CLOCK_ICON + '<span>We typically respond within a few business hours</span>';
    if (holder.parentNode) holder.parentNode.insertBefore(b, holder);
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

  function lazyLoadImages() {
    var pre = {};
    var links = document.querySelectorAll('link[rel="preload"][as="image"]');
    for (var i = 0; i < links.length; i++) {
      var u = links[i].href;
      if (u) pre[u] = true;
    }
    var imgs = document.querySelectorAll('img');
    for (var j = 0; j < imgs.length; j++) {
      var im = imgs[j];
      if (im.getAttribute('loading')) continue;
      if (im.getAttribute('fetchpriority') === 'high') continue;
      var src = im.currentSrc || im.src;
      if (src && pre[src]) continue;
      im.setAttribute('loading', 'lazy');
    }
  }

  function carouselFix() {
    if (!document.querySelector('.swiper-wrapper')) return;
    injectStyle(
      '.elementor-main-swiper .swiper-wrapper,' +
      '.elementor-image-carousel-wrapper .swiper-wrapper{' +
      'display:grid!important;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;' +
      'width:100%!important;height:auto!important;transform:none!important;margin:0!important}' +
      '.elementor-main-swiper .swiper-wrapper{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}' +
      '.elementor-main-swiper .swiper-slide,' +
      '.elementor-image-carousel-wrapper .swiper-slide{width:auto!important;margin:0!important}' +
      '.elementor-image-carousel-wrapper .swiper-slide-inner,' +
      '.elementor-main-swiper .swiper-slide-inner{display:flex!important;align-items:center;justify-content:center;height:100%!important}' +
      '.elementor-swiper-button,.elementor-main-swiper .swiper-pagination{display:none!important}'
    );
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
      })
      .catch(function () { /* noop */ });
  }

  injectStyle(
    ':focus{outline:none}:focus-visible{outline:3px solid #3dbdb6;outline-offset:2px}' +
    '.bhg-wa-float{position:fixed;right:22px;bottom:22px;z-index:99990;width:58px;height:58px;border-radius:50%;' +
    'background:#25d366;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,.28);' +
    'transition:transform .2s ease,box-shadow .2s ease}' +
    '.bhg-wa-float:hover{transform:scale(1.07)}' +
    '.bhg-wa-float svg{width:30px;height:30px;fill:#fff}' +
    '.bhg-mobile-cta{position:fixed;left:0;right:0;bottom:0;z-index:99990;display:none}' +
    '.bhg-mobile-cta .bhg-cta{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;' +
    'padding:13px 10px;font:600 15px/1 Arial,Helvetica,sans-serif;color:#fff;text-decoration:none;letter-spacing:.02em}' +
    '.bhg-mobile-cta .bhg-cta svg{width:20px;height:20px;fill:#fff;flex:none}' +
    '.bhg-mobile-cta .bhg-cta-call{background:#0E6563}' +
    '.bhg-mobile-cta .bhg-cta-wa{background:#25d366}' +
    '@media(max-width:767px){.bhg-wa-float{display:none}.bhg-mobile-cta{display:flex}body{padding-bottom:58px!important}}' +
    '.bhg-geo{margin:16px auto 0;padding:0 20px;font:14px/1.5 Arial,Helvetica,sans-serif;color:#8b96b4;text-align:center}' +
    '.bhg-rbadge{display:inline-flex;align-items:center;gap:8px;margin:0 0 16px;padding:8px 14px;' +
    'background:#eef6f4;border:1px solid #cfe3de;border-radius:999px;' +
    'font:600 13px/1.2 Arial,Helvetica,sans-serif;color:#0E6563}' +
    '.bhg-rbadge svg{width:15px;height:15px;fill:#0E6563;flex:none}'
  );

  onReady(function () {
    carouselFix();
    lazyLoadImages();
    buildCTAs();
    addResponseBadge();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSettings);
  } else {
    loadSettings();
  }
  beacon();
})();
