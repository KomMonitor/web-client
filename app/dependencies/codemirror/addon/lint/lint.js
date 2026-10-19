!(function (t) {
  'object' == typeof exports && 'object' == typeof module
    ? t(require('../../lib/codemirror'))
    : 'function' == typeof define && define.amd
      ? define(['../../lib/codemirror'], t)
      : t(CodeMirror);
})(function (t) {
  'use strict';
  var e = 'CodeMirror-lint-markers',
    n = 'CodeMirror-lint-line-';
  function o(t) {
    t.parentNode && t.parentNode.removeChild(t);
  }
  function i(e, n, i, r) {
    var a = (function (e, n, o) {
      var i = document.createElement('div');
      function r(e) {
        if (!i.parentNode) return t.off(document, 'mousemove', r);
        var n = Math.max(0, e.clientY - i.offsetHeight - 5),
          o = Math.max(
            0,
            Math.min(e.clientX + 5, i.ownerDocument.defaultView.innerWidth - i.offsetWidth)
          );
        ((i.style.top = n + 'px'), (i.style.left = o + 'px'));
      }
      return (
        (i.className = 'CodeMirror-lint-tooltip cm-s-' + e.options.theme),
        i.appendChild(o.cloneNode(!0)),
        e.state.lint.options.selfContain
          ? e.getWrapperElement().appendChild(i)
          : document.body.appendChild(i),
        t.on(document, 'mousemove', r),
        r(n),
        null != i.style.opacity && (i.style.opacity = 1),
        i
      );
    })(e, n, i);
    function l() {
      var e;
      (t.off(r, 'mouseout', l),
        a &&
          ((e = a).parentNode &&
            (null == e.style.opacity && o(e),
            (e.style.opacity = 0),
            setTimeout(function () {
              o(e);
            }, 600)),
          (a = null)));
    }
    var s = setInterval(function () {
      if (a)
        for (var t = r; ; t = t.parentNode) {
          if ((t && 11 == t.nodeType && (t = t.host), t == document.body)) return;
          if (!t) {
            l();
            break;
          }
        }
      if (!a) return clearInterval(s);
    }, 400);
    t.on(r, 'mouseout', l);
  }
  function r(t, e, n) {
    for (var o in ((this.marked = []),
    e instanceof Function && (e = { getAnnotations: e }),
    (e && !0 !== e) || (e = {}),
    (this.options = {}),
    (this.linterOptions = e.options || {}),
    a))
      this.options[o] = a[o];
    for (var o in e)
      a.hasOwnProperty(o)
        ? null != e[o] && (this.options[o] = e[o])
        : e.options || (this.linterOptions[o] = e[o]);
    ((this.timeout = null),
      (this.hasGutter = n),
      (this.onMouseOver = function (e) {
        !(function (t, e) {
          var n = e.target || e.srcElement;
          if (/\bCodeMirror-lint-mark-/.test(n.className)) {
            for (
              var o = n.getBoundingClientRect(),
                r = (o.left + o.right) / 2,
                a = (o.top + o.bottom) / 2,
                l = t.findMarksAt(t.coordsChar({ left: r, top: a }, 'client')),
                s = [],
                c = 0;
              c < l.length;
              ++c
            ) {
              var f = l[c].__annotation;
              f && s.push(f);
            }
            s.length &&
              (function (t, e, n) {
                for (
                  var o = n.target || n.srcElement, r = document.createDocumentFragment(), a = 0;
                  a < e.length;
                  a++
                ) {
                  var l = e[a];
                  r.appendChild(u(l));
                }
                i(t, n, r, o);
              })(t, s, e);
          }
        })(t, e);
      }),
      (this.waitingFor = 0));
  }
  var a = {
    highlightLines: !1,
    tooltips: !0,
    delay: 500,
    lintOnChange: !0,
    getAnnotations: null,
    async: !1,
    selfContain: null,
    formatAnnotation: null,
    onUpdateLinting: null,
  };
  function l(t) {
    var n = t.state.lint;
    (n.hasGutter && t.clearGutter(e),
      n.options.highlightLines &&
        (function (t) {
          t.eachLine(function (e) {
            var n = e.wrapClass && /\bCodeMirror-lint-line-\w+\b/.exec(e.wrapClass);
            n && t.removeLineClass(e, 'wrap', n[0]);
          });
        })(t));
    for (var o = 0; o < n.marked.length; ++o) n.marked[o].clear();
    n.marked.length = 0;
  }
  function s(e, n, o, r, a) {
    var l = document.createElement('div'),
      s = l;
    return (
      (l.className = 'CodeMirror-lint-marker CodeMirror-lint-marker-' + o),
      r &&
        ((s = l.appendChild(document.createElement('div'))).className =
          'CodeMirror-lint-marker CodeMirror-lint-marker-multiple'),
      0 != a &&
        t.on(s, 'mouseover', function (t) {
          i(e, t, n, s);
        }),
      l
    );
  }
  function u(t) {
    var e = t.severity;
    e || (e = 'error');
    var n = document.createElement('div');
    return (
      (n.className = 'CodeMirror-lint-message CodeMirror-lint-message-' + e),
      void 0 !== t.messageHTML
        ? (n.innerHTML = t.messageHTML)
        : n.appendChild(document.createTextNode(t.message)),
      n
    );
  }
  function c(e) {
    var n = e.state.lint;
    if (n) {
      var o = n.options,
        i = o.getAnnotations || e.getHelper(t.Pos(0, 0), 'lint');
      if (i)
        if (o.async || i.async)
          !(function (e, n) {
            var o = e.state.lint,
              i = ++o.waitingFor;
            function r() {
              ((i = -1), e.off('change', r));
            }
            (e.on('change', r),
              n(
                e.getValue(),
                function (n, a) {
                  (e.off('change', r),
                    o.waitingFor == i &&
                      (a && n instanceof t && (n = a),
                      e.operation(function () {
                        f(e, n);
                      })));
                },
                o.linterOptions,
                e
              ));
          })(e, i);
        else {
          var r = i(e.getValue(), n.linterOptions, e);
          if (!r) return;
          r.then
            ? r.then(function (t) {
                e.operation(function () {
                  f(e, t);
                });
              })
            : e.operation(function () {
                f(e, r);
              });
        }
    }
  }
  function f(t, o) {
    var i = t.state.lint;
    if (i) {
      var r = i.options;
      l(t);
      for (
        var a,
          c = (function (t) {
            for (var e = [], n = 0; n < t.length; ++n) {
              var o = t[n],
                i = o.from.line;
              (e[i] || (e[i] = [])).push(o);
            }
            return e;
          })(o),
          f = 0;
        f < c.length;
        ++f
      ) {
        var m = c[f];
        if (m) {
          for (
            var d = null, p = i.hasGutter && document.createDocumentFragment(), h = 0;
            h < m.length;
            ++h
          ) {
            var g = m[h],
              v = g.severity;
            (v || (v = 'error'),
              (d = 'error' == (a = d) ? a : v),
              r.formatAnnotation && (g = r.formatAnnotation(g)),
              i.hasGutter && p.appendChild(u(g)),
              g.to &&
                i.marked.push(
                  t.markText(g.from, g.to, {
                    className: 'CodeMirror-lint-mark CodeMirror-lint-mark-' + v,
                    __annotation: g,
                  })
                ));
          }
          (i.hasGutter && t.setGutterMarker(f, e, s(t, p, d, m.length > 1, r.tooltips)),
            r.highlightLines && t.addLineClass(f, 'wrap', n + d));
        }
      }
      r.onUpdateLinting && r.onUpdateLinting(o, c, t);
    }
  }
  function m(t) {
    var e = t.state.lint;
    e &&
      (clearTimeout(e.timeout),
      (e.timeout = setTimeout(function () {
        c(t);
      }, e.options.delay)));
  }
  (t.defineOption('lint', !1, function (n, o, i) {
    if (
      (i &&
        i != t.Init &&
        (l(n),
        !1 !== n.state.lint.options.lintOnChange && n.off('change', m),
        t.off(n.getWrapperElement(), 'mouseover', n.state.lint.onMouseOver),
        clearTimeout(n.state.lint.timeout),
        delete n.state.lint),
      o)
    ) {
      for (var a = n.getOption('gutters'), s = !1, u = 0; u < a.length; ++u) a[u] == e && (s = !0);
      var f = (n.state.lint = new r(n, o, s));
      (f.options.lintOnChange && n.on('change', m),
        0 != f.options.tooltips &&
          'gutter' != f.options.tooltips &&
          t.on(n.getWrapperElement(), 'mouseover', f.onMouseOver),
        c(n));
    }
  }),
    t.defineExtension('performLint', function () {
      c(this);
    }));
});
