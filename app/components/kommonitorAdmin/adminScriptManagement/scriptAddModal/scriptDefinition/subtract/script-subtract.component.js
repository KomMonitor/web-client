"use strict";
angular.module('scriptSubtract').component('scriptSubtract', {
    templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/scriptDefinition/subtract/script-subtract.template.html",
    controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', '__env', '$timeout',
        function ScriptSubtractontroller(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $timeout) {
            this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
            this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;
            // initialize any adminLTE box widgets
            $('.box').boxWidget();
            $scope.pathToScriptResource = "./kommonitor-script-resources/km_indicator_subtract.js";
            $scope.tmpIndicatorSelection = undefined;
            $scope.tmpGeoresourceSelection = undefined;
            $scope.baseIndicators = [];
            $scope.refIndicatorSelection = undefined;
            $scope.refIndicatorSelection_old = undefined;
            $scope.parameterName_computationIndicators = "COMPUTATION_ID";
            $scope.parameterDescription_computationIndicators = "Komma-separierte Liste aller Subtrahenden Indikatoren-IDs.";
            $scope.parameterDefaultValue_computationIndicators = undefined;
            $scope.parameterNumericMinValue_computationIndicators = 0;
            $scope.parameterNumericMaxValue_computationIndicators = 1;
            $scope.parameterName_referenceIndicator = "REFERENCE_ID";
            $scope.parameterDescription_referenceIndicator = "Indikatoren-ID des Minuenden.";
            $scope.parameterDefaultValue_referenceIndicator = undefined;
            $scope.parameterNumericMinValue_referenceIndicator = 0;
            $scope.parameterNumericMaxValue_referenceIndicator = 1;
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
            $scope.onChangeReferenceIndicator = function (refIndicatorSelection) {
                // remove previous refIndicator from requiredIndicators and add new one
                kommonitorScriptHelperService.removeBaseIndicator($scope.refIndicatorSelection_old);
                kommonitorScriptHelperService.addBaseIndicator(refIndicatorSelection);
                $scope.refIndicatorSelection_old = refIndicatorSelection;
                //reset the one and only parameter in this case each time a base indicator is added
                $scope.resetRefIndicatorParameter();
                $scope.resetComputationFormulaAndLegend();
            };
            $scope.resetScriptParameter_computationIndicators = function (requiredIndicatorsArray) {
                var result = "";
                for (let index = 0; index < requiredIndicatorsArray.length; index++) {
                    const indicatorMetadata = requiredIndicatorsArray[index];
                    result += indicatorMetadata.indicatorId;
                    if (index < requiredIndicatorsArray.length - 1) {
                        result += ",";
                    }
                }
                return result;
            };
            $scope.resetComputationIndicatorParameter = function () {
                kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_computationIndicators);
                $scope.parameterDefaultValue_computationIndicators = $scope.resetScriptParameter_computationIndicators($scope.baseIndicators);
                kommonitorScriptHelperService.addScriptParameter($scope.parameterName_computationIndicators, $scope.parameterDescription_computationIndicators, $scope.parameterDataType, $scope.parameterDefaultValue_computationIndicators, $scope.parameterNumericMinValue_computationIndicators, $scope.parameterNumericMaxValue_computationIndicators);
            };
            $scope.resetRefIndicatorParameter = function () {
                kommonitorScriptHelperService.removeScriptParameter_byName($scope.parameterName_referenceIndicator);
                $scope.parameterDefaultValue_referenceIndicator = $scope.refIndicatorSelection.indicatorId;
                kommonitorScriptHelperService.addScriptParameter($scope.parameterName_referenceIndicator, $scope.parameterDescription_referenceIndicator, $scope.parameterDataType, $scope.parameterDefaultValue_referenceIndicator, $scope.parameterNumericMinValue_referenceIndicator, $scope.parameterNumericMaxValue_referenceIndicator);
            };
            $scope.resetComputationFormulaAndLegend = function () {
                kommonitorScriptHelperService.scriptFormulaHTML = "";
                var formulaHTML = "<b>Berechnung gem&auml;&szlig; Formel<br/>";
                var legendItemsHTML = "<b>Legende zur Formel</b><br/>";
                // referenceIndicator
                formulaHTML += "$ I_{ref} - (";
                legendItemsHTML += "$ I_{ref} $: " + $scope.refIndicatorSelection.indicatorName + " [" + $scope.refIndicatorSelection.unit + "]" + "<br/>";
                // baseIndicators / computationIndicators
                for (let index = 0; index < $scope.baseIndicators.length; index++) {
                    const indicatorMetadata = $scope.baseIndicators[index];
                    var letterValue = kommonitorScriptHelperService.getAlphabetLetterFromNumber(index);
                    // we can use TEX code as we use MathJax library
                    formulaHTML += letterValue;
                    legendItemsHTML += "$" + letterValue + "$: " + indicatorMetadata.indicatorName + " [" + indicatorMetadata.unit + "]";
                    if (index < $scope.baseIndicators.length - 1) {
                        formulaHTML += " + ";
                        legendItemsHTML += "<br/>";
                    }
                }
                formulaHTML += ") $";
                kommonitorScriptHelperService.scriptFormulaHTML = formulaHTML + "<br/><br/>" + legendItemsHTML;
            };
            $scope.addBaseIndicator = function (tmpIndicatorSelection) {
                kommonitorScriptHelperService.addBaseIndicator(tmpIndicatorSelection);
                $scope.baseIndicators.push(tmpIndicatorSelection);
                //reset the one and only parameter in this case each time a base indicator is added
                $scope.resetComputationIndicatorParameter();
                $scope.resetComputationFormulaAndLegend();
                setTimeout(() => {
                    $scope.$digest();
                });
            };
            $scope.removeBaseIndicator = function (baseIndicator) {
                kommonitorScriptHelperService.removeBaseIndicator(baseIndicator);
                var i;
                for (let index = 0; index < $scope.baseIndicators.length; index++) {
                    const element = $scope.baseIndicators[index];
                    if (baseIndicator.indicatorId == element.indicatorId) {
                        i = index;
                        break;
                    }
                }
                $scope.baseIndicators.splice(i, 1);
                //reset the one and only parameter in this case each time a base indicator is removed
                $scope.resetComputationIndicatorParameter();
                $scope.resetComputationFormulaAndLegend();
                setTimeout(() => {
                    $scope.$digest();
                });
            };
        }
    ]
});
//# sourceMappingURL=script-subtract.component.js.map