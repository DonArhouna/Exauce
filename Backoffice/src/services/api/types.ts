import type { components } from './generated/schema';

/** Schémas générés depuis Analyse/modelisation/docs/openapi.yaml. */
export type Schemas = components['schemas'];

export type Problem = Schemas['Problem'];
export type Permission = Schemas['Permission'];
export type AdminSessionUser = Schemas['AdminSessionUser'];
export type AdminLoginRequest = Schemas['AdminLoginRequest'];
export type AdminLoginResponse = Schemas['AdminLoginResponse'];
export type AdminLoginAuthenticated = Schemas['AdminLoginAuthenticated'];
export type AdminLoginMfaRequired = Schemas['AdminLoginMfaRequired'];
export type AdminMeResponse = Schemas['AdminMeResponse'];
export type AdminActivateRequest = Schemas['AdminActivateRequest'];
export type AdminPasswordForgotRequest = Schemas['AdminPasswordForgotRequest'];
export type AdminPasswordResetRequest = Schemas['AdminPasswordResetRequest'];
export type AdminPasswordChangeRequest = Schemas['AdminPasswordChangeRequest'];
export type PublicationJob = Schemas['PublicationJob'];
export type PublicationSiteStatus = Schemas['PublicationSiteStatus'];
export type AdminDashboard = Schemas['AdminDashboard'];
export type AdminNotification = Schemas['AdminNotification'];
export type AdminNotificationList = Schemas['AdminNotificationList'];
export type AuditEntry = Schemas['AuditEntry'];
export type LeadSummary = Schemas['LeadSummary'];
