import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionInfoComponent } from './version-info.component';// Update the path accordingly
import { ajskommonitorDataExchangeServiceeProvider } from 'app-upgraded-providers';
@NgModule({
  declarations: [
VersionInfoComponent
  ],
  imports: [
    CommonModule,BrowserModule
  ],
  exports: [
    VersionInfoComponent
  ],
  bootstrap:[VersionInfoComponent],
  providers:[ajskommonitorDataExchangeServiceeProvider]
})
export class VersionInfoModule { }

