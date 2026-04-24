import { DisplayType } from 'components/ngComponents/common/custom-slider/custom-slider.component';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
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
import { EnvConfigService } from '../../../services/env-config-service/env-config.service';
import { MapService } from 'services/map-service/map.service';
import { CommonModule } from '@angular/common';
import { KommonitorMapComponent } from './kommonitorMap/kommonitor-map.component';
import { KommonitorLegendComponent } from './kommonitorLegend/kommonitor-legend.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { UserLoginComponent } from '../common/userLogin/user-login.component';
import { CustomSliderComponent } from '../common/custom-slider/custom-slider.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DownloadModalComponent } from './exporting/download-modal/download-modal.component';

@Component({
  selector: 'user-interface-new',
  templateUrl: './user-interface.component.html',
  styleUrls: ['./user-interface.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    KommonitorMapComponent,
    KommonitorLegendComponent,
    SidebarComponent,
    UserLoginComponent,
    CustomSliderComponent
  ]
})
export class UserInterfaceComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);

  userRoleInformation = {};
  userGroupInformation:any[] = [];

  sliderDisplayMode = DisplayType;

  sliderData!:Date[];
  markerPosition!:Date[];
  sliderDisabled: boolean = false;

  expertToolbarVisible = false;
  diagramSubMenuOpen: boolean = false;

  showUserLogin = false;
  password;
  showAdminLogin = false;

  userLoggedIn: boolean = false;

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
    private router: Router,
    protected envConfigService: EnvConfigService,
    private mapService: MapService
  ) { }

  ngOnInit(): void {

    this.mapService.dateSlider$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {

        if(value.data)
          this.sliderData = value.data;

        if(value.selected)
          this.markerPosition = [value.selected];

        if(value.disabled)
          this.sliderDisabled = value.disabled;
      });

    this.dataExchangeService.selectedDate$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if(value)
          this.markerPosition = [value];
      });

    // load all app configs
    this.configStorageService.getConfigs();

    // todo
    //kommonitorShareHelperService.init();

    this.globalFilterHelperService.init();

    if(this.authService.isAuthenticated()) {
      this.favService.init();
      this.userLoggedIn = true;
    } 

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
    /* if(!localStorage.getItem('hideKomMonitorAppGreeting') || localStorage.getItem('hideKomMonitorAppGreeting') === 'false')
      this.openInfoModal(); */

    //this.openReportingModal()
  }

  onSidebarClose(event:any) {
    this.sidebarElement = '';
    this.mapService.setMapRecenterState({recenter: true, resize: true});
  }

  onDateSliderChange(data:any) {
    this.mapService.setDateSliderValues({selected: data[0]});
  }

  isDiagramSidebarOpened() {
    let diagramElements = ['sidebarDiagramsCollapse','sidebarRadarDiagramCollapse','sidebarRegressionDiagramCollapse','sidebarBalanceCollapse'];

    return diagramElements.includes(this.sidebarElement);
  }

  prepUserInformation() {

    if(this.dataExchangeService.currentKomMonitorLoginRoleNames.length>0) {
      this.dataExchangeService.currentKomMonitorLoginRoleNames.forEach(roles => {
      
      let key = roles.split('.')[0];
      let role = roles.split('.')[1];

      if(!this.userRoleInformation.hasOwnProperty(key)) {
        this.userRoleInformation[key] = [];
      }
      
      this.userRoleInformation[key].push(role);

      });
    }

    if(this.dataExchangeService.currentKeycloakLoginGroups.length>0) {
      this.dataExchangeService.currentKeycloakLoginGroups.forEach((group, index) => {

      let parts = group.split('/');
      this.userGroupInformation[index] = [];

      parts.forEach(part => {
        if(part.length>0)
          this.userGroupInformation[index].push(part);
      });
      });
    }
  }

  tryLoginUser_withoutKeycloak(){
    // TODO FIXME make generic user login once user/role concept is implemented

    // currently only simple ADMIN user login is possible
    console.log("Check user login");
    if (this.dataExchangeService.adminUserName === this.dataExchangeService.currentKeycloakUser && this.dataExchangeService.adminPassword === this.password){
      // success login --> currently switch to ADMIN page directly
      console.log("User Login success - redirect to Admin Page");
      this.dataExchangeService.adminIsLoggedIn = true;
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

  openDownloadModal() {
      this.modalService.open(DownloadModalComponent, {windowClass: 'modal-holder', centered: true});
  }

  onSidebarButtonClick(event) {
    this.closeDiagramSubmenu();

    let ident; 
    if(event.target.id!="")
      ident = event.target.id;
    else
      ident = event.srcElement.parentElement.id;

    if(ident!=this.sidebarElement)
      this.sidebarElement = ident;
    else 
      this.sidebarElement = '';

    this.mapService.setMapRecenterState({recenter: true, resize: true});
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
    this.mapService.setMapRecenterState({recenter: true});
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
