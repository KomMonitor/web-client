import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

import { AccessControlService } from 'services/access-control-service/access-control.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { OgcService } from 'services/ogcServices/ogc.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';

import { WmsAddModalComponent } from './wms-add-modal.component';

/**
 * Covers the active-submit-button flow (documentation/AKTIVER_SUBMIT_BUTTON.md).
 * Most tests drive the component without rendering; the rendered test runs
 * with Keycloak off so the security fieldset (and its AG Grid) is dropped.
 */
describe('WmsAddModalComponent', () => {
  let component: WmsAddModalComponent;
  let fixture: ComponentFixture<WmsAddModalComponent>;
  let ogcService: { registerWms: jest.Mock; testConnection: jest.Mock };

  function createFixture(enableKeycloakSecurity = true): ComponentFixture<WmsAddModalComponent> {
    ogcService = {
      registerWms: jest.fn(() => of({ title: 'Neuer WMS' })),
      testConnection: jest.fn(() => of({ success: true })),
    };
    TestBed.configureTestingModule({
      imports: [WmsAddModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
        { provide: EnvConfigService, useValue: { enableKeycloakSecurity } },
        { provide: TopicMetadataStoreService, useValue: { availableTopics: [] } },
        { provide: AccessControlService, useValue: { checkAdminPermission: () => false } },
        { provide: OgcService, useValue: ogcService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    return TestBed.createComponent(WmsAddModalComponent);
  }

  function fillMetadata(target: WmsAddModalComponent = component): void {
    target.metadataForm.patchValue({
      title: 'WMS',
      description: 'Beschreibung',
      datasource: 'Quelle',
      contact: 'Kontakt',
    });
  }

  function fillRequired(target: WmsAddModalComponent = component): void {
    fillMetadata(target);
    target.connectForm.patchValue({ url: 'https://example.org/wms', layer: 'layer1' });
    target.topicsForm.controls.mainTopic.setValue({ topicId: 't-1', topicName: 'Thema' });
  }

  beforeEach(() => {
    fixture = createFixture();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('jumps to the first incomplete step instead of registering', () => {
    fillMetadata();

    component.onSubmit();

    expect(ogcService.registerWms).not.toHaveBeenCalled();
    expect(component.stepper.isActive('connection')).toBe(true);
    // Every step is revealed, not only the one jumped to.
    expect(component.securityForm.touched).toBe(true);
    expect(component.stepper.steps.map((step) => step.invalid)).toEqual([false, true, true, true]);
  });

  it('registers once the form is complete', () => {
    fillRequired();
    component.securityForm.controls.ownerOrganization.setValue('org-1');

    component.onSubmit();

    expect(ogcService.registerWms).toHaveBeenCalledTimes(1);
    expect(ogcService.registerWms.mock.calls[0][0]).toMatchObject({
      title: 'WMS',
      ownerId: 'org-1',
      connectionDetails: { baseUrl: 'https://example.org/wms', layerName: 'layer1' },
    });
    expect(component.isSubmitting()).toBe(false);
  });

  it('marks a step only once it is left incomplete', () => {
    expect(component.stepper.steps[0].invalid).toBe(false);

    component.stepper.next();

    expect(component.stepper.steps[0].invalid).toBe(true);
    expect(component.stepper.steps[1].invalid).toBe(false); // current, not left yet
    expect(component.stepper.steps[2].invalid).toBe(false); // not visited yet
  });

  it('clears the touched state on reset', () => {
    component.onSubmit();
    expect(component.stepper.steps.some((step) => step.invalid)).toBe(true);

    component.resetWmsAddForm();

    expect(component.metadataForm.touched).toBe(false);
    expect(component.connectForm.touched).toBe(false);
    expect(component.stepper.currentStep).toBe(1);
    expect(component.stepper.steps.some((step) => step.invalid)).toBe(false);
  });

  describe('with Keycloak disabled', () => {
    let plainFixture: ComponentFixture<WmsAddModalComponent>;
    let plain: WmsAddModalComponent;

    beforeEach(() => {
      TestBed.resetTestingModule();
      plainFixture = createFixture(false);
      plain = plainFixture.componentInstance;
    });

    it('does not demand an owner', () => {
      fillRequired(plain);

      plain.onSubmit();

      expect(plain.securityForm.valid).toBe(true);
      expect(ogcService.registerWms).toHaveBeenCalledTimes(1);
    });

    it('renders the test-connection button as type="button"', () => {
      plainFixture.detectChanges();
      plain.stepper.goToKey('connection');
      plainFixture.detectChanges();

      const buttons: HTMLButtonElement[] = Array.from(
        plainFixture.nativeElement.querySelectorAll('button')
      );
      const testButton = buttons.find((button) => button.textContent?.includes('TEST_CONNECTION'));

      expect(testButton).toBeDefined();
      expect(testButton!.type).toBe('button');
    });
  });
});
