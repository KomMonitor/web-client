import { computed, inject, Injectable, signal } from '@angular/core';
import { MapService } from 'services/map-service/map.service';

/**
 * Shared UI state for the left sidebar-button column of the user interface.
 *
 * Holds which sidebar is currently docked (`activeElement`) - the one piece of
 * sidebar state genuinely shared between UserInterfaceComponent (the sibling
 * buttons + the <app-sidebar> binding) and the extracted DiagramMenuButtonComponent.
 * The diagram submenu's own open/close state lives locally in that component,
 * since its CDK overlay handles outside-click dismissal.
 */
@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  private mapService = inject(MapService);

  /** DOM ids of the sidebar buttons that belong to the diagram submenu. */
  private static readonly DIAGRAM_ELEMENTS = [
    'sidebarDiagramsCollapse',
    'sidebarRadarDiagramCollapse',
    'sidebarRegressionDiagramCollapse',
    'sidebarBalanceCollapse',
  ];

  private readonly _activeElement = signal('');
  /** Id of the currently docked sidebar button, or '' when none is open. */
  readonly activeElement = this._activeElement.asReadonly();

  /** True while one of the diagram sidebars is docked (drives the button highlight). */
  readonly diagramSidebarActive = computed(() =>
    SidebarStateService.DIAGRAM_ELEMENTS.includes(this._activeElement())
  );

  /** Dock a specific sidebar without toggle semantics. */
  setActive(id: string) {
    this._activeElement.set(id);
  }

  /** Undock any open sidebar. */
  clearActive() {
    this._activeElement.set('');
  }

  /**
   * Sidebar-button click behaviour: clicking the active button closes it,
   * clicking another switches to it. Recenters/resizes the map (the sidebar
   * changes the available map width).
   */
  toggleActive(id: string) {
    this._activeElement.update((current) => (current === id ? '' : id));
    this.mapService.setMapRecenterState({ recenter: true, resize: true });
  }
}
