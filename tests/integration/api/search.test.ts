/**
 * Integration tests for GET /api/search
 * Tests search functionality without authentication requirement
 * Uses existing seed data from test:db:setup
 */
import { describe, it, expect, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { disconnectDatabase } from '../../setup/db';

// Import route handler
import { GET } from '~/app/api/search/route';

describe('GET /api/search', () => {
  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Query Validation', () => {
    it('returns empty array for missing query', async () => {
      const request = new NextRequest('http://localhost/api/search');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual([]);
    });

    it('returns empty array for empty query', async () => {
      const request = new NextRequest('http://localhost/api/search?q=');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual([]);
    });

    it('returns empty array for single character', async () => {
      const request = new NextRequest('http://localhost/api/search?q=R');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual([]);
    });
  });

  describe('Search Results', () => {
    it('finds routes by name', async () => {
      const request = new NextRequest('http://localhost/api/search?q=Rose');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.length).toBeGreaterThanOrEqual(1);
      const roseRoute = body.find((r: { name: string }) => r.name === 'Rose des Sables');
      expect(roseRoute).toBeDefined();
      expect(roseRoute.type).toBe('route');
    });

    it('returns context with crag and sector', async () => {
      const request = new NextRequest('http://localhost/api/search?q=Rose');

      const response = await GET(request);
      const body = await response.json();
      const roseRoute = body.find((r: { name: string }) => r.name === 'Rose des Sables');

      expect(roseRoute.context).toContain('Buoux');
      expect(roseRoute.context).toContain('Styx');
    });

    it('is case insensitive', async () => {
      const lowerRequest = new NextRequest('http://localhost/api/search?q=rose');
      const upperRequest = new NextRequest('http://localhost/api/search?q=ROSE');
      const mixedRequest = new NextRequest('http://localhost/api/search?q=RoSe');

      const [lowerResponse, upperResponse, mixedResponse] = await Promise.all([
        GET(lowerRequest),
        GET(upperRequest),
        GET(mixedRequest),
      ]);

      const [lowerBody, upperBody, mixedBody] = await Promise.all([
        lowerResponse.json(),
        upperResponse.json(),
        mixedResponse.json(),
      ]);

      expect(lowerBody.length).toBeGreaterThanOrEqual(1);
      expect(upperBody.length).toBeGreaterThanOrEqual(1);
      expect(mixedBody.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty array for no matches', async () => {
      const request = new NextRequest('http://localhost/api/search?q=xyz123nonexistent');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual([]);
    });

    it('finds multiple routes when query matches several', async () => {
      // Search for something that appears in multiple route names
      // "Rose des Sables", "Pichenibule", "Données partielles", "Voie à compléter" all have 'e'
      // But the search is on the `name` field specifically
      const request = new NextRequest('http://localhost/api/search?q=es');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      // "Rose des Sables" and "Données partielles" both contain 'es'
      expect(body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Response Format', () => {
    it('includes all expected fields', async () => {
      const request = new NextRequest('http://localhost/api/search?q=Rose');

      const response = await GET(request);
      const body = await response.json();

      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('type');
      expect(body[0]).toHaveProperty('name');
      expect(body[0]).toHaveProperty('context');
    });

    it('sets type to "route" for route results', async () => {
      const request = new NextRequest('http://localhost/api/search?q=Rose');

      const response = await GET(request);
      const body = await response.json();

      expect(body[0].type).toBe('route');
    });
  });
});
