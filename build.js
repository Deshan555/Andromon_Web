#!/usr/bin/env node
// Builds the homepage into website/dist. No dependencies.
//   node build.js            build
//   node build.js --serve    build, then serve dist at http://127.0.0.1:4173
// Settings are in site.config.json, the words in src/content.js.
'use strict';
const fs = require('fs');
const path = require('path');

const WEB = __dirname;
const ROOT = path.join(WEB, '..');
const DIST = path.join(WEB, 'dist');
const read = (p) => fs.readFileSync(p, 'utf8');

const site = JSON.parse(read(path.join(WEB, 'site.config.json')));
// SITE_URL wins; on Netlify's production deploys its own address (URL) replaces the placeholder.
const netlifyUrl = process.env.CONTEXT === 'production' ? process.env.URL : '';
site.url = (process.env.SITE_URL || (/\/\/example\.com/.test(site.url) && netlifyUrl) || site.url).replace(/\/+$/, '');
const base = new URL(site.url + '/').pathname; // "/" or "/sub/path/"
const abs = (p) => site.url + '/' + p;
const placeholder = /\/\/example\.com/.test(site.url);

// The newest release, as the desktop app's build records it.
// The repo keeps its own copy (release.json, refreshed by npm run sync) so hosts that build from
// this repository alone, like Netlify, have it too.
let release = null;
const latest = [path.join(WEB, 'release.json'), path.join(ROOT, 'pc/latest.json')].find((f) => fs.existsSync(f));
if (latest) release = JSON.parse(read(latest));

const imagesFile = path.join(WEB, 'static/img/images.json');
if (!fs.existsSync(imagesFile)) {
  console.error('Pictures are missing. Run:  npm run images');
  process.exit(1);
}
const images = JSON.parse(read(imagesFile));

// CSS: point the fonts at the site's base path and squeeze out the whitespace.
const css = read(path.join(WEB, 'src/style.css'))
  .replace(/url\(\/fonts\//g, `url(${base}fonts/`)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();

// The user guide: the copy in guide/ (npm run sync), or ../user-guide when that isn't there.
const guideSrc = [path.join(WEB, 'guide'), path.join(ROOT, 'user-guide')].find((d) => fs.existsSync(path.join(d, 'index.html'))) || path.join(WEB, 'guide');
const guide = !!site.includeGuide && fs.existsSync(path.join(guideSrc, 'index.html'));

const ctx = { site, content: require('./src/content')(site), release, css, base, abs, images, guide };
const { home, notFound, compare, androidPage } = require('./src/page');

// ---------- write ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
// static/assets holds the mascot's source PNGs; the site uses the WebP copies in static/img (npm run images).
const ASSETS = path.join(WEB, 'static', 'assets');
fs.cpSync(path.join(WEB, 'static'), DIST, { recursive: true, filter: (p) => !/images\.json$|\.DS_Store$/.test(p) && p !== ASSETS && !p.startsWith(ASSETS + path.sep) });

const homeHtml = home(ctx);
fs.writeFileSync(path.join(DIST, 'index.html'), homeHtml);
fs.writeFileSync(path.join(DIST, '404.html'), notFound(ctx));
const compareHtml = compare(ctx);
fs.mkdirSync(path.join(DIST, 'compare'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'compare/index.html'), compareHtml);
const androidHtml = androidPage(ctx);
fs.mkdirSync(path.join(DIST, 'android'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'android/index.html'), androidHtml);

// The user guide, copied in as /guide/ with a canonical address of its own.
if (guide) {
  const to = path.join(DIST, 'guide');
  fs.cpSync(guideSrc, to, { recursive: true, filter: (p) => !/build\.js$|\.DS_Store$/.test(p) });
  const file = path.join(to, 'index.html');
  fs.writeFileSync(file, read(file).replace('<link rel="icon"', `<link rel="canonical" href="${abs('guide/')}">\n<link rel="icon"`));
}

const today = new Date().toISOString().slice(0, 10);
const pages = [{ loc: abs(''), priority: '1.0' }, { loc: abs('android/'), priority: '0.9' }, { loc: abs('compare/'), priority: '0.8' }, ...(guide ? [{ loc: abs('guide/'), priority: '0.7' }] : [])];
fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map((p) => `  <url><loc>${p.loc}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`).join('\n') +
  `\n</urlset>\n`);

fs.writeFileSync(path.join(DIST, 'robots.txt'),
  placeholder
    ? '# The site address is still the placeholder: keep search engines out until it is set.\nUser-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`);

fs.writeFileSync(path.join(DIST, 'site.webmanifest'), JSON.stringify({
  name: site.name, short_name: site.name, description: site.description,
  start_url: base, display: 'browser', background_color: '#E9E9E6', theme_color: site.themeColor,
  icons: [192, 512].map((s) => ({ src: `${base}img/icon-${s}.png`, sizes: `${s}x${s}`, type: 'image/png' })),
}, null, 2) + '\n');

// Long caching for files that don't change (Netlify and Cloudflare Pages read this file).
// Pages are checked on every visit (the build changes them); fonts never change; pictures keep their
// names, so they are kept a week and refreshed in the background for a month after that. sw.js must
// always be fetched fresh, or a new deploy wouldn't reach people who visited before.
fs.writeFileSync(path.join(DIST, '_headers'), [
  '/fonts/*', '  Cache-Control: public, max-age=31536000, immutable',
  '/img/*', '  Cache-Control: public, max-age=604800, stale-while-revalidate=2592000',
  '/favicon.ico', '  Cache-Control: public, max-age=86400, stale-while-revalidate=604800',
  '/site.webmanifest', '  Cache-Control: public, max-age=86400',
  '/sw.js', '  Cache-Control: no-cache',
  '/*', '  X-Content-Type-Options: nosniff', '  Referrer-Policy: strict-origin-when-cross-origin',
].join('\n') + '\n');

// Offline cache (sw.js, registered by every page). Its version is a hash of the built site, so each
// deploy that changes anything starts a fresh cache and drops the old one.
{
  const hash = require('crypto').createHash('sha256');
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).forEach((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p); else if (e.name !== 'sw.js') hash.update(path.relative(DIST, p)).update(fs.readFileSync(p));
  });
  walk(DIST);
  const version = hash.digest('hex').slice(0, 12);
  const pages = ['', 'android/', 'compare/'].map((p) => base + p);
  const core = [...pages, base + 'fonts/poppins-400.woff2', base + 'fonts/poppins-500.woff2', base + 'fonts/poppins-600.woff2'];
  fs.writeFileSync(path.join(DIST, 'sw.js'), `// Andromon website offline cache, made by build.js. Version ${version}.
// Pages: from the network first, so a new deploy shows at once; the cached copy when offline or slow.
// Fonts and pictures: from the cache first, fetched once and kept. Everything else: the cached copy at
// once, refreshed in the background.
const CACHE = 'andromon-${version}';
const CORE = ${JSON.stringify(core)};
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('andromon-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const put = (req, res) => { if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(Promise.race([
      fetch(req).then((res) => put(req, res)),
      new Promise((ok) => setTimeout(ok, 3500)).then(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || Promise.reject(new Error('slow')))),
    ]).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('${base}'))));
    return;
  }
  if (/\\/(img|fonts)\\//.test(url.pathname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => put(req, res))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => { const net = fetch(req).then((res) => put(req, res)).catch(() => hit); return hit || net; }));
});
`);
}

// ---------- checks ----------
const problems = [];
function check(name, html) {
  const text = (re) => (html.match(re) || [])[1] || '';
  const title = text(/<title>([^<]*)<\/title>/).replace(/&amp;/g, '&');
  const desc = text(/<meta name="description" content="([^"]*)"/);
  if (title.length > 60) problems.push(`${name}: title is ${title.length} characters (keep it to 60 or fewer).`);
  if (desc.length > 160) problems.push(`${name}: description is ${desc.length} characters (keep it to 160 or fewer).`);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) problems.push(`${name}: the page must have exactly one <h1>.`);
  if (/<img(?![^>]*\balt=)[^>]*>/.test(html)) problems.push(`${name}: an <img> has no alt text.`);
  const idsSeen = new Set((html.match(/\sid="[^"]+"/g) || []).map((x) => x.slice(5, -1)));
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!idsSeen.has(m[1])) problems.push(`${name}: broken link #${m[1]}`);
  for (const m of html.matchAll(/(?:src|href)="([^"#]+\.(?:webp|png|ico|woff2|webmanifest))"/g)) {
    const rel = m[1].startsWith(base) ? m[1].slice(base.length) : m[1].replace(site.url + '/', '');
    if (!/^https?:/.test(rel) && !fs.existsSync(path.join(DIST, rel))) problems.push(`${name}: missing file ${m[1]}`);
  }
  return { title, desc };
}
const { title, desc } = check('index.html', homeHtml);
const cmp = check('compare/index.html', compareHtml);
const and = check('android/index.html', androidHtml);
if (!fs.existsSync(path.join(DIST, 'img/og.png'))) problems.push('img/og.png is missing (run: npm run images).');

const kb = (f) => (fs.statSync(path.join(DIST, f)).size / 1024).toFixed(1) + ' KB';
console.log(`Built dist/  index.html ${kb('index.html')}, title ${title.length} chars, description ${desc.length} chars`);
console.log(`            compare/index.html ${kb('compare/index.html')}, title ${cmp.title.length} chars, description ${cmp.desc.length} chars`);
console.log(`            android/index.html ${kb('android/index.html')}, title ${and.title.length} chars, description ${and.desc.length} chars`);
console.log(`Site address: ${site.url}${release ? `   Release: v${release.version}` : ''}${guide ? '   Guide: /guide/' : ''}`);
if (placeholder) console.warn('NOTE: "url" in site.config.json is still https://example.com. robots.txt blocks search engines until you set it.');
if (problems.length) {
  console.error('\nProblems:\n- ' + problems.join('\n- '));
  process.exit(1);
}

// ---------- preview ----------
if (process.argv.includes('--serve')) {
  const http = require('http');
  const types = { html: 'text/html; charset=utf-8', css: 'text/css', js: 'text/javascript', json: 'application/json', webmanifest: 'application/manifest+json', xml: 'application/xml', txt: 'text/plain', png: 'image/png', webp: 'image/webp', ico: 'image/x-icon', woff2: 'font/woff2' };
  const port = Number(process.env.PORT) || 4173;
  http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (base !== '/' && p.startsWith(base)) p = '/' + p.slice(base.length);
    let file = path.join(DIST, path.normalize(p));
    if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const ok = fs.existsSync(file);
    if (!ok) file = path.join(DIST, '404.html');
    res.writeHead(ok ? 200 : 404, { 'Content-Type': types[path.extname(file).slice(1)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}${base}`));
}
