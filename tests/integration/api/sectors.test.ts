/**
 * Integration tests for POST /api/crag/[cragId]/sectors
 * Tests authentication, authorization, and validation
 * Uses existing seed data from test:db:setup
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
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
import { POST } from '~/app/api/crag/[cragId]/sectors/route';

describe('POST /api/crag/[cragId]/sectors', () => {
  let testCragId: string;
  let createdSectorIds: string[] = [];

  beforeAll(async () => {
    // Get a crag to use for tests
    const crag = await prisma.crag.findFirst();
    if (!crag) throw new Error('No crag found in test database');
    testCragId = crag.id;
  });

  afterAll(async () => {
    // Clean up created sectors
    for (const sectorId of createdSectorIds) {
      await prisma.sector.delete({ where: { id: sectorId } }).catch(() => {});
    }
    await disconnectDatabase();
  });

  beforeEach(() => {
    mockGetSession.mockReset();
  });

  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: null });

      const request = new NextRequest(`http://localhost/api/crag/${testCragId}/sectors`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Sector',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ cragId: testCragId }) });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Authentification requise');
    });

    it('returns 401 if session has no email', async () => {
      mockGetSession.mockResolvedValue({ data: { user: {} } });

      const request = new NextRequest(`http://localhost/api/crag/${testCragId}/sectors`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Sector',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ cragId: testCragId }) });

      expect(response.status).toBe(401);
    });
  });

  describe('Authorization', () => {
    it('returns 403 for CONTRIBUTOR users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.contributor },
      });

      const request = new NextRequest(`http://localhost/api/crag/${testCragId}/sectors`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Sector',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ cragId: testCragId }) });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Seuls les ouvreurs et administrateurs peuvent creer des secteurs');
    });

    it('returns 403 for unknown users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.unknown },
      });

      const request = new NextRequest(`http://localhost/api/crag/${testCragId}/sectors`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Sector',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ cragId: testCragId }) });

      expect(response.status).toBe(403);
    });

    it('allows ADMIN users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest(`http://localhost/api/crag/${testCragId}/sectors`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Admin Sector',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ cragId: testCragId }) });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      createdSectorIds.push(body.id);
    });

    it('allows ROUTE_SETTER users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.routeSetter },
      });

      const request = new NextRequest(`http://localhost/api/crag/${testCragId}/sectors`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Route Setter Sector',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ cragId: testCragId }) });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      createdSectorIds.push(body.id);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });
    });

    it('validates cragId is a valid UUID', async () => {
      const request = new NextRequest('http://localhost/api/crag/not-a-uuid/sectors', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Sector',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ cragId: 'not-a-uuid' }) });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('ID de site invalide');
    });

    it('validates name is required', async () => {
      const request = new NextRequest(`http://localhost/api/crag/${testCragId}/sectors`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request, { params: Promise.resolve({ cragId: testCragId }) });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Le nom est requis');
    });

    it('validates name cannot be empty', async () => {
      const request = new NextRequest(`http://localhost/api/crag/${testCragId}/sectors`, {
        method: 'POST',
        body: JSON.stringify({
          name: '',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ cragId: testCragId }) });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Le nom est requis');
    });

    it('validates name max length', async () => {
      const request = new NextRequest(`http://localhost/api/crag/${testCragId}/sectors`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'a'.repeat(201),
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ cragId: testCragId }) });

      expect(response.status).toBe(400);
    });
  });

  describe('Not Found', () => {
    it('returns 404 for non-existent crag', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const nonExistentCragId = '00000000-0000-0000-0000-000000000000';
      const request = new NextRequest(`http://localhost/api/crag/${nonExistentCragId}/sectors`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Sector',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ cragId: nonExistentCragId }) });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Site non trouvé');
    });
  });

  describe('Success', () => {
    it('creates sector and returns id', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest(`http://localhost/api/crag/${testCragId}/sectors`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Success Test Sector',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ cragId: testCragId }) });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      createdSectorIds.push(body.id);

      // Verify sector was created correctly
      const sector = await prisma.sector.findUnique({
        where: { id: body.id },
      });
      expect(sector).not.toBeNull();
      expect(sector!.name).toBe('Success Test Sector');
      expect(sector!.cragId).toBe(testCragId);
    });
  });
});
