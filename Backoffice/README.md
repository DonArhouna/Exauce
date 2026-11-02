# EXAUCE — Back-office

Back-office du CMS métier d'**EXAUCE Audit & Conseils SAS** (Dakar). Application
React 18 + Vite + TypeScript + Tailwind, adossée au contrat
`Analyse/modelisation/docs/openapi.yaml`.

## Installation

```bash
cd Backoffice
npm install --legacy-peer-deps
npm run dev        # http://localhost:5174
```

> `--legacy-peer-deps` est nécessaire pour la combinaison vite@5 / vitest@2,
> comme dans `Frontend/`.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement Vite (port 5174) |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | ESLint (0 erreur exigée) |
| `npm test` | Vitest |
| `npm run mock:api` | serveur mock Prism depuis `openapi.yaml` (port 4010) |
| `npm run api:types` | régénère `src/services/api/generated/schema.d.ts` |

## Trois modes d'API, une seule couche

`src/services/api/client.ts` est le **seul** point de sortie réseau. Les écrans
consomment `src/services/api/endpoints/*`, jamais `fetch` directement.

| `VITE_API_MODE` | Cible | Usage |
|---|---|---|
| `mock` (défaut) | backend en mémoire, formes issues du contrat | développement des écrans, tests, états d'erreur |
| `prism` | `VITE_PRISM_BASE_URL` (Prism sur `openapi.yaml`) | vérification du contrat, exemples dynamiques |
| `http` | `VITE_API_BASE_URL` | API FastAPI réelle |

Prism ne pose pas de cookies `session_id` / `csrf_token` : il sert à contrôler la
conformité des formes de réponse, pas à dérouler un parcours connecté. Le mode
`mock` simule session, CSRF, verrouillage et expiration pour permettre le
développement complet sans backend.

### Comptes de démonstration (mode `mock` uniquement)

| Compte | Mot de passe | Rôle |
|---|---|---|
| `fondateur@exauceac.com` | `exauce-fondateur-2026` | super-administrateur (toutes les entrées) |
| `editeur@exauceac.com` | `exauce-editeur-2026` | éditeur (navigation restreinte) |
| `mfa@exauceac.com` | `exauce-mfa-2026` | MFA activé, code `123456` |
| `lecteur@exauceac.com` | `exauce-lecteur-2026` | démo uniquement : `pages:view` + `publications:view` (dashboard sans `leads:view` ni `audit:view`) |
| invitation | jeton `exauce-invitation-demo` | activation du compte fondateur |

## Sécurité

- Session par cookie `session_id` **HttpOnly** : aucun jeton d'authentification
  n'est écrit dans `localStorage`, `sessionStorage` ou un état persistant.
- Tous les appels partent avec `credentials: 'include'`.
- Toute mutation envoie `X-CSRF-Token`, recopié depuis le cookie `csrf_token`
  (ou le jeton émis par `POST /admin/auth/login` / `GET /admin/auth/me`).
- Un `401` global purge la session ; la garde de route redirige vers
  `/login?redirect=…&reason=session_expired`.
- Le RBAC masque les entrées non autorisées, **sans jamais** remplacer le
  contrôle serveur.

## Structure

```
src/
  app/            bootstrap, routeur, providers, gardes
  features/       auth, dashboard, contenu, relations, médias, site, administration
  components/     ui (design system), layout (coque), shared
  services/       api (client, endpoints, mock, types générés), auth, realtime
  i18n/           locales FR/EN symétriques
  lib/            utilitaires (cn, RFC 7807, dates, hotkeys)
  styles/         tokens et styles globaux
  __tests__/      tests transverses
```

## Conventions

- **Aucune couleur en dur** : uniquement les tokens de `tailwind.config.ts`,
  repris du Frontend (turquoise, ink, abyss, ivory, champagne).
- **Aucun texte en dur** : toute chaîne d'interface passe par `t('…')` ; les
  fichiers FR et EN doivent rester symétriques (test dédié).
- **Accessibilité** : navigation clavier complète, focus visible, `aria-label`
  sur les boutons-icônes, contrastes AA.
- **Contenu éditorial** : jamais rendu en HTML brut sans nettoyage côté serveur ;
  Markdown assaini uniquement (ADR-005).

## Écarts connus avec le contrat OpenAPI

Ces manques sont à porter en pull request sur `openapi.yaml` (revue Backend) ;
aucun contournement n'est codé ici.

1. Pas de `GET/POST /admin/publications` : l'écran Publications reste « bientôt
   disponible » alors que le menu existe.
2. Pas de `GET /admin/leads/{id}` : le lien profond vers un lead ne peut viser
   qu'une liste filtrée, pas une fiche.
3. `x-permission` absent sur de nombreux endpoints admin (`/admin/content/tree`,
   `/admin/pages`, `/admin/users`, `/admin/media`…) : le mapping RBAC de l'UI
   s'appuie sur `src/services/auth/permissions.ts`, à aligner avec le registre
   `GET /admin/permissions`.
4. Pas d'endpoint de préférences : langue d'interface et langue d'édition sont
   stockées localement (valeurs non sensibles, aucun jeton).
5. `/admin/search` renvoie un stub `not_implemented` : la palette Ctrl/Cmd+K se
   limite aux entrées de navigation.
