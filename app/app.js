if (/MSIE 9/i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent)) {
    // This is internet explorer 9, 10 or 11
    window.alert('Internet Explorer erkannt. Für eine optimale Nutzung von KomMonitor nutzen Sie nach Möglichkeit die Browser Firefox oder Chrome.');
}


if (/Edge\/\d./i.test(navigator.userAgent)){
   // This is Microsoft Edge

   window.alert('Microsoft Edge erkannt. Für eine optimale Nutzung von KomMonitor nutzen Sie nach Möglichkeit die Browser Firefox oder Chrome.');
}

var env = {};

// Declare app level module which depends on views, and components
var appModule = angular.module('kommonitorClient', [ 'ngRoute', 'kommonitorUserInterface', 'kommonitorAdmin']);

var controlsServiceName = 'ControlsConfigService';
var auth = {};


/*
 LOAD CONFIG FILES FROM CONFIG STORAGE SERVER
*/
function ajaxCall_keycloakConfig(configStorageServerConfig) {
  console.log("try to fetch keycloak config file");
  return  $.ajax({
      url: configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig,
      success: function(result){
        console.log("keycloak config file fetched");
        window.__env.keycloakConfig = result;
        return;
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) { 
        console.log("Use keycloak.json local backup default values");
      }
  });
}  

function ajaxCall_appConfig(configStorageServerConfig) {
  console.log("try to fetch app config file");
  return  $.ajax({
      url: configStorageServerConfig.targetUrlToConfigStorageServer_appConfig,
      success: function(result){
        console.log("app config file fetched");
        window.__env.appConfig = result;
        return;
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) { 
        console.log("Use env.js local backup default values");
      } 
  });
}  

function ajaxCall_controlsConfig(configStorageServerConfig) {
  console.log("try to fetch controls config file");
  return  $.ajax({
      url: configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig,
      success: function(result){
        console.log("controls config file fetched");
        window.__env.controlsConfig = result;
        return; 
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) { 
        console.log("Use controls-config.json local backup default values that has no widget restrictions.");
      }
  });
}  


/*
 LOAD CONFIG FILES FROM LOCAL BACKUP FILES
*/
function ajaxCall_keycloakConfig_localBackup(configStorageServerConfig) {
  return  $.ajax({
    url: "./config/keycloak_backup.json",
    success: function(result){
      console.log("local keycloak config file with default values fetched");
      window.__env.keycloakConfig = result;
      return;
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) { 
      console.log("Error parsing local keycloak.json backup file");
    }
});
}  

function ajaxCall_controlsConfig_localBackup(configStorageServerConfig) {
  return  $.ajax({
    url: "./config/controls-config_backup.json",
    success: function(result){
      console.log("local controls-config file with default values fetched");
      window.__env.controlsConfig = result;
      return;
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) { 
      console.log("Error parsing local controlsConfig.json backup file");
    }
});
}  


function loadAppConfigScriptDynamically(scriptUrl){
  return new Promise(function (res, rej) {
   let script = document.createElement('script');
   script.src = scriptUrl;
   script.type = 'text/javascript';
   script.onError = rej;
   script.async = true;
   script.onload = res;
   script.addEventListener('error',rej);
   script.addEventListener('load',res);
   document.head.appendChild(script);
  }); 
}

function ajaxCall_configServerFile() {
  return  $.ajax({
      url: "./config/config-storage-server.json",
      success: function(result){
        window.__env = window.__env || {};
        window.__env.configStorageServerConfig = result;

        // inject script tag dynamically to DOM to load ENV variables
        console.log("dynamically load env.js");
        const event = loadAppConfigScriptDynamically(window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig)
          .then(() => { console.log("loaded"); })
          .catch(() => { 
            console.log("Error while loading app config from client config storage server. Will use defaults instead"); 
            alert("Error while loading app config from client config storage server. Will use defaults instead.");
        });
    

        return $.when(ajaxCall_keycloakConfig(window.__env.configStorageServerConfig), ajaxCall_controlsConfig(window.__env.configStorageServerConfig), ajaxCall_appConfig(window.__env.configStorageServerConfig)).then(function(ajax1Results,ajax2Results, ajax3Results){
          console.log("all configs have been loaded");

          initAngularComponents();

          bootstrapApplication();
          
          return;
        }, function(){
          // on fail
          console.log("all configs have been loaded - at least some from local backup values. See console log for details");

          initAngularComponents();

          bootstrapApplication();
          
          return;
        });
      }
  });
}  

var loadConfigsThenApp = function(){

  console.log("start loading required config files");

  $.when(ajaxCall_keycloakConfig_localBackup(window.__env.configStorageServerConfig), ajaxCall_controlsConfig_localBackup(window.__env.configStorageServerConfig)).then(function(ajax1Results,ajax2Results){
    console.log("local backup configs have been loaded in case config server is not reachable.");

    ajaxCall_configServerFile();

  }, function(){
    // on fail
    console.log("all configs have been loaded - at least some from local backup values. See console log for details");

    ajaxCall_configServerFile();
  });

};

function initAngularComponents(){
  console.log("Start to initialize required AngularJS components");

  // Import variables if present (from env.js)
  if(window){
    Object.assign(env, window.__env);
  }

  // Register environment in AngularJS as constant
  appModule.constant('__env', env);

  // MathJx directive
  appModule.directive("mathjaxBind", function () {
    return {
      restrict: "EA",
      controller: [
        "$scope",
        "$element",
        "$attrs",
        function ($scope, $element, $attrs) {
          $scope.$watch($attrs.mathjaxBind, function (texExpression) {
            $element.html(texExpression);
            // only if texExpression contains the special character '$' which is used to mark tex code
            // then call MathJax function
            if(texExpression && texExpression.includes("$")){
              MathJax.typesetPromise([$element[0]]);
            }            
          });
        },
      ],
    };
  });

  // custom unique filter
  appModule.filter('unique', function() {
    return function(collection, primaryKey) { //no need for secondary key
      var output = [], 
          keys = [];
          var splitKeys = primaryKey.split('.'); //split by period


      angular.forEach(collection, function(item) {
            var key = {};
            angular.copy(item, key);
            for(var i=0; i<splitKeys.length; i++){
                key = key[splitKeys[i]];    //the beauty of loosely typed js :)
            }

            if(keys.indexOf(key) === -1) {
              keys.push(key);
              output.push(item);
            }
      });

      return output;
    };
  });

  appModule.service(controlsServiceName, ['$http', function($http) {
    window.__env.config = null;
  
    // var resourcePath = window.__env.configStorageServerConfig ? window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_controlsConfig : './config/controls-config_backup.json';
    var resourcePath = './config/controls-config_backup.json';
    var promise = $http.get(resourcePath).then(function (response) {
      // window.__env.config = response.data;
      window.__env.config = window.__env.controlsConfig;
    });
  
    return {
      promise:promise,
      setData: function (response) {
        window.__env.config = window.__env.controlsConfig;
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
  

    if (!env.enableDebug) {
      if(window){
        window.console.log=function(){};
      }
    }

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
    
}

function bootstrapApplication(){

  /*
    var keycloak = new Keycloak({
      url: 'http://keycloak-server/auth',
      realm: 'myrealm',
      clientId: 'myapp'
    });
  */
  var keycloakConfig_forDirectInit = {
    "url": window.__env.keycloakConfig["auth-server-url"],
    "realm": window.__env.keycloakConfig["realm"],
    "clientId": window.__env.keycloakConfig["resource"]
  };
  
  if(window.__env.enableKeycloakSecurity){
    var keycloakAdapter = new Keycloak(keycloakConfig_forDirectInit);  
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
      console.log('Failed to initialize authentication adapter. Will try to bootstrap application without keycloak security');
      alert('Failed to initialize keycloak authentication adapter. Will try to bootstrap application without keycloak security');
      window.__env.enableKeycloakSecurity = false;
      bootstrapApplication();
    });
  }
  else{
    var keycloakAdapter = new Keycloak(keycloakConfig_forDirectInit);  
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

}

angular.element(document).ready(function ($http) {

  // load configs before doing anything else
  loadConfigsThenApp();
});

var isNotUrlThatUsesOwnAuth = function(url){
  // /admin/ is used to make admin requests against keycloak
  if (url.includes("/admin/")){
    return false;
  }
  
  return true;
};



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


