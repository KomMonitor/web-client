import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';

@Component({
  selector: 'app-reachability-scenario-configuration',
  standalone: true,
  templateUrl: './reachability-scenario-configuration.component.html',
  styleUrls: ['./reachability-scenario-configuration.component.css'],
  imports: [CommonModule, FormsModule]
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
    protected reachabilityHelperService: ReachabilityHelperService,
    private reachabilityMapHelperService: ReachabilityMapHelperService,
    protected dataExchangeService: DataExchangeService,
    private broadcastService: BroadcastService
  ) {
    // start points that were drawn manually
    // direct GeoJSON structure
    this.reachabilityHelperService.settings.manualStartPoints = undefined;

    // Indicator if multiple starting-points shall
    // be used.
    this.reachabilityHelperService.settings.useMultipleStartPoints = false;

    // The calculation unit-indicator.
    this.reachabilityHelperService.settings.unit = 'Meter';

    // array of arrays of lon, lat
    // [[lon,lat],[lon,lat]]
    this.reachabilityHelperService.settings.locationsArray = [];
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
          this.isochronesCalculationFinished();
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
    this.reachabilityHelperService.settings.selectedStartPointLayer = data;
  }

  onManageReachabilityScenario([scenarioDataset]) {

    this.isUsedInReporting = false;

  }

  resetForm() {
    this.resetSlider();

    this.error = undefined;

    this.reachabilityHelperService.resetSettings();

    this.broadcastService.broadcast('changeStartPointsSource_fromLayer');

    this.isTime = false;

    this.broadcastService.broadcast('removePotentialDrawnStartingPoints');

    this.error = undefined;
  }

  /////
    // TODO
  removeReachabilityLayers() {
    this.reachabilityHelperService.settings.loadingData = true;

    this.reachabilityMapHelperService.removeReachabilityLayers(this.domId);
    this.reachabilityHelperService.currentIsochronesGeoJSON = undefined;
    this.dataExchangeService.pipedData.isochroneLegend = undefined;
    // remove any diagram
    this.broadcastService.broadcast("resetPoisInIsochrone");
    this.reachabilityHelperService.settings.loadingData = false;
  }


  downloadIsochrones(){
    var geoJSON_string = JSON
      .stringify(this.reachabilityHelperService.currentIsochronesGeoJSON);

    var fileName = 'Erreichbarkeitsisochronen_via-' +
      this.reachabilityHelperService.settings.transitMode +
      '_Abbruchkriterium-' +
      this.reachabilityHelperService.settings.focus + '.geojson';

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

    this.reachabilityHelperService.settings.focus = value;

    if (value === 'time' && this.reachabilityHelperService.settings.transitMode === "buffer") {
      this.reachabilityHelperService.settings.focus = 'distance'
      this.isTime = false;
      this.reachabilityHelperService.settings.unit = 'Meter';
      this.changeValues();
      return;
    }

    this.resetSlider();

    if (this.reachabilityHelperService.settings.focus == 'distance') {
      this.isTime = false;
      this.reachabilityHelperService.settings.unit = 'Meter';
    }
    else if (this.reachabilityHelperService.settings.focus == 'time') {
      this.reachabilityHelperService.settings.unit = 'Minuten';
      this.isTime = true;
    }

    this.changeValues();
  }

  /////
    // Resets the slider for the distance-/time to initial values.
    ///
  resetSlider() {
    this.reachabilityHelperService.settings.currentTODValue = 1;
  }

  /////
    // Changes the vehicle type according to an
    // action on the related buttons.
    ///
  changeType(value) {

    this.reachabilityHelperService.settings.transitMode = value;

    this.changeValues();
    this.resetSlider();
  }

  /////
    // Changes the max_value depending on the
    // selected vehicle type.
    ///
  changeValues() {
    if (this.reachabilityHelperService.settings.transitMode == 'buffer') {
      this.reachabilityHelperService.settings.focus = 'distance';
      $("#focus_distance").click();
      if (this.reachabilityHelperService.settings.focus == 'distance')
        this.max_value = 5000;
      else
        this.max_value = 25;
    }

    if (this.reachabilityHelperService.settings.transitMode == 'foot-walking') {
      if (this.reachabilityHelperService.settings.focus == 'distance')
        this.max_value = 5000;
      else
        this.max_value = 25;
    }


    if (this.reachabilityHelperService.settings.transitMode == 'cycling-regular') {
      if (this.reachabilityHelperService.settings.focus == 'distance')
        this.max_value = 5000;
      else
        this.max_value = 20;
    }


    if (this.reachabilityHelperService.settings.transitMode == 'driving-car') {
      if (this.reachabilityHelperService.settings.focus == 'distance')
        this.max_value = 5000;
      else
        this.max_value = 15;
    }

    if (this.reachabilityHelperService.settings.transitMode == 'wheelchair') {
      if (this.reachabilityHelperService.settings.focus == 'distance')
        this.max_value = 5000;
      else
        this.max_value = 25;
    }

  }

  onClickPerDataset_isochroneConfig() {
    setTimeout(() => {
      if (!this.reachabilityHelperService.settings.isochroneConfig.selectedDate) {
        this.reachabilityHelperService.settings.isochroneConfig.selectedDate = this.reachabilityHelperService.settings.selectedStartPointLayer.availablePeriodsOfValidity[this.reachabilityHelperService.settings.selectedStartPointLayer.availablePeriodsOfValidity.length - 1];
      }
      if (!this.isUsedInReporting) {
        this.reachabilityHelperService.fetchGeoJSONForIsochrones();
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
        this.reachabilityHelperService.settings.loadingData = true;
      }
      // And it just works! 
    }, 50);

    setTimeout(() => {
      this.error = undefined;

      this.reachabilityHelperService.startIsochroneCalculation(this.isUsedInReporting);
    }, 150);

  }

  isochronesCalculationFinished() {

    this.reachabilityMapHelperService.replaceIsochroneMarker(this.domId, this.reachabilityHelperService.settings.locationsArray);
    this.reachabilityMapHelperService.replaceIsochroneGeoJSON(
        this.domId,
        this.reachabilityHelperService.settings.selectedStartPointLayer.datasetName,
        this.reachabilityHelperService.currentIsochronesGeoJSON,
        this.reachabilityHelperService.settings.transitMode,
        this.reachabilityHelperService.settings.focus,
        this.reachabilityHelperService.settings.rangeArray,
        this.reachabilityHelperService.settings.useMultipleStartPoints,
        this.reachabilityHelperService.settings.dissolveIsochrones);

  }
}
