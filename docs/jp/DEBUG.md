# Boostnote(electronアプリケーション)のデバッグ方法について
Boostnoteを作っているelectronはChromiumからできており、開発者は `Developer Tools`をGoogle Chromeと同じように使うことができます。

Developer Toolsの切り替え方法はこちらです:
![how_to_toggle_devTools](https://cloud.githubusercontent.com/assets/11307908/24343585/162187e2-127c-11e7-9c01-23578db03ecf.png)

実際のデベロッパーツールはこちらです:
![Developer_Tools](https://cloud.githubusercontent.com/assets/11307908/24343545/eff9f3a6-127b-11e7-94cf-cb67bfda634a.png)

何かエラーが起きた場合 `console`にエラーメッセージが表示されます。

## デバッグ
例えば、 `debugger`をコード中にブレークポイントとして挟む方法があります。

![debugger](https://cloud.githubusercontent.com/assets/11307908/24343879/9459efea-127d-11e7-9943-f60bf7f66d4a.png)

ですがこれは一例にしか過ぎません。最もあなたに合うデバッグ方法を見つけた方がいいでしょう。

## 参考
* [デバッグに関するGoogle Chromeの公式ドキュメント](https://developer.chrome.com/devtools)
