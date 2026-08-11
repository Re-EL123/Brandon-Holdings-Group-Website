# Brandon Holdings — Static Site Clone

A self-contained, static HTML/CSS/JS duplicate of
**[brandonholdingsgroup.com](https://brandonholdingsgroup.com/)**.

The live site is a WordPress build (Astra theme + Elementor page builder).
This repository is a mirror of that site as served to browsers — the same
HTML, CSS, and JavaScript — with all internal links rewritten to work
locally. No PHP, database, or WordPress runtime is required.

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| Business Operations | `business-operations/index.html` |
| Multimedia Marketing | `multimedia-marketing/index.html` |
| Contact | `contact/index.html` |
| Event Hiring | `event-hiring/index.html` |
| Labour Law | `labour-law/index.html` |
| Gallery | `gallery/index.html` |

The full theme/plugin asset tree (Elementor, Royal Addons, Swiper,
Forminator, LatePoint, jQuery, Directorist) and all uploaded images and
self-hosted fonts live under `wp-content/` and `wp-includes/`. Runtime
requests to the live site, WordPress.com, and the WordPress plugin CDNs
have been removed — everything needed to render the site ships with the
repo.

## Forms

The contact form (Forminator `3180`), the event-hiring booking form
(Forminator `3358`), and the WPForms contact form (`153`) post to local
`/api/*` endpoints handled by the
**[brandonholdingsgroup-api](https://github.com/Re-EL123/brandonholdingsgroup-api)**
repository (private). Deploy that project alongside this one to accept and
email submissions. Unused WordPress config AJAX calls are neutralised by
`/api/noop`.

## Running locally

Serve the directory over HTTP (required for Elementor's animations and
sliders to initialise):

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

To test the forms end-to-end, clone and run the API repo instead — its
zero-dependency server serves both this site and the `/api/*` endpoints
from one process:

```bash
SITE_ROOT=/path/to/this/repo node scripts/selfhost.js
```

Then open <http://localhost:8080>.

## Site settings &amp; stats

`assets/site-settings.js` (injected into all pages) posts a pageview beacon
to `/api/stats` and pulls `GET /api/settings` to override the footer
"Get In Touch" widget, the contact-page info section, and the social icon
links. The recipient/sender emails and all contact details can therefore be
changed remotely from the
[admin UI](https://github.com/Re-EL123/brandonholdingsgroup-admin) instead of
editing these files.

## Deploying on Vercel

Deploy as a static project. `vercel.json` rewrites `/api/(.*)` to the API
deployment (keeps the site's relative `/api/*` calls working on the same
domain):

1. Set an `API_URL` environment variable (Production) on this project to the
   API deployment, e.g. `https://brandonholdings-api.vercel.app`:

   ```bash
   vercel env add API_URL production
   ```

2. Deploy:

   ```bash
   vercel --prod
   ```

The API, site, and admin UI can be deployed together with
`scripts/deploy.sh` from the API repo.

## Known limitations

- **Forms**: submissions are handled by the API repo and delivered by email
  when `RESEND_API_KEY` / `FORM_TO_EMAIL` are configured; otherwise they are
  logged to the server console.
- **Google Maps**: the embedded map on the contact page loads from Google
  Maps with the site's own API key (a third-party widget, not WordPress).
- **WordPress aliases**: on the live site several URLs (e.g.
  `/business-operations/`) actually render the home page. Here every
  menu item points to its real page instead.

## Updating the clone

Re-mirror the live site with `wget`, then run the link-conversion script
in `scripts/` if you want to refresh the content.
