import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Marks a timeseries whose owner differs from its indicator's (`slot`, with
 * that owner's name), or an indicator that has such a timeseries (`dataset`).
 * The wizard changes these timeseries all the same; the badge only says so.
 */
@Component({
  selector: 'app-foreign-owner-badge',
  template: `
    <span
      class="badge foreign-owner-badge"
      [title]="'ADMIN_DATASET_PERMISSIONS.FOREIGN_OWNER.TITLE' | translate"
      >{{
        mode() === 'slot'
          ? ('ADMIN_DATASET_PERMISSIONS.FOREIGN_OWNER.SLOT' | translate: { owner: ownerName() })
          : ('ADMIN_DATASET_PERMISSIONS.FOREIGN_OWNER.DATASET' | translate)
      }}</span
    >
  `,
  styleUrls: ['./foreign-owner-badge.component.scss'],
  imports: [TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForeignOwnerBadgeComponent {
  readonly mode = input<'slot' | 'dataset'>('dataset');
  /** Name of the timeseries' owner, interpolated as text; read in `slot` mode only. */
  readonly ownerName = input('');
}
