# 01 · Cadrage

> 🟡 **Statut : M0 — à valider**

## Contexte (issu du docx)

- Société d'expertise comptable, de conseil, d'audit et de formation.
- Créée et dirigée par **M. Assane KANE**, inscrit à l'**ONECCA du Sénégal**.
- Population cible : tous types d'organisations — **public, privé et
  non-gouvernemental** — dès lors que leurs activités sont conformes aux lois
  nationales et internationales (docx).
- Le site public (Phases 1-4) est **validé** : React/Vite/TS, FR par défaut +
  EN, routes à slugs traduits (fr ↔ en), 94 prestations, 20 groupes, 10
  domaines, 2 familles, 2 types d'interventions, 3 secteurs/9 sous-catégories,
  3 publications « Exemple ».
- Coordonnées **validées, à partir du docx** : `contact@exauceac.com`,
  `+221 33 814 51 24` (fixe), `+221 77 099 31 83` (mobile), Dakar.

## Personas et acteurs

| Acteur | Persona | Objectifs | Notes |
|---|---|---|---|
| **Visiteur** | Prospect FR ou EN (+ tout internaute) | Découvrir le cabinet, naviguer l'offre à 4 niveaux, chercher, lire une publication, contacter le cabinet | Sans compte |
| **Client** (v2) | Client du cabinet (personne physique ou compte organisation) | Accéder à ses documents, échanger avec le cabinet | Périmètre à trancher : Q-005 |
| **Fondateur / Administrateur** | M. Assane KANE | Éditer l'intégralité du contenu (y compris coordonnées, SEO), traiter les leads, administrer les utilisateurs | 1ᵉʳ super-admin |
| **Éditeur / Rédacteur** (H-001) | Collaborateur | Rédiger, relire, publier selon droits | Existence à confirmer |
| **Chargé de relation clients** (H-001) | Collaborateur | Traiter les leads, gérer les clients et documents | Existence à confirmer |
| **Lecteur seul** (H-001) | Observateur | Consulter sans éditer | Existence à confirmer |

## Contraintes

| Type | Contrainte | Source/justification |
|---|---|---|
| Technique | Backend **FastAPI + PostgreSQL**, fichiers de sauvegarde compatibles Linux | Décision validée ci-dessus |
| Technique | Frontend **inchangé aujourd'hui** ; le basculement des mocks vers l'API viendra ultérieurement (page 13) | voir page 13 |
| Technique | Le contenu du site doit être modifiable **intégralement** via le back-office (coordonnées, adresses, contenus) | demande du cabinet |
| Légale | Loi sénégalaise n° 2008-12 (CDP) pour les données personnelles ; si RGPD s'applique (européens), leurs droits similaires | **À VALIDER JURIDIQUEMENT** (Q-001) |
| Budgétaire | Préférence pour des stacks simples (sans service managé payant) | H-002 |
| Éditoriale | FR est la langue source ; EN validée ; toute autre langue est future (ADR-001) : [07 · Multi-langue](07-multi-langue.md#adr-001-strategie-de-stockage-des-traductions) |

## Risques

Voir registre détaillé en [14 · Risques](14-adr-roadmap.md#registre-des-risques) :

- R-01 : contenus réels jamais fournis (portraits, adresses, mentions légales) → site en placeholders indéfiniment.
- R-02 : parenté entre docx et future base ; arborescence mutée (fusions de domaines) → stratégie `content_nodes` flexible, ADR-002.
- R-03 : i18n « FR source » en dérive → versions + langue par statut par entité.
- R-04 : spam et abuse sur le formulaire public → rate limiting, honeypot, journalisation (SC-041…).
- R-05 : fuite de jetons ou de données de session entre environnements (dev/staging/prod).

## Critères de succès

1. Le Cabinet peut modifier **téléphones, adresses, contenus** et publier sans aide technique.
2. Ajouter une nouvelle langue = 1 entrée en DB + validation, sans migration du schéma (ENF-i18n).
3. Même parité de contenu FR/EN : aucune entité non traduite dans le back-office (indicateur de complétude).
4. Aucun mot de passe stocké en clair, aucun jeton persisté côté navigateur susceptible de fuite (page 09).
5. La parité frontend/backoffice : 94 prestations, 20 groupes, 10 domaines, 3 secteurs (test de seed page 13).

## Hypothèses (extraits H-)

| ID | Hypothèse | Par défaut |
|---|---|---|
| H-001 | Un seul utilisateur au démarrage (le fondateur), **mais** le modèle de données et le back-office supportent plusieurs utilisateurs, plusieurs rôles et les permissions **par langue** dès la v1 | Modélisation complète malgré le démarrage single-user |
| H-002 | Pas de prestataire cloud payant ; déploiement sur un serveur unique Debian + Docker Compose | ADR déploiement p11 |
| H-003 | Les publications « Exemple » actuelles ne sont pas réellement publiées (statut `draft` / insertions « Exemple ») | non servies publiquement tant que non remplacées par du contenu validé |
| H-004 | Une seule adresse physique aujourd'hui (Dakar) : le modèle supporte N implantations | adresse réelle = placeholder actuel |
| H-007 | Les pages légales (mentions, confidentialité, cookies) sont servies **avec bandeau « à compléter par le cabinet »** tant que leur contenu n'est pas validé juridiquement | bandeau obligatoire jusqu'à validation (bloqueur de mise en ligne, voir ci-dessous) |
| H-005 | Aucune newsletter en v1 (question ouverte Q-004) | Non incluse |
| H-006 | L'adresse e-mail réelle du cabinet est `contact@exauceac.com` (docx) | utilisée aussi comme expéditeur des e-mails transactionnels |
| H-009 | Changement de langue sur une page sans équivalent : lien vers le **parent de rubrique** (jamais 404) ; l'API expose une cible de repli `fallback` | http:// ; page 08 (API) |
| H-010 | Une traduction ne peut pas être publiée si la **langue déclarée par défaut en base** (`languages.is_default`) n'est pas au moins `approved` | suit dynamiquement la langue par défaut (page 07, L7) |

## Bloqueurs de mise en ligne (Release blockers)

| ID | Bloqueur | Condition de levée |
|---|---|---|
| RB-001 | **Contenus légaux non validés** (mentions légales, politique de confidentialité, politique de cookies ; cf. H-007 et Q-001) | texte validé par le cabinet / un juriste ; tant que non levé : bandeau « à compléter par le cabinet » obligatoire et **aucune mise en production** |
| RB-002 | Adresse postale réelle non fournie (cf. Q-002) | adresse validée par le cabinet |
| RB-003 | Publications « Exemple » encore en base au moment de la bascule (cf. H-003/Q-003) | contenu réel ou retrait du module Publications v1 |

## Questions ouvertes

Résumé issu de la Phase 4.

Le registre complet, formulé simplement pour un non-technicien, est en
[14 · Registre des questions ouvertes](14-adr-roadmap.md#registre-des-questions-ouvertes).
Les plus bloquantes pour le MVP backend :

1. **Q-001** — Cadre juridique de protection des données à afficher/rédiger (mentions légales, politique de confidentialité) : prévu par vous ou par un juriste ?
2. **Q-002** — Adresse postale réelle du cabinet à publication (et autres implantations) ?
3. **Q-003** — Publications : s'agit-il de vrais articles à venir (combien, à quelle cadence, qui écrit ?)
4. **Q-004** — Newsletter : oui/non pour la v2 ?
5. **Q-005** — Espace client : **invitation uniquement (recommandé — pas d'inscription libre)**, et choix du périmètre, à valider avec le cabinet :
   - **Variante A — « documents seuls »** : le client télécharge des documents déposés par le cabinet (PDF/zip), notification e-mail à chaque dépôt. Impact modèle : `client_accounts` + `client_documents` uniquement. MVP minimal.
   - **Variante B — « documents + messagerie + suivi de missions »** : ajoute une messagerie (fils de discussion liés au compte) et un suivi de missions/demandes avec statuts (demandé → en traitement → livré → clôturé). Impact modèle : `conversations`/`messages`, `missions`, statuts et notifications associés ; MVP élargi (2-3 jalons de plus).
   - Recommandation par défaut : **A en v2.1, B en v2.2** — le modèle de données converge : la messagerie sera un module séparé activable sans refonte.
   - Aucune information juridique spécifique n'est rédigée (règle anti-invention).
6. **Q-010** — Antoine : moteur de recherche plein texte par triggers transactionnels (retenu) ou par outbox/worker ? Recommandation : triggers (simple, cohérent). Revoir si le volume d'écritures devient élevé.

**Q-006** — Multi-langue : quelles langues futures sont envisagées ? (le modèle est prêt pour N langues, dont RTL). Défaut : fr + en uniquement.
Autres axes H-009/H-010 : repli de navigation sur la page parente si la langue cible manque (H-009, champ API `fallback`), et garde de publication calée sur la langue par défaut déclarée en base (H-010).
