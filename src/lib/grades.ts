/**
 * Utilities for climbing grade comparison
 */

/**
 * Parse a French climbing grade into comparable parts
 * e.g., "6a+" -> { number: 6, letter: "a", modifier: "+" }
 */
function parseGrade(grade: string): { number: number; letter: string; modifier: string } | null {
  const match = grade.match(/^(\d+)([a-c])?(\+)?$/i);
  if (!match) return null;
  return {
    number: parseInt(match[1], 10),
    letter: (match[2] || 'a').toLowerCase(),
    modifier: match[3] || '',
  };
}

/**
 * Compare two climbing grades. Returns positive if a > b, negative if a < b, 0 if equal.
 */
export function compareGrades(a: string, b: string): number {
  const pa = parseGrade(a);
  const pb = parseGrade(b);
  if (!pa && !pb) return 0;
  if (!pa) return -1;
  if (!pb) return 1;

  if (pa.number !== pb.number) return pa.number - pb.number;
  if (pa.letter !== pb.letter) return pa.letter.localeCompare(pb.letter);
  if (pa.modifier !== pb.modifier) return pa.modifier ? 1 : -1;
  return 0;
}

/**
 * Get the maximum cotation from a list of pitches
 */
export function getMaxCotation(pitches: { cotation: string | null }[]): string | null {
  const cotations = pitches.map((p) => p.cotation).filter((c): c is string => c != null);
  if (cotations.length === 0) return null;
  return cotations.reduce((max, c) => (compareGrades(c, max) > 0 ? c : max));
}
