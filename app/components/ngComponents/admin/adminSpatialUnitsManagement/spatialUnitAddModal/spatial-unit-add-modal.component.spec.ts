import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AccessControlService } from 'services/access-control-service/access-control.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { ResourceImportService } from 'services/resource-import-service/resource-import.service';
import { SpatialUnitPOSTInputType } from 'models/data-management-api';

import { SpatialUnitAddModalComponent } from './spatial-unit-add-modal.component';
import { RoleManagementGridComponent } from '../../adminShared/roleManagementPanel/role-management-grid.component';

/**
 * Safety net for the POST-body builder and the three hand-written validation
 * flags, ahead of the planned typing / Reactive-Forms rework.
 *
 * The fixture is deliberately never rendered (`detectChanges()` is not called),
 * following the other modal specs in this repo: ngOnInit would fire the importer
 * fetch and the access-control bootstrap, and rendering would instantiate AG Grid
 * for the role panel. The builder and the validators need neither.
 *
 * Not re-tested here (own specs): `metadataFormToApi` / the metadata form model,
 * `toIsoDateString` and `getErrorMessage`, `ResourceImportService`, and the
 * WizardStepper's step arithmetic.
 */

/** Required properties of SpatialUnitPOSTInputType, straight from the OpenAPI spec. */
const POST_REQUIRED_FIELDS: (keyof SpatialUnitPOSTInputType)[] = [
  'permissions',
  'geoJsonString',
  'metadata',
  'periodOfValidity',
  'spatialUnitLevel',
  'isPublic',
];

// Ordered coarse -> fine; the hierarchy check compares array indices.
const SPATIAL_UNITS = [
  { spatialUnitId: 'su-city', spatialUnitLevel: 'Stadt' },
  { spatialUnitId: 'su-district', spatialUnitLevel: 'Stadtteile' },
  { spatialUnitId: 'su-block', spatialUnitLevel: 'Baublöcke' },
];

/** The role grid is a collaborator; only getSelectedRoleIds() is read here. */
function fakeRoleGrid(selected: string[] = []) {
  return {
    permissions: null as string[] | null,
    ownerId: null as string | null,
    reset: jest.fn(),
    applyPermissions: jest.fn(),
    getSelectedRoleIds: jest.fn(() => selected),
  };
}

describe('SpatialUnitAddModalComponent', () => {
  let component: SpatialUnitAddModalComponent;
  let fixture: ComponentFixture<SpatialUnitAddModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SpatialUnitAddModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
        {
          provide: EnvConfigService,
          useValue: { enableKeycloakSecurity: true, updateIntervalOptions: [] },
        },
        {
          provide: SpatialUnitMetadataStoreService,
          useValue: { availableSpatialUnits: SPATIAL_UNITS },
        },
        {
          provide: AccessControlService,
          useValue: { accessControl: [], currentKeycloakLoginRoles: [] },
        },
        {
          provide: MetadataBootstrapService,
          useValue: { fetchAccessControlMetadata: jest.fn().mockResolvedValue(undefined) },
        },
        // Must be stubbed: the real service fires GET converters / datasourceTypes
        // from its constructor, so merely injecting it would hit the network.
        {
          provide: KommonitorImporterHelperService,
          useValue: {
            mappingConfigStructure: {},
            getAttributeMappingTypes: () => [],
            getAvailableConverters: () => [],
            getAvailableDatasourceTypes: () => [],
            fetchResourcesFromImporter: jest.fn().mockResolvedValue(undefined),
            registerNewSpatialUnit: jest.fn(),
            importerResponseContainsErrors: jest.fn().mockReturnValue(false),
            getIdFromImporterResponse: jest.fn(),
            getImportedFeaturesFromImporterResponse: jest.fn(),
            getErrorsFromImporterResponse: jest.fn(),
          },
        },
        {
          provide: ResourceImportService,
          useValue: {
            buildImporterObjects: jest.fn(),
            readJsonFile: jest.fn(),
            parseMappingConfig: jest.fn(),
            downloadJson: jest.fn(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(SpatialUnitAddModalComponent);
    component = fixture.componentInstance;
    component.availableSpatialUnits = SPATIAL_UNITS;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // buildPostBody_spatialUnits
  // ---------------------------------------------------------------------------

  describe('buildPostBody_spatialUnits', () => {
    beforeEach(() => {
      component.spatialUnitLevel = 'Quartiere';
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '2026-12-31' };
      component.ownerOrganization = 'org-1';
      component.isPublic = true;
      component.metadataForm.patchValue({
        description: 'Beschreibung',
        datasource: 'Quelle',
        contact: 'Kontakt',
      });
    });

    it('emits every field SpatialUnitPOSTInputType marks as required', () => {
      const body = component.buildPostBody_spatialUnits();

      for (const field of POST_REQUIRED_FIELDS) {
        expect(Object.prototype.hasOwnProperty.call(body, field)).toBe(true);
      }
    });

    it('leaves geoJsonString empty — the importer fills it in', () => {
      expect(component.buildPostBody_spatialUnits().geoJsonString).toBe('');
    });

    it('reduces the hierarchy selections to their level names', () => {
      component.nextLowerHierarchySpatialUnit = SPATIAL_UNITS[2];
      component.nextUpperHierarchySpatialUnit = SPATIAL_UNITS[0];

      const body = component.buildPostBody_spatialUnits();

      expect(body.nextLowerHierarchyLevel).toBe('Baublöcke');
      expect(body.nextUpperHierarchyLevel).toBe('Stadt');
    });

    it('sends null for an unset hierarchy level', () => {
      const body = component.buildPostBody_spatialUnits();

      expect(body.nextLowerHierarchyLevel).toBeNull();
      expect(body.nextUpperHierarchyLevel).toBeNull();
    });

    it('normalises the period of validity to ISO strings', () => {
      const body = component.buildPostBody_spatialUnits();

      expect(body.periodOfValidity).toEqual({ startDate: '2026-01-01', endDate: '2026-12-31' });
    });

    it('keeps the period keys present when no dates are set', () => {
      component.periodOfValidity = { startDate: '', endDate: '' };

      const body = component.buildPostBody_spatialUnits();

      expect(body.periodOfValidity.startDate).toBeNull();
      expect(body.periodOfValidity.endDate).toBeNull();
    });

    it('emits the outline fields even when the outline layer is off', () => {
      component.isOutlineLayer = false;
      component.outlineColor = '#123456';
      component.outlineWidth = 5;

      const body = component.buildPostBody_spatialUnits();

      expect(body.isOutlineLayer).toBe(false);
      expect(body.outlineColor).toBe('#123456');
      expect(body.outlineWidth).toBe(5);
      // no pattern picked -> undefined, not null
      expect(body.outlineDashArrayString).toBeUndefined();
    });

    it('takes the dash-array string from the selected line pattern', () => {
      component.selectedOutlineDashArrayObject = { dashArrayValue: '5,5' } as any;

      expect(component.buildPostBody_spatialUnits().outlineDashArrayString).toBe('5,5');
    });

    it('takes permissions from the role grid', () => {
      (component as any).roleGrid = fakeRoleGrid([
        'p-view',
        'p-edit',
      ]) as unknown as RoleManagementGridComponent;

      expect(component.buildPostBody_spatialUnits().permissions).toEqual(['p-view', 'p-edit']);
    });

    it('falls back to an empty permission list when no grid was rendered', () => {
      // The security step is only rendered with Keycloak enabled, so the ViewChild
      // can legitimately be unresolved.
      expect(component.buildPostBody_spatialUnits().permissions).toEqual([]);
    });

    it('passes owner and visibility through unchanged', () => {
      const body = component.buildPostBody_spatialUnits();

      expect(body.ownerId).toBe('org-1');
      expect(body.isPublic).toBe(true);
    });

    it('delegates the metadata block to metadataFormToApi', () => {
      const metadata = component.buildPostBody_spatialUnits().metadata;

      expect(metadata.description).toBe('Beschreibung');
      expect(metadata.datasource).toBe('Quelle');
      expect(metadata.contact).toBe('Kontakt');
    });
  });

  // ---------------------------------------------------------------------------
  // The three hand-written validation flags
  // ---------------------------------------------------------------------------

  describe('checkSpatialUnitName', () => {
    it('flags a level name that already exists', () => {
      component.spatialUnitLevel = 'Stadtteile';

      component.checkSpatialUnitName();

      expect(component.spatialUnitLevelInvalid).toBe(true);
    });

    it('accepts a new level name', () => {
      component.spatialUnitLevel = 'Quartiere';

      component.checkSpatialUnitName();

      expect(component.spatialUnitLevelInvalid).toBe(false);
    });

    it('accepts an empty name (the submit button gates on that separately)', () => {
      component.spatialUnitLevel = '';

      component.checkSpatialUnitName();

      expect(component.spatialUnitLevelInvalid).toBe(false);
    });

    it('clears a previous verdict on re-check', () => {
      component.spatialUnitLevel = 'Stadtteile';
      component.checkSpatialUnitName();

      component.spatialUnitLevel = 'Quartiere';
      component.checkSpatialUnitName();

      expect(component.spatialUnitLevelInvalid).toBe(false);
    });
  });

  describe('checkSpatialUnitHierarchy', () => {
    it('accepts a lower level that is finer than the upper one', () => {
      component.nextLowerHierarchySpatialUnit = SPATIAL_UNITS[2]; // Baublöcke (index 2)
      component.nextUpperHierarchySpatialUnit = SPATIAL_UNITS[0]; // Stadt (index 0)

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(false);
    });

    it('rejects a lower level that is coarser than the upper one', () => {
      component.nextLowerHierarchySpatialUnit = SPATIAL_UNITS[0];
      component.nextUpperHierarchySpatialUnit = SPATIAL_UNITS[2];

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(true);
    });

    it('rejects the same level on both ends', () => {
      component.nextLowerHierarchySpatialUnit = SPATIAL_UNITS[1];
      component.nextUpperHierarchySpatialUnit = SPATIAL_UNITS[1];

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(true);
    });

    it('stays valid while only one end is selected', () => {
      component.nextLowerHierarchySpatialUnit = SPATIAL_UNITS[0];
      component.nextUpperHierarchySpatialUnit = null;

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(false);
    });

    it('stays valid when a selected level is unknown to the store', () => {
      component.nextLowerHierarchySpatialUnit = { spatialUnitLevel: 'Fremd' } as any;
      component.nextUpperHierarchySpatialUnit = { spatialUnitLevel: 'Auch fremd' } as any;

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(false);
    });
  });

  describe('checkPeriodOfValidity', () => {
    it('accepts a start before the end', () => {
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '2026-12-31' };

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });

    it('rejects an end that is not after the start', () => {
      component.periodOfValidity = { startDate: '2026-12-31', endDate: '2026-01-01' };

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(true);
    });

    it('accepts an open-ended period', () => {
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '' };

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });

    it('accepts NgbDateStruct values from the datepicker', () => {
      component.periodOfValidity = {
        startDate: { year: 2026, month: 1, day: 1 } as any,
        endDate: { year: 2026, month: 12, day: 31 } as any,
      };

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });
  });
});
