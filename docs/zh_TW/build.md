# 編譯

此文件還提供下列的語言 [日文](https://github.com/BoostIO/Boostnote/blob/master/docs/jp/build.md), [韓文](https://github.com/BoostIO/Boostnote/blob/master/docs/ko/build.md), [俄文](https://github.com/BoostIO/Boostnote/blob/master/docs/ru/build.md), [簡體中文](https://github.com/BoostIO/Boostnote/blob/master/docs/zh_CN/build.md), [法文](https://github.com/BoostIO/Boostnote/blob/master/docs/fr/build.md), [葡萄牙](https://github.com/BoostIO/Boostnote/blob/master/docs/pt_BR/build.md) and [德文](https://github.com/BoostIO/Boostnote/blob/master/docs/de/build.md).

## 環境

- npm: 6.x
- node: 8.x

## 開發

我們使用 Webpack HMR 來開發 Boostnote。
在專案根目錄底下執行下列指令，將會以原始設置啟動 Boostnote。

**用 yarn 來安裝必要 packages**

```bash
$ yarn
```

**編譯及執行**

```
$ yarn run dev
```

> ### 注意
>
> 以下是一些可能要手動重新啟動程式的情況。
>
> 1. 修改一個 component 的 constructor 方法時。
> 2. 新增新的 CSS 類別時 (和 1 很類似：CSS 類別會被每個 component 重寫過。這個過程在 constructor 方法中發生)。

## 使用 Pull Requests 中的程式碼
瀏覽 pull request 的頁面，從 URL 的後面找到 PR 號碼。

<pre>
https://github.com/BoostIO/Boostnote/pull/2794
</pre>
接著，於底下步驟中把 \<PR> 換成這個號碼 (沒有括號)。
請將下方 URL 中的 \<PR> 換置成 2794。

_如果您還未取得一份 master branch 的本地備份_
```
git clone https://github.com/BoostIO/Boostnote.git
cd Boostnote
git fetch origin pull/<PR>/head:<PR>
git checkout <PR>
```

_如果您已經擁有了 master branch_
```
git fetch origin pull/<PR>/head:<PR>
git checkout <PR>
```

_編譯及執行程式碼_
```
yarn
yarn run dev
```

## 佈署

我們用 Grunt 做自動佈署。
您能使用 `grung` 建構本程式。然而，我們並不建議這麼做，因為預設工作流程包含了程式簽名以及 Authenticode 驗證。

所以，我們準備了一份額外的腳本用於建構可執行檔。

```
grunt pre-build
```

您可以在 `dist` 資料夾下找到可執行檔。注意，自動更新功能 (auto updater) 並不會生效，因為程式沒有被簽署過。

必要時您可以使用程式簽名或 authenticode 驗證執行檔。

## 建立您自己的發行版套件 (deb, rpm)

發行版套件可以透過在 Linux 平台上 (如 Ubuntu, Fedora) 執行 `grunt build` 來建立。

> 注意：您可以在同個環境中同時建立 `.deb` 及`.rpm` 。

安裝支援版本的 `node` 和 `npm` 後，安裝編譯相依套件。

```
$ yarn add --dev grunt-electron-installer-debian grunt-electron-installer-redhat
```

Ubuntu/Debian:

```
$ sudo apt-get install -y rpm fakeroot
```

Fedora:

```
$ sudo dnf install -y dpkg dpkg-dev rpm-build fakeroot
```

接著執行 `grunt build`。

```
$ grunt build
```

> 於 `dist` 資料夾下找到 `.deb` 及 `.rpm`。
