import { Save, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Field, Input, Textarea } from '@/components/ui';
import { patchPageContent, patchPageSeo } from '@/services/api/endpoints/pages';
import { ApiError } from '@/services/api/problem';
import type { AdminPageDetail, ContentLang } from '@/services/api/types';
import { useEditionLanguage } from '@/services/edition/useEditionLanguage';

const LANGS: ContentLang[] = ['fr', 'en'];

type PageValues = Pick<AdminPageDetail, 'title' | 'nav_label' | 'intro' | 'seo_title' | 'seo_description'>;

interface PagePanelProps {
  page: AdminPageDetail;
  canEditContent: (lang: ContentLang) => boolean;
  canEditSeo: (lang: ContentLang) => boolean;
  onSaved: (page: AdminPageDetail) => void;
  onDirtyChange: (id: string, dirty: boolean) => void;
  onConflict: () => void;
}

function clonePage(page: AdminPageDetail): PageValues {
  return {
    title: { ...page.title },
    nav_label: { ...page.nav_label },
    intro: { ...page.intro },
    seo_title: { ...page.seo_title },
    seo_description: { ...page.seo_description },
  };
}

/** Métadonnées de page en colonnes FR/EN, avec permissions distinctes pour SEO. */
export function PagePanel({
  page,
  canEditContent,
  canEditSeo,
  onSaved,
  onDirtyChange,
  onConflict,
}: PagePanelProps) {
  const { t } = useTranslation();
  const { lang: editionLang } = useEditionLanguage();
  const [values, setValues] = useState(() => clonePage(page));
  const [saving, setSaving] = useState<ContentLang | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    setValues(clonePage(page));
    setProblem(null);
  }, [page.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const introDisplayed = Boolean(page.intro.fr.trim() || page.intro.en.trim());
  const contentDirty = (language: ContentLang) =>
    canEditContent(language) &&
    (values.title[language] !== page.title[language] ||
      values.nav_label[language] !== page.nav_label[language] ||
      (introDisplayed && values.intro[language] !== page.intro[language]));
  const seoDirty = (language: ContentLang) =>
    canEditSeo(language) &&
    (values.seo_title[language] !== page.seo_title[language] ||
      values.seo_description[language] !== page.seo_description[language]);
  const dirty = LANGS.some((language) => contentDirty(language) || seoDirty(language));

  useEffect(() => {
    onDirtyChange('page', dirty);
  }, [dirty, onDirtyChange]);

  const update = (field: keyof PageValues, language: ContentLang, value: string) => {
    setValues((current) => {
      switch (field) {
        case 'title':
          return { ...current, title: { ...current.title, [language]: value } };
        case 'nav_label':
          return { ...current, nav_label: { ...current.nav_label, [language]: value } };
        case 'intro':
          return { ...current, intro: { ...current.intro, [language]: value } };
        case 'seo_title':
          return { ...current, seo_title: { ...current.seo_title, [language]: value } };
        case 'seo_description':
          return { ...current, seo_description: { ...current.seo_description, [language]: value } };
      }
    });
  };

  const reset = (language: ContentLang) => {
    setValues((current) => ({
      ...current,
      title: { ...current.title, [language]: page.title[language] },
      nav_label: { ...current.nav_label, [language]: page.nav_label[language] },
      intro: { ...current.intro, [language]: page.intro[language] },
      seo_title: { ...current.seo_title, [language]: page.seo_title[language] },
      seo_description: { ...current.seo_description, [language]: page.seo_description[language] },
    }));
    setProblem(null);
  };

  const save = async (language: ContentLang) => {
    const contentChanged = contentDirty(language);
    const seoChanged = seoDirty(language);
    if (!contentChanged && !seoChanged) return;

    setSaving(language);
    setProblem(null);
    let revision = page.revision;
    try {
      if (contentChanged) {
        const patch = { revision } as { revision: number; title?: string; nav_label?: string; intro?: string };
        if (values.title[language] !== page.title[language]) patch.title = values.title[language];
        if (values.nav_label[language] !== page.nav_label[language]) {
          patch.nav_label = values.nav_label[language];
        }
        if (introDisplayed && values.intro[language] !== page.intro[language]) {
          patch.intro = values.intro[language];
        }
        const updated = await patchPageContent(page.id, language, patch);
        revision = updated.revision;
        onSaved(updated);
      }
      if (seoChanged) {
        const patch = { revision } as { revision: number; seo_title?: string; seo_description?: string };
        if (values.seo_title[language] !== page.seo_title[language]) {
          patch.seo_title = values.seo_title[language];
        }
        if (values.seo_description[language] !== page.seo_description[language]) {
          patch.seo_description = values.seo_description[language];
        }
        const updated = await patchPageSeo(page.id, language, patch);
        onSaved(updated);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        onConflict();
        return;
      }
      setProblem(t('pages.panel.saveError'));
      return;
    } finally {
      setSaving(null);
    }
  };

  return (
    <section
      className="space-y-3 rounded-card border border-line bg-surface p-3"
      data-testid="page-panel"
    >
      <header>
        <h2 className="text-sm font-semibold text-ink">{t('pages.panel.title')}</h2>
        <p className="mt-1 text-xs text-muted">{t('pages.panel.subtitle')}</p>
      </header>

      <div className="grid gap-3 lg:grid-cols-2">
        {LANGS.map((language) => {
          const contentEditable = canEditContent(language);
          const seoEditable = canEditSeo(language);
          const languageDirty = contentDirty(language) || seoDirty(language);
          const prefix = `page-${page.id}-${language}`;
          return (
            <section
              key={language}
              aria-label={t('pages.langColumn', { lang: language.toUpperCase() })}
              className="space-y-3 rounded-control border border-line/70 p-3"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t('pages.langColumn', { lang: language.toUpperCase() })}
                </h3>
                {editionLang === language ? <Badge tone="info">{t('pages.editing')}</Badge> : null}
              </div>

              <section className="space-y-2" aria-label={t('pages.panel.contentTitle')}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">
                  {t('pages.panel.contentTitle')}
                </h4>
                {!contentEditable ? (
                  <Alert tone="info" title={t('pages.readOnly')} description={t('pages.panel.contentLocked')} />
                ) : null}
                <Field id={`${prefix}-title`} label={t('pages.panel.fields.title')}>
                  <Input
                    id={`${prefix}-title`}
                    value={values.title[language]}
                    disabled={!contentEditable}
                    onChange={(event) => update('title', language, event.target.value)}
                  />
                </Field>
                <Field id={`${prefix}-nav-label`} label={t('pages.panel.fields.navLabel')}>
                  <Input
                    id={`${prefix}-nav-label`}
                    value={values.nav_label[language]}
                    disabled={!contentEditable}
                    onChange={(event) => update('nav_label', language, event.target.value)}
                  />
                </Field>
                {introDisplayed ? (
                  <Field id={`${prefix}-intro`} label={t('pages.panel.fields.intro')}>
                    <Textarea
                      id={`${prefix}-intro`}
                      rows={3}
                      value={values.intro[language]}
                      disabled={!contentEditable}
                      onChange={(event) => update('intro', language, event.target.value)}
                    />
                  </Field>
                ) : null}
              </section>

              <section className="space-y-2 border-t border-line/70 pt-3" aria-label={t('pages.panel.seoTitle')}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">
                  {t('pages.panel.seoTitle')}
                </h4>
                {!seoEditable ? (
                  <Alert tone="info" title={t('pages.readOnly')} description={t('pages.panel.seoLocked')} />
                ) : null}
                <Field id={`${prefix}-seo-title`} label={t('pages.panel.fields.seoTitle')}>
                  <Input
                    id={`${prefix}-seo-title`}
                    value={values.seo_title[language]}
                    placeholder={t('pages.panel.toConfirm')}
                    disabled={!seoEditable}
                    onChange={(event) => update('seo_title', language, event.target.value)}
                  />
                </Field>
                <Field id={`${prefix}-seo-description`} label={t('pages.panel.fields.seoDescription')}>
                  <Textarea
                    id={`${prefix}-seo-description`}
                    rows={3}
                    value={values.seo_description[language]}
                    placeholder={t('pages.panel.toConfirm')}
                    disabled={!seoEditable}
                    onChange={(event) => update('seo_description', language, event.target.value)}
                  />
                </Field>
              </section>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  isLoading={saving === language}
                  disabled={!languageDirty || saving !== null}
                  onClick={() => void save(language)}
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('pages.panel.save', { lang: language.toUpperCase() })}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!languageDirty || saving !== null}
                  onClick={() => reset(language)}
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('pages.panel.discard')}
                </Button>
                {languageDirty ? (
                  <span className="text-xs font-medium text-status-warning">
                    {t('pages.form.unsaved')}
                  </span>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      {problem ? <Alert tone="danger" title={problem} /> : null}
    </section>
  );
}
