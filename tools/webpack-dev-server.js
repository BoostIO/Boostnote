import webpackDevServer from 'webpack-dev-server';
import webpack from 'webpack';
import config from '../webpack.config.js'
import ProgressBarPlugin from 'progress-bar-webpack-plugin';


Object.keys(config.entry).map( (key) => {

  let entry = config.entry;
  entry[key] = ['webpack-dev-server/client?http://localhost:8080/',
    'webpack/hot/dev-server', entry[key]];
});
config.plugins.push(new webpack.HotModuleReplacementPlugin());
config.plugins.push(new ProgressBarPlugin());

console.log(config);

const server = new webpackDevServer(webpack(config), {

  stats: 'error-only',
  publicPath: config.output.publicPath
});
server.listen(8080, 'localhost');
