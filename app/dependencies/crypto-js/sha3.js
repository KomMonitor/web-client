!(function (r, o, t) {
  'object' == typeof exports
    ? (module.exports = exports = o(require('./core'), require('./x64-core')))
    : 'function' == typeof define && define.amd
      ? define(['./core', './x64-core'], o)
      : o(r.CryptoJS);
})(this, function (r) {
  return (
    (function (o) {
      var t = r,
        e = t.lib,
        i = e.WordArray,
        h = e.Hasher,
        a = t.x64.Word,
        n = t.algo,
        f = [],
        c = [],
        s = [];
      !(function () {
        for (var r = 1, o = 0, t = 0; t < 24; t++) {
          f[r + 5 * o] = (((t + 1) * (t + 2)) / 2) % 64;
          var e = (2 * r + 3 * o) % 5;
          ((r = o % 5), (o = e));
        }
        for (r = 0; r < 5; r++)
          for (o = 0; o < 5; o++) c[r + 5 * o] = o + ((2 * r + 3 * o) % 5) * 5;
        for (var i = 1, h = 0; h < 24; h++) {
          for (var n = 0, l = 0, g = 0; g < 7; g++) {
            if (1 & i) {
              var v = (1 << g) - 1;
              v < 32 ? (l ^= 1 << v) : (n ^= 1 << (v - 32));
            }
            128 & i ? (i = (i << 1) ^ 113) : (i <<= 1);
          }
          s[h] = a.create(n, l);
        }
      })();
      var l = [];
      !(function () {
        for (var r = 0; r < 25; r++) l[r] = a.create();
      })();
      var g = (n.SHA3 = h.extend({
        cfg: h.cfg.extend({ outputLength: 512 }),
        _doReset: function () {
          for (var r = (this._state = []), o = 0; o < 25; o++) r[o] = new a.init();
          this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
        },
        _doProcessBlock: function (r, o) {
          for (var t = this._state, e = this.blockSize / 2, i = 0; i < e; i++) {
            var h = r[o + 2 * i],
              a = r[o + 2 * i + 1];
            ((h = (16711935 & ((h << 8) | (h >>> 24))) | (4278255360 & ((h << 24) | (h >>> 8)))),
              (a = (16711935 & ((a << 8) | (a >>> 24))) | (4278255360 & ((a << 24) | (a >>> 8)))),
              ((B = t[i]).high ^= a),
              (B.low ^= h));
          }
          for (var n = 0; n < 24; n++) {
            for (var g = 0; g < 5; g++) {
              for (var v = 0, u = 0, w = 0; w < 5; w++)
                ((v ^= (B = t[g + 5 * w]).high), (u ^= B.low));
              var d = l[g];
              ((d.high = v), (d.low = u));
            }
            for (g = 0; g < 5; g++) {
              var p = l[(g + 4) % 5],
                _ = l[(g + 1) % 5],
                H = _.high,
                x = _.low;
              for (
                v = p.high ^ ((H << 1) | (x >>> 31)), u = p.low ^ ((x << 1) | (H >>> 31)), w = 0;
                w < 5;
                w++
              )
                (((B = t[g + 5 * w]).high ^= v), (B.low ^= u));
            }
            for (var S = 1; S < 25; S++) {
              var y = (B = t[S]).high,
                b = B.low,
                A = f[S];
              A < 32
                ? ((v = (y << A) | (b >>> (32 - A))), (u = (b << A) | (y >>> (32 - A))))
                : ((v = (b << (A - 32)) | (y >>> (64 - A))),
                  (u = (y << (A - 32)) | (b >>> (64 - A))));
              var k = l[c[S]];
              ((k.high = v), (k.low = u));
            }
            var m = l[0],
              z = t[0];
            for (m.high = z.high, m.low = z.low, g = 0; g < 5; g++)
              for (w = 0; w < 5; w++) {
                var B = t[(S = g + 5 * w)],
                  L = l[S],
                  q = l[((g + 1) % 5) + 5 * w],
                  W = l[((g + 2) % 5) + 5 * w];
                ((B.high = L.high ^ (~q.high & W.high)), (B.low = L.low ^ (~q.low & W.low)));
              }
            B = t[0];
            var j = s[n];
            ((B.high ^= j.high), (B.low ^= j.low));
          }
        },
        _doFinalize: function () {
          var r = this._data,
            t = r.words,
            e = (this._nDataBytes, 8 * r.sigBytes),
            h = 32 * this.blockSize;
          ((t[e >>> 5] |= 1 << (24 - (e % 32))),
            (t[((o.ceil((e + 1) / h) * h) >>> 5) - 1] |= 128),
            (r.sigBytes = 4 * t.length),
            this._process());
          for (
            var a = this._state, n = this.cfg.outputLength / 8, f = n / 8, c = [], s = 0;
            s < f;
            s++
          ) {
            var l = a[s],
              g = l.high,
              v = l.low;
            ((g = (16711935 & ((g << 8) | (g >>> 24))) | (4278255360 & ((g << 24) | (g >>> 8)))),
              (v = (16711935 & ((v << 8) | (v >>> 24))) | (4278255360 & ((v << 24) | (v >>> 8)))),
              c.push(v),
              c.push(g));
          }
          return new i.init(c, n);
        },
        clone: function () {
          for (
            var r = h.clone.call(this), o = (r._state = this._state.slice(0)), t = 0;
            t < 25;
            t++
          )
            o[t] = o[t].clone();
          return r;
        },
      }));
      ((t.SHA3 = h._createHelper(g)), (t.HmacSHA3 = h._createHmacHelper(g)));
    })(Math),
    r.SHA3
  );
});
