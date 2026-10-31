import type { TFunction } from 'i18next';
import { ApiError } from '@/services/api/problem';

/** Message lisible à partir d'une erreur API, sans fuite d'information. */
export function messageForAuthError(error: unknown, t: TFunction, fallbackKey: string): string {
  if (!(error instanceof ApiError)) return t(fallbackKey);

  if (error.status === 0) return t('errors.network');

  switch (error.code) {
    case 'RATE_LIMITED':
      return error.retryAfter
        ? t('auth.rateLimited', { seconds: error.retryAfter })
        : t('auth.rateLimitedGeneric');
    case 'SESSION_EXPIRED':
    case 'UNAUTHENTICATED':
      return t('auth.invalidCredentials');
    case 'MFA_REQUIRED':
      return t('auth.mfaRequired');
    case 'CSRF_TOKEN_MISSING':
    case 'CSRF_TOKEN_MISMATCH':
      return t('auth.csrf');
    case 'TOKEN_EXPIRED':
      return t('auth.tokenExpired');
    case 'FORBIDDEN':
    case 'NOT_PERMITTED_LANG':
      return t('errors.forbiddenText');
    case 'VALIDATION_ERROR':
      return error.problem.detail ?? t(fallbackKey);
    default:
      return error.problem.detail ?? t(fallbackKey);
  }
}
