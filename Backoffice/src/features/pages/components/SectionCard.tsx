import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Lock, Save, Trash2, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, StatusPill } from '@/components/ui';
import { patchSection } from '@/services/api/endpoints/pages';
import { ApiError } from '@/services/api/problem';
import type {
  AdminPageDetail,
  AdminSection,
  ContentLang,
  SectionTypeDef,
  SectionValues,
} from '@/services/api/types';
import { useEditionLanguage } from '@/services/edition/useEditionLanguage';
import { completeness, deepEqual, validateValues, type SectionErrors } from '../validation';
import { SectionFieldControl } from './SectionFieldControl';

const LANGS: ContentLang[] = ['fr', 'en'];

interface SectionCardProps {
  section: AdminSection;
  type?: SectionTypeDef;
  index: number;
  total: number;
  revision: number;
  canEdit: (lang: ContentLang) => boolean;
  canToggle: boolean;
  canDelete: boolean;
  onSaved: (page: AdminPageDetail) => void;
  onDirtyChange: (id: string, dirty: boolean) => void;
  onConflict: () => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onDragStart: () => void;
  onDrop: () => void;
}

function clone(data: Record<ContentLang, SectionValues>): Record<ContentLang, SectionValues> {
  return { fr: { ...data.fr }, en: { ...data.en } };
}

/** Bloc éditable : formulaire généré depuis le schéma, FR/EN côte à côte. */
export function SectionCard({
  section,
  type,
  index,
  total,
  revision,
  canEdit,
  canToggle,
  canDelete,
  onSaved,
  onDirtyChange,
  onConflict,
  onMove,
  onDelete,
  onToggleActive,
  onDragStart,
  onDrop,
}: SectionCardProps) {
  const { t } = useTranslation();
  const { lang: editionLang } = useEditionLanguage();
  const [values, setValues] = useState(() => clone(section.data));
  const [errors, setErrors] = useState<SectionErrors>({});
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    setValues(clone(section.data));
    setErrors({});
    setProblem(null);
  }, [section.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const editableLangs = LANGS.filter((lang) => canEdit(lang) && type?.editable);
  const dirty = useMemo(
    () => editableLangs.some((lang) => !deepEqual(values[lang], section.data[lang])),
    [editableLangs, values, section.data],
  );

  useEffect(() => {
    onDirtyChange(section.id, dirty);
  }, [dirty, section.id, onDirtyChange]);

  const update = (lang: ContentLang, key: string, next: unknown) => {
    setValues((current) => ({ ...current, [lang]: { ...current[lang], [key]: next } }));
  };

  const reset = () => {
    setValues(clone(section.data));
    setErrors({});
    setProblem(null);
  };

  const save = async () => {
    if (!type) return;
    const found: SectionErrors = {};
    for (const lang of editableLangs) {
      Object.assign(found, validateValues(type, lang, values[lang]));
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setProblem(null);
    let currentRevision = revision;
    try {
      for (const lang of editableLangs) {
        if (deepEqual(values[lang], section.data[lang])) continue;
        const result = await patchSection(section.id, {
          revision: currentRevision,
          lang,
          data: values[lang],
        });
        currentRevision = result.page.revision;
        onSaved(result.page);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          onConflict();
          return;
        }
        if (error.status === 422 && error.problem.errors) {
          const mapped: SectionErrors = {};
          for (const item of error.problem.errors) {
            mapped[item.field] = item.code || item.message;
          }
          setErrors(mapped);
        }
        setProblem(error.problem.detail ?? t('pages.form.saveError'));
        return;
      }
      setProblem(t('pages.form.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const readOnly = !type?.editable || editableLangs.length === 0;
  const typeLabel = type ? t(type.labelKey) : section.section_type;

  return (
    <li
      className="rounded-card border border-line bg-surface shadow-card"
      draggable
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      data-testid={`section-${section.id}`}
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <span className="cursor-grab text-slate-400" aria-hidden="true" title={t('pages.sections.drag')}>
          <GripVertical className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-ink">
          <span className="mr-2 text-xs text-muted">#{section.position}</span>
          {typeLabel}
        </h3>
        <Badge tone="neutral">{section.section_type}</Badge>
        {section.is_active ? null : (
          <StatusPill tone="warning">{t('pages.sections.inactive')}</StatusPill>
        )}
        {!section.is_active ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            {t('pages.sections.hiddenOnSite')}
          </span>
        ) : null}
        {type?.editable
          ? LANGS.map((lang) => {
              const score = completeness(type, values[lang]);
              return (
                <Badge
                  key={lang}
                  tone={score.filled === score.total ? 'success' : 'neutral'}
                  aria-label={t('pages.completeness.label', {
                    lang: lang.toUpperCase(),
                    filled: score.filled,
                    total: score.total,
                  })}
                >
                  {lang.toUpperCase()} {score.filled}/{score.total}
                </Badge>
              );
            })
          : null}

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('pages.sections.moveUp', { name: typeLabel })}
            disabled={index === 0 || !canToggle}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('pages.sections.moveDown', { name: typeLabel })}
            disabled={index === total - 1 || !canToggle}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={section.is_active}
            aria-label={section.is_active ? t('pages.sections.deactivate') : t('pages.sections.activate')}
            disabled={!canToggle}
            onClick={onToggleActive}
          >
            {section.is_active ? (
              <Eye className="h-4 w-4" aria-hidden="true" />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('pages.sections.delete')}
            disabled={!canDelete}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-status-danger" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className="space-y-3 px-3 py-3">
        {readOnly ? (
          <div className="space-y-2">
            <Alert
              tone="info"
              title={t('pages.readOnly')}
              description={type?.editable ? t('pages.section.langLocked') : t('pages.section.notEditable')}
            />
            <dl className="grid gap-2 sm:grid-cols-2">
              {Object.entries(values[editionLang] ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-control bg-ivory/70 px-3 py-2">
                  <dt className="text-xs uppercase tracking-wide text-muted">{key}</dt>
                  <dd className="text-sm text-ink">
                    {Array.isArray(value)
                      ? t('pages.section.listCount', { count: value.length })
                      : String(value ?? '')}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {LANGS.map((lang) => {
              const langEditable = canEdit(lang);
              return (
                <section
                  key={lang}
                  aria-label={t('pages.langColumn', { lang: lang.toUpperCase() })}
                  className="space-y-2 rounded-control border border-line/70 p-3"
                >
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {t('pages.langColumn', { lang: lang.toUpperCase() })}
                    </h4>
                    {editionLang === lang ? (
                      <Badge tone="info">{t('pages.editing')}</Badge>
                    ) : null}
                    {langEditable ? null : (
                      <Badge tone="neutral">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        {t('pages.readOnly')}
                      </Badge>
                    )}
                  </div>
                  {type?.fields.map((field) => (
                    <SectionFieldControl
                      key={field.key}
                      idPrefix={`${section.id}-${lang}`}
                      field={field}
                      value={values[lang][field.key]}
                      disabled={!langEditable}
                      error={errors[`${lang}.${field.key}`]}
                      onChange={(next) => update(lang, field.key, next)}
                    />
                  ))}
                  {!langEditable ? (
                    <p className="text-xs text-muted">{t('pages.section.langLocked')}</p>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}

        {problem ? <Alert tone="danger" title={problem} /> : null}

        {!readOnly ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={save} isLoading={saving} disabled={!dirty}>
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {t('pages.form.save')}
            </Button>
            <Button variant="secondary" size="sm" onClick={reset} disabled={!dirty || saving}>
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('pages.form.reset')}
            </Button>
            {dirty ? (
              <span className="text-xs font-medium text-status-warning">{t('pages.form.unsaved')}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
