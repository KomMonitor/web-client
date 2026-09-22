import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SpatialUnitHierarchyOverviewType } from 'models/data-management-api';
import { MandantService } from 'services/mandant-service/mandant.service';

import { KmColorPickerComponent } from '../../../../customElements/color-picker/km-color-picker.component';
import {
  KmLinePatternPickerComponent,
  LinePatternOption,
} from '../../../../customElements/line-pattern-picker/km-line-pattern-picker.component';
import { FormControlAriaDirective } from '../../../adminShared/formError/form-control-aria.directive';
import { FormErrorComponent } from '../../../adminShared/formError/form-error.component';
import { HierarchyAssignmentPanelComponent } from '../../hierarchyAssignment/hierarchy-assignment-panel.component';
import { SpatialUnitMetadataStepGroup } from '../spatial-unit-add-form.model';

/**
 * The first step of the spatial unit add wizard: what the new level is called,
 * whether it is an outline layer, and which hierarchies it joins.
 *
 * Its own component because the wizard's template is long enough without it.
 * The rows themselves are `app-hierarchy-assignment-panel`, shared with the
 * edit dialog; what stays here is the tenant, which is the wizard's own state.
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
    HierarchyAssignmentPanelComponent,
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
   * Every hierarchy the user may see, across tenants. Passed on unfiltered:
   * the tenant is chosen in this step and may change while the dialog is open,
   * so the panel narrows the list itself rather than being handed a stale one.
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

  protected readonly allHierarchies = signal<readonly SpatialUnitHierarchyOverviewType[]>([]);

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
  protected readonly chosenMandantId = signal('');

  ngOnInit(): void {
    const control = this.group.controls.mandantId;
    this.chosenMandantId.set(control.value);
    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((mandantId) => this.chosenMandantId.set(mandantId));
  }
}
