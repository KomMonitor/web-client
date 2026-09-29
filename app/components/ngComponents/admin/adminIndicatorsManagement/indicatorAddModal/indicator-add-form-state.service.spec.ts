import { effect } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { TopicHierarchyService } from 'services/topic-hierarchy-service/topic-hierarchy.service';
import { IndicatorPOSTInputType } from 'models/data-management-api';

import { IndicatorAddFormStateService } from './indicator-add-form-state.service';
import { IndicatorClassificationStateService } from './indicator-classification-state.service';
import { RoleManagementGridComponent } from '../../adminShared/roleManagementPanel/role-management-grid.component';

/**
 * Safety net for the wizard's request-body builders, ahead of the planned typing /
 * Reactive-Forms rework of this service.
 *
 * Scope on purpose: the builders, the per-step submit gate and the edit-mode seeding — the
 * pure logic. Deliberately NOT re-tested here because they have their own specs:
 * the classification mapping (`indicator-classification-state.service.spec.ts`),
 * the metadata form model (`resource-metadata-form.model.spec.ts`), the role/owner
 * helpers (`role-management-panel.model.spec.ts`) and the step arithmetic
 * (`wizard-stepper.spec.ts`).
 *
 * Several assertions below pin behaviour that looks wrong. Those are marked BUG
 * and documented in `documentation/OFFENE_PUNKTE.md`; the tests
 * hold the CURRENT behaviour so the rework has a baseline, they are not a
 * statement that it is correct.
 */

/** Required properties of IndicatorPOSTInputType, straight from the OpenAPI spec. */
const POST_REQUIRED_FIELDS: (keyof IndicatorPOSTInputType)[] = [
  'permissions',
  'characteristicValue',
  'creationType',
  'datasetName',
  'defaultClassificationMapping',
  'interpretation',
  'isHeadlineIndicator',
  'metadata',
  'ownerId',
  'processDescription',
  'tags',
  'topicReference',
  'unit',
  'isPublic',
];

const SPATIAL_UNITS = [
  { spatialUnitId: 'su1', spatialUnitLevel: 'Stadtteile' },
  { spatialUnitId: 'su2', spatialUnitLevel: 'Bezirke' },
];

const UPDATE_INTERVAL_OPTIONS = [
  { displayName: 'jährlich', apiName: 'YEARLY' },
  { displayName: 'beliebig', apiName: 'ARBITRARY' },
];

const INDICATOR_TYPE_OPTIONS = [
  { displayName: 'Wert', apiName: 'VALUE' },
  { displayName: 'Status', apiName: 'STATUS' },
];

const CREATION_TYPE_OPTIONS = [
  { displayName: 'Berechnung', apiName: 'COMPUTATION' },
  { displayName: 'Insert', apiName: 'INSERTION' },
];

/** Access-control unit whose viewer/editor permissions seed the role grid. */
const OWNER_UNIT = {
  organizationalUnitId: 'org-1',
  name: 'Stadt',
  permissions: [
    { permissionId: 'p-view', permissionLevel: 'viewer' },
    { permissionId: 'p-edit', permissionLevel: 'editor' },
    { permissionId: 'p-create', permissionLevel: 'creator' },
  ],
};

/**
 * The role grid is a collaborator, not a dependency: the service only ever touches
 * `permissions`, `ownerId`, `reset()`, `getSelectedRoleIds()` and
 * `applyPermissions()`. A literal is therefore enough — no AG Grid, no fixture.
 */
function fakeRoleGrid(selected: string[] = []) {
  return {
    permissions: null as string[] | null,
    ownerId: null as string | null,
    reset: jest.fn(),
    applyPermissions: jest.fn(),
    getSelectedRoleIds: jest.fn(() => selected),
  };
}

describe('IndicatorAddFormStateService', () => {
  let service: IndicatorAddFormStateService;
  let fetchAccessControlMetadata: jest.Mock;

  beforeEach(() => {
    fetchAccessControlMetadata = jest.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        IndicatorAddFormStateService,
        // Real service: it only needs EnvConfigService.customColorSchemes and is
        // itself covered by indicator-classification-state.service.spec.ts.
        IndicatorClassificationStateService,
        // Real service: pure hierarchy resolution, no HTTP.
        TopicHierarchyService,
        {
          provide: EnvConfigService,
          useValue: {
            enableKeycloakSecurity: true,
            customColorSchemes: undefined,
            updateIntervalOptions: UPDATE_INTERVAL_OPTIONS,
            indicatorTypeOptions: INDICATOR_TYPE_OPTIONS,
            indicatorUnitOptions: ['Anzahl', 'Freitext'],
            indicatorCreationTypeOptions: CREATION_TYPE_OPTIONS,
          },
        },
        {
          provide: SpatialUnitMetadataStoreService,
          useValue: { availableSpatialUnits: SPATIAL_UNITS },
        },
        {
          provide: IndicatorMetadataStoreService,
          useValue: {
            availableIndicators: [{ indicatorId: 'ind-1', indicatorName: 'Bevölkerung' }],
            getIndicatorMetadataById: (id: string) =>
              id === 'ind-1' ? { indicatorId: 'ind-1', indicatorName: 'Bevölkerung' } : undefined,
          },
        },
        {
          provide: GeoresourceMetadataStoreService,
          useValue: {
            availableGeoresources: [{ georesourceId: 'geo-1', datasetName: 'Schulen' }],
            getGeoresourceMetadataById: (id: string) =>
              id === 'geo-1' ? { georesourceId: 'geo-1', datasetName: 'Schulen' } : undefined,
          },
        },
        { provide: TopicMetadataStoreService, useValue: { availableTopics: [] } },
        {
          provide: AccessControlService,
          useValue: {
            accessControl: [OWNER_UNIT],
            currentKeycloakLoginRoles: [],
            currentKomMonitorLoginRoleNames: [],
            checkAdminPermission: () => true,
            getAccessControlById: (id: string) => (id === 'org-1' ? OWNER_UNIT : undefined),
          },
        },
        { provide: MetadataBootstrapService, useValue: { fetchAccessControlMetadata } },
      ],
    });

    service = TestBed.inject(IndicatorAddFormStateService);
  });

  /** Fills every field the POST body marks as required. */
  function fillRequiredFields(): void {
    service.datasetName = 'Neuer Indikator';
    service.indicatorUnit = 'Anzahl';
    service.indicatorInterpretation = 'Mehr ist besser';
    service.indicatorProcessDescription = 'Wird jährlich fortgeschrieben';
    service.indicatorCreationType = CREATION_TYPE_OPTIONS[0];
    service.indicatorTopic_mainTopic = { topicId: 'topic-1' };
    service.ownerOrganization = OWNER_UNIT;
    service.metadataForm.patchValue({
      description: 'Beschreibung',
      datasource: 'Quelle',
      contact: 'Kontakt',
      updateInterval: UPDATE_INTERVAL_OPTIONS[0],
      lastUpdate: '2026-01-01',
    });
    service.classification.init(SPATIAL_UNITS);
    service.classification.onColorSchemeSelected('Blues');
    service.classification.onNumClassesChanged(5);
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // buildPostBody_indicators_v3 — the add flow
  // ---------------------------------------------------------------------------

  describe('buildPostBody_indicators_v3', () => {
    it('emits every field IndicatorPOSTInputType marks as required', () => {
      fillRequiredFields();

      const body = service.buildPostBody_indicators_v3();

      for (const field of POST_REQUIRED_FIELDS) {
        expect(Object.prototype.hasOwnProperty.call(body, field)).toBe(true);
      }
    });

    it('resolves topicReference from the deepest selected hierarchy level', () => {
      service.indicatorTopic_mainTopic = { topicId: 'main' };
      expect(service.buildPostBody_indicators_v3().topicReference).toBe('main');

      service.indicatorTopic_subTopic = { topicId: 'sub' };
      expect(service.buildPostBody_indicators_v3().topicReference).toBe('sub');

      service.indicatorTopic_subsubTopic = { topicId: 'subsub' };
      expect(service.buildPostBody_indicators_v3().topicReference).toBe('subsub');

      service.indicatorTopic_subsubsubTopic = { topicId: 'subsubsub' };
      expect(service.buildPostBody_indicators_v3().topicReference).toBe('subsubsub');
    });

    it('falls back to an empty topicReference when no topic is selected', () => {
      expect(service.buildPostBody_indicators_v3().topicReference).toBe('');
    });

    it('always emits tags as an array and trims the entries', () => {
      expect(service.buildPostBody_indicators_v3().tags).toEqual([]);

      service.indicatorTagsString_withCommas = 'Bildung, Soziales ,Umwelt';

      expect(service.buildPostBody_indicators_v3().tags).toEqual(['Bildung', 'Soziales', 'Umwelt']);
    });

    it('reduces the owner object to its id, but passes a bare id through', () => {
      service.ownerOrganization = OWNER_UNIT;
      expect(service.buildPostBody_indicators_v3().ownerId).toBe('org-1');

      service.ownerOrganization = 'org-raw';
      expect(service.buildPostBody_indicators_v3().ownerId).toBe('org-raw');
    });

    it('coerces isPublic to a real boolean', () => {
      service.isPublic = undefined as any;
      expect(service.buildPostBody_indicators_v3().isPublic).toBe(false);

      service.isPublic = true;
      expect(service.buildPostBody_indicators_v3().isPublic).toBe(true);
    });

    it('maps optional metadata fields to null and defaults the SRID to 4326', () => {
      service.metadataForm.patchValue({
        description: 'Beschreibung',
        datasource: 'Quelle',
        contact: 'Kontakt',
        updateInterval: UPDATE_INTERVAL_OPTIONS[1],
        note: '',
        literature: '',
        databasis: '',
        sridEPSG: 0 as any,
      });

      const metadata = service.buildPostBody_indicators_v3().metadata;

      expect(metadata.updateInterval).toBe('ARBITRARY');
      expect(metadata.note).toBeNull();
      expect(metadata.literature).toBeNull();
      expect(metadata.databasis).toBeNull();
      expect(metadata.sridEPSG).toBe(4326);
    });

    it('takes permissions from the attached role grid', () => {
      const grid = fakeRoleGrid(['p-view', 'p-edit']);
      service.attachRoleGrid(grid as unknown as RoleManagementGridComponent);

      expect(service.buildPostBody_indicators_v3().permissions).toEqual(['p-view', 'p-edit']);
    });

    it('emits references in the API shape from the admin-view lists', () => {
      service.indicatorReferences_adminView = [
        { indicatorMetadata: { indicatorId: 'ind-1' }, referenceDescription: 'Basis' },
      ];
      service.georesourceReferences_adminView = [
        { georesourceMetadata: { georesourceId: 'geo-1' }, referenceDescription: 'Standorte' },
      ];

      const body = service.buildPostBody_indicators_v3();

      // NOTE: the API spells these "refrences" — matching the backend, not a typo here.
      expect(body.refrencesToOtherIndicators).toEqual([
        { indicatorId: 'ind-1', referenceDescription: 'Basis' },
      ]);
      expect(body.refrencesToGeoresources).toEqual([
        { georesourceId: 'geo-1', referenceDescription: 'Standorte' },
      ]);
    });

    it('sends precision only when a custom value is enabled', () => {
      service.indicatorPrecision = 2;
      service.showCustomCommaValue = false;
      expect('precision' in service.buildPostBody_indicators_v3()).toBe(false);

      service.showCustomCommaValue = true;
      expect(service.buildPostBody_indicators_v3().precision).toBe(2);

      // 0 is a valid precision and must survive the null check
      service.indicatorPrecision = 0;
      expect(service.buildPostBody_indicators_v3().precision).toBe(0);

      service.indicatorPrecision = null;
      expect('precision' in service.buildPostBody_indicators_v3()).toBe(false);
    });

    it('delegates the classification mapping instead of rebuilding it', () => {
      const mapping = { classificationType: 'QUANTITATIVE' } as any;
      const build = jest
        .spyOn(service.classification, 'buildDefaultClassificationMapping')
        .mockReturnValue(mapping);

      expect(service.buildPostBody_indicators_v3().defaultClassificationMapping).toBe(mapping);
      expect(build).toHaveBeenCalled();
    });

    it('emits references that came in through a metadata import', async () => {
      // Was a documented bug: applyMetadataImport() pushed flat { indicatorId, ... }
      // rows while every consumer expects { indicatorMetadata, ... }, so the builder
      // dereferenced undefined — an import followed by "create" threw a TypeError.
      await service.parseMetadataFromFile(
        new File(
          [
            JSON.stringify({
              metadata: {},
              refrencesToOtherIndicators: [{ indicatorId: 'ind-1', referenceDescription: 'Basis' }],
              refrencesToGeoresources: [
                { georesourceId: 'geo-1', referenceDescription: 'Standorte' },
              ],
            }),
          ],
          'metadata.json'
        )
      );

      const body = service.buildPostBody_indicators_v3();

      expect(body.refrencesToOtherIndicators).toEqual([
        { indicatorId: 'ind-1', referenceDescription: 'Basis' },
      ]);
      expect(body.refrencesToGeoresources).toEqual([
        { georesourceId: 'geo-1', referenceDescription: 'Standorte' },
      ]);
    });
  });

  // ---------------------------------------------------------------------------
  // buildPatchBody_indicators_v3 — the edit flow
  // ---------------------------------------------------------------------------

  describe('buildPatchBody_indicators_v3', () => {
    it('omits ownership and permissions, which are managed via separate endpoints', () => {
      fillRequiredFields();
      service.attachRoleGrid(fakeRoleGrid(['p-view']) as unknown as RoleManagementGridComponent);

      const body = service.buildPatchBody_indicators_v3();

      expect('ownerId' in body).toBe(false);
      expect('isPublic' in body).toBe(false);
      expect('permissions' in body).toBe(false);
    });

    it('preserves characteristicValue and regionalReferenceValues from the source dataset', () => {
      service.editIndicatorDataset = {
        characteristicValue: 'Anteil',
        regionalReferenceValues: [{ referenceValue: 42 }],
      };

      const body = service.buildPatchBody_indicators_v3();

      expect(body.characteristicValue).toBe('Anteil');
      expect(body.regionalReferenceValues).toEqual([{ referenceValue: 42 }]);
    });

    it('falls back to null / [] without a source dataset', () => {
      const body = service.buildPatchBody_indicators_v3();

      expect(body.characteristicValue).toBeNull();
      expect(body.regionalReferenceValues).toEqual([]);
    });

    it('sends empty-string / false defaults in both bodies', () => {
      // Was: the POST body passed an `undefined` field through raw while the
      // PATCH body normalised it. The typed form makes that state
      // unrepresentable — the controls are `nonNullable` with a '' / false
      // default, so both bodies now agree.
      service.indicatorInterpretation = undefined as any;
      service.indicatorProcessDescription = undefined as any;
      service.isHeadlineIndicator = undefined as any;

      const patch = service.buildPatchBody_indicators_v3();
      const post = service.buildPostBody_indicators_v3();

      expect(patch.interpretation).toBe('');
      expect(patch.processDescription).toBe('');
      expect(patch.isHeadlineIndicator).toBe(false);
      expect(post.interpretation).toBe('');
      expect(post.processDescription).toBe('');
      expect(post.isHeadlineIndicator).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Per-step validity — the submit gate
  // ---------------------------------------------------------------------------

  describe('step validity', () => {
    it('reports every step with required fields on an empty form', () => {
      service.classification.init(SPATIAL_UNITS);
      service.classification.onClassificationMethodSelected('regional_default');

      expect(service.isStepInvalid('metadata')).toBe(true);
      expect(service.isStepInvalid('general')).toBe(true);
      expect(service.isStepInvalid('topics')).toBe(true);
      expect(service.isStepInvalid('classification')).toBe(true);
      expect(service.isStepInvalid('security')).toBe(true);
      expect(service.firstInvalidStepKey()).toBe('metadata');
    });

    it('reports nothing once every required field is filled', () => {
      fillRequiredFields();

      expect(service.firstInvalidStepKey()).toBeNull();
      expect(service.addForm.valid).toBe(true);
    });

    it('does not require booleans, tags, abbreviation or the process description', () => {
      fillRequiredFields();
      service.indicatorTagsString_withCommas = '';
      service.indicatorAbbreviation = '';
      service.indicatorProcessDescription = '';
      service.isHeadlineIndicator = false;
      service.isPublic = false;

      expect(service.firstInvalidStepKey()).toBeNull();
    });

    it.each([
      ['datasetName', 'metadata'],
      ['indicatorUnit', 'metadata'],
      ['indicatorInterpretation', 'metadata'],
      ['indicatorCreationType', 'metadata'],
    ] as const)('flags the %s control of the %s step when blank', (field, step) => {
      fillRequiredFields();
      service.addForm.controls.basic.controls[field].setValue(
        field === 'indicatorCreationType' ? null : ''
      );

      expect(service.firstInvalidStepKey()).toBe(step);
    });

    it('flags a name already taken by an indicator of the same type', () => {
      fillRequiredFields();
      service.indicatorType = INDICATOR_TYPE_OPTIONS[0];
      const store = TestBed.inject(IndicatorMetadataStoreService) as any;
      store.availableIndicators = [{ indicatorName: 'Neuer Indikator', indicatorType: 'VALUE' }];
      service.checkDatasetName();

      expect(service.addForm.controls.basic.controls.datasetName.hasError('uniqueName')).toBe(true);
      expect(service.firstInvalidStepKey()).toBe('metadata');
    });

    it.each(['description', 'datasource', 'contact', 'updateInterval', 'lastUpdate'] as const)(
      'flags the general step when %s is blank',
      (field) => {
        fillRequiredFields();
        service.metadataForm.controls[field].setValue(null as any);

        expect(service.firstInvalidStepKey()).toBe('general');
      }
    );

    it('flags the topics step without a main topic', () => {
      fillRequiredFields();
      service.indicatorTopic_mainTopic = null;

      expect(service.firstInvalidStepKey()).toBe('topics');
    });

    it('flags the classification step from the classification rules', () => {
      fillRequiredFields();
      service.classification.onClassificationMethodSelected('regional_default');

      expect(service.firstInvalidStepKey()).toBe('classification');
    });

    it('requires the owner when creating with Keycloak enabled', () => {
      fillRequiredFields();
      service.ownerOrganization = null;

      expect(service.firstInvalidStepKey()).toBe('security');
    });

    it('drops the owner requirement in edit mode', () => {
      fillRequiredFields();
      service.enterEditMode({ indicatorId: 'ind-9', indicatorName: 'Alt' });
      fillRequiredFields();
      service.ownerOrganization = null;

      expect(service.addForm.controls.security.controls.ownerOrganization.valid).toBe(true);
      expect(service.firstInvalidStepKey()).toBeNull();
    });

    it('drops the owner requirement without Keycloak', () => {
      (TestBed.inject(EnvConfigService) as any).enableKeycloakSecurity = false;
      const withoutKeycloak = TestBed.runInInjectionContext(
        () => new IndicatorAddFormStateService()
      );

      withoutKeycloak.ownerOrganization = null;

      expect(withoutKeycloak.addForm.controls.security.controls.ownerOrganization.valid).toBe(true);
      expect(withoutKeycloak.stepper.steps.map((step) => step.label)).not.toContain(
        'ADMIN_SHARED_UI.SECURITY.ACCESS_OWNERSHIP_TITLE'
      );
    });

    it('revealAllErrors touches every step group and reveals the classification', () => {
      service.revealAllErrors();

      expect(service.addForm.controls.basic.touched).toBe(true);
      expect(service.addForm.controls.general.touched).toBe(true);
      expect(service.addForm.controls.topics.touched).toBe(true);
      expect(service.addForm.controls.security.touched).toBe(true);
      expect(service.classification.revealed()).toBe(true);
    });

    it('marks a step in the stepper only once it was left', () => {
      service.classification.init(SPATIAL_UNITS);
      const invalidFlags = () => service.stepper.steps.map((step) => step.invalid);

      expect(invalidFlags().every((flag) => !flag)).toBe(true);

      service.stepper.next(); // leaves step 1 (metadata)

      expect(invalidFlags()[0]).toBe(true);
      expect(invalidFlags()[1]).toBe(false);
    });

    it('resetForm clears the markings of a previous submit attempt', () => {
      fillRequiredFields();
      service.revealAllErrors();
      service.addForm.controls.basic.controls.datasetName.markAsDirty();

      service.resetForm();

      expect(service.addForm.controls.basic.touched).toBe(false);
      expect(service.addForm.controls.basic.dirty).toBe(false);
      expect(service.addForm.controls.general.touched).toBe(false);
      expect(service.addForm.controls.topics.touched).toBe(false);
      expect(service.addForm.controls.security.touched).toBe(false);
      expect(service.classification.revealed()).toBe(false);
      expect(service.stepper.steps.every((step) => !step.invalid)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Edit mode
  // ---------------------------------------------------------------------------

  describe('enterEditMode', () => {
    const dataset = {
      indicatorId: 'ind-42',
      indicatorName: 'Bestandsindikator',
      abbreviation: 'BI',
      isHeadlineIndicator: true,
      unit: 'Anzahl',
      processDescription: 'Fortschreibung',
      interpretation: 'Weniger ist besser',
      referenceDateNote: 'Stand Jahresende',
      displayOrder: 3,
      tags: ['Bildung', 'Soziales'],
      precision: 1,
      defaultPrecision: false,
      indicatorType: 'STATUS',
      creationType: 'COMPUTATION',
      lowestSpatialUnitForComputation: 'Stadtteile',
      metadata: { description: 'B', datasource: 'Q', contact: 'K', updateInterval: 'YEARLY' },
      topicReference: undefined,
      isPublic: true,
      ownerId: 'org-1',
      permissions: ['p-view'],
      characteristicValue: 'Anteil',
      regionalReferenceValues: [],
      referencedIndicators: [
        { referencedIndicatorId: 'ind-1', referencedIndicatorDescription: 'Basis' },
        { referencedIndicatorId: 'unknown', referencedIndicatorDescription: 'weg' },
      ],
      referencedGeoresources: [
        { referencedGeoresourceId: 'geo-1', referencedGeoresourceDescription: 'Standorte' },
      ],
    };

    beforeEach(() => {
      // Mirror the real order from the shell's ngOnInit: loadInitialData populates
      // the option lists that enterEditMode resolves the dataset's apiNames against.
      service.loadInitialData();
    });

    it('seeds the edit flags and the step-1 fields from the dataset', () => {
      service.enterEditMode(dataset);

      expect(service.editMode).toBe(true);
      expect(service.editIndicatorId).toBe('ind-42');
      // the dataset field is indicatorName, not datasetName
      expect(service.datasetName).toBe('Bestandsindikator');
      expect(service.indicatorAbbreviation).toBe('BI');
      expect(service.isHeadlineIndicator).toBe(true);
      expect(service.indicatorTagsString_withCommas).toBe('Bildung,Soziales');
      expect(service.indicatorPrecision).toBe(1);
      expect(service.showCustomCommaValue).toBe(true);
    });

    it('resolves the option objects by apiName and the spatial unit by level', () => {
      service.enterEditMode(dataset);

      expect(service.indicatorType).toEqual(INDICATOR_TYPE_OPTIONS[1]);
      expect(service.indicatorCreationType).toEqual(CREATION_TYPE_OPTIONS[0]);
      expect(service.enableLowestSpatialUnitSelect).toBe(true);
      expect(service.indicatorLowestSpatialUnitMetadataObjectForComputation).toEqual(
        SPATIAL_UNITS[0]
      );
    });

    it('drops references whose id is unknown to the store', () => {
      service.enterEditMode(dataset);

      expect(service.indicatorReferences_adminView).toHaveLength(1);
      expect(service.indicatorReferences_adminView[0].indicatorMetadata.indicatorId).toBe('ind-1');
      expect(service.georesourceReferences_adminView).toHaveLength(1);
    });

    it('round-trips through the PATCH body', () => {
      service.enterEditMode(dataset);

      const body = service.buildPatchBody_indicators_v3();

      expect(body.datasetName).toBe('Bestandsindikator');
      expect(body.unit).toBe('Anzahl');
      expect(body.tags).toEqual(['Bildung', 'Soziales']);
      expect(body.indicatorType).toBe('STATUS');
      expect(body.creationType).toBe('COMPUTATION');
      expect(body.lowestSpatialUnitForComputation).toBe('Stadtteile');
      expect(body.characteristicValue).toBe('Anteil');
      expect(body.precision).toBe(1);
    });

    it('resolves the owner from the access-control list, else keeps the raw id', () => {
      service.enterEditMode(dataset);
      expect(service.ownerOrganization).toEqual(OWNER_UNIT);

      service.enterEditMode({ ...dataset, ownerId: 'org-unknown' });
      expect(service.ownerOrganization).toBe('org-unknown');

      service.enterEditMode({ ...dataset, ownerId: undefined });
      expect(service.ownerOrganization).toBe('');
    });

    it('ignores a missing dataset instead of throwing', () => {
      expect(() => service.enterEditMode(undefined)).not.toThrow();
      expect(service.editMode).toBe(true);
      expect(service.editIndicatorId).toBeNull();
    });

    it('BUG: resetForm does not leave edit mode (documented)', () => {
      service.enterEditMode(dataset);

      service.resetForm();

      expect(service.editMode).toBe(true);
      expect(service.editIndicatorDataset).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Role grid handshake — no AG Grid involved
  // ---------------------------------------------------------------------------

  describe('role grid handshake', () => {
    it('reads from the live grid while one is attached', () => {
      const grid = fakeRoleGrid(['p-live']);
      service.attachRoleGrid(grid as unknown as RoleManagementGridComponent);

      expect(service.getSelectedRoleIds()).toEqual(['p-live']);
      expect(service.selectedRoleCount).toBe(1);
    });

    it('harvests the selection on detach and keeps serving it', () => {
      const grid = fakeRoleGrid(['p-harvested']);
      service.attachRoleGrid(grid as unknown as RoleManagementGridComponent);

      service.detachRoleGrid(grid as unknown as RoleManagementGridComponent);

      expect(service.getSelectedRoleIds()).toEqual(['p-harvested']);
    });

    it('honours a harvested empty selection instead of falling back to defaults', () => {
      const grid = fakeRoleGrid([]);
      service.ownerOrganization = OWNER_UNIT;
      service.attachRoleGrid(grid as unknown as RoleManagementGridComponent);
      service.detachRoleGrid(grid as unknown as RoleManagementGridComponent);

      expect(service.getSelectedRoleIds()).toEqual([]);
    });

    it('ignores a detach from a different grid instance', () => {
      const attached = fakeRoleGrid(['p-attached']);
      service.attachRoleGrid(attached as unknown as RoleManagementGridComponent);

      service.detachRoleGrid(fakeRoleGrid(['p-other']) as unknown as RoleManagementGridComponent);

      expect(service.getSelectedRoleIds()).toEqual(['p-attached']);
    });

    it('pre-checks only the viewer and editor permissions of the selected owner', () => {
      service.onChangeOwner(OWNER_UNIT);

      expect(service.showRoleForm).toBe(true);
      expect(service.getSelectedRoleIds()).toEqual(['p-view', 'p-edit']);
    });

    it('hides the role form and selects nothing without an owner', () => {
      service.onChangeOwner(null);

      expect(service.showRoleForm).toBe(false);
      expect(service.getSelectedRoleIds()).toEqual([]);
    });

    it('seeds an attached grid with the owner defaults', () => {
      const grid = fakeRoleGrid();
      service.attachRoleGrid(grid as unknown as RoleManagementGridComponent);
      grid.getSelectedRoleIds.mockReturnValue([]);

      service.onChangeOwner(OWNER_UNIT);

      expect(grid.permissions).toEqual(['p-view', 'p-edit']);
      expect(grid.ownerId).toBe('org-1');
      expect(grid.reset).toHaveBeenCalled();
    });

    it('takes the pre-checked ids and the owner from the dataset in edit mode', () => {
      const grid = fakeRoleGrid();
      service.attachRoleGrid(grid as unknown as RoleManagementGridComponent);
      grid.getSelectedRoleIds.mockReturnValue([]);
      service.editMode = true;
      service.editIndicatorDataset = { ownerId: 'org-edit', permissions: ['p-edit-mode'] };

      service.rebuildRoleManagementGrid();

      expect(grid.permissions).toEqual(['p-edit-mode']);
      expect(grid.ownerId).toBe('org-edit');
    });

    it('does not throw when rebuilding without an attached grid', () => {
      service.ownerOrganization = OWNER_UNIT;

      expect(() => service.rebuildRoleManagementGrid()).not.toThrow();
      expect(service.showRoleForm).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Owner organisations
  // ---------------------------------------------------------------------------

  describe('loadOwnerOrganizations', () => {
    it('uses the cached access control without hitting the bootstrap service', () => {
      service.loadOwnerOrganizations();

      expect(fetchAccessControlMetadata).not.toHaveBeenCalled();
      expect(service.ownerOrganizations).toEqual([OWNER_UNIT]);
    });

    it('publishes the organisations through a signal so OnPush step 7 re-renders', () => {
      // Was: a `stateRevision` counter that every wizard step mirrored with an
      // `effect` + `markForCheck`. The asynchronously written reads are
      // signal-backed instead, so the counter and the seven effects are gone.
      const seen: any[][] = [];
      TestBed.runInInjectionContext(() => {
        effect(() => seen.push(service.filteredOrganizations));
      });
      TestBed.tick();

      service.loadOwnerOrganizations();
      TestBed.tick();

      expect(seen.length).toBeGreaterThan(1);
      expect(seen.at(-1)).toEqual([OWNER_UNIT]);
    });

    it('fetches the access control when nothing is cached', async () => {
      const accessControl = TestBed.inject(AccessControlService) as any;
      accessControl.accessControl = [];

      service.loadOwnerOrganizations();
      await Promise.resolve();

      expect(fetchAccessControlMetadata).toHaveBeenCalled();
    });

    it('empties the lists when the fetch fails', async () => {
      const accessControl = TestBed.inject(AccessControlService) as any;
      accessControl.accessControl = [];
      fetchAccessControlMetadata.mockRejectedValue(new Error('offline'));

      service.loadOwnerOrganizations();
      await new Promise((resolve) => setTimeout(resolve));

      expect(service.ownerOrganizations).toEqual([]);
      expect(service.filteredOrganizations).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Metadata file import
  // ---------------------------------------------------------------------------

  describe('parseMetadataFromFile', () => {
    const asFile = (content: string) => new File([content], 'metadata.json');

    it('applies a valid metadata file', async () => {
      await service.parseMetadataFromFile(
        asFile(JSON.stringify({ datasetName: 'Importiert', metadata: { description: 'B' } }))
      );

      expect(service.datasetName).toBe('Importiert');
      expect(service.indicatorMetadataImportError).toBe('');
    });

    it('publishes the imported references through a signal', () => {
      // The other half of the former stateRevision contract: step 4 iterates
      // these lists, and the import rewrites them after an await.
      const seen: any[][] = [];
      TestBed.runInInjectionContext(() => {
        effect(() => seen.push(service.indicatorReferences_adminView));
      });
      TestBed.tick();

      service.indicatorReferences_adminView = [{ indicatorMetadata: { indicatorId: 'ind-1' } }];
      TestBed.tick();

      expect(seen.length).toBeGreaterThan(1);
      expect(seen.at(-1)).toHaveLength(1);
    });

    it('resolves imported references to the metadata objects step 4 renders', async () => {
      await service.parseMetadataFromFile(
        asFile(
          JSON.stringify({
            metadata: {},
            refrencesToOtherIndicators: [
              { indicatorId: 'ind-1', referenceDescription: 'Basis' },
              // Unknown ids are dropped — the row could not be rendered anyway.
              { indicatorId: 'nicht-vorhanden', referenceDescription: 'weg' },
            ],
            refrencesToGeoresources: [
              { georesourceId: 'geo-1', referenceDescription: 'Standorte' },
            ],
          })
        )
      );

      expect(service.indicatorReferences_adminView).toEqual([
        {
          indicatorMetadata: { indicatorId: 'ind-1', indicatorName: 'Bevölkerung' },
          referenceDescription: 'Basis',
        },
      ]);
      expect(service.georesourceReferences_adminView).toEqual([
        {
          georesourceMetadata: { georesourceId: 'geo-1', datasetName: 'Schulen' },
          referenceDescription: 'Standorte',
        },
      ]);
    });

    it('reports unparsable content instead of throwing', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await service.parseMetadataFromFile(asFile('not json at all'));

      expect(service.indicatorMetadataImportError).toBe(
        'Uploaded Metadata File cannot be parsed correctly'
      );
    });

    it('reports valid JSON that does not match the expected structure', async () => {
      await service.parseMetadataFromFile(asFile(JSON.stringify({ somethingElse: true })));

      expect(service.indicatorMetadataImportError).toContain('Struktur der Datei');
    });
  });

  // ---------------------------------------------------------------------------
  // Metadata form wiring (the model itself is covered by its own spec)
  // ---------------------------------------------------------------------------

  describe('metadata getter', () => {
    it('exposes the raw form value as a fresh object per access', () => {
      service.metadataForm.patchValue({ description: 'Beschreibung' });

      expect(service.metadata.description).toBe('Beschreibung');
      expect(service.metadata).not.toBe(service.metadata);
    });

    it('BUG: serialises lastUpdate by hand instead of via metadataFormToApi (documented)', () => {
      // The datepicker yields an NgbDateStruct; metadataFormToApi would convert it
      // to an ISO string, but this service maps the metadata block itself.
      service.metadataForm.patchValue({ lastUpdate: { year: 2026, month: 8, day: 17 } as any });

      expect(service.buildPostBody_indicators_v3().metadata.lastUpdate).toEqual({
        year: 2026,
        month: 8,
        day: 17,
      });
    });
  });

  describe('topic step', () => {
    it('offers only the main topics of the indicator tree', () => {
      const indicatorMain = { topicType: 'main', topicResource: 'indicator', topicId: 't-1' };
      const georesourceMain = { topicType: 'main', topicResource: 'georesource', topicId: 't-2' };
      TestBed.inject(TopicMetadataStoreService).availableTopics = [
        indicatorMain,
        georesourceMain,
      ] as any;

      service.loadInitialData();

      expect(service.availableTopics).toEqual([indicatorMain]);
    });
  });
});
