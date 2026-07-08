import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from '../../../../../../services/broadcast-service/broadcast.service';
import { BroadcastMessage } from '../../../../../../services/broadcast-service/broadcast-message';
import { ConfigStorageService } from '../../../../../../services/config-storage-service/config-storage.service';
import { IndicatorValueService } from '../../../../../../services/indicator-value-service/indicator-value.service';
import { GeoresourceMetadataStoreService } from '../../../../../../services/georesource-metadata-store-service/georesource-metadata-store.service';
import { TopicMetadataStoreService } from '../../../../../../services/topic-metadata-store-service/topic-metadata-store.service';
import { IndicatorMetadataStoreService } from '../../../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import { NotificationService } from '../../../../common/notification/notification.service';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';

@Component({
  selector: 'app-admin-filter-edit-modal',
  standalone: true,
  templateUrl: './admin-filter-edit-modal.component.html',
  styleUrls: ['./admin-filter-edit-modal.component.scss'],
  imports: [FormsModule, StepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFilterEditModalComponent {
  private indicatorValueService = inject(IndicatorValueService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private kommonitorConfigStorageService = inject(ConfigStorageService);
  private broadcastService = inject(BroadcastService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  activeModal = inject(NgbActiveModal);

  selectedItem: any = undefined;

  loadingData = false;
  successMessagePart = undefined;
  errorMessagePart = undefined;

  editIndicatorTableOptions = undefined;
  editGeoresourceTableOptions = undefined;

  selectedIndicatorIds: any[] = [];
  selectedGeoresourceIds: any[] = [];

  preppedGeoresourceData: any[] = [];
  preppedIndicatorData: any[] = [];

  indicatorTopicsEditTree: any[] = [];
  selectedIndicatorTopicEditIds: any[] = [];

  georesourceTopicsEditTree: any[] = [];
  selectedGeoresourceTopicEditIds: any[] = [];

  showSelectedIndicatorsOnly = false;
  showSelectedGeoresourcesOnly = false;
  showSelectedIndicatorsTopicsOnly = false;
  showSelectedGeoresourcesTopicsOnly = false;

  filterConfig: any[] = [];

  filterName!: string | undefined;

  // Multi-step form
  readonly stepper = new WizardStepper([
    { key: 'indicators', label: 'Indikatoren' },
    { key: 'indicatorTopics', label: 'Indikator-Themen' },
    { key: 'georesources', label: 'Georesourcen' },
    { key: 'georesourceTopics', label: 'Georesource-Themen' },
  ]);

  /* 	var addClickListenerToEachCollapseTrigger(){

			setTimeout(function(){
				$('.list-group-item > .editCollapseTrigger').on('click', function() {
			    $('.glyphicon', this)
			      .toggleClass('glyphicon-chevron-right')
			      .toggleClass('glyphicon-chevron-down');
						// manage entries
						var clickedTopicId = $(this).attr('id');
            if(document.getElementById('editSubTopic-'+clickedTopicId).style.display=='none')
              document.getElementById('editSubTopic-'+clickedTopicId).style.display = 'block';
            else
              document.getElementById('editSubTopic-'+clickedTopicId).style.display = 'none';
			  });
			}, 500);
		}; */

  // make sure that initial fetching of availableRoles has happened
  /* this.$on("initialMetadataLoadingCompleted", (event) {

      this.indicatorTopicsEditTree = prepTopicsTree(this.topicStore.availableTopics.filter(e => e.topicResource=='indicator'), 0, []);
      this.georesourceTopicsEditTree = prepTopicsTree(this.topicStore.availableTopics.filter(e => e.topicResource=='georesource'), 0, []);
			addClickListenerToEachCollapseTrigger();
		}); 

    this.$on("onGlobalFilterEdit", async (event, itemId) {

      this.selectedItem = itemId;

      // reset
      this.filterName = undefined;
      resetTreeSelection(this.indicatorTopicsEditTree);
      resetTreeSelection(this.georesourceTopicsEditTree);

      this.filterConfig = await kommonitorConfigStorageService.getFilterConfig();

      this.filterConfig.forEach((elem, index) => {
        if(index==itemId) {
          this.filterName = elem.name;

          this.selectedIndicatorTopicEditIds = elem.indicatorTopics;
          this.selectedGeoresourceTopicEditIds = elem.georesourceTopics;

          this.indicatorTopicsEditTree = prepTopicsTree(this.topicStore.availableTopics.filter(e => e.topicResource=='indicator'), 0, this.selectedIndicatorTopicEditIds);
          this.georesourceTopicsEditTree = prepTopicsTree(this.topicStore.availableTopics.filter(e => e.topicResource=='georesource'),0, this.selectedGeoresourceTopicEditIds);

          this.selectedIndicatorTopicEditIds.forEach(e => {
            searchIndicatorItemRecursive(this.indicatorTopicsEditTree, e, true);
          });

          this.selectedGeoresourceTopicEditIds.forEach(e => {
            searchGeoresourceItemRecursive(this.georesourceTopicsEditTree, e, true);
          });
          
          this.selectedIndicatorIds = elem.indicators;
          this.selectedGeoresourceIds = elem.georesources;
          
          refreshIndicatorsTable();
          refreshGeoresourcesTable();
          
          setTimeout(() => {
            this.$digest();
          }, 250);
        }
      });
		});  */

  // georesource tree
  onSelectedGeoresourceEditItemsChange(id, selected) {
    if (selected === true) {
      if (!this.selectedGeoresourceTopicEditIds.includes(id))
        this.selectedGeoresourceTopicEditIds.push(id);
    } else
      this.selectedGeoresourceTopicEditIds = this.selectedGeoresourceTopicEditIds.filter(
        (e) => e != id
      );

    if (this.selectedGeoresourceTopicEditIds.length == 0)
      this.showSelectedGeoresourcesTopicsOnly = false;

    this.searchGeoresourceItemRecursive(this.georesourceTopicsEditTree, id, selected);
  }

  onShowSelectedIndicatorsOnly() {
    this.refreshIndicatorsTable();
  }
  onShowSelectedGeoresourcesOnly() {
    this.refreshGeoresourcesTable();
  }

  searchGeoresourceItemRecursive(tree, id, selected) {
    let ret = false;

    tree.forEach((entry) => {
      if (entry.topicId == id) {
        if (selected === true && document.getElementById('editCheckbox-' + id)) {
          const elem: any = document.getElementById('editCheckbox-' + id);

          elem.checked = true;
          elem.style.display = 'block';
        }

        this.checkGeoresourceItemsRecursive(entry.subTopics, selected);

        ret = true;
      } else {
        const itemFound = this.searchGeoresourceItemRecursive(entry.subTopics, id, selected);
        if (itemFound === true && document.getElementById('editSubTopic-' + entry.topicId)) {
          const elem: any = document.getElementById('editSubTopic-' + entry.topicId);
          elem.style.display = 'block';
          ret = true;
        }
      }
    });

    return ret;
  }

  checkGeoresourceItemsRecursive(tree, selected) {
    tree.forEach((entry) => {
      if (document.getElementById('editCheckbox-' + entry.topicId)) {
        const elem: any = document.getElementById('editCheckbox-' + entry.topicId);

        if (selected === true) {
          elem.checked = true;
          elem.disabled = true;
        } else {
          elem.checked = false;
          elem.disabled = false;
        }
      }

      // delete all downlevel items if they exists, just in case a level higher up has been checked afterwards
      this.selectedGeoresourceTopicEditIds = this.selectedGeoresourceTopicEditIds.filter(
        (e) => e != entry.topicId
      );

      if (entry.subTopics.length > 0)
        this.checkGeoresourceItemsRecursive(entry.subTopics, selected);
    });
  }
  // end

  // indicator tree
  onSelectedIndicatorEditItemsChange(id, selected) {
    if (selected === true) {
      if (!this.selectedIndicatorTopicEditIds.includes(id))
        this.selectedIndicatorTopicEditIds.push(id);
    } else
      this.selectedIndicatorTopicEditIds = this.selectedIndicatorTopicEditIds.filter(
        (e) => e != id
      );

    if (this.selectedIndicatorTopicEditIds.length == 0)
      this.showSelectedIndicatorsTopicsOnly = false;

    this.searchIndicatorItemRecursive(this.indicatorTopicsEditTree, id, selected);
  }

  searchIndicatorItemRecursive(tree, id, selected) {
    let ret = false;

    tree.forEach((entry) => {
      if (entry.topicId == id) {
        if (selected === true && document.getElementById('editCheckbox-' + id)) {
          const elem: any = document.getElementById('editCheckbox-' + id);

          elem.checked = true;
          elem.style.display = 'block';
        }

        this.checkIndicatorItemsRecursive(entry.subTopics, selected);

        ret = true;
      } else {
        const itemFound = this.searchIndicatorItemRecursive(entry.subTopics, id, selected);
        if (itemFound === true && document.getElementById('editSubTopic-' + entry.topicId)) {
          document.getElementById('editSubTopic-' + entry.topicId)!.style.display = 'block';
          ret = true;
        }
      }
    });

    return ret;
  }

  checkIndicatorItemsRecursive(tree, selected) {
    tree.forEach((entry) => {
      if (document.getElementById('editCheckbox-' + entry.topicId)) {
        const elem: any = document.getElementById('editCheckbox-' + entry.topicId);

        if (selected === true) {
          elem.checked = true;
          elem.disabled = true;
        } else {
          elem.checked = false;
          elem.disabled = false;
        }
      }

      // delete all downlevel items if they exists, just in case a level higher up has been checked afterwards
      this.selectedIndicatorTopicEditIds = this.selectedIndicatorTopicEditIds.filter(
        (e) => e != entry.topicId
      );

      if (entry.subTopics.length > 0) this.checkIndicatorItemsRecursive(entry.subTopics, selected);
    });
  }
  // end

  prepTopicsTree(tree, level, selectedItemIds) {
    tree.forEach((entry) => {
      entry.level = level;
      entry.selected = selectedItemIds.includes(entry.topicId);

      if (entry.subTopics.length > 0) {
        const newLevel = level + 1;
        entry.subTopics = this.prepTopicsTree(entry.subTopics, newLevel, selectedItemIds);
      }
    });

    return tree;
  }

  checkGeoresourcesTopicsTreeVisibility(entry) {
    if (this.showSelectedGeoresourcesTopicsOnly === false) return true;

    if (entry.selected) return true;
    else {
      if (entry.subTopics.length > 0)
        return this.checkTopicsTreeVisibilityRecursive(entry.subTopics);
      else return false;
    }
  }

  checkIndicatorTopicsTreeVisibility(entry) {
    if (this.showSelectedIndicatorsTopicsOnly === false) return true;

    if (entry.selected) return true;
    else {
      if (entry.subTopics.length > 0)
        return this.checkTopicsTreeVisibilityRecursive(entry.subTopics);
      else return false;
    }
  }

  checkTopicsTreeVisibilityRecursive(entries): any {
    let ret = false;

    entries.forEach((entry: any) => {
      if (entry.selected) ret = true;
      else {
        if (entry.subTopics.length > 0) {
          const subRet = this.checkTopicsTreeVisibilityRecursive(entry.subTopics);

          if (ret === false) ret = subRet;
        } else ret = false;
      }
    });

    return ret;
  }

  resetTreeSelection(tree) {
    tree.forEach((entry) => {
      if (document.getElementById('editCheckbox-' + entry.topicId)) {
        const elem: any = document.getElementById('editCheckbox-' + entry.topicId);

        elem.checked = false;
        elem.disabled = false;

        elem.style.display = 'none';

        if (entry.subTopics.length > 0) this.resetTreeSelection(entry.subTopics);
      }
    });
  }

  refreshGeoresourcesTable() {
    this.georesourceStore.availableGeoresources.forEach((element, index) => {
      this.preppedGeoresourceData[index] = {
        id: element.georesourceId,
        name: element.datasetName,
        description: element.metadata.description,
        checked: this.selectedGeoresourceIds.includes(element.georesourceId),
      };
    });

    if (this.selectedGeoresourceIds.length == 0) this.showSelectedGeoresourcesOnly = false;

    if (this.showSelectedGeoresourcesOnly)
      this.preppedGeoresourceData = this.preppedGeoresourceData.filter((e) => e.checked === true);

    //this.editGeoresourceTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterEditGeoresourcesTable', this.editGeoresourceTableOptions, this.preppedGeoresourceData, []);
  }

  refreshIndicatorsTable() {
    this.indicatorStore.availableIndicators.forEach((element, index) => {
      this.preppedIndicatorData[index] = {
        id: element.indicatorId,
        name: element.indicatorName,
        description: element.metadata.description,
        checked: this.selectedIndicatorIds.includes(element.indicatorId),
      };
    });

    if (this.selectedIndicatorIds.length == 0) this.showSelectedIndicatorsOnly = false;

    if (this.showSelectedIndicatorsOnly)
      this.preppedIndicatorData = this.preppedIndicatorData.filter((e) => e.checked === true);

    //this.editIndicatorTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterEditIndicatorsTable', this.editIndicatorTableOptions, this.preppedIndicatorData, []);
  }

  async editAdminFilter() {
    //var selectedIndicatorIds = kommonitorDataGridHelperService.getSelectedIds_singleSelectGrid(this.editIndicatorTableOptions);
    //var selectedGeoresourceIds = kommonitorDataGridHelperService.getSelectedIds_singleSelectGrid(this.editGeoresourceTableOptions);
    const selectedIndicatorIds = [];
    const selectedGeoresourceIds = [];

    this.selectedIndicatorIds = selectedIndicatorIds;
    this.selectedGeoresourceIds = selectedGeoresourceIds;

    if (!this.filterName) return;

    if (
      selectedGeoresourceIds.length == 0 &&
      selectedIndicatorIds.length == 0 &&
      this.selectedIndicatorTopicEditIds.length == 0 &&
      this.selectedGeoresourceTopicEditIds.length == 0
    ) {
      if (
        !confirm(
          'Sie haben weder Indikator- noch Georesource Daten zur späteren Ansicht ausgewählt. Trotzdem fortfahren?'
        )
      )
        return;
    }

    const filterConfig = await this.kommonitorConfigStorageService.getFilterConfig();

    setTimeout(() => {
      this.loadingData = true;
    });

    this.successMessagePart = undefined;
    this.errorMessagePart = undefined;

    const filterBody = {
      name: this.filterName,
      indicatorTopics: this.selectedIndicatorTopicEditIds,
      indicators: selectedIndicatorIds,
      georesourceTopics: this.selectedGeoresourceTopicEditIds,
      georesources: selectedGeoresourceIds,
    };

    filterConfig[this.selectedItem] = filterBody;

    await this.kommonitorConfigStorageService.postFilterConfig(
      JSON.stringify(filterConfig, null, '    ')
    );

    this.notificationService.showSuccess('Filter gespeichert.');
    this.loadingData = false;

    this.refreshIndicatorsTable();
    this.refreshGeoresourcesTable();
    // Bound table data was rebuilt after the awaits above (OnPush).
    this.cdr.markForCheck();

    setTimeout(() => {
      this.broadcastService.broadcast(BroadcastMessage.RefreshAdminFilterOverview);
    }, 500);
  }

  resetAdminFilterEditForm() {
    // reset
    this.filterName = undefined;
    this.resetTreeSelection(this.indicatorTopicsEditTree);
    this.resetTreeSelection(this.georesourceTopicsEditTree);

    this.filterConfig.forEach((elem, index) => {
      if (index == this.selectedItem) {
        this.filterName = elem.name;

        this.selectedIndicatorTopicEditIds = elem.indicatorTopics;
        this.selectedGeoresourceTopicEditIds = elem.georesourceTopics;

        this.indicatorTopicsEditTree = this.prepTopicsTree(
          this.topicStore.availableTopics.filter((e) => e.topicResource == 'indicator'),
          0,
          this.selectedIndicatorTopicEditIds
        );
        this.georesourceTopicsEditTree = this.prepTopicsTree(
          this.topicStore.availableTopics.filter((e) => e.topicResource == 'georesource'),
          0,
          this.selectedGeoresourceTopicEditIds
        );

        this.selectedIndicatorTopicEditIds.forEach((e) => {
          this.searchIndicatorItemRecursive(this.indicatorTopicsEditTree, e, true);
        });

        this.selectedGeoresourceTopicEditIds.forEach((e) => {
          this.searchGeoresourceItemRecursive(this.georesourceTopicsEditTree, e, true);
        });

        this.selectedIndicatorIds = elem.indicators;
        this.selectedGeoresourceIds = elem.georesources;

        this.refreshIndicatorsTable();
        this.refreshGeoresourcesTable();
      }
    });

    /* this.filterName = undefined;
      
      this.editGeoresourceTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterEditGeoresourcesTable', this.editGeoresourceTableOptions, this.preppedGeoresourceData, []);	
			this.editIndicatorTableOptions = kommonitorDataGridHelperService.buildSingleSelectGrid('adminFilterEditIndicatorsTable', this.editIndicatorTableOptions, this.preppedIndicatorData, []);	

      this.successMessagePart = undefined;
      this.errorMessagePart = undefined;

      resetTreeSelection(this.indicatorTopicsEditTree);
      resetTreeSelection(this.georesourceTopicsEditTree);

      this.selectedIndicatorTopicEditIds = [];
      this.selectedGeoresourceTopicEditIds = [];

			setTimeout(() => {
				this.$digest();	
			}, 250); */
  }
  /* 

			this.addSpatialUnit = async () {

				$timeout(function(){
					this.loadingData = true;
				});

				this.importerErrors = undefined;
				this.successMessagePart = undefined;
				this.errorMessagePart = undefined;

				var allDataSpecified = await this.buildImporterObjects();

				if (!allDataSpecified) {

					$("#spatialUnitAddForm").validator("update");
					$("#spatialUnitAddForm").validator("validate");
					return;
				}
				else {

					// TODO verify input

					// TODO Create and perform POST Request with loading screen

					var newSpatialUnitResponse_dryRun = undefined;
					try {
						newSpatialUnitResponse_dryRun = await kommonitorImporterHelperService.registerNewSpatialUnit(this.converterDefinition, this.datasourceTypeDefinition, this.propertyMappingDefinition, this.postBody_spatialUnits, true);

						if(! kommonitorImporterHelperService.importerResponseContainsErrors(newSpatialUnitResponse_dryRun)){
							// all good, really execute the request to import data against data management API
							var newSpatialUnitResponse = await kommonitorImporterHelperService.registerNewSpatialUnit(this.converterDefinition, this.datasourceTypeDefinition, this.propertyMappingDefinition, this.postBody_spatialUnits, false);

							$rootScope.$broadcast("refreshSpatialUnitOverviewTable", "add", kommonitorImporterHelperService.getIdFromImporterResponse(newSpatialUnitResponse));

							// refresh all admin dashboard diagrams due to modified metadata
							$timeout(function(){
								$rootScope.$broadcast("refreshAdminDashboardDiagrams");
							}, 500);
							

							this.successMessagePart = this.postBody_spatialUnits.spatialUnitLevel;
							this.importedFeatures = kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(newSpatialUnitResponse);

							$("#spatialUnitAddSucessAlert").show();
							this.loadingData = false;

							setTimeout(() => {
								this.$digest();
							}, 250);
						}
						else{
							// errors ocurred
							// show them 
							this.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
							this.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(newSpatialUnitResponse_dryRun);

							$("#spatialUnitAddErrorAlert").show();
							this.loadingData = false;

							setTimeout(() => {
								this.$digest();
							}, 250);

						}
					} catch (error) {
						if(error.data){							
							this.errorMessagePart = this.indicatorValueService.syntaxHighlightJSON(error.data);
						}
						else{
							this.errorMessagePart = this.indicatorValueService.syntaxHighlightJSON(error);
						}

						if(newSpatialUnitResponse_dryRun){
							this.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(newSpatialUnitResponse_dryRun);
						}

						$("#spatialUnitAddErrorAlert").show();
						this.loadingData = false;

						setTimeout(() => {
							this.$digest();
						}, 250);
					}
				}

			};

 */
}
