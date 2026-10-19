!(function (e, r, t) {
  'object' == typeof exports
    ? (module.exports = exports = r(require('./core'), require('./sha256'), require('./hmac')))
    : 'function' == typeof define && define.amd
      ? define(['./core', './sha256', './hmac'], r)
      : r(e.CryptoJS);
})(this, function (e) {
  var r, t, i, o, n, a, c, s;
  return (
    (i = (t = (r = e).lib).Base),
    (o = t.WordArray),
    (a = (n = r.algo).SHA256),
    (c = n.HMAC),
    (s = n.PBKDF2 =
      i.extend({
        cfg: i.extend({ keySize: 4, hasher: a, iterations: 25e4 }),
        init: function (e) {
          this.cfg = this.cfg.extend(e);
        },
        compute: function (e, r) {
          for (
            var t = this.cfg,
              i = c.create(t.hasher, e),
              n = o.create(),
              a = o.create([1]),
              s = n.words,
              f = a.words,
              u = t.keySize,
              d = t.iterations;
            s.length < u;
          ) {
            var h = i.update(r).finalize(a);
            i.reset();
            for (var p = h.words, g = p.length, l = h, y = 1; y < d; y++) {
              ((l = i.finalize(l)), i.reset());
              for (var m = l.words, x = 0; x < g; x++) p[x] ^= m[x];
            }
            (n.concat(h), f[0]++);
          }
          return ((n.sigBytes = 4 * u), n);
        },
      })),
    (r.PBKDF2 = function (e, r, t) {
      return s.create(t).compute(e, r);
    }),
    e.PBKDF2
  );
});
