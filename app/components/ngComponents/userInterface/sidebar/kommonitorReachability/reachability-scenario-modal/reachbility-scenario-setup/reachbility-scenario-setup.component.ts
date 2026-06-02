import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReachabilityCombinerService } from 'services/reachability-combiner-service/reachability-combiner.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';
import { ColorPickerDirective } from "ngx-color-picker";
import { ReachabilityScenarioHelperService } from 'services/reachability-scenario-helper-service/reachability-scenario-helper-service.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

@Component({
  standalone: true,
  selector: 'app-reachbility-scenario-setup',
  templateUrl: './reachbility-scenario-setup.component.html',
  styleUrls: ['./reachbility-scenario-setup.component.css'],
  imports: [
    CommonModule,
    FormsModule
]
})
export class ReachbilityScenarioSetupComponent {

  constructor(
    protected reachabilityHelperService: ReachabilityHelperService,
    private reachabilityScenarioHelperService: ReachabilityScenarioHelperService,
    protected reachabilityCombinerService: ReachabilityCombinerService,
    private broadcastService: BroadcastService
  ) { }

  onChangePoiResource() {

    this.reachabilityHelperService.settings.selectedStartPointLayer = this.reachabilityCombinerService.selectedStartPointLayer;

    if(this.reachabilityScenarioHelperService.tmpActiveScenario.poiDataset &&
        this.reachabilityScenarioHelperService.tmpActiveScenario.poiDataset.poiName &&
        this.reachabilityScenarioHelperService.tmpActiveScenario.poiDataset.poiName != this.reachabilityScenarioHelperService.tmpActiveScenario.reachabilitySettings.selectedStartPointLayer.datasetName){
        //kommonitorToastHelperService.displayWarningToast("Datenquelle neu gesetzt", "Die weiteren Abschnitte weisen vielleicht veraltete Daten auf.");
      }

    // if emtpy layer is selected then no features can be fetched at all!
    if (this.reachabilityHelperService.settings.selectedStartPointLayer.isNewReachabilityDataSource || this.reachabilityHelperService.settings.selectedStartPointLayer.isTmpDataLayer) {
      
      // if tmp datalayer has been selected we assume that there are features already in property .geoJSON
      if(this.reachabilityHelperService.settings.selectedStartPointLayer.isTmpDataLayer){
        this.reachabilityHelperService.settings.selectedStartPointLayer.geoJSON_reachability = this.reachabilityHelperService.settings.selectedStartPointLayer.geoJSON;
      }
      
      // init geoMap with empty dataset
      this.initPoiResourceEditFeaturesMenu();
      return;
    }

    if (!this.reachabilityHelperService.settings.isochroneConfig.selectedDate) {
      this.reachabilityHelperService.settings.isochroneConfig.selectedDate = this.reachabilityHelperService.settings.selectedStartPointLayer?.availablePeriodsOfValidity[this.reachabilityHelperService.settings.selectedStartPointLayer.availablePeriodsOfValidity.length - 1];
    }

    this.reachabilityCombinerService.prepAvailablePeriods(); 
    this.reachabilityCombinerService.selectedStartDate = this.reachabilityCombinerService.filteredAvailablePeriodsOfValidity.at(-1).startDate;
    this.reachabilityHelperService.settings.isochroneConfig.selectedDate = this.reachabilityCombinerService.filteredAvailablePeriodsOfValidity.at(-1).startDate;
    
    this.fetchPoiResourceGeoJSON();
  }

  fetchPoiResourceGeoJSON() {
    this.reachabilityCombinerService.fetchPoiResourceGeoJSON(false);
    this.initPoiResourceEditFeaturesMenu();
  }

  initPoiResourceEditFeaturesMenu() {
    // check if empty dataset for a new POI dataset has been selected
    // if so, no features can be fetched from KomMonitor Database as thex do not exist
    // then we must init feature edit component with empty dataset!
    let isReachabilityDatasetOnly = false;

    if (this.reachabilityHelperService.settings.selectedStartPointLayer.isNewReachabilityDataSource || this.reachabilityHelperService.settings.selectedStartPointLayer.isTmpDataLayer) {
      isReachabilityDatasetOnly = true;
      // check if geoJSON is available
      // is required by editFeature component
      if(!this.reachabilityHelperService.settings.selectedStartPointLayer.geoJSON){
        this.reachabilityHelperService.settings.selectedStartPointLayer.geoJSON = this.reachabilityHelperService.settings.selectedStartPointLayer.geoJSON_reachability
      }
    }

    this.broadcastService.broadcast("onEditGeoresourceFeatures", [this.reachabilityHelperService.settings.selectedStartPointLayer, isReachabilityDatasetOnly]);
  };
}
