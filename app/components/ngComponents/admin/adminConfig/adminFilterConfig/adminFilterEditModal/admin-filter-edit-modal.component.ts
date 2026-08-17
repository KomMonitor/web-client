import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
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

/**
 * One node of the editable topic tree.
 *
 * `selected`/`disabled`/`expanded` are the view state. They used to live in the
 * DOM (`editCheckbox-<id>.checked` / `.disabled`, `editSubTopic-<id>.style.display`)
 * and were written through `document.getElementById`. Since the tree UI itself was
 * never migrated to the Angular template, those elements do not exist and every
 * one of those writes silently no-opped. The flags now live here so a future
 * tree template can bind to them.
 */
export interface TopicTreeNode {
  topicId: string;
  subTopics: TopicTreeNode[];
  level: number;
  /** Explicitly selected — either by the user or loaded from the filter config. */
  selected: boolean;
  /** Implied by a selected ancestor: checked, but not changeable on its own. */
  disabled: boolean;
  /** Whether this node's sub-topics are revealed. */
  expanded: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-admin-filter-edit-modal',
  standalone: true,
  templateUrl: './admin-filter-edit-modal.component.html',
  styleUrls: ['./admin-filter-edit-modal.component.scss'],
  imports: [TranslateModule, FormsModule, StepperComponent],
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
  private translate = inject(TranslateService);
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

  indicatorTopicsEditTree: TopicTreeNode[] = [];
  selectedIndicatorTopicEditIds: string[] = [];

  georesourceTopicsEditTree: TopicTreeNode[] = [];
  selectedGeoresourceTopicEditIds: string[] = [];

  showSelectedIndicatorsOnly = false;
  showSelectedGeoresourcesOnly = false;
  showSelectedIndicatorsTopicsOnly = false;
  showSelectedGeoresourcesTopicsOnly = false;

  filterConfig: any[] = [];

  filterName!: string | undefined;

  // Multi-step form
  readonly stepper = new WizardStepper([
    { key: 'indicators', label: 'ADMIN_SHARED_UI.STEP_LABELS.INDICATORS' },
    { key: 'indicatorTopics', label: 'ADMIN_SHARED_UI.STEP_LABELS.INDICATOR_TOPICS' },
    { key: 'georesources', label: 'ADMIN_SHARED_UI.STEP_LABELS.GEORESOURCES' },
    { key: 'georesourceTopics', label: 'ADMIN_SHARED_UI.STEP_LABELS.GEORESOURCE_TOPICS' },
  ]);

  // The former AngularJS addClickListenerToEachCollapseTrigger() lived here: it
  // wired a jQuery click handler that toggled editSubTopic-<id>.style.display.
  // Superseded by the `expanded` flag on TopicTreeNode.

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
  onSelectedGeoresourceEditItemsChange(id: string, selected: boolean): void {
    this.selectedGeoresourceTopicEditIds = this.applyTopicSelection(
      this.georesourceTopicsEditTree,
      this.selectedGeoresourceTopicEditIds,
      id,
      selected
    );

    if (this.selectedGeoresourceTopicEditIds.length == 0)
      this.showSelectedGeoresourcesTopicsOnly = false;
  }

  // indicator tree
  onSelectedIndicatorEditItemsChange(id: string, selected: boolean): void {
    this.selectedIndicatorTopicEditIds = this.applyTopicSelection(
      this.indicatorTopicsEditTree,
      this.selectedIndicatorTopicEditIds,
      id,
      selected
    );

    if (this.selectedIndicatorTopicEditIds.length == 0)
      this.showSelectedIndicatorsTopicsOnly = false;
  }

  onShowSelectedIndicatorsOnly() {
    this.refreshIndicatorsTable();
  }
  onShowSelectedGeoresourcesOnly() {
    this.refreshGeoresourcesTable();
  }

  /**
   * Select or deselect one topic and bring the tree flags in line.
   *
   * Selecting a topic implies all of its sub-topics: they are marked selected and
   * disabled, and — deliberately — dropped from the id list, so only the highest
   * checked level is persisted. Returns the new id list.
   *
   * Was one pair of near-identical methods per resource type
   * (searchXItemRecursive / checkXItemsRecursive); the only difference was which
   * id list they mutated, which is now a parameter.
   */
  applyTopicSelection(
    tree: TopicTreeNode[],
    selectedIds: string[],
    id: string,
    selected: boolean
  ): string[] {
    let nextIds =
      selected === true
        ? selectedIds.includes(id)
          ? [...selectedIds]
          : [...selectedIds, id]
        : selectedIds.filter((e) => e != id);

    const applyToSubtree = (nodes: TopicTreeNode[]): void => {
      nodes.forEach((node) => {
        node.selected = selected;
        node.disabled = selected;
        // Drop every lower level, in case a level higher up was checked afterwards
        nextIds = nextIds.filter((e) => e != node.topicId);
        applyToSubtree(node.subTopics);
      });
    };

    // Expand the ancestors of the touched node so it is reachable in the tree
    const walk = (nodes: TopicTreeNode[]): boolean => {
      let found = false;

      nodes.forEach((node) => {
        if (node.topicId == id) {
          node.selected = selected;
          node.expanded = true;
          applyToSubtree(node.subTopics);
          found = true;
        } else if (walk(node.subTopics)) {
          node.expanded = true;
          found = true;
        }
      });

      return found;
    };

    walk(tree);
    return nextIds;
  }

  prepTopicsTree(tree, level, selectedItemIds): TopicTreeNode[] {
    tree.forEach((entry) => {
      entry.level = level;
      entry.selected = selectedItemIds.includes(entry.topicId);
      entry.disabled = entry.disabled ?? false;
      entry.expanded = entry.expanded ?? false;

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

  /**
   * Clear the whole tree's view state.
   *
   * The DOM version recursed *inside* the "does the checkbox element exist" guard,
   * so a node without a rendered checkbox also left its entire subtree untouched.
   * With the flags on the nodes there is nothing to guard, and the subtree is
   * always reset.
   */
  resetTreeSelection(tree: TopicTreeNode[]): void {
    tree.forEach((entry) => {
      entry.selected = false;
      entry.disabled = false;
      entry.expanded = false;

      if (entry.subTopics.length > 0) this.resetTreeSelection(entry.subTopics);
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
      if (!confirm(this.translate.instant('ADMIN_CONFIG.FILTER_EDIT.MSG.NO_DATA_CONFIRM'))) return;
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

    this.notificationService.showSuccess(
      this.translate.instant('ADMIN_CONFIG.FILTER_EDIT.MSG.SAVED')
    );
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

        // Iterate snapshots: applyTopicSelection prunes sub-topic ids from the
        // lists as it goes (the DOM version mutated them the same way).
        [...this.selectedIndicatorTopicEditIds].forEach((e) => {
          this.selectedIndicatorTopicEditIds = this.applyTopicSelection(
            this.indicatorTopicsEditTree,
            this.selectedIndicatorTopicEditIds,
            e,
            true
          );
        });

        [...this.selectedGeoresourceTopicEditIds].forEach((e) => {
          this.selectedGeoresourceTopicEditIds = this.applyTopicSelection(
            this.georesourceTopicsEditTree,
            this.selectedGeoresourceTopicEditIds,
            e,
            true
          );
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
