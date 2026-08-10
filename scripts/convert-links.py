#!/usr/bin/env python3
import os, re, sys, shutil

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PAGE_ID_MAP = {
    '1463': 'index.html',
    '1464': 'business-operations/index.html',
    '1465': 'multimedia-marketing/index.html',
    '1468': 'contact/index.html',
    '2701': 'event-hiring/index.html',
    '3242': 'labour-law/index.html',
    '3539': 'gallery/index.html',
}

# pretty-URL aliases -> local file
ALIAS_MAP = {
    '/business-operations/': 'business-operations/index.html',
    '/business-operations': 'business-operations/index.html',
    '/multimedia-marketing/': 'multimedia-marketing/index.html',
    '/multimedia-marketing': 'multimedia-marketing/index.html',
    '/contact/': 'contact/index.html',
    '/contact': 'contact/index.html',
    '/gallery/': 'gallery/index.html',
    '/gallery': 'gallery/index.html',
    '/bookings/': 'event-hiring/index.html',
    '/bookings': 'event-hiring/index.html',
    '/event-hiring/': 'event-hiring/index.html',
    '/event-hiring': 'event-hiring/index.html',
    '/labour-law/': 'labour-law/index.html',
    '/labour-law': 'labour-law/index.html',
    '/all-listings/': 'index.html',
    '/all-listings': 'index.html',
    '/events-gallery/': 'index.html',
    '/events-gallery': 'index.html',
    '/client-projects/': 'index.html',
    '/client-projects': 'index.html',
}

def map_path(p):
    if p == '/':
        return 'index.html'
    if p in ALIAS_MAP:
        return ALIAS_MAP[p]
    if p.startswith('/?page_id='):
        pid = p.split('?page_id=')[1].split('&')[0]
        return PAGE_ID_MAP.get(pid)
    if p.startswith('/index.php?page_id='):
        pid = p.split('page_id=')[1].split('&')[0]
        return PAGE_ID_MAP.get(pid)
    low = p.lower()
    if (low.startswith('/wp-admin') or low.startswith('/wp-json')
            or low.startswith('/wp-login') or low.endswith('.php')
            or low.endswith('.xml') or low.endswith('.txt')):
        return None
    if '?' in p:
        base, query = p.split('?', 1)
        basepath = base.lstrip('/')
        if not basepath or basepath.endswith('.php') or '.' not in basepath.rsplit('/', 1)[-1]:
            return None
        query = query.replace('&#038;', '&')
        return basepath + '%3F' + query.replace('&', '%26')
    if p.endswith('/'):
        d = p.lstrip('/').rstrip('/')
        if os.path.isdir(os.path.join(BASE, d)):
            if os.path.isfile(os.path.join(BASE, d, 'index.html')):
                return d + '/index.html'
            return d + '/'
        return None
    path = p.lstrip('/')
    if path == '':
        return None
    if '.' not in path.rsplit('/', 1)[-1]:
        path = path + '/index.html'
    return path

URL_RE = re.compile(r'(?:https?:)?//brandonholdingsgroup\.com(/[^\s"\'<>()]*)')

def convert_file(fpath, from_dir):
    try:
        data = open(fpath, 'r', encoding='utf-8', errors='replace').read()
    except OSError:
        return 0
    changed = 0

    def repl(m):
        nonlocal changed
        p = m.group(1)
        local = map_path(p)
        if local is None:
            return m.group(0)
        target = os.path.abspath(os.path.join(BASE, local.rstrip('/')))
        rel = os.path.relpath(target, from_dir)
        if local.endswith('/'):
            rel += '/'
        changed += 1
        return rel

    new = URL_RE.sub(repl, data)
    if new != data:
        open(fpath, 'w', encoding='utf-8').write(new)
    return changed

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'

    if mode in ('reorg', 'all'):
        # 1) real pages -> clean folders
        for pid, dest in PAGE_ID_MAP.items():
            if pid == '1463':
                continue
            src = os.path.join(BASE, f'index.html?page_id={pid}')
            dst = os.path.join(BASE, dest)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if os.path.exists(src):
                shutil.copyfile(src, dst)
                print(f'copied {src} -> {dst}')

        # 2) remove transient/duplicate files
        keep = {'index.html'}
        for name in os.listdir(BASE):
            full = os.path.join(BASE, name)
            if not os.path.isfile(full):
                continue
            if name in keep:
                continue
            if '?' in name:
                os.remove(full)
                print('removed', name)
        # 3) remove duplicate home-content dirs
        for d in ('bookings', 'all-listings', 'events-gallery', 'client-projects'):
            full = os.path.join(BASE, d)
            if os.path.isdir(full):
                shutil.rmtree(full)
                print('removed dir', d)

    if mode in ('convert', 'all'):
        total = 0
        nfiles = 0
        for root, dirs, files in os.walk(BASE):
            if '.git' in root:
                continue
            for fn in files:
                if not (fn.endswith('.html') or fn.endswith('.css')):
                    continue
                fpath = os.path.join(root, fn)
                c = convert_file(fpath, root)
                if c:
                    nfiles += 1
                    total += c
        print(f'converted {total} links across {nfiles} files')

if __name__ == '__main__':
    main()
