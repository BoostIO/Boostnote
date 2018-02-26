# Comment débugger Boostnote (Application Electron)
Cette page est également disponible en [Angalis](https://github.com/BoostIO/Boostnote/blob/master/docs/debug.md), [Japonais](https://github.com/BoostIO/Boostnote/blob/master/docs/jp/debug.md), [Coréen](https://github.com/BoostIO/Boostnote/blob/master/docs/ko/debug.md), [Russe](https://github.com/BoostIO/Boostnote/blob/master/docs/ru/debug.md), [Chinois Simplifié](https://github.com/BoostIO/Boostnote/blob/master/docs/zh_CN/debug.md) et en [Allemand](https://github.com/BoostIO/Boostnote/blob/master/docs/de/debug.md)

Boostnote est une application Electron donc basée sur Chromium. Il est possible d'utiliser les `Developer Tools` comme dans Google Chrome.

Vous pouvez utiliser les `Developer Tools` de la façon suivante :
![how_to_toggle_devTools](https://cloud.githubusercontent.com/assets/11307908/24343585/162187e2-127c-11e7-9c01-23578db03ecf.png)

Les `Developer Tools` ressemblent à ça :
![Developer_Tools](https://cloud.githubusercontent.com/assets/11307908/24343545/eff9f3a6-127b-11e7-94cf-cb67bfda634a.png)

Quand une erreur arrive, les messages d'erreurs sont affichés dans la `console`.

## Debugging
Par exemple, vous pouvez utiliser le `debugger` pour placer un point d'arrêt dans le code de la façon suivante:

![debugger](https://cloud.githubusercontent.com/assets/11307908/24343879/9459efea-127d-11e7-9943-f60bf7f66d4a.png)

C'est une façon comme une autre de faire, vous pouvez trouver une façon de débugger que vous trouverez plus adaptée.

## Références
* [Documentation officiel de Google Chrome sur le debugging](https://developer.chrome.com/devtools)
