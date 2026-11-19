# Andromon website

The homepage for Andromon, built for search engines: one fast static page, the user guide at `/guide/`, and the files crawlers look for. No dependencies; Node 18 or later is enough.

```
npm run build     # writes dist/
npm run serve     # builds, then previews at http://127.0.0.1:4173
npm run images    # remakes the pictures from the apps' screenshots
npm run sync      # rebuilds the user guide from the apps' guides and copies it (guide/) and the latest release (release.json) in
```

Upload the contents of `dist/` to any static host (Cloudflare Pages, Netlify, GitHub Pages, nginx). On Netlify, `netlify.toml` already says what to run and publish: connect the repository and deploy. Until `"url"` is set, the site uses Netlify's own address.

## Before going live

1. Set `"url"` in `site.config.json` to the real address, for example `https://andromon.app`, and run `npm run build`. Until then `robots.txt` blocks search engines on purpose, so the placeholder address is never indexed. (`SITE_URL=https://… npm run build` also works.) An address with a path, such as a GitHub Pages project site, is supported.
2. Publish a release on GitHub. The download buttons point at the Releases page (`"releases"` in the config). Set `"directDownloads": true` to also list each installer with its size, read from `../pc/latest.json`.
3. Add the site to Google Search Console and Bing Webmaster Tools, and submit `https://your-address/sitemap.xml`.

## Where things are

| File | What it holds |
|---|---|
| `site.config.json` | Name, address, page title and description, GitHub links |
| `src/content.js` | Every word on the pages, including the questions and answers and the Compare page (`compare`: its feature marks, alternatives and credits) |
| `src/page.js` | The HTML, meta tags and structured data |
| `src/style.css` | The design: brand colours, light and dark, phone to desktop |
| `src/icons.js` | Line icons |
| `static/assets` | The logo with the name (`logo.png`, used in the header and footer as `img/wordmark-*.webp`) and the mascot pictures (`andromon-<name>.png`, transparent). Only the source: `npm run images` turns them into `static/img/mascot-<name>-200/400.webp`, and the build leaves this folder out of the site |
| `tools/images.js` | Makes `static/img` from `pc/docs/screenshots`, `android/docs/screenshots` `static/assets` and `pc/build/icon.png` |
| `build.js` | Puts it together, writes `sitemap.xml`, `robots.txt`, `site.webmanifest`, `404.html`, and checks the result |

`npm run images` needs `cwebp` and ImageMagick (`brew install webp imagemagick`), and Google Chrome for the link-preview picture (`og.png`). The pictures it makes are kept in `static/img`, so a normal build needs none of these.

## What is done for search engines

**Settings** (`"seo"` in `site.config.json`):

| Setting | What it does |
|---|---|
| `googleSiteVerification` | The code Google Search Console gives for the "HTML tag" method; added as `google-site-verification` on every page |
| `bingSiteVerification` | The same for Bing Webmaster Tools (`msvalidate.01`) |
| `twitter` | Your X/Twitter handle, for `twitter:site` on link previews |
| `indexPreviewDeploys` | Leave `false`: Netlify deploy previews and branch deploys are then kept out of search results (`robots.txt` and `X-Robots-Tag: noindex`), so only the published site is indexed |


- **Title and description** written around what people search for ("Android phone manager", Windows, Mac, Linux). The build fails if the title passes 60 characters or the description 160.
- **One `<h1>`**, and section headings that match searches: mirror Android screen to PC, send text messages from computer, transfer files between Android and PC, remove bloatware without root, how to connect an Android phone to a computer.
- **Structured data** (JSON-LD): `SoftwareApplication` (free, operating systems, version from `pc/latest.json`, screenshots, feature list), `FAQPage` from the same questions shown on the page, `WebSite` and `Organization`. No ratings or review counts are claimed.
- **Canonical address, Open Graph and Twitter tags**, with a 1200×630 preview picture.
- **`sitemap.xml`** with each page's screenshots (image sitemap) and the date its files last changed in git, **`robots.txt`**, web manifest, favicons, a `404.html` that is marked noindex.
- **Link previews per page**: `og.png` for the homepage, Compare and the guide, `og-android.png` for the Android page (both made by `npm run images`).
- **The user guide** (`/guide/`) gets its own title, description, canonical address, link-preview tags and `TechArticle` structured data at build time.
- **`llms.txt`**: a short plain-text map of the site and its questions and answers, for AI assistants and answer engines.
- **Speed**: CSS is inlined, there is no framework and no third-party request, fonts are self-hosted and preloaded, screenshots are WebP in two widths with `srcset`, the first picture is preloaded and the rest load lazily, and every picture has its width and height so the page doesn't jump.
- **Accessibility**: alt text on every picture (checked by the build), a skip link, visible keyboard focus, questions as native `<details>`, reduced-motion respected.
- **A Compare page** at `/compare/` ("Andromon vs AirDroid, Phone Link, Vysor and scrcpy"), linked from the menu and footer, with breadcrumb structured data and the same build checks as the homepage. Check competitors' sites before changing a mark; the page says when it was last checked (`asOf`).
- **The user guide** is copied to `/guide/` with its own canonical address and linked from the page, so the site has depth beyond one page.

## Names

The product is **Andromon**: the desktop app, its installers and the phone app (Andromon Companion) all carry the name. It used to be called Droid Desk; `"formerName"` in `site.config.json` puts that name in the structured data as an alternate name, so people searching for it still find the page. Remove it once nobody does.

## Licences

Poppins (`static/fonts`) is under the SIL Open Font License. The icons follow Lucide's style (ISC).
