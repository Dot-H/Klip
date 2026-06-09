/**
 * Shared shape and helpers for the maintenance report fields.
 *
 * Used both by the single-route {@link ReportForm} and the multi-route
 * (batch) report flow so the two stay in sync.
 */

export interface ReportFormData {
  problemDetected: boolean;
  faultyBolt: boolean;
  faultyAnchor: boolean;
  dangerousClipping: boolean;
  looseRock: boolean;
  visualCheck: boolean;
  anchorCheck: boolean;
  cleaningDone: boolean;
  trundleDone: boolean;
  totalReboltingDone: boolean;
  comment: string;
}

export const DEFAULT_REPORT_FORM_DATA: ReportFormData = {
  problemDetected: false,
  faultyBolt: false,
  faultyAnchor: false,
  dangerousClipping: false,
  looseRock: false,
  visualCheck: false,
  anchorCheck: false,
  cleaningDone: false,
  trundleDone: false,
  totalReboltingDone: false,
  comment: '',
};

/** Sub-checkboxes shown when "Problème détecté" is ticked. */
export const PROBLEM_DETAILS = [
  { name: 'faultyBolt', label: 'Point défectueux' },
  { name: 'faultyAnchor', label: 'Relais défectueux' },
  { name: 'dangerousClipping', label: 'Clippage dangereux' },
  { name: 'looseRock', label: 'Rocher instable' },
] as const satisfies readonly { name: keyof ReportFormData; label: string }[];

/** Checkboxes describing the maintenance actions performed. */
export const REPORT_ACTIONS = [
  { name: 'visualCheck', label: 'Contrôle visuel effectué' },
  { name: 'anchorCheck', label: 'Ancrages vérifiés' },
  { name: 'cleaningDone', label: 'Nettoyage effectué' },
  { name: 'trundleDone', label: 'Purge effectuée' },
  { name: 'totalReboltingDone', label: 'Rééquipement total effectué' },
] as const satisfies readonly { name: keyof ReportFormData; label: string }[];

/**
 * Apply a checkbox/text change to the report form data. Pure so it can be
 * reused by every form's `setFormData` updater (and unit-tested in isolation).
 *
 * Turning off "Problème détecté" clears its sub-options, so a previously
 * selected problem is never submitted alongside an unchecked parent.
 */
export function applyReportFieldChange(
  prev: ReportFormData,
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
): ReportFormData {
  const { name, value, type } = e.target;
  const checked = (e.target as HTMLInputElement).checked;
  return {
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
    ...(name === 'problemDetected' && !checked
      ? {
          faultyBolt: false,
          faultyAnchor: false,
          dangerousClipping: false,
          looseRock: false,
        }
      : {}),
  };
}
