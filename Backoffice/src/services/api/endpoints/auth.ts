import { apiRequest } from '../client';
import { setCsrfToken } from '../csrf';
import type {
  AdminActivateRequest,
  AdminLoginAuthenticated,
  AdminLoginRequest,
  AdminLoginResponse,
  AdminMeResponse,
  AdminPasswordChangeRequest,
  AdminPasswordForgotRequest,
  AdminPasswordResetRequest,
} from '../types';

/** Login (mot de passe, puis TOTP si `status=mfa_required`). */
export async function adminLogin(input: AdminLoginRequest): Promise<AdminLoginResponse> {
  const response = await apiRequest<AdminLoginResponse>('/admin/auth/login', {
    method: 'POST',
    body: input,
    skipUnauthorizedHandler: true,
  });
  if (response.status === 'authenticated') setCsrfToken(response.csrf_token);
  return response;
}

/** Session courante, permissions et jeton CSRF. */
export async function adminMe(): Promise<AdminMeResponse> {
  const response = await apiRequest<AdminMeResponse>('/admin/auth/me', {
    skipUnauthorizedHandler: true,
  });
  setCsrfToken(response.csrf_token);
  return response;
}

export async function adminLogout(): Promise<void> {
  await apiRequest<void>('/admin/auth/logout', { method: 'POST' });
  setCsrfToken(null);
}

export async function adminPasswordForgot(input: AdminPasswordForgotRequest): Promise<void> {
  await apiRequest<{ status: 'accepted' }>('/admin/auth/password-forgot', {
    method: 'POST',
    body: input,
    skipUnauthorizedHandler: true,
  });
}

export async function adminPasswordReset(input: AdminPasswordResetRequest): Promise<void> {
  await apiRequest<void>('/admin/auth/password-reset', {
    method: 'POST',
    body: input,
    skipUnauthorizedHandler: true,
  });
}

export async function adminActivate(input: AdminActivateRequest): Promise<AdminLoginAuthenticated> {
  const response = await apiRequest<AdminLoginAuthenticated>('/admin/auth/activate', {
    method: 'POST',
    body: input,
    skipUnauthorizedHandler: true,
  });
  setCsrfToken(response.csrf_token);
  return response;
}

export async function adminPasswordChange(input: AdminPasswordChangeRequest): Promise<void> {
  await apiRequest<void>('/admin/auth/password-change', { method: 'POST', body: input });
}
