# Exigences bloquantes — API leads

> Note de travail (2026-11-07). Ne modifie pas le contrat OpenAPI : les
> endpoints leads seront ajoutés par la PR de contrat unique (Backoffice).

## Export et anonymisation : audit obligatoire

- L'export des leads et l'anonymisation d'un lead doivent écrire une ligne
  `audit_log` **append-only** (acteur, action, entité, horodatage) dans la
  même transaction que l'opération.
- Un test d'intégration doit vérifier qu'un export crée exactement une ligne
  d'audit, et qu'une anonymisation en crée une également.
- Ces deux actions sont **bloquantes** : ni l'export ni l'anonymisation ne
  sont livrés sans leur ligne d'audit et son test.
- MFA : `admin` et `crm` sont déjà dans `MFA_MANDATORY_ROLES` ; l'accès aux
  endpoints leads exige donc une session MFA active.

## État actuel (2026-11-07)

- `AuditLog` existe et est append-only (`Backend/app/models/leads.py`).
- Aucun endpoint leads n'existe encore (`Backend/app/api` = `admin_auth`,
  `deps`, `health`). Le test « un export crée une ligne d'audit » est donc
  différé à l'implémentation de l'API leads.
