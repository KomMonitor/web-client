angular.module('wpsExecuteInput', []);

/**
 * a common serviceInstance that holds attributes and methods needed for
 * configuring execute inputs
 */
angular.module('wpsExecuteInput').service('wpsExecuteInputService',  function () {

    /*
     * execute lists
     */
    this.unconfiguredExecuteInputs;
    this.alreadyConfiguredExecuteInputs = [];

    this.selectedExecuteInput;

    /*
     * literalData
     */
    this.literalInputValue;

    /*
     * complexInput
     */
    this.selectedExecuteInputFormat;
    this.asReference = false;
    this.asFile = false;
    this.asDrawing = false;
    this.asComplex = false;
    this.complexPayload;

    /*
     * bbox input
     */
    this.selectedExecuteInputCrs;
    this.bboxLowerCorner;
    this.bboxUpperCorner;
    this.bboxAsGeoJSON;

    this.markInputAsConfigured = function (input) {
        /*
         * move the input with the fitting identifier from unconfigured input
         * list to configured.
         */
        /*
         * remove input
         */
        var index = undefined;
        var alreadyExists = false;

        for (var i = 0; i < this.unconfiguredExecuteInputs.length; i++) {
            var currentInput = this.unconfiguredExecuteInputs[i];

            if (currentInput.identifier === input.identifier) {
                index = i;
                alreadyExists = true;
                break;
            }
        }

        if (alreadyExists)
            this.unconfiguredExecuteInputs.splice(index, 1);

        /*
         * add input
         */
        index = undefined;
        alreadyExists = false;

        if (!this.alreadyConfiguredExecuteInputs)
            this.alreadyConfiguredExecuteInputs = [];

        for (var i = 0; i < this.alreadyConfiguredExecuteInputs.length; i++) {
            var currentInput = this.alreadyConfiguredExecuteInputs[i];

            if (currentInput.identifier === input.identifier) {
                index = i;
                alreadyExists = true;
                break;
            }
        }

        if (alreadyExists)
            this.alreadyConfiguredExecuteInputs.splice(index, 1);

        this.alreadyConfiguredExecuteInputs.push(input);
        
        /*
         * set selection to undefined as visual feedback (and prevent that the same 
         * input view is still shown)
         */
        this.selectedExecuteInput = undefined;
    };

    

    this.removeInputFromAlreadyDefinedInputs = function (input) {
        var index = undefined;

        for (var i = 0; i < this.alreadyConfiguredExecuteInputs.length; i++) {
            var currentInput = this.alreadyConfiguredExecuteInputs[i];

            if (currentInput.identifier === input.identifier) {
                index = i;
                break;
            }
        }

        this.alreadyConfiguredExecuteInputs.splice(index, 1);
    };

    this.addInputToUnconfiguredExecuteInputs = function (currentInput) {
        this.unconfiguredExecuteInputs.push(currentInput);
    };

    this.reset = function () {
        this.unconfiguredExecuteInputs = [];
        this.alreadyConfiguredExecuteInputs = [];

        this.selectedExecuteInput = undefined;

        /*
         * literalData
         */
        this.literalInputValue = undefined;

        /*
         * complexInput
         */
        this.selectedExecuteInputFormat = undefined;
        this.asReference = false;
        this.complexPayload = undefined;

        /*
         * bbox input
         */
        this.selectedExecuteInputCrs = undefined;
        this.bboxLowerCorner = undefined;
        this.bboxUpperCorner = undefined;
    };

});