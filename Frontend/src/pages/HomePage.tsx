import { useTranslation } from 'react-i18next';
import { Page } from '@/components/layout/Page';
import { OrganizationJsonLd } from '@/lib/seo';
import { ORGANIZATION } from '@/data/content.data';
// Sections réutilisables (src/components/sections)
import { HeroSection } from '@/components/sections/HeroSection';
import { TrustBar } from '@/components/sections/TrustBar';
import { AboutPreviewSection } from '@/components/sections/AboutPreviewSection';
import { DomainCardsSection } from '@/components/sections/DomainsSection';
import { InterventionsSection } from '@/components/sections/InterventionsSection';
import { SectorsSection } from '@/components/sections/SectorsSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { PublicationsSection } from '@/components/sections/PublicationsSection';
import { ContactCtaSection } from '@/components/sections/ContactCtaSection';

/**
 * Accueil — vitrine du style. Alternance ivoire / abysse, motif signature,
 * contenus 100 % pilotés par content.data.ts + i18n.
 */
export default function HomePage() {
  const { t } = useTranslation();

  return (
    <Page title={t('meta.homeTitle')}>
      <OrganizationJsonLd
        name={ORGANIZATION.name}
        email={ORGANIZATION.email}
        phoneFixed={ORGANIZATION.phoneFixed}
        phoneMobile={ORGANIZATION.phoneMobile}
        city={ORGANIZATION.city}
      />

      {/* 1 · Hero plein écran (sombre) */}
      <HeroSection />

      {/* 2 · Bandeau de confiance (clair) */}
      <TrustBar />

      {/* 3 · Cabinet + fondateur (clair) */}
      <AboutPreviewSection />

      {/* 4+5 · 7 domaines d'accompagnement + Audit externe mis en avant (blanc) */}
      <DomainCardsSection />

      {/* 6 · Interventions récurrentes / ponctuelles (turquoise clair) */}
      <InterventionsSection />

      {/* 7 · Secteurs (ivoire) */}
      <SectorsSection />

      {/* 8 · Chiffres structurels réels (encre sombre) */}
      <StatsSection />

      {/* 9 · Aperçu publications (blanc) */}
      <PublicationsSection />

      {/* 10 · CTA final (sombre) */}
      <ContactCtaSection />
    </Page>
  );
}
