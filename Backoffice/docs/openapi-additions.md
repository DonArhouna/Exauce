# PR contrat OpenAPI — back-office : pages, workflow, MFA, médias, arborescence

Branche : `backoffice/main`. **Ne pas fusionner : le Backend relit.** Aucun
endpoint ni schéma n'est retiré ; les ajouts sont compatibles avec le client
existant.

## Résumé

| Nature | Contenu |
|---|---|
| **Ajouté (chemins)** | `/admin/auth/mfa/enroll`, `/admin/auth/mfa/enroll/confirm`, `/admin/auth/mfa/recovery-codes`, `/admin/users/{id}/mfa/reset`, `/admin/section-types`, `/admin/pages/{id}/submit-review`, `/admin/pages/{id}/approve`, `/admin/pages/{id}/reject`, `/admin/pages/{id}/publish`, `/admin/sections/{id}/content/{lang}`, `/admin/tree/{id}`, `/admin/media/limits`, `/admin/media/{id}/replace`, `/admin/partners`, `/admin/partners/{id}`, `/partners`, `/admin/publications/{id}/media`, `/admin/publications/{id}/media/{media_id}` |
| **Ajouté (schémas)** | `AdminLoginMfaEnrollmentRequired`, `AdminMfaEnrollment`, `AdminMfaEnrollmentConfirmed`, `RecoveryCodes`, `SectionType{,List}`, `SectionField`, `SectionConfig`, `SectionMedia`, `SectionVideo`, `SectionContentUpdate`, `SectionMutationResult`, `PageTransitionRequest`, `NodeTranslations`, `MediaUsage`, `MediaLimits`, `MediaLimit`, `Partner{,Upsert,List}`, `PublicationMedia{,Upsert,List}` |
| **Modifié** | `AdminLoginRequest` (`recovery_code`), `AdminLoginResponse` (3 issues), `AdminSessionUser` (`mfa_enrollment_required`), `Problem.code` (9 codes), `PageSummary`/`PageDetail` (énumération de statut, `revision`, `titles`, `slugs`, `section_count`), `Section`/`SectionUpsert` (données par langue, `revision`), `MediaItem` (`video`, `translations`, usages, `scan_status`, dimensions), `Family`/`Domain`/`Group`/`PrestationItem` (`position`, `source_key`, `is_active`, `translations`), `NodeUpsert`, `PublicationDetail` (`media`, `media_count`, `cover_media_id` dérivés), `Role` (indicateur `viewer`) |
| **Modifié (opérations existantes)** | `GET /admin/media` (filtres dossier/usage/dates/tri), `PATCH` et `DELETE /admin/sections/{id}` (révision, `SectionMutationResult`), `POST /admin/pages/{id}/sections` (révision, réponse `{page, section}`) |
| **Retiré** | Rien. `Section.data` passe d'un objet plat à un objet par langue ; le client actuel n'écrit que par le mock, aucune rupture côté fil. |

Vérifications : `npx spectral lint … --ruleset .spectral.yaml` → **0 erreur,
69 avertissements** (contre 73 avant, tous des `operation-description`
préexistants ; les nouvelles opérations portent toutes une description).
`npm run api:types` régénéré, `npm run build` (tsc + vite) vert.

## 1. Authentification et MFA

Le login n'avait que deux issues (`authenticated`, `mfa_required`). Le rôle à
MFA obligatoire (`super_admin`, `admin`, `crm`) sans TOTP enrôlé n'était pas
représentable.

- `AdminLoginMfaEnrollmentRequired` : troisième branche de
  `AdminLoginResponse`, `status=mfa_enrollment_required`, `enrollment_token`
  court (5 min, usage unique) et `required_role`. Aucun cookie de session :
  le jeton n'ouvre que les endpoints d'enrôlement.
- `POST /admin/auth/mfa/enroll` renvoie `AdminMfaEnrollment` (secret base32,
  URI `otpauth`, `digits`, `period`, `algorithm`) **une seule fois**.
- `POST /admin/auth/mfa/enroll/confirm` valide le premier code, active le MFA
  et **crée la session** quand l'appel vient d'un login, en renvoyant les dix
  `recovery_codes`.
- `AdminLoginRequest.recovery_code` : alternative au code TOTP quand
  l'application d'authentification est inaccessible.
- `POST /admin/auth/mfa/recovery-codes` régénère les codes (mot de passe exigé,
  codes précédents invalidés).
- `POST /admin/users/{id}/mfa/reset` : réinitialisation par un tiers
  (`users:edit`), révoque les sessions, **refuse l'auto-réinitialisation**
  (`403`). `AdminSessionUser.mfa_enrollment_required` alimente l'écran bloquant
  côté client.

Codes ajoutés : `MFA_ALREADY_ENABLED`, `MFA_ENROLLMENT_REQUIRED`,
`MFA_CODE_INVALID`, `RECOVERY_CODE_INVALID`.

## 2. Workflow éditorial

`draft → in_review → approved → published`, rejet `in_review → draft`,
`archived` terminal. Quatre opérations distinctes, chacune avec sa permission
et `PageTransitionRequest` (`revision` obligatoire, `comment` obligatoire au
rejet) :

| Opération | Transition | `x-permission` |
|---|---|---|
| `POST /admin/pages/{id}/submit-review` | `draft → in_review` | `pages:edit` |
| `POST /admin/pages/{id}/approve` | `in_review → approved` | `pages:review` |
| `POST /admin/pages/{id}/reject` | `in_review → draft` | `pages:review` |
| `POST /admin/pages/{id}/publish` | `approved → published` | `pages:publish` |

**Pas d'auto-approbation** : l'auteur d'une soumission ne peut pas l'approuver,
même avec `pages:review` ; refus `403 AUTO_APPROVAL_FORBIDDEN`. Toutes
renvoient `PageDetail` (donc la nouvelle `revision`) et documentent
`409 CONFLICT` (révision périmée) et `409 INVALID_TRANSITION` (statut
incompatible). La publication ajoute `409 SECTION_MEDIA_ALT_MISSING` et `422`
sur `banners_pending`.

## 3. Sections

- `GET /admin/section-types` expose le catalogue (`SectionType` : `code`,
  `label` localisé, `usage`, `editable`, `media_slots`, `fields`). Les
  formulaires se génèrent depuis `SectionField` (`text`, `textarea`, `list`,
  `media`, `video`, `number`, `boolean`, `max_length`, `item_fields`) : plus
  aucun champ codé en dur par type. Un type `editable=false` s'affiche en
  lecture seule et refuse l'écriture (`409 SECTION_TYPE_NOT_EDITABLE`).
- `Section.data` est **par langue** : `{ "fr": {...}, "en": {...} }`. Une langue
  absente signifie « non traduite ».
- Écriture séparée : `PUT /admin/sections/{id}/content/{lang}` avec
  `x-permission: [pages, edit, lang]` (RBAC par langue, `403
  NOT_PERMITTED_LANG`). `PATCH /admin/sections/{id}` ne touche plus que la
  structure (`position`, `is_active`) et `DELETE` prend `revision` en
  paramètre.
- Concurrence : `PageDetail.revision` obligatoire dans toute mutation,
  `409 CONFLICT` sinon. `PageDetail` porte aussi `titles`/`slugs` bilingues et
  `section_count`.
- Réponse de mutation unifiée : `SectionMutationResult { page, section }`, pour
  que le client garde `revision` et l'ordre sans seconde requête.
- `SectionConfig` (media, gallery, video) est enfin **décrit** : `SectionMedia`
  (media, decorative, alt et légende par langue) et `SectionVideo` (provider,
  video_id, poster, transcription). Sans schéma, les blocs média finissaient en
  champs codés en dur.

## 4. Arborescence des services

- `Family`, `Domain`, `Group`, `PrestationItem` exposent `source_key`,
  `position`, `is_active` et `translations` (`title`, `slug` par langue) ; le
  client peut afficher les ancres en lecture seule, l'ordre réel et l'état
  actif.
- `NodeUpsert` accepte `translations` et `is_active` dès la création.
- `PATCH /admin/tree/{id}` : activation et position (`x-permission:
  [tree, move, default]`). Le renommage reste `PUT
  /admin/content/node/{id}/translation/{lang}`.

## 5. Médias P1

- **Pas de dossier en API** : la médiathèque regroupe à l'écran en déduisant
  le dossier de `kind` (`image`, `video`, `pdf`, `document`) ; aucun champ
  `folder` n'est stocké, donc aucun endpoint de déplacement de dossier.
  `kind` gagne `video`.
- **Limites en configuration** : `GET /admin/media/limits` →
  `MediaLimits` (`mime[]`, `max_bytes`, dimensions et durée maximales par
  `kind`). Aucune limite n'est recopiée dans le client.
- **Où le média est utilisé** : `usage_count`, `usages[]`
  (`entity_type`, `entity_id`, `title`, `edit_path`) renseignés sur
  `GET /admin/media/{id}`, ce qui rend lisible le `409` de suppression.
- **Filtres** : `kind`, `usage` (`used`/`unused`), `created_from`,
  `created_to`, `sort`.
- **Alt et légende par langue** : `translations.{fr,en}.{alt,caption}` ;
  `alt`/`caption` restent la valeur de `lang` (rétro-compatible).
- **Remplacement** : `POST /admin/media/{id}/replace` (même `id`, mêmes
  références, ancien fichier en `status=replaced`, poster et durée recalculés).
- **Motifs de refus lisibles** : `errors[0].code` ∈ `MIME_NOT_ALLOWED`,
  `TOO_LARGE`, `INFECTED` ; `scan_status` (`pending`/`clean`/`infected`) ;
  `MEDIA_IN_USE` pour le `409` de suppression.

## 6. Partenaires

Nouveau domaine, absent du contrat et de la modélisation, rattaché au module
`pages` (contenu éditorial, pas de 12ᵉ permission) :

- `GET|POST /admin/partners`, `PATCH|DELETE /admin/partners/{id}` ;
  `GET /partners` public (actifs seuls, triés par `position`).
- `Partner` : `code` stable, `logo_media_id`, `website_url`, `position`,
  `is_active`, `translations` (nom, description par langue). Suppression
  logique réservée à `pages:delete`.

## 7. Médias de publication

- `GET|POST /admin/publications/{id}/media`,
  `PATCH|DELETE /admin/publications/{id}/media/{media_id}`.
- `PublicationMedia` : `position` **unique par publication**
  (`409 POSITION_CONFLICT`), `source` ∈ `upload` | `external`, `media_id` ou
  `external_url`, `poster_media_id`, `alt`/`caption` par langue, `duration_ms`.
- **Dérivés, en lecture seule** : `PublicationDetail.media_count` et
  `cover_media_id` (média de plus petite `position`, ou son poster s'il s'agit
  d'une vidéo), recalculés après chaque mutation ; `cover_url` existant suit.

## 8. `viewer` — à confirmer

`Role` porte désormais la mention explicite : le seed n'accorde **aucune**
permission à `viewer`, alors que le Backoffice a besoin de `pages:view` et
`publications:view` pour que le compte de lecture voie les écrans. Le contrat
ne tranche pas (les rôles sont des données) ; point ouvert Backend, sans effet
sur les types.

## 9. Déjà livré dans cette branche (rappel)

`GET|POST /admin/publications`, `GET /admin/leads/{id}`, `x-permission` sur les
opérations admin, tableau de bord accessible par simple authentification et
filtré par le serveur, `AdminDashboard` aux groupes optionnels.

## 10. Décisions à valider par le Backend

1. **Rattachement des partenaires** au module `pages` (plutôt qu'un module
   dédié).
2. **`Section.data` par langue** : objet `{lang: data}` assumé, face à
   `entity_translations` par champ déjà présent en base.
3. **`revision`** comme verrou optimiste de page, y compris pour les sections
   (pas de révision par section).
4. **`PATCH /admin/sections/{id}` scindé** de l'écriture des textes : la
   position relève de `default`, les textes de `lang`.
5. **Codes d'erreur** ajoutés (`AUTO_APPROVAL_FORBIDDEN`,
   `SECTION_MEDIA_ALT_MISSING`, `POSITION_CONFLICT`, `MEDIA_IN_USE`,
   `SECTION_TYPE_NOT_EDITABLE`) : à reprendre dans la table du Backend.
6. **`GET /admin/media/limits`** : les limites vivent-elles dans
   `site_settings` (groupe `media`) comme supposé ?

## 11. Portée côté Backoffice

Le mock du Backoffice implémente déjà ces comportements (mock local), mais
`Backoffice/docs/mock-divergences.md` décrit encore l'état d'avant cette PR :
il sera mis à jour quand le contrat sera fusionné et le client branché sur le
réseau. Aucun fichier de `src/` n'est modifié par cette PR, hormis
`generated/schema.d.ts` (régénéré) et les MIME vidéo de `lib/media.ts`, requis
par l'ajout de `kind: video`.
