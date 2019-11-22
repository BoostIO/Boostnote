# How to debug Boostnote (Electron app)

Diese Seite ist auch verfügbar in [Japanisch](https://github.com/BoostIO/Boostnote/blob/master/docs/jp/debug.md), [Koreanisch](https://github.com/BoostIO/Boostnote/blob/master/docs/ko/debug.md), [Russisch](https://github.com/BoostIO/Boostnote/blob/master/docs/ru/debug.md), [Vereinfachtem Chinesisch](https://github.com/BoostIO/Boostnote/blob/master/docs/zh_CN/debug.md), [Französisch](https://github.com/BoostIO/Boostnote/blob/master/docs/fr/debug.md), [Portugiesisch](https://github.com/BoostIO/Boostnote/blob/master/docs/pt_BR/debug.md) und [Deutsch](https://github.com/BoostIO/Boostnote/blob/master/docs/de/debug.md).

Boostnote ist eine Electron App und basiert auf Chromium.

Zum Entwicklen verwendest du am Besten die `Developer Tools` von Google Chrome verwenden. Diese kannst du ganz einfach im unter dem Menüpunkt `View` mit `Toggle Developer Tools` aktivieren:

![how_to_toggle_devTools](https://cloud.githubusercontent.com/assets/11307908/24343585/162187e2-127c-11e7-9c01-23578db03ecf.png)

Die Anzeige der `Developer Tools` sieht in etwa so aus:

![Developer_Tools](https://cloud.githubusercontent.com/assets/11307908/24343545/eff9f3a6-127b-11e7-94cf-cb67bfda634a.png)

## Debugging

Fehlermeldungen werden in der Regel in der `console` ausgegeben, die du über den gleichnamigen Reiter der `Developer Tools` anzeigen lassen kannst. Zum Debuggen kannst du beispielsweise über den `debugger` Haltepunkte im Code setzen.

![debugger](https://cloud.githubusercontent.com/assets/11307908/24343879/9459efea-127d-11e7-9943-f60bf7f66d4a.png)

Du kannst aber natürlich auch die Art von Debugging verwenden mit der du am besten zurecht kommst.

## Referenz

- [Official document of Google Chrome about debugging](https://developer.chrome.com/devtools)

---

Special thanks: Translated by [gino909](https://github.com/gino909), [mdeuerlein](https://github.com/mdeuerlein)
