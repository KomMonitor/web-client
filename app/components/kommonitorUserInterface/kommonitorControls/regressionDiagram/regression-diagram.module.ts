import { NgModule } from '@angular/core';
import { ajskommonitorDiagramHelperServiceProvider } from 'app-upgraded-providers';
import { ajskommonitorDataExchangeServiceeProvider } from 'app-upgraded-providers';
@NgModule({
  imports: [
 
  ],
  declarations: [], // Add your module-level components, directives, or pipes here
  providers: [ajskommonitorDiagramHelperServiceProvider,ajskommonitorDataExchangeServiceeProvider], 
})
export class RegressionDiagramModule { }
