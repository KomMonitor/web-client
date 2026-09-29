import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FavoriteStarComponent } from 'components/ngComponents/common/favorite-star/favorite-star.component';
import { IndicatorsTopicsHierarchy } from 'components/ngComponents/models/indicators.models';

/** Highest nesting depth that still gets its own hierarchy color; deeper levels reuse it. */
const MAX_STYLED_LEVEL = 4;

/**
 * One row of a topic hierarchy: the topic title, an optional favourite-star
 * toggle and an expand/collapse caret. Nested topics/indicators are projected
 * into the default content slot and only rendered while the row is expanded;
 * the row's level color (and a dashed guide line down into the projected
 * content) carry the nesting depth.
 *
 * Purely presentational: the caller owns collapsed/favourite state and
 * persistence and reacts to `toggleCollapse`/`favToggled` — this component
 * never mutates the topic tree itself. Used by both `topic-tree` (the main
 * topic-oriented catalog) and `favorites-tab` to avoid duplicating the row
 * markup and level styling across the two trees.
 *
 * ```html
 * <app-topic-element
 *   [topic]="topic"
 *   [level]="level"
 *   [collapsed]="collapsedTopicIds.includes(topic.topicId)"
 *   [showFavSelection]="showFavSelection"
 *   [isFavorite]="indicatorTopicFavItems.includes(topic.topicId)"
 *   [containsSelectedIndicator]="checkHierarchyIndicatorSelected(topic)"
 *   (toggleCollapse)="onTopicClick(topic.topicId)"
 *   (favToggled)="indicatorTopicFavToggled.emit(topic.topicId)"
 * >
 *   ...nested topics / indicators / wms table...
 * </app-topic-element>
 * ```
 */
@Component({
  selector: 'app-topic-element',
  templateUrl: './topic-element.component.html',
  styleUrls: ['./topic-element.component.scss'],
  standalone: true,
  imports: [CommonModule, FavoriteStarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicElementComponent {
  readonly topic = input.required<IndicatorsTopicsHierarchy>();
  readonly level = input(0);
  readonly collapsed = input(true);
  readonly showFavSelection = input(false);
  readonly isFavorite = input(false);
  /** Whether this topic, or any of its descendants, contains the currently selected indicator. */
  readonly containsSelectedIndicator = input(false);
  /** Purely visual: renders the selected styling without the row actually being selected. */
  readonly preview = input(false);

  readonly toggleCollapse = output<void>();
  readonly favToggled = output<void>();

  protected readonly hasChildren = computed(() => {
    const topic = this.topic();
    return (
      (topic.subTopics?.length ?? 0) > 0 ||
      (topic.indicatorData?.length ?? 0) > 0 ||
      (topic.wmsData?.length ?? 0) > 0
    );
  });

  /** CSS var for this row's level color, swapped for the solid "-selected" variant when applicable. */
  protected readonly levelColorStyling = computed(() => {
    const clampedLevel = Math.min(this.level(), MAX_STYLED_LEVEL);

    if (!this.containsSelectedIndicator() && !this.preview())
      return `border-left: 3px solid var(--kommonitor-hierarchy-level-${clampedLevel})`;
    else
      return `border-left: 3px solid var(--kommonitor-primary); background-color: var(--kommonitor-hierarchy-level-${clampedLevel})`;
  });
}
