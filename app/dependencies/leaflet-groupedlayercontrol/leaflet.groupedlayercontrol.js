((L.Control.GroupedLayers = L.Control.extend({
  itemCounter: 0,
  options: {
    collapsed: !0,
    position: 'topright',
    autoZIndex: !0,
    exclusiveGroups: [],
    groupCheckboxes: !1,
  },
  initialize: function (e, t, a) {
    var r, l;
    for (r in (L.Util.setOptions(this, a),
    (this._layers = []),
    (this._lastZIndex = 0),
    (this._handlingClick = !1),
    (this._groupList = []),
    (this._domGroups = []),
    (this._sortableLayers = a.sortableLayers || []),
    e))
      this._addLayer(e[r], r);
    for (r in t) for (l in t[r]) this._addLayer(t[r][l], l, r, !0);
  },
  onAdd: function (e) {
    return (
      this._initLayout(),
      this._update(),
      e.on('layeradd', this._onLayerChange, this).on('layerremove', this._onLayerChange, this),
      this._container
    );
  },
  onRemove: function (e) {
    e.off('layeradd', this._onLayerChange, this).off('layerremove', this._onLayerChange, this);
  },
  addBaseLayer: function (e, t) {
    return (this._addLayer(e, t), this._update(), this);
  },
  addOverlay: function (e, t, a) {
    return (this._addLayer(e, t, a, !0), this._update(), this);
  },
  removeLayer: function (e) {
    var t = L.Util.stamp(e),
      a = this._getLayer(t);
    return (a && delete this._layers[this._layers.indexOf(a)], this._update(), this);
  },
  _getLayer: function (e) {
    for (var t = 0; t < this._layers.length; t++)
      if (this._layers[t] && L.stamp(this._layers[t].layer) === e) return this._layers[t];
  },
  _initLayout: function () {
    var e = 'leaflet-control-layers',
      t = (this._container = L.DomUtil.create('div', e));
    (t.setAttribute('aria-haspopup', !0),
      L.Browser.touch
        ? L.DomEvent.on(t, 'click', L.DomEvent.stopPropagation)
        : (L.DomEvent.disableClickPropagation(t),
          L.DomEvent.on(t, 'wheel', L.DomEvent.stopPropagation)));
    var a = (this._form = L.DomUtil.create('form', e + '-list'));
    if (this.options.collapsed) {
      L.Browser.android ||
        L.DomEvent.on(t, 'mouseover', this._expand, this).on(t, 'mouseout', this._collapse, this);
      var r = (this._layersLink = L.DomUtil.create('a', e + '-toggle', t));
      ((r.href = '#'),
        (r.title = 'Layers'),
        L.Browser.touch
          ? L.DomEvent.on(r, 'click', L.DomEvent.stop).on(r, 'click', this._expand, this)
          : L.DomEvent.on(r, 'focus', this._expand, this),
        this._map.on('click', this._collapse, this));
    } else this._expand();
    ((this._baseLayersList = L.DomUtil.create('div', e + '-base', a)),
      (this._separator = L.DomUtil.create('div', e + '-separator', a)),
      (this._overlaysList = L.DomUtil.create('div', e + '-overlays', a)),
      t.appendChild(a));
  },
  _addLayer: function (e, t, a, r) {
    L.Util.stamp(e);
    var l = { layer: e, name: t, overlay: r };
    (a ? this._layers.unshift(l) : this._layers.push(l), (a = a || ''));
    var i = this._groupList.findIndex((e) => e.name === a);
    -1 === i &&
      (i = this._groupList.push({ name: a, sortable: this._sortableLayers.indexOf(a) > -1 }) - 1);
    var s = -1 !== this._indexOf(this.options.exclusiveGroups, a);
    ((l.group = { name: a, id: i, exclusive: s }),
      this.options.autoZIndex &&
        e.setZIndex &&
        (this._lastZIndex++, e.setZIndex(this._lastZIndex)));
  },
  _update: function () {
    if (this._container) {
      ((this._baseLayersList.innerHTML = ''),
        (this._overlaysList.innerHTML = ''),
        (this._domGroups.length = 0));
      for (var e, t = !1, a = !1, r = 0; r < this._layers.length; r++) {
        e = this._layers[r];
        try {
          (this._addItem(e), (a = a || e.overlay), (t = t || !e.overlay));
        } catch (e) {}
      }
      (this._groupList.forEach((e, t) => {
        if (e.sortable) {
          const e = document
            .getElementById(`leaflet-control-layers-group-${t}`)
            ?.querySelector('.group-list');
          e &&
            ((zIndexOrder = []),
            e.querySelectorAll('.leaflet-control-layers-selector').forEach((e) => {
              ((layer = this._getLayer(e.layerId)),
                zIndexOrder.push(layer.layer.options.zIndex),
                console.log(layer.layer));
            }),
            Sortable.create(e, {
              group: `layers-group-${t}`,
              handle: '.dnd-handle',
              onUpdate: (t) => {
                e.querySelectorAll('.leaflet-control-layers-selector').forEach((e, t) => {
                  ((layer = this._getLayer(e.layerId)),
                    layer.layer.setZIndex(zIndexOrder[t]),
                    console.log(layer.name));
                });
              },
            }));
        }
      }),
        (this._separator.style.display = a && t ? '' : 'none'));
    }
  },
  _onLayerChange: function (e) {
    var t,
      a = this._getLayer(L.Util.stamp(e.layer));
    a &&
      (this._handlingClick || this._update(),
      (t = a.overlay
        ? 'layeradd' === e.type
          ? 'overlayadd'
          : 'overlayremove'
        : 'layeradd' === e.type
          ? 'baselayerchange'
          : null) && this._map.fire(t, a));
  },
  _createRadioElement: function (e, t, a) {
    var r = '<input type="radio" class="leaflet-control-layers-selector" name="' + e + '"';
    (t && (r += ' checked="checked"'), a && (r += ` id="${a}"`), (r += '/>'));
    var l = document.createElement('div');
    return ((l.innerHTML = r), l.firstChild);
  },
  _getOpacity: function (e) {
    if (void 0 !== e.layer?.options?.opacity) return e.layer.options.opacity;
    if (e.layer?.getLayers) {
      const t = e.layer.getLayers()[0];
      if (t?.options.fillOpacity) return t.options.fillOpacity;
    }
    return '1';
  },
  _createOpacitySlider: function (e) {
    ((sliderWrapper = document.createElement('div')),
      (sliderWrapper.className = 'opacity-slider'),
      (sliderValue = (1 - parseFloat(this._getOpacity(e))).toFixed(2)));
    const t = document.createElement('div');
    ((t.textContent = 'Transparenz'), sliderWrapper.appendChild(t));
    const a = document.createElement('div');
    return (
      (a.className = 'slider-value'),
      (a.textContent = sliderValue),
      (slider = document.createElement('input')),
      (slider.type = 'range'),
      (slider.min = '0'),
      (slider.max = '1'),
      (slider.step = '0.01'),
      (slider.value = sliderValue),
      (slider.onchange = (t) => {
        ((sliderValue = t.target.value),
          (opacity = (1 - parseFloat(t.target.value)).toFixed(2)),
          e.layer && e.layer.setOpacity
            ? e.layer.setOpacity(opacity)
            : e.layer.eachLayer &&
              e.layer.eachLayer((e) => {
                (e.setStyle && e.setStyle({ fillOpacity: opacity, opacity }),
                  e.setOpacity && e.setOpacity(opacity));
              }),
          (a.textContent = sliderValue));
      }),
      sliderWrapper.appendChild(slider),
      sliderWrapper.appendChild(a),
      sliderWrapper
    );
  },
  _addItem: function (e) {
    this.itemCounter++;
    var t,
      a,
      r,
      l = '' + this.itemCounter++,
      i = document.createElement('div'),
      s = this._map.hasLayer(e.layer);
    if (((i.className = 'leaflet-control-layers-item'), e.overlay)) {
      if (this._groupList[e.group.id].sortable) {
        var o = document.createElement('i');
        ((o.className = 'dnd-handle fa fa-grip-vertical'), i.appendChild(o));
      }
      e.group.exclusive
        ? ((r = 'leaflet-exclusive-group-layer-' + e.group.id),
          (t = this._createRadioElement(r, s, l)))
        : (((t = document.createElement('input')).type = 'checkbox'),
          (t.id = l),
          (t.className = 'leaflet-control-layers-selector'),
          (t.defaultChecked = s));
    } else t = this._createRadioElement('leaflet-base-layers', s, l);
    ((t.layerId = L.Util.stamp(e.layer)),
      (t.groupID = e.group.id),
      L.DomEvent.on(t, 'click', this._onInputClick, this));
    var n = document.createElement('label');
    (n.setAttribute('for', l),
      (n.innerHTML = ' ' + e.name),
      (controlWrapper = document.createElement('div')),
      (controlWrapper.className = 'control-wrapper'));
    const d = document.createElement('div');
    if (
      ((d.style.display = 'flex'),
      (d.style.gap = '5px'),
      d.appendChild(t),
      d.appendChild(n),
      controlWrapper.appendChild(d),
      controlWrapper.appendChild(this._createOpacitySlider(e)),
      i.appendChild(controlWrapper),
      e.overlay)
    ) {
      a = this._overlaysList;
      var c = this._domGroups[e.group.id];
      if (!c) {
        (((c = document.createElement('div')).className = 'leaflet-control-layers-group'),
          (c.id = 'leaflet-control-layers-group-' + e.group.id));
        var p = document.createElement('div');
        p.className = 'leaflet-control-layers-group-label';
        var h = document.createElement('div');
        if (
          ((h.className = 'group-list'),
          '' !== e.group.name && !e.group.exclusive && this.options.groupCheckboxes)
        ) {
          var y = document.createElement('input');
          ((y.type = 'checkbox'),
            (y.className = 'leaflet-control-layers-group-selector'),
            (y.groupID = e.group.id),
            (y.legend = this),
            L.DomEvent.on(y, 'click', this._onGroupInputClick, y),
            p.appendChild(y));
        }
        var u = document.createElement('span');
        ((u.className = 'leaflet-control-layers-group-name'),
          (u.innerHTML = e.group.name),
          p.appendChild(u),
          c.appendChild(p),
          c.appendChild(h),
          a.appendChild(c),
          (this._domGroups[e.group.id] = c));
      }
      c.querySelector('.group-list').appendChild(i);
    } else this._baseLayersList.appendChild(i);
    return i;
  },
  _onGroupInputClick: function () {
    var e,
      t,
      a,
      r = this.legend;
    r._handlingClick = !0;
    var l = r._form.getElementsByTagName('input'),
      i = l.length;
    for (e = 0; e < i; e++)
      (t = l[e]).groupID === this.groupID &&
        'leaflet-control-layers-selector' === t.className &&
        ((t.checked = this.checked),
        (a = r._getLayer(t.layerId)),
        t.checked && !r._map.hasLayer(a.layer)
          ? r._map.addLayer(a.layer)
          : !t.checked && r._map.hasLayer(a.layer) && r._map.removeLayer(a.layer));
    r._handlingClick = !1;
  },
  _onInputClick: function () {
    var e,
      t,
      a,
      r = this._form.getElementsByTagName('input'),
      l = r.length;
    for (this._handlingClick = !0, e = 0; e < l; e++)
      'leaflet-control-layers-selector' === (t = r[e]).className &&
        ((a = this._getLayer(t.layerId)),
        t.checked && !this._map.hasLayer(a.layer)
          ? this._map.addLayer(a.layer)
          : !t.checked && this._map.hasLayer(a.layer) && this._map.removeLayer(a.layer));
    this._handlingClick = !1;
  },
  _expand: function () {
    L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
  },
  _collapse: function () {
    this._container.className = this._container.className.replace(
      ' leaflet-control-layers-expanded',
      ''
    );
  },
  _indexOf: function (e, t) {
    for (var a = 0, r = e.length; a < r; a++) if (e[a] === t) return a;
    return -1;
  },
})),
  (L.control.groupedLayers = function (e, t, a) {
    return new L.Control.GroupedLayers(e, t, a);
  }));
