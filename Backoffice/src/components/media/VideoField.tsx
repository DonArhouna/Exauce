import { Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MEDIA_LANGS, parseVideoUrl, type LocalizedText, type VideoValue } from '@/lib/media';
import type { Lang } from '@/i18n';
import { Input, Textarea } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface VideoFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  value: VideoValue;
  onChange: (value: VideoValue) => void;
  languages?: readonly Lang[];
}

const EMPTY: LocalizedText = {};

/**
 * Lien vidéo externe : seuls YouTube et Vimeo sont acceptés. Aperçu intégré,
 * légende et transcription par langue d'édition.
 */
export function VideoField({
  id,
  label,
  hint,
  error,
  required,
  disabled,
  value,
  onChange,
  languages = MEDIA_LANGS,
}: VideoFieldProps) {
  const { t } = useTranslation();
  const parsed = parseVideoUrl(value.url);
  const invalidUrl = value.url.trim().length > 0 && !parsed;

  function update(patch: Partial<VideoValue>) {
    onChange({ ...value, ...patch });
  }

  function updateText(field: 'caption' | 'transcription', lang: Lang, text: string) {
    const current = value[field] ?? EMPTY;
    update({ [field]: { ...current, [lang]: text } } as Partial<VideoValue>);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
          {required ? (
            <span className="ml-1 text-status-danger" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        <Input
          id={id}
          value={value.url}
          invalid={invalidUrl || Boolean(error)}
          disabled={disabled}
          placeholder={t('video.urlPlaceholder')}
          aria-describedby={invalidUrl ? `${id}-url-error` : hint ? `${id}-hint` : undefined}
          onChange={(event) => update({ url: event.target.value })}
        />
        {invalidUrl ? (
          <p id={`${id}-url-error`} role="alert" className="text-xs font-medium text-status-danger">
            {t('video.errors.invalid')}
          </p>
        ) : null}
        {hint && !invalidUrl && !error ? (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-xs font-medium text-status-danger">
            {error}
          </p>
        ) : null}
      </div>

      {parsed ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge tone="info">{t(`video.provider.${parsed.provider}`)}</Badge>
            <span className="text-xs text-muted">{t('video.preview')}</span>
          </div>
          <div className={cn('overflow-hidden rounded-panel border border-line bg-ink/90')}>
            <iframe
              src={parsed.embedUrl}
              title={value.caption?.[languages[0]] || t('video.previewTitle', { provider: t(`video.provider.${parsed.provider}`) })}
              className="aspect-video w-full"
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-xs text-muted">{t('video.privacy')}</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-panel border border-dashed border-line bg-ivory/60 px-3 py-2.5 text-xs text-muted">
          <Video className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('video.emptyPreview')}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {languages.map((lang) => {
          const captionId = `${id}-caption-${lang}`;
          const transcriptionId = `${id}-transcription-${lang}`;
          return (
            <div key={lang} className="space-y-2 rounded-panel border border-line bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t(`language.${lang}`)}</p>
              <div className="space-y-1">
                <label htmlFor={captionId} className="block text-xs font-medium text-slate-600">
                  {t('video.captionFor', { language: t(`language.${lang}`) })}
                </label>
                <Input
                  id={captionId}
                  value={value.caption?.[lang] ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateText('caption', lang, event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor={transcriptionId} className="block text-xs font-medium text-slate-600">
                  {t('video.transcriptionFor', { language: t(`language.${lang}`) })}
                </label>
                <Textarea
                  id={transcriptionId}
                  value={value.transcription?.[lang] ?? ''}
                  disabled={disabled}
                  placeholder={t('video.transcriptionPlaceholder')}
                  onChange={(event) => updateText('transcription', lang, event.target.value)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
