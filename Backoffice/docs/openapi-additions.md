# PR contrat OpenAPI — back-office : publications, détail de lead, RBAC, tableau de bord

Branche : `backoffice/main`. **Ne pas fusionner avant relecture et accord du Backend.**

## Résumé du diff

| Nature | Contenu |
|---|---|
| Ajouté | `GET /admin/publications`, `POST /admin/publications`, `GET /admin/leads/{id}` |
| Ajouté (schémas) | `PublicationList`, `PublicationCreate` |
| Modifié | `x-permission` déclaré sur toutes les opérations admin protégées (59 sur 67) |
| Modifié | `GET /admin/reports/dashboard` : accès par authentification seule, plus aucune `x-permission` |
| Modifié (correctif) | `POST /admin/auth/logout` : virgule non quotée dans la réponse `204` (seule erreur Spectral du fichier) |
| Retiré | Aucun endpoint, aucun schéma retiré |

Vérifications : `npx spectral lint Analyse/modelisation/docs/openapi.yaml` → **0 erreur, 73 avertissements**
(73 avant la PR ; les nouveaux blocs portent tous une description, ils n'ajoutent aucun avertissement).
`npm run api:types` puis `npm run build` → succès.

## Ajouté

### `GET /admin/publications`
- Vue éditoriale, tag `admin-content`, `x-permission: [publications, view, default]`.
- Paramètres : `status` (`draft`|`in_review`|`scheduled`|`published`|`archived`), `lang`, `cursor`, `limit`.
- `200` → `PublicationList` (`items: PublicationSummary[]`, `next_cursor`, `total`), `401`, `403`, `422`.

### `POST /admin/publications`
- Création d'un brouillon, tag `admin-content`, `x-permission: [publications, create, default]`.
- `Idempotency-Key` obligatoire, `X-CSRF-Token` via le schéma de sécurité `CsrfHeader`.
- `201` → `PublicationDetail`, `401`, `403`, `409`, `422`.

### `GET /admin/leads/{id}`
- Détail d'une demande avec ses notes internes, tag `admin-leads`, `x-permission: [leads, view, default]`.
- `200` → `LeadDetail`, `401`, `403`, `404`.

## Modifié

### `x-permission` sur les opérations admin

Convention `[module, action, scope]` (`default` ou `lang`). Couverture obtenue :

- `pages` : pages, sections, secteurs, types d'intervention, recherche admin (`view`, `create`, `edit`, `delete`).
- `tree` : arbre des services (`view`, `create`, `move`).
- `content` : versions, restauration, publication, traduction (`view`, `edit`, `publish`).
- `publications` : liste et création (`view`, `create`).
- `media` : médiathèque (`view`, `create`, `delete`).
- `leads` : liste, détail, statut, notes, export (`view`, `status`, `notes`, `export`).
- `users` : utilisateurs et rôles (`view`, `create`, `edit`, `deactivate`).
- `settings` : paramètres et registre des permissions (`view`, `edit`).
- `offices`, `team`, `seo`, `audit` : `view`/`create`/`edit`/`delete` selon l'opération.

Opérations admin volontairement **sans** `x-permission` (8) :

- `/admin/auth/login`, `/admin/auth/logout`, `/admin/auth/me`,
  `/admin/auth/password-forgot`, `/admin/auth/password-reset`,
  `/admin/auth/password-change`, `/admin/auth/activate` — porte d'entrée
  ou opérations sur sa propre session ;
- `/admin/reports/dashboard` — voir ci-dessous.

### `GET /admin/reports/dashboard`

- **Accès par authentification seule** : la permission `audit:view` a été retirée,
  l'opération ne déclare aucune `x-permission` et n'exige que le cookie de session
  (`security: [{SessionCookie: []}]`). Un compte sans `audit:view` voit donc la page.
- **Filtrage serveur** : chaque agrégat n'est présent que si la session détient la
  permission correspondante (`leads:view`, `publications:view`, `pages:view`,
  `settings:view`, `audit:view`). Un widget non autorisé est absent de la réponse ;
  le client ne décide jamais de l'autorisation, il n'affiche que ce qu'il reçoit.
- `401` si la session est absente ou expirée. Le `403` a été retiré : il n'existe
  plus de refus global sur cette opération.
- L'interface applique le même filtre pour ne pas rendre de bloc vide, sans que ce
  filtrage soit une mesure de sécurité.

### Schéma `AdminDashboard`
- Les six groupes (`leads`, `publications`, `content`, `publication`, `i18n`,
  `audit`) deviennent **optionnels** : seul `generated_at` reste obligatoire, et
  chaque groupe documente la permission qui le fait apparaître. C'est la
  traduction dans le contrat du filtrage serveur ; le client lit des groupes
  facultatifs au lieu d'interpréter un `403` global.

## Retiré

Aucun endpoint ni schéma n'est retiré. Les seules suppressions sont :

- la `x-permission: [audit, view, default]` du tableau de bord ;
- la réponse `403` devenue impossible sur ce même endpoint.

## Compatibilité

- Front : `src/services/api/generated/schema.d.ts` régénéré, aucune rupture de type
  (ajouts uniquement). `npm run build` (tsc + vite) passe.
- Backend : les nouvelles opérations sont à implémenter ; les `x-permission`
  ajoutées décrivent l'attendu de contrôle d'accès, pas un comportement déjà codé.

## Décisions à valider par le Backend

1. Le mapping `x-permission` par module (surtout `secteurs` et `types d'intervention`
   rattachés à `pages`, `roles` rattaché à `users`, `permissions` rattaché à `settings`,
   `recherche admin` rattachée à `pages/view`).
2. La pagination par curseur de `/admin/publications` (`next_cursor`) face aux `offset`
   utilisés ailleurs : choix assumé pour une liste qui reçoit des ajouts en tête.
3. `POST /admin/publications` : `Idempotency-Key` obligatoire, comme les autres créations
   sensibles du contrat.

## Vérification Spectral

```
npx spectral lint Analyse/modelisation/docs/openapi.yaml --ruleset .spectral.yaml
✖ 73 problems (0 errors, 73 warnings, 0 infos, 0 hints)
```

Les 73 avertissements sont des `operation-description` préexistants (antérieurs à cette
PR) ; ils ne bloquent pas et seront traités séparément.
