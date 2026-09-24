import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ProcessSchedule } from 'components/ngComponents/models/schedules.models';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ScheduleExecutionService } from 'services/schedule-execution-service/schedule-execution.service';

interface TargetIndicatorParams extends ICellRendererParams {
  onExecute: (schedule: ProcessSchedule) => void;
}

/**
 * Column 1: the indicator a schedule writes to, plus the manual run button.
 *
 * The button's busy state comes from `ScheduleExecutionService`'s signal rather
 * than from toggling the DOM node, which is how master does it.
 */
@Component({
  selector: 'app-schedule-target-indicator-cell-renderer',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (indicatorName()) {
      <div>{{ indicatorName() }}</div>
    } @else {
      <!--
        The target indicator can disappear between a run being triggered and the
        table refreshing, so the raw id is shown rather than an empty cell.
      -->
      <div class="text-danger">
        {{ 'ADMIN_SCRIPTS.GRID.TARGET_INDICATOR_MISSING' | translate }}<br />
        <small>{{ targetIndicatorId() }}</small>
      </div>
    }

    <button
      type="button"
      class="btn btn-sm btn-outline-primary mt-2"
      [disabled]="isPending()"
      (click)="execute()"
    >
      @if (isPending()) {
        <i class="fas fa-spinner fa-spin"></i>
      } @else {
        <i class="fas fa-play"></i>
      }
      {{ 'ADMIN_SCRIPTS.GRID.START_COMPUTATION' | translate }}
    </button>
  `,
})
export class ScheduleTargetIndicatorCellRendererComponent implements ICellRendererAngularComp {
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private executionService = inject(ScheduleExecutionService);

  // Signal: refresh() is invoked by AG Grid outside Angular CD (OnPush).
  private schedule = signal<ProcessSchedule | undefined>(undefined);
  private onExecute?: (schedule: ProcessSchedule) => void;

  protected targetIndicatorId = computed(
    () => this.schedule()?.inputs?.target_indicator_id as string | undefined
  );

  protected indicatorName = computed(() => {
    const indicatorId = this.targetIndicatorId();
    return indicatorId
      ? this.indicatorStore.getIndicatorMetadataById(indicatorId)?.indicatorName
      : undefined;
  });

  protected isPending = computed(() => {
    const scheduleId = this.schedule()?.scheduleID;
    return !!scheduleId && this.executionService.pendingScheduleIds().has(scheduleId);
  });

  agInit(params: TargetIndicatorParams): void {
    this.setParams(params);
  }

  refresh(params: TargetIndicatorParams): boolean {
    this.setParams(params);
    return true;
  }

  protected execute(): void {
    const schedule = this.schedule();
    if (schedule) {
      this.onExecute?.(schedule);
    }
  }

  private setParams(params: TargetIndicatorParams): void {
    this.schedule.set(params.data as ProcessSchedule);
    this.onExecute = params.onExecute;
  }
}
