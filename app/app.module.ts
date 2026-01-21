import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MainComponent } from 'mainComponent/main/main.component';
import { CommonModule, NgClass } from '@angular/common'; 
import { routes } from 'app.routes';
import { RouterModule } from '@angular/router';

import { UserInterfaceComponent } from 'components/ngComponents/userInterface/user-interface.component';
import { KommonitorMapComponent } from 'components/ngComponents/userInterface/kommonitorMap/kommonitor-map.component';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { StartupService } from 'services/startup-service/startup.service';
import { KommonitorLegendComponent } from 'components/ngComponents/userInterface/kommonitorLegend/kommonitor-legend.component';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KommonitorClassificationComponent } from 'components/ngComponents/userInterface/kommonitorClassification/kommonitor-classification.component';
import { ClassificationMethodSelectComponent } from 'components/ngComponents/common/classificationMethodSelect/classification-method-select.component';
// import { MathjaxModule } from 'mathjax-angular';
import { SidebarComponent } from 'components/ngComponents/userInterface/sidebar/sidebar.component';
import { KommonitorDataSetupComponent } from 'components/ngComponents/userInterface/sidebar/kommonitorDataSetup/kommonitor-data-setup.component';
import { IndicatorMetadataTooltipComponent } from 'components/ngComponents/customElements/indicator-metadata-tooltip/indicator-metadata-tooltip.component';
import { IndicatorFavFilter } from 'pipes/indicator-fav-filter.pipe';
import { IndicatorRadarComponent } from 'components/ngComponents/userInterface/sidebar/indicatorRadar/indicator-radar.component';
import { IndicatorNameFilter } from 'pipes/indicator-title-filter.pipe';
import { RegressionDiagramComponent } from 'components/ngComponents/userInterface/sidebar/regressionDiagram/regression-diagram.component';
import { SelectedIndicatorFilter } from 'pipes/selected-indicator-filter.pipe';
import { BaseIndicatorOfComputedIndicatorFilter } from 'pipes/base-indicator-of-computed-indicator-filter.pipe';
import { BaseIndicatorOfHeadlineIndicatorFilter } from 'pipes/base-indicator-of-headline-indicator-filter.pipe';
import { KommonitorDiagramsComponent } from 'components/ngComponents/userInterface/sidebar/kommonitorDiagrams/kommonitor-diagrams.component';
import { KommonitorBalanceComponent } from 'components/ngComponents/userInterface/sidebar/kommonitorBalance/kommonitor-balance.component';
import { PoiComponent } from 'components/ngComponents/userInterface/sidebar/poi/poi.component';
import { KommonitorFilterComponent } from 'components/ngComponents/userInterface/sidebar/kommonitorFilter/kommonitor-filter.component';
import { DualListBoxComponent } from 'components/ngComponents/customElements/dual-list-box/dual-list-box.component';
import { GeoFavFilter } from 'pipes/georesources-fav-filter.pipe';
import { GeoFavItemFilter } from 'pipes/georesources-fav-item-filter.pipe';
import { UserLoginComponent } from 'components/ngComponents/userInterface/userLogin/user-login.component';
import { AdminComponent } from 'components/ngComponents/admin/admin.component';
import { AdminDashboardManagementComponent } from 'components/ngComponents/admin/adminDashboardManagement/admin-dashboard-management.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AdminRoleExplanationComponent } from 'components/ngComponents/admin/adminRoleExplanation/admin-role-explanation.component';
import { AdminTopicsManagementComponent } from 'components/ngComponents/admin/adminTopicsManagement/admin-topics-management.component';
import { AdminSpatialUnitsManagementComponent } from 'components/ngComponents/admin/adminSpatialUnitsManagement/admin-spatial-units-management.component';
import { AgGridAngular } from 'ag-grid-angular';
import { SpatialUnitAddModalComponent } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatialUnitAddModal/spatial-unit-add-modal.component';
import { SpatialUnitDeleteModalComponent } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatialUnitDeleteModal/spatial-unit-delete-modal.component';
import { KmColorPickerComponent } from 'components/ngComponents/customElements/color-picker/km-color-picker.component';
import { KmLinePatternPickerComponent } from 'components/ngComponents/customElements/line-pattern-picker/km-line-pattern-picker.component';
import { KmDatePickerComponent } from 'components/ngComponents/customElements/date-picker/km-date-picker.component';
import { SpatialUnitEditFeaturesModalComponent } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatialUnitEditFeaturesModal/spatial-unit-edit-features-modal.component';
import { SpatialUnitEditMetadataModalComponent } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatialUnitEditMetadataModal/spatial-unit-edit-metadata-modal.component';
import { SpatialUnitEditUserRolesModalComponent } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatialUnitEditUserRolesModal/spatial-unit-edit-user-roles-modal.component';
import { AuthInterceptor } from 'util/interceptors/auth.interceptor';
import { AdminIndicatorsManagementComponent } from 'components/ngComponents/admin/adminIndicatorsManagement/admin-indicators-management.component';
import { IndicatorDeleteModalComponent } from 'components/ngComponents/admin/adminIndicatorsManagement/indicatorDeleteModal/indicator-delete-modal.component';
import { IndicatorEditMetadataModalComponent } from 'components/ngComponents/admin/adminIndicatorsManagement/indicatorEditMetadataModal/indicator-edit-metadata-modal.component';
import { OrderByPipe } from 'pipes/order-by.pipe';
import { IndicatorAddModalComponent } from 'components/ngComponents/admin/adminIndicatorsManagement/indicatorAddModal/indicator-add-modal.component';
import { IndicatorBatchUpdateModalComponent } from 'components/ngComponents/admin/adminIndicatorsManagement/indicatorBatchUpdateModal/indicator-batch-update-modal.component';
import { IndicatorEditFeaturesModalComponent } from 'components/ngComponents/admin/adminIndicatorsManagement/indicatorEditFeaturesModal/indicator-edit-features-modal.component';
import { IndicatorEditIndicatorSpatialUnitRolesModalComponent } from 'components/ngComponents/admin/adminIndicatorsManagement/indicatorEditIndicatorSpatialUnitRolesModal/indicator-edit-indicator-spatial-unit-roles-modal.component';
import { FilterPipe } from 'pipes/filter.pipe';
import { AdminGeoresourcesManagementComponent } from 'components/ngComponents/admin/adminGeoresourcesManagement/admin-georesources-management.component';
import { GeoresourceAddModalComponent } from 'components/ngComponents/admin/adminGeoresourcesManagement/georesourceAddModal/georesource-add-modal.component';
import { GeoresourceDeleteModalComponent } from 'components/ngComponents/admin/adminGeoresourcesManagement/georesourceDeleteModal/georesource-delete-modal.component';
import { GeoresourceBatchUpdateModalComponent } from 'components/ngComponents/admin/adminGeoresourcesManagement/georesourceBatchUpdateModal/georesource-batch-update-modal.component';
import { GeoresourceEditMetadataModalComponent } from 'components/ngComponents/admin/adminGeoresourcesManagement/georesourceEditMetadataModal/georesource-edit-metadata-modal.component';
import { GeoresourceEditUserRolesModalComponent } from 'components/ngComponents/admin/adminGeoresourcesManagement/georesourceEditUserRolesModal/georesource-edit-user-roles-modal.component';
import { GeoresourceEditFeaturesModalComponent } from 'components/ngComponents/admin/adminGeoresourcesManagement/georesourceEditFeaturesModal/georesource-edit-features-modal.component';
import { SingleFeatureEditComponent } from 'components/ngComponents/common/single-feature-edit/single-feature-edit.component';
import { AdminAppConfigComponent } from 'components/ngComponents/admin/adminConfig/adminAppConfig/admin-app-config.component';
import { PipesModule } from 'pipes.module';
import { AdminLandingpageConfigComponent } from 'components/ngComponents/admin/adminConfig/adminLandingpageConfig/admin-landingpage-config.component';
import { AdminControlsConfigComponent } from 'components/ngComponents/admin/adminConfig/adminControlsConfig/admin-controls-config.component';
import { TopicOrderSelectionComponent } from './components/ngComponents/admin/adminTopicsManagement/topicOrderSelection/topic-order-selection.component';
import { TopicListComponent } from './components/ngComponents/admin/adminTopicsManagement/topicList/topicList.component';
import { AddTopicComponent } from './components/ngComponents/admin/adminTopicsManagement/add-topic/add-topic.component';
import { SortByOrderPipe } from './components/ngComponents/admin/adminTopicsManagement/sortByOrder.pipe';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TopicEditModalComponent } from 'components/ngComponents/admin/adminTopicsManagement/topicEditModal/topic-edit-modal.component';
import { AdminFilterConfigComponent } from 'components/ngComponents/admin/adminConfig/adminFilterConfig/admin-filter-config.component';
import { WmsAdminTableComponent } from 'components/ngComponents/common/wms-admin-table/wms-admin-table.component';
import { WmsAddModalComponent } from 'components/ngComponents/common/wms-admin-table/wms-add-modal/wms-add-modal.component';
import { WmsEditModalComponent } from 'components/ngComponents/common/wms-admin-table/wms-edit-modal/wms-edit-modal.component';
import { WmsEditUserRolesModalComponent } from 'components/ngComponents/common/wms-admin-table/wms-edit-user-roles-modal/wms-edit-user-roles-modal.component';
import { WmsDeleteModalComponent } from 'components/ngComponents/common/wms-admin-table/wms-delete-modal/wms-delete-modal.component';
import { AdminSidebarComponent } from './components/ngComponents/admin/adminSidebar/adminSidebar.component';
import { SmallBoxComponent } from './components/ngComponents/admin/adminDashboardManagement/small-box/small-box.component';
import { ActiveWmsFilter } from 'pipes/active-wms-filter.pipe';


export function initializeApp(startupService: StartupService) {
  return () => startupService.initApp(); 
}

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MainComponent,
    UserInterfaceComponent,
    KommonitorMapComponent,
    KommonitorLegendComponent,
    KommonitorClassificationComponent,
    ClassificationMethodSelectComponent,
    SidebarComponent,
    KommonitorDataSetupComponent,
    IndicatorMetadataTooltipComponent,
    IndicatorFavFilter,
    IndicatorRadarComponent,
    IndicatorNameFilter,
    RegressionDiagramComponent,
    SelectedIndicatorFilter,
    BaseIndicatorOfComputedIndicatorFilter,
    BaseIndicatorOfHeadlineIndicatorFilter,
    KommonitorDiagramsComponent,
    KommonitorBalanceComponent,
    PoiComponent,
    KommonitorFilterComponent,
    DualListBoxComponent,
    GeoFavFilter,
    TopicOrderSelectionComponent,
    TopicListComponent,
    SortByOrderPipe,
    AddTopicComponent,
    GeoFavItemFilter,
    UserLoginComponent,
    AdminComponent,
    AdminDashboardManagementComponent,
    AdminRoleExplanationComponent,
    AdminTopicsManagementComponent,
    AdminSidebarComponent,
    TopicEditModalComponent,
    AdminSpatialUnitsManagementComponent,
    SpatialUnitAddModalComponent,
    SpatialUnitDeleteModalComponent,
    SpatialUnitEditFeaturesModalComponent,
    SpatialUnitEditMetadataModalComponent,
    SpatialUnitEditUserRolesModalComponent,
    AdminIndicatorsManagementComponent,
    IndicatorAddModalComponent,
    IndicatorDeleteModalComponent,
    IndicatorEditMetadataModalComponent,
    IndicatorBatchUpdateModalComponent,
    IndicatorEditFeaturesModalComponent,
    IndicatorEditIndicatorSpatialUnitRolesModalComponent,
    AdminGeoresourcesManagementComponent,
    GeoresourceAddModalComponent,
    GeoresourceDeleteModalComponent,
    GeoresourceBatchUpdateModalComponent,
    GeoresourceEditMetadataModalComponent,
    GeoresourceEditUserRolesModalComponent,
    GeoresourceEditFeaturesModalComponent,
    SingleFeatureEditComponent,
    AdminAppConfigComponent,
    AdminLandingpageConfigComponent,
    AdminControlsConfigComponent,
    AdminFilterConfigComponent,
    OrderByPipe,
    FilterPipe,
    WmsAdminTableComponent,
    WmsAddModalComponent,
    WmsEditModalComponent,
    WmsEditUserRolesModalComponent,
    WmsDeleteModalComponent,
    ActiveWmsFilter
  ],
  imports: [
    CommonModule,
    BrowserModule, 
    NgbModule,
    FormsModule,
    RouterModule.forRoot(routes),
    HttpClientModule,
    // MathjaxModule.forRoot(),
    ReactiveFormsModule,
    TranslateModule.forRoot({
      defaultLanguage: 'de',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    AgGridAngular,
    KmColorPickerComponent,
    KmLinePatternPickerComponent,
    KmDatePickerComponent,
    PipesModule,
    DragDropModule,
    NgbDropdownModule,
    SmallBoxComponent,
  ],
  providers: [
    StartupService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [StartupService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [MainComponent]
})
export class AppModule {}