import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProcessesApiService } from './processes-api.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

describe('ProcessesApiService', () => {
  let service: ProcessesApiService;
  let httpMock: HttpTestingController;

  const BASE = 'http://processes-api/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EnvConfigService, useValue: { targetUrlToProcessesApi: BASE } },
      ],
    });
    service = TestBed.inject(ProcessesApiService);
    httpMock = TestBed.inject(HttpTestingController);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    httpMock.verify();
    jest.restoreAllMocks();
  });

  it('unwraps the schedules envelope', async () => {
    const pending = service.fetchSchedules();
    httpMock.expectOne(BASE + 'schedules').flush({
      schedules: [{ scheduleID: 's1', jobIDs: [] }],
    });
    await expect(pending).resolves.toEqual([{ scheduleID: 's1', jobIDs: [] }]);
  });

  it('drops short-lived non-UUID job ids', async () => {
    const pending = service.fetchSchedules();
    httpMock.expectOne(BASE + 'schedules').flush({
      schedules: [
        {
          scheduleID: 's1',
          jobIDs: ['40c5e3ff-6f37-43da-b95b-c5bb240d59eb', 'denim-swallow'],
        },
      ],
    });
    const schedules = await pending;
    expect(schedules[0].jobIDs).toEqual(['40c5e3ff-6f37-43da-b95b-c5bb240d59eb']);
  });

  it('resolves with an empty list when schedules require a login', async () => {
    const pending = service.fetchSchedules();
    httpMock
      .expectOne(BASE + 'schedules')
      .flush({ error: 'missing_authorization' }, { status: 401, statusText: 'Unauthorized' });
    await expect(pending).resolves.toEqual([]);
  });

  it('reads a single schedule out of the same envelope', async () => {
    const pending = service.fetchSingleSchedule('s1');
    httpMock.expectOne(BASE + 'schedules/s1').flush({
      schedules: [{ scheduleID: 's1', jobIDs: ['short'] }],
    });
    await expect(pending).resolves.toEqual({ scheduleID: 's1', jobIDs: [] });
  });

  it('returns undefined for an unknown single schedule', async () => {
    const pending = service.fetchSingleSchedule('nope');
    httpMock.expectOne(BASE + 'schedules/nope').flush({ schedules: [] });
    await expect(pending).resolves.toBeUndefined();
  });

  it('keeps only the process families the UI offers', async () => {
    const pending = service.fetchProcesses();
    httpMock.expectOne(BASE + 'processes').flush({
      processes: [
        { id: 'KmIndicatorSum' },
        { id: 'KmGeoresourceMiscStatistics' },
        { id: 'HelloWorld' },
        { id: 'SingleExport' },
      ],
    });
    await expect(pending).resolves.toEqual([
      { id: 'KmIndicatorSum' },
      { id: 'KmGeoresourceMiscStatistics' },
    ]);
  });

  it('extracts the kommonitor UI params from a description', () => {
    const uiParams = service.extractKommonitorUiParams({
      id: 'KmIndicatorSum',
      additional_parameters: {
        parameters: [
          { name: 'somethingElse', value: [{ nope: true }] },
          { name: 'kommonitorUiParams', value: [{ apiName: 'km_indicator_sum' }] },
        ],
      },
    });
    expect(uiParams?.apiName).toBe('km_indicator_sum');
  });

  it('returns undefined UI params when the block is absent', () => {
    expect(service.extractKommonitorUiParams({ id: 'KmIndicatorSum' })).toBeUndefined();
    expect(service.extractKommonitorUiParams(undefined)).toBeUndefined();
  });
});
