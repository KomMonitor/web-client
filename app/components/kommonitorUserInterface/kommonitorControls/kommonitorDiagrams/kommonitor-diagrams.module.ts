import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ajskommonitorDataExchangeServiceeProvider } from 'app-upgraded-providers';
import { ajskommonitorDiagramHelperServiceProvider } from 'app-upgraded-providers';
import { KommonitorDiagramsComponent } from './kommonitor-diagrams.component';
@NgModule({
declarations:[KommonitorDiagramsComponent],
imports:[CommonModule],
exports:[KommonitorDiagramsComponent],
providers:[ajskommonitorDataExchangeServiceeProvider, ajskommonitorDiagramHelperServiceProvider],
bootstrap:[KommonitorDiagramsComponent]
})
export class KommonitorDiagramsModule {}
