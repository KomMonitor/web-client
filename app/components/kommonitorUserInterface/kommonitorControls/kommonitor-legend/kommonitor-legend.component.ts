import { jsPDFDocument, jsPDFConstructor } from './../../../../dependencies/jspdf-autotable/index.d';
import { Component, OnInit } from '@angular/core';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';


@Component({
  selector: 'app-kommonitor-legend',
  templateUrl: './kommonitor-legend.component.html',
  styleUrls: ['./kommonitor-legend.component.css']
})
export class KommonitorLegendComponent implements OnInit {

  exchangeData!:DataExchange;
  elementVisibilityData: any;
  env!:any;

  constructor(
    private dataExchange: DataExchangeService,
    private elementVisibility: ElementVisibilityHelperService
  ) {}

  ngOnInit(): void {
      this.exchangeData = this.dataExchange.pipedData;
      this.elementVisibilityData = this.elementVisibility.pipedData;
      console.log(this.elementVisibilityData);
      this.env = window.__env;
  }

  filteredSpatialUnits() {
    return this.exchangeData.availableSpatialUnits.filter(e => this.dataExchange.isAllowedSpatialUnitForCurrentIndicator(e)!==false);
  }

  onChangeIndicatorDatepickerDate() {
    console.log(this.exchangeData.selectedDate);
    // todo
    /* $rootScope.$broadcast("changeIndicatorDate"); */
  }

  onChangeSelectedSpatialUnit() {

    // todo
   /*  $rootScope.$broadcast("changeSpatialUnit");*/

    if(this.env.enableSpatialUnitNotificationSelection) {
      if(localStorage.getItem("hideKomMonitorSpatialUnitNotification") && localStorage.getItem("hideKomMonitorSpatialUnitNotification")=== "true") {
        let selectedSpatialUnitName = this.exchangeData.selectedSpatialUnit.spatialUnitLevel;
        if(this.env.spatialUnitNotificationSelection.includes(selectedSpatialUnitName)) {
          console.log("show - spatialUnitNotificationModal");
          // todo
          /* $('#spatialUnitNotificationModal').modal('show');	 */
        }
      }
    } 
  }

  onClickDownloadMetadata() {
    // create PDF from currently selected/displayed indicator!
    var indicatorMetadata = this.exchangeData.selectedIndicator;
    var pdfName = indicatorMetadata.indicatorName + ".pdf";
    this.dataExchange.generateIndicatorMetadataPdf(indicatorMetadata, pdfName, true);	
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
      geoJSON_string = JSON.stringify(this.dataExchange.selectedIndicator.geoJSON);
      fileName += "_" + this.exchangeData.selectedDate;
    }			

    this.dataExchange.generateAndDownloadIndicatorZIP(geoJSON_string, fileName, ".geojson", {});
  }
  
  downloadIndicatorAsShape() {
    //todo
  }
  
  downloadIndicatorAsCSV() {
    //todo
  }
  
  onClickShareLinkButton() {
    //todo
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
}
