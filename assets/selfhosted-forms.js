(function () {
  'use strict';

  var API_BASE =
    window.BHHG_API_BASE || 'https://brandonholdingsgroup-api-delta.vercel.app';
  var API = API_BASE + '/api';

  var LIVE = 'https://brandonholdingsgroup.com/wp-admin/admin-ajax.php';
  var ESCAPED_LIVE = 'https:\\/\\/brandonholdingsgroup.com\\/wp-admin\\/admin-ajax.php';

  function patchObject(obj, depth) {
    if (!obj || depth > 10) return;
    for (var key in obj) {
      var v;
      try {
        v = obj[key];
      } catch (e) {
        continue;
      }
      if (typeof v === 'string') {
        if (v === LIVE || v === ESCAPED_LIVE || v === '/api/noop') {
          obj[key] = API + '/noop';
        }
      } else if (v && typeof v === 'object') {
        patchObject(v, depth + 1);
      }
    }
  }

  function applyConfigPatches() {
    try {
      if (window.wpforms_settings) window.wpforms_settings.ajaxurl = API + '/contact';
    } catch (e) {}
    try {
      if (window.ForminatorFront) window.ForminatorFront.ajaxUrl = API + '/forminator';
    } catch (e) {}
    ['directorist', 'latepoint_helper', 'localize', 'WprConfig', 'ElementorProFrontendConfig'].forEach(function (name) {
      try {
        if (window[name]) patchObject(window[name], 0);
      } catch (e) {}
    });
  }

  applyConfigPatches();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyConfigPatches);
  }
  window.addEventListener('load', applyConfigPatches);

  var WPFORMS_ID = 'wpforms-form-153';
  var form = document.getElementById(WPFORMS_ID);
  if (!form) return;

  var banner = document.createElement('div');
  banner.className = 'wpforms-confirmation-container-full';
  banner.setAttribute('role', 'status');
  banner.style.cssText =
    'display:none;text-align:center;padding:28px 20px;margin-top:24px;background:#f4f7fb;border:1px solid #dce3ee;border-radius:8px;';
  banner.innerHTML =
    '<div style="font-size:30px;color:#2e7d32;line-height:1">&#10003;</div>' +
    '<p style="margin:10px 0 0;font-weight:700;color:#0b0f1a;font-size:17px">Thanks for reaching out.</p>' +
    '<p style="margin:6px 0 0;color:#556;font-size:15px">Your message has been sent and we will be in touch shortly.</p>';
  form.parentNode.insertBefore(banner, form);

  document.addEventListener(
    'submit',
    function (e) {
      var target = e.target;
      if (!target || target.id !== WPFORMS_ID) return;
      if (!target.checkValidity()) {
        target.reportValidity();
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      var btn = target.querySelector('button[type="submit"], input[type="submit"]');
      if (btn) btn.disabled = true;

      var body = new URLSearchParams(new FormData(target).entries()).toString();

      fetch(API + '/contact', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: body,
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          if (btn) btn.disabled = false;
          if (data && data.success) {
            target.style.display = 'none';
            banner.style.display = 'block';
            try {
              window.scrollTo({ top: banner.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
            } catch (err) { /* noop */ }
          } else {
            var msg = (data && data.message) || 'Sorry, something went wrong. Please try again.';
            var existing = target.querySelector('.wpforms-selfhost-error');
            if (existing) existing.remove();
            var err = document.createElement('div');
            err.className = 'wpforms-selfhost-error';
            err.setAttribute('role', 'alert');
            err.style.cssText =
              'margin:0 0 18px;padding:14px 16px;background:#fdf3f3;border:1px solid #f2cccc;border-radius:6px;color:#b5451f;font-size:15px;';
            err.textContent = msg;
            target.insertBefore(err, target.firstChild);
          }
        })
        .catch(function () {
          if (btn) btn.disabled = false;
          target.submit();
        });
    },
    true
  );
})();
