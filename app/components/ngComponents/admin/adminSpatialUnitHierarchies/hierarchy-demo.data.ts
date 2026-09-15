import { computed, signal } from '@angular/core';

import uuidv4 from '../../../../../customizedExternalLibs/uuidv4.js';
import { TreeGap } from '../../common/tree-view/tree-view.model';
import { DemoChainEntry, DemoHierarchy, DemoLevel, nest } from './hierarchy-demo.model';

/**
 * Static stand-in for the Data Management API. Everything in this file is
 * example content from the design draft and goes away once the page talks to
 * the backend — the page and the picker panel hold no data of their own.
 */

/** The plain description a hierarchy is built from — the seed data and a new one alike. */
export interface HierarchySource {
  readonly id: string;
  readonly name: string;
  /** Optional — a hierarchy without one simply shows no description. */
  readonly description?: string;
  /** Optional — without Keycloak the demo knows no tenants. */
  readonly mandant?: string;
  readonly levels: readonly string[];
  readonly open: boolean;
}

/**
 * Hierarchies of the draft, each a chain of level names from coarse to fine.
 * They belong to four tenants, so the tenant panel above the list has something
 * to switch between — in a real instance every tenant brings its own.
 */
export const DEMO_HIERARCHIES: readonly HierarchySource[] = [
  {
    id: 'a1f5c803-72d9-4b6e-8f14-3ce90ab27d56',
    name: 'Verwaltungsgliederung',
    description:
      'Amtliche Gliederung der Stadt Essen von der Gesamtstadt bis hinunter zum Baublock.',
    mandant: 'Stadt Essen',
    levels: [
      'Stadt Essen',
      'Stadtbezirke Essen',
      'Stadtteile Essen',
      'Stadtviertel Essen',
      'Baublöcke Essen',
    ],
    open: true,
  },
  {
    id: '6b2d4e17-0c98-4a53-9f2a-7d1b5c8e4032',
    name: 'Sozialraum-Gliederung',
    description: 'Gliederung der Sozialberichterstattung, unterhalb der Stadtbezirke.',
    mandant: 'Stadt Essen',
    levels: ['Stadt Essen', 'Stadtbezirke Essen', 'Sozialräume Essen', 'Quartiere Essen'],
    open: false,
  },
  {
    id: 'd93a7f60-5b21-4c8d-8e77-2af6109b3c45',
    name: 'Verwaltungsgliederung Bochum',
    description: 'Amtliche Gliederung der Stadt Bochum.',
    mandant: 'Stadt Bochum',
    levels: ['Stadt Bochum', 'Stadtbezirke Bochum', 'Stadtteile Bochum'],
    open: false,
  },
  {
    id: '2c58e1b4-9d07-4f36-b1a9-83e0d7c46f21',
    name: 'Kreisgliederung Recklinghausen',
    description: 'Der Kreis mit seinen kreisangehörigen Städten und deren Stadtteilen.',
    mandant: 'Kreis Recklinghausen',
    levels: [
      'Kreis Recklinghausen',
      'Städte im Kreis Recklinghausen',
      'Stadtteile im Kreis Recklinghausen',
    ],
    open: false,
  },
  {
    id: '7e41c9d2-3a86-4b05-9c1f-6d208fa5b7e3',
    name: 'Rastergliederung Recklinghausen',
    description: 'Verwaltungsunabhängige Rasterebenen für kleinräumige Auswertungen.',
    mandant: 'Kreis Recklinghausen',
    levels: ['Kreis Recklinghausen', 'Raster 1 km', 'Raster 500 m', 'Raster 100 m'],
    open: false,
  },
  {
    id: 'b0f6a35c-8e14-42d7-95b3-1c7e9d04a862',
    name: 'Verwaltungsgliederung Krefeld',
    description: 'Amtliche Gliederung der Stadt Krefeld.',
    mandant: 'Stadt Krefeld',
    levels: ['Stadt Krefeld', 'Stadtbezirke Krefeld', 'Stadtteile Krefeld'],
    open: false,
  },
];

/**
 * Further levels of the draft, offered in the picker. A real implementation
 * would list the spatial units registered in the backend here — and only those
 * of the hierarchy's own tenant, which this pool does not distinguish.
 */
export const AVAILABLE_LEVELS: readonly string[] = [
  'Sozialräume Essen',
  'Quartiere Essen',
  'Raster 500 m',
  'Raster 100 m',
  'Schulregionen Essen',
  'Grundschulbezirke Essen',
  'Wahlbezirke Essen',
  'Postleitzahlgebiete Essen',
];

/**
 * Every spatial unit level the demo knows: the ones the seeded hierarchies use
 * plus the pool. This is the registry the create dialog picks from — a level may
 * well sit in several hierarchies, the dialog only says so.
 */
export const REGISTERED_LEVELS: readonly string[] = [
  ...new Set([...DEMO_HIERARCHIES.flatMap((source) => source.levels), ...AVAILABLE_LEVELS]),
];

/** The pool entries not yet used in this chain. */
export function unusedLevels(chain: readonly DemoChainEntry[]): string[] {
  const used = new Set(chain.map((entry) => entry.name));
  return AVAILABLE_LEVELS.filter((name) => !used.has(name));
}

/**
 * Id for a hierarchy the user creates. A uuid like the seeded one, so the id
 * chip shows what the backend would hand out rather than a counter.
 */
export function newHierarchyId(): string {
  return uuidv4();
}

/** Builds one signal-backed hierarchy the page and the tree work on. */
export function createHierarchy(source: HierarchySource): DemoHierarchy {
  // Ids are assigned once and stay with the level, so reordering the chain
  // keeps the expanded state and the tree's `track` identities intact.
  const chain = signal<readonly DemoChainEntry[]>(
    source.levels.map((name, index) => ({ id: `${source.id}-${index}`, name }))
  );
  const levels = computed(() => nest(chain()));

  return {
    id: source.id,
    name: signal(source.name),
    description: signal(source.description ?? ''),
    mandant: signal(source.mandant ?? ''),
    chain,
    levels,
    levelCount: computed(() => chain().length),
    json: computed(() => JSON.stringify(levels(), null, 2)),
    open: signal(source.open),
    // Start fully expanded so the whole chain is visible.
    expandedIds: signal<ReadonlySet<string>>(new Set(chain().map((entry) => entry.id))),
    openGap: signal<TreeGap<DemoLevel> | null>(null),
  };
}

/** Builds the hierarchies the page starts with. */
export function createDemoHierarchies(): readonly DemoHierarchy[] {
  return DEMO_HIERARCHIES.map(createHierarchy);
}
