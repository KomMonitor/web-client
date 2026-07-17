import { computed, inject, Injectable, signal } from '@angular/core';
import { MapService } from 'services/map-service/map.service';

/** DOM id of a dockable sidebar panel. */
export type SidebarElement =
  | 'sidebarIndicatorConfigCollapse'
  | 'sidebarPoiCollapse'
  | 'sidebarDataImportCollapse'
  | 'sidebarFilterCollapse'
  | 'sidebarBalanceCollapse'
  | 'sidebarDiagramsCollapse'
  | 'sidebarRadarDiagramCollapse'
  | 'sidebarRegressionDiagramCollapse'
  | 'sidebarReachabilityCollapse';

/** The docked sidebar panel, or '' when none is open. */
export type ActiveSidebarElement = SidebarElement | '';

/**
 * Shared UI state for the left sidebar-button column of the user interface.
 *
 * Holds which sidebar is currently docked (`activeElement`) - the one piece of
 * sidebar state genuinely shared between SidebarButtonsComponent (the buttons),
 * DiagramMenuButtonComponent and SidebarComponent (which reads the signal
 * directly to render the docked panel). The diagram submenu's own open/close
 * state lives locally in that component, since its CDK overlay handles
 * outside-click dismissal.
 */
@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  private mapService = inject(MapService);

  /** DOM ids of the sidebar buttons that belong to the diagram submenu. */
  private static readonly DIAGRAM_ELEMENTS: readonly SidebarElement[] = [
    'sidebarDiagramsCollapse',
    'sidebarRadarDiagramCollapse',
    'sidebarRegressionDiagramCollapse',
    'sidebarBalanceCollapse',
  ];

  /** Ids of panels that render the docked sidebar at the wider layout. */
  readonly expandedWidthElements: readonly SidebarElement[] = [
    'sidebarDiagramsCollapse',
    'sidebarRadarDiagramCollapse',
    'sidebarRegressionDiagramCollapse',
  ];

  private readonly _activeElement = signal<ActiveSidebarElement>('');
  /** Id of the currently docked sidebar button, or '' when none is open. */
  readonly activeElement = this._activeElement.asReadonly();

  /** True while one of the diagram sidebars is docked (drives the button highlight). */
  readonly diagramSidebarActive = computed(() => {
    const active = this._activeElement();
    return active !== '' && SidebarStateService.DIAGRAM_ELEMENTS.includes(active);
  });

  /** Dock a specific sidebar without toggle semantics. */
  setActive(id: SidebarElement) {
    this._activeElement.set(id);
  }

  /** Undock any open sidebar. Recenters/resizes the map (available width changes). */
  clearActive() {
    this._activeElement.set('');
    this.mapService.setMapRecenterState({ recenter: true, resize: true });
  }

  /**
   * Sidebar-button click behaviour: clicking the active button closes it,
   * clicking another switches to it. Recenters/resizes the map (the sidebar
   * changes the available map width).
   */
  toggleActive(id: SidebarElement) {
    this._activeElement.update((current) => (current === id ? '' : id));
    this.mapService.setMapRecenterState({ recenter: true, resize: true });
  }
}
