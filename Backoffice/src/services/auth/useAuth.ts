import { useContext } from 'react';
import { AuthContext } from './auth-context';

/** Accès à la session courante et aux actions d'authentification. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider.');
  return context;
}
