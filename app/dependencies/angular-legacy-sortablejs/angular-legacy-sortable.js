/*! For license information please see angular-legacy-sortable.js.LICENSE.txt */
!(function (e) {
  'use strict';
  'function' == typeof define && define.amd
    ? define(['angular', 'sortablejs'], e)
    : 'function' == typeof require && 'object' == typeof exports && 'object' == typeof module
      ? (require('angular'), e(angular, require('sortablejs')), (module.exports = 'ng-sortable'))
      : window.angular && window.Sortable && e(angular, Sortable);
})(function (e, n) {
  'use strict';
  var t = 'Sortable:ng-sortable';
  e.module('ng-sortable', [])
    .constant('ngSortableVersion', '0.4.1')
    .constant('ngSortableConfig', {})
    .directive('ngSortable', [
      '$parse',
      'ngSortableConfig',
      function (o, r) {
        var i, a;
        function l(e) {
          return (
            e.getAttribute('ng-repeat') ||
            e.getAttribute('data-ng-repeat') ||
            e.getAttribute('x-ng-repeat') ||
            e.getAttribute('dir-paginate')
          );
        }
        return {
          restrict: 'AC',
          scope: { ngSortable: '=?' },
          priority: 1001,
          compile: function (s, c) {
            var u = [].filter.call(s[0].childNodes, function (e) {
              return e.nodeType === Node.ELEMENT_NODE && l(e);
            })[0];
            if (u) {
              var d = l(u).match(
                /^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/
              );
              if (d) {
                var f = d[2];
                return function (l, s) {
                  var c,
                    u,
                    d = o(f),
                    p = function () {
                      return d(l.$parent) || [];
                    },
                    g = s[0],
                    b = e.extend(l.ngSortable || {}, r),
                    m = [];
                  function S(e, n) {
                    var t = 'on' + e.type.charAt(0).toUpperCase() + e.type.substr(1),
                      o = p();
                    b[t] &&
                      b[t]({
                        model: n || o[e.newIndex],
                        models: o,
                        oldIndex: e.oldIndex,
                        newIndex: e.newIndex,
                        originalEvent: e,
                      });
                  }
                  function v(o) {
                    var r = p();
                    if (r) {
                      var s = o.oldIndex,
                        c = o.newIndex;
                      if (g !== o.from) {
                        var d = o.from[t]();
                        ((i = d[s]),
                          n.active && 'clone' === n.active.lastPullMode
                            ? ((i = e.copy(i)),
                              d.splice(
                                n.utils.index(o.clone, u.options.draggable),
                                0,
                                d.splice(s, 1)[0]
                              ),
                              o.from.contains(o.clone) && o.from.removeChild(o.clone))
                            : d.splice(s, 1),
                          r.splice(c, 0, i),
                          o.from.insertBefore(o.item, a));
                      } else
                        (r.splice(c, 0, r.splice(s, 1)[0]),
                          a.nodeType === Node.COMMENT_NODE &&
                            o.from.insertBefore(a, o.item.nextSibling));
                      l.$apply();
                    }
                  }
                  ((g[t] = p),
                    (u = n.create(
                      g,
                      Object.keys(b).reduce(
                        function (e, n) {
                          return ((e[n] = e[n] || b[n]), e);
                        },
                        {
                          onStart: function (e) {
                            ((a =
                              e.from === e.item.parentNode
                                ? e.item.nextSibling
                                : e.clone.nextSibling),
                              S(e),
                              l.$apply());
                          },
                          onEnd: function (e) {
                            (S(e, i), l.$apply());
                          },
                          onAdd: function (e) {
                            (v(e), S(e, i), l.$apply());
                          },
                          onUpdate: function (e) {
                            (v(e), S(e));
                          },
                          onRemove: function (e) {
                            S(e, i);
                          },
                          onSort: function (e) {
                            S(e);
                          },
                        }
                      )
                    )),
                    e.forEach(
                      [
                        'sort',
                        'disabled',
                        'draggable',
                        'handle',
                        'animation',
                        'group',
                        'ghostClass',
                        'filter',
                        'onStart',
                        'onEnd',
                        'onAdd',
                        'onUpdate',
                        'onRemove',
                        'onSort',
                        'onMove',
                        'onClone',
                        'setData',
                        'delay',
                        'animation',
                        'forceFallback',
                      ],
                      function (e) {
                        m.push(
                          l.$watch('ngSortable.' + e, function (n) {
                            void 0 !== n && ((b[e] = n), /^on[A-Z]/.test(e) || u.option(e, n));
                          })
                        );
                      }
                    ),
                    (c = l.$on('$destroy', function () {
                      (c(),
                        e.forEach(m, function (e) {
                          e();
                        }),
                        u.destroy(),
                        (g[t] = null),
                        (g = null),
                        (m = null),
                        (u = null),
                        (a = null));
                    })));
                };
              }
            }
          },
        };
      },
    ]);
});
