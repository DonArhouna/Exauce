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
Lors de la publication ou du déploiement en production, un script de prérendu automatisé (ex. `@prerenderer/rollup` ou script Vite SSG) parcourt la liste des **29 URLs publiques** déclarées par l'API (après fusion de Localisations dans Contact) :
- 11 pages institutionnelles (accueil, services, interventions, secteurs, publications, partenaires, à propos, contact unifié, mentions légales, etc.) en FR et EN ;
- 10 domaines d'intervention ;
- 3 publications d'exemple ;
- 2 types d'intervention.

Pour chaque URL, le script génère un fichier HTML complet contenant :
- Les balises SEO finales (`<title>`, description, hreflang, Open Graph) écrites en dur dans le `<head>` ;
- L'arborescence DOM pré-rendue dans `<div id="root">` pour un affichage immédiat ;
- Les scripts React bundle pour l'hydratation interactive immédiate.

### 2.2 Déploiement, Nginx et gestion des redirections 301 (Décision Q-107 validée)

- **Serveur web & Runtime** : Nginx sert directement les 29 fichiers HTML statiques prérendus depuis le système de fichiers. **Aucun serveur Node.js en production 24h/24**. Le conteneur frontend reste un simple Nginx allégé (Alpine Linux, ~25 Mo RAM).
- **Comment la table `redirects` devient des redirections 301 effectives sans FastAPI** :
  Puisque Nginx sert les pages statiques sans solliciter FastAPI, les requêtes publiques ne traversent pas de middleware Python en lecture nominale. Deux mécanismes complémentaires garantissent des redirections 301 instantanées :
  1. **Génération d'une `map` Nginx à la publication (chemin ultra-rapide)** :
     Lors de chaque publication ou modification de redirection dans le back-office, le pipeline extrait les lignes actives de la table PostgreSQL `redirects` et génère un fichier de mapping Nginx `/etc/nginx/conf.d/redirects.map` :
     ```nginx
     map $uri $redirect_301_target {
         default "";
         /fr/localisations /fr/contact#implantations;
         /en/locations     /en/contact#implantations;
         /fr/locations     /fr/contact#implantations;
         /en/localisations /en/contact#implantations;
         # Slugs d'entités renommés par les éditeurs...
     }
     ```
     Le worker déclenche ensuite un rechargement à chaud (`nginx -s reload`). Nginx intercepte l'URL dès l'entrée et répond en **HTTP 301 Moved Permanently en < 5 ms**, sans solliciter le backend.
  2. **Fallback dynamique `@fastapi_fallback` (sécurité pour les chemins inconnus)** :
     Dans le bloc `server` de Nginx :
     ```nginx
     location / {
         if ($redirect_301_target != "") {
             return 301 $redirect_301_target;
         }
         try_files $uri $uri/index.html @fastapi_fallback;
     }

     location @fastapi_fallback {
         # Si un slug vient d'être renommé avant le prochain reload Nginx,
         # FastAPI interroge la table redirects et renvoie 301 ou la page 404.
         proxy_pass http://backend:8000/api/v1/public/resolve-path?path=$uri;
     }
     ```

### 2.3 Pipeline de publication automatisé (Zero Downtime & Rollback)

1. **Déclenchement** :
   - Un éditeur clique sur « Publier » sur une entité modifiée ou sur le bouton global « Publier les modifications » dans le header du back-office.
   - L'API FastAPI enregistre un job dans la table `publication_jobs(id, triggered_by, status='queued', started_at, completed_at, log_output)`.
2. **Exécution par le Worker en tâche de fond** :
   - Le worker (APScheduler / Celery / tâche ARQ) prend le job en charge (`status='building'`).
   - Il interroge la base PostgreSQL pour extraire les contenus publiés et la table `redirects`.
   - Il génère les 29 fichiers HTML statiques ainsi que `sitemap.xml` et `redirects.map` dans un répertoire temporaire isolé : `/var/www/releases/build-<job_id>`.
3. **Smoke-test et déploiement atomique** :
   - **Vérification automatique** : Le worker contrôle la présence des 29 fichiers HTML, la validité des balises `<title>`, et la non-vacuité de `sitemap.xml`.
   - **Si succès (Bascule atomique)** :
     - Bascule instantanée du lien symbolique : `ln -sfn /var/www/releases/build-<job_id> /var/www/current`.
     - Rechargement de Nginx : `nginx -s reload`.
     - Le job passe à `status='success'` avec horodatage de fin. Les anciennes releases sont purgées (conservation des 3 dernières pour rollback express).
   - **Si échec (Rollback immédiat garanti)** :
     - Le lien symbolique `current` **n'est pas touché**.
     - Le site public existant reste **100 % en ligne sans aucune interruption ni page blanche**.
     - Le répertoire temporaire défaillant est conservé pour inspection, le job passe à `status='failed'`, et le journal d'erreurs d'exécution (`log_output`) est consigné.
4. **Visibilité pour l'éditeur dans le Back-office** :
   - Un composant persistant dans la barre d'administration informe l'éditeur en temps réel (via Server-Sent Events `/api/v1/admin/publication-status` ou polling court) :
     - 🟡 *« Publication en cours... (étape 2/3 : prérendu HTML) »*
     - 🟢 *« Site publié avec succès (dernière parution : aujourd'hui à 15:42) »*
     - 🔴 *« Échec de la publication : la page À propos comporte une balise non fermée. Le site en ligne n'a pas été modifié. [Voir le rapport] »*
   - Un écran d'historique `/admin/publications/history` liste l'ensemble des builds passés avec leur auteur, statut et logs.

### 2.4 URLs filtrées `?category=` et hygiène SEO

- **Règle canonique** : Les URLs de listing filtrées (ex. `/fr/publications?category=audit` ou `/en/publications?category=governance`) portent systématiquement une balise canonique pointant vers la page racine sans paramètre de requête :
  ```html
  <link rel="canonical" href="https://exauceac.com/fr/publications" />
  ```
- **Exclusion du Sitemap XML** : Seule l'URL sans filtre (`/fr/publications` et `/en/publications`) est déclarée dans `sitemap.xml`. Les URLs avec querystring `?category=` sont formellement exclues du sitemap pour éviter la dispersion du budget de crawl des robots d'indexation.

### 2.5 Métriques et chiffrage (Option A)
| Critère | Valeur / Évaluation |
|---|---|
| **TTFB (Time To First Byte)** | **< 25 ms** (fichiers statiques servis en mémoire par Nginx) |
| **Consommation mémoire serveur** | **~25 Mo** (Nginx pur) |
| **Disponibilité en cas de panne DB** | **100 %** : le site vitrine reste navigable même si PostgreSQL redémarre |
| **Temps de génération au build** | 15 à 30 secondes pour 29 URLs |
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

## 5. Arbitrage formel validé (Décision Q-107)

- **Option A (Prérendu au build / SSG)** est **officiellement retenue** pour le site vitrine institutionnel d'EXAUCE.
- Le volume de pages (29 URLs) correspond exactement au profil d'excellence de la génération statique : rapidité maximale (< 25 ms), coût d'hébergement additionnel nul, robustesse totale en cas de panne de la base de données, et sécurité renforcée (pas de runtime Node.js exposé publiquement).
- Nginx sert les fichiers prérendus, applique la `map` de redirections 301 générée automatiquement, et ne relaie à FastAPI que le fallback et les requêtes d'API dynamiques (`/api/v1`).

