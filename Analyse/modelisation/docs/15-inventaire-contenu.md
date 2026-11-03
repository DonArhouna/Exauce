# 15 · Inventaire du contenu éditable

> 🟡 **Statut : M2 — à faire valider.**
> Inventaire **exhaustif** des 184 clés i18n du frontend
> (`Frontend/src/i18n/locales/fr.json` et `en.json`, symétrie vérifiée :
> 184 = 184), avec pour chacune : son usage réel, sa classification
> (éditorial / interface / technique / clé morte) et sa **cible** dans le
> modèle de données. Le modèle est justifié en
> [16 · Modèle éditorial](16-modele-editorial.md).

## 0. Comment lire les cibles

| Notation | Signification |
|---|---|
| `pages.<page_key>.data.<champ>` | `entity_translations` avec `entity_type='page'`, `entity_id` = page de `page_key` |
| `page_sections.<page>.<section>.data.<champ>` | `entity_translations` avec `entity_type='page_section'` |
| `content_nodes.<source_key>.data.<champ>` | `entity_translations` avec `entity_type='node'` |
| `intervention_types.<code>.data.<champ>` | `entity_translations` avec `entity_type='interventiontype'` |
| `sectors.<code>.data.<champ>` | `entity_translations` avec `entity_type='sector'` |
| `categories.<code>.data.<champ>` | `entity_translations` avec `entity_type='category'` |
| `offices.<code>.data.<champ>` | `entity_translations` avec `entity_type='office'` |
| `team_members.<code>.data.<champ>` | `entity_translations` avec `entity_type='team_member'` |
| `site_settings.<groupe>.<clé>` | `site_settings.value` (non traduit) ou `entity_translations(setting).data.value` (traduit) |
| `i18n — UI` | reste dans `fr.json` / `en.json` (exception) |
| `i18n — technique` | reste dans le code / les templates (exception) |
| `— (clé morte)` | supprimée du frontend, aucun équivalent en base |

**Synthèse** : **126 clés éditoriales** (soit **127 cibles en base** :
`contact.address` a deux cibles), **44 clés d'interface**, **5 clés
techniques**, **9 clés mortes** = **184** (184 = 184 entre FR et EN). Le
détail des exceptions est en §17.

## 1. Navigation (`nav.*`) — 16 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `nav.home` | menu, fil d'Ariane | Éditorial | `pages.home.data.nav_label` |
| `nav.services` | menu, mega-menu, fils | Éditorial | `pages.services.data.nav_label` |
| `nav.interventions` | menu, page | Éditorial | `pages.interventions.data.nav_label` |
| `nav.sectors` | menu, page | Éditorial | `pages.sectors.data.nav_label` |
| `nav.publications` | menu, mega-menu, page | Éditorial | `pages.publications.data.nav_label` |
| `nav.about` | menu | Éditorial | `pages.about.data.nav_label` |
| `nav.contact` | menu, footer, page | Éditorial | `pages.contact.data.nav_label` |
| `nav.clientArea` | menu, barre utilitaire | Éditorial | `pages.client_area.data.nav_label` |
| `nav.search` | bouton de recherche | UI | `i18n — UI` |
| `nav.searchLabel` | `aria-label` du champ | UI | `i18n — UI` |
| `nav.searchPlaceholder` | placeholder du champ | UI | `i18n — UI` |
| `nav.noResults` | état vide de la recherche | UI | `i18n — UI` |
| `nav.searchHint` | aide « Échap pour fermer » | UI | `i18n — UI` |
| `nav.menu` | bouton menu mobile | UI | `i18n — UI` |
| `nav.close` | fermeture (menu, recherche, cookies) | UI | `i18n — UI` |
| `nav.language` | sélecteur de langue | UI | `i18n — UI` |

*Les libellés de navigation des pages sont éditoriaux car ils constituent le
titre public de la page. Les libellés de contrôles (recherche, menu,
fermeture, langue) restent des libellés d'interface.*

## 2. Communs (`common.*`) — 11 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `common.ourServices` | CTA hero / domaines | Éditorial | `site_settings.ui_copy.cta_services` |
| `common.contactUs` | CTA présent sur 8 vues | Éditorial | `site_settings.ui_copy.cta_contact` |
| `common.learnMore` | CTA « en savoir plus » | Éditorial | `site_settings.ui_copy.cta_learn_more` |
| `common.discover` | CTA « découvrir » | Éditorial | `site_settings.ui_copy.cta_discover` |
| `common.backToTop` | **non utilisé** | Clé morte | `— (clé morte)` |
| `common.followUs` | **non utilisé** | Clé morte | `— (clé morte)` |
| `common.legal` | lien légal du footer | Éditorial | `pages.legal_notice.data.nav_label` |
| `common.placeholder` | texte de remplacement (footer, client) | UI | `i18n — UI` |
| `common.allRightsReserved` | mention de copyright | UI | `i18n — UI` |
| `common.breadcrumbNav` | **non utilisé** | Clé morte | `— (clé morte)` |
| `common.skipToContent` | lien d'évitement (a11y) | UI | `i18n — UI` |

## 3. Bandeau « bientôt » (`comingSoon.*`) — 3 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `comingSoon.title` | espace client (module à venir) | Éditorial | `page_sections.client_area.coming_soon.data.title` |
| `comingSoon.text` | idem | Éditorial | `page_sections.client_area.coming_soon.data.text` |
| `comingSoon.cta` | idem | Éditorial | `page_sections.client_area.coming_soon.data.cta_label` |

## 4. Page 404 (`notFound.*`) — 3 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `notFound.title` | page 404 | Éditorial | `pages.not_found.data.title` |
| `notFound.text` | page 404 | Éditorial | `pages.not_found.data.text` |
| `notFound.backHome` | CTA retour accueil | Éditorial | `site_settings.ui_copy.cta_back_home` |

*La page 404 reste `noindex` (correctif frontend `bb3a5d1`) ; son texte est
éditable, mais elle n'entre ni dans le sitemap ni dans la navigation.*

## 5. Contact (`contact.*`) — 22 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `contact.name` | libellé du champ | UI | `i18n — UI` |
| `contact.email` | libellé du champ | UI | `i18n — UI` |
| `contact.phone` | libellé du champ | UI | `i18n — UI` |
| `contact.address` | adresse affichée | Éditorial | `offices.hq.data.address_lines` (« Dakar, Sénégal ») — la seconde cible `data.city` est **redondante** : `city` provient de `OFFICES` (doc 13 §1.1, fait foi) et l'emporte |
| `contact.companyName` | raison sociale affichée | Éditorial | `site_settings.identity.legal_name` |
| `contact.subject` | libellé du champ | UI | `i18n — UI` |
| `contact.message` | libellé du champ | UI | `i18n — UI` |
| `contact.send` | bouton d'envoi | UI | `i18n — UI` |
| `contact.success` | message de succès | UI | `i18n — UI` |
| `contact.error` | échec d'envoi | Technique | `i18n — technique` |
| `contact.required` | validation « obligatoire » | Technique | `i18n — technique` |
| `contact.invalidEmail` | validation e-mail | Technique | `i18n — technique` |
| `contact.introText` | intro de la page contact | Éditorial | `pages.contact.data.intro` |
| `contact.officeName` | libellé bureau principal | Éditorial | `offices.hq.data.name` |
| `contact.fixed` | libellé fixe | UI | `i18n — UI` |
| `contact.mobile` | libellé mobile | UI | `i18n — UI` |
| `contact.viewOffices` | lien ancre « Voir nos implantations » | UI | `i18n — UI` |
| `contact.officesTitle` | titre section implantations | Éditorial | `page_sections.contact.offices_grid.data.title` |
| `contact.officesIntro` | intro section implantations | Éditorial | `page_sections.contact.offices_grid.data.intro` |
| `contact.headquarters` | badge « Siège » | UI | `i18n — UI` |
| `contact.addressesComing` | texte repli adresses | Éditorial | `page_sections.contact.offices_grid.data.empty_text` |
| `contact.mapComing` | texte repli carte | Éditorial | `page_sections.contact.offices_grid.data.map_empty_text` |

*La page Contact fusionne le formulaire de prise de contact et la section « Nos implantations »
(issue de l'ancienne page Localisations). Les coordonnées spécifiques de chaque bureau viennent de `offices`.*

## 6. Espace client (`clientArea.*`) — 5 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `clientArea.title` | titre de la page | Éditorial | `pages.client_area.data.title` |
| `clientArea.subtitle` | sous-titre | Éditorial | `pages.client_area.data.subtitle` |
| `clientArea.username` | libellé du champ | UI | `i18n — UI` |
| `clientArea.password` | libellé du champ | UI | `i18n — UI` |
| `clientArea.login` | bouton de connexion | UI | `i18n — UI` |

*Le module est inactif en v1 ; les écrans restent en i18n tant que
l'authentification client n'est pas livrée (v2).*

## 7. Accueil (`home.*`) — 42 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `home.heroKicker` | **non utilisé** | Clé morte | `— (clé morte)` |
| `home.heroBrand1` | hero, ligne 1 | Éditorial | `page_sections.home.hero.data.brand_line1` |
| `home.heroBrand2` | hero, ligne 2 | Éditorial | `page_sections.home.hero.data.brand_line2` |
| `home.heroTitle1` | **non utilisé** | Clé morte | `— (clé morte)` |
| `home.heroTitle2` | **non utilisé** | Clé morte | `— (clé morte)` |
| `home.heroTitle3` | **non utilisé** | Clé morte | `— (clé morte)` |
| `home.heroSub` | hero, sous-titre | Éditorial | `page_sections.home.hero.data.subtitle` |
| `home.trust.kicker` | **non utilisé** | Clé morte | `— (clé morte)` |
| `home.trust.onecca` | bandeau de confiance, item 1 | Éditorial | `page_sections.home.trust_bar.data.items[onecca].text` |
| `home.trust.uemoa` | item 2 | Éditorial | `page_sections.home.trust_bar.data.items[uemoa].text` |
| `home.trust.ohada` | item 3 | Éditorial | `page_sections.home.trust_bar.data.items[ohada].text` |
| `home.trust.sectors` | item 4 | Éditorial | `page_sections.home.trust_bar.data.items[sectors].text` |
| `home.aboutKicker` | section à propos | Éditorial | `page_sections.home.about_preview.data.kicker` |
| `home.aboutTitle` | section à propos | Éditorial | `page_sections.home.about_preview.data.title` |
| `home.aboutText` | section à propos + page à propos | Éditorial | `page_sections.home.about_preview.data.text` (voir doc 16 §10) |
| `home.founder` | nom du fondateur | Éditorial | `team_members.founder.data.full_name` |
| `home.founderRole` | rôle du fondateur | Éditorial | `team_members.founder.data.role` |
| `home.founderPhotoPlaceholder` | texte si photo absente | UI | `i18n — UI` |
| `home.domainsKicker` | grille des domaines | Éditorial | `page_sections.home.domains_grid.data.kicker` |
| `home.domainsTitle` | grille des domaines | Éditorial | `page_sections.home.domains_grid.data.title` |
| `home.auditKicker` | bloc audit externe | Éditorial | `page_sections.home.audit_grid.data.kicker` |
| `home.auditTitle` | bloc audit externe | Éditorial | `page_sections.home.audit_grid.data.title` |
| `home.auditText` | bloc audit externe | Éditorial | `page_sections.home.audit_grid.data.text` |
| `home.interventionsKicker` | bloc interventions | Éditorial | `page_sections.home.interventions_grid.data.kicker` |
| `home.interventionsTitle` | bloc interventions | Éditorial | `page_sections.home.interventions_grid.data.title` |
| `home.sectorsKicker` | bloc secteurs | Éditorial | `page_sections.home.sectors_grid.data.kicker` |
| `home.sectorsTitle` | bloc secteurs | Éditorial | `page_sections.home.sectors_grid.data.title` |
| `home.signature.grow` | phrase signature « récurrentes » | Éditorial | `intervention_types.recurrentes.data.signature` |
| `home.signature.contribute` | phrase signature « ponctuelles » | Éditorial | `intervention_types.ponctuelles.data.signature` |
| `home.statsKicker` | bloc chiffres | Éditorial | `page_sections.home.stats.data.kicker` |
| `home.statsDomains` | libellé statistique 1 | Éditorial | `page_sections.home.stats.data.items[domains].label` |
| `home.statsAudit` | libellé statistique 2 | Éditorial | `page_sections.home.stats.data.items[audit].label` |
| `home.statsSectors` | libellé statistique 3 | Éditorial | `page_sections.home.stats.data.items[sectors].label` |
| `home.statsInterventions` | libellé statistique 4 | Éditorial | `page_sections.home.stats.data.items[interventions].label` |
| `home.publicationsKicker` | bloc publications | Éditorial | `page_sections.home.publications_grid.data.kicker` |
| `home.publicationsTitle` | bloc publications | Éditorial | `page_sections.home.publications_grid.data.title` |
| `home.publicationsAll` | CTA « toutes les publications » | Éditorial | `page_sections.home.publications_grid.data.cta_label` |
| `home.publicationsPlaceholder` | état vide | Éditorial | `page_sections.home.publications_grid.data.empty_text` |
| `home.ctaTitle` | CTA final | Éditorial | `page_sections.home.cta.data.title` |
| `home.ctaText` | CTA final | Éditorial | `page_sections.home.cta.data.text` |
| `home.ctaSecondary` | CTA secondaire | Éditorial | `page_sections.home.cta.data.secondary_label` |
| `home.aboutCta` | CTA de la section à propos | Éditorial | `page_sections.home.about_preview.data.cta_label` |

*Les valeurs des quatre statistiques ne sont **pas** des textes : elles sont
calculées (7 domaines d'accompagnement, 3 domaines d'audit, 3 secteurs,
2 types d'intervention). Seuls les **libellés** sont éditoriaux. Une option
`value_override` est prévue dans `config` pour un pilotage manuel ultérieur
(Q-110).*

## 8. Interventions (`interventions.*`) — 13 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `interventions.introText` | intro de la page | Éditorial | `pages.interventions.data.intro` |
| `interventions.compareTitle` | titre du comparatif | Éditorial | `page_sections.interventions.compare.data.title` |
| `interventions.rowFocus` | ligne « axe » | Éditorial | `page_sections.interventions.compare.data.rows[focus].label` |
| `interventions.rowFocusR` | valeur récurrente | Éditorial | `...rows[focus].recurring` |
| `interventions.rowFocusP` | valeur ponctuelle | Éditorial | `...rows[focus].oneoff` |
| `interventions.rowAction` | ligne « action » | Éditorial | `...rows[action].label` |
| `interventions.rowActionR` | valeur récurrente | Éditorial | `...rows[action].recurring` |
| `interventions.rowActionP` | valeur ponctuelle | Éditorial | `...rows[action].oneoff` |
| `interventions.rowHeart` | ligne « cœur » | Éditorial | `...rows[heart].label` |
| `interventions.rowHeartR` | valeur récurrente | Éditorial | `...rows[heart].recurring` |
| `interventions.rowHeartP` | valeur ponctuelle | Éditorial | `...rows[heart].oneoff` |
| `interventions.compareCaption` | légende du tableau | Éditorial | `page_sections.interventions.compare.data.caption` |
| `interventions.compareHead` | en-tête de colonne | Éditorial | `page_sections.interventions.compare.data.head_label` |

## 9. Services (`services.*`) — 19 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `services.indexKicker` | en-tête de l'index | Éditorial | `page_sections.services.header.data.kicker` |
| `services.indexTitle` | en-tête de l'index | Éditorial | `page_sections.services.header.data.title` |
| `services.indexText` | intro de l'index (aussi secteurs) | Éditorial | `page_sections.services.header.data.intro` (voir doc 16 §10) |
| `services.modesTitle` | bloc des 3 modes | Éditorial | `page_sections.services.modes.data.title` |
| `services.modeAssistanceTitle` | mode 1 | Éditorial | `...modes.data.items[assistance].title` |
| `services.modeAssistanceText` | mode 1 | Éditorial | `...modes.data.items[assistance].text` |
| `services.modeConseilTitle` | mode 2 | Éditorial | `...modes.data.items[conseil].title` |
| `services.modeConseilText` | mode 2 | Éditorial | `...modes.data.items[conseil].text` |
| `services.modeFormationTitle` | mode 3 | Éditorial | `...modes.data.items[formation].title` |
| `services.modeFormationText` | mode 3 | Éditorial | `...modes.data.items[formation].text` |
| `services.domainsTitle` | titre de la grille | Éditorial | `page_sections.services.domains_grid.data.title` |
| `services.auditTypesTitle` | titre du bloc audit | Éditorial | `page_sections.services.audit_grid.data.title` |
| `services.ctaDomain` | CTA contextuel | Éditorial | `page_sections.services.cta.data.title` |
| `services.ctaDomainText` | CTA contextuel | Éditorial | `page_sections.services.cta.data.text` |
| `services.prevDomain` | navigation précédent | UI | `i18n — UI` |
| `services.nextDomain` | navigation suivant | UI | `i18n — UI` |
| `services.otherDomains` | sommaire latéral | UI | `i18n — UI` |
| `services.onThisPage` | sommaire latéral | UI | `i18n — UI` |
| `services.prestations` | compteur de prestations | UI | `i18n — UI` |

## 10. Catégories de publication (`pubCat.*`) — 6 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `pubCat.governance` | filtre / badge | Éditorial | `categories.governance.data.title` |
| `pubCat.audit` | filtre / badge | Éditorial | `categories.audit.data.title` |
| `pubCat.finance` | filtre / badge | Éditorial | `categories.finance.data.title` |
| `pubCat.hr` | filtre / badge | Éditorial | `categories.hr.data.title` |
| `pubCat.it` | filtre / badge | Éditorial | `categories.it.data.title` |
| `pubCat.legal` | filtre / badge | Éditorial | `categories.legal.data.title` |

## 11. À propos (`about.*`) — 13 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `about.introKicker` | en-tête de page | Éditorial | `page_sections.about.header.data.kicker` |
| `about.whatWeDoKicker` | bloc « ce que nous faisons » | Éditorial | `page_sections.about.what_we_do.data.kicker` |
| `about.whatWeDoText` | bloc « ce que nous faisons » | Éditorial | `page_sections.about.what_we_do.data.text` |
| `about.howWeWorkKicker` | bloc « manière de travailler » | Éditorial | `page_sections.about.how_we_work.data.kicker` |
| `about.howWork1Title` | étape 1 | Éditorial | `...how_we_work.data.items[0].title` |
| `about.howWork1Text` | étape 1 | Éditorial | `...how_we_work.data.items[0].text` |
| `about.howWork2Title` | étape 2 | Éditorial | `...how_we_work.data.items[1].title` |
| `about.howWork2Text` | étape 2 | Éditorial | `...how_we_work.data.items[1].text` |
| `about.howWork3Title` | étape 3 | Éditorial | `...how_we_work.data.items[2].title` |
| `about.howWork3Text` | étape 3 | Éditorial | `...how_we_work.data.items[2].text` |
| `about.valuesTitle` | bloc valeurs | Éditorial | `page_sections.about.values.data.title` |
| `about.valuesComing` | état vide des valeurs | Éditorial | `page_sections.about.values.data.empty_text` |
| `about.founderBioComing` | état vide de la biographie | Éditorial | `page_sections.about.founder_card.data.empty_text` |

## 12. Publications (`publications.*`) — 14 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `publications.kicker` | en-tête de liste | Éditorial | `page_sections.publications.header.data.kicker` |
| `publications.introText` | intro de liste | Éditorial | `page_sections.publications.header.data.intro` |
| `publications.filterAll` | filtre « toutes » | UI | `i18n — UI` |
| `publications.searchPlaceholder` | recherche locale | UI | `i18n — UI` |
| `publications.empty` | liste vide | UI | `i18n — UI` |
| `publications.error` | erreur de chargement | Technique | `i18n — technique` |
| `publications.loading` | chargement | UI | `i18n — UI` |
| `publications.loadMore` | bouton « charger plus » | UI | `i18n — UI` |
| `publications.sampleBadge` | badge « exemple » (contenu de démonstration) | UI | `i18n — UI` |
| `publications.sampleNotice` | **non utilisé** | Clé morte | `— (clé morte)` |
| `publications.readingTime` | durée de lecture | UI | `i18n — UI` |
| `publications.byAuthor` | mention d'auteur | UI | `i18n — UI` |
| `publications.relatedTitle` | titre « à lire aussi » | UI | `i18n — UI` |
| `publications.bodyComing` | corps absent | UI | `i18n — UI` |

*Les contenus des publications (titre, chapô, corps, auteur, catégorie,
couverture) vivent dans `publications` + `entity_translations`, pas dans ces
clés qui ne sont que des libellés de liste.*

## 13. Localisations (`locations.*`) — Fusionnée dans Contact (0 clé)

*L'ancienne page dédiée `locations` et ses 8 clés `locations.*` ont été supprimées et fusionnées
dans la page unifiée Contact (`contact.*`, §5) et dans la table `offices` (implantations du cabinet).
Les redirections 301 gèrent l'historique d'URL `/localisations` et `/locations` vers `/contact#implantations`.*

## 14. Mentions légales et cookies (`legal.*`) — 11 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `legal.mentions` | titre du bloc mentions | Éditorial | `page_sections.legal_notice.mentions.data.title` |
| `legal.privacy` | titre du bloc confidentialité | Éditorial | `page_sections.legal_notice.privacy.data.title` |
| `legal.cookies` | titre du bloc cookies | Éditorial | `page_sections.legal_notice.cookies.data.title` |
| `legal.toComplete` | bandeau « à compléter » (H-007) | Éditorial | `page_sections.legal_notice.mentions.data.banner_text` (+ `privacy`, `cookies` — valeur reportée sur les 3 blocs `legal_document` ; le groupe `site_settings.legal` **n'existe pas**, registre doc 16 §9) |
| `legal.bodyMentions` | corps des mentions | Éditorial | `page_sections.legal_notice.mentions.data.body` |
| `legal.bodyPrivacy` | corps de la confidentialité | Éditorial | `page_sections.legal_notice.privacy.data.body` |
| `legal.bodyCookies` | corps des cookies | Éditorial | `page_sections.legal_notice.cookies.data.body` |
| `legal.acceptAll` | bouton « tout accepter » | Éditorial | `site_settings.cookies.accept_label` |
| `legal.refuseAll` | bouton « tout refuser » | Éditorial | `site_settings.cookies.refuse_label` |
| `legal.custom` | bouton « personnaliser » | Éditorial | `site_settings.cookies.custom_label` |
| `legal.customParag` | texte de personnalisation | Éditorial | `site_settings.cookies.custom_text` |

*Le bandeau cookies est du texte légal public : il est éditorial, y compris
les libellés de ses boutons. Les contrôles purement fonctionnels
(fermeture, navigation) restent en i18n.*

## 15. États de l'espace client (`clientAreaStates.*`) — 4 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `clientAreaStates.error` | erreur de connexion | Technique | `i18n — technique` |
| `clientAreaStates.loading` | chargement | UI | `i18n — UI` |
| `clientAreaStates.forgot` | lien « mot de passe oublié » | UI | `i18n — UI` |
| `clientAreaStates.forgotDetail` | texte d'aide | UI | `i18n — UI` |

## 16. Métadonnées (`meta.*`) — 2 clés

| Clé | Usage | Classe | Cible |
|---|---|---|---|
| `meta.homeTitle` | `<title>` de l'accueil | Éditorial | `pages.home.data.seo_title` |
| `meta.homeDescription` | meta description **et** texte du footer | Éditorial | `pages.home.data.seo_description` ; le footer doit être découplé vers `site_settings.identity.tagline` |

## 17. Exceptions explicites (58 clés)

Les 58 clés qui ne passent **pas** en base sont listées ici de façon fermée :
toute clé absente de cette section est éditoriale et doit avoir une cible
dans le modèle.

| Catégorie | Nombre | Où vit le texte |
|---|---|---|
| Libellés d'interface | 45 | `fr.json` / `en.json` |
| Messages techniques | 5 | code backend, `fr.json` pour les messages génériques |
| Clés mortes à supprimer | 9 | nulle part |
| **Total des exceptions** | **59** | |
| Mémoire : clés éditoriales | 125 | base PostgreSQL |
| **Total général** | **184** | |

### 17.1 Libellés d'interface (45 clés)

`nav.search`, `nav.searchLabel`, `nav.searchPlaceholder`, `nav.noResults`,
`nav.searchHint`, `nav.menu`, `nav.close`, `nav.language`,
`common.placeholder`, `common.allRightsReserved`, `common.skipToContent`,
`home.founderPhotoPlaceholder`, `contact.name`, `contact.email`,
`contact.phone`, `contact.subject`, `contact.message`, `contact.send`,
`contact.success`, `contact.fixed`, `contact.mobile`, `contact.viewOffices`,
`contact.headquarters`, `clientArea.username`, `clientArea.password`,
`clientArea.login`, `services.prevDomain`, `services.nextDomain`,
`services.otherDomains`, `services.onThisPage`, `services.prestations`,
`publications.filterAll`, `publications.searchPlaceholder`,
`publications.empty`, `publications.loading`, `publications.loadMore`,
`publications.sampleBadge`, `publications.readingTime`,
`publications.byAuthor`, `publications.relatedTitle`,
`publications.bodyComing`, `clientAreaStates.loading`,
`clientAreaStates.forgot`, `clientAreaStates.forgotDetail`.

### 17.2 Messages techniques (5 clés)

`contact.error`, `contact.required`, `contact.invalidEmail`,
`publications.error`, `clientAreaStates.error` — et, par extension, tous les
messages d'erreur API (page 08 §6) et les templates d'e-mail (page 07 §10)
qui ne sont pas des clés i18n du frontend.

### 17.3 Clés mortes à supprimer (9 clés)

Vérifiées sans aucun usage dans `Frontend/src` (recherche littérale et
recherche des usages dynamiques `t(\`…\`)`) :

| Clé | Raison |
|---|---|
| `common.backToTop` | aucune occurrence |
| `common.followUs` | aucune occurrence |
| `common.breadcrumbNav` | le fil d'Ariane utilise `nav.home` + titres de page |
| `home.heroKicker` | remplacé par `heroBrand1/2` |
| `home.heroTitle1` | ancienne version du hero, non rendue |
| `home.heroTitle2` | idem |
| `home.heroTitle3` | idem |
| `home.trust.kicker` | `TrustBar.tsx` n'utilise que `home.trust.{onecca,uemoa,ohada,sectors}` en dynamique |
| `publications.sampleNotice` | remplacé par `publications.sampleBadge` |

**À faire au moment de la bascule** : suppression des 9 clés dans `fr.json`
et `en.json` (le test de symétrie 182 = 182 passera à 173 = 173). Aucune
n'est reprise en base.

## 18. Doublons de libellés de prestations (slugs)

Les 94 prestations n'ont aujourd'hui **ni id ni slug** : ce sont des
`LocalizedText[]` dans `content.data.ts`. Trois libellés sont dupliqués.

| Libellé FR | Occurrences | Famille | Domaine | Groupes parents |
|---|---|---|---|---|
| `Formation des dirigeants et employés` | 13 | accompagnement | systeme-information | application-logicielle, progiciel-gestion-integre, dematerialisation-numerisation |
| `Formation des dirigeants et employés` | 13 | accompagnement | gestion-financiere | comptabilite, gestion-operationnelle, compilation-information-financiere, reporting-financier |
| `Formation des dirigeants et employés` | 13 | accompagnement | juridique-fiscale | secretariat-juridique, conformite-fiscale, optimisation-fiscale |
| `Formation des dirigeants et employés` | 13 | accompagnement | gestion-ressources-humaines | secretariat-social, grh, traitement-de-la-paye |
| `Formation des administrateurs et dirigeants` | 2 | accompagnement | organisation-strategie | strategie-intra-entreprise, organisation-structurelle-fonctionnelle |
| `Formation des administrateurs, dirigeants et employés` | 2 | accompagnement | audit-controle-interne | fonction-audit-interne, systeme-controle-interne |

**Règle de slug** : `slug(libellé FR) + '-' + slug(groupe parent)`, puis
domaine, puis `-2`, `-3` en dernier recours (page 16 §7). Exemple :
`formation-des-dirigeants-et-employes-secretariat-juridique`.

**Cas particulier** : les deux autres libellés dupliqués ont des groupes
parents distincts ; la contextualisation par groupe suffit. Aucun suffixe
numérique n'est nécessaire pour le seed actuel.

## 19. Contenus à créer (absents de l'i18n actuel)

| Contenu | Cible | Pourquoi |
|---|---|---|
| `identity.tagline` | `site_settings.identity.tagline` | le footer réutilise aujourd'hui `meta.homeDescription` ; il faut un texte propre |
| `pages.sectors.data.intro` | page secteurs | la page secteurs réutilise `services.indexText` ; il faut une intro propre |
| `pages.publications.data.intro` | page publications | la liste n'a pas d'intro propre hors `publications.introText` (section) |
| `pages.contact.data.intro` | page contact | intro de la page contact |
| `team_members.founder.data.bio` | fiche fondateur | biographie absente (placeholder actuel) |
| `offices.hq.data.*` | bureau siège | adresse, téléphones, e-mail, carte |
| `seo_title` / `seo_description` par page | `entity_translations.data` | SEO aujourd'hui limité à l'accueil |

Ces créations sont **additives** : elles ne suppriment aucune clé existante.
