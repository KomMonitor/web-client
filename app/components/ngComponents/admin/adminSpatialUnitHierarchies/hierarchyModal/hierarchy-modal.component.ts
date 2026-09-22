import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
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

/** What the dialog resolves with: the metadata, plus the level chain when creating. */
export interface HierarchyModalResult {
  readonly name: string;
  readonly mandant: string;
  readonly isPublic: boolean;
  /** The chain, coarsest first, as spatial unit levels. Only when creating. */
  readonly levels?: readonly HierarchyChainEntry[];
}

/**
 * Creates a hierarchy or edits the metadata of an existing one.
 *
 * Creating assembles the whole level chain here, coarsest first: a hierarchy is
 * only meaningful with its chain, and building it in one place keeps the page
 * free of half-finished hierarchies. Editing leaves the chain alone — that one
 * is edited in the tree on the page.
 *
 * Resolves with the entered values, or dismisses on cancel.
 */
@Component({
  selector: 'app-hierarchy-modal',
  templateUrl: './hierarchy-modal.component.html',
  styleUrls: ['./hierarchy-modal.component.scss'],
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
export class HierarchyModalComponent implements OnInit {
  private readonly activeModal = inject(NgbActiveModal);
  private readonly mandantService = inject(MandantService);

  /** ng-bootstrap sets these via componentInstance, before the first render. */
  @Input() mode: 'create' | 'edit' = 'create';
  /** Names that are already taken, the edited hierarchy's own name included. */
  @Input() existingNames: readonly string[] = [];
  /** Prefills of the edit mode; the name is also the one the uniqueness check ignores. */
  @Input() currentName = '';
  /**
   * The tenant the dialog starts on. Where it is given, it is also fixed — see
   * `mandantIsFixed`. Empty only when the caller leaves the choice open.
   */
  @Input() currentMandant = '';
  @Input() currentIsPublic = false;
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
   * where nothing knows a tenant — then the field stays a disabled placeholder
   * instead of a required one nobody can fill. Filled in `ngOnInit`, once
   * `knownMandants` has arrived.
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
      validators: [
        Validators.required,
        uniqueNameValidator(() => this.existingNames, { ignore: () => this.currentName }),
      ],
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
    this.form.controls.name.setValue(this.currentName);
    this.form.controls.mandant.setValue(this.currentMandant || this.defaultMandant());
    this.form.controls.isPublic.setValue(this.currentIsPublic);

    if (this.mandants.length > 0) {
      this.form.controls.mandant.addValidators(Validators.required);
      this.form.controls.mandant.updateValueAndValidity();
    }
  }

  /**
   * Whether the tenant is only shown, not chosen. Editing can never move a
   * hierarchy to another tenant — the API refuses it — and a create opened from
   * a tenant's view arrives with that tenant given: switching it there would
   * build the hierarchy somewhere the page behind the dialog does not show.
   * The choice stays open only where the caller names no tenant, which is the
   * overview across all of them.
   */
  protected get mandantIsFixed(): boolean {
    return this.mode === 'edit' || this.currentMandant !== '';
  }

  /**
   * Only the metadata decides. An empty chain is allowed: the API takes a POST
   * without members — `members` is optional there — and a hierarchy without
   * levels is a state it holds and serves anyway. Its levels are then hung in
   * on the page, the same way an existing chain is extended.
   */
  protected get canSubmit(): boolean {
    return this.form.valid;
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

  protected submit(): void {
    if (!this.canSubmit) {
      this.form.controls.name.markAsTouched();
      this.form.controls.mandant.markAsTouched();
      return;
    }

    const result: HierarchyModalResult = {
      name: this.form.controls.name.value.trim(),
      mandant: this.form.controls.mandant.value,
      isPublic: this.form.controls.isPublic.value,
    };
    this.activeModal.close(this.mode === 'create' ? { ...result, levels: this.chain() } : result);
  }

  protected cancel(): void {
    this.activeModal.dismiss('cancel');
  }

  /** The tenant the user belongs to, falling back to the only/first one offered. */
  private defaultMandant(): string {
    return this.mandantService.ownMandant || this.mandants[0] || '';
  }
}
