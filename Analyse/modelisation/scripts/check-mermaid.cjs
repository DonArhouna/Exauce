#!/usr/bin/env node
/**
 * check-mermaid — valide réellement les blocs ```mermaid de docs/*.md
 * en les rendant avec mermaid-cli (mmdc).
 * Usage : node scripts/check-mermaid.cjs [docs/05-domaine.md ...]
 * Sans argument : toutes les pages docs/*.md.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const docsDir = path.join(__dirname, '..', 'docs');
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(docsDir).filter(f => f.endsWith('.md')).map(f => path.join(docsDir, f));

let mmdc = path.join(__dirname, '..', 'node_modules', '.bin', 'mmdc');
if (process.platform === 'win32') mmdc += '.cmd';
if (!fs.existsSync(mmdc)) {
  console.error('mmdc introuvable. Installe : npm install --save-dev @mermaid-js/mermaid-cli');
  process.exit(2);
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mermaid-'));
let ok = 0, ko = 0;
const failures = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /```mermaid\r?\n([\s\S]*?)```/g;
  let m, idx = 0;
  while ((m = re.exec(src))) {
    idx++;
    const label = `${path.relative(docsDir, file)}#${idx}`;
    const mmdFile = path.join(tmpDir, `d${ok + ko}.mmd`);
    const outFile = path.join(tmpDir, `d${ok + ko}.svg`);
    fs.writeFileSync(mmdFile, m[1], 'utf8');
    const { execFileSync } = require('child_process');
    try {
      execFileSync(mmdc, ['-i', mmdFile, '-o', outFile, '--quiet'], {
        stdio: 'pipe',
        timeout: 60000,
        shell: true,
      });
      ok++;
      console.log(`OK    ${label}`);
    } catch (e) {
      ko++;
      const msg = String(e.stderr || e.message).split('\n').slice(0, 4).join(' | ');
      failures.push(label);
      console.error(`FAIL  ${label} :: ${msg}`);
    }
  }
}
console.log(`\nRésultat : ${ok} valides, ${ko} en erreur${failures.length ? ' → ' + failures.join(', ') : ''}`);
fs.rmSync(tmpDir, { recursive: true, force: true });
process.exit(ko ? 1 : 0);
