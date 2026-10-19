!(function (r, e) {
  'object' == typeof exports
    ? (module.exports = exports = e(require('./core')))
    : 'function' == typeof define && define.amd
      ? define(['./core'], e)
      : e(r.CryptoJS);
})(this, function (r) {
  return (
    (function (e) {
      var t = r,
        n = t.lib,
        o = n.WordArray,
        a = n.Hasher,
        i = t.algo,
        s = [];
      !(function () {
        for (var r = 0; r < 64; r++) s[r] = (4294967296 * e.abs(e.sin(r + 1))) | 0;
      })();
      var c = (i.MD5 = a.extend({
        _doReset: function () {
          this._hash = new o.init([1732584193, 4023233417, 2562383102, 271733878]);
        },
        _doProcessBlock: function (r, e) {
          for (var t = 0; t < 16; t++) {
            var n = e + t,
              o = r[n];
            r[n] = (16711935 & ((o << 8) | (o >>> 24))) | (4278255360 & ((o << 24) | (o >>> 8)));
          }
          var a = this._hash.words,
            i = r[e + 0],
            c = r[e + 1],
            d = r[e + 2],
            l = r[e + 3],
            _ = r[e + 4],
            p = r[e + 5],
            y = r[e + 6],
            D = r[e + 7],
            H = r[e + 8],
            M = r[e + 9],
            g = r[e + 10],
            m = r[e + 11],
            w = r[e + 12],
            x = r[e + 13],
            B = r[e + 14],
            b = r[e + 15],
            j = a[0],
            k = a[1],
            q = a[2],
            z = a[3];
          ((j = f(j, k, q, z, i, 7, s[0])),
            (z = f(z, j, k, q, c, 12, s[1])),
            (q = f(q, z, j, k, d, 17, s[2])),
            (k = f(k, q, z, j, l, 22, s[3])),
            (j = f(j, k, q, z, _, 7, s[4])),
            (z = f(z, j, k, q, p, 12, s[5])),
            (q = f(q, z, j, k, y, 17, s[6])),
            (k = f(k, q, z, j, D, 22, s[7])),
            (j = f(j, k, q, z, H, 7, s[8])),
            (z = f(z, j, k, q, M, 12, s[9])),
            (q = f(q, z, j, k, g, 17, s[10])),
            (k = f(k, q, z, j, m, 22, s[11])),
            (j = f(j, k, q, z, w, 7, s[12])),
            (z = f(z, j, k, q, x, 12, s[13])),
            (q = f(q, z, j, k, B, 17, s[14])),
            (j = h(j, (k = f(k, q, z, j, b, 22, s[15])), q, z, c, 5, s[16])),
            (z = h(z, j, k, q, y, 9, s[17])),
            (q = h(q, z, j, k, m, 14, s[18])),
            (k = h(k, q, z, j, i, 20, s[19])),
            (j = h(j, k, q, z, p, 5, s[20])),
            (z = h(z, j, k, q, g, 9, s[21])),
            (q = h(q, z, j, k, b, 14, s[22])),
            (k = h(k, q, z, j, _, 20, s[23])),
            (j = h(j, k, q, z, M, 5, s[24])),
            (z = h(z, j, k, q, B, 9, s[25])),
            (q = h(q, z, j, k, l, 14, s[26])),
            (k = h(k, q, z, j, H, 20, s[27])),
            (j = h(j, k, q, z, x, 5, s[28])),
            (z = h(z, j, k, q, d, 9, s[29])),
            (q = h(q, z, j, k, D, 14, s[30])),
            (j = u(j, (k = h(k, q, z, j, w, 20, s[31])), q, z, p, 4, s[32])),
            (z = u(z, j, k, q, H, 11, s[33])),
            (q = u(q, z, j, k, m, 16, s[34])),
            (k = u(k, q, z, j, B, 23, s[35])),
            (j = u(j, k, q, z, c, 4, s[36])),
            (z = u(z, j, k, q, _, 11, s[37])),
            (q = u(q, z, j, k, D, 16, s[38])),
            (k = u(k, q, z, j, g, 23, s[39])),
            (j = u(j, k, q, z, x, 4, s[40])),
            (z = u(z, j, k, q, i, 11, s[41])),
            (q = u(q, z, j, k, l, 16, s[42])),
            (k = u(k, q, z, j, y, 23, s[43])),
            (j = u(j, k, q, z, M, 4, s[44])),
            (z = u(z, j, k, q, w, 11, s[45])),
            (q = u(q, z, j, k, b, 16, s[46])),
            (j = v(j, (k = u(k, q, z, j, d, 23, s[47])), q, z, i, 6, s[48])),
            (z = v(z, j, k, q, D, 10, s[49])),
            (q = v(q, z, j, k, B, 15, s[50])),
            (k = v(k, q, z, j, p, 21, s[51])),
            (j = v(j, k, q, z, w, 6, s[52])),
            (z = v(z, j, k, q, l, 10, s[53])),
            (q = v(q, z, j, k, g, 15, s[54])),
            (k = v(k, q, z, j, c, 21, s[55])),
            (j = v(j, k, q, z, H, 6, s[56])),
            (z = v(z, j, k, q, b, 10, s[57])),
            (q = v(q, z, j, k, y, 15, s[58])),
            (k = v(k, q, z, j, x, 21, s[59])),
            (j = v(j, k, q, z, _, 6, s[60])),
            (z = v(z, j, k, q, m, 10, s[61])),
            (q = v(q, z, j, k, d, 15, s[62])),
            (k = v(k, q, z, j, M, 21, s[63])),
            (a[0] = (a[0] + j) | 0),
            (a[1] = (a[1] + k) | 0),
            (a[2] = (a[2] + q) | 0),
            (a[3] = (a[3] + z) | 0));
        },
        _doFinalize: function () {
          var r = this._data,
            t = r.words,
            n = 8 * this._nDataBytes,
            o = 8 * r.sigBytes;
          t[o >>> 5] |= 128 << (24 - (o % 32));
          var a = e.floor(n / 4294967296),
            i = n;
          ((t[15 + (((o + 64) >>> 9) << 4)] =
            (16711935 & ((a << 8) | (a >>> 24))) | (4278255360 & ((a << 24) | (a >>> 8)))),
            (t[14 + (((o + 64) >>> 9) << 4)] =
              (16711935 & ((i << 8) | (i >>> 24))) | (4278255360 & ((i << 24) | (i >>> 8)))),
            (r.sigBytes = 4 * (t.length + 1)),
            this._process());
          for (var s = this._hash, c = s.words, f = 0; f < 4; f++) {
            var h = c[f];
            c[f] = (16711935 & ((h << 8) | (h >>> 24))) | (4278255360 & ((h << 24) | (h >>> 8)));
          }
          return s;
        },
        clone: function () {
          var r = a.clone.call(this);
          return ((r._hash = this._hash.clone()), r);
        },
      }));
      function f(r, e, t, n, o, a, i) {
        var s = r + ((e & t) | (~e & n)) + o + i;
        return ((s << a) | (s >>> (32 - a))) + e;
      }
      function h(r, e, t, n, o, a, i) {
        var s = r + ((e & n) | (t & ~n)) + o + i;
        return ((s << a) | (s >>> (32 - a))) + e;
      }
      function u(r, e, t, n, o, a, i) {
        var s = r + (e ^ t ^ n) + o + i;
        return ((s << a) | (s >>> (32 - a))) + e;
      }
      function v(r, e, t, n, o, a, i) {
        var s = r + (t ^ (e | ~n)) + o + i;
        return ((s << a) | (s >>> (32 - a))) + e;
      }
      ((t.MD5 = a._createHelper(c)), (t.HmacMD5 = a._createHmacHelper(c)));
    })(Math),
    r.MD5
  );
});
