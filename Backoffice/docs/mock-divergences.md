# Écarts entre le mock et le contrat / le seed

Ce fichier liste les points où le mock du Backoffice s'écarte volontairement de
`Analyse/modelisation/docs/openapi.yaml` ou du seed du Backend. Chaque écart est
soit un manque de contrat à combler, soit une décision du propriétaire que le
Backend n'a pas encore intégrée.

Dernière mise à jour : contenu réel du site chargé dans le mock (étape 2).

## 1. Contrat OpenAPI — manques à combler

| # | Manque | Ce que fait le mock | À ajouter au contrat |
|---|---|---|---|
| 1 | Aucun endpoint de catalogue des types de section | `GET /admin/section-types` renvoie `{ items: SectionTypeDef[] }` (code, libellé i18n, usage, `editable`, champs) | `GET /admin/section-types` exposant `config_schema` et `translation_schema` de `section_types` |
| 2 | `Section.data` est un objet plat, sans écriture par langue | `data` est un objet `{ fr: {...}, en: {...} }` ; `PATCH /admin/sections/{id}` accepte `{ lang, data }` | `data` localisé (ou `entity_translations` par champ) + `PATCH` par langue |
| 3 | Aucun contrôle de concurrence | chaque page porte `revision` ; toute mutation l'envoie et le serveur répond `409 CONFLICT` si elle a changé | `revision` (ou `ETag`/`If-Match`) sur `PageDetail` et les mutations |
| 4 | Aucun endpoint de workflow éditorial | `POST /admin/pages/{id}/workflow` avec `{ action, revision, comment? }` | `submit-review`, `approve`, `reject` (+ `publish` distinct) avec `x-permission` et `409` sur transition invalide |
| 5 | Statuts de page non énumérés | `draft`, `in_review`, `approved`, `published`, `archived` | enum `status` sur `PageSummary`/`PageDetail` + machine à états documentée |
| 6 | `PageDetail.title` est un `Localized` unique | la page porte `title` **et** `slugs` sous forme `{ fr, en }`, plus `section_count` | variante bilingue (ou paramètre `lang`) pour éditer FR et EN côte à côte |
| 7 | `POST /admin/pages/{id}/sections` ne renvoie que la section | le mock renvoie `{ page, section }` pour garder `revision` et l'ordre à jour | réponse `Section` + `revision` de page, ou relecture explicite |

## 2. Rôles et permissions — écarts avec le seed

- **`admin`** : décision du propriétaire (doc 03 §1) — `pages`, `tree`,
  `publications`, `users`, `offices`, `team`, `settings`, `seo`, `audit`,
  **plus `media` et `leads`**. Le seed (`Backend/app/seed/payload.py`,
  `ROLE_PERMISSIONS`) ne donne à `admin` que `pages:publish`,
  `publications:publish` et huit modules, **sans `media` ni `leads`**. Le mock
  suit la décision, pas le seed. À transmettre au Backend.
- **`editor` et `media`** : décision du propriétaire — `media:view`,
  `media:create`, `media:edit`, **sans `media:delete`** (suppression réservée à
  `admin`). Le seed actuel donne `media` complet à `editor` ; à transmettre au
  Backend.
- **`viewer`** : le seed ne donne aucune permission. Le compte de démo
  `lecteur@exauceac.com` du mock conserve `pages:view` et `publications:view`
  (nécessaire aux tests du tableau de bord et de l'écran Pages). Écart connu.
- **Comptes de démo ajoutés au mock** : `admin@exauceac.com` (rôle `admin`) et
  `redacteur-fr@exauceac.com` (permissions `pages:view|edit|delete` limitées à
  `fr`, pour vérifier le RBAC par langue). Le seed active ses comptes par
  invitation, sans mot de passe.

## 3. Catalogue de types de section

Le catalogue est **local** (`src/services/api/mock/sectionTypes.ts`) et
**partiel** : 21 codes sont connus, mais seuls `hero`, `page_header`, `cta`,
`stats` et `legal_document` sont éditables. Les 16 autres s'affichent en lecture
seule avec un message explicite, conformément au périmètre du MVP. Dès que le
contrat exposera le catalogue, ce module sera remplacé par l'appel réseau et les
formulaires suivront les schémas serveur sans code par type.

## 4. Alignement sur le seed (conforme)

Source : `Backend/app/seed/payload.py` et `Backend/app/seed/data/section_types.json`.

- 10 pages : `home`, `services`, `interventions`, `sectors`, `publications`,
  `about`, `contact`, `legal_notice`, `client_area`, `not_found`.
- 7 pages en navigation (`nav_position` 0 à 6).
- 29 blocs : accueil 10, services 5, interventions 2, à propos 5, publications 1,
  contact 2, espace client 1, mentions 3 ; `sectors` et `not_found` sans bloc.
- `legal_notice` en `draft` avec `banners_pending: true`.
- 21 types de sections.

## 5. Écran « Demandes de contact »

Le mock couvre les cinq endpoints du contrat (`GET /admin/leads`,
`GET /admin/leads/{id}`, `PATCH .../status`, `POST .../notes`,
`GET /admin/leads/export.csv`) mais avec des écarts à combler :

| # | Écart | Ce que fait le mock | Proposition de contrat |
|---|---|---|---|
| 1 | La liste renvoie `LeadDetail[]` et ne filtre que par `status` | résumés (`AdminLeadSummary`), filtres `search`, `from`, `to`, et compteurs `counts` par statut | schéma `LeadSummary` pour `items`, paramètres de recherche et de période, `counts` |
| 2 | Aucun verrou optimiste sur le statut | `LeadStatusUpdate` porte `revision` ; une valeur périmée renvoie `409 CONFLICT` | `revision` dans `LeadStatusUpdate` (comme les pages) |
| 3 | Corps de la note nommé `note` | le mock attend `body` | aligner le nom (`note` ou `body`) |
| 4 | `200`/`201` sans corps | les deux mutations renvoient la demande mise à jour (`AdminLeadDetail`) | renvoyer la demande, pour éviter un second appel |
| 5 | Aucune règle sur les demandes anonymisées | toute écriture sur un statut `anonymized` renvoie `409 CONFLICT` | documenter le refus (statut terminal) |
| 6 | Export sans paramètres | l'export CSV reprend les filtres de la liste | accepter les mêmes paramètres que `GET /admin/leads` |

Ces écarts n'empêchent pas la démonstration : le mock est l'autorité locale et
l'écran n'appelle que ces cinq routes.

## 6. Écran « Bureaux »

| # | Écart | Ce que fait le mock | Proposition de contrat |
|---|---|---|---|
| 1 | `Office` ne porte aucun texte bilingue, `OfficeUpsert` non plus | `GET /admin/offices` renvoie `translations.{fr,en}.{name,city,address_lines}` et l'écriture l'accepte | soit ajouter ces champs à `OfficeUpsert` par langue, soit passer par `PUT /admin/content/office/{id}/translation/{lang}` comme pour les sections |
| 2 | `GET /admin/offices` renvoie un tableau sans `position` | le mock renvoie `{ items }` trié par `position` et expose `position` sur chaque bureau | nommer l'enveloppe et exposer `position` en lecture |
| 3 | Aucune règle sur le siège | un seul bureau `is_headquarters` ; désigner un siège le retire des autres ; supprimer le siège renvoie `409 HEADQUARTERS_PROTECTED` | documenter l'unicité du siège et l'erreur de suppression |
| 4 | Pas de code d'erreur de doublon | création ou renommage avec un code existant → `409 OFFICE_CODE_TAKEN` | ajouter le code à `Problem.code` |

Sans réponse du Backend, le mock reste l'autorité locale pour ces quatre points.

## 7. Contenu des pages (étape 2)

Le contenu du mock n'est plus inventé : il reprend celui du site public
(`editorial_i18n.json`, `content_data.json`, locales `partners.*`). Il vit dans
`src/services/api/mock/pagesSeed.ts` (11 pages, 27 blocs après migration des cinq `page_header` dans le panneau Page). Le seed Backend conserve encore 32 blocs : les cinq `page_header` y sont toujours présents.

| # | Écart | Ce que fait le mock | Proposition de contrat |
|---|---|---|---|
| 1 | Mutation des champs Page et SEO | contrat étendu en 3a.1 : `PageDetail` expose `nav_label`, `intro`, `seo_title`, `seo_description` par langue ; `PUT /admin/pages/{id}/content/{lang}` et `/seo/{lang}` définissent les droits correspondants | endpoints à implémenter côté Backend avant le mode HTTP |
| 2 | Le seed Backend contient encore cinq `page_header` (32 blocs contre 27 dans le mock) | les textes ont été migrés dans Page ; les 5 blocs et leur type de catalogue sont retirés du mock après le test exact de non-perte. `coming_soon` reste un gabarit des pages techniques, pas un bloc | aligner le seed Backend avant le mode HTTP ; conserver les gabarits |
| 3 | `hero` déclare `primary_cta`/`secondary_cta` | champs retirés : le site lit `common.*` | retirer du type, éditer les CTA dans Paramètres |
| 4 | Les grilles déclarent une introduction | seuls `kicker` + `title` (et `text` pour `audit_grid`) | aligner `section_types.json` |
| 5 | Pas de page Partenaires | 11ᵉ page + 4 blocs + 8 partenaires de démonstration | ajouter page, types et entité `partner` |
| 6 | `stats` expose `value` | `value` est un décompte calculé (7/3/3/2), à passer en lecture seule | marquer `readOnly` au catalogue |
| 7 | Un seul bureau publié | siège de Dakar, adresse en texte d'attente, e-mail et téléphones du site | aucune règle nouvelle |

Les champs manquants au doc 15 et les changements Backend sont listés dans
`docs/editorial-gaps.md`.

## 8. Source de vérité publique

Les routes et sections du Frontend lisent actuellement `Frontend/src/i18n/locales`, `Frontend/src/data/content.data.ts` et des constantes de composants ; elles n'appellent pas les endpoints d'administration. Les mutations de l'API peuvent être testées en mode mock ou HTTP, mais une relecture du Backoffice ne prouve donc pas encore que le site public affiche l'écriture. Le branchement Frontend aux données publiées du Backend est un prérequis de validation bout en bout ; le Frontend et le Backend restent hors du périmètre modifiable de ce worktree.

Le contrat définit `PUT /admin/sections/{id}/content/{lang}` et `PUT /admin/pages/{id}/content/{lang}` ainsi que l'écriture SEO par langue. Le Backend doit livrer ces routes avant que les tests HTTP d'aller-retour puissent réussir.
