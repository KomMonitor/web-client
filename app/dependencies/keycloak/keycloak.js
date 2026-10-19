/*! For license information please see keycloak.js.LICENSE.txt */
!(function (e, t) {
  'object' == typeof exports && 'undefined' != typeof module
    ? (module.exports = t(require('crypto'), require('buffer')))
    : 'function' == typeof define && define.amd
      ? define('keycloak', ['crypto', 'buffer'], t)
      : ((e = 'undefined' != typeof globalThis ? globalThis : e || self).Keycloak = t(
          e.require$$0,
          e.require$$1
        ));
})(this, function (e, t) {
  'use strict';
  var r =
    'undefined' != typeof globalThis
      ? globalThis
      : 'undefined' != typeof window
        ? window
        : 'undefined' != typeof global
          ? global
          : 'undefined' != typeof self
            ? self
            : {};
  function n(e) {
    return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e;
  }
  var o = { exports: {} };
  !(function (e, t) {
    e.exports = (function () {
      function e(e) {
        return 'function' == typeof e;
      }
      function t() {
        var e = setTimeout;
        return function () {
          return e(n, 1);
        };
      }
      function n() {
        for (var e = 0; e < w; e += 2) ((0, E[e])(E[e + 1]), (E[e] = void 0), (E[e + 1] = void 0));
        w = 0;
      }
      function o(e, t) {
        var r = this,
          n = new this.constructor(s);
        void 0 === n[O] && m(n);
        var o = r._state;
        if (o) {
          var i = arguments[o - 1];
          b(function () {
            return p(o, n, i, r._result);
          });
        } else h(r, n, e, t);
        return n;
      }
      function i(e) {
        if (e && 'object' == typeof e && e.constructor === this) return e;
        var t = new this(s);
        return (c(t, e), t);
      }
      function s() {}
      function a(t, r, n) {
        r.constructor === t.constructor && n === o && r.constructor.resolve === i
          ? (function (e, t) {
              t._state === R
                ? l(e, t._result)
                : t._state === x
                  ? d(e, t._result)
                  : h(
                      t,
                      void 0,
                      function (t) {
                        return c(e, t);
                      },
                      function (t) {
                        return d(e, t);
                      }
                    );
            })(t, r)
          : void 0 === n
            ? l(t, r)
            : e(n)
              ? (function (e, t, r) {
                  b(function (e) {
                    var n = !1,
                      o = (function (e, t, r, n) {
                        try {
                          e.call(t, r, n);
                        } catch (e) {
                          return e;
                        }
                      })(
                        r,
                        t,
                        function (r) {
                          n || ((n = !0), t !== r ? c(e, r) : l(e, r));
                        },
                        function (t) {
                          n || ((n = !0), d(e, t));
                        },
                        e._label
                      );
                    !n && o && ((n = !0), d(e, o));
                  }, e);
                })(t, r, n)
              : l(t, r);
      }
      function c(e, t) {
        if (e === t) d(e, new TypeError('You cannot resolve a promise with itself'));
        else if (
          (function (e) {
            var t = typeof e;
            return null !== e && ('object' === t || 'function' === t);
          })(t)
        ) {
          var r = void 0;
          try {
            r = t.then;
          } catch (t) {
            return void d(e, t);
          }
          a(e, t, r);
        } else l(e, t);
      }
      function u(e) {
        (e._onerror && e._onerror(e._result), f(e));
      }
      function l(e, t) {
        e._state === C && ((e._result = t), (e._state = R), 0 !== e._subscribers.length && b(f, e));
      }
      function d(e, t) {
        e._state === C && ((e._state = x), (e._result = t), b(u, e));
      }
      function h(e, t, r, n) {
        var o = e._subscribers,
          i = o.length;
        ((e._onerror = null),
          (o[i] = t),
          (o[i + R] = r),
          (o[i + x] = n),
          0 === i && e._state && b(f, e));
      }
      function f(e) {
        var t = e._subscribers,
          r = e._state;
        if (0 !== t.length) {
          for (var n = void 0, o = void 0, i = e._result, s = 0; s < t.length; s += 3)
            ((n = t[s]), (o = t[s + r]), n ? p(r, n, o, i) : o(i));
          e._subscribers.length = 0;
        }
      }
      function p(t, r, n, o) {
        var i = e(n),
          s = void 0,
          a = void 0,
          u = !0;
        if (i) {
          try {
            s = n(o);
          } catch (e) {
            ((u = !1), (a = e));
          }
          if (r === s)
            return void d(r, new TypeError('A promises callback cannot return that same promise.'));
        } else s = o;
        r._state !== C ||
          (i && u ? c(r, s) : !1 === u ? d(r, a) : t === R ? l(r, s) : t === x && d(r, s));
      }
      function m(e) {
        ((e[O] = L++), (e._state = void 0), (e._result = void 0), (e._subscribers = []));
      }
      var v;
      v = Array.isArray
        ? Array.isArray
        : function (e) {
            return '[object Array]' === Object.prototype.toString.call(e);
          };
      var g = v,
        w = 0,
        k = void 0,
        y = void 0,
        b = function (e, t) {
          ((E[w] = e), (E[w + 1] = t), 2 === (w += 2) && (y ? y(n) : I()));
        },
        _ = 'undefined' != typeof window ? window : void 0,
        S = _ || {},
        A = S.MutationObserver || S.WebKitMutationObserver,
        U =
          'undefined' == typeof self &&
          'undefined' != typeof process &&
          '[object process]' === {}.toString.call(process),
        T =
          'undefined' != typeof Uint8ClampedArray &&
          'undefined' != typeof importScripts &&
          'undefined' != typeof MessageChannel,
        E = new Array(1e3),
        I = void 0;
      I = U
        ? function () {
            return process.nextTick(n);
          }
        : A
          ? (function () {
              var e = 0,
                t = new A(n),
                r = document.createTextNode('');
              return (
                t.observe(r, { characterData: !0 }),
                function () {
                  r.data = e = ++e % 2;
                }
              );
            })()
          : T
            ? (function () {
                var e = new MessageChannel();
                return (
                  (e.port1.onmessage = n),
                  function () {
                    return e.port2.postMessage(0);
                  }
                );
              })()
            : void 0 === _
              ? (function () {
                  try {
                    var e = Function('return this')().require('vertx');
                    return void 0 !== (k = e.runOnLoop || e.runOnContext)
                      ? function () {
                          k(n);
                        }
                      : t();
                  } catch (e) {
                    return t();
                  }
                })()
              : t();
      var O = Math.random().toString(36).substring(2),
        C = void 0,
        R = 1,
        x = 2,
        L = 0,
        M = (function () {
          function e(e, t) {
            ((this._instanceConstructor = e),
              (this.promise = new e(s)),
              this.promise[O] || m(this.promise),
              g(t)
                ? ((this.length = t.length),
                  (this._remaining = t.length),
                  (this._result = new Array(this.length)),
                  0 === this.length
                    ? l(this.promise, this._result)
                    : ((this.length = this.length || 0),
                      this._enumerate(t),
                      0 === this._remaining && l(this.promise, this._result)))
                : d(this.promise, new Error('Array Methods must be provided an Array')));
          }
          return (
            (e.prototype._enumerate = function (e) {
              for (var t = 0; this._state === C && t < e.length; t++) this._eachEntry(e[t], t);
            }),
            (e.prototype._eachEntry = function (e, t) {
              var r = this._instanceConstructor,
                n = r.resolve;
              if (n === i) {
                var c = void 0,
                  u = void 0,
                  l = !1;
                try {
                  c = e.then;
                } catch (e) {
                  ((l = !0), (u = e));
                }
                if (c === o && e._state !== C) this._settledAt(e._state, t, e._result);
                else if ('function' != typeof c) (this._remaining--, (this._result[t] = e));
                else if (r === P) {
                  var h = new r(s);
                  (l ? d(h, u) : a(h, e, c), this._willSettleAt(h, t));
                } else
                  this._willSettleAt(
                    new r(function (t) {
                      return t(e);
                    }),
                    t
                  );
              } else this._willSettleAt(n(e), t);
            }),
            (e.prototype._settledAt = function (e, t, r) {
              var n = this.promise;
              (n._state === C && (this._remaining--, e === x ? d(n, r) : (this._result[t] = r)),
                0 === this._remaining && l(n, this._result));
            }),
            (e.prototype._willSettleAt = function (e, t) {
              var r = this;
              h(
                e,
                void 0,
                function (e) {
                  return r._settledAt(R, t, e);
                },
                function (e) {
                  return r._settledAt(x, t, e);
                }
              );
            }),
            e
          );
        })(),
        P = (function () {
          function t(e) {
            ((this[O] = L++),
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
                  ? (function (e, t) {
                      try {
                        t(
                          function (t) {
                            c(e, t);
                          },
                          function (t) {
                            d(e, t);
                          }
                        );
                      } catch (t) {
                        d(e, t);
                      }
                    })(this, e)
                  : (function () {
                      throw new TypeError(
                        "Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function."
                      );
                    })()));
          }
          return (
            (t.prototype.catch = function (e) {
              return this.then(null, e);
            }),
            (t.prototype.finally = function (t) {
              var r = this,
                n = r.constructor;
              return e(t)
                ? r.then(
                    function (e) {
                      return n.resolve(t()).then(function () {
                        return e;
                      });
                    },
                    function (e) {
                      return n.resolve(t()).then(function () {
                        throw e;
                      });
                    }
                  )
                : r.then(t, t);
            }),
            t
          );
        })();
      return (
        (P.prototype.then = o),
        (P.all = function (e) {
          return new M(this, e).promise;
        }),
        (P.race = function (e) {
          var t = this;
          return new t(
            g(e)
              ? function (r, n) {
                  for (var o = e.length, i = 0; i < o; i++) t.resolve(e[i]).then(r, n);
                }
              : function (e, t) {
                  return t(new TypeError('You must pass an array to race.'));
                }
          );
        }),
        (P.resolve = i),
        (P.reject = function (e) {
          var t = new this(s);
          return (d(t, e), t);
        }),
        (P._setScheduler = function (e) {
          y = e;
        }),
        (P._setAsap = function (e) {
          b = e;
        }),
        (P._asap = b),
        (P.polyfill = function () {
          var e = void 0;
          if (void 0 !== r) e = r;
          else if ('undefined' != typeof self) e = self;
          else
            try {
              e = Function('return this')();
            } catch (e) {
              throw new Error(
                'polyfill failed because global object is unavailable in this environment'
              );
            }
          var t = e.Promise;
          if (t) {
            var n = null;
            try {
              n = Object.prototype.toString.call(t.resolve());
            } catch (e) {}
            if ('[object Promise]' === n && !t.cast) return;
          }
          e.Promise = P;
        }),
        (P.Promise = P),
        P
      );
    })();
  })(o);
  var i = o.exports,
    s = { exports: {} };
  !(function (n) {
    !(function () {
      var o = 'input is invalid type',
        i = 'object' == typeof window,
        s = i ? window : {};
      s.JS_SHA256_NO_WINDOW && (i = !1);
      var a = !i && 'object' == typeof self,
        c =
          !s.JS_SHA256_NO_NODE_JS &&
          'object' == typeof process &&
          process.versions &&
          process.versions.node;
      c ? (s = r) : a && (s = self);
      var u = !s.JS_SHA256_NO_COMMON_JS && n.exports,
        l = !s.JS_SHA256_NO_ARRAY_BUFFER && 'undefined' != typeof ArrayBuffer,
        d = '0123456789abcdef'.split(''),
        h = [-2147483648, 8388608, 32768, 128],
        f = [24, 16, 8, 0],
        p = [
          1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748,
          2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206,
          2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983,
          1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671,
          3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372,
          1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411,
          3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734,
          506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779,
          1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479,
          3329325298,
        ],
        m = ['hex', 'array', 'digest', 'arrayBuffer'],
        v = [];
      ((!s.JS_SHA256_NO_NODE_JS && Array.isArray) ||
        (Array.isArray = function (e) {
          return '[object Array]' === Object.prototype.toString.call(e);
        }),
        !l ||
          (!s.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW && ArrayBuffer.isView) ||
          (ArrayBuffer.isView = function (e) {
            return 'object' == typeof e && e.buffer && e.buffer.constructor === ArrayBuffer;
          }));
      var g = function (e, t) {
          return function (r) {
            return new _(t, !0).update(r)[e]();
          };
        },
        w = function (e) {
          var t = g('hex', e);
          (c && (t = k(t, e)),
            (t.create = function () {
              return new _(e);
            }),
            (t.update = function (e) {
              return t.create().update(e);
            }));
          for (var r = 0; r < m.length; ++r) {
            var n = m[r];
            t[n] = g(n, e);
          }
          return t;
        },
        k = function (r, n) {
          var i,
            a = e,
            c = t.Buffer,
            u = n ? 'sha224' : 'sha256';
          return (
            (i =
              c.from && !s.JS_SHA256_NO_BUFFER_FROM
                ? c.from
                : function (e) {
                    return new c(e);
                  }),
            function (e) {
              if ('string' == typeof e) return a.createHash(u).update(e, 'utf8').digest('hex');
              if (null == e) throw new Error(o);
              return (
                e.constructor === ArrayBuffer && (e = new Uint8Array(e)),
                Array.isArray(e) || ArrayBuffer.isView(e) || e.constructor === c
                  ? a.createHash(u).update(i(e)).digest('hex')
                  : r(e)
              );
            }
          );
        },
        y = function (e, t) {
          return function (r, n) {
            return new S(r, t, !0).update(n)[e]();
          };
        },
        b = function (e) {
          var t = y('hex', e);
          ((t.create = function (t) {
            return new S(t, e);
          }),
            (t.update = function (e, r) {
              return t.create(e).update(r);
            }));
          for (var r = 0; r < m.length; ++r) {
            var n = m[r];
            t[n] = y(n, e);
          }
          return t;
        };
      function _(e, t) {
        (t
          ? ((v[0] =
              v[16] =
              v[1] =
              v[2] =
              v[3] =
              v[4] =
              v[5] =
              v[6] =
              v[7] =
              v[8] =
              v[9] =
              v[10] =
              v[11] =
              v[12] =
              v[13] =
              v[14] =
              v[15] =
                0),
            (this.blocks = v))
          : (this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
          e
            ? ((this.h0 = 3238371032),
              (this.h1 = 914150663),
              (this.h2 = 812702999),
              (this.h3 = 4144912697),
              (this.h4 = 4290775857),
              (this.h5 = 1750603025),
              (this.h6 = 1694076839),
              (this.h7 = 3204075428))
            : ((this.h0 = 1779033703),
              (this.h1 = 3144134277),
              (this.h2 = 1013904242),
              (this.h3 = 2773480762),
              (this.h4 = 1359893119),
              (this.h5 = 2600822924),
              (this.h6 = 528734635),
              (this.h7 = 1541459225)),
          (this.block = this.start = this.bytes = this.hBytes = 0),
          (this.finalized = this.hashed = !1),
          (this.first = !0),
          (this.is224 = e));
      }
      function S(e, t, r) {
        var n,
          i = typeof e;
        if ('string' === i) {
          var s,
            a = [],
            c = e.length,
            u = 0;
          for (n = 0; n < c; ++n)
            (s = e.charCodeAt(n)) < 128
              ? (a[u++] = s)
              : s < 2048
                ? ((a[u++] = 192 | (s >>> 6)), (a[u++] = 128 | (63 & s)))
                : s < 55296 || s >= 57344
                  ? ((a[u++] = 224 | (s >>> 12)),
                    (a[u++] = 128 | ((s >>> 6) & 63)),
                    (a[u++] = 128 | (63 & s)))
                  : ((s = 65536 + (((1023 & s) << 10) | (1023 & e.charCodeAt(++n)))),
                    (a[u++] = 240 | (s >>> 18)),
                    (a[u++] = 128 | ((s >>> 12) & 63)),
                    (a[u++] = 128 | ((s >>> 6) & 63)),
                    (a[u++] = 128 | (63 & s)));
          e = a;
        } else {
          if ('object' !== i) throw new Error(o);
          if (null === e) throw new Error(o);
          if (l && e.constructor === ArrayBuffer) e = new Uint8Array(e);
          else if (!(Array.isArray(e) || (l && ArrayBuffer.isView(e)))) throw new Error(o);
        }
        e.length > 64 && (e = new _(t, !0).update(e).array());
        var d = [],
          h = [];
        for (n = 0; n < 64; ++n) {
          var f = e[n] || 0;
          ((d[n] = 92 ^ f), (h[n] = 54 ^ f));
        }
        (_.call(this, t, r),
          this.update(h),
          (this.oKeyPad = d),
          (this.inner = !0),
          (this.sharedMemory = r));
      }
      ((_.prototype.update = function (e) {
        if (!this.finalized) {
          var t,
            r = typeof e;
          if ('string' !== r) {
            if ('object' !== r) throw new Error(o);
            if (null === e) throw new Error(o);
            if (l && e.constructor === ArrayBuffer) e = new Uint8Array(e);
            else if (!(Array.isArray(e) || (l && ArrayBuffer.isView(e)))) throw new Error(o);
            t = !0;
          }
          for (var n, i, s = 0, a = e.length, c = this.blocks; s < a; ) {
            if (
              (this.hashed &&
                ((this.hashed = !1),
                (c[0] = this.block),
                (this.block =
                  c[16] =
                  c[1] =
                  c[2] =
                  c[3] =
                  c[4] =
                  c[5] =
                  c[6] =
                  c[7] =
                  c[8] =
                  c[9] =
                  c[10] =
                  c[11] =
                  c[12] =
                  c[13] =
                  c[14] =
                  c[15] =
                    0)),
              t)
            )
              for (i = this.start; s < a && i < 64; ++s) c[i >>> 2] |= e[s] << f[3 & i++];
            else
              for (i = this.start; s < a && i < 64; ++s)
                (n = e.charCodeAt(s)) < 128
                  ? (c[i >>> 2] |= n << f[3 & i++])
                  : n < 2048
                    ? ((c[i >>> 2] |= (192 | (n >>> 6)) << f[3 & i++]),
                      (c[i >>> 2] |= (128 | (63 & n)) << f[3 & i++]))
                    : n < 55296 || n >= 57344
                      ? ((c[i >>> 2] |= (224 | (n >>> 12)) << f[3 & i++]),
                        (c[i >>> 2] |= (128 | ((n >>> 6) & 63)) << f[3 & i++]),
                        (c[i >>> 2] |= (128 | (63 & n)) << f[3 & i++]))
                      : ((n = 65536 + (((1023 & n) << 10) | (1023 & e.charCodeAt(++s)))),
                        (c[i >>> 2] |= (240 | (n >>> 18)) << f[3 & i++]),
                        (c[i >>> 2] |= (128 | ((n >>> 12) & 63)) << f[3 & i++]),
                        (c[i >>> 2] |= (128 | ((n >>> 6) & 63)) << f[3 & i++]),
                        (c[i >>> 2] |= (128 | (63 & n)) << f[3 & i++]));
            ((this.lastByteIndex = i),
              (this.bytes += i - this.start),
              i >= 64
                ? ((this.block = c[16]), (this.start = i - 64), this.hash(), (this.hashed = !0))
                : (this.start = i));
          }
          return (
            this.bytes > 4294967295 &&
              ((this.hBytes += (this.bytes / 4294967296) << 0),
              (this.bytes = this.bytes % 4294967296)),
            this
          );
        }
      }),
        (_.prototype.finalize = function () {
          if (!this.finalized) {
            this.finalized = !0;
            var e = this.blocks,
              t = this.lastByteIndex;
            ((e[16] = this.block),
              (e[t >>> 2] |= h[3 & t]),
              (this.block = e[16]),
              t >= 56 &&
                (this.hashed || this.hash(),
                (e[0] = this.block),
                (e[16] =
                  e[1] =
                  e[2] =
                  e[3] =
                  e[4] =
                  e[5] =
                  e[6] =
                  e[7] =
                  e[8] =
                  e[9] =
                  e[10] =
                  e[11] =
                  e[12] =
                  e[13] =
                  e[14] =
                  e[15] =
                    0)),
              (e[14] = (this.hBytes << 3) | (this.bytes >>> 29)),
              (e[15] = this.bytes << 3),
              this.hash());
          }
        }),
        (_.prototype.hash = function () {
          var e,
            t,
            r,
            n,
            o,
            i,
            s,
            a,
            c,
            u = this.h0,
            l = this.h1,
            d = this.h2,
            h = this.h3,
            f = this.h4,
            m = this.h5,
            v = this.h6,
            g = this.h7,
            w = this.blocks;
          for (e = 16; e < 64; ++e)
            ((t = (((o = w[e - 15]) >>> 7) | (o << 25)) ^ ((o >>> 18) | (o << 14)) ^ (o >>> 3)),
              (r = (((o = w[e - 2]) >>> 17) | (o << 15)) ^ ((o >>> 19) | (o << 13)) ^ (o >>> 10)),
              (w[e] = (w[e - 16] + t + w[e - 7] + r) << 0));
          for (c = l & d, e = 0; e < 64; e += 4)
            (this.first
              ? (this.is224
                  ? ((i = 300032),
                    (g = ((o = w[0] - 1413257819) - 150054599) << 0),
                    (h = (o + 24177077) << 0))
                  : ((i = 704751109),
                    (g = ((o = w[0] - 210244248) - 1521486534) << 0),
                    (h = (o + 143694565) << 0)),
                (this.first = !1))
              : ((t =
                  ((u >>> 2) | (u << 30)) ^ ((u >>> 13) | (u << 19)) ^ ((u >>> 22) | (u << 10))),
                (n = (i = u & l) ^ (u & d) ^ c),
                (g =
                  (h +
                    (o =
                      g +
                      (r =
                        ((f >>> 6) | (f << 26)) ^
                        ((f >>> 11) | (f << 21)) ^
                        ((f >>> 25) | (f << 7))) +
                      ((f & m) ^ (~f & v)) +
                      p[e] +
                      w[e])) <<
                  0),
                (h = (o + (t + n)) << 0)),
              (t = ((h >>> 2) | (h << 30)) ^ ((h >>> 13) | (h << 19)) ^ ((h >>> 22) | (h << 10))),
              (n = (s = h & u) ^ (h & l) ^ i),
              (v =
                (d +
                  (o =
                    v +
                    (r =
                      ((g >>> 6) | (g << 26)) ^
                      ((g >>> 11) | (g << 21)) ^
                      ((g >>> 25) | (g << 7))) +
                    ((g & f) ^ (~g & m)) +
                    p[e + 1] +
                    w[e + 1])) <<
                0),
              (t =
                (((d = (o + (t + n)) << 0) >>> 2) | (d << 30)) ^
                ((d >>> 13) | (d << 19)) ^
                ((d >>> 22) | (d << 10))),
              (n = (a = d & h) ^ (d & u) ^ s),
              (m =
                (l +
                  (o =
                    m +
                    (r =
                      ((v >>> 6) | (v << 26)) ^
                      ((v >>> 11) | (v << 21)) ^
                      ((v >>> 25) | (v << 7))) +
                    ((v & g) ^ (~v & f)) +
                    p[e + 2] +
                    w[e + 2])) <<
                0),
              (t =
                (((l = (o + (t + n)) << 0) >>> 2) | (l << 30)) ^
                ((l >>> 13) | (l << 19)) ^
                ((l >>> 22) | (l << 10))),
              (n = (c = l & d) ^ (l & h) ^ a),
              (f =
                (u +
                  (o =
                    f +
                    (r =
                      ((m >>> 6) | (m << 26)) ^
                      ((m >>> 11) | (m << 21)) ^
                      ((m >>> 25) | (m << 7))) +
                    ((m & v) ^ (~m & g)) +
                    p[e + 3] +
                    w[e + 3])) <<
                0),
              (u = (o + (t + n)) << 0),
              (this.chromeBugWorkAround = !0));
          ((this.h0 = (this.h0 + u) << 0),
            (this.h1 = (this.h1 + l) << 0),
            (this.h2 = (this.h2 + d) << 0),
            (this.h3 = (this.h3 + h) << 0),
            (this.h4 = (this.h4 + f) << 0),
            (this.h5 = (this.h5 + m) << 0),
            (this.h6 = (this.h6 + v) << 0),
            (this.h7 = (this.h7 + g) << 0));
        }),
        (_.prototype.hex = function () {
          this.finalize();
          var e = this.h0,
            t = this.h1,
            r = this.h2,
            n = this.h3,
            o = this.h4,
            i = this.h5,
            s = this.h6,
            a = this.h7,
            c =
              d[(e >>> 28) & 15] +
              d[(e >>> 24) & 15] +
              d[(e >>> 20) & 15] +
              d[(e >>> 16) & 15] +
              d[(e >>> 12) & 15] +
              d[(e >>> 8) & 15] +
              d[(e >>> 4) & 15] +
              d[15 & e] +
              d[(t >>> 28) & 15] +
              d[(t >>> 24) & 15] +
              d[(t >>> 20) & 15] +
              d[(t >>> 16) & 15] +
              d[(t >>> 12) & 15] +
              d[(t >>> 8) & 15] +
              d[(t >>> 4) & 15] +
              d[15 & t] +
              d[(r >>> 28) & 15] +
              d[(r >>> 24) & 15] +
              d[(r >>> 20) & 15] +
              d[(r >>> 16) & 15] +
              d[(r >>> 12) & 15] +
              d[(r >>> 8) & 15] +
              d[(r >>> 4) & 15] +
              d[15 & r] +
              d[(n >>> 28) & 15] +
              d[(n >>> 24) & 15] +
              d[(n >>> 20) & 15] +
              d[(n >>> 16) & 15] +
              d[(n >>> 12) & 15] +
              d[(n >>> 8) & 15] +
              d[(n >>> 4) & 15] +
              d[15 & n] +
              d[(o >>> 28) & 15] +
              d[(o >>> 24) & 15] +
              d[(o >>> 20) & 15] +
              d[(o >>> 16) & 15] +
              d[(o >>> 12) & 15] +
              d[(o >>> 8) & 15] +
              d[(o >>> 4) & 15] +
              d[15 & o] +
              d[(i >>> 28) & 15] +
              d[(i >>> 24) & 15] +
              d[(i >>> 20) & 15] +
              d[(i >>> 16) & 15] +
              d[(i >>> 12) & 15] +
              d[(i >>> 8) & 15] +
              d[(i >>> 4) & 15] +
              d[15 & i] +
              d[(s >>> 28) & 15] +
              d[(s >>> 24) & 15] +
              d[(s >>> 20) & 15] +
              d[(s >>> 16) & 15] +
              d[(s >>> 12) & 15] +
              d[(s >>> 8) & 15] +
              d[(s >>> 4) & 15] +
              d[15 & s];
          return (
            this.is224 ||
              (c +=
                d[(a >>> 28) & 15] +
                d[(a >>> 24) & 15] +
                d[(a >>> 20) & 15] +
                d[(a >>> 16) & 15] +
                d[(a >>> 12) & 15] +
                d[(a >>> 8) & 15] +
                d[(a >>> 4) & 15] +
                d[15 & a]),
            c
          );
        }),
        (_.prototype.toString = _.prototype.hex),
        (_.prototype.digest = function () {
          this.finalize();
          var e = this.h0,
            t = this.h1,
            r = this.h2,
            n = this.h3,
            o = this.h4,
            i = this.h5,
            s = this.h6,
            a = this.h7,
            c = [
              (e >>> 24) & 255,
              (e >>> 16) & 255,
              (e >>> 8) & 255,
              255 & e,
              (t >>> 24) & 255,
              (t >>> 16) & 255,
              (t >>> 8) & 255,
              255 & t,
              (r >>> 24) & 255,
              (r >>> 16) & 255,
              (r >>> 8) & 255,
              255 & r,
              (n >>> 24) & 255,
              (n >>> 16) & 255,
              (n >>> 8) & 255,
              255 & n,
              (o >>> 24) & 255,
              (o >>> 16) & 255,
              (o >>> 8) & 255,
              255 & o,
              (i >>> 24) & 255,
              (i >>> 16) & 255,
              (i >>> 8) & 255,
              255 & i,
              (s >>> 24) & 255,
              (s >>> 16) & 255,
              (s >>> 8) & 255,
              255 & s,
            ];
          return (
            this.is224 || c.push((a >>> 24) & 255, (a >>> 16) & 255, (a >>> 8) & 255, 255 & a),
            c
          );
        }),
        (_.prototype.array = _.prototype.digest),
        (_.prototype.arrayBuffer = function () {
          this.finalize();
          var e = new ArrayBuffer(this.is224 ? 28 : 32),
            t = new DataView(e);
          return (
            t.setUint32(0, this.h0),
            t.setUint32(4, this.h1),
            t.setUint32(8, this.h2),
            t.setUint32(12, this.h3),
            t.setUint32(16, this.h4),
            t.setUint32(20, this.h5),
            t.setUint32(24, this.h6),
            this.is224 || t.setUint32(28, this.h7),
            e
          );
        }),
        (S.prototype = new _()),
        (S.prototype.finalize = function () {
          if ((_.prototype.finalize.call(this), this.inner)) {
            this.inner = !1;
            var e = this.array();
            (_.call(this, this.is224, this.sharedMemory),
              this.update(this.oKeyPad),
              this.update(e),
              _.prototype.finalize.call(this));
          }
        }));
      var A = w();
      ((A.sha256 = A),
        (A.sha224 = w(!0)),
        (A.sha256.hmac = b()),
        (A.sha224.hmac = b(!0)),
        u ? (n.exports = A) : ((s.sha256 = A.sha256), (s.sha224 = A.sha224)));
    })();
  })(s);
  var a = n(s.exports);
  class c extends Error {}
  function u(e, t) {
    if ('string' != typeof e) throw new c('Invalid token specified: must be a string');
    t || (t = {});
    const r = !0 === t.header ? 0 : 1,
      n = e.split('.')[r];
    if ('string' != typeof n) throw new c(`Invalid token specified: missing part #${r + 1}`);
    let o;
    try {
      o = (function (e) {
        let t = e.replace(/-/g, '+').replace(/_/g, '/');
        switch (t.length % 4) {
          case 0:
            break;
          case 2:
            t += '==';
            break;
          case 3:
            t += '=';
            break;
          default:
            throw new Error('base64 string is not of the correct length');
        }
        try {
          return (function (e) {
            return decodeURIComponent(
              atob(e).replace(/(.)/g, (e, t) => {
                let r = t.charCodeAt(0).toString(16).toUpperCase();
                return (r.length < 2 && (r = '0' + r), '%' + r);
              })
            );
          })(t);
        } catch (e) {
          return atob(t);
        }
      })(n);
    } catch (e) {
      throw new c(`Invalid token specified: invalid base64 for part #${r + 1} (${e.message})`);
    }
    try {
      return JSON.parse(o);
    } catch (e) {
      throw new c(`Invalid token specified: invalid json for part #${r + 1} (${e.message})`);
    }
  }
  if (((c.prototype.name = 'InvalidTokenError'), void 0 === i.Promise))
    throw Error(
      'Keycloak requires an environment that supports Promises. Make sure that you include the appropriate polyfill.'
    );
  return function e(t) {
    if (!(this instanceof e))
      throw new Error("The 'Keycloak' constructor must be invoked with 'new'.");
    for (
      var r,
        n,
        o = this,
        s = [],
        c = { enable: !0, callbackList: [], interval: 5 },
        l = document.getElementsByTagName('script'),
        d = 0;
      d < l.length;
      d++
    )
      (-1 === l[d].src.indexOf('keycloak.js') && -1 === l[d].src.indexOf('keycloak.min.js')) ||
        -1 === l[d].src.indexOf('version=') ||
        (o.iframeVersion = l[d].src.substring(l[d].src.indexOf('version=') + 8).split('&')[0]);
    var h = !0,
      f = R(console.info),
      p = R(console.warn);
    function m(e, t) {
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
    function v() {
      return void 0 !== o.authServerUrl
        ? '/' == o.authServerUrl.charAt(o.authServerUrl.length - 1)
          ? o.authServerUrl + 'realms/' + encodeURIComponent(o.realm)
          : o.authServerUrl + '/realms/' + encodeURIComponent(o.realm)
        : void 0;
    }
    function g(e, t) {
      var r = e.code,
        n = e.error,
        i = e.prompt,
        s = new Date().getTime();
      if ((e.kc_action_status && o.onActionUpdate && o.onActionUpdate(e.kc_action_status), n))
        if ('none' != i)
          if (e.error_description && 'authentication_expired' === e.error_description)
            o.login(e.loginOptions);
          else {
            var a = { error: n, error_description: e.error_description };
            (o.onAuthError && o.onAuthError(a), t && t.setError(a));
          }
        else t && t.setSuccess();
      else if (
        ('standard' != o.flow &&
          (e.access_token || e.id_token) &&
          d(e.access_token, null, e.id_token, !0),
        'implicit' != o.flow && r)
      ) {
        var c = 'code=' + r + '&grant_type=authorization_code',
          u = o.endpoints.token(),
          l = new XMLHttpRequest();
        (l.open('POST', u, !0),
          l.setRequestHeader('Content-type', 'application/x-www-form-urlencoded'),
          (c += '&client_id=' + encodeURIComponent(o.clientId)),
          (c += '&redirect_uri=' + e.redirectUri),
          e.pkceCodeVerifier && (c += '&code_verifier=' + e.pkceCodeVerifier),
          (l.withCredentials = !0),
          (l.onreadystatechange = function () {
            if (4 == l.readyState)
              if (200 == l.status) {
                var e = JSON.parse(l.responseText);
                (d(e.access_token, e.refresh_token, e.id_token, 'standard' === o.flow), U());
              } else (o.onAuthError && o.onAuthError(), t && t.setError());
          }),
          l.send(c));
      }
      function d(r, n, i, a) {
        (k(r, n, i, (s = (s + new Date().getTime()) / 2)),
          h && o.idTokenParsed && o.idTokenParsed.nonce != e.storedNonce
            ? (f('[KEYCLOAK] Invalid nonce, clearing token'), o.clearToken(), t && t.setError())
            : a && (o.onAuthSuccess && o.onAuthSuccess(), t && t.setSuccess()));
      }
    }
    function w(e) {
      return 0 == e.status && e.responseText && e.responseURL.startsWith('file:');
    }
    function k(e, t, r, n) {
      if (
        (o.tokenTimeoutHandle &&
          (clearTimeout(o.tokenTimeoutHandle), (o.tokenTimeoutHandle = null)),
        t
          ? ((o.refreshToken = t), (o.refreshTokenParsed = u(t)))
          : (delete o.refreshToken, delete o.refreshTokenParsed),
        r
          ? ((o.idToken = r), (o.idTokenParsed = u(r)))
          : (delete o.idToken, delete o.idTokenParsed),
        e)
      ) {
        if (
          ((o.token = e),
          (o.tokenParsed = u(e)),
          (o.sessionId = o.tokenParsed.sid),
          (o.authenticated = !0),
          (o.subject = o.tokenParsed.sub),
          (o.realmAccess = o.tokenParsed.realm_access),
          (o.resourceAccess = o.tokenParsed.resource_access),
          n && (o.timeSkew = Math.floor(n / 1e3) - o.tokenParsed.iat),
          null != o.timeSkew &&
            (f(
              '[KEYCLOAK] Estimated time difference between browser and server is ' +
                o.timeSkew +
                ' seconds'
            ),
            o.onTokenExpired))
        ) {
          var i = 1e3 * (o.tokenParsed.exp - new Date().getTime() / 1e3 + o.timeSkew);
          (f('[KEYCLOAK] Token expires in ' + Math.round(i / 1e3) + ' s'),
            i <= 0 ? o.onTokenExpired() : (o.tokenTimeoutHandle = setTimeout(o.onTokenExpired, i)));
        }
      } else
        (delete o.token,
          delete o.tokenParsed,
          delete o.subject,
          delete o.realmAccess,
          delete o.resourceAccess,
          (o.authenticated = !1));
    }
    function y() {
      var e = '0123456789abcdef',
        t = m(36, e).split('');
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
        switch (o.flow) {
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
          i = e.indexOf('?'),
          s = e.indexOf('#');
        if (
          ('query' === o.responseMode && -1 !== i
            ? ((r = e.substring(0, i)),
              '' !== (n = _(e.substring(i + 1, -1 !== s ? s : e.length), t)).paramsString &&
                (r += '?' + n.paramsString),
              -1 !== s && (r += e.substring(s)))
            : 'fragment' === o.responseMode &&
              -1 !== s &&
              ((r = e.substring(0, s)),
              '' !== (n = _(e.substring(s + 1), t)).paramsString && (r += '#' + n.paramsString)),
          n && n.oauthParams)
        )
          if ('standard' === o.flow || 'hybrid' === o.flow) {
            if ((n.oauthParams.code || n.oauthParams.error) && n.oauthParams.state)
              return ((n.oauthParams.newUrl = r), n.oauthParams);
          } else if (
            'implicit' === o.flow &&
            (n.oauthParams.access_token || n.oauthParams.error) &&
            n.oauthParams.state
          )
            return ((n.oauthParams.newUrl = r), n.oauthParams);
      })(e);
      if (t) {
        var r = n.get(t.state);
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
    function _(e, t) {
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
        (e.promise = new i.Promise(function (t, r) {
          ((e.resolve = t), (e.reject = r));
        })),
        e
      );
    }
    function A() {
      var e = S();
      if (!c.enable) return (e.setSuccess(), e.promise);
      if (c.iframe) return (e.setSuccess(), e.promise);
      var t = document.createElement('iframe');
      ((c.iframe = t),
        (t.onload = function () {
          var t = o.endpoints.authorize();
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
      var r = o.endpoints.checkSessionIframe();
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
              'unchanged' != e.data && o.clearToken();
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
    function U() {
      c.enable &&
        o.token &&
        setTimeout(function () {
          T().then(function (e) {
            e && U();
          });
        }, 1e3 * c.interval);
    }
    function T() {
      var e = S();
      if (c.iframe && c.iframeOrigin) {
        var t = o.clientId + ' ' + (o.sessionId ? o.sessionId : '');
        c.callbackList.push(e);
        var r = c.iframeOrigin;
        1 == c.callbackList.length && c.iframe.contentWindow.postMessage(t, r);
      } else e.setSuccess();
      return e.promise;
    }
    function E() {
      var e = S();
      if (c.enable || o.silentCheckSsoRedirectUri) {
        var t = document.createElement('iframe');
        (t.setAttribute('src', o.endpoints.thirdPartyCookiesIframe()),
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
                o.silentCheckSsoFallback && (o.silentCheckSsoRedirectUri = !1)),
              document.body.removeChild(t),
              window.removeEventListener('message', r),
              e.setSuccess()));
        };
        window.addEventListener('message', r, !1);
      } else e.setSuccess();
      return (function (e, t, r) {
        var n = null,
          o = new i.Promise(function (e, r) {
            n = setTimeout(function () {
              r({ error: 'Timeout when waiting for 3rd party check iframe message.' });
            }, t);
          });
        return i.Promise.race([e, o]).finally(function () {
          clearTimeout(n);
        });
      })(e.promise, o.messageReceiveTimeout);
    }
    function I(e) {
      if (!e || 'default' == e)
        return {
          login: function (e) {
            return (window.location.assign(o.createLoginUrl(e)), S().promise);
          },
          logout: async function (e) {
            if ('GET' === (e?.logoutMethod ?? o.logoutMethod))
              return void window.location.replace(o.createLogoutUrl(e));
            const t = o.createLogoutUrl(e),
              n = await fetch(t, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  id_token_hint: o.idToken,
                  client_id: o.clientId,
                  post_logout_redirect_uri: r.redirectUri(e, !1),
                }),
              });
            if (n.redirected) window.location.href = n.url;
            else {
              if (!n.ok) throw new Error('Logout failed, request returned an error code.');
              window.location.reload();
            }
          },
          register: function (e) {
            return (window.location.assign(o.createRegisterUrl(e)), S().promise);
          },
          accountManagement: function () {
            var e = o.createAccountUrl();
            if (void 0 === e) throw 'Not supported by the OIDC server';
            return ((window.location.href = e), S().promise);
          },
          redirectUri: function (e, t) {
            return e && e.redirectUri
              ? e.redirectUri
              : o.redirectUri
                ? o.redirectUri
                : location.href;
          },
        };
      if ('cordova' == e) {
        c.enable = !1;
        var t = function (e, t, r) {
            return window.cordova && window.cordova.InAppBrowser
              ? window.cordova.InAppBrowser.open(e, t, r)
              : window.open(e, t, r);
          },
          n = function (e) {
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
          i = function () {
            return o.redirectUri || 'http://localhost';
          };
        return {
          login: function (e) {
            var r = S(),
              s = n(e),
              a = o.createLoginUrl(e),
              c = t(a, '_blank', s),
              u = !1,
              l = !1,
              d = function () {
                ((l = !0), c.close());
              };
            return (
              c.addEventListener('loadstart', function (e) {
                0 == e.url.indexOf(i()) && (g(b(e.url), r), d(), (u = !0));
              }),
              c.addEventListener('loaderror', function (e) {
                u ||
                  (0 == e.url.indexOf(i()) ? (g(b(e.url), r), d(), (u = !0)) : (r.setError(), d()));
              }),
              c.addEventListener('exit', function (e) {
                l || r.setError({ reason: 'closed_by_user' });
              }),
              r.promise
            );
          },
          logout: function (e) {
            var r,
              n = S(),
              s = o.createLogoutUrl(e),
              a = t(s, '_blank', 'location=no,hidden=yes,clearcache=yes');
            return (
              a.addEventListener('loadstart', function (e) {
                0 == e.url.indexOf(i()) && a.close();
              }),
              a.addEventListener('loaderror', function (e) {
                (0 == e.url.indexOf(i()) || (r = !0), a.close());
              }),
              a.addEventListener('exit', function (e) {
                r ? n.setError() : (o.clearToken(), n.setSuccess());
              }),
              n.promise
            );
          },
          register: function (e) {
            var r = S(),
              s = o.createRegisterUrl(),
              a = n(e),
              c = t(s, '_blank', a);
            return (
              c.addEventListener('loadstart', function (e) {
                0 == e.url.indexOf(i()) && (c.close(), g(b(e.url), r));
              }),
              r.promise
            );
          },
          accountManagement: function () {
            var e = o.createAccountUrl();
            if (void 0 === e) throw 'Not supported by the OIDC server';
            var r = t(e, '_blank', 'location=no');
            r.addEventListener('loadstart', function (e) {
              0 == e.url.indexOf(i()) && r.close();
            });
          },
          redirectUri: function (e) {
            return i();
          },
        };
      }
      if ('cordova-native' == e)
        return (
          (c.enable = !1),
          {
            login: function (e) {
              var t = S(),
                r = o.createLoginUrl(e);
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
                r = o.createLogoutUrl(e);
              return (
                universalLinks.subscribe('keycloak', function (e) {
                  (universalLinks.unsubscribe('keycloak'),
                    window.cordova.plugins.browsertab.close(),
                    o.clearToken(),
                    t.setSuccess());
                }),
                window.cordova.plugins.browsertab.openUrl(r),
                t.promise
              );
            },
            register: function (e) {
              var t = S(),
                r = o.createRegisterUrl(e);
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
              var e = o.createAccountUrl();
              if (void 0 === e) throw 'Not supported by the OIDC server';
              window.cordova.plugins.browsertab.openUrl(e);
            },
            redirectUri: function (e) {
              return e && e.redirectUri
                ? e.redirectUri
                : o.redirectUri
                  ? o.redirectUri
                  : 'http://localhost';
            },
          }
        );
      throw 'invalid adapter type: ' + e;
    }
    ((o.init = function (e) {
      if (o.didInitialize) throw new Error("A 'Keycloak' instance can only be initialized once.");
      if (
        ((o.didInitialize = !0),
        (o.authenticated = !1),
        (n = (function () {
          try {
            return new O();
          } catch (e) {}
          return new C();
        })()),
        (r =
          e && ['default', 'cordova', 'cordova-native'].indexOf(e.adapter) > -1
            ? I(e.adapter)
            : e && 'object' == typeof e.adapter
              ? e.adapter
              : window.Cordova || window.cordova
                ? I('cordova')
                : I()),
        e)
      ) {
        if (
          (void 0 !== e.useNonce && (h = e.useNonce),
          void 0 !== e.checkLoginIframe && (c.enable = e.checkLoginIframe),
          e.checkLoginIframeInterval && (c.interval = e.checkLoginIframeInterval),
          'login-required' === e.onLoad && (o.loginRequired = !0),
          e.responseMode)
        ) {
          if ('query' !== e.responseMode && 'fragment' !== e.responseMode)
            throw 'Invalid value for responseMode';
          o.responseMode = e.responseMode;
        }
        if (e.flow) {
          switch (e.flow) {
            case 'standard':
              o.responseType = 'code';
              break;
            case 'implicit':
              o.responseType = 'id_token token';
              break;
            case 'hybrid':
              o.responseType = 'code id_token token';
              break;
            default:
              throw 'Invalid value for flow';
          }
          o.flow = e.flow;
        }
        if (
          (null != e.timeSkew && (o.timeSkew = e.timeSkew),
          e.redirectUri && (o.redirectUri = e.redirectUri),
          e.silentCheckSsoRedirectUri &&
            (o.silentCheckSsoRedirectUri = e.silentCheckSsoRedirectUri),
          'boolean' == typeof e.silentCheckSsoFallback
            ? (o.silentCheckSsoFallback = e.silentCheckSsoFallback)
            : (o.silentCheckSsoFallback = !0),
          void 0 !== e.pkceMethod)
        ) {
          if ('S256' !== e.pkceMethod && !1 !== e.pkceMethod)
            throw new TypeError(
              `Invalid value for pkceMethod', expected 'S256' or false but got ${e.pkceMethod}.`
            );
          o.pkceMethod = e.pkceMethod;
        } else o.pkceMethod = 'S256';
        ('boolean' == typeof e.enableLogging
          ? (o.enableLogging = e.enableLogging)
          : (o.enableLogging = !1),
          'POST' === e.logoutMethod ? (o.logoutMethod = 'POST') : (o.logoutMethod = 'GET'),
          'string' == typeof e.scope && (o.scope = e.scope),
          'string' == typeof e.acrValues && (o.acrValues = e.acrValues),
          'number' == typeof e.messageReceiveTimeout && e.messageReceiveTimeout > 0
            ? (o.messageReceiveTimeout = e.messageReceiveTimeout)
            : (o.messageReceiveTimeout = 1e4));
      }
      (o.responseMode || (o.responseMode = 'fragment'),
        o.responseType || ((o.responseType = 'code'), (o.flow = 'standard')));
      var i = S(),
        s = S();
      s.promise
        .then(function () {
          (o.onReady && o.onReady(o.authenticated), i.setSuccess(o.authenticated));
        })
        .catch(function (e) {
          i.setError(e);
        });
      var a = (function (e) {
        var r,
          n = S();
        function i(e) {
          o.endpoints = e
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
                  return v() + '/protocol/openid-connect/auth';
                },
                token: function () {
                  return v() + '/protocol/openid-connect/token';
                },
                logout: function () {
                  return v() + '/protocol/openid-connect/logout';
                },
                checkSessionIframe: function () {
                  var e = v() + '/protocol/openid-connect/login-status-iframe.html';
                  return (o.iframeVersion && (e = e + '?version=' + o.iframeVersion), e);
                },
                thirdPartyCookiesIframe: function () {
                  var e = v() + '/protocol/openid-connect/3p-cookies/step1.html';
                  return (o.iframeVersion && (e = e + '?version=' + o.iframeVersion), e);
                },
                register: function () {
                  return v() + '/protocol/openid-connect/registrations';
                },
                userinfo: function () {
                  return v() + '/protocol/openid-connect/userinfo';
                },
              };
        }
        if ((t ? 'string' == typeof t && (r = t) : (r = 'keycloak.json'), r))
          ((c = new XMLHttpRequest()).open('GET', r, !0),
            c.setRequestHeader('Accept', 'application/json'),
            (c.onreadystatechange = function () {
              if (4 == c.readyState)
                if (200 == c.status || w(c)) {
                  var e = JSON.parse(c.responseText);
                  ((o.authServerUrl = e['auth-server-url']),
                    (o.realm = e.realm),
                    (o.clientId = e.resource),
                    i(null),
                    n.setSuccess());
                } else n.setError();
            }),
            c.send());
        else {
          if (!t.clientId) throw 'clientId missing';
          o.clientId = t.clientId;
          var s = t.oidcProvider;
          if (s) {
            var a, c;
            'string' == typeof s
              ? ((a =
                  '/' == s.charAt(s.length - 1)
                    ? s + '.well-known/openid-configuration'
                    : s + '/.well-known/openid-configuration'),
                (c = new XMLHttpRequest()).open('GET', a, !0),
                c.setRequestHeader('Accept', 'application/json'),
                (c.onreadystatechange = function () {
                  4 == c.readyState &&
                    (200 == c.status || w(c)
                      ? (i(JSON.parse(c.responseText)), n.setSuccess())
                      : n.setError());
                }),
                c.send())
              : (i(s), n.setSuccess());
          } else {
            if (!t.url)
              for (var u = document.getElementsByTagName('script'), l = 0; l < u.length; l++)
                if (u[l].src.match(/.*keycloak\.js/)) {
                  t.url = u[l].src.substr(0, u[l].src.indexOf('/js/keycloak.js'));
                  break;
                }
            if (!t.realm) throw 'realm missing';
            ((o.authServerUrl = t.url), (o.realm = t.realm), i(null), n.setSuccess());
          }
        }
        return n.promise;
      })();
      function u() {
        var t = function (t) {
            (t || (n.prompt = 'none'),
              e && e.locale && (n.locale = e.locale),
              o
                .login(n)
                .then(function () {
                  s.setSuccess();
                })
                .catch(function (e) {
                  s.setError(e);
                }));
          },
          r = function () {
            var e = document.createElement('iframe'),
              t = o.createLoginUrl({ prompt: 'none', redirectUri: o.silentCheckSsoRedirectUri });
            (e.setAttribute('src', t),
              e.setAttribute(
                'sandbox',
                'allow-storage-access-by-user-activation allow-scripts allow-same-origin'
              ),
              e.setAttribute('title', 'keycloak-silent-check-sso'),
              (e.style.display = 'none'),
              document.body.appendChild(e));
            var r = function (t) {
              t.origin === window.location.origin &&
                e.contentWindow === t.source &&
                (g(b(t.data), s),
                document.body.removeChild(e),
                window.removeEventListener('message', r));
            };
            window.addEventListener('message', r);
          },
          n = {};
        switch (e.onLoad) {
          case 'check-sso':
            c.enable
              ? A().then(function () {
                  T()
                    .then(function (e) {
                      e ? s.setSuccess() : o.silentCheckSsoRedirectUri ? r() : t(!1);
                    })
                    .catch(function (e) {
                      s.setError(e);
                    });
                })
              : o.silentCheckSsoRedirectUri
                ? r()
                : t(!1);
            break;
          case 'login-required':
            t(!0);
            break;
          default:
            throw 'Invalid value for onLoad';
        }
      }
      function l() {
        var t = b(window.location.href);
        if ((t && window.history.replaceState(window.history.state, null, t.newUrl), t && t.valid))
          return A()
            .then(function () {
              g(t, s);
            })
            .catch(function (e) {
              s.setError(e);
            });
        e
          ? e.token && e.refreshToken
            ? (k(e.token, e.refreshToken, e.idToken),
              c.enable
                ? A().then(function () {
                    T()
                      .then(function (e) {
                        e
                          ? (o.onAuthSuccess && o.onAuthSuccess(), s.setSuccess(), U())
                          : s.setSuccess();
                      })
                      .catch(function (e) {
                        s.setError(e);
                      });
                  })
                : o
                    .updateToken(-1)
                    .then(function () {
                      (o.onAuthSuccess && o.onAuthSuccess(), s.setSuccess());
                    })
                    .catch(function (t) {
                      (o.onAuthError && o.onAuthError(), e.onLoad ? u() : s.setError(t));
                    }))
            : e.onLoad
              ? u()
              : s.setSuccess()
          : s.setSuccess();
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
            .then(E)
            .then(l)
            .catch(function (e) {
              i.setError(e);
            });
        }),
        a.catch(function (e) {
          i.setError(e);
        }),
        i.promise
      );
    }),
      (o.login = function (e) {
        return r.login(e);
      }),
      (o.createLoginUrl = function (e) {
        var t,
          i = y(),
          s = y(),
          c = r.redirectUri(e),
          u = { state: i, nonce: s, redirectUri: encodeURIComponent(c), loginOptions: e };
        (e && e.prompt && (u.prompt = e.prompt),
          (t = e && 'register' == e.action ? o.endpoints.register() : o.endpoints.authorize()));
        var l = (e && e.scope) || o.scope;
        l ? -1 === l.indexOf('openid') && (l = 'openid ' + l) : (l = 'openid');
        var d,
          f =
            t +
            '?client_id=' +
            encodeURIComponent(o.clientId) +
            '&redirect_uri=' +
            encodeURIComponent(c) +
            '&state=' +
            encodeURIComponent(i) +
            '&response_mode=' +
            encodeURIComponent(o.responseMode) +
            '&response_type=' +
            encodeURIComponent(o.responseType) +
            '&scope=' +
            encodeURIComponent(l);
        if (
          (h && (f = f + '&nonce=' + encodeURIComponent(s)),
          e && e.prompt && (f += '&prompt=' + encodeURIComponent(e.prompt)),
          e && e.maxAge && (f += '&max_age=' + encodeURIComponent(e.maxAge)),
          e && e.loginHint && (f += '&login_hint=' + encodeURIComponent(e.loginHint)),
          e && e.idpHint && (f += '&kc_idp_hint=' + encodeURIComponent(e.idpHint)),
          e &&
            e.action &&
            'register' != e.action &&
            (f += '&kc_action=' + encodeURIComponent(e.action)),
          e && e.locale && (f += '&ui_locales=' + encodeURIComponent(e.locale)),
          e && e.acr)
        ) {
          var p = ((d = { id_token: { acr: e.acr } }), JSON.stringify(d));
          f += '&claims=' + encodeURIComponent(p);
        }
        if (
          (((e && e.acrValues) || o.acrValues) &&
            (f += '&acr_values=' + encodeURIComponent(e.acrValues || o.acrValues)),
          o.pkceMethod)
        ) {
          var v = m(96, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
          ((u.pkceCodeVerifier = v),
            (f +=
              '&code_challenge=' +
              (function (e, t) {
                if ('S256' !== e)
                  throw new TypeError(
                    `Invalid value for 'pkceMethod', expected 'S256' but got '${e}'.`
                  );
                return (function (e) {
                  const t = String.fromCodePoint(...e);
                  return btoa(t);
                })(new Uint8Array(a.arrayBuffer(t)))
                  .replace(/\+/g, '-')
                  .replace(/\//g, '_')
                  .replace(/\=/g, '');
              })(o.pkceMethod, v)),
            (f += '&code_challenge_method=' + o.pkceMethod));
        }
        return (n.add(u), f);
      }),
      (o.logout = function (e) {
        return r.logout(e);
      }),
      (o.createLogoutUrl = function (e) {
        if ('POST' === (e?.logoutMethod ?? o.logoutMethod)) return o.endpoints.logout();
        var t =
          o.endpoints.logout() +
          '?client_id=' +
          encodeURIComponent(o.clientId) +
          '&post_logout_redirect_uri=' +
          encodeURIComponent(r.redirectUri(e, !1));
        return (o.idToken && (t += '&id_token_hint=' + encodeURIComponent(o.idToken)), t);
      }),
      (o.register = function (e) {
        return r.register(e);
      }),
      (o.createRegisterUrl = function (e) {
        return (e || (e = {}), (e.action = 'register'), o.createLoginUrl(e));
      }),
      (o.createAccountUrl = function (e) {
        var t = v(),
          n = void 0;
        return (
          void 0 !== t &&
            (n =
              t +
              '/account?referrer=' +
              encodeURIComponent(o.clientId) +
              '&referrer_uri=' +
              encodeURIComponent(r.redirectUri(e))),
          n
        );
      }),
      (o.accountManagement = function () {
        return r.accountManagement();
      }),
      (o.hasRealmRole = function (e) {
        var t = o.realmAccess;
        return !!t && t.roles.indexOf(e) >= 0;
      }),
      (o.hasResourceRole = function (e, t) {
        if (!o.resourceAccess) return !1;
        var r = o.resourceAccess[t || o.clientId];
        return !!r && r.roles.indexOf(e) >= 0;
      }),
      (o.loadUserProfile = function () {
        var e = v() + '/account',
          t = new XMLHttpRequest();
        (t.open('GET', e, !0),
          t.setRequestHeader('Accept', 'application/json'),
          t.setRequestHeader('Authorization', 'bearer ' + o.token));
        var r = S();
        return (
          (t.onreadystatechange = function () {
            4 == t.readyState &&
              (200 == t.status
                ? ((o.profile = JSON.parse(t.responseText)), r.setSuccess(o.profile))
                : r.setError());
          }),
          t.send(),
          r.promise
        );
      }),
      (o.loadUserInfo = function () {
        var e = o.endpoints.userinfo(),
          t = new XMLHttpRequest();
        (t.open('GET', e, !0),
          t.setRequestHeader('Accept', 'application/json'),
          t.setRequestHeader('Authorization', 'bearer ' + o.token));
        var r = S();
        return (
          (t.onreadystatechange = function () {
            4 == t.readyState &&
              (200 == t.status
                ? ((o.userInfo = JSON.parse(t.responseText)), r.setSuccess(o.userInfo))
                : r.setError());
          }),
          t.send(),
          r.promise
        );
      }),
      (o.isTokenExpired = function (e) {
        if (!o.tokenParsed || (!o.refreshToken && 'implicit' != o.flow)) throw 'Not authenticated';
        if (null == o.timeSkew)
          return (
            f('[KEYCLOAK] Unable to determine if token is expired as timeskew is not set'),
            !0
          );
        var t = o.tokenParsed.exp - Math.ceil(new Date().getTime() / 1e3) + o.timeSkew;
        if (e) {
          if (isNaN(e)) throw 'Invalid minValidity';
          t -= e;
        }
        return t < 0;
      }),
      (o.updateToken = function (e) {
        var t = S();
        if (!o.refreshToken) return (t.setError(), t.promise);
        e = e || 5;
        var r = function () {
          var r = !1;
          if (
            (-1 == e
              ? ((r = !0), f('[KEYCLOAK] Refreshing token: forced refresh'))
              : (o.tokenParsed && !o.isTokenExpired(e)) ||
                ((r = !0), f('[KEYCLOAK] Refreshing token: token expired')),
            r)
          ) {
            var n = 'grant_type=refresh_token&refresh_token=' + o.refreshToken,
              i = o.endpoints.token();
            if ((s.push(t), 1 == s.length)) {
              var a = new XMLHttpRequest();
              (a.open('POST', i, !0),
                a.setRequestHeader('Content-type', 'application/x-www-form-urlencoded'),
                (a.withCredentials = !0),
                (n += '&client_id=' + encodeURIComponent(o.clientId)));
              var c = new Date().getTime();
              ((a.onreadystatechange = function () {
                if (4 == a.readyState)
                  if (200 == a.status) {
                    (f('[KEYCLOAK] Token refreshed'), (c = (c + new Date().getTime()) / 2));
                    var e = JSON.parse(a.responseText);
                    (k(e.access_token, e.refresh_token, e.id_token, c),
                      o.onAuthRefreshSuccess && o.onAuthRefreshSuccess());
                    for (var t = s.pop(); null != t; t = s.pop()) t.setSuccess(!0);
                  } else
                    for (
                      p('[KEYCLOAK] Failed to refresh token'),
                        400 == a.status && o.clearToken(),
                        o.onAuthRefreshError && o.onAuthRefreshError(),
                        t = s.pop();
                      null != t;
                      t = s.pop()
                    )
                      t.setError(!0);
              }),
                a.send(n));
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
      (o.clearToken = function () {
        o.token &&
          (k(null, null, null), o.onAuthLogout && o.onAuthLogout(), o.loginRequired && o.login());
      }));
    var O = function () {
        if (!(this instanceof O)) return new O();
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
      C = function () {
        if (!(this instanceof C)) return new C();
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
    function R(e) {
      return function () {
        o.enableLogging && e.apply(console, Array.prototype.slice.call(arguments));
      };
    }
  };
});
