import {
  MandantLookup,
  mandantOfSpatialUnit,
  spatialUnitMandantOptions,
  spatialUnitsOfMandant,
} from './spatial-unit-mandant';

/** Keycloak's tenants of these specs, by id. */
const names: Record<string, string> = { 'm-essen': 'Stadt Essen', 'm-bochum': 'Stadt Bochum' };

/**
 * The organizational units the owners resolve through: each tenant owns
 * itself, and the Essen planning office sits below its tenant.
 */
const tenantOfOwner: Record<string, string> = {
  'm-essen': 'm-essen',
  'ou-essen-planning': 'm-essen',
  'm-bochum': 'm-bochum',
};

const mandants: MandantLookup = {
  mandantIdOfOwner: (ownerId) => tenantOfOwner[ownerId ?? ''] ?? '',
  mandantNameOf: (mandantId) => names[mandantId] ?? '',
};

function unit(id: string, ownerId?: string): { id: string; ownerId?: string } {
  return { id, ownerId };
}

describe('mandantOfSpatialUnit', () => {
  it('names the tenant that owns the unit', () => {
    expect(mandantOfSpatialUnit(unit('a', 'm-essen'), mandants)).toBe('Stadt Essen');
  });

  it('finds the tenant above an owner that is not a tenant itself', () => {
    expect(mandantOfSpatialUnit(unit('a', 'ou-essen-planning'), mandants)).toBe('Stadt Essen');
  });

  it('is empty for an unknown owner and for a unit without one', () => {
    expect(mandantOfSpatialUnit(unit('a', 'ou-unknown'), mandants)).toBe('');
    expect(mandantOfSpatialUnit(unit('a'), mandants)).toBe('');
  });
});

describe('spatialUnitMandantOptions', () => {
  it('lists the Keycloak tenants in order, empty ones included, with their counts', () => {
    const options = spatialUnitMandantOptions(
      [unit('a', 'm-bochum'), unit('b', 'm-bochum')],
      ['Stadt Essen', 'Stadt Bochum'],
      mandants
    );

    expect(options).toEqual([
      { name: 'Stadt Essen', count: 0 },
      { name: 'Stadt Bochum', count: 2 },
    ]);
  });

  it('counts a unit towards the tenant above its owner', () => {
    const options = spatialUnitMandantOptions(
      [unit('a', 'ou-essen-planning'), unit('b', 'm-essen')],
      ['Stadt Essen'],
      mandants
    );

    expect(options).toEqual([{ name: 'Stadt Essen', count: 2 }]);
  });

  it('counts units without a resolvable owner towards none', () => {
    expect(spatialUnitMandantOptions([unit('a'), unit('b', 'ou-unknown')], [], mandants)).toEqual(
      []
    );
  });
});

describe('spatialUnitsOfMandant', () => {
  const units = [
    unit('a', 'm-essen'),
    unit('b', 'm-bochum'),
    unit('c'),
    unit('d', 'ou-essen-planning'),
  ];

  it('keeps the units of the chosen tenant, those owned below it included', () => {
    expect(spatialUnitsOfMandant(units, 'Stadt Essen', mandants).map((u) => u.id)).toEqual([
      'a',
      'd',
    ]);
  });

  it('leaves units without a tenant out of every tenant', () => {
    expect(spatialUnitsOfMandant(units, 'Stadt Bochum', mandants).map((u) => u.id)).toEqual(['b']);
  });

  it('shows everything in the overview, units without a tenant included', () => {
    expect(spatialUnitsOfMandant(units, '', mandants).map((u) => u.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });
});
