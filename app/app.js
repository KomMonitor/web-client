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

var controlsServiceName = 'ControlsConfigService';

appModule.service(controlsServiceName, ['$http', function($http) {
  window.__env.config = null;

  var promise = $http.get('controls-config.json').then(function (response) {
    window.__env.config = response.data;
  });

  return {
    promise:promise,
    setData: function (response) {
      window.__env.config = response.data;
    },
    getControlsConfig: function () {
        return window.__env.config;
    }
  };
}]);

appModule.
  config(['$routeProvider',
    function config($routeProvider) {
      $routeProvider.
        when('/', {
          template: '<kommonitor-user-interface></kommonitor-user-interface>',
          resolve: {
            controlsServiceName: function(ControlsConfigService){
              return ControlsConfigService.promise;
            }
          }
        }).
        when('/administration', {
          template: '<kommonitor-admin></kommonitor-admin>',
          resolve: {
            'auth': function(Auth, $q, $location) { 
              if(window.__env.enableKeycloakSecurity){
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
              else{

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
  if(window.__env.enableKeycloakSecurity){
    var keycloakAdapter = new Keycloak();  
    keycloakAdapter.init({
      onLoad: 'check-sso',
    }).then(function (authenticated) {
      console.log(authenticated ? 'User is authenticated!' : 'User is not authenticated!');
      auth.keycloak = keycloakAdapter;
      appModule.factory('Auth', function () {
        return auth;
      });
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
  }
  else{
    var keycloakAdapter = new Keycloak();  
      auth.keycloak = keycloakAdapter;
      appModule.factory('Auth', function () {
        return auth;
      });

      try {
        console.debug('Trying to bootstrap application.');
        angular.bootstrap(document, [appModule.name]);
      }
      catch (e) {
        console.error('Application bootstrapping failed.');
        console.error(e);
      }  
  }
  

});

var isNotUrlThatUsesOwnAuth = function(url){
  // /admin/ is used to make admin requests against keycloak
  if (url.includes("/admin/")){
    return false;
  }
  
  return true;
};

if(window.__env.enableKeycloakSecurity){
  appModule.factory('authInterceptor', ['$q', 'Auth', function ($q, Auth) {
    return {
      request: function (config) {
        var deferred = $q.defer();
        if (Auth.keycloak.token && isNotUrlThatUsesOwnAuth(config.url)) {
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
  }]);

  appModule.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  }]);
}

var isBase64 = function(str) {
  var notBase64 = /[^A-Z0-9+\/=]/i;
  const isString = (typeof str === 'string' || str instanceof String);

  if (!isString) {
    let invalidType;
    if (str === null) {
      invalidType = 'null';
    } else {
      invalidType = typeof str;
      if (invalidType === 'object' && str.constructor && str.constructor.hasOwnProperty('name')) {
        invalidType = str.constructor.name;
      } else {
        invalidType = `a ${invalidType}`;
      }
    }
    throw new TypeError(`Expected string but received ${invalidType}.`);
  }

  const len = str.length;
  if (!len || len % 4 !== 0 || notBase64.test(str)) {
    return false;
  }
  const firstPaddingChar = str.indexOf('=');
  return firstPaddingChar === -1 ||
    firstPaddingChar === len - 1 ||
    (firstPaddingChar === len - 2 && str[len - 1] === '=');

};

var decryptAesCBC = function(encryptedString){

  var hashedKey = CryptoJS.SHA256(env.encryption.password);

    // from BASE64 encoded encrypted string
    var encryptedWordArray = CryptoJS.enc.Base64.parse(encryptedString);

    // get IV from beginning
    var iv = CryptoJS.lib.WordArray.create(
      encryptedWordArray.words.slice(0, (env.encryption.ivLength_byte) / 4 )
    );
    
    var decrypted = CryptoJS.AES.decrypt(
      {
        ciphertext: CryptoJS.lib.WordArray.create(
          encryptedWordArray.words.slice(env.encryption.ivLength_byte / 4)
        )
      },
      hashedKey,
      {iv: iv}
    );
    
    var decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

    var decryptedJson = JSON.parse(decryptedString);

    // sometimes a response might still be BASE64 encoded in addition
    // if so, then resolve that
    if((typeof decryptedJson === 'string' || decryptedJson instanceof String) && isBase64(decryptedJson)){
      decryptedJson = CryptoJS.enc.Base64.parse(decryptedJson).toString(CryptoJS.enc.Utf8);
      decryptedJson = JSON.parse(decryptedJson);
    }

    return decryptedJson;    
};

if(env.encryption.enabled){
  appModule.factory('encryptionInterceptor', ['$q', function ($q) {
    return {
      response: function (response) {
        // if encrypted, then will look like:
        // {encryptedData: encryptedData}
        // using AES-CBC
  
        if(response.data.encryptedData){
          try {
            var encryptedString = response.data.encryptedData;
  
            var decryptedJson = decryptAesCBC(encryptedString);
  
            response.data = decryptedJson;
  
            return response;
          } catch (error) {
            console.error(error);
            return response;
          }      
        }
  
        return response;
      },
    };
  }]);
  
  appModule.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('encryptionInterceptor');
  }]);
}

