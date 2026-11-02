import type { Lang } from '@/i18n';
import type { MediaItem } from '@/services/api/types';

/** Langues d'édition supportées (miroir de `i18n`), sans dépendre du runtime i18n. */
export const MEDIA_LANGS = ['fr', 'en'] as const;

/** Types de média acceptés par le contrat (`MediaItem.kind`). */
export const MEDIA_KINDS = ['image', 'pdf', 'document'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/** Types MIME acceptés au téléversement, groupés par `kind`. */
export const ACCEPTED_MIME: Record<MediaKind, string[]> = {
  image: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
  pdf: ['application/pdf'],
  document: ['text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

/** Taille maximale acceptée côté client ; le serveur reste l'autorité. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type LocalizedText = Partial<Record<Lang, string>>;

/** Sélection d'un média dans un formulaire, texte alternatif par langue. */
export interface MediaSelection {
  id: string;
  /** Nom affiché (nom de fichier d'origine). */
  name: string;
  kind: MediaKind;
  url: string;
  mime: string;
  alt: LocalizedText;
  /** Image purement décorative : aucun texte alternatif requis. */
  decorative: boolean;
}

/** Élément de galerie ordonnée. */
export interface GalleryItem extends MediaSelection {
  /** Identifiant stable de l'élément dans la galerie (≠ id du média). */
  key: string;
}

/** Bloc vidéo : lien externe (YouTube/Vimeo), légende et transcription. */
export interface VideoValue {
  url: string;
  caption: LocalizedText;
  transcription: LocalizedText;
}

export type VideoProvider = 'youtube' | 'vimeo';

export interface ParsedVideo {
  provider: VideoProvider;
  videoId: string;
  embedUrl: string;
}

/** Médias qui exigent un texte alternatif (tout sauf le décoratif explicite). */
export function requiresAlt(media: Pick<MediaSelection, 'kind' | 'decorative'>): boolean {
  return media.kind === 'image' && !media.decorative;
}

/** Langues pour lesquelles le texte alternatif manque. */
export function missingAltLangs(
  media: Pick<MediaSelection, 'kind' | 'decorative' | 'alt'>,
  languages: readonly Lang[] = MEDIA_LANGS,
): Lang[] {
  if (!requiresAlt(media)) return [];
  return languages.filter((lang) => !(media.alt[lang] ?? '').trim());
}

/** Vrai si le média bloque la publication : image non décorative sans alt complet. */
export function blocksPublication(
  media: Pick<MediaSelection, 'kind' | 'decorative' | 'alt'>,
  languages: readonly Lang[] = MEDIA_LANGS,
): boolean {
  return missingAltLangs(media, languages).length > 0;
}

/** Déplace un élément et renvoie un nouveau tableau (jamais de mutation). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return [...items];
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'];
const YOUTUBE_SHORT_HOSTS = ['youtu.be', 'www.youtu.be'];
const VIMEO_HOSTS = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'];

/**
 * Analyse un lien YouTube ou Vimeo. Seuls ces deux hébergeurs sont acceptés :
 * un lien arbitraire ne doit jamais finir dans une iframe.
 */
export function parseVideoUrl(raw: string): ParsedVideo | null {
  const value = raw.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, '');

  if (YOUTUBE_SHORT_HOSTS.includes(host)) {
    const id = path.slice(1);
    return isYouTubeId(id) ? buildYouTube(id) : null;
  }

  if (YOUTUBE_HOSTS.includes(host)) {
    const fromQuery = url.searchParams.get('v');
    if (fromQuery && isYouTubeId(fromQuery)) return buildYouTube(fromQuery);
    const match = path.match(/^\/(?:embed|shorts|live)\/([^/]+)$/);
    if (match && isYouTubeId(match[1])) return buildYouTube(match[1]);
    return null;
  }

  if (VIMEO_HOSTS.includes(host)) {
    const match = path.match(/^\/(?:video\/)?(\d{5,})$/);
    return match ? { provider: 'vimeo', videoId: match[1], embedUrl: `https://player.vimeo.com/video/${match[1]}` } : null;
  }

  return null;
}

function isYouTubeId(value: string): boolean {
  return /^[A-Za-z0-9_-]{6,20}$/.test(value);
}

function buildYouTube(videoId: string): ParsedVideo {
  // Domaine sans cookie : aucune trace publicitaire avant lecture.
  return { provider: 'youtube', videoId, embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}` };
}

/** Taille lisible (Ko/Mo) selon la langue active. */
export function formatFileSize(bytes: number, lang: string): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const formatted = new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'fr-FR', {
    maximumFractionDigits: value >= 10 || unit === 0 ? 0 : 1,
  }).format(value);
  return `${formatted} ${units[unit]}`;
}

/** Types MIME acceptés pour un `kind` donné, avec joker pour les documents. */
export function isAcceptedMime(mime: string, kind: MediaKind): boolean {
  return ACCEPTED_MIME[kind].includes(mime);
}

/** `kind` déduit du type MIME ; `null` si le fichier n'est pas accepté. */
export function kindForMime(mime: string): MediaKind | null {
  for (const kind of MEDIA_KINDS) {
    if (isAcceptedMime(mime, kind)) return kind;
  }
  return null;
}

/** Média du contrat → sélection de formulaire (alt existant repris pour chaque langue). */
export function toMediaSelection(item: MediaItem, languages: readonly Lang[] = MEDIA_LANGS): MediaSelection {
  const kind: MediaKind = item.kind ?? 'image';
  const alt: LocalizedText = {};
  if (item.alt) {
    for (const lang of languages) alt[lang] = item.alt;
  }
  return {
    id: item.id ?? '',
    name: item.storage_key?.split('/').pop() ?? item.id ?? '',
    kind,
    url: item.url ?? '',
    mime: item.mime ?? '',
    alt,
    decorative: false,
  };
}
