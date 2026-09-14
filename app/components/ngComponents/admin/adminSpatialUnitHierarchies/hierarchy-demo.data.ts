import { computed, signal } from '@angular/core';

import { TreeGap } from '../../common/tree-view/tree-view.model';
import { DemoChainEntry, DemoHierarchy, DemoLevel, nest } from './hierarchy-demo.model';

/**
 * Static stand-in for the Data Management API. Everything in this file is
 * example content from the design draft and goes away once the page talks to
 * the backend — the page and the picker panel hold no data of their own.
 */

/** Hierarchies of the draft, each a chain of level names from coarse to fine. */
export const DEMO_HIERARCHIES: readonly {
  id: string;
  name: string;
  levels: readonly string[];
  open: boolean;
}[] = [
  {
    id: 'a1f5c803-72d9-4b6e-8f14-3ce90ab27d56',
    name: 'Verwaltungsgliederung',
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

/** The pool entries not yet used in this chain. */
export function unusedLevels(chain: readonly DemoChainEntry[]): string[] {
  const used = new Set(chain.map((entry) => entry.name));
  return AVAILABLE_LEVELS.filter((name) => !used.has(name));
}

/** Builds the signal-backed hierarchies the page and the tree work on. */
export function createDemoHierarchies(): readonly DemoHierarchy[] {
  return DEMO_HIERARCHIES.map((source) => {
    // Ids are assigned once and stay with the level, so reordering the chain
    // keeps the expanded state and the tree's `track` identities intact.
    const chain = signal<readonly DemoChainEntry[]>(
      source.levels.map((name, index) => ({ id: `${source.id}-${index}`, name }))
    );
    const levels = computed(() => nest(chain()));

    return {
      id: source.id,
      name: source.name,
      chain,
      levels,
      levelCount: computed(() => chain().length),
      json: computed(() => JSON.stringify(levels(), null, 2)),
      open: signal(source.open),
      // Start fully expanded so the whole chain is visible.
      expandedIds: signal<ReadonlySet<string>>(new Set(chain().map((entry) => entry.id))),
      openGap: signal<TreeGap<DemoLevel> | null>(null),
    };
  });
}
