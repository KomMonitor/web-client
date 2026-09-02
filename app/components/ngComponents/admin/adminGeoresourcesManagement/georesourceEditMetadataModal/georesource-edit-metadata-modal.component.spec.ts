import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AccessControlService } from 'services/access-control-service/access-control.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';

import { GeoresourceEditMetadataModalComponent } from './georesource-edit-metadata-modal.component';

/**
 * Covers the permission handling of the metadata editor, which had no spec at
 * all. The port used to carry an `allowedRoles` list into the PATCH body:
 * `GeoresourcePATCHInputType` declares no permission field, the AngularJS
 * original sent none either, and the list was always empty because the dataset
 * names that field `permissions`. The fixture is deliberately never rendered,
 * following the other modal specs in this repo.
 */

const DATASET = {
  georesourceId: 'geo-1',
  datasetName: 'Spielplätze',
  isPOI: true,
  isLOI: false,
  isAOI: false,
  metadata: {},
  permissions: ['role-1', 'role-2'],
};

describe('GeoresourceEditMetadataModalComponent', () => {
  let component: GeoresourceEditMetadataModalComponent;
  let fixture: ComponentFixture<GeoresourceEditMetadataModalComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GeoresourceEditMetadataModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
        {
          provide: EnvConfigService,
          useValue: { updateIntervalOptions: [], baseUrlToKomMonitorDataAPI: '/api' },
        },
        {
          provide: GeoresourceMetadataStoreService,
          useValue: { availableGeoresources: [DATASET] },
        },
        { provide: TopicMetadataStoreService, useValue: { availableTopics: [] } },
        { provide: AccessControlService, useValue: {} },
        {
          provide: NotificationService,
          useValue: { showSuccess: jest.fn(), showError: jest.fn() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(GeoresourceEditMetadataModalComponent);
    component = fixture.componentInstance;
    component.currentGeoresourceDataset = { ...DATASET };
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------

  describe('editGeoresourceMetadata — PATCH body', () => {
    it('sends no permission field at all', () => {
      // Behaviour change: the port sent `allowedRoles`, which is in neither
      // GeoresourcePATCHInputType nor the AngularJS original. Permissions are
      // managed by the dedicated edit-user-roles modal.
      component.permissions = ['role-1'];

      component.editGeoresourceMetadata();

      const request = httpMock.expectOne('/api/georesources/geo-1');
      expect(Object.keys(request.request.body)).not.toContain('allowedRoles');
      expect(Object.keys(request.request.body)).not.toContain('permissions');
      request.flush({});
    });

    it('patches the dataset name and the type flags', () => {
      component.editGeoresourceMetadata();

      const request = httpMock.expectOne('/api/georesources/geo-1');
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body.isPOI).toBe(true);
      expect(request.request.body.isLOI).toBe(false);
      expect(request.request.body.isAOI).toBe(false);
      request.flush({});
    });

    it('keeps a symbol name the client cannot render', () => {
      // Editing an unrelated field must not rewrite a legacy symbol name.
      component.selectedPoiIconName = 'not-a-glyphicon';

      component.editGeoresourceMetadata();

      const request = httpMock.expectOne('/api/georesources/geo-1');
      expect(request.request.body.poiSymbolBootstrap3Name).toBe('not-a-glyphicon');
      request.flush({});
    });
  });

  // ---------------------------------------------------------------------------

  describe('permission pass-through', () => {
    it('reads the roles from the dataset field the API actually returns', () => {
      // Was: `currentGeoresourceDataset.allowedRoles`, which never exists —
      // GeoresourceOverviewType calls it `permissions`.
      component.resetGeoresourceEditMetadataForm();

      expect(component.permissions).toEqual(['role-1', 'role-2']);
    });
  });
});
