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

/** Hierarchies of the draft, each a chain of level names from coarse to fine. */
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
];

/**
 * Further levels of the draft, offered in the picker. A real implementation
 * would list the spatial units registered in the backend here.
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
