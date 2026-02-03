/**
 * Integration tests for POST /api/routes
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
import { POST } from '~/app/api/routes/route';

describe('POST /api/routes', () => {
  let testSectorId: string;
  let createdRouteIds: string[] = [];

  beforeAll(async () => {
    // Get a sector to use for tests
    const sector = await prisma.sector.findFirst();
    if (!sector) throw new Error('No sector found in test database');
    testSectorId = sector.id;
  });

  afterAll(async () => {
    // Clean up created routes
    for (const routeId of createdRouteIds) {
      await prisma.pitch.deleteMany({ where: { routeId } });
      await prisma.route.delete({ where: { id: routeId } }).catch(() => {});
    }
    await disconnectDatabase();
  });

  beforeEach(() => {
    mockGetSession.mockReset();
  });

  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: null });

      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 99,
          name: 'Test Route',
          pitches: [{ cotation: '6a' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Authentification requise');
    });

    it('returns 401 if session has no email', async () => {
      mockGetSession.mockResolvedValue({ data: { user: {} } });

      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 99,
          name: 'Test Route',
          pitches: [{ cotation: '6a' }],
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

      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 99,
          name: 'Test Route',
          pitches: [{ cotation: '6a' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Seuls les ouvreurs et administrateurs peuvent creer des voies');
    });

    it('returns 403 for unknown users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.unknown },
      });

      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 99,
          name: 'Test Route',
          pitches: [{ cotation: '6a' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('allows ADMIN users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 100,
          name: 'Admin Route',
          pitches: [{ cotation: '6a' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      createdRouteIds.push(body.id);
    });

    it('allows ROUTE_SETTER users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.routeSetter },
      });

      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 101,
          name: 'Route Setter Route',
          pitches: [{ cotation: '6b' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      createdRouteIds.push(body.id);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });
    });

    it('validates sectorId is a valid UUID', async () => {
      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: 'not-a-uuid',
          number: 99,
          name: 'Test Route',
          pitches: [{ cotation: '6a' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('ID de secteur invalide');
    });

    it('validates name is required', async () => {
      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 99,
          pitches: [{ cotation: '6a' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Le nom est requis');
    });

    it('validates name cannot be empty', async () => {
      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 99,
          name: '',
          pitches: [{ cotation: '6a' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Le nom est requis');
    });

    it('validates number is positive', async () => {
      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: -1,
          name: 'Test Route',
          pitches: [{ cotation: '6a' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('validates number is an integer', async () => {
      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 1.5,
          name: 'Test Route',
          pitches: [{ cotation: '6a' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('validates at least one pitch is required', async () => {
      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 99,
          name: 'Test Route',
          pitches: [],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Au moins une longueur requise');
    });

    it('validates pitch length is positive', async () => {
      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 99,
          name: 'Test Route',
          pitches: [{ cotation: '6a', length: -5 }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('validates pitch length is an integer', async () => {
      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 99,
          name: 'Test Route',
          pitches: [{ cotation: '6a', length: 25.5 }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('validates cotation format', async () => {
      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 99,
          name: 'Test Route',
          pitches: [{ cotation: 'invalid' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Cotation invalide (ex: 6a, 7b+)');
    });

    it('allows valid cotation formats', async () => {
      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 106,
          name: 'Route Valid Cotation',
          pitches: [
            { cotation: '6a' },
            { cotation: '7b+' },
            { cotation: '8C' },
          ],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      createdRouteIds.push(body.id);
    });

    it('allows null values for optional pitch fields', async () => {
      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 102,
          name: 'Route With Null Pitch',
          pitches: [{ cotation: null, length: null }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      createdRouteIds.push(body.id);
    });
  });

  describe('Not Found', () => {
    it('returns 404 for non-existent sector', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: '00000000-0000-0000-0000-000000000000',
          number: 99,
          name: 'Test Route',
          pitches: [{ cotation: '6a' }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Secteur non trouvé');
    });
  });

  describe('Success', () => {
    it('creates route with single pitch', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 103,
          name: 'Test Route Single',
          pitches: [{ cotation: '7a', length: 30 }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      createdRouteIds.push(body.id);

      // Verify route was created correctly
      const route = await prisma.route.findUnique({
        where: { id: body.id },
        include: { pitches: true },
      });
      expect(route).not.toBeNull();
      expect(route!.number).toBe(103);
      expect(route!.name).toBe('Test Route Single');
      expect(route!.pitches).toHaveLength(1);
      expect(route!.pitches[0].cotation).toBe('7a');
      expect(route!.pitches[0].length).toBe(30);
    });

    it('creates route with multiple pitches', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest('http://localhost/api/routes', {
        method: 'POST',
        body: JSON.stringify({
          sectorId: testSectorId,
          number: 104,
          name: 'Test Route Multi',
          description: 'A multi-pitch test route',
          pitches: [
            { cotation: '6a', length: 25 },
            { cotation: '6b+', length: 30 },
            { cotation: '6c', length: 35 },
          ],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.id).toBeDefined();
      createdRouteIds.push(body.id);

      // Verify route was created correctly
      const route = await prisma.route.findUnique({
        where: { id: body.id },
        include: { pitches: true },
      });
      expect(route).not.toBeNull();
      expect(route!.number).toBe(104);
      expect(route!.name).toBe('Test Route Multi');
      expect(route!.description).toBe('A multi-pitch test route');
      expect(route!.pitches).toHaveLength(3);
    });

  });
});
