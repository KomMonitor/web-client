!(function (t, e) {
  'object' == typeof exports && 'undefined' != typeof module
    ? (module.exports = e())
    : 'function' == typeof define && define.amd
      ? define('keycloak-authorization', e)
      : ((t = 'undefined' != typeof globalThis ? globalThis : t || self).KeycloakAuthorization =
          e());
})(this, function () {
  'use strict';
  var t =
      'undefined' != typeof globalThis
        ? globalThis
        : 'undefined' != typeof window
          ? window
          : 'undefined' != typeof global
            ? global
            : 'undefined' != typeof self
              ? self
              : {},
    e = { exports: {} };
  !(function (e, n) {
    e.exports = (function () {
      function e(t) {
        return 'function' == typeof t;
      }
      function n() {
        var t = setTimeout;
        return function () {
          return t(r, 1);
        };
      }
      function r() {
        for (var t = 0; t < y; t += 2) ((0, P[t])(P[t + 1]), (P[t] = void 0), (P[t + 1] = void 0));
        y = 0;
      }
      function o(t, e) {
        var n = this,
          r = new this.constructor(s);
        void 0 === r[O] && v(r);
        var o = n._state;
        if (o) {
          var i = arguments[o - 1];
          b(function () {
            return d(o, r, i, n._result);
          });
        } else h(n, r, t, e);
        return r;
      }
      function i(t) {
        if (t && 'object' == typeof t && t.constructor === this) return t;
        var e = new this(s);
        return (u(e, t), e);
      }
      function s() {}
      function a(t, n, r) {
        n.constructor === t.constructor && r === o && n.constructor.resolve === i
          ? (function (t, e) {
              e._state === j
                ? l(t, e._result)
                : e._state === z
                  ? f(t, e._result)
                  : h(
                      e,
                      void 0,
                      function (e) {
                        return u(t, e);
                      },
                      function (e) {
                        return f(t, e);
                      }
                    );
            })(t, n)
          : void 0 === r
            ? l(t, n)
            : e(r)
              ? (function (t, e, n) {
                  b(function (t) {
                    var r = !1,
                      o = (function (t, e, n, r) {
                        try {
                          t.call(e, n, r);
                        } catch (t) {
                          return t;
                        }
                      })(
                        n,
                        e,
                        function (n) {
                          r || ((r = !0), e !== n ? u(t, n) : l(t, n));
                        },
                        function (e) {
                          r || ((r = !0), f(t, e));
                        },
                        t._label
                      );
                    !r && o && ((r = !0), f(t, o));
                  }, t);
                })(t, n, r)
              : l(t, n);
      }
      function u(t, e) {
        if (t === e) f(t, new TypeError('You cannot resolve a promise with itself'));
        else if (
          (function (t) {
            var e = typeof t;
            return null !== t && ('object' === e || 'function' === e);
          })(e)
        ) {
          var n = void 0;
          try {
            n = e.then;
          } catch (e) {
            return void f(t, e);
          }
          a(t, e, n);
        } else l(t, e);
      }
      function c(t) {
        (t._onerror && t._onerror(t._result), p(t));
      }
      function l(t, e) {
        t._state === R && ((t._result = e), (t._state = j), 0 !== t._subscribers.length && b(p, t));
      }
      function f(t, e) {
        t._state === R && ((t._state = z), (t._result = e), b(c, t));
      }
      function h(t, e, n, r) {
        var o = t._subscribers,
          i = o.length;
        ((t._onerror = null),
          (o[i] = e),
          (o[i + j] = n),
          (o[i + z] = r),
          0 === i && t._state && b(p, t));
      }
      function p(t) {
        var e = t._subscribers,
          n = t._state;
        if (0 !== e.length) {
          for (var r = void 0, o = void 0, i = t._result, s = 0; s < e.length; s += 3)
            ((r = e[s]), (o = e[s + n]), r ? d(n, r, o, i) : o(i));
          t._subscribers.length = 0;
        }
      }
      function d(t, n, r, o) {
        var i = e(r),
          s = void 0,
          a = void 0,
          c = !0;
        if (i) {
          try {
            s = r(o);
          } catch (t) {
            ((c = !1), (a = t));
          }
          if (n === s)
            return void f(n, new TypeError('A promises callback cannot return that same promise.'));
        } else s = o;
        n._state !== R ||
          (i && c ? u(n, s) : !1 === c ? f(n, a) : t === j ? l(n, s) : t === z && f(n, s));
      }
      function v(t) {
        ((t[O] = C++), (t._state = void 0), (t._result = void 0), (t._subscribers = []));
      }
      var m;
      m = Array.isArray
        ? Array.isArray
        : function (t) {
            return '[object Array]' === Object.prototype.toString.call(t);
          };
      var _ = m,
        y = 0,
        g = void 0,
        w = void 0,
        b = function (t, e) {
          ((P[y] = t), (P[y + 1] = e), 2 === (y += 2) && (w ? w(r) : q()));
        },
        A = 'undefined' != typeof window ? window : void 0,
        k = A || {},
        T = k.MutationObserver || k.WebKitMutationObserver,
        S =
          'undefined' == typeof self &&
          'undefined' != typeof process &&
          '[object process]' === {}.toString.call(process),
        x =
          'undefined' != typeof Uint8ClampedArray &&
          'undefined' != typeof importScripts &&
          'undefined' != typeof MessageChannel,
        P = new Array(1e3),
        q = void 0;
      q = S
        ? function () {
            return process.nextTick(r);
          }
        : T
          ? (function () {
              var t = 0,
                e = new T(r),
                n = document.createTextNode('');
              return (
                e.observe(n, { characterData: !0 }),
                function () {
                  n.data = t = ++t % 2;
                }
              );
            })()
          : x
            ? (function () {
                var t = new MessageChannel();
                return (
                  (t.port1.onmessage = r),
                  function () {
                    return t.port2.postMessage(0);
                  }
                );
              })()
            : void 0 === A
              ? (function () {
                  try {
                    var t = Function('return this')().require('vertx');
                    return void 0 !== (g = t.runOnLoop || t.runOnContext)
                      ? function () {
                          g(r);
                        }
                      : n();
                  } catch (t) {
                    return n();
                  }
                })()
              : n();
      var O = Math.random().toString(36).substring(2),
        R = void 0,
        j = 1,
        z = 2,
        C = 0,
        E = (function () {
          function t(t, e) {
            ((this._instanceConstructor = t),
              (this.promise = new t(s)),
              this.promise[O] || v(this.promise),
              _(e)
                ? ((this.length = e.length),
                  (this._remaining = e.length),
                  (this._result = new Array(this.length)),
                  0 === this.length
                    ? l(this.promise, this._result)
                    : ((this.length = this.length || 0),
                      this._enumerate(e),
                      0 === this._remaining && l(this.promise, this._result)))
                : f(this.promise, new Error('Array Methods must be provided an Array')));
          }
          return (
            (t.prototype._enumerate = function (t) {
              for (var e = 0; this._state === R && e < t.length; e++) this._eachEntry(t[e], e);
            }),
            (t.prototype._eachEntry = function (t, e) {
              var n = this._instanceConstructor,
                r = n.resolve;
              if (r === i) {
                var u = void 0,
                  c = void 0,
                  l = !1;
                try {
                  u = t.then;
                } catch (t) {
                  ((l = !0), (c = t));
                }
                if (u === o && t._state !== R) this._settledAt(t._state, e, t._result);
                else if ('function' != typeof u) (this._remaining--, (this._result[e] = t));
                else if (n === M) {
                  var h = new n(s);
                  (l ? f(h, c) : a(h, t, u), this._willSettleAt(h, e));
                } else
                  this._willSettleAt(
                    new n(function (e) {
                      return e(t);
                    }),
                    e
                  );
              } else this._willSettleAt(r(t), e);
            }),
            (t.prototype._settledAt = function (t, e, n) {
              var r = this.promise;
              (r._state === R && (this._remaining--, t === z ? f(r, n) : (this._result[e] = n)),
                0 === this._remaining && l(r, this._result));
            }),
            (t.prototype._willSettleAt = function (t, e) {
              var n = this;
              h(
                t,
                void 0,
                function (t) {
                  return n._settledAt(j, e, t);
                },
                function (t) {
                  return n._settledAt(z, e, t);
                }
              );
            }),
            t
          );
        })(),
        M = (function () {
          function t(e) {
            ((this[O] = C++),
              (this._result = this._state = void 0),
              (this._subscribers = []),
              s !== e &&
                ('function' != typeof e &&
                  (function () {
                    throw new TypeError(
                      'You must pass a resolver function as the first argument to the promise constructor'
                    );
                  })(),
                this instanceof t
                  ? (function (t, e) {
                      try {
                        e(
                          function (e) {
                            u(t, e);
                          },
                          function (e) {
                            f(t, e);
                          }
                        );
                      } catch (e) {
                        f(t, e);
                      }
                    })(this, e)
                  : (function () {
                      throw new TypeError(
                        "Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function."
                      );
                    })()));
          }
          return (
            (t.prototype.catch = function (t) {
              return this.then(null, t);
            }),
            (t.prototype.finally = function (t) {
              var n = this,
                r = n.constructor;
              return e(t)
                ? n.then(
                    function (e) {
                      return r.resolve(t()).then(function () {
                        return e;
                      });
                    },
                    function (e) {
                      return r.resolve(t()).then(function () {
                        throw e;
                      });
                    }
                  )
                : n.then(t, t);
            }),
            t
          );
        })();
      return (
        (M.prototype.then = o),
        (M.all = function (t) {
          return new E(this, t).promise;
        }),
        (M.race = function (t) {
          var e = this;
          return new e(
            _(t)
              ? function (n, r) {
                  for (var o = t.length, i = 0; i < o; i++) e.resolve(t[i]).then(n, r);
                }
              : function (t, e) {
                  return e(new TypeError('You must pass an array to race.'));
                }
          );
        }),
        (M.resolve = i),
        (M.reject = function (t) {
          var e = new this(s);
          return (f(e, t), e);
        }),
        (M._setScheduler = function (t) {
          w = t;
        }),
        (M._setAsap = function (t) {
          b = t;
        }),
        (M._asap = b),
        (M.polyfill = function () {
          var e = void 0;
          if (void 0 !== t) e = t;
          else if ('undefined' != typeof self) e = self;
          else
            try {
              e = Function('return this')();
            } catch (t) {
              throw new Error(
                'polyfill failed because global object is unavailable in this environment'
              );
            }
          var n = e.Promise;
          if (n) {
            var r = null;
            try {
              r = Object.prototype.toString.call(n.resolve());
            } catch (t) {}
            if ('[object Promise]' === r && !n.cast) return;
          }
          e.Promise = M;
        }),
        (M.Promise = M),
        M
      );
    })();
  })(e);
  var n = e.exports;
  return function (t, e) {
    var r = this;
    this.rpt = null;
    var o = function () {},
      i = function () {};
    return (
      void 0 !== n.Promise &&
        -1 !== n.Promise.toString().indexOf('[native code]') &&
        (this.ready = new n.Promise(function (t, e) {
          ((o = t), (i = e));
        })),
      (this.init = function () {
        var e = new XMLHttpRequest();
        (e.open('GET', t.authServerUrl + '/realms/' + t.realm + '/.well-known/uma2-configuration'),
          (e.onreadystatechange = function () {
            4 == e.readyState &&
              (200 == e.status
                ? ((r.config = JSON.parse(e.responseText)), o())
                : (console.error('Could not obtain configuration from server.'), i()));
          }),
          e.send(null));
      }),
      (this.authorize = function (e) {
        return (
          (this.then = function (n, o, i) {
            if (e && e.ticket) {
              var s = new XMLHttpRequest();
              (s.open('POST', r.config.token_endpoint, !0),
                s.setRequestHeader('Content-type', 'application/x-www-form-urlencoded'),
                s.setRequestHeader('Authorization', 'Bearer ' + t.token),
                (s.onreadystatechange = function () {
                  if (4 == s.readyState) {
                    var t = s.status;
                    if (t >= 200 && t < 300) {
                      var e = JSON.parse(s.responseText).access_token;
                      ((r.rpt = e), n(e));
                    } else
                      403 == t
                        ? o
                          ? o()
                          : console.error('Authorization request was denied by the server.')
                        : i
                          ? i()
                          : console.error('Could not obtain authorization data from server.');
                  }
                }));
              var a =
                'grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&client_id=' +
                t.clientId +
                '&ticket=' +
                e.ticket;
              null != e.submitRequest && (a += '&submit_request=' + e.submitRequest);
              var u = e.metadata;
              (u &&
                (u.responseIncludeResourceName &&
                  (a += '&response_include_resource_name=' + u.responseIncludeResourceName),
                u.responsePermissionsLimit &&
                  (a += '&response_permissions_limit=' + u.responsePermissionsLimit)),
                r.rpt &&
                  (null == e.incrementalAuthorization || e.incrementalAuthorization) &&
                  (a += '&rpt=' + r.rpt),
                s.send(a));
            }
          }),
          this
        );
      }),
      (this.entitlement = function (e, n) {
        return (
          (this.then = function (o, i, s) {
            var a = new XMLHttpRequest();
            (a.open('POST', r.config.token_endpoint, !0),
              a.setRequestHeader('Content-type', 'application/x-www-form-urlencoded'),
              a.setRequestHeader('Authorization', 'Bearer ' + t.token),
              (a.onreadystatechange = function () {
                if (4 == a.readyState) {
                  var t = a.status;
                  if (t >= 200 && t < 300) {
                    var e = JSON.parse(a.responseText).access_token;
                    ((r.rpt = e), o(e));
                  } else
                    403 == t
                      ? i
                        ? i()
                        : console.error('Authorization request was denied by the server.')
                      : s
                        ? s()
                        : console.error('Could not obtain authorization data from server.');
                }
              }),
              n || (n = {}));
            var u =
              'grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&client_id=' + t.clientId;
            (n.claimToken &&
              ((u += '&claim_token=' + n.claimToken),
              n.claimTokenFormat && (u += '&claim_token_format=' + n.claimTokenFormat)),
              (u += '&audience=' + e));
            var c = n.permissions;
            c || (c = []);
            for (var l = 0; l < c.length; l++) {
              var f = c[l],
                h = f.id;
              if (f.scopes && f.scopes.length > 0) {
                h += '#';
                for (var p = 0; p < f.scopes.length; p++) {
                  var d = f.scopes[p];
                  (h.indexOf('#') != h.length - 1 && (h += ','), (h += d));
                }
              }
              u += '&permission=' + h;
            }
            var v = n.metadata;
            (v &&
              (v.responseIncludeResourceName &&
                (u += '&response_include_resource_name=' + v.responseIncludeResourceName),
              v.responsePermissionsLimit &&
                (u += '&response_permissions_limit=' + v.responsePermissionsLimit)),
              r.rpt && (u += '&rpt=' + r.rpt),
              a.send(u));
          }),
          this
        );
      }),
      this.init(this),
      this
    );
  };
});
