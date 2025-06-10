//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const fs = require('fs');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  mode: 'none',   // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: './src/extension.ts', // the entry point of this extension
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode' // Exclude the vscode module
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      bufferutil: false,
      'utf-8-validate': false,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: 'log',
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^bufferutil$|^utf-8-validate$/,
    }),
  ]
};

module.exports = [extensionConfig];