// definition of KomMonitor root module kommonitorClient
// its remaining definitions and enhancements like providers, services, constants or factories
// are added to the module declaration in app.module.ts
// --> there some KomMonizot config files are fetched and applied 
// prior to instantiating and bootstrapping the module 
angular.module('kommonitorClient', ['ngRoute', 'kommonitorUserInterface', 'kommonitorAdmin']);