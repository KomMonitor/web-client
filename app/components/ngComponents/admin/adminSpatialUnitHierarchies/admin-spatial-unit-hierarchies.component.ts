import { ChangeDetectionStrategy, Component, WritableSignal, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CollapsibleSectionComponent } from '../../common/collapsible-section/collapsible-section.component';
import { NotificationService } from '../../common/notification/notification.service';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';

interface DemoHierarchy {
  readonly id: string;
  readonly name: string;
  readonly levelCount: number;
  readonly open: WritableSignal<boolean>;
}

/** Chains from the design draft. */
const DEMO_DATA: readonly { id: string; name: string; levelCount: number; open: boolean }[] = [
  {
    id: 'a1f5c803-72d9-4b6e-8f14-3ce90ab27d56',
    name: 'Verwaltungsgliederung',
    levelCount: 5,
    open: true,
  },
  {
    id: '6c8be214-90f7-4a35-b1d8-27ea54c3f9b0',
    name: 'Sozialraum-Gliederung',
    levelCount: 4,
    open: false,
  },
];

/**
 * Management of spatial unit hierarchies — the chains that order spatial unit
 * levels from the coarsest to the finest.
 *
 * The page currently shows two hierarchies of the design draft as static demo
 * data so the layout can be reviewed; nothing here talks to the backend yet.
 */
@Component({
  selector: 'app-admin-spatial-unit-hierarchies',
  templateUrl: './admin-spatial-unit-hierarchies.component.html',
  styleUrls: ['./admin-spatial-unit-hierarchies.component.scss'],
  imports: [TranslateModule, AdminContentViewComponent, CollapsibleSectionComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSpatialUnitHierarchiesComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  readonly showIds = signal(false);

  readonly hierarchies: readonly DemoHierarchy[] = DEMO_DATA.map((h) => ({
    ...h,
    open: signal(h.open),
  }));

  protected onShowIdsChange(event: Event): void {
    this.showIds.set((event.target as HTMLInputElement).checked);
  }

  /** Demo feedback: proves the projected header buttons receive their clicks. */
  protected onAction(action: string, hierarchy: DemoHierarchy): void {
    this.notificationService.show(
      this.translateService.instant('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.ACTION_CLICKED', {
        action: this.translateService.instant(action),
        hierarchy: hierarchy.name,
      }),
      { autohide: true, delay: 3000 }
    );
  }
}
