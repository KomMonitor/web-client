import * as L from 'leaflet';

/**
 * Grayscale tile layer, formerly defined inline in KommonitorMapComponent.ngOnInit
 * (map refactoring plan, Phase 4). Renders each loaded tile onto a canvas and
 * converts the pixels to grayscale using configurable channel quotas.
 */
const GrayscaleTileLayer = (L.TileLayer as any).extend({
  options: {
    quotaRed: 21,
    quotaGreen: 71,
    quotaBlue: 8,
    quotaDividerTune: 0,
    quotaDivider: function () {
      return this.quotaRed + this.quotaGreen + this.quotaBlue + this.quotaDividerTune;
    },
  },

  initialize: function (url, options) {
    options = options || {};
    options.crossOrigin = true;
    (L.TileLayer as any).prototype.initialize.call(this, url, options);

    this.on('tileload', (e) => {
      this._makeGrayscale(e.tile);
    });
  },

  _createTile: function () {
    const tile = (L.TileLayer as any).prototype._createTile.call(this);
    tile.crossOrigin = 'Anonymous';
    return tile;
  },

  _makeGrayscale: function (img) {
    if (img.getAttribute('data-grayscaled')) return;

    img.crossOrigin = '';
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx!.drawImage(img, 0, 0);

    const imgd = ctx!.getImageData(0, 0, canvas.width, canvas.height);
    const pix = imgd.data;
    for (let i = 0, n = pix.length; i < n; i += 4) {
      pix[i] =
        pix[i + 1] =
        pix[i + 2] =
          (this.options.quotaRed * pix[i] +
            this.options.quotaGreen * pix[i + 1] +
            this.options.quotaBlue * pix[i + 2]) /
          this.options.quotaDivider();
    }
    ctx!.putImageData(imgd, 0, 0);
    img.setAttribute('data-grayscaled', true);
    img.src = canvas.toDataURL();
  },
});

export function createGrayscaleTileLayer(url: string, options?: any): any {
  return new GrayscaleTileLayer(url, options);
}
