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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------

  describe('buildPostBody_georesources — envelope', () => {
    beforeEach(() => {
      component.datasetName = 'Spielplätze neu';
      component.metadataForm.patchValue({
        description: 'Beschreibung',
        datasource: 'Quelle',
        contact: 'Kontakt',
        lastUpdate: '2026-01-01',
        updateInterval: { apiName: 'YEARLY', displayName: 'jährlich' },
      });
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '2026-12-31' };
      component.ownerOrganization = 'org-1';
      component.isPublic = true;
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

    it('names the permission field allowedRoles', () => {
      // Divergence from GeoresourcePOSTInputType, which calls it `permissions`
      // (the spatial-unit twin already sends `permissions`). Pinned as-is; the
      // rework must not change the wire format silently.
      const body = component.buildPostBody_georesources();

      expect(Object.keys(body)).toContain('allowedRoles');
      expect(Object.keys(body)).not.toContain('permissions');
    });

    it('passes the validity period through unnormalised', () => {
      // Unlike the spatial-unit twin there is no toIsoDateString() here, because
      // the dates come from raw text inputs rather than <km-date-picker>.
      component.periodOfValidity = { startDate: '01.01.2026', endDate: '' };

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
      component.georesourceType = 'poi';
      component.onChangeGeoresourceType();
      component.selectedPoiIconName = 'tree';
      component.selectedPoiMarkerStyle = 'text';
      component.poiMarkerText = 'ABC';
      component.selectedPoiMarkerColor = { colorName: 'red' };
      component.selectedPoiSymbolColor = { colorName: 'white' };

      const body = component.buildPostBody_georesources();

      STYLE_KEYS.forEach((key) => expect(Object.keys(body)).toContain(key));
      expect(body.poiSymbolBootstrap3Name).toBe('tree');
      expect(body.poiMarkerStyle).toBe('text');
      expect(body.poiMarkerText).toBe('ABC');
      expect(body.poiMarkerColor).toBe('red');
      expect(body.poiSymbolColor).toBe('white');
    });

    it('keeps loiWidth at 3 rather than null in the POI branch', () => {
      component.georesourceType = 'poi';
      component.onChangeGeoresourceType();

      const body = component.buildPostBody_georesources();

      expect(body.loiWidth).toBe(3);
      expect(body.loiDashArrayString).toBeNull();
      expect(body.loiColor).toBeNull();
      expect(body.aoiColor).toBeNull();
    });

    it('falls back to an empty string for unset POI colours', () => {
      component.georesourceType = 'poi';
      component.onChangeGeoresourceType();
      component.selectedPoiMarkerColor = null;
      component.selectedPoiSymbolColor = null;

      const body = component.buildPostBody_georesources();

      expect(body.poiMarkerColor).toBe('');
      expect(body.poiSymbolColor).toBe('');
    });

    it('writes the line style for a LOI dataset', () => {
      component.georesourceType = 'loi';
      component.onChangeGeoresourceType();
      component.loiColor = '#123456';
      component.loiWidth = 7;
      component.selectedLoiDashArrayObject = {
        label: 'gestrichelt',
        dashArrayValue: '5,5',
        svgString: '',
      };

      const body = component.buildPostBody_georesources();

      expect(body.loiColor).toBe('#123456');
      expect(body.loiWidth).toBe(7);
      expect(body.loiDashArrayString).toBe('5,5');
      expect(body.poiSymbolBootstrap3Name).toBeNull();
      expect(body.aoiColor).toBeNull();
    });

    it('uses an empty string, not null, for a missing LOI dash array', () => {
      component.georesourceType = 'loi';
      component.onChangeGeoresourceType();
      component.selectedLoiDashArrayObject = null;

      expect(component.buildPostBody_georesources().loiDashArrayString).toBe('');
    });

    it('writes the area colour for an AOI dataset', () => {
      component.georesourceType = 'aoi';
      component.onChangeGeoresourceType();
      component.aoiColor = '#abcdef';

      const body = component.buildPostBody_georesources();

      expect(body.aoiColor).toBe('#abcdef');
      expect(body.loiWidth).toBe(3);
      expect(body.poiMarkerStyle).toBeNull();
    });

    it('always writes the style keys, since a dataset now always has a type', () => {
      // Was: a metadata import carrying none of the three flags fell through
      // the if/else and produced a body without any style key. isPOI/isLOI/isAOI
      // are derived from the single georesourceType control now, so that state
      // is no longer representable; an import without a flag lands on 'aoi'.
      component.georesourceType = 'unbekannt';

      const body = component.buildPostBody_georesources();

      expect([body.isPOI, body.isLOI, body.isAOI]).toEqual([true, false, false]);
      STYLE_KEYS.forEach((key) => expect(Object.keys(body)).toContain(key));
    });

    it('reports the flags it was given', () => {
      component.georesourceType = 'loi';
      component.onChangeGeoresourceType();

      const body = component.buildPostBody_georesources();

      expect([body.isPOI, body.isLOI, body.isAOI]).toEqual([false, true, false]);
    });
  });

  // ---------------------------------------------------------------------------

  describe('buildPostBody_georesources — topic reference', () => {
    it('uses the main topic when only that is selected', () => {
      component.georesourceTopic_mainTopic = MAIN;

      expect(component.buildPostBody_georesources().topicReference).toBe('t-1');
    });

    it('prefers the second level over the first', () => {
      component.georesourceTopic_mainTopic = MAIN;
      component.georesourceTopic_subTopic = SUB;

      expect(component.buildPostBody_georesources().topicReference).toBe('t-1-1');
    });

    it('prefers the third level', () => {
      component.georesourceTopic_mainTopic = MAIN;
      component.georesourceTopic_subTopic = SUB;
      component.georesourceTopic_subsubTopic = SUB_SUB;

      expect(component.buildPostBody_georesources().topicReference).toBe('t-1-1-1');
    });

    it('prefers the fourth level', () => {
      component.georesourceTopic_mainTopic = MAIN;
      component.georesourceTopic_subTopic = SUB;
      component.georesourceTopic_subsubTopic = SUB_SUB;
      component.georesourceTopic_subsubsubTopic = SUB_SUB_SUB;

      expect(component.buildPostBody_georesources().topicReference).toBe('t-1-1-1-1');
    });

    it('sends an empty string when no topic is selected', () => {
      expect(component.buildPostBody_georesources().topicReference).toBe('');
    });

    it('clears the deeper levels when the main topic changes', () => {
      // Was: nothing cleared the deeper levels, so a stale reference from a
      // foreign branch was POSTed. The shared topic cascade fixes it.
      component.georesourceTopic_mainTopic = MAIN;
      component.georesourceTopic_subsubTopic = SUB_SUB;
      component.georesourceTopic_mainTopic = { topicId: 't-2', topicName: 'Soziales' };

      expect(component.georesourceTopic_subsubTopic).toBeNull();
      expect(component.buildPostBody_georesources().topicReference).toBe('t-2');
    });
  });

  // ---------------------------------------------------------------------------

  describe('buildPostBody_georesources — role grid', () => {
    it('takes the selected role ids from the grid', () => {
      (component as any).roleGrid = fakeRoleGrid(['role-1', 'role-2']);

      expect(component.buildPostBody_georesources().allowedRoles).toEqual(['role-1', 'role-2']);
    });

    it('sends an empty list while the grid is unresolved', () => {
      expect(component.buildPostBody_georesources().allowedRoles).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------

  describe('checkDatasetName', () => {
    it('flags a dataset name that already exists', () => {
      component.datasetName = 'Schulen';

      component.checkDatasetName();

      expect(component.datasetNameInvalid).toBe(true);
    });

    it('accepts a new dataset name', () => {
      component.datasetName = 'Spielplätze neu';

      component.checkDatasetName();

      expect(component.datasetNameInvalid).toBe(false);
    });

    it('accepts an empty name (the submit button gates on that separately)', () => {
      component.datasetName = '';

      component.checkDatasetName();

      expect(component.datasetNameInvalid).toBe(false);
    });

    it('clears a previous verdict on re-check', () => {
      component.datasetName = 'Schulen';
      component.checkDatasetName();

      component.datasetName = 'Spielplätze neu';
      component.checkDatasetName();

      expect(component.datasetNameInvalid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------

  describe('checkPeriodOfValidity', () => {
    it('accepts a start before the end', () => {
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '2026-12-31' };

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });

    it('rejects an end before the start', () => {
      component.periodOfValidity = { startDate: '2026-12-31', endDate: '2026-01-01' };

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(true);
    });

    it('accepts an open-ended period', () => {
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '' };

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });

    it('rejects an identical start and end date', () => {
      // Was accepted: the check compared two freshly constructed Date objects
      // with `===`, which is never true. Now routed through the shared
      // validator, matching the spatial-unit twin.
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '2026-01-01' };

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(true);
    });

    it('accepts unparseable dates instead of guessing', () => {
      component.periodOfValidity = { startDate: 'gestern', endDate: 'morgen' };

      component.checkPeriodOfValidity();

      expect(component.periodOfValidityInvalid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------

  describe('checkPoiMarkerText', () => {
    it('accepts an empty marker text', () => {
      component.poiMarkerText = '';

      component.checkPoiMarkerText();

      expect(component.poiMarkerTextInvalid).toBe(false);
    });

    it('accepts three characters', () => {
      component.poiMarkerText = 'ABC';

      component.checkPoiMarkerText();

      expect(component.poiMarkerTextInvalid).toBe(false);
    });

    it('rejects more than three characters', () => {
      component.poiMarkerText = 'ABCD';

      component.checkPoiMarkerText();

      expect(component.poiMarkerTextInvalid).toBe(true);
    });

    it('clears a previous verdict on re-check', () => {
      component.poiMarkerText = 'ABCD';
      component.checkPoiMarkerText();

      component.poiMarkerText = 'AB';
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
      component.georesourceType = type as string;

      component.onChangeGeoresourceType();

      expect([component.isPOI, component.isLOI, component.isAOI]).toEqual(expected);
    });
  });

  // ---------------------------------------------------------------------------

  describe('resetGeoresourceAddForm', () => {
    beforeEach(() => {
      component.availablePoiMarkerColors = [{ colorName: 'red' }, { colorName: 'white' }];
      component.availableLoiDashArrayObjects = [
        { label: 'durchgezogen', dashArrayValue: '', svgString: '' },
      ];
    });

    it('restores the non-empty style defaults', () => {
      component.loiColor = '#000000';
      component.loiWidth = 9;
      component.aoiColor = '#000000';
      component.selectedPoiIconName = 'tree';
      component.selectedPoiMarkerStyle = 'text';

      component.resetGeoresourceAddForm();

      expect(component.loiColor).toBe('#bf3d2c');
      expect(component.loiWidth).toBe(3);
      expect(component.aoiColor).toBe('#bf3d2c');
      expect(component.selectedPoiIconName).toBe('home');
      expect(component.selectedPoiMarkerStyle).toBe('symbol');
    });

    it('restores the type flags to a POI dataset', () => {
      component.georesourceType = 'aoi';
      component.onChangeGeoresourceType();

      component.resetGeoresourceAddForm();

      expect(component.georesourceType).toBe('poi');
      expect([component.isPOI, component.isLOI, component.isAOI]).toEqual([true, false, false]);
    });

    it('restores the keep flags and clears ownership', () => {
      component.keepAttributes = false;
      component.keepMissingValues = false;
      component.isPublic = true;
      component.ownerOrganization = 'org-1';

      component.resetGeoresourceAddForm();

      expect(component.keepAttributes).toBe(true);
      expect(component.keepMissingValues).toBe(true);
      expect(component.isPublic).toBe(false);
      expect(component.ownerOrganization).toBe('');
    });

    it('clears the entered values, the topics and the metadata block', () => {
      component.datasetName = 'Spielplätze neu';
      component.metadataForm.patchValue({ description: 'Beschreibung', sridEPSG: 25832 });
      component.georesourceTopic_mainTopic = MAIN;
      component.periodOfValidity = { startDate: '2026-01-01', endDate: '2026-12-31' };
      component.georesourceDataSourceIdProperty = 'id';

      component.resetGeoresourceAddForm();

      expect(component.datasetName).toBe('');
      expect(component.metadata.description).toBe('');
      expect(component.metadata.sridEPSG).toBe(4326);
      expect(component.georesourceTopic_mainTopic).toBeNull();
      expect(component.periodOfValidity).toEqual({ startDate: '', endDate: '' });
      expect(component.georesourceDataSourceIdProperty).toBe('');
      expect(component.attributeMappings_adminView).toEqual([]);
    });
  });
});
