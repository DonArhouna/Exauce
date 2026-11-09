import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, ImageOff, RefreshCw, Search, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/services/api/problem';
import { listMedia, uploadMedia } from '@/services/api/endpoints/media';
import type { MediaItem, MediaKind } from '@/services/api/types';
import type { Lang } from '@/i18n';
import {
  ACCEPTED_MIME,
  MEDIA_LANGS,
  formatFileSize,
  kindForMime,
  missingAltLangs,
  requiresAlt,
  toMediaSelection,
  type MediaSelection,
} from '@/lib/media';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

export interface MediaPickerProps {
  id: string;
  label: string;
  hint?: string;
  /** Erreur de formulaire (prioritaire sur les erreurs internes). */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  value: MediaSelection | null;
  onChange: (value: MediaSelection | null) => void;
  /** Langues d'édition pour le texte alternatif. */
  languages?: readonly Lang[];
  /** Type attendu : une image par défaut. */
  accept?: MediaKind;
}

/**
 * Choix d'un média dans la médiathèque ou téléversement, avec aperçu et texte
 * alternatif obligatoire par langue d'édition (sauf image décorative explicite).
 */
export function MediaPicker({
  id,
  label,
  hint,
  error,
  required,
  disabled,
  value,
  onChange,
  languages = MEDIA_LANGS,
  accept = 'image',
}: MediaPickerProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const searchId = useId();
  const fileId = useId();

  const library = useQuery({
    queryKey: ['media', accept, search],
    queryFn: () => listMedia({ kind: accept, search: search.trim() || undefined, limit: 24 }),
    enabled: open,
  });

  const missing = value ? missingAltLangs(value, languages) : [];
  const altRequired = value ? requiresAlt(value) : false;

  function update(next: Partial<MediaSelection>) {
    if (!value) return;
    onChange({ ...value, ...next });
  }

  function select(item: MediaItem) {
    const selection = toMediaSelection(item, languages);
    onChange({ ...selection, alt: { ...selection.alt, ...value?.alt } });
    setOpen(false);
    setUploadError(null);
  }

  function uploadErrorMessage(cause: unknown): string {
    if (cause instanceof ApiError) {
      const reason = cause.problem.errors?.[0]?.code;
      if (reason === 'MIME_NOT_ALLOWED') return t('media.errors.mime');
      if (reason === 'TOO_LARGE') return t('media.errors.size');
      if (reason === 'INFECTED') return t('media.errors.infected');
      if (cause.status === 0) return t('errors.network');
      return cause.problem.detail ?? t('media.errors.upload');
    }
    return t('media.errors.upload');
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    const kind = kindForMime(file.type);
    if (!kind || kind !== accept) {
      setUploadError(t('media.errors.mime'));
      return;
    }
    setProgress(0);
    try {
      const item = await uploadMedia(file, { kind, onProgress: setProgress });
      await library.refetch();
      select(item);
    } catch (cause) {
      setUploadError(uploadErrorMessage(cause));
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span id={`${id}-label`} className="block text-sm font-medium text-ink">
          {label}
          {required ? (
            <span className="ml-1 text-status-danger" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
        {value ? (
          <Button variant="link" size="sm" onClick={() => setOpen(true)} disabled={disabled}>
            {t('media.picker.replace')}
          </Button>
        ) : null}
      </div>

      <div
        id={id}
        role="group"
        aria-labelledby={`${id}-label`}
        className={cn(
          'rounded-panel border border-dashed border-line bg-ivory/60 p-3',
          error && 'border-status-danger',
        )}
      >
        {value ? (
          <div className="flex items-start gap-3">
            {value.kind === 'image' ? (
              <img
                src={value.url}
                alt={value.alt[i18n.language as Lang] ?? ''}
                className="h-20 w-28 shrink-0 rounded-control border border-line object-cover"
              />
            ) : (
              <span className="grid h-20 w-28 shrink-0 place-items-center rounded-control border border-line bg-surface text-slate-500">
                <FileText className="h-6 w-6" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{value.name || value.id}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge tone="neutral">{t(`media.kind.${value.kind}`)}</Badge>
                <span className="text-xs text-muted">{value.mime || t('media.unknownType')}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => onChange(null)}
                disabled={disabled}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t('media.picker.remove')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setOpen(true)} disabled={disabled}>
              <ImageOff className="h-4 w-4" aria-hidden="true" />
              {t('media.picker.choose')}
            </Button>
            <span className="text-xs text-muted">{t('media.picker.empty')}</span>
          </div>
        )}
      </div>

      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs font-medium text-status-danger">
          {error}
        </p>
      ) : null}

      {value && altRequired ? (
        <div className="space-y-2 rounded-panel border border-line bg-surface p-3">
          <fieldset>
            <legend className="text-sm font-medium text-ink">{t('media.alt.legend')}</legend>
            <p className="text-xs text-muted">{t('media.alt.hint')}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {languages.map((lang) => {
                const fieldId = `${id}-alt-${lang}`;
                const invalid = missing.includes(lang);
                return (
                  <div key={lang} className="space-y-1">
                    <label htmlFor={fieldId} className="block text-xs font-medium text-slate-600">
                      {t('media.alt.label', { language: t(`language.${lang}`) })}
                      <span className="ml-1 text-status-danger" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <Input
                      id={fieldId}
                      value={value.alt[lang] ?? ''}
                      invalid={invalid}
                      disabled={disabled}
                      onChange={(event) => update({ alt: { ...value.alt, [lang]: event.target.value } })}
                    />
                    {invalid ? (
                      <p role="alert" className="text-xs font-medium text-status-danger">
                        {t('media.alt.required', { language: t(`language.${lang}`) })}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </fieldset>
          <label className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-line"
              checked={value.decorative}
              disabled={disabled}
              onChange={(event) => update({ decorative: event.target.checked })}
            />
            <span>
              {t('media.alt.decorative')}
              <span className="block text-xs text-muted">{t('media.alt.decorativeHint')}</span>
            </span>
          </label>
        </div>
      ) : null}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setUploadError(null);
        }}
        title={t('media.picker.title')}
        description={t('media.picker.description')}
        size="lg"
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1 space-y-1">
              <label htmlFor={searchId} className="block text-xs font-medium text-slate-600">
                {t('media.picker.search')}
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <Input
                  id={searchId}
                  className="pl-8"
                  value={search}
                  placeholder={t('media.picker.searchPlaceholder')}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor={fileId} className="block text-xs font-medium text-slate-600">
                {t('media.picker.upload')}
              </label>
              <input
                id={fileId}
                type="file"
                accept={ACCEPTED_MIME[accept].join(',')}
                className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-control file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink"
                onChange={(event) => {
                  void handleFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </div>
          </div>

          <p className="text-xs text-muted">
            {t('media.picker.accepted', {
              types: ACCEPTED_MIME[accept].map((mime) => mime.split('/')[1]?.toUpperCase()).join(', '),
              size: formatFileSize(10 * 1024 * 1024, i18n.language),
            })}
          </p>

          {progress !== null ? (
            <div className="space-y-1">
              <progress
                value={progress}
                max={100}
                aria-label={t('media.picker.progress')}
                className="h-2 w-full overflow-hidden rounded-full"
              />
              <p className="text-xs text-muted">{t('media.picker.progressValue', { value: progress })}</p>
            </div>
          ) : null}

          {uploadError ? <Alert tone="danger" title={t('media.picker.uploadFailed')} description={uploadError} /> : null}

          {library.isLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted">
              <Spinner /> {t('common.loading')}
            </div>
          ) : null}

          {library.isError ? (
            <Alert
              tone="danger"
              title={t('media.picker.loadFailed')}
              description={t('common.unknownError')}
            >
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => void library.refetch()}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                {t('common.retry')}
              </Button>
            </Alert>
          ) : null}

          {library.data && library.data.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t('media.picker.noResult')}</p>
          ) : null}

          {library.data && library.data.items.length > 0 ? (
            <ul className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {library.data.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => select(item)}
                    aria-pressed={value?.id === item.id}
                    className="w-full rounded-panel border border-line bg-surface p-2 text-left hover:border-turquoise-400 focus-visible:ring-2 focus-visible:ring-turquoise-600 aria-pressed:border-turquoise-500 aria-pressed:ring-1 aria-pressed:ring-turquoise-500"
                  >
                    {item.kind === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.alt ?? ''}
                        className="mb-1.5 h-20 w-full rounded-control object-cover"
                      />
                    ) : (
                      <span className="mb-1.5 grid h-20 w-full place-items-center rounded-control bg-ivory text-slate-500">
                        <FileText className="h-6 w-6" aria-hidden="true" />
                      </span>
                    )}
                    <span className="block truncate text-xs font-medium text-ink">
                      {item.alt ?? item.storage_key?.split('/').pop() ?? item.id}
                    </span>
                    <span className="block text-[11px] text-muted">{formatFileSize(item.size_bytes ?? 0, i18n.language)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              {t('media.picker.uploadHint')}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
