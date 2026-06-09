import { collectPitchIds, type BatchRoute } from '../batchReport';

const routes: BatchRoute[] = [
  { id: 'r1', pitchIds: ['p1'] },
  { id: 'r2', pitchIds: ['p2a', 'p2b'] },
  { id: 'r3', pitchIds: ['p3'] },
  { id: 'r4', pitchIds: [] },
];

describe('collectPitchIds', () => {
  it('returns no pitches when nothing is selected', () => {
    expect(collectPitchIds(routes, new Set())).toEqual([]);
  });

  it('flattens every pitch of the selected routes, in route order', () => {
    expect(collectPitchIds(routes, new Set(['r2', 'r1']))).toEqual([
      'p1',
      'p2a',
      'p2b',
    ]);
  });

  it('ignores selected routes that have no pitches', () => {
    expect(collectPitchIds(routes, new Set(['r4', 'r3']))).toEqual(['p3']);
  });

  it('ignores selected ids that match no route', () => {
    expect(collectPitchIds(routes, new Set(['does-not-exist']))).toEqual([]);
  });
});
