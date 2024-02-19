angular.module('kommonitorDataGridHelper', ['kommonitorDataExchange']);

angular
  .module('kommonitorDataGridHelper', [])
  .service(
    'kommonitorDataGridHelperService', ['kommonitorDataExchangeService', '$rootScope', '$timeout', '$http', '$httpParamSerializerJQLike', '__env',
    function (kommonitorDataExchangeService, $rootScope, $timeout,
      $http, $httpParamSerializerJQLike, __env) {

      var self = this;
      this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

      this.resourceType_georesource = "georesource";
      this.resourceType_spatialUnit = "spatialUnit";
      this.resourceType_indicator = "indicator";

      this.featureTable_spatialUnit_lastUpdate_timestamp_success = undefined;
      this.featureTable_spatialUnit_lastUpdate_timestamp_failure = undefined;
      this.featureTable_georesource_lastUpdate_timestamp_success = undefined;
      this.featureTable_georesource_lastUpdate_timestamp_failure = undefined;
      this.featureTable_indicator_lastUpdate_timestamp_success = undefined;
      this.featureTable_indicator_lastUpdate_timestamp_failure = undefined;

      this.dataGridOptions_indicators;
      this.dataGridOptions_georesources_poi;
      this.dataGridOptions_georesources_loi;
      this.dataGridOptions_georesources_aoi;
      this.dataGridOptions_spatialUnits;
      this.dataGridOptions_accessControl;

      function getCurrentTimestampString(){
        let date = new Date();
        let hours = date.getHours();
        if(hours < 10){
          hours = "0" + hours;
        }
        let minutes = date.getMinutes();
        if(minutes < 10){
          minutes = "0" + minutes;
        }
        let seconds = date.getSeconds();
        if(seconds < 10){
          seconds = "0" + seconds;
        }
        return "" + hours + ":" + minutes + ":" + seconds;
      }

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
        let disabledEditButtons = !params.data.userPermissions.includes("editor")
        let editMetadataButtonId = 'btn_georesource_editMetadata_' + params.data.indicatorId;
        let editFeaturesButtonId = 'btn_georesource_editFeatures_' + params.data.indicatorId;

        let html = '<div class="btn-group btn-group-sm">';
        html += '<button id="' + editMetadataButtonId + '" class="btn btn-warning btn-sm indicatorEditMetadataBtn disabled" type="button" data-toggle="modal" data-target="#modal-edit-indicator-metadata" title="Metadaten editieren" disabled><i class="fas fa-pencil-alt"></i></button>';
        html += '<button id="' + editFeaturesButtonId + '" class="btn btn-warning btn-sm indicatorEditFeaturesBtn disabled" type="button" data-toggle="modal" data-target="#modal-edit-indicator-features" title="Features fortf&uuml;hren" disabled><i class="fas fa-draw-polygon"></i></button>';
        
        if(!disabledEditButtons){
          html = html.replaceAll("disabled", "") //enabled
        }
        
        if (kommonitorDataExchangeService.enableKeycloakSecurity) {
          // disable button if there is no applicable spatial unit or user has no creator rights
          let disabled = params.data.applicableSpatialUnits.length == 0 || !params.data.userPermissions.includes("editor");
          html += '<button id="btn_indicator_editRoleBasedAccess_' + params.data.indicatorId + '"class="btn btn-warning btn-sm indicatorEditRoleBasedAccessBtn ';

          if (disabled) {
            html += 'disabled" disabled';
          }

          html += ' type="button" data-toggle="modal" data-target="#modal-edit-indicator-spatial-unit-roles" title="Rollenbasierten Zugriffsschutz editieren"><i class="fas fa-user-lock"></i></button>';
        }
        html += '</div>';

        return html;
      };

      var displayEditButtons_georesources = function (params) {
        let editMetadataButtonId = 'btn_georesource_editMetadata_' + params.data.georesourceId;
        let editFeaturesButtonId = 'btn_georesource_editFeatures_' + params.data.georesourceId;

        let html = '<div class="btn-group btn-group-sm">';
        html += '<button id="'+ editMetadataButtonId +'" class="btn btn-warning btn-sm georesourceEditMetadataBtn" type="button" data-toggle="modal" data-target="#modal-edit-georesource-metadata" title="Metadaten editieren" '+ (params.data.userPermissions.includes("editor") ? '' : 'disabled') + '><i class="fas fa-pencil-alt" ></i></button>';
        html += '<button id="'+ editFeaturesButtonId + '" class="btn btn-warning btn-sm georesourceEditFeaturesBtn" type="button" data-toggle="modal" data-target="#modal-edit-georesource-features" title="Features fortf&uuml;hren" '+ (params.data.userPermissions.includes("editor") ? '' : 'disabled') + '><i class="fas fa-draw-polygon"></i></button>';
        html += '<button id="btn_georesource_deleteGeoresource_' + params.data.georesourceId + '" class="btn btn-danger btn-sm georesourceDeleteBtn" type="button" data-toggle="modal" data-target="#modal-delete-georesources" title="Georessource entfernen"  '+ (params.data.userPermissions.includes("creator") ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>'
        html += '</div>';

        return html;
      };

      var displayEditButtons_spatialUnits = function (params) {

        let html = '<div class="btn-group btn-group-sm">';
        html += '<button id="btn_spatialUnit_editMetadata_' + params.data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditMetadataBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-metadata" title="Metadaten editieren"  '+ (params.data.userPermissions.includes("editor") ? '' : 'disabled') + '><i class="fas fa-pencil-alt"></i></button>';
        html += '<button id="btn_spatialUnit_editFeatures_' + params.data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditFeaturesBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-features" title="Features fortf&uuml;hren"  '+ (params.data.userPermissions.includes("editor") ? '' : 'disabled') + '><i class="fas fa-draw-polygon"></i></button>';
        html += '<button id="btn_spatialUnit_deleteSpatialUnit_' + params.data.spatialUnitId + '" class="btn btn-danger btn-sm spatialUnitDeleteBtn" type="button" data-toggle="modal" data-target="#modal-delete-spatial-units" title="Raumeinheit entfernen"  '+ (params.data.userPermissions.includes("creator") ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>'
        html += '</div>';

        return html;
      };

      var displayEditButtons_accessControl = function (params) {

        let html = '<div class="btn-group btn-group-sm">';
        html += '<button id="btn_role_editMetadata_' + params.data.organizationalUnitId + '" class="btn btn-warning btn-sm roleEditMetadataBtn" type="button" data-toggle="modal" data-target="#modal-edit-role-metadata" title="Metadaten editieren"><i class="fas fa-pencil-alt"></i></button>';
        html += '</div>';

        return html;
      };

      function getDatePicker() {
        // function to act as a class
        function Datepicker() {}
      
        // gets called once before the renderer is used
        Datepicker.prototype.init = function (params) {
          // create the cell
          this.eInput = document.createElement('input');
          this.eInput.value = params.value;
          this.eInput.classList.add('ag-input');
          this.eInput.style.height = '100%';
      
          // https://jqueryui.com/datepicker/
          // $(this.eInput).datepicker({
          //   dateFormat: 'yyyy-mm-dd',
          // });
          $(this.eInput).datepicker(kommonitorDataExchangeService.datePickerOptions);

        };
      
        // gets called once when grid ready to insert the element
        Datepicker.prototype.getGui = function () {
          return this.eInput;
        };
      
        // focus and select can be done after the gui is attached
        Datepicker.prototype.afterGuiAttached = function () {
          this.eInput.focus();
          this.eInput.select();
        };
      
        // returns the new value after editing
        Datepicker.prototype.getValue = function () {
          return this.eInput.value;
        };
      
        // any cleanup we need to be done here
        Datepicker.prototype.destroy = () => {
          // but this example is simple, no cleanup, we could
          // even leave this method out as it's optional
        };
      
        // if true, then this editor will appear in a popup
        Datepicker.prototype.isPopup = () => {
          // and we could leave this method out also, false is the default
          return false;
        };
      
        return Datepicker;
      }

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
          { headerName: 'Rollen', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getAllowedRolesString(params.data.allowedRoles); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" +  kommonitorDataExchangeService.getAllowedRolesString(params.data.allowedRoles);
            } 
          }
        ];

        return columnDefs;
      };

      this.buildDataGridRowData_indicators = function (indicatorMetadataArray) {
        return indicatorMetadataArray;
      };


      this.buildDataGridColumnConfig_georesources_poi = function (georesourceMetadataArray) {
        const columnDefs = [
          { headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 150, checkboxSelection: false,
          headerCheckboxSelection: false, 
          headerCheckboxSelectionFilteredOnly: true, 
          filter: false, 
          sortable: false, cellRenderer: 'displayEditButtons_georesources' },
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
          { headerName: 'Rollen', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getAllowedRolesString(params.data.allowedRoles); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" +  kommonitorDataExchangeService.getAllowedRolesString(params.data.allowedRoles);
            } 
          }
        ];

        return columnDefs;
      };

      this.buildDataGridColumnConfig_georesources_loi = function (georesourceMetadataArray) {
        const columnDefs = [
          { headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 150, checkboxSelection: false, headerCheckboxSelection: false, 
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
          { headerName: 'Rollen', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getAllowedRolesString(params.data.allowedRoles); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" +  kommonitorDataExchangeService.getAllowedRolesString(params.data.allowedRoles);
            } 
          }
        ];

        return columnDefs;
      };

      this.buildDataGridColumnConfig_georesources_aoi = function (georesourceMetadataArray) {
        const columnDefs = [
          { headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 150, checkboxSelection: false, headerCheckboxSelection: false, 
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
          { headerName: 'Rollen', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getAllowedRolesString(params.data.allowedRoles); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" +  kommonitorDataExchangeService.getAllowedRolesString(params.data.allowedRoles);
            } 
          }
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
          { headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 150, checkboxSelection: false, headerCheckboxSelection: false, 
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
          { headerName: 'Rollen', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getAllowedRolesString(params.data.allowedRoles); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" +  kommonitorDataExchangeService.getAllowedRolesString(params.data.allowedRoles);
            } 
          }
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

      this.getSelectedAccessControlMetadata = function(){
        let accessControlMetadataArray = [];

        if (this.dataGridOptions_accessControl && this.dataGridOptions_accessControl.api){
          let selectedNodes = this.dataGridOptions_accessControl.api.getSelectedNodes();

          for (const selectedNode of selectedNodes) {
            accessControlMetadataArray.push(selectedNode.data);
          }
        }

        return accessControlMetadataArray;
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
          onModelUpdated: function () {
            self.registerClickHandler_indicators(indicatorMetadataArray);
            
          },
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
                // self.dataGridOptions_indicators.api.resetRowHeights();
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

        //first unbind previous click events
        $(".indicatorEditMetadataBtn").off();
        $(".indicatorEditMetadataBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          let indicatorId = this.id.split("_")[3];

          let indicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);

          $rootScope.$broadcast("onEditIndicatorMetadata", indicatorMetadata);
        });

        //first unbind previous click events
        $(".indicatorEditFeaturesBtn").off();
        $(".indicatorEditFeaturesBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          let indicatorId = this.id.split("_")[3];

          let indicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);

          $rootScope.$broadcast("onEditIndicatorFeatures", indicatorMetadata);
        });

        $(".indicatorEditRoleBasedAccessBtn").off();
        $(".indicatorEditRoleBasedAccessBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          let indicatorId = this.id.split("_")[3];

          let indicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);

          $rootScope.$broadcast("onEditIndicatorSpatialUnitRoles", indicatorMetadata);
        });

      };

      this.registerClickHandler_georesources = function (georesourceMetadataArray) {

        $(".georesourceEditMetadataBtn").off();
        $(".georesourceEditMetadataBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          let georesourceId = this.id.split("_")[3];

          let georesourceMetadata = kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceId);

          $rootScope.$broadcast("onEditGeoresourceMetadata", georesourceMetadata);
        });

        $(".georesourceEditFeaturesBtn").off();
        $(".georesourceEditFeaturesBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          let georesourceId = this.id.split("_")[3];

          let georesourceMetadata = kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceId);

          $rootScope.$broadcast("onEditGeoresourceFeatures", georesourceMetadata);
        });

        $(".georesourceDeleteBtn").off();
        $(".georesourceDeleteBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
                 
          let spatialUnitId = this.id.split("_")[3]; 

          let spatialUnitMetadata = kommonitorDataExchangeService.getGeoresourceMetadataById(spatialUnitId);

          $rootScope.$broadcast("onDeleteGeoresources", [spatialUnitMetadata]); //handler function takes an array
        });

      };

      this.buildDataGrid_indicators = function (indicatorMetadataArray) {        
        if (this.dataGridOptions_indicators && this.dataGridOptions_indicators.api && document.querySelector('#indicatorOverviewTable').childElementCount > 0) {

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
          onModelUpdated: function () {
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
          onModelUpdated: function () {
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
          onModelUpdated: function () {
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
          onModelUpdated: function () {
            self.registerClickHandler_spatialUnits(spatialUnitMetadataArray);
            
          },
          onViewportChanged: function () {
            self.registerClickHandler_spatialUnits(spatialUnitMetadataArray);                   
          },

        };

        return gridOptions;
      };

      this.registerClickHandler_spatialUnits = function (spatialUnitMetadataArray) {

        $(".spatialUnitEditMetadataBtn").off();
        $(".spatialUnitEditMetadataBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          let spatialUnitId = this.id.split("_")[3];

          let spatialUnitMetadata = kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);

          $rootScope.$broadcast("onEditSpatialUnitMetadata", spatialUnitMetadata);
        });

        $(".spatialUnitEditFeaturesBtn").off();
        $(".spatialUnitEditFeaturesBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          let spatialUnitId = this.id.split("_")[3];

          let spatialUnitMetadata = kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);

          $rootScope.$broadcast("onEditSpatialUnitFeatures", spatialUnitMetadata);
        });

        $(".spatialUnitDeleteBtn").off();
        $(".spatialUnitDeleteBtn").on("click", function (event) { 
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
                
          let spatialUnitId = this.id.split("_")[3]; 

          let spatialUnitMetadata = kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);

          $rootScope.$broadcast("onDeleteSpatialUnits", [spatialUnitMetadata]); //handler function takes an array
        });

      };

      this.buildDataGrid_georesources = function (georesourceMetadataArray) {
        // POI
        if (this.dataGridOptions_georesources_poi && this.dataGridOptions_georesources_poi.api && document.querySelector('#poiOverviewTable').childElementCount > 0) {

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
        if (this.dataGridOptions_georesources_loi && this.dataGridOptions_georesources_loi.api && document.querySelector('#loiOverviewTable').childElementCount > 0) {

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
        if (this.dataGridOptions_georesources_aoi && this.dataGridOptions_georesources_aoi.api && document.querySelector('#aoiOverviewTable').childElementCount > 0) {

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
        
        if (this.dataGridOptions_spatialUnits && this.dataGridOptions_spatialUnits.api && document.querySelector('#spatialUnitOverviewTable').childElementCount > 0) {

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

      const isDate = (date) => {
        return (new Date(date) !== "Invalid Date") && !isNaN(new Date(date));
      }

      this.buildDataGridColumnConfig_featureTable_spatialResource = function(specificHeadersArray, datasetId, resourceType, deleteButtonEnabled){
        const columnDefs = [
          { headerName: 'DB-Record-Id', field: "kommonitorRecordId", pinned: 'left', editable: false, cellClass: "grid-non-editable", maxWidth: 125,
            cellRenderer: function (params) {
              let html = "";

              // only show delete button, if user has the permission to delete the dataset
              // if only editor rights, then user may edit cells, but shall not remove data entries
              // if(params.data.userPermissions.includes("creator")){
                // if (resourceType == self.resourceType_spatialUnit){
                //   html += '<button id="btn__spatialUnit__deleteFeatureEntry__' + datasetId + '__' + params.data[__env.FEATURE_ID_PROPERTY_NAME] + '__' + params.data.kommonitorRecordId + '" class="btn btn-danger btn-sm spatialUnitDeleteFeatureRecordBtn" type="button" title="Datenobjekt unwiderruflich entfernen"  ' + (deleteButtonEnabled ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>';
                // }
                // else {
                //   html += '<button id="btn__georesource__deleteFeatureEntry__' + datasetId + '__' + params.data[__env.FEATURE_ID_PROPERTY_NAME] + '__' + params.data.kommonitorRecordId + '" class="btn btn-danger btn-sm georesourceDeleteFeatureRecordBtn" type="button" title="Datenobjekt unwiderruflich entfernen"  ' + (deleteButtonEnabled ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>';
                // }
                
              // }

              if (resourceType == self.resourceType_spatialUnit){
                html += '<button id="btn__spatialUnit__deleteFeatureEntry__' + datasetId + '__' + params.data[__env.FEATURE_ID_PROPERTY_NAME] + '__' + params.data.kommonitorRecordId + '" class="btn btn-danger btn-sm spatialUnitDeleteFeatureRecordBtn" type="button" title="Datenobjekt unwiderruflich entfernen"  ' + (deleteButtonEnabled ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>';
              }
              else {
                html += '<button id="btn__georesource__deleteFeatureEntry__' + datasetId + '__' + params.data[__env.FEATURE_ID_PROPERTY_NAME] + '__' + params.data.kommonitorRecordId + '" class="btn btn-danger btn-sm georesourceDeleteFeatureRecordBtn" type="button" title="Datenobjekt unwiderruflich entfernen"  ' + (deleteButtonEnabled ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>';
              }

              html += "<br/>";

              html += params.data.kommonitorRecordId;

              return html;
            } 
          },
          { headerName: 'Feature-Id', field: __env.FEATURE_ID_PROPERTY_NAME, pinned: 'left', editable: false, cellClass: "grid-non-editable", maxWidth: 125 },
          { headerName: 'Name', field: __env.FEATURE_NAME_PROPERTY_NAME, pinned: 'left', minWidth: 150 }, 
          // { headerName: 'Geometrie', field: "kommonitorGeometry", autoHeight: false, wrapText: false,
          //   cellRenderer: function (params) {
          //     let html = JSON.stringify(params.data.kommonitorGeometry);

          //     return html;
          //   },
          //   filter: 'agTextColumnFilter', 
          //   filterValueGetter: (params) => {
          //     return JSON.stringify(params.data.kommonitorGeometry);
          //   },
          //   valueGetter: params => {
          //     return JSON.stringify(params.data.kommonitorGeometry);
          //   },
          //   valueSetter: params => {
          //       try {
          //         params.data.kommonitorGeometry = JSON.parse(params.newValue);
          //       } catch (error) {
          //         try {
          //           params.data.kommonitorGeometry = JSON.parse(params.oldValue);
          //         } catch (error) {
          //           params.data.kommonitorGeometry = params.oldValue;
          //         }
                  
          //       }                
          //       return true;
          //   },
          //   minWidth: 200 
          // },  
          { headerName: 'Lebenszeitbeginn', field: __env.VALID_START_DATE_PROPERTY_NAME, minWidth: 150, cellEditor: getDatePicker() },
          { headerName: 'Lebenszeitende', field: __env.VALID_END_DATE_PROPERTY_NAME, cellEditor: getDatePicker(), 
            // cellRenderer: function (params) {
            //   let html = '<p><i>';

            //   if (params.data.validEndDate){
            //     html += params.data.validEndDate;
            //   }
            //   else{
            //     html += "uneingeschr&auml;nkt g&uuml;ltig";
            //   }

            //   html += "</i></p>";

            //   return html;
            // },
            // filter: 'agTextColumnFilter', 
            // filterValueGetter: (params) => {
            //   if (params.data.validEndDate){
            //     return "" + params.data.validEndDate;
            //   }
            //   return "uneingeschr&auml;nkt g&uuml;ltig";
            // },
          minWidth: 150 }
        ];

        for (const header of specificHeadersArray) {
          columnDefs.push({ headerName: "" + header, field: "" + header, minWidth: 125 });
        }

        return columnDefs;
      };

      this.buildDataGridRowData_featureTable_spatialResource = function(dataArray){

        
        if(dataArray[0] && dataArray[0].properties){
          return dataArray.map(dataItem => {
              // add geometry and database record ID to properties to be available within data grid object
              dataItem.properties.kommonitorGeometry = dataItem.geometry;
              dataItem.properties.kommonitorRecordId = dataItem.id;
              return dataItem.properties;
             }
          );
        }
        
        return dataArray;
      };

      this.buildDataGridOptions_featureTable_spatialResource = function(specificHeadersArray, dataArray, datasetId, resourceType, deleteButtonEnabled){
          let columnDefs = this.buildDataGridColumnConfig_featureTable_spatialResource(specificHeadersArray, datasetId, resourceType, deleteButtonEnabled);
          let rowData = this.buildDataGridRowData_featureTable_spatialResource(dataArray);
  
          let gridOptions = {
            defaultColDef: {
              editable: true,
              // enables the fill handle
              enableFillHandle: false,              
              cellEditor: 'agLargeTextCellEditor',
              onCellValueChanged: function(newValueParams){
                /* https://www.ag-grid.com/javascript-data-grid/cell-editing/ 
                  interface NewValueParams {
                    // The value before the change 
                    oldValue: any;
                    // The value after the change 
                    newValue: any;
                    // Row node for the given row 
                    node: RowNode | null;
                    // Data associated with the node 
                    data: any;
                    // Column for this callback 
                    column: Column;
                    // ColDef provided for this column 
                    colDef: ColDef;
                    api: GridApi;
                    columnApi: ColumnApi;
                    // The context as provided on `gridOptions.context` 
                    context: any;
                  }
                */

                  // make sure that date properties are actually set
                  if (! newValueParams.data.validStartDate){
                    newValueParams.data.validStartDate = newValueParams.oldValue;
                  }
                  if (!isDate(newValueParams.data.validStartDate)){
                    newValueParams.data.validStartDate = newValueParams.oldValue;
                  }
                  if(newValueParams.data.validEndDate == ""){
                    newValueParams.data.validEndDate = undefined;
                  }  
                  if(newValueParams.data.validEndDate){
                    if (!isDate(newValueParams.data.validEndDate)){
                      newValueParams.data.validEndDate = newValueParams.oldValue;
                    }
                  }                  

                  // take the modified data from newValueParams.data
                  // take geometry info from newValueParams.data.geometry and remove that property afterwards   
                  // take kommonitorRecordId info from newValueParams.data.kommonitorRecordId and remove that property afterwards                  
                  // then build GeoJSON and send modification request to data Management component
                  let geoJSON = {
                    "type": "Feature",
                    geometry: "",
                    properties: "",
                    id: ""
                  };

                  // clone properties
                  geoJSON.geometry = JSON.parse(JSON.stringify(newValueParams.data.kommonitorGeometry));
                  geoJSON.id = JSON.parse(JSON.stringify(newValueParams.data.kommonitorRecordId));
                  geoJSON.properties = JSON.parse(JSON.stringify(newValueParams.data));

                  // now delete information
                  delete geoJSON.properties.kommonitorGeometry;
                  delete geoJSON.properties.kommonitorRecordId;

                  let url = __env.apiUrl + __env.basePath; 
                  if(resourceType == self.resourceType_georesource){
                    url += "/georesources/";
                  }
                  else {
                    url += "/spatial-units/";
                  }
                  
                  url += datasetId + "/singleFeature/" + newValueParams.data[__env.FEATURE_ID_PROPERTY_NAME] + "/singleFeatureRecord/" + newValueParams.data.kommonitorRecordId;

                  $http({
                    url: url,
                    method: "PUT",
                    data: geoJSON,
                    headers: {
                      'Content-Type': "application/json"
                    }
                  }).then(function successCallback(response) {
                      // this callback will be called asynchronously
                      // when the response is available

                      console.log("Successfully updated database record");

                      // on success mark grid cell with green background and set update information
                      newValueParams.colDef.cellStyle = (p) =>
                          p.rowIndex.toString() === newValueParams.node.id ? {'background-color': '#9DC89F'} : "";

                          newValueParams.api.refreshCells({
                          force: true,
                          columns: [newValueParams.column.getId()],
                          rowNodes: [newValueParams.node]
                      });
                                      
                      if(resourceType == self.resourceType_georesource){
                        self.featureTable_georesource_lastUpdate_timestamp_success = getCurrentTimestampString();
                      }
                      else {
                        self.featureTable_spatialUnit_lastUpdate_timestamp_success = getCurrentTimestampString();
                      }                    
            
                    }, function errorCallback(error) {
                      // called asynchronously if an error occurs
                      // or server returns response with an error status.
                      //$scope.error = response.statusText;
                      console.error("Error while updating database record. Error is:\n" + error);

                      // reset cell value as an error occurred
                      newValueParams.data[newValueParams.column.colId] = newValueParams.oldValue;

                      // on failure mark grid cell with red background and set update failure information
                      newValueParams.colDef.cellStyle = (p) =>
                          p.rowIndex.toString() === newValueParams.node.id ? {'background-color': '#E79595'} : "";

                          newValueParams.api.refreshCells({
                          force: true,
                          columns: [newValueParams.column.getId()],
                          rowNodes: [newValueParams.node]
                      });
                      if(resourceType == self.resourceType_georesource){
                        self.featureTable_georesource_lastUpdate_timestamp_failure = timestamp_string;
                      }
                      else {
                        self.featureTable_spatialUnit_lastUpdate_timestamp_failure = timestamp_string;
                      }   
                      throw error;
                  }); 
              },
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
            // enables undo / redo
            undoRedoCellEditing: true,
            // restricts the number of undo / redo steps to 10
            undoRedoCellEditingLimit: 10,
            // enables flashing to help see cell changes
            enableCellChangeFlash: true,
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
            onRowDataChanged: function () {
              self.registerClickHandler_featureTable_spatialResource(resourceType);
            },  
            onModelUpdated: function () {
              self.registerClickHandler_featureTable_spatialResource(resourceType);  
              
            }, 
            onViewportChanged: function () {
              self.registerClickHandler_featureTable_spatialResource(resourceType);                   
            },
  
          };
  
          return gridOptions;        
      };

      this.registerClickHandler_featureTable_spatialResource = function (resourceType) {        

        let className = "";
        let url = __env.apiUrl + __env.basePath;

        if (resourceType == this.resourceType_georesource){
          className = ".georesourceDeleteFeatureRecordBtn";
          url += "/georesources/";
        }
        else{
          className = ".spatialUnitDeleteFeatureRecordBtn";
          url += "/spatial-units/";
        }

          $(className).off();
          $(className).on("click", function (event) {

            // ensure that only the target button gets clicked
            event.stopPropagation();
            event.stopImmediatePropagation();
            $rootScope.$broadcast("showLoadingIcon_" + resourceType);

            // id example is id="btn__spatialUnit__deleteFeatureEntry__' + datasetId + '__' + params.data[__env.FEATURE_ID_PROPERTY_NAME] + '__' + params.data.kommonitorRecordId + '"
            let idArray = this.id.split("__");

            let datasetId = idArray[3];
            let featureId = idArray[4];
            let recordId = idArray[5];
                  
                  url += datasetId + "/singleFeature/" + featureId + "/singleFeatureRecord/" + recordId;  

                  $http({
                    url: url,
                    method: "DELETE"
                  }).then(function successCallback(response) {
                      // this callback will be called asynchronously
                      // when the response is available

                      console.log("Successfully deleted database record"); 

                      if(resourceType == self.resourceType_georesource){
                        self.featureTable_georesource_lastUpdate_timestamp_success = getCurrentTimestampString();
                      }
                      else {
                        self.featureTable_spatialUnit_lastUpdate_timestamp_success = getCurrentTimestampString();
                      }       
                      
                      $rootScope.$broadcast("onDeleteFeatureEntry_" + resourceType);
            
                    }, function errorCallback(error) {
                      // called asynchronously if an error occurs
                      // or server returns response with an error status.
                      //$scope.error = response.statusText;
                      console.error("Error while deleting database record. Error is:\n" + error); 
                      $rootScope.$broadcast("hideLoadingIcon_" + resourceType);
                      if(resourceType == self.resourceType_georesource){
                        self.featureTable_georesource_lastUpdate_timestamp_failure = getCurrentTimestampString();
                      }
                      else {
                        self.featureTable_spatialUnit_lastUpdate_timestamp_failure = getCurrentTimestampString();
                      }       
                      throw error;
                  });
          });
        
      }; 

      this.buildDataGrid_featureTable_spatialResource = function (domElementId, specificHeadersArray, dataArray, datasetId, resourceType, deleteButtonEnabled) {

        let dataGridOptions_featureTable;

        dataGridOptions_featureTable = this.buildDataGridOptions_featureTable_spatialResource(specificHeadersArray, dataArray, datasetId, resourceType, deleteButtonEnabled);
        
          let gridDiv = document.querySelector('#' + domElementId);
          while (gridDiv.firstChild) {
            gridDiv.removeChild(gridDiv.firstChild);
          }
          new agGrid.Grid(gridDiv, dataGridOptions_featureTable);
      };

      // INDICATORS FEATURE TABLE
      this.buildDataGridColumnConfig_featureTable_indicatorResource = function(specificHeadersArray, datasetId, resourceType, deleteButtonEnabled, spatialUnitId){
        const columnDefs = [
          { headerName: 'DB-Record-Id', field: "fid", pinned: 'left', editable: false, cellClass: "grid-non-editable", maxWidth: 125,
            cellRenderer: function (params) {
              let html = "";

              // only show delete button, if user has the permission to delete the dataset
              // if only editor rights, then user may edit cells, but shall not remove data entries
              // if(params.data.userPermissions.includes("creator")){
                // html += '<button id="btn__indicator__deleteFeatureEntry__' + datasetId + '__'  + spatialUnitId + '__' + params.data[__env.FEATURE_ID_PROPERTY_NAME] + '__' + params.data.fid + '" class="btn btn-danger btn-sm indicatorDeleteFeatureRecordBtn" type="button" title="Datenobjekt unwiderruflich entfernen"  ' + (deleteButtonEnabled ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>';              

                
              // }

              html += '<button id="btn__indicator__deleteFeatureEntry__' + datasetId + '__'  + spatialUnitId + '__' + params.data[__env.FEATURE_ID_PROPERTY_NAME] + '__' + params.data.fid + '" class="btn btn-danger btn-sm indicatorDeleteFeatureRecordBtn" type="button" title="Datenobjekt unwiderruflich entfernen"  ' + (deleteButtonEnabled ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>';              

              html += "&nbsp;&nbsp;";
              html += params.data.fid;

              return html;
            } 
          },
          { headerName: 'Feature-Id', field: __env.FEATURE_ID_PROPERTY_NAME, pinned: 'left', editable: false, cellClass: "grid-non-editable", maxWidth: 125 },
          { headerName: 'Name', field: __env.FEATURE_NAME_PROPERTY_NAME, pinned: 'left', minWidth: 200, editable: false, cellClass: "grid-non-editable", },   
          // { headerName: 'Id', field: __env.FEATURE_ID_PROPERTY_NAME,  maxWidth: 125 },
          // { headerName: 'Name', field: __env.FEATURE_NAME_PROPERTY_NAME,  minWidth: 300 }, 
          { headerName: 'Lebenszeitbeginn', field: __env.VALID_START_DATE_PROPERTY_NAME, minWidth: 125, editable: false, cellClass: "grid-non-editable" },
          { headerName: 'Lebenszeitende', field: __env.VALID_END_DATE_PROPERTY_NAME, editable: false, cellClass: "grid-non-editable",
          minWidth: 125 }
        ];

        for (const header of specificHeadersArray) {
          columnDefs.push({ headerName: "" + header, field: "" + header, minWidth: 125 });
        }

        return columnDefs;
      };

      this.buildDataGridRowData_featureTable_indicatorResource = function(dataArray){

        return dataArray.map(dataItem => {
          // remove arisonFrom property as this is currently never used
          delete dataItem.arisenFrom;
          return dataItem;
         }
        );
      };

      this.buildDataGridOptions_featureTable_indicatorResource = function(specificHeadersArray, dataArray, datasetId, resourceType, deleteButtonEnabled, spatialUnitId){
          let columnDefs = this.buildDataGridColumnConfig_featureTable_indicatorResource(specificHeadersArray, datasetId, resourceType, deleteButtonEnabled, spatialUnitId);
          let rowData = this.buildDataGridRowData_featureTable_indicatorResource(dataArray);
  
          let gridOptions = {
            defaultColDef: {
              editable: true,
              // enables the fill handle
              enableFillHandle: false,              
              cellEditor: 'agLargeTextCellEditor',
              onCellValueChanged: function(newValueParams){
                /* https://www.ag-grid.com/javascript-data-grid/cell-editing/ 
                  interface NewValueParams {
                    // The value before the change 
                    oldValue: any;
                    // The value after the change 
                    newValue: any;
                    // Row node for the given row 
                    node: RowNode | null;
                    // Data associated with the node 
                    data: any;
                    // Column for this callback 
                    column: Column;
                    // ColDef provided for this column 
                    colDef: ColDef;
                    api: GridApi;
                    columnApi: ColumnApi;
                    // The context as provided on `gridOptions.context` 
                    context: any;
                  }
                */                 

                  // take the modified data from newValueParams.data                 
                  // then build JSON and send modification request to data Management component
                  let json = JSON.parse(JSON.stringify(newValueParams.data));

                  // now delete information - only ID and fid shall remain for indicator record update
                  delete json[__env.VALID_START_DATE_PROPERTY_NAME];
                  delete json[__env.VALID_END_DATE_PROPERTY_NAME];
                  delete json[__env.FEATURE_NAME_PROPERTY_NAME]; 
                  
                  /*
                  for indicators we should check if an empty/null/undefined value has been set by user and transmit it as null value
                  */
                 for (const key in json) {
                  if (Object.hasOwnProperty.call(json, key)) {
                    const element = json[key];

                    if(key.includes(__env.indicatorDatePrefix)){
                      if (element == ""){
                        json[key] = null;
                      }
                    }
                    
                  }
                 }

                  let url = __env.apiUrl + __env.basePath + "/indicators/"; 
                  
                  url += datasetId + "/" + spatialUnitId + "/singleFeature/" + newValueParams.data[__env.FEATURE_ID_PROPERTY_NAME] + "/singleFeatureRecord/" + newValueParams.data.fid;

                  $http({
                    url: url,
                    method: "PUT",
                    data: json,
                    headers: {
                      'Content-Type': "application/json"
                    }
                  }).then(function successCallback(response) {
                      // this callback will be called asynchronously
                      // when the response is available

                      console.log("Successfully updated database record");

                      // on success mark grid cell with green background and set update information
                      newValueParams.colDef.cellStyle = (p) =>
                          p.rowIndex.toString() === newValueParams.node.id ? {'background-color': '#9DC89F'} : "";

                          newValueParams.api.refreshCells({
                          force: true,
                          columns: [newValueParams.column.getId()],
                          rowNodes: [newValueParams.node]
                      });
                                      
                      self.featureTable_indicator_lastUpdate_timestamp_success = getCurrentTimestampString();                   
            
                    }, function errorCallback(error) {
                      // called asynchronously if an error occurs
                      // or server returns response with an error status.
                      //$scope.error = response.statusText;
                      console.error("Error while updating database record. Error is:\n" + error);

                      // reset cell value as an error occurred
                      newValueParams.data[newValueParams.column.colId] = newValueParams.oldValue;

                      // on failure mark grid cell with red background and set update failure information
                      newValueParams.colDef.cellStyle = (p) =>
                          p.rowIndex.toString() === newValueParams.node.id ? {'background-color': '#E79595'} : "";

                          newValueParams.api.refreshCells({
                          force: true,
                          columns: [newValueParams.column.getId()],
                          rowNodes: [newValueParams.node]
                      });
                      self.featureTable_indicator_lastUpdate_timestamp_failure = timestamp_string;
                      throw error;
                  }); 
              },
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
            // enables undo / redo
            undoRedoCellEditing: true,
            // restricts the number of undo / redo steps to 10
            undoRedoCellEditingLimit: 10,
            // enables flashing to help see cell changes
            enableCellChangeFlash: true,
            suppressRowClickSelection: true,
            // rowSelection: 'multiple',
            enableCellTextSelection: true,
            ensureDomOrder: true,
            pagination: true,
            paginationPageSize: 10,
            suppressColumnVirtualisation: true,          
            onViewportChanged: function () {
              self.registerClickHandler_featureTable_indicatorResource(resourceType);                   
            },
  
          };
  
          return gridOptions;        
      };

      this.registerClickHandler_featureTable_indicatorResource = function (resourceType) {        

        let className = ".indicatorDeleteFeatureRecordBtn";
        let url = __env.apiUrl + __env.basePath + "/indicators/";

          $(className).off();
          $(className).on("click", function (event) {

            // ensure that only the target button gets clicked
            event.stopPropagation();
            event.stopImmediatePropagation();
            $rootScope.$broadcast("showLoadingIcon_" + resourceType);

            // id example is "btn__indicator__deleteFeatureEntry__' + datasetId + '__'  + spatialUnitId + '__' + params.data[__env.FEATURE_ID_PROPERTY_NAME] + '__' + params.data.kommonitorRecordId + '" class="btn btn-danger btn-sm indicatorDeleteFeatureRecordBtn"
            let idArray = this.id.split("__");

            let datasetId = idArray[3];
            let spatialUnitId = idArray[4];
            let featureId = idArray[5];
            let recordId = idArray[6];
                  
                  url += datasetId + "/" + spatialUnitId + "/singleFeature/" + featureId + "/singleFeatureRecord/" + recordId;  

                  $http({
                    url: url,
                    method: "DELETE"
                  }).then(function successCallback(response) {
                      // this callback will be called asynchronously
                      // when the response is available

                      console.log("Successfully deleted database record"); 
                      
                      $rootScope.$broadcast("onDeleteFeatureEntry_" + resourceType);
                      self.featureTable_indicator_lastUpdate_timestamp_success = getCurrentTimestampString(); 
            
                    }, function errorCallback(error) {
                      // called asynchronously if an error occurs
                      // or server returns response with an error status.
                      //$scope.error = response.statusText;
                      console.error("Error while deleting database record. Error is:\n" + error); 
                      $rootScope.$broadcast("hideLoadingIcon_" + resourceType);
                      self.featureTable_indicator_lastUpdate_timestamp_failure = getCurrentTimestampString(); 
                      throw error;
                  });
          });
        
      };

      this.buildDataGrid_featureTable_indicatorResource = function (domElementId, specificHeadersArray, dataArray, datasetId, resourceType, deleteButtonEnabled, spatialUnitId) {

        let dataGridOptions_featureTable = this.buildDataGridOptions_featureTable_indicatorResource(specificHeadersArray, dataArray, datasetId, resourceType, deleteButtonEnabled, spatialUnitId);
        
          let gridDiv = document.querySelector('#' + domElementId);
          while (gridDiv.firstChild) {
            gridDiv.removeChild(gridDiv.firstChild);
          }
          new agGrid.Grid(gridDiv, dataGridOptions_featureTable);
      };


      // ROLE OVERVIEW TABLE

      this.buildDataGridColumnConfig_accessControl = function(isRealmAdmin){
        let columnDefs = [];
        // Only show edit column if user is Realm Admin
        if (isRealmAdmin) {
          columnDefs.push({ headerName: 'Editierfunktionen', maxWidth: 200, checkboxSelection: (row) => {return row.data.name != "public" && row.data.name != "kommonitor"}, filter: false, sortable: false, cellRenderer: 'displayEditButtons_accessControl' });
        }

        return columnDefs.concat([
          //{ headerName: 'Id', field: "organizationalUnitId", minWidth: 400 },
          { headerName: 'Organisationseinheit', field: "name", minWidth: 300 },
          { headerName: 'Rollen', field: "roleString", minWidth: 300 },
          { headerName: 'Beschreibung', field: "description", minWidth: 400 },
          { headerName: 'Kontakt', field: "contact", minWidth: 400 },
        ]);
      };

      this.buildDataGridRowData_accessControl = function(dataArray){
        let data = JSON.parse(JSON.stringify(dataArray));
        for (let elem of data) {
          elem.roleString = "";
          for (let role of elem.roles) {
            elem.roleString += role.permissionLevel + ", ";
          }
          elem.roleString = elem.roleString.substring(0, elem.roleString.length - 2);
        }
        return data;
      };

      this.buildDataGridOptions_accessControl = function(accessControlArray){
          let columnDefs = this.buildDataGridColumnConfig_accessControl(kommonitorDataExchangeService.isRealmAdmin);
          let rowData = this.buildDataGridRowData_accessControl(accessControlArray);
  
          let components = {};
          if (kommonitorDataExchangeService.isRealmAdmin) {
            components = {displayEditButtons_accessControl: displayEditButtons_accessControl};
          } else {
            components = {}
          }

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
            components: components,
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
              headerHeightSetter(self.dataGridOptions_accessControl);
            },
            onColumnResized: function () {
              headerHeightSetter(self.dataGridOptions_accessControl);
            },        
            onRowDataChanged: function () {
              self.registerClickHandler_accessControl(accessControlArray);
            },   
            onModelUpdated: function () {
              self.registerClickHandler_accessControl(accessControlArray);
            },   

            onViewportChanged: function () {
              self.registerClickHandler_accessControl(accessControlArray);                   
            },
  
          };
  
          return gridOptions;        
      };

      this.registerClickHandler_accessControl = function (roleMetadataArray) {

        $(".roleEditMetadataBtn").off();
        $(".roleEditMetadataBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          let id = this.id.split("_")[3];

          let roleMetadata = kommonitorDataExchangeService.getAccessControlById(id);

          $rootScope.$broadcast("onEditRoleMetadata", roleMetadata);
        });
      };  

      this.buildDataGrid_accessControl = function (accessControlArray) {
        
        if (this.dataGridOptions_accessControl && this.dataGridOptions_accessControl.api && document.querySelector('#roleOverviewTable').childElementCount > 0) {

          this.saveGridStore(this.dataGridOptions_accessControl);
          let newRowData = this.buildDataGridRowData_accessControl(accessControlArray);
          this.dataGridOptions_accessControl.api.setRowData(newRowData);
          this.restoreGridStore(this.dataGridOptions_accessControl);
        }
        else {
          this.dataGridOptions_accessControl = this.buildDataGridOptions_accessControl(accessControlArray);
          let gridDiv = document.querySelector('#roleOverviewTable');
          new agGrid.Grid(gridDiv, this.dataGridOptions_accessControl);
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
        
        if (this.dataGridOptions_scripts && this.dataGridOptions_scripts.api && document.querySelector('#scriptOverviewTable').childElementCount > 0) {

          this.saveGridStore(this.dataGridOptions_scripts);
          let newRowData = this.buildDataGridRowData_scripts(scriptsArray);
          this.dataGridOptions_scripts.api.setRowData(newRowData);
          this.restoreGridStore(this.dataGridOptions_scripts);
        }
        else {
          this.dataGridOptions_scripts = this.buildDataGridOptions_scripts(scriptsArray);
          let gridDiv = document.querySelector('#scriptOverviewTable');
          new agGrid.Grid(gridDiv, this.dataGridOptions_scripts);
        }
      };

      // DEFAULT JOBS OVERVIEW TABLE

      this.buildDataGridColumnConfig_defaultJobs = function(){
        const columnDefs = [
          { headerName: 'Job-Id', field: "jobId", pinned: 'left', maxWidth: 125, checkboxSelection: true, headerCheckboxSelection: true, 
          headerCheckboxSelectionFilteredOnly: true },
          { headerName: 'Script-Id', field: "jobData.scriptId", pinned: 'left', maxWidth: 125 },
          { headerName: 'Ziel-Indikator', pinned: 'left', maxWidth: 250, cellRenderer: function (params) {
            if(params.data.jobData && params.data.jobData.targetIndicatorId){
              let indicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(params.data.jobData.targetIndicatorId); 
              if (indicatorMetadata){
                return indicatorMetadata.indicatorName;
              }
            }
            return "";
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              if(params.data.jobData && params.data.jobData.targetIndicatorId){
                let indicatorMetadata = kommonitorDataExchangeService.getIndicatorMetadataById(params.data.jobData.targetIndicatorId); 
                if (indicatorMetadata){
                  return indicatorMetadata.indicatorName;
                }
              }
              return "";
            } 
          },
          { headerName: 'Job-Status', field: "status", maxWidth: 125 },
          { headerName: 'Job-Fortschritt', field: "progress", maxWidth: 125 },
          { headerName: 'Job-Data', minWidth: 500, cellRenderer: function (params) {
              return kommonitorDataExchangeService.syntaxHighlightJSON(params.data.jobData);
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return params.data.jobData;
            } 
          },
          { headerName: 'Job-Logs', maxWidth: 150, cellRenderer: function (params) {
            if(params.data.logs){

              var logJSON = JSON.stringify(params.data.logs);

              var blob = new Blob([logJSON], {type: "application/json"});
              var data  = URL.createObjectURL(blob);

              let html = '<a href="' + data + '" download="KomMonitor-Indikatorberechnung-Job-' + params.data.jobId + '-Logs.json" textContent="JSON" target="_blank" rel="noopener noreferrer"><button class="btn btn-warning btn-sm">Download Logs</button></a>';
              return html;
            }  
            else{
              return "Dieser Job umfasst keine Logs";
            }
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return params.data.logs;
            } 
          },
          { headerName: 'Job-Summary', minWidth: 1000, cellRenderer: function (params) {
            
            let html = "";
                if(params.data.spatialUnitIntegrationSummary && params.data.spatialUnitIntegrationSummary.length > 0){
                  html += '<table class="table table-condensed table-bordered table-striped"><thead><tr><th>Raumeinheits-Id</th><th>Raumeinheits-Name</th><th>Anzahl integrierter Indikatoren-Features</th><th>Anzahl integrierter Zeitstempel</th><th>integrierte Zeitstempel</th><th>Fehlermeldung</th></tr></thead><tbody>';

                  for (const item of params.data.spatialUnitIntegrationSummary) {
                    html += "<tr>";
                    html += "<td>" + item.spatialUnitId + "</td>";
                    html += "<td>" + item.spatialUnitName + "</td>";
                    html += "<td>" + item.numberOfIntegratedIndicatorFeatures + "</td>";
                    html += "<td>" + item.numberOfIntegratedTargetDates + "</td>";
                    html += "<td>" + item.integratedTargetDates + "</td>";
                    if(item.errorsOccurred && item.errorsOccurred.length > 0){
                      html += "<td>" + kommonitorDataExchangeService.syntaxHighlightJSON(item.errorsOccurred) + "</td>";
                    }
                    else{
                      html += "<td>keine Fehlermeldungen vorhanden</td>";
                    }
                    
                    html += "</tr>";
                  }
                  html += "</tbody></table>";
                }
                else{
                  html += "Dieser Job umfasst keine Informationen zur erfolgreichen/gescheiterten Datenintegration";
                }
                
                return html; 
          },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
            return JSON.stringify(params.data.spatialUnitIntegrationSummary);
          } 
        }
                              
        ];

        return columnDefs;
      };

      this.buildDataGridRowData_defaultJobs = function(dataArray){

        dataArray.sort((a, b) => b.jobId - a.jobId);
        
        return dataArray;
      };

      this.buildDataGridOptions_defaultJobs = function(jobsArray){
          let columnDefs = this.buildDataGridColumnConfig_defaultJobs();
          let rowData = this.buildDataGridRowData_defaultJobs(jobsArray);
  
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

      this.buildDataGrid_defaultJobs = function (jobsArray) {
        
        if (this.dataGridOptions_defaultJobs && this.dataGridOptions_defaultJobs.api && document.querySelector('#jobExecutionTable_defaultComputation').childElementCount > 0) {

          this.saveGridStore(this.dataGridOptions_defaultJobs);
          let newRowData = this.buildDataGridRowData_defaultJobs(jobsArray);
          this.dataGridOptions_defaultJobs.api.setRowData(newRowData);
          this.restoreGridStore(this.dataGridOptions_defaultJobs);
        }
        else {
          this.dataGridOptions_defaultJobs = this.buildDataGridOptions_defaultJobs(jobsArray);
          let gridDiv = document.querySelector('#jobExecutionTable_defaultComputation');
          new agGrid.Grid(gridDiv, this.dataGridOptions_defaultJobs);
        }
      };

      // CUSTOMIZED JOBS OVERVIEW TABLE

      this.buildDataGridColumnConfig_customizedJobs = function(){
        const columnDefs = [
          { headerName: 'Job-Id', field: "jobId", pinned: 'left', maxWidth: 125, checkboxSelection: true, headerCheckboxSelection: true, 
          headerCheckboxSelectionFilteredOnly: true},
          { headerName: 'Job-Status', field: "status", maxWidth: 125 },
          { headerName: 'Job-Fortschritt', field: "progress", maxWidth: 125 },
          { headerName: 'Job-Data', minWidth: 500, cellRenderer: function (params) {
            return kommonitorDataExchangeService.syntaxHighlightJSON(params.data.jobData);
          },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
            return params.data.jobData;
          } 
          },
          { headerName: 'Job-Logs', maxWidth: 150, cellRenderer: function (params) {
            if(params.data.logs){

              var logJSON = JSON.stringify(params.data.logs);

              var blob = new Blob([logJSON], {type: "application/json"});
              var data  = URL.createObjectURL(blob);

              let html = '<a href="' + data + '" download="KomMonitor-Indikatorberechnung-individuell-Job-' + params.data.jobId + '-Logs.json" textContent="JSON" target="_blank" rel="noopener noreferrer"><button class="btn btn-warning btn-sm">Download Logs</button></a>';
              return html;
            } 
            else{
              return "Dieser Job umfasst keine Logs";
            } 
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return params.data.logs;
            } 
          }
                          
        ];

        return columnDefs;
      };

      this.buildDataGridRowData_customizedJobs = function(dataArray){
        
        dataArray.sort((a, b) => b.jobId - a.jobId);

        return dataArray;
      };

      this.buildDataGridOptions_customizedJobs = function(jobsArray){
          let columnDefs = this.buildDataGridColumnConfig_customizedJobs();
          let rowData = this.buildDataGridRowData_customizedJobs(jobsArray);
  
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

      this.buildDataGrid_customizedJobs = function (jobsArray) {
        
        if (this.dataGridOptions_customizedJobs && this.dataGridOptions_customizedJobs.api && document.querySelector('#jobExecutionTable_customizedComputation').childElementCount > 0) {

          this.saveGridStore(this.dataGridOptions_customizedJobs);
          let newRowData = this.buildDataGridRowData_customizedJobs(jobsArray);
          this.dataGridOptions_customizedJobs.api.setRowData(newRowData);
          this.restoreGridStore(this.dataGridOptions_customizedJobs);
        }
        else {
          this.dataGridOptions_customizedJobs = this.buildDataGridOptions_customizedJobs(jobsArray);
          let gridDiv = document.querySelector('#jobExecutionTable_customizedComputation');
          new agGrid.Grid(gridDiv, this.dataGridOptions_customizedJobs);
        }
      };

      function anyHigherRoleIsChecked(roles, roleSuffix){
        let filteresRoles = [];
        
        if(roleSuffix == "viewer"){
          filteresRoles = roles.filter(function(role){
            if (role.isChecked && (role.permissionLevel == "editor" || role.permissionLevel == "creator")){
              return true;
            }
          });
        }
        else if (roleSuffix == "editor"){
          filteresRoles = roles.filter(function(role){
            if (role.isChecked && role.permissionLevel == "creator"){
              return true;
            }
          });
        }
        
        return filteresRoles.length > 0;
      };

      function CheckboxRenderer_viewer() {}

      CheckboxRenderer_viewer.prototype.init = function(params) {
        this.params = params;

        let isChecked = false;
        let exists = false;
        let className;
        for (const role of params.data.roles) {
          if (role.permissionLevel == "viewer"){
            exists = true;
            isChecked = role.isChecked;
            className = role.roleId;
            break;
          }
        }  

        if(exists){
          this.eGui = document.createElement('input');
          this.eGui.className = className;
          this.eGui.type = 'checkbox';
          this.eGui.checked = isChecked;

          this.checkedHandler = this.checkedHandler.bind(this);
          this.eGui.addEventListener('click', this.checkedHandler);
          // if higher role rights are checked as well 
          if(isChecked && anyHigherRoleIsChecked(params.data.roles, "viewer")){
            this.eGui.disabled = true;
          }                    
        }
      };

      CheckboxRenderer_viewer.prototype.checkedHandler = function(e) {
        let checked = e.target.checked;

        for (const role of this.params.data.roles) {
          if (role.permissionLevel == "viewer"){            
            role.isChecked = checked;
            break;
          }
        }  
      };

      CheckboxRenderer_viewer.prototype.getGui = function(params) {
        return this.eGui;
      };

      CheckboxRenderer_viewer.prototype.destroy = function(params) {
        if(this.eGui){
          this.eGui.removeEventListener('click', this.checkedHandler);
        }        
      };

      function CheckboxRenderer_editor() {}

      CheckboxRenderer_editor.prototype.init = function(params) {
        this.params = params;

        let isChecked = false;
        let exists = false;
        let className;
        for (const role of params.data.roles) {
          if (role.permissionLevel == "editor"){
            exists = true;
            isChecked = role.isChecked;
            className = role.roleId;
            break;
          }
        }  

        if(exists){
          this.eGui = document.createElement('input');
          this.eGui.className = className;
          this.eGui.type = 'checkbox';
          this.eGui.checked = isChecked;

          this.checkedHandler = this.checkedHandler.bind(this);
          this.eGui.addEventListener('click', this.checkedHandler);
          // if higher role rights are checked as well 
          if(isChecked && anyHigherRoleIsChecked(params.data.roles, "editor")){
            this.eGui.disabled = true;
          } 
        }
      };

      CheckboxRenderer_editor.prototype.checkedHandler = function(e) {
        let checked = e.target.checked;
        for (const role of this.params.data.roles) {
          if (role.permissionLevel == "viewer"){    
            if (checked){
              role.isChecked = true;
              $('.' + role.roleId).attr('disabled', true);
              $('.' + role.roleId).prop("checked", true);
            }                    
            else{
              $('.' + role.roleId).attr('disabled', false);
            }
          }
          else if (role.permissionLevel == "editor"){            
            role.isChecked = checked;
          }
        }  
      };

      CheckboxRenderer_editor.prototype.getGui = function(params) {
        return this.eGui;
      };

      CheckboxRenderer_editor.prototype.destroy = function(params) {
        if(this.eGui){
          this.eGui.removeEventListener('click', this.checkedHandler);
        }  
      };

      function CheckboxRenderer_creator() {}

      CheckboxRenderer_creator.prototype.init = function(params) {
        this.params = params;

        let isChecked = false;
        let exists = false;
        let className;
        for (const role of params.data.roles) {
          if (role.permissionLevel == "creator"){
            exists = true;
            isChecked = role.isChecked;
            className = role.roleId;
            break;
          }
        }  

        if(exists){
          this.eGui = document.createElement('input');
          this.eGui.className = className;
          this.eGui.type = 'checkbox';
          this.eGui.checked = isChecked;

          this.checkedHandler = this.checkedHandler.bind(this);
          this.eGui.addEventListener('click', this.checkedHandler);
        }
      };

      CheckboxRenderer_creator.prototype.checkedHandler = function(e) {
        let checked = e.target.checked;
        for (const role of this.params.data.roles) {
          if (role.permissionLevel == "publisher"){            
            if(!checked)
              role.isChecked = false;
          }
          else if (role.permissionLevel == "editor"){            
            if (checked){
              role.isChecked = true;
              $('.' + role.roleId).attr('disabled', true);
              $('.' + role.roleId).prop("checked", true);
            }                    
            else{
              $('.' + role.roleId).attr('disabled', false);
            }
          }
          else if (role.permissionLevel == "viewer"){            
            if (checked){
              role.isChecked = true;
              $('.' + role.roleId).attr('disabled', true);
              $('.' + role.roleId).prop("checked", true);
            }                    
            else{
              $('.' + role.roleId).attr('disabled', true);
            }
          }
          else if (role.permissionLevel == "creator" || role.permissionLevel == "editor" || role.permissionLevel == "viewer"){            
            role.isChecked = checked;
          }
        }  
      };

      CheckboxRenderer_creator.prototype.getGui = function(params) {
        return this.eGui;
      };

      CheckboxRenderer_creator.prototype.destroy = function(params) {
        if(this.eGui){
          this.eGui.removeEventListener('click', this.checkedHandler);
        }  
      };

      this.buildRoleManagementGridRowData = function(accessControlMetadata, selectedRoleIds){
        let data = JSON.parse(JSON.stringify(accessControlMetadata));
        for (let elem of data) {
          for (let role of elem.roles) {
            role.isChecked = false;
            if (selectedRoleIds && selectedRoleIds.includes(role.roleId)){
              role.isChecked = true;
            }
          }
        }

        let array = [];
        array.push(data[0]);
        array.push(data[1]);

        data.splice(0,2);
        data.sort(function (a, b) {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }
          return 0;
        });

        array = array.concat(data);

        return array;
      };

      this.buildRoleManagementGridColumnConfig = function(){
        let columnDefs = [];

        return columnDefs.concat([
          { headerName: 'Organisationseinheit', field: "name", minWidth: 200 },
          { headerName: 'lesen', field: "roles", filter: false, sortable: false, maxWidth: 100, cellRenderer: 'checkboxRenderer_viewer', },
          { headerName: 'editieren', field: "roles", filter: false, sortable: false, maxWidth: 100, cellRenderer: 'checkboxRenderer_editor', },
          { headerName: 'löschen', field: "roles", filter: false, sortable: false, maxWidth: 100, cellRenderer: 'checkboxRenderer_creator', }          
        ]);
      };

      this.buildRoleManagementGridOptions = function(accessControlMetadata, selectedRoleIds){
        let columnDefs = this.buildRoleManagementGridColumnConfig();
          let rowData = this.buildRoleManagementGridRowData(accessControlMetadata, selectedRoleIds);
  
          let components = {
            checkboxRenderer_viewer: CheckboxRenderer_viewer,
            checkboxRenderer_editor: CheckboxRenderer_editor,
            checkboxRenderer_creator: CheckboxRenderer_creator
          };

          let gridOptions = {
            defaultColDef: {
              editable: false,
              sortable: true,
              flex: 1,
              minWidth: 200,
              filter: true,
              floatingFilter: false,
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
            components: components,
            floatingFilter: false,
            columnDefs: columnDefs,
            rowData: rowData,
            rowHeight: 10,
            suppressRowClickSelection: true,
            rowSelection: 'multiple',
            enableCellTextSelection: false,
            ensureDomOrder: true,
            pagination: true,
            paginationPageSize: 5,
            suppressColumnVirtualisation: true,          
            onFirstDataRendered: function () {
            },
            onColumnResized: function () {
              self.registerClickHandler_accessControl(accessControlMetadata);
            },        
            onRowDataChanged: function () {
              self.registerClickHandler_accessControl(accessControlMetadata);
            },   
            onModelUpdated: function () {
              self.registerClickHandler_accessControl(accessControlMetadata);
            },   
            onViewportChanged: function () {   
              self.registerClickHandler_accessControl(accessControlMetadata);    
            },
  
          };
  
          return gridOptions;
      };

      this.buildRoleManagementGrid = function(tableDOMId, currentTableOptionsObject, accessControlMetadata, selectedRoleIds){
        if (currentTableOptionsObject && currentTableOptionsObject.api) {

          let newRowData = this.buildRoleManagementGridRowData(accessControlMetadata, selectedRoleIds);
          currentTableOptionsObject.api.setRowData(newRowData);
        }
        else {
          currentTableOptionsObject = this.buildRoleManagementGridOptions(accessControlMetadata, selectedRoleIds);
          let gridDiv = document.querySelector('#' + tableDOMId);
          new agGrid.Grid(gridDiv, currentTableOptionsObject);
        }
        return currentTableOptionsObject;
      };

      this.getSelectedRoleIds_roleManagementGrid = function(roleManagementTableOptions){
        let ids = [];
        if (roleManagementTableOptions && roleManagementTableOptions.api){

          roleManagementTableOptions.api.forEachNode(function(node, index){
            for (const role of node.data.roles) {
              if(role && role.isChecked){
                ids.push(role.roleId);
              }
            }
          })               
        }
        return ids;
      };

      // INDICATOR REFERENCE VALUES

      this.buildDataGridColumnConfig_regionalReferenceValues = function(applicableDates, regionalReferenceValuesList){
        const columnDefs = [
          { headerName: 'Zeitpunkt', field: "referenceDate", pinned: 'left', cellDataType: 'text', editable: false, cellClass: "grid-non-editable", maxWidth: 150
          },
          { headerName: 'regionale Gesamtsumme', field: "regionalSum", cellDataType: 'number', maxWidth: 200 },
          { headerName: 'regionaler Durchschnittswert', field: "regionalAverage", cellDataType: 'number', maxWidth: 200 }, 
        ];

        return columnDefs;
      };

      this.buildDataGridRowData_regionalReferenceValues = function(applicableDates, regionalReferenceValuesList){
        
        /*
          regionalReferenceValuesList: 
            [
              {
                  "referenceDate": "2021-12-31",
                  "regionalSum": 3000,
                  "regionalAverage": 144
              },
              {
                  "referenceDate": "2022-12-31",
                  "regionalSum": 3500,
                  "regionalAverage": 148
              }
            ]
        */

          let dataArray = [];

        if(applicableDates && applicableDates.length > 0){

          for (const availableDate of applicableDates) {
            let item = {
              "referenceDate": availableDate,
              "regionalSum": undefined,
              "regionalMean": undefined,
            };

            if(regionalReferenceValuesList && regionalReferenceValuesList.length > 0){
              for (const regionalReferenceValuesListEntry of regionalReferenceValuesList) {
                if(regionalReferenceValuesListEntry.referenceDate == availableDate){
                  item = regionalReferenceValuesListEntry;
                  break;
                }
              }
            }
            

            dataArray.push(item);
          }
          
        }
        
        return dataArray;
      };

      this.buildDataGridOptions_regionalReferenceValues = function(applicableDates, regionalReferenceValuesList){
          let columnDefs = this.buildDataGridColumnConfig_regionalReferenceValues(applicableDates, regionalReferenceValuesList);
          let rowData = this.buildDataGridRowData_regionalReferenceValues(applicableDates, regionalReferenceValuesList);
  
          let gridOptions = {
            defaultColDef: {
              editable: true,
              // enables the fill handle
              enableFillHandle: false,              
              cellEditor: 'agNumberCellEditor',
              cellEditorParams: {
                precision: 2,
                step: 0.25,
                showStepperButtons: true
              },              
              sortable: true,
              flex: 1,
              minWidth: 200,
              filter: true,
              floatingFilter: false,
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
            // enables undo / redo
            undoRedoCellEditing: true,
            // restricts the number of undo / redo steps to 10
            undoRedoCellEditingLimit: 10,
            // enables flashing to help see cell changes
            enableCellChangeFlash: true,
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
            onRowDataChanged: function () {
            },  
            onModelUpdated: function () {
              
            }, 
            onViewportChanged: function () {                  
            },
  
          };
  
          return gridOptions;        
      };

      this.buildReferenceValuesManagementGrid = function (domElementId, applicableDates, regionalReferenceValuesList) {

        let dataGridOptions_regionalReferenceValues;

        dataGridOptions_regionalReferenceValues = this.buildDataGridOptions_regionalReferenceValues(applicableDates, regionalReferenceValuesList);
        
          let gridDiv = document.querySelector('#' + domElementId);
          while (gridDiv.firstChild) {
            gridDiv.removeChild(gridDiv.firstChild);
          }
          new agGrid.Grid(gridDiv, dataGridOptions_regionalReferenceValues);
      };

      this.getReferenceValues_regionalReferenceValuesManagementGrid = function(regionalReferenceValuesManagementTableOptions){
        let regionalReferenceValuesList = [];
        if (regionalReferenceValuesManagementTableOptions && regionalReferenceValuesManagementTableOptions.api){

          /*
              regionalReferenceValuesList: 
              [
                {
                    "referenceDate": "2021-12-31",
                    "regionalSum": 3000,
                    "regionalAverage": 144
                },
                {
                    "referenceDate": "2022-12-31",
                    "regionalSum": 3500,
                    "regionalAverage": 148
                }
              ]
              
          */
          regionalReferenceValuesManagementTableOptions.api.forEachNode(function(node, index){            
            regionalReferenceValuesList.push(node.data);           
          })               
        }
        return regionalReferenceValuesList;
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
