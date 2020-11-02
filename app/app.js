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
          template: '<kommonitor-admin></kommonitor-admin>'
        }).
        otherwise('/');
    }
  ]);

// Register environment in AngularJS as constant
appModule.constant('__env', env);

if (!env.enableDebug) {
  if(window){
    window.console.log=function(){};
  }
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

appModule.factory('encryptionInterceptor', ['$q', function ($q) {
  return {
    response: function (response) {
      // if encrypted, then will look like:
      // {encryptedData: encryptedData}
      // using AES-GCM

      if(env.encryption.enabled && response.data.encryptedData){
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