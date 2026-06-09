import { pitchIdsOf, groupSelection, type RouteRef } from '../batchReport';

const routes: RouteRef[] = [
  { pitches: [{ id: 'p1' }] },
  { pitches: [{ id: 'p2a' }, { id: 'p2b' }, { id: 'p2c' }] },
  { pitches: [] },
];

describe('pitchIdsOf', () => {
  it('flattens every pitch of the routes, in order', () => {
    expect(pitchIdsOf(routes)).toEqual(['p1', 'p2a', 'p2b', 'p2c']);
  });

  it('returns an empty array when there are no pitches', () => {
    expect(pitchIdsOf([{ pitches: [] }])).toEqual([]);
  });
});

describe('groupSelection', () => {
  it('is "none" when nothing in the group is selected', () => {
    expect(groupSelection(['a', 'b'], new Set())).toBe('none');
    expect(groupSelection(['a', 'b'], new Set(['x']))).toBe('none');
  });

  it('is "some" when only part of the group is selected', () => {
    expect(groupSelection(['a', 'b', 'c'], new Set(['b']))).toBe('some');
  });

  it('is "all" when every member is selected', () => {
    expect(groupSelection(['a', 'b'], new Set(['a', 'b', 'extra']))).toBe(
      'all',
    );
  });

  it('treats an empty group as "none"', () => {
    expect(groupSelection([], new Set(['a']))).toBe('none');
  });
});
