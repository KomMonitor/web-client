angular.module('adminTopicsManagement').component('adminTopicsManagement', {
	templateUrl : "components/kommonitorAdmin/adminTopicsManagement/admin-topics-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function TopicsManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		// initialize any adminLTE box widgets
	  $('.box').boxWidget();

		$(document).ready(function() {
			setTimeout(function(){
				$('.list-group-item').on('click', function() {
			    $('.glyphicon', this)
			      .toggleClass('glyphicon-chevron-right')
			      .toggleClass('glyphicon-chevron-down');
			  });
			}, 500);
		});

	}
]});
