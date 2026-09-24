import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ProcessSchedule } from 'components/ngComponents/models/schedules.models';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

interface SpatialUnitParams extends ICellRendererParams {
  /** Mirrors the "show ids" toggle above the table. */
  showIds: () => boolean;
}

/** Column: the spatial unit levels a schedule computes for. */
@Component({
  selector: 'app-schedule-spatial-units-cell-renderer',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (levels().length > 0) {
      @if (showIds()) {
        <table class="table table-sm table-bordered table-striped">
          <thead>
            <tr>
              <th>{{ 'ADMIN_SHARED.ID' | translate }}</th>
              <th>{{ 'ADMIN_SHARED.NAME' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (level of levels(); track level.id) {
              <tr>
                <td>{{ level.id }}</td>
                <td>{{ level.name }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        @for (level of levels(); track level.id) {
          <div>{{ level.name }}</div>
        }
      }
    } @else {
      {{ 'ADMIN_SCRIPTS.GRID.NONE' | translate }}
    }
  `,
})
export class ScheduleSpatialUnitsCellRendererComponent implements ICellRendererAngularComp {
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);

  // Signal: refresh() is invoked by AG Grid outside Angular CD (OnPush).
  private schedule = signal<ProcessSchedule | undefined>(undefined);
  private showIdsAccessor = signal<() => boolean>(() => false);

  protected showIds = computed(() => this.showIdsAccessor()());

  protected levels = computed(() => {
    const ids = (this.schedule()?.inputs?.target_spatial_units ?? []) as string[];
    return ids.map((id) => ({
      id,
      // Falls back to the id: a level the user cannot see is filtered out of
      // the table entirely (B6), but a stale reference should still read.
      name: this.spatialUnitStore.getSpatialUnitMetadataById(id)?.spatialUnitLevel ?? id,
    }));
  });

  agInit(params: SpatialUnitParams): void {
    this.setParams(params);
  }

  refresh(params: SpatialUnitParams): boolean {
    this.setParams(params);
    return true;
  }

  private setParams(params: SpatialUnitParams): void {
    this.schedule.set(params.data as ProcessSchedule);
    if (params.showIds) {
      // set() stores the accessor itself; wrapping it would store a function
      // that returns a function.
      this.showIdsAccessor.set(params.showIds);
    }
  }
}
