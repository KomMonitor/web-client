import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FeatureTableDataGridHelperService } from 'services/feature-table-data-grid-helper-service/feature-table-data-grid-helper.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { ResourceImportService } from 'services/resource-import-service/resource-import.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

import { SpatialUnitEditFeaturesModalComponent } from './spatial-unit-edit-features-modal.component';

/**
 * Safety net for the PUT-body builder, the period-of-validity flag, the date
 * blur coercion, the attribute-mapping table and the reset defaults, ahead of
 * the planned typing / Reactive-Forms rework. This modal had no spec at all.
 *
 * Like the other modal specs in this repo, the fixture is deliberately never
 * rendered (`detectChanges()` is not called): ngOnInit awaits the importer
 * resources and builds an AG Grid feature table.
 */

const ATTRIBUTE_MAPPING_TYPES = [
  { displayName: 'Text', apiName: 'string' },
  { displayName: 'Ganzzahl', apiName: 'integer' },
];

describe('SpatialUnitEditFeaturesModalComponent', () => {
  let component: SpatialUnitEditFeaturesModalComponent;
  let fixture: ComponentFixture<SpatialUnitEditFeaturesModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SpatialUnitEditFeaturesModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
        { provide: EnvConfigService, useValue: { enableKeycloakSecurity: true } },
        { provide: SpatialUnitMetadataStoreService, useValue: { availableSpatialUnits: [] } },
        { provide: CacheHelperServiceService, useValue: {} },
        { provide: IndicatorValueService, useValue: { syntaxHighlightJSON: () => '' } },
        {
          provide: NotificationService,
          useValue: { showError: jest.fn(), showSuccess: jest.fn() },
        },
        {
          provide: FeatureTableDataGridHelperService,
          useValue: { buildFeatureTableGrid: jest.fn() },
        },
        // Must be stubbed: the real service fires GETs from its constructor.
        {
          provide: KommonitorImporterHelperService,
          useValue: {
            mappingConfigStructure: {},
            attributeMapping_attributeTypes: ATTRIBUTE_MAPPING_TYPES,
            getAttributeMappingTypes: () => ATTRIBUTE_MAPPING_TYPES,
            getAvailableConverters: () => [],
            getAvailableDatasourceTypes: () => [],
            fetchResourcesFromImporter: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ResourceImportService,
          useValue: {
            buildImporterObjects: jest.fn(),
            readJsonFile: jest.fn(),
            parseMappingConfig: jest.fn(),
            collectMissingImporterFields: jest.fn().mockReturnValue([]),
            downloadJson: jest.fn(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(SpatialUnitEditFeaturesModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------

  describe('buildPutBody_spatialUnits', () => {
    it('sends the validity period and the partial-update flag', () => {
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '2026-12-31' };
      component.isPartialUpdate = true;

      expect(component.buildPutBody_spatialUnits()).toEqual({
        geoJsonString: '',
        periodOfValidity: { startDate: '2026-01-01', endDate: '2026-12-31' },
        isPartialUpdate: true,
      });
    });

    it('leaves the geometry payload to the importer', () => {
      expect(component.buildPutBody_spatialUnits().geoJsonString).toBe('');
    });

    it('defaults to a full update', () => {
      expect(component.buildPutBody_spatialUnits().isPartialUpdate).toBe(false);
    });

    it('passes an open-ended period through as an empty string', () => {
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '' };

      expect(component.buildPutBody_spatialUnits().periodOfValidity).toEqual({
        startDate: '2026-01-01',
        endDate: '',
      });
    });
  });

  // ---------------------------------------------------------------------------

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

    it('rejects an identical start and end date', () => {
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '2026-01-01' };

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(true);
    });

    it('accepts an open-ended period', () => {
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '' };

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });

    it('clears a previous verdict on re-check', () => {
      component.periodOfValidity = { startDate: '2026-12-31', endDate: '2026-01-01' };
      component.checkPeriodOfValidity();

      component.periodOfValidity = { startDate: '2026-01-01', endDate: '2026-12-31' };
      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------

  describe('date blur coercion', () => {
    const today = (): string => {
      const now = new Date();
      return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-');
    };

    it('fills an empty start date with today', () => {
      component.periodOfValidity = { startDate: '', endDate: '' };

      component.onPeriodStartBlur();

      expect(component.periodOfValidity.startDate).toBe(today());
    });

    it('replaces an unparseable start date with today', () => {
      component.periodOfValidity = { startDate: '31.12.2026', endDate: '' };

      component.onPeriodStartBlur();

      expect(component.periodOfValidity.startDate).toBe(today());
    });

    it('keeps a valid start date', () => {
      component.periodOfValidity = { startDate: '2026-03-07', endDate: '' };

      component.onPeriodStartBlur();

      expect(component.periodOfValidity.startDate).toBe('2026-03-07');
    });

    it('leaves an empty end date empty', () => {
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '' };

      component.onPeriodEndBlur();

      expect(component.periodOfValidity.endDate).toBe('');
    });

    it('replaces an unparseable end date with today', () => {
      component.periodOfValidity = { startDate: '2026-01-01', endDate: 'morgen' };

      component.onPeriodEndBlur();

      expect(component.periodOfValidity.endDate).toBe(today());
    });
  });

  // ---------------------------------------------------------------------------

  describe('attribute mappings', () => {
    beforeEach(() => {
      component.attributeMapping_attributeType = ATTRIBUTE_MAPPING_TYPES[0];
    });

    it('adds the drafted row to the table and clears the draft', () => {
      component.attributeMapping_sourceAttributeName = 'gen';
      component.attributeMapping_destinationAttributeName = 'name';

      component.onAddOrUpdateAttributeMapping();

      expect(component.attributeMappings_adminView).toEqual([
        { sourceName: 'gen', destinationName: 'name', dataType: ATTRIBUTE_MAPPING_TYPES[0] },
      ]);
      expect(component.attributeMapping_sourceAttributeName).toBe('');
      expect(component.attributeMapping_destinationAttributeName).toBe('');
    });

    it('replaces a row with the same source name instead of appending', () => {
      component.attributeMapping_sourceAttributeName = 'gen';
      component.attributeMapping_destinationAttributeName = 'name';
      component.onAddOrUpdateAttributeMapping();

      component.attributeMapping_sourceAttributeName = 'gen';
      component.attributeMapping_destinationAttributeName = 'bezeichnung';
      component.attributeMapping_attributeType = ATTRIBUTE_MAPPING_TYPES[1];
      component.onAddOrUpdateAttributeMapping();

      expect(component.attributeMappings_adminView).toEqual([
        {
          sourceName: 'gen',
          destinationName: 'bezeichnung',
          dataType: ATTRIBUTE_MAPPING_TYPES[1],
        },
      ]);
    });

    it('loads an existing row back into the draft for editing', () => {
      const row = {
        sourceName: 'gen',
        destinationName: 'name',
        dataType: ATTRIBUTE_MAPPING_TYPES[1],
      };

      component.onClickEditAttributeMapping(row);

      expect(component.attributeMapping_sourceAttributeName).toBe('gen');
      expect(component.attributeMapping_destinationAttributeName).toBe('name');
      expect(component.attributeMapping_attributeType).toBe(ATTRIBUTE_MAPPING_TYPES[1]);
    });

    it('removes a row by its source name', () => {
      component.attributeMappings_adminView = [
        { sourceName: 'gen', destinationName: 'name', dataType: ATTRIBUTE_MAPPING_TYPES[0] },
        { sourceName: 'ags', destinationName: 'id', dataType: ATTRIBUTE_MAPPING_TYPES[0] },
      ];

      component.onClickDeleteAttributeMapping({ sourceName: 'gen' });

      expect(component.attributeMappings_adminView.map((row) => row.sourceName)).toEqual(['ags']);
    });
  });

  // ---------------------------------------------------------------------------

  describe('resetForm', () => {
    it('restores the non-empty defaults instead of nulling them', () => {
      component.keepAttributes = false;
      component.keepMissingValues = false;

      component.resetForm();

      expect(component.keepAttributes).toBe(true);
      expect(component.keepMissingValues).toBe(true);
      expect(component.attributeMapping_attributeType).toBe(ATTRIBUTE_MAPPING_TYPES[0]);
    });

    it('clears the entered importer values', () => {
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '2026-12-31' };
      component.spatialUnitDataSourceIdProperty = 'id';
      component.spatialUnitDataSourceNameProperty = 'name';
      component.converter = { name: 'GeoJSON' } as never;
      component.schema = 'default';
      component.mimeType = 'application/json';
      component.datasourceType = { type: 'FILE' } as never;
      component.validityStartDate_perFeature = 'von';
      component.attributeMappings_adminView = [
        { sourceName: 'gen', destinationName: 'name', dataType: ATTRIBUTE_MAPPING_TYPES[0] },
      ];

      component.resetForm();

      expect(component.periodOfValidity).toEqual({ startDate: '', endDate: '' });
      expect(component.spatialUnitDataSourceIdProperty).toBe('');
      expect(component.spatialUnitDataSourceNameProperty).toBe('');
      expect(component.converter).toBeNull();
      expect(component.schema).toBe('');
      expect(component.mimeType).toBe('');
      expect(component.datasourceType).toBeNull();
      expect(component.validityStartDate_perFeature).toBe('');
      expect(component.attributeMappings_adminView).toEqual([]);
    });
  });
});
