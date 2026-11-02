# Note de conception — images et vidéos dans les sections

> **Statut : proposition, en attente de validation du propriétaire.**
> Aucune migration 0002 n'est écrite avant validation. Branche `backend/main`.
> S'appuie sur la doc 06 (§2.6 médias), la page 10 (matrice RBAC), la page 09
> (§stockage, ClamAV) et le document des besoins Backoffice
> `Backoffice/docs/contract-needs-media.md`.

## 1. Principes

1. **Jamais d'URL libre pour une image.** Toute image est référencée par
   `media_id` (colonnes FK ou `config` JSONB des sections). Le seul cas d'URL
   externe est la **vidéo liée** (§5, option A), et elle est reconstruite
   côté serveur à partir d'un identifiant validé sur liste blanche — l'URL
   saisie par l'utilisateur n'est jamais stockée ni servie telle quelle.
2. **Zéro migration lourde ensuite.** Les nouveaux emplacements média sont des
   *données* (`section_types.config_schema`, lignes `section_types`), pas du
   DDL. Ajouter un visuel à une section existante = mise à jour d'un schéma
   JSON en base ; ajouter un type de section = une ligne de seed. La migration
   0002 ne touche que les colonnes/listes des tables médias elles-mêmes.
3. **Le serveur est l'autorité** : validation des types, des tailles, de
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
| `storage_key` | `VARCHAR(255)` | NN **levé** pour `source='external'` (aucun fichier) ; `UNIQUE` conservé (les NULL ne collisionnent pas en PostgreSQL) |
| `checksum` | `VARCHAR(64)` | NN **levé** pour `source='external'` ; sinon SHA-256 **après** nettoyage EXIF (§6) |
| `width`, `height` | `SMALLINT` NULL | **nouvelles** — dimensions d'origine (image : à l'upload ; vidéo externe : relevées à la création) |
| `duration_ms` | `INTEGER` NULL | **nouvelle** — ck : non NULL ⇒ `kind='video'` |
| `poster_media_id` | `UUID` FK `medias` **RESTRICT** NULL | **nouvelle** — affiche de la vidéo (§5) |
| `scan_status` | ck `pending / clean / infected` NN déf. `pending` | **nouvelle** — scan ClamAV synchrone (images, PDF) ou différé (grosses vidéos, page 09) ; publication exigée `clean` |

Contraintes conservées : `status ck active/replaced/deleted`, `replaced_by`,
`uploaded_by`, `uq storage_key`. **FK `RESTRICT` partout** (cohérent §3/§4 ;
voir §10 l'écart du §7 à corriger dans le doc).

### 2.2 `media_variants` — extension

- `format` ck étendu : `webp, jpg, avif` (EF-803 citait WebP seul ; l'AVIF est
  ajouté par cette note, à confirmer avec le propriétaire — §9-Q7).
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
| `gallery` | `items[]` : `media_id`, `decorative`, `order` — **taille max à définir (§9-Q2)** |
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

## 4. Vidéos — deux options, coût et risques (arbitrage ouvert)

> La page de marche indique l'intégration externe comme option recommandée en
> phase 1. **La décision finale reste au propriétaire (§9-Q1)** : les deux
> options sont modélisées dans 0002 (`source`, `provider`, `external_id`,
> `duration_ms`, `poster_media_id`), donc basculer plus tard reste sans DDL.

| | **Option A — lien externe (YouTube/Vimeo, mode vie privée)** | **Option B — fichier téléversé hébergé** |
|---|---|---|
| Mécanique | Vignette servie **localement** ; le lecteur (`youtube-nocookie.com` / `player.vimeo.com`) n'est chargé **qu'au clic** ; domaines en liste blanche côté serveur, `provider`+`external_id` validés à la création | Upload MP4/WebM, scan ClamAV, player `<video>` natif ; **pas de transcodage en phase 1** (fichier unique, qualité/taille fixes) |
| Coût infrastructure | **≈ 0 €** — aucun stockage, aucune bande passante vidéo | Disque : ≈ **0,3–1 Go par vidéo** + sauvegarde du volume. Bande passante : ≈ **1,4 Go/heure de visionnage** en 1080p (~3 Mb/s) ; 10 h/mois de visionnage ≈ 14 Go/mois |
| Coût de développement | **≈ 1–2 j** : composant click-to-load, allowlist, CSP, téléchargement serveur de l'affiche | **≈ 2–4 j** : upload résistant (reprise, timeout, limite Traefik), extraction/liaison d'affiche, scan asynchrone, limites, player |
| Risques | Dépendance fournisseur : ToS, disparition/blocage d'une vidéo, branding, publicités et recommandations dans le lecteur, changement d'URL d'embed. Vie privée : **aucune requête tiers avant le clic** (l'affiche est téléversée/téléchargée une fois, côté serveur, à la création) ; au clic, IP + cookies du visiteur partent vers le fournisseur — sans consentement préalable car rien n'est chargé avant | Pas d'adaptative bitrate (HLS/DASH hors périmètre) : expérience variable selon le réseau. Upload long = risque de coupure et de timeout. Coût réel (disque + passante) si les vidéos se multiplient. Responsabilité de la sauvegarde du volume partagé |
| Dépendances externes | Oui (deux fournisseurs) | Aucune |
| Phase 1 | **Recommandée** (légère, conforme vie privée si clic différé) | Alternative si le propriétaire refuse toute dépendance tiers |

**Affiche (commune aux deux)** : `poster_media_id`. Option A → miniatures
fournisseur téléchargées **une fois, côté serveur**, domaine fournisseur en
liste blanche (jamais de requête depuis le navigateur du visiteur) ; option B →
affiche téléversée manuellement (extraction automatique d'image = ffmpeg, hors
phase 1).

## 5. Pipeline d'images à l'upload (phase 1)

Étapes, dans l'ordre, en une transaction de métadonnées + fichiers :

1. **Limites** : taille ≤ **10 Mo**, dimensions ≤ **8000×8000** (propositions,
   §9-Q3) ; corps de requête streaming, jamais en mémoire complète.
2. **Magic bytes** : type réel via libmagic confronté à la **liste fermée**
   `image/jpeg, image/png, image/webp, image/avif` (+ `video/mp4, video/webm`
   si option B, `application/pdf` inchangé). L'extension de fichier ne fait
   foi pour rien.
3. **ClamAV** : scan à l'upload ; échec ⇒ rejet `415` + alerte (page 09).
   Images/PDF en synchrone ; grosses vidéos en différé via `scan_status`
   (§2.1) — publication bloquée tant que `clean`.
4. **EXIF** : suppression systématique des métadonnées **dont le GPS**, avant
   calcul du `checksum` (le hash porte sur le fichier nettoyé → la dédup est
   stable).
5. **Dédup SHA-256** : index unique partiel `(checksum) WHERE status='active'`.
   Un fichier déjà présent renvoie le média existant (`deduplicated: true` en
   réponse, §8) — voir §9-Q5 (partage de l'`alt`).
6. **Variantes** : WebP + AVIF (§2.2) générés à l'upload ; échec de conversion
   ⇒ log + retry, jamais de rejet du fichier d'origine (SC-803).
7. **Stockage** : volume Docker hors webroot, chemin dérivé du hash
   (`media/<2 premiers>/<sha256>.<ext>`, variantes `<sha256>_<largeur>.<fmt>`)
   — la clé de stockage porte déjà l'empreinte, donc les noms sont déjà
   « à empreinte » pour le cache (§7).

## 6. Sécurité

- **SVG : refus total en phase 1** (absent de la liste fermée) — aucun
  nettoyage à risque. Réintroduction éventuelle = filtre serveur dédié, hors
  périmètre (§9-Q6).
- **MIME en liste fermée** (§5.2), vérifié sur les octets réels.
- **CSP** (site prérendu Nginx + back-office) :
  `frame-src https://www.youtube-nocookie.com https://player.vimeo.com` ;
  `img-src 'self' data:` ; `media-src 'self'` (option B). Aucun domaine tiers
  en `default-src`.
- **URLs externes** : seules les vidéos, via `provider`+`external_id` validés
  (regex d'identifiant + domaine reconstruit depuis la liste blanche) ; toute
  autre URL externe dans un champ de contenu est rejetée à la validation.
- Téléversement : permission `media:create` + CSRF (règle générale), limites
  de taille et de dimensions côté serveur, antivirus (page 09).

## 7. Publication SSG

- Le worker, à chaque parution, copie vers `static-releases` **uniquement les
  médias référencés par du contenu publié** (via `media_refs`), sous
  `/media/<sha[0:2]>/<sha>.<ext>` (+ variantes). Noms à empreinte ⇒
  `Cache-Control: public, max-age=31536000, immutable` ; purge = suppression
  des anciennes releases, jamais de réécriture en place.
- Le HTML émis porte **`width`/`height`** (origine ou variante) pour zéro CLS,
  **`loading="lazy"`** sauf image LCP de première section
  (`loading="eager" fetchpriority="high"`), et **`srcset`/`sizes`** + `<picture>`
  AVIF → WebP → original.
- Vidéo option A : `<img>` d'affiche locale + bouton ; le clic injecte
  l'iframe (aucun tiers avant le clic). Sans JavaScript : lien vers la page de
  la vidéo chez le fournisseur.
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
- Remplacement : même `media_id`, mêmes références, nouveau fichier +
  variantes régénérés (`POST /admin/media/{id}/replace`, §9).
- Qui a ces rôles : matrice page 10 → `editor` par défaut ; **confirmer avec le
  propriétaire (§9-Q4)**.

## 9. Contrat OpenAPI — liste précise des changements

> Processus : cette liste est livrée à l'équipe Backoffice, qui la porte en
> **commit isolé** sur `backoffice/main` ; relue par le Backend puis fusionnée.
> Aucun changement silencieux.

1. **`MediaItem`** : + `source`, `provider`, `external_id`, `width`, `height`,
   `duration_ms`, `poster_media_id`, `scan_status`, `usage_count`, `usages[]`
   (`entity_type`, `entity_id`, `title`, `edit_path`), `variants[]`
   (`format`, `width`, `height`, `url`), `subtitles[]` (`lang`, `url`) ;
   `alt`/`caption` deviennent des objets par langue quand `all_langs=true`
   (paramètre existant, réutilisé).
2. **`GET /admin/media`** : + `created_from`, `created_to`,
   `usage ∈ used|unused`, `sort ∈ created_at|-created_at`.
3. **`POST /admin/media/upload`** : + `kind ∈ …|video` ; + champ `poster`
   (optionnel) ; sous-codes d'erreur dans `Problem.errors[]` :
   `MIME_NOT_ALLOWED`, `TOO_LARGE`, `INFECTED` ; + `deduplicated` dans la
   réponse.
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
   publication (§3.3).
10. **Schémas de section** : `SectionMedia`, `SectionGallery`, `SectionVideo`
    référencés par `SectionUpsert.config` ; `section_type` documenté avec
    `media | gallery | video` (besoins Backoffice §3).
11. **Enum `Problem.code`** : + `MEDIA_IN_USE`, `VIDEO_PROVIDER_NOT_ALLOWED`,
    `SECTION_MEDIA_ALT_MISSING`.
12. **Aucun endpoint public média** : le site public est prérendu, les
    fichiers sont servis par Nginx (§7) — rien à ajouter sur `/api/v1` public.

## 10. Questions ouvertes (propriétaire)

| # | Question | Éléments de décision |
|---|---|---|
| **Q1** | **Vidéos hébergées ou liées ?** | Tableau §4 : A ≈ 0 € d'infra / 1–2 j, mais dépendance YouTube-Vimeo ; B ≈ 0,3–1 Go + ~1,4 Go/heure visionnée / 2–4 j, sans tiers. Les deux sont modélisées dans 0002 : la bascule reste sans migration. |
| **Q2** | **Quelles sections, et combien de médias par section ?** | Types `media/gallery/video` disponibles partout ; dire les sections concernées en phase 1 et le maximum d'images d'une galerie (proposition : 12). |
| **Q3** | **Tailles maximales ?** | Propositions : image 10 Mo et 8000×8000 px ; vidéo (option B) 500 Mo ; VTT 100 Ko. |
| **Q4** | **Qui téléverse / remplace / supprime ?** | Matrice page 10 : `editor` par défaut. Confirmer ou restreindre (ex. suppression réservée `admin`). |
| **Q5** | **Dédup : alt partagé ?** | Un même fichier remonte la ligne existante : l'`alt` devient commun aux deux usages. Acceptable, ou dédup au seul niveau fichier (plus complexe) ? |
| **Q6** | **SVG ?** | Refus total en phase 1 (recommandé). Un besoin réel de logos SVG ? |
| **Q7** | **AVIF ?** | Ajouté aux variantes (encodage plus lent, CPU à l'upload). Confirmer, ou WebP seul comme l'EF-803. |

## 11. Écarts documentaires connus (correction du doc, pas du schéma)

- **Doc 06 §7 (DDL illustratif)** : `og_media_id`, `offices.media_id`,
  `team_members.media_id` y sont en `ON DELETE SET NULL`, alors que §3/§4
  imposent **RESTRICT**. Le schéma (migration 0001) applique RESTRICT, comme
  décidé ; **le §7 doit être corrigé**.
- **EF-803** ne citait que WebP ; l'AVIF vient de cette note (Q7).
- Décision **ENF-701** (rollover d'audit levant l'append-only) : tracée,
  arbitrage Sprint 4 — hors périmètre de cette note.
