!(function (e, t, r) {
  'object' == typeof exports
    ? (module.exports = exports = t(require('./core'), require('./sha1'), require('./hmac')))
    : 'function' == typeof define && define.amd
      ? define(['./core', './sha1', './hmac'], t)
      : t(e.CryptoJS);
})(this, function (e) {
  var t, r, i, n, o, a, c;
  return (
    (i = (r = (t = e).lib).Base),
    (n = r.WordArray),
    (a = (o = t.algo).MD5),
    (c = o.EvpKDF =
      i.extend({
        cfg: i.extend({ keySize: 4, hasher: a, iterations: 1 }),
        init: function (e) {
          this.cfg = this.cfg.extend(e);
        },
        compute: function (e, t) {
          for (
            var r,
              i = this.cfg,
              o = i.hasher.create(),
              a = n.create(),
              c = a.words,
              f = i.keySize,
              s = i.iterations;
            c.length < f;
          ) {
            (r && o.update(r), (r = o.update(e).finalize(t)), o.reset());
            for (var u = 1; u < s; u++) ((r = o.finalize(r)), o.reset());
            a.concat(r);
          }
          return ((a.sigBytes = 4 * f), a);
        },
      })),
    (t.EvpKDF = function (e, t, r) {
      return c.create(r).compute(e, t);
    }),
    e.EvpKDF
  );
});
