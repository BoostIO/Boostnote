const skeleton = require('./webpack-skeleton')
const webpack = require('webpack')
const path = require('path')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')

var config = Object.assign({}, skeleton, {
  mode: 'production',
  module: {
    rules: [
      {
        test: /(\.js|\.jsx)?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader'
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
      }
    ]
  },
  output: {
    path: path.join(__dirname, 'compiled'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    sourceMapFilename: '[name].map',
    publicPath: 'http://localhost:8080/assets/'
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new NodeTargetPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production'),
        'BABEL_ENV': JSON.stringify('production')
      }
    })
  ]
})

module.exports = config
