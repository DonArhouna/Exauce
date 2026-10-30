import { Mail, Phone, Smartphone, Search, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { ORGANIZATION } from '@/data/content.data';
import { Lang } from '@/types/content';
import { pagePath } from '@/lib/routes';
import { LanguageSwitcher } from './LanguageSwitcher';

/** Barre utilitaire haut (niveau 1) : langue · espace client · recherche · contact. */
export function UtilityBar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const clientPath = pagePath(lang as Lang, 'clientArea');

  return (
    <div className="hidden text-xs md:block bg-ink text-white/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-1.5 sm:px-8">
        {/* Contact rapide */}
        <div className="flex items-center gap-4">
          <a href={`mailto:${ORGANIZATION.email}`} className="inline-flex items-center gap-1.5 hover:text-turquoise-400">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {ORGANIZATION.email}
          </a>
          <a href={`tel:${ORGANIZATION.phoneFixed.replace(/\s/g, '')}`} className="hidden items-center gap-1.5 lg:inline-flex hover:text-turquoise-400">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {ORGANIZATION.phoneFixed}
          </a>
          <a href={`tel:${ORGANIZATION.phoneMobile.replace(/\s/g, '')}`} className="hidden items-center gap-1.5 lg:inline-flex hover:text-turquoise-400">
            <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
            {ORGANIZATION.phoneMobile}
          </a>
        </div>

        {/* Outils */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a href={clientPath} className="inline-flex items-center gap-1.5 hover:text-turquoise-400">
            <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
            {t('nav.clientArea')}
          </a>
          <button
            type="button"
            onClick={onSearchOpen}
            className="inline-flex items-center gap-1.5 hover:text-turquoise-400"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            {t('nav.search')}
          </button>
        </div>
      </div>
    </div>
  );
}
