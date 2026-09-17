import { Component, EventEmitter, Input, NO_ERRORS_SCHEMA, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { AgGridAngular } from 'ag-grid-angular';

import { JobOverviewTableComponent } from './job-overview-table.component';
import { JobOverviewRow } from 'components/ngComponents/models/jobs.models';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';

@Component({ selector: 'ag-grid-angular', standalone: true, template: '' })
class AgGridStubComponent {
  @Input() gridOptions: unknown;
  @Input() rowData: unknown;
  @Input() columnDefs: unknown;
  @Input() defaultColDef: unknown;
  @Output() gridReady = new EventEmitter<unknown>();
}

/**
 * The property under test is what the table does *not* do: it never replaces
 * its rows on its own. Summaries arrive after the grid is on screen and the
 * cells pick them up by themselves, because the cache is a signal. Were the
 * rows replaced instead, AG Grid 31 would rebuild every row node and drop the
 * user's filter, sort and column widths (I12).
 */
describe('JobOverviewTableComponent', () => {
  let fixture: ComponentFixture<JobOverviewTableComponent>;
  let loadSummaries: jest.Mock;
  let settleSummaries: (rejected?: boolean) => void;

  const ROWS = [
    { job: { jobID: 'j1', status: 'successful' }, processTitle: 'Summe' },
    { job: { jobID: 'j2', status: 'failed', message: 'kaputt' }, processTitle: 'Summe' },
  ] as unknown as JobOverviewRow[];

  const grid = () => fixture.debugElement.query(By.directive(AgGridStubComponent));

  const build = (rows: JobOverviewRow[] = ROWS) => {
    fixture = TestBed.createComponent(JobOverviewTableComponent);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
  };

  beforeEach(() => {
    loadSummaries = jest.fn().mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          settleSummaries = (rejected = false) =>
            rejected ? reject(new Error('500')) : resolve(new Map());
        })
    );

    TestBed.configureTestingModule({
      imports: [JobOverviewTableComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: JobOverviewService,
          useValue: { loadSummaries, getSummary: () => undefined },
        },
        {
          provide: KommonitorDataGridHelperService,
          useValue: { buildDefaultColDef: () => ({}), buildGridOptions: () => ({}) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    TestBed.overrideComponent(JobOverviewTableComponent, {
      remove: { imports: [AgGridAngular] },
      add: { imports: [AgGridStubComponent] },
    });
  });

  it('keeps the very same row array across the summary load, so the grid is never rebuilt', async () => {
    build();

    const gridBefore = grid().componentInstance;
    expect(gridBefore.rowData).toBe(ROWS);
    expect(loadSummaries).toHaveBeenCalledWith(ROWS);

    settleSummaries();
    await fixture.whenStable();
    fixture.detectChanges();

    // Same grid instance, same array identity: no teardown, no setRowData.
    expect(grid().componentInstance).toBe(gridBefore);
    expect(grid().componentInstance.rowData).toBe(ROWS);
    expect((fixture.componentInstance as any).loadingSummaries()).toBe(false);
  });

  it('leaves the table standing when the summaries cannot be loaded at all', async () => {
    build();

    settleSummaries(true);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(grid().componentInstance.rowData).toBe(ROWS);
    expect((fixture.componentInstance as any).loadingSummaries()).toBe(false);
  });

  it('loads the summaries again when the host hands over a different selection', async () => {
    build();
    settleSummaries();
    await fixture.whenStable();

    const failedOnly = [ROWS[1]];
    fixture.componentRef.setInput('rows', failedOnly);
    fixture.detectChanges();

    expect(loadSummaries).toHaveBeenCalledTimes(2);
    expect(loadSummaries).toHaveBeenLastCalledWith(failedOnly);
  });

  it('shows a hint instead of an empty grid when the host filtered everything away', () => {
    build([]);

    expect(grid()).toBeNull();
    expect(fixture.nativeElement.querySelector('p')).not.toBeNull();
  });
});
