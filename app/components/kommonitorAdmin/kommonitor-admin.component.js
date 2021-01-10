angular
		.module('kommonitorAdmin')
		.component(
				'kommonitorAdmin',
				{
					templateUrl : "components/kommonitorAdmin/kommonitor-admin.template.html",
					controller : ['kommonitorDataExchangeService', '$location', "$rootScope", '$scope', function kommonitorAdminController(
							kommonitorDataExchangeService, $location, $rootScope, $scope) {

								this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

								this.selectedResourceType = 'spatialUnits';

								$scope.activeItemBackupId = "adminDashboardNavItem";

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
					  
								this.checkAuthorizationOnStartup_withoutKeycloak = function(){
									if (! kommonitorDataExchangeService.adminIsLoggedIn){
										// redirect to main page
										console.log("No Admin user is logged in - Prevent access to ADMIN panel");
										$location.path('/');
									}
								};

								this.init = function(){
									if(! kommonitorDataExchangeService.enableKeycloakSecurity){
										this.checkAuthorizationOnStartup_withoutKeycloak();
									}
									kommonitorDataExchangeService.fetchAllMetadata();
								};

								this.init();

								$scope.onClickGeodataAdminPanel = function(idOfNavBarItem){
									$scope.activeItemBackupId = idOfNavBarItem;
									$('.sidebar-menu li').removeClass("active");

									document.getElementById('adminGeodataWrapperNavItem').setAttribute("class", "active");
								};

								$scope.onClickConfigAdminPanel = function(idOfNavBarItem){
									$scope.activeItemBackupId = idOfNavBarItem;
									$('.sidebar-menu li').removeClass("active");

									document.getElementById('adminConfigWrapperNavItem').setAttribute("class", "active");
								};

								$scope.onClickOtherAdminPanel = function(idOfNavBarItem){
									$scope.activeItemBackupId = idOfNavBarItem;
									$('#adminGeodataWrapperNavItem ul li').removeClass("active");
									$('#adminConfigWrapperNavItem ul li').removeClass("active");
								};

								$scope.onClickGeodataWrapperItem = function(){

									// $('#adminGeodataWrapperNavItem').toggleClass("active");

									setTimeout(function(){
										if($scope.activeItemBackupId != 'adminSpatialUnitsNavItem' && $scope.activeItemBackupId != 'adminGeoresourcesNavItem' && $scope.activeItemBackupId != 'adminIndicatorsNavItem'){
											// $('#adminGeodataWrapperNavItem').toggleClass("active");
											$('#'+$scope.activeItemBackupId).addClass("active");
										}
									}, 40);
								};

								$scope.onClickConfigWrapperItem = function(){

									// $('#adminGeodataWrapperNavItem').toggleClass("active");

									setTimeout(function(){
										if($scope.activeItemBackupId != 'adminAppConfigNavItem' && $scope.activeItemBackupId != 'adminKeycloakConfigNavItem' && $scope.activeItemBackupId != 'adminControlsConfigNavItem'){
											// $('#adminGeodataWrapperNavItem').toggleClass("active");
											$('#'+$scope.activeItemBackupId).addClass("active");
										}
									}, 40);
								};								

					}
				]});
