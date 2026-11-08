# Reprise Backend — état au 2026-11-06 (pause pour mission Frontend)

> Fichier de reprise : relire ceci avant de rouvrir `Backend/`. **Ne plus rien
> modifier dans `Backend/` ni `Analyse/` tant que la note de reprise n'est pas
> relevée.** Dernier commit : `95ad459` sur `backend/main`.

## 1. Ce qui est fait (Sprint 1, étapes 1-2 validées)

| Étape | Commit | Contenu |
|---|---|---|
| Seed | `7ed0ee8` | seed idempotent doc 06 §6.2 — parité 2/10/20/94 + exports figés + 29 tests |
| Docs seed | `c6e0ea2` | corrections d'écarts (comptes, `banner_text`, adresse, matrice, libellés) |
| Permissions | `55710ff` | `PERMISSIONS_MATRIX` / `ROLE_PERMISSIONS` / `DEMO_USERS` — 95 permissions, 195 liens, fondateur auteur, 5 comptes démo |
| Auth | `e25aeff` | argon2id, HMAC tokens, TOTP, verrouillage (5 échecs → 5 min ×2, cap 1 h), CSRF double jeton, 7 routes `/admin/auth/*`, CLI `invite`, fixtures + tests (53) |
| Validation étape 2 | `c05ae92` | état `mfa_enrollment_required` (secret/QR `segno`/codes de secours dérivés HMAC), CLI `invite --demo` (refusé en production, exit 2), tests E2E MailHog (envoi → lien signé → activation → réutilisation 410 → expiration 410) |
| Note contrat | `95ad459` | §6 login 3 états (discriminateur `status`, objet `mfa_enrollment`), §7 points tracés hors PR |

Chaîne verte au dernier commit : `ruff format` / `ruff check` / `mypy app` /
`pytest` — **58 tests OK**. MailHog en dev : `docker compose up -d mailhog`
(IHM `localhost:8025`), le corps des mails est quoted-printable (décoder avant
d'extraire un jeton).

## 2. Ce qui reste (ordre du Sprint 1)

1. **Endpoints publics en lecture** — avec **Schemathesis dès les premiers
   endpoints** (contrat `Analyse/modelisation/docs/openapi.yaml`, routes ⊆
   paths du contrat, préfixe `/api/v1` retiré).
2. **`POST /contact`** — `Idempotency-Key`, paramètre `lang`, honeypot,
   `elapsed_ms`, réponse **202**.
3. **CI** — lint, mypy, tests, Schemathesis (commits séparés, tests verts
   avant chaque commit).
4. **Rate-limit `password-forgot`** — **bloquant avant mise en ligne** (tracé
   §7 de `Analyse/modelisation/notes/reponse-revue-contrat-openapi.md`) :
   implémenter + `429` dans le contrat.

Chacun en **commit séparé** sur `backend/main`, PR vers `main` uniquement.

## 3. Bloqués en attente de validation

- **Migration 0002** (colonnes média + `publications.is_demo`) **et code
  média** : en attente de la validation du propriétaire sur la note
  `a06cad0` (`Analyse/modelisation/notes/conception-medias-images-videos.md`).
  Tant que non validé : aucune migration 0002, aucun code média.
- **PR de contrat unique** : le Backoffice porte le commit unique depuis
  `f33e915` ; je relis. Ma note (`95ad459`) lui fournit le §6 login 3 états à
  intégrer.
- **Adresse du fondateur** `fondateur@exauceac.com` : confirmation séparée
  attendue de l'utilisateur **avant toute invitation**.

## 4. Questions ouvertes

1. **Matrice de permissions** (rôle × module × action × langue) : tableau
   complet présenté le 2026-11-03 — validation formelle **non reçue** (le
   reste des conditions d'étape 2 l'était). Repos : 95 permissions / 195
   liens, `viewer` = zéro permission, `admin` = `pages`/`publications`
   limités à `publish`.
2. Limitation codes de secours MFA : usage unique non marqué en base
   (migration gelée) — colonne dédiée proposée plus tard (§6 note contrat).
3. Rate-limit `password-forgot` : voir §2.4 ci-dessus (pas encore tracé comme
   décision, seulement comme dette bloquante).

## 5. Repères de reprise

- Worktree Backend : `C:\Users\RHONE\Desktop\Exauce-backend`, branche
  `backend/main` (22 commits sur `origin/main` = `688d33a` — décalage à
  expliquer avant push ; **je ne pousse pas, l'utilisateur pousse**).
- Chaîne : `.venv\Scripts\python.exe -m ruff format .` puis `ruff check .`,
  `mypy app`, `pytest` (58 tests ; sans PostgreSQL ou MailHog, les tests
  concernés sautent).
- Comptes de test : fixtures `auth_env` dans `tests/conftest.py`
  (`auth-editor`, `auth-admin`, `auth-mfa`, … @exauceac.com,
  `Password-de-test-14!`).
- Activation démo dev : `python -m app.cli.seed --with-demo` puis
  `python -m app.cli.invite --demo` (MailHog `localhost:8025`).
- Ne jamais committer sur `main` (PR uniquement) ; ne pas proposer de stash
  entre worktrees ; ne pas toucher aux fichiers non committés de l'autre
  équipe dans le worktree racine.
