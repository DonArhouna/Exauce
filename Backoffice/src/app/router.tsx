import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { NAV_ITEMS } from '@/components/layout/navigation';
import { ComingSoon } from '@/components/shared/ComingSoon';
import { NotFound } from '@/components/shared/Forbidden';
import ActivatePage from '@/features/auth/pages/ActivatePage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import { DASHBOARD_PATH } from '@/lib/navigation';
import { RequireAuth, RequirePermission } from './guards';

const EXTRA_ROUTES = [
  { path: '/profil', module: undefined, action: undefined },
  { path: '/mot-de-passe', module: undefined, action: undefined },
  { path: '/preferences', module: undefined, action: undefined },
];

/** Table de routage : public, puis coque protégée. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={DASHBOARD_PATH} replace />} />
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
      <Route path="/reinitialiser" element={<ResetPasswordPage />} />
      <Route path="/activer" element={<ActivatePage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path={DASHBOARD_PATH} element={<ComingSoon />} />
          {NAV_ITEMS.filter((item) => item.path !== DASHBOARD_PATH).map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={
                item.permission ? (
                  <RequirePermission module={item.permission.module} action={item.permission.action}>
                    <ComingSoon />
                  </RequirePermission>
                ) : (
                  <ComingSoon />
                )
              }
            />
          ))}
          {EXTRA_ROUTES.map((route) => (
            <Route key={route.path} path={route.path} element={<ComingSoon />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
