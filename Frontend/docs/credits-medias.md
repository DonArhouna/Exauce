# Crédits médias — EXAUCE Frontend

## Nature des visuels

Les visuels de `public/publications/` sont des **SVG de substitution** créés
spécifiquement pour cette simulation. Ils ne représentent aucune organisation
réelle, ne contiennent aucun logo existant ni aucune personne identifiable.

Ils seront remplacés par des images libres de droits (Unsplash, Pexels, Pixabay…)
ou par des visuels fournis par le cabinet dès que le temps le permettra. En cas
d'utilisation d'une image de banque, la source, l'auteur et la licence devront
être ajoutés au tableau ci-dessous.

| Fichier | Description | Source | Licence |
|---------|-------------|--------|---------|
| `pub-img-1.svg` … `pub-img-12.svg` | Illustrations abstraites de démonstration (800 × 450) | Créées pour ce projet (SVG) | Libre de droits, projet de démonstration |
| `pub-poster-1.svg`, `pub-poster-2.svg` | Affiches de lecteur vidéo (800 × 450) | Créées pour ce projet (SVG) | Libre de droits, projet de démonstration |

## Vidéos de démonstration

| Fichier | Description | Source | Licence |
|---------|-------------|--------|---------|
| `pub-video-1.mp4` | Séquence florale de démonstration — 1,1 Mo, ~5,1 s | MDN Web Docs, `shared-assets/videos/flower.mp4` | Exemple CC0 / domaine public — à confirmer avant mise en production |

La vidéo est stockée localement dans `public/publications/` : **aucun hotlink**
n'est utilisé dans les données de démonstration.

## Vidéos externes (support du code uniquement)

Le lecteur (`VideoPlayer`) accepte une source `external` et affiche alors une
iframe `youtube-nocookie.com` (sans tracking, sans autoplay avant clic). Aucune
URL externe n'est utilisée dans les données actuelles ; ce mode reste disponible
pour le branchement des contenus réels.

## Remplacement avant production

- [ ] Remplacer les SVG de substitution par des images libres de droits ou des
      visuels fournis par le cabinet.
- [ ] Remplacer `pub-video-1.mp4` par une vidéo du cabinet (≤ 5 Mo par fichier).
- [ ] Compléter les crédits (auteur, source, licence) pour chaque média.
- [ ] Vérifier que chaque média possède un texte alternatif FR/EN.
