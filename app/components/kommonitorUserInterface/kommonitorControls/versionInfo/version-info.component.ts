
import { Component, OnInit } from '@angular/core';
//import { KommonitorDataExchangeService } from '../../../../util/genericServices/kommonitorDataExchangeService' // Update the path accordingly

declare var $:any;
@Component({
  selector: 'version-info',
  templateUrl: 'version-info.template.html', 
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
