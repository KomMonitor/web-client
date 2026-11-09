import { Provider, WritableSignal, signal } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { MandantService } from 'services/mandant-service/mandant.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

import { AdminRoleManagementService } from '../admin-role-management.service';
import { OwnerDatasetSources } from './dataset-permissions.model';
import { orgUnit } from './dataset-permissions.fixture';

/**
 * The services `DatasetPermissionsWizardStateService` and the wizard read,
 * faked for specs: the stores and the access control as signals a spec can
 * change, the writes as mocks. The state itself stays real, so a spec sees
 * what the wizard really derives.
 *
 * Not used by the application — only by `*.spec.ts` in this folder.
 */

export const TEST_ROLES = ['kommonitor-creator'];

export interface WizardStateTestBed {
  providers: Provider[];
  accessControl: WritableSignal<AccessControlMetadata[]>;
  indicators: WritableSignal<OwnerDatasetSources['indicators'][number][]>;
  georesources: WritableSignal<OwnerDatasetSources['georesources'][number][]>;
  spatialUnits: WritableSignal<OwnerDatasetSources['spatialUnits'][number][]>;
  metadataLoading: BehaviorSubject<MetadataLoadingState>;
  adminRoleManagement: { patchDatasetPermissions: jest.Mock };
  bootstrap: {
    fetchIndicatorsMetadata: jest.Mock;
    fetchGeoresourcesMetadata: jest.Mock;
    fetchSpatialUnitsMetadata: jest.Mock;
  };
  cacheHelper: {
    invalidateIndicatorsCache: jest.Mock;
    invalidateGeoresourcesCache: jest.Mock;
    invalidateSpatialUnitsCache: jest.Mock;
  };
}

/**
 * @param tenantOf the tenant of each unit; units missing here belong to none.
 *   Every key becomes an organizational unit built by `orgUnit`.
 */
export function wizardStateTestBed(
  sources: Partial<OwnerDatasetSources>,
  tenantOf: Record<string, string>
): WizardStateTestBed {
  const accessControl = signal(Object.keys(tenantOf).map((id) => orgUnit(id)));
  const indicators = signal([...(sources.indicators ?? [])]);
  const georesources = signal([...(sources.georesources ?? [])]);
  const spatialUnits = signal([...(sources.spatialUnits ?? [])]);
  const metadataLoading = new BehaviorSubject(MetadataLoadingState.COMPLETE);

  const adminRoleManagement = { patchDatasetPermissions: jest.fn(() => of(undefined)) };
  const bootstrap = {
    fetchIndicatorsMetadata: jest.fn().mockResolvedValue(undefined),
    fetchGeoresourcesMetadata: jest.fn().mockResolvedValue(undefined),
    fetchSpatialUnitsMetadata: jest.fn().mockResolvedValue(undefined),
  };
  const cacheHelper = {
    invalidateIndicatorsCache: jest.fn(),
    invalidateGeoresourcesCache: jest.fn(),
    invalidateSpatialUnitsCache: jest.fn(),
  };

  const providers: Provider[] = [
    {
      provide: AccessControlService,
      useValue: {
        get accessControl() {
          return accessControl();
        },
        getAccessControlById: (id: string) =>
          accessControl().find((unit) => unit.organizationalUnitId === id) ?? null,
        currentKeycloakLoginRoles: TEST_ROLES,
      },
    },
    {
      provide: MandantService,
      useValue: { mandantIdOfOwner: (id: string) => tenantOf[id] ?? '' },
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
    {
      provide: MetadataBootstrapService,
      useValue: { ...bootstrap, metadataLoading$: metadataLoading.asObservable() },
    },
    { provide: CacheHelperServiceService, useValue: cacheHelper },
  ];

  return {
    providers,
    accessControl,
    indicators,
    georesources,
    spatialUnits,
    metadataLoading,
    adminRoleManagement,
    bootstrap,
    cacheHelper,
  };
}
