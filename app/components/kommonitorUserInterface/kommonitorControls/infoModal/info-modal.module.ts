import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoModalComponent } from './info-modal.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { VersionInfoModule } from '../versionInfo/version-info.module';
@NgModule({
declarations:[InfoModalComponent],
imports:[CommonModule,NgbModule,VersionInfoModule],
exports:[InfoModalComponent]

})

export class InfoModalModule{

}