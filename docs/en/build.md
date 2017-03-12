# Build

## Development

We use Webpack HMR to develop Boostnote.
You can use following commands to use default configuration at the top of project directory.

Install requirement packages.

```
$ npm install
```

Build codes.

```
$ npm run webpack
```

After a few seconds, you will see this message.

```
webpack: bundle is now VALID.
```

Then, we have to run the app.
```
$ npm run hot
```
> Actually the app can be start with `npm start`. However, the app will use the compiled script.

By this, webpack will watch the code changes and apply it automatically.

> ### Notice
> There are some cases you have to refresh app yourself.
> 1. When editing constructor method of a component
> 2. When adding a new css class(same to 1: CSS class is re-written by each component. This process occurs at Constructor method.)

## Deploy

We use Grunt.
Acutal deploy can be run by `grunt`. However, you shouldn't use because the default task is including codesign and authenticode.

So, we prepare a script which just make an executable file.

```
grunt pre-build
```

You will find the executable from `dist`. In this case, auto updater won't work because the app isn't signed.

If you are necessary, you can do codesign or authenticode by this excutable.
