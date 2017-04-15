# Build

## Development

We use Webpack HMR to develop Boostnote.
You can use following commands to use default configuration at the top of project directory.

Install requirement packages.

```
$ yarn
```

Build codes and run.

```
$ yarn run dev-start
```

This command runs `yarn run webpack` and `yarn run hot` in parallel. It means it is the same thing to run those commands in 2 terminals.

And webpack will watch the code changes and apply it automatically.

If this error: `Failed to load resource: net::ERR_CONNECTION_REFUSED` happens, please reload Boostnote.

![net::ERR_CONNECTION_REFUSED](https://cloud.githubusercontent.com/assets/11307908/24343004/081e66ae-1279-11e7-8d9e-7f478043d835.png)

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
