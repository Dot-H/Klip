/**
 * User roles - shared between client and server
 */

export type UserRole = 'ADMIN' | 'ROUTE_SETTER' | 'CONTRIBUTOR';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  ROUTE_SETTER: 'Ouvreur',
  CONTRIBUTOR: 'Contributeur',
};

/**
 * Whether a role is allowed to see route/pitch cotations.
 * Non-connected users (role === null/undefined) cannot.
 */
export function canViewCotation(role: UserRole | null | undefined): boolean {
  return role === 'ADMIN' || role === 'ROUTE_SETTER';
}
