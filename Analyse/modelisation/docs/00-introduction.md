# 00 · Introduction

> 🟡 **Statut : M0 — à valider**

## Vision

EXAUCE Audit & Conseils SAS met en ligne un site vitrine bilingue (FR/EN).
La suite du projet ajoute :

1. un **Backend** (FastAPI + PostgreSQL, conteneurisé) : source de vérité du contenu,
   interface publique (sans compte client actuellement), espace client futur,
2. un **Back-office** : gestion intégrale du contenu du site — y compris les
   coordonnées du cabinet (téléphones, adresse), l'arborescence des services,
   les secteurs, les publications, les leads et l'i18n.

Le site **public existe déjà** (React + Vite, Phase 1-4 validées) ; il
consommera l'API conformément au contrat OpenAPI ([openapi.yaml](openapi.yaml))
et à la documentation [08 · API](08-api.md), en remplacement de ses données mockées.

## Objectifs

| # | Objectif | Critère de succès associé |
|---|---|---|
| O-1 | Tout le contenu public provient de la base | aucun contenu codé en dur côté frontend |
| O-2 | Édition FR/EN (extensible à N langues) sans migration de schéma | ajout d'une langue = 1 ligne de config |
| O-3 | Publication contrôlée (workflow, versions, planification) | journal d'audit complet |
| O-4 | Traiter les demandes de contact (leads) | statuts, affectation, relance |
| O-5 | Sécurité et conformité (dont loi sénégalaise n° 2008-12, CDP) | modélisation STRIDE validée |

## Hors-périmètre (v1)

- Comptabilité, paie, facturation, ERP.
- Déclarations fiscales ou sociales télétransmises (OHADA/UEMOA : cadre
  contextuel, pas fonctionnalité).
- Paiement en ligne.

## Parties prenantes

| Acteur | Rôle | Investissement |
|---|---|---|
| M. Assane KANE, fondateur | décisionnaire, 1ᵉʳ utilisateur du back-office | validation métier |
| Futurs collaborateurs (H-001) | relecture/rédaction éventuelle | hypothèse, à confirmer |
| Clients du cabinet | visiteurs puis utilisateurs Espace client (v2) | — |
| Développeur/architecte | exécution | — |

## Glossaire

| Terme | Définition |
|---|---|
| **Cabinet** | EXAUCE Audit & Conseils SAS (société d'expertise comptable, conseil, audit, formation ; Dakar). |
| **Accompagnement** | Famille de services : assistance, conseil, formation « pas à pas » (7 domaines). |
| **Audit externe** | Seconde famille de services : audit légal, contractuel, examen limité (3 domaines). |
| **Domaine** | Niveau 3 de l'arborescence des services (ex. « Gouvernance »). 7+3 = 10 domaines. |
| **Groupe** | Niveau 4-partie A d'un domaine (ex. « Niveau Associés »). 20 groupes au total. |
| **Prestation** | Item de niveau le plus fin (ex. « Structuration des assemblées des associés »). **94 au total**. |
| **Intervention** | Mode de réalisation : récurrent ou ponctuel (2 types du docx). |
| **Secteur** | Univers de clientèle : public, privé, non-gouvernemental (3), avec 9 sous-catégories. |
| **Sous-catégorie** | « Organisme inter-gouvernemental », « Personne morale », « ONG », etc. (descriptifs proposés, **non intégrés**, à valider). |
| **Publication** | Article du cabinet (domaine de gestion) — aujourd'hui 3 articles « Exemple ». |
| **Lead / Demande de contact** | Message envoyé via le formulaire public. |
| **Espace client** | Zone privée (UI créée ; logique d'authentification **v2/périmètre à trancher**, voir Q-005). |
| **Contenu** | Toute donnée éditoriale gérée par le back-office (pages, services, secteurs, publications, paramètres). |
| **Nœud de contenu** | Élément typé de l'arborescence (famille, domaine, groupe, prestation, page…). |
| **OHADA** | Organisation pour l'Harmonisation en Afrique du Droit des Affaires — cadre réglementaire cité dans le docx (actes uniformes). |
| **UEMOA** | Union Économique et Monétaire Ouest-Africaine — cadre contextuel. |
| **ONECCA** | Ordre National des Experts Comptables du Sénégal — le fondateur y est inscrit (docx). |
| **ONECCA (CDP)** | Voir **CDP** : Commission de protection des données personnelles (loi n° 2008-12) — homonyme à ne pas confondre. |
| **Fallback / repli** | Affichage d'une traduction par une autre langue quand elle est absente (voir [07](07-multi-langue.md)). |
| **Lead** | Objet métier issu du formulaire de contact. |

## Conventions

Conventions d'identifiants : EF-/ENF-/UC-/US-/SC-/ADR-/H-/Q-, MoSCoW,
statuts — détaillées dans le README du projet `Analyse/modelisation/README.md`
hors site, et résumées plus haut.
