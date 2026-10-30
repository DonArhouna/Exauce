import logoDark from '@/assets/logo-exauce.png';
import logoLight from '@/assets/logo-exauce-light.png';
import { Lang } from '@/types/content';

interface Props {
  /** Fond sur lequel le logo est posé : sombre → wordmark blanc. */
  tone: 'light' | 'dark';
  lang: Lang;
  className?: string;
}

/** Logo marque (PNG transparent, variante blanche posée sur fonds sombres). */
export function Logo({ tone, lang, className }: Props) {
  const src = tone === 'dark' ? logoLight : logoDark;
  const alt = 'EXAUCE Audit & Conseils';
  const to =
    lang === 'en' ? '/en' : '/fr';
  return (
    <a href={to} className={className} aria-label={alt} title={alt}>
      <img src={src} alt={alt} width={600} height={184} className="h-10 w-auto" decoding="async" />
    </a>
  );
}
