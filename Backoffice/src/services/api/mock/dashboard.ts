import type { AdminDashboard, AuditEntry, LeadSummary } from '../types';
import { getMockPublicationStatus } from './db';

const RECENT_LEADS: LeadSummary[] = [
  {
    id: 'cccccccc-0001-4001-8001-000000000001',
    name: 'Société Démo SARL',
    email: 'contact@demo.example',
    subject: 'Demande d’accompagnement comptable',
    status: 'new',
    created_at: '2026-10-31T08:45:00Z',
  },
  {
    id: 'cccccccc-0002-4002-8002-000000000002',
    name: 'Entreprise Test SA',
    email: 'direction@test.example',
    subject: 'Demande d’audit externe',
    status: 'new',
    created_at: '2026-10-30T15:20:00Z',
  },
  {
    id: 'cccccccc-0003-4003-8003-000000000003',
    name: 'Cabinet Partenaire',
    email: 'info@partenaire.example',
    subject: 'Demande de formation',
    status: 'in_progress',
    created_at: '2026-10-29T09:10:00Z',
  },
];

const RECENT_AUDIT: AuditEntry[] = [
  {
    id: 'eeeeeeee-0001-4001-8001-000000000001',
    at: '2026-10-31T08:12:00Z',
    actor_type: 'user',
    actor_name: 'Compte fondateur',
    action: 'content.update',
    entity_type: 'page',
    entity_id: 'ffffffff-0001-4001-8001-000000000001',
    ip: null,
  },
  {
    id: 'eeeeeeee-0002-4002-8002-000000000002',
    at: '2026-10-30T17:40:00Z',
    actor_type: 'user',
    actor_name: 'Compte éditeur',
    action: 'publication.trigger',
    entity_type: 'publication_job',
    entity_id: null,
    ip: null,
  },
  {
    id: 'eeeeeeee-0003-4003-8003-000000000003',
    at: '2026-10-30T11:05:00Z',
    actor_type: 'user',
    actor_name: 'Compte fondateur',
    action: 'lead.status',
    entity_type: 'lead',
    entity_id: 'cccccccc-0003-4003-8003-000000000003',
    ip: null,
  },
  {
    id: 'eeeeeeee-0004-4004-8004-000000000004',
    at: '2026-10-29T07:30:00Z',
    actor_type: 'system',
    actor_name: null,
    action: 'content.publish',
    entity_type: 'publication',
    entity_id: null,
    ip: null,
  },
];

/** Agrégats mock : mêmes formes que `AdminDashboard` du contrat. */
export function getMockDashboard(): AdminDashboard {
  return {
    generated_at: new Date().toISOString(),
    leads: { new_count: 2, recent: RECENT_LEADS },
    publications: { draft_count: 2, in_review_count: 1 },
    content: { unpublished_changes_count: 5 },
    publication: getMockPublicationStatus(),
    i18n: { completeness_pct: 92.4, missing_count: 12 },
    audit: { recent: RECENT_AUDIT },
  };
}
