/**
 * SEO helpers : JSON-LD injecté dynamiquement (données structurées).
 */
export function BreadcrumbJsonLd({ items }: { items?: { label: string; href?: string }[] }) {
  if (!items || items.length === 0) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${origin}${item.href}` } : {}),
    })),
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export function OrganizationJsonLd({
  name,
  email,
  phoneFixed,
  phoneMobile,
  city,
}: {
  name: string;
  email: string;
  phoneFixed: string;
  phoneMobile: string;
  city: string;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'AccountingService', // cabinet
    name,
    email,
    telephone: phoneFixed,
    additionalTelephoneNumber: phoneMobile,
    address: { '@type': 'PostalAddress', addressLocality: city, addressCountry: 'SN' },
    url: typeof window !== 'undefined' ? window.location.origin : undefined,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/** hook interne pour Page.tsx — titre document */
/* (déplacé: Page.tsx gère le titre) */

