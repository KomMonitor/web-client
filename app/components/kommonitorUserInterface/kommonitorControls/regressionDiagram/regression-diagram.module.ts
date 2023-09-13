import { NgModule } from '@angular/core';
import { kommonitorDataExchangeServiceFactory } from 'app-upgraded-providers'; 
import { kommonitorDiagramHelperServiceFactory } from 'app-upgraded-providers';
@NgModule({
  imports: [
 kommonitorDiagramHelperServiceFactory,
 kommonitorDataExchangeServiceFactory
  ],
  declarations: [], // Add your module-level components, directives, or pipes here
  providers: [], 
})
export class RegressionDiagramModule { }
