import { Injector, Injectable } from '@angular/core';
import {kommonitorKeycloackHelperService} from 'util/genericServices/kommonitorKeycloakHelperService/kommonitor-keycloak-helper-service.module';
import {kommonitorReachabilityCoverageReportsHelper} from 'util/genericServices/kommonitorReachabilityCoverageReportsHelperService/kommonitor-reachability-coverage-reports-helper-service.module'

//keycloack helper
  export function kommonitorKeycloackHelperServiceFactory (injector:any){
    return injector.get('kommonitorKeycloackHelperService')
}

export const ajskommonitorKeycloackHelperServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorKeycloackHelperService',
    useFactory:kommonitorKeycloackHelperServiceFactory,
  };

/* 
// reachability scenario helper service - todo
export function kommonitorReachabilityScenarioHelperServiceFactory (injector:any){
  return injector.get('kommonitorReachabilityScenarioHelperService')
}

export const ajskommonitorReachabilityScenarioHelperServiceProvider: any = {
  deps: ['$injector'],
  provide: 'kommonitorReachabilityScenarioHelperService',
  useFactory:kommonitorReachabilityScenarioHelperServiceFactory,
};

// reachability map helper service - todo
export function kommonitorReachabilityMapHelperServiceFactory (injector:any){
  return injector.get('kommonitorReachabilityMapHelperService')
}

export const ajskommonitorReachabilityMapHelperServiceProvider: any = {
  deps: ['$injector'],
  provide: 'kommonitorReachabilityMapHelperService',
  useFactory:kommonitorReachabilityMapHelperServiceFactory,
};

// reachabilityCoverageReportsHelper - todo
export function kommonitorReachabilityCoverageReportsHelperServiceFactory (injector:any){
  return injector.get('kommonitorReachabilityCoverageReportsHelperService')
}

export const ajskommonitorReachabilityCoverageReportsHelperServiceProvider: any = {
  deps: ['$injector'],
  provide: 'kommonitorReachabilityCoverageReportsHelperService',
  useFactory:kommonitorReachabilityCoverageReportsHelperServiceFactory,
};
 */

  export const serviceProviders: any[] = [
    ajskommonitorKeycloackHelperServiceProvider,
   /*  ajskommonitorReachabilityScenarioHelperServiceProvider,
    ajskommonitorReachabilityMapHelperServiceProvider,
    ajskommonitorReachabilityCoverageReportsHelperServiceProvider, */
  ];
