import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HierarchyChainEntry, RegisteredLevel } from '../hierarchy.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { MandantService } from 'services/mandant-service/mandant.service';

import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { controlStateSignal } from '../../adminShared/forms/control-state';
import { uniqueNameValidator } from '../../adminShared/validators/admin-validators';
import { levelsOfMandant } from '../hierarchy-selectors';

/** What the dialog resolves with: the metadata and the assembled chain. */
export interface HierarchyCreateModalResult {
  readonly name: string;
  readonly mandant: string;
  readonly isPublic: boolean;
  /** The chain, coarsest first, as spatial unit levels. May be empty. */
  readonly levels: readonly HierarchyChainEntry[];
}

/**
 * Creates a hierarchy, chain and all.
 *
 * The chain is assembled here, coarsest first, because this is the one moment
 * where the whole thing is still weightless — nothing is written until the
 * dialog closes. Editing an existing hierarchy is a different dialog
 * (`HierarchyEditModalComponent`): there the chain is edited in the tree on the
 * page, one request per step.
 *
 * Resolves with the entered values, or dismisses on cancel.
 */
@Component({
  selector: 'app-hierarchy-create-modal',
  templateUrl: './hierarchy-create-modal.component.html',
  styleUrls: ['./hierarchy-create-modal.component.scss'],
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    FormErrorComponent,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HierarchyCreateModalComponent implements OnInit {
  private readonly activeModal = inject(NgbActiveModal);
  private readonly mandantService = inject(MandantService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  private readonly mandantSelect = viewChild<ElementRef<HTMLSelectElement>>('mandantSelect');

  /** ng-bootstrap sets these via componentInstance, before the first render. */
  @Input() existingNames: readonly string[] = [];
  /**
   * The tenant the dialog starts on. Where it is given, it is also fixed — see
   * `mandantIsFixed`. Empty only when the caller leaves the choice open.
   */
  @Input() presetMandant = '';
  /** How many hierarchies already use a level, by `spatialUnitId`. */
  @Input() levelUsage: Readonly<Record<string, number>> = {};

  /**
   * The spatial unit levels to build the chain from, across all tenants.
   *
   * Deliberately unfiltered: the tenant is chosen in this dialog and may change
   * while it is open, so a list narrowed by the caller would go stale on the
   * first switch. The narrowing happens here instead, in `options`, against the
   * tenant of the form — a hierarchy may only hold levels of its own tenant,
   * and the API answers 400 for anything else.
   */
  @Input() registeredLevels: readonly RegisteredLevel[] = [];

  /** Tenants the page found in its data; offered where Keycloak names none. */
  @Input() knownMandants: readonly string[] = [];

  /**
   * The tenants to choose from, as `MandantService` sources them. Empty only
   * where nothing knows a tenant. Filled in `ngOnInit`, once `knownMandants`
   * has arrived.
   */
  protected mandants: readonly string[] = [];

  /** The chain being assembled, coarsest first. Only used while creating. */
  private readonly chain = signal<readonly HierarchyChainEntry[]>([]);
  protected readonly levels = this.chain.asReadonly();

  /**
   * What the level select offers: the chosen tenant's levels that are not in
   * this chain yet — a level sits in a chain at most once, and a hierarchy may
   * only hold levels of its own tenant.
   *
   * Reads `registeredLevels` directly: ng-bootstrap assigns it before the first
   * render and it never changes while the dialog is open. The tenant does
   * change, which is why it comes through a signal.
   */
  protected readonly options = computed(() => {
    const used = new Set(this.chain().map((entry) => entry.id));
    return levelsOfMandant(this.registeredLevels, this.chosenMandant()).filter(
      (level) => !used.has(level.id)
    );
  });

  /** Empty until the user picks; the first option is preselected on open. */
  private readonly picked = signal<string | null>(null);
  protected readonly selectedId = computed(() => {
    const options = this.options();
    const picked = this.picked();
    return picked && options.some((level) => level.id === picked) ? picked : (options[0]?.id ?? '');
  });

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, uniqueNameValidator(() => this.existingNames)],
    }),
    mandant: new FormControl('', { nonNullable: true }),
    isPublic: new FormControl(false, { nonNullable: true }),
  });

  /**
   * The tenant the form currently names. A plain `.value` read would not be
   * reactive, so the level options below would never follow a switch.
   */
  private readonly chosenMandant = controlStateSignal(
    this.form.controls.mandant,
    () => this.form.controls.mandant.value
  );

  /**
   * Drops what no longer fits after a tenant switch. A level belongs to exactly
   * one tenant, so in practice this empties the chain — which is the point: the
   * levels picked so far cannot be members of a hierarchy of the new tenant,
   * and submitting them would only earn a 400.
   */
  private readonly chainFollowsMandant = effect(() => {
    const mandant = this.chosenMandant();
    untracked(() => {
      const allowed = new Set(
        levelsOfMandant(this.registeredLevels, mandant).map((level) => level.id)
      );
      this.chain.update((levels) => levels.filter((entry) => allowed.has(entry.id)));
    });
  });

  ngOnInit(): void {
    this.mandants = this.mandantService.mandantsToOffer(this.knownMandants);
    this.form.controls.mandant.setValue(this.presetMandant || this.defaultMandant());

    // Required only where the select is on screen. A fixed tenant, a single
    // one or none at all shows as a disabled field — an error there could not
    // be fixed, so the tenant must not be able to block the submit.
    if (this.mandantIsSelectable) {
      this.form.controls.mandant.addValidators(Validators.required);
      this.form.controls.mandant.updateValueAndValidity();
    }
  }

  /**
   * Whether the tenant is only shown, not chosen. A dialog opened from a
   * tenant's view arrives with that tenant given, and switching it there would
   * build the hierarchy somewhere the page behind the dialog does not show.
   * The choice stays open only where the caller names no tenant, which is the
   * overview across all of them.
   */
  protected get mandantIsFixed(): boolean {
    return this.presetMandant !== '';
  }

  /**
   * Whether the tenant is a real select. One tenant is the normal case, and
   * picking it would be a choice of one — so only a list of several, with the
   * choice left open, is offered for picking.
   */
  protected get mandantIsSelectable(): boolean {
    return !this.mandantIsFixed && this.mandants.length > 1;
  }

  /** How many hierarchies already use this level; 0 means it is still unused. */
  protected usageCount(level: HierarchyChainEntry): number {
    return this.levelUsage[level.id] ?? 0;
  }

  protected onSelect(event: Event): void {
    this.picked.set((event.target as HTMLSelectElement).value);
  }

  protected addLevel(): void {
    const level = this.options().find((entry) => entry.id === this.selectedId());
    if (!level) {
      return;
    }
    this.chain.update((levels) => [...levels, { id: level.id, name: level.name }]);
    this.picked.set(null);
  }

  protected removeLevel(index: number): void {
    this.chain.update((levels) => levels.filter((_, position) => position !== index));
  }

  /** Reordering works here, unlike in the page's tree: this chain is a flat list. */
  protected onDrop(event: CdkDragDrop<readonly HierarchyChainEntry[]>): void {
    this.chain.update((levels) => {
      const next = [...levels];
      moveItemInArray(next, event.previousIndex, event.currentIndex);
      return next;
    });
  }

  /**
   * Only the metadata decides. An empty chain is allowed: the API takes a POST
   * without members — `members` is optional there — and a hierarchy without
   * levels is a state it holds and serves anyway. Its levels are then hung in
   * on the page, the same way an existing chain is extended.
   *
   * The button stays active; an incomplete form shows its errors instead and
   * puts the focus on the first field to fix.
   */
  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // OnPush: the touched state alone does not re-render the view
      this.cdr.markForCheck();
      this.focusFirstInvalid();
      return;
    }

    const result: HierarchyCreateModalResult = {
      name: this.form.controls.name.value.trim(),
      mandant: this.form.controls.mandant.value,
      isPublic: this.form.controls.isPublic.value,
      levels: this.chain(),
    };
    this.activeModal.close(result);
  }

  protected cancel(): void {
    this.activeModal.dismiss('cancel');
  }

  private focusFirstInvalid(): void {
    if (this.form.controls.name.invalid) {
      this.nameInput()?.nativeElement.focus();
    } else if (this.form.controls.mandant.invalid) {
      this.mandantSelect()?.nativeElement.focus();
    }
  }

  /** The tenant the user belongs to, falling back to the only/first one offered. */
  private defaultMandant(): string {
    return this.mandantService.ownMandant || this.mandants[0] || '';
  }
}
