import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';
import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';
import { ReachabilityStateService } from 'services/reachability-state-service/reachability-state.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-reachability-scenario-configuration',
  standalone: true,
  templateUrl: './reachability-scenario-configuration.component.html',
  styleUrls: ['./reachability-scenario-configuration.component.scss'],
  imports: [CommonModule, FormsModule, LoadingOverlayComponent],
})
export class ReachabilityScenarioConfigurationComponent implements OnInit {
  protected reachabilityStateService = inject(ReachabilityStateService);
  private reachabilityMapHelperService = inject(ReachabilityMapHelperService);
  protected mapOverlayState = inject(MapOverlayStateService);
  private broadcastService = inject(BroadcastService);

  isUsedInReporting = false;

  // interactive map content
  mapParts;

  error = undefined;

  // The maximum distance or time for the current
  // vehicle. The unit of the stored value can be
  // found in the variable 'unit'.
  max_value = 5000;

  // Variable that stores 'true' if the time-selection
  // shall be shown or 'false' if not.
  isTime = false;

  domId = 'reachabilityScenarioIsochroneGeoMap';

  constructor() {
    // start points that were drawn manually
    // direct GeoJSON structure
    this.reachabilityStateService.settings.manualStartPoints = undefined;

    // Indicator if multiple starting-points shall
    // be used.
    this.reachabilityStateService.settings.useMultipleStartPoints = false;

    // The calculation unit-indicator.
    this.reachabilityStateService.settings.unit = 'Meter';

    // array of arrays of lon, lat
    // [[lon,lat],[lon,lat]]
    this.reachabilityStateService.settings.locationsArray = [];
  }

  ngOnInit(): void {
    // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      const title = broadcastMsg.msg;
      const values: any = broadcastMsg.values;

      switch (title) {
        case 'switchReportingMode':
          {
            this.switchReportingMode(values);
          }
          break;
        case BroadcastMessage.ReportingPoiLayerSelected:
          {
            this.reportingPoiLayerSelected(values);
          }
          break;
        case 'onManageReachabilityScenario':
          {
            this.onManageReachabilityScenario(values);
          }
          break;
        case BroadcastMessage.IsochronesCalculationFinished:
          {
            this.isochronesCalculationFinished();
          }
          break;
        case BroadcastMessage.ReinitReachabilityConfiguration:
          {
            this.reachabilityMapHelperService.invalidateMap(this.domId);
          }
          break;
        case BroadcastMessage.ResetReachabilityScenarioConfiguration:
          {
            this.resetReachabilityConfigurationMap();
          }
          break;
      }

      this.reachabilityStateService.reachabilityMapSubject$.subscribe((value) => {
        if (value.scenarioState) {
          this.isochronesCalculationFinished();
        }
      });
    });

    this.mapParts = this.reachabilityMapHelperService.initReachabilityGeoMap(this.domId);
  }

  /* 
			$('#manualDateDatepicker_reachabilityConfig').datepicker(kommonitorDataExchangeService.datePickerOptions);
 
  let input = document.getElementById("isochroneCutInput");
  input.addEventListener("keypress", function isInputAllowed(evt) {
    var code = (evt.keyCode ? evt.keyCode : evt.which);
    if (code == 8) { //Backspace key press
      return true;
    } else {
      var ch = String.fromCharCode(evt.which);
      if (!(/[0-9,]/.test(ch))) {
        evt.preventDefault();
      }
    }
  });

  // If the reporting modal is shown we want to integrate this component there.
  // A couple of modifications need to be done to achieve that.
  // These are controlled by setting a variable and checking it when needed.
  $('#reporting-modal').on('hidden.bs.modal', function (e) {
    this.isUsedInReporting = false;
    $timeout(function () {
      this.$digest();
    });
  })*/

  switchReportingMode([isUsedInReporting]) {
    this.isUsedInReporting = isUsedInReporting;
  }

  reportingPoiLayerSelected([data]) {
    this.isUsedInReporting = true;
    this.reachabilityStateService.settings.selectedStartPointLayer = data;
  }

  onManageReachabilityScenario([scenarioDataset]) {
    this.isUsedInReporting = false;
  }

  resetForm() {
    this.resetSlider();

    this.error = undefined;

    this.reachabilityStateService.resetSettings();

    this.broadcastService.broadcast(BroadcastMessage.ChangeStartPointsSourceFromLayer);

    this.isTime = false;

    this.broadcastService.broadcast(BroadcastMessage.RemovePotentialDrawnStartingPoints);

    this.error = undefined;
  }

  removeReachabilityLayers() {
    this.reachabilityStateService.settings.loadingData = true;

    this.reachabilityMapHelperService.removeReachabilityLayers(this.domId);
    this.reachabilityStateService.currentIsochronesGeoJSON = undefined;
    // falsy sentinel, not undefined: the sidebar's legend template reads
    // mapOverlayState.isochroneLegend.datasetName without optional chaining, which
    // throws on undefined/null but not on `false`
    this.mapOverlayState.isochroneLegend = false;
    // remove any diagram
    this.broadcastService.broadcast(BroadcastMessage.ResetPoisInIsochrone);
    this.reachabilityStateService.settings.loadingData = false;
  }

  /** Clears this step's own isochrone/marker layers, e.g. when the scenario modal is fully reset. */
  resetReachabilityConfigurationMap() {
    this.error = undefined;
    this.removeReachabilityLayers();
    this.reachabilityMapHelperService.invalidateMap(this.domId);
  }

  downloadIsochrones() {
    const geoJSON_string = JSON.stringify(this.reachabilityStateService.currentIsochronesGeoJSON);

    const fileName =
      'Erreichbarkeitsisochronen_via-' +
      this.reachabilityStateService.settings.transitMode +
      '_Abbruchkriterium-' +
      this.reachabilityStateService.settings.focus +
      '.geojson';

    const blob = new Blob([geoJSON_string], {
      type: 'application/json',
    });
    const data = URL.createObjectURL(blob);

    console.log('create new Download button and append it to DOM');
    const label = document.createElement('label');

    const a = document.createElement('a');
    a.download = fileName;
    a.href = data;
    a.textContent = 'JSON';
    a.target = '_self';
    a.rel = 'noopener noreferrer';
    a.click();
    a.remove();
  }

  /////
  // Changes the focus of the analysis between
  // distance and time.
  ///
  changeFocus(value) {
    this.reachabilityStateService.settings.focus = value;

    if (value === 'time' && this.reachabilityStateService.settings.transitMode === 'buffer') {
      this.reachabilityStateService.settings.focus = 'distance';
      this.isTime = false;
      this.reachabilityStateService.settings.unit = 'Meter';
      this.changeValues();
      return;
    }

    this.resetSlider();

    if (this.reachabilityStateService.settings.focus == 'distance') {
      this.isTime = false;
      this.reachabilityStateService.settings.unit = 'Meter';
    } else if (this.reachabilityStateService.settings.focus == 'time') {
      this.reachabilityStateService.settings.unit = 'Minuten';
      this.isTime = true;
    }

    this.changeValues();
  }

  /////
  // Resets the slider for the distance-/time to initial values.
  ///
  resetSlider() {
    this.reachabilityStateService.settings.currentTODValue = 1;
  }

  /////
  // Changes the vehicle type according to an
  // action on the related buttons.
  ///
  changeType(value) {
    this.reachabilityStateService.settings.transitMode = value;

    this.changeValues();
    this.resetSlider();
  }

  /////
  // Changes the max_value depending on the
  // selected vehicle type.
  ///
  changeValues() {
    if (this.reachabilityStateService.settings.transitMode == 'buffer') {
      this.reachabilityStateService.settings.focus = 'distance';
      $('#focus_distance').click();
      if (this.reachabilityStateService.settings.focus == 'distance') this.max_value = 5000;
      else this.max_value = 25;
    }

    if (this.reachabilityStateService.settings.transitMode == 'foot-walking') {
      if (this.reachabilityStateService.settings.focus == 'distance') this.max_value = 5000;
      else this.max_value = 25;
    }

    if (this.reachabilityStateService.settings.transitMode == 'cycling-regular') {
      if (this.reachabilityStateService.settings.focus == 'distance') this.max_value = 5000;
      else this.max_value = 20;
    }

    if (this.reachabilityStateService.settings.transitMode == 'driving-car') {
      if (this.reachabilityStateService.settings.focus == 'distance') this.max_value = 5000;
      else this.max_value = 15;
    }

    if (this.reachabilityStateService.settings.transitMode == 'wheelchair') {
      if (this.reachabilityStateService.settings.focus == 'distance') this.max_value = 5000;
      else this.max_value = 25;
    }
  }

  onClickPerDataset_isochroneConfig() {
    setTimeout(() => {
      if (!this.reachabilityStateService.settings.isochroneConfig.selectedDate) {
        this.reachabilityStateService.settings.isochroneConfig.selectedDate =
          this.reachabilityStateService.settings.selectedStartPointLayer.availablePeriodsOfValidity[
            this.reachabilityStateService.settings.selectedStartPointLayer
              .availablePeriodsOfValidity.length - 1
          ];
      }
      if (!this.isUsedInReporting) {
        this.reachabilityStateService.fetchGeoJSONForIsochrones();
      }
    }, 500);
  }

  // Starts the analysis. This function is fired
  // when the related button is pushed.
  //
  // Depending on the current selection of the
  // calculation-task the function
  // 'startRoutingAnalysis' or
  // 'startIsochroneCalculation' will be
  // triggered.
  //
  // The values from the input-elements are all
  // up-to-date and saved in the variables
  // accessible via the scope. The request URL
  // will be build by this values and send towards
  // the routing-API. The result will be handled,
  // stored in the related scope- variables and
  // displayed in the KM GUI.
  //
  // If this method is fired from within the reporting modal
  // (this.isUsedInReporting = true) the result is not added to the main map,
  // but returned to the reporting component per broadcast.

  startAnalysis() {
    setTimeout(() => {
      // Any code in here will automatically have an this.apply() run afterwards
      if (!this.isUsedInReporting) {
        // reporting uses it's own loading overlay, which is controlled there
        this.reachabilityStateService.settings.loadingData = true;
      }
      // And it just works!
    }, 50);

    setTimeout(() => {
      this.error = undefined;

      this.reachabilityStateService.startIsochroneCalculation(this.isUsedInReporting);
    }, 150);
  }

  isochronesCalculationFinished() {
    this.reachabilityMapHelperService.replaceIsochroneMarker(
      this.domId,
      this.reachabilityStateService.settings.locationsArray
    );
    this.reachabilityMapHelperService.replaceIsochroneGeoJSON(
      this.domId,
      this.reachabilityStateService.settings.selectedStartPointLayer.datasetName,
      this.reachabilityStateService.currentIsochronesGeoJSON,
      this.reachabilityStateService.settings.transitMode,
      this.reachabilityStateService.settings.focus,
      this.reachabilityStateService.settings.rangeArray,
      this.reachabilityStateService.settings.useMultipleStartPoints,
      this.reachabilityStateService.settings.dissolveIsochrones
    );
  }
}
