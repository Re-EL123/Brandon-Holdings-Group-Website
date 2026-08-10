'use strict';

const FORMS = {
  3180: {
    name: 'General enquiry',
    subject: 'New website enquiry',
    successMessage:
      '<p><strong>Thank you for contacting Brandon Holdings Group.</strong><br/>Your message has been received and we will be in touch shortly.</p>',
    fields: [
      { key: 'name-1', label: 'Name', required: true, email: false },
      { key: 'email-1', label: 'Email', required: true, email: true },
      { key: 'phone-1', label: 'Phone', required: false, email: false },
      { key: 'select-1[]', label: 'Interested in', required: false, email: false },
      { key: 'textarea-1', label: 'Describe your query', required: false, email: false },
    ],
  },
  3358: {
    name: 'Booking enquiry',
    subject: 'New booking enquiry',
    successMessage:
      '<p><strong>Thank you for your enquiry.</strong><br/>We have received your details and will get back to you soon.</p>',
    fields: [
      { key: 'name-1-first-name', label: 'First Name', required: true, email: false },
      { key: 'name-1-last-name', label: 'Last Name', required: true, email: false },
      { key: 'email-1', label: 'Email Address', required: true, email: true },
      { key: 'phone-1', label: 'Phone', required: false, email: false },
      { key: 'select-1', label: 'Service needed', required: false, email: false },
      { key: 'text-1', label: 'Company name', required: false, email: false },
      { key: 'url-1', label: 'Website', required: false, email: false },
      { key: 'address-1-city', label: 'City', required: false, email: false },
      { key: 'address-1-state', label: 'State / Province', required: false, email: false },
      { key: 'address-1-zip', label: 'ZIP / Postal code', required: false, email: false },
      { key: 'address-1-country', label: 'Country', required: false, email: false },
      { key: 'textarea-1', label: 'Tell us more about your services', required: false, email: false },
    ],
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function valueOf(params, key) {
  const v = params[key];
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null) return '';
  return String(v);
}

function isEmpty(v) {
  if (Array.isArray(v)) return v.length === 0 || v.every((x) => !String(x).trim());
  return String(v || '').trim() === '';
}

function addParam(out, key, value) {
  if (out[key] === undefined) out[key] = value;
  else if (Array.isArray(out[key])) out[key].push(value);
  else out[key] = [out[key], value];
}

function parseUrlEncoded(str) {
  const out = {};
  for (const pair of str.split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    const k = eq < 0 ? pair : pair.slice(0, eq);
    const raw = eq < 0 ? '' : pair.slice(eq + 1);
    let key, value;
    try {
      key = decodeURIComponent(k.replace(/\+/g, ' '));
      value = decodeURIComponent(raw.replace(/\+/g, ' '));
    } catch {
      continue;
    }
    addParam(out, key, value);
  }
  return out;
}

function parseMultipart(buf, boundary) {
  const out = {};
  const text = buf.toString('latin1');
  const parts = text.split('--' + boundary);
  for (const part of parts) {
    const m = part.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*(.*?))?\r?\n\r?\n([\s\S]*?)(?:\r?\n)?$/);
    if (!m) continue;
    const value = m[3].replace(/\r?\n$/, '');
    addParam(out, m[1], value);
  }
  return out;
}

function parseBody(body, contentType) {
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
    return body;
  }
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body || ''));
  const ct = String(contentType || '');
  if (ct.includes('multipart/form-data')) {
    const m = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    return m ? parseMultipart(buf, (m[1] || m[2]).trim()) : parseUrlEncoded(buf.toString('utf-8'));
  }
  return parseUrlEncoded(buf.toString('utf-8'));
}

function validate(cfg, params) {
  const errors = {};
  for (const f of cfg.fields) {
    const v = params[f.key];
    if (f.required && isEmpty(v)) {
      errors[f.key] = f.label + ' is required';
    } else if (f.email && !isEmpty(v)) {
      const flat = Array.isArray(v) ? v[0] : v;
      if (!EMAIL_RE.test(String(flat).trim())) {
        errors[f.key] = 'Please enter a valid email address';
      }
    }
  }
  return errors;
}

function extractValues(cfg, params) {
  const out = [];
  for (const f of cfg.fields) {
    const v = params[f.key];
    if (isEmpty(v)) continue;
    out.push({ label: f.label, value: Array.isArray(v) ? v.join(', ') : String(v).trim() });
  }
  return out;
}

function buildEmail(cfg, values, source) {
  const rows = values.map((r) => `<tr><td style="padding:6px 12px;vertical-align:top"><strong>${r.label}</strong></td><td style="padding:6px 12px">${escapeHtml(r.value)}</td></tr>`).join('');
  const text = values.map((r) => `${r.label}: ${r.value}`).join('\n');
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px">
    <h2 style="margin:0 0 16px">${cfg.subject}</h2>
    <table style="border-collapse:collapse;width:100%">${rows}</table>
    <p style="margin-top:16px;color:#888;font-size:12px">Submitted from ${source}</p>
  </div>`;
  return { text, html };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function sendEmail({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log('[forms] RESEND_API_KEY not set — email NOT sent. Submission:', JSON.stringify({ to, subject, text }));
    return { sent: false };
  }
  const from = process.env.FORM_FROM_EMAIL || 'Brandon Holdings Group <onboarding@resend.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error('Resend ' + res.status + ' ' + detail);
  }
  return { sent: true };
}

async function storeSubmission(record) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  try {
    await fetch(url + '/lpush/submissions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: JSON.stringify(record),
    });
  } catch (e) {
    console.error('[forms] KV store failed', e.message);
  }
}

function respondJSON(res, payload) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function forminatorResponse(success, message, errors) {
  let errorList = errors;
  if (!Array.isArray(errorList)) {
    errorList = Object.keys(errorList || {}).map((k) => ({ [k]: errorList[k] }));
  }
  return {
    success,
    message,
    data: {
      success,
      errors: errorList,
      entry_id: 'selfhost-' + Math.random().toString(36).slice(2, 10),
      resetEnabled: false,
      ...(success ? { behav: 'behaviour-hide', fadeout: false, fadeout_time: 0 } : {}),
    },
  };
}

async function handleForminator(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Method not allowed', data: { success: false, errors: [] } }));
    return;
  }
  let body;
  try {
    body = await getBody(req);
  } catch (e) {
    res.statusCode = e.status || 400;
    res.end(JSON.stringify({ success: false, message: 'Request too large', data: { success: false, errors: [] } }));
    return;
  }
  const params = parseBody(body, req.headers['content-type']);

  const formId = String(valueOf(params, 'form_id'));
  const cfg = FORMS[formId] || FORMS[3180];

  const errors = validate(cfg, params);
  if (Object.keys(errors).length) {
    respondJSON(res, forminatorResponse(false, 'Please correct the highlighted fields.', errors));
    return;
  }

  const values = extractValues(cfg, params);
  const source = valueOf(params, 'current_url') || valueOf(params, 'page_id') || 'unknown';
  const to = process.env.FORM_TO_EMAIL || '';
  try {
    if (to) {
      const mail = buildEmail(cfg, values, 'forminator/' + formId + ' (' + source + ')');
      await sendEmail({ to, subject: cfg.subject, html: mail.html, text: mail.text });
    } else {
      console.log('[forms] FORM_TO_EMAIL not set — logging submission for form ' + formId);
    }
    await storeSubmission({ form: formId, type: 'forminator', source, ts: new Date().toISOString(), values });
  } catch (e) {
    console.error('[forms] delivery failed', e);
  }

  respondJSON(res, forminatorResponse(true, cfg.successMessage, []));
}

function wpformsConfirmation() {
  return (
    '<div class="wpforms-confirmation-container-full wpforms-confirmation-scroll">' +
    '<div style="text-align:center;padding:6px">' +
    '<p style="font-size:16px;font-weight:700;margin:0 0 4px">Thanks for reaching out.</p>' +
    '<p style="margin:0">Your message has been sent and we will be in touch shortly.</p>' +
    '</div></div>'
  );
}

function wpformsErrorResponse(errors) {
  return {
    success: false,
    data: {
      errors: {
        general: { header: 'Please correct the errors below and re-submit the form.' },
        field: errors,
      },
    },
  };
}

async function handleContact(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }
  let body;
  try {
    body = await getBody(req);
  } catch (e) {
    res.statusCode = e.status || 400;
    res.end('Request too large');
    return;
  }
  const params = parseBody(body, req.headers['content-type']);
  const action = valueOf(params, 'action');

  if (action === 'wpforms_get_token') {
    respondJSON(res, { success: true, data: { token: 'selfhost-' + Math.random().toString(36).slice(2, 12) } });
    return;
  }

  const name = valueOf(params, 'wpforms[fields][0]');
  const email = valueOf(params, 'wpforms[fields][1]');
  const message = valueOf(params, 'wpforms[fields][2]');
  const honeypot = valueOf(params, 'wpforms[hp]');

  const wantsJSON = action === 'wpforms_submit' || /application\/json/.test(req.headers.accept || '') || (req.headers['x-requested-with'] || '').toLowerCase() === 'fetch';

  const errors = {};
  if (honeypot) {
    if (action === 'wpforms_submit') {
      respondJSON(res, { success: true, data: { confirmation: wpformsConfirmation() } });
    } else {
      respondJSON(res, { success: true, message: 'Thanks, we will be in touch.' });
    }
    return;
  }
  if (!name.trim()) errors['wpforms[fields][0]'] = 'Your name is required.';
  if (!email.trim()) errors['wpforms[fields][1]'] = 'Your email is required.';
  else if (!EMAIL_RE.test(email.trim())) errors['wpforms[fields][1]'] = 'Please enter a valid email address.';

  if (Object.keys(errors).length) {
    if (action === 'wpforms_submit') {
      respondJSON(res, wpformsErrorResponse(errors));
    } else if (wantsJSON) {
      respondJSON(res, { success: false, message: 'Please correct the highlighted fields.', errors });
    } else {
      res.statusCode = 422;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(renderContactPage('There was a problem with your submission.', errors['wpforms[fields][0]'] || errors['wpforms[fields][1]']));
    }
    return;
  }

  const values = [
    { label: 'Name', value: name.trim() },
    { label: 'Email', value: email.trim() },
    ...(message.trim() ? [{ label: 'Message', value: message.trim() }] : []),
  ];
  const to = process.env.FORM_TO_EMAIL || '';
  try {
    if (to) {
      const mail = buildEmail({ subject: 'New contact form message', name: 'Contact form' }, values, 'wpforms/153');
      await sendEmail({ to, subject: 'New contact form message', html: mail.html, text: mail.text });
    } else {
      console.log('[forms] FORM_TO_EMAIL not set — logging contact submission:', JSON.stringify(values));
    }
    await storeSubmission({ form: 'wpforms-153', type: 'contact', ts: new Date().toISOString(), values });
  } catch (e) {
    console.error('[forms] delivery failed', e);
  }

  if (action === 'wpforms_submit') {
    respondJSON(res, { success: true, data: { confirmation: wpformsConfirmation() } });
  } else if (wantsJSON) {
    respondJSON(res, { success: true, message: 'Thanks, we will be in touch.' });
  } else {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(renderContactPage(null));
  }
}

function handleNoop(req, res) {
  res.statusCode = 500;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('noop');
}

function renderContactPage(error, errorDetail) {
  const msg = error
    ? `<p style="color:#c0392b;font-weight:700">${error}${errorDetail ? ' ' + errorDetail : ''}</p>`
    : '<p style="color:#2e7d32;font-weight:700">Your message has been sent. Thanks for contacting Brandon Holdings Group &mdash; we will be in touch shortly.</p>';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Contact Brandon Holdings Group</title>
<style>body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0b0f1a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{max-width:560px;text-align:center;padding:48px 32px;background:#141a2e;border-radius:12px}h1{font-size:28px;margin:0 0 12px}p{font-size:17px;line-height:1.6;color:#cfd6e8}a{display:inline-block;margin-top:24px;color:#fff;background:#d7a14a;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700}</style>
</head><body><div class="card"><h1>Brandon Holdings Group</h1>${msg}<a href="/">Back to home</a></div></body></html>`;
}

async function getBody(req) {
  if (req.body !== undefined && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) {
      const e = new Error('body too large');
      e.status = 413;
      throw e;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = { handleForminator, handleContact, handleNoop, parseBody, FORMS, sendEmail, storeSubmission };
