# Réponse Backend — revue du contrat OpenAPI (branche `backoffice/main`)

> **Destinataire : équipe Backoffice.** Revue des commits `9e12255`, `4dd04b2`,
> `58b4680` (+ `be3ab82`). **Verdict : accepté avec corrections requises**, à
> livrer en **une seule PR de contrat coordonnée** (cf. §4). Aucune autre PR
> parallèle.

## 1. Ce qui est validé en l'état

| Point | Verdict |
|---|---|
| Couverture `x-permission` : 67 opérations admin, 8 sans triplet = 7 routes d'auth + `GET /admin/reports/dashboard` | ✅ conforme à l'annonce |
| Dashboard ouvert à toute session authentifiée, agrégats filtrés serveur, `AdminDashboard.required = [generated_at]` seul | ✅ validé |
| `GET/POST /admin/publications`, `GET /admin/leads/{id}` + schémas `PublicationList`/`PublicationCreate` | ✅ |
| Triplets media / leads / offices / team / seo / users / settings / audit / clients / languages / backup | ✅ registre page 10 respecté (35 des 39 triplets distincts) |
| Intégrité mécanique : zéro `$ref` orpheline (schémas et paramètres), `idempotencyKey` défini, correction YAML `204 logout` | ✅ Spectral 0 erreur |

## 2. Corrections requises

### 2.1 Module `content` inexistant — mapping `entity_type` → module

Le registre fermé (doc 06 §2.3, page 10) n'a **pas** de module `content`.
4 opérations sont invalides : `adminPublishContent`, `adminListVersions`,
`adminRestoreVersion`, `adminPutTranslation`.

**Décision (propriétaire) : adopter le mapping type d'entité → module.**
Ajouter dans le contrat une **section dédiée** (voir §4) :

| `entity_type` (registre doc 06) | `permissions.module` |
|---|---|
| `page`, `page_section`, `sector`, `interventiontype` | `pages` |
| `publication`, `category` | `publications` |
| `node` | `tree` |
| `office` | `offices` |
| `team_member` | `team` |
| `media` | `media` |
| `setting` | `settings` |

Le triplet effectif d'une opération générique `{type}` se résout ainsi :
**module** = mapping ci-dessus, **action** = celle de l'opération
(`view`/`edit`/`publish`…), **scope** = `lang` si le module est
lang-scopable (page 10 : `pages`, `tree`, `publications`, `offices`, `team`,
`settings`, `seo`), sinon `default`.

Deux formes acceptables au choix du Backoffice (je relis) :

- **(a)** paramètre `x-permission-by: {path_param: type, action: …}` sur les
  4 opérations, qui référence la section de mapping ; ou
- **(b)** éclatement des routes par type (précédent déjà dans le contrat :
  `PUT /admin/content/media/{id}/translation/{lang}`).

### 2.2 `csrfHeader` manquant sur 29 mutations

Le paramètre `$ref: csrfHeader` doit être ajouté sur les 29 opérations
suivantes (hors routes d'auth) :

```
POST   /admin/content/tree                          adminCreateNode
POST   /admin/tree/{id}/move                        adminMoveNode
POST   /admin/content/{type}/{id}/publish           adminPublishContent
PUT    /admin/content/{type}/{id}/translation/{lang} adminPutTranslation
POST   /admin/content/{type}/{id}/restore/{version_id} adminRestoreVersion
PATCH  /admin/pages/{id}                            adminUpdatePage
POST   /admin/pages/{id}/sections                   adminAddSection
PATCH  /admin/sections/{id}                         adminUpdateSection
DELETE /admin/sections/{id}                         adminDeleteSection
POST   /admin/sectors                               adminCreateSector
PATCH  /admin/sectors/{id}                          adminUpdateSector
DELETE /admin/sectors/{id}                          adminDeleteSector
PATCH  /admin/intervention-types/{id}               adminUpdateInterventionType
POST   /admin/offices                               adminCreateOffice
PATCH  /admin/offices/{id}                          adminUpdateOffice
DELETE /admin/offices/{id}                          adminDeleteOffice
POST   /admin/team                                  adminCreateTeamMember
PATCH  /admin/team/{id}                             adminUpdateTeamMember
DELETE /admin/team/{id}                             adminDeleteTeamMember
PUT    /admin/settings/{group_key}                  adminUpdateSettingGroup
POST   /admin/media/upload                          adminUploadMedia
DELETE /admin/media/{id}                            adminDeleteMedia
POST   /admin/redirects                             adminCreateRedirect
DELETE /admin/redirects/{id}                        adminDeleteRedirect
POST   /admin/users                                 adminCreateUser
PATCH  /admin/users/{id}                            adminUpdateUser
POST   /admin/users/{id}/deactivate                 adminDeactivateUser
PATCH  /admin/leads/{id}/status                     adminUpdateLeadStatus
POST   /admin/leads/{id}/notes                      adminAddLeadNote
```

### 2.3 Rôles et permissions

- gestion des rôles → module `users` ✅ (votre demande est confirmée) ;
- gestion des permissions → module **`users`**, **pas `settings`**
  (correction de votre proposition : `settings` n'a que `view/edit` page 10).

### 2.4 Recherche admin

**Hors périmètre M1** (décision propriétaire) : marquer l'endpoint « à venir »
dans le contrat, **sans `x-permission`** — ne pas appliquer le mapping
`pages/view` proposé.

## 3. Réponses à `Backoffice/docs/openapi-additions.md`

| Demande Backoffice | Réponse Backend |
|---|---|
| secteurs → module `pages` | ✅ validé |
| types d'intervention → module `pages` | ✅ validé |
| rôles → module `users` | ✅ validé |
| permissions → module `settings` | ❌ → **`users`** (cf. §2.3) |
| recherche admin → `pages/view` | ❌ → **hors périmètre M1**, endpoint « à venir » sans module (cf. §2.4) |
| pagination curseur sur `GET /admin/publications` | ✅ accepté |
| `Idempotency-Key` sur `POST /admin/publications` | ✅ accepté (cohérent avec les écritures idempotentes du contrat) |

## 4. Périmètre de la PR unique coordonnée — **un seul commit**

**Qui fait le commit : l'équipe Backoffice.** Elle possède `openapi.yaml`, les
types générés et l'outillage Spectral ; je fournis la liste ci-dessous et je
**relis le commit avant fusion**. Aucune PR parallèle.

Contenu, dans un même commit :

1. **Section dédiée du contrat** : mapping `entity_type` → `permissions.module`
   (§2.1) + son application aux 4 opérations `content` ;
2. **`csrfHeader`** sur les 29 mutations (§2.2) ;
3. **Besoins média P1** (`Backoffice/docs/contract-needs-media.md` §2-§3) :
   filtres `usage`/date sur `GET /admin/media`, remplacement de fichier,
   `usage_count` + `usages[]` + `alt` par langue sur le détail, schémas
   `SectionConfig` pour les blocs média ;
4. **Besoins de l'arbre des services** (même document §4) : `source_key`,
   `position`, `is_active` sur les nœuds, renommage (`PATCH /admin/tree/{id}`
   ou `translations` dans `NodeUpsert`), activation/désactivation, traductions
   FR/EN côte à côte (`all_langs=true`) ;
5. **Changements média issus de la note de conception**
   (`../Analyse/modelisation/notes/conception-medias-images-videos.md` §9,
   version mise à jour) : champs `source/provider/external_id/width/height/
   duration_ms/poster_media_id/scan_status`, variantes `avif`+`height`,
   table `media_subtitles`, endpoints `replace`/`external`/`subtitles`,
   codes `MEDIA_IN_USE`, règles de suppression, types de section
   `media/gallery/video`.

## 5. Endpoints cités en doc 08 mais absents du contrat — **hors PR, backlog**

`/admin/languages`, `/admin/content/{type}/{id}` (détail GET),
`/admin/clients`, `/admin/backup`, `/admin/content/{id}/submit-review` —
à ajouter dans une PR ultérieure, pas dans la PR unique.

## 6. Login à trois états — détail à intégrer à la PR unique

Le `403 FORBIDDEN` retourné jusqu'ici pour un compte MFA obligatoire non
enrôlé est **remplacé par un état dédié** (décision 2026-11-03). `POST
/admin/auth/login` répond `200` avec un discriminateur `status` à trois
valeurs :

| `status` | Signification | Corps |
|---|---|---|
| `authenticated` | session créée, cookies posés | `user` + `permissions` |
| `mfa_required` | enrôlé, code TOTP réclamé | objet vide |
| `mfa_enrollment_required` | MFA obligatoire (`super_admin`, `admin`, `crm`) mais non enrôlé | objet `mfa_enrollment` |

`mfa_enrollment` (renvoyé dès le premier login sans code, et régénéré à
chaque appel tant que le code n'est pas validé) :

```json
{
  "totp_secret": "JBSWY3DPEHPK3PXP",
  "otpauth_uri": "otpauth://totp/ExAUCE:admin@exauceac.com?secret=…",
  "qr_svg": "<svg …>…</svg>",
  "backup_codes": ["48192037", "…"]
}
```

- **QR** : généré côté backend (segno, SVG inline) — le SPA l'affiche tel
  quel, aucune librairie côté client ;
- **premier code** : un `totp_code` (6 chiffres) valide sur ce login achève
  l'enrôlement (`mfa_active=true`), la session est créée et la réponse passe
  en `authenticated` ; un code invalide → `401 UNAUTHENTICATED` (le compte
  n'est pas encore enrôlé, aucun lockout MFA) ;
- **codes de secours** : 10 codes de 8 chiffres dérivés du secret
  (`HMAC-SHA256`, zéro migration), envoyés dans `mfa_enrollment` et dans le
  mail d'invitation ; au login post-enrôlement, `totp_code` de **8 chiffres**
  est vérifié comme code de secours (perte d'appareil). *Limitation : l'usage
  unique n'est pas marqué en base (migration gelée) — colonne dédiée proposée
  plus tard ; les codes tournent à chaque ré-enrôlement.*
- le champ `totp_code` du schéma `LoginRequest` doit avoir `maxLength: 8`
  (codes de secours sans séparateur) — `minLength: 6` reste acceptable.

## 7. Points tracés hors PR unique

- **Rate-limit `password-forgot`** : absent aujourd'hui (verrou
  exponentiel présent sur le login seul) — **bloquant avant mise en ligne**,
  à ajouter dans le contrat (`429`) et à implémenter avant go-live ;
- **`is_demo`** : colonne `publications.is_demo` différée à la migration 0002
  (avec les colonnes média, en attente de validation de la note `a06cad0`) ;
  le seed distingue déjà les comptes démo par `source_key` ;
- **activation des comptes démo (dev)** : `python -m app.cli.seed
  --with-demo` puis `python -m app.cli.invite --demo` — 5 invitations vers
  MailHog (`localhost:8025`), **refusé en production** (code de sortie 2,
  Q-104).
