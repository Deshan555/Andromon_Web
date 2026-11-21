# Andromon website

The homepage for Andromon, built for search engines: one fast static page, the user guide at `/guide/`, and the files crawlers look for. No dependencies; Node 18 or later is enough.

```
npm run build     # writes dist/
npm run serve     # builds, then previews at http://127.0.0.1:4173
npm run images    # remakes the pictures from the apps' screenshots
npm run sync      # rebuilds the user guide from the apps' guides and copies it (guide/) in, and downloads the newest release's latest.json (release.json)
```

Upload the contents of `dist/` to any static host (Cloudflare Pages, Netlify, GitHub Pages, nginx). On Netlify, `netlify.toml` already says what to run and publish: connect the repository and deploy. Until `"url"` is set, the site uses Netlify's own address.

## Before going live

1. Set `"url"` in `site.config.json` to the real address, for example `https://andromon.app`, and run `npm run build`. Until then `robots.txt` blocks search engines on purpose, so the placeholder address is never indexed. (`SITE_URL=https://… npm run build` also works.) An address with a path, such as a GitHub Pages project site, is supported.
2. Publish a release in [Andromon_Releases](https://github.com/Deshan555/Andromon_Releases) (the `automation` branch of Andromon_PC does it). The download section has a card for Windows, macOS, Linux and Android, each listing that system's files from the release with their sizes.
3. Add the site to Google Search Console and Bing Webmaster Tools, and submit `https://your-address/sitemap.xml`.

## Downloads

The download section (`downloads()` in `src/page.js`) is built from `release.json`, the newest release's `latest.json` (refreshed by `npm run sync`), so it works without JavaScript. In the browser, a small script then:

- works out the visitor's system and CPU type: Chrome and Edge say it outright (`navigator.userAgentData`); otherwise it is read from the user agent, and on a Mac from the graphics chip, because Safari and Firefox call every Mac "Intel";
- marks that card **Your computer** (or **Your phone**) and points its button at the right file: Windows 64-bit, ARM64 or 32-bit; Mac Apple Silicon or Intel; Linux AppImage for 64-bit or ARM64; the APK on an Android phone;
- reads the live `latest.json` (`"latestJson"` in `site.config.json`), so a new release shows up without rebuilding the site. When GitHub can't be reached, the links from the build stay.

`"releases"` is where "all files" and the structured data point.

**Download stats** are at `/stats/` (`statsPage()` in `src/page.js`). Nothing on the site links to it, so open it directly. The page isn't in the sitemap, tells search engines not to index it, and isn't counted by GoatCounter. It reads GitHub's own per-file download counts for the `"releases"` repository in the browser, so it needs no build step, server or tracking. GitHub allows 60 of these checks an hour per network, so a result is kept for 5 minutes (**Refresh** skips that). Totals leave out the checksums, changelog and `latest.json`.

**Report a bug / send feedback**: every page (the user guide too, but not `/stats/`) has a floating **Feedback** button at the bottom right that opens the form in a popup (`feedbackWidget()` in `src/page.js`; it carries its own styles and script so build.js can add it to the guide). The footer's Report a bug / Send feedback links open the same popup. `/feedback/` has the form on a page of its own for direct links; `/feedback/#feedback` opens it on the feedback form. Like the apps' Feedback dialogs, it sends nothing itself: it opens GitHub with the form filled in (an issue through `bug_report.yml`, or a discussion in the "General" category of the `"releases"` repository), and the visitor presses Submit there. **Copy text** is for people without a GitHub account.

**Visits and countries** come from [GoatCounter](https://www.goatcounter.com) (`"goatcounter"` in `site.config.json`, the address of the site's `/count` endpoint; leave it empty to turn it off). It sets no cookies and stores nothing personal, so there's no consent banner. Every page and the user guide load it, except `/stats/`. Netlify preview deploys leave it out, and it ignores `localhost`. A click on any release file (the download buttons) is counted as an event named `download/<file>`, so the dashboard at https://andromon.goatcounter.com shows which files are taken and from which countries. It only sees downloads started on this site, not ones from GitHub or the app's update check.

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
