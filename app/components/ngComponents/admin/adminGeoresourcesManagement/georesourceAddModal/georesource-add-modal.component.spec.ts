import { NO_ERRORS_SCHEMA } from '@angular/core';
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
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { ResourceImportService } from 'services/resource-import-service/resource-import.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { TopicHierarchyService } from 'services/topic-hierarchy-service/topic-hierarchy.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';

import { patchPeriodOfValidityForm } from '../../adminShared/periodOfValidityForm/period-of-validity-form.model';
import { GeoresourceAddModalComponent } from './georesource-add-modal.component';

/**
 * Safety net for the POST-body builder, the georesource-type branch, the four
 * hand-written validation flags and the reset defaults, ahead of the planned
 * typing / Reactive-Forms rework. It pins today's behaviour — including the
 * known divergences called out inline — so the rework can prove it changed
 * nothing it did not mean to change.
 *
 * Like the other modal specs in this repo, the fixture is deliberately never
 * rendered (`detectChanges()` is not called): ngOnInit resets the form, fetches
 * importer resources and subscribes to two streams, and rendering would
 * instantiate AG Grid for the role panel.
 */

const GEORESOURCES = [{ datasetName: 'Spielplätze' }, { datasetName: 'Schulen' }];

const SUB_SUB_SUB = { topicId: 't-1-1-1-1', topicName: 'Ebene 4' };
const SUB_SUB = { topicId: 't-1-1-1', topicName: 'Ebene 3', subTopics: [SUB_SUB_SUB] };
const SUB = { topicId: 't-1-1', topicName: 'Ebene 2', subTopics: [SUB_SUB] };
const MAIN = { topicId: 't-1', topicName: 'Umwelt', subTopics: [SUB] };

const ATTRIBUTE_MAPPING_TYPES = [{ displayName: 'Text', apiName: 'string' }];

/** Minimal stand-in for the AG-Grid role panel read through @ViewChild. */
function fakeRoleGrid(selected: string[] = []) {
  return {
    getSelectedRoleIds: () => selected,
    reset: jest.fn(),
    applyOwner: jest.fn(),
    applyPermissions: jest.fn(),
  };
}

describe('GeoresourceAddModalComponent', () => {
  let component: GeoresourceAddModalComponent;
  let fixture: ComponentFixture<GeoresourceAddModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GeoresourceAddModalComponent, TranslateModule.forRoot()],
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
          provide: GeoresourceMetadataStoreService,
          useValue: { availableGeoresources: GEORESOURCES },
        },
        { provide: SpatialUnitMetadataStoreService, useValue: { availableSpatialUnits: [] } },
        { provide: TopicMetadataStoreService, useValue: { availableTopics: [MAIN] } },
        { provide: TopicHierarchyService, useValue: { getTopicHierarchyForTopicId: () => [] } },
        {
          provide: AccessControlService,
          useValue: { accessControl: [], currentKeycloakLoginRoles: [] },
        },
        // Must be an observable: setupEventListeners subscribes in ngOnInit.
        {
          provide: BroadcastService,
          useValue: { currentBroadcastMsg: new BehaviorSubject<any>({ msg: '' }) },
        },
        {
          provide: MetadataBootstrapService,
          useValue: { metadataLoading$: new BehaviorSubject<any>(null) },
        },
        {
          provide: NotificationService,
          useValue: { showError: jest.fn(), showSuccess: jest.fn() },
        },
        { provide: IndicatorValueService, useValue: { syntaxHighlightJSON: () => '' } },
        // Must be stubbed: the real service fires GETs from its constructor.
        // `attributeMapping_attributeTypes` is indexed by the reset method.
        {
          provide: KommonitorImporterHelperService,
          useValue: {
            mappingConfigStructure: {},
            attributeMapping_attributeTypes: ATTRIBUTE_MAPPING_TYPES,
            availableDatasourceTypes: [],
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

    fixture = TestBed.createComponent(GeoresourceAddModalComponent);
    component = fixture.componentInstance;
  });

  // The component no longer mirrors its controls in plain accessors, so the
  // tests write and read the typed form directly.
  const metadataGroup = () => component.addForm.controls.metadata;
  const styleGroup = () => component.addForm.controls.metadata.controls.style;
  const topicsGroup = () => component.addForm.controls.topics;
  const importerGroup = () => component.addForm.controls.data.controls.importer;
  const securityGroup = () => component.addForm.controls.security;
  const periodGroup = () => component.addForm.controls.data.controls.periodOfValidity;
  const setPeriod = (value: { startDate: unknown; endDate: unknown }) =>
    patchPeriodOfValidityForm(periodGroup(), value as never);
  const setType = (value: string) =>
    metadataGroup().controls.georesourceType.setValue(value as never);

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------

  describe('buildPostBody_georesources — envelope', () => {
    beforeEach(() => {
      metadataGroup().controls.datasetName.setValue('Spielplätze neu');
      component.metadataForm.patchValue({
        description: 'Beschreibung',
        datasource: 'Quelle',
        contact: 'Kontakt',
        lastUpdate: '2026-01-01',
        updateInterval: { apiName: 'YEARLY', displayName: 'jährlich' },
      });
      setPeriod({ startDate: '2026-01-01', endDate: '2026-12-31' });
      securityGroup().patchValue({ ownerOrganization: 'org-1', isPublic: true });
    });

    it('carries the fields the API marks required', () => {
      const body = component.buildPostBody_georesources();

      expect(body.datasetName).toBe('Spielplätze neu');
      expect(body.ownerId).toBe('org-1');
      expect(body.isPublic).toBe(true);
      expect(body.periodOfValidity).toEqual({ startDate: '2026-01-01', endDate: '2026-12-31' });
    });

    it('leaves the geometry payload to the importer', () => {
      const body = component.buildPostBody_georesources();

      expect(body.geoJsonString).toBe('');
      expect(body.jsonSchema).toBeNull();
    });

    it('delegates the metadata block to metadataFormToApi', () => {
      const body = component.buildPostBody_georesources();

      expect(body.metadata).toEqual({
        description: 'Beschreibung',
        databasis: '',
        datasource: 'Quelle',
        contact: 'Kontakt',
        updateInterval: 'YEARLY',
        lastUpdate: '2026-01-01',
        literature: '',
        note: '',
        sridEPSG: 4326,
      });
    });

    it('names the permission field permissions', () => {
      // Behaviour change: the port had sent `allowedRoles`, a name the AngularJS
      // original dropped in cbc8640a. GeoresourcePOSTInputType and the
      // spatial-unit twin both say `permissions`, so every georesource
      // permission was silently discarded.
      const body = component.buildPostBody_georesources();

      expect(Object.keys(body)).toContain('permissions');
      expect(Object.keys(body)).not.toContain('allowedRoles');
    });

    it('passes the validity period through unnormalised', () => {
      // Unlike the spatial-unit twin there is no toIsoDateString() here, because
      // the dates come from raw text inputs rather than <km-date-picker>.
      setPeriod({ startDate: '01.01.2026', endDate: '' });

      const body = component.buildPostBody_georesources();

      expect(body.periodOfValidity).toEqual({ startDate: '01.01.2026', endDate: '' });
    });

    it('defaults the type flags to a POI dataset', () => {
      const body = component.buildPostBody_georesources();

      expect([body.isPOI, body.isLOI, body.isAOI]).toEqual([true, false, false]);
    });
  });

  // ---------------------------------------------------------------------------

  describe('buildPostBody_georesources — POI/LOI/AOI branch', () => {
    const STYLE_KEYS = [
      'poiSymbolBootstrap3Name',
      'poiSymbolColor',
      'poiMarkerColor',
      'poiMarkerStyle',
      'poiMarkerText',
      'loiDashArrayString',
      'loiColor',
      'loiWidth',
      'aoiColor',
    ];

    it('writes all nine style keys for a POI dataset', () => {
      setType('poi');
      component.onChangeGeoresourceType();
      styleGroup().patchValue({
        poiIconName: 'tree',
        poiMarkerStyle: 'text',
        poiMarkerText: 'ABC',
        poiMarkerColor: { colorName: 'red', colorValue: '#f00' },
        poiSymbolColor: { colorName: 'white', colorValue: '#fff' },
      });

      const body = component.buildPostBody_georesources();

      STYLE_KEYS.forEach((key) => expect(Object.keys(body)).toContain(key));
      expect(body.poiSymbolBootstrap3Name).toBe('tree');
      expect(body.poiMarkerStyle).toBe('text');
      expect(body.poiMarkerText).toBe('ABC');
      expect(body.poiMarkerColor).toBe('red');
      expect(body.poiSymbolColor).toBe('white');
    });

    it('keeps loiWidth at 3 rather than null in the POI branch', () => {
      setType('poi');
      component.onChangeGeoresourceType();

      const body = component.buildPostBody_georesources();

      expect(body.loiWidth).toBe(3);
      expect(body.loiDashArrayString).toBeNull();
      expect(body.loiColor).toBeNull();
      expect(body.aoiColor).toBeNull();
    });

    it('falls back to an empty string for unset POI colours', () => {
      setType('poi');
      component.onChangeGeoresourceType();
      styleGroup().patchValue({ poiMarkerColor: null, poiSymbolColor: null });

      const body = component.buildPostBody_georesources();

      expect(body.poiMarkerColor).toBe('');
      expect(body.poiSymbolColor).toBe('');
    });

    it('writes the line style for a LOI dataset', () => {
      setType('loi');
      component.onChangeGeoresourceType();
      styleGroup().patchValue({
        loiColor: '#123456',
        loiWidth: 7,
        loiDashArray: { label: 'gestrichelt', dashArrayValue: '5,5', svgString: '' },
      });

      const body = component.buildPostBody_georesources();

      expect(body.loiColor).toBe('#123456');
      expect(body.loiWidth).toBe(7);
      expect(body.loiDashArrayString).toBe('5,5');
      expect(body.poiSymbolBootstrap3Name).toBeNull();
      expect(body.aoiColor).toBeNull();
    });

    it('uses an empty string, not null, for a missing LOI dash array', () => {
      setType('loi');
      component.onChangeGeoresourceType();
      styleGroup().controls.loiDashArray.setValue(null);

      expect(component.buildPostBody_georesources().loiDashArrayString).toBe('');
    });

    it('writes the area colour for an AOI dataset', () => {
      setType('aoi');
      component.onChangeGeoresourceType();
      styleGroup().controls.aoiColor.setValue('#abcdef');

      const body = component.buildPostBody_georesources();

      expect(body.aoiColor).toBe('#abcdef');
      expect(body.loiWidth).toBe(3);
      expect(body.poiMarkerStyle).toBeNull();
    });

    it('always writes the style keys, since a dataset now always has a type', () => {
      // Was: a metadata import carrying none of the three flags fell through
      // the if/else and produced a body without any style key. isPOI/isLOI/isAOI
      // are derived from the single georesourceType control now, so that state
      // is no longer representable — the control is typed to the three values
      // and onChangeGeoresourceType() normalises anything else to 'poi'.
      setType('unbekannt');
      component.onChangeGeoresourceType();

      const body = component.buildPostBody_georesources();

      expect([body.isPOI, body.isLOI, body.isAOI]).toEqual([true, false, false]);
      STYLE_KEYS.forEach((key) => expect(Object.keys(body)).toContain(key));
    });

    it('reports the flags it was given', () => {
      setType('loi');
      component.onChangeGeoresourceType();

      const body = component.buildPostBody_georesources();

      expect([body.isPOI, body.isLOI, body.isAOI]).toEqual([false, true, false]);
    });
  });

  // ---------------------------------------------------------------------------

  describe('buildPostBody_georesources — topic reference', () => {
    it('uses the main topic when only that is selected', () => {
      topicsGroup().controls.mainTopic.setValue(MAIN);

      expect(component.buildPostBody_georesources().topicReference).toBe('t-1');
    });

    it('prefers the second level over the first', () => {
      topicsGroup().controls.mainTopic.setValue(MAIN);
      topicsGroup().controls.subTopic.setValue(SUB);

      expect(component.buildPostBody_georesources().topicReference).toBe('t-1-1');
    });

    it('prefers the third level', () => {
      topicsGroup().controls.mainTopic.setValue(MAIN);
      topicsGroup().controls.subTopic.setValue(SUB);
      topicsGroup().controls.subsubTopic.setValue(SUB_SUB);

      expect(component.buildPostBody_georesources().topicReference).toBe('t-1-1-1');
    });

    it('prefers the fourth level', () => {
      topicsGroup().controls.mainTopic.setValue(MAIN);
      topicsGroup().controls.subTopic.setValue(SUB);
      topicsGroup().controls.subsubTopic.setValue(SUB_SUB);
      topicsGroup().controls.subsubsubTopic.setValue(SUB_SUB_SUB);

      expect(component.buildPostBody_georesources().topicReference).toBe('t-1-1-1-1');
    });

    it('sends an empty string when no topic is selected', () => {
      expect(component.buildPostBody_georesources().topicReference).toBe('');
    });

    it('clears the deeper levels when the main topic changes', () => {
      // Was: nothing cleared the deeper levels, so a stale reference from a
      // foreign branch was POSTed. The shared topic cascade fixes it.
      topicsGroup().controls.mainTopic.setValue(MAIN);
      topicsGroup().controls.subsubTopic.setValue(SUB_SUB);
      topicsGroup().controls.mainTopic.setValue({ topicId: 't-2', topicName: 'Soziales' });

      expect(topicsGroup().controls.subsubTopic.value).toBeNull();
      expect(component.buildPostBody_georesources().topicReference).toBe('t-2');
    });
  });

  // ---------------------------------------------------------------------------

  describe('buildPostBody_georesources — role grid', () => {
    it('takes the selected role ids from the grid', () => {
      (component as any).roleGrid = fakeRoleGrid(['role-1', 'role-2']);

      expect(component.buildPostBody_georesources().permissions).toEqual(['role-1', 'role-2']);
    });

    it('sends an empty list while the grid is unresolved', () => {
      expect(component.buildPostBody_georesources().permissions).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------

  describe('checkDatasetName', () => {
    it('flags a dataset name that already exists', () => {
      metadataGroup().controls.datasetName.setValue('Schulen');

      component.checkDatasetName();

      expect(component.datasetNameInvalid).toBe(true);
    });

    it('accepts a new dataset name', () => {
      metadataGroup().controls.datasetName.setValue('Spielplätze neu');

      component.checkDatasetName();

      expect(component.datasetNameInvalid).toBe(false);
    });

    it('accepts an empty name (the submit button gates on that separately)', () => {
      metadataGroup().controls.datasetName.setValue('');

      component.checkDatasetName();

      expect(component.datasetNameInvalid).toBe(false);
    });

    it('clears a previous verdict on re-check', () => {
      metadataGroup().controls.datasetName.setValue('Schulen');
      component.checkDatasetName();

      metadataGroup().controls.datasetName.setValue('Spielplätze neu');
      component.checkDatasetName();

      expect(component.datasetNameInvalid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------

  describe('checkPeriodOfValidity', () => {
    it('accepts a start before the end', () => {
      setPeriod({ startDate: '2026-01-01', endDate: '2026-12-31' });

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });

    it('rejects an end before the start', () => {
      setPeriod({ startDate: '2026-12-31', endDate: '2026-01-01' });

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(true);
    });

    it('accepts an open-ended period', () => {
      setPeriod({ startDate: '2026-01-01', endDate: '' });

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });

    it('rejects an identical start and end date', () => {
      // Was accepted: the check compared two freshly constructed Date objects
      // with `===`, which is never true. Now routed through the shared
      // validator, matching the spatial-unit twin.
      setPeriod({ startDate: '2026-01-01', endDate: '2026-01-01' });

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(true);
    });

    it('accepts unparseable dates instead of guessing', () => {
      setPeriod({ startDate: 'gestern', endDate: 'morgen' });

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------

  describe('checkPoiMarkerText', () => {
    it('accepts an empty marker text', () => {
      styleGroup().controls.poiMarkerText.setValue('');

      component.checkPoiMarkerText();

      expect(component.poiMarkerTextInvalid).toBe(false);
    });

    it('accepts three characters', () => {
      styleGroup().controls.poiMarkerText.setValue('ABC');

      component.checkPoiMarkerText();

      expect(component.poiMarkerTextInvalid).toBe(false);
    });

    it('rejects more than three characters', () => {
      styleGroup().controls.poiMarkerText.setValue('ABCD');

      component.checkPoiMarkerText();

      expect(component.poiMarkerTextInvalid).toBe(true);
    });

    it('clears a previous verdict on re-check', () => {
      styleGroup().controls.poiMarkerText.setValue('ABCD');
      component.checkPoiMarkerText();

      styleGroup().controls.poiMarkerText.setValue('AB');
      component.checkPoiMarkerText();

      expect(component.poiMarkerTextInvalid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------

  describe('onChangeGeoresourceType', () => {
    it.each([
      ['poi', [true, false, false]],
      ['loi', [false, true, false]],
      ['aoi', [false, false, true]],
      ['unbekannt', [true, false, false]],
    ])('maps %s onto the three flags', (type, expected) => {
      setType(type as string);

      component.onChangeGeoresourceType();

      expect([component.isPOI, component.isLOI, component.isAOI]).toEqual(expected);
    });
  });

  // ---------------------------------------------------------------------------

  describe('resetGeoresourceAddForm', () => {
    beforeEach(() => {
      component.availablePoiMarkerColors = [
        { colorName: 'red', colorValue: '#f00' },
        { colorName: 'white', colorValue: '#fff' },
      ];
      component.availableLoiDashArrayObjects = [
        { label: 'durchgezogen', dashArrayValue: '', svgString: '' },
      ];
    });

    it('restores the non-empty style defaults', () => {
      styleGroup().patchValue({
        loiColor: '#000000',
        loiWidth: 9,
        aoiColor: '#000000',
        poiIconName: 'tree',
        poiMarkerStyle: 'text',
      });

      component.resetGeoresourceAddForm();

      const style = styleGroup().getRawValue();
      expect(style.loiColor).toBe('#bf3d2c');
      expect(style.loiWidth).toBe(3);
      expect(style.aoiColor).toBe('#bf3d2c');
      expect(style.poiIconName).toBe('home');
      expect(style.poiMarkerStyle).toBe('symbol');
    });

    it('restores the type flags to a POI dataset', () => {
      setType('aoi');
      component.onChangeGeoresourceType();

      component.resetGeoresourceAddForm();

      expect(metadataGroup().controls.georesourceType.value).toBe('poi');
      expect([component.isPOI, component.isLOI, component.isAOI]).toEqual([true, false, false]);
    });

    it('restores the keep flags and clears ownership', () => {
      importerGroup().patchValue({ keepAttributes: false, keepMissingValues: false });
      securityGroup().patchValue({ isPublic: true, ownerOrganization: 'org-1' });

      component.resetGeoresourceAddForm();

      expect(importerGroup().controls.keepAttributes.value).toBe(true);
      expect(importerGroup().controls.keepMissingValues.value).toBe(true);
      expect(securityGroup().controls.isPublic.value).toBe(false);
      expect(securityGroup().controls.ownerOrganization.value).toBe('');
    });

    it('clears the entered values, the topics and the metadata block', () => {
      metadataGroup().controls.datasetName.setValue('Spielplätze neu');
      component.metadataForm.patchValue({ description: 'Beschreibung', sridEPSG: 25832 });
      topicsGroup().controls.mainTopic.setValue(MAIN);
      setPeriod({ startDate: '2026-01-01', endDate: '2026-12-31' });
      importerGroup().controls.idProperty.setValue('id');

      component.resetGeoresourceAddForm();

      expect(metadataGroup().controls.datasetName.value).toBe('');
      expect(component.metadata.description).toBe('');
      expect(component.metadata.sridEPSG).toBe(4326);
      expect(topicsGroup().controls.mainTopic.value).toBeNull();
      expect(periodGroup().getRawValue()).toEqual({ startDate: '', endDate: '' });
      expect(importerGroup().controls.idProperty.value).toBe('');
      expect(component.attributeMappings_adminView).toEqual([]);
    });
  });
});
