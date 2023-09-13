export function kommonitorCacheHelperServiceFactory(injector) {
    return injector.get('kommonitorCacheHelperService');
}
export const ajskommonitorCacheHelperServiceProvider = {
    deps: ['$injector'],
    provide: 'kommonitorCacheHelperService',
    useFactory: kommonitorCacheHelperServiceFactory,
};
export function kommonitorBatchUpdateHelperServiceFactory(injector) {
    return injector.get('kommonitorBatchUpdateHelperService');
}
export const ajskommonitorBatchUpdateHelperServiceProvider = {
    deps: ['$injector'],
    provide: 'kommonitorBatchUpdateHelperService',
    useFactory: kommonitorBatchUpdateHelperServiceFactory,
};
export function kommonitorConfigStorageServiceFactory(injector) {
    return injector.get('kommonitorConfigStorageService');
}
export const ajskommonitorConfigStorageServiceProvider = {
    deps: ['$injector'],
    provide: 'kommonitorConfigStorageService',
    useFactory: kommonitorConfigStorageServiceFactory,
};
//data exchange
export function kommonitorDataExchangeServiceFactory(injector) {
    return injector.get('kommonitorDataExchangeService');
}
export const ajskommonitorDataExchangeServiceeProvider = {
    deps: ['$injector'],
    provide: 'kommonitorDataExchangeService',
    useFactory: kommonitorDataExchangeServiceFactory,
};
//data grid helper
export function kommonitorDataGridHelperServiceFactory(injector) {
    return injector.get('kommonitorDataGridHelperService');
}
export const ajskommonitorDataGridHelperServiceProvider = {
    deps: ['$injector'],
    provide: 'kommonitorDataGridHelperService',
    useFactory: kommonitorDataGridHelperServiceFactory,
};
//diagram helper
export function kommonitorDiagramHelperServiceFactory(injector) {
    return injector.get('kommonitorDiagramHelperService');
}
export const ajskommonitorDiagramHelperServiceProvider = {
    deps: ['$injector'],
    provide: 'kommonitorDiagramHelperService',
    useFactory: kommonitorDiagramHelperServiceFactory,
};
//filter helper
export function kommonitorFilterHelperServiceFactory(injector) {
    return injector.get('kommonitorFilterHelperService');
}
export const ajskommonitorFilterHelperServiceProvider = {
    deps: ['$injector'],
    provide: 'kommonitorFilterHelperService',
    useFactory: kommonitorFilterHelperServiceFactory,
};
//keycloack helper
export function kommonitorKeycloackHelperServiceFactory(injector) {
    return injector.get('kommonitorKeycloackHelperService');
}
export const ajskommonitorKeycloackHelperServiceProvider = {
    deps: ['$injector'],
    provide: 'kommonitorKeycloackHelperService',
    useFactory: kommonitorKeycloackHelperServiceFactory,
};
//multistep form
export function kommonitorMultiStepFormHelperServiceFactory(injector) {
    return injector.get('kommonitorMultiStepFormHelperService');
}
export const ajskommonitorMultiStepFormHelperServiceProvider = {
    deps: ['$injector'],
    provide: 'kommonitorMultiStepFormHelperService',
    useFactory: kommonitorMultiStepFormHelperServiceFactory,
};
//script helpet
export function kommonitorScriptHelperServiceFactory(injector) {
    return injector.get('kommonitorScriptHelperService');
}
export const ajskommonitorScriptHelperServiceProvider = {
    deps: ['$injector'],
    provide: 'kommonitorScriptHelperService',
    useFactory: kommonitorScriptHelperServiceFactory,
};
//share Helper
export function kommonitorShareHelperServiceFactory(injector) {
    return injector.get('kommonitorShareHelperService');
}
export const ajskommonitorShareHelperServiceProvider = {
    deps: ['$injector'],
    provide: 'kommonitorShareHelperService',
    useFactory: kommonitorShareHelperServiceFactory,
};
//single feature map helper
export function kommonitorSingleFeatureMapServiceFactory(injector) {
    return injector.get('kommonitorSingleFeatureMapService');
}
export const ajskommonitorSingleFeatureMapServiceProvider = {
    deps: ['$injector'],
    provide: 'kommonitorSingleFeatureMapService',
    useFactory: kommonitorSingleFeatureMapServiceFactory,
};
//visually style helper
export function kommonitorVisualStyleHelperServiceFactory(injector) {
    return injector.get('kommonitorVisualStyleHelperService');
}
export const ajskommonitorVisualStyleHelperServiceProvider = {
    deps: ['$injector'],
    provide: 'kommonitorVisualStyleHelperService',
    useFactory: kommonitorVisualStyleHelperServiceFactory,
};
export const serviceProviders = [
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
    ajskommonitorVisualStyleHelperServiceProvider
];
//# sourceMappingURL=app-upgraded-providers.js.map