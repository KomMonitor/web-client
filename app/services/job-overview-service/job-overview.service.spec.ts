import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { JobOverviewService } from './job-overview.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ProcessCatalogStoreService } from 'services/process-catalog-store-service/process-catalog-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { ProcessesApiService } from 'services/processes-api-service/processes-api.service';

describe('JobOverviewService', () => {
  let service: JobOverviewService;
  let fetchSchedules: jest.Mock;
  let fetchJobs: jest.Mock;
  let fetchJobSummary: jest.Mock;
  let setProcessScripts: jest.Mock;

  const job = (jobID: string, status = 'successful', start = '2026-09-01T00:00:00+00:00') =>
    ({
      jobID,
      status,
      processID: 'km_indicator_sum',
      job_start_datetime: start,
      job_end_datetime: start,
      message: null,
      progress: null,
    }) as any;

  const schedule = (scheduleID: string, jobIDs: string[], targetIndicatorId = 'ind-1') =>
    ({
      scheduleID,
      processID: 'km_indicator_sum',
      jobIDs,
      inputs: { target_indicator_id: targetIndicatorId },
    }) as any;

  beforeEach(() => {
    fetchSchedules = jest.fn().mockResolvedValue([]);
    fetchJobs = jest.fn().mockResolvedValue([]);
    fetchJobSummary = jest.fn().mockResolvedValue([]);
    setProcessScripts = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProcessesApiService,
          useValue: { fetchSchedules, fetchJobs, fetchJobSummary },
        },
        { provide: ProcessScriptMetadataStoreService, useValue: { setProcessScripts } },
        {
          provide: ProcessCatalogStoreService,
          useValue: { getProcessTitleByApiName: (apiName: string) => 'Summe (' + apiName + ')' },
        },
        {
          provide: IndicatorMetadataStoreService,
          useValue: {
            getIndicatorMetadataById: (id: string) =>
              id === 'ind-1' ? { indicatorName: 'Bevölkerung' } : undefined,
          },
        },
      ],
    });
    service = TestBed.inject(JobOverviewService);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('job to schedule resolution', () => {
    it('resolves the target indicator through the schedule that owns the job', () => {
      const rows = service.buildRows([job('j1')], [schedule('s1', ['j1'])]);
      expect(rows[0].targetIndicatorId).toBe('ind-1');
      expect(rows[0].targetIndicatorName).toBe('Bevölkerung');
    });

    it('leaves the indicator undefined when no schedule lists the job', () => {
      const rows = service.buildRows([job('orphan')], [schedule('s1', ['j1'])]);
      expect(rows[0].targetIndicatorId).toBeUndefined();
      expect(rows[0].targetIndicatorName).toBeUndefined();
      // The row still exists and keeps its process title, unlike master's
      // renderer, which drops the whole cell including the job id.
      expect(rows[0].processTitle).toBe('Summe (km_indicator_sum)');
      expect(rows[0].job.jobID).toBe('orphan');
    });

    it('leaves the indicator undefined when the schedule points at an unknown indicator', () => {
      const rows = service.buildRows([job('j1')], [schedule('s1', ['j1'], 'ind-gone')]);
      expect(rows[0].targetIndicatorId).toBe('ind-gone');
      expect(rows[0].targetIndicatorName).toBeUndefined();
    });

    it('maps a job id to the first schedule claiming it', () => {
      const map = service.buildScheduleByJobIdMap([
        schedule('s1', ['j1', 'j2']),
        schedule('s2', ['j2']),
      ]);
      expect(map.get('j1')?.scheduleID).toBe('s1');
      expect(map.get('j2')?.scheduleID).toBe('s1');
    });

    it('tolerates schedules without job ids', () => {
      const map = service.buildScheduleByJobIdMap([{ scheduleID: 's1' } as any]);
      expect(map.size).toBe(0);
    });
  });

  describe('ordering and limit', () => {
    it('sorts jobs newest first', () => {
      const rows = service.buildRows(
        [
          job('old', 'successful', '2026-01-01T00:00:00+00:00'),
          job('new', 'successful', '2026-09-01T00:00:00+00:00'),
        ],
        []
      );
      expect(rows.map((row) => row.job.jobID)).toEqual(['new', 'old']);
    });

    it('keeps at most MAX_JOBS rows', () => {
      const jobs = Array.from({ length: JobOverviewService.MAX_JOBS + 10 }, (_, index) =>
        job('j' + index)
      );
      expect(service.buildRows(jobs, []).length).toBe(JobOverviewService.MAX_JOBS);
    });

    it('does not fall over on an unparseable start date', () => {
      const rows = service.buildRows([job('j1', 'successful', 'not-a-date')], []);
      expect(rows.length).toBe(1);
    });
  });

  describe('status counting', () => {
    const rows = () =>
      service.buildRows(
        [
          job('j1', 'successful'),
          job('j2', 'successful'),
          job('j3', 'failed'),
          job('j4', 'running'),
        ],
        []
      );

    it('counts each status over the loaded rows', () => {
      const built = rows();
      expect(service.countByStatus(built, 'successful')).toBe(2);
      expect(service.countByStatus(built, 'failed')).toBe(1);
      expect(service.countByStatus(built, 'running')).toBe(1);
      expect(service.countByStatus(built, 'accepted')).toBe(0);
    });
  });

  describe('summaries', () => {
    it('asks only for successful jobs', async () => {
      const rows = service.buildRows([job('ok', 'successful'), job('bad', 'failed')], []);
      await service.loadSummaries(rows);
      expect(fetchJobSummary).toHaveBeenCalledTimes(1);
      expect(fetchJobSummary).toHaveBeenCalledWith('ok');
    });

    it('caches a fetched summary instead of asking twice', async () => {
      const rows = service.buildRows([job('ok')], []);
      await service.loadSummaries(rows);
      await service.loadSummaries(rows);
      expect(fetchJobSummary).toHaveBeenCalledTimes(1);
    });

    it('keeps the other rows usable when one summary cannot be loaded', async () => {
      fetchJobSummary.mockImplementation((jobId: string) =>
        jobId === 'broken' ? Promise.resolve(undefined) : Promise.resolve([{ spatialUnitId: 'su' }])
      );
      const rows = service.buildRows([job('broken'), job('fine')], []);

      const cache = await service.loadSummaries(rows);

      expect(cache.has('broken')).toBe(false);
      expect(service.getSummary('broken')).toBeUndefined();
      expect(service.getSummary('fine')).toEqual([{ spatialUnitId: 'su' }]);
    });

    it('clearSummaryCache forces a refetch', async () => {
      const rows = service.buildRows([job('ok')], []);
      await service.loadSummaries(rows);
      service.clearSummaryCache();
      await service.loadSummaries(rows);
      expect(fetchJobSummary).toHaveBeenCalledTimes(2);
    });

    // The cache has to be reactive: the summary cells read it from inside a
    // computed and redraw themselves. Were it a plain Map, the dialog would
    // have to rebuild the grid instead and lose filter and sort with it.
    it('notifies a reader when a summary lands and when the cache is dropped', async () => {
      fetchJobSummary.mockResolvedValue([{ spatialUnitId: 'su' }]);
      const rows = service.buildRows([job('ok')], []);
      const summary = computed(() => service.getSummary('ok'));

      expect(summary()).toBeUndefined();

      await service.loadSummaries(rows);
      expect(summary()).toEqual([{ spatialUnitId: 'su' }]);

      service.clearSummaryCache();
      expect(summary()).toBeUndefined();
    });
  });

  describe('loadRows', () => {
    it('refreshes the schedule store before joining, so new jobs resolve', async () => {
      fetchSchedules.mockResolvedValue([schedule('s1', ['j1'])]);
      fetchJobs.mockResolvedValue([job('j1')]);

      const rows = await service.loadRows();

      expect(setProcessScripts).toHaveBeenCalledWith([schedule('s1', ['j1'])]);
      expect(rows[0].targetIndicatorName).toBe('Bevölkerung');
    });

    it('returns an empty list when both reads come back empty', async () => {
      await expect(service.loadRows()).resolves.toEqual([]);
    });
  });
});
