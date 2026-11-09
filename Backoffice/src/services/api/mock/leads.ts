/**
 * Demandes de contact (mock uniquement).
 *
 * Source des statuts : `leads.status` du contrat (doc 03 §4) et seed Backend.
 * Les données sont fictives ; aucun contenu réel n'est reproduit.
 */
import type {
  AdminLeadDetail,
  AdminLeadSummary,
  LeadList,
  LeadListQuery,
  LeadStatus,
  LeadNote,
} from '../types';

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'in_progress',
  'waiting',
  'done',
  'rejected',
  'anonymized',
];

export interface LeadRecord {
  id: string;
  reference: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  sector: string | null;
  subject: string;
  message: string;
  source: string;
  status: LeadStatus;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  revision: number;
  notes: LeadNote[];
}

function lead(
  index: number,
  input: Omit<LeadRecord, 'id' | 'reference' | 'revision' | 'notes' | 'updated_at'> & {
    revision?: number;
    notes?: LeadNote[];
  },
): LeadRecord {
  return {
    ...input,
    id: `cccccccc-${String(index).padStart(4, '0')}-4001-8001-${String(index).padStart(12, '0')}`,
    reference: `DEM-2026-${String(index).padStart(3, '0')}`,
    updated_at: input.created_at,
    revision: input.revision ?? 1,
    notes: input.notes ?? [],
  };
}

let leads: LeadRecord[] = [];
let noteSequence = 0;

function initialLeads(): LeadRecord[] {
  return [
    lead(1, {
      full_name: 'Aminata Diallo',
      email: 'aminata.diallo@example.sn',
      phone: '+221 77 000 00 01',
      company: 'Sahel Distribution',
      sector: 'accompagnement comptable',
      subject: 'Accompagnement comptable mensuel',
      message:
        'Bonjour, nous cherchons un accompagnement comptable pour une PME de 18 salariés. Quels sont vos délais de mise en route ?',
      source: 'formulaire contact',
      status: 'new',
      assigned_to_name: null,
      created_at: '2026-11-05T08:45:00Z',
      revision: 2,
      notes: [
        {
          id: 'note-0001',
          author_name: 'Compte administrateur',
          body: 'Appeler avant vendredi pour qualifier le besoin.',
          created_at: '2026-11-05T10:12:00Z',
        },
      ],
    }),
    lead(2, {
      full_name: 'Moussa Ndiaye',
      email: 'm.ndiaye@example.sn',
      phone: '+221 76 000 00 02',
      company: 'Ndiaye & Frères',
      sector: 'audit externe',
      subject: 'Audit externe des comptes 2025',
      message:
        'Notre assemblée générale approche et nous devons faire certifier les comptes 2025. Pouvez-vous nous transmettre une proposition ?',
      source: 'formulaire contact',
      status: 'in_progress',
      assigned_to_name: 'Compte administrateur',
      created_at: '2026-11-04T14:20:00Z',
      revision: 3,
      notes: [
        {
          id: 'note-0002',
          author_name: 'Compte administrateur',
          body: 'Proposition envoyée le 4 novembre, relance prévue le 11.',
          created_at: '2026-11-04T16:05:00Z',
        },
      ],
    }),
    lead(3, {
      full_name: 'Fatou Sow',
      email: 'fatou.sow@example.sn',
      phone: null,
      company: 'Cabinet Sow Conseil',
      sector: 'formation',
      subject: 'Formation SYSCOHADA révisé',
      message: 'Nous souhaitons former quatre collaborateurs au SYSCOHADA révisé en décembre.',
      source: 'formulaire contact',
      status: 'waiting',
      assigned_to_name: 'Compte éditeur',
      created_at: '2026-11-02T09:10:00Z',
      revision: 2,
      notes: [
        {
          id: 'note-0003',
          author_name: 'Compte éditeur',
          body: 'En attente des dates souhaitées par le client.',
          created_at: '2026-11-02T11:30:00Z',
        },
      ],
    }),
    lead(4, {
      full_name: 'Ibrahima Ba',
      email: 'i.ba@example.sn',
      phone: '+221 78 000 00 04',
      company: 'Ba Logistique',
      sector: 'accompagnement comptable',
      subject: 'Reprise de comptabilité',
      message: 'Nous changeons de cabinet et cherchons une reprise de dossier au 1er janvier.',
      source: 'recommandation',
      status: 'done',
      assigned_to_name: 'Compte administrateur',
      created_at: '2026-10-30T11:00:00Z',
      revision: 4,
      notes: [
        {
          id: 'note-0004',
          author_name: 'Compte administrateur',
          body: 'Contrat signé le 30 octobre.',
          created_at: '2026-10-30T15:40:00Z',
        },
      ],
    }),
    lead(5, {
      full_name: 'Awa Traoré',
      email: 'awa.traore@example.sn',
      phone: '+221 70 000 00 05',
      company: null,
      sector: 'création d’entreprise',
      subject: 'Création de SARL',
      message: 'Je souhaite créer une SARL dans le conseil et connaître les étapes.',
      source: 'formulaire contact',
      status: 'new',
      assigned_to_name: null,
      created_at: '2026-10-29T16:35:00Z',
    }),
    lead(6, {
      full_name: 'Cheikh Fall',
      email: 'cheikh.fall@example.sn',
      phone: '+221 77 000 00 06',
      company: 'Fall Immobilier',
      sector: 'fiscalité',
      subject: 'Optimisation fiscale',
      message: 'Nous avons plusieurs sociétés et souhaitons un avis sur notre organisation fiscale.',
      source: 'formulaire contact',
      status: 'in_progress',
      assigned_to_name: 'Compte éditeur',
      created_at: '2026-10-28T10:05:00Z',
      revision: 2,
    }),
    lead(7, {
      full_name: 'Ndeye Gueye',
      email: 'ndeye.gueye@example.sn',
      phone: null,
      company: 'Gueye Santé',
      sector: 'audit externe',
      subject: 'Audit d’une clinique',
      message: 'Demande d’audit pour une clinique de 40 salariés.',
      source: 'formulaire contact',
      status: 'waiting',
      assigned_to_name: 'Compte administrateur',
      created_at: '2026-10-27T13:25:00Z',
      revision: 2,
    }),
    lead(8, {
      full_name: 'Ousmane Sy',
      email: 'ousmane.sy@example.sn',
      phone: '+221 76 000 00 08',
      company: 'Sy Agro',
      sector: 'accompagnement comptable',
      subject: 'Suivi comptable agricole',
      message: 'Nous cherchons un suivi trimestriel pour une exploitation agricole.',
      source: 'recommandation',
      status: 'done',
      assigned_to_name: 'Compte éditeur',
      created_at: '2026-10-24T09:00:00Z',
      revision: 3,
    }),
    lead(9, {
      full_name: 'Mariama Cissé',
      email: 'mariama.cisse@example.sn',
      phone: '+221 78 000 00 09',
      company: null,
      sector: 'formation',
      subject: 'Devis formation',
      message: 'Bonjour, je voudrais un devis pour une formation en gestion.',
      source: 'formulaire contact',
      status: 'rejected',
      assigned_to_name: 'Compte administrateur',
      created_at: '2026-10-22T17:45:00Z',
      revision: 2,
      notes: [
        {
          id: 'note-0005',
          author_name: 'Compte administrateur',
          body: 'Hors périmètre : formation non dispensée.',
          created_at: '2026-10-23T08:15:00Z',
        },
      ],
    }),
    lead(10, {
      full_name: 'Compte anonymisé',
      email: 'anonyme@example.invalid',
      phone: null,
      company: null,
      sector: null,
      subject: 'Demande supprimée',
      message: 'Contenu effacé à la demande de la personne concernée.',
      source: 'formulaire contact',
      status: 'anonymized',
      assigned_to_name: null,
      created_at: '2026-10-20T12:30:00Z',
      revision: 3,
    }),
    lead(11, {
      full_name: 'Boubacar Kane',
      email: 'b.kane@example.sn',
      phone: '+221 77 000 00 11',
      company: 'Kane Transit',
      sector: 'fiscalité',
      subject: 'Contrôle fiscal',
      message: 'Nous recevons une demande de renseignements de l’administration fiscale.',
      source: 'formulaire contact',
      status: 'new',
      assigned_to_name: null,
      created_at: '2026-11-06T07:55:00Z',
    }),
    lead(12, {
      full_name: 'Sokhna Mbaye',
      email: 'sokhna.mbaye@example.sn',
      phone: null,
      company: 'Mbaye Édition',
      sector: 'création d’entreprise',
      subject: 'Statuts et formalités',
      message: 'Pouvez-vous préparer les statuts d’une SASU ?',
      source: 'formulaire contact',
      status: 'in_progress',
      assigned_to_name: 'Compte administrateur',
      created_at: '2026-11-06T15:10:00Z',
    }),
  ];
}

leads = initialLeads();

function sortByDateDesc(list: LeadRecord[]): LeadRecord[] {
  return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function matches(record: LeadRecord, query: LeadListQuery): boolean {
  if (query.status && query.status !== 'all' && record.status !== query.status) return false;
  if (query.sector && record.sector !== query.sector) return false;
  if (query.from && record.created_at.slice(0, 10) < query.from) return false;
  if (query.to && record.created_at.slice(0, 10) > query.to) return false;
  const search = (query.search ?? '').trim().toLowerCase();
  if (!search) return true;
  return [record.reference, record.full_name, record.email, record.company, record.subject]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(search));
}

export function listLeads(query: LeadListQuery): LeadList {
  const filtered = sortByDateDesc(leads.filter((record) => matches(record, query)));
  const offset = Number.isFinite(query.offset) && query.offset > 0 ? query.offset : 0;
  const limit = Number.isFinite(query.limit) && query.limit > 0 ? query.limit : 20;
  const counts = LEAD_STATUSES.reduce(
    (acc, status) => {
      acc[status] = leads.filter((record) => record.status === status).length;
      return acc;
    },
    {} as Record<LeadStatus, number>,
  );
  return {
    items: filtered.slice(offset, offset + limit).map(summary),
    total: filtered.length,
    counts,
  };
}

function summary(record: LeadRecord): AdminLeadSummary {
  return {
    id: record.id,
    reference: record.reference,
    full_name: record.full_name,
    email: record.email,
    phone: record.phone,
    company: record.company,
    sector: record.sector,
    subject: record.subject,
    source: record.source,
    status: record.status,
    assigned_to_name: record.assigned_to_name,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export function leadDetail(id: string): AdminLeadDetail | undefined {
  const record = leads.find((entry) => entry.id === id);
  if (!record) return undefined;
  return {
    ...summary(record),
    message: record.message,
    revision: record.revision,
    notes: [...record.notes].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}

export type LeadMutationFailure = 'not_found' | 'conflict' | 'immutable';

export interface LeadMutationError {
  ok: false;
  code: LeadMutationFailure;
}

export type LeadMutationResult =
  | { ok: true; value: AdminLeadDetail }
  | LeadMutationError;

/** Changement de statut avec verrou optimiste (`revision`). */
export function updateLeadStatus(
  id: string,
  input: { status: LeadStatus; revision: number },
): LeadMutationResult {
  const record = leads.find((entry) => entry.id === id);
  if (!record) return { ok: false, code: 'not_found' };
  if (record.status === 'anonymized') return { ok: false, code: 'immutable' };
  if (input.revision !== record.revision) return { ok: false, code: 'conflict' };

  const now = new Date().toISOString();
  leads = leads.map((entry) =>
    entry.id === id
      ? {
          ...entry,
          status: input.status,
          revision: entry.revision + 1,
          updated_at: now,
          // Un statut terminal libère l'assignation affichée.
          assigned_to_name:
            input.status === 'done' || input.status === 'rejected' || input.status === 'anonymized'
              ? null
              : entry.assigned_to_name,
        }
      : entry,
  );
  if (input.status === 'anonymized') {
    leads = leads.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            full_name: 'Compte anonymisé',
            email: 'anonyme@example.invalid',
            phone: null,
            company: null,
            message: 'Contenu effacé à la demande de la personne concernée.',
            notes: [],
          }
        : entry,
    );
  }
  return { ok: true, value: leadDetail(id) as AdminLeadDetail };
}

/** Ajout d'une note interne ; le statut n'est pas modifié. */
export function addLeadNote(
  id: string,
  input: { body: string; author_name: string },
): LeadMutationResult {
  const record = leads.find((entry) => entry.id === id);
  if (!record) return { ok: false, code: 'not_found' };
  if (record.status === 'anonymized') return { ok: false, code: 'immutable' };
  const body = input.body.trim();
  if (!body) return { ok: false, code: 'immutable' };

  noteSequence += 1;
  const note: LeadNote = {
    id: `note-${String(noteSequence).padStart(4, '0')}`,
    author_name: input.author_name,
    body,
    created_at: new Date().toISOString(),
  };
  leads = leads.map((entry) =>
    entry.id === id
      ? { ...entry, notes: [note, ...entry.notes], revision: entry.revision + 1, updated_at: note.created_at }
      : entry,
  );
  return { ok: true, value: leadDetail(id) as AdminLeadDetail };
}

/** En-têtes de l'export, dans l'ordre des colonnes produites ci-dessous. */
export const LEADS_CSV_HEADER = [
  'Référence',
  'Créée le',
  'Statut',
  'Nom',
  'E-mail',
  'Téléphone',
  'Société',
  'Secteur',
  'Sujet',
  'Message',
];

/**
 * Neutralise une formule : Excel et LibreOffice interprètent une cellule
 * commençant par `=`, `+`, `-` ou `@` (même après des espaces) comme une
 * formule, ce qui permet d'exfiltrer des données. Le préfixe `'` force le
 * texte brut.
 */
function neutralizeFormula(value: string): string {
  const leading = value.replace(/^[\s]+/, '');
  return /^[=+\-@]/.test(leading) ? `'${value}` : value;
}

/** Cellule CSV : guillemets systématiques, guillemets internes doublés. */
export function csvCell(value: string | null): string {
  if (value === null) return '""';
  return `"${neutralizeFormula(value).replace(/"/g, '""')}"`;
}

/** Construit le CSV à partir d'une liste de demandes (export et tests). */
export function leadsToCsv(records: LeadRecord[]): string {
  const lines = records.map((record) =>
    [
      record.reference,
      record.created_at,
      record.status,
      record.full_name,
      record.email,
      record.phone,
      record.company,
      record.sector,
      record.subject,
      record.message,
    ]
      .map((value) => csvCell(value))
      .join(','),
  );
  return [LEADS_CSV_HEADER.map((value) => csvCell(value)).join(','), ...lines].join('\r\n');
}

/**
 * Export CSV des demandes filtrées (séparateur virgule, entêtes FR).
 *
 * Une demande anonymisée n'est jamais exportée : ses données personnelles ont
 * été effacées et l'export sert à recontacter les prospects.
 */
export function exportLeadsCsv(query: LeadListQuery): string {
  const rows = sortByDateDesc(
    leads.filter((record) => record.status !== 'anonymized' && matches(record, query)),
  );
  return leadsToCsv(rows);
}

/** Remet les demandes de démonstration à leur état initial. */
export function resetLeads(): void {
  leads = initialLeads();
  noteSequence = 0;
}
