# 05 · Modélisation du domaine (DDD)

> 🟡 **Statut : M2 — à faire valider.**
> Carte des contextes délimités, diagrammes de classes UML par contexte
> (≤ 15 éléments par figure, hors vue globale), diagrammes globaux
> simplifiés, séquences et activités. La correspondance classe → table →
> colonnes du dictionnaire est garantie par la table de la section 9, et
> relisible dans [06 · Données](06-donnees.md#correspondance-classes-tables).

## 1. Contextes délimités

```mermaid
flowchart LR
  subgraph CTX1["Contexte 1 · Contenu éditorial"]
    direction LR
  end
  subgraph CTX2["Contexte 2 · Multi-langue"]
  end
  subgraph CTX3["Contexte 3 · Utilisateurs & RBAC"]
  end
  subgraph CTX4["Contexte 4 · Comptes clients"]
  end
  subgraph CTX5["Contexte 5 · Leads & contact"]
  end
  subgraph CTX6["Contexte 6 · Médias"]
  end
  subgraph CTX7["Contexte 7 · Paramètres, SEO & redirections"]
  end
  subgraph CTX8["Contexte 8 · Audit & notifications"]
  end
  CTX1 -->|"traduit via"| CTX2
  CTX1 -->|"référence"| CTX6
  CTX3 -->|"contrôle l'accès"| CTX4
  CTX3 -->|"contrôle l'accès"| CTX1
  CTX5 -->|"alimente"| CTX8
```

*Figure 1 : carte des 8 contextes délimités et de leurs dépendances principales.*

| # | Contexte | Agrégat racine | Responsabilité |
|---|---|---|---|
| 1 | Contenu éditorial & arborescence | `ContentNode`, `Publication`, `Page` | Structure des services (4 niveaux), pages, publications |
| 2 | Multi-langue | `Language`, traductions par entité | Traductions, fallback, slugs par langue, redirections |
| 3 | Utilisateurs, rôles, permissions | `User` | Accès back-office, RBAC (module × action × langue), sessions |
| 4 | Comptes clients / organisations / documents | `ClientAccount` | Espace client (v2, variantes A/B de Q-005) |
| 5 | Leads & contact | `Lead` | Demandes de contact, traitement, rétention |
| 6 | Médias | `Media` | Uploads, variantes, métadonnées i18n |
| 7 | Paramètres, SEO, redirections | `SiteSetting` | Coordonnées, SEO global, redirections manuelles, langues actives |
| 8 | Audit & notifications | `AuditLog` | Journal immuable, outbox e-mails, consentements |

## 2. Diagrammes de classes par contexte

Convention : attributs `—` (privés applicatifs, gérés par le rendu), méthodes
métier ciblées seulement ; les horodatages `created_at/updated_at` sont
abstraits dans `Timestamped`. Voir la table de correspondance en section 8.

### 2.1 Contexte 1 · Contenu éditorial & arborescence des services

```mermaid
classDiagram
  direction TB
  class ContentNode {
    +id : UUID
    +parent_id : UUID?
    +node_type : NodeType
    +position : int
    +status : ContentStatus
    +deplacer(vers_parent, position)
    +fusionner(autre: ContentNode)
    +supprimer()
  }
  class Page {
    +id : UUID
    +key : str (about, legal_*)
    +status : ContentStatus
    +publier()
    +depublier()
  }
  class Publication {
    +id : UUID
    +status : ContentStatus
    +published_at : datetime?
    +publier()
    +planifier(date)
    +depublier()
    +archiver()
  }
  class NodeType {
    <<enumeration>>
    FAMILY
    DOMAIN
    GROUP
    SERVICE
  }
  class ContentStatus {
    <<enumeration>>
    DRAFT
    IN_REVIEW
    APPROVED
    SCHEDULED
    PUBLISHED
    UNPUBLISHED
    ARCHIVED
  }
  ContentNode *-- "*" ContentNode : enfants
  ContentNode --> NodeType
  Page --> ContentStatus
  Publication --> ContentStatus
```

*Figure 2 : agrégat de contenu éditorial. Un `ContentNode` ne change pas de
type en création ; hérité de `Timestamped` (horodatages). Règle : un nœud
`SERVICE` est une feuille ; les niveaux sont extensibles à plus de 4.*

### 2.2 Contexte 2 · Multi-langue / traductions

```mermaid
classDiagram
  direction TB
  class Language {
    +code : BCP47
    +label : str
    +is_default : bool
    +is_active : bool
    +direction : LTR~RTL
    +sort_order : int
  }
  class EntityTranslation {
    +entity_type : str
    +entity_id : UUID
    +lang : BCP47
    +status : TransStatus
    +slug : str?
    +fields : traduits (title, intro…)
    +marquerStale()
    +publier(lang)
  }
  class TransStatus {
    <<enumeration>>
    MISSING
    DRAFT
    IN_REVIEW
    PUBLISHED
    STALE
  }
  class SlugRedirection {
    +entity_type : str
    +entity_id : UUID
    +lang : BCP47
    +old_slug : str
    +new_slug : str
    +status_code : 301~302
  }
  Language --> "1" EntityTranslation : "* traductions"
  EntityTranslation --> TransStatus
  EntityTranslation --> "*" SlugRedirection : historique
```

*Figure 3 : la traduction est une ligne par (entité, langue). Le statut
`STALE` est posé automatiquement quand la source change. Stratégie de
stockage : ADR-001 (page 07).*

### 2.3 Contexte 3 · Utilisateurs, rôles, permissions

```mermaid
classDiagram
  direction TB
  class User {
    +id : UUID
    +email : EmailStr
    +password_hash : Argon2id
    +is_active : bool
    +mfa_secret : str?
    +verifierMotDePasse()
    +desactiver()
  }
  class Role {
    +code : str
    +libelle : str
  }
  class Permission {
    +module : str
    +action : Action
    +lang : BCP47?
  }
  class Action {
    <<enumeration>>
    VIEW_CREATE
    EDIT
    REVIEW
    PUBLISH
    DELETE
    EXPORT
  }
  class Session {
    +token_hash : str
    +expires_at : datetime
    +revequer()
  }
  User "*" --> "*" Role
  Role "*" --> "*" Permission
  Permission --> "0..1" Language : option (par langue)
  User --> "*" Session
```

*Figure 4 : RBAC à granularité (module × action × langue). Une permission
sans `lang` vaut toutes langues. Détail des matrices au M4 (page 10).*

### 2.4 Contexte 4 · Comptes clients, organisations, documents

```mermaid
classDiagram
  direction TB
  class ClientAccount {
    +id : UUID
    +org_name : str?
    +is_organization : bool
    +status : AccountStatus
    +desactiver()
  }
  class AccountStatus {
    <<enumeration>>
    INVITED
    ACTIVE
    SUSPENDED
    ARCHIVED
  }
  class ClientUser {
    +email : EmailStr
    +password_hash : Argon2id
    +preferred_lang : BCP47
    +mfa_active : bool
  }
  class ClientDocument {
    +id : UUID
    +storage_key : str
    +original_name : str
    +mime : str
    +size : int
    +depot(date)
  }
  class InvitationToken {
    +token_hash : str
    +expires_at : datetime
    +validerEtActiver()
  }
  class Mission {
    +titre : str (variante B, Q-005, v2.2)
    +statut : MissionStatus
    +avancerStatut()
  }
  class MissionStatus {
    <<enumeration>>
    REQUESTED
    IN_PROGRESS
    DELIVERED
    CLOSED
  }
  ClientAccount --> AccountStatus
  ClientAccount *-- "*" ClientUser
  ClientAccount *-- "*" ClientDocument
  ClientAccount --> "*" InvitationToken
  ClientAccount o-- "0..*" Mission : variante B
  Mission --> MissionStatus
```

*Figure 5 : l'invitation crée le compte (aucune inscription publique,
EF-401). `Message`/`Conversation` (variante B) sont omis ici pour lisibilité :
même agrégat, ajoutés en v2.2 sans affecter v2.1.*

### 2.5 Contexte 5 · Leads & contact

```mermaid
classDiagram
  direction TB
  class Lead {
    +id : UUID
    +name : str
    +email : str
    +phone : str?
    +subject : str
    +lang : BCP47
    +status : LeadStatus
    +assigned_to : UUID?
    +prendreEnCharge(user)
    +cloturer()
    +anonymiser()
  }
  class LeadStatus {
    <<enumeration>>
    NEW
    IN_PROGRESS
    WAITING
    DONE
    REJECTED
    ANONYMIZED
  }
  class LeadNote {
    +contenu : str
    +internal : bool
  }
  Lead --> LeadStatus
  Lead *-- "*" LeadNote
```

*Figure 6 : le lead est l'agrégat racine du traitement des demandes ;
anonymisation irréversible selon rétention (EF-307, ENF-702).*

### 2.6 Contexte 6 · Médias

```mermaid
classDiagram
  direction TB
  class Media {
    +id : UUID
    +kind : MediaKind
    +storage_key : str
    +mime : str
    +size : int
    +checksum : str
    +remplacer(nouveau_fichier)
    +supprimer_si_non_referencie()
  }
  class MediaKind {
    <<enumeration>>
    IMAGE
    PDF
    DOCUMENT
  }
  class MediaVariant {
    +width : int?
    +format : WEBP~JPG
    +generer()
  }
  class MediaRef {
    +reference depuis contenu (entité et champ)
  }
  Media --> MediaKind
  Media *-- "*" MediaVariant
  Media <-- "*" MediaRef : utilisé par
```

*Figure 7 : la suppression d'un média référencé est refusée (EF-509) ;
le remplacement conserve l'URL publique.*

### 2.7 Contexte 7 · Paramètres, SEO, redirections

```mermaid
classDiagram
  direction TB
  class SiteSetting {
    +group : str (contact, networks, retention…)
    +values_t : valeurs traduisibles
    +invaliderCache()
  }
  class PageSeoMeta {
    +entity_type : str
    +entity_id : UUID
    +seo_title_t : str
    +seo_description_t : str
    +og_image_id : UUID?
  }
  class Redirect {
    +old_path : str
    +target_path : str
    +status_code : 301~302
    +activer()
  }
  class SearchSynonym {
    +lang : BCP47
    +terme : str
    +synonyme : str
  }
  SiteSetting --> "*" PageSeoMeta : enrichit
  SiteSetting --> "*" SearchSynonym
  SiteSetting --> "*" Redirect
```

*Figure 8 : les paramètres incluent les coordonnées du cabinet (EF-106) ;
toute modification invalide le cache (SC-550).*

### 2.8 Contexte 8 · Audit & notifications

```mermaid
classDiagram
  direction TB
  class AuditLog {
    +actor_type : USER~SYSTEM
    +actor_id : UUID?
    +action : str
    +entity : (type, id)
    +before : JSON?
    +after : JSON?
    +ip : str
  }
  class OutboxEmail {
    +template : str
    +payload : JSON
    +lang : BCP47
    +status : emailStatus
    +retry_count : int
    +envoyer()
    +planifierRetry()
  }
  class EmailStatus {
    <<enumeration>>
    PENDING
    SENT
    FAILED
    ABANDONED
  }
  class ConsentRecord {
    +subject_key : str (iPad hashé)
    +kind : str
    +granted : bool
    +enregistrer()
  }
  class Notification {
    +canaux : in_app~email
    +marquerLu()
  }
  AuditLog : -immuable (pas de UPDATE/DELETE)
  OutboxEmail --> EmailStatus
  ConsentRecord --> "*" AuditLog : traçé
```

*Figure 9 : l'audit est append-only ; l'Outbox garantit l'envoi (retente avec
back-off — EF-306).*

### 2.9 Vue globale simplifiée

```mermaid
classDiagram
  direction LR
  class Utilisateur_rbac {
    User (back-office)
  }
  class Contenu {
    ContentNode / Page / Publication
  }
  class Traduction {
    EntityTranslation (par entité × langue)
  }
  class Media {
    Médias référencés par Contenu
  }
  class Lead {
    Leads depuis formulaire public
  }
  class CompteClient {
    ClientAccount / ClientUser / ClientDocument (v2)
  }
  class Parametres {
    SiteSetting / Redirect / SEO
  }
  class Systeme {
    AuditLog / OutboxEmail / Consents
  }
  Utilisateur_rbac --> Contenu : édite
  Contenu --> Traduction : porte
  Contenu --> Media : référence
  Lead --> Systeme : journalise
  CompteClient --> Systeme : journalise
  Parametres --> Contenu : enrichit SEO
```

*Figure 10 : vue d'ensemble des 8 agrégats et de leurs liens dominants.*

## 3. Diagrammes de séquence (scénarios clés)

### 3.1 Soumission du formulaire de contact

```mermaid
sequenceDiagram
  autonumber
  actor P as Prospect
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL
  participant OUT as Outbox
  participant SMTP as SMTP
  P->>FE: remplit et soumet le formulaire
  FE->>API: POST /api/v1/contact (lang fr)
  API->>API: validation + honeypot + rate limit
  API->>DB: INSERT lead (status=new, lang)
  API-->>FE: 202 Accepted
  API->>OUT: INSERT demande de notification
  loop reprise avec back-off si échec
    OUT->>SMTP: envoi e-mail au cabinet
    SMTP-->>OUT: OK ou échec
  end
```

*Figure 11 : l'e-mail ne bloque jamais la réponse 202 ; en cas d'échec SMTP
le lead reste `new` et les tentatives de reprise se poursuivent (EF-306, SC-301).*

### 3.2 Connexion back-office avec MFA

```mermaid
sequenceDiagram
  autonumber
  actor A as Admin
  participant API as Backend
  participant DB as PostgreSQL
  A->>API: POST /auth/login (email, mot de passe)
  API->>DB: vérifier Argon2id + is_active
  alt première étape OK et MFA active
    API-->>A: 200 mfa_required=true
    A->>API: POST /auth/mfa/verify (code TOTP)
    API->>DB: vérifier TOTP (fenêtre ±1)
  end
  API->>DB: créer session (token_hash, expires_at)
  API-->>A: cookie httpOnly + session
  Note over API,DB: 5 échecs — verrouillage temporaire — message identique pour compte inconnu ou incorrect (anti-énumération, EF-501)
```

*Figure 12 : session httpOnly, jamais de jeton dans le `localStorage` (page 09).*

### 3.3 Publication d'un contenu + invalidation cache + sitemap

```mermaid
sequenceDiagram
  autonumber
  actor R as Relecteur/Admin
  participant API as Backend
  participant DB as PostgreSQL
  participant CA as Cache
  participant SM as Générateur sitemap
  R->>API: POST /contenus/{id}/publish
  API->>DB: vérifier statut `approved` + permission `publish`
  alt statut ou permission incompatible
    API-->>R: 403 / 409 (transition illégale, EF-503)
  end
  API->>DB: statut PUBLISHED + version figée
  API->>CA: invalider les clés du contenu publié
  API->>DB: marquer sitemap `stale`
  SM->>DB: régénérer sitemap FR/EN (ajouts/retraits)
  SM-->>API: sitemap à jour
  API->>DB: journal d'audit (qui, quoi, avant/après)
  API-->>R: 200 OK
```

*Figure 13 : publication atomique (statut + version) ; le sitemap se
régénère après l'invalidation, en différé si nécessaire (SC-523).*

### 3.4 Consultation d'un contenu avec repli de langue

```mermaid
sequenceDiagram
  autonumber
  actor V as Visiteur
  participant FE as Frontend
  participant API as Backend
  participant DB as PostgreSQL
  V->>FE: /en/services/payroll
  FE->>API: GET /api/v1/services-tree?lang=en
  API->>DB: lecture des traductions EN
  alt traduction EN absente d'une sous-branche
    API->>DB: repli sur la valeur de la langue par défaut (fr)
    Note over API: flag is_fallback=true sur les champs repliés (EF-603)
  end
  API-->>FE: arborescence EN + fallback explicites
  FE-->>V: affichage EN, mention « non traduit » le cas échéant
```

*Figure 14 : le repli est systématiquement signalé au frontend — jamais de
silence (section 07, règle R-FB-1).*

### 3.5 Dépôt / téléchargement d'un document client (contrôle d'accès)

```mermaid
sequenceDiagram
  autonumber
  actor C as Chargé de relation clients
  actor CL as Client
  participant API as Backend
  participant FS as Stockage fichiers
  participant DB as PostgreSQL
  C->>API: POST /clients/{id}/documents (multipart)
  API->>DB: vérifier permission CRM + magie du fichier
  API->>FS: écriture clé de stockage
  API->>DB: INSERT client_documents (account_id)
  API->>API: INSERT outbox (notification au client)
  CL->>API: GET /client/documents/{id}/download
  API->>DB: vérifier appartenance au compte (anti-IDOR)
  alt document non autorisé
    API-->>CL: 404/403 + journal d'audit (tentative)
  end
  API->>FS: lecture stream
  API-->>CL: 200 fichier streamé
```

*Figure 15 : tout téléchargement re-vérifie l'appartenance (US-014, SC-404) ;
la notification est asynchrone via l'Outbox.*

### 3.6 Changement de slug avec redirection

```mermaid
sequenceDiagram
  autonumber
  actor E as Rédacteur (droits requis)
  participant API as Backend
  participant DB as PostgreSQL
  participant CA as Cache
  E->>API: PATCH /contenus/{id} (slug FR: ancien → nouveau)
  API->>DB: UPDATE slug + INSERT slug_redirection (old→new, 301)
  API->>DB: journal d'audit (avant/après)
  API->>CA: invalider cache du contenu + des URLs
  API-->>E: 200 OK
  Note over API,DB: une requête ultérieure GET /ancien renvoie 301 → nouveau (EF-604, SC-604)
```

*Figure 16 : redirection de type `301` créée automatiquement, jamais de 404
publique ; en cas de nouvelle modification, la redirection est transitive*

## 4. Diagrammes d'activité

### 4.1 Workflow éditorial

```mermaid
flowchart TD
  D[draft : brouillon] --> S[soumission à la relecture]
  S --> IR[in_review]
  IR -->|rejeté avec motif| D
  IR -->|validé| AP[approved]
  AP -->|planification| SC[scheduled : date/langue]
  AP -->|publication immédiate| PU[published]
  SC -->|à l'échéance| PU
  PU -->|dépublication| UP[unpublished]
  UP -->|republication| PU
  UP -->|archivage| AR[archived]
  PU -->|archivage| AR
```

*Figure 17 : les transitions autorisées dépendent du rôle ; toute transition
est journalisée (EF-503, SC-520).*

### 4.2 Traitement d'un lead

```mermaid
flowchart TD
  N[nouveau lead status=new] --> SP{spam ou bot ?}
  SP -->|oui| RE[rejet silencieux statut REJECTED]:::silent
  SP -->|non| NA[notification au cabinet via Outbox]
  NA --> AF{affectation}
  AF --> IP[in_progress]
  IP --> WA[waiting : la réponse est attendue du prospect]
  WA --> IP
  IP --> DO[done traité et clôturé]
  DO --> RT{rétention atteinte ? 24 mois par défaut}
  RT -->|non| DO
  RT -->|oui| AN[anonymisé : données personas purgées, audit conservé]
```

*Figure 18 : anonymisation irréversible (EF-307) ; les notes internes
restent éditables jusqu'à l'anonymisation.*

### 4.3 Cycle de vie d'une traduction

```mermaid
flowchart TD
  M[missing : aucune traduction] -->|rédaction| DR[draft]
  DR -->|soumission| IR2[in_review]
  IR2 -->|rejet| DR
  IR2 -->|validée| PU2[published dans cette langue]
  S[contenu source modifié] -->|déclenche| ST[stale sur les autres langues]
  ST -->|retouches de la traduction| DR
  PU2 -->|désactivation de la langue| FB[fallback explicite vers langue par défaut]
```

*Figure 19 : le statut est porté par (entité × langue) ; `stale` est
automatique à la modification de la source.*

**

## 5. Règles métier principales (par contexte)

| Contexte | Règles clés (extrait) |
|---|---|
| 1 Contenu | R14-1 : un `SERVICE` est une feuille ; R14-2 : suppression d'un nœud avec enfants = refus (ou cascade questionnaire explicite) ; R14-3 : statut `PUBLISHED` ⇒ immuable sans nouvelle version |
| 2 Multi-langue | R14-4 : la langue par défaut est toujours la source de repli ; R14-5 : slug unique par (type, langue) ; R14-6 : `stale` positionné automatiquement sur changement de source |
| 3 RBAC | R14-7 : permission = module × action × (langue option) ; R14-8 : la session révoquée est effective immédiatement |
| 4 Comptes clients | R14-9 : account n'est créé que par invitation ; R14-10 : tout accès document vérifie l'appartenance du compte |
| 5 Leads | R14-11 : transition de statut uniquement par rôle autorisé et journalisée ; R14-12 : rétention par défaut 24 mois puis anonymisation |
| 6 Médias | R14-13 : suppression refusée si référencé ; remplacement conservant l'URL |
| 7 Paramètres/SEO | R14-14 : chaque changement de paramètre invalide le cache et passe au journal |
| 8 Audit | R14-15 : append-only ; aucune mise à jour ni suppression ; lecture seule sauf rollover |

## 6. Événements du domaine (extraits)

`ContentPublished`, `ContentUnpublished`, `TranslationStale`, `LanguageActivated`,
`LeadCreated`, `LeadAssigned`, `ClientDocumentUploaded`, `ClientInvited`,
`SettingUpdated`, `RedirectCreated`, `SitemapRegenerated`, `EmailQueued`,
`EmailFailed`, `UserSessionRevoked`. Chacun est journalisé en audit et peut
ajouter à l'outbox des notifications (e-mail). Réalisés par le bus interne
(FastAPI events / handlers), pas par un broker externe (H-002).

## 7. Écarts avec `Frontend/docs/api-contract.md`

| Zone | Contrat frontend | Modélisation proposée | Décision |
|---|---|---|---|
| Ressource `services` | un seul endpoint d'arbre `GET /api/services` | `GET /api/v1/services-tree` + détail par domaine, versionné `/v1/` | évolution assumée, documentée en page 08 |
| Réponses | champs `title: {fr, en}` dans le payload | payload mono-langue + `is_fallback`, back-office reçoit toutes langues | évolution, page 13 |
| Coordonnées du cabinet | `ORGANIZATION` défini en dur dans le frontend | servis par l'API depuis `site_settings` (EF-106) | évolution |

Aucune rupture bloquante : contrats réconciliés au moment de la bascule
(page 13).

## 8. Correspondance classes → tables

### Table correspondance classes → tables

| Classe (contexte) | Table principale | Tables liées (voir dictionnaire 06) |
|---|---|---|
| ContentNode (1) | `content_nodes` | `entity_translations`, `content_versions` |
| Page (1) | `pages` | `entity_translations`, `content_versions` |
| Publication (1) | `publications` | `categories`, `entity_translations` |
| Language / EntityTranslation / SlugRedirection (2) | `languages` | `entity_translations`, `slug_redirections` |
| User / Role / Permission / Session (3) | `users` | `roles`, `permissions`, `role_permissions`, `user_roles`, `sessions` |
| ClientAccount / ClientUser / ClientDocument / Mission (4) | `client_accounts` | `client_users`, `client_documents`, `client_invitations`, `missions` (v2.2) |
| Lead / LeadNote (5) | `leads` | `lead_notes` |
| Media / MediaVariant (6) | `medias` | `media_variants`, `media_refs` |
| SiteSetting / PageSeoMeta / Redirect (7) | `site_settings` | `redirects`, `search_synonyms` |
| AuditLog / OutboxEmail / ConsentRecord / Notification (8) | `audit_log` | `outbox_emails`, `notifications`, `consents` |

Chaque classe correspond 1-1 à sa table ; les attributs du diagramme
renvoient aux colonnes du [dictionnaire 06](06-donnees.md).

## 9. Limites connues de la modélisation

- Les énumérations sont écrites en anglais dans le code (états
  `DRAFT/PUBLISHED…`), leurs libellés UI sont traduits (page 07).
- Le contenu « riche » est modélisé à ce stade comme Markdown
  (décision ADR-005, page 14) ; l'alternative « blocs » reste ouverte à
  validation.

> **Précision (corrections M4)** : l'arborescence des services (familles,
> domaines, groupes, prestations) repose sur des **données structurées**
> (champs, ordre, parents) — le Markdown assaini ne concerne que les corps
> rédactionnels (publications, pages). Voir page 06, « Contenu structuré
> vs Markdown » et le test de parité (page 13).
