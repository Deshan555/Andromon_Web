// Renders the homepage and the 404 page as HTML strings.
'use strict';
const icon = require('./icons');

// Light / dark: the header's switch. The choice is kept in localStorage ("theme"), shared by the
// homepage and the guide; picking what the computer already uses forgets it, so the page follows the
// computer again.
const THEME_HEAD = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;
// The first visit of a browser session opens on a short splash (the logo and a bar that fills as the
// page loads). Decided before anything is drawn, so a later page view never flashes it.
const SPLASH_HEAD = `(function(){try{if(!sessionStorage.getItem('splash'))document.documentElement.classList.add('splashing')}catch(e){}})();`;
// Runs right after the splash in <body>: fills the bar as the page's first pictures and fonts arrive,
// fades the splash out once the page has loaded (at least 0.6 s, at most 4 s), marks pictures that are
// still loading so they show a shimmering skeleton, and registers the offline cache (sw.js).
const SITE_SCRIPT = (base) => `(function(){
var d=document,r=d.documentElement,t0=Date.now(),done=false;
function finish(){if(done)return;done=true;try{sessionStorage.setItem('splash','1')}catch(e){}
var wait=Math.max(0,600-(Date.now()-t0));setTimeout(function(){var s=d.querySelector('.splash');if(s)s.style.setProperty('--p','1');r.classList.add('splash-out');setTimeout(function(){r.classList.remove('splashing','splash-out')},450)},wait)}
if(r.classList.contains('splashing')){
  var bar=function(p){var s=d.querySelector('.splash');if(s)s.style.setProperty('--p',String(p))};bar(.15);
  d.addEventListener('DOMContentLoaded',function(){bar(.5);var im=[].filter.call(d.images,function(i){return i.loading!=='lazy'}),n=im.length,k=0;
    im.forEach(function(i){if(i.complete)k++;else i.addEventListener('load',step),i.addEventListener('error',step)});function step(){k++;bar(.5+.45*k/Math.max(n,1))}bar(.5+.45*k/Math.max(n,1))});
  addEventListener('load',finish);setTimeout(finish,4000);
}
d.addEventListener('DOMContentLoaded',function(){[].forEach.call(d.querySelectorAll('main img:not(.mascot)'),function(i){if(i.complete&&i.naturalWidth)return;i.classList.add('sk');var off=function(){i.classList.remove('sk')};i.addEventListener('load',off);i.addEventListener('error',off)})});
// Offline cache (sw.js). A hard refresh (Shift+reload, Ctrl+F5) skips the service worker, so the page has no
// controller although one is installed: then every saved copy is deleted and the cache is set up again from
// the live site. Any reload also asks for a newer sw.js at once.
if('serviceWorker' in navigator&&location.protocol==='https:')addEventListener('load',function(){
  var sw=navigator.serviceWorker,nav=(performance.getEntriesByType&&performance.getEntriesByType('navigation')[0])||{},reload=nav.type==='reload';
  sw.getRegistration().then(function(reg){
    if(!reg||sw.controller||!reload)return;
    return Promise.all([reg.unregister(),caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('andromon-')===0}).map(function(k){return caches.delete(k)}))})]);
  }).catch(function(){}).then(function(){return sw.register('${base}sw.js')}).then(function(r){if(reload&&r)r.update()}).catch(function(){})});
})();`;
const THEME_SCRIPT = `(function(){
var root=document.documentElement,btn=document.querySelector('.theme-toggle');if(!btn)return;
var sys=matchMedia('(prefers-color-scheme: dark)');
function now(){return root.getAttribute('data-theme')||(sys.matches?'dark':'light')}
function paint(){var dark=now()==='dark';btn.setAttribute('aria-pressed',String(dark));var l=dark?'Switch to light mode':'Switch to dark mode';btn.setAttribute('aria-label',l);btn.title=l;
  document.querySelectorAll('meta[name=theme-color]').forEach(function(m){m.setAttribute('content',dark?'#151617':'#E9E9E6')});}
function set(t){if(t===(sys.matches?'dark':'light')){root.removeAttribute('data-theme');try{localStorage.removeItem('theme')}catch(e){}}
  else{root.setAttribute('data-theme',t);try{localStorage.setItem('theme',t)}catch(e){}}paint();}
btn.addEventListener('click',function(){
  var next=now()==='dark'?'light':'dark';
  if(!document.startViewTransition||matchMedia('(prefers-reduced-motion: reduce)').matches){set(next);return;}
  var r=btn.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,end=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  document.startViewTransition(function(){set(next)}).ready.then(function(){
    root.animate({clipPath:['circle(0px at '+x+'px '+y+'px)','circle('+end+'px at '+x+'px '+y+'px)']},{duration:650,easing:'cubic-bezier(.22,1,.36,1)',pseudoElement:'::view-transition-new(root)'});
  });
});
sys.addEventListener('change',paint);
addEventListener('storage',function(e){if(e.key==='theme'){if(e.newValue)root.setAttribute('data-theme',e.newValue);else root.removeAttribute('data-theme');paint();}});
paint();
})();`;
const THEME_BUTTON = `<button class="theme-toggle" type="button" aria-label="Switch between light and dark mode"><svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg><svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mb = (bytes) => Math.round(bytes / 1e6) + ' MB';
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// ctx: { site, content, release, css, base, abs(path), images, guide }
// Visit counts (GoatCounter, "goatcounter" in site.config.json): no cookies, nothing personal stored, so no
// consent banner. Left out of Netlify preview deploys; count.js itself ignores localhost. Clicks on a
// release file (the download buttons) are counted as events named download/<file>, so the dashboard
// shows which files people take and from which countries.
const DL_EVENTS = `document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href*="/releases/download/"]');if(!a)return;var f=decodeURIComponent(a.href.split('/').pop().split('?')[0]),gc=window.goatcounter;if(gc&&gc.count)gc.count({path:'download/'+f,title:'Download '+f,event:true})});`;
const analytics = (ctx) => ctx.analytics
  ? `<script data-goatcounter="${esc(ctx.analytics)}" async src="https://gc.zgo.at/count.js"></script>\n<script>${DL_EVENTS}</script>\n` : '';

function head(ctx, { title, description, canonical, index = true, extra = '', og = 'og.png', ogAlt = '', track = true }) {
  const { site, base, abs } = ctx;
  const seo = site.seo || {};
  const verify = [
    seo.googleSiteVerification && `<meta name="google-site-verification" content="${esc(seo.googleSiteVerification)}">`,
    seo.bingSiteVerification && `<meta name="msvalidate.01" content="${esc(seo.bingSiteVerification)}">`,
  ].filter(Boolean).map((m) => m + '\n').join('');
  const handle = seo.twitter ? '@' + String(seo.twitter).replace(/^@/, '') : '';
  return `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<script>${THEME_HEAD}${SPLASH_HEAD}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${index ? `<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">` : '<meta name="robots" content="noindex">'}
<meta name="theme-color" content="#E9E9E6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#151617" media="(prefers-color-scheme: dark)">
<meta name="application-name" content="${esc(site.name)}">
${verify}
<link rel="icon" href="${base}favicon.ico" sizes="32x32">
<link rel="icon" href="${base}img/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="${base}img/apple-touch-icon.png">
<link rel="manifest" href="${base}site.webmanifest">
<link rel="preload" href="${base}fonts/poppins-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${base}fonts/poppins-600.woff2" as="font" type="font/woff2" crossorigin>
${extra}<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="${site.locale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${abs('img/' + og)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(ogAlt || site.name + ': ' + site.tagline)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${abs('img/' + og)}">
${handle ? `<meta name="twitter:site" content="${esc(handle)}">\n` : ''}
<style>${ctx.css}</style>
${track ? analytics(ctx) : ''}`;
}

// The logo with the name in it (static/assets/logo.png, made into WebP by npm run images).
function wordmark(ctx, px, lazy) {
  const im = ctx.images.wordmark;
  if (!im) throw new Error('Missing image: wordmark (run: npm run images)');
  const last = im.variants[im.variants.length - 1];
  return `<img class="wordmark" src="${ctx.base}img/${last.file}" srcset="${im.variants.map((v) => `${ctx.base}img/${v.file} ${v.w}w`).join(', ')}" sizes="${px}px" width="${last.w}" height="${last.h}" alt="${esc(ctx.site.name)}"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
}

function header(ctx, home) {
  const { site, base } = ctx;
  const h = home ? '' : base;
  const wm = ctx.images.wordmark.variants.find((v) => v.w === 320) || ctx.images.wordmark.variants[0];
  return `<div class="splash" aria-hidden="true"><img src="${base}img/${wm.file}" width="${wm.w}" height="${wm.h}" alt="" fetchpriority="high"><span class="splash-bar"><i></i></span></div>
<script>${SITE_SCRIPT(base)}</script>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap">
    <a class="brand" href="${base}" title="${esc(site.name)} home">${wordmark(ctx, 126)}</a>
    <nav class="nav" aria-label="Main">
      <a href="${h}#features">Features</a>
      <a href="${base}android/">Phone app</a>
      ${ctx.guide ? `<a href="${base}guide/">User guide</a>` : ''}
      ${site.preview ? `<a href="${site.preview}" target="_blank" rel="noopener">Online preview</a>` : ''}
    </nav>
    ${THEME_BUTTON}
    <a class="btn btn-dark btn-sm" href="${h}#download">${icon('download')}Download</a>
  </div>
</header>`;
}

function footer(ctx) {
  const { site, base } = ctx;
  return `<footer>
  <div class="wrap">
    <div>
      <a class="brand" href="${base}">${wordmark(ctx, 150, true)}</a>
      <p>An Android phone manager for Windows, macOS and Linux. Mirror, text, transfer, back up and clean up, over USB or Wi‑Fi.</p>
    </div>
    <nav aria-label="Footer">
      <div>
        <h2>Product</h2>
        <ul>
          <li><a href="${base}#features">Features</a></li>
          <li><a href="${base}android/">Phone app</a></li>
          <li><a href="${base}#download">Download</a></li>
          <li><a href="${base}#faq">FAQ</a></li>
          <li><a href="${base}compare/">Compare</a></li>
        </ul>
      </div>
      <div>
        <h2>Resources</h2>
        <ul>
          ${ctx.guide ? `<li><a href="${base}guide/">User guide</a></li>` : ''}
          <li><a href="${site.releases}" rel="noopener">Releases</a></li>
          ${site.preview ? `<li><a href="${site.preview}" target="_blank" rel="noopener">Online preview</a></li>` : ''}
          <li><a href="${site.repoPc}" rel="noopener">Desktop app on GitHub</a></li>
          <li><a href="${site.repoAndroid}" rel="noopener">Android app on GitHub</a></li>
          <li><a href="${base}feedback/">Report a bug</a></li>
          <li><a href="${base}feedback/#feedback">Send feedback</a></li>
        </ul>
      </div>
    </nav>
    <p class="legal">© ${new Date().getFullYear()} ${esc(site.name)}. Android is a trademark of Google LLC. Windows, macOS and Linux are trademarks of their owners.</p>
  </div>
</footer>`;
}

function picture(ctx, key, alt, { sizes, cls = '', eager = false }) {
  const im = ctx.images[key];
  if (!im) throw new Error('Missing image: ' + key + ' (run: npm run images)');
  const srcset = im.variants.map((v) => `${ctx.base}img/${v.file} ${v.w}w`).join(', ');
  const last = im.variants[im.variants.length - 1];
  return `<img${cls ? ` class="${cls}"` : ''} src="${ctx.base}img/${last.file}" srcset="${srcset}" sizes="${sizes}" width="${last.w}" height="${last.h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"'}>`;
}

// The Andromon mascot (static/assets, made into WebP by npm run images). It only decorates, so alt is empty.
function mascot(ctx, name, cls, px) {
  return picture(ctx, 'mascot-' + name, '', { sizes: `${px}px`, cls: `mascot ${cls}` });
}

// ---------- downloads ----------
// Each card lists that system's files from the newest release (latest.json in Andromon_Releases), and
// its button downloads the one for the visitor's CPU. The page is built from release.json (npm run sync),
// and DL_SCRIPT reads the live latest.json in the browser, so a new release shows without a rebuild.

// The name of a file on its system's card. Also sent to the browser as text (DL_SCRIPT), so plain ES5.
function fileLabel(f) {
  var cpu = { x64: '64-bit', arm64: 'ARM64', ia32: '32-bit' }[f.arch] || '';
  if (f.platform === 'windows') return f.arch ? cpu : '64-bit + ARM64 in one';
  if (f.platform === 'mac') return f.arch === 'arm64' ? 'Apple Silicon' : f.arch === 'x64' ? 'Intel' : 'Apple Silicon and Intel';
  if (f.platform === 'linux') return (f.kind === 'deb' ? '.deb' : 'AppImage') + (cpu ? ' · ' + cpu : '');
  if (f.platform === 'android') return 'APK';
  return f.name;
}
// The exact version a card offers, from latest.json: the desktop app's for Windows, macOS and Linux, the
// phone app's own ("companion") for Android. Also sent to the browser as text, so plain ES5.
function versionOf(m, os) {
  if (!m) return '';
  if (os === 'android') {
    var c = m.companion || {};
    return 'Andromon Companion ' + (c.version || m.version) + (c.build ? ' (build ' + c.build + ')' : '');
  }
  return 'Andromon ' + m.version + (m.build ? ' (build ' + m.build + ')' : '');
}
// The line under a card's button: which version and build, for which CPU, and how big.
function pickText(m, f, yours) {
  return (yours ? (f.platform === 'android' ? 'For this phone: ' : 'For this computer: ') : '') + versionOf(m, f.platform) + ' · ' + fileLabel(f) + ' · ' + Math.round(f.size / 1e6) + ' MB';
}
// The file a card's button offers for a CPU type (x64, arm64, ia32, or '' when unknown).
function pickFile(files, os, cpu) {
  var mine = files.filter(function (f) { return f.platform === os; });
  if (os === 'linux') mine = mine.filter(function (f) { return f.kind === 'AppImage'; }).concat(mine.filter(function (f) { return f.kind !== 'AppImage'; }));
  var want = cpu || (os === 'mac' ? 'arm64' : 'x64');
  return mine.filter(function (f) { return f.arch === want; })[0]
    || (os === 'windows' ? mine.filter(function (f) { return !f.arch; })[0] : null)
    || (os === 'mac' && want === 'arm64' ? mine.filter(function (f) { return f.arch === 'x64'; })[0] : null)
    || mine[0] || null;
}

// "Version 1.0.5 (build 5), released 19 November 2026. Phone app 1.0.5 (build 11)." (ES5: also in the browser)
function versionLine(m) {
  var c = m.companion, when = new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return 'Version ' + m.version + (m.build ? ' (build ' + m.build + ')' : '') + ', released ' + when + '.' +
    (c && c.version ? ' Phone app ' + c.version + (c.build ? ' (build ' + c.build + ')' : '') + '.' : '');
}

// The manifest without its change lists, for the browser script.
const slim = (m) => ({ version: m.version, build: m.build, date: m.date,
  companion: m.companion ? { version: m.companion.version, versionCode: m.companion.versionCode, build: m.companion.build } : null, files: m.files });

function downloads(ctx) {
  const { site, content, release } = ctx;
  const files = release ? release.files : [];
  const cards = content.download.os.map((os) => {
    const mine = files.filter((f) => f.platform === os.id);
    const first = pickFile(files, os.id, '');
    const list = mine.length
      ? `<ul class="files">${mine.map((f) => `<li><a href="${esc(f.url)}" rel="noopener">${esc(fileLabel(f))}</a> <span>${mb(f.size)}</span></li>`).join('')}</ul>`
      : '';
    return `<li data-os="${os.id}">
          <span class="yours">${os.id === 'android' ? 'Your phone' : 'Your computer'}</span>
          <h3>${os.name}</h3>
          <p>${esc(os.note)}</p>
          ${os.more ? `<p class="more">${esc(os.more)}</p>` : ''}
          <div class="get">
            ${list}
            <p class="pick">${first ? esc(pickText(release, first, false)) : ''}</p>
            <a class="btn" data-primary href="${esc(first ? first.url : site.releases)}" rel="noopener">${icon('download')}<span>${first ? `Download for ${os.name}` : `Get it for ${os.name}`}</span></a>
          </div>
        </li>`;
  }).join('\n        ');
  const version = release ? esc(versionLine(release)) + ' ' : '';
  const renamed = site.appName && site.appName !== site.name
    ? ` The installers and the app window still carry the name ${esc(site.appName)}; it is the same app.` : '';
  return `<section class="download" id="download" aria-labelledby="download-h">
  <div class="wrap">
    <div class="box">
      ${mascot(ctx, 'relaxed-beanbag', 'm-download', 190)}
      <h2 id="download-h">${esc(content.download.h)}</h2>
      <p class="lead">${esc(content.download.p)}</p>
      <ul class="os">
        ${cards}
      </ul>
      ${content.download.install ? `<details class="install">
        <summary>${esc(content.download.install.h)}</summary>
        <p>${esc(content.download.install.lead)}</p>
        <dl>
          ${content.download.install.items.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('\n          ')}
        </dl>
      </details>` : ''}
      ${site.preview ? `<p class="preview">Want to try it first? Open the <a href="${site.preview}" target="_blank" rel="noopener">online version</a> in Chrome or Edge on your computer, with nothing to install.</p>` : ''}
      <p class="meta"><span data-version>${version}</span>All files, checksums and older versions are on <a href="${site.releases}" rel="noopener">GitHub Releases</a>.${renamed}</p>
    </div>
  </div>
</section>`;
}

function structuredData(ctx) {
  const { site, content, release, abs } = ctx;
  const home = abs('');
  const graph = [
    {
      '@type': 'WebSite', '@id': home + '#website', url: home, name: site.name,
      description: site.description, inLanguage: site.lang, publisher: { '@id': home + '#org' },
    },
    {
      '@type': 'Organization', '@id': home + '#org', name: site.name, url: home,
      logo: { '@type': 'ImageObject', url: abs('img/icon-512.png'), width: 512, height: 512 },
      sameAs: [site.repoPc, site.repoAndroid],
    },
    {
      '@type': 'SoftwareApplication', '@id': home + '#app', name: site.name,
      ...(site.formerName ? { alternateName: site.formerName } : {}), // the app's earlier name, still searched for
      description: site.description, url: home,
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'Android phone manager',
      operatingSystem: 'Windows, macOS, Linux',
      ...(release ? { softwareVersion: release.version, datePublished: release.date.slice(0, 10) } : {}),
      downloadUrl: site.releases,
      image: abs('img/og.png'),
      screenshot: ['overview', 'mirror', 'messages', 'photos'].map((k) => {
        const v = ctx.images[k].variants.slice(-1)[0];
        return { '@type': 'ImageObject', url: abs('img/' + v.file), width: v.w, height: v.h };
      }),
      featureList: content.groups.flatMap((g) => g.items.map((i) => i[1])),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@id': home + '#org' },
    },
    {
      '@type': 'FAQPage', '@id': home + '#faq',
      mainEntity: content.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ];
  return ld({ '@context': 'https://schema.org', '@graph': graph });
}

// The visitor's system and CPU type, then the newest release: each card's button gets the file for this
// computer ("Download for Windows · 64-bit"), its card is marked, and the lists follow the live
// latest.json. Without JavaScript, or when GitHub can't be reached, the links from the build stay.
// CPU type: Chrome and Edge say it (userAgentData); otherwise the user agent, and on a Mac the graphics
// chip, since Safari and Firefox call every Mac "Intel".
const OS_SCRIPT = (ctx) => `(function(){
var n=navigator,ua=n.userAgent,p=((n.userAgentData&&n.userAgentData.platform)||n.platform||'')+' '+ua,d=document;
var NAME={windows:'Windows',mac:'macOS',linux:'Linux',android:'Android'};
${fileLabel.toString()}
${pickFile.toString()}
${versionOf.toString()}
${pickText.toString()}
${versionLine.toString()}
var os=/Android/i.test(ua)?'android':/iPhone|iPad|iPod/i.test(ua)?'':/Win/i.test(p)?'windows':/Mac/i.test(p)?'mac':/Linux|X11|CrOS/i.test(p)?'linux':'';
var cpu=/aarch64|arm64|armv8/i.test(ua)?'arm64':/WOW64|Win64|x64|x86_64|amd64/i.test(ua)?'x64':os==='windows'?'ia32':'';
if(os==='mac'){cpu='arm64';try{var g=d.createElement('canvas').getContext('webgl'),e=g&&g.getExtension('WEBGL_debug_renderer_info'),r=e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'';if(/Intel|AMD|Radeon|NVIDIA/i.test(r))cpu='x64'}catch(x){}}
var rel=${JSON.stringify(ctx.release ? slim(ctx.release) : null).replace(/</g, '\\u003c')},files=rel&&rel.files;
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function mb(b){return Math.round(b/1e6)+' MB'}
function paint(){
  if(files)[].forEach.call(d.querySelectorAll('.os [data-os]'),function(li){var o=li.getAttribute('data-os'),mine=files.filter(function(f){return f.platform===o}),ul=li.querySelector('.files');
    if(!mine.length)return;if(!ul){var g=li.querySelector('.get');ul=d.createElement('ul');ul.className='files';if(g)g.insertBefore(ul,g.firstChild);else li.appendChild(ul)}
    ul.innerHTML=mine.map(function(f){return '<li><a href="'+esc(f.url)+'" rel="noopener">'+esc(fileLabel(f))+'</a> <span>'+mb(f.size)+'</span></li>'}).join('')});
  [].forEach.call(d.querySelectorAll('.os [data-os]'),function(li){var o=li.getAttribute('data-os'),yours=o===os,f=files&&pickFile(files,o,yours?cpu:''),a=li.querySelector('[data-primary]'),pk=li.querySelector('.pick');
    li.classList.toggle('is-yours',yours);
    if(f&&a){a.href=f.url;a.lastChild.textContent='Download for '+NAME[o];if(pk)pk.textContent=pickText(rel,f,yours)}});
  if(os&&NAME[os])[].forEach.call(d.querySelectorAll('[data-dl]'),function(e){e.textContent='Download for '+NAME[os]});
  if(rel){var v=d.querySelector('[data-version]');if(v)v.textContent=versionLine(rel)+' '}
}
function go(){paint();if(!d.querySelector('.os'))return;
  if(${JSON.stringify(!!ctx.site.latestJson)})fetch(${JSON.stringify(ctx.site.latestJson || '')}+'?t='+Math.floor(Date.now()/60000),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(m){if(m&&m.version&&m.files&&m.files.length){rel=m;files=m.files;paint()}}).catch(function(){})}
if(n.userAgentData&&n.userAgentData.getHighEntropyValues&&os!=='android'&&os!=='mac')n.userAgentData.getHighEntropyValues(['architecture','bitness']).then(function(h){if(h.architecture==='arm')cpu='arm64';else if(h.architecture==='x86')cpu=h.bitness==='32'?'ia32':'x64'}).catch(function(){}).then(done);else done();
function done(){if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',go);else go()}
})();`;

// Motion: the header gets a shadow once the page scrolls, and blocks fade and slide in as they
// reach the screen (style.css, "Motion"). Nothing is hidden unless this script runs and the visitor
// hasn't asked for reduced motion, so the page reads the same without it.
const MOTION_SCRIPT = `(function(){
var top=document.querySelector('.top');
if(top){var s=function(){top.classList.toggle('scrolled',window.scrollY>8)};addEventListener('scroll',s,{passive:true});s();}
if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var sel='.spot-text,.shot,.head,.faq-grid>div:first-child,.group,.phones figure,.comp>div:last-child>h2,.care li,.steps li,.download .box,.os>li,.faq details,.cmp-wrap,.why li,.alt,.built li,.cmp-cta';
var els=[].slice.call(document.querySelectorAll(sel));
els.forEach(function(el){
  var sib=[].filter.call(el.parentElement.children,function(x){return x.matches(sel)});
  el.style.setProperty('--i',Math.min(sib.indexOf(el),8));
  el.setAttribute('data-r','');
});
var io=new IntersectionObserver(function(list){list.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{rootMargin:'0px 0px -6% 0px',threshold:0.1});
document.documentElement.classList.add('motion');
els.forEach(function(el){io.observe(el)});
})();`;

function home(ctx) {
  const { site, content: c, base, abs } = ctx;
  const hero = ctx.images.overview;
  const preload = `<link rel="preload" as="image" href="${base}img/${hero.variants.slice(-1)[0].file}" imagesrcset="${hero.variants.map((v) => `${base}img/${v.file} ${v.w}w`).join(', ')}" imagesizes="(min-width: 1220px) 1100px, 92vw" fetchpriority="high">\n`;

  const spotlights = c.spotlights.map((s) => `<article class="spot" id="${s.id}">
      <div class="spot-text">
        <p class="kicker">${esc(s.kicker)}</p>
        <h2>${esc(s.h)}</h2>
        <p>${esc(s.p)}</p>
        <ul class="ticks">
          ${s.list.map((l) => `<li>${icon('check')}<span>${esc(l)}</span></li>`).join('\n          ')}
        </ul>
      </div>
      <figure class="shot">${picture(ctx, s.img, s.alt, { sizes: '(min-width: 1220px) 620px, (min-width: 861px) 52vw, 92vw' })}</figure>
    </article>`).join('\n    ');

  const groups = c.groups.map((g) => `<div class="group">
        <h3>${esc(g.title)}</h3>
        <ul>
          ${g.items.map(([ic, t, d]) => `<li><span class="ico">${icon(ic)}</span><div><h4>${esc(t)}</h4><p>${esc(d)}</p></div></li>`).join('\n          ')}
        </ul>
      </div>`).join('\n      ');

  return head(ctx, { title: site.title, description: site.description, canonical: abs(''), extra: preload }) +
`${structuredData(ctx)}
</head>
<body>
${header(ctx, true)}
<main id="main">

<section class="hero" aria-labelledby="hero-h">
  <div class="wrap">
    <h1 id="hero-h">${esc(c.hero.h1)}</h1>
    <p class="lead">${esc(c.hero.lead)}</p>
    <div class="cta">
      <a class="btn btn-dark" href="#download">${icon('download')}<span data-dl>Download ${esc(site.name)}</span></a>
      <a class="btn btn-light" href="#features">See what it does${icon('arrow')}</a>
    </div>
    ${site.preview ? `<p class="try">Or <a href="${site.preview}" target="_blank" rel="noopener">try the online preview</a> in your browser, with nothing to install.</p>` : ''}
    <ul class="points">
      ${c.hero.points.map((p) => `<li>${icon('check')}${esc(p)}</li>`).join('\n      ')}
    </ul>
    <div class="stage-box">
    ${mascot(ctx, 'jetpack-flying', 'm-hero', 180)}
    <div class="stage">
      ${picture(ctx, 'overview', `${site.name} on a computer showing a connected Android phone's battery, storage and shortcuts to screen mirror, files, photos, apps and messages`, { sizes: '(min-width: 1220px) 1100px, 92vw', cls: 'desk', eager: true })}
      ${picture(ctx, 'phone-home', `The ${site.name} companion app on an Android phone`, { sizes: '(min-width: 1220px) 224px, 19vw', cls: 'handset' })}
    </div>
    </div>
  </div>
</section>

<div class="strip">
  <div class="wrap">
    <ul>
      <li><b>Windows</b> 64-bit, ARM64 and 32-bit</li>
      <li><b>macOS</b> Apple Silicon and Intel</li>
      <li><b>Linux</b> .deb and AppImage</li>
      <li><b>Android</b> phones and tablets</li>
    </ul>
  </div>
</div>

<section aria-label="Main features">
  <div class="wrap">
    ${spotlights}
  </div>
</section>

<section class="features" id="features" aria-labelledby="features-h">
  <div class="wrap">
    <div class="head-row">
      <div class="head">
        <h2 id="features-h">${esc(c.featuresTitle)}</h2>
        <p class="lead">${esc(c.featuresLead)}</p>
      </div>
      ${mascot(ctx, 'gear-thumbs-up', 'm-side', 170)}
    </div>
    <div class="groups">
      ${groups}
    </div>
  </div>
</section>

<section class="companion" id="companion" aria-labelledby="companion-h">
  <div class="wrap comp">
    <div class="phones">
      ${c.companion.shots.map(([k, alt]) => `<figure>${picture(ctx, 'phone-' + k, alt, { sizes: '(min-width: 901px) 190px, 30vw' })}</figure>`).join('\n      ')}
    </div>
    <div>
      <p class="kicker">On the phone</p>
      <h2 id="companion-h">${esc(c.companion.h)}</h2>
      <p class="lead" style="margin-top:16px">${esc(c.companion.p)}</p>
      <ul class="ticks">
        ${c.companion.points.map((t) => `<li>${icon('check')}<span>${esc(t)}</span></li>`).join('\n        ')}
      </ul>
      <a class="learn" href="${base}android/">Learn more about the phone app${icon('arrow')}</a>
    </div>
  </div>
</section>

<section id="how-it-works" aria-labelledby="how-h">
  <div class="wrap">
    <div class="head-row">
      <div class="head">
        <p class="kicker">Set up in a few minutes</p>
        <h2 id="how-h" style="margin-top:12px">${esc(c.steps.h)}</h2>
      </div>
      ${mascot(ctx, 'laptop-assistant', 'm-side', 170)}
    </div>
    <ol class="steps">
      ${c.steps.items.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>

${downloads(ctx)}

<section class="faq" id="faq" aria-labelledby="faq-h">
  <div class="wrap faq-grid">
    <div>
      <h2 id="faq-h">Questions and answers</h2>
      ${ctx.guide ? `<p class="lead">Every page and option is explained, with screenshots, in the <a href="${base}guide/">user guide</a>.</p>` : ''}
      ${mascot(ctx, 'magnifier-inspector', 'm-faq', 200)}
    </div>
    <div>
      ${c.faq.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary><h3>${esc(q)}</h3>${icon('chevron')}</summary><p>${esc(a)}</p></details>`).join('\n      ')}
    </div>
  </div>
</section>

</main>
${feedbackWidget(ctx)}
${footer(ctx)}
<script>${OS_SCRIPT(ctx)}${MOTION_SCRIPT}${THEME_SCRIPT}</script>
</body>
</html>
`;
}

function notFound(ctx) {
  const { site, base, abs } = ctx;
  return head(ctx, { title: `Page not found | ${site.name}`, description: `This page doesn't exist. Go back to the ${site.name} homepage.`, canonical: abs(''), index: false }) +
`</head>
<body>
${header(ctx, false)}
<main id="main" class="lost">
  <div class="wrap">
    ${mascot(ctx, 'magnifier-inspector', 'm-lost', 170)}
    <p class="kicker">Error 404</p>
    <h1 style="margin-top:12px">This page doesn't exist</h1>
    <p class="lead" style="margin:18px auto 0">The link may be old, or the address may have a typo.</p>
    <div class="cta">
      <a class="btn btn-dark" href="${base}">Go to the homepage</a>
      ${ctx.guide ? `<a class="btn btn-light" href="${base}guide/">Open the user guide</a>` : ''}
    </div>
  </div>
</main>
${feedbackWidget(ctx, { fab: false })}
${footer(ctx)}
<script>${THEME_SCRIPT}</script>
</body>
</html>
`;
}


// ---------- /compare/: Andromon side by side with the tools people use instead ----------
const MARK = { f: ['full', 'Covers it'], p: ['part', 'Partly'], n: ['none', "Doesn't"] };
function mark(cell) {
  const [m, note] = cell.split('|');
  const [cls, word] = MARK[m];
  return `<span class="mk ${cls}"><i aria-hidden="true"></i>${esc(note || word)}</span>`;
}

function compare(ctx) {
  const { site, content, base, abs } = ctx;
  const c = content.compare;
  const breadcrumb = ld({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: site.name, item: abs('') },
      { '@type': 'ListItem', position: 2, name: c.kicker, item: abs('compare/') },
    ],
  }) + '\n';
  const head2 = c.columns.map(([name, sub], i) => `<th scope="col"${i === 0 ? ' class="us"' : ''}>${esc(name)}<small>${esc(sub)}</small></th>`).join('');
  const rows = c.rows.map(([name, ...cells]) => `<tr><th scope="row">${esc(name)}</th>${cells.map((cell, i) => `<td${i === 0 ? ' class="us"' : ''}>${mark(cell)}</td>`).join('')}</tr>`).join('\n          ');

  return head(ctx, { title: c.title, description: c.description, canonical: abs('compare/'), extra: breadcrumb }) +
`</head>
<body>
${header(ctx, false)}
<main id="main">

<section class="hero cmp-hero" aria-labelledby="cmp-h">
  <div class="wrap">
    <h1 id="cmp-h">${esc(c.h1)}</h1>
    <p class="lead">${esc(c.lead)}</p>
    <div class="cta">
      <a class="btn btn-dark" href="${base}#download">${icon('download')}<span data-dl>Download ${esc(site.name)}</span></a>
      <a class="btn btn-light" href="#side-by-side">See the comparison${icon('arrow')}</a>
    </div>
  </div>
</section>

<section id="side-by-side" aria-labelledby="sbs-h">
  <div class="wrap">
    <div class="head">
      <p class="kicker">Side by side</p>
      <h2 id="sbs-h" style="margin-top:12px">What each one covers</h2>
    </div>
    <ul class="legend" aria-label="What the marks mean">
      <li>${mark('f')}</li><li>${mark('p|Partly, or only on some phones or plans')}</li><li>${mark('n')}</li>
    </ul>
    <div class="cmp-wrap" tabindex="0" role="region" aria-label="Comparison table, scrolls sideways on small screens">
      <table class="cmp">
        <thead><tr><th scope="col">Feature</th>${head2}</tr></thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
    <p class="cmp-note">Based on each product's public information as of ${esc(c.asOf)}. Products change, so check their websites for the latest.</p>
  </div>
</section>

<section class="features" aria-labelledby="why-h">
  <div class="wrap">
    <div class="head">
      <p class="kicker">Why ${esc(site.name)}</p>
      <h2 id="why-h" style="margin-top:12px">What sets it apart</h2>
    </div>
    <ul class="why">
      ${c.why.map(([ic, t, d]) => `<li><span class="ico">${icon(ic)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('\n      ')}
    </ul>
  </div>
</section>

<section aria-labelledby="alt-h">
  <div class="wrap">
    <div class="head">
      <p class="kicker">The alternatives</p>
      <h2 id="alt-h" style="margin-top:12px">If you use one of these today</h2>
    </div>
    <div class="alts">
      ${c.alternatives.map(([name, what, diff]) => `<article class="alt"><h3>${esc(name)}</h3><p>${esc(what)}</p><p class="diff"><b>${esc(site.name)}</b> ${esc(diff)}</p></article>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="companion" aria-labelledby="built-h">
  <div class="wrap">
    <p class="kicker">Built on open tools</p>
    <h2 id="built-h">Made with projects you may already know</h2>
    <p class="lead" style="margin-top:16px">${esc(site.name)} builds on these open-source projects instead of reinventing them, and credits each one in the app.</p>
    <ul class="care built">
      ${c.builtOn.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('\n      ')}
    </ul>
  </div>
</section>

<section aria-label="Try ${esc(site.name)}">
  <div class="wrap">
    <div class="cmp-cta">
      <div class="cmp-cta-lead">
        ${mascot(ctx, 'gear-thumbs-up', 'm-cta', 120)}
        <div>
          <h2>Try ${esc(site.name)} with your own phone</h2>
          <p class="lead">Free for Windows, macOS and Linux. No account, no ads.</p>
        </div>
      </div>
      <div class="cta" style="margin-top:0">
        <a class="btn btn-dark" href="${base}#download">${icon('download')}<span data-dl>Download ${esc(site.name)}</span></a>
        ${ctx.guide ? `<a class="btn btn-light" href="${base}guide/">Read the user guide${icon('arrow')}</a>` : ''}
      </div>
    </div>
    <p class="cmp-legal">${esc(c.legal)}</p>
  </div>
</section>

</main>
${feedbackWidget(ctx, { fab: false })}
${footer(ctx)}
<script>${OS_SCRIPT(ctx)}${MOTION_SCRIPT}${THEME_SCRIPT}</script>
</body>
</html>
`;
}


// ---------- /android/: the companion app on the phone ----------
function androidPage(ctx) {
  const { site, content, base, abs } = ctx;
  const c = content.android;
  const page = abs('android/');
  const guideUrl = `${site.repoAndroid}/blob/main/docs/USER_GUIDE.md`;
  const shotUrl = (k) => { const v = ctx.images[k].variants.slice(-1)[0]; return abs('img/' + v.file); };
  const data = ld({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MobileApplication', '@id': page + '#app', name: `${site.name} Companion`, url: page,
        description: c.description, operatingSystem: 'Android 8.0 or later', applicationCategory: 'UtilitiesApplication',
        isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        license: 'https://www.gnu.org/licenses/gpl-3.0.html', codeRepository: site.repoAndroid,
        screenshot: ['phone-home', 'phone-cleaner', 'phone-battery', 'phone-stats'].map(shotUrl),
        isPartOf: { '@id': abs('') + '#app' },
      },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: site.name, item: abs('') },
        { '@type': 'ListItem', position: 2, name: 'Phone app', item: page },
      ] },
      { '@type': 'FAQPage', mainEntity: c.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  }) + '\n';
  const phone = (k, alt, sizes, cls = '') => `<figure class="handheld${cls}">${picture(ctx, k, alt, { sizes })}</figure>`;

  const spotlights = c.spotlights.map((s) => `<article class="spot spot-phone" id="${s.id}">
      <div class="spot-text">
        <p class="kicker">${esc(s.kicker)}</p>
        <h2>${esc(s.h)}</h2>
        <p>${esc(s.p)}</p>
        <ul class="ticks">
          ${s.list.map((l) => `<li>${icon('check')}<span>${esc(l)}</span></li>`).join('\n          ')}
        </ul>
      </div>
      ${phone(s.img, s.alt, '(min-width: 861px) 290px, 70vw', ' shot')}
    </article>`).join('\n    ');

  return head(ctx, { title: c.title, description: c.description, canonical: page, extra: data, og: 'og-android.png', ogAlt: `${site.name} Companion: the phone-care app that links Android to your computer` }) +
`</head>
<body>
${header(ctx, false)}
<main id="main">

<section class="hero and-hero" aria-labelledby="and-h">
  <div class="wrap and-grid">
    <div class="and-text">
      <p class="kicker">${esc(c.kicker)}</p>
      <h1 id="and-h">${esc(c.h1)}</h1>
      <p class="lead">${esc(c.lead)}</p>
      <div class="cta">
        <a class="btn btn-dark" href="#get">${icon('download')}How to get it</a>
        <a class="btn btn-light" href="${guideUrl}" rel="noopener">Read the phone app guide${icon('arrow')}</a>
      </div>
      <ul class="points">
        ${c.points.map((p) => `<li>${icon('check')}${esc(p)}</li>`).join('\n        ')}
      </ul>
    </div>
    <div class="phones and-phones">
      ${c.hero.map(([k, alt], i) => `<figure>${picture(ctx, 'phone-' + k, alt, { sizes: '(min-width: 901px) 190px, 30vw', eager: i === 0 })}</figure>`).join('\n      ')}
    </div>
  </div>
</section>

<section aria-label="What the phone app does">
  <div class="wrap">
    ${spotlights}
  </div>
</section>

<section class="features" id="tools" aria-labelledby="tools-h">
  <div class="wrap">
    <div class="head-row">
      <div class="head">
        <h2 id="tools-h">${esc(c.toolsTitle)}</h2>
        <p class="lead">${esc(c.toolsLead)}</p>
      </div>
      ${mascot(ctx, 'magnifier-inspector', 'm-side', 170)}
    </div>
    <ul class="why">
      ${c.tools.map(([ic, t, d]) => `<li><span class="ico">${icon(ic)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('\n      ')}
    </ul>
    <div class="gallery" tabindex="0" role="region" aria-label="Screens of the phone app, scrolls sideways">
      ${c.gallery.map(([k, name]) => `<figure>${picture(ctx, 'phone-' + k, `The companion app's ${name} screen`, { sizes: '200px' })}<figcaption>${esc(name)}</figcaption></figure>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="companion" id="privacy" aria-labelledby="priv-h">
  <div class="wrap">
    <p class="kicker">Privacy</p>
    <h2 id="priv-h">${esc(c.privacy.h)}</h2>
    <p class="lead" style="margin-top:16px">${esc(c.privacy.p)}</p>
    <ul class="care built">
      ${c.privacy.items.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('\n      ')}
    </ul>
  </div>
</section>

<section id="get" aria-labelledby="get-h">
  <div class="wrap">
    <div class="head-row">
      <div class="head">
        <p class="kicker">Set up in a few minutes</p>
        <h2 id="get-h" style="margin-top:12px">${esc(c.get.h)}</h2>
      </div>
      ${mascot(ctx, 'laptop-assistant', 'm-side', 170)}
    </div>
    <ol class="steps">
      ${c.get.items.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('\n      ')}
    </ol>
    <p class="get-note">${esc(c.get.note)}</p>
  </div>
</section>

<section class="faq" id="faq" aria-labelledby="faq-h">
  <div class="wrap faq-grid">
    <div>
      <h2 id="faq-h">Questions about the phone app</h2>
      <p class="lead">Every screen and option is explained, with screenshots, in the <a href="${guideUrl}" rel="noopener">phone app guide</a>.</p>
    </div>
    <div>
      ${c.faq.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary><h3>${esc(q)}</h3>${icon('chevron')}</summary><p>${esc(a)}</p></details>`).join('\n      ')}
    </div>
  </div>
</section>

<section aria-label="Get ${esc(site.name)}">
  <div class="wrap">
    <div class="cmp-cta">
      <div class="cmp-cta-lead">
        ${mascot(ctx, 'jetpack-flying', 'm-cta', 120)}
        <div>
          <h2>Get ${esc(site.name)} for your computer</h2>
          <p class="lead">The companion comes with it. Free for Windows, macOS and Linux.</p>
        </div>
      </div>
      <div class="cta" style="margin-top:0">
        <a class="btn btn-dark" href="${base}#download">${icon('download')}<span data-dl>Download ${esc(site.name)}</span></a>
        <a class="btn btn-light" href="${site.repoAndroid}" rel="noopener">Source code${icon('arrow')}</a>
      </div>
    </div>
  </div>
</section>

</main>
${feedbackWidget(ctx, { fab: false })}
${footer(ctx)}
<script>${OS_SCRIPT(ctx)}${MOTION_SCRIPT}${THEME_SCRIPT}</script>
</body>
</html>
`;
}


// ---------- /stats/: download counts for the developer (noindex, not linked from the site; open /stats/ directly) ----------
// The counts are GitHub's own per-file download counters, read live from the releases API in the
// browser (no build step, no server, nothing about visitors is collected). GitHub allows 60 API calls an
// hour per network without signing in, so a result is kept in sessionStorage for 5 minutes; Refresh
// skips that.
const STATS_SCRIPT = (repo) => `(function(){
var d=document,API='https://api.github.com/repos/${repo}/releases?per_page=100',KEY='dl-stats',TTL=3e5;
var out=d.getElementById('stats'),msg=d.getElementById('stats-msg'),btn=d.getElementById('stats-refresh');
var PLAT=[['Windows',/\\.exe$/i],['macOS',/\\.dmg$/i],['Linux',/\\.(appimage|deb|rpm)$/i],['Android',/\\.apk$/i],['Web version',/web.*\\.zip$/i]];
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function n(x){return Number(x).toLocaleString()}
function mb(b){return b>=1e6?Math.round(b/1e6)+' MB':Math.max(1,Math.round(b/1e3))+' KB'}
function day(t){return new Date(t).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}
function plat(name){for(var i=0;i<PLAT.length;i++)if(PLAT[i][1].test(name))return PLAT[i][0];return null}
function bars(rows,label){var max=Math.max.apply(null,rows.map(function(r){return r[1]}).concat(1));
  return '<ul class="st-bars" aria-label="'+esc(label)+'">'+rows.map(function(r){var pct=r[1]/max*100;
    return '<li title="'+esc(r[0])+': '+n(r[1])+' downloads"><span class="st-name">'+esc(r[0])+(r[2]?'<small>'+esc(r[2])+'</small>':'')+'</span><span class="st-track"><i style="width:'+(r[1]?Math.max(pct,1.5):0)+'%"></i></span><span class="st-val">'+n(r[1])+'</span></li>'}).join('')+'</ul>'}
function paint(rels,when){
  rels=rels.filter(function(r){return !r.draft});
  var total=0,byPlat={},per=[];
  PLAT.forEach(function(p){byPlat[p[0]]=0});
  rels.forEach(function(r){var sum=0;r.assets.forEach(function(a){var p=plat(a.name);if(p){byPlat[p]+=a.download_count;sum+=a.download_count}});total+=sum;per.push([r.tag_name,sum,day(r.published_at||r.created_at)])});
  var latest=rels[0],top=null;
  rels.forEach(function(r){r.assets.forEach(function(a){if(plat(a.name)&&(!top||a.download_count>top.download_count))top=a})});
  var tiles=[['All downloads',n(total),'installers, APK and web zip'],['Latest release',latest?n(per[0][1]):'0',latest?latest.tag_name+', '+per[0][2]:'none yet'],['Releases',n(rels.length),latest?'since '+per[per.length-1][2]:''],['Most downloaded file',top?n(top.download_count):'0',top?top.name:'']];
  var h='<div class="st-tiles">'+tiles.map(function(t){return '<div class="st-tile"><p class="st-k">'+esc(t[0])+'</p><p class="st-n">'+t[1]+'</p><p class="st-sub">'+esc(t[2])+'</p></div>'}).join('')+'</div>';
  h+='<div class="st-grid"><section class="st-card" aria-labelledby="st-plat"><h2 id="st-plat">By system</h2><p class="st-sub">All releases together</p>'+bars(PLAT.map(function(p){return [p[0],byPlat[p[0]]]}).sort(function(a,b){return b[1]-a[1]}),'Downloads by system')+'</section>';
  h+='<section class="st-card" aria-labelledby="st-rel"><h2 id="st-rel">By release</h2><p class="st-sub">Newest first</p>'+bars(per,'Downloads by release')+'</section></div>';
  h+='<section class="st-files" aria-labelledby="st-files"><h2 id="st-files">Every file</h2>'+rels.map(function(r,i){
    var files=r.assets.slice().sort(function(a,b){return b.download_count-a.download_count});
    return '<details'+(i?'':' open')+'><summary><span>'+esc(r.tag_name)+'</span><span class="st-sub">'+esc(per[i][2])+' · '+n(per[i][1])+' downloads</span></summary><div class="cmp-wrap"><table class="st-table"><thead><tr><th scope="col">File</th><th scope="col">System</th><th scope="col" class="num">Size</th><th scope="col" class="num">Downloads</th></tr></thead><tbody>'+
      files.map(function(a){var p=plat(a.name);return '<tr'+(p?'':' class="st-meta"')+'><th scope="row">'+esc(a.name)+'</th><td>'+esc(p||'Release file, not counted')+'</td><td class="num">'+mb(a.size)+'</td><td class="num">'+n(a.download_count)+'</td></tr>'}).join('')+'</tbody></table></div></details>'}).join('')+'</section>';
  out.innerHTML=h;
  msg.textContent='Checked '+new Date(when).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})+'. Counts come straight from GitHub.';
}
function load(force){
  if(!force){try{var c=JSON.parse(sessionStorage.getItem(KEY)||'null');if(c&&Date.now()-c.t<TTL)return paint(c.r,c.t)}catch(e){}}
  msg.textContent='Loading the counts from GitHub…';btn.disabled=true;
  fetch(API,{headers:{Accept:'application/vnd.github+json'}}).then(function(res){
    if(res.ok)return res.json();
    var reset=Number(res.headers.get('x-ratelimit-reset'))*1e3;
    throw new Error(res.status===403||res.status===429?'GitHub allows 60 checks an hour from one network. Try again'+(reset?' after '+new Date(reset).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}):' later')+'.':'GitHub answered '+res.status+'.');
  }).then(function(r){var t=Date.now();try{sessionStorage.setItem(KEY,JSON.stringify({t:t,r:r}))}catch(e){}paint(r,t)})
  .catch(function(e){msg.textContent=(e&&e.message&&!/fetch/i.test(e.message))?e.message:'Couldn\\'t reach GitHub. Check the connection and try again.'})
  .then(function(){btn.disabled=false});
}
btn.addEventListener('click',function(){load(true)});
load(false);
})();`;

function statsPage(ctx) {
  const { site, abs } = ctx;
  const repo = (String(site.releases).match(/github\.com\/([^/]+\/[^/]+)/) || [])[1];
  if (!repo) throw new Error('site.config.json: "releases" must be a GitHub releases address');
  return head(ctx, { title: `Download stats | ${site.name}`, description: `How many times each ${site.name} release and file has been downloaded, live from GitHub.`, canonical: abs('stats/'), index: false, track: false }) +
`</head>
<body>
${header(ctx, false)}
<main id="main">
<section class="hero st-hero" aria-labelledby="st-h">
  <div class="wrap">
    <p class="kicker">Dev</p>
    <h1 id="st-h">Download stats</h1>
    <p class="lead">Every download of every file in the <a href="${site.releases}" rel="noopener">GitHub releases</a>: from this site, the README, the app's update check and direct links alike.</p>
    <div class="st-bar"><p id="stats-msg" class="st-sub" role="status">Loading the counts from GitHub…</p><button id="stats-refresh" class="btn btn-light btn-sm" type="button">Refresh</button></div>
  </div>
</section>
<section class="st-body" aria-label="Download counts">
  <div class="wrap">
    <noscript><p class="lead">This page reads the counts from GitHub in the browser, so it needs JavaScript. The same numbers are in the <a href="https://api.github.com/repos/${repo}/releases">releases API</a>.</p></noscript>
    <div id="stats"></div>
    ${ctx.site.goatcounter ? `<p class="cmp-note">Countries, visits and clicks on each download button: <a href="${esc(new URL(ctx.site.goatcounter).origin)}" rel="noopener">GoatCounter dashboard</a>.</p>\n    ` : ''}<p class="cmp-note">Totals count the installers, the phone app and the web version. Checksums, the changelog and latest.json are listed but not counted. GitHub doesn't say where a download came from.</p>
  </div>
</section>
</main>
${footer(ctx)}
<script>${STATS_SCRIPT(repo)}${THEME_SCRIPT}</script>
</body>
</html>
`;
}

// ---------- feedback: a floating button and popup on every page, and the /feedback/ page ----------
// The same forms as in both apps (pc/src/feedback.js, android/…/Feedback.kt). Nothing is sent from the
// site: the form builds a github.com link with the text filled in and opens it, and the visitor presses
// Submit there with their GitHub account.
//   Bug      → an issue through .github/ISSUE_TEMPLATE/bug_report.yml in the releases repo; each query
//              parameter fills the field with the same id (what, steps, expected, env).
//   Feedback → a discussion in that repo's "General" category (title, body).
// feedbackWidget() is self-contained (its own <style> and <script>) because build.js also puts it in the
// user guide, which has its own stylesheet; it only borrows the colour tokens both share.
const releasesRepo = (site) => {
  const repo = (String(site.releases).match(/github\.com\/([^/]+\/[^/]+)/) || [])[1];
  if (!repo) throw new Error('site.config.json: "releases" must be a GitHub releases address');
  return repo;
};

const FB_ICON = '<svg class="fbw-ic-msg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

const FB_X = '<svg class="fbw-ic-x" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

function feedbackForm(ctx) {
  const ver = ctx.release ? ctx.release.version : '';
  return `<form class="fbw-form" novalidate>
  <div class="fbw-tabs" role="group" aria-label="What would you like to do?">
    <button type="button" class="fbw-btn fbw-sm" data-kind="bug" aria-pressed="true">Report a bug</button>
    <button type="button" class="fbw-btn fbw-sm" data-kind="feedback" aria-pressed="false">Send feedback</button>
  </div>
  <label class="fbw-field"><span data-label="title">Title</span><input name="title" type="text" maxlength="200" autocomplete="off"></label>
  <label class="fbw-field"><span data-label="text">What went wrong?</span><textarea name="text" rows="4"></textarea></label>
  <label class="fbw-field" data-only="bug"><span>How can we make it happen? <small>(optional)</small></span><textarea name="steps" rows="3" placeholder="1. Connect the phone over USB&#10;2. Open …"></textarea></label>
  <label class="fbw-field" data-only="bug"><span>What did you expect? <small>(optional)</small></span><textarea name="expected" rows="2"></textarea></label>
  <details class="fbw-env" open>
    <summary>About your setup <small>(nothing personal)</small></summary>
    <div class="fbw-field"><span>Which part?</span><select name="where">
      <option>Desktop app (Windows, macOS, Linux)</option>
      <option>Phone app (Andromon Companion)</option>
      <option>Web version in the browser</option>
      <option>This website</option>
      <option value="">Not sure / everything</option>
    </select></div>
    <div class="fbw-row">
      <label class="fbw-field"><span>Andromon version</span><input name="version" type="text" maxlength="40" value="${esc(ver)}" placeholder="e.g. 1.0.5"></label>
      <label class="fbw-field"><span>Computer system</span><input name="system" type="text" maxlength="80" placeholder="e.g. Windows 11"></label>
      <label class="fbw-field"><span>Phone <small>(optional)</small></span><input name="phone" type="text" maxlength="80" placeholder="e.g. Samsung S20, Android 13"></label>
    </div>
  </details>
  <p class="fbw-note">Opens GitHub in a new tab with this filled in. Check it there and press Submit (a free GitHub account is needed). Nothing is sent before that, and what you post is public, so leave out phone numbers, messages and account names.</p>
  <div class="fbw-actions">
    <button type="submit" class="fbw-btn fbw-dark" data-go>Report on GitHub</button>
    <button type="button" class="fbw-btn" data-copy title="No GitHub account? Copy the text and e-mail or message it instead">Copy text</button>
    <p class="fbw-msg" role="status"></p>
  </div>
</form>`;
}

const FB_CSS = `
.fbw-fab { position: fixed; right: 22px; bottom: 22px; z-index: 30; display: inline-flex; align-items: center; gap: 8px; min-height: 46px; padding: 0 18px 0 14px; border: 0; border-radius: 999px;
  background: var(--btn, var(--fab, #292A2C)); color: var(--btn-ink, var(--fab-ink, #fff)); font: 500 13px/1 Poppins, system-ui, sans-serif; cursor: pointer;
  box-shadow: 0 16px 34px -14px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06); transition: transform .3s cubic-bezier(.22,1,.36,1), background-color .2s ease; }
.fbw-fab:hover { transform: translateY(-2px); background: var(--btn-hover, var(--fab-hover, #000)); }
.fbw-fab:focus-visible { outline: 3px solid var(--accent, #3F6A0A); outline-offset: 3px; }
.fbw-fab .fbw-ic-x, .fbw-fab[aria-expanded="true"] .fbw-ic-msg { display: none; }
.fbw-fab[aria-expanded="true"] .fbw-ic-x { display: block; }
.splashing .fbw-fab { visibility: hidden; }
/* The popup: a panel in the bottom-right corner, above the button */
dialog.fbw { position: fixed; inset: auto 22px 80px auto; z-index: 31; margin: 0; width: 380px; max-width: calc(100vw - 44px); max-height: min(640px, calc(100vh - 110px)); padding: 0;
  border: 1px solid var(--line, #D9D9D5); border-radius: 22px; background: var(--card, #fff); color: var(--ink, #292A2C); font: 12px/1.5 Poppins, system-ui, sans-serif;
  box-shadow: 0 30px 70px -24px rgba(0,0,0,.55); overflow: auto; overscroll-behavior: contain; transform-origin: 100% 100%; }
.fbw-root:not(.fbw-hasfab) dialog.fbw { bottom: 22px; max-height: calc(100vh - 44px); }
/* Netlify's free plan adds a "Powered by Netlify" badge (an iframe, #nl-badge-frame) in the same corner: sit above it */
html:has(#nl-badge-frame) .fbw-fab { bottom: 92px; }
html:has(#nl-badge-frame) dialog.fbw { bottom: 150px; max-height: min(640px, calc(100vh - 180px)); }
html:has(#nl-badge-frame) .fbw-root:not(.fbw-hasfab) dialog.fbw { bottom: 92px; }
dialog.fbw[open] { animation: fbw-in .3s cubic-bezier(.22,1,.36,1); }
@keyframes fbw-in { from { opacity: 0; transform: translateY(10px) scale(.96); } }
@media (prefers-reduced-motion: reduce) { dialog.fbw[open], .fbw-dd-list { animation: none; } .fbw-fab { transition: none; } }
/* On phones there is no button or popup: the footer links open the /feedback/ page */
@media (max-width: 600px) { .fbw-fab, dialog.fbw { display: none !important; } }
@media print { .fbw-fab, dialog.fbw { display: none !important; } }
.fbw-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 12px 8px 18px; background: var(--card, #fff); }
.fbw-head h2 { margin: 0; font-size: 15px; font-weight: 500; letter-spacing: -.01em; }
.fbw-x { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 50%; background: transparent; color: var(--soft, #56575A); cursor: pointer; }
.fbw-x:hover { background: var(--surface, #F5F5F3); color: var(--ink, #292A2C); }
.fbw-body { padding: 0 18px 18px; }
.fbw-lead { margin: 0 0 12px; color: var(--soft, #56575A); }
/* The form, here and on /feedback/: sizes follow its font size (12px in the popup) */
.fbw-form { font-family: Poppins, system-ui, sans-serif; }
.fb-card .fbw-form { font-size: 15px; }
.fbw-form [hidden] { display: none; }
.fbw-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.2em; }
.fbw-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 3.4em; padding: 0 1.5em; border: 1px solid var(--line, #D9D9D5); border-radius: 999px;
  background: var(--card, #fff); color: var(--ink, #292A2C); font: 500 1em/1.2 Poppins, system-ui, sans-serif; cursor: pointer; }
.fbw-btn:hover { background: var(--surface, #F5F5F3); }
.fbw-sm { min-height: 2.8em; padding: 0 1.1em; }
.fbw-dark, .fbw-tabs [aria-pressed="true"] { background: var(--btn, var(--fab, #292A2C)); color: var(--btn-ink, var(--fab-ink, #fff)); border-color: transparent; }
.fbw-dark:hover, .fbw-tabs [aria-pressed="true"]:hover { background: var(--btn-hover, var(--fab-hover, #000)); }
.fbw-field { display: block; margin: 0 0 1em; min-width: 0; }
.fbw-field > span { display: block; font-weight: 500; margin: 0 0 .4em .3em; }
.fbw-form small { color: var(--soft, #56575A); font-weight: 400; font-size: 1em; }
.fbw-field :is(input, textarea, select) { display: block; width: 100%; box-sizing: border-box; padding: .75em 1.1em; border: 1px solid var(--line, #D9D9D5); border-radius: 14px;
  background: var(--surface, #F5F5F3); color: var(--ink, #292A2C); font: inherit; }
.fbw-field :is(input, select) { border-radius: 999px; }
.fbw-field textarea { resize: vertical; min-height: 3.2em; }
.fbw-field :is(input, textarea, select):focus { outline: 2px solid var(--accent, #3F6A0A); outline-offset: 1px; }
.fbw-field [aria-invalid="true"] { border-color: #d9443f; outline: 2px solid #d9443f; }
.fbw-field :is(input, textarea)::placeholder { color: var(--soft, #56575A); opacity: .8; }
.fbw-env { border-top: 1px solid var(--line, #D9D9D5); margin: .4em 0 0; padding: 1em 0 0; }
.fbw-env summary { cursor: pointer; font-weight: 500; margin: 0 0 .9em .3em; }
.fbw-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 10px; }
dialog.fbw .fbw-row { grid-template-columns: 1fr 1fr; }
dialog.fbw .fbw-row > :last-child { grid-column: 1 / -1; }
@media (max-width: 680px) { .fbw-row { grid-template-columns: 1fr; } }
.fbw-note { color: var(--soft, #56575A); line-height: 1.5; margin: .2em 0 1.2em; }
.fbw-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; }
.fbw-msg { flex-basis: 100%; margin: 0; color: var(--soft, #56575A); }
/* The dropdown (made from the <select> by the script; without JavaScript the <select> shows) */
.fbw-dd { position: relative; }
.fbw-dd > select { display: none; }
.fbw-dd-btn { display: flex; align-items: center; justify-content: space-between; gap: .6em; width: 100%; padding: .75em .9em .75em 1.1em; border: 1px solid var(--line, #D9D9D5); border-radius: 999px;
  background: var(--surface, #F5F5F3); color: var(--ink, #292A2C); font: inherit; text-align: left; cursor: pointer; transition: border-color .15s ease; }
.fbw-dd-btn:hover { border-color: var(--soft, #56575A); }
.fbw-dd-btn:focus-visible, .fbw-dd-btn[aria-expanded="true"] { outline: 2px solid var(--accent, #3F6A0A); outline-offset: 1px; }
.fbw-dd-btn > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fbw-dd-btn svg { flex: none; color: var(--soft, #56575A); transition: transform .2s ease; }
.fbw-dd-btn[aria-expanded="true"] svg { transform: rotate(180deg); }
.fbw-dd-list { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 5; margin: 0; padding: 5px; list-style: none; max-height: 18em; overflow: auto;
  background: var(--card, #fff); border: 1px solid var(--line, #D9D9D5); border-radius: 16px; box-shadow: 0 18px 40px -16px rgba(0,0,0,.45); animation: fbw-dd .16s ease-out; }
.fbw-dd.up .fbw-dd-list { top: auto; bottom: calc(100% + 6px); }
@keyframes fbw-dd { from { opacity: 0; transform: translateY(-4px); } }
.fbw-dd-list [role="option"] { display: flex; align-items: center; gap: .6em; padding: .65em .8em; border-radius: 10px; cursor: pointer; }
.fbw-dd-list [role="option"].on { background: var(--surface, #F5F5F3); }
.fbw-dd-list [role="option"][aria-selected="true"] { font-weight: 500; }
.fbw-dd-list [role="option"] svg { flex: none; color: var(--accent, #3F6A0A); visibility: hidden; }
.fbw-dd-list [role="option"][aria-selected="true"] svg { visibility: visible; }
.fb-card { background: var(--card); border: 1px solid var(--line); border-radius: var(--r); padding: clamp(20px, 4vw, 32px); }
`;

// Wires up every .fbw-form on the page, the popup and floating button (where there are), and links to
// /feedback/ (the footer's), which open the popup instead of leaving the page.
const FB_SCRIPT = (repo) => `(function(){
var REPO='https://github.com/${repo}',MAX=7000,d=document;
var ua=navigator.userAgent,SYS=/Android/.test(ua)?('Android '+((ua.match(/Android ([\\d.]+)/)||[])[1]||'')).trim():/Windows/.test(ua)?'Windows':/Mac/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'';
function fit(o,make){var u=make(o);for(var i=0;u.length>MAX&&i<60;i++){var k=Object.keys(o).filter(function(x){return x!=='env'}).sort(function(a,b){return o[b].length-o[a].length})[0];
  if(!k||o[k].length<40)break;o[k]=o[k].slice(0,Math.floor(o[k].length*.85)).replace(/\\s+$/,'')+' …(shortened)';u=make(o)}return u}
function q(o){return Object.keys(o).filter(function(k){return o[k]}).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(o[k])}).join('&')}
function setup(f,onPage){
  var kind='bug',tabs=[].slice.call(f.querySelectorAll('[data-kind]')),E=f.elements;
  function v(n){return E[n].value.trim()}
  function say(t){f.querySelector('.fbw-msg').textContent=t}
  function setKind(k){kind=k;tabs.forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-kind')===k))});
    [].forEach.call(f.querySelectorAll('[data-only]'),function(el){el.hidden=el.getAttribute('data-only')!==k});
    f.querySelector('[data-label=title]').innerHTML=k==='bug'?'Title':'Title <small>(optional)</small>';
    f.querySelector('[data-label=text]').textContent=k==='bug'?'What went wrong?':'Your feedback';
    E.text.placeholder=k==='bug'?'What happened, and any error message you saw':'What you like, what\\'s missing, what\\'s confusing, an idea…';
    E.title.placeholder=k==='bug'?'e.g. Screen mirror freezes after a minute':'A few words about your feedback';
    f.querySelector('[data-go]').textContent=k==='bug'?'Report on GitHub':'Post on GitHub';say('');
    if(onPage&&history.replaceState)history.replaceState(null,'',k==='feedback'?'#feedback':location.pathname)}
  tabs.forEach(function(b){b.addEventListener('click',function(){setKind(b.getAttribute('data-kind'))})});
  if(SYS&&!E.system.value)E.system.value=SYS;if(/^Android/.test(SYS))E.where.selectedIndex=1;
  function env(){var w=E.where,l=[];if(kind==='bug'||w.value)l.push('Where: '+w.options[w.selectedIndex].text);
    if(v('version'))l.push('Andromon: '+v('version'));if(v('system'))l.push('System: '+v('system'));if(v('phone'))l.push('Phone: '+v('phone'));
    l.push('Sent from: the website');return l.join('\\n')}
  function url(){if(kind==='bug')return fit({title:v('title'),what:v('text'),steps:v('steps'),expected:v('expected'),env:env()},function(o){
      return REPO+'/issues/new?'+q({template:'bug_report.yml',title:'[Bug] '+o.title,what:o.what,steps:o.steps,expected:o.expected,env:o.env})});
    return fit({title:v('title'),text:v('text'),env:env()},function(o){var first=o.text.split('\\n')[0];if(first.length>60)first=first.slice(0,57)+'…';
      return REPO+'/discussions/new?'+q({category:'general',title:o.title||'Feedback: '+first,body:o.text+'\\n\\n---\\n'+o.env})})}
  function plain(){return [kind==='bug'?'Bug: '+v('title'):(v('title')&&'Feedback: '+v('title')),(kind==='bug'?'What went wrong?\\n':'')+v('text'),
    kind==='bug'&&v('steps')&&'How to make it happen\\n'+v('steps'),kind==='bug'&&v('expected')&&'Expected\\n'+v('expected'),env()].filter(Boolean).join('\\n\\n')}
  function ok(){var need=kind==='bug'?['title','text']:['text'],bad=need.filter(function(n){return !v(n)});
    need.forEach(function(n){E[n].setAttribute('aria-invalid',String(bad.indexOf(n)>=0))});
    if(bad.length){E[bad[0]].focus();say(kind==='bug'?'Add a short title and what went wrong.':'Write your feedback first.');return false}return true}
  [].forEach.call(f.querySelectorAll('input,textarea'),function(el){el.addEventListener('input',function(){el.removeAttribute('aria-invalid')})});
  f.addEventListener('submit',function(e){e.preventDefault();if(!ok())return;var u=url(),w=window.open(u,'_blank','noopener');if(!w&&onPage)location.href=u;
    say('GitHub opened in a new tab. Check it there and press Submit.');E.title.value='';E.text.value='';E.steps.value='';E.expected.value='';
    if(!onPage)setTimeout(function(){var dl=f.closest('dialog');if(dl&&dl.open)dl.close()},1600)});
  f.querySelector('[data-copy]').addEventListener('click',function(){if(!ok())return;
    (navigator.clipboard?navigator.clipboard.writeText(plain()):Promise.reject()).then(function(){say('Copied. Paste it into an e-mail or message.')},function(){say('Couldn\\'t copy. Select the text and copy it yourself.')})});
  f.setKind=setKind;setKind(onPage&&location.hash==='#feedback'?'feedback':'bug');
  [].forEach.call(f.querySelectorAll('select'),dropdown);
}
// The modern dropdown: a button and a listbox in place of each <select>, which keeps the value.
var ddN=0,CHEV='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  TICK='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
function dropdown(sel){
  var id='fbw-dd-'+(++ddN)+'-'+Math.random().toString(36).slice(2,6),field=sel.parentNode,cap=field.querySelector('span');
  var wrap=d.createElement('div');wrap.className='fbw-dd';field.insertBefore(wrap,sel);wrap.appendChild(sel);sel.tabIndex=-1;sel.setAttribute('aria-hidden','true');
  var btn=d.createElement('button'),val=d.createElement('span'),list=d.createElement('ul');
  btn.type='button';btn.className='fbw-dd-btn';btn.setAttribute('aria-haspopup','listbox');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls',id);
  if(cap){cap.id=id+'-c';cap.addEventListener('click',function(){btn.focus()})}val.id=id+'-v';btn.setAttribute('aria-labelledby',(cap?cap.id+' ':'')+val.id);
  btn.appendChild(val);btn.insertAdjacentHTML('beforeend',CHEV);
  list.className='fbw-dd-list';list.id=id;list.setAttribute('role','listbox');list.hidden=true;if(cap)list.setAttribute('aria-labelledby',cap.id);
  var act=0,opts=[].map.call(sel.options,function(o,i){var li=d.createElement('li'),t=d.createElement('span');li.setAttribute('role','option');li.id=id+'-'+i;
    li.innerHTML=TICK;t.textContent=o.text;li.appendChild(t);
    li.addEventListener('mousedown',function(e){e.preventDefault()});li.addEventListener('mousemove',function(){if(act!==i)hi(i,true)});
    li.addEventListener('click',function(){pick(i);close(true)});list.appendChild(li);return li});
  wrap.appendChild(btn);wrap.appendChild(list);
  function sync(){val.textContent=sel.options[sel.selectedIndex].text;opts.forEach(function(li,i){li.setAttribute('aria-selected',String(i===sel.selectedIndex))})}
  function hi(i,mouse){act=i;opts.forEach(function(li,j){li.classList.toggle('on',j===i)});btn.setAttribute('aria-activedescendant',opts[i].id);if(!mouse)opts[i].scrollIntoView({block:'nearest'})}
  function pick(i){if(sel.selectedIndex!==i){sel.selectedIndex=i;sel.dispatchEvent(new Event('change',{bubbles:true}))}sync()}
  function open(){if(!list.hidden)return;list.hidden=false;btn.setAttribute('aria-expanded','true');
    var box=wrap.closest('dialog'),r=btn.getBoundingClientRect(),lo=box?box.getBoundingClientRect():{top:0,bottom:innerHeight},h=list.offsetHeight+12;
    wrap.classList.toggle('up',r.bottom+h>lo.bottom&&r.top-h>lo.top);hi(sel.selectedIndex)}
  function close(focus){if(list.hidden)return;list.hidden=true;btn.setAttribute('aria-expanded','false');btn.removeAttribute('aria-activedescendant');if(focus)btn.focus()}
  btn.addEventListener('click',function(){if(list.hidden)open();else close()});
  btn.addEventListener('keydown',function(e){var k=e.key,n=opts.length;
    if(list.hidden){if(k==='ArrowDown'||k==='ArrowUp'||k==='Enter'||k===' '){e.preventDefault();open()}return}
    if(k==='ArrowDown'){e.preventDefault();hi((act+1)%n)}else if(k==='ArrowUp'){e.preventDefault();hi((act-1+n)%n)}
    else if(k==='Home'){e.preventDefault();hi(0)}else if(k==='End'){e.preventDefault();hi(n-1)}
    else if(k==='Enter'||k===' '){e.preventDefault();pick(act);close(true)}
    else if(k==='Escape'){e.preventDefault();e.stopPropagation();close(true)}else if(k==='Tab')close()});
  d.addEventListener('click',function(e){if(!wrap.contains(e.target))close()});
  sel.addEventListener('change',sync);sync();
}
var page=d.querySelector('.fb-card .fbw-form');if(page)setup(page,true);
var dlg=d.getElementById('fbw'),fab=d.querySelector('.fbw-fab');if(!dlg||!dlg.show)return;
var f=dlg.querySelector('.fbw-form'),narrow=matchMedia('(max-width: 600px)');setup(f,false);
// A panel in the corner (not a modal): Esc, the ✕, the button again or a click elsewhere closes it.
function open(k){f.setKind(k);if(!dlg.open)dlg.show();if(fab)fab.setAttribute('aria-expanded','true');setTimeout(function(){f.elements[k==='bug'?'title':'text'].focus()},50)}
function close(back){if(!dlg.open)return;dlg.close();if(back&&fab)fab.focus({preventScroll:true})}
dlg.addEventListener('close',function(){if(fab)fab.setAttribute('aria-expanded','false')});
if(fab)fab.addEventListener('click',function(){if(dlg.open)close(true);else open('feedback')});
dlg.querySelector('.fbw-x').addEventListener('click',function(){close(true)});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&dlg.open)close(true)});
// Links to /feedback/ (the footer's) open the panel; on phones they go to the page.
d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');
  if(a&&a.origin===location.origin&&/\\/feedback\\/$/.test(a.pathname)&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!narrow.matches){e.preventDefault();open(a.hash==='#feedback'?'feedback':'bug');return}
  if(dlg.open&&!dlg.contains(e.target)&&!(fab&&fab.contains(e.target)))close(false)});
})();`;

// The popup, and on the home page the floating Feedback button that opens it (fab). Other pages get the
// popup only, opened by the footer's Report a bug / Send feedback links. guide: true moves the button above
// the guide's back-to-top button.
function feedbackWidget(ctx, { guide = false, fab = true } = {}) {
  const repo = releasesRepo(ctx.site);
  return `<div class="fbw-root${guide ? ' fbw-guide' : ''}${fab ? ' fbw-hasfab' : ''}">
<style>${FB_CSS.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ')}</style>
${fab ? `<button class="fbw-fab" type="button" aria-haspopup="dialog" aria-controls="fbw" aria-expanded="false" title="Report a bug or send feedback">${FB_ICON}${FB_X}<span>Feedback</span></button>` : ''}
<dialog id="fbw" class="fbw" aria-labelledby="fbw-h">
  <div class="fbw-head"><h2 id="fbw-h">Help improve ${esc(ctx.site.name)}</h2><button class="fbw-x" type="button" aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
  <div class="fbw-body">
    <p class="fbw-lead">Found a bug, or have an idea? Using the app? <b>Feedback</b> in its sidebar fills in the versions for you.</p>
    ${feedbackForm(ctx)}
  </div>
</dialog>
<script>${FB_SCRIPT(repo)}</script>
</div>`;
}

// /feedback/: the same form on a page of its own, for direct links and browsers without <dialog>.
function feedbackPage(ctx) {
  const { site, abs } = ctx;
  const repo = releasesRepo(site);
  return head(ctx, { title: `Report a bug or send feedback | ${site.name}`, description: `Found a problem in ${site.name} or its phone app, or have an idea? Report a bug or send feedback on GitHub.`, canonical: abs('feedback/') }) +
`<style>${FB_CSS}</style>
</head>
<body>
${header(ctx, false)}
<main id="main">
<section class="hero st-hero" aria-labelledby="fb-h">
  <div class="wrap fb-wrap">
    <p class="kicker">Help improve ${esc(site.name)}</p>
    <h1 id="fb-h">Report a bug or send feedback</h1>
    <p class="lead">Something not working, or an idea to make ${esc(site.name)} better? Tell us here. Using the app? <b>Feedback</b> in its sidebar (or <b>Settings › About</b> in the phone app) does the same and fills in the versions for you.</p>
  </div>
</section>
<section class="st-body" aria-label="Form">
  <div class="wrap fb-wrap">
    <noscript><p class="lead">This form needs JavaScript. You can also <a href="https://github.com/${repo}/issues/new?template=bug_report.yml">report a bug</a> or <a href="https://github.com/${repo}/discussions/new?category=general">send feedback</a> on GitHub directly.</p></noscript>
    <div class="fb-card">${feedbackForm(ctx)}</div>
  </div>
</section>
</main>
${footer(ctx)}
<script>${FB_SCRIPT(repo)}${THEME_SCRIPT}</script>
</body>
</html>
`;
}

module.exports = { home, notFound, compare, androidPage, statsPage, feedbackPage, feedbackWidget };
