import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import {
  SpatialUnitHierarchyMemberType,
  SpatialUnitHierarchyOverviewType,
} from 'models/data-management-api';

import {
  HierarchyAssignmentRow,
  HierarchyAssignmentRowGroup,
  HierarchyAssignmentSummary,
  assignmentSummary,
  buildAssignmentRow,
  chainWithout,
} from './hierarchy-assignment.model';

/**
 * Which hierarchies a spatial unit level belongs to, one row per hierarchy:
 * the hierarchy, where in its chain the level sits, and against which level.
 *
 * Shared by both dialogs that assign a level — the add wizard, where every row
 * is new, and the edit dialog, where a row may describe a membership that
 * already exists. The rules are the same either way and live as pure functions
 * next to this file; what differs is only where the rows come from.
 *
 * The `FormArray` stays the host's: both dialogs reach into it themselves —
 * the wizard clears it when the tenant changes, the edit dialog refills it from
 * the dataset — so the panel renders and mutates it but never owns or replaces
 * it. That is also why there is no output.
 *
 * Anything the host wants inside the panel's box, such as the wizard's tenant
 * select, is projected in.
 */
@Component({
  selector: 'app-hierarchy-assignment-panel',
  templateUrl: './hierarchy-assignment-panel.component.html',
  styleUrls: ['./hierarchy-assignment-panel.component.scss'],
  imports: [ReactiveFormsModule, TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HierarchyAssignmentPanelComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * The rows to render; built and owned by the host.
   *
   * The subscription is what makes a host-side change show up. Both dialogs
   * reach into the array themselves — the wizard clears it on a tenant switch,
   * the edit dialog refills it from the dataset — and neither replaces the
   * array, so this view never sees a changed input and would keep rendering
   * the rows it last drew.
   */
  @Input({ required: true }) set rows(value: FormArray<HierarchyAssignmentRowGroup>) {
    this.rowArray = value;
    this.rowChanges?.unsubscribe();
    this.rowChanges = value?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  get rows(): FormArray<HierarchyAssignmentRowGroup> {
    return this.rowArray;
  }

  private rowArray!: FormArray<HierarchyAssignmentRowGroup>;
  private rowChanges?: Subscription;

  /**
   * Every hierarchy the user may see, across tenants. Narrowed here rather than
   * by the host: the tenant may change while the dialog is open, so a
   * pre-filtered list would go stale on the first switch.
   */
  @Input() set hierarchies(value: readonly SpatialUnitHierarchyOverviewType[]) {
    this.allHierarchies.set(value ?? []);
  }

  /** The tenant to narrow the offer to; the empty string offers everything. */
  @Input() set mandantId(value: string) {
    this.chosenMandantId.set(value ?? '');
  }

  /** Named in the scope line above the rows; an empty name hides that line. */
  @Input() mandantName = '';

  /**
   * The unit these rows belong to, where it already exists — the edit dialog.
   * It is left out of the chains the rows are read against: a level is neither
   * its own reference nor its own neighbour when it appends. Empty in the add
   * wizard, whose level is in no chain yet.
   */
  @Input() set selfSpatialUnitId(value: string) {
    this.selfId.set(value ?? '');
  }

  private readonly allHierarchies = signal<readonly SpatialUnitHierarchyOverviewType[]>([]);
  private readonly chosenMandantId = signal('');
  private readonly selfId = signal('');

  /**
   * The hierarchies on offer: those of the chosen tenant, plus those that name
   * no tenant at all. Unknown is not the same as "belongs to someone else" —
   * `mandantId` is optional in the schema, and older deployments answer
   * without it, where a strict comparison would leave the panel empty.
   */
  protected readonly hierarchyOptions = computed(() => {
    const mandantId = this.chosenMandantId();
    const hierarchies = this.allHierarchies();
    if (!mandantId) {
      return hierarchies;
    }
    const selfId = this.selfId();
    return hierarchies.filter(
      (entry) =>
        !entry.mandantId ||
        entry.mandantId === mandantId ||
        // A hierarchy the unit is already in stays on offer whatever the filter
        // says: a row whose hierarchy is missing from the select would read as
        // blank and take the membership with it on the next save.
        (entry.members ?? []).some((member) => member.spatialUnitId === selfId)
    );
  });

  /** The levels a row may place this one against — its hierarchy's chain. */
  protected referenceOptionsFor(index: number): readonly SpatialUnitHierarchyMemberType[] {
    return chainWithout(this.hierarchyOf(this.rowValue(index).hierarchyId), this.selfId());
  }

  /** What the row says, in words, under the row. */
  protected summaryFor(index: number): HierarchyAssignmentSummary | null {
    return assignmentSummary(this.rowValue(index), this.allHierarchies(), this.selfId());
  }

  protected addRow(): void {
    this.rows.push(buildAssignmentRow());
  }

  protected removeRow(index: number): void {
    this.rows.removeAt(index);
  }

  /**
   * A reference level of the hierarchy that was left behind would be sent as a
   * neighbour that is not in that chain, so the row starts over at "append".
   */
  protected onHierarchyChange(index: number): void {
    this.rows.at(index).patchValue({ placement: 'append', referenceSpatialUnitId: '' });
  }

  /** Appending needs no reference; a leftover one would travel unused. */
  protected onPlacementChange(index: number): void {
    if (this.rowValue(index).placement === 'append') {
      this.rows.at(index).controls.referenceSpatialUnitId.setValue('');
    }
  }

  private rowValue(index: number): HierarchyAssignmentRow {
    return this.rows.at(index).getRawValue();
  }

  private hierarchyOf(hierarchyId: string): SpatialUnitHierarchyOverviewType | undefined {
    return this.allHierarchies().find((entry) => entry.hierarchyId === hierarchyId);
  }
}
