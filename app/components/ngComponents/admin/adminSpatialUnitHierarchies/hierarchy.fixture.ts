import { SpatialUnitHierarchyOverviewType } from 'models/data-management-api';

import { RegisteredLevel, SpatialUnitHierarchy, createHierarchy } from './hierarchy.model';

/**
 * Builders for the hierarchy page's specs, shared so the level ids line up
 * across them: a level named `Stadt` is `id-Stadt` everywhere, in a chain and
 * in the registry alike, which is what the selectors match on.
 *
 * Not used by the application — only by `*.spec.ts` in this folder.
 */

/** The API answer for a hierarchy whose chain is given by level name. */
export function hierarchyOverview(
  name: string,
  mandantId: string,
  levelNames: readonly string[],
  isPublic = false
): SpatialUnitHierarchyOverviewType {
  return {
    hierarchyId: `h-${name}`,
    name,
    mandantId,
    isPublic,
    members: levelNames.map((levelName, index) => ({
      spatialUnitId: `id-${levelName}`,
      spatialUnitLevel: levelName,
      hierarchyLevel: index,
    })),
  };
}

/** A ready-built hierarchy; `mandant` doubles as its id, as the specs never resolve one. */
export function hierarchyFixture(
  name: string,
  mandant: string,
  levelNames: readonly string[],
  isPublic = false
): SpatialUnitHierarchy {
  return createHierarchy(hierarchyOverview(name, mandant, levelNames, isPublic), (id) => id);
}

/** A registry entry whose id matches the chain entry of the same name. */
export function levelFixture(name: string, mandant: string): RegisteredLevel {
  return { id: `id-${name}`, name, mandant, datasource: 'Katasteramt' };
}

/** The tenants of the seed below, in the order Keycloak would name them. */
export const SEED_MANDANTS = [
  'Stadt Essen',
  'Stadt Bochum',
  'Kreis Recklinghausen',
  'Stadt Krefeld',
];

/** The seed's hierarchies as name, tenant and chain. */
const SEED: readonly [string, string, string[]][] = [
  [
    'Verwaltungsgliederung',
    'Stadt Essen',
    [
      'Stadt Essen',
      'Stadtbezirke Essen',
      'Stadtteile Essen',
      'Stadtviertel Essen',
      'Baublöcke Essen',
    ],
  ],
  [
    'Sozialraum-Gliederung',
    'Stadt Essen',
    ['Stadt Essen', 'Stadtbezirke Essen', 'Sozialräume Essen', 'Quartiere Essen'],
  ],
  [
    'Verwaltungsgliederung Bochum',
    'Stadt Bochum',
    ['Stadt Bochum', 'Stadtbezirke Bochum', 'Stadtteile Bochum'],
  ],
  [
    'Kreisgliederung Recklinghausen',
    'Kreis Recklinghausen',
    [
      'Kreis Recklinghausen',
      'Städte im Kreis Recklinghausen',
      'Stadtteile im Kreis Recklinghausen',
    ],
  ],
  [
    'Rastergliederung Recklinghausen',
    'Kreis Recklinghausen',
    ['Kreis Recklinghausen', 'Raster 1 km', 'Raster 500 m', 'Raster 100 m'],
  ],
  [
    'Verwaltungsgliederung Krefeld',
    'Stadt Krefeld',
    ['Stadt Krefeld', 'Stadtbezirke Krefeld', 'Stadtteile Krefeld'],
  ],
];

/**
 * The seed as the API would answer it — four tenants, so the page spec's tenant
 * panel and overview have something to summarize. It used to ship with the
 * application as demo content; now it is what the specs build on.
 */
export function seedOverviews(): SpatialUnitHierarchyOverviewType[] {
  return SEED.map(([name, mandant, levels]) => hierarchyOverview(name, mandant, levels));
}

/** The same seed, already built into the page's model. */
export function seedHierarchies(): SpatialUnitHierarchy[] {
  return SEED.map(([name, mandant, levels]) => hierarchyFixture(name, mandant, levels));
}

/**
 * The spatial unit levels behind that seed, plus five that sit in no chain —
 * four in Essen and one in Bochum, so the unassigned section has something to
 * show and switching to Krefeld shows the empty case.
 */
export function seedLevels(): RegisteredLevel[] {
  const inChains = seedHierarchies().flatMap((hierarchy) =>
    hierarchy.chain().map((entry) => levelFixture(entry.name, hierarchy.mandant()))
  );
  const unassigned = [
    levelFixture('Schulregionen Essen', 'Stadt Essen'),
    levelFixture('Grundschulbezirke Essen', 'Stadt Essen'),
    levelFixture('Wahlbezirke Essen', 'Stadt Essen'),
    levelFixture('Postleitzahlgebiete Essen', 'Stadt Essen'),
    levelFixture('Wahlbezirke Bochum', 'Stadt Bochum'),
  ];
  const byId = new Map(inChains.map((level) => [level.id, level]));
  for (const level of unassigned) {
    byId.set(level.id, level);
  }
  return [...byId.values()];
}
