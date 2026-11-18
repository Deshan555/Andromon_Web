#!/usr/bin/env node
// Prepares the homepage's pictures from the apps' own screenshots and icon:
//   static/img/*.webp        screenshots in two widths
//   static/img/icon-*.png    favicon, touch icon and manifest icons
//   static/favicon.ico
//   static/img/og.png        1200x630 picture for link previews
//   static/img/images.json   sizes, read by build.js
// Needs cwebp and ImageMagick (brew install webp imagemagick); og.png also needs
// Google Chrome. Run again whenever the screenshots change:  npm run images
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const WEB = path.join(__dirname, '..');
const ROOT = path.join(WEB, '..');
const OUT = path.join(WEB, 'static/img');
const site = JSON.parse(fs.readFileSync(path.join(WEB, 'site.config.json'), 'utf8'));

const PC = path.join(ROOT, 'pc/docs/screenshots');
const PHONE = path.join(ROOT, 'android/docs/screenshots');
const ICON = path.join(ROOT, 'pc/build/icon.png');

// key: [source file, widths]
const SHOTS = {
  overview: [path.join(PC, 'overview.png'), [960, 1600]],
  mirror: [path.join(PC, 'mirror.png'), [720, 1280]],
  messages: [path.join(PC, 'messages.png'), [720, 1280]],
  photos: [path.join(PC, 'photos.png'), [720, 1280]],
  apps: [path.join(PC, 'apps.png'), [720, 1280]],
  'phone-home': [path.join(PHONE, 'pc-link.png'), [270, 540]], // the companion opens on its PC link screen
  'phone-cleaner': [path.join(PHONE, 'cleaner.png'), [270, 540]],
  'phone-battery': [path.join(PHONE, 'battery.png'), [270, 540]],
};

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

fs.mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const [key, [src, widths]] of Object.entries(SHOTS)) {
  const { w: sw, h: sh } = pngSize(src);
  manifest[key] = { variants: [] };
  for (const w of widths.filter((x) => x <= sw)) {
    const h = Math.round((sh * w) / sw);
    const file = `${key}-${w}.webp`;
    run('cwebp', ['-quiet', '-q', '86', '-sharp_yuv', '-resize', String(w), String(h), src, '-o', path.join(OUT, file)]);
    manifest[key].variants.push({ file, w, h });
  }
  console.log(key.padEnd(14), manifest[key].variants.map((v) => `${v.w}w ${(fs.statSync(path.join(OUT, v.file)).size / 1024).toFixed(0)} KB`).join(', '));
}
fs.writeFileSync(path.join(OUT, 'images.json'), JSON.stringify(manifest, null, 2) + '\n');

// Icons
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  run('magick', [ICON, '-resize', `${size}x${size}`, '-strip', path.join(OUT, name)]);
}
run('cwebp', ['-quiet', '-q', '90', '-resize', '72', '72', ICON, '-o', path.join(OUT, 'logo-72.webp')]);
run('magick', [ICON, '-define', 'icon:auto-resize=48,32,16', path.join(WEB, 'static/favicon.ico')]);
console.log('icons          ok');

// Link-preview picture: a small page, photographed by headless Chrome.
const chrome = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find((p) => p && fs.existsSync(p));
if (!chrome) {
  console.warn('og.png         skipped: Chrome not found (set CHROME=/path/to/chrome)');
} else {
  const tmp = path.join(WEB, '.cache');
  fs.mkdirSync(tmp, { recursive: true });
  const u = (p) => 'file://' + encodeURI(p);
  const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Poppins;font-weight:400;src:url(${u(path.join(WEB, 'static/fonts/poppins-400.woff2'))})}
@font-face{font-family:Poppins;font-weight:600;src:url(${u(path.join(WEB, 'static/fonts/poppins-600.woff2'))})}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:linear-gradient(135deg,#E3F786,#9CD237);font-family:Poppins,sans-serif;color:#292A2C;position:relative}
.t{position:absolute;left:64px;top:64px;width:500px}
.b{display:flex;align-items:center;gap:18px;font-weight:600;font-size:40px}
.b img{width:76px;height:76px;border-radius:20px}
h1{font-weight:400;font-size:58px;line-height:1.1;letter-spacing:-.02em;margin:54px 0 0}
p{font-size:25px;margin:26px 0 0;color:#3d3e40}
.s{position:absolute;left:610px;top:96px;width:900px;border-radius:22px;box-shadow:0 40px 80px -30px rgba(41,42,44,.55)}
</style><div class="t"><div class="b"><img src="${u(ICON)}">${site.name}</div><h1>${site.tagline}</h1><p>Windows · macOS · Linux</p></div><img class="s" src="${u(path.join(OUT, 'overview-1600.webp'))}">`;
  const page = path.join(tmp, 'og.html');
  fs.writeFileSync(page, html);
  run(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1200,630',
    '--virtual-time-budget=3000', `--user-data-dir=${path.join(tmp, 'chrome')}`, `--screenshot=${path.join(OUT, 'og.png')}`, u(page)]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('og.png         ' + (fs.statSync(path.join(OUT, 'og.png')).size / 1024).toFixed(0) + ' KB');
}
