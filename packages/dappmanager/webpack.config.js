const path = require("path");
const webpack = require('webpack'); //to access built-in plugins
const { NODE_ENV = "production" } = process.env;
module.exports = {
  entry: "./src/index.ts",
  mode: NODE_ENV,
  target: "node",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "index.js"
  },
  // externals: [/node_modules/, "bufferutil", "utf-8-validate"],
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      electron: false
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ["ts-loader"]
      },
      {
        test: /\.node$/,
        loader: "node-loader"
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      WebSocket: 'ws',
      fetch: ['node-fetch', 'default'],
    }),
  ],
  optimization: {
    // Minimization does not provide great disk space savings, but reduces debug capacity
    minimize: false
  },
  devtool: "source-map"
};
