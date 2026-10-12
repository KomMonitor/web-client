import { SpatialUnitOverviewType } from 'models/data-management-api';
import { MandantService } from 'services/mandant-service/mandant.service';

import { MandantOption } from '../adminShared/mandantPanel/mandant-panel.component';

/**
 * What the tenant switcher on the spatial units page reads off the metadata:
 * the tenants to offer, and the spatial units of the one on screen.
 *
 * Plain functions over the list, like the hierarchy page's selectors, so the
 * rules can be checked without a component. Tenants are compared by *name*,
 * because that is what the switcher works with.
 *
 * A spatial unit's tenant is derived from its *owner* here, not from its
 * `mandantId` — the owning organizational unit, or the first tenant above it.
 * The hierarchy page still goes by `mandantId`. Resolving the owner needs the
 * organizational units, which `/organizationalUnits` only hands out with a
 * token: without a login no spatial unit has a tenant.
 */

/** The only field these functions read, so the specs can do with less. */
type WithOwner = Pick<SpatialUnitOverviewType, 'ownerId'>;

/** The part of `MandantService` these functions need; the service itself fits. */
export type MandantLookup = Pick<MandantService, 'mandantIdOfOwner' | 'mandantNameOf'>;

/**
 * The tenant a spatial unit belongs to, by name, derived from its owner. The
 * empty string where the unit has no owner, or where the owner is unknown or
 * sits below no tenant.
 */
export function mandantOfSpatialUnit(unit: WithOwner, mandants: MandantLookup): string {
  return mandants.mandantNameOf(mandants.mandantIdOfOwner(unit.ownerId));
}

/**
 * The tenants the switcher lists, each with its number of spatial units. The
 * tenants Keycloak names come first and in its order, those without spatial
 * units included. A tenant only the data names is appended — with the owner as
 * the source that cannot happen, since an owner resolves only to a tenant
 * Keycloak knows, but the switcher should not depend on it.
 *
 * Spatial units without a tenant count towards none — they appear only in the
 * overview across all tenants.
 */
export function spatialUnitMandantOptions(
  units: readonly WithOwner[],
  keycloakMandants: readonly string[],
  mandants: MandantLookup
): MandantOption[] {
  const counts = new Map<string, number>(keycloakMandants.map((name) => [name, 0]));
  for (const unit of units) {
    const mandant = mandantOfSpatialUnit(unit, mandants);
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
export function spatialUnitsOfMandant<T extends WithOwner>(
  units: readonly T[],
  mandant: string,
  mandants: MandantLookup
): T[] {
  return mandant
    ? units.filter((unit) => mandantOfSpatialUnit(unit, mandants) === mandant)
    : [...units];
}
