function t(t, e, n) {
  return (
    n.applyStyles(e, !0),
    (Array.isArray(t) ? t : [t])
      .map(function (t) {
        return n.getTextWidth(t);
      })
      .reduce(function (t, e) {
        return Math.max(t, e);
      }, 0)
  );
}
function e(t, e, o, i) {
  var r = e.settings.tableLineWidth,
    l = e.settings.tableLineColor;
  t.applyStyles({ lineWidth: r, lineColor: l });
  var a = n(r, !1);
  a && t.rect(o.x, o.y, e.getWidth(t.pageSize().width), i.y - o.y, a);
}
function n(t, e) {
  var n = t > 0,
    o = e || 0 === e;
  return n && o ? 'DF' : n ? 'S' : o ? 'F' : null;
}
function o(t, e) {
  var n, o, i, r;
  if (((t = t || e), Array.isArray(t))) {
    if (t.length >= 4) return { top: t[0], right: t[1], bottom: t[2], left: t[3] };
    if (3 === t.length) return { top: t[0], right: t[1], bottom: t[2], left: t[1] };
    if (2 === t.length) return { top: t[0], right: t[1], bottom: t[0], left: t[1] };
    t = 1 === t.length ? t[0] : e;
  }
  return 'object' == typeof t
    ? ('number' == typeof t.vertical && ((t.top = t.vertical), (t.bottom = t.vertical)),
      'number' == typeof t.horizontal && ((t.right = t.horizontal), (t.left = t.horizontal)),
      {
        left: null !== (n = t.left) && void 0 !== n ? n : e,
        top: null !== (o = t.top) && void 0 !== o ? o : e,
        right: null !== (i = t.right) && void 0 !== i ? i : e,
        bottom: null !== (r = t.bottom) && void 0 !== r ? r : e,
      })
    : ('number' != typeof t && (t = e), { top: t, right: t, bottom: t, left: t });
}
function i(t, e) {
  var n = o(e.settings.margin, 0);
  return t.pageSize().width - (n.left + n.right);
}
function r(t, e, n, i, r) {
  var a = {},
    s = 96 / 72,
    h = l(e, function (t) {
      return r.getComputedStyle(t).backgroundColor;
    });
  null != h && (a.fillColor = h);
  var u = l(e, function (t) {
    return r.getComputedStyle(t).color;
  });
  null != u && (a.textColor = u);
  var d = (function (t, e) {
    var n = [t.paddingTop, t.paddingRight, t.paddingBottom, t.paddingLeft],
      i = 96 / (72 / e),
      r = (parseInt(t.lineHeight) - parseInt(t.fontSize)) / e / 2,
      l = o(
        n.map(function (t) {
          return parseInt(t || '0') / i;
        }),
        0
      );
    return (r > l.top && (l.top = r), r > l.bottom && (l.bottom = r), l);
  })(i, n);
  d && (a.cellPadding = d);
  var c = 'borderTopColor',
    f = s * n,
    g = i.borderTopWidth;
  if (i.borderBottomWidth === g && i.borderRightWidth === g && i.borderLeftWidth === g) {
    var p = (parseFloat(g) || 0) / f;
    p && (a.lineWidth = p);
  } else
    ((a.lineWidth = {
      top: (parseFloat(i.borderTopWidth) || 0) / f,
      right: (parseFloat(i.borderRightWidth) || 0) / f,
      bottom: (parseFloat(i.borderBottomWidth) || 0) / f,
      left: (parseFloat(i.borderLeftWidth) || 0) / f,
    }),
      a.lineWidth.top ||
        (a.lineWidth.right
          ? (c = 'borderRightColor')
          : a.lineWidth.bottom
            ? (c = 'borderBottomColor')
            : a.lineWidth.left && (c = 'borderLeftColor')));
  var y = l(e, function (t) {
    return r.getComputedStyle(t)[c];
  });
  null != y && (a.lineColor = y);
  var v = ['left', 'right', 'center', 'justify'];
  (-1 !== v.indexOf(i.textAlign) && (a.halign = i.textAlign),
    -1 !== (v = ['middle', 'bottom', 'top']).indexOf(i.verticalAlign) &&
      (a.valign = i.verticalAlign));
  var m = parseInt(i.fontSize || '');
  isNaN(m) || (a.fontSize = m / s);
  var w = (function (t) {
    var e = '';
    return (
      ('bold' === t.fontWeight || 'bolder' === t.fontWeight || parseInt(t.fontWeight) >= 700) &&
        (e = 'bold'),
      ('italic' !== t.fontStyle && 'oblique' !== t.fontStyle) || (e += 'italic'),
      e
    );
  })(i);
  w && (a.fontStyle = w);
  var b = (i.fontFamily || '').toLowerCase();
  return (-1 !== t.indexOf(b) && (a.font = b), a);
}
function l(t, e) {
  var n = a(t, e);
  if (!n) return null;
  var o = n.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d*))?\)$/);
  if (!o || !Array.isArray(o)) return null;
  var i = [parseInt(o[1]), parseInt(o[2]), parseInt(o[3])];
  return 0 === parseInt(o[4]) || isNaN(i[0]) || isNaN(i[1]) || isNaN(i[2]) ? null : i;
}
function a(t, e) {
  var n = e(t);
  return 'rgba(0, 0, 0, 0)' === n || 'transparent' === n || 'initial' === n || 'inherit' === n
    ? null == t.parentElement
      ? null
      : a(t.parentElement, e)
    : n;
}
var s = function (t, e) {
  return (
    (s =
      Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array &&
        function (t, e) {
          t.__proto__ = e;
        }) ||
      function (t, e) {
        for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
      }),
    s(t, e)
  );
};
function h(t, e) {
  if ('function' != typeof e && null !== e)
    throw new TypeError('Class extends value ' + String(e) + ' is not a constructor or null');
  function n() {
    this.constructor = t;
  }
  (s(t, e), (t.prototype = null === e ? Object.create(e) : ((n.prototype = e.prototype), new n())));
}
'function' == typeof SuppressedError && SuppressedError;
var u = (function (t) {
  function e(e) {
    var n = t.call(this) || this;
    return ((n._element = e), n);
  }
  return (h(e, t), e);
})(Array);
function d(t, e, n, o, i) {
  var r, l, a;
  (void 0 === o && (o = !1),
    void 0 === i && (i = !1),
    (a = 'string' == typeof e ? n.document.querySelector(e) : e));
  var s = Object.keys(t.getFontList()),
    h = t.scaleFactor(),
    u = [],
    d = [],
    f = [];
  if (!a)
    return (
      console.error('Html table could not be found with input: ', e),
      { head: u, body: d, foot: f }
    );
  for (var g = 0; g < a.rows.length; g++) {
    var p = a.rows[g],
      y =
        null ===
          (l =
            null === (r = null == p ? void 0 : p.parentElement) || void 0 === r
              ? void 0
              : r.tagName) || void 0 === l
          ? void 0
          : l.toLowerCase(),
      v = c(s, h, n, p, o, i);
    v && ('thead' === y ? u.push(v) : 'tfoot' === y ? f.push(v) : d.push(v));
  }
  return { head: u, body: d, foot: f };
}
function c(t, e, n, o, i, l) {
  for (var a = new u(o), s = 0; s < o.cells.length; s++) {
    var h = o.cells[s],
      d = n.getComputedStyle(h);
    if (i || 'none' !== d.display) {
      var c = void 0;
      (l && (c = r(t, h, e, d, n)),
        a.push({ rowSpan: h.rowSpan, colSpan: h.colSpan, styles: c, _element: h, content: f(h) }));
    }
  }
  var g = n.getComputedStyle(o);
  if (a.length > 0 && (i || 'none' !== g.display)) return a;
}
function f(t) {
  var e = t.cloneNode(!0);
  return (
    (e.innerHTML = e.innerHTML.replace(/\n/g, '').replace(/ +/g, ' ')),
    (e.innerHTML = e.innerHTML
      .split(/<br.*?>/)
      .map(function (t) {
        return t.trim();
      })
      .join('\n')),
    e.innerText || e.textContent || ''
  );
}
function g(t, e, n, o, i) {
  o = o || {};
  var r = i.internal.scaleFactor,
    l = i.internal.getFontSize() / r,
    a = l * (i.getLineHeightFactor ? i.getLineHeightFactor() : 1.15),
    s = '',
    h = 1;
  if (
    (('middle' !== o.valign &&
      'bottom' !== o.valign &&
      'center' !== o.halign &&
      'right' !== o.halign) ||
      (h = (s = 'string' == typeof t ? t.split(/\r\n|\r|\n/g) : t).length || 1),
    (n += l * (2 - 1.15)),
    'middle' === o.valign ? (n -= (h / 2) * a) : 'bottom' === o.valign && (n -= h * a),
    'center' === o.halign || 'right' === o.halign)
  ) {
    var u = l;
    if (('center' === o.halign && (u *= 0.5), s && h >= 1)) {
      for (var d = 0; d < s.length; d++)
        (i.text(s[d], e - i.getStringUnitWidth(s[d]) * u, n), (n += a));
      return i;
    }
    e -= i.getStringUnitWidth(t) * u;
  }
  return (
    'justify' === o.halign
      ? i.text(t, e, n, { maxWidth: o.maxWidth || 100, align: 'justify' })
      : i.text(t, e, n),
    i
  );
}
var p = {},
  y = (function () {
    function t(t) {
      ((this.jsPDFDocument = t),
        (this.userStyles = {
          textColor: t.getTextColor ? this.jsPDFDocument.getTextColor() : 0,
          fontSize: t.internal.getFontSize(),
          fontStyle: t.internal.getFont().fontStyle,
          font: t.internal.getFont().fontName,
          lineWidth: t.getLineWidth ? this.jsPDFDocument.getLineWidth() : 0,
          lineColor: t.getDrawColor ? this.jsPDFDocument.getDrawColor() : 0,
        }));
    }
    return (
      (t.setDefaults = function (t, e) {
        (void 0 === e && (e = null), e ? (e.__autoTableDocumentDefaults = t) : (p = t));
      }),
      (t.unifyColor = function (t) {
        return Array.isArray(t)
          ? t
          : 'number' == typeof t
            ? [t, t, t]
            : 'string' == typeof t
              ? [t]
              : null;
      }),
      (t.prototype.applyStyles = function (e, n) {
        var o, i, r;
        (void 0 === n && (n = !1),
          e.fontStyle &&
            this.jsPDFDocument.setFontStyle &&
            this.jsPDFDocument.setFontStyle(e.fontStyle));
        var l = this.jsPDFDocument.internal.getFont(),
          a = l.fontStyle,
          s = l.fontName;
        if ((e.font && (s = e.font), e.fontStyle)) {
          a = e.fontStyle;
          var h = this.getFontList()[s];
          h &&
            -1 === h.indexOf(a) &&
            (this.jsPDFDocument.setFontStyle && this.jsPDFDocument.setFontStyle(h[0]), (a = h[0]));
        }
        if (
          (this.jsPDFDocument.setFont(s, a),
          e.fontSize && this.jsPDFDocument.setFontSize(e.fontSize),
          !n)
        ) {
          var u = t.unifyColor(e.fillColor);
          (u && (o = this.jsPDFDocument).setFillColor.apply(o, u),
            (u = t.unifyColor(e.textColor)) && (i = this.jsPDFDocument).setTextColor.apply(i, u),
            (u = t.unifyColor(e.lineColor)) && (r = this.jsPDFDocument).setDrawColor.apply(r, u),
            'number' == typeof e.lineWidth && this.jsPDFDocument.setLineWidth(e.lineWidth));
        }
      }),
      (t.prototype.splitTextToSize = function (t, e, n) {
        return this.jsPDFDocument.splitTextToSize(t, e, n);
      }),
      (t.prototype.rect = function (t, e, n, o, i) {
        return this.jsPDFDocument.rect(t, e, n, o, i);
      }),
      (t.prototype.getLastAutoTable = function () {
        return this.jsPDFDocument.lastAutoTable || null;
      }),
      (t.prototype.getTextWidth = function (t) {
        return this.jsPDFDocument.getTextWidth(t);
      }),
      (t.prototype.getDocument = function () {
        return this.jsPDFDocument;
      }),
      (t.prototype.setPage = function (t) {
        this.jsPDFDocument.setPage(t);
      }),
      (t.prototype.addPage = function () {
        return this.jsPDFDocument.addPage();
      }),
      (t.prototype.getFontList = function () {
        return this.jsPDFDocument.getFontList();
      }),
      (t.prototype.getGlobalOptions = function () {
        return p || {};
      }),
      (t.prototype.getDocumentOptions = function () {
        return this.jsPDFDocument.__autoTableDocumentDefaults || {};
      }),
      (t.prototype.pageSize = function () {
        var t = this.jsPDFDocument.internal.pageSize;
        return (null == t.width && (t = { width: t.getWidth(), height: t.getHeight() }), t);
      }),
      (t.prototype.scaleFactor = function () {
        return this.jsPDFDocument.internal.scaleFactor;
      }),
      (t.prototype.getLineHeightFactor = function () {
        var t = this.jsPDFDocument;
        return t.getLineHeightFactor ? t.getLineHeightFactor() : 1.15;
      }),
      (t.prototype.getLineHeight = function (t) {
        return (t / this.scaleFactor()) * this.getLineHeightFactor();
      }),
      (t.prototype.pageNumber = function () {
        var t = this.jsPDFDocument.internal.getCurrentPageInfo();
        return t ? t.pageNumber : this.jsPDFDocument.internal.getNumberOfPages();
      }),
      t
    );
  })();
function v(t, e, n, o, i) {
  if (null == t) throw new TypeError('Cannot convert undefined or null to object');
  for (var r = Object(t), l = 1; l < arguments.length; l++) {
    var a = arguments[l];
    if (null != a) for (var s in a) Object.prototype.hasOwnProperty.call(a, s) && (r[s] = a[s]);
  }
  return r;
}
function m(t) {
  t.rowHeight
    ? (console.error('Use of deprecated style rowHeight. It is renamed to minCellHeight.'),
      t.minCellHeight || (t.minCellHeight = t.rowHeight))
    : t.columnWidth &&
      (console.error('Use of deprecated style columnWidth. It is renamed to cellWidth.'),
      t.cellWidth || (t.cellWidth = t.columnWidth));
}
function w(t, e) {
  var n = new y(t),
    i = n.getDocumentOptions(),
    r = n.getGlobalOptions();
  !(function (t, e, n, o) {
    for (
      var i = function (e) {
          (e &&
            'object' != typeof e &&
            console.error('The options parameter should be of type object, is: ' + typeof e),
            void 0 !== e.extendWidth &&
              ((e.tableWidth = e.extendWidth ? 'auto' : 'wrap'),
              console.error('Use of deprecated option: extendWidth, use tableWidth instead.')),
            void 0 !== e.margins &&
              (void 0 === e.margin && (e.margin = e.margins),
              console.error('Use of deprecated option: margins, use margin instead.')),
            e.startY &&
              'number' != typeof e.startY &&
              (console.error('Invalid value for startY option', e.startY), delete e.startY),
            !e.didDrawPage &&
              (e.afterPageContent || e.beforePageContent || e.afterPageAdd) &&
              (console.error(
                'The afterPageContent, beforePageContent and afterPageAdd hooks are deprecated. Use didDrawPage instead'
              ),
              (e.didDrawPage = function (n) {
                (t.applyStyles(t.userStyles),
                  e.beforePageContent && e.beforePageContent(n),
                  t.applyStyles(t.userStyles),
                  e.afterPageContent && e.afterPageContent(n),
                  t.applyStyles(t.userStyles),
                  e.afterPageAdd && n.pageNumber > 1 && n.afterPageAdd(n),
                  t.applyStyles(t.userStyles));
              })),
            ['createdHeaderCell', 'drawHeaderRow', 'drawRow', 'drawHeaderCell'].forEach(
              function (t) {
                e[t] &&
                  console.error(
                    'The "'.concat(
                      t,
                      '" hook has changed in version 3.0, check the changelog for how to migrate.'
                    )
                  );
              }
            ),
            [
              ['showFoot', 'showFooter'],
              ['showHead', 'showHeader'],
              ['didDrawPage', 'addPageContent'],
              ['didParseCell', 'createdCell'],
              ['headStyles', 'headerStyles'],
            ].forEach(function (t) {
              var n = t[0],
                o = t[1];
              e[o] &&
                (console.error(
                  'Use of deprecated option '.concat(o, '. Use ').concat(n, ' instead')
                ),
                (e[n] = e[o]));
            }),
            [
              ['padding', 'cellPadding'],
              ['lineHeight', 'rowHeight'],
              'fontSize',
              'overflow',
            ].forEach(function (t) {
              var n = 'string' == typeof t ? t : t[0],
                o = 'string' == typeof t ? t : t[1];
              void 0 !== e[n] &&
                (void 0 === e.styles[o] && (e.styles[o] = e[n]),
                console.error(
                  'Use of deprecated option: ' + n + ', use the style ' + o + ' instead.'
                ));
            }));
          for (
            var n = 0, o = ['styles', 'bodyStyles', 'headStyles', 'footStyles'];
            n < o.length;
            n++
          )
            m(e[o[n]] || {});
          for (var i = e.columnStyles || {}, r = 0, l = Object.keys(i); r < l.length; r++)
            m(i[l[r]] || {});
        },
        r = 0,
        l = [e, n, o];
      r < l.length;
      r++
    )
      i(l[r]);
  })(n, r, i, e);
  var l,
    a = v({}, r, i, e);
  'undefined' != typeof window && (l = window);
  var s = (function (t, e, n) {
      for (
        var o = {
            styles: {},
            headStyles: {},
            bodyStyles: {},
            footStyles: {},
            alternateRowStyles: {},
            columnStyles: {},
          },
          i = function (i) {
            if ('columnStyles' === i) {
              var r = t[i],
                l = e[i],
                a = n[i];
              o.columnStyles = v({}, r, l, a);
            } else {
              var s = [t, e, n].map(function (t) {
                return t[i] || {};
              });
              o[i] = v({}, s[0], s[1], s[2]);
            }
          },
          r = 0,
          l = Object.keys(o);
        r < l.length;
        r++
      )
        i(l[r]);
      return o;
    })(r, i, e),
    h = (function (t, e, n) {
      for (
        var o = {
            didParseCell: [],
            willDrawCell: [],
            didDrawCell: [],
            willDrawPage: [],
            didDrawPage: [],
          },
          i = 0,
          r = [t, e, n];
        i < r.length;
        i++
      ) {
        var l = r[i];
        (l.didParseCell && o.didParseCell.push(l.didParseCell),
          l.willDrawCell && o.willDrawCell.push(l.willDrawCell),
          l.didDrawCell && o.didDrawCell.push(l.didDrawCell),
          l.willDrawPage && o.willDrawPage.push(l.willDrawPage),
          l.didDrawPage && o.didDrawPage.push(l.didDrawPage));
      }
      return o;
    })(r, i, e),
    u = (function (t, e) {
      var n,
        i,
        r,
        l,
        a,
        s,
        h,
        u,
        d,
        c,
        f,
        g,
        p,
        y,
        v = o(e.margin, 40 / t.scaleFactor()),
        m =
          null !==
            (n = (function (t, e) {
              var n = t.getLastAutoTable(),
                o = t.scaleFactor(),
                i = t.pageNumber(),
                r = !1;
              return (
                n && n.startPageNumber && (r = n.startPageNumber + n.pageNumber - 1 === i),
                'number' == typeof e
                  ? e
                  : (null != e && !1 !== e) || !r || null == (null == n ? void 0 : n.finalY)
                    ? null
                    : n.finalY + 20 / o
              );
            })(t, e.startY)) && void 0 !== n
            ? n
            : v.top;
      ((p =
        !0 === e.showFoot
          ? 'everyPage'
          : !1 === e.showFoot
            ? 'never'
            : null !== (i = e.showFoot) && void 0 !== i
              ? i
              : 'everyPage'),
        (y =
          !0 === e.showHead
            ? 'everyPage'
            : !1 === e.showHead
              ? 'never'
              : null !== (r = e.showHead) && void 0 !== r
                ? r
                : 'everyPage'));
      var w = null !== (l = e.useCss) && void 0 !== l && l,
        b = e.theme || (w ? 'plain' : 'striped'),
        S = !!e.horizontalPageBreak,
        P = null !== (a = e.horizontalPageBreakRepeat) && void 0 !== a ? a : null;
      return {
        includeHiddenHtml: null !== (s = e.includeHiddenHtml) && void 0 !== s && s,
        useCss: w,
        theme: b,
        startY: m,
        margin: v,
        pageBreak: null !== (h = e.pageBreak) && void 0 !== h ? h : 'auto',
        rowPageBreak: null !== (u = e.rowPageBreak) && void 0 !== u ? u : 'auto',
        tableWidth: null !== (d = e.tableWidth) && void 0 !== d ? d : 'auto',
        showHead: y,
        showFoot: p,
        tableLineWidth: null !== (c = e.tableLineWidth) && void 0 !== c ? c : 0,
        tableLineColor: null !== (f = e.tableLineColor) && void 0 !== f ? f : 200,
        horizontalPageBreak: S,
        horizontalPageBreakRepeat: P,
        horizontalPageBreakBehaviour:
          null !== (g = e.horizontalPageBreakBehaviour) && void 0 !== g ? g : 'afterAllRows',
      };
    })(n, a),
    c = (function (t, e, n) {
      var o = e.head || [],
        i = e.body || [],
        r = e.foot || [];
      if (e.html) {
        var l = e.includeHiddenHtml;
        if (n) {
          var a = d(t, e.html, n, l, e.useCss) || {};
          ((o = a.head || o), (i = a.body || o), (r = a.foot || o));
        } else console.error('Cannot parse html in non browser environment');
      }
      var s =
        e.columns ||
        (function (t, e, n) {
          var o = t[0] || e[0] || n[0] || [],
            i = [];
          return (
            Object.keys(o)
              .filter(function (t) {
                return '_element' !== t;
              })
              .forEach(function (t) {
                var e,
                  n = 1;
                'object' != typeof (e = Array.isArray(o) ? o[parseInt(t)] : o[t]) ||
                  Array.isArray(e) ||
                  (n = (null == e ? void 0 : e.colSpan) || 1);
                for (var r = 0; r < n; r++) {
                  var l = {
                    dataKey: Array.isArray(o) ? i.length : t + (r > 0 ? '_'.concat(r) : ''),
                  };
                  i.push(l);
                }
              }),
            i
          );
        })(o, i, r);
      return { columns: s, head: o, body: i, foot: r };
    })(n, a, l);
  return { id: e.tableId, content: c, hooks: h, styles: s, settings: u };
}
var b = function (t, e, n) {
    ((this.table = e),
      (this.pageNumber = e.pageNumber),
      (this.pageCount = this.pageNumber),
      (this.settings = e.settings),
      (this.cursor = n),
      (this.doc = t.getDocument()));
  },
  S = (function (t) {
    function e(e, n, o, i, r, l) {
      var a = t.call(this, e, n, l) || this;
      return ((a.cell = o), (a.row = i), (a.column = r), (a.section = i.section), a);
    }
    return (h(e, t), e);
  })(b),
  P = (function () {
    function t(t, e) {
      ((this.pageNumber = 1),
        (this.pageCount = 1),
        (this.id = t.id),
        (this.settings = t.settings),
        (this.styles = t.styles),
        (this.hooks = t.hooks),
        (this.columns = e.columns),
        (this.head = e.head),
        (this.body = e.body),
        (this.foot = e.foot));
    }
    return (
      (t.prototype.getHeadHeight = function (t) {
        return this.head.reduce(function (e, n) {
          return e + n.getMaxCellHeight(t);
        }, 0);
      }),
      (t.prototype.getFootHeight = function (t) {
        return this.foot.reduce(function (e, n) {
          return e + n.getMaxCellHeight(t);
        }, 0);
      }),
      (t.prototype.allRows = function () {
        return this.head.concat(this.body).concat(this.foot);
      }),
      (t.prototype.callCellHooks = function (t, e, n, o, i, r) {
        for (var l = 0, a = e; l < a.length; l++) {
          var s = !1 === (0, a[l])(new S(t, this, n, o, i, r));
          if (((n.text = Array.isArray(n.text) ? n.text : [n.text]), s)) return !1;
        }
        return !0;
      }),
      (t.prototype.callEndPageHooks = function (t, e) {
        t.applyStyles(t.userStyles);
        for (var n = 0, o = this.hooks.didDrawPage; n < o.length; n++) (0, o[n])(new b(t, this, e));
      }),
      (t.prototype.callWillDrawPageHooks = function (t, e) {
        for (var n = 0, o = this.hooks.willDrawPage; n < o.length; n++)
          (0, o[n])(new b(t, this, e));
      }),
      (t.prototype.getWidth = function (t) {
        if ('number' == typeof this.settings.tableWidth) return this.settings.tableWidth;
        if ('wrap' === this.settings.tableWidth)
          return this.columns.reduce(function (t, e) {
            return t + e.wrappedWidth;
          }, 0);
        var e = this.settings.margin;
        return t - e.left - e.right;
      }),
      t
    );
  })(),
  x = (function () {
    function t(t, e, n, o, i) {
      (void 0 === i && (i = !1),
        (this.height = 0),
        (this.raw = t),
        t instanceof u && ((this.raw = t._element), (this.element = t._element)),
        (this.index = e),
        (this.section = n),
        (this.cells = o),
        (this.spansMultiplePages = i));
    }
    return (
      (t.prototype.getMaxCellHeight = function (t) {
        var e = this;
        return t.reduce(function (t, n) {
          var o;
          return Math.max(
            t,
            (null === (o = e.cells[n.index]) || void 0 === o ? void 0 : o.height) || 0
          );
        }, 0);
      }),
      (t.prototype.hasRowSpan = function (t) {
        var e = this;
        return (
          t.filter(function (t) {
            var n = e.cells[t.index];
            return !!n && n.rowSpan > 1;
          }).length > 0
        );
      }),
      (t.prototype.canEntireRowFit = function (t, e) {
        return this.getMaxCellHeight(e) <= t;
      }),
      (t.prototype.getMinimumRowHeight = function (t, e) {
        var n = this;
        return t.reduce(function (t, o) {
          var i = n.cells[o.index];
          if (!i) return 0;
          var r = e.getLineHeight(i.styles.fontSize),
            l = i.padding('vertical') + r;
          return l > t ? l : t;
        }, 0);
      }),
      t
    );
  })(),
  W = (function () {
    function t(t, e, n) {
      var o, i;
      ((this.contentHeight = 0),
        (this.contentWidth = 0),
        (this.wrappedWidth = 0),
        (this.minReadableWidth = 0),
        (this.minWidth = 0),
        (this.width = 0),
        (this.height = 0),
        (this.x = 0),
        (this.y = 0),
        (this.styles = e),
        (this.section = n),
        (this.raw = t));
      var r = t;
      null == t || 'object' != typeof t || Array.isArray(t)
        ? ((this.rowSpan = 1), (this.colSpan = 1))
        : ((this.rowSpan = t.rowSpan || 1),
          (this.colSpan = t.colSpan || 1),
          (r =
            null !== (i = null !== (o = t.content) && void 0 !== o ? o : t.title) && void 0 !== i
              ? i
              : t),
          t._element && (this.raw = t._element));
      var l = null != r ? '' + r : '';
      this.text = l.split(/\r\n|\r|\n/g);
    }
    return (
      (t.prototype.getTextPos = function () {
        var t, e;
        if ('top' === this.styles.valign) t = this.y + this.padding('top');
        else if ('bottom' === this.styles.valign) t = this.y + this.height - this.padding('bottom');
        else {
          var n = this.height - this.padding('vertical');
          t = this.y + n / 2 + this.padding('top');
        }
        if ('right' === this.styles.halign) e = this.x + this.width - this.padding('right');
        else if ('center' === this.styles.halign) {
          var o = this.width - this.padding('horizontal');
          e = this.x + o / 2 + this.padding('left');
        } else e = this.x + this.padding('left');
        return { x: e, y: t };
      }),
      (t.prototype.getContentHeight = function (t, e) {
        void 0 === e && (e = 1.15);
        var n =
          (Array.isArray(this.text) ? this.text.length : 1) * ((this.styles.fontSize / t) * e) +
          this.padding('vertical');
        return Math.max(n, this.styles.minCellHeight);
      }),
      (t.prototype.padding = function (t) {
        var e = o(this.styles.cellPadding, 0);
        return 'vertical' === t ? e.top + e.bottom : 'horizontal' === t ? e.left + e.right : e[t];
      }),
      t
    );
  })(),
  C = (function () {
    function t(t, e, n) {
      ((this.wrappedWidth = 0),
        (this.minReadableWidth = 0),
        (this.minWidth = 0),
        (this.width = 0),
        (this.dataKey = t),
        (this.raw = e),
        (this.index = n));
    }
    return (
      (t.prototype.getMaxCustomCellWidth = function (t) {
        for (var e = 0, n = 0, o = t.allRows(); n < o.length; n++) {
          var i = o[n].cells[this.index];
          i && 'number' == typeof i.styles.cellWidth && (e = Math.max(e, i.styles.cellWidth));
        }
        return e;
      }),
      t
    );
  })();
function D(t, e, n) {
  var o;
  void 0 === n && (n = {});
  var r = i(t, e),
    l = new Map(),
    a = [],
    s = [],
    h = [];
  (e.settings.horizontalPageBreakRepeat,
    Array.isArray(e.settings.horizontalPageBreakRepeat)
      ? (h = e.settings.horizontalPageBreakRepeat)
      : ('string' != typeof e.settings.horizontalPageBreakRepeat &&
          'number' != typeof e.settings.horizontalPageBreakRepeat) ||
        (h = [e.settings.horizontalPageBreakRepeat]),
    h.forEach(function (t) {
      var n = e.columns.find(function (e) {
        return e.dataKey === t || e.index === t;
      });
      n &&
        !l.has(n.index) &&
        (l.set(n.index, !0), a.push(n.index), s.push(e.columns[n.index]), (r -= n.wrappedWidth));
    }));
  for (
    var u = !0, d = null !== (o = null == n ? void 0 : n.start) && void 0 !== o ? o : 0;
    d < e.columns.length;
  )
    if (l.has(d)) d++;
    else {
      var c = e.columns[d].wrappedWidth;
      if (!(u || r >= c)) break;
      ((u = !1), a.push(d), s.push(e.columns[d]), (r -= c), d++);
    }
  return { colIndexes: a, columns: s, lastIndex: d - 1 };
}
function F(t, n) {
  var o = n.settings,
    i = o.startY,
    r = o.margin,
    l = { x: r.left, y: i },
    a = n.getHeadHeight(n.columns) + n.getFootHeight(n.columns),
    s = i + r.bottom + a;
  'avoid' === o.pageBreak &&
    (s += n.body.reduce(function (t, e) {
      return t + e.height;
    }, 0));
  var h = new y(t);
  (('always' === o.pageBreak || (null != o.startY && s > h.pageSize().height)) &&
    (M(h), (l.y = r.top)),
    n.callWillDrawPageHooks(h, l));
  var u = v({}, l);
  ((n.startPageNumber = h.pageNumber()),
    o.horizontalPageBreak
      ? (function (t, e, n, o) {
          var i = (function (t, e) {
            for (var n = [], o = 0; o < e.columns.length; o++) {
              var i = D(t, e, { start: o });
              i.columns.length && (n.push(i), (o = i.lastIndex));
            }
            return n;
          })(t, e);
          if ('afterAllRows' === e.settings.horizontalPageBreakBehaviour)
            i.forEach(function (i, r) {
              (t.applyStyles(t.userStyles),
                r > 0 ? E(t, e, n, o, i.columns, !0) : H(t, e, o, i.columns),
                (function (t, e, n, o, i) {
                  (t.applyStyles(t.userStyles),
                    e.body.forEach(function (r, l) {
                      var a = l === e.body.length - 1;
                      k(t, e, r, a, n, o, i);
                    }));
                })(t, e, n, o, i.columns),
                T(t, e, o, i.columns));
            });
          else
            for (
              var r = -1,
                l = i[0],
                a = function () {
                  var a = r;
                  if (l) {
                    t.applyStyles(t.userStyles);
                    var s = l.columns;
                    (r >= 0 ? E(t, e, n, o, s, !0) : H(t, e, o, s),
                      (a = A(t, e, r + 1, o, s)),
                      T(t, e, o, s));
                  }
                  var h = a - r;
                  (i.slice(1).forEach(function (i) {
                    (t.applyStyles(t.userStyles),
                      E(t, e, n, o, i.columns, !0),
                      A(t, e, r + 1, o, i.columns, h),
                      T(t, e, o, i.columns));
                  }),
                    (r = a));
                };
              r < e.body.length - 1;
            )
              a();
        })(h, n, u, l)
      : (h.applyStyles(h.userStyles),
        ('firstPage' !== o.showHead && 'everyPage' !== o.showHead) ||
          n.head.forEach(function (t) {
            return z(h, n, t, l, n.columns);
          }),
        h.applyStyles(h.userStyles),
        n.body.forEach(function (t, e) {
          var o = e === n.body.length - 1;
          k(h, n, t, o, u, l, n.columns);
        }),
        h.applyStyles(h.userStyles),
        ('lastPage' !== o.showFoot && 'everyPage' !== o.showFoot) ||
          n.foot.forEach(function (t) {
            return z(h, n, t, l, n.columns);
          })),
    e(h, n, u, l),
    n.callEndPageHooks(h, l),
    (n.finalY = l.y),
    (t.lastAutoTable = n),
    (t.previousAutoTable = n),
    t.autoTable && (t.autoTable.previous = n),
    h.applyStyles(h.userStyles));
}
function H(t, e, n, o) {
  var i = e.settings;
  (t.applyStyles(t.userStyles),
    ('firstPage' !== i.showHead && 'everyPage' !== i.showHead) ||
      e.head.forEach(function (i) {
        return z(t, e, i, n, o);
      }));
}
function A(t, e, n, o, i, r) {
  (t.applyStyles(t.userStyles), (r = null != r ? r : e.body.length));
  var l = Math.min(n + r, e.body.length),
    a = -1;
  return (
    e.body.slice(n, l).forEach(function (r, l) {
      var s = n + l === e.body.length - 1,
        h = L(t, e, s, o);
      r.canEntireRowFit(h, i) && (z(t, e, r, o, i), (a = n + l));
    }),
    a
  );
}
function T(t, e, n, o) {
  var i = e.settings;
  (t.applyStyles(t.userStyles),
    ('lastPage' !== i.showFoot && 'everyPage' !== i.showFoot) ||
      e.foot.forEach(function (i) {
        return z(t, e, i, n, o);
      }));
}
function j(t, e, n) {
  var o = n.getLineHeight(t.styles.fontSize),
    i = t.padding('vertical'),
    r = Math.floor((e - i) / o);
  return Math.max(0, r);
}
function k(t, e, n, o, i, r, l) {
  var a = L(t, e, o, r);
  if (n.canEntireRowFit(a, l)) z(t, e, n, r, l);
  else if (
    (function (t, e, n, o) {
      var i = t.pageSize().height,
        r = o.settings.margin,
        l = i - (r.top + r.bottom);
      'body' === e.section && (l -= o.getHeadHeight(o.columns) + o.getFootHeight(o.columns));
      var a = e.getMinimumRowHeight(o.columns, t),
        s = a < n;
      if (a > l)
        return (
          console.error(
            'Will not be able to print row '.concat(
              e.index,
              " correctly since it's minimum height is larger than page height"
            )
          ),
          !0
        );
      if (!s) return !1;
      var h = e.hasRowSpan(o.columns);
      return e.getMaxCellHeight(o.columns) > l
        ? (h &&
            console.error(
              'The content of row '.concat(
                e.index,
                ' will not be drawn correctly since drawing rows with a height larger than the page height and has cells with rowspans is not supported.'
              )
            ),
          !0)
        : !h && 'avoid' !== o.settings.rowPageBreak;
    })(t, n, a, e)
  ) {
    var s = (function (t, e, n, o) {
      var i = {};
      ((t.spansMultiplePages = !0), (t.height = 0));
      for (var r = 0, l = 0, a = n.columns; l < a.length; l++) {
        var s = a[l];
        if ((y = t.cells[s.index])) {
          (Array.isArray(y.text) || (y.text = [y.text]),
            ((p = v((p = new W(y.raw, y.styles, y.section)), y)).text = []));
          var h = j(y, e, o);
          y.text.length > h && (p.text = y.text.splice(h, y.text.length));
          var u = o.scaleFactor(),
            d = o.getLineHeightFactor();
          ((y.contentHeight = y.getContentHeight(u, d)),
            y.contentHeight >= e && ((y.contentHeight = e), (p.styles.minCellHeight -= e)),
            y.contentHeight > t.height && (t.height = y.contentHeight),
            (p.contentHeight = p.getContentHeight(u, d)),
            p.contentHeight > r && (r = p.contentHeight),
            (i[s.index] = p));
        }
      }
      var c = new x(t.raw, -1, t.section, i, !0);
      c.height = r;
      for (var f = 0, g = n.columns; f < g.length; f++) {
        var p, y;
        ((s = g[f]),
          (p = c.cells[s.index]) && (p.height = c.height),
          (y = t.cells[s.index]) && (y.height = t.height));
      }
      return c;
    })(n, a, e, t);
    (z(t, e, n, r, l), E(t, e, i, r, l), k(t, e, s, o, i, r, l));
  } else (E(t, e, i, r, l), k(t, e, n, o, i, r, l));
}
function z(t, e, n, o, i) {
  o.x = e.settings.margin.left;
  for (var r = 0, l = i; r < l.length; r++) {
    var a = l[r],
      s = n.cells[a.index];
    if (s)
      if (
        (t.applyStyles(s.styles),
        (s.x = o.x),
        (s.y = o.y),
        !1 !== e.callCellHooks(t, e.hooks.willDrawCell, s, n, a, o))
      ) {
        R(t, s, o);
        var h = s.getTextPos();
        (g(
          s.text,
          h.x,
          h.y,
          {
            halign: s.styles.halign,
            valign: s.styles.valign,
            maxWidth: Math.ceil(s.width - s.padding('left') - s.padding('right')),
          },
          t.getDocument()
        ),
          e.callCellHooks(t, e.hooks.didDrawCell, s, n, a, o),
          (o.x += a.width));
      } else o.x += a.width;
    else o.x += a.width;
  }
  o.y += n.height;
}
function R(t, e, o) {
  var i = e.styles;
  if (
    (t.getDocument().setFillColor(t.getDocument().getFillColor()), 'number' == typeof i.lineWidth)
  ) {
    var r = n(i.lineWidth, i.fillColor);
    r && t.rect(e.x, o.y, e.width, e.height, r);
  } else
    'object' == typeof i.lineWidth &&
      (i.fillColor && t.rect(e.x, o.y, e.width, e.height, 'F'),
      (function (t, e, n, o) {
        var i, r, l, a;
        function s(e, n, o, i, r) {
          (t.getDocument().setLineWidth(e), t.getDocument().line(n, o, i, r, 'S'));
        }
        (o.top &&
          ((i = n.x),
          (r = n.y),
          (l = n.x + e.width),
          (a = n.y),
          o.right && (l += 0.5 * o.right),
          o.left && (i -= 0.5 * o.left),
          s(o.top, i, r, l, a)),
          o.bottom &&
            ((i = n.x),
            (r = n.y + e.height),
            (l = n.x + e.width),
            (a = n.y + e.height),
            o.right && (l += 0.5 * o.right),
            o.left && (i -= 0.5 * o.left),
            s(o.bottom, i, r, l, a)),
          o.left &&
            ((i = n.x),
            (r = n.y),
            (l = n.x),
            (a = n.y + e.height),
            o.top && (r -= 0.5 * o.top),
            o.bottom && (a += 0.5 * o.bottom),
            s(o.left, i, r, l, a)),
          o.right &&
            ((i = n.x + e.width),
            (r = n.y),
            (l = n.x + e.width),
            (a = n.y + e.height),
            o.top && (r -= 0.5 * o.top),
            o.bottom && (a += 0.5 * o.bottom),
            s(o.right, i, r, l, a)));
      })(t, e, o, i.lineWidth));
}
function L(t, e, n, o) {
  var i = e.settings.margin.bottom,
    r = e.settings.showFoot;
  return (
    ('everyPage' === r || ('lastPage' === r && n)) && (i += e.getFootHeight(e.columns)),
    t.pageSize().height - o.y - i
  );
}
function E(t, n, o, i, r, l) {
  (void 0 === r && (r = []),
    void 0 === l && (l = !1),
    t.applyStyles(t.userStyles),
    'everyPage' !== n.settings.showFoot ||
      l ||
      n.foot.forEach(function (e) {
        return z(t, n, e, i, r);
      }),
    n.callEndPageHooks(t, i));
  var a = n.settings.margin;
  (e(t, n, o, i),
    M(t),
    n.pageNumber++,
    n.pageCount++,
    (i.x = a.left),
    (i.y = a.top),
    (o.y = a.top),
    n.callWillDrawPageHooks(t, i),
    'everyPage' === n.settings.showHead &&
      (n.head.forEach(function (e) {
        return z(t, n, e, i, r);
      }),
      t.applyStyles(t.userStyles)));
}
function M(t) {
  var e = t.pageNumber();
  return (t.setPage(e + 1), t.pageNumber() === e && (t.addPage(), !0));
}
function I(t, e, n) {
  for (
    var o = e,
      i = t.reduce(function (t, e) {
        return t + e.wrappedWidth;
      }, 0),
      r = 0;
    r < t.length;
    r++
  ) {
    var l = t[r],
      a = o * (l.wrappedWidth / i),
      s = l.width + a,
      h = n(l),
      u = s < h ? h : s;
    ((e -= u - l.width), (l.width = u));
  }
  if ((e = Math.round(1e10 * e) / 1e10)) {
    var d = t.filter(function (t) {
      return !(e < 0) || t.width > n(t);
    });
    d.length && (e = I(d, e, n));
  }
  return e;
}
function B(e, n, o, i, r) {
  return e.map(function (e) {
    return (function (e, n, o, i, r) {
      var l = 1e4 * i.scaleFactor();
      if ((n = Math.ceil(n * l) / l) >= t(e, o, i)) return e;
      for (; n < t(e + r, o, i) && !(e.length <= 1); ) e = e.substring(0, e.length - 1);
      return e.trim() + r;
    })(e, n, o, i, r);
  });
}
function N(e, n) {
  var o = new y(e),
    r = (function (t, e) {
      var n,
        o = t.content,
        i = (function (t) {
          return t.map(function (t, e) {
            var n, o, i;
            return (
              (i =
                'object' == typeof t &&
                null !== (o = null !== (n = t.dataKey) && void 0 !== n ? n : t.key) &&
                void 0 !== o
                  ? o
                  : e),
              new C(i, t, e)
            );
          });
        })(o.columns);
      (0 === o.head.length && (n = _(i, 'head')) && o.head.push(n), 0 === o.foot.length) &&
        (n = _(i, 'foot')) &&
        o.foot.push(n);
      var r = t.settings.theme,
        l = t.styles;
      return {
        columns: i,
        head: O('head', o.head, i, l, r, e),
        body: O('body', o.body, i, l, r, e),
        foot: O('foot', o.foot, i, l, r, e),
      };
    })(n, o.scaleFactor()),
    l = new P(n, r);
  return (
    (function (e, n) {
      !(function (e, n) {
        var o = e.scaleFactor(),
          r = n.settings.horizontalPageBreak,
          l = i(e, n);
        (n.allRows().forEach(function (i) {
          for (var a = 0, s = n.columns; a < s.length; a++) {
            var h = s[a],
              u = i.cells[h.index];
            if (u) {
              var d = n.hooks.didParseCell;
              n.callCellHooks(e, d, u, i, h, null);
              var c = u.padding('horizontal');
              u.contentWidth = t(u.text, u.styles, e) + c;
              var f = t(u.text.join(' ').split(/[^\S\u00A0]+/), u.styles, e);
              if (
                ((u.minReadableWidth = f + u.padding('horizontal')),
                'number' == typeof u.styles.cellWidth)
              )
                ((u.minWidth = u.styles.cellWidth), (u.wrappedWidth = u.styles.cellWidth));
              else if ('wrap' === u.styles.cellWidth || !0 === r)
                u.contentWidth > l
                  ? ((u.minWidth = l), (u.wrappedWidth = l))
                  : ((u.minWidth = u.contentWidth), (u.wrappedWidth = u.contentWidth));
              else {
                var g = 10 / o;
                ((u.minWidth = u.styles.minCellWidth || g),
                  (u.wrappedWidth = u.contentWidth),
                  u.minWidth > u.wrappedWidth && (u.wrappedWidth = u.minWidth));
              }
            }
          }
        }),
          n.allRows().forEach(function (t) {
            for (var e = 0, o = n.columns; e < o.length; e++) {
              var i = o[e],
                r = t.cells[i.index];
              if (r && 1 === r.colSpan)
                ((i.wrappedWidth = Math.max(i.wrappedWidth, r.wrappedWidth)),
                  (i.minWidth = Math.max(i.minWidth, r.minWidth)),
                  (i.minReadableWidth = Math.max(i.minReadableWidth, r.minReadableWidth)));
              else {
                var l = n.styles.columnStyles[i.dataKey] || n.styles.columnStyles[i.index] || {},
                  a = l.cellWidth || l.minCellWidth;
                a && 'number' == typeof a && ((i.minWidth = a), (i.wrappedWidth = a));
              }
              r &&
                (r.colSpan > 1 && !i.minWidth && (i.minWidth = r.minWidth),
                r.colSpan > 1 && !i.wrappedWidth && (i.wrappedWidth = r.minWidth));
            }
          }));
      })(e, n);
      var o = [],
        r = 0;
      n.columns.forEach(function (t) {
        var e = t.getMaxCustomCellWidth(n);
        (e ? (t.width = e) : ((t.width = t.wrappedWidth), o.push(t)), (r += t.width));
      });
      var l = n.getWidth(e.pageSize().width) - r;
      (l &&
        (l = I(o, l, function (t) {
          return Math.max(t.minReadableWidth, t.minWidth);
        })),
        l &&
          (l = I(o, l, function (t) {
            return t.minWidth;
          })),
        (l = Math.abs(l)),
        !n.settings.horizontalPageBreak &&
          l > 0.1 / e.scaleFactor() &&
          ((l = l < 1 ? l : Math.round(l)),
          console.warn('Of the table content, '.concat(l, ' units width could not fit page'))),
        (function (t) {
          for (var e = t.allRows(), n = 0; n < e.length; n++)
            for (var o = e[n], i = null, r = 0, l = 0, a = 0; a < t.columns.length; a++) {
              var s = t.columns[a];
              if ((l -= 1) > 1 && t.columns[a + 1]) ((r += s.width), delete o.cells[s.index]);
              else if (i) {
                var h = i;
                (delete o.cells[s.index], (i = null), (h.width = s.width + r));
              } else {
                if (!(h = o.cells[s.index])) continue;
                if (((l = h.colSpan), (r = 0), h.colSpan > 1)) {
                  ((i = h), (r += s.width));
                  continue;
                }
                h.width = s.width + r;
              }
            }
        })(n),
        (function (t, e) {
          for (var n = { count: 0, height: 0 }, o = 0, i = t.allRows(); o < i.length; o++) {
            for (var r = i[o], l = 0, a = t.columns; l < a.length; l++) {
              var s = a[l],
                h = r.cells[s.index];
              if (h) {
                e.applyStyles(h.styles, !0);
                var u = h.width - h.padding('horizontal');
                if ('linebreak' === h.styles.overflow)
                  h.text = e.splitTextToSize(h.text, u + 1 / e.scaleFactor(), {
                    fontSize: h.styles.fontSize,
                  });
                else if ('ellipsize' === h.styles.overflow)
                  h.text = B(h.text, u, h.styles, e, '...');
                else if ('hidden' === h.styles.overflow) h.text = B(h.text, u, h.styles, e, '');
                else if ('function' == typeof h.styles.overflow) {
                  var d = h.styles.overflow(h.text, u);
                  h.text = 'string' == typeof d ? [d] : d;
                }
                h.contentHeight = h.getContentHeight(e.scaleFactor(), e.getLineHeightFactor());
                var c = h.contentHeight / h.rowSpan;
                (h.rowSpan > 1 && n.count * n.height < c * h.rowSpan
                  ? (n = { height: c, count: h.rowSpan })
                  : n && n.count > 0 && n.height > c && (c = n.height),
                  c > r.height && (r.height = c));
              }
            }
            n.count--;
          }
        })(n, e),
        (function (t) {
          for (var e = {}, n = 1, o = t.allRows(), i = 0; i < o.length; i++)
            for (var r = o[i], l = 0, a = t.columns; l < a.length; l++) {
              var s = a[l],
                h = e[s.index];
              if (n > 1) (n--, delete r.cells[s.index]);
              else if (h)
                ((h.cell.height += r.height),
                  (n = h.cell.colSpan),
                  delete r.cells[s.index],
                  h.left--,
                  h.left <= 1 && delete e[s.index]);
              else {
                var u = r.cells[s.index];
                if (!u) continue;
                if (((u.height = r.height), u.rowSpan > 1)) {
                  var d = o.length - i,
                    c = u.rowSpan > d ? d : u.rowSpan;
                  e[s.index] = { cell: u, left: c, row: r };
                }
              }
            }
        })(n));
    })(o, l),
    o.applyStyles(o.userStyles),
    l
  );
}
function O(t, e, n, o, i, r) {
  var l = {};
  return e.map(function (e, a) {
    for (var s = 0, h = {}, u = 0, d = 0, c = 0, f = n; c < f.length; c++) {
      var g = f[c];
      if (null == l[g.index] || 0 === l[g.index].left)
        if (0 === d) {
          var p,
            y = {};
          'object' != typeof (p = Array.isArray(e) ? e[g.index - u - s] : e[g.dataKey]) ||
            Array.isArray(p) ||
            (y = (null == p ? void 0 : p.styles) || {});
          var v = U(t, g, a, i, o, r, y),
            m = new W(p, v, t);
          ((h[g.dataKey] = m),
            (h[g.index] = m),
            (d = m.colSpan - 1),
            (l[g.index] = { left: m.rowSpan - 1, times: d }));
        } else (d--, u++);
      else (l[g.index].left--, (d = l[g.index].times), s++);
    }
    return new x(e, a, t, h);
  });
}
function _(t, e) {
  var n = {};
  return (
    t.forEach(function (t) {
      if (null != t.raw) {
        var o = (function (t, e) {
          if ('head' === t) {
            if ('object' == typeof e) return e.header || e.title || null;
            if ('string' == typeof e || 'number' == typeof e) return e;
          } else if ('foot' === t && 'object' == typeof e) return e.footer;
          return null;
        })(e, t.raw);
        null != o && (n[t.dataKey] = o);
      }
    }),
    Object.keys(n).length > 0 ? n : null
  );
}
function U(t, e, n, o, i, r, l) {
  var a,
    s = {
      striped: {
        table: { fillColor: 255, textColor: 80, fontStyle: 'normal' },
        head: { textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold' },
        body: {},
        foot: { textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold' },
        alternateRow: { fillColor: 245 },
      },
      grid: {
        table: { fillColor: 255, textColor: 80, fontStyle: 'normal', lineWidth: 0.1 },
        head: { textColor: 255, fillColor: [26, 188, 156], fontStyle: 'bold', lineWidth: 0 },
        body: {},
        foot: { textColor: 255, fillColor: [26, 188, 156], fontStyle: 'bold', lineWidth: 0 },
        alternateRow: {},
      },
      plain: { head: { fontStyle: 'bold' }, foot: { fontStyle: 'bold' } },
    }[o];
  'head' === t
    ? (a = i.headStyles)
    : 'body' === t
      ? (a = i.bodyStyles)
      : 'foot' === t && (a = i.footStyles);
  var h = v({}, s.table, s[t], i.styles, a),
    u = i.columnStyles[e.dataKey] || i.columnStyles[e.index] || {},
    d = 'body' === t ? u : {},
    c = 'body' === t && n % 2 == 0 ? v({}, s.alternateRow, i.alternateRowStyles) : {},
    f = (function (t) {
      return {
        font: 'helvetica',
        fontStyle: 'normal',
        overflow: 'linebreak',
        fillColor: !1,
        textColor: 20,
        halign: 'left',
        valign: 'top',
        fontSize: 10,
        cellPadding: 5 / t,
        lineColor: 200,
        lineWidth: 0,
        cellWidth: 'auto',
        minCellHeight: 0,
        minCellWidth: 0,
      };
    })(r),
    g = v({}, f, h, c, d);
  return v(g, l);
}
function Y(t) {
  !(function (t) {
    ((t.API.autoTable = function () {
      for (var t, e = [], n = 0; n < arguments.length; n++) e[n] = arguments[n];
      return (
        1 === e.length
          ? (t = e[0])
          : (console.error('Use of deprecated autoTable initiation'),
            ((t = e[2] || {}).columns = e[0]),
            (t.body = e[1])),
        F(this, N(this, w(this, t))),
        this
      );
    }),
      (t.API.lastAutoTable = !1),
      (t.API.previousAutoTable = !1),
      (t.API.autoTable.previous = !1),
      (t.API.autoTableText = function (t, e, n, o) {
        g(t, e, n, o, this);
      }),
      (t.API.autoTableSetDefaults = function (t) {
        return (y.setDefaults(t, this), this);
      }),
      (t.autoTableSetDefaults = function (t, e) {
        y.setDefaults(t, e);
      }),
      (t.API.autoTableHtmlToJson = function (t, e) {
        var n;
        if ((void 0 === e && (e = !1), 'undefined' == typeof window))
          return (console.error('Cannot run autoTableHtmlToJson in non browser environment'), null);
        var o = d(new y(this), t, window, e, !1),
          i = o.head,
          r = o.body;
        return {
          columns:
            (null === (n = i[0]) || void 0 === n
              ? void 0
              : n.map(function (t) {
                  return t.content;
                })) || [],
          rows: r,
          data: r,
        };
      }),
      (t.API.autoTableEndPosY = function () {
        console.error(
          'Use of deprecated function: autoTableEndPosY. Use doc.lastAutoTable.finalY instead.'
        );
        var t = this.lastAutoTable;
        return t && t.finalY ? t.finalY : 0;
      }),
      (t.API.autoTableAddPageContent = function (e) {
        return (
          console.error(
            'Use of deprecated function: autoTableAddPageContent. Use jsPDF.autoTableSetDefaults({didDrawPage: () => {}}) instead.'
          ),
          t.API.autoTable.globalDefaults || (t.API.autoTable.globalDefaults = {}),
          (t.API.autoTable.globalDefaults.addPageContent = e),
          this
        );
      }),
      (t.API.autoTableAddPage = function () {
        return (
          console.error('Use of deprecated function: autoTableAddPage. Use doc.addPage()'),
          this.addPage(),
          this
        );
      }));
  })(t);
}
function K(t, e) {
  F(t, N(t, w(t, e)));
}
function q(t, e) {
  return N(t, w(t, e));
}
function G(t, e) {
  F(t, e);
}
try {
  var J = require('jspdf');
  (J.jsPDF && (J = J.jsPDF), Y(J));
} catch (t) {}
export {
  W as Cell,
  S as CellHookData,
  C as Column,
  x as Row,
  P as Table,
  q as __createTable,
  G as __drawTable,
  Y as applyPlugin,
  K as default,
};
