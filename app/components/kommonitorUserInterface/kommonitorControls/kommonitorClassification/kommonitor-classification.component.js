angular
	.module('kommonitorClassification')
	.component(
			'kommonitorClassification',
			{
				templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorClassification/kommonitor-classification.template.html",
				controller : [ '$scope', '$rootScope', 'kommonitorVisualStyleHelperService', 'kommonitorDataExchangeService',
					function KommonitorClassification($scope, $rootScope, kommonitorVisualStyleHelperService, kommonitorDataExchangeService) {
						this.kommonitorVisualStyleHelperServiceInstance = kommonitorVisualStyleHelperService;
						this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

						$scope.onChangeSelectedClassifyMethod = function () {
							console.log(kommonitorVisualStyleHelperService.classifyMethod)
							$rootScope.$broadcast("changeClassifyMethod", kommonitorVisualStyleHelperService.classifyMethod);
						} 

						$scope.onChangeNumberOfClasses = function () {
							$rootScope.$broadcast("changeNumClasses", kommonitorVisualStyleHelperService.numClasses);
						}

						$scope.onWholeTimeseriesClassificationCheckboxChanged = function () {
							$rootScope.$broadcast("restyleCurrentLayer", false);
						}
					}
				]
			}
		);