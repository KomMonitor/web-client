angular.module('scriptAddModal').component('scriptAddModal', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/scriptAddModal/script-add-modal.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorScriptHelperService', '$scope', '$rootScope', '$http', 
		'__env', '$timeout','kommonitorMultiStepFormHelperService',
		function ScriptAddModalAddModalController(kommonitorDataExchangeService, kommonitorScriptHelperService, 
			$scope, $rootScope, $http, __env, $timeout, kommonitorMultiStepFormHelperService) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;

			/*	POST BODY
				{
						"scriptCodeBase64": "scriptCodeBase64",
						"requiredIndicatorIds": [
							"requiredIndicatorIds",
							"requiredIndicatorIds"
						],
						"variableProcessParameters": [
							{
							"minParameterValueForNumericInputs": 6.027456183070403,
							"maxParameterValueForNumericInputs": 0.8008281904610115,
							"defaultValue": "defaultValue",
							"dataType": "string",
							"name": "name",
							"description": "description"
							},
							{
							"minParameterValueForNumericInputs": 6.027456183070403,
							"maxParameterValueForNumericInputs": 0.8008281904610115,
							"defaultValue": "defaultValue",
							"dataType": "string",
							"name": "name",
							"description": "description"
							}
						],
						"associatedIndicatorId": "associatedIndicatorId",
						"name": "name",
						"description": "description",
						"requiredGeoresourceIds": [
							"requiredGeoresourceIds",
							"requiredGeoresourceIds"
						]
						}
			*/

			$scope.datasetName = undefined;
			$scope.description = undefined;
			kommonitorScriptHelperService.targetIndicator = undefined;

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$scope.errorMessagePart_indicatorMetadata = undefined;

			$scope.loadingData = false;

			$scope.selectedScriptType = null;

			kommonitorScriptHelperService.scriptData = [];

			$scope.cronRegexPattern = String.raw`^((((\d+,)+\d+|(\d+(\/|-|#)\d+)|\d+L?|\*(\/\d+)?|L(-\d+)?|\?|[A-Z]{3}(-[A-Z]{3})?) ?){5,7})|(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)$`;
			$scope.cronInputMode = "interval";
			$scope.intervalUnit = "month";
			$scope.intervalValue = 3;
			$scope.everyFirstInUnit = "month";

			$scope.monthOptions = [];
			for (var i = 1; i <= 12; i++) {
				$scope.monthOptions.push(i);
			}
			$scope.dayOfMonthOptions = [];
			for (var i = 1; i <= 30; i++) {
				$scope.dayOfMonthOptions.push(i);
			}
			$scope.dayOfWeekOptions = [
				{ number: 0, name: 'Sonntag' },
				{ number: 1, name: 'Montag' },
				{ number: 2, name: 'Dienstag' },
				{ number: 3, name: 'Mittwoch' },
				{ number: 4, name: 'Donnerstag' },
				{ number: 5, name: 'Freitag' },
				{ number: 6, name: 'Samstag' }
			];
			$scope.selectedDayOfWeek = { number: 0 };

			$scope.hourOptions = [];
			for (var i = 0; i <= 23; i++) {
				$scope.hourOptions.push(i);
			}
			$scope.minuteOptions = [];
			for (var i = 0; i <= 59; i++) {
				$scope.minuteOptions.push(i);
			}

			$scope.selectedMonth = 1;
			$scope.selectedDayOfMonth = 1;
			$scope.selectedDayOfWeek = { number: 0 };
			$scope.selectedHour = 0;
			$scope.selectedMinute = 0;

			kommonitorScriptHelperService.useManualCronPattern = false;
			$scope.manualCron = "";

			$scope.init = async function () {
				$scope.allScriptTypeOptions = await kommonitorScriptHelperService.getScriptTypes();
				kommonitorScriptHelperService.availableScriptTypeOptions = $scope.allScriptTypeOptions.filter((script) => (script.id.startsWith("KmIndicator") || script.id.startsWith("KmGeoresource")));
			}

			$scope.init();

			$scope.resetScriptAddForm = function () {

				$scope.successMessagePart = undefined;
				$scope.errorMessagePart = undefined;
				$scope.errorMessagePart_indicatorMetadata = undefined;

				$scope.datasetName = undefined;
				$scope.description = undefined;
				kommonitorScriptHelperService.targetIndicator = undefined;

				kommonitorScriptHelperService.reset();

				$scope.init();

				setTimeout(() => {
					$scope.$digest();
				}, 1000);
			};

			$scope.changeScriptTypeFilter = function (value) {
				if (value == 'all') {
					kommonitorScriptHelperService.availableScriptTypeOptions = $scope.allScriptTypeOptions.filter((script) => (script.id.startsWith("KmIndicator") || script.id.startsWith("KmGeoresource")));
				}
				else if(value == 'indicator') {
					kommonitorScriptHelperService.availableScriptTypeOptions = $scope.allScriptTypeOptions.filter((script) => script.id.startsWith("KmIndicator"));
				}
				else if(value == 'georesource') {
					kommonitorScriptHelperService.availableScriptTypeOptions = $scope.allScriptTypeOptions.filter((script) => script.id.startsWith("KmGeoresource"));
				}
			}

			$scope.onScriptTypeChanged = function () {
				if ($scope.selectedScriptType) {
					kommonitorScriptHelperService.getProcessDescription($scope.selectedScriptType.id);
				}
			}

			$scope.addScript = async function () {

				$timeout(function () {
					$scope.loadingData = true;
				});

				$scope.successMessagePart = undefined;
				$scope.errorMessagePart = undefined;
				$scope.errorMessagePart_indicatorMetadata = undefined;


				// TODO Create and perform POST Request with loading screen

				try {
					var addScriptResponse = await kommonitorScriptHelperService.postNewScript($scope.selectedScriptType.id);					

					let scheduleId = addScriptResponse.scheduleID;
					$rootScope.$broadcast("refreshScriptOverviewTable", "add", scheduleId);
					if(kommonitorScriptHelperService.scriptFormulaHTML_overwriteTargetIndicatorMethod){
						try {
							await kommonitorScriptHelperService.replaceMethodMetadataForTargetIndicator(kommonitorScriptHelperService.targetIndicator);
							kommonitorScriptHelperService.scriptFormulaHTML_successToastDisplay = kommonitorScriptHelperService.scriptFormulaHTML;
							$("#indicatorMetadataEditSuccessAlert").show();
						} catch (error) {
							if (error.data) {
								$scope.errorMessagePart_indicatorMetadata = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
							}
							else {
								$scope.errorMessagePart_indicatorMetadata = kommonitorDataExchangeService.syntaxHighlightJSON(error);
							}
		
							$("#indicatorMetadataEditErrorAlert").show();
							$scope.loadingData = false;
		
							setTimeout(() => {
								$scope.loadingData = false;
								$scope.$digest();
							}, 1000);
						}
						
					}				

					// refresh all admin dashboard diagrams due to modified metadata
					$rootScope.$broadcast("refreshAdminDashboardDiagrams");

					$("#scriptAddSuccessAlert").show();
					$scope.loadingData = false;

					setTimeout(() => {
						$scope.loadingData = false;
						$scope.$digest();
					}, 1000);
				} catch (error) {
					if (error.data) {
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
					}
					else {
						$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
					}

					$("#scriptAddErrorAlert").show();
					$scope.loadingData = false;

					setTimeout(() => {
						$scope.loadingData = false;
						$scope.$digest();
					}, 1000);
				}

			};

			$scope.resetApplicableDates = function () {
				if($scope.selectedScriptType.id.startsWith("KmIndicator")){
					let allIndicatorDates = [];
					if (kommonitorScriptHelperService.processParameters.computation_id){
						allIndicatorDates.push(kommonitorDataExchangeService.getIndicatorMetadataById(kommonitorScriptHelperService.processParameters.computation_id).applicableDates);
					}
					if (kommonitorScriptHelperService.processParameters.computation_ids){
						for (let id of kommonitorScriptHelperService.processParameters.computation_ids) {
							allIndicatorDates.push(kommonitorDataExchangeService.getIndicatorMetadataById(id).applicableDates);
						}
					}
					if(kommonitorScriptHelperService.processParameters.computation_id_denominator){
						allIndicatorDates.push(kommonitorDataExchangeService.getIndicatorMetadataById(kommonitorScriptHelperService.processParameters.computation_id_denominator).applicableDates);
					}
					if(kommonitorScriptHelperService.processParameters.computation_id_numerator){
						allIndicatorDates.push(kommonitorDataExchangeService.getIndicatorMetadataById(kommonitorScriptHelperService.processParameters.computation_id_numerator).applicableDates);
					}
					if(kommonitorScriptHelperService.processParameters.reference_id){
						allIndicatorDates.push(kommonitorScriptHelperService.refIndicator.applicableDates);
					}
					let applicableDates = allIndicatorDates[0].filter(date =>
						allIndicatorDates.every(singleIndicatorDates => singleIndicatorDates.includes(date))
					);
					$scope.applicableDates = applicableDates;
				}
				if($scope.selectedScriptType.id.startsWith("KmGeoresource")){
					$scope.applicableDates = kommonitorScriptHelperService.georesource.availablePeriodsOfValidity.map(obj => obj["startDate"]);
				}
				if(kommonitorScriptHelperService.processParameters.target_time) {
					kommonitorScriptHelperService.processParameters.target_time.excludeDates = [];
					kommonitorScriptHelperService.processParameters.target_time.includeDates = [];
				}
			}

			$scope.applicableDates = [];

			$scope.resetSelectableSpatialUnits = function () {
				$scope.selectableSpatialUnits = kommonitorDataExchangeService.availableSpatialUnits;
				kommonitorScriptHelperService.processParameters.target_spatial_units = [];
			}

			$scope.selectableSpatialUnits = [];

			$scope.onTargetIndicatorChanged = function (){
				kommonitorScriptHelperService.processParameters.target_indicator_id = kommonitorScriptHelperService.targetIndicator.indicatorId;
				$scope.resetSelectableSpatialUnits();
			}

			$scope.updateCron = function() {
				if (kommonitorScriptHelperService.useManualCronPattern) {
					if(kommonitorScriptHelperService.processParameters.execution_interval) {
						kommonitorScriptHelperService.processParameters.execution_interval.cron = $scope.manualCron;
					}
					return;
				} 

				let cron = "";
				let min = "*", hour = "*", day = "*", month = "*", weekday = "*";

				if($scope.intervalUnit == "week" && $scope.cronInputMode == "interval") {
					$scope.intervalUnit = "month";
				}

				if (["hour", "day", "week", "month", "year"].includes($scope.intervalUnit)) {
					min = $scope.selectedMinute;
				}
				if (["day", "week", "month", "year"].includes($scope.intervalUnit)) {
					hour = $scope.selectedHour;
				}
				if ($scope.intervalUnit === "week") {
					weekday = $scope.selectedDayOfWeek.number;
				}
				if (["month", "year"].includes($scope.intervalUnit)) {
					day = $scope.selectedDayOfMonth;
				}
				if ($scope.intervalUnit === "year") {
					month = $scope.selectedMonth;
				}
				else if ($scope.cronInputMode == "once") {
					cron = `${min} ${hour} ${day} ${month} ${weekday}`;
				} 
				else if ($scope.cronInputMode == "interval"){
					switch ($scope.intervalUnit) {
						case "minute": cron = `*/${$scope.intervalValue} * * * *`; break;
						case "hour":   cron = `${min} */${$scope.intervalValue} * * *`; break;
						case "day":    cron = `${min} ${hour} */${$scope.intervalValue} * *`; break;
						case "month":  cron = `${min} ${hour} ${day} */${$scope.intervalValue} *`; break;
						case "year":   cron = `${min} ${hour} ${day} ${month} */${$scope.intervalValue}`; break;
					}
				}
				else if ($scope.cronInputMode == "everyFirst") {
					if ($scope.everyFirstInUnit == "year") {
						cron = `${min} ${hour} 1-7 1 */7`
					}
					if ($scope.everyFirstInUnit == "month") {
						cron = `${min} ${hour} 1-7 * */7`
					}
				}

				$scope.manualCron = cron;
				if(kommonitorScriptHelperService.processParameters.execution_interval) {
					kommonitorScriptHelperService.processParameters.execution_interval.cron = cron;
				}
			}

			$rootScope.$on("refIndicatorChanged", function () {
				$scope.resetApplicableDates();
			});

			$rootScope.$on("baseIndicatorChanged", function () {
				$scope.resetApplicableDates();
			});

			$rootScope.$on("compIndicatorChanged", function () {
				$scope.resetApplicableDates();
			});

			$rootScope.$on("georesourceChanged", function () {
				$scope.resetApplicableDates();
			})

			$rootScope.$on("processDescriptionFetched", function (event) {

				// reduce "name" "value" pairs
				kommonitorScriptHelperService.scriptData.additional_parameters.parameters = kommonitorScriptHelperService.scriptData.additional_parameters.parameters.reduce((acc, param) => {
					acc[param.name] = param.value;
					return acc;
				}, {});

				kommonitorScriptHelperService.scriptData.additionalParameters = kommonitorScriptHelperService.scriptData.additional_parameters;
				kommonitorScriptHelperService.scriptData.additional_parameters = undefined;
				kommonitorScriptHelperService.scriptData.additionalParameters.parameters.kommonitorUiParams = kommonitorScriptHelperService.scriptData.additionalParameters.parameters.kommonitorUiParams[0];

				var staticInputsData = {
					execution_interval: kommonitorScriptHelperService.processParameters.execution_interval,
					target_indicator_id: kommonitorScriptHelperService.processParameters.target_indicator_id,
					target_spatial_units: kommonitorScriptHelperService.processParameters.target_spatial_units,
					target_time: kommonitorScriptHelperService.processParameters.target_time
				};

				var scriptDataInputDefaults = Object.keys(kommonitorScriptHelperService.scriptData.inputs).reduce((acc, key) => {
					acc[key] = kommonitorScriptHelperService.scriptData.inputs[key].schema.default;
					return acc;
				}, {});

				kommonitorScriptHelperService.processParameters = {...scriptDataInputDefaults, ...staticInputsData};
				kommonitorScriptHelperService.processParameters.execution_interval = scriptDataInputDefaults.execution_interval ? scriptDataInputDefaults.execution_interval : staticInputsData.execution_interval;
				kommonitorScriptHelperService.processParameters.target_time = scriptDataInputDefaults.target_time ? scriptDataInputDefaults.target_time : staticInputsData.target_time;

				// override default cron by value selected in UI
				$scope.updateCron();

				setTimeout(() => {
					$scope.$digest();
				}, 1000);
			})

			$scope.hideSuccessAlert = function () {
				$("#scriptAddSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function () {
				$("#scriptAddErrorAlert").hide();
			};

			$scope.hideSuccessAlert_indicatorMetadata = function () {
				$("#indicatorMetadataEditSuccessAlert").hide();
			};

			$scope.hideErrorAlert_indicatorMetadata = function () {
				$("#indicatorMetadataEditErrorAlert").hide();
			};

			kommonitorMultiStepFormHelperService.registerClickHandler("scriptAddForm");

		}
	]
});
