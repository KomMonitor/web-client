import { ajskommonitorConfigStorageServiceProvider } from '../../app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigStorageService {

  pipedData!:any;
  
  public constructor(
      @Inject('kommonitorConfigStorageService') private ajskommonitorConfigStorageServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorConfigStorageServiceProvider;
  }

  getControlsConfig() {
    return this.ajskommonitorConfigStorageServiceProvider.getControlsConfig();
  }
}
