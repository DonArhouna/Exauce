import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui';
import type { AdminOffice, AdminPageDetail, ContentLang, SectionTypeDef, SectionValues } from '@/services/api/types';

interface PagePreviewProps {
  page: AdminPageDetail;
  types: SectionTypeDef[];
  lang: ContentLang;
  offices?: AdminOffice[];
}

/** Texte lisible d'une valeur, jamais de HTML brut. */
function readable(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === 'object' && item !== null
          ? Object.values(item as SectionValues).filter(Boolean).join(' — ')
          : String(item),
      )
      .join(' · ');
  }
  return typeof value === 'string' ? value : '';
}

function SectionPreviewContent({
  sectionType,
  values,
  lang,
  offices,
}: {
  sectionType: string;
  values: SectionValues;
  lang: ContentLang;
  offices?: AdminOffice[];
}) {
  if (sectionType === 'modes') {
    const items = Array.isArray(values.items) ? (values.items as SectionValues[]) : [];
    return (
      <>
        <h4 className="font-semibold text-ink">{readable(values.title)}</h4>
        <ol className="mt-2 grid gap-2 md:grid-cols-3">
          {items.map((item, index) => (
            <li key={`${index}-${readable(item.title)}`} className="rounded-control border border-line p-2">
              <p className="font-medium text-ink">{readable(item.title)}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{readable(item.text)}</p>
            </li>
          ))}
        </ol>
      </>
    );
  }
  if (sectionType === 'what_we_do') {
    return (
      <div className="mt-1 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{readable(values.kicker)}</p>
        <p className="whitespace-pre-wrap text-sm text-ink">{readable(values.text)}</p>
      </div>
    );
  }
  if (sectionType === 'founder_card') {
    return (
      <article className="mt-1 rounded-card border border-line bg-white p-4">
        <figure>
          <div role="img" aria-label={readable(values.photo_alt)} className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-line text-xl text-muted">AK</div>
          <figcaption>
            <h4 className="mt-3 font-semibold text-ink">{readable(values.name)}</h4>
            <p className="text-sm text-muted">{readable(values.role)}</p>
          </figcaption>
        </figure>
        <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{readable(values.empty_text)}</p>
      </article>
    );
  }
  if (sectionType === 'steps') {
    const items = Array.isArray(values.items) ? (values.items as SectionValues[]) : [];
    return (
      <>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">{readable(values.kicker)}</p>
        <ol className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${index}-${readable(item.title)}`} className="flex gap-3 rounded-control border border-line p-3">
              <span className="text-muted" aria-hidden="true">✓</span>
              <div>
                <h4 className="font-semibold text-ink">{readable(item.title)}</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{readable(item.text)}</p>
              </div>
            </li>
          ))}
        </ol>
      </>
    );
  }
  if (sectionType === 'values_grid') {
    return (
      <div className="mt-1 rounded-card border border-dashed border-line bg-white p-4">
        <h4 className="font-semibold text-ink">{readable(values.title)}</h4>
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{readable(values.empty_text)}</p>
      </div>
    );
  }
  if (sectionType === 'interventions_compare') {
    const rows = Array.isArray(values.rows) ? (values.rows as SectionValues[]) : [];
    const columns = lang === 'fr' ? ['Récurrentes', 'Ponctuelles'] : ['Recurring', 'One-off'];
    return (
      <>
        <h4 className="mt-1 font-semibold text-ink">{readable(values.title)}</h4>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-ink text-white">
                <th className="p-2">{readable(values.head_label)}</th>
                {columns.map((column) => <th key={column} className="p-2">{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${index}-${readable(row.label)}`} className={index % 2 === 0 ? 'bg-white' : 'bg-ivory'}>
                  <th className="border-t border-line p-2 font-medium text-ink">{readable(row.label)}</th>
                  <td className="border-t border-line p-2 text-ink">{readable(row.recurring)}</td>
                  <td className="border-t border-line p-2 text-ink">{readable(row.oneoff)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">{readable(values.caption)}</p>
      </>
    );
  }
  if (sectionType === 'contact_form') {
    return (
      <div className="mt-1 space-y-3 rounded-control border border-line bg-white p-3">
        <p className="text-xs uppercase tracking-wide text-muted">{lang === 'fr' ? 'Formulaire de contact' : 'Contact form'}</p>
        <div className="grid gap-2 sm:grid-cols-2" aria-hidden="true">
          {(lang === 'fr' ? ['Nom complet', 'Adresse e-mail', 'Téléphone', 'Sujet', 'Message'] : ['Full name', 'Email address', 'Phone', 'Subject', 'Message']).map((label) => (
            <div key={label} className="rounded-control border border-line bg-ivory/50 px-2 py-2 text-xs text-muted">{label}</div>
          ))}
        </div>
        <p className="border-l-2 border-turquoise-500 bg-turquoise-500/5 p-2 text-sm text-ink">
          <span className="mr-1 text-xs font-semibold uppercase text-muted">{lang === 'fr' ? 'Après envoi :' : 'After submission:'}</span>
          {readable(values.success_text)}
        </p>
      </div>
    );
  }
  if (sectionType === 'offices_grid') {
    const orderedOffices = [...(offices ?? [])].filter((office) => office.is_active).sort((a, b) => a.position - b.position);
    return (
      <>
        <h4 className="mt-1 font-semibold text-ink">{readable(values.title)}</h4>
        <p className="mt-1 text-sm text-muted">{readable(values.intro)}</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {orderedOffices.map((office) => (
            <article key={office.id} className="rounded-control border border-line bg-white p-3">
              <h5 className="font-medium text-ink">{office.translations[lang].name}</h5>
              <p className="text-sm text-muted">{office.translations[lang].city}</p>
              <p className="mt-2 text-xs text-muted">{readable(values.empty_text)}</p>
            </article>
          ))}
          {orderedOffices.length === 0 ? (
            <p className="rounded-control border border-line p-3 text-sm text-muted">{readable(values.empty_text)}</p>
          ) : null}
          <div role="img" aria-label={readable(values.map_empty_text)} className="flex min-h-28 items-center justify-center rounded-control border-2 border-dashed border-line bg-ink text-center text-sm text-white">
            {readable(values.map_empty_text)}
          </div>
        </div>
      </>
    );
  }
  return (
    <div className="mt-1 space-y-0.5">
      {Object.entries(values)
        .map(([key, value]) => ({ key, text: readable(value) }))
        .filter((entry) => entry.text)
        .map((entry) => (
          <p key={`${lang}-${entry.key}`} className="truncate text-sm text-ink">
            {entry.text}
          </p>
        ))}
    </div>
  );
}

/** Aperçu structurel : ordre des blocs et textes de la langue d'édition. */
export function PagePreview({ page, types, lang, offices }: PagePreviewProps) {
  const { t } = useTranslation();
  const active = page.sections.filter((section) => section.is_active);

  return (
    <div className="space-y-3 rounded-card border border-line bg-ivory/50 p-3" data-testid="page-preview">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-ink">{t('pages.preview.title')}</h2>
        <Badge tone="info">{lang.toUpperCase()}</Badge>
        <span className="text-xs text-muted">
          {t('pages.preview.activeCount', { count: active.length })}
        </span>
      </header>
      {page.template !== 'home' ? (
        <section
          className="rounded-control border border-line bg-surface px-3 py-2"
          data-testid="page-preview-heading"
        >
          <h3 className="font-semibold text-ink">{page.title[lang]}</h3>
          {page.intro[lang] ? <p className="mt-1 text-sm text-muted">{page.intro[lang]}</p> : null}
        </section>
      ) : null}
      {active.length === 0 ? (
        <p className="text-sm text-muted">{t('pages.preview.empty')}</p>
      ) : (
        <ol className="space-y-2">
          {active.map((section) => {
            const type = types.find((item) => item.code === section.section_type);
            const values = section.data[lang] ?? {};
            return (
              <li
                key={section.id}
                className="rounded-control border border-line bg-surface px-3 py-2"
                data-testid={`preview-section-${section.id}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {section.position}. {type ? t(type.labelKey) : section.section_type}
                </p>
                <SectionPreviewContent sectionType={section.section_type} values={values} lang={lang} offices={offices} />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
