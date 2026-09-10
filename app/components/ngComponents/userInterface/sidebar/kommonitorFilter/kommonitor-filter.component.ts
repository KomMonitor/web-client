import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  DualListBoxComponent,
  dualListInput,
} from 'components/ngComponents/customElements/dual-list-box/dual-list-box.component';
import * as noUiSlider from 'nouislider';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { GlobalFilterHelperService } from 'services/global-filter-helper-service/global-filter-helper.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { IndicatorRenderRequest, MapService } from 'services/map-service/map.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { RangeFilterStateService } from 'services/range-filter-state-service/range-filter-state.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Component({
  selector: 'app-kommonitor-filter',
  templateUrl: './kommonitor-filter.component.html',
  styleUrls: ['./kommonitor-filter.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DualListBoxComponent, ExpandableBoxComponent],
})
export class KommonitorFilterComponent implements OnInit, AfterViewInit {
  protected rangeFilterState = inject(RangeFilterStateService);
  protected chartDisplayState = inject(ChartDisplayStateService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private indicatorValueService = inject(IndicatorValueService);
  private selectionState = inject(SelectionStateService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  protected filterHelperService = inject(FilterHelperService);
  private mapService = inject(MapService);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);
  private globalFilterHelperService = inject(GlobalFilterHelperService);
  private configStorageService = inject(ConfigStorageService);
  private envConfigService = inject(EnvConfigService);

  private readonly destroyRef = inject(DestroyRef);

  spatialLevel;

  private INDICATOR_DATE_PREFIX = this.envConfigService.indicatorDatePrefix;
  private numberOfDecimals = this.envConfigService.numberOfDecimals;

  // initialize any adminLTE box widgets
  // todo
  // $('.box').boxWidget();

  private kommonitorFilterModes = this.envConfigService.filterModes;

  considerAllowedSpatialUnitsOfCurrentIndicator = true;
  loadingData = false;

  rangeSliderForFilter;
  valueRangeMinValue;
  valueRangeMaxValue;
  currentLowerFilterValue;
  currentHigherFilterValue;
  lowerFilterInputNotValid = false;
  higherFilterInputNotValid = false;
  indicatorMetadataAndGeoJSON;
  indicatorClassificationType;

  showManualSelectionSpatialFilter;
  showSelectionByFeatureSpatialFilter;

  previouslySelectedIndicator: any;
  previouslySelectedSpatialUnit: any;

  inputLowerFilterValue;
  inputHigherFilterValue;

  defaultRangeSliderSetup: any;

  //measureOfValue stuff
  movMinValue;
  movMaxValue;
  movMiddleValue;
  movStep;
  movRangeSlider;

  slider;
  measureSlider;
  sliderNormalConfig: any = {
    behaviour: 'drag',
    connect: true,
    range: {
      min: 0,
      max: 100,
    },
    start: [0, 100],
    keyboard: true,
    pips: {
      mode: 'range',
      density: 2,
      values: 4,
      stepped: true,
    },
  };

  sliderSingleConfig: any = {
    behaviour: 'drag',
    connect: true,
    range: {
      min: 0,
      max: 100,
    },
    start: [50],
    keyboard: true,
    pips: {
      mode: 'range',
      density: 2,
      values: 4,
      stepped: true,
    },
  };

  // SPATIAL FILTER STUFF
  selectedSpatialUnitForFilter;
  selectedSpatialUnitIdForFilter;
  higherSpatialUnits;
  higherSpatialUnitFilterFeatureGeoJSON;
  reappliedFilter = false;

  selectionByFeatureSpatialFilterDuallistOptions: dualListInput = {
    items: [],
    selectedItems: [],
  };
  reloadList = false;
  reloadManualList = false;

  manualSelectionSpatialFilterDuallistOptions: dualListInput = {
    items: [],
    selectedItems: [],
  };

  // Global filter
  globalFilters: any = undefined;

  inputNotValid = false;

  // Resolve the indicator precision from the current selection before
  // delegating to IndicatorValueService.
  private getIndicatorValue_asNumber(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asNumber(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  ngOnInit(): void {
    this.mapService.mapRefreshState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (this.mapService.readyForRefresh())
          this.updateMeasureOfValueBar([value.values.date, value.values.indicator]);
      });

    // re-setup the spatial unit filter whenever an already displayed indicator
    // dataset is replaced with new feature values (filtering, balance)
    this.mapService.indicatorRenderRequest$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((request) => {
        if (request.source === 'dataset-replacement') {
          this.onIndicatorDatasetReplaced(request);
        }
      });

    this.broadcastService.currentBroadcastMsg.subscribe((result) => {
      const msg = result.msg;
      const val: any = result.values;

      switch (msg) {
        case BroadcastMessage.OnChangeSelectedIndicator:
          {
            this.onOnChangeSelectedIndicator();
          }
          break;
        case BroadcastMessage.UpdateMeasureOfValueBar:
          {
            this.updateMeasureOfValueBar(val);
          }
          break;
        case BroadcastMessage.UpdateIndicatorValueRangeFilter:
          {
            this.updateIndicatorValueRangeFilter(val);
          }
          break;
        case BroadcastMessage.RemoveRangeFilter:
          {
            this.removeRangeFilter();
          }
          break;
      }
    });
  }

  ngAfterViewInit(): void {
    this.slider = document.getElementById('filterRangeSlider');
    noUiSlider.create(this.slider, this.sliderNormalConfig);

    this.measureSlider = document.getElementById('measureOfValueSlider');
    noUiSlider.create(this.measureSlider, this.sliderSingleConfig);

    if (!this.globalFilters) this.loadGlobalFilters();
  }

  loadGlobalFilters() {
    this.configStorageService.getFilterConfig().subscribe({
      next: (response) => {
        console.log('Filter config loaded');
        this.globalFilters = response;
      },
      error: (error) => {
        console.error(error, 'Error while getting filter config from config storage service.');
      },
    });
  }

  onChangeFilterSelection() {
    this.loadingData = true;
    this.globalFilterHelperService.applyFilterSelection(
      this.globalFilters.filter((e) => e.checked === true)
    );

    const reload = this.globalFilterHelperService.applicationFilter
      ? this.metadataBootstrap.fetchAllMetadata(this.globalFilterHelperService.applicationFilter)
      : this.metadataBootstrap.fetchAllMetadata();

    this.mapService.onGlobalFilterChange();

    // Clear the local spinner once the reload actually finishes (replaces the
    // former fixed 1s timeout). Consumers that need to react to the reload
    // (poi, data setup) observe metadataBootstrap.metadataLoading$ directly.
    reload.finally(() => {
      this.loadingData = false;
    });
  }

  globalFiltersActive() {
    if (this.globalFilters && !this.globalFilterHelperService.isFilterParamSet()) return true;

    return false;
  }

  onUpdatedSelectedItems(items: any) {
    this.selectionByFeatureSpatialFilterDuallistOptions.selectedItems = items;
  }

  onUpdatedManualSelectedItems(items: any) {
    this.manualSelectionSpatialFilterDuallistOptions.selectedItems = items;
  }

  isFilterModeActive(id) {
    // hier
    //return this.kommonitorFilterModes.indexOf(id) !== -1;
    return true;
  }

  setupSpatialUnitFilter(indicatorMetadataAndGeoJSON, spatialUnitName, date) {
    this.loadingData = true;

    const allowedSpatialUnitIds = indicatorMetadataAndGeoJSON.applicableSpatialUnits.map(
      (spatialUnitEntry) => {
        return spatialUnitEntry.spatialUnitId;
      }
    );

    this.higherSpatialUnits = JSON.parse(
      JSON.stringify(this.spatialUnitStore.availableSpatialUnits)
    );

    // only show those spatial units that are actually visible according to keycloak role
    // and associated to the current indicator as well
    for (let index = 0; index < this.higherSpatialUnits.length; index++) {
      const spatialUnitMetadata = this.higherSpatialUnits[index];

      // remove if it is not applicable for current indicator OR
      // remove if it is the currently displayed spatial unit to show only hierarchically higher spatial units
      if (
        this.considerAllowedSpatialUnitsOfCurrentIndicator &&
        !allowedSpatialUnitIds.includes(spatialUnitMetadata.spatialUnitId)
      ) {
        // only remove the current element
        // which represents a spatial unit that is
        // not supported by the current indicator
        this.higherSpatialUnits.splice(index, 1);
      }

      // since we query through a hierarchically sorted array of ALL spatial units
      // we have to stop when we identify the currently displayed spatial unit
      // in that case we have to remove that from the list of upper
      if (spatialUnitName == spatialUnitMetadata.spatialUnitLevel) {
        // remove current all all remaining elements from array
        // (which are lower hierarchy spatial units)
        this.higherSpatialUnits.splice(index);
        break;
      }
    }

    // this.higherSpatialUnits.splice(targetIndex);
    this.selectedSpatialUnitForFilter = this.higherSpatialUnits[this.higherSpatialUnits.length - 1];

    if (this.higherSpatialUnits.lenght)
      this.spatialLevel = new FormControl(this.selectedSpatialUnitForFilter!.spatialUnitId);

    this.loadingData = false;
  }

  onOnChangeSelectedIndicator() {
    this.reappliedFilter = false;

    // Clear any active feature filter when the selected indicator changes.
    // Feature ids are per spatial unit and therefore identical across indicators
    // on the same spatial unit, so stale filtered ids from the previous indicator
    // would otherwise survive the switch and make styleFor() paint those features
    // with the grey filteredStyle instead of a class color ("feature has no class").
    // This broadcast fires synchronously before the (async) map render, so the
    // filter is cleared in time. The value-range filter is meaningless for the new
    // indicator anyway and its slider is reset via UpdateIndicatorValueRangeFilter.
    this.filterHelperService.clearFilteredFeatures();

    this.indicatorClassificationType =
      this.selectionState.selectedIndicator.defaultClassificationMapping.classificationType;
  }
  /* 

  this.$on("indicatortMapDisplayFinished", function(){
    // trigger the continous display of current filter									
    if(! this.reappliedFilter){
      this.reappliedFilter = true;
      if (this.showSelectionByFeatureSpatialFilter){
        this.onSelectionByFeatureSpatialFilterSelectBtnPressed();
      }
      if (this.showManualSelectionSpatialFilter){
        this.onManualSelectionBySelectedMapFeaturesBtnPressed();
      }										
    }	
  });
*/
  onIndicatorDatasetReplaced(request: IndicatorRenderRequest) {
    const { indicator: indicatorMetadataAndGeoJSON, spatialUnitName, date } = request;
    this.setupSpatialUnitFilter(indicatorMetadataAndGeoJSON, spatialUnitName, date);

    if (!this.previouslySelectedIndicator) {
      this.previouslySelectedIndicator = this.selectionState.selectedIndicator;
    }
    if (!this.previouslySelectedSpatialUnit) {
      this.previouslySelectedSpatialUnit = this.selectionState.selectedSpatialUnit;
    }

    // if(this.previouslySelectedIndicator.indicatorId != indicatorMetadataAndGeoJSON.indicatorId || this.previouslySelectedSpatialUnit.spatialUnitLevel != spatialUnitName){
    if (this.previouslySelectedSpatialUnit.spatialUnitLevel != spatialUnitName) {
      // reset filter component
      if (this.showSelectionByFeatureSpatialFilter) this.updateSelectableAreas('byFeature');
      this.filterHelperService.clearFilteredFeatures();
      this.filterHelperService.clearSelectedFeatures();
      if (this.showManualSelectionSpatialFilter) this.updateSelectableAreas('manual');
      this.filterHelperService.clearFilteredFeatures();
      this.filterHelperService.clearSelectedFeatures();
    }

    this.previouslySelectedIndicator = this.selectionState.selectedIndicator;
    this.previouslySelectedSpatialUnit = this.selectionState.selectedSpatialUnit;
  }

  updateIndicatorValueRangeFilter([date, indicatorMetadataAndGeoJSON]) {
    this.defaultRangeSliderSetup = { date: date, geoJson: indicatorMetadataAndGeoJSON };

    this.rangeFilterState.rangeFilterIsApplied = false;
    this.setupRangeSliderForFilter(date, indicatorMetadataAndGeoJSON);
  }

  setupRangeSliderForFilter(date, indicatorMetadataAndGeoJSON) {
    // hier
    date = this.INDICATOR_DATE_PREFIX + date;

    if (this.rangeSliderForFilter) {
      this.rangeFilterState.rangeFilterData = undefined;
      this.rangeSliderForFilter.destroy();

      const domNode: HTMLElement | null = document.getElementById('rangeSliderForFiltering');

      if (domNode && domNode.lastChild) {
        while (domNode.hasChildNodes()) {
          domNode.removeChild(domNode.lastChild);
        }
      }
    }

    this.indicatorMetadataAndGeoJSON = indicatorMetadataAndGeoJSON;
    if (!this.indicatorMetadataAndGeoJSON?.geoJSON?.features) {
      console.warn(
        'Filter range slider cannot be created yet, as the indicator geoJSON is not available.'
      );
      return;
    }

    const values: any[] = [];

    this.indicatorMetadataAndGeoJSON.geoJSON.features.forEach((feature: any) => {
      // if (feature.properties[date] > movMaxValue)
      // 	movMaxValue = feature.properties[date];
      //
      // else if (feature.properties[date] < movMinValue)
      // 	movMinValue = feature.properties[date];

      if (!this.indicatorValueService.indicatorValueIsNoData(feature.properties[date])) {
        values.push(feature.properties[date]);
      }
    });

    if (values.length === 0) {
      console.warn(
        'Filter range slider cannot be created, as there is no valid indicator value on the selected dataset for the selected date.'
      );
      return;
    }

    //sort ascending order
    values.sort(function (a, b) {
      return a - b;
    });

    // initialize and fill in loop
    this.valueRangeMinValue = values[0];
    this.valueRangeMaxValue = values[values.length - 1];

    this.valueRangeMinValue = this.getIndicatorValue_asNumber(this.valueRangeMinValue);
    this.valueRangeMaxValue = this.getIndicatorValue_asNumber(this.valueRangeMaxValue);

    this.currentLowerFilterValue = this.valueRangeMinValue;
    this.currentHigherFilterValue = this.valueRangeMaxValue;

    this.inputLowerFilterValue = this.valueRangeMinValue;
    this.inputHigherFilterValue = this.valueRangeMaxValue;

    // Pass fireSetEvent=false so this programmatic reset does NOT emit a 'set'
    // event. Otherwise updateOptions triggers onChangeRangeFilter ->
    // applyRangeFilter on every dataset / spatial-unit / indicator change and
    // marks features outside the (pre-reset) handle positions as filtered,
    // painting them with the grey filteredStyle instead of a class color and
    // dropping them from the legend feature count.
    this.slider.noUiSlider.updateOptions(
      {
        range: {
          min: this.valueRangeMinValue,
          max: this.valueRangeMaxValue,
        },
        start: [this.valueRangeMinValue, this.valueRangeMaxValue],
        step: 0.01,
        tooltips: true,
        pips: {
          mode: 'range',
          density: 25,
        },
      },
      false
    );

    // Rebind the single user-interaction handler. setupRangeSliderForFilter runs
    // again on every dataset change, so remove any previously bound handler first
    // to avoid accumulating duplicate 'set' listeners on the shared slider.
    this.slider.noUiSlider.off('set');
    this.slider.noUiSlider.on('set', () => {
      this.onChangeRangeFilter(this.getFormatedSliderReturn());
    });
  }

  getFormatedSliderReturn() {
    const data = this.slider.noUiSlider.get(true);

    return {
      from: data[0],
      to: data[1],
    };
  }

  onChangeLowerFilterValue(value) {
    this.inputLowerFilterValue = value;

    this.updateFilterRangeSlideronInputChange();

    if (
      this.inputLowerFilterValue >= this.valueRangeMinValue &&
      this.inputLowerFilterValue <= this.valueRangeMaxValue &&
      this.inputLowerFilterValue <= this.inputHigherFilterValue
    ) {
      this.currentLowerFilterValue = this.inputLowerFilterValue;
      this.lowerFilterInputNotValid = false;
      this.rangeSliderForFilter.update({
        from: this.currentLowerFilterValue,
        to: this.currentHigherFilterValue,
      });

      this.applyRangeFilter();
    } else {
      this.lowerFilterInputNotValid = true;
    }
  }

  updateFilterRangeSlideronInputChange() {
    this.slider.noUiSlider.updateOptions({
      start: [this.inputLowerFilterValue, this.inputHigherFilterValue],
    });
  }

  onChangeHigherFilterValue(value) {
    this.inputHigherFilterValue = value;

    this.updateFilterRangeSlideronInputChange();

    if (
      this.inputHigherFilterValue <= this.valueRangeMaxValue &&
      this.inputHigherFilterValue >= this.valueRangeMinValue &&
      this.inputLowerFilterValue <= this.inputHigherFilterValue
    ) {
      this.currentHigherFilterValue = this.inputHigherFilterValue;
      this.higherFilterInputNotValid = false;
      this.rangeSliderForFilter.update({
        from: this.currentLowerFilterValue,
        to: this.currentHigherFilterValue,
      });

      this.applyRangeFilter();
    } else {
      this.higherFilterInputNotValid = true;
    }
  }

  onChangeRangeFilter(data) {
    // Called every time handle position is changed
    this.rangeFilterState.rangeFilterData = data;

    this.lowerFilterInputNotValid = false;
    this.higherFilterInputNotValid = false;

    this.currentLowerFilterValue = data.from;
    this.inputLowerFilterValue = data.from;

    (<HTMLInputElement>document.getElementById('inputLowerValue')).value =
      this.inputLowerFilterValue;

    this.currentHigherFilterValue = data.to;
    this.inputHigherFilterValue = data.to;

    (<HTMLInputElement>document.getElementById('inputHigherValue')).value =
      this.inputHigherFilterValue;

    this.applyRangeFilter();
  }

  applyRangeFilter() {
    this.rangeFilterState.rangeFilterIsApplied = false;
    if (
      this.inputHigherFilterValue < this.valueRangeMaxValue ||
      this.inputLowerFilterValue > this.valueRangeMinValue
    ) {
      this.rangeFilterState.rangeFilterIsApplied = true;
    }

    const dateProperty = this.INDICATOR_DATE_PREFIX + this.selectionState.selectedDate;

    this.filterHelperService.applyRangeFilter(
      this.indicatorMetadataAndGeoJSON.geoJSON.features,
      dateProperty,
      this.currentLowerFilterValue,
      this.currentHigherFilterValue
    );
  }

  onChangeUseMeasureOfValue() {
    const middle =
      this.valueRangeMinValue + (this.valueRangeMaxValue - this.valueRangeMinValue) / 2;

    this.measureSlider.noUiSlider.updateOptions({
      range: {
        min: this.valueRangeMinValue,
        max: this.valueRangeMaxValue,
      },
      start: [middle],
      connect: [true, false],
      step: 0.01,
      tooltips: true,
      pips: {
        mode: 'range',
        density: 25,
      },
    });

    this.measureSlider.noUiSlider.on('set', () => {
      const data = this.measureSlider.noUiSlider.get(true);

      this.chartDisplayState.measureOfValue = data;
      this.onMeasureOfValueChangeByText();
    });

    if (this.chartDisplayState.isBalanceChecked) {
      // todo
      /* 	$rootScope.$broadcast("DisableBalance");
      $rootScope.$broadcast("updateIndicatorValueRangeFilter", this.selectionState.selectedDate, this.selectionState.selectedIndicator); */
      //replace displayed indicator on map
      this.filterHelperService.filterAndReplaceDataset();
      // kommonitorMapService.replaceIndicatorGeoJSON(this.selectionState.selectedIndicator, this.selectionState.selectedSpatialUnit.spatialUnitLevel, this.selectionState.selectedDate, true);
    } else {
      this.mapService.restyleCurrentLayer();
    }
  }

  // hier
  updateMeasureOfValueBar([date, indicatorMetadataAndGeoJSON]) {
    //append date prefix to access correct property!
    date = this.INDICATOR_DATE_PREFIX + date;
    const geoJSON = indicatorMetadataAndGeoJSON.geoJSON;

    // var measureOfValueInput = document.getElementById("measureOfValueInput");

    const values: any[] = [];

    geoJSON.features.forEach((feature: any) => {
      // if (feature.properties[date] > movMaxValue)
      // 	movMaxValue = feature.properties[date];
      //
      // else if (feature.properties[date] < movMinValue)
      // 	movMinValue = feature.properties[date];

      if (!this.indicatorValueService.indicatorValueIsNoData(feature.properties[date])) {
        values.push(feature.properties[date]);
      }
    });

    //sort ascending order
    values.sort(function (a, b) {
      return a - b;
    });

    this.movMinValue = +Number(values[0]).toFixed(this.numberOfDecimals);
    this.movMaxValue = +Number(values[values.length - 1]).toFixed(this.numberOfDecimals);

    this.movMiddleValue = +((this.movMaxValue + this.movMinValue) / 2).toFixed(
      this.numberOfDecimals
    );
    // this.movStep = +((this.movMaxValue - this.movMinValue)/35).toFixed(numberOfDecimals);
    this.movStep = 0.01;

    // measureOfValueInput.setAttribute("min", this.movMinValue);
    // measureOfValueInput.setAttribute("max", this.movMaxValue);
    // measureOfValueInput.setAttribute("movStep", this.movStep);
    // measureOfValueInput.setAttribute("value", this.movMiddleValue);

    this.chartDisplayState.measureOfValue = this.movMiddleValue;

    const measureOfValueTextInput = <HTMLInputElement>(
      document.getElementById('measureOfValueTextInput')
    );
    measureOfValueTextInput.setAttribute('min', this.movMinValue);
    measureOfValueTextInput.setAttribute('max', this.movMaxValue);
    measureOfValueTextInput.setAttribute('value', this.movMiddleValue);
    measureOfValueTextInput.setAttribute('step', this.movStep);

    if (this.movRangeSlider) {
      this.movRangeSlider.destroy();

      const domNode = <HTMLInputElement>document.getElementById('measureOfValueInput');

      if (domNode && domNode.lastChild) {
        while (domNode.hasChildNodes()) {
          domNode.removeChild(domNode.lastChild);
        }
      }
    }

    const middle = this.movMinValue + (this.movMaxValue - this.movMinValue) / 2;

    this.measureSlider.noUiSlider.updateOptions({
      range: {
        min: this.movMinValue,
        max: this.movMaxValue,
      },
      start: [middle],
      connect: [true, false],
      step: 0.01,
      tooltips: true,
      pips: {
        mode: 'range',
        density: 25,
      },
    });

    this.inputNotValid = false;
  }

  onMeasureOfValueChange(data) {
    this.chartDisplayState.measureOfValue = +Number(data.from).toFixed(this.numberOfDecimals);

    // this.exchangeData.measureOfValue = +Number(this.exchangeData.measureOfValue).toFixed(numberOfDecimals);

    if (
      this.chartDisplayState.measureOfValue >= this.movMinValue &&
      this.chartDisplayState.measureOfValue <= this.movMaxValue
    ) {
      this.inputNotValid = false;
      // todo
      // $rootScope.$broadcast("changeMOV", this.exchangeData.measureOfValue);
      this.mapService.restyleCurrentLayer();
    } else {
      this.inputNotValid = true;
    }
  }

  onMeasureOfValueChangeByText() {
    this.chartDisplayState.measureOfValue = +Number(this.chartDisplayState.measureOfValue).toFixed(
      this.numberOfDecimals
    );

    // this.exchangeData.measureOfValue = +Number(this.exchangeData.measureOfValue).toFixed(numberOfDecimals);

    if (
      this.chartDisplayState.measureOfValue >= this.movMinValue &&
      this.chartDisplayState.measureOfValue <= this.movMaxValue
    ) {
      this.inputNotValid = false;

      // todo
      /* 	this.movRangeSlider.update({
          from: this.exchangeData.measureOfValue
      }); */
      // $rootScope.$broadcast("changeMOV", this.exchangeData.measureOfValue);
      this.mapService.restyleCurrentLayer();
    } else {
      this.inputNotValid = true;
    }
  }

  updateSelectableAreas(selectionType, showHideToggle = true) {
    this.loadingData = true;
    //send request to datamanagement API
    const selectedSpatialUnit = this.selectionState.selectedSpatialUnit;
    const selectedSpatialUnitId = selectedSpatialUnit.spatialUnitId;
    let upperSpatialUnitId = undefined;

    // spatial filter not applicable since no upper spatial unit is available or selected
    /*   if(! this.selectedSpatialUnitForFilter){
      this.loadingData = false;
      return;
    } */

    if (selectionType === 'byFeature' && this.selectedSpatialUnitForFilter) {
      upperSpatialUnitId = this.selectedSpatialUnitForFilter.spatialUnitId;
    }
    const selectedIndicatorId = this.selectionState.selectedIndicator.indicatorId;

    // example: 2020-12-31
    const selectedDateComponents = this.selectionState.selectedDate.split('-');

    //build request
    let datePath = '';
    if (
      selectedDateComponents &&
      selectedDateComponents.length &&
      selectedDateComponents.length == 3
    ) {
      datePath =
        selectedDateComponents[0] +
        '/' +
        selectedDateComponents[1] +
        '/' +
        selectedDateComponents[2];
    } else {
      // fallback option, if no valid date could be used
      datePath = 'allFeatures';
    }
    let url =
      this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
      '/spatial-units/' +
      selectedSpatialUnitId +
      '/' +
      datePath;

    if (selectionType === 'byFeature' && upperSpatialUnitId)
      url =
        this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
        '/spatial-units/' +
        upperSpatialUnitId +
        '/' +
        datePath;

    //send request
    this.http.get(url).subscribe({
      next: (response) => {
        const areaNames: any[] = [];
        response['features'].forEach((obj, id) => {
          areaNames.push({
            name: obj.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME],
            id: obj.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME],
          });
        });

        if (selectionType === 'manual') {
          const dataArray = this.indicatorValueService.createDualListInputArray(
            areaNames,
            'name',
            'id'
          );
          const data = { items: dataArray, selectedItems: [] };
          this.manualSelectionSpatialFilterDuallistOptions = data;

          if (showHideToggle)
            this.showManualSelectionSpatialFilter = !this.showManualSelectionSpatialFilter;
        }

        if (selectionType === 'byFeature') {
          this.higherSpatialUnitFilterFeatureGeoJSON = response;
          this.selectionByFeatureSpatialFilterDuallistOptions.selectedItems = [];
          const dataArray = this.indicatorValueService.createDualListInputArray(
            areaNames,
            'name',
            'id'
          );
          this.selectionByFeatureSpatialFilterDuallistOptions.items = dataArray;
        }

        this.loadingData = false;
        this.reloadList = !this.reloadList;
      },
      error: (_error) => {
        /* ignore */
      },
    });
  }

  onChangeShowManualSelection() {
    this.onManualSelectionSpatialFilterActiveBtnPressed();

    // return if toggle was deactivated
    if (this.showManualSelectionSpatialFilter) this.showSelectionByFeatureSpatialFilter = false;
  }

  onChangeShowSelectionByFeature(checked) {
    this.showSelectionByFeatureSpatialFilter = checked;

    // return if toggle was deactivated
    if (!this.showSelectionByFeatureSpatialFilter)
      this.onSelectionByFeatureSpatialFilterResetBtnPressed();
    else {
      this.showManualSelectionSpatialFilter = false;
      this.onSelectionByFeatureSpatialFilterResetBtnPressed();
    }
  }

  onChangeSelectedSpatialUnitForFilter() {
    this.selectedSpatialUnitForFilter = this.higherSpatialUnits.filter(
      (e) => e.spatialUnitId == this.spatialLevel.value
    )[0];

    if (this.showSelectionByFeatureSpatialFilter) this.updateSelectableAreas('byFeature');

    if (this.showManualSelectionSpatialFilter) {
      this.updateSelectableAreas('manual');
    }
  }

  onSelectionByFeatureSpatialFilterSelectBtnPressed() {
    if (
      this.selectionByFeatureSpatialFilterDuallistOptions.selectedItems &&
      this.selectionByFeatureSpatialFilterDuallistOptions.selectedItems.length > 0
    ) {
      // objects like {category: category, name:name}
      //this.selectionByFeatureSpatialFilterDuallistOptions.selectedItems
      const targetFeatureNames =
        this.selectionByFeatureSpatialFilterDuallistOptions.selectedItems.map(
          (object: any) => object.name
        );
      console.log(this.higherSpatialUnitFilterFeatureGeoJSON, targetFeatureNames);
      this.filterHelperService.applySpatialFilter_higherSpatialUnitFeatures(
        this.higherSpatialUnitFilterFeatureGeoJSON,
        targetFeatureNames
      );
    }
  }

  onSelectionByFeatureSpatialFilterResetBtnPressed() {
    this.updateSelectableAreas('byFeature');

    this.filterHelperService.clearFilteredFeatures();
    this.filterHelperService.filterAndReplaceDataset();
    if (this.envConfigService.useNoDataToggle) {
      // todo $rootScope.$broadcast('applyNoDataDisplay')
    }
  }

  onManualSelectionSpatialFilterSelectBtnPressed() {
    if (
      this.manualSelectionSpatialFilterDuallistOptions.selectedItems &&
      this.manualSelectionSpatialFilterDuallistOptions.selectedItems.length > 0
    ) {
      // objects like {category: category, name:name}
      //this.manualSelectionSpatialFilterDuallistOptions.selectedItems
      const targetFeatureNames = this.manualSelectionSpatialFilterDuallistOptions.selectedItems.map(
        (object: any) => object.name
      );

      this.filterHelperService.applySpatialFilter_currentSpatialUnitFeatures(targetFeatureNames);
    }
  }

  onManualSelectionSpatialFilterActiveBtnPressed() {
    this.updateSelectableAreas('manual');

    this.filterHelperService.clearFilteredFeatures();
    this.filterHelperService.filterAndReplaceDataset();
    if (this.envConfigService.useNoDataToggle) {
      // todo $rootScope.$broadcast('applyNoDataDisplay')
    }
  }

  onManualSelectionSpatialFilterResetBtnPressed() {
    this.updateSelectableAreas('manual', false);

    this.filterHelperService.clearFilteredFeatures();
    this.filterHelperService.filterAndReplaceDataset();
    if (this.envConfigService.useNoDataToggle) {
      // todo $rootScope.$broadcast('applyNoDataDisplay')
    }
  }

  onManualSelectionBySelectedMapFeaturesBtnPressed() {
    // manage duallist items display
    this.manageManualDualList_fromMapSelection();

    // apply spatial filter from selected map features
    this.onManualSelectionSpatialFilterSelectBtnPressed();
  }

  manageManualDualList_fromMapSelection() {
    this.manualSelectionSpatialFilterDuallistOptions.items =
      this.manualSelectionSpatialFilterDuallistOptions.items.concat(
        this.manualSelectionSpatialFilterDuallistOptions.selectedItems
      );
    this.manualSelectionSpatialFilterDuallistOptions.selectedItems = [];

    this.manualSelectionSpatialFilterDuallistOptions.selectedItems =
      this.manualSelectionSpatialFilterDuallistOptions.items.filter((item: any) =>
        this.filterHelperService.featureIsCurrentlySelected(item.id)
      );
    this.manualSelectionSpatialFilterDuallistOptions.items =
      this.manualSelectionSpatialFilterDuallistOptions.items.filter(
        (item: any) => !this.filterHelperService.featureIsCurrentlySelected(item.id)
      );
  }

  removeRangeFilter() {
    this.setupRangeSliderForFilter(
      this.defaultRangeSliderSetup.date,
      this.defaultRangeSliderSetup.geoJson
    );
  }

  // $rootScope.$on("changeSpatialUnit", function() {
  // 	if (this.showSelectionByFeatureSpatialFilter)
  // 		this.updateSelectableAreas("byFeature");
  // 	if (this.showManualSelectionSpatialFilter)
  // 		this.updateSelectableAreas("manual");
  // });

  //TODO on indicator change
}
