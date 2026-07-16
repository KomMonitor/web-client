import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgbCollapseModule,
  NgbDate,
  NgbDatepickerModule,
  NgbDateStruct,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import {
  CategoricalClassificationItem,
  ExtendedDefaultClassificationMapping,
} from 'components/ngComponents/models/classification.models';
import { ActiveWmsFilter } from 'pipes/active-wms-filter.pipe';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { ClassificationStateService } from 'services/classification-state-service/classification-state.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { LabelService } from 'services/label-service/label.service';
import { MapService } from 'services/map-service/map.service';
import { MetadataExportService } from 'services/metadata-export-service/metadata-export.service';
import { OgcService } from 'services/ogcServices/ogc.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { ShareHelperService } from 'services/share-helper-service/share-helper.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { IndicatorExportModalComponent } from '../exporting/indicator-export-modal/indicator-export-modal.component';
import { KommonitorClassificationComponent } from '../kommonitorClassification/kommonitor-classification.component';
import { KommonitorDataSetupService } from '../sidebar/kommonitorDataSetup/kommonitor-data-setup.service';
import { SpatialUnitNotificationModalComponent } from '../spatialUnitNotificationModal/spatial-unit-notification-modal.component';

@Component({
  selector: 'app-kommonitor-legend',
  templateUrl: './kommonitor-legend.component.html',
  styleUrls: ['./kommonitor-legend.component.scss'],
  standalone: true,
  imports: [
    NgbCollapseModule,
    CommonModule,
    FormsModule,
    NgbDatepickerModule,
    ActiveWmsFilter,
    KommonitorClassificationComponent,
    ExpandableBoxComponent,
  ],
})
export class KommonitorLegendComponent implements OnInit, OnChanges {
  protected chartDisplayState = inject(ChartDisplayStateService);
  private indicatorValueService = inject(IndicatorValueService);
  protected selectionState = inject(SelectionStateService);
  protected georesourceStore = inject(GeoresourceMetadataStoreService);
  protected spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  protected indicatorStore = inject(IndicatorMetadataStoreService);
  protected metadataExportService = inject(MetadataExportService);
  protected labelService = inject(LabelService);
  private shareHelperService = inject(ShareHelperService);
  protected classificationState = inject(ClassificationStateService);
  protected filterHelperService = inject(FilterHelperService);
  private broadcastService = inject(BroadcastService);
  private modalService = inject(NgbModal);
  protected ogcService = inject(OgcService);
  private mapService = inject(MapService);
  protected envConfigService = inject(EnvConfigService);
  private dataSetupService = inject(KommonitorDataSetupService);

  elementVisibilityData: any;
  visualStyleData: any;

  dateAsDate!: Date;
  containsZeroValues!: any;
  containsNegativeValues!: any;
  containsOutliers_high!: any;
  containsOutliers_low!: any;
  outliers_high!: any;
  outliers_low!: any;
  containsNoData!: any;

  legendVisible = true;

  isExportCollapsed = true;
  isLegendCollapsed = false;
  isStatisticCollapsed = true;

  classificationCollapsed = true;
  globalFilterActivated = false;
  actualSelectedSpatialUnitId = undefined;

  protected defaultColorForZeroValues = this.envConfigService.defaultColorForZeroValues;
  protected defaultColorForFilteredValues = this.envConfigService.defaultColorForFilteredValues;
  protected defaultBorderColorForFilteredValues =
    this.envConfigService.defaultBorderColorForFilteredValues;
  protected defaultColorForNoDataValues = this.envConfigService.defaultColorForNoDataValues;
  protected defaultBorderColorForNoDataValues =
    this.envConfigService.defaultBorderColorForNoDataValues;

  isDisabledDate;
  datePickerDate;

  @Input() onupdatelegenddisplaydata!: any;

  /** Per-class labels of the current indicator's default classification, index-aligned to the class positions. */
  protected get classificationLabels(): string[] {
    return this.selectionState.selectedIndicator?.defaultClassificationMapping?.labels ?? [];
  }

  /** Whether the current indicator's classification defines at least one non-empty label. */
  protected get hasClassificationLabels(): boolean {
    return this.classificationLabels.some((label) => !!label && label.length > 0);
  }

  /**
   * Whether the classification table should render the Labels column. True for
   * qualitative indicators (which always carry per-category labels) and for numeric
   * indicators that define at least one label. Used to keep the shared header /
   * no-data / outlier / filtered rows column-aligned with the class rows.
   */
  protected get showLabelsColumn(): boolean {
    return this.hasClassificationLabels || this.isQualitativeClassification;
  }

  /** Whether the current indicator uses a qualitative (categorical) classification. */
  protected get isQualitativeClassification(): boolean {
    const mapping = this.selectionState.selectedIndicator?.defaultClassificationMapping as
      | ExtendedDefaultClassificationMapping
      | undefined;
    return mapping?.classificationType === 'QUALITATIVE';
  }

  /** Category definitions (value/color/label) of the current qualitative classification. */
  protected get categoricalClassification(): CategoricalClassificationItem[] {
    const mapping = this.selectionState.selectedIndicator?.defaultClassificationMapping as
      | ExtendedDefaultClassificationMapping
      | undefined;
    return mapping?.categoricalData ?? [];
  }

  // Local precision-resolving wrapper (formerly the DataExchangeService facade glue, Prio7 B1).
  protected getIndicatorValue_asFormattedText(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asFormattedText(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  ngOnChanges(changes: any): void {
    if (changes.onupdatelegenddisplaydata) {
      const data = changes.onupdatelegenddisplaydata.currentValue;

      this.dateAsDate = data.dateAsDate;

      this.containsZeroValues = data.containsZeroValues;
      this.containsNegativeValues = data.containsNegativeValues;
      this.containsOutliers_high = data.containsOutliers_high;
      this.containsOutliers_low = data.containsOutliers_low;
      this.outliers_high = data.outliers_high;
      this.outliers_low = data.outliers_low;
      this.containsNoData = data.containsNoData;

      if (data.selectedDate) {
        const dateComponents = data.selectedDate.split('-');
        this.dateAsDate = new Date(
          Number(dateComponents[0]),
          Number(dateComponents[1]) - 1,
          Number(dateComponents[2])
        );
      }
    }
  }

  ngOnInit(): void {
    $(document).ready(function () {
      $('.nav li.disabled a').click(function () {
        return false;
      });
    });

    this.mapService.mapCommand$.subscribe((command) => {
      if (command.type === 'onGlobalFilterChange') this.onGlobalFilterChange();
    });

    this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      const title = broadcastMsg.msg;
    });

    // todo del timeout
    setTimeout(() => {
      const dateComponents = this.selectionState.selectedDate.split('-');
      this.dateAsDate = new Date(
        Number(dateComponents[0]),
        Number(dateComponents[1]) - 1,
        Number(dateComponents[2])
      );
      this.datePickerDate = {
        year: this.dateAsDate.getFullYear(),
        month: this.dateAsDate.getMonth() + 1,
        day: this.dateAsDate.getDate(),
      };
    }, 2500);

    this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      const title = broadcastMsg.msg;
      const values: any = broadcastMsg.values;

      switch (title) {
        case BroadcastMessage.UpdateLegendDisplay:
          {
            this.updateLegendDisplay(values);
          }
          break;
        case BroadcastMessage.UpdateDatePickerAvailableDates:
          {
            this.onUpdateDatePicker(values);
          }
          break;
        case BroadcastMessage.UpdateDatePickerSelectedDate:
          {
            this.onUpdateDatePickerSelectedDate(values);
          }
          break;
      }
    });
  }

  onGlobalFilterChange() {
    this.actualSelectedSpatialUnitId = undefined;
    this.globalFilterActivated = true;
  }

  onUpdateDatePicker([dates]) {
    this.isDisabledDate = (date: NgbDateStruct, current: { month: number; year: number }) => {
      return dates.find((x) => new NgbDate(x.year, x.month, x.day).equals(date)) ? false : true;
    };
  }

  onUpdateDatePickerSelectedDate([date]) {
    this.datePickerDate = { year: date.year, month: date.month, day: date.day };
  }

  updateLegendDisplay([
    containsZeroValues,
    containsNegativeValues,
    containsNoData,
    containsOutliers_high,
    containsOutliers_low,
    outliers_low,
    outliers_high,
    selectedDate,
  ]) {
    this.containsZeroValues = containsZeroValues;
    this.containsNegativeValues = containsNegativeValues;
    this.containsOutliers_high = containsOutliers_high;
    this.containsOutliers_low = containsOutliers_low;
    this.outliers_high = outliers_high;
    this.outliers_low = outliers_low;
    this.containsNoData = containsNoData;
    const dateComponents = selectedDate.split('-');
    this.dateAsDate = new Date(
      Number(dateComponents[0]),
      Number(dateComponents[1]) - 1,
      Number(dateComponents[2])
    );

    this.broadcastService.broadcast(BroadcastMessage.UpdateClassificationComponent, [
      this.containsZeroValues,
      this.containsNegativeValues,
      this.containsNoData,
      this.containsOutliers_high,
      this.containsOutliers_low,
      this.outliers_low,
      this.outliers_high,
      this.selectionState.selectedDate,
    ]);
  }

  filteredSpatialUnits() {
    return this.spatialUnitStore.availableSpatialUnits.filter(
      (e) => this.selectionState.isAllowedSpatialUnitForCurrentIndicator(e) !== false
    );
  }

  onChangeIndicatorDatepickerDate() {
    const dateString = `${this.datePickerDate.year}-${this.datePickerDate.month}-${this.datePickerDate.day}`;
    this.selectionState.setSelectedDate(dateString);
  }

  onChangeSelectedSpatialUnit() {
    /* 
      onChangeSelectedSpatialUnit changed to be called by on-click iso on-change
      on-change was triggerd as well by selecting a global filter. here in some occations the metadata-loading took longer, resulting in an error following this $broadcast("changeSpatialUnit")
      on-click needed some workaround to cover the actual change of selection iso just the initial click or the change by the global filter
    */

    if (!this.actualSelectedSpatialUnitId && this.globalFilterActivated) {
      // initial click, no change yet. Define currently selected spatial unit
      this.actualSelectedSpatialUnitId = this.selectionState.selectedSpatialUnit.spatialUnitId;
      this.globalFilterActivated = false;
    } else {
      if (
        this.selectionState.selectedSpatialUnit &&
        this.selectionState.selectedSpatialUnit.spatialUnitId != this.actualSelectedSpatialUnitId
      ) {
        this.actualSelectedSpatialUnitId = this.selectionState.selectedSpatialUnit.spatialUnitId;
        this.mapService.changeSpatialUnit();

        if (this.envConfigService.enableSpatialUnitNotificationSelection) {
          if (!(localStorage.getItem('hideKomMonitorSpatialUnitNotification') === 'true')) {
            const selectedSpatialUnitName =
              this.selectionState.selectedSpatialUnit.spatialUnitLevel;
            if (
              this.envConfigService.spatialUnitNotificationSelection.includes(
                selectedSpatialUnitName
              )
            ) {
              this.openSpatialunitModal();
            }
          }
        }
      }
    }

    // old, prior merge but past migration
    /*  this.broadcastService.broadcast("changeSpatialUnit");

    if(this.env.enableSpatialUnitNotificationSelection) {
      if(localStorage.getItem("hideKomMonitorSpatialUnitNotification") && localStorage.getItem("hideKomMonitorSpatialUnitNotification")=== "true") {
        let selectedSpatialUnitName = this.selectionState.selectedSpatialUnit.spatialUnitLevel;
        if(this.env.spatialUnitNotificationSelection.includes(selectedSpatialUnitName)) {

          this.openSpatialunitModal()
        }
      }
    }  */
  }

  spatialUnitNotificationModalEnabled() {
    if (this.envConfigService.enableSpatialUnitNotificationSelection) return true;

    return false;
  }

  showSpatialUnitNotificationModalIfEnabled() {
    if (this.envConfigService.enableSpatialUnitNotificationSelection) {
      this.openSpatialunitModal();
    }
  }

  openSpatialunitModal() {
    const modalRef = this.modalService.open(SpatialUnitNotificationModalComponent, {
      windowClass: 'modal-holder',
      centered: true,
    });
  }

  async onClickDownloadMetadata() {
    // create PDF from currently selected/displayed indicator!
    const indicatorMetadata = this.selectionState.selectedIndicator;
    const pdfName = indicatorMetadata.indicatorName + '.pdf';
    const jspdf = await this.metadataExportService.generateIndicatorMetadataPdf(
      indicatorMetadata,
      pdfName
    );
    jspdf.save();
  }

  openExportModal() {
    const indicator = this.dataSetupService.toExportIndicator(
      this.selectionState.selectedIndicator
    );
    const modalRef = this.modalService.open(IndicatorExportModalComponent, {
      windowClass: 'modal-holder',
      centered: true,
      size: 'lg',
    });
    modalRef.componentInstance.indicator = indicator;
    modalRef.componentInstance.preselectedSpatialUnitId =
      this.selectionState.selectedSpatialUnit?.spatialUnitId;
  }

  onClickShareLinkButton() {
    this.shareHelperService.generateCurrentShareLink();

    /* Copy to clipboard */
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(this.shareHelperService.currentShareLink);

      // Get the snackbar DIV
      const x = document.getElementById('snackbar');

      // Add the "show" class to DIV
      x!.className = 'show';

      // After 3 seconds, remove the show class from DIV
      setTimeout(function () {
        x!.className = x!.className.replace('show', '');
      }, 3000);
    } else {
      // open in new tab
      window.open(this.shareHelperService.currentShareLink, '_blank');
    }
  }

  makeOutliersLowLegendString(outliersArray) {
    if (outliersArray.length > 1)
      return (
        '(' +
        this.getIndicatorValue_asFormattedText(outliersArray[0]) +
        ' - ' +
        this.getIndicatorValue_asFormattedText(outliersArray[outliersArray.length - 1]) +
        ')'
      );
    else return '(' + this.getIndicatorValue_asFormattedText(outliersArray[0]) + ')';
  }

  makeOutliersHighLegendString(outliersArray) {
    if (outliersArray.length > 1)
      return (
        '(' +
        this.getIndicatorValue_asFormattedText(outliersArray[0]) +
        ' - ' +
        this.getIndicatorValue_asFormattedText(outliersArray[outliersArray.length - 1]) +
        ')'
      );
    else return '(' + this.getIndicatorValue_asFormattedText(outliersArray[0]) + ')';
  }

  keywordFilteredWmsDataset() {
    return this.georesourceStore.wmsDatasets_keywordFiltered.filter((e) => e.isSelected === true);
  }

  hasActiveWMSLayers() {
    return this.georesourceStore.wmsDatasets.filter((item) => item.isSelected).length > 0;
  }

  adjustOpacityForWmsLayer(dataset, transparency) {
    this.mapService.adjustOpacityForWmsLayer(dataset, transparency);
  }
}
