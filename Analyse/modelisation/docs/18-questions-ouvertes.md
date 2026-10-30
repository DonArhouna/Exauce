# 18 · Synthèse des questions ouvertes et décisions attendues

> 🟡 **Statut : M6 — à faire valider.**
> Ce document récapitule de manière exhaustive l'ensemble des arbitrages de conception
> et de cadrage technique qui requièrent votre validation formelle avant d'engager
> l'implémentation du Backend et du Back-office.

---

## 1. Questions ouvertes d'architecture et de routes (Série Q-100)

| ID | Sujet | Constat actuel | Options en arbitrage | Recommandation technique |
|---|---|---|---|---|
| **Q-101** | **URL d'une prestation** | Les 94 prestations sont aujourd'hui affichées sur la page du domaine parent sous forme de liste. Elles ne possèdent pas d'URL propre. | **S1 (Ancre stable)** : `.../{domaine}#{groupe}/{prestation}`. Rapide, pas de nouveau gabarit, mais la redirection 301 HTTP côté serveur est impossible car le fragment `#` n'est pas transmis au serveur.<br><br>**S2 (Page dédiée)** : `.../{domaine}/{groupe}/{prestation}`. URL canonique, indexation SEO propre, redirection 301 automatique lors d'une modification de slug, mais nécessite un gabarit d'affichage dédié pour 94 prestations. | **Option S2** recommandée si l'objectif de redirection automatique et de référencement précis par prestation est prioritaire ; sinon **Option S1** pour conserver la parité stricte avec l'ergonomie actuelle. |
| **Q-102** | **Pages légales (URLs)** | Le frontend actuel sert **une seule URL** (`/mentions-legales` ou `/legal-notice`) regroupant les mentions, la politique de confidentialité et la gestion des cookies en 3 blocs. | **L1 (1 page + 3 sections)** : Conserve l'URL unique actuelle. Conforme à la maquette initiale.<br><br>**L2 (3 pages distinctes)** : `/mentions-legales`, `/confidentialite`, `/cookies`. Permet des liens directs depuis le bandeau de consentement et les formulaires, et clarifie le sitemap. | **Option L1** au seed (parité stricte), avec possibilité d'activer **Option L2** à la demande sans migration de schéma (la table `pages` supporte les deux). |
| **Q-103** | **Gestion des alias de routes** | Le frontend accepte les alias croisés (ex. `/fr/sectors` et `/fr/secteurs` fonctionnent tous deux). Le canonical pointe sur `location.pathname`, ce qui crée des doublons indexables. | **A1 (Redirection 301)** : Rediriger systématiquement l'alias étranger vers le slug canonique de la langue demandée via la table `redirects`.<br><br>**A2 (Tolérance)** : Laisser l'alias fonctionner mais imposer un canonical strict vers le slug français. | **Option A1** (redirection 301) pour une hygiène SEO irréprochable. |
| **Q-104** | **Statut des 3 publications « Exemple » au seed** | Les 3 articles existants (`pub-1..3`) sont des textes de démonstration avec date et catégorie, mais sans corps rédigé. | **P1 (Publié - `published`)** : Visibles dès le premier démarrage pour conserver la parité visuelle exacte avec le frontend actuel.<br><br>**P2 (Brouillon - `draft`)** : Masqués publiquement tant que le cabinet n'a pas rédigé les vrais articles. | **Option P1** avec mention « Exemple » en pré-production, puis bascule en brouillon avant l'ouverture publique. |
| **Q-105** | **Auteur des publications d'exemple** | Le frontend affiche « Assane KANE ». Aucun utilisateur n'existe encore en base avant le premier seed. | **U1 (Compte utilisateur)** : Créer automatiquement le compte fondateur dans `users` au seed et y lier les articles via `author_id`.<br><br>**U2 (Champ texte libre)** : Autoriser un nom d'auteur textuel dans `data.author_name` tant qu'aucun compte n'est rattaché. | **Option U1** (création du compte fondateur au seed). |

---

## 2. Décision sur le mode de rendu SEO (Document 17)

Conformément à l'analyse détaillée du document [17 · SEO et rendu](17-seo-rendu.md) :

| Option | Description | Coût d'infrastructure | Complexité |
|---|---|---|---|
| **Option A (Recommandée)** | **Prérendu au build (SSG / Static Site Generation)** : Nginx sert les 30 fichiers HTML statiques complets (SEO 100% garanti pour tous les robots). Régénération automatique déclenchée par webhook lors des publications. | **0 € / mois** additionnel (25 Mo RAM sur le serveur Docker Compose existant) | 2 à 3 jours-homme |
| **Option B** | **Rendu runtime serveur (SSR Node.js)** : Un conteneur Node.js exécute React à chaque visite pour composer le HTML à la volée. | VPS avec +2 Go de RAM requis | 6 à 8 jours-homme + maintenance continue du runtime |

👉 **Décision attendue** : Confirmation du choix de l'**Option A**.

---

## 3. Validation du modèle éditorial cible (Document 16)

Veuillez confirmer votre accord sur les choix structurants du modèle :
1. **`page_sections` (blocs typés)** : Découpage des pages en blocs réordonnables (`hero`, `trust_bar`, `stats`, `cta`, `domains_grid`, `legal_document`...) avec configuration JSONB validée par schéma et traductions stockées dans `entity_translations` (`entity_type='page_section'`).
2. **`offices`** : Table dédiée pour les implantations géographiques, permettant un siège unique (`is_headquarters=true`), des coordonnées multiples (téléphones, e-mail, carte) et des traductions par ville/pays.
3. **`content_nodes.source_key`** : Présence d'une clé textuelle stable et unique (index partiel) assurant l'idempotence stricte et la réversibilité du script de migration sans dérive.
