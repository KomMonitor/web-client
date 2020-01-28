angular.module('kommonitorDiagramHelper', ['kommonitorMap']);

/**
 * a common serviceInstance that holds all needed properties for a WPS service.
 *
 * This service represents a shared object ´which is used across the different
 * application tabs/components like Setup, Capabilities, Execute etc.
 *
 * This way, one single service instance can be used to easily share values and
 * parameters for each WPS operation represented by different Angular components
 */
angular
		.module('kommonitorDiagramHelper', ['datatables'])
		.service(
				'kommonitorDiagramHelperService', ['$rootScope', '$timeout', 'kommonitorMapService', '$http', '__env', 'DTOptionsBuilder', '$q',
				function($rootScope, $timeout,
						kommonitorMapService, $http, __env, DTOptionsBuilder, $q) {

              this.buildBarChartOptions = function(){

              };

				}]);
