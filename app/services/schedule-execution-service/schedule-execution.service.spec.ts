import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ScheduleExecutionService } from './schedule-execution.service';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { ProcessesApiService } from 'services/processes-api-service/processes-api.service';

describe('ScheduleExecutionService', () => {
  let service: ScheduleExecutionService;
  let triggerScheduleExecution: jest.Mock;
  let fetchSingleSchedule: jest.Mock;
  let fetchJob: jest.Mock;
  let replaceSingleProcessScriptMetadata: jest.Mock;
  let showSuccess: jest.Mock;
  let showError: jest.Mock;
  let show: jest.Mock;

  const schedule = (jobIDs: string[] = []) =>
    ({
      scheduleID: 's1',
      processID: 'km_indicator_sum',
      jobIDs,
      inputs: { target_indicator_id: 'ind-1' },
    }) as any;

  beforeEach(() => {
    jest.useFakeTimers();
    triggerScheduleExecution = jest.fn().mockResolvedValue(undefined);
    fetchSingleSchedule = jest.fn().mockResolvedValue(schedule([]));
    fetchJob = jest.fn().mockResolvedValue({ jobID: 'j-new', status: 'running' });
    replaceSingleProcessScriptMetadata = jest.fn();
    showSuccess = jest.fn();
    showError = jest.fn();
    show = jest.fn();

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: ProcessesApiService,
          useValue: { triggerScheduleExecution, fetchSingleSchedule, fetchJob },
        },
        {
          provide: ProcessScriptMetadataStoreService,
          useValue: { replaceSingleProcessScriptMetadata },
        },
        {
          provide: IndicatorMetadataStoreService,
          useValue: { getIndicatorMetadataById: () => ({ indicatorName: 'Bevölkerung' }) },
        },
        { provide: NotificationService, useValue: { show, showSuccess, showError } },
      ],
    });
    service = TestBed.inject(ScheduleExecutionService);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('marks the schedule pending while no job id has appeared yet', async () => {
    await service.triggerExecution(schedule([]));

    expect(triggerScheduleExecution).toHaveBeenCalledWith('s1');
    expect(service.isPending('s1')).toBe(true);
    expect(service.hasPending()).toBe(true);
  });

  it('clears pending and stores the schedule once the new job id shows up', async () => {
    fetchSingleSchedule.mockResolvedValue(schedule(['j-new']));

    await service.triggerExecution(schedule([]));
    await jest.advanceTimersByTimeAsync(1000);

    expect(service.isPending('s1')).toBe(false);
    expect(replaceSingleProcessScriptMetadata).toHaveBeenCalledWith(schedule(['j-new']));
  });

  it('keeps polling while the job list has not grown', async () => {
    await service.triggerExecution(schedule([]));
    await jest.advanceTimersByTimeAsync(3000);

    expect(fetchSingleSchedule.mock.calls.length).toBeGreaterThan(1);
    expect(service.isPending('s1')).toBe(true);
  });

  it('reports success once the new job completes', async () => {
    fetchSingleSchedule.mockResolvedValue(schedule(['j-new']));
    fetchJob.mockResolvedValue({ jobID: 'j-new', status: 'successful' });

    await service.triggerExecution(schedule([]));
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(3000);

    expect(showSuccess).toHaveBeenCalled();
    expect(showError).not.toHaveBeenCalled();
  });

  it('reports a failed job as an error', async () => {
    fetchSingleSchedule.mockResolvedValue(schedule(['j-new']));
    fetchJob.mockResolvedValue({ jobID: 'j-new', status: 'failed' });

    await service.triggerExecution(schedule([]));
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(3000);

    expect(showError).toHaveBeenCalled();
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it('only treats an id the schedule did not have before as the new job', async () => {
    fetchSingleSchedule.mockResolvedValue(schedule(['j-old', 'j-new']));
    fetchJob.mockResolvedValue({ jobID: 'j-new', status: 'successful' });

    await service.triggerExecution(schedule(['j-old']));
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(3000);

    expect(fetchJob).toHaveBeenCalledWith('j-new');
  });

  it('surfaces a rejected trigger and does not leave the button spinning', async () => {
    triggerScheduleExecution.mockRejectedValue(new Error('403'));

    await expect(service.triggerExecution(schedule([]))).rejects.toThrow();

    expect(service.isPending('s1')).toBe(false);
    expect(showError).toHaveBeenCalled();
  });

  it('gives up waiting for a job that never appears', async () => {
    await service.triggerExecution(schedule([]));
    await jest.advanceTimersByTimeAsync(61_000);

    expect(service.isPending('s1')).toBe(false);
    expect(showError).toHaveBeenCalled();
  });
});
