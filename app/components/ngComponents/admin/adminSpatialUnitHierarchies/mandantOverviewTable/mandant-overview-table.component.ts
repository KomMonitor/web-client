import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { mandantInitials } from '../mandantPanel/mandant-panel.component';

/** One tenant as the overview lists it: what it owns, in numbers. */
export interface MandantOverviewRow {
  readonly name: string;
  readonly hierarchyCount: number;
  /** Distinct spatial unit levels across the tenant's hierarchies. */
  readonly levelCount: number;
  /** How many of those levels sit in more than one of its hierarchies. */
  readonly sharedLevelCount: number;
}

/**
 * The overview across all tenants: one row per tenant instead of every
 * hierarchy of every tenant at once. Opening a row switches the page to that
 * tenant, which is where the hierarchies themselves are edited.
 *
 * Holds no state — the page owns the selection and passes the rows in.
 */
@Component({
  selector: 'app-mandant-overview-table',
  templateUrl: './mandant-overview-table.component.html',
  styleUrls: ['./mandant-overview-table.component.scss'],
  imports: [TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MandantOverviewTableComponent {
  readonly rows = input.required<readonly MandantOverviewRow[]>();

  /** The tenant to switch to, emitted by the row's open button. */
  readonly openMandant = output<string>();

  protected readonly initials = mandantInitials;
}
