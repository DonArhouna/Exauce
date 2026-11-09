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
| `pages.sectors.data.intro` | intro de la page Secteurs (réutilise `services.indexText`) | panneau Page livré ; valeur à charger depuis la locale |
| `pages.about.data.intro` | intro de la page À propos (réutilise `home.aboutText`) | panneau Page livré ; la valeur source doit être confirmée |
| `pages.publications.data.intro` | intro de la liste (réutilise `publications.introText`) | panneau Page livré |
| `pages.services.data.title` / `intro` | titre et intro de l'index Services | panneau Page livré ; les valeurs `page_header` existantes diffèrent des clés publiques `nav.services` / `services.indexText` |
| `pages.<key>.data.seo_title` / `seo_description` | `<title>` et description des pages | champs bilingues livrés en 3a ; les valeurs SEO reprises sont à confirmer par le cabinet |
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

1. **Panneau Page** : champs `nav_label`, `intro`, `seo_title` et
   `seo_description` bilingues livrés en 3a. Les routes d'écriture doivent être
   implémentées côté Backend avant le mode HTTP ; aligner les valeurs avec les
   emplacements Frontend décrits dans `field-to-site-map.md`.
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

## 4. Couverture globale recalculée après 3a

Un élément éditorial est ici une métadonnée Page (`title`, `nav_label`, `intro`, `seo_title`, `seo_description`) ou un bloc. Un bloc compte comme couvert si son formulaire éditable est configuré ; un bloc en lecture seule compte comme non couvert. Ce taux est une mesure au niveau du bloc, pas au niveau de chaque champ ; les champs précis et leur destination sont suivis dans `docs/field-to-site-map.md`.

| Page | Éléments éditoriaux | Formulaires configurés | Couverture Backoffice | Liaison publique vérifiée |
|---|---:|---:|---:|---:|
| Accueil (`home`) | 15 | 15 | 100 % | 0 % |
| Services (`services`) | 9 | 9 | 100 % | 0 % |
| Interventions (`interventions`) | 6 | 6 | 100 % | 0 % |
| Secteurs (`sectors`) | 5 | 5 | 100 % | 0 % |
| Publications (`publications`) | 5 | 5 | 100 % | 0 % |
| Partenaires (`partners`) | 8 | 6 | 75 % | 0 % |
| À propos (`about`) | 9 | 9 | 100 % | 0 % |
| Contact (`contact`) | 7 | 5 | 71 % | 0 % |
| Mentions légales (`legal_notice`) | 8 | 8 | 100 % | 0 % |
| Espace client (`client_area`) | 5 | 5 | 100 % | 0 % |
| Page introuvable (`not_found`) | 5 | 5 | 100 % | 0 % |
| **Total** | **82** | **78** | **95 %** | **0/82 (0 %)** |

Les 27 blocs sont répartis ainsi : accueil 10, services 4, interventions 1, partenaires 3, à propos 4, contact 2, mentions légales 3. Les cinq champs Page sont présents sur les 11 pages. Après l’ouverture des blocs `modes`, `what_we_do`, `steps`, `values_grid` et `interventions_compare`, quatre éléments restent sans formulaire. La couverture Backoffice atteint 95 %, mais la liaison publique demeure à 0/82.

UI, hors périmètre : recherche, sélecteur de langue, pagination, états de chargement/vide/erreur/succès.

Les SEO renseignés reprennent les titres et descriptions des locales et composants Frontend ; toute nouvelle rédaction SEO est **à confirmer par le cabinet**. Le Frontend n’utilise pas encore ces valeurs provenant du Backoffice : `HomePage` ne transmet pas `meta.homeDescription` à `Page`, qui utilise alors le titre en repli, et les pages ne chargent pas les données d’administration. La valeur de locale home reste préremplie comme texte source, à confirmer par le cabinet avant branchement public. La route Partenaires n’existe pas dans `Frontend/src/App.tsx` ; ses valeurs SEO restent vides et le panneau indique le repli 404.

Le mock contient **27 blocs** après migration des cinq `page_header` dans le panneau Page ; le seed Backend en compte encore **32**. Aucun fichier d'`Analyse/` n'est modifié.
