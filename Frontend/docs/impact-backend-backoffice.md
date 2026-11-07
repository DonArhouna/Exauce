# Note d'impact — Backend & Backoffice

**Périmètre** : mission Frontend, lots 1 (page Partenaires) et 2 (galerie médias
des publications). Aucun fichier de `Backend/`, `Backoffice/` ou `Analyse/` n'a
été modifié. Cette note liste les points à intégrer côté API et back-office.

---

## 1. Sitemap — recompte

| État | URLs |
|------|------|
| Base (avant mission) | 29 |
| Lot 1 — page Partenaires (`/fr/partenaires`, `/en/partners`) | **30** |
| Lot 2 — 3 publications de démonstration ajoutées (`pub-4`, `pub-5`, `pub-6`) | **33** |

Détail des 33 entrées logiques : 10 pages statiques, 2 familles de services,
10 domaines, 2 types d'intervention, 3 secteurs, 6 publications.

Le sitemap est généré par `scripts/generate-sitemap.mjs` à partir des slugs de
`content.data.ts`. **Point d'attention** : le script inclut actuellement toutes
les publications mockées, y compris celles au statut `draft`. Côté backend, il
faudra ne générer que les publications `published` (ou régénérer après
publication).

---

## 2. Écart `cover` / `mediaCount`

La note média du Backend (`conception-medias-images-videos.md`) ne prévoit ni
`cover` ni `media_count`. Le Frontend ne les stocke **pas** : ils sont dérivés du
tableau `media` par `src/lib/media.ts`.

| Dérivé | Règle | Fonction |
|--------|-------|----------|
| `cover` | média désigné par `coverId`, sinon premier média ; `null` si aucun média | `pubCover(pub)` |
| `mediaCount` | longueur du tableau `media` | `pubMediaCount(pub)` |
| `hasVideo` | au moins un média `type: 'video'` | `pubHasVideo(pub)` |

Le champ optionnel `Publication.coverId` (côté Frontend) correspondrait à un
futur `cover_media_id` côté API. **Décision attendue** :

- soit le Backend n'expose pas ces champs et le Frontend continue de dériver ;
- soit le Backend expose `cover_media_id` et `media_count` en lecture seule, et
  `lib/media.ts` devient l'adaptateur unique (aucun autre fichier à changer).

Recommandation : ne pas dénormaliser `media_count` en base (risque
d'incohérence) ; exposer au maximum `cover_media_id`.

---

## 3. Alignement du modèle média

| Frontend | Backend (note média) | Statut |
|----------|----------------------|--------|
| `source: 'upload' \| 'external'` (type `MediaSource` isolé) | `ck_media_source` : `upload` / `external` | ✅ aligné |
| `durationMs` (millisecondes) | `duration_ms` | ✅ aligné |
| `alt: { fr, en }` | `alt` par langue | ✅ aligné |
| `caption?: { fr, en }` | légende par langue (si prévue) | ✅ aligné |
| `type: 'image' \| 'video'` | type de média | ✅ aligné |
| `poster` (chemin/URL de vignette) | `poster_media_id` (référence média) | ⚠️ divergence de forme |
| ordre du tableau `media[]` | ordre d'affichage (`position` / `sort_order`) | ⚠️ à exposer explicitement |
| `src` local `/publications/…` | URL de stockage / CDN | ⚠️ à mapper côté API |

### Divergences à trancher

1. **Poster** : le Frontend attend une URL directement affichable
   (`poster: string`). La note Backend prévoit `poster_media_id`. L'API devra
   soit résoudre l'URL du poster, soit exposer un objet média imbriqué.
2. **Ordre** : l'ordre du tableau est actuellement l'ordre d'affichage. Le
   Backend doit garantir un ordre stable (colonne `position`) pour éviter les
   réordonnancements involontaires.
3. **URL** : les données de démonstration utilisent des chemins locaux
   (`/publications/pub-img-1.svg`). En production, `src` devra pointer vers le
   stockage/CDN exposé par l'API.
4. **Taille** : contrainte Frontend/documentation ≤ 5 Mo par fichier ; à valider
   côté Backend (MIME, dimensions, antivirus).

---

## 4. Impact Backoffice

L'écran de gestion des publications devra permettre :

- l'ajout / suppression / réordonnancement des médias d'une publication ;
- l'upload d'images et de vidéos (ou la saisie d'une URL externe) ;
- le renseignement du texte alternatif **FR et EN** (obligatoire pour
  l'accessibilité) et de la légende bilingue ;
- la désignation du média de couverture (`cover_media_id`) ;
- le poster et la durée pour les vidéos (`poster_media_id`, `duration_ms`) ;
- la validation : type MIME, taille ≤ 5 Mo, présence de l'alt dans les deux
  langues, pas de hotlink pour les médias `upload`.

Endpoints pressentis (à confirmer) :

```
GET    /publications/{id}/media
POST   /publications/{id}/media
PATCH  /publications/{id}/media/{media_id}
DELETE /publications/{id}/media/{media_id}
PATCH  /publications/{id}            # cover_media_id, ordre éventuel
```

---

## 5. Ce qui ne change pas

- La route de détail `/publications/:slug` existe déjà : aucun nouveau front
  nécessaire côté routing.
- Les filtres `?category=` et la pagination `?page=` sont purement front et
  n'imposent pas de contrat API supplémentaire (le Backend pourra les reprendre
  en query params s'il le souhaite).
- Les contenus restent des mocks typés comme le futur schéma API ; chaque bloc
  porte un commentaire `TODO API`.

---

## 6. Décisions nécessaires

1. `cover_media_id` / `media_count` : exposés par l'API ou dérivés côté Frontend ?
2. Poster : URL résolue ou `poster_media_id` + résolution côté client ?
3. Ordre des médias : colonne `position` garantie côté Backend ?
4. Sitemap : filtrer les publications `draft` avant génération ?
5. Validation des fichiers (taille, MIME, alt obligatoire) : côté API ou
   back-office, ou les deux ?
