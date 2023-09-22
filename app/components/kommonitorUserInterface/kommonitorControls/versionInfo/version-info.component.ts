
import { Component, Inject, OnInit } from '@angular/core';

import { kommonitorDataExchangeService } from 'util/genericServices/kommonitorDataExchangeService/kommonitor-data-exchange-service.module';
import { environment } from 'env_backup';
import { kommonitorBatchUpdateHelperService } from 'util/genericServices/kommonitorBatchUpdateHelperService/kommonitor-batch-update-helper-service.module';
import { ajskommonitorDataExchangeServiceeProvider} from 'app-upgraded-providers';
@Component({
  selector: 'version-info',
  templateUrl: 'version-info.template.html', 
  providers:[ajskommonitorDataExchangeServiceeProvider]
})
export class VersionInfoComponent implements OnInit {
public isCollapsed=false;
  constructor(@Inject('kommonitorDataExchangeService') private kommonitorDataExchangeService: any)
   {
   }

  ngOnInit(): void {
    this.kommonitorDataExchangeService =  kommonitorDataExchangeService;
    // Initialize any adminLTE box widgets
	this.initializeBoxWidget();
}

private initializeBoxWidget(): void {
  (<any>$('.box')).boxWidget();
}


}
