import path from "path";
import webpack from "webpack";
import { fileURLToPath } from "url";
const { NODE_ENV = "production" } = process.env;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const paths = {
  // Source files
  src: path.resolve(__dirname, "./src"),
  // Production build files
  build: path.resolve(__dirname, "./build")
};

export default {
  entry: paths.src + "/index.ts",
  mode: NODE_ENV,
  target: "node",
  output: {
    path: paths.build,
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
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        }
      },
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
      WebSocket: "ws",
      fetch: ["node-fetch", "default"]
    })
  ],
  optimization: {
    // Minimization does not provide great disk space savings, but reduces debug capacity
    minimize: false
  },
  devtool: "source-map"
};
