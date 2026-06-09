import { z } from 'zod';

/**
 * Local persistence for an in-progress maintenance report.
 *
 * The draft is stored in `localStorage` so that it survives a full page
 * navigation — most importantly the sign-in flow, where OAuth / magic-link
 * providers navigate the browser away from the report form and back again.
 *
 * The draft shape is expected to evolve over time. We make no attempt to
 * upgrade old drafts: on read, anything that fails to parse or fails schema
 * validation is simply discarded and the user starts from a blank form. In
 * every failure case we return `null` — we never throw.
 */

export const REPORT_DRAFT_STORAGE_KEY = 'klip:report-draft';

/** Shape of the persisted draft. */
export const reportDraftSchema = z
  .object({
    routeId: z.string().min(1),
    selectedPitchIds: z.array(z.string().min(1)).min(1),
    problemDetected: z.boolean(),
    faultyBolt: z.boolean(),
    faultyAnchor: z.boolean(),
    dangerousClipping: z.boolean(),
    looseRock: z.boolean(),
    visualCheck: z.boolean(),
    anchorCheck: z.boolean(),
    cleaningDone: z.boolean(),
    trundleDone: z.boolean(),
    totalReboltingDone: z.boolean(),
    comment: z.string(),
  })
  // Reject unknown keys so a draft from a different shape is treated as stale
  // and discarded rather than partially restored.
  .strict();

export type ReportDraft = z.infer<typeof reportDraftSchema>;

/**
 * Parse a raw stored string into a validated {@link ReportDraft}, or `null`.
 * Pure and side-effect free, so it can be unit-tested without `localStorage`.
 */
export function deserializeReportDraft(raw: string | null): ReportDraft | null {
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = reportDraftSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

/** Serialize a draft for storage. */
export function serializeReportDraft(draft: ReportDraft): string {
  return JSON.stringify(draft);
}

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage;
  } catch {
    // Accessing localStorage can throw (e.g. disabled cookies, privacy mode).
    return null;
  }
}

/** Read and validate the persisted draft. Returns `null` when absent or unusable. */
export function loadReportDraft(): ReportDraft | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  try {
    return deserializeReportDraft(storage.getItem(REPORT_DRAFT_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Persist a draft. Silently no-ops when storage is unavailable. */
export function saveReportDraft(draft: ReportDraft): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(REPORT_DRAFT_STORAGE_KEY, serializeReportDraft(draft));
  } catch {
    // Storage full or unavailable — losing the draft is acceptable here.
  }
}

/** Remove any persisted draft. */
export function clearReportDraft(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(REPORT_DRAFT_STORAGE_KEY);
  } catch {
    // Ignore — nothing else to do.
  }
}
