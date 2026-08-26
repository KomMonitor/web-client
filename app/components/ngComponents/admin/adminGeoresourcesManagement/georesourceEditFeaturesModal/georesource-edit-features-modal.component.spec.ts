import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';

import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FeatureTableDataGridHelperService } from 'services/feature-table-data-grid-helper-service/feature-table-data-grid-helper.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

import { GeoresourceEditFeaturesModalComponent } from './georesource-edit-features-modal.component';

/**
 * Safety net for the PUT-body builder, the submit gate, the period-of-validity
 * flag and the attribute-mapping table, ahead of the planned typing /
 * Reactive-Forms rework. The file previously held a `should create` smoke test
 * only.
 *
 * Like the other modal specs in this repo, the fixture is deliberately never
 * rendered (`detectChanges()` is not called): ngOnInit subscribes to broadcasts
 * and builds an AG Grid feature table.
 *
 * `buildPutBody` is private; it is reached through `as any` on purpose — it is
 * the wire format this rework must not change, and there is no public seam.
 */

const ATTRIBUTE_MAPPING_TYPES = [
  { displayName: 'Text', apiName: 'string' },
  { displayName: 'Ganzzahl', apiName: 'integer' },
];

const CONVERTER = {
  name: 'GeoJSON',
  type: 'geojson',
  mimeTypes: ['application/json'],
  encodings: ['UTF-8'],
  schemas: ['default'],
  parameters: [
    { name: 'CRS', mandatory: true },
    { name: 'comment', mandatory: false },
  ],
};

const FILE_DATASOURCE = { type: 'FILE', parameters: [{ name: 'path', mandatory: false }] };
const OGC_DATASOURCE = {
  type: 'OGCAPI_FEATURES',
  parameters: [
    { name: 'url', mandatory: true },
    { name: 'bbox', mandatory: false },
  ],
};

describe('GeoresourceEditFeaturesModalComponent', () => {
  let component: GeoresourceEditFeaturesModalComponent;
  let fixture: ComponentFixture<GeoresourceEditFeaturesModalComponent>;

  /** `buildPutBody` is private — see the file comment. */
  const putBody = (): any => (component as any).buildPutBody();

  /** The parameter dictionaries are FormRecords now; fill them through the form. */
  const setConverterParameters = (values: Record<string, string>): void => {
    Object.entries(values).forEach(([name, value]) =>
      component.importerForm.controls.converterParameters.controls[name]?.setValue(value)
    );
  };
  const setDatasourceParameters = (values: Record<string, string>): void => {
    Object.entries(values).forEach(([name, value]) =>
      component.importerForm.controls.datasourceTypeParameters.controls[name]?.setValue(value)
    );
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GeoresourceEditFeaturesModalComponent, TranslateModule.forRoot()],
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
        // Must be an observable: the constructor/ngOnInit subscribes.
        {
          provide: BroadcastService,
          useValue: { currentBroadcastMsg: new BehaviorSubject<any>({ msg: '' }) },
        },
        // Must be stubbed: the real service fires GETs from its constructor.
        {
          provide: KommonitorImporterHelperService,
          useValue: {
            mappingConfigStructure: {},
            attributeMapping_attributeTypes: ATTRIBUTE_MAPPING_TYPES,
            availableConverters: [],
            availableDatasourceTypes: [],
            getAttributeMappingTypes: () => ATTRIBUTE_MAPPING_TYPES,
            getAvailableConverters: () => [],
            getAvailableDatasourceTypes: () => [],
            filterConverters: () => () => true,
            fetchResourcesFromImporter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(GeoresourceEditFeaturesModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------

  describe('buildPutBody — envelope', () => {
    beforeEach(() => {
      component.converter = CONVERTER;
      component.datasourceType = FILE_DATASOURCE;
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '2026-12-31' };
      component.georesourceDataSourceIdProperty = 'id';
      component.georesourceDataSourceNameProperty = 'name';
    });

    it('carries the validity period and leaves the geometry to the importer', () => {
      const body = putBody();

      expect(body.geoJsonString).toBe('');
      expect(body.periodOfValidity).toEqual({ startDate: '2026-01-01', endDate: '2026-12-31' });
    });

    it('passes the validity dates through unnormalised', () => {
      component.periodOfValidity = { startDate: '01.01.2026', endDate: '' };

      expect(putBody().periodOfValidity).toEqual({ startDate: '01.01.2026', endDate: '' });
    });

    it('defaults to a full update', () => {
      expect(putBody().isPartialUpdate).toBe(false);
    });

    it('reports the partial-update flag', () => {
      component.isPartialUpdate = true;

      expect(putBody().isPartialUpdate).toBe(true);
    });

    it('assembles the property mapping', () => {
      component.validityStartDate_perFeature = 'von';
      component.validityEndDate_perFeature = 'bis';
      component.keepAttributes = false;
      component.keepMissingValues = false;
      component.attributeMappings_adminView = [
        { sourceName: 'gen', destinationName: 'name', dataType: ATTRIBUTE_MAPPING_TYPES[0] },
      ];

      expect(putBody().propertyMappingDefinition).toEqual({
        idProperty: 'id',
        nameProperty: 'name',
        validityStartDateProperty: 'von',
        validityEndDateProperty: 'bis',
        keepAttributes: false,
        keepMissingValues: false,
        attributeMappings: [
          { sourceName: 'gen', destinationName: 'name', dataType: ATTRIBUTE_MAPPING_TYPES[0] },
        ],
      });
    });
  });

  // ---------------------------------------------------------------------------

  describe('buildPutBody — converter parameters', () => {
    beforeEach(() => {
      component.converter = CONVERTER;
      component.datasourceType = FILE_DATASOURCE;
    });

    it('emits one entry per declared converter parameter', () => {
      setConverterParameters({ CRS: 'EPSG:25832' });

      expect(putBody().converterDefinition).toEqual({
        name: 'GeoJSON',
        parameters: { CRS: 'EPSG:25832', comment: '' },
      });
    });

    it('folds schema and mime type into the converter parameters', () => {
      component.schema = 'default';
      component.mimeType = 'application/json';

      const parameters = putBody().converterDefinition.parameters;
      expect(parameters.schema).toBe('default');
      expect(parameters.mimeType).toBe('application/json');
    });

    it('omits schema and mime type while they are unset', () => {
      const parameters = putBody().converterDefinition.parameters;

      expect(Object.keys(parameters)).not.toContain('schema');
      expect(Object.keys(parameters)).not.toContain('mimeType');
    });
  });

  // ---------------------------------------------------------------------------

  describe('buildPutBody — data-source parameters', () => {
    beforeEach(() => {
      component.converter = CONVERTER;
    });

    it('emits the declared parameters of a FILE data source', () => {
      component.datasourceType = FILE_DATASOURCE;
      setDatasourceParameters({ path: '/tmp/x.json' });

      expect(putBody().datasourceTypeDefinition).toEqual({
        type: 'FILE',
        parameters: { path: '/tmp/x.json' },
      });
    });

    it('sends the reference spatial unit id for a ref bounding box', () => {
      // The select used to hold the whole spatial-unit object and the body read
      // `.spatialUnitId` off it; it holds the id directly now. Same wire format,
      // one object-identity select less.
      component.datasourceType = OGC_DATASOURCE;
      component.bboxType = 'ref';
      component.bboxRefSpatialUnitId = 'su-42';

      expect(putBody().datasourceTypeDefinition.parameters.spatialUnitId).toBe('su-42');
    });

    it('joins the four corners for a literal bounding box', () => {
      component.datasourceType = OGC_DATASOURCE;
      component.bboxType = 'literal';
      component.bboxMinX = '1';
      component.bboxMinY = '2';
      component.bboxMaxX = '3';
      component.bboxMaxY = '4';

      expect(putBody().datasourceTypeDefinition.parameters.bbox).toBe('1,2,3,4');
    });

    it('never emits the synthetic bbox parameter as a plain entry', () => {
      component.datasourceType = OGC_DATASOURCE;
      setDatasourceParameters({ url: 'https://example.org' });

      const parameters = putBody().datasourceTypeDefinition.parameters;
      expect(parameters.url).toBe('https://example.org');
      expect(parameters.bbox).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------

  describe('canSubmitForm', () => {
    const fillRequired = () => {
      component.currentGeoresourceDataset = { datasetName: 'Spielplätze' };
      component.georesourceDataSourceIdProperty = 'id';
      component.georesourceDataSourceNameProperty = 'name';
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '' };
      component.converter = CONVERTER;
      component.datasourceType = FILE_DATASOURCE;
      // CRS is a mandatory converter parameter; see the stricter-gate test below.
      setConverterParameters({ CRS: 'EPSG:25832' });
    };

    it('stays closed while nothing is filled', () => {
      expect(component.canSubmitForm()).toBe(false);
    });

    it('opens once every required field is filled', () => {
      fillRequired();

      expect(component.canSubmitForm()).toBe(true);
    });

    it.each([
      ['dataset', () => (component.currentGeoresourceDataset = null)],
      ['id property', () => (component.georesourceDataSourceIdProperty = '')],
      ['name property', () => (component.georesourceDataSourceNameProperty = '')],
      ['start date', () => (component.periodOfValidity = { startDate: '', endDate: '' })],
      ['converter', () => (component.converter = undefined)],
      ['data source', () => (component.datasourceType = undefined)],
    ])('stays closed without the %s', (_label, clear) => {
      fillRequired();
      clear();

      expect(component.canSubmitForm()).toBe(false);
    });

    it('stays closed while the validity period is invalid', () => {
      fillRequired();
      component.periodOfValidity = { startDate: '2026-12-31', endDate: '2026-01-01' };
      component.checkPeriodOfValidity();

      expect(component.canSubmitForm()).toBe(false);
    });

    it('stays closed while a mandatory converter parameter is empty', () => {
      // Stricter than before: the gate used to check only converter presence,
      // so a submit with an empty mandatory parameter reached the importer and
      // failed there. The parameter controls carry `required` now.
      fillRequired();
      setConverterParameters({ CRS: '' });

      expect(component.canSubmitForm()).toBe(false);
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
      // Unlike the georesource *add* modal this one compares with `>=` and gets
      // it right, matching the spatial-unit twin.
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

  describe('onChangeConverter', () => {
    it('clears schema, mime type and the data source', () => {
      component.schema = 'default';
      component.mimeType = 'application/json';
      component.datasourceType = FILE_DATASOURCE;

      component.onChangeConverter();

      expect(component.schema).toBe('');
      expect(component.mimeType).toBe('');
      expect(component.datasourceType).toBeFalsy();
    });
  });

  // ---------------------------------------------------------------------------

  describe('attribute mappings', () => {
    beforeEach(() => {
      component.attributeMapping_attributeType = ATTRIBUTE_MAPPING_TYPES[0];
    });

    it('adds the drafted row and clears the draft', () => {
      component.attributeMapping_sourceAttributeName = 'gen';
      component.attributeMapping_destinationAttributeName = 'name';

      component.onAddOrUpdateAttributeMapping();

      expect(component.attributeMappings_adminView).toEqual([
        { sourceName: 'gen', destinationName: 'name', dataType: ATTRIBUTE_MAPPING_TYPES[0] },
      ]);
      expect(component.attributeMapping_sourceAttributeName).toBe('');
      expect(component.attributeMapping_destinationAttributeName).toBe('');
    });

    it('ignores an incomplete draft', () => {
      component.attributeMapping_sourceAttributeName = 'gen';

      component.onAddOrUpdateAttributeMapping();

      expect(component.attributeMappings_adminView).toEqual([]);
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
      component.onClickEditAttributeMapping({
        sourceName: 'gen',
        destinationName: 'name',
        dataType: ATTRIBUTE_MAPPING_TYPES[1],
      });

      expect(component.attributeMapping_sourceAttributeName).toBe('gen');
      expect(component.attributeMapping_destinationAttributeName).toBe('name');
      expect(component.attributeMapping_attributeType).toBe(ATTRIBUTE_MAPPING_TYPES[1]);
    });

    it('removes a row', () => {
      const first = {
        sourceName: 'gen',
        destinationName: 'name',
        dataType: ATTRIBUTE_MAPPING_TYPES[0],
      };
      const second = {
        sourceName: 'ags',
        destinationName: 'id',
        dataType: ATTRIBUTE_MAPPING_TYPES[0],
      };
      component.attributeMappings_adminView = [first, second];

      component.onClickDeleteAttributeMapping(first);

      expect(component.attributeMappings_adminView).toEqual([second]);
    });
  });
});
