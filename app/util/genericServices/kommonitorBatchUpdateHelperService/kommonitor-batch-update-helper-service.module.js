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
                            var putBody_georesources = kommonitorImporterHelperService.buildPutBody_georesources(scopeProperties)
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
                                console.log("parsed batchList: ", batchList);
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

                        var fileName;
                        if(resourceType == "georesource") {
                            // No need to export all of the metadata
                            // We just need to know which georesource was selected so we can restore it on import
                            // That ensures that the metadata is up to date (and not parsed from the exported batchList)
                            // To not affect the $scope, we create a deep copy of batchList to export.
                            var objToExport = [];
                            var jsonToExport = "";
                            Object.assign({}, batchList);
                            for(var i=0;i<batchList.length;i++) {
                                objToExport.push({});
                                Object.assign(objToExport[i], batchList[i]);

                                objToExport[i].name = objToExport[i].name.georesourceId;
                            }

                            jsonToExport = JSON.stringify(objToExport);
                            fileName = "Georessource_batch_update_batch_list.json";
                        }
                            
                        if(resourceType == "indicator") {
                            fileName = "Indicator_batch_update_batch_list.json";
                            jsonToExport = JSON.stringify(batchList);
                        }

                        var blob = new Blob([jsonToExport], {type: "application/json"});
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
                        // select all rows
                        for (var i = 0; i < batchList.length; i++) {
                            batchList[i].isSelected = true;
                        }
                        this.deleteSelectedRowsFromBatchList(batchList, false);
                        this.addNewRowToBatchList("georesource", batchList)
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
                            obj.mappingTableName = "";
                            obj.mappingObj = {};
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

            }
        ]);