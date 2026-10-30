# 13 · Migration du frontend vers la base

> 🟡 **Statut : M5 — à faire valider.**
> Réécrite le 30/10/2026 à partir de l'état **réel** du frontend
> (`Frontend/src`), et non du contrat d'API antérieur. Elle décrit : ce que
> contient le frontend aujourd'hui, la correspondance champ à champ vers le
> schéma cible ([06](06-donnees.md), [16](16-modele-editorial.md)), les
> identifiants manquants, la couche API à substituer, le seed, les tests de
> parité, l'impact SEO/sitemap/recherche, le plan de bascule et de retour
> arrière.
>
> **Règle** : aucune ligne de backend n'est écrite avant validation de cette
> page et des pages 15, 16 et 18.

## 0. Sources réelles et périmètre

| Fichier / export | Nature aujourd'hui | Consommé par | Cible |
|---|---|---|---|
| `src/data/content.data.ts` → `ORGANIZATION` (5 champs) | constantes codées en dur | `Footer`, `UtilityBar`, `ContactPage`, `ContactCtaSection`, `ComingSoonPage`, `HomePage` (JSON-LD) | `offices` (siège) + `site_settings` groupe `identity` |
| `src/data/content.data.ts` → `SERVICES` | 2 familles / 10 domaines / 20 groupes / **94 prestations** | `routes.ts`, `ServicesIndexPage`, `ServiceDomainPage`, `DomainsSection`, `StatsSection`, `SearchOverlay`, sitemap | `content_nodes` + `entity_translations` |
| `src/data/content.data.ts` → `SECTORS` | 3 univers + 9 sous-catégories | `SectorsPage`, `SectorsSection`, `SearchOverlay`, sitemap | `sectors` |
| `src/data/content.data.ts` → `INTERVENTIONS` | 2 volets (`recurrentes`, `ponctuelles`) | `InterventionsPage`, `InterventionsSection`, `SearchOverlay`, sitemap | `intervention_types` + sections `interventions_compare` |
| `src/data/content.data.ts` → `PUBLICATIONS_MOCK` | 3 publications « Exemple » (`pub-1..3`) | `PublicationsPage`, `PublicationDetailPage`, `PublicationsSection`, `SearchOverlay`, sitemap | `publications` + `categories` + `entity_translations` |
| `src/lib/routes.ts` → `PAGE_SLUGS` | 9 clés de routes statiques (fusion Contact) | tous les liens, `translatePath`, fil d'Ariane, sitemap | `pages` (10 lignes) + slugs en base |
| `src/lib/routes.ts` → `ALL_DOMAINS`, `domainNeighbors` | ordre global déduit du tableau `SERVICES` | navigation précédent/suivant d'un domaine | ordre `content_nodes.position` renvoyé par l'API |
| `src/i18n/locales/{fr,en}.json` | **184 clés** par langue | toute l'interface | 125 en base, 45 UI, 5 techniques, 9 supprimées ([15](15-inventaire-contenu.md)) |
| `src/services/api/api.ts` | 4 fonctions **mockées** | publications, contact, espace client | appels HTTP `/api/v1` |
| `src/services/api/client.ts` | `API_URL = VITE_API_URL ?? 'http://localhost:8000/api'` | rien d'autre aujourd'hui | `…/api/v1` |
| `scripts/generate-sitemap.mjs` | **29 URLs** générées depuis des tables **dupliquées** | `public/sitemap.xml` | `GET /api/v1/sitemap.xml` (EF-701) |
| `src/components/layout/SearchOverlay.tsx` | recherche **locale par sous-chaîne** sur les titres | header | `GET /api/v1/search` (FTS, EF-201…204) |
| `src/components/layout/Page.tsx` | title, description, OG, canonical, hreflang | toutes les pages | métadonnées servies par l'API + rendu SEO ([17](17-seo-rendu.md)) |

Le frontend regroupe les données de bureau dans `content.data.ts` (`OFFICES`,
1 entrée `siege-dakar`) et `ORGANIZATION`, alimentant la page `ContactPage`
(section « Nos implantations »). Le nom du fondateur et son rôle sont dans `i18n`
(`home.founder`, `home.founderRole`), sa biographie est un texte « à venir ».

## 1. Correspondance champ à champ

### 1.1 `ORGANIZATION` → `offices` + `site_settings`

`ORGANIZATION` ne contient que 5 champs ; il mélange l'identité de la
société et les coordonnées d'un bureau.

| Champ source | Valeur actuelle | Cible | Remarque |
|---|---|---|---|
| `name` | `EXAUCE Audit & Conseils SAS` | `site_settings` (`identity`, `legal_name`) | non traduit ; le nom commercial / la tagline sont des clés séparées |
| `email` | `contact@exauceac.com` | `offices` (siège `hq`) `email` | source unique pour footer, bandeau, contact, localisations |
| `phoneFixed` | `+221 33 814 51 24` | `offices.hq.phone_fixed` | format affiché conservé ; `tel:` normalisé à la volée |
| `phoneMobile` | `+221 77 099 31 83` | `offices.hq.phone_mobile` | idem |
| `city` | `Dakar` | `entity_translations(office, hq).city` | traduisible (`Dakar` identique FR/EN) |

Les champs absents aujourd'hui — lignes d'adresse, région, horaires, photo,
lien de carte — existent dans `offices` mais restent **vides** au seed : ils
ne sont pas inventés (doc 15 §19). Le JSON-LD `OrganizationJsonLd` est
reconstruit depuis `site_settings.identity` + le bureau siège.

### 1.2 `SERVICES` → `content_nodes` + `entity_translations`

| Champ source | Type source | Cible | Remarque |
|---|---|---|---|
| `id` (famille, domaine, groupe) | `string` stable | `content_nodes.source_key` | idempotence du seed ; `content_nodes.id` reste un UUID |
| — | — | `content_nodes.node_type` | `family` / `domain` / `group` / `service` |
| `parentId` / `children` implicites | arborescence de tableaux | `content_nodes.parent_id` + `position` | position = index dans le tableau parent |
| `slug.fr` / `slug.en` | `LocalizedText` | `entity_translations.slug` | unicité `(entity_type, lang, slug)` |
| `title.fr` / `title.en` | `LocalizedText` | `entity_translations.data.title` | une ligne `fr`, une ligne `en` |
| `intro.fr` / `intro.en` | `LocalizedText` | `entity_translations.data.intro` | idem |
| `tagline.fr` / `tagline.en` (familles seulement) | `LocalizedText` | `entity_translations.data.tagline` | champ autorisé par le schéma du type `node` |
| `icon` (domaines) | nom d'icône Lucide | **non migré** | choix de présentation : table `source_key → icône` côté frontend ; non éditorial |
| `items[]` (prestations, `LocalizedText[]`) | 94 chaînes sans id ni slug | `content_nodes` (`node_type='service'`) + traductions | voir §2.1 : création d'identifiants et de slugs |
| `domains[]` / `groups[]` | tableaux imbriqués | enfants `content_nodes` | 2 → 10 → 20 → 94 |

L'ordre d'affichage ne doit plus dépendre de `SERVICES[0]` ni de
`ALL_DOMAINS` : l'API renvoie `position` et l'ordre des parents.

### 1.3 `SECTORS` → `sectors`

| Champ source | Cible | Remarque |
|---|---|---|
| `id` (`public`, `prive`, `non-gouvernemental`) | `sectors.code` (`kind='sector'`) | `source_key` identique |
| `slug`, `title`, `intro` | `entity_translations` (`entity_type='sector'`) | slug déjà présent |
| `categories[].id` (9) | `sectors.code` (`kind='subcategory'`, `parent_id`) | `ong`, `pme`… |
| `categories[].slug`, `.title` | `entity_translations` | — |
| — | `sectors.approved` | `false` au seed : les descriptifs de `Frontend/docs/propositions-secteurs.md` ne sont pas validés (EF-104) |
| — | `sectors.position` | ordre actuel des tableaux |

Les sous-catégories n'ont **pas** d'introduction aujourd'hui : le champ
`description` reste vide tant que le cabinet n'a pas validé les textes
(doc 15 §19).

### 1.4 `INTERVENTIONS` → `intervention_types` + sections

| Champ source | Cible | Remarque |
|---|---|---|
| `id` (`recurrentes`, `ponctuelles`) | `intervention_types.code` | le code reste identique au frontend |
| `slug`, `title`, `intro` | `entity_translations` (`entity_type='interventiontype'`) | — |
| `home.signature.grow` / `.contribute` (i18n) | `entity_translations.data.signature` | phrases signature réutilisées par l'accueil et la page interventions |
| `interventions.compare*`, `interventions.row*` (i18n) | `page_sections.interventions.compare` (`rows[]`) | le tableau comparatif est une **section**, pas un type d'intervention |
| — | `intervention_types.sort_order` | `recurrentes` = 1, `ponctuelles` = 2 |

### 1.5 `PUBLICATIONS_MOCK` → `publications`

| Champ source | Cible | Remarque |
|---|---|---|
| `id` (`pub-1..3`) | `publications.source_key` | remplace `legacy_key` |
| `slug.fr` / `slug.en` | `entity_translations.slug` | déjà uniques |
| `title`, `excerpt`, `body` | `entity_translations.data` | `body` est vide aujourd'hui |
| `category` (6 valeurs) | `publications.category_id` → `categories.code` | les 6 catégories `governance`, `audit`, `finance`, `hr`, `it`, `legal` sont semées |
| `date` | `publications.published_at` | **écart** : les 3 fiches sont `status='draft'` mais datées et affichées par le frontend (Q-104) |
| `author` (`Assane KANE`) | `publications.author_id` (FK `users`) **ou** `data.author_name` | aucun compte back-office n'existe au seed ; décision Q-105 |
| `image` (absente) | `publications.cover_media_id` + `entity_translations(media).alt` | restera `NULL` tant qu'aucun visuel n'est fourni |
| `status` (`draft` / `published`) | `publications.status` | même vocabulaire |

### 1.6 `PAGE_SLUGS` et routes réelles → `pages`

`PAGE_SLUGS` ne contient que 10 clés, mais l'application rend **11 pages
statiques** : la page légale unique porte trois textes (mentions,
confidentialité, cookies). Le modèle cible suit cette réalité : **une page
`legal_notice` + trois sections `legal_document`**. Éclater les trois textes
en trois URLs est une option SEO, pas un acquis (Q-102).

| Clé `PAGE_SLUGS` | FR | EN | `page_key` cible | `template` | Menu |
|---|---|---|---|---|---|
| `home` | `''` | `''` | `home` | `home` | logo |
| `services` | `services` | `services` | `services` | `standard` | ✅ 1 |
| `interventions` | `interventions` | `interventions` | `interventions` | `standard` | ✅ 2 |
| `sectors` | `secteurs` | `sectors` | `sectors` | `standard` | ✅ 3 |
| `publications` | `publications` | `publications` | `publications` | `standard` | ✅ 4 |
| `about` | `a-propos` | `about-us` | `about` | `standard` | ✅ 5 |
| `legal` | `mentions-legales` | `legal-notice` | `legal_notice` | `legal` | footer |
| `clientArea` | `espace-client` | `customer-area` | `client_area` | `coming_soon` | bandeau |
| `contact` | `contact` | `contact` | `contact` | `contact` | ✅ 6 |
| — | — | — | `not_found` | `coming_soon` | — |

Total : **10 pages**, dont **7 dans le menu** (avec `home`). `home` est la seule page dont
le slug est vide (`''`) ; `not_found` n'a pas de slug ni d'entrée sitemap.
L'ancienne route `locations` a été fusionnée dans `contact` avec redirection 301.

Les pages de détail ne sont **pas** dans `pages` : les familles, domaines et
prestations sont des `content_nodes` (`/{lang}/services/{famille}[/{domaine}]`),
les publications des `publications` (`/{lang}/publications/{slug}`).

**Alias déjà acceptés par `App.tsx`** (les deux langues fonctionnent sur les
deux préfixes) :

| URL canonique FR | Alias EN rendu aussi sous `/fr` | URL canonique EN | Alias FR rendu aussi sous `/en` |
|---|---|---|---|
| `secteurs` | `sectors` | `sectors` | `secteurs` |
| `a-propos` | `about-us` | `about-us` | `a-propos` |
| `mentions-legales` | `legal-notice` | `legal-notice` | `mentions-legales` |
| `espace-client` | `customer-area` | `customer-area` | `espace-client` |
| `contact` (301) | `locations` (→ contact#implantations) | `contact` (301) | `localisations` (→ contact#implantations) |

Ces alias produisent aujourd'hui des **doublons indexables** : `Page.tsx`
pose un canonical qui pointe vers `location.pathname`, donc chaque alias
s'auto-canonicalise. La cible est un slug canonique par langue + **301** pour
les alias (table `redirects`), ou `noindex` pour l'espace client (Q-103).

### 1.7 Textes d'interface (`i18n`)

| Classe | Nombre | Destination |
|---|---|---|
| Éditorial | **124** | base PostgreSQL (mapping complet : [15](15-inventaire-contenu.md)) |
| Interface | **44** | `fr.json` / `en.json` (exception assumée) |
| Technique | **5** | code backend + messages génériques i18n |
| Morte (à supprimer) | **9** | nulle part |
| **Total** | **182** | 173 clés après purge (FR = EN) |

Points de vigilance déjà identifiés :

- `home.trust.${onecca|uemoa|ohada|sectors}`, `home.signature.${grow|contribute}`,
  `interventions.row*` sont appelés **dynamiquement** : ils restent éditoriaux
  et doivent être résolus par l'API, pas par une recherche littérale de clé.
- `home.aboutText` est réutilisé par la page « À propos » ; `services.indexText`
  par la page secteurs ; le footer utilise `meta.homeDescription`. En v1, le
  seed **duplique** la valeur (avec avertissement dans l'éditeur) ; la
  référence partagée (`content_ref`) reste l'alternative documentée
  ([16](16-modele-editorial.md) §10).
- Les 9 clés mortes (`common.backToTop`, `common.followUs`,
  `common.breadcrumbNav`, `home.heroKicker`, `home.heroTitle1..3`,
  `home.trust.kicker`, `publications.sampleNotice`) sont supprimées à la
  bascule, pas migrées.

### 1.8 Fondateur et équipe

| Source | Cible |
|---|---|
| `home.founder` (`Assane KANE`) | `entity_translations(team_member, fondateur).full_name` |
| `home.founderRole` | `… .role` |
| `about.founderBioComing` (texte « biographie à venir ») | `team_members` : biographie vide + texte de repli porté par la section `founder_card` |
| `home.founderPhotoPlaceholder` (libellé du placeholder) | `… .photo_alt` + `team_members.media_id` (NULL tant qu'aucun portrait) |
| initiales « AK » affichées dans le cercle | repli calculé côté frontend, non stocké |

Un seul fondateur (`is_founder=true`, index partiel). La section
`founder_card` ne stocke **ni** le nom **ni** la biographie : source unique.

### 1.9 Bureaux et localisations (section Implantations de Contact)

| Source | Cible |
|---|---|
| `content.data.ts` : tableau `OFFICES` (1 entrée `siege-dakar`) | `offices` (code `hq`, `is_headquarters=true`) |
| `name` (`Siège — Dakar (Sénégal)`) | `entity_translations(office, hq).name` |
| `city` | `… .city` |
| `contact.addressesComing` | texte de repli de la section `offices_grid` (`empty_text`) |
| contacts de la colonne de droite (`ORGANIZATION`) | champs du bureau `hq` |
| — | `address_lines`, `region`, `hours`, `map_url`, `media_id` : **vides** (à fournir) |

## 2. Ce qui manque aujourd'hui et doit être créé au seed

### 2.1 Les 94 prestations n'ont ni `id` ni slug

`ServiceGroup.items` est un tableau de `LocalizedText` : aucune prestation
n'est adressable individuellement. Le seed doit fabriquer, pour chacune :

1. un `content_nodes.id` UUID ;
2. un `source_key` **déterministe** :
   `{source_key du groupe}/{slug(fr)}` (tronqué à 80 caractères, suffixe
   numérique si collision) ;
3. un slug FR et un slug EN générés depuis le titre (doc 16 §7) ;
4. en cas de doublon, contextualisation par le **groupe parent**, puis le
   domaine, puis suffixe `-2`, `-3`.

Doublons de libellés connus : « Formation des dirigeants et employés » ×13,
puis deux libellés ×2. Tous sont levés par le groupe parent : **aucun
suffixe numérique n'est nécessaire** sur le contenu actuel.

### 2.2 Autres contenus absents (à rédiger, pas à inventer)

| Contenu | État | Traitement |
|---|---|---|
| Adresse du siège, région, horaires | absent | champs `NULL` + placeholders de section |
| Photo du siège, portrait du fondateur | absent | `media_id NULL`, repli visuel |
| Biographie du fondateur | « à venir » | champ vide + `empty_text` de section |
| Descriptifs des 9 sous-catégories de secteurs | non validés | `approved=false`, non servis (EF-104) |
| Corps des 3 publications | vide | `body` vide, statut `draft` |
| Contenu juridique (mentions, confidentialité, cookies) | placeholder + bandeau | statut `draft` + `banners_pending` (H-007) |

## 3. Couche API : mocks actuels → `/api/v1`

`src/services/api/api.ts` est le **seul** point d'entrée réseau. Il ne couvre
que 4 opérations ; le reste du contenu est importé directement depuis
`content.data.ts`.

| Fonction actuelle | Comportement mock | Endpoint cible |
|---|---|---|
| `fetchPublications({ category, q })` | ignore les paramètres, renvoie les 3 mocks après 120 ms | `GET /api/v1/publications?lang=&category=&q=&page=` |
| `fetchPublicationBySlug(slug)` | cherche dans `PUBLICATIONS_MOCK` (FR **ou** EN) | `GET /api/v1/publications/{slug}?lang=` |
| `sendContactMessage(payload)` | succès simulé après 600 ms, aucune donnée envoyée | `POST /api/v1/contact` (`202`, honeypot, `Idempotency-Key`) |
| `mockLogin({ username, password })` | lève `not-implemented` | `POST /api/v1/auth/login` (espace client, v2) |

`src/services/api/client.ts` expose seulement :

```ts
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
```

Deux corrections à la bascule :

1. le chemin par défaut devient `http://localhost:8000/api/v1` (contrat
   `/api/v1`, doc 08) ;
2. `API_URL` devient la base unique de tous les appels ; aucun composant ne
   doit importer `content.data.ts` à la fin de la migration.

Fonctions à ajouter (mêmes signatures que les sélecteurs actuels) :
`getPage(key, lang)`, `getServicesTree(lang)`, `getSectors(lang)`,
`getInterventions(lang)`, `getSettingsPublic(lang)`, `search(q, lang)`,
`getSitemap()`. Les états chargement/erreur existent déjà dans
`PublicationsPage` ; ils doivent être généralisés.

## 4. Seed (renvoi à 06 §6, Point 3 validé)

Le seed est exécuté par un **script Python CLI dédié et idempotent** (`python -m app.cli.seed` / `scripts/seed.py`) et **non par une migration Alembic** :

- **Source** : un export JSON figé de `content.data.ts` + `fr.json`/`en.json` (évite tout parsing TypeScript au déploiement) ;
- **Clé de rapprochement** : `source_key` unique partiel sur les nœuds, pages, blocs de page, bureaux, équipe, publications, secteurs, types d'intervention (`ON CONFLICT (source_key) DO UPDATE`) ;
- **Transaction unique** : nœuds + traductions + pages + sections + réglages + bureaux + équipe + redirections ; échec = rollback complet ;
- **Statuts** : contenus déjà publics = `published` ; légaux = `draft` + `banners_pending` ;
- **Publications « Exemple » (Q-104)** : marquées `is_demo=true`, importées uniquement avec `--with-demo` en dev/staging et exclues en production (`--production`) ;
- **Compte Fondateur (Q-105)** : créé sans mot de passe initial (`must_reset_password=true`) avec invitation sécurisée ;
- **`redirects` (Q-103)** : contient dès le seed les 4 redirections 301 historiques de `/localisations` vers `/contact#implantations`.

Les volumes attendus (test de parité 06 §6) : 2 / 10 / 20 / 94 nœuds,
**10 pages** (7 dans le menu), 21 types de sections, **29 blocs**, 6
catégories, 3 publications, 3 + 9 secteurs, 1 bureau, 1 fondateur.

## 5. Parité et tests (CI bloquante — SC-580)

| # | Assertion | Valeur attendue |
|---|---|---|
| 1 | familles / domaines / groupes / prestations | 2 / 10 / 20 / 94 |
| 2 | chaque nœud a un slug FR **et** EN | 100 % |
| 3 | slugs de prestations uniques par langue | 94 / 94 |
| 4 | pages / pages dans le menu | 10 / 7 |
| 5 | blocs de la page d'accueil | 10 |
| 6 | blocs `legal_document` de `legal_notice` | 3 |
| 7 | secteurs / sous-catégories | 3 / 9 |
| 8 | catégories / publications importées | 6 / 3 (`draft`) |
| 9 | clés i18n éditoriales couvertes par une cible | 125 / 125 |
| 10 | clés i18n après purge des 9 mortes | 175 (FR = EN) |
| 11 | URLs du sitemap avant / après | 29 / 29 (hors exclusions Q-103/Q-104) |
| 12 | chaque URL connue du frontend répond 200 (pas de 404 de régression) | 100 % |
| 13 | canonical = URL canonique, jamais un alias | 100 % |
| 14 | hreflang FR/EN + `x-default` sur chaque page indexable | 100 % |
| 15 | aucune page technique (`404`, espace client) dans le sitemap | 0 |

Les tests existants `content.spec.ts`, `routes.spec.ts` et `contact.spec.tsx`
sont conservés et adaptés : ils vérifient aujourd'hui des invariants de
`content.data.ts` (2 familles, 94 prestations, `audit-externe`) qui doivent
devenir des invariants de l'API.

## 6. Impact SEO, sitemap et recherche

- **Sitemap** : `generate-sitemap.mjs` duplique `PAGES`, `FAMILIES`,
  `INTERVENTIONS`, `SECTORS` et extrait les publications par expression
  régulière. C'est une **seconde source de vérité** : elle est supprimée à la
  bascule au profit de `GET /api/v1/sitemap.xml` (EF-701), une entrée par
  (URL, langue) avec `xhtml:link` croisés.
- **Comptage unique et définitif du sitemap (Point 5 validé)** :
  Le sitemap XML dynamique (EF-701) compte **exactement 29 URLs** canoniques (chacune déclarée avec ses liens bilingues `xhtml:link` FR et EN croisés) :
  - **9 pages statiques** : Accueil (`/`), Services (`/services`), Interventions (`/interventions`), Secteurs (`/secteurs`), Publications (`/publications`), À propos (`/a-propos`), Contact (`/contact`), Mentions légales (`/mentions-legales`), Espace client (`/espace-client` avec section d'attente).
  - **2 familles de services** : `/services/accompagnement`, `/services/audit-externe`.
  - **10 domaines de services** (7 accompagnement + 3 audit).
  - **2 modes d'intervention** : `/interventions/recurrentes`, `/interventions/ponctuelles`.
  - **3 univers de secteurs** : `/secteurs/public`, `/secteurs/prive`, `/secteurs/non-gouvernemental`.
  - **3 publications** d'exemple (en dev/démo).
  **Total immuable = 9 + 2 + 10 + 2 + 3 + 3 = 29 URLs**.
- **URLs de filtrage `?category=` (Point 4 validé)** :
  Les URLs filtrées (ex. `/{lang}/publications?category=audit`) ne figurent **jamais** dans le sitemap XML et portent systématiquement une balise canonique pointant vers la page racine sans paramètre (`<link rel="canonical" href="https://exauceac.com/{lang}/publications" />`) pour préserver le budget de crawl et éviter tout duplicate content.
- **Publications** : les 3 fiches sont `draft` mais présentes dans le sitemap
  et affichées. Si l'API applique le statut, le sitemap tombe à 26 URLs (ou 25) et la
  page publications se vide : décision Q-104 avant le seed, pas après.
- **Alias** : les 5 paires FR/EN rendues sous les deux préfixes créent des
  doublons ; cible = 301 vers le slug canonique (Q-103).
- **Canonical / hreflang** : `Page.tsx` calcule aujourd'hui les alternates
  avec `translatePath`, qui s'appuie sur les tables locales. À la bascule,
  l'API fournit `alternate_fr`, `alternate_en`, `x-default` (EF-702) ; le
  frontend cesse de reconstruire les URLs.
- **Recherche** : `SearchOverlay` filtre par sous-chaîne sur les **titres**
  (familles, domaines, groupes, prestations, secteurs, interventions,
  publications), minimum 2 caractères, 12 résultats. Cible :
  `GET /api/v1/search?q=&lang=` (FTS + synonymes, EF-201…204), avec les mêmes
  seuils, plus les états chargement / vide / erreur et la navigation clavier.
  Le seed doit peupler `search_index` **avant** la bascule.
- **JSON-LD** : `OrganizationJsonLd` est alimenté par `ORGANIZATION` ; il
  passe par `site_settings.identity` + bureau siège. `BreadcrumbJsonLd` est
  déjà générique et suit les libellés de l'API.
- **Rendu** : le frontend est une SPA Vite ; le HTML initial ne contient pas
  le contenu éditorial. Le choix prérendu au build / SSR est traité dans
  [17](17-seo-rendu.md) — **non tranché ici**.

## 7. Plan de bascule

| Étape | Contenu | Environnement |
|---|---|---|
| 0 | Seed chargé, parité §5 verte, `search_index` peuplé | pré-production |
| 1 | Adaptateur `src/services/content/` : mêmes sélecteurs qu'aujourd'hui, derrière un **commutateur d'exécution** (`public/config.json` → `contentSource: "static" \| "api"`), pour que le retour arrière ne demande **aucun rebuild** | code |
| 2 | `API_URL` → `/api/v1` ; ajout des 7 fonctions manquantes ; `Page.tsx` consomme les alternates de l'API | code |
| 3 | Recette de parité : parcours des 30 URLs, sitemap, recherche, formulaire, JSON-LD, 404 `noindex` | pré-production |
| 4 | `contentSource: "api"` en production (fichier de configuration) | production |
| 5 | Suppression de `content.data.ts` (hors types), de `generate-sitemap.mjs` et des 9 clés mortes ; `contentSource` figé à `api` | code |

> **Pourquoi un commutateur d'exécution** : `VITE_*` est figé au build ; il
> obligerait à reconstruire le frontend pour revenir en arrière. Un
> `config.json` statique (ou un en-tête de l'API) rend le rollback immédiat.
> Si le cabinet préfère une bascule par release, l'alternative est un build
> séparé — décision d'exploitation à confirmer.

## 8. Retour arrière

1. `contentSource: "static"` : le frontend réutilise les données figées, sans
   redéploiement (si l'étape 5 n'est pas encore faite) ;
2. si la base est en cause : restauration de la sauvegarde chiffrée
   (page 11 §6, RPO ≤ 24 h) ;
3. les lignes créées après T0 (redirections, réglages, médias) sont
   identifiées par `created_at` et supprimées via l'outil d'annulation
   (`undo-migration`), après audit.

Durée visée : **< 5 minutes** (changement de configuration + healthcheck),
dans une fenêtre de faible trafic à convenir avec le cabinet (SC-590).

## 9. Écarts, risques et questions ouvertes

| # | Sujet | Constat | Décision attendue |
|---|---|---|---|
| Q-101 | URL d'une prestation | aujourd'hui une **ancre** (`#domaine/groupe`) ; le slug n'est pas envoyé au serveur | ancre stable (S1) ou page dédiée (S2) — détail et coûts : doc 16 §7.4 |
| Q-102 | Pages légales | le frontend rend **une** URL (`mentions-legales`) avec 3 blocs ; le modèle cible retient 1 page + 3 sections | conserver 1 URL (parité) ou éclater en 3 URLs indexables (SEO) |
| Q-103 | Alias et espace client | 5 alias FR/EN s'auto-canonicalisent ; `/espace-client` est dans le sitemap | 301 vers le canonique + `noindex` sur l'espace client ? |
| Q-104 | Publications « Exemple » | `status='draft'` mais affichées, datées et présentes au sitemap | les publier (`published`) au seed ou les masquer jusqu'à rédaction ? |
| Q-105 | Auteur d'une publication | `author` est un nom affiché, pas un compte (`author_id` → `users`) | créer un compte auteur, ou stocker un nom d'affichage traduit ? |
| Q-106 | Base d'API et origines | `VITE_API_URL` pointe sur `…/api` sans version ; CORS non traité ici | confirmer `/api/v1` + même origine via reverse proxy (doc 09) |

**Risques techniques identifiés dans le code actuel** (à corriger pendant
l'étape 2, pas des questions) :

- `StatsSection.tsx` et `ServicesIndexPage.tsx` supposent
  `SERVICES[0].id === 'accompagnement'` ;
- `DomainsSection.tsx` code en dur `'audit-externe'` et
  `'accompagnement'` dans les liens ;
- `ALL_DOMAINS` et `domainNeighbors` dépendent de l'ordre des tableaux ;
- `generate-sitemap.mjs` duplique les slugs (dérive garantie à moyen terme) ;
- `translatePath` construit les alternates à partir des données locales, donc
  un contenu ajouté en base sera absent des hreflang tant que l'API n'est pas
  branchée.

## 10. Rapprochement avec `Frontend/docs/api-contract.md`

`Frontend/docs/api-contract.md` (2,5 ko) décrit l'ancien contrat
(`/api/services`). À la bascule :

1. il est **remplacé** par `Analyse/modelisation/docs/openapi.yaml` (source
   unique, `/api/v1`) ;
2. le fichier frontend devient un simple lien vers cette source, sans contenu
   dupliqué ;
3. toute divergence restante est listée en page 08 §8 et doit être nulle au
   moment de l'étape 4.

Aucun autre document ne doit décrire les endpoints : le contrat OpenAPI est
la seule référence.
