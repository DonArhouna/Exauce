// Télécharge Fraunces 600/700 + Inter 400/500/600 (subsets latin & latin-ext)
// et génère src/styles/fonts.css (auto-hébergé, font-display: swap).
// Usage: node scripts/fetch-fonts.mjs
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const CSS_URL = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap';
const OUT_DIR = 'public/fonts';

function get(url, binary = false) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if ((res.statusCode ?? 300) >= 300) return reject(new Error(`${res.statusCode} ${url}`));
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(binary ? Buffer.concat(chunks) : Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
  });
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const css = await get(CSS_URL);
const blocks = css.match(/\/\* [\w-]+ \*\/\s*@font-face\s*\{[^}]+\}/g) ?? [];
const wanted = new Set(['latin-ext', 'latin']);
const faces = [];
for (const block of blocks) {
  const subset = block.match(/\/\* ([\w-]+) \*\//)?.[1] ?? '';
  if (!wanted.has(subset)) continue;
  const family = block.match(/font-family: '([^']+)'/)?.[1];
  const weight = block.match(/font-weight: (\d+)/)?.[1];
  const range = block.match(/unicode-range: ([^;]+);/)?.[1];
  const url = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
  if (!family || !weight || !url) continue;
  const fname = `${family.toLowerCase()}-${weight}-${subset}.woff2`;
  fs.writeFileSync(path.join(OUT_DIR, fname), await get(url, true));
  faces.push(`@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('/fonts/${fname}') format('woff2');
  unicode-range: ${range};
}`);
}
fs.writeFileSync('src/styles/fonts.css', faces.join('\n\n') + '\n', 'utf8');
console.log('polices téléchargées :', faces.length);
