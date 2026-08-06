import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, inject, OnChanges, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { ReachabilityScenarioHelperService } from 'services/reachability-scenario-helper-service/reachability-scenario-helper-service.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
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
    CommonModule,
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
  private envConfigService = inject(EnvConfigService);
  private broadcastService = inject(BroadcastService);
  protected reachabilityScenarioHelperService = inject(ReachabilityScenarioHelperService);
  private cdr = inject(ChangeDetectorRef);

  private readonly destroyRef = inject(DestroyRef);

  activeModal = inject(NgbActiveModal);
  emptyDatasetName = '-- leerer neuer Datensatz --';
  // Der Platzhalter-Text muss mit dem in reachbility-scenario-setup.component.html übereinstimmen

  filteredDisplayableGeoresources: any[] = [];
  selectedPoiResource: any;

  filteredAvailablePeriodsOfValidity: any;

  activeScenarioDataset: any;

  // Configurable max-width (in px) for long-form text in the scenario modal.
  // When the modal body is wider than this value, descriptive text flows into
  // multiple CSS columns for improved readability. Falls back to 600px.
  maxTextWidth: number = 800;

  // Steps shown as vertical, clickable tiles on the left of the wizard. Each
  // step's content is rendered in the fieldset at the same index on the right.
  readonly steps: { label: string; icon: string }[] = [
    { label: 'Name & Datenquelle', icon: 'fa-solid fa-file-signature' },
    { label: 'Punkte bearbeiten', icon: 'fa-solid fa-location-dot' },
    { label: 'Erreichbarkeit berechnen', icon: 'fa-solid fa-route' },
    { label: 'Punkte in Erreichbarkeit', icon: 'fa-solid fa-map-location-dot' },
    { label: 'Indikatoren-Statistik', icon: 'fa-solid fa-chart-column' },
  ];

  // Index of the step whose fieldset is currently visible on the right.
  currentStepIndex = 0;

  ngOnInit(): void {
    const configured = this.envConfigService.reachabilityScenarioMaxTextWidth;
    if (configured) {
      const parsed = typeof configured === 'number' ? configured : parseInt(configured, 10);
      if (!isNaN(parsed) && parsed > 0) {
        this.maxTextWidth = parsed;
      }
    }
    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((broadcastMsg) => {
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

  /**
   * Activates the step at `index` (both for a click on its nav tile and for the
   * "next"/"previous" buttons inside a fieldset) and, when arriving at steps 2-5,
   * fires the same reinit broadcast the old progressbar/next-button click handlers
   * used to fire. Going to a previous step never re-triggers a reinit broadcast,
   * matching the original wizard's behaviour.
   */
  goToStep(index: number, notify: boolean = true) {
    this.currentStepIndex = index;

    if (!notify) {
      return;
    }

    switch (index) {
      case 1:
        this.onEditFeaturesClick();
        break;
      case 2:
        this.onReachbilityConfigurationClick();
        break;
      case 3:
        this.onPoisInReachabilityClick();
        break;
      case 4:
        this.onIndicatorStatisticsClick();
        break;
    }
  }

  onEditFeaturesClick() {
    setTimeout(
      () => this.broadcastService.broadcast(BroadcastMessage.ReinitSingleFeatureEdit),
      250
    );
  }

  onClickAddScenario() {
    this.reachabilityScenarioHelperService.addReachabilityScenario();

    // Snapshot is already taken by addReachabilityScenario() above, so it's safe to now
    // clear the live session (POI selections/diagrams on step 4, map layers on steps 4+5,
    // quick-calc locations/isochrones). Without this, those linger on the shared
    // georesource store / map registries and corrupt the next quick-calc scenario, which
    // reuses the same step components and DOM ids (only a reload currently clears them).
    this.resetReachabilityScenarioForm();

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

  resetReachabilityScenarioForm() {
    // Setzt alle Eingaben im Szenario-Formular und die Berechnungsergebnisse auf der
    // Hauptkarte zurück, sodass "Zurücksetzen" alle Erreichbarkeits-Daten löscht.
    this.reachabilityStateService.resetScenarioSession();

    // clear each step's own local UI state and rendered map layers. This is deliberately
    // distinct from the "Reinit*" broadcasts (fired on tab switch), which only
    // resize/redraw against whatever dataset is currently selected — reusing those here
    // would just re-fetch and re-render the stale (now cleared) dataset
    this.broadcastService.broadcast(BroadcastMessage.ResetSingleFeatureEdit);
    this.broadcastService.broadcast(BroadcastMessage.ResetReachabilityScenarioConfiguration);
    this.broadcastService.broadcast(BroadcastMessage.ResetPoisInIsochrone);
    this.broadcastService.broadcast(BroadcastMessage.ResetReachabilityIndicatorStatistics);

    // jump the wizard back to step 1, since its cleared working data no longer matches
    // whichever step the user was on
    this.currentStepIndex = 0;
  }

  onManageReachabilityScenario(scenarioDataset) {
    if (scenarioDataset) {
      // Compare by object reference, not by scenarioName: manually-drawn quick-calc
      // scenarios all share the same default title ("Erreichbarkeitsszenario"), so a
      // name comparison would skip reloading a different scenario with the same title
      // (e.g. after importing one) and leave stale/missing isochrones in steps 3-5.
      if (this.activeScenarioDataset === scenarioDataset) {
        return;
      } else {
        this.activeScenarioDataset = scenarioDataset;
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
						if (property != this.envConfigService.FEATURE_ID_PROPERTY_NAME && property != this.envConfigService.FEATURE_NAME_PROPERTY_NAME && property != this.envConfigService.VALID_START_DATE_PROPERTY_NAME && property != this.envConfigService.VALID_END_DATE_PROPERTY_NAME) {
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
