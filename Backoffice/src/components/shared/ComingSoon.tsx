import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/ui/Logo';

/** Contenu de secours des écrans non encore développés. */
export function ComingSoon() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-lg rounded-card border border-line bg-surface p-10 text-center shadow-card">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-turquoise-50 text-turquoise-700">
        <Clock className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="mt-4 font-display text-2xl text-ink">{t('comingSoon.title')}</h1>
      <p className="mt-2 text-sm text-muted">{t('comingSoon.text')}</p>
      <Link
        to="/tableau-de-bord"
        className="mt-6 inline-flex h-10 items-center rounded-control bg-turquoise-600 px-4 text-sm font-medium text-white hover:bg-turquoise-700"
      >
        {t('comingSoon.backToDashboard')}
      </Link>
    </div>
  );
}

/** Version pleine page, utilisée hors coque applicative. */
export function ComingSoonPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <ComingSoon />
      </div>
    </main>
  );
}
