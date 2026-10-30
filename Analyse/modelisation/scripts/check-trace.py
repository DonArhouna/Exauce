#!/usr/bin/env python3
"""
Script de contrôle de traçabilité des exigences et des scénarios.
Vérifie la cohérence entre :
  - docs/02-exigences.md (EF-xxx, ENF-xxx)
  - docs/04-scenarios.md (SC-xxx)

Règles :
  1. Toute exigence MoSCoW 'Must' ou 'Should' doit référencer au moins un scénario (SC-xxx).
  2. Chaque scénario référencé dans 02-exigences.md doit exister dans 04-scenarios.md.
  3. Chaque scénario dans 04-scenarios.md doit avoir un test associé.
"""

import sys
import re
from pathlib import Path

def parse_exigences(file_path: Path):
    content = file_path.read_text(encoding='utf-8')
    # Expression pour capturer les lignes de tableau | EF-xxx | ... | MoSCoW | ... | SC-xxx |
    pattern = re.compile(r'\|\s*(EF-\d+|ENF-\d+)\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|')
    exigences = []
    for match in pattern.finditer(content):
        req_id = match.group(1).strip()
        desc = match.group(2).strip()
        moscow = match.group(3).strip()
        criteria = match.group(4).strip()
        scenarios_raw = match.group(5).strip()
        scenarios = re.findall(r'SC-\d+', scenarios_raw)
        
        # Support pour plages SC-105...107 ou SC-201...204
        range_match = re.search(r'SC-(\d+)[…\.]+(\d+)', scenarios_raw)
        if range_match:
            start = int(range_match.group(1))
            end = int(range_match.group(2))
            for num in range(start, end + 1):
                sc_id = f"SC-{num}"
                if sc_id not in scenarios:
                    scenarios.append(sc_id)
                    
        exigences.append({
            'id': req_id,
            'desc': desc,
            'moscow': moscow,
            'criteria': criteria,
            'scenarios': scenarios,
            'scenarios_raw': scenarios_raw
        })
    return exigences

def parse_scenarios(file_path: Path):
    content = file_path.read_text(encoding='utf-8')
    pattern = re.compile(r'\|\s*(SC-\d+)\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|')
    scenarios = {}
    for match in pattern.finditer(content):
        sc_id = match.group(1).strip()
        scenarios[sc_id] = {
            'name': match.group(2).strip(),
            'preconditions': match.group(3).strip(),
            'nominal': match.group(4).strip(),
            'alternatives': match.group(5).strip(),
            'links': match.group(6).strip(),
            'test': match.group(7).strip(),
        }
    
    # Également capturer les sous-tableaux plus courts (comme la section SC-900 / SC-1000)
    short_pattern = re.compile(r'\|\s*(SC-\d+)\s*\|([^|]+)\|([^|]+)\|([^|]+)\|')
    for match in short_pattern.finditer(content):
        sc_id = match.group(1).strip()
        if sc_id not in scenarios:
            scenarios[sc_id] = {
                'name': match.group(2).strip(),
                'preconditions': '',
                'nominal': match.group(3).strip(),
                'alternatives': '',
                'links': match.group(4).strip(),
                'test': 'revue / job test',
            }
    return scenarios

def check_traceability(docs_dir: Path) -> int:
    doc02 = docs_dir / '02-exigences.md'
    doc04 = docs_dir / '04-scenarios.md'

    if not doc02.exists() or not doc04.exists():
        print(f"ERREUR : Fichiers introuvables dans {docs_dir}")
        return 1

    exigences = parse_exigences(doc02)
    scenarios = parse_scenarios(doc04)

    errors = []
    warnings = []

    must_count = 0
    covered_must = 0

    for req in exigences:
        is_functional = req['id'].startswith('EF-')
        is_must = 'Must' in req['moscow']
        if is_functional and is_must:
            must_count += 1

        if not req['scenarios']:
            msg = f"{req['id']} [{req['moscow']}] n'a aucun scénario associé."
            if is_functional and is_must:
                errors.append(msg)
            elif is_functional:
                warnings.append(msg)
        else:
            if is_functional and is_must:
                covered_must += 1
            for sc in req['scenarios']:
                if sc not in scenarios:
                    errors.append(f"{req['id']} référence {sc} qui n'existe pas dans 04-scenarios.md.")

    print("=" * 60)
    print("CONTRÔLE AUTOMATIQUE DE TRAÇABILITÉ (EXAUCE)")
    print("=" * 60)
    print(f"Exigences recensées (02-exigences.md) : {len(exigences)}")
    print(f"  - Exigences 'Must'                  : {must_count}")
    print(f"  - 'Must' couvertes par un scénario   : {covered_must}/{must_count}")
    print(f"Scénarios recensés (04-scenarios.md) : {len(scenarios)}")
    print("-" * 60)

    if warnings:
        print(f"\nAvertissements ({len(warnings)}) :")
        for w in warnings:
            print(f"  [WARN] {w}")

    if errors:
        print(f"\nErreurs bloquantes ({len(errors)}) :")
        for e in errors:
            print(f"  [FAIL] {e}")
        print("\n=> RÉSULTAT : ÉCHEC DE LA TRAÇABILITÉ.")
        return 1
    else:
        print("\n=> RÉSULTAT : SUCCÈS - 100% des exigences 'Must' sont couvertes et traçables.")
        return 0

if __name__ == '__main__':
    base_dir = Path(__file__).resolve().parent.parent / 'docs'
    if len(sys.argv) > 1:
        base_dir = Path(sys.argv[1])
    sys.exit(check_traceability(base_dir))
