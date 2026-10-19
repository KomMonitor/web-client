(() => {
  ((/MSIE 9/i.test(navigator.userAgent) ||
    /MSIE 10/i.test(navigator.userAgent) ||
    /rv:11.0/i.test(navigator.userAgent)) &&
    window.alert(
      'Internet Explorer erkannt. Für eine optimale Nutzung von KomMonitor nutzen Sie nach Möglichkeit die Browser Firefox oder Chrome.'
    ),
    /Edge\/\d./i.test(navigator.userAgent) &&
      window.alert(
        'Microsoft Edge erkannt. Für eine optimale Nutzung von KomMonitor nutzen Sie nach Möglichkeit die Browser Firefox oder Chrome.'
      ));
  var e = {};
  window.jsPDF = window.jspdf.jsPDF;
  var o = angular.module('kommonitorClient', [
      'ngRoute',
      'kommonitorUserInterface',
      'kommonitorAdmin',
    ]),
    n = 'ControlsConfigService',
    t = {};
  function r() {
    return $.ajax({
      url: './config/config-storage-server.json',
      success: function (e) {
        var o, n;
        return (
          (window.__env = window.__env || {}),
          (window.__env.configStorageServerConfig = e),
          console.log('dynamically load env.js'),
          ((o = window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_appConfig),
          new Promise(function (e, n) {
            let t = document.createElement('script');
            ((t.src = o),
              (t.type = 'text/javascript'),
              (t.onError = n),
              (t.async = !0),
              (t.onload = e),
              t.addEventListener('error', n),
              t.addEventListener('load', e),
              document.head.appendChild(t));
          }))
            .then(() => {
              console.log('loaded');
            })
            .catch(() => {
              (console.log(
                'Error while loading app config from client config storage server. Will use defaults instead'
              ),
                alert(
                  'Error while loading app config from client config storage server. Will use defaults instead.'
                ));
            }),
          $.when(
            ((n = window.__env.configStorageServerConfig),
            console.log('try to fetch keycloak config file'),
            $.ajax({
              url: n.targetUrlToConfigStorageServer_keycloakConfig,
              success: function (e) {
                (console.log('keycloak config file fetched'), (window.__env.keycloakConfig = e));
              },
              error: function (e, o, n) {
                console.log('Use keycloak.json local backup default values');
              },
            })),
            (function (e) {
              return (
                console.log('try to fetch controls config file'),
                $.ajax({
                  url: e.targetUrlToConfigStorageServer_controlsConfig,
                  success: function (e) {
                    (console.log('controls config file fetched'),
                      (window.__env.controlsConfig = e));
                  },
                  error: function (e, o, n) {
                    console.log(
                      'Use controls-config.json local backup default values that has no widget restrictions.'
                    );
                  },
                })
              );
            })(window.__env.configStorageServerConfig),
            (function (e) {
              return (
                console.log('try to fetch filter config file'),
                $.ajax({
                  url: e.targetUrlToConfigStorageServer_filterConfig,
                  success: function (e) {
                    (console.log('filter config file fetched'), (window.__env.filterConfig = e));
                  },
                  error: function (e, o, n) {
                    console.log(
                      'Use filter-config.json local backup default values that has no widget restrictions.'
                    );
                  },
                })
              );
            })(window.__env.configStorageServerConfig),
            (function (e) {
              return (
                console.log('try to fetch app config file'),
                $.ajax({
                  url: e.targetUrlToConfigStorageServer_appConfig,
                  success: function (e) {
                    (console.log('app config file fetched'), (window.__env.appConfig = e));
                  },
                  error: function (e, o, n) {
                    console.log('Use env.js local backup default values');
                  },
                })
              );
            })(window.__env.configStorageServerConfig)
          ).then(
            function (e, o, n) {
              (console.log('all configs have been loaded'), i(), c());
            },
            function () {
              (console.log(
                'all configs have been loaded - at least some from local backup values. See console log for details'
              ),
                i(),
                c());
            }
          )
        );
      },
    });
  }
  function i() {
    (console.log('Start to initialize required AngularJS components'),
      window && Object.assign(e, window.__env),
      o.constant('__env', e),
      o.directive('mathjaxBind', function () {
        return {
          restrict: 'EA',
          controller: [
            '$scope',
            '$element',
            '$attrs',
            function (e, o, n) {
              e.$watch(n.mathjaxBind, function (e) {
                if (e) {
                  const n = DOMPurify.sanitize(e, { FORBID_TAGS: ['script', 'style'] });
                  (o.html(n), n.includes('$') && MathJax.typesetPromise([o[0]]));
                }
              });
            },
          ],
        };
      }),
      o.filter('unique', function () {
        return function (e, o) {
          var n = [],
            t = [],
            r = o.split('.');
          return (
            angular.forEach(e, function (e) {
              var o = {};
              angular.copy(e, o);
              for (var i = 0; i < r.length; i++) o = o[r[i]];
              -1 === t.indexOf(o) && (t.push(o), n.push(e));
            }),
            n
          );
        };
      }),
      o.service(n, [
        '$http',
        function (e) {
          return (
            (window.__env.config = null),
            {
              promise: e.get('./config/controls-config_backup.json').then(function (e) {
                window.__env.config = window.__env.controlsConfig;
              }),
              setData: function (e) {
                window.__env.config = window.__env.controlsConfig;
              },
              getControlsConfig: function () {
                return window.__env.config;
              },
            }
          );
        },
      ]),
      o
        .config([
          '$routeProvider',
          function (e) {
            e.when('/administration', {
              template: '<kommonitor-admin></kommonitor-admin>',
              resolve: {
                auth: function (e, o, n) {
                  if (window.__env.enableKeycloakSecurity) {
                    if (e.keycloak.authenticated)
                      return (
                        e.keycloak.tokenParsed &&
                          e.keycloak.tokenParsed.realm_access &&
                          e.keycloak.tokenParsed.realm_access.roles &&
                          e.keycloak.tokenParsed.realm_access.roles.some(
                            (e) =>
                              e.endsWith('-creator') ||
                              e.endsWith('-publisher') ||
                              e.endsWith('-editor')
                          ) &&
                          (e.keycloak.showAdminView = !0),
                        !!e.keycloak.showAdminView || o.reject('Not Authenticated')
                      );
                    e.keycloak.login({ redirectUri: n.absUrl() });
                  }
                },
              },
            })
              .when('/', {
                template: '<kommonitor-user-interface></kommonitor-user-interface>',
                resolve: {
                  controlsServiceName: function (e) {
                    return e.promise;
                  },
                },
              })
              .otherwise('/');
          },
        ])
        .run(function (e, o, n) {
          e.$on('$routeChangeError', function (e, n, t) {
            o.path('/');
          });
        }),
      e.enableDebug || (window && (window.console.log = function () {})),
      window.__env.enableKeycloakSecurity &&
        (o.factory('authInterceptor', [
          '$q',
          'Auth',
          function (e, o) {
            return {
              request: function (n) {
                var r = e.defer();
                return o.keycloak.token && a(n.url)
                  ? (o.keycloak
                      .updateToken(5)
                      .then(function () {
                        ((n.headers = n.headers || {}),
                          (n.headers.Authorization = 'Bearer ' + o.keycloak.token),
                          r.resolve(n));
                      })
                      .catch(function () {
                        (r.reject('Failed to refresh token'),
                          console.error('Failed to refresh token. Will redirect to Login screen'),
                          t.keycloak.login());
                      }),
                    r.promise)
                  : n;
              },
            };
          },
        ]),
        o.config([
          '$httpProvider',
          function (e) {
            e.interceptors.push('authInterceptor');
          },
        ])),
      e.encryption.enabled &&
        (o.factory('encryptionInterceptor', [
          '$q',
          function (e) {
            return {
              response: function (e) {
                if (e.data.encryptedData)
                  try {
                    var o = e.data.encryptedData,
                      n = l(o);
                    return ((e.data = n), e);
                  } catch (o) {
                    return (console.error(o), e);
                  }
                return e;
              },
            };
          },
        ]),
        o.config([
          '$httpProvider',
          function (e) {
            e.interceptors.push('encryptionInterceptor');
          },
        ])));
  }
  function c() {
    if (window.__env.enableKeycloakSecurity)
      (e = new Keycloak(
        window.__env.configStorageServerConfig.targetUrlToConfigStorageServer_keycloakConfig
      ))
        .init({ onLoad: 'check-sso', checkLoginIframe: !1, silentCheckSsoFallback: !1 })
        .then(function (n) {
          (console.log(n ? 'User is authenticated!' : 'User is not authenticated!'),
            (t.keycloak = e),
            o.factory('Auth', function () {
              return (console.log(t), t);
            }));
          try {
            (console.debug('Trying to bootstrap application.'),
              angular.bootstrap(document, [o.name]));
          } catch (e) {
            (console.error('Application bootstrapping failed.'), console.error(e));
          }
        })
        .catch(function () {
          (console.log(
            'Failed to initialize authentication adapter. Will try to bootstrap application without keycloak security'
          ),
            alert(
              'Failed to initialize keycloak authentication adapter. Will try to bootstrap application without keycloak security'
            ),
            (window.__env.enableKeycloakSecurity = !1),
            c());
        });
    else {
      var e = new Keycloak(keycloakConfig_forDirectInit);
      ((t.keycloak = e),
        o.factory('Auth', function () {
          return t;
        }));
      try {
        (console.debug('Trying to bootstrap application.'), angular.bootstrap(document, [o.name]));
      } catch (e) {
        (console.error('Application bootstrapping failed.'), console.error(e));
      }
    }
  }
  angular.element(document).ready(function (e) {
    (console.log('start loading required config files'),
      $.when(
        (window.__env.configStorageServerConfig,
        $.ajax({
          url: './config/keycloak_backup.json',
          success: function (e) {
            (console.log('local keycloak config file with default values fetched'),
              (window.__env.keycloakConfig = e));
          },
          error: function (e, o, n) {
            console.log('Error parsing local keycloak.json backup file');
          },
        })),
        (window.__env.configStorageServerConfig,
        $.ajax({
          url: './config/controls-config_backup.json',
          success: function (e) {
            (console.log('local controls-config file with default values fetched'),
              (window.__env.controlsConfig = e));
          },
          error: function (e, o, n) {
            console.log('Error parsing local controlsConfig.json backup file');
          },
        })),
        (window.__env.configStorageServerConfig,
        $.ajax({
          url: './config/filter-config_backup.json',
          success: function (e) {
            (console.log('local filter-config file with default values fetched'),
              (window.__env.filterConfig = e));
          },
          error: function (e, o, n) {
            console.log('Error parsing local filterConfig.json backup file');
          },
        }))
      ).then(
        function (e, o) {
          (console.log(
            'local backup configs have been loaded in case config server is not reachable.'
          ),
            r());
        },
        function () {
          (console.log(
            'all configs have been loaded - at least some from local backup values. See console log for details'
          ),
            r());
        }
      ));
  });
  var a = function (e) {
      return !e.includes('isochrones') && !e.includes('routes') && !e.includes('/public/');
    },
    l = function (o) {
      var n = CryptoJS.SHA256(e.encryption.password),
        t = CryptoJS.enc.Base64.parse(o),
        r = CryptoJS.lib.WordArray.create(t.words.slice(0, e.encryption.ivLength_byte / 4)),
        i = CryptoJS.AES.decrypt(
          {
            ciphertext: CryptoJS.lib.WordArray.create(
              t.words.slice(e.encryption.ivLength_byte / 4)
            ),
          },
          n,
          { iv: r }
        ).toString(CryptoJS.enc.Utf8),
        c = JSON.parse(i);
      return (
        ('string' == typeof c || c instanceof String) &&
          (function (e) {
            if (!('string' == typeof e || e instanceof String)) {
              let o;
              throw (
                null === e
                  ? (o = 'null')
                  : ((o = typeof e),
                    (o =
                      'object' === o && e.constructor && e.constructor.hasOwnProperty('name')
                        ? e.constructor.name
                        : `a ${o}`)),
                new TypeError(`Expected string but received ${o}.`)
              );
            }
            const o = e.length;
            if (!o || o % 4 != 0 || /[^A-Z0-9+\/=]/i.test(e)) return !1;
            const n = e.indexOf('=');
            return -1 === n || n === o - 1 || (n === o - 2 && '=' === e[o - 1]);
          })(c) &&
          ((c = CryptoJS.enc.Base64.parse(c).toString(CryptoJS.enc.Utf8)), (c = JSON.parse(c))),
        c
      );
    };
})();
