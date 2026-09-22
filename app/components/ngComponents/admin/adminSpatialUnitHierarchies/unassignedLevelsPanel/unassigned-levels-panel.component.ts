import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
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
 * It creates no level: one exists only with its geometry, so that belongs on
 * the spatial units page, which the header links to. Deleting one is offered
 * here — an unassigned level is exactly the one nothing else depends on — but
 * the page carries it out, through the spatial units page's own dialog.
 *
 * Presentational — the page derives the list and carries out what the buttons
 * ask for.
 */
@Component({
  selector: 'app-unassigned-levels-panel',
  templateUrl: './unassigned-levels-panel.component.html',
  styleUrls: ['./unassigned-levels-panel.component.scss'],
  imports: [TranslateModule, RouterLink, CollapsibleSectionComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnassignedLevelsPanelComponent {
  /** The levels to list, already filtered to the tenant on screen. */
  readonly levels = input.required<readonly RegisteredLevel[]>();

  /** The hierarchies a level can be assigned to — the tenant's own. */
  readonly hierarchies = input.required<readonly SpatialUnitHierarchy[]>();

  readonly showIds = input(false);

  readonly assign = output<LevelAssignment>();
  readonly metadata = output<RegisteredLevel>();
  /** `deleteLevel`, not `delete`: the tree's "remove" takes a level out of a chain. */
  readonly deleteLevel = output<RegisteredLevel>();

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
