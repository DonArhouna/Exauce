# Modélisation EXAUCE — Backend & Back-office

> **Statut : M0.** Cette documentation est la référence unique pour la
> conception du Backend (FastAPI + PostgreSQL + Docker) et du Back-office
> d'EXAUCE Audit & Conseils SAS. Aucune ligne de backend n'est écrite tant
> que la modélisation n'est pas validée.

## Périmètre

- ✅ Analyse, diagrammes, exigences, scénarios, dictionnaire de données, ADR.
- ❌ Code applicatif backend, migrations exécutées, données réelles du cabinet.

## Conventions d'identifiants

| Préfixe | Signification | Exemple |
|---|---|---|
| `EF-` | Exigence fonctionnelle | EF-012 |
| `ENF-` | Exigence non fonctionnelle | ENF-003 |
| `UC-` | Cas d'usage | UC-007 |
| `US-` | User story | US-014 |
| `SC-` | Scénario | SC-023 |
| `ADR-` | Architecture Decision Record | ADR-002 |
| `H-` | Hypothèse (validée par défaut, réfutable) | H-001 |
| `Q-` | Question ouverte pour le cabinet | Q-001 |

Priorisation des exigences : **MoSCoW** (Must / Should / Could / Won't).
Statuts des pages : 🟢 validé · 🟡 à faire valider · 🔴 écarté.

## Installation

```bash
cd Analyse/modelisation
python -m venv .venv
.venv\Scripts\activate       # Windows (Linux/macOS : source .venv/bin/activate)
pip install -r requirements.txt   # ⚠️ mkdocs est épinglé < 2 : Material est incompatible avec MkDocs 2.0 (plugin system supprimé)
mkdocs serve                 # http://localhost:8000
npm ci                       # installe l'outillage Mermaid (mmdc + Chromium)
node scripts/check-mermaid.cjs # valide tous les blocs mermaid avec mmdc
mkdocs build --strict          # vérification sans avertissement
```

## Règles éditoriales

- Une page = un sujet ; pages courtes, fortes liens transverses.
- Tout diagramme est en Mermaid, validé par `scripts/check-mermaid.cjs`.
- Un diagramme = un sujet, ≤ 15 éléments environ, avec titre « Figure X »
  et un texte explicatif court avant/après.
- Aucun fait métier inventé (clients, tarifs, délais, engagements, mentions
  légales) : les inconnues sont tracées en `H-` ou `Q-`.
- Chaque section concernée traite le multi-langue, pas seulement la page 07.
- Bloqueurs de mise en ligne (RB-x, page 01) : aucune mise en production
  tant que les contenus légaux ne sont pas validés par le cabinet.
