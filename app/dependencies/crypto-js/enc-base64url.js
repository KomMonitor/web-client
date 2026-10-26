!(function (r, e) {
  'object' == typeof exports
    ? (module.exports = exports = e(require('./core')))
    : 'function' == typeof define && define.amd
      ? define(['./core'], e)
      : e(r.CryptoJS);
})(this, function (r) {
  var e, t;
  return (
    (t = (e = r).lib.WordArray),
    (e.enc.Base64url = {
      stringify: function (r, e) {
        void 0 === e && (e = !0);
        var t = r.words,
          a = r.sigBytes,
          i = e ? this._safe_map : this._map;
        r.clamp();
        for (var o = [], n = 0; n < a; n += 3)
          for (
            var f =
                (((t[n >>> 2] >>> (24 - (n % 4) * 8)) & 255) << 16) |
                (((t[(n + 1) >>> 2] >>> (24 - ((n + 1) % 4) * 8)) & 255) << 8) |
                ((t[(n + 2) >>> 2] >>> (24 - ((n + 2) % 4) * 8)) & 255),
              s = 0;
            s < 4 && n + 0.75 * s < a;
            s++
          )
            o.push(i.charAt((f >>> (6 * (3 - s))) & 63));
        var c = i.charAt(64);
        if (c) for (; o.length % 4; ) o.push(c);
        return o.join('');
      },
      parse: function (r, e) {
        void 0 === e && (e = !0);
        var a = r.length,
          i = e ? this._safe_map : this._map,
          o = this._reverseMap;
        if (!o) {
          o = this._reverseMap = [];
          for (var n = 0; n < i.length; n++) o[i.charCodeAt(n)] = n;
        }
        var f = i.charAt(64);
        if (f) {
          var s = r.indexOf(f);
          -1 !== s && (a = s);
        }
        return (function (r, e, a) {
          for (var i = [], o = 0, n = 0; n < e; n++)
            if (n % 4) {
              var f =
                (a[r.charCodeAt(n - 1)] << ((n % 4) * 2)) |
                (a[r.charCodeAt(n)] >>> (6 - (n % 4) * 2));
              ((i[o >>> 2] |= f << (24 - (o % 4) * 8)), o++);
            }
          return t.create(i, o);
        })(r, a, o);
      },
      _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
      _safe_map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
    }),
    r.enc.Base64url
  );
});
