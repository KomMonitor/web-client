var env = {};

// Import variables if present (from env.js)
if(window){
  Object.assign(env, window.__env);
}

// Declare app level module which depends on views, and components
var appModule = angular.module('kommonitorClient', [ 'kommonitorUserInterface' ]);

// Register environment in AngularJS as constant
appModule.constant('__env', env);
