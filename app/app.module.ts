import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MainComponent } from 'mainComponent/main/main.component';
import { CommonModule } from '@angular/common'; 
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
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AgGridAngular } from 'ag-grid-angular';
import { KmColorPickerComponent } from 'components/ngComponents/customElements/color-picker/km-color-picker.component';
import { KmLinePatternPickerComponent } from 'components/ngComponents/customElements/line-pattern-picker/km-line-pattern-picker.component';
import { KmDatePickerComponent } from 'components/ngComponents/customElements/date-picker/km-date-picker.component';
import { AuthInterceptor } from 'util/interceptors/auth.interceptor';
import { OrderByPipe } from 'pipes/order-by.pipe';
import { PipesModule } from 'pipes.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AdminSidebarComponent } from './components/ngComponents/admin/adminSidebar/adminSidebar.component';
import { ActiveWmsFilter } from 'pipes/active-wms-filter.pipe';
import { ExpandableBoxComponent } from './components/ngComponents/common/expandable-box/expandable-box.component';

import {
	NgbAccordionButton,
	NgbAccordionDirective,
	NgbAccordionItem,
	NgbAccordionHeader,
	NgbAccordionToggle,
	NgbAccordionBody,
	NgbAccordionCollapse,
} from '@ng-bootstrap/ng-bootstrap';


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
    GeoFavItemFilter,
    AdminComponent,
    OrderByPipe,
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
    NgbAccordionButton,
    NgbAccordionDirective,
    NgbAccordionItem,
    NgbAccordionHeader,
    NgbAccordionToggle,
    NgbAccordionBody,
    NgbAccordionCollapse,
    UserLoginComponent,
    ExpandableBoxComponent,
    AdminSidebarComponent,
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