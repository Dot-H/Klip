/**
 * Import script for Excel maintenance data
 * Reads MaintenanceProject.xlsx and creates Crag -> Sector -> Route -> Pitch entities
 */

import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExcelRow {
  site: string | undefined;
  convention: string | undefined;
  sector: string | undefined;
  route: string | undefined;
  nbPitches: number | undefined;
  nbBolts: number | undefined;
}

interface ParsedRoute {
  number: number;
  name: string | null;
  grade: string | null;
  pitchNumber: number | null;
}

// Regex for pitch indicator with grade: "L1: 6c+" or "L2:6b"
const PITCH_WITH_GRADE_REGEX = /L(\d+)\s*:\s*([3-9][a-c]\+?)/gi;
// Regex for standalone climbing grades: 3a to 9c with optional +
// Matches grade at word boundary start, captures the + if present
const GRADE_REGEX = /\b([3-9][a-c])(\+)?/i;

function parseRouteName(routeStr: string): ParsedRoute {
  let workingStr = routeStr.trim();

  // First, extract all pitch indicators with their grades (e.g., "L1: 6c+", "L2: 6b")
  // We only care about the first one for this row
  const pitchMatches = [...workingStr.matchAll(PITCH_WITH_GRADE_REGEX)];
  let pitchNumber: number | null = null;
  let grade: string | null = null;

  if (pitchMatches.length > 0) {
    pitchNumber = parseInt(pitchMatches[0][1], 10);
    grade = pitchMatches[0][2].toLowerCase();
    // Remove all pitch indicators from the string
    workingStr = workingStr.replace(PITCH_WITH_GRADE_REGEX, '').trim();
  } else {
    // Try to extract standalone grade if no pitch indicator
    const gradeMatch = workingStr.match(GRADE_REGEX);
    if (gradeMatch) {
      // Combine base grade (group 1) with optional + (group 2)
      grade = (gradeMatch[1] + (gradeMatch[2] || '')).toLowerCase();
      workingStr = workingStr.replace(GRADE_REGEX, '').trim();
    }
  }

  // Format: "1 - Assurancetourix" -> { number: 1, name: "Assurancetourix" }
  // Or: "Les pas perdus" (no number) -> { number: 0, name: "Les pas perdus" }
  const match = workingStr.match(/^(\d+)\s*-\s*(.+)$/);
  if (match) {
    return {
      number: parseInt(match[1], 10),
      name: match[2].trim() || null,
      grade,
      pitchNumber,
    };
  }

  // Check if there's any name left after removing grade and pitch
  const remainingName = workingStr.trim();

  return {
    number: 0,
    name: remainingName || null,
    grade,
    pitchNumber,
  };
}

function parseConvention(value: string | undefined): boolean | null {
  if (!value) return null;
  const normalized = value.toString().toUpperCase().trim();
  if (normalized === 'Y' || normalized === 'YES' || normalized === 'OUI') {
    return true;
  }
  if (normalized === 'N' || normalized === 'NO' || normalized === 'NON') {
    return false;
  }
  return null;
}

async function importSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
): Promise<void> {
  console.log(`\nProcessing sheet: ${sheetName}`);

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(
    sheet,
    { header: 1 },
  );

  // Skip header rows (row 0 is title, row 1 is headers)
  const dataRows = rows.slice(2);

  // Track current values (they persist until a new value appears)
  let currentSiteName: string | null = null;
  let currentConvention: boolean | null = null;
  let currentSectorName: string | null = null;

  // Maps to track created entities and avoid duplicates
  const cragMap = new Map<string, string>(); // name -> id
  const sectorMap = new Map<string, string>(); // "cragId:sectorName" -> id
  let routeCount = 0;
  let pitchCount = 0;

  // Track current route for multi-pitch routes (when we see L2, L3, etc. without a name)
  let currentRouteId: string | null = null;

  for (const row of dataRows) {
    if (!row || row.length === 0) continue;

    const excelRow: ExcelRow = {
      site: row[0]?.toString(),
      convention: row[2]?.toString(),
      sector: row[3]?.toString(),
      route: row[4]?.toString(),
      nbPitches:
        typeof row[8] === 'number' ? row[8] : parseInt(row[8] as string) || 1,
      nbBolts:
        typeof row[9] === 'number' ? row[9] : parseInt(row[9] as string) || 0,
    };

    // Update current values if new ones are provided
    if (excelRow.site && excelRow.site.trim()) {
      currentSiteName = excelRow.site.trim();
    }
    if (excelRow.convention) {
      currentConvention = parseConvention(excelRow.convention);
    }
    if (excelRow.sector && excelRow.sector.trim()) {
      currentSectorName = excelRow.sector.trim();
    }

    // Skip if no route name
    if (!excelRow.route || !excelRow.route.trim()) continue;

    // Skip header row that might have slipped through
    if (excelRow.route.includes('VOIE')) continue;

    // Ensure we have required data
    if (!currentSiteName || !currentSectorName) {
      console.warn(
        `  Skipping row: missing site or sector for route ${excelRow.route}`,
      );
      continue;
    }

    // Create or get Crag
    let cragId = cragMap.get(currentSiteName);
    if (!cragId) {
      const crag = await prisma.crag.upsert({
        where: { id: currentSiteName }, // This won't match, so create
        update: {},
        create: {
          name: currentSiteName,
          convention: currentConvention,
        },
      });
      // Actually we need to find by name
      const existingCrag = await prisma.crag.findFirst({
        where: { name: currentSiteName },
      });
      if (existingCrag) {
        cragId = existingCrag.id;
      } else {
        const newCrag = await prisma.crag.create({
          data: {
            name: currentSiteName,
            convention: currentConvention,
          },
        });
        cragId = newCrag.id;
      }
      cragMap.set(currentSiteName, cragId);
    }

    // Create or get Sector
    const sectorKey = `${cragId}:${currentSectorName}`;
    let sectorId = sectorMap.get(sectorKey);
    if (!sectorId) {
      const existingSector = await prisma.sector.findFirst({
        where: {
          cragId: cragId,
          name: currentSectorName,
        },
      });
      if (existingSector) {
        sectorId = existingSector.id;
      } else {
        const newSector = await prisma.sector.create({
          data: {
            cragId: cragId,
            name: currentSectorName,
          },
        });
        sectorId = newSector.id;
      }
      sectorMap.set(sectorKey, sectorId);
    }

    // Parse route name
    const parsedRoute = parseRouteName(excelRow.route);

    // Case 1: We have a pitch indicator (LX) but no name -> this is an additional pitch for the current route
    if (parsedRoute.pitchNumber && !parsedRoute.name && currentRouteId) {
      await prisma.pitch.create({
        data: {
          routeId: currentRouteId,
          cotation: parsedRoute.grade || null,
          nbBolts: excelRow.nbBolts || null,
        },
      });
      pitchCount++;
      continue;
    }

    // Case 2: We have a name -> create a new route
    if (parsedRoute.name) {
      const route = await prisma.route.create({
        data: {
          sectorId: sectorId,
          number: parsedRoute.number,
          name: parsedRoute.name,
        },
      });

      currentRouteId = route.id;
      routeCount++;

      // Create the first pitch
      await prisma.pitch.create({
        data: {
          routeId: route.id,
          cotation: parsedRoute.grade || null,
          nbBolts: excelRow.nbBolts || null,
        },
      });
      pitchCount++;
      continue;
    }

    // Case 3: No name and no current route - skip with warning
    console.warn(`  Skipping row: cannot determine route for "${excelRow.route}"`);
  }

  console.log(`  Created ${routeCount} routes, ${pitchCount} pitches`);
}

async function main() {
  console.log('Starting Excel import...');

  const excelPath = path.join(process.cwd(), 'MaintenanceProject.xlsx');
  console.log(`Reading file: ${excelPath}`);

  const workbook = XLSX.readFile(excelPath);
  console.log(`Found ${workbook.SheetNames.length} sheets`);

  // Clear existing data
  console.log('\nClearing existing data...');
  await prisma.report.deleteMany();
  await prisma.pitch.deleteMany();
  await prisma.route.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.crag.deleteMany();

  // Process each sheet (except empty ones like "Sheet2")
  for (const sheetName of workbook.SheetNames) {
    if (sheetName === 'Sheet2') continue; // Skip empty sheets
    await importSheet(workbook, sheetName);
  }

  // Summary
  const cragCount = await prisma.crag.count();
  const sectorCount = await prisma.sector.count();
  const routeCount = await prisma.route.count();
  const pitchCount = await prisma.pitch.count();

  console.log('\n=== Import Summary ===');
  console.log(`Crags: ${cragCount}`);
  console.log(`Sectors: ${sectorCount}`);
  console.log(`Routes: ${routeCount}`);
  console.log(`Pitches: ${pitchCount}`);
  console.log('Import completed successfully!');
}

main()
  .catch((e) => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
