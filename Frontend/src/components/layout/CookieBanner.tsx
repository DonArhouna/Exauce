import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bannière cookies minimale : aucun traceur actif, consentement stocké
 * localement (UI) — le déclic réel sur les mesure d'audience est une
 * décision du cabinet (à brancher plus tard côté backend/CGT).
 */
export function CookieBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const close = () => setVisible(false);

  return createPortal(
    <aside
      role="dialog"
      aria-label={t('legal.cookies')}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-card border border-white/15 bg-ink/95 p-5 text-ivory shadow-cardHover backdrop-blur md:inset-x-auto md:right-8 md:max-w-md"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm text-white/75">{t('legal.customParag')}</p>
        <button type="button" onClick={close} aria-label={t('nav.close')} className="rounded-full p-1 text-white/60 hover:text-white">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={close}
          className="rounded-full bg-turquoise-500 px-4 py-2 text-xs font-semibold text-ink hover:bg-turquoise-400"
        >
          {t('legal.acceptAll')}
        </button>
        <button
          type="button"
          onClick={close}
          className="rounded-full border border-white/25 px-4 py-2 text-xs font-medium text-white/85 hover:border-turquoise-400 hover:text-turquoise-400"
        >
          {t('legal.refuseAll')}
        </button>
        <button
          type="button"
          onClick={close}
          className="rounded-full px-3 py-2 text-xs text-white/60 underline hover:text-turquoise-400"
        >
          {t('legal.custom')}
        </button>
      </div>
    </aside>,
    document.body,
  );
}
