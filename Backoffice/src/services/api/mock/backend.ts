import type {
  AdminActivateRequest,
  AdminLoginRequest,
  AdminPasswordChangeRequest,
  AdminPasswordResetRequest,
  LeadListQuery,
  LeadStatus,
  OfficeWrite,
} from '../types';
import { isAcceptedMime, MAX_UPLOAD_BYTES } from '@/lib/media';
import {
  DEMO,
  createMockMedia,
  deleteMockMedia,
  endSession,
  findAccountByEmail,
  findAccountById,
  findMockMedia,
  findPendingAccount,
  getAttempts,
  getMockMediaUsages,
  getMockPublicationJobs,
  getMockPublicationStatus,
  getSession,
  listMockMedia,
  listMockNotifications,
  markMockNotificationRead,
  startSession,
  triggerMockPublication,
  type MockAccount,
  type MockSession,
} from './db';
import { getMockDashboard } from './dashboard';
import {
  addSection,
  deleteSection,
  findPage,
  listPages,
  pageDetail,
  transitionPage,
  updatePage,
  updateSection,
  type MutationResult,
  type WorkflowAction,
} from './pages';
import { listSectionTypes } from './sectionTypes';
import {
  addLeadNote,
  exportLeadsCsv,
  LEAD_STATUSES,
  leadDetail,
  listLeads,
  updateLeadStatus,
} from './leads';
import { createOffice, deleteOffice, listOffices, updateOffice } from './offices';

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

function can(account: MockAccount, module: string, action: string, lang?: string): boolean {
  return account.user.permissions.some(
    (permission) =>
      permission.module === module &&
      permission.action === action &&
      (lang === undefined || permission.lang == null || permission.lang === lang),
  );
}

function requirePages(
  module: string,
  action: string,
  lang?: string,
): { account: MockAccount } | MockResponse {
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  if (!can(current.account, module, action, lang)) {
    return problem(403, 'FORBIDDEN', 'Permission insuffisante');
  }
  return { account: current.account };
}

/** Traduit un refus de mutation du contenu en réponse RFC 7807. */
type MutationFailure = Extract<MutationResult<unknown>, { ok: false }>;

function mutationFailure(result: MutationFailure): MockResponse {
  if (result.code === 'NOT_FOUND') return problem(404, 'CONTENT_NOT_FOUND', 'Contenu inconnu');
  if (result.code === 'CONFLICT') {
    return problem(409, 'CONFLICT', 'Le contenu a été modifié entre-temps : rechargez la page.');
  }
  return {
    ...problem(422, 'VALIDATION_ERROR', result.detail ?? 'Données invalides'),
    body: {
      type: 'https://exauceac.com/errors/validation_error',
      title: 'validation error',
      status: 422,
      code: 'VALIDATION_ERROR',
      detail: result.detail ?? 'Données invalides',
      errors: result.errors,
    },
  };
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

/**
 * Tableau de bord : accessible à toute session. Chaque groupe d'agrégats
 * n'est renvoyé que si la permission correspondante est détenue, comme le
 * décrit le contrat (groupes optionnels de `AdminDashboard`).
 */
function dashboard(): MockResponse {
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  const account = current.account;
  const full = getMockDashboard();
  return {
    status: 200,
    body: {
      generated_at: full.generated_at,
      ...(can(account, 'leads', 'view') ? { leads: full.leads } : {}),
      ...(can(account, 'publications', 'view')
        ? { publications: full.publications, publication: full.publication }
        : {}),
      ...(can(account, 'pages', 'view') ? { content: full.content } : {}),
      ...(can(account, 'settings', 'view') ? { i18n: full.i18n } : {}),
      ...(can(account, 'audit', 'view') ? { audit: full.audit } : {}),
    },
  };
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

// ── Demandes de contact (mock) ─────────────────────────────────
function leadQuery(request: MockRequest): LeadListQuery {
  const text = (key: string) => {
    const value = request.query[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  };
  const limit = Number(request.query.limit ?? 20);
  const offset = Number(request.query.offset ?? 0);
  const status = text('status');
  return {
    status: (status as LeadStatus | 'all' | undefined) ?? 'all',
    search: text('search'),
    sector: text('sector'),
    from: text('from'),
    to: text('to'),
    limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
    offset: Number.isFinite(offset) && offset > 0 ? offset : 0,
  };
}

function officeFailure(result: { code?: string; field?: string }): MockResponse {
  if (result.code === 'not_found') return problem(404, 'CONTENT_NOT_FOUND', 'Bureau inconnu');
  if (result.code === 'code_taken') {
    return problem(409, 'OFFICE_CODE_TAKEN', 'Ce code est déjà utilisé par un autre bureau.');
  }
  if (result.code === 'headquarters_protected') {
    return problem(
      409,
      'HEADQUARTERS_PROTECTED',
      'Désignez un autre siège avant de supprimer celui-ci.',
    );
  }
  return {
    ...problem(422, 'VALIDATION_ERROR', 'Données invalides'),
    body: {
      type: 'https://exauceac.com/errors/validation_error',
      title: 'validation error',
      status: 422,
      code: 'VALIDATION_ERROR',
      detail: 'Données invalides',
      errors: result.field ? [{ field: result.field, message: 'FIELD_INVALID' }] : [],
    },
  };
}

function officesCreate(request: MockRequest): MockResponse {
  const guard = requirePages('offices', 'create');
  if ('status' in guard) return guard;
  const result = createOffice((request.body ?? {}) as OfficeWrite);
  return result.ok && result.value
    ? { status: 201, body: result.value }
    : officeFailure(result);
}

function officesPatch(request: MockRequest, id: string): MockResponse {
  const guard = requirePages('offices', 'edit');
  if ('status' in guard) return guard;
  const result = updateOffice(id, (request.body ?? {}) as OfficeWrite);
  return result.ok && result.value ? { status: 200, body: result.value } : officeFailure(result);
}

function officesDelete(id: string): MockResponse {
  const guard = requirePages('offices', 'delete');
  if ('status' in guard) return guard;
  const result = deleteOffice(id);
  return result.ok ? { status: 204, body: null } : officeFailure(result);
}

function leadsGuard(action: string): MockResponse | null {
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  if (!can(current.account, 'leads', action)) {
    return problem(403, 'FORBIDDEN', 'Permission insuffisante');
  }
  return null;
}

function leadsList(request: MockRequest): MockResponse {
  const failure = leadsGuard('view');
  if (failure) return failure;
  return { status: 200, body: listLeads(leadQuery(request)) };
}

function leadsDetail(id: string): MockResponse {
  const failure = leadsGuard('view');
  if (failure) return failure;
  const detail = leadDetail(id);
  return detail
    ? { status: 200, body: detail }
    : problem(404, 'CONTENT_NOT_FOUND', 'Demande inconnue');
}

function leadMutationFailure(code: 'not_found' | 'conflict' | 'immutable'): MockResponse {
  if (code === 'not_found') return problem(404, 'CONTENT_NOT_FOUND', 'Demande inconnue');
  if (code === 'conflict') {
    return problem(409, 'CONFLICT', 'La demande a été modifiée entre-temps');
  }
  return problem(409, 'CONFLICT', 'Une demande anonymisée n’est plus modifiable');
}

function leadsStatus(request: MockRequest, id: string): MockResponse {
  const failure = requireSessionAndCsrf(request) ?? leadsGuard('status');
  if (failure) return failure;
  const body = (request.body ?? {}) as { status?: string; revision?: number };
  if (!body.status || !LEAD_STATUSES.includes(body.status as LeadStatus)) {
    return problem(422, 'VALIDATION_ERROR', 'Statut inconnu');
  }
  if (typeof body.revision !== 'number') {
    return problem(422, 'VALIDATION_ERROR', 'Révision manquante');
  }
  const result = updateLeadStatus(id, {
    status: body.status as LeadStatus,
    revision: body.revision,
  });
  if (!result.ok) return leadMutationFailure(result.code);
  return { status: 200, body: result.value };
}

function leadsNote(request: MockRequest, id: string): MockResponse {
  const failure = requireSessionAndCsrf(request) ?? leadsGuard('notes');
  if (failure) return failure;
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  const body = (request.body ?? {}) as { body?: string };
  const text = (body.body ?? '').trim();
  if (text.length === 0) {
    return problem(422, 'VALIDATION_ERROR', 'Le commentaire est obligatoire');
  }
  const result = addLeadNote(id, {
    body: text,
    author_name: current.account.user.display_name,
  });
  if (!result.ok) return leadMutationFailure(result.code);
  return { status: 201, body: result.value };
}

function leadsExport(request: MockRequest): MockResponse {
  const failure = leadsGuard('export');
  if (failure) return failure;
  return {
    status: 200,
    body: exportLeadsCsv(leadQuery(request)),
    headers: { 'Content-Type': 'text/csv; charset=utf-8' },
  };
}

// ── Médiathèque (démo uniquement) ──────────────────────────────
function mediaList(request: MockRequest): MockResponse {
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  if (!can(current.account, 'media', 'view')) return problem(403, 'FORBIDDEN', 'Permission insuffisante');
  const limit = Number(request.query.limit ?? 24);
  const offset = Number(request.query.offset ?? 0);
  return {
    status: 200,
    body: listMockMedia({
      kind: typeof request.query.kind === 'string' ? request.query.kind : undefined,
      search: typeof request.query.search === 'string' ? request.query.search : undefined,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 24,
      offset: Number.isFinite(offset) && offset > 0 ? offset : 0,
    }),
  };
}

function mediaDetail(id: string): MockResponse {
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  if (!can(current.account, 'media', 'view')) return problem(403, 'FORBIDDEN', 'Permission insuffisante');
  const item = findMockMedia(id);
  return item ? { status: 200, body: item } : problem(404, 'CONTENT_NOT_FOUND', 'Média inconnu');
}

/** Motif de refus lisible par la machine, en plus du message serveur. */
function uploadRejected(reason: 'MIME_NOT_ALLOWED' | 'TOO_LARGE' | 'INFECTED', detail: string): MockResponse {
  return {
    status: 415,
    body: {
      type: 'https://exauceac.com/errors/upload_rejected',
      title: 'upload rejected',
      status: 415,
      code: 'UPLOAD_REJECTED',
      detail,
      errors: [{ field: 'file', code: reason, message: detail }],
    },
  };
}

function uploadMedia(request: MockRequest): MockResponse {
  const failure = requireSessionAndCsrf(request);
  if (failure) return failure;
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  if (!can(current.account, 'media', 'create')) {
    return problem(403, 'FORBIDDEN', 'Permission insuffisante');
  }

  // Le vrai endpoint reçoit un multipart : le mock reçoit les métadonnées.
  const payload = (request.body ?? {}) as {
    filename?: string;
    mime?: string;
    size_bytes?: number;
    kind?: string;
  };
  const filename = (payload.filename ?? '').trim();
  const mime = (payload.mime ?? '').trim().toLowerCase();
  const size = Number(payload.size_bytes ?? 0);
  const kind = payload.kind;

  if (!filename || !mime) return problem(422, 'VALIDATION_ERROR', 'Fichier ou type MIME absent');
  if (filename.toLowerCase().includes('eicar')) {
    return uploadRejected('INFECTED', 'Fichier rejeté par l’analyse antivirus');
  }
  if (kind !== 'image' && kind !== 'pdf' && kind !== 'document') {
    return problem(422, 'VALIDATION_ERROR', 'Type de média inconnu');
  }
  if (!isAcceptedMime(mime, kind)) {
    return uploadRejected('MIME_NOT_ALLOWED', `Type de fichier non autorisé : ${mime}`);
  }
  if (!Number.isFinite(size) || size <= 0) {
    return problem(422, 'VALIDATION_ERROR', 'Taille de fichier invalide');
  }
  if (size > MAX_UPLOAD_BYTES) {
    return uploadRejected('TOO_LARGE', `Fichier trop volumineux (maximum ${MAX_UPLOAD_BYTES} octets)`);
  }

  const item = createMockMedia({ filename, mime, size_bytes: size, kind });
  if (!item) return problem(422, 'VALIDATION_ERROR', 'Type de média inconnu');
  return { status: 201, body: item };
}

function removeMedia(request: MockRequest, id: string): MockResponse {
  const failure = requireSessionAndCsrf(request);
  if (failure) return failure;
  const current = currentAccount();
  if (!current) return problem(401, 'SESSION_EXPIRED', 'Session expirée');
  if (!can(current.account, 'media', 'delete')) {
    return problem(403, 'FORBIDDEN', 'Permission insuffisante');
  }
  const result = deleteMockMedia(id);
  if (result === 'not_found') return problem(404, 'CONTENT_NOT_FOUND', 'Média inconnu');
  if (result === 'in_use') {
    const usages = getMockMediaUsages(id).map((usage) => usage.label);
    return {
      status: 409,
      body: {
        type: 'https://exauceac.com/errors/conflict',
        title: 'conflict',
        status: 409,
        code: 'CONFLICT',
        detail: `Média encore référencé : ${usages.join(', ')}`,
      },
    };
  }
  return { status: 204 };
}

// ── Pages et sections (mock aligné sur le seed) ─────────────────
function pagesList(): MockResponse {
  const guard = requirePages('pages', 'view');
  if ('status' in guard) return guard;
  return { status: 200, body: listPages() };
}

function pagesDetail(id: string): MockResponse {
  const guard = requirePages('pages', 'view');
  if ('status' in guard) return guard;
  const page = findPage(id);
  return page ? { status: 200, body: pageDetail(page) } : problem(404, 'CONTENT_NOT_FOUND', 'Page inconnue');
}

function pagesPatch(request: MockRequest, id: string): MockResponse {
  const guard = requirePages('pages', 'edit');
  if ('status' in guard) return guard;
  const failure = requireSessionAndCsrf(request);
  if (failure) return failure;
  const page = findPage(id);
  if (!page) return problem(404, 'CONTENT_NOT_FOUND', 'Page inconnue');
  const payload = (request.body ?? {}) as { revision?: number };
  if (typeof payload.revision !== 'number') {
    return problem(422, 'VALIDATION_ERROR', 'Révision absente');
  }
  const result = updatePage(id, {
    revision: payload.revision,
    is_in_nav: typeof (request.body as { is_in_nav?: boolean }).is_in_nav === 'boolean'
      ? (request.body as { is_in_nav: boolean }).is_in_nav
      : undefined,
    nav_position:
      (request.body as { nav_position?: number | null }).nav_position === undefined
        ? undefined
        : (request.body as { nav_position: number | null }).nav_position,
  });
  return result.ok ? { status: 200, body: result.value } : mutationFailure(result);
}

function sectionsCreate(request: MockRequest, pageId: string): MockResponse {
  const guard = requirePages('pages', 'edit');
  if ('status' in guard) return guard;
  const failure = requireSessionAndCsrf(request);
  if (failure) return failure;
  const payload = (request.body ?? {}) as {
    revision?: number;
    section_type?: string;
    position?: number;
    is_active?: boolean;
  };
  if (!payload.section_type || typeof payload.revision !== 'number') {
    return problem(422, 'VALIDATION_ERROR', 'Type de section ou révision absent');
  }
  const result = addSection(pageId, {
    revision: payload.revision,
    section_type: payload.section_type,
    position: payload.position,
    is_active: payload.is_active,
  });
  return result.ok
    ? { status: 201, body: { page: result.value.page, section: result.value.section } }
    : mutationFailure(result);
}

function sectionPatch(request: MockRequest, id: string): MockResponse {
  const body = (request.body ?? {}) as {
    revision?: number;
    lang?: 'fr' | 'en';
    position?: number;
    is_active?: boolean;
    config?: Record<string, unknown>;
    data?: Record<string, unknown>;
  };
  const guard = requirePages('pages', 'edit', body.lang);
  if ('status' in guard) return guard;
  const failure = requireSessionAndCsrf(request);
  if (failure) return failure;
  if (typeof body.revision !== 'number') return problem(422, 'VALIDATION_ERROR', 'Révision absente');

  const result = updateSection(id, {
    revision: body.revision,
    position: body.position,
    is_active: body.is_active,
    config: body.config,
    lang: body.lang,
    data: body.data,
  });
  return result.ok
    ? { status: 200, body: { page: result.value.page, section: result.value.section } }
    : mutationFailure(result);
}

function sectionDelete(request: MockRequest, id: string): MockResponse {
  const guard = requirePages('pages', 'delete');
  if ('status' in guard) return guard;
  const failure = requireSessionAndCsrf(request);
  if (failure) return failure;
  const revision = Number((request.body as { revision?: number } | undefined)?.revision);
  if (!Number.isFinite(revision)) return problem(422, 'VALIDATION_ERROR', 'Révision absente');
  const result = deleteSection(id, revision);
  return result.ok ? { status: 200, body: result.value } : mutationFailure(result);
}

function pageWorkflow(request: MockRequest, id: string): MockResponse {
  const body = (request.body ?? {}) as { action?: WorkflowAction; revision?: number; comment?: string };
  const action = body.action;
  if (!action || !['submit_review', 'approve', 'reject', 'publish'].includes(action)) {
    return problem(422, 'VALIDATION_ERROR', 'Action inconnue');
  }
  const required: Record<WorkflowAction, string> = {
    submit_review: 'edit',
    approve: 'review',
    reject: 'review',
    publish: 'publish',
  };
  const guard = requirePages('pages', required[action]);
  if ('status' in guard) return guard;
  const failure = requireSessionAndCsrf(request);
  if (failure) return failure;
  if (typeof body.revision !== 'number') return problem(422, 'VALIDATION_ERROR', 'Révision absente');
  const result = transitionPage(id, action, body.revision, guard.account.user.id, body.comment);
  return result.ok ? { status: 200, body: result.value } : mutationFailure(result);
}

function sectionTypes(): MockResponse {
  const guard = requirePages('pages', 'view');
  if ('status' in guard) return guard;
  return { status: 200, body: { items: listSectionTypes() } };
}

/** Routeur du backend mock : toute route non couverte renvoie 501. */
export async function mockRequest(request: MockRequest): Promise<MockResponse> {
  await delay();
  const route = `${request.method} ${request.path}`;

  if (route === 'POST /admin/publication-jobs') return triggerPublication(request);
  if (route === 'GET /admin/publication-jobs/current') return publicationStatus();
  if (route === 'GET /admin/pages') return pagesList();
  if (route === 'GET /admin/section-types') return sectionTypes();

  const pageWorkflowMatch = request.path.match(/^\/admin\/pages\/([^/]+)\/workflow$/);
  if (pageWorkflowMatch && request.method === 'POST') {
    return pageWorkflow(request, pageWorkflowMatch[1]);
  }

  const pageSections = request.path.match(/^\/admin\/pages\/([^/]+)\/sections$/);
  if (pageSections && request.method === 'POST') return sectionsCreate(request, pageSections[1]);

  const pageId = request.path.match(/^\/admin\/pages\/([^/]+)$/);
  if (pageId && request.method === 'GET') return pagesDetail(pageId[1]);
  if (pageId && request.method === 'PATCH') return pagesPatch(request, pageId[1]);

  const sectionId = request.path.match(/^\/admin\/sections\/([^/]+)$/);
  if (sectionId && request.method === 'PATCH') return sectionPatch(request, sectionId[1]);
  if (sectionId && request.method === 'DELETE') return sectionDelete(request, sectionId[1]);

  if (request.method === 'GET' && request.path === '/admin/offices') {
    const guard = requirePages('offices', 'view');
    if ('status' in guard) return guard;
    return { status: 200, body: { items: listOffices() } };
  }
  if (request.method === 'POST' && request.path === '/admin/offices') return officesCreate(request);

  const officeId = request.path.match(/^\/admin\/offices\/([^/]+)$/);
  if (officeId && request.method === 'PATCH') return officesPatch(request, officeId[1]);
  if (officeId && request.method === 'DELETE') return officesDelete(officeId[1]);

  if (request.method === 'GET' && request.path === '/admin/leads/export.csv') {
    return leadsExport(request);
  }

  const leadStatus = request.path.match(/^\/admin\/leads\/([^/]+)\/status$/);
  if (request.method === 'PATCH' && leadStatus) return leadsStatus(request, leadStatus[1]);

  const leadNotes = request.path.match(/^\/admin\/leads\/([^/]+)\/notes$/);
  if (request.method === 'POST' && leadNotes) return leadsNote(request, leadNotes[1]);

  const leadId = request.path.match(/^\/admin\/leads\/([^/]+)$/);
  if (request.method === 'GET' && leadId) return leadsDetail(leadId[1]);

  const mediaId = request.path.match(new RegExp('^/admin/media/([^/]+)$'));
  if (mediaId && request.method === 'GET') return mediaDetail(mediaId[1]);
  if (mediaId && request.method === 'DELETE') return removeMedia(request, mediaId[1]);

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
    case 'GET /admin/reports/dashboard':
      return dashboard();
    case 'GET /admin/publication-jobs':
      return publicationJobs(request);
    case 'GET /admin/notifications':
      return notifications(request);
    case 'GET /admin/leads':
      return leadsList(request);
    case 'GET /admin/leads/export.csv':
      return leadsExport(request);
    case 'GET /admin/media':
      return mediaList(request);
    case 'POST /admin/media/upload':
      return uploadMedia(request);
    default:
      return problem(501, 'NOT_IMPLEMENTED', `Route non couverte par le mock : ${route}`);
  }
}
