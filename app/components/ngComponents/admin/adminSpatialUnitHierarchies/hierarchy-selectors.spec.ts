import { createHierarchy } from './hierarchy-demo.data';
import { DemoHierarchy, RegisteredLevel } from './hierarchy-demo.model';
import {
  countLevelUsage,
  hierarchiesOfMandant,
  hierarchyNames,
  levelUsage,
  levelsOfMandant,
  mandantOverviewRows,
  unassignedLevels,
} from './hierarchy-selectors';

function hierarchy(name: string, mandant: string, levels: string[]): DemoHierarchy {
  return createHierarchy({ id: name, name, mandant, levels, open: true });
}

function level(name: string, mandant: string): RegisteredLevel {
  return { id: `id-${name}`, name, mandant, datasource: 'Katasteramt' };
}

describe('countLevelUsage', () => {
  it('counts how many chains each level name sits in', () => {
    const usage = countLevelUsage([
      hierarchy('Verwaltung', 'Essen', ['Stadt', 'Bezirke', 'Stadtteile']),
      hierarchy('Sozialraum', 'Essen', ['Stadt', 'Bezirke', 'Quartiere']),
    ]);

    expect(usage.get('Stadt')).toBe(2);
    expect(usage.get('Bezirke')).toBe(2);
    expect(usage.get('Stadtteile')).toBe(1);
    expect(usage.get('Quartiere')).toBe(1);
  });

  it('counts nothing without hierarchies', () => {
    expect(countLevelUsage([]).size).toBe(0);
  });
});

describe('levelUsage', () => {
  it('hands the counts to the dialog as a plain record', () => {
    const usage = levelUsage([
      hierarchy('Verwaltung', 'Essen', ['Stadt', 'Bezirke']),
      hierarchy('Raster', 'Essen', ['Stadt', 'Raster 1 km']),
    ]);

    expect(usage).toEqual({ Stadt: 2, Bezirke: 1, 'Raster 1 km': 1 });
  });
});

describe('hierarchyNames', () => {
  it('reads the current names, not the ones they were created with', () => {
    const h = hierarchy('Verwaltung', 'Essen', ['Stadt']);
    h.name.set('Verwaltungsgliederung');

    expect(hierarchyNames([h])).toEqual(['Verwaltungsgliederung']);
  });
});

describe('hierarchiesOfMandant', () => {
  const hierarchies = [
    hierarchy('Verwaltung', 'Essen', ['Stadt Essen']),
    hierarchy('Raster', 'Bochum', ['Stadt Bochum']),
  ];

  it('keeps the tenant its own hierarchies', () => {
    expect(hierarchyNames(hierarchiesOfMandant(hierarchies, 'Essen'))).toEqual(['Verwaltung']);
  });

  it('shows all of them across tenants', () => {
    expect(hierarchiesOfMandant(hierarchies, '')).toHaveLength(2);
  });
});

describe('levelsOfMandant', () => {
  const registry = [level('Stadt Essen', 'Essen'), level('Stadt Bochum', 'Bochum')];

  it('keeps the tenant its own levels', () => {
    expect(levelsOfMandant(registry, 'Essen').map((entry) => entry.name)).toEqual(['Stadt Essen']);
  });

  it('offers the whole registry across tenants', () => {
    expect(levelsOfMandant(registry, '')).toHaveLength(2);
  });
});

describe('unassignedLevels', () => {
  const registry = [
    level('Stadt Essen', 'Essen'),
    level('Wahlbezirke Essen', 'Essen'),
    level('Stadt Bochum', 'Bochum'),
  ];

  it('lists what no chain carries, within the tenant', () => {
    const hierarchies = [hierarchy('Verwaltung', 'Essen', ['Stadt Essen'])];

    expect(unassignedLevels(registry, hierarchies, 'Essen').map((entry) => entry.name)).toEqual([
      'Wahlbezirke Essen',
    ]);
  });

  it('counts a level another tenant builds on as used', () => {
    const shared = [level('Raster 1 km', 'Essen'), level('Raster 500 m', 'Essen')];
    const hierarchies = [hierarchy('Raster', 'Bochum', ['Raster 1 km'])];

    expect(unassignedLevels(shared, hierarchies, 'Essen').map((entry) => entry.name)).toEqual([
      'Raster 500 m',
    ]);
  });

  it('lists the whole registry while nothing is built on it', () => {
    expect(unassignedLevels(registry, [], '')).toHaveLength(3);
  });
});

describe('mandantOverviewRows', () => {
  it('lists the Keycloak tenants in its order, empty ones included', () => {
    const rows = mandantOverviewRows(
      [hierarchy('Raster', 'Bochum', ['Stadt Bochum'])],
      ['Essen', 'Bochum']
    );

    expect(rows.map((row) => row.name)).toEqual(['Essen', 'Bochum']);
    expect(rows[0]).toEqual({
      name: 'Essen',
      hierarchyCount: 0,
      levelCount: 0,
      sharedLevelCount: 0,
    });
  });

  it('appends a tenant that only appears in the data', () => {
    const rows = mandantOverviewRows(
      [hierarchy('Raster', 'Krefeld', ['Stadt Krefeld'])],
      ['Essen']
    );

    expect(rows.map((row) => row.name)).toEqual(['Essen', 'Krefeld']);
  });

  it('counts distinct levels and the ones shared between the chains', () => {
    const rows = mandantOverviewRows(
      [
        hierarchy('Verwaltung', 'Essen', ['Stadt', 'Bezirke', 'Stadtteile']),
        hierarchy('Sozialraum', 'Essen', ['Stadt', 'Bezirke', 'Quartiere']),
      ],
      ['Essen']
    );

    expect(rows[0]).toEqual({
      name: 'Essen',
      hierarchyCount: 2,
      // Stadt, Bezirke, Stadtteile, Quartiere — counted once each …
      levelCount: 4,
      // … of which Stadt and Bezirke sit in both chains.
      sharedLevelCount: 2,
    });
  });

  it('summarizes nothing where the data knows no tenant', () => {
    expect(mandantOverviewRows([hierarchy('Verwaltung', '', ['Stadt'])], [])).toEqual([]);
  });
});
