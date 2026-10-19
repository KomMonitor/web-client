!(function (e, t) {
  'object' == typeof exports
    ? (module.exports = exports = t(require('./core')))
    : 'function' == typeof define && define.amd
      ? define(['./core'], t)
      : t(e.CryptoJS);
})(this, function (e) {
  var t, i, n;
  ((i = (t = e).lib.Base),
    (n = t.enc.Utf8),
    (t.algo.HMAC = i.extend({
      init: function (e, t) {
        ((e = this._hasher = new e.init()), 'string' == typeof t && (t = n.parse(t)));
        var i = e.blockSize,
          s = 4 * i;
        (t.sigBytes > s && (t = e.finalize(t)), t.clamp());
        for (
          var r = (this._oKey = t.clone()),
            o = (this._iKey = t.clone()),
            a = r.words,
            f = o.words,
            h = 0;
          h < i;
          h++
        )
          ((a[h] ^= 1549556828), (f[h] ^= 909522486));
        ((r.sigBytes = o.sigBytes = s), this.reset());
      },
      reset: function () {
        var e = this._hasher;
        (e.reset(), e.update(this._iKey));
      },
      update: function (e) {
        return (this._hasher.update(e), this);
      },
      finalize: function (e) {
        var t = this._hasher,
          i = t.finalize(e);
        return (t.reset(), t.finalize(this._oKey.clone().concat(i)));
      },
    })));
});
