import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * A favourite-toggle star icon: filled while `isFavorite`, otherwise outlined,
 * and hidden entirely while `visible` is false. Used by the indicator rows in
 * both `topic-tree` and `favorites-tab` to avoid duplicating the icon markup.
 *
 * Purely presentational: the caller owns the favourite state and persistence
 * and reacts to `toggled` — this component never mutates anything itself.
 *
 * ```html
 * <app-favorite-star
 *   [visible]="showFavSelection"
 *   [isFavorite]="indicatorFavItems.includes(indicator.indicatorId)"
 *   (toggled)="indicatorFavToggled.emit(indicator.indicatorId)"
 * ></app-favorite-star>
 * ```
 */
@Component({
  selector: 'app-favorite-star',
  templateUrl: './favorite-star.component.html',
  styleUrls: ['./favorite-star.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteStarComponent {
  readonly visible = input(true);
  readonly isFavorite = input(false);

  readonly toggled = output<void>();
}
