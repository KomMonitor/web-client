if (/MSIE 9/i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent)) {
    // This is internet explorer 9, 10 or 11
    window.alert('Internet Explorer erkannt. Für eine optimale Nutzung von KomMonitor nutzen Sie nach Möglichkeit die Browser Firefox oder Chrome.');
}


if (/Edge\/\d./i.test(navigator.userAgent)){
   // This is Microsoft Edge

   window.alert('Microsoft Edge erkannt. Für eine optimale Nutzung von KomMonitor nutzen Sie nach Möglichkeit die Browser Firefox oder Chrome.');
}

var env = {};

// Import variables if present (from env.js)
if(window){
  Object.assign(env, window.__env);
}

// Declare app level module which depends on views, and components
var appModule = angular.module('kommonitorClient', [ 'ngRoute', 'kommonitorUserInterface', 'kommonitorAdmin']);

appModule.
  config(['$routeProvider',
    function config($routeProvider) {
      $routeProvider.
        when('/', {
          template: '<kommonitor-user-interface></kommonitor-user-interface>'
        }).
        when('/administration', {
          template: '<kommonitor-admin></kommonitor-admin>',
          resolve: {
            'auth': function(Auth, $q, $location) { 
              if (Auth.keycloak.authenticated) {
                if (Auth.keycloak.tokenParsed.realm_access.roles.includes('administrator')) {
                  return true;
                } else {
                  return $q.reject('Not Authenticated');
                }
                
              }
              else {
                Auth.keycloak.login({
                  redirectUri: $location.absUrl()
                });
              }
            }
          }
        }).
        otherwise('/');
    }
  ])
  .run( function($rootScope, $location, Auth) {
    // register listener to watch route changes
    $rootScope.$on( "$routeChangeError", function(event, next, current) {
        $location.path( "/" );
    });
  });

// Register environment in AngularJS as constant
appModule.constant('__env', env);

if (!env.enableDebug) {
  if(window){
    window.console.log=function(){};
  }
}

var auth = {};

angular.element(document).ready(function ($http) {
  var keycloakAdapter = new Keycloak();
  keycloakAdapter.init({
    onLoad: 'check-sso',
  }).then(function (authenticated) {
    console.log(authenticated ? 'User is authenticated!' : 'User is not authenticated!');
    auth.keycloak = keycloakAdapter;
    appModule.factory('Auth', function () {
      return auth;
    })
    try {
      console.debug('Trying to bootstrap application.');
      angular.bootstrap(document, [appModule.name]);
    }
    catch (e) {
      console.error('Application bootstrapping failed.');
      console.error(e);
    }
  }).catch(function () {
    console.log('Failed to initialize authentication adapter');
  });

});

appModule.factory('authInterceptor', function ($q, Auth) {
  return {
    request: function (config) {
      var deferred = $q.defer();
      if (Auth.keycloak.token) {
        Auth.keycloak.updateToken(5).then(function () {
          config.headers = config.headers || {};
          config.headers.Authorization = 'Bearer ' + Auth.keycloak.token;
          deferred.resolve(config);
        }).catch(function () {
          deferred.reject('Failed to refresh token');
        });
        return deferred.promise;
      } else {
        return config;
      }
    }
  };
});

appModule.config(function ($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
});