import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { CollapsibleSectionComponent } from '../../../common/collapsible-section/collapsible-section.component';
import { DemoHierarchy, RegisteredLevel } from '../hierarchy-demo.model';

/** A level and the hierarchy it should be assigned to. */
export interface LevelAssignment {
  readonly level: RegisteredLevel;
  readonly hierarchy: DemoHierarchy;
}

/**
 * The section below the hierarchy list: the registered spatial unit levels of
 * the current tenant that no hierarchy uses. They exist in the registry but are
 * not offered in the map interface, because only a hierarchy puts a level there.
 *
 * Presentational — the page derives the list, owns the registry and carries out
 * what the buttons ask for.
 */
@Component({
  selector: 'app-unassigned-levels-panel',
  templateUrl: './unassigned-levels-panel.component.html',
  styleUrls: ['./unassigned-levels-panel.component.scss'],
  imports: [TranslateModule, CollapsibleSectionComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnassignedLevelsPanelComponent {
  /** The levels to list, already filtered to the tenant on screen. */
  readonly levels = input.required<readonly RegisteredLevel[]>();

  /** The hierarchies a level can be assigned to — the tenant's own. */
  readonly hierarchies = input.required<readonly DemoHierarchy[]>();

  readonly showIds = input(false);

  readonly assign = output<LevelAssignment>();
  readonly register = output<void>();
  readonly remove = output<RegisteredLevel>();
  readonly metadata = output<RegisteredLevel>();

  /** Without a hierarchy there is nothing to assign to, so the button rests. */
  protected readonly canAssign = computed(() => this.hierarchies().length > 0);

  /**
   * Resolves the id the select carries back to its hierarchy. The select holds
   * ids rather than objects, so a re-rendered list cannot hand out a stale one.
   */
  protected onAssign(level: RegisteredLevel, hierarchyId: string): void {
    const hierarchy = this.hierarchies().find((entry) => entry.id === hierarchyId);
    if (hierarchy) {
      this.assign.emit({ level, hierarchy });
    }
  }
}
