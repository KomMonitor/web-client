import { TestBed } from '@angular/core/testing';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';

import { MandantService } from './mandant.service';

/** An organizational unit as the access control metadata carries it. */
function unit(name: string, mandant: boolean): AccessControlMetadata {
  return { organizationalUnitId: `id-${name}`, name, permissions: [], mandant };
}

describe('MandantService', () => {
  /** The stub stands in for what Keycloak filled in during startup. */
  function setup(accessControl: AccessControlMetadata[], ownUnits: AccessControlMetadata[] = []) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AccessControlService,
          useValue: {
            accessControl,
            currentKomMonitorLoginOrganizationalUnits: ownUnits,
            isRealmAdmin: false,
          },
        },
      ],
    });
    return TestBed.inject(MandantService);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('lists only the units Keycloak flags as tenants', () => {
    const service = setup([unit('Stadt Essen', true), unit('Fachbereich Schule', false)]);

    expect(service.keycloakMandants).toEqual(['Stadt Essen']);
  });

  it('knows no tenants without Keycloak', () => {
    expect(setup([]).keycloakMandants).toEqual([]);
  });

  it('names the tenant the user belongs to', () => {
    const service = setup(
      [unit('Stadt Essen', true)],
      [unit('Fachbereich Schule', false), unit('Stadt Essen', true)]
    );

    expect(service.ownMandant).toBe('Stadt Essen');
  });

  it('names no tenant where the user belongs to none', () => {
    expect(setup([unit('Stadt Essen', true)], [unit('Fachbereich Schule', false)]).ownMandant).toBe(
      ''
    );
  });

  it('offers the Keycloak tenants where it names any', () => {
    const service = setup([unit('Stadt Essen', true)]);

    expect(service.mandantsToOffer(['Aus den Daten'])).toEqual(['Stadt Essen']);
  });

  it('falls back to what the page found in its data', () => {
    const service = setup([unit('Fachbereich Schule', false)]);

    expect(service.mandantsToOffer(['Stadt Krefeld'])).toEqual(['Stadt Krefeld']);
  });

  it('offers nothing where nothing knows a tenant', () => {
    expect(setup([]).mandantsToOffer([])).toEqual([]);
  });

  it('reads through, so metadata arriving after startup still counts', () => {
    const accessControl: AccessControlMetadata[] = [];
    const service = setup(accessControl);

    expect(service.keycloakMandants).toEqual([]);

    accessControl.push(unit('Stadt Essen', true));

    expect(service.keycloakMandants).toEqual(['Stadt Essen']);
  });
});
