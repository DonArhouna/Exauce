import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { formatDuration } from '@/lib/media';
import type { Lang, PublicationVideoMedia } from '@/types/content';

interface VideoPlayerProps {
  media: PublicationVideoMedia;
  lang: Lang;
  className?: string;
}

/**
 * Lecteur vidéo lazy pour les publications.
 * - Affiche le poster (img) avant le clic — aucun autoplay
 * - Au clic : charge le vrai player (iframe YouTube nocookie ou <video>)
 * - Si source externe → iframe avec sandbox approprié
 * - Si source uploaded → <video controls>
 * - Caption sous la vidéo si présent
 */
export function VideoPlayer({ media, lang: l, className = '' }: VideoPlayerProps) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const duration = formatDuration(media.durationMs);

  const handlePlay = () => setPlaying(true);

  return (
    <div className={`relative flex flex-col ${className}`}>
      <div className="relative w-full overflow-hidden rounded-card bg-slate-900 aspect-video">
        {!playing ? (
          /* Poster state */
          <button
            type="button"
            onClick={handlePlay}
            aria-label={t('publications.playVideo')}
            className="group relative flex h-full w-full items-center justify-center"
          >
            {media.poster ? (
              <img
                src={media.poster}
                alt={t('publications.videoPoster')}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-900" />
            )}
            {/* Play overlay */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white transition-transform group-hover:scale-110">
                <Play className="h-7 w-7 translate-x-0.5" aria-hidden="true" />
              </span>
            </span>
            <span className="sr-only">{t('publications.loadVideo')}</span>
            {duration && (
              <span
                aria-hidden="true"
                className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white"
              >
                {duration}
              </span>
            )}
          </button>
        ) : media.source === 'external' ? (
          /* YouTube iframe (nocookie) */
          <iframe
            src={`${media.src}?autoplay=1&rel=0`}
            title={media.caption?.[l] ?? t('publications.playVideo')}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            className="h-full w-full border-0"
          />
        ) : (
          /* Uploaded video */
          <video
            src={media.src}
            controls
            autoPlay
            className="h-full w-full"
            poster={media.poster}
          />
        )}
      </div>

      {/* Caption */}
      {media.caption?.[l] && (
        <p className="mt-2 text-center text-xs text-slate-500">
          <span className="sr-only">{t('publications.imageCaption')} : </span>
          {media.caption[l]}
        </p>
      )}
    </div>
  );
}
