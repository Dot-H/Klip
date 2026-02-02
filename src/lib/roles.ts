/**
 * User roles - shared between client and server
 */

export type UserRole = 'ADMIN' | 'ROUTE_SETTER' | 'CONTRIBUTOR';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  ROUTE_SETTER: 'Ouvreur',
  CONTRIBUTOR: 'Contributeur',
};
