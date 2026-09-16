import { computed, signal } from '@angular/core';

import uuidv4 from '../../../../../customizedExternalLibs/uuidv4.js';
import { TreeGap } from '../../common/tree-view/tree-view.model';
import {
  HierarchyChainEntry,
  HierarchyLevel,
  RegisteredLevel,
  SpatialUnitHierarchy,
  canInsertAtGap,
  nest,
} from './hierarchy.model';

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

// The offices the demo levels come from. Spelled once so a tenant's levels
// cannot drift apart by a typo.
const ESSEN_KATASTER = 'Amt für Geoinformation, Vermessung und Kataster';
const ESSEN_STATISTIK = 'Amt für Statistik, Stadtforschung und Wahlen';
const BOCHUM_KATASTER = 'Amt für Geoinformation, Liegenschaften und Kataster';
const KREIS_RE_KATASTER = 'Kataster- und Vermessungsamt Kreis Recklinghausen';
const KREFELD_KATASTER = 'Fachbereich Vermessungs- und Katasterwesen';
const ZENSUS = 'Statistische Ämter des Bundes und der Länder';

/** A registry entry before it is given an id. */
type LevelSource = Omit<RegisteredLevel, 'id'>;

/**
 * The spatial unit levels this instance has registered — what the real page
 * would read from the Data Management API. Every level belongs to exactly one
 * tenant and names where its data comes from; whether it sits in a hierarchy is
 * not stored here but derived from the chains.
 *
 * Most of them are in use by a hierarchy below. The ones that are not are what
 * the "unassigned" section lists: four in Essen, one in Bochum — and nothing in
 * Krefeld and Recklinghausen, so the empty case can be seen by switching tenant.
 */
const DEMO_LEVELS: readonly LevelSource[] = [
  // Stadt Essen
  { name: 'Stadt Essen', mandant: 'Stadt Essen', datasource: ESSEN_KATASTER },
  { name: 'Stadtbezirke Essen', mandant: 'Stadt Essen', datasource: ESSEN_KATASTER },
  { name: 'Stadtteile Essen', mandant: 'Stadt Essen', datasource: ESSEN_KATASTER },
  { name: 'Stadtviertel Essen', mandant: 'Stadt Essen', datasource: ESSEN_KATASTER },
  { name: 'Baublöcke Essen', mandant: 'Stadt Essen', datasource: ESSEN_KATASTER },
  { name: 'Sozialräume Essen', mandant: 'Stadt Essen', datasource: ESSEN_STATISTIK },
  { name: 'Quartiere Essen', mandant: 'Stadt Essen', datasource: ESSEN_STATISTIK },
  { name: 'Schulregionen Essen', mandant: 'Stadt Essen', datasource: 'Fachbereich Schule' },
  { name: 'Grundschulbezirke Essen', mandant: 'Stadt Essen', datasource: 'Fachbereich Schule' },
  { name: 'Wahlbezirke Essen', mandant: 'Stadt Essen', datasource: ESSEN_STATISTIK },
  {
    name: 'Postleitzahlgebiete Essen',
    mandant: 'Stadt Essen',
    datasource: 'OpenStreetMap / Deutsche Post',
  },

  // Stadt Bochum
  { name: 'Stadt Bochum', mandant: 'Stadt Bochum', datasource: BOCHUM_KATASTER },
  { name: 'Stadtbezirke Bochum', mandant: 'Stadt Bochum', datasource: BOCHUM_KATASTER },
  { name: 'Stadtteile Bochum', mandant: 'Stadt Bochum', datasource: BOCHUM_KATASTER },
  {
    name: 'Wahlbezirke Bochum',
    mandant: 'Stadt Bochum',
    datasource: 'Amt für Wahlen und Statistik',
  },

  // Kreis Recklinghausen
  { name: 'Kreis Recklinghausen', mandant: 'Kreis Recklinghausen', datasource: KREIS_RE_KATASTER },
  {
    name: 'Städte im Kreis Recklinghausen',
    mandant: 'Kreis Recklinghausen',
    datasource: KREIS_RE_KATASTER,
  },
  {
    name: 'Stadtteile im Kreis Recklinghausen',
    mandant: 'Kreis Recklinghausen',
    datasource: KREIS_RE_KATASTER,
  },
  { name: 'Raster 1 km', mandant: 'Kreis Recklinghausen', datasource: ZENSUS },
  { name: 'Raster 500 m', mandant: 'Kreis Recklinghausen', datasource: ZENSUS },
  { name: 'Raster 100 m', mandant: 'Kreis Recklinghausen', datasource: ZENSUS },

  // Stadt Krefeld
  { name: 'Stadt Krefeld', mandant: 'Stadt Krefeld', datasource: KREFELD_KATASTER },
  { name: 'Stadtbezirke Krefeld', mandant: 'Stadt Krefeld', datasource: KREFELD_KATASTER },
  { name: 'Stadtteile Krefeld', mandant: 'Stadt Krefeld', datasource: KREFELD_KATASTER },
];

/** Builds the level registry the page starts with; ids like the backend hands out. */
export function createLevelRegistry(): readonly RegisteredLevel[] {
  return DEMO_LEVELS.map((level) => ({ id: newLevelId(), ...level }));
}

/** Id for a level the user registers — a uuid, like `newHierarchyId`. */
export function newLevelId(): string {
  return uuidv4();
}

/**
 * Id for a hierarchy the user creates. A uuid like the seeded one, so the id
 * chip shows what the backend would hand out rather than a counter.
 */
export function newHierarchyId(): string {
  return uuidv4();
}

/** Builds one signal-backed hierarchy the page and the tree work on. */
export function createHierarchy(source: HierarchySource): SpatialUnitHierarchy {
  // Ids are assigned once and stay with the level, so reordering the chain
  // keeps the expanded state and the tree's `track` identities intact.
  const chain = signal<readonly HierarchyChainEntry[]>(
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
    open: signal(source.open),
    // Start fully expanded so the whole chain is visible.
    expandedIds: signal<ReadonlySet<string>>(new Set(chain().map((entry) => entry.id))),
    openGap: signal<TreeGap<HierarchyLevel> | null>(null),
    canInsertAt: (gap) => canInsertAtGap(levels(), gap),
  };
}

/** Builds the hierarchies the page starts with. */
export function createDemoHierarchies(): readonly SpatialUnitHierarchy[] {
  return DEMO_HIERARCHIES.map(createHierarchy);
}
