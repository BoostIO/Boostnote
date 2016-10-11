import webpackDevServer from 'webpack-dev-server';
import webpack from 'webpack';
import config from '../webpack.config.js'


Object.keys(config.entry).map( (key) => {

  let entry = config.entry;
  entry[key] = ['webpack-dev-server/client?http://localhost:8080/',
    'webpack/hot/dev-server', entry[key]];
});
config.plugins.push(new webpack.HotModuleReplacementPlugin());

console.log(config);

const server = new webpackDevServer(webpack(config), {

  stats: 'error-only',
  publicPath: config.output.publicPath
});
server.listen(8080, 'localhost');
