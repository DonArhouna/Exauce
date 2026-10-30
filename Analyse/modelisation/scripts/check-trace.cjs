#!/usr/bin/env node
/**
 * Script Node.js équivalent à check-trace.py
 * Contrôle de traçabilité des exigences (02-exigences.md) et des scénarios (04-scenarios.md).
 */

const fs = require('fs');
const path = require('path');

const docsDir = process.argv[2] 
  ? path.resolve(process.argv[2]) 
  : path.resolve(__dirname, '../docs');

const doc02Path = path.join(docsDir, '02-exigences.md');
const doc04Path = path.join(docsDir, '04-scenarios.md');

if (!fs.existsSync(doc02Path) || !fs.existsSync(doc04Path)) {
  console.error(`ERREUR : Fichiers introuvables dans ${docsDir}`);
  process.exit(1);
}

const doc02 = fs.readFileSync(doc02Path, 'utf8');
const doc04 = fs.readFileSync(doc04Path, 'utf8');

// Parse 02-exigences.md
const reqPattern = /\|\s*(EF-\d+|ENF-\d+)\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/g;
let match;
const exigences = [];

while ((match = reqPattern.exec(doc02)) !== null) {
  const reqId = match[1].trim();
  const desc = match[2].trim();
  const moscow = match[3].trim();
  const criteria = match[4].trim();
  const scenariosRaw = match[5].trim();
  
  const scenarios = (scenariosRaw.match(/SC-\d+/g) || []);
  const rangeMatch = scenariosRaw.match(/SC-(\d+)[…\.]+(\d+)/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    for (let i = start; i <= end; i++) {
      const scId = `SC-${i}`;
      if (!scenarios.includes(scId)) scenarios.push(scId);
    }
  }

  exigences.push({ id: reqId, desc, moscow, criteria, scenarios });
}

// Parse 04-scenarios.md
const scPattern = /\|\s*(SC-\d+)\s*\|([^|]+)\|/g;
const scenarios = new Set();
while ((match = scPattern.exec(doc04)) !== null) {
  scenarios.add(match[1].trim());
}

const errors = [];
const warnings = [];
let mustCount = 0;
let coveredMust = 0;

for (const req of exigences) {
  const isFunctional = req.id.startsWith('EF-');
  const isMust = req.moscow.includes('Must');
  if (isFunctional && isMust) mustCount++;

  if (req.scenarios.length === 0) {
    const msg = `${req.id} [${req.moscow}] n'a aucun scénario associé.`;
    if (isFunctional && isMust) errors.push(msg);
    else if (isFunctional) warnings.push(msg);
  } else {
    if (isFunctional && isMust) coveredMust++;
    for (const sc of req.scenarios) {
      if (!scenarios.has(sc)) {
        errors.push(`${req.id} référence ${sc} qui n'existe pas dans 04-scenarios.md.`);
      }
    }
  }
}

console.log('='.repeat(60));
console.log('CONTRÔLE AUTOMATIQUE DE TRAÇABILITÉ (EXAUCE)');
console.log('='.repeat(60));
console.log(`Exigences recensées (02-exigences.md) : ${exigences.length}`);
console.log(`  - Exigences 'Must'                  : ${mustCount}`);
console.log(`  - 'Must' couvertes par un scénario   : ${coveredMust}/${mustCount}`);
console.log(`Scénarios recensés (04-scenarios.md) : ${scenarios.size}`);
console.log('-'.repeat(60));

if (warnings.length > 0) {
  console.log(`\nAvertissements (${warnings.length}) :`);
  warnings.forEach(w => console.log(`  [WARN] ${w}`));
}

if (errors.length > 0) {
  console.log(`\nErreurs bloquantes (${errors.length}) :`);
  errors.forEach(e => console.log(`  [FAIL] ${e}`));
  console.log('\n=> RÉSULTAT : ÉCHEC DE LA TRAÇABILITÉ.');
  process.exit(1);
} else {
  console.log('\n=> RÉSULTAT : SUCCÈS - 100% des exigences "Must" sont couvertes et traçables.');
  process.exit(0);
}
