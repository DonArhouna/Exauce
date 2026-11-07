// Génération de public/sitemap.xml depuis la table de slugs centrale.
// Usage: node scripts/generate-sitemap.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = fs.readFileSync(path.join(root, 'src/data/content.data.ts'), 'utf8');

const ORIGINS = { fr: 'https://www.exauceac.com/fr', en: 'https://www.exauceac.com/en' };

// Pages statiques (dupliqué de PAGE_SLUGS — régénéré par hand, table courte)
const PAGES = [
  ['', ''],
  ['services', 'services'],
  ['interventions', 'interventions'],
  ['secteurs', 'sectors'],
  ['publications', 'publications'],
  ['partenaires', 'partners'],
  ['a-propos', 'about-us'],
  ['mentions-legales', 'legal-notice'],
  ['espace-client', 'customer-area'],
  ['contact', 'contact'],
];

// Familles + domaines (source de vérité : content.data.ts)
const FAMILIES = [
  {
    fr: 'accompagnement',
    en: 'support',
    domains: [
      ['gouvernance', 'governance', ['niveau-associes', 'shareholders-level'], ['niveau-administrateurs', 'administrators-level']],
      ['organisation-strategie', 'organization-strategy', ['strategie-inter-entreprise', 'inter-company-strategy'], ['strategie-intra-entreprise', 'intra-company-strategy'], ['organisation-structurelle-fonctionnelle', 'structural-functional-organization']],
      ['audit-controle-interne', 'audit-internal-control', ['fonction-audit-interne', 'internal-audit-function'], ['systeme-controle-interne', 'internal-control-system']],
      ['systeme-information', 'information-system', ['application-logicielle', 'software-application'], ['progiciel-gestion-integre', 'enterprise-resource-planning'], ['dematerialisation-numerisation', 'dematerialization-digitization']],
      ['gestion-financiere', 'financial-management', ['comptabilite', 'accounting'], ['gestion-operationnelle', 'operational-management'], ['compilation-information-financiere', 'financial-information-compilation'], ['reporting-financier', 'financial-reporting']],
      ['juridique-fiscale', 'legal-tax', ['secretariat-juridique', 'legal-secretariat'], ['conformite-fiscale', 'tax-compliance'], ['optimisation-fiscale', 'tax-optimization']],
      ['gestion-ressources-humaines', 'human-resources-management', ['secretariat-social', 'social-secretariat'], ['grh', 'hr-management'], ['traitement-de-la-paye', 'payroll-processing']],
    ],
  },
  {
    fr: 'audit-externe',
    en: 'external-audit',
    domains: [['audit-legal', 'legal-audit'], ['audit-contractuel', 'contractual-audit'], ['examen-limite', 'limited-review']],
  },
];

const INTERVENTIONS = [['recurrentes', 'recurring'], ['ponctuelles', 'one-off']];
const SECTORS = [['public', 'public'], ['prive', 'private'], ['non-gouvernemental', 'non-governmental']];
// Publications : extraits de content.data.ts (slug: { fr: …, en: … } commençant par exemple- / sample-)
const PUBLICATIONS = [...src.matchAll(/slug:\s*\{\s*fr:\s*'(exemple-[^']+)',\s*en:\s*'(sample-[^']+)'\s*\},?/g)].map((m) => [m[1], m[2]]);

const urls = [...PAGES];
for (const fam of FAMILIES) {
  urls.push([`services/${fam.fr}`, `services/${fam.en}`]);
  for (const d of fam.domains) urls.push([`services/${fam.fr}/${d[0]}`, `services/${fam.en}/${d[1]}`]);
}
for (const i of INTERVENTIONS) urls.push([`interventions/${i[0]}`, `interventions/${i[1]}`]);
for (const s of SECTORS) urls.push([`secteurs/${s[0]}`, `sectors/${s[1]}`]);
for (const p of PUBLICATIONS) urls.push([`publications/${p[0]}`, `publications/${p[1]}`]);

const entry = ([fr, en]) => {
  const hf = ORIGINS.fr + (fr ? `/${fr}` : '');
  const he = ORIGINS.en + (en ? `/${en}` : '');
  const links = fr || en
    ? `    <xhtml:link rel="alternate" hreflang="fr" href="${hf}" />\n    <xhtml:link rel="alternate" hreflang="en" href="${he}" />\n`
    : '';
  return `  <url>\n    <loc>${hf}</loc>\n${links}  </url>`;
};

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<!--\n  Sitemap — généré depuis la table de slugs centrale (scripts/generate-sitemap.mjs).\n  TODO(backend) : régénérer avec les publications réelles.\n-->\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
xml += urls.map(entry).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(root, 'public/sitemap.xml'), xml, 'utf8');
console.log('sitemap.xml régénéré :', urls.length, 'URLs,', PUBLICATIONS.length, 'publications');
