import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  SpatialUnitHierarchyMemberType,
  SpatialUnitHierarchyOverviewType,
} from 'models/data-management-api';
import { MandantService } from 'services/mandant-service/mandant.service';

import { KmColorPickerComponent } from '../../../../customElements/color-picker/km-color-picker.component';
import {
  KmLinePatternPickerComponent,
  LinePatternOption,
} from '../../../../customElements/line-pattern-picker/km-line-pattern-picker.component';
import { FormControlAriaDirective } from '../../../adminShared/formError/form-control-aria.directive';
import { FormErrorComponent } from '../../../adminShared/formError/form-error.component';
import {
  HierarchyAssignmentRow,
  HierarchyAssignmentSummary,
  assignmentSummary,
  buildAssignmentRow,
  orderedMembersOf,
} from '../hierarchy-assignment.model';
import { SpatialUnitMetadataStepGroup } from '../spatial-unit-add-form.model';

/**
 * The first step of the spatial unit add wizard: what the new level is called,
 * whether it is an outline layer, and which hierarchies it joins.
 *
 * Its own component because the assignment panel is a form of its own — a
 * tenant, a row per hierarchy and the rules between them — and the wizard's
 * template is long enough without it.
 *
 * **The tenant is chosen here and leads.** A spatial unit may only join
 * hierarchies of its own tenant ("A spatial unit may only be placed into
 * hierarchies of its own mandant", 400 otherwise), and its tenant follows from
 * the owning organization picked two steps later. Deriving the offer from that
 * later step would make this one depend on a page the user has not seen yet,
 * so the direction is reversed: the tenant chosen here narrows the owners
 * offered there.
 */
@Component({
  selector: 'app-spatial-unit-metadata-step',
  templateUrl: './spatial-unit-metadata-step.component.html',
  styleUrls: ['./spatial-unit-metadata-step.component.scss'],
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    FormErrorComponent,
    FormControlAriaDirective,
    KmColorPickerComponent,
    KmLinePatternPickerComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialUnitMetadataStepComponent implements OnInit {
  private readonly mandantService = inject(MandantService);
  private readonly destroyRef = inject(DestroyRef);

  /** The wizard's `metadata` child group; the host builds and owns it. */
  @Input({ required: true }) group!: SpatialUnitMetadataStepGroup;

  /**
   * Every hierarchy the user may see, across tenants. Narrowed here rather
   * than by the host: the tenant is chosen in this step and may change while
   * the dialog is open, so a pre-filtered list would go stale on the first
   * switch.
   */
  @Input() set hierarchies(value: readonly SpatialUnitHierarchyOverviewType[]) {
    this.allHierarchies.set(value ?? []);
  }

  /** Mutable, because the picker's own input is — its options are not readonly. */
  @Input() linePatternOptions: LinePatternOption[] = [];

  /**
   * The caller fixed the tenant, so the field only shows it. True where the
   * wizard was opened out of a view that already works in one tenant.
   */
  @Input() mandantLocked = false;

  /** The host owns the stepper, so moving on is its decision to carry out. */
  @Output() next = new EventEmitter<void>();

  private readonly allHierarchies = signal<readonly SpatialUnitHierarchyOverviewType[]>([]);

  /** The tenants to choose from; empty without Keycloak, where none is known. */
  protected readonly mandants = this.mandantService.mandantRefs;

  /** A choice of one is no choice — and only an admin may look across tenants. */
  protected get mandantIsChoosable(): boolean {
    return !this.mandantLocked && this.mandantService.isRealmAdmin && this.mandants.length > 1;
  }

  protected get mandantName(): string {
    return this.mandantService.mandantNameOf(this.group.controls.mandantId.value);
  }

  protected get rows() {
    return this.group.controls.hierarchyAssignments;
  }

  /**
   * The tenant the form names. Mirrored into a signal, because the options
   * below follow it and an OnPush template does not re-read a plain control
   * value on its own. Fed in `ngOnInit`, once the group has arrived.
   */
  private readonly chosenMandantId = signal('');

  ngOnInit(): void {
    const control = this.group.controls.mandantId;
    this.chosenMandantId.set(control.value);
    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((mandantId) => this.chosenMandantId.set(mandantId));
  }

  /**
   * The hierarchies on offer: those of the chosen tenant, plus those that name
   * no tenant at all. Unknown is not the same as "belongs to someone else" —
   * `mandantId` is optional in the schema, and older deployments answer
   * without it, where a strict comparison would leave the panel empty.
   */
  protected readonly hierarchyOptions = computed(() => {
    const mandantId = this.chosenMandantId();
    const hierarchies = this.allHierarchies();
    return mandantId
      ? hierarchies.filter((entry) => !entry.mandantId || entry.mandantId === mandantId)
      : hierarchies;
  });

  /** The levels a row may place the new one against — its hierarchy's chain. */
  protected referenceOptionsFor(index: number): readonly SpatialUnitHierarchyMemberType[] {
    return orderedMembersOf(this.hierarchyOf(this.rowValue(index).hierarchyId));
  }

  /** What the row does, in words, under the row. */
  protected summaryFor(index: number): HierarchyAssignmentSummary | null {
    return assignmentSummary(this.rowValue(index), this.allHierarchies());
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
