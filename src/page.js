// Renders the homepage and the 404 page as HTML strings.
'use strict';
const icon = require('./icons');

// Light / dark: the header's switch. The choice is kept in localStorage ("theme"), shared by the
// homepage and the guide; picking what the computer already uses forgets it, so the page follows the
// computer again.
const THEME_HEAD = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;
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
function head(ctx, { title, description, canonical, index = true, extra = '' }) {
  const { site, base, abs } = ctx;
  return `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<script>${THEME_HEAD}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${index ? `<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">` : '<meta name="robots" content="noindex">'}
<meta name="theme-color" content="#E9E9E6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#151617" media="(prefers-color-scheme: dark)">
<meta name="application-name" content="${esc(site.name)}">
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
<meta property="og:image" content="${abs('img/og.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(site.name + ': ' + site.tagline)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${abs('img/og.png')}">
<style>${ctx.css}</style>
`;
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
  return `<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap">
    <a class="brand" href="${base}" title="${esc(site.name)} home">${wordmark(ctx, 126)}</a>
    <nav class="nav" aria-label="Main">
      <a href="${h}#features">Features</a>
      <a href="${h}#companion">Phone app</a>
      <a href="${h}#how-it-works">How it works</a>
      <a href="${h}#faq">FAQ</a>
      <a href="${base}compare/">Compare</a>
      ${ctx.guide ? `<a href="${base}guide/">User guide</a>` : ''}
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
          <li><a href="${base}#companion">Phone app</a></li>
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
          <li><a href="${site.repoPc}" rel="noopener">Desktop app on GitHub</a></li>
          <li><a href="${site.repoAndroid}" rel="noopener">Android app on GitHub</a></li>
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

function downloads(ctx) {
  const { site, content, release } = ctx;
  const cards = content.download.os.map((os) => {
    const files = release ? release.files.filter((f) => f.platform === os.id) : [];
    const list = site.directDownloads && files.length
      ? `<ul class="files">${files.map((f) => `<li><a href="${f.url}" rel="noopener">${esc(f.name)}</a> · ${mb(f.size)}</li>`).join('')}</ul>`
      : '';
    return `<li data-os="${os.id}">
          <span class="yours">Your computer</span>
          <h3>${os.name}</h3>
          <p>${os.note}</p>
          <p>${os.kinds}</p>
          <a class="btn" href="${site.releases}" rel="noopener">${icon('download')}Download for ${os.name}</a>
          ${list}
        </li>`;
  }).join('\n        ');
  const version = release ? `Version ${esc(release.version)}, released ${new Date(release.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}. ` : '';
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
      <p class="meta">${version}Downloads are hosted on <a href="${site.releases}" rel="noopener">GitHub Releases</a>.${renamed}</p>
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

const OS_SCRIPT = `(function(){var n=navigator,p=((n.userAgentData&&n.userAgentData.platform)||n.platform||'')+' '+n.userAgent;if(/Android|iPhone|iPad/i.test(p))return;var os=/Win/i.test(p)?'windows':/Mac/i.test(p)?'mac':/Linux|X11/i.test(p)?'linux':'';if(!os)return;var c=document.querySelector('[data-os="'+os+'"]');if(c)c.classList.add('is-yours');var t={windows:'Windows',mac:'macOS',linux:'Linux'}[os];document.querySelectorAll('[data-dl]').forEach(function(e){e.textContent='Download for '+t})})();`;

// Motion: the header gets a shadow once the page scrolls, and blocks fade and slide in as they
// reach the screen (style.css, "Motion"). Nothing is hidden unless this script runs and the visitor
// hasn't asked for reduced motion, so the page reads the same without it.
const MOTION_SCRIPT = `(function(){
var top=document.querySelector('.top');
if(top){var s=function(){top.classList.toggle('scrolled',window.scrollY>8)};addEventListener('scroll',s,{passive:true});s();}
if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var sel='.spot-text,.shot,.head,.faq-grid>div:first-child,.group,.phones figure,.comp>div:last-child>h2,.care li,.steps li,.download .box,.os li,.faq details,.cmp-wrap,.why li,.alt,.built li,.cmp-cta';
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
    <p class="pill">${esc(c.hero.eyebrow)}</p>
    <h1 id="hero-h">${esc(c.hero.h1)}</h1>
    <p class="lead">${esc(c.hero.lead)}</p>
    <div class="cta">
      <a class="btn btn-dark" href="#download">${icon('download')}<span data-dl>Download ${esc(site.name)}</span></a>
      <a class="btn btn-light" href="#features">See what it does${icon('arrow')}</a>
    </div>
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
      <li><b>Windows</b> 64-bit and ARM64</li>
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
      ${mascot(ctx, 'toolkit-checklist', 'm-comp', 150)}
    </div>
    <div>
      <p class="kicker">On the phone</p>
      <h2 id="companion-h">${esc(c.companion.h)}</h2>
      <p class="lead" style="margin-top:16px">${esc(c.companion.p)}</p>
      <ul class="care">
        ${c.companion.items.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('\n        ')}
      </ul>
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
${footer(ctx)}
<script>${OS_SCRIPT}${MOTION_SCRIPT}${THEME_SCRIPT}</script>
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
    <p class="pill">${esc(c.kicker)}</p>
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
${footer(ctx)}
<script>${OS_SCRIPT}${MOTION_SCRIPT}${THEME_SCRIPT}</script>
</body>
</html>
`;
}

module.exports = { home, notFound, compare };
