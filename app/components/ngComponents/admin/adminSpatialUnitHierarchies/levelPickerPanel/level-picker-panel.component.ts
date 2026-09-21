import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { HierarchyChainEntry, RegisteredLevel, SpatialUnitHierarchy } from '../hierarchy.model';

/**
 * The panel that opens in place of an insert line: pick one of the spatial unit
 * levels not yet in this chain. Sits in the tree's `appTreeGap` slot — the tree
 * only positions it.
 *
 * The panel only chooses. Which gap it sits in, putting the level there and
 * telling the user is the page's business, the same as for every other change
 * to a chain.
 *
 * It cannot create a level: a spatial unit level exists only with its geometry,
 * which is imported on the spatial units page. What is not on offer here has to
 * be created there first.
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
  readonly hierarchy = input.required<SpatialUnitHierarchy>();

  /**
   * The spatial unit levels of this hierarchy's tenant. The panel offers what
   * is not in this chain yet.
   */
  readonly registryLevels = input<readonly RegisteredLevel[]>([]);

  /** The level to insert at the gap the panel sits in. */
  readonly picked = output<HierarchyChainEntry>();

  /** Fired when the panel should close — after a pick, or on cancel. */
  readonly done = output<void>();

  /** A level sits in one chain at most once; everything else is on offer. */
  protected readonly options = computed(() => {
    const used = new Set(
      this.hierarchy()
        .chain()
        .map((entry) => entry.id)
    );
    return this.registryLevels().filter((level) => !used.has(level.id));
  });

  /** Empty until the user picks; the first option is preselected on open. */
  private readonly selection = signal<string | null>(null);

  protected readonly selectedId = computed(() => this.selection() ?? this.options()[0]?.id ?? '');

  protected onSelect(event: Event): void {
    this.selection.set((event.target as HTMLSelectElement).value);
  }

  protected addExisting(): void {
    const level = this.options().find((entry) => entry.id === this.selectedId());
    if (!level) {
      return;
    }
    this.picked.emit({ id: level.id, name: level.name });
    this.done.emit();
  }

  protected cancel(): void {
    this.done.emit();
  }
}
