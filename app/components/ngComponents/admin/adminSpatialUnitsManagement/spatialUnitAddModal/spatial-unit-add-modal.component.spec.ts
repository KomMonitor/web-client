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

import { patchPeriodOfValidityForm } from '../../adminShared/periodOfValidityForm/period-of-validity-form.model';
import { SpatialUnitAddModalComponent } from './spatial-unit-add-modal.component';
import { RoleManagementGridComponent } from '../../adminShared/roleManagementPanel/role-management-grid.component';

/**
 * Safety net for the POST-body builder and the three hand-written validation
 * flags, ahead of the planned typing / Reactive-Forms rework.
 *
 * Two tiers, like the three edit-features modals:
 *
 * - The blocks below drive the component directly and never render: ngOnInit
 *   would fire the importer fetch and the access-control bootstrap, and the
 *   builder and validators need neither.
 * - `describe('rendered data step')` renders — the only tier that catches a
 *   `formControlName` without a control (`Cannot find control with name: …`).
 *   It runs the modal with Keycloak off, which drops the whole security
 *   fieldset from the template and with it the role grid's AG Grid; the other
 *   steps sit behind `@if (stepper.isActive(…))` and stay unrendered.
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

/**
 * Importer resources for the rendered tier. They must carry parameters,
 * otherwise the rendered tests prove nothing — a parameterless converter and a
 * FILE data source render no parameter fields at all.
 */
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

  /**
   * Builds a fixture with the standard stub set. `env` overrides the
   * EnvConfigService stub, so a test can run the modal with Keycloak off.
   */
  function createFixture(
    env: Record<string, unknown> = {}
  ): ComponentFixture<SpatialUnitAddModalComponent> {
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
          useValue: { enableKeycloakSecurity: true, updateIntervalOptions: [], ...env },
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
            getAvailableConverters: () => [CSV_CONVERTER, CSV_CONVERTER_COMPACT],
            getAvailableDatasourceTypes: () => [HTTP_DATASOURCE, OGC_DATASOURCE, FILE_DATASOURCE],
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

    const created = TestBed.createComponent(SpatialUnitAddModalComponent);
    created.componentInstance.availableSpatialUnits = SPATIAL_UNITS;
    return created;
  }

  // The component no longer mirrors its controls in plain accessors, so the
  // tests write and read the typed form directly. `on` defaults to `component`
  // so the Keycloak-off fixture can be driven through the same helpers.
  const metadataGroup = (on = component) => on.addForm.controls.metadata;
  const importerGroup = (on = component) => on.addForm.controls.data.controls.importer;
  const securityGroup = (on = component) => on.addForm.controls.security;
  const periodGroup = (on = component) => on.addForm.controls.data.controls.periodOfValidity;
  const setPeriod = (value: { startDate: unknown; endDate: unknown }, on = component) =>
    patchPeriodOfValidityForm(periodGroup(on), value as never);

  beforeEach(() => {
    fixture = createFixture();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // buildPostBody_spatialUnits
  // ---------------------------------------------------------------------------

  describe('buildPostBody_spatialUnits', () => {
    beforeEach(() => {
      metadataGroup().controls.spatialUnitLevel.setValue('Quartiere');
      setPeriod({ startDate: '2026-01-01', endDate: '2026-12-31' });
      securityGroup().patchValue({ ownerOrganization: 'org-1', isPublic: true });
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
      metadataGroup().patchValue({
        nextLowerHierarchySpatialUnit: SPATIAL_UNITS[2],
        nextUpperHierarchySpatialUnit: SPATIAL_UNITS[0],
      });

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
      setPeriod({ startDate: '', endDate: '' });

      const body = component.buildPostBody_spatialUnits();

      expect(body.periodOfValidity.startDate).toBeNull();
      expect(body.periodOfValidity.endDate).toBeNull();
    });

    it('emits the outline fields even when the outline layer is off', () => {
      metadataGroup().patchValue({ isOutlineLayer: false, outlineWidth: 5 });
      component.outlineColor = '#123456';

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
      metadataGroup().controls.spatialUnitLevel.setValue('Stadtteile');

      component.checkSpatialUnitName();

      expect(component.spatialUnitLevelInvalid).toBe(true);
    });

    it('accepts a new level name', () => {
      metadataGroup().controls.spatialUnitLevel.setValue('Quartiere');

      component.checkSpatialUnitName();

      expect(component.spatialUnitLevelInvalid).toBe(false);
    });

    it('accepts an empty name (the submit button gates on that separately)', () => {
      metadataGroup().controls.spatialUnitLevel.setValue('');

      component.checkSpatialUnitName();

      expect(component.spatialUnitLevelInvalid).toBe(false);
    });

    it('clears a previous verdict on re-check', () => {
      metadataGroup().controls.spatialUnitLevel.setValue('Stadtteile');
      component.checkSpatialUnitName();

      metadataGroup().controls.spatialUnitLevel.setValue('Quartiere');
      component.checkSpatialUnitName();

      expect(component.spatialUnitLevelInvalid).toBe(false);
    });
  });

  describe('checkSpatialUnitHierarchy', () => {
    it('accepts a lower level that is finer than the upper one', () => {
      metadataGroup().patchValue({
        nextLowerHierarchySpatialUnit: SPATIAL_UNITS[2], // Baublöcke (index 2)
        nextUpperHierarchySpatialUnit: SPATIAL_UNITS[0], // Stadt (index 0)
      });

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(false);
    });

    it('rejects a lower level that is coarser than the upper one', () => {
      metadataGroup().patchValue({
        nextLowerHierarchySpatialUnit: SPATIAL_UNITS[0],
        nextUpperHierarchySpatialUnit: SPATIAL_UNITS[2],
      });

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(true);
    });

    it('rejects the same level on both ends', () => {
      metadataGroup().patchValue({
        nextLowerHierarchySpatialUnit: SPATIAL_UNITS[1],
        nextUpperHierarchySpatialUnit: SPATIAL_UNITS[1],
      });

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(true);
    });

    it('stays valid while only one end is selected', () => {
      metadataGroup().patchValue({
        nextLowerHierarchySpatialUnit: SPATIAL_UNITS[0],
        nextUpperHierarchySpatialUnit: null,
      });

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(false);
    });

    it('stays valid when a selected level is unknown to the store', () => {
      metadataGroup().patchValue({
        nextLowerHierarchySpatialUnit: { spatialUnitLevel: 'Fremd' } as any,
        nextUpperHierarchySpatialUnit: { spatialUnitLevel: 'Auch fremd' } as any,
      });

      component.checkSpatialUnitHierarchy();

      expect(component.hierarchyInvalid).toBe(false);
    });
  });

  describe('checkPeriodOfValidity', () => {
    it('accepts a start before the end', () => {
      setPeriod({ startDate: '2026-01-01', endDate: '2026-12-31' });

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });

    it('rejects an end that is not after the start', () => {
      setPeriod({ startDate: '2026-12-31', endDate: '2026-01-01' });

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(true);
    });

    it('accepts an open-ended period', () => {
      setPeriod({ startDate: '2026-01-01', endDate: '' });

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });

    it('accepts NgbDateStruct values from the datepicker', () => {
      setPeriod({
        startDate: { year: 2026, month: 1, day: 1 },
        endDate: { year: 2026, month: 12, day: 31 },
      });

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });
  });
  // ---------------------------------------------------------------------------

  describe('resetForm', () => {
    it('restores the non-empty defaults instead of nulling them', () => {
      metadataGroup().patchValue({ isOutlineLayer: true, outlineWidth: 5 });
      component.outlineColor = '#ffffff';
      importerGroup().patchValue({ keepAttributes: false, keepMissingValues: false });
      securityGroup().controls.isPublic.setValue(true);

      component.resetForm();

      expect(metadataGroup().controls.isOutlineLayer.value).toBe(false);
      expect(component.outlineColor).toBe('#000000');
      expect(metadataGroup().controls.outlineWidth.value).toBe(3);
      expect(importerGroup().controls.keepAttributes.value).toBe(true);
      expect(importerGroup().controls.keepMissingValues.value).toBe(true);
      expect(securityGroup().controls.isPublic.value).toBe(false);
    });

    it('clears the entered values and the wizard step', () => {
      metadataGroup().patchValue({
        spatialUnitLevel: 'Quartiere',
        nextLowerHierarchySpatialUnit: SPATIAL_UNITS[2],
      });
      setPeriod({ startDate: '2026-01-01', endDate: '2026-12-31' });
      importerGroup().controls.idProperty.setValue('id');
      securityGroup().controls.ownerOrganization.setValue('org-1');
      component.stepper.next();

      component.resetForm();

      expect(metadataGroup().controls.spatialUnitLevel.value).toBe('');
      expect(metadataGroup().controls.nextLowerHierarchySpatialUnit.value).toBeNull();
      expect(periodGroup().getRawValue()).toEqual({ startDate: '', endDate: '' });
      expect(importerGroup().controls.idProperty.value).toBe('');
      expect(securityGroup().controls.ownerOrganization.value).toBe('');
      expect(component.stepper.currentStep).toBe(1);
      expect(component.attributeMappings_adminView).toEqual([]);
    });

    it('resets the shared metadata block', () => {
      component.metadataForm.patchValue({ description: 'Beschreibung', sridEPSG: 25832 });

      component.resetForm();

      expect(component.metadata.description).toBe('');
      expect(component.metadata.sridEPSG).toBe(4326);
    });
  });
  // ---------------------------------------------------------------------------

  describe('submit gate', () => {
    /** Fills everything the POST body requires. */
    const fillRequired = (on = component) => {
      metadataGroup(on).controls.spatialUnitLevel.setValue('Quartiere');
      on.metadataForm.patchValue({
        description: 'Beschreibung',
        datasource: 'Quelle',
        contact: 'Kontakt',
        lastUpdate: '2026-01-01',
        updateInterval: { apiName: 'YEARLY', displayName: 'jährlich' },
      });
      setPeriod({ startDate: '2026-01-01', endDate: '' }, on);
      importerGroup(on).patchValue({
        idProperty: 'id',
        nameProperty: 'name',
        converter: { name: 'GeoJSON', mimeTypes: [], encodings: [], type: 'geojson' },
        datasourceType: { type: 'FILE', parameters: [] },
      });
    };

    it('stays closed while required fields are missing', () => {
      expect(component.addForm.invalid).toBe(true);
    });

    it('opens once every required field including the owner is filled', () => {
      fillRequired();
      expect(component.addForm.invalid).toBe(true); // owner still missing

      securityGroup().controls.ownerOrganization.setValue('org-1');

      expect(component.addForm.valid).toBe(true);
    });

    it('does not demand an owner when Keycloak is disabled', () => {
      // Guards the historic bug: the `!ownerOrganization` clause of the submit
      // gate was unconditional although the field only exists with Keycloak on.
      TestBed.resetTestingModule();
      const plainFixture = createFixture({ enableKeycloakSecurity: false });
      const plain = plainFixture.componentInstance;

      fillRequired(plain);

      expect(securityGroup(plain).controls.ownerOrganization.value).toBe('');
      expect(plain.addForm.valid).toBe(true);
    });
  });
  // ---------------------------------------------------------------------------

  describe('importer form wiring', () => {
    const CONVERTER = {
      name: 'GeoJSON',
      type: 'geojson',
      mimeTypes: ['application/json', 'text/csv'],
      encodings: ['UTF-8'],
      schemas: ['default'],
      parameters: [
        { name: 'delimiter', mandatory: true },
        { name: 'comment', mandatory: false },
      ],
    };

    beforeEach(() => {
      // The subscriptions live in ngOnInit; the fixture is never rendered, so
      // the hook is invoked directly (its async loads are stubbed out).
      component.ngOnInit();
    });

    it('seeds schema and mime type when a converter is picked', () => {
      component.importerForm.controls.converter.setValue(CONVERTER as never);

      expect(importerGroup().controls.schema.value).toBe('default');
      expect(importerGroup().controls.mimeType.value).toBe('application/json');
    });

    it('creates one control per converter parameter, required where mandatory', () => {
      component.importerForm.controls.converter.setValue(CONVERTER as never);

      const record = component.importerForm.controls.converterParameters;
      expect(Object.keys(record.controls)).toEqual(['delimiter', 'comment']);
      expect(record.controls['delimiter'].hasError('required')).toBe(true);
    });

    it('clears the bbox and property names when the data source type changes', () => {
      importerGroup().patchValue({
        idProperty: 'id',
        bboxType: 'ref',
        bboxRefSpatialUnitId: 'su-42',
      });

      component.importerForm.controls.datasourceType.setValue({
        type: 'FILE',
        parameters: [],
      } as never);

      expect(importerGroup().controls.idProperty.value).toBe('');
      expect(importerGroup().controls.bboxType.value).toBe('');
      expect(importerGroup().controls.bboxRefSpatialUnitId.value).toBe('');
    });

    it('rebuilds the data-source parameter controls, skipping the synthetic bbox ones', () => {
      component.importerForm.controls.datasourceType.setValue({
        type: 'OGCAPI_FEATURES',
        parameters: [
          { name: 'url', mandatory: true },
          { name: 'bbox', mandatory: false },
          { name: 'bboxType', mandatory: false },
        ],
      } as never);

      expect(
        Object.keys(component.importerForm.controls.datasourceTypeParameters.controls)
      ).toEqual(['url']);
    });
  });

  // ---------------------------------------------------------------------------

  /**
   * The rendered tier — see the file header. Everything goes through the real
   * widgets: picking a converter, data source or spatial filter dispatches a
   * `change` on its `<select>`, filling a field dispatches an `input`.
   */
  describe('rendered data step', () => {
    let rendered: SpatialUnitAddModalComponent;
    let renderedFixture: ComponentFixture<SpatialUnitAddModalComponent>;

    beforeEach(async () => {
      // Keycloak off: the security fieldset — and with it the role grid — is
      // behind `@if (envConfigService.enableKeycloakSecurity)`, so this keeps
      // AG Grid out of the DOM without stubbing anything.
      TestBed.resetTestingModule();
      renderedFixture = createFixture({ enableKeycloakSecurity: false });
      rendered = renderedFixture.componentInstance;

      // Steps without security: metadata, general, data. The first two are
      // behind `@if (stepper.isActive(…))` and stay unrendered.
      rendered.stepper.goTo(3);
      renderedFixture.detectChanges();
      // loadInitialData awaits the importer resources before the data source
      // types reach the select.
      await renderedFixture.whenStable();
      renderedFixture.detectChanges();
    });

    const query = <T extends HTMLElement>(selector: string): T | null =>
      renderedFixture.nativeElement.querySelector(selector);

    /** Parameter fields carry no `formcontrolname` attribute — the binding is
     * dynamic — but their placeholder is the parameter name. */
    const parameterField = (name: string): HTMLElement | null => query(`[placeholder="${name}"]`);

    /** `formGroupName` is static markup, so it survives into the DOM. */
    const bboxField = (corner: string): HTMLInputElement | null =>
      query(`[formgroupname="bbox"] [formcontrolname="${corner}"]`);

    const dispatchOn = (select: HTMLSelectElement, value: string): void => {
      select.value = value;
      select.dispatchEvent(new Event('change'));
      renderedFixture.detectChanges();
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
      renderedFixture.detectChanges();
    };

    const chooseConverter = (label: string): void =>
      chooseOption('select[formcontrolname="converter"]', label);
    const chooseDatasourceType = (label: string): void =>
      chooseOption('select[formcontrolname="datasourceType"]', label);

    it('keeps the role grid out of the DOM', () => {
      // Guards the assumption this whole tier rests on.
      expect(query('ag-grid-angular')).toBeNull();
      expect(query('app-role-management-grid')).toBeNull();
    });

    it('renders a field per converter parameter', () => {
      // Without `formGroupName="converterParameters"` around the loop this
      // throws `Cannot find control with name: delimiter`.
      expect(() => chooseConverter('CSV')).not.toThrow();
      expect(parameterField('delimiter')).not.toBeNull();
      expect(parameterField('comment')).not.toBeNull();
    });

    it('writes what is typed into a parameter field to its control', () => {
      chooseConverter('CSV');

      typeInto(parameterField('delimiter'), ';');

      expect(rendered.importerForm.controls.converterParameters.controls['delimiter'].value).toBe(
        ';'
      );
    });

    it('swaps the fields on a converter switch and keeps the shared value', () => {
      chooseConverter('CSV');
      typeInto(parameterField('delimiter'), ';');

      chooseConverter('CSV kompakt');

      expect(parameterField('delimiter')).not.toBeNull();
      expect(parameterField('comment')).toBeNull();
      expect(rendered.importerForm.controls.converterParameters.getRawValue()).toEqual({
        delimiter: ';',
      });
    });

    it('renders a field per data source parameter', () => {
      chooseConverter('CSV');

      expect(() => chooseDatasourceType('HTTP')).not.toThrow();
      expect(parameterField('url')).not.toBeNull();
    });

    it('never renders the synthetic bbox parameters as plain fields', () => {
      chooseConverter('CSV');

      chooseDatasourceType('OGCAPI_FEATURES');

      // They have no control in the record — the bbox block renders them.
      expect(parameterField('bbox')).toBeNull();
      expect(parameterField('bboxType')).toBeNull();
      expect(parameterField('url')).not.toBeNull();
    });

    it('renders the manual bounding box inside its form group', () => {
      chooseConverter('CSV');
      chooseDatasourceType('OGCAPI_FEATURES');

      // Without `formGroupName="bbox"` this throws
      // `Cannot find control with name: minx`.
      expect(() => chooseValue('select[formcontrolname="bboxType"]', 'literal')).not.toThrow();
      expect(bboxField('minx')).not.toBeNull();
      expect(bboxField('maxy')).not.toBeNull();

      typeInto(bboxField('minx'), '7');

      // A number input hands the accessor a number, not the declared string.
      expect(`${rendered.importerForm.controls.bbox.controls.minx.value}`).toBe('7');
    });

    it('offers the reference spatial units for the other filter mode', () => {
      chooseConverter('CSV');
      chooseDatasourceType('OGCAPI_FEATURES');

      chooseValue('select[formcontrolname="bboxType"]', 'ref');
      chooseOption('select[formcontrolname="bboxRefSpatialUnitId"]', 'Stadtteile');

      expect(bboxField('minx')).toBeNull();
      expect(rendered.importerForm.controls.bboxRefSpatialUnitId.value).toBe('su-district');
    });

    it('drops the bounding box entries when switching to a FILE upload', () => {
      chooseConverter('CSV');
      chooseDatasourceType('OGCAPI_FEATURES');
      chooseValue('select[formcontrolname="bboxType"]', 'literal');
      typeInto(bboxField('minx'), '7');

      chooseDatasourceType('FILE');

      expect(bboxField('minx')).toBeNull();
      expect(rendered.importerForm.controls.bbox.controls.minx.value).toBeFalsy();
      expect(query('input[type="file"]')).not.toBeNull();
    });
  });
});
