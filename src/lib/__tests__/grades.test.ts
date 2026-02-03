import { compareGrades, getMaxCotation } from '../grades';

describe('compareGrades', () => {
  describe('basic comparisons', () => {
    it('returns 0 for equal grades', () => {
      expect(compareGrades('6a', '6a')).toBe(0);
      expect(compareGrades('7b+', '7b+')).toBe(0);
      expect(compareGrades('5', '5')).toBe(0);
    });

    it('compares grades by number first', () => {
      expect(compareGrades('7a', '6a')).toBeGreaterThan(0);
      expect(compareGrades('5a', '6a')).toBeLessThan(0);
      expect(compareGrades('8a', '7c+')).toBeGreaterThan(0);
    });

    it('compares grades by letter when numbers are equal', () => {
      expect(compareGrades('6b', '6a')).toBeGreaterThan(0);
      expect(compareGrades('6a', '6b')).toBeLessThan(0);
      expect(compareGrades('7c', '7b')).toBeGreaterThan(0);
    });

    it('compares grades by modifier (+) when number and letter are equal', () => {
      expect(compareGrades('6a+', '6a')).toBeGreaterThan(0);
      expect(compareGrades('6a', '6a+')).toBeLessThan(0);
      expect(compareGrades('7b+', '7b')).toBeGreaterThan(0);
    });
  });

  describe('grades without letter', () => {
    it('treats missing letter as "a"', () => {
      expect(compareGrades('6', '6a')).toBe(0);
      expect(compareGrades('6', '6b')).toBeLessThan(0);
    });
  });

  describe('case insensitivity', () => {
    it('handles uppercase letters', () => {
      expect(compareGrades('6A', '6a')).toBe(0);
      expect(compareGrades('6B', '6a')).toBeGreaterThan(0);
    });
  });

  describe('invalid grades', () => {
    it('returns 0 when both grades are invalid', () => {
      expect(compareGrades('invalid', 'notvalid')).toBe(0);
      expect(compareGrades('', '')).toBe(0);
    });

    it('returns -1 when first grade is invalid', () => {
      expect(compareGrades('invalid', '6a')).toBe(-1);
      expect(compareGrades('', '7b')).toBe(-1);
    });

    it('returns 1 when second grade is invalid', () => {
      expect(compareGrades('6a', 'invalid')).toBe(1);
      expect(compareGrades('7b', '')).toBe(1);
    });
  });

  describe('sorting order', () => {
    it('can sort an array of grades correctly', () => {
      const grades = ['7a', '6b+', '5c', '7a+', '6b', '8a'];
      const sorted = [...grades].sort(compareGrades);
      expect(sorted).toEqual(['5c', '6b', '6b+', '7a', '7a+', '8a']);
    });

    it('handles multi-digit numbers', () => {
      const grades = ['9a', '10a', '11a'];
      const sorted = [...grades].sort(compareGrades);
      expect(sorted).toEqual(['9a', '10a', '11a']);
    });
  });
});

describe('getMaxCotation', () => {
  it('returns the maximum cotation from a list of pitches', () => {
    const pitches = [
      { cotation: '6a' },
      { cotation: '7b' },
      { cotation: '6c+' },
    ];
    expect(getMaxCotation(pitches)).toBe('7b');
  });

  it('returns null for empty list', () => {
    expect(getMaxCotation([])).toBeNull();
  });

  it('returns null when all cotations are null', () => {
    const pitches = [
      { cotation: null },
      { cotation: null },
    ];
    expect(getMaxCotation(pitches)).toBeNull();
  });

  it('ignores null cotations', () => {
    const pitches = [
      { cotation: '6a' },
      { cotation: null },
      { cotation: '7b' },
      { cotation: null },
    ];
    expect(getMaxCotation(pitches)).toBe('7b');
  });

  it('handles single pitch', () => {
    const pitches = [{ cotation: '6a' }];
    expect(getMaxCotation(pitches)).toBe('6a');
  });

  it('handles grades with + modifier correctly', () => {
    const pitches = [
      { cotation: '6a' },
      { cotation: '6a+' },
    ];
    expect(getMaxCotation(pitches)).toBe('6a+');
  });

  it('handles multi-pitch route scenario', () => {
    // Simulating Pichenibule route from seed data
    const pitches = [
      { cotation: '6b' },
      { cotation: '6c' },
      { cotation: '6a+' },
    ];
    expect(getMaxCotation(pitches)).toBe('6c');
  });
});
