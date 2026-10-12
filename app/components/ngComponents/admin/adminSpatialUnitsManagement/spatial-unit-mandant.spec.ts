import {
  mandantOfSpatialUnit,
  spatialUnitMandantOptions,
  spatialUnitsOfMandant,
} from './spatial-unit-mandant';

/** Keycloak's tenants of these specs, by id. */
const names: Record<string, string> = { 'm-essen': 'Stadt Essen', 'm-bochum': 'Stadt Bochum' };
const nameOf = (mandantId: string): string => names[mandantId] ?? '';

function unit(id: string, mandantId?: string): { id: string; mandantId?: string } {
  return { id, mandantId };
}

describe('mandantOfSpatialUnit', () => {
  it('names the tenant Keycloak knows', () => {
    expect(mandantOfSpatialUnit(unit('a', 'm-essen'), nameOf)).toBe('Stadt Essen');
  });

  it('falls back to the id of a tenant Keycloak does not know', () => {
    expect(mandantOfSpatialUnit(unit('a', 'm-unknown'), nameOf)).toBe('m-unknown');
  });

  it('is empty for a unit without a tenant', () => {
    expect(mandantOfSpatialUnit(unit('a'), nameOf)).toBe('');
    expect(mandantOfSpatialUnit(unit('a', ''), nameOf)).toBe('');
  });
});

describe('spatialUnitMandantOptions', () => {
  it('lists the Keycloak tenants in order, empty ones included, with their counts', () => {
    const options = spatialUnitMandantOptions(
      [unit('a', 'm-bochum'), unit('b', 'm-bochum')],
      ['Stadt Essen', 'Stadt Bochum'],
      nameOf
    );

    expect(options).toEqual([
      { name: 'Stadt Essen', count: 0 },
      { name: 'Stadt Bochum', count: 2 },
    ]);
  });

  it('appends tenants that only the data names', () => {
    const options = spatialUnitMandantOptions(
      [unit('a', 'm-unknown'), unit('b', 'm-essen')],
      ['Stadt Essen'],
      nameOf
    );

    expect(options).toEqual([
      { name: 'Stadt Essen', count: 1 },
      { name: 'm-unknown', count: 1 },
    ]);
  });

  it('counts units without a tenant towards none', () => {
    expect(spatialUnitMandantOptions([unit('a'), unit('b', '')], [], nameOf)).toEqual([]);
  });
});

describe('spatialUnitsOfMandant', () => {
  const units = [unit('a', 'm-essen'), unit('b', 'm-bochum'), unit('c'), unit('d', 'm-essen')];

  it('keeps the units of the chosen tenant', () => {
    expect(spatialUnitsOfMandant(units, 'Stadt Essen', nameOf).map((u) => u.id)).toEqual([
      'a',
      'd',
    ]);
  });

  it('leaves units without a tenant out of every tenant', () => {
    expect(spatialUnitsOfMandant(units, 'Stadt Bochum', nameOf).map((u) => u.id)).toEqual(['b']);
  });

  it('shows everything in the overview, units without a tenant included', () => {
    expect(spatialUnitsOfMandant(units, '', nameOf).map((u) => u.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});
