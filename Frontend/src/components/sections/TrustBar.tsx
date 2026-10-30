import { BadgeCheck, Globe2, Scale, Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ITEMS = [
  { key: 'onecca', Icon: BadgeCheck },
  { key: 'uemoa', Icon: Globe2 },
  { key: 'ohada', Icon: Scale },
  { key: 'sectors', Icon: Workflow },
] as const;

/** Section 2 — bandeau de confiance : références réglementaires. */
export function TrustBar() {
  const { t } = useTranslation();

  return (
    <div className="border-b border-ink/8 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-8 gap-y-3 px-5 py-6 sm:px-8 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ key, Icon }) => (
          <div key={key} className="flex items-center gap-3 text-sm text-slate-600">
            <Icon className="h-5 w-5 shrink-0 text-turquoise-600" aria-hidden="true" />
            <span>{t(`home.trust.${key}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
