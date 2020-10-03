angular.module('kommonitorBatchUpdateHelper', ['kommonitorDataExchange', 'kommonitorImporterHelper']);

angular
    .module('kommonitorBatchUpdateHelper', [])
    .service(
        'kommonitorBatchUpdateHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$http', '__env',
            function ($rootScope, $timeout,
                kommonitorDataExchangeService, kommonitorImporterHelperService, $http, __env) {

                    this.batchUpdate = async function(resourceType, batchList) {
                        //TODO check if all rows are valid, only continue if that is true
                        
                        //TODO not working properly
                        $("#georesourceBatchUpdateForm").validator("update");
                        $("#georesourceBatchUpdateForm").validator("validate");

                        // create object to store error messages
                        var errorMessages = {};

                        //TODO for each georesource in list
                        for(var i=0;i<batchList.length;i++) {
                            var row = batchList[i];
                            var georesourceId = row.name.georesourceId;

                            var converterDefinition = row.mappingObj.converter;
                            console.log("converterDefinition of row " + i + ": ", converterDefinition);
                            
                            var datasourceTypeDefinition = row.mappingObj.dataSource;
                            console.log("datasourceTypeDefinition of row " + i + ": ", datasourceTypeDefinition);

                            //var datasourceFileInputId = "mappingTableSelect" + i;
                            //await this.uploadFileToImporter(row.mappingObj, datasourceFileInputId);
                            //console.log("file uploaded");

                            var propertyMappingDefinition = row.mappingObj.propertyMapping;
                            console.log("propertyMappingDefinition of row " + i + ": ", propertyMappingDefinition);

                            var attributeMappings_adminView = [];
                            for(var j=0;j<row.mappingObj.propertyMapping.attributes.length;j++) {
                                let attribute = row.mappingObj.propertyMapping.attributes[j];
                                var tmpEntry = {
                                    "sourceName": attribute.name,
						            "destinationName": attribute.mappingName
                                };

                                for (const dataType of kommonitorImporterHelperService.attributeMapping_attributeTypes) {
                                    if (dataType.apiName === attribute.type){
                                        tmpEntry.dataType = dataType;
                                    }
                                }

                                attributeMappings_adminView.push(tmpEntry);
                            }
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
                                    "startDate": row.periodOfValidityStart,
                                    "endDate": row.periodOfValidityEnd
                                }
                            }
                            console.log(row);
                            var putBody_georesources = this.buildPutBody_georesources(scopeProperties);
                            console.log("putBody_georesources of row " + i + ": ", putBody_georesources);
                            
                            // send post request and wait for it to complete
                            var newGeoresourceResponse_dryRun = undefined;
                            try {
                                newGeoresourceResponse_dryRun = await kommonitorImporterHelperService.updateGeoresource(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, georesourceId, putBody_georesources, true);

                                if (!kommonitorImporterHelperService.importerResponseContainsErrors(newGeoresourceResponse_dryRun)) {
                                    // all good, really execute the request to update data against data management API
                                    var newGeoresourceResponse = await kommonitorImporterHelperService.updateGeoresource(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, georesourceId, putBody_georesources, false);

                                    $rootScope.$broadcast("refreshGeoresourceOverviewTable");

                                    // refresh all admin dashboard diagrams due to modified metadata
                                    $rootScope.$broadcast("refreshAdminDashboardDiagrams");

                                    //$scope.successMessagePart = $scope.postBody_georesources.datasetName;
                                    //$scope.importedFeatures = kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(newGeoresourceResponse);

                                    //$("#georesourceAddSuccessAlert").show();

                                    //$scope.loadingData = false;
                                } else {
                                    // errors ocurred
                                    // show them 
                                    //$scope.errorMessagePart = "Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf";
                                    //$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(newGeoresourceResponse_dryRun);

                                    //$("#georesourceAddErrorAlert").show();
                                    //$scope.loadingData = false;

                                    //setTimeout(() => {
                                    //    $scope.$apply();
                                    //}, 250);

                                }
                            } catch (error) {
                                if (error.data) {
                                    //$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
                                    console.error(error.data);
                                } else {
                                    //$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
                                    console.error(error);
                                }

                                //if (newGeoresourceResponse_dryRun) {
                                    //$scope.importerErrors = kommonitorImporterHelperService.getErrorsFromImporterResponse(newGeoresourceResponse_dryRun);
                                //}

                                //$("#georesourceAddErrorAlert").show();
                                //$scope.loadingData = false;

                                //setTimeout(() => {
                                //    $scope.$apply();
                                //}, 250);
                            }
                        }
                        
                        //TODO show error messages
                        if(resourceType == "georesource") {

                        }

                        if(resourceType == "indicator") {

                        }
                    };



                    this.parseBatchListFromFile = function(resourceType, file, batchList) {
                        if(resourceType == "georesource") {
                            var fileReader = new FileReader();

                            fileReader.onload = function(event) {
                                batchList = JSON.parse(event.target.result);
                                $rootScope.$broadcast('georesourceBatchListParsed', {
                                    newValue: batchList
                                });
                            };
                
                            // Read in the image file as a data URL.
                            fileReader.readAsText(file);
                        }

                        if(resourceType == "indicator") {
                            // TODO
                        }
                    }

                    this.saveBatchListToFile = function(resourceType, batchList) {
                        var batchListJSON = JSON.stringify(batchList);

                        var fileName;
                        if(resourceType == "georesource")
                            fileName = "Georessource_batch_update_batch_list.json";
                        if(resourceType == "indicator")
                            fileName = "Indicator_batch_update_batch_list.json";

                        var blob = new Blob([batchListJSON], {type: "application/json"});
                        var data  = URL.createObjectURL(blob);

                        var a = document.createElement('a');
                        a.download    = fileName;
                        a.href        = data;
                        a.textContent = "JSON";
                        a.target = "_blank";
                        a.rel = "noopener noreferrer";
                        a.click();

                        a.remove();
                    }

                    this.saveMappingObjectToFile = function(mappingObj) {
                        var mappingObjJSON = JSON.stringify(mappingObj);
                        
                        var fileName = "KomMonitor-Import-Mapping-Konfiguration_Export.json";

                        var blob = new Blob([mappingObjJSON], {type: "application/json"});
                        var data  = URL.createObjectURL(blob);

                        var a = document.createElement('a');
                        a.download    = fileName;
                        a.href        = data;
                        a.textContent = "JSON";
                        a.target = "_blank";
                        a.rel = "noopener noreferrer";
                        a.click();

                        a.remove();
                    }

                    this.resetBatchUpdateForm = function(batchList) {
                        for(var i=0;i<batchList.length;i++)
                            batchList[i] = {};
                    }

                    this.onChangeSelectAllRows = function(allRowsSelected, batchList) {
                        if(allRowsSelected) {
                            angular.forEach(batchList, function(row) {
                                row.isSelected = true;
                            });
                        } else {
                            angular.forEach(batchList, function(row) {
                                row.isSelected = false;
                            });
                        }
                    }

                    this.addNewRowToBatchList = function(resourceType, batchList) {

                        if(resourceType == "georesource") {
                            var obj = {};
                            // initialize properties so that they exist for each row
                            obj.isSelected = false;
                            obj.name = undefined;
                            obj.mappingTable = "";
                            obj.mappingObj = {};
                            obj.saveToMappingTable = undefined;
                            obj.periodOfValidityStart = "";
                            obj.periodOfValidityEnd = "";
                            obj.dataFormat = {};
                            obj.dataFormat.format = "";
                            obj.dataFormat.crs = "";
                            obj.dataFormat.separator = "";
                            obj.dataFormat.yCoordColumn = "";
                            obj.dataFormat.xCoordColumn = "";
                            obj.dataFormat.schema = "";
                            obj.datasourceType = {};
                            obj.datasourceType.type = "";
                            obj.datasourceType.file = "";
                            obj.datasourceType.url = "";
                            obj.datasourceType.payload = "";
                            obj.idAttrName = "";
                            obj.nameAttrName = "";
                            obj.lifetimeBeginnAttrName = "";
                            obj.lifetimeEndAttrName = "";

                            batchList.push(obj);
                        }

                        if(resourceType == "indicator") {
                            // TODO
                        }
                    }

                    this.deleteSelectedRowsFromBatchList = function(batchList, allRowsSelected) {
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
                    this.getIndexFromId = function(id) {
                        var re = /\d+/g; // gets all numbers
                        var index = id.match(re)[0];
                        return index;
                    }

                    /*this.uploadFileToImporter = async function (mappingObj, datasourceFileInputId) {

                        if (mappingObj.dataSource.type === "FILE") {
                            // get file if present
                            var file = document.getElementById(datasourceFileInputId).files[0];

                            if (file === null || file === undefined) {
                                return null;
                            }

                            // upload it to importer
                            //TODO show error message
                            var fileUploadName;
                            try {
                                //fileUploadName = await kommonitorImporterHelperService.uploadNewFile(file, file.name);
                                fileUploadName = "test";
                                console.log("fileUploadName: ", fileUploadName);
                            } catch (error) {
                                console.error("Error while uploading file to importer.");
                                console.error(error);
                                kommonitorDataExchangeService.displayMapApplicationError(error);
                                throw error;
                            }
                        }
                    }*/

                    this.buildPutBody_georesources = function(scopeProperties) {
                        //TODO build scopeProperties
                        console.log(scopeProperties);
                        var putBody =
                        {
                            "geoJsonString": "",
                            "periodOfValidity": {
                                "endDate": scopeProperties.periodOfValidity.endDate,
                                "startDate": scopeProperties.periodOfValidity.startDate
                            }
                        };
            
                        return putBody;
                        
                        // Metadata can not be changed in batch-update.
                        // We get the current metadata for this georesource and pass it directly to the post request
                        /*var result = null;
                        for (existGeoresource of kommonitorDataExchangeService.availableGeoresources) {

                            if(existGeoresource.georesourceId == georesourceId) {
                                var metadata = existGeoresource.metadata;
                                result = {
                                    "metadata": {
                                        "note": metadata.note,
                                        "literature": metadata.literature,
                                        "updateInterval": metadata.updateInterval,
                                        "sridEPSG": metadata.sridEPSG,
                                        "datasource": metadata.datasource,
                                        "contact": metadata.contact,
                                        "lastUpdate": metadata.lastUpdate,
                                        "description": metadata.description,
                                        "databasis": metadata.databasis
                                    },
                                    "datasetName": existGeoresource.datasetName,
                                    "isPOI": existGeoresource.isPOI,
                                    "isLOI": existGeoresource.isLOI,
                                    "isAOI": existGeoresource.isAOI,
                                    "poiSymbolBootstrap3Name": existGeoresource.poiSymbolBootstrap3Name,
                                    "poiSymbolColor": existGeoresource.poiSymbolColor,
                                    "loiDashArrayString": existGeoresource.loiDashArrayString,
                                    "poiMarkerColor": existGeoresource.poiMarkerColor,
                                    "loiColor": existGeoresource.loiColor,
                                    "loiWidth": existGeoresource.loiWidth,
                                    "aoiColor": existGeoresource.aoiColor,
                                    "topicReference": existGeoresource.topicReference
                                }
                            }
                        }

                        if (result == null) {
                            console.error("Could not access the metadata of the given georesource. No georesource found for the given name.")
                        }

                        return result;*/
                    }
            }
        ]);