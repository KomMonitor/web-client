!(function (e, r, t) {
  'object' == typeof exports
    ? (module.exports = exports = r(require('./core'), require('./cipher-core')))
    : 'function' == typeof define && define.amd
      ? define(['./core', './cipher-core'], r)
      : r(e.CryptoJS);
})(this, function (e) {
  var r, t, i;
  return (
    (t = (r = e).lib.CipherParams),
    (i = r.enc.Hex),
    (r.format.Hex = {
      stringify: function (e) {
        return e.ciphertext.toString(i);
      },
      parse: function (e) {
        var r = i.parse(e);
        return t.create({ ciphertext: r });
      },
    }),
    e.format.Hex
  );
});
