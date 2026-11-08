import { resetMockBackend, findAccountByEmail, startSession } from '@/services/api/mock/db';
import { mockRequest } from '@/services/api/mock/backend';
import { csvCell, leadsToCsv, LEADS_CSV_HEADER, type LeadRecord } from '@/services/api/mock/leads';

const admin = 'admin@exauceac.com';

function session(email = admin) {
  const account = findAccountByEmail(email);
  if (!account) throw new Error(`compte inconnu : ${email}`);
  startSession(account.user.id);
  return account;
}

function exportRequest() {
  return mockRequest({ method: 'GET', path: '/admin/leads/export.csv', query: {}, csrfToken: null });
}

function record(overrides: Partial<LeadRecord> = {}): LeadRecord {
  return {
    id: 'cccccccc-0001-4001-8001-000000000001',
    reference: 'DEM-2026-001',
    full_name: 'Aminata Diallo',
    email: 'aminata.diallo@example.sn',
    phone: '+221 77 000 00 01',
    company: 'Sahel Distribution',
    sector: 'accompagnement comptable',
    subject: 'Accompagnement comptable mensuel',
    message: 'Bonjour, nous cherchons un accompagnement comptable.',
    source: 'formulaire contact',
    status: 'new',
    assigned_to_name: null,
    created_at: '2026-11-05T08:45:00Z',
    updated_at: '2026-11-05T08:45:00Z',
    revision: 1,
    notes: [],
    ...overrides,
  };
}

describe('export CSV des demandes', () => {
  beforeEach(() => {
    resetMockBackend();
  });

  it('refuse l’export sans la permission leads:export', async () => {
    const account = session();
    const saved = account.user.permissions;
    account.user.permissions = saved.filter(
      (permission) => !(permission.module === 'leads' && permission.action === 'export'),
    );

    const response = await exportRequest();

    account.user.permissions = saved;
    expect(response.status).toBe(403);
    expect((response.body as { code: string }).code).toBe('FORBIDDEN');
  });

  it('produit les en-têtes attendus et une ligne par demande exportable', async () => {
    session();
    const response = await exportRequest();

    expect(response.status).toBe(200);
    expect(response.headers?.['Content-Type']).toBe('text/csv; charset=utf-8');
    const lines = String(response.body).split('\r\n');
    expect(lines[0]).toBe(LEADS_CSV_HEADER.map((label) => `"${label}"`).join(','));
    // 12 demandes fictives, dont une anonymisée jamais exportée.
    expect(lines).toHaveLength(12);
    expect(lines[1].startsWith('"DEM-2026-012"')).toBe(true);
  });

  it('n’exporte jamais une demande anonymisée', async () => {
    session();
    const csv = String((await exportRequest()).body);

    expect(csv).not.toContain('anonyme@example.invalid');
    expect(csv).not.toContain('Compte anonymisé');
    expect(csv).not.toContain('anonymized');
  });

  it('échappe les guillemets, virgules et retours à la ligne', () => {
    const csv = leadsToCsv([
      record({
        full_name: 'Diallo, "Aminata"',
        message: 'Ligne 1\nLigne 2',
        company: null,
        phone: null,
      }),
    ]);
    const [, dataLine] = csv.split('\r\n');

    expect(dataLine).toContain('"Diallo, ""Aminata"""');
    expect(dataLine).toContain('"Ligne 1\nLigne 2"');
    expect(dataLine).toContain(',"",');
  });

  it('neutralise les formules dans toutes les cellules texte', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell('+221 77 000 00 01')).toBe('"\'+221 77 000 00 01"');
    expect(csvCell('-5')).toBe('"\'-5"');
    expect(csvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"');
    expect(csvCell('  =cmd|calc')).toBe('"\'  =cmd|calc"');
    expect(csvCell('Texte normal')).toBe('"Texte normal"');
    expect(csvCell(null)).toBe('""');
  });

  it('neutralise une formule saisie dans le formulaire public', () => {
    const csv = leadsToCsv([record({ full_name: '=1+1', subject: '@import' })]);

    expect(csv).not.toMatch(/(^|,)"?=1\+1/);
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"\'@import"');
  });
});
