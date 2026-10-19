!(function (e, t) {
  'object' == typeof exports && 'object' == typeof module
    ? (module.exports = t(require('leaflet')))
    : 'function' == typeof define && define.amd
      ? define(['leaflet'], t)
      : 'object' == typeof exports
        ? (exports.VectorMarkers = t(require('leaflet')))
        : (e.VectorMarkers = t(e.L));
})(this, function (e) {
  return (function (e) {
    var t = {};
    function o(n) {
      if (t[n]) return t[n].exports;
      var r = (t[n] = { exports: {}, id: n, loaded: !1 });
      return (e[n].call(r.exports, r, r.exports, o), (r.loaded = !0), r.exports);
    }
    return ((o.m = e), (o.c = t), (o.p = ''), o(0));
  })([
    function (e, t, o) {
      'use strict';
      (Object.defineProperty(t, '__esModule', { value: !0 }), (t.Icon = t.VectorMarkers = void 0));
      var n = s(o(1)),
        r = s(o(2)),
        i = s(o(3));
      function s(e) {
        return e && e.__esModule ? e : { default: e };
      }
      ((t.VectorMarkers = r.default), (t.Icon = i.default), (n.default.VectorMarkers = r.default));
    },
    function (t, o) {
      t.exports = e;
    },
    function (e, t, o) {
      'use strict';
      Object.defineProperty(t, '__esModule', { value: !0 });
      var n,
        r = (n = o(3)) && n.__esModule ? n : { default: n };
      t.default = {
        version: '1.0.0',
        Icon: r.default,
        icon: function (e) {
          return new r.default(e);
        },
      };
    },
    function (e, t, o) {
      'use strict';
      Object.defineProperty(t, '__esModule', { value: !0 });
      var n,
        r = (function () {
          function e(e, t) {
            for (var o = 0; o < t.length; o++) {
              var n = t[o];
              ((n.enumerable = n.enumerable || !1),
                (n.configurable = !0),
                'value' in n && (n.writable = !0),
                Object.defineProperty(e, n.key, n));
            }
          }
          return function (t, o, n) {
            return (o && e(t.prototype, o), n && e(t, n), t);
          };
        })(),
        i = (n = o(1)) && n.__esModule ? n : { default: n },
        s = {
          iconSize: [30, 50],
          iconAnchor: [15, 50],
          popupAnchor: [2, -40],
          shadowAnchor: [39, 45],
          shadowSize: [54, 51],
          className: 'vector-marker',
          prefix: 'fa',
          spinClass: 'fa-spin',
          extraIconClasses: '',
          extraDivClasses: '',
          icon: 'home',
          markerColor: 'blue',
          iconColor: 'white',
          viewBox: '0 0 32 52',
        },
        a = (function (e) {
          function t(e) {
            !(function (e, t) {
              if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function');
            })(this, t);
            var o = (function (e, t) {
              if (!e)
                throw new ReferenceError(
                  "this hasn't been initialised - super() hasn't been called"
                );
              return !t || ('object' != typeof t && 'function' != typeof t) ? e : t;
            })(this, Object.getPrototypeOf(t).call(this, e));
            return (i.default.Util.setOptions(o, s), i.default.Util.setOptions(o, e), o);
          }
          return (
            (function (e, t) {
              if ('function' != typeof t && null !== t)
                throw new TypeError(
                  'Super expression must either be null or a function, not ' + typeof t
                );
              ((e.prototype = Object.create(t && t.prototype, {
                constructor: { value: e, enumerable: !1, writable: !0, configurable: !0 },
              })),
                t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : (e.__proto__ = t)));
            })(t, e),
            r(t, [
              {
                key: 'createIcon',
                value: function (e) {
                  var t = e && 'DIV' === e.tagName ? e : document.createElement('div'),
                    o = this.options,
                    n =
                      o.map_pin ||
                      'M16,1 C7.7146,1 1,7.65636364 1,15.8648485 C1,24.0760606 16,51 16,51 C16,51 31,24.0760606 31,15.8648485 C31,7.65636364 24.2815,1 16,1 L16,1 Z';
                  return (
                    (t.innerHTML =
                      '<svg width="' +
                      o.iconSize[0] +
                      'px" height="' +
                      o.iconSize[1] +
                      'px" viewBox="' +
                      o.viewBox +
                      '" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="' +
                      n +
                      '" fill="' +
                      o.markerColor +
                      '"></path></svg>'),
                    o.icon && t.appendChild(this._createInner()),
                    (o.className +=
                      o.className.length > 0 ? ' ' + o.extraDivClasses : o.extraDivClasses),
                    this._setIconStyles(t, 'icon'),
                    this._setIconStyles(t, 'icon-' + o.markerColor),
                    t
                  );
                },
              },
              {
                key: 'createShadow',
                value: function () {
                  var e = document.createElement('div');
                  return (this._setIconStyles(e, 'shadow'), e);
                },
              },
              {
                key: '_createInner',
                value: function () {
                  var e = document.createElement('i'),
                    t = this.options;
                  return (
                    e.classList.add(t.prefix),
                    t.extraClasses && e.classList.add(t.extraClasses),
                    t.icon.slice(0, t.prefix.length + 1) === t.prefix + '-'
                      ? e.classList.add(t.icon)
                      : e.classList.add(t.prefix + '-' + t.icon),
                    t.spin && 'string' == typeof t.spinClass && e.classList.add(t.spinClass),
                    t.iconColor &&
                      ('white' === t.iconColor || 'black' === t.iconColor
                        ? e.classList.add('icon-' + t.iconColor)
                        : (e.style.color = t.iconColor)),
                    t.iconSize && (e.style.width = t.iconSize[0] + 'px'),
                    e
                  );
                },
              },
              {
                key: '_setIconStyles',
                value: function (e, t) {
                  var o = this.options,
                    n = i.default.point(o['shadow' === t ? 'shadowSize' : 'iconSize']),
                    r = void 0;
                  (!(r =
                    'shadow' === t
                      ? i.default.point(o.shadowAnchor || o.iconAnchor)
                      : i.default.point(o.iconAnchor)) &&
                    n &&
                    (r = n.divideBy(2, !0)),
                    (e.className = 'vector-marker-' + t + ' ' + o.className),
                    r && ((e.style.marginLeft = -r.x + 'px'), (e.style.marginTop = -r.y + 'px')),
                    n && ((e.style.width = n.x + 'px'), (e.style.height = n.y + 'px')));
                },
              },
            ]),
            t
          );
        })(i.default.Icon);
      t.default = a;
    },
  ]);
});
