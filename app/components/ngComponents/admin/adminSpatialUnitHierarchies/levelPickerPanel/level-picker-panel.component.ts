import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MODAL_FORM } from 'util/modal-presets';

import { AdminModalService } from '../../adminShared/modal/admin-modal.service';
import { DemoHierarchy } from '../hierarchy-demo.model';
import {
  LevelRegisterModalComponent,
  LevelRegisterResult,
} from '../levelRegisterModal/level-register-modal.component';

/** A level the user chose in the picker, for the page to put into the chain. */
export interface LevelPick {
  readonly name: string;
  /**
   * Set when the user registered the level right here: it is new to the
   * registry as well, which has to take it in.
   */
  readonly registration?: LevelRegisterResult;
}

/**
 * The panel that opens in place of an insert line: pick one of the spatial unit
 * levels not yet in this chain, or register a new one. Sits in the tree's
 * `appTreeGap` slot — the tree only positions it.
 *
 * The panel only chooses. Which gap it sits in, putting the level there and
 * telling the user is the page's business, the same as for every other change
 * to a chain.
 */
@Component({
  selector: 'app-level-picker-panel',
  templateUrl: './level-picker-panel.component.html',
  styleUrls: ['./level-picker-panel.component.scss'],
  imports: [TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelPickerPanelComponent {
  private readonly modals = inject(AdminModalService);

  readonly hierarchy = input.required<DemoHierarchy>();

  /**
   * The registered levels of this hierarchy's tenant, as the page's registry
   * knows them. The panel offers what is not in this chain yet and checks a
   * newly registered name against all of them.
   */
  readonly registryNames = input<readonly string[]>([]);

  /** The level to insert at the gap the panel sits in. */
  readonly picked = output<LevelPick>();

  /** Fired when the panel should close — after a pick, or on cancel. */
  readonly done = output<void>();

  /** A level sits in one chain at most once; everything else is on offer. */
  protected readonly options = computed(() => {
    const used = new Set(
      this.hierarchy()
        .chain()
        .map((entry) => entry.name)
    );
    return this.registryNames().filter((name) => !used.has(name));
  });

  /** Empty until the user picks; the first option is preselected on open. */
  private readonly selection = signal<string | null>(null);

  protected readonly selected = computed(() => this.selection() ?? this.options()[0] ?? '');

  protected onSelect(event: Event): void {
    this.selection.set((event.target as HTMLSelectElement).value);
  }

  protected addExisting(): void {
    const name = this.selected();
    if (!name) {
      return;
    }
    this.pick({ name });
  }

  protected async registerNew(): Promise<void> {
    const registration = await this.modals.open<LevelRegisterModalComponent, LevelRegisterResult>(
      LevelRegisterModalComponent,
      MODAL_FORM,
      // Against the whole registry, not just this chain: a level name names one
      // spatial unit level in the instance, so it cannot be registered twice.
      { existingNames: this.registryNames() }
    );
    // Dismissed — the panel stays open so the user can still pick from the list.
    if (!registration) {
      return;
    }
    this.pick({ name: registration.name, registration });
  }

  protected cancel(): void {
    this.done.emit();
  }

  private pick(choice: LevelPick): void {
    this.picked.emit(choice);
    this.done.emit();
  }
}
