import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { translatePath } from '@/lib/routes';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SearchOverlay } from '@/components/layout/SearchOverlay';
import { CookieBanner } from '@/components/layout/CookieBanner';
import { isLang } from '@/i18n';

// Lazy-loading de chaque route (performance / code splitting)
const HomePage = lazy(() => import('@/pages/HomePage'));
const ServicesIndexPage = lazy(() => import('@/pages/ServicesIndexPage'));
const ServiceDomainPage = lazy(() => import('@/pages/ServiceDomainPage'));
const InterventionsPage = lazy(() => import('@/pages/InterventionsPage'));
const SectorsPage = lazy(() => import('@/pages/SectorsPage'));
const PublicationsPage = lazy(() => import('@/pages/PublicationsPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const ClientAreaPage = lazy(() => import('@/pages/ClientAreaPage'));
const LegalPage = lazy(() => import('@/pages/LegalPage'));
const PublicationDetailPage = lazy(() => import('@/pages/PublicationDetailPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/** Layout : header + footer + overlay recherche, langue synchronisée avec l’URL. */
function LayoutWithLang({ children }: { children: React.ReactNode }) {
  const { lang } = useParams();
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);

  // Synchronise i18n + <html lang> avec le préfixe d’URL
  useEffect(() => {
    const l = isLang(lang) ? lang : 'fr';
    if (i18n.language !== l) void i18n.changeLanguage(l);
    document.documentElement.lang = l;
  }, [lang]);

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-turquoise-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        {t('common.skipToContent')}
      </a>
      <Header onSearchOpen={() => setSearchOpen(true)} />
      <main id="contenu">{children}</main>
      <Footer />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CookieBanner />
    </>
  );
}

/** Redirige toute URL dont les segments sont traduisibles vers l'autre langue, sinon 404. */
function TranslatedRedirect() {
  const location = useLocation();
  const { lang } = useParams();
  const target = translatePath(location.pathname, isLang(lang) ? lang : 'fr');
  if (target !== location.pathname) return <Navigate to={target} replace />;
  return <NotFoundPage />;
}

/** Redirection 301/replace : ancienne page Localisations -> Contact (avec ancre #implantations). */
function LocationsRedirect() {
  const { lang = 'fr' } = useParams();
  return <Navigate to={`/${lang}/contact#implantations`} replace />;
}

/** Racine : redirige / vers /fr, valide le préfixe de langue. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/fr" replace />} />
      <Route
        path="/:lang/*"
        element={
          <LayoutWithLang>
            <Suspense fallback={<div className="min-h-[60vh]" />}>
              <Routes>
                <Route index element={<HomePage />} />
                <Route path="services" element={<ServicesIndexPage />} />
                <Route path="services/:familleSlug" element={<ServicesIndexPage />} />
                <Route path="services/:familleSlug/:domaineSlug" element={<ServiceDomainPage />} />
                <Route path="interventions" element={<InterventionsPage />} />
                <Route path="interventions/:typeSlug" element={<InterventionsPage />} />
                <Route path="secteurs" element={<SectorsPage />} />
                <Route path="sectors" element={<SectorsPage />} />
                <Route path="secteurs/:secteurSlug" element={<SectorsPage />} />
                <Route path="sectors/:secteurSlug" element={<SectorsPage />} />
                <Route path="publications" element={<PublicationsPage />} />
                <Route path="publications/:slug" element={<PublicationDetailPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="espace-client" element={<ClientAreaPage />} />
                <Route path="customer-area" element={<ClientAreaPage />} />
                <Route path="mentions-legales" element={<LegalPage />} />
                <Route path="legal-notice" element={<LegalPage />} />
                <Route path="a-propos" element={<AboutPage />} />
                <Route path="about-us" element={<AboutPage />} />
                {/* Redirection 301/replace : ancienne page Localisations -> Contact */}
                <Route path="localisations" element={<LocationsRedirect />} />
                <Route path="locations" element={<LocationsRedirect />} />
                {/* Redirection 301/replace : URL dans la mauvaise langue → équivalent traduit */}
                <Route path="*" element={<TranslatedRedirect />} />
              </Routes>
            </Suspense>
          </LayoutWithLang>
        }
      />
      <Route path="*" element={<Navigate to="/fr" replace />} />
    </Routes>
  );
}
