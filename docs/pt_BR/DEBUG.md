# Como debugar Boostnote (app Electron)

Esta página também está disponível em [Japônes](https://github.com/BoostIO/Boostnote/blob/master/docs/jp/debug.md), [Coreano](https://github.com/BoostIO/Boostnote/blob/master/docs/ko/debug.md), [Russo](https://github.com/BoostIO/Boostnote/blob/master/docs/ru/debug.md), [Chinês simplificado](https://github.com/BoostIO/Boostnote/blob/master/docs/zh_CN/debug.md), [Francês](https://github.com/BoostIO/Boostnote/blob/master/docs/fr/debug.md) e [Alemão](https://github.com/BoostIO/Boostnote/blob/master/docs/de/debug.md).

## Debugar com o Google Chrome developer Tools

Boostnote é um app Electron, por isso ele é baseado no Chromium; desenvolvedores podem usar o `Developer Tools` igual no Google Chrome.

Você pode habilitar e desabilitar o `Developer Tools` assim:
![how_to_toggle_devTools](https://cloud.githubusercontent.com/assets/11307908/24343585/162187e2-127c-11e7-9c01-23578db03ecf.png)

O `Developer Tools` deve parecer assim:
![Developer_Tools](https://cloud.githubusercontent.com/assets/11307908/24343545/eff9f3a6-127b-11e7-94cf-cb67bfda634a.png)

Quando erros acontecem, eles são apresentados na aba `console`.

### Debugando

Por exemplo, você pode usar o `debugger` para adicionar um _breakpoint_ (ponto de parada) no código dessa forma:

![debugger](https://cloud.githubusercontent.com/assets/11307908/24343879/9459efea-127d-11e7-9943-f60bf7f66d4a.png)

Isso é só um exemplo ilustrativo, mas você deve encontrar um jeito de debugar que encaixe no seu estilo.

### Referências

- [Documentação do Google Chrome sobre como debugar](https://developer.chrome.com/devtools)

## Debugar com o Visual Studio Code (VS Code)

1. Instale o plugin **[Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome 'Instale o pacote Debugger for Chrome')** para Visual Studio Code. Então reinicie-o.
2. Pressione **Shift+Command+B** ou execute **Run Build Task** do menu global **Terminal**, então seleciona a task **Build Boostnote**. Ou execute `yarn run watch` no terminal.
3. Quando a task acima estiver rodando, abra o **Debug view** na **Activity Bar** no lado do seu VS Code ou use o atalho **Shift+Command+D**.
4. Selecione a configuração **Boostnote All** no **Debug configuration**, então clique na seta verde ou aperte **F5** para começar a debugar.
5. Agora você deve encontrar seu **Boostnote** rodando. Você vai ver dois processos rodando, um com nome de **Boostnote Main** e outro com nome de **Boostnote Renderer**. Agora você pode adicionar os **debug breakpoints** no vscode. Se os seus **breakpoints** não forem alertados você pode precisar altenrar entre os processos **Boostnote Renderer** e **Boostnote Main**.

### Referências

- [Debugando uma aplicação Electron](https://electronjs.org/docs/tutorial/application-debugging)
- [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome)
