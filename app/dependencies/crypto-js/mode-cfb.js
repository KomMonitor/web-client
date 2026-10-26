!(function (e, o, r) {
  'object' == typeof exports
    ? (module.exports = exports = o(require('./core'), require('./cipher-core')))
    : 'function' == typeof define && define.amd
      ? define(['./core', './cipher-core'], o)
      : o(e.CryptoJS);
})(this, function (e) {
  return (
    (e.mode.CFB = (function () {
      var o = e.lib.BlockCipherMode.extend();
      function r(e, o, r, i) {
        var c,
          t = this._iv;
        (t ? ((c = t.slice(0)), (this._iv = void 0)) : (c = this._prevBlock), i.encryptBlock(c, 0));
        for (var n = 0; n < r; n++) e[o + n] ^= c[n];
      }
      return (
        (o.Encryptor = o.extend({
          processBlock: function (e, o) {
            var i = this._cipher,
              c = i.blockSize;
            (r.call(this, e, o, c, i), (this._prevBlock = e.slice(o, o + c)));
          },
        })),
        (o.Decryptor = o.extend({
          processBlock: function (e, o) {
            var i = this._cipher,
              c = i.blockSize,
              t = e.slice(o, o + c);
            (r.call(this, e, o, c, i), (this._prevBlock = t));
          },
        })),
        o
      );
    })()),
    e.mode.CFB
  );
});
