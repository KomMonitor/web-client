const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const nodeModulePathConstant = './node_modules/';

module.exports = {
    entry: {
        app: "./app/app.js",
    },
    output: {
        path: __dirname + "/app/dependencies",
        filename: "[name].bundle.js"
    },
    plugins: [
      new CopyWebpackPlugin([
          { from: nodeModulePathConstant + 'bootstrap/dist', to: 'bootstrap/' },
          { from: nodeModulePathConstant + 'leaflet/dist', to: 'leaflet/' },
          { from: './customizedExternalLibs/Leaflet.StyledLayerControl-master/src/styledLayerControl.js', to: 'styledLayerControl/styledLayerControl_custom.js' },
          { from: './customizedExternalLibs/Leaflet.StyledLayerControl-master/css', to: 'styledLayerControl/css/' },
          { from: nodeModulePathConstant + 'rangeslide.js/dist', to: 'rangeslide/' },
          { from: nodeModulePathConstant + '@fortawesome/fontawesome-free', to: 'fontawesome/' },
          { from: nodeModulePathConstant + 'font-awesome/', to: 'fontawesome-4.7.0/' },
          { from: nodeModulePathConstant + 'file-saverjs/FileSaver.min.js', to: 'file-saverjs/FileSaver.min.js' },
          { from: nodeModulePathConstant + 'js-xlsx/dist/xlsx.full.min.js', to: 'js-xlsx/xlsx.full.min.js' },
          { from: nodeModulePathConstant + 'tableexport/dist', to: 'tableexport' },
          { from: nodeModulePathConstant + 'leaflet-draw/dist', to: 'leaflet-draw/' },
          { from: nodeModulePathConstant + 'jquery/dist', to: 'jquery/' },
          { from: nodeModulePathConstant + 'angular/angular.min.js', to: 'angular/angular.min.js' },
          { from: nodeModulePathConstant + 'angular-route/angular-route.min.js', to: 'angular-route/angular-route.min.js' },
          { from: nodeModulePathConstant + 'classybrew/build/classybrew.min.js', to: 'classybrew/classybrew.min.js' },
          { from: nodeModulePathConstant + 'echarts/dist/echarts.min.js', to: 'echarts/echarts.min.js' },
          { from: './customizedExternalLibs/ecStat.min.js', to: 'echarts/ecStat.min.js' },
          { from: nodeModulePathConstant + 'ion-rangeslider/css/ion.rangeSlider.min.css', to: 'ion-rangeslider' },
          { from: nodeModulePathConstant + 'ion-rangeslider/js/ion.rangeSlider.min.js', to: 'ion-rangeslider' },
          { from: nodeModulePathConstant + 'leaflet.markercluster/dist/leaflet.markercluster.js', to: 'leaflet-markercluster' },
          { from: nodeModulePathConstant + 'leaflet.markercluster/dist/MarkerCluster.css', to: 'leaflet-markercluster' },
          { from: nodeModulePathConstant + 'leaflet.markercluster/dist/MarkerCluster.Default.css', to: 'leaflet-markercluster' },
          { from: nodeModulePathConstant + 'leaflet.awesome-markers/dist', to: 'leaflet-awesome-markers' },
          { from: './customizedExternalLibs/leaflet-groupedlayercontrol/leaflet.groupedlayercontrol.js', to: 'leaflet-groupedlayercontrol' },
          { from: './customizedExternalLibs/leaflet-groupedlayercontrol/leaflet.groupedlayercontrol.min.css', to: 'leaflet-groupedlayercontrol' },
          { from: nodeModulePathConstant + '@turf/turf/turf.min.js', to: 'turf' },
          { from: nodeModulePathConstant + 'bootstrap-tour/build/css/bootstrap-tour.min.css', to: 'bootstrap-tour' },
          { from: nodeModulePathConstant + 'bootstrap-tour/build/js/bootstrap-tour.min.js', to: 'bootstrap-tour' },
          { from: nodeModulePathConstant + 'jspdf/dist/jspdf.min.js', to: 'jspdf' },
          { from: nodeModulePathConstant + 'jspdf-autotable/dist/jspdf.plugin.autotable.min.js', to: 'jspdf-autotable' },
          { from: './customizedExternalLibs/shpwrite.js', to: 'shp-write' },
          { from: nodeModulePathConstant + 'jstat/dist/jstat.min.js', to: 'jstat' },
          { from: nodeModulePathConstant + 'leaflet.pattern/dist/leaflet.pattern.js', to: 'leaflet-pattern' },
          { from: nodeModulePathConstant + 'admin-lte/dist/js/adminlte.min.js', to: 'admin-lte/js/adminlte.min.js' },
          { from: nodeModulePathConstant + 'admin-lte/dist/css', to: 'admin-lte/css' },
          { from: nodeModulePathConstant + 'fastclick/lib/fastclick.js', to: 'fastclick' },
          { from: nodeModulePathConstant + 'jquery-slimscroll/jquery.slimscroll.min.js', to: 'jquery-slimscroll' },
          { from: nodeModulePathConstant + 'ionicons/dist', to: 'ionicons' },
          { from: nodeModulePathConstant + 'angular-sanitize/angular-sanitize.min.js', to: 'angular-sanitize' },
          { from: nodeModulePathConstant + 'bootstrap-validator/dist/validator.min.js', to: 'bootstrap-validator' },
          { from: nodeModulePathConstant + 'leaflet-geosearch/dist/bundle.min.js', to: 'leaflet-geosearch/leaflet-geosearch.min.js' },
          { from: nodeModulePathConstant + 'leaflet-geosearch/dist/style.css', to: 'leaflet-geosearch/leaflet-geosearch.css' },
          { from: nodeModulePathConstant + 'leaflet-geosearch/assets/css/leaflet.css', to: 'leaflet-geosearch/leaflet-geosearch-leaflet.css' },
          { from: nodeModulePathConstant + 'leaflet-search/dist/', to: 'leaflet-search/dist' },
          { from: nodeModulePathConstant + 'leaflet-search/images/', to: 'leaflet-search/images' },
          { from: nodeModulePathConstant + 'leaflet-measure/dist/leaflet-measure.de.js', to: 'leaflet-measure' },
          { from: nodeModulePathConstant + 'leaflet-measure/dist/leaflet-measure.css', to: 'leaflet-measure' },
          { from: nodeModulePathConstant + 'leaflet-measure/dist/assets', to: 'leaflet-measure/assets' },
          { from: nodeModulePathConstant + 'leaflet-easyprint/dist/bundle.js', to: 'leaflet-easyprint/leaflet-easyprint.js' },
          { from: './customizedExternalLibs/leaflet-wfst.src_custom.js', to: 'leaflet-wfst/' },
          { from: nodeModulePathConstant + 'bootstrap-colorpicker/dist', to: 'bootstrap-colorpicker/' },
          { from: './customizedExternalLibs/L.TileLayer.BetterWMS.js', to: 'leaflet-betterWMS/' },
          { from: nodeModulePathConstant + 'babel-polyfill/dist/polyfill.min.js', to: 'babel-polyfill/' },
          { from: nodeModulePathConstant + 'shpjs/dist/', to: 'shpjs/' }
      ])
    ]
};
