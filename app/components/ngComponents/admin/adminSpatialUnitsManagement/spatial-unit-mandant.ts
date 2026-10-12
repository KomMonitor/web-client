import { SpatialUnitOverviewType } from 'models/data-management-api';

import { MandantOption } from '../adminShared/mandantPanel/mandant-panel.component';

/**
 * What the tenant switcher on the spatial units page reads off the metadata:
 * the tenants to offer, and the spatial units of the one on screen.
 *
 * Plain functions over the list, like the hierarchy page's selectors, so the
 * rules can be checked without a component. Tenants are compared by *name*,
 * because that is what the switcher works with; `nameOf` is
 * `MandantService.mandantNameOf`, the one place names and ids are joined.
 */

/** The only field these functions read, so the specs can do with less. */
type WithMandant = Pick<SpatialUnitOverviewType, 'mandantId'>;

/** Resolves a `mandantId` to a tenant name; empty where none carries it. */
export type MandantNameOf = (mandantId: string) => string;

/**
 * The tenant a spatial unit belongs to, by name. An id Keycloak does not know
 * stands in for the name, so the unit still lands in a group of its own; the
 * empty string means the unit names no tenant at all.
 */
export function mandantOfSpatialUnit(unit: WithMandant, nameOf: MandantNameOf): string {
  const mandantId = unit.mandantId ?? '';
  return nameOf(mandantId) || mandantId;
}

/**
 * The tenants the switcher lists, each with its number of spatial units. The
 * tenants Keycloak names come first and in its order, those without spatial
 * units included. A tenant that only appears in the data is appended, so the
 * page shows whom its data belongs to even without Keycloak.
 *
 * Spatial units without a tenant count towards none — they appear only in the
 * overview across all tenants.
 */
export function spatialUnitMandantOptions(
  units: readonly WithMandant[],
  keycloakMandants: readonly string[],
  nameOf: MandantNameOf
): MandantOption[] {
  const counts = new Map<string, number>(keycloakMandants.map((name) => [name, 0]));
  for (const unit of units) {
    const mandant = mandantOfSpatialUnit(unit, nameOf);
    if (mandant) {
      counts.set(mandant, (counts.get(mandant) ?? 0) + 1);
    }
  }
  return [...counts].map(([name, count]) => ({ name, count }));
}

/**
 * The spatial units of one tenant; all of them for the empty string, which is
 * the overview. Strict on purpose: a unit without a tenant belongs to none of
 * them, unlike on the hierarchy page, where such a level is offered to every
 * tenant because it might still be filed into any chain.
 */
export function spatialUnitsOfMandant<T extends WithMandant>(
  units: readonly T[],
  mandant: string,
  nameOf: MandantNameOf
): T[] {
  return mandant
    ? units.filter((unit) => mandantOfSpatialUnit(unit, nameOf) === mandant)
    : [...units];
}
