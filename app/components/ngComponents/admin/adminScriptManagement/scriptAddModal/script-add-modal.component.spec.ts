import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ScriptAddModalComponent } from './script-add-modal.component';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ScheduleDraftService } from 'services/schedule-draft-service/schedule-draft.service';

describe('ScriptAddModalComponent (methodology patch, C9)', () => {
  let component: any;
  let get: jest.Mock;
  let patch: jest.Mock;
  let submit: jest.Mock;

  const STORED_INDICATOR = {
    indicatorId: 'ind-1',
    indicatorName: 'Anteil Bevölkerung 80+',
    abbreviation: 'B80',
    interpretation: 'Hohe Werte bedeuten viel.',
    isHeadlineIndicator: false,
    unit: 'Prozent',
    tags: ['Demografie'],
    topicReference: 'topic-7',
    processDescription: 'alte Methodik',
    metadata: { contact: 'a@b.de', datasource: 'Amt', description: 'x', updateInterval: 'YEAR' },
    permissions: [{ permissionId: 'p1' }],
    ownerId: 'org-1',
  };

  const build = () => {
    const fixture = TestBed.createComponent(ScriptAddModalComponent);
    component = fixture.componentInstance;
    return fixture;
  };

  beforeEach(() => {
    get = jest.fn().mockReturnValue(of(STORED_INDICATOR));
    patch = jest.fn().mockReturnValue(of({}));
    submit = jest.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      imports: [ScriptAddModalComponent, TranslateModule.forRoot()],
      providers: [
        { provide: NgbActiveModal, useValue: { dismiss: jest.fn(), close: jest.fn() } },
        { provide: HttpClient, useValue: { get, patch } },
        {
          provide: EnvConfigService,
          useValue: { baseUrlToKomMonitorDataAPI: 'https://data.example/management' },
        },
        {
          provide: ScheduleDraftService,
          useValue: {
            submit,
            reset: jest.fn(),
            ensureProcessesLoaded: jest.fn().mockResolvedValue(undefined),
            isComplete: () => true,
            targetIndicatorId: signal('ind-1'),
            selectedProcess: signal({
              id: 'KmIndicatorSum',
              uiParams: { formula: 'A + B', dynamicLegend: '' },
              description: { inputs: {} },
            }),
            processInputs: signal({}),
          },
        },
        {
          provide: IndicatorMetadataStoreService,
          useValue: { getIndicatorMetadataById: () => undefined },
        },
        {
          provide: GeoresourceMetadataStoreService,
          useValue: { getGeoresourceMetadataById: () => undefined },
        },
      ],
    });
    TestBed.overrideComponent(ScriptAddModalComponent, { set: { template: '', imports: [] } });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('leaves the indicator alone when the methodology is not to be applied', async () => {
    build();
    component.applyMethodology.set(false);

    await component.addScript();

    expect(submit).toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();
    expect(component.showSuccessAlert()).toBe(true);
  });

  it('reads the stored metadata back before replacing it', async () => {
    build();
    component.applyMethodology.set(true);

    await component.addScript();

    const url = 'https://data.example/management/indicators/ind-1';
    expect(get).toHaveBeenCalledWith(url);
    expect(patch).toHaveBeenCalledTimes(1);

    const [patchedUrl, body] = patch.mock.calls[0];
    expect(patchedUrl).toBe(url);
    // The methodology is exchanged, the rest of the metadata travels along.
    expect(body.processDescription).toBe('A + B');
    expect(body.unit).toBe('Prozent');
    expect(body.datasetName).toBe('Anteil Bevölkerung 80+');
    expect(body).not.toHaveProperty('permissions');
    expect(component.methodologyFailed()).toBe(false);
  });

  it('keeps the schedule and reports a partial failure when the patch fails', async () => {
    patch.mockReturnValue(throwError(() => new Error('400')));
    build();
    component.applyMethodology.set(true);

    await component.addScript();

    expect(submit).toHaveBeenCalled();
    expect(component.showSuccessAlert()).toBe(true);
    expect(component.showErrorAlert()).toBe(false);
    expect(component.methodologyFailed()).toBe(true);
  });

  it('reports the same way when the metadata cannot be read back', async () => {
    get.mockReturnValue(throwError(() => new Error('404')));
    build();
    component.applyMethodology.set(true);

    await component.addScript();

    expect(patch).not.toHaveBeenCalled();
    expect(component.methodologyFailed()).toBe(true);
    expect(component.showSuccessAlert()).toBe(true);
  });

  it('fails the whole operation when the schedule itself cannot be created', async () => {
    submit.mockRejectedValue({ error: { message: 'nope' } });
    build();
    component.applyMethodology.set(true);

    await component.addScript();

    expect(patch).not.toHaveBeenCalled();
    expect(component.showErrorAlert()).toBe(true);
    expect(component.showSuccessAlert()).toBe(false);
  });
});
