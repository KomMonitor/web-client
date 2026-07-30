import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DisplayType } from 'components/ngComponents/common/custom-slider/custom-slider.component';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AuthService } from 'services/auth-service/auth.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import { FavService } from 'services/fav-service/fav.service';
import { GlobalFilterHelperService } from 'services/global-filter-helper-service/global-filter-helper.service';
import { MapService } from 'services/map-service/map.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { RangeFilterStateService } from 'services/range-filter-state-service/range-filter-state.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { SidebarStateService } from 'services/sidebar-state-service/sidebar-state.service';
import { EnvConfigService } from '../../../services/env-config-service/env-config.service';
import { CustomSliderComponent } from '../common/custom-slider/custom-slider.component';
import { NotificationComponent } from '../common/notification/notification.component';
import { UserLoginComponent } from '../common/userLogin/user-login.component';
import { InfoModal } from './infoModal/info-modal.component';
import { KommonitorLegendComponent } from './kommonitorLegend/kommonitor-legend.component';
import { KommonitorMapComponent } from './kommonitorMap/kommonitor-map.component';
import { ReportingBackgroundProcessorComponent } from './reporting/reporting-background-processor/reporting-background-processor.component';
import { ReportingProgressBannerComponent } from './reporting/reporting-progress-banner/reporting-progress-banner.component';
import { SidebarButtonsComponent } from './sidebarButtons/sidebar-buttons.component';
import { SidebarComponent } from './sidebar/sidebar.component';

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
    SidebarButtonsComponent,
    UserLoginComponent,
    CustomSliderComponent,
    FormsModule,
    ReportingBackgroundProcessorComponent,
    ReportingProgressBannerComponent,
    NotificationComponent,
  ],
})
export class UserInterfaceComponent implements OnInit {
  protected rangeFilterState = inject(RangeFilterStateService);
  protected chartDisplayState = inject(ChartDisplayStateService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private selectionState = inject(SelectionStateService);
  private accessControlService = inject(AccessControlService);
  private modalService = inject(NgbModal);
  private broadcastService = inject(BroadcastService);
  protected visibilityHelperService = inject(ElementVisibilityHelperService);
  private authService = inject(AuthService);
  private favService = inject(FavService);
  protected globalFilterHelperService = inject(GlobalFilterHelperService);
  private router = inject(Router);
  protected envConfigService = inject(EnvConfigService);
  private mapService = inject(MapService);
  protected sidebarState = inject(SidebarStateService);

  private readonly destroyRef = inject(DestroyRef);

  userRoleInformation = {};
  userGroupInformation: any[] = [];

  sliderDisplayMode = DisplayType;

  sliderData!: Date[];
  markerPosition!: Date[];
  sliderDisabled: boolean = false;

  expertToolbarVisible = false;

  showUserLogin = false;
  showAdminLogin = false;

  userLoggedIn: boolean = false;

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

    this.globalFilterHelperService.init();

    if (this.authService.isAuthenticated()) {
      this.favService.init();
      this.userLoggedIn = true;
    }

    // Skips the refetch when the metadata is already loaded in the requested
    // filter state (e.g. when returning from /administration without an active
    // global filter). The user information is derived once the roles are
    // loaded (replaces the former fixed 1s timeout).
    this.metadataBootstrap
      .ensureMetadataLoaded(this.globalFilterHelperService.applicationFilter || undefined)
      .then(() => this.prepUserInformation());

    this.showAdminLogin = this.authService.hasAdminRights();
  }

  onDateSliderChange(data: any) {
    this.mapService.setDateSliderValues({ selected: data[0] });
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

  openAdminUI() {
    this.router.navigate(['/administration']);
  }

  openInfoModal() {
    this.modalService.open(InfoModal, {
      windowClass: 'modal-holder',
      centered: true,
    });
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
    this.mapService.exportMap();
  }

  onUnselectFeaturesButtonClick() {
    this.mapService.unselectAllFeatures();
  }

  onOpenLayerControlButtonClick() {
    this.mapService.openLayerControl();
  }

  onExpertButtonClick() {
    this.expertToolbarVisible = !this.expertToolbarVisible;
    this.mapService.toggleExpertControls();
  }

  openFilterSidebar() {
    this.sidebarState.setActive('sidebarFilterCollapse');
  }

  openBalanceSidebar() {
    this.sidebarState.setActive('sidebarBalanceCollapse');
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
}
