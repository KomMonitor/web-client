!(function (t, e) {
  'function' == typeof define && define.amd
    ? define([], function () {
        return e();
      })
    : 'object' == typeof module && module.exports
      ? (module.exports = e())
      : (t.rangeslide = e());
})(this, function () {
  'use strict';
  var t = 'max-thumb',
    e = 'min-thumb',
    i = {
      autoPlay: !1,
      autoPlayDelay: 1e3,
      data: [],
      dataSource: 'value',
      animations: !0,
      enableLabelClick: !0,
      enableMarkerClick: !0,
      enableTrackClick: !0,
      endPosition: 1 / 0,
      handlers: [],
      highlightSelectedLabels: !1,
      labelsPosition: 'below',
      labelsContent: 'value',
      labelsWidth: 60,
      leftLabel: '',
      loop: !0,
      markerSize: 14,
      mode: 'single',
      mouseWheel: !1,
      rightLabel: '',
      showLabels: !1,
      showTrackMarkersProgress: !1,
      showTicks: !0,
      showTooltips: !1,
      showTrackMarkers: !1,
      showTrackProgress: !1,
      showValue: !1,
      sideLabelsWidth: 40,
      slideMode: 'snap',
      spacing: 'equidistant',
      startAlternateLabelsFromTop: !1,
      startPosition: 0,
      stepSize: 1,
      thumbHeight: 16,
      thumbWidth: 16,
      tickHeight: 16,
      tooltipsContent: 'value',
      trackHeight: 7,
      valueIndicatorOffset: 5,
      valueIndicatorWidth: 50,
      valueIndicatorHeight: 30,
      valueIndicatorPosition: 'above',
      valueIndicatorContent: 'value',
    };
  function s(t, e) {
    ((this.__value = t), this.__element, this.__label, (this.__index = e));
  }
  function n() {
    (this.init.apply(this, arguments), this.fire('initialized', [this.__targetElement]));
  }
  return (
    (s.prototype = {
      getElement: function () {
        return this.__element;
      },
      getLabel: function () {
        return this.__label;
      },
      getValue: function () {
        return this.__value;
      },
      getIndex: function () {
        return this.__index;
      },
      setIndex: function (t) {
        this.__index = t;
      },
      getRight: function () {
        return this.__element && this.__element.offsetLeft + this.__element.offsetWidth;
      },
      getLeft: function () {
        return this.__element && this.__element.offsetLeft;
      },
      setLeft: function (t) {
        this.__element.style.left = t + 'px';
      },
      setElement: function (t) {
        this.__element = t;
      },
      setValue: function (t) {
        this.__value = t;
      },
      addLabel: function (t) {
        ((this.__label = t), this.__element && this.__element.appendChild(t));
      },
      hide: function () {
        this.__element && (this.__element.style.display = 'none');
      },
    }),
    (n.prototype = {
      init: function (t, e) {
        ((this.__onThumbMouseMove = this.__onThumbMouseMove.bind(this)),
          (this.__onThumbMouseUp = this.__onThumbMouseUp.bind(this)),
          (this.__onThumbMouseDown = this.__onThumbMouseDown.bind(this)),
          (this.__onTrackClicked = this.__onTrackClicked.bind(this)),
          (this.__onLabelClicked = this.__onLabelClicked.bind(this)),
          (this.__onMarkerClicked = this.__onMarkerClicked.bind(this)),
          (this.__onThumbTransitionEnd = this.__onThumbTransitionEnd.bind(this)),
          (this.__onUpdateMarkersProgress = this.__onUpdateMarkersProgress.bind(this)),
          (this.__onMouseWheel = this.__onMouseWheel.bind(this)),
          (this.config = Object.assign({}, i, e)),
          (this.__valuesStore = {}),
          this.__adjustConfiguration(e),
          (this.__minimalDistanceBetweenThumbs = 5),
          this.__markersUpdateInterval,
          this.__trackElement,
          this.__trackProgressElement,
          this.__trackMarkerElements,
          this.__sliderElement,
          this.__draggedThumb,
          this.__labelContainerElement,
          this.__labelContainerElementTop,
          this.__labelContainerElementBottom,
          this.__rightLabelElement,
          this.__leftLabelElement,
          this.__mouseStartPositionX,
          this.__playInterval,
          (this.__thumbLeft = new s(
            this.getMarkerByIndex(this.config.startPosition),
            this.config.startPosition
          )),
          (this.__thumbRight = new s(
            this.getMarkerByIndex(this.config.endPosition),
            this.config.endPosition
          )),
          this.__previousValue,
          this.__checkIfTargetIsValid(t),
          this.__setAutoPlay(this.config.autoPlay),
          this.__targetElement.classList.add('rangeslide'),
          this.__targetElement.appendChild(this.__createUI()),
          this.__setThumbsInitialPositions(),
          this.config.mouseWheel && this.__attachMouseWheelHandlers());
      },
      refresh: function () {
        (this.__storeValues(),
          this.destroy(),
          (this.__thumbLeft = new s(
            this.getMarkerByIndex(this.config.startPosition),
            this.config.startPosition
          )),
          (this.__thumbRight = new s(
            this.getMarkerByIndex(this.config.endPosition),
            this.config.endPosition
          )),
          this.__setAutoPlay(this.config.autoPlay),
          this.__targetElement.appendChild(this.__createUI()),
          this.__loadStoredValues(),
          this.setMinValueByIndex(this.__thumbLeft.getIndex()),
          this.setMaxValueByIndex(this.__thumbRight.getIndex()),
          this.fire('refreshed', [this.__targetElement]));
      },
      destroy: function () {
        for (
          clearInterval(this.__markersUpdateInterval),
            clearInterval(this.__playInterval),
            this.__detachMouseWheelHandlers();
          this.__targetElement.lastChild;
        )
          this.__targetElement.removeChild(this.__targetElement.lastChild);
        this.fire('destroyed', [this.__targetElement]);
      },
      getElement: function () {
        return this.__targetElement;
      },
      getValue: function () {
        return this.isRangeMode()
          ? this.getRange()
          : this.isSelectMode()
            ? this.getSelection()
            : this.__thumbLeft.getValue();
      },
      getMinValue: function () {
        return this.isSelectMode() ? null : this.__thumbLeft.getValue();
      },
      getMaxValue: function () {
        return this.isSingleMode()
          ? this.__thumbLeft.getValue()
          : this.isSelectMode()
            ? null
            : this.__thumbRight.getValue();
      },
      getRange: function () {
        return this.isSingleMode() || this.isSelectMode()
          ? []
          : [this.__thumbLeft.getValue(), this.__thumbRight.getValue()];
      },
      getSelection: function () {
        if (this.isSingleMode() || this.isRangeMode()) return [];
        for (
          var t = this.__targetElement.querySelectorAll('.track-marker.selected'), e = [], i = 0;
          i < t.length;
          i++
        )
          e.push(this.config.data[parseInt(t[i].dataset.index)]);
        return e;
      },
      setValue: function (t, e) {
        var i = e.getValue(),
          s = this.__getPositionFromValue(t);
        (e.setValue(t), this.__snap(s), this.__onValueChanged(i, e.getValue(), e));
      },
      setMinValue: function (t) {
        this.isSelectMode() || this.setValue(t, this.__thumbLeft);
      },
      setMaxValue: function (t) {
        if (this.isSingleMode()) return this.setValue(t, this.__thumbLeft);
        this.isSelectMode() || this.setValue(t, this.__thumbRight);
      },
      setValueByIndex: function (t, e) {
        if (!(t < 0 || t > this.config.data.length - 1)) {
          var i = e.getValue();
          (e.setValue(this.getMarkerByIndex(t)), e.setIndex(t));
          var s = this.config.thumbWidth,
            n =
              (this.__targetElement.clientWidth - s) /
              ((this.config.data.length - 1) / this.config.stepSize);
          (this.__snap(n * t, e), this.__onValueChanged(i, e.getValue(), e));
        }
      },
      setValueByAttribute: function (t, e) {
        for (var i = this.config.data.length; i-- && this.config.data[i][t] !== e; );
        this.setValueByIndex(i - 1, this.__thumbLeft);
      },
      setMinValueByIndex: function (t) {
        this.isSelectMode() || t < 0 || this.setValueByIndex(t, this.__thumbLeft);
      },
      setMaxValueByIndex: function (t) {
        if (this.isSingleMode()) return this.setValueByIndex(t, this.__thumbLeft);
        this.isSelectMode() ||
          t > this.config.data.length - 1 ||
          this.setValueByIndex(t, this.__thumbRight);
      },
      setMinValueByAttribute: function (t, e) {
        if (!this.isSelectMode()) {
          for (var i = this.config.data.length; i-- && this.config.data[i][t] !== e; );
          this.setMinValueByIndex(i - 1, this.__thumbLeft);
        }
      },
      setMaxValueByAttribute: function (t, e) {
        if (!this.isSelectMode()) {
          for (var i = this.config.data.length; i-- && this.config.data[i][t] !== e; );
          if (this.isSingleMode()) return this.setValueByIndex(i - 1, this.__thumbLeft);
          this.setMinValueByIndex(i - 1, this.__thumbRight);
        }
      },
      setOption: function (t, e) {
        ((this.config[t] = e), this.refresh());
      },
      isSingleMode: function () {
        return 'single' === this.config.mode;
      },
      isRangeMode: function () {
        return 'range' === this.config.mode;
      },
      isSelectMode: function () {
        return 'select' === this.config.mode;
      },
      __hasValueChanged: function () {
        var t = this.__previousValue,
          e = {
            min: this.__thumbLeft.getValue(),
            max: this.__thumbRight && this.__thumbRight.getValue(),
          };
        return JSON.stringify(t) !== JSON.stringify(e);
      },
      __getClosestThumbElement: function (t) {
        return Math.abs(this.__thumbLeft.getRight() - t) > Math.abs(this.__thumbRight.getLeft() - t)
          ? this.__thumbRight
          : this.__thumbLeft;
      },
      __storeValues: function () {
        this.__valuesStore = {
          leftThumbValue: this.__thumbLeft.getValue(),
          leftThumbLeft: this.__thumbLeft.getLeft(),
          rightThumbValue: this.__thumbRight.getValue(),
          rightThumbLeft: this.__thumbRight.getLeft(),
        };
      },
      __loadStoredValues: function () {
        (0 === Object.keys(this.__valuesStore).length &&
          this.__valuesStore.constructor === Object) ||
          (this.__thumbLeft.setValue(this.__valuesStore.leftThumbValue),
          this.__thumbLeft.setLeft(this.__valuesStore.leftThumbLeft),
          this.isRangeMode() &&
            (this.__thumbRight.setValue(this.__valuesStore.rightThumbValue),
            this.__thumbRight.setLeft(this.__valuesStore.rightThumbLeft)));
      },
      __setActiveLabel: function (t) {
        var e = this.__targetElement.querySelector('.tick-label.selected'),
          i = this.__targetElement.querySelector('#' + this.__targetElement.id + '_label' + t);
        (e && e.classList.remove('selected'), i && i.classList.add('selected'));
      },
      __goToNextMarker: function () {
        if (!this.isRangeMode()) {
          var t = this.__thumbLeft.getIndex() + 1;
          if (this.config.loop) t > this.config.data.length - 1 && (t = 0);
          else if (t > this.config.data.length - 1) return void clearInterval(this.__playInterval);
          this.setValueByIndex(t, this.__thumbLeft);
        }
      },
      __getThumbStart: function (t) {
        return isNaN(parseFloat(t.style.left)) ? 0 : parseFloat(t.style.left);
      },
      __setAutoPlay: function (t) {
        if (!this.isRangeMode()) {
          if (!t)
            return (
              clearInterval(this.__playInterval),
              void this.fire('playStop', [this.__thumbLeft.getValue(), this.__targetElement])
            );
          ((this.__playInterval = setInterval(
            this.__goToNextMarker.bind(this),
            this.config.autoPlayDelay
          )),
            this.fire('playStart', [this.__thumbLeft.getValue(), this.__targetElement]));
        }
      },
      __markElementAsSelected: function (t) {
        t.classList.toggle('selected');
      },
      __onValueChanged: function (t, e, i) {
        (this.config.showValue && (i.getLabel().innerText = this.__getValueContent(e)),
          this.config.highlightSelectedLabels,
          this.__hasValueChanged() &&
            ((this.__previousValue = {
              min: this.__thumbLeft.getValue(),
              max: this.__thumbRight && this.__thumbRight.getValue(),
            }),
            this.isSingleMode()
              ? this.fire('valueChanged', [e, this.__targetElement])
              : this.isRangeMode() &&
                this.fire('rangeChanged', [this.getRange(), this.__targetElement]),
            this.isSelectMode() &&
              this.fire('selectionChanged', [this.getSelection(), this.__targetElement])));
      },
      __onTrackClicked: function (t) {
        ('free' === this.config.slideMode ? this.__place(t.offsetX) : this.__snap(t.offsetX),
          this.fire('trackClicked', [this.__thumbLeft.getValue(), t.currentTarget]));
      },
      __onLabelClicked: function (t) {
        var e = t.currentTarget.offsetLeft + this.config.labelsWidth - this.config.thumbWidth / 2,
          i = (parseInt(t.currentTarget.dataset.index), this.__getClosestThumbElement(e));
        ('free' === this.config.slideMode ? this.__place(e, i) : this.__snap(e),
          this.fire('labelClicked', [i.getValue(), t.currentTarget]));
      },
      __onMarkerClicked: function (t) {
        if (this.isSelectMode()) this.__markElementAsSelected(t.currentTarget);
        else {
          var e = t.currentTarget.offsetLeft + this.config.markerSize / 2,
            i = parseInt(t.currentTarget.dataset.index),
            s = this.__getClosestThumbElement(e);
          'free' === this.config.slideMode ? this.setValueByIndex(i, s) : this.__snap(e);
        }
        (this.fire('markerClicked', [this.__thumbLeft.getValue(), t.currentTarget]),
          t.preventDefault(),
          t.stopPropagation());
      },
      __onThumbMouseDown: function (t) {
        this.__mouseStartPositionX = t.pageX;
        var e = this.__getThumbFromElement(t.currentTarget);
        ((this.__draggedThumb = e),
          (e.start = this.__getThumbStart(t.currentTarget)),
          e.getElement().classList.remove('animated'),
          this.fire('thumbDragStart', [e.getValue(), t.currentTarget]),
          window.addEventListener('mousemove', this.__onThumbMouseMove),
          window.addEventListener('mouseup', this.__onThumbMouseUp));
      },
      __onThumbMouseUp: function (t) {
        var e = this.__draggedThumb;
        ((e.start = this.__getThumbStart(e.getElement())),
          'snap' === this.config.slideMode ? this.__snap(e.start) : this.__place(e.start, e),
          this.fire('thumbDragEnd', [e.getValue(), e.getElement()]),
          (this.__draggedThumb = null),
          e.getElement().classList.add('animated'),
          window.removeEventListener('mousemove', this.__onThumbMouseMove),
          window.removeEventListener('mouseup', this.__onThumbMouseUp));
      },
      __onThumbMouseMove: function (i) {
        var s = this.__draggedThumb,
          n = -1 * (this.__mouseStartPositionX - i.pageX),
          a = s.start + n;
        if (this.isRangeMode() && this.areThumbsTooClose())
          if (s.getElement().classList.contains(t)) {
            if (a < s.getLeft()) return;
          } else if (s.getElement().classList.contains(e) && a > s.getLeft()) return;
        (this.isPositionOutOfBounds(a) || s.setLeft(a),
          this.config.showTrackProgress &&
            (this.isRangeMode()
              ? s.getElement().classList.contains(t)
                ? ((this.__trackProgressElement.style.left = this.__thumbLeft.getLeft()),
                  (this.__trackProgressElement.style.width = a - this.__thumbLeft.getLeft() + 'px'))
                : s.getElement().classList.contains(e) &&
                  ((this.__trackProgressElement.style.left = a + 'px'),
                  (this.__trackProgressElement.style.width =
                    this.__thumbRight.getLeft() - a + 'px'))
              : (this.__trackProgressElement.style.width = a + 'px')),
          this.__onUpdateMarkersProgress(),
          this.fire('thumbDragged', [s.getValue(), s.getElement()]));
      },
      __onThumbTransitionEnd: function (t) {
        (t.target.removeEventListener(t.type, this.__onThumbTransitionEnd),
          t.target.classList.remove('animated'),
          this.config.showTrackMarkersProgress &&
            (this.__onUpdateMarkersProgress(), clearInterval(this.__markersUpdateInterval)),
          this.__trackProgressElement.classList.remove('animated'));
      },
      __onUpdateMarkersProgress: function () {
        this.isRangeMode() ? this.__updateMarkerRange() : this.__updateMarkerProgress();
      },
      __checkIfTargetIsValid: function (t) {
        if (!t)
          throw new Error(
            'Missing required attribute: target element (css selector or DOM node) must be provided'
          );
        if (this.__isString(t)) this.__targetElement = document.querySelector(t);
        else {
          if (!this.__isDOMElement(t))
            throw new Error(
              'Incorrect type: target element must be DOM node or string css selector'
            );
          this.__targetElement = t;
        }
      },
      __onMouseWheel: function (t) {
        t = window.event || t;
        var e = Math.max(-1, Math.min(1, t.wheelDelta || -t.detail));
        return (
          (e = e < 0 ? -1 : 1),
          this.isSingleMode()
            ? this.setValueByIndex(this.__thumbLeft.getIndex() + e, this.__thumbLeft)
            : this.isRangeMode() &&
              (this.setMinValueByIndex(this.__thumbLeft.getIndex() + e),
              this.setMaxValueByIndex(this.__thumbRight.getIndex() - e)),
          !1
        );
      },
      __place: function (i, s, n) {
        var a = this.isRangeMode() ? s || this.__getClosestThumbElement(i) : this.__thumbLeft,
          h = {};
        ((h[this.config.dataSource] = this.__getValueAtPosition(i)),
          this.config.animations && !n && a.getElement().classList.add('animated'),
          a.setLeft(i),
          this.config.showTrackMarkersProgress &&
            (!this.config.animations || n
              ? this.__onUpdateMarkersProgress()
              : (this.__onUpdateMarkersProgress(),
                clearInterval(this.__markersUpdateInterval),
                (this.__markersUpdateInterval = setInterval(this.__onUpdateMarkersProgress, 20)))),
          this.config.showTrackProgress &&
            (this.config.animations && !n && this.__trackProgressElement.classList.add('animated'),
            this.isRangeMode()
              ? a.getElement().classList.contains(t)
                ? ((this.__trackProgressElement.style.left = this.__thumbLeft.getLeft()),
                  (this.__trackProgressElement.style.width = i - this.__thumbLeft.getLeft() + 'px'))
                : a.getElement().classList.contains(e) &&
                  ((this.__trackProgressElement.style.left = i + 'px'),
                  (this.__trackProgressElement.style.width =
                    this.__thumbRight.getLeft() - i + 'px'))
              : (this.__trackProgressElement.style.width = i + 'px')),
          this.config.animations &&
            !n &&
            (a.getElement().addEventListener('webkitTransitionEnd', this.__onThumbTransitionEnd),
            a.getElement().addEventListener('otransitionend', this.__onThumbTransitionEnd),
            a.getElement().addEventListener('oTransitionEnd', this.__onThumbTransitionEnd),
            a.getElement().addEventListener('msTransitionEnd', this.__onThumbTransitionEnd),
            a.getElement().addEventListener('transitionend', this.__onThumbTransitionEnd)));
        var o = a.getValue();
        (a.setValue(h), this.__onValueChanged(o, h, a));
      },
      __snap: function (i, s, n) {
        if ('data-driven' === this.config.spacing) {
          var a = this.isRangeMode() ? s || this.__getClosestThumbElement(i) : this.__thumbLeft,
            h = this.__getClosestMarker(i),
            o = i;
          (this.config.animations && !n && a.getElement().classList.add('animated'),
            a.setLeft(o),
            (l = parseInt(h.dataset.index)));
        } else {
          var r = this.__getDistanceBetweenItems();
          ((a = this.isRangeMode() ? s || this.__getClosestThumbElement(i) : this.__thumbLeft),
            this.config.animations && !n && a.getElement().classList.add('animated'));
          var l,
            _ = (i / r) % 1;
          ((o = '0px'),
            _ < 0.5
              ? ((o = (i - r * _).toFixed()), a.setLeft(o), (l = Math.floor(i / r)))
              : (l = Math.floor(i / r) + 1) <= this.config.data.length - 1
                ? ((o = (i + r * (1 - _)).toFixed()), a.setLeft(o))
                : ((o = (i - r * _).toFixed()), a.setLeft(o), (l = this.config.data.length - 1)));
        }
        (this.config.showTrackMarkersProgress &&
          (!this.config.animations || n
            ? this.__onUpdateMarkersProgress()
            : (this.__onUpdateMarkersProgress(),
              clearInterval(this.__markersUpdateInterval),
              (this.__markersUpdateInterval = setInterval(this.__onUpdateMarkersProgress, 20)))),
          this.config.showTrackProgress &&
            (this.config.animations && !n && this.__trackProgressElement.classList.add('animated'),
            this.isRangeMode()
              ? a.getElement().classList.contains(t)
                ? ((this.__trackProgressElement.style.left = this.__thumbLeft.getLeft()),
                  (this.__trackProgressElement.style.width = o - this.__thumbLeft.getLeft() + 'px'))
                : a.getElement().classList.contains(e) &&
                  ((this.__trackProgressElement.style.left = o + 'px'),
                  (this.__trackProgressElement.style.width =
                    this.__thumbRight.getLeft() - o + 'px'))
              : (this.__trackProgressElement.style.width = o + 'px')),
          this.config.animations &&
            !n &&
            (a.getElement().addEventListener('webkitTransitionEnd', this.__onThumbTransitionEnd),
            a.getElement().addEventListener('otransitionend', this.__onThumbTransitionEnd),
            a.getElement().addEventListener('oTransitionEnd', this.__onThumbTransitionEnd),
            a.getElement().addEventListener('msTransitionEnd', this.__onThumbTransitionEnd),
            a.getElement().addEventListener('transitionend', this.__onThumbTransitionEnd)));
        var c = this.getMarkerByIndex(l),
          g = a.getValue();
        (a.setValue(c), this.__onValueChanged(g, c, a));
      },
      __createUI: function () {
        var i = document.createDocumentFragment();
        if (
          ((this.__trackElement = this.__createTrackElement()),
          (this.__trackProgressElement = this.__createTrackProgressElement()),
          this.__thumbLeft.setElement(this.__createThumbElement(e)),
          this.isRangeMode() && this.__thumbRight.setElement(this.__createThumbElement(t)),
          (this.__sliderElement = this.__createSliderElement(
            this.__trackElement,
            this.__trackProgressElement,
            [this.__thumbLeft.getElement(), this.__thumbRight.getElement()]
          )),
          i.appendChild(this.__sliderElement),
          this.config.showLabels &&
            ('above' === this.config.labelsPosition
              ? ((this.__labelContainerElement = this.__createLabelsElement()),
                this.__createLabels(this.__labelContainerElement, !1, !1, !0),
                i.insertBefore(this.__labelContainerElement, this.__sliderElement))
              : 'alternate' === this.config.labelsPosition
                ? ((this.__labelContainerElementTop = this.__createLabelsElement()),
                  this.__createLabels(
                    this.__labelContainerElementTop,
                    !0,
                    !this.config.startAlternateLabelsFromTop,
                    !0
                  ),
                  (this.__labelContainerElementBottom = this.__createLabelsElement()),
                  this.__createLabels(
                    this.__labelContainerElementBottom,
                    !0,
                    this.config.startAlternateLabelsFromTop,
                    !1
                  ),
                  i.insertBefore(this.__labelContainerElementTop, this.__sliderElement),
                  i.appendChild(this.__labelContainerElementBottom))
                : ((this.__labelContainerElement = this.__createLabelsElement()),
                  this.__createLabels(this.__labelContainerElement, !1, !1, !1),
                  i.appendChild(this.__labelContainerElement))),
          this.config.showValue &&
            (this.__thumbLeft.addLabel(this.__createValueElement()),
            this.isRangeMode() && this.__thumbRight.addLabel(this.__createValueElement())),
          this.config.leftLabel &&
            ((this.__leftLabelElement = this.__createSideLabel(this.config.leftLabel)),
            i.appendChild(this.__leftLabelElement),
            (this.__leftLabelElement.style.left = -this.config.sideLabelsWidth + 'px'),
            (this.__targetElement.style.marginLeft = this.config.sideLabelsWidth + 'px')),
          this.config.rightLabel &&
            ((this.__rightLabelElement = this.__createSideLabel(this.config.rightLabel)),
            i.appendChild(this.__rightLabelElement),
            (this.__rightLabelElement.style.right = -this.config.sideLabelsWidth + 'px'),
            (this.__targetElement.style.marginRight = this.config.sideLabelsWidth + 'px')),
          this.config.showTrackMarkers)
        ) {
          this.__trackMarkerElements = this.__createTrackMarkers();
          for (var s = this.__trackMarkerElements.length; s--; )
            this.__trackElement.appendChild(this.__trackMarkerElements[s]);
        }
        return (this.isSelectMode() && (this.__thumbLeft.hide(), this.__thumbRight.hide()), i);
      },
      __createTrackElement: function () {
        var t = document.createElement('div');
        return (
          (t.className = 'track noselect' + (this.config.animations ? ' animated' : '')),
          (t.style.height = this.config.trackHeight + 'px'),
          this.config.enableTrackClick && (t.onclick = this.__onTrackClicked),
          t
        );
      },
      __createTrackProgressElement: function () {
        var t = document.createElement('div');
        return (
          (t.className = 'track-progress noselect'),
          (t.style.height = this.config.trackHeight + 'px'),
          t
        );
      },
      __createThumbElement: function (t) {
        var e = document.createElement('div');
        return (
          (e.className = 'thumb noselect ' + t),
          (e.style.width = this.config.thumbWidth + 'px'),
          (e.style.marginTop = -this.config.thumbHeight / 2 - this.config.trackHeight / 2 + 'px'),
          (e.style.height = this.config.thumbHeight + 'px'),
          (e.onmousedown = this.__onThumbMouseDown),
          e
        );
      },
      __createSideLabel: function (t) {
        var e = document.createElement('div');
        return (
          (e.innerText = t),
          (e.className = 'side-label noselect'),
          (e.style.width = this.config.sideLabelsWidth + 'px'),
          e
        );
      },
      __createSliderElement: function (t, e, i) {
        var s = document.createElement('div'),
          n = i.length;
        for (s.className = 'slider noselect', s.appendChild(e), s.appendChild(t); n--; )
          i[n] && s.appendChild(i[n]);
        return s;
      },
      __createValueElement: function () {
        var t = document.createElement('div');
        return (
          (t.className = 'value-indicator noselect'),
          'thumb' === this.config.valueIndicatorPosition
            ? ((t.style.width = this.config.thumbWidth + 'px'),
              (t.style.height = this.config.thumbHeight + 'px'),
              (t.style.lineHeight = this.config.thumbHeight + 'px'))
            : ((t.style.width = this.config.valueIndicatorWidth + 'px'),
              (t.style.height = this.config.valueIndicatorHeight + 'px'),
              (t.style.lineHeight = this.config.valueIndicatorHeight + 'px'),
              (t.style.left =
                -this.config.valueIndicatorWidth / 2 + this.config.thumbWidth / 2 + 'px')),
          'above' === this.config.valueIndicatorPosition
            ? ((t.style.top =
                -this.config.valueIndicatorHeight / 2 -
                this.config.thumbHeight / 2 -
                this.config.trackHeight -
                this.config.valueIndicatorOffset +
                'px'),
              t.classList.add('above'))
            : 'below' === this.config.valueIndicatorPosition &&
              ((t.style.top =
                this.config.valueIndicatorHeight / 2 +
                this.config.thumbHeight / 2 -
                this.config.trackHeight / 2 +
                this.config.valueIndicatorOffset +
                'px'),
              t.classList.add('below')),
          t
        );
      },
      __createLabelsElement: function () {
        var t = document.createElement('div');
        return ((t.className = 'labels-container noselect'), t);
      },
      __createLabels: function (t, e, i, s) {
        for (
          var n = this.config.labelsWidth / (e ? 1 : 2) - this.config.thumbWidth / 2,
            a = this.config.thumbWidth,
            h = this.config.data.length - 1,
            o = this.__getSmallestDistance(a),
            r = i ? 1 : 0;
          r <= h;
          e ? (r += 2) : r++
        ) {
          var l = document.createElement('div');
          if (
            ((l.className = 'tick-label noselect'),
            (l.style.width = this.config.labelsWidth * (e ? 2 : 1) + 'px'),
            (l.id = this.__targetElement.id + '_label' + r),
            (l.dataset.index = r),
            this.config.enableLabelClick && (l.onclick = this.__onLabelClicked),
            'data-driven' === this.config.spacing)
          ) {
            var _ =
              'calc(' +
              o +
              ' * ' +
              this.__getDistance(this.__getDataContent(this.config.data[r])) +
              ' - ' +
              n +
              'px)';
            l.style.left = _;
          } else l.style.left = 'calc(' + o + ' * ' + r + ' - ' + n + 'px)';
          if (this.config.showTicks) {
            var c = document.createElement('div');
            ((c.className = 'tick noselect'),
              (c.style.height = this.config.tickHeight + 'px'),
              l.appendChild(c));
          }
          var g = document.createElement('span');
          ((g.className = 'noselect'),
            (g.innerText = this.__getlabelsContent(this.config.data[r])),
            s ? l.insertBefore(g, c) : l.appendChild(g),
            t.appendChild(l));
        }
        s && (t.style.height = 14 + (this.config.showTicks ? this.config.tickHeight : 0) + 'px');
      },
      __createTrackMarkers: function () {
        for (
          var t = this.config.markerSize / 2 - this.config.thumbWidth / 2,
            e = this.config.thumbWidth,
            i = (this.config.data.length, this.config.data.length),
            s = this.__getSmallestDistance(e),
            n = [];
          i--;
        ) {
          var a = document.createElement('div');
          if (
            ((a.className = 'track-marker noselect'),
            (a.dataset.index = i),
            (a.style.width = this.config.markerSize + 'px'),
            (a.style.height = this.config.markerSize + 'px'),
            (a.style.top = -this.config.markerSize / 2 + this.config.trackHeight / 2 + 'px'),
            this.config.enableMarkerClick &&
              ((a.onclick = this.__onMarkerClicked), (a.style.cursor = 'pointer')),
            'data-driven' === this.config.spacing)
          ) {
            var h = this.__getDistance(this.__getDataContent(this.config.data[i]));
            a.style.left = 'calc(' + s + ' * ' + h + ' - ' + t + 'px)';
          } else a.style.left = 'calc(' + s + ' * ' + i + ' - ' + t + 'px)';
          n.push(a);
        }
        return (this.config.showTooltips && this.__attachTooltips(n), n);
      },
      __attachMouseWheelHandlers: function () {
        this.__targetElement.addEventListener
          ? (this.__targetElement.addEventListener('mousewheel', this.__onMouseWheel, !1),
            this.__targetElement.addEventListener('DOMMouseScroll', this.__onMouseWheel, !1))
          : this.__targetElement.attachEvent('onmousewheel', this.__onMouseWheel);
      },
      __detachMouseWheelHandlers: function () {
        this.__targetElement.removeEventListener
          ? (this.__targetElement.removeEventListener('mousewheel', this.__onMouseWheel, !1),
            this.__targetElement.removeEventListener('DOMMouseScroll', this.__onMouseWheel, !1))
          : this.__targetElement.detachEvent('onmousewheel', this.__onMouseWheel);
      },
      __attachTooltips: function (t) {
        for (var e = t.length; e--; ) {
          var i = document.createElement('span');
          (i.classList.add('content'),
            (i.innerText = this.__getTooltipsContent(this.config.data[e])),
            t[e].classList.add('tooltip'),
            t[e].appendChild(i));
        }
      },
      __getDataContent: function (t) {
        return this.__isString(this.config.dataSource)
          ? t[this.config.dataSource]
          : 'function' == typeof this.config.dataSource
            ? this.config.dataSource.call(this, t)
            : t;
      },
      __getlabelsContent: function (t) {
        return this.__isString(this.config.labelsContent)
          ? t[this.config.labelsContent]
          : 'function' == typeof this.config.labelsContent
            ? this.config.labelsContent.call(this, t)
            : t;
      },
      __getValueContent: function (t) {
        return this.__isString(this.config.valueIndicatorContent)
          ? t[this.config.valueIndicatorContent]
          : 'function' == typeof this.config.valueIndicatorContent
            ? this.config.valueIndicatorContent.call(this, t)
            : t;
      },
      __getTooltipsContent: function (t) {
        return this.__isString(this.config.tooltipsContent)
          ? t[this.config.tooltipsContent]
          : 'function' == typeof this.config.tooltipsContent
            ? this.config.tooltipsContent.call(this, t)
            : t;
      },
      __getValueAtPosition: function (t) {
        var e,
          i = Math.min.apply(
            Math,
            this.config.data.map(
              function (t) {
                return this.__getDataContent(t);
              }.bind(this)
            )
          ),
          s = Math.max.apply(
            Math,
            this.config.data.map(
              function (t) {
                return this.__getDataContent(t);
              }.bind(this)
            )
          ),
          n = Math.abs(s - i),
          a = this.__trackMarkerElements[0].offsetLeft,
          h = this.__trackMarkerElements[this.config.data.length - 1].offsetLeft;
        return ((e = i + (n * t) / Math.abs(a - h)), this.__isDataTemporal() ? new Date(e) : e);
      },
      __getPositionFromValue: function (t) {
        var e,
          i,
          s = Math.min.apply(
            Math,
            this.config.data.map(
              function (t) {
                return this.__getDataContent(t);
              }.bind(this)
            )
          ),
          n = Math.max.apply(
            Math,
            this.config.data.map(
              function (t) {
                return this.__getDataContent(t);
              }.bind(this)
            )
          ),
          a = Math.abs(n - s),
          h = this.__trackMarkerElements[0].offsetLeft,
          o = this.__trackMarkerElements[this.config.data.length - 1].offsetLeft,
          r = Math.abs(h - o);
        return (
          this.__isNumeric(t)
            ? (i = h + (r * (e = t)) / a)
            : this.__isString(t)
              ? (i = h + r * (e = t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t)))
              : this.__isDate(t)
                ? (i = h + (r * (e = t.getTime())) / a)
                : this.__isSet(e) || (i = 0),
          i
        );
      },
      __getDistanceBetweenItems: function () {
        var t = this.config.thumbWidth;
        return (
          (this.__targetElement.clientWidth - t) /
          ((this.config.data.length - 1) / this.config.stepSize)
        );
      },
      __getClosestMarker: function (t) {
        this.config.thumbWidth;
        for (var e, i = this.config.data.length; i--; )
          (!e ||
            Math.abs(this.__trackMarkerElements[i].offsetLeft - t) < Math.abs(e.offsetLeft - t)) &&
            (e = this.__trackMarkerElements[i]);
        return e;
      },
      __adjustConfiguration: function (t) {
        var e = this.config.data.length - 1;
        ((this.config.endPosition = this.config.endPosition > e ? e : this.config.endPosition),
          this.isRangeMode()
            ? ((this.config.autoPlay = !1), (this.config.loop = !1))
            : this.isSelectMode() && (this.config.showTrackMarkers = !0),
          this.__isDataTemporal() && !t.spacing && (this.config.spacing = 'data-driven'));
      },
      __isDataTemporal: function () {
        for (var t = this.config.data.length; t--; ) {
          var e = this.__getDataContent(this.config.data[t]);
          if (!this.__isDate(e)) return !1;
        }
        return !0;
      },
      __getThumbFromElement: function (i) {
        return i.classList.contains(t)
          ? this.__thumbRight
          : i.classList.contains(e)
            ? this.__thumbLeft
            : void 0;
      },
      __getSmallestDistance: function (t) {
        if ('data-driven' === this.config.spacing) {
          var e = Math.min.apply(
              Math,
              this.config.data.map(
                function (t) {
                  return this.__getDataContent(t);
                }.bind(this)
              )
            ),
            i = Math.max.apply(
              Math,
              this.config.data.map(
                function (t) {
                  return this.__getDataContent(t);
                }.bind(this)
              )
            );
          return '((100% - ' + t + 'px) / ' + Math.abs(i - e) / 1e3 + ')';
        }
        return '((100% - ' + t + 'px) / ' + (this.config.data.length - 1) + ')';
      },
      __getDistance: function (t) {
        if ('data-driven' === this.config.spacing) {
          var e = Math.min.apply(
            Math,
            this.config.data.map(
              function (t) {
                return this.__getDataContent(t);
              }.bind(this)
            )
          );
          return Math.abs(t - e) / 1e3;
        }
        return 0;
      },
      __setThumbsInitialPositions: function () {
        var t = this.config.thumbWidth,
          e =
            (this.__targetElement.clientWidth - t) /
            ((this.config.data.length - 1) / this.config.stepSize);
        (this.__snap(e * this.config.startPosition, this.__thumbLeft, !0),
          this.isRangeMode() && this.__snap(e * this.config.endPosition, this.__thumbRight, !0));
      },
      __updateMarkerProgress: function () {
        for (var t = this.__trackMarkerElements.length; t--; )
          this.__trackMarkerElements[t].offsetLeft <= this.__thumbLeft.getLeft()
            ? this.__trackMarkerElements[t].classList.add('completed')
            : this.__trackMarkerElements[t].classList.remove('completed');
      },
      __updateMarkerRange: function () {
        for (var t = this.__trackMarkerElements.length; t--; )
          this.__trackMarkerElements[t].offsetLeft >= this.__thumbLeft.getLeft() &&
          this.__trackMarkerElements[t].offsetLeft <= this.__thumbRight.getRight()
            ? this.__trackMarkerElements[t].classList.add('completed')
            : this.__trackMarkerElements[t].classList.remove('completed');
      },
      isPositionOutOfBounds: function (t) {
        var e = this.config.data.length - 1;
        return t > ((this.__targetElement.clientWidth - this.config.thumbWidth) / e) * e || t < 0;
      },
      areThumbsTooClose: function (t) {
        return (
          this.__thumbRight.getLeft() - this.__thumbLeft.getRight() <=
          this.__minimalDistanceBetweenThumbs
        );
      },
      getMarkerByIndex: function (t) {
        return this.config.data[t];
      },
      fire: function (t, e) {
        if (this.config.handlers && this.config.handlers[t])
          for (var i = this.config.handlers[t].length; i--; )
            this.config.handlers[t][i].apply(this, e);
      },
      __isDOMElement: function (t) {
        return t instanceof Element;
      },
      __isString: function (t) {
        return 'string' == typeof t;
      },
      __isNumeric: function (t) {
        return !isNaN(parseFloat(t)) && isFinite(t);
      },
      __isDate: function (t) {
        return t instanceof Date && 'function' == typeof t.getMonth;
      },
      __isSet: function (t) {
        return !(null == t);
      },
    }),
    function (t, e) {
      return new n(t, e);
    }
  );
});
