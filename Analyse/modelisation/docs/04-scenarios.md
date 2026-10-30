# 04 · Catalogue de scénarios

> 🟡 **Statut : M4 — à faire valider.**
> Chaque scénario identifie : `SC-xxx`, acteur(s), préconditions,
> déclencheur, flux nominal/alternatif/exception, postconditions,
> exigences/cas d'usage/endpoints liés, critères de test. Le format table
> standardise ; les blocs « exception » listent tous les flux alternatifs.

## 1. Visiteur et prospect (public)

| ID | Nom | Préconditions | Flux nominal | Alternatifs / exceptions | Liens | Test |
|---|---|---|---|---|---|---|
| SC-101 | Navigation de l'arborescence | langue fr active, seed parité | GET tree → menu complet 2/10/20/94 → navigation | repli si une branche EN absente (iso-fallback affiché) | EF-101, UC-001 ; `/services-tree` | test de parité + E2E |
| SC-102 | Détail d'un domaine | domaine publié | fiche avec intro/groupes/services, prev/next corrects | 404 si draft ; 301 si ancien slug | EF-102, UC-002 | API test |
| SC-103 | Consultation des interventions | — | 2 types affichés dans la langue | — | EF-103, UC-003 | API test |
| SC-104 | Secteurs | `approved=true` requis | 3 secteurs, 9 sous-cat et descriptifs | sous-cat non approuvée → titre seul, descriptif absent | EF-104 | contrainte BD |
| SC-105 | Liste publications | ≥ 1 publiée | liste triée par date, filtres, pagination curseur | catégorie vide → liste vide + message i18n | EF-105, UC-005 | API test |
| SC-106 | Lecture publication | statut publié (par langue) | lecture complète, OG partagés | draft → 404 **par langue** ; `is_fallback` | EF-105, EF-601 | API test |
| SC-107 | Slug de publication dans la « mauvaise » langue | ancien slug en table des redirections | 301 vers le slug canonique courant | boucle impossible (transitivité aplatie) | EF-604, US-003 | API test |
| SC-110 | Coordonnées affichées | settings seeded | frontend lit `/settings/public` | changement + invalidation ≤ 60 s | EF-106, US-008 | E2E cache |
| SC-111 | Page « À propos » | rédigée, publiée | blocs affichés FR/EN | `stale` → bandeau discret | EF-107 | revue |
| SC-112 | Page légale non validée (H-007) | `banners_pending=true` | page servie **avec bandeau** « à compléter par le cabinet » | jusqu'aux RB-001 : sert quand même le bandeau (jamais libre) | EF-108, RB-1 | test de bandeau |
| SC-120 | Consentement cookies | bandeau du frontend | préférence horodatée envoyée et stockée (`consents`) | refus = aucune mesure d'audience | EF-109, EF-1002 | API test |
| SC-130 | Changement de langue sur page sans équivalent | page inexistante en EN | la réponse expose `fallback: {lang, href}` (H-009) => le lien amène au parent de rubrique | jamais de 404 directe sur ce bouton | EF-603, H-009 | E2E |
| SC-140 | SSL/robots/sitemap dynamique | sitemap généré | `sitemap.xml` 30 URLs × hreflang, robots.txt correct généré | contenu retiré → absent du sitemap | EF-701, système | test sitemap |

### SC-150 Recherche

| ID | Nom | Préconditions | Flux nominal | Alternatifs / exceptions | Liens | Test |
|---|---|---|---|---|---|---|
| SC-201 | Recherche par mot-clé | index peuplé | résultats FR (« paye ») et EN (« payroll ») distincts, `is_fallback` visible | — | EF-201 | fixture FTS |
| SC-202 | Accents et caractères spéciaux | — | « états financiers » trouve la version accentuée (unaccent) | pas d'erreur 500 sur les caractères spéciaux | EF-202 | fixture |
| SC-203 | Aucun résultat | — | `200` + suggestions de reformulation i18n | jamais 500, jamais « vide » brutalement | EF-203 | API |
| SC-204 | Synonymes (option) | `search_synonyms` peuplée | « expert » → « audit », résultats croisés | — | EF-204 | API |

### SC-300 Soumission du formulaire de contact

| ID | Nom | Préconditions | Flux nominal | Alternatifs / exceptions | Liens | Test |
|---|---|---|---|---|---|---|
| SC-301 | Contact nominal | formulaire validé | 202 + e-mail au cabinet via outbox ; lead `new` + `lang` | Idempotency-Key rejouée sans doubler (X-Idempotent-Replayed) | EF-301, UC-008 | E2E |
| SC-302 | Validation invalide | — | 422 problem+json, messages traduits par langue | messages clairs champ à champ | EF-302 | API |
| SC-303 | Spam / bot | honeypot rempli ou délai < 3 s | réponse de complaisance sans création : rien n'est enregistré, l'événement est journalisé côté serveur | — | EF-303 | security test |
| SC-304 | Rate limit | > 5 posts / 10 min / IP | 429 + Retry-After | (ne débloque pas par énumération) | EF-303 | API |
| SC-305 | E-mail de notification en échec | SMTP down | lead conservé `new`, outbox retente en backoff ; alerte après N échecs (EF-903) | risque zéro : jamais de perte du lead | EF-306 | test outbox |
| SC-306 | Double soumission | double clic | l'`Idempotency-Key` rejoue la 1re réponse sans créer de doublon (`X-Idempotent-Replayed: true`) | — | EF-301 | API |

### SC-400 Espace client (v2)

| ID | Nom | Préconditions | Flux nominal | Alternatifs / exceptions | Liens | Test |
|---|---|---|---|---|---|---|
| SC-401 | Invitation + activation | invitation signée valide | compte actif, mot de passe + MFA optionnel, e-mail de bienvenue | token expiré/consumed → 410 non-exprimable (anti-enum) ; **pas d'inscription libre** | EF-401, UC-020 | E2E |
| SC-402 | Connexion (MFA) | compte actif | login → MFA (si activé) → session cookie httpOnly | 5 échecs → lockout expo ; message anti-enum | EF-402, UC-021 | security |
| SC-403 | Mot de passe oublié / réinitialisation | e-mail existant | lien signé 1 h, usage unique, sessions révoqués | si e-mail inconnu : même écran (anti-enum) | EF-402, UC-022 | API |
| SC-404 | IDOR sur documents | client A connecté | A tente le doc de B ⇒ 404/403 + tentative audité | — | EF-403, US-014 | security suite |
| SC-405 | (Variante B) mission / messagerie | module v2.2 activé | conversations et missions avec statuts demandé→livré→clôturé | — | EF-404 | API |
| SC-406 | Export / suppression de données | demande client | archive machine-lisible ; SLA 30 j ; audité | — | EF-405, UC-026 | API |
| SC-407 | Compte expiré / session perdue | idle > 30 min | 401 + re-login | jamais de reconnexion silencieuse | EF-401 | E2E |
| SC-408 | Désactivation du compte | demande ou sinistralité | sessions révoquées immédiatement, docs en quarantaine | — | EF-405 | API |

### SC-500 Système / exploitation

| ID | Nom | Préconditions | Flux nominal | Alternatifs / exceptions | Liens | Test |
|---|---|---|---|---|---|---|
| SC-501 | Force brute back-office | échecs répétés | lockout expo incl. MFA | — | EF-501 | security |
| SC-502 | Mode dégradé (DB indisponible) | base indisponible | le contenu est servi depuis le cache en lecture seule ; les écritures sont rejetées avec un message clair | bandeau d'état côté public | ENF-202 | chaos test |
| SC-510 | Élévation de privilèges | user éditor | toute tentative d'avancement sur un autre module ⇒ 403 + audit | | EF-502 | matrix tests |
| SC-511 | Sauvegarde quotidienne | cron 2 h | dump chiffré hors serveur ; test mensuel de restauration | échec → alerte admin (EF-903) | ENF-701 | drill mensuel |
| SC-512 | Expiration des jetons sessions | TTL atteint | purge ; révocation immédiate = effective | | page 09 | API |
| SC-520 | Workflow éditorial nominal | équipe | draft → in_review → approved → published (transitions autorisées) | illégal = 409 INVALID_TRANSITION | EF-503 | API |
| SC-521 | Prévisualisation draft | lien signé | affichage puis expire ; liée à la langue | draft n'est jamais indexé ni vu publiquement | EF-504 | E2E |
| SC-522 | Édition concurrente | 2 éditeurs même contenu | 2e save ⇒ 409 + proposition de fusion/copie | | EF-505 | UI |
| SC-523 | Publication planifiée | scheduled à T | déclenché à ± 1 min ; cache invalidé + sitemap régénéré | | EF-506 | intégration |
| SC-524 | XSS dans contenu riche | contenu malveillant | assuré propre : render aseptisé | | EF-507 | security suite |
| SC-530 | Changement de slug publié | admin/rédacteur | 301 auto (fig. 16 p05), sitemap à jour | | EF-604, US-005 | API |
| SC-531 | Déplacement d'un nœud | arbre à jour | réordonnancement, anti-cycles, URL stable si le slug est inchangé | pas de 404 publique | EF-508 | intégration |
| SC-532 | Fusion de deux nœuds | | fusion : les traductions des deux nœuds sont fusionnées sur le nœud survivant et les slugs des deux sont redirigés | suppression explicable | EF-508 | intégration |
| SC-540 | Médiathèque : upload sécurisé | AV ok | miniatures WebP générées (images) ; DOCX/PDF acceptés | fichier déguisé → 415 | EF-801/803 | API |
| SC-541 | Remplacement d'un média | média référencé | URL stable, versions conservées | | EF-802 | intégration |
| SC-542 | Suppression d'un média utilisé | média en usage | **refus (+ liste des référents)** | | EF-509 / SC-802 | API |
| SC-550 | Modification d'un paramètre | admin | cache invalidé, audit, e-mail aux abonnés du cabinet (si configuré) | | EF-510, US-008 | E2E |
| SC-551 | Redirection manuelle | admin | 301/302 configurable, test en preview | boucle impossible | EF-511 | API |
| SC-560 | Statistiques dashboards | — | widgets < 5 s, complétude < 5 s | sans traçage de personnes (simplement agrégats) | EF-512 | stress |
| SC-570 | Utilisateurs : désactivation | admin | sessions révoquées immédiatement, journal conservé | pas de suppression dure (audit keep) | EF-513 | API |
| SC-571 | Filtre « à traduire » | rédacteur | filtre = traductions `missing/stale` dans la langue cible ; compteur correct | | EF-514 | UI |
| SC-580 | Import initial (seed) | content.data.ts | parité 2/10/20/94 + slugs FR/EN + 3 secteurs/9 sous-cats + 3 pubs | test CI doit être vert **avant launch** | US-011, page 13 | CI parité |

### SC-600 Multi-langue (détails complémentaires)

| ID | Nom | Préconditions | Flux nominal | Alternatifs / exceptions | Liens | Test |
|---|---|---|---|---|---|---|
| SC-601 | Statut `stale` automatique | source FR modifiée | EN passe `stale` + notification | | EF-601 | API |
| SC-602 | Ajout d'une langue | super_admin | INSERT `languages` ; arbres/actions « à traduire » disponibles sans migration | doit être testé en CI avec une 3e langue | EF-602 | test |
| SC-603 | Repli avec traction | champ manquant | réponse FR + `is_fallback` (champ au champ) | pas de silence; pas de 404 sans compensation | EF-603 | API |
| SC-604 | Changement de slug | rédacteur | 301 créée, sitemap régénéré | slug en conflit → proposition dédoublonnée | EF-604 | API |
| SC-605 | Langue RTL | arabe activé | `direction=rtl` appliqué (frontend + back-office) | test snapshot | EF-605 | UI test |

### SC-700 SEO & cache

| ID | Nom | Préconditions | Flux nominal | Alternatifs / exceptions | Liens | Test |
|---|---|---|---|---|---|---|
| SC-701 | Sitemap FR/EN sync | publications/pages changées | xhtml:link croisés, parité des URLs au jour de la bascule | contenu dépublié → retirée au prochain generate | EF-701 | test sitemap |
| SC-702 | hreflang / x-default | alternates API | cohérent avec PAGE_SLUGS | x-default = fr | EF-702 | unit |
| SC-703 | SEO par contenu | metadata rédigée | limites 60/160 validées | OG défaut logo | EF-703 | unit |
| SC-704 | Codes de redirection | redirect table | statut HTTP cohérent (301 publié, 302 temporaire) | | EF-704 | API |

### SC-800 Sécurité et abus

| ID | Nom | Préconditions | Flux nominal | Alternatifs / exceptions | Liens | Test |
|---|---|---|---|---|---|---|
| SC-801 | Upload malveillant | polyglot déguisé en .png | magic bytes + ClamAV ⇒ 415 | | EF-801 | security |
| SC-802 | Suppression d'un média référencé | usage en base | refus accompagné de la liste des contenus qui l'utilisent | | EF-509 | API |
| SC-803 | Génération automatique des miniatures WebP | upload d'une image PNG/JPEG | variantes WebP créées automatiquement dans media_variants | conversion échouée ⇒ log + retry | EF-803 | API test |
| SC-810 | Téléchargement document client | URL signée < 5 min | stream contrôlé + re-vérification d'appartenance + audit | | EF-403 | security |
| SC-820 | E-mail outbox en échec récurrent | SMTP down prolongé | `abandoned` + alerte admin | | EF-306/903 | integration |
| SC-901 | Journalisation immuable des actions d'administration | action d'écriture par un utilisateur | entrée append-only insérée dans audit_log avec acteur, action, avant/après | suppression/altération interdite | EF-901 | API test |
| SC-902 | Contrôle de santé système (/health) | sonde de surveillance périodique | GET /health renvoie 200 {status: "healthy", db: "ok"} en < 100 ms | dégradation DB renvoie 503 unhealthy | EF-902 | integration |
| SC-903 | Alerte administrateur sur défaillance critique | échec sauvegarde ou saturation disque | e-mail critique envoyé aux super_admins via canal de secours | | EF-903 | integration |


## 2 bis. Scénarios complémentaires (croisage exigé → SC, cf. §10)

| ID | Nom | Préconditions | Flux nominal | Alternatifs / exceptions | Liens | Test |
|---|---|---|---|---|---|---|
| SC-533 | Restauration d'une version | ≥ 2 versions (content_versions) | sélection d'une version → aperçu du diff → restauration : le contenu restauré devient la version courante, l'historique reste intact (append-only) | restauration par langue (chaque langue a son historique) | EF-505, UC-036 | API + UI |
| SC-534 | Suppression d'un nœud ayant des enfants | famille/domaine/groupe non vide | **refus explicite** indiquant le nombre d'enfants ; suppression en cascade possible après confirmation, chaque slug supprimé crée une redirection | l'utilisateur déplace d'abord les enfants | EF-508, UC-041 | intégration |
| SC-310 | Relance d'un lead | lead `new`/`contacted` sans réponse | bouton « relancer » : e-mail reparti (template versionné, outbox) + note automatique | plusieurs relances possibles ; chaque relance est audité | EF-304, UC-051 | API |
| SC-311 | Clôture d'un lead | lead gagné ou perdu | statut → `won`/`lost` + motif ; historique conservé | motif requis (sinon 422) | EF-304, UC-052 | API |
| SC-312 | Export CSV des leads | rôle crm | périmètre choisi → CSV UTF-8 ; l'export est journalisé (audit) ; MFA exigée (page 09 §2.1) | — | EF-305, UC-048 | API + audit |
| SC-313 | Anonymisation d'un lead | fin de rétention ou droit à l'effacement | identité/contacts remplacés par `ANONYMIZED`, historique de statut conservé | aussi appliqué en vrac par le job de rétention | EF-307 | API + job |
| SC-410 | Compte organisation à plusieurs utilisateurs (v2) | fonctionnalité v2 activée | les utilisateurs du même compte partagent les documents ; chacun a son mot de passe/MFA ; l'invitant invite ses collègues | la révocation d'un utilisateur n'affecte pas les autres | EF-411, US- | E2E |
| SC-503 | Purge de rétention | job quotidien | au-delà des durées (`site_settings.retention`) : leads anonymisés, sessions purgées, outbox nettoyé ; opération journalisée | échec → alerte admin (EF-903) | ENF-702 | job test |
| SC-590 | Montée de version de l'API | v2 publiée | v1 et v2 coexistent (fenêtre fixée, ex. 6 mois) ; en-tête `Deprecation` + date de sunset documentée ; communication aux clients v1 | après sunset : 410 avec problem+json | 08 §1 | test de coexistence |
| SC-805 | Scraping raisonnable | — | robots.txt explicite, rate limit global, pas de mesure agressive (le site DOIT rester visible) | volume anormal → alerte + resserrement temporaire | EF-303, ENF- | test de volume |
| SC-806 | Fuite de jeton / cookie de session | session compromise (vol, poste public) | révocation immédiate (par l'utilisateur ou l'admin) ; rotation à chaque login/MFA ; cookies HttpOnly non lisibles en JS | anomalie (changement d'IP fort) → invalidation prudente | ADR-004 | security |
| SC-606 | Langue désactivée avec contenu existant | EN désactivée alors que des traductions EN sont publiées | les URLs EN → 301 vers l'équivalent FR (L4, page 07) ; **aucune donnée supprimée** : réactivation = contenu intact ; cache/sitemap régénérés sans EN | — | EF-602, R-FB | intégration |

### SC-900 / SC-1000 Conformité (À VALIDER JURIDIQUEMENT)

| ID | Nom | Flux | Liens |
|---|---|---|---|
| SC-1001 | Registre des traitements | doc + tables consents/leads/audit fournissent les enums sources | EF-1001 |
| SC-1002 | Consentement horodaté/révocable | enregistrement `consents`, révocation au bandeau | EF-1002 |
| SC-1003 | Accès/rectification/effacement/portabilité | workflows back-office sous SLA 30 j, journalisés | EF-1003 |
| SC-1004 | Rétention et purge automatique CDP/RGPD | échéance de rétention atteinte (leads 3 ans, logs 1 an) → purge / anonymisation automatique | EF-1004 |



## 10. Couverture : scénarios exigés → SC-xxx

Contrôle croisé entre la liste de scénarios demandée au lancement de la
modélisation et le catalogue ci-dessus. **Chaque scénario exigé a un SC.**

| Scénario exigé | Couvert par |
|---|---|
| Navigation 2/10/20/94 + repli de langue | SC-101, SC-603, SC-130 |
| Détail domaine / prestation | SC-102 |
| Types d'intervention / secteurs | SC-103, SC-104 |
| Publications (liste/détail, 404 draft par langue) | SC-105, SC-106 |
| Page « À propos » / pages légales (H-007) | SC-111, SC-112 |
| Consentement cookies | SC-120 |
| Coordonnées éditables sans code | SC-110, SC-550 |
| Changement de langue sans équivalent (H-009) | SC-130 |
| Sitemap / hreflang dynamiques | SC-140, SC-701, SC-702 |
| Recherche FR/EN (accents, synonymes) | SC-201…SC-204 |
| Contact nominal / validation / spam / rate-limit | SC-301…SC-304 |
| Idempotence (double envoi) | SC-306 |
| Outbox e-mail en échec | SC-305, SC-820 |
| Invitation + activation espace client | SC-401 |
| Connexion + MFA / verrouillage | SC-402, SC-501 |
| Mot de passe oublié sécurisé | SC-403 |
| Documents clients (anti-IDOR) | SC-404, SC-810 |
| Missions / messagerie (variante B) | SC-405 |
| Export / effacement de données (CDP) | SC-406, SC-1003 |
| Désactivation de compte | SC-408, SC-570 |
| Compte organisation multi-utilisateurs | SC-410 |
| Force brute / anti-énumération | SC-501 |
| Sauvegarde + restauration testée | SC-511 |
| Expiration / révocation de sessions | SC-512 |
| Fuite de jeton | SC-806 |
| Mode dégradé (DB ou stockage indisponible) | SC-502 |
| Workflow éditorial | SC-520 |
| Prévisualisation draft par langue | SC-521 |
| Édition concurrente (409) | SC-522 |
| Publication planifiée | SC-523 |
| XSS via contenus | SC-524 |
| Changement de slug + 301 auto | SC-530, SC-604 |
| Déplacement / fusion de nœud | SC-531, SC-532 |
| Restauration d'une version | SC-533 |
| Suppression d'un nœud avec enfants | SC-534 |
| Montée de version de l'API | SC-590 |
| Upload sécurisé / média remplacé | SC-540, SC-541, SC-801 |
| Suppression d'un média utilisé | SC-542, SC-802 |
| Paramètres invalidated par le cache | SC-550 |
| Redirection manuelle | SC-551 |
| Dashboard (sans traçage de personnes) | SC-560 |
| Filtre « à traduire » | SC-571 |
| Seed de parité (2/10/20/94) | SC-580, page 13 |
| Statut `stale` / ajout de langue / RTL | SC-601, SC-602, SC-605 |
| Langue désactivée avec contenu existant | SC-606 |
| Rétention (purge automatique) | SC-503 |
| Relance / clôture d'un lead | SC-310, SC-311 |
| Export CSV des leads (MFA) | SC-312 |
| Anonymisation d'un lead | SC-313 |
| Scraping raisonnable | SC-805 |
| Conformité CDP | SC-1001…SC-1004 |
