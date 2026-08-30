(function () {
  'use strict';

  var API_BASE = (window.BHHG_API_BASE || 'https://brandonholdingsgroup-api-delta.vercel.app').replace(/\/+$/, '');
  var SITE_URL = 'https://brandonholdingsgroup.com';
  var DEFAULT_IMG = '../wp-content/uploads/2025/09/Brandon-Holdings-header-image-1-1.webp';

  var blogGrid = document.getElementById('blogGrid');
  var blogLoading = document.getElementById('blogLoading');
  var blogEmpty = document.getElementById('blogEmpty');
  var blogError = document.getElementById('blogError');
  var articleView = document.getElementById('articleView');
  var listing = document.getElementById('blogListing');
  var hero = document.getElementById('blogHero');
  var cachedArticles = [];
  var baseTitle = document.title;

  function fmtDate(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function show(el, on) {
    if (el) el.hidden = !on;
  }

  function hideAll() {
    show(blogLoading, false);
    show(blogGrid, false);
    show(blogEmpty, false);
    show(blogError, false);
  }

  function renderListing() {
    document.body.classList.remove('bhg-blog-article-open');
    if (hero) hero.hidden = false;
    if (listing) listing.hidden = false;
    if (articleView) articleView.hidden = true;
    document.title = baseTitle;
    var oldLD = document.getElementById('blog-jsonld');
    if (oldLD) oldLD.remove();
    hideAll();
    if (!cachedArticles.length) {
      show(blogEmpty, true);
      return;
    }
    blogGrid.innerHTML = '';
    cachedArticles.forEach(function (a) {
      var img = a.featured_image || DEFAULT_IMG;
      var date = fmtDate(a.published_at || a.created_at);
      var card = document.createElement('a');
      card.href = '#' + encodeURIComponent(a.slug);
      card.className = 'bhg-post-card';
      card.innerHTML =
        '<img class="bhg-post-card-img" src="' + escHtml(img) + '" alt="' + escHtml(a.title) + '" loading="lazy">' +
        '<div class="bhg-post-card-body">' +
          '<span class="bhg-post-cat">' + escHtml(a.category || 'General') + '</span>' +
          '<h3 class="bhg-post-title">' + escHtml(a.title) + '</h3>' +
          '<p class="bhg-post-excerpt">' + escHtml(a.excerpt || '') + '</p>' +
          '<div class="bhg-post-meta">' +
            '<span>' + escHtml(date) + '</span>' +
            '<span class="bhg-post-read">Read more</span>' +
          '</div>' +
        '</div>';
      blogGrid.appendChild(card);
    });
    show(blogGrid, true);
  }

  function renderArticle(article) {
    document.body.classList.add('bhg-blog-article-open');
    if (hero) hero.hidden = true;
    if (listing) listing.hidden = true;
    articleView.hidden = false;
    hideAll();

    var img = article.featured_image || DEFAULT_IMG;
    var date = fmtDate(article.published_at || article.created_at);
    var tags = (article.tags || []).filter(Boolean);
    document.title = (article.title || 'Article') + ' – Brandon Holdings';

    var ld = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.excerpt || '',
      image: img,
      datePublished: article.published_at || article.created_at,
      dateModified: article.updated_at || article.created_at,
      author: { '@type': 'Organization', name: article.author || 'Brandon Holdings' },
      publisher: {
        '@type': 'Organization',
        name: 'Brandon Holdings',
        logo: { '@type': 'ImageObject', url: SITE_URL + '/wp-content/uploads/2025/09/Screenshot__33_-removebg-preview.webp' }
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': SITE_URL + '/blog/#' + article.slug }
    };
    var oldLD = document.getElementById('blog-jsonld');
    if (oldLD) oldLD.remove();
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'blog-jsonld';
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);

    document.getElementById('articleImage').innerHTML =
      '<img class="bhg-article-img" src="' + escHtml(img) + '" alt="' + escHtml(article.title) + '">';
    document.getElementById('articleCat').textContent = article.category || 'General';
    document.getElementById('articleTitle').textContent = article.title || '';
    document.getElementById('articleMeta').innerHTML =
      '<span>' + escHtml(date) + '</span>' +
      '<span>By ' + escHtml(article.author || 'Brandon Holdings') + '</span>';
    document.getElementById('articleContent').innerHTML = article.content || '';
    document.getElementById('articleTags').innerHTML = tags.map(function (t) {
      return '<span class="bhg-article-tag">' + escHtml(t) + '</span>';
    }).join('');

    var shareUrl = encodeURIComponent(SITE_URL + '/blog/#' + article.slug);
    var shareTitle = encodeURIComponent(article.title || '');
    var fb = document.getElementById('shareFacebook');
    var li = document.getElementById('shareLinkedIn');
    var tw = document.getElementById('shareTwitter');
    if (fb) fb.href = 'https://www.facebook.com/sharer/sharer.php?u=' + shareUrl;
    if (li) li.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + shareUrl;
    if (tw) tw.href = 'https://twitter.com/intent/tweet?url=' + shareUrl + '&text=' + shareTitle;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fetchJson(url) {
    return fetch(url, { mode: 'cors', credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(function (r) {
        return r.json().catch(function () { return null; }).then(function (j) {
          return { ok: r.ok, status: r.status, j: j };
        });
      });
  }

  function handleRoute() {
    var hash = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    if (!hash) {
      renderListing();
      return;
    }
    document.body.classList.add('bhg-blog-article-open');
    var cached = cachedArticles.find(function (a) { return a.slug === hash; });
    if (cached && cached.content) {
      renderArticle(cached);
      return;
    }
    if (hero) hero.hidden = false;
    if (listing) listing.hidden = false;
    if (articleView) articleView.hidden = true;
    hideAll();
    show(blogLoading, true);
    fetchJson(API_BASE + '/api/blog?slug=' + encodeURIComponent(hash))
      .then(function (out) {
        show(blogLoading, false);
        var article = out && out.j && out.j.data;
        if (out && out.ok && article && article.slug) {
          renderArticle(article);
        } else {
          renderListing();
        }
      })
      .catch(function () {
        show(blogLoading, false);
        renderListing();
      });
  }

  function loadArticles() {
    hideAll();
    if (articleView) articleView.hidden = true;
    if (listing) listing.hidden = false;
    show(blogLoading, true);
    fetchJson(API_BASE + '/api/blog')
      .then(function (out) {
        show(blogLoading, false);
        var data = out && out.j && out.j.data;
        if (!out || !out.ok || !out.j || out.j.success === false || !Array.isArray(data)) {
          cachedArticles = [];
          hideAll();
          show(blogError, true);
          return;
        }
        cachedArticles = data;
        handleRoute();
      })
      .catch(function () {
        show(blogLoading, false);
        cachedArticles = [];
        hideAll();
        show(blogError, true);
      });
  }

  var back = document.getElementById('articleBack');
  if (back) {
    back.addEventListener('click', function (e) {
      e.preventDefault();
      if (location.hash) location.hash = '';
      else renderListing();
    });
  }
  var retry = document.getElementById('blogRetry');
  if (retry) retry.addEventListener('click', loadArticles);

  window.addEventListener('hashchange', handleRoute);
  loadArticles();
})();
