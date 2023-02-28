import path from "path";
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
  output: {
    path: paths.build,
    filename: "index.js",
    publicPath: ""
  },
  // externals: [/node_modules/, "bufferutil", "utf-8-validate"],
  externalsPresets: { node: true },
  target: "node18.13",
  // externals: [nodeExternals()],
  resolve: {
    extensions: [".ts", ".js"],
    extensionAlias: {
      ".js": [".ts", ".js"],
      ".cjs": [".cts", ".cjs"],
      ".mjs": [".mts", ".mjs"]
    },
    fallback: {
      electron: false
    }
  },
  stats: {
    errors: true,
    errorDetails: true
  },
  module: {
    rules: [
      {
        test: /\.([cm]?ts|tsx)$/,
        loader: "ts-loader",
        options: { allowTsInNodeModules: true }
      },
      {
        test: /\.node$/,
        loader: "node-loader"
      }
    ]
  },

  optimization: {
    // Minimization does not provide great disk space savings, but reduces debug capacity
    minimize: false
  },
  devtool: "source-map"
};
