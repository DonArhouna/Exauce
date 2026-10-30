# 02 · Exigences

> 🟡 **Statut : M1 — à faire valider.** Chaque exigence a : un identifiant, une priorité MoSCoW
> (Must/Should/Could/Won't), un **critère d'acceptation mesurable**, et au
> moins un scénario lié (page [04](04-scenarios.md), complété au M4).

Modules : A · Site public — B · Recherche — C · Contact/leads — D · Espace client (v2) —
E · Back-office — F · Multi-langue — G · SEO/i18n public — H · Médiathèque —
I · Audit & observabilité — J · Conformité.

## A · Site public (contenu servi par l'API)

| ID | Exigence | MoSCoW | Critère d'acceptation (mesurable) | Scénarios |
|---|---|---|---|---|
| EF-101 | Servir l'arborescence complète des services (4 niveaux : familles, domaines, groupes, prestations) dans la langue demandée | Must | `GET /api/v1/services-tree?lang=fr` renvoie 2 familles, 10 domaines, 20 groupes, 94 prestations en ≤ 300 ms (p95) | SC-101 |
| EF-102 | Détail d'un domaine : intro, groupes, prestations ; navigation domaine précédent/suivant | Must | `GET /api/v1/services/{famille}/{domaine}` inclut `prev`/`next` corrects (test de cohérence automatisé) | SC-102 |
| EF-103 | Modes d'intervention (récurrentes/ponctuelles) consultables par langue | Must | 2 types retournés, slugs traduits selon la table de slugs | SC-103 |
| EF-104 | Secteurs : 3 univers + 9 sous-catégories ; descriptifs transmis à condition d'être validés par le cabinet | Must | champ `description` obligatoirement `null` si `approved = false` (contrainte BD) | SC-104 |
| EF-105 | Publications : liste filtrable (catégorie, recherche), tri par date, détail par slug **par langue** ; ne servir que `status = published` | Must | un article `draft` n'est jamais servi publiquement (404) ; le slug demandé dans la « mauvaise » langue renvoie un **301 vers le slug canonique** de cette langue | SC-105…107 |
| EF-106 | Coordonnées du cabinet (tél. fixe/mobile, e-mail, ville, adresse postale, réseaux) servies par l'API et **modifiables au back-office** | Must | aucune coordonnée en dur dans le frontend ; modification visible après invalidation du cache ≤ 60 s | SC-110 |
| EF-107 | Contenu de la page « À propos » (intro, fondateur, manière de travailler, valeurs) éditable | Should | blocs éditables séquentiels, versionnés | SC-111 |
| EF-108 | Pages légales (mentions, confidentialité, cookies) servies comme contenus, marquées « à compléter par le cabinet » tant que non validées | Must | statut `draft` par défaut → non servies ou servies avec bannière selon paramètre (H-007 : servies avec bandeau) | SC-112 |
| EF-109 | Consentement cookies : préférence horodatée enregistrée côté serveur | Should | aligné avec le bandeau du frontend ; aucune mesure d'audience avant consentement | SC-120 |

## B · Recherche

| ID | Exigence | MoSCoW | Critère d'acceptation | Scénarios |
|---|---|---|---|---|
| EF-201 | Recherche plein texte sur pages + arborescence + publications, **indexée par langue** | Must | requête « paye » en FR et « payroll » en EN renvoient le domaine « Traitement de la Paye » ; index `french`/`english` PG | SC-201 |
| EF-202 | Résilience aux caractères spéciaux/accents (docx : « Procédés »…) | Must | « états financiers » trouve « les états financiers » avec accents triés | SC-202 |
| EF-203 | Requête sans résultat → message traduit + suggestions | Should | 200 avec `results: []` + message i18n, jamais d'erreur 500 | SC-203 |
| EF-204 | Synonymes/métadonnées de recherche configurables | Could | table `search_synonyms` éditable | SC-204 |

## C · Contact / leads

| ID | Exigence | MoSCoW | Critère d'acceptation | Scénarios |
|---|---|---|---|---|
| EF-301 | Soumission du formulaire public (nom, e-mail, téléphone optionnel, sujet, message, langue du lead) | Must | 202 côté API ; enregistrement personnalisé avec statut initial `new` ; temps de traitement < 1 s | SC-301 |
| EF-302 | Validation serveur stricte (schémas, longueur, assainissement anti-XSS) + erreurs **traduites** | Must | payload invalide → 422 avec messages localisés pour `lang` demandé | SC-302 |
| EF-303 | Anti-abus : honeypot, rate limiting par IP, délai minimal de rédaction | Must | > N soumissions en M minutes → 429 avec `Retry-After` ; bots (honeypot rempli) → rejet silencieux | SC-303 |
| EF-304 | Affectation, statuts, notes internes sur les leads | Must | transitions correctes (`new` → `in_progress` → `done`…) tracées dans l'audit | SC-310 |
| EF-305 | Export CSV des leads (droit requis) | Should | l'export contient un export d'audit ; colonnes conformes au dictionnaire | SC-311 |
| EF-306 | Notification e-mail au cabinet (en file d'attente (outbox) et réglable) avec reprise | Should | e-mail en échec → tentatives exponentielles (outbox), statut du lead conservé `new` même si e-mail échoue | SC-312 |
| EF-307 | Anonymisation d'un lead après durée de rétention | Must | au terme (par défaut 24 mois, réglé en paramètre) : champs pros anonymisés, audit conservé | SC-313 |

## D · Espace client (v2 — périmètre Q-005)

| ID | Exigence | MoSCoW | Critère d'acceptation | Scénarios |
|---|---|---|---|---|
| EF-401 | Invitation-only (aucune inscription libre) ; activation par lien unique signé | Must (v2) | un compte non invité ne peut pas se créer (aucune route d'inscription publique) | SC-401 |
| EF-402 | Connexion + MFA optionnelle (à paramétrer par compte) ; verrouillage après N échecs ; mot de passe oublié | Must (v2) | MFA activable par compte ; verrouillage effectif après N échecs et tracé dans l'audit | SC-402/403 |
| EF-403 | Documents clients : dépôt, téléchargement, contrôle d'accès strict (par client et par compte) | Must (v2) | IDOR impossible : chaque téléchargement vérifie la propriété (SC-404) | SC-404 |
| EF-404 | (Variante B, Q-005) messagerie + suivi de missions avec statuts | Could (v2.2) | fils de discussion ouverts sur un même compte, statuts de mission corrects | SC-405 |
| EF-405 | Export / suppression de données personnelles (droits CDP/RGPD) | Must (v2) | demande → archive au format lisible par machine (JSON/ZIP), réponse < 30 jours, journalisée | SC-406 |

## E · Back-office

| ID | Exigence | MoSCoW | Critère d'acceptation | Scénarios |
|---|---|---|---|---|
| EF-501 | Authentification back-office (identifiant + mot de passe fort, MFA optionnel) | Must | MFA requiert un code OTP correct ; verrouillage après 5 échecs ; message identique pour compte inconnu ou mot de passe faux (anti-énumération) | SC-501 |
| EF-502 | RBAC : modules × actions (créer/lire/modifier/publier/supprimer/exporter) × **langue** (droits de traduction par siège) | Must | matrice de permissions appliquée en DB + test d'élévation échouant | SC-510 |
| EF-503 | Workflow éditorial : `draft` → `in_review` → `approved` → `scheduled` → `published` → `unpublished` → `archived`, avec transitions autorisées par rôle | Must | transitions illégales rejetées en 403/409 | SC-520 |
| EF-504 | Prévisualisation d'un contenu non publié, par langue, avec lien signé expirable | Should | le lien signé expire ; un draft est visible uniquement par lui | SC-521 |
| EF-505 | Versions et restauration ; verrou optimiste (mise à jour concurrente → 409 précisé) | Must | conflit détecté et résolu via copie/écrasement choisi | SC-522 |
| EF-506 | Publication planifiée (date/heure par langue ou groupée) ; dépublication | Must | la publication programmée se déclenche à ±1 min ; l'invalidation du cache et la régénération du sitemap sont déclenchées | SC-523 |
| EF-507 | Éditeur de contenu riche sécurisé (blocs/Markdown, assaini), SEO par page (titre, description, slug, image OG) | Must | injection bloquée (sortie assainie) ; champs SEO validés (taille des limites) | SC-524 |
| EF-508 | Gestion de l'arborescence : ajout, déplacement, fusion, suppression avec contenu enfant (refus ou cascade explicitée), réordre | Must | les déplacements topologiques conservent les slugs visés, pas de page 404 publique non voulus (redirections automatiques) | SC-530 |
| EF-509 | Médiathèque : upload, remplacement, suppression d'un média **utilisé** (refus ou traçage des références) | Must | le remplacement conserve l'URL (nouvelle version), la suppression d'un média référencé est refusée | SC-540 |
| EF-510 | Paramètres du site (coordonnées, réseaux, SEO global, rétention, langues actives) | Must | validation par schéma, journal d'audit, cache invalidé | SC-550 |
| EF-511 | Redirections gérées (301/302) : auto à changement de slug + table manuelle | Should | le sitemap est régénéré ; l'ancien URL répond en 301 | SC-551 |
| EF-512 | Tableau de bord : statistiques de consultation, complétude i18n, leads récents | Should | chaque widget se charge en < 5 s, données agrégées au plus 1 h | SC-560 |
| EF-513 | Utilisateurs : invitation, activation, désactivation ; journal | Must | désactivation immédiate (session révoquée) | SC-570 |
| EF-514 | Indicateur de complétude de traduction + filtre « à traduire » | Should | filtre par langue cible = exactement les entités dont la traduction manque (compteur affiché) | SC-571 |

## F · Multi-langue (voir page 07)

| ID | Exigence | MoSCoW | Critère d'acceptation | Scénarios |
|---|---|---|---|---|
| EF-601 | Toute entité éditoriale est traduisible ; statut par entité × langue (`missing/draft/in_review/published/stale`) | Must | statut `stale` positionné automatiquement quand la source FR modifiée mais la traduction ne suit pas (test automatisé) | SC-601 |
| EF-602 | Ajout d'une langue **sans migration de schéma** | Must | test : INSERT dans `languages` → l'entité apparaît dans la liste « à traduire » du back-office sans aucune migration | SC-602 |
| EF-603 | Fallback FR → toute langue configurée, flag explicite `is_fallback` dans l'API | Must | la réponse frontal interrogée en EN sans traduction porte `is_fallback: true` | SC-603 |
| EF-604 | Slugs par langue + historique des slugs → redirections auto | Must | ancien slug renvoie 301, jamais de 404 publique après un changement de slug | SC-604 |
| EF-605 | Langue RTL (arabe/…) : champ `direction` et support back-office | Could | interface déroulée correctement RTL | SC-605 |

## G · SEO / sitemap / hreflang

| ID | Exigence | MoSCoW | Critère d'acceptation | Scénarios |
|---|---|---|---|---|
| EF-701 | Sitemap FR/EN généré depuis la base, avec au départ une parité exacte avec le sitemap statique actuel du frontend (29 URLs après fusion Contact) | Must | URL supprimée → retirée du sitemap ; xhtml:link fr/en croisés | SC-701 |
| EF-702 | hreflang + x-default + canonical servies par le frontend (données API `alternate_fr`/`alternate_en`), cohérents avec `PAGE_SLUGS` | Must | les paths alternés générés correspondent au dict slugs | SC-702 |
| EF-703 | Métadonnées SEO par contenu (title/description/OG image) FR+EN, avec défauts raisonnables | Must | longueurs validées (title ≤ 60 caractères, description ≤ 160) ; OG image = logo du cabinet par défaut | SC-703 |
| EF-704 | Redirects 301/302 gérés côté backend (rapport à table `redirects`) | Should | le statut HTTP de la redirection est cohérent (301 pour les contenus publiés, 302 pour les temporaires) | SC-704 |

## H · Médiathèque

| ID | Exigence | MoSCoW | Critère d'acceptation | Scénarios |
|---|---|---|---|---|
| EF-801 | Upload sécurisé (types limités : PNG/JPEG/WEBP/PDF, taille max paramétrable), validation du contenu (magic bytes) | Must | fichier déguisé rejeté ; erreur 415 | SC-801 |
| EF-802 | Métadonnées i18n (alt, légende) par langue | Must | alt EN caché si non traduit → repli FR + `is_fallback` | SC-802 |
| EF-803 | Variations d'images (thumbnails) générées automatiquement | Should | WebP généré à l'upload, servi selon `Accept` | SC-803 |

## I · Audit, observabilité

| ID | Exigence | MoSCoW | Critère d'acceptation | Scénarios |
|---|---|---|---|---|
| EF-901 | Journal d'audit complet et immuable (qui, quoi, où/entité, quand, avant/après) | Must | la suppression impossible par cl FK ; pagination et filtres | SC-901 |
| EF-902 | Santé système : `/health`, métriques, logs | Must | `/health` OK en DB + cache | SC-902 |
| EF-903 | Alertes e-mail aux admins en cas de dépassement de disque/échec backups | Should | alerte > seuil configuré | SC-903 |

## J · Conformité (CDP / RGPD — À VALIDER JURIDIQUEMENT)

| ID | Exigence | MoSCoW | Critère d'acceptation | Scénarios |
|---|---|---|---|---|
| EF-1001 | Registre des traitements (leads, clients, consentements, audit) en paramètre documenté | Must | doc 09 mis à jour + pages repository datées | SC-1001 |
| EF-1002 | Consentements horodatés et référencés (cookies, traitements) | Must | consentement révocable l'état persiste | SC-1002 |
| EF-1003 | Droits CDP/RGPD : accès, rectification, effacement, portabilité → workflows back-office | Must | chaque droit déclenché, engagé et clos sous SLA (30 jours) | SC-1003 |
| EF-1004 | Politique de rétention et purge automatique des données personnelles (leads anonymisés après 3 ans, sessions et logs après 1 an, cookies 13 mois) | Must | job de purge périodique vérifié, conservation conforme CDP / loi n° 2008-12 | SC-1004 |

## Non fonctionnelles (ENF-)

| ID | Catégorie | Exigence | MoSCoW | Mesure / critère |
|---|---|---|---|---|
| ENF-101 | Performance | Réponse API publique : p95 ≤ 300 ms, p99 ≤ 800 ms (hors cache froid) | Must | script de charge (JS) 50 VU 10 min |
| ENF-102 | Performance | Fiche domaine (20+ prestations) servi sous 500 ms par cold-cache | Should | Lighthouse/CI perf test |
| ENF-201 | Disponibilité | Uptime ≥ 99 % (≈ 7 h indisponibilité/an max), redémarrage auto, health-check Docker | Should | monitoring + /health |
| ENF-202 | Dégradation | Mode dégradé : contenu en cache si DB indisponible (read-only) | Could | SC-502 |
| ENF-301 | Sécurité | Authentification : mots de passe Argon2id, sessions httpOnly, anti-brute force, MFA optionnel | Must | page 09 + tests |
| ENF-302 | Sécurité | OWASP ASVS niveau 2 (application) : inventaire couvert en matrice | Must | matrice page 09 |
| ENF-401 | Accessibilité | Back-office WCAG 2.1 AA : contrats corr 4.5:1, focus visibles, navigation clavier, labels | Must | audits axe/Lighthouse à chaque release |
| ENF-501 | Maintenabilité | Backend Python 3.12+ typé (mypy strict), lint ruff, couverture tests ≥ 80 % cibles métier | Must | CI — checkpoints |
| ENF-502 | Maintenabilité | Types frontend générés depuis OpenAPI (client typé) | Should | codegen openapi-typescript |
| ENF-601 | Observabilité | Logs JSON structurés + ID de corrélation, métriques Prometheus, alertes critiques | Should | dashboard |
| ENF-701 | Sauvegarde | Sauvegarde quotidienne DB chiffrée à jour J-1 (hors serveur), essais de restauration mensuels | Must | SC-501/502 |
| ENF-702 | Rétention | Rétention leads paramétrable (défaut 24 mois), anonymisation audit | Must | SC-313 |
| ENF-801 | Internationalisation | API + back-office FR complet d'abord, EN ensuite, toute nouvelle langue possible par config | Must | tests i18n intégration |
| ENF-802 | Localisation | Dates/heures en **horaire affiché en **Africa/Dakar** (stockage UTC), formats selon locale | Must | revue |
