import { BreadcrumbJsonLd } from '@/lib/seo';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Visuel d'une page : bandeau titré (titre + intro + fil d'Ariane). */
export function PageHero({
  title,
  intro,
  crumbs,
  tone = 'dark',
}: {
  title: string;
  intro?: string;
  /** [{ label, href? }] du plus externe au plus profond. */
  crumbs?: { label: string; href?: string }[];
  tone?: 'dark' | 'light';
}) {
  const { t } = useTranslation();
  const dark = tone === 'dark';
  return (
    <>
      <section
        className={cn('relative overflow-hidden py-16 md:py-20', dark ? 'bg-abyss-gradient text-ivory' : 'bg-turquoise-500/10 text-ink')}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          {crumbs && crumbs.length > 0 && <Breadcrumbs crumbs={[{ label: t('nav.home') }, ...crumbs]} tone={tone} />}
          <h1 className={cn('mt-6 font-display text-display-xl', dark ? 'text-ivory' : 'text-ink')}>{title}</h1>
          {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">{intro}</p>}
        </div>
      </section>
      <BreadcrumbJsonLd items={crumbs} />
    </>
  );
}

function Breadcrumbs({ crumbs, tone }: { crumbs: { label: string; href?: string }[]; tone: 'dark' | 'light' }) {
  return (
    <nav aria-label="Fil d’Ariane" className="text-xs">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className={cn('h-3 w-3', tone === 'dark' ? 'text-white/30' : 'text-ink/30')} aria-hidden="true" />
            )}
            {c.href ? (
              <Link to={c.href} className="transition-colors hover:text-turquoise-400">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className={tone === 'dark' ? 'text-turquoise-400' : 'text-turquoise-800'}>
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
