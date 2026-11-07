/**
 * Types partagés du contenu éditorial EXAUCE.
 * Tout le contenu provient du document
 * « STRUCTURATION ET CONTENU DU SITE INTERNET » (source de vérité).
 * Aucune chaîne ne doit être codée en dur dans les composants.
 */

/** Langues supportées. */
export type Lang = 'fr' | 'en';

/** Texte localisé pour toutes les données éditoriales. */
export interface LocalizedText {
  fr: string;
  en: string;
}

/** Identifiant + URL-safe slug traduit. */
export interface Slugged {
  id: string;
  /** Synonyme traduit (ex. « accompagnement » / « support »). */
  slug: LocalizedText;
}

/** Niveau 4 : un groupe de prestations (ex. « Niveau Associés ») avec sa liste. */
export interface ServiceGroup extends Slugged {
  title: LocalizedText;
  /** Phrase d'introduction du groupe. */
  intro: LocalizedText;
  /** Prestations (niveau 4). */
  items: LocalizedText[];
}

/** Niveau 3 : domaine d'un service (ex. « Gouvernance »). */
export interface ServiceDomain extends Slugged {
  title: LocalizedText;
  intro: LocalizedText;
  /** Sous-niveaux de détail (niveau 4). Vide si le domaine n'en a pas. */
  groups: ServiceGroup[];
  /** Nom de la fiche Lucide affichée pour ce domaine (voir data/mapping). */
  icon?: string;
}

/** Niveau 2 : famille de services (Accompagnement / Audit externe). */
export interface ServiceFamily extends Slugged {
  title: LocalizedText;
  tagline: LocalizedText;
  intro: LocalizedText;
  domains: ServiceDomain[];
}

/** Sous-catégorie de secteur (niveau 2+). */
export interface SectorCategory extends Slugged {
  title: LocalizedText;
}

/** Univers de clientèle (Public / Privé / Non-gouvernemental). */
export interface Sector extends Slugged {
  title: LocalizedText;
  intro: LocalizedText;
  categories: SectorCategory[];
}

/** Volet d'intervention (récurrentes / ponctuelles). */
export interface InterventionType extends Slugged {
  title: LocalizedText;
  intro: LocalizedText;
}

/** Publication (mock — sera branchée sur le backend FastAPI). */
export type PublicationCategory = 'governance' | 'audit' | 'finance' | 'hr' | 'it' | 'legal';

export type PublicationSlug = LocalizedText;

/**
 * Origine d'un média de publication.
 *
 * Valeur isolée dans un seul type : alignée sur la contrainte de la note média
 * Backend (`source` ∈ `upload` | `external`). Un renommage éventuel
 * (`uploaded`, `remote`…) ne touche que cette ligne.
 *
 * TODO API: remplacer par le type généré depuis `openapi.yaml` quand le
 * schéma média sera exposé.
 */
export type MediaSource = 'upload' | 'external';

/** Champs communs aux médias d'une publication. */
interface PublicationMediaBase {
  /** id stable côté backend */
  id: string;
  /**
   * Chemin local (`/publications/…`, source `upload`) ou URL absolue
   * (source `external`). Aucun hotlink dans les données de démonstration.
   */
  src: string;
  /** Texte alternatif localisé — obligatoire pour l'accessibilité. */
  alt: LocalizedText;
  /** Légende éditoriale optionnelle. */
  caption?: LocalizedText;
  /** Vignette d'aperçu (utile pour les vidéos). */
  poster?: string;
}

/** Média image d'une publication. */
export interface PublicationImageMedia extends PublicationMediaBase {
  type: 'image';
  source: MediaSource;
}

/** Média vidéo d'une publication. */
export interface PublicationVideoMedia extends PublicationMediaBase {
  type: 'video';
  source: MediaSource;
  /** Durée en millisecondes — aligné sur `duration_ms` de l'API. */
  durationMs?: number;
}

/** Média d'une publication (union discriminée par `type`). */
export type PublicationMedia = PublicationImageMedia | PublicationVideoMedia;

/** Publication (mock — sera branchée sur le backend FastAPI). */
export interface Publication {
  /** id stable côté backend */
  id: string;
  /** slugs publics par langue (URL /publications/:slug) */
  slug: PublicationSlug;
  title: LocalizedText;
  /** résumé court */
  excerpt: LocalizedText;
  /** corps de l'article : paragraphe réparti par doubles sauts de ligne, vide tant que non fourni */
  body?: LocalizedText;
  category: PublicationCategory;
  date: string;
  /** auteur — placeholder tant que non fourni */
  author?: string;
  /**
   * Médias de la galerie (0..n) — source de vérité.
   * `cover` et `mediaCount` ne sont jamais stockés : dérivés par `lib/media.ts`.
   */
  media?: PublicationMedia[];
  /** id du média désigné comme couverture ; à défaut, le premier média. */
  coverId?: string;
  /** statut éditorial backend-ready */
  status: 'draft' | 'published';
}

/** Implantation (bureau) — prêt pour plusieurs sites, adresses à venir. */
export interface Location {
  id: string;
  isHeadquarters?: boolean;
  /** nom du site — placeholder tant que non fourni */
  name: LocalizedText | null;
  addressLines?: string[];
  city?: LocalizedText;
  mapUrl?: string;
  phoneFixed?: string;
  phoneMobile?: string;
  email?: string;
}

/** Partenaire fictif — TODO API: remplacer par l'entité partner du backend. */
export interface Partner {
  id: string;
  name: string;              // nom générique fictif, ex. "Partenaire Alpha"
  logo: string;              // chemin local dans /public/partners/
  alt: LocalizedText;        // texte alternatif FR/EN
  description: LocalizedText;
  url?: string;              // lien optionnel (ex. site fictif)
}
