import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  CronInputMode,
  CronUnit,
  INTERVAL_UNITS,
  isValidCronPattern,
} from 'services/processes-api-service/cron-builder.util';
import { describeCron, nextExecution } from 'services/processes-api-service/cron-format.util';
import { ScheduleDraftService } from 'services/schedule-draft-service/schedule-draft.service';

/**
 * Step 4: which target dates are computed, and when the computation runs.
 *
 * The cron pattern is either assembled from the three builder modes or typed in
 * directly. Whichever way it came about, the plain-text reading and the next
 * occurrence are shown underneath — master keeps a separate error block for the
 * pattern, which commit `5273d784` removes.
 */
@Component({
  selector: 'app-schedule-timing-step',
  standalone: true,
  imports: [TranslateModule, FormsModule],
  templateUrl: './schedule-timing-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleTimingStepComponent {
  protected draft = inject(ScheduleDraftService);

  protected readonly modes: CronInputMode[] = ['once', 'interval', 'everyFirst'];
  /** `week` and `year` are missing on purpose: cron cannot express them as an interval. */
  protected readonly intervalUnits = INTERVAL_UNITS;
  protected readonly onceUnits: CronUnit[] = ['minute', 'hour', 'day', 'week', 'month', 'year'];
  protected readonly weekdays = [0, 1, 2, 3, 4, 5, 6];
  protected readonly months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  protected readonly targetTimeModes = ['ALL', 'MISSING', 'DATES'] as const;

  protected cronText = computed(() => describeCron(this.draft.cron()));
  protected cronValid = computed(() => isValidCronPattern(this.draft.cron()));
  protected nextRun = computed(() => {
    const date = nextExecution(this.draft.cron());
    return date ? date.toLocaleString('de-DE') : '';
  });

  protected cronModeLabelKey(mode: CronInputMode): string {
    return 'ADMIN_SCRIPTS.ADD_MODAL.CRON_MODE_' + mode.toUpperCase();
  }

  protected cronUnitLabelKey(unit: CronUnit): string {
    return 'ADMIN_SCRIPTS.ADD_MODAL.CRON_UNIT_' + unit.toUpperCase();
  }

  protected setTargetTimeMode(mode: string): void {
    this.draft.targetTime.update((current) => ({
      ...current,
      mode: mode as 'ALL' | 'MISSING' | 'DATES',
    }));
  }

  protected toggleDate(list: 'includeDates' | 'excludeDates', date: string): void {
    this.draft.targetTime.update((current) => {
      const selected = current[list];
      return {
        ...current,
        [list]: selected.includes(date)
          ? selected.filter((entry) => entry !== date)
          : [...selected, date].sort(),
      };
    });
  }

  protected isSelected(list: 'includeDates' | 'excludeDates', date: string): boolean {
    return this.draft.targetTime()[list].includes(date);
  }

  protected setCron<K extends keyof ReturnType<ScheduleDraftService['cronSelection']>>(
    key: K,
    value: unknown
  ): void {
    this.draft.cronSelection.update((current) => ({ ...current, [key]: value }));
  }

  protected setCronNumber(key: string, value: string | number): void {
    const parsed = Number(value);
    this.draft.cronSelection.update((current) => ({
      ...current,
      [key]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  }

  /** Switching to manual seeds the field with the pattern built so far. */
  protected onToggleManual(useManual: boolean): void {
    if (useManual) {
      this.draft.manualCron.set(this.draft.cron());
    }
    this.draft.useManualCron.set(useManual);
  }
}
