import { Injector, Injectable } from '@angular/core';
import {kommonitorCacheHelperService } from 'util/genericServices/kommonitorCacheHelperService/kommonitor-cache-helper-service.module';
import {kommonitorBatchUpdateHelperService} from 'util/genericServices/kommonitorBatchUpdateHelperService/kommonitor-batch-update-helper-service.module';
import {kommonitorDataExchangeService} from 'util/genericServices/kommonitorDataExchangeService/kommonitor-data-exchange-service.module';
import {kommonitorImporterHelperService} from 'util/genericServices/kommonitorImporterHelperService/kommonitor-importer-helper-service.module';
import {kommonitorKeycloackHelperService} from 'util/genericServices/kommonitorKeycloakHelperService/kommonitor-keycloak-helper-service.module'
import {kommonitorScriptHelperService} from'util/genericServices/kommonitorScriptHelperService/kommonitor-script-helper-service.module';
import {kommonitorShareHelperService} from 'util/genericServices/kommonitorShareHelperService/kommonitor-share-helper-service.module'
import {kommonitorReachabilityCoverageReportsHelper} from 'util/genericServices/kommonitorReachabilityCoverageReportsHelperService/kommonitor-reachability-coverage-reports-helper-service.module'
import {kommonitorSpatialDataProcessorHelper} from 'util/genericServices/kommonitorSpatialDataProcessorHelperService/kommonitor-spatial-data-processor-helper-service.module'
import {kommonitorLeafletScreenshotCacheHelper} from 'util/genericServices/kommonitorLeafletScreenshotCacheHelperService/kommonitor-leaflet-screenshot-cache-helper-service.module'

export function kommonitorCacheHelperServiceFactory(injector:any){
    return injector.get('kommonitorCacheHelperService');
}
export const ajskommonitorCacheHelperServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorCacheHelperService',
    useFactory:kommonitorCacheHelperServiceFactory ,
  };
  

export function kommonitorBatchUpdateHelperServiceFactory (injector:any){
    return injector.get('kommonitorBatchUpdateHelperService')
}

export const ajskommonitorBatchUpdateHelperServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorBatchUpdateHelperService',
    useFactory:kommonitorBatchUpdateHelperServiceFactory ,
  };

//data exchange
  export function kommonitorDataExchangeServiceFactory (injector:any){
    return injector.get('kommonitorDataExchangeService')
}

export const ajskommonitorDataExchangeServiceeProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorDataExchangeService',
    useFactory:kommonitorDataExchangeServiceFactory,
  };

//importer helper
export function kommonitorImporterHelperServiceFactory (injector:any){
    return injector.get('kommonitorImporterHelperService')
}

export const ajskommonitorImporterHelperServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorImporterHelperService',
    useFactory:kommonitorImporterHelperServiceFactory,
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

//script helpet

export function kommonitorScriptHelperServiceFactory (injector:any){
    return injector.get('kommonitorScriptHelperService')
}

export const ajskommonitorScriptHelperServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorScriptHelperService',
    useFactory:kommonitorScriptHelperServiceFactory,
  };
//share Helper
export function kommonitorShareHelperServiceFactory (injector:any){
    return injector.get('kommonitorShareHelperService')
}

export const ajskommonitorShareHelperServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorShareHelperService',
    useFactory:kommonitorShareHelperServiceFactory,
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
  
// map service
export function kommonitorMapServiceFactory (injector:any){
  return injector.get('kommonitorMapService')
}

export const ajskommonitorMapServiceProvider: any = {
  deps: ['$injector'],
  provide: 'kommonitorMapService',
  useFactory:kommonitorMapServiceFactory,
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

// reachability scenario helper service
export function kommonitorReachabilityScenarioHelperServiceFactory (injector:any){
  return injector.get('kommonitorReachabilityScenarioHelperService')
}

export const ajskommonitorReachabilityScenarioHelperServiceProvider: any = {
  deps: ['$injector'],
  provide: 'kommonitorReachabilityScenarioHelperService',
  useFactory:kommonitorReachabilityScenarioHelperServiceFactory,
};

// reachability map helper service
export function kommonitorReachabilityMapHelperServiceFactory (injector:any){
  return injector.get('kommonitorReachabilityMapHelperService')
}

export const ajskommonitorReachabilityMapHelperServiceProvider: any = {
  deps: ['$injector'],
  provide: 'kommonitorReachabilityMapHelperService',
  useFactory:kommonitorReachabilityMapHelperServiceFactory,
};

// reachabilityCoverageReportsHelper
export function kommonitorReachabilityCoverageReportsHelperServiceFactory (injector:any){
  return injector.get('kommonitorReachabilityCoverageReportsHelperService')
}

export const ajskommonitorReachabilityCoverageReportsHelperServiceProvider: any = {
  deps: ['$injector'],
  provide: 'kommonitorReachabilityCoverageReportsHelperService',
  useFactory:kommonitorReachabilityCoverageReportsHelperServiceFactory,
};

// kommonitorSpatialDataProcessorHelperService
export function kommonitorSpatialDataProcessorHelperServiceFactory (injector:any){
  return injector.get('kommonitorSpatialDataProcessorHelperService')
}

export const ajskommonitorSpatialDataProcessorHelperServiceProvider: any = {
  deps: ['$injector'],
  provide: 'kommonitorSpatialDataProcessorHelperService',
  useFactory:kommonitorSpatialDataProcessorHelperServiceFactory,
};

// kommonitorLeafletScreenshotCacheHelperService
export function kommonitorLeafletScreenshotCacheHelperServiceFactory (injector:any){
  return injector.get('kommonitorLeafletScreenshotCacheHelperService')
}

export const ajskommonitorLeafletScreenshotCacheHelperServiceProvider: any = {
  deps: ['$injector'],
  provide: 'kommonitorLeafletScreenshotCacheHelperService',
  useFactory:kommonitorLeafletScreenshotCacheHelperServiceFactory,
};


  export const serviceProviders: any[] = [
    ajskommonitorCacheHelperServiceProvider,
   ajskommonitorBatchUpdateHelperServiceProvider,
    ajskommonitorDataExchangeServiceeProvider,
    ajskommonitorKeycloackHelperServiceProvider,
    ajskommonitorScriptHelperServiceProvider,
    ajskommonitorShareHelperServiceProvider,
    ajskommonitorSingleFeatureMapServiceProvider,
    ajskommonitorMapServiceProvider,
    ajskommonitorGenericMapHelperServiceProvider,
    ajskommonitorReachabilityScenarioHelperServiceProvider,
    ajskommonitorReachabilityMapHelperServiceProvider,
    ajskommonitorReachabilityCoverageReportsHelperServiceProvider,
    ajskommonitorSpatialDataProcessorHelperServiceProvider,
    ajskommonitorLeafletScreenshotCacheHelperServiceProvider
  ];
