/**
 * Integration tests for the data layer
 * Tests database operations directly without HTTP layer
 * Uses existing seed data from test:db:setup
 */
import { describe, it, expect, afterAll } from 'vitest';
import { prisma, disconnectDatabase } from '../setup/db';
import {
  getAllCrags,
  getCragWithRoutes,
  searchRoutes,
  createReport,
  updatePitch,
  getRouteWithReports,
} from '~/lib/data';

describe('Data Layer Integration Tests', () => {
  // Store IDs we'll need for cleanup
  const createdReportIds: string[] = [];
  const createdUserEmails: string[] = [];

  afterAll(async () => {
    // Cleanup any reports we created
    if (createdReportIds.length > 0) {
      await prisma.report.deleteMany({
        where: { id: { in: createdReportIds } },
      });
    }
    // Cleanup any users we created
    if (createdUserEmails.length > 0) {
      await prisma.user.deleteMany({
        where: { email: { in: createdUserEmails } },
      });
    }
    await disconnectDatabase();
  });

  describe('getAllCrags', () => {
    it('returns all crags with stats', async () => {
      const crags = await getAllCrags();

      // Seed data has 3 crags: Buoux, Céüse, Verdon
      expect(crags.length).toBeGreaterThanOrEqual(3);
      const cragNames = crags.map(c => c.name);
      expect(cragNames).toContain('Buoux');
      expect(cragNames).toContain('Céüse');
      expect(cragNames).toContain('Verdon');
    });

    it('includes route and sector counts', async () => {
      const crags = await getAllCrags();
      const buoux = crags.find(c => c.name === 'Buoux');

      expect(buoux).toBeDefined();
      expect(buoux!.sectorCount).toBeGreaterThanOrEqual(1);
      expect(buoux!.routeCount).toBeGreaterThanOrEqual(1);
    });

    it('includes convention status', async () => {
      const crags = await getAllCrags();
      const buoux = crags.find(c => c.name === 'Buoux');
      const verdon = crags.find(c => c.name === 'Verdon');

      expect(buoux!.convention).toBe(true);
      expect(verdon!.convention).toBe(false);
    });

    it('orders crags by name', async () => {
      const crags = await getAllCrags();
      const names = crags.map(c => c.name);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });
  });

  describe('getCragWithRoutes', () => {
    it('returns crag with sectors and routes', async () => {
      // Get Buoux crag ID
      const buoux = await prisma.crag.findFirst({ where: { name: 'Buoux' } });
      expect(buoux).not.toBeNull();

      const crag = await getCragWithRoutes(buoux!.id);

      expect(crag).not.toBeNull();
      expect(crag!.name).toBe('Buoux');
      expect(crag!.sectors.length).toBeGreaterThanOrEqual(1);
    });

    it('returns null for non-existent crag', async () => {
      const crag = await getCragWithRoutes('non-existent-id');
      expect(crag).toBeNull();
    });

    it('includes pitch data for routes', async () => {
      const buoux = await prisma.crag.findFirst({ where: { name: 'Buoux' } });
      const crag = await getCragWithRoutes(buoux!.id);

      // Find a route with pitches
      const routeWithPitches = crag!.sectors
        .flatMap(s => s.routes)
        .find(r => r.pitches.length > 0);

      expect(routeWithPitches).toBeDefined();
      expect(routeWithPitches!.pitches.length).toBeGreaterThan(0);
    });
  });

  describe('searchRoutes', () => {
    it('finds routes by name', async () => {
      const results = await searchRoutes('Rose');

      expect(results.length).toBeGreaterThanOrEqual(1);
      const roseRoute = results.find(r => r.name === 'Rose des Sables');
      expect(roseRoute).toBeDefined();
      expect(roseRoute!.type).toBe('route');
    });

    it('returns context with crag and sector names', async () => {
      const results = await searchRoutes('Rose');
      const roseRoute = results.find(r => r.name === 'Rose des Sables');

      expect(roseRoute!.context).toContain('Buoux');
      expect(roseRoute!.context).toContain('Styx');
    });

    it('returns empty array for short queries', async () => {
      const results = await searchRoutes('R');
      expect(results).toEqual([]);
    });

    it('returns empty array for empty query', async () => {
      const results = await searchRoutes('');
      expect(results).toEqual([]);
    });

    it('is case insensitive', async () => {
      const lower = await searchRoutes('rose');
      const upper = await searchRoutes('ROSE');
      const mixed = await searchRoutes('RoSe');

      expect(lower.length).toBeGreaterThanOrEqual(1);
      expect(upper.length).toBeGreaterThanOrEqual(1);
      expect(mixed.length).toBeGreaterThanOrEqual(1);
    });

    it('handles no matches gracefully', async () => {
      const results = await searchRoutes('xyz123nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('createReport', () => {
    it('creates a report for an existing user', async () => {
      // Get a pitch from the database
      const pitch = await prisma.pitch.findFirst();
      expect(pitch).not.toBeNull();

      const reportId = await createReport({
        pitchId: pitch!.id,
        firstname: 'Jean',
        lastname: 'Admin',
        email: 'admin@klip.test',
        visualCheck: true,
        comment: 'Integration test report',
      });

      createdReportIds.push(reportId);

      expect(reportId).toBeDefined();

      // Verify report was created
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: { reporter: true },
      });

      expect(report).not.toBeNull();
      expect(report!.visualCheck).toBe(true);
      expect(report!.comment).toBe('Integration test report');
      expect(report!.reporter.email).toBe('admin@klip.test');
    });

    it('creates a new user if email does not exist', async () => {
      const pitch = await prisma.pitch.findFirst();
      const testEmail = 'newuser-data-test@example.com';

      const reportId = await createReport({
        pitchId: pitch!.id,
        firstname: 'New',
        lastname: 'DataUser',
        email: testEmail,
        visualCheck: false,
      });

      createdReportIds.push(reportId);
      createdUserEmails.push(testEmail);

      // Verify user was created
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      expect(user).not.toBeNull();
      expect(user!.firstname).toBe('New');
      expect(user!.lastname).toBe('DataUser');
      expect(user!.role).toBe('CONTRIBUTOR'); // Default role
    });

    it('stores all report fields correctly', async () => {
      const pitch = await prisma.pitch.findFirst();
      const testEmail = 'fullreport-test@example.com';

      const reportId = await createReport({
        pitchId: pitch!.id,
        firstname: 'Test',
        lastname: 'FullReport',
        email: testEmail,
        visualCheck: true,
        anchorCheck: true,
        cleaningDone: false,
        trundleDone: true,
        totalReboltingDone: false,
        comment: 'Detailed comment',
      });

      createdReportIds.push(reportId);
      createdUserEmails.push(testEmail);

      const report = await prisma.report.findUnique({
        where: { id: reportId },
      });

      expect(report!.visualCheck).toBe(true);
      expect(report!.anchorCheck).toBe(true);
      expect(report!.cleaningDone).toBe(false);
      expect(report!.trundleDone).toBe(true);
      expect(report!.totalReboltingDone).toBe(false);
      expect(report!.comment).toBe('Detailed comment');
    });
  });

  describe('updatePitch', () => {
    it('updates pitch length', async () => {
      const pitch = await prisma.pitch.findFirst({
        where: { length: { not: null } },
      });
      expect(pitch).not.toBeNull();
      const originalLength = pitch!.length;

      await updatePitch(pitch!.id, { length: 99 });

      const updated = await prisma.pitch.findUnique({
        where: { id: pitch!.id },
      });
      expect(updated!.length).toBe(99);

      // Restore original
      await updatePitch(pitch!.id, { length: originalLength });
    });

    it('updates pitch cotation', async () => {
      const pitch = await prisma.pitch.findFirst({
        where: { cotation: { not: null } },
      });
      expect(pitch).not.toBeNull();
      const originalCotation = pitch!.cotation;

      await updatePitch(pitch!.id, { cotation: '9a' });

      const updated = await prisma.pitch.findUnique({
        where: { id: pitch!.id },
      });
      expect(updated!.cotation).toBe('9a');

      // Restore original
      await updatePitch(pitch!.id, { cotation: originalCotation });
    });

    it('can set fields to null', async () => {
      const pitch = await prisma.pitch.findFirst({
        where: { length: { not: null }, cotation: { not: null } },
      });
      expect(pitch).not.toBeNull();
      const originalLength = pitch!.length;
      const originalCotation = pitch!.cotation;

      await updatePitch(pitch!.id, { length: null, cotation: null });

      const updated = await prisma.pitch.findUnique({
        where: { id: pitch!.id },
      });
      expect(updated!.length).toBeNull();
      expect(updated!.cotation).toBeNull();

      // Restore original values
      await updatePitch(pitch!.id, { length: originalLength, cotation: originalCotation });
    });
  });

  describe('getRouteWithReports', () => {
    it('returns route with pitches and reports', async () => {
      // Find a route that has reports (Pichenibule from seed)
      const route = await prisma.route.findFirst({
        where: { name: 'Pichenibule' },
      });
      expect(route).not.toBeNull();

      const routeDetail = await getRouteWithReports(route!.id);

      expect(routeDetail).not.toBeNull();
      expect(routeDetail!.name).toBe('Pichenibule');
      expect(routeDetail!.pitches.length).toBeGreaterThan(0);
    });

    it('returns null for non-existent route', async () => {
      const route = await getRouteWithReports('non-existent-id');
      expect(route).toBeNull();
    });

    it('includes sector and crag info', async () => {
      const route = await prisma.route.findFirst({
        where: { name: 'Rose des Sables' },
      });

      const routeDetail = await getRouteWithReports(route!.id);

      expect(routeDetail!.sector.name).toBe('Styx');
      expect(routeDetail!.sector.crag.name).toBe('Buoux');
    });

    it('includes reporter details with role when reports exist', async () => {
      // Find a route that has reports
      const route = await prisma.route.findFirst({
        where: { name: 'Tabou au Nord' },
      });
      expect(route).not.toBeNull();

      const routeDetail = await getRouteWithReports(route!.id);

      // Check if there are reports and they have reporter info
      const pitchWithReports = routeDetail!.pitches.find(p => p.reports.length > 0);
      if (pitchWithReports) {
        const reporter = pitchWithReports.reports[0].reporter;
        expect(reporter).toHaveProperty('email');
        expect(reporter).toHaveProperty('role');
        expect(reporter).toHaveProperty('firstname');
        expect(reporter).toHaveProperty('lastname');
      }
    });
  });
});
