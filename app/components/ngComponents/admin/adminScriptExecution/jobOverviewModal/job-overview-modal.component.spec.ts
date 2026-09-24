import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { JobOverviewModalComponent } from './job-overview-modal.component';
import { JobOverviewRow } from 'components/ngComponents/models/jobs.models';
import { JobOverviewTableComponent } from '../jobOverviewTable/job-overview-table.component';

@Component({ selector: 'app-job-overview-table', standalone: true, template: '' })
class JobOverviewTableStubComponent {
  @Input() rows: unknown;
  @Input() height: unknown;
}

/**
 * The dialog is chrome around the shared table, so this covers the chrome:
 * that the rows reach the table untouched and that the accent matches the
 * caller. The table's own behaviour is tested with the table.
 */
describe('JobOverviewModalComponent', () => {
  let fixture: ComponentFixture<JobOverviewModalComponent>;
  let close: jest.Mock;

  const ROWS = [
    { job: { jobID: 'j1', status: 'successful' }, processTitle: 'Summe' },
  ] as unknown as JobOverviewRow[];

  const table = () => fixture.debugElement.query(By.directive(JobOverviewTableStubComponent));

  const build = () => {
    fixture = TestBed.createComponent(JobOverviewModalComponent);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('titleText', 'Jobs - Bevölkerung');
    fixture.componentRef.setInput('accent', 'green');
    fixture.detectChanges();
  };

  beforeEach(() => {
    close = jest.fn();

    TestBed.configureTestingModule({
      imports: [JobOverviewModalComponent, TranslateModule.forRoot()],
      providers: [{ provide: NgbActiveModal, useValue: { close } }],
      schemas: [NO_ERRORS_SCHEMA],
    });

    TestBed.overrideComponent(JobOverviewModalComponent, {
      remove: { imports: [JobOverviewTableComponent] },
      add: { imports: [JobOverviewTableStubComponent] },
    });
  });

  it('hands the callers rows to the shared table', () => {
    build();

    expect(table().componentInstance.rows).toBe(ROWS);
    expect(fixture.nativeElement.querySelector('.modal-title').textContent).toContain(
      'Jobs - Bevölkerung'
    );
  });

  it('colours the header after the tile that opened it', () => {
    build();

    expect(fixture.componentInstance.accentColor).toBe('#00a65a');
  });

  it('closes through the active modal', () => {
    build();

    fixture.componentInstance.close();

    expect(close).toHaveBeenCalled();
  });
});
