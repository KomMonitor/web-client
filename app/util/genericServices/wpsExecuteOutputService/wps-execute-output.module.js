angular.module('wpsExecuteOutput', []);

/**
 * a common serviceInstance that holds attributes and methods needed for
 * configuring execute outputs
 */
angular.module('wpsExecuteOutput').service('wpsExecuteOutputService', function() {

	/*
	 * execute lists
	 */
	this.unconfiguredExecuteOutputs = [];
	this.alreadyConfiguredExecuteOutputs = [];

	this.selectedExecuteOutput;

	this.selectedTransmissionMode;
	
	/*
	 * complexOutput
	 */
	this.selectedExecuteOutputFormat;

	this.markOutputAsConfigured = function(output) {
		/*
		 * move the output with the fitting identifier from unconfigured output
		 * list to configured.
		 */
		/*
		 * remove output
		 */
		var index = undefined;
		var alreadyExists = false;

		for (var i = 0; i < this.unconfiguredExecuteOutputs.length; i++) {
			var currentOutput = this.unconfiguredExecuteOutputs[i];

			if (currentOutput.identifier === output.identifier) {
				index = i;
				alreadyExists = true;
				break;
			}
		}

		if(alreadyExists)
			this.unconfiguredExecuteOutputs.splice(index, 1);

		/*
		 * add output
		 */
		index = undefined;
		alreadyExists = false;
		
		if(! this.alreadyConfiguredExecuteOutputs)
			this.alreadyConfiguredExecuteOutputs = [];
		
		for (var i = 0; i < this.alreadyConfiguredExecuteOutputs.length; i++) {
			var currentOutput = this.alreadyConfiguredExecuteOutputs[i];

			if (currentOutput.identifier === output.identifier) {
				index = i;
				alreadyExists = true;
				break;
			}
		}
		
		if(alreadyExists)
			this.alreadyConfiguredExecuteOutputs.splice(index, 1);
		
		this.alreadyConfiguredExecuteOutputs.push(output);
		
		/*
		 * set selection to undefined as visual feedback (and prevent that the same 
		 * output view is still shown)
		 */
		this.selectedExecuteOutput = undefined;
		this.selectedTransmissionMode = undefined;
	};
	
	this.removeOutputFromAlreadyDefinedOutputs = function(output){
		var index = undefined;
		
		for(var i=0; i<this.alreadyConfiguredExecuteOutputs.length; i++){
			var currentOutput = this.alreadyConfiguredExecuteOutputs[i];
			
			if(currentOutput.identifier === output.identifier){
				index = i;
				break;
			}
		}

			this.alreadyConfiguredExecuteOutputs.splice(index, 1);
	};
	
	this.addOutputToUnconfiguredExecuteOutputs = function(currentOutput){
		this.unconfiguredExecuteOutputs.push(currentOutput);
	};
	
	this.reset = function(){
		this.unconfiguredExecuteOutputs = [];
		this.alreadyConfiguredExecuteOutputs = [];

		this.selectedExecuteOutput = undefined;
		
		this.selectedTransmissionMode = undefined;
		
		/*
		 * complexOutput
		 */
		this.selectedExecuteOutputFormat = undefined;
	};

});