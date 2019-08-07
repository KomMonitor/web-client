
if (/MSIE 9/i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent)) {
    // This is internet explorer 9, 10 or 11
    window.alert('Sie verwenden einen veralteten Browser. KomMonitor kann in diesem Browser nicht korrekt dargestellt werden. Bitte nutzen Sie einen modernen Browser. Empfohlen werden Firefox, Chrome.');
}


if (/Edge\/\d./i.test(navigator.userAgent)){
   // This is Microsoft Edge
   window.alert('Sie verwenden Microsoft Edge. KomMonitor wird derzeit in diesem Browser nicht korrekt dargestellt. Bitte nutzen Sie einen anderen modernen Browser. Empfohlen werden Firefox, Chrome. Nach Schließen des Fensters startet die Anwendung, einige Elemente und Funktionen werden jedoch nicht vollständig unterstützt.');
}

var env = {};

// Import variables if present (from env.js)
if(window){
  Object.assign(env, window.__env);
}

// Declare app level module which depends on views, and components
var appModule = angular.module('kommonitorClient', [ 'kommonitorUserInterface' ]);

// Register environment in AngularJS as constant
appModule.constant('__env', env);

if (!env.enableDebug) {
  if(window){
    window.console.log=function(){};
  }
}
