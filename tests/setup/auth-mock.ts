/**
 * Auth mocking utilities for integration tests
 * Provides mock session data for testing authenticated API endpoints
 */

export interface MockUser {
  email: string;
  name?: string;
}

export interface MockSession {
  user: MockUser;
}

/**
 * Create a mock session object
 */
export function createMockSession(user: MockUser): MockSession {
  return { user };
}

/**
 * Mock auth module for tests
 * Use this with jest.mock('~/lib/auth/server', ...)
 */
export function createAuthMock(session: MockSession | null) {
  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: session,
      }),
    },
  };
}

/**
 * Pre-configured mock users matching seed data
 */
export const mockUsers = {
  admin: { email: 'admin@klip.test', name: 'Jean Admin' },
  routeSetter: { email: 'ouvreur@klip.test', name: 'Pierre Ouvreur' },
  contributor: { email: 'marie@klip.test', name: 'Marie Grimpeuse' },
  unknown: { email: 'unknown@example.com', name: 'Unknown User' },
};
