
import { Component, OnInit } from '@angular/core';
//import { KommonitorDataExchangeService } from '../../../../util/genericServices/kommonitorDataExchangeService' // Update the path accordingly
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
declare var $:any;
@Component({
  selector: 'versionInfo',
  templateUrl: 'version-info.template.html', 
  standalone:true,
  imports:[NgbCollapseModule]// Update the template URL
})
export class VersionInfoComponent implements OnInit {
public isCollapsed=false;
  constructor(
   // private kommonitorDataExchangeService: KommonitorDataExchangeService
  ) {}

  ngOnInit(): void {
    // Initialize any adminLTE box widgets
	this.initializeBoxWidget();
}

private initializeBoxWidget(): void {
  $('.box').boxWidget();
}

}
