!(function (n, r) {
  'object' == typeof exports
    ? (module.exports = exports = r(require('./core')))
    : 'function' == typeof define && define.amd
      ? define(['./core'], r)
      : r(n.CryptoJS);
})(this, function (n) {
  return (
    (function () {
      if ('function' == typeof ArrayBuffer) {
        var r = n.lib.WordArray,
          t = r.init,
          e = (r.init = function (n) {
            if (
              (n instanceof ArrayBuffer && (n = new Uint8Array(n)),
              (n instanceof Int8Array ||
                ('undefined' != typeof Uint8ClampedArray && n instanceof Uint8ClampedArray) ||
                n instanceof Int16Array ||
                n instanceof Uint16Array ||
                n instanceof Int32Array ||
                n instanceof Uint32Array ||
                n instanceof Float32Array ||
                n instanceof Float64Array) &&
                (n = new Uint8Array(n.buffer, n.byteOffset, n.byteLength)),
              n instanceof Uint8Array)
            ) {
              for (var r = n.byteLength, e = [], i = 0; i < r; i++)
                e[i >>> 2] |= n[i] << (24 - (i % 4) * 8);
              t.call(this, e, r);
            } else t.apply(this, arguments);
          });
        e.prototype = r;
      }
    })(),
    n.lib.WordArray
  );
});
