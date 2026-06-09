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
