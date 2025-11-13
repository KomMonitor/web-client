import { Injector, Injectable } from '@angular/core';
import {kommonitorDataExchangeService} from 'util/genericServices/kommonitorDataExchangeService/kommonitor-data-exchange-service.module';
import {kommonitorKeycloackHelperService} from 'util/genericServices/kommonitorKeycloakHelperService/kommonitor-keycloak-helper-service.module';
import {kommonitorReachabilityCoverageReportsHelper} from 'util/genericServices/kommonitorReachabilityCoverageReportsHelperService/kommonitor-reachability-coverage-reports-helper-service.module'
import {kommonitorSpatialDataProcessorHelper} from 'util/genericServices/kommonitorSpatialDataProcessorHelperService/kommonitor-spatial-data-processor-helper-service.module'

//data exchange
  export function kommonitorDataExchangeServiceFactory (injector:any){
    return injector.get('kommonitorDataExchangeService')
}

export const ajskommonitorDataExchangeServiceeProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorDataExchangeService',
    useFactory:kommonitorDataExchangeServiceFactory,
  };

//keycloack helper
  export function kommonitorKeycloackHelperServiceFactory (injector:any){
    return injector.get('kommonitorKeycloackHelperService')
}

export const ajskommonitorKeycloackHelperServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorKeycloackHelperService',
    useFactory:kommonitorKeycloackHelperServiceFactory,
  };

//single feature map helper
export function kommonitorSingleFeatureMapServiceFactory (injector:any){
    return injector.get('kommonitorSingleFeatureMapService')
}

export const ajskommonitorSingleFeatureMapServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorSingleFeatureMapService',
    useFactory:kommonitorSingleFeatureMapServiceFactory,
  };

// generic map helper service
export function kommonitorGenericMapHelperServiceFactory (injector:any){
  return injector.get('kommonitorGenericMapHelperService')
}

export const ajskommonitorGenericMapHelperServiceProvider: any = {
  deps: ['$injector'],
  provide: 'kommonitorGenericMapHelperService',
  useFactory:kommonitorGenericMapHelperServiceFactory,
};

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

// kommonitorSpatialDataProcessorHelperService - todo
export function kommonitorSpatialDataProcessorHelperServiceFactory (injector:any){
  return injector.get('kommonitorSpatialDataProcessorHelperService')
}

export const ajskommonitorSpatialDataProcessorHelperServiceProvider: any = {
  deps: ['$injector'],
  provide: 'kommonitorSpatialDataProcessorHelperService',
  useFactory:kommonitorSpatialDataProcessorHelperServiceFactory,
};


  export const serviceProviders: any[] = [
    ajskommonitorDataExchangeServiceeProvider,
    ajskommonitorKeycloackHelperServiceProvider,
    ajskommonitorSingleFeatureMapServiceProvider,
    ajskommonitorGenericMapHelperServiceProvider,
    ajskommonitorReachabilityScenarioHelperServiceProvider,
    ajskommonitorReachabilityMapHelperServiceProvider,
    ajskommonitorReachabilityCoverageReportsHelperServiceProvider,
    ajskommonitorSpatialDataProcessorHelperServiceProvider
  ];
