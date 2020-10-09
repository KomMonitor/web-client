angular.module('kommonitorBatchUpdateHelper', ['kommonitorDataExchange', 'kommonitorImporterHelper']);

angular
    .module('kommonitorBatchUpdateHelper', [])
    .service(
        'kommonitorBatchUpdateHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$http', '__env',
            function ($rootScope, $timeout, kommonitorDataExchangeService, kommonitorImporterHelperService, $http, __env) {

                var thisService = this; // allows calling service methods from inside other functions, where "this" references something else
                this.georesourcesIdArray = [];

                this.batchUpdate = async function (resourceType, batchList) {
                    //TODO check if all rows are valid, only continue if that is true

                    //TODO not working properly
                    //$("#georesourceBatchUpdateForm").validator("update");
                    //$("#georesourceBatchUpdateForm").validator("validate");

                    // create array to store response messages
                    var responses = [];

                    //TODO for each georesource in list
                    for (var i = 0; i < batchList.length; i++) {
                        // copy row to not change $scope
                        var row = $.extend(true, {}, batchList[i])

                        var georesourceId = row.name.georesourceId;

                        // converter properties to parameter array
                        row.mappingObj.converter = this.converterPropertiesToParametersArray(row.mappingObj.converter);
                        // datasource property to parameter array
                        row.mappingObj.dataSource = this.dataSourcePropertyToParametersArray(row.mappingObj.dataSource);

                        // replace converter and dataSource definitions
                        row.mappingObj.converter = this.buildConverterDefinition(row.selectedConverter, row.mappingObj.converter);
                        row.mappingObj.dataSource = this.buildDataSourceDefinition(row.selectedDatasourceType, row.mappingObj.dataSource);

                        var converterDefinition = row.mappingObj.converter;
                        console.log("converterDefinition of row " + i + ": ", converterDefinition);

                        var datasourceTypeDefinition = row.mappingObj.dataSource;
                        console.log("datasourceTypeDefinition of row " + i + ": ", datasourceTypeDefinition);

                        var datasourceFileInputId = "dataSourceFileInput" + i;

                        if(datasourceTypeDefinition.type === "FILE") {
                            try{
                                var fileUploadName = await this.uploadFileToImporter(datasourceFileInputId);
                                datasourceTypeDefinition.parameters[0].value = fileUploadName;
                                console.log("file uploaded. fileUploadName: ", fileUploadName);
                            } catch (error) {
                                console.log("error while uploading file in row: " + i);
                                responses.push({
                                    name: row.name.datasetName,
                                    status: "error",
                                    message: error 
                                });
                            }
                        }

                        var propertyMappingDefinition = row.mappingObj.propertyMapping;
                        console.log("propertyMappingDefinition of row " + i + ": ", propertyMappingDefinition);

                        var attributeMappings_adminView = this.createAttributeMappingsObject(row);

                        propertyMappingDefinition = kommonitorImporterHelperService.buildPropertyMapping_spatialResource(
                            row.mappingObj.propertyMapping.nameProperty,
                            row.mappingObj.propertyMapping.identifierProperty,
                            row.mappingObj.propertyMapping.validStartDateProperty,
                            row.mappingObj.propertyMapping.validEndDateProperty,
                            row.mappingObj.propertyMapping.arisenFromProperty,
                            row.mappingObj.propertyMapping.keepAttributes,
                            row.mappingObj.propertyMapping.keepMissingOrNullValueAttributes,
                            attributeMappings_adminView
                        )
                        console.log("propertyMappingDefinition of row " + i + " with importerService: ", propertyMappingDefinition);

                        var scopeProperties = {
                            "periodOfValidity": {
                                "startDate": row.mappingObj.periodOfValidity.startDate,
                                "endDate": row.mappingObj.periodOfValidity.endDate
                            }
                        }

                        var putBody_georesources = kommonitorImporterHelperService.buildPutBody_georesources(scopeProperties)
                        console.log("putBody_georesources of row " + i + ": ", putBody_georesources);

                        // send post request and wait for it to complete
                        var updateGeoresourceResponse_dryRun = undefined;
                        try {
                            updateGeoresourceResponse_dryRun = await kommonitorImporterHelperService.updateGeoresource(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, georesourceId, putBody_georesources, true);

                            if (!kommonitorImporterHelperService.importerResponseContainsErrors(updateGeoresourceResponse_dryRun)) {
                                // all good, really execute the request to update data against data management API
                                var updateGeoresourceResponse = await kommonitorImporterHelperService.updateGeoresource(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, georesourceId, putBody_georesources, false);

                                //batchList[i].tempGeoresourceId = georesourceId;
                                $rootScope.$broadcast("refreshGeoresourceOverviewTable");

                                // refresh all admin dashboard diagrams due to modified metadata
                                $rootScope.$broadcast("refreshAdminDashboardDiagrams");

                                // TODO this won't work if the georesources overview table is not updated after one second...
                                (function(i, georesourceId) {
                                    $timeout(function() {
                                        var georesource = thisService.getGeoresourceObjectById(georesourceId);
                                        console.log(georesource);
                                        batchList[i].name = georesource;
                                        console.log("batchList[i]: ", batchList[i]);
                                    }, 1000);
                                })(i, georesourceId);

                                // add success object
                                responses.push({
                                    name: row.name.datasetName,
                                    status: "success",
                                    message: undefined
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

                    $rootScope.$broadcast("georesourceBatchUpdateCompleted", {
                        value: responses
                    });

                };



                this.parseBatchListFromFile = function (resourceType, file, batchList) {
                    if (resourceType == "georesource") {
                        var fileReader = new FileReader();

                        fileReader.onload = function (event) {
                            batchList = JSON.parse(event.target.result);
                            $rootScope.$broadcast('georesourceBatchListParsed', {
                                newValue: batchList
                            });
                        };

                        // Read in the image file as a data URL.
                        fileReader.readAsText(file);
                    }

                    if (resourceType == "indicator") {
                        // TODO
                    }
                }

                this.saveBatchListToFile = function (resourceType, batchList) {

                    var fileName;
                    if (resourceType == "georesource") {
                            // No need to export all of the metadata
                            // We just need to know which georesource was selected so we can restore it on import
                            // That ensures that the metadata is up to date (and not parsed from the exported batchList)
                        // To not affect the $scope, we create a deep copy of batchList to export.
                        var objToExport = [];
                        var jsonToExport = "";
                            Object.assign({}, batchList);
                        for (var i = 0; i < batchList.length; i++) {
                            objToExport.push({});
                                Object.assign(objToExport[i], batchList[i]);

                                objToExport[i].name = objToExport[i].name.georesourceId;
                        }

                        jsonToExport = JSON.stringify(objToExport);
                        fileName = "Georessource_batch_update_batch_list.json";
                    }

                    if (resourceType == "indicator") {
                        fileName = "Indicator_batch_update_batch_list.json";
                        jsonToExport = JSON.stringify(batchList);
                    }

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
                    if (resourceType == "georesource") {

                        // To not affect the $scope, we create a deep copy of batchList to export.
                        var objToExport = [];
                        var jsonToExport = "";

                        for (var i = 0; i < batchList.length; i++) {
                            var row = batchList[i];
                            objToExport.push({});
                            objToExport[i] = $.extend(true, objToExport[i], row);
                            // No need to export all of the metadata
                            // We just need to know which georesource was selected so we can restore it on import
                            // That ensures that the metadata is up to date (and not parsed from the exported batchList)
                            if (objToExport[i].name)
                                objToExport[i].name = objToExport[i].name.georesourceId;

                            // if mapping table was selected
                            if (row.mappingTableName.length > 0) {

                                objToExport[i].mappingObj.converter = this.converterPropertiesToParametersArray(objToExport[i].mappingObj.converter)
                                objToExport[i].mappingObj.dataSource = this.dataSourcePropertyToParametersArray(objToExport[i].mappingObj.dataSource)

                                // replace converter and dataSource definitions
                                objToExport[i].mappingObj.converter = this.buildConverterDefinition(row.selectedConverter, objToExport[i].mappingObj.converter);
                                objToExport[i].mappingObj.dataSource = this.buildDataSourceDefinition(row.selectedDatasourceType, objToExport[i].mappingObj.dataSource);

                                // No need to export selectedConverter and selectedDatasourceType
                                delete objToExport[i].selectedConverter;
                                delete objToExport[i].selectedDatasourceType;
                            }
                        }

                        jsonToExport = JSON.stringify(objToExport);
                        fileName = "Georessource_batch_update_batch_list.json";
                    }

                    if (resourceType == "indicator") {
                        fileName = "Indicator_batch_update_batch_list.json";
                        jsonToExport = JSON.stringify(batchList);
                    }

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

                this.resetBatchUpdateForm = function (batchList) {
                    // select all rows
                    for (var i = 0; i < batchList.length; i++) {
                        batchList[i].isSelected = true;
                    }
                    this.deleteSelectedRowsFromBatchList(batchList, false);
                    this.addNewRowToBatchList("georesource", batchList)
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

                    if (resourceType == "georesource") {
                        var obj = {};
                        // initialize properties so that they exist for each row
                        obj.isSelected = false;
                        obj.name = undefined;
                        obj.mappingTableName = "";
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
                                arisenFromProperty: "",
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

                        batchList.push(obj);
                    }

                    if (resourceType == "indicator") {
                        // TODO
                    }
                }

                this.deleteSelectedRowsFromBatchList = function (batchList, allRowsSelected) {
                    // loop backwards through $scope.batchList and remove selected rows
                    for (var i = batchList.length - 1; i >= 0; i--) {
                        if (batchList[i].isSelected) {
                            batchList.splice(i, 1);

                        }
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

                this.buildConverterDefinition = function (selectedConverter, oldConverter) {
                    var converterDefinition = {
                        encoding: selectedConverter.encodings[0],
                        mimeType: selectedConverter.mimeTypes[0],
                        name: selectedConverter.name,
                        parameters: [],
                        schema: undefined
                    }

                    if (selectedConverter.name.includes("wfs.v1")) {
                        if (oldConverter.schema && oldConverter.schema.length > 0) {
                            converterDefinition.schema = oldConverter.schema;
                        }
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
                    if (selectedConverter.name.includes("csvLatLon")) {

                        param = oldConverter.parameters.find(obj => {
                            return obj.name == "separator"
                        });
                        if (param) {
                            converterDefinition.parameters.push({
                                name: param.name,
                                value: param.value
                            });
                        }

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

                this.buildDataSourceDefinition = function (selectedDatasourceType, oldDataSource) {
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
                                name: param.name,
                                value: param.value
                            });
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

                // This reverses the result of the method dataSourceParametersArrayToProperty
                this.dataSourcePropertyToParametersArray = function (dataSource) {
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

                // helper function to get a converter object by full name.
                // returns null if no converter was found
                this.getConverterObjectByName = function (name) {
                    for (converter of kommonitorImporterHelperService.availableConverters) {
                        if (converter.name === name) {
                            return converter;
                        }
                    }
                    return null;
                }

                // helper function to get a datasourceType object by type.
                // returns null if no datasourceType was found
                this.getDatasourceTypeObjectByType = function (type) {
                    for (datasourceType of kommonitorImporterHelperService.availableDatasourceTypes) {
                        if (datasourceType.type === type) {
                            return datasourceType;
                        }
                    }
                    return null;
                }

                // helper function to get a georesource object by id.
                // returns null if no georesource object was found
                this.getGeoresourceObjectById = function (id) {
                    for (georesource of kommonitorDataExchangeService.availableGeoresources) {
                        if (georesource.georesourceId === id) {
                            return georesource;
                        }
                    }
                    return null;
                }

                this.createAttributeMappingsObject = function(row) {
                    var attributeMappings_adminView = [];
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

                        attributeMappings_adminView.push(tmpEntry);
                    }

                    return attributeMappings_adminView;
                }

                this.uploadFileToImporter = async function(datasourceFileInputId) {
                    // get file if present
                    var file = document.getElementById(datasourceFileInputId).files[0];
                    console.log("file in uploadFileToImporter: ", file);
                    if(file === null || file === undefined){
                        return null;
                    }
                    // upload it to importer
                    var fileUploadName;
                    try {
                        fileUploadName = await kommonitorImporterHelperService.uploadNewFile(file, file.name);	
                    } catch (error) {
                        throw error;
                    }

                    return fileUploadName;
                };

            }
        ]);