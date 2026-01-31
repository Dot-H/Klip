/**
 * Data access layer for Klip - Climbing Route Maintenance
 * Following Next.js best practices for server components
 */

import { prisma } from '~/server/prisma';

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
    };
  }[];
}

export interface RouteDetail {
  id: string;
  number: number;
  name: string | null;
  description: string | null;
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

  // Search routes
  const routes = await prisma.route.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { sector: { name: { contains: query, mode: 'insensitive' } } },
        { sector: { crag: { name: { contains: query, mode: 'insensitive' } } } },
      ],
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
      roleFlags: 0,
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
        },
      },
    },
  });
}
