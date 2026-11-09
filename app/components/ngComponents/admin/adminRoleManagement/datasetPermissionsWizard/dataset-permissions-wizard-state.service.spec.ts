import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { MandantService } from 'services/mandant-service/mandant.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

import { AdminRoleManagementService } from '../admin-role-management.service';
import { DatasetPermissionsWizardStateService } from './dataset-permissions-wizard-state.service';
import { OwnerDatasetSources } from './dataset-permissions.model';
import {
  georesourceSource,
  indicatorSource,
  orgUnit,
  spatialUnitSource,
} from './dataset-permissions.fixture';

/**
 * The wizard's state on its own: the rules underneath are tested in
 * `dataset-permissions.model.spec`, so these specs check the wiring — what is
 * selected, how decisions are stored, and what a save sends and reloads.
 */

const OWNER = 'owner';
const ROLES = ['kommonitor-creator'];

/** Tenant of each unit: `x` belongs to another tenant and is never offered. */
const TENANT_OF: Record<string, string> = { owner: 'm', a: 'm', b: 'm', x: 'n' };

let accessControl: WritableSignal<AccessControlMetadata[]>;
let indicators: WritableSignal<OwnerDatasetSources['indicators'][number][]>;
let georesources: WritableSignal<OwnerDatasetSources['georesources'][number][]>;
let spatialUnits: WritableSignal<OwnerDatasetSources['spatialUnits'][number][]>;

let adminRoleManagement: { patchDatasetPermissions: jest.Mock };
let bootstrap: {
  fetchIndicatorsMetadata: jest.Mock;
  fetchGeoresourcesMetadata: jest.Mock;
  fetchSpatialUnitsMetadata: jest.Mock;
};
let cacheHelper: {
  invalidateIndicatorsCache: jest.Mock;
  invalidateGeoresourcesCache: jest.Mock;
  invalidateSpatialUnitsCache: jest.Mock;
};

let state: DatasetPermissionsWizardStateService;

beforeEach(() => {
  accessControl = signal(['owner', 'a', 'b', 'x'].map((id) => orgUnit(id)));
  indicators = signal([indicatorSource('i', OWNER, [], { s1: [], s2: ['a-viewer'] })]);
  georesources = signal([
    georesourceSource('g1', OWNER, []),
    georesourceSource('g2', OWNER, ['a-viewer']),
    georesourceSource('foreign', 'x', []),
  ]);
  spatialUnits = signal([spatialUnitSource('s1', OWNER, [])]);

  adminRoleManagement = { patchDatasetPermissions: jest.fn(() => of(undefined)) };
  bootstrap = {
    fetchIndicatorsMetadata: jest.fn().mockResolvedValue(undefined),
    fetchGeoresourcesMetadata: jest.fn().mockResolvedValue(undefined),
    fetchSpatialUnitsMetadata: jest.fn().mockResolvedValue(undefined),
  };
  cacheHelper = {
    invalidateIndicatorsCache: jest.fn(),
    invalidateGeoresourcesCache: jest.fn(),
    invalidateSpatialUnitsCache: jest.fn(),
  };

  TestBed.configureTestingModule({
    providers: [
      DatasetPermissionsWizardStateService,
      {
        provide: AccessControlService,
        useValue: {
          get accessControl() {
            return accessControl();
          },
          currentKeycloakLoginRoles: ROLES,
        },
      },
      {
        provide: MandantService,
        useValue: { mandantIdOfOwner: (id: string) => TENANT_OF[id] ?? '' },
      },
      {
        provide: IndicatorMetadataStoreService,
        useValue: {
          get availableIndicators() {
            return indicators();
          },
        },
      },
      {
        provide: GeoresourceMetadataStoreService,
        useValue: {
          get availableGeoresources() {
            return georesources();
          },
        },
      },
      {
        provide: SpatialUnitMetadataStoreService,
        useValue: {
          get availableSpatialUnits() {
            return spatialUnits();
          },
        },
      },
      { provide: AdminRoleManagementService, useValue: adminRoleManagement },
      { provide: MetadataBootstrapService, useValue: bootstrap },
      { provide: CacheHelperServiceService, useValue: cacheHelper },
    ],
  });
  state = TestBed.inject(DatasetPermissionsWizardStateService);
  state.start(OWNER);
});

afterEach(() => jest.restoreAllMocks());

describe('DatasetPermissionsWizardStateService', () => {
  it('knows nothing before a run is started', () => {
    const fresh = TestBed.runInInjectionContext(() => new DatasetPermissionsWizardStateService());
    expect(fresh.groups()).toEqual([]);
    expect(fresh.datasets()).toEqual([]);
  });

  it("offers the groups of the owner's tenant, without the owner", () => {
    expect(state.groups().map((g) => g.organizationalUnitId)).toEqual(['a', 'b']);
  });

  describe('selection', () => {
    it("selects every dataset of the owner by default, and only the owner's", () => {
      expect(state.selectedDatasets().map((d) => `${d.kind}:${d.id}`)).toEqual([
        'indicator:i',
        'georesource:g1',
        'georesource:g2',
        'spatialUnit:s1',
      ]);
      expect(state.selectionCount()).toEqual({ selected: 4, total: 4 });
    });

    it('deselects single datasets and whole kinds', () => {
      state.setSelected('georesource:g1', false);
      expect(state.isSelected('georesource:g1')).toBe(false);
      expect(state.selectionState('georesource')).toBe('some');

      state.setKindSelected('georesource', false);
      expect(state.selectionState('georesource')).toBe('none');

      state.setKindSelected('georesource', true);
      expect(state.selectionState('georesource')).toBe('all');
      expect(state.selectionCount()).toEqual({ selected: 4, total: 4 });
    });

    it('selects a dataset that only arrives after the start', () => {
      georesources.update((list) => [...list, georesourceSource('late', OWNER, [])]);
      expect(state.isSelected('georesource:late')).toBe(true);
      expect(state.selectionCount()).toEqual({ selected: 5, total: 5 });
    });

    it('starts a new run with everything selected and nothing decided', () => {
      state.setKindSelected('indicator', false);
      state.setAction('a', 'viewer', 'grant');

      state.start(OWNER);

      expect(state.selectionCount()).toEqual({ selected: 4, total: 4 });
      expect(state.decisions()).toEqual({});
    });
  });

  describe('decisions', () => {
    it('couples the dropdowns: granting edit grants read', () => {
      state.setAction('a', 'editor', 'grant');
      expect(state.decisions()['a']).toEqual({ viewer: 'grant', editor: 'grant' });
    });

    it('reports coverage on the selected datasets', () => {
      // `a` reads g2 only; the indicator lacks it on s1, so it does not count.
      expect(state.coverageOf('a', 'viewer')).toEqual({
        before: 1,
        after: 1,
        total: 4,
        changed: false,
      });

      state.setSelected('georesource:g2', false);
      state.setAction('a', 'viewer', 'grant');
      expect(state.coverageOf('a', 'viewer')).toEqual({
        before: 0,
        after: 3,
        total: 3,
        changed: true,
      });
    });

    it('opens the per-dataset dialog with the current target rights', () => {
      state.setAction('b', 'viewer', 'grant');
      const draft = state.draftFor('b');
      expect(Object.keys(draft)).toHaveLength(5);
      expect(Object.values(draft).every((r) => r.viewer && !r.editor)).toBe(true);
    });

    it('turns a returned draft into dropdown values', () => {
      const draft = state.draftFor('b');
      state.applyDraft('b', { ...draft, 'georesources:g1': { viewer: true, editor: false } });
      expect(state.decisions()['b']).toMatchObject({ viewer: 'custom', editor: 'keep' });

      const all = Object.fromEntries(
        Object.keys(draft).map((key) => [key, { viewer: true, editor: true }])
      );
      state.applyDraft('b', all);
      expect(state.decisions()['b']).toEqual({ viewer: 'grant', editor: 'grant' });
    });

    it('ignores a draft for a group it does not offer', () => {
      state.applyDraft('x', {});
      expect(state.decisions()).toEqual({});
      expect(state.draftFor('x')).toEqual({});
    });

    it('summarizes and patches the selected datasets only', () => {
      state.setKindSelected('indicator', false);
      state.setKindSelected('spatialUnit', false);
      state.setSelected('georesource:g2', false);
      state.setAction('b', 'viewer', 'grant');

      expect(state.summary().map((l) => [l.groupName, l.change, l.count])).toEqual([
        ['b', 'add', 1],
      ]);
      expect(state.changedCount()).toBe(1);
      expect(state.patch()).toEqual([
        {
          organizationalUnitId: 'b',
          permissions: { georesources: [{ id: 'g1', permissions: ['b-viewer'] }] },
        },
      ]);
    });

    it('forgets the decisions but keeps the selection on reset', () => {
      state.setSelected('georesource:g1', false);
      state.setAction('a', 'viewer', 'grant');

      state.resetDecisions();

      expect(state.decisions()).toEqual({});
      expect(state.isSelected('georesource:g1')).toBe(false);
      expect(state.hasChanges()).toBe(false);
    });
  });

  describe('save', () => {
    it('sends nothing when nothing changes', async () => {
      state.setAction('a', 'viewer', 'keep');

      await expect(state.save()).resolves.toEqual({ status: 'nothing' });
      expect(adminRoleManagement.patchDatasetPermissions).not.toHaveBeenCalled();
    });

    it('sends the patch, then reloads the datasets past the cache', async () => {
      const response = new Subject<void>();
      adminRoleManagement.patchDatasetPermissions.mockReturnValue(response);
      bootstrap.fetchGeoresourcesMetadata.mockImplementation(async () =>
        georesources.update((list) =>
          list.map((g) => (g.georesourceId === 'g1' ? { ...g, permissions: ['b-viewer'] } : g))
        )
      );
      state.setAction('b', 'viewer', 'grant');
      const body = state.patch();

      const saving = state.save();
      expect(state.saving()).toBe(true);
      response.next();
      response.complete();

      await expect(saving).resolves.toEqual({ status: 'saved', datasetCount: 4, reloaded: true });
      expect(adminRoleManagement.patchDatasetPermissions).toHaveBeenCalledWith(body);
      expect(cacheHelper.invalidateIndicatorsCache).toHaveBeenCalled();
      expect(cacheHelper.invalidateGeoresourcesCache).toHaveBeenCalled();
      expect(cacheHelper.invalidateSpatialUnitsCache).toHaveBeenCalled();
      expect(bootstrap.fetchIndicatorsMetadata).toHaveBeenCalledWith(ROLES);
      expect(bootstrap.fetchGeoresourcesMetadata).toHaveBeenCalledWith(ROLES);
      expect(bootstrap.fetchSpatialUnitsMetadata).toHaveBeenCalledWith(ROLES);
      expect(state.saving()).toBe(false);
      expect(state.decisions()).toEqual({});
      // The reloaded rights are the new current state.
      expect(state.coverageOf('b', 'viewer')?.before).toBe(1);
    });

    it('invalidates the cache before it reloads', async () => {
      const order: string[] = [];
      cacheHelper.invalidateIndicatorsCache.mockImplementation(() => order.push('invalidate'));
      bootstrap.fetchIndicatorsMetadata.mockImplementation(async () => order.push('fetch'));
      state.setAction('a', 'viewer', 'grant');

      await state.save();

      expect(order).toEqual(['invalidate', 'fetch']);
    });

    it('keeps the decisions and reports the message when the request fails', async () => {
      adminRoleManagement.patchDatasetPermissions.mockReturnValue(
        throwError(() => ({ status: 400, error: { message: 'unknown permission' } }))
      );
      state.setAction('a', 'viewer', 'grant');

      await expect(state.save()).resolves.toEqual({
        status: 'failed',
        message: 'unknown permission',
      });
      expect(state.decisions()['a']).toEqual({ viewer: 'grant', editor: 'keep' });
      expect(state.saving()).toBe(false);
      expect(bootstrap.fetchIndicatorsMetadata).not.toHaveBeenCalled();
    });

    it('falls back to the HTTP message when the backend sends none', async () => {
      adminRoleManagement.patchDatasetPermissions.mockReturnValue(
        throwError(() => ({ status: 0, message: 'Http failure response' }))
      );
      state.setAction('a', 'viewer', 'grant');

      await expect(state.save()).resolves.toEqual({
        status: 'failed',
        message: 'Http failure response',
      });
    });

    it('reports a stored save whose reload failed', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      bootstrap.fetchSpatialUnitsMetadata.mockRejectedValue(new Error('offline'));
      state.setAction('a', 'viewer', 'grant');

      await expect(state.save()).resolves.toEqual({
        status: 'saved',
        datasetCount: 3,
        reloaded: false,
      });
      expect(state.decisions()).toEqual({});
    });
  });
});
