const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      }
    ]
  },

  resolve: {
    modules: [path.resolve(__dirname, "src"), "node_modules"],
    alias: {
      style: path.resolve(__dirname, "style")
    },
    extensions: [".js", ".jsx"]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html",
      filename: "index.html"
    }),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
        "React": "react",
    })
  ],

  devServer: {
    host: "localhost",
    port: 4000,
    hot: true,
  },

  devtool: "source-map",

  entry: "./src/index.jsx"
};
