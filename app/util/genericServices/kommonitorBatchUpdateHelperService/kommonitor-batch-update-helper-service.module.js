angular.module('kommonitorBatchUpdateHelper', ['kommonitorDataExchange']);

angular
    .module('kommonitorBatchUpdateHelper', [])
    .service(
        'kommonitorBatchUpdateHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', '$http', '__env',
            function ($rootScope, $timeout,
                kommonitorDataExchangeService, $http, __env) {

                    this.batchUpdate = function(resourceType) {

                        //TODO check if all data is specified
                       // var allDataSpecified = await $scope.buildImporterObjects();

                        /*
                        if (!allDataSpecified) {

                            $("#georesourceAddForm").validator("update");
                            $("#georesourceAddForm").validator("validate");
                            return;
                        }
                        */
                        // if no, use bootstrap validator
                        // if yes, continue

                        //TODO create some object to store error messages

                        //TODO for each georesource/indicator in list
                            // TODO build a post request for the importer service
                            // TODO send post request and wait for it to complete
                            // TODO collect error messages
                        
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


                    /**
                     * more or less a copy of the scope method in georesource-add-modal.component.js
                     */
                    //this.buildImporterObjects = async function(){
                        // scope.converterDefinition = scope.buildConverterDefinition();
                        // scope.datasourceTypeDefinition = await scope.buildDatasourceTypeDefinition();
                        // scope.propertyMappingDefinition = scope.buildPropertyMappingDefinition();
                        // scope.postBody_georesources = scope.buildPostBody_georesources();
            
                        // if(!scope.converterDefinition || !scope.datasourceTypeDefinition || !scope.propertyMappingDefinition || !scope.postBody_georesources){
                        //     return false;
                        // }
                        // return true;
                    //};
            }
        ]);