import { Injector, Injectable } from '@angular/core';
import {kommonitorElementVisibilityHelperService } from "util/genericServices/kommonitorElementVisibilityHelperService/kommonitor-element-visibility-helper-service.module";
import {kommonitorCacheHelperService } from 'util/genericServices/kommonitorCacheHelperService/kommonitor-cache-helper-service.module';
import {kommonitorBatchUpdateHelperService} from 'util/genericServices/kommonitorBatchUpdateHelperService/kommonitor-batch-update-helper-service.module';
import {kommonitorConfigStorageService} from 'util/genericServices/kommonitorConfigStorageService/kommonitor-config-storage-service.module';
import {kommonitorDataExchangeService} from 'util/genericServices/kommonitorDataExchangeService/kommonitor-data-exchange-service.module';
import {kommonitorDataGridHelperService} from 'util/genericServices/kommonitorDataGridHelperService/kommonitor-data-grid-helper-service.module';
import {kommonitorDiagramHelperService} from 'util/genericServices/kommonitorDiagramHelperService/kommonitor-diagram-helper-service.module';
import {kommonitorFilterHelperService} from 'util/genericServices/kommonitorFilterHelperService/kommonitor-filter-helper-service.module';
import {kommonitorImporterHelperService} from 'util/genericServices/kommonitorImporterHelperService/kommonitor-importer-helper-service.module';
import {kommonitorKeycloackHelperService} from 'util/genericServices/kommonitorKeycloakHelperService/kommonitor-keycloak-helper-service.module'
import {kommonitorMultistepFormHelperService} from 'util/genericServices/kommonitorMultiStepFormHelperService/kommonitor-multi-step-form-helper-service.module'
import {kommonitorScriptHelperService} from'util/genericServices/kommonitorScriptHelperService/kommonitor-script-helper-service.module';
import {kommonitorShareHelperService} from 'util/genericServices/kommonitorShareHelperService/kommonitor-share-helper-service.module'
import {kommonitorSingleFeatureMapHelperService} from 'util/genericServices/kommonitorSingleFeatureMapHelperService/kommonitor-single-feature-map-helper-service.module'
import {kommonitorVisualStyleHelperService} from 'util/genericServices/kommonitorVisualStyleHelperService/kommonitor-visual-style-helper-service.module'

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

  export function kommonitorConfigStorageServiceFactory (injector:any){
    return injector.get('kommonitorConfigStorageService')
}

export const ajskommonitorConfigStorageServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorConfigStorageService',
    useFactory:kommonitorConfigStorageServiceFactory,
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
//data grid helper
  export function kommonitorDataGridHelperServiceFactory (injector:any){
    return injector.get('kommonitorDataGridHelperService')
}

export const ajskommonitorDataGridHelperServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorDataGridHelperService',
    useFactory:kommonitorDataGridHelperServiceFactory,
  };
//diagram helper
  export function kommonitorDiagramHelperServiceFactory (injector:any){
    return injector.get('kommonitorDiagramHelperService')
}

export const ajskommonitorDiagramHelperServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorDiagramHelperService',
    useFactory:kommonitorDiagramHelperServiceFactory,
  };

  //filter helper
  export function kommonitorFilterHelperServiceFactory (injector:any){
    return injector.get('kommonitorFilterHelperService')
}

export const ajskommonitorFilterHelperServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorFilterHelperService',
    useFactory:kommonitorFilterHelperServiceFactory,
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

 //multistep form
 export function kommonitorMultiStepFormHelperServiceFactory (injector:any){
    return injector.get('kommonitorMultiStepFormHelperService')
}

export const ajskommonitorMultiStepFormHelperServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorMultiStepFormHelperService',
    useFactory:kommonitorMultiStepFormHelperServiceFactory,
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



//visually style helper

export function kommonitorVisualStyleHelperServiceFactory (injector:any){
    return injector.get('kommonitorVisualStyleHelperService')
}

export const ajskommonitorVisualStyleHelperServiceProvider: any = {
    deps: ['$injector'],
    provide: 'kommonitorVisualStyleHelperService',
    useFactory:kommonitorVisualStyleHelperServiceFactory,
  };

  
//element visibility helper

export function kommonitorElementVisibilityHelperServiceFactory (injector:any){
  return injector.get('kommonitorElementVisibilityHelperService')
}

export const ajskommonitorElementVisibilityHelperServiceProvider: any = {
  deps: ['$injector'],
  provide: 'kommonitorElementVisibilityHelperService',
  useFactory:kommonitorElementVisibilityHelperServiceFactory,
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

  export const serviceProviders: any[] = [
    ajskommonitorCacheHelperServiceProvider,
   ajskommonitorBatchUpdateHelperServiceProvider,
    ajskommonitorConfigStorageServiceProvider,
    ajskommonitorDataExchangeServiceeProvider,
    ajskommonitorDataGridHelperServiceProvider,
    ajskommonitorDiagramHelperServiceProvider,
    ajskommonitorFilterHelperServiceProvider,
    ajskommonitorKeycloackHelperServiceProvider,
    ajskommonitorMultiStepFormHelperServiceProvider,
    ajskommonitorScriptHelperServiceProvider,
    ajskommonitorShareHelperServiceProvider,
    ajskommonitorSingleFeatureMapServiceProvider,
    ajskommonitorVisualStyleHelperServiceProvider,
    ajskommonitorElementVisibilityHelperServiceProvider,
    ajskommonitorMapServiceProvider
  ];
