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
 * names that field `permissions`. The fixture is rendered only for the footer
 * button checks; everything else works on the component instance.
 *
 * Also covers the active submit button (documentation/AKTIVER_SUBMIT_BUTTON.md):
 * an incomplete form jumps to its first incomplete step instead of patching.
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
        { provide: AccessControlService, useValue: { checkAdminPermission: () => false } },
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

  it('opens with the fields of the dataset being edited', () => {
    // Regression: the prefill used to hang off a broadcast listener that was
    // removed, so the dialog opened with every field empty.
    component.currentGeoresourceDataset = {
      ...DATASET,
      metadata: { description: 'Spielplätze der Stadt', contact: 'amt@example.org' },
    };

    component.ngOnInit();

    expect(component.metadataStep.controls.datasetName.value).toBe('Spielplätze');
    expect(component.metadataForm.controls.description.value).toBe('Spielplätze der Stadt');
    expect(component.metadataForm.controls.contact.value).toBe('amt@example.org');
    // A prefilled form starts unmarked.
    expect(component.stepper.steps.every((step) => !step.invalid)).toBe(true);
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

  // ---------------------------------------------------------------------------

  describe('active submit button', () => {
    /** Fills the two steps the fixture dataset leaves incomplete. */
    function completeForm(): void {
      component.resetGeoresourceEditMetadataForm();
      component.metadataForm.patchValue({
        description: 'Beschreibung',
        datasource: 'Quelle',
        contact: 'Kontakt',
        lastUpdate: '2026-01-01',
        updateInterval: { apiName: 'YEARLY', displayName: 'jährlich' } as any,
      });
      component.topicsForm.controls.mainTopic.setValue({ topicId: 'topic-1' } as any);
    }

    function stepMarkings(): boolean[] {
      return component.stepper.steps.map((step) => step.invalid);
    }

    it('jumps to the first incomplete step instead of patching', () => {
      const patch = jest.spyOn(component, 'editGeoresourceMetadata');
      completeForm();
      component.metadataForm.controls.contact.setValue('');
      component.topicsForm.controls.mainTopic.setValue(null);
      component.stepper.goToKey('topics');

      component.onSubmit();

      expect(patch).not.toHaveBeenCalled();
      httpMock.expectNone('/api/georesources/geo-1');
      expect(component.stepper.isActive('general')).toBe(true);
      // Every step is revealed, not only the one jumped to.
      expect(stepMarkings()).toEqual([false, true, true]);
    });

    it('jumps back to the first step for a marker text that is too long', () => {
      completeForm();
      component.poiMarkerText = 'ABCD';
      component.stepper.goToKey('topics');

      component.onSubmit();

      httpMock.expectNone('/api/georesources/geo-1');
      expect(component.stepper.isActive('metadata')).toBe(true);
      expect(component.poiMarkerTextErrorShown).toBe(true);
    });

    it('patches once the form is complete', () => {
      completeForm();

      component.onSubmit();

      httpMock.expectOne('/api/georesources/geo-1').flush({});
    });

    it('marks a step only after it was left incomplete', () => {
      component.resetGeoresourceEditMetadataForm();
      expect(stepMarkings()).toEqual([false, false, false]);

      component.stepper.next(); // metadata step is complete for the fixture
      expect(stepMarkings()).toEqual([false, false, false]);

      component.stepper.next(); // general step is left incomplete
      expect(stepMarkings()).toEqual([false, true, false]);
    });

    it('clears the markings on reset', () => {
      component.resetGeoresourceEditMetadataForm();
      component.onSubmit();
      expect(stepMarkings()).toEqual([false, true, true]);

      component.resetGeoresourceEditMetadataForm();

      expect(stepMarkings()).toEqual([false, false, false]);
      expect(component.stepper.currentStep).toBe(1);
    });

    it('does not patch without a dataset or while a request is running', () => {
      component.currentGeoresourceDataset = undefined;
      component.editGeoresourceMetadata();
      httpMock.expectNone('/api/georesources/geo-1');

      component.currentGeoresourceDataset = { ...DATASET };
      component.loadingData.set(true);
      component.editGeoresourceMetadata();
      httpMock.expectNone('/api/georesources/geo-1');
    });

    describe('rendered footer', () => {
      function submitButton(): HTMLButtonElement {
        return fixture.nativeElement.querySelector('.modal-footer .btn-success');
      }

      it('keeps the button enabled on an incomplete form', () => {
        component.resetGeoresourceEditMetadataForm();
        fixture.detectChanges();

        expect(component.metadataForm.invalid).toBe(true);
        expect(submitButton().disabled).toBe(false);
      });

      it('disables the button without a dataset', () => {
        component.currentGeoresourceDataset = undefined;
        fixture.detectChanges();

        expect(submitButton().disabled).toBe(true);
      });
    });
  });
});
