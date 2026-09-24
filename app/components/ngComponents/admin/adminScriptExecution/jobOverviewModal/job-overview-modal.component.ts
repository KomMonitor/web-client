import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { JobOverviewRow } from 'components/ngComponents/models/jobs.models';
import { JobOverviewTableComponent } from '../jobOverviewTable/job-overview-table.component';

/** Header accent of the dialog, matching the tile that opened it. */
export type JobOverviewAccent = 'primary' | 'green' | 'red' | 'cyan' | 'orange';

const ACCENT_COLORS: Record<JobOverviewAccent, string> = {
  primary: '#337ab7',
  green: '#00a65a',
  red: '#dd4b39',
  cyan: '#00c0ef',
  orange: '#ff851b',
};

/**
 * The job table in a dialog, opened by the script management for the jobs of
 * one schedule.
 *
 * Chrome only — title, accent and the close button. The table itself is
 * `JobOverviewTableComponent`, which the indicator-calculation page shows
 * inline under its status tiles; both hosts pass the rows they want seen.
 */
@Component({
  selector: 'app-job-overview-modal',
  standalone: true,
  imports: [TranslateModule, JobOverviewTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-overview-modal.component.html',
})
export class JobOverviewModalComponent {
  activeModal = inject(NgbActiveModal);

  /** The jobs to show. The caller has already filtered them. */
  @Input({ required: true }) rows: JobOverviewRow[] = [];
  @Input() titleText = '';
  @Input() accent: JobOverviewAccent = 'primary';

  get accentColor(): string {
    return ACCENT_COLORS[this.accent];
  }

  close(): void {
    this.activeModal.close();
  }
}
