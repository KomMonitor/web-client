import { Component, OnInit } from '@angular/core';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

@Component({
  selector: 'user-interface-new',
  templateUrl: './user-interface.component.html',
  styleUrls: ['./user-interface.component.css']
})
export class UserInterfaceComponent implements OnInit {

  exchangeData!: DataExchange;
  userRoleInformation = {};
  userGroupInformation:any[] = [];

  showUserLogin = false;

  constructor(
    private dataExchangeService: DataExchangeService
  ) {
    this.exchangeData = this.dataExchangeService.pipedData;
  }

  ngOnInit(): void {


      /* todo
      // initialize application
			console.log("Initialize Application");
			if ($scope.authenticated) {
				console.log("Authetication successfull");
			}			

			await checkAuthentication(); */

      // todo
			//kommonitorShareHelperService.init();

			this.dataExchangeService.fetchAllMetadata();
			setTimeout(() => {
				this.prepUserInformation();
			}, 1000);
  }

  /* 
    // todo
    // Custom event to pass broadcast "updateLegendDisplay" towards new NG Legend Component, replace with NG2 variant once userInterface / mapComponent is migrated
    $scope.onUpdateLegendDisplayEmitterData = false;
    $rootScope.$on('updateLegendDisplay', function(event, containsZeroValues, containsNegativeValues, containsNoData, containsOutliers_high, containsOutliers_low, outliers_low, outliers_high, selectedDate) {
      
      let vars = {event, containsZeroValues, containsNegativeValues, containsNoData, containsOutliers_high, containsOutliers_low, outliers_low, outliers_high, selectedDate};
      $scope.onUpdateLegendDisplayEmitterData = vars;
    });*/


		prepUserInformation() {

			if(this.exchangeData.currentKomMonitorLoginRoleNames.length>0) {
			  this.exchangeData.currentKomMonitorLoginRoleNames.forEach(roles => {
				
				let key = roles.split('.')[0];
				let role = roles.split('.')[1];

				if(!this.userRoleInformation.hasOwnProperty(key)) {
				  this.userRoleInformation[key] = [];
				}
				
				this.userRoleInformation[key].push(role);

			  });
			}

			if(this.exchangeData.currentKeycloakLoginGroups.length>0) {
			  this.exchangeData.currentKeycloakLoginGroups.forEach((group, index) => {

				let parts = group.split('/');
				this.userGroupInformation[index] = [];

				parts.forEach(part => {
				  if(part.length>0)
            this.userGroupInformation[index].push(part);
				});
			  });
			}
    }
 /*
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.sidebarIndicatorConfigClass = "disappear";
		$scope.sidebarDiagramsClass = "disappear";
		$scope.sidebarRadarDiagramClass = "disappear";
		$scope.sidebarProcessingClass = "disappear";
		$scope.sidebarRegressionDiagramClass = "disappear";
		$scope.sidebarFilterClass = "disappear";
		$scope.sidebarBalanceClass = "disappear";
		$scope.sidebarReachabilityClass = "disappear";
		$scope.sidebarPoiClass = "disappear";
		$scope.sidebarDataImportClass = "disappear";

		$scope.sidebarLegendClass = "";

		$scope.buttonIndicatorConfigClass = "btn btn-custom btn-circle";
		$scope.buttonDiagramsClass = "btn btn-custom btn-circle";
		$scope.buttonRadarDiagramClass = "btn btn-custom btn-circle";
		$scope.buttonProcessingClass = "btn btn-custom btn-circle";
		$scope.buttonRegressionDiagramClass = "btn btn-custom btn-circle";
		$scope.buttonFilterClass = "btn btn-custom btn-circle";
		$scope.buttonBalanceClass = "btn btn-custom btn-circle";
		$scope.buttonReachabilityClass = "btn btn-custom btn-circle";
		$scope.buttonPoiClass = "btn btn-custom btn-circle";
		$scope.buttonDataImportClass = "btn btn-custom btn-circle";

		$scope.buttonLegendClass = "btn btn-custom-docked-right btn-docked-right";

		function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		Auth.keycloak.onAuthLogout  = function() {
			console.log("Logout successfull");
			checkAuthentication();
		}

		Auth.keycloak.onAuthSuccess   = function() {
			console.log("User successfully authenticated");
			checkAuthentication();
		}

		$scope.tryLoginUser_withoutKeycloak = function(){
			// TODO FIXME make generic user login once user/role concept is implemented

			// currently only simple ADMIN user login is possible
			console.log("Check user login");
			if (this.exchangeData.adminUserName === this.exchangeData.currentKeycloakUser && this.exchangeData.adminPassword === $scope.password){
				// success login --> currently switch to ADMIN page directly
				console.log("User Login success - redirect to Admin Page");
				this.exchangeData.adminIsLoggedIn = true;
				$location.path('/administration');
			}
		};

		$scope.tryLoginUser = function(){
			if(this.exchangeData.enableKeycloakSecurity){
				Auth.keycloak.login();
			}
			else{
				$scope.tryLoginUser_withoutKeycloak();
			}
			
		};

		$scope.tryLogoutUser = function() {
			Auth.keycloak.logout();
		};

		$scope.tryLoginUserByKeypress = function ($event) {
			var keyCode = $event.which || $event.keyCode;
			//check for enter key
	    if (keyCode === 13) {
	        $scope.tryLoginUser();
	    }
		};

		var checkAuthentication = async function () {	
			this.exchangeData.currentKeycloakLoginRoles = [];

			if (Auth.keycloak.authenticated) {
				$scope.authenticated = Auth.keycloak.authenticated;
				if(Auth.keycloak.tokenParsed 
					&& Auth.keycloak.tokenParsed.realm_access 
					&& Auth.keycloak.tokenParsed.realm_access.roles 
					&& Auth.keycloak.tokenParsed.realm_access.roles.some(role => role.endsWith("-creator") || role.endsWith("-publisher") || role.endsWith("-editor"))){
						Auth.keycloak.showAdminView = true;
						$scope.showAdminLogin = true;
				}
			}
		};

		$scope.openAdminUI = function () {
			$location.path('/administration');
		};
    


		$scope.checkBalanceButtonAndMenueState = function(){
			// disable if indicator is dynamic or if indicator only contains 1 or less timeseries entries
			if(this.exchangeData.selectedIndicator && (this.exchangeData.selectedIndicator.indicatorType.includes("DYNAMIC") || this.exchangeData.selectedIndicator.applicableDates.length < 2)){
				$scope.buttonBalanceClass = "btn btn-custom btn-circle disabled";
				$scope.sidebarBalanceClass = "disappear";
			}
			else{
				$scope.buttonBalanceClass = "btn btn-custom btn-circle";
			}
		};

		$scope.$on("checkBalanceMenueAndButton", function(event){
			$scope.checkBalanceButtonAndMenueState();
		});


		$scope.onRecenterMapButtonClick = function(){
			$rootScope.$broadcast("recenterMapContent");
		}

		$scope.onExportMapButtonClick = function(){
			$rootScope.$broadcast("exportMap");
		}

		$scope.onUnselectFeaturesButtonClick = function(){
			$rootScope.$broadcast("unselectAllFeatures");
		}

		$scope.onOpenLayerControlButtonClick = function(){
			$rootScope.$broadcast("openLayerControl");
		}

		$scope.onToggleInfoControlButtonClick = function(){
			$rootScope.$broadcast("toggleInfoControl");
		}

 */
}
