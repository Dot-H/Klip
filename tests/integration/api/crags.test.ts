/**
 * Integration tests for POST /api/crags
 * Tests authentication, authorization, and validation
 * Uses existing seed data from test:db:setup
 */
import { describe, it, expect, afterAll, beforeEach, vi } from 'vitest';
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
import { POST } from '~/app/api/crags/route';
import { getAllCrags, getCragWithRoutes } from '~/lib/data';

describe('POST /api/crags', () => {
  let createdCragIds: string[] = [];

  afterAll(async () => {
    // Clean up created crags
    for (const cragId of createdCragIds) {
      await prisma.crag.delete({ where: { id: cragId } }).catch(() => {});
    }
    await disconnectDatabase();
  });

  beforeEach(() => {
    mockGetSession.mockReset();
  });

  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: null });

      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Crag',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Authentification requise');
    });

    it('returns 401 if session has no email', async () => {
      mockGetSession.mockResolvedValue({ data: { user: {} } });

      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Crag',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Authorization', () => {
    it('returns 403 for CONTRIBUTOR users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.contributor },
      });

      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Crag',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Seuls les ouvreurs et administrateurs peuvent creer des sites');
    });

    it('returns 403 for unknown users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.unknown },
      });

      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Crag',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('allows ADMIN users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Admin Crag',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      createdCragIds.push(body.id);
    });

    it('allows ROUTE_SETTER users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.routeSetter },
      });

      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Route Setter Crag',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      createdCragIds.push(body.id);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });
    });

    it('validates name is required', async () => {
      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Le nom est requis');
    });

    it('validates name cannot be empty', async () => {
      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Le nom est requis');
    });

    it('validates name max length', async () => {
      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'a'.repeat(201),
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Success', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });
    });

    it('creates crag with name only and returns id', async () => {
      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Success Test Crag',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      createdCragIds.push(body.id);

      // Verify crag was created correctly
      const crag = await prisma.crag.findUnique({
        where: { id: body.id },
      });
      expect(crag).not.toBeNull();
      expect(crag!.name).toBe('Success Test Crag');
      expect(crag!.convention).toBeNull();
    });

    it('creates crag with convention true', async () => {
      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Conventioned Crag',
          convention: true,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      createdCragIds.push(body.id);

      // Verify crag was created correctly
      const crag = await prisma.crag.findUnique({
        where: { id: body.id },
      });
      expect(crag).not.toBeNull();
      expect(crag!.name).toBe('Conventioned Crag');
      expect(crag!.convention).toBe(true);
    });

    it('creates crag with convention false', async () => {
      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Non-Conventioned Crag',
          convention: false,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      createdCragIds.push(body.id);

      // Verify crag was created correctly
      const crag = await prisma.crag.findUnique({
        where: { id: body.id },
      });
      expect(crag).not.toBeNull();
      expect(crag!.name).toBe('Non-Conventioned Crag');
      expect(crag!.convention).toBe(false);
    });

    it('creates crag with no sectors and is returned by getAllCrags', async () => {
      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Empty Crag Test',
          convention: true,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      createdCragIds.push(body.id);

      // Verify crag appears in getAllCrags with 0 sectors and 0 routes
      const allCrags = await getAllCrags();
      const emptyCrag = allCrags.find((c) => c.id === body.id);

      expect(emptyCrag).toBeDefined();
      expect(emptyCrag!.name).toBe('Empty Crag Test');
      expect(emptyCrag!.sectorCount).toBe(0);
      expect(emptyCrag!.routeCount).toBe(0);
    });

    it('creates crag with no sectors and getCragWithRoutes returns empty sectors array', async () => {
      const request = new NextRequest('http://localhost/api/crags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Empty Crag Detail Test',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      createdCragIds.push(body.id);

      // Verify getCragWithRoutes returns crag with empty sectors array
      const cragDetail = await getCragWithRoutes(body.id);

      expect(cragDetail).not.toBeNull();
      expect(cragDetail!.name).toBe('Empty Crag Detail Test');
      expect(cragDetail!.sectors).toEqual([]);
    });
  });
});
