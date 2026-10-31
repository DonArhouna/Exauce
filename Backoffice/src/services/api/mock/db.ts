import type {
  AdminNotification,
  AdminSessionUser,
  Permission,
  PublicationJob,
  PublicationSiteStatus,
} from '../types';

export interface MockAccount {
  user: AdminSessionUser;
  password: string | null;
}

export interface MockSession {
  userId: string;
  csrf: string;
  expiresAt: number;
}

export interface MockAttempt {
  count: number;
  lockedUntil: number;
}

export const DEMO = {
  invitationToken: 'exauce-invitation-demo',
  resetToken: 'exauce-reinitialisation-demo',
  totpCode: '123456',
  sessionTtlMs: 30 * 60 * 1000,
} as const;

const MODULES = [
  'pages',
  'tree',
  'publications',
  'media',
  'leads',
  'users',
  'languages',
  'offices',
  'team',
  'settings',
  'seo',
  'audit',
  'backup',
];

const ACTIONS = [
  'view',
  'create',
  'edit',
  'review',
  'publish',
  'delete',
  'move',
  'status',
  'notes',
  'export',
  'anonymize',
  'deactivate',
  'activate',
  'run',
];

const ALL_PERMISSIONS: Permission[] = MODULES.flatMap((module) =>
  ACTIONS.map((action) => ({ module, action, lang: null })),
);

const EDITOR_PERMISSIONS: Permission[] = [
  'pages:view',
  'pages:edit',
  'pages:review',
  'tree:view',
  'publications:view',
  'publications:create',
  'publications:edit',
  'media:view',
  'media:create',
  'offices:view',
  'team:view',
  'settings:view',
  'seo:view',
  'audit:view',
].map((pair) => {
  const [module, action] = pair.split(':');
  return { module, action, lang: null };
});

function makeUser(
  id: string,
  email: string,
  displayName: string,
  roleCodes: string[],
  permissions: Permission[],
  options: { mustReset?: boolean; mfaEnabled?: boolean } = {},
): AdminSessionUser {
  return {
    id,
    email,
    display_name: displayName,
    is_active: true,
    default_lang: 'fr',
    must_reset_password: options.mustReset ?? false,
    mfa_enabled: options.mfaEnabled ?? false,
    roles: roleCodes,
    permissions,
  };
}

function createInitialAccounts(): MockAccount[] {
  return [
    {
      user: makeUser(
        '11111111-1111-4111-8111-111111111111',
        'fondateur@exauceac.com',
        'Compte fondateur',
        ['super_admin'],
        ALL_PERMISSIONS,
      ),
      password: 'exauce-fondateur-2026',
    },
    {
      user: makeUser(
        '22222222-2222-4222-8222-222222222222',
        'editeur@exauceac.com',
        'Compte éditeur',
        ['editor'],
        EDITOR_PERMISSIONS,
      ),
      password: 'exauce-editeur-2026',
    },
    {
      user: makeUser(
        '33333333-3333-4333-8333-333333333333',
        'mfa@exauceac.com',
        'Compte MFA',
        ['editor'],
        EDITOR_PERMISSIONS,
        { mfaEnabled: true },
      ),
      password: 'exauce-mfa-2026',
    },
    {
      user: makeUser(
        '44444444-4444-4444-8444-444444444444',
        'invite@exauceac.com',
        'Compte invité',
        ['editor'],
        EDITOR_PERMISSIONS,
        { mustReset: true },
      ),
      password: null,
    },
  ];
}

function initialNotifications(): AdminNotification[] {
  return [
    {
      id: 'bbbbbbbb-0001-4001-8001-000000000001',
      kind: 'lead_new',
      title: 'Demande d’accompagnement comptable',
      lead_id: 'cccccccc-0001-4001-8001-000000000001',
      read_at: null,
      created_at: '2026-10-31T08:45:00Z',
    },
    {
      id: 'bbbbbbbb-0002-4002-8002-000000000002',
      kind: 'lead_new',
      title: 'Demande d’audit externe',
      lead_id: 'cccccccc-0002-4002-8002-000000000002',
      read_at: null,
      created_at: '2026-10-30T15:20:00Z',
    },
    {
      id: 'bbbbbbbb-0003-4003-8003-000000000003',
      kind: 'lead_new',
      title: 'Demande de formation',
      lead_id: 'cccccccc-0003-4003-8003-000000000003',
      read_at: '2026-10-29T10:05:00Z',
      created_at: '2026-10-29T09:10:00Z',
    },
  ];
}

function initialJobs(): PublicationJob[] {
  return [
    {
      id: 'dddddddd-0001-4001-8001-000000000001',
      status: 'success',
      triggered_by_name: 'Compte fondateur',
      step: 'sitemap',
      step_index: 6,
      step_total: 6,
      log_output: null,
      error_summary: null,
      started_at: '2026-10-28T09:10:04Z',
      completed_at: '2026-10-28T09:12:00Z',
      created_at: '2026-10-28T09:10:00Z',
    },
  ];
}

function initialStatus(): PublicationSiteStatus {
  return {
    site_status: 'pending_changes',
    current_job: null,
    last_success_at: '2026-10-28T09:12:00Z',
  };
}

let accounts = createInitialAccounts();
let session: MockSession | null = null;
const attempts = new Map<string, MockAttempt>();
let notifications = initialNotifications();
let publicationJobs = initialJobs();
let publicationStatus = initialStatus();
let buildTimers: number[] = [];
const publicationListeners = new Set<(job: PublicationJob) => void>();

export function getAccounts(): MockAccount[] {
  return accounts;
}

export function findAccountByEmail(email: string): MockAccount | undefined {
  return accounts.find((account) => account.user.email.toLowerCase() === email.toLowerCase());
}

export function findAccountById(id: string): MockAccount | undefined {
  return accounts.find((account) => account.user.id === id);
}

export function findPendingAccount(): MockAccount | undefined {
  return accounts.find((account) => account.user.must_reset_password);
}

export function getAttempts(): Map<string, MockAttempt> {
  return attempts;
}

export function getSession(): MockSession | null {
  if (!session) return null;
  if (Date.now() >= session.expiresAt) {
    session = null;
    return null;
  }
  return session;
}

export function startSession(userId: string): MockSession {
  session = {
    userId,
    csrf: `csrf-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
    expiresAt: Date.now() + DEMO.sessionTtlMs,
  };
  return session;
}

export function endSession(): void {
  session = null;
}

/** Force l'expiration côté client (tests et démonstration). */
export function expireMockSession(): void {
  if (session) session.expiresAt = Date.now() - 1;
}

// ── Notifications ────────────────────────────────────────────────
export function listMockNotifications(unreadOnly: boolean, limit: number) {
  return {
    items: notifications.filter((item) => !unreadOnly || !item.read_at).slice(0, limit),
    unread_count: notifications.filter((item) => !item.read_at).length,
  };
}

export function markMockNotificationRead(id: string): boolean {
  const notification = notifications.find((item) => item.id === id);
  if (!notification) return false;
  if (!notification.read_at) notification.read_at = new Date().toISOString();
  return true;
}

// ── Publication ─────────────────────────────────────────────────
export function getMockPublicationStatus(): PublicationSiteStatus {
  return publicationStatus;
}

export function getMockPublicationJobs(): PublicationJob[] {
  return publicationJobs;
}

/** Abonnement local reproduisant `event: publication.job`. */
export function subscribeMockPublication(listener: (job: PublicationJob) => void): () => void {
  publicationListeners.add(listener);
  return () => {
    publicationListeners.delete(listener);
  };
}

function emitPublication(job: PublicationJob): void {
  publicationListeners.forEach((listener) => listener(job));
}

function mockJobId(): string {
  const stamp = Date.now().toString(16).padStart(8, '0').slice(-8);
  return `${stamp}-0000-4000-8000-000000000000`;
}

/**
 * Simule la publication asynchrone : en file → build → succès.
 * Retourne `null` si un build est déjà en cours (409 CONFLICT).
 */
export function triggerMockPublication(): PublicationJob | null {
  if (publicationStatus.site_status === 'building') return null;

  const now = new Date().toISOString();
  const job: PublicationJob = {
    id: mockJobId(),
    status: 'queued',
    triggered_by_name: 'Compte fondateur',
    step: null,
    step_index: null,
    step_total: 6,
    log_output: null,
    error_summary: null,
    started_at: null,
    completed_at: null,
    created_at: now,
  };

  publicationJobs = [job, ...publicationJobs];
  publicationStatus = { ...publicationStatus, site_status: 'building', current_job: job };
  emitPublication(job);

  const buildingJob: PublicationJob = {
    ...job,
    status: 'building',
    step: 'render',
    step_index: 1,
    started_at: new Date().toISOString(),
  };

  buildTimers.push(
    window.setTimeout(() => {
      publicationJobs = [buildingJob, ...publicationJobs.filter((item) => item.id !== job.id)];
      publicationStatus = { ...publicationStatus, current_job: buildingJob };
      emitPublication(buildingJob);
    }, 600),
  );

  const successJob: PublicationJob = {
    ...buildingJob,
    status: 'success',
    step: 'sitemap',
    step_index: 6,
    completed_at: new Date().toISOString(),
  };

  buildTimers.push(
    window.setTimeout(() => {
      publicationJobs = [successJob, ...publicationJobs.filter((item) => item.id !== buildingJob.id)];
      publicationStatus = {
        site_status: 'up_to_date',
        current_job: successJob,
        last_success_at: successJob.completed_at,
      };
      emitPublication(successJob);
    }, 1800),
  );

  return job;
}

/** Remet le backend mock dans son état initial. */
export function resetMockBackend(): void {
  buildTimers.forEach((timer) => window.clearTimeout(timer));
  buildTimers = [];
  publicationListeners.clear();
  accounts = createInitialAccounts();
  session = null;
  attempts.clear();
  notifications = initialNotifications();
  publicationJobs = initialJobs();
  publicationStatus = initialStatus();
}
