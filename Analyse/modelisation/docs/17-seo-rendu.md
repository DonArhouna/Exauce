# 17 · SEO et rendu public — Options chiffrées

> 🟡 **Statut : M5 — à faire valider.**
> Analyse comparative chiffrée des deux options techniques de rendu pour le
> frontend public d'EXAUCE Audit & Conseils SAS (actuellement une SPA Vite / React).
> **Conformément aux consignes de conception, ce choix n'est pas tranché unilatéralement**
> et nécessite l'arbitrage du cabinet.

---

## 1. Contexte et enjeux SEO

Le site actuel est une Single Page Application (SPA) construite avec Vite et React.
Le fichier initial servi par le serveur web est une coquille HTML minimale (`Frontend/index.html`) contenant une balise `<div id="root"></div>`.
Les balises `<title>`, `<meta name="description">`, `<meta property="og:*">`, ainsi que les balises `<link rel="canonical">` et `<link rel="alternate" hreflang="...">` sont aujourd'hui injectées dynamiquement côté client par le composant `Page.tsx` via le DOM (`document.head`).

### Risques d'une SPA pure pour le SEO d'EXAUCE
1. **Indexation par les moteurs secondaires** : Si Googlebot exécute aujourd'hui le JavaScript avec un délai variable, les moteurs régionaux ou alternatifs (Bing, Yahoo, DuckDuckGo) et les crawlers de réseaux sociaux (LinkedIn, WhatsApp, Twitter/X) n'exécutent pas ou mal le JavaScript. Lors du partage d'un lien d'article ou d'un domaine d'expertise, les aperçus Open Graph risquent d'être vides ou de n'afficher que les données par défaut.
2. **Budget de crawl et délai d'indexation** : Le rendu JS par Googlebot n'est pas instantané (file d'attente d'hydratation). Pour un cabinet d'audit souhaitant asseoir son autorité sur des mots-clés stratégiques à Dakar et dans la zone UEMOA, un HTML directement lisible dès la première trame réseau est un avantage compétitif majeur.

Pour résoudre ce constat, deux options d'architecture sont envisageables.

---

## 2. Option A · Prérendu au build (SSG / Static Site Generation)

### 2.1 Principe et fonctionnement
Lors de la publication ou du déploiement en production, un script de prérendu automatisé (ex. `@prerenderer/rollup` ou script Vite SSG) parcourt la liste des **30 URLs publiques** déclarées par l'API :
- 11 pages institutionnelles (accueil, services, interventions, secteurs, publications, à propos, localisations, contact, mentions légales, etc.) en FR et EN ;
- 10 domaines d'intervention ;
- 3 publications d'exemple ;
- 2 types d'intervention.

Pour chaque URL, le script génère un fichier HTML complet contenant :
- Les balises SEO finales (`<title>`, description, hreflang, Open Graph) écrites en dur dans le `<head>` ;
- L'arborescence DOM pré-rendue dans `<div id="root">` pour un affichage immédiat ;
- Les scripts React bundle pour l'hydratation interactive immédiate.

### 2.2 Déploiement et architecture
- **Serveur web** : Nginx sert directement les fichiers HTML statiques depuis le système de fichiers.
- **Runtime** : **Aucun serveur Node.js en production 24h/24**. Le conteneur frontend reste un simple conteneur Nginx allégé (Alpine Linux).
- **Mise à jour du contenu** :
  - *Option A1 (Rebuild automatique)* : Un webhook sur l'action `publish` du back-office déclenche un build de prérendu incrémental en tâche de fond (durée ~20 secondes).
  - *Option A2 (Mix SPA dynamique)* : Le prérendu garantit le socle indexable pour les robots ; les visiteurs naviguent ensuite en mode SPA fluide en consommant l'API `/api/v1` sans rechargement.

### 2.3 Métriques et chiffrage (Option A)
| Critère | Valeur / Évaluation |
|---|---|
| **TTFB (Time To First Byte)** | **< 25 ms** (fichiers statiques servis en mémoire par Nginx) |
| **Consommation mémoire serveur** | **~25 Mo** (Nginx pur) |
| **Disponibilité en cas de panne DB** | **100 %** : le site vitrine reste navigable même si PostgreSQL redémarre |
| **Temps de génération au build** | 15 à 30 secondes pour 30 URLs |
| **Complexité de développement** | **Faible (2 à 3 jours-homme)** : conservation du code React actuel sans réécriture d'architecture |
| **Coût d'hébergement additionnel** | **0 € / mois** (s'intègre dans le serveur Docker Compose existant) |
| **Risques techniques** | Faibles : pas de fuite mémoire serveur, pas d'incompatibilité de session |

---

## 3. Option B · Rendu côté serveur au runtime (SSR - Server-Side Rendering)

### 3.1 Principe et fonctionnement
Chaque requête HTTP arrivant sur le domaine public est interceptée par un serveur applicatif Node.js (Express ou Fastify).
À la volée :
1. Le serveur Node.js contacte le backend FastAPI (`http://backend:8000/api/v1/...`) pour récupérer les données de la page ;
2. Le moteur React exécute `renderToString()` côté serveur ;
3. Le serveur assemble le document HTML complet et l'envoie au client ;
4. Le navigateur reçoit le HTML complet, l'affiche, puis télécharge le bundle JS pour « hydrater » la page.

### 3.2 Déploiement et architecture
- **Conteneurs requis** : Ajout d'un conteneur dédié `frontend-ssr` (Node.js 20 LTS) dans le fichier `docker-compose.yml`.
- **Topologie** : Nginx agit en reverse-proxy vers `frontend-ssr:3000`, qui lui-même interroge `backend:8000`.
- **Mise en cache obligatoire** : Sans couche de micro-cache (Nginx `proxy_cache` ou Redis), chaque visite génère un coût CPU significatif sur le serveur.

### 3.3 Métriques et chiffrage (Option B)
| Critère | Valeur / Évaluation |
|---|---|
| **TTFB (Time To First Byte)** | **120 à 350 ms** (temps de transit Node ↔ FastAPI + rendu React) |
| **Consommation mémoire serveur** | **150 à 300 Mo** pour le process Node.js (avec risque de fuite mémoire) |
| **Disponibilité en cas de panne DB** | **0 %** sans cache intermédiaire : renvoie une page d'erreur 500 si l'API ne répond pas |
| **Fraîcheur des données** | Immédiate (toute modification au back-office est visible au rechargement suivant) |
| **Complexité de développement** | **Élevée (6 à 8 jours-homme)** : nécessite d'isoler les dépendances au DOM (`window`, `localStorage`, composants graphiques d'animation comme Framer Motion / Reveal) |
| **Coût d'hébergement additionnel** | Nécessite un serveur VPS avec au moins 2 Go de RAM supplémentaire pour garantir la stabilité |
| **Risques techniques** | Erreurs d'hydratation (mismatch HTML serveur vs client), fuites mémoire Node.js sur les processus longs |

---

## 4. Synthèse comparative et grille de décision

| Dimension | Option A · Prérendu au build (SSG) | Option B · Rendu runtime (SSR) |
|---|---|---|
| **Performance brute (TTFB)** | 🟢 Excellent (< 25 ms) | 🟡 Moyen (120 - 350 ms) |
| **SEO & Crawlers (Googlebot, Bing, réseaux)** | 🟢 100 % couvert | 🟢 100 % couvert |
| **Simplicité d'exploitation** | 🟢 Très simple (Nginx statique) | 🔴 Complexe (supervision Node.js en production) |
| **Robustesse / Tolérance aux pannes** | 🟢 Indépendant du backend en lecture | 🔴 Dépendance directe au backend à chaque requête |
| **Délai de parution après édition** | 🟡 30 à 60 s (si rebuild) ou immédiat en SPA client | 🟢 Immédiat |
| **Effort de mise en œuvre** | 🟢 2 à 3 jours-homme | 🔴 6 à 8 jours-homme |
| **Empreinte RAM serveur** | 🟢 ~25 Mo | 🔴 ~250 Mo |

---

## 5. Recommandation technique (soumise à validation)

- **Option A (Prérendu au build)** est **techniquement et économiquement recommandée** pour le site vitrine institutionnel d'EXAUCE. Le volume de pages (environ 30 à 100 pages à moyen terme) correspond exactement au profil d'excellence de la génération statique : rapidité maximale, coût nul, robustesse totale, absence de surface de vulnérabilité Node.js en ligne.
- **Option B (SSR)** ne se justifie que si le cabinet prévoit des milliers d'articles de blog avec un besoin de publication à la seconde près sans aucun délai de régénération.

👉 **Décision attendue de votre part** :
1. Validez-vous l'**Option A** (Prérendu au build / SSG) avec régénération en tâche de fond ?
2. Ou souhaitez-vous engager l'**Option B** (SSR Node.js runtime) malgré le surcoût de complexité et d'infrastructure ?
