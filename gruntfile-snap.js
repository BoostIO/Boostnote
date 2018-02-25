const path = require('path')
const ChildProcess = require('child_process')
const packager = require('electron-packager')

module.exports = function (grunt) {
  var initConfig = {
    pkg: grunt.file.readJSON('package.json')
  }
  grunt.initConfig(initConfig)
  grunt.loadNpmTasks('grunt-electron-installer')

  grunt.registerTask('compile', function () {
    var done = this.async()
    var execPath = path.join('node_modules', '.bin', 'webpack') + ' --config webpack-production.config.js'
    grunt.log.writeln(execPath)
    ChildProcess.exec(execPath,
      {
        env: Object.assign({}, process.env, {
          BABEL_ENV: 'production',
          NODE_ENV: 'production'
        })
      },
        function (err, stdout, stderr) {
          grunt.log.writeln(stdout)

          if (err) {
            grunt.log.writeln(err)
            grunt.log.writeln(stderr)
            done(false)
            return
          }
          done()
        }
    )
  })

  grunt.registerTask('pack', function () {
    grunt.log.writeln(path.join(__dirname, 'dist'))
    var done = this.async()
    var opts = {
      name: 'Boostnote',
      arch: 'x64',
      dir: __dirname,
      version: grunt.config.get('pkg.config.electron-version'),
      'app-version': grunt.config.get('pkg.version'),
      'app-bundle-id': 'com.maisin.boost',
      asar: false,
      prune: true,
      overwrite: true,
      out: path.join(__dirname, 'dist'),
      ignore: /node_modules\/ace-builds\/(?!src-min)|node_modules\/ace-builds\/(?=src-min-noconflict)|node_modules\/devicon\/icons|^\/browser|^\/secret|\.babelrc|\.gitignore|^\/\.gitmodules|^\/gruntfile|^\/readme.md|^\/webpack|^\/appdmg\.json|^\/node_modules\/grunt/,
      platform: 'linux',
      icon: path.join(__dirname, 'resources/app.icns'),
      'app-category-type': 'public.app-category.developer-tools'
    }

    packager(opts, function (err, appPath) {
      if (err) {
        grunt.log.writeln(err)
        done(err)
        return
      }
      done()
    })
  })

  grunt.registerTask('build', function () {
    grunt.task.run(['compile', 'pack'])
  })

  grunt.registerTask('default', ['build'])
}
