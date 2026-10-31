import { Navigate, Route, Routes } from 'react-router-dom';
import { ComingSoonPage } from '@/components/shared/ComingSoon';
import ActivatePage from '@/features/auth/pages/ActivatePage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';

/** Table de routage. Les routes protégées arrivent avec le layout applicatif. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tableau-de-bord" replace />} />
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
      <Route path="/reinitialiser" element={<ResetPasswordPage />} />
      <Route path="/activer" element={<ActivatePage />} />
      <Route path="/tableau-de-bord" element={<ComingSoonPage />} />
      <Route path="*" element={<ComingSoonPage />} />
    </Routes>
  );
}
