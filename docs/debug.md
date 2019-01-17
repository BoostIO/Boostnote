# How to debug Boostnote (Electron app)

This page is also available in [Japanese](https://github.com/BoostIO/Boostnote/blob/master/docs/jp/debug.md), [Korean](https://github.com/BoostIO/Boostnote/blob/master/docs/ko/debug.md), [Russain](https://github.com/BoostIO/Boostnote/blob/master/docs/ru/debug.md), [Simplified Chinese](https://github.com/BoostIO/Boostnote/blob/master/docs/zh_CN/debug.md), [French](https://github.com/BoostIO/Boostnote/blob/master/docs/fr/debug.md), [Portuguese](https://github.com/BoostIO/Boostnote/blob/master/docs/pt_BR/debug.md) and [German](https://github.com/BoostIO/Boostnote/blob/master/docs/de/debug.md).

## Debug with Google Chrome developer Tools

Boostnote is an Electron app so it's based on Chromium; developers can use `Developer Tools` just like Google Chrome.

You can toggle the `Developer Tools` like this:
![how_to_toggle_devTools](https://cloud.githubusercontent.com/assets/11307908/24343585/162187e2-127c-11e7-9c01-23578db03ecf.png)

The `Developer Tools` will look like this:
![Developer_Tools](https://cloud.githubusercontent.com/assets/11307908/24343545/eff9f3a6-127b-11e7-94cf-cb67bfda634a.png)

When errors occur, the error messages are displayed at the `console`.

### Debugging

For example, you can use the `debugger` to set a breakpoint in the code like this:

![debugger](https://cloud.githubusercontent.com/assets/11307908/24343879/9459efea-127d-11e7-9943-f60bf7f66d4a.png)

This is just an illustrative example, you should find a way to debug which fits your style.

### References

- [Official document of Google Chrome about debugging](https://developer.chrome.com/devtools)

## Debug with Visual Studio Code

1. Install **[Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome 'Install Debugger for Chrome')** plugin for Visual Studio Code. Then restart it.
2. Pressing **Shift+Command+B** or running **Run Build Task** from the global **Terminal** menu, then pick the task named **Build Boostnote**. Or run `yarn run watch` from the terminal.
3. When above task is running, open **Debug view** in **Activity Bar** on the side of VS Code or use shortcut **Shift+Command+D**.
4. Select the configuration named **Boostnote All** from the **Debug configuration**, then click the green arrow button or press **F5** to start debugging.
5. Now you should find **Boostnote** is running. You will see two processes running, one named **Boostnote Main** and the other named **Boostnote Renderer**. Now you can set **debug breakpoints** in vscode. If you find your **breakpoints** is unverified, you need to switch to the appropriate process between **Boostnote Renderer** and **Boostnote Main**.

   ### References

   - [Electron application debugging](https://electronjs.org/docs/tutorial/application-debugging)
   - [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome)
