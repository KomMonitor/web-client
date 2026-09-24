import { TestBed } from '@angular/core/testing';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';

import { MandantService } from './mandant.service';

/** An organizational unit as the access control metadata carries it. */
function unit(name: string, mandant: boolean, parentId?: string): AccessControlMetadata {
  return { organizationalUnitId: `id-${name}`, name, permissions: [], mandant, parentId };
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
            getAccessControlById: (id: string) =>
              accessControl.find((entry) => entry.organizationalUnitId === id) ?? null,
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

  describe('names and ids', () => {
    it('carries both identities of every tenant', () => {
      const service = setup([unit('Stadt Essen', true), unit('Fachbereich Schule', false)]);

      expect(service.mandantRefs).toEqual([{ id: 'id-Stadt Essen', name: 'Stadt Essen' }]);
    });

    it('translates a tenant name into the id the API wants', () => {
      const service = setup([unit('Stadt Essen', true)]);

      expect(service.mandantIdOf('Stadt Essen')).toBe('id-Stadt Essen');
    });

    it('translates an id back into the name the pages show', () => {
      const service = setup([unit('Stadt Essen', true)]);

      expect(service.mandantNameOf('id-Stadt Essen')).toBe('Stadt Essen');
    });

    it('answers empty for an unknown name, an unknown id and for nothing', () => {
      const service = setup([unit('Stadt Essen', true)]);

      expect(service.mandantIdOf('Stadt Krefeld')).toBe('');
      expect(service.mandantNameOf('id-Stadt Krefeld')).toBe('');
      expect(service.mandantIdOf('')).toBe('');
      expect(service.mandantNameOf('')).toBe('');
    });

    it('names the own tenant with its id', () => {
      const service = setup([unit('Stadt Essen', true)], [unit('Stadt Essen', true)]);

      expect(service.ownMandantRef).toEqual({ id: 'id-Stadt Essen', name: 'Stadt Essen' });
    });

    it('has no own tenant reference where the user belongs to none', () => {
      expect(setup([unit('Stadt Essen', true)], []).ownMandantRef).toBeNull();
    });
  });

  describe('mandantIdOfOwner', () => {
    it('answers the owner itself when it is the tenant', () => {
      const service = setup([unit('Stadt Essen', true)]);

      expect(service.mandantIdOfOwner('id-Stadt Essen')).toBe('id-Stadt Essen');
    });

    it('climbs to the first ancestor flagged as a tenant', () => {
      // Schule sits under Bildung, which sits under the tenant Stadt Essen.
      const service = setup([
        unit('Stadt Essen', true),
        unit('Bildung', false, 'id-Stadt Essen'),
        unit('Schule', false, 'id-Bildung'),
      ]);

      expect(service.mandantIdOfOwner('id-Schule')).toBe('id-Stadt Essen');
    });

    it('answers empty where no ancestor is a tenant', () => {
      const service = setup([unit('Bildung', false), unit('Schule', false, 'id-Bildung')]);

      expect(service.mandantIdOfOwner('id-Schule')).toBe('');
    });

    it('answers empty for an unknown owner and for none', () => {
      const service = setup([unit('Stadt Essen', true)]);

      expect(service.mandantIdOfOwner('id-Fremd')).toBe('');
      expect(service.mandantIdOfOwner('')).toBe('');
      expect(service.mandantIdOfOwner(null)).toBe('');
      expect(service.mandantIdOfOwner(undefined)).toBe('');
    });

    it('gives up instead of looping on a cyclic parent chain', () => {
      const service = setup([unit('A', false, 'id-B'), unit('B', false, 'id-A')]);

      expect(service.mandantIdOfOwner('id-A')).toBe('');
    });
  });

  it('reads through, so metadata arriving after startup still counts', () => {
    const accessControl: AccessControlMetadata[] = [];
    const service = setup(accessControl);

    expect(service.keycloakMandants).toEqual([]);

    accessControl.push(unit('Stadt Essen', true));

    expect(service.keycloakMandants).toEqual(['Stadt Essen']);
  });
});
