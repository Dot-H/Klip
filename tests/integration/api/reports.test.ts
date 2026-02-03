/**
 * Integration tests for POST /api/reports
 * Tests report creation with authentication
 * Uses existing seed data from test:db:setup
 */
import { NextRequest } from 'next/server';
import { prisma, disconnectDatabase } from '../../setup/db';
import { mockUsers } from '../../setup/auth-mock';

// Mock the auth module
const mockGetSession = jest.fn();
jest.mock('~/lib/auth/server', () => ({
  auth: {
    getSession: () => mockGetSession(),
  },
}));

// Import route handler after mocking
import { POST } from '~/app/api/reports/route';

describe('POST /api/reports', () => {
  let testPitchId: string;
  let testPitchId2: string;
  const createdReportIds: string[] = [];
  const createdUserEmails: string[] = [];

  beforeAll(async () => {
    // Get pitches to use for tests
    const pitches = await prisma.pitch.findMany({ take: 2 });
    if (pitches.length < 2) throw new Error('Not enough pitches in test database');
    testPitchId = pitches[0].id;
    testPitchId2 = pitches[1].id;
  });

  afterAll(async () => {
    // Cleanup reports we created
    if (createdReportIds.length > 0) {
      await prisma.report.deleteMany({
        where: { id: { in: createdReportIds } },
      });
    }
    // Cleanup users we created
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

      const request = new NextRequest('http://localhost/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          pitchIds: [testPitchId],
          visualCheck: true,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Authentification requise');
    });

    it('returns 401 if session has no email', async () => {
      mockGetSession.mockResolvedValue({ data: { user: {} } });

      const request = new NextRequest('http://localhost/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          pitchIds: [testPitchId],
          visualCheck: true,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });
    });

    it('requires pitchIds array', async () => {
      const request = new NextRequest('http://localhost/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          visualCheck: true,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('requires at least one pitchId', async () => {
      const request = new NextRequest('http://localhost/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          pitchIds: [],
          visualCheck: true,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('validates pitchId is not empty', async () => {
      const request = new NextRequest('http://localhost/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          pitchIds: [''],
          visualCheck: true,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Success', () => {
    it('creates a report for existing user', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest('http://localhost/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          pitchIds: [testPitchId],
          visualCheck: true,
          comment: 'API test report',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.ids).toHaveLength(1);
      createdReportIds.push(...body.ids);

      // Verify report was created
      const report = await prisma.report.findUnique({
        where: { id: body.ids[0] },
        include: { reporter: true },
      });

      expect(report).not.toBeNull();
      expect(report!.visualCheck).toBe(true);
      expect(report!.comment).toBe('API test report');
      expect(report!.reporter.email).toBe('admin@klip.test');
    });

    it('creates reports for multiple pitches', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest('http://localhost/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          pitchIds: [testPitchId, testPitchId2],
          visualCheck: true,
          anchorCheck: true,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.ids).toHaveLength(2);
      createdReportIds.push(...body.ids);

      // Verify both reports were created
      const reports = await prisma.report.findMany({
        where: { id: { in: body.ids } },
      });

      expect(reports).toHaveLength(2);
      reports.forEach((report) => {
        expect(report.visualCheck).toBe(true);
        expect(report.anchorCheck).toBe(true);
      });
    });

    it('creates user if not exists', async () => {
      const testEmail = 'newuser-reports-test@example.com';
      createdUserEmails.push(testEmail);

      mockGetSession.mockResolvedValue({
        data: { user: { email: testEmail, name: 'New ReportUser' } },
      });

      const request = new NextRequest('http://localhost/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          pitchIds: [testPitchId],
          visualCheck: true,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const body = await response.json();
      createdReportIds.push(...body.ids);

      // Verify user was created
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      expect(user).not.toBeNull();
      expect(user!.firstname).toBe('New');
      expect(user!.lastname).toBe('ReportUser');
      expect(user!.role).toBe('CONTRIBUTOR');
    });

    it('stores all report fields correctly', async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUsers.admin },
      });

      const request = new NextRequest('http://localhost/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          pitchIds: [testPitchId],
          visualCheck: true,
          anchorCheck: false,
          cleaningDone: true,
          trundleDone: false,
          totalReboltingDone: true,
          comment: 'Full report test',
        }),
      });

      const response = await POST(request);
      const body = await response.json();
      createdReportIds.push(...body.ids);

      const report = await prisma.report.findUnique({
        where: { id: body.ids[0] },
      });

      expect(report!.visualCheck).toBe(true);
      expect(report!.anchorCheck).toBe(false);
      expect(report!.cleaningDone).toBe(true);
      expect(report!.trundleDone).toBe(false);
      expect(report!.totalReboltingDone).toBe(true);
      expect(report!.comment).toBe('Full report test');
    });
  });
});
