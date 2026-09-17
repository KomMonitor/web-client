import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ProcessSchedule } from 'components/ngComponents/models/schedules.models';

const MODE_KEYS: Record<string, string> = {
  ALL: 'ADMIN_SCRIPTS.GRID.TARGET_TIME_ALL',
  MISSING: 'ADMIN_SCRIPTS.GRID.TARGET_TIME_MISSING',
  DATES: 'ADMIN_SCRIPTS.GRID.TARGET_TIME_DATES',
};

/** Column: which target dates a schedule computes. */
@Component({
  selector: 'app-schedule-target-times-cell-renderer',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (modeKey()) {
      <div>{{ modeKey() | translate }}</div>
    }

    @if (excludeDates().length > 0) {
      <div class="mt-2">
        <small class="text-muted">{{ 'ADMIN_SCRIPTS.GRID.TARGET_TIME_EXCLUDE' | translate }}</small>
        <br />
        {{ excludeDates().join(', ') }}
      </div>
    }

    @if (includeDates().length > 0) {
      <div class="mt-2">
        <small class="text-muted">{{ includeLabelKey() | translate }}</small>
        <br />
        {{ includeDates().join(', ') }}
      </div>
    }
  `,
})
export class ScheduleTargetTimesCellRendererComponent implements ICellRendererAngularComp {
  // Signal: refresh() is invoked by AG Grid outside Angular CD (OnPush).
  private schedule = signal<ProcessSchedule | undefined>(undefined);

  private targetTime = computed(() => this.schedule()?.inputs?.target_time?.value);

  protected modeKey = computed(() => MODE_KEYS[this.targetTime()?.mode ?? ''] ?? '');

  protected includeDates = computed(() => this.targetTime()?.includeDates ?? []);
  protected excludeDates = computed(() => this.targetTime()?.excludeDates ?? []);

  /** In DATES mode the include list is the selection, otherwise an addition. */
  protected includeLabelKey = computed(() =>
    this.targetTime()?.mode === 'DATES'
      ? 'ADMIN_SCRIPTS.GRID.TARGET_TIME_INCLUDE'
      : 'ADMIN_SCRIPTS.GRID.TARGET_TIME_INCLUDE_ADDITIONAL'
  );

  agInit(params: ICellRendererParams): void {
    this.schedule.set(params.data as ProcessSchedule);
  }

  refresh(params: ICellRendererParams): boolean {
    this.schedule.set(params.data as ProcessSchedule);
    return true;
  }
}
