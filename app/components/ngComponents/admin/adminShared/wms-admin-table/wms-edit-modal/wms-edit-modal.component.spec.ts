import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { OgcService } from 'services/ogcServices/ogc.service';
import { WmsDataset } from 'components/ngComponents/models/services.models';

import { WmsEditModalComponent } from './wms-edit-modal.component';

describe('WmsEditModalComponent', () => {
  let component: WmsEditModalComponent;
  let fixture: ComponentFixture<WmsEditModalComponent>;
  let ogcService: { updateWms: jest.Mock };

  const dataset = {
    id: 'wms-1',
    title: 'Luftbilder',
    description: 'Beschreibung',
    databasis: '',
    datasource: 'Quelle',
    contact: 'Kontakt',
    note: '',
    connectionDetails: { baseUrl: 'https://example.org/wms', layerName: 'luftbild' },
    topicReference: '',
    serviceResource: 'georesource',
  } as unknown as WmsDataset;

  /** A main topic, the only required choice in the topics step. */
  const MAIN_TOPIC = { topicId: 't-1', topicName: 'Umwelt', subTopics: [] };

  beforeEach(() => {
    ogcService = { updateWms: jest.fn(() => of({})) };
    TestBed.configureTestingModule({
      imports: [WmsEditModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
        { provide: OgcService, useValue: ogcService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(WmsEditModalComponent);
    component = fixture.componentInstance;
    component.currentGeoresourceDataset = { ...dataset };
    component.reInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clears the connection-test alerts on reset', () => {
    component.testSuccessMessage.set(true);
    component.testErrorMessage.set(true);

    component.resetWmsAddForm();

    expect(component.testSuccessMessage()).toBe(false);
    expect(component.testErrorMessage()).toBe(false);
  });

  describe('submit gate', () => {
    it('jumps to the first incomplete step instead of saving', () => {
      component.topicsForm.controls.mainTopic.setValue(MAIN_TOPIC as any);
      component.connectForm.controls.layer.setValue('');
      component.stepper.goToKey('topics');

      component.onSubmit();

      expect(ogcService.updateWms).not.toHaveBeenCalled();
      expect(component.stepper.isActive('connection')).toBe(true);
      expect(component.connectForm.controls.layer.touched).toBe(true);
      expect(component.stepper.steps.map((step) => step.invalid)).toEqual([false, true, false]);
    });

    it('demands a main topic', () => {
      component.onSubmit();

      expect(ogcService.updateWms).not.toHaveBeenCalled();
      expect(component.stepper.isActive('topics')).toBe(true);
    });

    it('saves the stored values once a main topic is chosen', () => {
      component.topicsForm.controls.mainTopic.setValue(MAIN_TOPIC as any);

      component.onSubmit();

      expect(ogcService.updateWms).toHaveBeenCalledWith(
        'wms-1',
        expect.objectContaining({
          title: 'Luftbilder',
          connectionDetails: expect.objectContaining({ baseUrl: 'https://example.org/wms' }),
          topicReference: 't-1',
        })
      );
    });

    it('marks a step only once it is left incomplete', () => {
      component.metadataForm.controls.title.setValue('');
      expect(component.stepper.steps[0].invalid).toBe(false);

      component.stepper.next();

      expect(component.stepper.steps[0].invalid).toBe(true);
    });
  });

  describe('reset', () => {
    it('restores the stored values instead of clearing them', () => {
      component.metadataForm.controls.title.setValue('Geändert');
      component.connectForm.controls.url.setValue('');

      component.resetWmsAddForm();

      expect(component.metadataForm.controls.title.value).toBe('Luftbilder');
      expect(component.connectForm.controls.url.value).toBe('https://example.org/wms');
      expect(component.metadataForm.touched).toBe(false);
    });
  });
});
