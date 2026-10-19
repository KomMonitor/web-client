((L.TileLayer.BetterWMS = L.TileLayer.WMS.extend({
  onAdd: function (t) {
    (L.TileLayer.WMS.prototype.onAdd.call(this, t), t.on('click', this.getFeatureInfo, this));
  },
  onRemove: function (t) {
    (L.TileLayer.WMS.prototype.onRemove.call(this, t), t.off('click', this.getFeatureInfo, this));
  },
  getFeatureInfo: function (t) {
    var e = this.getFeatureInfoUrl(t.latlng),
      s = L.Util.bind(this.showGetFeatureInfo, this);
    $.ajax({
      url: e,
      success: function (e, r, a) {
        s('string' == typeof e ? null : e, t.latlng, e);
      },
      error: function (t, e, r) {
        s(r);
      },
    });
  },
  getFeatureInfoUrl: function (t) {
    var e = this._map.latLngToContainerPoint(t, this._map.getZoom()),
      s = this._map.getSize(),
      r = {
        request: 'GetFeatureInfo',
        service: 'WMS',
        srs: 'EPSG:4326',
        styles: this.wmsParams.styles,
        transparent: this.wmsParams.transparent,
        version: this.wmsParams.version,
        format: this.wmsParams.format,
        bbox: this._map.getBounds().toBBoxString(),
        height: s.y,
        width: s.x,
        layers: this.wmsParams.layers,
        query_layers: this.wmsParams.layers,
        info_format: 'text/html',
      };
    ((r['1.3.0' === r.version ? 'i' : 'x'] = e.x), (r['1.3.0' === r.version ? 'j' : 'y'] = e.y));
    var a = this._url + L.Util.getParamString(r, this._url, !0);
    return (
      void 0 !== this.wmsParams.proxy &&
        (void 0 !== this.wmsParams.proxyParamName && (this.wmsParams.proxyParamName = 'url'),
        (_proxy = this.wmsParams.proxy + '?' + this.wmsParams.proxyParamName + '='),
        (a = _proxy + encodeURIComponent(a))),
      a
    );
  },
  showGetFeatureInfo: function (t, e, s) {
    t
      ? console.log(t)
      : null != s &&
        null != s &&
        '' != s &&
        L.popup({ maxWidth: 800, className: 'wms-popup' })
          .setLatLng(e)
          .setContent(s)
          .openOn(this._map);
  },
})),
  (L.tileLayer.betterWms = function (t, e) {
    return new L.TileLayer.BetterWMS(t, e);
  }));
