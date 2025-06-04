import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';

@Component({
  selector: 'app-reachability-scenario-configuration',
  standalone: true,
  templateUrl: './reachability-scenario-configuration.component.html',
  styleUrls: ['./reachability-scenario-configuration.component.css'],
  imports: [CommonModule]
})
export class ReachabilityScenarioConfigurationComponent implements OnInit {

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

  domId = "reachabilityScenarioIsochroneGeoMap";

  constructor(
    protected reachbilityHelperService: ReachabilityHelperService,
    private reachabilityMapHelperService: ReachabilityMapHelperService,
    protected dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService
  ) {
    // start points that were drawn manually
    // direct GeoJSON structure
    this.reachbilityHelperService.pipedData.settings.manualStartPoints = undefined;

    // Indicator if multiple starting-points shall
    // be used.
    this.reachbilityHelperService.pipedData.settings.useMultipleStartPoints = false;

    // The calculation unit-indicator.
    this.reachbilityHelperService.pipedData.settings.unit = 'Meter';

    // array of arrays of lon, lat
    // [[lon,lat],[lon,lat]]
    this.reachbilityHelperService.pipedData.settings.locationsArray = [];
  }

  ngOnInit(): void {
    // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      let title = broadcastMsg.msg;
      let values:any = broadcastMsg.values;

      switch (title) {
        case 'switchReportingMode' : {
          this.switchReportingMode(values);
        } break;
        case 'reportingPoiLayerSelected':  {
          this.reportingPoiLayerSelected(values);
        } break;
        case 'onManageReachabilityScenario': {
          this.onManageReachabilityScenario(values);
        } break;
        case 'isochronesCalculationFinished': {
          this.isochronesCalculationFinished(values);
        } break;
      }
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

  switchReportingMode([isUsedInReporting]){
    this.isUsedInReporting = isUsedInReporting;
  }

  reportingPoiLayerSelected([data]) {
    this.isUsedInReporting = true;
    this.reachbilityHelperService.pipedData.settings.selectedStartPointLayer = data;
  }

  onManageReachabilityScenario([scenarioDataset]) {

    this.isUsedInReporting = false;

  }

  resetForm() {
    this.resetSlider();

    this.error = undefined;

    this.reachbilityHelperService.resetSettings();

    this.broadcastService.broadcast('changeStartPointsSource_fromLayer');

    this.isTime = false;

    this.broadcastService.broadcast('removePotentialDrawnStartingPoints');

    this.error = undefined;
  }

  /////
    // TODO
  removeReachabilityLayers() {
    this.reachbilityHelperService.pipedData.settings.loadingData = true;

    this.reachabilityMapHelperService.removeReachabilityLayers(this.domId);
    this.reachbilityHelperService.pipedData.currentIsochronesGeoJSON = undefined;
    this.dataExchangeService.pipedData.isochroneLegend = undefined;
    // remove any diagram
    this.broadcastService.broadcast("resetPoisInIsochrone");
    this.reachbilityHelperService.pipedData.settings.loadingData = false;
  }


  downloadIsochrones(){
    var geoJSON_string = JSON
      .stringify(this.reachbilityHelperService.pipedData.currentIsochronesGeoJSON);

    var fileName = 'Erreichbarkeitsisochronen_via-' +
      this.reachbilityHelperService.pipedData.settings.transitMode +
      '_Abbruchkriterium-' +
      this.reachbilityHelperService.pipedData.settings.focus + '.geojson';

    var blob = new Blob([geoJSON_string], {
      type: 'application/json'
    });
    var data = URL.createObjectURL(blob);

    console.log('create new Download button and append it to DOM');
    let label = document.createElement("label");

    var a = document.createElement('a');
    a.download = fileName;
    a.href = data;
    a.textContent = "JSON";
    a.target = "_self";
    a.rel = "noopener noreferrer";
    a.click()
    a.remove();
  }

  /////
        // Changes the focus of the analysis between
        // distance and time.
        ///
  changeFocus(value) {

    if (value === 'time' && this.reachbilityHelperService.pipedData.settings.transitMode === "buffer") {
      this.reachbilityHelperService.pipedData.settings.focus = 'distance'
      this.isTime = false;
      this.reachbilityHelperService.pipedData.settings.unit = 'Meter';
      this.changeValues();
      return;
    }

    this.resetSlider();

    if (this.reachbilityHelperService.pipedData.settings.focus == 'distance') {
      this.isTime = false;
      this.reachbilityHelperService.pipedData.settings.unit = 'Meter';
    }
    else if (this.reachbilityHelperService.pipedData.settings.focus == 'time') {
      this.reachbilityHelperService.pipedData.settings.unit = 'Minuten';
      this.isTime = true;
    }

    this.changeValues();
  }

  /////
    // Resets the slider for the distance-/time to initial values.
    ///
  resetSlider() {
    this.reachbilityHelperService.pipedData.settings.currentTODValue = 1;
  }

  /////
    // Changes the vehicle type according to an
    // action on the related buttons.
    ///
  changeType() {
    this.changeValues();
    this.resetSlider();
  }

  /////
    // Changes the max_value depending on the
    // selected vehicle type.
    ///
  changeValues() {
    if (this.reachbilityHelperService.pipedData.settings.transitMode == 'buffer') {
      this.reachbilityHelperService.pipedData.settings.focus = 'distance';
      $("#focus_distance").click();
      if (this.reachbilityHelperService.pipedData.settings.focus == 'distance')
        this.max_value = 5000;
      else
        this.max_value = 25;
    }

    if (this.reachbilityHelperService.pipedData.settings.transitMode == 'foot-walking') {
      if (this.reachbilityHelperService.pipedData.settings.focus == 'distance')
        this.max_value = 5000;
      else
        this.max_value = 25;
    }


    if (this.reachbilityHelperService.pipedData.settings.transitMode == 'cycling-regular') {
      if (this.reachbilityHelperService.pipedData.settings.focus == 'distance')
        this.max_value = 5000;
      else
        this.max_value = 20;
    }


    if (this.reachbilityHelperService.pipedData.settings.transitMode == 'driving-car') {
      if (this.reachbilityHelperService.pipedData.settings.focus == 'distance')
        this.max_value = 5000;
      else
        this.max_value = 15;
    }

    if (this.reachbilityHelperService.pipedData.settings.transitMode == 'wheelchair') {
      if (this.reachbilityHelperService.pipedData.settings.focus == 'distance')
        this.max_value = 5000;
      else
        this.max_value = 25;
    }

  }

  onClickPerDataset_isochroneConfig() {
    setTimeout(() => {
      if (!this.reachbilityHelperService.pipedData.settings.isochroneConfig.selectedDate) {
        this.reachbilityHelperService.pipedData.settings.isochroneConfig.selectedDate = this.reachbilityHelperService.pipedData.settings.selectedStartPointLayer.availablePeriodsOfValidity[this.reachbilityHelperService.pipedData.settings.selectedStartPointLayer.availablePeriodsOfValidity.length - 1];
      }
      if (!this.isUsedInReporting) {
        this.reachbilityHelperService.fetchGeoJSONForIsochrones();
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
      if (!this.isUsedInReporting) { // reporting uses it's own loading overlay, which is controlled there
        this.reachbilityHelperService.pipedData.settings.loadingData = true;
      }
      // And it just works! 
    }, 50);

    setTimeout(() => {
      this.error = undefined;

      this.reachbilityHelperService.startIsochroneCalculation(this.isUsedInReporting);

    }, 150);

  }

  isochronesCalculationFinished([reinit]) {

    this.reachabilityMapHelperService.replaceIsochroneMarker(this.domId, this.reachbilityHelperService.pipedData.settings.locationsArray);
    this.reachabilityMapHelperService.replaceIsochroneGeoJSON(
        this.domId,
        this.reachbilityHelperService.pipedData.settings.selectedStartPointLayer.datasetName,
        this.reachbilityHelperService.pipedData.currentIsochronesGeoJSON,
        this.reachbilityHelperService.pipedData.settings.transitMode,
        this.reachbilityHelperService.pipedData.settings.focus,
        this.reachbilityHelperService.pipedData.settings.rangeArray,
        this.reachbilityHelperService.pipedData.settings.useMultipleStartPoints,
        this.reachbilityHelperService.pipedData.settings.dissolveIsochrones);

  }
}
