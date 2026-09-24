import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import {
  DualListBoxComponent,
  dualListInput,
} from 'components/ngComponents/customElements/dual-list-box/dual-list-box.component';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import {
  ProcessFamilyFilter,
  ScheduleDraftService,
} from 'services/schedule-draft-service/schedule-draft.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

/**
 * Step 2: which computation runs, for which indicator, on which spatial units.
 *
 * Changing the target indicator triggers the lookup for an existing schedule —
 * there is at most one per indicator, and saving replaces it.
 */
@Component({
  selector: 'app-schedule-target-step',
  standalone: true,
  imports: [TranslateModule, FormsModule, DualListBoxComponent, LoadingOverlayComponent],
  templateUrl: './schedule-target-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleTargetStepComponent {
  protected draft = inject(ScheduleDraftService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);

  protected readonly families: ProcessFamilyFilter[] = ['all', 'indicator', 'georesource'];

  protected indicators = computed(() =>
    [...this.indicatorStore.availableIndicators].sort((a, b) =>
      (a.indicatorName ?? '').localeCompare(b.indicatorName ?? '')
    )
  );

  protected spatialUnitData = computed<dualListInput>(() => ({
    items: this.spatialUnitStore.availableSpatialUnits.map((unit) => ({
      id: unit.spatialUnitId,
      name: unit.spatialUnitLevel ?? unit.spatialUnitId,
    })),
    selectedItems: this.draft.targetSpatialUnitIds().map((id) => ({
      id,
      name: this.spatialUnitStore.getSpatialUnitMetadataById(id)?.spatialUnitLevel ?? id,
    })),
  }));

  protected familyLabelKey(family: ProcessFamilyFilter): string {
    return 'ADMIN_SCRIPTS.ADD_MODAL.TYPE_FILTER_' + family.toUpperCase();
  }

  protected onFamilyChange(family: string): void {
    this.draft.familyFilter.set(family as ProcessFamilyFilter);
    // The previously chosen type may not be in the narrowed list any more.
    const stillOffered = this.draft
      .availableProcesses()
      .some((process) => process.id === this.draft.selectedProcess()?.id);
    if (!stillOffered) {
      this.draft.selectProcess(undefined);
    }
  }

  protected onProcessChange(processId: string): void {
    this.draft.selectProcess(
      this.draft.availableProcesses().find((process) => process.id === processId)
    );
  }

  protected async onTargetIndicatorChange(indicatorId: string): Promise<void> {
    this.draft.targetIndicatorId.set(indicatorId);
    await this.draft.refreshExistingSchedule();
  }

  protected onSpatialUnitsChange(items: { id: string }[]): void {
    this.draft.targetSpatialUnitIds.set((items ?? []).map((item) => item.id));
  }
}
