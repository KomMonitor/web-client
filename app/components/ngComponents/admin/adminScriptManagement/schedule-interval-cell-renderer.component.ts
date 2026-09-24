import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ProcessSchedule } from 'components/ngComponents/models/schedules.models';
import { describeCron, nextExecution } from 'services/processes-api-service/cron-format.util';

/** Column: the cron pattern in words, plus the next planned run. */
@Component({
  selector: 'app-schedule-interval-cell-renderer',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>{{ description() }}</div>
    @if (next()) {
      <div class="mt-2">
        <small class="text-muted">{{ 'ADMIN_SCRIPTS.GRID.NEXT_EXECUTION' | translate }}</small>
        <br />
        <i class="far fa-calendar"></i> {{ next() }}
      </div>
    }
  `,
})
export class ScheduleIntervalCellRendererComponent implements ICellRendererAngularComp {
  // Signal: refresh() is invoked by AG Grid outside Angular CD (OnPush).
  private schedule = signal<ProcessSchedule | undefined>(undefined);

  protected description = computed(() => describeCron(this.schedule()?.scheduleCron));

  protected next = computed(() => {
    const date = nextExecution(this.schedule()?.scheduleCron);
    return date ? date.toLocaleString('de-DE') : '';
  });

  agInit(params: ICellRendererParams): void {
    this.schedule.set(params.data as ProcessSchedule);
  }

  refresh(params: ICellRendererParams): boolean {
    this.schedule.set(params.data as ProcessSchedule);
    return true;
  }
}
