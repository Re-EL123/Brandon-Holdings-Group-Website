# Brandon Holdings — Static Site Clone

A self-contained, static HTML/CSS/JS duplicate of
**[brandonholdingsgroup.com](https://brandonholdingsgroup.com/)**.

The live site is a WordPress build (Astra theme + Elementor page builder).
This repository is a mirror of that site as served to browsers — the same
HTML, CSS, and JavaScript — with all internal links rewritten to work
locally. No PHP or database required.

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
Forminator, LatePoint, jQuery, Directorist) and all uploaded images live
under `wp-content/` and `wp-includes/`.

## Running locally

Serve the directory over HTTP (required for Elementor's animations and
sliders to initialise):

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

You can also open `index.html` directly from the file system, but some
animations and interactions work best when served over HTTP.

## Known limitations

- **Forms**: the contact form (Forminator) and booking form (LatePoint)
  submit to the live site's backend (`admin-ajax.php`). They keep working
  as long as the live site is online, but there is no local backend.
- **Fonts**: web fonts are loaded from WordPress.com's `fonts-api.wp.com`
  CDN, so a network connection is needed for the correct typefaces.
- **WordPress aliases**: on the live site several URLs (e.g.
  `/business-operations/`) actually render the home page. Here every
  menu item points to its real page instead.
- Dynamic features that depend on the WordPress server (listings,
  reviews, submissions) will not persist locally.

## Updating the clone

Re-mirror the live site with `wget`, then run the link-conversion script
in `scripts/` if you want to refresh the content.
