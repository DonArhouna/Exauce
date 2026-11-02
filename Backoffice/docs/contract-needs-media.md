# Besoins de contrat — médias et arborescence des services

Ce document liste les manques du contrat `Analyse/modelisation/docs/openapi.yaml`
constatés en préparant le lot « médias » et le premier écran de contenu.
Il est destiné à la revue Backend : **aucune API parallèle n'est codée dans le
Backoffice**, et le mock ne simule que des endpoints déjà présents au contrat
(`GET /admin/media`, `POST /admin/media/upload`, `GET|DELETE /admin/media/{id}`).

Priorités : **P1** bloque l'écran demandé, **P2** nécessaire au confort d'usage.

## 1. Ce que le contrat couvre déjà

| Endpoint | Usage couvert |
|---|---|
| `GET /admin/media` | liste paginée, filtres `kind` et `search` |
| `POST /admin/media/upload` | `multipart/form-data` (`file`, `kind`), refus en `415 UPLOAD_REJECTED` |
| `GET /admin/media/{id}` | métadonnées |
| `DELETE /admin/media/{id}` | suppression, `409` si le média est référencé |
| `PUT /admin/content/media/{id}/translation/{lang}` | textes par langue, y compris `alt` |

Le mock ajoute les contrôles serveur attendus : permission `media:create`,
CSRF, type MIME autorisé, taille, et refus antivirus.

## 2. Médiathèque — manques

### P1 — Filtres « utilisé / non utilisé » et par date

`GET /admin/media` n'expose que `kind` et `search`. L'écran demande un filtre
par date et par usage.

```yaml
parameters:
  - name: created_from  # date ISO
  - name: created_to
  - name: usage         # enum: used, unused
  - name: sort          # enum: created_at, -created_at
```

### P1 — Où le média est utilisé

Le résumé de `GET /admin/media/{id}` annonce « métadonnées et références
d'usage », mais `MediaItem` ne contient aucun champ d'usage : le client ne peut
ni lister les usages, ni expliquer un `409`.

```yaml
MediaItem:
  properties:
    usage_count: {type: integer}
    usages:                    # ou GET /admin/media/{id}/usages
      type: array
      items:
        type: object
        properties:
          entity_type: {type: string, enum: [page_section, page, publication, node]}
          entity_id: {type: string, format: uuid}
          title: {type: string}
          edit_path: {type: string}   # lien profond vers l'écran d'édition
```

### P1 — Texte alternatif par langue

`MediaItem.alt` est une **chaîne unique**, alors que l'écriture se fait par
langue (`PUT …/translation/{lang}`). Impossible d'afficher ou de contrôler les
deux langues d'édition.

Proposition : `alt` et `caption` deviennent des objets par langue lorsque
`all_langs=true`, sinon restent la valeur de `lang`.

```yaml
parameters:
  - name: all_langs   # déjà défini pour /admin/content/tree, à réutiliser
```

### P1 — Remplacement d'un média

Aucun endpoint. Or remplacer un visuel sans casser les références est un besoin
courant (et le `status: replaced` du contrat le suggère déjà).

```yaml
/admin/media/{id}/replace:
  post:
    requestBody: multipart/form-data (file)
    responses: '200' MediaItem   # même id, mêmes références, nouvelle version
```

### P2 — Renommage et métadonnées

Pas de `PATCH /admin/media/{id}` : ni renommage, ni correction de `kind`, ni
mise à jour du `caption` hors traduction.

### P1 — Motif de refus lisible par la machine

`415 UPLOAD_REJECTED` couvre trois causes très différentes (type refusé, taille,
antivirus) et `Problem.code` n'a pas de code dédié pour le `409` de suppression.

Proposition :

- `Problem.errors[0].code` ∈ `MIME_NOT_ALLOWED`, `TOO_LARGE`, `INFECTED` ;
- code `MEDIA_IN_USE` pour le `409`, avec `errors[]` reprenant les usages ;
- `scan_status` (`pending`, `clean`, `infected`) dans `MediaItem`, l'analyse
  antivirus étant asynchrone côté serveur.

Sans ces codes, l'interface ne peut afficher qu'un message générique : elle ne
doit pas analyser un `detail` en prose.

## 3. Blocs média dans les sections

`SectionUpsert.config` est un objet libre (`type: object`). Rien ne décrit un
bloc média, une galerie ou une vidéo : sans schéma, chaque section finirait avec
des champs codés en dur, ce que le propriétaire veut précisément éviter.

Proposition de `SectionConfig` versionné :

```yaml
SectionConfig:
  type: object
  properties:
    media:            {$ref: '#/components/schemas/SectionMedia'}
    gallery:
      type: array
      items: {$ref: '#/components/schemas/SectionMedia'}
    video:            {$ref: '#/components/schemas/SectionVideo'}

SectionMedia:
  type: object
  required: [media_id, decorative]
  properties:
    media_id: {type: string, format: uuid}
    decorative: {type: boolean}
    alt:                       # requis si decorative=false
      type: object
      additionalProperties: {type: string}   # clé = langue
    caption:
      type: object
      additionalProperties: {type: string}

SectionVideo:
  type: object
  required: [provider, video_id]
  properties:
    provider: {type: string, enum: [youtube, vimeo]}
    video_id: {type: string}
    url: {type: string, format: uri}
    caption: {type: object, additionalProperties: {type: string}}
    transcription: {type: object, additionalProperties: {type: string}}
```

Et `section_type` documenté avec les valeurs `media`, `gallery`, `video`.

**Règle de publication** : une section dont une image non décorative n'a pas de
texte alternatif dans toutes les langues publiées doit bloquer la publication.
Proposition : code `SECTION_MEDIA_ALT_MISSING` et `errors[]`
(`field`: `sections[].config.media.alt.<lang>`, `message`) pour que l'écran
puisse pointer la section fautive. L'interface signale déjà le blocage en amont ;
le serveur doit rester l'autorité.

## 4. Arborescence des services

Le contrat couvre la lecture (`GET /admin/content/tree` → `ServicesTree`), la
création (`POST /admin/content/tree`, `NodeUpsert`) et le déplacement
(`POST /admin/tree/{id}/move`). Il manque de quoi tenir l'écran demandé.

### P1 — Champs absents des nœuds

`Family`, `Domain`, `Group`, `PrestationItem` n'exposent ni `position`, ni
`source_key`, ni `is_active`. Or les ancres sont **dérivées de `source_key`** et
doivent être affichées en lecture seule, l'ordre doit être visible, et l'état
actif pilotable.

```yaml
Family:   # idem Domain, Group, PrestationItem
  properties:
    position: {type: integer}
    source_key: {type: string}
    is_active: {type: boolean}
    translations:            # cf. P1 suivant
      type: object
      additionalProperties:
        type: object
        properties:
          title: {type: string}
          slug: {type: string}
```

### P1 — Renommage d'un nœud

`NodeUpsert` ne porte ni `title` ni `slug` : créer un nœud oblige à un second
appel de traduction par langue, et **aucun endpoint ne permet de renommer** un
nœud existant autrement qu'en réécrivant sa traduction.

Proposition, au choix :

- `PATCH /admin/tree/{id}` avec `is_active`, `position` et `translations` ; ou
- `NodeUpsert` accepte `translations` à la création, et le renommage passe par
  `PUT /admin/content/node/{id}/translation/{lang}` (déjà présent) — à condition
  que `title` et `slug` soient explicitement documentés dans son corps.

### P1 — Activation / désactivation

Aucun endpoint. Proposition : `PATCH /admin/tree/{id}` avec `is_active`
(sinon `POST /admin/tree/{id}/activate` et `/deactivate`).

### P2 — Édition FR/EN côte à côte

`GET /admin/content/tree` renvoie **une** langue (`lang`) et une carte
`alternate` (slug de l'autre langue), pas les deux contenus. L'écran demande les
deux langues avec indicateur de complétude.

Proposition : `all_langs=true` renvoie `translations` par nœud (cf. ci-dessus),
ou un paramètre `langs=fr,en`.

### P2 — Position à la création et au déplacement

`POST /admin/tree/{id}/move` accepte `position`, mais aucune lecture ne
l'expose : le client ne peut pas vérifier l'ordre obtenu.

## 5. État côté Backoffice

- **Livré** : composants de design system (`MediaPicker`, `VideoField`,
  `MediaGallery`) et mock des endpoints média existants, avec contrôles de
  permission, CSRF, type MIME, taille et antivirus.
- **Non codé, conformément à la consigne** : l'écran Médiathèque, le bloc média
  de l'éditeur de sections et l'arborescence des services, tant que les points
  P1 ci-dessus ne sont pas arbitrés.
