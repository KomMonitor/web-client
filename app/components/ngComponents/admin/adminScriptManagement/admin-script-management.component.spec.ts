import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { AdminScriptManagementComponent } from './admin-script-management.component';
import { JobOverviewModalComponent } from '../adminScriptExecution/jobOverviewModal/job-overview-modal.component';
import { AdminModalService } from '../adminShared/modal/admin-modal.service';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { ProcessCatalogStoreService } from 'services/process-catalog-store-service/process-catalog-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { ScheduleExecutionService } from 'services/schedule-execution-service/schedule-execution.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

describe('AdminScriptManagementComponent', () => {
  let fixture: ComponentFixture<AdminScriptManagementComponent>;
  let component: any;
  let schedules: any[];
  let open: jest.Mock;
  let getRowsForSchedule: jest.Mock;
  let triggerExecution: jest.Mock;

  const schedule = (scheduleID: string, targetIndicatorId: string, spatialUnits: string[]) => ({
    scheduleID,
    processID: 'km_indicator_sum',
    scheduleCron: '0 0 1 * *',
    jobIDs: [],
    inputs: {
      target_indicator_id: targetIndicatorId,
      target_spatial_units: spatialUnits,
      target_time: { value: { mode: 'ALL', includeDates: [], excludeDates: [] } },
    },
  });

  const VISIBLE = schedule('s-visible', 'ind-1', ['su-1']);
  const HIDDEN_INDICATOR = schedule('s-no-indicator', 'ind-gone', ['su-1']);
  const HIDDEN_SPATIAL_UNIT = schedule('s-no-su', 'ind-1', ['su-1', 'su-gone']);

  const build = async () => {
    fixture = TestBed.createComponent(AdminScriptManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(() => {
    schedules = [VISIBLE, HIDDEN_INDICATOR, HIDDEN_SPATIAL_UNIT];
    open = jest.fn().mockResolvedValue(undefined);
    getRowsForSchedule = jest.fn().mockReturnValue([{ job: { jobID: 'j1' } }]);
    triggerExecution = jest.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      imports: [AdminScriptManagementComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: ProcessScriptMetadataStoreService,
          useValue: {
            get availableProcessScripts() {
              return schedules;
            },
            deleteSingleProcessScriptMetadata: jest.fn(),
          },
        },
        {
          provide: MetadataBootstrapService,
          useValue: {
            metadataLoading$: new BehaviorSubject('COMPLETE'),
            fetchIndicatorScriptsMetadata: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: IndicatorMetadataStoreService,
          useValue: {
            getIndicatorMetadataById: (id: string) =>
              id === 'ind-1'
                ? { indicatorName: 'Bevölkerung', processDescription: 'Summe zweier Indikatoren' }
                : undefined,
          },
        },
        {
          provide: SpatialUnitMetadataStoreService,
          useValue: {
            getSpatialUnitMetadataById: (id: string) =>
              id === 'su-1' ? { spatialUnitLevel: 'Stadtteile' } : undefined,
          },
        },
        {
          provide: ProcessCatalogStoreService,
          useValue: { getProcessTitleByApiName: () => 'Summe' },
        },
        {
          provide: JobOverviewService,
          useValue: {
            loadRows: jest.fn().mockResolvedValue([]),
            getRowsForSchedule,
            getLatestRowForSchedule: jest.fn(),
          },
        },
        {
          provide: ScheduleExecutionService,
          useValue: { triggerExecution, pendingScheduleIds: () => new Set<string>() },
        },
        {
          provide: KommonitorDataGridHelperService,
          useValue: { buildDefaultColDef: () => ({}), buildGridOptions: () => ({}) },
        },
        { provide: AdminModalService, useValue: { open } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
  });

  describe('which schedules are shown', () => {
    it('hides a schedule whose target indicator is not accessible', async () => {
      await build();
      expect(component.rowData().map((s: any) => s.scheduleID)).not.toContain('s-no-indicator');
    });

    it('hides a schedule with an inaccessible target spatial unit', async () => {
      await build();
      expect(component.rowData().map((s: any) => s.scheduleID)).not.toContain('s-no-su');
    });

    it('keeps a fully accessible schedule', async () => {
      await build();
      expect(component.rowData().map((s: any) => s.scheduleID)).toEqual(['s-visible']);
    });
  });

  describe('column toggles', () => {
    const headers = () => component.columnDefs().map((c: any) => c.headerName);

    it('hides the id columns by default and shows them on demand', async () => {
      await build();
      const before = headers().length;

      component.onToggleScriptIds();

      expect(component.showScriptIds()).toBe(true);
      expect(headers().length).toBe(before + 2);
    });

    it('shows the methodology column by default and drops it when switched off', async () => {
      await build();
      const before = headers().length;

      component.onToggleProcessDescription();

      expect(component.showProcessDescription()).toBe(false);
      expect(headers().length).toBe(before - 1);
    });
  });

  describe('row actions', () => {
    it("opens the job overview with only this schedule's jobs", async () => {
      await build();

      component.onClickShowJobs(VISIBLE);

      expect(getRowsForSchedule).toHaveBeenCalledWith(VISIBLE);
      const [modalComponent, , setup] = open.mock.calls[0];
      expect(modalComponent).toBe(JobOverviewModalComponent);
      expect(setup.rows).toEqual([{ job: { jobID: 'j1' } }]);
    });

    it('hands a manual run to the execution service', async () => {
      await build();

      await component.onClickExecuteSchedule(VISIBLE);

      expect(triggerExecution).toHaveBeenCalledWith(VISIBLE);
    });

    it('swallows a rejected run, since the service already reported it', async () => {
      triggerExecution.mockRejectedValue(new Error('403'));
      await build();

      await expect(component.onClickExecuteSchedule(VISIBLE)).resolves.toBeUndefined();
    });
  });
});
