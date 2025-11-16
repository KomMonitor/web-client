import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from 'services/auth-service/auth.service';
import { KeycloakHelperService } from 'services/keycloak-helper-service/keycloak-helper.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  private env: any = {};

  constructor(
  ) {}

  async ngOnInit() {

    this.checkBrowser();

    // instantiate env variable 
    this.env = window.__env || {};

    // Initialize TranslateService
    //this.initializeTranslateService();

    // initialize kommonitorClient module
    //await this.initKomMonitorClientModule();

    // init keycloak authentication
    
  
    //this.upgrade.bootstrap(document.documentElement, ['kommonitorClient']);
    // setUpLocationSync(this.upgrade);

    // fix for route-mismatch. to be rebuild/deleted with routeModule implementation // todo
   /*  if(window.location.href.includes('administration#!'))
      location.href = `${window.location.origin}/administration#!/administration`; */
  }

  private checkBrowser(): void {
    if (/MSIE 9/i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent)) {
      // This is internet explorer 9, 10 or 11
      window.alert('Internet Explorer erkannt. Für eine optimale Nutzung von KomMonitor nutzen Sie nach Möglichkeit die Browser Firefox oder Chrome.');
    }


    if (/Edge\/\d./i.test(navigator.userAgent)) {
      // This is Microsoft Edge

      window.alert('Microsoft Edge erkannt. Für eine optimale Nutzung von KomMonitor nutzen Sie nach Möglichkeit die Browser Firefox oder Chrome.');
    }
  }


  
}
