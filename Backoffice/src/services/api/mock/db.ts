import type { AdminSessionUser, Permission } from '../types';

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

let accounts = createInitialAccounts();
let session: MockSession | null = null;
const attempts = new Map<string, MockAttempt>();

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

/** Remet le backend mock dans son état initial. */
export function resetMockBackend(): void {
  accounts = createInitialAccounts();
  session = null;
  attempts.clear();
}
