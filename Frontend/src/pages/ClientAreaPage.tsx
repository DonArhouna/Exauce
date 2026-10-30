import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LockKeyhole, Loader2, AlertCircle } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Button } from '@/components/ui/Button';

/**
 * Espace Client — UI de connexion uniquement (aucune auth réelle).
 * États : idle / loading / error ; lien « mot de passe oublié » en UI.
 * Branchement future : POST /auth/login via services/api (contrat API doc).
 */
export default function ClientAreaPage() {
  const { t } = useTranslation();
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const field =
    'w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm focus:border-turquoise-500 focus:outline-none focus:ring-2 focus:ring-turquoise-500/30 disabled:opacity-50';

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // pas de logique réelle : UI uniquement
    setState('loading');
    // TODO(backend): POST /auth/login
    await new Promise((r) => setTimeout(r, 700));
    setState('error');
  };

  return (
    <Page title={`${t('nav.clientArea')} — EXAUCE`}>
      <PageHero
        title={t('nav.clientArea')}
        intro={t('clientArea.subtitle')}
        crumbs={[{ label: t('nav.clientArea') }]}
      />
      <section className="py-section-sm md:py-section">
        <div className="mx-auto max-w-md px-5 sm:px-8">
          <form onSubmit={onSubmit} className="rounded-card border border-ink/8 bg-white p-8 shadow-card" noValidate>
            <LockKeyhole className="h-8 w-8 text-turquoise-600" aria-hidden="true" />
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">{t('clientArea.username')}</span>
                <input className={field} type="text" autoComplete="username" disabled={state === 'loading'} required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">{t('clientArea.password')}</span>
                <input className={field} type="password" autoComplete="current-password" disabled={state === 'loading'} required />
              </label>
            </div>

            {/* Annonces d'état (ARIA live) */}
            <div aria-live="polite">
              {state === 'loading' && (
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600" role="status">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {t('clientAreaStates.loading')}
                </p>
              )}
              {state === 'error' && (
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-red-700" role="alert">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  {t('clientAreaStates.error')}
                </p>
              )}
            </div>

            <Button className="mt-6 w-full justify-center" type="submit" disabled={state === 'loading'}>
              {t('clientArea.login')}
            </Button>
            <button
              type="button"
              onClick={() => setState('idle')}
              className="mx-auto mt-4 block text-xs text-slate-500 underline hover:text-turquoise-700"
              title={t('clientAreaStates.forgotDetail')}
            >
              {t('clientAreaStates.forgot')}
            </button>
            <p className="mt-6 text-center text-[11px] text-slate-400">{t('common.placeholder')}</p>
          </form>
        </div>
      </section>
    </Page>
  );
}
