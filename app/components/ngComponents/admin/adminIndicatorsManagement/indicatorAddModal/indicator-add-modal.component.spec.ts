import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AccessControlService } from 'services/access-control-service/access-control.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';

import { IndicatorAddModalComponent } from './indicator-add-modal.component';
import { IndicatorAddFormStateService } from './indicator-add-form-state.service';

/**
 * The submit path of the indicator wizard: jump to the first incomplete step
 * instead of sending, POST/PATCH once complete, and the stepper marking.
 *
 * The modal is never rendered: ngOnInit and the step templates pull in the
 * option lists, the role grid's AG Grid and the palette widgets, none of which
 * the submit logic needs. The per-rule validity is covered by the state and
 * classification service specs.
 */

const API = 'https://api.example/management';

const SPATIAL_UNITS = [
  { spatialUnitId: 'su1', spatialUnitLevel: 'Stadtteile' },
  { spatialUnitId: 'su2', spatialUnitLevel: 'Bezirke' },
];

const OWNER_UNIT = { organizationalUnitId: 'org-1', name: 'Stadt', permissions: [] };

describe('IndicatorAddModalComponent', () => {
  let component: IndicatorAddModalComponent;
  let state: IndicatorAddFormStateService;
  let http: HttpTestingController;
  let modalOpen: jest.Mock;

  function create(env: Record<string, unknown> = {}): void {
    modalOpen = jest.fn();
    TestBed.configureTestingModule({
      imports: [IndicatorAddModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        NgbActiveModal,
        { provide: NgbModal, useValue: { open: modalOpen } },
        {
          provide: EnvConfigService,
          useValue: {
            enableKeycloakSecurity: true,
            baseUrlToKomMonitorDataAPI: API,
            customColorSchemes: undefined,
            updateIntervalOptions: [{ displayName: 'jährlich', apiName: 'YEARLY' }],
            indicatorTypeOptions: [{ displayName: 'Status', apiName: 'STATUS' }],
            indicatorUnitOptions: ['Anzahl'],
            indicatorCreationTypeOptions: [{ displayName: 'Insert', apiName: 'INSERTION' }],
            ...env,
          },
        },
        {
          provide: SpatialUnitMetadataStoreService,
          useValue: { availableSpatialUnits: SPATIAL_UNITS },
        },
        { provide: IndicatorMetadataStoreService, useValue: { availableIndicators: [] } },
        { provide: GeoresourceMetadataStoreService, useValue: { availableGeoresources: [] } },
        { provide: TopicMetadataStoreService, useValue: { availableTopics: [] } },
        {
          provide: AccessControlService,
          useValue: {
            accessControl: [OWNER_UNIT],
            currentKeycloakLoginRoles: [],
            currentKomMonitorLoginRoleNames: [],
            checkAdminPermission: () => true,
            getAccessControlById: () => OWNER_UNIT,
          },
        },
        {
          provide: MetadataBootstrapService,
          useValue: { fetchAccessControlMetadata: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    });

    const fixture = TestBed.createComponent(IndicatorAddModalComponent);
    component = fixture.componentInstance;
    // The component provides its own instance; the test drives that one.
    state = fixture.debugElement.injector.get(IndicatorAddFormStateService);
    state.classification.init(SPATIAL_UNITS);
    http = TestBed.inject(HttpTestingController);
  }

  function fillRequired(): void {
    state.datasetName = 'Neuer Indikator';
    state.indicatorUnit = 'Anzahl';
    state.indicatorInterpretation = 'Mehr ist besser';
    state.indicatorCreationType = { displayName: 'Insert', apiName: 'INSERTION' };
    state.indicatorTopic_mainTopic = { topicId: 'topic-1' };
    state.ownerOrganization = OWNER_UNIT;
    state.metadataForm.patchValue({
      description: 'Beschreibung',
      datasource: 'Quelle',
      contact: 'Kontakt',
      updateInterval: { displayName: 'jährlich', apiName: 'YEARLY' },
      lastUpdate: '2026-01-01',
    });
    state.classification.onColorSchemeSelected('Blues');
  }

  afterEach(() => {
    http?.verify();
    TestBed.resetTestingModule();
  });

  it('jumps to the first incomplete step instead of posting', async () => {
    create();
    fillRequired();
    state.metadataForm.controls.contact.setValue('');
    state.stepper.goToKey('security');

    await component.onSubmit();

    http.expectNone(`${API}/indicators`);
    expect(modalOpen).not.toHaveBeenCalled();
    expect(state.stepper.isActive('general')).toBe(true);
    // Every step is revealed, not only the one jumped to.
    expect(state.addForm.controls.basic.touched).toBe(true);
    expect(state.addForm.controls.security.touched).toBe(true);
    expect(state.classification.revealed()).toBe(true);
    expect(state.stepper.steps.map((step) => step.invalid)).toEqual([
      false, // metadata
      true, // general
      false, // topics
      false, // references
      false, // classification
      false, // referenceValues
      false, // security
    ]);
  });

  it('jumps to the classification step when the regional breaks are missing', async () => {
    create();
    fillRequired();
    state.classification.onClassificationMethodSelected('regional_default');

    await component.onSubmit();

    http.expectNone(`${API}/indicators`);
    expect(state.stepper.isActive('classification')).toBe(true);
    expect(state.stepper.steps[4].invalid).toBe(true);
  });

  it('posts once every step is complete', async () => {
    jest.useFakeTimers();
    create();
    fillRequired();

    const submitted = component.onSubmit();
    const request = http.expectOne(`${API}/indicators`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.ownerId).toBe('org-1');
    request.flush({ indicatorId: 'ind-new' });
    await submitted;

    expect(state.successMessagePart).toBe('Neuer Indikator');
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('patches in edit mode without demanding an owner', async () => {
    create();
    state.enterEditMode({ indicatorId: 'ind-1', indicatorName: 'Alt', ownerId: null });
    fillRequired();
    state.ownerOrganization = null;

    const submitted = component.onSubmit();
    const request = http.expectOne(`${API}/indicators/ind-1`);
    expect(request.request.method).toBe('PATCH');
    request.flush({});
    await submitted;
  });

  it('does not demand an owner when Keycloak is disabled', async () => {
    jest.useFakeTimers();
    create({ enableKeycloakSecurity: false });
    fillRequired();
    state.ownerOrganization = null;

    const submitted = component.onSubmit();
    const request = http.expectOne(`${API}/indicators`);
    expect(request.request.method).toBe('POST');
    request.flush({ indicatorId: 'ind-new' });
    await submitted;
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('marks a step only once it is left incomplete', () => {
    create();
    expect(state.stepper.steps.every((step) => !step.invalid)).toBe(true);

    state.stepper.next();

    expect(state.stepper.steps[0].invalid).toBe(true);
    expect(state.stepper.steps[1].invalid).toBe(false); // not left yet
  });

  it('marks the classification step once it is left with an error', () => {
    create();
    state.classification.onClassificationMethodSelected('regional_default');
    state.stepper.goToKey('classification');

    expect(state.stepper.steps[4].invalid).toBe(false);

    state.stepper.next();

    expect(state.stepper.steps[4].invalid).toBe(true);
  });
});
