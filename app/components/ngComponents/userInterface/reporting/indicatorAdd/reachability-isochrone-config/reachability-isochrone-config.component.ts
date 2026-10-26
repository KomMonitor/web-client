import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MultiSelectSliderComponent } from 'components/ngComponents/common/multi-select-slider/multi-select-slider.component';
import {
  ReachabilityFocusTypes,
  ReachabilityStateService,
  ReachabilityTransitModeTypes,
} from 'services/reachability-state-service/reachability-state.service';

// Same look as the main map sidebar's "Experten-Optionen" box (vehicle icons, a time/distance
// toggle, one multi-range slider), but a different data source: Experten-Optionen computes
// isochrones from manually placed points (reachabilityStateService.quickCalcSettings /
// startQuickCalculation()), while a report's isochrones must cover every point of the POI layer
// picked in the "POIs" tab (settings.selectedStartPointLayer) - the same source the bulkier
// ReachabilityScenarioConfigurationComponent form used before this replaced it here. Every
// control change recalculates immediately via startIsochroneCalculation(true) (reporting mode),
// which broadcasts ReportingIsochronesCalculationFinished - indicator-add.component.ts already
// listens for that and owns this tab's loading overlay (started/finished broadcasts).
@Component({
  selector: 'app-reachability-isochrone-config',
  standalone: true,
  templateUrl: './reachability-isochrone-config.component.html',
  styleUrls: ['./reachability-isochrone-config.component.scss'],
  imports: [CommonModule, MultiSelectSliderComponent],
})
export class ReachabilityIsochroneConfigComponent {
  protected reachabilityStateService = inject(ReachabilityStateService);

  ranges: number[] = [...this.reachabilityStateService.defaults.distanceRanges];
  sliderRange: number[] = [1, this.reachabilityStateService.defaults.distanceMax];

  constructor() {
    // Unlike the sidebar's scenario wizard (kommonitor-reachability.component.ts), which always
    // seeds `settings.transitMode`/`.focus`/`.isochroneInput` from `quickCalcSettings` before
    // opening, nothing here ever initializes `settings` (it starts as `{}`). If the user's first
    // interaction in this tab is dragging the range slider rather than clicking a vehicle/focus
    // icon, recalculate() fires with `settings.transitMode` still undefined, so
    // fetchIsochrones() builds a request URL ending in "/v2/isochrones/undefined" - ORS has no
    // such route, and the resulting 404 on the preflight looks like a CORS failure in devtools.
    const settings = this.reachabilityStateService.settings;
    if (!settings.transitMode) {
      settings.transitMode = this.reachabilityStateService.quickCalcSettings.transitMode;
    }
    if (!settings.focus) {
      settings.focus = this.reachabilityStateService.quickCalcSettings.focus;
    }
    if (!settings.isochroneInput) {
      settings.isochroneInput = this.ranges.join(',');
    }
  }

  changeType(mode: ReachabilityTransitModeTypes) {
    this.reachabilityStateService.settings.transitMode = mode;
    this.recalculate();
  }

  changeFocus(focus: ReachabilityFocusTypes) {
    this.reachabilityStateService.settings.focus = focus;

    if (focus === 'distance') {
      this.ranges = [...this.reachabilityStateService.defaults.distanceRanges];
      this.sliderRange = [1, this.reachabilityStateService.defaults.distanceMax];
    } else {
      this.ranges = [...this.reachabilityStateService.defaults.timeRanges];
      this.sliderRange = [1, this.reachabilityStateService.defaults.timeMax];
    }

    this.recalculate();
  }

  onRangesChanged(ranges: number[]) {
    this.ranges = ranges;
    this.recalculate();
  }

  private recalculate() {
    // the POI layer's geoJSON is only available once it was picked in the "POIs" tab
    if (!this.reachabilityStateService.settings.selectedStartPointLayer?.geoJSON_reachability) {
      return;
    }

    this.reachabilityStateService.settings.isochroneInput = this.ranges.join(',');
    this.reachabilityStateService.startIsochroneCalculation(true);
  }
}
