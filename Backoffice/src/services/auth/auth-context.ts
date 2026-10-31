import { createContext } from 'react';
import type {
  AdminActivateRequest,
  AdminLoginRequest,
  AdminLoginResponse,
  AdminSessionUser,
  Permission,
} from '../api/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: AdminSessionUser | null;
  permissions: Permission[];
  sessionExpired: boolean;
  login: (input: AdminLoginRequest) => Promise<AdminLoginResponse>;
  activate: (input: AdminActivateRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearSessionExpired: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
