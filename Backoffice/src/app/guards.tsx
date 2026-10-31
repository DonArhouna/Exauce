import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Forbidden } from '@/components/shared/Forbidden';
import { Logo } from '@/components/ui/Logo';
import { Spinner } from '@/components/ui/Spinner';
import { LOGIN_PATH } from '@/lib/navigation';
import { hasAnyPermission } from '@/services/auth/permissions';
import { useAuth } from '@/services/auth/useAuth';

/** Attente de la session initiale. */
function SessionLoading() {
  const { t } = useTranslation();
  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-6">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <Spinner label={t('common.loading')} />
      </div>
    </main>
  );
}

/** Routes protégées : redirige vers /connexion avec retour à la page demandée. */
export function RequireAuth() {
  const { status, sessionExpired } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <SessionLoading />;

  if (status === 'unauthenticated') {
    const redirect = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`${LOGIN_PATH}?redirect=${encodeURIComponent(redirect)}`}
        replace
        state={sessionExpired ? { reason: 'session_expired' } : undefined}
      />
    );
  }

  return <Outlet />;
}

/** Masque un écran non autorisé (le serveur revalide chaque appel). */
export function RequirePermission({
  module,
  action,
  children,
}: {
  module: string;
  action: string;
  children: ReactNode;
}) {
  const { permissions } = useAuth();
  if (!hasAnyPermission(permissions, module, action)) return <Forbidden />;
  return <>{children}</>;
}
