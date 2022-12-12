/* global L */

// A layer control which provides for layer groupings.
// Author: Ishmael Smyrnow
L.Control.GroupedLayers = L.Control.extend({

  itemCounter: 0,

  options: {
    collapsed: true,
    position: 'topright',
    autoZIndex: true,
    exclusiveGroups: [],
    groupCheckboxes: false
  },

  initialize: function (baseLayers, groupedOverlays, options) {
    var i, j;
    L.Util.setOptions(this, options);
    
    this._layers = [];
    this._lastZIndex = 0;
    this._handlingClick = false;
    this._groupList = [];
    this._domGroups = [];
    this._sortableLayers = options.sortableLayers || [];

    for (i in baseLayers) {
      this._addLayer(baseLayers[i], i);
    }

    for (i in groupedOverlays) {
      for (j in groupedOverlays[i]) {
        this._addLayer(groupedOverlays[i][j], j, i, true);
      }
    }
  },

  onAdd: function (map) {
    this._initLayout();
    this._update();

    map
      .on('layeradd', this._onLayerChange, this)
      .on('layerremove', this._onLayerChange, this);

    return this._container;
  },

  onRemove: function (map) {
    map
      .off('layeradd', this._onLayerChange, this)
      .off('layerremove', this._onLayerChange, this);
  },

  addBaseLayer: function (layer, name) {
    this._addLayer(layer, name);
    this._update();
    return this;
  },

  addOverlay: function (layer, name, group) {
    this._addLayer(layer, name, group, true);
    this._update();
    return this;
  },

  removeLayer: function (layer) {
    var id = L.Util.stamp(layer);
    var _layer = this._getLayer(id);
    if (_layer) {
      delete this._layers[this._layers.indexOf(_layer)];
    }
    this._update();
    return this;
  },

  _getLayer: function (id) {
    for (var i = 0; i < this._layers.length; i++) {
      if (this._layers[i] && L.stamp(this._layers[i].layer) === id) {
        return this._layers[i];
      }
    }
  },

  _initLayout: function () {
    var className = 'leaflet-control-layers',
      container = this._container = L.DomUtil.create('div', className);

    // Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
    container.setAttribute('aria-haspopup', true);

    if (L.Browser.touch) {
      L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
    } else {
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.on(container, 'wheel', L.DomEvent.stopPropagation);
    }

    var form = this._form = L.DomUtil.create('form', className + '-list');

    if (this.options.collapsed) {
      if (!L.Browser.android) {
        L.DomEvent
          .on(container, 'mouseover', this._expand, this)
          .on(container, 'mouseout', this._collapse, this);
      }
      var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
      link.href = '#';
      link.title = 'Layers';

      if (L.Browser.touch) {
        L.DomEvent
          .on(link, 'click', L.DomEvent.stop)
          .on(link, 'click', this._expand, this);
      } else {
        L.DomEvent.on(link, 'focus', this._expand, this);
      }

      this._map.on('click', this._collapse, this);
      // TODO keyboard accessibility
    } else {
      this._expand();
    }

    this._baseLayersList = L.DomUtil.create('div', className + '-base', form);
    this._separator = L.DomUtil.create('div', className + '-separator', form);
    this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);

    container.appendChild(form);
  },

  _addLayer: function (layer, name, groupName, overlay) {
    var id = L.Util.stamp(layer);

    var _layer = {
      layer: layer,
      name: name,
      overlay: overlay
    };
    this._layers.push(_layer);

    groupName = groupName || '';
    var groupId = this._groupList.findIndex(e => e.name === groupName);

    if (groupId === -1) {
      groupId = this._groupList.push({
        name: groupName,
        sortable: this._sortableLayers.indexOf(groupName) > -1
      }) - 1;
    }

    var exclusive = (this._indexOf(this.options.exclusiveGroups, groupName) !== -1);

    _layer.group = {
      name: groupName,
      id: groupId,
      exclusive: exclusive
    };

    if (this.options.autoZIndex && layer.setZIndex) {
      this._lastZIndex++;
      layer.setZIndex(this._lastZIndex);
    }
  },

  _update: function () {
    if (!this._container) {
      return;
    }

    this._baseLayersList.innerHTML = '';
    this._overlaysList.innerHTML = '';
    this._domGroups.length = 0;

    var baseLayersPresent = false,
      overlaysPresent = false,
      i, obj;

    for (var i = 0; i < this._layers.length; i++) {
      obj = this._layers[i];
      try {
        this._addItem(obj);
        overlaysPresent = overlaysPresent || obj.overlay;
        baseLayersPresent = baseLayersPresent || !obj.overlay;
      } catch (error) {

      }
    }

    this._groupList.forEach((g, i) => {
      if (g.sortable) {
        const groupElem = document.getElementById(`leaflet-control-layers-group-${i}`)?.querySelector('.group-list');
        if (groupElem) {
          zIndexOrder = [];
          groupElem.querySelectorAll('.leaflet-control-layers-selector').forEach(e => {
            layer = this._getLayer(e.layerId);
            zIndexOrder.push(layer.layer.options.zIndex);
            console.log(layer.layer);
          })
          Sortable.create(groupElem, {
            group: `layers-group-${i}`,
            handle: '.dnd-handle',
            onUpdate: (evt) => {
              groupElem.querySelectorAll('.leaflet-control-layers-selector').forEach((e, i) => {
                layer = this._getLayer(e.layerId);
                layer.layer.setZIndex(zIndexOrder[i]);
                console.log(layer.name);
              })
              // const currentLayer = this._getLayer(evt.item.querySelector('.leaflet-control-layers-selector').layerId);
            }
          });
        }
      }
    })

    this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
  },

  _onLayerChange: function (e) {
    var obj = this._getLayer(L.Util.stamp(e.layer)),
      type;

    if (!obj) {
      return;
    }

    if (!this._handlingClick) {
      this._update();
    }

    if (obj.overlay) {
      type = e.type === 'layeradd' ? 'overlayadd' : 'overlayremove';
    } else {
      type = e.type === 'layeradd' ? 'baselayerchange' : null;
    }

    if (type) {
      this._map.fire(type, obj);
    }
  },

  // IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
  _createRadioElement: function (name, checked, id) {
    var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"';
    if (checked) {
      radioHtml += ' checked="checked"';
    }
    if (id) {
      radioHtml += ` id="${id}"`
    }
    radioHtml += '/>';

    var radioFragment = document.createElement('div');
    radioFragment.innerHTML = radioHtml;

    return radioFragment.firstChild;
  },

  _getOpacity: function(obj) {
    if (obj.layer?.options?.opacity !== undefined) {
      return obj.layer.options.opacity;
    } else if(obj.layer?.getLayers) {
      const layer = obj.layer.getLayers()[0];
      if (layer?.options.fillOpacity) {
        return layer.options.fillOpacity;
      }
    }
    return '1';
  },

  _createOpacitySlider: function (obj) {
    sliderWrapper = document.createElement('div');
    sliderWrapper.className = 'opacity-slider';

    sliderValue = (1 - parseFloat(this._getOpacity(obj))).toFixed(2);

    const label = document.createElement('div');
    label.textContent = 'Transparenz';
    sliderWrapper.appendChild(label);

    const value = document.createElement('div');
    value.className = 'slider-value';
    value.textContent = sliderValue;

    slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01';
    slider.value = sliderValue;
    slider.onchange = (evt) => {
      sliderValue = evt.target.value;
      opacity = (1 - parseFloat(evt.target.value)).toFixed(2);
      if (obj.layer && obj.layer.setOpacity) {
        // WMS Layer
        obj.layer.setOpacity(opacity);
      } else if (obj.layer.eachLayer) {
        // group/geojson layer
        obj.layer.eachLayer((layer) => {
          if (layer.setStyle) {
            layer.setStyle({
              fillOpacity: opacity,
              opacity: opacity
            })
          }
          if (layer.setOpacity) {
            layer.setOpacity(opacity);
          }
        });
      } else {
        debugger;
      }
      value.textContent = sliderValue;
    }
    sliderWrapper.appendChild(slider);
    sliderWrapper.appendChild(value);
    return sliderWrapper;
  },

  _addItem: function (obj) {
    this.itemCounter++;
    var itemId = `${this.itemCounter++}`;
    var itemWrapper = document.createElement('div'),
      input,
      checked = this._map.hasLayer(obj.layer),
      container,
      groupRadioName;

    itemWrapper.className = 'leaflet-control-layers-item';
    
    if (obj.overlay) {
      const group = this._groupList[obj.group.id];
      if (group.sortable) {
        var handle = document.createElement('i');
        handle.className = 'dnd-handle fa fa-grip-vertical';
        itemWrapper.appendChild(handle);
      }
      if (obj.group.exclusive) {
        groupRadioName = 'leaflet-exclusive-group-layer-' + obj.group.id;
        input = this._createRadioElement(groupRadioName, checked, itemId);
      } else {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.id = itemId;
        input.className = 'leaflet-control-layers-selector';
        input.defaultChecked = checked;
      }
    } else {
      input = this._createRadioElement('leaflet-base-layers', checked, itemId);
    }

    input.layerId = L.Util.stamp(obj.layer);
    input.groupID = obj.group.id;
    L.DomEvent.on(input, 'click', this._onInputClick, this);

    var label = document.createElement('label');
    label.setAttribute('for', itemId);
    label.innerHTML = ' ' + obj.name;

    controlWrapper = document.createElement('div');
    controlWrapper.className = 'control-wrapper';
    const selectElem = document.createElement('div');
    selectElem.style.display = 'flex';
    selectElem.style.gap = '5px';
    selectElem.appendChild(input);
    selectElem.appendChild(label);
    controlWrapper.appendChild(selectElem);
    controlWrapper.appendChild(this._createOpacitySlider(obj));
    itemWrapper.appendChild(controlWrapper);

    // grouping of not
    if (obj.overlay) {
      container = this._overlaysList;

      var groupContainer = this._domGroups[obj.group.id];

      // Create the group container if it doesn't exist
      if (!groupContainer) {
        groupContainer = document.createElement('div');
        groupContainer.className = 'leaflet-control-layers-group';
        groupContainer.id = 'leaflet-control-layers-group-' + obj.group.id;

        var groupLabel = document.createElement('div');
        groupLabel.className = 'leaflet-control-layers-group-label';

        var groupList = document.createElement('div');
        groupList.className = 'group-list';

        if (obj.group.name !== '' && !obj.group.exclusive) {
          // ------ add a group checkbox with an _onInputClickGroup function
          if (this.options.groupCheckboxes) {
            var groupInput = document.createElement('input');
            groupInput.type = 'checkbox';
            groupInput.className = 'leaflet-control-layers-group-selector';
            groupInput.groupID = obj.group.id;
            groupInput.legend = this;
            L.DomEvent.on(groupInput, 'click', this._onGroupInputClick, groupInput);
            groupLabel.appendChild(groupInput);
          }
        }

        var groupName = document.createElement('span');
        groupName.className = 'leaflet-control-layers-group-name';
        groupName.innerHTML = obj.group.name;
        groupLabel.appendChild(groupName);

        groupContainer.appendChild(groupLabel);
        groupContainer.appendChild(groupList);
        container.appendChild(groupContainer);

        this._domGroups[obj.group.id] = groupContainer;
      }

      groupContainer.querySelector('.group-list').appendChild(itemWrapper);
    } else {
      this._baseLayersList.appendChild(itemWrapper);
    }
    return itemWrapper;
  },

  _onGroupInputClick: function () {
    var i, input, obj;

    var this_legend = this.legend;
    this_legend._handlingClick = true;

    var inputs = this_legend._form.getElementsByTagName('input');
    var inputsLen = inputs.length;

    for (i = 0; i < inputsLen; i++) {
      input = inputs[i];
      if (input.groupID === this.groupID && input.className === 'leaflet-control-layers-selector') {
        input.checked = this.checked;
        obj = this_legend._getLayer(input.layerId);
        if (input.checked && !this_legend._map.hasLayer(obj.layer)) {
          this_legend._map.addLayer(obj.layer);
        } else if (!input.checked && this_legend._map.hasLayer(obj.layer)) {
          this_legend._map.removeLayer(obj.layer);
        }
      }
    }

    this_legend._handlingClick = false;
  },

  _onInputClick: function () {
    var i, input, obj,
      inputs = this._form.getElementsByTagName('input'),
      inputsLen = inputs.length;

    this._handlingClick = true;

    for (i = 0; i < inputsLen; i++) {
      input = inputs[i];
      if (input.className === 'leaflet-control-layers-selector') {
        obj = this._getLayer(input.layerId);

        if (input.checked && !this._map.hasLayer(obj.layer)) {
          this._map.addLayer(obj.layer);
        } else if (!input.checked && this._map.hasLayer(obj.layer)) {
          this._map.removeLayer(obj.layer);
        }
      }
    }

    this._handlingClick = false;
  },

  _expand: function () {
    L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
  },

  _collapse: function () {
    this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');
  },

  _indexOf: function (arr, obj) {
    for (var i = 0, j = arr.length; i < j; i++) {
      if (arr[i] === obj) {
        return i;
      }
    }
    return -1;
  }
});

L.control.groupedLayers = function (baseLayers, groupedOverlays, options) {
  return new L.Control.GroupedLayers(baseLayers, groupedOverlays, options);
};