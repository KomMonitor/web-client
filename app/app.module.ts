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
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { MathjaxModule } from 'mathjax-angular';
import { AdminComponent } from 'components/ngComponents/admin/admin.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AgGridAngular } from 'ag-grid-angular';
import { KmColorPickerComponent } from 'components/ngComponents/customElements/color-picker/km-color-picker.component';
import { KmLinePatternPickerComponent } from 'components/ngComponents/customElements/line-pattern-picker/km-line-pattern-picker.component';
import { KmDatePickerComponent } from 'components/ngComponents/customElements/date-picker/km-date-picker.component';
import { AuthInterceptor } from 'util/interceptors/auth.interceptor';
import { OrderByPipe } from 'pipes/order-by.pipe';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SmallBoxComponent } from './components/ngComponents/admin/adminDashboardManagement/small-box/small-box.component';
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
import { KommonitorLegendComponent } from 'components/ngComponents/userInterface/kommonitorLegend/kommonitor-legend.component';
import { SidebarComponent } from 'components/ngComponents/userInterface/sidebar/sidebar.component';
import { UserLoginComponent } from 'components/ngComponents/userInterface/userLogin/user-login.component';


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
    OrderByPipe
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
    DragDropModule,
    NgbDropdownModule,
    NgbAccordionButton,
    NgbAccordionDirective,
    NgbAccordionItem,
    NgbAccordionHeader,
    NgbAccordionToggle,
    NgbAccordionBody,
    NgbAccordionCollapse,
    SmallBoxComponent,
    ExpandableBoxComponent,
    KommonitorLegendComponent,
    SidebarComponent,
    ExpandableBoxComponent,
    AdminComponent,
    UserLoginComponent
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
  bootstrap: [MainComponent],
  exports: [
  ]
})
export class AppModule {}