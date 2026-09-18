// Browser QA baseline: 320, 375, 768, 1024, and 1440px.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { URL } from 'node:url';

const root = process.cwd();
const pages = ['index.html','absensi.html','berita.html','fasilitas.html','galeri.html','guru.html','kontak.html','profil.html','siswa.html'];
const viewports = [320,375,768,1024,1440];

const mime = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml'
};

const server = createServer(async (req,res)=>{
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    const safe = normalize(pathname).replace(/^(..(\/|\\|$))+/, '');
    const file = join(root, safe === '/' ? 'index.html' : safe.replace(/^[/\\]/,''));
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    res.writeHead(200, {'Content-Type': mime[extname(file)] || 'application/octet-stream'});
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, {'Content-Type':'text/plain'});
    res.end('Not found');
  }
});

await new Promise(resolve => server.listen(4173,'127.0.0.1',resolve));

const browser = await chromium.launch({headless:true});
const failures = [];
const screenshots = [];

for (const width of viewports) {
  for (const pageName of pages) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const localFailures = [];
    page.on('requestfailed', request => {
      const url = request.url();
      if (url.startsWith('http://127.0.0.1:4173/')) localFailures.push(`request failed: ${url} — ${request.failure()?.errorText || 'unknown'}`);
    });
    page.on('response', response => {
      const url = response.url();
      if (url.startsWith('http://127.0.0.1:4173/') && response.status() >= 400) {
        localFailures.push(`HTTP ${response.status()}: ${url}`);
      }
    });

    const url = `http://127.0.0.1:4173/${pageName}`;
    await page.goto(url, {waitUntil:'networkidle', timeout:30000});
    await page.waitForTimeout(250);

    const result = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHeader: !!document.querySelector('.header'),
      hasMain: !!document.querySelector('main'),
      title: document.title,
      brokenImages: [...document.images].filter(img => img.getAttribute('src') && img.complete && img.naturalWidth === 0).map(img => ({src: img.src, alt: img.alt, cls: img.className})),
      overflowElements: [...document.querySelectorAll('body *')].map(el => ({el, rect: el.getBoundingClientRect()})).filter(x => x.rect.right > innerWidth + 1 || x.rect.left < -1).slice(0, 12).map(x => ({tag: x.el.tagName, cls: String(x.el.className).slice(0,120), id: x.el.id, left: Math.round(x.rect.left), right: Math.round(x.rect.right), width: Math.round(x.rect.width)})),
      localLinks: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => h && !h.startsWith('#') && !h.startsWith('mailto:') && !h.startsWith('tel:') && !/^https?:/i.test(h))
    }));

    if (result.scrollWidth > width + 1) failures.push(`${pageName} @ ${width}px: horizontal overflow ${result.scrollWidth}px`);
    if (!result.hasHeader || !result.hasMain) failures.push(`${pageName} @ ${width}px: missing core layout`);
    if (result.brokenImages.length) failures.push(`${pageName} @ ${width}px: broken images: ${result.brokenImages.join(', ')}`);
    if (localFailures.length) failures.push(...localFailures.map(x => `${pageName} @ ${width}px: ${x}`));

    const checked = new Set();
    for (const href of result.localLinks) {
      const target = new URL(href, url);
      const key = target.pathname;
      if (checked.has(key)) continue;
      checked.add(key);
      const response = await page.request.get(target.href);
      if (response.status() >= 400) failures.push(`${pageName}: broken local link ${href} (HTTP ${response.status()})`);
    }

    if ([320,375,768,1024,1440].includes(width) && pageName === 'index.html') {
      await page.screenshot({ path: `qa-artifacts/index-${width}.png`, fullPage: true });
      screenshots.push(`index-${width}.png`);
    }

    await page.close();
  }
}

await browser.close();
await new Promise(resolve => server.close(resolve));

console.log(`Responsive QA completed for ${pages.length} pages × ${viewports.length} viewports.`);
console.log(`Screenshots: ${screenshots.join(', ')}`);
if (failures.length) {
  console.error('FAILURES');
  for (const failure of failures) console.error('-', failure);
  process.exit(1);
}
console.log('All browser QA checks passed.');
