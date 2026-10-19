(angular.module('ui.bootstrap', [
  'ui.bootstrap.collapse',
  'ui.bootstrap.tabindex',
  'ui.bootstrap.accordion',
  'ui.bootstrap.alert',
  'ui.bootstrap.buttons',
  'ui.bootstrap.carousel',
  'ui.bootstrap.dateparser',
  'ui.bootstrap.isClass',
  'ui.bootstrap.datepicker',
  'ui.bootstrap.position',
  'ui.bootstrap.datepickerPopup',
  'ui.bootstrap.debounce',
  'ui.bootstrap.multiMap',
  'ui.bootstrap.dropdown',
  'ui.bootstrap.stackedMap',
  'ui.bootstrap.modal',
  'ui.bootstrap.paging',
  'ui.bootstrap.pager',
  'ui.bootstrap.pagination',
  'ui.bootstrap.tooltip',
  'ui.bootstrap.popover',
  'ui.bootstrap.progressbar',
  'ui.bootstrap.rating',
  'ui.bootstrap.tabs',
  'ui.bootstrap.timepicker',
  'ui.bootstrap.typeahead',
]),
  angular.module('ui.bootstrap.collapse', []).directive('uibCollapse', [
    '$animate',
    '$q',
    '$parse',
    '$injector',
    function (e, t, n, o) {
      var i = o.has('$animateCss') ? o.get('$animateCss') : null;
      return {
        link: function (o, a, r) {
          var l = n(r.expanding),
            s = n(r.expanded),
            u = n(r.collapsing),
            p = n(r.collapsed),
            c = !1,
            d = {},
            f = {};
          function m(e) {
            return c ? { width: e.scrollWidth + 'px' } : { height: e.scrollHeight + 'px' };
          }
          function h() {
            (a.removeClass('collapsing').addClass('collapse').css(d), s(o));
          }
          function g() {
            (a.css(f), a.removeClass('collapsing').addClass('collapse'), p(o));
          }
          ((c = !!('horizontal' in r))
            ? ((d = { width: '' }), (f = { width: '0' }))
            : ((d = { height: '' }), (f = { height: '0' })),
            o.$eval(r.uibCollapse) ||
              a
                .addClass('in')
                .addClass('collapse')
                .attr('aria-expanded', !0)
                .attr('aria-hidden', !1)
                .css(d),
            o.$watch(r.uibCollapse, function (n) {
              n
                ? (function () {
                    if (!a.hasClass('collapse') && !a.hasClass('in')) return g();
                    t.resolve(u(o)).then(function () {
                      (a
                        .css(m(a[0]))
                        .removeClass('collapse')
                        .addClass('collapsing')
                        .attr('aria-expanded', !1)
                        .attr('aria-hidden', !0),
                        i
                          ? i(a, { removeClass: 'in', to: f }).start().finally(g)
                          : e.removeClass(a, 'in', { to: f }).then(g));
                    }, angular.noop);
                  })()
                : (a.hasClass('collapse') && a.hasClass('in')) ||
                  t.resolve(l(o)).then(function () {
                    (a
                      .removeClass('collapse')
                      .addClass('collapsing')
                      .attr('aria-expanded', !0)
                      .attr('aria-hidden', !1),
                      i
                        ? i(a, {
                            addClass: 'in',
                            easing: 'ease',
                            css: { overflow: 'hidden' },
                            to: m(a[0]),
                          })
                            .start()
                            .finally(h)
                        : e
                            .addClass(a, 'in', { css: { overflow: 'hidden' }, to: m(a[0]) })
                            .then(h));
                  }, angular.noop);
            }));
        },
      };
    },
  ]),
  angular.module('ui.bootstrap.tabindex', []).directive('uibTabindexToggle', function () {
    return {
      restrict: 'A',
      link: function (e, t, n) {
        n.$observe('disabled', function (e) {
          n.$set('tabindex', e ? -1 : null);
        });
      },
    };
  }),
  angular
    .module('ui.bootstrap.accordion', ['ui.bootstrap.collapse', 'ui.bootstrap.tabindex'])
    .constant('uibAccordionConfig', { closeOthers: !0 })
    .controller('UibAccordionController', [
      '$scope',
      '$attrs',
      'uibAccordionConfig',
      function (e, t, n) {
        ((this.groups = []),
          (this.closeOthers = function (o) {
            (angular.isDefined(t.closeOthers) ? e.$eval(t.closeOthers) : n.closeOthers) &&
              angular.forEach(this.groups, function (e) {
                e !== o && (e.isOpen = !1);
              });
          }),
          (this.addGroup = function (e) {
            var t = this;
            (this.groups.push(e),
              e.$on('$destroy', function (n) {
                t.removeGroup(e);
              }));
          }),
          (this.removeGroup = function (e) {
            var t = this.groups.indexOf(e);
            -1 !== t && this.groups.splice(t, 1);
          }));
      },
    ])
    .directive('uibAccordion', function () {
      return {
        controller: 'UibAccordionController',
        controllerAs: 'accordion',
        transclude: !0,
        templateUrl: function (e, t) {
          return t.templateUrl || 'uib/template/accordion/accordion.html';
        },
      };
    })
    .directive('uibAccordionGroup', function () {
      return {
        require: '^uibAccordion',
        transclude: !0,
        restrict: 'A',
        templateUrl: function (e, t) {
          return t.templateUrl || 'uib/template/accordion/accordion-group.html';
        },
        scope: { heading: '@', panelClass: '@?', isOpen: '=?', isDisabled: '=?' },
        controller: function () {
          this.setHeading = function (e) {
            this.heading = e;
          };
        },
        link: function (e, t, n, o) {
          (t.addClass('panel'),
            o.addGroup(e),
            (e.openClass = n.openClass || 'panel-open'),
            (e.panelClass = n.panelClass || 'panel-default'),
            e.$watch('isOpen', function (n) {
              (t.toggleClass(e.openClass, !!n), n && o.closeOthers(e));
            }),
            (e.toggleOpen = function (t) {
              e.isDisabled || (t && 32 !== t.which) || (e.isOpen = !e.isOpen);
            }));
          var i = 'accordiongroup-' + e.$id + '-' + Math.floor(1e4 * Math.random());
          ((e.headingId = i + '-tab'), (e.panelId = i + '-panel'));
        },
      };
    })
    .directive('uibAccordionHeading', function () {
      return {
        transclude: !0,
        template: '',
        replace: !0,
        require: '^uibAccordionGroup',
        link: function (e, t, n, o, i) {
          o.setHeading(i(e, angular.noop));
        },
      };
    })
    .directive('uibAccordionTransclude', function () {
      return {
        require: '^uibAccordionGroup',
        link: function (e, t, n, o) {
          e.$watch(
            function () {
              return o[n.uibAccordionTransclude];
            },
            function (e) {
              if (e) {
                var n = angular.element(
                  t[0].querySelector(
                    'uib-accordion-header,data-uib-accordion-header,x-uib-accordion-header,uib\\:accordion-header,[uib-accordion-header],[data-uib-accordion-header],[x-uib-accordion-header]'
                  )
                );
                (n.html(''), n.append(e));
              }
            }
          );
        },
      };
    }),
  angular
    .module('ui.bootstrap.alert', [])
    .controller('UibAlertController', [
      '$scope',
      '$element',
      '$attrs',
      '$interpolate',
      '$timeout',
      function (e, t, n, o, i) {
        ((e.closeable = !!n.close),
          t.addClass('alert'),
          n.$set('role', 'alert'),
          e.closeable && t.addClass('alert-dismissible'));
        var a = angular.isDefined(n.dismissOnTimeout) ? o(n.dismissOnTimeout)(e.$parent) : null;
        a &&
          i(
            function () {
              e.close();
            },
            parseInt(a, 10)
          );
      },
    ])
    .directive('uibAlert', function () {
      return {
        controller: 'UibAlertController',
        controllerAs: 'alert',
        restrict: 'A',
        templateUrl: function (e, t) {
          return t.templateUrl || 'uib/template/alert/alert.html';
        },
        transclude: !0,
        scope: { close: '&' },
      };
    }),
  angular
    .module('ui.bootstrap.buttons', [])
    .constant('uibButtonConfig', { activeClass: 'active', toggleEvent: 'click' })
    .controller('UibButtonsController', [
      'uibButtonConfig',
      function (e) {
        ((this.activeClass = e.activeClass || 'active'),
          (this.toggleEvent = e.toggleEvent || 'click'));
      },
    ])
    .directive('uibBtnRadio', [
      '$parse',
      function (e) {
        return {
          require: ['uibBtnRadio', 'ngModel'],
          controller: 'UibButtonsController',
          controllerAs: 'buttons',
          link: function (t, n, o, i) {
            var a = i[0],
              r = i[1],
              l = e(o.uibUncheckable);
            (n.find('input').css({ display: 'none' }),
              (r.$render = function () {
                n.toggleClass(a.activeClass, angular.equals(r.$modelValue, t.$eval(o.uibBtnRadio)));
              }),
              n.on(a.toggleEvent, function () {
                if (!o.disabled) {
                  var e = n.hasClass(a.activeClass);
                  (e && !angular.isDefined(o.uncheckable)) ||
                    t.$apply(function () {
                      (r.$setViewValue(e ? null : t.$eval(o.uibBtnRadio)), r.$render());
                    });
                }
              }),
              o.uibUncheckable &&
                t.$watch(l, function (e) {
                  o.$set('uncheckable', e ? '' : void 0);
                }));
          },
        };
      },
    ])
    .directive('uibBtnCheckbox', function () {
      return {
        require: ['uibBtnCheckbox', 'ngModel'],
        controller: 'UibButtonsController',
        controllerAs: 'button',
        link: function (e, t, n, o) {
          var i = o[0],
            a = o[1];
          function r() {
            return l(n.btnCheckboxTrue, !0);
          }
          function l(t, n) {
            return angular.isDefined(t) ? e.$eval(t) : n;
          }
          (t.find('input').css({ display: 'none' }),
            (a.$render = function () {
              t.toggleClass(i.activeClass, angular.equals(a.$modelValue, r()));
            }),
            t.on(i.toggleEvent, function () {
              n.disabled ||
                e.$apply(function () {
                  (a.$setViewValue(t.hasClass(i.activeClass) ? l(n.btnCheckboxFalse, !1) : r()),
                    a.$render());
                });
            }));
        },
      };
    }),
  angular
    .module('ui.bootstrap.carousel', [])
    .controller('UibCarouselController', [
      '$scope',
      '$element',
      '$interval',
      '$timeout',
      '$animate',
      function (e, t, n, o, i) {
        var a,
          r,
          l = this,
          s = (l.slides = e.slides = []),
          u = 'uib-slideDirection',
          p = e.active,
          c = !1;
        function d(e) {
          for (var t = 0; t < s.length; t++) s[t].slide.active = t === e;
        }
        function f(e) {
          for (var t = 0; t < s.length; t++) if (s[t].slide === e) return t;
        }
        function m() {
          a && (n.cancel(a), (a = null));
        }
        function h() {
          m();
          var t = +e.interval;
          !isNaN(t) && t > 0 && (a = n(g, t));
        }
        function g() {
          var t = +e.interval;
          r && !isNaN(t) && t > 0 && s.length ? e.next() : e.pause();
        }
        (t.addClass('carousel'),
          (l.addSlide = function (t, n) {
            (s.push({ slide: t, element: n }),
              s.sort(function (e, t) {
                return +e.slide.index - +t.slide.index;
              }),
              (t.index === e.active || (1 === s.length && !angular.isNumber(e.active))) &&
                (e.$currentTransition && (e.$currentTransition = null),
                (p = t.index),
                (e.active = t.index),
                d(p),
                l.select(s[f(t)]),
                1 === s.length && e.play()));
          }),
          (l.getCurrentIndex = function () {
            for (var e = 0; e < s.length; e++) if (s[e].slide.index === p) return e;
          }),
          (l.next = e.next =
            function () {
              var t = (l.getCurrentIndex() + 1) % s.length;
              if (0 !== t || !e.noWrap()) return l.select(s[t], 'next');
              e.pause();
            }),
          (l.prev = e.prev =
            function () {
              var t = l.getCurrentIndex() - 1 < 0 ? s.length - 1 : l.getCurrentIndex() - 1;
              if (!e.noWrap() || t !== s.length - 1) return l.select(s[t], 'prev');
              e.pause();
            }),
          (l.removeSlide = function (t) {
            var n = f(t);
            (s.splice(n, 1),
              s.length > 0 && p === n
                ? n >= s.length
                  ? ((p = s.length - 1), (e.active = p), d(p), l.select(s[s.length - 1]))
                  : ((p = n), (e.active = p), d(p), l.select(s[n]))
                : p > n && (p--, (e.active = p)),
              0 === s.length && ((p = null), (e.active = null)));
          }),
          (l.select = e.select =
            function (n, o) {
              var a = f(n.slide);
              (void 0 === o && (o = a > l.getCurrentIndex() ? 'next' : 'prev'),
                n.slide.index === p ||
                  e.$currentTransition ||
                  (function (n, o, a) {
                    if (!c) {
                      if (
                        (angular.extend(n, { direction: a }),
                        angular.extend(s[p].slide || {}, { direction: a }),
                        i.enabled(t) &&
                          !e.$currentTransition &&
                          s[o].element &&
                          l.slides.length > 1)
                      ) {
                        s[o].element.data(u, n.direction);
                        var r = l.getCurrentIndex();
                        (angular.isNumber(r) && s[r].element && s[r].element.data(u, n.direction),
                          (e.$currentTransition = !0),
                          i.on('addClass', s[o].element, function (t, n) {
                            'close' === n && ((e.$currentTransition = null), i.off('addClass', t));
                          }));
                      }
                      ((e.active = n.index), (p = n.index), d(o), h());
                    }
                  })(n.slide, a, o));
            }),
          (e.indexOfSlide = function (e) {
            return +e.slide.index;
          }),
          (e.isActive = function (t) {
            return e.active === t.slide.index;
          }),
          (e.isPrevDisabled = function () {
            return 0 === e.active && e.noWrap();
          }),
          (e.isNextDisabled = function () {
            return e.active === s.length - 1 && e.noWrap();
          }),
          (e.pause = function () {
            e.noPause || ((r = !1), m());
          }),
          (e.play = function () {
            r || ((r = !0), h());
          }),
          t.on('mouseenter', e.pause),
          t.on('mouseleave', e.play),
          e.$on('$destroy', function () {
            ((c = !0), m());
          }),
          e.$watch('noTransition', function (e) {
            i.enabled(t, !e);
          }),
          e.$watch('interval', h),
          e.$watchCollection('slides', function (t) {
            t.length || (e.$currentTransition = null);
          }),
          e.$watch('active', function (e) {
            if (angular.isNumber(e) && p !== e) {
              for (var t = 0; t < s.length; t++)
                if (s[t].slide.index === e) {
                  e = t;
                  break;
                }
              s[e] && (d(e), l.select(s[e]), (p = e));
            }
          }));
      },
    ])
    .directive('uibCarousel', function () {
      return {
        transclude: !0,
        controller: 'UibCarouselController',
        controllerAs: 'carousel',
        restrict: 'A',
        templateUrl: function (e, t) {
          return t.templateUrl || 'uib/template/carousel/carousel.html';
        },
        scope: { active: '=', interval: '=', noTransition: '=', noPause: '=', noWrap: '&' },
      };
    })
    .directive('uibSlide', [
      '$animate',
      function (e) {
        return {
          require: '^uibCarousel',
          restrict: 'A',
          transclude: !0,
          templateUrl: function (e, t) {
            return t.templateUrl || 'uib/template/carousel/slide.html';
          },
          scope: { actual: '=?', index: '=?' },
          link: function (t, n, o, i) {
            (n.addClass('item'),
              i.addSlide(t, n),
              t.$on('$destroy', function () {
                i.removeSlide(t);
              }),
              t.$watch('active', function (t) {
                e[t ? 'addClass' : 'removeClass'](n, 'active');
              }));
          },
        };
      },
    ])
    .animation('.item', [
      '$animateCss',
      function (e) {
        var t = 'uib-slideDirection';
        function n(e, t, n) {
          (e.removeClass(t), n && n());
        }
        return {
          beforeAddClass: function (o, i, a) {
            if ('active' === i) {
              var r = o.data(t),
                l = 'next' === r ? 'left' : 'right',
                s = n.bind(this, o, l + ' ' + r, a);
              return (o.addClass(r), e(o, { addClass: l }).start().done(s), function () {});
            }
            a();
          },
          beforeRemoveClass: function (o, i, a) {
            if ('active' === i) {
              var r = 'next' === o.data(t) ? 'left' : 'right',
                l = n.bind(this, o, r, a);
              return (e(o, { addClass: r }).start().done(l), function () {});
            }
            a();
          },
        };
      },
    ]),
  angular.module('ui.bootstrap.dateparser', []).service('uibDateParser', [
    '$log',
    '$locale',
    'dateFilter',
    'orderByFilter',
    'filterFilter',
    function (e, t, n, o, i) {
      var a,
        r,
        l = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
      function s(e) {
        return i(r, { key: e }, !0)[0];
      }
      function u(e, t, n) {
        return function () {
          return e.substr(t + 1, n - t - 1);
        };
      }
      function p(e, t) {
        for (var n = e.substr(t), o = 0; o < r.length; o++)
          if (new RegExp('^' + r[o].key).test(n)) {
            var i = r[o];
            return { endIdx: t + i.key.length, parser: i.formatter };
          }
        return {
          endIdx: t + 1,
          parser: function () {
            return n.charAt(0);
          },
        };
      }
      function c(e) {
        return parseInt(e, 10);
      }
      function d(e, t) {
        e = e.replace(/:/g, '');
        var n = Date.parse('Jan 01, 1970 00:00:00 ' + e) / 6e4;
        return isNaN(n) ? t : n;
      }
      function f(e, t) {
        return ((e = new Date(e.getTime())).setMinutes(e.getMinutes() + t), e);
      }
      function m(e, t, n) {
        n = n ? -1 : 1;
        var o = e.getTimezoneOffset();
        return f(e, n * (d(t, o) - o));
      }
      ((this.init = function () {
        ((a = t.id),
          (this.parsers = {}),
          (this.formatters = {}),
          (r = [
            {
              key: 'yyyy',
              regex: '\\d{4}',
              apply: function (e) {
                this.year = +e;
              },
              formatter: function (e) {
                var t = new Date();
                return (t.setFullYear(Math.abs(e.getFullYear())), n(t, 'yyyy'));
              },
            },
            {
              key: 'yy',
              regex: '\\d{2}',
              apply: function (e) {
                ((e = +e), (this.year = e < 69 ? e + 2e3 : e + 1900));
              },
              formatter: function (e) {
                var t = new Date();
                return (t.setFullYear(Math.abs(e.getFullYear())), n(t, 'yy'));
              },
            },
            {
              key: 'y',
              regex: '\\d{1,4}',
              apply: function (e) {
                this.year = +e;
              },
              formatter: function (e) {
                var t = new Date();
                return (t.setFullYear(Math.abs(e.getFullYear())), n(t, 'y'));
              },
            },
            {
              key: 'M!',
              regex: '0?[1-9]|1[0-2]',
              apply: function (e) {
                this.month = e - 1;
              },
              formatter: function (e) {
                var t = e.getMonth();
                return /^[0-9]$/.test(t) ? n(e, 'MM') : n(e, 'M');
              },
            },
            {
              key: 'MMMM',
              regex: t.DATETIME_FORMATS.MONTH.join('|'),
              apply: function (e) {
                this.month = t.DATETIME_FORMATS.MONTH.indexOf(e);
              },
              formatter: function (e) {
                return n(e, 'MMMM');
              },
            },
            {
              key: 'MMM',
              regex: t.DATETIME_FORMATS.SHORTMONTH.join('|'),
              apply: function (e) {
                this.month = t.DATETIME_FORMATS.SHORTMONTH.indexOf(e);
              },
              formatter: function (e) {
                return n(e, 'MMM');
              },
            },
            {
              key: 'MM',
              regex: '0[1-9]|1[0-2]',
              apply: function (e) {
                this.month = e - 1;
              },
              formatter: function (e) {
                return n(e, 'MM');
              },
            },
            {
              key: 'M',
              regex: '[1-9]|1[0-2]',
              apply: function (e) {
                this.month = e - 1;
              },
              formatter: function (e) {
                return n(e, 'M');
              },
            },
            {
              key: 'd!',
              regex: '[0-2]?[0-9]{1}|3[0-1]{1}',
              apply: function (e) {
                this.date = +e;
              },
              formatter: function (e) {
                var t = e.getDate();
                return /^[1-9]$/.test(t) ? n(e, 'dd') : n(e, 'd');
              },
            },
            {
              key: 'dd',
              regex: '[0-2][0-9]{1}|3[0-1]{1}',
              apply: function (e) {
                this.date = +e;
              },
              formatter: function (e) {
                return n(e, 'dd');
              },
            },
            {
              key: 'd',
              regex: '[1-2]?[0-9]{1}|3[0-1]{1}',
              apply: function (e) {
                this.date = +e;
              },
              formatter: function (e) {
                return n(e, 'd');
              },
            },
            {
              key: 'EEEE',
              regex: t.DATETIME_FORMATS.DAY.join('|'),
              formatter: function (e) {
                return n(e, 'EEEE');
              },
            },
            {
              key: 'EEE',
              regex: t.DATETIME_FORMATS.SHORTDAY.join('|'),
              formatter: function (e) {
                return n(e, 'EEE');
              },
            },
            {
              key: 'HH',
              regex: '(?:0|1)[0-9]|2[0-3]',
              apply: function (e) {
                this.hours = +e;
              },
              formatter: function (e) {
                return n(e, 'HH');
              },
            },
            {
              key: 'hh',
              regex: '0[0-9]|1[0-2]',
              apply: function (e) {
                this.hours = +e;
              },
              formatter: function (e) {
                return n(e, 'hh');
              },
            },
            {
              key: 'H',
              regex: '1?[0-9]|2[0-3]',
              apply: function (e) {
                this.hours = +e;
              },
              formatter: function (e) {
                return n(e, 'H');
              },
            },
            {
              key: 'h',
              regex: '[0-9]|1[0-2]',
              apply: function (e) {
                this.hours = +e;
              },
              formatter: function (e) {
                return n(e, 'h');
              },
            },
            {
              key: 'mm',
              regex: '[0-5][0-9]',
              apply: function (e) {
                this.minutes = +e;
              },
              formatter: function (e) {
                return n(e, 'mm');
              },
            },
            {
              key: 'm',
              regex: '[0-9]|[1-5][0-9]',
              apply: function (e) {
                this.minutes = +e;
              },
              formatter: function (e) {
                return n(e, 'm');
              },
            },
            {
              key: 'sss',
              regex: '[0-9][0-9][0-9]',
              apply: function (e) {
                this.milliseconds = +e;
              },
              formatter: function (e) {
                return n(e, 'sss');
              },
            },
            {
              key: 'ss',
              regex: '[0-5][0-9]',
              apply: function (e) {
                this.seconds = +e;
              },
              formatter: function (e) {
                return n(e, 'ss');
              },
            },
            {
              key: 's',
              regex: '[0-9]|[1-5][0-9]',
              apply: function (e) {
                this.seconds = +e;
              },
              formatter: function (e) {
                return n(e, 's');
              },
            },
            {
              key: 'a',
              regex: t.DATETIME_FORMATS.AMPMS.join('|'),
              apply: function (e) {
                (12 === this.hours && (this.hours = 0), 'PM' === e && (this.hours += 12));
              },
              formatter: function (e) {
                return n(e, 'a');
              },
            },
            {
              key: 'Z',
              regex: '[+-]\\d{4}',
              apply: function (e) {
                var t = e.match(/([+-])(\d{2})(\d{2})/),
                  n = t[1],
                  o = t[2],
                  i = t[3];
                ((this.hours += c(n + o)), (this.minutes += c(n + i)));
              },
              formatter: function (e) {
                return n(e, 'Z');
              },
            },
            {
              key: 'ww',
              regex: '[0-4][0-9]|5[0-3]',
              formatter: function (e) {
                return n(e, 'ww');
              },
            },
            {
              key: 'w',
              regex: '[0-9]|[1-4][0-9]|5[0-3]',
              formatter: function (e) {
                return n(e, 'w');
              },
            },
            {
              key: 'GGGG',
              regex: t.DATETIME_FORMATS.ERANAMES.join('|').replace(/\s/g, '\\s'),
              formatter: function (e) {
                return n(e, 'GGGG');
              },
            },
            {
              key: 'GGG',
              regex: t.DATETIME_FORMATS.ERAS.join('|'),
              formatter: function (e) {
                return n(e, 'GGG');
              },
            },
            {
              key: 'GG',
              regex: t.DATETIME_FORMATS.ERAS.join('|'),
              formatter: function (e) {
                return n(e, 'GG');
              },
            },
            {
              key: 'G',
              regex: t.DATETIME_FORMATS.ERAS.join('|'),
              formatter: function (e) {
                return n(e, 'G');
              },
            },
          ]),
          angular.version.major >= 1 &&
            angular.version.minor > 4 &&
            r.push({
              key: 'LLLL',
              regex: t.DATETIME_FORMATS.STANDALONEMONTH.join('|'),
              apply: function (e) {
                this.month = t.DATETIME_FORMATS.STANDALONEMONTH.indexOf(e);
              },
              formatter: function (e) {
                return n(e, 'LLLL');
              },
            }));
      }),
        this.init(),
        (this.getParser = function (e) {
          var t = s(e);
          return (t && t.apply) || null;
        }),
        (this.overrideParser = function (e, t) {
          var n = s(e);
          n && angular.isFunction(t) && ((this.parsers = {}), (n.apply = t));
        }.bind(this)),
        (this.filter = function (e, n) {
          return angular.isDate(e) && !isNaN(e) && n
            ? ((n = t.DATETIME_FORMATS[n] || n),
              t.id !== a && this.init(),
              this.formatters[n] ||
                (this.formatters[n] = (function (e) {
                  for (var t, n, o = [], i = 0; i < e.length; )
                    if (angular.isNumber(n)) {
                      if ("'" === e.charAt(i))
                        (i + 1 >= e.length || "'" !== e.charAt(i + 1)) &&
                          (o.push(u(e, n, i)), (n = null));
                      else if (i === e.length)
                        for (; n < e.length; ) ((t = p(e, n)), o.push(t), (n = t.endIdx));
                      i++;
                    } else
                      "'" !== e.charAt(i)
                        ? ((t = p(e, i)), o.push(t.parser), (i = t.endIdx))
                        : ((n = i), i++);
                  return o;
                })(n)),
              this.formatters[n].reduce(function (t, n) {
                return t + n(e);
              }, ''))
            : '';
        }),
        (this.parse = function (n, i, s) {
          if (!angular.isString(n) || !i) return n;
          ((i = (i = t.DATETIME_FORMATS[i] || i).replace(l, '\\$&')),
            t.id !== a && this.init(),
            this.parsers[i] ||
              (this.parsers[i] = (function (e) {
                var t = [],
                  n = e.split(''),
                  i = e.indexOf("'");
                if (i > -1) {
                  var a = !1;
                  e = e.split('');
                  for (var l = i; l < e.length; l++)
                    a
                      ? ("'" === e[l] &&
                          (l + 1 < e.length && "'" === e[l + 1]
                            ? ((e[l + 1] = '$'), (n[l + 1] = ''))
                            : ((n[l] = ''), (a = !1))),
                        (e[l] = '$'))
                      : "'" === e[l] && ((e[l] = '$'), (n[l] = ''), (a = !0));
                  e = e.join('');
                }
                return (
                  angular.forEach(r, function (o) {
                    var i = e.indexOf(o.key);
                    if (i > -1) {
                      ((e = e.split('')), (n[i] = '(' + o.regex + ')'), (e[i] = '$'));
                      for (var a = i + 1, r = i + o.key.length; a < r; a++)
                        ((n[a] = ''), (e[a] = '$'));
                      ((e = e.join('')),
                        t.push({ index: i, key: o.key, apply: o.apply, matcher: o.regex }));
                    }
                  }),
                  { regex: new RegExp('^' + n.join('') + '$'), map: o(t, 'index') }
                );
              })(i)));
          var u,
            p,
            c,
            d = this.parsers[i],
            f = d.regex,
            m = d.map,
            h = n.match(f),
            g = !1;
          if (h && h.length) {
            var b, v;
            angular.isDate(s) && !isNaN(s.getTime())
              ? (b = {
                  year: s.getFullYear(),
                  month: s.getMonth(),
                  date: s.getDate(),
                  hours: s.getHours(),
                  minutes: s.getMinutes(),
                  seconds: s.getSeconds(),
                  milliseconds: s.getMilliseconds(),
                })
              : (s && e.warn('dateparser:', 'baseDate is not a valid date'),
                (b = {
                  year: 1900,
                  month: 0,
                  date: 1,
                  hours: 0,
                  minutes: 0,
                  seconds: 0,
                  milliseconds: 0,
                }));
            for (var $ = 1, w = h.length; $ < w; $++) {
              var y = m[$ - 1];
              ('Z' === y.matcher && (g = !0), y.apply && y.apply.call(b, h[$]));
            }
            var D = g ? Date.prototype.setUTCFullYear : Date.prototype.setFullYear,
              k = g ? Date.prototype.setUTCHours : Date.prototype.setHours;
            return (
              (u = b.year),
              (p = b.month),
              !((c = b.date) < 1) &&
                (1 === p && c > 28
                  ? 29 === c && ((u % 4 == 0 && u % 100 != 0) || u % 400 == 0)
                  : (3 !== p && 5 !== p && 8 !== p && 10 !== p) || c < 31) &&
                (!angular.isDate(s) || isNaN(s.getTime()) || g
                  ? ((v = new Date(0)),
                    D.call(v, b.year, b.month, b.date),
                    k.call(v, b.hours || 0, b.minutes || 0, b.seconds || 0, b.milliseconds || 0))
                  : ((v = new Date(s)),
                    D.call(v, b.year, b.month, b.date),
                    k.call(v, b.hours, b.minutes, b.seconds, b.milliseconds))),
              v
            );
          }
        }),
        (this.toTimezone = function (e, t) {
          return e && t ? m(e, t) : e;
        }),
        (this.fromTimezone = function (e, t) {
          return e && t ? m(e, t, !0) : e;
        }),
        (this.timezoneToOffset = d),
        (this.addDateMinutes = f),
        (this.convertTimezoneToLocal = m));
    },
  ]),
  angular.module('ui.bootstrap.isClass', []).directive('uibIsClass', [
    '$animate',
    function (e) {
      var t = /^\s*([\s\S]+?)\s+on\s+([\s\S]+?)\s*$/,
        n = /^\s*([\s\S]+?)\s+for\s+([\s\S]+?)\s*$/;
      return {
        restrict: 'A',
        compile: function (o, i) {
          var a = [],
            r = [],
            l = {},
            s = i.uibIsClass.match(t),
            u = s[2],
            p = s[1].split(',');
          return function (t, o, i) {
            (a.push(t),
              r.push({ scope: t, element: o }),
              p.forEach(function (o, i) {
                !(function (t, o) {
                  var i = t.match(n),
                    a = o.$eval(i[1]),
                    s = i[2],
                    p = l[t];
                  if (!p) {
                    var c = function (t) {
                      var n = null;
                      (r.some(function (e) {
                        if (e.scope.$eval(u) === t) return ((n = e), !0);
                      }),
                        p.lastActivated !== n &&
                          (p.lastActivated && e.removeClass(p.lastActivated.element, a),
                          n && e.addClass(n.element, a),
                          (p.lastActivated = n)));
                    };
                    l[t] = p = {
                      lastActivated: null,
                      scope: o,
                      watchFn: c,
                      compareWithExp: s,
                      watcher: o.$watch(s, c),
                    };
                  }
                  p.watchFn(o.$eval(s));
                })(o, t);
              }),
              t.$on('$destroy', c));
          };
          function c(e) {
            var t = e.targetScope,
              n = a.indexOf(t);
            if ((a.splice(n, 1), r.splice(n, 1), a.length)) {
              var o = a[0];
              angular.forEach(l, function (e) {
                e.scope === t &&
                  ((e.watcher = o.$watch(e.compareWithExp, e.watchFn)), (e.scope = o));
              });
            } else l = {};
          }
        },
      };
    },
  ]),
  angular
    .module('ui.bootstrap.datepicker', ['ui.bootstrap.dateparser', 'ui.bootstrap.isClass'])
    .value('$datepickerSuppressError', !1)
    .value('$datepickerLiteralWarning', !0)
    .constant('uibDatepickerConfig', {
      datepickerMode: 'day',
      formatDay: 'dd',
      formatMonth: 'MMMM',
      formatYear: 'yyyy',
      formatDayHeader: 'EEE',
      formatDayTitle: 'MMMM yyyy',
      formatMonthTitle: 'yyyy',
      maxDate: null,
      maxMode: 'year',
      minDate: null,
      minMode: 'day',
      monthColumns: 3,
      ngModelOptions: {},
      shortcutPropagation: !1,
      showWeeks: !0,
      yearColumns: 5,
      yearRows: 4,
    })
    .controller('UibDatepickerController', [
      '$scope',
      '$element',
      '$attrs',
      '$parse',
      '$interpolate',
      '$locale',
      '$log',
      'dateFilter',
      'uibDatepickerConfig',
      '$datepickerLiteralWarning',
      '$datepickerSuppressError',
      'uibDateParser',
      function (e, t, n, o, i, a, r, l, s, u, p, c) {
        var d = this,
          f = { $setViewValue: angular.noop },
          m = {},
          h = [];
        function g(t) {
          ((e.datepickerMode = t), (e.datepickerOptions.datepickerMode = t));
        }
        (t.addClass('uib-datepicker'),
          n.$set('role', 'application'),
          e.datepickerOptions || (e.datepickerOptions = {}),
          (this.modes = ['day', 'month', 'year']),
          [
            'customClass',
            'dateDisabled',
            'datepickerMode',
            'formatDay',
            'formatDayHeader',
            'formatDayTitle',
            'formatMonth',
            'formatMonthTitle',
            'formatYear',
            'maxDate',
            'maxMode',
            'minDate',
            'minMode',
            'monthColumns',
            'showWeeks',
            'shortcutPropagation',
            'startingDay',
            'yearColumns',
            'yearRows',
          ].forEach(function (t) {
            switch (t) {
              case 'customClass':
              case 'dateDisabled':
                e[t] = e.datepickerOptions[t] || angular.noop;
                break;
              case 'datepickerMode':
                e.datepickerMode = angular.isDefined(e.datepickerOptions.datepickerMode)
                  ? e.datepickerOptions.datepickerMode
                  : s.datepickerMode;
                break;
              case 'formatDay':
              case 'formatDayHeader':
              case 'formatDayTitle':
              case 'formatMonth':
              case 'formatMonthTitle':
              case 'formatYear':
                d[t] = angular.isDefined(e.datepickerOptions[t])
                  ? i(e.datepickerOptions[t])(e.$parent)
                  : s[t];
                break;
              case 'monthColumns':
              case 'showWeeks':
              case 'shortcutPropagation':
              case 'yearColumns':
              case 'yearRows':
                d[t] = angular.isDefined(e.datepickerOptions[t]) ? e.datepickerOptions[t] : s[t];
                break;
              case 'startingDay':
                angular.isDefined(e.datepickerOptions.startingDay)
                  ? (d.startingDay = e.datepickerOptions.startingDay)
                  : angular.isNumber(s.startingDay)
                    ? (d.startingDay = s.startingDay)
                    : (d.startingDay = (a.DATETIME_FORMATS.FIRSTDAYOFWEEK + 8) % 7);
                break;
              case 'maxDate':
              case 'minDate':
                e.$watch('datepickerOptions.' + t, function (e) {
                  (e
                    ? angular.isDate(e)
                      ? (d[t] = c.fromTimezone(new Date(e), m.getOption('timezone')))
                      : (u &&
                          r.warn(
                            'Literal date support has been deprecated, please switch to date object usage'
                          ),
                        (d[t] = new Date(l(e, 'medium'))))
                    : (d[t] = s[t]
                        ? c.fromTimezone(new Date(s[t]), m.getOption('timezone'))
                        : null),
                    d.refreshView());
                });
                break;
              case 'maxMode':
              case 'minMode':
                e.datepickerOptions[t]
                  ? e.$watch(
                      function () {
                        return e.datepickerOptions[t];
                      },
                      function (n) {
                        ((d[t] = e[t] = angular.isDefined(n) ? n : e.datepickerOptions[t]),
                          (('minMode' === t &&
                            d.modes.indexOf(e.datepickerOptions.datepickerMode) <
                              d.modes.indexOf(d[t])) ||
                            ('maxMode' === t &&
                              d.modes.indexOf(e.datepickerOptions.datepickerMode) >
                                d.modes.indexOf(d[t]))) &&
                            ((e.datepickerMode = d[t]),
                            (e.datepickerOptions.datepickerMode = d[t])));
                      }
                    )
                  : (d[t] = e[t] = s[t] || null);
            }
          }),
          (e.uniqueId = 'datepicker-' + e.$id + '-' + Math.floor(1e4 * Math.random())),
          (e.disabled = angular.isDefined(n.disabled) || !1),
          angular.isDefined(n.ngDisabled) &&
            h.push(
              e.$parent.$watch(n.ngDisabled, function (t) {
                ((e.disabled = t), d.refreshView());
              })
            ),
          (e.isActive = function (t) {
            return 0 === d.compare(t.date, d.activeDate) && ((e.activeDateId = t.uid), !0);
          }),
          (this.init = function (t) {
            ((m = (function (t) {
              var n;
              if (angular.version.minor < 6)
                (n =
                  t.$options ||
                  e.datepickerOptions.ngModelOptions ||
                  s.ngModelOptions ||
                  {}).getOption = function (e) {
                  return n[e];
                };
              else {
                var o =
                  t.$options.getOption('timezone') ||
                  (e.datepickerOptions.ngModelOptions
                    ? e.datepickerOptions.ngModelOptions.timezone
                    : null) ||
                  (s.ngModelOptions ? s.ngModelOptions.timezone : null);
                n = t.$options
                  .createChild(s.ngModelOptions)
                  .createChild(e.datepickerOptions.ngModelOptions)
                  .createChild(t.$options)
                  .createChild({ timezone: o });
              }
              return n;
            })((f = t))),
              e.datepickerOptions.initDate
                ? ((d.activeDate =
                    c.fromTimezone(e.datepickerOptions.initDate, m.getOption('timezone')) ||
                    new Date()),
                  e.$watch('datepickerOptions.initDate', function (e) {
                    e &&
                      (f.$isEmpty(f.$modelValue) || f.$invalid) &&
                      ((d.activeDate = c.fromTimezone(e, m.getOption('timezone'))),
                      d.refreshView());
                  }))
                : (d.activeDate = new Date()));
            var n = f.$modelValue ? new Date(f.$modelValue) : new Date();
            ((this.activeDate = isNaN(n)
              ? c.fromTimezone(new Date(), m.getOption('timezone'))
              : c.fromTimezone(n, m.getOption('timezone'))),
              (f.$render = function () {
                d.render();
              }));
          }),
          (this.render = function () {
            if (f.$viewValue) {
              var e = new Date(f.$viewValue);
              isNaN(e)
                ? p || r.error('Datepicker directive: "ng-model" value must be a Date object')
                : (this.activeDate = c.fromTimezone(e, m.getOption('timezone')));
            }
            this.refreshView();
          }),
          (this.refreshView = function () {
            if (this.element) {
              ((e.selectedDt = null),
                this._refreshView(),
                e.activeDt && (e.activeDateId = e.activeDt.uid));
              var t = f.$viewValue ? new Date(f.$viewValue) : null;
              ((t = c.fromTimezone(t, m.getOption('timezone'))),
                f.$setValidity('dateDisabled', !t || (this.element && !this.isDisabled(t))));
            }
          }),
          (this.createDateObject = function (t, n) {
            var o = f.$viewValue ? new Date(f.$viewValue) : null;
            o = c.fromTimezone(o, m.getOption('timezone'));
            var i = new Date();
            i = c.fromTimezone(i, m.getOption('timezone'));
            var a = this.compare(t, i),
              r = {
                date: t,
                label: c.filter(t, n),
                selected: o && 0 === this.compare(t, o),
                disabled: this.isDisabled(t),
                past: a < 0,
                current: 0 === a,
                future: a > 0,
                customClass: this.customClass(t) || null,
              };
            return (
              o && 0 === this.compare(t, o) && (e.selectedDt = r),
              d.activeDate && 0 === this.compare(r.date, d.activeDate) && (e.activeDt = r),
              r
            );
          }),
          (this.isDisabled = function (t) {
            return (
              e.disabled ||
              (this.minDate && this.compare(t, this.minDate) < 0) ||
              (this.maxDate && this.compare(t, this.maxDate) > 0) ||
              (e.dateDisabled && e.dateDisabled({ date: t, mode: e.datepickerMode }))
            );
          }),
          (this.customClass = function (t) {
            return e.customClass({ date: t, mode: e.datepickerMode });
          }),
          (this.split = function (e, t) {
            for (var n = []; e.length > 0; ) n.push(e.splice(0, t));
            return n;
          }),
          (e.select = function (t) {
            if (e.datepickerMode === d.minMode) {
              var n = f.$viewValue
                ? c.fromTimezone(new Date(f.$viewValue), m.getOption('timezone'))
                : new Date(0, 0, 0, 0, 0, 0, 0);
              (n.setFullYear(t.getFullYear(), t.getMonth(), t.getDate()),
                (n = c.toTimezone(n, m.getOption('timezone'))),
                f.$setViewValue(n),
                f.$render());
            } else
              ((d.activeDate = t),
                g(d.modes[d.modes.indexOf(e.datepickerMode) - 1]),
                e.$emit('uib:datepicker.mode'));
            e.$broadcast('uib:datepicker.focus');
          }),
          (e.move = function (e) {
            var t = d.activeDate.getFullYear() + e * (d.step.years || 0),
              n = d.activeDate.getMonth() + e * (d.step.months || 0);
            (d.activeDate.setFullYear(t, n, 1), d.refreshView());
          }),
          (e.toggleMode = function (t) {
            ((t = t || 1),
              (e.datepickerMode === d.maxMode && 1 === t) ||
                (e.datepickerMode === d.minMode && -1 === t) ||
                (g(d.modes[d.modes.indexOf(e.datepickerMode) + t]),
                e.$emit('uib:datepicker.mode')));
          }),
          (e.keys = {
            13: 'enter',
            32: 'space',
            33: 'pageup',
            34: 'pagedown',
            35: 'end',
            36: 'home',
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
          }),
          e.$on('uib:datepicker.focus', function () {
            d.element[0].focus();
          }),
          (e.keydown = function (t) {
            var n = e.keys[t.which];
            if (n && !t.shiftKey && !t.altKey && !e.disabled)
              if (
                (t.preventDefault(),
                d.shortcutPropagation || t.stopPropagation(),
                'enter' === n || 'space' === n)
              ) {
                if (d.isDisabled(d.activeDate)) return;
                e.select(d.activeDate);
              } else
                !t.ctrlKey || ('up' !== n && 'down' !== n)
                  ? (d.handleKeyDown(n, t), d.refreshView())
                  : e.toggleMode('up' === n ? 1 : -1);
          }),
          t.on('keydown', function (t) {
            e.$apply(function () {
              e.keydown(t);
            });
          }),
          e.$on('$destroy', function () {
            for (; h.length; ) h.shift()();
          }));
      },
    ])
    .controller('UibDaypickerController', [
      '$scope',
      '$element',
      'dateFilter',
      function (e, t, n) {
        var o = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        function i(e, t) {
          return 1 !== t || e % 4 != 0 || (e % 100 == 0 && e % 400 != 0) ? o[t] : 29;
        }
        function a(e) {
          var t = new Date(e);
          t.setDate(t.getDate() + 4 - (t.getDay() || 7));
          var n = t.getTime();
          return (t.setMonth(0), t.setDate(1), Math.floor(Math.round((n - t) / 864e5) / 7) + 1);
        }
        ((this.step = { months: 1 }),
          (this.element = t),
          (this.init = function (t) {
            (angular.extend(t, this), (e.showWeeks = t.showWeeks), t.refreshView());
          }),
          (this.getDates = function (e, t) {
            for (var n, o = new Array(t), i = new Date(e), a = 0; a < t; )
              ((n = new Date(i)), (o[a++] = n), i.setDate(i.getDate() + 1));
            return o;
          }),
          (this._refreshView = function () {
            var t = this.activeDate.getFullYear(),
              o = this.activeDate.getMonth(),
              i = new Date(this.activeDate);
            i.setFullYear(t, o, 1);
            var r = this.startingDay - i.getDay(),
              l = r > 0 ? 7 - r : -r,
              s = new Date(i);
            l > 0 && s.setDate(1 - l);
            for (var u = this.getDates(s, 42), p = 0; p < 42; p++)
              u[p] = angular.extend(this.createDateObject(u[p], this.formatDay), {
                secondary: u[p].getMonth() !== o,
                uid: e.uniqueId + '-' + p,
              });
            e.labels = new Array(7);
            for (var c = 0; c < 7; c++)
              e.labels[c] = {
                abbr: n(u[c].date, this.formatDayHeader),
                full: n(u[c].date, 'EEEE'),
              };
            if (
              ((e.title = n(this.activeDate, this.formatDayTitle)),
              (e.rows = this.split(u, 7)),
              e.showWeeks)
            ) {
              e.weekNumbers = [];
              for (var d = (11 - this.startingDay) % 7, f = e.rows.length, m = 0; m < f; m++)
                e.weekNumbers.push(a(e.rows[m][d].date));
            }
          }),
          (this.compare = function (e, t) {
            var n = new Date(e.getFullYear(), e.getMonth(), e.getDate()),
              o = new Date(t.getFullYear(), t.getMonth(), t.getDate());
            return (n.setFullYear(e.getFullYear()), o.setFullYear(t.getFullYear()), n - o);
          }),
          (this.handleKeyDown = function (e, t) {
            var n = this.activeDate.getDate();
            if ('left' === e) n -= 1;
            else if ('up' === e) n -= 7;
            else if ('right' === e) n += 1;
            else if ('down' === e) n += 7;
            else if ('pageup' === e || 'pagedown' === e) {
              var o = this.activeDate.getMonth() + ('pageup' === e ? -1 : 1);
              (this.activeDate.setMonth(o, 1),
                (n = Math.min(i(this.activeDate.getFullYear(), this.activeDate.getMonth()), n)));
            } else
              'home' === e
                ? (n = 1)
                : 'end' === e && (n = i(this.activeDate.getFullYear(), this.activeDate.getMonth()));
            this.activeDate.setDate(n);
          }));
      },
    ])
    .controller('UibMonthpickerController', [
      '$scope',
      '$element',
      'dateFilter',
      function (e, t, n) {
        ((this.step = { years: 1 }),
          (this.element = t),
          (this.init = function (e) {
            (angular.extend(e, this), e.refreshView());
          }),
          (this._refreshView = function () {
            for (var t, o = new Array(12), i = this.activeDate.getFullYear(), a = 0; a < 12; a++)
              ((t = new Date(this.activeDate)).setFullYear(i, a, 1),
                (o[a] = angular.extend(this.createDateObject(t, this.formatMonth), {
                  uid: e.uniqueId + '-' + a,
                })));
            ((e.title = n(this.activeDate, this.formatMonthTitle)),
              (e.rows = this.split(o, this.monthColumns)),
              (e.yearHeaderColspan = this.monthColumns > 3 ? this.monthColumns - 2 : 1));
          }),
          (this.compare = function (e, t) {
            var n = new Date(e.getFullYear(), e.getMonth()),
              o = new Date(t.getFullYear(), t.getMonth());
            return (n.setFullYear(e.getFullYear()), o.setFullYear(t.getFullYear()), n - o);
          }),
          (this.handleKeyDown = function (e, t) {
            var n = this.activeDate.getMonth();
            if ('left' === e) n -= 1;
            else if ('up' === e) n -= this.monthColumns;
            else if ('right' === e) n += 1;
            else if ('down' === e) n += this.monthColumns;
            else if ('pageup' === e || 'pagedown' === e) {
              var o = this.activeDate.getFullYear() + ('pageup' === e ? -1 : 1);
              this.activeDate.setFullYear(o);
            } else 'home' === e ? (n = 0) : 'end' === e && (n = 11);
            this.activeDate.setMonth(n);
          }));
      },
    ])
    .controller('UibYearpickerController', [
      '$scope',
      '$element',
      'dateFilter',
      function (e, t, n) {
        var o, i;
        function a(e) {
          return parseInt((e - 1) / i, 10) * i + 1;
        }
        ((this.element = t),
          (this.yearpickerInit = function () {
            ((o = this.yearColumns), (i = this.yearRows * o), (this.step = { years: i }));
          }),
          (this._refreshView = function () {
            for (var t, n = new Array(i), r = 0, l = a(this.activeDate.getFullYear()); r < i; r++)
              ((t = new Date(this.activeDate)).setFullYear(l + r, 0, 1),
                (n[r] = angular.extend(this.createDateObject(t, this.formatYear), {
                  uid: e.uniqueId + '-' + r,
                })));
            ((e.title = [n[0].label, n[i - 1].label].join(' - ')),
              (e.rows = this.split(n, o)),
              (e.columns = o));
          }),
          (this.compare = function (e, t) {
            return e.getFullYear() - t.getFullYear();
          }),
          (this.handleKeyDown = function (e, t) {
            var n = this.activeDate.getFullYear();
            ('left' === e
              ? (n -= 1)
              : 'up' === e
                ? (n -= o)
                : 'right' === e
                  ? (n += 1)
                  : 'down' === e
                    ? (n += o)
                    : 'pageup' === e || 'pagedown' === e
                      ? (n += ('pageup' === e ? -1 : 1) * i)
                      : 'home' === e
                        ? (n = a(this.activeDate.getFullYear()))
                        : 'end' === e && (n = a(this.activeDate.getFullYear()) + i - 1),
              this.activeDate.setFullYear(n));
          }));
      },
    ])
    .directive('uibDatepicker', function () {
      return {
        templateUrl: function (e, t) {
          return t.templateUrl || 'uib/template/datepicker/datepicker.html';
        },
        scope: { datepickerOptions: '=?' },
        require: ['uibDatepicker', '^ngModel'],
        restrict: 'A',
        controller: 'UibDatepickerController',
        controllerAs: 'datepicker',
        link: function (e, t, n, o) {
          var i = o[0],
            a = o[1];
          i.init(a);
        },
      };
    })
    .directive('uibDaypicker', function () {
      return {
        templateUrl: function (e, t) {
          return t.templateUrl || 'uib/template/datepicker/day.html';
        },
        require: ['^uibDatepicker', 'uibDaypicker'],
        restrict: 'A',
        controller: 'UibDaypickerController',
        link: function (e, t, n, o) {
          var i = o[0];
          o[1].init(i);
        },
      };
    })
    .directive('uibMonthpicker', function () {
      return {
        templateUrl: function (e, t) {
          return t.templateUrl || 'uib/template/datepicker/month.html';
        },
        require: ['^uibDatepicker', 'uibMonthpicker'],
        restrict: 'A',
        controller: 'UibMonthpickerController',
        link: function (e, t, n, o) {
          var i = o[0];
          o[1].init(i);
        },
      };
    })
    .directive('uibYearpicker', function () {
      return {
        templateUrl: function (e, t) {
          return t.templateUrl || 'uib/template/datepicker/year.html';
        },
        require: ['^uibDatepicker', 'uibYearpicker'],
        restrict: 'A',
        controller: 'UibYearpickerController',
        link: function (e, t, n, o) {
          var i = o[0];
          (angular.extend(i, o[1]), i.yearpickerInit(), i.refreshView());
        },
      };
    }),
  angular.module('ui.bootstrap.position', []).factory('$uibPosition', [
    '$document',
    '$window',
    function (e, t) {
      var n,
        o,
        i = { normal: /(auto|scroll)/, hidden: /(auto|scroll|hidden)/ },
        a = {
          auto: /\s?auto?\s?/i,
          primary: /^(top|bottom|left|right)$/,
          secondary: /^(top|bottom|left|right|center)$/,
          vertical: /^(top|bottom)$/,
        },
        r = /(HTML|BODY)/;
      return {
        getRawNode: function (e) {
          return e.nodeName ? e : e[0] || e;
        },
        parseStyle: function (e) {
          return ((e = parseFloat(e)), isFinite(e) ? e : 0);
        },
        offsetParent: function (n) {
          for (
            var o, i = (n = this.getRawNode(n)).offsetParent || e[0].documentElement;
            i &&
            i !== e[0].documentElement &&
            ((o = i), 'static' === (t.getComputedStyle(o).position || 'static'));
          )
            i = i.offsetParent;
          return i || e[0].documentElement;
        },
        scrollbarWidth: function (i) {
          if (i) {
            if (angular.isUndefined(o)) {
              var a = e.find('body');
              (a.addClass('uib-position-body-scrollbar-measure'),
                (o = t.innerWidth - a[0].clientWidth),
                (o = isFinite(o) ? o : 0),
                a.removeClass('uib-position-body-scrollbar-measure'));
            }
            return o;
          }
          if (angular.isUndefined(n)) {
            var r = angular.element('<div class="uib-position-scrollbar-measure"></div>');
            (e.find('body').append(r),
              (n = r[0].offsetWidth - r[0].clientWidth),
              (n = isFinite(n) ? n : 0),
              r.remove());
          }
          return n;
        },
        scrollbarPadding: function (e) {
          e = this.getRawNode(e);
          var n = t.getComputedStyle(e),
            o = this.parseStyle(n.paddingRight),
            i = this.parseStyle(n.paddingBottom),
            a = this.scrollParent(e, !1, !0),
            l = this.scrollbarWidth(r.test(a.tagName));
          return {
            scrollbarWidth: l,
            widthOverflow: a.scrollWidth > a.clientWidth,
            right: o + l,
            originalRight: o,
            heightOverflow: a.scrollHeight > a.clientHeight,
            bottom: i + l,
            originalBottom: i,
          };
        },
        isScrollable: function (e, n) {
          e = this.getRawNode(e);
          var o = n ? i.hidden : i.normal,
            a = t.getComputedStyle(e);
          return o.test(a.overflow + a.overflowY + a.overflowX);
        },
        scrollParent: function (n, o, a) {
          n = this.getRawNode(n);
          var r = o ? i.hidden : i.normal,
            l = e[0].documentElement,
            s = t.getComputedStyle(n);
          if (a && r.test(s.overflow + s.overflowY + s.overflowX)) return n;
          var u = 'absolute' === s.position,
            p = n.parentElement || l;
          if (p === l || 'fixed' === s.position) return l;
          for (; p.parentElement && p !== l; ) {
            var c = t.getComputedStyle(p);
            if (
              (u && 'static' !== c.position && (u = !1),
              !u && r.test(c.overflow + c.overflowY + c.overflowX))
            )
              break;
            p = p.parentElement;
          }
          return p;
        },
        position: function (n, o) {
          n = this.getRawNode(n);
          var i = this.offset(n);
          if (o) {
            var a = t.getComputedStyle(n);
            ((i.top -= this.parseStyle(a.marginTop)), (i.left -= this.parseStyle(a.marginLeft)));
          }
          var r = this.offsetParent(n),
            l = { top: 0, left: 0 };
          return (
            r !== e[0].documentElement &&
              (((l = this.offset(r)).top += r.clientTop - r.scrollTop),
              (l.left += r.clientLeft - r.scrollLeft)),
            {
              width: Math.round(angular.isNumber(i.width) ? i.width : n.offsetWidth),
              height: Math.round(angular.isNumber(i.height) ? i.height : n.offsetHeight),
              top: Math.round(i.top - l.top),
              left: Math.round(i.left - l.left),
            }
          );
        },
        offset: function (n) {
          var o = (n = this.getRawNode(n)).getBoundingClientRect();
          return {
            width: Math.round(angular.isNumber(o.width) ? o.width : n.offsetWidth),
            height: Math.round(angular.isNumber(o.height) ? o.height : n.offsetHeight),
            top: Math.round(o.top + (t.pageYOffset || e[0].documentElement.scrollTop)),
            left: Math.round(o.left + (t.pageXOffset || e[0].documentElement.scrollLeft)),
          };
        },
        viewportOffset: function (n, o, i) {
          i = !1 !== i;
          var a = (n = this.getRawNode(n)).getBoundingClientRect(),
            r = { top: 0, left: 0, bottom: 0, right: 0 },
            l = o ? e[0].documentElement : this.scrollParent(n),
            s = l.getBoundingClientRect();
          if (
            ((r.top = s.top + l.clientTop),
            (r.left = s.left + l.clientLeft),
            l === e[0].documentElement && ((r.top += t.pageYOffset), (r.left += t.pageXOffset)),
            (r.bottom = r.top + l.clientHeight),
            (r.right = r.left + l.clientWidth),
            i)
          ) {
            var u = t.getComputedStyle(l);
            ((r.top += this.parseStyle(u.paddingTop)),
              (r.bottom -= this.parseStyle(u.paddingBottom)),
              (r.left += this.parseStyle(u.paddingLeft)),
              (r.right -= this.parseStyle(u.paddingRight)));
          }
          return {
            top: Math.round(a.top - r.top),
            bottom: Math.round(r.bottom - a.bottom),
            left: Math.round(a.left - r.left),
            right: Math.round(r.right - a.right),
          };
        },
        parsePlacement: function (e) {
          var t = a.auto.test(e);
          return (
            t && (e = e.replace(a.auto, '')),
            ((e = e.split('-'))[0] = e[0] || 'top'),
            a.primary.test(e[0]) || (e[0] = 'top'),
            (e[1] = e[1] || 'center'),
            a.secondary.test(e[1]) || (e[1] = 'center'),
            (e[2] = !!t),
            e
          );
        },
        positionElements: function (e, n, o, i) {
          ((e = this.getRawNode(e)), (n = this.getRawNode(n)));
          var r = angular.isDefined(n.offsetWidth) ? n.offsetWidth : n.prop('offsetWidth'),
            l = angular.isDefined(n.offsetHeight) ? n.offsetHeight : n.prop('offsetHeight');
          o = this.parsePlacement(o);
          var s = i ? this.offset(e) : this.position(e),
            u = { top: 0, left: 0, placement: '' };
          if (o[2]) {
            var p = this.viewportOffset(e, i),
              c = t.getComputedStyle(n),
              d = {
                width:
                  r +
                  Math.round(
                    Math.abs(this.parseStyle(c.marginLeft) + this.parseStyle(c.marginRight))
                  ),
                height:
                  l +
                  Math.round(
                    Math.abs(this.parseStyle(c.marginTop) + this.parseStyle(c.marginBottom))
                  ),
              };
            if (
              ((o[0] =
                'top' === o[0] && d.height > p.top && d.height <= p.bottom
                  ? 'bottom'
                  : 'bottom' === o[0] && d.height > p.bottom && d.height <= p.top
                    ? 'top'
                    : 'left' === o[0] && d.width > p.left && d.width <= p.right
                      ? 'right'
                      : 'right' === o[0] && d.width > p.right && d.width <= p.left
                        ? 'left'
                        : o[0]),
              (o[1] =
                'top' === o[1] && d.height - s.height > p.bottom && d.height - s.height <= p.top
                  ? 'bottom'
                  : 'bottom' === o[1] &&
                      d.height - s.height > p.top &&
                      d.height - s.height <= p.bottom
                    ? 'top'
                    : 'left' === o[1] && d.width - s.width > p.right && d.width - s.width <= p.left
                      ? 'right'
                      : 'right' === o[1] &&
                          d.width - s.width > p.left &&
                          d.width - s.width <= p.right
                        ? 'left'
                        : o[1]),
              'center' === o[1])
            )
              if (a.vertical.test(o[0])) {
                var f = s.width / 2 - r / 2;
                p.left + f < 0 && d.width - s.width <= p.right
                  ? (o[1] = 'left')
                  : p.right + f < 0 && d.width - s.width <= p.left && (o[1] = 'right');
              } else {
                var m = s.height / 2 - d.height / 2;
                p.top + m < 0 && d.height - s.height <= p.bottom
                  ? (o[1] = 'top')
                  : p.bottom + m < 0 && d.height - s.height <= p.top && (o[1] = 'bottom');
              }
          }
          switch (o[0]) {
            case 'top':
              u.top = s.top - l;
              break;
            case 'bottom':
              u.top = s.top + s.height;
              break;
            case 'left':
              u.left = s.left - r;
              break;
            case 'right':
              u.left = s.left + s.width;
          }
          switch (o[1]) {
            case 'top':
              u.top = s.top;
              break;
            case 'bottom':
              u.top = s.top + s.height - l;
              break;
            case 'left':
              u.left = s.left;
              break;
            case 'right':
              u.left = s.left + s.width - r;
              break;
            case 'center':
              a.vertical.test(o[0])
                ? (u.left = s.left + s.width / 2 - r / 2)
                : (u.top = s.top + s.height / 2 - l / 2);
          }
          return (
            (u.top = Math.round(u.top)),
            (u.left = Math.round(u.left)),
            (u.placement = 'center' === o[1] ? o[0] : o[0] + '-' + o[1]),
            u
          );
        },
        adjustTop: function (e, t, n, o) {
          if (-1 !== e.indexOf('top') && n !== o) return { top: t.top - o + 'px' };
        },
        positionArrow: function (e, n) {
          var o = (e = this.getRawNode(e)).querySelector('.tooltip-inner, .popover-inner');
          if (o) {
            var i = angular.element(o).hasClass('tooltip-inner'),
              r = i ? e.querySelector('.tooltip-arrow') : e.querySelector('.arrow');
            if (r) {
              var l = { top: '', bottom: '', left: '', right: '' };
              if ('center' !== (n = this.parsePlacement(n))[1]) {
                var s = 'border-' + n[0] + '-width',
                  u = t.getComputedStyle(r)[s],
                  p = 'border-';
                (a.vertical.test(n[0]) ? (p += n[0] + '-' + n[1]) : (p += n[1] + '-' + n[0]),
                  (p += '-radius'));
                var c = t.getComputedStyle(i ? o : e)[p];
                switch (n[0]) {
                  case 'top':
                    l.bottom = i ? '0' : '-' + u;
                    break;
                  case 'bottom':
                    l.top = i ? '0' : '-' + u;
                    break;
                  case 'left':
                    l.right = i ? '0' : '-' + u;
                    break;
                  case 'right':
                    l.left = i ? '0' : '-' + u;
                }
                ((l[n[1]] = c), angular.element(r).css(l));
              } else angular.element(r).css(l);
            }
          }
        },
      };
    },
  ]),
  angular
    .module('ui.bootstrap.datepickerPopup', ['ui.bootstrap.datepicker', 'ui.bootstrap.position'])
    .value('$datepickerPopupLiteralWarning', !0)
    .constant('uibDatepickerPopupConfig', {
      altInputFormats: [],
      appendToBody: !1,
      clearText: 'Clear',
      closeOnDateSelection: !0,
      closeText: 'Done',
      currentText: 'Today',
      datepickerPopup: 'yyyy-MM-dd',
      datepickerPopupTemplateUrl: 'uib/template/datepickerPopup/popup.html',
      datepickerTemplateUrl: 'uib/template/datepicker/datepicker.html',
      html5Types: {
        date: 'yyyy-MM-dd',
        'datetime-local': 'yyyy-MM-ddTHH:mm:ss.sss',
        month: 'yyyy-MM',
      },
      onOpenFocus: !0,
      showButtonBar: !0,
      placement: 'auto bottom-left',
    })
    .controller('UibDatepickerPopupController', [
      '$scope',
      '$element',
      '$attrs',
      '$compile',
      '$log',
      '$parse',
      '$window',
      '$document',
      '$rootScope',
      '$uibPosition',
      'dateFilter',
      'uibDateParser',
      'uibDatepickerPopupConfig',
      '$timeout',
      'uibDatepickerConfig',
      '$datepickerPopupLiteralWarning',
      function (e, t, n, o, i, a, r, l, s, u, p, c, d, f, m, h) {
        var g,
          b,
          v,
          $,
          w,
          y,
          D,
          k,
          C,
          T,
          x,
          M,
          O,
          E = !1,
          P = [];
        function S(t) {
          var n = c.parse(t, g, e.date);
          if (isNaN(n))
            for (var o = 0; o < O.length; o++)
              if (((n = c.parse(t, O[o], e.date)), !isNaN(n))) return n;
          return n;
        }
        function A(e) {
          if ((angular.isNumber(e) && (e = new Date(e)), !e)) return null;
          if (angular.isDate(e) && !isNaN(e)) return e;
          if (angular.isString(e)) {
            var t = S(e);
            if (!isNaN(t)) return c.toTimezone(t, x.getOption('timezone'));
          }
          return x.getOption('allowInvalid') ? e : void 0;
        }
        function I(e, t) {
          var o = e || t;
          return (
            (!n.ngRequired && !o) ||
            (angular.isNumber(o) && (o = new Date(o)),
            !o || !(!angular.isDate(o) || isNaN(o)) || (!!angular.isString(o) && !isNaN(S(o))))
          );
        }
        function U(n) {
          if (e.isOpen || !e.disabled) {
            var o = M[0],
              i = t[0].contains(n.target),
              a = void 0 !== o.contains && o.contains(n.target);
            !e.isOpen ||
              i ||
              a ||
              e.$apply(function () {
                e.isOpen = !1;
              });
          }
        }
        function N(n) {
          27 === n.which && e.isOpen
            ? (n.preventDefault(),
              n.stopPropagation(),
              e.$apply(function () {
                e.isOpen = !1;
              }),
              t[0].focus())
            : 40 !== n.which ||
              e.isOpen ||
              (n.preventDefault(),
              n.stopPropagation(),
              e.$apply(function () {
                e.isOpen = !0;
              }));
        }
        function F() {
          if (e.isOpen) {
            var o = angular.element(M[0].querySelector('.uib-datepicker-popup')),
              i = n.popupPlacement ? n.popupPlacement : d.placement,
              a = u.positionElements(t, o, i, v);
            (o.css({ top: a.top + 'px', left: a.left + 'px' }),
              o.hasClass('uib-position-measure') && o.removeClass('uib-position-measure'));
          }
        }
        ((this.init = function (i) {
          if (
            ((x = (function (e) {
              var t;
              return (
                angular.version.minor < 6
                  ? ((t = angular.isObject(e.$options)
                      ? e.$options
                      : { timezone: null }).getOption = function (e) {
                      return t[e];
                    })
                  : (t = e.$options),
                t
              );
            })((T = i))),
            (b = angular.isDefined(n.closeOnDateSelection)
              ? e.$parent.$eval(n.closeOnDateSelection)
              : d.closeOnDateSelection),
            (v = angular.isDefined(n.datepickerAppendToBody)
              ? e.$parent.$eval(n.datepickerAppendToBody)
              : d.appendToBody),
            ($ = angular.isDefined(n.onOpenFocus) ? e.$parent.$eval(n.onOpenFocus) : d.onOpenFocus),
            (w = angular.isDefined(n.datepickerPopupTemplateUrl)
              ? n.datepickerPopupTemplateUrl
              : d.datepickerPopupTemplateUrl),
            (y = angular.isDefined(n.datepickerTemplateUrl)
              ? n.datepickerTemplateUrl
              : d.datepickerTemplateUrl),
            (O = angular.isDefined(n.altInputFormats)
              ? e.$parent.$eval(n.altInputFormats)
              : d.altInputFormats),
            (e.showButtonBar = angular.isDefined(n.showButtonBar)
              ? e.$parent.$eval(n.showButtonBar)
              : d.showButtonBar),
            d.html5Types[n.type]
              ? ((g = d.html5Types[n.type]), (E = !0))
              : ((g = n.uibDatepickerPopup || d.datepickerPopup),
                n.$observe('uibDatepickerPopup', function (e, t) {
                  var n = e || d.datepickerPopup;
                  if (n !== g && ((g = n), (T.$modelValue = null), !g))
                    throw new Error('uibDatepickerPopup must have a date format specified.');
                })),
            !g)
          )
            throw new Error('uibDatepickerPopup must have a date format specified.');
          if (E && n.uibDatepickerPopup)
            throw new Error('HTML5 date input types do not support custom formats.');
          ((D = angular.element(
            '<div uib-datepicker-popup-wrap><div uib-datepicker></div></div>'
          )).attr({ 'ng-model': 'date', 'ng-change': 'dateSelection(date)', 'template-url': w }),
            (k = angular.element(D.children()[0])).attr('template-url', y),
            e.datepickerOptions || (e.datepickerOptions = {}),
            E &&
              'month' === n.type &&
              ((e.datepickerOptions.datepickerMode = 'month'),
              (e.datepickerOptions.minMode = 'month')),
            k.attr('datepicker-options', 'datepickerOptions'),
            E
              ? T.$formatters.push(function (t) {
                  return ((e.date = c.fromTimezone(t, x.getOption('timezone'))), t);
                })
              : ((T.$$parserName = 'date'),
                (T.$validators.date = I),
                T.$parsers.unshift(A),
                T.$formatters.push(function (t) {
                  return T.$isEmpty(t)
                    ? ((e.date = t), t)
                    : (angular.isNumber(t) && (t = new Date(t)),
                      (e.date = c.fromTimezone(t, x.getOption('timezone'))),
                      c.filter(e.date, g));
                })),
            T.$viewChangeListeners.push(function () {
              e.date = S(T.$viewValue);
            }),
            t.on('keydown', N),
            (M = o(D)(e)),
            D.remove(),
            v ? l.find('body').append(M) : t.after(M),
            e.$on('$destroy', function () {
              for (
                !0 === e.isOpen &&
                  (s.$$phase ||
                    e.$apply(function () {
                      e.isOpen = !1;
                    })),
                  M.remove(),
                  t.off('keydown', N),
                  l.off('click', U),
                  C && C.off('scroll', F),
                  angular.element(r).off('resize', F);
                P.length;
              )
                P.shift()();
            }));
        }),
          (e.getText = function (t) {
            return e[t + 'Text'] || d[t + 'Text'];
          }),
          (e.isDisabled = function (t) {
            'today' === t && (t = c.fromTimezone(new Date(), x.getOption('timezone')));
            var n = {};
            return (
              angular.forEach(['minDate', 'maxDate'], function (t) {
                e.datepickerOptions[t]
                  ? angular.isDate(e.datepickerOptions[t])
                    ? (n[t] = new Date(e.datepickerOptions[t]))
                    : (h &&
                        i.warn(
                          'Literal date support has been deprecated, please switch to date object usage'
                        ),
                      (n[t] = new Date(p(e.datepickerOptions[t], 'medium'))))
                  : (n[t] = null);
              }),
              (e.datepickerOptions && n.minDate && e.compare(t, n.minDate) < 0) ||
                (n.maxDate && e.compare(t, n.maxDate) > 0)
            );
          }),
          (e.compare = function (e, t) {
            return (
              new Date(e.getFullYear(), e.getMonth(), e.getDate()) -
              new Date(t.getFullYear(), t.getMonth(), t.getDate())
            );
          }),
          (e.dateSelection = function (n) {
            e.date = n;
            var o = e.date ? c.filter(e.date, g) : null;
            (t.val(o), T.$setViewValue(o), b && ((e.isOpen = !1), t[0].focus()));
          }),
          (e.keydown = function (n) {
            27 === n.which && (n.stopPropagation(), (e.isOpen = !1), t[0].focus());
          }),
          (e.select = function (t, n) {
            if ((n.stopPropagation(), 'today' === t)) {
              var o = new Date();
              angular.isDate(e.date)
                ? (t = new Date(e.date)).setFullYear(o.getFullYear(), o.getMonth(), o.getDate())
                : (t = c.fromTimezone(o, x.getOption('timezone'))).setHours(0, 0, 0, 0);
            }
            e.dateSelection(t);
          }),
          (e.close = function (n) {
            (n.stopPropagation(), (e.isOpen = !1), t[0].focus());
          }),
          (e.disabled = angular.isDefined(n.disabled) || !1),
          n.ngDisabled &&
            P.push(
              e.$parent.$watch(a(n.ngDisabled), function (t) {
                e.disabled = t;
              })
            ),
          e.$watch('isOpen', function (o) {
            o
              ? e.disabled
                ? (e.isOpen = !1)
                : f(
                    function () {
                      (F(), $ && e.$broadcast('uib:datepicker.focus'), l.on('click', U));
                      var o = n.popupPlacement ? n.popupPlacement : d.placement;
                      (v || u.parsePlacement(o)[2]
                        ? (C = C || angular.element(u.scrollParent(t))) && C.on('scroll', F)
                        : (C = null),
                        angular.element(r).on('resize', F));
                    },
                    0,
                    !1
                  )
              : (l.off('click', U), C && C.off('scroll', F), angular.element(r).off('resize', F));
          }),
          e.$on('uib:datepicker.mode', function () {
            f(F, 0, !1);
          }));
      },
    ])
    .directive('uibDatepickerPopup', function () {
      return {
        require: ['ngModel', 'uibDatepickerPopup'],
        controller: 'UibDatepickerPopupController',
        scope: {
          datepickerOptions: '=?',
          isOpen: '=?',
          currentText: '@',
          clearText: '@',
          closeText: '@',
        },
        link: function (e, t, n, o) {
          var i = o[0];
          o[1].init(i);
        },
      };
    })
    .directive('uibDatepickerPopupWrap', function () {
      return {
        restrict: 'A',
        transclude: !0,
        templateUrl: function (e, t) {
          return t.templateUrl || 'uib/template/datepickerPopup/popup.html';
        },
      };
    }),
  angular.module('ui.bootstrap.debounce', []).factory('$$debounce', [
    '$timeout',
    function (e) {
      return function (t, n) {
        var o;
        return function () {
          var i = this,
            a = Array.prototype.slice.call(arguments);
          (o && e.cancel(o),
            (o = e(function () {
              t.apply(i, a);
            }, n)));
        };
      };
    },
  ]),
  angular.module('ui.bootstrap.multiMap', []).factory('$$multiMap', function () {
    return {
      createNew: function () {
        var e = {};
        return {
          entries: function () {
            return Object.keys(e).map(function (t) {
              return { key: t, value: e[t] };
            });
          },
          get: function (t) {
            return e[t];
          },
          hasKey: function (t) {
            return !!e[t];
          },
          keys: function () {
            return Object.keys(e);
          },
          put: function (t, n) {
            (e[t] || (e[t] = []), e[t].push(n));
          },
          remove: function (t, n) {
            var o = e[t];
            if (o) {
              var i = o.indexOf(n);
              (-1 !== i && o.splice(i, 1), o.length || delete e[t]);
            }
          },
        };
      },
    };
  }),
  angular
    .module('ui.bootstrap.dropdown', ['ui.bootstrap.multiMap', 'ui.bootstrap.position'])
    .constant('uibDropdownConfig', { appendToOpenClass: 'uib-dropdown-open', openClass: 'open' })
    .service('uibDropdownService', [
      '$document',
      '$rootScope',
      '$$multiMap',
      function (e, t, n) {
        var o = null,
          i = n.createNew();
        ((this.isOnlyOpen = function (e, t) {
          var n = i.get(t);
          return (
            !(
              !n ||
              !n.reduce(function (t, n) {
                return n.scope === e ? n : t;
              }, {})
            ) && 1 === n.length
          );
        }),
          (this.open = function (t, n, r) {
            if ((o || e.on('click', a), o && o !== t && (o.isOpen = !1), (o = t), r)) {
              var l = i.get(r);
              l
                ? -1 ===
                    l
                      .map(function (e) {
                        return e.scope;
                      })
                      .indexOf(t) && i.put(r, { scope: t })
                : i.put(r, { scope: t });
            }
          }),
          (this.close = function (t, n, r) {
            if (
              (o === t && (e.off('click', a), e.off('keydown', this.keybindFilter), (o = null)), r)
            ) {
              var l = i.get(r);
              if (l) {
                var s = l.reduce(function (e, n) {
                  return n.scope === t ? n : e;
                }, {});
                s && i.remove(r, s);
              }
            }
          }));
        var a = function (e) {
          if (o && o.isOpen && !((e && 'disabled' === o.getAutoClose()) || (e && 3 === e.which))) {
            var n = o.getToggleElement();
            if (!(e && n && n[0].contains(e.target))) {
              var i = o.getDropdownElement();
              (e && 'outsideClick' === o.getAutoClose() && i && i[0].contains(e.target)) ||
                (o.focusToggleElement(), (o.isOpen = !1), t.$$phase || o.$apply());
            }
          }
        };
        this.keybindFilter = function (e) {
          if (o) {
            var t = o.getDropdownElement(),
              n = o.getToggleElement(),
              i = t && t[0].contains(e.target),
              r = n && n[0].contains(e.target);
            27 === e.which
              ? (e.stopPropagation(), o.focusToggleElement(), a())
              : o.isKeynavEnabled() &&
                -1 !== [38, 40].indexOf(e.which) &&
                o.isOpen &&
                (i || r) &&
                (e.preventDefault(), e.stopPropagation(), o.focusDropdownEntry(e.which));
          }
        };
      },
    ])
    .controller('UibDropdownController', [
      '$scope',
      '$element',
      '$attrs',
      '$parse',
      'uibDropdownConfig',
      'uibDropdownService',
      '$animate',
      '$uibPosition',
      '$document',
      '$compile',
      '$templateRequest',
      function (e, t, n, o, i, a, r, l, s, u, p) {
        var c,
          d,
          f = this,
          m = e.$new(),
          h = i.appendToOpenClass,
          g = i.openClass,
          b = angular.noop,
          v = n.onToggle ? o(n.onToggle) : angular.noop,
          $ = !1,
          w = s.find('body');
        function y() {
          t.append(f.dropdownMenu);
        }
        (t.addClass('dropdown'),
          (this.init = function () {
            (n.isOpen &&
              ((d = o(n.isOpen)),
              (b = d.assign),
              e.$watch(d, function (e) {
                m.isOpen = !!e;
              })),
              ($ = angular.isDefined(n.keyboardNav)));
          }),
          (this.toggle = function (e) {
            return (
              (m.isOpen = arguments.length ? !!e : !m.isOpen),
              angular.isFunction(b) && b(m, m.isOpen),
              m.isOpen
            );
          }),
          (this.isOpen = function () {
            return m.isOpen;
          }),
          (m.getToggleElement = function () {
            return f.toggleElement;
          }),
          (m.getAutoClose = function () {
            return n.autoClose || 'always';
          }),
          (m.getElement = function () {
            return t;
          }),
          (m.isKeynavEnabled = function () {
            return $;
          }),
          (m.focusDropdownEntry = function (e) {
            var n = f.dropdownMenu
              ? angular.element(f.dropdownMenu).find('a')
              : t.find('ul').eq(0).find('a');
            switch (e) {
              case 40:
                angular.isNumber(f.selectedOption)
                  ? (f.selectedOption =
                      f.selectedOption === n.length - 1 ? f.selectedOption : f.selectedOption + 1)
                  : (f.selectedOption = 0);
                break;
              case 38:
                angular.isNumber(f.selectedOption)
                  ? (f.selectedOption = 0 === f.selectedOption ? 0 : f.selectedOption - 1)
                  : (f.selectedOption = n.length - 1);
            }
            n[f.selectedOption].focus();
          }),
          (m.getDropdownElement = function () {
            return f.dropdownMenu;
          }),
          (m.focusToggleElement = function () {
            f.toggleElement && f.toggleElement[0].focus();
          }),
          m.$watch('isOpen', function (i, d) {
            var $ = null,
              D = !1;
            if (angular.isDefined(n.dropdownAppendTo)) {
              var k = o(n.dropdownAppendTo)(m);
              k && ($ = angular.element(k));
            }
            if (
              (angular.isDefined(n.dropdownAppendToBody) &&
                !1 !== o(n.dropdownAppendToBody)(m) &&
                (D = !0),
              D && !$ && ($ = w),
              $ &&
                f.dropdownMenu &&
                (i ? ($.append(f.dropdownMenu), t.on('$destroy', y)) : (t.off('$destroy', y), y())),
              $ && f.dropdownMenu)
            ) {
              var C,
                T,
                x,
                M = l.positionElements(t, f.dropdownMenu, 'bottom-left', !0),
                O = 0;
              if (
                ((C = { top: M.top + 'px', display: i ? 'block' : 'none' }),
                (T = f.dropdownMenu.hasClass('dropdown-menu-right'))
                  ? ((C.left = 'auto'),
                    (x = l.scrollbarPadding($)).heightOverflow &&
                      x.scrollbarWidth &&
                      (O = x.scrollbarWidth),
                    (C.right = window.innerWidth - O - (M.left + t.prop('offsetWidth')) + 'px'))
                  : ((C.left = M.left + 'px'), (C.right = 'auto')),
                !D)
              ) {
                var E = l.offset($);
                ((C.top = M.top - E.top + 'px'),
                  T
                    ? (C.right =
                        window.innerWidth - (M.left - E.left + t.prop('offsetWidth')) + 'px')
                    : (C.left = M.left - E.left + 'px'));
              }
              f.dropdownMenu.css(C);
            }
            var P = $ || t,
              S = $ ? h : g,
              A = P.hasClass(S),
              I = a.isOnlyOpen(e, $);
            if (
              (A === !i &&
                r[$ ? (I ? 'removeClass' : 'addClass') : i ? 'addClass' : 'removeClass'](P, S).then(
                  function () {
                    angular.isDefined(i) && i !== d && v(e, { open: !!i });
                  }
                ),
              i)
            )
              (f.dropdownMenuTemplateUrl
                ? p(f.dropdownMenuTemplateUrl).then(function (e) {
                    ((c = m.$new()),
                      u(e.trim())(c, function (e) {
                        var t = e;
                        (f.dropdownMenu.replaceWith(t),
                          (f.dropdownMenu = t),
                          s.on('keydown', a.keybindFilter));
                      }));
                  })
                : s.on('keydown', a.keybindFilter),
                m.focusToggleElement(),
                a.open(m, t, $));
            else {
              if ((a.close(m, t, $), f.dropdownMenuTemplateUrl)) {
                c && c.$destroy();
                var U = angular.element('<ul class="dropdown-menu"></ul>');
                (f.dropdownMenu.replaceWith(U), (f.dropdownMenu = U));
              }
              f.selectedOption = null;
            }
            angular.isFunction(b) && b(e, i);
          }));
      },
    ])
    .directive('uibDropdown', function () {
      return {
        controller: 'UibDropdownController',
        link: function (e, t, n, o) {
          o.init();
        },
      };
    })
    .directive('uibDropdownMenu', function () {
      return {
        restrict: 'A',
        require: '?^uibDropdown',
        link: function (e, t, n, o) {
          if (o && !angular.isDefined(n.dropdownNested)) {
            t.addClass('dropdown-menu');
            var i = n.templateUrl;
            (i && (o.dropdownMenuTemplateUrl = i), o.dropdownMenu || (o.dropdownMenu = t));
          }
        },
      };
    })
    .directive('uibDropdownToggle', function () {
      return {
        require: '?^uibDropdown',
        link: function (e, t, n, o) {
          if (o) {
            (t.addClass('dropdown-toggle'), (o.toggleElement = t));
            var i = function (i) {
              (i.preventDefault(),
                t.hasClass('disabled') ||
                  n.disabled ||
                  e.$apply(function () {
                    o.toggle();
                  }));
            };
            (t.on('click', i),
              t.attr({ 'aria-haspopup': !0, 'aria-expanded': !1 }),
              e.$watch(o.isOpen, function (e) {
                t.attr('aria-expanded', !!e);
              }),
              e.$on('$destroy', function () {
                t.off('click', i);
              }));
          }
        },
      };
    }),
  angular.module('ui.bootstrap.stackedMap', []).factory('$$stackedMap', function () {
    return {
      createNew: function () {
        var e = [];
        return {
          add: function (t, n) {
            e.push({ key: t, value: n });
          },
          get: function (t) {
            for (var n = 0; n < e.length; n++) if (t === e[n].key) return e[n];
          },
          keys: function () {
            for (var t = [], n = 0; n < e.length; n++) t.push(e[n].key);
            return t;
          },
          top: function () {
            return e[e.length - 1];
          },
          remove: function (t) {
            for (var n = -1, o = 0; o < e.length; o++)
              if (t === e[o].key) {
                n = o;
                break;
              }
            return e.splice(n, 1)[0];
          },
          removeTop: function () {
            return e.pop();
          },
          length: function () {
            return e.length;
          },
        };
      },
    };
  }),
  angular
    .module('ui.bootstrap.modal', [
      'ui.bootstrap.multiMap',
      'ui.bootstrap.stackedMap',
      'ui.bootstrap.position',
    ])
    .provider('$uibResolve', function () {
      var e = this;
      ((this.resolver = null),
        (this.setResolver = function (e) {
          this.resolver = e;
        }),
        (this.$get = [
          '$injector',
          '$q',
          function (t, n) {
            var o = e.resolver ? t.get(e.resolver) : null;
            return {
              resolve: function (e, i, a, r) {
                if (o) return o.resolve(e, i, a, r);
                var l = [];
                return (
                  angular.forEach(e, function (e) {
                    angular.isFunction(e) || angular.isArray(e)
                      ? l.push(n.resolve(t.invoke(e)))
                      : angular.isString(e)
                        ? l.push(n.resolve(t.get(e)))
                        : l.push(n.resolve(e));
                  }),
                  n.all(l).then(function (t) {
                    var n = {},
                      o = 0;
                    return (
                      angular.forEach(e, function (e, i) {
                        n[i] = t[o++];
                      }),
                      n
                    );
                  })
                );
              },
            };
          },
        ]));
    })
    .directive('uibModalBackdrop', [
      '$animate',
      '$injector',
      '$uibModalStack',
      function (e, t, n) {
        return {
          restrict: 'A',
          compile: function (e, t) {
            return (e.addClass(t.backdropClass), o);
          },
        };
        function o(t, o, i) {
          i.modalInClass &&
            (e.addClass(o, i.modalInClass),
            t.$on(n.NOW_CLOSING_EVENT, function (n, a) {
              var r = a();
              t.modalOptions.animation ? e.removeClass(o, i.modalInClass).then(r) : r();
            }));
        }
      },
    ])
    .directive('uibModalWindow', [
      '$uibModalStack',
      '$q',
      '$animateCss',
      '$document',
      function (e, t, n, o) {
        return {
          scope: { index: '@' },
          restrict: 'A',
          transclude: !0,
          templateUrl: function (e, t) {
            return t.templateUrl || 'uib/template/modal/window.html';
          },
          link: function (i, a, r) {
            (a.addClass(r.windowTopClass || ''),
              (i.size = r.size),
              (i.close = function (t) {
                var n = e.getTop();
                n &&
                  n.value.backdrop &&
                  'static' !== n.value.backdrop &&
                  t.target === t.currentTarget &&
                  (t.preventDefault(), t.stopPropagation(), e.dismiss(n.key, 'backdrop click'));
              }),
              a.on('click', i.close),
              (i.$isRendered = !0));
            var l = t.defer();
            (i.$$postDigest(function () {
              l.resolve();
            }),
              l.promise.then(function () {
                var l = null;
                (r.modalInClass &&
                  ((l = n(a, { addClass: r.modalInClass }).start()),
                  i.$on(e.NOW_CLOSING_EVENT, function (e, t) {
                    var o = t();
                    n(a, { removeClass: r.modalInClass }).start().then(o);
                  })),
                  t.when(l).then(function () {
                    var t = e.getTop();
                    if (
                      (t && e.modalRendered(t.key),
                      !o[0].activeElement || !a[0].contains(o[0].activeElement))
                    ) {
                      var n = a[0].querySelector('[autofocus]');
                      n ? n.focus() : a[0].focus();
                    }
                  }));
              }));
          },
        };
      },
    ])
    .directive('uibModalAnimationClass', function () {
      return {
        compile: function (e, t) {
          t.modalAnimation && e.addClass(t.uibModalAnimationClass);
        },
      };
    })
    .directive('uibModalTransclude', [
      '$animate',
      function (e) {
        return {
          link: function (t, n, o, i, a) {
            a(t.$parent, function (t) {
              (n.empty(), e.enter(t, n));
            });
          },
        };
      },
    ])
    .factory('$uibModalStack', [
      '$animate',
      '$animateCss',
      '$document',
      '$compile',
      '$rootScope',
      '$q',
      '$$multiMap',
      '$$stackedMap',
      '$uibPosition',
      function (e, t, n, o, i, a, r, l, s) {
        var u,
          p,
          c,
          d = 'modal-open',
          f = l.createNew(),
          m = r.createNew(),
          h = { NOW_CLOSING_EVENT: 'modal.stack.now-closing' },
          g = 0,
          b = null,
          v = 'data-bootstrap-modal-aria-hidden-count',
          $ = /[A-Z]/g;
        function w() {
          for (var e = -1, t = f.keys(), n = 0; n < t.length; n++)
            f.get(t[n]).value.backdrop && (e = n);
          return (e > -1 && e < g && (e = g), e);
        }
        function y(e, t) {
          var n = f.get(e).value,
            o = n.appendTo;
          (f.remove(e),
            (b = f.top()) && (g = parseInt(b.value.modalDomEl.attr('index'), 10)),
            k(
              n.modalDomEl,
              n.modalScope,
              function () {
                var t = n.openedClass || d;
                m.remove(t, e);
                var i = m.hasKey(t);
                (o.toggleClass(t, i),
                  !i &&
                    c &&
                    c.heightOverflow &&
                    c.scrollbarWidth &&
                    (c.originalRight
                      ? o.css({ paddingRight: c.originalRight + 'px' })
                      : o.css({ paddingRight: '' }),
                    (c = null)),
                  D(!0));
              },
              n.closedDeferred
            ),
            u && -1 === w() && (k(u, p, function () {}), (u = void 0), (p = void 0)),
            t && t.focus ? t.focus() : o.focus && o.focus());
        }
        function D(e) {
          var t;
          f.length() > 0 && (t = f.top().value).modalDomEl.toggleClass(t.windowTopClass || '', e);
        }
        function k(t, n, o, i) {
          var r,
            l = null;
          return (
            n.$broadcast(h.NOW_CLOSING_EVENT, function () {
              return (
                r || ((r = a.defer()), (l = r.promise)),
                function () {
                  r.resolve();
                }
              );
            }),
            a.when(l).then(function a() {
              a.done ||
                ((a.done = !0),
                e.leave(t).then(function () {
                  (o && o(), t.remove(), i && i.resolve());
                }),
                n.$destroy());
            })
          );
        }
        function C(e) {
          if (e.isDefaultPrevented()) return e;
          var t = f.top();
          if (t)
            switch (e.which) {
              case 27:
                t.value.keyboard &&
                  (e.preventDefault(),
                  i.$apply(function () {
                    h.dismiss(t.key, 'escape key press');
                  }));
                break;
              case 9:
                var n = h.loadFocusElementList(t),
                  o = !1;
                (e.shiftKey
                  ? (h.isFocusInFirstItem(e, n) || h.isModalFocused(e, t)) &&
                    (o = h.focusLastFocusableElement(n))
                  : h.isFocusInLastItem(e, n) && (o = h.focusFirstFocusableElement(n)),
                  o && (e.preventDefault(), e.stopPropagation()));
            }
        }
        function T(e, t, n) {
          return !e.value.modalScope.$broadcast('modal.closing', t, n).defaultPrevented;
        }
        function x() {
          Array.prototype.forEach.call(document.querySelectorAll('[' + v + ']'), function (e) {
            var t = parseInt(e.getAttribute(v), 10) - 1;
            (e.setAttribute(v, t), t || (e.removeAttribute(v), e.removeAttribute('aria-hidden')));
          });
        }
        return (
          i.$watch(w, function (e) {
            p && (p.index = e);
          }),
          n.on('keydown', C),
          i.$on('$destroy', function () {
            n.off('keydown', C);
          }),
          (h.open = function (t, a) {
            var r = n[0].activeElement,
              l = a.openedClass || d;
            (D(!1),
              (b = f.top()),
              f.add(t, {
                deferred: a.deferred,
                renderDeferred: a.renderDeferred,
                closedDeferred: a.closedDeferred,
                modalScope: a.scope,
                backdrop: a.backdrop,
                keyboard: a.keyboard,
                openedClass: a.openedClass,
                windowTopClass: a.windowTopClass,
                animation: a.animation,
                appendTo: a.appendTo,
              }),
              m.put(l, t));
            var h,
              y = a.appendTo,
              k = w();
            (k >= 0 &&
              !u &&
              (((p = i.$new(!0)).modalOptions = a),
              (p.index = k),
              (u = angular.element('<div uib-modal-backdrop="modal-backdrop"></div>')).attr({
                class: 'modal-backdrop',
                'ng-style': "{'z-index': 1040 + (index && 1 || 0) + index*10}",
                'uib-modal-animation-class': 'fade',
                'modal-in-class': 'in',
              }),
              a.backdropClass && u.addClass(a.backdropClass),
              a.animation && u.attr('modal-animation', 'true'),
              o(u)(p),
              e.enter(u, y),
              s.isScrollable(y) &&
                (c = s.scrollbarPadding(y)).heightOverflow &&
                c.scrollbarWidth &&
                y.css({ paddingRight: c.right + 'px' })),
              a.component
                ? ((h = document.createElement(
                    a.component.name.replace($, function (e, t) {
                      return (t ? '-' : '') + e.toLowerCase();
                    })
                  )),
                  (h = angular.element(h)).attr({
                    resolve: '$resolve',
                    'modal-instance': '$uibModalInstance',
                    close: '$close($value)',
                    dismiss: '$dismiss($value)',
                  }))
                : (h = a.content),
              (g = b ? parseInt(b.value.modalDomEl.attr('index'), 10) + 1 : 0));
            var C = angular.element('<div uib-modal-window="modal-window"></div>');
            (C.attr({
              class: 'modal',
              'template-url': a.windowTemplateUrl,
              'window-top-class': a.windowTopClass,
              role: 'dialog',
              'aria-labelledby': a.ariaLabelledBy,
              'aria-describedby': a.ariaDescribedBy,
              size: a.size,
              index: g,
              animate: 'animate',
              'ng-style': "{'z-index': 1050 + $$topModalIndex*10, display: 'block'}",
              tabindex: -1,
              'uib-modal-animation-class': 'fade',
              'modal-in-class': 'in',
            }).append(h),
              a.windowClass && C.addClass(a.windowClass),
              a.animation && C.attr('modal-animation', 'true'),
              y.addClass(l),
              a.scope && (a.scope.$$topModalIndex = g),
              e.enter(o(C)(a.scope), y),
              (f.top().value.modalDomEl = C),
              (f.top().value.modalOpener = r),
              (function e(t) {
                if (t && 'BODY' !== t[0].tagName)
                  return (
                    (function (e) {
                      var t = e.parent() ? e.parent().children() : [];
                      return Array.prototype.filter.call(t, function (t) {
                        return t !== e[0];
                      });
                    })(t).forEach(function (e) {
                      var t = 'true' === e.getAttribute('aria-hidden'),
                        n = parseInt(e.getAttribute(v), 10);
                      (n || (n = t ? 1 : 0),
                        e.setAttribute(v, n + 1),
                        e.setAttribute('aria-hidden', 'true'));
                    }),
                    e(t.parent())
                  );
              })(C));
          }),
          (h.close = function (e, t) {
            var n = f.get(e);
            return (
              x(),
              n && T(n, t, !0)
                ? ((n.value.modalScope.$$uibDestructionScheduled = !0),
                  n.value.deferred.resolve(t),
                  y(e, n.value.modalOpener),
                  !0)
                : !n
            );
          }),
          (h.dismiss = function (e, t) {
            var n = f.get(e);
            return (
              x(),
              n && T(n, t, !1)
                ? ((n.value.modalScope.$$uibDestructionScheduled = !0),
                  n.value.deferred.reject(t),
                  y(e, n.value.modalOpener),
                  !0)
                : !n
            );
          }),
          (h.dismissAll = function (e) {
            for (var t = this.getTop(); t && this.dismiss(t.key, e); ) t = this.getTop();
          }),
          (h.getTop = function () {
            return f.top();
          }),
          (h.modalRendered = function (e) {
            var t = f.get(e);
            t && t.value.renderDeferred.resolve();
          }),
          (h.focusFirstFocusableElement = function (e) {
            return e.length > 0 && (e[0].focus(), !0);
          }),
          (h.focusLastFocusableElement = function (e) {
            return e.length > 0 && (e[e.length - 1].focus(), !0);
          }),
          (h.isModalFocused = function (e, t) {
            if (e && t) {
              var n = t.value.modalDomEl;
              if (n && n.length) return (e.target || e.srcElement) === n[0];
            }
            return !1;
          }),
          (h.isFocusInFirstItem = function (e, t) {
            return t.length > 0 && (e.target || e.srcElement) === t[0];
          }),
          (h.isFocusInLastItem = function (e, t) {
            return t.length > 0 && (e.target || e.srcElement) === t[t.length - 1];
          }),
          (h.loadFocusElementList = function (e) {
            if (e) {
              var t = e.value.modalDomEl;
              if (t && t.length) {
                var n = t[0].querySelectorAll(
                  "a[href], area[href], input:not([disabled]):not([tabindex='-1']), button:not([disabled]):not([tabindex='-1']),select:not([disabled]):not([tabindex='-1']), textarea:not([disabled]):not([tabindex='-1']), iframe, object, embed, *[tabindex]:not([tabindex='-1']), *[contenteditable=true]"
                );
                return n
                  ? Array.prototype.filter.call(n, function (e) {
                      return (function (e) {
                        return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
                      })(e);
                    })
                  : n;
              }
            }
          }),
          h
        );
      },
    ])
    .provider('$uibModal', function () {
      var e = {
        options: { animation: !0, backdrop: !0, keyboard: !0 },
        $get: [
          '$rootScope',
          '$q',
          '$document',
          '$templateRequest',
          '$controller',
          '$uibResolve',
          '$uibModalStack',
          function (t, n, o, i, a, r, l) {
            var s = {},
              u = null;
            return (
              (s.getPromiseChain = function () {
                return u;
              }),
              (s.open = function (s) {
                var p,
                  c,
                  d,
                  f = n.defer(),
                  m = n.defer(),
                  h = n.defer(),
                  g = n.defer(),
                  b = {
                    result: f.promise,
                    opened: m.promise,
                    closed: h.promise,
                    rendered: g.promise,
                    close: function (e) {
                      return l.close(b, e);
                    },
                    dismiss: function (e) {
                      return l.dismiss(b, e);
                    },
                  };
                if (
                  (((s = angular.extend({}, e.options, s)).resolve = s.resolve || {}),
                  (s.appendTo = s.appendTo || o.find('body').eq(0)),
                  !s.appendTo.length)
                )
                  throw new Error(
                    'appendTo element not found. Make sure that the element passed is in DOM.'
                  );
                if (!s.component && !s.template && !s.templateUrl)
                  throw new Error(
                    'One of component or template or templateUrl options is required.'
                  );
                function v() {
                  return p;
                }
                return (
                  (p = s.component
                    ? n.when(r.resolve(s.resolve, {}, null, null))
                    : n.all([
                        ((c = s),
                        c.template
                          ? n.when(c.template)
                          : i(angular.isFunction(c.templateUrl) ? c.templateUrl() : c.templateUrl)),
                        r.resolve(s.resolve, {}, null, null),
                      ])),
                  (d = u =
                    n
                      .all([u])
                      .then(v, v)
                      .then(
                        function (e) {
                          var n = s.scope || t,
                            o = n.$new();
                          ((o.$close = b.close),
                            (o.$dismiss = b.dismiss),
                            o.$on('$destroy', function () {
                              o.$$uibDestructionScheduled ||
                                o.$dismiss('$uibUnscheduledDestruction');
                            }));
                          var i,
                            r,
                            u = {
                              scope: o,
                              deferred: f,
                              renderDeferred: g,
                              closedDeferred: h,
                              animation: s.animation,
                              backdrop: s.backdrop,
                              keyboard: s.keyboard,
                              backdropClass: s.backdropClass,
                              windowTopClass: s.windowTopClass,
                              windowClass: s.windowClass,
                              windowTemplateUrl: s.windowTemplateUrl,
                              ariaLabelledBy: s.ariaLabelledBy,
                              ariaDescribedBy: s.ariaDescribedBy,
                              size: s.size,
                              openedClass: s.openedClass,
                              appendTo: s.appendTo,
                            },
                            p = {},
                            c = {};
                          function d(t, n, i, a) {
                            ((t.$scope = o),
                              (t.$scope.$resolve = {}),
                              i ? (t.$scope.$uibModalInstance = b) : (t.$uibModalInstance = b));
                            var r = n ? e[1] : e;
                            angular.forEach(r, function (e, n) {
                              (a && (t[n] = e), (t.$scope.$resolve[n] = e));
                            });
                          }
                          (s.component
                            ? (d(p, !1, !0, !1), (p.name = s.component), (u.component = p))
                            : s.controller &&
                              (d(c, !0, !1, !0),
                              (r = a(s.controller, c, !0, s.controllerAs)),
                              s.controllerAs &&
                                s.bindToController &&
                                (((i = r.instance).$close = o.$close),
                                (i.$dismiss = o.$dismiss),
                                angular.extend(i, { $resolve: c.$scope.$resolve }, n)),
                              (i = r()),
                              angular.isFunction(i.$onInit) && i.$onInit()),
                            s.component || (u.content = e[0]),
                            l.open(b, u),
                            m.resolve(!0));
                        },
                        function (e) {
                          (m.reject(e), f.reject(e));
                        }
                      )
                      .finally(function () {
                        u === d && (u = null);
                      })),
                  b
                );
              }),
              s
            );
          },
        ],
      };
      return e;
    }),
  angular.module('ui.bootstrap.paging', []).factory('uibPaging', [
    '$parse',
    function (e) {
      return {
        create: function (t, n, o) {
          ((t.setNumPages = o.numPages ? e(o.numPages).assign : angular.noop),
            (t.ngModelCtrl = { $setViewValue: angular.noop }),
            (t._watchers = []),
            (t.init = function (e, i) {
              ((t.ngModelCtrl = e),
                (t.config = i),
                (e.$render = function () {
                  t.render();
                }),
                o.itemsPerPage
                  ? t._watchers.push(
                      n.$parent.$watch(o.itemsPerPage, function (e) {
                        ((t.itemsPerPage = parseInt(e, 10)),
                          (n.totalPages = t.calculateTotalPages()),
                          t.updatePage());
                      })
                    )
                  : (t.itemsPerPage = i.itemsPerPage),
                n.$watch('totalItems', function (e, o) {
                  (angular.isDefined(e) || e !== o) &&
                    ((n.totalPages = t.calculateTotalPages()), t.updatePage());
                }));
            }),
            (t.calculateTotalPages = function () {
              var e = t.itemsPerPage < 1 ? 1 : Math.ceil(n.totalItems / t.itemsPerPage);
              return Math.max(e || 0, 1);
            }),
            (t.render = function () {
              n.page = parseInt(t.ngModelCtrl.$viewValue, 10) || 1;
            }),
            (n.selectPage = function (e, o) {
              (o && o.preventDefault(),
                (!n.ngDisabled || !o) &&
                  n.page !== e &&
                  e > 0 &&
                  e <= n.totalPages &&
                  (o && o.target && o.target.blur(),
                  t.ngModelCtrl.$setViewValue(e),
                  t.ngModelCtrl.$render()));
            }),
            (n.getText = function (e) {
              return n[e + 'Text'] || t.config[e + 'Text'];
            }),
            (n.noPrevious = function () {
              return 1 === n.page;
            }),
            (n.noNext = function () {
              return n.page === n.totalPages;
            }),
            (t.updatePage = function () {
              (t.setNumPages(n.$parent, n.totalPages),
                n.page > n.totalPages ? n.selectPage(n.totalPages) : t.ngModelCtrl.$render());
            }),
            n.$on('$destroy', function () {
              for (; t._watchers.length; ) t._watchers.shift()();
            }));
        },
      };
    },
  ]),
  angular
    .module('ui.bootstrap.pager', ['ui.bootstrap.paging', 'ui.bootstrap.tabindex'])
    .controller('UibPagerController', [
      '$scope',
      '$attrs',
      'uibPaging',
      'uibPagerConfig',
      function (e, t, n, o) {
        ((e.align = angular.isDefined(t.align) ? e.$parent.$eval(t.align) : o.align),
          n.create(this, e, t));
      },
    ])
    .constant('uibPagerConfig', {
      itemsPerPage: 10,
      previousText: '« Previous',
      nextText: 'Next »',
      align: !0,
    })
    .directive('uibPager', [
      'uibPagerConfig',
      function (e) {
        return {
          scope: { totalItems: '=', previousText: '@', nextText: '@', ngDisabled: '=' },
          require: ['uibPager', '?ngModel'],
          restrict: 'A',
          controller: 'UibPagerController',
          controllerAs: 'pager',
          templateUrl: function (e, t) {
            return t.templateUrl || 'uib/template/pager/pager.html';
          },
          link: function (t, n, o, i) {
            n.addClass('pager');
            var a = i[0],
              r = i[1];
            r && a.init(r, e);
          },
        };
      },
    ]),
  angular
    .module('ui.bootstrap.pagination', ['ui.bootstrap.paging', 'ui.bootstrap.tabindex'])
    .controller('UibPaginationController', [
      '$scope',
      '$attrs',
      '$parse',
      'uibPaging',
      'uibPaginationConfig',
      function (e, t, n, o, i) {
        var a = this,
          r = angular.isDefined(t.maxSize) ? e.$parent.$eval(t.maxSize) : i.maxSize,
          l = angular.isDefined(t.rotate) ? e.$parent.$eval(t.rotate) : i.rotate,
          s = angular.isDefined(t.forceEllipses)
            ? e.$parent.$eval(t.forceEllipses)
            : i.forceEllipses,
          u = angular.isDefined(t.boundaryLinkNumbers)
            ? e.$parent.$eval(t.boundaryLinkNumbers)
            : i.boundaryLinkNumbers,
          p = angular.isDefined(t.pageLabel)
            ? function (n) {
                return e.$parent.$eval(t.pageLabel, { $page: n });
              }
            : angular.identity;
        function c(e, t, n) {
          return { number: e, text: t, active: n };
        }
        ((e.boundaryLinks = angular.isDefined(t.boundaryLinks)
          ? e.$parent.$eval(t.boundaryLinks)
          : i.boundaryLinks),
          (e.directionLinks = angular.isDefined(t.directionLinks)
            ? e.$parent.$eval(t.directionLinks)
            : i.directionLinks),
          t.$set('role', 'menu'),
          o.create(this, e, t),
          t.maxSize &&
            a._watchers.push(
              e.$parent.$watch(n(t.maxSize), function (e) {
                ((r = parseInt(e, 10)), a.render());
              })
            ));
        var d = this.render;
        this.render = function () {
          (d(),
            e.page > 0 &&
              e.page <= e.totalPages &&
              (e.pages = (function (e, t) {
                var n = [],
                  o = 1,
                  i = t,
                  a = angular.isDefined(r) && r < t;
                a &&
                  (l
                    ? (i = (o = Math.max(e - Math.floor(r / 2), 1)) + r - 1) > t &&
                      (o = (i = t) - r + 1)
                    : ((o = (Math.ceil(e / r) - 1) * r + 1), (i = Math.min(o + r - 1, t))));
                for (var d = o; d <= i; d++) {
                  var f = c(d, p(d), d === e);
                  n.push(f);
                }
                if (a && r > 0 && (!l || s || u)) {
                  if (o > 1) {
                    if (!u || o > 3) {
                      var m = c(o - 1, '...', !1);
                      n.unshift(m);
                    }
                    if (u) {
                      if (3 === o) {
                        var h = c(2, '2', !1);
                        n.unshift(h);
                      }
                      var g = c(1, '1', !1);
                      n.unshift(g);
                    }
                  }
                  if (i < t) {
                    if (!u || i < t - 2) {
                      var b = c(i + 1, '...', !1);
                      n.push(b);
                    }
                    if (u) {
                      if (i === t - 2) {
                        var v = c(t - 1, t - 1, !1);
                        n.push(v);
                      }
                      var $ = c(t, t, !1);
                      n.push($);
                    }
                  }
                }
                return n;
              })(e.page, e.totalPages)));
        };
      },
    ])
    .constant('uibPaginationConfig', {
      itemsPerPage: 10,
      boundaryLinks: !1,
      boundaryLinkNumbers: !1,
      directionLinks: !0,
      firstText: 'First',
      previousText: 'Previous',
      nextText: 'Next',
      lastText: 'Last',
      rotate: !0,
      forceEllipses: !1,
    })
    .directive('uibPagination', [
      '$parse',
      'uibPaginationConfig',
      function (e, t) {
        return {
          scope: {
            totalItems: '=',
            firstText: '@',
            previousText: '@',
            nextText: '@',
            lastText: '@',
            ngDisabled: '=',
          },
          require: ['uibPagination', '?ngModel'],
          restrict: 'A',
          controller: 'UibPaginationController',
          controllerAs: 'pagination',
          templateUrl: function (e, t) {
            return t.templateUrl || 'uib/template/pagination/pagination.html';
          },
          link: function (e, n, o, i) {
            n.addClass('pagination');
            var a = i[0],
              r = i[1];
            r && a.init(r, t);
          },
        };
      },
    ]),
  angular
    .module('ui.bootstrap.tooltip', ['ui.bootstrap.position', 'ui.bootstrap.stackedMap'])
    .provider('$uibTooltip', function () {
      var e = {
          placement: 'top',
          placementClassPrefix: '',
          animation: !0,
          popupDelay: 0,
          popupCloseDelay: 0,
          useContentExp: !1,
        },
        t = {
          mouseenter: 'mouseleave',
          click: 'click',
          outsideClick: 'outsideClick',
          focus: 'blur',
          none: '',
        },
        n = {};
      ((this.options = function (e) {
        angular.extend(n, e);
      }),
        (this.setTriggers = function (e) {
          angular.extend(t, e);
        }),
        (this.$get = [
          '$window',
          '$compile',
          '$timeout',
          '$document',
          '$uibPosition',
          '$interpolate',
          '$rootScope',
          '$parse',
          '$$stackedMap',
          function (o, i, a, r, l, s, u, p, c) {
            var d = c.createNew();
            function f(e) {
              if (27 === e.which) {
                var t = d.top();
                t && (t.value.close(), (t = null));
              }
            }
            return (
              r.on('keyup', f),
              u.$on('$destroy', function () {
                r.off('keyup', f);
              }),
              function (o, u, c, f) {
                function m(e) {
                  var n = (e || f.trigger || c).split(' '),
                    o = n.map(function (e) {
                      return t[e] || e;
                    });
                  return { show: n, hide: o };
                }
                f = angular.extend({}, e, n, f);
                var h = o.replace(/[A-Z]/g, function (e, t) {
                    return (t ? '-' : '') + e.toLowerCase();
                  }),
                  g = s.startSymbol(),
                  b = s.endSymbol(),
                  v =
                    '<div ' +
                    h +
                    '-popup uib-title="' +
                    g +
                    'title' +
                    b +
                    '" ' +
                    (f.useContentExp
                      ? 'content-exp="contentExp()" '
                      : 'content="' + g + 'content' + b + '" ') +
                    'origin-scope="origScope" class="uib-position-measure ' +
                    u +
                    '" tooltip-animation-class="fade"uib-tooltip-classes ng-class="{ in: isOpen }" ></div>';
                return {
                  compile: function (e, t) {
                    var n = i(v);
                    return function (e, t, i, s) {
                      var c,
                        h,
                        g,
                        b,
                        v,
                        $,
                        w,
                        y,
                        D = !!angular.isDefined(f.appendToBody) && f.appendToBody,
                        k = m(void 0),
                        C = angular.isDefined(i[u + 'Enable']),
                        T = e.$new(!0),
                        x = !1,
                        M = !!angular.isDefined(i[u + 'IsOpen']) && p(i[u + 'IsOpen']),
                        O = !!f.useContentExp && p(i[o]),
                        E = [],
                        P = function () {
                          c &&
                            c.html() &&
                            ($ ||
                              ($ = a(
                                function () {
                                  var e = l.positionElements(t, c, T.placement, D),
                                    n = angular.isDefined(c.offsetHeight)
                                      ? c.offsetHeight
                                      : c.prop('offsetHeight'),
                                    o = D ? l.offset(t) : l.position(t);
                                  c.css({ top: e.top + 'px', left: e.left + 'px' });
                                  var i = e.placement.split('-');
                                  (c.hasClass(i[0]) ||
                                    (c.removeClass(y.split('-')[0]), c.addClass(i[0])),
                                    c.hasClass(f.placementClassPrefix + e.placement) ||
                                      (c.removeClass(f.placementClassPrefix + y),
                                      c.addClass(f.placementClassPrefix + e.placement)),
                                    (w = a(
                                      function () {
                                        var e = angular.isDefined(c.offsetHeight)
                                            ? c.offsetHeight
                                            : c.prop('offsetHeight'),
                                          t = l.adjustTop(i, o, n, e);
                                        (t && c.css(t), (w = null));
                                      },
                                      0,
                                      !1
                                    )),
                                    c.hasClass('uib-position-measure')
                                      ? (l.positionArrow(c, e.placement),
                                        c.removeClass('uib-position-measure'))
                                      : y !== e.placement && l.positionArrow(c, e.placement),
                                    (y = e.placement),
                                    ($ = null));
                                },
                                0,
                                !1
                              )));
                        };
                      function S() {
                        T.isOpen ? I() : A();
                      }
                      function A() {
                        (C && !e.$eval(i[u + 'Enable'])) ||
                          (H(),
                          (function () {
                            ((T.title = i[u + 'Title']),
                              (T.content = O ? O(e) : i[o]),
                              (T.popupClass = i[u + 'Class']),
                              (T.placement = angular.isDefined(i[u + 'Placement'])
                                ? i[u + 'Placement']
                                : f.placement));
                            var t = l.parsePlacement(T.placement);
                            y = t[1] ? t[0] + '-' + t[1] : t[0];
                            var n = parseInt(i[u + 'PopupDelay'], 10),
                              a = parseInt(i[u + 'PopupCloseDelay'], 10);
                            ((T.popupDelay = isNaN(n) ? f.popupDelay : n),
                              (T.popupCloseDelay = isNaN(a) ? f.popupCloseDelay : a));
                          })(),
                          T.popupDelay ? b || (b = a(U, T.popupDelay, !1)) : U());
                      }
                      function I() {
                        (N(), T.popupCloseDelay ? v || (v = a(F, T.popupCloseDelay, !1)) : F());
                      }
                      function U() {
                        if ((N(), H(), !T.content)) return angular.noop;
                        (c ||
                          ((h = T.$new()),
                          (c = n(h, function (e) {
                            D ? r.find('body').append(e) : t.after(e);
                          })),
                          d.add(T, { close: F }),
                          (E.length = 0),
                          O
                            ? (E.push(
                                e.$watch(O, function (e) {
                                  ((T.content = e), !e && T.isOpen && F());
                                })
                              ),
                              E.push(
                                h.$watch(function () {
                                  x ||
                                    ((x = !0),
                                    h.$$postDigest(function () {
                                      ((x = !1), T && T.isOpen && P());
                                    }));
                                })
                              ))
                            : E.push(
                                i.$observe(o, function (e) {
                                  ((T.content = e), !e && T.isOpen ? F() : P());
                                })
                              ),
                          E.push(
                            i.$observe(u + 'Title', function (e) {
                              ((T.title = e), T.isOpen && P());
                            })
                          ),
                          E.push(
                            i.$observe(u + 'Placement', function (e) {
                              ((T.placement = e || f.placement), T.isOpen && P());
                            })
                          )),
                          T.$evalAsync(function () {
                            ((T.isOpen = !0), V(!0), P());
                          }));
                      }
                      function N() {
                        (b && (a.cancel(b), (b = null)), $ && (a.cancel($), ($ = null)));
                      }
                      function F() {
                        T &&
                          T.$evalAsync(function () {
                            T &&
                              ((T.isOpen = !1),
                              V(!1),
                              T.animation ? g || (g = a(R, 150, !1)) : R());
                          });
                      }
                      function H() {
                        (v && (a.cancel(v), (v = null)), g && (a.cancel(g), (g = null)));
                      }
                      function R() {
                        (N(),
                          H(),
                          E.length &&
                            (angular.forEach(E, function (e) {
                              e();
                            }),
                            (E.length = 0)),
                          c && (c.remove(), (c = null), w && a.cancel(w)),
                          d.remove(T),
                          h && (h.$destroy(), (h = null)));
                      }
                      function V(t) {
                        M && angular.isFunction(M.assign) && M.assign(e, t);
                      }
                      function L(e) {
                        T &&
                          T.isOpen &&
                          c &&
                          (t[0].contains(e.target) || c[0].contains(e.target) || I());
                      }
                      function z(e) {
                        27 === e.which && I();
                      }
                      ((T.origScope = e),
                        (T.isOpen = !1),
                        (T.contentExp = function () {
                          return T.content;
                        }),
                        i.$observe('disabled', function (e) {
                          (e && N(), e && T.isOpen && F());
                        }),
                        M &&
                          e.$watch(M, function (e) {
                            T && !e === T.isOpen && S();
                          }));
                      var q,
                        Y,
                        B,
                        W = function () {
                          (k.show.forEach(function (e) {
                            ('outsideClick' === e ? t.off('click', S) : (t.off(e, A), t.off(e, S)),
                              t.off('keypress', z));
                          }),
                            k.hide.forEach(function (e) {
                              'outsideClick' === e ? r.off('click', L) : t.off(e, I);
                            }));
                        };
                      ((q = []),
                        (Y = []),
                        (B = e.$eval(i[u + 'Trigger'])),
                        W(),
                        angular.isObject(B)
                          ? (Object.keys(B).forEach(function (e) {
                              (q.push(e), Y.push(B[e]));
                            }),
                            (k = { show: q, hide: Y }))
                          : (k = m(B)),
                        'none' !== k.show &&
                          k.show.forEach(function (e, n) {
                            ('outsideClick' === e
                              ? (t.on('click', S), r.on('click', L))
                              : e === k.hide[n]
                                ? t.on(e, S)
                                : e && (t.on(e, A), t.on(k.hide[n], I)),
                              t.on('keypress', z));
                          }));
                      var j,
                        _ = e.$eval(i[u + 'Animation']);
                      T.animation = angular.isDefined(_) ? !!_ : f.animation;
                      var G = u + 'AppendToBody';
                      ((j = (G in i && void 0 === i[G]) || e.$eval(i[G])),
                        (D = angular.isDefined(j) ? j : D),
                        e.$on('$destroy', function () {
                          (W(), R(), (T = null));
                        }));
                    };
                  },
                };
              }
            );
          },
        ]));
    })
    .directive('uibTooltipTemplateTransclude', [
      '$animate',
      '$sce',
      '$compile',
      '$templateRequest',
      function (e, t, n, o) {
        return {
          link: function (i, a, r) {
            var l,
              s,
              u,
              p = i.$eval(r.tooltipTemplateTranscludeScope),
              c = 0,
              d = function () {
                (s && (s.remove(), (s = null)),
                  l && (l.$destroy(), (l = null)),
                  u &&
                    (e.leave(u).then(function () {
                      s = null;
                    }),
                    (s = u),
                    (u = null)));
              };
            (i.$watch(t.parseAsResourceUrl(r.uibTooltipTemplateTransclude), function (t) {
              var r = ++c;
              t
                ? (o(t, !0).then(
                    function (o) {
                      if (r === c) {
                        var i = p.$new(),
                          s = n(o)(i, function (t) {
                            (d(), e.enter(t, a));
                          });
                        ((u = s), (l = i).$emit('$includeContentLoaded', t));
                      }
                    },
                    function () {
                      r === c && (d(), i.$emit('$includeContentError', t));
                    }
                  ),
                  i.$emit('$includeContentRequested', t))
                : d();
            }),
              i.$on('$destroy', d));
          },
        };
      },
    ])
    .directive('uibTooltipClasses', [
      '$uibPosition',
      function (e) {
        return {
          restrict: 'A',
          link: function (t, n, o) {
            if (t.placement) {
              var i = e.parsePlacement(t.placement);
              n.addClass(i[0]);
            }
            (t.popupClass && n.addClass(t.popupClass),
              t.animation && n.addClass(o.tooltipAnimationClass));
          },
        };
      },
    ])
    .directive('uibTooltipPopup', function () {
      return {
        restrict: 'A',
        scope: { content: '@' },
        templateUrl: 'uib/template/tooltip/tooltip-popup.html',
      };
    })
    .directive('uibTooltip', [
      '$uibTooltip',
      function (e) {
        return e('uibTooltip', 'tooltip', 'mouseenter');
      },
    ])
    .directive('uibTooltipTemplatePopup', function () {
      return {
        restrict: 'A',
        scope: { contentExp: '&', originScope: '&' },
        templateUrl: 'uib/template/tooltip/tooltip-template-popup.html',
      };
    })
    .directive('uibTooltipTemplate', [
      '$uibTooltip',
      function (e) {
        return e('uibTooltipTemplate', 'tooltip', 'mouseenter', { useContentExp: !0 });
      },
    ])
    .directive('uibTooltipHtmlPopup', function () {
      return {
        restrict: 'A',
        scope: { contentExp: '&' },
        templateUrl: 'uib/template/tooltip/tooltip-html-popup.html',
      };
    })
    .directive('uibTooltipHtml', [
      '$uibTooltip',
      function (e) {
        return e('uibTooltipHtml', 'tooltip', 'mouseenter', { useContentExp: !0 });
      },
    ]),
  angular
    .module('ui.bootstrap.popover', ['ui.bootstrap.tooltip'])
    .directive('uibPopoverTemplatePopup', function () {
      return {
        restrict: 'A',
        scope: { uibTitle: '@', contentExp: '&', originScope: '&' },
        templateUrl: 'uib/template/popover/popover-template.html',
      };
    })
    .directive('uibPopoverTemplate', [
      '$uibTooltip',
      function (e) {
        return e('uibPopoverTemplate', 'popover', 'click', { useContentExp: !0 });
      },
    ])
    .directive('uibPopoverHtmlPopup', function () {
      return {
        restrict: 'A',
        scope: { contentExp: '&', uibTitle: '@' },
        templateUrl: 'uib/template/popover/popover-html.html',
      };
    })
    .directive('uibPopoverHtml', [
      '$uibTooltip',
      function (e) {
        return e('uibPopoverHtml', 'popover', 'click', { useContentExp: !0 });
      },
    ])
    .directive('uibPopoverPopup', function () {
      return {
        restrict: 'A',
        scope: { uibTitle: '@', content: '@' },
        templateUrl: 'uib/template/popover/popover.html',
      };
    })
    .directive('uibPopover', [
      '$uibTooltip',
      function (e) {
        return e('uibPopover', 'popover', 'click');
      },
    ]),
  angular
    .module('ui.bootstrap.progressbar', [])
    .constant('uibProgressConfig', { animate: !0, max: 100 })
    .controller('UibProgressController', [
      '$scope',
      '$attrs',
      'uibProgressConfig',
      function (e, t, n) {
        var o = this,
          i = angular.isDefined(t.animate) ? e.$parent.$eval(t.animate) : n.animate;
        function a() {
          return angular.isDefined(e.maxParam) ? e.maxParam : n.max;
        }
        ((this.bars = []),
          (e.max = a()),
          (this.addBar = function (e, t, n) {
            (i || t.css({ transition: 'none' }),
              this.bars.push(e),
              (e.max = a()),
              (e.title = n && angular.isDefined(n.title) ? n.title : 'progressbar'),
              e.$watch('value', function (t) {
                e.recalculatePercentage();
              }),
              (e.recalculatePercentage = function () {
                var t = o.bars.reduce(function (e, t) {
                  return ((t.percent = +((100 * t.value) / t.max).toFixed(2)), e + t.percent);
                }, 0);
                t > 100 && (e.percent -= t - 100);
              }),
              e.$on('$destroy', function () {
                ((t = null), o.removeBar(e));
              }));
          }),
          (this.removeBar = function (e) {
            (this.bars.splice(this.bars.indexOf(e), 1),
              this.bars.forEach(function (e) {
                e.recalculatePercentage();
              }));
          }),
          e.$watch('maxParam', function (e) {
            o.bars.forEach(function (e) {
              ((e.max = a()), e.recalculatePercentage());
            });
          }));
      },
    ])
    .directive('uibProgress', function () {
      return {
        replace: !0,
        transclude: !0,
        controller: 'UibProgressController',
        require: 'uibProgress',
        scope: { maxParam: '=?max' },
        templateUrl: 'uib/template/progressbar/progress.html',
      };
    })
    .directive('uibBar', function () {
      return {
        replace: !0,
        transclude: !0,
        require: '^uibProgress',
        scope: { value: '=', type: '@' },
        templateUrl: 'uib/template/progressbar/bar.html',
        link: function (e, t, n, o) {
          o.addBar(e, t, n);
        },
      };
    })
    .directive('uibProgressbar', function () {
      return {
        replace: !0,
        transclude: !0,
        controller: 'UibProgressController',
        scope: { value: '=', maxParam: '=?max', type: '@' },
        templateUrl: 'uib/template/progressbar/progressbar.html',
        link: function (e, t, n, o) {
          o.addBar(e, angular.element(t.children()[0]), { title: n.title });
        },
      };
    }),
  angular
    .module('ui.bootstrap.rating', [])
    .constant('uibRatingConfig', {
      max: 5,
      stateOn: null,
      stateOff: null,
      enableReset: !0,
      titles: ['one', 'two', 'three', 'four', 'five'],
    })
    .controller('UibRatingController', [
      '$scope',
      '$attrs',
      'uibRatingConfig',
      function (e, t, n) {
        var o = { $setViewValue: angular.noop },
          i = this;
        ((this.init = function (i) {
          (((o = i).$render = this.render),
            o.$formatters.push(function (e) {
              return (angular.isNumber(e) && e << 0 !== e && (e = Math.round(e)), e);
            }),
            (this.stateOn = angular.isDefined(t.stateOn) ? e.$parent.$eval(t.stateOn) : n.stateOn),
            (this.stateOff = angular.isDefined(t.stateOff)
              ? e.$parent.$eval(t.stateOff)
              : n.stateOff),
            (this.enableReset = angular.isDefined(t.enableReset)
              ? e.$parent.$eval(t.enableReset)
              : n.enableReset));
          var a = angular.isDefined(t.titles) ? e.$parent.$eval(t.titles) : n.titles;
          this.titles = angular.isArray(a) && a.length > 0 ? a : n.titles;
          var r = angular.isDefined(t.ratingStates)
            ? e.$parent.$eval(t.ratingStates)
            : new Array(angular.isDefined(t.max) ? e.$parent.$eval(t.max) : n.max);
          e.range = this.buildTemplateObjects(r);
        }),
          (this.buildTemplateObjects = function (e) {
            for (var t = 0, n = e.length; t < n; t++)
              e[t] = angular.extend(
                { index: t },
                { stateOn: this.stateOn, stateOff: this.stateOff, title: this.getTitle(t) },
                e[t]
              );
            return e;
          }),
          (this.getTitle = function (e) {
            return e >= this.titles.length ? e + 1 : this.titles[e];
          }),
          (e.rate = function (t) {
            if (!e.readonly && t >= 0 && t <= e.range.length) {
              var n = i.enableReset && o.$viewValue === t ? 0 : t;
              (o.$setViewValue(n), o.$render());
            }
          }),
          (e.enter = function (t) {
            (e.readonly || (e.value = t), e.onHover({ value: t }));
          }),
          (e.reset = function () {
            ((e.value = o.$viewValue), e.onLeave());
          }),
          (e.onKeydown = function (t) {
            /(37|38|39|40)/.test(t.which) &&
              (t.preventDefault(),
              t.stopPropagation(),
              e.rate(e.value + (38 === t.which || 39 === t.which ? 1 : -1)));
          }),
          (this.render = function () {
            ((e.value = o.$viewValue), (e.title = i.getTitle(e.value - 1)));
          }));
      },
    ])
    .directive('uibRating', function () {
      return {
        require: ['uibRating', 'ngModel'],
        restrict: 'A',
        scope: { readonly: '=?readOnly', onHover: '&', onLeave: '&' },
        controller: 'UibRatingController',
        templateUrl: 'uib/template/rating/rating.html',
        link: function (e, t, n, o) {
          var i = o[0],
            a = o[1];
          i.init(a);
        },
      };
    }),
  angular
    .module('ui.bootstrap.tabs', [])
    .controller('UibTabsetController', [
      '$scope',
      function (e) {
        var t,
          n,
          o = this;
        function i(e) {
          for (var t = 0; t < o.tabs.length; t++) if (o.tabs[t].index === e) return t;
        }
        ((o.tabs = []),
          (o.select = function (e, a) {
            if (!n) {
              var r = i(t),
                l = o.tabs[r];
              if (l) {
                if (
                  (l.tab.onDeselect({ $event: a, $selectedIndex: e }), a && a.isDefaultPrevented())
                )
                  return;
                l.tab.active = !1;
              }
              var s = o.tabs[e];
              s
                ? (s.tab.onSelect({ $event: a }),
                  (s.tab.active = !0),
                  (o.active = s.index),
                  (t = s.index))
                : !s && angular.isDefined(t) && ((o.active = null), (t = null));
            }
          }),
          (o.addTab = function (e) {
            if (
              (o.tabs.push({ tab: e, index: e.index }),
              o.tabs.sort(function (e, t) {
                return e.index > t.index ? 1 : e.index < t.index ? -1 : 0;
              }),
              e.index === o.active || (!angular.isDefined(o.active) && 1 === o.tabs.length))
            ) {
              var t = i(e.index);
              o.select(t);
            }
          }),
          (o.removeTab = function (e) {
            for (var t, n = 0; n < o.tabs.length; n++)
              if (o.tabs[n].tab === e) {
                t = n;
                break;
              }
            if (o.tabs[t].index === o.active) {
              var i = t === o.tabs.length - 1 ? t - 1 : t + (1 % o.tabs.length);
              o.select(i);
            }
            o.tabs.splice(t, 1);
          }),
          e.$watch('tabset.active', function (e) {
            angular.isDefined(e) && e !== t && o.select(i(e));
          }),
          e.$on('$destroy', function () {
            n = !0;
          }));
      },
    ])
    .directive('uibTabset', function () {
      return {
        transclude: !0,
        replace: !0,
        scope: {},
        bindToController: { active: '=?', type: '@' },
        controller: 'UibTabsetController',
        controllerAs: 'tabset',
        templateUrl: function (e, t) {
          return t.templateUrl || 'uib/template/tabs/tabset.html';
        },
        link: function (e, t, n) {
          ((e.vertical = !!angular.isDefined(n.vertical) && e.$parent.$eval(n.vertical)),
            (e.justified = !!angular.isDefined(n.justified) && e.$parent.$eval(n.justified)));
        },
      };
    })
    .directive('uibTab', [
      '$parse',
      function (e) {
        return {
          require: '^uibTabset',
          replace: !0,
          templateUrl: function (e, t) {
            return t.templateUrl || 'uib/template/tabs/tab.html';
          },
          transclude: !0,
          scope: {
            heading: '@',
            index: '=?',
            classes: '@?',
            onSelect: '&select',
            onDeselect: '&deselect',
          },
          controller: function () {},
          controllerAs: 'tab',
          link: function (t, n, o, i, a) {
            ((t.disabled = !1),
              o.disable &&
                t.$parent.$watch(e(o.disable), function (e) {
                  t.disabled = !!e;
                }),
              angular.isUndefined(o.index) &&
                (i.tabs && i.tabs.length
                  ? (t.index =
                      Math.max.apply(
                        null,
                        i.tabs.map(function (e) {
                          return e.index;
                        })
                      ) + 1)
                  : (t.index = 0)),
              angular.isUndefined(o.classes) && (t.classes = ''),
              (t.select = function (e) {
                if (!t.disabled) {
                  for (var n, o = 0; o < i.tabs.length; o++)
                    if (i.tabs[o].tab === t) {
                      n = o;
                      break;
                    }
                  i.select(n, e);
                }
              }),
              i.addTab(t),
              t.$on('$destroy', function () {
                i.removeTab(t);
              }),
              (t.$transcludeFn = a));
          },
        };
      },
    ])
    .directive('uibTabHeadingTransclude', function () {
      return {
        restrict: 'A',
        require: '^uibTab',
        link: function (e, t) {
          e.$watch('headingElement', function (e) {
            e && (t.html(''), t.append(e));
          });
        },
      };
    })
    .directive('uibTabContentTransclude', function () {
      return {
        restrict: 'A',
        require: '^uibTabset',
        link: function (e, t, n) {
          var o = e.$eval(n.uibTabContentTransclude).tab;
          o.$transcludeFn(o.$parent, function (e) {
            angular.forEach(e, function (e) {
              !(function (e) {
                return (
                  e.tagName &&
                  (e.hasAttribute('uib-tab-heading') ||
                    e.hasAttribute('data-uib-tab-heading') ||
                    e.hasAttribute('x-uib-tab-heading') ||
                    'uib-tab-heading' === e.tagName.toLowerCase() ||
                    'data-uib-tab-heading' === e.tagName.toLowerCase() ||
                    'x-uib-tab-heading' === e.tagName.toLowerCase() ||
                    'uib:tab-heading' === e.tagName.toLowerCase())
                );
              })(e)
                ? t.append(e)
                : (o.headingElement = e);
            });
          });
        },
      };
    }),
  angular
    .module('ui.bootstrap.timepicker', [])
    .constant('uibTimepickerConfig', {
      hourStep: 1,
      minuteStep: 1,
      secondStep: 1,
      showMeridian: !0,
      showSeconds: !1,
      meridians: null,
      readonlyInput: !1,
      mousewheel: !0,
      arrowkeys: !0,
      showSpinners: !0,
      templateUrl: 'uib/template/timepicker/timepicker.html',
    })
    .controller('UibTimepickerController', [
      '$scope',
      '$element',
      '$attrs',
      '$parse',
      '$log',
      '$locale',
      'uibTimepickerConfig',
      function (e, t, n, o, i, a, r) {
        var l,
          s,
          u,
          p = new Date(),
          c = [],
          d = { $setViewValue: angular.noop },
          f = angular.isDefined(n.meridians)
            ? e.$parent.$eval(n.meridians)
            : r.meridians || a.DATETIME_FORMATS.AMPMS,
          m = !angular.isDefined(n.padHours) || e.$parent.$eval(n.padHours);
        ((e.tabindex = angular.isDefined(n.tabindex) ? n.tabindex : 0),
          t.removeAttr('tabindex'),
          (this.init = function (t, o) {
            (((d = t).$render = this.render),
              d.$formatters.unshift(function (e) {
                return e ? new Date(e) : null;
              }));
            var i = o.eq(0),
              a = o.eq(1),
              p = o.eq(2);
            ((l = i.controller('ngModel')),
              (s = a.controller('ngModel')),
              (u = p.controller('ngModel')),
              (angular.isDefined(n.mousewheel) ? e.$parent.$eval(n.mousewheel) : r.mousewheel) &&
                this.setupMousewheelEvents(i, a, p),
              (angular.isDefined(n.arrowkeys) ? e.$parent.$eval(n.arrowkeys) : r.arrowkeys) &&
                this.setupArrowkeyEvents(i, a, p),
              (e.readonlyInput = angular.isDefined(n.readonlyInput)
                ? e.$parent.$eval(n.readonlyInput)
                : r.readonlyInput),
              this.setupInputEvents(i, a, p));
          }));
        var h = r.hourStep;
        n.hourStep &&
          c.push(
            e.$parent.$watch(o(n.hourStep), function (e) {
              h = +e;
            })
          );
        var g,
          b,
          v = r.minuteStep;
        (n.minuteStep &&
          c.push(
            e.$parent.$watch(o(n.minuteStep), function (e) {
              v = +e;
            })
          ),
          c.push(
            e.$parent.$watch(o(n.min), function (e) {
              var t = new Date(e);
              g = isNaN(t) ? void 0 : t;
            })
          ),
          c.push(
            e.$parent.$watch(o(n.max), function (e) {
              var t = new Date(e);
              b = isNaN(t) ? void 0 : t;
            })
          ));
        var $ = !1;
        (n.ngDisabled &&
          c.push(
            e.$parent.$watch(o(n.ngDisabled), function (e) {
              $ = e;
            })
          ),
          (e.noIncrementHours = function () {
            var e = O(p, 60 * h);
            return $ || e > b || (e < p && e < g);
          }),
          (e.noDecrementHours = function () {
            var e = O(p, 60 * -h);
            return $ || e < g || (e > p && e > b);
          }),
          (e.noIncrementMinutes = function () {
            var e = O(p, v);
            return $ || e > b || (e < p && e < g);
          }),
          (e.noDecrementMinutes = function () {
            var e = O(p, -v);
            return $ || e < g || (e > p && e > b);
          }),
          (e.noIncrementSeconds = function () {
            var e = E(p, w);
            return $ || e > b || (e < p && e < g);
          }),
          (e.noDecrementSeconds = function () {
            var e = E(p, -w);
            return $ || e < g || (e > p && e > b);
          }),
          (e.noToggleMeridian = function () {
            return p.getHours() < 12 ? $ || O(p, 720) > b : $ || O(p, -720) < g;
          }));
        var w = r.secondStep;
        function y() {
          var t = +e.hours;
          if ((e.showMeridian ? t > 0 && t < 13 : t >= 0 && t < 24) && '' !== e.hours)
            return (e.showMeridian && (12 === t && (t = 0), e.meridian === f[1] && (t += 12)), t);
        }
        function D() {
          var t = +e.minutes;
          if (t >= 0 && t < 60 && '' !== e.minutes) return t;
        }
        function k(e, t) {
          return null === e
            ? ''
            : angular.isDefined(e) && e.toString().length < 2 && !t
              ? '0' + e
              : e.toString();
        }
        function C(e) {
          (T(), d.$setViewValue(new Date(p)), x(e));
        }
        function T() {
          (l && l.$setValidity('hours', !0),
            s && s.$setValidity('minutes', !0),
            u && u.$setValidity('seconds', !0),
            d.$setValidity('time', !0),
            (e.invalidHours = !1),
            (e.invalidMinutes = !1),
            (e.invalidSeconds = !1));
        }
        function x(t) {
          if (d.$modelValue) {
            var n = p.getHours(),
              o = p.getMinutes(),
              i = p.getSeconds();
            (e.showMeridian && (n = 0 === n || 12 === n ? 12 : n % 12),
              (e.hours = 'h' === t ? n : k(n, !m)),
              'm' !== t && (e.minutes = k(o)),
              (e.meridian = p.getHours() < 12 ? f[0] : f[1]),
              's' !== t && (e.seconds = k(i)),
              (e.meridian = p.getHours() < 12 ? f[0] : f[1]));
          } else ((e.hours = null), (e.minutes = null), (e.seconds = null), (e.meridian = f[0]));
        }
        function M(e) {
          ((p = E(p, e)), C());
        }
        function O(e, t) {
          return E(e, 60 * t);
        }
        function E(e, t) {
          var n = new Date(e.getTime() + 1e3 * t),
            o = new Date(e);
          return (o.setHours(n.getHours(), n.getMinutes(), n.getSeconds()), o);
        }
        function P() {
          return (
            (null === e.hours || '' === e.hours) &&
            (null === e.minutes || '' === e.minutes) &&
            (!e.showSeconds || (e.showSeconds && (null === e.seconds || '' === e.seconds)))
          );
        }
        (n.secondStep &&
          c.push(
            e.$parent.$watch(o(n.secondStep), function (e) {
              w = +e;
            })
          ),
          (e.showSeconds = r.showSeconds),
          n.showSeconds &&
            c.push(
              e.$parent.$watch(o(n.showSeconds), function (t) {
                e.showSeconds = !!t;
              })
            ),
          (e.showMeridian = r.showMeridian),
          n.showMeridian &&
            c.push(
              e.$parent.$watch(o(n.showMeridian), function (t) {
                if (((e.showMeridian = !!t), d.$error.time)) {
                  var n = y(),
                    o = D();
                  angular.isDefined(n) && angular.isDefined(o) && (p.setHours(n), C());
                } else x();
              })
            ),
          (this.setupMousewheelEvents = function (t, n, o) {
            var i = function (e) {
              e.originalEvent && (e = e.originalEvent);
              var t = e.wheelDelta ? e.wheelDelta : -e.deltaY;
              return e.detail || t > 0;
            };
            (t.on('mousewheel wheel', function (t) {
              ($ || e.$apply(i(t) ? e.incrementHours() : e.decrementHours()), t.preventDefault());
            }),
              n.on('mousewheel wheel', function (t) {
                ($ || e.$apply(i(t) ? e.incrementMinutes() : e.decrementMinutes()),
                  t.preventDefault());
              }),
              o.on('mousewheel wheel', function (t) {
                ($ || e.$apply(i(t) ? e.incrementSeconds() : e.decrementSeconds()),
                  t.preventDefault());
              }));
          }),
          (this.setupArrowkeyEvents = function (t, n, o) {
            (t.on('keydown', function (t) {
              $ ||
                (38 === t.which
                  ? (t.preventDefault(), e.incrementHours(), e.$apply())
                  : 40 === t.which && (t.preventDefault(), e.decrementHours(), e.$apply()));
            }),
              n.on('keydown', function (t) {
                $ ||
                  (38 === t.which
                    ? (t.preventDefault(), e.incrementMinutes(), e.$apply())
                    : 40 === t.which && (t.preventDefault(), e.decrementMinutes(), e.$apply()));
              }),
              o.on('keydown', function (t) {
                $ ||
                  (38 === t.which
                    ? (t.preventDefault(), e.incrementSeconds(), e.$apply())
                    : 40 === t.which && (t.preventDefault(), e.decrementSeconds(), e.$apply()));
              }));
          }),
          (this.setupInputEvents = function (t, n, o) {
            if (e.readonlyInput)
              return (
                (e.updateHours = angular.noop),
                (e.updateMinutes = angular.noop),
                void (e.updateSeconds = angular.noop)
              );
            var i = function (t, n, o) {
              (d.$setViewValue(null),
                d.$setValidity('time', !1),
                angular.isDefined(t) && ((e.invalidHours = t), l && l.$setValidity('hours', !1)),
                angular.isDefined(n) &&
                  ((e.invalidMinutes = n), s && s.$setValidity('minutes', !1)),
                angular.isDefined(o) &&
                  ((e.invalidSeconds = o), u && u.$setValidity('seconds', !1)));
            };
            ((e.updateHours = function () {
              var e = y(),
                t = D();
              (d.$setDirty(),
                angular.isDefined(e) && angular.isDefined(t)
                  ? (p.setHours(e), p.setMinutes(t), p < g || p > b ? i(!0) : C('h'))
                  : i(!0));
            }),
              t.on('blur', function (t) {
                (d.$setTouched(),
                  P()
                    ? T()
                    : null === e.hours || '' === e.hours
                      ? i(!0)
                      : !e.invalidHours &&
                        e.hours < 10 &&
                        e.$apply(function () {
                          e.hours = k(e.hours, !m);
                        }));
              }),
              (e.updateMinutes = function () {
                var e = D(),
                  t = y();
                (d.$setDirty(),
                  angular.isDefined(e) && angular.isDefined(t)
                    ? (p.setHours(t), p.setMinutes(e), p < g || p > b ? i(void 0, !0) : C('m'))
                    : i(void 0, !0));
              }),
              n.on('blur', function (t) {
                (d.$setTouched(),
                  P()
                    ? T()
                    : null === e.minutes
                      ? i(void 0, !0)
                      : !e.invalidMinutes &&
                        e.minutes < 10 &&
                        e.$apply(function () {
                          e.minutes = k(e.minutes);
                        }));
              }),
              (e.updateSeconds = function () {
                var t = (function () {
                  var t = +e.seconds;
                  return t >= 0 && t < 60 ? t : void 0;
                })();
                (d.$setDirty(),
                  angular.isDefined(t) ? (p.setSeconds(t), C('s')) : i(void 0, void 0, !0));
              }),
              o.on('blur', function (t) {
                P()
                  ? T()
                  : !e.invalidSeconds &&
                    e.seconds < 10 &&
                    e.$apply(function () {
                      e.seconds = k(e.seconds);
                    });
              }));
          }),
          (this.render = function () {
            var t = d.$viewValue;
            isNaN(t)
              ? (d.$setValidity('time', !1),
                i.error(
                  'Timepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.'
                ))
              : (t && (p = t),
                p < g || p > b
                  ? (d.$setValidity('time', !1), (e.invalidHours = !0), (e.invalidMinutes = !0))
                  : T(),
                x());
          }),
          (e.showSpinners = angular.isDefined(n.showSpinners)
            ? e.$parent.$eval(n.showSpinners)
            : r.showSpinners),
          (e.incrementHours = function () {
            e.noIncrementHours() || M(60 * h * 60);
          }),
          (e.decrementHours = function () {
            e.noDecrementHours() || M(60 * -h * 60);
          }),
          (e.incrementMinutes = function () {
            e.noIncrementMinutes() || M(60 * v);
          }),
          (e.decrementMinutes = function () {
            e.noDecrementMinutes() || M(60 * -v);
          }),
          (e.incrementSeconds = function () {
            e.noIncrementSeconds() || M(w);
          }),
          (e.decrementSeconds = function () {
            e.noDecrementSeconds() || M(-w);
          }),
          (e.toggleMeridian = function () {
            var t = D(),
              n = y();
            e.noToggleMeridian() ||
              (angular.isDefined(t) && angular.isDefined(n)
                ? M(720 * (p.getHours() < 12 ? 60 : -60))
                : (e.meridian = e.meridian === f[0] ? f[1] : f[0]));
          }),
          (e.blur = function () {
            d.$setTouched();
          }),
          e.$on('$destroy', function () {
            for (; c.length; ) c.shift()();
          }));
      },
    ])
    .directive('uibTimepicker', [
      'uibTimepickerConfig',
      function (e) {
        return {
          require: ['uibTimepicker', '?^ngModel'],
          restrict: 'A',
          controller: 'UibTimepickerController',
          controllerAs: 'timepicker',
          scope: {},
          templateUrl: function (t, n) {
            return n.templateUrl || e.templateUrl;
          },
          link: function (e, t, n, o) {
            var i = o[0],
              a = o[1];
            a && i.init(a, t.find('input'));
          },
        };
      },
    ]),
  angular
    .module('ui.bootstrap.typeahead', ['ui.bootstrap.debounce', 'ui.bootstrap.position'])
    .factory('uibTypeaheadParser', [
      '$parse',
      function (e) {
        var t =
          /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+([\s\S]+?)$/;
        return {
          parse: function (n) {
            var o = n.match(t);
            if (!o)
              throw new Error(
                'Expected typeahead specification in form of "_modelValue_ (as _label_)? for _item_ in _collection_" but got "' +
                  n +
                  '".'
              );
            return {
              itemName: o[3],
              source: e(o[4]),
              viewMapper: e(o[2] || o[1]),
              modelMapper: e(o[1]),
            };
          },
        };
      },
    ])
    .controller('UibTypeaheadController', [
      '$scope',
      '$element',
      '$attrs',
      '$compile',
      '$parse',
      '$q',
      '$timeout',
      '$document',
      '$window',
      '$rootScope',
      '$$debounce',
      '$uibPosition',
      'uibTypeaheadParser',
      function (e, t, n, o, i, a, r, l, s, u, p, c, d) {
        var f,
          m,
          h = [9, 13, 27, 38, 40],
          g = e.$eval(n.typeaheadMinLength);
        (g || 0 === g || (g = 1),
          e.$watch(n.typeaheadMinLength, function (e) {
            g = e || 0 === e ? e : 1;
          }));
        var b = e.$eval(n.typeaheadWaitMs) || 0,
          v = !1 !== e.$eval(n.typeaheadEditable);
        e.$watch(n.typeaheadEditable, function (e) {
          v = !1 !== e;
        });
        var $,
          w,
          y = i(n.typeaheadLoading).assign || angular.noop,
          D = n.typeaheadShouldSelect
            ? i(n.typeaheadShouldSelect)
            : function (e, t) {
                var n = t.$event;
                return 13 === n.which || 9 === n.which;
              },
          k = i(n.typeaheadOnSelect),
          C = !!angular.isDefined(n.typeaheadSelectOnBlur) && e.$eval(n.typeaheadSelectOnBlur),
          T = i(n.typeaheadNoResults).assign || angular.noop,
          x = n.typeaheadInputFormatter ? i(n.typeaheadInputFormatter) : void 0,
          M = !!n.typeaheadAppendToBody && e.$eval(n.typeaheadAppendToBody),
          O = n.typeaheadAppendTo ? e.$eval(n.typeaheadAppendTo) : null,
          E = !1 !== e.$eval(n.typeaheadFocusFirst),
          P = !!n.typeaheadSelectOnExact && e.$eval(n.typeaheadSelectOnExact),
          S = i(n.typeaheadIsOpen).assign || angular.noop,
          A = e.$eval(n.typeaheadShowHint) || !1,
          I = i(n.ngModel),
          U = i(n.ngModel + '($$$p)'),
          N = d.parse(n.uibTypeahead),
          F = e.$new(),
          H = e.$on('$destroy', function () {
            F.$destroy();
          });
        F.$on('$destroy', H);
        var R,
          V,
          L = 'typeahead-' + F.$id + '-' + Math.floor(1e4 * Math.random());
        (t.attr({ 'aria-autocomplete': 'list', 'aria-expanded': !1, 'aria-owns': L }),
          A &&
            ((R = angular.element('<div></div>')).css('position', 'relative'),
            t.after(R),
            (V = t.clone()).attr('placeholder', ''),
            V.attr('tabindex', '-1'),
            V.val(''),
            V.css({
              position: 'absolute',
              top: '0px',
              left: '0px',
              'border-color': 'transparent',
              'box-shadow': 'none',
              opacity: 1,
              background:
                'none 0% 0% / auto repeat scroll padding-box border-box rgb(255, 255, 255)',
              color: '#999',
            }),
            t.css({
              position: 'relative',
              'vertical-align': 'top',
              'background-color': 'transparent',
            }),
            V.attr('id') && V.removeAttr('id'),
            R.append(V),
            V.after(t)));
        var z = angular.element('<div uib-typeahead-popup></div>');
        (z.attr({
          id: L,
          matches: 'matches',
          active: 'activeIdx',
          select: 'select(activeIdx, evt)',
          'move-in-progress': 'moveInProgress',
          query: 'query',
          position: 'position',
          'assign-is-open': 'assignIsOpen(isOpen)',
          debounce: 'debounceUpdate',
        }),
          angular.isDefined(n.typeaheadTemplateUrl) &&
            z.attr('template-url', n.typeaheadTemplateUrl),
          angular.isDefined(n.typeaheadPopupTemplateUrl) &&
            z.attr('popup-template-url', n.typeaheadPopupTemplateUrl));
        var q = function () {
            ((F.matches = []), (F.activeIdx = -1), t.attr('aria-expanded', !1), A && V.val(''));
          },
          Y = function (e) {
            return L + '-option-' + e;
          };
        F.$watch('activeIdx', function (e) {
          e < 0 ? t.removeAttr('aria-activedescendant') : t.attr('aria-activedescendant', Y(e));
        });
        var B = function (n, o) {
          var i = { $viewValue: n };
          (y(e, !0),
            T(e, !1),
            a.when(N.source(e, i)).then(
              function (a) {
                var r = n === f.$viewValue;
                if (r && $)
                  if (a && a.length > 0) {
                    ((F.activeIdx = E ? 0 : -1), T(e, !1), (F.matches.length = 0));
                    for (var l = 0; l < a.length; l++)
                      ((i[N.itemName] = a[l]),
                        F.matches.push({ id: Y(l), label: N.viewMapper(F, i), model: a[l] }));
                    if (
                      ((F.query = n),
                      G(),
                      t.attr('aria-expanded', !0),
                      P &&
                        1 === F.matches.length &&
                        (function (e, t) {
                          return (
                            !!(F.matches.length > 0 && e) &&
                            e.toUpperCase() === F.matches[0].label.toUpperCase()
                          );
                        })(n) &&
                        (angular.isNumber(F.debounceUpdate) || angular.isObject(F.debounceUpdate)
                          ? p(
                              function () {
                                F.select(0, o);
                              },
                              angular.isNumber(F.debounceUpdate)
                                ? F.debounceUpdate
                                : F.debounceUpdate.default
                            )
                          : F.select(0, o)),
                      A)
                    ) {
                      var s = F.matches[0].label;
                      angular.isString(n) &&
                      n.length > 0 &&
                      s.slice(0, n.length).toUpperCase() === n.toUpperCase()
                        ? V.val(n + s.slice(n.length))
                        : V.val('');
                    }
                  } else (q(), T(e, !0));
                r && y(e, !1);
              },
              function () {
                (q(), y(e, !1), T(e, !0));
              }
            ));
        };
        M && (angular.element(s).on('resize', _), l.find('body').on('scroll', _));
        var W,
          j = p(function () {
            (F.matches.length && G(), (F.moveInProgress = !1));
          }, 200);
        function _() {
          (F.moveInProgress || ((F.moveInProgress = !0), F.$digest()), j());
        }
        function G() {
          ((F.position = M ? c.offset(t) : c.position(t)),
            (F.position.top += t.prop('offsetHeight')));
        }
        ((F.moveInProgress = !1), (F.query = void 0));
        var K = function () {
          W && r.cancel(W);
        };
        (q(),
          (F.assignIsOpen = function (t) {
            S(e, t);
          }),
          (F.select = function (o, i) {
            var a,
              l,
              s = {};
            ((w = !0),
              (s[N.itemName] = l = F.matches[o].model),
              (a = N.modelMapper(e, s)),
              (function (t, n) {
                angular.isFunction(I(e)) && m.getOption('getterSetter')
                  ? U(t, { $$$p: n })
                  : I.assign(t, n);
              })(e, a),
              f.$setValidity('editable', !0),
              f.$setValidity('parse', !0),
              k(e, { $item: l, $model: a, $label: N.viewMapper(e, s), $event: i }),
              q(),
              !1 !== F.$eval(n.typeaheadFocusOnSelect) &&
                r(
                  function () {
                    t[0].focus();
                  },
                  0,
                  !1
                ));
          }),
          t.on('keydown', function (t) {
            if (0 !== F.matches.length && -1 !== h.indexOf(t.which)) {
              var n,
                o = D(e, { $event: t });
              if ((-1 === F.activeIdx && o) || (9 === t.which && t.shiftKey))
                return (q(), void F.$digest());
              switch ((t.preventDefault(), t.which)) {
                case 27:
                  (t.stopPropagation(), q(), e.$digest());
                  break;
                case 38:
                  ((F.activeIdx = (F.activeIdx > 0 ? F.activeIdx : F.matches.length) - 1),
                    F.$digest(),
                    ((n =
                      z[0].querySelectorAll('.uib-typeahead-match')[
                        F.activeIdx
                      ]).parentNode.scrollTop = n.offsetTop));
                  break;
                case 40:
                  ((F.activeIdx = (F.activeIdx + 1) % F.matches.length),
                    F.$digest(),
                    ((n =
                      z[0].querySelectorAll('.uib-typeahead-match')[
                        F.activeIdx
                      ]).parentNode.scrollTop = n.offsetTop));
                  break;
                default:
                  o &&
                    F.$apply(function () {
                      angular.isNumber(F.debounceUpdate) || angular.isObject(F.debounceUpdate)
                        ? p(
                            function () {
                              F.select(F.activeIdx, t);
                            },
                            angular.isNumber(F.debounceUpdate)
                              ? F.debounceUpdate
                              : F.debounceUpdate.default
                          )
                        : F.select(F.activeIdx, t);
                    });
              }
            }
          }),
          t.on('focus', function (e) {
            (($ = !0),
              0 !== g ||
                f.$viewValue ||
                r(function () {
                  B(f.$viewValue, e);
                }, 0));
          }),
          t.on('blur', function (e) {
            (C &&
              F.matches.length &&
              -1 !== F.activeIdx &&
              !w &&
              ((w = !0),
              F.$apply(function () {
                angular.isObject(F.debounceUpdate) && angular.isNumber(F.debounceUpdate.blur)
                  ? p(function () {
                      F.select(F.activeIdx, e);
                    }, F.debounceUpdate.blur)
                  : F.select(F.activeIdx, e);
              })),
              !v &&
                f.$error.editable &&
                (f.$setViewValue(),
                F.$apply(function () {
                  (f.$setValidity('editable', !0), f.$setValidity('parse', !0));
                }),
                t.val('')),
              ($ = !1),
              (w = !1));
          }));
        var X = function (n) {
          t[0] !== n.target &&
            3 !== n.which &&
            0 !== F.matches.length &&
            (q(), u.$$phase || e.$digest());
        };
        (l.on('click', X),
          e.$on('$destroy', function () {
            (l.off('click', X),
              (M || O) && Z.remove(),
              M && (angular.element(s).off('resize', _), l.find('body').off('scroll', _)),
              z.remove(),
              A && R.remove());
          }));
        var Z = o(z)(F);
        (M ? l.find('body').append(Z) : O ? angular.element(O).eq(0).append(Z) : t.after(Z),
          (this.init = function (t) {
            ((m = (function (e) {
              var t;
              return (
                angular.version.minor < 6
                  ? ((t = e.$options || {}).getOption = function (e) {
                      return t[e];
                    })
                  : (t = e.$options),
                t
              );
            })((f = t))),
              (F.debounceUpdate = i(m.getOption('debounce'))(e)),
              f.$parsers.unshift(function (t) {
                return (
                  ($ = !0),
                  0 === g || (t && t.length >= g)
                    ? b > 0
                      ? (K(),
                        (function (e) {
                          W = r(function () {
                            B(e);
                          }, b);
                        })(t))
                      : B(t)
                    : (y(e, !1), K(), q()),
                  v
                    ? t
                    : t
                      ? void f.$setValidity('editable', !1)
                      : (f.$setValidity('editable', !0), null)
                );
              }),
              f.$formatters.push(function (t) {
                var n,
                  o = {};
                return (
                  v || f.$setValidity('editable', !0),
                  x
                    ? ((o.$model = t), x(e, o))
                    : ((o[N.itemName] = t),
                      (n = N.viewMapper(e, o)),
                      (o[N.itemName] = void 0),
                      n !== N.viewMapper(e, o) ? n : t)
                );
              }));
          }));
      },
    ])
    .directive('uibTypeahead', function () {
      return {
        controller: 'UibTypeaheadController',
        require: ['ngModel', 'uibTypeahead'],
        link: function (e, t, n, o) {
          o[1].init(o[0]);
        },
      };
    })
    .directive('uibTypeaheadPopup', [
      '$$debounce',
      function (e) {
        return {
          scope: {
            matches: '=',
            query: '=',
            active: '=',
            position: '&',
            moveInProgress: '=',
            select: '&',
            assignIsOpen: '&',
            debounce: '&',
          },
          replace: !0,
          templateUrl: function (e, t) {
            return t.popupTemplateUrl || 'uib/template/typeahead/typeahead-popup.html';
          },
          link: function (t, n, o) {
            ((t.templateUrl = o.templateUrl),
              (t.isOpen = function () {
                var e = t.matches.length > 0;
                return (t.assignIsOpen({ isOpen: e }), e);
              }),
              (t.isActive = function (e) {
                return t.active === e;
              }),
              (t.selectActive = function (e) {
                t.active = e;
              }),
              (t.selectMatch = function (n, o) {
                var i = t.debounce();
                angular.isNumber(i) || angular.isObject(i)
                  ? e(
                      function () {
                        t.select({ activeIdx: n, evt: o });
                      },
                      angular.isNumber(i) ? i : i.default
                    )
                  : t.select({ activeIdx: n, evt: o });
              }));
          },
        };
      },
    ])
    .directive('uibTypeaheadMatch', [
      '$templateRequest',
      '$compile',
      '$parse',
      function (e, t, n) {
        return {
          scope: { index: '=', match: '=', query: '=' },
          link: function (o, i, a) {
            var r = n(a.templateUrl)(o.$parent) || 'uib/template/typeahead/typeahead-match.html';
            e(r).then(function (e) {
              var n = angular.element(e.trim());
              (i.replaceWith(n), t(n)(o));
            });
          },
        };
      },
    ])
    .filter('uibTypeaheadHighlight', [
      '$sce',
      '$injector',
      '$log',
      function (e, t, n) {
        var o;
        return (
          (o = t.has('$sanitize')),
          function (t, i) {
            return (
              !o &&
                (function (e) {
                  return /<.*>/g.test(e);
                })(t) &&
                n.warn('Unsafe use of typeahead please use ngSanitize'),
              (t = i
                ? ('' + t).replace(
                    new RegExp(i.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1'), 'gi'),
                    '<strong>$&</strong>'
                  )
                : t),
              o || (t = e.trustAsHtml(t)),
              t
            );
          }
        );
      },
    ]),
  angular.module('ui.bootstrap.carousel').run(function () {
    (!angular.$$csp().noInlineStyle &&
      !angular.$$uibCarouselCss &&
      angular
        .element(document)
        .find('head')
        .prepend(
          '<style type="text/css">.ng-animate.item:not(.left):not(.right){-webkit-transition:0s ease-in-out left;transition:0s ease-in-out left}</style>'
        ),
      (angular.$$uibCarouselCss = !0));
  }),
  angular.module('ui.bootstrap.datepicker').run(function () {
    (!angular.$$csp().noInlineStyle &&
      !angular.$$uibDatepickerCss &&
      angular
        .element(document)
        .find('head')
        .prepend(
          '<style type="text/css">.uib-datepicker .uib-title{width:100%;}.uib-day button,.uib-month button,.uib-year button{min-width:100%;}.uib-left,.uib-right{width:100%}</style>'
        ),
      (angular.$$uibDatepickerCss = !0));
  }),
  angular.module('ui.bootstrap.position').run(function () {
    (!angular.$$csp().noInlineStyle &&
      !angular.$$uibPositionCss &&
      angular
        .element(document)
        .find('head')
        .prepend(
          '<style type="text/css">.uib-position-measure{display:block !important;visibility:hidden !important;position:absolute !important;top:-9999px !important;left:-9999px !important;}.uib-position-scrollbar-measure{position:absolute !important;top:-9999px !important;width:50px !important;height:50px !important;overflow:scroll !important;}.uib-position-body-scrollbar-measure{overflow:scroll !important;}</style>'
        ),
      (angular.$$uibPositionCss = !0));
  }),
  angular.module('ui.bootstrap.datepickerPopup').run(function () {
    (!angular.$$csp().noInlineStyle &&
      !angular.$$uibDatepickerpopupCss &&
      angular
        .element(document)
        .find('head')
        .prepend(
          '<style type="text/css">.uib-datepicker-popup.dropdown-menu{display:block;float:none;margin:0;}.uib-button-bar{padding:10px 9px 2px;}</style>'
        ),
      (angular.$$uibDatepickerpopupCss = !0));
  }),
  angular.module('ui.bootstrap.tooltip').run(function () {
    (!angular.$$csp().noInlineStyle &&
      !angular.$$uibTooltipCss &&
      angular
        .element(document)
        .find('head')
        .prepend(
          '<style type="text/css">[uib-tooltip-popup].tooltip.top-left > .tooltip-arrow,[uib-tooltip-popup].tooltip.top-right > .tooltip-arrow,[uib-tooltip-popup].tooltip.bottom-left > .tooltip-arrow,[uib-tooltip-popup].tooltip.bottom-right > .tooltip-arrow,[uib-tooltip-popup].tooltip.left-top > .tooltip-arrow,[uib-tooltip-popup].tooltip.left-bottom > .tooltip-arrow,[uib-tooltip-popup].tooltip.right-top > .tooltip-arrow,[uib-tooltip-popup].tooltip.right-bottom > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.top-left > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.top-right > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.bottom-left > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.bottom-right > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.left-top > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.left-bottom > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.right-top > .tooltip-arrow,[uib-tooltip-html-popup].tooltip.right-bottom > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.top-left > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.top-right > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.bottom-left > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.bottom-right > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.left-top > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.left-bottom > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.right-top > .tooltip-arrow,[uib-tooltip-template-popup].tooltip.right-bottom > .tooltip-arrow,[uib-popover-popup].popover.top-left > .arrow,[uib-popover-popup].popover.top-right > .arrow,[uib-popover-popup].popover.bottom-left > .arrow,[uib-popover-popup].popover.bottom-right > .arrow,[uib-popover-popup].popover.left-top > .arrow,[uib-popover-popup].popover.left-bottom > .arrow,[uib-popover-popup].popover.right-top > .arrow,[uib-popover-popup].popover.right-bottom > .arrow,[uib-popover-html-popup].popover.top-left > .arrow,[uib-popover-html-popup].popover.top-right > .arrow,[uib-popover-html-popup].popover.bottom-left > .arrow,[uib-popover-html-popup].popover.bottom-right > .arrow,[uib-popover-html-popup].popover.left-top > .arrow,[uib-popover-html-popup].popover.left-bottom > .arrow,[uib-popover-html-popup].popover.right-top > .arrow,[uib-popover-html-popup].popover.right-bottom > .arrow,[uib-popover-template-popup].popover.top-left > .arrow,[uib-popover-template-popup].popover.top-right > .arrow,[uib-popover-template-popup].popover.bottom-left > .arrow,[uib-popover-template-popup].popover.bottom-right > .arrow,[uib-popover-template-popup].popover.left-top > .arrow,[uib-popover-template-popup].popover.left-bottom > .arrow,[uib-popover-template-popup].popover.right-top > .arrow,[uib-popover-template-popup].popover.right-bottom > .arrow{top:auto;bottom:auto;left:auto;right:auto;margin:0;}[uib-popover-popup].popover,[uib-popover-html-popup].popover,[uib-popover-template-popup].popover{display:block !important;}</style>'
        ),
      (angular.$$uibTooltipCss = !0));
  }),
  angular.module('ui.bootstrap.timepicker').run(function () {
    (!angular.$$csp().noInlineStyle &&
      !angular.$$uibTimepickerCss &&
      angular
        .element(document)
        .find('head')
        .prepend('<style type="text/css">.uib-time input{width:50px;}</style>'),
      (angular.$$uibTimepickerCss = !0));
  }),
  angular.module('ui.bootstrap.typeahead').run(function () {
    (!angular.$$csp().noInlineStyle &&
      !angular.$$uibTypeaheadCss &&
      angular
        .element(document)
        .find('head')
        .prepend(
          '<style type="text/css">[uib-typeahead-popup].dropdown-menu{display:block;}</style>'
        ),
      (angular.$$uibTypeaheadCss = !0));
  }));
