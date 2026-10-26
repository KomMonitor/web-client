!(function (e, t) {
  'object' == typeof exports
    ? (module.exports = exports = t(require('./core')))
    : 'function' == typeof define && define.amd
      ? define(['./core'], t)
      : t(e.CryptoJS);
})(this, function (e) {
  var t, r, o, s, n, i, a;
  return (
    (r = (t = e).lib),
    (o = r.WordArray),
    (s = r.Hasher),
    (n = t.algo),
    (i = []),
    (a = n.SHA1 =
      s.extend({
        _doReset: function () {
          this._hash = new o.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
        },
        _doProcessBlock: function (e, t) {
          for (
            var r = this._hash.words, o = r[0], s = r[1], n = r[2], a = r[3], h = r[4], c = 0;
            c < 80;
            c++
          ) {
            if (c < 16) i[c] = 0 | e[t + c];
            else {
              var f = i[c - 3] ^ i[c - 8] ^ i[c - 14] ^ i[c - 16];
              i[c] = (f << 1) | (f >>> 31);
            }
            var l = ((o << 5) | (o >>> 27)) + h + i[c];
            ((l +=
              c < 20
                ? 1518500249 + ((s & n) | (~s & a))
                : c < 40
                  ? 1859775393 + (s ^ n ^ a)
                  : c < 60
                    ? ((s & n) | (s & a) | (n & a)) - 1894007588
                    : (s ^ n ^ a) - 899497514),
              (h = a),
              (a = n),
              (n = (s << 30) | (s >>> 2)),
              (s = o),
              (o = l));
          }
          ((r[0] = (r[0] + o) | 0),
            (r[1] = (r[1] + s) | 0),
            (r[2] = (r[2] + n) | 0),
            (r[3] = (r[3] + a) | 0),
            (r[4] = (r[4] + h) | 0));
        },
        _doFinalize: function () {
          var e = this._data,
            t = e.words,
            r = 8 * this._nDataBytes,
            o = 8 * e.sigBytes;
          return (
            (t[o >>> 5] |= 128 << (24 - (o % 32))),
            (t[14 + (((o + 64) >>> 9) << 4)] = Math.floor(r / 4294967296)),
            (t[15 + (((o + 64) >>> 9) << 4)] = r),
            (e.sigBytes = 4 * t.length),
            this._process(),
            this._hash
          );
        },
        clone: function () {
          var e = s.clone.call(this);
          return ((e._hash = this._hash.clone()), e);
        },
      })),
    (t.SHA1 = s._createHelper(a)),
    (t.HmacSHA1 = s._createHmacHelper(a)),
    e.SHA1
  );
});
