import { USER_ROLE_LABELS, type UserRole } from '../roles';

describe('USER_ROLE_LABELS', () => {
  it('has labels for all three roles', () => {
    expect(Object.keys(USER_ROLE_LABELS)).toHaveLength(3);
    expect(USER_ROLE_LABELS).toHaveProperty('ADMIN');
    expect(USER_ROLE_LABELS).toHaveProperty('ROUTE_SETTER');
    expect(USER_ROLE_LABELS).toHaveProperty('CONTRIBUTOR');
  });

  it('has French labels for admin', () => {
    expect(USER_ROLE_LABELS.ADMIN).toBe('Admin');
  });

  it('has French labels for route setter', () => {
    expect(USER_ROLE_LABELS.ROUTE_SETTER).toBe('Ouvreur');
  });

  it('has French labels for contributor', () => {
    expect(USER_ROLE_LABELS.CONTRIBUTOR).toBe('Contributeur');
  });

  it('does not expose raw enum values', () => {
    const labels = Object.values(USER_ROLE_LABELS);
    expect(labels).not.toContain('ADMIN');
    expect(labels).not.toContain('ROUTE_SETTER');
    expect(labels).not.toContain('CONTRIBUTOR');
  });

  it('can be used to map a role to its label', () => {
    const role: UserRole = 'ADMIN';
    expect(USER_ROLE_LABELS[role]).toBe('Admin');
  });

  it('provides type-safe access to labels', () => {
    // This test verifies the type system works correctly
    const roles: UserRole[] = ['ADMIN', 'ROUTE_SETTER', 'CONTRIBUTOR'];
    const labels = roles.map(role => USER_ROLE_LABELS[role]);
    expect(labels).toEqual(['Admin', 'Ouvreur', 'Contributeur']);
  });
});
