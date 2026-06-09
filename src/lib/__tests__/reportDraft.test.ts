import {
  REPORT_DRAFT_STORAGE_KEY,
  type ReportDraft,
  serializeReportDraft,
  deserializeReportDraft,
  loadReportDraft,
  saveReportDraft,
  clearReportDraft,
} from '../reportDraft';

const validDraft: ReportDraft = {
  cragId: 'crag-1',
  origin: [],
  selectedPitchIds: ['pitch-1', 'pitch-2'],
  problemDetected: true,
  faultyBolt: true,
  faultyAnchor: false,
  dangerousClipping: false,
  looseRock: false,
  visualCheck: true,
  anchorCheck: false,
  cleaningDone: false,
  trundleDone: false,
  totalReboltingDone: false,
  comment: 'Plaquette du premier point à remplacer',
};

beforeEach(() => {
  localStorage.clear();
});

describe('serialize / deserialize round trip', () => {
  it('restores an identical draft', () => {
    const restored = deserializeReportDraft(serializeReportDraft(validDraft));
    expect(restored).toEqual(validDraft);
  });
});

describe('deserializeReportDraft - discards anything it cannot read', () => {
  it('returns null for null / empty input', () => {
    expect(deserializeReportDraft(null)).toBeNull();
    expect(deserializeReportDraft('')).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    expect(deserializeReportDraft('{not json')).toBeNull();
  });

  it('returns null when a required field is missing', () => {
    const { comment: _comment, ...withoutComment } = validDraft;
    expect(deserializeReportDraft(JSON.stringify(withoutComment))).toBeNull();
  });

  it('returns null when a field has the wrong type', () => {
    expect(
      deserializeReportDraft(JSON.stringify({ ...validDraft, visualCheck: 'yes' })),
    ).toBeNull();
  });

  it('accepts an empty selection (fields can be drafted before picking pitches)', () => {
    const empty = { ...validDraft, selectedPitchIds: [] };
    expect(deserializeReportDraft(JSON.stringify(empty))).toEqual(empty);
  });

  it('returns null for a draft of a different (evolved) shape', () => {
    // A draft written by an older or newer build that no longer matches the
    // current schema is treated as stale and discarded, so the user simply
    // starts from a fresh form.
    const legacyDraft = {
      routeId: 'route-1',
      pitchId: 'pitch-1', // renamed away from `selectedPitchIds`
      visualCheck: true,
      comment: 'old draft',
    };
    expect(deserializeReportDraft(JSON.stringify(legacyDraft))).toBeNull();
  });

  it('returns null when an unknown extra field is present', () => {
    expect(
      deserializeReportDraft(JSON.stringify({ ...validDraft, experimentalFlag: true })),
    ).toBeNull();
  });
});

describe('localStorage helpers', () => {
  it('saves and loads a draft', () => {
    saveReportDraft(validDraft);
    expect(loadReportDraft()).toEqual(validDraft);
  });

  it('clears a saved draft', () => {
    saveReportDraft(validDraft);
    clearReportDraft();
    expect(loadReportDraft()).toBeNull();
    expect(localStorage.getItem(REPORT_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('returns null when nothing has been saved', () => {
    expect(loadReportDraft()).toBeNull();
  });

  it('returns null (and does not throw) when stored data is corrupt', () => {
    localStorage.setItem(REPORT_DRAFT_STORAGE_KEY, 'garbage');
    expect(loadReportDraft()).toBeNull();
  });

  it('does not throw when localStorage access fails', () => {
    const getItem = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('storage disabled');
      });
    const setItem = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('storage disabled');
      });

    expect(() => saveReportDraft(validDraft)).not.toThrow();
    expect(loadReportDraft()).toBeNull();

    getItem.mockRestore();
    setItem.mockRestore();
  });
});
