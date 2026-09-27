/**
 * Import script for Excel maintenance data
 * Reads a maintenance spreadsheet and upserts Crag -> Sector -> Route -> Pitch entities.
 *
 * Never deletes anything: existing routes/pitches are matched by name and updated in
 * place so that Reports (which point at a Pitch id) are never orphaned.
 *
 * Usage:
 *   tsx prisma/import-excel.ts [--file <path>] [--apply]
 *
 * Without --apply the script only parses the sheet and prints the planned diff and
 * warnings; nothing is written to the database.
 */

import * as XLSX from 'xlsx';
import { PrismaClient } from './generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as path from 'path';
import { isValidCotation } from '../src/lib/grades.ts';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const fileArgIndex = args.indexOf('--file');
const filePath =
  fileArgIndex !== -1 && args[fileArgIndex + 1]
    ? args[fileArgIndex + 1]
    : path.join(process.cwd(), 'MaintenanceProject.xlsx');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ParsedPitch {
  cotation: string | null;
}

interface ParsedRoute {
  number: number;
  name: string;
  pitches: ParsedPitch[];
}

const warnings: string[] = [];

function warn(message: string): void {
  warnings.push(message);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Strip a leading numbering prefix left over from an older, less careful import
 * (e.g. "16 le menhirs", "a - sur le fil derisoir"). Digit prefixes are unambiguous
 * (no real name is purely numeric) so the dash is optional; letter prefixes require
 * an explicit dash so real short French words ("la", "le", "un"...) are left alone.
 */
function stripLeadingNumberPrefix(value: string): string {
  const digitMatch = /^([0-9]+)\s*-?\s*/.exec(value);
  if (digitMatch) return value.slice(digitMatch[0].length);
  const letterMatch = /^([a-z]{1,3})\s*-\s*/.exec(value);
  if (letterMatch) return value.slice(letterMatch[0].length);
  return value;
}

/**
 * Fuzzy key used to match a freshly parsed name against whatever is already stored
 * in the database, tolerating accents, case, trailing punctuation and legacy
 * numbering prefixes that earlier (less careful) imports left baked into the name.
 */
const COMBINING_DIACRITICS_RE = /[̀-ͯ]/g;

function normalizeForMatch(value: string): string {
  const base = value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS_RE, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return stripLeadingNumberPrefix(base).replace(/[.,;:!?']+$/g, '').trim();
}

// Numbering prefix at the start of a name region, e.g. "1 - ", "14 ", "A - ".
// Requires the token to be followed by whitespace so real words (e.g. "L'Ombre") are left alone.
const PREFIX_RE = /^([0-9]+|[A-Z]{1,3})\s*-?\s+(?=\S)/;

const PAR_RE = /Par\s*\w+\s*:/i;
// "L1:" or "L1 " (colon sometimes missing in the source), but only when directly
// followed by a grade - otherwise a bare grade token earlier in the string would
// win the split and swallow the malformed tag into the route name.
const LTAG_RE = /L\s*\d+\s*:?\s*(?=[3-9])/i;
const GRADE_RE = /[3-9][a-c]\+?/i;
// Broader marker used only to locate where the name ends and the grade/pitch text
// begins - also recognizes aid-climbing grades ("A0", "A1"...) and an uncertain bare
// digit ("6?", "8 ?") that aren't full grades on their own but still mark the split.
const GRADE_MARKER_RE = /A[0-4]\+?|[3-9][a-c]\+?|[3-9]\s*\?/i;

function extractBareGrade(text: string): string | null {
  const match = GRADE_RE.exec(text);
  return match ? match[0].toLowerCase() : null;
}

function parseConvention(value: string | undefined): boolean | null {
  if (!value) return null;
  const normalized = value.toString().toUpperCase().trim();
  if (normalized === 'Y' || normalized === 'YES' || normalized === 'OUI') return true;
  if (normalized === 'N' || normalized === 'NO' || normalized === 'NON') return false;
  return null;
}

/**
 * Parse the "VOIE - N° et Nom" cell into one or more routes.
 * Most rows produce a single route; the "Par N: grade - Par M: grade" cross-reference
 * notation produces two routes referencing other routes in the same sector.
 */
function parseRouteCell(
  rawCell: string,
  sectorPrefixMap: Map<string, string>,
): { routes: ParsedRoute[]; prefixLabel: string | null; isContinuation: boolean } {
  const cell = normalizeWhitespace(rawCell);

  const parMatch = PAR_RE.exec(cell);
  const ltagMatch = LTAG_RE.exec(cell);
  const gradeMatch = GRADE_MARKER_RE.exec(cell);

  const candidates = [
    parMatch ? { index: parMatch.index, mode: 'PAR' as const } : null,
    ltagMatch ? { index: ltagMatch.index, mode: 'LTAG' as const } : null,
    gradeMatch ? { index: gradeMatch.index, mode: 'PLAIN' as const } : null,
  ].filter((c): c is { index: number; mode: 'PAR' | 'LTAG' | 'PLAIN' } => c !== null);

  const split = candidates.reduce<{ index: number; mode: 'PAR' | 'LTAG' | 'PLAIN' } | null>(
    (best, c) => (best === null || c.index < best.index ? c : best),
    null,
  );

  const nameRegionRaw = split ? cell.slice(0, split.index) : cell;
  const gradeRegion = split ? cell.slice(split.index) : '';

  const prefixMatch = PREFIX_RE.exec(nameRegionRaw);
  const prefixLabel = prefixMatch ? prefixMatch[1] : null;
  const name = normalizeWhitespace(nameRegionRaw.replace(PREFIX_RE, ''));
  const number = prefixLabel && /^\d+$/.test(prefixLabel) ? parseInt(prefixLabel, 10) : 0;

  const isContinuation = name.length === 0;

  if (!split) {
    // No grade/pitch/Par indicator at all - either a placeholder or unparsable row.
    return {
      routes: name ? [{ number, name, pitches: [{ cotation: null }] }] : [],
      prefixLabel,
      isContinuation,
    };
  }

  if (split.mode === 'PAR') {
    const clauses = [...gradeRegion.matchAll(/Par\s*(\w+)\s*:\s*([^-]+)/gi)];
    const routes: ParsedRoute[] = [];
    for (const clause of clauses) {
      const refLabel = clause[1];
      const gradeText = normalizeWhitespace(clause[2]);
      const referencedName = sectorPrefixMap.get(refLabel);
      if (!referencedName) {
        warn(`Cannot resolve "Par ${refLabel}" referenced by "${cell}" - clause skipped`);
        continue;
      }
      const cotation = extractBareGrade(gradeText);
      if (!cotation) {
        warn(`No recognizable grade in "Par ${refLabel}" clause of "${cell}"`);
      }
      routes.push({
        number,
        name: `${name} (début ${referencedName})`,
        pitches: [{ cotation }],
      });
    }
    return { routes, prefixLabel, isContinuation: false };
  }

  if (split.mode === 'LTAG') {
    const matches = [
      ...gradeRegion.matchAll(/L\s*\d+\s*:?\s*(.*?)(?=(?:\s*L\s*\d+\s*:?\s*[3-9])|$)/gis),
    ];
    const pitches: ParsedPitch[] = matches.map((m) => {
      const fragment = normalizeWhitespace(m[1]);
      const cotation = extractBareGrade(fragment);
      if (!cotation) {
        warn(`Pitch grade "${fragment}" in "${cell}" is not a recognizable grade - stored as null`);
      }
      return { cotation };
    });

    if (isContinuation) {
      // Extra pitches for the previously created route - not a new route.
      return { routes: [{ number, name: '', pitches }], prefixLabel, isContinuation: true };
    }
    return { routes: [{ number, name, pitches }], prefixLabel, isContinuation: false };
  }

  // PLAIN mode: whole grade region is one pitch's cotation text, e.g. "6c", "4b ou 5c", "7a+/7b".
  const cotationText = normalizeWhitespace(gradeRegion).replace(/\s*\/\s*/g, '/');
  if (cotationText && !isValidCotation(cotationText)) {
    warn(`Cotation "${cotationText}" for "${name || '(continuation)'}" does not look like a single grade`);
  }
  const pitch: ParsedPitch = { cotation: cotationText || null };

  if (isContinuation) {
    return { routes: [{ number, name: '', pitches: [pitch] }], prefixLabel, isContinuation: true };
  }
  return { routes: [{ number, name, pitches: [pitch] }], prefixLabel, isContinuation: false };
}

interface Stats {
  cragsCreated: number;
  cragsRenamed: number;
  sectorsCreated: number;
  sectorsRenamed: number;
  routesCreated: number;
  routesUpdated: number;
  routesRenamed: number;
  pitchesCreated: number;
  pitchesUpdated: number;
}

interface NamedEntity {
  id: string;
  name: string | null;
  number?: number;
}

async function upsertCrag(
  name: string,
  convention: boolean | null,
  allCrags: NamedEntity[],
  stats: Stats,
): Promise<string> {
  const key = normalizeForMatch(name);
  const match = allCrags.find((c) => normalizeForMatch(c.name ?? '') === key);

  let id: string;
  if (match) {
    id = match.id;
    const data: { name?: string; convention?: boolean } = {};
    if (match.name !== name) {
      stats.cragsRenamed++;
      data.name = name;
      match.name = name;
    }
    if (convention !== null) {
      data.convention = convention;
    }
    if (apply && Object.keys(data).length > 0) {
      await prisma.crag.update({ where: { id }, data });
    }
  } else {
    stats.cragsCreated++;
    if (apply) {
      const created = await prisma.crag.create({ data: { name, convention } });
      id = created.id;
    } else {
      id = `dry-run-crag:${key}`;
    }
    allCrags.push({ id, name });
  }
  return id;
}

async function upsertSector(
  cragId: string,
  name: string,
  sectorsByCrag: Map<string, NamedEntity[]>,
  stats: Stats,
): Promise<string> {
  let sectors = sectorsByCrag.get(cragId);
  if (!sectors) {
    sectors = await prisma.sector.findMany({ where: { cragId } });
    sectorsByCrag.set(cragId, sectors);
  }

  const key = normalizeForMatch(name);
  const match = sectors.find((s) => normalizeForMatch(s.name ?? '') === key);

  let id: string;
  if (match) {
    id = match.id;
    if (match.name !== name) {
      stats.sectorsRenamed++;
      if (apply) {
        await prisma.sector.update({ where: { id }, data: { name } });
      }
      match.name = name;
    }
  } else {
    stats.sectorsCreated++;
    if (apply) {
      const created = await prisma.sector.create({ data: { cragId, name } });
      id = created.id;
    } else {
      id = `dry-run-sector:${cragId}::${key}`;
    }
    sectors.push({ id, name });
  }
  return id;
}

async function reconcilePitches(
  routeId: string,
  parsedPitches: ParsedPitch[],
  nbBolts: number | null,
  stats: Stats,
  offset: number,
): Promise<void> {
  const existingPitches = await prisma.pitch.findMany({ where: { routeId } });

  const count = Math.max(existingPitches.length - offset, parsedPitches.length);
  for (let i = 0; i < count; i++) {
    const existing = existingPitches[offset + i];
    const parsed = parsedPitches[i];

    if (existing && parsed) {
      const changed = existing.cotation !== parsed.cotation;
      if (changed) {
        stats.pitchesUpdated++;
        if (apply) {
          await prisma.pitch.update({
            where: { id: existing.id },
            data: { cotation: parsed.cotation },
          });
        }
      }
    } else if (!existing && parsed) {
      stats.pitchesCreated++;
      if (apply) {
        await prisma.pitch.create({
          data: { routeId, cotation: parsed.cotation, nbBolts },
        });
      }
    } else if (existing && !parsed) {
      warn(`Route ${routeId} has an existing pitch with no corresponding row in the sheet - left untouched`);
    }
  }
}

async function upsertRoute(
  sectorId: string,
  route: ParsedRoute,
  nbBolts: number | null,
  routesBySector: Map<string, NamedEntity[]>,
  pitchOffsets: Map<string, number>,
  stats: Stats,
): Promise<string> {
  let routes = routesBySector.get(sectorId);
  if (!routes) {
    routes = await prisma.route.findMany({ where: { sectorId } });
    routesBySector.set(sectorId, routes);
  }

  const key = normalizeForMatch(route.name);
  const candidates = routes.filter((r) => normalizeForMatch(r.name ?? '') === key);
  // Some names (e.g. the "???" placeholder for a not-yet-named route) legitimately
  // repeat within a sector for genuinely different climbs. A single name match is
  // trusted as-is, but with several candidates the route number - the only other
  // signal available - is required to pick the right one; otherwise the pitches of
  // unrelated routes would get merged and their cotations silently cross-contaminated.
  const match =
    candidates.length <= 1
      ? candidates[0]
      : candidates.find((r) => r.number === route.number);
  if (candidates.length > 1 && !match) {
    warn(`Ambiguous route name "${route.name}" in sector ${sectorId} (${candidates.length} existing routes share it, none match number ${route.number}) - creating a new route instead of guessing`);
  }

  let routeId: string;
  if (match) {
    routeId = match.id;
    stats.routesUpdated++;
    if (match.name !== route.name) {
      stats.routesRenamed++;
      if (apply) {
        await prisma.route.update({ where: { id: routeId }, data: { name: route.name } });
      }
      match.name = route.name;
    }
  } else {
    stats.routesCreated++;
    if (apply) {
      const created = await prisma.route.create({
        data: { sectorId, number: route.number, name: route.name },
      });
      routeId = created.id;
    } else {
      routeId = `dry-run-route:${sectorId}::${key}`;
    }
    routes.push({ id: routeId, name: route.name, number: route.number });
  }

  const offset = pitchOffsets.get(routeId) ?? 0;
  await reconcilePitches(routeId, route.pitches, nbBolts, stats, offset);
  pitchOffsets.set(routeId, offset + route.pitches.length);
  return routeId;
}

async function importSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  allCrags: NamedEntity[],
  sectorsByCrag: Map<string, NamedEntity[]>,
  routesBySector: Map<string, NamedEntity[]>,
  stats: Stats,
): Promise<void> {
  console.log(`\nProcessing sheet: ${sheetName}`);

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, {
    header: 1,
  });
  const dataRows = rows.slice(2);

  let currentSiteName: string | null = null;
  let currentConvention: boolean | null = null;
  let currentSectorName: string | null = null;
  let currentSectorId: string | null = null;
  let currentRouteId: string | null = null;

  const pitchOffsets = new Map<string, number>();
  let sectorPrefixMap = new Map<string, string>();
  let warnedStraySite = false;

  for (const row of dataRows) {
    if (!row || row.length === 0) continue;

    const siteCell = row[0]?.toString();
    const conventionCell = row[2]?.toString();
    const sectorCell = row[3]?.toString();
    const routeCell = row[4]?.toString();
    const nbBolts =
      typeof row[9] === 'number' ? row[9] : parseInt(row[9]!, 10) || null;

    if (siteCell?.trim()) {
      const trimmedSite = siteCell.trim();
      if (isValidCotation(trimmedSite)) {
        if (!warnedStraySite) {
          warn(`Sheet "${sheetName}": ignoring SITE column cells that look like stray grade values (e.g. "${trimmedSite}"), not site names`);
          warnedStraySite = true;
        }
      } else {
        currentSiteName = trimmedSite;
      }
    }
    if (conventionCell) currentConvention = parseConvention(conventionCell);
    if (sectorCell?.trim()) {
      const newSectorName = sectorCell.trim();
      if (newSectorName !== currentSectorName) {
        sectorPrefixMap = new Map();
        currentRouteId = null;
      }
      currentSectorName = newSectorName;
      currentSectorId = null;
    }

    if (!routeCell?.trim()) continue;
    if (routeCell.includes('VOIE')) continue;
    if (routeCell.trim().startsWith('=')) {
      warn(`Skipping row in sheet "${sheetName}": unresolved formula/placeholder cell "${routeCell}"`);
      continue;
    }

    if (!currentSiteName) {
      warn(`Sheet "${sheetName}": no valid SITE cell found - falling back to the sheet name as the crag name`);
      currentSiteName = sheetName;
    }
    if (!currentSectorName) {
      warn(`Skipping row in sheet "${sheetName}": missing sector for route "${routeCell}"`);
      continue;
    }

    const cragId = await upsertCrag(currentSiteName, currentConvention, allCrags, stats);
    if (!currentSectorId) {
      currentSectorId = await upsertSector(cragId, currentSectorName, sectorsByCrag, stats);
    }

    const { routes, prefixLabel, isContinuation } = parseRouteCell(routeCell, sectorPrefixMap);

    if (isContinuation) {
      if (!currentRouteId) {
        warn(`Skipping continuation row in sheet "${sheetName}": no current route for "${routeCell}"`);
        continue;
      }
      const extraPitches = routes[0]?.pitches ?? [];
      const offset = pitchOffsets.get(currentRouteId) ?? 0;
      await reconcilePitches(currentRouteId, extraPitches, nbBolts, stats, offset);
      pitchOffsets.set(currentRouteId, offset + extraPitches.length);
      continue;
    }

    for (const route of routes) {
      if (!route.name) continue;
      const routeId = await upsertRoute(
        currentSectorId,
        route,
        nbBolts,
        routesBySector,
        pitchOffsets,
        stats,
      );
      currentRouteId = routeId;
    }

    if (prefixLabel && routes.length === 1 && routes[0].name) {
      sectorPrefixMap.set(prefixLabel, routes[0].name);
    }
  }
}

async function main() {
  console.log(`Reading file: ${filePath}`);
  console.log(apply ? 'Mode: APPLY (writing to database)' : 'Mode: DRY RUN (no writes)');

  const workbook = XLSX.readFile(filePath);
  console.log(`Found ${workbook.SheetNames.length} sheets`);

  const allCrags: NamedEntity[] = await prisma.crag.findMany();
  const sectorsByCrag = new Map<string, NamedEntity[]>();
  const routesBySector = new Map<string, NamedEntity[]>();
  const stats: Stats = {
    cragsCreated: 0,
    cragsRenamed: 0,
    sectorsCreated: 0,
    sectorsRenamed: 0,
    routesCreated: 0,
    routesUpdated: 0,
    routesRenamed: 0,
    pitchesCreated: 0,
    pitchesUpdated: 0,
  };

  for (const sheetName of workbook.SheetNames) {
    if (sheetName === 'Sheet2') continue;
    await importSheet(workbook, sheetName, allCrags, sectorsByCrag, routesBySector, stats);
  }

  console.log('\n=== Import Plan ===');
  console.log(`Crags to create: ${stats.cragsCreated} (renamed: ${stats.cragsRenamed})`);
  console.log(`Sectors to create: ${stats.sectorsCreated} (renamed: ${stats.sectorsRenamed})`);
  console.log(`Routes to create: ${stats.routesCreated}`);
  console.log(`Routes matched/updated: ${stats.routesUpdated} (renamed: ${stats.routesRenamed})`);
  console.log(`Pitches to create: ${stats.pitchesCreated}`);
  console.log(`Pitches to update: ${stats.pitchesUpdated}`);

  if (warnings.length > 0) {
    console.log(`\n=== Warnings (${warnings.length}) ===`);
    for (const w of warnings) console.log(`  - ${w}`);
  }

  if (!apply) {
    console.log('\nDry run complete. Re-run with --apply to write these changes.');
  } else {
    console.log('\nImport completed successfully!');
  }
}

main()
  .catch((e) => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
