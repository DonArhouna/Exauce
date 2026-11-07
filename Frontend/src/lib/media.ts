import type { Publication, PublicationMedia } from '@/types/content';

/**
 * Dérivés média d'une publication.
 *
 * `cover` et `mediaCount` ne sont **jamais stockés** : ils sont calculés à
 * partir du tableau `media` (source de vérité). Cela évite les incohérences
 * entre le tableau et un champ dénormalisé.
 *
 * TODO API: si le backend expose un jour `cover_media_id` / `media_count`,
 * conserver ces fonctions comme adaptateur unique.
 */

/** Nombre de médias d'une publication (0 si aucun). */
export function pubMediaCount(pub: Publication): number {
  return pub.media?.length ?? 0;
}

/**
 * Média de couverture : le média désigné par `coverId`, sinon le premier.
 * `null` si la publication n'a aucun média.
 */
export function pubCover(pub: Publication): PublicationMedia | null {
  const media = pub.media ?? [];
  if (media.length === 0) return null;
  return media.find((m) => m.id === pub.coverId) ?? media[0];
}

/** Vrai si la publication contient au moins une vidéo. */
export function pubHasVideo(pub: Publication): boolean {
  return (pub.media ?? []).some((m) => m.type === 'video');
}

/** Formate une durée en millisecondes (`m:ss`) pour l'affichage. */
export function formatDuration(durationMs?: number): string | null {
  if (!durationMs || durationMs <= 0) return null;
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
