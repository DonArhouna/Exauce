# Correspondance des champs avec le site public

Cette table précise la destination éditoriale de chaque champ exposé. Les clés indiquées sont celles actuellement lues par le Frontend. La colonne « liaison » distingue cette source actuelle de la future lecture des données publiées de l'API : le Frontend ne consomme pas encore les pages du Backoffice.

| Champ Backoffice | Page / bloc / champ | Emplacement public actuel | Liaison aux données Backoffice |
|---|---|---|---|
| `Page.title` | Page, FR/EN | `<h1>` du `PageHero` de la page concernée ; les sources actuelles sont listées ci-dessous | À brancher sur `AdminPageDetail.title` ; le Frontend utilise encore ses locales |
| `Page.nav_label` | Page, FR/EN | En-tête et fil d'Ariane : `nav.home`, `nav.services`, `nav.interventions`, `nav.sectors`, `nav.publications`, `nav.about`, `nav.contact`, `nav.clientArea`; aucun lien Partenaires n'existe dans `Frontend/src/App.tsx` | À brancher sur `AdminPageDetail.nav_label` |
| `Page.intro` | `services` | `ServicesIndexPage.tsx` → `PageHero.intro` → `services.indexText` | La valeur actuelle du mock vient de `page_header` et diffère ; à confirmer avant branchement |
| `Page.intro` | `interventions` | `InterventionsPage.tsx` → `PageHero.intro` → `interventions.introText` | Valeur source identique au texte du site |
| `Page.intro` | `sectors` | `SectorsPage.tsx` → `PageHero.intro` → `services.indexText` | La valeur du mock est vide ; à charger depuis la locale au branchement |
| `Page.intro` | `publications` | `PublicationsPage.tsx` → `PageHero.intro` → `publications.introText` | Valeur source identique au texte du site |
| `Page.intro` | `about` | `AboutPage.tsx` → `PageHero.intro` → `home.aboutText` | La valeur actuelle du mock vient de `page_header` ; comparaison à confirmer avant branchement |
| `Page.intro` | `contact` | `ContactPage.tsx` → `PageHero.intro` → `contact.introText` | La valeur est actuellement portée par `contact_form.intro` |
| `Page.intro` | `client_area` | `ClientAreaPage.tsx` → `PageHero.intro` → `clientArea.subtitle` | La valeur du mock est vide ; à charger depuis la locale au branchement |
| `Page.intro` | `home`, `partners`, `legal_notice`, `not_found` | Aucun emplacement PageHero générique correspondant dans le Frontend actuel | Ne pas éditer comme introduction publique sans validation de la destination |
| `Page.seo_title` | Page, FR/EN | `Page.tsx` → `document.title`, `meta[property="og:title"]`; chaînes assemblées dans chaque composant de page et `meta.homeTitle` | À brancher sur `AdminPageDetail.seo_title` |
| `Page.seo_description` | Page, FR/EN | `Page.tsx` → `meta[name="description"]`, `meta[property="og:description"]`; `contact` passe `contact.introText`, les autres pages retombent sur le titre ; `meta.homeDescription` existe mais n'est pas transmis par `HomePage` | À brancher sur `AdminPageDetail.seo_description`; la description d'accueil est à confirmer par le cabinet |
| `modes.title` | `services` / `modes` / `title`, FR/EN | `ServicesIndexPage.tsx` (`FamilyView`) → sur-titre au-dessus des trois cartes → `services.modesTitle` | Formulaire et aller-retour livrés ; le Frontend lit encore la locale |
| `modes.items[].title` | `services` / `modes` / `items[].title`, FR/EN | `ServicesIndexPage.tsx` (`FamilyView`) → titre de chaque carte → `services.modeAssistanceTitle`, `services.modeConseilTitle`, `services.modeFormationTitle` (ordre 0, 1, 2) | Formulaire prérempli et ordre conservé ; le Frontend lit encore les locales |
| `modes.items[].text` | `services` / `modes` / `items[].text`, FR/EN | `ServicesIndexPage.tsx` (`FamilyView`) → description de chaque carte → `services.modeAssistanceText`, `services.modeConseilText`, `services.modeFormationText` (ordre 0, 1, 2) | Formulaire, zone multiligne, test FR/EN, conservation des champs inconnus, réordonnancement clavier/souris et aperçu des trois cartes dans l'ordre livrés ; le Frontend lit encore les locales |
| `what_we_do.kicker` | `about` / `what_we_do` / `kicker`, FR/EN | `AboutPage.tsx` → première section, colonne gauche → `about.whatWeDoKicker` | Chargement seed FR/EN, aller-retour bilingue et aperçu hiérarchisé livrés ; le Frontend lit encore les locales |
| `what_we_do.text` | `about` / `what_we_do` / `text`, FR/EN | `AboutPage.tsx` → première section, colonne gauche sous le sur-titre → `about.whatWeDoText` | Zone multiligne, validation, conservation de champs inconnus, aller-retour bilingue et aperçu livrés ; le Frontend lit encore les locales |
| `founder_card.name` | `about` / `founder_card` / `name`, FR/EN | `AboutPage.tsx` → première section, carte fondateur → `home.founder` (également la carte d’accueil) | Chargement depuis la locale, validation et test d’aller-retour FR/EN livrés ; le Frontend lit encore les locales |
| `founder_card.role` | `about` / `founder_card` / `role`, FR/EN | `AboutPage.tsx` → sous le nom dans la carte fondateur → `home.founderRole` (également la carte d’accueil) | Chargement depuis la locale, validation et test d’aller-retour FR/EN livrés ; le Frontend lit encore les locales |
| `founder_card.photo_alt` | `about` / `founder_card` / `photo_alt`, FR/EN | `AboutPage.tsx` → attribut accessible du portrait temporaire → `home.founderPhotoPlaceholder` (également l’aperçu d’accueil) | Chargement depuis la locale, validation et test d’aller-retour FR/EN livrés ; le monogramme « AK » est décoratif et codé dans le site |
| `founder_card.empty_text` | `about` / `founder_card` / `empty_text`, FR/EN | `AboutPage.tsx` → texte sous la carte du fondateur → `about.founderBioComing` | Zone multiligne, validation, conservation de champs inconnus, test d’aller-retour FR/EN et aperçu livrés ; la carte d’accueil affiche un badge d’attente différent |
| `steps.kicker` | `about` / `steps` / `kicker`, FR/EN | `AboutPage.tsx` → section « notre manière de travailler » → `about.howWeWorkKicker` | Chargement Frontend FR/EN, validation et test d’aller-retour livrés ; aperçu de la hiérarchie en étapes |
| `steps.items[].title` | `about` / `steps` / `items[].title`, FR/EN | `AboutPage.tsx` → titre de chaque carte dans l’ordre 0, 1, 2 → `about.howWork1Title`, `about.howWork2Title`, `about.howWork3Title` | Formulaire prérempli, réordonnancement clavier/souris et conservation de l’ordre/nombre testés ; le Frontend lit encore les locales |
| `steps.items[].text` | `about` / `steps` / `items[].text`, FR/EN | `AboutPage.tsx` → description sous le titre de chaque carte, ordre 0, 1, 2 → `about.howWork1Text`, `about.howWork2Text`, `about.howWork3Text` | Zone multiligne, validation, aller-retour FR/EN, ordre/nombre et aperçu testés ; le Frontend lit encore les locales |
| `values_grid.title` | `about` / `values_grid` / `title`, FR/EN | `AboutPage.tsx` → titre de la section Valeurs → `about.valuesTitle` | Valeur de locale, test FR/EN et aperçu livrés ; wording à confirmer par le cabinet |
| `values_grid.empty_text` | `about` / `values_grid` / `empty_text`, FR/EN | `AboutPage.tsx` → texte provisoire sous le titre → `about.valuesComing` | Texte à confirmer par le cabinet, test FR/EN et aperçu livrés ; le Frontend lit encore les locales |

## Valeurs de repli SEO

- Si `Page.seo_description` est vide, le Frontend utilise le titre SEO de la page.
- Pour `partners`, aucune route publique n'existe ; l'URL retombe actuellement sur la page 404, sans indexation.
- Les valeurs SEO reprises des locales et les descriptions proposées sont **à confirmer par le cabinet** avant publication.

## 3b

Une ligne sera ajoutée pour chaque champ de bloc au moment où son formulaire, son test FR/EN et son aperçu seront livrés. Un champ sans emplacement confirmé ne sera pas exposé à l'édition.
