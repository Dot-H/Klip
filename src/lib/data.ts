/**
 * Data access layer for Klip - Climbing Route Maintenance
 * Following Next.js best practices for server components
 */

import { prisma } from '~/server/prisma';
import type { UserRole } from './roles';

export type { UserRole };
export { USER_ROLE_LABELS } from './roles';

// ============ Types ============

export interface CragWithStats {
  id: string;
  name: string;
  convention: boolean | null;
  routeCount: number;
  sectorCount: number;
}

export interface SectorWithRoutes {
  id: string;
  name: string;
  routes: {
    id: string;
    number: number;
    name: string | null;
    length: number | null;
    pitches: { length: number | null; cotation: string | null }[];
  }[];
}

export interface CragDetail {
  id: string;
  name: string;
  convention: boolean | null;
  sectors: SectorWithRoutes[];
}

export interface PitchWithReports {
  id: string;
  description: string | null;
  length: number | null;
  nbBolts: number | null;
  cotation: string | null;
  reports: {
    id: string;
    createdAt: Date;
    comment: string | null;
    visualCheck: boolean | null;
    anchorCheck: boolean | null;
    cleaningDone: boolean | null;
    trundleDone: boolean | null;
    totalReboltingDone: boolean | null;
    reporter: {
      id: string;
      firstname: string;
      lastname: string;
      email: string;
      role: UserRole;
    };
  }[];
}

export interface RouteDetail {
  id: string;
  number: number;
  name: string | null;
  description: string | null;
  length: number | null;
  sector: {
    id: string;
    name: string;
    crag: {
      id: string;
      name: string;
    };
  };
  pitches: PitchWithReports[];
}

export interface SearchResult {
  id: string;
  type: 'route' | 'sector' | 'crag';
  name: string;
  context: string;
}

export interface CreateReportInput {
  pitchId: string;
  firstname: string;
  lastname: string;
  email: string;
  visualCheck?: boolean;
  anchorCheck?: boolean;
  cleaningDone?: boolean;
  trundleDone?: boolean;
  totalReboltingDone?: boolean;
  comment?: string;
}

export interface CreateReportWithAuthInput {
  pitchId: string;
  userEmail: string;
  userName?: string;
  visualCheck?: boolean;
  anchorCheck?: boolean;
  cleaningDone?: boolean;
  trundleDone?: boolean;
  totalReboltingDone?: boolean;
  comment?: string;
}

export interface CreatePitchInput {
  cotation?: string | null;
  length?: number | null;
}

export interface CreateRouteInput {
  sectorId: string;
  number: number;
  name: string;
  description?: string | null;
  pitches: CreatePitchInput[];
}

// ============ Functions ============

/**
 * Get all crags with route and sector counts
 */
export async function getAllCrags(): Promise<CragWithStats[]> {
  const crags = await prisma.crag.findMany({
    include: {
      sectors: {
        include: {
          _count: {
            select: { routes: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return crags.map((crag) => ({
    id: crag.id,
    name: crag.name,
    convention: crag.convention,
    sectorCount: crag.sectors.length,
    routeCount: crag.sectors.reduce((sum, s) => sum + s._count.routes, 0),
  }));
}

/**
 * Get a crag with its sectors and routes
 */
export async function getCragWithRoutes(
  cragId: string,
): Promise<CragDetail | null> {
  const crag = await prisma.crag.findUnique({
    where: { id: cragId },
    include: {
      sectors: {
        orderBy: { name: 'asc' },
        include: {
          routes: {
            orderBy: { number: 'asc' },
            select: {
              id: true,
              number: true,
              name: true,
              length: true,
              pitches: {
                select: { length: true, cotation: true },
              },
            },
          },
        },
      },
    },
  });

  if (!crag) return null;

  return {
    id: crag.id,
    name: crag.name,
    convention: crag.convention,
    sectors: crag.sectors.map((sector) => ({
      id: sector.id,
      name: sector.name,
      routes: sector.routes,
    })),
  };
}

/**
 * Get a route with its pitches and reports
 */
export async function getRouteWithReports(
  routeId: string,
): Promise<RouteDetail | null> {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      sector: {
        include: {
          crag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      pitches: {
        include: {
          reports: {
            orderBy: { createdAt: 'desc' },
            include: {
              reporter: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!route) return null;

  return {
    id: route.id,
    number: route.number,
    name: route.name,
    description: route.description,
    length: route.length,
    sector: {
      id: route.sector.id,
      name: route.sector.name,
      crag: route.sector.crag,
    },
    pitches: route.pitches.map((pitch) => ({
      id: pitch.id,
      description: pitch.description,
      length: pitch.length,
      nbBolts: pitch.nbBolts,
      cotation: pitch.cotation,
      reports: pitch.reports.map((report) => ({
        id: report.id,
        createdAt: report.createdAt,
        comment: report.comment,
        visualCheck: report.visualCheck,
        anchorCheck: report.anchorCheck,
        cleaningDone: report.cleaningDone,
        trundleDone: report.trundleDone,
        totalReboltingDone: report.totalReboltingDone,
        reporter: report.reporter,
      })),
    })),
  };
}

/**
 * Search routes by name, sector, or crag
 */
export async function searchRoutes(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const searchTerm = `%${query}%`;

  // Search routes by name only
  const routes = await prisma.route.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
    },
    include: {
      sector: {
        include: {
          crag: true,
        },
      },
    },
    take: 20,
  });

  return routes.map((route) => ({
    id: route.id,
    type: 'route' as const,
    name: route.name || `Voie ${route.number}`,
    context: `${route.sector.crag.name} › ${route.sector.name}`,
  }));
}

/**
 * Create a report (and user if necessary)
 */
export async function createReport(input: CreateReportInput): Promise<string> {
  // Upsert user by email
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      firstname: input.firstname,
      lastname: input.lastname,
    },
    create: {
      email: input.email,
      firstname: input.firstname,
      lastname: input.lastname,
    },
  });

  // Create report
  const report = await prisma.report.create({
    data: {
      reportedPitchId: input.pitchId,
      reporterId: user.id,
      visualCheck: input.visualCheck ?? null,
      anchorCheck: input.anchorCheck ?? null,
      cleaningDone: input.cleaningDone ?? null,
      trundleDone: input.trundleDone ?? null,
      totalReboltingDone: input.totalReboltingDone ?? null,
      comment: input.comment ?? null,
    },
  });

  return report.id;
}

/**
 * Get a report by ID
 */
export async function getReport(reportId: string) {
  return prisma.report.findUnique({
    where: { id: reportId },
    include: {
      reporter: {
        select: { id: true, email: true },
      },
    },
  });
}

/**
 * Update a report
 */
export async function updateReport(
  reportId: string,
  data: {
    visualCheck?: boolean;
    anchorCheck?: boolean;
    cleaningDone?: boolean;
    trundleDone?: boolean;
    totalReboltingDone?: boolean;
    comment?: string;
  },
) {
  return prisma.report.update({
    where: { id: reportId },
    data: {
      visualCheck: data.visualCheck ?? null,
      anchorCheck: data.anchorCheck ?? null,
      cleaningDone: data.cleaningDone ?? null,
      trundleDone: data.trundleDone ?? null,
      totalReboltingDone: data.totalReboltingDone ?? null,
      comment: data.comment ?? null,
    },
  });
}

/**
 * Delete a report
 */
export async function deleteReport(reportId: string) {
  return prisma.report.delete({
    where: { id: reportId },
  });
}

/**
 * Get a pitch by ID (for report form)
 */
export async function getPitch(pitchId: string) {
  return prisma.pitch.findUnique({
    where: { id: pitchId },
    include: {
      route: {
        include: {
          sector: {
            include: {
              crag: true,
            },
          },
          pitches: {
            select: {
              id: true,
              cotation: true,
              length: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      role: true,
    },
  });
}

/**
 * Get or create user by email (for syncing with auth provider)
 */
export async function getOrCreateUser(email: string, name?: string) {
  let firstname = '';
  let lastname = '';

  if (name) {
    const nameParts = name.trim().split(/\s+/);
    firstname = nameParts[0] || '';
    lastname = nameParts.slice(1).join(' ') || '';
  }

  return prisma.user.upsert({
    where: { email },
    update: {
      ...(firstname && { firstname }),
      ...(lastname && { lastname }),
    },
    create: {
      email,
      firstname,
      lastname,
    },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      role: true,
    },
  });
}

/**
 * Update a pitch's length and/or cotation
 */
export async function updatePitch(
  pitchId: string,
  data: { length?: number | null; cotation?: string | null },
) {
  return prisma.pitch.update({
    where: { id: pitchId },
    data,
  });
}

/**
 * Create a report with Neon Auth session data
 * Upserts user by email from auth provider
 */
export async function createReportWithAuth(
  input: CreateReportWithAuthInput,
): Promise<string> {
  // Parse name into firstname/lastname if provided
  let firstname = '';
  let lastname = '';

  if (input.userName) {
    const nameParts = input.userName.trim().split(/\s+/);
    firstname = nameParts[0] || '';
    lastname = nameParts.slice(1).join(' ') || '';
  }

  // Upsert user by email from auth provider
  const user = await prisma.user.upsert({
    where: { email: input.userEmail },
    update: {
      ...(firstname && { firstname }),
      ...(lastname && { lastname }),
    },
    create: {
      email: input.userEmail,
      firstname,
      lastname,
    },
  });

  // Create report
  const report = await prisma.report.create({
    data: {
      reportedPitchId: input.pitchId,
      reporterId: user.id,
      visualCheck: input.visualCheck ?? null,
      anchorCheck: input.anchorCheck ?? null,
      cleaningDone: input.cleaningDone ?? null,
      trundleDone: input.trundleDone ?? null,
      totalReboltingDone: input.totalReboltingDone ?? null,
      comment: input.comment ?? null,
    },
  });

  return report.id;
}

/**
 * Create a route with pitches
 * Uses Prisma nested create for transaction safety
 */
export async function createRoute(input: CreateRouteInput): Promise<string> {
  // Verify sector exists
  const sector = await prisma.sector.findUnique({
    where: { id: input.sectorId },
  });

  if (!sector) {
    throw new Error('Secteur non trouvé');
  }

  // Create route with pitches in a single transaction
  const route = await prisma.route.create({
    data: {
      sectorId: input.sectorId,
      number: input.number,
      name: input.name,
      description: input.description ?? null,
      pitches: {
        create: input.pitches.map((p) => ({
          cotation: p.cotation ?? null,
          length: p.length ?? null,
        })),
      },
    },
  });

  return route.id;
}
