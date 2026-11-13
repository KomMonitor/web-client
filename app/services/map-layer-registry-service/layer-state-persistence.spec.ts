import {
  LocalStorageLayerStatePersistence,
  MAP_LAYERS_PREFERENCES_STORAGE_KEY,
} from './layer-state-persistence';

describe('LocalStorageLayerStatePersistence', () => {
  let persistence: LocalStorageLayerStatePersistence;

  beforeEach(() => {
    localStorage.clear();
    persistence = new LocalStorageLayerStatePersistence();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('has no preferences at first', () => {
    expect(persistence.load()).toEqual({});
  });

  it('stores the preferences versioned and reads them back', () => {
    persistence.save({ baseLayer: { id: 'base:Farbe', opacity: 0.4 } });

    expect(JSON.parse(localStorage.getItem(MAP_LAYERS_PREFERENCES_STORAGE_KEY)!)).toEqual({
      version: 1,
      baseLayer: { id: 'base:Farbe', opacity: 0.4 },
    });
    expect(new LocalStorageLayerStatePersistence().load()).toEqual({
      baseLayer: { id: 'base:Farbe', opacity: 0.4 },
    });
  });

  it('keeps the empty map as a choice', () => {
    persistence.save({ baseLayer: { id: null, opacity: 1 } });

    expect(persistence.load()).toEqual({ baseLayer: { id: null, opacity: 1 } });
  });

  it('uses its own key if given one', () => {
    new LocalStorageLayerStatePersistence('other').save({ baseLayer: { id: null, opacity: 1 } });

    expect(persistence.load()).toEqual({});
  });

  it.each([
    ['another version', JSON.stringify({ version: 2, baseLayer: { id: 'base:a', opacity: 1 } })],
    ['broken JSON', '{"version": 1,'],
    ['an invalid base layer', JSON.stringify({ version: 1, baseLayer: { id: 7, opacity: 1 } })],
    [
      'an opacity out of range',
      JSON.stringify({ version: 1, baseLayer: { id: null, opacity: 3 } }),
    ],
    ['no object', '"text"'],
  ])('ignores %s', (_, stored) => {
    localStorage.setItem(MAP_LAYERS_PREFERENCES_STORAGE_KEY, stored);

    expect(persistence.load()).toEqual({});
  });

  it('works without storage', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => persistence.save({ baseLayer: { id: null, opacity: 1 } })).not.toThrow();
    expect(persistence.load()).toEqual({});
  });
});
