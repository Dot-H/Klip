/**
 * Pure helpers for the batch ("rapport groupé") report flow, where a single
 * maintenance report is filed against several pitches of a crag at once.
 *
 * A report always applies to a pitch, never to a route: multi-pitch routes
 * expand into one selectable line per pitch, exactly like single-route reports.
 * The batch flow reuses the per-pitch `/api/reports` endpoint, creating one
 * report per selected pitch.
 */

export interface PitchRef {
  id: string;
}

export interface RouteRef {
  pitches: PitchRef[];
}

/** Every pitch ID across the given routes, in order. */
export function pitchIdsOf(routes: RouteRef[]): string[] {
  return routes.flatMap((route) => route.pitches.map((pitch) => pitch.id));
}

// Combining diacritical marks (U+0300–U+036F), left after NFD decomposition.
const DIACRITICS = /[̀-ͯ]/g;

/** Lowercase and strip accents so searches are diacritic-insensitive. */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS, '').toLowerCase().trim();
}

function routeLabelOf(route: { number: number; name: string | null }): string {
  return route.name ? `${route.number}. ${route.name}` : `Voie ${route.number}`;
}

/**
 * Filter sectors for the batch picker's search box. An empty query matches
 * nothing (the picker shows a hint instead of the whole crag). When the query
 * matches a sector name, every route of that sector is returned; otherwise only
 * the routes whose label matches are kept. Matching is accent-insensitive.
 */
export function filterSectors<
  R extends { number: number; name: string | null },
  S extends { name: string; routes: R[] },
>(sectors: S[], query: string): S[] {
  const q = normalizeText(query);
  if (!q) {
    return [];
  }
  return sectors.flatMap((sector) => {
    if (normalizeText(sector.name).includes(q)) {
      return [sector];
    }
    const routes = sector.routes.filter((route) =>
      normalizeText(routeLabelOf(route)).includes(q),
    );
    return routes.length > 0 ? [{ ...sector, routes }] : [];
  });
}

export type GroupSelection = 'none' | 'some' | 'all';

/**
 * Whether none, some or all of `ids` are currently selected. Used to drive a
 * group checkbox (e.g. a sector header): `some` maps to the indeterminate
 * state. An empty group is treated as `none`.
 */
export function groupSelection(
  ids: string[],
  selected: ReadonlySet<string>,
): GroupSelection {
  if (ids.length === 0) {
    return 'none';
  }
  const selectedCount = ids.filter((id) => selected.has(id)).length;
  if (selectedCount === 0) {
    return 'none';
  }
  return selectedCount === ids.length ? 'all' : 'some';
}
