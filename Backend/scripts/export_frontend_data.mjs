// Export JSON fige de la source frontend pour le seed (doc 13 section 4).
// Genere :
//   app/seed/data/content_data.json  <- Frontend/src/data/content.data.ts
//   app/seed/data/locales.json       <- Frontend/src/i18n/locales/{fr,en}.json
//
// Usage : node scripts/export_frontend_data.mjs <frontend-src> <out-dir>
// Aucune valeur n'est inventee : l'export est une copie fidele du source.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [srcDirRaw, outDirRaw] = process.argv.slice(2);
if (!srcDirRaw || !outDirRaw) {
  console.error('usage: node scripts/export_frontend_data.mjs <frontend-src> <out-dir>');
  process.exit(1);
}
const srcDir = resolve(srcDirRaw);
const outDir = resolve(outDirRaw);

// --- content.data.ts : on retire import, annotations de type et `as const`,
// puis on evalue le module (le fichier est du JS valide une fois nettoye).
let ts = readFileSync(join(srcDir, 'data', 'content.data.ts'), 'utf8');
ts = ts.replace(/^import[^\n]*\n/, '');
ts = ts.replace(/^export const /gm, 'const ');
ts = ts.replace(/\s+as const;/g, ';');
ts = ts.replace(/^(const \w+)[^=\n]*=/gm, '$1 =');
const names = [...ts.matchAll(/^const (\w+)/gm)].map((m) => m[1]);

const wanted = [
  'ORGANIZATION',
  'OFFICES',
  'SERVICES',
  'INTERVENTIONS',
  'SECTORS',
  'PUBLICATION_CATEGORIES',
  'PUBLICATIONS_MOCK',
];
for (const name of wanted) {
  if (!names.includes(name)) {
    console.error(`const ${name} introuvable dans content.data.ts`);
    process.exit(1);
  }
}

const tmp = join(outDir, '.tmp_content_data.cjs');
mkdirSync(outDir, { recursive: true });
writeFileSync(tmp, `${ts}\nmodule.exports = { ${wanted.join(', ')} };`, 'utf8');
const mod = await import(`file://${tmp.replace(/\\/g, '/')}`);
rmSync(tmp);

writeFileSync(
  join(outDir, 'content_data.json'),
  `${JSON.stringify({ _source: 'Frontend/src/data/content.data.ts', ...mod }, null, 2)}\n`,
  'utf8',
);

// --- locales : copie brute des deux fichiers i18n.
const locales = {
  _source: 'Frontend/src/i18n/locales/{fr,en}.json',
  fr: JSON.parse(readFileSync(join(srcDir, 'i18n', 'locales', 'fr.json'), 'utf8')),
  en: JSON.parse(readFileSync(join(srcDir, 'i18n', 'locales', 'en.json'), 'utf8')),
};
writeFileSync(join(outDir, 'locales.json'), `${JSON.stringify(locales, null, 2)}\n`, 'utf8');

console.log(`content_data.json : ${wanted.join(', ')}`);
console.log(`locales.json : fr=${Object.keys(locales.fr).length} sections, en=${Object.keys(locales.en).length} sections`);
