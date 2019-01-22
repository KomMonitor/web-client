angular
		.module('kommonitorReachability')
		.component(
				'kommonitorReachability',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/kommonitor-reachability.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : ['$scope', '$rootScope', 'kommonitorMapService', 'kommonitorDataExchangeService', '__env', function kommonitorReachabilityController($scope, $rootScope, kommonitorMapService, kommonitorDataExchangeService, __env) {

							const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
							this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
							this.kommonitorMapServiceInstance = kommonitorMapService;
							var numberOfDecimals = __env.numberOfDecimals;


					}]
				});
