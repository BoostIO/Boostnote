# Build

Diese Seite ist auch verfügbar in [Japanisch](https://github.com/BoostIO/Boostnote/blob/master/docs/jp/build.md), [Koreanisch](https://github.com/BoostIO/Boostnote/blob/master/docs/ko/build.md), [Russisch](https://github.com/BoostIO/Boostnote/blob/master/docs/ru/build.md), [Vereinfachtem Chinesisch](https://github.com/BoostIO/Boostnote/blob/master/docs/zh_CN/build.md), [Französisch](https://github.com/BoostIO/Boostnote/blob/master/docs/fr/build.md), [Portugiesisch](https://github.com/BoostIO/Boostnote/blob/master/docs/pt_BR/build.md) und [Deutsch](https://github.com/BoostIO/Boostnote/blob/master/docs/de/build.md).

## Umgebungen

- npm: 6.x
- node: 8.x

## Entwicklung

Wir verwenden Webpack HMR für die Entwicklung von Boostnote.
Durch Ausführen der folgenden Befehle, im root Verzeichnis des Projektes, wird Boostnote mit der Default Konfiguration gestartet.

Installiere die nötigen Pakete unter Verwendung von yarn.

```
$ yarn
```

Bauen und Ausführen.

```
$ yarn run dev
```

> ### Notiz
>
> Es gibt einige Fälle bei denen die App manuell zu refreshen ist.
>
> 1. Wenn eine "constructor method" einer Komponente manuell editiert wird.
> 2. Wenn eine neue CSS Klasse ergänzt wird (ähnlich wie 1: die CSS Klasse wird von jeder Komponenete neu geschrieben. Dieser Prozess passiert in der "Constructor method".)

## Deploy

Wir verwenden Grunt um das Deployment zu automatisieren.
Du kannst das Programm unter Verwendung von `grunt` bauen. Jedoch empfehlen wir das nicht denn der default task beinhaltet codesign und authenticode.

Deshalb haben wir ein separates Script vorbereitet welches eine ausführbare Datei erstellt.

```
grunt pre-build
```

Du findest die ausführbare Datein in dem Verzeichnis `dist`. Beachte, der auto updater funktioniert nicht da die app nicht signiert ist.

Wenn du es für notwendig erachtest, kannst du codesign or authenticode mit dieser ausführbaren Datei verwenden.

## Erstelle eigene Distributions Pakete (deb, rpm)

Distributions Pakete können mittels `grunt build` auf Linux Plattformen (e.g. Ubuntu, Fedora) erstellt werden.

> Beachte: Du kannst bei `.deb` and `.rpm` in der selben Umgebung erstellen.

Nach der Installation der supporteten Version von `node` and `npm`, installiere auch build dependency packages.

Ubuntu/Debian:

```
$ sudo apt-get install -y rpm fakeroot
```

Fedora:

```
$ sudo dnf install -y dpkg dpkg-dev rpm-build fakeroot
```

Dann führe `grunt build` aus.

```
$ grunt build
```

Du findest nun die `.deb` undd `.rpm` Pakete in dem `dist` Ordner.

---

Special thanks: Translated by [gino909](https://github.com/gino909)
