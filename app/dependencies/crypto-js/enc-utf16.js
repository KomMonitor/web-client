!(function (r, e) {
  'object' == typeof exports
    ? (module.exports = exports = e(require('./core')))
    : 'function' == typeof define && define.amd
      ? define(['./core'], e)
      : e(r.CryptoJS);
})(this, function (r) {
  return (
    (function () {
      var e = r,
        t = e.lib.WordArray,
        n = e.enc;
      function o(r) {
        return ((r << 8) & 4278255360) | ((r >>> 8) & 16711935);
      }
      ((n.Utf16 = n.Utf16BE =
        {
          stringify: function (r) {
            for (var e = r.words, t = r.sigBytes, n = [], o = 0; o < t; o += 2) {
              var f = (e[o >>> 2] >>> (16 - (o % 4) * 8)) & 65535;
              n.push(String.fromCharCode(f));
            }
            return n.join('');
          },
          parse: function (r) {
            for (var e = r.length, n = [], o = 0; o < e; o++)
              n[o >>> 1] |= r.charCodeAt(o) << (16 - (o % 2) * 16);
            return t.create(n, 2 * e);
          },
        }),
        (n.Utf16LE = {
          stringify: function (r) {
            for (var e = r.words, t = r.sigBytes, n = [], f = 0; f < t; f += 2) {
              var i = o((e[f >>> 2] >>> (16 - (f % 4) * 8)) & 65535);
              n.push(String.fromCharCode(i));
            }
            return n.join('');
          },
          parse: function (r) {
            for (var e = r.length, n = [], f = 0; f < e; f++)
              n[f >>> 1] |= o(r.charCodeAt(f) << (16 - (f % 2) * 16));
            return t.create(n, 2 * e);
          },
        }));
    })(),
    r.enc.Utf16
  );
});
