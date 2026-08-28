import { Component, EventEmitter, Input, NO_ERRORS_SCHEMA, Output } from '@angular/core';
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

import { AgGridAngular } from 'ag-grid-angular';
import { SingleFeatureEditComponent } from 'components/ngComponents/common/single-feature-edit/single-feature-edit.component';

import { GeoresourceEditFeaturesModalComponent } from './georesource-edit-features-modal.component';

/**
 * Safety net for the PUT-body builder, the submit gate, the period-of-validity
 * flag and the attribute-mapping table, ahead of the planned typing /
 * Reactive-Forms rework. The file previously held a `should create` smoke test
 * only.
 *
 * Two tiers, like `indicatorEditFeaturesModal` and `spatialUnitEditFeaturesModal`:
 *
 * - The blocks below drive the component directly and never render.
 * - `describe('rendered batch step')` renders the importer step, the only tier
 *   that catches a `formControlName` without a control (`Cannot find control
 *   with name: …` at render time). This modal carries three such dictionaries:
 *   both parameter records and the bounding box group.
 *
 * Unlike its two siblings, all three fieldsets here are toggled with
 * `[style.display]`, so the overview step's grid and the single-feature editor
 * render whatever step is active — both are replaced by stubs below.
 *
 * `buildPutBody` is private; it is reached through `as any` on purpose — it is
 * the wire format this rework must not change, and there is no public seam.
 */

@Component({ selector: 'ag-grid-angular', standalone: true, template: '' })
class AgGridStubComponent {
  @Input() gridOptions: unknown;
  @Input() rowData: unknown;
  @Input() columnDefs: unknown;
  @Output() gridReady = new EventEmitter<unknown>();
  @Output() firstDataRendered = new EventEmitter<unknown>();
  @Output() columnResized = new EventEmitter<unknown>();
  @Output() cellValueChanged = new EventEmitter<unknown>();
}

@Component({ selector: 'app-single-feature-edit', standalone: true, template: '' })
class SingleFeatureEditStubComponent {}

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
    // Synthetic: rendered by the bbox block, never as a plain parameter field.
    { name: 'bboxType', mandatory: false },
  ],
};
const HTTP_DATASOURCE = { type: 'HTTP', parameters: [{ name: 'url', mandatory: true }] };

/** Parameter-carrying converters for the rendered tier. */
const CSV_CONVERTER = {
  name: 'CSV',
  type: 'csv',
  mimeTypes: ['text/csv'],
  encodings: ['UTF-8'],
  parameters: [
    { name: 'delimiter', mandatory: true },
    { name: 'comment', mandatory: false },
  ],
};

/** Shares `delimiter` with CSV_CONVERTER, but not `comment`. */
const CSV_CONVERTER_COMPACT = {
  name: 'CSV kompakt',
  type: 'csv-compact',
  mimeTypes: ['text/csv'],
  encodings: ['UTF-8'],
  parameters: [{ name: 'delimiter', mandatory: true }],
};

const SPATIAL_UNITS = [
  { spatialUnitLevel: 'Stadtteile', spatialUnitId: 'su-1' },
  { spatialUnitLevel: 'Baublöcke', spatialUnitId: 'su-2' },
];

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
        {
          provide: SpatialUnitMetadataStoreService,
          useValue: { availableSpatialUnits: SPATIAL_UNITS },
        },
        { provide: CacheHelperServiceService, useValue: {} },
        { provide: IndicatorValueService, useValue: { syntaxHighlightJSON: () => '' } },
        {
          provide: NotificationService,
          useValue: { showError: jest.fn(), showSuccess: jest.fn() },
        },
        {
          // buildSpatialResourceFeatureTable runs in ngOnInit and the template
          // reads the result, so it must return grid options.
          provide: FeatureTableDataGridHelperService,
          useValue: {
            buildFeatureTableGrid: jest.fn(),
            buildSpatialResourceFeatureTable: jest
              .fn()
              .mockReturnValue({ columnDefs: [], rowData: [], defaultColDef: {} }),
          },
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
            availableConverters: [CSV_CONVERTER, CSV_CONVERTER_COMPACT],
            availableDatasourceTypes: [HTTP_DATASOURCE, OGC_DATASOURCE, FILE_DATASOURCE],
            getAttributeMappingTypes: () => ATTRIBUTE_MAPPING_TYPES,
            getAvailableConverters: () => [CSV_CONVERTER, CSV_CONVERTER_COMPACT],
            getAvailableDatasourceTypes: () => [HTTP_DATASOURCE, OGC_DATASOURCE, FILE_DATASOURCE],
            filterConverters: () => () => true,
            fetchResourcesFromImporter: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    // Both children render on every step (the fieldsets use [style.display]).
    TestBed.overrideComponent(GeoresourceEditFeaturesModalComponent, {
      remove: { imports: [AgGridAngular, SingleFeatureEditComponent] },
      add: { imports: [AgGridStubComponent, SingleFeatureEditStubComponent] },
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

    it('never emits the synthetic bbox parameters as plain entries', () => {
      component.datasourceType = OGC_DATASOURCE;
      setDatasourceParameters({ url: 'https://example.org' });

      const parameters = putBody().datasourceTypeDefinition.parameters;
      expect(parameters.url).toBe('https://example.org');
      expect(parameters.bbox).toBeUndefined();
      // Used to slip through as an empty string: the filter tested only 'bbox'.
      expect(parameters.bboxType).toBeUndefined();
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

  // ---------------------------------------------------------------------------

  /**
   * The rendered tier — see the file header. Everything goes through the real
   * widgets: picking a converter, data source or spatial filter dispatches a
   * `change` on its `<select>`, filling a field dispatches an `input`.
   */
  describe('rendered batch step', () => {
    /** Step 3 is 'batch', the importer step; ngOnInit is synchronous here. */
    const renderBatchStep = (): void => {
      component.stepper.goTo(3);
      fixture.detectChanges();
    };

    const query = <T extends HTMLElement>(selector: string): T | null =>
      fixture.nativeElement.querySelector(selector);

    /** Parameter fields carry no `formcontrolname` attribute — the binding is
     * dynamic — but their placeholder is the parameter name. */
    const parameterField = (name: string): HTMLElement | null => query(`[placeholder="${name}"]`);

    /** `formGroupName` is static markup, so it survives into the DOM. */
    const bboxField = (corner: string): HTMLInputElement | null =>
      query(`[formgroupname="bbox"] [formcontrolname="${corner}"]`);

    const dispatchOn = (select: HTMLSelectElement, value: string): void => {
      select.value = value;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };

    /** For `[ngValue]` selects, whose option keys the accessor owns. */
    const chooseOption = (selector: string, label: string): void => {
      const select = query<HTMLSelectElement>(selector);
      if (!select) {
        throw new Error(`no <select> for "${selector}"`);
      }
      const option = Array.from(select.options).find((o) => o.textContent?.trim() === label);
      if (!option) {
        throw new Error(`no option "${label}" in "${selector}"`);
      }
      dispatchOn(select, option.value);
    };

    /** For plain `[value]` selects such as the spatial filter. */
    const chooseValue = (selector: string, value: string): void => {
      const select = query<HTMLSelectElement>(selector);
      if (!select) {
        throw new Error(`no <select> for "${selector}"`);
      }
      dispatchOn(select, value);
    };

    const typeInto = (element: HTMLElement | null, value: string): void => {
      if (!element) {
        throw new Error('field not rendered');
      }
      (element as HTMLInputElement).value = value;
      element.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    const chooseConverter = (label: string): void =>
      chooseOption('select[formcontrolname="converter"]', label);
    const chooseDatasourceType = (label: string): void =>
      chooseOption('select[formcontrolname="datasourceType"]', label);

    it('renders a field per converter parameter', () => {
      renderBatchStep();

      // Without `formGroupName="converterParameters"` around the loop this
      // throws `Cannot find control with name: delimiter`.
      expect(() => chooseConverter('CSV')).not.toThrow();
      expect(parameterField('delimiter')).not.toBeNull();
      expect(parameterField('comment')).not.toBeNull();
    });

    it('writes what is typed into a parameter field to its control', () => {
      renderBatchStep();
      chooseConverter('CSV');

      typeInto(parameterField('delimiter'), ';');

      expect(component.importerForm.controls.converterParameters.controls['delimiter'].value).toBe(
        ';'
      );
    });

    it('swaps the fields on a converter switch and keeps the shared value', () => {
      renderBatchStep();
      chooseConverter('CSV');
      typeInto(parameterField('delimiter'), ';');

      chooseConverter('CSV kompakt');

      expect(parameterField('delimiter')).not.toBeNull();
      expect(parameterField('comment')).toBeNull();
      expect(component.converterParameterValues).toEqual({ delimiter: ';' });
    });

    it('renders a field per data source parameter', () => {
      renderBatchStep();
      chooseConverter('CSV');

      expect(() => chooseDatasourceType('HTTP')).not.toThrow();
      expect(parameterField('url')).not.toBeNull();
    });

    it('never renders the synthetic bbox parameters as plain fields', () => {
      renderBatchStep();
      chooseConverter('CSV');

      chooseDatasourceType('OGCAPI_FEATURES');

      // They have no control in the record — the bbox block renders them.
      expect(parameterField('bbox')).toBeNull();
      expect(parameterField('bboxType')).toBeNull();
      expect(parameterField('url')).not.toBeNull();
    });

    it('renders the manual bounding box inside its form group', () => {
      renderBatchStep();
      chooseConverter('CSV');
      chooseDatasourceType('OGCAPI_FEATURES');

      // Without `formGroupName="bbox"` this throws
      // `Cannot find control with name: minx`.
      expect(() => chooseValue('select[formcontrolname="bboxType"]', 'literal')).not.toThrow();
      expect(bboxField('minx')).not.toBeNull();
      expect(bboxField('maxy')).not.toBeNull();

      typeInto(bboxField('minx'), '7');

      // A number input hands the accessor a number, not the declared string.
      expect(`${component.importerForm.controls.bbox.controls.minx.value}`).toBe('7');
    });

    it('offers the reference spatial units for the other filter mode', () => {
      renderBatchStep();
      chooseConverter('CSV');
      chooseDatasourceType('OGCAPI_FEATURES');

      chooseValue('select[formcontrolname="bboxType"]', 'ref');
      chooseValue('select[formcontrolname="bboxRefSpatialUnitId"]', 'su-1');

      expect(bboxField('minx')).toBeNull();
      expect(component.importerForm.controls.bboxRefSpatialUnitId.value).toBe('su-1');
    });

    it('hides the bounding box when switching to a FILE upload', () => {
      renderBatchStep();
      chooseConverter('CSV');
      chooseDatasourceType('OGCAPI_FEATURES');
      chooseValue('select[formcontrolname="bboxType"]', 'literal');
      typeInto(bboxField('minx'), '7');

      chooseDatasourceType('FILE');

      expect(bboxField('minx')).toBeNull();
      expect(query('input[type="file"]')).not.toBeNull();
      // Documented difference to the spatial-unit twin, whose
      // `applyDatasourceTypeChange` also clears bboxType, the reference id, the
      // bbox group and the picked file. Here the values survive the switch.
      // Harmless for the wire format (the body keys off `bboxType` *and* the
      // OGCAPI type), but switching back to OGCAPI restores the old corners.
      expect(`${component.importerForm.controls.bbox.controls.minx.value}`).toBe('7');
      expect(component.bboxType).toBe('literal');
    });
  });
});
