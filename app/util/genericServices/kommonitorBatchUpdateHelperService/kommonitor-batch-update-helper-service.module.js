angular.module('kommonitorBatchUpdateHelper', ['kommonitorDataExchange']);

angular
    .module('kommonitorBatchUpdateHelper', [])
    .service(
        'kommonitorBatchUpdateHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', '$http', '__env',
            function ($rootScope, $timeout,
                kommonitorDataExchangeService, $http, __env) {

                    this.batchUpdate = function(resourceType) {

                        //TODO check if all data is specified
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

                    this.parseBatchListFromFile = function(resourceType, file, scope) {
                        if(resourceType == "georesource") {
                            var fileReader = new FileReader();

                            fileReader.onload = function(event) {
                                scope.batchList = JSON.parse(event.target.result);
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

                    this.onChangeSelectAllRows = function(scope) {
                        if(scope.allRowsSelected) {
                            angular.forEach(scope.batchList, function(row) {
                                row.isSelected = true;
                            });
                        } else {
                            angular.forEach(scope.batchList, function(row) {
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

                    this.deleteSelectedRowsFromBatchList = function(scope) {
                        // loop backwards through $scope.batchList and remove selected rows
                        for (var i = scope.batchList.length - 1; i >= 0; i--) {
                            if (scope.batchList[i].isSelected) {
                                scope.batchList.splice(i, 1);
                                
                            }
                        }

                        scope.allRowsSelected = false; // in case it was true
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