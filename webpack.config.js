const skeleton = require('./webpack-skeleton')
const path = require('path')

var config = Object.assign({}, skeleton, {
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel?cacheDirectory'
      },
      {
        test: /\.styl$/,
        exclude: /(node_modules|bower_components)/,
        loader:
          'style!css?modules&importLoaders=1&localIdentName=[name]__[local]___[path]!stylus?sourceMap'
      },
      {
        test: /\.json$/,
        loader: 'json'
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
  debug: true,
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    port: 8080,
    hot: true,
    inline: true,
    quiet: false,
    publicPath: 'http://localhost:8080/assets/'
  }
})

module.exports = config
