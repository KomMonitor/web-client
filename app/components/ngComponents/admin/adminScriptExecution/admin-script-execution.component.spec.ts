import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

import { AdminScriptExecutionComponent } from './admin-script-execution.component';
import { AuthService } from 'services/auth-service/auth.service';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';

describe('AdminScriptExecutionComponent', () => {
  let fixture: ComponentFixture<AdminScriptExecutionComponent>;
  let loadRows: jest.Mock;
  let clearSummaryCache: jest.Mock;
  let isAuthenticated: jest.Mock;

  const row = (jobID: string, status: string) => ({
    job: { jobID, status },
    targetIndicatorName: 'Bevölkerung',
    targetIndicatorId: 'ind-1',
    processTitle: 'Summe',
  });

  const ROWS = [
    row('j1', 'successful'),
    row('j2', 'successful'),
    row('j3', 'failed'),
    row('j4', 'running'),
  ];

  const build = async () => {
    fixture = TestBed.createComponent(AdminScriptExecutionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    loadRows = jest.fn().mockResolvedValue(ROWS);
    clearSummaryCache = jest.fn();
    isAuthenticated = jest.fn().mockReturnValue(true);

    TestBed.configureTestingModule({
      imports: [AdminScriptExecutionComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: JobOverviewService,
          useValue: {
            loadRows,
            clearSummaryCache,
            countByStatus: (rows: any[], status: string) =>
              rows.filter((r) => r.job.status === status).length,
          },
        },
        { provide: AuthService, useValue: { isAuthenticated } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
  });

  it('counts the jobs per status for the tiles', async () => {
    await build();
    const component = fixture.componentInstance as any;

    expect(component.totalJobs()).toBe(4);
    expect(component.countFor('successful')).toBe(2);
    expect(component.countFor('failed')).toBe(1);
    expect(component.countFor('running')).toBe(1);
    expect(component.countFor('accepted')).toBe(0);
  });

  it('expands the table and filters it to the clicked status', async () => {
    await build();
    const component = fixture.componentInstance as any;

    component.showJobsForStatus({
      status: 'successful',
      labelKey: 'ADMIN_SCRIPTS.EXECUTION.SUCCEEDED_JOBS',
      color: '#00a65a',
      boxColor: 'green',
    });

    expect(component.selectedStatus()).toBe('successful');
    expect(component.tableCollapsed()).toBe(false);
    expect(component.tableOpened()).toBe(true);
    expect(component.filteredRows().map((r: any) => r.job.jobID)).toEqual(['j1', 'j2']);
    expect(component.selectedTile().boxColor).toBe('green');
  });

  it('shows every job again once the status filter is cleared', async () => {
    await build();
    const component = fixture.componentInstance as any;

    component.showJobsForStatus({ status: 'failed', labelKey: '', color: '', boxColor: 'red' });
    expect(component.filteredRows().length).toBe(1);

    component.clearStatusFilter();

    expect(component.selectedStatus()).toBeNull();
    expect(component.filteredRows().length).toBe(4);
    // Clearing the filter must not close the table the user just opened.
    expect(component.tableCollapsed()).toBe(false);
  });

  /**
   * The table is built on first expand, not on page load — the box keeps its
   * content alive while collapsed, so an unguarded table would fetch the
   * summaries whether or not anyone looks.
   */
  it('does not build the table before it is expanded', async () => {
    await build();
    const component = fixture.componentInstance as any;

    expect(component.tableCollapsed()).toBe(true);
    expect(component.tableOpened()).toBe(false);
    expect(fixture.debugElement.queryAll(By.css('app-job-overview-table')).length).toBe(0);

    component.onTableCollapsedChange(false);

    expect(component.tableOpened()).toBe(true);
  });

  /**
   * The box owns its collapsed state internally, so a tile click could not
   * reopen a box the user closed unless we track the toggle.
   */
  it('reopens the table for a tile click after the user collapsed it', async () => {
    await build();
    const component = fixture.componentInstance as any;

    component.onTableCollapsedChange(true);
    expect(component.tableCollapsed()).toBe(true);

    component.showJobsForStatus({ status: 'failed', labelKey: '', color: '', boxColor: 'red' });

    expect(component.tableCollapsed()).toBe(false);
  });

  it('refresh drops cached summaries and reloads', async () => {
    await build();
    const component = fixture.componentInstance as any;

    await component.refreshJobOverviewTable();

    expect(clearSummaryCache).toHaveBeenCalledTimes(1);
    expect(loadRows).toHaveBeenCalledTimes(2);
  });

  it('asks for a login instead of showing an empty page when unauthenticated', async () => {
    isAuthenticated.mockReturnValue(false);
    await build();

    expect((fixture.componentInstance as any).loginRequired()).toBe(true);
    // No tiles are rendered — an empty count would read as "no jobs exist".
    expect(fixture.debugElement.queryAll(By.css('app-small-box')).length).toBe(0);
  });

  it('renders five tiles once jobs are loaded', async () => {
    await build();
    expect(fixture.debugElement.queryAll(By.css('app-small-box')).length).toBe(5);
  });
});
