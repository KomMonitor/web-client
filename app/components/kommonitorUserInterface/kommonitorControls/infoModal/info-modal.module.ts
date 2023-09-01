import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoModalComponent } from './info-modal.component';
import { VersionInfoModule } from '../versionInfo/version-info.module';
@NgModule({
declarations:[InfoModalComponent],
imports:[CommonModule,VersionInfoModule],
exports:[InfoModalComponent],
bootstrap:[InfoModalComponent]

})

export class InfoModalModule{

}