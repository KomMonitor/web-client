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
    (e.enc.Base64 = {
      stringify: function (r) {
        var e = r.words,
          t = r.sigBytes,
          a = this._map;
        r.clamp();
        for (var n = [], o = 0; o < t; o += 3)
          for (
            var i =
                (((e[o >>> 2] >>> (24 - (o % 4) * 8)) & 255) << 16) |
                (((e[(o + 1) >>> 2] >>> (24 - ((o + 1) % 4) * 8)) & 255) << 8) |
                ((e[(o + 2) >>> 2] >>> (24 - ((o + 2) % 4) * 8)) & 255),
              f = 0;
            f < 4 && o + 0.75 * f < t;
            f++
          )
            n.push(a.charAt((i >>> (6 * (3 - f))) & 63));
        var c = a.charAt(64);
        if (c) for (; n.length % 4; ) n.push(c);
        return n.join('');
      },
      parse: function (r) {
        var e = r.length,
          a = this._map,
          n = this._reverseMap;
        if (!n) {
          n = this._reverseMap = [];
          for (var o = 0; o < a.length; o++) n[a.charCodeAt(o)] = o;
        }
        var i = a.charAt(64);
        if (i) {
          var f = r.indexOf(i);
          -1 !== f && (e = f);
        }
        return (function (r, e, a) {
          for (var n = [], o = 0, i = 0; i < e; i++)
            if (i % 4) {
              var f =
                (a[r.charCodeAt(i - 1)] << ((i % 4) * 2)) |
                (a[r.charCodeAt(i)] >>> (6 - (i % 4) * 2));
              ((n[o >>> 2] |= f << (24 - (o % 4) * 8)), o++);
            }
          return t.create(n, o);
        })(r, e, n);
      },
      _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    }),
    r.enc.Base64
  );
});
