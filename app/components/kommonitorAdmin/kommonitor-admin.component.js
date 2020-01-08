angular
		.module('kommonitorAdmin')
		.component(
				'kommonitorAdmin',
				{
					templateUrl : "components/kommonitorAdmin/kommonitor-admin.template.html",
					controller : ['kommonitorDataExchangeService', '$location', "$rootScope", '$scope', function kommonitorAdminController(
							kommonitorDataExchangeService, $location, $rootScope, $scope) {

								this.selectedResourceType = 'spatialUnits';

								// initialize any adminLTE box widgets
							  $('.box').boxWidget();

								// $rootScope.$on("$locationChangeStart", function(event){
			          //   if (! kommonitorDataExchangeService.adminIsLoggedIn){
								// 		// redirect to main page
								// 		console.log("No Admin user is logged in - Prevent access to ADMIN panel");
								// 		$location.path('/');
								// 	}
								//
			          // });

								this.checkAuthorizationOnStartup = function(){
									if (! kommonitorDataExchangeService.adminIsLoggedIn){
										// redirect to main page
										console.log("No Admin user is logged in - Prevent access to ADMIN panel");
										$location.path('/');
									}
								};

								this.init = function(){
									this.checkAuthorizationOnStartup();
									kommonitorDataExchangeService.fetchAllMetadata();
								};

								this.init();

								$scope.onClickGeodataAdminPanel = function(){
									$('.sidebar-menu li').removeClass("active");

									document.getElementById('geodataAdminListItem').setAttribute("class", "active");
								};

								$scope.onClickOtherAdminPanel = function(){
									$('#geodataAdminListItem ul li').removeClass("active");
								};

								// this.onClickDataManagement = function(resourceType){
								// 	this.selectedResourceType = resourceType;
								//
								// 	document.getElementById('geodataAdminListItem').setAttribute("class", "active");
								//
								// 	switch(resourceType) {
								// 	    case 'spatialUnits':
								// 					document.getElementById('spatialUnitManagement').setAttribute("class", "active");
								// 					document.getElementById('georesourceManagement').setAttribute("class", "");
								// 					document.getElementById('indicatorManagement').setAttribute("class", "");
								// 					document.getElementById('scriptManagement').setAttribute("class", "");
								// 	        break;
								// 	    case 'georesources':
								// 					document.getElementById('spatialUnitManagement').setAttribute("class", "");
								// 					document.getElementById('georesourceManagement').setAttribute("class", "active");
								// 					document.getElementById('indicatorManagement').setAttribute("class", "");
								// 					document.getElementById('scriptManagement').setAttribute("class", "");
								// 	        break;
								// 			case 'indicators':
								// 					document.getElementById('spatialUnitManagement').setAttribute("class", "");
								// 					document.getElementById('georesourceManagement').setAttribute("class", "");
								// 					document.getElementById('indicatorManagement').setAttribute("class", "active");
								// 					document.getElementById('scriptManagement').setAttribute("class", "");
								// 		      break;
								// 			case 'scripts':
								// 					document.getElementById('spatialUnitManagement').setAttribute("class", "");
								// 					document.getElementById('georesourceManagement').setAttribute("class", "");
								// 					document.getElementById('indicatorManagement').setAttribute("class", "");
								// 					document.getElementById('scriptManagement').setAttribute("class", "active");
								// 					break;
								// 	    default:
								// 					document.getElementById('spatialUnitManagement').setAttribute("class", "active");
								// 					document.getElementById('georesourceManagement').setAttribute("class", "");
								// 					document.getElementById('indicatorManagement').setAttribute("class", "");
								// 	}
								// };

					}
				]});
