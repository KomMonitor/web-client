import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { KIND_LABELS } from './dataset-permissions.labels';
import {
  DATASET_KINDS,
  DatasetKind,
  GroupPermissionIds,
  PermissionDataset,
  PermissionSlot,
  RIGHT_LEVELS,
  RightLevel,
  RightsDraft,
  TriState,
  countDeviations,
  currentDraft,
  datasetKey,
  draftDeviates,
  draftState,
  hasForeignTimeseries,
  levelSlots,
  publicState,
  setDraftLevel,
  timeseriesCount,
} from './dataset-permissions.model';
import { ForeignOwnerBadgeComponent } from './foreign-owner-badge.component';
import { PublicBadgeComponent } from './public-badge.component';
import { TriStateCheckboxDirective } from './tri-state-checkbox.directive';

const LEVEL_LABELS: Record<RightLevel, string> = {
  viewer: 'ADMIN_DATASET_PERMISSIONS.GROUP_DIALOG.VIEWER',
  editor: 'ADMIN_DATASET_PERMISSIONS.GROUP_DIALOG.EDITOR',
};

interface KindGroup {
  kind: DatasetKind;
  label: string;
  datasets: readonly PermissionDataset[];
  /** The checkboxes of all its datasets, per level. */
  cells: Record<RightLevel, readonly PermissionSlot[]>;
}

/**
 * The per-dataset rights of one group, opened from the group table of the
 * dataset-permissions wizard: read and edit per dataset, and for an indicator
 * read per spatial unit — edit there holds for the whole indicator, as the
 * backend checks it on the indicator itself. Starts from what the group table
 * currently decides and marks every value that differs from the current rights.
 *
 * Closes with the edited draft on "apply" — the wizard turns it into the
 * dropdown values — and is dismissed otherwise. It works on what the opener
 * hands in and knows nothing of the wizard's state.
 *
 * Opened with `MODAL_LARGE` above the wizard, so Esc and a click beside it do
 * not close it.
 */
@Component({
  selector: 'app-group-dataset-permissions-modal',
  templateUrl: './group-dataset-permissions-modal.component.html',
  styleUrls: ['./group-dataset-permissions-modal.component.scss'],
  imports: [
    TranslateModule,
    NgTemplateOutlet,
    TriStateCheckboxDirective,
    PublicBadgeComponent,
    ForeignOwnerBadgeComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupDatasetPermissionsModalComponent implements OnInit {
  private readonly activeModal = inject(NgbActiveModal);

  // Set by the opener before the dialog renders.
  group!: GroupPermissionIds;
  /** The datasets selected in the wizard. */
  datasets: readonly PermissionDataset[] = [];
  /** The rights the dialog opens with: the current ones with the group table's decision applied. */
  initialDraft: RightsDraft = {};
  /** Name of an organizational unit, for timeseries of another owner; the id if unknown. */
  ownerNameOf: (id: string) => string = (id) => id;

  protected readonly levels = RIGHT_LEVELS;
  protected readonly levelLabels = LEVEL_LABELS;
  protected readonly datasetKey = datasetKey;
  protected readonly timeseriesCount = timeseriesCount;
  protected readonly levelSlots = levelSlots;
  protected readonly publicState = publicState;
  protected readonly hasForeignTimeseries = hasForeignTimeseries;

  /** Only kinds with datasets; computed once, the inputs do not change. */
  protected kindGroups: KindGroup[] = [];

  protected readonly draft = signal<RightsDraft>({});
  private readonly expandedKinds = signal<ReadonlySet<DatasetKind>>(new Set());
  private readonly expandedDatasets = signal<ReadonlySet<string>>(new Set());

  /** Number of checkboxes that differ from the current rights. */
  protected readonly deviations = computed(() =>
    countDeviations(this.group, this.datasets, this.draft())
  );

  ngOnInit(): void {
    this.kindGroups = DATASET_KINDS.map((kind) => {
      const datasets = this.datasets.filter((dataset) => dataset.kind === kind);
      const cellsOf = (level: RightLevel) => datasets.flatMap((d) => levelSlots(d, level));
      return {
        kind,
        label: KIND_LABELS[kind],
        datasets,
        cells: { viewer: cellsOf('viewer'), editor: cellsOf('editor') },
      };
    }).filter((group) => group.datasets.length > 0);
    this.draft.set(this.initialDraft);
  }

  protected stateOf(slots: readonly PermissionSlot[], level: RightLevel): TriState {
    return draftState(this.group, slots, this.draft(), level);
  }

  protected deviates(slots: readonly PermissionSlot[], level: RightLevel): boolean {
    return draftDeviates(this.group, slots, this.draft(), level);
  }

  /** Partly or not set → set on all; set on all → clear on all. */
  protected toggle(slots: readonly PermissionSlot[], level: RightLevel): void {
    const value = this.stateOf(slots, level) !== 'all';
    this.draft.update((draft) =>
      setDraftLevel(this.group, this.datasets, slots, draft, level, value)
    );
  }

  protected isKindExpanded(kind: DatasetKind): boolean {
    return this.expandedKinds().has(kind);
  }

  protected toggleKind(kind: DatasetKind): void {
    this.expandedKinds.update((current) => toggled(current, kind));
  }

  protected isDatasetExpanded(dataset: PermissionDataset): boolean {
    return this.expandedDatasets().has(datasetKey(dataset));
  }

  protected toggleDataset(dataset: PermissionDataset): void {
    this.expandedDatasets.update((current) => toggled(current, datasetKey(dataset)));
  }

  /** Back to the current rights — not to what the dialog opened with. */
  reset(): void {
    this.draft.set(currentDraft(this.group, this.datasets));
  }

  apply(): void {
    this.activeModal.close(this.draft());
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}

function toggled<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
  const next = new Set(set);
  if (!next.delete(value)) {
    next.add(value);
  }
  return next;
}
