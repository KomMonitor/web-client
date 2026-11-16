import { CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/** One entry of a ⋮ menu as the menu renders it; the host resolves it from its actions. */
export interface LayerMenuItem {
  id: string;
  i18nKey: string;
  /** Font Awesome classes. */
  icon: string;
  disabled: boolean;
}

/**
 * The ⋮ menu of a layer or a group: a CDK menu (keyboard navigation, typeahead,
 * closing on Escape or outside clicks) listing what its host resolved from
 * `MAP_LAYER_ACTIONS` or `MAP_LAYER_GROUP_ACTIONS`. It knows no layers; its
 * host places it in the `ng-template` its menu triggers open. Its styles live
 * here, as the menu is rendered in the overlay container outside the panel.
 */
@Component({
  selector: 'app-layer-actions-menu',
  templateUrl: './layer-actions-menu.component.html',
  styleUrls: ['./layer-actions-menu.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkMenu, CdkMenuItem, TranslateModule],
})
export class LayerActionsMenuComponent {
  readonly items = input.required<readonly LayerMenuItem[]>();
  /** Accessible name of the menu, e.g. naming the layer. */
  readonly label = input.required<string>();

  /** The id of the chosen item; the menu closes by itself. */
  readonly triggered = output<string>();
}
