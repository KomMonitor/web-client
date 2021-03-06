angular.module('kommonitorDataGridHelper', ['kommonitorDataExchange']);

angular
  .module('kommonitorDataGridHelper', [])
  .service(
    'kommonitorDataGridHelperService', ['kommonitorDataExchangeService', '$rootScope', '$timeout', '$http', '$httpParamSerializerJQLike', '__env',
    function (kommonitorDataExchangeService, $rootScope, $timeout,
      $http, $httpParamSerializerJQLike, __env) {

      var self = this;
      this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

      this.dataGridOptions_indicators;
      this.dataGridOptions_georesources_poi;
      this.dataGridOptions_georesources_loi;
      this.dataGridOptions_georesources_aoi;
      this.dataGridOptions_spatialUnits;
      this.dataGridOptions_roles;

      function headerHeightGetter() {
        var columnHeaderTexts = [
          ...document.querySelectorAll('.ag-header-cell-text'),
        ];
        var clientHeights = columnHeaderTexts.map(
          headerText => headerText.clientHeight
        );
        var tallestHeaderTextHeight = Math.max(...clientHeights);

        return tallestHeaderTextHeight;
      }

      function headerHeightSetter(gridOptions) {
        var padding = 20;
        var height = headerHeightGetter() + padding;
        gridOptions.api.setHeaderHeight(height);
      }

      var displayEditButtons_indicators = function (params) {

        let html = '<div class="btn-group btn-group-sm">';
        html += '<button id="btn_indicator_editMetadata_' + params.data.indicatorId + '" class="btn btn-warning btn-sm indicatorEditMetadataBtn" type="button" data-toggle="modal" data-target="#modal-edit-indicator-metadata" title="Metadaten editieren"><i class="fas fa-pencil-alt"></i></button>';
        html += '<button id="btn_indicator_editFeatures_' + params.data.indicatorId + '" class="btn btn-warning btn-sm indicatorEditFeaturesBtn" type="button" data-toggle="modal" data-target="#modal-edit-indicator-features" title="Features fortf&uuml;hren"><i class="fas fa-draw-polygon"></i></button>';
        if (kommonitorDataExchangeService.enableKeycloakSecurity) {
          let disabled = params.data.applicableSpatialUnits.length == 0;
          html += '<button id="btn_indicator_editRoleBasedAccess_' + params.data.indicatorId + '"class="btn btn-warning btn-sm indicatorEditRoleBasedAccessBtn ';

          if (disabled) {
            html += 'disabled';
          }

          html += '" type="button" data-toggle="modal" data-target="#modal-edit-indicator-spatial-unit-roles" title="Rollenbasierten Zugriffsschutz editieren"><i class="fas fa-user-lock"></i></button>';
        }
        html += '</div>';

        return html;
      };

      var displayEditButtons_georesources = function (params) {

        let html = '<div class="btn-group btn-group-sm">';
        html += '<button id="btn_georesource_editMetadata_' + params.data.georesourceId + '" class="btn btn-warning btn-sm georesourceEditMetadataBtn" type="button" data-toggle="modal" data-target="#modal-edit-georesource-metadata" title="Metadaten editieren"><i class="fas fa-pencil-alt"></i></button>';
        html += '<button id="btn_georesource_editFeatures_' + params.data.georesourceId + '" class="btn btn-warning btn-sm georesourceEditFeaturesBtn" type="button" data-toggle="modal" data-target="#modal-edit-georesource-features" title="Features fortf&uuml;hren"><i class="fas fa-draw-polygon"></i></button>';
        html += '</div>';

        return html;
      };

      var displayEditButtons_spatialUnits = function (params) {

        let html = '<div class="btn-group btn-group-sm">';
        html += '<button id="btn_spatialUnit_editMetadata_' + params.data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditMetadataBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-metadata" title="Metadaten editieren"><i class="fas fa-pencil-alt"></i></button>';
        html += '<button id="btn_spatialUnit_editFeatures_' + params.data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditFeaturesBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-features" title="Features fortf&uuml;hren"><i class="fas fa-draw-polygon"></i></button>';
        html += '</div>';

        return html;
      };

      var displayEditButtons_roles = function (params) {

        let html = '<div class="btn-group btn-group-sm">';
        html += '<button id="btn_role_editMetadata_' + params.data.roleId + '" class="btn btn-warning btn-sm roleEditMetadataBtn" type="button" data-toggle="modal" data-target="#modal-edit-role-metadata" title="Metadaten editieren"><i class="fas fa-pencil-alt"></i></button>';
        html += '</div>';

        return html;
      };

      this.buildDataGridColumnConfig_indicators = function (indicatorMetadataArray) {
        const columnDefs = [
          { headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 150, checkboxSelection: false, filter: false, sortable: false, cellRenderer: 'displayEditButtons_indicators' },
          { headerName: 'Id', field: "indicatorId", pinned: 'left', maxWidth: 125 },
          { headerName: 'Name', field: "indicatorName", pinned: 'left', minWidth: 300 },
          { headerName: 'Einheit', field: "unit", minWidth: 200 },
          { headerName: 'Beschreibung', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.description; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.description;
            }
          },
          {
            headerName: 'Methodik', minWidth: 400,
            cellRenderer: function (params) {

              if(params.data.processDescription && params.data.processDescription.includes("$$")){
                let splitArray = params.data.processDescription.split("$$");

                for (let index = 0; index < splitArray.length; index++) {
                  if((index % 2) == 0){
                    params.data.processDescription += "<br/>";
                  }                  
                }                
              }
              return params.data.processDescription;
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.processDescription;
            }
          },
          {
            headerName: 'Verfügbare Raumeinheiten', field: "applicableSpatialUnits", minWidth: 400,
            cellRenderer: function (params) {
              /*
                <ul style="columns: 2; 	-webkit-columns: 2;	-moz-columns: 2;">
                  <li style="margin-right: 15px;"
                    ng-repeat="applicableSpatialUnit in indicatorDataset.applicableSpatialUnits">
                    {{::applicableSpatialUnit.spatialUnitName}}
                  </li>
                </ul>
              */
              let html = '<ul style="columns: 2; 	-webkit-columns: 2;	-moz-columns: 2; word-break: break-word !important;">';
              for (const applicableSpatialUnit of params.data.applicableSpatialUnits) {
                html += '<li style="margin-right: 15px;">';
                html += applicableSpatialUnit.spatialUnitName;
                html += '</li>';
              }
              html += '</ul>';
              return html;
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              if (params.data.applicableSpatialUnits && params.data.applicableSpatialUnits.length > 1){
                return "" + JSON.stringify(params.data.applicableSpatialUnits);
              }
              return params.data.applicableSpatialUnits;
            }
          },
          {
            headerName: 'Verfügbare Zeitschnitte', field: "applicableDates", minWidth: 400,
            cellRenderer: function (params) {
              /*
                <ul style="columns: 10; 	-webkit-columns: 10;	-moz-columns: 10;">
                  <li style="margin-right: 15px;"
                    ng-repeat="timestamp in indicatorDataset.applicableDates">
                    {{::timestamp}}
                  </li>
                </ul>
              */
              let html = '<ul style="columns: 5; 	-webkit-columns: 5;	-moz-columns: 5; word-break: break-word !important;">';
              for (const timestamp of params.data.applicableDates) {
                html += '<li style="margin-right: 15px;">';
                html += timestamp;
                html += '</li>';
              }
              html += '</ul>';
              return html;
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              if (params.data.applicableDates && params.data.applicableDates.length > 1){
                return "" + JSON.stringify(params.data.applicableDates);
              }
              return params.data.applicableDates;
            }
          },
          { headerName: 'Kürzel', field: "abbreviation" },
          { headerName: 'Leitindikator', field: "isHeadlineIndicator" },
          { headerName: 'Indikator-Typ', minWidth: 200, 
            cellRenderer: function (params) { return kommonitorDataExchangeService.getIndicatorStringFromIndicatorType(params.data.indicatorType); },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + kommonitorDataExchangeService.getIndicatorStringFromIndicatorType(params.data.indicatorType);
            } 
          },
          { headerName: 'Merkmal', field: "characteristicValue", minWidth: 200 },
          { headerName: 'Art der Fortführung', field: "creationType", minWidth: 200 },
          // { headerName: 'Interpretation', minWidth: 400, cellRenderer: function(params){ return params.data.interpretation; } },

          { headerName: 'Tags/Stichworte', field: "tags", minWidth: 250 },
          { headerName: 'Themenhierarchie', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getTopicHierarchyDisplayString(params.data.topicReference); },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + kommonitorDataExchangeService.getTopicHierarchyDisplayString(params.data.topicReference);
            }
          },
          { headerName: 'Datenquelle', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.datasource; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.datasource;
            }
          },
          { headerName: 'Datenhalter und Kontakt', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.contact; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.contact;
            }
          },
        ];

        return columnDefs;
      };

      this.buildDataGridRowData_indicators = function (indicatorMetadataArray) {
        return indicatorMetadataArray;
      };


      this.buildDataGridColumnConfig_georesources_poi = function (georesourceMetadataArray) {
        const columnDefs = [
          { headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 150, checkboxSelection: true, headerCheckboxSelection: true, 
          headerCheckboxSelectionFilteredOnly: true, filter: false, sortable: false, cellRenderer: 'displayEditButtons_georesources' },
          { headerName: 'Id', field: "georesourceId", pinned: 'left', maxWidth: 125 },
          { headerName: 'Name', field: "datasetName", pinned: 'left', minWidth: 300 },
          { headerName: 'Symbolfarbe', filter: false, sortable: false, maxWidth: 125, cellRenderer: function (params) { return "<div>" + params.data.poiSymbolColor+ "</div><br/><div style='width: 20px; height: 20px; background-color: " + params.data.poiSymbolColor + ";'></div>"; } },
          { headerName: 'Symbolname', maxWidth: 125, 
            cellRenderer: function (params) { return params.data.poiSymbolBootstrap3Name + "<br/><br/> <span class='glyphicon glyphicon-" + params.data.poiSymbolBootstrap3Name + "'></span>"; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.poiSymbolBootstrap3Name;
            } 
          },
          { headerName: 'Markerfarbe', filter: false, sortable: false, maxWidth: 125, cellRenderer: function (params) { return "<div>" + params.data.poiMarkerColor+ "</div><br/><div style='width: 20px; height: 20px; background-color: " + params.data.poiMarkerColor + ";'></div>"; } },
          { headerName: 'Beschreibung', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.description; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.description;
            }
          },
          {
            headerName: 'Gültigkeitszeitraum', minWidth: 400,
            cellRenderer: function (params) {
              /*
                <ul style="columns: 10; 	-webkit-columns: 10;	-moz-columns: 10;">
												<li style="margin-right: 15px;" ng-repeat="periodOfValidity in poiDataset.availablePeriodsOfValidity">
													<p ng-show="periodOfValidity.endDate">{{::periodOfValidity.startDate}} - {{::periodOfValidity.endDate}}</p>
													<p ng-show="! periodOfValidity.endDate">{{::periodOfValidity.startDate}} - heute </p>
												</li>
											</ul>
              */
              let html = '<ul style="columns: 5; 	-webkit-columns: 5;	-moz-columns: 5; word-break: break-word !important;">';
              for (const periodOfValidity of params.data.availablePeriodsOfValidity) {
                html += '<li style="margin-right: 15px;">';

                if(periodOfValidity.endDate){
                  html += "<p>" + periodOfValidity.startDate + " &dash; " + periodOfValidity.endDate + "</p>" ;
                }
                else{
                  html += "<p>" + periodOfValidity.startDate + " &dash; heute</p>";
                }                
                html += '</li>';
              }
              html += '</ul>';
              return html;
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              if (params.data.availablePeriodsOfValidity && params.data.availablePeriodsOfValidity.length > 1){
                return "" + JSON.stringify(params.data.availablePeriodsOfValidity);
              }
              return params.data.availablePeriodsOfValidity;
            }
          },
          { headerName: 'Themenhierarchie', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getTopicHierarchyDisplayString(params.data.topicReference); },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + kommonitorDataExchangeService.getTopicHierarchyDisplayString(params.data.topicReference);
            }
          },
          { headerName: 'Datenquelle', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.datasource; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.datasource;
            }
          },
          { headerName: 'Datenhalter und Kontakt', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.contact; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.contact;
            }
          },
        ];

        return columnDefs;
      };

      this.buildDataGridColumnConfig_georesources_loi = function (georesourceMetadataArray) {
        const columnDefs = [
          { headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 150, checkboxSelection: true, headerCheckboxSelection: true, 
            headerCheckboxSelectionFilteredOnly: true, filter: false, sortable: false, cellRenderer: 'displayEditButtons_georesources' },
          { headerName: 'Id', field: "georesourceId", pinned: 'left', maxWidth: 125 },
          { headerName: 'Name', field: "datasetName", pinned: 'left', minWidth: 300 },
          { headerName: 'Linienfarbe', filter: false, sortable: false, maxWidth: 125, cellRenderer: function (params) { return "<div>" + params.data.loiColor+ "</div><br/> <div style='width: 20px; height: 20px; background-color: " + params.data.loiColor + ";'></div>"; } },
          { headerName: 'Linienbreite', maxWidth: 125, field: "loiWidth"},
          { headerName: 'Linienmuster', filter: false, sortable: false, maxWidth: 125, cellRenderer: function (params) { return "<div>" + kommonitorDataExchangeService.getLoiDashSvgFromStringValue(params.data.loiDashArrayString) +  "</div>"; } },
          { headerName: 'Beschreibung', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.description; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.description;
            }
          },
          {
            headerName: 'Gültigkeitszeitraum', minWidth: 400,
            cellRenderer: function (params) {
              /*
                <ul style="columns: 10; 	-webkit-columns: 10;	-moz-columns: 10;">
												<li style="margin-right: 15px;" ng-repeat="periodOfValidity in poiDataset.availablePeriodsOfValidity">
													<p ng-show="periodOfValidity.endDate">{{::periodOfValidity.startDate}} - {{::periodOfValidity.endDate}}</p>
													<p ng-show="! periodOfValidity.endDate">{{::periodOfValidity.startDate}} - heute </p>
												</li>
											</ul>
              */
              let html = '<ul style="columns: 5; 	-webkit-columns: 5;	-moz-columns: 5; word-break: break-word !important;">';
              for (const periodOfValidity of params.data.availablePeriodsOfValidity) {
                html += '<li style="margin-right: 15px;">';

                if(periodOfValidity.endDate){
                  html += "<p>" + periodOfValidity.startDate + " &dash; " + periodOfValidity.endDate + "</p>" ;
                }
                else{
                  html += "<p>" + periodOfValidity.startDate + " &dash; heute</p>";
                }                
                html += '</li>';
              }
              html += '</ul>';
              return html;
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              if (params.data.availablePeriodsOfValidity && params.data.availablePeriodsOfValidity.length > 1){
                return "" + JSON.stringify(params.data.availablePeriodsOfValidity);
              }
              return params.data.availablePeriodsOfValidity;
            }
          },
          { headerName: 'Themenhierarchie', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getTopicHierarchyDisplayString(params.data.topicReference); },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + kommonitorDataExchangeService.getTopicHierarchyDisplayString(params.data.topicReference);
            }
          },
          { headerName: 'Datenquelle', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.datasource; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.datasource;
            }
          },
          { headerName: 'Datenhalter und Kontakt', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.contact; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.contact;
            }
          },
        ];

        return columnDefs;
      };

      this.buildDataGridColumnConfig_georesources_aoi = function (georesourceMetadataArray) {
        const columnDefs = [
          { headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 150, checkboxSelection: true, headerCheckboxSelection: true, 
            headerCheckboxSelectionFilteredOnly: true, filter: false, sortable: false, cellRenderer: 'displayEditButtons_georesources' },
          { headerName: 'Id', field: "georesourceId", pinned: 'left', maxWidth: 125 },
          { headerName: 'Name', field: "datasetName", pinned: 'left', minWidth: 300 },
          { headerName: 'Polygonfarbe', filter: false, sortable: false, maxWidth: 125, cellRenderer: function (params) { return "<div>" + params.data.aoiColor+ "</div><br/> <div style='width: 20px; height: 20px; background-color: " + params.data.aoiColor + ";'></div>"; } },
          { headerName: 'Beschreibung', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.description; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.description;
            }
          },
          {
            headerName: 'Gültigkeitszeitraum', minWidth: 400,
            cellRenderer: function (params) {
              /*
                <ul style="columns: 10; 	-webkit-columns: 10;	-moz-columns: 10;">
												<li style="margin-right: 15px;" ng-repeat="periodOfValidity in poiDataset.availablePeriodsOfValidity">
													<p ng-show="periodOfValidity.endDate">{{::periodOfValidity.startDate}} - {{::periodOfValidity.endDate}}</p>
													<p ng-show="! periodOfValidity.endDate">{{::periodOfValidity.startDate}} - heute </p>
												</li>
											</ul>
              */
              let html = '<ul style="columns: 5; 	-webkit-columns: 5;	-moz-columns: 5; word-break: break-word !important;">';
              for (const periodOfValidity of params.data.availablePeriodsOfValidity) {
                html += '<li style="margin-right: 15px;">';

                if(periodOfValidity.endDate){
                  html += "<p>" + periodOfValidity.startDate + " &dash; " + periodOfValidity.endDate + "</p>" ;
                }
                else{
                  html += "<p>" + periodOfValidity.startDate + " &dash; heute</p>";
                }                
                html += '</li>';
              }
              html += '</ul>';
              return html;
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              if (params.data.availablePeriodsOfValidity && params.data.availablePeriodsOfValidity.length > 1){
                return "" + JSON.stringify(params.data.availablePeriodsOfValidity);
              }
              return params.data.availablePeriodsOfValidity;
            }
          },
          { headerName: 'Themenhierarchie', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getTopicHierarchyDisplayString(params.data.topicReference); },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + kommonitorDataExchangeService.getTopicHierarchyDisplayString(params.data.topicReference);
            }
          },
          { headerName: 'Datenquelle', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.datasource; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.datasource;
            }
          },
          { headerName: 'Datenhalter und Kontakt', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.contact; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.contact;
            }
          },
        ];

        return columnDefs;
      };

      this.buildDataGridRowData_georesources_poi = function (georesourceMetadataArray) {
        return georesourceMetadataArray.filter(georesourceMetadata => georesourceMetadata.isPOI);
      };

      this.buildDataGridRowData_georesources_loi = function (georesourceMetadataArray) {
        return georesourceMetadataArray.filter(georesourceMetadata => georesourceMetadata.isLOI);
      };

      this.buildDataGridRowData_georesources_aoi = function (georesourceMetadataArray) {
        return georesourceMetadataArray.filter(georesourceMetadata => georesourceMetadata.isAOI);
      };

      this.getSelectedGeoresourcesMetadata = function(){
        let georesourceMetadataArray = [];

        //POI
        if (this.dataGridOptions_georesources_poi && this.dataGridOptions_georesources_poi.api){
          let selectedPoiNodes = this.dataGridOptions_georesources_poi.api.getSelectedNodes();

          for (const selectedPoiNode of selectedPoiNodes) {
            georesourceMetadataArray.push(selectedPoiNode.data);
          }
        }

        //LOI
        if (this.dataGridOptions_georesources_loi && this.dataGridOptions_georesources_loi.api){
          let selectedLoiNodes = this.dataGridOptions_georesources_loi.api.getSelectedNodes();

          for (const selectedLoiNode of selectedLoiNodes) {
            georesourceMetadataArray.push(selectedLoiNode.data);
          }
        }

        //AOI
        if (this.dataGridOptions_georesources_aoi && this.dataGridOptions_georesources_aoi.api){
          let selectedAoiNodes = this.dataGridOptions_georesources_aoi.api.getSelectedNodes();

          for (const selectedAoiNode of selectedAoiNodes) {
            georesourceMetadataArray.push(selectedAoiNode.data);
          }
        }

        return georesourceMetadataArray;
      };

      this.buildDataGridRowData_spatialUnits = function (spatialUnitMetadataArray) {
        return spatialUnitMetadataArray;
      };

      this.buildDataGridColumnConfig_spatialUnits = function (spatialUnitMetadataArray) {
        const columnDefs = [
          { headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 150, checkboxSelection: true, headerCheckboxSelection: true, 
          headerCheckboxSelectionFilteredOnly: true, filter: false, sortable: false, cellRenderer: 'displayEditButtons_spatialUnits' },
          { headerName: 'Id', field: "spatialUnitId", pinned: 'left', maxWidth: 125 },
          { headerName: 'Name', field: "spatialUnitLevel", pinned: 'left', minWidth: 300 },
          { headerName: 'Beschreibung', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.description; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.description;
            }
          },
          { headerName: 'Nächst niedrigere Raumebene', field: "nextLowerHierarchyLevel", minWidth: 250 },
          { headerName: 'Nächst höhere Raumebene', field: "nextUpperHierarchyLevel", minWidth: 250 },          
          {
            headerName: 'Gültigkeitszeitraum', minWidth: 400,
            cellRenderer: function (params) {
              /*
                <ul style="columns: 10; 	-webkit-columns: 10;	-moz-columns: 10;">
												<li style="margin-right: 15px;" ng-repeat="periodOfValidity in poiDataset.availablePeriodsOfValidity">
													<p ng-show="periodOfValidity.endDate">{{::periodOfValidity.startDate}} - {{::periodOfValidity.endDate}}</p>
													<p ng-show="! periodOfValidity.endDate">{{::periodOfValidity.startDate}} - heute </p>
												</li>
											</ul>
              */
              let html = '<ul style="columns: 5; 	-webkit-columns: 5;	-moz-columns: 5; word-break: break-word !important;">';
              for (const periodOfValidity of params.data.availablePeriodsOfValidity) {
                html += '<li style="margin-right: 15px;">';

                if(periodOfValidity.endDate){
                  html += "<p>" + periodOfValidity.startDate + " &dash; " + periodOfValidity.endDate + "</p>" ;
                }
                else{
                  html += "<p>" + periodOfValidity.startDate + " &dash; heute</p>";
                }                
                html += '</li>';
              }
              html += '</ul>';
              return html;
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              if (params.data.availablePeriodsOfValidity && params.data.availablePeriodsOfValidity.length > 1){
                return "" + JSON.stringify(params.data.availablePeriodsOfValidity);
              }
              return params.data.availablePeriodsOfValidity;
            }
          },
          { headerName: 'Datenquelle', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.datasource; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.datasource;
            }
          },
          { headerName: 'Datenhalter und Kontakt', minWidth: 400, cellRenderer: function (params) { return params.data.metadata.contact; },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return "" + params.data.metadata.contact;
            }
          },
        ];

        return columnDefs;
      };

      this.getSelectedSpatialUnitsMetadata = function(){
        let spatialUnitsMetadataArray = [];

        if (this.dataGridOptions_spatialUnits && this.dataGridOptions_spatialUnits.api){
          let selectedNodes = this.dataGridOptions_spatialUnits.api.getSelectedNodes();

          for (const selectedNode of selectedNodes) {
            spatialUnitsMetadataArray.push(selectedNode.data);
          }
        }

        return spatialUnitsMetadataArray;
      };

      this.getSelectedRolesMetadata = function(){
        let rolesMetadataArray = [];

        if (this.dataGridOptions_roles && this.dataGridOptions_roles.api){
          let selectedNodes = this.dataGridOptions_roles.api.getSelectedNodes();

          for (const selectedNode of selectedNodes) {
            rolesMetadataArray.push(selectedNode.data);
          }
        }

        return rolesMetadataArray;
      };

      this.getSelectedScriptsMetadata = function(){
        let scriptsMetadataArray = [];

        if (this.dataGridOptions_scripts && this.dataGridOptions_scripts.api){
          let selectedNodes = this.dataGridOptions_scripts.api.getSelectedNodes();

          for (const selectedNode of selectedNodes) {
            scriptsMetadataArray.push(selectedNode.data);
          }
        }

        return scriptsMetadataArray;
      };

      this.buildDataGridOptions_indicators = function (indicatorMetadataArray) {
        let columnDefs = this.buildDataGridColumnConfig_indicators(indicatorMetadataArray);
        let rowData = this.buildDataGridRowData_indicators(indicatorMetadataArray);

        let gridOptions = {
          defaultColDef: {
            editable: false,
            sortable: true,
            flex: 1,
            minWidth: 200,
            filter: true,
            floatingFilter: true,
            // filterParams: {
            //   newRowsAction: 'keep'
            // },
            resizable: true,
            wrapText: true,
            autoHeight: true,
            cellStyle: { 'font-size': '12px;', 'white-space': 'normal !important', "line-height": "20px !important", "word-break": "break-word !important", "padding-top": "17px", "padding-bottom": "17px" },
            headerComponentParams: {
              template:
                '<div class="ag-cell-label-container" role="presentation">' +
                '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
                '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
                '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
                '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
                '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
                '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
                '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
                '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
                '  </div>' +
                '</div>',
            },
          },
          components: {
            displayEditButtons_indicators: displayEditButtons_indicators
          },
          columnDefs: columnDefs,
          rowData: rowData,
          enableCellTextSelection: true,
          ensureDomOrder: true,
          pagination: true,
          paginationPageSize: 10,
          suppressColumnVirtualisation: true,
          // rowHeight: 200,
          onGridReady: function () {
            // self.registerClickHandler_indicators(indicatorMetadataArray);
          },
          onFirstDataRendered: function () {
            headerHeightSetter(self.dataGridOptions_indicators);
            // self.registerClickHandler_indicators(indicatorMetadataArray);
          },
          onColumnResized: function () {
            headerHeightSetter(self.dataGridOptions_indicators);
            // self.registerClickHandler_indicators(indicatorMetadataArray);
          },
          // onModelUpdated: function () {
          //   // self.registerClickHandler_indicators(indicatorMetadataArray);
            
          // },
          onRowDataChanged: function () {
            self.registerClickHandler_indicators(indicatorMetadataArray);
          },
          // onPaginationChanged: function () {
          //   self.registerClickHandler_indicators(indicatorMetadataArray);
          // },
          onViewportChanged: function () {
            self.registerClickHandler_indicators(indicatorMetadataArray);
            setTimeout(function () {
              let domNode = document.querySelector('#indicatorOverviewTable');              
              // if (domNode) {
              //   MathJax.typesetPromise();
              // }
              MathJax.typesetPromise().then(function (){
                // setTimeout(function () {
                //   self.dataGridOptions_indicators.api.resetRowHeights();
                // }, 1000);
                self.dataGridOptions_indicators.api.resetRowHeights();
              });

              // setTimeout(function () {
              //   self.dataGridOptions_indicators.api.resetRowHeights();
              // }, 1000);
            }, 250);        
          },

        };

        return gridOptions;
      };

      this.registerClickHandler_indicators = function (indicatorMetadataArray) {

        // for (const indicatorMetadata of indicatorMetadataArray) {
        //   $( "#btn_indicator_editMetadata_" + indicatorMetadata.indicatorId).click(function() {
        //     let indicatorId = this.id.split("_")[3];

        //     let indicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);

        //     $rootScope.$broadcast("onEditIndicatorMetadata", indicatorMetadata);
        //   });
        // }
        $(".indicatorEditMetadataBtn").on("click", function () {
          let indicatorId = this.id.split("_")[3];

          let indicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);

          $rootScope.$broadcast("onEditIndicatorMetadata", indicatorMetadata);
        });

        $(".indicatorEditFeaturesBtn").on("click", function () {
          let indicatorId = this.id.split("_")[3];

          let indicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);

          $rootScope.$broadcast("onEditIndicatorFeatures", indicatorMetadata);
        });

        $(".indicatorEditRoleBasedAccessBtn").on("click", function () {
          let indicatorId = this.id.split("_")[3];

          let indicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);

          $rootScope.$broadcast("onEditIndicatorSpatialUnitRoles", indicatorMetadata);
        });

      };

      this.registerClickHandler_georesources = function (georesourceMetadataArray) {

        $(".georesourceEditMetadataBtn").on("click", function () {
          let georesourceId = this.id.split("_")[3];

          let georesourceMetadata = kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceId);

          $rootScope.$broadcast("onEditGeoresourceMetadata", georesourceMetadata);
        });

        $(".georesourceEditFeaturesBtn").on("click", function () {
          let georesourceId = this.id.split("_")[3];

          let georesourceMetadata = kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceId);

          $rootScope.$broadcast("onEditGeoresourceFeatures", georesourceMetadata);
        });

      };

      this.buildDataGrid_indicators = function (indicatorMetadataArray) {
        if (this.dataGridOptions_indicators && this.dataGridOptions_indicators.api) {

          this.saveGridStore(this.dataGridOptions_indicators);
          let newRowData = this.buildDataGridRowData_indicators(indicatorMetadataArray);
          this.dataGridOptions_indicators.api.setRowData(newRowData);
          this.restoreGridStore(this.dataGridOptions_indicators);
        }
        else {
          this.dataGridOptions_indicators = this.buildDataGridOptions_indicators(indicatorMetadataArray);
          let gridDiv = document.querySelector('#indicatorOverviewTable');
          new agGrid.Grid(gridDiv, this.dataGridOptions_indicators);
        }
      };

      this.buildDataGridOptions_georesources_poi = function (georesourceMetadataArray) {
        let columnDefs = this.buildDataGridColumnConfig_georesources_poi(georesourceMetadataArray);
        let rowData = this.buildDataGridRowData_georesources_poi(georesourceMetadataArray);

        let gridOptions = {
          defaultColDef: {
            editable: false,
            sortable: true,
            flex: 1,
            minWidth: 200,
            filter: true,
            floatingFilter: true,
            // filterParams: {
            //   newRowsAction: 'keep'
            // },
            resizable: true,
            wrapText: true,
            autoHeight: true,
            cellStyle: { 'font-size': '12px;', 'white-space': 'normal !important', "line-height": "20px !important", "word-break": "break-word !important", "padding-top": "17px", "padding-bottom": "17px" },
            headerComponentParams: {
              template:
                '<div class="ag-cell-label-container" role="presentation">' +
                '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
                '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
                '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
                '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
                '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
                '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
                '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
                '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
                '  </div>' +
                '</div>',
            },
          },
          components: {
            displayEditButtons_georesources: displayEditButtons_georesources
          },
          columnDefs: columnDefs,
          rowData: rowData,
          suppressRowClickSelection: true,
          rowSelection: 'multiple',
          enableCellTextSelection: true,
          ensureDomOrder: true,
          pagination: true,
          paginationPageSize: 10,
          suppressColumnVirtualisation: true,          
          onFirstDataRendered: function () {
            headerHeightSetter(self.dataGridOptions_georesources_poi);
          },
          onColumnResized: function () {
            headerHeightSetter(self.dataGridOptions_georesources_poi);
          },    
          onRowDataChanged: function () {
            self.registerClickHandler_georesources(georesourceMetadataArray);
          },      
          onViewportChanged: function () {
            self.registerClickHandler_georesources(georesourceMetadataArray);                   
          },

        };

        return gridOptions;
      };

      this.buildDataGridOptions_georesources_loi = function (georesourceMetadataArray) {
        let columnDefs = this.buildDataGridColumnConfig_georesources_loi(georesourceMetadataArray);
        let rowData = this.buildDataGridRowData_georesources_loi(georesourceMetadataArray);

        let gridOptions = {
          defaultColDef: {
            editable: false,
            sortable: true,
            flex: 1,
            minWidth: 200,
            filter: true,
            floatingFilter: true,
            // filterParams: {
            //   newRowsAction: 'keep'
            // },
            resizable: true,
            wrapText: true,
            autoHeight: true,
            cellStyle: { 'font-size': '12px;', 'white-space': 'normal !important', "line-height": "20px !important", "word-break": "break-word !important", "padding-top": "17px", "padding-bottom": "17px" },
            headerComponentParams: {
              template:
                '<div class="ag-cell-label-container" role="presentation">' +
                '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
                '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
                '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
                '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
                '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
                '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
                '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
                '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
                '  </div>' +
                '</div>',
            },
          },
          components: {
            displayEditButtons_georesources: displayEditButtons_georesources
          },
          columnDefs: columnDefs,
          rowData: rowData,
          suppressRowClickSelection: true,
          rowSelection: 'multiple',
          enableCellTextSelection: true,
          ensureDomOrder: true,
          pagination: true,
          paginationPageSize: 10,
          suppressColumnVirtualisation: true,          
          onFirstDataRendered: function () {
            headerHeightSetter(self.dataGridOptions_georesources_loi);
          },
          onColumnResized: function () {
            headerHeightSetter(self.dataGridOptions_georesources_loi);
          },          
          onRowDataChanged: function () {
            self.registerClickHandler_georesources(georesourceMetadataArray);
          }, 
          onViewportChanged: function () {
            self.registerClickHandler_georesources(georesourceMetadataArray);                   
          },

        };

        return gridOptions;
      };

      this.buildDataGridOptions_georesources_aoi = function (georesourceMetadataArray) {
        let columnDefs = this.buildDataGridColumnConfig_georesources_aoi(georesourceMetadataArray);
        let rowData = this.buildDataGridRowData_georesources_aoi(georesourceMetadataArray);

        let gridOptions = {
          defaultColDef: {
            editable: false,
            sortable: true,
            flex: 1,
            minWidth: 200,
            filter: true,
            floatingFilter: true,
            // filterParams: {
            //   newRowsAction: 'keep'
            // },
            resizable: true,
            wrapText: true,
            autoHeight: true,
            cellStyle: { 'font-size': '12px;', 'white-space': 'normal !important', "line-height": "20px !important", "word-break": "break-word !important", "padding-top": "17px", "padding-bottom": "17px" },
            headerComponentParams: {
              template:
                '<div class="ag-cell-label-container" role="presentation">' +
                '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
                '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
                '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
                '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
                '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
                '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
                '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
                '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
                '  </div>' +
                '</div>',
            },
          },
          components: {
            displayEditButtons_georesources: displayEditButtons_georesources
          },
          columnDefs: columnDefs,
          rowData: rowData,
          suppressRowClickSelection: true,
          rowSelection: 'multiple',
          enableCellTextSelection: true,
          ensureDomOrder: true,
          pagination: true,
          paginationPageSize: 10,
          suppressColumnVirtualisation: true,          
          onFirstDataRendered: function () {
            headerHeightSetter(self.dataGridOptions_georesources_aoi);
          },
          onColumnResized: function () {
            headerHeightSetter(self.dataGridOptions_georesources_aoi);
          },    
          onRowDataChanged: function () {
            self.registerClickHandler_georesources(georesourceMetadataArray);
          },       
          onViewportChanged: function () {
            self.registerClickHandler_georesources(georesourceMetadataArray);                   
          },

        };

        return gridOptions;
      };

      this.buildDataGridOptions_spatialUnits = function (spatialUnitMetadataArray) {
        let columnDefs = this.buildDataGridColumnConfig_spatialUnits(spatialUnitMetadataArray);
        let rowData = this.buildDataGridRowData_spatialUnits(spatialUnitMetadataArray);

        let gridOptions = {
          defaultColDef: {
            editable: false,
            sortable: true,
            flex: 1,
            minWidth: 200,
            filter: true,
            floatingFilter: true,
            // filterParams: {
            //   newRowsAction: 'keep'
            // },
            resizable: true,
            wrapText: true,
            autoHeight: true,
            cellStyle: { 'font-size': '12px;', 'white-space': 'normal !important', "line-height": "20px !important", "word-break": "break-word !important", "padding-top": "17px", "padding-bottom": "17px" },
            headerComponentParams: {
              template:
                '<div class="ag-cell-label-container" role="presentation">' +
                '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
                '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
                '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
                '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
                '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
                '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
                '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
                '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
                '  </div>' +
                '</div>',
            },
          },
          components: {
            displayEditButtons_spatialUnits: displayEditButtons_spatialUnits
          },
          columnDefs: columnDefs,
          rowData: rowData,
          suppressRowClickSelection: true,
          rowSelection: 'multiple',
          enableCellTextSelection: true,
          ensureDomOrder: true,
          pagination: true,
          paginationPageSize: 10,
          suppressColumnVirtualisation: true,          
          onFirstDataRendered: function () {
            headerHeightSetter(self.dataGridOptions_spatialUnits);
          },
          onColumnResized: function () {
            headerHeightSetter(self.dataGridOptions_spatialUnits);
          },        
          onRowDataChanged: function () {
            self.registerClickHandler_spatialUnits(spatialUnitMetadataArray);
          },   
          onViewportChanged: function () {
            self.registerClickHandler_spatialUnits(spatialUnitMetadataArray);                   
          },

        };

        return gridOptions;
      };

      this.registerClickHandler_spatialUnits = function (spatialUnitMetadataArray) {

        $(".spatialUnitEditMetadataBtn").on("click", function () {
          let spatialUnitId = this.id.split("_")[3];

          let spatialUnitMetadata = kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);

          $rootScope.$broadcast("onEditSpatialUnitMetadata", spatialUnitMetadata);
        });

        $(".spatialUnitEditFeaturesBtn").on("click", function () {
          let spatialUnitId = this.id.split("_")[3];

          let spatialUnitMetadata = kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);

          $rootScope.$broadcast("onEditSpatialUnitFeatures", spatialUnitMetadata);
        });

      };

      this.buildDataGrid_georesources = function (georesourceMetadataArray) {
        // POI
        if (this.dataGridOptions_georesources_poi && this.dataGridOptions_georesources_poi.api) {

          this.saveGridStore(this.dataGridOptions_georesources_poi);
          let newRowData = this.buildDataGridRowData_georesources_poi(georesourceMetadataArray);
          this.dataGridOptions_georesources_poi.api.setRowData(newRowData);
          this.restoreGridStore(this.dataGridOptions_georesources_poi);
        }
        else {
          this.dataGridOptions_georesources_poi = this.buildDataGridOptions_georesources_poi(georesourceMetadataArray);
          let gridDiv = document.querySelector('#poiOverviewTable');
          new agGrid.Grid(gridDiv, this.dataGridOptions_georesources_poi);
        }

        // LOI
        if (this.dataGridOptions_georesources_loi && this.dataGridOptions_georesources_loi.api) {

          this.saveGridStore(this.dataGridOptions_georesources_loi);
          let newRowData = this.buildDataGridRowData_georesources_loi(georesourceMetadataArray);
          this.dataGridOptions_georesources_loi.api.setRowData(newRowData);
          this.restoreGridStore(this.dataGridOptions_georesources_loi);
        }
        else {
          this.dataGridOptions_georesources_loi = this.buildDataGridOptions_georesources_loi(georesourceMetadataArray);
          let gridDiv = document.querySelector('#loiOverviewTable');
          new agGrid.Grid(gridDiv, this.dataGridOptions_georesources_loi);
        }

        // AOI
        if (this.dataGridOptions_georesources_aoi && this.dataGridOptions_georesources_aoi.api) {

          this.saveGridStore(this.dataGridOptions_georesources_aoi);
          let newRowData = this.buildDataGridRowData_georesources_aoi(georesourceMetadataArray);
          this.dataGridOptions_georesources_aoi.api.setRowData(newRowData);
          this.restoreGridStore(this.dataGridOptions_georesources_aoi);
        }
        else {
          this.dataGridOptions_georesources_aoi = this.buildDataGridOptions_georesources_aoi(georesourceMetadataArray);
          let gridDiv = document.querySelector('#aoiOverviewTable');
          new agGrid.Grid(gridDiv, this.dataGridOptions_georesources_aoi);
        }
      };

      this.buildDataGrid_spatialUnits = function (spatialUnitMetadataArray) {
        
        if (this.dataGridOptions_spatialUnits && this.dataGridOptions_spatialUnits.api) {

          this.saveGridStore(this.dataGridOptions_spatialUnits);
          let newRowData = this.buildDataGridRowData_spatialUnits(spatialUnitMetadataArray);
          this.dataGridOptions_spatialUnits.api.setRowData(newRowData);
          this.restoreGridStore(this.dataGridOptions_spatialUnits);
        }
        else {
          this.dataGridOptions_spatialUnits = this.buildDataGridOptions_spatialUnits(spatialUnitMetadataArray);
          let gridDiv = document.querySelector('#spatialUnitOverviewTable');
          new agGrid.Grid(gridDiv, this.dataGridOptions_spatialUnits);
        }
      };

      // FEATURE TABLES

      this.buildDataGridColumnConfig_featureTable = function(specificHeadersArray){
        const columnDefs = [
          { headerName: 'Id', field: __env.FEATURE_ID_PROPERTY_NAME, pinned: 'left', maxWidth: 125 },
          { headerName: 'Name', field: __env.FEATURE_NAME_PROPERTY_NAME, pinned: 'left', minWidth: 300 },  
          // { headerName: 'Id', field: __env.FEATURE_ID_PROPERTY_NAME,  maxWidth: 125 },
          // { headerName: 'Name', field: __env.FEATURE_NAME_PROPERTY_NAME,  minWidth: 300 },         
          {
            headerName: 'Gültigkeitszeitraum', minWidth: 400,
            cellRenderer: function (params) {
              let html = '<p>';

              if (params.data.validEndDate){
                html += params.data.validStartDate + " &dash; " + params.data.validEndDate;
              }
              else{
                html += params.data.validStartDate + " &dash; heute";
              }

              html += "</p>";

              return html;
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              if (params.data.validEndDate){
                return "" + params.data.validStartDate + " " + params.data.validEndDate;
              }
              return params.data.validStartDate;
            }
          }
        ];

        for (const header of specificHeadersArray) {
          columnDefs.push({ headerName: "" + header, field: "" + header, minWidth: 200 });
        }

        return columnDefs;
      };

      this.buildDataGridRowData_featureTable = function(dataArray){
        if(dataArray[0] && dataArray[0].properties){
          return dataArray.map(dataItem => dataItem.properties);
        }
        
        return dataArray;
      };

      this.buildDataGridOptions_featureTable = function(specificHeadersArray, dataArray){
          let columnDefs = this.buildDataGridColumnConfig_featureTable(specificHeadersArray);
          let rowData = this.buildDataGridRowData_featureTable(dataArray);
  
          let gridOptions = {
            defaultColDef: {
              editable: false,
              sortable: true,
              flex: 1,
              minWidth: 200,
              filter: true,
              floatingFilter: true,
              // filterParams: {
              //   newRowsAction: 'keep'
              // },
              resizable: true,
              wrapText: true,
              autoHeight: true,
              cellStyle: { 'font-size': '12px;', 'white-space': 'normal !important', "line-height": "20px !important", "word-break": "break-word !important", "padding-top": "17px", "padding-bottom": "17px" },
              headerComponentParams: {
                template:
                  '<div class="ag-cell-label-container" role="presentation">' +
                  '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
                  '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
                  '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
                  '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
                  '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
                  '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
                  '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
                  '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
                  '  </div>' +
                  '</div>',
              },
            },
            columnDefs: columnDefs,
            rowData: rowData,
            suppressRowClickSelection: true,
            // rowSelection: 'multiple',
            enableCellTextSelection: true,
            ensureDomOrder: true,
            pagination: true,
            paginationPageSize: 10,
            suppressColumnVirtualisation: true,          
            // onFirstDataRendered: function () {
            //   headerHeightSetter(this);
            // },
            // onColumnResized: function () {
            //   headerHeightSetter(this);
            // }
  
          };
  
          return gridOptions;        
      };

      this.buildDataGrid_featureTable = function (domElementId, specificHeadersArray, dataArray) {
        
          let dataGridOptions_featureTable = this.buildDataGridOptions_featureTable(specificHeadersArray, dataArray);
          let gridDiv = document.querySelector('#' + domElementId);
          while (gridDiv.firstChild) {
            gridDiv.removeChild(gridDiv.firstChild);
          }
          new agGrid.Grid(gridDiv, dataGridOptions_featureTable);
      };


      // ROLE OVERVIEW TABLE

      this.buildDataGridColumnConfig_roles = function(){
        const columnDefs = [
          { headerName: 'Editierfunktionen', maxWidth: 300, checkboxSelection: true, headerCheckboxSelection: true, 
          headerCheckboxSelectionFilteredOnly: true, filter: false, sortable: false, cellRenderer: 'displayEditButtons_roles' },
          { headerName: 'Id', field: "roleId", minWidth: 400 },
          { headerName: 'Name', field: "roleName", minWidth: 400 },         
          {
            headerName: 'In Keycloak registriert', minWidth: 250,
            cellRenderer: function (params) {
              if (params.data.registeredInKeyCloak){
                return '<i class="fas fa-check"></i>';
              }
              else{
                return '<i class="fas fa-times"></i>';
              }
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              if (params.data.registeredInKeyCloak){
                return "true1wahr";
              }
              return "false0falsch";
            }
          }
        ];

        return columnDefs;
      };

      this.buildDataGridRowData_roles = function(dataArray){
        
        return dataArray;
      };

      this.buildDataGridOptions_roles = function(rolesArray){
          let columnDefs = this.buildDataGridColumnConfig_roles();
          let rowData = this.buildDataGridRowData_roles(rolesArray);
  
          let gridOptions = {
            defaultColDef: {
              editable: false,
              sortable: true,
              flex: 1,
              minWidth: 200,
              filter: true,
              floatingFilter: true,
              // filterParams: {
              //   newRowsAction: 'keep'
              // },
              resizable: true,
              wrapText: true,
              autoHeight: true,
              cellStyle: { 'font-size': '12px;', 'white-space': 'normal !important', "line-height": "20px !important", "word-break": "break-word !important", "padding-top": "17px", "padding-bottom": "17px" },
              headerComponentParams: {
                template:
                  '<div class="ag-cell-label-container" role="presentation">' +
                  '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
                  '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
                  '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
                  '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
                  '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
                  '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
                  '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
                  '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
                  '  </div>' +
                  '</div>',
              },
            },
            components: {
              displayEditButtons_roles: displayEditButtons_roles
            },
            columnDefs: columnDefs,
            rowData: rowData,
            suppressRowClickSelection: true,
            rowSelection: 'multiple',
            enableCellTextSelection: true,
            ensureDomOrder: true,
            pagination: true,
            paginationPageSize: 10,
            suppressColumnVirtualisation: true,          
            onFirstDataRendered: function () {
              headerHeightSetter(self.dataGridOptions_roles);
            },
            onColumnResized: function () {
              headerHeightSetter(self.dataGridOptions_roles);
            },        
            onRowDataChanged: function () {
              self.registerClickHandler_roles(rolesArray);
            },   
            onViewportChanged: function () {
              self.registerClickHandler_roles(rolesArray);                   
            },
  
          };
  
          return gridOptions;        
      };

      this.registerClickHandler_roles = function (roleMetadataArray) {

        $(".roleEditMetadataBtn").on("click", function () {
          let roleId = this.id.split("_")[3];

          let roleMetadata = kommonitorDataExchangeService.getRoleMetadataById(roleId);

          $rootScope.$broadcast("onEditRoleMetadata", roleMetadata);
        });
      };  

      this.buildDataGrid_roles = function (rolesArray) {
        
        if (this.dataGridOptions_roles && this.dataGridOptions_roles.api) {

          this.saveGridStore(this.dataGridOptions_roles);
          let newRowData = this.buildDataGridRowData_roles(rolesArray);
          this.dataGridOptions_roles.api.setRowData(newRowData);
          this.restoreGridStore(this.dataGridOptions_roles);
        }
        else {
          this.dataGridOptions_roles = this.buildDataGridOptions_roles(rolesArray);
          let gridDiv = document.querySelector('#roleOverviewTable');
          new agGrid.Grid(gridDiv, this.dataGridOptions_roles);
        }
      };


      // SCRIPT OVERVIEW TABLE

      this.buildDataGridColumnConfig_scripts = function(){
        const columnDefs = [
          { headerName: 'Id', field: "scriptId", pinned: 'left', maxWidth: 125, checkboxSelection: true, headerCheckboxSelection: true, 
          headerCheckboxSelectionFilteredOnly: true },
          { headerName: 'Name', field: "name", pinned: 'left', maxWidth: 300 },  
          { headerName: 'Ziel-Indikatoren-Id', field: "indicatorId", maxWidth: 125 },
          { headerName: 'Ziel-Indikatoren-Name', minWidth: 200, cellRenderer: function (params) {
              return kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.indicatorId);
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.indicatorId);
            } 
          },       
          { headerName: 'Beschreibung', field: "description", minWidth: 300 },
          { headerName: 'notwendige Basis-Indikatoren', minWidth: 300, cellRenderer: function (params) {
            
              /*
                <table class="table table-condensed">
                      <thead>
                        <tr>
                        <th>Id</th>
                        <th>Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr ng-repeat="baseIndicatorId in scriptDataset.requiredIndicatorIds">
                        <td>{{::baseIndicatorId}}</td>
                        <td>{{::$ctrl.kommonitorDataExchangeServiceInstance.getIndicatorNameFromIndicatorId(baseIndicatorId)}}</td>
                        </tr>
                      </tbody>
                    </table> 
              */
              if(params.data && params.data.requiredIndicatorIds && params.data.requiredIndicatorIds.length > 0){
                let html = '<table class="table table-condensed table-bordered table-striped"><thead><tr><th>Id</th><th>Name</th></tr></thead><tbody>';

                for (const baseIndicatorId of params.data.requiredIndicatorIds) {
                  html += "<tr>";
                  html += "<td>" + baseIndicatorId + "</td>";
                  html += "<td>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(baseIndicatorId) + "</td>";
                  html += "</tr>";
                }
                
                html += "</tbody></table>";
                return html;  
              }
              else{
                return "keine";
              }
              
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {

              if(params.data && params.data.requiredIndicatorIds && params.data.requiredIndicatorIds.length > 0){
                let string = JSON.stringify(params.data.requiredIndicatorIds);

                for (const baseIndicatorId of params.data.requiredIndicatorIds) {
                  string += kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(baseIndicatorId);
                }                              

                return string;  
              }
              else{
                return "keine";
              }
            }  
          },
          { headerName: 'notwendige Basis-Georessourcen', minWidth: 300, cellRenderer: function (params) {
              if(params.data && params.data.requiredGeoresourceIds && params.data.requiredGeoresourceIds.length > 0){
                let html = '<table class="table table-condensed table-bordered table-striped"><thead><tr><th>Id</th><th>Name</th></tr></thead><tbody>';

                for (const baseGeoresourceId of params.data.requiredGeoresourceIds) {
                  html += "<tr>";
                  html += "<td>" + baseGeoresourceId + "</td>";
                  html += "<td>" + kommonitorDataExchangeService.getGeoresourceNameFromGeoresourceId(baseGeoresourceId) + "</td>";
                  html += "</tr>";
                }
                
                html += "</tbody></table>";
                return html;  
              }
              else{
                return "keine";
              }
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              if(params.data && params.data.requiredGeoresourceIds && params.data.requiredGeoresourceIds.length > 0){
                let string = JSON.stringify(params.data.requiredGeoresourceIds);

                for (const baseIndicatorId of params.data.requiredGeoresourceIds) {
                  string += kommonitorDataExchangeService.getGeoresourceNameFromGeoresourceId(baseIndicatorId);
                }                              

                return string;  
              }
              else{
                return "keine";
              }
            } 
          },
          { headerName: 'Prozessparameter', field: "", minWidth: 1000, cellRenderer: function (params) {
              /*
                <table class="table table-condensed">
										<thead>
										  <tr>
											<th>Name</th>
											<th>Beschreibung</th>
											<th>Datentyp</th>
											<th>Standard-Wert</th>
											<th>erlaubter Wertebereich</th>
										  </tr>
										</thead>
										<tbody>
										  <tr ng-repeat="processParameter in scriptDataset.variableProcessParameters">
											<td>{{::processParameter.name}}</td>
											<td>{{::processParameter.description}}</td>
											<td>{{::processParameter.dataType}}</td>
											<td>{{::processParameter.defaultValue}}</td>
											<td><div ng-show="processParameter.dataType == 'double' || processParameter.dataType == 'integer'"><b>erlaubter Wertebereich</b> {{::processParameter.minParameterValueForNumericInputs}} - {{::processParameter.maxParameterValueForNumericInputs}}</div></td>
										  </tr>
										 </tbody>
									</table>
              */
                  if(params.data && params.data.variableProcessParameters && params.data.variableProcessParameters.length > 0){
                    let html = '<table class="table table-condensed table-bordered table-striped"><thead><tr><th>Name</th><th>Beschreibung</th><th>Datentyp</th><th>Standard-Wert</th><th>erlaubter Wertebereich</th></tr></thead><tbody>';
    
                    for (const processParameter of params.data.variableProcessParameters) {
                      html += "<tr>";
                      html += "<td>" + processParameter.name + "</td>";
                      html += "<td>" + processParameter.description + "</td>";
                      html += "<td>" + processParameter.dataType + "</td>";
                      html += "<td>" + processParameter.defaultValue + "</td>";
                      html += "<td>" ;

                      if(processParameter.dataType == "integer" || processParameter.dataType == "double"){
                        html += "<b>erlaubter Wertebereich</b><br/><br/>";
                        html += "" + processParameter.minParameterValueForNumericInputs + " &dash; " + processParameter.maxParameterValueForNumericInputs;
                      }

                      html += "</td>";
                      html += "</tr>";
                    }
                    
                    html += "</tbody></table>";
                    return html;  
                  }
                  else{
                    return "keine";
                  }
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              if(params.data && params.data.variableProcessParameters && params.data.variableProcessParameters.length > 0){
                return JSON.stringify(params.data.variableProcessParameters);
              }
              else{
                return "keine";
              }
            } 
         }          
        ];

        return columnDefs;
      };

      this.buildDataGridRowData_scripts = function(dataArray){
        
        return dataArray;
      };

      this.buildDataGridOptions_scripts = function(scriptsArray){
          let columnDefs = this.buildDataGridColumnConfig_scripts();
          let rowData = this.buildDataGridRowData_scripts(scriptsArray);
  
          let gridOptions = {
            defaultColDef: {
              editable: false,
              sortable: true,
              flex: 1,
              minWidth: 200,
              filter: true,
              floatingFilter: true,
              // filterParams: {
              //   newRowsAction: 'keep'
              // },
              resizable: true,
              wrapText: true,
              autoHeight: true,
              cellStyle: { 'font-size': '12px;', 'white-space': 'normal !important', "line-height": "20px !important", "word-break": "break-word !important", "padding-top": "17px", "padding-bottom": "17px" },
              headerComponentParams: {
                template:
                  '<div class="ag-cell-label-container" role="presentation">' +
                  '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
                  '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
                  '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
                  '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
                  '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
                  '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
                  '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
                  '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
                  '  </div>' +
                  '</div>',
              },
            },
            columnDefs: columnDefs,
            rowData: rowData,
            suppressRowClickSelection: true,
            rowSelection: 'multiple',
            enableCellTextSelection: true,
            ensureDomOrder: true,
            pagination: true,
            paginationPageSize: 10,
            suppressColumnVirtualisation: true,          
            onFirstDataRendered: function () {
              headerHeightSetter(self.dataGridOptions_scripts);
            },
            onColumnResized: function () {
              headerHeightSetter(self.dataGridOptions_scripts);
            }
  
          };
  
          return gridOptions;        
      };

      this.buildDataGrid_scripts = function (scriptsArray) {
        
        if (this.dataGridOptions_scripts && this.dataGridOptions_scripts.api) {

          this.saveGridStore(this.dataGridOptions_scripts);
          let newRowData = this.buildDataGridRowData_roles(scriptsArray);
          this.dataGridOptions_scripts.api.setRowData(newRowData);
          this.restoreGridStore(this.dataGridOptions_scripts);
        }
        else {
          this.dataGridOptions_scripts = this.buildDataGridOptions_scripts(scriptsArray);
          let gridDiv = document.querySelector('#scriptOverviewTable');
          new agGrid.Grid(gridDiv, this.dataGridOptions_scripts);
        }
      };

      this.saveGridStore = function (gridOptions) {
        window.colState = gridOptions.columnApi.getColumnState();
        window.filterState = gridOptions.api.getFilterModel();

      };

      this.restoreGridStore = function (gridOptions) {
        // gridOptions.columnApi.setColumnState(window.colState);
        // gridOptions.columnApi.setColumnGroupState(window.groupState);
        if (window.colState) {
          gridOptions.columnApi.applyColumnState({ state: window.colState, applyOrder: true });
        }

        if (window.filterState) {
          gridOptions.api.setFilterModel(window.filterState);
        }
      };

    }]);
