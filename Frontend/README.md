# EXAUCE Audit & Conseils — Frontend

Site vitrine bilingue (FR défaut / EN) pour **EXAUCE Audit & Conseils SAS**
(société d'expertise comptable, de conseil, d'audit et de formation, Dakar).
React 18 + Vite + TypeScript + Tailwind + Framer Motion.

## Installation

```bash
cd Frontend
npm install --legacy-peer-deps
npm run dev        # http://localhost:5173
```

> `--legacy-peer-deps` est nécessaire pour la combinaison vite@5 / vitest@2.1.9.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement Vite |
| `npm run build` | `tsc -b && vite build` (contrôle TS + bundle `/dist`) |
| `npm run lint` | ESLint (0 erreur exigée) |
| `npm run test` | Vitest (tests de contenu + formulaire) |
| `npm run preview` | sert le build de `/dist` |

## Structure

```
src/
  data/content.data.ts      # SOURCE DE VÉRITÉ : services, secteurs, interventions, publications, contacts validés
  i18n/locales/{fr,en}.json # tous les textes FR/EN (aucune chaîne en dur dans les composants)
  types/content.ts          # types partagés (LocalizedText, Publication, Location…)
  lib/routes.ts             # traduction de slugs FR ↔ EN
  pages/                    # une page par route (lazy-loaded)
  components/layout/        # Header, Footer, SearchOverlay, CookieBanner, PageHero…
  components/sections/      # HeroSection, TrustBar, StatsSection…
  components/ui/            # Button, Card, Section, Motion, SpeedLines (motif signature)
  services/api/api.ts       # interfaces réseau actuelles = mocks (mêmes signatures que le futur backend)
docs/
  api-contract.md           # contrat des futurs endpoints FastAPI
  propositions-secteurs.md  # descriptifs proposés (non intégrés au site)
public/
  sitemap.xml, robots.txt, favicon*
```

## Conventions

- **Contenu** : tout texte passe par `content.data.ts` (données) ou les clés i18n
  (`useTranslation` → `t('secteur.…')`). Aucune chaîne littrale dans les pages.
- **Couleurs** : uniquement via les tokens Tailwind (`turquoise`, `ink`, `abyss`,
  `ivory`, `champagne`) définis dans `tailwind.config.ts`.
- **Placeholders** : tout contenu non fourni est marqué visiblement
  (« contenu à venir », « à compléter par le cabinet »). Rien n'est inventé.
- **Fonts** : Fraunces (display) + Inter (texte), graisses limitées.
- **Mouvement** : Framer Motion, respecte `prefers-reduced-motion`.

## Comment ajouter…

- **Une prestation** : `content.data.ts` → `SERVICES[].domains[].groups[].items`
  (fr + en). Vérifier `npm run test` (total = 94 actuellement).
- **Une traduction** : ajouter la clé aux deux fichiers `locales/*.json`
  (elles doivent rester symétriques).
- **Une publication** : `content.data.ts` → `PUBLICATIONS_MOCK` (ou plus tard via
  le backend : voir `docs/api-contract.md`, `GET /publications`). Mettre
  `status: 'draft'` + préfixe « Exemple » tant que non validé.
- **Une adresse** : `content.data.ts` / `ORGANIZATION` + sections
  `locations` des locales — uniquement des valeurs validées par le cabinet.

## Branchement backend (FastAPI)

`src/services/api/api.ts` expose des fonctions mockées avec les signatures
finales ; il suffira de remplacer leur corps par des appels HTTP conformément
à `docs/api-contract.md` (GET /publications, POST /contact, POST /auth/login…).
Aucune donnée réelle ne quitte le navigateur aujourd'hui.

## Données de contact

Téléphones et e-mail proviennent du docx source et sont considérés validés ;
aucune adresse postale n'affichée tant que non fournie.
