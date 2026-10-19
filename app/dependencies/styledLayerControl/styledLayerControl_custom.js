((L.Control.StyledLayerControl = L.Control.Layers.extend({
  options: {
    collapsed: !0,
    position: 'topright',
    autoZIndex: !0,
    group_togglers: { show: !1, labelAll: 'All', labelNone: 'None' },
    groupDeleteLabel: 'Delete the group',
  },
  initialize: function (e, t, o) {
    var a;
    for (a in (L.Util.setOptions(this, o),
    (this._layerControlInputs = []),
    (this._layers = []),
    (this._lastZIndex = 0),
    (this._handlingClick = !1),
    (this._groupList = []),
    (this._domGroups = []),
    e))
      for (var i in e[a].layers) this._addLayer(e[a].layers[i], i, e[a], !1);
    for (a in t) for (var i in t[a].layers) this._addLayer(t[a].layers[i], i, t[a], !0);
  },
  onAdd: function (e) {
    return (
      this._initLayout(),
      this._update(),
      e
        .on('layeradd', this._onLayerChange, this)
        .on('layerremove', this._onLayerChange, this)
        .on('zoomend', this._onZoomEnd, this),
      this._container
    );
  },
  onRemove: function (e) {
    e.off('layeradd', this._onLayerChange).off('layerremove', this._onLayerChange);
  },
  addBaseLayer: function (e, t, o) {
    return (this._addLayer(e, t, o, !1), this._update(), this);
  },
  addOverlay: function (e, t, o) {
    return (
      (this._handlingClick = !0),
      this._addLayer(e, t, o, !0),
      (this._handlingClick = !0),
      this._update(),
      this
    );
  },
  removeLayer: function (e) {
    var t = L.Util.stamp(e);
    return (delete this._layers[t], this._map.removeLayer(e), this._update(), this);
  },
  removeGroup: function (e, t) {
    for (group in this._groupList)
      if (this._groupList[group].groupName == e) {
        for (layer in this._layers)
          this._layers[layer].group &&
            this._layers[layer].group.name == e &&
            (t && this._map.removeLayer(this._layers[layer].layer), delete this._layers[layer]);
        (delete this._groupList[group], this._update());
        break;
      }
  },
  removeAllGroups: function (e) {
    for (group in this._groupList) {
      for (layer in this._layers)
        this._layers[layer].group &&
          this._layers[layer].group.removable &&
          (e && this._map.removeLayer(this._layers[layer].layer), delete this._layers[layer]);
      delete this._groupList[group];
    }
    this._update();
  },
  selectLayer: function (e) {
    (this._map.addLayer(e), this._update());
  },
  unSelectLayer: function (e) {
    (this._map.removeLayer(e), this._update());
  },
  selectGroup: function (e) {
    this.changeGroup(e, !0);
  },
  unSelectGroup: function (e) {
    this.changeGroup(e, !1);
  },
  changeGroup: function (e, t) {
    for (group in this._groupList)
      if (this._groupList[group].groupName == e) {
        for (layer in this._layers)
          this._layers[layer].group &&
            this._layers[layer].group.name == e &&
            (t
              ? this._map.addLayer(this._layers[layer].layer)
              : this._map.removeLayer(this._layers[layer].layer));
        break;
      }
    this._update();
  },
  _initLayout: function () {
    var e = 'leaflet-control-layers',
      t = (this._container = L.DomUtil.create('div', e));
    (t.setAttribute('aria-haspopup', !0),
      L.Browser.touch
        ? L.DomEvent.on(t, 'click', L.DomEvent.stopPropagation)
        : (L.DomEvent.disableClickPropagation(t),
          L.DomEvent.on(t, 'wheel', L.DomEvent.stopPropagation)));
    var o = document.createElement('section');
    o.className = 'ac-container ' + e + '-list';
    var a = (this._form = L.DomUtil.create('form'));
    if ((o.appendChild(a), this.options.collapsed)) {
      L.Browser.android ||
        L.DomEvent.on(t, 'mouseover', this._expand, this).on(t, 'mouseout', this._collapse, this);
      var i = (this._layersLink = L.DomUtil.create('a', e + '-toggle', t));
      ((i.href = '#'),
        (i.title = 'Layers'),
        L.Browser.touch
          ? L.DomEvent.on(i, 'click', L.DomEvent.stop).on(i, 'click', this._expand, this)
          : L.DomEvent.on(i, 'focus', this._expand, this),
        this._map.on('click', this._collapse, this));
    } else this._expand();
    ((this._baseLayersList = L.DomUtil.create('div', e + '-base', a)),
      (this._overlaysList = L.DomUtil.create('div', e + '-overlays', a)),
      t.appendChild(o));
    for (var r = 0; r < (containers = t.getElementsByClassName('ac-container')).length; r++)
      (this.options.container_width && (containers[r].style.width = this.options.container_width),
        (this._default_maxHeight = this.options.container_maxHeight
          ? this.options.container_maxHeight
          : this._map.getSize().y - 70),
        (containers[r].style.maxHeight = this._default_maxHeight + 'px'));
    window.onresize = this._on_resize_window.bind(this);
  },
  _on_resize_window: function () {
    for (var e = 0; e < containers.length; e++)
      containers[e].style.maxHeight =
        window.innerHeight - 90 < this._removePxToInt(this._default_maxHeight)
          ? window.innerHeight - 90 + 'px'
          : this._removePxToInt(this._default_maxHeight) + 'px';
  },
  _removePxToInt: function (e) {
    return 'string' == typeof e ? parseInt(e.replace('px', '')) : e;
  },
  _addLayer: function (e, t, o, a) {
    var i = L.Util.stamp(e);
    if (((this._layers[i] = { layer: e, name: t, overlay: a }), o)) {
      var r = this._groupList.indexOf(o);
      if (-1 === r)
        for (g in this._groupList)
          if (this._groupList[g].groupName == o.groupName) {
            r = g;
            break;
          }
      (-1 === r && (r = this._groupList.push(o) - 1),
        (this._layers[i].group = {
          name: o.groupName,
          id: r,
          expanded: o.expanded,
          removable: o.removable,
        }));
    }
    this.options.autoZIndex && e.setZIndex && (this._lastZIndex++, e.setZIndex(this._lastZIndex));
  },
  _update: function () {
    if (this._container) {
      ((this._baseLayersList.innerHTML = ''),
        (this._overlaysList.innerHTML = ''),
        (this._domGroups.length = 0),
        (this._layerControlInputs = []));
      var e,
        t,
        o = !1,
        a = !1;
      for (e in this._layers)
        ((t = this._layers[e]), this._addItem(t), (a = a || t.overlay), (o = o || !t.overlay));
    }
  },
  _onLayerChange: function (e) {
    var t = this._layers[L.Util.stamp(e.layer)];
    if (t) {
      this._handlingClick || this._update();
      var o = t.overlay
        ? 'layeradd' === e.type
          ? 'overlayadd'
          : 'overlayremove'
        : 'layeradd' === e.type
          ? 'baselayerchange'
          : null;
      (this._checkIfDisabled(), o && this._map.fire(o, t));
    }
  },
  _onZoomEnd: function (e) {
    this._checkIfDisabled();
  },
  _checkIfDisabled: function (e) {
    var t = this._map.getZoom();
    for (layerId in this._layers)
      if (
        this._layers[layerId].layer.options &&
        (this._layers[layerId].layer.options.minZoom || this._layers[layerId].layer.options.maxZoom)
      ) {
        var o = document.getElementById(
          'ac_layer_input_' + this._layers[layerId].layer._leaflet_id
        );
        t < this._layers[layerId].layer.options.minZoom ||
        t > this._layers[layerId].layer.options.maxZoom
          ? (o.disabled = 'disabled')
          : (o.disabled = '');
      }
  },
  _createRadioElement: function (e, t) {
    var o = '<input type="radio" class="leaflet-control-layers-selector" name="' + e + '"';
    (t && (o += ' checked="checked"'), (o += '/>'));
    var a = document.createElement('div');
    return ((a.innerHTML = o), a.firstChild);
  },
  _addItem: function (e) {
    var t,
      o,
      a = document.createElement('div'),
      i = this._map.hasLayer(e.layer),
      r = 'ac_layer_input_' + e.layer._leaflet_id;
    (e.overlay
      ? (((t = document.createElement('input')).type = 'checkbox'),
        (t.className = 'leaflet-control-layers-selector'),
        (t.defaultChecked = !0),
        (a.className = 'menu-item-checkbox'),
        (t.id = r))
      : ((t = this._createRadioElement('leaflet-base-layers', i)),
        (a.className = 'menu-item-radio'),
        (t.id = r)),
      this._layerControlInputs.push(t),
      (t.layerId = L.Util.stamp(e.layer)),
      L.DomEvent.on(t, 'click', this._onInputClick, this));
    var n = document.createElement('label');
    if (
      ((n.innerHTML = '<label for="' + r + '">' + e.name + '</label>'),
      a.appendChild(t),
      a.appendChild(n),
      e.layer.StyledLayerControl)
    ) {
      if (e.layer.StyledLayerControl.removable) {
        var s = document.createElement('input');
        ((s.type = 'button'),
          (s.className = 'bt_delete'),
          L.DomEvent.on(s, 'click', this._onDeleteClick, this),
          a.appendChild(s));
      }
      e.layer.StyledLayerControl.visible && this._map.addLayer(e.layer);
    }
    o = e.overlay ? this._overlaysList : this._baseLayersList;
    var l = this._domGroups[e.group.id];
    if (l) l.getElementsByTagName('article')[0].appendChild(a);
    else {
      (l = document.createElement('div')).id = 'leaflet-control-accordion-layers-' + e.group.id;
      var h = this.options.exclusive ? ' type="radio" ' : ' type="checkbox" ';
      if (
        ((inputElement =
          '<input id="ac' +
          e.group.id +
          '" name="accordion-1" class="menu"  checked = "true" ' +
          h +
          '/>'),
        (inputLabel = '<label for="ac' + e.group.id + '">' + e.group.name + '</label>'),
        (article = document.createElement('article')),
        (article.className = 'ac-large'),
        article.appendChild(a),
        this.options.group_maxHeight && (article.style.maxHeight = this.options.group_maxHeight),
        (l.innerHTML = inputElement + inputLabel),
        l.appendChild(article),
        e.overlay && this.options.group_togglers.show)
      ) {
        var p = L.DomUtil.create('div', 'group-toggle-container', l),
          c = L.DomUtil.create('a', 'group-toggle-all', p);
        ((c.href = '#'),
          (c.title = this.options.group_togglers.labelAll),
          (c.innerHTML = this.options.group_togglers.labelAll),
          c.setAttribute('data-group-name', e.group.name),
          L.Browser.touch
            ? L.DomEvent.on(c, 'click', L.DomEvent.stop).on(c, 'click', this._onSelectGroup, this)
            : L.DomEvent.on(c, 'click', L.DomEvent.stop).on(c, 'focus', this._onSelectGroup, this),
          (L.DomUtil.create('span', 'group-toggle-divider', p).innerHTML = ' / '));
        var d = L.DomUtil.create('a', 'group-toggle-none', p);
        if (
          ((d.href = '#'),
          (d.title = this.options.group_togglers.labelNone),
          (d.innerHTML = this.options.group_togglers.labelNone),
          d.setAttribute('data-group-name', e.group.name),
          L.Browser.touch
            ? L.DomEvent.on(d, 'click', L.DomEvent.stop).on(d, 'click', this._onUnSelectGroup, this)
            : L.DomEvent.on(d, 'click', L.DomEvent.stop).on(
                d,
                'focus',
                this._onUnSelectGroup,
                this
              ),
          e.overlay &&
            this.options.group_togglers.show &&
            e.group.removable &&
            (L.DomUtil.create('span', 'group-toggle-divider', p).innerHTML = ' / '),
          e.group.removable)
        ) {
          var u = L.DomUtil.create('a', 'group-toggle-none', p);
          ((u.href = '#'),
            (u.title = this.options.groupDeleteLabel),
            (u.innerHTML = this.options.groupDeleteLabel),
            u.setAttribute('data-group-name', e.group.name),
            L.Browser.touch
              ? L.DomEvent.on(u, 'click', L.DomEvent.stop).on(u, 'click', this._onRemoveGroup, this)
              : L.DomEvent.on(u, 'click', L.DomEvent.stop).on(
                  u,
                  'focus',
                  this._onRemoveGroup,
                  this
                ));
        }
      }
      (o.appendChild(l), (this._domGroups[e.group.id] = l));
    }
    return a;
  },
  _onDeleteClick: function (e) {
    var t = e.target.parentElement.childNodes[0];
    return (
      (n_obj = this._layers[t.layerId]),
      (!n_obj.overlay && t.checked) ||
        (this._map.hasLayer(n_obj.layer) &&
          (delete this._layers[t.layerId], this._map.removeLayer(n_obj.layer)),
        e.target.parentNode.remove(),
        this._update()),
      !1
    );
  },
  _onSelectGroup: function (e) {
    this.selectGroup(e.target.getAttribute('data-group-name'));
  },
  _onUnSelectGroup: function (e) {
    this.unSelectGroup(e.target.getAttribute('data-group-name'));
  },
  _onRemoveGroup: function (e) {
    this.removeGroup(e.target.getAttribute('data-group-name'), !0);
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
})),
  (L.Control.styledLayerControl = function (e, t, o) {
    return new L.Control.StyledLayerControl(e, t, o);
  }));
