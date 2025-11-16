import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MainComponent } from 'mainComponent/main/main.component';
import { CommonModule } from '@angular/common'; 
import { routes } from 'app.routes';
import { RouterModule } from '@angular/router';

import { UserInterfaceComponent } from 'components/ngComponents/userInterface/user-interface.component';
import { KommonitorMapComponent } from 'components/ngComponents/userInterface/kommonitorMap/kommonitor-map.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { StartupService } from 'services/startup-service/startup.service';
import { KommonitorLegendComponent } from 'components/ngComponents/userInterface/kommonitorLegend/kommonitor-legend.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { KommonitorClassificationComponent } from 'components/ngComponents/userInterface/kommonitorClassification/kommonitor-classification.component';
import { ClassificationMethodSelectComponent } from 'components/ngComponents/common/classificationMethodSelect/classification-method-select.component';
import { MathjaxModule } from 'mathjax-angular';

export function initializeApp(startupService: StartupService) {
  return () => startupService.initApp(); 
}

@NgModule({
  declarations: [
    MainComponent,
    UserInterfaceComponent,
    KommonitorMapComponent,
    KommonitorLegendComponent,
    KommonitorClassificationComponent,
    ClassificationMethodSelectComponent
  ],
  imports: [
    CommonModule,
    BrowserModule, 
    NgbModule,
    FormsModule,
    RouterModule.forRoot(routes),
    HttpClientModule,
    MathjaxModule.forRoot(),
  ],
  providers: [
    StartupService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [StartupService],
      multi: true
    }
  ],
  bootstrap: [MainComponent]
})
export class AppModule {}