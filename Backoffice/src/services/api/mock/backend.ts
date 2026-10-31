import type {
  AdminActivateRequest,
  AdminLoginRequest,
  AdminPasswordChangeRequest,
  AdminPasswordResetRequest,
} from '../types';
import {
  DEMO,
  endSession,
  findAccountByEmail,
  findAccountById,
  findPendingAccount,
  getAttempts,
  getMockPublicationJobs,
  getMockPublicationStatus,
  getSession,
  listMockNotifications,
  markMockNotificationRead,
  startSession,
  triggerMockPublication,
  type MockAccount,
  type MockSession,
} from './db';

export interface MockRequest {
  method: string;
  path: string;
  body?: unknown;
  query: Record<string, string | number | boolean | undefined>;
  csrfToken: string | null;
}

export interface MockResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

const LATENCY = Number(
  import.meta.env.VITE_MOCK_LATENCY_MS ?? (import.meta.env.MODE === 'test' ? 0 : 120),
);

function delay(): Promise<void> {
  if (!LATENCY) return Promise.resolve();
  return new Promise((resolve) => window.setTimeout(resolve, LATENCY));
}

function problem(status: number, code: string, detail?: string): MockResponse {
  return {
    status,
    body: {
      type: `https://exauceac.com/errors/${code.toLowerCase()}`,
      title: code.replaceAll('_', ' ').toLowerCase(),
      status,
      code,
      detail,
    },
  };
}

function invalidCredentials(): MockResponse {
  return problem(401, 'UNAUTHENTICATED', 'Identifiants invalides');
}

function rateLimited(seconds: number): MockResponse {
  return {
    ...problem(429, 'RATE_LIMITED', 'Trop de tentatives'),
    headers: { 'retry-after': String(seconds) },
  };
}

function currentAccount(): { session: MockSession; account: MockAccount } | null {
  const session = getSession();
  if (!session) return null;
  const account = findAccountById(session.userId);
  if (!account || !account.user.is_active) return null;
  return { session, account };
}

function can(account: MockAccount, module: string, action: string): boolean {
  return account.user.permissions.some(
    (permission) => permission.module === module && permission.action === action,
  );
}

function requireSessionAndCsrf(request: MockRequest): MockResponse | null {
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  if (!request.csrfToken) return problem(403, 'CSRF_TOKEN_MISSING', 'Jeton CSRF absent');
  if (request.csrfToken !== current.session.csrf) {
    return problem(403, 'CSRF_TOKEN_MISMATCH', 'Jeton CSRF invalide');
  }
  return null;
}

function asLogin(body: unknown): AdminLoginRequest {
  return (body ?? {}) as AdminLoginRequest;
}

function login(request: MockRequest): MockResponse {
  const payload = asLogin(request.body);
  if (!payload.email || !payload.password) {
    return problem(422, 'VALIDATION_ERROR', 'E-mail et mot de passe requis');
  }
  if (!payload.email.includes('@')) {
    return problem(422, 'VALIDATION_ERROR', 'Adresse e-mail invalide');
  }

  const key = payload.email.toLowerCase();
  const attempts = getAttempts();
  const attempt = attempts.get(key);
  if (attempt && attempt.lockedUntil > Date.now()) {
    return rateLimited(Math.ceil((attempt.lockedUntil - Date.now()) / 1000));
  }

  const account = findAccountByEmail(payload.email);
  const passwordOk = Boolean(account?.password) && account?.password === payload.password;

  if (!account || !passwordOk) {
    const count = (attempt?.count ?? 0) + 1;
    if (count >= 5) {
      attempts.set(key, { count, lockedUntil: Date.now() + 60_000 });
      return rateLimited(60);
    }
    attempts.set(key, { count, lockedUntil: 0 });
    return invalidCredentials();
  }

  if (account.user.mfa_enabled) {
    if (!payload.totp_code) {
      return { status: 200, body: { status: 'mfa_required' } };
    }
    if (payload.totp_code !== DEMO.totpCode) {
      return invalidCredentials();
    }
  }

  attempts.delete(key);
  const session = startSession(account.user.id);
  return {
    status: 200,
    body: { status: 'authenticated', user: account.user, csrf_token: session.csrf },
  };
}

function me(): MockResponse {
  const session = getSession();
  if (!session) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  const account = findAccountById(session.userId);
  if (!account) return problem(401, 'UNAUTHENTICATED', 'Compte inconnu');
  return { status: 200, body: { user: account.user, csrf_token: session.csrf } };
}

function logout(request: MockRequest): MockResponse {
  const failure = requireSessionAndCsrf(request);
  if (failure) return failure;
  endSession();
  return { status: 204 };
}

function forgotPassword(): MockResponse {
  // Anti-énumération : toujours 202, compte existant ou non.
  return { status: 202, body: { status: 'accepted' } };
}

function resetPassword(request: MockRequest): MockResponse {
  const payload = (request.body ?? {}) as AdminPasswordResetRequest;
  if (payload.token !== DEMO.resetToken) {
    return problem(410, 'TOKEN_EXPIRED', 'Jeton expiré ou déjà utilisé');
  }
  if (!payload.password || payload.password.length < 14) {
    return problem(422, 'VALIDATION_ERROR', 'Mot de passe trop court');
  }
  const account = findAccountByEmail('fondateur@exauceac.com');
  if (account) account.password = payload.password;
  endSession();
  return { status: 204 };
}

function activate(request: MockRequest): MockResponse {
  const payload = (request.body ?? {}) as AdminActivateRequest;
  if (payload.token !== DEMO.invitationToken) {
    return problem(410, 'TOKEN_EXPIRED', 'Invitation expirée ou déjà utilisée');
  }
  if (!payload.password || payload.password.length < 14) {
    return problem(422, 'VALIDATION_ERROR', 'Mot de passe trop court');
  }
  const account = findPendingAccount();
  if (!account) return problem(410, 'TOKEN_EXPIRED', 'Invitation déjà utilisée');
  account.password = payload.password;
  account.user.must_reset_password = false;
  const session = startSession(account.user.id);
  return {
    status: 200,
    body: { status: 'authenticated', user: account.user, csrf_token: session.csrf },
  };
}

function changePassword(request: MockRequest): MockResponse {
  const failure = requireSessionAndCsrf(request);
  if (failure) return failure;
  const payload = (request.body ?? {}) as AdminPasswordChangeRequest;
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  if (current.account.password !== payload.current_password) {
    return problem(401, 'UNAUTHENTICATED', 'Mot de passe actuel incorrect');
  }
  if (!payload.new_password || payload.new_password.length < 14) {
    return problem(422, 'VALIDATION_ERROR', 'Mot de passe trop court');
  }
  current.account.password = payload.new_password;
  current.account.user.must_reset_password = false;
  return { status: 204 };
}

function publicationStatus(): MockResponse {
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  if (!can(current.account, 'pages', 'view')) return problem(403, 'FORBIDDEN', 'Permission insuffisante');
  return { status: 200, body: getMockPublicationStatus() };
}

function publicationJobs(request: MockRequest): MockResponse {
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  const limit = Number(request.query.limit ?? 20);
  const offset = Number(request.query.offset ?? 0);
  const all = getMockPublicationJobs();
  return {
    status: 200,
    body: { items: all.slice(offset, offset + limit), total: all.length },
  };
}

function triggerPublication(request: MockRequest): MockResponse {
  const failure = requireSessionAndCsrf(request);
  if (failure) return failure;
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  if (!can(current.account, 'pages', 'publish')) {
    return problem(403, 'FORBIDDEN', 'Permission insuffisante');
  }
  const job = triggerMockPublication();
  if (!job) return problem(409, 'CONFLICT', 'Une publication est déjà en cours');
  return { status: 202, body: job };
}

function notifications(request: MockRequest): MockResponse {
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  if (!can(current.account, 'leads', 'view')) {
    return problem(403, 'FORBIDDEN', 'Permission insuffisante');
  }
  const unreadOnly = request.query.unread_only === true || request.query.unread_only === 'true';
  const limit = Number(request.query.limit ?? 20);
  return { status: 200, body: listMockNotifications(unreadOnly, limit) };
}

function readNotification(request: MockRequest, id: string): MockResponse {
  const failure = requireSessionAndCsrf(request);
  if (failure) return failure;
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  if (!can(current.account, 'leads', 'view')) {
    return problem(403, 'FORBIDDEN', 'Permission insuffisante');
  }
  return markMockNotificationRead(id) ? { status: 204 } : problem(404, 'CONTENT_NOT_FOUND', 'Notification inconnue');
}

/** Routeur du backend mock : toute route non couverte renvoie 501. */
export async function mockRequest(request: MockRequest): Promise<MockResponse> {
  await delay();
  const route = `${request.method} ${request.path}`;

  if (route === 'POST /admin/publication-jobs') return triggerPublication(request);
  if (route === 'GET /admin/publication-jobs/current') return publicationStatus();

  const notificationRead = request.path.match(/^\/admin\/notifications\/([^/]+)\/read$/);
  if (request.method === 'POST' && notificationRead) {
    return readNotification(request, notificationRead[1]);
  }

  switch (route) {
    case 'POST /admin/auth/login':
      return login(request);
    case 'GET /admin/auth/me':
      return me();
    case 'POST /admin/auth/logout':
      return logout(request);
    case 'POST /admin/auth/password-forgot':
      return forgotPassword();
    case 'POST /admin/auth/password-reset':
      return resetPassword(request);
    case 'POST /admin/auth/activate':
      return activate(request);
    case 'POST /admin/auth/password-change':
      return changePassword(request);
    case 'GET /admin/publication-jobs':
      return publicationJobs(request);
    case 'GET /admin/notifications':
      return notifications(request);
    default:
      return problem(501, 'NOT_IMPLEMENTED', `Route non couverte par le mock : ${route}`);
  }
}
