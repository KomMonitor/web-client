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
import { unusedLevels } from '../hierarchy-demo.data';
import { DemoHierarchy, DemoLevel, insertIntoChain } from '../hierarchy-demo.model';
import { LevelRegisterModalComponent } from '../levelRegisterModal/level-register-modal.component';

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

  /** Fired when the panel should close — after inserting, or on cancel. */
  readonly done = output<void>();

  protected readonly options = computed(() => unusedLevels(this.hierarchy().chain()));

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
    modalRef.componentInstance.existingNames = this.hierarchy()
      .chain()
      .map((entry) => entry.name);

    modalRef.result.then(
      (name: string) => this.insert(name),
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
