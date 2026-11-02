import { useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, ImageOff, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Lang } from '@/i18n';
import { MEDIA_LANGS, missingAltLangs, moveItem, type GalleryItem } from '@/lib/media';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface MediaGalleryProps {
  label: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  languages?: readonly Lang[];
}

/**
 * Galerie ordonnable : boutons Monter/Descendre (clavier et lecteur d'écran),
 * glisser-déposer en complément, et annonce vocale de la nouvelle position.
 */
export function MediaGallery({
  label,
  hint,
  error,
  disabled,
  items,
  onChange,
  languages = MEDIA_LANGS,
}: MediaGalleryProps) {
  const { t } = useTranslation();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const headingId = 'gallery-label';

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    onChange(moveItem(items, from, to));
    setAnnouncement(t('gallery.moved', { position: to + 1, total: items.length }));
  }

  function remove(index: number) {
    onChange(items.filter((_, position) => position !== index));
    setAnnouncement(t('gallery.removed', { total: items.length - 1 }));
  }

  const incomplete = items.filter((item) => missingAltLangs(item, languages).length > 0).length;

  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id={headingId} className="text-sm font-medium text-ink">
          {label}
        </h3>
        <span className="text-xs text-muted">{t('gallery.count', { count: items.length })}</span>
      </div>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-status-danger">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="flex items-center gap-2 rounded-panel border border-dashed border-line bg-ivory/60 px-3 py-2.5 text-xs text-muted">
          <ImageOff className="h-4 w-4" aria-hidden="true" />
          {t('gallery.empty')}
        </p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, index) => {
            const missing = missingAltLangs(item, languages);
            const imageAlt = item.alt[languages[0]] ?? '';
            return (
              <li
                key={item.key}
                draggable={!disabled}
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedIndex !== null) move(draggedIndex, index);
                  setDraggedIndex(null);
                }}
                onDragEnd={() => setDraggedIndex(null)}
                className="flex items-center gap-3 rounded-panel border border-line bg-surface p-2"
              >
                <span
                  className="grid h-8 w-6 shrink-0 place-items-center text-slate-400"
                  aria-hidden="true"
                  title={t('gallery.dragHint')}
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                {item.kind === 'image' ? (
                  <img src={item.url} alt="" className="h-12 w-16 shrink-0 rounded-control border border-line object-cover" />
                ) : (
                  <span className="grid h-12 w-16 shrink-0 place-items-center rounded-control border border-line bg-ivory text-slate-500">
                    <ImageOff className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    <span className="text-muted">{index + 1}.</span> {imageAlt || item.name || item.id}
                  </p>
                  {missing.length > 0 ? (
                    <Badge tone="warning" className="mt-1">
                      {t('media.alt.missing', { count: missing.length })}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled || index === 0}
                    aria-label={t('gallery.moveUp', { position: index + 1 })}
                    onClick={() => move(index, index - 1)}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled || index === items.length - 1}
                    aria-label={t('gallery.moveDown', { position: index + 1 })}
                    onClick={() => move(index, index + 1)}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    aria-label={t('gallery.remove', { position: index + 1 })}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {incomplete > 0 ? (
        <Alert tone="warning" title={t('media.alt.publishBlocked', { count: incomplete })} />
      ) : null}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
