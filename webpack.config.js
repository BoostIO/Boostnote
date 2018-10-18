const skeleton = require('./webpack-skeleton')
const path = require('path')
const webpack = require('webpack')

var config = Object.assign({}, skeleton, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.styl$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: '[name]__[local]__[hash:base64:5]'
            }
          },
          {
            loader: 'stylus-loader',
            options: {
              sourceMap: true,
              use: [require('nib')()],
              import: [
                '~nib/lib/nib/index.styl',
                path.join(__dirname, 'browser/styles/index.styl')
              ]
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader',
            options: {
              modules: true,
              sourceMap: true
            }
          }
        ]
      },
      {
        type: 'javascript/auto',
        test: /\.mjs$/,
        use: []
      }
    ]
  },
  output: {
    path: path.join(__dirname, 'compiled'),
    filename: '[name].js',
    sourceMapFilename: '[name].map',
    libraryTarget: 'commonjs2',
    publicPath: 'http://localhost:8080/assets/'
  },
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    port: 8080,
    hot: true,
    inline: true,
    quiet: false,
    publicPath: 'http://localhost:8080/assets/'
  },
  plugins: [
    ...skeleton.plugins,
    new webpack.LoaderOptionsPlugin({
      debug: true
    })
  ]
})

module.exports = config

