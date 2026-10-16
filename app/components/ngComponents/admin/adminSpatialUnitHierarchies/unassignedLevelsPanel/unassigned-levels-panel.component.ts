import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { CollapsibleSectionComponent } from '../../../common/collapsible-section/collapsible-section.component';
import { RegisteredLevel, SpatialUnitHierarchy } from '../hierarchy.model';

/** A level and the hierarchy it should be assigned to. */
export interface LevelAssignment {
  readonly level: RegisteredLevel;
  readonly hierarchy: SpatialUnitHierarchy;
}

/**
 * The section below the hierarchy list: the spatial unit levels of the current
 * tenant that no hierarchy uses. They exist, but are not offered in the map
 * interface, because only a hierarchy puts a level there.
 *
 * Registering and deleting a level are both offered here and both carried out
 * by the page, through the spatial units page's own dialogs: a level exists
 * only with its geometry, and that wizard is what collects it.
 *
 * Presentational — the page derives the list and carries out what the buttons
 * ask for.
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

  /** The hierarchies a level can be assigned to — those of the tenant the user may change. */
  readonly hierarchies = input.required<readonly SpatialUnitHierarchy[]>();

  /**
   * Whether the tenant has hierarchies, but none the user may change. The
   * assign button then rests and says why, instead of claiming there is no
   * hierarchy at all.
   */
  readonly assignLocked = input(false);

  /** Whether the user may register a new level — it creates a spatial unit dataset. */
  readonly canRegister = input(true);

  readonly showIds = input(false);

  readonly assign = output<LevelAssignment>();
  readonly metadata = output<RegisteredLevel>();
  /** `deleteLevel`, not `delete`: the tree's "remove" takes a level out of a chain. */
  readonly deleteLevel = output<RegisteredLevel>();
  /** Asks for a new level; the page opens the spatial units wizard for it. */
  readonly registerLevel = output<void>();

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
