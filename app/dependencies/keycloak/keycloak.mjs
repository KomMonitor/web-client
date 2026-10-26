import e from 'js-sha256';
import { jwtDecode as t } from 'jwt-decode';
if ('undefined' == typeof Promise)
  throw Error(
    'Keycloak requires an environment that supports Promises. Make sure that you include the appropriate polyfill.'
  );
function r(n) {
  if (!(this instanceof r))
    throw new Error("The 'Keycloak' constructor must be invoked with 'new'.");
  for (
    var o,
      i,
      s = this,
      a = [],
      c = { enable: !0, callbackList: [], interval: 5 },
      u = document.getElementsByTagName('script'),
      d = 0;
    d < u.length;
    d++
  )
    (-1 === u[d].src.indexOf('keycloak.js') && -1 === u[d].src.indexOf('keycloak.min.js')) ||
      -1 === u[d].src.indexOf('version=') ||
      (s.iframeVersion = u[d].src.substring(u[d].src.indexOf('version=') + 8).split('&')[0]);
  var l = !0,
    f = A(console.info),
    p = A(console.warn);
  function h(e, t) {
    for (
      var r = (function (e) {
          var t = null,
            r = window.crypto || window.msCrypto;
          if (r && r.getRandomValues && window.Uint8Array)
            return ((t = new Uint8Array(e)), r.getRandomValues(t), t);
          t = new Array(e);
          for (var n = 0; n < t.length; n++) t[n] = Math.floor(256 * Math.random());
          return t;
        })(e),
        n = new Array(e),
        o = 0;
      o < e;
      o++
    )
      n[o] = t.charCodeAt(r[o] % t.length);
    return String.fromCharCode.apply(null, n);
  }
  function m() {
    return void 0 !== s.authServerUrl
      ? '/' == s.authServerUrl.charAt(s.authServerUrl.length - 1)
        ? s.authServerUrl + 'realms/' + encodeURIComponent(s.realm)
        : s.authServerUrl + '/realms/' + encodeURIComponent(s.realm)
      : void 0;
  }
  function g(e, t) {
    var r = e.code,
      n = e.error,
      o = e.prompt,
      i = new Date().getTime();
    if ((e.kc_action_status && s.onActionUpdate && s.onActionUpdate(e.kc_action_status), n))
      if ('none' != o)
        if (e.error_description && 'authentication_expired' === e.error_description)
          s.login(e.loginOptions);
        else {
          var a = { error: n, error_description: e.error_description };
          (s.onAuthError && s.onAuthError(a), t && t.setError(a));
        }
      else t && t.setSuccess();
    else if (
      ('standard' != s.flow &&
        (e.access_token || e.id_token) &&
        p(e.access_token, null, e.id_token, !0),
      'implicit' != s.flow && r)
    ) {
      var c = 'code=' + r + '&grant_type=authorization_code',
        u = s.endpoints.token(),
        d = new XMLHttpRequest();
      (d.open('POST', u, !0),
        d.setRequestHeader('Content-type', 'application/x-www-form-urlencoded'),
        (c += '&client_id=' + encodeURIComponent(s.clientId)),
        (c += '&redirect_uri=' + e.redirectUri),
        e.pkceCodeVerifier && (c += '&code_verifier=' + e.pkceCodeVerifier),
        (d.withCredentials = !0),
        (d.onreadystatechange = function () {
          if (4 == d.readyState)
            if (200 == d.status) {
              var e = JSON.parse(d.responseText);
              (p(e.access_token, e.refresh_token, e.id_token, 'standard' === s.flow), _());
            } else (s.onAuthError && s.onAuthError(), t && t.setError());
        }),
        d.send(c));
    }
    function p(r, n, o, a) {
      (v(r, n, o, (i = (i + new Date().getTime()) / 2)),
        l && s.idTokenParsed && s.idTokenParsed.nonce != e.storedNonce
          ? (f('[KEYCLOAK] Invalid nonce, clearing token'), s.clearToken(), t && t.setError())
          : a && (s.onAuthSuccess && s.onAuthSuccess(), t && t.setSuccess()));
    }
  }
  function k(e) {
    return 0 == e.status && e.responseText && e.responseURL.startsWith('file:');
  }
  function v(e, r, n, o) {
    if (
      (s.tokenTimeoutHandle && (clearTimeout(s.tokenTimeoutHandle), (s.tokenTimeoutHandle = null)),
      r
        ? ((s.refreshToken = r), (s.refreshTokenParsed = t(r)))
        : (delete s.refreshToken, delete s.refreshTokenParsed),
      n ? ((s.idToken = n), (s.idTokenParsed = t(n))) : (delete s.idToken, delete s.idTokenParsed),
      e)
    ) {
      if (
        ((s.token = e),
        (s.tokenParsed = t(e)),
        (s.sessionId = s.tokenParsed.sid),
        (s.authenticated = !0),
        (s.subject = s.tokenParsed.sub),
        (s.realmAccess = s.tokenParsed.realm_access),
        (s.resourceAccess = s.tokenParsed.resource_access),
        o && (s.timeSkew = Math.floor(o / 1e3) - s.tokenParsed.iat),
        null != s.timeSkew &&
          (f(
            '[KEYCLOAK] Estimated time difference between browser and server is ' +
              s.timeSkew +
              ' seconds'
          ),
          s.onTokenExpired))
      ) {
        var i = 1e3 * (s.tokenParsed.exp - new Date().getTime() / 1e3 + s.timeSkew);
        (f('[KEYCLOAK] Token expires in ' + Math.round(i / 1e3) + ' s'),
          i <= 0 ? s.onTokenExpired() : (s.tokenTimeoutHandle = setTimeout(s.onTokenExpired, i)));
      }
    } else
      (delete s.token,
        delete s.tokenParsed,
        delete s.subject,
        delete s.realmAccess,
        delete s.resourceAccess,
        (s.authenticated = !1));
  }
  function w() {
    var e = '0123456789abcdef',
      t = h(36, e).split('');
    return (
      (t[14] = '4'),
      (t[19] = e.substr((3 & t[19]) | 8, 1)),
      (t[8] = t[13] = t[18] = t[23] = '-'),
      t.join('')
    );
  }
  function b(e) {
    var t = (function (e) {
      var t;
      switch (s.flow) {
        case 'standard':
          t = ['code', 'state', 'session_state', 'kc_action_status', 'iss'];
          break;
        case 'implicit':
          t = [
            'access_token',
            'token_type',
            'id_token',
            'state',
            'session_state',
            'expires_in',
            'kc_action_status',
            'iss',
          ];
          break;
        case 'hybrid':
          t = [
            'access_token',
            'token_type',
            'id_token',
            'code',
            'state',
            'session_state',
            'expires_in',
            'kc_action_status',
            'iss',
          ];
      }
      (t.push('error'), t.push('error_description'), t.push('error_uri'));
      var r,
        n,
        o = e.indexOf('?'),
        i = e.indexOf('#');
      if (
        ('query' === s.responseMode && -1 !== o
          ? ((r = e.substring(0, o)),
            '' !== (n = y(e.substring(o + 1, -1 !== i ? i : e.length), t)).paramsString &&
              (r += '?' + n.paramsString),
            -1 !== i && (r += e.substring(i)))
          : 'fragment' === s.responseMode &&
            -1 !== i &&
            ((r = e.substring(0, i)),
            '' !== (n = y(e.substring(i + 1), t)).paramsString && (r += '#' + n.paramsString)),
        n && n.oauthParams)
      )
        if ('standard' === s.flow || 'hybrid' === s.flow) {
          if ((n.oauthParams.code || n.oauthParams.error) && n.oauthParams.state)
            return ((n.oauthParams.newUrl = r), n.oauthParams);
        } else if (
          'implicit' === s.flow &&
          (n.oauthParams.access_token || n.oauthParams.error) &&
          n.oauthParams.state
        )
          return ((n.oauthParams.newUrl = r), n.oauthParams);
    })(e);
    if (t) {
      var r = i.get(t.state);
      return (
        r &&
          ((t.valid = !0),
          (t.redirectUri = r.redirectUri),
          (t.storedNonce = r.nonce),
          (t.prompt = r.prompt),
          (t.pkceCodeVerifier = r.pkceCodeVerifier),
          (t.loginOptions = r.loginOptions)),
        t
      );
    }
  }
  function y(e, t) {
    for (
      var r = e.split('&'), n = { paramsString: '', oauthParams: {} }, o = 0;
      o < r.length;
      o++
    ) {
      var i = r[o].indexOf('='),
        s = r[o].slice(0, i);
      -1 !== t.indexOf(s)
        ? (n.oauthParams[s] = r[o].slice(i + 1))
        : ('' !== n.paramsString && (n.paramsString += '&'), (n.paramsString += r[o]));
    }
    return n;
  }
  function S() {
    var e = {
      setSuccess: function (t) {
        e.resolve(t);
      },
      setError: function (t) {
        e.reject(t);
      },
    };
    return (
      (e.promise = new Promise(function (t, r) {
        ((e.resolve = t), (e.reject = r));
      })),
      e
    );
  }
  function U() {
    var e = S();
    if (!c.enable) return (e.setSuccess(), e.promise);
    if (c.iframe) return (e.setSuccess(), e.promise);
    var t = document.createElement('iframe');
    ((c.iframe = t),
      (t.onload = function () {
        var t = s.endpoints.authorize();
        ('/' === t.charAt(0)
          ? (c.iframeOrigin = window.location.origin
              ? window.location.origin
              : window.location.protocol +
                '//' +
                window.location.hostname +
                (window.location.port ? ':' + window.location.port : ''))
          : (c.iframeOrigin = t.substring(0, t.indexOf('/', 8))),
          e.setSuccess());
      }));
    var r = s.endpoints.checkSessionIframe();
    return (
      t.setAttribute('src', r),
      t.setAttribute(
        'sandbox',
        'allow-storage-access-by-user-activation allow-scripts allow-same-origin'
      ),
      t.setAttribute('title', 'keycloak-session-iframe'),
      (t.style.display = 'none'),
      document.body.appendChild(t),
      window.addEventListener(
        'message',
        function (e) {
          if (
            e.origin === c.iframeOrigin &&
            c.iframe.contentWindow === e.source &&
            ('unchanged' == e.data || 'changed' == e.data || 'error' == e.data)
          ) {
            'unchanged' != e.data && s.clearToken();
            for (
              var t = c.callbackList.splice(0, c.callbackList.length), r = t.length - 1;
              r >= 0;
              --r
            ) {
              var n = t[r];
              'error' == e.data ? n.setError() : n.setSuccess('unchanged' == e.data);
            }
          }
        },
        !1
      ),
      e.promise
    );
  }
  function _() {
    c.enable &&
      s.token &&
      setTimeout(function () {
        T().then(function (e) {
          e && _();
        });
      }, 1e3 * c.interval);
  }
  function T() {
    var e = S();
    if (c.iframe && c.iframeOrigin) {
      var t = s.clientId + ' ' + (s.sessionId ? s.sessionId : '');
      c.callbackList.push(e);
      var r = c.iframeOrigin;
      1 == c.callbackList.length && c.iframe.contentWindow.postMessage(t, r);
    } else e.setSuccess();
    return e.promise;
  }
  function I() {
    var e = S();
    if (c.enable || s.silentCheckSsoRedirectUri) {
      var t = document.createElement('iframe');
      (t.setAttribute('src', s.endpoints.thirdPartyCookiesIframe()),
        t.setAttribute(
          'sandbox',
          'allow-storage-access-by-user-activation allow-scripts allow-same-origin'
        ),
        t.setAttribute('title', 'keycloak-3p-check-iframe'),
        (t.style.display = 'none'),
        document.body.appendChild(t));
      var r = function (n) {
        t.contentWindow === n.source &&
          (('supported' !== n.data && 'unsupported' !== n.data) ||
            ('unsupported' === n.data &&
              (p(
                '[KEYCLOAK] Your browser is blocking access to 3rd-party cookies, this means:\n\n - It is not possible to retrieve tokens without redirecting to the Keycloak server (a.k.a. no support for silent authentication).\n - It is not possible to automatically detect changes to the session status (such as the user logging out in another tab).\n\nFor more information see: https://www.keycloak.org/docs/latest/securing_apps/#_modern_browsers'
              ),
              (c.enable = !1),
              s.silentCheckSsoFallback && (s.silentCheckSsoRedirectUri = !1)),
            document.body.removeChild(t),
            window.removeEventListener('message', r),
            e.setSuccess()));
      };
      window.addEventListener('message', r, !1);
    } else e.setSuccess();
    return (function (e, t, r) {
      var n = null,
        o = new Promise(function (e, r) {
          n = setTimeout(function () {
            r({ error: 'Timeout when waiting for 3rd party check iframe message.' });
          }, t);
        });
      return Promise.race([e, o]).finally(function () {
        clearTimeout(n);
      });
    })(e.promise, s.messageReceiveTimeout);
  }
  function C(e) {
    if (!e || 'default' == e)
      return {
        login: function (e) {
          return (window.location.assign(s.createLoginUrl(e)), S().promise);
        },
        logout: async function (e) {
          if ('GET' === (e?.logoutMethod ?? s.logoutMethod))
            return void window.location.replace(s.createLogoutUrl(e));
          const t = s.createLogoutUrl(e),
            r = await fetch(t, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                id_token_hint: s.idToken,
                client_id: s.clientId,
                post_logout_redirect_uri: o.redirectUri(e, !1),
              }),
            });
          if (r.redirected) window.location.href = r.url;
          else {
            if (!r.ok) throw new Error('Logout failed, request returned an error code.');
            window.location.reload();
          }
        },
        register: function (e) {
          return (window.location.assign(s.createRegisterUrl(e)), S().promise);
        },
        accountManagement: function () {
          var e = s.createAccountUrl();
          if (void 0 === e) throw 'Not supported by the OIDC server';
          return ((window.location.href = e), S().promise);
        },
        redirectUri: function (e, t) {
          return e && e.redirectUri ? e.redirectUri : s.redirectUri ? s.redirectUri : location.href;
        },
      };
    if ('cordova' == e) {
      c.enable = !1;
      var t = function (e, t, r) {
          return window.cordova && window.cordova.InAppBrowser
            ? window.cordova.InAppBrowser.open(e, t, r)
            : window.open(e, t, r);
        },
        r = function (e) {
          var t = (function (e) {
            return e && e.cordovaOptions
              ? Object.keys(e.cordovaOptions).reduce(function (t, r) {
                  return ((t[r] = e.cordovaOptions[r]), t);
                }, {})
              : {};
          })(e);
          return (
            (t.location = 'no'),
            e && 'none' == e.prompt && (t.hidden = 'yes'),
            (function (e) {
              return Object.keys(e)
                .reduce(function (t, r) {
                  return (t.push(r + '=' + e[r]), t);
                }, [])
                .join(',');
            })(t)
          );
        },
        n = function () {
          return s.redirectUri || 'http://localhost';
        };
      return {
        login: function (e) {
          var o = S(),
            i = r(e),
            a = s.createLoginUrl(e),
            c = t(a, '_blank', i),
            u = !1,
            d = !1,
            l = function () {
              ((d = !0), c.close());
            };
          return (
            c.addEventListener('loadstart', function (e) {
              0 == e.url.indexOf(n()) && (g(b(e.url), o), l(), (u = !0));
            }),
            c.addEventListener('loaderror', function (e) {
              u ||
                (0 == e.url.indexOf(n()) ? (g(b(e.url), o), l(), (u = !0)) : (o.setError(), l()));
            }),
            c.addEventListener('exit', function (e) {
              d || o.setError({ reason: 'closed_by_user' });
            }),
            o.promise
          );
        },
        logout: function (e) {
          var r,
            o = S(),
            i = s.createLogoutUrl(e),
            a = t(i, '_blank', 'location=no,hidden=yes,clearcache=yes');
          return (
            a.addEventListener('loadstart', function (e) {
              0 == e.url.indexOf(n()) && a.close();
            }),
            a.addEventListener('loaderror', function (e) {
              (0 == e.url.indexOf(n()) || (r = !0), a.close());
            }),
            a.addEventListener('exit', function (e) {
              r ? o.setError() : (s.clearToken(), o.setSuccess());
            }),
            o.promise
          );
        },
        register: function (e) {
          var o = S(),
            i = s.createRegisterUrl(),
            a = r(e),
            c = t(i, '_blank', a);
          return (
            c.addEventListener('loadstart', function (e) {
              0 == e.url.indexOf(n()) && (c.close(), g(b(e.url), o));
            }),
            o.promise
          );
        },
        accountManagement: function () {
          var e = s.createAccountUrl();
          if (void 0 === e) throw 'Not supported by the OIDC server';
          var r = t(e, '_blank', 'location=no');
          r.addEventListener('loadstart', function (e) {
            0 == e.url.indexOf(n()) && r.close();
          });
        },
        redirectUri: function (e) {
          return n();
        },
      };
    }
    if ('cordova-native' == e)
      return (
        (c.enable = !1),
        {
          login: function (e) {
            var t = S(),
              r = s.createLoginUrl(e);
            return (
              universalLinks.subscribe('keycloak', function (e) {
                (universalLinks.unsubscribe('keycloak'),
                  window.cordova.plugins.browsertab.close(),
                  g(b(e.url), t));
              }),
              window.cordova.plugins.browsertab.openUrl(r),
              t.promise
            );
          },
          logout: function (e) {
            var t = S(),
              r = s.createLogoutUrl(e);
            return (
              universalLinks.subscribe('keycloak', function (e) {
                (universalLinks.unsubscribe('keycloak'),
                  window.cordova.plugins.browsertab.close(),
                  s.clearToken(),
                  t.setSuccess());
              }),
              window.cordova.plugins.browsertab.openUrl(r),
              t.promise
            );
          },
          register: function (e) {
            var t = S(),
              r = s.createRegisterUrl(e);
            return (
              universalLinks.subscribe('keycloak', function (e) {
                (universalLinks.unsubscribe('keycloak'),
                  window.cordova.plugins.browsertab.close(),
                  g(b(e.url), t));
              }),
              window.cordova.plugins.browsertab.openUrl(r),
              t.promise
            );
          },
          accountManagement: function () {
            var e = s.createAccountUrl();
            if (void 0 === e) throw 'Not supported by the OIDC server';
            window.cordova.plugins.browsertab.openUrl(e);
          },
          redirectUri: function (e) {
            return e && e.redirectUri
              ? e.redirectUri
              : s.redirectUri
                ? s.redirectUri
                : 'http://localhost';
          },
        }
      );
    throw 'invalid adapter type: ' + e;
  }
  ((s.init = function (e) {
    if (s.didInitialize) throw new Error("A 'Keycloak' instance can only be initialized once.");
    if (
      ((s.didInitialize = !0),
      (s.authenticated = !1),
      (i = (function () {
        try {
          return new E();
        } catch (e) {}
        return new R();
      })()),
      (o =
        e && ['default', 'cordova', 'cordova-native'].indexOf(e.adapter) > -1
          ? C(e.adapter)
          : e && 'object' == typeof e.adapter
            ? e.adapter
            : window.Cordova || window.cordova
              ? C('cordova')
              : C()),
      e)
    ) {
      if (
        (void 0 !== e.useNonce && (l = e.useNonce),
        void 0 !== e.checkLoginIframe && (c.enable = e.checkLoginIframe),
        e.checkLoginIframeInterval && (c.interval = e.checkLoginIframeInterval),
        'login-required' === e.onLoad && (s.loginRequired = !0),
        e.responseMode)
      ) {
        if ('query' !== e.responseMode && 'fragment' !== e.responseMode)
          throw 'Invalid value for responseMode';
        s.responseMode = e.responseMode;
      }
      if (e.flow) {
        switch (e.flow) {
          case 'standard':
            s.responseType = 'code';
            break;
          case 'implicit':
            s.responseType = 'id_token token';
            break;
          case 'hybrid':
            s.responseType = 'code id_token token';
            break;
          default:
            throw 'Invalid value for flow';
        }
        s.flow = e.flow;
      }
      if (
        (null != e.timeSkew && (s.timeSkew = e.timeSkew),
        e.redirectUri && (s.redirectUri = e.redirectUri),
        e.silentCheckSsoRedirectUri && (s.silentCheckSsoRedirectUri = e.silentCheckSsoRedirectUri),
        'boolean' == typeof e.silentCheckSsoFallback
          ? (s.silentCheckSsoFallback = e.silentCheckSsoFallback)
          : (s.silentCheckSsoFallback = !0),
        void 0 !== e.pkceMethod)
      ) {
        if ('S256' !== e.pkceMethod && !1 !== e.pkceMethod)
          throw new TypeError(
            `Invalid value for pkceMethod', expected 'S256' or false but got ${e.pkceMethod}.`
          );
        s.pkceMethod = e.pkceMethod;
      } else s.pkceMethod = 'S256';
      ('boolean' == typeof e.enableLogging
        ? (s.enableLogging = e.enableLogging)
        : (s.enableLogging = !1),
        'POST' === e.logoutMethod ? (s.logoutMethod = 'POST') : (s.logoutMethod = 'GET'),
        'string' == typeof e.scope && (s.scope = e.scope),
        'string' == typeof e.acrValues && (s.acrValues = e.acrValues),
        'number' == typeof e.messageReceiveTimeout && e.messageReceiveTimeout > 0
          ? (s.messageReceiveTimeout = e.messageReceiveTimeout)
          : (s.messageReceiveTimeout = 1e4));
    }
    (s.responseMode || (s.responseMode = 'fragment'),
      s.responseType || ((s.responseType = 'code'), (s.flow = 'standard')));
    var t = S(),
      r = S();
    r.promise
      .then(function () {
        (s.onReady && s.onReady(s.authenticated), t.setSuccess(s.authenticated));
      })
      .catch(function (e) {
        t.setError(e);
      });
    var a = (function (e) {
      var t,
        r = S();
      function o(e) {
        s.endpoints = e
          ? {
              authorize: function () {
                return e.authorization_endpoint;
              },
              token: function () {
                return e.token_endpoint;
              },
              logout: function () {
                if (!e.end_session_endpoint) throw 'Not supported by the OIDC server';
                return e.end_session_endpoint;
              },
              checkSessionIframe: function () {
                if (!e.check_session_iframe) throw 'Not supported by the OIDC server';
                return e.check_session_iframe;
              },
              register: function () {
                throw 'Redirection to "Register user" page not supported in standard OIDC mode';
              },
              userinfo: function () {
                if (!e.userinfo_endpoint) throw 'Not supported by the OIDC server';
                return e.userinfo_endpoint;
              },
            }
          : {
              authorize: function () {
                return m() + '/protocol/openid-connect/auth';
              },
              token: function () {
                return m() + '/protocol/openid-connect/token';
              },
              logout: function () {
                return m() + '/protocol/openid-connect/logout';
              },
              checkSessionIframe: function () {
                var e = m() + '/protocol/openid-connect/login-status-iframe.html';
                return (s.iframeVersion && (e = e + '?version=' + s.iframeVersion), e);
              },
              thirdPartyCookiesIframe: function () {
                var e = m() + '/protocol/openid-connect/3p-cookies/step1.html';
                return (s.iframeVersion && (e = e + '?version=' + s.iframeVersion), e);
              },
              register: function () {
                return m() + '/protocol/openid-connect/registrations';
              },
              userinfo: function () {
                return m() + '/protocol/openid-connect/userinfo';
              },
            };
      }
      if ((n ? 'string' == typeof n && (t = n) : (t = 'keycloak.json'), t))
        ((c = new XMLHttpRequest()).open('GET', t, !0),
          c.setRequestHeader('Accept', 'application/json'),
          (c.onreadystatechange = function () {
            if (4 == c.readyState)
              if (200 == c.status || k(c)) {
                var e = JSON.parse(c.responseText);
                ((s.authServerUrl = e['auth-server-url']),
                  (s.realm = e.realm),
                  (s.clientId = e.resource),
                  o(null),
                  r.setSuccess());
              } else r.setError();
          }),
          c.send());
      else {
        if (!n.clientId) throw 'clientId missing';
        s.clientId = n.clientId;
        var i = n.oidcProvider;
        if (i) {
          var a, c;
          'string' == typeof i
            ? ((a =
                '/' == i.charAt(i.length - 1)
                  ? i + '.well-known/openid-configuration'
                  : i + '/.well-known/openid-configuration'),
              (c = new XMLHttpRequest()).open('GET', a, !0),
              c.setRequestHeader('Accept', 'application/json'),
              (c.onreadystatechange = function () {
                4 == c.readyState &&
                  (200 == c.status || k(c)
                    ? (o(JSON.parse(c.responseText)), r.setSuccess())
                    : r.setError());
              }),
              c.send())
            : (o(i), r.setSuccess());
        } else {
          if (!n.url)
            for (var u = document.getElementsByTagName('script'), d = 0; d < u.length; d++)
              if (u[d].src.match(/.*keycloak\.js/)) {
                n.url = u[d].src.substr(0, u[d].src.indexOf('/js/keycloak.js'));
                break;
              }
          if (!n.realm) throw 'realm missing';
          ((s.authServerUrl = n.url), (s.realm = n.realm), o(null), r.setSuccess());
        }
      }
      return r.promise;
    })();
    function u() {
      var t = function (t) {
          (t || (o.prompt = 'none'),
            e && e.locale && (o.locale = e.locale),
            s
              .login(o)
              .then(function () {
                r.setSuccess();
              })
              .catch(function (e) {
                r.setError(e);
              }));
        },
        n = function () {
          var e = document.createElement('iframe'),
            t = s.createLoginUrl({ prompt: 'none', redirectUri: s.silentCheckSsoRedirectUri });
          (e.setAttribute('src', t),
            e.setAttribute(
              'sandbox',
              'allow-storage-access-by-user-activation allow-scripts allow-same-origin'
            ),
            e.setAttribute('title', 'keycloak-silent-check-sso'),
            (e.style.display = 'none'),
            document.body.appendChild(e));
          var n = function (t) {
            t.origin === window.location.origin &&
              e.contentWindow === t.source &&
              (g(b(t.data), r),
              document.body.removeChild(e),
              window.removeEventListener('message', n));
          };
          window.addEventListener('message', n);
        },
        o = {};
      switch (e.onLoad) {
        case 'check-sso':
          c.enable
            ? U().then(function () {
                T()
                  .then(function (e) {
                    e ? r.setSuccess() : s.silentCheckSsoRedirectUri ? n() : t(!1);
                  })
                  .catch(function (e) {
                    r.setError(e);
                  });
              })
            : s.silentCheckSsoRedirectUri
              ? n()
              : t(!1);
          break;
        case 'login-required':
          t(!0);
          break;
        default:
          throw 'Invalid value for onLoad';
      }
    }
    function d() {
      var t = b(window.location.href);
      if ((t && window.history.replaceState(window.history.state, null, t.newUrl), t && t.valid))
        return U()
          .then(function () {
            g(t, r);
          })
          .catch(function (e) {
            r.setError(e);
          });
      e
        ? e.token && e.refreshToken
          ? (v(e.token, e.refreshToken, e.idToken),
            c.enable
              ? U().then(function () {
                  T()
                    .then(function (e) {
                      e
                        ? (s.onAuthSuccess && s.onAuthSuccess(), r.setSuccess(), _())
                        : r.setSuccess();
                    })
                    .catch(function (e) {
                      r.setError(e);
                    });
                })
              : s
                  .updateToken(-1)
                  .then(function () {
                    (s.onAuthSuccess && s.onAuthSuccess(), r.setSuccess());
                  })
                  .catch(function (t) {
                    (s.onAuthError && s.onAuthError(), e.onLoad ? u() : r.setError(t));
                  }))
          : e.onLoad
            ? u()
            : r.setSuccess()
        : r.setSuccess();
    }
    return (
      a.then(function () {
        (function () {
          var e = S(),
            t = function () {
              ('interactive' !== document.readyState && 'complete' !== document.readyState) ||
                (document.removeEventListener('readystatechange', t), e.setSuccess());
            };
          return (document.addEventListener('readystatechange', t), t(), e.promise);
        })()
          .then(I)
          .then(d)
          .catch(function (e) {
            t.setError(e);
          });
      }),
      a.catch(function (e) {
        t.setError(e);
      }),
      t.promise
    );
  }),
    (s.login = function (e) {
      return o.login(e);
    }),
    (s.createLoginUrl = function (t) {
      var r,
        n = w(),
        a = w(),
        c = o.redirectUri(t),
        u = { state: n, nonce: a, redirectUri: encodeURIComponent(c), loginOptions: t };
      (t && t.prompt && (u.prompt = t.prompt),
        (r = t && 'register' == t.action ? s.endpoints.register() : s.endpoints.authorize()));
      var d = (t && t.scope) || s.scope;
      d ? -1 === d.indexOf('openid') && (d = 'openid ' + d) : (d = 'openid');
      var f,
        p =
          r +
          '?client_id=' +
          encodeURIComponent(s.clientId) +
          '&redirect_uri=' +
          encodeURIComponent(c) +
          '&state=' +
          encodeURIComponent(n) +
          '&response_mode=' +
          encodeURIComponent(s.responseMode) +
          '&response_type=' +
          encodeURIComponent(s.responseType) +
          '&scope=' +
          encodeURIComponent(d);
      if (
        (l && (p = p + '&nonce=' + encodeURIComponent(a)),
        t && t.prompt && (p += '&prompt=' + encodeURIComponent(t.prompt)),
        t && t.maxAge && (p += '&max_age=' + encodeURIComponent(t.maxAge)),
        t && t.loginHint && (p += '&login_hint=' + encodeURIComponent(t.loginHint)),
        t && t.idpHint && (p += '&kc_idp_hint=' + encodeURIComponent(t.idpHint)),
        t &&
          t.action &&
          'register' != t.action &&
          (p += '&kc_action=' + encodeURIComponent(t.action)),
        t && t.locale && (p += '&ui_locales=' + encodeURIComponent(t.locale)),
        t && t.acr)
      ) {
        var m = ((f = { id_token: { acr: t.acr } }), JSON.stringify(f));
        p += '&claims=' + encodeURIComponent(m);
      }
      if (
        (((t && t.acrValues) || s.acrValues) &&
          (p += '&acr_values=' + encodeURIComponent(t.acrValues || s.acrValues)),
        s.pkceMethod)
      ) {
        var g = h(96, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
        ((u.pkceCodeVerifier = g),
          (p +=
            '&code_challenge=' +
            (function (t, r) {
              if ('S256' !== t)
                throw new TypeError(
                  `Invalid value for 'pkceMethod', expected 'S256' but got '${t}'.`
                );
              return (function (e) {
                const t = String.fromCodePoint(...e);
                return btoa(t);
              })(new Uint8Array(e.arrayBuffer(r)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/\=/g, '');
            })(s.pkceMethod, g)),
          (p += '&code_challenge_method=' + s.pkceMethod));
      }
      return (i.add(u), p);
    }),
    (s.logout = function (e) {
      return o.logout(e);
    }),
    (s.createLogoutUrl = function (e) {
      if ('POST' === (e?.logoutMethod ?? s.logoutMethod)) return s.endpoints.logout();
      var t =
        s.endpoints.logout() +
        '?client_id=' +
        encodeURIComponent(s.clientId) +
        '&post_logout_redirect_uri=' +
        encodeURIComponent(o.redirectUri(e, !1));
      return (s.idToken && (t += '&id_token_hint=' + encodeURIComponent(s.idToken)), t);
    }),
    (s.register = function (e) {
      return o.register(e);
    }),
    (s.createRegisterUrl = function (e) {
      return (e || (e = {}), (e.action = 'register'), s.createLoginUrl(e));
    }),
    (s.createAccountUrl = function (e) {
      var t = m(),
        r = void 0;
      return (
        void 0 !== t &&
          (r =
            t +
            '/account?referrer=' +
            encodeURIComponent(s.clientId) +
            '&referrer_uri=' +
            encodeURIComponent(o.redirectUri(e))),
        r
      );
    }),
    (s.accountManagement = function () {
      return o.accountManagement();
    }),
    (s.hasRealmRole = function (e) {
      var t = s.realmAccess;
      return !!t && t.roles.indexOf(e) >= 0;
    }),
    (s.hasResourceRole = function (e, t) {
      if (!s.resourceAccess) return !1;
      var r = s.resourceAccess[t || s.clientId];
      return !!r && r.roles.indexOf(e) >= 0;
    }),
    (s.loadUserProfile = function () {
      var e = m() + '/account',
        t = new XMLHttpRequest();
      (t.open('GET', e, !0),
        t.setRequestHeader('Accept', 'application/json'),
        t.setRequestHeader('Authorization', 'bearer ' + s.token));
      var r = S();
      return (
        (t.onreadystatechange = function () {
          4 == t.readyState &&
            (200 == t.status
              ? ((s.profile = JSON.parse(t.responseText)), r.setSuccess(s.profile))
              : r.setError());
        }),
        t.send(),
        r.promise
      );
    }),
    (s.loadUserInfo = function () {
      var e = s.endpoints.userinfo(),
        t = new XMLHttpRequest();
      (t.open('GET', e, !0),
        t.setRequestHeader('Accept', 'application/json'),
        t.setRequestHeader('Authorization', 'bearer ' + s.token));
      var r = S();
      return (
        (t.onreadystatechange = function () {
          4 == t.readyState &&
            (200 == t.status
              ? ((s.userInfo = JSON.parse(t.responseText)), r.setSuccess(s.userInfo))
              : r.setError());
        }),
        t.send(),
        r.promise
      );
    }),
    (s.isTokenExpired = function (e) {
      if (!s.tokenParsed || (!s.refreshToken && 'implicit' != s.flow)) throw 'Not authenticated';
      if (null == s.timeSkew)
        return (f('[KEYCLOAK] Unable to determine if token is expired as timeskew is not set'), !0);
      var t = s.tokenParsed.exp - Math.ceil(new Date().getTime() / 1e3) + s.timeSkew;
      if (e) {
        if (isNaN(e)) throw 'Invalid minValidity';
        t -= e;
      }
      return t < 0;
    }),
    (s.updateToken = function (e) {
      var t = S();
      if (!s.refreshToken) return (t.setError(), t.promise);
      e = e || 5;
      var r = function () {
        var r = !1;
        if (
          (-1 == e
            ? ((r = !0), f('[KEYCLOAK] Refreshing token: forced refresh'))
            : (s.tokenParsed && !s.isTokenExpired(e)) ||
              ((r = !0), f('[KEYCLOAK] Refreshing token: token expired')),
          r)
        ) {
          var n = 'grant_type=refresh_token&refresh_token=' + s.refreshToken,
            o = s.endpoints.token();
          if ((a.push(t), 1 == a.length)) {
            var i = new XMLHttpRequest();
            (i.open('POST', o, !0),
              i.setRequestHeader('Content-type', 'application/x-www-form-urlencoded'),
              (i.withCredentials = !0),
              (n += '&client_id=' + encodeURIComponent(s.clientId)));
            var c = new Date().getTime();
            ((i.onreadystatechange = function () {
              if (4 == i.readyState)
                if (200 == i.status) {
                  (f('[KEYCLOAK] Token refreshed'), (c = (c + new Date().getTime()) / 2));
                  var e = JSON.parse(i.responseText);
                  (v(e.access_token, e.refresh_token, e.id_token, c),
                    s.onAuthRefreshSuccess && s.onAuthRefreshSuccess());
                  for (var t = a.pop(); null != t; t = a.pop()) t.setSuccess(!0);
                } else
                  for (
                    p('[KEYCLOAK] Failed to refresh token'),
                      400 == i.status && s.clearToken(),
                      s.onAuthRefreshError && s.onAuthRefreshError(),
                      t = a.pop();
                    null != t;
                    t = a.pop()
                  )
                    t.setError(!0);
            }),
              i.send(n));
          }
        } else t.setSuccess(!1);
      };
      return (
        c.enable
          ? T()
              .then(function () {
                r();
              })
              .catch(function (e) {
                t.setError(e);
              })
          : r(),
        t.promise
      );
    }),
    (s.clearToken = function () {
      s.token &&
        (v(null, null, null), s.onAuthLogout && s.onAuthLogout(), s.loginRequired && s.login());
    }));
  var E = function () {
      if (!(this instanceof E)) return new E();
      function e() {
        for (var e = new Date().getTime(), t = 0; t < localStorage.length; t++) {
          var r = localStorage.key(t);
          if (r && 0 == r.indexOf('kc-callback-')) {
            var n = localStorage.getItem(r);
            if (n)
              try {
                var o = JSON.parse(n).expires;
                (!o || o < e) && localStorage.removeItem(r);
              } catch (e) {
                localStorage.removeItem(r);
              }
          }
        }
      }
      (localStorage.setItem('kc-test', 'test'),
        localStorage.removeItem('kc-test'),
        (this.get = function (t) {
          if (t) {
            var r = 'kc-callback-' + t,
              n = localStorage.getItem(r);
            return (n && (localStorage.removeItem(r), (n = JSON.parse(n))), e(), n);
          }
        }),
        (this.add = function (t) {
          e();
          var r = 'kc-callback-' + t.state;
          ((t.expires = new Date().getTime() + 36e5), localStorage.setItem(r, JSON.stringify(t)));
        }));
    },
    R = function () {
      if (!(this instanceof R)) return new R();
      var e = this;
      ((e.get = function (e) {
        if (e) {
          var o = r('kc-callback-' + e);
          return (n('kc-callback-' + e, '', t(-100)), o ? JSON.parse(o) : void 0);
        }
      }),
        (e.add = function (e) {
          n('kc-callback-' + e.state, JSON.stringify(e), t(60));
        }),
        (e.removeItem = function (e) {
          n(e, '', t(-100));
        }));
      var t = function (e) {
          var t = new Date();
          return (t.setTime(t.getTime() + 60 * e * 1e3), t);
        },
        r = function (e) {
          for (var t = e + '=', r = document.cookie.split(';'), n = 0; n < r.length; n++) {
            for (var o = r[n]; ' ' == o.charAt(0); ) o = o.substring(1);
            if (0 == o.indexOf(t)) return o.substring(t.length, o.length);
          }
          return '';
        },
        n = function (e, t, r) {
          var n = e + '=' + t + '; expires=' + r.toUTCString() + '; ';
          document.cookie = n;
        };
    };
  function A(e) {
    return function () {
      s.enableLogging && e.apply(console, Array.prototype.slice.call(arguments));
    };
  }
}
export { r as default };
