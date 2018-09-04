angular
        .module('wpsExecuteSetupInputs')
        .component(
                'wpsExecuteSetupInputs',
                {
                    templateUrl: "components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteSetupRequest/wpsExecuteSetupInputs/wps-execute-setup-inputs.template.html",
                    controller: [
                        '$rootScope',
                        '$scope',
                        'wpsExecuteInputService',
                        'wpsPropertiesService',
                        'wpsFormControlService',
                        'wpsMapService',
                        'wpsGeometricOutputService',
                        function WpsExecuteSetupInputsController(
                                $rootScope, $scope,
                                wpsExecuteInputService,
                                wpsPropertiesService,
                                wpsFormControlService,
                                wpsMapService,
                                wpsGeometricOutputService) {
                            /*
                             * reference to wpsPropertiesService instances
                             */
                            this.wpsExecuteInputServiceInstance = wpsExecuteInputService;
                            this.wpsPropertiesServiceInstance = wpsPropertiesService;
                            this.wpsFormControlServiceInstance = wpsFormControlService;
                            this.wpsGeometricOutputServiceInstance = wpsGeometricOutputService;
                            this.wpsMapServiceInstance = wpsMapService;

                            // controller layout items;
                            this.formData = {};
                            this.formData.complexDataInput = "drawing"; // start drawing option by default
                            this.formData.bboxDataInput = "drawing"; // start corners option by default
                            this.mimeTypeSelection = "";
                            $scope.geoJsonSelected = false;

                            this.onChangeExecuteInput = function (input) {
                                this.wpsExecuteInputServiceInstance.selectedExecuteInput = input;
                                this.wpsFormControlServiceInstance.isRemoveInputButtonDisabled = true;

                                resetAllInputForms();
                            };

                            this.addLiteralInput = function () {
                                var selectedInput = this.wpsExecuteInputServiceInstance.selectedExecuteInput;
                                this.wpsPropertiesServiceInstance.addLiteralInput(selectedInput);

                                this.wpsExecuteInputServiceInstance.markInputAsConfigured(selectedInput);

                                resetLiteralInputForm();
                            };

                            var resetLiteralInputForm = function () {

                                wpsExecuteInputService.literalInputValue = undefined;
                            };

                            this.addComplexInput = function () {

                                var selectedInput = this.wpsExecuteInputServiceInstance.selectedExecuteInput;
                                this.wpsPropertiesServiceInstance.addComplexInput(selectedInput);

                                this.wpsExecuteInputServiceInstance.markInputAsConfigured(selectedInput);

                                resetComplexInputForm();
                            };

                            var resetComplexInputForm = function () {
                                wpsExecuteInputService.selectedExecuteInputFormat = undefined;
                                wpsExecuteInputService.asReference = false;
                                wpsExecuteInputService.complexPayload = undefined;

                                $scope.geoJsonSelected = false;
                                //disable drawing tools
                                $rootScope.$broadcast('set-complex-data-map-input-enabled', {'enabled': false});

                                try {
                                    //clear draw layers if available
                                    $rootScope.$broadcast('clear-draw-layers', {});
                                } catch (e) {
                                    console.log(e);
                                }
                            };

                            this.addBoundingBoxInput = function () {
                                var selectedInput = this.wpsExecuteInputServiceInstance.selectedExecuteInput;
                                this.wpsPropertiesServiceInstance.addBoundingBoxInput(selectedInput);

                                this.wpsExecuteInputServiceInstance.markInputAsConfigured(selectedInput);

                                resetBoundingBoxInputForm();
                            };

                            var resetBoundingBoxInputForm = function () {
                                wpsExecuteInputService.selectedExecuteInputCrs = undefined;
                                wpsExecuteInputService.bboxLowerCorner = undefined;
                                wpsExecuteInputService.bboxUpperCorner = undefined;

                                //disable drawing tools
                                $rootScope.$broadcast('set-bbox-data-map-input-enabled', {'enabled': false});

                                try {
                                    //clear draw layers if available
                                    $rootScope.$broadcast('clear-draw-layers', {});
                                } catch (e) {
                                    console.log(e);
                                }
                            };

                            var resetAllInputForms = function () {
                                resetLiteralInputForm();
                                resetComplexInputForm();
                                resetBoundingBoxInputForm();
                            };

                            /**
                             * delete a specific overlay for specific input identifier
                             */
                            $scope.$on('reset-all-input-forms', function (event, args) {
                                console.log("reset-all-input-forms has been called.");

                                resetAllInputForms();
                            });

                            this.onChangeAlreadyDefinedExecuteInput = function () {
                                /*
                                 * user selected an already defined input
                                 * 
                                 * now identify it, show the corresponding form 
                                 * and fill the form elements with the defined values!
                                 */
                                var selectedInput = this.wpsExecuteInputServiceInstance.selectedExecuteInput;

                                var definedInput = this.getDefinedInput(selectedInput, this.wpsPropertiesServiceInstance.executeRequest.inputs);

                                /*
                                 * depending on the type of the definedInput 
                                 * we have to fill in a different form
                                 * 
                                 * type may be "literal", "complex", "bbox" 
                                 * according to InputGenerator-class from wps-js-lib library
                                 */
                                var type = definedInput.type;

                                switch (type) {

                                    case "literal":
                                        this.fillLiteralInputForm(definedInput);
                                        break;

                                    case "complex":
                                        this.fillComplexInputForm(definedInput);
                                        break;

                                    case "bbox":
                                        this.fillBoundingBoxInputForm(definedInput);

                                }
                                
                                //disable drawing tools
                                $rootScope.$broadcast('set-complex-data-map-input-enabled', {'enabled': false});


                                /*
                                 * enable removeButton
                                 */
                                this.wpsFormControlServiceInstance.isRemoveInputButtonDisabled = false;

                                /*
                                 * if it is a GeoJSON input, then extract the geometry and place it on map!
                                 */

                                var inputMimeType = definedInput.mimeType;

                                if (wpsGeometricOutputService.isGeoJSON_mimeType(inputMimeType)) {
                                    console.log("GeoJSON geometry will be added to leaflet-draw layer");

                                    var geoJSON_asString = definedInput.complexPayload;

                                    var geoJSON_asObject = JSON.parse(geoJSON_asString);
                                    $rootScope.$broadcast('add-geometry-to-leaflet-draw-from-geojson-input', {'geoJSON': geoJSON_asObject});
                                }
                            };


                            this.fillLiteralInputForm = function (literalInput) {
                                this.wpsExecuteInputServiceInstance.literalInputValue = literalInput.value;
                            };

                            this.fillBoundingBoxInputForm = function (bboxInput) {
                                this.wpsExecuteInputServiceInstance.selectedExecuteInputCrs = bboxInput.crs;
                                this.wpsExecuteInputServiceInstance.bboxLowerCorner = bboxInput.lowerCorner;
                                this.wpsExecuteInputServiceInstance.bboxUpperCorner = bboxInput.upperCorner;
                            };

                            this.fillComplexInputForm = function (complexInput) {

                                this.wpsExecuteInputServiceInstance.asReference = complexInput.asReference;

                                this.wpsExecuteInputServiceInstance.asFile = complexInput.asFile;

                                this.wpsExecuteInputServiceInstance.complexPayload = complexInput.complexPayload;

                                this.wpsExecuteInputServiceInstance.selectedExecuteInputFormat = this.getSelectedExecuteInputFormatcomplexInput(complexInput.mimeType, this.wpsExecuteInputServiceInstance.selectedExecuteInput.complexData.formats);

                                if (this.wpsExecuteInputServiceInstance.selectedExecuteInputFormat.mimeType === 'application/vnd.geo+json') {
                                    $scope.geoJsonSelected = true;
                                    $rootScope.$broadcast('set-complex-data-map-input-enabled', {'enabled': true});
                                }

                            };

                            this.getSelectedExecuteInputFormatcomplexInput = function (mimeType, formatsList) {
                                var index;

                                for (var i = 0; i < formatsList.length; i++) {
                                    var currentFormat = formatsList[i];

                                    /*
                                     * some element must have the same identifier
                                     */
                                    if (mimeType === currentFormat.mimeType) {
                                        index = i;
                                        break;
                                    }
                                }

                                return formatsList[index];
                            };

                            this.getDefinedInput = function (selectedInput, definedInputsList) {
                                var id = selectedInput.identifier;
                                var index;

                                for (var i = 0; i < definedInputsList.length; i++) {
                                    var currentDefinedInput = definedInputsList[i];

                                    /*
                                     * some element must have the same identifier
                                     */
                                    if (id === currentDefinedInput.identifier) {
                                        index = i;
                                        break;
                                    }
                                }

                                return definedInputsList[index];
                            };

                            this.removeAlreadyDefinedInput = function () {
                                /*
                                 * current input from list of already
                                 * defined inputs as well as from execute
                                 * request object 
                                 * 
                                 * and add it to list of not
                                 * defined inputs
                                 */
                                var currentInput = this.wpsExecuteInputServiceInstance.selectedExecuteInput;

                                this.wpsPropertiesServiceInstance.removeAlreadyExistingInputWithSameIdentifier(currentInput);

                                this.wpsExecuteInputServiceInstance.removeInputFromAlreadyDefinedInputs(currentInput);

                                this.wpsExecuteInputServiceInstance.addInputToUnconfiguredExecuteInputs(currentInput);

                                //remove drawn input layer from map
                                $rootScope.$broadcast('delete-overlay-for-input', {'inputIdentifier': currentInput.identifier});

                                /*
                                 * disable removeButton
                                 */
                                this.wpsFormControlServiceInstance.isRemoveInputButtonDisabled = true;

                                resetAllInputForms();

                                /*
                                 * set selection to undefined as visual feedback (and prevent that the same 
                                 * input view is still shown)
                                 */
                                this.wpsExecuteInputServiceInstance.selectedExecuteInput = undefined;

                            };

                            this.complexInputChanged = function (inputSelection) {
                                switch (inputSelection) {
                                    case 'reference':
                                        console.log('reference selected');
                                        this.wpsExecuteInputServiceInstance.asReference = true;
                                        this.wpsExecuteInputServiceInstance.asComplex = false;
                                        this.wpsExecuteInputServiceInstance.asFile = false;
                                        $rootScope.$broadcast('set-complex-data-map-input-enabled', {'enabled': false});
                                        break;
                                    case 'file':
                                        this.wpsExecuteInputServiceInstance.asReference = false;
                                        this.wpsExecuteInputServiceInstance.asComplex = false;
                                        this.wpsExecuteInputServiceInstance.asFile = true;
                                        $rootScope.$broadcast('set-complex-data-map-input-enabled', {'enabled': false});
                                        console.log('file selected');
                                        break;
                                    case 'drawing':
                                        this.wpsExecuteInputServiceInstance.asReference = false;
                                        this.wpsExecuteInputServiceInstance.asComplex = false;
                                        this.wpsExecuteInputServiceInstance.asFile = false;
                                        $rootScope.$broadcast('set-complex-data-map-input-enabled', {'enabled': true});
                                        console.log('drawing selected');
                                        break;
                                    case 'complex':
                                        this.wpsExecuteInputServiceInstance.asReference = false;
                                        this.wpsExecuteInputServiceInstance.asComplex = true;
                                        this.wpsExecuteInputServiceInstance.asFile = false;
                                        $rootScope.$broadcast('set-complex-data-map-input-enabled', {'enabled': false});
                                        console.log('complex selected');
                                        break;
                                }
                            };

                            $scope.file_changed = function (element) {
                                $scope.$apply(function (scope) {
                                    console.log("file changed.");
                                    var geojsonfile = element.files[0];
                                    var reader = new FileReader();
                                    reader.onload = function (e) {
                                        console.log("file is loaded:");
                                        // handle onload
                                        var lines = e.target.result;
                                        var newArr = JSON.parse(lines);
                                        // add to complex payload:
                                        wpsExecuteInputService.complexPayload = JSON.stringify(newArr);
                                        console.log(wpsExecuteInputService.complexPayload);

                                        $scope.apply();

                                    };
                                    reader.readAsText(geojsonfile);
                                });
                            };

                            this.onCrsChanged = function () {
                                /*
                                 * check if create input via "drawing" on map is selected (which is selected by default)
                                 * 
                                 * if so then show input draw tools
                                 */
                                if (this.formData.bboxDataInput === "drawing")
                                    $rootScope.$broadcast('set-bbox-data-map-input-enabled', {'enabled': true});
                            };

                            this.bboxInputChanged = function (inputSelection) {
                                switch (inputSelection) {
                                    case 'drawing':
                                        $rootScope.$broadcast('set-bbox-data-map-input-enabled', {'enabled': true});
                                        console.log('drawing selected');
                                        break;
                                    case 'corners':
                                        $rootScope.$broadcast('set-bbox-data-map-input-enabled', {'enabled': false});
                                        console.log('corners selected');
                                        break;
                                }
                            };

                            this.complexDataOptionSelected = function () {
                                console.log("Format selected:");
                                console.log(this.wpsExecuteInputServiceInstance.selectedExecuteInputFormat);
                                mimeTypeSelection = this.wpsExecuteInputServiceInstance.selectedExecuteInputFormat.mimeType;
                                console.log(mimeTypeSelection);
                                if (mimeTypeSelection === "application/vnd.geo+json") {
                                    console.log("geojson selected.");
                                    $scope.geoJsonSelected = true;
                                    this.formData.complexDataInput = "drawing";
                                    $rootScope.$broadcast('set-complex-data-map-input-enabled', {'enabled': true});
                                } else {
                                    console.log("no geojson selected.");
                                    $scope.geoJsonSelected = false;
                                    $rootScope.$broadcast('set-complex-data-map-input-enabled', {'enabled': false});
                                }
                            };

                        }]
                });