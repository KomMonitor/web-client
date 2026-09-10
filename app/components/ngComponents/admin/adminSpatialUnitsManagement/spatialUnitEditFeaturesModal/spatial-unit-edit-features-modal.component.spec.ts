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
 * blur coercion, the attribute-mapping table and the reset defaults, plus the
 * rendered data step.
 *
 * Two tiers, mirroring `indicatorEditFeaturesModal`:
 *
 * - The blocks below drive the component directly and never render.
 * - `describe('rendered data step')` renders. The overview step sits behind
 *   `@if (stepper.isActive('overview'))`, so moving the stepper to the data
 *   step before the first change detection keeps `<ag-grid-angular>` out of the
 *   DOM and no child stubbing is needed. Unlike the indicator modal, `ngOnInit`
 *   here is async (it awaits the importer resources), so the render helper
 *   awaits stability before the fields are asserted on.
 *
 * That second tier is the only thing that catches a `formControlName` rendered
 * for a control that does not exist — it throws `Cannot find control with
 * name: …` at render time and nowhere else. This modal carries three such
 * dictionaries: both parameter records and the bounding box group.
 */

const ATTRIBUTE_MAPPING_TYPES = [
  { displayName: 'Text', apiName: 'string' },
  { displayName: 'Ganzzahl', apiName: 'integer' },
];

const SPATIAL_UNITS = [
  { spatialUnitLevel: 'Stadtteile', spatialUnitId: 'su-1' },
  { spatialUnitLevel: 'Baublöcke', spatialUnitId: 'su-2' },
];

/**
 * Converters and data source types come from the importer at runtime. They must
 * carry parameters, otherwise the rendered tests prove nothing — a parameterless
 * converter and a FILE data source render no parameter fields at all.
 */
const CONVERTER = {
  name: 'CSV',
  type: 'csv',
  mimeTypes: ['text/csv'],
  encodings: ['UTF-8'],
  schemas: ['default'],
  parameters: [
    { name: 'delimiter', mandatory: true },
    { name: 'comment', mandatory: false },
  ],
};

/** Shares `delimiter` with CONVERTER, but not `comment`. */
const CONVERTER_SHARING_A_PARAMETER = {
  name: 'CSV kompakt',
  type: 'csv-compact',
  mimeTypes: ['text/csv'],
  encodings: ['UTF-8'],
  parameters: [{ name: 'delimiter', mandatory: true }],
};

const HTTP_DATASOURCE = { type: 'HTTP', parameters: [{ name: 'url', mandatory: true }] };

/** Carries the synthetic bbox entries the bbox block renders instead. */
const OGC_DATASOURCE = {
  type: 'OGCAPI_FEATURES',
  parameters: [
    { name: 'url', mandatory: true },
    { name: 'bbox', mandatory: false },
    { name: 'bboxType', mandatory: false },
  ],
};

const FILE_DATASOURCE = { type: 'FILE', parameters: [] };

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
          // buildSpatialResourceFeatureTable runs in ngOnInit and its result is
          // destructured right after, so it must return grid options.
          provide: FeatureTableDataGridHelperService,
          useValue: {
            buildFeatureTableGrid: jest.fn(),
            buildSpatialResourceFeatureTable: jest
              .fn()
              .mockReturnValue({ columnDefs: [], rowData: [], defaultColDef: {} }),
          },
        },
        // Must be stubbed: the real service fires GETs from its constructor.
        {
          provide: KommonitorImporterHelperService,
          useValue: {
            mappingConfigStructure: {},
            attributeMapping_attributeTypes: ATTRIBUTE_MAPPING_TYPES,
            getAttributeMappingTypes: () => ATTRIBUTE_MAPPING_TYPES,
            getAvailableConverters: () => [CONVERTER, CONVERTER_SHARING_A_PARAMETER],
            getAvailableDatasourceTypes: () => [HTTP_DATASOURCE, OGC_DATASOURCE, FILE_DATASOURCE],
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

  // ---------------------------------------------------------------------------

  /**
   * The rendered tier — see the file header. Everything goes through the real
   * widgets: picking a converter, data source or spatial filter dispatches a
   * `change` on its `<select>`, filling a field dispatches an `input`.
   */
  describe('rendered data step', () => {
    /**
     * Step 2 is 'data'. Going there before the first change detection keeps the
     * overview step's AG Grid unrendered; the first `detectChanges()` starts the
     * async `ngOnInit`, whose `loadAvailableOptions()` fills the two selects.
     */
    const renderDataStep = async (): Promise<void> => {
      component.stepper.goTo(2);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };

    const query = <T extends HTMLElement>(selector: string): T | null =>
      fixture.nativeElement.querySelector(selector);

    /** Parameter fields carry no `formcontrolname` attribute — the binding is
     * dynamic — but their placeholder is the parameter name. */
    const parameterField = (name: string): HTMLElement | null => query(`[placeholder="${name}"]`);

    const bboxField = (corner: string): HTMLInputElement | null =>
      query(`#datasourceTypeParameter_spatialUnitEditFeatures_bbox_${corner}`);

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

    const typeInto = (element: HTMLInputElement | HTMLElement | null, value: string): void => {
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

    it('keeps the AG Grid feature table out of the DOM', async () => {
      await renderDataStep();

      // Guards the assumption this whole tier rests on.
      expect(query('ag-grid-angular')).toBeNull();
    });

    it('renders a field per converter parameter', async () => {
      await renderDataStep();

      // Without `formGroupName="converterParameters"` around the loop this
      // throws `Cannot find control with name: delimiter`.
      expect(() => chooseConverter('CSV')).not.toThrow();
      expect(parameterField('delimiter')).not.toBeNull();
      expect(parameterField('comment')).not.toBeNull();
    });

    it('writes what is typed into a parameter field to its control', async () => {
      await renderDataStep();
      chooseConverter('CSV');

      typeInto(parameterField('delimiter'), ';');

      expect(component.importerForm.controls.converterParameters.controls['delimiter'].value).toBe(
        ';'
      );
    });

    it('swaps the fields on a converter switch and keeps the shared value', async () => {
      await renderDataStep();
      chooseConverter('CSV');
      typeInto(parameterField('delimiter'), ';');

      chooseConverter('CSV kompakt');

      expect(parameterField('delimiter')).not.toBeNull();
      expect(parameterField('comment')).toBeNull();
      expect(component.converterParameters).toEqual({ delimiter: ';' });
    });

    it('renders a field per data source parameter', async () => {
      await renderDataStep();
      chooseConverter('CSV');

      expect(() => chooseDatasourceType('HTTP')).not.toThrow();
      expect(parameterField('url')).not.toBeNull();
    });

    it('renders the manual bounding box inside its form group', async () => {
      await renderDataStep();
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

    it('offers the reference spatial units for the other filter mode', async () => {
      await renderDataStep();
      chooseConverter('CSV');
      chooseDatasourceType('OGCAPI_FEATURES');

      chooseValue('select[formcontrolname="bboxType"]', 'ref');
      chooseValue('select[formcontrolname="bboxRefSpatialUnitId"]', 'Stadtteile');

      expect(bboxField('minx')).toBeNull();
      expect(component.importerForm.controls.bboxRefSpatialUnitId.value).toBe('Stadtteile');
    });

    it('drops the bounding box entries when switching to a FILE upload', async () => {
      await renderDataStep();
      chooseConverter('CSV');
      chooseDatasourceType('OGCAPI_FEATURES');
      chooseValue('select[formcontrolname="bboxType"]', 'literal');
      typeInto(bboxField('minx'), '7');

      chooseDatasourceType('FILE');

      expect(bboxField('minx')).toBeNull();
      expect(component.importerForm.controls.bbox.controls.minx.value).toBeFalsy();
      expect(query('input[type="file"]')).not.toBeNull();
    });
  });
});
