import { TestBed } from '@angular/core/testing';

import { ScheduleDraftService } from './schedule-draft.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ProcessCatalogStoreService } from 'services/process-catalog-store-service/process-catalog-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { ProcessesApiService } from 'services/processes-api-service/processes-api.service';

describe('ScheduleDraftService', () => {
  let service: ScheduleDraftService;
  let createSchedule: jest.Mock;
  let deleteSchedule: jest.Mock;
  let fetchSchedules: jest.Mock;
  let calls: string[];

  const SUM_PROCESS = {
    id: 'KmIndicatorSum',
    title: 'Summe',
    uiParams: {
      apiName: 'km_indicator_sum',
      inputBoxes: [
        { id: 'computation_ids', title: 'Basisindikatoren', contents: ['computation_ids'] },
      ],
    },
    description: {
      id: 'KmIndicatorSum',
      inputs: {
        target_indicator_id: { schema: { type: 'string', required: ['true'] } },
        computation_ids: { schema: { type: 'array', required: ['true'] } },
        aggregation_method: {
          schema: {
            type: 'object',
            enum: [{ apiName: 'MEAN', displayName: 'Mittel' }],
            default: { apiName: 'MEAN', displayName: 'Mittel' },
          },
        },
      },
    },
  } as any;

  const LINE_PROCESS = {
    id: 'KmGeoresourceLengthLineSegmentsWithinPolygon',
    title: 'Linienlänge',
    uiParams: {
      apiName: 'km_georesource_length',
      // The box names a content key the process does not declare.
      inputBoxes: [{ id: 'georesource_id_line', contents: ['georesource_id_line'] }],
    },
    description: {
      id: 'KmGeoresourceLengthLineSegmentsWithinPolygon',
      inputs: { georesource_id: { schema: { type: 'string', required: ['true'] } } },
    },
  } as any;

  beforeEach(() => {
    calls = [];
    createSchedule = jest.fn().mockImplementation(async () => {
      calls.push('create');
      return 'new-id';
    });
    deleteSchedule = jest.fn().mockImplementation(async () => {
      calls.push('delete');
    });
    fetchSchedules = jest.fn().mockResolvedValue([]);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProcessesApiService,
          useValue: { createSchedule, deleteSchedule, fetchSchedules },
        },
        {
          provide: ProcessCatalogStoreService,
          useValue: {
            processes: () => [SUM_PROCESS, LINE_PROCESS],
            loadCatalogue: jest.fn().mockResolvedValue([]),
          },
        },
        { provide: ProcessScriptMetadataStoreService, useValue: { setProcessScripts: jest.fn() } },
        {
          provide: IndicatorMetadataStoreService,
          useValue: {
            getIndicatorMetadataById: (id: string) =>
              ({
                a: { applicableDates: ['2020-12-31', '2021-12-31', '2022-12-31'] },
                b: { applicableDates: ['2021-12-31', '2022-12-31', '2023-12-31'] },
              })[id],
          },
        },
        {
          provide: GeoresourceMetadataStoreService,
          useValue: {
            getGeoresourceMetadataById: () => ({
              availablePeriodsOfValidity: [
                { startDate: '2019-01-01' },
                { startDate: '2018-01-01' },
              ],
            }),
          },
        },
        {
          provide: CacheHelperServiceService,
          useValue: { fetchSingleGeoresourceSchema: jest.fn().mockResolvedValue({}) },
        },
      ],
    });
    service = TestBed.inject(ScheduleDraftService);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('choosing a process', () => {
    it('seeds enum defaults with the apiName, not the whole option object', () => {
      service.selectProcess(SUM_PROCESS);
      expect(service.getInput('aggregation_method')).toBe('MEAN');
    });

    it('discards the previous process inputs', () => {
      service.selectProcess(SUM_PROCESS);
      service.setInput('computation_ids', ['a']);
      service.selectProcess(LINE_PROCESS);
      expect(service.getInput('computation_ids')).toBeUndefined();
    });

    it('offers only the chosen family', () => {
      service.familyFilter.set('georesource');
      expect(service.availableProcesses().map((p) => p.id)).toEqual([LINE_PROCESS.id]);
      service.familyFilter.set('indicator');
      expect(service.availableProcesses().map((p) => p.id)).toEqual([SUM_PROCESS.id]);
    });
  });

  describe('the generated form', () => {
    it('resolves a box to the inputs the process declares', () => {
      service.selectProcess(SUM_PROCESS);
      const boxes = service.inputBoxes();
      expect(boxes.length).toBe(1);
      expect(boxes[0].inputs.map(([key]) => key)).toEqual(['computation_ids']);
    });

    it('maps the line georesource box onto the declared georesource_id', () => {
      service.selectProcess(LINE_PROCESS);
      expect(service.inputBoxes()[0].inputs.map(([key]) => key)).toEqual(['georesource_id']);
    });
  });

  describe('applicable dates', () => {
    it('intersects the dates of all selected input indicators', () => {
      service.selectProcess(SUM_PROCESS);
      service.setInput('computation_ids', ['a', 'b']);
      expect(service.applicableDates()).toEqual(['2021-12-31', '2022-12-31']);
    });

    it('falls back to the georesource periods when no indicator is selected', () => {
      service.selectProcess(LINE_PROCESS);
      service.setInput('georesource_id', 'g1');
      expect(service.applicableDates()).toEqual(['2018-01-01', '2019-01-01']);
    });

    it('is empty while nothing is selected', () => {
      service.selectProcess(SUM_PROCESS);
      expect(service.applicableDates()).toEqual([]);
    });
  });

  describe('completeness', () => {
    const fill = () => {
      service.selectProcess(SUM_PROCESS);
      service.targetIndicatorId.set('ind-1');
      service.targetSpatialUnitIds.set(['su-1']);
      service.setInput('computation_ids', ['a']);
    };

    it('accepts a fully filled draft', () => {
      fill();
      expect(service.isComplete()).toBe(true);
    });

    it('rejects a missing required process input', () => {
      fill();
      service.setInput('computation_ids', []);
      expect(service.isComplete()).toBe(false);
    });

    it('rejects a missing spatial unit', () => {
      fill();
      service.targetSpatialUnitIds.set([]);
      expect(service.isComplete()).toBe(false);
    });

    it('rejects an invalid manual cron pattern', () => {
      fill();
      service.useManualCron.set(true);
      service.manualCron.set('nonsense');
      expect(service.isComplete()).toBe(false);
    });
  });

  describe('submitting', () => {
    beforeEach(() => {
      service.selectProcess(SUM_PROCESS);
      service.targetIndicatorId.set('ind-1');
      service.targetSpatialUnitIds.set(['su-1']);
      service.setInput('computation_ids', ['a']);
    });

    it('creates with the PascalCase process id', async () => {
      await expect(service.submit()).resolves.toBe('new-id');
      expect(createSchedule).toHaveBeenCalledWith('KmIndicatorSum', expect.any(Object));
    });

    it('submits the four common inputs alongside the process ones', async () => {
      await service.submit();
      const inputs = createSchedule.mock.calls[0][1];
      expect(inputs.target_indicator_id).toBe('ind-1');
      expect(inputs.target_spatial_units).toEqual(['su-1']);
      expect(inputs.execution_interval).toEqual({ value: { cron: '0 0 1 * *' } });
      expect(inputs.computation_ids).toEqual(['a']);
    });

    it("removes the indicator's previous schedule before creating the new one", async () => {
      service.existingSchedule.set({ scheduleID: 'old' } as any);
      await service.submit();
      expect(deleteSchedule).toHaveBeenCalledWith('old');
      expect(calls).toEqual(['delete', 'create']);
    });

    it('does not delete anything when the indicator had no schedule', async () => {
      await service.submit();
      expect(deleteSchedule).not.toHaveBeenCalled();
    });

    it('refuses to submit without a process', async () => {
      service.selectProcess(undefined);
      await expect(service.submit()).rejects.toThrow('no process selected');
    });
  });

  describe('existing schedule lookup', () => {
    it('finds the schedule that computes the chosen indicator', async () => {
      fetchSchedules.mockResolvedValue([
        { scheduleID: 's1', inputs: { target_indicator_id: 'other' } },
        { scheduleID: 's2', inputs: { target_indicator_id: 'ind-1' } },
      ]);
      service.targetIndicatorId.set('ind-1');

      await service.refreshExistingSchedule();

      expect(service.existingSchedule()?.scheduleID).toBe('s2');
    });

    it('clears the hint when no indicator is chosen', async () => {
      service.targetIndicatorId.set('');
      await service.refreshExistingSchedule();
      expect(service.existingSchedule()).toBeUndefined();
    });
  });
});
