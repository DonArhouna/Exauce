import type { ReactNode } from 'react';
import { InterfaceLanguageSwitch } from '@/components/shared/InterfaceLanguageSwitch';
import { Logo } from '@/components/ui/Logo';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Coque sobre et centrée des écrans publics du back-office. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-turquoise-500/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-abyss/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Logo />
          <InterfaceLanguageSwitch />
        </div>

        <section className="rounded-card border border-line bg-surface p-7 shadow-card">
          <h1 className="font-display text-2xl text-ink">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </section>

        {footer ? <div className="mt-5 text-center text-xs text-muted">{footer}</div> : null}
      </div>
    </main>
  );
}
