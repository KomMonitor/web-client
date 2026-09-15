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
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { MandantService } from 'services/mandant-service/mandant.service';

import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { uniqueNameValidator } from '../../adminShared/validators/admin-validators';

/** What the dialog resolves with: the metadata, plus the level chain when creating. */
export interface HierarchyModalResult {
  readonly name: string;
  readonly description: string;
  readonly mandant: string;
  readonly levels?: readonly string[];
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
  readonly activeModal = inject(NgbActiveModal);
  private readonly mandantService = inject(MandantService);

  /** ng-bootstrap sets these via componentInstance, before the first render. */
  @Input() mode: 'create' | 'edit' = 'create';
  /** Names that are already taken, the edited hierarchy's own name included. */
  @Input() existingNames: readonly string[] = [];
  /** Prefills of the edit mode; the name is also the one the uniqueness check ignores. */
  @Input() currentName = '';
  @Input() currentDescription = '';
  @Input() currentMandant = '';
  /** How many hierarchies already use a level, by level name. */
  @Input() levelUsage: Readonly<Record<string, number>> = {};

  /**
   * The registered spatial unit levels to build the chain from. The page owns
   * the registry — a level registered in the draft has to show up here too.
   */
  @Input() registeredLevels: readonly string[] = [];

  /** Tenants the page found in its data; offered where Keycloak names none. */
  @Input() knownMandants: readonly string[] = [];

  /**
   * The tenants to choose from, as `MandantService` sources them. Empty only
   * where nothing knows a tenant — then the field stays a disabled placeholder
   * instead of a required one nobody can fill. Filled in `ngOnInit`, once
   * `knownMandants` has arrived.
   */
  mandants: readonly string[] = [];

  /** The chain being assembled, coarsest first. Only used while creating. */
  private readonly chain = signal<readonly string[]>([]);
  readonly levels = this.chain.asReadonly();

  /**
   * Levels not yet in this chain — a level sits in a chain at most once. Reads
   * the input directly: ng-bootstrap assigns it before the first render and it
   * never changes while the dialog is open.
   */
  protected readonly options = computed(() =>
    this.registeredLevels.filter((name) => !this.chain().includes(name))
  );

  /** Empty until the user picks; the first option is preselected on open. */
  private readonly picked = signal<string | null>(null);
  protected readonly selected = computed(() => {
    const options = this.options();
    const picked = this.picked();
    return picked && options.includes(picked) ? picked : (options[0] ?? '');
  });

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        uniqueNameValidator(() => this.existingNames, { ignore: () => this.currentName }),
      ],
    }),
    description: new FormControl('', { nonNullable: true }),
    mandant: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.mandants = this.mandantService.mandantsToOffer(this.knownMandants);
    this.form.controls.name.setValue(this.currentName);
    this.form.controls.description.setValue(this.currentDescription);
    this.form.controls.mandant.setValue(this.currentMandant || this.defaultMandant());

    if (this.mandants.length > 0) {
      this.form.controls.mandant.addValidators(Validators.required);
      this.form.controls.mandant.updateValueAndValidity();
    }
  }

  /** A new chain needs at least one level; the metadata form guards the rest. */
  protected get canSubmit(): boolean {
    return this.form.valid && (this.mode === 'edit' || this.chain().length > 0);
  }

  /** How many hierarchies already use this level; 0 means it is still unused. */
  protected usageCount(level: string): number {
    return this.levelUsage[level] ?? 0;
  }

  protected onSelect(event: Event): void {
    this.picked.set((event.target as HTMLSelectElement).value);
  }

  protected addLevel(): void {
    const level = this.selected();
    if (!level) {
      return;
    }
    this.chain.update((levels) => [...levels, level]);
    this.picked.set(null);
  }

  protected removeLevel(index: number): void {
    this.chain.update((levels) => levels.filter((_, position) => position !== index));
  }

  /** Reordering works here, unlike in the page's tree: this chain is a flat list. */
  protected onDrop(event: CdkDragDrop<readonly string[]>): void {
    this.chain.update((levels) => {
      const next = [...levels];
      moveItemInArray(next, event.previousIndex, event.currentIndex);
      return next;
    });
  }

  submit(): void {
    if (!this.canSubmit) {
      this.form.controls.name.markAsTouched();
      this.form.controls.mandant.markAsTouched();
      return;
    }

    const result: HierarchyModalResult = {
      name: this.form.controls.name.value.trim(),
      description: this.form.controls.description.value.trim(),
      mandant: this.form.controls.mandant.value,
    };
    this.activeModal.close(this.mode === 'create' ? { ...result, levels: this.chain() } : result);
  }

  cancel(): void {
    this.activeModal.dismiss('cancel');
  }

  /** The tenant the user belongs to, falling back to the only/first one offered. */
  private defaultMandant(): string {
    return this.mandantService.ownMandant || this.mandants[0] || '';
  }
}
