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
}

function parseRouteName(routeStr: string): ParsedRoute {
  // Format: "1 - Assurancetourix" -> { number: 1, name: "Assurancetourix" }
  // Or: "Les pas perdus" (no number) -> { number: 0, name: "Les pas perdus" }
  const match = routeStr.match(/^(\d+)\s*-\s*(.+)$/);
  if (match) {
    return {
      number: parseInt(match[1], 10),
      name: match[2].trim(),
    };
  }
  // Fallback: no number prefix
  return {
    number: 0,
    name: routeStr.trim(),
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

    // Create Route
    const route = await prisma.route.create({
      data: {
        sectorId: sectorId,
        number: parsedRoute.number,
        name: parsedRoute.name,
      },
    });

    // Create Pitch(es)
    const nbPitches = excelRow.nbPitches || 1;
    for (let i = 0; i < nbPitches; i++) {
      await prisma.pitch.create({
        data: {
          routeId: route.id,
          nbBolts: i === 0 ? excelRow.nbBolts || null : null,
        },
      });
    }

    routeCount++;
  }

  console.log(`  Created ${routeCount} routes`);
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
