import { Component, OnInit, ElementRef } from '@angular/core';


@Component({
  selector: 'indicator-radar',
  templateUrl: 'indicator-radar.component.html', 
  styleUrls: ['indicator-radar.component.css'], 
})
export class IndicatorRadarComponent implements OnInit {
  activeTab = 0;
  radarChart: any; 
  indicatorNameFilter: any; 
  eventsRegistered = false;
  numberOfDecimals: number | undefined; 
  setupCompleted = true;
  date: any; 
  spatialUnitName: any; 
    $scope: any;
    $rootScope: any;

  constructor(
    private kommonitorDataExchangeService: KommonitorDataExchangeService,
    private kommonitorDiagramHelperService: KommonitorDiagramHelperService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.$scope.$on("updateDiagramsForHoveredFeature", (event: any, featureProperties: any) => {
        if (!this.radarChart || !this.radarOption || !this.radarOption.legend || !this.radarOption.series) {
          return;
        }
      
        if (!kommonitorFilterHelperService.featureIsCurrentlySelected(featureProperties[__env.FEATURE_ID_PROPERTY_NAME])) {
          this.appendSeriesToRadarChart(featureProperties);
        }
      
        this.highlightFeatureInRadarChart(featureProperties);
      });

    this.$scope.$on('allIndicatorPropertiesForCurrentSpatialUnitAndTime setup begin', async (event) => {
        await this.wait(130);
        this.setupCompleted = false;
        this.$timeout(() => {
          this.$scope.$digest();
        }, 500);
      });

  
      this.$scope.$on('allIndicatorPropertiesForCurrentSpatialUnitAndTime setup completed', async (event) => {
        await this.wait(130);
        this.setupCompleted = true;
        this.$timeout(() => {
          this.$scope.$digest();
          this.filterDisplayedIndicatorsOnRadar();
        }, 500);
      });
    // Initialize any adminLTE box widgets
    $(this.elementRef.nativeElement).find('.box').boxWidget();

    $(window).on('resize', () => {
      if (this.radarChart != null && this.radarChart != undefined) {
        this.radarChart.resize();
      }
    });

    this.kommonitorDiagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime(this.kommonitorDiagramHelperService.filterSameUnitAndSameTime);
  

  onChangeFilterSameUnitAndSameTime() {
    if (this.radarChart) {
      this.radarChart.dispose();
      this.radarChart = echarts.init(document.getElementById('radarDiagram'));
    }
    this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime = [];

    this.kommonitorDiagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime(this.kommonitorDiagramHelperService.filterSameUnitAndSameTime);
  }

  this.$scope.$on('updateDiagrams', (event, indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, justRestyling) => {
    // if the layer is just restyled (i.e. due to change of measureOfValue)
    // then we do not need to costly update the radar diagram
    if (justRestyling) {
      return;
    }

    console.log('Updating radar diagram');

    this.setupCompleted = false;


    this.updateRadarChart(indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date);

    this.$rootScope.$broadcast('preserveHighlightedFeatures');
  });

 }
    $timeout(arg0: () => void, arg1: number) {
        throw new Error('Method not implemented.');
    }
 


 updateRadarChart(
    indicatorMetadataAndGeoJSON: any,
    spatialUnitName: any,
    spatialUnitId: any,
    date: any
  ) {
    
    this.date = date;
    this.spatialUnitName = spatialUnitName;

    if (!this.radarChart) {
      this.radarChart = echarts.init(document.getElementById('radarDiagram'));
    } else {
  
      this.radarChart.dispose();
      this.radarChart = echarts.init(document.getElementById('radarDiagram'));
      this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime = [];
    }

    await this.radarChart.showLoading();

    this.kommonitorDiagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime();

    this.activeTab = 0;
    if (this.kommonitorDataExchangeService.selectedIndicator.creationType == 'COMPUTATION') {
      this.activeTab = 1;
    }
    if (this.kommonitorDataExchangeService.selectedIndicator.isHeadlineIndicator) {
      this.activeTab = 2;
    }

    this.modifyRadarContent(this.kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
  }

 
 

  wait(ms: number) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms);
    });
  }


// Add this method inside your TypeScript class
async modifyRadarContent(indicatorsForRadar: any) {
    const indicatorArrayForRadarChart = new Array();
    const defaultSeriesValueArray = new Array();
  
    let sampleProperties = null;
  
    for (let i = 0; i < indicatorsForRadar.length; i++) {
      if (indicatorsForRadar[i].isSelected) {
        await this.kommonitorDiagramHelperService.fetchIndicatorPropertiesIfNotExists(i);
  
        // Create an object to hold indicatorName, max value, and average value
        const indicatorProperties = indicatorsForRadar[i].indicatorProperties;
  
        if (
          this.kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay &&
          this.kommonitorFilterHelperService.filteredIndicatorFeatureIds.size > 0
        ) {
          indicatorProperties = indicatorProperties.filter((featureProperties) =>
            !this.kommonitorFilterHelperService.featureIsCurrentlyFiltered(
              featureProperties[__env.FEATURE_ID_PROPERTY_NAME]
            )
          );
        }
  
        sampleProperties = indicatorsForRadar[i].indicatorProperties;
  
        // Initialize variables
        let maxValue = sampleProperties[0][`${DATE_PREFIX}${indicatorsForRadar[i].selectedDate}`];
        let minValue = sampleProperties[0][`${DATE_PREFIX}${indicatorsForRadar[i].selectedDate}`];
        let valueSum = 0;
  
        for (const indicatorPropertyInstance of indicatorProperties) {
          // For average, only apply real numeric values
          if (
            !this.kommonitorDataExchangeService.indicatorValueIsNoData(
              indicatorPropertyInstance[`${DATE_PREFIX}${indicatorsForRadar[i].selectedDate}`]
            )
          ) {
            const value = this.kommonitorDataExchangeService.getIndicatorValueFromArray_asNumber(
              indicatorPropertyInstance,
              indicatorsForRadar[i].selectedDate
            );
            valueSum += value;
  
            if (value > maxValue) {
              maxValue = value;
            }
  
            if (value < minValue) {
              minValue = value;
            }
          }
        }
  
        if (minValue == null) {
          minValue = 0;
        }
  
        if (maxValue == null) {
          maxValue = 1;
        }
  
        // Push the indicator data to the arrays
        indicatorArrayForRadarChart.push({
          name: `${indicatorsForRadar[i].indicatorMetadata.indicatorName} - ${indicatorsForRadar[i].selectedDate}`,
          unit: indicatorsForRadar[i].indicatorMetadata.unit,
          max: maxValue,
          min: minValue,
        });
  
        defaultSeriesValueArray.push(
          this.kommonitorDataExchangeService.getIndicatorValue_asNumber(
            Number(valueSum / indicatorProperties.length)
          )
        );
      }
    }
  
    if (defaultSeriesValueArray.length === 0) {
      if (this.$scope.radarChart) {
        this.$scope.radarChart.dispose();
        this.$scope.radarChart = undefined;
      }
    } else {
      if (!this.$scope.radarChart) {
        this.$scope.radarChart = echarts.init(this.elementRef.nativeElement.querySelector('#radarDiagram'));
      }
  
      // Define the radarOption here as you did before
  
      // Check if any feature is still clicked/selected
      // then append those as series within radar chart
      this.appendSelectedFeaturesIfNecessary(sampleProperties);
  
      // Use configuration item and data specified to show chart
      this.$scope.radarChart.setOption(this.radarOption);
  
      this.$scope.radarChart.hideLoading();
      setTimeout(() => {
        this.$scope.radarChart.resize();
        this.$scope.$digest();
      }, 350);
      this.registerEventsIfNecessary();
    }
  }
  

appendSelectedFeaturesIfNecessary(sampleProperties: any) {
    for (const propertiesInstance of sampleProperties) {
      if (this.kommonitorFilterHelperService.featureIsCurrentlySelected(propertiesInstance[__env.FEATURE_ID_PROPERTY_NAME])) {
        this.appendSeriesToRadarChart(propertiesInstance);
      }
    }
  }
  

  filterDisplayedIndicatorsOnRadar() {
    console.log("Filtering indicator radar");
    this.modifyRadarContent(kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
  }
  
  selectAllIndicatorsForRadar() {
    for (const indicator of kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime) {
      indicator.isSelected = true;
    }
  
    this.modifyRadarContent(kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
  }
  

  deselectAllIndicatorsForRadar() {
    for (const indicator of kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime) {
      indicator.isSelected = false;
    }
  
    this.modifyRadarContent(kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
  }

registerEventsIfNecessary() {
    if (!this.eventsRegistered) {
      // when hovering over elements of the chart then highlight them in the map.
      this.radarChart.on('mouseover', (params: any) => {
        const spatialFeatureName = params.data.name;
        if (spatialFeatureName) {
          this.$rootScope.$broadcast("highlightFeatureOnMap", spatialFeatureName);
        }
      });
  
      this.radarChart.on('mouseout', (params: any) => {
        const spatialFeatureName = params.data.name;
        if (spatialFeatureName) {
          this.$rootScope.$broadcast("unhighlightFeatureOnMap", spatialFeatureName);
        }
      });
  
      // Disable feature removal for radar chart - seems to be unintuitive
      // this.radarChart.on('click', (params: any) => {
      //   const spatialFeatureName = params.data.name;
      //   if (spatialFeatureName) {
      //     this.$rootScope.$broadcast("switchHighlightFeatureOnMap", spatialFeatureName);
      //   }
      // });
  
      this.eventsRegistered = true;
    }
  }

  

  appendSeriesToRadarChart(featureProperties: any) {
    // Append feature name to legend
    this.radarOption.legend.data.push(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);
  
    // Create feature data series
    const featureSeries: any = {};
    featureSeries.name = featureProperties[__env.FEATURE_NAME_PROPERTY_NAME];
    featureSeries.value = new Array();
    featureSeries.emphasis = {
      lineStyle: {
        width: 4,
        type: 'dotted'
      }
    };
    featureSeries.lineStyle = {
      width: 3,
      type: 'solid'
    };
    featureSeries.itemStyle = {
      borderWidth: 2
    };
  
    // For each indicator, create series data entry for the feature
    for (let i = 0; i < kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.length; i++) {
      if (kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].isSelected) {
        // Make an object to hold indicatorName, max value, and average value
        const indicatorProperties = kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].indicatorProperties;
        const date = kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].selectedDate;
  
        for (const indicatorPropertyInstance of indicatorProperties) {
          if (indicatorPropertyInstance[__env.FEATURE_NAME_PROPERTY_NAME] === featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]) {
            if (!kommonitorDataExchangeService.indicatorValueIsNoData(indicatorPropertyInstance[DATE_PREFIX + date])) {
              featureSeries.value.push(kommonitorDataExchangeService.getIndicatorValueFromArray_asNumber(indicatorPropertyInstance, date));
            } else {
              featureSeries.value.push(null);
            }
            break;
          }
        }
      }
    }
  
    this.radarOption.series[0].data.push(featureSeries);
  
    this.radarChart.setOption(this.radarOption);
    setTimeout(() => {
      this.radarChart.resize();
    }, 350);
    this.registerEventsIfNecessary();
  }


  // Add the highlightFeatureInRadarChart function inside your TypeScript class
highlightFeatureInRadarChart(featureProperties: any) {
    // Highlight the corresponding radar chart item
    const dataIndex = this.getSeriesDataIndexByFeatureName(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);
  
    if (dataIndex > -1) {
      this.radarChart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: dataIndex
      });
    }
  }
  
  unhighlightFeatureInRadarChart(featureProperties: any) {
    // Unhighlight the corresponding radar chart item
    const dataIndex = this.getSeriesDataIndexByFeatureName(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);
  
    if (dataIndex > -1) {
      this.radarChart.dispatchAction({
        type: 'downplay',
        seriesIndex: 0,
        dataIndex: dataIndex
      });
    }
  }
  
  // Modifies the $scope.$on("updateDiagramsForUnhoveredFeature") function
  $scope.$on("updateDiagramsForUnhoveredFeature", (event: any, featureProperties: any) => {
    if (!this.radarChart || !this.radarOption || !this.radarOption.legend || !this.radarOption.series) {
      return;
    }
  
    this.unhighlightFeatureInRadarChart(featureProperties);
  
    if (!kommonitorFilterHelperService.featureIsCurrentlySelected(featureProperties[__env.FEATURE_ID_PROPERTY_NAME])) {
      this.removeSeriesFromRadarChart(featureProperties);
    }
  });
  
  // Modifies the removeSeriesFromRadarChart function
  removeSeriesFromRadarChart(featureProperties: any) {
    // Remove feature from legend
    const legendIndex = this.radarOption.legend.data.indexOf(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);
    if (legendIndex > -1) {
      this.radarOption.legend.data.splice(legendIndex, 1);
    }
 
    const dataIndex = this.getSeriesDataIndexByFeatureName(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);
    if (dataIndex > -1) {
      this.radarOption.series[0].data.splice(dataIndex, 1);
    }
  
   
    this.radarChart.setOption(this.radarOption, true);
    setTimeout(() => {
      this.radarChart.resize();
    }, 350);
    this.registerEventsIfNecessary();
  }
  
  // Modifies the getSeriesDataIndexByFeatureName function
  getSeriesDataIndexByFeatureName(featureName: string) {
    for (let index = 0; index < this.radarOption.series[0].data.length; index++) {
      if (this.radarOption.series[0].data[index].name === featureName) {
        return index;
      }
    }
  
    // Return -1 if none was found
    return -1;
  }
  




}



























