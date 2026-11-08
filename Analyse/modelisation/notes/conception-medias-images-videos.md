# Note de conception — images et vidéos dans les sections

> **Statut : mise à jour après les décisions du propriétaire (2026-11-02) ;
> en attente de validation finale de la note avant toute migration 0002.**
> Branche `backend/main`. S'appuie sur la doc 06 (§2.6 médias), la page 10
> (matrice RBAC), la page 09 (§stockage, ClamAV) et le document des besoins
> Backoffice `Backoffice/docs/contract-needs-media.md`.

**Décisions du propriétaire (2026-11-02) — déjà intégrées :** vidéos hébergées
sur le serveur (option B) avec le champ `source` conservé pour garder les deux
voies ; deux dossiers `Images/` et `Videos/` hors dépôt, chemins relatifs en
base, noms SHA-256, sous-dossiers année/mois, racine en variable
d'environnement, volume Docker persistant, `.gitignore`, sauvegarde incluse ;
MP4 (H.264) + WebM sans transcodage, affiche obligatoire, lecture par requêtes
plage (Range) côté Nginx ; suppression physique d'un fichier uniquement quand
plus aucune référence. Reste ouvert : §10.

## 1. Principes

1. **Jamais d'URL libre pour une image.** Toute image est référencée par
   `media_id` (colonnes FK ou `config` JSONB des sections). Le seul cas d'URL
   externe est la **vidéo liée** (`medias.source='external'`, §4), et elle est
   reconstruite côté serveur à partir d'un identifiant validé sur liste
   blanche — l'URL saisie par l'utilisateur n'est jamais stockée ni servie
   telle quelle.
2. **Les fichiers vivent hors du dépôt.** Deux dossiers, `Images/` et
   `Videos/`, sous une racine configurable par variable d'environnement, montée
   en volume Docker persistant (§5.7). La base ne stocke que des **chemins
   relatifs** ; les noms de fichiers sont **générés** (SHA-256), jamais ceux
   fournis par l'utilisateur.
3. **Zéro migration lourde ensuite.** Les nouveaux emplacements média sont des
   *données* (`section_types.config_schema`, lignes `section_types`), pas du
   DDL. Ajouter un visuel à une section existante = mise à jour d'un schéma
   JSON en base ; ajouter un type de section = une ligne de seed. La migration
   0002 ne touche que les colonnes/listes des tables médias elles-mêmes.
4. **Le serveur est l'autorité** : validation des types, des tailles, de
   l'antivirus, de la liste blanche vidéo et du texte alternatif à la
   publication. Le Backoffice affiche, il ne décide pas.

## 2. Modèle de données — migration 0002 (proposition)

### 2.1 `medias` — extension

| Colonne | Type | Changement |
|---|---|---|
| `kind` | ck | étendu : `image, pdf, document, video` |
| `source` | `VARCHAR(10)` ck `upload / external` NN déf. `upload` | **nouvelle** — `external` uniquement si `kind='video'` (ck : `source='upload' OR kind='video'`) |
| `provider` | `VARCHAR(16)` ck `youtube / vimeo` NULL | **nouvelle** — exigé si `source='external'` |
| `external_id` | `VARCHAR(64)` NULL | **nouvelle** — identifiant canonique côté fournisseur, exigé si `source='external'` |
| `storage_key` | `VARCHAR(255)` | NN **levé** pour `source='external'` (aucun fichier) ; `UNIQUE` conservé (les NULL ne collisionnent pas en PostgreSQL). Format **relatif** à la racine `MEDIA_ROOT` (variable d'environnement) : `Images/<AAAA>/<MM>/<sha256>.<ext>` ou `Videos/<AAAA>/<MM>/<sha256>.<ext>` — chemin absolu jamais stocké ni exposé (§5.7) |
| `checksum` | `VARCHAR(64)` | NN **levé** pour `source='external'` ; sinon SHA-256 **après** nettoyage EXIF (§6) |
| `width`, `height` | `SMALLINT` NULL | **nouvelles** — dimensions d'origine (image : à l'upload ; vidéo externe : relevées à la création) |
| `duration_ms` | `INTEGER` NULL | **nouvelle** — ck : non NULL ⇒ `kind='video'` |
| `poster_media_id` | `UUID` FK `medias` **RESTRICT** NULL | **nouvelle** — affiche de la vidéo, obligatoire à la publication (§4) |
| `scan_status` | ck `pending / clean / infected` NN déf. `pending` | **nouvelle** — scan ClamAV synchrone (images, PDF) ou différé (grosses vidéos, page 09) ; publication exigée `clean` |

Contraintes conservées : `status ck active/replaced/deleted`, `replaced_by`,
`uploaded_by`, `uq storage_key`. **FK `RESTRICT` partout** (cohérent §3/§4 ;
voir §10 l'écart du §7 à corriger dans le doc).

### 2.2 `media_variants` — extension

- `format` ck étendu : `webp, jpg, avif` (EF-803 citait WebP seul ; l'AVIF est
  ajouté par cette note, à confirmer avec le propriétaire — §10-Q7).
- `height SMALLINT NN` **ajouté** (srcset sans CLS).
- Jeux de largeurs proposés : **400 / 800 / 1200 / 1600 px** (une valeur
  d'image d'origine plus petite n'est pas agrandie). Original conservé tel quel.

### 2.3 `media_subtitles` — nouvelle table (VTT)

`id PK`, `media_id FK medias CASCADE`, `lang FK languages RESTRICT`,
`storage_key NN UQ`, `size_bytes`, `created_at`, **uq `(media_id, lang)`**.
Un fichier WebVTT par vidéo et par langue, passé par le même pipeline que les
images (en-tête `WEBVTT`, taille ≤ 100 Ko, ClamAV).

### 2.4 Traductions (`entity_translations`, `entity_type='media'`)

Déjà supporté par le registre (`EntityType.MEDIA`). Champs de `data` :

| Champ | Langue | Règle |
|---|---|---|
| `alt` | par langue | **obligatoire pour une image non décorative** dans toutes les langues publiées — contrôle à la publication (§3) |
| `caption` | par langue | optionnel |
| `transcript` | par langue | optionnel — transcription textuelle (vidéo) |

Les sous-titres VTT restent des fichiers (§2.3), pas du texte en base.

### 2.5 `media_refs` — journal inchangé, rôle précisé

Écriture transactionnelle de **toutes** les références (colonnes FK *et*
emplacements du `config` JSONB des sections). Deux usages :

1. `GET /admin/media/{id}` → `usages[]` + `usage_count` (besoin P1 Backoffice ;
   explique le `409` de suppression) ;
2. garde de suppression pour les références JSONB, qui n'ont **pas** de FK.

Les FK `RESTRICT` sur colonnes (`og_media_id`, `icon_media_id`,
`cover_media_id`, `offices.media_id`, `team_members.media_id`,
`poster_media_id`) restent le filet de sécurité de dernier rang.

## 3. Sections : blocs média et emplacements optionnels

### 3.1 Trois types de section génériques (lignes `section_types`, seed)

| `code` | `config_schema` (JSON Schema 2020-12) |
|---|---|
| `media` | `media_id` (uuid), `decorative` (bool), `layout` (enum `inline/full_width`) |
| `gallery` | `items[]` : `media_id`, `decorative`, `order` — **taille max à définir (§10-Q2)** |
| `video` | `media_id` (vidéo), `poster_media_id?`, `autoplay` (false imposé en phase 1) |

Les textes traduits (titre, intro) passent par `translation_schema` +
`entity_translations`, comme les autres sections.

### 3.2 Emplacements média optionnels dans les sections existantes

Chaque `section_types.config_schema` existant gagne des propriétés **optionnelles**
(ex. `hero.media_id`, `about_preview.media_id`, `founder_card` → déjà couvert
par la colonne `team_members.media_id`). Écriture dans `config_schema` :
**donnée, pas de DDL** (principe 2). La validation `config` par le schéma de la
section reste en place ; toute propriété inconnue est rejetée.

### 3.3 Règle de publication (autorité serveur)

Une section dont une image **non décorative** n'a pas d'`alt` dans toutes les
langues publiées bloque la publication : code `SECTION_MEDIA_ALT_MISSING`,
`errors[]` avec `field = sections[].config.<chemin>.alt.<lang>` (besoin
Backoffice §3). Le décoratif (`decorative=true`) impose `alt=""` explicite en
génération SSG, pas en base.

## 4. Vidéos — option B retenue (hébergées) : coût et taille maximale

> **Décision du propriétaire (2026-11-02) : les vidéos sont hébergées sur le
> serveur (option B).** Le champ `source` (`upload` / `external`) est conservé
> dans 0002 : rester ou basculer sur une vidéo liée (YouTube/Vimeo) plus tard
> reste possible **sans DDL**. Aucune migration 0002 ni code média avant
> validation finale de cette note.

Règles de phase 1 (actées) :

- **MP4 (H.264) et WebM** uniquement, formats de la liste fermée (§5.2).
- **Pas de transcodage** : un fichier, une qualité ; ni variantes, ni bitrate
  adaptatif (HLS/DASH hors périmètre).
- **Affiche obligatoire** (`poster_media_id` exigé à la publication) : image
  téléversée manuellement — extraction automatique (ffmpeg) hors phase 1.
- **Lecture par requêtes plage** : Nginx sert la vidéo avec
  `Accept-Ranges: bytes` (module `mp4` activé pour la délimitation de début),
  ce qui permet la barre de progression et les sauts sans re-télécharger le
  fichier (§7).
- **Stockage** : racine `MEDIA_ROOT` (variable d'environnement) sur volume
  Docker persistant hors dépôt (§5.7) ; la base ne stocke que le chemin
  relatif `Videos/<AAAA>/<MM>/<sha256>.<ext>`.

### 4.1 Coût disque (hypothèses à ajuster — §10-Q8)

Fichier unique 1080p H.264 ≈ 5 Mb/s ⇒ **≈ 2,3 Go/heure** (37,5 Mo/min) ;
fourchette basse 720p ≈ 2,5 Mb/s ⇒ ≈ 1,1 Go/heure. Posters et sous-titres
négligeables (< 1 %). Sauvegarde du volume = duplication.

| Nombre de vidéos | Hypothèse courte (moy. 0,5 Go : 480–720p, 2–3 min) | Hypothèse longue (moy. 2,3 Go : 1080p ~1 h) | Avec sauvegarde (×2) |
|---|---|---|---|
| **10** | 5 Go | 23 Go | 10 – 46 Go |
| **50** | 25 Go | 115 Go | 50 – 230 Go |
| **100** | 50 Go | 230 Go | 100 – 460 Go |

Cas médian réaliste (2–3 min/vidéo en 1080p ≈ 0,8–1,2 Go) : 10 → 8–12 Go,
50 → 40–60 Go, 100 → 80–120 Go (×2 avec sauvegarde).

### 4.2 Coût bande passante (sortie serveur)

≈ **1,4 Go par heure de visionnage** en 1080p (~3,3 Mb/s moyens ; les
requêtes plage évitent les re-téléchargements complets lors des sauts).

| Visionnage mensuel | Sortie mensuelle | Repère par vidéo |
|---|---|---|
| 10 h/mois | ≈ 14 Go | |
| 50 h/mois | ≈ 70 Go | |
| 100 h/mois | ≈ 140 Go | 3 min vue 100 fois/mois ≈ 4,5 Go |

À rapprocher du forfait hébergeur (souvent « illimité raisonnable » ou
facturé au Go) — **chiffres à confirmer avec le propriétaire (§10-Q8)**.

### 4.3 Taille maximale proposée — arbitrage du propriétaire requis

**Proposition : 500 Mo par vidéo** (≈ 8 à 13 min en 1080p à 5–8 Mb/s) ;
alternatives : 250 Mo (≈ 4–7 min, stricte) ou 1 Go (≈ 13–21 min, souple).
Rejet `413 TOO_LARGE` au-delà. **Valeur non tranchée seule : validation du
propriétaire en §10-Q3.** Même principe pour l'image (10 Mo / 8000×8000,
§5.1) et le VTT (100 Ko, §2.3).

**Affiche** : `poster_media_id` — obligatoire, téléversée manuellement (pas
d'extraction ffmpeg en phase 1) ; le poster suit le pipeline images (§5),
chemin relatif `Images/…`.

## 5. Pipeline d'images à l'upload (phase 1)

Étapes, dans l'ordre, en une transaction de métadonnées + fichiers :

1. **Limites** : image ≤ **10 Mo**, dimensions ≤ **8000×8000** ; vidéo ≤
   **500 Mo proposés** (§4.3, arbitrage §10-Q3) ; VTT ≤ 100 Ko. Corps de
   requête streaming, jamais en mémoire complète.
2. **Magic bytes** : type réel via libmagic confronté à la **liste fermée**
   `image/jpeg, image/png, image/webp, image/avif`, `video/mp4, video/webm`
   (vidéos hébergées, option B actée), `application/pdf` inchangé.
   L'extension de fichier ne fait foi pour rien.
3. **ClamAV** : scan à l'upload ; échec ⇒ rejet `415` + alerte (page 09).
   Images/PDF en synchrone ; grosses vidéos en différé via `scan_status`
   (§2.1) — publication bloquée tant que `clean`.
4. **EXIF** : suppression systématique des métadonnées **dont le GPS**, avant
   calcul du `checksum` (le hash porte sur le fichier nettoyé → la dédup est
   stable).
5. **Dédup SHA-256** : index unique partiel `(checksum) WHERE status='active'`.
   Un fichier déjà présent renvoie le média existant (`deduplicated: true` en
   réponse, §8) — voir §10-Q5 (partage de l'`alt`).
6. **Variantes** : WebP + AVIF (§2.2) générés à l'upload ; échec de conversion
   ⇒ log + retry, jamais de rejet du fichier d'origine (SC-803).
7. **Stockage — décisions 2026-11-02 (§5.7)** :
   - **Racine** : variable d'environnement `MEDIA_ROOT`, montée en **volume
     Docker persistant** (docker-compose) ; dossier **hors dépôt** — jamais
     de fichier média versionné dans Git.
   - **Arborescence** : deux dossiers de premier niveau **`Images/`** et
     **`Videos/`**, puis sous-dossiers **année/mois** de téléversement
     (`<AAAA>/<MM>`) — la base ne stocke que ce **chemin relatif**
     (`storage_key`, §2.1), le chemin absolu n'est ni stocké ni exposé.
   - **Noms générés** : `sha256` du fichier nettoyé (§5.4), jamais le nom
     fourni par l'utilisateur ; variantes `<sha256>_<largeur>.<fmt>` dans le
     même dossier. La clé porte l'empreinte ⇒ noms « à empreinte » pour le
     cache (§7).
   - **`.gitignore`** : filet de sécurité (`Images/`, `Videos/`, `media/`,
     `*.mp4`, `*.webm`) au cas où un développeur pointerait `MEDIA_ROOT`
     dans le dépôt en local — les dossiers de production restent hors
     dépôt.
   - **Sauvegarde** : le volume est **inclus dans la sauvegarde** du serveur
     (même plan que la base, §09 stockage) — sans lui, restauration du site
     sans médias.

## 6. Sécurité

- **SVG : refus total en phase 1** (absent de la liste fermée) — aucun
  nettoyage à risque. Réintroduction éventuelle = filtre serveur dédié, hors
  périmètre (§10-Q6).
- **MIME en liste fermée** (§5.2), vérifié sur les octets réels.
- **CSP** (site prérendu Nginx + back-office) :
  `frame-src https://www.youtube-nocookie.com https://player.vimeo.com`
  (voie `source='external'` conservée) ; `img-src 'self' data:` ;
  `media-src 'self'` (vidéos hébergées). Aucun domaine tiers
  en `default-src`.
- **URLs externes** : seules les vidéos, via `provider`+`external_id` validés
  (regex d'identifiant + domaine reconstruit depuis la liste blanche) ; toute
  autre URL externe dans un champ de contenu est rejetée à la validation.
- Téléversement : permission `media:create` + CSRF (règle générale), limites
  de taille et de dimensions côté serveur, antivirus (page 09).

## 7. Publication SSG

- Le worker, à chaque parution, copie vers `static-releases` **uniquement les
  médias référencés par du contenu publié** (via `media_refs`), en conservant
  l'arborescence relative sous `/media/` (ex.
  `/media/Images/2026/11/<sha256>.jpg`, `/media/Videos/2026/11/<sha256>.mp4`,
  variantes dans le même dossier). Noms à empreinte ⇒
  `Cache-Control: public, max-age=31536000, immutable` ; purge = suppression
  des anciennes releases, jamais de réécriture en place.
- Le HTML émis porte **`width`/`height`** (origine ou variante) pour zéro CLS,
  **`loading="lazy"`** sauf image LCP de première section
  (`loading="eager" fetchpriority="high"`), et **`srcset`/`sizes`** + `<picture>`
  AVIF → WebP → original.
- Vidéo hébergée (option B) : lecteur natif
  `<video controls preload="metadata" poster="/media/Images/…">` avec
  `<source>` MP4 + WebM ; Nginx sert le fichier avec `Accept-Ranges: bytes`
  (progression et sauts sans re-téléchargement) ; **aucune autoreproduction**
  en phase 1 ; sans JavaScript : lien direct de téléchargement du fichier.
  La voie externe (`source='external'`) reste : affiche locale + clic qui
  injecte l'iframe (aucun tiers avant le clic).
- Back-office : aperçus servis par l'API en **URL signée courte** (page 09,
  « stockage hors webroot »), pas par Nginx statique.

## 8. RBAC et suppression

| Geste | Permission (registre page 10, inchangé) |
|---|---|
| Téléverser | `media, create, default` |
| Remplacer / renommer | `media, edit, default` |
| Supprimer | `media, delete, default` |
| Consulter | `media, view, default` |

- **Suppression d'un média référencé ⇒ refus `409 MEDIA_IN_USE`** avec
  `errors[]` listant les usages : contrôle applicatif sur `media_refs` +
  FK `RESTRICT` sur colonnes (§2.5). **La FK `RESTRICT` est conservée** (§10).
- **Suppression physique du fichier** : uniquement quand **plus aucune
  référence ne subsiste** — `media_refs` vide, aucune FK colonne ne pointe
  vers le média (le refus `409` + `RESTRICT` garantit ce point), posters et
  sous-titres du média eux-mêmes non référencés. Ordre : `status='deleted'`
  en base (ligne conservée, journal lisible) **puis**, dans un second temps
  explicite confirmé dans le back-office, purge des variantes/sous-titres et
  `unlink` du fichier et du poster. Les variantes d'un fichier remplacé
  suivent la même règle (ancien fichier ⇒ zéro référence après remplacement).
- Remplacement : même `media_id`, mêmes références, nouveau fichier +
  variantes régénérés (`POST /admin/media/{id}/replace`, §9).
- Qui a ces rôles : matrice page 10 → `editor` par défaut ; **confirmer avec le
  propriétaire (§10-Q4)**.

## 9. Contrat OpenAPI — liste précise des changements

> Processus (décision 2026-11-02) : cette liste est **intégrée à la seule PR
> de contrat coordonnée** (mapping `entity_type` → module, `csrfHeader`,
> besoins média P1, besoins de l'arbre des services) — **un seul commit**,
> porté par l'équipe Backoffice, relu par le Backend puis fusionné. Aucune PR
> parallèle, aucun changement silencieux.

1. **`MediaItem`** : + `source`, `provider`, `external_id`, `width`, `height`,
   `duration_ms`, `poster_media_id`, `scan_status`, `usage_count`, `usages[]`
   (`entity_type`, `entity_id`, `title`, `edit_path`), `variants[]`
   (`format`, `width`, `height`, `url`), `subtitles[]` (`lang`, `url`) ;
   `alt`/`caption` deviennent des objets par langue quand `all_langs=true`
   (paramètre existant, réutilisé).
2. **`GET /admin/media`** : + `created_from`, `created_to`,
   `usage ∈ used|unused`, `sort ∈ created_at|-created_at`.
3. **`POST /admin/media/upload`** : + `kind ∈ …|video` ; + champ `poster`
   (optionnel à l'upload, **exigé pour une vidéo à la publication**, §4) ;
   seuils documentés : image 10 Mo, vidéo **500 Mo proposés** (§4.3,
   valeur à confirmer §10-Q3), VTT 100 Ko ; sous-codes d'erreur dans
   `Problem.errors[]` : `MIME_NOT_ALLOWED`, `TOO_LARGE`, `INFECTED` ;
   + `deduplicated` dans la réponse.
4. **`POST /admin/media/{id}/replace`** (nouveau) : multipart, même id,
   `200 MediaItem` ; `x-permission: [media, edit, default]` ; mêmes codes
   d'erreur que l'upload.
5. **`POST /admin/media/external`** (nouveau) : création de vidéo liée
   `{provider, video_id}` (+ affiche téléchargée serveur) ;
   `422 VIDEO_PROVIDER_NOT_ALLOWED` si hors liste blanche ;
   `x-permission: [media, create, default]`.
6. **`PATCH /admin/media/{id}`** (nouveau, P2) : métadonnées mineures ;
   `x-permission: [media, edit, default]`.
7. **Sous-titres** : `POST /admin/media/{id}/subtitles/{lang}` (VTT) → `201` ;
   `DELETE …` → `204` ; `422 VTT_INVALID` (en-tête/taille) ;
   `x-permission: [media, edit, default]`.
8. **`PUT /admin/content/media/{id}/translation/{lang}`** (existant) :
   documenter `alt`, `caption`, `transcript` dans `data` ; `alt` exigé à la
   publication, pas à l'écriture du brouillon.
9. **Publication** : `422 SECTION_MEDIA_ALT_MISSING` + `errors[]`
   (`field = sections[].config.<chemin>.alt.<lang>`) sur l'endpoint de
   publication (§3.3) ; idem pour l'affiche de vidéo manquante :
   `422 SECTION_VIDEO_POSTER_MISSING`
   (`field = sections[].config.poster_media_id`, §4).
10. **Schémas de section** : `SectionMedia`, `SectionGallery`, `SectionVideo`
    référencés par `SectionUpsert.config` ; `section_type` documenté avec
    `media | gallery | video` (besoins Backoffice §3).
11. **Enum `Problem.code`** : + `MEDIA_IN_USE`, `VIDEO_PROVIDER_NOT_ALLOWED`,
    `SECTION_MEDIA_ALT_MISSING`, `SECTION_VIDEO_POSTER_MISSING`.
12. **Aucun endpoint public média** : le site public est prérendu, les
    fichiers sont servis par Nginx (§7) — rien à ajouter sur `/api/v1` public.

## 10. Questions ouvertes (propriétaire)

| # | Question | Éléments de décision |
|---|---|---|
| **Q1** | ~~Vidéos hébergées ou liées ?~~ **Actée le 2026-11-02 : option B, hébergées sur le serveur** | Coûts chiffrés §4.1/§4.2 ; `source` conservé dans 0002 ⇒ la voie « lien externe » reste possible sans DDL. |
| **Q2** | **Quelles sections, et combien de médias par section ?** | Types `media/gallery/video` disponibles partout ; dire les sections concernées en phase 1 et le maximum d'images d'une galerie (proposition : 12). |
| **Q3** | **Tailles maximales ?** | À trancher : **vidéo — 500 Mo proposés (§4.3), non tranchés seul** (alternatives 250 Mo / 1 Go) ; image 10 Mo et 8000×8000 px ; VTT 100 Ko. |
| **Q4** | **Qui téléverse / remplace / supprime ?** | Matrice page 10 : `editor` par défaut. Confirmer ou restreindre (ex. suppression réservée `admin`). |
| **Q5** | **Dédup : alt partagé ?** | Un même fichier remonte la ligne existante : l'`alt` devient commun aux deux usages. Acceptable, ou dédup au seul niveau fichier (plus complexe) ? |
| **Q6** | **SVG ?** | Refus total en phase 1 (recommandé). Un besoin réel de logos SVG ? |
| **Q7** | **AVIF ?** | Ajouté aux variantes (encodage plus lent, CPU à l'upload). Confirmer, ou WebP seul comme l'EF-803. |
| **Q8** | **Combien de vidéos, et pour quelle durée ?** | Hypothèses de chiffrage §4.1/§4.2 (10 / 50 / 100 vidéos ; 0,5 à 2,3 Go pièce) : donner le nombre visé et la durée moyenne pour caler le disque, la sauvegarde et la bande passante. |

## 11. Écarts documentaires connus (correction du doc, pas du schéma)

- **Doc 06 §7 (DDL illustratif)** : `og_media_id`, `offices.media_id`,
  `team_members.media_id` y sont en `ON DELETE SET NULL`, alors que §3/§4
  imposent **RESTRICT**. Le schéma (migration 0001) applique RESTRICT, comme
  décidé ; **le §7 doit être corrigé**.
- **EF-803** ne citait que WebP ; l'AVIF vient de cette note (Q7).
- Décision **ENF-701** (rollover d'audit levant l'append-only) : tracée,
  arbitrage Sprint 4 — hors périmètre de cette note.
