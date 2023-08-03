"use strict";
angular.module('scriptPointsInPolygon').component('scriptPointsInPolygon', {
    templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/pointsInPolygon/script-points-in-polygon.template.html",
    controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
        'kommonitorCacheHelperService',
        function ScriptPointsInPolygonController(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $timeout, kommonitorCacheHelperService) {
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
            this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;
            // initialize any adminLTE box widgets
            $('.box').boxWidget();
            $scope.pathToScriptResource = "./kommonitor-script-resources/km_georessouce_count_pointsWithinPolygon.js";
            $scope.propertySchema = {};
            $scope.propertyOptions = undefined;
            $scope.propertyValueOptions = undefined;
            $scope.georesourceSelection = undefined;
            $scope.georesourceSelection_old = undefined;
            // parameter for georesource dataset
            $scope.parameterName_computationGeoresource = "compGeoId";
            $scope.parameterDescription_computationGeoresource = "Georessourcen ID des Punktdatensatzes.";
            $scope.parameterDefaultValue_computationGeoresource = undefined;
            $scope.parameterNumericMinValue_computationGeoresource = 0;
            $scope.parameterNumericMaxValue_computationGeoresource = 1;
            // parameter for object property name
            $scope.parameterName_computationFilterProperty = "compFilterProp";
            $scope.parameterDescription_computationFilterProperty = "Georessourcen Attributname.";
            $scope.parameterDefaultValue_computationFilterProperty = undefined;
            $scope.parameterNumericMinValue_computationFilterProperty = 0;
            $scope.parameterNumericMaxValue_computationFilterProperty = 1;
            // parameter for logical operator
            $scope.parameterName_computationFilterOperator = "compFilterOperator";
            $scope.parameterDescription_computationFilterOperator = "Vergleichsoperator";
            $scope.parameterDefaultValue_computationFilterOperator = undefined;
            $scope.parameterNumericMinValue_computationFilterOperator = 0;
            $scope.parameterNumericMaxValue_computationFilterOperator = 1;
            // parameter for property value
            $scope.parameterName_computationFilterPropertyValue = "compFilterPropVal";
            $scope.parameterDescription_computationFilterPropertyValue = "Filterwert.";
            $scope.parameterDefaultValue_computationFilterPropertyValue = undefined;
            $scope.parameterNumericMinValue_computationFilterPropertyValue = 0;
            $scope.parameterNumericMaxValue_computationFilterPropertyValue = 1;
            // parameter for property value
            $scope.parameterDefaultValue_computationFilterPropertyValueRange_from = undefined;
            $scope.parameterDefaultValue_computationFilterPropertyValueRange_to = undefined;
            /*
                availableScriptDataTypes = [
                    {
                                "displayName": "Textuell (String)",
                                "apiName": "string"
                            },
                            {
                                "displayName": "Wahrheitswert (Boolean)",
                                "apiName": "boolean"
                    },
                    {
                                "displayName": "Ganzzahl (Integer)",
                                "apiName": "integer"
                            },
                            {
                                "displayName": "Gleitkommazahl (Double)",
                                "apiName": "double"
                            }
                ];
            */
            $scope.parameterDataType = kommonitorScriptHelperService.availableScriptDataTypes[0];
            $scope.scriptCode_readableString_forPreview = undefined;
            $scope.scriptCodeDomElementId = "#scriptCodePreview";
            $scope.scriptFormulaHTML = undefined;
            $scope.propertyValueSelection = [];
            $scope.dropdownTranslations = kommonitorDataExchangeService.multiselectDropdownTranslations;
            $scope.dropdownSettings = kommonitorDataExchangeService.multiselectDropdownSettings;
            $scope.dropdownEvents = {
                onSelectionChanged: function () {
                    $scope.onChangePropertyValue();
                }
            };
            /*
            * reset relevant things due to change of script type
            */
            $scope.init = function () {
                kommonitorScriptHelperService.reset();
                $scope.initFixedScriptCode();
            };
            $scope.initFixedScriptCode = function () {
                $http.get($scope.pathToScriptResource, { 'responseType': 'text' }).then(function (response) {
                    $scope.scriptCode_readableString_forPreview = response.data;
                    kommonitorScriptHelperService.scriptCode_readableString = response.data;
                    $scope.scriptCode_readableString_forPreview = response.data;
                    kommonitorScriptHelperService.prettifyScriptCodePreview($scope.scriptCodeDomElementId);
                });
            };
            $scope.init();
            $scope.onChangeGeoresource = function (georesourceSelection) {
                // remove previous refIndicator from requiredIndicators and add new one
                if ($scope.georesourceSelection_old) {
                    kommonitorScriptHelperService.removeBaseGeoresource($scope.georesourceSelection_old);
                }
                kommonitorScriptHelperService.addBaseGeoresource(georesourceSelection);
                $scope.georesourceSelection_old = georesourceSelection;
                //reset the one and only parameter in this case each time a base indicator is added
                $scope.resetGeoresourceParameter();
                $scope.resetPropertyOptions();
                $scope.resetComputationFormulaAndLegend();
            };
            $scope.onChangePropertyName = function () {
                $scope.resetScriptParameter_filterPropertyName();
                $scope.resetComputationFormulaAndLegend();
                $scope.filterOperatorOptions();
                $scope.resetPropertyValueOptions();
                if ($scope.parameterDefaultValue_computationFilterOperator === 'Contains') {
                    $scope.propertyValueSelection = [];
                }
            };
            $scope.onChangeOperatorOption = function () {
                if ($scope.parameterDefaultValue_computationFilterOperator !== 'Contains') {
                    $scope.propertyValueSelection = [];
                }
                $scope.resetScriptParameter_operator();
                $scope.resetComputationFormulaAndLegend();
            };
            $scope.onChangePropertyValue = function () {
                $scope.resetScriptParameter_filterPropertyValue();
                $scope.resetComputationFormulaAndLegend();
            };
            $scope.resetScriptParameter_computationGeoresource = function (georesourceMetadata) {
                return georesourceMetadata.georesourceId;
            };
            $scope.resetGeoresourceParameter = function () {
                kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationGeoresource);
                $scope.parameterDefaultValue_computationGeoresource = $scope.resetScriptParameter_computationGeoresource($scope.georesourceSelection);
                kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationGeoresource, $scope.parameterDescription_computationGeoresource, $scope.parameterDataType, $scope.parameterDefaultValue_computationGeoresource, $scope.parameterNumericMinValue_computationGeoresource, $scope.parameterNumericMaxValue_computationGeoresource);
            };
            $scope.resetPropertyOptions = function () {
                kommonitorCacheHelperService.fetchSingleGeoresourceSchema($scope.parameterDefaultValue_computationGeoresource)
                    .then((schema) => {
                    for (var prop in schema) {
                        if (schema[prop] !== 'Date') {
                            $scope.propertySchema[prop] = schema[prop];
                        }
                    }
                    $scope.propertyOptions = Object.keys($scope.propertySchema);
                });
            };
            $scope.resetScriptParameter_filterPropertyName = function () {
                kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationFilterProperty);
                $scope.parameterDefaultValue_computationFilterProperty = $scope.propertyName;
                kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationFilterProperty, $scope.parameterDescription_computationFilterProperty, $scope.parameterDataType, $scope.parameterDefaultValue_computationFilterProperty, $scope.parameterNumericMinValue_computationFilterProperty, $scope.parameterNumericMaxValue_computationFilterProperty);
            };
            $scope.filterOperatorOptions = function () {
                if ($scope.propertySchema[$scope.parameterDefaultValue_computationFilterProperty] === "String") {
                    $scope.operatorOptions = [
                        {
                            "apiName": "Equal",
                            "displayName": "gleich (=)",
                        },
                        {
                            "apiName": "Unequal",
                            "displayName": "ungleich (!=)",
                        },
                        {
                            "apiName": "Contains",
                            "displayName": "enthält (kommaseparierte Liste)",
                        }
                    ];
                }
                else {
                    $scope.operatorOptions = [
                        {
                            "apiName": "Equal",
                            "displayName": "gleich (=)",
                        },
                        {
                            "apiName": "Greater_than",
                            "displayName": "größer als (>)",
                        },
                        {
                            "apiName": "Greater_than_or_equal",
                            "displayName": "größer als oder gleich (>=)",
                        },
                        {
                            "apiName": "Less_than",
                            "displayName": "kleiner als (<)",
                        },
                        {
                            "apiName": "Less_than_or_equal",
                            "displayName": "kleiner als oder gleich (<=)",
                        },
                        {
                            "apiName": "Unequal",
                            "displayName": "ungleich (!=)",
                        },
                        {
                            "apiName": "Range",
                            "displayName": "Wertebereich (>=untere Grenze & <obere Grenze)",
                        }
                    ];
                }
            };
            $scope.resetScriptParameter_operator = function () {
                kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationFilterOperator);
                if ($scope.operator !== null) {
                    $scope.parameterDefaultValue_computationFilterOperator = $scope.operator.apiName;
                }
                kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationFilterOperator, $scope.parameterDescription_computationFilterOperator, $scope.parameterDataType, $scope.parameterDefaultValue_computationFilterOperator, $scope.parameterNumericMinValue_computationFilterOperator, $scope.parameterNumericMaxValue_computationFilterOperator);
            };
            $scope.resetPropertyValueOptions = function () {
                kommonitorCacheHelperService.fetchSingleGeoresourceWithoutGeometry($scope.parameterDefaultValue_computationGeoresource)
                    .then((dataTable) => {
                    var data = dataTable;
                    var tmpArray = data.map(item => {
                        let value = item[$scope.parameterDefaultValue_computationFilterProperty];
                        return value;
                    });
                    if ($scope.propertySchema[$scope.parameterDefaultValue_computationFilterProperty] === "String" || $scope.propertySchema[$scope.parameterDefaultValue_computationFilterProperty] === "Boolean") {
                        // sort strings
                        $scope.propertyValueOptions = Array.from(new Set(tmpArray)).sort();
                    }
                    else {
                        // sort numbers
                        $scope.propertyValueOptions = Array.from(new Set(tmpArray)).sort(function (a, b) {
                            return a - b;
                        });
                    }
                });
            };
            $scope.filterPropertyValueRange_toOptions = function () {
                return function (item) {
                    if (item > $scope.propertyValueRange_from) {
                        return true;
                    }
                    return false;
                };
            };
            $scope.resetScriptParameter_filterPropertyValue = function () {
                kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationFilterPropertyValue);
                if ($scope.parameterDefaultValue_computationFilterOperator !== "Contains") {
                    $scope.parameterDefaultValue_computationFilterPropertyValue = $scope.propertyValue;
                }
                else {
                    $scope.parameterDefaultValue_computationFilterPropertyValue = $scope.propertyValueSelection.join();
                }
                kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationFilterPropertyValue, $scope.parameterDescription_computationFilterPropertyValue, $scope.parameterDataType, $scope.parameterDefaultValue_computationFilterPropertyValue, $scope.parameterNumericMinValue_computationFilterPropertyValue, $scope.parameterNumericMaxValue_computationFilterPropertyValue);
            };
            $scope.resetComputationFormulaAndLegend = function () {
                kommonitorScriptHelperService.scriptFormulaHTML = "";
                var formulaHTML = "";
                if ($scope.propertyName !== undefined && $scope.operator && $scope.operator.apiName !== undefined && ($scope.propertyValue != undefined || $scope.propertyValueSelection != undefined)) {
                    formulaHTML = "<b>Berechnung gem&auml;&szlig; Geodatenanalyse<br/><i>Anzahl Punkte des Datensatzes G<sub>1</sub> pro Raumeinheits-Feature</i> <br/> <i>Filterkriterium:</i> '" + $scope.propertyName + "' '" + $scope.operator.displayName + "' '" + $scope.propertyValue + "'";
                    if ($scope.operator.apiName === "Range") {
                        formulaHTML = "<b>Berechnung gem&auml;&szlig; Geodatenanalyse<br/><i>Anzahl Punkte des Datensatzes G<sub>1</sub> pro Raumeinheits-Feature</i> <br/> <i>Filterkriterium:</i> '" + $scope.propertyName + "' im " + "Wertebereich von '>=" + $scope.propertyValueRange_from + " bis <" + $scope.propertyValueRange_to + "'";
                    }
                    if ($scope.operator.apiName === "Contains") {
                        formulaHTML = "<b>Berechnung gem&auml;&szlig; Geodatenanalyse<br/><i>Anzahl Punkte des Datensatzes G<sub>1</sub> pro Raumeinheits-Feature</i> <br/> <i>Filterkriterium:</i> '" + $scope.propertyName + "' 'enthält' '" + $scope.propertyValueSelection + "'";
                    }
                }
                else {
                    formulaHTML = "<b>Berechnung gem&auml;&szlig; Geodatenanalyse<br/><i>Anzahl Punkte des Datensatzes G<sub>1</sub> pro Raumeinheits-Feature</i>";
                }
                var legendItemsHTML = "<b>Legende zur Geodatenanalyse</b><br/>G<sub>1</sub>: " + $scope.georesourceSelection.datasetName;
                kommonitorScriptHelperService.scriptFormulaHTML = formulaHTML + "<br/><br/>" + legendItemsHTML;
            };
            $scope.onChangePropertyValueRange_range = function () {
                $scope.propertyValue = $scope.propertyValueRange_from + "-" + $scope.propertyValueRange_to;
                $scope.resetScriptParameter_filterPropertyValue();
                $scope.resetComputationFormulaAndLegend();
            };
        }
    ]
});
//# sourceMappingURL=script-points-in-polygon.component.js.map