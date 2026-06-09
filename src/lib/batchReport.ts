/**
 * Pure helpers for the batch ("rapport groupé") report flow, where a single
 * maintenance report is filed against several routes of a crag at once.
 *
 * A batch report applies to whole routes: every pitch of a selected route gets
 * its own report (reusing the per-pitch `/api/reports` endpoint), so the
 * per-pitch maintenance history stays consistent with single-route reports.
 */

export interface BatchRoute {
  id: string;
  /** IDs of every pitch belonging to the route. */
  pitchIds: string[];
}

/**
 * Flatten the selected routes into the list of pitch IDs to report on,
 * preserving route order. Routes that are not selected — or that have no
 * pitches — contribute nothing.
 */
export function collectPitchIds(
  routes: BatchRoute[],
  selectedRouteIds: ReadonlySet<string>,
): string[] {
  return routes
    .filter((route) => selectedRouteIds.has(route.id))
    .flatMap((route) => route.pitchIds);
}
