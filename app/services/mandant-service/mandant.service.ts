import { Injectable, inject } from '@angular/core';
import { AccessControlService } from 'services/access-control-service/access-control.service';

/** A tenant with both of its identities, for APIs that want the id. */
export interface MandantRef {
  readonly id: string;
  readonly name: string;
}

/**
 * Who the tenants of this instance are, and which of them the user belongs to.
 *
 * Keycloak is the authority: an organizational unit flagged as `mandant` is a
 * tenant. Without Keycloak an instance knows none at all, which is a supported
 * state — the pages then fall back to what their own data names.
 *
 * **Names and ids.** The pages work with tenant *names*, because that is what
 * they show. The Data Management API works with `mandantId`. The two are joined
 * here and nowhere else — `mandantRefs`, `mandantIdOf` and `mandantNameOf` are
 * the translation, `mandantIdOfOwner` the one for the owning organizational
 * unit of a dataset, which need not be the tenant itself.
 *
 * Reads through to `AccessControlService` on every call rather than snapshotting
 * at construction: the access control metadata arrives during startup, and a
 * page built before it would otherwise hold an empty list for good.
 */
@Injectable({
  providedIn: 'root',
})
export class MandantService {
  private readonly accessControlService = inject(AccessControlService);

  /** The organizational units Keycloak flags as tenants; empty without it. */
  get keycloakMandants(): readonly string[] {
    return this.mandantRefs.map((mandant) => mandant.name);
  }

  /** The same tenants with their ids, for the API payloads that need them. */
  get mandantRefs(): readonly MandantRef[] {
    return this.accessControlService.accessControl
      .filter((unit) => unit.mandant)
      .map((unit) => ({ id: unit.organizationalUnitId, name: unit.name }));
  }

  /** The id of the tenant with that name; empty where none carries it. */
  mandantIdOf(mandantName: string): string {
    if (!mandantName) {
      return '';
    }
    return this.mandantRefs.find((mandant) => mandant.name === mandantName)?.id ?? '';
  }

  /** The name of the tenant with that id; empty where none carries it. */
  mandantNameOf(mandantId: string): string {
    if (!mandantId) {
      return '';
    }
    return this.mandantRefs.find((mandant) => mandant.id === mandantId)?.name ?? '';
  }

  /**
   * The tenant a dataset belongs to, given the organizational unit that owns
   * it. The owner is often the tenant itself, but it may be a unit below it —
   * the tenant is then the first ancestor flagged as one. Returns the empty
   * string where the chain names none, or where the unit is unknown.
   *
   * Walks `parentId` with a guard: the metadata comes from the backend, and a
   * cycle in it would otherwise hang the caller.
   */
  mandantIdOfOwner(ownerId: string | null | undefined): string {
    const seen = new Set<string>();
    let current = ownerId || '';

    while (current && !seen.has(current)) {
      seen.add(current);
      const unit = this.accessControlService.getAccessControlById(current);
      if (!unit) {
        return '';
      }
      if (unit.mandant) {
        return unit.organizationalUnitId;
      }
      current = unit.parentId || '';
    }

    return '';
  }

  /** The tenant the user belongs to, with its id; null where they belong to none. */
  get ownMandantRef(): MandantRef | null {
    const own = this.accessControlService.currentKomMonitorLoginOrganizationalUnits.find(
      (unit) => unit.mandant
    );
    return own ? { id: own.organizationalUnitId, name: own.name } : null;
  }

  /**
   * Whether the user may look across tenants — a platform administrator's view.
   * Nobody holds that role without Keycloak.
   */
  get isRealmAdmin(): boolean {
    return this.accessControlService.isRealmAdmin;
  }

  /** The tenant the user belongs to; the empty string where they belong to none. */
  get ownMandant(): string {
    return this.ownMandantRef?.name ?? '';
  }

  /**
   * The tenants to offer where one has to be chosen. Keycloak names them; where
   * it names none, the ones a page found in its own data keep the choice usable,
   * so what is created there still ends up with an owner. Empty only where
   * nothing knows a tenant — then there is nothing to choose.
   */
  mandantsToOffer(knownMandants: readonly string[]): readonly string[] {
    const fromKeycloak = this.keycloakMandants;
    return fromKeycloak.length > 0 ? fromKeycloak : knownMandants;
  }
}
