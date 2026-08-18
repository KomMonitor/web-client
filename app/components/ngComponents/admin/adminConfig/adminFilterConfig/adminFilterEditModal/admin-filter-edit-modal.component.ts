import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { firstValueFrom } from 'rxjs';
import { BroadcastService } from '../../../../../../services/broadcast-service/broadcast.service';
import { BroadcastMessage } from '../../../../../../services/broadcast-service/broadcast-message';
import { ConfigStorageService } from '../../../../../../services/config-storage-service/config-storage.service';
import { GeoresourceMetadataStoreService } from '../../../../../../services/georesource-metadata-store-service/georesource-metadata-store.service';
import { TopicMetadataStoreService } from '../../../../../../services/topic-metadata-store-service/topic-metadata-store.service';
import { IndicatorMetadataStoreService } from '../../../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from '../../../../../../services/metadata-bootstrap-service/metadata-bootstrap.service';
import { NotificationService } from '../../../../common/notification/notification.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';

/** JSON indentation the filter config is stored with. */
const CONFIG_INDENT = '    ';

/**
 * One node of the editable topic tree.
 *
 * `selected`/`disabled`/`expanded` are the view state. They used to live in the
 * DOM (`editCheckbox-<id>.checked` / `.disabled`, `editSubTopic-<id>.style.display`)
 * and were written through `document.getElementById`.
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

/** One selectable indicator/georesource row of the wizard's dataset steps. */
export interface FilterSelectableItem {
  id: string;
  name: string;
  description?: string;
  checked: boolean;
}

/** Which of the two topic trees / dataset lists a template callback addresses. */
export type FilterResourceKind = 'indicator' | 'georesource';

/** One entry of the stored global filter configuration. */
interface FilterConfigEntry {
  name: string;
  indicatorTopics: string[];
  indicators: string[];
  georesourceTopics: string[];
  georesources: string[];
}

@Component({
  selector: 'app-admin-filter-edit-modal',
  standalone: true,
  templateUrl: './admin-filter-edit-modal.component.html',
  styleUrls: ['./admin-filter-edit-modal.component.scss'],
  imports: [
    TranslateModule,
    FormsModule,
    NgTemplateOutlet,
    AgGridAngular,
    StepperComponent,
    LoadingOverlayComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFilterEditModalComponent implements OnInit {
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private kommonitorConfigStorageService = inject(ConfigStorageService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private broadcastService = inject(BroadcastService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  activeModal = inject(NgbActiveModal);

  /**
   * Index of the edited entry in the stored filter config, set by the opener.
   * Left undefined the modal creates a new filter instead ("add mode").
   */
  selectedItem: number | undefined = undefined;

  // Signal-backed: written from the async config load/save callbacks, which
  // would not re-render this OnPush component otherwise.
  loadingData = signal(false);

  selectedIndicatorIds: string[] = [];
  selectedGeoresourceIds: string[] = [];

  preppedGeoresourceData: FilterSelectableItem[] = [];
  preppedIndicatorData: FilterSelectableItem[] = [];

  indicatorTopicsEditTree: TopicTreeNode[] = [];
  selectedIndicatorTopicEditIds: string[] = [];

  georesourceTopicsEditTree: TopicTreeNode[] = [];
  selectedGeoresourceTopicEditIds: string[] = [];

  showSelectedIndicatorsTopicsOnly = false;
  showSelectedGeoresourcesTopicsOnly = false;

  /** Column definitions of the two dataset grids (built in ngOnInit, for i18n). */
  indicatorDatasetColumns: ColDef[] = [];
  georesourceDatasetColumns: ColDef[] = [];

  filterName!: string | undefined;

  /** Shared grid setup of both dataset steps. */
  readonly datasetGridOptions: GridOptions = {
    defaultColDef: {
      editable: false,
      cellDataType: false,
      sortable: true,
      filter: true,
      resizable: true,
      wrapText: true,
      autoHeight: true,
      flex: 1,
      minWidth: 150,
    },
    enableCellTextSelection: true,
    ensureDomOrder: true,
    pagination: true,
    paginationPageSize: 5,
    paginationPageSizeSelector: [5, 10, 25, 50, 100],
    suppressColumnVirtualisation: true,
    suppressCellFocus: true,
  };

  // Multi-step form
  readonly stepper = new WizardStepper([
    { key: 'indicators', label: 'ADMIN_SHARED_UI.STEP_LABELS.INDICATORS' },
    { key: 'indicatorTopics', label: 'ADMIN_SHARED_UI.STEP_LABELS.INDICATOR_TOPICS' },
    { key: 'georesources', label: 'ADMIN_SHARED_UI.STEP_LABELS.GEORESOURCES' },
    { key: 'georesourceTopics', label: 'ADMIN_SHARED_UI.STEP_LABELS.GEORESOURCE_TOPICS' },
  ]);

  ngOnInit(): void {
    this.indicatorDatasetColumns = this.buildDatasetColumns('indicator');
    this.georesourceDatasetColumns = this.buildDatasetColumns('georesource');

    this.initialize();

    // The admin area can open this modal before the metadata bootstrap has
    // filled the stores; rebuild the trees and lists once it completes.
    if (this.metadataBootstrap.metadataLoadingState !== MetadataLoadingState.COMPLETE) {
      this.metadataBootstrap.metadataLoading$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((state) => {
          if (state === MetadataLoadingState.COMPLETE) {
            this.initialize();
            this.cdr.markForCheck();
          }
        });
    }
  }

  /** True while the modal creates a new filter rather than editing a stored one. */
  get isAddMode(): boolean {
    return this.selectedItem === undefined;
  }

  private get hasAnySelection(): boolean {
    return (
      this.selectedIndicatorIds.length > 0 ||
      this.selectedGeoresourceIds.length > 0 ||
      this.selectedIndicatorTopicEditIds.length > 0 ||
      this.selectedGeoresourceTopicEditIds.length > 0
    );
  }

  /** Whether the wizard can be submitted — a name is the only hard requirement. */
  get canSubmit(): boolean {
    return !this.loadingData() && !!this.filterName && this.filterName.trim().length > 0;
  }

  /**
   * Builds the topic trees and the dataset lists from the metadata stores and,
   * in edit mode, seeds them from the stored filter entry.
   */
  private initialize(): void {
    this.buildTopicTrees();
    this.refreshDatasetItems();

    if (!this.isAddMode) {
      void this.loadStoredFilter();
    }
  }

  private buildTopicTrees(): void {
    // Deep copies: prepTopicsTree() writes the view state onto the nodes, and the
    // store's topics are shared with the rest of the app.
    const topics: any[] = JSON.parse(JSON.stringify(this.topicStore.availableTopics));

    this.indicatorTopicsEditTree = this.prepTopicsTree(
      topics.filter((e) => e.topicResource == 'indicator'),
      0,
      this.selectedIndicatorTopicEditIds
    );
    this.georesourceTopicsEditTree = this.prepTopicsTree(
      topics.filter((e) => e.topicResource == 'georesource'),
      0,
      this.selectedGeoresourceTopicEditIds
    );
  }

  /** Loads the edited entry and applies it to name, dataset lists and trees. */
  private async loadStoredFilter(): Promise<void> {
    let filterConfig: FilterConfigEntry[];
    try {
      filterConfig = await this.fetchFilterConfig();
    } catch (error) {
      this.notificationService.showError(
        this.translate.instant('ADMIN_CONFIG.FILTER.MSG.LOAD_FAILED', {
          error: this.describeError(error),
        })
      );
      return;
    }

    const storedFilter = filterConfig[this.selectedItem!];
    if (!storedFilter) return;

    this.filterName = storedFilter.name;
    this.selectedIndicatorIds = [...(storedFilter.indicators ?? [])];
    this.selectedGeoresourceIds = [...(storedFilter.georesources ?? [])];
    this.selectedIndicatorTopicEditIds = [...(storedFilter.indicatorTopics ?? [])];
    this.selectedGeoresourceTopicEditIds = [...(storedFilter.georesourceTopics ?? [])];

    this.buildTopicTrees();
    this.applyStoredTopicSelection();
    this.refreshDatasetItems();
    this.cdr.markForCheck();
  }

  /**
   * Re-applies the stored topic ids so the implied sub-topics get their
   * selected/disabled flags. Iterates snapshots: applyTopicSelection prunes
   * sub-topic ids from the lists as it goes.
   */
  private applyStoredTopicSelection(): void {
    [...this.selectedIndicatorTopicEditIds].forEach((topicId) => {
      this.selectedIndicatorTopicEditIds = this.applyTopicSelection(
        this.indicatorTopicsEditTree,
        this.selectedIndicatorTopicEditIds,
        topicId,
        true
      );
    });

    [...this.selectedGeoresourceTopicEditIds].forEach((topicId) => {
      this.selectedGeoresourceTopicEditIds = this.applyTopicSelection(
        this.georesourceTopicsEditTree,
        this.selectedGeoresourceTopicEditIds,
        topicId,
        true
      );
    });
  }

  private async fetchFilterConfig(): Promise<FilterConfigEntry[]> {
    const response = await firstValueFrom(this.kommonitorConfigStorageService.getFilterConfig());
    return Array.isArray(response) ? (response as FilterConfigEntry[]) : [];
  }

  private describeError(error: any): string {
    return (
      error?.error?.message ??
      error?.message ??
      this.translate.instant('ADMIN_SHARED.UNKNOWN_ERROR')
    );
  }

  // ---------------------------------------------------------------------------
  // Topic trees
  // ---------------------------------------------------------------------------

  onTopicSelectionChange(kind: FilterResourceKind, id: string, selected: boolean): void {
    if (kind === 'indicator') {
      this.selectedIndicatorTopicEditIds = this.applyTopicSelection(
        this.indicatorTopicsEditTree,
        this.selectedIndicatorTopicEditIds,
        id,
        selected
      );

      if (this.selectedIndicatorTopicEditIds.length == 0)
        this.showSelectedIndicatorsTopicsOnly = false;
    } else {
      this.selectedGeoresourceTopicEditIds = this.applyTopicSelection(
        this.georesourceTopicsEditTree,
        this.selectedGeoresourceTopicEditIds,
        id,
        selected
      );

      if (this.selectedGeoresourceTopicEditIds.length == 0)
        this.showSelectedGeoresourcesTopicsOnly = false;
    }
  }

  /**
   * Select or deselect one topic and bring the tree flags in line.
   *
   * Selecting a topic implies all of its sub-topics: they are marked selected and
   * disabled, and — deliberately — dropped from the id list, so only the highest
   * checked level is persisted. Returns the new id list.
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
      entry.subTopics = entry.subTopics ?? [];

      if (entry.subTopics.length > 0) {
        const newLevel = level + 1;
        entry.subTopics = this.prepTopicsTree(entry.subTopics, newLevel, selectedItemIds);
      }
    });

    return tree;
  }

  toggleTopicNode(node: TopicTreeNode): void {
    node.expanded = !node.expanded;
  }

  /** Whether a tree node passes the step's "show selected only" toggle. */
  isTopicVisible(kind: FilterResourceKind, entry: TopicTreeNode): boolean {
    const showSelectedOnly =
      kind === 'indicator'
        ? this.showSelectedIndicatorsTopicsOnly
        : this.showSelectedGeoresourcesTopicsOnly;

    if (showSelectedOnly === false) return true;
    if (entry.selected) return true;

    return entry.subTopics.length > 0
      ? this.checkTopicsTreeVisibilityRecursive(entry.subTopics)
      : false;
  }

  checkTopicsTreeVisibilityRecursive(entries): boolean {
    return entries.some(
      (entry: TopicTreeNode) =>
        entry.selected ||
        (entry.subTopics.length > 0 && this.checkTopicsTreeVisibilityRecursive(entry.subTopics))
    );
  }

  /** Clear the whole tree's view state. */
  resetTreeSelection(tree: TopicTreeNode[]): void {
    tree.forEach((entry) => {
      entry.selected = false;
      entry.disabled = false;
      entry.expanded = false;

      if (entry.subTopics.length > 0) this.resetTreeSelection(entry.subTopics);
    });
  }

  // ---------------------------------------------------------------------------
  // Indicator / georesource selection
  // ---------------------------------------------------------------------------

  /** Rebuilds both dataset lists from the stores, keeping the current selection. */
  private refreshDatasetItems(): void {
    this.preppedIndicatorData = this.indicatorStore.availableIndicators.map((element: any) => ({
      id: element.indicatorId,
      name: element.indicatorName,
      description: element.metadata?.description,
      checked: this.selectedIndicatorIds.includes(element.indicatorId),
    }));

    this.preppedGeoresourceData = this.georesourceStore.availableGeoresources.map(
      (element: any) => ({
        id: element.georesourceId,
        name: element.datasetName,
        description: element.metadata?.description,
        checked: this.selectedGeoresourceIds.includes(element.georesourceId),
      })
    );
  }

  /**
   * Columns of a dataset step: name, id, description and the "visible" checkbox
   * that holds the selection. Sorting, the column filters and the pagination
   * come from the grid, which is why the step needs no controls of its own.
   */
  private buildDatasetColumns(kind: FilterResourceKind): ColDef[] {
    return [
      {
        headerName: this.translate.instant('ADMIN_SHARED.NAME'),
        field: 'name',
        sort: 'asc',
        minWidth: 200,
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.ID'),
        field: 'id',
        minWidth: 200,
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.DESCRIPTION'),
        field: 'description',
        minWidth: 200,
      },
      {
        headerName: this.translate.instant('ADMIN_CONFIG.FILTER_EDIT.COL_VISIBLE'),
        // No `field`: the cell is the checkbox itself, the value only sorts
        valueGetter: (params: any) => params.data?.checked === true,
        filter: false,
        flex: 0,
        width: 120,
        minWidth: 120,
        cellStyle: { 'text-align': 'center' },
        cellRenderer: (params: any) => this.buildSelectionCheckbox(kind, params.data),
      },
    ];
  }

  /** The checkbox cell of the "visible" column, kept in sync with the row's item. */
  private buildSelectionCheckbox(kind: FilterResourceKind, item: FilterSelectableItem | undefined) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'form-check-input dataset-check';

    if (!item) return checkbox;

    checkbox.checked = item.checked;
    checkbox.addEventListener('change', () =>
      this.onItemSelectionChange(kind, item, checkbox.checked)
    );

    return checkbox;
  }

  onItemSelectionChange(kind: FilterResourceKind, item: FilterSelectableItem, checked: boolean) {
    item.checked = checked;

    if (kind === 'indicator') {
      this.selectedIndicatorIds = this.preppedIndicatorData
        .filter((e) => e.checked)
        .map((e) => e.id);
    } else {
      this.selectedGeoresourceIds = this.preppedGeoresourceData
        .filter((e) => e.checked)
        .map((e) => e.id);
    }

    // The checkbox lives in a grid cell, outside this component's template
    this.cdr.markForCheck();
  }

  // ---------------------------------------------------------------------------
  // Save / reset
  // ---------------------------------------------------------------------------

  /**
   * Writes the wizard's state back into the filter configuration: appended as a
   * new entry in add mode, replacing the edited entry otherwise.
   */
  async saveAdminFilter(): Promise<void> {
    const name = this.filterName?.trim();
    if (!name) return;

    let filterConfig: FilterConfigEntry[];
    try {
      filterConfig = await this.fetchFilterConfig();
    } catch (error) {
      this.notificationService.showError(
        this.translate.instant('ADMIN_CONFIG.FILTER.MSG.LOAD_FAILED', {
          error: this.describeError(error),
        })
      );
      return;
    }

    const nameTaken = filterConfig.some(
      (entry, index) => entry?.name === name && index !== this.selectedItem
    );
    if (nameTaken) {
      this.notificationService.showError(
        this.translate.instant('ADMIN_CONFIG.FILTER_EDIT.MSG.DUPLICATE_NAME', { name })
      );
      return;
    }

    if (!this.hasAnySelection) {
      if (!confirm(this.translate.instant('ADMIN_CONFIG.FILTER_EDIT.MSG.NO_DATA_CONFIRM'))) return;
    }

    const filterBody: FilterConfigEntry = {
      name,
      indicatorTopics: [...this.selectedIndicatorTopicEditIds],
      indicators: [...this.selectedIndicatorIds],
      georesourceTopics: [...this.selectedGeoresourceTopicEditIds],
      georesources: [...this.selectedGeoresourceIds],
    };

    if (this.isAddMode) filterConfig.push(filterBody);
    else filterConfig[this.selectedItem!] = filterBody;

    this.loadingData.set(true);

    try {
      await firstValueFrom(
        this.kommonitorConfigStorageService.postFilterConfig(
          JSON.stringify(filterConfig, null, CONFIG_INDENT)
        )
      );
    } catch (error) {
      this.loadingData.set(false);
      this.notificationService.showError(
        this.translate.instant('ADMIN_CONFIG.FILTER.MSG.SAVE_FAILED', {
          error: this.describeError(error),
        })
      );
      return;
    }

    this.loadingData.set(false);
    this.notificationService.showSuccess(
      this.translate.instant(
        this.isAddMode
          ? 'ADMIN_CONFIG.FILTER_EDIT.MSG.CREATED'
          : 'ADMIN_CONFIG.FILTER_EDIT.MSG.SAVED',
        { name }
      )
    );

    this.broadcastService.broadcast(BroadcastMessage.RefreshAdminFilterOverview);
    this.activeModal.close(filterBody);
  }

  /** Drops every change made in the wizard and starts over from the stored state. */
  resetAdminFilterEditForm(): void {
    this.filterName = undefined;
    this.selectedIndicatorIds = [];
    this.selectedGeoresourceIds = [];
    this.selectedIndicatorTopicEditIds = [];
    this.selectedGeoresourceTopicEditIds = [];
    this.showSelectedIndicatorsTopicsOnly = false;
    this.showSelectedGeoresourcesTopicsOnly = false;

    this.resetTreeSelection(this.indicatorTopicsEditTree);
    this.resetTreeSelection(this.georesourceTopicsEditTree);

    this.stepper.reset();
    this.initialize();
  }

  close(): void {
    this.activeModal.dismiss('closed');
  }
}
