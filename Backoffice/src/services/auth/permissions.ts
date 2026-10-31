import type { Permission } from '../api/types';

/**
 * Le serveur reste l'autorité : ces helpers ne servent qu'à masquer les
 * entrées non autorisées. Une permission `lang=null` couvre toutes les langues.
 */
export function hasPermission(
  permissions: Permission[],
  module: string,
  action: string,
  lang?: string,
): boolean {
  return permissions.some(
    (permission) =>
      permission.module === module &&
      permission.action === action &&
      (lang === undefined || permission.lang == null || permission.lang === lang),
  );
}

/** Vrai si l'utilisateur détient la permission sur au moins une langue. */
export function hasAnyPermission(permissions: Permission[], module: string, action: string): boolean {
  return hasPermission(permissions, module, action);
}
