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
  /** image optionnelle — placeholder tant que non fournie */
  image?: { src: string; alt: LocalizedText };
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

