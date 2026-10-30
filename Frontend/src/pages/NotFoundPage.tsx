import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { SpeedLines } from '@/components/ui/SpeedLines';
import { Button } from '@/components/ui/Button';
import { Page } from '@/components/layout/Page';
import { Lang } from '@/types/content';

/** 404 soignée. */
export default function NotFoundPage() {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;

  return (
    <Page title={`404 — ${t('notFound.title')}`}>
      <section className="flex min-h-[65vh] items-center bg-abyss-gradient text-ivory">
        <div className="mx-auto max-w-xl px-5 text-center sm:px-8">
          <SpeedLines className="mx-auto h-5" />
          <p className="mt-8 font-display text-7xl text-turquoise-400" aria-hidden="true">
            404
          </p>
          <h1 className="mt-4 font-display text-display-lg">{t('notFound.title')}</h1>
          <p className="mx-auto mt-4 max-w-sm text-sm text-white/70">{t('notFound.text')}</p>
          <Button href={`/${l}`} variant="onDark" className="mt-10">
            {t('notFound.backHome')}
          </Button>
        </div>
      </section>
    </Page>
  );
}
