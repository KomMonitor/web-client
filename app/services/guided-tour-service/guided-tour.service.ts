import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Alignment, Driver, DriveStep, Side, driver } from 'driver.js';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

export type GuidedTourStepId =
  | 'welcome'
  | 'header'
  | 'map'
  | 'sidebar'
  | 'map-toolbar'
  | 'legend-toggle'
  | 'legend-export'
  | 'legend-symbology'
  | 'legend-classification'
  | 'export-button'
  | 'reporting-entry'
  | 'end';

interface GuidedTourStepConfig {
  id: GuidedTourStepId;
  /** CSS selector of the element to highlight. Omitted for centered, non-highlighting steps. */
  elementSelector?: string;
  titleKey: string;
  contentKey: string;
  side?: Side;
  align?: Alignment;
}

/**
 * Step anchors reference ids/classes that may not be in the DOM (e.g. the classification panel
 * is absent for qualitative indicators, the reporting button is hidden when logged out). Rather
 * than duplicating that visibility logic here, `skipMissingElement` (set in start()) lets
 * driver.js silently skip a step whose element isn't currently rendered.
 */
const TOUR_STEPS: GuidedTourStepConfig[] = [
  {
    id: 'welcome',
    titleKey: 'GUIDED_TOUR_STEPS.WELCOME.TITLE',
    contentKey: 'GUIDED_TOUR_STEPS.WELCOME.CONTENT_HTML',
  },
  {
    id: 'header',
    elementSelector: '#header',
    titleKey: 'GUIDED_TOUR_STEPS.HEADER.TITLE',
    contentKey: 'GUIDED_TOUR_STEPS.HEADER.CONTENT_HTML',
    side: 'bottom',
  },
  {
    id: 'map',
    elementSelector: '#ngMap',
    titleKey: 'GUIDED_TOUR_STEPS.MAP.TITLE',
    contentKey: 'GUIDED_TOUR_STEPS.MAP.CONTENT_HTML',
    side: 'top',
  },
  {
    id: 'sidebar',
    elementSelector: '#sideBarButtons',
    titleKey: 'GUIDED_TOUR_STEPS.SIDEBAR.TITLE',
    contentKey: 'GUIDED_TOUR_STEPS.SIDEBAR.CONTENT_HTML',
    side: 'right',
  },
  {
    id: 'map-toolbar',
    elementSelector: '#mapUtilButtons',
    titleKey: 'GUIDED_TOUR_STEPS.MAP_TOOLBAR.TITLE',
    contentKey: 'GUIDED_TOUR_STEPS.MAP_TOOLBAR.CONTENT_HTML',
    side: 'right',
  },
  {
    id: 'legend-toggle',
    elementSelector: '#sidebarLegendCollapse',
    titleKey: 'GUIDED_TOUR_STEPS.LEGEND_TOGGLE.TITLE',
    contentKey: 'GUIDED_TOUR_STEPS.LEGEND_TOGGLE.CONTENT_HTML',
    side: 'left',
  },
  {
    id: 'legend-export',
    elementSelector: '#legendExportBox',
    titleKey: 'GUIDED_TOUR_STEPS.LEGEND_EXPORT.TITLE',
    contentKey: 'GUIDED_TOUR_STEPS.LEGEND_EXPORT.CONTENT_HTML',
    side: 'left',
  },
  {
    id: 'legend-symbology',
    elementSelector: '#legendSymbologyBox',
    titleKey: 'GUIDED_TOUR_STEPS.LEGEND_SYMBOLOGY.TITLE',
    contentKey: 'GUIDED_TOUR_STEPS.LEGEND_SYMBOLOGY.CONTENT_HTML',
    side: 'left',
  },
  {
    id: 'legend-classification',
    elementSelector: '#indicatorClassificationCollapse',
    titleKey: 'GUIDED_TOUR_STEPS.LEGEND_CLASSIFICATION.TITLE',
    contentKey: 'GUIDED_TOUR_STEPS.LEGEND_CLASSIFICATION.CONTENT_HTML',
    side: 'left',
  },
  {
    id: 'export-button',
    elementSelector: '#openExportModal',
    titleKey: 'GUIDED_TOUR_STEPS.EXPORT_BUTTON.TITLE',
    contentKey: 'GUIDED_TOUR_STEPS.EXPORT_BUTTON.CONTENT_HTML',
    side: 'left',
  },
  {
    id: 'reporting-entry',
    elementSelector: '#sidebarReportingButton',
    titleKey: 'GUIDED_TOUR_STEPS.REPORTING_ENTRY.TITLE',
    contentKey: 'GUIDED_TOUR_STEPS.REPORTING_ENTRY.CONTENT_HTML',
    side: 'right',
  },
  {
    id: 'end',
    titleKey: 'GUIDED_TOUR_STEPS.END.TITLE',
    contentKey: 'GUIDED_TOUR_STEPS.END.CONTENT_HTML',
  },
];

const SEEN_STORAGE_SUFFIX = '_guidedTourSeen';

/**
 * Drives the step-by-step UI walkthrough (driver.js) and exposes which logical step is active
 * so other components (e.g. KommonitorLegendComponent) can react by opening the panel a step
 * points at. Replaces the AngularJS-era bootstrap-tour implementation, which drove the same
 * coordination via jQuery `.click()` on ids that no longer exist.
 */
@Injectable({
  providedIn: 'root',
})
export class GuidedTourService {
  private translate = inject(TranslateService);
  private envConfigService = inject(EnvConfigService);

  readonly isActive = signal(false);
  readonly activeStepId = signal<GuidedTourStepId | null>(null);

  private driverObj?: Driver;

  start(): void {
    this.driverObj?.destroy();

    this.driverObj = driver({
      showProgress: true,
      allowClose: true,
      skipMissingElement: true,
      overlayOpacity: 0.6,
      progressText: '{{current}} / {{total}}',
      nextBtnText: this.translate.instant('GUIDED_TOUR_STEPS.NEXT_BUTTON'),
      prevBtnText: this.translate.instant('GUIDED_TOUR_STEPS.PREVIOUS_BUTTON'),
      doneBtnText: this.translate.instant('GUIDED_TOUR_STEPS.DONE_BUTTON'),
      closeBtnLabel: this.translate.instant('GUIDED_TOUR_STEPS.CLOSE_LABEL'),
      steps: this.buildSteps(),
      onHighlightStarted: (_element, step) => {
        this.activeStepId.set((step.data as { id: GuidedTourStepId } | undefined)?.id ?? null);
      },
      onDestroyed: () => {
        this.isActive.set(false);
        this.activeStepId.set(null);
        this.markTourSeen();
      },
    });

    this.isActive.set(true);
    this.driverObj.drive();
  }

  end(): void {
    this.driverObj?.destroy();
  }

  hasSeenTour(): boolean {
    return localStorage.getItem(this.seenStorageKey()) === 'true';
  }

  markTourSeen(): void {
    localStorage.setItem(this.seenStorageKey(), 'true');
  }

  private seenStorageKey(): string {
    return this.envConfigService.localStoragePrefix + SEEN_STORAGE_SUFFIX;
  }

  private buildSteps(): DriveStep[] {
    return TOUR_STEPS.map((step) => ({
      element: step.elementSelector,
      data: { id: step.id },
      popover: {
        title: this.translate.instant(step.titleKey),
        description: this.translate.instant(step.contentKey),
        side: step.side,
        align: step.align,
      },
    }));
  }
}
