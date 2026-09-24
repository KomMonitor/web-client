import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ProcessSchedule } from 'components/ngComponents/models/schedules.models';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';

/**
 * Column: the target indicator's methodology text.
 *
 * `processDescription` is authored as HTML (`<b>`, `<br/>`, `<sub>`), so it is
 * bound through `innerHTML` rather than interpolated — interpolation printed
 * the tags as literal text. Angular sanitizes the binding.
 *
 * The text also carries LaTeX between `$$…$$`. Those stay unrendered until
 * MathJax is back in the app (C10 in the script package, A4 in
 * `OFFENE_PUNKTE.md`).
 */
@Component({
  selector: 'app-schedule-methodology-cell-renderer',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (methodology(); as text) {
      <div [innerHTML]="text"></div>
    } @else {
      <div class="text-danger">
        {{ 'ADMIN_SCRIPTS.GRID.METHODOLOGY_UNAVAILABLE' | translate }}
      </div>
    }
  `,
})
export class ScheduleMethodologyCellRendererComponent implements ICellRendererAngularComp {
  private indicatorStore = inject(IndicatorMetadataStoreService);

  // Signal: refresh() is invoked by AG Grid outside Angular CD (OnPush).
  private schedule = signal<ProcessSchedule | undefined>(undefined);

  protected methodology = computed(() => {
    const indicatorId = this.schedule()?.inputs?.target_indicator_id as string | undefined;
    return indicatorId
      ? this.indicatorStore.getIndicatorMetadataById(indicatorId)?.processDescription
      : undefined;
  });

  agInit(params: ICellRendererParams): void {
    this.schedule.set(params.data as ProcessSchedule);
  }

  refresh(params: ICellRendererParams): boolean {
    this.schedule.set(params.data as ProcessSchedule);
    return true;
  }
}
