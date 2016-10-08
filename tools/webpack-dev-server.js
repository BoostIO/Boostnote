import webpackDevServer from 'webpack-dev-server';
import webpack from 'webpack';
import config from '../webpack.config.js'

const server = new webpackDevServer(webpack(config), {
  inline: true,
  hot: true
});
server.listen(8080, 'localhost');
