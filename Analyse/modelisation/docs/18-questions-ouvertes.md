# 18 · Synthèse des décisions validées (Prêt pour le Backend)

> 🟢 **Statut : M6 — Décisions formellement arbitrées et validées.**
> Ce document récapitule l'ensemble des arbitrages de conception et de cadrage technique
> validés avant l'implémentation du Backend et du Back-office.

---

## 1. Décisions d'architecture, de contenu et de routes (Série Q-100)

| ID | Sujet | Décision validée | Modalités d'implémentation |
|---|---|---|---|
| **Q-101** | **URL d'une prestation** | **Option S1 (Ancre stable)** | `/{lang}/services/{famille}/{domaine}#{groupe}`. Les 94 prestations sont consultées au sein de leur domaine parent. Elles n'ont **ni URL autonome, ni slug public, ni redirection 301 côté serveur** (les ancres `#` ne transitant pas sur le réseau HTTP). Seuls les 10 domaines et 2 familles ont des slugs publics. |
| **Q-102** | **Pages légales (URLs)** | **Option L1 (1 page unique à 3 sections)** | Une URL unique (`/fr/mentions-legales` et `/en/legal-notice`) regroupant mentions légales, confidentialité et cookies sous 3 sections typées `legal_document`. |
| **Q-103** | **Gestion des redirections des anciennes URLs** | **Option A1 (Redirections 301 au seed)** | 4 redirections 301 semées dans la table `redirects` : `/fr/localisations` $\rightarrow$ `/fr/contact#implantations`, `/en/locations` $\rightarrow$ `/en/contact#implantations`, et les croisements FR/EN correspondants. |
| **Q-104** | **Statut des 3 publications « Exemple » au seed** | **Option P1 (Démo dev / exclusion prod)** | Les articles sont marqués `is_demo=true`. Ils sont importés en dev/staging via `--with-demo` pour préserver la parité visuelle, et formellement exclus du seed de production (`--production`). |
| **Q-105** | **Compte auteur du fondateur** | **Option U1 (Sans mot de passe par défaut)** | Création du compte fondateur dans `users` au seed avec le rôle super-administrateur. `password_hash=NULL`, `must_reset_password=true` ; activation via invitation signée ou réinitialisation sécurisée à la première connexion. |
| **Q-106** | **Validation du formulaire Contact (`POST /contact`)** | **Option V1 (Validation stricte & alignement)** | Le frontend génère l'en-tête `Idempotency-Key` (UUIDv4), transmet `lang`, le champ invisible `honeypot` et le timer `elapsed_ms`, et valide la réponse HTTP 202 (`{ id, status: "new" }`). |
| **Q-107** | **Mode de rendu SEO** | **Option A (Prérendu au build / SSG)** | Nginx sert les 29 fichiers HTML prérendus (< 25 ms, 25 Mo RAM, 0 €). Les redirections 301 sont exécutées via une `map` Nginx générée à chaud lors de la publication. |

---

## 2. Synthèse des corrections actées dans l'analyse

1. **Redirections 301 Nginx Map** : Nginx résout les redirections 301 en mémoire via `redirects.map` sans passer par FastAPI ; `@fastapi_fallback` ne traite que les chemins 404 inconnus.
2. **Pipeline de publication atomique** : Worker asynchrone générant les 29 fichiers HTML et `sitemap.xml` dans un répertoire temporaire, bascule de lien symbolique atomique (Zero Downtime) et rollback garanti sans interruption si échec de build. Statut éditeur en direct dans le back-office via SSE.
3. **Seed idempotent séparé** : Script CLI dédié `python -m app.cli.seed` basé sur `source_key` (`ON CONFLICT DO UPDATE`), séparé des migrations DDL Alembic, avec bascule `--production` / `--with-demo`.
4. **URLs filtrées `?category=`** : Balise canonique stricte vers l'URL sans filtre et exclusion du sitemap XML.
5. **Comptage unique du sitemap** : **29 URLs exactes** immuables (9 pages statiques + 2 familles + 10 domaines + 2 interventions + 3 secteurs + 3 publications).
6. **Sessions et CORS** : Cookie `session_id` avec `Domain: .exauceac.com`, `HttpOnly: true`, `SameSite: Lax`, `Secure: true`. CORS avec `allow_credentials=True` et origines explicites sans wildcard. Test d'intégration CSRF bloquant au Sprint 1.
7. **Dette Mermaid** : Notée explicitement « non vérifiée par outil CLI automatisé (absence de Chromium en sandbox) » avec relecture manuelle confirmée.
8. **Test de contrat Schemathesis** : Intégré au plan de test Backend pour fuzzing des endpoints FastAPI via le runner ASGI in-memory.

