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
import { ReachabilityScenarioConfigurationComponent } from './reachability-scenario-configuration/reachability-scenario-configuration.component';
import { ReachabilityPoiInIsoComponent } from './reachability-poi-in-iso/reachability-poi-in-iso.component';
import { ReachabilityCombinerService } from 'services/reachability-combiner-service/reachability-combiner.service';
import { ReachbilityScenarioSetupComponent } from './reachbility-scenario-setup/reachbility-scenario-setup.component';
import { SingleFeatureEditComponent } from 'components/ngComponents/common/single-feature-edit/single-feature-edit.component';
import { ReachabilityIndicatorStatisticsComponent } from './reachability-indicator-statistics/reachability-indicator-statistics.component';

@Component({
  selector: 'app-reachability-scenario-modal',
  standalone: true,
  templateUrl: './reachability-scenario-modal.component.html',
  styleUrls: ['./reachability-scenario-modal.component.scss'],
  imports: [
    CommonModule, 
    FormsModule, 
    ReachabilityScenarioConfigurationComponent, 
    ReachabilityPoiInIsoComponent,
    ReachbilityScenarioSetupComponent,
    SingleFeatureEditComponent,
    ReachabilityIndicatorStatisticsComponent
  ]
})
export class ReachabilityScenarioModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  emptyDatasetName = "-- leerer neuer Datensatz --";

  filteredDisplayableGeoresources:any[] = [];
  selectedPoiResource:any;

  filteredAvailablePeriodsOfValidity:any;

  constructor(
    protected reachabilityHelperService: ReachabilityHelperService,
    protected dataExchangeService: DataExchangeService,
    private multiStepHelperService: MultiStepHelperServiceService,
    private broadcastService: BroadcastService,
    protected reachabilityScenarioHelperService: ReachabilityScenarioHelperService
  ) {
  }

  ngOnInit(): void {
    this.multiStepHelperService.registerClickHandler("reachabilityScenarioForm");
  }

  onEditFeaturesClick() {
    setTimeout(() => this.broadcastService.broadcast('reinitSingleFeatureEdit'),250);
  }

  onClickAddScenario() {
    this.reachabilityScenarioHelperService.addReachabilityScenario();
    this.activeModal.close();
  }

  onReachbilityConfigurationClick() {
    setTimeout(() => this.broadcastService.broadcast('reinitReachabilityConfiguration'),250);
  }

  onPoisInReachabilityClick() {
    setTimeout(() => this.broadcastService.broadcast('reinitPoisInReachabilityMap'),250);
  }

  onIndicatorStatisticsClick() {
    setTimeout(() => this.broadcastService.broadcast('reinitIndicatorStatisticsConfiguration'),250);
  }

  test() {
    console.log(this.reachabilityScenarioHelperService.tmpActiveScenario.scenarioName, this.reachabilityHelperService.currentIsochronesGeoJSON, this.reachabilityHelperService.original_nonDissolved_isochrones);
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
      /* prepAvailablePeriods() {

        let tempDates:any[] = [];
        this.filteredAvailablePeriodsOfValidity = this.reachabilityHelperService.settings.selectedStartPointLayer.availablePeriodsOfValidity.filter(e => {
          
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
      } */

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
			
/* 
			// react on events from single feature edit menu
			$scope.$on("georesourceGeoJSONUpdated", function(event, geoJSON){
				// simply update geoJSON of reachability layer
				kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON_reachability = geoJSON;
			});			
 */
}
