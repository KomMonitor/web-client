import { RegisteredLevel, SpatialUnitHierarchy } from './hierarchy.model';
import { MandantOverviewRow } from './mandantOverviewTable/mandant-overview-table.component';

/**
 * What the page reads off its hierarchies and its level registry: the tenant
 * overview, the levels on offer, the ones nobody uses, the usage counts.
 *
 * Plain functions over the collections, so every rule the page shows can be
 * checked without a component and without a TestBed. `HierarchyStoreService`
 * hangs the signals over them.
 */

/**
 * How often each spatial unit level appears across these chains, by
 * `spatialUnitId`. The one place that counts: the tenant overview counts per
 * tenant, the create dialog across the whole instance — the same question asked
 * of a different set of hierarchies.
 *
 * Counted by id, not by name: the id is the level's identity, and two tenants
 * may well name a level the same.
 */
export function countLevelUsage(hierarchies: readonly SpatialUnitHierarchy[]): Map<string, number> {
  const usage = new Map<string, number>();
  for (const hierarchy of hierarchies) {
    for (const entry of hierarchy.chain()) {
      usage.set(entry.id, (usage.get(entry.id) ?? 0) + 1);
    }
  }
  return usage;
}

/**
 * The same counts as the record the create dialog reads, keyed by
 * `spatialUnitId`. The dialog marks the levels already in use with it — sharing
 * one is allowed, it just should not happen unnoticed.
 */
export function levelUsage(hierarchies: readonly SpatialUnitHierarchy[]): Record<string, number> {
  return Object.fromEntries(countLevelUsage(hierarchies));
}

/** The hierarchy names, for the dialog to check a new one against. */
export function hierarchyNames(hierarchies: readonly SpatialUnitHierarchy[]): string[] {
  return hierarchies.map((hierarchy) => hierarchy.name());
}

/**
 * The hierarchies of one tenant. The empty string is the overview across all of
 * them, and so is an instance whose data knows no tenant at all — there is
 * nothing to narrow down to then.
 */
export function hierarchiesOfMandant(
  hierarchies: readonly SpatialUnitHierarchy[],
  mandant: string
): readonly SpatialUnitHierarchy[] {
  return mandant ? hierarchies.filter((hierarchy) => hierarchy.mandant() === mandant) : hierarchies;
}

/** The registered levels of one tenant; the whole registry without one. */
export function levelsOfMandant(
  registry: readonly RegisteredLevel[],
  mandant: string
): readonly RegisteredLevel[] {
  return mandant ? registry.filter((level) => level.mandant === mandant) : registry;
}

/**
 * The tenant's spatial unit levels that no hierarchy uses — they exist, but are
 * nowhere to be chosen in the map interface, because only a hierarchy puts a
 * level there.
 *
 * Asked of *all* hierarchies, not just the tenant's, and by id. Derived from
 * the chains rather than from the `hierarchies` field of the spatial unit on
 * purpose: the chains are what the page edits, so a level moved in or out shows
 * up here at once instead of after a reload.
 */
export function unassignedLevels(
  registry: readonly RegisteredLevel[],
  hierarchies: readonly SpatialUnitHierarchy[],
  mandant: string
): readonly RegisteredLevel[] {
  const used = countLevelUsage(hierarchies);
  return levelsOfMandant(registry, mandant).filter((level) => !used.has(level.id));
}

/**
 * The hierarchies grouped by the tenant they belong to. The tenants Keycloak
 * names come first and in its order, empty groups included — a tenant without
 * hierarchies is still one. A tenant that only appears in the data is appended,
 * so the page shows whom its data belongs to even without Keycloak.
 *
 * Hierarchies without a tenant belong to no group; where nothing knows a tenant
 * the result is empty and the page falls back to listing the hierarchies.
 */
function groupByMandant(
  hierarchies: readonly SpatialUnitHierarchy[],
  keycloakMandants: readonly string[]
): Map<string, SpatialUnitHierarchy[]> {
  const groups = new Map<string, SpatialUnitHierarchy[]>(
    keycloakMandants.map((name) => [name, []])
  );

  for (const hierarchy of hierarchies) {
    const mandant = hierarchy.mandant();
    if (!mandant) {
      continue;
    }
    const group = groups.get(mandant);
    if (group) {
      group.push(hierarchy);
    } else {
      groups.set(mandant, [hierarchy]);
    }
  }

  return groups;
}

/**
 * The tenants of this instance with what each of them holds — the rows of the
 * overview table, and at the same time the entries the switcher lists, which
 * only reads the name and the hierarchy count off them.
 */
export function mandantOverviewRows(
  hierarchies: readonly SpatialUnitHierarchy[],
  keycloakMandants: readonly string[]
): readonly MandantOverviewRow[] {
  return [...groupByMandant(hierarchies, keycloakMandants)].map(([name, group]) => {
    const usage = countLevelUsage(group);
    return {
      name,
      hierarchyCount: group.length,
      levelCount: usage.size,
      // A level in more than one of the tenant's chains is shared between them.
      sharedLevelCount: [...usage.values()].filter((count) => count > 1).length,
    };
  });
}
