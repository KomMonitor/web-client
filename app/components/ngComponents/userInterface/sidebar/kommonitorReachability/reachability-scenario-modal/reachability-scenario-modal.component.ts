import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnChanges, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { MultiStepHelperServiceService } from 'services/multi-step-helper-service/multi-step-helper-service.service';
import { ReachabilityScenarioHelperService } from 'services/reachability-scenario-helper-service/reachability-scenario-helper-service.service';
import { ReachabilityStateService } from 'services/reachability-state-service/reachability-state.service';
import { ReachabilityScenarioConfigurationComponent } from './reachability-scenario-configuration/reachability-scenario-configuration.component';
import { ReachabilityPoiInIsoComponent } from './reachability-poi-in-iso/reachability-poi-in-iso.component';
import { ReachbilityScenarioSetupComponent } from './reachbility-scenario-setup/reachbility-scenario-setup.component';
import { SingleFeatureEditComponent } from 'components/ngComponents/common/single-feature-edit/single-feature-edit.component';
import { ReachabilityIndicatorStatisticsComponent } from './reachability-indicator-statistics/reachability-indicator-statistics.component';

@Component({
  selector: 'app-reachability-scenario-modal',
  standalone: true,
  templateUrl: './reachability-scenario-modal.component.html',
  styleUrls: ['./reachability-scenario-modal.component.scss'],
  imports: [
    FormsModule,
    ReachabilityScenarioConfigurationComponent,
    ReachabilityPoiInIsoComponent,
    ReachbilityScenarioSetupComponent,
    SingleFeatureEditComponent,
    ReachabilityIndicatorStatisticsComponent,
  ],
})
export class ReachabilityScenarioModalComponent implements OnInit {
  protected reachabilityStateService = inject(ReachabilityStateService);
  private multiStepHelperService = inject(MultiStepHelperServiceService);
  private broadcastService = inject(BroadcastService);
  protected reachabilityScenarioHelperService = inject(ReachabilityScenarioHelperService);
  private cdr = inject(ChangeDetectorRef);

  activeModal = inject(NgbActiveModal);
  emptyDatasetName = '-- leerer neuer Datensatz --';

  filteredDisplayableGeoresources: any[] = [];
  selectedPoiResource: any;

  filteredAvailablePeriodsOfValidity: any;

  activeScenarioDataset: any;

  ngOnInit(): void {
    this.multiStepHelperService.registerClickHandler('reachabilityScenarioForm');

    this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      const title = broadcastMsg.msg;
      const values: any = broadcastMsg.values;

      switch (title) {
        case BroadcastMessage.GeoresourceGeoJSONUpdated:
          {
            if (this.reachabilityStateService.settings.selectedStartPointLayer) {
              this.reachabilityStateService.settings.selectedStartPointLayer.geoJSON_reachability =
                values[0];
              this.reachabilityStateService.settings.selectedStartPointLayer.geoJSON = values[0];
            }
          }
          break;
      }
    });
  }

  onEditFeaturesClick() {
    setTimeout(
      () => this.broadcastService.broadcast(BroadcastMessage.ReinitSingleFeatureEdit),
      250
    );
  }

  onClickAddScenario() {
    this.reachabilityScenarioHelperService.addReachabilityScenario();
    this.activeModal.close();
  }

  onReachbilityConfigurationClick() {
    setTimeout(
      () => this.broadcastService.broadcast(BroadcastMessage.ReinitReachabilityConfiguration),
      250
    );
  }

  onPoisInReachabilityClick() {
    setTimeout(
      () => this.broadcastService.broadcast(BroadcastMessage.ReinitPoisInReachabilityMap),
      250
    );
  }

  onIndicatorStatisticsClick() {
    setTimeout(
      () =>
        this.broadcastService.broadcast(BroadcastMessage.ReinitIndicatorStatisticsConfiguration),
      250
    );
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


  */
  resetReachabilityScenarioForm() {
    // resets both the wizard's own working data and the quick-calc session (locations/
    // isochrones shown independently on the main map), so "Zurücksetzen" clears
    // everything reachability-related
    this.reachabilityStateService.resetScenarioSession();

    // clear each step's own local UI state and rendered map layers. This is deliberately
    // distinct from the "Reinit*" broadcasts (fired on tab switch), which only
    // resize/redraw against whatever dataset is currently selected — reusing those here
    // would just re-fetch and re-render the stale (now cleared) dataset
    this.broadcastService.broadcast(BroadcastMessage.ResetSingleFeatureEdit);
    this.broadcastService.broadcast(BroadcastMessage.ResetReachabilityScenarioConfiguration);
    this.broadcastService.broadcast(BroadcastMessage.ResetPoisInIsochrone);
    this.broadcastService.broadcast(BroadcastMessage.ResetReachabilityIndicatorStatistics);
  }

  onManageReachabilityScenario(scenarioDataset) {
    if (scenarioDataset) {
      if (
        this.reachabilityStateService.scenarioTitle &&
        this.reachabilityStateService.scenarioTitle == scenarioDataset.scenarioName
      ) {
        return;
      } else {
        this.reachabilityScenarioHelperService.loadActiveScenario(scenarioDataset);
        this.initPoiResourceEditFeaturesMenu();
        this.cdr.detectChanges();
      }
    }
  }

  async initPoiResourceEditFeaturesMenu() {
    // check if empty dataset for a new POI dataset has been selected
    // if so, no features can be fetched from KomMonitor Database as thex do not exist
    // then we must init feature edit component with empty dataset!
    let isReachabilityDatasetOnly = false;

    if (this.reachabilityStateService.settings.selectedStartPointLayer) {
      if (
        this.reachabilityStateService.settings.selectedStartPointLayer
          .isNewReachabilityDataSource ||
        this.reachabilityStateService.settings.selectedStartPointLayer.isTmpDataLayer
      ) {
        isReachabilityDatasetOnly = true;
        // check if geoJSON is available
        // is required by editFeature component
        if (!this.reachabilityStateService.settings.selectedStartPointLayer.geoJSON) {
          this.reachabilityStateService.settings.selectedStartPointLayer.geoJSON =
            this.reachabilityStateService.settings.selectedStartPointLayer.geoJSON_reachability;
        }
      }
    }

    this.broadcastService.broadcast(BroadcastMessage.OnEditGeoresourceFeatures, [
      this.reachabilityStateService.settings.selectedStartPointLayer,
      isReachabilityDatasetOnly,
    ]);
  }

  /* prepAvailablePeriods() {

        let tempDates:any[] = [];
        this.filteredAvailablePeriodsOfValidity = this.reachabilityStateService.settings.selectedStartPointLayer.availablePeriodsOfValidity.filter(e => {
          
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
