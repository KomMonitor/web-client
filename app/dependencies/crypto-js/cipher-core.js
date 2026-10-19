!(function (e, t, r) {
  'object' == typeof exports
    ? (module.exports = exports = t(require('./core'), require('./evpkdf')))
    : 'function' == typeof define && define.amd
      ? define(['./core', './evpkdf'], t)
      : t(e.CryptoJS);
})(this, function (e) {
  var t, r, i, n, c, o, s, a, f, p, h, d, u, l, _, y, v, k;
  e.lib.Cipher ||
    ((i = (r = (t = e).lib).Base),
    (n = r.WordArray),
    (c = r.BufferedBlockAlgorithm),
    (o = t.enc).Utf8,
    (s = o.Base64),
    (a = t.algo.EvpKDF),
    (f = r.Cipher =
      c.extend({
        cfg: i.extend(),
        createEncryptor: function (e, t) {
          return this.create(this._ENC_XFORM_MODE, e, t);
        },
        createDecryptor: function (e, t) {
          return this.create(this._DEC_XFORM_MODE, e, t);
        },
        init: function (e, t, r) {
          ((this.cfg = this.cfg.extend(r)), (this._xformMode = e), (this._key = t), this.reset());
        },
        reset: function () {
          (c.reset.call(this), this._doReset());
        },
        process: function (e) {
          return (this._append(e), this._process());
        },
        finalize: function (e) {
          return (e && this._append(e), this._doFinalize());
        },
        keySize: 4,
        ivSize: 4,
        _ENC_XFORM_MODE: 1,
        _DEC_XFORM_MODE: 2,
        _createHelper: (function () {
          function e(e) {
            return 'string' == typeof e ? k : y;
          }
          return function (t) {
            return {
              encrypt: function (r, i, n) {
                return e(i).encrypt(t, r, i, n);
              },
              decrypt: function (r, i, n) {
                return e(i).decrypt(t, r, i, n);
              },
            };
          };
        })(),
      })),
    (r.StreamCipher = f.extend({
      _doFinalize: function () {
        return this._process(!0);
      },
      blockSize: 1,
    })),
    (p = t.mode = {}),
    (h = r.BlockCipherMode =
      i.extend({
        createEncryptor: function (e, t) {
          return this.Encryptor.create(e, t);
        },
        createDecryptor: function (e, t) {
          return this.Decryptor.create(e, t);
        },
        init: function (e, t) {
          ((this._cipher = e), (this._iv = t));
        },
      })),
    (d = p.CBC =
      (function () {
        var e = h.extend();
        function t(e, t, r) {
          var i,
            n = this._iv;
          n ? ((i = n), (this._iv = void 0)) : (i = this._prevBlock);
          for (var c = 0; c < r; c++) e[t + c] ^= i[c];
        }
        return (
          (e.Encryptor = e.extend({
            processBlock: function (e, r) {
              var i = this._cipher,
                n = i.blockSize;
              (t.call(this, e, r, n), i.encryptBlock(e, r), (this._prevBlock = e.slice(r, r + n)));
            },
          })),
          (e.Decryptor = e.extend({
            processBlock: function (e, r) {
              var i = this._cipher,
                n = i.blockSize,
                c = e.slice(r, r + n);
              (i.decryptBlock(e, r), t.call(this, e, r, n), (this._prevBlock = c));
            },
          })),
          e
        );
      })()),
    (u = (t.pad = {}).Pkcs7 =
      {
        pad: function (e, t) {
          for (
            var r = 4 * t,
              i = r - (e.sigBytes % r),
              c = (i << 24) | (i << 16) | (i << 8) | i,
              o = [],
              s = 0;
            s < i;
            s += 4
          )
            o.push(c);
          var a = n.create(o, i);
          e.concat(a);
        },
        unpad: function (e) {
          var t = 255 & e.words[(e.sigBytes - 1) >>> 2];
          e.sigBytes -= t;
        },
      }),
    (r.BlockCipher = f.extend({
      cfg: f.cfg.extend({ mode: d, padding: u }),
      reset: function () {
        var e;
        f.reset.call(this);
        var t = this.cfg,
          r = t.iv,
          i = t.mode;
        (this._xformMode == this._ENC_XFORM_MODE
          ? (e = i.createEncryptor)
          : ((e = i.createDecryptor), (this._minBufferSize = 1)),
          this._mode && this._mode.__creator == e
            ? this._mode.init(this, r && r.words)
            : ((this._mode = e.call(i, this, r && r.words)), (this._mode.__creator = e)));
      },
      _doProcessBlock: function (e, t) {
        this._mode.processBlock(e, t);
      },
      _doFinalize: function () {
        var e,
          t = this.cfg.padding;
        return (
          this._xformMode == this._ENC_XFORM_MODE
            ? (t.pad(this._data, this.blockSize), (e = this._process(!0)))
            : ((e = this._process(!0)), t.unpad(e)),
          e
        );
      },
      blockSize: 4,
    })),
    (l = r.CipherParams =
      i.extend({
        init: function (e) {
          this.mixIn(e);
        },
        toString: function (e) {
          return (e || this.formatter).stringify(this);
        },
      })),
    (_ = (t.format = {}).OpenSSL =
      {
        stringify: function (e) {
          var t = e.ciphertext,
            r = e.salt;
          return (r ? n.create([1398893684, 1701076831]).concat(r).concat(t) : t).toString(s);
        },
        parse: function (e) {
          var t,
            r = s.parse(e),
            i = r.words;
          return (
            1398893684 == i[0] &&
              1701076831 == i[1] &&
              ((t = n.create(i.slice(2, 4))), i.splice(0, 4), (r.sigBytes -= 16)),
            l.create({ ciphertext: r, salt: t })
          );
        },
      }),
    (y = r.SerializableCipher =
      i.extend({
        cfg: i.extend({ format: _ }),
        encrypt: function (e, t, r, i) {
          i = this.cfg.extend(i);
          var n = e.createEncryptor(r, i),
            c = n.finalize(t),
            o = n.cfg;
          return l.create({
            ciphertext: c,
            key: r,
            iv: o.iv,
            algorithm: e,
            mode: o.mode,
            padding: o.padding,
            blockSize: e.blockSize,
            formatter: i.format,
          });
        },
        decrypt: function (e, t, r, i) {
          return (
            (i = this.cfg.extend(i)),
            (t = this._parse(t, i.format)),
            e.createDecryptor(r, i).finalize(t.ciphertext)
          );
        },
        _parse: function (e, t) {
          return 'string' == typeof e ? t.parse(e, this) : e;
        },
      })),
    (v = (t.kdf = {}).OpenSSL =
      {
        execute: function (e, t, r, i, c) {
          if ((i || (i = n.random(8)), c))
            o = a.create({ keySize: t + r, hasher: c }).compute(e, i);
          else var o = a.create({ keySize: t + r }).compute(e, i);
          var s = n.create(o.words.slice(t), 4 * r);
          return ((o.sigBytes = 4 * t), l.create({ key: o, iv: s, salt: i }));
        },
      }),
    (k = r.PasswordBasedCipher =
      y.extend({
        cfg: y.cfg.extend({ kdf: v }),
        encrypt: function (e, t, r, i) {
          var n = (i = this.cfg.extend(i)).kdf.execute(r, e.keySize, e.ivSize, i.salt, i.hasher);
          i.iv = n.iv;
          var c = y.encrypt.call(this, e, t, n.key, i);
          return (c.mixIn(n), c);
        },
        decrypt: function (e, t, r, i) {
          ((i = this.cfg.extend(i)), (t = this._parse(t, i.format)));
          var n = i.kdf.execute(r, e.keySize, e.ivSize, t.salt, i.hasher);
          return ((i.iv = n.iv), y.decrypt.call(this, e, t, n.key, i));
        },
      })));
});
