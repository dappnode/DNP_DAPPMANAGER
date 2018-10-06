const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  target: 'node',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname),
    filename: 'server.bundle.js',
  },
  resolve: {
    modules: [
      path.resolve('./src'),
      'node_modules',
    ],
  },
  node: {
    fs: 'empty',
    child_process: 'empty',
    net: 'empty',
  },
  mode: 'production',
  plugins: [
    new webpack.IgnorePlugin(/vertx/),
    // new BundleAnalyzerPlugin(),
  ],
};
