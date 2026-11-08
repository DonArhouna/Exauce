# Clés éditoriales et changements attendus côté Backend

> Établi à l'étape 2 (données réelles dans le mock), à partir de l'audit de
> couverture et de `Analyse/modelisation/docs/15-inventaire-contenu.md`.
> Le dossier `Analyse/` n'est pas modifié : ce fichier est la liste de courses
> pour le Backend et pour la PR de contrat.

## 1. Clés absentes du doc 15 / `editorial_i18n.json`

Le doc 15 inventorie 184 clés ; le frontend en compte 221. Les clés
éditoriales suivantes n'ont **aucune cible** dans le modèle aujourd'hui :

| Clé | Emplacement sur le site | Cible proposée |
|---|---|---|
| `nav.partners` | menu, fil d'Ariane | `pages.partners.data.nav_label` |
| `partners.*` (16 clés) | page Partenaires entière | `pages.partners.data.*` et `page_sections.partners.{marquee,grid}.data.*` |
| `identity.tagline` | texte du pied de page | `site_settings.identity.tagline` (déjà signalé §19) |
| `pages.sectors.data.intro` | intro de la page Secteurs (réutilise `services.indexText`) | à créer (§19) |
| `pages.about.data.intro` | intro de la page À propos (réutilise `home.aboutText`) | à créer |
| `pages.publications.data.intro` | intro de la liste (réutilise `publications.introText`) | à créer |
| `pages.services.data.title` / `intro` | titre et intro de l'index Services | à créer (`page_header` n'est pas rendu) |
| `pages.<key>.data.seo_title` / `seo_description` | `<title>` et description des 11 pages | généraliser l'accueil (§19) |
| `publications.media*`, `hasVideo`, `videoLabel`, `mediaBadge`, `paginationPrev/Next`, `pageOf`, `imageCaption`, `thumbnails` | galerie du détail et pagination | libellés d'interface, à classer « UI » au doc 15 |

Constats vérifiés sur le site (`/fr` et `/en`) :

- les blocs `page_header` du seed **ne sont pas rendus** : titres et intros
  viennent de `nav.*`, `services.indexText`, `interventions.introText`,
  `publications.introText`, `contact.introText`, `home.aboutText` ;
- les boutons du hero lisent `common.contactUs` / `common.ourServices`, pas
  `hero.primary_cta` / `secondary_cta` (champs retirés de l'éditeur) ;
- la page Espace client rend un **formulaire de connexion**, pas le bandeau
  `coming_soon` (bloc retiré du seed) ;
- la page Contact lit `contact.officesTitle/officesIntro/addressesComing/
  mapComing` plutôt que les champs du bloc `offices_grid` ;
- les grilles d'accueil affichent un **sur-titre** et un titre, jamais
  d'introduction ; seule la grille audit affiche un texte ;
- les 9 clés mortes listées au doc 15 sont toujours présentes dans `fr.json`
  et `en.json` (`heroKicker`, `heroTitle1..3`, `trust.kicker`,
  `common.backToTop`, `common.followUs`, `common.breadcrumbNav`,
  `publications.sampleNotice`) ; `services.indexTitle` n'est utilisé nulle part.

## 2. Changements attendus côté Backend

1. **Panneau Page** : exposer `nav_label`, `intro`, `seo_title`,
   `seo_description` par langue dans `AdminPageDetail` (aujourd'hui seul
   `title` existe), et retirer l'obligation de blocs `page_header`.
2. **Catalogue de sections** : `hero` sans `primary_cta`/`secondary_cta` ;
   grilles avec `kicker` ; `audit_grid` seul avec `text` ;
   `publications_grid` avec `cta_label` et `empty_text` ; `stats` avec
   `value` en lecture seule (décompte calculé : 7/3/3/2).
3. **Partenaires** : 11ᵉ page (`partners`), blocs `partners_marquee`
   (`title`, `intro`) et `partners_grid` (`title`, `intro`, `notice`), entité
   `partner` (nom, description par langue, logo média, URL). Les 8 entrées du
   seed sont des exemples de démonstration.
4. **Espace client** : supprimer `coming_soon` du seed ; le template public
   est un formulaire de connexion (v2 non livrée).
5. **Bureaux** : un seul bureau publié, le siège de Dakar ; adresse en texte
   d'attente, e-mail et téléphones publics. `Office` doit porter
   `translations` (écart déjà consigné, `mock-divergences.md` §6).
6. **Publications** : le front en affiche 6, `content_data.json` n'en exporte
   que 3 ; la source de vérité retenue est le front (6, toutes marquées
   démonstration).
7. **Contrat** : les champs ci-dessus (panneau Page, kickers, `readOnly`,
   partenaires, paramètres) sont à ajouter dans la PR de contrat unique.

## 3. Reste à faire (étapes 3 à 5)

- Étape 3 : panneau Page, blocs en lecture seule rendus éditables, libellés
  « langage du site », aperçu fidèle, écran Paramètres.
- Étape 4 : Publications (médias ordonnés, alt par langue, couverture,
  limites) puis Médiathèque.
- Étape 5 : Arbre des services, Secteurs, Interventions, Équipe, Catégories,
  Partenaires.
