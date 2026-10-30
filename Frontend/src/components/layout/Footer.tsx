import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Mail, Phone, Smartphone, ArrowUpRight } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { SpeedLines } from '../ui/SpeedLines';
import { ORGANIZATION } from '@/data/content.data';
import { useNavItems } from '@/data/navigation';
import { Lang } from '@/types/content';
import { pagePath } from '@/lib/routes';

/** Footer riche : logo sombre, liens principaux, contacts, mentions. */
export function Footer() {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const navItems = useNavItems(lang as Lang).filter((i) => i.key !== 'home');
  const year = new Date().getFullYear();

  return (
    <footer className="bg-abyss-gradient text-ivory">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr]">
          {/* Marque */}
          <div>
            <Logo tone="dark" lang={lang as Lang} />
            <SpeedLines className="mt-6 h-4" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/60">
              {t('meta.homeDescription')}
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label={t('common.legal')} className="text-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-turquoise-400">
              {t('nav.menu')}
            </p>
            <ul className="space-y-2.5">
              {navItems.map((i) => (
                <li key={i.key}>
                  <Link to={i.href} className="text-white/70 transition-colors hover:text-turquoise-400">
                    {i.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to={`/${lang}/contact`} className="text-white/70 hover:text-turquoise-400">
                  {t('nav.contact')}
                </Link>
              </li>
              <li>
                <Link to={pagePath(lang as Lang, 'legal')} className="text-white/70 hover:text-turquoise-400">
                  {t('legal.mentions')}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact */}
          <div className="text-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-turquoise-400">
              {t('nav.contact')}
            </p>
            <ul className="space-y-3 text-white/70">
              <li>
                <a href={`mailto:${ORGANIZATION.email}`} className="inline-flex items-center gap-2 hover:text-turquoise-400">
                  <Mail className="h-4 w-4 text-turquoise-500" aria-hidden="true" />
                  {ORGANIZATION.email}
                </a>
              </li>
              <li>
                <a href={`tel:${ORGANIZATION.phoneFixed.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 hover:text-turquoise-400">
                  <Phone className="h-4 w-4 text-turquoise-500" aria-hidden="true" />
                  {ORGANIZATION.phoneFixed}
                </a>
              </li>
              <li>
                <a href={`tel:${ORGANIZATION.phoneMobile.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 hover:text-turquoise-400">
                  <Smartphone className="h-4 w-4 text-turquoise-500" aria-hidden="true" />
                  {ORGANIZATION.phoneMobile}
                </a>
              </li>
            </ul>
            <Link
              to={`/${lang}/contact`}
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-turquoise-400 hover:text-turquoise-300"
            >
              {t('common.contactUs')}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center">
          <p>
            © {year} {ORGANIZATION.name}. {t('common.allRightsReserved')}
          </p>
          <p>
            {t('common.legal')} — <span className="italic">{t('common.placeholder')}</span>
          </p>        </div>
      </div>
    </footer>
  );
}
