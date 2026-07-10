import { DisplayType } from 'components/ngComponents/common/custom-slider/custom-slider.component';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminLoginStateService } from 'services/admin-login-state-service/admin-login-state.service';
import { RangeFilterStateService } from 'services/range-filter-state-service/range-filter-state.service';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { InfoModal } from './infoModal/info-modal.component';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import { AuthService } from 'services/auth-service/auth.service';
import { FavService } from 'services/fav-service/fav.service';
import { GlobalFilterHelperService } from 'services/global-filter-helper-service/global-filter-helper.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';
import { Router } from '@angular/router';
import { ReportingModalComponent } from './reporting/reporting-modal.component';
import { ReportingBackgroundProcessorComponent } from './reporting/reporting-background-processor/reporting-background-processor.component';
import { ReportingProgressBannerComponent } from './reporting/reporting-progress-banner/reporting-progress-banner.component';
import { EnvConfigService } from '../../../services/env-config-service/env-config.service';
import { MapService } from 'services/map-service/map.service';
import { CommonModule } from '@angular/common';
import { KommonitorMapComponent } from './kommonitorMap/kommonitor-map.component';
import { KommonitorLegendComponent } from './kommonitorLegend/kommonitor-legend.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { UserLoginComponent } from '../common/userLogin/user-login.component';
import { CustomSliderComponent } from '../common/custom-slider/custom-slider.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExportMenuButtonComponent } from './exporting/export-menu-button/export-menu-button.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'user-interface-new',
  templateUrl: './user-interface.component.html',
  styleUrls: ['./user-interface.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    KommonitorMapComponent,
    KommonitorLegendComponent,
    SidebarComponent,
    UserLoginComponent,
    CustomSliderComponent,
    FormsModule,
    ExportMenuButtonComponent,
    ReportingBackgroundProcessorComponent,
    ReportingProgressBannerComponent,
  ],
})
export class UserInterfaceComponent implements OnInit {
  protected adminLoginState = inject(AdminLoginStateService);
  protected rangeFilterState = inject(RangeFilterStateService);
  protected chartDisplayState = inject(ChartDisplayStateService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private selectionState = inject(SelectionStateService);
  private accessControlService = inject(AccessControlService);
  private modalService = inject(NgbModal);
  private broadcastService = inject(BroadcastService);
  private configStorageService = inject(ConfigStorageService);
  protected visibilityHelperService = inject(ElementVisibilityHelperService);
  private authService = inject(AuthService);
  private favService = inject(FavService);
  protected globalFilterHelperService = inject(GlobalFilterHelperService);
  private visualStyleHelperService = inject(VisualStyleHelperServiceNew);
  private router = inject(Router);
  protected envConfigService = inject(EnvConfigService);
  private mapService = inject(MapService);

  private readonly destroyRef = inject(DestroyRef);

  userRoleInformation = {};
  userGroupInformation: any[] = [];

  sliderDisplayMode = DisplayType;

  sliderData!: Date[];
  markerPosition!: Date[];
  sliderDisabled: boolean = false;

  expertToolbarVisible = false;
  diagramSubMenuOpen: boolean = false;

  showUserLogin = false;
  password;
  showAdminLogin = false;

  userLoggedIn: boolean = false;

  sidebarElement = '';

  ngOnInit(): void {
    this.mapService.dateSlider$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (value.data) this.sliderData = value.data;

      if (value.selected) this.markerPosition = [value.selected];

      if (value.disabled) this.sliderDisabled = value.disabled;
    });

    this.selectionState.selectedDate$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value) this.markerPosition = [value];
      });

    // load all app configs
    this.configStorageService.getConfigs();

    // todo
    //kommonitorShareHelperService.init();

    this.globalFilterHelperService.init();

    if (this.authService.isAuthenticated()) {
      this.favService.init();
      this.userLoggedIn = true;
    }

    if (this.globalFilterHelperService.applicationFilter) {
      this.metadataBootstrap.fetchAllMetadata(this.globalFilterHelperService.applicationFilter);
    } else {
      this.metadataBootstrap.fetchAllMetadata();
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

  onSidebarClose(event: any) {
    this.sidebarElement = '';
    this.mapService.setMapRecenterState({ recenter: true, resize: true });
  }

  onDateSliderChange(data: any) {
    this.mapService.setDateSliderValues({ selected: data[0] });
  }

  isDiagramSidebarOpened() {
    const diagramElements = [
      'sidebarDiagramsCollapse',
      'sidebarRadarDiagramCollapse',
      'sidebarRegressionDiagramCollapse',
      'sidebarBalanceCollapse',
    ];

    return diagramElements.includes(this.sidebarElement);
  }

  prepUserInformation() {
    if (this.accessControlService.currentKomMonitorLoginRoleNames.length > 0) {
      this.accessControlService.currentKomMonitorLoginRoleNames.forEach((roles) => {
        const key = roles.split('.')[0];
        const role = roles.split('.')[1];

        if (!Object.prototype.hasOwnProperty.call(this.userRoleInformation, key)) {
          this.userRoleInformation[key] = [];
        }

        this.userRoleInformation[key].push(role);
      });
    }

    if (this.accessControlService.currentKeycloakLoginGroups.length > 0) {
      this.accessControlService.currentKeycloakLoginGroups.forEach((group, index) => {
        const parts = group.split('/');
        this.userGroupInformation[index] = [];

        parts.forEach((part) => {
          if (part.length > 0) this.userGroupInformation[index].push(part);
        });
      });
    }
  }

  tryLoginUser_withoutKeycloak() {
    // TODO FIXME make generic user login once user/role concept is implemented

    // currently only simple ADMIN user login is possible
    console.log('Check user login');
    if (
      this.adminLoginState.adminUserName === this.metadataBootstrap.currentKeycloakUser &&
      this.adminLoginState.adminPassword === this.password
    ) {
      // success login --> currently switch to ADMIN page directly
      console.log('User Login success - redirect to Admin Page');
      this.adminLoginState.adminIsLoggedIn = true;
      location.href = '/administration';
    }
  }

  openAdminUI() {
    this.router.navigate(['/administration']);
  }

  openInfoModal() {
    const modalRef = this.modalService.open(InfoModal, {
      windowClass: 'modal-holder',
      centered: true,
    });
  }

  openReportingModal() {
    const reportingModalRef = this.modalService.open(ReportingModalComponent, {
      windowClass: 'modal-holder',
      centered: true,
    });
  }

  onSidebarButtonClick(event) {
    this.closeDiagramSubmenu();

    let ident;
    if (event.target.id != '') ident = event.target.id;
    else ident = event.srcElement.parentElement.id;

    if (ident != this.sidebarElement) this.sidebarElement = ident;
    else this.sidebarElement = '';

    this.mapService.setMapRecenterState({ recenter: true, resize: true });
  }

  /*

		$scope.checkBalanceButtonAndMenueState = function(){
			// disable if indicator is dynamic or if indicator only contains 1 or less timeseries entries
			if(this.selectionState.selectedIndicator && (this.selectionState.selectedIndicator.indicatorType.includes("DYNAMIC") || this.selectionState.selectedIndicator.applicableDates.length < 2)){
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
  onRecenterMapButtonClick() {
    this.mapService.setMapRecenterState({ recenter: true });
  }

  onExportMapButtonClick() {
    this.broadcastService.broadcast(BroadcastMessage.ExportMap);
  }

  onUnselectFeaturesButtonClick() {
    this.broadcastService.broadcast(BroadcastMessage.UnselectAllFeatures);
  }

  onOpenLayerControlButtonClick() {
    this.broadcastService.broadcast(BroadcastMessage.OpenLayerControl);
  }

  onToggleInfoControlButtonClick() {
    this.broadcastService.broadcast(BroadcastMessage.ToggleInfoControl);
  }

  onExpertButtonClick() {
    this.expertToolbarVisible = !this.expertToolbarVisible;
    this.broadcastService.broadcast(BroadcastMessage.ToggleExpertControl);
  }

  onDiagramSubMenuOver() {
    if (!this.diagramSubMenuOpen) this.openDiagramSubmenu();
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
    this.chartDisplayState.isMeasureOfValueChecked = false;
  }

  onRangeFilterCloseButtonClick() {
    this.broadcastService.broadcast(BroadcastMessage.RemoveRangeFilter);
  }

  onBalanceCloseButtonClick() {
    this.broadcastService.broadcast(BroadcastMessage.DisableBalance);
  }

  filterModusActive(): boolean {
    return (
      this.globalFilterHelperService.globalFilterApplied() ||
      this.chartDisplayState.isMeasureOfValueChecked ||
      this.rangeFilterState.rangeFilterIsApplied
    );
  }
}
