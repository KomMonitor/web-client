import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MODAL_FORM } from 'util/modal-presets';

import { NotificationService } from '../../../common/notification/notification.service';
import { TreeGap } from '../../../common/tree-view/tree-view.model';
import { DemoHierarchy, DemoLevel, insertIntoChain } from '../hierarchy-demo.model';
import {
  LevelRegisterModalComponent,
  LevelRegisterResult,
} from '../levelRegisterModal/level-register-modal.component';

/**
 * The panel that opens in place of an insert line: pick one of the spatial unit
 * levels not yet in this chain, or register a new one. Sits in the tree's
 * `appTreeGap` slot — the tree only positions it.
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
  private readonly modalService = inject(NgbModal);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  readonly hierarchy = input.required<DemoHierarchy>();
  readonly gap = input.required<TreeGap<DemoLevel>>();

  /**
   * The registered levels of this hierarchy's tenant, as the page's registry
   * knows them. The panel offers what is not in this chain yet and checks a
   * newly registered name against all of them.
   */
  readonly registryNames = input<readonly string[]>([]);

  /** Fired when the panel should close — after inserting, or on cancel. */
  readonly done = output<void>();

  /**
   * A level the user registered here. The panel puts it into the chain itself;
   * the page owns the registry and takes it in from this.
   */
  readonly registered = output<LevelRegisterResult>();

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
  private readonly picked = signal<string | null>(null);

  protected readonly selected = computed(() => this.picked() ?? this.options()[0] ?? '');

  protected onSelect(event: Event): void {
    this.picked.set((event.target as HTMLSelectElement).value);
  }

  protected addExisting(): void {
    const name = this.selected();
    if (!name) {
      return;
    }
    this.insert(name);
  }

  protected registerNew(): void {
    const modalRef = this.modalService.open(LevelRegisterModalComponent, MODAL_FORM);
    // Against the whole registry, not just this chain: a level name names one
    // spatial unit level in the instance, so it cannot be registered twice.
    modalRef.componentInstance.existingNames = this.registryNames();

    modalRef.result.then(
      (result: LevelRegisterResult) => {
        this.registered.emit(result);
        this.insert(result.name);
      },
      // Dismissed — the panel stays open so the user can still pick from the list.
      () => undefined
    );
  }

  protected cancel(): void {
    this.done.emit();
  }

  private insert(name: string): void {
    insertIntoChain(this.hierarchy(), this.gap(), name);
    this.notificationService.show(
      this.translateService.instant('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.INSERTED', {
        level: name,
      }),
      { autohide: true, delay: 3000 }
    );
    this.done.emit();
  }
}
