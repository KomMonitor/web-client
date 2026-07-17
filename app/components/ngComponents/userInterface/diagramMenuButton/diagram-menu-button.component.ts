import { NgClass } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Component, inject } from '@angular/core';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import {
  SidebarElement,
  SidebarStateService,
} from 'services/sidebar-state-service/sidebar-state.service';

/**
 * The "statistische Diagramme" sidebar button with its dropdown submenu
 * (Bilanzierung, Kennzahlen, Indikatoren-Radar, Regression). Extracted from
 * UserInterfaceComponent. The submenu is a CDK connected overlay: it opens on
 * click and closes itself via a transparent backdrop, so its open state is
 * local. The docked-sidebar state it reads/writes lives in SidebarStateService.
 */
@Component({
  selector: 'app-diagram-menu-button',
  templateUrl: './diagram-menu-button.component.html',
  styleUrls: ['./diagram-menu-button.component.scss'],
  standalone: true,
  imports: [NgClass, OverlayModule],
})
export class DiagramMenuButtonComponent {
  protected readonly sidebarState = inject(SidebarStateService);
  protected readonly visibilityHelperService = inject(ElementVisibilityHelperService);
  protected readonly chartDisplayState = inject(ChartDisplayStateService);

  /** Whether the submenu overlay is open. */
  submenuOpen = false;

  /**
   * Anchor the panel to the right of the button, vertically centered on it;
   * fall back to the left when there is no room.
   */
  readonly overlayPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 },
    { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
  ];

  onSubmenuClick(id: SidebarElement) {
    this.sidebarState.toggleActive(id);
    this.submenuOpen = false;
  }
}
