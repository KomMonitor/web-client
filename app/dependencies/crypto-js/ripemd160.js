/*! For license information please see ripemd160.js.LICENSE.txt */
!(function (e, r) {
  'object' == typeof exports
    ? (module.exports = exports = r(require('./core')))
    : 'function' == typeof define && define.amd
      ? define(['./core'], r)
      : r(e.CryptoJS);
})(this, function (e) {
  return (
    (function (r) {
      var t = e,
        n = t.lib,
        o = n.WordArray,
        s = n.Hasher,
        a = t.algo,
        c = o.create([
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9,
          5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8,
          12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
        ]),
        i = o.create([
          5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15,
          8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3,
          11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9,
          11,
        ]),
        u = o.create([
          11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12,
          15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14,
          15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11,
          8, 5, 6,
        ]),
        f = o.create([
          8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7,
          12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8,
          11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15,
          13, 11, 11,
        ]),
        h = o.create([0, 1518500249, 1859775393, 2400959708, 2840853838]),
        d = o.create([1352829926, 1548603684, 1836072691, 2053994217, 0]),
        l = (a.RIPEMD160 = s.extend({
          _doReset: function () {
            this._hash = o.create([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
          },
          _doProcessBlock: function (e, r) {
            for (var t = 0; t < 16; t++) {
              var n = r + t,
                o = e[n];
              e[n] = (16711935 & ((o << 8) | (o >>> 24))) | (4278255360 & ((o << 24) | (o >>> 8)));
            }
            var s,
              a,
              l,
              H,
              M,
              P,
              R,
              g,
              m,
              x,
              B,
              E = this._hash.words,
              I = h.words,
              b = d.words,
              j = c.words,
              k = i.words,
              q = u.words,
              z = f.words;
            for (
              P = s = E[0], R = a = E[1], g = l = E[2], m = H = E[3], x = M = E[4], t = 0;
              t < 80;
              t += 1
            )
              ((B = (s + e[r + j[t]]) | 0),
                (B +=
                  t < 16
                    ? _(a, l, H) + I[0]
                    : t < 32
                      ? p(a, l, H) + I[1]
                      : t < 48
                        ? w(a, l, H) + I[2]
                        : t < 64
                          ? v(a, l, H) + I[3]
                          : y(a, l, H) + I[4]),
                (B = ((B = D((B |= 0), q[t])) + M) | 0),
                (s = M),
                (M = H),
                (H = D(l, 10)),
                (l = a),
                (a = B),
                (B = (P + e[r + k[t]]) | 0),
                (B +=
                  t < 16
                    ? y(R, g, m) + b[0]
                    : t < 32
                      ? v(R, g, m) + b[1]
                      : t < 48
                        ? w(R, g, m) + b[2]
                        : t < 64
                          ? p(R, g, m) + b[3]
                          : _(R, g, m) + b[4]),
                (B = ((B = D((B |= 0), z[t])) + x) | 0),
                (P = x),
                (x = m),
                (m = D(g, 10)),
                (g = R),
                (R = B));
            ((B = (E[1] + l + m) | 0),
              (E[1] = (E[2] + H + x) | 0),
              (E[2] = (E[3] + M + P) | 0),
              (E[3] = (E[4] + s + R) | 0),
              (E[4] = (E[0] + a + g) | 0),
              (E[0] = B));
          },
          _doFinalize: function () {
            var e = this._data,
              r = e.words,
              t = 8 * this._nDataBytes,
              n = 8 * e.sigBytes;
            ((r[n >>> 5] |= 128 << (24 - (n % 32))),
              (r[14 + (((n + 64) >>> 9) << 4)] =
                (16711935 & ((t << 8) | (t >>> 24))) | (4278255360 & ((t << 24) | (t >>> 8)))),
              (e.sigBytes = 4 * (r.length + 1)),
              this._process());
            for (var o = this._hash, s = o.words, a = 0; a < 5; a++) {
              var c = s[a];
              s[a] = (16711935 & ((c << 8) | (c >>> 24))) | (4278255360 & ((c << 24) | (c >>> 8)));
            }
            return o;
          },
          clone: function () {
            var e = s.clone.call(this);
            return ((e._hash = this._hash.clone()), e);
          },
        }));
      function _(e, r, t) {
        return e ^ r ^ t;
      }
      function p(e, r, t) {
        return (e & r) | (~e & t);
      }
      function w(e, r, t) {
        return (e | ~r) ^ t;
      }
      function v(e, r, t) {
        return (e & t) | (r & ~t);
      }
      function y(e, r, t) {
        return e ^ (r | ~t);
      }
      function D(e, r) {
        return (e << r) | (e >>> (32 - r));
      }
      ((t.RIPEMD160 = s._createHelper(l)), (t.HmacRIPEMD160 = s._createHmacHelper(l)));
    })(Math),
    e.RIPEMD160
  );
});
