/**
 * Integration tests for GET /api/user/me
 * Tests authentication and user retrieval
 * Uses existing seed data from test:db:setup
 */
import { describe, it, expect, afterAll, beforeEach, vi } from 'vitest';
import { prisma, disconnectDatabase } from '../../setup/db';
import { mockUsers } from '../../setup/auth-mock';

// Mock the auth module
const mockGetSession = vi.fn();
vi.mock('~/lib/auth/server', () => ({
  auth: {
    getSession: () => mockGetSession(),
  },
}));

// Import route handler after mocking
import { GET } from '~/app/api/user/me/route';

describe('GET /api/user/me', () => {
  const createdUserEmails: string[] = [];

  afterAll(async () => {
    // Cleanup any users we created
    if (createdUserEmails.length > 0) {
      await prisma.user.deleteMany({
        where: { email: { in: createdUserEmails } },
      });
    }
    await disconnectDatabase();
  });

  beforeEach(() => {
    mockGetSession.mockReset();
  });

  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: null });

      const response = await GET();

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Authentification requise');
    });

    it('returns 401 if session has no email', async () => {
      mockGetSession.mockResolvedValue({ data: { user: {} } });

      const response = await GET();

      expect(response.status).toBe(401);
    });

    it('returns 401 if user object is missing', async () => {
      mockGetSession.mockResolvedValue({ data: {} });

      const response = await GET();

      expect(response.status).toBe(401);
    });
  });

  describe('Existing User', () => {
    it('returns user data for ADMIN', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.email).toBe('admin@klip.test');
      expect(body.role).toBe('ADMIN');
      expect(body.firstname).toBe('Jean');
      expect(body.lastname).toBe('Admin');
    });

    it('returns user data for ROUTE_SETTER', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.routeSetter },
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.email).toBe('ouvreur@klip.test');
      expect(body.role).toBe('ROUTE_SETTER');
    });

    it('returns user data for CONTRIBUTOR', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.contributor },
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.email).toBe('marie@klip.test');
      expect(body.role).toBe('CONTRIBUTOR');
    });
  });

  describe('New User', () => {
    it('creates user if not exists', async () => {
      const testEmail = 'newuser-api-me@example.com';
      createdUserEmails.push(testEmail);

      mockGetSession.mockResolvedValue({
        data: { user: { email: testEmail, name: 'New ApiUser' } },
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.email).toBe(testEmail);
      expect(body.role).toBe('CONTRIBUTOR'); // Default role
      expect(body.firstname).toBe('New');
      expect(body.lastname).toBe('ApiUser');
    });

    it('creates user without name', async () => {
      const testEmail = 'newuser-noname@example.com';
      createdUserEmails.push(testEmail);

      mockGetSession.mockResolvedValue({
        data: { user: { email: testEmail } },
      });

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.email).toBe(testEmail);
      expect(body.firstname).toBe('');
      expect(body.lastname).toBe('');
    });
  });

  describe('Response Format', () => {
    it('includes all expected fields', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const response = await GET();
      const body = await response.json();

      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('email');
      expect(body).toHaveProperty('firstname');
      expect(body).toHaveProperty('lastname');
      expect(body).toHaveProperty('role');
    });

    it('does not include sensitive fields', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const response = await GET();
      const body = await response.json();

      // These fields should not be exposed
      expect(body).not.toHaveProperty('password');
      expect(body).not.toHaveProperty('createdAt');
      expect(body).not.toHaveProperty('updatedAt');
    });
  });
});
