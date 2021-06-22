angular.module('kommonitorBatchUpdateHelper', ['kommonitorDataExchange', 'kommonitorImporterHelper']);

angular
    .module('kommonitorBatchUpdateHelper', [])
    .service(
        'kommonitorBatchUpdateHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', 'kommonitorImporterHelperService', '__env',
            function ($rootScope, $timeout, kommonitorDataExchangeService, kommonitorImporterHelperService, __env) {

                let thisService = this; // to enable access to service methods from inside other functions (e. g. $timeout) where 'this' references something else
                let timeseriesMappingReference;

                this.batchUpdate = async function (resourceType, batchList) {

                    let startBtn = document.getElementById(resourceType + "-batch-update-btn");
                    startBtn.innerHTML = "Update wird ausgef&uuml;hrt...";
                    startBtn.setAttribute("disabled", "disabled");
                    

                    // clear result modal
                    document.getElementById("batch-update-result-table-tbody").innerHTML = "";

                    // create array to store response messages
                    var responses = [];

                    // deep copy batch list
                    var batchListCopy = [];
                    for(let i=0; i<batchList.length; i++) {
                        batchListCopy.push( $.extend(true, {}, batchList[i]));
                    }

                    try {
                        for (let i=0; i<batchListCopy.length; i++) {
                            let row = batchListCopy[i];
    
                            let resourceId;
                            if (resourceType === "georesource")
                                resourceId = row.name.georesourceId;
                            if (resourceType === "indicator")
                                resourceId = row.name.indicatorId;
    
                            // converter properties to parameter array
                            row.mappingObj.converter = this.converterPropertiesToParametersArray(row.mappingObj.converter);
                            // datasource property to parameter array
                            row.mappingObj.dataSource = this.dataSourcePropertyToParametersArray(row.mappingObj.dataSource);
    
                            // replace converter and dataSource definitions
                            row.mappingObj.converter = this.buildConverterDefinition(row.selectedConverter, row.mappingObj.converter);
                            row.mappingObj.dataSource = this.buildDataSourceDefinition(row.selectedDatasourceType, row.mappingObj.dataSource, true);
    
                            var converterDefinition = row.mappingObj.converter;
                            //console.log("converterDefinition of row " + i + ": ", converterDefinition);
    
                            var datasourceTypeDefinition = row.mappingObj.dataSource;
                            //console.log("datasourceTypeDefinition before file upload: ", datasourceTypeDefinition);
                            
                            var datasourceFileInputId = resourceType + "DataSourceFileInputField" + i;
                            // upload file to importer
    
                            if(datasourceTypeDefinition.type === "FILE") {
                                try {
                                    var fileUploadName = await this.uploadFileToImporter(datasourceFileInputId);
                                    if(fileUploadName) {
                                        datasourceTypeDefinition.parameters[0].value = fileUploadName;
                                        //console.log("datasourceTypeDefinition after file upload: ", datasourceTypeDefinition);
                                    }
                                } catch (error) {
                                    console.error("error while uploading file in row: " + i);
                                    responses.push({
                                        name: resourceType === "georesource" ? row.name.datasetName : row.name.indicatorName,
                                        status: "error",
                                        message: error 
                                    });
                                    continue;
                                }
                            }
                            //console.log("datasourceTypeDefinition of row " + i + ": ", datasourceTypeDefinition);
    
                            // ========== for georesource update ========== 
                            if(resourceType === "georesource") {
                                var propertyMappingDefinition = row.mappingObj.propertyMapping;
                                //console.log("propertyMappingDefinition of row " + i + ": ", propertyMappingDefinition);
    
                                var propertyMappingDefinition = kommonitorImporterHelperService.buildPropertyMapping_spatialResource(
                                    row.mappingObj.propertyMapping.nameProperty,
                                    row.mappingObj.propertyMapping.identifierProperty,
                                    row.mappingObj.propertyMapping.validStartDateProperty,
                                    row.mappingObj.propertyMapping.validEndDateProperty,
                                    row.mappingObj.propertyMapping.arisenFromProperty,
                                    row.mappingObj.propertyMapping.keepAttributes,
                                    row.mappingObj.propertyMapping.keepMissingOrNullValueAttributes,
                                    this.createAttributeMappingsObject(row)
                                )
    
                                //console.log("propertyMappingDefinition of row " + i + " with importerService: ", propertyMappingDefinition);
    
                                 var putBody_georesources = kommonitorImporterHelperService.buildPutBody_georesources(row.mappingObj)
                                 //console.log("putBody_georesources of row " + i + ": ", putBody_georesources);
         
                                 // send post request and wait for it to complete
                                 var updateGeoresourceResponse_dryRun = undefined;
                                 try {
                                     updateGeoresourceResponse_dryRun = await kommonitorImporterHelperService.updateGeoresource(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, resourceId, putBody_georesources, true);
         
                                     if (!kommonitorImporterHelperService.importerResponseContainsErrors(updateGeoresourceResponse_dryRun)) {
                                         // all good, really execute the request to update data against data management API
                                         var updateGeoresourceResponse = await kommonitorImporterHelperService.updateGeoresource(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, resourceId, putBody_georesources, false);
                                         
                                         batchList[i].tempResourceId = resourceId;
                                         $rootScope.$broadcast("refreshGeoresourceOverviewTable");
         
                                         // refresh all admin dashboard diagrams due to modified metadata
                                         $rootScope.$broadcast("refreshAdminDashboardDiagrams");
         
                                         // add success object
                                         responses.push({
                                             name: row.name.datasetName,
                                             status: "success",
                                             message: updateGeoresourceResponse
                                         });
         
         
                                     } else {
                                         // errors ocurred
                                         // add them to response array
                                         responses.push({
                                             name: row.name.datasetName,
                                             status: "error",
                                             message: undefined
                                         });
                                         
                                         responses[i].message = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf.\n";
                                         responses[i].message += kommonitorImporterHelperService.getErrorsFromImporterResponse(updateGeoresourceResponse_dryRun);
                                     }
                                 } catch (error) {
                                     responses.push({
                                         name: row.name.datasetName,
                                         status: "error",
                                         message: undefined
                                     });
         
                                     if (error.data) {
                                         responses[i].message = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
                                     } else {
                                         responses[i].message = kommonitorDataExchangeService.syntaxHighlightJSON(error);
                                     }
                                     
                                     if(updateGeoresourceResponse_dryRun){
                                         error.message = kommonitorImporterHelperService.getErrorsFromImporterResponse(updateGeoresourceResponse_dryRun);
                                     }
                                 }
                            }
    
                            // ========== for indicator update ========== 
                            if(resourceType === "indicator") {
                                var propertyMappingDefinition = row.mappingObj.propertyMapping;
                                //console.log("propertyMappingDefinition of row " + i + ": ", propertyMappingDefinition);
    
                                var propertyMappingDefinition = kommonitorImporterHelperService.buildPropertyMapping_indicatorResource(
                                    row.mappingObj.propertyMapping.spatialReferenceKeyProperty,
                                    row.mappingObj.propertyMapping.timeseriesMappings,
                                    row.mappingObj.propertyMapping.keepMissingOrNullValueIndicator,
                                )
    
                                //console.log("propertyMappingDefinition of row " + i + " with importerService: ", propertyMappingDefinition);
    
                                var scopeProperties = {
                                    "targetSpatialUnitMetadata": {
                                        "spatialUnitLevel": row.selectedTargetSpatialUnit.spatialUnitLevel	
                                    },
                                    "currentIndicatorDataset": {
                                        "defaultClassificationMapping": row.name.defaultClassificationMapping
                                    },
                                    "allowedRoleNames": {
                                        "selectedItems": row.name.allowedRoles
                                    }
                                }
                                 var putBody_indicators = kommonitorImporterHelperService.buildPutBody_indicators(scopeProperties)
                                 //console.log("putBody_indicators of row " + i + ": ", putBody_indicators);
         
                                 // send post request and wait for it to complete
                                 var updateIndicatorResponse_dryRun = undefined;
                                 try {
                                     updateIndicatorResponse_dryRun = await kommonitorImporterHelperService.updateIndicator(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, resourceId, putBody_indicators, true);
         
                                     if (!kommonitorImporterHelperService.importerResponseContainsErrors(updateIndicatorResponse_dryRun)) {
                                         // all good, really execute the request to update data against data management API
                                         var updateIndicatorResponse = await kommonitorImporterHelperService.updateIndicator(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, resourceId, putBody_indicators, false);
                                         
                                         batchList[i].tempResourceId = resourceId;
                                         $rootScope.$broadcast("refreshIndicatorOverviewTable");
         
                                         // refresh all admin dashboard diagrams due to modified metadata
                                         $rootScope.$broadcast("refreshAdminDashboardDiagrams");
         
                                         // add success object
                                         responses.push({
                                             name: row.name.indicatorName,
                                             status: "success",
                                             message: updateIndicatorResponse
                                         });
         
         
                                     } else {
                                         // errors ocurred
                                         // add them to response array
                                         responses.push({
                                             name: row.name.indicatorName,
                                             status: "error",
                                             message: undefined
                                         });
                                         
                                         responses[i].message = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf.\n";
                                         responses[i].message += kommonitorImporterHelperService.getErrorsFromImporterResponse(updateIndicatorResponse_dryRun);
                                     }
                                 } catch (error) {
                                     responses.push({
                                         name: row.name.indicatorName,
                                         status: "error",
                                         message: undefined
                                     });
         
                                     if (error.data) {
                                         responses[i].message = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
                                     } else {
                                         responses[i].message = kommonitorDataExchangeService.syntaxHighlightJSON(error);
                                     }
                                     
                                     if(updateIndicatorResponse_dryRun){
                                         error.message = kommonitorImporterHelperService.getErrorsFromImporterResponse(updateIndicatorResponse_dryRun);
                                     }
                                 }
                            }  
                        }
    
                        $rootScope.$broadcast("batchUpdateCompleted", {
                            resourceType: resourceType,
                            value: responses
                        });
                    } catch (error) {
                        console.error("An error occurred during the batch update: ", error)
                    } finally {
                        startBtn.removeAttribute("disabled");
                        startBtn.innerHTML = "Update starten";
                    }
                };



                this.parseBatchListFromFile = function (resourceType, file, batchList) {
                    var fileReader = new FileReader();

                    fileReader.onload = function (event) {
                        batchList = JSON.parse(event.target.result);
                        if (resourceType === "georesource") {
                            $rootScope.$broadcast('georesourceBatchListParsed', {
                                newValue: batchList
                            });
                        }
                        if (resourceType === "indicator") {
                            $rootScope.$broadcast('indicatorBatchListParsed', {
                                newValue: batchList
                            });
                        }
                    };

                    fileReader.readAsText(file);
                }

                this.saveMappingObjectToFile = function(resourceType, $event, batchList) {

                    var filename;
                    var jsonToExport;
                    var rowIndex = this.getIndexFromId($event.currentTarget.id);
                    var row = batchList[rowIndex];
    
                    var objToExport = $.extend({}, row.mappingObj);

                    if(typeof(row.selectedConverter) === undefined) {
                        if(resourceType === "georesource" )
                            console.error("Geodaten-Quellformat* is not defined.")
                        if(resourceType === "indicator" )
                            console.error("Datensatz-Quellformat* is not defined.")
                    }
                        
                    if(typeof(row.selectedDatasourceType) === undefined)
                        console.error("Datenquelltyp* is not defined.")
                    objToExport.converter = this.converterPropertiesToParametersArray(objToExport.converter)
                    objToExport.dataSource = this.dataSourcePropertyToParametersArray(objToExport.dataSource)

                    // selected converter and DatasouceType might have changed.
                    // rebuild the corresponding definitions and insert parameter values
                    objToExport.converter = this.buildConverterDefinition(row.selectedConverter, objToExport.converter);
                    objToExport.dataSource = this.buildDataSourceDefinition(row.selectedDatasourceType, objToExport.dataSource, false)

                    if(resourceType === "indicator" ) {
                        if(typeof(row.selectedTargetSpatialUnit) === undefined)
                            console.error("Ziel-Raumebene* is not defined.")
                        objToExport.targetSpatialUnitName = row.selectedTargetSpatialUnit.spatialUnitLevel;
                    }
                        

                    jsonToExport = JSON.stringify(objToExport);

                    fileName = "KomMonitor-Import-Mapping-Konfiguration_Export.json"; // default
                    if (resourceType === "georesource" && row.name)
                            fileName = "KomMonitor-Import-Mapping-Konfiguration_Export-" + row.name.datasetName + ".json";
                    if (resourceType === "indicator" && row.name)
                            fileName = "KomMonitor-Import-Mapping-Konfiguration_Export-" + row.name.indicatorName + ".json";
                    

                    var blob = new Blob([jsonToExport], {
                        type: "application/json"
                    });
                    var data = URL.createObjectURL(blob);

                    var a = document.createElement('a');
                    a.download = fileName;
                    a.href = data;
                    a.textContent = "JSON";
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.click();

                    a.remove();
                }

                this.saveBatchListToFile = function (resourceType, batchList) {

                    var fileName;
                    var jsonToExport = "";
                    var objToExport = [];

                    for (var i = 0; i < batchList.length; i++) {
                        var row = batchList[i];
                        objToExport.push({});
                        // To not affect the $scope, we create a deep copy of batchList to export.
                        objToExport[i] = $.extend(true, objToExport[i], row);
                        // No need to export all of the metadata
                        // We just need to know which georesource/indicator was selected so we can restore it on import
                        // That ensures that the metadata is up to date (and not parsed from the exported batchList)
                        if (resourceType === "georesource" && objToExport[i].name)
                            objToExport[i].name = objToExport[i].name.georesourceId;
                        if (resourceType === "indicator" && objToExport[i].name)
                            objToExport[i].name = objToExport[i].name.indicatorId;

                        // convert properties to parameters array
                        objToExport[i].mappingObj.converter = this.converterPropertiesToParametersArray(objToExport[i].mappingObj.converter)
                        objToExport[i].mappingObj.dataSource = this.dataSourcePropertyToParametersArray(objToExport[i].mappingObj.dataSource)

                        // replace converter and dataSource definitions
                        objToExport[i].mappingObj.converter = this.buildConverterDefinition(row.selectedConverter, objToExport[i].mappingObj.converter);
                        objToExport[i].mappingObj.dataSource = this.buildDataSourceDefinition(row.selectedDatasourceType, objToExport[i].mappingObj.dataSource, false);

                        // No need to export these, information is stored in mappingObj
                        delete objToExport[i].selectedConverter;
                        delete objToExport[i].selectedDatasourceType;

                        // move information about targetSpatialUnit to mapping mappingObj
                        if(resourceType === "indicator" && row.selectedTargetSpatialUnit) {
                            objToExport[i].mappingObj.targetSpatialUnitName = row.selectedTargetSpatialUnit.spatialUnitLevel;
                            delete objToExport[i].selectedTargetSpatialUnit; 
                        }

                        if(row.hasOwnProperty("tempResourceId"))
                            delete row.tempResourceId;
                    }

                    jsonToExport = JSON.stringify(objToExport);
                    if (resourceType === "georesource")
                        fileName = "Georesource_batch_update_batch_list.json";
                    if (resourceType === "indicator")
                    fileName = "Indicator_batch_update_batch_list.json";

                    var blob = new Blob([jsonToExport], {
                        type: "application/json"
                    });
                    var data = URL.createObjectURL(blob);

                    var a = document.createElement('a');
                    a.download = fileName;
                    a.href = data;
                    a.textContent = "JSON";
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.click();

                    a.remove();
                }

                this.resetBatchUpdateForm = function (resourceType, batchList) {
                    // select all rows
                    for (var i = 0; i < batchList.length; i++) {
                        batchList[i].isSelected = true;
                    }
                    this.deleteSelectedRowsFromBatchList(batchList, false);

                    this.addNewRowToBatchList(resourceType, batchList)
                }

                this.onChangeSelectAllRows = function (allRowsSelected, batchList) {
                    if (allRowsSelected) {
                        angular.forEach(batchList, function (row) {
                            row.isSelected = true;
                        });
                    } else {
                        angular.forEach(batchList, function (row) {
                            row.isSelected = false;
                        });
                    }
                }

                this.addNewRowToBatchList = function (resourceType, batchList) {
                    //console.log(batchList);

                    // create new object theat matches the row-scheme
                    let obj = {}
                    // initialize properties so that they exist for each row
                    obj.isSelected = false;
                    obj.name = undefined;
                    obj.mappingTableName = "";
                    // mapping object depends on resource type
                    if (resourceType === "georesource") {
                        obj.mappingObj = {
                            converter: {
                                encoding: "",
                                mimeType: "",
                                name: "",
                                parameters: [
                                    /*
                                        {
		    		                        "name": "string",
		    		                        "value": "string"
                                        }
                                        */
                                ],
                                schema: ""
                            },
                            dataSource: {
                                parameters: [
                                    /*
                                        {
		    		                        "name": "string",
		    		                        "value": "string"
                                        }
                                        */
                                ],
                                type: ""
                            },
                            propertyMapping: {
                                attributes: [
                                    /*
                                    {
                                        "mappingName": "string", // target name
                                        "name": "string", // source name
                                        "type": "string" // dataType, [string|integer|float|date]
                                    }
                                    */
                                ],
                                identifierProperty: "",
                                keepAttributes: true,
                                nameProperty: "",
                                validEndDateProperty: "",
                                validStartDateProperty: ""
                            },
                            periodOfValidity: {
                                startDate: "",
                                endDate: ""
                            }
                        };
                    }

                    if (resourceType === "indicator") {
                        obj.mappingObj = {
                            converter: {
                                encoding: "",
                                mimeType: "",
                                name: "",
                                parameters: [
                                    /*
                                        {
		    		                        "name": "string",
		    		                        "value": "string"
                                        }
                                        */
                                ],
                                schema: ""
                            },
                            dataSource: {
                                parameters: [
                                    /*
                                        {
		    		                        "name": "string",
		    		                        "value": "string"
                                        }
                                        */
                                ],
                                type: ""
                            },
                            propertyMapping: {
                                timeseriesMappings: [
                                    /*
                                    {
                                        "indicatorValueProperty": "string",
                                        "timestamp": "date" // direct timestamp
                                    }, {
                                        "indicatorValueProperty": "string",
                                        "timestampProperty": "string"   // attribute column that contains timestamp(s)
                                    }
                                    */
                                ],
                                spatialReferenceKeyProperty: "",
                                
                                keepMissingOrNullValueIndicator: true,
                            },
                            targetSpatialUnitName: ""
                        };
                    }
                    batchList.push(obj);

                    if(resourceType === "georesource")
                        this.initializeGeoresourceDatepickerFields(batchList);
                    
                }

                this.deleteSelectedRowsFromBatchList = function (batchList, allRowsSelected) {
                    // loop backwards through $scope.batchList and remove selected rows
                    for (var i = batchList.length - 1; i >= 0; i--) {
                        if (batchList[i].isSelected)
                            batchList.splice(i, 1);
                    }

                    allRowsSelected = false; // in case it was true
                }

                // examples
                // mappingTable0 --> 0
                // mappingTable12 --> 12
                // but: 12mappingTable23 --> 12, returns first occurrence of number as index
                this.getIndexFromId = function (id) {
                    var re = /\d+/g; // gets all numbers
                    var index = id.match(re);
                    if (index) {
                        index = index[0];
                    }
                    return index;
                }


                // builds a converter definition with parameters array from the currently selected datasource
                // selectedConverter = the currently selected converter in the dropdown
                // oldConverter = the converter property from a mapping object.
                this.buildConverterDefinition = function (selectedConverter, oldConverter) {
                    
                    var converterDefinition = {
                        encoding: selectedConverter.encodings[0],
                        mimeType: selectedConverter.mimeTypes[0],
                        name: selectedConverter.name,
                        parameters: [],
                        schema: undefined
                    }

                    if (selectedConverter.name.includes("wfs.v1")) {
                        if (oldConverter.schema && oldConverter.schema.length > 0)
                            converterDefinition.schema = oldConverter.schema;
                    }

                    // add crs parameter
                    var param;
                    param = oldConverter.parameters.find(obj => {
                        return obj.name === "CRS"
                    });
                    if (param) {
                        converterDefinition.parameters.push({
                            name: param.name,
                            value: param.value
                        });
                    }

                    // add more parameters for specific converter types
                    if (selectedConverter.name.includes("csvLatLon") ||
                        selectedConverter.name.includes("csv_onlyIndicator")) {

                        param = oldConverter.parameters.find(obj => {
                            return obj.name == "separator"
                        });
                        if (param) {
                            converterDefinition.parameters.push({
                                name: param.name,
                                value: param.value
                            });
                        }
                    }

                    if (selectedConverter.name.includes("csvLatLon")) {
                        param = oldConverter.parameters.find(obj => {
                            return obj.name == "yCoordColumn"
                        });
                        if (param) {
                            converterDefinition.parameters.push({
                                name: param.name,
                                value: param.value
                            });
                        }

                        param = oldConverter.parameters.find(obj => {
                            return obj.name == "xCoordColumn"
                        });
                        if (param) {
                            converterDefinition.parameters.push({
                                name: param.name,
                                value: param.value
                            });
                        }
                    }

                    return converterDefinition;
                }


                // builds a datasource definition with parameters array from the currently selected datasource
                // selectedDatasourceType = the currently selected datasource in the dropdown
                // oldDataSource = the datasource property from a mapping object.
                this.buildDataSourceDefinition = function (selectedDatasourceType, oldDataSource, includeFileName) {

                    var dataSourceDefinition = {
                        parameters: [],
                        type: selectedDatasourceType.type
                    }


                    if (dataSourceDefinition.type === "FILE") {
                        var param = oldDataSource.parameters.find(obj => {
                            return obj.name === "NAME";
                        });
                        if (param) {
                            dataSourceDefinition.parameters.push({
                                name: param.name
                            });
                            if(includeFileName)
                                dataSourceDefinition.parameters[0].value = param.name;
                            else
                                dataSourceDefinition.parameters[0].value = ""
                        }

                    }

                    if (dataSourceDefinition.type === "HTTP") {
                        var param = oldDataSource.parameters.find(obj => {
                            return obj.name === "URL";
                        });
                        if (param) {
                            dataSourceDefinition.parameters.push({
                                name: param.name,
                                value: param.value
                            });
                        }
                    }

                    if (dataSourceDefinition.type === "INLINE") {
                        var param = oldDataSource.parameters.find(obj => {
                            return obj.name === "payload";
                        });
                        if (param) {
                            dataSourceDefinition.parameters.push({
                                name: param.name,
                                value: param.value
                            });
                        }

                    }

                    return dataSourceDefinition;
                }

                // We need properties to bind model variables to them.
                // Binding to unnamed objects in an array tricky (using the index is not reliable)
                // It also creates other problems
                this.converterParametersArrayToProperties = function (converter) {
                    var result = $.extend(true, {}, converter);
                    var array = converter.parameters;
                    // for each array element add a new property
                    for (var i = 0; i < array.length; i++) {
                        var paramName = array[i].name
                        var paramValue = array[i].value
                        result[paramName] = {
                            "name": paramName,
                            "value": paramValue
                        }
                    }
                    delete result.parameters;

                    return result;
                }

                // This reverses the result of the method converterParametersArrayToProperties
                this.converterPropertiesToParametersArray = function (converter) {
                    var result = $.extend(true, {}, converter);
                    result.parameters = [];

                    if (result.hasOwnProperty("CRS")) {
                        result.parameters.push({
                            name: "CRS",
                            value: result.CRS.value
                        });
                        delete result.CRS;
                    }

                    if (result.hasOwnProperty("separator")) {
                        result.parameters.push({
                            name: "separator",
                            value: result.separator.value
                        });
                        delete result.separator;
                    }

                    if (result.hasOwnProperty("yCoordColumn")) {
                        result.parameters.push({
                            name: "yCoordColumn",
                            value: result.yCoordColumn.value
                        });
                        delete result.yCoordColumn;
                    }

                    if (result.hasOwnProperty("xCoordColumn")) {
                        result.parameters.push({
                            name: "xCoordColumn",
                            value: result.xCoordColumn.value
                        });
                        delete result.xCoordColumn;
                    }

                    return result;
                }

                // We need properties to bind model variables to them.
                // Binding to unnamed objects in an array tricky (using the index is not reliable)
                // It also creates other problems
                this.dataSourceParametersArrayToProperty = function (dataSource) {
                    if(dataSource) {
                        var result = $.extend(true, {}, dataSource);
                        var array = dataSource.parameters;
    
                        if (array.length == 1) {
                            var paramName = array[0].name
                            var paramValue = array[0].value
    
                            result[paramName] = {
                                name: paramName,
                                value: paramValue
                            }
                        }
                        delete result.parameters;
    
                        return result;
                    }
                }

                // This reverses the result of the method dataSourceParametersArrayToProperty
                this.dataSourcePropertyToParametersArray = function (dataSource) {
                    if (dataSource) {
                        var result = $.extend(true, {}, dataSource);
                        result.parameters = [];
    
                        if (result.hasOwnProperty("NAME")) {
                            result.parameters.push({
                                name: "NAME",
                                value: result.NAME.value
                            });
                            delete result.NAME;
                        }
    
                        if (result.hasOwnProperty("URL")) {
                            result.parameters.push({
                                name: "URL",
                                value: result.URL.value
                            });
                            delete result.URL;
                        }
    
                        if (result.hasOwnProperty("payload")) {
                            result.parameters.push({
                                name: "payload",
                                value: result.payload.value
                            });
                            delete result.payload;
                        }
    
                        return result;
                    }
                    
                }


                // helper function to get a converter object by full name.
                // returns null if no converter was found
                this.getConverterObjectByName = function (name) {
                    for (const converter of kommonitorImporterHelperService.availableConverters) {
                        if (converter.name === name) {
                            return converter;
                        }
                    }
                    return null;
                }


                // helper function to get a datasourceType object by type.
                // returns null if no datasourceType was found
                this.getDatasourceTypeObjectByType = function (type) {
                    for (const datasourceType of kommonitorImporterHelperService.availableDatasourceTypes) {
                        if (datasourceType.type === type) {
                            return datasourceType;
                        }
                    }
                    return null;
                }


                // helper function to get a spatial unit object by full name.
                // returns null if no spatial unit was found
                this.getSpatialUnitObjectByName = function (name) {
                    for (const spatialUnit of kommonitorDataExchangeService.availableSpatialUnits) {
                        if (spatialUnit.spatialUnitLevel === name) {
                            return spatialUnit;
                        }
                    }
                    return null;
                }


                // helper function to get a georesource object by id.
                // returns null if no georesource object was found
                this.getGeoresourceObjectById = function (id) {
                    for (const georesource of kommonitorDataExchangeService.availableGeoresources) {
                        if (georesource.georesourceId === id) {
                            return georesource;
                        }
                    }
                    return null;
                }

                // helper function to get a indicator object by id.
                // returns null if no indicator object was found
                this.getIndicatorObjectById = function (id) {
                    for (let indicator of kommonitorDataExchangeService.availableIndicators) {
                        if (indicator.indicatorId === id) {
                            return indicator;
                        }
                    }
                    return null;
                }

                this.createAttributeMappingsObject = function(row) {
                    var attributeMapping = [];
                    for (let i = 0; i < row.mappingObj.propertyMapping.attributes.length; i++) {
                        let attribute = row.mappingObj.propertyMapping.attributes[i];
                        var tmpEntry = {
                            "sourceName": attribute.name,
                            "destinationName": attribute.mappingName
                        };

                        for (const dataType of kommonitorImporterHelperService.attributeMapping_attributeTypes) {
                            if (dataType.apiName === attribute.type) {
                                tmpEntry.dataType = dataType;
                            }
                        }

                        attributeMapping.push(tmpEntry);
                    }

                    return attributeMapping;
                }

                this.uploadFileToImporter = async function(datasourceFileInputId) {
                    
                    // this should be defined since the update is only possible if a file was manually selected
                    var file = $("#" + datasourceFileInputId).get(0).files[0];

                    if(file === null || file === undefined) {
                        throw new Error("File was not defined. Did not start upload to importer.")
                    }

                    // upload file to importer
                    var fileUploadName;
                    try {
                        fileUploadName = await kommonitorImporterHelperService.uploadNewFile(file, file.name);	
                    } catch (error) {
                        throw error;
                    }

                    return fileUploadName;
                };

                // loop through batch list and check if condition is true for at least one row
                this.checkIfMappingTableIsSpecified = function(batchList) {
                    let mappingTableIsSpecified = false;
                    for(let i=0; i<batchList.length;i++) {
                        if(batchList[i].mappingTableName != "") {
                            mappingTableIsSpecified = true;
                            break;
                        }
                    }
                    return mappingTableIsSpecified;
                }

                // loop through batch list and check if condition is true for at least one row
			    this.checkIfSelectedConverterIsWfsV1 = function(batchList) {
			    	let selectedConverterIsWfsV1 = false;
			    	for (let i=0; i < batchList.length; i++) {
			    		if (batchList[i].selectedConverter) {
			    			let converterName = batchList[i].selectedConverter.name;
			    			if (converterName != undefined && converterName.length > 0) {
			    				if (converterName.includes("wfs.v1")) {
			    					selectedConverterIsWfsV1 = true;
			    					break;
			    				}
			    			}
			    		}
			    	}
			    	return selectedConverterIsWfsV1;
			    }


                // loop through batch list and check if condition is true for at least one row
			    this.checkIfSelectedDatasourceTypeIsFile = function(batchList) {
			    	let selectedDatasourceTypeIsFile = false;
			    	for (let i=0; i<batchList.length; i++) {
			    		if (batchList[i].selectedDatasourceType) {
			    			let datasourceType = batchList[i].selectedDatasourceType.type;
			    			if (datasourceType != undefined && datasourceType.length > 0) {
			    				if (datasourceType == "FILE") {
			    					selectedDatasourceTypeIsFile = true;
			    					break;
			    				}
			    			}
			    		}
			    	}
			    	return selectedDatasourceTypeIsFile;
			    }

                
			    // loop through batch list and check if condition is true for at least one row
			    this.checkIfSelectedDatasourceTypeIsHttp = function(batchList) {
			    	let selectedDatasourceTypeIsHttp = false;
			    	for (let i=0; i<batchList.length; i++) {
			    		if (batchList[i].selectedDatasourceType) {
			    			let datasourceType = batchList[i].selectedDatasourceType.type;
			    			if (datasourceType != undefined && datasourceType.length > 0) {
			    				if (datasourceType == "HTTP") {
			    					selectedDatasourceTypeIsHttp = true;
			    					break;
			    				}
			    			}
			    		}
			    	}
			    	return selectedDatasourceTypeIsHttp;
			    }

            
			    // loop through batch list and check if condition is true for at least one row
			    this.checkIfSelectedDatasourceTypeIsInline = function(batchList) {
			    	let selectedDatasourceTypeIsInline = false;
			    	for (let i=0; i<batchList.length; i++) {
			    		if (batchList[i].selectedDatasourceType) {
			    			let datasourceType = batchList[i].selectedDatasourceType.type;
			    			if (datasourceType != undefined && datasourceType.length > 0) {
			    				if (datasourceType == "INLINE") {
			    					selectedDatasourceTypeIsInline = true;
			    					break;
			    				}
			    			}
			    		}
			    	}
			    	return selectedDatasourceTypeIsInline;
			    }

                
			    this.checkIfNameAndFilesChosenInEachRow = function(resourceType, batchList) {
                    
			    	let updateBtn = document.getElementById(resourceType + "-batch-update-btn");
			    	updateBtn.title = "Update starten" // default title, might get overwritten later
                
			    	if(batchList.length == 0) {
			    		updateBtn.title = "Die Batch-Liste is leer."
			    		return false;
			    	}
                
			    	for(let i=0; i<batchList.length; i++) {
                    
			    		if(batchList[i].name == undefined || batchList[i].name == "") {
			    			updateBtn.title = "Die Spalte Name* ist nicht für alle Zeilen gesetzt."
			    			return false;
			    		}

			    		if (batchList[i].selectedDatasourceType) {
                            let datasourceType = batchList[i].selectedDatasourceType.type;
			    			let dataSource = batchList[i].mappingObj.dataSource
			    			if (datasourceType != undefined && datasourceType.length > 0) {

			    				if (datasourceType == "FILE") {
			    					if(!dataSource.NAME) {
                                        updateBtn.title = "Die Spalte Datei* ist nicht für alle Zeilen gesetzt, in denen die Spalte Datenquelltyp* auf FILE gesetzt ist."
			    						return false;
                                    } else {
                                        let value = dataSource.NAME.value;
			    						if(value == undefined || value == "") {
			    							updateBtn.title = "Die Spalte Datei* ist nicht für alle Zeilen gesetzt, in denen die Spalte Datenquelltyp* auf FILE gesetzt ist."
			    							return false;
			    						}
                                    }
			    				}

                                if (datasourceType == "HTTP") {
                                    if(!dataSource.URL) {
                                        // property does not exist until user uses the input field for the first time
                                        updateBtn.title = "Die Spalte URL* ist nicht für alle Zeilen gesetzt, in denen die Spalte Datenquelltyp* auf HTTP gesetzt ist."
			    						return false;
                                    } else {
                                        // the field could still be empty (if it had input before)
                                        let value = dataSource.URL.value;
			    						if(value == undefined || value == "") {
			    							updateBtn.title = "Die Spalte URL* ist nicht für alle Zeilen gesetzt, in denen die Spalte Datenquelltyp* auf HTTP gesetzt ist."
			    							return false;
                                        }
                                    }
                                }

                                if (datasourceType == "INLINE") {
                                    if(!dataSource.payload) {
                                        // property does not exist until user uses the input field for the first time
                                        updateBtn.title = "Die Spalte Payload* ist nicht für alle Zeilen gesetzt, in denen die Spalte Datenquelltyp* auf INLINE gesetzt ist."
			    						return false;
                                    } else {
                                         // the field could still be empty (if it had input before)
                                        let value = dataSource.payload.value;
			    						if(value == undefined || value == "") {
			    							updateBtn.title = "Die Spalte Payload* ist nicht für alle Zeilen gesetzt, in denen die Spalte Datenquelltyp* auf INLINE gesetzt ist."
			    							return false;
			    						}
                                    } 
                                }
			    			}
			    		} else {
                            updateBtn.title = "Die Spalte Datenquelltyp* ist nicht für alle Zeilen gesetzt."
			    			return false;
                        }

                        
                        if (!batchList[i].selectedConverter) {
                            if(resourceType === "georesource")
                                updateBtn.title = "Die Spalte Geodaten-Quellformat* ist nicht für alle Zeilen gesetzt."
                            else
                                updateBtn.title = "Die Spalte Datensatz-Quellformat* ist nicht für alle Zeilen gesetzt."
                            
			    			return false;
                        }
			    	}

			    	return true;
			    }


                this.onDataSourceFileSelected = function(file, rowIndex, batchList) {
                    // set filename manually
                    let name = file.name;
                    $timeout(function() {
                        let dataSource = batchList[rowIndex].mappingObj.dataSource;
                        dataSource.parameters = [];
                        dataSource.NAME = {}
                        dataSource.NAME.value = name
                        batchList[rowIndex].mappingObj.dataSource = dataSource;
                    });
                }


			    this.onMappingTableSelected = function(resourceType, event, rowIndex, file, batchList) {
                
                    let mappingObj = JSON.parse(event.target.result);

			    	batchList[rowIndex].mappingTableName = file.name;
            
			    	mappingObj.converter = this.converterParametersArrayToProperties(mappingObj.converter);
			    	mappingObj.dataSource = this.dataSourceParametersArrayToProperty(mappingObj.dataSource);
                
			    	// set value of column "Datensatz-Quellformat*" by converter name
			    	let converterName = mappingObj.converter.name
			    	for(let i=0; i<kommonitorImporterHelperService.availableConverters.length; i++) {
			    		let avConverterName = kommonitorImporterHelperService.availableConverters[i].name
			    		if(converterName == avConverterName) {
			    			$timeout(function() {
			    				batchList[rowIndex].selectedConverter = kommonitorImporterHelperService.availableConverters[i];
			    			});
			    			break;
			    		}
			    	}
                
			    	// set value of column "Datenquelltyp*" by dataSource type
                    if(mappingObj.dataSource) {
                        let dataSourceType = mappingObj.dataSource.type;
                        for(let i=0; i<kommonitorImporterHelperService.availableDatasourceTypes.length; i++) {
                            let avDataSourceType = kommonitorImporterHelperService.availableDatasourceTypes[i].type
                            if(dataSourceType == avDataSourceType) {
                                $timeout(function() {
                                    batchList[rowIndex].selectedDatasourceType = kommonitorImporterHelperService.availableDatasourceTypes[i];
                                });
                                break;
                            }
                        }
                    }
			    	

                    if(resourceType === "indicator") {
                        // set value of column "Ziel-Raumebene*" by target spatial unit name
                        let targetSpatialUnitName = mappingObj.targetSpatialUnitName;
                        let spatialUnitObject = this.getSpatialUnitObjectByName(targetSpatialUnitName);
                        $timeout(function() {
                            batchList[rowIndex].selectedTargetSpatialUnit = spatialUnitObject;
                        });
                    }
                
			    	// do not import file name
                    if(mappingObj.dataSource) {
			    	    if(mappingObj.dataSource.type == "FILE") {
			    		    mappingObj.dataSource.NAME.value = "";
			    	    }
                    }
                
			    	//apply to scope
			    	$timeout(function() {
			    		batchList[rowIndex].mappingObj = mappingObj;
                        if(resourceType === "georesource")
                            thisService.initializeGeoresourceDatepickerFields(batchList);
			    	});
			    }


                this.filterConverters = function(resourceType) {
                    // remove csvLatLon for indicators
                    // and csv_onlyIndicator for georesources
                    return function (converter) {
                        if(resourceType === "georesource" && converter.simpleName === "csv_onlyIndicator")
                            return false
                        if(resourceType === "indicator" && converter.simpleName === "csvLatLon")
                            return false
                        
                        return true
                    };

                }


                this.onClickSaveColDefaultValue = function(resourceType, selectedCol, newValue, replaceAll, batchList) {
                    // differentiate between timeseries mapping and other columns
                    if(selectedCol == "mappingObj.propertyMapping.timeseriesMappings") {
                        // new value is undefined for timeseries mapping.
                        // instead we get the new mapping from the variable
                        if(typeof(newValue == "undefined")) {
                            let btns = angular.element($('.indicatorTimeseriesMappingBtn'));
                            for (let i=0; i<batchList.length; i++) {
                                // never change disabled fields
                                let btn = btns.get(i);
                                if(btn.getAttribute('disabled'))
                                    continue;

                                timeseriesMappingReference  = angular.fromJson(angular.toJson(timeseriesMappingReference));
                                let oldMapping = batchList[i].mappingObj.propertyMapping.timeseriesMappings
                                
                                // iterate timeseriesMappingReference
                                for (let j=0; j<timeseriesMappingReference.length; j++) {
                                    let exists = false;
                                    // for each entry check if it exists in oldMapping
                                    for (let k=0; k<oldMapping.length; k++) {
                                        // check if indicatorValueProperty value property is the same
                                        if(oldMapping[k].indicatorValueProperty == timeseriesMappingReference[j].indicatorValueProperty) {
                                            exists = true;
                                            if(replaceAll)
                                                batchList[i].mappingObj.propertyMapping.timeseriesMappings[j] = timeseriesMappingReference[j];
                                        }
                                    }

                                    if(!exists) {
                                        // add mapping
                                        batchList[i].mappingObj.propertyMapping.timeseriesMappings.push(timeseriesMappingReference[j])
                                    }
                                }
                            }
                        }
                    } else {
                        if(typeof(newValue != "undefined")) {
                            if(typeof(newValue === "object") || (typeof(newValue) === "string" && newValue.length > 0)) {
                                let fields = angular.element('[ng-model="' + resourceType + '.' + selectedCol + '"]');
                                for(let i=0; i<batchList.length; i++) {
                                    // never change disabled fields
                                    let field = fields.get(i);
                                    if(field.getAttribute('disabled'))
                                        continue;
                                        
                                    if (replaceAll) {
                                        // if checkbox is true update all rows
                                        set(batchList[i], selectedCol, newValue)
                                    } else {
                                        // else only update empty rows
                                        if (get(batchList[i], selectedCol) == undefined || get(batchList[i], selectedCol) == "")
                                            set(batchList[i], selectedCol, newValue)   
                                    }
                                }
                            }
                        }
                    }

                    // helper function to get nested properties where the path is variable
                    function get(obj, path) {
                        var schema = obj; // a moving reference to internal objects within obj
                        var pList = path.split('.');
                        var len = pList.length;
                        for(var i = 0; i < len-1; i++) {
                            var elem = pList[i];
                            if( !schema[elem] )
                                schema[elem] = {}
                            schema = schema[elem];
                        }
                        return schema[pList[len-1]];
                    };

                    // helper function to set nested properties where the path is variable
                    function set(obj, path, value) {
                        var schema = obj;  // a moving reference to internal objects within obj
                        var pList = path.split('.');
                        var len = pList.length;
                        for(var i = 0; i < len-1; i++) {
                            var elem = pList[i];
                            if( !schema[elem] )
                                schema[elem] = {}
                            schema = schema[elem];
                        }
                        schema[pList[len-1]] = value;
                    };
                }


                this.initializeGeoresourceDatepickerFields = function(batchList) {
                    $timeout(function() {
                        for(let i=0; i<batchList.length; i++) {
                            $('#georesourcePeriodOfValidityStartDatePicker' + i).datepicker(kommonitorDataExchangeService.datePickerOptions);
                            $('#georesourcePeriodOfValidityEndDatePicker' + i).datepicker(kommonitorDataExchangeService.datePickerOptions);
                        };
                    }, 200)
                }


                // the variable availableGeoresources / availableIndicators (which is used to fill the ng-options)
                // changes after each update, causing angularjs to loose the connection.
                // this function restores the names
                this.refreshNameColumn = function(resourceType, batchList) {
                    for(let i=0;i<batchList.length;i++) {
                        let row = batchList[i];
                        if(row.tempResourceId) {
                            let resource;
                            if (resourceType === "georesource")
                                resource = this.getGeoresourceObjectById(row.tempResourceId);
                            if (resourceType === "indicator")
                                resource = this.getIndicatorObjectById(row.tempResourceId);
                            
                            row.name = resource;
                        }
                    }
                }


                $rootScope.$on("timeseriesMappingChanged", function(event, data) {
                    timeseriesMappingReference = data.mapping;
                });
            }
        ]);