import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { NgbDate, NgbDateStruct, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { ShareHelperService } from 'services/share-helper-service/share-helper.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';
import { SpatialUnitNotificationModalComponent } from '../spatialUnitNotificationModal/spatial-unit-notification-modal.component';

@Component({
  selector: 'app-kommonitor-legend',
  templateUrl: './kommonitor-legend.component.html',
  styleUrls: ['./kommonitor-legend.component.css']
})
export class KommonitorLegendComponent implements OnInit, OnChanges {

  exchangeData!:DataExchange;
  elementVisibilityData: any;
  visualStyleData: any;
  env!:any;

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

  isDisabledDate;
  datePickerDate;

  @Input() onupdatelegenddisplaydata!:any;

  constructor(
    public dataExchangeService: DataExchangeService,
    private elementVisibilityService: ElementVisibilityHelperService,
    private shareHelperService: ShareHelperService,
    protected visualStyleService: VisualStyleHelperServiceNew,
    protected filterHelperService: FilterHelperService,
    private broadcastService: BroadcastService,
    private modalService: NgbModal
  ) {
    this.exchangeData = this.dataExchangeService.pipedData;
    this.env = window.__env;
  }

  ngOnChanges(changes: any): void {

    if(changes.onupdatelegenddisplaydata) {
      let data = changes.onupdatelegenddisplaydata.currentValue;

      this.dateAsDate = data.dateAsDate;

      this.containsZeroValues = data.containsZeroValues;
      this.containsNegativeValues = data.containsNegativeValues;
      this.containsOutliers_high = data.containsOutliers_high;
      this.containsOutliers_low = data.containsOutliers_low;
      this.outliers_high = data.outliers_high;
      this.outliers_low = data.outliers_low;
      this.containsNoData = data.containsNoData;

      if(data.selectedDate) {
        var dateComponents = data.selectedDate.split("-");
        this.dateAsDate = new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]));
      }
    }
  }
  

  ngOnInit(): void {

      $(document).ready(function() {
        $(".nav li.disabled a").click(function() {
          return false;
        });
      });

      this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
        let title = broadcastMsg.msg;
      });

      
      // todo del timeout
      setTimeout(()=> {
        var dateComponents = this.exchangeData.selectedDate.split("-");
        this.dateAsDate = new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]));
        this.datePickerDate = {year: this.dateAsDate.getFullYear(), month: this.dateAsDate.getMonth() + 1, day: this.dateAsDate.getDate()};
      },2500);

      this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
        let title = broadcastMsg.msg;
        let values:any = broadcastMsg.values;
  
        switch (title) {
          case 'updateLegendDisplay': {
             this.updateLegendDisplay(values);
          } break;
          case 'updateDatePickerAvailableDates': {
            this.onUpdateDatePicker(values);
          } break;
          case 'updateDatePickerSelectedDate': {
            this.onUpdateDatePickerSelectedDate(values);
          } break;
        }
      });
  }

  onUpdateDatePicker([dates]) {

    this.isDisabledDate=(date:NgbDateStruct,current: {month: number,year:number})=> {
      return dates.find(x=>new NgbDate(x.year,x.month,x.day).equals(date))?
        false:true;
    }
  }

  onUpdateDatePickerSelectedDate([date]) {
    this.datePickerDate = {year: date.year, month: date.month, day: date.day};
  }

  updateLegendDisplay([containsZeroValues, containsNegativeValues, containsNoData, containsOutliers_high, containsOutliers_low, outliers_low, outliers_high, selectedDate]) {
    this.containsZeroValues = containsZeroValues;
    this.containsNegativeValues = containsNegativeValues;
    this.containsOutliers_high = containsOutliers_high;
    this.containsOutliers_low = containsOutliers_low;
    this.outliers_high = outliers_high;
    this.outliers_low = outliers_low;
    this.containsNoData = containsNoData;
    var dateComponents = selectedDate.split("-");
    this.dateAsDate = new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]));
    
    this.broadcastService.broadcast("updateClassificationComponent", [this.containsZeroValues, this.containsNegativeValues, this.containsNoData, this.containsOutliers_high, this.containsOutliers_low, this.outliers_low, this.outliers_high, this.exchangeData.selectedDate]);
  }

  filteredSpatialUnits() {
    return this.exchangeData.availableSpatialUnits.filter(e => this.dataExchangeService.isAllowedSpatialUnitForCurrentIndicator(e)!==false);
  }

  onChangeIndicatorDatepickerDate() {
    this.exchangeData.selectedDate = `${this.datePickerDate.year}-${this.datePickerDate.month}-${this.datePickerDate.day}`;
    this.broadcastService.broadcast("changeIndicatorDate",[this.datePickerDate]);
  }

  onChangeSelectedSpatialUnit() {

   this.broadcastService.broadcast("changeSpatialUnit");

    if(this.env.enableSpatialUnitNotificationSelection) {
      if(localStorage.getItem("hideKomMonitorSpatialUnitNotification") && localStorage.getItem("hideKomMonitorSpatialUnitNotification")=== "true") {
        let selectedSpatialUnitName = this.exchangeData.selectedSpatialUnit.spatialUnitLevel;
        if(this.env.spatialUnitNotificationSelection.includes(selectedSpatialUnitName)) {

          this.openSpatialunitModal()
        }
      }
    } 
  }
  
  showSpatialUnitNotificationModalIfEnabled() {
    if(window.__env.enableSpatialUnitNotificationSelection) {
      this.openSpatialunitModal();
    }
  }

  openSpatialunitModal() {
          
    const modalRef = this.modalService.open(SpatialUnitNotificationModalComponent, {windowClass: 'modal-holder', centered: true});
  }

  onClickDownloadMetadata() {
    // create PDF from currently selected/displayed indicator!
    var indicatorMetadata = this.exchangeData.selectedIndicator;
    var pdfName = indicatorMetadata.indicatorName + ".pdf";
    this.dataExchangeService.generateIndicatorMetadataPdf(indicatorMetadata, pdfName, true);	
  }
  
  downloadIndicatorAsGeoJSON() {
    var fileName = this.exchangeData.selectedIndicator.indicatorName + "_" + this.exchangeData.selectedSpatialUnit.spatialUnitLevel;
				  
    var geoJSON_string;
    var geoJSON;

    if(this.exchangeData.isBalanceChecked){
      geoJSON = jQuery.extend(true, {}, this.exchangeData.indicatorAndMetadataAsBalance.geoJSON);
      geoJSON = this.prepareBalanceGeoJSON(geoJSON, this.exchangeData.indicatorAndMetadataAsBalance);							  
      geoJSON_string = JSON.stringify(geoJSON);
      fileName += "_Bilanz" + this.exchangeData.indicatorAndMetadataAsBalance['fromDate'] + " - " + this.exchangeData.indicatorAndMetadataAsBalance['toDate'];
    }
    else{
      geoJSON_string = JSON.stringify(this.dataExchangeService.pipedData.selectedIndicator.geoJSON);
      fileName += "_" + this.exchangeData.selectedDate;
    }			

    this.dataExchangeService.generateAndDownloadIndicatorZIP(geoJSON_string, fileName, ".geojson", {});
  }
  
  downloadIndicatorAsShape() {
    
    var fileName = this.dataExchangeService.pipedData.selectedIndicator.indicatorName + "_" + this.dataExchangeService.pipedData.selectedSpatialUnit.spatialUnitLevel;
    var polygonName = this.dataExchangeService.pipedData.selectedIndicator.indicatorName + "_" + this.dataExchangeService.pipedData.selectedSpatialUnit.spatialUnitLevel;

    var options = {
      folder: "shape",
      types: {
      point: 'points',
      polygon: polygonName,
      line: 'lines'
      }
    };

    var geoJSON;

    if( this.dataExchangeService.pipedData.isBalanceChecked){
      geoJSON = jQuery.extend(true, {},  this.dataExchangeService.pipedData.indicatorAndMetadataAsBalance.geoJSON);
      geoJSON = this.prepareBalanceGeoJSON(geoJSON,  this.dataExchangeService.pipedData.indicatorAndMetadataAsBalance);
      fileName += "_Bilanz_" +  this.dataExchangeService.pipedData.indicatorAndMetadataAsBalance['fromDate'] + " - " +  this.dataExchangeService.pipedData.indicatorAndMetadataAsBalance['toDate'];
    }
    else{
      geoJSON = jQuery.extend(true, {},  this.dataExchangeService.pipedData.selectedIndicator.geoJSON);
      fileName += "_" +  this.dataExchangeService.pipedData.selectedDate;
    }

    for (var feature of geoJSON.features) {
      var properties = feature.properties;

      // rename all properties due to char limit in shaoefiles
      var keys = Object.keys(properties);

      for (var key of keys) {
      var newKey;
      if (key.toLowerCase().includes("featureid")) {
        newKey = "ID";
      }
      else if (key.toLowerCase().includes("featurename")) {
        newKey = "NAME";
      }
      else if (key.toLowerCase().includes("date_")) {
        // from DATE_2018-01-01
        // to 20180101
        newKey = key.split("_")[1].replace(/-|\s/g, "");
      }
      else if (key.toLowerCase().includes("startdate")) {
        newKey = "validFrom";
      }
      else if (key.toLowerCase().includes("enddate")) {
        newKey = "validTo";
      }

      if (newKey) {
        properties[newKey] = properties[key];
        delete properties[key];
      }
      }

      // replace properties with the one with new keys
      feature.properties = properties;
    }

    // shpwrite.download(geoJSON, options);
    // todo
    /* var arrayBuffer = shpwrite.zip(geoJSON, options);							
    this.dataExchangeService.generateAndDownloadIndicatorZIP(arrayBuffer, fileName, "_shape.zip", {base64: true}); */
  }
  
  downloadIndicatorAsCSV() {
    //todo
   /*  var fileName = this.dataExchangeService.pipedData.selectedIndicator.indicatorName + "_" + this.dataExchangeService.pipedData.selectedSpatialUnit.spatialUnitLevel;

    var geoJSON;

    if(this.dataExchangeService.pipedData.isBalanceChecked){
      geoJSON = jQuery.extend(true, {}, this.dataExchangeService.pipedData.indicatorAndMetadataAsBalance.geoJSON);
      geoJSON = this.prepareBalanceGeoJSON(geoJSON, this.dataExchangeService.pipedData.indicatorAndMetadataAsBalance);
      fileName += "_Bilanz_" + this.dataExchangeService.pipedData.indicatorAndMetadataAsBalance['fromDate'] + " - " + this.dataExchangeService.pipedData.indicatorAndMetadataAsBalance['toDate'];
    }
    else{
      geoJSON = jQuery.extend(true, {}, this.dataExchangeService.pipedData.selectedIndicator.geoJSON);
      fileName += "_" + this.dataExchangeService.pipedData.selectedDate;
    }

    var items = [];

    for (var feature of geoJSON.features) {
      var properties = feature.properties;

      // rename all properties due to char limit in shaoefiles
      var keys = Object.keys(properties);

      for (var key of keys) {
      var newKey;
      if (key.toLowerCase().includes("featureid")) {
        newKey = "ID";
      }
      else if (key.toLowerCase().includes("featurename")) {
        newKey = "NAME";
      }
      else if (key.toLowerCase().includes("date_")) {
        // from DATE_2018-01-01
        // to 2018-01-01
        // indicator values should be replaced.
        // replace dot as decimal separator 
        properties[key] = this.dataExchangeService.getIndicatorValue_asFormattedText(properties[key]);
        newKey = key.split("_")[1];
      }
      else if (key.toLowerCase().includes("startdate")) {
        newKey = "validFrom";
      }
      else if (key.toLowerCase().includes("enddate")) {
        newKey = "validTo";
      }

      if (newKey) {
        properties[newKey] = properties[key];
        delete properties[key];
      }
      }

      // replace properties with the one with new keys
      feature.properties = properties;

      items.push(properties);
    }

    // var headers = {};

    // for (const key in items[0]) {
    // 	if (Object.hasOwnProperty.call(items[0], key)) {
    // 		headers[key] = key;									
    // 	}
    // }

    let csv = Papa.unparse(items, {
      quotes: false, //or array of booleans
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ";",
      header: true,
      newline: "\r\n",
      skipEmptyLines: false, //other option is 'greedy', meaning skip delimiters, quotes, and whitespace.
      columns: null //or array of strings
    });

    this.dataExchangeService.pipedData.generateAndDownloadIndicatorZIP(csv, fileName, ".csv", {}); */

    // exportCSVFile(headers, items, fileName);
  }
  
  onClickShareLinkButton() {
    
    this.shareHelperService.generateCurrentShareLink();
							
    /* Copy to clipboard */
    if(navigator && navigator.clipboard){
      navigator.clipboard.writeText(this.shareHelperService.currentShareLink);

      // Get the snackbar DIV
      var x = document.getElementById("snackbar");

      // Add the "show" class to DIV
      x!.className = "show";

      // After 3 seconds, remove the show class from DIV
      setTimeout(function(){ x!.className = x!.className.replace("show", ""); }, 3000);
    }
    else{
      // open in new tab
      window.open(this.shareHelperService.currentShareLink, '_blank');
    }
  }

  prepareBalanceGeoJSON(geoJSON, indicatorMetadataAsBalance){
    var fromDate = indicatorMetadataAsBalance["fromDate"];
    var toDate = indicatorMetadataAsBalance["toDate"];
    var targetDate = this.exchangeData.selectedDate;

    for (var feature of geoJSON.features) {
      var properties = feature.properties;

      var targetValue = properties[this.exchangeData.indicatorDatePrefix + targetDate];
      properties["balance"] = targetValue;

      // rename all properties due to char limit in shaoefiles
      var keys = Object.keys(properties);

      for (var key of keys) {
        if (key.toLowerCase().includes("date_")) {
        // from DATE_2018-01-01
        // to 20180101
        delete properties[key];
        }
      }

      // replace properties with the one with new keys
      feature.properties = properties;
      }

      return geoJSON;
  }

  makeOutliersLowLegendString(outliersArray) {
    if (outliersArray.length > 1) 
      return "(" + this.dataExchangeService.getIndicatorValue_asFormattedText(outliersArray[0]) + " - " + this.dataExchangeService.getIndicatorValue_asFormattedText(outliersArray[outliersArray.length - 1]) + ")";
    else
      return "(" + this.dataExchangeService.getIndicatorValue_asFormattedText(outliersArray[0]) + ")";
  };

  makeOutliersHighLegendString(outliersArray) {
    if (outliersArray.length > 1)
      return "(" + this.dataExchangeService.getIndicatorValue_asFormattedText(outliersArray[0]) + " - " + this.dataExchangeService.getIndicatorValue_asFormattedText(outliersArray[outliersArray.length - 1]) + ")";
    else
      return "(" + this.dataExchangeService.getIndicatorValue_asFormattedText(outliersArray[0]) + ")";
  };

  keywordFilteredWmsDataset() {
    return this.exchangeData.wmsDatasets_keywordFiltered.filter(e => e.isSelected===true);
  }
}
