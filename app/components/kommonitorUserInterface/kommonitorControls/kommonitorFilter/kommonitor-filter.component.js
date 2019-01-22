angular
		.module('kommonitorFilter')
		.component(
				'kommonitorFilter',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorFilter/kommonitor-filter.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : ['$scope', '$rootScope', 'kommonitorMapService', 'kommonitorDataExchangeService', '__env', function kommonitorFilterController($scope, $rootScope, kommonitorMapService, kommonitorDataExchangeService, __env) {

							const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
							this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
							this.kommonitorMapServiceInstance = kommonitorMapService;
							var numberOfDecimals = __env.numberOfDecimals;

							
					}]
				});
