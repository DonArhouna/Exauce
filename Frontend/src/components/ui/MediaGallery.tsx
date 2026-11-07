import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X, Maximize2, Play } from 'lucide-react';
import type { PublicationMedia } from '@/types/content';
import type { Lang } from '@/types/content';
import { VideoPlayer } from './VideoPlayer';

interface MediaGalleryProps {
  media: PublicationMedia[];
  lang: Lang;
}

/**
 * Galerie médias pour les publications.
 * - Navigation précédent/suivant (clavier + boutons) circulaire
 * - Miniatures cliquables + indicateur "N / Total"
 * - Lightbox avec focus piégé, aria-modal, Échap pour fermer
 * - aria-live="polite" pour annonces de changement
 * - Support images et vidéos (VideoPlayer)
 * - Si 1 seul média : pas de navigation précédent/suivant
 */
export function MediaGallery({ media, lang: l }: MediaGalleryProps) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const total = media.length;
  const item = media[current];
  const caption = item?.caption?.[l];

  const goTo = useCallback(
    (index: number) => {
      const next = ((index % total) + total) % total;
      setCurrent(next);
      if (liveRef.current) {
        liveRef.current.textContent = t('publications.mediaAnnounce', {
          current: next + 1,
          total,
        });
      }
    },
    [total, t],
  );

  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);
  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);

  // Keyboard navigation in gallery
  useEffect(() => {
    if (lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, goNext, goPrev]);

  // Lightbox keyboard + focus trap
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
        openBtnRef.current?.focus();
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'Tab') {
        // Focus trap
        const focusable = lightboxRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    // Auto-focus first button in lightbox
    lightboxRef.current?.querySelector<HTMLElement>('button')?.focus();
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, goNext, goPrev]);

  if (total === 0) return null;

  return (
    <div className="mt-10 space-y-4">
      {/* aria-live region (visually hidden) */}
      <p
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Main display area */}
      <div className="relative overflow-hidden rounded-card bg-slate-900">
        {/* Media */}
        <div className="relative aspect-video w-full">
          {item.type === 'image' ? (
            <img
              src={item.src}
              alt={item.alt?.[l] ?? ''}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <VideoPlayer media={item} lang={l} className="h-full w-full" />
          )}

          {/* Open lightbox button */}
          <button
            ref={openBtnRef}
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={t('publications.openLightbox')}
            className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/80"
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Nav prev/next (only when multiple media) */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label={t('publications.prevMedia')}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/80"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={t('publications.nextMedia')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/80"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        {/* Caption */}
        {caption && (
          <p className="px-4 py-2 text-center text-xs text-slate-300">
            <span className="sr-only">{t('publications.imageCaption')} : </span>
            {caption}
          </p>
        )}
      </div>

      {/* Indicator + thumbnails (only when multiple) */}
      {total > 1 && (
        <div className="flex flex-col items-center gap-3">
          {/* Counter */}
          <p className="text-xs text-slate-500" aria-hidden="true">
            {t('publications.mediaOf', { current: current + 1, total })}
          </p>

          {/* Thumbnails */}
          <div
            className="flex flex-wrap justify-center gap-2"
            role="group"
            aria-label={t('publications.thumbnails')}
          >
            {media.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={t('publications.goToMedia', { n: i + 1 })}
                aria-pressed={i === current}
                className={`relative h-14 w-20 overflow-hidden rounded border-2 transition-all ${
                  i === current
                    ? 'border-turquoise-500 opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-90'
                }`}
              >
                {m.type === 'image' ? (
                  <img
                    src={m.src}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-slate-800">
                    {m.poster ? (
                      <img
                        src={m.poster}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Play className="h-5 w-5 text-white" aria-hidden="true" />
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('publications.openLightbox')}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => {
              setLightboxOpen(false);
              openBtnRef.current?.focus();
            }}
            aria-label={t('publications.closeLightbox')}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/30"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Content */}
          <div className="relative max-h-[90vh] max-w-5xl w-full mx-4">
            {item.type === 'image' ? (
              <img
                src={item.src}
                alt={item.alt?.[l] ?? ''}
                className="max-h-[85vh] w-full object-contain"
              />
            ) : (
              <VideoPlayer media={item} lang={l} className="w-full" />
            )}

            {/* Caption */}
            {caption && (
              <p className="mt-3 text-center text-sm text-slate-300">
                {caption}
              </p>
            )}
          </div>

          {/* Nav in lightbox (only when multiple) */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label={t('publications.prevMedia')}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/30"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={t('publications.nextMedia')}
                className="absolute right-16 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/30"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>

              {/* Counter in lightbox */}
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1 text-sm text-white">
                {t('publications.mediaOf', { current: current + 1, total })}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
