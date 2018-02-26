# Build
Cette page est également disponible en [Angalis](https://github.com/BoostIO/Boostnote/blob/master/docs/build.md), [Japonais](https://github.com/BoostIO/Boostnote/blob/master/docs/jp/build.md), [Coréen](https://github.com/BoostIO/Boostnote/blob/master/docs/ko/build.md), [Russe](https://github.com/BoostIO/Boostnote/blob/master/docs/ru/build.md), [Chinois Simplifié](https://github.com/BoostIO/Boostnote/blob/master/docs/zh_CN/build.md) et en [Allemand](https://github.com/BoostIO/Boostnote/blob/master/docs/de/build.md)

## Environnements
* npm: 4.x
* node: 7.x

Il est conseillé d'utiliser `npm v4.x` car `$ grunt pre-build` ne marche pas sur la `v5.x`.

## Développement

Webpack HMR est utilisé pour développer Boostnote.
En utilisant les commandes suivantes à la racine du projet, cela va démarrer Boostnote avec les configurations par défaut.

Installez les paquets requis à l'aide de `yarn`.

```
$ yarn
```
Build et start

```
$ yarn run dev-start
```

Cette commande lance `yarn run webpack` et `yarn run hot` en parallèle. Cela revient au même que si on utilisait ces deux commandes dans 2 terminaux.

La commande `webpack` va surveiller les changements de code et les appliquer automatiquement.

Si l'erreur suivante apparait : `Failed to load resource: net::ERR_CONNECTION_REFUSED`, relancez Boostnote.

![net::ERR_CONNECTION_REFUSED](https://cloud.githubusercontent.com/assets/11307908/24343004/081e66ae-1279-11e7-8d9e-7f478043d835.png)

> ### Notice
> Il y a certains cas où vous voudrez relancer l'application manuellement.
> 1. Quand vous éditez la méthode constructeur dans un composant
> 2. Quand vous ajoutez une nouvelle classe css. (Comme pour 1: la classe est réécrite pour chaque composant. Le process intervient dans la méthode constructeur)

## Déploiement

On utilise Grunt pour le déploiement automatique.
Vous pouvez build le programme en utilisant `grunt`. Cependant, nous ne recommandons pas cette méthode car la task par défaut inclut codesign et authenticode.

Nous avons donc préparé un script séparé qui va rendre un fichier exécutable.

Le build ne fonctionne pas sur `npm v5.3.0`. Il faut donc utiliser `npm v5.2.0` quand vous faites le build.

```
grunt pre-build
```
Vous trouverez l'exécutable dans le dossier `dist`.
Note : l'auto updater ne marchera pas car l'application n'est pas signée.

Si vous trouvez ça nécessaire, vous pouvez utiliser codesign ou authenticode avec cet exécutable.

## Faire un paquet (deb, rpm)

Les paquets sont créés en exécutant `grunt build` sur une plateforme Linux (e.g. Ubuntu, Fedora).

> Note: Vous pouvez créer à la fois un `.deb` et un `.rpm` dans un seul et même environnement.

Après avoir installé la version supportée de `node` et de `npm`, installer les paquets de builds.


Ubuntu/Debian:

```
$ sudo apt-get install -y rpm fakeroot
```

Fedora:

```
$ sudo dnf install -y dpkg dpkg-dev rpm-build fakeroot
```

Puis exécutez `grunt build`.

```
$ grunt build
```

Vous trouverez le `.deb` et le `.rpm` dans le dossier `dist`.
