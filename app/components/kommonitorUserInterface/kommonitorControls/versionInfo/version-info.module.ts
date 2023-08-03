
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionInfoComponent } from './version-info.component'; // Update the path accordingly
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,NgbModule,VersionInfoComponent
  ],
  exports: [
    VersionInfoComponent,
  ]
})
export class VersionInfoModule { }

