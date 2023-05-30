angular
	.module('kommonitorClassification')
	.component(
			'kommonitorClassification',
			{
				templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorClassification/kommonitor-classification.template.html",
				controller : [ '$scope', '$rootScope', '$timeout', 'kommonitorVisualStyleHelperService', 'kommonitorDataExchangeService',
					function KommonitorClassification($scope, $rootScope, $timeout, kommonitorVisualStyleHelperService, kommonitorDataExchangeService) {
						this.kommonitorVisualStyleHelperServiceInstance = kommonitorVisualStyleHelperService;
						this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

						// set default values
						kommonitorVisualStyleHelperService.numClasses = 5;
						$scope.onChangeSelectedClassifyMethod = function () {
							console.log(kommonitorVisualStyleHelperService.classifyMethod)
							$rootScope.$broadcast("changeClassifyMethod", kommonitorVisualStyleHelperService.classifyMethod);
						} 

						$scope.onChangeNumberOfClasses = function () {
							$rootScope.$broadcast("changeNumClasses", kommonitorVisualStyleHelperService.numClasses);
						}

						$scope.onBreaksChanged = function () {
							kommonitorVisualStyleHelperService.manualBrew.breaks.sort(function(a, b) {
								return a - b;
							});
							$rootScope.$broadcast("changeBreaks", kommonitorVisualStyleHelperService.manualBrew.breaks);
						}
						
						$scope.onWholeTimeseriesClassificationCheckboxChanged = function () {
							$rootScope.$broadcast("restyleCurrentLayer", false);
						}
					}
				]
			}
		);