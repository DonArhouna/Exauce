import { useTranslation } from 'react-i18next';

/**
 * Coquille de démarrage — remplacée par le routeur à l'étape « connexion ».
 * Sert au commit de socle : tooling, tokens et i18n vérifiés.
 */
export default function App() {
  const { t } = useTranslation();

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-6">
      <div className="rounded-card border border-line bg-surface px-10 py-8 shadow-card">
        <p className="font-display text-2xl text-ink">{t('app.name')}</p>
        <p className="mt-1 text-sm text-muted">{t('app.title')}</p>
      </div>
    </main>
  );
}
