angular.module('kommonitorDataGridHelper', ['kommonitorDataExchange',  
  'kommonitorScriptHelper', 'kommonitorToastHelper']);

angular
  .module('kommonitorDataGridHelper', [])
  .service(
    'kommonitorDataGridHelperService', ['kommonitorDataExchangeService', 'kommonitorScriptHelperService',
      '$rootScope', '$timeout', '$http', '$httpParamSerializerJQLike', '__env', 'kommonitorToastHelperService',      
    function (kommonitorDataExchangeService, kommonitorScriptHelperService, $rootScope, $timeout,
      $http, $httpParamSerializerJQLike, __env, kommonitorToastHelperService, 
      ) {

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
      this.reducedRoleManagement = false;

      this.dataGridOptions_globalFilter;

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
          // let disabled = params.data.applicableSpatialUnits.length == 0 || !params.data.userPermissions.includes("creator");
          
          // Now, access control is editable only if user has creator permissions
          let disabled = !params.data.userPermissions.includes("creator");
          html += '<button id="btn_indicator_editRoleBasedAccess_' + params.data.indicatorId + '"class="btn btn-warning btn-sm indicatorEditRoleBasedAccessBtn ';

          if (disabled) {
            html += 'disabled" disabled';
          }

          html += ' type="button" data-toggle="modal" data-target="#modal-edit-indicator-spatial-unit-roles" title="Zugriffsschutz und Eigentümerschaft editieren"><i class="fas fa-user-lock"></i></button>';
        }
        html += '</div>';

        return html;
      };

      var displayEditButtons_georesources = function (params) {
        let editMetadataButtonId = 'btn_georesource_editMetadata_' + params.data.georesourceId;
        let editFeaturesButtonId = 'btn_georesource_editFeatures_' + params.data.georesourceId;
        let editUserRolesButtonId = 'btn_georesource_editUserRoles_' + params.data.georesourceId;

        let html = '<div class="btn-group btn-group-sm">';
        html += '<button id="'+ editMetadataButtonId +'" class="btn btn-warning btn-sm georesourceEditMetadataBtn" type="button" data-toggle="modal" data-target="#modal-edit-georesource-metadata" title="Metadaten editieren" '+ (params.data.userPermissions.includes("editor") ? '' : 'disabled') + '><i class="fas fa-pencil-alt" ></i></button>';
        html += '<button id="'+ editFeaturesButtonId + '" class="btn btn-warning btn-sm georesourceEditFeaturesBtn" type="button" data-toggle="modal" data-target="#modal-edit-georesource-features" title="Features fortf&uuml;hren" '+ (params.data.userPermissions.includes("editor") ? '' : 'disabled') + '><i class="fas fa-draw-polygon"></i></button>';
        html += '<button id="'+ editUserRolesButtonId + '" class="btn btn-warning btn-sm georesourceEditUserRolesBtn" type="button" data-toggle="modal" data-target="#modal-edit-georesources-user-roles" title="Zugriffsschutz und Eigentümerschaft editieren"  '+ (params.data.userPermissions.includes("creator") ? '' : 'disabled') + '><i class="fas fa-user-lock"></i></button>'
        html += '<button id="btn_georesource_deleteGeoresource_' + params.data.georesourceId + '" class="btn btn-danger btn-sm georesourceDeleteBtn" type="button" data-toggle="modal" data-target="#modal-delete-georesources" title="Georessource entfernen"  '+ (params.data.userPermissions.includes("creator") ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>'
        html += '</div>';

        return html;
      };

      var displayEditButtons_spatialUnits = function (params) {

        let html = '<div class="btn-group btn-group-sm">';
        html += '<button id="btn_spatialUnit_editMetadata_' + params.data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditMetadataBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-metadata" title="Metadaten editieren"  '+ (params.data.userPermissions.includes("editor") ? '' : 'disabled') + '><i class="fas fa-pencil-alt"></i></button>';
        html += '<button id="btn_spatialUnit_editFeatures_' + params.data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditFeaturesBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-features" title="Features fortf&uuml;hren"  '+ (params.data.userPermissions.includes("editor") ? '' : 'disabled') + '><i class="fas fa-draw-polygon"></i></button>';
        html += '<button id="btn_spatialUnit_editUserRoles_' + params.data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditUserRolesBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-user-roles" title="Zugriffsschutz und Eigentümerschaft editieren"  '+ (params.data.userPermissions.includes("creator") ? '' : 'disabled') + '><i class="fas fa-user-lock"></i></button>'
        html += '<button id="btn_spatialUnit_deleteSpatialUnit_' + params.data.spatialUnitId + '" class="btn btn-danger btn-sm spatialUnitDeleteBtn" type="button" data-toggle="modal" data-target="#modal-delete-spatial-units" title="Raumebene entfernen"  '+ (params.data.userPermissions.includes("creator") ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>'
        html += '</div>';

        return html;
      };

      var displayEditButtons_globalFilter = function (params) {

        let html = '<div class="btn-group btn-group-sm">';
        html += '<button id="btn_globalFilter_editFilter_' + params.data.filterId + '" class="btn btn-warning btn-sm globalFilterEditBtn" type="button" data-toggle="modal" data-target="#modal-edit-admin-filter" title="Filter editieren"><i class="fas fa-pencil-alt"></i></button>';
        html += '<button id="btn_globalFilter_deleteFilter_' + params.data.filterId + '" class="btn btn-danger btn-sm globalFilterDeleteBtn" type="button" title="Filter entfernen"><i class="fas fa-trash"></i></button>'
        html += '</div>';

        return html;
      };

      var displayEditButtons_accessControl = function (params) {

        let html = '<div class="btn-group btn-group-sm">';
        html += '<button id="btn_role_editMetadata_' + params.data.organizationalUnitId + '" class="btn btn-warning btn-sm roleEditMetadataBtn" type="button" data-toggle="modal" data-target="#modal-edit-role-metadata" title="Metadaten editieren" ' +  ((params.data.userAdminRoles.includes("client-users-creator") || (params.data.userAdminRoles.includes("unit-users-creator"))) ? '' : 'disabled') + '><i class="fas fa-pencil-alt"></i></button>';
        html += '<button id="btn_role_editGroupRight_' + params.data.organizationalUnitId + '" class="btn btn-warning btn-sm roleEditGroupRightsBtn" type="button" data-toggle="modal" data-target="#modal-edit-role-group-rights" title="Gruppenspezifische Rechte editieren"' +  ((params.data.userAdminRoles.includes("client-users-creator") || (params.data.userAdminRoles.includes("unit-users-creator"))) ? '' : 'disabled') + '><i class="fas fa-user-lock"></i></button>'
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
            headerName: 'Verfügbare Raumebenen', field: "applicableSpatialUnits", minWidth: 400,
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
          { headerName: 'Rollen', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" +  kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions);
            } 
          },
          { headerName: 'Öffentlich sichtbar', minWidth: 400, cellRenderer: function (params) { return params.data.isPublic ? 'ja' : 'nein'; },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" + (params.data.isPublic ? 'ja' : 'nein');
            } 
          },
          { headerName: 'Eigentümer', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getRoleTitle(params.data.ownerId); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" + kommonitorDataExchangeService.getRoleTitle(params.data.ownerId);
            } 
          },
          { headerName: 'Nachkommastellen', minWidth: 200, cellRenderer: function (params) { return params.data.precision; },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" +  params.data.precision;
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
          { headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 170, checkboxSelection: false,
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
          { headerName: 'Rollen', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" +  kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions);
            } 
          },
          { headerName: 'Öffentlich sichtbar', minWidth: 400, cellRenderer: function (params) { return params.data.isPublic ? 'ja' : 'nein'; },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" + (params.data.isPublic ? 'ja' : 'nein');
            } 
          },
          { headerName: 'Eigentümer', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getRoleTitle(params.data.ownerId); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" + kommonitorDataExchangeService.getRoleTitle(params.data.ownerId);
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
          { headerName: 'Rollen', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" +  kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions);
            } 
          },
          { headerName: 'Öffentlich sichtbar', minWidth: 400, cellRenderer: function (params) { return params.data.isPublic ? 'ja' : 'nein'; },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" + (params.data.isPublic ? 'ja' : 'nein');
            } 
          },
          { headerName: 'Eigentümer', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getRoleTitle(params.data.ownerId); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" + kommonitorDataExchangeService.getRoleTitle(params.data.ownerId);
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
          { headerName: 'Rollen', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" +  kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions);
            } 
          },
          { headerName: 'Öffentlich sichtbar', minWidth: 400, cellRenderer: function (params) { return params.data.isPublic ? 'ja' : 'nein'; },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" + (params.data.isPublic ? 'ja' : 'nein');
            } 
          },
          { headerName: 'Eigentümer', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getRoleTitle(params.data.ownerId); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" + kommonitorDataExchangeService.getRoleTitle(params.data.ownerId);
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
          { headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 170, checkboxSelection: false, headerCheckboxSelection: false, 
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
          { headerName: 'Rollen', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" +  kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions);
            } 
          },
          { headerName: 'Öffentlich sichtbar', minWidth: 400, cellRenderer: function (params) { return params.data.isPublic ? 'ja' : 'nein'; },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" + (params.data.isPublic ? 'ja' : 'nein');
            } 
          },
          { headerName: 'Eigentümer', minWidth: 400, cellRenderer: function (params) { return kommonitorDataExchangeService.getRoleTitle(params.data.ownerId); },
          filter: 'agTextColumnFilter', 
          filterValueGetter: (params) => {
              return "" + kommonitorDataExchangeService.getRoleTitle(params.data.ownerId);
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

        
        $(".georesourceEditUserRolesBtn").off();
        $(".georesourceEditUserRolesBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          let georesourceId = this.id.split("_")[3];

          let georesourceMetadata = kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceId);

          $rootScope.$broadcast("onEditGeoresourcesUserRoles", georesourceMetadata);
        });

        $(".georesourceDeleteBtn").off();
        $(".georesourceDeleteBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
                 
          let georesourceId = this.id.split("_")[3]; 

          let georesourceMetadata = kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceId);

          $rootScope.$broadcast("onDeleteGeoresources", [georesourceMetadata]); //handler function takes an array
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

        $(".spatialUnitEditUserRolesBtn").off();
        $(".spatialUnitEditUserRolesBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          let spatialUnitId = this.id.split("_")[3];

          let spatialUnitMetadata = kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);

          $rootScope.$broadcast("onEditSpatialUnitUserRoles", spatialUnitMetadata);
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

      // GLOBAL FILTER table

      this.buildDataGrid_globalFilter = function (spatialUnitMetadataArray) {
        
        if (this.dataGridOptions_globalFilter && this.dataGridOptions_globalFilter.api && document.querySelector('#globalFilterOverviewTable').childElementCount > 0) {

          this.saveGridStore(this.dataGridOptions_globalFilter);
          let newRowData = this.buildDataGridRowData_globalFilter(spatialUnitMetadataArray);
          this.dataGridOptions_globalFilter.api.setRowData(newRowData);
          this.restoreGridStore(this.dataGridOptions_globalFilter);
        }
        else {
          this.dataGridOptions_globalFilter = this.buildDataGridOptions_globalFilter(spatialUnitMetadataArray);
          let gridDiv = document.querySelector('#globalFilterOverviewTable');
          new agGrid.Grid(gridDiv, this.dataGridOptions_globalFilter);
        }
      };

      this.buildDataGridOptions_globalFilter = function (spatialUnitMetadataArray) {
        let columnDefs = this.buildDataGridColumnConfig_globalFilter(spatialUnitMetadataArray);
        let rowData = this.buildDataGridRowData_globalFilter(spatialUnitMetadataArray);

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
            displayEditButtons_globalFilter: displayEditButtons_globalFilter
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
            headerHeightSetter(self.dataGridOptions_globalFilter);
          },
          onColumnResized: function () {
            headerHeightSetter(self.dataGridOptions_globalFilter);
          },        
          onRowDataChanged: function () {
            self.registerClickHandler_globalFilter(spatialUnitMetadataArray);
          },   
          onModelUpdated: function () {
            self.registerClickHandler_globalFilter(spatialUnitMetadataArray);
            
          },
          onViewportChanged: function () {
            self.registerClickHandler_globalFilter(spatialUnitMetadataArray);                   
          },

        };

        return gridOptions;
      };

      this.buildDataGridRowData_globalFilter = function (spatialUnitMetadataArray) {
        return spatialUnitMetadataArray;
      };

      this.buildDataGridColumnConfig_globalFilter = function (spatialUnitMetadataArray) {
        const columnDefs = [
          { headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 150, checkboxSelection: false, headerCheckboxSelection: false, 
          headerCheckboxSelectionFilteredOnly: true, filter: false, sortable: false, cellRenderer: 'displayEditButtons_globalFilter' },
          { headerName: 'Name', field: "name", pinned: 'left', minWidth: 300 },
          { headerName: 'Indikatoren', field: "indicators", minWidth: 250 },
          { headerName: 'Indikator-Themen', field: "indicatorTopics", minWidth: 250 },    
          { headerName: 'Georesourcen', field: "georesources", minWidth: 250 },
          { headerName: 'Georesource-Themen', field: "georesourceTopics", minWidth: 250 },   
        ];

        return columnDefs;
      };

      this.registerClickHandler_globalFilter = function (spatialUnitMetadataArray) {

        $(".globalFilterEditBtn").off();
        $(".globalFilterEditBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          let adminFilterId = this.id.split("_")[3];

          $rootScope.$broadcast("onGlobalFilterEdit", adminFilterId);
        });

        $(".globalFilterDeleteBtn").off();
        $(".globalFilterDeleteBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          event.stopPropagation();
          
          let adminFilterId = this.id.split("_")[3];

          $rootScope.$broadcast("onGlobalFilterDelete", adminFilterId);
        });

      };

      // END

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

                  // now delete information - only ID, fid as datatabel recordId and all timestamp attributes starting with prefix 'DATE_' shall remain for indicator record update
                  //
                  let allowedProperties = [__env.FEATURE_ID_PROPERTY_NAME, 'fid'];
                  for (const key in json) {
                    if (Object.hasOwnProperty.call(json, key)) {
                      if(! key.includes(__env.indicatorDatePrefix) && !allowedProperties.includes(key)){
                        delete json[key];
                      }                      
                    }
                  }
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

        // Select button will only be rendered if user has edit rights for orga
        columnDefs.push({ headerName: 'Editierfunktionen', pinned: 'left', maxWidth: 150, checkboxSelection: (row) => {return row.data.userAdminRoles.includes("client-users-creator") || row.data.userAdminRoles.includes("unit-users-creator")}, filter: false, sortable: false, cellRenderer: 'displayEditButtons_accessControl' });
        
        return columnDefs.concat([
          { 
            headerName: 'Organisationseinheit', 
            field: "name", 
            pinned: 'left', 
            minWidth: 250,
            cellClass: 'user-roles-normal'
          }, 
          { headerName: 'Hierarchie - übergeordnete Organisationseinheit', field: "parentName",  maxWidth: 250 }, 
          { headerName: 'Hierarchie - direkt untergeordnete Organisationseinheiten', 
              cellRenderer: function(param){                
                return param.data.ownChildGroupsCount + " direkte Untergruppe(n)<br/><br/>" + param.data.ownChildGroupNames;
              }, 
            maxWidth: 250,  filter: false},        
          { headerName: 'Beschreibung', field: "description", maxWidth: 300 },
          { headerName: 'Kontakt', field: "contact", maxWidth: 300 },
          { headerName: 'Mandant', field: "mandant", cellDataType: 'boolean', maxWidth: 125 }
          
        ]);
      };

      this.buildDataGridRowData_accessControl = function(dataArray){
        return dataArray.map(dataItem => {
          // add geometry and database record ID to properties to be available within data grid object
          let parentId = dataItem.parentId;
          let parentName = "";
          let parentObject = dataArray.filter(item => item.organizationalUnitId == parentId)[0];
          if(parentObject && parentObject.name){
            parentName = parentObject.name;
          }          
          dataItem.parentName = parentName;
          
          dataItem.ownChildGroupsCount = dataItem.children.length;

          let organizationalUnitChildrenUnits = dataItem.children.map(id => kommonitorDataExchangeService.getAccessControlById(id)).map(o => o.name);
          dataItem.ownChildGroupNames = organizationalUnitChildrenUnits;
          return dataItem;
         }
        );
      };

      this.buildDataGridOptions_accessControl = function(accessControlArray){
          let columnDefs = this.buildDataGridColumnConfig_accessControl(kommonitorDataExchangeService.isRealmAdmin);
          let rowData = this.buildDataGridRowData_accessControl(accessControlArray);
  
          let components = {};
          // if (kommonitorDataExchangeService.isRealmAdmin) {
          //   components = {displayEditButtons_accessControl: displayEditButtons_accessControl};
          // } else {
          //   components = {}
          // }

          components = {displayEditButtons_accessControl: displayEditButtons_accessControl};

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

          $rootScope.$broadcast("onEditOrganizationalUnitMetadata", roleMetadata);
        }); 
        
        $(".roleEditGroupRightsBtn").off();
        $(".roleEditGroupRightsBtn").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          let id = this.id.split("_")[3];

          let roleId = kommonitorDataExchangeService.getAccessControlById(id);

          $rootScope.$broadcast("onEditOrganizationalUnitGroupRights", roleId);
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

      this.buildDataGridColumnConfig_scripts = function(showScriptIds, showProcessDescription){

        let columnDefs = [];

        columnDefs = columnDefs.concat([
          
          { headerName: 'Ziel-Indikatoren-Name', pinned: 'left', minWidth: 250, checkboxSelection: true, headerCheckboxSelection: true, 
              headerCheckboxSelectionFilteredOnly: true, cellRenderer: function (params) {

                let propertyNameForNewJobIdCheck = kommonitorScriptHelperService.PROPETRY_NAME_PREFIX_FOUND_NEW_JOB_ID + params.data.scheduleID;
                let isWaitingForTriggeredJobToBeAvailable = kommonitorScriptHelperService[propertyNameForNewJobIdCheck] != undefined ? ! kommonitorScriptHelperService[propertyNameForNewJobIdCheck] : false; 

                let html = "";

                html += kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.inputs.target_indicator_id);

                html += "<br> <br>"
                  + "<button class='btn-sm executeScriptBtn' id='btnExecuteScript_" + params.data.scheduleID +"'";
                  if(isWaitingForTriggeredJobToBeAvailable){
                    html += " disabled";
                  }
                  
                  html += "><i class='fa-solid fa-play'></i> Berechnung starten <span id='btnExecuteScript_" + params.data.scheduleID +"_span' style='"; 
  
                  if(! isWaitingForTriggeredJobToBeAvailable){
                    html += "display:none;";
                  }
                  else{
                    html += "display:inline-block;";
                  }
                  html += "' class='glyphicon glyphicon-refresh icon-spin'"
                  html += "</button>";
              return html;
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              return kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.inputs.target_indicator_id);
            } 
          }
        ]);

        if(showScriptIds){
          columnDefs = columnDefs.concat(
            [
              { headerName: 'Skript-Id', field: "scheduleID", pinned: 'left', maxWidth: 125, },
              // { headerName: 'Name', field: "name", pinned: 'left', maxWidth: 300 },  
              { headerName: 'Ziel-Indikatoren-Id', field: "indicatorId", maxWidth: 125, cellRenderer: function (params) {
                  return params.data.inputs.target_indicator_id;
                } 
              }
            ]);
        }

        columnDefs = columnDefs.concat([          
          { headerName: 'Berechnungsart', maxWidth: 175, cellRenderer: function (params) {

            for (const scriptType of kommonitorScriptHelperService.availableScriptTypeOptions) {
                if(scriptType && scriptType.additional_parameters && scriptType.additional_parameters.parameters[0] && scriptType.additional_parameters.parameters[0].value[0]){
                  if (scriptType.additional_parameters.parameters[0].value[0].apiName == params.data.processID){
                    return scriptType.title;
                  }
                }              
              }
            
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              for (const scriptType of kommonitorScriptHelperService.availableScriptTypeOptions) {
                if(scriptType && scriptType.additional_parameters && scriptType.additional_parameters.parameters[0] && scriptType.additional_parameters.parameters[0].value[0]){
                  if (scriptType.additional_parameters.parameters[0].value[0].apiName == params.data.processID){
                    return scriptType.title;
                  }
                }              
              }
            } 
          },
        ]);

        if(showProcessDescription){
          columnDefs = columnDefs.concat(
            [
              { headerName: 'Methodik', minWidth: 300, cellRenderer: function (params) {

                  return kommonitorDataExchangeService.getIndicatorMetadataById(params.data.inputs.target_indicator_id).processDescription;
                
                },
                filter: 'agTextColumnFilter', 
                filterValueGetter: (params) => {
                  return kommonitorDataExchangeService.getIndicatorMetadataById(params.data.inputs.target_indicator_id).processDescription;
                } 
              },
            ]);
        }
        columnDefs = columnDefs.concat([
          { headerName: 'Letzte Job-Ausführung', maxWidth: 175, cellRenderer: function (params) {
              let latestJobIndex = 0;
              if (params.data.jobIDs && params.data.jobIDs[0] && params.data.jobIDs[0].length < 34){ // don't use first job if it has a short id
                latestJobIndex = 1;
              }

              if (!params.data.jobIDs || !params.data.jobIDs[latestJobIndex]) {
                return "<div id='latestJobSummary"+params.data.scheduleID+"'>Keine Jobs vorhanden</div>";
              }

              $http({
                url: __env.targetUrlToProcessesApi + "jobs/" + params.data.jobIDs[latestJobIndex],
                method: "GET"
              }).then(function successCallback(response) {
                let jobDateTime = "";
                if (response.data.job_end_datetime) {
                  jobDateTime = "<i class='fa-regular fa-calendar'></i> " + (new Date(response.data.job_end_datetime)).toLocaleString("de-DE");
                }
                let jobStatus;
                switch(response.data.status){
                  case "successful": jobStatus = "<button disabled class='btn-success btn-sm noHover'>abgeschlossen</div>"; break;
                  case "failed": jobStatus = "<button disabled class='btn-danger btn-sm noHover'>gescheitert</div>"; break;
                  case "running": jobStatus = "<button disabled class='btn-info btn-sm noHover'>laufend</div>"; break;
                  case "accepted": jobStatus = "<button disabled class='btn-warning btn-sm noHover'>wartend</div>"; break;
                  default: "Status unbekannt";
                }

                let innerHTMLContent = "" + jobDateTime 
                  + "<br>"
                  + jobStatus 
                  + "<button class='btn-sm jobTableButtonForSchedule' id='jobTableButtonForSchedule_" + params.data.scheduleID + "' style='cursor: pointer' data-toggle='modal' data-target='#modal-job-table' title='zur Berechnungs-Job-Übersicht'><i class='fas fa-table'></i></button>"
                  

                document.getElementById("latestJobSummary"+params.data.scheduleID).innerHTML = innerHTMLContent;
                  

                $http({
                  url: __env.targetUrlToProcessesApi + "jobs/" + params.data.jobIDs[latestJobIndex] + "/results",
                  method: "GET"
                }).then(function successCallback(response) {
                  for (let i = 0; i<params.data.inputs.target_spatial_units.length; i++) {
                    let html = "";
                    const spatialUnitId = params.data.inputs.target_spatial_units[i];
                    html += "<div><b>" + kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId).spatialUnitLevel + ":</b></div>";
                    if (response.data && response.data.jobSummary && response.data.jobSummary[i] && response.data.jobSummary[i].numberOfIntegratedIndicatorFeatures) {
                       html += response.data.jobSummary[i].numberOfIntegratedIndicatorFeatures + " Features integriert</br>";
                    }
                    else {
                      html += "keine Features integriert</br>";
                    }
                    document.getElementById("latestJobResult"+params.data.scheduleID).innerHTML += html;
                  }
                });
              }, function errorCallback(error) {
                document.getElementById("latestJobSummary"+params.data.scheduleID).innerHTML = "Fehler beim Laden des letzten Jobs";
                console.error("Error while fetching job result.");
                throw error;
              });

              return "<div id='latestJobSummary"+params.data.scheduleID+"'>Job wird geladen...</div><div id='latestJobResult"+params.data.scheduleID+"'></div>";
            }
          },          
          { headerName: 'Ausführungsintervall', maxWidth: 175, cellRenderer: function (params) {
               let html = cronstrue.toString(params.data.scheduleCron, {locale: "de"});
              
              html += "<br><br>Nächste geplante Ausführung:<br>";
              later.date.localTime();
              var cronSched = later.parse.cron(params.data.scheduleCron);
              html += "" + "<i class='fa-regular fa-calendar'></i> " + (new Date(later.schedule(cronSched).next(1))).toLocaleString("de-DE");
              return html;
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              let html = cronstrue.toString(params.data.scheduleCron, {locale: "de"});
              
              html += "<br><br>Nächste geplante Ausführung:<br>";
              later.date.localTime();
              var cronSched = later.parse.cron(params.data.scheduleCron);
              html += "" + "<i class='fa-regular fa-calendar'></i> " + (new Date(later.schedule(cronSched).next(1))).toLocaleString("de-DE");
              return html;
            }
          },
          { headerName: 'Zielzeitpunkte', maxWidth: 150, cellRenderer: function (params) {
              let html = "";
              if (params.data.inputs.target_time.value.mode == "ALL") {
                html += "Alle Zeitpunkte berechnen<br>";
              }
              else if (params.data.inputs.target_time.value.mode == "MISSING") {
                html += "Nur fehlende Zeitpunkte berechnen<br>";
              }
              else if (params.data.inputs.target_time.value.mode == "DATES") {
                html += "Nur ausgewählte Zeitpunkte berechnen<br>";
              }
              
              if (params.data.inputs.target_time.value.excludeDates.length) {
                html += "<br>Nicht berechnen:<br>";
                html += params.data.inputs.target_time.value.excludeDates;
              }
              
              if(params.data.inputs.target_time.value.includeDates.length) {
                html += "<br>";
                if (params.data.inputs.target_time.value.mode == "DATES") {
                  html += "Berechnen:<br>";
                }
                else {
                  html += "Zusätzlich berechnen:<br>";
                }
                html += params.data.inputs.target_time.value.includeDates;
              }
            
              return html;
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              let html = "";
              if (params.data.inputs.target_time.value.mode == "ALL") {
                html += "Alle Zeitpunkte berechnen<br>";
              }
              else if (params.data.inputs.target_time.value.mode == "MISSING") {
                html += "Nur fehlende Zeitpunkte berechnen<br>";
              }
              else if (params.data.inputs.target_time.value.mode == "DATES") {
                html += "Nur ausgewählte Zeitpunkte berechnen<br>";
              }
              
              if (params.data.inputs.target_time.value.excludeDates.length) {
                html += "<br>Nicht berechnen:<br>";
                html += params.data.inputs.target_time.value.excludeDates;
              }
              
              if(params.data.inputs.target_time.value.includeDates.length) {
                html += "<br>";
                if (params.data.inputs.target_time.value.mode == "DATES") {
                  html += "Berechnen:<br>";
                }
                else {
                  html += "Zusätzlich berechnen:<br>";
                }
                html += params.data.inputs.target_time.value.includeDates;
              }
            
              return html;
            }
          },
          { headerName: 'Ziel Raumebenen', maxWidth: 150, cellRenderer: function (params) {
            
              /*
                <table class="table table-condensed">
                      <thead>
                        <tr>
                        <th>Id</th>
                        <th>Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr ng-repeat="spatialUnitId in scriptDataset.target_spatial_units">
                        <td>{{::spatialUnitId}}</td>
                        <td>{{::$ctrl.kommonitorDataExchangeServiceInstance.getIndicatorNameFromIndicatorId(spatialUnitId)}}</td>
                        </tr>
                      </tbody>
                    </table> 
              */
             if(showScriptIds){
                if(params.data && params.data.inputs.target_spatial_units && params.data.inputs.target_spatial_units.length > 0){
                  let html = '<table class="table table-condensed table-bordered table-striped"><thead><tr><th>Id</th><th>Name</th></tr></thead><tbody>';

                  for (const spatialUnitId of params.data.inputs.target_spatial_units) {
                    html += "<tr>";
                    html += "<td>" + spatialUnitId + "</td>";
                    html += "<td>" + kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId).spatialUnitLevel + "</td>";
                    html += "</tr>";
                  }
                  
                  html += "</tbody></table>";
                  return html;  
                }
                else{
                  return "keine";
                }
             }
             else{
              // without IDs
              if(params.data && params.data.inputs.target_spatial_units && params.data.inputs.target_spatial_units.length > 0){
                  let html = '<table class="table table-condensed table-bordered table-striped"><tbody>';

                  for (const spatialUnitId of params.data.inputs.target_spatial_units) {
                    html += "<tr>";
                    html += "<td>" + kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId).spatialUnitLevel + "</td>";
                    html += "</tr>";
                  }
                  
                  html += "</tbody></table>";
                  return html;  
                }
                else{
                  return "keine";
                }
             }
              
              
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {

              if(params.data && params.data.inputs.target_spatial_units && params.data.inputs.target_spatial_units.length > 0){
                let string = JSON.stringify(params.data.inputs.target_spatial_units);

                for (const spatialUnitId of params.data.inputs.target_spatial_units) {
                  string += kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId).spatialUnitLevel;
                }                              

                return string;  
              }
              else{
                return "keine";
              }
            }  
          },
          { headerName: 'notwendige Basis-Indikatoren',  cellRenderer: function (params) {
            
              /*
                <table class="table table-condensed">
                      <thead>
                        <tr>
                        <th>Id</th>
                        <th>Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr ng-repeat="baseIndicatorId in scriptDataset.inputs.computation_ids">
                        <td>{{::baseIndicatorId}}</td>
                        <td>{{::$ctrl.kommonitorDataExchangeServiceInstance.getIndicatorNameFromIndicatorId(baseIndicatorId)}}</td>
                        </tr>
                      </tbody>
                    </table> 
              */
             if(showScriptIds){
                if(params.data && (params.data.inputs.computation_ids_with_polarity || params.data.inputs.computation_ids || params.data.inputs.computation_id || params.data.inputs.computation_id_numerator || params.data.inputs.computation_id_denominator)){
                let html = '<table class="table table-condensed table-bordered table-striped"><thead><tr><th>Id</th><th>Name</th></tr></thead><tbody>';

                if(params.data.inputs.computation_ids_with_polarity && params.data.inputs.computation_ids_with_polarity.length > 0){
                  for (const baseIndicatorWithPolarity of params.data.inputs.computation_ids_with_polarity) {
                    let baseIndicatorId = baseIndicatorWithPolarity.value.ID; 
                    html += "<tr>";
                    html += "<td>" + baseIndicatorId + "</td>";
                    html += "<td>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(baseIndicatorId) + "</td>";
                    html += "</tr>";
                  }
                }

                if(params.data.inputs.computation_ids && params.data.inputs.computation_ids.length > 0){
                  for (const baseIndicatorId of params.data.inputs.computation_ids) {
                    html += "<tr>";
                    html += "<td>" + baseIndicatorId + "</td>";
                    html += "<td>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(baseIndicatorId) + "</td>";
                    html += "</tr>";
                  }
                }
                if(params.data.inputs.computation_id){
                    html += "<tr>";
                    html += "<td>" + params.data.inputs.computation_id + "</td>";
                    html += "<td>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.inputs.computation_id) + "</td>";
                    html += "</tr>";
                }
                if(params.data.inputs.computation_id_numerator){
                    html += "<tr>";
                    html += "<td>" + params.data.inputs.computation_id_numerator + "</td>";
                    html += "<td>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.inputs.computation_id_numerator) + "</td>";
                    html += "</tr>";
                }
                if(params.data.inputs.computation_id_denominator){
                    html += "<tr>";
                    html += "<td>" + params.data.inputs.computation_id_denominator + "</td>";
                    html += "<td>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.inputs.computation_id_denominator) + "</td>";
                    html += "</tr>";
                }                
                
                html += "</tbody></table>";
                return html;  
              }
              else{
                return "keine";
              }
             }
             else{
              //without IDs
              if(params.data && (params.data.inputs.computation_ids_with_polarity || params.data.inputs.computation_ids || params.data.inputs.computation_id || params.data.inputs.computation_id_numerator || params.data.inputs.computation_id_denominator)){
                let html = '<table class="table table-condensed table-bordered table-striped"><tbody>';

                if(params.data.inputs.computation_ids_with_polarity && params.data.inputs.computation_ids_with_polarity.length > 0){
                  for (const baseIndicatorWithPolarity of params.data.inputs.computation_ids_with_polarity) {
                    let baseIndicatorId = baseIndicatorWithPolarity.value.ID; 
                    html += "<tr>";
                    html += "<td>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(baseIndicatorId) + "</td>";
                    html += "</tr>";
                  }
                }

                if(params.data.inputs.computation_ids && params.data.inputs.computation_ids.length > 0){
                  for (const baseIndicatorId of params.data.inputs.computation_ids) {
                    html += "<tr>";
                    html += "<td>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(baseIndicatorId) + "</td>";
                    html += "</tr>";
                  }
                }
                if(params.data.inputs.computation_id){
                    html += "<tr>";
                    html += "<td>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.inputs.computation_id) + "</td>";
                    html += "</tr>";
                }
                if(params.data.inputs.computation_id_numerator){
                    html += "<tr>";
                    html += "<td>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.inputs.computation_id_numerator) + "</td>";
                    html += "</tr>";
                }
                if(params.data.inputs.computation_id_denominator){
                    html += "<tr>";
                    html += "<td>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.inputs.computation_id_denominator) + "</td>";
                    html += "</tr>";
                }                
                
                html += "</tbody></table>";
                return html;  
              }
              else{
                return "keine";
              }
             }
              
              
            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {

              let string = "";
              if(params.data && params.data.inputs.computation_ids_with_polarity && params.data.inputs.computation_ids_with_polarity.length > 0){

                for (const baseIndicatorId of params.data.inputs.computation_ids_with_polarity.map(item => item.value.ID)) {
                  string += kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(baseIndicatorId);
                }                              
              }
              if(params.data && params.data.inputs.computation_ids && params.data.inputs.computation_ids.length > 0){

                for (const baseIndicatorId of params.data.inputs.computation_ids) {
                  string += kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(baseIndicatorId);
                }                              
              }
              if(params.data.inputs.computation_id){
                string += kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.inputs.computation_id)
              }
              if(params.data.inputs.computation_id_numerator){
                string += kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.inputs.computation_id_numerator)
              }
              if(params.data.inputs.computation_id_denominator){
                string += kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.inputs.computation_id_denominator)
              }              
              
              if(string == ""){
                return "keine";
              }
              else{
                return string;
              }
              
            }  
          },
          { headerName: 'notwendige Basis-Georessourcen',  cellRenderer: function (params) {

            if(showScriptIds){
              if(params.data && params.data.inputs.georesource_id ){
                let html = '<table class="table table-condensed table-bordered table-striped"><thead><tr><th>Id</th><th>Name</th></tr></thead><tbody>';

                // July 2025 processes api migration
                // currently existing scripts only require one single georesource
                // hence we only add one entry to datatable
                // we might need this snippet in the future though 
                // for (const baseGeoresourceId of params.data.inputs.georesource_id) {
                //   html += "<tr>";
                //   html += "<td>" + baseGeoresourceId + "</td>";
                //   html += "<td>" + kommonitorDataExchangeService.getGeoresourceNameFromGeoresourceId(baseGeoresourceId) + "</td>";
                //   html += "</tr>";
                // }

                html += "<tr>";
                html += "<td>" + params.data.inputs.georesource_id + "</td>";
                html += "<td>" + kommonitorDataExchangeService.getGeoresourceNameFromGeoresourceId(params.data.inputs.georesource_id) + "</td>";
                html += "</tr>";
                
                html += "</tbody></table>";
                return html;  
              }
              else{
                return "keine";
              }
            }
            else{
              // without IDs
              if(params.data && params.data.inputs.georesource_id ){
                let html = '<table class="table table-condensed table-bordered table-striped"><tbody>';

                // July 2025 processes api migration
                // currently existing scripts only require one single georesource
                // hence we only add one entry to datatable
                // we might need this snippet in the future though 
                // for (const baseGeoresourceId of params.data.inputs.georesource_id) {
                //   html += "<tr>";
                //   html += "<td>" + kommonitorDataExchangeService.getGeoresourceNameFromGeoresourceId(baseGeoresourceId) + "</td>";
                //   html += "</tr>";
                // }

                html += "<tr>";
                html += "<td>" + kommonitorDataExchangeService.getGeoresourceNameFromGeoresourceId(params.data.inputs.georesource_id) + "</td>";
                html += "</tr>";
                
                html += "</tbody></table>";
                return html;  
              }
              else{
                return "keine";
              }
            }

            },
            filter: 'agTextColumnFilter', 
            filterValueGetter: (params) => {
              if(params.data && params.data.inputs.georesource_id && params.data.inputs.georesource_id.length > 0){
                let string = JSON.stringify(params.data.inputs.georesource_id);

                for (const georesourceId of params.data.inputs.georesource_id) {
                  string += kommonitorDataExchangeService.getGeoresourceNameFromGeoresourceId(georesourceId);
                }                              

                return string;  
              }
              else{
                return "keine";
              }
            } 
          }
          
                    
        ]);

        return columnDefs;
      };

      this.buildDataGridRowData_scripts = function(dataArray, showScriptIds, showProcessDescription){
        
        return dataArray;
      };

      this.buildDataGridOptions_scripts = function(scriptsArray, showScriptIds, showProcessDescription){
          let columnDefs = this.buildDataGridColumnConfig_scripts(showScriptIds, showProcessDescription);
          let rowData = this.buildDataGridRowData_scripts(scriptsArray, showScriptIds, showProcessDescription);

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
            },
            onRowDataChanged: function () {
              self.registerClickHandler_scripts(scriptsArray);
              $timeout(function(){
                MathJax.typesetPromise().then(function (){
                });
              }, 500);
            
            },
            onModelUpdated: function () {
              self.registerClickHandler_scripts(scriptsArray);
              $timeout(function(){
                MathJax.typesetPromise().then(function (){
                });
              }, 500);
            },      
            onViewportChanged: function () {
              self.registerClickHandler_scripts(scriptsArray);  
              
              $timeout(function(){
                MathJax.typesetPromise().then(function (){
                });
              }, 500);
            },
            onStateUpdated: function () {
              self.registerClickHandler_scripts(scriptsArray);
              $timeout(function(){
                MathJax.typesetPromise().then(function (){
                }, 500); 
              });
            }
          };
  
          return gridOptions;        
      };

      this.buildDataGrid_scripts = function (scriptsArray, showScriptIds, showProcessDescription) {
        
        if (this.dataGridOptions_scripts && this.dataGridOptions_scripts.api && document.querySelector('#scriptOverviewTable').childElementCount > 0) {

          this.saveGridStore(this.dataGridOptions_scripts);
          let newRowData = this.buildDataGridRowData_scripts(scriptsArray, showScriptIds, showProcessDescription);
          this.dataGridOptions_scripts.api.setRowData(newRowData);
          let columnDefs = this.buildDataGridColumnConfig_scripts(showScriptIds, showProcessDescription);
          this.dataGridOptions_scripts.api.setGridOption("columnDefs", columnDefs);
          this.restoreGridStore(this.dataGridOptions_scripts);
        }
        else {
          this.dataGridOptions_scripts = this.buildDataGridOptions_scripts(scriptsArray, showScriptIds, showProcessDescription);
          let gridDiv = document.querySelector('#scriptOverviewTable');
          new agGrid.Grid(gridDiv, this.dataGridOptions_scripts);
        }
      };

      this.registerClickHandler_scripts = function (scriptArray) {

        // execute script on demand button click
        $(".executeScriptBtn").off();
        $(".executeScriptBtn").on("click", async function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();          
          
          // ID of button is like "executeScriptBtn_<ID>"
          let buttonID = this.id;
          let scheduleId = this.id.split("_")[1];

          // this triggers kind of watching for newest Job ID
          // cause we trigger a new job - but it might take some time to have that job available
          // and furthermore the new job has an internal prefect id for some moments before it then gets a persistant UUID used by KomMonitor
          let scriptMetadata_old = jQuery.extend(true, {}, kommonitorDataExchangeService.getProcessScriptMetadataById(scheduleId));
          $("#" + "btnExecuteScript_" + scheduleId).attr("disabled", "disabled");
          $("#" + "btnExecuteScript_" + scheduleId  + "_span").css({'display': 'none'});
          $("#" + "btnExecuteScript_" + scheduleId  + "_span").innerHTML = "Berechnung im Gange";
          kommonitorToastHelperService.displayInfoToast_lowerLeft("Manuelle Indikatorenberechnung", "Neue Berechnung manuell angestoßen. KomMonitor wartet auf Fortschritt.");
				
          kommonitorScriptHelperService.initJobWatchingForSchedule(scheduleId, scriptMetadata_old);

          let jobResponse = await kommonitorScriptHelperService.triggerJobForSchedule(scheduleId);
          //fetchScheduleDetail to get newest job and to modify job table            
					// $rootScope.$broadcast("refreshScriptOverviewTable", "edit", scheduleId);          
        });

        // TODO handle JobDetails table button click
        $(".jobTableButtonForSchedule").off();
        $(".jobTableButtonForSchedule").on("click", function (event) {
          // ensure that only the target button gets clicked
          // manually open modal
          event.stopPropagation();

          kommonitorScriptHelperService.selectedStatus = "schedule";
          
          let modalId = document.getElementById(this.id).getAttribute("data-target");
          $(modalId).modal('show');
          
          // has pattern jobTableButtonForSchedule_<scheduleId>
          let scheduleId = this.id.split("_")[1];

          $rootScope.$broadcast("onShowJobsForSchedule", scheduleId);
        });

      };

            // Processes API JOBS OVERVIEW TABLE (NEW July 2025)

            this.buildDataGridColumnConfig_processJobs = function(){
              let getErrorTypeShortDescription = function(error){
                switch(error.type) {
                  case "missingTimestamp": return "Zeitstempel fehlt";
                  case "missingDataset": return "Datensatz fehlt";
                  case "missingSpatialUnit": return "Raumeinheit fehlt";
                  case "missingSpatialUnitFeature": return "Raumeinheitsfeature fehlt";
                  case "dataManagementApiError": return "Fehler beim Aufrufen der API";
                  case "processingError": return "Fehler bei der Prozessierung";
                  default: return error.type;
                }
              };
              let getErrorTypeLongDescription = function(error){
                let datasetName = kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(error.affectedDatasetId);
                let resourceType = (error.affectedResourceType.toLowerCase() == "indicator")? "Indikator" : "Georessource";
                switch(error.type) {
                  case "missingTimestamp": {
                    let timestampList = "<ul>";
                    for (const timestamp of error.affectedTimestamps) {
                      timestampList += "<li>" + timestamp + "</li>"
                    }
                    timestampList += "</ul>";
                    return "Zeitstempel fehlen für " + resourceType + " '" + datasetName + "'." + timestampList;
                  }
                  case "missingDataset": return "" + resourceType + " '" + datasetName + "' fehlt.";
                  case "missingSpatialUnit": return "Die ausgewählte Raumeinheit fehlt für " + resourceType + " '" + datasetName + "'.";
                  case "missingSpatialUnitFeature": {
                    let featureList = "<ul>";
                    for (const feature of error.affectedSpatialUnitFeatures) {
                      featureList += "<li>" + feature + "</li>"
                    }
                    featureList += "</ul>";
                    return "Raumeinheitsfeatures fehlen für " + resourceType + " '" + datasetName + "'." + featureList;
                  } 
                  case "dataManagementApiError": return "Fehler beim Aufrufen der API für " + resourceType + " '" + datasetName + "'.";
                  case "processingError": return "Fehler beim Prozessieren von " + resourceType + " '" + datasetName + "'.";
                  default: return "Fehlerbeschreibung";
                }
              };

              const columnDefs = [
                { headerName: 'Job', pinned: 'left', maxWidth: 200, checkboxSelection: false, headerCheckboxSelection: false, minWidth: 300, headerCheckboxSelectionFilteredOnly: true, cellRenderer: function (params) {
                  for (const scriptType of kommonitorScriptHelperService.availableScriptTypeOptions) {
                      if(scriptType && scriptType.additional_parameters && scriptType.additional_parameters.parameters[0] && scriptType.additional_parameters.parameters[0].value[0]){
                        if (scriptType.additional_parameters.parameters[0].value[0].apiName == params.data.processID){
                          let html = "";
                          if (params.data.targetIndicatorId) {
                            html += "<label>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.targetIndicatorId) + "</label><br><br>";
                          }
                          html += "<i>" + scriptType.title + "</i><br><br>";
                          html += "<small>" + "Job-ID: " + params.data.jobID + "</small>";
                          return html;
                        }
                      }              
                    } 
                  
                  
                  },
                  filter: 'agTextColumnFilter', 
                  filterValueGetter: (params) => {
                    for (const scriptType of kommonitorScriptHelperService.availableScriptTypeOptions) {
                      if(scriptType && scriptType.additional_parameters && scriptType.additional_parameters.parameters[0] && scriptType.additional_parameters.parameters[0].value[0]){
                        if (scriptType.additional_parameters.parameters[0].value[0].apiName == params.data.processID){
                          let html = "";
                          if (params.data.targetIndicatorId) {
                            html += "<label>" + kommonitorDataExchangeService.getIndicatorNameFromIndicatorId(params.data.targetIndicatorId) + "</label><br><br>";
                          }
                          html += "<i>" + scriptType.title + "</i><br><br>";
                          html += "<small>" + "Job-ID: " + params.data.jobID + "</small>";
                          return html;
                        }
                      }              
                    }
                  } 
                },
                //{ headerName: 'Job-Id', field: "jobID", pinned: 'left', maxWidth: 125, checkboxSelection: false, headerCheckboxSelection: false, 
                //headerCheckboxSelectionFilteredOnly: true},
                { headerName: 'Ausführung', maxWidth: 165, cellRenderer: function (params){
                    let html = "<i class='fa-regular fa-calendar'></i> " + (new Date(params.data.job_end_datetime)).toLocaleString("de-DE");

                    let jobStatus;
                    switch(params.data.status){
                      case "successful": jobStatus = "<button disabled class='btn-success btn-sm noHover'>abgeschlossen</div>"; break;
                      case "failed": jobStatus = "<button disabled class='btn-danger btn-sm noHover'>gescheitert</div>"; break;
                      case "running": jobStatus = "<button disabled class='btn-info btn-sm noHover'>laufend</div>"; break;
                      case "accepted": jobStatus = "<button disabled class='btn-warning btn-sm noHover'>wartend</div>"; break;
                      default: "Status unbekannt";
                    }

                    html += "<br>";
                    html += jobStatus;
                    return html;
                  },
                  filter: 'agTextColumnFilter', 
                  filterValueGetter: (params) => {
                    let html = "<i class='fa-regular fa-calendar'></i> " + (new Date(params.data.job_end_datetime)).toLocaleString("de-DE");

                    let jobStatus;
                    switch(params.data.status){
                      case "successful": jobStatus = "<button disabled class='btn-success btn-sm noHover'>abgeschlossen</div>"; break;
                      case "failed": jobStatus = "<button disabled class='btn-danger btn-sm noHover'>gescheitert</div>"; break;
                      case "running": jobStatus = "<button disabled class='btn-info btn-sm noHover'>laufend</div>"; break;
                      case "accepted": jobStatus = "<button disabled class='btn-warning btn-sm noHover'>wartend</div>"; break;
                      default: "Status unbekannt";
                    }

                    html += "<br>";
                    html += jobStatus;
                    return html;
                  }
                },
                //{ headerName: 'Job-Status', field: "status", maxWidth: 125 },
                //{ headerName: 'Job-Fortschritt', field: "progress", maxWidth: 125 },
                /*{ headerName: 'Job-Zusammenfassungen pro Raumeinheit', minWidth: 500, cellRenderer: function (params) {
                  console.log(params);
                  return kommonitorDataExchangeService.syntaxHighlightJSON(params.data.jobSummary);
                }, },*/
                { headerName: 'Job-Zusammenfassungen nach Raumeinheit', minWidth: 1000, cellRenderer: function (params) {
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
                          //console.log('job-data:');
                          //console.log(params.data);
                          if(params.data && params.data.jobSummary && params.data.jobSummary.length > 0){
                            let html = '<table class="table table-condensed table-bordered table-striped"><thead><tr><th>Raumeinheit</th><th>Anzahl integrierter Indikator-Features</th><th>Integrierte Zielzeitpunkte</th><th>Fehler</th></tr></thead><tbody>';
            
                            for (const job of params.data.jobSummary) {
                              html += "<tr>";
                              //html += "<td>" + job.spatialUnitId + "</td>";
                              html += "<td>" + kommonitorDataExchangeService.getSpatialUnitMetadataById(job.spatialUnitId).spatialUnitLevel + "</td>";
                              //html += "<td>" + job.modifiedResource + "</td>";
                              if (!job.numberOfIntegratedIndicatorFeatures) {
                                html += "<td>keine</td>";
                              }
                              else {
                              html += "<td>" + job.numberOfIntegratedIndicatorFeatures + "</td>";
                              }
                              //html += "<td>" + job.integratedTargetDates + "</td>";
                              
                              if (!job.integratedTargetDates || !job.integratedTargetDates.length) {
                                html += "<td>keine</td>";
                              }
                              else {
                                job.integratedTargetDates.sort();
                                html += '<td><ul style="columns: 5; 	-webkit-columns: 5;	-moz-columns: 5; word-break: break-word !important;">';
                                for (const timestamp of job.integratedTargetDates) {
                                  html += '<li style="margin-right: 15px;">';
                                  html += timestamp;
                                  html += '</li>';
                                }
                                html += '</ul></td>';
                              }
                              
                              if (!job.errorsOccurred || !job.errorsOccurred.length) {
                                html += "<td>keine</td>";
                              }
                              else {
                              html += "<td>";
                              for (const error of job.errorsOccurred) {
                                html += '<div class="box box-danger collapsed-box" style="width:200px;"><div class="box-header"><span class="box-title" style="font-size:12px">';
                                //html += error.type;
                                html += getErrorTypeShortDescription(error);
                                html += '</span><div class="box-tools pull-right"><button type="button" class="btn btn-box-tool jobError" data-widget="collapse" onclick="handleChildCollapse(event)"><i class="fa fa-plus"></i></button></div></div><div class="box-body">';
                                html += getErrorTypeLongDescription(error);
                                //html += "</br></br>"
                                //html += kommonitorDataExchangeService.syntaxHighlightJSON(error);
                                html += '</div></div>'
                              }
                              html += "</td>";
                              }
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
                      if(params.data && params.data.jobSummary && params.data.jobSummary.length > 0){
                        return JSON.stringify(params.data.jobSummary);
                      }
                      else{
                        return "keine";
                      }
                    } 
                }
                                
              ];
      
              return columnDefs;
            };
      
            this.buildDataGridRowData_processJobs = function(dataArray){
              
              dataArray.sort((a, b) => b.job_start_datetime - a.job_start_datetime);

              for (const job of dataArray) {
                // enrich job data with processID from schedule
                let processScript = kommonitorScriptHelperService.jobDescriptionAndScheduleMap.get(job.jobID);
                if (processScript && processScript.inputs && processScript.inputs.target_indicator_id) {
                  let targetIndicatorId = processScript.inputs.target_indicator_id;
                  job.targetIndicatorId = targetIndicatorId;
                }
              }

              return dataArray;
            };
      
            this.buildDataGridOptions_processJobs = function(jobsArray){

                let columnDefs = this.buildDataGridColumnConfig_processJobs();
                let rowData = this.buildDataGridRowData_processJobs(jobsArray);
        
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
                  rowHeight: 10,
                  rowData: rowData,
                  suppressRowClickSelection: true,
                  enableCellTextSelection: false,
                  ensureDomOrder: true,
                  pagination: true,
                  paginationPageSize: 10,
                  suppressColumnVirtualisation: true,          
                  onFirstDataRendered: function () {
                    headerHeightSetter(self.dataGridOptions_processJobs);
                  },
                  onColumnResized: function () {
                    headerHeightSetter(self.dataGridOptions_processJobs);                    
                  },
                  onViewportChanged: function () {   
                    self.registerClickHandler_jobOverviewErrorBoxes();    
                  },
        
                };
        
                return gridOptions;        
            };

            this.registerClickHandler_jobOverviewErrorBoxes = function () {
              // jobExecutionTable_processJobs 
              $(".jobError").off();
              $(".jobError").on("click", function (event) {
                event.stopPropagation(); // Verhindert das Standardverhalten, aber propagiert das Event nicht weiter
              const button = event.currentTarget;
              const box = button.closest('.box');
              $(box).boxWidget('toggle'); // Manuelles Triggern von AdminLTE's CardWidget
              }); 

            }


      
            this.buildDataGrid_processJobs = function (jobsArray) {
              
              if (this.dataGridOptions_processJobs && this.dataGridOptions_processJobs.api && document.querySelector('#jobExecutionTable_processJobs').childElementCount > 0) {
                this.saveGridStore(this.dataGridOptions_processJobs);
                let newRowData = this.buildDataGridRowData_processJobs(jobsArray);
                this.dataGridOptions_processJobs.api.setRowData(newRowData);
                this.restoreGridStore(this.dataGridOptions_processJobs);
              }
              else {
                this.dataGridOptions_processJobs = this.buildDataGridOptions_processJobs(jobsArray);
                let gridDiv = document.querySelector('#jobExecutionTable_processJobs');
                new agGrid.Grid(gridDiv, this.dataGridOptions_processJobs);
              }

              // remove loading spinner icon from job table modal
              document.getElementById("loading-overlay-job-table").style.display = "none";
            };

      function anyHigherPermissionIsChecked(permissions, permissionSuffix){
        let filteresPermissions = [];
        
        if(permissionSuffix == "viewer"){
          filteresPermissions = permissions.filter(function(permission){
            if (permission.isChecked && (permission.permissionLevel == "editor" || permission.permissionLevel == "creator")){
              return true;
            }
          });
        }
        else if (permissionSuffix == "editor"){
          filteresPermissions = permissions.filter(function(permission){
            if (permission.isChecked && permission.permissionLevel == "creator"){
              return true;
            }
          });
        }
        
        return filteresPermissions.length > 0;
      };

      function anyHigherAdvancedPermissionIsCheckedOnAdvancedTable(permissions, permissionType){
        let filteresPermissions = [];
        
          filteresPermissions = permissions.filter(function(permission){
            if (permission.isChecked && permission.permissionLevel == permissionType){
              return true;
            }
          });
        
        return filteresPermissions.length > 0;
      };

      function anyHigherAdvancedPermissionIsChecked(permissions, permissionType){
        let filteresPermissions = [];
        
          filteresPermissions = permissions.filter(function(permission){
            if (permission.isChecked && permission.permissionType == permissionType){
              return true;
            }
          });
        
        return filteresPermissions.length > 0;
      };

      function CheckboxRenderer_viewer() {}

      CheckboxRenderer_viewer.prototype.init = function(params) {
        this.params = params;
        
        let isChecked = false;
        let exists = false;
        let className;
        if (params && params.data) {
          for (const permission of params.data.permissions) {
            if (permission.permissionLevel == "viewer"){
              exists = true;
              isChecked = permission.isChecked;
              className = permission.permissionId;
              break;
            }
          }  
        }
        
        if(exists){
          this.eGui = document.createElement('input');
          this.eGui.className = className;
          this.eGui.type = 'checkbox';
          this.eGui.checked = isChecked;
          
          if(this.params.data.datasetOwner===true)
            this.eGui.disabled = true;
          else
            this.eGui.disabled = false;

          this.checkedHandler = this.checkedHandler.bind(this);
          this.eGui.addEventListener('click', this.checkedHandler);
          // if higher role rights are checked as well 
          if(isChecked && anyHigherPermissionIsChecked(params.data.permissions, "viewer")){
            this.eGui.disabled = true;
          }                    
        }
      };

      CheckboxRenderer_viewer.prototype.checkedHandler = function(e) {
        let checked = e.target.checked;

        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == "viewer"){            
            permission.isChecked = checked;
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
        if (params && params.data) {
          for (const permission of params.data.permissions) {
            if (permission.permissionLevel == "editor"){
              exists = true;
              isChecked = permission.isChecked;
              className = permission.permissionId;
              break;
            }
          }  
        }

        if(exists){
          this.eGui = document.createElement('input');
          this.eGui.className = className;
          this.eGui.type = 'checkbox';
          this.eGui.checked = isChecked;

          if(this.params.data.datasetOwner===true)
            this.eGui.disabled = true;
          else
            this.eGui.disabled = false;

          this.checkedHandler = this.checkedHandler.bind(this);
          this.eGui.addEventListener('click', this.checkedHandler);
          // if higher role rights are checked as well 
          if(isChecked && anyHigherPermissionIsChecked(params.data.permissions, "editor")){
            this.eGui.disabled = true;
          } 
        }
      };

      CheckboxRenderer_editor.prototype.checkedHandler = function(e) {
        let checked = e.target.checked;
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == "viewer"){    
            if (checked){
              permission.isChecked = true;
              $('.' + permission.permissionId).attr('disabled', true);
              $('.' + permission.permissionId).prop("checked", true);
            }                    
            else{
              $('.' + permission.permissionId).attr('disabled', false);
            }
          }
          else if (permission.permissionLevel == "editor"){            
            permission.isChecked = checked;
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
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel == "creator"){
            exists = true;
            isChecked = permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }  

        if(exists){
          this.eGui = document.createElement('input');
          this.eGui.className = className;
          this.eGui.type = 'checkbox';
          this.eGui.checked = isChecked;

          if(this.params.data.datasetOwner===true)
            this.eGui.disabled = true;
          else
            this.eGui.disabled = false;

          this.checkedHandler = this.checkedHandler.bind(this);
          this.eGui.addEventListener('click', this.checkedHandler);
        }
      };

      CheckboxRenderer_creator.prototype.checkedHandler = function(e) {
        let checked = e.target.checked;
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == "publisher"){            
            if(!checked)
              permission.isChecked = false;
          }
          else if (permission.permissionLevel == "editor"){            
            if (checked){
              permission.isChecked = true;
              $('.' + permission.permissionId).attr('disabled', true);
              $('.' + permission.permissionId).prop("checked", true);
            }                    
            else{
              $('.' + permission.permissionId).attr('disabled', false);
            }
          }
          else if (permission.permissionLevel == "viewer"){            
            if (checked){
              permission.isChecked = true;
              $('.' + permission.permissionId).attr('disabled', true);
              $('.' + permission.permissionId).prop("checked", true);
            }                    
            else{
              $('.' + permission.permissionId).attr('disabled', true);
            }
          }
          else if (permission.permissionLevel == "creator" || permission.permissionLevel == "editor" || permission.permissionLevel == "viewer"){            
            permission.isChecked = checked;
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

      // renderer for advanced table
      function CheckboxRenderer_UM_group() {}

      CheckboxRenderer_UM_group.prototype.init = function(params) {
        this.params = params;
        let isChecked = false;
        let exists = false;
        let className;
        if(params.data) {
            for (const permission of params.data.permissions) {
            if (permission.permissionLevel == "unit-users-creator"){
                exists = true;
                isChecked = permission.isChecked;
                className = permission.permissionId;
                break;
            }
            }  
        }

        if(exists){
          this.eGui = document.createElement('input');
          this.eGui.className = className;
          this.eGui.type = 'checkbox';
          this.eGui.checked = isChecked;

          this.eGui.disabled = params.data.disabled;

          this.checkedHandler = this.checkedHandler.bind(this);
          this.eGui.addEventListener('click', this.checkedHandler);
          // if higher role rights are checked as well hier
          if(isChecked && anyHigherAdvancedPermissionIsCheckedOnAdvancedTable(params.data.permissions, "client-users-creator")){
            this.eGui.disabled = true;
          }                    
        }
      };

      CheckboxRenderer_UM_group.prototype.checkedHandler = function(e) {
        let checked = e.target.checked;

        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == "unit-users-creator"){            
            permission.isChecked = checked;
            break;
          }
        }  
      };

      CheckboxRenderer_UM_group.prototype.getGui = function(params) {
        return this.eGui;
      };

      CheckboxRenderer_UM_group.prototype.destroy = function(params) {
        if(this.eGui){
          this.eGui.removeEventListener('click', this.checkedHandler);
        }        
      };

      
      function CheckboxRenderer_UM_subGroup() {}

      CheckboxRenderer_UM_subGroup.prototype.init = function(params) {
        this.params = params;
        
        let isChecked = false;
        let exists = false;
        let className;
        if(params.data) {
            for (const permission of params.data.permissions) {
            if (permission.permissionLevel == "client-users-creator"){
                exists = true;
                isChecked = permission.isChecked;
                className = permission.permissionId;
                break;
            }
            }
        }  

        if(exists){
          this.eGui = document.createElement('input');
          this.eGui.className = className;
          this.eGui.type = 'checkbox';
          this.eGui.checked = isChecked;
          
          this.eGui.disabled = params.data.disabled;

          this.checkedHandler = this.checkedHandler.bind(this);
          this.eGui.addEventListener('click', this.checkedHandler);
        }
      };

      CheckboxRenderer_UM_subGroup.prototype.checkedHandler = function(e) {
        let checked = e.target.checked;
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == "unit-users-creator"){
            if (checked){
              permission.isChecked = true;
              $('.' + permission.permissionId).attr('disabled', true);
              $('.' + permission.permissionId).prop("checked", true);
            }                    
            else{
              $('.' + permission.permissionId).attr('disabled', false);
            }
          }
          else if (permission.permissionLevel == "client-users-creator"){   
            permission.isChecked = checked;
          }
        }  
      };

      CheckboxRenderer_UM_subGroup.prototype.getGui = function(params) {
        return this.eGui;
      };

      CheckboxRenderer_UM_subGroup.prototype.destroy = function(params) {
        if(this.eGui){
          this.eGui.removeEventListener('click', this.checkedHandler);
        }        
      };

      
      function CheckboxRenderer_RM_group() {}

      CheckboxRenderer_RM_group.prototype.init = function(params) {
        this.params = params;
        
        let isChecked = false;
        let exists = false;
        let className;
        
        if(params.data) {
            for (const permission of params.data.permissions) {
            if (permission.permissionLevel == "unit-resources-creator"){
                exists = true;
                isChecked = permission.isChecked;
                className = permission.permissionId;
                break;
            }
            } 
        }

        if(exists){
          this.eGui = document.createElement('input');
          this.eGui.className = className;
          this.eGui.type = 'checkbox';
          this.eGui.checked = isChecked;
          
          this.eGui.disabled = params.data.disabled;

          this.checkedHandler = this.checkedHandler.bind(this);
          this.eGui.addEventListener('click', this.checkedHandler);
          // if higher role rights are checked as well 
          if(isChecked && anyHigherAdvancedPermissionIsCheckedOnAdvancedTable(params.data.permissions, "client-resources-creator")){
            this.eGui.disabled = true;
          }                    
        }
      };

      CheckboxRenderer_RM_group.prototype.checkedHandler = function(e) {
        let checked = e.target.checked;

        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == "unit-resources-creator"){            
            permission.isChecked = checked;
            break;
          }
        }  
      };

      CheckboxRenderer_RM_group.prototype.getGui = function(params) {
        return this.eGui;
      };

      CheckboxRenderer_RM_group.prototype.destroy = function(params) {
        if(this.eGui){
          this.eGui.removeEventListener('click', this.checkedHandler);
        }        
      };

      
      function CheckboxRenderer_RM_subGroup() {}

      CheckboxRenderer_RM_subGroup.prototype.init = function(params) {
        this.params = params;
        
        let isChecked = false;
        let exists = false;
        let className;
        
        if(params.data) {
            for (const permission of params.data.permissions) {
            if (permission.permissionLevel == "client-resources-creator"){
                exists = true;
                isChecked = permission.isChecked;
                className = permission.permissionId;
                break;
            }
            }  
        }

        if(exists){
          this.eGui = document.createElement('input');
          this.eGui.className = className;
          this.eGui.type = 'checkbox';
          this.eGui.checked = isChecked;
          
          this.eGui.disabled = params.data.disabled;

          this.checkedHandler = this.checkedHandler.bind(this);
          this.eGui.addEventListener('click', this.checkedHandler);
        }
      };

      CheckboxRenderer_RM_subGroup.prototype.checkedHandler = function(e) {
        let checked = e.target.checked;
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == "unit-resources-creator"){
            if (checked){
              permission.isChecked = true;
              $('.' + permission.permissionId).attr('disabled', true);
              $('.' + permission.permissionId).prop("checked", true);
            }                    
            else{
              $('.' + permission.permissionId).attr('disabled', false);
            }
          }
          else if (permission.permissionLevel == "client-resources-creator"){   
            permission.isChecked = checked;
          }
        }  
      };

      CheckboxRenderer_RM_subGroup.prototype.getGui = function(params) {
        return this.eGui;
      };

      CheckboxRenderer_RM_subGroup.prototype.destroy = function(params) {
        if(this.eGui){
          this.eGui.removeEventListener('click', this.checkedHandler);
        }        
      };

      

      
      function CheckboxRenderer_TM_group() {}

      CheckboxRenderer_TM_group.prototype.init = function(params) {
        this.params = params;
        
        let isChecked = false;
        let exists = false;
        let className;
        
        if(params.data) {
            for (const permission of params.data.permissions) {
            if (permission.permissionLevel == "unit-themes-creator"){
                exists = true;
                isChecked = permission.isChecked;
                className = permission.permissionId;
                break;
            }
            }  
        }

        if(exists){
          this.eGui = document.createElement('input');
          this.eGui.className = className;
          this.eGui.type = 'checkbox';
          this.eGui.checked = isChecked;
          
          this.eGui.disabled = params.data.disabled;

          this.checkedHandler = this.checkedHandler.bind(this);
          this.eGui.addEventListener('click', this.checkedHandler);
          // if higher role rights are checked as well 
          if(isChecked && anyHigherAdvancedPermissionIsCheckedOnAdvancedTable(params.data.permissions, "client-themes-creator")){
            this.eGui.disabled = true;
          }                    
        }
      };

      CheckboxRenderer_TM_group.prototype.checkedHandler = function(e) {
        let checked = e.target.checked;

        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == "unit-themes-creator"){            
            permission.isChecked = checked;
            break;
          }
        }  
      };

      CheckboxRenderer_TM_group.prototype.getGui = function(params) {
        return this.eGui;
      };

      CheckboxRenderer_TM_group.prototype.destroy = function(params) {
        if(this.eGui){
          this.eGui.removeEventListener('click', this.checkedHandler);
        }        
      };

      
      function CheckboxRenderer_TM_subGroup() {}

      CheckboxRenderer_TM_subGroup.prototype.init = function(params) {
        this.params = params;
        
        let isChecked = false;
        let exists = false;
        let className;
        
        if(params.data) {
            for (const permission of params.data.permissions) {
            if (permission.permissionLevel == "client-themes-creator"){
                exists = true;
                isChecked = permission.isChecked;
                className = permission.permissionId;
                break;
            }
            }  
        }

        if(exists){
          this.eGui = document.createElement('input');
          this.eGui.className = className;
          this.eGui.type = 'checkbox';
          this.eGui.checked = isChecked;
          
          this.eGui.disabled = params.data.disabled;

          this.checkedHandler = this.checkedHandler.bind(this);
          this.eGui.addEventListener('click', this.checkedHandler);
        }
      };

      CheckboxRenderer_TM_subGroup.prototype.checkedHandler = function(e) {
        let checked = e.target.checked;
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == "unit-themes-creator"){
            if (checked){
              permission.isChecked = true;
              $('.' + permission.permissionId).attr('disabled', true);
              $('.' + permission.permissionId).prop("checked", true);
            }                    
            else{
              $('.' + permission.permissionId).attr('disabled', false);
            }
          }
          else if (permission.permissionLevel == "client-themes-creator"){   
            permission.isChecked = checked;
          }
        }  
      };

      CheckboxRenderer_TM_subGroup.prototype.getGui = function(params) {
        return this.eGui;
      };

      CheckboxRenderer_TM_subGroup.prototype.destroy = function(params) {
        if(this.eGui){
          this.eGui.removeEventListener('click', this.checkedHandler);
        }        
      };
      // end

      function CheckboxRenderer_checked() {}

      CheckboxRenderer_checked.prototype.init = function(params) {

        this.params = params;

        this.eGui = document.createElement('input');
        this.eGui.type = 'checkbox';

        if(this.params.data && this.params.data.checked)
          this.eGui.checked = this.params.data.checked;
        else
          this.eGui.checked = false;

        this.checkedHandler = this.checkedHandler.bind(this);
        this.eGui.addEventListener('click', this.checkedHandler);
      };

      CheckboxRenderer_checked.prototype.checkedHandler = function(e) {
        this.params.data.checked = e.target.checked;
      };

      CheckboxRenderer_checked.prototype.getGui = function(params) {
        return this.eGui;
      };

      CheckboxRenderer_checked.prototype.destroy = function(params) {
        if(this.eGui){
          this.eGui.removeEventListener('click', this.checkedHandler);
        }  
      };

      this.buildRoleManagementGridRowData = function(accessControlMetadata, permissionIds){
        let data = JSON.parse(JSON.stringify(accessControlMetadata));
        for (let elem of data) {

          if(elem.name=='public')
            elem.name = 'Öffentlicher Zugriff';

          for (let permission of elem.permissions) {
            permission.isChecked = false;
            if (permissionIds && permissionIds.includes(permission.permissionId)){
              permission.isChecked = true;
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
        columnDefs = columnDefs.concat([
          { 
            headerName: 'Organisationseinheit', 
            field: "name", 
            minWidth: 200,
            cellClass: 'user-roles-normal'
          },
          { headerName: 'lesen', field: "permissions", filter: false, sortable: false, maxWidth: 100, cellRenderer: 'checkboxRenderer_viewer'},
          { headerName: 'editieren', field: "permissions", filter: false, sortable: false, maxWidth: 100, cellRenderer: 'checkboxRenderer_editor'}                   
        ]);

        if (!this.reducedRoleManagement){
          columnDefs = columnDefs.concat({ headerName: 'löschen', field: "permissions", filter: false, sortable: false, maxWidth: 100, cellRenderer: 'checkboxRenderer_creator'})
        } 

        return columnDefs;
      };

      this.buildRoleManagementGridOptions = function(accessControlMetadata, selectedPermissionIds){
        let columnDefs = this.buildRoleManagementGridColumnConfig();
        let rowData = this.buildRoleManagementGridRowData(accessControlMetadata, selectedPermissionIds);
  
          let components = {};
          if(this.reducedRoleManagement)
            components = {
              checkboxRenderer_viewer: CheckboxRenderer_viewer,
              checkboxRenderer_editor: CheckboxRenderer_editor
            };
          else
            components = {
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

      this.buildRoleManagementGrid = function(tableDOMId, currentTableOptionsObject, accessControlMetadata, selectedPermissionIds, reducedRoleManagement = false){
        
        this.reducedRoleManagement = reducedRoleManagement;
        
        if (currentTableOptionsObject && currentTableOptionsObject.api) {

          let newRowData = this.buildRoleManagementGridRowData(accessControlMetadata, selectedPermissionIds);
          currentTableOptionsObject.api.setRowData(newRowData);
        }
        else {
          currentTableOptionsObject = this.buildRoleManagementGridOptions(accessControlMetadata, selectedPermissionIds);
          let gridDiv = document.querySelector('#' + tableDOMId);
          new agGrid.Grid(gridDiv, currentTableOptionsObject);
        }
        return currentTableOptionsObject;
      };
      // end

      // "Advanced" Role Management Grid 
      this.buildAdvancedRoleManagementGridRowData = function(accessControlMetadata, permissionIds, disabled){
        let data = JSON.parse(JSON.stringify(accessControlMetadata));
        for (let elem of data) {
            
          for (let permission of elem.permissions) {
            permission.isChecked = false;
            if (permissionIds && permissionIds.includes(permission.permissionId)){
              permission.isChecked = true;
            }

          }

          elem.disabled = disabled;
        }

        let array = [];
        
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

      this.buildAdvancedRoleManagementGridColumnConfig = function(){
        let columnDefs = [];
        columnDefs = columnDefs.concat([
          { 
            headerName: 'Organisationseinheit', 
            field: "name", 
            minWidth: 200,
            cellClassRules: {
              'user-roles-normal': row => row != undefined
            } 
          },
          { 
            headerName: 'Verwalten von Nutzern', 
            children: [
                { 
                    field: 'Dieser Gruppe',
                    cellRenderer: 'checkboxRenderer_UM_group'
                 },
                { 
                    field: 'Untergruppen',
                    cellRenderer: 'checkboxRenderer_UM_subGroup' 
                }
            ],
            field: "permissions", 
            filter: false, 
            sortable: false, 
            maxWidth: 100
          },
          { 
            headerName: 'Verwalten von Resourcen', 
            children: [
                { 
                    field: 'Dieser Gruppe',
                    cellRenderer: 'checkboxRenderer_RM_group'
                },
                { 
                    field: 'Untergruppen',
                    cellRenderer: 'checkboxRenderer_RM_subGroup'
                }
            ],
            field: "permissions", 
            filter: false, 
            sortable: false, 
            maxWidth: 100
          },
          { 
            headerName: 'Verwalten von Themen', 
            children: [
                { 
                    field: 'Dieser Gruppe',
                    cellRenderer: 'checkboxRenderer_TM_group'
                },
                { 
                    field: 'Untergruppen',
                    cellRenderer: 'checkboxRenderer_TM_subGroup'
                }
            ],
            field: "permissions", 
            filter: false, 
            sortable: false, 
            maxWidth: 100
          }        
        ]);

        return columnDefs;
      };

      this.buildAdvancedRoleManagementGridOptions = function(accessControlMetadata, selectedPermissionIds, disabled){
        let columnDefs = this.buildAdvancedRoleManagementGridColumnConfig();
          let rowData = this.buildAdvancedRoleManagementGridRowData(accessControlMetadata, selectedPermissionIds, disabled);
  
          let components = {};
          components = {
              checkboxRenderer_UM_group: CheckboxRenderer_UM_group,
              checkboxRenderer_UM_subGroup: CheckboxRenderer_UM_subGroup,
              checkboxRenderer_RM_group: CheckboxRenderer_RM_group,
              checkboxRenderer_RM_subGroup: CheckboxRenderer_RM_subGroup,
              checkboxRenderer_TM_group: CheckboxRenderer_TM_group,
              checkboxRenderer_TM_subGroup: CheckboxRenderer_TM_subGroup
          };

          let gridOptions = {
            defaultColDef: {
              editable: false,
              sortable: true,
              flex: 1,
              minWidth: 100,
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

      this.buildAdvancedRoleManagementGrid = function(tableDOMId, currentTableOptionsObject, accessControlMetadata, selectedPermissionIds, disabled = false){

        if (currentTableOptionsObject && currentTableOptionsObject.api) {

          let newRowData = this.buildAdvancedRoleManagementGridRowData(accessControlMetadata, selectedPermissionIds, disabled);
          currentTableOptionsObject.api.setRowData(newRowData);
        }
        else {
          currentTableOptionsObject = this.buildAdvancedRoleManagementGridOptions(accessControlMetadata, selectedPermissionIds, disabled);
          let gridDiv = document.querySelector('#' + tableDOMId);
          new agGrid.Grid(gridDiv, currentTableOptionsObject);
        }
        return currentTableOptionsObject;
      };
      // end

      this.getSelectedRoleIds_roleManagementGrid = function(roleManagementTableOptions){
        let ids = [];
        let deselectedIds = [];
        if (roleManagementTableOptions && roleManagementTableOptions.api){

          roleManagementTableOptions.api.forEachNode(function(node, index){
            
            if(node.data) {
                for (const permission of node.data.permissions) {
                    
                    if(permission) {
                        if(permission.isChecked){
                            if(!deselectedIds.includes(permission.permissionId))
                                ids.push(permission.permissionId);
                        } else {
                            deselectedIds.push(permission.permissionId);
                        }
                    }
                }
            }
          })               
        }
        return ids;
      };

      // SINGLE-SELECT TABLE

      this.buildSingleSelectGridRowData = function(accessControlMetadata, selectedIds){
        let data = JSON.parse(JSON.stringify(accessControlMetadata));
       /*  for (let elem of data) {
          if(selectedIds.includes(elem.id))
              elem.isChecked = true;
        }
 */
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

      this.buildSingleSelectGridColumnConfig = function(){
        let columnDefs = [];

        return columnDefs.concat([
          { headerName: 'Name', field: "name", minWidth: 200 },
          { headerName: 'ID', field: "id", minWidth: 150 },
          { headerName: 'Beschreibung', field: "description", minWidth: 300 },
          { headerName: 'sichtbar', field: "checked", filter: false, sortable: false, maxWidth: 100, cellRenderer: 'checkboxRenderer_checked', }
        ]);
      };

      this.buildSingleSelectGridOptions = function(accessControlMetadata, selectedIds){
        let columnDefs = this.buildSingleSelectGridColumnConfig();
          let rowData = this.buildSingleSelectGridRowData(accessControlMetadata, selectedIds);
  
          let components = {
            checkboxRenderer_checked: CheckboxRenderer_checked,
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

      this.buildSingleSelectGrid = function(tableDOMId, currentTableOptionsObject, accessControlMetadata, selectedIds){

        if (currentTableOptionsObject && currentTableOptionsObject.api) {

          let newRowData = this.buildSingleSelectGridRowData(accessControlMetadata, selectedIds);
          currentTableOptionsObject.api.setRowData(newRowData);
        }
        else {
          currentTableOptionsObject = this.buildSingleSelectGridOptions(accessControlMetadata, selectedIds);
          let gridDiv = document.querySelector('#' + tableDOMId);
          new agGrid.Grid(gridDiv, currentTableOptionsObject);
        }
        return currentTableOptionsObject;
      };

      this.getSelectedIds_singleSelectGrid = function(roleManagementTableOptions){
        let ids = [];
        if (roleManagementTableOptions && roleManagementTableOptions.api){

          roleManagementTableOptions.api.forEachNode(function(node, index){
            if(node.data && node.data.checked) {
                ids.push(node.data.id);
            } 
          })               
        }
        return ids;
      };

      // END

      // INDICATOR REFERENCE VALUES

      this.buildDataGridColumnConfig_regionalReferenceValues = function(applicableDates, regionalReferenceValuesList){
        const columnDefs = [
          { headerName: 'Zeitpunkt', field: "referenceDate", pinned: 'left', cellDataType: 'text', editable: false, cellClass: "grid-non-editable", maxWidth: 150
          },
          { headerName: 'regionale Gesamtsumme', field: "regionalSum", cellDataType: 'number', 
            cellEditor: 'agNumberCellEditor', cellEditorParams: {
              precision: 2,
              step: 0.01,
              showStepperButtons: true
            }, 
            tooltipValueGetter: (p) =>
              "mit Enter bestätigen", maxWidth: 175 },
          { headerName: 'regionaler Mittelwert', field: "regionalAverage", cellDataType: 'number', cellEditor: 'agNumberCellEditor', cellEditorParams: {
            precision: 2,
            step: 0.01,
            showStepperButtons: true
          }, tooltipValueGetter: (p) =>
            "mit Enter bestätigen",
          maxWidth: 175 },
          { headerName: 'räumlich nicht zuordenbar', field: "spatiallyUnassignable", cellDataType: 'number', cellEditor: 'agNumberCellEditor', cellEditorParams: {
            precision: 2,
            step: 0.01,
            showStepperButtons: true
          }, tooltipValueGetter: (p) =>
            "mit Enter bestätigen", maxWidth: 175 }, 
          
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
                  "regionalAverage": 144,
                  "spatiallyUnassignable": 0
              },
              {
                  "referenceDate": "2022-12-31",
                  "regionalSum": 3500,
                  "regionalAverage": 148,
                  "spatiallyUnassignable", 0
              }
            ]
        */

          let dataArray = [];

        if(applicableDates && applicableDates.length > 0){

          for (const availableDate of applicableDates) {
            let item = {
              "referenceDate": availableDate,
              "regionalSum": undefined,
              "regionalAverage": undefined,
              "spatiallyUnassignable": undefined
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

          return dataGridOptions_regionalReferenceValues;
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
                    "spatiallyUnassignable": 0
                },
                {
                    "referenceDate": "2022-12-31",
                    "regionalSum": 3500,
                    "regionalAverage": 148,
                    "spatiallyUnassignable": 0
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
