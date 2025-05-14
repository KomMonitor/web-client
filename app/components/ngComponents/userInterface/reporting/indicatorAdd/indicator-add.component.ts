import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { fromJson, toJson } from 'angular';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import * as echarts from 'echarts';
import * as turf from '@turf/turf';
import { FormsModule } from '@angular/forms';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';
import { HttpClient } from '@angular/common/http';
import { DualListBoxComponent } from "../../../customElements/dual-list-box/dual-list-box.component";
import * as L from 'leaflet';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';

@Component({
  selector: 'app-indicator-add',
  standalone: true,
  templateUrl: './indicator-add.component.html',
  styleUrls: ['./indicator-add.component.css'],
  imports: [CommonModule, FormsModule, DualListBoxComponent]
})
export class IndicatorAddComponent implements OnInit {

  @Output() selectedWorkflow = new EventEmitter<any[]>();
  @Input() data:any = [];
  
	template:any = undefined;
  untouchedTemplateAsString = "";
  isochrones;
  typeOfMovement;
  geoJsonForReachability;
  reachabilityTemplateGeoMapOptions;
  draggingLabelForFeature;
  isochronesRangeType;
  isochronesRangeUnits;
  insertDatatableRowsInterval;
  intervalArr:any[] = [];
  updateDiagramsInterval_areas;
  
  indicatorNameFilter = "";
  poiNameFilter = "";
  selectedIndicator:any = undefined;
  selectedPoiLayer:any = undefined;
  availablePoiLayers = [];
  displayableIndicatorsByNameTimeseries;
  displayableIndicatorsByName;
  filteredAvailablePoiLayers;

  availableFeaturesBySpatialUnit:any = {};
  selectedSpatialUnit:any;
  selectedAreas = [];

  allSpatialUnitsForReachability;

  testOptions:any = {
    items: []
  }
  reloadManualList = false;
  reloadTimestampsDualList = false;

  dualListAreasOptions:any = {
    items: [],
    selectedItems: []
  };
  reloadAreasDualList = false;
  dualListTimestampsOptions;
  dualListSpatialUnitsOptions;
  indexOfFirstAreaSpecificPage;
  isochronesSeriesData;

  selectedTimestamps:any[] = [];
  dateSlider:any = undefined;
  absoluteLabelPositions:any[] = [];
  showMapLabels = true;
  showRankingMeanLine = true;
  echartsOptions:any = {
    map: {
      // "2017-12-31": ...
      // "2018-12-31": ...
    },
    bar: {
      // "2017-12-31": ...
      // "2018-12-31": ...
    },
    line: {}, // no timestamp needed here
  }
  echartsRegisteredMapNames:any[] = [];
  
  loadingData = false;
  diagramsPrepared = false;
  isFirstUpdateOnIndicatorOrPoiLayerSelection = true;
  showResetIsochronesBtn = false;

  isochronesTypeOfMovementMapping = {
    "foot-walking": "Fußgänger",
    "driving-car": "Auto",
    "cycling-regular": "Fahrrad",
    "wheelchair": "Barrierefrei",
    "buffer": "Puffer"
  }

  // used to track template pages instead of using $$hashkey
  templatePageIdCounter = 1;
  
  timeseriesAdjustedOnSpatialUnitChange;

  constructor(
    protected dataExchangeService: DataExchangeService,
    private broadcastSerice: BroadcastService,
    private diagramHelperService: DiagramHelperServiceService,
    private visualStyleHelperService: VisualStyleHelperServiceNew,
    private httpClient: HttpClient,
    private broadcastService: BroadcastService,
    private reachabilityHelperService: ReachabilityHelperService
  ) {
  }

  ngOnInit(): void {

    // originally called by "reportingConfigureNewIndicatorShown" when +Indicator clicked
    this.initialize();

    this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      let title = broadcastMsg.msg;
      let values:any = broadcastMsg.values;

      switch (title) {
        case 'reportingConfigureNewIndicatorShown': {
          this.initialize();
        } break;
        case 'reportingConfigureNewPoiLayerShown': {
          this.initialize();
        } break;
        case 'reportingIsochronesCalculationStarted': {
          this.reportingIsochronesCalculationStarted();
        } break;
        case 'reportingIsochronesCalculationFinished': {
          this.reportingIsochronesCalculationFinished(values);
        } break;
      }
    });
  }

  
  initialize() {
    this.loadingData = true;
    let template = this.data.template;
    // deep copy template before any changes are made.
    // this is needed when additional timestamps are inserted.
    this.untouchedTemplateAsString = toJson(template)
    // give each page a unique id to track it by in ng-repeat
    for(let page of template.pages) {
      page.id = this.templatePageIdCounter++;
    }
    this.template = template;

    if(this.template.name.includes("timestamp"))
      this.indexOfFirstAreaSpecificPage = 6;
    if(this.template.name.includes("timeseries"))
      this.indexOfFirstAreaSpecificPage = 8;
    if(this.template.name.includes("reachability"))
      this.indexOfFirstAreaSpecificPage = 2;

    // disable tabs to force user to pick a poi-layer / indicator first
    let tabList:HTMLElement = document.querySelector("#reporting-add-indicator-tab-list")!;

    let tabPanes = document.querySelectorAll("#reporting-add-indicator-tab-content > .tab-pane");
    let tabChildren = Array.from(tabList.children)
    for(let [idx, tab] of tabChildren.entries()) {
      let id:any = tab.id.at(-1);
      if( (this.template.name.includes("reachability") && id==1) || // pois
          (!this.template.name.includes("reachability") && id==3) ) { // indicators
        tab.classList.add("active");
        tabPanes[idx].classList.add("active");
      } else {
        tab.classList.remove("active");
        tabPanes[idx].classList.remove("active");
      }
    }

    this.initializeDualLists();

    this.availablePoiLayers = this.dataExchangeService.pipedData.availableGeoresources.filter(georesource => georesource.isPOI);
    this.filteredAvailablePoiLayers = this.availablePoiLayers.filter((e:any) =>e.datasetName==this.poiNameFilter).sort(this.sortByDatasetName);

    this.displayableIndicatorsByNameTimeseries = this.dataExchangeService.pipedData.displayableIndicators.filter((e:any) => e.applicableDates.length>0).sort(this.sortByindicatorName);
    this.displayableIndicatorsByName = this.dataExchangeService.pipedData.displayableIndicators.sort(this.sortByindicatorName);

    this.loadingData = false;
  }

  onIndicatorNameFilterChange(event:any) {

    let value = event.target.value;
    this.displayableIndicatorsByNameTimeseries = this.dataExchangeService.pipedData.displayableIndicators.filter((e:any) => (e.indicatorName.toLowerCase().includes(value) && e.applicableDates.length>0)).sort(this.sortByindicatorName);
    this.displayableIndicatorsByName = this.dataExchangeService.pipedData.displayableIndicators.filter((e:any) => e.indicatorName.toLowerCase().includes(value)).sort(this.sortByindicatorName);
  }

  onWorkflowSelect(value: any[]) {
    this.selectedWorkflow.emit(value);
  }
/* 
  $scope.filterTimeseriesIndicator = function(indicator) {
    // must have more than one applicable date
    return indicator.applicableDates && indicator.applicableDates.length > 1;
    };
  
  */

  onSelectedAreasChanged(newVal) {
    console.log("change called", newVal)
    if( typeof(this.template) === "undefined") return;
    this.loadingData = true;
    // to make things easier we remove all area-specific pages and recreate them using newVal
    // this approach is not optimized for performance and might have to change in the future

    // remove all area-specific pages
    this.template.pages = this.template.pages.filter( page => {
      return !page.hasOwnProperty("area")
    });

    if(this.template.name.includes("timestamp"))
      this.updateAreasForTimestampTemplates(newVal)
    if(this.template.name.includes("timeseries"))
      this.updateAreasForTimeseriesTemplates(newVal)
    if(this.template.name.includes("reachability"))
      this.updateAreasForReachabilityTemplates(newVal)

    this.updateDiagramsInterval_areas = setInterval(() => { 
      
      if(this.diagramsPrepared) {
        clearInterval(this.updateDiagramsInterval_areas); // code below still executes once
      } else {
        return;
      }
      // diagrams are prepared, but dom has to be updated first, too
      // we could filter the geoJson here to only include selected areas
      // but for now we get all areas and filter them out after
      let justChanged = false;
      if(this.isFirstUpdateOnIndicatorOrPoiLayerSelection) {
        // Skip the update but set variable to false, so diagrams get updated on time update
        // (relevant for indicator selection only)
        this.isFirstUpdateOnIndicatorOrPoiLayerSelection = false;
        justChanged = true;
      } 
      if(this.template.name.includes("reachability") || (this.isFirstUpdateOnIndicatorOrPoiLayerSelection == false && justChanged == false)) {
        
        this.initializeAllDiagrams();
        if(!this.template.name.includes("reachability")) {
          // in reachability template we have to update leaflet maps, too
          this.loadingData = false;
        }
      }
    }, 0, 100)
  }

  updateDiagrams() {

   
  }


  updateAreasForTimestampTemplates(newVal) {
    let pagesToInsertPerTimestamp:any[] = [];
    for(let area of newVal) {
      // get page to insert from untouched template
      let pageToInsert = fromJson(this.untouchedTemplateAsString).pages[ this.indexOfFirstAreaSpecificPage ];
      pageToInsert.area = area.name;
      pageToInsert.id = this.templatePageIdCounter++;
      pagesToInsertPerTimestamp.push(pageToInsert);

      pageToInsert = fromJson(this.untouchedTemplateAsString).pages[ this.indexOfFirstAreaSpecificPage + 1];
      pageToInsert.area = area.name;
      pageToInsert.id = this.templatePageIdCounter++;
      pagesToInsertPerTimestamp.push(pageToInsert);
    }

    // sort alphabetically by area name
    pagesToInsertPerTimestamp.sort( (a, b) => {
      let textA = a.area.toLowerCase();
      let textB = b.area.toLowerCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    })

    // insert area-specific pages for each timestamp
    // right now the area-specific part is missing and we have to figure out where it was.
    // get pages per timestamp -> insert new ones starting at indexOfFirstAreaSpecificPage -> replace per timestamp in this.template.pages
    if(this.selectedTimestamps.length) {
      let idx = 0
      for(let timestamp of this.selectedTimestamps) {

        // pagesForTimestamp is the template-section for that timestamp
        let pagesForTimestamp = this.template.pages.filter( page => {
          let dateEl = page.pageElements.find( el => {
            return el.type.includes("dataTimestamp-")
          });
          
          return dateEl.text === timestamp.name
        });
        // set index to first page of that timestamp
        // this is where we want to start replacing pages later
        idx = this.template.pages.indexOf( pagesForTimestamp[0] )
        // create a deep copy so we can assign new ids
        pagesForTimestamp = JSON.parse(JSON.stringify(pagesForTimestamp));
        
        // setup pages before inserting
        for(let pageToInsert of pagesToInsertPerTimestamp) {

          let titleEl = pageToInsert.pageElements.find( el => {
            return el.type.includes("indicatorTitle-")
          });
          titleEl.text = this.selectedIndicator.indicatorName + " [" + this.selectedIndicator.unit + "]";
          if(pageToInsert.area) {
            titleEl.text += ", " + pageToInsert.area
          }
          titleEl.isPlaceholder = false;

          let dateEl = pageToInsert.pageElements.find( el => {
            return el.type.includes("dataTimestamp-")
          });

          dateEl.text = timestamp.name;
          dateEl.isPlaceholder = false;

          // diagrams have to be inserted later because the div element does not yet exist
        }

        let numberOfPagesToReplace = pagesForTimestamp.length;
        // insert area-specific pages
        pagesToInsertPerTimestamp = JSON.parse(JSON.stringify(pagesToInsertPerTimestamp));
        for(let page of pagesToInsertPerTimestamp)
          page.id = this.templatePageIdCounter++;
        pagesForTimestamp.splice(this.indexOfFirstAreaSpecificPage, 0, ...pagesToInsertPerTimestamp)
        // assign new ids
        for(let page of pagesForTimestamp)
          page.id = this.templatePageIdCounter++;
        // then replace the whole timstamp-section with the new pages
        this.template.pages.splice(idx, numberOfPagesToReplace, ...pagesForTimestamp)
      }
    } else {
      pagesToInsertPerTimestamp = JSON.parse(JSON.stringify(pagesToInsertPerTimestamp));
      for(let page of pagesToInsertPerTimestamp)
        page.id = this.templatePageIdCounter++;
      // no timestamp selected, which makes inserting easier
      this.template.pages.splice(this.indexOfFirstAreaSpecificPage, 0, ...pagesToInsertPerTimestamp)
    }
  }

  updateAreasForTimeseriesTemplates(newVal) {
    let pagesToInsert:any[] = [];
    for(let area of newVal) {
      // get pages to insert from untouched template
      let pageToInsert = fromJson(this.untouchedTemplateAsString).pages[ this.indexOfFirstAreaSpecificPage ];
      pageToInsert.area = area.name;
      pageToInsert.id = this.templatePageIdCounter++;
      pagesToInsert.push(pageToInsert);

      pageToInsert = fromJson(this.untouchedTemplateAsString).pages[ this.indexOfFirstAreaSpecificPage + 1 ];
      pageToInsert.area = area.name;
      pageToInsert.id = this.templatePageIdCounter++;
      pagesToInsert.push(pageToInsert);
    }

    // sort alphabetically by area name
    pagesToInsert.sort( (a, b) => {
      let textA = a.area.toLowerCase();
      let textB = b.area.toLowerCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    // since we are dealing with a timeseries we don't have to care about inserting area-pages multiple times for different timestamps
    // we do it only once

    // setup pages before inserting
    for(let pageToInsert of pagesToInsert) {

      let titleEl = pageToInsert.pageElements.find( el => {
        return el.type.includes("indicatorTitle-")
      });
      titleEl.text = this.selectedIndicator.indicatorName + " [" + this.selectedIndicator.unit + "]";
      if(pageToInsert.area) {
        titleEl.text += ", " + pageToInsert.area
      }
      titleEl.isPlaceholder = false;

      let dateEl = pageToInsert.pageElements.find( el => {
        return el.type.includes("dataTimeseries-")
      });
      let includeInBetweenValues = false
      let dsValues:any = this.getFormattedDateSliderValues(includeInBetweenValues);
      dateEl.text = dsValues.from + " - " + dsValues.to;
      dateEl.isPlaceholder = false;

      // diagrams have to be inserted later because the div element does not yet exist
    }

    // insert area-specific pages
    pagesToInsert= JSON.parse(JSON.stringify(pagesToInsert));
    for(let page of pagesToInsert)
      page.id = this.templatePageIdCounter++;
    this.template.pages.splice(this.indexOfFirstAreaSpecificPage, 0, ...pagesToInsert)
  }

  updateAreasForReachabilityTemplates(newVal) {
    // we only have one timestamp here (the most recent one)
    let pagesToInsert:any[] = [];
    for(let area of newVal) {
      // get pages to insert from untouched template
      let pageToInsert = fromJson(this.untouchedTemplateAsString).pages[ this.indexOfFirstAreaSpecificPage ];
      pageToInsert.area = area.name;
      pageToInsert.id = this.templatePageIdCounter++;
      pagesToInsert.push(pageToInsert);

      pageToInsert = fromJson(this.untouchedTemplateAsString).pages[ this.indexOfFirstAreaSpecificPage + 1 ];
      pageToInsert.area = area.name;
      pageToInsert.id = this.templatePageIdCounter++;
      pagesToInsert.push(pageToInsert);
    }

    // sort alphabetically by area name
    pagesToInsert.sort( (a, b) => {
      let textA = a.area.toLowerCase();
      let textB = b.area.toLowerCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    // we select the most recent timestamp programmatically and don't allow user to change it, so this should be 1 here
    if(this.selectedTimestamps.length === 1) {

      // setup pages before inserting
      for(let pageToInsert of pagesToInsert) {

        let titleEl = pageToInsert.pageElements.find( el => {
          return el.type.includes("indicatorTitle-")
        });
        titleEl.text = "Entfernungen für " + this.selectedPoiLayer.datasetName;
        if(pageToInsert.area) {
          titleEl.text += ", " + pageToInsert.area
        }
        titleEl.isPlaceholder = false;

        let subtitleEl = pageToInsert.pageElements.find( el => {
          return el.type.includes("reachability-subtitle-")
        });
        subtitleEl.text = this.selectedTimestamps[0].name;
        if(this.isochrones)
          subtitleEl.text += ", " + this.isochronesTypeOfMovementMapping[this.typeOfMovement];
        if(this.selectedIndicator)
          subtitleEl.text += ", " + this.selectedIndicator.indicatorName;
        subtitleEl.isPlaceholder = false;

        // diagrams have to be inserted later because the div element does not yet exist
      }

      // create a deep copy so we can assign new ids
      pagesToInsert = JSON.parse(JSON.stringify(pagesToInsert));
      let numberOfPagesToReplace = this.template.pages.length-2 // basically everything until the end of the template (-2 because we start at second page)
      // insert area-specific pages
      for(let page of pagesToInsert)
        page.id = this.templatePageIdCounter++;

      this.template.pages.splice(this.indexOfFirstAreaSpecificPage, numberOfPagesToReplace, ...pagesToInsert)
    }
  }

  // internal array changes do not work with ng-change
  onSelectedTimestampsChanged(newVal, oldVal) {

    let mappedNewVal = newVal.map(e => e.name);
    let mappedOldVal = oldVal.map(e => e.name);

    if( typeof(this.template) === "undefined") return;
    this.loadingData = true;

    // get difference between old and new value (the timestamps selected / deselected)
    let difference = oldVal
      .filter(x => !mappedNewVal.includes(x))
      .concat(newVal.filter(x => !mappedOldVal.includes(x)));

    console.log(difference)
    
    // if selected
    if(newVal.length > oldVal.length) {
      // if this was the first timestamp
      if(newVal.length === 1) {
        // no need to insert pages, we just replace the placeholder timestamp
        for(let page of this.template.pages) {
          for(let pageElement of page.pageElements) {
            if(pageElement.type.includes("dataTimestamp-")) {
              pageElement.text = difference[0].name;
              pageElement.isPlaceholder = false;
            }
          }
        }
      }
      
      if(newVal.length > 1) {
        for(let timestampToInsert of difference) {

          // setup pages to insert first
          let pagesToInsert = fromJson(this.untouchedTemplateAsString).pages;
          for(let page of pagesToInsert) {
            page.id = this.templatePageIdCounter++;
          }
          // insert additional page for each selected area, replace the placeholder page
          let areaSpecificPages:any[] = [];
          // copy placeholder page for each selected area
          for(let area of this.selectedAreas) {
            
            let tempArea:any = area;
            let page = fromJson(this.untouchedTemplateAsString).pages[ this.indexOfFirstAreaSpecificPage ];
            page.area = tempArea.name;
            page.id = this.templatePageIdCounter++;
            areaSpecificPages.push(page);
          }

          // sort alphabetically by area name
          areaSpecificPages.sort( (a, b) => {
            let textA = a.area.toLowerCase();
            let textB = b.area.toLowerCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
          })

          pagesToInsert.splice(this.indexOfFirstAreaSpecificPage, 1, ...areaSpecificPages)

          // setup pages before inserting them
          for(let pageToInsert of pagesToInsert) {
            for(let pageElement of pageToInsert.pageElements) {

              if(pageElement.type.includes("indicatorTitle-")) {
                pageElement.text = this.selectedIndicator.indicatorName + " [" + this.selectedIndicator.unit + "]";
                if(pageToInsert.area) {
                  pageElement.text += ", " + pageToInsert.area
                }
                pageElement.isPlaceholder = false;
              }

              if(pageElement.type.includes("dataTimestamp-")) {
                pageElement.text = timestampToInsert.name;
                pageElement.isPlaceholder = false;
              }
            }
          }

          // determine position to insert pages (ascending timestamps) and insert them
          // iterate pages and check timestamp for each one
          let pagesInserted = false;
          for(let i=this.template.pages.length-1; i>=0; i--) { //iterate in reverse because we might extend the array while iterating
            let page = this.template.pages[i];

            for(let pElement of page.pageElements) {
              if(pElement.type.includes("dataTimestamp-")) {
                // compare timestamps
                let date1 = timestampToInsert.name;
                let date2 = pElement.text;
                let date1Updated = new Date(date1.replace(/-/g,'/'));  
                let date2Updated = new Date(date2.replace(/-/g,'/'));
                
                // if page timestamp is newer than difference timestamp
                if(date1Updated > date2Updated) {
                  // insert pages before pages with that timestamp
                  // i+1 because we want to insert after the page that has the older timestamp
                  this.template.pages.splice(i+1, 0, ...pagesToInsert);

                  pagesInserted = true;
                }
              }
            }

            if(pagesInserted) {
              break;
            }
          }
          
          if( !pagesInserted ) { // happens if the timestamp to insert is the oldest one
            this.template.pages.splice(0, 0, ...pagesToInsert); //prepend pages
          }
        }

        // in case all timestamps were added at once and none was present before we still have placeholder pages at this point
        // all other pages got prepended since we compared against an invalid date.
        // remove those pages
        for(let i=this.template.pages.length-1; i>=0; i--) { //iterate in reverse because we might extend the array while iterating
          let page = this.template.pages[i];
          for(let pElement of page.pageElements) {
            if(pElement.type.includes("dataTimestamp-")) {
              if(pElement.isPlaceholder) {
                this.template.pages.splice(i, 1);
              }
            }
          }
        }
      }
    }

    // if deselected
    if(newVal.length < oldVal.length) {
      // if it was the last one
      if(newVal.length === 0) {
        let cleanTemplate = fromJson(this.untouchedTemplateAsString);
        for(let page of cleanTemplate.pages) {
          page.id = this.templatePageIdCounter++;
        }
        this.template = cleanTemplate;
      } else {
        // remove all pages that belong to removed timestamps
        for(let timestampToRemove of difference) {
          this.template.pages = this.template.pages.filter( page => {
            let timestampEl = page.pageElements.find( el => {
              return el.type.includes("dataTimestamp-")
            })

            return timestampEl.text != timestampToRemove.name;
          });
        }
      }
    }

    // There is one more special case for the reachbility template, where we only have one timestamp set at all times,
    // but that one might change if we change the spatial unit
    if(newVal.length === oldVal.length && newVal.length === 1 && newVal[0].name != oldVal[0].name) {
      // simply update the timestamp on all pages
      for(let page of this.template.pages) {
        for(let pageElement of page.pageElements) {
          if(pageElement.type.includes("reachability-subtitle-")) {
            pageElement.text = newVal[0].name;
            if(this.isochrones)
              pageElement.text += ", " + this.isochronesTypeOfMovementMapping[this.typeOfMovement];
            if(this.selectedIndicator)
              pageElement.text += ", " + this.selectedIndicator.indicatorName;
          }
          break;
        }
      }
    }

    let updateDiagramsInterval = setInterval(() => {
      if(this.diagramsPrepared) {
        clearInterval(updateDiagramsInterval); // code below still executes once
      } else {
        return;
      }

      setTimeout(() => {
        if(this.isFirstUpdateOnIndicatorOrPoiLayerSelection) {
          // Skip the update but set variable to false, so diagrams get updated on time update
          // (relevant for indicator selection only)
          this.isFirstUpdateOnIndicatorOrPoiLayerSelection = false;
        } else {
          // indicator selection is optional in reachability template only
          if(this.selectedIndicator) {
            for(let timestamp of this.selectedTimestamps) {
              let classifyUsingWholeTimeseries = false;
              let isTimeseries = false;
              this.prepareDiagrams(this.selectedIndicator, this.selectedSpatialUnit, timestamp.name, classifyUsingWholeTimeseries, isTimeseries, undefined, undefined);
            }
          } else {
            this.reachabilityTemplateGeoMapOptions = this.prepareReachabilityEchartsMap();
          }

          this.initializeAllDiagrams();
          if(!this.template.name.includes("reachability")) {
            // in reachability template we have to update leaflet maps, too
            this.loadingData = false;
          }
        }
      });
    }, 0, 100);

  }
 
  reportingConfigureNewIndicatorShown() {
    this.initialize();
  }

  reportingConfigureNewPoiLayerShown() {
    this.initialize();
  }

  sortByindicatorName(a,b) {
    if(a.indicatorName>b.indicatorName)
      return 1;
    else  
      return -1;
  }

  sortByDatasetName(a,b) {
    if(a.datasetName>b.datasetName)
      return 1;
    else  
      return -1;
  }

  initializeDualLists() {

    this.dualListTimestampsOptions = {
      label: 'Zeitpunkte',
      boxItemsHeight: 'md',
      items: [],
      button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
      selectedItems: []
    };

    this.dualListSpatialUnitsOptions = {
      label: 'Raumebenen',
      boxItemsHeight: 'md',
      items: [],
      button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
      selectedItems: []
    };
  }

  queryMostRecentGeoresourceFeatures(georesource) {
    // Most likely this is only a temporary method
    // It checks the availablePeriodsOfValidity and takes the most recent one to query features.

    let timestamp = georesource.availablePeriodsOfValidity.at(-1).startDate;
    let timestampSplit = timestamp.split("-")
    let year = timestampSplit[0];
    let month = timestampSplit[1];
    let day = timestampSplit[2];

    let url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource()
    url += "/georesources/" + georesource.georesourceId + "/" + year + "/" + month + "/" + day
    // send request
   /*  return await $http({
      url: url,
      method: "GET"
    }).then(function successCallback(response) {
        return response.data;
      }, function errorCallback(error) {
        $scope.loadingData = false;
        kommonitorDataExchangeService.displayMapApplicationError(error);
        console.error(error);
    }); */
  }


/* 
  $scope.onSpatialUnitChanged = async function(selectedSpatialUnit) {
    $scope.loadingData = true;
    $("#reporting-spatialUnitChangeWarning").hide();
    $scope.timeseriesAdjustedOnSpatialUnitChange = false;
    await $scope.updateAreasInDualList()
    let validTimestamps = []
    // There might be different valid timestamps for the new spatial unit.
    if($scope.selectedIndicator) {
      validTimestamps = getValidTimestampsForSpatialUnit( selectedSpatialUnit );
    
      // Check if the currently selected timestamps are also available for the new spatial unit.
      // If one is not, deselect is and show an info to user
      let selectedTimestamps_old = [...$scope.selectedTimestamps];
      $scope.selectedTimestamps = $scope.selectedTimestamps.filter( el => {
        return validTimestamps.includes(el.name);
      });
      // if any timestamp was deselected show a warning alert
      // except for reachability template, it doesn't matter there
      if(selectedTimestamps_old.length > $scope.selectedTimestamps.length && !$scope.template.name.includes("-reachability")) {
        $("#reporting-spatialUnitChangeWarning").show();
      }
    } else {
      // without selected indicator we have to fall back to the last update of the new spatial unit
      let mostRecentTimestampName = $scope.selectedSpatialUnit.metadata.lastUpdate;
      validTimestamps.push(mostRecentTimestampName)
    }
    
    if($scope.template.name.includes("timeseries")) {
      // Similar procedure as with timestamps
      let oldTimeseries = $scope.getFormattedDateSliderValues(true);
      
      let from = new Date($scope.dateSlider.result.from_value);
      let to = new Date($scope.dateSlider.result.to_value);
      let filteredTimeseries = validTimestamps.filter( el => {
        let date = new Date(el);
        date.setHours(0); // remove time-offset...TODO is there a better way?
        return from <= date && date <= to;
      });

      let isEqualTimeseries = (oldTimeseries.dates.length == filteredTimeseries.length) && oldTimeseries.dates.every(function(element, index) {
        return element === filteredTimeseries[index];
      });
      
      if( !isEqualTimeseries) {
        // timeseries changed
        $("#reporting-spatialUnitChangeWarning").show();
        // try to set slider to previously selected timestamps
        if(validTimestamps.includes(oldTimeseries.from) && validTimestamps.includes(oldTimeseries.to)) {
          $scope.dateSlider = $scope.initializeDateRangeSlider( validTimestamps, filteredTimeseries[0], filteredTimeseries.at(-1));	
        } else {
          $scope.dateSlider = $scope.initializeDateRangeSlider( validTimestamps );	
          $scope.timeseriesAdjustedOnSpatialUnitChange = true; // show additional text in warning alert
        }
      } else {
        // the selected part of the timeseries has the same dates so we don't have to show a warning
        // but the timeseries could still include older or newer dates
        $scope.dateSlider = $scope.initializeDateRangeSlider( validTimestamps, filteredTimeseries[0], filteredTimeseries.at(-1));
      }
    }
    
    // prepare arrays for updateDualList
    validTimestamps = validTimestamps.map( el => {
      return {
        properties: {
          NAME: el
        }
      }
    });
    let timestampsToSelect = $scope.selectedTimestamps.map( el => {
      return {
        properties: {
          NAME: el.name
        }
      }
    });
    
    $scope.updateDualList($scope.dualListTimestampsOptions, validTimestamps, timestampsToSelect);

    
    
    // fire $watch('selectedAreas') function manually to remove pages
    $scope.selectedAreas = [];
    $scope.onSelectedAreasChanged( $scope.selectedAreas , undefined)
    // updateAreasInDualList does not trigger diagram updates
    // we have the wrong geometries set at this point, causing area selection to fail.
    // echarts requires properties.name to be present, create it from properties.NAME unless it exists
    let features;
    if($scope.template.name.includes("reachability")) {
      if($scope.selectedIndicator) {
        features = $scope.availableFeaturesBySpatialUnit[ $scope.selectedSpatialUnit.spatialUnitName ];
      } else {
        features = $scope.availableFeaturesBySpatialUnit[ $scope.selectedSpatialUnit.spatialUnitLevel ];
      }
      features = $scope.createLowerCaseNameProperty(features);
      $scope.geoJsonForReachability = { features: features }
    } else {
      features = $scope.availableFeaturesBySpatialUnit[ $scope.selectedSpatialUnit.spatialUnitName ];
      features = $scope.createLowerCaseNameProperty(features);
      let geoJSON = { features: features }
      $scope.selectedIndicator.geoJSON = geoJSON;
    }
    

    // no need to check if diagrams are prepared here since we have to prepare them again anyway
    $timeout(async function() {
      // prepare diagrams for all selected timestamps with all features
      // Preparing all diagrams is not possible without an indicator, which might happen in the reachability template
      // User selects a poi layer first and we set the most recent timestamp programmatically, triggering this function without selected Indicator
      // We only need an echarts geoMap to show isochrones, POIs and spatial unit borders
      if($scope.selectedIndicator) {
        if($scope.template.name.includes("reachability")) {
          $scope.reachabilityTemplateGeoMapOptions = $scope.prepareReachabilityEchartsMap();
        } else if ($scope.template.name.includes("timeseries")) {
          let values = $scope.getFormattedDateSliderValues(true);
          let classifyUsingWholeTimeseries = false;
          let isTimeseries = true;
          $scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, values.to, classifyUsingWholeTimeseries, isTimeseries, values.from, values.to);
          // prepare diagrams again for most recent timestamp of slider and for whole timeseries (changes).
          classifyUsingWholeTimeseries = true;
          isTimeseries = false;
          $scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, values.to, classifyUsingWholeTimeseries, isTimeseries, undefined, undefined);
        } else {
          for(let timestamp of $scope.selectedTimestamps) {
            let classifyUsingWholeTimeseries = false;
            let isTimeseries = false;
            $scope.prepareDiagrams($scope.selectedIndicator, selectedSpatialUnit, timestamp.name, classifyUsingWholeTimeseries, isTimeseries, undefined, undefined);
          }	
        }
      } else {
        $scope.reachabilityTemplateGeoMapOptions = $scope.prepareReachabilityEchartsMap();
      }

      await $scope.initializeAllDiagrams();
      if(!$scope.template.name.includes("reachability")) {
        // in reachability template we have to update leaflet maps, too
        $scope.loadingData = false;
      }
    });
  }
 */

  updateAreasInDualList() {
    // this happens for the reachability template on poi selection
    if(typeof(this.selectedIndicator) === "undefined") {
      let spatialUnit = this.selectedSpatialUnit ?
        this.selectedSpatialUnit :
        this.selectedIndicator!.applicableSpatialUnits[0]
      // query spatial unit features using the most recent date
      let data:any = this.queryFeatures(undefined, this.selectedSpatialUnit);
      this.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitLevel] = data.features
      let allAreas = this.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitLevel]
      this.updateAreasDualList(allAreas, undefined) // don't select any areas
    } else {
      let indicator = this.selectedIndicator;
    
      let spatialUnit = this.selectedSpatialUnit ?
        this.selectedSpatialUnit :
        this.selectedIndicator.applicableSpatialUnits[0]
      let indicatorId = indicator.indicatorId;

      // on indicator change
      if(this.availableFeaturesBySpatialUnit.indicatorId != indicator.indicatorId) {
        // clear all cached features
        this.availableFeaturesBySpatialUnit = {};
        this.availableFeaturesBySpatialUnit.indicatorId = indicatorId;

      }

      this.queryFeatures(indicatorId, spatialUnit).subscribe({
        next: (response:any) => {
          // save response to scope to avoid further requests
          this.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName] = response.features

          let allAreas = this.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName];
          this.updateAreasDualList(allAreas, undefined) // don't select any areas
        }
      })
    }
  }

  queryFeatures(indicatorId, spatialUnit) {
    // build request
    // query different endpoints depending on if we have an indicator or not
    let url;
    if(!indicatorId) {
      let date = spatialUnit.metadata.lastUpdate.split("-")
      let year = date[0]
      let month = date[1]
      let day = date[2]
      url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
        "/spatial-units/" + spatialUnit.spatialUnitId + "/" + year + "/" + month + "/" + day; 
    } else {
      url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
        "/indicators/" + indicatorId + "/" + spatialUnit.spatialUnitId;
    }
    // send request
    return this.httpClient.get(url);
  }

  onUpdatedManualSelectedItems(event:any) {
    this.onSelectedAreasChanged(event)
  }

  onUpdatedManualSelectedTimestamps(event:any) {
    this.onSelectedTimestampsChanged(event,[]);
  }

  updateTimestampsDualList(data, selectedItems) {

    this.dualListTimestampsOptions.selectedItems = [];

    let dualListInput = data.map( (el,i) => {
      return {"name": el.properties.NAME, 'id':i} // we need this as an object for kommonitorDataExchangeService.createDualListInputArray
    });
    dualListInput = this.dataExchangeService.createDualListInputArray(dualListInput, "name",'id');
    this.dualListTimestampsOptions.items = dualListInput;

    // if there are items to select
    if(selectedItems && selectedItems.length > 0) {
      if(data.length === selectedItems.length) {
        let dualListSelected = selectedItems.map( (el, i) => {
          return {"name": el.properties.NAME, 'id': i} 
        });
        this.dualListTimestampsOptions.selectedItems = this.dataExchangeService.createDualListInputArray(dualListSelected, "name",'id');
      } else {

        let items:any[] = [];
        let index:number = 0;
        for(let item of selectedItems) {
          if(item.hasOwnProperty("properties")) {
            if(item.properties.hasOwnProperty("NAME")) {
              items.push({'name':item.properties.NAME, 'id':index});
              index++;
            }
          }
        }
        this.dualListTimestampsOptions.selectedItems = this.dataExchangeService.createDualListInputArray(items, "name",'id');
      }
    }

    this.reloadTimestampsDualList = !this.reloadTimestampsDualList;
  }

  updateAreasDualList(data,selectedItems) {
    this.dualListAreasOptions.selectedItems = [];

    let dualListInput = data.map( (el, i) => {
      return {"name": el.properties.NAME, 'id': i} // we need this as an object for kommonitorDataExchangeService.createDualListInputArray
    });
    dualListInput = this.dataExchangeService.createDualListInputArray(dualListInput, "name",'id');
    this.dualListAreasOptions.items = dualListInput;

    // if there are items to select
    if(selectedItems && selectedItems.length > 0) {
      if(data.length === selectedItems.length) {
        let dualListSelected = selectedItems.map( (el, i) => {
          return {"name": el.properties.NAME, 'id': i} 
        });
        this.dualListAreasOptions.selectedItems = this.dataExchangeService.createDualListInputArray(dualListSelected, "name",'id');;
      } else {

        let items:any[] = [];
        let index:number = 0;
        for(let item of selectedItems) {
          if(item.hasOwnProperty("properties")) {
            if(item.properties.hasOwnProperty("NAME")) {
              items.push({'name':item.properties.NAME, 'id':index});
              index++;
            }
          }
        }
        this.dualListAreasOptions.selectedItems = this.dataExchangeService.createDualListInputArray(items, "name",'id');
      }
    }

    this.reloadAreasDualList = !this.reloadAreasDualList;
  }

  updateDualList(options, data, selectedItems) {
    options.selectedItems = [];

    let dualListInput = data.map( el => {
      return {"name": el.properties.NAME} // we need this as an object for kommonitorDataExchangeService.createDualListInputArray
    });
    dualListInput = this.dataExchangeService.createDualListInputArray(dualListInput, "name",0);
    options.items = dualListInput;

    // $timeout is needed because we want to click on an element to select it.
    // therefore we have to wait until the dual list is updated and the dom node exists
    setTimeout( function() {
      // if there are items to select
      if(selectedItems && selectedItems.length > 0) {
        // if all items should be selected we can use the "select all" button for better performance
        if(data.length === selectedItems.length) {
          /* let dualListBtnElement:any = undefined;
          switch(options.label) {
            case "Zeitpunkte":
              dualListBtnElement = document.querySelectorAll("#reporting-indicator-add-timestamps-dual-list .duallistButton")[0];
              break;
            case "Bereiche":
              dualListBtnElement = document.querySelectorAll("#reporting-indicator-add-areas-dual-list .duallistButton")[0];
              break;
            case "Raumebenen":
              dualListBtnElement = document.querySelectorAll("#reporting-indicator-add-spatialUnits-dual-list .duallistButton")[0];
              break;
          }
          dualListBtnElement.click(); */
        } else {
          for(let item of selectedItems) {
            if(item.hasOwnProperty("properties")) {
              if(item.properties.hasOwnProperty("NAME")) {
                /* let name = item.properties.NAME
                // remove item to select from left side and add to right side
                // we can't filter programmatically here because the changes won't get applied to scope variables
                // not even with $scope.$digest in a $timeout
                // instead we click on the elements
                // get dom element by name
                let arr = [];
                switch(options.label) {
                  case "Zeitpunkte":
                    arr = Array.from(document.querySelectorAll("#reporting-indicator-add-timestamps-dual-list a"));
                    break;
                  case "Bereiche":
                    arr = Array.from(document.querySelectorAll("#reporting-indicator-add-areas-dual-list a"));
                    break;
                  case "Raumebenen":
                    arr = Array.from(document.querySelectorAll("#reporting-indicator-add-spatialUnits-dual-list a"));
                    break;
                }
                let el:any = arr.find((el:any) => {
                  return el.textContent.includes(name)
                });
                el.click(); */
              }
            }
          }
        }
      }
    }, 500);
  }


  // availableFeaturesBySpatialUnit has to be populated before this method is called.
  // Also it is only called in situations where an indicator is selected.
  getValidTimestampsForSpatialUnit(spatialUnit) {

    let validTimestamps:any = []; // result
    // Iterate all features and add all properties that start with "DATE_" to 'validTimestamps'
    let features = this.availableFeaturesBySpatialUnit[ spatialUnit.spatialUnitName ];
    if(!features) {
      let error = new Error("Tried to get valid timestamps but no features were cached.")
      this.dataExchangeService.displayMapApplicationError(error.message)
    }
    for(let feature of features) {
      let props = Object.keys(feature.properties)
      props = props.filter( prop => {
        return prop.startsWith("DATE_");
      })

      for(let prop of props) {
        let timestamp = prop.replace("DATE_", "")
        if( !validTimestamps.includes(timestamp) ) {
          validTimestamps.push(timestamp)
        }
      }
    }
    return validTimestamps;
  }

  addIsochronesBboxProperties() {
    // Calculates and adds a bbox property for each feature and for overall layer
    // These do not exist if the type of movement is "buffer" ( = isochrones not generated by ors)

    let overallBbox:any[] = [];
    let features = this.isochrones.features;
    for(var i=0; i<this.isochrones.features.length; i++) {
      
      // calculate bbox for feature
      if(!features[i].bbox || !features[i].bbox.length) {
        features[i].properties.bbox = turf.bbox(features[i]);
      }

      // check if we have to adjust overall bbox
      if(overallBbox.length === 0) {
        overallBbox.push(...features[i].properties.bbox)
      } else {
        let bbox = features[i].properties.bbox;
        overallBbox[0] = (bbox[0] < overallBbox[0]) ? bbox[0] : overallBbox[0];
        overallBbox[1] = (bbox[1] < overallBbox[1]) ? bbox[1] : overallBbox[1];
        overallBbox[2] = (bbox[2] > overallBbox[2]) ? bbox[2] : overallBbox[2];
        overallBbox[3] = (bbox[3] > overallBbox[3]) ? bbox[3] : overallBbox[3];
      }
    }

    this.isochrones.bbox = overallBbox;
  }

  addIsochronesCenterLocationProperty() {
    this.isochrones.centerLocations = [];
    // We probably have multiple isochrones with the same center.
    // Keep track of the value property and only calculate center coords once per isochrones group.
    let firstIsochroneRangeValue = this.isochrones.features[0].properties.value;
    for(let feature of this.isochrones.features) {
      if(feature.properties.value === firstIsochroneRangeValue) {
        // bbox format: [lower left lon, lower left lat, upper right lon, upper right lat]
        if(! feature.properties.bbox){
          let bbox = turf.bbox(feature); // calculate bbox for each feature
          feature.properties.bbox = bbox;
        }
        let bbox = feature.properties.bbox;
        let centerLon = bbox[0] + ((bbox[2] - bbox[0]) / 2);
        let centerLat = bbox[1] + ((bbox[3] - bbox[1]) / 2);
        this.isochrones.centerLocations.push([centerLon, centerLat])
      }
      
    }
  }
  
  reportingIsochronesCalculationStarted() {
    this.loadingData = true;
  }

  reportingIsochronesCalculationFinished([isochrones]) {
    this.isochrones = isochrones;
      // this.typeOfMovement = this.isochrones.metadata.query.profile;
    this.typeOfMovement = this.reachabilityHelperService.pipedData.settings.transitMode;

    if(this.typeOfMovement === "buffer") {
      this.isochronesRangeType = "distance";
      this.isochronesRangeUnits = "m";
    } else {
      // this.isochronesRangeType = this.isochrones.metadata.query.range_type;
      // this.isochronesRangeUnits = this.isochrones.metadata.query.units;
      this.isochronesRangeType = this.reachabilityHelperService.pipedData.settings.focus;
      this.isochronesRangeUnits = this.isochronesRangeType == "distance" ? "m" : 's';
    }
    
    // for type buffer the bbox field doesn't exist, so we have to create it.
    this.addIsochronesBboxProperties()
    if(!this.isochrones.centerLocations)
      this.addIsochronesCenterLocationProperty()

    // Add a new property that is used as a unique id and can be used by echarts
    // For buffer there is no group_index, so we use the ID
    if(this.typeOfMovement === "buffer") {
      for(let feature of this.isochrones.features) {
        feature.properties.echartsId = feature.properties.ID + "-" + feature.properties.value
      }
    } else {
      for(let feature of this.isochrones.features) {
        feature.properties.echartsId = feature.properties.group_index + "-" + feature.properties.value
      }
    }

    this.isochronesSeriesData = this.convertIsochronesToSeriesData(this.isochrones);

    this.showResetIsochronesBtn =true;

    // TODO performance could be improved if we just iterate pages and update echarts
    this.initializeAllDiagrams();
    this.loadingData = false;
  }

  resetIsochrones() {
    this.isochrones = undefined;
    this.typeOfMovement = undefined;
    this.isochronesRangeType = undefined,
    this.isochronesRangeUnits = undefined,
    this.isochronesSeriesData = undefined
    // TODO performance could be improved if we just iterate pages and update echarts
    if(this.diagramsPrepared) {
      this.initializeAllDiagrams();
    }
    this.showResetIsochronesBtn = false;
  }
  
/* 
  $('#reporting-modal').on('show.bs.modal', function (e) {
    $scope.$broadcast("switchReportingMode", true);
  })
  $('#reporting-modal').on('hidden.bs.modal', function (e) {
    $scope.$broadcast("switchReportingMode", false);
  }) */

 //async
  onPoiLayerSelected(poiLayer) {

    try {
      this.absoluteLabelPositions = [];
      this.diagramsPrepared = false;
      this.isFirstUpdateOnIndicatorOrPoiLayerSelection = true;
      this.selectedPoiLayer = poiLayer;
      this.selectedPoiLayer!.geoJSON = this.queryMostRecentGeoresourceFeatures(this.selectedPoiLayer);
      // reachability config requires this new property
      this.selectedPoiLayer.geoJSON_reachability = this.selectedPoiLayer.geoJSON;
    
      this.broadcastSerice.broadcast("reportingPoiLayerSelected", [this.selectedPoiLayer]);

      // get a new template (in case another poi layer was selected previously)
      this.template = this.getCleanTemplate();
      
      // Indicator might not be selected at this point
      // We get information about all available spatial units (instead of applicable ones)
      // Then we select the highest one by default
      let spatialUnits:any = this.dataExchangeService.pipedData.availableSpatialUnits;
      this.allSpatialUnitsForReachability = spatialUnits; // needed for spatial unit selection in 3rd tab
      let highestSpatialUnit = spatialUnits.filter( unit => {
        return unit.nextUpperHierarchyLevel === null;
      });
      if( !this.selectedSpatialUnit) {
        this.selectedSpatialUnit = this.dataExchangeService.pipedData.availableSpatialUnits[0];
      }
      let mostRecentTimestampName
      if(this.selectedSpatialUnit.metadata) {
        mostRecentTimestampName = this.selectedSpatialUnit.metadata.lastUpdate;
      } else {
        // Happens when poiLayer is changed after an indicator was selected
        // ( = spatial unit is the one from the indicator endpoint, not the spatial unit endpoint)
        mostRecentTimestampName = this.allSpatialUnitsForReachability.filter( spatialUnit => {
          return spatialUnit.spatialUnitId === this.selectedSpatialUnit.spatialUnitId
        })[0].metadata.lastUpdate
      }
      this.selectedTimestamps = [{
        category: mostRecentTimestampName,
        name: mostRecentTimestampName
      }];
      
      this.updateAreasInDualList(); // this populates this.availableFeaturesBySpatialUnit

      
      // update information in preview
      for(let page of this.template.pages) {
        for(let el of page.pageElements) {
          if(el.type.includes("indicatorTitle-")) {
            el.text = "Entfernungen für " + this.selectedPoiLayer.datasetName;
            el.isPlaceholder = false;
            // no area-specific pages in template since diagrams are not prepared yet
            // and area/timestamp/timeseries changes are done after that
          }

          if(el.type.includes("reachability-subtitle-")) {
            el.text = this.selectedTimestamps[0].name;
            if(this.isochrones)
              el.text += ", " + this.isochronesTypeOfMovementMapping[this.typeOfMovement];
            if(this.selectedIndicator)
              el.text += ", " + this.selectedIndicator.indicatorName;
            el.isPlaceholder = false
          }
        }
      }

      // get all features of largest spatial unit
      let features;
      if(this.selectedIndicator) {
        features = this.availableFeaturesBySpatialUnit[ this.selectedSpatialUnit.spatialUnitName ]
      } else {
        features = this.availableFeaturesBySpatialUnit[ this.selectedSpatialUnit.spatialUnitLevel ]
      }
      features = this.createLowerCaseNameProperty(features);
      // we might have no indicator so we store the geometries directly on the scope
      this.geoJsonForReachability = {
        features: features
      }

      // Preparing all diagrams is not possible without an indicator
      // We only need an echarts geoMap to show isochrones, POIs and spatial unit borders
      this.reachabilityTemplateGeoMapOptions = this.prepareReachabilityEchartsMap();

      // select all areas by default
      let allAreas;
      if(this.selectedSpatialUnit.spatialUnitName) {
        allAreas = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName];
      } else {
        allAreas = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitLevel];
      }
        this.updateAreasDualList( allAreas, allAreas);

      let allTabs:any = document.querySelectorAll("#reporting-add-indicator-tab-list li")
      for(let tab of allTabs) {
        this.enableTab(tab);
      }
    } catch (error) {
      console.error(error);
      this.dataExchangeService.displayMapApplicationError(error);
      this.loadingData = false;
    }

    
  }

  calculateOverallBoundingBoxFromGeoJSON(features) {
    let result:any[] = [];
    for(var i=0; i<features.length; i++) {
       // check if we have to modify our overall bbox (result)
       if(result.length === 0) { // for first feature
      result.push(...features[i].properties.bbox);
      continue;
      } else {
      // all other features
      let bbox = features[i].properties.bbox;
      result[0] = (bbox[0] < result[0]) ? bbox[0] : result[0];
      result[1] = (bbox[1] < result[1]) ? bbox[1] : result[1];
      result[2] = (bbox[2] > result[2]) ? bbox[2] : result[2];
      result[3] = (bbox[3] > result[3]) ? bbox[3] : result[3];
      }
    }
    return result;
  }



  setMostRecentIndicatorDataToReachabilityMap(seriesOptions) {
    let mostRecentTimestampName = this.selectedIndicator.applicableDates.at(-1);
    let features;
    if(this.selectedSpatialUnit.spatialUnitName) {
      features = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName]
    } else {
      features = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitLevel]
    }
    let newSeriesData = features.map( feature => {
      let name = feature.properties.NAME
      let value = feature.properties["DATE_" + mostRecentTimestampName]
      value = Math.round(value * 100) / 100;
      return {
        name: name,
        value: value
      }
    });
    seriesOptions.data = newSeriesData;
    return seriesOptions;
  }
  
  resetOptionalIndicator() {
    
    if(!this.selectedIndicator) {
      return;
    }

    this.selectedIndicator = undefined;
    // since we don't have an indicator selected anymore we reset the spatial unit
    this.selectedSpatialUnit = this.allSpatialUnitsForReachability.filter( spatialUnit => {
      return spatialUnit.spatialUnitLevel === this.selectedSpatialUnit.spatialUnitName;
    })[0];
    
    
    // let filter = this.selectedIndicator.applicableSpatialUnits.filter( spatialUnit => {
    // 	return spatialUnit.spatialUnitName === this.selectedSpatialUnit.spatialUnitLevel;
    // })
    // this.selectedSpatialUnit = filter[0];

    for(let page of this.template.pages) {
      for(let pageElement of page.pageElements) {
        if(pageElement.type === "map") {
          let domNode:any = document.querySelector("#reporting-addIndicator-page-" + this.template.pages.indexOf(page) + "-map")
          let map:any = echarts.getInstanceByDom(domNode)
          let options = map.getOption();
          // remove indicator data
          options.series[0].data = [];
          options.series[0].label.formatter = '{b}';
          map.setOption(options, {
            replaceMerge: ['series']
          });
        }

        if(pageElement.type.includes("reachability-subtitle-")) {
          pageElement.text = this.selectedTimestamps[0].name;
          if(this.isochrones) {
            pageElement.text += ", " + this.isochronesTypeOfMovementMapping[this.typeOfMovement];
          }
          
          pageElement.isPlaceholder = false
        }
      }
    }
  }

  handleIndicatorSelectForReachability(indicator) {
    this.selectedIndicator = indicator;
    let indicatorId = this.selectedIndicator.indicatorId;
    let featureCollection:any = this.queryFeatures(indicatorId, this.selectedSpatialUnit);
    if(!this.selectedSpatialUnit.spatialUnitName) {
      // set the applicable spatial unit from the indicator as selected spatial unit
      let filter = this.selectedIndicator.applicableSpatialUnits.filter( spatialUnit => {
        return spatialUnit.spatialUnitName === this.selectedSpatialUnit.spatialUnitLevel;
      })
      if(filter && filter.length) {
        this.selectedSpatialUnit = filter[0];
      }
    }

    this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName] = featureCollection.features;
    this.selectedIndicator.geoJSON = featureCollection;
    this.selectedIndicator.geoJSON.features = this.createLowerCaseNameProperty(this.selectedIndicator.geoJSON.features);
    for(let feature of this.selectedIndicator.geoJSON.features) {
      let bbox = turf.bbox(feature); // calculate bbox for each feature
      feature.properties.bbox = bbox;
    }
    
    for(let page of this.template.pages) {
      for(let pageElement of page.pageElements) {
        if(pageElement.type === "map") {
          let domNode:any = document.querySelector("#reporting-addIndicator-page-" + this.template.pages.indexOf(page) + "-map")
          let map:any = echarts.getInstanceByDom(domNode)
          let options:any = map.getOption();
          let seriesOptions = this.setMostRecentIndicatorDataToReachabilityMap(options.series[0])
          options.series[0] = seriesOptions;
          options.series[0].label.formatter = '{b}\n{c}';
          map.setOption(options, {
            replaceMerge: ['series']
          });
        }

        if(pageElement.type.includes("reachability-subtitle-")) {
          pageElement.text = this.selectedTimestamps[0].name;
          if(this.isochrones) {
            pageElement.text += ", " + this.isochronesTypeOfMovementMapping[this.typeOfMovement];
          }
          pageElement.text += ", " + indicator.indicatorName;
          pageElement.isPlaceholder = false;
        }
      }
    }
    this.loadingData = false;
  }

  //async
  onIndicatorSelected(indicator) {

    try {
      this.loadingData = true;
      if(this.template.name.includes("reachability")) {
        this.handleIndicatorSelectForReachability(indicator);
        return;
      }

      this.selectedIndicator = undefined;
      this.selectedTimestamps = [];
      this.selectedAreas = [];
      this.selectedSpatialUnit = undefined;
      this.availableFeaturesBySpatialUnit = {};
      this.absoluteLabelPositions = [];
      this.echartsOptions = {
        map: {},
        bar: {},
        line: {}
      }
      this.diagramsPrepared = false;
      // set indicator manually.
      // if we use ng-model it gets converted to string instead of an object
      this.selectedIndicator = indicator;

      // get a new template (in case another indicator was selected previously)
      this.template = this.getCleanTemplate();
      
      // set spatial unit to highest available one
      let spatialUnits = this.dataExchangeService.pipedData.availableSpatialUnits;
      // go from highest to lowest spatial unit and check if it is available.
      for(let spatialUnit of spatialUnits) {
        let applicableSpatialUnitsFiltered = this.selectedIndicator.applicableSpatialUnits.filter( (unit) => {
          return unit.spatialUnitId === spatialUnit.spatialUnitId;
        })

        if(applicableSpatialUnitsFiltered.length === 1) {
          this.selectedSpatialUnit = applicableSpatialUnitsFiltered[0];
          break;
        }
      }

      if(!this.selectedSpatialUnit) {
        throw new Error("No applicable spatial unit found.")
      }

      this.updateAreasInDualList(); // this populates this.availableFeaturesBySpatialUnit

      setTimeout(() => {
        // select most recent timestamp that is valid for the largest spatial unit
        let dates = this.selectedIndicator.applicableDates;
        let timestampsForSelectedSpatialUnit = this.getValidTimestampsForSpatialUnit( this.selectedSpatialUnit);
        timestampsForSelectedSpatialUnit.sort();
        
        let availableTimestamps = dates
          .filter( name => { // filter dates to only show the ones valid for selected spatial unit 
            return timestampsForSelectedSpatialUnit.includes( name )
          }).map( name => { // then convert all timestamps to required format ("feature")
            return { "properties": { "NAME": name } }
        })

        let mostRecentTimestampName = timestampsForSelectedSpatialUnit.at(-1);
        let mostRecentTimestamp = availableTimestamps.filter( el => {
          return el.properties.NAME === mostRecentTimestampName;
        })
        
        if(this.template.name.includes("timeseries")) {
          this.dateSlider = this.initializeDateRangeSlider( timestampsForSelectedSpatialUnit,0,1 );
        }
        // update information in preview
        for(let page of this.template.pages) {
          for(let el of page.pageElements) {
            if(el.type.includes("indicatorTitle-")) {
              el.text = indicator.indicatorName + " [" + indicator.unit + "]";
              el.isPlaceholder = false;
              // no area-specific pages in template since diagrams are not prepared yet
              // and area/timestamp/timeseries changes are done after that
            }

            if(el.type.includes("dataTimestamp-")) {
              el.text = mostRecentTimestampName;
              el.isPlaceholder = false
            }

            if(el.type.includes("dataTimeseries-")) {
              let dsValues:any = this.getFormattedDateSliderValues(1)
              el.text = dsValues.from + " - " + dsValues.to
              el.isPlaceholder = false
            }
          }
        }

        // get all features of largest spatial unit
        let features = this.availableFeaturesBySpatialUnit[ this.selectedSpatialUnit.spatialUnitName ]
        features = this.createLowerCaseNameProperty(features);
        let geoJson = {
          features: features
        }

        // add new prop to indicator metadata, because it is expected that way by kommonitorVisualStyleHelperService
        // used in prepareDiagrams
        this.selectedIndicator.geoJSON = geoJson;
        let classifyUsingWholeTimeseries = false;
        let isTimeseries = false;
        this.prepareDiagrams(this.selectedIndicator, this.selectedSpatialUnit, mostRecentTimestampName, classifyUsingWholeTimeseries, isTimeseries, undefined, undefined);
        // We have to update time and areas. Usually both of these would result in a diagram update.
        // We want to skip the first one and only update diagrams once everything is ready for better performance.
        this.isFirstUpdateOnIndicatorOrPoiLayerSelection = true;
        if(this.template.name.includes("timeseries")) {
          // This is an exception from the process above
          this.isFirstUpdateOnIndicatorOrPoiLayerSelection = false;
          classifyUsingWholeTimeseries = false;
          let values:any = this.getFormattedDateSliderValues(1);
          let isTimeseries = true;
          this.prepareDiagrams(this.selectedIndicator, this.selectedSpatialUnit, mostRecentTimestampName, classifyUsingWholeTimeseries, isTimeseries, values.from, values.to);
        } else {
          //this.updateDualList(this.dualListTimestampsOptions, availableTimestamps, mostRecentTimestamp)
          this.updateTimestampsDualList(availableTimestamps, mostRecentTimestamp);
        }

        // select all areas by default
        let allAreas = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName];
        this.updateAreasDualList(allAreas, allAreas);

        let allTabs:any = document.querySelectorAll("#reporting-add-indicator-tab-list li")
        for(let tab of allTabs) {
          this.enableTab(tab);
        }

      
        // call both onChange functions, as the selected Items have not been processed yet - only been selected on the dual lists
        let areasListInput = allAreas.map( (el, i) => {
          return {"name": el.properties.NAME, 'id': i} // we need this as an object for kommonitorDataExchangeService.createDualListInputArray
        });
        areasListInput = this.dataExchangeService.createDualListInputArray(areasListInput, "name",'id');
        this.onSelectedAreasChanged(areasListInput);

        let timestampsListInput = availableTimestamps.map( (el, i) => {
          return {"name": el.properties.NAME, 'id': i} // we need this as an object for kommonitorDataExchangeService.createDualListInputArray
        });
        timestampsListInput = this.dataExchangeService.createDualListInputArray(timestampsListInput, "name",'id');

        let timestampsListSelected = mostRecentTimestamp.map( (el, i) => {
          return {"name": el.properties.NAME, 'id': i} // we need this as an object for kommonitorDataExchangeService.createDualListInputArray
        });
        timestampsListSelected = this.dataExchangeService.createDualListInputArray(timestampsListSelected, "name",'id');
        this.onSelectedTimestampsChanged(timestampsListInput, timestampsListSelected);

      },1000);
    } catch (error) {
      console.error(error);
      this.dataExchangeService.displayMapApplicationError(error);
      this.loadingData = false;
    }
  }

  getCleanTemplate() {
    let result = fromJson(this.untouchedTemplateAsString);
    for(let page of result.pages) {
      page.id = this.templatePageIdCounter++;
    }
    return result;
  }

  onBackToOverviewClicked = function() {
   /*  this.reset();
    this.$emit('reportingBackToOverviewClicked')
 */
  }

/* 
  $scope.reset = function() {
    $scope.template = undefined;
    $scope.untouchedTemplateAsString = "";
    $scope.indicatorNameFilter = "";
    $scope.poiNameFilter = "";
    $scope.selectedIndicator = undefined;
    $scope.availableFeaturesBySpatialUnit = {};
    $scope.selectedSpatialUnit = undefined;
    $scope.selectedAreas = [];
    $scope.selectedTimestamps = [];
    $scope.indexOfFirstAreaSpecificPage = undefined;
    $scope.echartsOptions = {
      map: {},
      bar: {},
      line: {},
    }
    $scope.loadingData = false;
    $scope.templatePageIdCounter = 1;
    $scope.dateSlider = undefined;
    $scope.echartsRegisteredMapNames = [];

    for(let i=2;i<7;i++) {
      let tab = document.querySelector("#reporting-add-indicator-tab" + i);
      $scope.disableTab(tab);
    }
  }

  $scope.onAddBtnClicked = function() {
    // for each page: add echarts configuration objects to the template
    for(let [idx, page] of $scope.template.pages.entries()) {
      let pageDom = document.querySelector("#reporting-addIndicator-page-" + idx);
      
      for(let pageElement of page.pageElements) {

        let pElementDom;
        if(pageElement.type === "linechart") {
          let arr = pageDom.querySelectorAll(".type-linechart");
          if(pageElement.showPercentageChangeToPrevTimestamp) {
            pElementDom = arr[1];
          } else {
            pElementDom = arr[0];
          }
        } else {
          pElementDom = pageDom.querySelector("#reporting-addIndicator-page-" + idx + "-" + pageElement.type)
        }

        if(pageElement.type === "map" || pageElement.type === "barchart" || pageElement.type === "linechart") {
          let instance = echarts.getInstanceByDom( pElementDom );
          let options = JSON.parse(JSON.stringify( instance.getOption() ));
          pageElement.echartsOptions = options;

          // for reachability we also have the leaflet bbox stored already
          // store legend for first page
        }

        if(pageElement.type === "datatable") {
          // add some properties so we can recreate the table later
          let columnHeaders = pageDom.querySelectorAll("th");
          let columnNames = [];
          for(let header of columnHeaders) {
            columnNames.push(header.innerText);
          }
          pageElement.columnNames = columnNames;
          let tableData = [];
          let rows = pageDom.querySelectorAll("tbody tr");
          for(let row of rows) {
            let rowData = [];
            let fields = row.querySelectorAll("td");
            for(let field of fields) {
              rowData.push(field.innerText);
            }
            tableData.push(rowData);
          }
          pageElement.tableData = tableData; // [ [...], [...], [...] ]
        }
      }
    }
    if($scope.selectedSpatialUnit.spatialUnitName) {
      $scope.template.spatialUnitName = $scope.selectedSpatialUnit.spatialUnitName;
    }else {
      $scope.template.spatialUnitName = $scope.selectedSpatialUnit.spatialUnitLevel;
    }
    $scope.template.absoluteLabelPositions = $scope.absoluteLabelPositions;
    $scope.template.echartsRegisteredMapNames = [...new Set($scope.echartsRegisteredMapNames)];
    $scope.template.isochronesRangeType = $scope.isochronesRangeType;
    $scope.template.isochronesRangeUnits = $scope.isochronesRangeUnits;
    if(!$scope.template.name.includes("reachability")) {
      $scope.$emit('reportingAddNewIndicatorClicked', [$scope.selectedIndicator, $scope.template])
    } else {
      $scope.$emit('reportingAddNewPoiLayerClicked', [$scope.selectedPoiLayer, $scope.selectedIndicator, $scope.template])
    }
    $scope.reset();
  }
  */

  enableTab (tab) {
    tab.classList.remove("tab-disabled")
    tab.firstElementChild.removeAttribute("tabindex")
  }

  disableTab(tab) {
    tab.classList.add("tab-disabled")
    tab.firstElementChild.setAttribute("tabindex", "1")
  }

  // creates and returns a series data array for each range threshold
  convertIsochronesToSeriesData(isochrones) {
    let result:any[] = [] // array of series data config objects
    let ranges:any[] = []
    if( this.checkNestedPropExists(isochrones, "info", "query", "profile") ) {
      ranges = isochrones.info.query.ranges.split(",")
    } else if( isochrones.hasOwnProperty("features")) { // for buffer
      for(let feature of isochrones.features) {
        if(this.checkNestedPropExists(feature, "properties", "value")) {
          ranges.push(Number(feature.properties.value))
        }
      }
      ranges = [...new Set(ranges)] // remove dupes
    }
    if(!ranges || ranges.length === 0) {
      throw new Error("Could not determine ranges from isochrones. Is the format correct?")
    }
    let rangesInt = ranges.map( e => parseInt(e)); // assuming we only get integer values as input here
    let colorArr:any[] = [];
    if(ranges.length === 1) colorArr.push("green");
    if(ranges.length === 2) colorArr.push( ...["green", "yellow"] )
    if(ranges.length === 3) colorArr.push( ...["green", "yellow", "red"] )
    if(ranges.length === 4) colorArr.push( ...["green", "yellow", "orange", "red"] )
    // If we have more than five ranges the last color is used again for now. Can be extended if there is need for it.
    if(ranges.length >=  5) colorArr.push( ...["green", "yellow", "orange", "red", "brown"] )

    // one series per range value, so we can control the z value and legend display more easily.
    for(let [idx, range] of rangesInt.entries()) {
      if(idx >= colorArr.length) idx = colorArr.length-1;
      let seriesData:any[] = [];
      let data = isochrones.features.filter( feature => {
        return Number(feature.properties.value) == Number(range); // get features for this range threshold
      }).map( feature => {
        
        return {
          name: feature.properties.echartsId,
          value: feature.properties.value,
          itemStyle: {
            areaColor: colorArr[idx],
            color: colorArr[idx],
            opacity: 0.3
          },
          label: {
            show: false
          },
          emphasis: {
            disabled: true
          }
        }
      })
      seriesData.push(...data)
      result.push(seriesData);
    }
    
    return result;
  }
 

  // async
  createMapForReachability(wrapper, page, pageElement) {
    
    let options = JSON.parse(JSON.stringify( this.reachabilityTemplateGeoMapOptions ));
    // add indictor data if it is available
    if(this.selectedIndicator) {
      options.series[0] = this.setMostRecentIndicatorDataToReachabilityMap(options.series[0])
      options.series[0].label.formatter = '{b}\n{c}';
    }
    
    // register a new echarts map with a unique name (needed when filtering by area)
    // check if there is a map registered for this combination, if not register one with all features
    let mapName = this.selectedPoiLayer.datasetName + "_" + this.selectedSpatialUnit.spatialUnitId;
    if(page.area && page.area.length)
      mapName += "_" + page.area
    if(!this.echartsRegisteredMapNames.includes(mapName)) {
      echarts.registerMap(mapName, this.geoJsonForReachability)
      this.echartsRegisteredMapNames.push(mapName)
    }

    options.series[0].map = mapName;
    options.geo.map = mapName

    // Add isochrones if possible
    // In echarts one map can only handle one series
    // But we need the isochrones in different series to control their z-indexes (show smaller isochrones above larger ones)
    // That's why we need to register one map per range threshold, that only contains a subset of isochrones.
    if(this.isochrones) {
      for(let seriesData of this.isochronesSeriesData) {
        let range = seriesData[0].value;
        let registeredMap = echarts.getMap(this.selectedPoiLayer.datasetName + "_isochrones-" + range)
        if( !registeredMap ) {
          let isochrones = this.isochrones.features.filter( feature => {
            // only weak comparison to allow string == number comparison
            return feature.properties.value == range;
          })
          let featureCollection:any = {
            features: isochrones
          }
          echarts.registerMap(this.selectedPoiLayer.datasetName + "_isochrones-" + range, featureCollection)
          this.echartsRegisteredMapNames.push(this.selectedPoiLayer.datasetName + "_isochrones-" + range)
        }
      }
      
      let bbox = this.isochrones.bbox; // [left, bottom, right, top]
      let isochronesBboxForEcharts = [[bbox[0], bbox[3]], [bbox[2], bbox[1]]] // [left, top], [right, bottom]
      

      for(let [idx, seriesData] of this.isochronesSeriesData.entries()) {
        let series = {
          name: "isochrones-" + seriesData[0].value,
          type: 'map',
          roam: false,
          left: 0, top: 0, right: 0, bottom: 0,
          boundingCoords: isochronesBboxForEcharts,
          map: this.selectedPoiLayer.datasetName + "_isochrones-" + seriesData[0].value,
          nameProperty: 'echartsId',
          cursor: "default",
          select: {
            disabled: true
          },
          z: 90 - idx, // first one has smallest threshold and gets highest index
          data: seriesData
        }
        options.series.push(series)
      }
    }

    // Add poi markers as additional series
    let centerPointSeriesData = this.selectedPoiLayer.geoJSON.features.map( feature => {
      return feature.geometry.coordinates;
    });

    let centerPointSeries =  {
      name: 'centerPoints',
      type: 'scatter',
      coordinateSystem: 'geo',				
      symbol: "image://icons/marker-icon.png",
      symbolSize: [17, 26],
      symbolOffset: [0, '-50%'],
      itemStyle: {
        opacity: 1
      },
      cursor: "default",
      data: centerPointSeriesData,
      label: {
        show: false,
      },
      emphasis: {
        disabled: true	
      },
      z: 200
    }
    options.series.push(centerPointSeries)

    let map = echarts.init( wrapper )

    // label positioning
    options = this.enableManualLabelPositioningAcrossPages(page, options, map)

    map.setOption( options, {
      replaceMerge: ['series', 'geo']
    })

    // initialize the leaflet map beneath the transparent-background echarts map
    setTimeout(async (page:any, pageElement, echartsMap) => {
      let pageIdx = this.template.pages.indexOf(page);
      let id = "reporting-addPoiLayer-reachability-leaflet-map-container-" + pageIdx;
      let pageDom:any = document.getElementById("reporting-addIndicator-page-" + pageIdx);
      let pageElementDom:any = document.getElementById("reporting-addIndicator-page-" + pageIdx + "-map");
      let oldMapNode = document.getElementById(id);
      if(oldMapNode) {
        oldMapNode.remove();
      }
      let div:any = document.createElement("div");
      div.id = id;
      div.style.position = "absolute";
      div.style.left = pageElement.dimensions.left;
      div.style.top = pageElement.dimensions.top;
      div.style.width = pageElement.dimensions.width;
      div.style.height = pageElement.dimensions.height;
      div.style.zIndex = 10;
      pageDom.appendChild(div);
      let echartsOptions = echartsMap.getOption();

      let leafletMap = L.map(div.id, {
        zoomControl: false,
        dragging: false,
        doubleClickZoom: false,
        boxZoom: false,
        trackResize: false,
        attributionControl: false,
        // prevents leaflet form snapping to closest pre-defined zoom level.
        // In other words, it allows us to set exact map extend by a (echarts) bounding box
        zoomSnap: 0 
      });
      // manually create a field for attribution so we can control the z-index.
      let prevAttributionDiv = pageDom.querySelector(".map-attribution")
      if(prevAttributionDiv) prevAttributionDiv.remove();
      let attrDiv:any = document.createElement("div")
      attrDiv.classList.add("map-attribution")
      attrDiv.style.position = "absolute";
      attrDiv.style.bottom = 0;
      attrDiv.style.left = 0;
      attrDiv.style.zIndex = 800;
      let attrImg = this.diagramHelperService.createReportingReachabilityMapAttribution();
      attrDiv.appendChild(attrImg);
      pageElementDom.appendChild(attrDiv);
      // also create the legend manually
      let prevLegendDiv = pageDom.querySelector(".map-legend")
      if(prevLegendDiv) prevLegendDiv.remove();
      let legendDiv:any = document.createElement("div")
      legendDiv.classList.add("map-legend")
      legendDiv.style.position = "absolute";
      legendDiv.style.bottom = 0;
      legendDiv.style.right = 0;
      legendDiv.style.zIndex = 800;
      let legendImg = this.diagramHelperService.createReportingReachabilityMapLegend(echartsOptions, this.selectedSpatialUnit, this.isochronesRangeType, this.isochronesRangeUnits);
      legendDiv.appendChild(legendImg);
      pageElementDom.appendChild(legendDiv)

      // echarts uses [lon, lat], leaflet uses [lat, lon]
      let boundingCoords = echartsOptions.series[0].boundingCoords;
      let westLon = boundingCoords[0][0];
      let southLat = boundingCoords[1][1];
      let eastLon = boundingCoords[1][0];
      let northLat = boundingCoords[0][1];

      if(page.area && page.area.length) {
        for(let feature of this.geoJsonForReachability.features) {
          if(feature.properties.NAME === page.area) {
            // set bounding box to this feature
            let featureBbox = feature.properties.bbox;
            westLon = featureBbox[0];
            southLat = featureBbox[1];
            eastLon = featureBbox[2];
            northLat = featureBbox[3];
            break;
          }
        }
      }

      // Add 2% space on all sides
      let divisor = 50;
      let bboxHeight = northLat - southLat;
      let bboxWidth = eastLon - westLon;
      northLat += bboxHeight/divisor;
      southLat -= bboxHeight/divisor;
      eastLon += bboxWidth/divisor;
      westLon -= bboxWidth/divisor;

      leafletMap.fitBounds( [[southLat, westLon], [northLat, eastLon]] );
      let bounds = leafletMap.getBounds()
      // now update every echarts series
      boundingCoords = [ [bounds.getWest(), bounds.getNorth()], [bounds.getEast(), bounds.getSouth()]]
      for(let series of echartsOptions.series) {
        series.top = 0;
        series.bottom = 0;
        series.aspectScale = 0.625
        series.boundingCoords = boundingCoords
      }
      // also for the invisible geo component to update pois
      echartsOptions.geo[0].top = 0;
      echartsOptions.geo[0].bottom = 0;
      echartsOptions.geo[0].aspectScale = 0.625
      echartsOptions.geo[0].boundingCoords = boundingCoords

      echartsMap.setOption(echartsOptions, {
        notMerge: true
      });
      
      // Attribution is handled in a custom element
      let osmLayer = new L.TileLayer.Grayscale("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
      osmLayer.addTo(leafletMap);

      // add leaflet map to pageElement in case we need it again later
      pageElement.leafletMap = leafletMap;

      // can be used to check if positioning in echarts matches the one from leaflet
      // let geoJsonLayer = L.geoJSON( this.geoJsonForReachability.features )
      // geoJsonLayer.addTo(leafletMap)
      // let isochronesLayer = L.geoJSON( this.isochrones.features )
      // isochronesLayer.addTo(leafletMap);
      // let poiMarkerLSource = {
      // 	"type": "FeatureCollection",
      // 	"features": []
      // }
      // for(let lonLatArr of centers) {
      // 	poiMarkerLSource.features.push({
      // 		"type": "Feature",
      // 		"geometry": {
      // 			"type": "Point",
      // 			"coordinates": [
      // 				lonLatArr[0],
      // 				lonLatArr[1]
      // 			]
      // 		}
      // 	})
      // }
      // poiMarkerLayer = L.geoJSON( poiMarkerLSource )
      // poiMarkerLayer.addTo(leafletMap);

      pageElement.leafletBbox = bounds;

      if(pageIdx === this.template.pages.length-1) {
        this.loadingData = false;
      }
    }, 0, true, page, pageElement, map)

    return map;
  }
  

  // async
  createPageElement_Map(wrapper, page, pageElement) {

    if(this.template.name.includes("reachability")) {
      let map = this.createMapForReachability(wrapper, page, pageElement);
      return map;
    }
    
    // check if there is a map registered for this combination, if not register one with all features
    let mapName:any = undefined;
    let timestamp:any = undefined;
    
    // get the timestamp from pageElement, not from dom because dom might not be up to date yet
    let dateElement;
    if(this.template.name.includes("reachability")) {
      dateElement = page.pageElements.find( el => {
        return el.type.includes("reachability-subtitle-");
      });
      timestamp = dateElement.text.split(",")[0];
    } else {
      // the other two templates
      dateElement = page.pageElements.find( el => {
        // pageElement references the map here
        // do the comparison like this because we have maps with dataTimestamp and dataTimeseries in the timeseries template
        return el.type.includes(pageElement.isTimeseries ? "dataTimeseries-" : "dataTimestamp-");
      })
      
      if(pageElement.isTimeseries) {
        timestamp = dateElement.text.split(" - ")[1]; // get the recent timestamp
      } else {
        timestamp = dateElement.text;
      }
    }
    
    if(this.template.name.includes("reachability")) {
      mapName = this.selectedIndicator.indicatorId + "_" + timestamp + "_" + this.selectedSpatialUnit.spatialUnitName;
    } else {
      mapName = this.selectedIndicator.indicatorId + "_" + dateElement.text + "_" + this.selectedSpatialUnit.spatialUnitName;
    }
    
    if(pageElement.classify)
      mapName += "_classified";
    if(pageElement.isTimeseries)
      mapName += "_timeseries"
    if(page.area && page.area.length)
      mapName += "_" + page.area

    if(!this.echartsRegisteredMapNames.includes(mapName)) {
      echarts.registerMap(mapName, this.selectedIndicator.geoJSON)
      this.echartsRegisteredMapNames.push(mapName)
    }
    

    let map = echarts.init( wrapper );
    if(pageElement.isTimeseries) {
      timestamp += "_relative"
    }
console.log(this.echartsOptions, timestamp);                       // todo timestamp
    let options = JSON.parse(JSON.stringify(this.echartsOptions.map['2023-12-31']));
    
    // default changes for all reporting maps
    options.title.show = false;
    options.grid = undefined;
    options.visualMap.axisLabel = { "fontSize": 10 };
    options.toolbox.show = false;
    options.visualMap.left = "right";
    let series = options.series[0];
    series.roam = false;
    series.selectedMode = false;
    
    

    if(pageElement.isTimeseries) {
      let includeInBetweenDates = true;
      let timeseries = this.getFormattedDateSliderValues(includeInBetweenDates)
      series.data = this.calculateSeriesDataForTimeseries(this.selectedIndicator.geoJSON.features, timeseries)
    }
    
    series.map = mapName; // update the map with the one registered above
    series.name = mapName;

    let areaNames = this.selectedAreas.map( (el:any) => {
      return el.name;
    });

    if(pageElement.classify === true) {
      options.visualMap.show = true;
    } else {
      options.visualMap.show = false;
    }

    series.data.forEach( el => {
      el.itemStyle =  el.itemStyle ? el.itemStyle : {};
      el.emphasis = el.emphasis ? el.emphasis : {};
      el.emphasis.itemStyle = el.emphasis.itemStyle ? el.emphasis.itemStyle : {};
      el.label = el.label ? el.label : {};
      el.visualMap = false;
      
      if(pageElement.classify === false) {
        if( areaNames.includes(el.name) ) {
          // show selected areas (don't classify color by value)
          el.label.formatter = '{b}\n{c}';
          el.label.show = true;
          el.label.textShadowColor = '#ffffff';
          el.label.textShadowBlur = 2;
          el.itemStyle.areaColor = "rgb(255, 153, 51, 0.6)";
          el.itemStyle.color = "rgb(255, 153, 51, 0.6)";
          el.emphasis.itemStyle.areaColor = "rgb(255, 153, 51, 0.6)";
          el.emphasis.itemStyle.color = "rgb(255, 153, 51, 0.6)";
        } else {
          // Only show borders for any other areas
          el.itemStyle.color = "rgba(255, 255, 255, 0)";
          el.itemStyle.areaColor = "rgba(255, 255, 255, 0)";
          el.emphasis.itemStyle.color = "rgba(255, 255, 255, 0)";
          el.emphasis.itemStyle.areaColor = "rgba(255, 255, 255, 0)";
          el.label.show = false;
        }
      }

      if(pageElement.classify === true) {
      
        if( areaNames.includes(el.name) ) {
          el.visualMap = true;
          el.label.formatter = '{b}\n{c}';
          // get color from visual map to overwrite yellow color
          let color = "rgba(0, 0, 0, 0.5)"; 
          let opacity = 1;
          for(let [idx, piece] of options.visualMap.pieces.entries()) {
            // for the last index (highest value) value can equal the upper boundary
            if(idx === (options.visualMap.pieces.length-1)) {
              if(piece.min <= el.value && el.value <= piece.max) {
                color = piece.color;
                opacity = piece.opacity;
                break;
              }
            }

            // for all other pieces check if it is withing the boundaries, (including lower one, excluding upper one)
            if(piece.min <= el.value && el.value < piece.max) {
              color = piece.color;
              opacity = piece.opacity;
              break;
            }
          }
          el.label.show = true;
          el.itemStyle.color = color;
          el.itemStyle.areaColor = color;
          el.itemStyle.opacity = opacity;
          el.emphasis.itemStyle.color = color;
          el.emphasis.itemStyle.areaColor = color;
          el.emphasis.itemStyle.opacity = opacity;
          el.label.textShadowColor = '#ffffff';
          el.label.textShadowBlur = 2;
        } else {
          el.visualMap = false;
          el.itemStyle.color = "rgb(255, 255, 255)";
          el.itemStyle.areaColor = "rgb(255, 255, 255)";
          el.emphasis.itemStyle.color = "rgb(255, 255, 255)";
          el.emphasis.itemStyle.areaColor = "rgb(255, 255, 255)";
          el.label.show = false;
        }
      }
    })


    // label positioning
    options = this.enableManualLabelPositioningAcrossPages(page, options, map)
    
    map.setOption(options);
    console.log(map, "map");
    return map;
  }

  enableManualLabelPositioningAcrossPages(page, options, map) {
    if(!page.area) {
      options.labelLayout = (feature) => {
        if(feature.seriesIndex != 0) { // index 0 are the borders / indicator
          return;
        }
        // Set fixed position for labels that were previously dragged by user
        // For all other labels try to avoid overlaps
        let names = this.absoluteLabelPositions.map(el=>el.name)
        let text = feature.text.split("\n")[0] // area name is the first line
        if(names.includes(text)) {
          let idx = names.indexOf(text)
          return {
            x: this.absoluteLabelPositions[idx].x,
            y: this.absoluteLabelPositions[idx].y,
            draggable: true
          }
        } else {
          return {
            moveOverlap: 'shiftY',
            x: feature.rect.x + feature.rect.width / 2,
            draggable: true
          }
        }	
        
      }

      options.labelLine = {
        show: true,
        showAbove: false,
        lineStyle: {
          color: '#555'
        }
      }

      map.getZr().on('mousedown', (event) => {
        // on label drag
        if(event.target) {
          let target = event.target;
          if(target.parent && target.parent.type === "text") {
            // get the feature which this label belongs to
            // When user clicks on the label, one of the child elements is clicked
            // Child elements can be something like: first line of text, second line of text, (white) label background
            // These elements all have the same parent, which we can use to navigate to the parent and then find the correct child (area name)
            let parent = target.parent;
            let areaNameChild;
            for(let child of parent._children) {
              // we assume that the area name is the first child with text ("the first line")
              if(child.style.text && child.style.text.length > 0) {
                areaNameChild = child;
                break;
              }
            }
            this.draggingLabelForFeature = areaNameChild.style.text;
          }
        }
      });

      map.getZr().on('mouseup', (event) => {
        if(event.target) {
          let target = event.target;
          if(target.parent && target.parent.type === "text") {
            // for all other maps, that are not area-specific, do the exact same label drag
            let newX = target.parent.x;
            let newY = target.parent.y;
            let names = this.absoluteLabelPositions.map((el:any)=>el.name)
            if(names.includes(this.draggingLabelForFeature)) {
              let idx = names.indexOf(this.draggingLabelForFeature);
              this.absoluteLabelPositions[idx].x = newX;
              this.absoluteLabelPositions[idx].y = newY;
            } else {
              this.absoluteLabelPositions.push({
                name: this.draggingLabelForFeature,
                x: newX,
                y: newY
              })
            }

            for(let [idx, page] of this.template.pages.entries()) {
              for(let pageElement of page.pageElements) {
                if(pageElement.type === "map" && !page.area) {
                  let domNode:any = document.getElementById("reporting-addIndicator-page-" + idx + "-map");
                  let map:any = echarts.getInstanceByDom(domNode);
                  map.setOption(map.getOption()); // this calls the labelLayout function defined above
                }
              }
            }
          }
        }
      });
    }
    return options;
  }

  createPageElement_Average(page, pageElement, calcForSelection) {
    // get the timestamp from pageElement, not from dom because dom might not be up to date yet
    // no timeseries possible for this type of element
    let dateElement = page.pageElements.find( el => {
      return el.type.includes("dataTimestamp-");
    });
    let timestamp = dateElement.text;

    let avg = this.calculateAvg( this.selectedIndicator, timestamp, calcForSelection );
    pageElement.text = avg;
    pageElement.css = "border: solid 1px lightgray; padding: 2px;"
    pageElement.isPlaceholder = false;
  }


  createPageElement_Change(page, pageElement, calcForSelection) {
    // get the timeseries from slider, not from dom because dom might not be up to date yet
    let timeseries = this.getFormattedDateSliderValues(true);

    let change = this.calculateChange( this.selectedIndicator, timeseries, calcForSelection );
    pageElement.text = change;
    pageElement.css = "border: solid 1px lightgray; padding: 2px;";
    pageElement.isPlaceholder = false;
  }

  createPageElement_BarChartDiagram(wrapper, page) {
    
    // get timestamp from pageElement, not from dom because dom might not be up to date yet
    // barcharts are only used in timestamp templates so we don't have to check for timeseries for now
    let dateElement = page.pageElements.find( el => {
      return el.type.includes("dataTimestamp-");
    });
    let timestamp = dateElement.text;

    let barChart = echarts.init( wrapper );                         
    let options = JSON.parse(JSON.stringify( this.echartsOptions.bar[timestamp] ));

    // default changes
    options.xAxis.name = "";
    options.title.textStyle.fontSize = 12;
    options.title.text = "";
    options.yAxis.axisLabel = { "fontSize": 10 };
    options.title.show = true;
    options.grid.top = 35;
    options.grid.bottom = 5;
    options.toolbox.show = false;
    options.visualMap[0].show = false; // only needed to set the color for avg
    options.xAxis.axisLabel.show = true;
    options.yAxis.name = ""; // included in header of each page
    options.xAxis.name = ""; // always timestamps
    // black text with halo effect for better visibility
    if(!options.textStyle) options.textStyle = {};
    options.textStyle.color = "black";
    options.textStyle.textShadowColor = '#ffffff';
    options.textStyle.textShadowBlur = 2;
    
    // filter series data and xAxis labels
    if(page.area && page.area.length) {
      options.series[0].data = options.series[0].data.filter( el => {
        return el.name === page.area;
      });
      let areaNames = options.series[0].data.map( obj => obj.name)
      options.xAxis.data = areaNames;
    } else {
      // only show selected areas in the "overview" diagram
      let areaNames = this.selectedAreas.map( (obj:any) => obj.name );
      options.series[0].data = options.series[0].data.filter( el => {
        return areaNames.includes(el.name);
      });
      areaNames = options.series[0].data.map( obj => obj.name);
      options.xAxis.data = areaNames;
    }

    options.series[0].data.sort(function(a, b) {
      if(typeof(a.value) == 'number' && typeof(b.value) == 'number') {
        return a.value - b.value;
      } else {
        return -1
      }	
    });

    // add data element for the overall average
    let overallAvgValue = this.calculateAvg(this.selectedIndicator, timestamp, false);
    let overallAvgElementName = (page.area && page.area.length) ? "Durchschnitt\nder\nRaumeinheit" : "Durchschnitt der Raumeinheit";
    let dataObjOverallAvg:any = {
      name: overallAvgElementName,
      value: overallAvgValue,
      opacity: 1
    }
    // get color for avg from visual map and disable opacity
    let colorOverallAvg = "";
    for(let piece of options.visualMap[0].pieces) {
      if(piece.min <= dataObjOverallAvg.value && dataObjOverallAvg.value < piece.max) {
        colorOverallAvg = piece.color;
      }
      piece.opacity = 1;
    }
    dataObjOverallAvg.color = colorOverallAvg;
    options.series[0].data.push(dataObjOverallAvg);
    options.xAxis.data.push( dataObjOverallAvg.name );

    // same for selection average
    // add more data elements for the overall and selection average
    let selectionAvgValue = this.calculateAvg(this.selectedIndicator, timestamp, true);
    let selectionAvgElementName = (page.area && page.area.length) ? "Durchschnitt\nder\nSelektion" : "Durchschnitt der Selektion";
    let dataObjSelectionAvg:any = {
      name: selectionAvgElementName,
      value: selectionAvgValue,
      opacity: 1
    }
    // get color for avg from visual map and disable opacity
    let colorSelectionAvg = "";
    for(let piece of options.visualMap[0].pieces) {
      if(piece.min <= dataObjSelectionAvg.value && dataObjSelectionAvg.value < piece.max) {
        colorSelectionAvg = piece.color;
      }
      piece.opacity = 1;
    }
    dataObjSelectionAvg.color = colorSelectionAvg;
    options.series[0].data.push(dataObjSelectionAvg);
    options.xAxis.data.push( dataObjSelectionAvg.name )
    
    options.series[0].emphasis.itemStyle = {}; // don't show border on hover

    barChart.setOption(options, {
      replaceMerge: ['series'] // take the new series data, don't update part of the old one
    });
    return barChart;
  }

  createPageElement_TimelineDiagram(wrapper, page, pageElement) {
    // no need to get a timestamp here

    let lineChart = echarts.init( wrapper );
    
    let vals:any = this.getFormattedDateSliderValues(true);
    let timeline = vals.dates;
    // get standard options, create a copy of the options to not change anything in the service
    let options = JSON.parse(JSON.stringify( this.echartsOptions.line ));
    options.title.textStyle.fontSize = 12;
    options.title.text = "Zeitreihe";
    options.yAxis.axisLabel = { "fontSize": 10 };
    options.xAxis.axisLabel = { "fontSize": 10 };
    options.legend.show = false;
    options.grid.top = 35;
    options.grid.bottom = 5;
    options.title.show = true;
    options.toolbox.show = false;
    options.yAxis.name = ""; // included in header of each page
    options.xAxis.name = ""; // always timestamps

    // diagram contains avg series by default
    // if it should be shown we adjust it to our timeseries
    // future dates (compared to max slider value) were already filtered in prepareDiagrams
    // we have to remove dates older than min slider value here
    // we also have to filter xAxis labels accordingly
    let timeseries:any = this.getFormattedDateSliderValues(true);
    let oldestSelectedTimestamp = timeseries.from;
    let timestampsToRemoveCounter = 0;
    // use the axis labels to find out how many data points have to be removed later
    let timestampReached = false;
    while(!timestampReached) {
      if(oldestSelectedTimestamp === options.xAxis.data[0]) {
        timestampReached = true;
      } else {
        options.xAxis.data.shift();
        timestampsToRemoveCounter += 1;
      }
    }

    if(pageElement.showAverage) {
      options.series = options.series.filter( series => {
        return series.name === this.dataExchangeService.pipedData.rankingChartAverageLabel || series.name === this.dataExchangeService.pipedData.rankingChartRegionalReferenceValueLabel 
      });

      for(let i=0; i<timestampsToRemoveCounter; i++) {
        options.series[0].data.shift();
      }
    } else {
      options.series = [];
    }
    
    
    if(pageElement.showAreas) {
      
      let areaNames:any[] = [];
      // in area specific part only add one line
      if(page.area && page.area.length) {
        areaNames.push(page.area);
      } else {
        // else add one line for each selected area
        areaNames = this.selectedAreas.map( (el:any) => {
          return el.name;
        });
      }

      for(let areaName of areaNames) {
        let data:any[] = [];
        let filtered = this.selectedIndicator.geoJSON.features.filter( feature => {
          return feature.properties.NAME === areaName;
        });
      
        for(let timestamp of timeline) {
          let value = filtered[0].properties["DATE_" + timestamp];
          data.push(value)
        }
      
        let series:any = {};
        series.name = areaName;
        series.type = "line";
        series.data = data;
        series.lineStyle = {
          normal: {
            width: 2,
            type: "solid"
          }
        }
        series.itemStyle = {
          normal: {
            borderWidth: 3
          }
        }
      
        options.series.push(series)
      }
    }

    if(pageElement.showPercentageChangeToPrevTimestamp) {
      for(let series of options.series) {
        series.data = this.transformSeriesDataToPercentageChange(series.data)
          
        
      }
      options.xAxis.data.shift();
      options.title.text = "Veränderung zum Vorjahr";
    }

    if(pageElement.showBoxplots) {
      // we assume that boxplots are only shown when showAreas is false (might change in the future).
      // so we have to get the data of all areas first
      let areaNames:any = [];
      areaNames = this.selectedAreas.map( (el:any) => {
        return el.name;
      });

      // create a nested array with each inner array containing all area-values for one timestamp
      let datasetSource:any[] = [];
      for(let timestamp of timeline) {
        let valuesForTimestamp:any[] = [];
        // filter features to selected areas
        let selectedAreasFeatures = this.selectedIndicator.geoJSON.features.filter( feature => {
          return areaNames.includes( feature.properties.NAME );
        });
        // get values for each feature
        for(let feature of selectedAreasFeatures) {
          let value = feature.properties["DATE_" + timestamp]
          valuesForTimestamp.push(value);
        }

        datasetSource.push(valuesForTimestamp)
      }
      
      let xAxisLabels = options.xAxis.data;
      options.dataset = [
        {
          source: datasetSource
        },
        {
          transform: {
            type: 'boxplot',
            config: { 
              // params is 0, 1, 2, ...
              // we can use this as an index to get the actual label and return it
              itemNameFormatter: function (params) {
                return xAxisLabels[params.value];
              }
            }
          }
        },
        {
          fromDatasetIndex: 1,
          fromTransformResult: 1
        }
      ]

      // add a new series that references the boxplots
      options.series.push({
        name: 'boxplot',
        type: 'boxplot',
        datasetIndex: 1 // overlap boxplots and avg. line
      })
    }

    lineChart.setOption(options, {
      replaceMerge: ['series'] // take the new series data, don't update part of the old one
    });
    return lineChart;
  }

  createPageElement_Datatable(wrapper, page) {
    
    // table looks different depending on template type
    // for single timestamps it is added at the end of each timestamp-section, so each area is inserted once
    // for timeseries it is added once at the end of the template and contains an extra column for timestamps.
    // Each area is inserted for multiple timestamps.

    // our wrapper is 440px high.
    // 440 - 25 (header) = 415
    // we set each row to be 25px high, so we can fit 415 / 25 --> 16 rows on one page.
    let wrapperHeight = parseInt(wrapper.style.height, 10);
    let maxRows = Math.floor( (wrapperHeight - 25) / 25);
    let rowsData:any[] = [];
    let timestamp = undefined;
    let timeseries:any = undefined;

    if(this.template.name.includes("timestamp")) {
      // get the timestamp from pageElement, not from dom because dom might not be up to date yet
      let dateElement = page.pageElements.find( el => {
        return el.type.includes("dataTimestamp-");
      });
      timestamp = dateElement.text;
    }

    if(this.template.name.includes("timeseries")) {
      let inBetweenValues = true;
      timeseries = this.getFormattedDateSliderValues(inBetweenValues);
    }

    // see how many pages need to be added. Rows are added later
    for(let feature of this.selectedIndicator.geoJSON.features) {
      // don't add row if feature not selected
      let isSelected = false;
      for(let tEarea of this.selectedAreas) {

        let area:any = tEarea;

        if(area.name === feature.properties.NAME) {
          isSelected = true;
        }
      }
      if( !isSelected )
        continue;

      if(this.template.name.includes("timestamp")) {
        // get the timestamp from pageElement, not from dom because dom might not be up to date yet
        let dateElement = page.pageElements.find( el => {
          return el.type.includes("dataTimestamp-");
        });
        let timestamp = dateElement.text;
        // prepare data to insert later
        let value = feature.properties["DATE_" + timestamp];
        if(typeof(value) == 'number')
          value = Math.round( value * 100) / 100;
        
        rowsData.push( {
          name: feature.properties.NAME,
          value: value
        });
      }

      if(this.template.name.includes("timeseries")) {
        for(let timestamp of timeseries.dates) {
          let value = feature.properties["DATE_" + timestamp];
          if(typeof(value) == 'number')
            value = Math.round( value * 100) / 100;
          rowsData.push( {
            name: feature.properties.NAME,
            timestamp: timestamp,
            value: value
          });
        }
      }
    }

    // sort by area name
    rowsData.sort((a, b) => a.name.localeCompare(b.name))

    // append average as last row if needed
    if(this.template.name.includes("timestamp")) {
      rowsData.push({
        name: "Durchschnitt Selektion",
        value:  this.calculateAvg(this.selectedIndicator, timestamp, true)
      });
      rowsData.push({
        name: "Durchschnitt Gesamtstadt",
        value:  this.calculateAvg(this.selectedIndicator, timestamp, false)
      });
      
    }

    // the length of rowsData is the number of rows we have to add
    for(let i=0;i<rowsData.length;i++) {
      // each time we hit the page breakpoint we add a new page
      // at this point we are not actually adding any rows to the table
      if(i > 0 && i % maxRows == 0) {
        // add a new page
        let newPage = fromJson(this.untouchedTemplateAsString).pages.at(-1);
        newPage.id = this.templatePageIdCounter++;
        // setup new page
        for(let pageElement of newPage.pageElements) {

          if(pageElement.type.includes("indicatorTitle-")) {
            pageElement.text = this.selectedIndicator.indicatorName + " [" + this.selectedIndicator.unit + "]"
            pageElement.isPlaceholder = false;
          }

          if(pageElement.type.includes("dataTimestamp-")) {
            pageElement.text = timestamp;
            pageElement.isPlaceholder = false;
          }

          // exists only on timeseries template (instead of dataTimestamp-landscape), so we don't need another if...else here
          if(pageElement.type.includes("dataTimeseries-")) {
            pageElement.text = timeseries.from + " - " + timeseries.to;
            pageElement.isPlaceholder = false;
          }

          if(pageElement.type === "datatable") {
            pageElement.isPlaceholder = false;
          }
        }

        // insert after current one
        let currentPageIndex = this.template.pages.indexOf(page)
        this.template.pages.splice(currentPageIndex + 1, 0, newPage);
      }
    }

   /*  // create table rows once the pages exist
    function insertDatatableRows(rowsData, page, maxRows) {
      // get current index of page (might have changed in the meantime)
      let idx = this.template.pages.indexOf(page)
      let wrapper = document.querySelector("#reporting-addIndicator-page-" + idx + "-datatable");
      if(wrapper) {
        $interval.cancel(insertDatatableRowsInterval); // code below still executes once
      } else {
        return;
      }
      
      wrapper.innerHTML = "";
      wrapper.style.border = "none"; // hide dotted border from outer dom element
      wrapper.style.justifyContent = "flex-start"; // align table at top instead of center

      let columnNames;
      if(this.template.name.includes("timeseries")) {
        columnNames  = ["Bereich", "Zeitpunkt", "Wert"]
      } else {
        columnNames  = ["Bereich", "Wert"]
      }

      let table = this.createDatatableSkeleton(columnNames);
      wrapper.appendChild(table);
      let tbody = table.querySelector("tbody");
      let pageElement = this.template.pages[idx].pageElements.find( el => el.type === "datatable");
      pageElement.isPlaceholder = false;

      for(let i=0;i<rowsData.length; i++) {
        // see which page we have to add the row to
        // switch to next page if necessary
        let intervalArr = [];
        if((i % maxRows) == 0) {
          if(i > 0) idx++
          const idx_save = idx;
          const i_save = i;
          intervalArr[idx_save] = $interval(insertDatatableRowsPerPage, 0, 100, true, pageElement, idx_save, columnNames, maxRows, rowsData, i_save)

          function insertDatatableRowsPerPage(pageElement, idx, columnNames, maxRows, rowsData, i) {
            // check if page exists already in dom, if not try again later
            wrapper = document.querySelector("#reporting-addIndicator-page-" + idx + "-datatable");
            if(wrapper) {
              $interval.cancel(intervalArr[idx]); // code below still executes once
            } else {
              return;
            }
            // page exists
            wrapper.innerHTML = "";
            wrapper.style.border = "none"; // hide dotted border from outer dom element
            wrapper.style.justifyContent = "flex-start"; // align table at top instead of center
            table = this.createDatatableSkeleton(columnNames);
            wrapper.appendChild(table);
            tbody = table.querySelector("tbody");
            pageElement = this.template.pages[idx].pageElements.find( el => el.type === "datatable");
            pageElement.isPlaceholder = false;
            
            for(let j=i; j<(i + maxRows); j++) {
              if(!rowsData[j])
                break; // on last page

              let row = document.createElement("tr");
              row.style.height = "25px";

              for(let colName of columnNames) {
                let td = document.createElement("td");
                if(colName === "Bereich") {
                  td.innerText = rowsData[j].name;
                  td.classList.add("text-left");
                }
              
                if(colName === "Zeitpunkt") {
                  td.innerText = rowsData[j].timestamp;
                }
              
                if(colName === "Wert") {
                  td.innerText = rowsData[j].value;
                  td.classList.add("text-right");
                }
              
                row.appendChild(td);
              }

              tbody.appendChild(row)
            }
          }
        }
      }
    }
 */

    // create table rows once the pages exist
    this.insertDatatableRowsInterval = setInterval((rowsData:any, page, maxRows) => {
      // get current index of page (might have changed in the meantime)
      let idx = this.template.pages.indexOf(page)
      let wrapper:any = document.querySelector("#reporting-addIndicator-page-" + idx + "-datatable");
      if(wrapper) {
        clearInterval(this.insertDatatableRowsInterval); // code below still executes once
      } else {
        return;
      }
      
      wrapper.innerHTML = "";
      wrapper.style.border = "none"; // hide dotted border from outer dom element
      wrapper.style.justifyContent = "flex-start"; // align table at top instead of center

      let columnNames;
      if(this.template.name.includes("timeseries")) {
        columnNames  = ["Bereich", "Zeitpunkt", "Wert"]
      } else {
        columnNames  = ["Bereich", "Wert"]
      }

      let table = this.createDatatableSkeleton(columnNames);
      wrapper.appendChild(table);
      let tbody = table.querySelector("tbody");
      let pageElement = this.template.pages[idx].pageElements.find( el => el.type === "datatable");
      pageElement.isPlaceholder = false;

      for(let i=0;i<rowsData.length; i++) {
        // see which page we have to add the row to
        // switch to next page if necessary
        
        if((i % maxRows) == 0) {
          if(i > 0) idx++
          const idx_save = idx;
          const i_save = i;
          this.intervalArr[idx_save] = setInterval((pageElement:any, idx_save, columnNames:any, maxRows, rowsData, i_save, wrapper, table, tbody) => {
            // check if page exists already in dom, if not try again later
            wrapper = document.querySelector("#reporting-addIndicator-page-" + idx + "-datatable");
            if(wrapper) {
              clearInterval(this.intervalArr[idx]); // code below still executes once
            } else {
              return;
            }
            // page exists
            wrapper.innerHTML = "";
            wrapper.style.border = "none"; // hide dotted border from outer dom element
            wrapper.style.justifyContent = "flex-start"; // align table at top instead of center
            table = this.createDatatableSkeleton(columnNames);
            wrapper.appendChild(table);
            tbody = table.querySelector("tbody");
            pageElement = this.template.pages[idx].pageElements.find( el => el.type === "datatable");
            pageElement.isPlaceholder = false;
            
            for(let j=i; j<(i + maxRows); j++) {
              if(!rowsData[j])
                break; // on last page

              let row = document.createElement("tr");
              row.style.height = "25px";

              for(let colName of columnNames) {
                let td = document.createElement("td");
                if(colName === "Bereich") {
                  td.innerText = rowsData[j].name;
                  td.classList.add("text-left");
                }
              
                if(colName === "Zeitpunkt") {
                  td.innerText = rowsData[j].timestamp;
                }
              
                if(colName === "Wert") {
                  td.innerText = rowsData[j].value;
                  td.classList.add("text-right");
                }
              
                row.appendChild(td);
              }

              tbody.appendChild(row)
            }
          }, 0, 100, true);
        }
      }
    }, 0, 100, true);
  }


  filterMapByAreaName(echartsInstance, areaName, allFeatures) {
    let options = echartsInstance.getOption();
    let mapName = options.series[0].map;
    // filter shown areas if we are in the area-specific part of the template
    // removing areas form the series doesn't work. We have to filter the geojson of the registered map.
    let tfeatures:any = allFeatures.filter ( (el:any) => {
      return el.properties.name === areaName
    });

    let features:any = {
      features: tfeatures
    }

    echarts.registerMap(mapName, features )

    // echart map bounds are defined by a bounding box, which has to be updated as well.
    if(!features[0].properties.bbox){
      features[0].properties.bbox = turf.bbox(features[0]);
    }
    let bbox = features[0].properties.bbox; // [east, south, west, north]
    
    let newBounds = [[bbox[2], bbox[3]], [bbox[0], bbox[1]]] // [[west, north], [east, south]]
    options.series[0].boundingCoords = newBounds;
    echartsInstance.setOption(options, {
      replaceMerge: ['series']
    });
  }

  calculateAvg(indicator, timestamp, calcForSelection) {
    // calculate avg from geoJSON property, which should be the currently selected spatial unit
    let features = indicator.geoJSON.features;
    if(calcForSelection) {
      features = features.filter( el => {
        return this.selectedAreas.map((area:any)=>area.name).includes( el.properties.NAME )
      });
    }

    let data = features.map( feature => {
      return feature.properties["DATE_" + timestamp];
    })

    let noDataCounter = 0
    let sum = 0;
    for(let i=0; i<data.length; i++) {
      if(typeof(data[i]) === "number" && !isNaN(data[i])) {
        sum += data[i];
      } else {
        noDataCounter++;
      }
    }
    
    let avg = sum / data.length - noDataCounter;
    avg = Math.round(avg * 100) / 100; // 2 decimal places
    return avg;
  }

  calculateChange(indicator, timeseries, calcForSelection) {
    let data = this.calculateSeriesDataForTimeseries(indicator.geoJSON.features, timeseries);
    if(calcForSelection) {
      data = data.filter( el => {
        return this.selectedAreas.map((area:any)=>area.name).includes( el.name )
      });
    }
    data = data.map(obj => obj.value)
    let noDataCounter = 0
    let sum = 0;
    for(let i=0; i<data.length; i++) {
      if(typeof(data[i]) === "number" && !isNaN(data[i])) {
        sum += data[i];
      } else {
        noDataCounter++;
      }
    }
    
    let avgChange = sum / data.length - noDataCounter;
    avgChange = Math.round(avgChange * 100) / 100; // 2 decimal places
    return avgChange;
  }


  prepareDiagrams(selectedIndicator, selectedSpatialUnit, timestampName, classifyUsingWholeTimeseries, isTimeseries, fromDate, toDate) {
    
    console.log('prepare diagrams called');
    // if is  timeseries we must modify the indicator type of the given indicator, since it should display changes over time and hence 
    // must be treated as dynamic indicator
    let indicator = JSON.parse(JSON.stringify(selectedIndicator));
    let targetTimestamp = timestampName;
    if (isTimeseries) {
      var indicatorType = indicator.indicatorType;
      if (indicatorType.includes("ABSOLUTE")) {
        indicator.indicatorType = "DYNAMIC_ABSOLUTE";
      }
      else if (indicatorType.includes("RELATIVE")) {
        indicator.indicatorType = "DYNAMIC_RELATIVE";
      }
      else if (indicatorType.includes("STANDARDIZED")) {
        indicator.indicatorType = "DYNAMIC_STANDARDIZED";
      }

      // compute and set actual change values to perform correct colorization of features
      indicator.geoJSON.features = this.calculateAndSetSeriesDataForTimeseries(indicator.geoJSON.features, fromDate, toDate); 
    }

    // set settings useOutlierDetectionOnIndicator and classifyUsingWholeTimeseries to false to have consistent reporting setup
    // we need to undo these changes afterwards, so we store the current values in a backup first
    const useOutlierDetectionOnIndicator_backup = this.dataExchangeService.pipedData.useOutlierDetectionOnIndicator;
    const classifyUsingWholeTimeseries_backup = this.dataExchangeService.pipedData.classifyUsingWholeTimeseries;
    const classifyZeroSeparately_backup = this.dataExchangeService.pipedData.classifyZeroSeparately; 
    this.dataExchangeService.pipedData.useOutlierDetectionOnIndicator = false;
    this.dataExchangeService.pipedData.classifyUsingWholeTimeseries = false;
    if(classifyUsingWholeTimeseries) {
      this.dataExchangeService.pipedData.classifyUsingWholeTimeseries = true;
    }
    
    let timestampPrefix = window.__env.indicatorDatePrefix + timestampName;
    let numClasses = indicator.defaultClassificationMapping.numClasses ? indicator.defaultClassificationMapping.numClasses : 5;
    let colorCodeStandard = indicator.defaultClassificationMapping.colorBrewerSchemeName;
    let colorCodePositiveValues = window.__env.defaultColorBrewerPaletteForBalanceIncreasingValues;
    let colorCodeNegativeValues = window.__env.defaultColorBrewerPaletteForBalanceDecreasingValues;
    let classifyMethod = window.__env.defaultClassifyMethod;

    // setup brew 
    let defaultBrew = this.visualStyleHelperService.setupDefaultBrew(indicator.geoJSON, timestampPrefix, numClasses, colorCodeStandard, classifyMethod, true, selectedIndicator);
    //let manualBrew = kommonitorVisualStyleHelperService.setupManualBrew(indicator.geoJSON, timestampPrefix, numClasses, colorCodeStandard, classifyMethod, true, selectedIndicator);
    let dynamicBrewsArray = this.visualStyleHelperService.setupDynamicIndicatorBrew(indicator.geoJSON, timestampPrefix, colorCodePositiveValues, colorCodeNegativeValues, classifyMethod, numClasses,'');
    let dynamicIncreaseBrew = dynamicBrewsArray[0];
    let dynamicDecreaseBrew = dynamicBrewsArray[1];

    // setup diagram resources
    this.diagramHelperService.prepareAllDiagramResources_forReportingIndicator(indicator, selectedSpatialUnit.spatialUnitName, timestampName, defaultBrew, undefined, undefined, dynamicIncreaseBrew, dynamicDecreaseBrew, false, 0, true);
    // at this point the echarts instance has one map registered (geoMapChart).
    // that is the "default" map, which can be used to create individual maps for indicator + date + spatialUnit (+ area) combinations later

    // set settings classifyUsingWholeTimeseries and useOutlierDetectionOnIndicator and classifyZeroSeparately back to their prior values
    this.dataExchangeService.pipedData.useOutlierDetectionOnIndicator = useOutlierDetectionOnIndicator_backup;
    this.dataExchangeService.pipedData.classifyUsingWholeTimeseries = classifyUsingWholeTimeseries_backup;
    this.dataExchangeService.pipedData.classifyZeroSeparately = classifyZeroSeparately_backup;

    // copy and save echarts options so we can re-use them later
    if(isTimeseries) {
      timestampName += "_relative"; // save relative indicator separately
    }
    this.echartsOptions.map[timestampName] = JSON.parse(JSON.stringify( this.diagramHelperService.getGeoMapChartOptions() ));
    this.echartsOptions.bar[timestampName] = JSON.parse(JSON.stringify( this.diagramHelperService.getBarChartOptions() ));
    this.echartsOptions.bar[timestampName].visualMap.show = true;
    // no timestamp needed here
    this.echartsOptions.line = JSON.parse(JSON.stringify( this.diagramHelperService.getLineChartOptions() ));

    // if is timeseries then the original value for the toDate timestamp must be used instead of the computed change value above
    if(isTimeseries){
      // series[0] is average line
      // replace the value for same index same toDate
      let originalFeatures = selectedIndicator.geoJSON.features;
      let sumToDate = 0;
      let counter = 0;

      for (const feature of originalFeatures) {
        if (!this.dataExchangeService.indicatorValueIsNoData(feature.properties[timestampPrefix])){
          sumToDate += feature.properties[timestampPrefix];
          counter++;
        }
      }

      let toDateIndex = selectedIndicator.applicableDates.indexOf(targetTimestamp);	
            
      this.echartsOptions.line.series[0].data[toDateIndex] = this.dataExchangeService.getIndicatorValue_asNumber(sumToDate / counter);
    }

    console.log(this.echartsOptions, this.diagramsPrepared);
    this.diagramsPrepared = true;
  }

 
  prepareReachabilityEchartsMap() {
    for(let feature of this.geoJsonForReachability.features) {
      let bbox = turf.bbox(feature); // calculate bbox for each feature
      feature.properties.bbox = bbox;
    }
    let overallBbox = this.calculateOverallBoundingBoxFromGeoJSON(this.geoJsonForReachability.features)
    // change format of bbox to match the format needed for echarts
    overallBbox = [
      [overallBbox[0], overallBbox[3]], // north-west lon lat
      [overallBbox[2], overallBbox[1]] // south-east lon lat
    ]

    let mapName = "reachabilityMap"; // gets overwritten later anyway
    echarts.registerMap(mapName, this.geoJsonForReachability)

    let geoMapOptions = {
      // geo component is only needed for isochrone center markers to work
      geo: {
        map: mapName,
        z: 1,
        itemStyle: {
          opacity: 0
        },
        roam: false,
        boundingCoords: overallBbox,
      },
      backgroundColor: "rgba(255,255,255,0)", // transparent, because we draw it over the leaflet map
      series: [{
        name: "spatialUnitBoundaries",
        type: 'map',
        roam: false,
        boundingCoords: overallBbox,
        map: mapName,
        cursor: "default",
        itemStyle: {
          areaColor: "rgb(255, 255, 255, 0)",
          borderColor: "rgb(50, 50, 50)",
          borderWidth: 3,
          color: "rgb(255, 255, 255, 0)",
        },
        label: {
          show: true,
          backgroundColor: 'white',
          padding: [1, 2, 1, 2] // [top, right, bottom, left]
        },
        emphasis: {
          disabled: true
        },
        z: 100,
        data: []
      }]
    };
    
    // We can set this here because this function is only relevant for reachability.
    // The other diagrams don't have to be prepared since they are not used.
    this.diagramsPrepared = true;

    return geoMapOptions
  }

// async
  initializeAllDiagrams() {

    // todo delete
    this.selectedTimestamps = [{
      category: '2023-12-31',
      name: '2023-12-31'
    }];

    console.log('init all diagrams called', this.selectedTimestamps)
    if(!this.template)
      return;
    if(this.template.name.includes("timestamp") && this.selectedTimestamps.length === 0) {
      return;
    }
    if(!this.diagramsPrepared) {
      throw new Error("Diagrams can't be initialized since they were not prepared previously.")
    }
    console.log('init all diagrams - progress')

    // We need a separate counter for page index because we iterate over the pages array.
    // This array might include additional datatable pages, which are not inserted in the dom
    // Even though we do nothing for these pages, the index gets out of sync with the page ids (which we use to get the dom elements)
    let pageIdx = -1;

    for(let i=0; i<this.template.pages.length; i++) {
      pageIdx++;
      let page = this.template.pages[i];
      
      let prevPage = i>1 ? this.template.pages[i-1] : undefined;
      let pageIncludesDatatable = page.pageElements.map(el => el.type).includes("datatable")

      if(prevPage) {
        let prevPageIncludesDatatable = prevPage.pageElements.map(el => el.type).includes("datatable")
        if(pageIncludesDatatable && prevPageIncludesDatatable) {
          // get corresponding pages in the dom and check if they are datatable-pages
          let prevDomPageEl = document.querySelector("#reporting-addIndicator-page-" + (i-1) + "-datatable")
          let domPageEl =  document.querySelector("#reporting-addIndicator-page-" + i + "-datatable")
          if(!prevDomPageEl || !domPageEl) { // if this page does not exist in the dom
            pageIdx--; // don't increase index in this iteration so it stays in sync with the pages that exist in the dom
          }
          continue; // don't do anything for additional datatable pages. They are added in createPageElement_Datatable
        }
      }
      

      let pageDom:any = document.querySelector("#reporting-addIndicator-page-" + pageIdx);

      for(let pageElement of page.pageElements) {

        // usually each type is included only once per page, but there is an exception for linecharts in area specific part of timeseries template
        // for now we more or less hardcode this, but it might have to change in the future
        let pElementDom;
        if(pageElement.type === "linechart") {
          let arr = pageDom.querySelectorAll(".type-linechart");
          if(pageElement.showPercentageChangeToPrevTimestamp) {
            pElementDom = arr[1];
          } else {
            pElementDom = arr[0];
          }
        } else {
          pElementDom = pageDom.querySelector("#reporting-addIndicator-page-" + pageIdx + "-" + pageElement.type)
        }
        
        switch(pageElement.type) {
          case "map": {
            // initialize with all areas
            let map = this.createPageElement_Map(pElementDom, page, pageElement);
            // filter visible areas if needed
            if(page.area && page.area.length) {
              if(this.selectedIndicator) {
                this.filterMapByAreaName(map, page.area, this.selectedIndicator.geoJSON.features);
              } else {
                this.filterMapByAreaName(map, page.area, this.geoJsonForReachability.features);
              }
              
            }
            pageElement.isPlaceholder = false;
            break;
          }
          case "mapLegend": {
            pageElement.isPlaceholder = false; // hide the placeholder, legend is part of map
            pageDom.querySelector(".type-mapLegend").style.display = "none";
            break;
          }
            
          case "overallAverage": {
            this.createPageElement_Average(page, pageElement, false);
            pageDom.querySelector(".type-overallAverage").style.border = "none";
            break;
          }
          case "selectionAverage": {
            this.createPageElement_Average(page, pageElement, true);
            pageDom.querySelector(".type-selectionAverage").style.border = "none";
            break;
          }
          case "overallChange": {
            this.createPageElement_Change(page, pageElement, false);
            let wrapper = pageDom.querySelector(".type-overallChange")
            wrapper.style.border = "none";
            break;
          }
          case "selectionChange": {
            this.createPageElement_Change(page, pageElement, true);
            let wrapper = pageDom.querySelector(".type-selectionChange")
            wrapper.style.border = "none";
            break;
          }
          case "barchart": {
            this.createPageElement_BarChartDiagram(pElementDom, page);
            pageElement.isPlaceholder = false;
            break;
          }
          case "linechart": {
            this.createPageElement_TimelineDiagram(pElementDom, page, pageElement);
            pageElement.isPlaceholder = false;
            break;
          }
          case "datatable": {
            // remove all following datatable pages first so we don't add too many.
            // this might happen because we initialize page elements from $watch(selectedAreas) and $watch(selectedTimestamps) on indicator selection
            let nextPage = i<this.template.pages.length-1 ? this.template.pages[i+1] : undefined;
            if(nextPage) {
              let nextPageIncludesDatatable = nextPage.pageElements.map(el => el.type).includes("datatable")
              while(nextPageIncludesDatatable) {
                this.template.pages.splice(i+1, 1) //remove page
                //update next page
                nextPage = i<this.template.pages.length-1 ? this.template.pages[i+1] : undefined;
                nextPageIncludesDatatable = nextPage ? nextPage.pageElements.map(el => el.type).includes("datatable") : false;
              }
            }
            this.createPageElement_Datatable(pElementDom, page);
            break;
          }
        }
      }
    }
  }
 
  showThisPage(page) {
    let pageWillBeShown = false;
    for(let visiblePage of this.filterPagesToShow()){
      if(visiblePage.id == page.id) {
        pageWillBeShown = true;
      }
    }
    return pageWillBeShown;
  }

  filterPagesToShow() {
    let pagesToShow:any[] = [];
    let skipNextPage = false;
    for (let i = 0; i < this.template.pages.length; i ++) {
      let page = this.template.pages[i];
      if (this.pageContainsDatatable(i)) {
        pagesToShow.push(page);
        skipNextPage = false;
      }
      else {
        if(skipNextPage == false) {
          pagesToShow.push(page);
          skipNextPage = true;
        }
        else {
          skipNextPage = false;
        }
      }
    }
    return pagesToShow;
  }

  pageContainsDatatable(pageID) {
    let page = this.template.pages[pageID];
    let pageContainsDatatable = false;
    for(let pageElement of page.pageElements) {
      if(pageElement.type == "datatable") {
        pageContainsDatatable = true;
      }
    }
    return pageContainsDatatable;
  }

  getPageNumber(index) {
    let pageNumber = 1;
    for(let i = 0; i < index; i ++) {
      if (this.showThisPage(this.template.pages[i])) {
        pageNumber ++;
      }
    }
    return pageNumber;
  }

/* 
  $scope.getSeriesDataForTimestamp = function(geoJsonFeatures, timestamp, seriesData) {
    // if parameter is present we want to keep it's properties
    if(seriesData && seriesData.length) {
      for(let dataEntry of seriesData) {
        // just replace the value property
        let feature = geoJsonFeatures.find( feature => {
          return feature.properties.NAME === dataEntry.name;
        });
        dataEntry.value = feature.properties["DATE_" + timestamp]
        if(typeof(dataEntry.value) == 'number') {
          dataEntry.value = Math.round( dataEntry.value * 100) / 100;
        }
      }
      return seriesData;

    } else {
      // seriesData is undefined, meaning we can create a new array
      let result = [];
      for(let feature of geoJsonFeatures) {
        let obj = {};
        obj.name = feature.properties.NAME;
        let value = feature.properties["DATE_" + timestamp]
        if(typeof(value) == 'number') {
          value = Math.round( value * 100) / 100;
        }
        obj.value = value;

        result.push(obj)
      }
      return result;
    }
  }
  */

  calculateAndSetSeriesDataForTimeseries(features, fromDate, toDate){

    for(let feature of features) {
      let value = feature.properties["DATE_" + toDate] - feature.properties["DATE_" + fromDate];
      if(typeof(value) == 'number') {
        value = Math.round( value * 100) / 100;
      }
      feature.properties["DATE_" + toDate] = value;
    }

    return features;
  }

  calculateSeriesDataForTimeseries(features, timeseries) {
    let result:any[] = [];
    let mostRecentDate = timeseries.to;
    let oldestDate = timeseries.from

    for(let feature of features) {
      let obj:any = {};
      obj.name = feature.properties.name;
      let value = feature.properties["DATE_" + mostRecentDate] - feature.properties["DATE_" + oldestDate];
      if(typeof(value) == 'number') {
        value = Math.round( value * 100) / 100;
      }
      obj.value = value;

      result.push(obj);
    }
    return result;
  }

  
  createLowerCaseNameProperty(features) {
    for(let feature of features) {
      if(feature.hasOwnProperty("properties")) {
        if(!feature.properties.hasOwnProperty("name")) {
          let featureName = feature.properties.NAME;
          feature.properties.name = featureName;
        }
      }
    }
    return features;
  }


  createDatatableSkeleton(colNamesArr) {

    let table = document.createElement("table");
    table.classList.add("table-striped")
    table.classList.add("table-bordered")
    
    let thead = document.createElement("thead");
    let tbody = document.createElement("tbody");
    table.appendChild(thead);
    table.appendChild(tbody);
    
    let headerRow = document.createElement("tr");
    
    for(let colName of colNamesArr) {
      let col = document.createElement("th");
      col.classList.add("text-center");
      col.innerText = colName;
      headerRow.appendChild(col);
    }

    headerRow.style.height = "25px";
    thead.appendChild(headerRow);

    return table;
  }

  createDatesFromIndicatorDates(indicatorDates) {
    let datesAsMs:any[] = [];
    for (let i=0; i < indicatorDates.length; i++){
      // year-month-day
      var dateComponents = indicatorDates[i].split("-");
      datesAsMs.push(this.dataExchangeService.dateToTS(new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]))));
    }
    return datesAsMs;
  }

  prettifyDateSliderLabels(dateAsMs) {
    return this.dataExchangeService.tsToDate_withOptionalUpdateInterval(dateAsMs, this.selectedIndicator.metadata.updateInterval);
  }
/*
  $scope.onChangeDateSliderInterval = function() {
    $scope.loadingData = true;
    // needed to tell angular something has changed
    $timeout(function(){
      $scope.$digest();
    });
    // setup all pages with the new timeseries
    let values = $scope.getFormattedDateSliderValues(true);
    // prepare diagrams again for most recent timestamp of slider and for whole timeseries (changes).
    let classifyUsingWholeTimeseries = false;
    let isTimeseries = true;			
    $scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, values.to, classifyUsingWholeTimeseries, isTimeseries, values.from, values.to);
    isTimeseries = false;
    classifyUsingWholeTimeseries = true;
    $scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, values.to, classifyUsingWholeTimeseries, isTimeseries, undefined, undefined);
    
    // set dates on all pages according to new slider values
    for(let page of $scope.template.pages) {
      let dateEl = page.pageElements.find( el => {
        return el.type.includes("dataTimestamp-") || el.type.includes("dataTimeseries-")
      });

      if(dateEl.type.includes("dataTimestamp-")) {
        dateEl.text = values.to;
      }
      if(dateEl.type.includes("dataTimeseries-")) {
        dateEl.text = values.from + " - " + values.to;
      }
    }

    function updateDiagrams() {
      if($scope.diagramsPrepared) {
        $interval.cancel(updateDiagramsInterval); // code below still executes once
      } else {
        return;
      }
      // diagrams are prepared, but dom has to be updated first, too
      $timeout(async function() {
        await $scope.initializeAllDiagrams();
        $scope.loadingData = false;
      })
      
    }

    let updateDiagramsInterval = $interval(updateDiagrams, 0, 100)
  }
  */

  getFormattedDateSliderValues(includeInBetweenValues) {
    /* if(!$scope.dateSlider)
      throw new Error("Tried to get dateslider values but dateslider was not defined.");
    
    let slider = $scope.dateSlider
    let from = new Date(slider.result.from_value);
    let to = new Date(slider.result.to_value);

    let inBetweenDates;
    if(includeInBetweenValues) {
      // get all valid timestamps for this spatial unit that lie in between from and to
      let validTimestamps = getValidTimestampsForSpatialUnit( $scope.selectedSpatialUnit );
      inBetweenDates = validTimestamps.filter( el => {
        let date = new Date(el);
        date.setHours(0); // remove time-offset...TODO is there a better way?
        return from < date && date < to;
      });
    }
    // append zeros to month and year if needed
    let month = (from.getMonth()+1) // months start with 0
    let day = from.getDate();
    from = from.getFullYear() + "-";
    if( month < 10) from += "0";
    from += month + "-";
    if( day < 10) from += "0";
    from += day;

    month = (to.getMonth()+1) // months start with 0
    day = to.getDate();
    to = to.getFullYear() + "-";
    if( month < 10) to += "0";
    to += month + "-";
    if( day < 10) to += "0";
    to += day;
    
    let result = {
      from: from,
      to: to,
      dates: includeInBetweenValues ? [from, ...inBetweenDates, to] : [] // all dates in the interval, including "from" and "to"
    }

    return result; */
  }


  initializeDateRangeSlider(availableDates, min, max) {
/* 
    if($scope.dateSlider){
      $scope.dateSlider.destroy();
    }

    let domNode = document.getElementById("reporting-dateSlider");

    while (domNode.hasChildNodes()) {
      domNode.removeChild(domNode.lastChild);
    }

    //let mostRecentDate = availableDates[availableDates.length - 1];
    //let selectedDate = availableDates[availableDates.length - 1];

    let datesAsMs = $scope.createDatesFromIndicatorDates(availableDates);

    // new Date() uses month between 0-11!
    $("#reporting-dateSlider").ionRangeSlider({
      skin: "big",
      type: "double",
      grid: true,
      values: datesAsMs,
      from: 0,
      to: availableDates.length-1, // index
      force_edges: true,
      prettify: prettifyDateSliderLabels,
      onFinish: $scope.onChangeDateSliderInterval
    });

    let dateSlider = $("#reporting-dateSlider").data("ionRangeSlider");
    // make sure that the handles are properly set
    let minIdx = 0;
    let maxIdx = availableDates.length-1;
    if(typeof(min) !== "undefined")
      minIdx = availableDates.indexOf(min)
    if(typeof(max) !== "undefined")
      maxIdx = availableDates.indexOf(max);

    dateSlider.update({
      from: minIdx,
      to: maxIdx
    });
    return dateSlider; */
  }
/*
  $scope.onChangeShowMapLabels = function() {

    for(let i=0; i<$scope.template.pages.length; i++) {
      let map = document.querySelector("#reporting-addIndicator-page-" + i +"-map")
      if(!map) {
        continue; // no map on current page
      }

      let instance = echarts.getInstanceByDom(map);
      let options = instance.getOption();
      options.series[0].label.show = $scope.showMapLabels;
      options.series[0].select.label.show = $scope.showMapLabels;
      for(let item of options.series[0].data) {
        if(typeof item.label === "undefined") {
          item.label = {};
        }
        item.label.show = $scope.showMapLabels;
      }
      instance.setOption(options, {
        replaceMerge: ['series']
      });
    }
  }

  $scope.onChangeShowRankingMeanLine = function() {

    for(let i=0; i<$scope.template.pages.length; i++) {
      let barChart = document.querySelector("#reporting-addIndicator-page-" + i +"-barchart")
      if(!barChart) {
        continue; // no map on current page
      }

      let instance = echarts.getInstanceByDom(barChart);
      let options = instance.getOption();				
      if (! $scope.showRankingMeanLine){
        options.series[0].markLine_backup = options.series[0].markLine;
        options.series[0].markLine = {};
      }
      else{
        options.series[0].markLine = options.series[0].markLine_backup;
      }				
      instance.setOption(options, {
        replaceMerge: ['series']
      });
    }
  }

  

  $scope.validateConfiguration = function() {
    // indicator has to be selected (unless template is reachability)
    // at least one area has to be selected (unless template is reachability)
    // for timestamps:
      // at least one timestamp has to be selected
    // for timeseries
      // slider position must include at least two timestamps
    let isIndicatorSelected = false;
    let isAreaSelected = false;
    let isTimestampSelected = false;

    if(!$scope.template) {
      return false;
    }

    if($scope.selectedIndicator || $scope.template.name.includes("reachability")) {
      isIndicatorSelected = true;
    }
    if($scope.selectedAreas.length >= 1  || $scope.template.name.includes("reachability")) {
      isAreaSelected = true;
    }

    if( ($scope.template.name.includes("timestamp") || $scope.template.name.includes("reachability") ) && 
      $scope.selectedTimestamps.length >= 1) {
      isTimestampSelected = true;
    }

    if($scope.template.name.includes("timeseries")) {
      if(!$scope.dateSlider) {
        return false;
      }
      if( !$scope.availableFeaturesBySpatialUnit[ $scope.selectedSpatialUnit.spatialUnitName]) {
        return false;
      }
      let timeseries = $scope.getFormattedDateSliderValues(true).dates;
      if(timeseries.length >= 1) {
        isTimestampSelected = true; // reuse variable here
      }
    }

    if(isIndicatorSelected && isAreaSelected && isTimestampSelected && !$scope.loadingData) {
      return true;
    } else {
      return false;
    }

  }
  */
  transformSeriesDataToPercentageChange(dataArr) {
    // we need at least two timestamps
    if(dataArr.length <= 1) {
      let error = new Error("Can not calculate percentage change from a single timestamp.")
      this.dataExchangeService.displayMapApplicationError(error.message);
    }
    let result:any[] = [];
    for(let i=1; i<dataArr.length;i++) {
      let datapoint = dataArr[i];
      let prevDatapoint = dataArr[i-1];
      let value:any = (datapoint - prevDatapoint) / prevDatapoint;
      value *= 100;
      value =  Math.round( value * 100) / 100;
      result.push(value);
    }
    return result;
  }

  // https://stackoverflow.com/a/2631198/18450475
  checkNestedPropExists(obj, level,  ...rest) {
    if (obj === undefined) return false
    if (rest.length == 0 && obj.hasOwnProperty(level)) return true
    return this.checkNestedPropExists(obj[level], [...rest])
  }

  // https://stackoverflow.com/a/2631198/18450475
  getNestedProp(obj, ...args) {
    return args.reduce((obj, level) => obj && obj[level], obj)
  }
}
