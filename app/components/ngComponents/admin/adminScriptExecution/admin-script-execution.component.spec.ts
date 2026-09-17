import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

import { AdminScriptExecutionComponent } from './admin-script-execution.component';
import { JobOverviewModalComponent } from './jobOverviewModal/job-overview-modal.component';
import { AdminModalService } from '../adminShared/modal/admin-modal.service';
import { AuthService } from 'services/auth-service/auth.service';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';

describe('AdminScriptExecutionComponent', () => {
  let fixture: ComponentFixture<AdminScriptExecutionComponent>;
  let loadRows: jest.Mock;
  let clearSummaryCache: jest.Mock;
  let open: jest.Mock;
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
    open = jest.fn().mockResolvedValue(undefined);
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
        { provide: AdminModalService, useValue: { open } },
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

  it('opens the overview with only the jobs of the clicked status', async () => {
    await build();
    const component = fixture.componentInstance as any;

    component.openJobsForStatus({
      status: 'successful',
      labelKey: 'ADMIN_SCRIPTS.EXECUTION.SUCCEEDED_JOBS',
      color: '#00a65a',
      accent: 'green',
    });

    expect(open).toHaveBeenCalledTimes(1);
    const [component_, , setup] = open.mock.calls[0];
    expect(component_).toBe(JobOverviewModalComponent);
    expect(setup.rows.map((r: any) => r.job.jobID)).toEqual(['j1', 'j2']);
    expect(setup.accent).toBe('green');
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
