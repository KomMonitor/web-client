import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataExchange, DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { InfoModal } from './infoModal/info-modal.component';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import { AuthService } from 'services/auth-service/auth.service';
import { FavService } from 'services/fav-service/fav.service';
import { GlobalFilterHelperService } from 'services/global-filter-helper-service/global-filter-helper.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';
import { Router } from '@angular/router';
import { ReportingModalComponent } from './reporting/reporting-modal.component';

@Component({
  selector: 'user-interface-new',
  templateUrl: './user-interface.component.html',
  styleUrls: ['./user-interface.component.css']
})
export class UserInterfaceComponent implements OnInit {

  exchangeData!: DataExchange;
  userRoleInformation = {};
  userGroupInformation:any[] = [];

  expertToolbarVisible = false;
  diagramSubMenuOpen: boolean = false;

  showUserLogin = false;
  password;
  showAdminLogin = false;

  sidebarElement = "";

  constructor(
    protected dataExchangeService: DataExchangeService,
    private modalService: NgbModal, 
    private broadcastService: BroadcastService,
    private configStorageService: ConfigStorageService,
    protected visibilityHelperService: ElementVisibilityHelperService,
    private authService: AuthService,
    private favService: FavService,
    protected globalFilterHelperService: GlobalFilterHelperService,
    private visualStyleHelperService: VisualStyleHelperServiceNew,
    private router: Router
  ) {
    this.exchangeData = this.dataExchangeService;
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

    await  */

    // todo
    //kommonitorShareHelperService.init();

    this.globalFilterHelperService.init();
    this.favService.init();

    if(this.globalFilterHelperService.applicationFilter) {
      this.dataExchangeService.fetchAllMetadata(this.globalFilterHelperService.applicationFilter);
    } else {
      this.dataExchangeService.fetchAllMetadata();
    }

    this.showAdminLogin = this.authService.hasAdminRights();
    
    setTimeout(() => {
      this.prepUserInformation();
    }, 1000);

    // open infoModal ico
    if(!localStorage.getItem('hideKomMonitorAppGreeting') || localStorage.getItem('hideKomMonitorAppGreeting') === 'false')
      //this.openInfoModal();

    this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      let title = broadcastMsg.msg;
      let values:any = broadcastMsg.values;

      switch (title) {
        case 'sidebarClosed' : {
          this.sidebarElement = "";
        } break;
      }
    });

    this.openReportingModal()
  }

  isDiagramSidebarOpened() {
    let diagramElements = ['sidebarDiagramsCollapse','sidebarRadarDiagramCollapse','sidebarRegressionDiagramCollapse','sidebarBalanceCollapse'];

    return diagramElements.includes(this.sidebarElement);
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
*/
		tryLoginUser_withoutKeycloak(){
			// TODO FIXME make generic user login once user/role concept is implemented

			// currently only simple ADMIN user login is possible
			console.log("Check user login");
			if (this.exchangeData.adminUserName === this.exchangeData.currentKeycloakUser && this.exchangeData.adminPassword === this.password){
				// success login --> currently switch to ADMIN page directly
				console.log("User Login success - redirect to Admin Page");
				this.exchangeData.adminIsLoggedIn = true;
				location.href = '/administration';
			}
		}

		openAdminUI() {
			this.router.navigate(['/administration']);
		};

    openInfoModal() {
      const modalRef = this.modalService.open(InfoModal, {windowClass: 'modal-holder', centered: true});
    }

    openReportingModal() {
        const reportingModalRef = this.modalService.open(ReportingModalComponent, {windowClass: 'modal-holder', centered: true});
    }

    onSidebarButtonClick(event) {
      this.closeDiagramSubmenu();

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
        if (kommonitorDataExchangeService.isBalanceChecked) {
					$scope.buttonBalanceClass = "btn btn-custom btn-circle balanceActive";
				}
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

		onOpenLayerControlButtonClick(){
			this.broadcastService.broadcast("openLayerControl");
		}

		onToggleInfoControlButtonClick(){
			this.broadcastService.broadcast("toggleInfoControl");
		}

    onExpertButtonClick() {
      this.expertToolbarVisible = !this.expertToolbarVisible;
			this.broadcastService.broadcast("toggleExpertControl");
    }

    onDiagramSubMenuOver() {
      if(!this.diagramSubMenuOpen)
        this.openDiagramSubmenu();  
    }

    openDiagramSubmenu() {
      this.diagramSubMenuOpen = true;
    }
  
    closeDiagramSubmenu() {
      this.diagramSubMenuOpen = false;
    }

    onDiagramSubMenuButtonClick($event) {
      this.onSidebarButtonClick($event);
    }

    openFilterSidebar() {
      this.sidebarElement = 'sidebarFilterCollapse';
    }

    openBalanceSidebar() {
      this.sidebarElement = 'sidebarBalanceCollapse';
    }

    onSpatialFilterCloseButtonClick() {
      this.globalFilterHelperService.reset();
    }
    
    onMOVCloseButtonClick() {
      this.dataExchangeService.isMeasureOfValueChecked = false;
    }
          
    onRangeFilterCloseButtonClick() {
      this.broadcastService.broadcast('removeRangeFilter');
    }
    
    onBalanceCloseButtonClick() {
      this.broadcastService.broadcast('disableBalance');
    }

    filterModusActive():boolean {

      return this.globalFilterHelperService.globalFilterApplied() || this.dataExchangeService.isMeasureOfValueChecked || this.dataExchangeService.rangeFilterIsApplied;
    }
}
