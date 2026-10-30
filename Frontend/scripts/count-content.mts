// Compte les familles / domaines / prestations du fichier de données.
// Exécuté via tsx (devDependency transitif de esbuild) : npx tsx scripts/count-content.ts
import { SERVICES, INTERVENTIONS, SECTORS } from '../src/data/content.data';

let totalItems = 0;
console.log('=== CATALOGUE SERVICES (vs docx) ===');
for (const f of SERVICES) {
  let famItems = 0;
  console.log(`Famille: ${f.id}`);
  for (const d of f.domains) {
    const items = d.groups.reduce((a, g) => a + g.items.length, 0);
    famItems += items;
    totalItems += items;
    console.log(
      `  ${d.id}: ${d.groups.length} groupes, ${items} prestations`,
      d.groups.map((g) => `${g.id}[${g.items.length}]`).join(' '),
    );
  }
  console.log(`  → ${famItems} prestations`);
}
console.log(`TOTAL prestations niveau 4 : ${totalItems}`);
console.log('Interventions:', INTERVENTIONS.length, '| Secteurs:', SECTORS.length, '| Sous-catégories secteurs:', SECTORS.reduce((a, s) => a + s.categories.length, 0));
const counts: Record<string, number> = {};
for (const f of SERVICES) for (const d of f.domains) for (const g of d.groups) for (const it of g.items) counts[it.fr] = (counts[it.fr] ?? 0) + 1;
const dupes = Object.entries(counts).filter(([, n]) => n > 1);
console.log('Doublons de prestations:', dupes.length === 0 ? 'aucun' : dupes);
