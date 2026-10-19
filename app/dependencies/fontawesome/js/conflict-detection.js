/*! For license information please see conflict-detection.js.LICENSE.txt */
!(function (t, e) {
  'object' == typeof exports && 'undefined' != typeof module
    ? e()
    : 'function' == typeof define && define.amd
      ? define(e)
      : e();
})(0, function () {
  'use strict';
  let t = {},
    e = {};
  try {
    ('undefined' != typeof window && (t = window),
      'undefined' != typeof document && (e = document));
  } catch (t) {}
  const { userAgent: n = '' } = t.navigator || {},
    o = t,
    i = e,
    a = !!o.document,
    r =
      !!i.documentElement &&
      !!i.head &&
      'function' == typeof i.addEventListener &&
      'function' == typeof i.createElement,
    s = (~n.indexOf('MSIE') || n.indexOf('Trident/'), []),
    c = function () {
      (i.removeEventListener('DOMContentLoaded', c), (f = 1), s.map((t) => t()));
    };
  let f = !1;
  function l(t) {
    r && (f ? setTimeout(t, 0) : s.push(t));
  }
  r &&
    ((f = (i.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(i.readyState)),
    f || i.addEventListener('DOMContentLoaded', c));
  var d =
      'undefined' != typeof window
        ? window
        : 'undefined' != typeof global
          ? global
          : 'undefined' != typeof self
            ? self
            : {},
    u = (function (t, e) {
      return (
        (function (t) {
          !(function (e) {
            function n(t, e) {
              var n = (65535 & t) + (65535 & e);
              return (((t >> 16) + (e >> 16) + (n >> 16)) << 16) | (65535 & n);
            }
            function o(t, e, o, i, a, r) {
              return n(((s = n(n(e, t), n(i, r))) << (c = a)) | (s >>> (32 - c)), o);
              var s, c;
            }
            function i(t, e, n, i, a, r, s) {
              return o((e & n) | (~e & i), t, e, a, r, s);
            }
            function a(t, e, n, i, a, r, s) {
              return o((e & i) | (n & ~i), t, e, a, r, s);
            }
            function r(t, e, n, i, a, r, s) {
              return o(e ^ n ^ i, t, e, a, r, s);
            }
            function s(t, e, n, i, a, r, s) {
              return o(n ^ (e | ~i), t, e, a, r, s);
            }
            function c(t, e) {
              var o, c, f, l, d;
              ((t[e >> 5] |= 128 << (e % 32)), (t[14 + (((e + 64) >>> 9) << 4)] = e));
              var u = 1732584193,
                h = -271733879,
                g = -1732584194,
                m = 271733878;
              for (o = 0; o < t.length; o += 16)
                ((c = u),
                  (f = h),
                  (l = g),
                  (d = m),
                  (u = i(u, h, g, m, t[o], 7, -680876936)),
                  (m = i(m, u, h, g, t[o + 1], 12, -389564586)),
                  (g = i(g, m, u, h, t[o + 2], 17, 606105819)),
                  (h = i(h, g, m, u, t[o + 3], 22, -1044525330)),
                  (u = i(u, h, g, m, t[o + 4], 7, -176418897)),
                  (m = i(m, u, h, g, t[o + 5], 12, 1200080426)),
                  (g = i(g, m, u, h, t[o + 6], 17, -1473231341)),
                  (h = i(h, g, m, u, t[o + 7], 22, -45705983)),
                  (u = i(u, h, g, m, t[o + 8], 7, 1770035416)),
                  (m = i(m, u, h, g, t[o + 9], 12, -1958414417)),
                  (g = i(g, m, u, h, t[o + 10], 17, -42063)),
                  (h = i(h, g, m, u, t[o + 11], 22, -1990404162)),
                  (u = i(u, h, g, m, t[o + 12], 7, 1804603682)),
                  (m = i(m, u, h, g, t[o + 13], 12, -40341101)),
                  (g = i(g, m, u, h, t[o + 14], 17, -1502002290)),
                  (u = a(
                    u,
                    (h = i(h, g, m, u, t[o + 15], 22, 1236535329)),
                    g,
                    m,
                    t[o + 1],
                    5,
                    -165796510
                  )),
                  (m = a(m, u, h, g, t[o + 6], 9, -1069501632)),
                  (g = a(g, m, u, h, t[o + 11], 14, 643717713)),
                  (h = a(h, g, m, u, t[o], 20, -373897302)),
                  (u = a(u, h, g, m, t[o + 5], 5, -701558691)),
                  (m = a(m, u, h, g, t[o + 10], 9, 38016083)),
                  (g = a(g, m, u, h, t[o + 15], 14, -660478335)),
                  (h = a(h, g, m, u, t[o + 4], 20, -405537848)),
                  (u = a(u, h, g, m, t[o + 9], 5, 568446438)),
                  (m = a(m, u, h, g, t[o + 14], 9, -1019803690)),
                  (g = a(g, m, u, h, t[o + 3], 14, -187363961)),
                  (h = a(h, g, m, u, t[o + 8], 20, 1163531501)),
                  (u = a(u, h, g, m, t[o + 13], 5, -1444681467)),
                  (m = a(m, u, h, g, t[o + 2], 9, -51403784)),
                  (g = a(g, m, u, h, t[o + 7], 14, 1735328473)),
                  (u = r(
                    u,
                    (h = a(h, g, m, u, t[o + 12], 20, -1926607734)),
                    g,
                    m,
                    t[o + 5],
                    4,
                    -378558
                  )),
                  (m = r(m, u, h, g, t[o + 8], 11, -2022574463)),
                  (g = r(g, m, u, h, t[o + 11], 16, 1839030562)),
                  (h = r(h, g, m, u, t[o + 14], 23, -35309556)),
                  (u = r(u, h, g, m, t[o + 1], 4, -1530992060)),
                  (m = r(m, u, h, g, t[o + 4], 11, 1272893353)),
                  (g = r(g, m, u, h, t[o + 7], 16, -155497632)),
                  (h = r(h, g, m, u, t[o + 10], 23, -1094730640)),
                  (u = r(u, h, g, m, t[o + 13], 4, 681279174)),
                  (m = r(m, u, h, g, t[o], 11, -358537222)),
                  (g = r(g, m, u, h, t[o + 3], 16, -722521979)),
                  (h = r(h, g, m, u, t[o + 6], 23, 76029189)),
                  (u = r(u, h, g, m, t[o + 9], 4, -640364487)),
                  (m = r(m, u, h, g, t[o + 12], 11, -421815835)),
                  (g = r(g, m, u, h, t[o + 15], 16, 530742520)),
                  (u = s(
                    u,
                    (h = r(h, g, m, u, t[o + 2], 23, -995338651)),
                    g,
                    m,
                    t[o],
                    6,
                    -198630844
                  )),
                  (m = s(m, u, h, g, t[o + 7], 10, 1126891415)),
                  (g = s(g, m, u, h, t[o + 14], 15, -1416354905)),
                  (h = s(h, g, m, u, t[o + 5], 21, -57434055)),
                  (u = s(u, h, g, m, t[o + 12], 6, 1700485571)),
                  (m = s(m, u, h, g, t[o + 3], 10, -1894986606)),
                  (g = s(g, m, u, h, t[o + 10], 15, -1051523)),
                  (h = s(h, g, m, u, t[o + 1], 21, -2054922799)),
                  (u = s(u, h, g, m, t[o + 8], 6, 1873313359)),
                  (m = s(m, u, h, g, t[o + 15], 10, -30611744)),
                  (g = s(g, m, u, h, t[o + 6], 15, -1560198380)),
                  (h = s(h, g, m, u, t[o + 13], 21, 1309151649)),
                  (u = s(u, h, g, m, t[o + 4], 6, -145523070)),
                  (m = s(m, u, h, g, t[o + 11], 10, -1120210379)),
                  (g = s(g, m, u, h, t[o + 2], 15, 718787259)),
                  (h = s(h, g, m, u, t[o + 9], 21, -343485551)),
                  (u = n(u, c)),
                  (h = n(h, f)),
                  (g = n(g, l)),
                  (m = n(m, d)));
              return [u, h, g, m];
            }
            function f(t) {
              var e,
                n = '',
                o = 32 * t.length;
              for (e = 0; e < o; e += 8) n += String.fromCharCode((t[e >> 5] >>> (e % 32)) & 255);
              return n;
            }
            function l(t) {
              var e,
                n = [];
              for (n[(t.length >> 2) - 1] = void 0, e = 0; e < n.length; e += 1) n[e] = 0;
              var o = 8 * t.length;
              for (e = 0; e < o; e += 8) n[e >> 5] |= (255 & t.charCodeAt(e / 8)) << (e % 32);
              return n;
            }
            function d(t) {
              var e,
                n,
                o = '0123456789abcdef',
                i = '';
              for (n = 0; n < t.length; n += 1)
                ((e = t.charCodeAt(n)), (i += o.charAt((e >>> 4) & 15) + o.charAt(15 & e)));
              return i;
            }
            function u(t) {
              return unescape(encodeURIComponent(t));
            }
            function h(t) {
              return (function (t) {
                return f(c(l(t), 8 * t.length));
              })(u(t));
            }
            function g(t, e) {
              return (function (t, e) {
                var n,
                  o,
                  i = l(t),
                  a = [],
                  r = [];
                for (
                  a[15] = r[15] = void 0, i.length > 16 && (i = c(i, 8 * t.length)), n = 0;
                  n < 16;
                  n += 1
                )
                  ((a[n] = 909522486 ^ i[n]), (r[n] = 1549556828 ^ i[n]));
                return ((o = c(a.concat(l(e)), 512 + 8 * e.length)), f(c(r.concat(o), 640)));
              })(u(t), u(e));
            }
            function m(t, e, n) {
              return e ? (n ? g(e, t) : d(g(e, t))) : n ? h(t) : d(h(t));
            }
            t.exports ? (t.exports = m) : (e.md5 = m);
          })(d);
        })((e = { exports: {} })),
        e.exports
      );
    })();
  function h(t) {
    if (null !== t && 'object' == typeof t)
      return t.src
        ? u(t.src)
        : t.href
          ? u(t.href)
          : t.innerText && '' !== t.innerText
            ? u(t.innerText)
            : void 0;
  }
  const g = 'fa-kits-diag',
    m = 'fa-kits-node-under-test',
    p = 'data-md5',
    w = 'data-fa-detection-ignore',
    b = 'data-fa-detection-timeout',
    y = 'data-fa-detection-results-collection-max-wait',
    A = (t) => {
      (t.preventDefault(), t.stopPropagation());
    };
  function x(t) {
    let {
      fn: e = () => !0,
      initialDuration: n = 1,
      maxDuration: i = o.FontAwesomeDetection.timeout,
      showProgress: a = !1,
      progressIndicator: r,
    } = t;
    return new Promise(function (t, o) {
      !(function n(s, c) {
        setTimeout(function () {
          const s = e();
          if ((a && console.info(r), s)) t(s);
          else {
            const t = 250,
              e = t + c;
            e <= i ? n(t, e) : o('timeout');
          }
        }, s);
      })(n, 0);
    });
  }
  function T(t) {
    let { nodesTested: e, nodesFound: n } = t;
    ((o.FontAwesomeDetection = o.FontAwesomeDetection || {}),
      (o.FontAwesomeDetection.nodesTested = e),
      (o.FontAwesomeDetection.nodesFound = n),
      (o.FontAwesomeDetection.detectionDone = !0));
  }
  const F = o.FontAwesomeDetection || {},
    v = {
      report: function (t) {
        let { nodesTested: e, nodesFound: n } = t;
        const o = {};
        for (let t in n) e.conflict[t] || e.noConflict[t] || (o[t] = n[t]);
        const i = Object.keys(e.conflict).length;
        if (i > 0) {
          console.info(
            '%cConflict'.concat(i > 1 ? 's' : '', ' found:'),
            'color: darkred; font-size: large'
          );
          const t = {};
          for (let n in e.conflict) {
            const o = e.conflict[n];
            t[n] = {
              tagName: o.tagName,
              'src/href': o.src || o.href || 'n/a',
              'innerText excerpt':
                o.innerText && '' !== o.innerText ? o.innerText.slice(0, 200) + '...' : '(empty)',
            };
          }
          console.table(t);
        }
        const a = Object.keys(e.noConflict).length;
        if (a > 0) {
          console.info(
            '%cNo conflict'
              .concat(a > 1 ? 's' : '', ' found with ')
              .concat(1 === a ? 'this' : 'these', ':'),
            'color: green; font-size: large'
          );
          const t = {};
          for (let n in e.noConflict) {
            const o = e.noConflict[n];
            t[n] = {
              tagName: o.tagName,
              'src/href': o.src || o.href || 'n/a',
              'innerText excerpt':
                o.innerText && '' !== o.innerText ? o.innerText.slice(0, 200) + '...' : '(empty)',
            };
          }
          console.table(t);
        }
        const r = Object.keys(o).length;
        if (r > 0) {
          console.info(
            '%cLeftovers--we timed out before collecting test results for '.concat(
              1 === r ? 'this' : 'these',
              ':'
            ),
            'color: blue; font-size: large'
          );
          const t = {};
          for (let e in o) {
            const n = o[e];
            t[e] = {
              tagName: n.tagName,
              'src/href': n.src || n.href || 'n/a',
              'innerText excerpt':
                n.innerText && '' !== n.innerText ? n.innerText.slice(0, 200) + '...' : '(empty)',
            };
          }
          console.table(t);
        }
      },
      timeout: +(i.currentScript.getAttribute(b) || '2000'),
      resultsCollectionMaxWait: +(i.currentScript.getAttribute(y) || '5000'),
      ...F,
      __pollUntil: x,
      md5ForNode: h,
      detectionDone: !1,
      nodesTested: null,
      nodesFound: null,
    };
  o.FontAwesomeDetection = v;
  var E = 'classic',
    k = {
      classic: {
        fa: 'solid',
        fas: 'solid',
        'fa-solid': 'solid',
        far: 'regular',
        'fa-regular': 'regular',
        fal: 'light',
        'fa-light': 'light',
        fat: 'thin',
        'fa-thin': 'thin',
        fad: 'duotone',
        'fa-duotone': 'duotone',
        fab: 'brands',
        'fa-brands': 'brands',
      },
      sharp: {
        fa: 'solid',
        fass: 'solid',
        'fa-solid': 'solid',
        fasr: 'regular',
        'fa-regular': 'regular',
        fasl: 'light',
        'fa-light': 'light',
        fast: 'thin',
        'fa-thin': 'thin',
      },
      'sharp-duotone': { fa: 'solid', fasds: 'solid', 'fa-solid': 'solid' },
    };
  const C = (() => {
    try {
      return 'production' === process.env.NODE_ENV;
    } catch (t) {
      return !1;
    }
  })();
  function D(t) {
    return new Proxy(t, { get: (t, e) => (e in t ? t[e] : t[E]) });
  }
  const N = { ...k };
  ((N[E] = {
    ...k[E],
    fak: 'kit',
    'fa-kit': 'kit',
    fakd: 'kit-duotone',
    'fa-kit-duotone': 'kit-duotone',
  }),
    D(N));
  const O = {
    classic: {
      solid: 'fas',
      regular: 'far',
      light: 'fal',
      thin: 'fat',
      duotone: 'fad',
      brands: 'fab',
    },
    sharp: { solid: 'fass', regular: 'fasr', light: 'fasl', thin: 'fast' },
    'sharp-duotone': { solid: 'fasds' },
  };
  O[E] = { ...O[E], kit: 'fak', 'kit-duotone': 'fakd' };
  const j = D(O),
    M = {
      classic: {
        fab: 'fa-brands',
        fad: 'fa-duotone',
        fal: 'fa-light',
        far: 'fa-regular',
        fas: 'fa-solid',
        fat: 'fa-thin',
      },
      sharp: { fass: 'fa-solid', fasr: 'fa-regular', fasl: 'fa-light', fast: 'fa-thin' },
      'sharp-duotone': { fasds: 'fa-solid' },
    };
  ((M[E] = { ...M[E], fak: 'fa-kit' }), D(M));
  const S = {
    classic: {
      'fa-brands': 'fab',
      'fa-duotone': 'fad',
      'fa-light': 'fal',
      'fa-regular': 'far',
      'fa-solid': 'fas',
      'fa-thin': 'fat',
    },
    sharp: { 'fa-solid': 'fass', 'fa-regular': 'fasr', 'fa-light': 'fasl', 'fa-thin': 'fast' },
    'sharp-duotone': { 'fa-solid': 'fasds' },
  };
  ((S[E] = { ...S[E], 'fa-kit': 'fak' }),
    D(S),
    D({
      classic: { 900: 'fas', 400: 'far', normal: 'far', 300: 'fal', 100: 'fat' },
      sharp: { 900: 'fass', 400: 'fasr', 300: 'fasl', 100: 'fast' },
      'sharp-duotone': { 900: 'fasds' },
    }));
  const I = new Set();
  (Object.keys(j[E]).map(I.add.bind(I)),
    Object.keys(j.sharp).map(I.add.bind(I)),
    Object.keys(j['sharp-duotone']).map(I.add.bind(I)),
    (function (t) {
      try {
        for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), o = 1; o < e; o++)
          n[o - 1] = arguments[o];
        t(...n);
      } catch (t) {
        if (!C) throw t;
      }
    })(() => {
      a &&
        r &&
        (function () {
          let t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : () => {};
          const e = { conflict: {}, noConflict: {} };
          o.onmessage = function (t) {
            ('file://' !== o.location.origin && t.origin !== o.location.origin) ||
              (t &&
                t.data &&
                ('fontawesome-conflict' === t.data.type
                  ? (e.conflict[t.data.md5] = t.data)
                  : 'no-conflict' === t.data.type && (e.noConflict[t.data.md5] = t.data)));
          };
          const n = (function (t) {
              const e = Array.from(i.scripts).filter((e) => !e.hasAttribute(w) && e !== t),
                n = {};
              for (let t = 0; t < e.length; t++) {
                const a = i.createElement('iframe');
                a.setAttribute('style', 'display:none;');
                const r = i.createElement('script');
                r.setAttribute('id', m);
                const s = h(e[t]);
                (r.setAttribute(p, s),
                  (n[s] = e[t]),
                  '' !== e[t].src && (r.src = e[t].src),
                  '' !== e[t].innerText && (r.innerText = e[t].innerText),
                  (r.async = !0));
                const c = i.createElement('script');
                c.setAttribute('id', g);
                const f = 'file://' === o.location.origin ? '*' : o.location.origin,
                  d = (t, e, n) => {
                    parent.FontAwesomeDetection.__pollUntil({
                      fn: () => !!window.FontAwesomeConfig || !!window.FontAwesomeKitConfig,
                    })
                      .then(function () {
                        const o = document.getElementById(t);
                        parent.postMessage(
                          {
                            type: 'fontawesome-conflict',
                            technology: 'js',
                            src: o.src,
                            innerText: o.innerText,
                            tagName: o.tagName,
                            md5: e,
                          },
                          n
                        );
                      })
                      .catch(function (o) {
                        var i = document.getElementById(t);
                        'timeout' === o
                          ? parent.postMessage(
                              {
                                type: 'no-conflict',
                                src: i.src,
                                innerText: i.innerText,
                                tagName: i.tagName,
                                md5: e,
                              },
                              n
                            )
                          : console.error(o);
                      });
                  };
                ((c.innerText = '('
                  .concat(d.toString(), ")('")
                  .concat(m, "', '")
                  .concat(s, "', '")
                  .concat(f, "');")),
                  (a.onload = function () {
                    (a.contentWindow.addEventListener('error', A, !0),
                      a.contentDocument.head.appendChild(c),
                      a.contentDocument.head.appendChild(r));
                  }),
                  l(() => i.body.appendChild(a)));
              }
              return n;
            })(i.currentScript),
            a = (function () {
              const t = Array.from(i.getElementsByTagName('link')).filter(
                  (t) => !t.hasAttribute(w)
                ),
                e = Array.from(i.getElementsByTagName('style')).filter(
                  (t) =>
                    !(
                      t.hasAttribute(w) ||
                      (o.FontAwesomeConfig &&
                        t.innerText.match(
                          new RegExp(
                            'svg:not\\(:root\\)\\.'.concat(o.FontAwesomeConfig.replacementClass)
                          )
                        ))
                    )
                );
              function n(t, e) {
                const n = i.createElement('iframe');
                n.setAttribute(
                  'style',
                  'visibility: hidden; position: absolute; height: 0; width: 0;'
                );
                const a = 'fa-test-icon-' + e,
                  r = i.createElement('i');
                (r.setAttribute('class', 'fa fa-coffee'), r.setAttribute('id', a));
                const s = i.createElement('script');
                s.setAttribute('id', g);
                const c = 'file://' === o.location.origin ? '*' : o.location.origin;
                ((s.innerText = '('
                  .concat(
                    ((t, e, n, o) => {
                      parent.FontAwesomeDetection.__pollUntil({
                        fn: () => {
                          const t = document.getElementById(e),
                            n = window.getComputedStyle(t).getPropertyValue('font-family');
                          return !(!n.match(/FontAwesome/) && !n.match(/Font Awesome [56]/));
                        },
                      })
                        .then(() => {
                          const e = document.getElementById(t);
                          parent.postMessage(
                            {
                              type: 'fontawesome-conflict',
                              technology: 'webfont',
                              href: e.href,
                              innerText: e.innerText,
                              tagName: e.tagName,
                              md5: n,
                            },
                            o
                          );
                        })
                        .catch(function (e) {
                          const i = document.getElementById(t);
                          'timeout' === e
                            ? parent.postMessage(
                                {
                                  type: 'no-conflict',
                                  technology: 'webfont',
                                  href: i.src,
                                  innerText: i.innerText,
                                  tagName: i.tagName,
                                  md5: n,
                                },
                                o
                              )
                            : console.error(e);
                        });
                    }).toString(),
                    ")('"
                  )
                  .concat(m, "', '")
                  .concat(a || 'foo', "', '")
                  .concat(e, "', '")
                  .concat(c, "');")),
                  (n.onload = function () {
                    (n.contentWindow.addEventListener('error', A, !0),
                      n.contentDocument.head.appendChild(s),
                      n.contentDocument.head.appendChild(t),
                      n.contentDocument.body.appendChild(r));
                  }),
                  l(() => i.body.appendChild(n)));
              }
              const a = {};
              for (let e = 0; e < t.length; e++) {
                const o = i.createElement('link');
                (o.setAttribute('id', m),
                  o.setAttribute('href', t[e].href),
                  o.setAttribute('rel', t[e].rel));
                const r = h(t[e]);
                (o.setAttribute(p, r), (a[r] = t[e]), n(o, r));
              }
              for (let t = 0; t < e.length; t++) {
                var r = i.createElement('style');
                r.setAttribute('id', m);
                const o = h(e[t]);
                (r.setAttribute(p, o), (r.innerText = e[t].innerText), (a[o] = e[t]), n(r, o));
              }
              return a;
            })(),
            r = { ...n, ...a },
            s = Object.keys(n).length + Object.keys(a).length,
            c = o.FontAwesomeDetection.timeout + o.FontAwesomeDetection.resultsCollectionMaxWait;
          (console.group('Font Awesome Detector'),
            0 === s
              ? (console.info('%cAll Good!', 'color: green; font-size: large'),
                console.info(
                  "We didn't find anything that needs testing for conflicts. Ergo, no conflicts."
                ))
              : (console.info('Testing '.concat(s, ' possible conflicts.')),
                console.info(
                  "We'll wait about ".concat(
                    Math.round(o.FontAwesomeDetection.timeout / 10) / 100,
                    ' seconds while testing these and\n'
                  ) +
                    'then up to another '.concat(
                      Math.round(o.FontAwesomeDetection.resultsCollectionMaxWait / 10) / 100,
                      ' to allow the browser time\n'
                    ) +
                    "to accumulate the results. But we'll probably be outta here way before then.\n\n"
                ),
                console.info(
                  'You can adjust those durations by assigning values to these attributes on the <script> element that loads this detection:'
                ),
                console.info(
                  '\t%c'.concat(
                    b,
                    "%c: milliseconds to wait for each test before deciding whether it's a conflict."
                  ),
                  'font-weight: bold;',
                  'font-size: normal;'
                ),
                console.info(
                  '\t%c'.concat(
                    y,
                    '%c: milliseconds to wait for the browser to accumulate test results before giving up.'
                  ),
                  'font-weight: bold;',
                  'font-size: normal;'
                ),
                x({
                  maxDuration: c,
                  showProgress: !0,
                  progressIndicator: 'waiting...',
                  fn: () => Object.keys(e.conflict).length + Object.keys(e.noConflict).length >= s,
                })
                  .then(() => {
                    (console.info('DONE!'),
                      T({ nodesTested: e, nodesFound: r }),
                      t({ nodesTested: e, nodesFound: r }),
                      console.groupEnd());
                  })
                  .catch((n) => {
                    ('timeout' === n
                      ? (console.info(
                          "TIME OUT! We waited until we got tired. Here's what we found:"
                        ),
                        T({ nodesTested: e, nodesFound: r }),
                        t({ nodesTested: e, nodesFound: r }))
                      : (console.info('Whoops! We hit an error:', n),
                        console.info("Here's what we'd found up until that error:"),
                        T({ nodesTested: e, nodesFound: r }),
                        t({ nodesTested: e, nodesFound: r })),
                      console.groupEnd());
                  })));
        })(window.FontAwesomeDetection.report);
    }));
});
