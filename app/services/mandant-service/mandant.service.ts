import { Injectable, inject } from '@angular/core';
import { AccessControlService } from 'services/access-control-service/access-control.service';

/**
 * Who the tenants of this instance are, and which of them the user belongs to.
 *
 * Keycloak is the authority: an organizational unit flagged as `mandant` is a
 * tenant. Without Keycloak an instance knows none at all, which is a supported
 * state — the pages then fall back to what their own data names.
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
    return this.accessControlService.accessControl
      .filter((unit) => unit.mandant)
      .map((unit) => unit.name);
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
    const own = this.accessControlService.currentKomMonitorLoginOrganizationalUnits.find(
      (unit) => unit.mandant
    );
    return own?.name ?? '';
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
