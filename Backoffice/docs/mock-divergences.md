# Écarts entre le mock et le contrat / le seed

Ce fichier liste les points où le mock du Backoffice s'écarte volontairement de
`Analyse/modelisation/docs/openapi.yaml` ou du seed du Backend. Chaque écart est
soit un manque de contrat à combler, soit une décision du propriétaire que le
Backend n'a pas encore intégrée.

Dernière mise à jour : écran « Pages et sections ».

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
- **`editor` et `media`** : le seed donne `media` complet à `editor`. Décision
  non prise à ce jour → **point à confirmer** pour le propriétaire.
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
