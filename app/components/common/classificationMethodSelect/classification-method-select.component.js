angular
	.module('classificationMethodSelect')
	.component(
			'classificationMethodSelect',
			{
				templateUrl : "components/common/classificationMethodSelect/classification-method-select.template.html",
				bindings: {
					defaultMethodId: '@',
					onMethodSelected: '&'
				},
				controller : [ '$scope', '$rootScope', '$timeout', 'kommonitorVisualStyleHelperService', 'kommonitorDataExchangeService',
					function classificationMethodSelect($scope, $rootScope, $timeout, kommonitorVisualStyleHelperService, kommonitorDataExchangeService) {
						var ctrl = this;
						this.kommonitorVisualStyleHelperServiceInstance = kommonitorVisualStyleHelperService;
						this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

						$scope.showMethodSelection = false;

						ctrl.$onInit = function() {
							$scope.selectedMethod = $scope.getMethod(ctrl.defaultMethodId);
						};

						ctrl.$onChanges = function(changesObj) {
							$scope.selectedMethod = $scope.getMethod(ctrl.defaultMethodId);
						}

						ctrl.methodSelected = function(method) {
							$scope.showMethodSelection = false;
							$scope.selectedMethod = method;
							ctrl.onMethodSelected({method: method});
						};

						$scope.getMethod = function(methodId) {
							let methodToReturn;
							$scope.methods.forEach((method) => {
								if (method.id == methodId) {
									methodToReturn = method;
								}
							});
							return methodToReturn;
						}

						$scope.methods = [
							{
								name: 'Jenks', 
								id: 'jenks',
								imgPath: 'icons/classificationMethods/neu/jenks.svg',
								description: 'Bei Jenks (Natürliche Unterbrechungen) werden Klassengrenzen identifiziert, die ähnliche Werte möglichst gut gruppieren und zugleich die Unterschiede zwischen den Klassen maximieren.'
							},
							{
								name: 'Gleiches Intervall', 
								id: 'equal_interval', 
								imgPath: 'icons/classificationMethods/neu/gleichesIntervall.svg',
								description: 'Mit der Methode Gleiches Intervall wird der Bereich der Attributwerte in gleich große Teilbereiche unterteilt.'},
							{
								name: 'Quantile', 
								id: 'quantile', 
								imgPath: 'icons/classificationMethods/neu/quantile_grau.svg',
								description: 'Bei der Quantil-Methode enthält jede Klasse die gleiche Anzahl von Features.'},
							{
								name: 'Manuell', 
								id: 'manual', 
								imgPath: 'icons/classificationMethods/neu/manuell.svg',
								description: 'Bei der manuellen Klassifizierung lassen sich die Klassengrenzen nach Bedarf einstellen.'}
						];
          }
        ]
      }
    )