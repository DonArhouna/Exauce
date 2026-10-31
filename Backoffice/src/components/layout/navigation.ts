import {
  Building2,
  FileText,
  Handshake,
  History,
  Images,
  Inbox,
  LayoutDashboard,
  MapPin,
  Network,
  Newspaper,
  Route,
  Rocket,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/services/api/types';
import { hasAnyPermission } from '@/services/auth/permissions';

export interface NavPermission {
  module: string;
  action: string;
}

export interface NavItem {
  key: string;
  path: string;
  labelKey: string;
  icon: LucideIcon;
  permission?: NavPermission;
}

export interface NavGroup {
  key: string;
  labelKey: string;
  items: NavItem[];
}

/**
 * Mapping écran → permission. Le contrat OpenAPI ne déclare pas encore
 * `x-permission` sur tous les endpoints : ce fichier est la source UI à
 * aligner avec `GET /admin/permissions` (voir README).
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'pilotage',
    labelKey: 'nav.groups.pilotage',
    items: [
      {
        key: 'dashboard',
        path: '/tableau-de-bord',
        labelKey: 'nav.dashboard',
        icon: LayoutDashboard,
        permission: { module: 'audit', action: 'view' },
      },
    ],
  },
  {
    key: 'content',
    labelKey: 'nav.groups.content',
    items: [
      { key: 'services', path: '/services', labelKey: 'nav.services', icon: Network, permission: { module: 'tree', action: 'view' } },
      { key: 'pages', path: '/pages', labelKey: 'nav.pages', icon: FileText, permission: { module: 'pages', action: 'view' } },
      { key: 'sectors', path: '/secteurs', labelKey: 'nav.sectors', icon: Building2, permission: { module: 'pages', action: 'view' } },
      { key: 'interventions', path: '/interventions', labelKey: 'nav.interventions', icon: Handshake, permission: { module: 'pages', action: 'view' } },
      { key: 'publications', path: '/publications', labelKey: 'nav.publications', icon: Newspaper, permission: { module: 'publications', action: 'view' } },
      { key: 'offices', path: '/bureaux', labelKey: 'nav.offices', icon: MapPin, permission: { module: 'offices', action: 'view' } },
      { key: 'team', path: '/equipe', labelKey: 'nav.team', icon: Users, permission: { module: 'team', action: 'view' } },
    ],
  },
  {
    key: 'relations',
    labelKey: 'nav.groups.relations',
    items: [
      { key: 'leads', path: '/demandes', labelKey: 'nav.leads', icon: Inbox, permission: { module: 'leads', action: 'view' } },
    ],
  },
  {
    key: 'media',
    labelKey: 'nav.groups.media',
    items: [
      { key: 'media', path: '/mediatheque', labelKey: 'nav.media', icon: Images, permission: { module: 'media', action: 'view' } },
    ],
  },
  {
    key: 'site',
    labelKey: 'nav.groups.site',
    items: [
      { key: 'redirects', path: '/redirections', labelKey: 'nav.redirects', icon: Route, permission: { module: 'seo', action: 'view' } },
      { key: 'versions', path: '/versions', labelKey: 'nav.versions', icon: History, permission: { module: 'pages', action: 'view' } },
      { key: 'publishing', path: '/publication', labelKey: 'nav.publishing', icon: Rocket, permission: { module: 'pages', action: 'view' } },
    ],
  },
  {
    key: 'administration',
    labelKey: 'nav.groups.administration',
    items: [
      { key: 'users', path: '/utilisateurs', labelKey: 'nav.users', icon: Users, permission: { module: 'users', action: 'view' } },
      { key: 'roles', path: '/roles', labelKey: 'nav.roles', icon: ShieldCheck, permission: { module: 'users', action: 'view' } },
      { key: 'settings', path: '/parametres', labelKey: 'nav.settings', icon: Settings, permission: { module: 'settings', action: 'view' } },
      { key: 'audit', path: '/audit', labelKey: 'nav.audit', icon: ScrollText, permission: { module: 'audit', action: 'view' } },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** Pages hors navigation (menu utilisateur). */
export const EXTRA_PAGES: Record<string, string> = {
  '/profil': 'userMenu.profile',
  '/mot-de-passe': 'userMenu.changePassword',
  '/preferences': 'userMenu.preferences',
};

/** Filtré côté UI : une entrée non autorisée n'apparaît pas. */
export function visibleGroups(permissions: Permission[]): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permission || hasAnyPermission(permissions, item.permission.module, item.permission.action),
    ),
  })).filter((group) => group.items.length > 0);
}

export function visibleItems(permissions: Permission[]): NavItem[] {
  return visibleGroups(permissions).flatMap((group) => group.items);
}

/** Élément de navigation correspondant à un chemin (exact puis préfixe). */
export function findNavItem(pathname: string): NavItem | undefined {
  const exact = NAV_ITEMS.find((item) => item.path === pathname);
  if (exact) return exact;
  return NAV_ITEMS.filter((item) => pathname.startsWith(`${item.path}/`)).sort(
    (a, b) => b.path.length - a.path.length,
  )[0];
}
