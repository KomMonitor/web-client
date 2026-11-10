import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { TriState } from './dataset-permissions.model';

/**
 * Marks a dataset, or a timeseries, that anyone may read (`isPublic`): read
 * rights of groups have no effect there, and the wizard cannot change that.
 * Shows nothing for one that only groups may read.
 */
@Component({
  selector: 'app-public-badge',
  template: `
    @if (state() !== 'none') {
      <span
        class="badge public-badge"
        [title]="'ADMIN_DATASET_PERMISSIONS.PUBLIC.TITLE' | translate"
        >{{
          (state() === 'all'
            ? 'ADMIN_DATASET_PERMISSIONS.PUBLIC.ALL'
            : 'ADMIN_DATASET_PERMISSIONS.PUBLIC.SOME'
          ) | translate
        }}</span
      >
    }
  `,
  styleUrls: ['./public-badge.component.scss'],
  imports: [TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicBadgeComponent {
  /** `all`: public; `some`: partly public, e.g. some timeseries of an indicator. */
  readonly state = input<TriState>('none');
}
