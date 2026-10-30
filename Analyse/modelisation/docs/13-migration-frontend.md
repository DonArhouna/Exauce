# 13 · Migration du frontend vers la base

> 🟡 **Statut : M5 — à faire valider.**
> Migration de `Frontend/src/data/content.data.ts` (contenu codé en dur)
> vers la base PostgreSQL : correspondance champ à champ, script de seed,
> test de parité, plan de bascule du frontend (mocks → API), impact
> sitemap/SEO/recherche, plan de retour arrière.

## 1. Sources de vérité

| Aujourd'hui (frontend statique) | Après (base) |
|---|---|
| `Frontend/src/data/content.data.ts` — arbre 2 familles / 10 domaines / 20 groupes / 94 prestations avec slugs et textes FR/EN | `content_nodes` + `entity_translations` (ADR-002, ADR-001) |
| `PAGE_SLUGS` / `routes.ts` | slugs en base + vu API `services-tree`, `alternate`, `fallback` (H-009) |
| `ORGANIZATION` (coordonnées) | `site_settings` (EF-106) |
| publications statiques | table `publications` |
| recherche locale | API `GET /search` (FTS, page 07 §2) |
| sitemap statique | généré dynamiquement (EF-701) |

## 2. Correspondance champ à champ

| content.data.ts (clé) | Table / colonne | Remarques |
|---|---|---|
| `id` (str stable, ex. `famille-audit`) | `content_nodes.id` (UUID) + `source_key` conservé en colonne pour la trajectoire | la clé source est stockée pendant la migration, purge après validation |
| `type` (famille/domaine/…) | `content_nodes.node_type` | valeur énumérée identique |
| `parentId` / `children` | `content_nodes.parent_id` + `position` (ADR-002) | position déduite de l'ordre du tableau |
| `title.fr/en`, `intro.fr/en` | `entity_translations.data->>'title' / 'intro'` (lang) | JSONB, une ligne par langue |
| `slug.fr/en` | `entity_translations.slug` | unicité par (entity_type, lang, slug) |
| `body.fr/en` (pages/publications) | `entity_translations.data->>'body'` | Markdown conservé tel quel (assaini à la lecture) |
| `organizations` (coordonnées) | `site_settings` (clés élémentaires, `is_translatable` pour l'adresse) | |
| `posts` (publications statiques) | `publications` + `entity_translations` + relations `category` | statut `published`, `published_at` = date d'origine |

## 3. Script de seed (one-shot, réexécutable)

- emplacement : `backend/tools/seed_from_contentdata.py` — lit
  `content.data.ts` (parsing des sources TS via `ts-node` côté déploiement
  ou export JSON intermédiaire généré une fois),
- **idempotent** : clé de rapprochement `source_key` ; réexécution sans duplication,
- inscription **transactionnelle** : nœuds + traductions + settings +
  publications dans une transaction ; échec = tout annuler,
- crée les statuts `published` (contenus déjà publics aujourd'hui), les
  redirections éventuelles des slugs qui divergent.

## 4. Test de parité (CI, bloquant — SC-580)

```text
Assertion 1 : nb familles = 2
Assertion 2 : nb domaines = 10 (7 + 3)
Assertion 3 : nb groupes = 20
Assertion 4 : nb prestations = 94
Assertion 5 : chaque prestation a un slug fr ET un slug en
Assertion 6 : chaque parent (famille/domaine/groupe) a un slug fr ET en
Assertion 7 : chaque content_nodes(published) est atteignable par l'API
              services-tree dans chaque langue active
Assertion 8 : les publications d'exemple sont juste servées via
              l'endpoint publications (titres identiques FR/EN)
Assertion 9 : aucune page publique en 404 sur les URLs connues du
              frontend actuel (jeu de routes régénéré)
```

Le test ne passe pas ses 9 assertions → la CI échoue, aucun
déploiement possible.

## 5. Plan de bascule du frontend (mocks → API)

| Étape | Contenu | Cible |
|---|---|---|
| 1 | Backend déployé, seed chargé, parité verte | pré-production |
| 2 | Frontend : adaptateur `api/content.ts` (déjà isole : `translatePath`, `ORGANIZATION`) lit l'API derrière un drapeau `CONTENT_SOURCE=api|static` | code |
| 3 | Validation en pré-production : parité visuelle des 30 pages, links, sitemap | pré-production |
| 4 | Activation `CONTENT_SOURCE=api` en production (bascule par variable d'environnement, sans nouvelle release) | production |
| 5 | constante de secours retirée du code, dossier `data/` réduit au minimum (config de routes) | code |

**Ordre garanti** : la bascule sans code, seulement par configuration
(`env`) ; le retour inverse (§7) est un mot.

## 6. Impact sitemap / SEO / recherche

- **sitemaps** : généré depuis la base (EF-701) — le frontend cesse de
  générer son sitemap statique à la bascule ; comparer la sortie avant/après
  (les 30+ URLs du sitemap actuel en équivalence exacte par langue),
- **hreflang** : construit depuis l'API `alternate` (SC-702) ; le
  `x-default` = langue par défaut (fr),
- **SEO** : si les slugs changent (différence entre le contenu du
  frontend statique et le seed) → redirections 301 automatiques (EF-604)
  ; objectif : slugs identiques si le seed réutilise les slugs du frontend,
- **recherche** : le stockage local (recherche cliente) est remplacé par
  `GET /search` ; le seed peuplant `search_index` avant la bascule, la
  recherche reste disponible pendant toute la bascule —
  jusqu'à la référence productive.

## 7. Plan de retour arrière

1. La variable `CONTENT_SOURCE=static` remise sur le frontend masque la
   base sans une seule ligne de code (déploiement de la constante dans
   une release antérieure, visée immédiate) ;
2. si la base est en cause : restauration à partir de la sauvegarde
   chiffrée (page 11 §6, RPO ≤ 24 h) ;
3. Les données créées par la bascule (redirections, permissions) créé par la bascule sont des enregistrements applicatifs — précédés d'un audit de suppression (outil `undo-migration`).

**Durée totale de bascule estimée : < 5 minutes** (env var + healthcheck),
pendant une fenêtre de faible trafic (choix horaire à faire avec le
cabinet, SC-590 à coordonner).

## 8. Rapprochement avec `Frontend/docs/api-contract.md`

À l'application de la bascule, `Frontend/docs/api-contract.md` sera
mis à jour pour pointer sur `docs/openapi.yaml` (source unique) — le
contrat frontend actuel (`/api/services`) reste documenté comme
remplacé (écart et plan dans page 08 §8).
