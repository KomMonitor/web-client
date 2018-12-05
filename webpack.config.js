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
          { from: nodeModulePathConstant + 'leaflet/dist', to: 'leaflet/' }
      ])
    ]
};
