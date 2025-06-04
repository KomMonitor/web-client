import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { MultiStepHelperServiceService } from 'services/multi-step-helper-service/multi-step-helper-service.service';
import { ReachabilityScenarioHelperService } from 'services/reachability-scenario-helper-service/reachability-scenario-helper-service.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';
import { SingleFeatureEditComponent } from "../../../../common/single-feature-edit/single-feature-edit.component";
import { ReachabilityScenarioConfigurationComponent } from './reachability-scenario-configuration/reachability-scenario-configuration.component';

@Component({
  selector: 'app-reachability-scenario-modal',
  standalone: true,
  templateUrl: './reachability-scenario-modal.component.html',
  styleUrls: ['./reachability-scenario-modal.component.css'],
  imports: [CommonModule, FormsModule, SingleFeatureEditComponent, ReachabilityScenarioConfigurationComponent]
})
export class ReachabilityScenarioModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  emptyDatasetName = "-- leerer neuer Datensatz --";

  filteredDisplayableGeoresources:any[] = [];
  selectedPoiResource:any;

  filteredAvailablePeriodsOfValidity:any;

  constructor(
    protected reachabilityHelperService: ReachabilityHelperService,
    private reachabilityScenarioHelperService: ReachabilityScenarioHelperService,
    protected dataExchangeService: DataExchangeService,
    private multiStepHelperService: MultiStepHelperServiceService,
    private broadcastService: BroadcastService,
    private http: HttpClient
  ) {
  }

  ngOnInit(): void {
    this.multiStepHelperService.registerClickHandler("reachabilityScenarioForm");

    this.filteredDisplayableGeoresources = this.dataExchangeService.pipedData.displayableGeoresources.filter(e => e.isPOI);
  }

		/* 	$('#modal-manage-reachability-scenario').on('show.bs.modal', function (event) {
				if (event.target.id === "modal-manage-reachability-scenario") {
					$scope.initEmptyDataset();
				}
			});

			$('#modal-manage-reachability-scenario').on('hidden.bs.modal', function (event) {
				if (event.target.id === "modal-manage-reachability-scenario") {
					$scope.cleanEmptyDataset();
				}
			});

			$scope.initEmptyDataset = function () {
				// add empty dataset to displayableGeoresources
				// ensure to remove it again, if modal gets closed

				// create empty georesource dataset and geoJSON 
				let emptyDataset = {
					"georesourceId": uuidv4(),
					"datasetName": $scope.emptyDatasetName,
					"isNewReachabilityDataSource": true,
					"isPOI": true,
					"availablePeriodsOfValidity": [
						{
							"startDate": undefined,
							"endDate": undefined
						}
					],
					"poiMarkerColor": "orange",
					"poiSymbolBootstrap3Name": "pushpin",
					"poiSymbolColor": "white",
				};

				emptyDataset.geoJSON_reachability = {
					"type": "FeatureCollection",
					"features": []
				};

				kommonitorDataExchangeService.displayableGeoresources.splice(0, 0, emptyDataset)

				$timeout(function () {
					$scope.$digest();
				}, 250);
			};

			$scope.cleanEmptyDataset = function () {
				// remove empty dataset again
				// only if user has not renamed it

				if (kommonitorDataExchangeService.displayableGeoresources[0].datasetName === $scope.emptyDatasetName) {
					kommonitorDataExchangeService.displayableGeoresources.splice(0, 1);
				}

			};

			$scope.resetReachabilityScenarioForm = function(){
				kommonitorReachabilityHelperService.settings.selectedStartPointLayer = undefined;
				kommonitorReachabilityHelperService.currentIsochronesGeoJSON = undefined;
				kommonitorReachabilityHelperService.original_nonDissolved_isochrones = undefined;
				kommonitorReachabilityScenarioHelperService.resetTmpActiveScenario();
				kommonitorReachabilityHelperService.resetSettings();
			}


			$scope.$on("onManageReachabilityScenario", function (event, scenarioDataset) {

				kommonitorMultiStepFormHelperService.registerClickHandler("reachabilityScenarioForm");
				if (scenarioDataset) {						

					if (kommonitorReachabilityScenarioHelperService.tmpActiveScenario.scenarioName && kommonitorReachabilityScenarioHelperService.tmpActiveScenario.scenarioName == scenarioDataset.scenarioName) {
						return;
					}
					else {								
						kommonitorReachabilityScenarioHelperService.loadActiveScenario(scenarioDataset);	
						$scope.initPoiResourceEditFeaturesMenu();
					}
				}

			});
  */
      // async
			onChangePoiResource(poiId:any) {

        this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer = this.filteredDisplayableGeoresources.filter(e => e.georesourceId==poiId)[0];
				this.reachabilityHelperService.pipedData.settings.isochroneConfig.selectedDate = undefined;

				if(this.reachabilityHelperService.pipedData.tmpActiveScenario?.poiDataset &&
					this.reachabilityHelperService.pipedData.tmpActiveScenario?.poiDataset.poiName &&
					this.reachabilityHelperService.pipedData.tmpActiveScenario?.poiDataset.poiName != this.reachabilityHelperService.pipedData.tmpActiveScenario?.reachabilitySettings.selectedStartPointLayer.datasetName){
						//kommonitorToastHelperService.displayWarningToast("Datenquelle neu gesetzt", "Die weiteren Abschnitte weisen vielleicht veraltete Daten auf.");
					}

				// if emtpy layer is selected then no features can be fetched at all!
				if (this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.isNewReachabilityDataSource || this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.isTmpDataLayer) {
					
					// if tmp datalayer has been selected we assume that there are features already in property .geoJSON
					if(this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.isTmpDataLayer){
						this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.geoJSON_reachability = this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.geoJSON;
					}
					
					// init geoMap with empty dataset
					this.initPoiResourceEditFeaturesMenu();
					return;
				}

				if (!this.reachabilityHelperService.pipedData.settings.isochroneConfig.selectedDate) {
					this.reachabilityHelperService.pipedData.settings.isochroneConfig.selectedDate = this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer?.availablePeriodsOfValidity[this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.availablePeriodsOfValidity.length - 1];
				}

        this.prepAvailablePeriods(); 
        this.reachabilityHelperService.pipedData.settings.isochroneConfig.selectedDate = this.filteredAvailablePeriodsOfValidity[this.filteredAvailablePeriodsOfValidity.length-1];
				
        this.fetchPoiResourceGeoJSON(this.reachabilityHelperService.pipedData.settings.isochroneConfig.selectedDate);
			}

      prepAvailablePeriods() {

        let tempDates:any[] = [];
        this.filteredAvailablePeriodsOfValidity = this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.availablePeriodsOfValidity.filter(e => {
          
          if(!tempDates.includes(e.startDate)) {
            tempDates.push(e.startDate);
            return true;
          }

          return false;
        }).sort((a,b) => { 
          if(a>b)
            return -1;
          else  
            return 1;
        });
      }
        

			fetchPoiResourceGeoJSON(date:any) {

        this.reachabilityHelperService.pipedData.settings.isochroneConfig.selectedDate = date;
				var dateComps = this.reachabilityHelperService.pipedData.settings.isochroneConfig.selectedDate.startDate.split("-");

				var year = dateComps[0];
				var month = dateComps[1];
				var day = dateComps[2];

				// fetch from management API
        let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.georesourceId + "/" + year + "/" + month + "/" + day;
        this.http.get(url).subscribe({
          next: response => {

            this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.geoJSON_reachability = response;
            this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.geoJSON = response;

            // prepare feature edit geo map
            this.initPoiResourceEditFeaturesMenu();
          },
          error: error => {
            console.log(error)
          }
        });
      }
/*
			$scope.initFeatureSchema = async function () {
				kommonitorReachabilityHelperService.settings.selectedStartPointLayer.featureSchemaProperties = [];

				return await $http({
					url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + kommonitorReachabilityHelperService.settings.selectedStartPointLayer.georesourceId + "/schema",
					method: "GET",
					// headers: {
					//    'Content-Type': undefined
					// }
				}).then(function successCallback(response) {

					kommonitorReachabilityHelperService.settings.selectedStartPointLayer.schemaObject = response.data;

					for (var property in kommonitorReachabilityHelperService.settings.selectedStartPointLayer.schemaObject) {
						if (property != __env.FEATURE_ID_PROPERTY_NAME && property != __env.FEATURE_NAME_PROPERTY_NAME && property != __env.VALID_START_DATE_PROPERTY_NAME && property != __env.VALID_END_DATE_PROPERTY_NAME) {
							kommonitorReachabilityHelperService.settings.selectedStartPointLayer.featureSchemaProperties.push(
								{
									property: property,
									value: undefined
								}
							);
						}
					}

					return kommonitorReachabilityHelperService.settings.selectedStartPointLayer.schemaObject;

				}, function errorCallback(error) {

				});
			};
 */
			initPoiResourceEditFeaturesMenu() {
				// check if empty dataset for a new POI dataset has been selected
				// if so, no features can be fetched from KomMonitor Database as thex do not exist
				// then we must init feature edit component with empty dataset!
				let isReachabilityDatasetOnly = false;

				if (this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.isNewReachabilityDataSource || this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.isTmpDataLayer) {
					isReachabilityDatasetOnly = true;
					// check if geoJSON is available
					// is required by editFeature component
					if(!this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.geoJSON){
						this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.geoJSON = this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer.geoJSON_reachability
					}
				}

				this.broadcastService.broadcast("onEditGeoresourceFeatures", [this.reachabilityHelperService.pipedData.settings.selectedStartPointLayer, isReachabilityDatasetOnly]);

			};
/* 
			// react on events from single feature edit menu
			$scope.$on("georesourceGeoJSONUpdated", function(event, geoJSON){
				// simply update geoJSON of reachability layer
				kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON_reachability = geoJSON;
			});			
 */
}
