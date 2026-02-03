/**
 * Integration tests for PATCH /api/pitches/[pitchId]
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
import { PATCH } from '~/app/api/pitches/[pitchId]/route';

describe('PATCH /api/pitches/[pitchId]', () => {
  let testPitchId: string;
  let originalLength: number | null;
  let originalCotation: string | null;

  beforeAll(async () => {
    // Get a pitch to use for tests
    const pitch = await prisma.pitch.findFirst({
      where: { length: { not: null }, cotation: { not: null } },
    });
    if (!pitch) throw new Error('No pitch found in test database');
    testPitchId = pitch.id;
    originalLength = pitch.length;
    originalCotation = pitch.cotation;
  });

  afterAll(async () => {
    // Restore original values
    await prisma.pitch.update({
      where: { id: testPitchId },
      data: { length: originalLength, cotation: originalCotation },
    });
    await disconnectDatabase();
  });

  beforeEach(() => {
    mockGetSession.mockReset();
  });

  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: null });

      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ length: 30 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Authentification requise');
    });

    it('returns 401 if session has no email', async () => {
      mockGetSession.mockResolvedValue({ data: { user: {} } });

      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ length: 30 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Authorization', () => {
    it('returns 403 for CONTRIBUTOR users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.contributor },
      });

      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ length: 30 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Seuls les ouvreurs et administrateurs peuvent modifier les longueurs');
    });

    it('returns 403 for unknown users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.unknown },
      });

      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ length: 30 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(403);
    });

    it('allows ADMIN users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ length: 88 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(200);
    });

    it('allows ROUTE_SETTER users', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.routeSetter },
      });

      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ length: 77 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });
    });

    it('validates length is positive', async () => {
      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ length: -5 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(400);
    });

    it('validates length is integer', async () => {
      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ length: 25.5 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(400);
    });

    it('validates cotation max length', async () => {
      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ cotation: 'this-is-way-too-long' }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(400);
    });

    it('validates cotation format', async () => {
      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ cotation: 'invalid' }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Cotation invalide (ex: 6a, 7b+)');
    });

    it('allows valid cotation formats', async () => {
      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ cotation: '6a+' }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(200);
    });

    it('allows null values for optional fields', async () => {
      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ length: null, cotation: null }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Not Found', () => {
    it('returns 404 for non-existent pitch', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ length: 30 }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: 'non-existent-id' }),
      });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Longueur non trouvée');
    });
  });

  describe('Success', () => {
    it('updates pitch and returns success', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest('http://localhost/api/pitches/test', {
        method: 'PATCH',
        body: JSON.stringify({ length: 35, cotation: '7b' }),
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ pitchId: testPitchId }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);

      // Verify update was applied
      const pitch = await prisma.pitch.findUnique({
        where: { id: testPitchId },
      });
      expect(pitch!.length).toBe(35);
      expect(pitch!.cotation).toBe('7b');
    });
  });
});
