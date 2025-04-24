import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { InfoModal } from './infoModal/info-modal.component';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';
import { ReportingModalComponent } from './reporting/reporting-modal.component';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';

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

  
  sidebarIndicatorConfigClass = "disappear";
  sidebarDiagramsClass = "disappear";
  sidebarRadarDiagramClass = "disappear";
  sidebarProcessingClass = "disappear";
  sidebarRegressionDiagramClass = "disappear";
  sidebarFilterClass = "disappear";
  sidebarBalanceClass = "disappear";
  sidebarReachabilityClass = "disappear";
  sidebarPoiClass = "disappear";
  sidebarDataImportClass = "disappear";

  sidebarLegendClass = "";

  buttonIndicatorConfigClass = "btn btn-custom btn-circle";
  buttonDiagramsClass = "btn btn-custom btn-circle";
  buttonRadarDiagramClass = "btn btn-custom btn-circle";
  buttonProcessingClass = "btn btn-custom btn-circle";
  buttonRegressionDiagramClass = "btn btn-custom btn-circle";
  buttonFilterClass = "btn btn-custom btn-circle";
  buttonBalanceClass = "btn btn-custom btn-circle";
  buttonReachabilityClass = "btn btn-custom btn-circle";
  buttonPoiClass = "btn btn-custom btn-circle";
  buttonDataImportClass = "btn btn-custom btn-circle";

  sidebarElement = "";

  constructor(
    private dataExchangeService: DataExchangeService,
    private modalService: NgbModal, 
    private broadcastService: BroadcastService,
    private configStorageService: ConfigStorageService,
    protected visibilityHelperService: ElementVisibilityHelperService
  ) {
    this.exchangeData = this.dataExchangeService.pipedData;
  }

  ngOnInit(): void {

      // load all app configs
      this.configStorageService.getConfigs();

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

      // open infoModal ico
      if(!localStorage.getItem('hideKomMonitorAppGreeting') || localStorage.getItem('hideKomMonitorAppGreeting') === 'false')
        this.openInfoModal();
  
      this.openReportingModal();
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
  */
/* 		checkAuthentication = async function () {	
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
		}; */

		openAdminUI() {
			document.location = '/administration';
		};

    openInfoModal() {

      const modalRef = this.modalService.open(InfoModal, {windowClass: 'modal-holder', centered: true});
    }

    openReportingModal() {
        const reportingModalRef = this.modalService.open(ReportingModalComponent, {windowClass: 'modal-holder', centered: true});
    }

    onSidebarButtonClick(event) {

      let ident; 
      if(event.target.id!="")
        ident = event.target.id;
      else
        ident = event.srcElement.parentElement.id;

      if(ident!=this.sidebarElement) {

        if(this.sidebarElement=='')
          this.broadcastService.broadcast("recenterMapOnSidebarAction",[true]);

        this.sidebarElement = ident;
      }
      else {
        this.sidebarElement = '';
        this.broadcastService.broadcast("recenterMapOnSidebarAction",[false]);
      }
    }
    
/*

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


 */
		onRecenterMapButtonClick(){
			this.broadcastService.broadcast("recenterMapContent");
		}

		onExportMapButtonClick(){
			this.broadcastService.broadcast("exportMap");
		}

		onUnselectFeaturesButtonClick(){
			this.broadcastService.broadcast("unselectAllFeatures");
		}

/* 		onOpenLayerControlButtonClick(){
			this.broadcastService.broadcast("openLayerControl");
		} */

		onToggleInfoControlButtonClick(){
			this.broadcastService.broadcast("toggleInfoControl");
		}

}
