import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';

import { AccessControlService } from 'services/access-control-service/access-control.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FeatureTableDataGridHelperService } from 'services/feature-table-data-grid-helper-service/feature-table-data-grid-helper.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { ResourceImportService } from 'services/resource-import-service/resource-import.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

import { IndicatorEditFeaturesModalComponent } from './indicator-edit-features-modal.component';

/**
 * Safety net for the importer-definition builders, the converter switch and the
 * reset defaults, plus the rendered data step.
 *
 * Two tiers, on purpose:
 *
 * - The blocks below drive the component directly and never render. Like the
 *   other modal specs in this repo they leave `detectChanges()` alone, because
 *   the overview step builds an AG Grid feature table.
 * - `describe('rendered data step')` does render — the pattern the other
 *   importer modals should follow. It works because both steps sit behind
 *   `@if (stepper.isActive(…))`: moving the stepper to the data step *before*
 *   the first change detection keeps `<ag-grid-angular>` out of the DOM
 *   entirely, so no child stubbing is needed. That tier is the only thing that
 *   catches the riskiest failure class of the reactive-forms rework — a
 *   `formControlName` rendered for a control that does not exist, which throws
 *   `Cannot find control with name: …` at render time and nowhere else.
 */

const SPATIAL_UNITS = [
  { spatialUnitLevel: 'Stadtteile', spatialUnitId: 'su-1' },
  { spatialUnitLevel: 'Baublöcke', spatialUnitId: 'su-2' },
];

const CONVERTER = {
  name: 'CSV',
  type: 'csv',
  mimeTypes: ['text/csv', 'application/json'],
  encodings: ['UTF-8'],
  schemas: ['default', 'alternative'],
  parameters: [
    { name: 'delimiter', mandatory: true },
    { name: 'comment', mandatory: false },
  ],
};

const CONVERTER_WITHOUT_SCHEMAS = {
  name: 'GeoJSON',
  type: 'geojson',
  mimeTypes: ['application/json'],
  encodings: ['UTF-8'],
  parameters: [],
};

/** Shares `delimiter` with CONVERTER, but not `comment`. */
const CONVERTER_SHARING_A_PARAMETER = {
  name: 'CSV kompakt',
  type: 'csv-compact',
  mimeTypes: ['text/csv'],
  encodings: ['UTF-8'],
  parameters: [{ name: 'delimiter', mandatory: true }],
};

/** The template hides CRS parameters; a mandatory one must not reach the form. */
const CONVERTER_WITH_CRS = {
  name: 'OGC API - Features',
  type: 'ogc',
  mimeTypes: ['application/json'],
  encodings: ['UTF-8'],
  parameters: [{ name: 'CRS', mandatory: true }],
};

const FILE_DATASOURCE = { type: 'FILE', parameters: [] };

const HTTP_DATASOURCE = { type: 'HTTP', parameters: [{ name: 'url', mandatory: true }] };

describe('IndicatorEditFeaturesModalComponent', () => {
  let component: IndicatorEditFeaturesModalComponent;
  let fixture: ComponentFixture<IndicatorEditFeaturesModalComponent>;

  /**
   * The parameter dictionaries are FormRecords now; their controls are built
   * from the selected converter / data source, so create them before filling.
   */
  const setConverterParameters = (values: Record<string, string>): void => {
    const record = component.editForm.controls.converterParameters;
    Object.entries(values).forEach(([name, value]) => {
      record.addControl(name, new FormControl(value, { nonNullable: true }));
    });
  };
  const setDatasourceParameters = (values: Record<string, string>): void => {
    const record = component.editForm.controls.datasourceTypeParameters;
    Object.entries(values).forEach(([name, value]) => {
      record.addControl(name, new FormControl(value, { nonNullable: true }));
    });
  };
  let resourceImport: {
    buildConverterDefinition: jest.Mock;
    buildDatasourceTypeDefinition: jest.Mock;
  };
  /**
   * Converters and data source types come from the importer at runtime. The
   * lists must carry parameters, otherwise the rendered tests below prove
   * nothing — a parameterless converter and a FILE data source render no
   * parameter fields at all, which is exactly why the missing form groups went
   * unnoticed in day-to-day use.
   */
  let importerHelper: {
    availableConverters: any[];
    availableDatasourceTypes: any[];
    filterConverters: () => () => boolean;
    buildPropertyMapping_indicatorResource: jest.Mock;
    buildPutBody_indicators: jest.Mock;
  };

  beforeEach(() => {
    resourceImport = {
      buildConverterDefinition: jest.fn().mockReturnValue({ name: 'CSV', parameters: [] }),
      buildDatasourceTypeDefinition: jest.fn().mockResolvedValue({ type: 'FILE', parameters: [] }),
    };

    importerHelper = {
      availableConverters: [CONVERTER, CONVERTER_SHARING_A_PARAMETER, CONVERTER_WITH_CRS],
      availableDatasourceTypes: [HTTP_DATASOURCE, FILE_DATASOURCE],
      filterConverters: () => () => true,
      buildPropertyMapping_indicatorResource: jest.fn().mockReturnValue({ mapping: true }),
      buildPutBody_indicators: jest.fn().mockReturnValue({ putBody: true }),
    };

    TestBed.configureTestingModule({
      imports: [IndicatorEditFeaturesModalComponent, TranslateModule.forRoot()],
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
        {
          provide: IndicatorMetadataStoreService,
          useValue: { getIndicatorMetadataById: () => null },
        },
        { provide: CacheHelperServiceService, useValue: {} },
        {
          provide: AccessControlService,
          useValue: { accessControl: [], currentKeycloakLoginRoles: [] },
        },
        {
          provide: IndicatorValueService,
          useValue: { syntaxHighlightJSON: () => '', formatError: (e: any) => String(e) },
        },
        {
          provide: NotificationService,
          useValue: { showError: jest.fn(), showSuccess: jest.fn() },
        },
        {
          provide: FeatureTableDataGridHelperService,
          useValue: { buildFeatureTableGrid: jest.fn() },
        },
        // Must be an observable: setupEventListeners subscribes in ngOnInit.
        {
          provide: BroadcastService,
          useValue: {
            currentBroadcastMsg: new BehaviorSubject<any>({ msg: '' }),
            broadcast: jest.fn(),
          },
        },
        // Must be stubbed: the real service fires GETs from its constructor.
        { provide: KommonitorImporterHelperService, useValue: importerHelper },
        { provide: ResourceImportService, useValue: resourceImport },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(IndicatorEditFeaturesModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------

  describe('onChangeConverter', () => {
    it('seeds schema and mime type from the selected converter', () => {
      component.converter = CONVERTER;

      component.onChangeConverter();

      expect(component.schema).toBe('default');
      expect(component.mimeType).toBe('text/csv');
    });

    it('leaves the schema unset for a converter that declares none', () => {
      component.converter = CONVERTER_WITHOUT_SCHEMAS;

      component.onChangeConverter();

      expect(component.schema).toBeFalsy();
      expect(component.mimeType).toBe('application/json');
    });

    it('drops the parameter values of the previous converter', () => {
      component.converter = CONVERTER_WITHOUT_SCHEMAS;
      setConverterParameters({ delimiter: ';' });

      component.onChangeConverter();

      expect(component.converterParameterValues).toEqual({});
    });

    it('builds one control per parameter the template renders', () => {
      component.converter = CONVERTER;

      component.onChangeConverter();

      expect(Object.keys(component.editForm.controls.converterParameters.controls)).toEqual([
        'delimiter',
        'comment',
      ]);
    });

    it('skips the CRS parameters the template hides, so they cannot block the submit gate', () => {
      component.converter = { ...CONVERTER, parameters: [{ name: 'CRS', mandatory: true }] };

      component.onChangeConverter();

      expect(component.editForm.controls.converterParameters.controls['CRS']).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------

  describe('onChangeDatasourceType', () => {
    it('builds one control per parameter the template renders', () => {
      component.datasourceType = HTTP_DATASOURCE;

      component.onChangeDatasourceType();

      expect(Object.keys(component.editForm.controls.datasourceTypeParameters.controls)).toEqual([
        'url',
      ]);
    });

    it('leaves the record empty for a FILE data source, which renders no parameters', () => {
      component.datasourceType = HTTP_DATASOURCE;
      component.onChangeDatasourceType();

      component.datasourceType = FILE_DATASOURCE;
      component.onChangeDatasourceType();

      expect(component.editForm.controls.datasourceTypeParameters.controls).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------

  describe('parameter controls follow the selects', () => {
    /**
     * The selects carry no (change) handler; without the valueChanges wiring the
     * template renders `formControlName`s for controls that do not exist and
     * Angular throws `Cannot find control with name: …`.
     */
    it('rebuilds both records when the form values change', () => {
      component.ngOnInit();

      component.editForm.controls.converter.setValue(CONVERTER as any);
      component.editForm.controls.datasourceType.setValue(HTTP_DATASOURCE as any);

      expect(Object.keys(component.editForm.controls.converterParameters.controls)).toEqual([
        'delimiter',
        'comment',
      ]);
      expect(Object.keys(component.editForm.controls.datasourceTypeParameters.controls)).toEqual([
        'url',
      ]);
    });
  });

  // ---------------------------------------------------------------------------

  describe('buildConverterDefinition', () => {
    it('hands the converter, schema, mime type and parameters to the import service', () => {
      component.converter = CONVERTER;
      component.schema = 'default';
      component.mimeType = 'text/csv';
      setConverterParameters({ delimiter: ';' });

      component.buildConverterDefinition();

      expect(resourceImport.buildConverterDefinition).toHaveBeenCalledWith({
        converter: CONVERTER,
        schema: 'default',
        mimeType: 'text/csv',
        converterParameterValues: { delimiter: ';' },
      });
    });
  });

  describe('buildDatasourceTypeDefinition', () => {
    it('hands the data source and its parameters to the import service', async () => {
      component.datasourceType = FILE_DATASOURCE;
      setDatasourceParameters({ path: '/tmp/x.csv' });

      await component.buildDatasourceTypeDefinition();

      expect(resourceImport.buildDatasourceTypeDefinition).toHaveBeenCalledWith(
        expect.objectContaining({
          datasourceType: FILE_DATASOURCE,
          datasourceTypeFormValues: { path: '/tmp/x.csv' },
          selectedFile: null,
        })
      );
    });
  });

  describe('buildPropertyMappingDefinition', () => {
    it('passes the reference key, the timeseries mapping and the keep flag', () => {
      component.spatialUnitRefKeyProperty = 'ags';
      component.timeseriesMappingReference = [
        { indicatorValueProperty: 'DATE_2026', timestamp: '2026-01-01' },
      ];
      component.keepMissingValues = false;

      component.buildPropertyMappingDefinition();

      const helper = TestBed.inject(KommonitorImporterHelperService) as any;
      expect(helper.buildPropertyMapping_indicatorResource).toHaveBeenCalledWith(
        'ags',
        [{ indicatorValueProperty: 'DATE_2026', timestamp: '2026-01-01' }],
        false
      );
    });

    it('blocks the submit while the timeseries mapping is empty', () => {
      // Behaviour change: an empty mapping used to be sent as `timeseriesMappings: []`,
      // which made the importer accept the request and import nothing. The historic
      // AngularJS gate required a non-empty mapping; the required validator restores it.
      component.spatialUnitRefKeyProperty = 'ags';
      component.timeseriesMappingReference = [];

      expect(
        component.editForm.controls.timeseriesMappings.hasError('timeseriesMappingRequired')
      ).toBe(true);
      expect(component.editForm.invalid).toBe(true);
    });

    it('coerces a missing timeseries mapping to an empty list', () => {
      component.spatialUnitRefKeyProperty = 'ags';
      component.timeseriesMappingReference = undefined as never;

      component.buildPropertyMappingDefinition();

      const helper = TestBed.inject(KommonitorImporterHelperService) as any;
      expect(helper.buildPropertyMapping_indicatorResource).toHaveBeenCalledWith('ags', [], true);
    });
  });

  // ---------------------------------------------------------------------------

  describe('resetIndicatorEditFeaturesForm', () => {
    it('restores the non-empty defaults instead of nulling them', () => {
      component.keepMissingValues = false;
      component.isPublic = true;
      component.enableDeleteFeatures = true;

      component.resetIndicatorEditFeaturesForm();

      expect(component.keepMissingValues).toBe(true);
      expect(component.isPublic).toBe(false);
      expect(component.enableDeleteFeatures).toBe(false);
    });

    it('clears the importer selection', () => {
      component.converter = CONVERTER;
      component.schema = 'default';
      component.mimeType = 'text/csv';
      component.datasourceType = FILE_DATASOURCE;
      setConverterParameters({ delimiter: ';' });
      setDatasourceParameters({ path: '/tmp/x.csv' });
      component.spatialUnitRefKeyProperty = 'ags';

      component.resetIndicatorEditFeaturesForm();

      expect(component.converter).toBeFalsy();
      expect(component.schema).toBeFalsy();
      expect(component.mimeType).toBeFalsy();
      expect(component.datasourceType).toBeFalsy();
      expect(component.converterParameterValues).toEqual({});
      expect(component.datasourceTypeParameterValues).toEqual({});
      expect(component.spatialUnitRefKeyProperty).toBe('');
    });

    it('selects null rather than undefined so the placeholder option shows', () => {
      component.resetIndicatorEditFeaturesForm();

      expect(component.targetSpatialUnitMetadata).toBeNull();
    });

    it('preselects the first applicable spatial unit for the overview table', () => {
      component.currentIndicatorDataset = {
        applicableSpatialUnits: [{ spatialUnitName: 'Baublöcke' }],
      };

      component.resetIndicatorEditFeaturesForm();

      expect(component.overviewTableTargetSpatialUnitMetadata).toBe(SPATIAL_UNITS[1]);
    });

    it('leaves the overview selection empty without an applicable spatial unit', () => {
      component.currentIndicatorDataset = { applicableSpatialUnits: [] };

      component.resetIndicatorEditFeaturesForm();

      expect(component.overviewTableTargetSpatialUnitMetadata).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------

  /**
   * The rendered tier — see the file header. Everything here goes through the
   * real widgets: picking a converter means dispatching a `change` on its
   * `<select>`, filling a parameter means dispatching an `input` on its field.
   * That is what proves the chain end to end: select → form control →
   * `syncParameterControls` → rendered `formControlName` → control lookup.
   */
  describe('rendered data step', () => {
    /**
     * Both steps sit behind `@if (stepper.isActive(…))`, so moving to the data
     * step (1-based index 2) before the first change detection keeps the
     * overview step's AG Grid out of the DOM. The first `detectChanges()` also
     * runs `ngOnInit`, which resets the form and wires the selects.
     */
    const renderDataStep = (): void => {
      component.stepper.goTo(2);
      fixture.detectChanges();
    };

    const query = <T extends HTMLElement>(selector: string): T | null =>
      fixture.nativeElement.querySelector(selector);

    /** Parameter fields carry no `formcontrolname` attribute — the binding is
     * dynamic — but their placeholder is the parameter name. */
    const parameterField = (name: string): HTMLElement | null => query(`[placeholder="${name}"]`);

    const chooseOption = (selector: string, label: string): void => {
      const select = query<HTMLSelectElement>(selector);
      if (!select) {
        throw new Error(`no <select> for "${selector}"`);
      }
      const option = Array.from(select.options).find((o) => o.textContent?.trim() === label);
      if (!option) {
        throw new Error(`no option "${label}" in "${selector}"`);
      }
      select.value = option.value;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };

    const typeInto = (selector: string, value: string): void => {
      const field = query<HTMLInputElement>(selector);
      if (!field) {
        throw new Error(`no field for "${selector}"`);
      }
      field.value = value;
      field.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    const chooseConverter = (label: string): void =>
      chooseOption('select[formcontrolname="converter"]', label);
    const chooseDatasourceType = (label: string): void =>
      chooseOption('select[formcontrolname="datasourceType"]', label);

    it('keeps the AG Grid feature table out of the DOM', () => {
      renderDataStep();

      // Guards the assumption this whole tier rests on: if the overview step
      // ever renders here, these tests get slow and brittle instead of failing.
      expect(query('ag-grid-angular')).toBeNull();
    });

    it('renders a field per converter parameter', () => {
      renderDataStep();

      // Without `formGroupName="converterParameters"` around the loop this
      // throws `Cannot find control with name: delimiter`.
      expect(() => chooseConverter('CSV')).not.toThrow();
      expect(parameterField('delimiter')).not.toBeNull();
      expect(parameterField('comment')).not.toBeNull();
    });

    it('writes what is typed into a parameter field to its control', () => {
      renderDataStep();
      chooseConverter('CSV');

      typeInto('[placeholder="delimiter"]', ';');

      expect(component.editForm.controls.converterParameters.controls['delimiter'].value).toBe(';');
    });

    it('swaps the fields on a converter switch and keeps the shared value', () => {
      renderDataStep();
      chooseConverter('CSV');
      typeInto('[placeholder="delimiter"]', ';');

      chooseConverter('CSV kompakt');

      expect(parameterField('delimiter')).not.toBeNull();
      expect(parameterField('comment')).toBeNull();
      expect(component.editForm.controls.converterParameters.controls['delimiter'].value).toBe(';');
      expect(component.converterParameterValues).toEqual({ delimiter: ';' });
    });

    it('renders no field and builds no control for a hidden CRS parameter', () => {
      renderDataStep();

      chooseConverter('OGC API - Features');

      expect(parameterField('CRS')).toBeNull();
      expect(component.editForm.controls.converterParameters.controls['CRS']).toBeUndefined();
      // A hidden mandatory control would keep the form invalid for good.
      expect(component.editForm.controls.converterParameters.valid).toBe(true);
    });

    it('renders a field per data source parameter', () => {
      renderDataStep();
      chooseConverter('CSV');

      expect(() => chooseDatasourceType('HTTP')).not.toThrow();
      expect(parameterField('url')).not.toBeNull();
    });

    it('drops the data source fields when switching to a FILE upload', () => {
      renderDataStep();
      chooseConverter('CSV');
      chooseDatasourceType('HTTP');

      chooseDatasourceType('FILE');

      expect(parameterField('url')).toBeNull();
      expect(component.editForm.controls.datasourceTypeParameters.controls).toEqual({});
      expect(query('input[type="file"]')).not.toBeNull();
    });
  });
});
