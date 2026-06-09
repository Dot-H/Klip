import {
  pitchIdsOf,
  groupSelection,
  normalizeText,
  filterSectors,
  type RouteRef,
} from '../batchReport';

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

describe('normalizeText', () => {
  it('lowercases, trims and strips accents', () => {
    expect(normalizeText('  Données Partielles  ')).toBe('donnees partielles');
    expect(normalizeText('Escalès')).toBe('escales');
  });
});

const crag = [
  {
    name: 'Escalès',
    routes: [
      { number: 1, name: 'Pichenibule' },
      { number: 2, name: 'Luna Bong' },
    ],
  },
  {
    name: 'Styx',
    routes: [
      { number: 1, name: 'Rose des Sables' },
      { number: 2, name: null },
    ],
  },
];

describe('filterSectors', () => {
  it('returns nothing for an empty query', () => {
    expect(filterSectors(crag, '   ')).toEqual([]);
  });

  it('returns every route when the sector name matches', () => {
    const result = filterSectors(crag, 'escal');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Escalès');
    expect(result[0].routes).toHaveLength(2);
  });

  it('keeps only matching routes when the query matches route names', () => {
    const result = filterSectors(crag, 'pich');
    expect(result).toHaveLength(1);
    expect(result[0].routes.map((r) => r.name)).toEqual(['Pichenibule']);
  });

  it('matches accent-insensitively', () => {
    expect(filterSectors(crag, 'ESCALES')).toHaveLength(1);
  });

  it('matches unnamed routes by their "Voie N" label', () => {
    const result = filterSectors(crag, 'voie 2');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Styx');
    expect(result[0].routes).toHaveLength(1);
    expect(result[0].routes[0].number).toBe(2);
  });

  it('returns no sector when nothing matches', () => {
    expect(filterSectors(crag, 'zzz')).toEqual([]);
  });
});
